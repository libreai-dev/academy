/**
 * Stage 0 · Phase 0.3 — "A model that grades the web" (classifier scoring).
 * Pure logic + data for the lesson. No React, no d3. All user-facing text
 * lives in app/lib/copy/classifier-scoring.ts — here we keep only the numbers
 * and the label/score maths the diagrams need.
 *
 * The one idea: a small, fast classifier is trained on good-vs-bad text, gives
 * every page a 0–1 quality score, and only the high scorers are kept — the
 * FineWeb-Edu move.
 */

export type Label = "good" | "bad";

/* --- Node 1: the training signal --------------------------------------- */

/** One labelled training example. The snippet text is in copy; here just the
 *  key (to align with copy arrays) and the label it teaches. */
export interface TrainSource {
  key: string;
  label: Label;
}

/** Order matters — copy's n1sources / n1examples / optionNotes align to this. */
export const TRAIN_SOURCES: TrainSource[] = [
  { key: "wiki", label: "good" },
  { key: "textbook", label: "good" },
  { key: "docs", label: "good" },
  { key: "spam", label: "bad" },
  { key: "linkfarm", label: "bad" },
  { key: "boiler", label: "bad" },
];

/* --- Node 2: scoring a page -------------------------------------------- */

/** A quality signal the grader learned to look for. Each nudges the score. */
export interface Signal {
  key: string;
  delta: number;
}

/** A page starts a touch above zero, then each detected signal adds to it. */
export const SCORE_BASE = 0.06;

/** Order aligns to copy's n2signals / node.optionNotes. */
export const SIGNALS: Signal[] = [
  { key: "sentences", delta: 0.2 },
  { key: "info", delta: 0.28 },
  { key: "ontopic", delta: 0.17 },
  { key: "clean", delta: 0.14 },
  { key: "cites", delta: 0.09 },
];

/** Which signals are lit by default → a middling ~0.54 score to start. */
export const SIGNALS_DEFAULT: boolean[] = [true, true, false, false, false];

/** Sum the base + every active signal, clamped to [0, 1]. */
export function scoreFrom(on: boolean[]): number {
  const s = SCORE_BASE + SIGNALS.reduce((a, sig, i) => a + (on[i] ? sig.delta : 0), 0);
  return Math.max(0, Math.min(1, s));
}

/* --- Node 3: the threshold over the scored corpus ---------------------- */

/** Score buckets across 0..1 for the distribution histogram. */
export const HIST_BINS = 20;

/** Illustrative corpus size (order-of-magnitude real: web-scale crawls). */
export const CORPUS_DOCS = 2_400_000_000;

/** Illustrative average tokens per surviving page. */
export const AVG_TOKENS = 480;

function gauss(x: number, mu: number, sd: number): number {
  const z = (x - mu) / sd;
  return Math.exp(-0.5 * z * z);
}

/**
 * A deterministic bimodal mixture: a tall "junk" hump low on the scale and a
 * small "quality" hump high on it — the real shape of the open web. Each entry
 * is the fraction of the corpus that falls in that score bucket (sums to 1).
 */
export const HIST: number[] = (() => {
  const raw: number[] = [];
  for (let i = 0; i < HIST_BINS; i++) {
    const x = (i + 0.5) / HIST_BINS;
    const junk = 0.78 * gauss(x, 0.17, 0.11);
    const good = 0.22 * gauss(x, 0.66, 0.13);
    raw.push(junk + good);
  }
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / sum);
})();

export const HIST_MAX = Math.max(...HIST);

/** The centre score of bucket i (0..HIST_BINS-1). */
export function binCenter(i: number): number {
  return (i + 0.5) / HIST_BINS;
}

export interface KeepStats {
  keptFrac: number;
  keptDocs: number;
  keptTokens: number;
}

/** Everything scoring at/above the threshold survives. */
export function keepStats(threshold: number): KeepStats {
  let frac = 0;
  for (let i = 0; i < HIST_BINS; i++) {
    if (binCenter(i) >= threshold) frac += HIST[i];
  }
  return {
    keptFrac: frac,
    keptDocs: Math.round(CORPUS_DOCS * frac),
    keptTokens: Math.round(CORPUS_DOCS * frac * AVG_TOKENS),
  };
}

/** A few sample pages plotted on the distribution (text/labels live in copy). */
export interface SampleDoc {
  key: string;
  score: number;
}

/** Order aligns to copy's n3samples. */
export const SAMPLE_DOCS: SampleDoc[] = [
  { key: "spam", score: 0.12 },
  { key: "forum", score: 0.44 },
  { key: "wiki", score: 0.78 },
];

/* --- formatting -------------------------------------------------------- */

export function fmtCount(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

export function fmtTokens(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${Math.round(n / 1e9)}B`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  return String(n);
}
