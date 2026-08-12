/**
 * Stage 0 · Phase 4.4 — PPO. Pure, React-free logic for the three nodes:
 * the actor–critic cast, the clipped step, and the KL-leash trade-off.
 * Numbers are illustrative but directionally honest.
 */

/** The four players in the loop, in a stable order the UI toggles map to. */
export type PpoRole = "policy" | "reference" | "reward" | "critic";
export const PPO_ROLES: PpoRole[] = ["policy", "reference", "reward", "critic"];

/* ---- Node 2: the clipped step ------------------------------------------ */

export interface ClipResult {
  ratio: number; //    proposed r = π_new / π_old for the token
  applied: number; //  effective ratio after the clip (for the pushed side)
  clipped: boolean; // did the clip actually bite?
  good: boolean; //    advantage sign — a token we want more (true) or less (false) of
  lo: number; //       band floor 1 − ε
  hi: number; //       band ceiling 1 + ε
}

/**
 * PPO's clipped surrogate caps how far one step may move a token's probability.
 * For a good token (advantage > 0) the reward for pushing up stops at 1 + ε;
 * for a bad token (advantage < 0) the push down stops at 1 − ε.
 */
export function clipStep(ratio: number, epsilon: number, good: boolean): ClipResult {
  const lo = 1 - epsilon;
  const hi = 1 + epsilon;
  const applied = good ? Math.min(ratio, hi) : Math.max(ratio, lo);
  const clipped = good ? ratio > hi : ratio < lo;
  return { ratio, applied, clipped, good, lo, hi };
}

/* ---- Node 3: the KL-leash trade-off ------------------------------------ */

export type PpoRegime = "stuck" | "healthy" | "hacking";

export interface PpoOutcome {
  drift: number; //    how far the policy wandered from the reference (a KL-like distance, 0–10)
  rmScore: number; //  what the reward model reports (0–100) — keeps rising as the model games it
  quality: number; //  true answer quality (0–100) — rises then collapses
  regime: PpoRegime;
}

/**
 * A toy model of the RLHF trade-off. Looser clip (bigger ε) and a weaker leash
 * (smaller β) let the policy drift further. The reward-model score climbs with
 * drift and plateaus high — because the policy learns to game the scorer — while
 * true quality peaks at a small controlled drift and then collapses.
 */
export function ppoOutcome(epsilon: number, beta: number): PpoOutcome {
  const drift = Math.min(10, (epsilon * 24) / (0.3 + beta * 8));
  const rmScore = Math.round(100 * (1 - Math.exp(-drift / 2.2)));
  const quality = Math.round(8 + 84 * Math.exp(-((drift - 2.6) ** 2) / (2 * 1.7 * 1.7)));
  const regime: PpoRegime = drift < 1.3 ? "stuck" : drift > 4.5 ? "hacking" : "healthy";
  return { drift, rmScore, quality, regime };
}
