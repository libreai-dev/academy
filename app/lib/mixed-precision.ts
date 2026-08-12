/**
 * Stage 0 · 2.5 — Mixed-precision training. Pure logic + data (no React, no d3).
 *
 * One idea: training runs the math in low-precision numbers (BF16 / FP8) for
 * speed and memory, while a full-precision FP32 master copy plus loss scaling
 * keep the tiniest gradients from rounding away to zero.
 *
 * Everything here is deliberately illustrative-but-honest: the bit widths and
 * representable ranges are the real IEEE / OCP numbers; the memory figures are
 * rounded to teach the shape of the trade-off, not to bill a datacentre.
 */

/* ------------------------------------------------------------------ formats */

export type FormatKey = "fp32" | "bf16" | "fp8";

export interface NumFormat {
  key: FormatKey;
  /** Display name (proper noun — same in both languages). */
  name: string;
  bits: number;
  bytes: number; //          bytes per number
  sign: number; //           sign bits (always 1)
  exponent: number; //       exponent bits → dynamic RANGE
  mantissa: number; //       mantissa/fraction bits → PRECISION
  /** Largest finite magnitude the format can hold (order of magnitude). */
  maxAbs: string;
  /** Roughly how many decimal significant digits it keeps. */
  sigDigits: string;
  /** Relative tensor-core throughput vs FP32 (illustrative, modern GPU). */
  speed: number;
}

/** The three formats, ordered wide → narrow. FP8 here is the E4M3 variant. */
export const FORMATS: NumFormat[] = [
  { key: "fp32", name: "FP32", bits: 32, bytes: 4, sign: 1, exponent: 8, mantissa: 23, maxAbs: "3.4 × 10³⁸", sigDigits: "~7 digits", speed: 1 },
  { key: "bf16", name: "BF16", bits: 16, bytes: 2, sign: 1, exponent: 8, mantissa: 7, maxAbs: "3.4 × 10³⁸", sigDigits: "~2–3 digits", speed: 2 },
  { key: "fp8", name: "FP8", bits: 8, bytes: 1, sign: 1, exponent: 4, mantissa: 3, maxAbs: "448", sigDigits: "~1 digit", speed: 4 },
];

export function formatOf(key: FormatKey): NumFormat {
  return FORMATS.find((f) => f.key === key) ?? FORMATS[0];
}

/* --------------------------------------------------- loss scaling / underflow */

/**
 * The smallest positive value FP16 can hold before a number rounds to exactly
 * zero (its denormal minimum, ~2^-24 ≈ 6e-8). We use FP16 as the loss-scaling
 * demo format because its narrow 5-bit exponent is exactly what makes tiny
 * gradients underflow — the problem BF16's wide 8-bit exponent mostly dodges.
 */
export const FP16_MIN_POS = Math.pow(2, -24); // ≈ 5.96e-8

/** A handful of real-looking gradient magnitudes spanning many decades. */
export const SAMPLE_GRADS: number[] = [3.2e-3, 8.0e-5, 4.5e-7, 6.0e-9, 9.0e-11];

export interface GradRow {
  raw: number; //      the true gradient magnitude
  scaled: number; //   raw × lossScale (what actually gets stored in FP16)
  survives: boolean; // scaled ≥ FP16 floor → not flushed to zero
}

/** Apply a loss scale S and report which gradients survive FP16's floor. */
export function scaleGrads(lossScale: number): GradRow[] {
  return SAMPLE_GRADS.map((raw) => {
    const scaled = raw * lossScale;
    return { raw, scaled, survives: scaled >= FP16_MIN_POS };
  });
}

export function countSurviving(rows: GradRow[]): number {
  return rows.filter((r) => r.survives).length;
}

/** Format a magnitude compactly as "m.m e±e" for a mono readout. */
export function sci(x: number): string {
  if (x === 0) return "0";
  const exp = Math.floor(Math.log10(x));
  const mant = x / Math.pow(10, exp);
  return `${mant.toFixed(1)}e${exp}`;
}

/* -------------------------------------------------------------- memory budget */

/** The illustrative training model — a ~1.5B-parameter transformer. */
export const MODEL = { label: "1.5B-param model", params: 1.5e9 };

/** One H100-class accelerator. */
export const GPU_CAPACITY_GB = 80;

/**
 * Fixed "model-state" memory: weights + gradients + Adam optimizer moments.
 * The surprise this teaches: it's ~16 bytes/param **either way**. Mixed
 * precision trades smaller BF16 weights for an extra FP32 master copy, and Adam
 * keeps its two moments in FP32 regardless — so lowering precision barely moves
 * this bar. The real win is in activations (below) and in raw speed.
 */
export const MODEL_STATE_BYTES_PER_PARAM = 16;

export function modelStateGB(): number {
  return (MODEL.params * MODEL_STATE_BYTES_PER_PARAM) / 1e9;
}

/**
 * Activation memory — the variable part that actually blows the budget.
 * Illustrative: per micro-batch item at BF16 with no checkpointing. FP32
 * doubles it; gradient checkpointing recomputes activations in the backward
 * pass instead of storing them, cutting it by ~CKPT_DIV.
 */
export const ACT_GB_PER_ITEM_BF16 = 9;
export const CKPT_DIV = 5;

export interface MemBudget {
  modelStateGB: number;
  activationGB: number;
  totalGB: number;
  capacityGB: number;
  fits: boolean;
  effectiveBatch: number;
}

export function memBudget(o: {
  precision: "fp32" | "bf16";
  checkpoint: boolean;
  microBatch: number;
  accumSteps: number;
}): MemBudget {
  const precFactor = o.precision === "fp32" ? 2 : 1; // FP32 activations are 2× BF16
  let activationGB = o.microBatch * ACT_GB_PER_ITEM_BF16 * precFactor;
  if (o.checkpoint) activationGB = activationGB / CKPT_DIV;
  const states = modelStateGB();
  const totalGB = states + activationGB;
  return {
    modelStateGB: states,
    activationGB,
    totalGB,
    capacityGB: GPU_CAPACITY_GB,
    fits: totalGB <= GPU_CAPACITY_GB,
    effectiveBatch: o.microBatch * o.accumSteps,
  };
}
