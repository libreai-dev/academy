/**
 * Stage 0 · 2·A — FlashAttention. Pure, React-free logic + data for the three
 * nodes: the memory wall (N×N grows quadratically), tiling (stream the grid in
 * blocks so memory drops from O(N²) to O(N)), and K/V sharing (GQA/MQA shrink
 * the key/value memory). All numbers are realistic-but-illustrative and use
 * fp16 (2 bytes) unless noted; the component only renders these.
 */

export const BYTES_FP16 = 2;
export const HEAD_DIM = 128; //   per-head width, a common value
export const GPU_HBM_GB = 80; //  one H100's memory, the "wall" reference line

/* ---- Node 1: the memory wall ------------------------------------------- */

/** Sequence-length stops for the slider (index → tokens). */
export const SEQ_STOPS = [1024, 4096, 16384, 65536, 131072, 262144];

/** Bytes to hold the full N×N score grid for ONE head in fp16. */
export function scoreMatrixBytes(n: number): number {
  return n * n * BYTES_FP16;
}

export function bytesToGB(b: number): number {
  return b / 1e9;
}

/** How dense to draw the representative grid at each sequence stop (cells per side). */
export const GRID_DENSITY = [4, 8, 12, 16, 22, 30];

/* ---- Node 2: tiling ---------------------------------------------------- */

/** A fixed long sequence for the tiling demo (the block size is the knob). */
export const TILE_N = 32768;

/** Block sizes the learner can pick (tokens per tile side). */
export const BLOCK_STOPS = [512, 1024, 2048, 4096, 8192];

export function numTiles(block: number, n: number = TILE_N): number {
  return Math.ceil(n / block);
}

/** Naive keeps the whole N×N grid resident. */
export function naiveBytes(n: number = TILE_N): number {
  return n * n * BYTES_FP16;
}

/**
 * FlashAttention keeps, at any instant: one B×B score tile, the matching K and
 * V tiles (B×d each), and a running summary per output row (a max + a sum, fp32)
 * plus the output rows themselves (N×d, fp16). That is O(N), not O(N²).
 */
export function flashBytes(block: number, n: number = TILE_N): number {
  const scoreTile = block * block * BYTES_FP16;
  const kvTiles = 2 * block * HEAD_DIM * BYTES_FP16;
  const rowStats = n * 2 * 4; //     running max + running sum, fp32
  const output = n * HEAD_DIM * BYTES_FP16;
  return scoreTile + kvTiles + rowStats + output;
}

/* ---- Node 3: sharing keys and values ----------------------------------- */

export type Sharing = "mha" | "gqa" | "mqa";
export const SHARINGS: Sharing[] = ["mha", "gqa", "mqa"];

/** Query heads shown in the diagram (kept small so boxes stay legible). */
export const QUERY_HEADS = 8;

/** How many distinct key/value heads each scheme keeps. */
export function kvHeadsFor(s: Sharing): number {
  return s === "mha" ? QUERY_HEADS : s === "gqa" ? 2 : 1;
}

/** Which K/V group a given query head maps to (for the wiring diagram). */
export function groupOf(queryIdx: number, kvHeads: number): number {
  const perGroup = QUERY_HEADS / kvHeads;
  return Math.floor(queryIdx / perGroup);
}

// KV-cache sizing context (a mid-size model holding a long chat in memory).
export const KV_LAYERS = 32;
export const KV_SEQ = 32768;

/** Bytes of the key/value cache: K and V, every layer, kvHeads × d × seq, fp16. */
export function kvCacheBytes(kvHeads: number): number {
  return 2 * KV_LAYERS * kvHeads * HEAD_DIM * KV_SEQ * BYTES_FP16;
}

/* ---- formatting -------------------------------------------------------- */

export function fmtBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(b / 1e9 >= 100 ? 0 : 1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
  return `${Math.round(b)} B`;
}

/** Compact a token count: 262144 → "256k". */
export function fmtTokens(n: number): string {
  if (n >= 1024) return `${Math.round(n / 1024)}k`;
  return String(n);
}

/** Compact a huge cell count: 6.87e10 → "69B". */
export function fmtCount(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}
