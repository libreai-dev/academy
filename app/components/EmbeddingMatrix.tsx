"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow } from "./webscale-kit";
import {
  EM_CLUSTER,
  EM_CLUSTER_TOKENS,
  EM_IDS,
  EM_VECTORS,
  EM_XY,
  EM_RXY,
  EM_FOCUS,
  neighboursOf,
} from "../lib/embedding-matrix";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

/** `var(--tok-…)` for a token row's cluster. */
const colorOf = (i: number) => `var(${EM_CLUSTER_TOKENS[EM_CLUSTER[i]]})`;

/* --- Node 1: token id → matrix row → the vector (bars) ------------------- */

function drawLookup(
  el: SVGSVGElement,
  o: {
    sel: number;
    words: string[];
    reduce: boolean;
    matrixTitle: string;
    vectorTitle: string;
    dims: string;
    rowWord: string;
  },
) {
  const W = 760, H = 472;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const N = o.words.length;
  const rowH = 26, top = 52;
  const cellsX = 152, cellsRight = 432;
  const nD = EM_VECTORS[0].length;
  const cellW = (cellsRight - cellsX) / nD;

  // column titles
  svg.append("text").attr("x", 10).attr("y", 28).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".06em").text(o.matrixTitle);

  // rows of the matrix
  o.words.forEach((w, i) => {
    const y = top + i * rowH;
    const on = i === o.sel;
    if (on) {
      svg.append("rect").attr("x", 6).attr("y", y - 1).attr("width", cellsRight - 6).attr("height", rowH - 2).attr("rx", 6)
        .style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 1.5);
    }
    svg.append("text").attr("x", 12).attr("y", y + rowH / 2 + 4)
      .style("fill", on ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("font-weight", on ? 700 : 400)
      .text(`#${EM_IDS[i]} ${w}`);
    EM_VECTORS[i].forEach((v, d) => {
      const cx = cellsX + d * cellW;
      const pos = v >= 0;
      svg.append("rect").attr("x", cx + 1).attr("y", y + 3).attr("width", cellW - 2).attr("height", rowH - 8).attr("rx", 3)
        .style("fill", pos ? "var(--signal)" : "var(--tok-byte)")
        .style("fill-opacity", (on ? 0.3 : 0.12) + Math.abs(v) * (on ? 0.65 : 0.35));
    });
  });

  // connector: selected row → vector panel
  const panelX = 490;
  const selY = top + o.sel * rowH + rowH / 2;
  const conn = svg.append("path")
    .attr("d", `M ${cellsRight} ${selY} C ${cellsRight + 30} ${selY}, ${panelX - 34} 96, ${panelX - 6} 96`)
    .style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2);
  if (!o.reduce) {
    const len = (conn.node() as SVGPathElement).getTotalLength();
    conn.attr("stroke-dasharray", `${len}`).attr("stroke-dashoffset", `${len}`).transition().duration(450).attr("stroke-dashoffset", 0);
  }

  // vector panel
  const panelRight = 752;
  const panelW = panelRight - panelX;
  svg.append("text").attr("x", panelX).attr("y", 28).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".06em").text(o.vectorTitle);
  svg.append("text").attr("x", panelX).attr("y", 58).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", 700).text(o.words[o.sel]);
  svg.append("text").attr("x", panelX).attr("y", 80).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${o.rowWord} #${EM_IDS[o.sel]}`);

  const baselineY = 262, maxH = 120;
  const slot = panelW / nD, barW = 20;
  svg.append("line").attr("x1", panelX).attr("y1", baselineY).attr("x2", panelRight).attr("y2", baselineY).style("stroke", "var(--hair)").style("stroke-width", 1);
  EM_VECTORS[o.sel].forEach((v, d) => {
    const h = Math.max(2, Math.abs(v) * maxH);
    const x = panelX + d * slot + (slot - barW) / 2;
    const yTop = v >= 0 ? baselineY - h : baselineY;
    const bar = svg.append("rect").attr("x", x).attr("width", barW).attr("rx", 3)
      .style("fill", v >= 0 ? "var(--signal)" : "var(--tok-byte)");
    if (o.reduce) bar.attr("y", yTop).attr("height", h);
    else bar.attr("y", baselineY).attr("height", 0).transition().duration(500).ease(d3.easeCubicOut).attr("y", yTop).attr("height", h);
  });
  svg.append("text").attr("x", panelX).attr("y", baselineY + maxH + 22).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.dims);
}

/* --- Node 2: the meaning map — points + nearest-neighbour links ---------- */

function drawMap(
  el: SVGSVGElement,
  o: { sel: number; words: string[]; reduce: boolean },
) {
  const W = 760, H = 468;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const padX = 44, padTop = 30, padBot = 30;
  const X = (x: number) => padX + x * (W - 2 * padX);
  const Y = (y: number) => padTop + y * (H - padTop - padBot);

  const nb = neighboursOf(o.sel);

  // neighbour links (drawn first, under the dots)
  nb.forEach((j) => {
    const line = svg.append("line").attr("x1", X(EM_XY[o.sel].x)).attr("y1", Y(EM_XY[o.sel].y)).attr("x2", X(EM_XY[j].x)).attr("y2", Y(EM_XY[j].y))
      .style("stroke", "var(--signal)").style("stroke-width", 2).style("opacity", 0.85);
    if (!o.reduce) line.style("opacity", 0).transition().duration(360).style("opacity", 0.85);
  });

  o.words.forEach((w, i) => {
    const focus = i === o.sel;
    const isNb = nb.includes(i);
    const cx = X(EM_XY[i].x), cy = Y(EM_XY[i].y);
    const r = focus ? 11 : isNb ? 8 : 6.5;
    if (focus) svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", r + 5).style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2.5);
    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", r)
      .style("fill", colorOf(i)).style("stroke", "var(--bg)").style("stroke-width", 1.5)
      .style("opacity", focus || isNb ? 1 : 0.45);
    svg.append("text").attr("x", cx + r + 5).attr("y", cy + 4)
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").style("font-weight", focus ? 700 : 500)
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "3px").style("stroke-linejoin", "round")
      .style("opacity", focus || isNb ? 1 : 0.5)
      .text(w);
  });
}

/* --- Node 3: before/after training — random cloud → clusters ------------- */

function drawLearn(
  el: SVGSVGElement,
  o: { trained: boolean; words: string[]; reduce: boolean; tag: string },
) {
  const W = 760, H = 468;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const padX = 44, padTop = 48, padBot = 30;
  const X = (x: number) => padX + x * (W - 2 * padX);
  const Y = (y: number) => padTop + y * (H - padTop - padBot);

  svg.append("text").attr("x", padX).attr("y", 28).style("fill", o.trained ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("font-weight", 600).text(o.tag);

  // faint cluster tints once organised
  if (o.trained) {
    for (let c = 0; c < 4; c++) {
      const pts = o.words.map((_, i) => i).filter((i) => EM_CLUSTER[i] === c);
      const mx = d3.mean(pts, (i) => EM_XY[i].x) ?? 0;
      const my = d3.mean(pts, (i) => EM_XY[i].y) ?? 0;
      const tint = svg.append("circle").attr("cx", X(mx)).attr("cy", Y(my)).attr("r", 66)
        .style("fill", `var(${EM_CLUSTER_TOKENS[c]})`).style("fill-opacity", 0.09);
      if (!o.reduce) tint.style("fill-opacity", 0).transition().delay(250).duration(500).style("fill-opacity", 0.09);
    }
  }

  const dur = o.reduce ? 0 : 720;
  o.words.forEach((w, i) => {
    const from = o.trained ? EM_RXY[i] : EM_XY[i]; // animate in from the opposite state
    const to = o.trained ? EM_XY[i] : EM_RXY[i];
    const dot = svg.append("circle").attr("cx", X(from.x)).attr("cy", Y(from.y)).attr("r", 7)
      .style("fill", o.trained ? "var(--muted)" : colorOf(i)).style("stroke", "var(--bg)").style("stroke-width", 1.5);
    if (dur) dot.transition().duration(dur).ease(d3.easeCubicInOut).attr("cx", X(to.x)).attr("cy", Y(to.y)).style("fill", o.trained ? colorOf(i) : "var(--muted)");
    else dot.attr("cx", X(to.x)).attr("cy", Y(to.y)).style("fill", o.trained ? colorOf(i) : "var(--muted)");

    const label = svg.append("text").attr("x", X(to.x) + 11).attr("y", Y(to.y) + 4)
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").style("font-weight", 500)
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "3px").style("stroke-linejoin", "round")
      .text(w);
    if (dur) label.style("opacity", 0).transition().delay(dur * 0.6).duration(300).style("opacity", 0.92);
    else label.style("opacity", 0.92);
  });
}

/* ======================================================================== *
 * Node components
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

function useEM() {
  return useAcademy().t.embeddingMatrix;
}

/** A small legend tying cluster colour → meaning-group name. */
function Legend({ names }: { names: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
      {names.map((n, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>
          <span aria-hidden style={{ width: 11, height: 11, borderRadius: 3, background: `var(${EM_CLUSTER_TOKENS[i]})`, flex: "0 0 auto" }} />
          {n}
        </span>
      ))}
    </div>
  );
}

function Node1({ reduce }: { reduce: boolean }) {
  const em = useEM();
  const n = em.nodes[0];
  const [sel, setSel] = useState(4); // "king" — the classic example
  return (
    <SceneShell
      id="em-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={em.n1note}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{em.n1pick}</div>
          <ControlRow>
            {em.words.map((w, i) => (
              <Toggle key={i} on={sel === i} onClick={() => setSel(i)}>{w}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLookup(el, { sel, words: em.words, reduce, matrixTitle: em.n1matrixTitle, vectorTitle: em.n1vectorTitle, dims: em.n1dims, rowWord: em.n1rowWas })} deps={[sel, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const em = useEM();
  const n = em.nodes[1];
  const [sel, setSel] = useState(EM_FOCUS[0]);
  const focusIdx = Math.max(0, EM_FOCUS.indexOf(sel));
  const manual = useRef(false);
  const pick = (i: number) => { setSel(i); manual.current = true; };
  return (
    <SceneShell
      id="em-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={4} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setSel(EM_FOCUS[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[focusIdx]}
      aside={<Legend names={em.clusters} />}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{em.n2focus}</div>
          <ControlRow>
            {EM_FOCUS.map((wi) => (
              <Toggle key={wi} on={sel === wi} onClick={() => pick(wi)}>{em.words[wi]}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawMap(el, { sel, words: em.words, reduce })} deps={[sel, reduce]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const em = useEM();
  const n = em.nodes[2];
  const [trained, setTrained] = useState(false); // start random, reveal the order
  const manual = useRef(false);
  const pick = (v: boolean) => { setTrained(v); manual.current = true; };
  return (
    <SceneShell
      id="em-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setTrained(s === 1); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[trained ? 1 : 0]}
      aside={<Legend names={em.clusters} />}
      controls={
        <ControlRow>
          <Toggle on={!trained} onClick={() => pick(false)}>{em.n3before}</Toggle>
          <Toggle on={trained} onClick={() => pick(true)}>{em.n3after}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLearn(el, { trained, words: em.words, reduce, tag: trained ? em.n3afterTag : em.n3beforeTag })} deps={[trained, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function EmbeddingMatrix() {
  const { t, lang } = useAcademy();
  const em = t.embeddingMatrix;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{em.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {em.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{em.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{em.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 8 }}>
            {em.pipeline.map((label, i) => (
              <a key={i} href={`#em-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{em.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{em.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(em.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{em.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(em.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/token-dictionary" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {em.prevLabel}</Link>
        <Link href="/stage/0/transformer-block" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{em.nextLabel} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
