/**
 * Pure logic + data for the "Multi-stage deduplication" lesson
 * (Stage 0 · Phase 0.3). No React, no d3 — every node's numbers and rules live
 * here so the diagrams and controls in `Dedup.tsx` stay thin and testable.
 *
 * Where it can be, the maths is REAL: Node 3 runs an honest MinHash estimator
 * over two sample texts, and Node 4 evaluates the exact LSH S-curve equation.
 * Other nodes use realistic-but-illustrative figures (a 1 PB crawl, ~40% raw
 * redundancy) — the point is the *shape* of each trade-off, not a benchmark.
 * Where a figure is a stand-in, the copy flags it.
 */

/* ======================================================================== *
 * Shared: a small, fast, deterministic string hash (FNV-1a, 32-bit).
 * Used by the MinHash engine so signatures are stable across every paint.
 * ======================================================================== */

export function fnv1a(str: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* ======================================================================== *
 * NODE 1 — The memorization trap (why redundancy destroys capacity)
 * A single "dedup strength" dial trades verbatim memorization + wasted compute
 * against the risk of dropping genuinely unique documents.
 * ======================================================================== */

/** Total documents in the illustrative corpus. */
export const CORPUS_DOCS = 1_000_000;
/** Fraction of the raw crawl that is exact/near/semantic redundancy. */
export const RAW_REDUNDANCY = 0.41;

export interface MemoAudit {
  /** Verbatim memorization rate, as a percentage (target < 0.1). */
  memorizationPct: number;
  /** GPU hours saved vs. training on the un-deduplicated corpus, %. */
  computeSavingsPct: number;
  /** Unique, informative documents preserved, %. */
  uniqueRetainedPct: number;
  /** Documents surviving the cut. */
  docsKept: number;
  passed: boolean;
}

/**
 * Model: memorization falls exponentially as duplicates are removed; compute
 * savings rise toward the redundant fraction; but past ~90% strength the dedup
 * starts eating legitimate near-repeats (idioms, syntax) and unique retention
 * dips below 100. `strength` 0–100, `minWords` 5–50 (longer min-length spares
 * short unique lines from being over-matched, nudging retention back up).
 */
export function memoAudit(strength: number, minWords: number): MemoAudit {
  const s = Math.max(0, Math.min(100, strength)) / 100;
  // Verbatim memorization: 3.8% on the raw corpus, decaying with removal —
  // tuned so aggressive dedup (s≈0.96) clears the <0.1% target.
  const memorizationPct = +(3.8 * Math.exp(-4.85 * s)).toFixed(2);
  // Compute savings track how much of the redundant slice we actually remove.
  const computeSavingsPct = +(RAW_REDUNDANCY * 100 * s).toFixed(1);
  // Over-aggressive dedup (s > 0.9) clips unique docs; a higher min-word length
  // protects short unique lines and recovers some of that loss.
  const over = Math.max(0, s - 0.9) / 0.1; // 0 → 1 across the last 10%
  const minWordRelief = Math.min(1, (minWords - 5) / 45); // 0 at 5, 1 at 50
  const uniqueLoss = over * (2.6 - 1.8 * minWordRelief); // up to ~2.6%
  const uniqueRetainedPct = +(100 - uniqueLoss).toFixed(1);
  const docsKept = Math.round(CORPUS_DOCS * (1 - RAW_REDUNDANCY * s));
  const passed = memorizationPct < 0.1 && uniqueRetainedPct >= 99.9;
  return { memorizationPct, computeSavingsPct, uniqueRetainedPct, docsKept, passed };
}

/** Presets parallel to `n1presets` in copy.ts (same order). */
export const MEMO_PRESETS: { strength: number; minWords: number }[] = [
  { strength: 0, minWords: 5 }, //   Raw unfiltered crawl
  { strength: 62, minWords: 12 }, // Conservative dedupe
  { strength: 96, minWords: 8 }, //  Aggressive dedupe
];

/* ======================================================================== *
 * NODE 2 — Stage 1: exact line & document deduplication
 * Two techniques: whole-document hashing (drops identical files in O(1)), and
 * suffix-array span trimming (slices shared boilerplate out of unique files).
 * ======================================================================== */

export type ExactMode = "hash" | "suffix";

export interface ExactMetrics {
  /** Per-document hash lookup time (ms) — sub-millisecond either way. */
  lookupMs: number;
  /** Whole files dropped as byte-identical duplicates. */
  filesDropped: number;
  /** Boilerplate paragraph spans sliced out (suffix-array mode). */
  spansTrimmed: number;
  /** Clean text retained after this stage, %. */
  yieldRetainedPct: number;
  passed: boolean;
}

/** 10,000 raw pages in the illustrative batch for this node. */
export const EXACT_PAGES = 10_000;

/**
 * Hash mode drops exact-duplicate whole files fast. Suffix-array mode keeps the
 * files but slices shared spans (cookie banners, license headers) from within
 * them — trimming more total boilerplate while preserving unique bodies.
 */
export function exactDedup(mode: ExactMode, stripBoiler: boolean): ExactMetrics {
  if (mode === "hash") {
    const filesDropped = 1420; // ~14.2% of pages are byte-identical dupes
    return {
      lookupMs: 0.2,
      filesDropped,
      spansTrimmed: 0,
      yieldRetainedPct: +(100 - (filesDropped / EXACT_PAGES) * 100).toFixed(1),
      passed: true,
    };
  }
  // Suffix-array span trimming: many spans, files preserved.
  const spansTrimmed = stripBoiler ? 14_200 : 5_100;
  // Trimming spans reclaims boilerplate bytes without dropping whole files.
  const yieldRetainedPct = stripBoiler ? 72.4 : 84.0;
  return { lookupMs: 0.2, filesDropped: 0, spansTrimmed, yieldRetainedPct, passed: true };
}

/* ======================================================================== *
 * NODE 3 — Stage 2: fuzzy near-dedup (MinHash / Jaccard) — REAL engine
 * Two near-duplicate articles (same body, different sidebars). We shingle,
 * MinHash, and estimate Jaccard — comparing the estimate to the exact value.
 * ======================================================================== */

/** Two syndications of the same story; A and B share the body, differ in chrome. */
export const DOC_A =
  "breaking the central bank cut its benchmark interest rate by a quarter point today " +
  "in a surprise vote that markets had not fully priced in analysts said the move signals " +
  "a shift toward easing as inflation cools across the major economies " +
  "home about contact subscribe newsletter follow us on social privacy policy terms";

export const DOC_B =
  "trending now the central bank cut its benchmark interest rate by a quarter point today " +
  "in a surprise vote that markets had not fully priced in analysts said the move signals " +
  "a shift toward easing as inflation cools across the major economies " +
  "sign in register advertise with us cookie settings related stories most read";

/** Overlapping n-word shingles of a document, as a set of strings. */
export function shingles(text: string, n: number): Set<string> {
  const words = text.trim().split(/\s+/);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) {
    out.add(words.slice(i, i + n).join(" "));
  }
  return out;
}

/** Exact Jaccard similarity |A∩B| / |A∪B| of two shingle sets. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** A MinHash signature: for each of `numPerm` hash seeds, the min hash over the
 *  shingle set. Two signatures agree at position i with probability = Jaccard. */
export function minhashSignature(sh: Set<string>, numPerm: number): number[] {
  const sig = new Array<number>(numPerm).fill(0xffffffff);
  for (const shingle of sh) {
    const base = fnv1a(shingle);
    for (let i = 0; i < numPerm; i++) {
      // A cheap universal-hash family: mix the base with the permutation index.
      const h = (Math.imul(base ^ (i * 0x9e3779b1), 0x85ebca77) >>> 0);
      if (h < sig[i]) sig[i] = h;
    }
  }
  return sig;
}

export interface MinHashResult {
  trueJaccard: number;
  estJaccard: number;
  /** |est − true|, expressed as an accuracy percentage. */
  accuracyPct: number;
  signatureBytes: number;
  /** How many of the `numPerm` signature cells matched. */
  matches: number;
  numPerm: number;
  shingleN: number;
  /** Near-duplicate documents this config would flag across the corpus. */
  nearDupsFound: number;
  passed: boolean;
}

/** Run the real estimator over DOC_A / DOC_B for the chosen parameters. */
export function minhashCompare(shingleN: number, numPerm: number): MinHashResult {
  const a = shingles(DOC_A, shingleN);
  const b = shingles(DOC_B, shingleN);
  const trueJaccard = jaccard(a, b);
  const sigA = minhashSignature(a, numPerm);
  const sigB = minhashSignature(b, numPerm);
  let matches = 0;
  for (let i = 0; i < numPerm; i++) if (sigA[i] === sigB[i]) matches++;
  const estJaccard = matches / numPerm;
  const err = Math.abs(estJaccard - trueJaccard);
  const accuracyPct = +(100 * (1 - err)).toFixed(1);
  // More permutations → tighter estimate → more confident flags. Illustrative
  // scale to a big corpus of syndicated news.
  const nearDupsFound = Math.round(34_100 * (0.7 + 0.3 * Math.min(1, numPerm / 256)));
  const passed = trueJaccard > 0.8 && numPerm * 4 <= 1024;
  return {
    trueJaccard: +trueJaccard.toFixed(3),
    estJaccard: +estJaccard.toFixed(3),
    accuracyPct,
    signatureBytes: numPerm * 4,
    matches,
    numPerm,
    shingleN,
    nearDupsFound,
    passed,
  };
}

/** Return each signature cell paired with whether A and B agree there — for the
 *  diagram's glowing "matched" cells. Capped to `cap` cells for legibility. */
export function signatureCells(shingleN: number, numPerm: number, cap = 32): boolean[] {
  const a = shingles(DOC_A, shingleN);
  const b = shingles(DOC_B, shingleN);
  const sigA = minhashSignature(a, numPerm);
  const sigB = minhashSignature(b, numPerm);
  const out: boolean[] = [];
  const k = Math.min(cap, numPerm);
  for (let i = 0; i < k; i++) out.push(sigA[i] === sigB[i]);
  return out;
}

/* ======================================================================== *
 * NODE 4 — Sub-linear scaling & S-curves (LSH) — REAL equation
 * P(candidate) = 1 − (1 − s^r)^b, banding a signature into b bands of r rows.
 * ======================================================================== */

/** Candidate-pair probability for two docs of similarity `s` under (b, r). */
export function lshProbability(s: number, b: number, r: number): number {
  return 1 - Math.pow(1 - Math.pow(s, r), b);
}

/** The classic LSH threshold approximation where the S-curve is steepest. */
export function lshThreshold(b: number, r: number): number {
  return Math.pow(1 / b, 1 / r);
}

export interface LshMetrics {
  threshold: number;
  /** Sampled curve points across s ∈ [0,1] for the plot. */
  curve: { s: number; p: number }[];
  /** Recall at the 0.85-similarity target (fraction of true dups caught). */
  recallPct: number;
  /** False-positive rate: candidates raised for genuinely dissimilar (s≈0.3) docs. */
  falsePositivePct: number;
  /** Candidate pairs checked vs. the O(N²) baseline. */
  pairsChecked: number;
  passed: boolean;
}

/** The naive O(N²) pairwise count for a petabyte-scale corpus (illustrative). */
export const PAIRWISE_BASELINE = 1e12;

export function lshMetrics(b: number, r: number): LshMetrics {
  const curve: { s: number; p: number }[] = [];
  for (let i = 0; i <= 50; i++) {
    const s = i / 50;
    curve.push({ s, p: lshProbability(s, b, r) });
  }
  const threshold = lshThreshold(b, r);
  const recallPct = +(lshProbability(0.85, b, r) * 100).toFixed(1); // true near-dups
  const falsePositivePct = +(lshProbability(0.3, b, r) * 100).toFixed(1); // dissimilar
  // Fewer, more selective buckets → fewer candidate comparisons. Scale the
  // candidate volume with how permissive the banding is (illustrative).
  const permissiveness = lshProbability(0.6, b, r);
  const pairsChecked = Math.round(60_000 + permissiveness * 320_000);
  const passed = recallPct >= 95 && falsePositivePct <= 3;
  return { threshold: +threshold.toFixed(2), curve, recallPct, falsePositivePct, pairsChecked, passed };
}

/* ======================================================================== *
 * NODE 5 — Stage 3: semantic dedup (SemDeDup) — vector clustering
 * A seeded 2D field of embeddings in a few concept clusters; prune points that
 * sit within ε of a kept neighbour (zero-novelty conceptual redundancy).
 * ======================================================================== */

export interface Vec2 {
  x: number;
  y: number;
  /** Which concept cluster this embedding belongs to. */
  cluster: number;
}

/** Cluster centroids, exported so the diagram can prune-by-distance-to-centre. */
export const CLUSTER_CENTRES = [
  { x: 0.28, y: 0.32 },
  { x: 0.72, y: 0.3 },
  { x: 0.4, y: 0.72 },
  { x: 0.78, y: 0.74 },
];

/** A deterministic field of embeddings: 4 concept clusters + a long tail. */
export const EMBEDDINGS: Vec2[] = (() => {
  let s = 1234567;
  const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647;
  const out: Vec2[] = [];
  CLUSTER_CENTRES.forEach((c, ci) => {
    const n = 26 - ci * 3;
    for (let i = 0; i < n; i++) {
      // pow < 1 pushes points toward the cluster boundary — a dense rim of
      // distinct perspectives with a sparser, redundant core near the centroid.
      const rad = Math.pow(rnd(), 0.6) * 0.14;
      const ang = rnd() * Math.PI * 2;
      out.push({ x: c.x + Math.cos(ang) * rad, y: c.y + Math.sin(ang) * rad, cluster: ci });
    }
  });
  // Long-tail unique concepts scattered between clusters — must be preserved.
  for (let i = 0; i < 22; i++) {
    out.push({ x: 0.1 + rnd() * 0.8, y: 0.12 + rnd() * 0.8, cluster: -1 });
  }
  return out;
})();

export interface SemDedupResult {
  clustered: number;
  /** Points pruned as within-ε of a kept neighbour, %. */
  redundancyPrunedPct: number;
  /** Distinct concepts retained, %. */
  conceptRetainedPct: number;
  /** Indices into EMBEDDINGS that survive the prune (for the diagram). */
  kept: boolean[];
  passed: boolean;
}

/**
 * Centroid-distance prune: a clustered embedding is redundant if it sits within
 * ε of its cluster centroid — points piled on the centre add zero new signal,
 * while the distinct rim (novel perspectives) survives. Long-tail (cluster −1)
 * points are always kept. `radius` scales the effective prune ε (a stand-in for
 * a per-cluster density gate); `eps` is the cosine-distance-like prune radius.
 */
export function semDedup(radius: number, eps: number): SemDedupResult {
  const kept = new Array<boolean>(EMBEDDINGS.length).fill(true);
  const r = eps * radius;
  EMBEDDINGS.forEach((p, i) => {
    if (p.cluster === -1) return; // never prune long-tail uniques
    const c = CLUSTER_CENTRES[p.cluster];
    if (Math.hypot(c.x - p.x, c.y - p.y) < r) kept[i] = false;
  });
  const clusteredTotal = EMBEDDINGS.filter((p) => p.cluster !== -1).length;
  const prunedCount = kept.filter((k) => !k).length;
  const redundancyPrunedPct = +((prunedCount / clusteredTotal) * 100).toFixed(1);
  // Concept diversity = fraction of clusters (incl. long tail) still represented.
  const clustersPresent = new Set(EMBEDDINGS.filter((p, i) => kept[i]).map((p) => p.cluster));
  const totalClusters = new Set(EMBEDDINGS.map((p) => p.cluster));
  const conceptRetainedPct = +((clustersPresent.size / totalClusters.size) * 100).toFixed(1);
  const passed = redundancyPrunedPct >= 15 && conceptRetainedPct >= 99;
  return {
    clustered: 500_000,
    redundancyPrunedPct,
    conceptRetainedPct,
    kept,
    passed,
  };
}

/* ======================================================================== *
 * NODE 6 — The deduplication funnel (yield vs. diversity trade-offs)
 * Three master toggles; each stage removes its slice at its own cost/speed.
 * ======================================================================== */

export interface FunnelStage {
  key: "exact" | "fuzzy" | "semantic";
  /** Share of the *current* stream this stage removes when enabled. */
  removeFrac: number;
  /** Where it runs — CPU shields are cheap; SemDeDup needs GPUs. */
  compute: "CPU" | "GPU";
  hours: number;
}

export const FUNNEL_STAGES: FunnelStage[] = [
  { key: "exact", removeFrac: 0.15, compute: "CPU", hours: 0.4 },
  { key: "fuzzy", removeFrac: 0.2, compute: "CPU", hours: 1.1 },
  { key: "semantic", removeFrac: 0.1, compute: "GPU", hours: 2.7 },
];

/** One petabyte of raw crawl enters the funnel (illustrative). */
export const INPUT_PB = 1.0;

export interface FunnelResult {
  /** Remaining volume after each *enabled* stage, in TB (input = 1000 TB). */
  outputTB: number;
  retainedPct: number;
  /** Knowledge-density score 0–100: rises as redundancy is stripped. */
  density: number;
  hours: number;
  passed: boolean;
}

/** Compose the enabled stages multiplicatively over a 1000 TB input. */
export function funnel(enabled: [boolean, boolean, boolean]): FunnelResult {
  let vol = 1000; // TB
  let hours = 0;
  let removedTotal = 0;
  FUNNEL_STAGES.forEach((st, i) => {
    if (!enabled[i]) return;
    removedTotal += vol * st.removeFrac;
    vol *= 1 - st.removeFrac;
    hours += st.hours;
  });
  const retainedPct = +((vol / 1000) * 100).toFixed(0);
  // Density climbs toward 100 as more of the redundant slice is removed; a
  // fixed 46.6 baseline for the raw stream, approaching ~89 fully deduped.
  const removedFrac = removedTotal / (1000 * RAW_REDUNDANCY); // 0 → ~1
  const density = +(46.6 + 42.6 * Math.min(1, removedFrac)).toFixed(1);
  const passed = density >= 85 && retainedPct >= 50;
  return { outputTB: Math.round(vol), retainedPct, density, hours: +hours.toFixed(1), passed };
}

/* --------------------------------------------------------------- format --- */

export function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}
export function fmtCompact(n: number): string {
  if (n >= 1e12) return `${+(n / 1e12).toFixed(0)}T`;
  if (n >= 1e9) return `${+(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}
