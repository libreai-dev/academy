"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  TRAIN_CTX,
  FAST_THETA,
  SLOW_THETA,
  angleAt,
  seenSpan,
  seenFull,
  inDistribution,
  scaledAngle,
  reachOf,
  deg,
  fmtCtx,
  scaleFrac,
  type Method,
} from "../lib/long-context";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS tokens + theme flips resolve live.
 * ======================================================================== */

const DIAL_W = 460;
const DIAL_H = 400;
const CX = DIAL_W / 2;
const CY = 208;
const R = 138;

/** Point on the dial at angle a (radians, 0 = top, clockwise), radius r. */
function pointAt(a: number, r: number): [number, number] {
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
}

/** Shared dial chrome: outer ring, the "seen in training" wedge (or full ring
 *  for fast pairs), the position-0 reference tick, and the centre dot. */
function drawDialBase(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  o: { theta: number; span: number; full: boolean; seenLabel: string; trainWord: string },
) {
  // faint outer dial
  svg.append("circle").attr("cx", CX).attr("cy", CY).attr("r", R)
    .style("fill", "none").style("stroke", "var(--hair)").style("stroke-width", 1.5);

  if (o.full) {
    // fast pair: every angle was seen — a full green ring
    svg.append("circle").attr("cx", CX).attr("cy", CY).attr("r", R)
      .style("fill", "var(--signal)").style("fill-opacity", 0.1)
      .style("stroke", "var(--signal)").style("stroke-width", 5).style("stroke-opacity", 0.55);
    svg.append("text").attr("x", CX).attr("y", CY - R - 14).attr("text-anchor", "middle")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "18px")
      .text(o.seenLabel + " · 360°");
  } else {
    // slow pair: only a thin wedge from 0 to span was seen
    const arc = d3.arc<unknown>().innerRadius(0).outerRadius(R).startAngle(0).endAngle(o.span);
    svg.append("path").attr("d", arc(null) as string).attr("transform", `translate(${CX},${CY})`)
      .style("fill", "var(--signal)").style("fill-opacity", 0.18)
      .style("stroke", "var(--signal)").style("stroke-width", 1.5).style("stroke-opacity", 0.7);
    // label the seen wedge, at its mid-angle just outside the rim
    const [lx, ly] = pointAt(o.span / 2, R + 30);
    svg.append("text").attr("x", lx).attr("y", ly).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "18px")
      .text(o.seenLabel);
    // tick + label at the wedge edge = the training limit (position 4k)
    const [ex, ey] = pointAt(o.span, R + 6);
    svg.append("line").attr("x1", CX + (R - 8) * Math.sin(o.span)).attr("y1", CY - (R - 8) * Math.cos(o.span))
      .attr("x2", ex).attr("y2", ey).style("stroke", "var(--signal-fg)").style("stroke-width", 2);
    const [tx, ty] = pointAt(o.span, R + 40);
    svg.append("text").attr("x", tx).attr("y", ty).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "16px").text(o.trainWord);
  }

  // position-0 reference tick at the top
  svg.append("line").attr("x1", CX).attr("y1", CY - R + 2).attr("x2", CX).attr("y2", CY - R + 16)
    .style("stroke", "var(--muted)").style("stroke-width", 2);
  svg.append("text").attr("x", CX).attr("y", CY - R + 30).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "14px").text("pos 0");

  // centre dot
  svg.append("circle").attr("cx", CX).attr("cy", CY).attr("r", 3.5).style("fill", "var(--fg)");
}

/** Draw an arrow from centre to angle `a`, coloured, optionally dashed, tagged. */
function drawArrow(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  a: number,
  color: string,
  o: { dashed?: boolean; width?: number; reduce: boolean; from?: number },
) {
  const [tx, ty] = pointAt(a, R * 0.9);
  const line = svg.append("line").attr("x1", CX).attr("y1", CY)
    .style("stroke", color).style("stroke-width", o.width ?? 3.5).style("stroke-linecap", "round");
  if (o.dashed) line.style("stroke-dasharray", "6 6");
  if (o.reduce || o.from == null) {
    line.attr("x2", tx).attr("y2", ty);
  } else {
    const [fx, fy] = pointAt(o.from, R * 0.9);
    const from = o.from;
    line.attr("x2", fx).attr("y2", fy).transition().duration(500).ease(d3.easeCubicOut)
      .tween("rot", function () {
        const iv = d3.interpolate(from, a);
        return (tt: number) => {
          const [px, py] = pointAt(iv(tt), R * 0.9);
          d3.select(this).attr("x2", px).attr("y2", py);
        };
      });
  }
  // tip
  svg.append("circle").attr("cx", tx).attr("cy", ty).attr("r", 5.5).style("fill", color);
}

/** Node 1: one pair on the dial — its arrow leaves the seen wedge past 4k. */
function drawProblem(
  el: SVGSVGElement,
  o: { theta: number; m: number; reduce: boolean; seenLabel: string; unseenLabel: string; okLabel: string; trainWord: string },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${DIAL_W} ${DIAL_H}`);
  svg.selectAll("*").remove();
  const full = seenFull(o.theta);
  const span = seenSpan(o.theta);
  const a = angleAt(o.m, o.theta);
  const inDist = inDistribution(o.m, o.theta);
  drawDialBase(svg, { theta: o.theta, span, full, seenLabel: o.seenLabel, trainWord: o.trainWord });

  const color = inDist ? "var(--signal)" : "var(--tok-byte)";
  drawArrow(svg, a, color, { reduce: o.reduce, width: 4 });

  // verdict chip under the dial
  const label = inDist ? o.okLabel : o.unseenLabel;
  svg.append("rect").attr("x", CX - 118).attr("y", DIAL_H - 40).attr("width", 236).attr("height", 30).attr("rx", 8)
    .style("fill", `color-mix(in srgb, ${color} 16%, transparent)`).style("stroke", color).style("stroke-width", 1.5);
  svg.append("text").attr("x", CX).attr("y", DIAL_H - 20).attr("text-anchor", "middle")
    .style("fill", color).style("font-family", MONO).style("font-size", "18px").style("font-weight", "700")
    .text(`${inDist ? "✓" : "✕"} ${label}`);
}

/** Node 2: same dial, a red raw arrow and a green rescaled arrow pulled in. */
function drawFix(
  el: SVGSVGElement,
  o: { theta: number; M: number; s: number; reduce: boolean; seenLabel: string; rawLabel: string; fixLabel: string; inLabel: string; outLabel: string; trainWord: string },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${DIAL_W} ${DIAL_H}`);
  svg.selectAll("*").remove();
  const span = seenSpan(o.theta);
  const raw = angleAt(o.M, o.theta);
  const fixed = scaledAngle(o.M, o.theta, o.s);
  const inside = fixed <= span;
  drawDialBase(svg, { theta: o.theta, span, full: false, seenLabel: o.seenLabel, trainWord: o.trainWord });

  // raw (unscaled) arrow — always red, dashed, faint
  drawArrow(svg, raw, "var(--tok-byte)", { dashed: true, width: 2.5, reduce: o.reduce });
  const [rlx, rly] = pointAt(raw, R + 22);
  svg.append("text").attr("x", rlx).attr("y", rly).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").text(o.rawLabel);
  // rescaled arrow — green once inside the wedge, amber while still outside
  const fixColor = inside ? "var(--signal)" : "var(--tok-num)";
  drawArrow(svg, fixed, fixColor, { reduce: o.reduce, width: 4.5 });
  if (Math.abs(fixed - raw) > 0.18) {
    const [flx, fly] = pointAt(fixed, R + 22);
    svg.append("text").attr("x", flx).attr("y", fly).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .style("fill", fixColor).style("font-family", MONO).style("font-size", "16px").style("font-weight", "700").text(o.fixLabel);
  }

  const verdict = inside ? o.inLabel : o.outLabel;
  const vColor = inside ? "var(--signal)" : "var(--tok-num)";
  svg.append("rect").attr("x", CX - 138).attr("y", DIAL_H - 40).attr("width", 276).attr("height", 30).attr("rx", 8)
    .style("fill", `color-mix(in srgb, ${vColor} 16%, transparent)`).style("stroke", vColor).style("stroke-width", 1.5);
  svg.append("text").attr("x", CX).attr("y", DIAL_H - 20).attr("text-anchor", "middle")
    .style("fill", vColor).style("font-family", MONO).style("font-size", "18px").style("font-weight", "700")
    .text(`${inside ? "✓" : "→"} ${verdict}`);
}

/** Node 3: one method's frequency-stretch strip (fast → slow pairs). */
const STRIP_W = 300;
const STRIP_H = 142;

function drawStrip(
  el: SVGSVGElement,
  o: { method: Method; active: boolean; reduce: boolean; fast: string; slow: string; full: string },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${STRIP_W} ${STRIP_H}`);
  svg.selectAll("*").remove();
  const padL = 16;
  const padR = 16;
  const baseY = 104;
  const topY = 26;
  const plotH = baseY - topY;
  const x0 = padL;
  const x1 = STRIP_W - padR;

  const fill = o.active ? "var(--signal)" : "var(--border)";
  const fillOpacity = o.active ? 0.85 : 0.35;
  const stroke = o.active ? "var(--signal)" : "var(--border)";

  // dashed "fully ÷ s" ceiling
  svg.append("line").attr("x1", x0).attr("y1", topY).attr("x2", x1).attr("y2", topY)
    .style("stroke", "var(--muted)").style("stroke-width", 1).style("stroke-dasharray", "4 4");
  svg.append("text").attr("x", x1).attr("y", topY - 6).attr("text-anchor", "end")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "14px").text(o.full);

  // baseline
  svg.append("line").attr("x1", x0).attr("y1", baseY).attr("x2", x1).attr("y2", baseY)
    .style("stroke", "var(--hair)").style("stroke-width", 1.5);

  // the stretch area, fast (left) → slow (right)
  const N = 48;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const frac = scaleFrac(o.method, u);
    pts.push([x0 + u * (x1 - x0), baseY - frac * plotH]);
  }
  let dPath = `M ${x0} ${baseY}`;
  pts.forEach((p) => (dPath += ` L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`));
  dPath += ` L ${x1} ${baseY} Z`;
  const area = svg.append("path").attr("d", dPath)
    .style("fill", fill).style("fill-opacity", fillOpacity).style("stroke", stroke).style("stroke-width", 1.5);
  if (o.active && !o.reduce) area.style("opacity", 0).transition().duration(340).style("opacity", 1);

  // axis labels
  svg.append("text").attr("x", x0).attr("y", baseY + 24).attr("text-anchor", "start")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").text(o.fast);
  svg.append("text").attr("x", x1).attr("y", baseY + 24).attr("text-anchor", "end")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").text(o.slow);
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

function useLC() {
  const { t } = useAcademy();
  return t.longContext;
}

function Node1({ reduce }: { reduce: boolean }) {
  const lc = useLC();
  const n = lc.nodes[0];
  const [pair, setPair] = useState(1); // 0 = fast, 1 = slow — start on the pair that breaks
  const [m, setM] = useState(16384);
  const [touch, setTouch] = useState<"pair" | "slider">("slider");
  const theta = pair === 0 ? FAST_THETA : SLOW_THETA;
  const a = angleAt(m, theta);
  const wrapped = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); // 0–360° for the readout
  const inDist = inDistribution(m, theta);
  const note = touch === "pair" ? n.optionNotes?.[pair] : n.sliderNote;
  return (
    <SceneShell
      id="lc-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <ControlRow>
            {lc.n1pairs.map((name, i) => (
              <Toggle key={i} on={pair === i} onClick={() => { setPair(i); setTouch("pair"); }}>{name}</Toggle>
            ))}
          </ControlRow>
          <Slider id="lc-pos" label={lc.n1posLabel} value={m} display={fmtCtx(m)} min={0} max={32768} step={256}
            onChange={(v) => { setM(v); setTouch("slider"); }} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: fmtCtx(m) },
          { k: n.rows[1], v: `${deg(wrapped)}°` },
          { k: n.rows[2], v: inDist ? lc.n1okLabel : lc.n1unseenLabel, hi: inDist },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawProblem(el, { theta, m, reduce, seenLabel: lc.n1seenLabel, unseenLabel: lc.n1unseenLabel, okLabel: lc.n1okLabel, trainWord: lc.n1trainWord })} deps={[pair, m, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const lc = useLC();
  const n = lc.nodes[1];
  const M = 24576; // the fixed far target we're trying to reach (24k)
  const [s, setS] = useState(1); // start unscaled → broken
  const reach = reachOf(s);
  const inside = scaledAngle(M, SLOW_THETA, s) <= seenSpan(SLOW_THETA);
  return (
    <SceneShell
      id="lc-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="lc-scale" label={lc.n2scaleLabel} value={s} display={`×${s}`} min={1} max={8} step={1}
          onChange={(v) => setS(v)} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `×${s}` },
          { k: n.rows[1], v: `${fmtCtx(reach)} / ${fmtCtx(M)}` },
          { k: n.rows[2], v: inside ? lc.n2inLabel : lc.n2outLabel, hi: inside },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawFix(el, { theta: SLOW_THETA, M, s, reduce, seenLabel: lc.n1seenLabel, rawLabel: lc.n2rawLabel, fixLabel: lc.n2fixLabel, inLabel: lc.n2inLabel, outLabel: lc.n2outLabel, trainWord: lc.n1trainWord })} deps={[s, reduce]} />}
    </SceneShell>
  );
}

/** One method's comparison panel (name + strip + verdict), highlighted when active. */
function MethodPanel({ lc, method, idx, active, reduce }: { lc: ReturnType<typeof useLC>; method: Method; idx: number; active: boolean; reduce: boolean }) {
  return (
    <div style={{ border: `1px solid ${active ? "var(--signal)" : "var(--border)"}`, background: active ? "var(--signal-wash)" : "var(--bg)", borderRadius: 12, padding: "13px 14px", transition: "border-color .15s ease, background .15s ease", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: ".04em", color: active ? "var(--signal-fg)" : "var(--fg)", fontWeight: 700 }}>{lc.n3methods[idx]}</div>
      <DiagramSvg label={lc.n3methods[idx]} draw={(el) => drawStrip(el, { method, active, reduce, fast: lc.n3fast, slow: lc.n3slow, full: lc.n3full })} deps={[active, reduce]} />
      <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: active ? "var(--fg)" : "var(--muted)", textWrap: "pretty" }}>{lc.n3verdicts[idx]}</div>
    </div>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const lc = useLC();
  const n = lc.nodes[2];
  const methods: Method[] = ["linear", "ntk", "yarn"];
  const [sel, setSel] = useState<Method>("yarn");
  const [s, setS] = useState(16); // target context = s * 4k
  const selIdx = methods.indexOf(sel);
  const target = reachOf(s);
  return (
    <SceneShell
      id="lc-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[selIdx]}
      controls={
        <>
          <ControlRow>
            {lc.n3methods.map((name, i) => (
              <Toggle key={i} on={sel === methods[i]} onClick={() => setSel(methods[i])}>{name}</Toggle>
            ))}
          </ControlRow>
          <Slider id="lc-ctx" label={lc.n3ctxLabel} value={s} display={fmtCtx(target)} min={2} max={32} step={1}
            onChange={(v) => setS(v)} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: fmtCtx(TRAIN_CTX) },
          { k: n.rows[1], v: fmtCtx(target), hi: true },
          { k: n.rows[2], v: `×${s}` },
        ]} />
      }
    >
      {() => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 12 }}>
          {methods.map((m, i) => (
            <MethodPanel key={m} lc={lc} method={m} idx={i} active={sel === m} reduce={reduce} />
          ))}
        </div>
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function LongContext() {
  const { t, lang } = useAcademy();
  const lc = t.longContext;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{lc.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {lc.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{lc.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{lc.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 8 }}>
            {lc.pipeline.map((label, i) => (
              <a key={i} href={`#lc-node-${i + 1}`} className="u-hover-fg-border"
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
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0" }}>
        <Deeper title={lc.deeperTitle}>{rich(lc.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{lc.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{lc.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(lc.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{lc.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(lc.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/rope-math" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {lc.prevLesson}</Link>
        <Link href="/stage/0/flash-attention" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{lc.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
