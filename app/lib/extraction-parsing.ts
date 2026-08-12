/**
 * Stage 0 · Phase 0.2 — Extraction & parsing. Pure per-node logic + data (no
 * React, no d3). All user-facing prose lives in app/lib/copy/extraction-parsing.ts;
 * this module holds only structural keys and illustrative numbers.
 */

/* ---- Node 1: a page as a stack of blocks ------------------------------- */

export type BlockKind = "body" | "boiler";

export interface PageBlock {
  /** Stable key; the human label is copy.n1blockLabels, index-aligned. */
  key: string;
  kind: BlockKind;
  /** Illustrative byte weight of the block. */
  bytes: number;
}

/** One real-ish news page: the article body is only a few of the blocks. */
export const PAGE_BLOCKS: PageBlock[] = [
  { key: "nav", kind: "boiler", bytes: 3.1 },
  { key: "cookie", kind: "boiler", bytes: 2.4 },
  { key: "header", kind: "boiler", bytes: 4.0 },
  { key: "headline", kind: "body", bytes: 0.3 },
  { key: "byline", kind: "body", bytes: 0.2 },
  { key: "para1", kind: "body", bytes: 1.9 },
  { key: "ad", kind: "boiler", bytes: 5.2 },
  { key: "para2", kind: "body", bytes: 2.1 },
  { key: "related", kind: "boiler", bytes: 3.6 },
  { key: "footer", kind: "boiler", bytes: 4.4 },
];

export interface ExtractYield {
  keptBlocks: number;
  droppedBlocks: number;
  totalBlocks: number;
  keptBytes: number;
  totalBytes: number;
  keptPct: number; // 0-100
}

export function extractionYield(blocks: PageBlock[] = PAGE_BLOCKS): ExtractYield {
  const body = blocks.filter((b) => b.kind === "body");
  const keptBytes = body.reduce((s, b) => s + b.bytes, 0);
  const totalBytes = blocks.reduce((s, b) => s + b.bytes, 0);
  return {
    keptBlocks: body.length,
    droppedBlocks: blocks.length - body.length,
    totalBlocks: blocks.length,
    keptBytes: Math.round(keptBytes * 10) / 10,
    totalBytes: Math.round(totalBytes * 10) / 10,
    keptPct: totalBytes > 0 ? Math.round((keptBytes / totalBytes) * 100) : 0,
  };
}

/* ---- Node 2: hard file formats ----------------------------------------- */

export const FORMAT_KEYS = ["html", "pdf", "scan", "table"] as const;
export type FormatKey = (typeof FORMAT_KEYS)[number];

/* ---- Node 3: language identification ----------------------------------- */

export interface LangScore {
  code: string; //  ISO-ish code, keyed into copy.n3langNames
  p: number; //     probability 0..1
}

/** Per-sample confidence distributions (illustrative but plausible). */
export const LANG_SAMPLES: Record<string, LangScore[]> = {
  en: [
    { code: "en", p: 0.98 },
    { code: "de", p: 0.009 },
    { code: "nl", p: 0.006 },
    { code: "fr", p: 0.005 },
  ],
  es: [
    { code: "es", p: 0.99 },
    { code: "pt", p: 0.006 },
    { code: "gl", p: 0.003 },
    { code: "it", p: 0.001 },
  ],
  zh: [
    { code: "zh", p: 0.995 },
    { code: "ja", p: 0.003 },
    { code: "ko", p: 0.001 },
    { code: "en", p: 0.001 },
  ],
  mixed: [
    { code: "en", p: 0.41 },
    { code: "es", p: 0.33 },
    { code: "fr", p: 0.14 },
    { code: "un", p: 0.12 },
  ],
};

export const LANG_SAMPLE_KEYS = ["en", "es", "zh", "mixed"] as const;
export type LangSampleKey = (typeof LANG_SAMPLE_KEYS)[number];

/** A document is only tagged when the top language clears this confidence bar. */
export const LANG_CONFIDENCE_BAR = 0.5;

/** Scores sorted highest-first (does not mutate the input). */
export function sortedScores(scores: LangScore[]): LangScore[] {
  return [...scores].sort((a, b) => b.p - a.p);
}

export function topLang(scores: LangScore[]): LangScore {
  return sortedScores(scores)[0];
}

/** Whether the winner is confident enough to keep — else the doc is held back. */
export function isConfident(scores: LangScore[]): boolean {
  return topLang(scores).p >= LANG_CONFIDENCE_BAR;
}
