"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider } from "./webscale-kit";
import {
  computeChain,
  loss,
  grad,
  stepOnce,
  lrRegime,
  W_RANGE,
  START,
  type DescentPoint,
} from "../lib/backpropagation";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS design tokens + theme flips resolve live.
 * Font sizes are in viewBox units and chosen so labels stay ≥12px even when a
 * card renders ~292px wide on a phone (720-wide box ⇒ 30u ≈ 12px; 560 ⇒ 24u).
 * ======================================================================== */

/** A small arrow: shaft + solid triangular head, all via d3.append. */
function arrow(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x1: number, y1: number, x2: number, y2: number,
  color: string, width: number, dashed = false,
) {
  const line = svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
    .style("stroke", color).style("stroke-width", width).style("stroke-linecap", "round");
  if (dashed) line.style("stroke-dasharray", "6 7");
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 10 + width * 1.6;
  const a1 = ang - 2.7;
  const a2 = ang + 2.7;
  svg.append("path")
    .attr("d", `M${x2},${y2} L${x2 + h * Math.cos(a1)},${y2 + h * Math.sin(a1)} L${x2 + h * Math.cos(a2)},${y2 + h * Math.sin(a2)} Z`)
    .style("fill", color);
}

/* --- Node 1: forward guess vs backward blame through a tiny chain --------- */

function drawChain(
  el: SVGSVGElement,
  o: { mode: "forward" | "backward"; reduce: boolean; words: { input: string; target: string; error: string; loss: string; blame: string; weight: string } },
) {
  const W = 720, H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const back = o.mode === "backward";
  const c = computeChain();

  const boxW = 118, boxH = 66, cy = 138;
  const xs = [10, 205, 400, 595];
  const tags = [o.words.input, "h₁", "h₂", "ŷ"];
  const vals = c.acts.map((v) => v.toFixed(2));
  const signalColor = "var(--signal)";
  const blameColor = "var(--tok-byte)";

  // edges first (so boxes sit on top)
  for (let i = 0; i < 3; i++) {
    const xR = xs[i] + boxW;      // right side of box i
    const xL = xs[i + 1];         // left side of box i+1
    const gapMid = (xR + xL) / 2;
    const nb = Math.abs(c.nodeBlame[i]); // 0.30 / 0.20 / 0.40-ish
    if (back) {
      // blame travels right → left, thickness ∝ magnitude
      const w = 2.5 + nb * 9;
      arrow(svg, xL, cy, xR, cy, signalColor, w);
      // the weight's gradient chip, under the edge
      const label = `∇${o.words.weight}${["₁", "₂", "₃"][i]} = ${c.weightBlame[i].toFixed(2)}`;
      const cw = label.length * 15 + 20;
      svg.append("rect").attr("x", gapMid - cw / 2).attr("y", cy + 20).attr("width", cw).attr("height", 34).attr("rx", 8)
        .style("fill", "var(--signal-wash)").style("stroke", signalColor).style("stroke-width", 1.4);
      svg.append("text").attr("x", gapMid).attr("y", cy + 43).attr("text-anchor", "middle")
        .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "24px").text(label);
    } else {
      // forward: signal travels left → right, weight label above
      arrow(svg, xR, cy, xL, cy, "var(--fg)", 2.4);
      svg.append("text").attr("x", gapMid).attr("y", cy - 16).attr("text-anchor", "middle")
        .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(`×${c.weights[i]}`);
    }
  }

  // boxes
  xs.forEach((x, i) => {
    const dim = back ? 0.55 : 1;
    svg.append("rect").attr("x", x).attr("y", cy - boxH / 2).attr("width", boxW).attr("height", boxH).attr("rx", 12)
      .style("fill", "var(--surface)").style("stroke", i === 3 && !back ? signalColor : "var(--border)").style("stroke-width", i === 3 && !back ? 2 : 1).style("opacity", dim);
    svg.append("text").attr("x", x + boxW / 2).attr("y", cy - boxH / 2 - 12).attr("text-anchor", "middle")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(tags[i]);
    svg.append("text").attr("x", x + boxW / 2).attr("y", cy + 11).attr("text-anchor", "middle")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "32px").style("font-weight", 700).style("opacity", dim).text(vals[i]);
  });

  // bottom badge
  const badgeY = 258, badgeH = 74, badgeW = 560, bx = (W - badgeW) / 2;
  const badgeColor = back ? signalColor : blameColor;
  svg.append("rect").attr("x", bx).attr("y", badgeY).attr("width", badgeW).attr("height", badgeH).attr("rx", 12)
    .style("fill", `color-mix(in srgb, ${badgeColor} 12%, transparent)`).style("stroke", badgeColor).style("stroke-width", 1.4);
  if (back) {
    // the error at the end is the source of all the blame flowing left
    arrow(svg, xs[3] + boxW / 2, cy + boxH / 2 + 4, xs[3] + boxW / 2, badgeY - 4, signalColor, 2.4);
    svg.append("text").attr("x", W / 2).attr("y", badgeY + 33).attr("text-anchor", "middle")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "26px")
      .text(`${o.words.error} ${c.error.toFixed(2)}`);
    svg.append("text").attr("x", W / 2).attr("y", badgeY + 60).attr("text-anchor", "middle")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "24px")
      .text(`→ ${o.words.blame} → ∇${o.words.weight}₁ ∇${o.words.weight}₂ ∇${o.words.weight}₃`);
  } else {
    svg.append("text").attr("x", W / 2).attr("y", badgeY + 30).attr("text-anchor", "middle")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "26px")
      .text(`ŷ ${c.acts[3].toFixed(2)}   ${o.words.target} ${(1).toFixed(2)}`);
    svg.append("text").attr("x", W / 2).attr("y", badgeY + 58).attr("text-anchor", "middle")
      .style("fill", badgeColor).style("font-family", MONO).style("font-size", "26px").style("font-weight", 700)
      .text(`${o.words.error} ${c.error.toFixed(2)}  ·  ${o.words.loss} ${c.loss.toFixed(2)}`);
  }
}

/* --- Shared loss-bowl contour map (Nodes 2 & 3) -------------------------- */

const BOWL_W = 560, BOWL_H = 540;
const PLOT = { l: 56, r: 20, t: 26, b: 66 };
const PW = BOWL_W - PLOT.l - PLOT.r;
const PH = BOWL_H - PLOT.t - PLOT.b;
const sx = (w1: number) => PLOT.l + ((w1 + W_RANGE) / (2 * W_RANGE)) * PW;
const sy = (w2: number) => PLOT.t + ((W_RANGE - w2) / (2 * W_RANGE)) * PH;
const pxPerW1 = PW / (2 * W_RANGE);
const pxPerW2 = PH / (2 * W_RANGE);
const clampX = (x: number) => Math.max(PLOT.l, Math.min(PLOT.l + PW, x));
const clampY = (y: number) => Math.max(PLOT.t, Math.min(PLOT.t + PH, y));

const THRESHOLDS = [0.12, 0.35, 0.8, 1.5, 2.6, 4.2, 6.4, 9.2];

/** Draw the filled contour bowl + axes into a fresh svg; return the selection. */
function drawBowl(el: SVGSVGElement, axLabels: { w1: string; w2: string; low: string; high: string }) {
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${BOWL_W} ${BOWL_H}`);
  svg.selectAll("*").remove();

  // sample loss on a grid
  const N = 64;
  const values: number[] = new Array(N * N);
  for (let j = 0; j < N; j++) {
    const w2 = W_RANGE - (j / (N - 1)) * 2 * W_RANGE; // row 0 = top = +R
    for (let i = 0; i < N; i++) {
      const w1 = -W_RANGE + (i / (N - 1)) * 2 * W_RANGE;
      values[j * N + i] = loss(w1, w2);
    }
  }
  const contours = d3.contours().size([N, N]).thresholds(THRESHOLDS)(values);
  const gx = (v: number) => PLOT.l + (v / (N - 1)) * PW;
  const gy = (v: number) => PLOT.t + (v / (N - 1)) * PH;
  const toPath = (geo: d3.ContourMultiPolygon) => {
    let d = "";
    geo.coordinates.forEach((poly) => poly.forEach((ring) => {
      ring.forEach(([x, y], k) => { d += (k ? "L" : "M") + gx(x).toFixed(1) + "," + gy(y).toFixed(1); });
      d += "Z";
    }));
    return d;
  };
  // Low loss (the centre) must read as the DARKEST green. A d3.contour at
  // threshold t encloses the region loss ≥ t — i.e. everything EXCEPT a small
  // central disk — so paint the whole bowl solid green, then wash each higher-
  // loss ring back toward the page background. Higher-loss regions are covered
  // by more rings, so they fade lightest; the centre stays full green.
  svg.append("rect").attr("x", PLOT.l).attr("y", PLOT.t).attr("width", PW).attr("height", PH)
    .style("fill", "var(--signal)").style("fill-opacity", 0.5);
  contours.forEach((geo) => {
    svg.append("path").attr("d", toPath(geo))
      .style("fill", "var(--bg)").style("fill-opacity", 0.155)
      .style("stroke", "var(--signal)").style("stroke-opacity", 0.22).style("stroke-width", 1);
  });
  // plot frame
  svg.append("rect").attr("x", PLOT.l).attr("y", PLOT.t).attr("width", PW).attr("height", PH)
    .style("fill", "none").style("stroke", "var(--border)").style("stroke-width", 1);

  // axes labels
  svg.append("text").attr("x", PLOT.l + PW / 2).attr("y", BOWL_H - 20).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "24px").text(`${axLabels.w1} →`);
  svg.append("text").attr("transform", `translate(20,${PLOT.t + PH / 2}) rotate(-90)`).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "24px").text(`${axLabels.w2} →`);
  // loss legend (low → high) bottom-right
  svg.append("text").attr("x", PLOT.l + PW).attr("y", PLOT.t - 8).attr("text-anchor", "end")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").text(`■ ${axLabels.low}`);
  svg.append("text").attr("x", PLOT.l).attr("y", PLOT.t - 8).attr("text-anchor", "start")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(`${axLabels.high} □`);
  return svg;
}

/** Minimum marker (a ringed dot at the origin). */
function drawMin(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, label: string) {
  const x = sx(0), y = sy(0);
  svg.append("circle").attr("cx", x).attr("cy", y).attr("r", 11).style("fill", "none").style("stroke", "var(--signal-fg)").style("stroke-width", 2.4);
  svg.append("circle").attr("cx", x).attr("cy", y).attr("r", 3).style("fill", "var(--signal-fg)");
  svg.append("text").attr("x", x + 16).attr("y", y + 8).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").text(label);
}

/* --- Node 2: the gradient arrow ----------------------------------------- */

function drawGradient(
  el: SVGSVGElement,
  o: { w1: number; w2: number; labels: { w1: string; w2: string; low: string; high: string; you: string; min: string; up: string; down: string } },
) {
  const svg = drawBowl(el, o.labels);
  drawMin(svg, o.labels.min);

  const px = sx(o.w1), py = sy(o.w2);
  const [g1, g2] = grad(o.w1, o.w2);
  const gpx = g1 * pxPerW1, gpy = -g2 * pxPerW2; // uphill direction in pixels
  const mag = Math.hypot(gpx, gpy);
  const gmagData = Math.hypot(g1, g2);
  const len = Math.min(150, 30 + gmagData * 34);

  if (mag > 1) {
    const ux = gpx / mag, uy = gpy / mag;
    const dxEnd = { x: clampX(px - ux * len), y: clampY(py - uy * len) };
    const uxEnd = { x: clampX(px + ux * len), y: clampY(py + uy * len) };
    // downhill (green) first, uphill (red) on top
    arrow(svg, px, py, dxEnd.x, dxEnd.y, "var(--signal)", 4);
    arrow(svg, px, py, uxEnd.x, uxEnd.y, "var(--tok-byte)", 4);
    // arrow labels, haloed so they read over the contours
    const halo = (sel: d3.Selection<SVGTextElement, unknown, null, undefined>) =>
      sel.style("font-family", MONO).style("font-size", "22px").style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px");
    halo(svg.append("text").attr("x", uxEnd.x).attr("y", uxEnd.y + (uy > 0 ? 26 : -12)).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").text(o.labels.up));
    halo(svg.append("text").attr("x", dxEnd.x).attr("y", dxEnd.y + (uy > 0 ? -12 : 26)).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").text(o.labels.down));
  }
  // the point
  svg.append("circle").attr("cx", px).attr("cy", py).attr("r", 9).style("fill", "var(--fg)").style("stroke", "var(--bg)").style("stroke-width", 2.5);
  svg.append("text").attr("x", px).attr("y", py - 18).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").text(o.labels.you);
}

/* --- Node 3: gradient descent, roll downhill ---------------------------- */

function drawDescent(
  el: SVGSVGElement,
  o: { path: DescentPoint[]; reduce: boolean; labels: { w1: string; w2: string; low: string; high: string; min: string; step: string } },
) {
  const svg = drawBowl(el, o.labels);
  drawMin(svg, o.labels.min);

  const pts = o.path.map((p) => [clampX(sx(p.w1)), clampY(sy(p.w2))] as [number, number]);
  // the trail
  if (pts.length > 1) {
    const line = d3.line()(pts);
    svg.append("path").attr("d", line ?? "").style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 2.4).style("stroke-opacity", 0.5).style("stroke-dasharray", "1 7").style("stroke-linecap", "round");
  }
  // past points
  pts.slice(0, -1).forEach(([x, y]) => {
    svg.append("circle").attr("cx", x).attr("cy", y).attr("r", 4.5).style("fill", "var(--fg)").style("fill-opacity", 0.4);
  });
  // current point
  const [cxp, cyp] = pts[pts.length - 1];
  const cur = svg.append("circle").attr("cx", cxp).attr("cy", cyp).attr("r", 11).style("fill", "var(--signal)").style("stroke", "var(--bg)").style("stroke-width", 2.5);
  if (!o.reduce && pts.length > 1) {
    const [pxp, pyp] = pts[pts.length - 2];
    cur.attr("cx", pxp).attr("cy", pyp).transition().duration(320).ease(d3.easeCubicOut).attr("cx", cxp).attr("cy", cyp);
  }
  const stepN = o.path.length - 1;
  svg.append("text").attr("x", cxp).attr("y", cyp - 18).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "4px").text(`${o.labels.step} ${stepN}`);
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

function useBP() {
  const { t } = useAcademy();
  return t.backpropagation;
}

/* ---- Node 1: blame flows backward -------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const bp = useBP();
  const n = bp.nodes[0];
  const [mode, setMode] = useState<"forward" | "backward">("forward");
  const c = computeChain();
  const words = { input: bp.n1inputWord, target: bp.n1targetWord, error: bp.n1errorWord, loss: bp.n1lossWord, blame: bp.n1blameWord, weight: bp.n1weightWord };
  return (
    <SceneShell
      id="bp-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[mode === "forward" ? 0 : 1]}
      controls={
        <ControlRow>
          {bp.n1modes.map((lab, i) => (
            <Toggle key={i} on={mode === (i === 0 ? "forward" : "backward")} onClick={() => setMode(i === 0 ? "forward" : "backward")}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={`${n.readoutTitle} · ${mode === "forward" ? bp.n1modes[0] : bp.n1modes[1]}`} rows={[
          { k: n.rows[0], v: c.error.toFixed(2), hi: mode === "backward" },
          { k: n.rows[1], v: c.loss.toFixed(2) },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawChain(el, { mode, reduce, words })} deps={[mode, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2: the gradient ---------------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const bp = useBP();
  const n = bp.nodes[1];
  const [w1, setW1] = useState(-3.1);
  const [w2, setW2] = useState(2.6);
  const [g1, g2] = grad(w1, w2);
  const gmag = Math.hypot(g1, g2);
  const labels = { w1: bp.n2w1Label, w2: bp.n2w2Label, low: bp.n2lowLabel, high: bp.n2highLabel, you: bp.n2youLabel, min: bp.n2minLabel, up: bp.n2uphillLabel, down: bp.n2downhillLabel };
  return (
    <SceneShell
      id="bp-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      controls={
        <>
          <Slider id="bp-w1" label={bp.n2w1Label} value={w1} display={w1.toFixed(1)} min={-W_RANGE} max={W_RANGE} step={0.1} onChange={setW1} />
          <Slider id="bp-w2" label={bp.n2w2Label} value={w2} display={w2.toFixed(1)} min={-W_RANGE} max={W_RANGE} step={0.1} onChange={setW2} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: loss(w1, w2).toFixed(2), hi: true },
          { k: n.rows[1], v: `${gmag.toFixed(2)} steep` },
          { k: n.rows[2], v: `[${(-g1).toFixed(1)}, ${(-g2).toFixed(1)}]` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawGradient(el, { w1, w2, labels })} deps={[w1, w2, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3: take a step ----------------------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const bp = useBP();
  const n = bp.nodes[2];
  const [lr, setLr] = useState(0.9);
  const [path, setPath] = useState<DescentPoint[]>(() => [{ w1: START[0], w2: START[1], loss: loss(START[0], START[1]) }]);
  const cur = path[path.length - 1];
  const regime = lrRegime(lr);
  const converged = cur.loss < 0.02 && path.length > 1;
  const note = converged ? bp.n3convergedNote : path.length === 1 ? bp.n3startNote : bp.n3rateNotes[regime === "slow" ? 0 : regime === "good" ? 1 : 2];

  const doStep = (count: number) => {
    setPath((prev) => {
      const out = prev.slice();
      let last = out[out.length - 1];
      for (let i = 0; i < count; i++) {
        const [nw1, nw2] = stepOnce(last.w1, last.w2, lr);
        const cw1 = Math.max(-1e4, Math.min(1e4, nw1));
        const cw2 = Math.max(-1e4, Math.min(1e4, nw2));
        last = { w1: cw1, w2: cw2, loss: loss(cw1, cw2) };
        out.push(last);
      }
      return out;
    });
  };
  const reset = () => setPath([{ w1: START[0], w2: START[1], loss: loss(START[0], START[1]) }]);

  const labels = { w1: bp.n2w1Label, w2: bp.n2w2Label, low: bp.n2lowLabel, high: bp.n2highLabel, min: bp.n2minLabel, step: bp.n3stepWord };
  const btnStyle = (fill: boolean): React.CSSProperties => ({
    appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13,
    padding: "12px 16px", borderRadius: 10, border: `1px solid ${fill ? "var(--signal)" : "var(--border)"}`,
    background: fill ? "var(--signal-wash)" : "var(--bg)", color: "var(--fg)", fontWeight: fill ? 700 : 400, flex: "1 1 auto",
  });

  return (
    <SceneShell
      id="bp-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <Slider id="bp-lr" label={bp.n3rateLabel} value={lr} display={lr.toFixed(2)} min={0.05} max={2.4} step={0.05} onChange={setLr} />
          <ControlRow>
            <button type="button" className="u-hover-fg-border" style={btnStyle(true)} onClick={() => doStep(1)}>{bp.n3stepBtn}</button>
            <button type="button" className="u-hover-fg-border" style={btnStyle(false)} onClick={() => doStep(10)}>{bp.n3runBtn}</button>
            <button type="button" className="u-hover-fg-border" style={btnStyle(false)} onClick={reset}>{bp.n3resetBtn}</button>
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: String(path.length - 1) },
          { k: n.rows[1], v: cur.loss.toFixed(3), hi: true },
          { k: n.rows[2], v: lr.toFixed(2) },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawDescent(el, { path, reduce, labels })} deps={[path, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Backpropagation() {
  const { t, lang } = useAcademy();
  const bp = t.backpropagation;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{bp.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {bp.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{bp.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{bp.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {bp.pipeline.map((label, i) => (
              <a key={i} href={`#bp-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{bp.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{bp.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(bp.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{bp.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(bp.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/sampling-strategies" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {bp.prevLesson}</Link>
        <Link href="/stage/0/optimizers" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{bp.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
