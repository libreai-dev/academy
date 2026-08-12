/**
 * Stage 0 · Reference 2·A — The attention mechanism. Pure logic + data for the
 * three nodes (no React, no d3). One idea: each token builds a query, matches it
 * against every token's key, and blends their values by how well they match.
 *
 * The vectors below are tiny (4 dims) and hand-tuned so the demo produces an
 * intuitive result — the ambiguous word "bank" attends most to "river" — not
 * because these are a real model's weights. The four dims are loosely readable
 * as [thing · place · water · function-word], but that's just for intuition.
 */

/** Which of the three little vectors a token makes from its embedding. */
export type Role = "query" | "key" | "value";

export const ROLE_ORDER: Role[] = ["query", "key", "value"];

/** The fixed example sentence, by index. Display strings live in copy.ts. */
export const TOK_COUNT = 5;

/** The token whose three vectors + attention we spotlight (the ambiguous one). */
export const FOCUS = 1; // "bank"

/** Per-token embedding — also used as the residual input in node 3. */
export const EMB: number[][] = [
  [0.1, 0.05, 0.02, 0.9], //  The
  [0.82, 0.7, 0.2, 0.05], //  bank
  [0.12, 0.35, 0.05, 0.8], // by
  [0.1, 0.05, 0.02, 0.9], //  the
  [0.72, 0.62, 0.95, 0.05], // river
];

/** Query vectors — "what each token is looking for". */
export const QVEC: number[][] = [
  [0.15, 0.05, 0.05, 0.8],
  [0.5, 0.6, 0.9, 0.05], //   bank seeks water/place context
  [0.2, 0.55, 0.3, 0.5],
  [0.15, 0.05, 0.05, 0.8],
  [0.6, 0.6, 0.8, 0.05],
];

/** Key vectors — "what each token offers to be matched against". */
export const KVEC: number[][] = [
  [0.1, 0.05, 0.05, 0.85],
  [0.8, 0.7, 0.2, 0.05],
  [0.15, 0.3, 0.05, 0.75],
  [0.1, 0.05, 0.05, 0.85],
  [0.7, 0.6, 0.95, 0.05], //  river's key is rich in "water"
];

/** Value vectors — "the meaning each token hands over when it's attended to". */
export const VVEC: number[][] = [
  [0.1, 0.05, 0.02, 0.88],
  [0.8, 0.68, 0.25, 0.05],
  [0.12, 0.34, 0.06, 0.78],
  [0.1, 0.05, 0.02, 0.88],
  [0.72, 0.6, 0.92, 0.05],
];

export function roleVec(role: Role, i: number): number[] {
  return role === "query" ? QVEC[i] : role === "key" ? KVEC[i] : VVEC[i];
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Raw attention scores for a query token: q · k for every token. */
export function scores(q: number[] | number): number[] {
  const qv = typeof q === "number" ? QVEC[q] : q;
  return KVEC.map((k) => dot(qv, k));
}

export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const ex = xs.map((x) => Math.exp(x - m));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

/** Attention weights for a query token — a distribution that sums to 1. */
export function weights(q: number): number[] {
  return softmax(scores(q));
}

/** The token this query attends to most (its argmax weight). */
export function topAttended(q: number): number {
  const w = weights(q);
  let best = 0;
  for (let i = 1; i < w.length; i++) if (w[i] > w[best]) best = i;
  return best;
}

/** The blended value: sum over tokens of weight · value. */
export function blend(q: number): number[] {
  const w = weights(q);
  const out = [0, 0, 0, 0];
  VVEC.forEach((v, j) => {
    for (let d = 0; d < out.length; d++) out[d] += w[j] * v[d];
  });
  return out;
}

/** Residual: add the query token's own embedding back to the blend. */
export function residual(q: number): number[] {
  const b = blend(q);
  return b.map((x, d) => x + EMB[q][d]);
}

/** RMSNorm: rescale a vector to unit root-mean-square (gain = 1). */
export function rmsNorm(v: number[]): number[] {
  const ms = v.reduce((a, x) => a + x * x, 0) / v.length;
  const inv = 1 / Math.sqrt(ms + 1e-6);
  return v.map((x) => x * inv);
}

/** The block output for the query token: RMSNorm(blend + input). */
export function blockOutput(q: number): number[] {
  return rmsNorm(residual(q));
}
