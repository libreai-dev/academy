/**
 * Logic for the "GPU or CPU?" lesson — how a neural network runs on hardware.
 * Three interactives share this file; the numbers are deliberate teaching toys,
 * not benchmarks (a real GPU has ~16,000 cores, not "the whole grid at once").
 *
 * 1) THE MATRIX-MULTIPLY RACE. A layer is a matrix multiply — one output cell
 *    per dot product, every cell independent. The CPU does one cell per step;
 *    the GPU does them all in one step. `raceSteps` returns both counts.
 *
 * 2) INSIDE A RACK. GPUs sit 4-to-a-node (real nodes hold 8), nodes sit in
 *    racks. Same-node traffic rides NVLink (fast); crossing nodes/racks rides
 *    the InfiniBand fabric (slow). `RACK_PATHS` describes the three journeys.
 *
 * 3) SPLIT THE MODEL. Data / tensor / pipeline parallel each map a model onto
 *    4 GPUs differently. `gpuLayout` returns, per GPU, what it holds and the
 *    communication arrows to draw.
 */

/* ── 1. Running a neural network — layer by layer, CPU vs GPU ───────────────── */

export const RACE_INPUT = 4; //   input neurons
export const RACE_OUTPUT = 3; //  output neurons
/** Selectable width of each hidden layer (neurons). Two hidden layers + the
 *  output layer = three computed layers, whatever the width. */
export const RACE_WIDTHS = [3, 4, 6, 8];

/** The network's shape at a given hidden width: [inputs, hidden, hidden, out]. */
export function netLayers(width: number): number[] {
  return [RACE_INPUT, width, width, RACE_OUTPUT];
}

export interface NetStats {
  layers: number[];
  computedLayers: number; // layers the machine actually computes (all but the input)
  neurons: number; //       computed neurons (a CPU does one per step)
  params: number; //        weights + biases across the whole network
  cpuSteps: number; //      neurons — the CPU walks them one at a time
  gpuSteps: number; //      computed layers — the GPU does a whole layer per step
  speedup: number; //       cpuSteps / gpuSteps, rounded
}

/** Everything the race needs: how big the network is, and how many steps each
 *  machine takes. The GPU parallelises *within* a layer (every neuron there is
 *  an independent dot product) but still runs the layers in order — layer L
 *  needs layer L−1's outputs first. So the GPU's step count is the layer count,
 *  while the CPU's is the neuron count. */
export function netStats(width: number): NetStats {
  const layers = netLayers(width);
  let params = 0;
  let neurons = 0;
  for (let i = 1; i < layers.length; i++) {
    params += layers[i - 1] * layers[i] + layers[i]; // weights + biases
    neurons += layers[i];
  }
  const computedLayers = layers.length - 1;
  return {
    layers,
    computedLayers,
    neurons,
    params,
    cpuSteps: neurons,
    gpuSteps: computedLayers,
    speedup: Math.round(neurons / computedLayers),
  };
}

/** Per-neuron timing (ms) that drives the live race — kept slow enough to
 *  watch. The CPU pays for every neuron; the GPU pays once per layer. */
export const CPU_STEP_MS = 340;
export const GPU_STEP_MS = 800;

/** How many cores each processor die shows (a teaching count — a real GPU has
 *  ~16,000). The CPU works ~one neuron at a time; the GPU lights a whole
 *  layer's worth of cores together. */
export const CPU_CORES = 6;
export const CPU_CORE_COLS = 6;
export const GPU_CORES = 48;
export const GPU_CORE_COLS = 12;

/** Locate the computed neuron with global processing order `order`: which layer
 *  it lives in, its index there, and how many terms its dot product sums (the
 *  width of the previous layer). */
export function neuronInfo(order: number, layers: number[]): { layer: number; idxInLayer: number; terms: number } | null {
  let acc = 0;
  for (let L = 1; L < layers.length; L++) {
    if (order < acc + layers[L]) return { layer: L, idxInLayer: order - acc, terms: layers[L - 1] };
    acc += layers[L];
  }
  return null;
}

/* ── 2. Inside a rack ──────────────────────────────────────────────────────── */

export const RACKS = 2;
export const NODES_PER_RACK = 2;
export const GPUS_PER_NODE = 4; //  a real node holds 8; 4 keeps the diagram legible

export type GpuAddr = { rack: number; node: number; gpu: number };
export type LinkKind = "nvlink" | "infiniband";

export interface RackPath {
  from: GpuAddr;
  to: GpuAddr;
  link: LinkKind;
  bwGBs: number; //   bandwidth, GB/s
  hops: number; //    switches/links crossed
  relTime: number; // travel time relative to a same-node hop (=1)
}

/** The three journeys, in the order of `rackPaths` copy: same node, across
 *  nodes (same rack), across racks. Numbers are round teaching figures. */
export const RACK_PATHS: RackPath[] = [
  { from: { rack: 0, node: 0, gpu: 0 }, to: { rack: 0, node: 0, gpu: 3 }, link: "nvlink", bwGBs: 900, hops: 1, relTime: 1 },
  { from: { rack: 0, node: 0, gpu: 0 }, to: { rack: 0, node: 1, gpu: 0 }, link: "infiniband", bwGBs: 100, hops: 2, relTime: 9 },
  { from: { rack: 0, node: 0, gpu: 0 }, to: { rack: 1, node: 1, gpu: 3 }, link: "infiniband", bwGBs: 100, hops: 4, relTime: 18 },
];

/* ── 3. Split ONE next-word network across GPUs ─────────────────────────────── */

export type SplitKey = "data" | "tensor" | "pipeline";

/** The concrete network we split: 3 prompt inputs → two hidden layers → 3
 *  next-word candidates. Small enough to split cleanly across 2 GPUs. */
export const SPLIT_LAYERS = [3, 4, 4, 3];
export const SPLIT_GPU_COUNT = 2;

/** Which layers (indices into SPLIT_LAYERS) each GPU runs under pipeline
 *  parallelism: GPU 0 runs the first half, GPU 1 the second. */
export const PIPELINE_RANGES: number[][] = [
  [0, 1],
  [2, 3],
];

/**
 * Does GPU `g` hold the neuron at (layer, idx) under strategy `key`? This is the
 * whole question — the answer differs per strategy:
 *  • data     → every GPU holds the WHOLE network (a full copy).
 *  • tensor   → each GPU holds a slice of EVERY layer (split the neurons).
 *  • pipeline → each GPU holds a few whole LAYERS (split the depth).
 */
export function ownsNode(key: SplitKey, g: number, layer: number, idx: number, layers: number[]): boolean {
  if (key === "data") return true;
  if (key === "pipeline") return PIPELINE_RANGES[g].includes(layer);
  const half = Math.ceil(layers[layer] / 2); // tensor: first half → GPU 0, rest → GPU 1
  return g === 0 ? idx < half : idx >= half;
}
