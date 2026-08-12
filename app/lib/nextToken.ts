/**
 * Pure logic + data for "Choosing the next token" (Stage 0 · how models run).
 * No React, no d3 — the maths lives here so the diagrams and controls in
 * ChoosingNextToken.tsx stay thin and this stays testable.
 *
 * The scenario: after the last transformer block the model holds one hidden
 * state; the unembedding turns it into a raw score (a "logit") for every token
 * in the dictionary; softmax turns the scores into probabilities; then one
 * token is chosen. Numbers are illustrative but realistic — one clear winner
 * with visible competitors, so softmax and sampling are worth watching.
 */

export type PromptKey = "france" | "sky";
export const PROMPT_KEYS: PromptKey[] = ["france", "sky"];

/**
 * Raw scores (logits) the unembedding assigns to each candidate token, index-
 * aligned to the token strings in the copy module. Real vocabularies hold
 * ~200k tokens; we show the leading handful.
 */
export const LOGITS: Record<PromptKey, number[]> = {
  france: [6.0, 4.5, 4.0, 2.5, 2.0, -0.5],
  sky: [6.5, 3.5, 3.0, 2.0, 1.0, 0.5],
};

/** An illustrative final hidden-state vector, drawn as the input in node 1. */
export const HIDDEN_STATE = [0.42, -1.2, 0.88, 2.11, -0.34, 0.57];

/** How many of the leading tokens the learner can nudge in node 2. */
export const NUDGE_COUNT = 3;

/** Bounds for the node-2 logit sliders. */
export const LOGIT_MIN = -2;
export const LOGIT_MAX = 10;

/** Turn raw scores into probabilities that are all positive and sum to 1.
 *  Subtracting the max first is the standard numerically-stable form. */
export function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Index of the largest value — the greedy pick. */
export function argmax(xs: number[]): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[best]) best = i;
  return best;
}

/** Weighted pick: walk the cumulative distribution until it passes r ∈ [0,1). */
export function sampleIndex(probs: number[], r: number): number {
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}

/** Format a probability as a tidy percentage string. */
export function pct(p: number): string {
  if (p >= 0.9995) return "100%";
  if (p < 0.0005) return "0.0%";
  return `${(p * 100).toFixed(1)}%`;
}
