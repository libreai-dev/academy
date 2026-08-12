"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import {
  loss,
  descentPath,
  finalDist,
  settled,
  START,
  WEIGHTS,
  rawStep,
  adamStep,
  scheduleCurve,
  SCHED,
  type Optimizer,
  type Schedule,
  type Pt,
} from "../lib/optimizers";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS design tokens + theme flips resolve live.
 * All three use a 480-unit-wide viewBox; font sizes are ≥20u so labels stay
 * ≥12px even when a card renders ~290px wide on a phone (20·290/480 ≈ 12).
 * ======================================================================== */

/* --- Node 1: SGD vs Adam descending one loss surface -------------------- */

interface SurfaceLabels {
  axisX: string;
  axisY: string;
  low: string;
  high: string;
  min: string;
  start: string;
  sgd: string;
  adam: string;
}

function drawSurface(el: SVGSVGElement, o: { opt: Optimizer; reduce: boolean; L: SurfaceLabels }) {
  const W = 480;
  const H = 330;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const P = { l: 52, r: 16, t: 38, b: 46 };
  const PW = W - P.l - P.r;
  const PH = H - P.t - P.b;
  const sx = (x: number) => P.l + ((x + 1) / 2) * PW;
  const sy = (y: number) => P.t + ((1 - y) / 2) * PH;
  const clampX = (x: number) => Math.max(P.l, Math.min(P.l + PW, x));
  const clampY = (y: number) => Math.max(P.t, Math.min(P.t + PH, y));

  // sample the loss on a grid, then draw filled contour rings
  const N = 72;
  const vals: number[] = new Array(N * N);
  for (let j = 0; j < N; j++) {
    const yy = 1 - (j / (N - 1)) * 2;
    for (let i = 0; i < N; i++) {
      const xx = -1 + (i / (N - 1)) * 2;
      vals[j * N + i] = loss(xx, yy);
    }
  }
  const contours = d3.contours().size([N, N]).thresholds([0.05, 0.15, 0.35, 0.65, 1.0])(vals);
  const gx = (v: number) => P.l + (v / (N - 1)) * PW;
  const gy = (v: number) => P.t + (v / (N - 1)) * PH;
  const toPath = (geo: d3.ContourMultiPolygon) => {
    let d = "";
    geo.coordinates.forEach((poly) =>
      poly.forEach((ring) => {
        ring.forEach(([x, y], k) => {
          d += (k ? "L" : "M") + gx(x).toFixed(1) + "," + gy(y).toFixed(1);
        });
        d += "Z";
      }),
    );
    return d;
  };
  // solid green bowl, then wash each higher-loss ring back toward the page bg
  svg.append("rect").attr("x", P.l).attr("y", P.t).attr("width", PW).attr("height", PH).style("fill", "var(--signal)").style("fill-opacity", 0.5);
  contours.forEach((geo) =>
    svg.append("path").attr("d", toPath(geo)).style("fill", "var(--bg)").style("fill-opacity", 0.16).style("stroke", "var(--signal)").style("stroke-opacity", 0.22).style("stroke-width", 1),
  );
  svg.append("rect").attr("x", P.l).attr("y", P.t).attr("width", PW).attr("height", PH).style("fill", "none").style("stroke", "var(--border)");

  // axes + legend
  svg.append("text").attr("x", P.l + PW / 2).attr("y", H - 14).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.L.axisX);
  svg.append("text").attr("transform", `translate(20,${P.t + PH / 2}) rotate(-90)`).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.L.axisY);
  svg.append("text").attr("x", P.l + PW).attr("y", P.t - 10).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "20px").text(`■ ${o.L.low}`);
  svg.append("text").attr("x", P.l).attr("y", P.t - 10).attr("text-anchor", "start").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(`${o.L.high} □`);

  // minimum marker
  const mnx = sx(0);
  const mny = sy(0);
  svg.append("circle").attr("cx", mnx).attr("cy", mny).attr("r", 9).style("fill", "none").style("stroke", "var(--signal-fg)").style("stroke-width", 2.2);
  svg.append("circle").attr("cx", mnx).attr("cy", mny).attr("r", 2.6).style("fill", "var(--signal-fg)");
  svg.append("text").attr("x", mnx - 13).attr("y", mny + 7).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "20px").style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").text(o.L.min);

  const drawPath = (pts: Pt[], color: string, selected: boolean, name: string) => {
    const P2 = pts.map((p) => [clampX(sx(p.x)), clampY(sy(p.y))] as [number, number]);
    const line = d3.line()(P2);
    const path = svg
      .append("path")
      .attr("d", line ?? "")
      .style("fill", "none")
      .style("stroke", color)
      .style("stroke-linecap", "round")
      .style("stroke-linejoin", "round")
      .style("stroke-width", selected ? 3.6 : 2)
      .style("stroke-opacity", selected ? 1 : 0.32);
    if (selected) {
      const node = path.node();
      if (!o.reduce && node) {
        const len = node.getTotalLength();
        path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len).transition().duration(760).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
      }
      P2.forEach(([x, y], i) => {
        const last = i === P2.length - 1;
        const c = svg.append("circle").attr("cx", x).attr("cy", y).attr("r", last ? 6.5 : 3.2).style("fill", color).style("stroke", "var(--bg)").style("stroke-width", 1.5);
        if (!o.reduce) c.style("opacity", 0).transition().delay(Math.min(i * 46, 760)).duration(200).style("opacity", 1);
      });
      // endpoint name label
      const [ex, ey] = P2[P2.length - 1];
      svg.append("text").attr("x", ex + 11).attr("y", ey + 6).style("fill", color).style("font-family", MONO).style("font-size", "20px").style("font-weight", 700).style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").text(name);
    }
  };

  const sgd = descentPath("sgd");
  const adam = descentPath("adam");
  // draw the un-selected path first (underneath), the selected one on top
  if (o.opt === "sgd") {
    drawPath(adam, "var(--signal)", false, o.L.adam);
    drawPath(sgd, "var(--tok-byte)", true, o.L.sgd);
  } else {
    drawPath(sgd, "var(--tok-byte)", false, o.L.sgd);
    drawPath(adam, "var(--signal)", true, o.L.adam);
  }

  // shared start marker
  const stx = clampX(sx(START.x));
  const sty = clampY(sy(START.y));
  svg.append("circle").attr("cx", stx).attr("cy", sty).attr("r", 5.5).style("fill", "var(--fg)").style("stroke", "var(--bg)").style("stroke-width", 2);
  svg.append("text").attr("x", stx + 11).attr("y", sty - 9).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").text(o.L.start);
}

/* --- Node 2: per-weight step sizes -------------------------------------- */

interface WeightLabels {
  steady: string;
  noisy: string;
  grad: string;
  step: string;
}

function drawWeights(el: SVGSVGElement, o: { mode: "raw" | "adam"; reduce: boolean; L: WeightLabels }) {
  const W = 480;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const rows: { name: string; grads: number[]; color: string }[] = [
    { name: o.L.steady, grads: WEIGHTS.steady, color: "var(--tok-num)" },
    { name: o.L.noisy, grads: WEIGHTS.noisy, color: "var(--tok-byte)" },
  ];
  const stepScale = 340; // px per unit of step; noisy raw ~0.64 → ~218px (+ label stays in-frame)
  const gradScale = 42; // px per unit of gradient; max ~1.9 → ~80px

  rows.forEach((r, i) => {
    const y0 = 18 + i * 142;
    const step = o.mode === "raw" ? rawStep(r.grads) : adamStep(r.grads);

    // weight name
    svg.append("text").attr("x", 16).attr("y", y0 + 18).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").style("font-weight", 700).text(r.name);

    // recent-gradient bars (how jumpy this weight is)
    const baseG = y0 + 104;
    const bw = 15;
    const gap = 9;
    r.grads.forEach((g, k) => {
      const h = Math.max(2, g * gradScale);
      const gx = 16 + k * (bw + gap);
      const bar = svg.append("rect").attr("x", gx).attr("y", baseG - h).attr("width", bw).attr("height", h).attr("rx", 2).style("fill", r.color).style("fill-opacity", 0.5);
      if (!o.reduce) bar.attr("height", 0).attr("y", baseG).transition().duration(420).delay(k * 40).attr("y", baseG - h).attr("height", h);
    });
    svg.append("line").attr("x1", 14).attr("y1", baseG).attr("x2", 16 + 5 * (bw + gap)).attr("y2", baseG).style("stroke", "var(--border)").style("stroke-width", 1);
    svg.append("text").attr("x", 16).attr("y", y0 + 124).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.L.grad);

    // arrow → resulting step
    svg.append("text").attr("x", 176).attr("y", y0 + 66).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text("→");

    // the step bar (its length is the step this weight takes)
    const bx = 200;
    const by = y0 + 48;
    const bh = 26;
    svg.append("text").attr("x", bx).attr("y", y0 + 26).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.L.step);
    const w = Math.max(4, step * stepScale);
    const bar = svg.append("rect").attr("x", bx).attr("y", by).attr("height", bh).attr("rx", 6).style("fill", r.color);
    if (o.reduce) bar.attr("width", w);
    else bar.attr("width", 0).transition().duration(480).ease(d3.easeCubicOut).attr("width", w);
    svg.append("text").attr("x", bx + w + 9).attr("y", by + bh - 6).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").style("font-weight", 700).text(step.toFixed(2));
  });
}

/* --- Node 3: the learning-rate schedule --------------------------------- */

interface SchedLabels {
  axisX: string;
  axisY: string;
  peak: string;
  warmup: string;
}

function drawSchedule(el: SVGSVGElement, o: { warmup: number; mode: Schedule; reduce: boolean; L: SchedLabels }) {
  const W = 480;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const P = { l: 54, r: 22, t: 40, b: 50 };
  const PW = W - P.l - P.r;
  const PH = H - P.t - P.b;
  const px = (t: number) => P.l + t * PW;
  const py = (f: number) => P.t + (1 - f) * PH;

  // warmup zone shading
  svg.append("rect").attr("x", px(0)).attr("y", P.t).attr("width", Math.max(0, px(o.warmup) - px(0))).attr("height", PH).style("fill", "var(--signal)").style("fill-opacity", 0.12);
  svg.append("text").attr("x", px(0) + 5).attr("y", P.t + 20).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "20px").text(o.L.warmup);

  // axes frame
  svg.append("line").attr("x1", P.l).attr("y1", P.t).attr("x2", P.l).attr("y2", P.t + PH).style("stroke", "var(--border)").style("stroke-width", 1);
  svg.append("line").attr("x1", P.l).attr("y1", P.t + PH).attr("x2", P.l + PW).attr("y2", P.t + PH).style("stroke", "var(--border)").style("stroke-width", 1);

  // peak reference line
  svg.append("line").attr("x1", P.l).attr("y1", py(1)).attr("x2", P.l + PW).attr("y2", py(1)).style("stroke", "var(--muted)").style("stroke-width", 1).style("stroke-dasharray", "4 5").style("stroke-opacity", 0.7);
  svg.append("text").attr("x", P.l + PW).attr("y", py(1) - 8).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.L.peak);

  // the curve
  const curve = scheduleCurve(o.warmup, o.mode);
  const line = d3.line<Pt>().x((p) => px(p.x)).y((p) => py(p.y))(curve);
  const path = svg.append("path").attr("d", line ?? "").style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 3.4).style("stroke-linejoin", "round").style("stroke-linecap", "round");
  const node = path.node();
  if (!o.reduce && node) {
    const len = node.getTotalLength();
    path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len).transition().duration(720).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
  }

  // axis labels
  svg.append("text").attr("x", P.l + PW / 2).attr("y", H - 14).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.L.axisX);
  svg.append("text").attr("transform", `translate(19,${P.t + PH / 2}) rotate(-90)`).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.L.axisY);
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

function useOpt() {
  const { t } = useAcademy();
  return t.optimizers;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const op = useOpt();
  const n = op.nodes[0];
  const opts: Optimizer[] = ["sgd", "adam"];
  const [opt, setOpt] = useState<Optimizer>("sgd");
  const idx = opts.indexOf(opt);
  const dist = finalDist(opt);
  const isSettled = settled(opt);
  const L: SurfaceLabels = { axisX: op.n1axisX, axisY: op.n1axisY, low: op.n1low, high: op.n1high, min: op.n1minLabel, start: op.n1startLabel, sgd: op.n1sgdName, adam: op.n1adamName };
  return (
    <SceneShell
      id="opt-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Callout label={op.calloutLabel} title={op.calloutTitle}>{rich(op.calloutBody)}</Callout>}
      controls={
        <ControlRow>
          {op.n1opts.map((lab, i) => (
            <Toggle key={i} on={opt === opts[i]} onClick={() => setOpt(opts[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: opt === "sgd" ? op.n1sgdName : op.n1adamName, hi: opt === "adam" },
          { k: n.rows[1], v: dist.toFixed(2) },
          { k: n.rows[2], v: isSettled ? op.n1settled : op.n1descending, hi: isSettled },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawSurface(el, { opt, reduce, L })} deps={[opt, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const op = useOpt();
  const n = op.nodes[1];
  const modes: ("raw" | "adam")[] = ["raw", "adam"];
  const [mode, setMode] = useState<"raw" | "adam">("raw");
  const idx = modes.indexOf(mode);
  const L: WeightLabels = { steady: op.n2steadyLabel, noisy: op.n2noisyLabel, grad: op.n2gradLabel, step: op.n2stepLabel };
  return (
    <SceneShell
      id="opt-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Deeper title={op.deeperTitle}>{rich(op.deeperBody)}</Deeper>}
      controls={
        <ControlRow>
          {op.n2opts.map((lab, i) => (
            <Toggle key={i} on={mode === modes[i]} onClick={() => setMode(modes[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawWeights(el, { mode, reduce, L })} deps={[mode, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const op = useOpt();
  const n = op.nodes[2];
  const shapes: Schedule[] = ["cosine", "wsd"];
  const [mode, setMode] = useState<Schedule>("cosine");
  const [warmupPct, setWarmupPct] = useState(6);
  const [touchedWarmup, setTouchedWarmup] = useState(false);
  const warmup = warmupPct / 100;
  const idx = shapes.indexOf(mode);
  const warmupSteps = Math.round(warmup * SCHED.totalSteps);
  const floorLr = SCHED.peak * SCHED.floor;
  const note = touchedWarmup ? n.sliderNote : n.optionNotes?.[idx];
  const L: SchedLabels = { axisX: op.n3axisX, axisY: op.n3axisY, peak: op.n3peakLabel, warmup: op.n3warmupZone };
  return (
    <SceneShell
      id="opt-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <Slider id="opt-warmup" label={op.n3warmupSlider} value={warmupPct} display={`${warmupPct}%`} min={2} max={20} onChange={(v) => { setWarmupPct(v); setTouchedWarmup(true); }} />
          <ControlRow>
            {op.n3shapes.map((lab, i) => (
              <Toggle key={i} on={mode === shapes[i]} onClick={() => { setMode(shapes[i]); setTouchedWarmup(false); }}>{lab}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${(warmupSteps / 1000).toFixed(0)}k / 100k` },
          { k: n.rows[1], v: SCHED.peak.toExponential(0).replace("e+", "e"), hi: true },
          { k: n.rows[2], v: floorLr.toExponential(0).replace("e+", "e") },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawSchedule(el, { warmup, mode, reduce, L })} deps={[warmup, mode, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Optimizers() {
  const { t, lang } = useAcademy();
  const op = t.optimizers;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{op.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {op.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{op.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{op.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 8 }}>
            {op.pipeline.map((label, i) => (
              <a key={i} href={`#opt-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{op.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{op.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(op.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{op.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(op.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/backpropagation" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {op.prevLesson}</Link>
        <Link href="/stage/0/supervised-fine-tuning" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{op.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
