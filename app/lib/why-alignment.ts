/**
 * Pure logic + data for the "Why alignment" lesson (Stage 0 · 4.4).
 * No React, no d3 — the reward scale and the learning curve live here so the
 * diagrams and controls in `WhyAlignment.tsx` stay thin and the maths is testable.
 *
 * Numbers are deliberately illustrative: the point is the *shape* of each idea —
 * a preferred answer scores higher, and repeated feedback bends behaviour toward
 * it — not a benchmark of any real training run.
 */

/* ======================================================================== *
 * NODE 2 — Reward as a score
 * A reward model turns an answer into one number on a −5 … +5 scale.
 * "Margin" (0–100) is how much better the preferred answer is judged to be;
 * the preferred answer is pushed toward +, the rejected one toward −.
 * ======================================================================== */

/** The reward scale runs from −MAX (unsafe · unhelpful) to +MAX (helpful · safe). */
export const REWARD_MAX = 5;

export interface Reward {
  /** Score of the preferred answer (0 … +REWARD_MAX). */
  chosen: number;
  /** Score of the rejected answer (0 … −REWARD_MAX). */
  rejected: number;
  /** The gap the training step is asked to widen. */
  gap: number;
}

/** Map a 0–100 preference margin onto two reward scores and their gap. */
export function rewardOf(margin: number): Reward {
  const m = Math.max(0, Math.min(100, margin)) / 100;
  const chosen = m * REWARD_MAX;
  const rejected = -m * REWARD_MAX;
  return { chosen, rejected, gap: chosen - rejected };
}

/* ======================================================================== *
 * NODE 3 — Learning from feedback
 * Repeat a preference over many prompts and the model's behaviour shifts.
 * We model the share of answers a judge prefers as it climbs from a coin-flip
 * (50%) toward a ceiling, faster or slower depending on who gives the feedback.
 * ======================================================================== */

export type FeedbackMode = "human" | "ai";

/** Rounds of feedback the node 3 slider sweeps across. */
export const MAX_ROUNDS = 2000;

interface Curve {
  /** Where the preferred-answer rate tops out. */
  ceiling: number;
  /** How quickly it climbs per round. */
  rate: number;
}

const CURVES: Record<FeedbackMode, Curve> = {
  // Human feedback: slower to collect, but a slightly higher ceiling.
  human: { ceiling: 90, rate: 0.0016 },
  // AI feedback (a model rates the answers): cheaper, so it ramps faster.
  ai: { ceiling: 86, rate: 0.003 },
};

/** Share of answers a judge prefers after `rounds` of feedback (percent, 50–ceiling). */
export function winRate(rounds: number, mode: FeedbackMode): number {
  const c = CURVES[mode];
  const n = Math.max(0, Math.min(MAX_ROUNDS, rounds));
  return c.ceiling - (c.ceiling - 50) * Math.exp(-c.rate * n);
}

/** Sample the win-rate curve as [round, percent] points for a d3 line. */
export function winCurve(mode: FeedbackMode, samples = 60): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const r = (i / samples) * MAX_ROUNDS;
    pts.push([r, winRate(r, mode)]);
  }
  return pts;
}
