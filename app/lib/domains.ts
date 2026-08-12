/**
 * Pure logic + data for the "Domain-specific source selection" lesson
 * (Stage 0 · Phase 0.1b). No React, no d3 — every node's numbers and rules live
 * here so the diagrams and controls in `Domains.tsx` stay thin and testable.
 *
 * Numbers are deliberately realistic (a 15T-token budget, code ≈ 1.5% of the raw
 * web, a $50 OCR compute budget) but illustrative — the point is the *shape* of
 * each trade-off, not a benchmark. Where a figure is a stand-in, copy flags it.
 */

/* ======================================================================== *
 * NODE 1 — Knowledge density & data recipes (quality vs. diversity)
 * A mixture of four domains, upsampled from their natural abundance. Push the
 * reasoning domains too hard and you either repeat epochs (overfit) or starve
 * the web share (linguistic drift).
 * ======================================================================== */

export interface Recipe {
  web: number;
  code: number;
  math: number;
  books: number;
}

/** Presets — parallel to `n1presets` labels in copy.ts (same order). */
export const RECIPE_PRESETS: Recipe[] = [
  { web: 0.82, code: 0.05, math: 0.02, books: 0.11 }, // Default web
  { web: 0.55, code: 0.17, math: 0.08, books: 0.2 }, //  Llama-3 style
  { web: 0.25, code: 0.3, math: 0.25, books: 0.2 }, //   DeepSeek reasoner
  { web: 0.05, code: 0.45, math: 0.35, books: 0.15 }, // Extreme STEM
];

const BUDGET_T = 15; //                         trillion training tokens
const POOL = { code: 3.2, math: 2.0, books: 3.5 }; // trillion *unique* tokens available
/** Natural abundance of each domain in a raw web crawl. */
export const NATURAL: Recipe = { web: 0.93, code: 0.015, math: 0.008, books: 0.047 };

export interface RecipeMetrics {
  reasoning: number; //  0–100
  maxEpoch: number; //   epoch repetition on the most-exhausted specialised pool
  webShare: number;
  drift: boolean; //     web share too low → linguistic drift
  overfit: boolean; //   maxEpoch > 1.2 → multi-epoch overfitting
  pass: boolean; //      mission: reasoning ≥ 85, no drift, no overfit
  upsample: { code: number; math: number; books: number }; // × vs natural abundance
}

/**
 * Reasoning rises with the density domains but saturates; epoch repetition is
 * needed-tokens ÷ available-unique-tokens for each scarce pool; drift triggers
 * when the web regulariser drops below ~15%.
 */
export function recipeMetrics(r: Recipe): RecipeMetrics {
  const reasoning = Math.round(
    100 * (1 - Math.exp(-(4.0 * r.code + 4.5 * r.math + 1.6 * r.books + 0.2 * r.web))),
  );
  const epoch = (share: number, pool: number) => (share * BUDGET_T) / pool;
  const maxEpoch = Math.max(
    epoch(r.code, POOL.code),
    epoch(r.math, POOL.math),
    epoch(r.books, POOL.books),
  );
  const drift = r.web < 0.15;
  const overfit = maxEpoch > 1.2;
  return {
    reasoning,
    maxEpoch: +maxEpoch.toFixed(2),
    webShare: r.web,
    drift,
    overfit,
    pass: reasoning >= 85 && !overfit && !drift,
    upsample: {
      code: +(r.code / NATURAL.code).toFixed(1),
      math: +(r.math / NATURAL.math).toFixed(1),
      books: +(r.books / NATURAL.books).toFixed(1),
    },
  };
}

/** How many times each scarce pile is re-read at this mix (needed ÷ available). */
export function reReads(r: Recipe): { code: number; math: number; books: number } {
  return {
    code: +((r.code * BUDGET_T) / POOL.code).toFixed(2),
    math: +((r.math * BUDGET_T) / POOL.math).toFixed(2),
    books: +((r.books * BUDGET_T) / POOL.books).toFixed(2),
  };
}

/** Move slider `key` to `v` (0–1) and rebalance the other three to keep sum = 1. */
export function rebalance(r: Recipe, key: keyof Recipe, v: number): Recipe {
  const clamped = Math.max(0, Math.min(1, v));
  const others = (Object.keys(r) as (keyof Recipe)[]).filter((k) => k !== key);
  const restNow = others.reduce((s, k) => s + r[k], 0);
  const restTarget = 1 - clamped;
  const out = { ...r, [key]: clamped } as Recipe;
  if (restNow <= 1e-6) {
    others.forEach((k) => (out[k] = restTarget / others.length));
  } else {
    others.forEach((k) => (out[k] = (r[k] / restNow) * restTarget));
  }
  return out;
}

/* ======================================================================== *
 * NODE 2 — Code repositories & AST parsing (syntax gate + repo packing)
 * tree-sitter validates syntax, drops anomalous/minified files, snips license
 * headers, then packs surviving files along the import graph with <|file_sep|>.
 * ======================================================================== */

export type FileKind = "src" | "minified" | "generated" | "broken";

export interface RepoFile {
  path: string;
  parseable: boolean;
  hasLicense: boolean;
  /** AST depth-to-width ratio; auto-generated / minified files run very high. */
  depthWidth: number;
  /** Longest single line, in chars; minified bundles are one giant line. */
  maxLine: number;
  imports: string[];
  kb: number;
  kind: FileKind;
}

/** A tiny but real-shaped repository: three source files + three landmines. */
export const REPO_FILES: RepoFile[] = [
  { path: "utils.py", parseable: true, hasLicense: true, depthWidth: 1.4, maxLine: 96, imports: [], kb: 6.2, kind: "src" },
  { path: "models.py", parseable: true, hasLicense: false, depthWidth: 1.9, maxLine: 110, imports: ["utils.py"], kb: 9.1, kind: "src" },
  { path: "main.py", parseable: true, hasLicense: false, depthWidth: 1.6, maxLine: 88, imports: ["utils.py", "models.py"], kb: 4.7, kind: "src" },
  { path: "vendor/bundle.min.js", parseable: true, hasLicense: false, depthWidth: 9.4, maxLine: 40219, imports: [], kb: 88.0, kind: "minified" },
  { path: "proto/schema_pb2.py", parseable: true, hasLicense: false, depthWidth: 7.1, maxLine: 512, imports: [], kb: 24.0, kind: "generated" },
  { path: "broken.py", parseable: false, hasLicense: false, depthWidth: 0, maxLine: 74, imports: [], kb: 3.3, kind: "broken" },
];

export interface PackOpts {
  rejectUnparseable: boolean;
  pruneLicense: boolean;
  packByImport: boolean;
  maxRatio: number; //      drop files whose depth:width exceeds this
  minifyThreshold: number; // drop files whose longest line exceeds this (chars)
}

export type DropReason = null | "syntax" | "anomalous" | "minified";

export interface PackedFile {
  file: RepoFile;
  dropped: DropReason;
  order: number; //  position in the packed stream (−1 if dropped)
  kb: number; //     kept bytes (license header snipped when pruned)
}

export interface PackResult {
  files: PackedFile[];
  kept: number;
  droppedCounts: Record<Exclude<DropReason, null>, number>;
  crossFileLinks: number; // import edges surviving among kept files
  outKb: number;
}

/** Depth-first order along import edges; falls back to lexical when packing off. */
function dfsOrder(kept: RepoFile[]): RepoFile[] {
  const byPath = new Map(kept.map((f) => [f.path, f]));
  const seen = new Set<string>();
  const out: RepoFile[] = [];
  const visit = (f: RepoFile) => {
    if (seen.has(f.path)) return;
    seen.add(f.path);
    for (const imp of f.imports) {
      const dep = byPath.get(imp);
      if (dep) visit(dep);
    }
    out.push(f);
  };
  // Start from roots (files nothing imports) so leaves land first.
  const imported = new Set(kept.flatMap((f) => f.imports));
  kept.filter((f) => !imported.has(f.path)).forEach(visit);
  kept.forEach(visit); // catch any cycle stragglers
  return out;
}

export function computePack(opts: PackOpts): PackResult {
  const dropOf = (f: RepoFile): DropReason => {
    if (!f.parseable) return opts.rejectUnparseable ? "syntax" : null;
    if (f.depthWidth > opts.maxRatio) return "anomalous";
    if (f.maxLine > opts.minifyThreshold) return "minified";
    return null;
  };
  const decided = REPO_FILES.map((f) => ({ f, dropped: dropOf(f) }));
  const keptFiles = decided.filter((d) => d.dropped === null).map((d) => d.f);
  const ordered = opts.packByImport
    ? dfsOrder(keptFiles)
    : [...keptFiles].sort((a, b) => a.path.localeCompare(b.path));

  const droppedCounts = { syntax: 0, anomalous: 0, minified: 0 };
  const files: PackedFile[] = decided.map((d) => {
    if (d.dropped) droppedCounts[d.dropped] += 1;
    const order = d.dropped ? -1 : ordered.indexOf(d.f);
    const kb = d.dropped ? 0 : d.f.kb - (opts.pruneLicense && d.f.hasLicense ? 1.1 : 0);
    return { file: d.f, dropped: d.dropped, order, kb: +kb.toFixed(1) };
  });

  const keptSet = new Set(keptFiles.map((f) => f.path));
  const crossFileLinks = opts.packByImport
    ? keptFiles.reduce((s, f) => s + f.imports.filter((i) => keptSet.has(i)).length, 0)
    : 0;

  return {
    files,
    kept: keptFiles.length,
    droppedCounts,
    crossFileLinks,
    outKb: +files.reduce((s, f) => s + f.kb, 0).toFixed(1),
  };
}

export const FILE_SEP = "<|file_sep|>";

/* ======================================================================== *
 * NODE 3 — Open-source licensing & copyleft scrubbing (subfolder overrides)
 * The root LICENSE is not the whole story: a permissive repo can hide a GPL
 * vendor subtree. A deep scan isolates it; a shallow scan lets it leak.
 * ======================================================================== */

export type LicenseClass = "permissive" | "copyleft";

export interface RepoSubtree {
  path: string;
  license: string; //  SPDX id
  cls: LicenseClass;
  kb: number;
}

/** One repo: MIT at the root, with two copyleft landmines buried in subfolders. */
export const REPO_ROOT_LICENSE = "MIT";
export const REPO_TREE: RepoSubtree[] = [
  { path: "src/", license: "MIT", cls: "permissive", kb: 512 },
  { path: "lib/", license: "MIT", cls: "permissive", kb: 208 },
  { path: "third_party/fastparse/", license: "BSD-3-Clause", cls: "permissive", kb: 96 },
  { path: "vendor/libgpl/", license: "GPL-3.0", cls: "copyleft", kb: 184 },
  { path: "deps/agpl-cache/", license: "AGPL-3.0", cls: "copyleft", kb: 61 },
];

export interface LicenseAudit {
  subtrees: { sub: RepoSubtree; passed: boolean }[];
  passedKb: number;
  quarantinedKb: number;
  quarantined: number;
  /** Copyleft that slipped into the corpus because the scan was shallow. */
  leaked: boolean;
  compliant: boolean;
}

/**
 * `allowed` is the set of SPDX ids the recipe permits. With `deepScan` off, the
 * whole repo inherits the root license — so a permissive root drags its GPL
 * subtrees in with it (a leak). With it on, each subtree is judged on its own.
 */
export function auditRepo(allowed: Set<string>, deepScan: boolean): LicenseAudit {
  const rootOk = allowed.has(REPO_ROOT_LICENSE);
  const subtrees = REPO_TREE.map((sub) => ({
    sub,
    passed: deepScan ? allowed.has(sub.license) : rootOk,
  }));
  const passedKb = subtrees.filter((s) => s.passed).reduce((s, x) => s + x.sub.kb, 0);
  const quarantinedKb = subtrees.filter((s) => !s.passed).reduce((s, x) => s + x.sub.kb, 0);
  const quarantined = subtrees.filter((s) => !s.passed).length;
  // A leak = a copyleft subtree that passed (only possible on a shallow scan).
  const leaked = subtrees.some((s) => s.passed && s.sub.cls === "copyleft");
  return { subtrees, passedKb, quarantinedKb, quarantined, leaked, compliant: !leaked };
}

/* ======================================================================== *
 * NODE 4 — Academic papers & PDF extraction (two-stage OCR router)
 * Cheap CPU text parsing for simple pages; a GPU vision model for the two-column
 * math papers that a linear text extractor would scramble.
 * ======================================================================== */

export type PaperKind = "simple" | "twocol" | "scanned" | "mathdense";

export interface PaperClass {
  kind: PaperKind;
  share: number; //  fraction of the 100k-paper batch
  /** Needs the GPU vision parser to come out clean. */
  complex: boolean;
}

export const PAPER_CLASSES: PaperClass[] = [
  { kind: "simple", share: 0.72, complex: false },
  { kind: "twocol", share: 0.16, complex: true },
  { kind: "scanned", share: 0.06, complex: true },
  { kind: "mathdense", share: 0.06, complex: true },
];

const PAPERS = 100_000;
const PAGES_PER_PAPER = 12;
const TOTAL_PAGES = PAPERS * PAGES_PER_PAPER;
const CPU_USD_PER_PAGE = 0.0000006;
const GPU_USD_PER_PAGE = 0.0001143; //  tuned so a full vision fallback ≈ $38.40
const EQ_PER_MATH_PAPER = 6.45;
export const PDF_BUDGET_USD = 50;

export interface PdfMetrics {
  cpuYield: number; //   fraction parsed on the CPU fast path
  gpuRouted: number; //  fraction routed to the vision model
  mathBlocks: number; // LaTeX equations recovered
  validLatex: number; // fraction of math blocks that came out valid
  cost: number; //       total compute cost, USD
  corrupted: number; //  fraction of complex papers scrambled
  pass: boolean; //      100% valid LaTeX under budget
}

/**
 * "naive" runs one linear text extractor over everything (cheap, but scrambles
 * every multi-column or math page). "twostage" routes complex papers to the GPU
 * vision model — only if `gpuFallback` is on; otherwise they corrupt for free.
 */
export function pdfMetrics(mode: "naive" | "twostage", gpuFallback: boolean): PdfMetrics {
  const complexShare = PAPER_CLASSES.filter((p) => p.complex).reduce((s, p) => s + p.share, 0);
  const simpleShare = 1 - complexShare;
  const mathPaperShare = PAPER_CLASSES.filter((p) => p.kind === "twocol" || p.kind === "mathdense").reduce((s, p) => s + p.share, 0);
  const mathBlocksTotal = Math.round(mathPaperShare * PAPERS * EQ_PER_MATH_PAPER);

  const useVision = mode === "twostage" && gpuFallback;
  const gpuRouted = useVision ? complexShare : 0;
  const cpuYield = 1 - gpuRouted;
  const cost =
    cpuYield * TOTAL_PAGES * CPU_USD_PER_PAGE + gpuRouted * TOTAL_PAGES * GPU_USD_PER_PAGE;
  const validLatex = useVision ? 1 : 0;
  const corrupted = useVision ? 0 : complexShare;
  return {
    cpuYield,
    gpuRouted,
    mathBlocks: mathBlocksTotal,
    validLatex,
    cost: +cost.toFixed(2),
    corrupted,
    pass: validLatex === 1 && cost <= PDF_BUDGET_USD,
  };
}

/** The corruption preview — real Transformer attention, scrambled vs restored. */
export const NAIVE_SCRAMBLE =
  "Attention(Q, K, V ) = softmax( QK T )V where we measure the queries Q and keys K of √dk dimension. Modern models use multi-head projections to";
export const RESTORED_LATEX =
  "$$\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V$$";

