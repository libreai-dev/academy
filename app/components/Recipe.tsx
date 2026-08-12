"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  DOMAINS,
  RECIPE_PRESETS,
  scoreMix,
  type Mix,
  type DomainKey,
  NATURAL_FREQ,
  temperatureMix,
  lossCurve,
  SEED_TEXT,
  TEXTBOOK_TEXT,
  type RewriteMode,
  SYNTH_DOCS,
  type Gate,
  auditDoc,
  type StreamKey,
  DEFAULT_RECIPE,
  type Recipe,
  evalRecipe,
} from "../lib/recipe";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

const DOMAIN_FILL: Record<string, string> = {
  web: "var(--tok-space)",
  code: "var(--tok-num)",
  math: "var(--tok-sub)",
  books: "var(--tok-word)",
  synth: "var(--signal)",
};

const DOMAIN_INK: Record<string, string> = {
  // domains whose fill is dark enough to warrant light ink on the segment
  synth: "#0a0a09",
};

function normalize<T extends string>(mix: Record<T, number>, keys: T[]): Record<T, number> {
  const s = keys.reduce((a, k) => a + Math.max(0, mix[k]), 0) || 1;
  const out = {} as Record<T, number>;
  keys.forEach((k) => (out[k] = (Math.max(0, mix[k]) / s) * 100));
  return out;
}

/* --- Shared: a labelled horizontal stacked share-bar --------------------- */
function stackedBar(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  o: {
    x: number; y: number; w: number; h: number;
    keys: string[]; shares: Record<string, number>; labels: Record<string, string>;
    reduce: boolean;
  },
) {
  let cx = o.x;
  o.keys.forEach((k) => {
    const segW = (o.shares[k] / 100) * o.w;
    if (segW <= 0) return;
    svg.append("rect").attr("x", cx).attr("y", o.y).attr("width", Math.max(0, segW - 1)).attr("height", o.h)
      .attr("rx", 3).style("fill", DOMAIN_FILL[k]).style("fill-opacity", 0.9);
    if (segW > 46) {
      const ink = DOMAIN_INK[k] ?? "var(--fg)";
      svg.append("text").attr("x", cx + segW / 2).attr("y", o.y + o.h / 2 - 3).attr("text-anchor", "middle")
        .style("fill", ink).style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(o.labels[k]);
      svg.append("text").attr("x", cx + segW / 2).attr("y", o.y + o.h / 2 + 12).attr("text-anchor", "middle")
        .style("fill", ink).style("font-family", MONO).style("font-size", "12px").style("opacity", 0.8).text(`${Math.round(o.shares[k])}%`);
    }
    cx += segW;
  });
}

/* --- Node 1: natural vs your recipe -------------------------------------- */
function drawMix(el: SVGSVGElement, o: { natural: Mix; yours: Mix; labels: Record<string, string>; naturalLabel: string; yoursLabel: string; drift: boolean; driftWarn: string; reduce: boolean }) {
  const W = 760, H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const keys: DomainKey[] = ["web", "code", "math", "books"];
  const barX = 24, barW = W - 48, barH = 60;

  svg.append("text").attr("x", barX).attr("y", 30).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.naturalLabel);
  stackedBar(svg, { x: barX, y: 40, w: barW, h: barH, keys, shares: normalize(o.natural, keys), labels: o.labels, reduce: o.reduce });

  svg.append("text").attr("x", barX).attr("y", 152).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(o.yoursLabel);
  stackedBar(svg, { x: barX, y: 162, w: barW, h: barH, keys, shares: normalize(o.yours, keys), labels: o.labels, reduce: o.reduce });

  if (o.drift) {
    svg.append("rect").attr("x", barX - 6).attr("y", 156).attr("width", barW + 12).attr("height", barH + 12).attr("rx", 8)
      .style("fill", "none").style("stroke", "var(--tok-byte)").style("stroke-width", 2).style("stroke-dasharray", "6 4");
    svg.append("text").attr("x", barX).attr("y", 244).style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(`⚠ ${o.driftWarn}`);
  }
}

/* --- Node 2: natural freq p vs sampled prob q, by temperature ------------ */
function drawTemp(el: SVGSVGElement, o: { tau: number; natLabel: string; adjLabel: string; domainLabels: Record<string, string>; reduce: boolean }) {
  const W = 760, H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const keys: DomainKey[] = ["web", "code", "math", "books"];
  const q = temperatureMix(o.tau);
  const pad = { l: 40, r: 20, t: 30, b: 54 };
  const y = d3.scaleLinear().domain([0, 0.85]).range([H - pad.b, pad.t]).clamp(true);
  const groupW = (W - pad.l - pad.r) / keys.length;
  const bw = 34;
  // baseline
  svg.append("line").attr("x1", pad.l).attr("y1", y(0)).attr("x2", W - pad.r).attr("y2", y(0)).style("stroke", "var(--hair)");
  // legend
  svg.append("rect").attr("x", pad.l).attr("y", 8).attr("width", 12).attr("height", 12).attr("rx", 2).style("fill", "var(--tok-space)").style("fill-opacity", 0.5);
  svg.append("text").attr("x", pad.l + 18).attr("y", 18).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.natLabel);
  svg.append("rect").attr("x", pad.l + 150).attr("y", 8).attr("width", 12).attr("height", 12).attr("rx", 2).style("fill", "var(--signal)");
  svg.append("text").attr("x", pad.l + 168).attr("y", 18).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.adjLabel);

  keys.forEach((k, i) => {
    const gx = pad.l + i * groupW + groupW / 2;
    const pVal = NATURAL_FREQ[k];
    const qVal = q[k];
    // natural (p) — grey outline bar
    svg.append("rect").attr("x", gx - bw - 3).attr("y", y(pVal)).attr("width", bw).attr("height", y(0) - y(pVal))
      .attr("rx", 3).style("fill", "var(--tok-space)").style("fill-opacity", 0.45);
    // sampled (q) — green bar, animated up
    const qh = y(0) - y(qVal);
    const bar = svg.append("rect").attr("x", gx + 3).attr("width", bw).attr("rx", 3).style("fill", "var(--signal)");
    if (o.reduce) bar.attr("y", y(qVal)).attr("height", qh);
    else bar.attr("y", y(0)).attr("height", 0).transition().duration(420).ease(d3.easeCubicOut).attr("y", y(qVal)).attr("height", qh);
    svg.append("text").attr("x", gx + 3 + bw / 2).attr("y", y(qVal) - 6).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(`${Math.round(qVal * 100)}%`);
    svg.append("text").attr("x", gx).attr("y", H - pad.b + 20).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(o.domainLabels[k]);
  });
}

/* --- Node 3: validation loss vs epochs, with a memorization cliff -------- */
function drawLoss(el: SVGSVGElement, o: { cap: number; safeLabel: string; cliffLabel: string; axisX: string; axisY: string; reduce: boolean }) {
  const W = 760, H = 320;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const pad = { l: 52, r: 20, t: 24, b: 46 };
  const CLIFF = 2.5;
  const x = d3.scaleLinear().domain([0, 5]).range([pad.l, W - pad.r]);
  const y = d3.scaleLinear().domain([1.4, 4.3]).range([H - pad.b, pad.t]);
  const full = lossCurve(5);
  const line = d3.line<{ epoch: number; loss: number }>().x((d) => x(d.epoch)).y((d) => y(d.loss)).curve(d3.curveMonotoneX);

  // memorization zone
  svg.append("rect").attr("x", x(CLIFF)).attr("y", pad.t).attr("width", (W - pad.r) - x(CLIFF)).attr("height", (H - pad.b) - pad.t)
    .style("fill", "var(--tok-byte)").style("fill-opacity", 0.08);
  svg.append("text").attr("x", (x(CLIFF) + (W - pad.r)) / 2).attr("y", pad.t + 16).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").style("opacity", 0.85).text(o.cliffLabel);

  // axes ticks
  [1, 2, 3, 4, 5].forEach((t) => {
    svg.append("line").attr("x1", x(t)).attr("y1", pad.t).attr("x2", x(t)).attr("y2", H - pad.b).style("stroke", "var(--hair)").style("stroke-width", 1).style("opacity", 0.5);
    svg.append("text").attr("x", x(t)).attr("y", H - pad.b + 18).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${t}×`);
  });
  svg.append("text").attr("x", (pad.l + W - pad.r) / 2).attr("y", H - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.axisX);
  svg.append("text").attr("transform", `translate(14 ${(pad.t + H - pad.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.axisY);

  // faint full-potential curve
  svg.append("path").datum(full).attr("fill", "none").style("stroke", "var(--muted)").style("stroke-width", 1.2).style("stroke-dasharray", "3 4").style("opacity", 0.5).attr("d", line);

  // solid travelled curve up to cap: green portion + red portion past the cliff
  const travelled = full.filter((p) => p.epoch <= o.cap + 1e-9);
  const green = travelled.filter((p) => p.epoch <= CLIFF + 1e-9);
  const red = travelled.filter((p) => p.epoch >= CLIFF - 1e-9);
  const gp = svg.append("path").datum(green).attr("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2.8).attr("d", line);
  if (red.length > 1) svg.append("path").datum(red).attr("fill", "none").style("stroke", "var(--tok-byte)").style("stroke-width", 2.8).attr("d", line);
  if (!o.reduce) {
    const len = (gp.node() as SVGPathElement).getTotalLength();
    gp.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(500).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
  }

  // safe-cap guide at 2x
  svg.append("line").attr("x1", x(2)).attr("y1", pad.t).attr("x2", x(2)).attr("y2", H - pad.b).style("stroke", "var(--signal)").style("stroke-width", 1).style("stroke-dasharray", "4 4").style("opacity", 0.6);
  svg.append("text").attr("x", x(2) + 5).attr("y", H - pad.b - 6).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.safeLabel);

  // your cap marker
  const capPt = full.find((p) => Math.abs(p.epoch - o.cap) < 0.06) ?? full[full.length - 1];
  const capCol = o.cap <= CLIFF ? "var(--signal)" : "var(--tok-byte)";
  svg.append("circle").attr("cx", x(o.cap)).attr("cy", y(capPt.loss)).attr("r", 5).style("fill", capCol).style("stroke", "var(--bg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", x(o.cap)).attr("y", pad.t + 12).attr("text-anchor", "middle").style("fill", capCol).style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(`cap ${o.cap.toFixed(1)}×`);
}

/* --- Node 5: the 3-gate synthetic audit --------------------------------- */
function drawGates(el: SVGSVGElement, o: { docLabel: string; fails: Gate | null; gates: Record<Gate, boolean>; landed: Gate | "buffer"; gateLabels: string[]; bufferLabel: string; dropLabel: string; reduce: boolean }) {
  const W = 760, H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const cy = 70;
  const gateKeys: Gate[] = ["exec", "judge", "contam"];
  const gx = [176, 330, 484];
  const gw = 120, gh = 66;
  const docX = 16, docW = 140;
  const bufX = 620, bufW = 124;

  // doc chip
  svg.append("rect").attr("x", docX).attr("y", cy - 26).attr("width", docW).attr("height", 52).attr("rx", 10).style("fill", "var(--surface)").style("stroke", "var(--fg)").style("stroke-width", 1.4);
  svg.append("text").attr("x", docX + docW / 2).attr("y", cy + 5).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(o.docLabel);

  // gates
  gateKeys.forEach((g, i) => {
    const on = o.gates[g];
    svg.append("rect").attr("x", gx[i]).attr("y", cy - gh / 2).attr("width", gw).attr("height", gh).attr("rx", 12)
      .style("fill", "var(--bg)").style("stroke", on ? "var(--fg)" : "var(--border)").style("stroke-width", 1.5).style("stroke-dasharray", on ? "none" : "4 4").style("opacity", on ? 1 : 0.5);
    svg.append("text").attr("x", gx[i] + gw / 2).attr("y", cy - 4).attr("text-anchor", "middle").style("fill", on ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.gateLabels[i]);
    svg.append("text").attr("x", gx[i] + gw / 2).attr("y", cy + 14).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(on ? "ON" : "OFF");
  });

  // buffer
  const reached = o.landed === "buffer";
  svg.append("rect").attr("x", bufX).attr("y", cy - 30).attr("width", bufW).attr("height", 60).attr("rx", 12)
    .style("fill", reached ? "color-mix(in srgb, var(--signal) 16%, transparent)" : "var(--surface)").style("stroke", reached ? "var(--signal)" : "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", bufX + bufW / 2).attr("y", cy + 4).attr("text-anchor", "middle").style("fill", reached ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(o.bufferLabel);

  // path: from doc, through gates, to landing point
  const landIdx = o.landed === "buffer" ? gateKeys.length : gateKeys.indexOf(o.landed);
  const stops = [docX + docW, ...gx.map((gxi) => gxi + gw / 2), bufX];
  const segEnd = o.landed === "buffer" ? bufX : gx[landIdx] + gw / 2;
  const col = o.landed === "buffer" ? "var(--signal)" : "var(--tok-byte)";
  const path = svg.append("line").attr("x1", docX + docW).attr("y1", cy).attr("x2", docX + docW).attr("y2", cy).style("stroke", col).style("stroke-width", 2.5);
  if (o.reduce) path.attr("x2", segEnd);
  else path.transition().duration(500).ease(d3.easeCubicOut).attr("x2", segEnd);

  if (o.landed !== "buffer") {
    // drop chute at the failing gate
    const dropX = gx[landIdx] + gw / 2;
    svg.append("line").attr("x1", dropX).attr("y1", cy + gh / 2).attr("x2", dropX).attr("y2", H - 42).style("stroke", "var(--tok-byte)").style("stroke-width", 2).style("stroke-dasharray", "4 4");
    svg.append("text").attr("x", dropX).attr("y", H - 24).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "700").text(`✕ ${o.dropLabel}`);
  }
  // keep stops referenced (avoids unused in some builds)
  void stops;
}

/* --- Node 6: raw web vs frontier recipe (5 streams) + benchmark ---------- */
function drawFinal(el: SVGSVGElement, o: { raw: Recipe; yours: Recipe; labels: Record<string, string>; rawLabel: string; finalLabel: string; rawBench: number; yourBench: number; reduce: boolean }) {
  const W = 760, H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const keys: StreamKey[] = ["web", "code", "math", "synth", "books"];
  const barX = 24, barW = W - 48, barH = 58;

  svg.append("text").attr("x", barX).attr("y", 28).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${o.rawLabel}  ·  ~${o.rawBench.toFixed(0)}/100`);
  stackedBar(svg, { x: barX, y: 38, w: barW, h: barH, keys, shares: normalize(o.raw, keys), labels: o.labels, reduce: o.reduce });

  svg.append("text").attr("x", barX).attr("y", 150).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(`${o.finalLabel}  ·  ~${o.yourBench.toFixed(0)}/100`);
  stackedBar(svg, { x: barX, y: 160, w: barW, h: barH, keys, shares: normalize(o.yours, keys), labels: o.labels, reduce: o.reduce });
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

function useRecipe() {
  const { t } = useAcademy();
  return t.recipe;
}

function pctOf(mix: Mix, k: DomainKey): number {
  const s = mix.web + mix.code + mix.math + mix.books || 1;
  return (Math.max(0, mix[k]) / s) * 100;
}

function Node1({ reduce }: { reduce: boolean }) {
  const d = useRecipe();
  const n = d.nodes[0];
  const [mix, setMix] = useState<Mix>({ ...RECIPE_PRESETS[1].mix });
  const [lastPreset, setLastPreset] = useState(1);
  const norm: Mix = { web: pctOf(mix, "web"), code: pctOf(mix, "code"), math: pctOf(mix, "math"), books: pctOf(mix, "books") };
  const sc = scoreMix(norm);
  const domLabels: Record<string, string> = { web: d.n1domains[0], code: d.n1domains[1], math: d.n1domains[2], books: d.n1domains[3] };
  const keys: DomainKey[] = ["web", "code", "math", "books"];
  const note = sc.drift ? rich(d.n1driftNote) : lastPreset >= 0 ? n.optionNotes?.[lastPreset] : rich(n.sliderNote ?? "");
  const setShare = (k: DomainKey, v: number) => { setMix((p) => ({ ...p, [k]: v })); setLastPreset(-1); };
  return (
    <SceneShell
      id="rc-node-1" index={1} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <ControlRow>
            {d.n1presets.map((label, i) => (
              <Toggle key={i} on={lastPreset === i} onClick={() => { setMix({ ...RECIPE_PRESETS[i].mix }); setLastPreset(i); }}>{label}</Toggle>
            ))}
          </ControlRow>
          {keys.map((k, i) => (
            <Slider key={k} id={`rc-share-${k}`} label={d.n1domains[i]} value={Math.round(mix[k])} display={`${Math.round(norm[k])}%`} min={0} max={100} onChange={(v) => setShare(k, v)} />
          ))}
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawMix(el, { natural: { web: DOMAINS[0].natural, code: DOMAINS[1].natural, math: DOMAINS[2].natural, books: DOMAINS[3].natural }, yours: norm, labels: domLabels, naturalLabel: d.n1natural, yoursLabel: d.n1yours, drift: sc.drift, driftWarn: d.n1driftWarn, reduce })} deps={[mix, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const d = useRecipe();
  const n = d.nodes[1];
  const [tau, setTau] = useState(0.5);
  const domLabels: Record<string, string> = { web: d.n1domains[0], code: d.n1domains[1], math: d.n1domains[2], books: d.n1domains[3] };
  return (
    <SceneShell
      id="rc-node-2" index={2} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote ? rich(n.sliderNote) : undefined}
      aside={<Deeper title={d.n2mathTitle}>{rich(d.n2mathBody)}</Deeper>}
      controls={<Slider id="rc-tau" label={d.n2slider} value={Math.round(tau * 100)} display={`τ = ${tau.toFixed(2)}`} min={10} max={100} step={5} onChange={(v) => setTau(v / 100)} />}
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawTemp(el, { tau, natLabel: d.n2natLabel, adjLabel: d.n2adjLabel, domainLabels: domLabels, reduce })} deps={[tau, reduce]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const d = useRecipe();
  const n = d.nodes[2];
  const [cap, setCap] = useState(1.8);
  return (
    <SceneShell
      id="rc-node-3" index={3} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote ? rich(n.sliderNote) : undefined}
      controls={<Slider id="rc-cap" label={d.n3slider} value={Math.round(cap * 10)} display={`${cap.toFixed(1)}×`} min={10} max={50} step={1} onChange={(v) => setCap(v / 10)} />}
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawLoss(el, { cap, safeLabel: d.n3safe, cliffLabel: d.n3cliff, axisX: d.n3axisX, axisY: d.n3axisY, reduce })} deps={[cap, reduce]} />}
    </SceneShell>
  );
}

/** Node 4: the messy seed beside the generated textbook (text-vs-text). */
function SynthPanels({ d, mode }: { d: ReturnType<typeof useRecipe>; mode: RewriteMode }) {
  const panel = (label: string, tone: "neutral" | "ok", body: string) => (
    <div style={{ border: `1px solid ${tone === "ok" ? "var(--signal)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: tone === "ok" ? "var(--signal-fg)" : "var(--muted)", padding: "9px 12px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>{label}</div>
      <pre style={{ margin: 0, padding: "12px 13px", fontFamily: MONO, fontSize: 12, lineHeight: 1.55, color: "var(--fg)", whiteSpace: "pre-wrap", minHeight: 200 }}>{body}</pre>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 12 }}>
      {panel(d.n4seedLabel, "neutral", SEED_TEXT)}
      {panel(d.n4outLabel, "ok", mode === "textbook" ? TEXTBOOK_TEXT : "Dijkstra's algorithm finds shortest paths in a weighted graph using a min-heap / priority queue. It processes the nearest unvisited vertex first, relaxing its edges, until every distance is final.")}
    </div>
  );
}

function Node4({ reduce }: { reduce: boolean }) {
  const d = useRecipe();
  const n = d.nodes[3];
  const modes: RewriteMode[] = ["paraphrase", "textbook"];
  const [mode, setMode] = useState<RewriteMode>("paraphrase");
  const idx = modes.indexOf(mode);
  const manual = useRef(false);
  const pick = (m: RewriteMode) => { setMode(m); manual.current = true; };
  return (
    <SceneShell
      id="rc-node-4" index={4} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setMode(modes[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {d.n4modes.map((label, i) => (
            <Toggle key={i} on={mode === modes[i]} onClick={() => pick(modes[i])}>{label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <SynthPanels d={d} mode={mode} />}
    </SceneShell>
  );
}

function Node5({ reduce }: { reduce: boolean }) {
  const d = useRecipe();
  const n = d.nodes[4];
  const [docIdx, setDocIdx] = useState(0);
  const [gates, setGates] = useState<Record<Gate, boolean>>({ exec: true, judge: true, contam: true });
  const doc = SYNTH_DOCS[docIdx];
  const landed = auditDoc(doc, gates);
  const manual = useRef(false);
  const pickDoc = (i: number) => { setDocIdx(i); manual.current = true; };
  const toggleGate = (g: Gate) => { setGates((p) => ({ ...p, [g]: !p[g] })); manual.current = true; };
  const gateKeys: Gate[] = ["exec", "judge", "contam"];
  return (
    <SceneShell
      id="rc-node-5" index={5} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setDocIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[docIdx]}
      controls={
        <>
          <ControlRow>
            {d.n5docLabels.map((label, i) => (
              <Toggle key={i} on={docIdx === i} onClick={() => pickDoc(i)}>{label}</Toggle>
            ))}
          </ControlRow>
          <ControlRow>
            {gateKeys.map((g, i) => (
              <Toggle key={g} on={gates[g]} onClick={() => toggleGate(g)}>{d.n5gates[i]}: {gates[g] ? "ON" : "OFF"}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawGates(el, { docLabel: d.n5docLabels[docIdx], fails: doc.fails, gates, landed, gateLabels: d.n5gates, bufferLabel: d.n5buffer, dropLabel: d.n5drop, reduce })} deps={[docIdx, gates, reduce]} />}
    </SceneShell>
  );
}

function Node6({ reduce }: { reduce: boolean }) {
  const d = useRecipe();
  const n = d.nodes[5];
  const [recipe, setRecipe] = useState<Recipe>({ ...DEFAULT_RECIPE });
  const keys: StreamKey[] = ["web", "code", "math", "synth", "books"];
  const norm = normalize(recipe, keys);
  // Score the NORMALISED mix — raising one share must dilute the others.
  const res = evalRecipe(norm);
  const raw: Recipe = { web: 82, code: 9, math: 2, synth: 0, books: 7 };
  const rawRes = evalRecipe(raw);
  const labels: Record<string, string> = { web: d.n6streams[0], code: d.n6streams[1], math: d.n6streams[2], synth: d.n6streams[3], books: d.n6streams[4] };
  const setShare = (k: StreamKey, v: number) => setRecipe((p) => ({ ...p, [k]: v }));
  return (
    <SceneShell
      id="rc-node-6" index={6} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote ? rich(n.sliderNote) : undefined}
      controls={
        <>
          {keys.map((k, i) => (
            <Slider key={k} id={`rc-final-${k}`} label={d.n6streams[i]} value={Math.round(recipe[k])} display={`${Math.round(norm[k])}%`} min={0} max={100} onChange={(v) => setShare(k, v)} />
          ))}
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawFinal(el, { raw, yours: recipe, labels, rawLabel: d.n6rawLabel, finalLabel: d.n6finalLabel, rawBench: rawRes.benchmark, yourBench: res.benchmark, reduce })} deps={[recipe, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Recipe() {
  const { t, lang } = useAcademy();
  const d = t.recipe;
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
              <a key={i} href={`#rc-node-${i + 1}`} className="u-hover-fg-border"
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
        <Link href="/stage/0/deduplication" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {d.prevLesson}</Link>
        <span style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)", opacity: 0.6 }}>{d.nextLesson} →</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
