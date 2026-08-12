/**
 * Pure logic + data for the "Quality filtering" lesson (Stage 0 · Phase 0.3).
 * No React, no d3 — every node's numbers and rules live here so the diagrams and
 * controls in `QualityFiltering.tsx` stay thin, and the scoring is testable.
 *
 * The one idea: most of the crawled web is junk, and a few cheap counting rules
 * throw most of it out before training. Numbers are realistic-but-illustrative —
 * the point is the shape of each rule, not a benchmark.
 */

/* ======================================================================== *
 * NODE 1 — How little of an extracted page is prose worth learning from.
 * A page, even after text extraction, is mostly nav, ads and boilerplate.
 * ======================================================================== */

export type BlockKind = "prose" | "nav" | "ad" | "boilerplate" | "junk";

/** Fixed order so copy label arrays line up with a kind index. */
export const BLOCK_KINDS: BlockKind[] = ["prose", "nav", "ad", "boilerplate", "junk"];

export interface DocBlock {
  kind: BlockKind;
  /** Rough character count of this block — only the ratio matters. */
  chars: number;
}

export interface Archetype {
  key: string;
  blocks: DocBlock[];
}

/** Three real-world page shapes, from mostly-readable to almost-all-spam. */
export const ARCHETYPES: Archetype[] = [
  {
    key: "news",
    blocks: [
      { kind: "nav", chars: 60 },
      { kind: "ad", chars: 74 },
      { kind: "prose", chars: 320 },
      { kind: "boilerplate", chars: 150 },
      { kind: "nav", chars: 96 },
    ],
  },
  {
    key: "forum",
    blocks: [
      { kind: "nav", chars: 74 },
      { kind: "prose", chars: 190 },
      { kind: "boilerplate", chars: 170 },
      { kind: "junk", chars: 150 },
      { kind: "nav", chars: 76 },
    ],
  },
  {
    key: "seo",
    blocks: [
      { kind: "nav", chars: 92 },
      { kind: "junk", chars: 360 },
      { kind: "ad", chars: 160 },
      { kind: "prose", chars: 42 },
      { kind: "boilerplate", chars: 118 },
    ],
  },
];

export function totalChars(a: Archetype): number {
  return a.blocks.reduce((s, b) => s + b.chars, 0);
}

/** Share of an archetype that is prose (0–1). */
export function proseFraction(a: Archetype): number {
  const total = totalChars(a);
  const prose = a.blocks.filter((b) => b.kind === "prose").reduce((s, b) => s + b.chars, 0);
  return total ? prose / total : 0;
}

/* ======================================================================== *
 * NODE 2 — Four cheap heuristic rules, and the sample documents they judge.
 * Each junk document is designed to trip exactly one rule, so every toggle
 * visibly flips a document back into the corpus when switched off.
 * ======================================================================== */

export type RuleKey = "symbol" | "repeat" | "wordlen" | "stopword";

/** Fixed evaluation order; the first enabled rule a doc trips is the "caught by". */
export const RULES: RuleKey[] = ["symbol", "repeat", "wordlen", "stopword"];

export interface SampleDoc {
  key: string;
  /** Symbol-to-word ratio (0–1): punctuation and symbols vs words. */
  symbol: number;
  /** Fraction of the doc taken up by its most-repeated phrase (0–1). */
  repeat: number;
  /** Mean word length in characters. */
  wordLen: number;
  /** Stop-word density (0–1): share of words that are the/and/of… */
  stop: number;
}

export const DOCS: SampleDoc[] = [
  { key: "news", symbol: 0.04, repeat: 0.08, wordLen: 4.8, stop: 0.43 }, // clean → kept
  { key: "nav", symbol: 0.44, repeat: 0.12, wordLen: 5.1, stop: 0.22 }, //  symbol
  { key: "seo", symbol: 0.06, repeat: 0.47, wordLen: 5.6, stop: 0.3 }, //   repeat
  { key: "gibberish", symbol: 0.14, repeat: 0.05, wordLen: 12.6, stop: 0.18 }, // wordlen
  { key: "tags", symbol: 0.03, repeat: 0.1, wordLen: 6.2, stop: 0.06 }, //   stopword
  { key: "symbols", symbol: 0.58, repeat: 0.18, wordLen: 3.1, stop: 0.2 }, // symbol
];

/** Thresholds — cross one and the rule flags the document as junk. */
export const THRESH = {
  symbol: 0.3, //   more symbols than this ⇒ menu / code / soup
  repeat: 0.3, //   one phrase this much of the doc ⇒ spam / boilerplate
  wordLenMax: 9, // words this long on average ⇒ hashes / gibberish
  stopMin: 0.15, // fewer stop-words than this ⇒ keyword list, not prose
} as const;

export function violates(doc: SampleDoc, rule: RuleKey): boolean {
  switch (rule) {
    case "symbol":
      return doc.symbol > THRESH.symbol;
    case "repeat":
      return doc.repeat > THRESH.repeat;
    case "wordlen":
      return doc.wordLen > THRESH.wordLenMax;
    case "stopword":
      return doc.stop < THRESH.stopMin;
  }
}

export interface Verdict {
  key: string;
  kept: boolean;
  /** The first enabled rule that caught it, or null if kept. */
  caughtBy: RuleKey | null;
}

/** Judge one document against the currently-enabled rules. */
export function judge(doc: SampleDoc, enabled: Record<RuleKey, boolean>): Verdict {
  for (const rule of RULES) {
    if (enabled[rule] && violates(doc, rule)) {
      return { key: doc.key, kept: false, caughtBy: rule };
    }
  }
  return { key: doc.key, kept: true, caughtBy: null };
}

export function judgeAll(enabled: Record<RuleKey, boolean>): Verdict[] {
  return DOCS.map((d) => judge(d, enabled));
}

/* ======================================================================== *
 * NODE 3 — The funnel: the corpus collapses as each filter drops a chunk.
 * Illustrative token counts; the shape (keep a small fraction) is real.
 * ======================================================================== */

/** Raw crawl size, in trillions of tokens — the "100T" at the top of the funnel. */
export const RAW_TOKENS = 100;

export interface FunnelStage {
  /** Fraction of the raw crawl still remaining after this stage (0–1). */
  remain: number;
  /** Fraction of the raw crawl dropped *by* this stage (0 for the raw row). */
  dropped: number;
}

/**
 * The quality funnel at a given strictness (0 = lenient, 1 = strict). Language
 * filtering is a fixed cut; the three heuristic stages each drop more as
 * strictness rises. Returns the raw row plus one row per filter.
 */
export function funnel(strictness: number): { stages: FunnelStage[]; keptFrac: number } {
  const s = Math.max(0, Math.min(1, strictness));
  const drops = [
    0.45, //               language / non-text (fixed)
    0.12 + 0.3 * s, //     symbols & formatting
    0.1 + 0.28 * s, //     repetition & spam
    0.08 + 0.25 * s, //    gibberish & low-quality
  ];
  const stages: FunnelStage[] = [{ remain: 1, dropped: 0 }];
  let remain = 1;
  for (const d of drops) {
    const dropped = remain * d;
    remain -= dropped;
    stages.push({ remain, dropped });
  }
  return { stages, keptFrac: remain };
}
