"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  TEACHER_B,
  FIT_PRESETS,
  VRAM_BUDGET_GB,
  fitStudent,
  LOGIT_VOCAB,
  softTargets,
  type Word,
  type CloneMode,
  RAW_COMPLETION,
  COT_COMPLETION,
  cloneYield,
  trajectoryAudit,
  type Hardware,
  HARDWARE,
  DEPLOY_BUDGET_USD,
  deploy,
  REASONING_FLOOR_B,
  reasoningLimit,
  reasoningCurve,
} from "../lib/distill";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

/* --- Node 1: teacher footprint (context) + student gauge vs budget -------- */
function drawFit(
  el: SVGSVGElement,
  o: { teacherLabel: string; studentLabel: string; budgetLabel: string; overLabel: string; vramGB: number; retention: number; fits: boolean; reduce: boolean },
) {
  const W = 760, H = 236;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const barX = 26, barW = W - 52, barH = 46;

  // --- Context bar: the teacher's ~140 GB, purely to show the gap ---
  const teacherGB = TEACHER_B * 2; // 16-bit
  svg.append("text").attr("x", barX).attr("y", 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.teacherLabel);
  svg.append("rect").attr("x", barX).attr("y", 34).attr("width", barW).attr("height", barH).attr("rx", 6)
    .style("fill", "var(--tok-space)").style("fill-opacity", 0.32).style("stroke", "var(--border)");
  svg.append("text").attr("x", barX + barW - 12).attr("y", 34 + barH / 2 + 5).attr("text-anchor", "end")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px").style("font-weight", "700").text(`${teacherGB} GB`);

  // --- The gauge: student footprint on a 0..16 GB scale, budget at 8 ---
  const gy = 150, maxGB = 16;
  const x = d3.scaleLinear().domain([0, maxGB]).range([barX, barX + barW]);
  svg.append("text").attr("x", barX).attr("y", gy - 14).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(o.studentLabel);
  // track
  svg.append("rect").attr("x", barX).attr("y", gy).attr("width", barW).attr("height", barH).attr("rx", 6).style("fill", "var(--surface)").style("stroke", "var(--hair)");
  // student fill
  const col = o.fits ? "var(--signal)" : "var(--tok-byte)";
  const fillW = Math.max(2, x(Math.min(o.vramGB, maxGB)) - barX);
  const bar = svg.append("rect").attr("y", gy).attr("height", barH).attr("rx", 6).attr("x", barX).style("fill", col).style("fill-opacity", 0.9);
  if (o.reduce) bar.attr("width", fillW);
  else bar.attr("width", 0).transition().duration(420).ease(d3.easeCubicOut).attr("width", fillW);
  // value label inside the fill
  svg.append("text").attr("x", barX + 12).attr("y", gy + barH / 2 + 5).style("fill", o.fits ? "#0a0a09" : "var(--bg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", "700").text(`${o.vramGB.toFixed(1)} GB · ${o.retention.toFixed(0)}% kept`);
  // budget line at 8 GB
  svg.append("line").attr("x1", x(VRAM_BUDGET_GB)).attr("y1", gy - 8).attr("x2", x(VRAM_BUDGET_GB)).attr("y2", gy + barH + 8).style("stroke", "var(--signal-fg)").style("stroke-width", 1.5).style("stroke-dasharray", "5 4");
  svg.append("text").attr("x", x(VRAM_BUDGET_GB)).attr("y", gy + barH + 24).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "11.5px").text(o.budgetLabel);
  if (!o.fits) {
    svg.append("text").attr("x", barX + barW).attr("y", gy - 14).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "700").text(`⚠ ${o.overLabel}`);
  }
}

/* --- Node 2: teacher probability over candidate words, by temperature ----- */
function drawSoft(el: SVGSVGElement, o: { t: number; top1: Word; reduce: boolean }) {
  const W = 760, H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const probs = softTargets(o.t).probs;
  const pad = { l: 20, r: 20, t: 26, b: 46 };
  const y = d3.scaleLinear().domain([0, 1]).range([H - pad.b, pad.t]).clamp(true);
  const groupW = (W - pad.l - pad.r) / LOGIT_VOCAB.length;
  const bw = Math.min(72, groupW - 18);
  // baseline
  svg.append("line").attr("x1", pad.l).attr("y1", y(0)).attr("x2", W - pad.r).attr("y2", y(0)).style("stroke", "var(--hair)");
  LOGIT_VOCAB.forEach((w, i) => {
    const gx = pad.l + i * groupW + groupW / 2;
    const p = probs[w];
    const isTop = w === o.top1;
    const h = y(0) - y(p);
    const fill = isTop ? "var(--fg)" : "var(--signal)";
    const bar = svg.append("rect").attr("x", gx - bw / 2).attr("width", bw).attr("rx", 4).style("fill", fill).style("fill-opacity", isTop ? 0.85 : 0.9);
    if (o.reduce) bar.attr("y", y(p)).attr("height", h);
    else bar.attr("y", y(0)).attr("height", 0).transition().duration(400).ease(d3.easeCubicOut).attr("y", y(p)).attr("height", h);
    svg.append("text").attr("x", gx).attr("y", y(p) - 8).attr("text-anchor", "middle").style("fill", isTop ? "var(--fg)" : "var(--signal-fg)").style("font-family", MONO).style("font-size", "12.5px").style("font-weight", "700").text(`${Math.round(p * 100)}%`);
    svg.append("text").attr("x", gx).attr("y", H - pad.b + 22).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").text(w);
  });
}

/* --- Node 4: off-policy drift vs on-policy correction -------------------- */
function drawPolicy(el: SVGSVGElement, o: { onPolicy: boolean; len: number; offPath: string; onPath: string; correct: string; diverge: string; errPct: number; reduce: boolean }) {
  const W = 760, H = 260;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const pad = { l: 90, r: 24, t: 20, b: 40 };
  const x0 = pad.l, x1 = W - pad.r, refY = H - pad.b - 44;
  // error zone (top band)
  svg.append("rect").attr("x", x0).attr("y", pad.t).attr("width", x1 - x0).attr("height", 58).style("fill", "var(--tok-byte)").style("fill-opacity", 0.07);
  svg.append("text").attr("x", x1 - 8).attr("y", pad.t + 18).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").style("opacity", 0.8).text("OFF-DISTRIBUTION");
  // reference (teacher) trajectory
  svg.append("line").attr("x1", x0).attr("y1", refY).attr("x2", x1).attr("y2", refY).style("stroke", "var(--muted)").style("stroke-width", 1.6).style("stroke-dasharray", "6 5");
  svg.append("text").attr("x", x0 - 10).attr("y", refY + 4).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text("teacher");
  // start dot
  svg.append("circle").attr("cx", x0).attr("cy", refY).attr("r", 5).style("fill", "var(--fg)");

  const N = 26;
  const line = d3.line<[number, number]>().x((d) => d[0]).y((d) => d[1]).curve(d3.curveMonotoneX);
  // how far the length pushes the divergence (longer rollout = more drift)
  const drift = Math.min(1, o.len / 128);

  if (!o.onPolicy) {
    // student path curves up into the error zone, accelerating
    const pts: [number, number][] = d3.range(N + 1).map((i) => {
      const f = i / N;
      const px = x0 + f * (x1 - x0);
      const rise = Math.pow(f, 1.8) * (refY - pad.t - 22) * drift;
      return [px, refY - rise];
    });
    const path = svg.append("path").datum(pts).attr("fill", "none").style("stroke", "var(--tok-byte)").style("stroke-width", 3).attr("d", line);
    if (!o.reduce) {
      const len = (path.node() as SVGPathElement).getTotalLength();
      path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(600).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
    }
    const end = pts[pts.length - 1];
    svg.append("circle").attr("cx", end[0]).attr("cy", end[1]).attr("r", 5).style("fill", "var(--tok-byte)");
    svg.append("text").attr("x", end[0] - 6).attr("y", end[1] - 10).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12.5px").style("font-weight", "700").text(`↑ ${o.diverge}`);
    svg.append("text").attr("x", x0).attr("y", H - 12).style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12.5px").text(`${o.offPath} · error ${o.errPct.toFixed(1)}%`);
  } else {
    // student wobbles but the teacher pulls it back — hugs the reference
    const pts: [number, number][] = d3.range(N + 1).map((i) => {
      const f = i / N;
      const px = x0 + f * (x1 - x0);
      const wob = Math.sin(f * Math.PI * 3) * 15 * (1 - f * 0.4);
      return [px, refY - wob];
    });
    const path = svg.append("path").datum(pts).attr("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 3).attr("d", line);
    if (!o.reduce) {
      const len = (path.node() as SVGPathElement).getTotalLength();
      path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(600).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
    }
    // correction arrows pulling toward the reference line
    [0.28, 0.52, 0.76].forEach((f) => {
      const px = x0 + f * (x1 - x0);
      const wob = Math.sin(f * Math.PI * 3) * 15 * (1 - f * 0.4);
      svg.append("line").attr("x1", px).attr("y1", refY - wob).attr("x2", px).attr("y2", refY).style("stroke", "var(--signal)").style("stroke-width", 1.4).style("stroke-dasharray", "3 3").style("opacity", 0.75);
    });
    const end = pts[pts.length - 1];
    svg.append("circle").attr("cx", end[0]).attr("cy", end[1]).attr("r", 5).style("fill", "var(--signal)");
    svg.append("text").attr("x", end[0] - 6).attr("y", end[1] - 12).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12.5px").style("font-weight", "700").text(`✓ ${o.correct}`);
    svg.append("text").attr("x", x0).attr("y", H - 12).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12.5px").text(`${o.onPath} · error ${o.errPct.toFixed(1)}%`);
  }
}

/* --- Node 5: three deployment targets, cost vs the $500 budget ----------- */
function drawDeploy(el: SVGSVGElement, o: { hwLabels: string[]; selected: Hardware; budgetLabel: string; reduce: boolean }) {
  const W = 760, H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const order: Hardware[] = ["device", "cloud", "gateway"];
  const pad = { l: 150, r: 30, t: 26, b: 42 };
  const maxUSD = 600;
  const x = d3.scaleLinear().domain([0, maxUSD]).range([pad.l, W - pad.r]);
  const rowH = 46, gap = 18;
  // budget line
  svg.append("line").attr("x1", x(DEPLOY_BUDGET_USD)).attr("y1", pad.t - 6).attr("x2", x(DEPLOY_BUDGET_USD)).attr("y2", H - pad.b + 6).style("stroke", "var(--signal-fg)").style("stroke-width", 1.5).style("stroke-dasharray", "5 4");
  svg.append("text").attr("x", x(DEPLOY_BUDGET_USD)).attr("y", H - pad.b + 24).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "11.5px").text(o.budgetLabel);

  order.forEach((hw, i) => {
    const d = HARDWARE[hw];
    const y = pad.t + i * (rowH + gap);
    const sel = hw === o.selected;
    // label
    svg.append("text").attr("x", pad.l - 12).attr("y", y + rowH / 2 + 5).attr("text-anchor", "end").style("fill", sel ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12.5px").style("font-weight", sel ? "700" : "400").text(o.hwLabels[i]);
    // cost bar (min width so $0 still shows a nub)
    const barW = Math.max(4, x(d.monthlyUSD) - pad.l);
    const col = d.monthlyUSD <= DEPLOY_BUDGET_USD ? "var(--signal)" : "var(--tok-byte)";
    const bar = svg.append("rect").attr("x", pad.l).attr("y", y).attr("height", rowH).attr("rx", 6).style("fill", col).style("fill-opacity", sel ? 0.92 : 0.4).style("stroke", sel ? col : "none").style("stroke-width", 1.5);
    if (o.reduce) bar.attr("width", barW);
    else bar.attr("width", 0).transition().duration(420).ease(d3.easeCubicOut).attr("width", barW);
    // value: cost + latency
    svg.append("text").attr("x", pad.l + barW + 12).attr("y", y + rowH / 2 - 2).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", "700").text(d.monthlyUSD === 0 ? "$0 / mo" : `$${d.monthlyUSD} / mo`);
    svg.append("text").attr("x", pad.l + barW + 12).attr("y", y + rowH / 2 + 14).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "11px").text(`${d.latencyMs} ms · ${d.tokPerSec} tok/s`);
  });
}

/* --- Node 6: reasoning capacity vs student size (S-curve + floor) -------- */
function drawLimit(el: SVGSVGElement, o: { size: number; floorLabel: string; sweetLabel: string; teacherLabel: string; axisX: string; axisY: string; reduce: boolean }) {
  const W = 760, H = 320;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const pad = { l: 54, r: 22, t: 26, b: 48 };
  const x = d3.scaleLog().domain([0.5, 14]).range([pad.l, W - pad.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([H - pad.b, pad.t]);
  const curve = reasoningCurve();
  const line = d3.line<{ params: number; reasoning: number }>().x((d) => x(d.params)).y((d) => y(d.reasoning)).curve(d3.curveMonotoneX);

  // reasoning-floor region (params < 2)
  svg.append("rect").attr("x", pad.l).attr("y", pad.t).attr("width", x(REASONING_FLOOR_B) - pad.l).attr("height", (H - pad.b) - pad.t).style("fill", "var(--tok-byte)").style("fill-opacity", 0.08);
  svg.append("text").attr("x", (pad.l + x(REASONING_FLOOR_B)) / 2).attr("y", H - pad.b - 10).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").style("opacity", 0.9).text(o.floorLabel);
  // sweet-spot band (3..8)
  svg.append("rect").attr("x", x(3)).attr("y", pad.t).attr("width", x(8) - x(3)).attr("height", (H - pad.b) - pad.t).style("fill", "var(--signal)").style("fill-opacity", 0.08);
  svg.append("text").attr("x", (x(3) + x(8)) / 2).attr("y", pad.t + 16).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.sweetLabel);

  // axis ticks
  [0.5, 1, 2, 4, 8, 14].forEach((tk) => {
    svg.append("line").attr("x1", x(tk)).attr("y1", pad.t).attr("x2", x(tk)).attr("y2", H - pad.b).style("stroke", "var(--hair)").style("stroke-width", 1).style("opacity", 0.4);
    svg.append("text").attr("x", x(tk)).attr("y", H - pad.b + 20).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "11px").text(`${tk}B`);
  });
  svg.append("text").attr("x", (pad.l + W - pad.r) / 2).attr("y", H - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "11px").text(o.axisX);
  svg.append("text").attr("transform", `translate(15 ${(pad.t + H - pad.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "11px").text(o.axisY);

  // teacher ceiling
  svg.append("line").attr("x1", pad.l).attr("y1", y(96)).attr("x2", W - pad.r).attr("y2", y(96)).style("stroke", "var(--muted)").style("stroke-width", 1).style("stroke-dasharray", "4 4").style("opacity", 0.6);
  svg.append("text").attr("x", W - pad.r).attr("y", y(96) - 6).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "11px").text(o.teacherLabel);

  // the curve
  const path = svg.append("path").datum(curve).attr("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2.8).attr("d", line);
  if (!o.reduce) {
    const len = (path.node() as SVGPathElement).getTotalLength();
    path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(560).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
  }

  // selected marker
  const r = reasoningLimit(o.size);
  const mcol = r.aboveFloor ? "var(--signal)" : "var(--tok-byte)";
  svg.append("line").attr("x1", x(o.size)).attr("y1", y(r.reasoning)).attr("x2", x(o.size)).attr("y2", H - pad.b).style("stroke", mcol).style("stroke-width", 1).style("stroke-dasharray", "3 3").style("opacity", 0.7);
  svg.append("circle").attr("cx", x(o.size)).attr("cy", y(r.reasoning)).attr("r", 6).style("fill", mcol).style("stroke", "var(--bg)").style("stroke-width", 1.6);
  svg.append("text").attr("x", x(o.size)).attr("y", y(r.reasoning) - 12).attr("text-anchor", "middle").style("fill", mcol).style("font-family", MONO).style("font-size", "12.5px").style("font-weight", "700").text(`${o.size.toFixed(1)}B · ${r.reasoning.toFixed(0)}`);
}

/* ======================================================================== *
 * Node components — state + controls + readout, wrapping SceneShell.
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

function useDistill() {
  const { t } = useAcademy();
  return t.distill;
}

function Node1({ reduce }: { reduce: boolean }) {
  const d = useDistill();
  const n = d.nodes[0];
  const [params, setParams] = useState(FIT_PRESETS[1].params);
  const [bits, setBits] = useState(FIT_PRESETS[1].bits);
  const [preset, setPreset] = useState(1);
  const r = fitStudent(params, bits);
  const note = !r.fits ? rich(d.n1overNote) : preset >= 0 ? n.optionNotes?.[preset] : rich(n.sliderNote ?? "");
  const pick = (i: number) => { setParams(FIT_PRESETS[i].params); setBits(FIT_PRESETS[i].bits); setPreset(i); };
  const bitsLabel = bits >= 16 ? "16 · FP16" : bits >= 8 ? "8 · INT8" : "4 · INT4";
  return (
    <SceneShell
      id="ds-node-1" index={1} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <ControlRow>
            {d.n1presets.map((label, i) => (
              <Toggle key={i} on={preset === i} onClick={() => pick(i)}>{label}</Toggle>
            ))}
          </ControlRow>
          <Slider id="ds-params" label={d.n1params} value={Math.round(params * 10)} display={`${params.toFixed(1)} B`} min={5} max={140} step={5} onChange={(v) => { setParams(v / 10); setPreset(-1); }} />
          <Slider id="ds-bits" label={d.n1bits} value={bits} display={bitsLabel} min={4} max={16} step={4} onChange={(v) => { setBits(v === 12 ? 16 : v); setPreset(-1); }} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${TEACHER_B} B · ${TEACHER_B * 2} GB` },
          { k: n.rows[1], v: `${params.toFixed(1)} B · ${bits}-bit` },
          { k: n.rows[2], v: `${r.vramGB.toFixed(1)} / ${VRAM_BUDGET_GB} GB`, hi: r.fits },
          { k: n.rows[3], v: `${r.retention.toFixed(0)}%`, hi: r.passed },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawFit(el, { teacherLabel: d.n1teacherLabel, studentLabel: d.n1studentLabel, budgetLabel: d.n1budgetLabel, overLabel: d.n1overLabel, vramGB: r.vramGB, retention: r.retention, fits: r.fits, reduce })} deps={[params, bits, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const d = useDistill();
  const n = d.nodes[1];
  const [tt, setTt] = useState(1);
  const s = softTargets(tt);
  return (
    <SceneShell
      id="ds-node-2" index={2} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote ? rich(n.sliderNote) : undefined}
      aside={<Deeper title={d.n2mathTitle}>{rich(d.n2mathBody)}</Deeper>}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>{d.n2promptLabel}</div>
          <Slider id="ds-temp" label={d.n2slider} value={Math.round(tt * 10)} display={`T = ${tt.toFixed(1)}`} min={10} max={100} step={5} onChange={(v) => setTt(v / 10)} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: tt.toFixed(1) },
          { k: n.rows[1], v: `${Math.round(s.top1Prob * 100)}%` },
          { k: n.rows[2], v: `${Math.round(s.secondaryMass * 100)}% · +${s.darkGain}%`, hi: true },
          { k: n.rows[3], v: `${s.entropyBits.toFixed(2)} bits` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawSoft(el, { t: tt, top1: s.top1, reduce })} deps={[tt, reduce]} />}
    </SceneShell>
  );
}

/** Node 3: the bare completion beside the traced one (text-vs-text). */
function ClonePanels({ d, mode }: { d: ReturnType<typeof useDistill>; mode: CloneMode }) {
  const panel = (label: string, active: boolean, body: string) => (
    <div style={{ border: `1px solid ${active ? "var(--signal)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)", opacity: active ? 1 : 0.62, transition: "opacity .15s ease" }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: active ? "var(--signal-fg)" : "var(--muted)", padding: "9px 12px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>{label}</div>
      <pre style={{ margin: 0, padding: "12px 13px", fontFamily: MONO, fontSize: 12, lineHeight: 1.55, color: "var(--fg)", whiteSpace: "pre-wrap", minHeight: 190 }}>{body}</pre>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 12 }}>
      {panel(d.n3rawLabel, mode === "raw", RAW_COMPLETION)}
      {panel(d.n3cotLabel, mode === "cot", COT_COMPLETION)}
    </div>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const d = useDistill();
  const n = d.nodes[2];
  const modes: CloneMode[] = ["raw", "cot"];
  const [mode, setMode] = useState<CloneMode>("cot");
  const [vol, setVol] = useState(10);
  const yld = cloneYield(vol, mode);
  const idx = modes.indexOf(mode);
  const manual = useRef(false);
  const pick = (m: CloneMode) => { setMode(m); manual.current = true; };
  return (
    <SceneShell
      id="ds-node-3" index={3} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(step) => { if (!manual.current) setMode(modes[step]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <>
          <ControlRow>
            {d.n3modes.map((label, i) => (
              <Toggle key={i} on={mode === modes[i]} onClick={() => pick(modes[i])}>{label}</Toggle>
            ))}
          </ControlRow>
          <Slider id="ds-vol" label={d.n3volume} value={vol} display={`${vol} B`} min={1} max={20} onChange={setVol} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${vol} B` },
          { k: n.rows[1], v: mode === "cot" ? "ON · <thought>" : "OFF", hi: mode === "cot" },
          { k: n.rows[2], v: `${yld.score.toFixed(1)} / 100`, hi: yld.passed },
          { k: n.rows[3], v: `${yld.genHours.toFixed(1)} h` },
        ]} />
      }
    >
      {() => <ClonePanels d={d} mode={mode} />}
    </SceneShell>
  );
}

function Node4({ reduce }: { reduce: boolean }) {
  const d = useDistill();
  const n = d.nodes[3];
  const [onPolicy, setOnPolicy] = useState(false);
  const [len, setLen] = useState(64);
  const a = trajectoryAudit(len, onPolicy);
  const idx = onPolicy ? 1 : 0;
  return (
    <SceneShell
      id="ds-node-4" index={4} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <>
          <ControlRow>
            <Toggle on={onPolicy} onClick={() => setOnPolicy((v) => !v)}>{d.n4toggleOn}: {onPolicy ? "ON" : "OFF"}</Toggle>
          </ControlRow>
          <Slider id="ds-len" label={d.n4rollout} value={len} display={`${len} tok`} min={8} max={128} step={8} onChange={setLen} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: onPolicy ? "ON-POLICY" : "OFF-POLICY", hi: onPolicy },
          { k: n.rows[1], v: onPolicy ? "ELIMINATED" : "PRESENT", hi: onPolicy },
          { k: n.rows[2], v: `${a.compoundErr.toFixed(1)}%`, hi: a.passed },
          { k: n.rows[3], v: `${a.offErr.toFixed(1)}%` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawPolicy(el, { onPolicy, len, offPath: d.n4offPath, onPath: d.n4onPath, correct: d.n4correct, diverge: d.n4diverge, errPct: a.compoundErr, reduce })} deps={[onPolicy, len, reduce]} />}
    </SceneShell>
  );
}

function Node5({ reduce }: { reduce: boolean }) {
  const d = useDistill();
  const n = d.nodes[4];
  const hws: Hardware[] = ["device", "cloud", "gateway"];
  const [hw, setHw] = useState<Hardware>("cloud");
  const [volume, setVolume] = useState(1_000_000);
  const r = deploy(hw, volume);
  const idx = hws.indexOf(hw);
  const manual = useRef(false);
  const pick = (h: Hardware) => { setHw(h); manual.current = true; };
  const volLabel = volume >= 1_000_000 ? `${(volume / 1_000_000).toFixed(1)}M` : `${Math.round(volume / 1000)}k`;
  const capLabel = r.capacity === Infinity ? "∞ (per-device)" : `${(r.capacity / 1_000_000).toFixed(1)}M/day`;
  return (
    <SceneShell
      id="ds-node-5" index={5} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(step) => { if (!manual.current) setHw(hws[step]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <>
          <ControlRow>
            {d.n5hw.map((label, i) => (
              <Toggle key={i} on={hw === hws[i]} onClick={() => pick(hws[i])}>{label}</Toggle>
            ))}
          </ControlRow>
          <Slider id="ds-volume" label={d.n5volume} value={Math.round(volume / 1000)} display={volLabel} min={10} max={5000} step={10} onChange={(v) => setVolume(v * 1000)} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${r.tokPerSec} tok/s · ${capLabel}` },
          { k: n.rows[1], v: r.monthlyUSD === 0 ? "$0" : `$${r.monthlyUSD} / ${DEPLOY_BUDGET_USD}`, hi: r.monthlyUSD <= DEPLOY_BUDGET_USD },
          { k: n.rows[2], v: `${r.latencyMs} ms` },
          { k: n.rows[3], v: r.passed ? "PRODUCTION READY" : "OVER CAPACITY / BUDGET", hi: r.passed },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawDeploy(el, { hwLabels: d.n5hw, selected: hw, budgetLabel: `$${DEPLOY_BUDGET_USD} BUDGET`, reduce })} deps={[hw, reduce]} />}
    </SceneShell>
  );
}

function Node6({ reduce }: { reduce: boolean }) {
  const d = useDistill();
  const n = d.nodes[5];
  const [size, setSize] = useState(3.8);
  const r = reasoningLimit(size);
  return (
    <SceneShell
      id="ds-node-6" index={6} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote ? rich(n.sliderNote) : undefined}
      controls={<Slider id="ds-size" label={d.n6slider} value={Math.round(size * 10)} display={`${size.toFixed(1)} B`} min={5} max={140} step={1} onChange={(v) => setSize(v / 10)} />}
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${size.toFixed(1)} B` },
          { k: n.rows[1], v: `${r.reasoning.toFixed(0)} / 100 · ${r.aboveFloor ? "above floor" : "BELOW FLOOR"}`, hi: r.aboveFloor && r.reasoning >= 70 },
          { k: n.rows[2], v: `${r.latencyMs} ms`, hi: r.latencyMs <= 100 },
          { k: n.rows[3], v: `${r.hallucination.toFixed(1)}%`, hi: r.hallucination <= 4 },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawLimit(el, { size, floorLabel: d.n6floorLabel, sweetLabel: d.n6sweetLabel, teacherLabel: d.n6teacherLabel, axisX: d.n6axisX, axisY: d.n6axisY, reduce })} deps={[size, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Distill() {
  const { t, lang } = useAcademy();
  const d = t.distill;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{d.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {d.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{d.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{d.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 8 }}>
            {d.pipeline.map((label, i) => (
              <a key={i} href={`#ds-node-${i + 1}`} className="u-hover-fg-border"
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
        <Node4 reduce={reduce} />
        <Node5 reduce={reduce} />
        <Node6 reduce={reduce} />
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{d.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{d.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(d.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{d.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(d.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/data-recipe" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {d.prevLesson}</Link>
        <span style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)", opacity: 0.6 }}>{d.nextLesson} →</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
