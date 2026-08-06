/**
 * Real, in-browser tokenizer for the Tokens lesson.
 *
 * We use `js-tiktoken` — the JavaScript port of OpenAI's official tokenizer —
 * so every token, ID and split shown in the lesson is genuine, not a mock. The
 * encodings are heavy (each bundles its BPE ranks), so they are lazy-loaded via
 * dynamic import and cached; the lesson shows a loading state until the first
 * one is ready, keeping first paint fast (see CLAUDE.md: heavy libs lazy-loaded).
 *
 * All logic lives here (pure, framework-free); the component only renders.
 */
import type { Tiktoken } from "js-tiktoken";

/** The two real GPT tokenizers we compare in the lesson. */
export type EncodingName = "o200k_base" | "cl100k_base";

/** Friendly, model-facing names for the comparison chart. */
export const ENCODING_LABEL: Record<EncodingName, string> = {
  o200k_base: "GPT-4o · o200k",
  cl100k_base: "GPT-4 · cl100k",
};

const cache = new Map<EncodingName, Tiktoken>();

/** Load (and cache) a real encoder. Safe to call repeatedly. */
export async function loadEncoder(
  name: EncodingName = "o200k_base",
): Promise<Tiktoken> {
  const hit = cache.get(name);
  if (hit) return hit;
  const { getEncoding } = await import("js-tiktoken");
  const enc = getEncoding(name);
  cache.set(name, enc);
  return enc;
}

/** Assumed input price used by the cost readout: $3 per million input tokens. */
export const INPUT_PRICE_PER_MTOK = 3;

export function estimateCost(tokenCount: number): number {
  return (tokenCount / 1_000_000) * INPUT_PRICE_PER_MTOK;
}

/**
 * Visual category for a token, used only for colour-coding the chips so the
 * learner can *see* how text is carved up. Derived from the decoded piece.
 */
export type TokenKind = "word" | "sub" | "space" | "punct" | "num" | "byte";

export interface Tok {
  /** The integer ID — the actual number the model receives. */
  id: number;
  /** What this single ID decodes back to (may be a raw-byte fragment). */
  piece: string;
  kind: TokenKind;
}

/** Unicode replacement char — appears when an ID is only part of a character. */
const REPLACEMENT = "�";

export function classify(piece: string): TokenKind {
  if (piece.includes(REPLACEMENT)) return "byte";
  if (/^\s+$/.test(piece)) return "space";
  const core = piece.replace(/^\s+/, "");
  if (core.length === 0) return "space";
  if (/^\d+$/.test(core)) return "num";
  if (/[A-Za-zÀ-ɏ]/.test(core)) {
    // A leading space (or a capital) marks the start of a word; a bare
    // lowercase fragment is a continuation piece of a longer word.
    return piece.startsWith(" ") || /^[A-Z]/.test(core) ? "word" : "sub";
  }
  return "punct";
}

/**
 * Encode text into fully-described tokens: id + decoded piece + kind. Each ID
 * is decoded on its own, which is exactly what surfaces the "raw bytes" case
 * (an emoji becomes several IDs, each decoding to a byte fragment).
 */
export function encodeTokens(enc: Tiktoken, text: string): Tok[] {
  if (!text) return [];
  let ids: number[];
  try {
    ids = enc.encode(text);
  } catch {
    // Extremely rare (e.g. a literal special-token string); fall back to empty.
    return [];
  }
  return ids.map((id) => {
    let piece = "";
    try {
      piece = enc.decode([id]);
    } catch {
      piece = REPLACEMENT;
    }
    return { id, piece, kind: classify(piece) };
  });
}

/** Count tokens without building the full descriptor list. */
export function countTokens(enc: Tiktoken, text: string): number {
  if (!text) return 0;
  try {
    return enc.encode(text).length;
  } catch {
    return 0;
  }
}

/**
 * o200k tops out just below this; the special tokens (<|endoftext|>, …) live at
 * the very top of the range. We browse below them for "real word" entries.
 */
const O200K_SAFE_MAX = 199_997;

/** A handful of random, real dictionary entries — the "it's just a big list" demo. */
export function randomEntries(enc: Tiktoken, n: number, seed: number): Tok[] {
  const out: Tok[] = [];
  // Deterministic LCG so results are stable within a click (no Math.random in
  // render) but vary each press via the caller-supplied seed.
  let s = (seed % 2147483647) + 1;
  const next = () => (s = (s * 48271) % 2147483647) / 2147483647;
  let guard = 0;
  while (out.length < n && guard < n * 12) {
    guard++;
    const id = Math.floor(next() * O200K_SAFE_MAX);
    let piece = "";
    try {
      piece = enc.decode([id]);
    } catch {
      piece = "";
    }
    if (!piece) continue;
    out.push({ id, piece, kind: classify(piece) });
  }
  return out;
}

/**
 * Look up a curated list of words as real dictionary entries. Each word is
 * encoded and its tokens flattened into rows (deduped by id), so a preloaded
 * table of common words shows genuine entries — the "it's just a lookup" demo.
 */
export function lookupEntries(enc: Tiktoken, words: string[]): Tok[] {
  const out: Tok[] = [];
  const seen = new Set<number>();
  for (const w of words) {
    for (const tok of encodeTokens(enc, w)) {
      if (seen.has(tok.id)) continue;
      seen.add(tok.id);
      out.push(tok);
    }
  }
  return out;
}

/** Make whitespace visible in the decode table / chips. */
export function showPiece(piece: string): string {
  return piece
    .replace(/ /g, "␣")
    .replace(/\t/g, "⇥")
    .replace(/\n/g, "⏎");
}
