/**
 * Stage 0 · 4.5 — Direct Preference Optimization (DPO). Pure logic + data, no
 * React and no d3, so it can be unit-tested in isolation.
 *
 * The one number DPO cares about is the *margin*: the model's log-probability
 * for the chosen answer minus the log-probability for the rejected one. Training
 * widens that margin. We turn a margin into a between-the-two probability with a
 * plain logistic (2-way softmax over the two answers), so the diagram can show
 * "how likely the model is to produce each answer" as it trains.
 *
 * All figures are illustrative but shaped like real training curves.
 */

/** Logistic / sigmoid — turns a log-prob margin into P(chosen) over the two. */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Number of discrete update steps the Node-2 slider walks through. */
export const DPO_STEPS = 8;

/** The base model barely leans either way before training (margin ≈ 0.1). */
export const START_MARGIN = 0.1;

/** Where the margin lands once the pair is fully learned (≈ 93% vs 7%). */
export const TARGET_MARGIN = 2.6;

/** Log-prob margin (chosen − rejected) after `step` of `steps` updates. */
export function marginAt(step: number, steps: number = DPO_STEPS): number {
  const f = Math.max(0, Math.min(1, step / steps));
  return START_MARGIN + (TARGET_MARGIN - START_MARGIN) * f;
}

/** P(chosen) between the two answers after `step` updates (0..1). */
export function pChosenAt(step: number, steps: number = DPO_STEPS): number {
  return sigmoid(marginAt(step, steps));
}

/** Whole-percent rounding used by both the diagram and the notes. */
export function pct(p: number): number {
  return Math.round(p * 100);
}

/** Node 3 — how many moving parts each route needs, for the compare readout. */
export const RLHF_PARTS = { stages: 4, models: 2, rlLoop: true } as const;
export const DPO_PARTS = { stages: 3, models: 1, rlLoop: false } as const;
