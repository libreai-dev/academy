/**
 * Stage 0 · 1.4 — Long context. Pure logic/data for the scroll-driven article:
 * how a RoPE model trained on a short window is stretched to a long one by
 * RESCALING its rotation frequencies (linear / NTK-aware / YaRN) instead of
 * retraining. No React, no d3 — just the geometry the diagrams draw.
 *
 * Builds on rope-math.ts: a RoPE "pair" is a 2D slice of a token's vector that
 * spins by an angle m·θ set by the token's position m. Different pairs have
 * different θ (fast → slow). Here we ask what happens when m runs past the
 * length the model was trained on.
 */

/** The context length the model was trained on (illustrative but typical). */
export const TRAIN_CTX = 4096;
/** RoPE's frequency base — the usual 10000. */
export const ROPE_BASE = 10000;
/** Attention head dimension d; there are d/2 rotation pairs. */
export const HEAD_DIM = 128;
export const N_PAIRS = HEAD_DIM / 2; // 64

const TAU = Math.PI * 2;

/** θ for pair index i (0 = fastest, N_PAIRS−1 = slowest): θ_i = base^(−2i/d). */
export function thetaOf(i: number): number {
  return Math.pow(ROPE_BASE, (-2 * i) / HEAD_DIM);
}

/** The fastest pair turns ~1 rad per step; the slowest barely creeps. */
export const FAST_THETA = thetaOf(0); //            = 1
export const SLOW_THETA = thetaOf(N_PAIRS - 1); //  ≈ 1.155e-4 rad / step

/** Raw rotation angle (radians, NOT wrapped) of a pair at position m. */
export function angleAt(m: number, theta: number): number {
  return m * theta;
}

/** How wide an arc the pair swept across the whole training window, capped at a
 *  full turn. Fast pairs cover the whole circle; slow pairs only a thin wedge. */
export function seenSpan(theta: number): number {
  return Math.min(TAU, TRAIN_CTX * theta);
}

/** Did training show the model every angle of this pair (a full turn)? */
export function seenFull(theta: number): boolean {
  return TRAIN_CTX * theta >= TAU;
}

/** Is position m an angle the model actually saw in training, for this pair?
 *  Full-circle pairs: always. Thin-wedge (slow) pairs: only up to TRAIN_CTX. */
export function inDistribution(m: number, theta: number): boolean {
  if (seenFull(theta)) return true;
  return m <= TRAIN_CTX;
}

/** Linear scaling: divide the frequency by s, so position m rotates by m·θ/s —
 *  as if it sat at m/s. Positions up to s·TRAIN_CTX now land in the seen arc. */
export function scaledAngle(m: number, theta: number, s: number): number {
  return (m * theta) / s;
}

/** How far the model can reach after scaling by s. */
export function reachOf(s: number): number {
  return s * TRAIN_CTX;
}

/** Radians → whole degrees, for readouts. */
export function deg(rad: number): number {
  return Math.round((rad * 180) / Math.PI);
}

/** Format a context length as "4k" / "24k" / "128k" (powers of 1024). */
export function fmtCtx(n: number): string {
  return `${Math.round(n / 1024)}k`;
}

/* --- Node 3: the three rescaling strategies ------------------------------- */

export type Method = "linear" | "ntk" | "yarn";
export const METHODS: Method[] = ["linear", "ntk", "yarn"];

/**
 * How much each method stretches the pair at normalized frequency position
 * u ∈ [0,1] (0 = fastest pair, 1 = slowest). Returns a fraction 0…1 where
 * 0 = frequency left untouched (extrapolate), 1 = fully divided by s
 * (interpolate). SCHEMATIC — real curves differ in the exact shape, but the
 * strategy each method takes is faithful:
 *   - linear : scale everything equally (blurs the fast pairs → local detail).
 *   - ntk    : scale slow pairs a lot, fast pairs almost none (keep local detail).
 *   - yarn   : three bands — untouched fast, ramped middle, fully-scaled slow.
 */
export function scaleFrac(method: Method, u: number): number {
  const x = Math.max(0, Math.min(1, u));
  if (method === "linear") return 1;
  if (method === "ntk") return x; // smooth ramp: fast≈0 → slow≈1
  const lo = 0.34;
  const hi = 0.66;
  if (x < lo) return 0;
  if (x > hi) return 1;
  return (x - lo) / (hi - lo);
}
