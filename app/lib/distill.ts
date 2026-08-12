/**
 * Pure logic + data for the "Model distillation" article (Stage 0 · Phase 4.2).
 * No React, no d3 — every node's numbers and rules live here so the diagrams and
 * controls in `Distill.tsx` stay thin and testable.
 *
 * Numbers are deliberately realistic-but-illustrative (a 70B teacher, a ~$380
 * T4 month, a 2B reasoning floor). The point is the *shape* of each trade-off,
 * not a benchmark. Where a figure is a stand-in, the copy says so.
 */

/* ======================================================================== *
 * NODE 1 — The efficiency bottleneck (teacher → student compression)
 * A frontier teacher is too big for an edge budget. Shrinking parameters and
 * quantizing weights fits it in memory — at some cost to how much of the
 * teacher's quality the student can retain.
 * ======================================================================== */

/** The frontier teacher we're distilling from, in billions of parameters. */
export const TEACHER_B = 70;

export interface FitPreset {
  key: string;
  /** Student size, billions of parameters. */
  params: number;
  /** Weight precision, bits per parameter. */
  bits: number;
}

/** Named starting points the learner can scroll-cycle through. */
export const FIT_PRESETS: FitPreset[] = [
  { key: "edge", params: 1, bits: 8 },
  { key: "laptop", params: 3, bits: 8 },
  { key: "enterprise", params: 8, bits: 4 },
];

/** Edge VRAM budget the student must fit inside (GB). */
export const VRAM_BUDGET_GB = 8;

export interface FitResult {
  /** Memory footprint of weights + KV/activation overhead, GB. */
  vramGB: number;
  /** How much of the teacher's benchmark quality the student keeps, %. */
  retention: number;
  fits: boolean;
  passed: boolean;
}

/** Weights (bits/8 bytes each) plus a flat ~15% for KV cache + activations. */
export function fitStudent(params: number, bits: number): FitResult {
  const vramGB = +(params * (bits / 8) * 1.15).toFixed(1);
  // Retention rises with log-parameters (diminishing), minus a small quant tax.
  const base = 50 + 20 * Math.log2(params + 0.5);
  const quantTax = bits >= 16 ? 0 : bits >= 8 ? 1.5 : 4.5;
  const retention = +Math.max(0, Math.min(96, base - quantTax)).toFixed(1);
  const fits = vramGB <= VRAM_BUDGET_GB;
  return { vramGB, retention, fits, passed: fits && retention >= 82 };
}

/* ======================================================================== *
 * NODE 2 — Logit matching & soft targets (temperature-scaled softmax)
 * A hard label is one-hot. The teacher's *soft* distribution carries "dark
 * knowledge" — that "road" is near "street" while "apple" is absurd. Raising
 * temperature T magnifies that secondary signal.
 * ======================================================================== */

/** Vocabulary + teacher logits for the prompt "The animal crossed the ___". */
export const LOGIT_VOCAB = ["street", "road", "highway", "river", "table", "apple"] as const;
export type Word = (typeof LOGIT_VOCAB)[number];
export const TEACHER_LOGITS: Record<Word, number> = {
  street: 4.0,
  road: 3.0,
  highway: 1.5,
  river: 0.5,
  table: -2.0,
  apple: -3.0,
};

export interface SoftTargets {
  probs: Record<Word, number>;
  top1: Word;
  top1Prob: number;
  /** Probability mass on every token *except* the top one (the dark knowledge). */
  secondaryMass: number;
  /** Shannon entropy of the distribution, in bits. */
  entropyBits: number;
  /** Growth in secondary mass vs. the T = 1 distribution, %. */
  darkGain: number;
}

function softmaxAt(t: number): Record<Word, number> {
  const exps = LOGIT_VOCAB.map((w) => Math.exp(TEACHER_LOGITS[w] / t));
  const z = exps.reduce((a, b) => a + b, 0);
  const out = {} as Record<Word, number>;
  LOGIT_VOCAB.forEach((w, i) => (out[w] = exps[i] / z));
  return out;
}

const SECONDARY_AT_1 = (() => {
  const p = softmaxAt(1);
  const top = Math.max(...LOGIT_VOCAB.map((w) => p[w]));
  return 1 - top;
})();

/** Soften the teacher distribution at temperature `t` (t ≥ 1 flattens it). */
export function softTargets(t: number): SoftTargets {
  const probs = softmaxAt(t);
  let top1: Word = LOGIT_VOCAB[0];
  LOGIT_VOCAB.forEach((w) => {
    if (probs[w] > probs[top1]) top1 = w;
  });
  const top1Prob = probs[top1];
  const secondaryMass = 1 - top1Prob;
  const entropyBits = -LOGIT_VOCAB.reduce((s, w) => {
    const p = probs[w];
    return s + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
  const darkGain = +(((secondaryMass - SECONDARY_AT_1) / SECONDARY_AT_1) * 100).toFixed(0);
  return {
    probs,
    top1,
    top1Prob: +top1Prob.toFixed(3),
    secondaryMass: +secondaryMass.toFixed(3),
    entropyBits: +entropyBits.toFixed(2),
    darkGain,
  };
}

/* ======================================================================== *
 * NODE 3 — Behavioral cloning via synthetic pipelines (sequence-level)
 * Full logits are infeasible across tokenizers / closed APIs. Instead the
 * teacher *generates* completions (optionally with reasoning traces) and the
 * student runs plain supervised fine-tuning on that text.
 * ======================================================================== */

export type CloneMode = "raw" | "cot";

/** A bare teacher completion (no visible reasoning). */
export const RAW_COMPLETION = `Q: A train travels 60 km in 1.5 h. Average speed?

A: 40 km/h`;

/** The same answer with a reasoning trace the student learns to imitate. */
export const COT_COMPLETION = `Q: A train travels 60 km in 1.5 h. Average speed?

A: <thought>
Speed = distance / time.
distance = 60 km, time = 1.5 h.
60 / 1.5 = 40.
</thought>
Average speed = 40 km/h.`;

export interface CloneYield {
  /** Student pass@1 on a code/math benchmark, 0–100. */
  score: number;
  /** Teacher-cluster generation time, hours. */
  genHours: number;
  passed: boolean;
}

/** Student benchmark from `volumeB` billion generated tokens, ± reasoning traces. */
export function cloneYield(volumeB: number, mode: CloneMode): CloneYield {
  const base = 40 + 8 * Math.log2(volumeB + 1);
  const cotBonus = mode === "cot" ? 14 : 0;
  const score = +Math.max(0, Math.min(92, base + cotBonus)).toFixed(1);
  const genHours = +(volumeB * 0.42).toFixed(1);
  return { score, genHours, passed: score >= 80 };
}

/* ======================================================================== *
 * NODE 4 — On-policy vs off-policy distillation (exposure bias)
 * Off-policy: the student reads static teacher text; one early slip drops it
 * into a state it never saw, and errors compound. On-policy: the student
 * generates its own rollout, the teacher scores *that* trajectory, and the
 * student learns to recover — so error stays bounded with length.
 * ======================================================================== */

const PER_STEP_ERR = 0.0045; // per-token slip probability

export interface TrajectoryAudit {
  onPolicy: boolean;
  /** Chance the sequence has drifted off-distribution by the end, %. */
  compoundErr: number;
  /** The off-policy error at the same length, for the readout comparison, %. */
  offErr: number;
  /** Teacher forward-pass cost per step (fixed), ms. */
  evalMs: number;
  passed: boolean;
}

/** Compound error over a `len`-token rollout, on- or off-policy. */
export function trajectoryAudit(len: number, onPolicy: boolean): TrajectoryAudit {
  // Off-policy: independent slips accumulate over the full length.
  const offErr = +((1 - Math.pow(1 - PER_STEP_ERR, len)) * 100).toFixed(1);
  // On-policy: the teacher pulls the student back each step, so the effective
  // horizon is a small fraction of the length — error plateaus low.
  const onErr = +((1 - Math.pow(1 - PER_STEP_ERR, len * 0.075)) * 100).toFixed(1);
  const compoundErr = onPolicy ? onErr : offErr;
  return { onPolicy, compoundErr, offErr, evalMs: 18, passed: compoundErr < 5 };
}

/* ======================================================================== *
 * NODE 5 — Edge deployment & enterprise economics
 * A distilled SLM can run three ways. Each trades throughput, cost, latency,
 * and data privacy differently.
 * ======================================================================== */

export type Hardware = "device" | "cloud" | "gateway";

export interface HwDef {
  key: Hardware;
  /** Sustained decode throughput, tokens/sec. */
  tokPerSec: number;
  /** Monthly infra cost, USD (0 = runs on the user's own device). */
  monthlyUSD: number;
  /** Latency per query, ms. */
  latencyMs: number;
  /** True when data never leaves the user's device. */
  privateOnDevice: boolean;
  /** Effectively unlimited (per-user distributed) capacity. */
  distributed: boolean;
}

export const HARDWARE: Record<Hardware, HwDef> = {
  device: { key: "device", tokPerSec: 42, monthlyUSD: 0, latencyMs: 55, privateOnDevice: true, distributed: true },
  cloud: { key: "cloud", tokPerSec: 1200, monthlyUSD: 380, latencyMs: 22, privateOnDevice: false, distributed: false },
  gateway: { key: "gateway", tokPerSec: 90, monthlyUSD: 120, latencyMs: 140, privateOnDevice: false, distributed: false },
};

export const DEPLOY_BUDGET_USD = 500;
const TOKENS_PER_QUERY = 300;

export interface DeployResult {
  tokPerSec: number;
  monthlyUSD: number;
  latencyMs: number;
  /** Queries/day the target can serve (Infinity for distributed on-device). */
  capacity: number;
  /** True when it serves the requested volume under budget. */
  passed: boolean;
  privateOnDevice: boolean;
}

/** Evaluate `volume` daily queries against a hardware target. */
export function deploy(hw: Hardware, volume: number): DeployResult {
  const d = HARDWARE[hw];
  const capacity = d.distributed ? Infinity : Math.round((d.tokPerSec * 86400) / TOKENS_PER_QUERY);
  const passed = d.monthlyUSD <= DEPLOY_BUDGET_USD && capacity >= volume;
  return {
    tokPerSec: d.tokPerSec,
    monthlyUSD: d.monthlyUSD,
    latencyMs: d.latencyMs,
    capacity,
    passed,
    privateOnDevice: d.privateOnDevice,
  };
}

/* ======================================================================== *
 * NODE 6 — Style mimicry, hallucination amplification & the reasoning floor
 * Distillation copies the teacher's *style* long before it earns the teacher's
 * *reasoning*. Below ~2B parameters a hard capacity floor caps multi-step
 * logic no matter how much synthetic data you pour in.
 * ======================================================================== */

/** Parameter size (B) below which the reasoning floor bites. */
export const REASONING_FLOOR_B = 2;

export interface LimitResult {
  /** Multi-step reasoning capacity at this size, 0–100. */
  reasoning: number;
  /** True when above the hard floor. */
  aboveFloor: boolean;
  latencyMs: number;
  /** Inherited-hallucination rate, %. */
  hallucination: number;
  /** True in the 3–8B "maximum intelligence per byte" sweet spot. */
  sweetSpot: boolean;
  passed: boolean;
}

/** Sample the size→capacity curve at `params` billion parameters. */
export function reasoningLimit(params: number): LimitResult {
  const reasoning = +Math.max(
    0,
    Math.min(96, 20 + 76 / (1 + Math.exp(-1.5 * (Math.log2(params) - 1.0)))),
  ).toFixed(1);
  const hallucination = +Math.max(1, 8 - 2.4 * Math.log2(params + 0.5)).toFixed(1);
  const latencyMs = +(params * 9).toFixed(0);
  const aboveFloor = params >= REASONING_FLOOR_B;
  const sweetSpot = params >= 3 && params <= 8;
  return {
    reasoning,
    aboveFloor,
    latencyMs,
    hallucination,
    sweetSpot,
    passed: aboveFloor && latencyMs <= 100 && reasoning >= 70,
  };
}

/** Sampled points of the size→reasoning curve for the Node 6 diagram. */
export function reasoningCurve(): { params: number; reasoning: number }[] {
  const pts: { params: number; reasoning: number }[] = [];
  for (let lp = -1; lp <= 3.9; lp += 0.1) {
    const params = Math.pow(2, lp);
    pts.push({ params, reasoning: reasoningLimit(params).reasoning });
  }
  return pts;
}
