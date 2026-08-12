/**
 * Stage 0 · 2.5.1 — Backpropagation. Pure logic + data for the article's three
 * live diagrams (no React, no d3). Two things live here:
 *
 *  1. A tiny fixed 3-weight "chain" (Node 1) used to show how the error at the
 *     end is handed backward layer by layer — the chain rule as plain
 *     multiplication. Numbers are illustrative but internally consistent.
 *  2. A 2-parameter loss "bowl" (Nodes 2 & 3): loss(w1,w2), its gradient, and a
 *     single gradient-descent step. The same bowl backs the gradient-arrow node
 *     and the roll-downhill node so the mechanism reads as one continuous story.
 */

/* ---------------------------------------------------------------- Node 1 --- */
/* A linear 3-weight chain: y_hat = x · w1 · w2 · w3. No activation, so the
 * mechanism (multiply the blame by each weight/signal on the way back) stays
 * visible without any extra jargon. */

export const CHAIN_INPUT = 1.0;
export const CHAIN_WEIGHTS = [0.8, 1.5, 0.5] as const; // w1, w2, w3
export const CHAIN_TARGET = 1.0;

export interface ChainState {
  /** Forward activations at each node: [x, a1, a2, yHat]. */
  acts: number[];
  /** The forward weights, echoed for the diagram. */
  weights: number[];
  /** prediction − target (how wrong, and in which direction). */
  error: number;
  loss: number;
  /** Back-signal arriving on each node's output, from the right: [a1, a2, yHat]. */
  nodeBlame: number[];
  /** dLoss/dWeight for each weight — the share of blame that weight will be nudged by. */
  weightBlame: number[];
}

/** Run the forward pass, then walk the chain rule backward once. Pure. */
export function computeChain(
  x: number = CHAIN_INPUT,
  weights: readonly number[] = CHAIN_WEIGHTS,
  target: number = CHAIN_TARGET,
): ChainState {
  const [w1, w2, w3] = weights;
  const a1 = x * w1;
  const a2 = a1 * w2;
  const yHat = a2 * w3;
  const error = yHat - target;
  const loss = 0.5 * error * error;

  // Chain rule, right → left. dLoss/dyHat = error.
  const dYHat = error;
  const wb3 = dYHat * a2; //        blame on w3  = incoming blame · signal into w3
  const dA2 = dYHat * w3; //        pass blame back through w3
  const wb2 = dA2 * a1; //          blame on w2
  const dA1 = dA2 * w2; //          pass blame back through w2
  const wb1 = dA1 * x; //           blame on w1

  return {
    acts: [x, a1, a2, yHat],
    weights: [w1, w2, w3],
    error,
    loss,
    nodeBlame: [dA1, dA2, dYHat],
    weightBlame: [wb1, wb2, wb3],
  };
}

/* -------------------------------------------------------------- Nodes 2/3 -- */
/* An elliptical loss bowl with its minimum at the origin. B < A makes it a
 * stretched valley, so the downhill path bends instead of pointing straight at
 * the goal — the honest picture of gradient descent. */

export const LOSS_A = 1.0; //   curvature along w1 (steep)
export const LOSS_B = 0.28; //  curvature along w2 (shallow)
export const W_RANGE = 4.4; //  half-width of the w1/w2 domain shown

/** loss(w1, w2) — a simple quadratic bowl. */
export function loss(w1: number, w2: number): number {
  return 0.5 * (LOSS_A * w1 * w1 + LOSS_B * w2 * w2);
}

/** ∇loss — the slope per weight. Points UPHILL; downhill is the negative. */
export function grad(w1: number, w2: number): [number, number] {
  return [LOSS_A * w1, LOSS_B * w2];
}

/** One gradient-descent step: w ← w − lr · ∇loss(w). */
export function stepOnce(w1: number, w2: number, lr: number): [number, number] {
  const [g1, g2] = grad(w1, w2);
  return [w1 - lr * g1, w2 - lr * g2];
}

export interface DescentPoint {
  w1: number;
  w2: number;
  loss: number;
}

/** Where a fresh descent starts — up on the steep wall, off to one side. */
export const START: readonly [number, number] = [-3.7, 3.0];

/** Roll a full descent path from START for `n` steps (used for previews). */
export function descentPath(lr: number, n: number, start: readonly [number, number] = START): DescentPoint[] {
  let [w1, w2] = start;
  const out: DescentPoint[] = [{ w1, w2, loss: loss(w1, w2) }];
  for (let i = 0; i < n; i++) {
    [w1, w2] = stepOnce(w1, w2, lr);
    // Guard against a diverging (too-large) learning rate blowing up to Infinity.
    w1 = Math.max(-1e4, Math.min(1e4, w1));
    w2 = Math.max(-1e4, Math.min(1e4, w2));
    out.push({ w1, w2, loss: loss(w1, w2) });
  }
  return out;
}

/** Learning-rate regime, for the plain-language note by the slider.
 *  A step w1 ← w1(1 − lr·A) diverges once lr·A > 2, i.e. lr > 2/A. */
export type LrRegime = "slow" | "good" | "big";
export function lrRegime(lr: number): LrRegime {
  const diverge = 2 / LOSS_A; //     ~2.0
  if (lr < 0.3) return "slow";
  if (lr >= diverge - 0.05) return "big";
  return "good";
}
