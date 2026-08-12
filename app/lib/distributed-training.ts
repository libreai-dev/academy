/**
 * Pure logic + data for the "Distributed training" lesson (Stage 0 · Phase 2).
 * No React, no d3 — every scene's numbers and rules live here so the diagrams
 * and controls in `DistributedTraining.tsx` stay thin and the maths is testable.
 *
 * Numbers are realistic-but-illustrative. The anchor model is the classic ZeRO
 * example: 7.5 billion parameters trained with mixed-precision Adam, which costs
 * ~16 bytes per parameter (2 weight + 2 gradient + 12 optimizer) ≈ 120 GB. The
 * point is the *shape* of each trade-off, not a benchmark.
 */

/** Anchor model: 7.5B params, the classic ZeRO paper example. */
export const MODEL_PARAMS = 7.5e9;
export const MODEL_LABEL = "7.5B";

/** Per-parameter memory of mixed-precision Adam, in bytes (2 + 2 + 12 = 16). */
export const BYTES_PARAMS = 2; //   fp16 weights
export const BYTES_GRADS = 2; //    fp16 gradients
export const BYTES_OPTIM = 12; //   fp32 master copy (4) + momentum (4) + variance (4)

/** The three memory chunks, in GB (1 GB = 1e9 bytes here, for round numbers). */
export const GB_PARAMS = (MODEL_PARAMS * BYTES_PARAMS) / 1e9; // 15
export const GB_GRADS = (MODEL_PARAMS * BYTES_GRADS) / 1e9; //  15
export const GB_OPTIM = (MODEL_PARAMS * BYTES_OPTIM) / 1e9; //  90
export const GB_TOTAL = GB_PARAMS + GB_GRADS + GB_OPTIM; //     120

/** One modern accelerator's memory (an NVIDIA H100 has 80 GB). */
export const GPU_CAP_GB = 80;

/* ======================================================================== *
 * NODE 1 — Data parallel: replicate the model, split the batch.
 * ======================================================================== */

/** Micro-batch each replica processes per step (illustrative). */
export const MICRO_BATCH = 8;

export interface DataParallelStat {
  gpus: number;
  globalBatch: number;
  /** Throughput relative to one GPU (ideal linear scaling). */
  throughput: number;
  /** Every replica still holds one full model — this never shrinks. */
  modelGB: number;
}

export function dataParallel(gpus: number): DataParallelStat {
  return {
    gpus,
    globalBatch: gpus * MICRO_BATCH,
    throughput: gpus,
    modelGB: GB_TOTAL,
  };
}

/* ======================================================================== *
 * NODE 3 — ZeRO / FSDP: shard optimizer state, gradients, params.
 * ======================================================================== */

export type ZeroStage = "ddp" | "zero1" | "zero2" | "zero3";
export const ZERO_STAGES: ZeroStage[] = ["ddp", "zero1", "zero2", "zero3"];

export interface MemBreakdown {
  params: number;
  grads: number;
  optim: number;
  total: number;
  fits: boolean;
}

/**
 * Memory one GPU must hold, in GB, for a given ZeRO stage sharded over N GPUs.
 *   ddp   — nothing sharded: full params + grads + optimizer state.
 *   zero1 — shard optimizer state (the 12 bytes).
 *   zero2 — also shard gradients.
 *   zero3 — also shard parameters (FSDP): every chunk divided by N.
 */
export function memPerGpu(stage: ZeroStage, n: number): MemBreakdown {
  const N = Math.max(1, n);
  let params = GB_PARAMS;
  let grads = GB_GRADS;
  let optim = GB_OPTIM;
  if (stage === "zero1") {
    optim = GB_OPTIM / N;
  } else if (stage === "zero2") {
    grads = GB_GRADS / N;
    optim = GB_OPTIM / N;
  } else if (stage === "zero3") {
    params = GB_PARAMS / N;
    grads = GB_GRADS / N;
    optim = GB_OPTIM / N;
  }
  const total = params + grads + optim;
  return { params, grads, optim, total, fits: total <= GPU_CAP_GB };
}

/** Tidy GB formatter — one decimal below 100, whole numbers at/above. */
export function fmtGB(gb: number): string {
  if (gb >= 100) return `${Math.round(gb)}`;
  if (gb >= 10) return gb.toFixed(0);
  return gb.toFixed(1);
}
