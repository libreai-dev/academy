"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  BASE_VEC,
  rotate,
  norm,
  cosSim,
  FREQS,
  GAP_OMEGA,
  MAX_POS,
  angleAt,
  degWrapped,
  degSigned,
  type Vec2,
} from "../lib/rope-math";

/* ======================================================================== *
 * Drawing helpers — pure d3 into one <svg> mount each (no JSX shapes).
 * All colour via .style() so CSS tokens + theme flips resolve live.
 * ======================================================================== */

type Sel = d3.Selection<SVGSVGElement, unknown, null, undefined>;

/** An arrow from (x0,y0) to (x1,y1): shaft + triangular head. */
function arrow(
  svg: Sel,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  opts: { dash?: boolean; width?: number } = {},
) {
  const width = opts.width ?? 3.2;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const head = 15;
  const bx = x1 - head * 0.85 * Math.cos(ang);
  const by = y1 - head * 0.85 * Math.sin(ang);
  const line = svg
    .append("line")
    .attr("x1", x0).attr("y1", y0).attr("x2", bx).attr("y2", by)
    .style("stroke", color).style("stroke-width", width).style("stroke-linecap", "round");
  if (opts.dash) line.style("stroke-dasharray", "7 7");
  const l = ang + Math.PI * 0.83;
  const r = ang - Math.PI * 0.83;
  svg
    .append("path")
    .attr("d", `M ${x1} ${y1} L ${x1 + head * Math.cos(l)} ${y1 + head * Math.sin(l)} L ${x1 + head * Math.cos(r)} ${y1 + head * Math.sin(r)} Z`)
    .style("fill", color);
}

/** Point on a dial: math angle `a`, length `L`, centred at (cx,cy) with y flipped. */
function pt(cx: number, cy: number, a: number, L: number) {
  return { x: cx + L * Math.cos(a), y: cy - L * Math.sin(a) };
}

/** A sweep-arc annotation between two math angles at radius r (screen coords). */
function sweepArc(svg: Sel, cx: number, cy: number, a0: number, a1: number, r: number, color: string) {
  const s = pt(cx, cy, a0, r);
  const e = pt(cx, cy, a1, r);
  const delta = a1 - a0;
  const large = Math.abs(delta) > Math.PI ? 1 : 0;
  // math-CCW (delta>0) is screen-CCW because y is flipped → SVG sweep-flag 0.
  const sweep = delta >= 0 ? 0 : 1;
  svg
    .append("path")
    .attr("d", `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} ${sweep} ${e.x} ${e.y}`)
    .style("fill", "none").style("stroke", color).style("stroke-width", 2.5);
}

function dialBase(svg: Sel, cx: number, cy: number, R: number) {
  svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", R)
    .style("fill", "none").style("stroke", "var(--hair)").style("stroke-width", 1.5);
  // faint cross-hairs
  svg.append("line").attr("x1", cx - R).attr("y1", cy).attr("x2", cx + R).attr("y2", cy)
    .style("stroke", "var(--hair)").style("stroke-width", 1);
  svg.append("line").attr("x1", cx).attr("y1", cy - R).attr("x2", cx).attr("y2", cy + R)
    .style("stroke", "var(--hair)").style("stroke-width", 1);
  svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 3).style("fill", "var(--fg)");
}

/* --- Node 1: one pair rotating by position ------------------------------- */

function drawDial(
  el: SVGSVGElement,
  o: { pos: number; omega: number; startLabel: string; nowLabel: string; angleWord: string },
) {
  const W = 460, H = 380, cx = 205, cy = 188, R = 140, L = R * 0.92;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`) as Sel;
  svg.selectAll("*").remove();
  dialBase(svg, cx, cy, R);

  const a0 = Math.atan2(BASE_VEC.y, BASE_VEC.x);
  const delta = angleAt(o.pos, o.omega);
  const a1 = a0 + delta;

  // ghost arrow at position 0
  const g = pt(cx, cy, a0, L);
  arrow(svg, cx, cy, g.x, g.y, "var(--muted)", { dash: true, width: 2.4 });
  const gl = pt(cx, cy, a0, L + 26);
  svg.append("text").attr("x", gl.x).attr("y", gl.y).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.startLabel);

  // live arrow at position m
  const v = pt(cx, cy, a1, L);
  arrow(svg, cx, cy, v.x, v.y, "var(--signal)", { width: 3.6 });
  const vl = pt(cx, cy, a1, L + 26);
  svg.append("text").attr("x", vl.x).attr("y", vl.y).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "20px").style("font-weight", "700").text(o.nowLabel);

  // swept angle
  if (o.pos > 0) {
    const ar = 52;
    sweepArc(svg, cx, cy, a0, a1, ar, "var(--signal-fg)");
    const am = a0 + delta / 2;
    const lab = pt(cx, cy, am, ar + 22);
    svg.append("text").attr("x", lab.x).attr("y", lab.y).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "20px")
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").style("stroke-linejoin", "round")
      .text(`${o.angleWord} ${degWrapped(delta)}°`);
  }
}

/* --- Node 2: query & key — the angle between is the gap ------------------- */

function drawGap(
  el: SVGSVGElement,
  o: { m: number; n: number; queryWord: string; keyWord: string; gapWord: string; matchWord: string },
) {
  const W = 460, H = 432, cx = 205, cy = 172, R = 128, L = R * 0.92;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`) as Sel;
  svg.selectAll("*").remove();
  dialBase(svg, cx, cy, R);

  const base = Math.atan2(BASE_VEC.y, BASE_VEC.x);
  const aq = base + angleAt(o.m, GAP_OMEGA);
  const ak = base + angleAt(o.n, GAP_OMEGA);

  // key (amber) first so query sits on top
  const k = pt(cx, cy, ak, L);
  arrow(svg, cx, cy, k.x, k.y, "var(--tok-sub)", { width: 3.4 });
  const kl = pt(cx, cy, ak, L + 24);
  svg.append("text").attr("x", kl.x).attr("y", kl.y).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .style("fill", "var(--tok-sub)").style("font-family", MONO).style("font-size", "20px").style("font-weight", "700")
    .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").style("stroke-linejoin", "round")
    .text(o.keyWord);

  const q = pt(cx, cy, aq, L);
  arrow(svg, cx, cy, q.x, q.y, "var(--signal)", { width: 3.6 });
  const ql = pt(cx, cy, aq, L + 24);
  svg.append("text").attr("x", ql.x).attr("y", ql.y).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "20px").style("font-weight", "700")
    .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").style("stroke-linejoin", "round")
    .text(o.queryWord);

  // the gap arc between key and query — drawn the short way (≤180°) so it
  // matches the geometric angle whose cosine is the match score.
  const gapRad = (degSigned(angleAt(o.m - o.n, GAP_OMEGA)) * Math.PI) / 180;
  if (Math.abs(o.m - o.n) > 0) {
    const ar = 50;
    sweepArc(svg, cx, cy, ak, ak + gapRad, ar, "var(--fg)");
    const am = ak + gapRad / 2;
    const lab = pt(cx, cy, am, ar + 20);
    svg.append("text").attr("x", lab.x).attr("y", lab.y).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "19px")
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").style("stroke-linejoin", "round")
      .text(`${o.gapWord} ${Math.abs(degSigned(angleAt(o.m - o.n, GAP_OMEGA)))}°`);
  }

  // match bar (visual only — exact number is in the readout)
  const match = cosSim(rotate(BASE_VEC, angleAt(o.m, GAP_OMEGA)), rotate(BASE_VEC, angleAt(o.n, GAP_OMEGA)));
  const bx0 = 150, bx1 = W - 40, by = 392, bh = 22;
  svg.append("text").attr("x", 40).attr("y", by + bh / 2).attr("dominant-baseline", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "19px").text(o.matchWord);
  svg.append("rect").attr("x", bx0).attr("y", by).attr("width", bx1 - bx0).attr("height", bh).attr("rx", 7)
    .style("fill", "var(--surface)").style("stroke", "var(--border)");
  const mid = (bx0 + bx1) / 2;
  const frac = (match + 1) / 2; // -1..1 → 0..1
  const fillX = bx0 + frac * (bx1 - bx0);
  svg.append("rect")
    .attr("x", Math.min(mid, fillX)).attr("y", by).attr("width", Math.abs(fillX - mid)).attr("height", bh).attr("rx", 4)
    .style("fill", match >= 0 ? "var(--signal)" : "var(--tok-byte)");
  svg.append("line").attr("x1", mid).attr("y1", by - 4).attr("x2", mid).attr("y2", by + bh + 4)
    .style("stroke", "var(--fg)").style("stroke-width", 1.5);
}

/* --- Node 3: add-a-vector vs rotate — length changes vs stays ------------- */

function drawAdd(
  el: SVGSVGElement,
  o: { pos: number; vWord: string; posWord: string; sumWord: string; changed: string },
) {
  const W = 320, H = 300, ox = 78, oy = 232, L = 128;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`) as Sel;
  svg.selectAll("*").remove();
  const a0 = Math.atan2(BASE_VEC.y, BASE_VEC.x);
  const v = pt(ox, oy, a0, L);
  // position vector points straight up, grows with position
  const pLen = (o.pos / MAX_POS) * 150;
  const p: Vec2 = { x: 0, y: pLen };
  const sum = { x: (v.x - ox) + p.x, y: (v.y - oy) - p.y };
  const sx = ox + sum.x, sy = oy + sum.y;

  // token (muted)
  arrow(svg, ox, oy, v.x, v.y, "var(--muted)", { width: 2.8 });
  svg.append("text").attr("x", v.x + 6).attr("y", v.y - 6)
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "16px").text(o.vWord);
  // added position vector (dashed, from tip of token)
  arrow(svg, v.x, v.y, sx, sy, "var(--tok-num)", { dash: true, width: 2.4 });
  svg.append("text").attr("x", (v.x + sx) / 2 + 6).attr("y", (v.y + sy) / 2)
    .style("fill", "var(--tok-num)").style("font-family", MONO).style("font-size", "15px").text(o.posWord);
  // result (red = length changed)
  arrow(svg, ox, oy, sx, sy, "var(--tok-byte)", { width: 3.4 });
  svg.append("text").attr("x", sx).attr("y", sy - 10).attr("text-anchor", "middle")
    .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700")
    .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").style("stroke-linejoin", "round")
    .text(o.sumWord);
  svg.append("text").attr("x", W / 2).attr("y", 28).attr("text-anchor", "middle")
    .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").text(o.changed);
}

function drawRot(
  el: SVGSVGElement,
  o: { pos: number; omega: number; vWord: string; sumWord: string; kept: string },
) {
  const W = 320, H = 300, ox = 160, oy = 168, L = 128;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`) as Sel;
  svg.selectAll("*").remove();
  const a0 = Math.atan2(BASE_VEC.y, BASE_VEC.x);
  const a1 = a0 + o.pos * o.omega;
  // faint length circle to show the arrow stays on it
  svg.append("circle").attr("cx", ox).attr("cy", oy).attr("r", L)
    .style("fill", "none").style("stroke", "var(--hair)").style("stroke-width", 1.5);
  svg.append("circle").attr("cx", ox).attr("cy", oy).attr("r", 3).style("fill", "var(--fg)");
  const g = pt(ox, oy, a0, L);
  arrow(svg, ox, oy, g.x, g.y, "var(--muted)", { dash: true, width: 2.4 });
  const v = pt(ox, oy, a1, L);
  arrow(svg, ox, oy, v.x, v.y, "var(--signal)", { width: 3.6 });
  const vl = pt(ox, oy, a1, L + 4);
  svg.append("text").attr("x", vl.x).attr("y", vl.y - 8).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700")
    .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").style("stroke-linejoin", "round")
    .text(o.sumWord);
  svg.append("text").attr("x", W / 2).attr("y", 28).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "16px").text(o.kept);
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

function useRope() {
  const { t } = useAcademy();
  return t.ropeMath;
}

function Node1({ reduce }: { reduce: boolean }) {
  const lesson = useRope();
  const n = lesson.nodes[0];
  const [pos, setPos] = useState(3);
  const [freqIdx, setFreqIdx] = useState(0);
  const [last, setLast] = useState<"slider" | "freq">("slider");
  const omega = FREQS[freqIdx].omega;
  const note = last === "slider" ? n.sliderNote : n.optionNotes?.[freqIdx];
  return (
    <SceneShell
      id="rope-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <Slider id="rope-pos" label={lesson.n1posLabel} value={pos} display={String(pos)} min={0} max={MAX_POS}
            onChange={(v) => { setPos(v); setLast("slider"); }} />
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{lesson.n1freqLabel}</div>
          <ControlRow>
            {lesson.n1freqs.map((lab, i) => (
              <Toggle key={i} on={freqIdx === i} onClick={() => { setFreqIdx(i); setLast("freq"); }}>{lab}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `m = ${pos}`, hi: true },
          { k: n.rows[1], v: `${degWrapped(angleAt(pos, omega))}°` },
          { k: n.rows[2], v: "1.00" },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawDial(el, { pos, omega, startLabel: lesson.n1startLabel, nowLabel: lesson.n1nowLabel, angleWord: lesson.n1angleWord })} deps={[pos, omega, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const lesson = useRope();
  const n = lesson.nodes[1];
  const [m, setM] = useState(6);
  const [nn, setNn] = useState(2);
  const [last, setLast] = useState(0);
  const shiftBoth = () => {
    setM((v) => Math.min(MAX_POS, v + 1));
    setNn((v) => Math.min(MAX_POS, v + 1));
    setLast(2);
  };
  const gapDeg = degSigned(angleAt(m - nn, GAP_OMEGA));
  const match = cosSim(rotate(BASE_VEC, angleAt(m, GAP_OMEGA)), rotate(BASE_VEC, angleAt(nn, GAP_OMEGA)));
  return (
    <SceneShell
      id="rope-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[last]}
      controls={
        <>
          <Slider id="rope-m" label={lesson.n2qLabel} value={m} display={String(m)} min={0} max={MAX_POS}
            onChange={(v) => { setM(v); setLast(0); }} />
          <Slider id="rope-n" label={lesson.n2kLabel} value={nn} display={String(nn)} min={0} max={MAX_POS}
            onChange={(v) => { setNn(v); setLast(1); }} />
          <ControlRow>
            <Toggle on={last === 2} onClick={shiftBoth}>{lesson.n2shift}</Toggle>
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${m - nn}`, hi: true },
          { k: n.rows[1], v: `${Math.abs(gapDeg)}°` },
          { k: n.rows[2], v: match.toFixed(2) },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawGap(el, { m, n: nn, queryWord: lesson.n2queryWord, keyWord: lesson.n2keyWord, gapWord: lesson.n2gapWord, matchWord: lesson.n2matchWord })} deps={[m, nn, reduce]} />}
    </SceneShell>
  );
}

/** Node 3 centrepiece: the two panels side by side, each its own d3 svg. */
function ComparePanels({ lesson, pos, reduce }: { lesson: ReturnType<typeof useRope>; pos: number; reduce: boolean }) {
  const n = lesson.nodes[2];
  const rotOmega = FREQS[1].omega;
  const panel = (title: string, tone: "bad" | "ok", child: React.ReactNode) => (
    <div style={{ border: `1px solid ${tone === "bad" ? "var(--tok-byte)" : "var(--signal)"}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".08em", color: "var(--muted)", padding: "9px 12px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>{title}</div>
      <div style={{ padding: "10px 12px" }}>{child}</div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: 12 }}>
      {panel(lesson.n3addTitle, "bad", (
        <DiagramSvg label={n.aria ?? ""} draw={(el) => drawAdd(el, { pos, vWord: lesson.n3vWord, posWord: lesson.n3posWord, sumWord: lesson.n3sumWord, changed: lesson.n3changed })} deps={[pos, reduce]} />
      ))}
      {panel(lesson.n3rotTitle, "ok", (
        <DiagramSvg label={n.aria ?? ""} draw={(el) => drawRot(el, { pos, omega: rotOmega, vWord: lesson.n3vWord, sumWord: lesson.n3sumWord, kept: lesson.n3kept })} deps={[pos, reduce]} />
      ))}
    </div>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const lesson = useRope();
  const n = lesson.nodes[2];
  const [pos, setPos] = useState(4);
  // add-panel length grows with position; rotate-panel length is fixed.
  const a0 = Math.atan2(BASE_VEC.y, BASE_VEC.x);
  const L = 1;
  const pLen = (pos / MAX_POS) * (150 / 128); // same ratio as the drawing
  const sum = { x: L * Math.cos(a0), y: L * Math.sin(a0) + pLen };
  const addLen = norm(sum);
  return (
    <SceneShell
      id="rope-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="rope-add-pos" label={lesson.n3posLabel} value={pos} display={String(pos)} min={0} max={MAX_POS}
          onChange={setPos} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: addLen.toFixed(2) },
          { k: n.rows[1], v: "1.00", hi: true },
        ]} />
      }
    >
      {() => <ComparePanels lesson={lesson} pos={pos} reduce={reduce} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function RopeMath() {
  const { t, lang } = useAcademy();
  const lesson = t.ropeMath;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{lesson.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {lesson.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{lesson.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{lesson.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 8 }}>
            {lesson.pipeline.map((label, i) => (
              <a key={i} href={`#rope-node-${i + 1}`} className="u-hover-fg-border"
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

      {/* ---- Go deeper ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(32px,4vw,56px) auto 0" }}>
        <Deeper title={lesson.deeperTitle}>{rich(lesson.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{lesson.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{lesson.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(lesson.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{lesson.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(lesson.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/bin-packing" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {lesson.prevLesson}</Link>
        <Link href="/stage/0/long-context" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{lesson.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
