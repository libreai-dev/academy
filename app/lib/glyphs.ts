/**
 * Tiny d3-drawn glyphs for the backbone — a visual identity for every station
 * and every topic. Pure drawing (no React); each function selects into one
 * empty `<svg>` mount, per the "all visuals are d3" rule.
 *
 * All shapes use `currentColor`, so the caller sets the colour via CSS (level
 * ink, accent, muted) and theme flips resolve live. Glyphs are static — no
 * timers — so they're reduced-motion-safe by construction. viewBox is a fixed
 * 0–32 square; the caller sizes the svg in px.
 *
 * `drawGlyph(el, name)` dispatches on a name that is either a station key
 * (see `STAGE_GLYPH` in `backbone.ts`) or a topic motif (the `motif` field on
 * each article). Many stations reuse a topic motif at a larger size.
 */

import * as d3 from "d3";

type S = d3.Selection<SVGSVGElement, unknown, null, undefined>;

export function drawGlyph(el: SVGSVGElement, name: string): void {
  const s = d3.select(el) as unknown as S;
  s.selectAll("*").remove();
  s.attr("viewBox", "0 0 32 32").attr("fill", "none");

  const SW = 1.7;
  const ln = (x1: number, y1: number, x2: number, y2: number, w = SW) =>
    s.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
      .attr("stroke", "currentColor").attr("stroke-width", w).attr("stroke-linecap", "round");
  const dot = (cx: number, cy: number, r = 2) =>
    s.append("circle").attr("cx", cx).attr("cy", cy).attr("r", r).attr("fill", "currentColor");
  const ring = (cx: number, cy: number, r: number, w = SW) =>
    s.append("circle").attr("cx", cx).attr("cy", cy).attr("r", r)
      .attr("fill", "none").attr("stroke", "currentColor").attr("stroke-width", w);
  const rc = (x: number, y: number, w: number, h: number, rx = 2) =>
    s.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", h).attr("rx", rx)
      .attr("fill", "none").attr("stroke", "currentColor").attr("stroke-width", SW);
  const rcf = (x: number, y: number, w: number, h: number, rx = 1.5) =>
    s.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", h).attr("rx", rx)
      .attr("fill", "currentColor");
  const pa = (d: string, w = SW) =>
    s.append("path").attr("d", d).attr("fill", "none").attr("stroke", "currentColor")
      .attr("stroke-width", w).attr("stroke-linecap", "round").attr("stroke-linejoin", "round");
  const grid = (x0: number, y0: number, cols: number, rows: number, cell: number, gap: number) => {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) rcf(x0 + c * (cell + gap), y0 + r * (cell + gap), cell, cell, 0.6);
  };

  switch (name) {
    // ---- Crawl / gather ------------------------------------------------
    case "crawl":
    case "graph": {
      const p: [number, number][] = [[8, 9], [21, 7], [25, 18], [10, 22], [20, 23]];
      ln(p[0][0], p[0][1], p[1][0], p[1][1]);
      ln(p[1][0], p[1][1], p[2][0], p[2][1]);
      ln(p[0][0], p[0][1], p[3][0], p[3][1]);
      ln(p[3][0], p[3][1], p[4][0], p[4][1]);
      ln(p[4][0], p[4][1], p[2][0], p[2][1]);
      p.forEach(([x, y], i) => dot(x, y, i === 2 ? 2.4 : 1.9));
      break;
    }
    case "docs": {
      rc(11, 6, 14, 19, 2);
      pa("M8,9 V27 a2,2 0 0 0 2,2 H21", 1.4);
      ln(14, 12, 22, 12, 1.4);
      ln(14, 16, 22, 16, 1.4);
      ln(14, 20, 19, 20, 1.4);
      break;
    }
    case "shield": {
      pa("M16,5 L25,9 V16 C25,22 21,25 16,27 C11,25 7,22 7,16 V9 Z");
      pa("M12,16 L15,19 L21,13", 1.6);
      break;
    }
    // ---- Filter --------------------------------------------------------
    case "filter":
    case "funnel": {
      pa("M6,8 H26 L19,16 V25 L13,25 V16 Z");
      dot(11, 5, 1.5); dot(16, 4, 1.7); dot(21, 5, 1.5);
      dot(16, 28, 1.6);
      break;
    }
    case "gauge": {
      pa("M6,23 A10,10 0 0 1 26,23");
      ln(16, 23, 22, 15);
      dot(16, 23, 1.8);
      break;
    }
    case "overlap": {
      rc(7, 8, 12, 12, 2);
      rc(13, 12, 12, 12, 2);
      break;
    }
    case "bars": {
      rc(8, 14, 4, 10);
      rcf(14, 8, 4, 16, 1);
      rc(20, 17, 4, 7);
      break;
    }
    case "pack":
    case "distributed": {
      grid(9, 9, 4, 4, 3, 0.7);
      break;
    }
    // ---- Embed ---------------------------------------------------------
    case "embed":
    case "points": {
      ln(7, 25, 26, 25, 1.3);
      ln(7, 25, 7, 7, 1.3);
      [[12, 12], [16, 17], [11, 19], [20, 13], [22, 20], [16, 10]].forEach(([x, y]) => dot(x, y, 1.7));
      break;
    }
    case "tokens": {
      rc(5, 13, 5, 6, 1.5);
      rc(11.5, 13, 7, 6, 1.5);
      rc(20, 13, 7, 6, 1.5);
      break;
    }
    case "order": {
      rc(6, 13, 6, 6, 1);
      rc(20, 13, 6, 6, 1);
      pa("M13, 16 H19", 1.4);
      pa("M17,14 L19,16 L17,18", 1.4);
      s.append("text").attr("x", 9).attr("y", 17.6).attr("font-size", 5).attr("fill", "currentColor").attr("text-anchor", "middle").text("1");
      s.append("text").attr("x", 23).attr("y", 17.6).attr("font-size", 5).attr("fill", "currentColor").attr("text-anchor", "middle").text("2");
      break;
    }
    case "tag": {
      pa("M12,9 L6,16 L12,23");
      pa("M20,9 L26,16 L20,23");
      ln(18, 8, 14, 24, 1.4);
      break;
    }
    case "bubbles": {
      pa("M6,9 H18 a2,2 0 0 1 2,2 V16 a2,2 0 0 1 -2,2 H12 L8,21 V18 H6 a2,2 0 0 1 -2,-2 V11 a2,2 0 0 1 2,-2 Z", 1.4);
      pa("M17,17 H26 a2,2 0 0 1 2,2 V23 a2,2 0 0 1 -2,2 H22 L20,27 V25", 1.4);
      break;
    }
    case "rope":
    case "rotate": {
      ring(16, 16, 8);
      pa("M16,16 L23,12", 1.6);
      pa("M22,8 A8,8 0 0 1 25,14", 1.4);
      pa("M25,14 L25.5,10.5 M25,14 L21.5,13.5", 1.4);
      dot(16, 16, 1.6);
      break;
    }
    case "expand": {
      pa("M13,16 H5 M8,13 L5,16 L8,19", 1.5);
      pa("M19,16 H27 M24,13 L27,16 L24,19", 1.5);
      ln(16, 10, 16, 22, 1.3);
      break;
    }
    // ---- Transformer ---------------------------------------------------
    case "transformer":
    case "bipartite": {
      const top: [number, number][] = [[8, 9], [16, 9], [24, 9]];
      const bot: [number, number][] = [[8, 23], [16, 23], [24, 23]];
      top.forEach(([x1, y1]) => bot.forEach(([x2, y2]) => ln(x1, y1, x2, y2, 0.9)));
      top.forEach(([x, y]) => dot(x, y, 2));
      bot.forEach(([x, y]) => dot(x, y, 2));
      break;
    }
    case "layers": {
      rcf(8, 8, 16, 4, 1.2);
      rcf(8, 14, 16, 4, 1.2);
      rcf(8, 20, 16, 4, 1.2);
      break;
    }
    case "mlp":
    case "wide": {
      pa("M8,16 L16,9 L24,16 L16,23 Z");
      ln(8, 16, 24, 16, 1.2);
      break;
    }
    case "moe":
    case "router": {
      dot(7, 16, 2.2);
      [[25, 8], [25, 16], [25, 24]].forEach(([x, y]) => { ln(7, 16, x, y, 1); rc(x - 1.5, y - 2.5, 5, 5, 1); });
      break;
    }
    // ---- Generate ------------------------------------------------------
    case "generate": {
      rc(5, 13, 4.5, 6, 1);
      rc(10.5, 13, 4.5, 6, 1);
      rc(16, 13, 4.5, 6, 1);
      pa("M21.5,16 H24", 1.4);
      pa("M23,14 L25,16 L23,18", 1.4);
      rcf(25.5, 12, 4.5, 8, 1.2);
      break;
    }
    case "loop": {
      pa("M24,16 A8,8 0 1 1 16,8", 1.7);
      pa("M16,4 L16,8 L20,8", 1.5);
      break;
    }
    case "braces": {
      pa("M14,7 C11,7 12.5,14 9,16 C12.5,18 11,25 14,25", 1.5);
      pa("M18,7 C21,7 19.5,14 23,16 C19.5,18 21,25 18,25", 1.5);
      break;
    }
    case "tool": {
      ring(16, 16, 4.5);
      dot(16, 16, 1.2);
      for (let a = 0; a < 360; a += 60) {
        const r = (a * Math.PI) / 180;
        ln(16 + Math.cos(r) * 6, 16 + Math.sin(r) * 6, 16 + Math.cos(r) * 8.5, 16 + Math.sin(r) * 8.5, 1.6);
      }
      break;
    }
    case "tree":
    case "search": {
      dot(16, 7, 2);
      dot(9, 18, 2); dot(23, 18, 2);
      dot(6, 26, 1.7); dot(12, 26, 1.7); dot(23, 26, 1.7);
      ln(16, 7, 9, 18); ln(16, 7, 23, 18);
      ln(9, 18, 6, 26); ln(9, 18, 12, 26); ln(23, 18, 23, 26);
      break;
    }
    // ---- Pretrain ------------------------------------------------------
    case "pretrain":
    case "curve": {
      ln(7, 25, 26, 25, 1.3);
      ln(7, 25, 7, 6, 1.3);
      pa("M8,9 C13,10 14,20 25,23");
      dot(25, 23, 2);
      break;
    }
    case "steps": {
      pa("M7,8 H12 V14 H17 V19 H22 V24 H26");
      break;
    }
    case "precision":
    case "quant":
    case "bits": {
      const pat = [1, 0, 1, 1, 0, 1, 1, 0];
      pat.forEach((v, i) => {
        const x = 7 + (i % 4) * 5;
        const y = 11 + Math.floor(i / 4) * 6;
        if (v) rcf(x, y, 3.6, 3.6, 0.6); else rc(x, y, 3.6, 3.6, 0.6);
      });
      break;
    }
    case "matrixopt":
    case "matrix": {
      pa("M9,9 h-2 v14 h2", 1.4);
      pa("M23,9 h2 v14 h-2", 1.4);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) dot(11 + c * 5, 12 + r * 4, 1.4);
      break;
    }
    // ---- Finetune ------------------------------------------------------
    case "finetune":
    case "adapter": {
      rc(6, 9, 14, 14, 2.5);
      rcf(18, 17, 8, 8, 1.8);
      ln(22, 19.5, 22, 22.5, 1.4).attr("stroke", "var(--bg)");
      ln(20.5, 21, 23.5, 21, 1.4).attr("stroke", "var(--bg)");
      break;
    }
    case "distill": {
      ring(9, 16, 5);
      pa("M15,16 H20", 1.4);
      pa("M18,14 L20,16 L18,18", 1.4);
      ring(24, 16, 3);
      break;
    }
    // ---- Align ---------------------------------------------------------
    case "reward":
    case "whyalign": {
      pa("M16,6 L18.5,13 L26,13 L20,17.5 L22,25 L16,20.5 L10,25 L12,17.5 L6,13 L13.5,13 Z");
      break;
    }
    case "align":
    case "scale": {
      ln(6, 13, 26, 13);
      ln(16, 13, 16, 7, 1.4);
      dot(16, 6, 1.4);
      pa("M12,26 L20,26 L16,20 Z");
      ln(16, 20, 16, 13, 1.4);
      pa("M5,13 V16 M4,16 A3,3 0 0 0 10,16", 1.3);
      pa("M27,13 V15 M26,15 A3,3 0 0 0 28,15", 1.3).attr("transform", "translate(-5,0)");
      break;
    }
    case "grpo":
    case "group": {
      [[9, 11], [14, 9], [12, 15], [19, 12], [23, 10], [21, 16]].forEach(([x, y]) => dot(x, y, 1.6));
      pa("M6,21 H26", 1.4).attr("stroke-dasharray", "2 2");
      break;
    }
    case "verifiable":
    case "verify": {
      rc(7, 7, 18, 18, 3.5);
      pa("M11,16 L15,20 L22,12", 1.8);
      break;
    }
    // ---- Serve ---------------------------------------------------------
    case "serve":
    case "cache": {
      rc(7, 8, 9, 5, 1); rc(7, 14, 9, 5, 1); rc(7, 20, 9, 5, 1);
      ln(16, 11, 26, 11, 1.3); pa("M24,9.5 L26,11 L24,12.5", 1.3);
      ln(16, 16.5, 26, 16.5, 1.3); pa("M24,15 L26,16.5 L24,18", 1.3);
      break;
    }
    default: {
      ring(16, 16, 7);
    }
  }
}
