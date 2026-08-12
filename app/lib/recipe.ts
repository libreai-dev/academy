/**
 * Pure logic + data for the "Data recipe & synthetic expansion" lesson
 * (Stage 0 · Phase 0.5). No React, no d3 — every node's numbers and rules live
 * here so the diagrams and controls in `Recipe.tsx` stay thin and testable.
 *
 * Numbers are deliberately realistic-but-illustrative (a ~15 T-token recipe, a
 * ~$0.15 / M-token teacher price, a 2× epoch cap). The point is the shape of each
 * trade-off, not a benchmark. Where a figure is a stand-in, the copy says so.
 */

/* ======================================================================== *
 * NODE 1 — The domain mixer (why the natural web mix fails)
 * Sliders set the target token mix; density buys reasoning, but starving web
 * text of its share triggers linguistic drift.
 * ======================================================================== */

export type DomainKey = "web" | "code" | "math" | "books";

export interface DomainDef {
  key: DomainKey;
  /** Natural share of the raw crawl (%), before any upsampling. */
  natural: number;
}

/** The four human-written pools, with their natural (raw-web) shares. */
export const DOMAINS: DomainDef[] = [
  { key: "web", natural: 82 },
  { key: "code", natural: 9 },
  { key: "math", natural: 2 },
  { key: "books", natural: 7 },
];

export type Mix = Record<DomainKey, number>;

/** Named starting points the learner can scroll-cycle through. */
export const RECIPE_PRESETS: { key: string; mix: Mix }[] = [
  { key: "raw", mix: { web: 82, code: 9, math: 2, books: 7 } },
  { key: "balanced", mix: { web: 20, code: 30, math: 25, books: 25 } },
  { key: "reasoner", mix: { web: 15, code: 38, math: 32, books: 15 } },
  { key: "overfit", mix: { web: 4, code: 48, math: 46, books: 2 } },
];

export interface RecipeScore {
  /** 0–100 — how much multi-step reasoning signal the mix carries. */
  reasoning: number;
  /** Held-out language perplexity; ~11 is healthy, rises as web starves. */
  perplexity: number;
  /** True when general web text is too thin to hold language together. */
  drift: boolean;
  /** Max sustainable epochs before the scarce domains must repeat too hard. */
  maxEpochs: number;
  passed: boolean;
}

/** Reasoning rewards code/math/books density; drift punishes starving web text. */
export function scoreMix(mix: Mix): RecipeScore {
  const { web, code, math, books } = mix;
  const reasoning = Math.max(
    0,
    Math.min(100, 15 + code * 0.9 + math * 1.3 + books * 0.4 + web * 0.1),
  );
  // Held-out language perplexity: optimal in a band; rises hard once general
  // web text drops below ~15% (idioms, world knowledge, fluency starve).
  const starve = Math.max(0, 15 - web);
  const crowd = Math.max(0, code + math - 80);
  const perplexity = +(11 + starve * 0.9 + crowd * 1.4).toFixed(1);
  const drift = web < 10 || code + math > 80;
  // The rarer the domain, the sooner it exhausts unique tokens — a proxy for
  // how many epochs the mix can run before the scarce pools repeat too hard.
  const scarce = Math.min(1, (code + math) / 100);
  const maxEpochs = +(1 + (1 - scarce) * 1.4).toFixed(1);
  const passed = reasoning > 85 && !drift;
  return { reasoning, perplexity, drift, maxEpochs, passed };
}

/* ======================================================================== *
 * NODE 2 — Temperature sampling (one knob turns natural freq into target freq)
 * q_i = p_i^τ / Σ p_j^τ.  τ=1 → natural; τ→0 → uniform (rare classes boosted).
 * ======================================================================== */

/** Natural token frequency of each domain in the raw crawl (sums to 1). */
export const NATURAL_FREQ: Mix = { web: 0.8, code: 0.1, math: 0.02, books: 0.08 };

/** Apply domain-temperature τ to the natural frequencies. */
export function temperatureMix(tau: number): Mix {
  const keys: DomainKey[] = ["web", "code", "math", "books"];
  const powed = keys.map((k) => Math.pow(NATURAL_FREQ[k], tau));
  const z = powed.reduce((s, v) => s + v, 0);
  const out = {} as Mix;
  keys.forEach((k, i) => (out[k] = powed[i] / z));
  return out;
}

/* ======================================================================== *
 * NODE 3 — The repetition / epoch cliff
 * One token of dense reasoning code beats one of web chatter — up to a point.
 * Past ~2–3 epochs the scarce domain is memorised, not learned, and validation
 * loss spikes. A cap truncates reuse before the cliff.
 * ======================================================================== */

export interface LossPoint {
  epoch: number;
  loss: number;
  /** True once the model is past the safe zone (memorising, not learning). */
  overfit: boolean;
}

/** Sample the validation-loss curve out to `cap` epochs (0.1-epoch steps). */
export function lossCurve(cap: number): LossPoint[] {
  const pts: LossPoint[] = [];
  const CLIFF = 2.5; // epochs at which reuse stops helping and starts hurting
  for (let e = 0; e <= cap + 1e-9; e += 0.1) {
    const ep = +e.toFixed(1);
    // Diminishing-returns descent until the cliff, then a rising memorisation
    // penalty that grows quadratically with the overshoot.
    const descent = 2.6 * Math.exp(-ep / 1.15) + 1.55;
    const over = ep > CLIFF ? 0.32 * (ep - CLIFF) ** 2 : 0;
    pts.push({ epoch: ep, loss: +(descent + over).toFixed(3), overfit: ep > CLIFF });
  }
  return pts;
}

export interface EpochAudit {
  /** Epochs the scarce (code) domain runs at, given cap. */
  epochs: number;
  stable: boolean;
  /** Unique tokens left short of the budget once the cap bites, in trillions. */
  deficitT: number;
  /** Whether the shortfall forces synthetic expansion. */
  triggerSynthetic: boolean;
}

const CODE_UNIQUE_T = 1.4; // trillions of unique high-quality code tokens on hand
const CODE_BUDGET_T = 3.6; // trillions the recipe wants from the code domain

export function epochAudit(cap: number): EpochAudit {
  const epochs = +Math.min(cap, CODE_BUDGET_T / CODE_UNIQUE_T).toFixed(1);
  const supplied = CODE_UNIQUE_T * cap;
  const deficitT = +Math.max(0, CODE_BUDGET_T - supplied).toFixed(1);
  return {
    epochs,
    stable: cap <= 2.0,
    deficitT,
    triggerSynthetic: deficitT > 0,
  };
}

/* ======================================================================== *
 * NODE 4 — Synthetic expansion ("Textbooks Are All You Need")
 * A frontier teacher rewrites a messy web seed into a clean textbook chapter,
 * multiplying token volume while raising density.
 * ======================================================================== */

/** The messy web seed (proper nouns / code kept verbatim; not translated). */
export const SEED_TEXT = `hey guys so Dijkstra's algorithm is pretty cool for finding
shortest paths lol. basically u use a min-heap / priority queue.
heres a snippet i wrote last night hope it works
def d(g,s): ... # TODO clean this up later`;

/** The generated textbook chapter (kept verbatim in both languages). */
export const TEXTBOOK_TEXT = `# 14 · Shortest-Path Algorithms

## 14.1 Dijkstra's Algorithm
Given a weighted graph G = (V, E) with non-negative edge
weights and a source s ∈ V, Dijkstra's algorithm computes
the shortest path from s to every other vertex.

  def dijkstra(graph, source):
      dist = {v: inf for v in graph}
      dist[source] = 0
      pq = [(0, source)]
      ...

Exercise 14.1  Prove the greedy choice is optimal when all
edge weights are non-negative.`;

export type RewriteMode = "paraphrase" | "textbook";

export interface SynthYield {
  /** Synthetic tokens produced, in billions. */
  outB: number;
  /** Educational-density score of the output, 0–100. */
  density: number;
  /** Teacher-API cost, USD. */
  cost: number;
  underBudget: boolean;
}

const TEACHER_USD_PER_M = 0.15; // teacher output price, $ / million tokens
const BUDGET_USD = 100_000;

/** Yield of the generation stage from `seedB` billion seed tokens at `factor`×. */
export function synthYield(seedB: number, factor: number, mode: RewriteMode): SynthYield {
  const outB = +(seedB * factor).toFixed(0);
  const density = mode === "textbook" ? 94 : 61;
  const cost = Math.round(outB * 1e9 * (TEACHER_USD_PER_M / 1e6));
  return { outB, density, cost, underBudget: cost <= BUDGET_USD };
}

/* ======================================================================== *
 * NODE 5 — The 3-gate synthetic audit
 * Synthetic text is risky: execute code/math, judge quality, scan for benchmark
 * leaks. Each gate drops what it catches; the rest reaches the clean buffer.
 * ======================================================================== */

export type Gate = "exec" | "judge" | "contam";

export interface SynthDoc {
  key: string;
  /** Which gate (if any) this document fails. `null` = clean. */
  fails: Gate | null;
}

/** Three representative synthetic documents streamed through the gates. */
export const SYNTH_DOCS: SynthDoc[] = [
  { key: "clean", fails: null },
  { key: "buggy", fails: "exec" },
  { key: "leak", fails: "contam" },
];

/** Where a doc lands given which gates are enabled: the gate that drops it, or "buffer". */
export function auditDoc(doc: SynthDoc, gates: Record<Gate, boolean>): Gate | "buffer" {
  const order: Gate[] = ["exec", "judge", "contam"];
  for (const g of order) {
    if (gates[g] && doc.fails === g) return g;
  }
  return "buffer";
}

export interface AuditYield {
  evalB: number;
  execDropB: number;
  contamDropB: number;
  cleanB: number;
  retainedPct: number;
  /** True when no contaminated tokens survive and ≥80% is retained. */
  passed: boolean;
}

const EVAL_B = 50; // billions of synthetic tokens entering the audit
const EXEC_FAIL_B = 4.2; // billions that fail execution
const CONTAM_FAIL_B = 3.7; // billions that match a benchmark

export function auditYield(gates: Record<Gate, boolean>): AuditYield {
  const execDropB = gates.exec ? EXEC_FAIL_B : 0;
  const contamDropB = gates.contam ? CONTAM_FAIL_B : 0;
  // The quality judge trims a small extra slice of low-density filler.
  const judgeDropB = gates.judge ? 1.6 : 0;
  const cleanB = +(EVAL_B - execDropB - contamDropB - judgeDropB).toFixed(1);
  const retainedPct = +((cleanB / EVAL_B) * 100).toFixed(1);
  // Contamination surviving is a hard fail regardless of yield.
  const contaminated = !gates.contam;
  return {
    evalB: EVAL_B,
    execDropB,
    contamDropB,
    cleanB,
    retainedPct,
    passed: !contaminated && retainedPct >= 80,
  };
}

/* ======================================================================== *
 * NODE 6 — The production recipe hand-off
 * Five streams (real + synthetic) mapped onto a multi-trillion token schedule.
 * ======================================================================== */

export type StreamKey = "web" | "code" | "math" | "synth" | "books";

export interface StreamDef {
  key: StreamKey;
}

export const STREAMS: StreamDef[] = [
  { key: "web" },
  { key: "code" },
  { key: "math" },
  { key: "synth" },
  { key: "books" },
];

export type Recipe = Record<StreamKey, number>;

export const DEFAULT_RECIPE: Recipe = { web: 20, code: 30, math: 25, synth: 15, books: 10 };

/** Total training budget the shares are mapped onto. */
export const TOTAL_TOKENS_T = 15;

export interface RecipeResult {
  /** Trillions of tokens per stream, index-aligned to STREAMS. */
  tokensT: number[];
  benchmark: number;
  /** Compute efficiency (%) — reasoning per FLOP relative to the raw crawl. */
  efficiency: number;
  passed: boolean;
}

/** Estimated benchmark from the final five-stream mix. Synthetic counts like a
 *  slightly-discounted blend of code+math (verified, dense, but second-hand). */
export function evalRecipe(r: Recipe): RecipeResult {
  const tokensT = STREAMS.map((s) => +((r[s.key] / 100) * TOTAL_TOKENS_T).toFixed(2));
  // Tuned so a healthy engineered recipe (the DEFAULT_RECIPE, web ~20%) clears
  // ~88, while the raw-web mix lands ~48 — reaching the bar never requires
  // starving web below the ~15% floor Node 1 warns about.
  const benchmark = Math.max(
    0,
    Math.min(
      100,
      35.8 + r.code * 0.5 + r.math * 0.9 + r.synth * 0.7 + r.books * 0.35 + r.web * 0.05,
    ),
  );
  const efficiency = Math.max(0, Math.min(100, 60 + (r.code + r.math + r.synth) * 0.45));
  return {
    tokensT,
    benchmark: +benchmark.toFixed(1),
    efficiency: +efficiency.toFixed(1),
    passed: benchmark >= 88,
  };
}

/* --------------------------------------------------------------- format --- */

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}
export function sum(mix: Record<string, number>): number {
  return Object.values(mix).reduce((s, v) => s + v, 0);
}
