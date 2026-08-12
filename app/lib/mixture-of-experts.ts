/**
 * Stage 0 · 2·B — Mixture of Experts. Pure logic + illustrative data the
 * diagrams draw (no React, no d3). Routing maths and load-balance numbers only.
 *
 * One idea: instead of one big feed-forward per token, a router sends each token
 * to a few specialist "experts", so the model holds far more parameters while
 * using similar compute per token. Numbers here are realistic-but-illustrative;
 * a real router learns its scores from data.
 */

export const NUM_EXPERTS = 8;

/** A sample token with per-expert gating logits — the router's raw scores. */
export interface MoeToken {
  key: string;
  /** The literal token text drawn in the diagram (a code-literal, not prose). */
  glyph: string;
  /** Length NUM_EXPERTS. Illustrative: each token peaks on a different expert. */
  logits: number[];
}

/** Four sample tokens, each favouring a different set of experts so routing
 *  visibly differs per token. Real routers learn these; ours are hand-set. */
export const MOE_TOKENS: MoeToken[] = [
  { key: "code", glyph: "def", logits: [3.1, 0.4, 2.2, -0.6, 0.1, 1.3, -0.9, 0.2] },
  { key: "cjk", glyph: "た", logits: [-0.7, 0.3, 0.0, 2.9, 0.6, -0.4, 2.1, 0.5] },
  { key: "common", glyph: "the", logits: [0.6, 2.7, 0.2, 0.1, 1.8, 0.4, 0.0, 0.9] },
  { key: "number", glyph: "3.14", logits: [0.2, -0.3, 1.1, 0.4, 0.5, 2.6, 0.7, 2.0] },
];

/** Numerically stable softmax. */
export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const es = xs.map((x) => Math.exp(x - m));
  const s = es.reduce((a, b) => a + b, 0) || 1;
  return es.map((e) => e / s);
}

export interface Routing {
  /** Gate softmax over ALL experts (for the score bars). */
  probs: number[];
  /** Indices of the top-K experts, highest first. */
  selected: number[];
  /** Renormalised gate weights over the selected experts (index-aligned). */
  weights: number[];
}

/** Top-K routing: softmax the logits, keep the K highest, renormalise weights. */
export function routeToken(logits: number[], k: number): Routing {
  const probs = softmax(logits);
  const order = probs
    .map((p, i) => [p, i] as const)
    .sort((a, b) => b[0] - a[0])
    .map((t) => t[1]);
  const selected = order.slice(0, Math.max(1, Math.min(k, logits.length)));
  const chosen = selected.map((i) => probs[i]);
  const z = chosen.reduce((a, b) => a + b, 0) || 1;
  const weights = chosen.map((p) => p / z);
  return { probs, selected, weights };
}

/** Fraction of the layer's FFN parameters a single token actually runs = K / N. */
export function activeFraction(k: number): number {
  return k / NUM_EXPERTS;
}

/* ---- Load balancing ---------------------------------------------------- */

/** The skewed "popularity" a router drifts toward with no balancing — a few
 *  favourite experts hoover up most tokens. Sums to 1. Illustrative. */
export const EXPERT_POPULARITY = [0.34, 0.24, 0.15, 0.1, 0.07, 0.05, 0.03, 0.02];

/** Tokens in one illustrative batch, and the per-expert slot budget. */
export const BATCH_TOKENS = 512;
/** Slots per expert = 1.25× the average — the standard "capacity factor". */
export const CAPACITY_FACTOR = 1.25;

export interface LoadState {
  load: number[]; //   tokens routed to each expert
  capacity: number; // per-expert cap this batch
  dropped: number; //  tokens over capacity (skipped this layer)
  busiest: number; //  max load
  idle: number; //     experts under the idle threshold
}

/**
 * Interpolate expert load between the skewed popularity (alpha = 0) and a
 * perfectly even split (alpha = 1). `alpha` models the strength of the
 * load-balance loss: 0 = none, 1 = fully balanced.
 */
export function loadDistribution(alpha: number, total = BATCH_TOKENS): LoadState {
  const a = Math.max(0, Math.min(1, alpha));
  const uniform = 1 / NUM_EXPERTS;
  const frac = EXPERT_POPULARITY.map((p) => p * (1 - a) + uniform * a);
  const load = frac.map((f) => Math.round(f * total));
  const capacity = Math.round((total / NUM_EXPERTS) * CAPACITY_FACTOR);
  const dropped = load.reduce((s, l) => s + Math.max(0, l - capacity), 0);
  const busiest = Math.max(...load);
  const idle = load.filter((l) => l < capacity * 0.3).length;
  return { load, capacity, dropped, busiest, idle };
}
