/**
 * Stage 0 · 2.5·4 — Matrix optimizers (AdamW vs Lion / Adafactor / Muon).
 * Pure logic + illustrative data (no React, no d3). Numbers are realistic but
 * illustrative — they teach the shape of the trade-off, not a benchmark result.
 */

export type OptKey = "adamw" | "lion" | "adafactor" | "muon";

export interface OptSpec {
  key: OptKey;
  /** Extra numbers the optimizer keeps per weight (its "state"). */
  states: number;
  /** Optimizer-state bytes per weight (fp32 states). AdamW keeps m+v = 8 B. */
  bytesPerWeight: number;
  /** Convergence time-constant, in thousands of steps. Smaller = faster. */
  tauK: number;
  /** How touchy it is to tune, 0..1 (1 = rock-solid). Illustrative. */
  stability: number;
}

/** The four optimizers, in display order. AdamW is the baseline everything is compared to. */
export const OPTS: OptSpec[] = [
  { key: "adamw", states: 2, bytesPerWeight: 8, tauK: 58, stability: 0.95 },
  { key: "lion", states: 1, bytesPerWeight: 4, tauK: 56, stability: 0.68 },
  { key: "adafactor", states: 0.03, bytesPerWeight: 0.5, tauK: 61, stability: 0.74 },
  { key: "muon", states: 1, bytesPerWeight: 4, tauK: 40, stability: 0.86 },
];

export function optByKey(key: OptKey): OptSpec {
  return OPTS.find((o) => o.key === key) ?? OPTS[0];
}

export const ADAMW = OPTS[0];

/* ---- Node 1: AdamW's memory bill ------------------------------------------ */

/** Per-parameter bytes in standard mixed-precision AdamW training. */
export const BYTES = {
  weights: 2, //  fp16 weight
  grads: 2, //    fp16 gradient
  master: 4, //   fp32 master copy of the weight
  momentum: 4, // Adam's m (first moment) — fp32
  variance: 4, // Adam's v (second moment) — fp32
} as const;

export const BYTES_TOTAL =
  BYTES.weights + BYTES.grads + BYTES.master + BYTES.momentum + BYTES.variance; // 16

/** Optimizer state = the two extra numbers AdamW stores, m + v. */
export const BYTES_OPT_STATE = BYTES.momentum + BYTES.variance; // 8

export interface MemBreakdown {
  paramsB: number; //     model size in billions
  weightsGB: number;
  gradsGB: number;
  masterGB: number;
  momentumGB: number;
  varianceGB: number;
  totalGB: number;
  optStateGB: number; //  m + v only
}

/** GB per component for a model of `paramsB` billion parameters (1 B = 1 GB per byte/param). */
export function adamMemory(paramsB: number): MemBreakdown {
  const g = (b: number) => paramsB * b; // paramsB·1e9 params × b bytes / 1e9 = paramsB·b GB
  return {
    paramsB,
    weightsGB: g(BYTES.weights),
    gradsGB: g(BYTES.grads),
    masterGB: g(BYTES.master),
    momentumGB: g(BYTES.momentum),
    varianceGB: g(BYTES.variance),
    totalGB: g(BYTES_TOTAL),
    optStateGB: g(BYTES_OPT_STATE),
  };
}

/* ---- Node 2: state saved vs AdamW ----------------------------------------- */

/** Percent of AdamW's optimizer-state memory this optimizer saves. */
export function stateSavedPct(opt: OptSpec): number {
  return Math.round((1 - opt.bytesPerWeight / ADAMW.bytesPerWeight) * 100);
}

/* ---- Node 3: convergence curve -------------------------------------------- */

export const LOSS_START = 4.0; //   loss at step 0 (illustrative)
export const LOSS_FLOOR = 1.8; //   asymptotic loss floor
export const LOSS_TARGET = 2.2; //  the "good enough" loss we time everyone to
export const MAX_STEPS_K = 140; //  x-axis extent, thousands of steps

/** Loss at `stepK` thousand steps for an optimizer (smooth exponential decay). */
export function lossAt(opt: OptSpec, stepK: number): number {
  return LOSS_FLOOR + (LOSS_START - LOSS_FLOOR) * Math.exp(-stepK / opt.tauK);
}

/** Thousands of steps to reach LOSS_TARGET (rounded to the nearest 1k). */
export function stepsToTargetK(opt: OptSpec): number {
  const frac = (LOSS_TARGET - LOSS_FLOOR) / (LOSS_START - LOSS_FLOOR);
  return Math.round(opt.tauK * -Math.log(frac));
}

/** Sampled [stepK, loss] points for drawing a smooth curve. */
export function curvePoints(opt: OptSpec, samples = 64): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const s = (i / samples) * MAX_STEPS_K;
    pts.push([s, lossAt(opt, s)]);
  }
  return pts;
}

/** Format a GB figure compactly (e.g. 12.0 → "12 GB", 0.5 → "0.5 GB"). */
export function fmtGB(gb: number): string {
  if (gb >= 100) return `${Math.round(gb)} GB`;
  if (gb >= 10) return `${gb.toFixed(0)} GB`;
  return `${gb.toFixed(1)} GB`;
}
