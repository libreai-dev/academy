/**
 * Stage 0 · 3 (Expert) — Quantization. Pure logic + illustrative data for the
 * three nodes (no React, no d3). Builds on prefill-vs-decode: decode is limited
 * by how fast weights stream out of VRAM, so smaller weights decode faster.
 *
 * All numbers here are realistic-but-illustrative; the copy says so. A 7B model
 * is used as the running example.
 */

export type BitWidth = 16 | 8 | 4 | 3 | 2;

/** The bit-widths the controls cycle through (FP16 baseline → 2-bit). */
export const BIT_WIDTHS: BitWidth[] = [16, 8, 4, 3, 2];

/** Running example: a 7-billion-parameter model. */
export const PARAMS = 7_000_000_000;

/** Distinct values a weight can take: 2^bits. */
export function levels(bits: BitWidth): number {
  return Math.pow(2, bits);
}

/** Weight-only model size on disk / in memory, in GB (bits/8 × params). */
export function modelGB(bits: BitWidth): number {
  return (PARAMS * bits) / 8 / 1e9;
}

/**
 * Gap between two adjacent levels on a normalised weight range of [-1, 1].
 * Fewer levels ⇒ wider gap ⇒ more rounding.
 */
export function stepSize(bits: BitWidth): number {
  return 2 / (levels(bits) - 1);
}

/** Worst-case rounding error, as a % of the full weight range (width 2). */
export function maxErrorPct(bits: BitWidth): number {
  return (stepSize(bits) / 2 / 2) * 100;
}

/** Snap a normalised weight in [-1, 1] to the nearest level for `bits`. */
export function quantize(w: number, bits: BitWidth): number {
  const s = stepSize(bits);
  const q = Math.round(w / s) * s;
  return Math.max(-1, Math.min(1, q));
}

/** Illustrative quality retained (%) after post-training quantization to `bits`. */
export const QUALITY: Record<BitWidth, number> = {
  16: 100,
  8: 100,
  4: 99,
  3: 96,
  2: 78,
};

/** Illustrative decode speed-up vs FP16 (decode is memory-bandwidth bound). */
export const SPEEDUP: Record<BitWidth, number> = {
  16: 1.0,
  8: 1.9,
  4: 3.4,
  3: 3.9,
  2: 4.3,
};

/** Hardware a 7B model of this size comfortably fits on (illustrative). */
export const FITS_ON: Record<BitWidth, string> = {
  16: "data-centre GPU (A100 40GB)",
  8: "one 8GB gaming GPU",
  4: "a laptop / phone",
  3: "a small phone",
  2: "a Raspberry Pi",
};

/* --------------------------------------------------------------------------
 * Node 2 — post-training methods. The same handful of trained weights, once
 * rounded naively and once with a calibrated method that protects the few
 * "salient" weights that carry most of the signal.
 * ------------------------------------------------------------------------ */

/** One trained weight; `salient` marks the ~1% that matter most to the output. */
export interface SampleWeight {
  w: number;
  salient: boolean;
}

/** A fixed, representative set of trained weights (normalised to [-1, 1]). */
export const SAMPLE_WEIGHTS: SampleWeight[] = [
  { w: 0.12, salient: false },
  { w: -0.34, salient: false },
  { w: 0.9, salient: true },
  { w: 0.05, salient: false },
  { w: -0.62, salient: false },
  { w: 0.24, salient: false },
  { w: -0.16, salient: false },
  { w: 0.47, salient: false },
];

export interface QuantRow {
  w: number;
  q: number; //     the value stored after quantizing
  err: number; //   |w - q|
  salient: boolean;
}

export interface MethodResult {
  rows: QuantRow[];
  avgErr: number; //  mean |w - q| across all weights
}

/** Naive round-to-nearest: every weight snaps to the nearest 4-bit level. */
export function quantizeNaive(bits: BitWidth = 4): MethodResult {
  const rows = SAMPLE_WEIGHTS.map(({ w, salient }) => {
    const q = quantize(w, bits);
    return { w, q, err: Math.abs(w - q), salient };
  });
  const avgErr = rows.reduce((s, r) => s + r.err, 0) / rows.length;
  return { rows, avgErr };
}

/**
 * Calibrated (GPTQ / AWQ / GGUF-style): a small calibration set reveals which
 * weights matter; those salient weights are kept near-exact (protected), the
 * rest are rounded as usual. Same storage budget, far less error where it hurts.
 */
export function quantizeCalibrated(bits: BitWidth = 4): MethodResult {
  const rows = SAMPLE_WEIGHTS.map(({ w, salient }) => {
    const naive = quantize(w, bits);
    // Salient weights keep ~1/8 of the naive error (protected precision).
    const q = salient ? w - (w - naive) * 0.12 : naive;
    return { w, q, err: Math.abs(w - q), salient };
  });
  const avgErr = rows.reduce((s, r) => s + r.err, 0) / rows.length;
  return { rows, avgErr };
}
