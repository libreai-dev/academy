/**
 * Stage 0 · How models learn — pure per-node logic/data (no React, no d3).
 *
 * One idea across three nodes: training is a loop — guess the next token,
 * measure how wrong the guess was (loss), nudge the weights a little less
 * wrong, repeat. Every user-facing string lives in app/lib/copy/how-models-learn.ts;
 * this file is only numbers and math.
 */

/* ---------------------------------------------------------------- Node 1 --- *
 * Guess → loss. A fixed next-token distribution for one context. The candidate
 * WORDS live in copy (they differ by language); these probabilities are shared
 * and index-aligned to them. Loss = the model's "surprise" at the real token,
 * i.e. cross-entropy for a single prediction: -ln(probability it gave it).
 */

/** Probabilities the model assigned to each candidate next token (sum ≈ 1). */
export const N1_PROBS = [0.62, 0.18, 0.1, 0.06, 0.04] as const;

/** Cross-entropy for one prediction, in nats: how surprised the model was. */
export function surprise(p: number): number {
  return -Math.log(Math.max(p, 1e-9));
}

/* ---------------------------------------------------------------- Node 2 --- *
 * Nudge the weights. A one-parameter loss valley L(w) and gradient descent on
 * it. The learner rolls a ball downhill one step at a time; the learning rate
 * sets the step size (too small crawls, too big overshoots and diverges).
 */

export const W_MIN = -6;
export const W_MAX = 6;
export const W_OPT = 1.6; //   where the valley bottoms out
export const W_START = -4.8; // the ball's starting weight
const CURV = 0.25; //          how steep the valley is

/** Loss as a function of one weight — a simple valley (parabola). */
export function lossAt(w: number): number {
  return CURV * (w - W_OPT) * (w - W_OPT) + 0.4;
}

/** Slope of the valley under the ball — the gradient dL/dw. */
export function gradAt(w: number): number {
  return 2 * CURV * (w - W_OPT);
}

/** One gradient-descent step: move opposite the slope, scaled by the rate. */
export function gdStep(w: number, rate: number): number {
  return w - rate * gradAt(w);
}

/** Which regime a learning rate is in: 0 too small · 1 good · 2 too big. */
export function rateRegime(rate: number): 0 | 1 | 2 {
  // Update factor is (1 - rate·2·CURV) = (1 - 0.5·rate). |factor|>1 → diverges
  // (rate>4); factor<0 → oscillates (rate>2). Below ~0.6 it barely moves.
  if (rate < 0.6) return 0;
  if (rate > 3.2) return 2;
  return 1;
}

/** Sampled points of the loss valley for drawing the curve. */
export function valleyCurve(n = 140): { w: number; l: number }[] {
  const out: { w: number; l: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const w = W_MIN + ((W_MAX - W_MIN) * i) / n;
    out.push({ w, l: lossAt(w) });
  }
  return out;
}

/* ---------------------------------------------------------------- Node 3 --- *
 * At scale. Loss over the whole training run — steep early, then a long crawl.
 * Progress p ∈ [0,1] stands for the fraction of the corpus seen; the model
 * reads TOTAL_TOKENS over the run.
 */

export const LOSS_START = 10.8; // random init ≈ ln(vocab) for a ~50k vocab
export const LOSS_FLOOR = 1.9; //  language stays a bit unpredictable forever
const DECAY = 4.6;
export const TOTAL_TOKENS = 15e12; // ~15 trillion tokens, a frontier-scale run

/** Training loss after fraction p of the corpus — a decaying curve. */
export function trainLoss(p: number): number {
  const x = Math.max(0, Math.min(1, p));
  return LOSS_FLOOR + (LOSS_START - LOSS_FLOOR) * Math.exp(-DECAY * x);
}

/** Tokens seen after fraction p of the run. */
export function tokensSeen(p: number): number {
  return Math.max(0, Math.min(1, p)) * TOTAL_TOKENS;
}

/** Sampled training curve for drawing (progress 0..1). */
export function trainCurve(n = 120): { p: number; l: number }[] {
  const out: { p: number; l: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const p = i / n;
    out.push({ p, l: trainLoss(p) });
  }
  return out;
}

/** Compact human tokens count, e.g. 15e12 → "15.0T". */
export function fmtTokens(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return `${Math.round(n)}`;
}
