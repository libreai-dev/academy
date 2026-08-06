/**
 * Illustrative dataset-cleaning logic for the Data lesson (pure, framework-free
 * — rendering lives in the component; all displayed text lives in copy.ts).
 *
 * A tiny seeded corpus is run through the real pipeline stages a frontier lab
 * uses — extract → deduplicate → quality-filter → decontaminate/scrub → tokenize
 * — so the learner watches raw web turn into a clean token tape, and sees that
 * *most of it is thrown away*. The similarity and quality numbers are deliberate
 * simple heuristics; the lesson labels them "illustrative" on screen.
 */

/** Ground-truth category for each seeded doc — drives its fate in the demo. */
export type DocKind =
  | "good" //        clean prose that survives
  | "markup" //      wrapped in HTML/wikitext; survives once stripped
  | "boilerplate" // pure navigation/markup; vanishes at extraction
  | "dup" //         near-duplicate of another doc; collapses at dedup
  | "spam" //        low-quality / gibberish; removed by the quality filter
  | "pii" //         contains personal data; scrubbed at decontamination
  | "benchmark"; //  a test question; removed to avoid contamination

/** The five pipeline stages, in order. */
export const STAGES = ["extract", "dedup", "quality", "decontaminate", "tokenize"] as const;
export type StageId = (typeof STAGES)[number];

/**
 * Structural metadata per seeded doc. The *text* (title + raw body) lives in
 * copy.ts (EN + ES), keyed by this id; here we keep only the non-linguistic
 * ground truth the pipeline needs.
 */
export interface DocMeta {
  id: string;
  kind: DocKind;
  dupOf?: string; //     for kind "dup": the doc it echoes
  similarity?: number; // illustrative fraction similar (0–1) for the dup badge
}

export const DOC_META: DocMeta[] = [
  { id: "photosynthesis", kind: "good" },
  { id: "photosynthesis-dup", kind: "dup", dupOf: "photosynthesis", similarity: 0.94 },
  { id: "andes", kind: "good" },
  { id: "andes-nav", kind: "boilerplate" },
  { id: "jupiter-html", kind: "markup" },
  { id: "printing", kind: "good" },
  { id: "casino-spam", kind: "spam" },
  { id: "seo-spam", kind: "spam" },
  { id: "contact-pii", kind: "pii" },
  { id: "quiz-benchmark", kind: "benchmark" },
  { id: "turing", kind: "good" },
  { id: "turing-dup", kind: "dup", dupOf: "turing", similarity: 0.88 },
  { id: "gibberish", kind: "spam" },
  { id: "everest", kind: "good" },
  { id: "cookie-boilerplate", kind: "boilerplate" },
];

/** The stage at which each kind is removed (null = it survives to the end). */
const DROP_AT: Record<DocKind, StageId | null> = {
  good: null,
  markup: null,
  boilerplate: "extract",
  dup: "dedup",
  spam: "quality",
  pii: "decontaminate",
  benchmark: "decontaminate",
};

/** Strip HTML tags and common wikitext markup down to plain readable text. */
export function stripMarkup(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ") //          HTML tags
    .replace(/\[\[([^\]|]*\|)?([^\]]+)\]\]/g, "$2") // [[link|text]] → text
    .replace(/'{2,}/g, "") //             ''bold''/'''italic'''
    .replace(/\{\{[\s\S]*?\}\}/g, " ") //  {{templates}}
    .replace(/&[a-z]+;/gi, " ") //        &nbsp; etc.
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1") //    tidy space before punctuation
    .trim();
}

/**
 * Illustrative "textbook-like" quality score in [0,1] from cheap text features.
 * It rewards exactly what an edited-prose filter rewards — mostly letters, varied
 * vocabulary, longer words — and penalises shouting/symbol spam. That means it
 * also scores a *formal* register above a *plain* one, which is the whole point
 * of the Bias lesson: "quality" is defined against a norm. Not a real classifier.
 */
export function qualityScore(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  const words = t.split(/\s+/);
  const n = words.length;
  const compact = t.replace(/\s+/g, "");
  const letters = (compact.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  const letterRatio = letters / Math.max(1, compact.length);
  const uniqueRatio = new Set(words.map((w) => w.toLowerCase())).size / Math.max(1, n);
  const avgWordLen = compact.length / Math.max(1, n);
  const longWords = words.filter((w) => w.replace(/[^a-zA-ZÀ-ÿ]/g, "").length >= 7).length;
  const longRatio = longWords / Math.max(1, n);
  const shoutRuns = (t.match(/[!$€%*]{2,}|[A-Z]{5,}/g) || []).length;
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const score =
    0.15 +
    0.3 * letterRatio +
    0.25 * clamp01(longRatio * 2) +
    0.2 * uniqueRatio +
    0.1 * clamp01((avgWordLen - 3) / 3) -
    0.25 * shoutRuns;
  return Math.max(0.02, Math.min(0.99, score));
}

/** A single doc's state after the pipeline has run up to some stage. */
export interface DocResult {
  id: string;
  kind: DocKind;
  text: string; //             current (possibly cleaned) text
  dropped: boolean;
  droppedAt: StageId | null;
  similarity?: number;
  dupOf?: string;
  quality?: number; //         set once the quality stage has run
}

/**
 * Run the seeded corpus through the pipeline up to `stageIndex`
 * (-1 = untouched raw; 0..4 = after applying STAGES[0..stageIndex]).
 * Deterministic: same inputs → same output, so the component can drive it from a
 * single stage counter.
 */
export function cleanTo(docs: { id: string; raw: string }[], stageIndex: number): DocResult[] {
  const metaById = new Map(DOC_META.map((m) => [m.id, m]));
  const ranStages = new Set(STAGES.slice(0, stageIndex + 1));
  const qualityRan = ranStages.has("quality");

  return docs.map(({ id, raw }) => {
    const meta = metaById.get(id) ?? { id, kind: "good" as DocKind };
    // Extraction cleans everything that has markup once the extract stage runs.
    const text = ranStages.has("extract") ? stripMarkup(raw) : raw;

    const dropStage = DROP_AT[meta.kind];
    const dropped = dropStage != null && ranStages.has(dropStage);

    return {
      id,
      kind: meta.kind,
      text,
      dropped,
      droppedAt: dropped ? dropStage : null,
      similarity: meta.similarity,
      dupOf: meta.dupOf,
      quality: qualityRan ? qualityScore(text) : undefined,
    };
  });
}
