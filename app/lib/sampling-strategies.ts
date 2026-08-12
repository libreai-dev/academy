/**
 * Stage 0 · Sampling strategies — pure logic + data (no React, no d3).
 *
 * Builds on "Choosing the next token": that lesson ended with a probability
 * distribution over the dictionary and one pick (greedy or sample). Here we
 * reshape that distribution before picking — with temperature, top-k / top-p,
 * and a repetition penalty.
 *
 * The candidates are a small, illustrative slice of the dictionary for the
 * prompt "The cat sat on the …". Token *labels* live in the copy module (so
 * they translate); everything here is language-independent numbers/indices.
 */

/** Raw next-token scores (logits) for the 8 illustrative candidates, index
 *  aligned to the token label arrays in the copy module. "mat" (index 0) is
 *  both the top candidate and the word the model has already been looping on,
 *  so it is the one a repetition penalty bites. */
export const BASE_LOGITS = [3.2, 2.5, 2.0, 1.6, 1.1, 0.7, 0.3, -0.2];

/** Candidate indices that appear in the recent context (for the repetition
 *  penalty node). Only "mat" (0) is both recent and a live candidate. */
export const RECENT_IDX = [0];

/** Softmax with a temperature: divide each score by T, exponentiate, normalise.
 *  T→0 sharpens toward the top score; T>1 flattens toward a coin flip. */
export function softmax(logits: number[], temperature = 1): number[] {
  const t = Math.max(0.05, temperature);
  const scaled = logits.map((z) => z / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((z) => Math.exp(z - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Keep only the k highest-probability candidates (a boolean keep-mask). */
export function topK(probs: number[], k: number): boolean[] {
  const order = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a]);
  const keep = new Array(probs.length).fill(false);
  for (let i = 0; i < Math.min(k, probs.length); i++) keep[order[i]] = true;
  return keep;
}

/** Nucleus sampling: keep the smallest set of top candidates whose probability
 *  mass reaches p. The *count* kept varies with how peaked the distribution is. */
export function topP(probs: number[], p: number): boolean[] {
  const order = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a]);
  const keep = new Array(probs.length).fill(false);
  let cum = 0;
  for (const i of order) {
    keep[i] = true;
    cum += probs[i];
    if (cum >= p) break;
  }
  return keep;
}

/** Zero out the dropped candidates and renormalise the survivors to sum to 1. */
export function renorm(probs: number[], keep: boolean[]): number[] {
  const sum = probs.reduce((a, p, i) => a + (keep[i] ? p : 0), 0) || 1;
  return probs.map((p, i) => (keep[i] ? p / sum : 0));
}

/** Hugging-Face-style repetition penalty applied to the raw logits: a score for
 *  an already-seen token is divided by the penalty when positive (pushed down),
 *  multiplied when negative. penalty = 1 is a no-op. */
export function penalise(logits: number[], recent: number[], penalty: number): number[] {
  const seen = new Set(recent);
  return logits.map((z, i) => {
    if (!seen.has(i)) return z;
    return z > 0 ? z / penalty : z * penalty;
  });
}

/** Index of the largest value (the greedy / top pick). */
export function argmax(a: number[]): number {
  let bi = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[bi]) bi = i;
  return bi;
}

/** Count of true entries in a keep-mask. */
export function countKept(keep: boolean[]): number {
  return keep.reduce((n, k) => n + (k ? 1 : 0), 0);
}

/** Deterministic PRNG so a "sample" roll is reproducible per seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw one index from a probability distribution given a uniform r in [0,1). */
export function sampleIndex(probs: number[], r: number): number {
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (r < cum) return i;
  }
  return probs.length - 1;
}

/** Format a probability as a compact percent string. */
export function pct(p: number): string {
  if (p <= 0) return "0%";
  if (p < 0.095) return `${(p * 100).toFixed(1)}%`;
  return `${Math.round(p * 100)}%`;
}
