/**
 * Pure logic + illustrative constants for the Speculative Decoding lesson.
 * No React, no d3 — just the arithmetic behind the interactives.
 */

/** fp16 weight bytes for a ~70B model, and one accelerator's memory bandwidth.
 *  Illustrative but realistic (≈ an H100). Decode is memory-bound: the wall is
 *  moving these bytes each pass, not the math. */
export const WEIGHTS_GB = 140; //        70B params × 2 bytes
export const BANDWIDTH_GBPS = 3350; //   ~3.35 TB/s
/** Time to stream every weight once = the floor for one decode pass (ms). */
export const PASS_MS = (WEIGHTS_GB / BANDWIDTH_GBPS) * 1000; // ≈ 41.8 ms
/** Share of the GPU's math throughput a single-token decode actually uses. */
export const COMPUTE_USED_PCT = 3;

/** A draft-model step costs a fraction of a big-model step (it's a small model). */
export const DRAFT_COST = 0.18;

/** Expected tokens emitted per verification pass when drafting `k` tokens at
 *  acceptance probability `alpha` (i.i.d.). Includes the one guaranteed token
 *  the big model always contributes. Closed form: (1 − a^(k+1)) / (1 − a). */
export function expectedTokens(alpha: number, k: number): number {
  if (k <= 0) return 1;
  if (alpha >= 1) return k + 1;
  return (1 - Math.pow(alpha, k + 1)) / (1 - alpha);
}

/** Wall-clock speed-up vs plain decode: tokens per cycle ÷ cost per cycle,
 *  where a cycle is one big pass plus `k` cheap draft passes (in big-pass units). */
export function speedup(alpha: number, k: number, draftCost = DRAFT_COST): number {
  const cost = 1 + k * draftCost;
  return expectedTokens(alpha, k) / cost;
}

/** Illustrative accepted-prefix length for the Node-2 diagram (deterministic). */
export function acceptedPrefix(alpha: number, k: number): number {
  return Math.max(0, Math.min(k, Math.round(alpha * k)));
}
