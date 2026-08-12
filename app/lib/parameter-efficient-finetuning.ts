/**
 * Stage 0 · 4.3 — Parameter-efficient fine-tuning (LoRA / QLoRA / DoRA).
 * Pure logic + illustrative numbers (no React, no d3). Every figure here is
 * realistic-but-rounded for teaching, not a benchmark.
 */

/** A single weight matrix's shape (out × in). We use one 7B attention projection. */
export interface LayerShape {
  d: number; // input width  (columns)
  k: number; // output width (rows)
}

/** A 4096×4096 projection — the size of one attention block in a ~7B model. */
export const LAYER: LayerShape = { d: 4096, k: 4096 };

/** The rank values the Node-1 slider steps through. */
export const RANKS = [1, 2, 4, 8, 16, 32, 64] as const;

/** Full weight count for the layer: d·k. */
export function fullLayerParams(s: LayerShape = LAYER): number {
  return s.d * s.k;
}

/** LoRA adds A (r×d) + B (k×r) = r·(d+k) numbers for this layer. */
export function loraLayerParams(r: number, s: LayerShape = LAYER): number {
  return r * (s.d + s.k);
}

/** Trainable adapter size as a percentage of the full layer. */
export function loraPct(r: number, s: LayerShape = LAYER): number {
  return (loraLayerParams(r, s) / fullLayerParams(s)) * 100;
}

/* --------------------------------------------------------- Node 2: memory --- */

/** Parameter count of the model whose memory we chart (7B). */
export const MODEL_PARAMS = 7.0e9;

/** Full fine-tuning: bf16 weight + grad + fp32 master + Adam m,v ≈ 16 B/param. */
export const FULL_BYTES_PER = 16;
/** A frozen bf16 base weight: read-only, no grad/optimizer. */
export const BASE_BYTES_16 = 2;
/** A frozen 4-bit (NF4) base weight — QLoRA. */
export const BASE_BYTES_4 = 0.5;
/** Adapter params + their gradient + optimizer state (tiny, roughly constant). */
export const ADAPTER_OVERHEAD_GB = 0.4;
/** QLoRA's extra quantization constants (double-quant metadata). */
export const QUANT_CONST_GB = 0.4;

/** The consumer GPU we test the fit against. */
export const GPU_GB = 24;

export function fullFtGB(): number {
  return (MODEL_PARAMS * FULL_BYTES_PER) / 1e9; // 112
}

/** The LoRA/QLoRA run: frozen base + tiny trainable adapter. */
export function adapterGB(fourBit: boolean): number {
  const base = (MODEL_PARAMS * (fourBit ? BASE_BYTES_4 : BASE_BYTES_16)) / 1e9;
  return base + ADAPTER_OVERHEAD_GB + (fourBit ? QUANT_CONST_GB : 0);
}

/** Round to one decimal for display. */
export function gb1(n: number): string {
  return `${n.toFixed(1)} GB`;
}
