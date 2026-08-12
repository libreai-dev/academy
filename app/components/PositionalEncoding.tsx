"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Deeper } from "./webscale-kit";
import {
  DIM,
  POSITIONS,
  MEANING_VECTOR,
  positionalVector,
  combinedVector,
  ORDERINGS,
  BAG_ORDER,
} from "../lib/positional-encoding";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS tokens + theme flips resolve live. viewBox
 * widths are kept small (≈600) so label text renders ≥12px on a 320px card.
 * ======================================================================== */

/** A rounded word chip; returns its measured width. */
function wordChip(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  word: string,
  x: number,
  y: number,
  h: number,
  opts: { fill: string; stroke: string; ink: string; fontSize: number },
): number {
  const w = Math.max(78, word.length * opts.fontSize * 0.62 + 34);
  const cell = g.append("g").attr("transform", `translate(${x},${y})`);
  cell
    .append("rect")
    .attr("width", w)
    .attr("height", h)
    .attr("rx", 12)
    .style("fill", opts.fill)
    .style("stroke", opts.stroke)
    .style("stroke-width", 1.5);
  cell
    .append("text")
    .attr("x", w / 2)
    .attr("y", h / 2 + opts.fontSize * 0.36)
    .attr("text-anchor", "middle")
    .style("fill", opts.ink)
    .style("font-family", MONO)
    .style("font-size", `${opts.fontSize}px`)
    .style("font-weight", "600")
    .text(word);
  return w;
}

/* --- Node 1: three words, rearranged, with an agent→target arc ----------- */

function drawOrder(
  el: SVGSVGElement,
  o: { words: string[]; order: number[]; roles: string[]; arcLabel: string; verdict: string; reduce: boolean },
) {
  const W = 600;
  const H = 256;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const chipH = 68;
  const chipY = 78;
  const fs = 28;
  const gap = 18;

  // measure widths first so the row can be centred
  const seq = o.order.map((i) => o.words[i]);
  const widths = seq.map((word) => Math.max(78, word.length * fs * 0.62 + 34));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (seq.length - 1);
  let x = (W - total) / 2;
  const centres: number[] = [];
  const roleForSlot = [o.roles[0], o.roles[1], o.roles[2]];

  seq.forEach((word, slot) => {
    // agent (first) and target (last) are highlighted green; the verb is neutral.
    const isEnd = slot === 0 || slot === seq.length - 1;
    const w = wordChip(g, word, x, chipY, chipH, {
      fill: isEnd ? "var(--signal-wash)" : "var(--surface)",
      stroke: isEnd ? "var(--signal)" : "var(--border)",
      ink: "var(--fg)",
      fontSize: fs,
    });
    centres.push(x + w / 2);
    // role tag beneath
    g.append("text")
      .attr("x", x + w / 2)
      .attr("y", chipY + chipH + 30)
      .attr("text-anchor", "middle")
      .style("fill", isEnd ? "var(--signal-fg)" : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "24px")
      .style("letter-spacing", ".04em")
      .text(roleForSlot[slot]);
    x += w + gap;
  });

  // arc arrow from agent (first) to target (last), bowed above the row
  const ax = centres[0];
  const bx = centres[centres.length - 1];
  const topY = chipY - 10;
  const arcTop = 30;
  const path = `M ${ax} ${topY} C ${ax} ${arcTop}, ${bx} ${arcTop}, ${bx} ${topY}`;
  const defs = svg.append("defs");
  defs
    .append("marker")
    .attr("id", "pe-arrow")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 8)
    .attr("refY", 5)
    .attr("markerWidth", 7)
    .attr("markerHeight", 7)
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .style("fill", "var(--signal)");
  const arc = g
    .append("path")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", "var(--signal)")
    .style("stroke-width", 2.5)
    .attr("marker-end", "url(#pe-arrow)");
  if (!o.reduce) {
    const len = (arc.node() as SVGPathElement).getTotalLength();
    arc.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(500).attr("stroke-dashoffset", 0);
  }
  g.append("text")
    .attr("x", (ax + bx) / 2)
    .attr("y", arcTop - 6)
    .attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)")
    .style("font-family", MONO)
    .style("font-size", "24px")
    .text(o.arcLabel);

  // verdict line
  g.append("text")
    .attr("x", W / 2)
    .attr("y", H - 16)
    .attr("text-anchor", "middle")
    .style("fill", "var(--fg)")
    .style("font-family", DISPLAY)
    .style("font-size", "30px")
    .style("font-weight", "600")
    .text(o.verdict);
}

/* --- Node 2: ordered input → the same unordered bag --------------------- */

function drawBag(
  el: SVGSVGElement,
  o: { words: string[]; order: number[]; wroteLabel: string; dropLabel: string; bagLabel: string; sameTag: string; reduce: boolean },
) {
  const W = 600;
  const H = 348;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const fs = 26;
  const chipH = 58;
  const gap = 16;

  const label = (text: string, x: number, y: number, colour = "var(--muted)") =>
    g.append("text").attr("x", x).attr("y", y).style("fill", colour).style("font-family", MONO).style("font-size", "24px").style("letter-spacing", ".03em").text(text);

  // --- top: ordered input, with a slot index over each chip ---
  label(o.wroteLabel, 12, 26);
  const seq = o.order.map((i) => o.words[i]);
  const widths = seq.map((word) => Math.max(78, word.length * fs * 0.62 + 34));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (seq.length - 1);
  let x = (W - total) / 2;
  const topY = 44;
  seq.forEach((word, slot) => {
    g.append("text").attr("x", x + widths[slot] / 2).attr("y", topY - 6).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "24px").text(`#${slot}`);
    const w = wordChip(g, word, x, topY + 8, chipH, { fill: "var(--surface)", stroke: "var(--border)", ink: "var(--fg)", fontSize: fs });
    x += w + gap;
  });

  // --- middle: the drop arrow ---
  const midY = topY + chipH + 54;
  g.append("text").attr("x", W / 2).attr("y", midY).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "24px").text(o.dropLabel);

  // --- bottom: the bag — always the SAME canonical order, in a dashed pill ---
  label(o.bagLabel, 12, midY + 36);
  const bagY = midY + 50;
  const bagInnerH = chipH + 44;
  g.append("rect")
    .attr("x", 12)
    .attr("y", bagY)
    .attr("width", W - 24)
    .attr("height", bagInnerH)
    .attr("rx", 18)
    .style("fill", "var(--signal-wash)")
    .style("stroke", "var(--signal)")
    .style("stroke-width", 2)
    .style("stroke-dasharray", "7 6");
  const bagSeq = BAG_ORDER.map((i) => o.words[i]);
  const bWidths = bagSeq.map((word) => Math.max(78, word.length * fs * 0.62 + 34));
  const bTotal = bWidths.reduce((a, b) => a + b, 0) + gap * (bagSeq.length - 1);
  let bx = (W - bTotal) / 2;
  const chipTop = bagY + 14;
  bagSeq.forEach((word) => {
    const w = wordChip(g, word, bx, chipTop, chipH, { fill: "var(--bg)", stroke: "var(--signal)", ink: "var(--fg)", fontSize: fs });
    bx += w + gap;
  });
  g.append("text").attr("x", W / 2).attr("y", bagY + bagInnerH - 10).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "24px").text(o.sameTag);
}

/* --- Node 3: meaning + position = model input (three vector strips) ------ */

function drawAdd(
  el: SVGSVGElement,
  o: { pos: number; on: boolean; word: string; labels: { meaning: string; plus: string; equals: string; off: string; tag: string }; reduce: boolean },
) {
  const W = 600;
  const H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");

  const meaning = MEANING_VECTOR.slice(0, DIM);
  const posv: number[] = o.on ? positionalVector(o.pos, DIM) : new Array(DIM).fill(0);
  const combined = combinedVector(o.pos, o.on, DIM);

  const stripX = 16;
  const stripW = W - stripX * 2;
  const cellW = stripW / DIM;
  const maxAbs = 1.8; // combined can reach ~1.7
  const half = 26; // px per row half-height for bars

  // Each block: a label line, then a full-width bar strip below it (so the long
  // labels never collide with the strip).
  const blocks: { label: string; vec: number[]; labelY: number; baseY: number; dim?: boolean }[] = [
    { label: `${o.labels.meaning} · ${o.word}`, vec: meaning, labelY: 28, baseY: 74 },
    { label: o.on ? `${o.labels.plus} #${o.pos}` : `${o.labels.plus} (${o.labels.off})`, vec: posv, labelY: 128, baseY: 174, dim: !o.on },
    { label: o.labels.equals, vec: combined, labelY: 228, baseY: 274 },
  ];

  blocks.forEach((blk) => {
    g.append("text")
      .attr("x", stripX)
      .attr("y", blk.labelY)
      .style("fill", blk.dim ? "var(--muted)" : "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", "24px")
      .style("font-weight", "600")
      .text(blk.label);
    // baseline
    g.append("line")
      .attr("x1", stripX)
      .attr("y1", blk.baseY)
      .attr("x2", stripX + stripW)
      .attr("y2", blk.baseY)
      .style("stroke", "var(--hair)")
      .style("stroke-width", 1);
    // bars
    blk.vec.forEach((v, i) => {
      const cx = stripX + i * cellW + cellW / 2;
      const barW = Math.min(40, cellW - 10);
      const hgt = (Math.min(Math.abs(v), maxAbs) / maxAbs) * half;
      const up = v >= 0;
      const y = up ? blk.baseY - hgt : blk.baseY;
      const colour = blk.dim ? "var(--border)" : up ? "var(--signal)" : "var(--tok-byte)";
      const bar = g
        .append("rect")
        .attr("x", cx - barW / 2)
        .attr("width", barW)
        .attr("rx", 3)
        .style("fill", colour);
      if (o.reduce) bar.attr("y", y).attr("height", Math.max(2, hgt));
      else bar.attr("y", blk.baseY).attr("height", 0).transition().duration(420).attr("y", y).attr("height", Math.max(2, hgt));
    });
  });

  // outcome tag inside the diagram
  g.append("text")
    .attr("x", W / 2)
    .attr("y", H - 12)
    .attr("text-anchor", "middle")
    .style("fill", o.on ? "var(--signal-fg)" : "var(--tok-byte)")
    .style("font-family", MONO)
    .style("font-size", "24px")
    .text(o.labels.tag);
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

function usePE() {
  const { t } = useAcademy();
  return t.positionalEncoding;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const pe = usePE();
  const n = pe.nodes[0];
  const [idx, setIdx] = useState(0);
  const ordering = ORDERINGS[idx];
  return (
    <SceneShell
      id="pe-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {ORDERINGS.map((ord, i) => (
            <Toggle key={ord.key} on={idx === i} onClick={() => setIdx(i)}>
              {ord.order.map((w) => pe.words[w]).join(" ")}
            </Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawOrder(el, { words: pe.words, order: ordering.order, roles: pe.n1roles, arcLabel: pe.n1arcLabel, verdict: pe.n1verdicts[idx], reduce })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const pe = usePE();
  const n = pe.nodes[1];
  const [idx, setIdx] = useState(0);
  const ordering = ORDERINGS[idx];
  return (
    <SceneShell
      id="pe-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {ORDERINGS.map((ord, i) => (
            <Toggle key={ord.key} on={idx === i} onClick={() => setIdx(i)}>
              {ord.order.map((w) => pe.words[w]).join(" ")}
            </Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawBag(el, { words: pe.words, order: ordering.order, wroteLabel: pe.n2wroteLabel, dropLabel: pe.n2dropLabel, bagLabel: pe.n2bagLabel, sameTag: pe.n2sameTag, reduce })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const pe = usePE();
  const n = pe.nodes[2];
  const [on, setOn] = useState(false); // show the broken state first
  const [pos, setPos] = useState(0);
  const tag = on ? pe.n3onTagFmt.replace("{p}", String(pos)) : pe.n3offTag;
  const note = on ? pe.n3onNote : pe.n3offNote;
  return (
    <SceneShell
      id="pe-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <Toggle on={on} onClick={() => setOn((v) => !v)} ariaLabel={pe.n3peToggle}>
            {pe.n3peToggle}: {on ? "ON" : "OFF"}
          </Toggle>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{pe.n3posLabel}</div>
          <ControlRow>
            {POSITIONS.map((p) => (
              <Toggle key={p} on={pos === p} onClick={() => setPos(p)} ariaLabel={`${pe.n3posLabel} ${p}`}>
                #{p}
              </Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawAdd(el, { pos, on, word: pe.n3word, labels: { meaning: pe.n3meaningLabel, plus: pe.n3plusLabel, equals: pe.n3equalsLabel, off: pe.n3offWord, tag }, reduce })}
          deps={[pos, on, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function PositionalEncoding() {
  const { t, lang } = useAcademy();
  const pe = t.positionalEncoding;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{pe.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {pe.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{pe.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{pe.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {pe.pipeline.map((label, i) => (
              <a key={i} href={`#pe-node-${i + 1}`} className="u-hover-fg-border"
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

      {/* ---- Go deeper (Node 3 maths, out of the main flow) ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(30px,4vw,48px) auto 0" }}>
        <Deeper title={pe.n3deeperTitle}>{rich(pe.n3deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(24px,3vw,36px) auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{pe.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{pe.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(pe.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{pe.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(pe.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/safety-filtering" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {pe.prevLesson}</Link>
        <Link href="/stage/0/special-tokens" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{pe.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
