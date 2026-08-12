/**
 * Stage 0 · 4.1 — Synthetic data. Pure per-node logic + data (no React, no d3).
 *
 * One idea: strong models generate and grade their own training data — evolving
 * harder instructions, writing reasoning traces, and keeping only the samples
 * that pass a verifier (rejection sampling). Builds on 4.4 (supervised
 * fine-tuning): SFT needs instruction→answer pairs; this is where they come from.
 */

/* ---- Node 1: instruction-evolution operators ---------------------------- */

export const OP_KEYS = ["constraints", "deepen", "concretize", "reasoning"] as const;
export type OpKey = (typeof OP_KEYS)[number];

/* ---- Node 2: how many discrete reveal steps the reasoning chain has ------ */
/** step 0 = prompt→answer only; 1..3 reveal reasoning lines; 4 = solidify. */
export const REASONING_STEPS = 5;

/* ---- Node 3: rejection-sampling funnel ---------------------------------- */

export type VerifierKey = "format" | "tests" | "judge";
/** Gates run cheapest → most expensive: a cheap format check before the judge. */
export const VERIFIER_ORDER: VerifierKey[] = ["format", "tests", "judge"];
/** The LLM judge cuts anything scoring below this (0–10). */
export const JUDGE_THRESHOLD = 7;

export interface Candidate {
  id: number;
  validFormat: boolean;
  passesTests: boolean;
  judgeScore: number; // 0–10
}

/** 12 generated candidates, tuned so each gate rejects a realistic slice:
 *  format drops 2, tests drops 3, judge drops 2 → 5 of 12 survive. */
export const CANDIDATES: Candidate[] = [
  { id: 1, validFormat: true, passesTests: true, judgeScore: 9 },
  { id: 2, validFormat: true, passesTests: true, judgeScore: 8 },
  { id: 3, validFormat: true, passesTests: true, judgeScore: 7 },
  { id: 4, validFormat: true, passesTests: true, judgeScore: 6 }, // judge cuts
  { id: 5, validFormat: true, passesTests: true, judgeScore: 4 }, // judge cuts
  { id: 6, validFormat: true, passesTests: false, judgeScore: 8 }, // tests cut
  { id: 7, validFormat: true, passesTests: false, judgeScore: 5 }, // tests cut
  { id: 8, validFormat: true, passesTests: false, judgeScore: 9 }, // tests cut
  { id: 9, validFormat: false, passesTests: true, judgeScore: 9 }, // format cuts
  { id: 10, validFormat: false, passesTests: false, judgeScore: 3 }, // format cuts
  { id: 11, validFormat: true, passesTests: true, judgeScore: 10 },
  { id: 12, validFormat: true, passesTests: true, judgeScore: 8 },
];

/** Does a candidate fail one gate's check? */
export function failsGate(c: Candidate, g: VerifierKey): boolean {
  if (g === "format") return !c.validFormat;
  if (g === "tests") return !c.passesTests;
  return c.judgeScore < JUDGE_THRESHOLD;
}

/** Walk the active gates in order; a candidate is kept only if it clears them all. */
export function verdictFor(
  c: Candidate,
  active: Record<VerifierKey, boolean>,
): { kept: boolean; failedAt: VerifierKey | null } {
  for (const g of VERIFIER_ORDER) {
    if (active[g] && failsGate(c, g)) return { kept: false, failedAt: g };
  }
  return { kept: true, failedAt: null };
}

export interface FunnelStage {
  key: VerifierKey;
  active: boolean;
  before: number;
  after: number;
  dropped: number;
}

export interface FunnelStats {
  generated: number;
  kept: number;
  dropped: number;
  stages: FunnelStage[]; // one per gate, in VERIFIER_ORDER
}

/** Running survivor counts through the (active) gates — drives the funnel bars. */
export function funnelStats(active: Record<VerifierKey, boolean>): FunnelStats {
  let survivors = CANDIDATES.slice();
  const stages: FunnelStage[] = VERIFIER_ORDER.map((g) => {
    const before = survivors.length;
    if (active[g]) survivors = survivors.filter((c) => !failsGate(c, g));
    const after = survivors.length;
    return { key: g, active: active[g], before, after, dropped: before - after };
  });
  return {
    generated: CANDIDATES.length,
    kept: survivors.length,
    dropped: CANDIDATES.length - survivors.length,
    stages,
  };
}
