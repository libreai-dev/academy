/**
 * Pure logic + data for the "Reward modeling" lesson (Stage 0 · 4.4).
 * No React, no d3 — the training curve and the ranking maths live here so the
 * diagrams in `RewardModeling.tsx` stay thin and the numbers are testable.
 *
 * The reward model turns human A/B comparisons into a single scalar score.
 * Training pushes the preferred answer's score above the rejected one's; a
 * trained model then scores brand-new answers and ranks them. Numbers are
 * illustrative (a 0–10 display scale), chosen to show the shape of the curve.
 */

/** How many training "steps" the Node 2 slider sweeps through. */
export const RM_MAX_STEP = 20;

/** Display scale for reward scores (arbitrary units, 0–10 for legibility). */
export const RM_SCALE_MIN = 0;
export const RM_SCALE_MAX = 10;

export interface RewardState {
  /** Reward the model gives the human-preferred answer at this step. */
  chosen: number;
  /** Reward it gives the rejected answer. */
  rejected: number;
  /** chosen − rejected: how far apart the model has pulled them. */
  margin: number;
  /** P(model ranks the pair the way the human did) = sigmoid(margin), 0–1. */
  match: number;
}

/**
 * The training curve. Both answers start tied at 5.0 (the model is guessing);
 * as steps climb, the preferred answer's score rises and the rejected one's
 * falls, following a saturating exponential (fast at first, then levelling off).
 */
export function rewardAt(step: number): RewardState {
  const t = Math.max(0, Math.min(RM_MAX_STEP, step)) / RM_MAX_STEP;
  const ease = 1 - Math.exp(-3.2 * t); // 0 → ~0.96
  const chosen = 5 + 3.4 * ease;
  const rejected = 5 - 3.0 * ease;
  const margin = chosen - rejected;
  const match = 1 / (1 + Math.exp(-margin)); // Bradley–Terry: sigmoid of the gap
  return { chosen, rejected, margin, match };
}

/** Index order that sorts items best-reward-first (stable on ties by input order). */
export function rankByReward<T extends { reward: number }>(items: T[]): number[] {
  return items
    .map((it, i) => ({ i, r: it.reward }))
    .sort((a, b) => b.r - a.r || a.i - b.i)
    .map((o) => o.i);
}

/** One decimal place, for score readouts. */
export function fmt1(n: number): string {
  return n.toFixed(1);
}
