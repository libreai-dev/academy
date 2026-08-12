/**
 * Stage 0 · 1.3 — RoPE (rotary position embedding). Pure geometry helpers for
 * the lesson's dials. No React, no d3 — just the vector math the diagrams draw.
 *
 * RoPE rotates a token's query/key vector by an angle set by its position.
 * Here we work with a single illustrative 2D pair so the "rotate a vector"
 * idea is literal and visible on a dial.
 */

export interface Vec2 {
  x: number;
  y: number;
}

/** The fixed base direction of our example pair (unit length, up-and-right). */
export const BASE_ANGLE = (40 * Math.PI) / 180;
export const BASE_VEC: Vec2 = { x: Math.cos(BASE_ANGLE), y: Math.sin(BASE_ANGLE) };

/** A second base direction for the KEY in node 2 (so it isn't identical to q). */
export const KEY_BASE_ANGLE = (40 * Math.PI) / 180;

/** Rotate a 2D vector counter-clockwise by `ang` radians. */
export function rotate(v: Vec2, ang: number): Vec2 {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

export function norm(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** Cosine similarity — the "match score" attention reads, in [-1, 1]. */
export function cosSim(a: Vec2, b: Vec2): number {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
}

/** The three selectable pairs: radians turned per position step. */
export interface RopeFreq {
  key: "fast" | "medium" | "slow";
  omega: number;
}
export const FREQS: RopeFreq[] = [
  { key: "fast", omega: 0.55 },
  { key: "medium", omega: 0.3 },
  { key: "slow", omega: 0.12 },
];

/** Fixed turn-rate for the two-vector "gap" node, so focus stays on m − n. */
export const GAP_OMEGA = 0.42;

export const MAX_POS = 10;

/** Angle (radians) a pair has turned by at position m for a given omega. */
export function angleAt(m: number, omega: number): number {
  return m * omega;
}

/** Radians → whole degrees, wrapped into [0, 360) for a readable dial label. */
export function degWrapped(rad: number): number {
  let d = (rad * 180) / Math.PI;
  d = ((d % 360) + 360) % 360;
  return Math.round(d);
}

/** Signed degrees for a gap that may be negative, wrapped into (−180, 180]. */
export function degSigned(rad: number): number {
  let d = (rad * 180) / Math.PI;
  d = ((((d + 180) % 360) + 360) % 360) - 180;
  return Math.round(d);
}
