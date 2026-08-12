/**
 * Stage 0 · Expert — Constrained decoding. Pure logic + data (no React, no d3).
 *
 * One idea: to guarantee valid output (JSON, a grammar), the decoder MASKS out
 * any next-token that would break the structure — so only structurally valid
 * tokens can ever be sampled. This module holds the illustrative token data:
 * the failure examples (Node 1), the per-moment candidate distributions the
 * masker acts on (Node 2), and the grammar states + allowed sets (Node 3).
 *
 * All numbers are illustrative, not measured from a real model — they exist to
 * make the mechanism visible. Token glyphs, JSON strings, standard parser error
 * text, and the GBNF grammar body are code-literal and live here (shared,
 * untranslated); every piece of prose lives in app/lib/copy/constrained-decoding.ts.
 */

/* ------------------------------------------------------------ Node 1 ------- */
/** A way free sampling breaks the JSON contract — the literal broken string,
 *  the byte range that trips the parser, and the standard SyntaxError text. */
export interface FailureCase {
  key: string;
  /** The broken output a model produced when nothing constrained it. */
  text: string;
  /** Index + length of the offending substring inside `text`. */
  badStart: number;
  badLen: number;
  /** Canonical JSON.parse error (English, like a real console). */
  err: string;
}

export const FAILURES: FailureCase[] = [
  { key: "preamble", text: `Sure! {"age":36}`, badStart: 0, badLen: 6, err: `Unexpected token 'S', "Sure! {"ag"... is not valid JSON` },
  { key: "fence", text: '```json {"age":36}', badStart: 0, badLen: 7, err: "Unexpected token '`', \"```json {\"a\"... is not valid JSON" },
  { key: "unquoted", text: `{age: 36}`, badStart: 1, badLen: 3, err: "Expected property name enclosed in double quotes" },
  { key: "trailing", text: `{"age": 36,}`, badStart: 10, badLen: 1, err: "Unexpected token '}' after a trailing comma" },
];

/* ------------------------------------------------------------ Node 2 ------- */
/** One candidate next-token the model scored, with a base probability and
 *  whether it keeps the JSON structurally valid at this point. */
export interface Candidate {
  tok: string;
  prob: number;
  valid: boolean;
}

/** One "decode moment": the fixed prefix so far and the tokens in play for the
 *  next slot. `pick(constrained)` reports the token that wins each way. */
export interface DecodeMoment {
  key: string;
  /** What has been emitted so far (code-literal). */
  prefix: string;
  candidates: Candidate[];
}

export const MOMENTS: DecodeMoment[] = [
  {
    key: "start",
    prefix: "",
    candidates: [
      { tok: "```json", prob: 0.4, valid: false },
      { tok: "{", prob: 0.36, valid: true },
      { tok: "Sure!", prob: 0.14, valid: false },
      { tok: "[", prob: 0.1, valid: false },
    ],
  },
  {
    key: "key",
    prefix: "{",
    candidates: [
      { tok: '"age"', prob: 0.52, valid: true },
      { tok: "age", prob: 0.26, valid: false },
      { tok: "'age'", prob: 0.14, valid: false },
      { tok: "}", prob: 0.08, valid: true },
    ],
  },
  {
    key: "close",
    prefix: '{"age": 36',
    candidates: [
      { tok: ",", prob: 0.4, valid: false },
      { tok: "}", prob: 0.38, valid: true },
      { tok: " //done", prob: 0.12, valid: false },
      { tok: ",}", prob: 0.1, valid: false },
    ],
  },
];

/** The token chosen at a moment. When constrained we mask invalid tokens (their
 *  probability becomes exactly 0) and renormalise across the survivors, so the
 *  model still picks by its own preference — just never an invalid token. */
export function decode(m: DecodeMoment, constrained: boolean): { tok: string; valid: boolean; prob: number } {
  const pool = constrained ? m.candidates.filter((c) => c.valid) : m.candidates;
  const best = pool.reduce((a, b) => (b.prob > a.prob ? b : a), pool[0]);
  const norm = constrained ? pool.reduce((s, c) => s + c.prob, 0) : 1;
  return { tok: best.tok, valid: best.valid, prob: best.prob / norm };
}

/** Renormalised probability of a candidate given the constraint mode (0 if masked). */
export function shownProb(m: DecodeMoment, c: Candidate, constrained: boolean): number {
  if (!constrained) return c.prob;
  if (!c.valid) return 0;
  const sum = m.candidates.filter((x) => x.valid).reduce((s, x) => s + x.prob, 0);
  return c.prob / sum;
}

export function maskCounts(m: DecodeMoment): { kept: number; masked: number } {
  const kept = m.candidates.filter((c) => c.valid).length;
  return { kept, masked: m.candidates.length - kept };
}

/* ------------------------------------------------------------ Node 3 ------- */
/** The token classes a decoder could emit next, as displayable glyphs. */
export const TOKEN_CLASSES = ["{", "}", '"…"', "123", "-", "true", "false", "null", "[", "]", ",", "abc"] as const;
export type TokenClass = (typeof TOKEN_CLASSES)[number];

/** One position while walking the grammar. `allowed` is the set the grammar
 *  permits next; free decoding permits everything. */
export interface GrammarState {
  key: string;
  /** Emitted so far, for the header (code-literal). */
  emitted: string;
  allowed: TokenClass[];
}

export const GRAMMAR_STATES: GrammarState[] = [
  { key: "root", emitted: "", allowed: ["{"] },
  { key: "afterOpen", emitted: "{", allowed: ['"…"'] },
  { key: "afterColon", emitted: '{"age":', allowed: ["123", "-"] },
  { key: "afterValue", emitted: '{"age": 36', allowed: ["}"] },
];

/** A real GBNF-style grammar pinning the shape `{"age": <number>}`. */
export const GBNF = `root   ::= "{" ws "\\"age\\"" ws ":" ws number ws "}"
number ::= "-"? [0-9]+
ws     ::= [ \\t]*`;

export function isAllowed(s: GrammarState, tc: TokenClass): boolean {
  return s.allowed.includes(tc);
}
