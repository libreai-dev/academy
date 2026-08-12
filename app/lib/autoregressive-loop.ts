/**
 * Stage 0 · Phase 0 — The autoregressive loop. Pure, testable layout logic for
 * the token "tape" (no React, no d3). The tape is drawn in several nodes, so the
 * wrapping maths lives here and the components just render the positions.
 */

export interface TapeCell {
  /** left edge, in viewBox units */
  x: number;
  /** top edge, in viewBox units */
  y: number;
  /** chip width */
  w: number;
  /** index into the source pieces array */
  i: number;
  piece: string;
}

export interface TapeOpts {
  /** available width for the row before it wraps */
  maxW: number;
  /** left origin */
  x0: number;
  /** top origin */
  y0: number;
  charW?: number;
  padX?: number;
  gap?: number;
  rowH?: number;
  minW?: number;
}

/** Chip height used across the tape diagrams. */
export const CHIP_H = 40;

/**
 * Lay a list of token pieces out as chips on a wrapping horizontal tape.
 * Monospace widths are predictable, so we estimate width from character count
 * (no DOM measurement needed) — keeping the function pure and SSR-safe.
 */
export function layoutTape(pieces: string[], o: TapeOpts): TapeCell[] {
  const charW = o.charW ?? 8.4;
  const padX = o.padX ?? 12;
  const gap = o.gap ?? 8;
  const rowH = o.rowH ?? CHIP_H + 14;
  const minW = o.minW ?? 34;
  const cells: TapeCell[] = [];
  let x = o.x0;
  let y = o.y0;
  pieces.forEach((p, i) => {
    const w = Math.max(minW, p.length * charW + padX * 2);
    if (x > o.x0 && x + w > o.x0 + o.maxW) {
      x = o.x0;
      y += rowH;
    }
    cells.push({ x, y, w, i, piece: p });
    x += w + gap;
  });
  return cells;
}

/** Horizontal centre of a chip. */
export function cellCX(c: TapeCell): number {
  return c.x + c.w / 2;
}
