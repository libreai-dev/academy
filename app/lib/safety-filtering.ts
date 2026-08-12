/**
 * Stage 0 · Phase 0.4 — "Safety filtering". Pure logic + data for the lesson.
 * No React, no d3. All user-facing text lives in app/lib/copy/safety-filtering.ts;
 * here we keep only the harm-category scores and the keep/flag maths the diagrams
 * need.
 *
 * The one idea: after quality scoring, a separate pass runs toxicity / NSFW /
 * danger classifiers over every page and strips the harmful ones out of the
 * corpus — before a single token reaches the model. Turn the dial too far and
 * you also lose legitimate pages (false positives).
 */

/* --- Harm categories ---------------------------------------------------- */

export type CatKey = "hate" | "sexual" | "danger" | "harass";

/** Order matters — copy's n1categories / n1examples / node1.optionNotes align. */
export const CATEGORIES: CatKey[] = ["hate", "sexual", "danger", "harass"];

/* --- Node 2: the gate over a small illustrative batch ------------------- */

/** One page in the demo batch, with a 0–1 score from each category detector.
 *  `safe` marks whether the page is *actually* fine (used to explain the
 *  jittery detectors that create false positives). Text lives in copy. */
export interface SafetyDoc {
  key: string;
  safe: boolean;
  scores: Record<CatKey, number>;
}

/** Order aligns to copy's n2docs / node2.optionNotes. */
export const SAFETY_DOCS: SafetyDoc[] = [
  // A medical-dosage article — clean, but the "danger" detector runs warm.
  { key: "med", safe: true, scores: { hate: 0.02, sexual: 0.03, danger: 0.44, harass: 0.04 } },
  // A hateful rant targeting a group.
  { key: "hate", safe: false, scores: { hate: 0.94, sexual: 0.05, danger: 0.12, harass: 0.41 } },
  // Explicit sexual content.
  { key: "nsfw", safe: false, scores: { hate: 0.03, sexual: 0.9, danger: 0.02, harass: 0.09 } },
  // Step-by-step weapon instructions.
  { key: "weapon", safe: false, scores: { hate: 0.08, sexual: 0.01, danger: 0.96, harass: 0.03 } },
  // A coordinated harassment thread.
  { key: "harass", safe: false, scores: { hate: 0.31, sexual: 0.05, danger: 0.06, harass: 0.83 } },
  // War reporting — legitimate, but violence-adjacent so "danger" ticks up.
  { key: "news", safe: true, scores: { hate: 0.05, sexual: 0.02, danger: 0.37, harass: 0.08 } },
];

/** Node 2 uses one fixed, middle-of-the-road threshold. */
export const GATE_THRESHOLD = 0.5;

/** The category with the highest detector score for a page. */
export function topCategory(doc: SafetyDoc): { cat: CatKey; score: number } {
  let cat: CatKey = CATEGORIES[0];
  let score = -1;
  for (const c of CATEGORIES) {
    if (doc.scores[c] > score) {
      score = doc.scores[c];
      cat = c;
    }
  }
  return { cat, score };
}

/** Flag a page when its top detector clears the threshold. */
export function gateVerdict(doc: SafetyDoc, threshold: number): { flagged: boolean; cat: CatKey; score: number } {
  const t = topCategory(doc);
  return { flagged: t.score >= threshold, cat: t.cat, score: t.score };
}

/** How many of the batch are kept vs flagged at a threshold. */
export function tally(threshold: number): { kept: number; flagged: number } {
  let kept = 0;
  let flagged = 0;
  for (const d of SAFETY_DOCS) (gateVerdict(d, threshold).flagged ? (flagged += 1) : (kept += 1));
  return { kept, flagged };
}

/* --- Node 3: the strictness tradeoff over a whole corpus ---------------- */

/** Score buckets across 0..1 for the two population humps. */
export const HIST_BINS = 20;

/** Illustrative corpus size (order-of-magnitude: a web-scale crawl). */
export const CORPUS_DOCS = 2_400_000_000;

/** Truly-harmful share of the raw web — small, but not zero. */
export const HARM_FRAC = 0.015;
export const SAFE_FRAC = 1 - HARM_FRAC;

function gauss(x: number, mu: number, sd: number): number {
  const z = (x - mu) / sd;
  return Math.exp(-0.5 * z * z);
}

/** Normalised score distribution for one hump (fractions sum to 1). */
function hump(mu: number, sd: number): number[] {
  const raw: number[] = [];
  for (let i = 0; i < HIST_BINS; i++) raw.push(gauss((i + 0.5) / HIST_BINS, mu, sd));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / sum);
}

/** Legit pages score low; harmful pages score high. */
export const SAFE_HIST = hump(0.14, 0.12);
export const HARM_HIST = hump(0.82, 0.09);

export function binCenter(i: number): number {
  return (i + 0.5) / HIST_BINS;
}

/** Strictness 0..100 → detector threshold. More strict = lower bar = more flags. */
export function thresholdFor(strictness: number): number {
  return 0.95 - (strictness / 100) * 0.8; // 0 → 0.95 (lenient) … 100 → 0.15 (aggressive)
}

/** Fraction of a hump at/above the threshold. */
function fracAbove(hist: number[], threshold: number): number {
  let f = 0;
  for (let i = 0; i < HIST_BINS; i++) if (binCenter(i) >= threshold) f += hist[i];
  return f;
}

export interface TradeoffStats {
  threshold: number;
  harmfulRemoved: number; // recall over harmful pages (0..1)
  legitLost: number; //     false-positive rate over legit pages (0..1)
  corpusKept: number; //    share of the whole corpus that survives (0..1)
  legitLostDocs: number; // absolute legit pages wrongly dropped
  harmfulRemovedDocs: number;
}

export function tradeoff(strictness: number): TradeoffStats {
  const threshold = thresholdFor(strictness);
  const harmfulRemoved = fracAbove(HARM_HIST, threshold);
  const legitLost = fracAbove(SAFE_HIST, threshold);
  const corpusKept = SAFE_FRAC * (1 - legitLost) + HARM_FRAC * (1 - harmfulRemoved);
  return {
    threshold,
    harmfulRemoved,
    legitLost,
    corpusKept,
    legitLostDocs: Math.round(SAFE_FRAC * legitLost * CORPUS_DOCS),
    harmfulRemovedDocs: Math.round(HARM_FRAC * harmfulRemoved * CORPUS_DOCS),
  };
}

/* --- formatting --------------------------------------------------------- */

export function fmtCount(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}
