"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow } from "./webscale-kit";
import {
  buildCells,
  isGraded,
  tokenLoss,
  gradedCount,
  type Cell,
} from "../lib/supervised-fine-tuning";

/* ======================================================================== *
 * Token-strip layout — the shared d3 primitive. Lays the cells of one
 * training example out in wrapping rows inside a single <svg> mount (no
 * hand-authored SVG shapes). Colour only via .style() with design tokens.
 *
 * Font floor: viewBox width 480 renders as narrow as ~290px on a phone
 * (factor ~0.6), so all label text is >= 20 units => >= 12px rendered.
 * ======================================================================== */

const VB_W = 480;
const MARGIN = 8;
const CHAR_W = 12; // approx px per glyph for 21px JetBrains Mono
const PAD_X = 10;
const F_TOKEN = 21;
const F_MARK = 20;
const F_SMALL = 20;

function cellWidth(piece: string): number {
  return Math.max(34, piece.length * CHAR_W + PAD_X * 2);
}

const REGION_FILL: Record<Cell["region"], string> = {
  marker: "var(--tok-punct)",
  prompt: "var(--tok-space)",
  response: "var(--signal)",
};

/** Place the cells into wrapping rows starting at y0; returns the bottom y. */
function layoutCells(cells: Cell[], x0: number, maxX: number, rowH: number, gapY: number) {
  const rows: { cell: Cell; x: number; y: number; w: number }[] = [];
  let x = x0;
  let y = 0;
  cells.forEach((cell) => {
    const w = cellWidth(cell.piece);
    if (x > x0 && x + w > maxX) {
      x = x0;
      y += rowH + gapY;
    }
    rows.push({ cell, x, y, w });
    x += w + 8;
  });
  return { rows, bottom: y + rowH };
}

/** A small legend swatch + label, stacked one per row (left-aligned at MARGIN). */
function legend(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  y: number,
  fill: string,
  outlineOnly: boolean,
  text: string,
) {
  g.append("rect")
    .attr("x", MARGIN)
    .attr("y", y - 14)
    .attr("width", 15)
    .attr("height", 15)
    .attr("rx", 3)
    .style("fill", outlineOnly ? "transparent" : `color-mix(in srgb, ${fill} 20%, transparent)`)
    .style("stroke", fill)
    .style("stroke-width", 1.6)
    .style("stroke-dasharray", outlineOnly ? "3 2" : "none");
  g.append("text")
    .attr("x", MARGIN + 23)
    .attr("y", y)
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", `${F_SMALL}px`)
    .text(text);
}

/* --- Node 1: the formatted example strip --------------------------------- */

function drawExample(
  el: SVGSVGElement,
  o: { cells: Cell[]; reduce: boolean; markerLegend: string; promptLegend: string; responseLegend: string },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const rowH = 40;
  const { rows, bottom } = layoutCells(o.cells, MARGIN, VB_W - MARGIN, rowH, 12);
  const top = 10;

  rows.forEach(({ cell, x, y, w }, i) => {
    const fill = REGION_FILL[cell.region];
    const isMarker = cell.region === "marker";
    const cellG = g.append("g").attr("transform", `translate(${x},${top + y})`);
    if (!o.reduce) cellG.style("opacity", 0).transition().duration(220).delay(Math.min(i * 16, 340)).style("opacity", 1);
    cellG
      .append("rect")
      .attr("width", w)
      .attr("height", rowH)
      .attr("rx", 9)
      .style("fill", isMarker ? "transparent" : `color-mix(in srgb, ${fill} 16%, transparent)`)
      .style("stroke", isMarker ? fill : `color-mix(in srgb, ${fill} 44%, var(--border))`)
      .style("stroke-width", isMarker ? 1.8 : 1)
      .style("stroke-dasharray", isMarker ? "4 3" : "none");
    cellG
      .append("text")
      .attr("x", w / 2)
      .attr("y", rowH / 2 + F_TOKEN / 3)
      .attr("text-anchor", "middle")
      .style("fill", "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", `${isMarker ? F_MARK : F_TOKEN}px`)
      .text(cell.piece);
  });

  // legend rows (stacked, so long labels never overflow the viewBox width)
  const ly = top + bottom + 30;
  legend(g, ly, REGION_FILL.prompt, false, o.promptLegend);
  legend(g, ly + 26, REGION_FILL.response, false, o.responseLegend);
  legend(g, ly + 52, REGION_FILL.marker, true, o.markerLegend);

  svg.attr("viewBox", `0 0 ${VB_W} ${ly + 66}`).attr("preserveAspectRatio", "xMidYMid meet");
}

/* --- Node 2: the loss mask ---------------------------------------------- */

function drawLossMask(
  el: SVGSVGElement,
  o: {
    cells: Cell[];
    masked: boolean;
    reduce: boolean;
    ignoredLegend: string;
    gradedLegend: string;
    footer: string;
  },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const boxH = 36; // token box
  const barLane = 26; // loss-bar area under each cell
  const rowH = boxH + barLane;
  const { rows, bottom } = layoutCells(o.cells, MARGIN, VB_W - MARGIN, rowH, 14);
  const top = 10;

  rows.forEach(({ cell, x, y, w }, i) => {
    const graded = isGraded(cell.region, o.masked);
    const fill = graded ? "var(--signal)" : "var(--tok-space)";
    const cellG = g.append("g").attr("transform", `translate(${x},${top + y})`);
    if (!o.reduce) cellG.style("opacity", 0).transition().duration(200).delay(Math.min(i * 14, 300)).style("opacity", 1);
    // token box
    cellG
      .append("rect")
      .attr("width", w)
      .attr("height", boxH)
      .attr("rx", 8)
      .style("fill", graded ? `color-mix(in srgb, ${fill} 18%, transparent)` : "var(--surface)")
      .style("stroke", graded ? `color-mix(in srgb, ${fill} 55%, var(--border))` : "var(--border)")
      .style("stroke-width", 1)
      .style("opacity", graded ? 1 : 0.75);
    cellG
      .append("text")
      .attr("x", w / 2)
      .attr("y", boxH / 2 + F_TOKEN / 3)
      .attr("text-anchor", "middle")
      .style("fill", graded ? "var(--fg)" : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", `${F_MARK}px`)
      .text(cell.piece);
    // loss lane
    if (graded) {
      const loss = tokenLoss(cell.piece, i);
      const barW = Math.max(8, (w - 12) * loss);
      const bar = cellG
        .append("rect")
        .attr("x", 6)
        .attr("y", boxH + 8)
        .attr("height", 10)
        .attr("rx", 4)
        .style("fill", "var(--signal)");
      if (o.reduce) bar.attr("width", barW);
      else bar.attr("width", 0).transition().duration(420).ease(d3.easeCubicOut).attr("width", barW);
    } else {
      // a flat grey dash = read, but no gradient
      cellG
        .append("line")
        .attr("x1", 6)
        .attr("x2", w - 6)
        .attr("y1", boxH + 13)
        .attr("y2", boxH + 13)
        .style("stroke", "var(--border)")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "3 4");
    }
  });

  // legend rows + footer count (stacked so long labels never overflow)
  const ly = top + bottom + 30;
  legend(g, ly, "var(--tok-space)", false, o.ignoredLegend);
  legend(g, ly + 26, "var(--signal)", false, o.gradedLegend);
  g.append("text")
    .attr("x", MARGIN)
    .attr("y", ly + 56)
    .style("fill", "var(--signal-fg)")
    .style("font-family", MONO)
    .style("font-size", `${F_SMALL}px`)
    .style("font-weight", 700)
    .text(o.footer);

  svg.attr("viewBox", `0 0 ${VB_W} ${ly + 70}`).attr("preserveAspectRatio", "xMidYMid meet");
}

/* ======================================================================== *
 * Diagram mount + node components
 * ======================================================================== */

function DiagramSvg({ draw, deps, label }: { draw: (el: SVGSVGElement) => void; deps: unknown[]; label: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const { lang } = useAcademy();
  useEffect(() => {
    if (ref.current) draw(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, lang]);
  return <svg ref={ref} role="img" aria-label={label} style={{ width: "100%", height: "auto", display: "block" }} />;
}

function useSFT() {
  const { t } = useAcademy();
  return t.supervisedFineTuning;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const sft = useSFT();
  const n = sft.nodes[0];
  const [idx, setIdx] = useState(0);
  const ex = sft.examples[idx];
  const cells = buildCells(ex.prompt, ex.response);
  return (
    <SceneShell
      id="sft-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {sft.examples.map((e, i) => (
            <Toggle key={e.key} on={idx === i} onClick={() => setIdx(i)}>{e.label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawExample(el, { cells, reduce, markerLegend: sft.n1markerLegend, promptLegend: sft.n1promptLabel, responseLegend: sft.n1responseLabel })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const sft = useSFT();
  const n = sft.nodes[1];
  const [idx, setIdx] = useState(0);
  const [masked, setMasked] = useState(true); // SFT default: prompt masked
  const ex = sft.examples[idx];
  const cells = buildCells(ex.prompt, ex.response);
  const { graded, total } = gradedCount(cells, masked);
  const footer = `${graded} / ${total} ${sft.n2tokensGraded}`;
  return (
    <SceneShell
      id="sft-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={masked ? sft.n2maskedNote : sft.n2unmaskedNote}
      controls={
        <>
          <Toggle on={masked} onClick={() => setMasked((v) => !v)}>{sft.n2mask}: {masked ? "ON" : "OFF"}</Toggle>
          <ControlRow>
            {sft.examples.map((e, i) => (
              <Toggle key={e.key} on={idx === i} onClick={() => setIdx(i)}>{e.label}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawLossMask(el, { cells, masked, reduce, ignoredLegend: sft.n2ignoredLegend, gradedLegend: sft.n2gradedLegend, footer })}
          deps={[idx, masked, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3: base vs SFT, side-by-side text cards ---------------------- */

function OutcomeCard({ label, tag, tone, prompt, promptLabel, body }: { label: string; tag: string; tone: "base" | "sft"; prompt: string; promptLabel: string; body: string }) {
  const accent = tone === "sft" ? "var(--signal)" : "var(--tok-byte)";
  return (
    <div style={{ border: `1px solid ${tone === "sft" ? "var(--signal)" : "var(--border)"}`, borderRadius: 14, overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>
        <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".08em", color: "var(--fg)", fontWeight: 700 }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: accent }}>{tag}</span>
      </div>
      <div style={{ padding: "13px 15px" }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{promptLabel}</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--muted)", marginTop: 4 }}>{prompt}</div>
        <div style={{ height: 1, background: "var(--hair)", margin: "12px 0" }} />
        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--fg)", whiteSpace: "pre-wrap", fontFamily: tone === "sft" ? undefined : MONO }}>{body}</div>
      </div>
    </div>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const sft = useSFT();
  const n = sft.nodes[2];
  const [idx, setIdx] = useState(0);
  const oc = sft.outcomes[idx];
  return (
    <SceneShell
      id="sft-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {sft.outcomes.map((e, i) => (
            <Toggle key={e.key} on={idx === i} onClick={() => setIdx(i)}>{e.label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12, animation: reduce ? undefined : "rise .18s ease both" }}>
          <OutcomeCard label={sft.n3baseLabel} tag={sft.n3baseTag} tone="base" prompt={oc.prompt} promptLabel={sft.n3promptLabel} body={oc.base} />
          <OutcomeCard label={sft.n3sftLabel} tag={sft.n3sftTag} tone="sft" prompt={oc.prompt} promptLabel={sft.n3promptLabel} body={oc.sft} />
        </div>
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function SupervisedFineTuning() {
  const { t, lang } = useAcademy();
  const sft = t.supervisedFineTuning;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{sft.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {sft.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{sft.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{sft.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {sft.pipeline.map((label, i) => (
              <a key={i} href={`#sft-node-${i + 1}`} className="u-hover-fg-border"
                style={{ display: "flex", gap: 9, alignItems: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13, color: "var(--fg)" }}>
                <span style={{ color: "var(--signal-fg)", flex: "0 0 auto" }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Nodes ---- */}
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(40px, 6vw, 80px)", marginTop: "clamp(40px, 6vw, 80px)" }}>
        <Node1 reduce={reduce} />
        <Node2 reduce={reduce} />
        <Node3 reduce={reduce} />
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{sft.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{sft.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(sft.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{sft.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(sft.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/optimizers" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {sft.prevLesson}</Link>
        <Link href="/stage/0/synthetic-data" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{sft.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
