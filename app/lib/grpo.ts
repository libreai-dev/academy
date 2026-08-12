/**
 * Stage 0 · 4.5 — GRPO. Pure logic + illustrative data (no React, no d3).
 *
 * One idea: GRPO drops PPO's memory-heavy critic. It samples a GROUP of answers
 * per prompt and scores each one relative to the group's average — simpler and
 * cheaper. This module holds the memory model (Node 1), the group fan-out
 * numbers (Node 2), and the group→mean→advantage maths (Node 3). All figures are
 * realistic-but-illustrative round numbers.
 */

/* ---- Node 1: what sits in memory during RL --------------------------------
 * A *trained* network needs weights + gradients + optimizer state; a *frozen*
 * one only needs weights for inference. We express both as bytes-per-parameter
 * so the saving scales with model size. These are the standard mixed-precision
 * ballpark figures (fp16 weights+grads + Adam master/m/v ≈ 16 B/param trained;
 * ≈ 2 B/param for a frozen fp16 model).
 */
export const BYTES_TRAINED = 16; // weights + grads + optimizer state
export const BYTES_FROZEN = 2; //   inference-only fp16 weights

export interface RlNet {
  /** copy-provided display name is passed separately; this is a stable key */
  key: "policy" | "critic" | "reward" | "reference";
  trained: boolean;
}

/** The stacks. GRPO is PPO minus the critic. */
export const PPO_NETS: RlNet[] = [
  { key: "policy", trained: true },
  { key: "critic", trained: true },
  { key: "reward", trained: false },
  { key: "reference", trained: false },
];
export const GRPO_NETS: RlNet[] = [
  { key: "policy", trained: true },
  { key: "reward", trained: false },
  { key: "reference", trained: false },
];

/** GB of GPU memory for one network of `paramsB` billion params. */
export function netGB(paramsB: number, trained: boolean): number {
  const bytes = paramsB * 1e9 * (trained ? BYTES_TRAINED : BYTES_FROZEN);
  return bytes / 1e9; // → GB
}

export function stackGB(nets: RlNet[], paramsB: number): number {
  return nets.reduce((s, n) => s + netGB(paramsB, n.trained), 0);
}

export interface MemoryModel {
  ppo: number; //    total GB
  grpo: number; //   total GB
  saved: number; //  GB removed with the critic
  savedPct: number; // % of PPO memory removed
}

export function memoryFor(paramsB: number): MemoryModel {
  const ppo = stackGB(PPO_NETS, paramsB);
  const grpo = stackGB(GRPO_NETS, paramsB);
  const saved = ppo - grpo;
  return { ppo, grpo, saved, savedPct: (saved / ppo) * 100 };
}

/** Model-size stops for the Node 1 slider (index → billions of params). */
export const MODEL_SIZES = [1, 7, 8, 13, 32, 70] as const;

/* ---- Node 2: one prompt → a group of answers ------------------------------
 * Illustrative per-answer reward scores (0–10) for a full group of 8. The
 * slider slices the first G of them, so the fan-out is deterministic.
 */
export const GROUP_REWARDS = [8.1, 4.2, 6.7, 2.9, 7.4, 5.0, 9.2, 3.6];
export const G_MIN = 2;
export const G_MAX = 8;

/* ---- Node 3: group → mean → per-answer advantage --------------------------
 * A handful of preset batches, each teaching one shape of signal. Rewards are on
 * a 0–10 scale; labels/notes live in copy. Keyed so copy can pair a label+note.
 */
export const ADV_PRESETS: Record<string, number[]> = {
  mixed: [8.1, 4.2, 6.7, 2.9, 7.4, 5.0],
  flat: [5.4, 5.1, 5.6, 4.9, 5.3, 5.2],
  standout: [9.4, 3.1, 2.8, 3.6, 2.4, 3.0],
};
export const ADV_PRESET_KEYS = ["mixed", "flat", "standout"] as const;
export type AdvPresetKey = (typeof ADV_PRESET_KEYS)[number];

export interface AdvItem {
  reward: number;
  advantage: number; //  normalized: (reward − mean) / std
  raw: number; //        reward − mean (for the bar deflection)
}

export interface AdvGroup {
  items: AdvItem[];
  mean: number;
  std: number;
  up: number; //   count above the mean
  down: number; // count below the mean
}

function meanOf(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}
function stdOf(xs: number[], m: number): number {
  const v = xs.reduce((s, x) => s + (x - m) * (x - m), 0) / xs.length;
  return Math.sqrt(v);
}

/** Compute group mean, spread, and each answer's (normalized) advantage. */
export function advantages(rewards: number[]): AdvGroup {
  const mean = meanOf(rewards);
  const std = stdOf(rewards, mean);
  const safe = std < 1e-6 ? 1 : std; // avoid /0 on a perfectly flat group
  const items: AdvItem[] = rewards.map((r) => ({
    reward: r,
    raw: r - mean,
    advantage: (r - mean) / safe,
  }));
  const eps = 0.05; // treat near-mean answers as neither pushed up nor down
  const up = items.filter((i) => i.raw > eps).length;
  const down = items.filter((i) => i.raw < -eps).length;
  return { items, mean, std, up, down };
}

export function fmt1(n: number): string {
  return n.toFixed(1);
}
