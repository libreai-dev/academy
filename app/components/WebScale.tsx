"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout } from "./webscale-kit";
import {
  CANDIDATES,
  computeYield,
  PAGE_LAYERS,
  type ByteKind,
  datasetTier,
  type CommonCrawlTier,
  PARSERS,
  parserBench,
  AGENTS,
  DEFAULT_ROBOTS,
  robotsDecision,
  RETRAIN_MS,
  estTokens,
  fmtInt,
} from "../lib/webscale";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

const KIND_FILL: Record<ByteKind, string> = {
  transport: "var(--tok-space)",
  code: "var(--tok-num)",
  markup: "var(--tok-sub)",
  nav: "var(--tok-byte)",
  prose: "var(--signal)",
};

/* --- Node 1: the authority field ---------------------------------------- */

function drawField(
  el: SVGSVGElement,
  o: { step: number; threshold: number; tiers: boolean[]; reduce: boolean },
) {
  const W = 760;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;
  const maxR = 196;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;
  // Higher authority → nearer the centre. A sqrt curve spreads the dense pack of
  // high-authority hubs out of the very centre so their labels don't collide.
  const rOf = (a: number) => maxR * Math.sqrt(Math.max(0, 1 - a / 100));

  // concentric authority bands
  [0.28, 0.52, 0.76, 1].forEach((f) => {
    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", maxR * f)
      .style("fill", "none").style("stroke", "var(--hair)").style("stroke-width", 1);
  });

  const ringVisible = o.step >= 2;
  const ringR = rOf(o.threshold);
  if (ringVisible) {
    const ring = svg.append("circle").attr("cx", cx).attr("cy", cy)
      .style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2.5);
    ring.attr("r", ringR);
    if (dur) ring.attr("r", 0).transition().duration(dur).attr("r", ringR);
    svg.append("text").attr("x", cx).attr("y", cy - ringR - 8).attr("text-anchor", "middle")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px")
      .text(`τ = ${o.threshold}`);
  }

  const dots = svg.selectAll("g.dot").data(CANDIDATES).join("g").attr("class", "dot")
    .attr("transform", (d) => {
      const r = rOf(d.authority);
      return `translate(${cx + r * Math.cos(d.angle)}, ${cy + r * Math.sin(d.angle)})`;
    });

  dots.append("circle")
    .attr("r", (d) => 3.5 + (d.authority / 100) * 8)
    .style("stroke", "var(--bg)").style("stroke-width", 1)
    .style("fill", (d) => {
      if (o.step === 0) return "var(--border)";
      const survives = o.step < 2 ? d.authority >= 68 : d.authority >= o.threshold && o.tiers[d.tier - 1];
      return survives ? "var(--signal)" : "var(--border)";
    })
    .style("opacity", (d) => {
      if (!ringVisible) return 1;
      const survives = d.authority >= o.threshold && o.tiers[d.tier - 1];
      return survives ? 1 : 0.4;
    });

  // labels for named hubs, from step 1 — greedily placed highest-authority-first,
  // skipping any that would overlap an already-placed label (+ a white halo).
  if (o.step >= 1) {
    const placed: { x: number; y: number; w: number }[] = [];
    const named = CANDIDATES.filter((d) => d.name !== "").sort((a, b) => b.authority - a.authority);
    named.forEach((d) => {
      const r = rOf(d.authority);
      const dotR = 3.5 + (d.authority / 100) * 8;
      const px = cx + r * Math.cos(d.angle) + dotR + 6;
      const py = cy + r * Math.sin(d.angle) + 3.5;
      const w = d.name.length * 7.3;
      const clash = placed.some((p) => Math.abs(p.y - py) < 13 && px < p.x + p.w && px + w > p.x);
      if (clash) return;
      placed.push({ x: px, y: py, w });
      svg.append("text").attr("x", px).attr("y", py).attr("text-anchor", "start")
        .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px")
        .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "3px").style("stroke-linejoin", "round")
        .style("opacity", 0).text(d.name)
        .transition().duration(dur).style("opacity", 0.92);
    });
  }
  // centre marker
  svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 2.5).style("fill", "var(--fg)");
}

/* --- Node 2: the byte treemap ------------------------------------------- */

function drawTreemap(
  el: SVGSVGElement,
  o: { tier: CommonCrawlTier; reduce: boolean },
) {
  const W = 760;
  const H = 420;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  // Always show the WHOLE page (so "how little is text" is visible). The tier
  // decides which layers it KEEPS — kept layers stay full colour, the rest dim.
  const tierKeeps: Record<CommonCrawlTier, ByteKind[]> = {
    warc: ["transport", "code", "markup", "nav", "prose"],
    wat: ["markup", "nav", "prose"],
    wet: ["prose"],
  };
  const keeps = tierKeeps[o.tier];

  interface TCell {
    children?: TCell[];
    bytes: number;
    kind: ByteKind;
    label: string;
  }
  const rootData: TCell = {
    bytes: 0,
    kind: "prose",
    label: "",
    children: PAGE_LAYERS.map((l) => ({ bytes: l.bytes, kind: l.kind, label: l.label })),
  };
  const root = d3
    .hierarchy<TCell>(rootData)
    .sum((d) => d.bytes)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const layout = d3.treemap<TCell>().size([W, H]).paddingInner(3).round(true);
  const leaves = layout(root).leaves();
  const kept = (d: { data: TCell }) => keeps.includes(d.data.kind);

  const g = svg.selectAll("g.cell").data(leaves).join("g").attr("class", "cell")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  g.append("rect")
    .attr("width", (d) => Math.max(0, d.x1 - d.x0))
    .attr("height", (d) => Math.max(0, d.y1 - d.y0))
    .attr("rx", 4)
    .style("fill", (d) => (kept(d) ? KIND_FILL[d.data.kind] : "var(--border)"))
    .style("fill-opacity", (d) => (kept(d) ? (d.data.kind === "prose" ? 1 : 0.85) : 0.28))
    .style("stroke", "var(--bg)").style("stroke-width", 1);

  g.filter((d) => d.x1 - d.x0 > 66 && d.y1 - d.y0 > 30).each(function (d) {
    const t = d3.select(this);
    const k = kept(d);
    const dark = k && (d.data.kind === "prose" || d.data.kind === "nav" || d.data.kind === "code");
    const ink = dark ? "#0a0a09" : "var(--fg)";
    t.append("text").attr("x", 8).attr("y", 18).style("fill", ink).style("opacity", k ? 1 : 0.5).style("font-family", MONO).style("font-size", "12px").text(d.data.label);
    t.append("text").attr("x", 8).attr("y", 34).style("fill", ink).style("font-family", MONO).style("font-size", "12px").style("opacity", k ? 0.75 : 0.4).text(`${(d.data.bytes / 1024).toFixed(1)} KB${k ? "" : " · dropped"}`);
  });
}

/* --- Node 3: page → parser → clean text → .bin -------------------------- */

function drawFlow(
  el: SVGSVGElement,
  o: { parserIdx: number; reduce: boolean },
) {
  const W = 760;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const p = PARSERS[o.parserIdx];
  const b = parserBench(p);
  const inKB = b.inKB;
  const outKB = b.outKB;
  const dropKB = Math.max(0, inKB - outKB);
  const top = 30;
  const barH = 230;
  const k = barH / inKB; // px per KB — the tall page bar is the full 104.6 KB
  const bw = 74;

  // The whole page bar, drawn to scale: grey = discarded, green = clean text.
  const lx = 66;
  const dropH = dropKB * k;
  const greenH = Math.max(14, outKB * k);
  const greenY = top + dropH;
  const greenMid = greenY + greenH / 2;

  svg.append("text").attr("x", lx).attr("y", top - 10).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(`the page · ${inKB} KB`);
  svg.append("rect").attr("x", lx).attr("y", top).attr("width", bw).attr("height", dropH).style("fill", "var(--border)").style("fill-opacity", 0.7);
  svg.append("rect").attr("x", lx).attr("y", greenY).attr("width", bw).attr("height", greenH).style("fill", "var(--signal)");
  svg.append("text").attr("x", lx + bw / 2).attr("y", top + dropH / 2 - 4).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text("discarded");
  svg.append("text").attr("x", lx + bw / 2).attr("y", top + dropH / 2 + 12).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${dropKB.toFixed(1)} KB ✕`);

  // Only the green (clean text) passes through the parser — a horizontal band.
  const parserX = 250;
  const parserW = 96;
  svg.append("rect").attr("x", lx + bw).attr("y", greenY).attr("width", parserX - (lx + bw)).attr("height", greenH).style("fill", "var(--signal)").style("fill-opacity", 0.9);
  // parser node
  svg.append("rect").attr("x", parserX).attr("y", greenMid - 34).attr("width", parserW).attr("height", 68).attr("rx", 10).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", parserX + parserW / 2).attr("y", greenMid - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", "0.08em").text("PARSER");
  svg.append("text").attr("x", parserX + parserW / 2).attr("y", greenMid + 12).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(p.label);

  // out of the parser: the clean-text block → tokens
  const bx = parserX + parserW + 30;
  svg.append("rect").attr("x", parserX + parserW).attr("y", greenY).attr("width", bx - (parserX + parserW)).attr("height", greenH).style("fill", "var(--signal)").style("fill-opacity", 0.9);
  svg.append("rect").attr("x", bx).attr("y", greenY).attr("width", 96).attr("height", greenH).attr("rx", 6).style("fill", "var(--signal)");
  if (p.leaksJunk) svg.append("rect").attr("x", bx).attr("y", greenY).attr("width", 96).attr("height", Math.min(greenH, 12)).attr("rx", 6).style("fill", "var(--tok-byte)").style("fill-opacity", 0.6);
  svg.append("text").attr("x", bx + 48).attr("y", greenMid + 5).attr("text-anchor", "middle").style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "13px").style("font-weight", "700").text(`${outKB} KB`);
  svg.append("text").attr("x", bx + 48).attr("y", greenY - 10).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text("clean text → tokens");

  // → .bin on disk → GPU
  const gx = bx + 130;
  svg.append("line").attr("x1", bx + 96).attr("y1", greenMid).attr("x2", gx).attr("y2", greenMid).style("stroke", "var(--fg)").style("stroke-width", 2);
  const gh = Math.max(44, greenH + 12);
  svg.append("rect").attr("x", gx).attr("y", greenMid - gh / 2).attr("width", 150).attr("height", gh).attr("rx", 8).style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", gx + 75).attr("y", greenMid - 3).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").text(".bin on disk");
  svg.append("text").attr("x", gx + 75).attr("y", greenMid + 16).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text("streams to GPU");
}

/* --- Node 4: the request waterfall -------------------------------------- */

/** Bot chip → robots.txt gate (matched rule) → SERVED / BLOCKED verdict. */
function drawGate(
  el: SVGSVGElement,
  o: { agent: string; intent: string; allowed: boolean; status: number; rule: string; reduce: boolean; servedLabel: string; blockedLabel: string; gateLabel: string },
) {
  const W = 760;
  const H = 200;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const cy = 84;
  const color = o.allowed ? "var(--signal)" : "var(--tok-byte)";

  // 1) the bot chip
  const botX = 20;
  const botW = 190;
  svg.append("rect").attr("x", botX).attr("y", cy - 34).attr("width", botW).attr("height", 68).attr("rx", 12).style("fill", "var(--surface)").style("stroke", "var(--border)");
  svg.append("text").attr("x", botX + botW / 2).attr("y", cy - 6).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "15px").style("font-weight", "700").text(o.agent);
  svg.append("text").attr("x", botX + botW / 2).attr("y", cy + 16).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.intent);

  // 2) the gate (matched rule)
  const gateX = 300;
  const gateW = 170;
  svg.append("line").attr("x1", botX + botW).attr("y1", cy).attr("x2", gateX).attr("y2", cy).style("stroke", "var(--fg)").style("stroke-width", 2);
  svg.append("rect").attr("x", gateX).attr("y", cy - 40).attr("width", gateW).attr("height", 80).attr("rx", 12).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", gateX + gateW / 2).attr("y", cy - 16).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", "0.08em").text(o.gateLabel);
  svg.append("text").attr("x", gateX + gateW / 2).attr("y", cy + 12).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").text(o.rule);

  // 3) the verdict
  const verX = gateX + gateW + 40;
  const verW = W - verX - 20;
  const arrow = svg.append("line").attr("x1", gateX + gateW).attr("y1", cy).attr("x2", verX).attr("y2", cy).style("stroke", color).style("stroke-width", 2.5);
  if (!o.allowed) arrow.style("stroke-dasharray", "5 5");
  svg.append("rect").attr("x", verX).attr("y", cy - 34).attr("width", verW).attr("height", 68).attr("rx", 12).style("fill", "color-mix(in srgb, " + color + " 14%, transparent)").style("stroke", color).style("stroke-width", 1.5);
  svg.append("text").attr("x", verX + verW / 2).attr("y", cy - 4).attr("text-anchor", "middle").style("fill", color).style("font-family", MONO).style("font-size", "16px").style("font-weight", "700").text(`${o.status} · ${o.allowed ? o.servedLabel : o.blockedLabel}`);
  svg.append("text").attr("x", verX + verW / 2).attr("y", cy + 18).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.allowed ? "✓" : "✕");
}

/* --- Node 5: retrain-vs-retrieve "time to move one fact" bar ------------- */

function drawRetrainBar(
  el: SVGSVGElement,
  o: { mode: "rag" | "retrain"; reduce: boolean; ragLabel: string; retrainLabel: string },
) {
  const W = 720;
  const H = 132;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const x0 = 150;
  const x1 = W - 96;
  const x = d3.scaleLog().domain([100, RETRAIN_MS]).range([x0, x1]).clamp(true);
  const rows = [
    { label: o.ragLabel, ms: 120, value: "~120 ms", color: "var(--signal)", active: o.mode === "rag" },
    { label: o.retrainLabel, ms: RETRAIN_MS, value: "~3 weeks", color: "var(--muted)", active: o.mode === "retrain" },
  ];
  rows.forEach((r, i) => {
    const y = 22 + i * 58;
    svg.append("text").attr("x", 8).attr("y", y + 22).style("fill", r.active ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("font-weight", r.active ? 700 : 400).text(r.label);
    svg.append("rect").attr("x", x0).attr("y", y).attr("width", x1 - x0).attr("height", 34).attr("rx", 8).style("fill", "var(--surface)").style("stroke", "var(--border)");
    const w = Math.max(6, x(r.ms) - x0);
    const bar = svg.append("rect").attr("x", x0).attr("y", y).attr("height", 34).attr("rx", 8).style("fill", r.color).style("opacity", r.active ? 1 : 0.55).style("stroke", r.active ? "var(--fg)" : "none");
    if (o.reduce) bar.attr("width", w);
    else bar.attr("width", 0).transition().duration(600).ease(d3.easeCubicOut).attr("width", w);
    svg.append("text").attr("x", x1 + 10).attr("y", y + 22).style("fill", r.active ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("font-weight", r.active ? 700 : 400).text(r.value);
  });
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

function useWS() {
  const { t } = useAcademy();
  return t.webScale;
}

/** One metric column for the retrain/retrieve compare (label:value rows). */
function MetricCol({ title, labels, values, active }: { title: string; labels: string[]; values: string[]; active: boolean }) {
  return (
    <div style={{ border: `1px solid ${active ? "var(--signal)" : "var(--border)"}`, background: active ? "var(--signal-wash)" : "var(--bg)", borderRadius: 12, padding: "14px 15px", transition: "border-color .15s ease, background .15s ease" }}>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".06em", color: active ? "var(--signal-fg)" : "var(--muted)", fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
        {labels.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: MONO, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>{l}</span>
            <span style={{ color: "var(--fg)", fontWeight: 600, textAlign: "right" }}>{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Node 5 centrepiece: the time bar + two metric columns, side by side. */
function RetrainCompare({ ws, mode, tokens, reduce }: { ws: ReturnType<typeof useWS>; mode: "rag" | "retrain"; tokens: number; reduce: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Cap>{ws.n5barLabel}</Cap>
        <div style={{ marginTop: 8 }}>
          <DiagramSvg label={ws.n5barLabel} draw={(el) => drawRetrainBar(el, { mode, reduce, ragLabel: ws.n5ragLabel, retrainLabel: ws.n5retrainLabel })} deps={[mode, reduce]} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
        <MetricCol title={ws.n5ragLabel} labels={ws.n5metrics} values={["~120 ms", "$0", "0", `+${tokens}`]} active={mode === "rag"} />
        <MetricCol title={ws.n5retrainLabel} labels={ws.n5metrics} values={["~3 weeks", "$12.4M", "405B", "0"]} active={mode === "retrain"} />
      </div>
    </div>
  );
}

/** Node 6 centrepiece: rendered page beside the extracted text + the output. */
function InjectionPanels({ ws, cp, sanitiser }: { ws: ReturnType<typeof useWS>; cp: ReturnType<typeof useWS>["n6payloads"][number]; sanitiser: boolean }) {
  const panel = (label: string, tone: "neutral" | "ok" | "bad", body: React.ReactNode) => (
    <div style={{ border: `1px solid ${tone === "bad" ? "var(--tok-byte)" : tone === "ok" ? "var(--signal)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)", padding: "9px 12px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>{label}</div>
      <div style={{ padding: "12px 13px", fontSize: 14, lineHeight: 1.6, minHeight: 96 }}>{body}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
        {panel(ws.n6seeLabel, "neutral", <span style={{ color: "var(--fg)" }}>{ws.n6pageVisible}</span>)}
        {panel(ws.n6readsLabel, sanitiser ? "ok" : "bad", (
          <>
            <span style={{ color: "var(--fg)" }}>{ws.n6pageVisible}</span>{" "}
            {sanitiser ? (
              <span style={{ color: "var(--signal-fg)", textDecoration: "line-through", opacity: 0.8 }}>{cp.hidden}</span>
            ) : (
              <span style={{ color: "var(--tok-byte)", fontWeight: 600 }}>{cp.hidden}</span>
            )}
          </>
        ))}
      </div>
      <div style={{ background: "var(--readout-bg)", border: "1px solid var(--readout-border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ color: "var(--readout-muted)", fontSize: 11, letterSpacing: ".08em", marginBottom: 4 }}>{ws.n6outputLabel}</div>
        <div style={{ color: sanitiser ? "var(--readout-fg)" : "var(--tok-byte)" }}>{sanitiser ? cp.clean : cp.attacked}</div>
      </div>
    </div>
  );
}

function Node1({ reduce }: { reduce: boolean }) {
  const ws = useWS();
  const n = ws.nodes[0];
  const [threshold, setThreshold] = useState(55);
  const [tiers, setTiers] = useState([true, true, true, false]);
  const [lastTier, setLastTier] = useState(-1);
  const y = computeYield(threshold, tiers);
  const note = lastTier >= 0 ? n.optionNotes?.[lastTier] : n.sliderNote;
  return (
    <SceneShell
      id="ws-node-1" index={1} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={n.steps} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <Slider id="ws-min-auth" label={ws.n1slider} value={threshold} display={String(threshold)} min={0} max={100} onChange={(v) => { setThreshold(v); setLastTier(-1); }} />
          <ControlRow>
            {ws.n1tierNames.map((name, i) => (
              <Toggle key={i} on={tiers[i]} onClick={() => { setTiers((p) => p.map((v, j) => (j === i ? !v : v))); setLastTier(i); }}>{name}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${fmtInt(y.accepted)} / 2.4M`, hi: true },
          { k: n.rows[1], v: `${y.volumeTiB.toFixed(1)} TiB/mo` },
          { k: n.rows[2], v: `${y.shown} / ${y.shownTotal}` },
        ]} />
      }
    >
      {(step) => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawField(el, { step: step === 0 ? 1 : 2, threshold, tiers, reduce })} deps={[step, threshold, tiers, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const ws = useWS();
  const n = ws.nodes[1];
  const tierKeys: CommonCrawlTier[] = ["warc", "wat", "wet"];
  const [tier, setTier] = useState<CommonCrawlTier>("warc");
  const m = datasetTier(tier);
  const idx = tierKeys.indexOf(tier);
  const manual = useRef(false);
  const pick = (k: CommonCrawlTier) => { setTier(k); manual.current = true; };
  return (
    <SceneShell
      id="ws-node-2" index={2} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setTier(tierKeys[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Callout label={ws.calloutCCLabel} title={ws.calloutCCTitle}>{ws.calloutCCBody}</Callout>}
      controls={
        <ControlRow>
          {ws.n2seg.map((lab, i) => (
            <Toggle key={i} on={tier === tierKeys[i]} onClick={() => pick(tierKeys[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={`${n.readoutTitle} · ${tier.toUpperCase()}`} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${m.transferTiB} TiB`, hi: true },
          { k: n.rows[1], v: `${m.unpackedTiB} TiB` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTreemap(el, { tier, reduce })} deps={[tier, reduce]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const ws = useWS();
  const n = ws.nodes[2];
  const [parserIdx, setParserIdx] = useState(0);
  const b = parserBench(PARSERS[parserIdx]);
  const manual = useRef(false);
  const pick = (i: number) => { setParserIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="ws-node-3" index={3} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setParserIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[parserIdx]}
      controls={
        <ControlRow>
          {ws.n3parsers.map((lab, i) => (
            <Toggle key={i} on={parserIdx === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={`${n.readoutTitle} · ${ws.n3parsers[parserIdx]}`} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${b.inKB} KB html` },
          { k: n.rows[1], v: `${b.outKB} KB`, hi: true },
          { k: n.rows[2], v: `${b.droppedPct}%` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawFlow(el, { parserIdx, reduce })} deps={[parserIdx, reduce]} />}
    </SceneShell>
  );
}

function Node4({ reduce }: { reduce: boolean }) {
  const ws = useWS();
  const n = ws.nodes[3];
  const sendAgents = ["GPTBot", "ClaudeBot", "OAI-SearchBot"];
  const [agentName, setAgentName] = useState("GPTBot");
  const agent = AGENTS.find((a) => a.name === agentName) ?? AGENTS[0];
  const dec = robotsDecision(DEFAULT_ROBOTS, agent.name, "/article/news-10492");
  const agentIdx = sendAgents.indexOf(agentName);
  const manual = useRef(false);
  const pick = (name: string) => { setAgentName(name); manual.current = true; };
  return (
    <SceneShell
      id="ws-node-4" index={4} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setAgentName(sendAgents[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[agentIdx]}
      aside={<Callout label={ws.calloutLawLabel} title={ws.calloutLawTitle}>{ws.calloutLawBody}</Callout>}
      controls={
        <>
          <ControlRow>
            {sendAgents.map((name) => (
              <Toggle key={name} on={agentName === name} onClick={() => pick(name)}>{ws.n4send} {name}</Toggle>
            ))}
          </ControlRow>
          {/* the site's robots.txt — read-only reference */}
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{ws.n4robotsLabel}</div>
          <pre style={{ margin: 0, fontFamily: MONO, fontSize: 12, lineHeight: 1.55, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg)", overflowX: "auto", whiteSpace: "pre-wrap" }}>{DEFAULT_ROBOTS}</pre>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: agent.name },
          { k: n.rows[1], v: agent.intent },
          { k: n.rows[2], v: `${dec.status} · ${dec.allowed ? "SERVED" : "BLOCKED"}`, hi: dec.allowed },
          { k: n.rows[3], v: dec.rule },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawGate(el, { agent: agent.name, intent: agent.intent, allowed: dec.allowed, status: dec.status, rule: dec.rule, reduce, servedLabel: "SERVED", blockedLabel: "BLOCKED", gateLabel: "MATCHED RULE" })} deps={[agentName, reduce]} />}
    </SceneShell>
  );
}

function Node5({ reduce }: { reduce: boolean }) {
  const ws = useWS();
  const n = ws.nodes[4];
  const [mode, setMode] = useState<"rag" | "retrain">("rag");
  const [headline, setHeadline] = useState(ws.n5headline);
  const tokens = estTokens(headline);
  const manual = useRef(false);
  const pick = (m: "rag" | "retrain") => { setMode(m); manual.current = true; };
  return (
    <SceneShell
      id="ws-node-5" index={5} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setMode(s === 0 ? "rag" : "retrain"); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[mode === "rag" ? 0 : 1]}
      controls={
        <>
          <label htmlFor="ws-headline" style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{ws.n5headlineLabel}</label>
          <input id="ws-headline" value={headline} onChange={(e) => setHeadline(e.target.value)}
            suppressHydrationWarning
            className="u-textarea"
            style={{ width: "100%", fontFamily: MONO, fontSize: 13.5, padding: "11px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }} />
          <ControlRow>
            <Toggle on={mode === "rag"} onClick={() => pick("rag")}>{ws.n5inject}</Toggle>
            <Toggle on={mode === "retrain"} onClick={() => pick("retrain")}>{ws.n5retrain}</Toggle>
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={
          mode === "rag"
            ? [
                { k: n.rows[0], v: "RAG_CONTEXT", hi: true },
                { k: n.rows[1], v: "0 changed" },
                { k: n.rows[2], v: `${tokens} added` },
                { k: n.rows[3], v: "120 ms" },
              ]
            : [
                { k: n.rows[0], v: "WEIGHT_UPDATE", hi: true },
                { k: n.rows[1], v: "405B rewritten" },
                { k: n.rows[2], v: "0 added" },
                { k: n.rows[3], v: "3 weeks" },
              ]
        } />
      }
    >
      {() => <RetrainCompare ws={ws} mode={mode} tokens={tokens} reduce={reduce} />}
    </SceneShell>
  );
}

function Node6({ reduce }: { reduce: boolean }) {
  const ws = useWS();
  const n = ws.nodes[5];
  const [payloadKey, setPayloadKey] = useState(ws.n6payloads[0].key);
  const [sanitiser, setSanitiser] = useState(false); // off by default: show the attack first
  const cpIdx = ws.n6payloads.findIndex((p) => p.key === payloadKey);
  const cp = ws.n6payloads[cpIdx] ?? ws.n6payloads[0];
  const manual = useRef(false);
  const pickPayload = (k: string) => { setPayloadKey(k); manual.current = true; };
  const toggleSan = () => { setSanitiser((v) => !v); manual.current = true; };
  return (
    <SceneShell
      id="ws-node-6" index={6} total={6} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={4} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => {
        if (!manual.current) {
          if (s < 3) { setPayloadKey(ws.n6payloads[s].key); setSanitiser(false); }
          else setSanitiser(true);
        }
        manual.current = false;
      }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[cpIdx < 0 ? 0 : cpIdx]}
      controls={
        <>
          <ControlRow>
            {ws.n6payloads.map((p) => (
              <Toggle key={p.key} on={payloadKey === p.key} onClick={() => pickPayload(p.key)}>{p.label}</Toggle>
            ))}
          </ControlRow>
          <Toggle on={sanitiser} onClick={toggleSan}>{ws.n6sanitiser}: {sanitiser ? "ON" : "OFF"}</Toggle>
        </>
      }
      readout={null}
    >
      {() => <InjectionPanels ws={ws} cp={cp} sanitiser={sanitiser} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function WebScale() {
  const { t, lang } = useAcademy();
  const ws = t.webScale;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{ws.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {ws.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{ws.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{ws.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 8 }}>
            {ws.pipeline.map((label, i) => (
              <a key={i} href={`#ws-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{ws.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{ws.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(ws.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{ws.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(ws.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {ws.prevRoadmap}</Link>
        <Link href="/stage/0/domain-sources" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{ws.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
