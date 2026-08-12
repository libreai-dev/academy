"use client";

/* ===========================================================================
   Data Pipeline · Part 1 — "From the whole internet to a recipe".

   A self-contained, additive article that RE-HOMES nine nodes from four source
   lessons (web-scale ingestion, domain sources, deduplication, data recipe)
   into one 4-station walk-through. It imports the pure per-node logic/data from
   app/lib/{webscale,domains,dedup,recipe}.ts (never duplicating an algorithm),
   and copies the d3 draw functions + inline helpers verbatim from the source
   components (they aren't exported there, and the originals stay untouched).

   All copy comes from t.dataPipeline (app/lib/copy/data-pipeline.ts); each node
   reads its control/diagram labels from its own `ui` bundle.
   =========================================================================== */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout } from "./webscale-kit";
import { PipelineMap, StationHeader } from "./pipeline-map";
import {
  CANDIDATES,
  computeYield,
  PAGE_LAYERS,
  type ByteKind,
  datasetTier,
  type CommonCrawlTier,
  PARSERS,
  parserBench,
  fmtInt,
} from "../lib/webscale";
import {
  type Recipe as DomRecipe,
  RECIPE_PRESETS as DOM_PRESETS,
  recipeMetrics,
  reReads,
  rebalance,
} from "../lib/domains";
import { funnel } from "../lib/dedup";
import {
  DOMAINS,
  RECIPE_PRESETS as RC_PRESETS,
  scoreMix,
  type Mix,
  type DomainKey,
  SEED_TEXT,
  TEXTBOOK_TEXT,
  type RewriteMode,
  type StreamKey,
  DEFAULT_RECIPE,
  type Recipe as RcRecipe,
  evalRecipe,
} from "../lib/recipe";

/* ======================================================================== *
 * Per-node UI label shapes. Each node's `ui` bundle (a flexible PipeUi with an
 * index signature) is cast to the exact shape its wrapper needs.
 * ======================================================================== */

interface Ui1 { slider: string; toggles: string[] }
interface Ui2 { segments: string[]; callout: { label: string; title: string; body: string } }
interface Ui3 { segments: string[] }
interface Ui4 {
  presets: string[]; domains: string[];
  callout: { label: string; title: string; body: string };
  theMix: string; reReads: string; overfit: string; safeLimit: string; reasoning: string;
  driftWarn: string; driftNote: string; overfitNote: string; okNote: string;
}
interface Ui6 { toggles: string[] }
interface Ui7 { presets: string[]; domains: string[]; natural: string; yours: string; driftWarn: string; driftNote: string }
interface Ui8 { segments: string[]; seedLabel: string; outLabel: string; paraphraseOut: string }
interface Ui9 { streams: string[]; rawLabel: string; finalLabel: string }

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Copied verbatim from the source components; the only edits are the `ui`
 * parameter types on drawRecipe (was DomUi) so this file owns its label shape.
 * ======================================================================== */

/* --- web-scale N2/N3: shared byte-kind palette (from WebScale.tsx) ------- */
const KIND_FILL: Record<ByteKind, string> = {
  transport: "var(--tok-space)",
  code: "var(--tok-num)",
  markup: "var(--tok-sub)",
  nav: "var(--tok-byte)",
  prose: "var(--signal)",
};

/* --- GATHER 1 (web-scale N1): the authority field ----------------------- */
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
  const rOf = (a: number) => maxR * Math.sqrt(Math.max(0, 1 - a / 100));

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
  svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 2.5).style("fill", "var(--fg)");
}

/* --- GATHER 2 (web-scale N2): the byte treemap -------------------------- */
function drawTreemap(
  el: SVGSVGElement,
  o: { tier: CommonCrawlTier; reduce: boolean },
) {
  const W = 760;
  const H = 420;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

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

/* --- EXTRACT 1 (web-scale N3): page → parser → clean text → .bin -------- */
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
  const k = barH / inKB;
  const bw = 74;

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

  const parserX = 250;
  const parserW = 96;
  svg.append("rect").attr("x", lx + bw).attr("y", greenY).attr("width", parserX - (lx + bw)).attr("height", greenH).style("fill", "var(--signal)").style("fill-opacity", 0.9);
  svg.append("rect").attr("x", parserX).attr("y", greenMid - 34).attr("width", parserW).attr("height", 68).attr("rx", 10).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", parserX + parserW / 2).attr("y", greenMid - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", "0.08em").text("PARSER");
  svg.append("text").attr("x", parserX + parserW / 2).attr("y", greenMid + 12).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(p.label);

  const bx = parserX + parserW + 30;
  svg.append("rect").attr("x", parserX + parserW).attr("y", greenY).attr("width", bx - (parserX + parserW)).attr("height", greenH).style("fill", "var(--signal)").style("fill-opacity", 0.9);
  svg.append("rect").attr("x", bx).attr("y", greenY).attr("width", 96).attr("height", greenH).attr("rx", 6).style("fill", "var(--signal)");
  if (p.leaksJunk) svg.append("rect").attr("x", bx).attr("y", greenY).attr("width", 96).attr("height", Math.min(greenH, 12)).attr("rx", 6).style("fill", "var(--tok-byte)").style("fill-opacity", 0.6);
  svg.append("text").attr("x", bx + 48).attr("y", greenMid + 5).attr("text-anchor", "middle").style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "13px").style("font-weight", "700").text(`${outKB} KB`);
  svg.append("text").attr("x", bx + 48).attr("y", greenY - 10).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text("clean text → tokens");

  const gx = bx + 130;
  svg.append("line").attr("x1", bx + 96).attr("y1", greenMid).attr("x2", gx).attr("y2", greenMid).style("stroke", "var(--fg)").style("stroke-width", 2);
  const gh = Math.max(44, greenH + 12);
  svg.append("rect").attr("x", gx).attr("y", greenMid - gh / 2).attr("width", 150).attr("height", gh).attr("rx", 8).style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", gx + 75).attr("y", greenMid - 3).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").text(".bin on disk");
  svg.append("text").attr("x", gx + 75).attr("y", greenMid + 16).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text("streams to GPU");
}

/* --- EXTRACT 2 (domains N1): the mix, its re-reads, and the reasoning --- */
type Svg = d3.Selection<SVGSVGElement, unknown, null, undefined>;

/** A 45° cross-hatch fill for "danger / quarantine" zones (from Domains.tsx). */
function addHatch(svg: Svg, id: string, color: string): string {
  const p = svg.append("defs").append("pattern").attr("id", id)
    .attr("patternUnits", "userSpaceOnUse").attr("width", 7).attr("height", 7).attr("patternTransform", "rotate(45)");
  p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 7).style("stroke", color).style("stroke-width", 2.2);
  return `url(#${id})`;
}

const DOMAIN_COLORS = ["var(--tok-space)", "var(--tok-num)", "var(--tok-sub)", "var(--tok-punct)"];
const DOMAIN_KEYS: (keyof DomRecipe)[] = ["web", "code", "math", "books"];

interface RecipeDiagUi { theMix: string; reReads: string; overfit: string; safeLimit: string; reasoning: string; driftWarn: string }

function drawRecipe(el: SVGSVGElement, o: { recipe: DomRecipe; m: ReturnType<typeof recipeMetrics>; reduce: boolean; domains: string[]; ui: RecipeDiagUi }) {
  const W = 760, H = 322;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const hatch = addHatch(svg, "dp-d1-hatch", "var(--tok-byte)");
  const shares = DOMAIN_KEYS.map((k) => o.recipe[k]);
  const rr = reReads(o.recipe);

  svg.append("text").attr("x", 20).attr("y", 16).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.ui.theMix);
  let x = 20;
  const barW = 720;
  shares.forEach((s, i) => {
    const w = s * barW;
    svg.append("rect").attr("x", x).attr("y", 26).attr("width", Math.max(0, w - 2)).attr("height", 34).attr("rx", 4).style("fill", DOMAIN_COLORS[i]).style("fill-opacity", 0.9);
    x += w;
  });
  shares.forEach((s, i) => {
    const lx = 20 + i * 182;
    svg.append("rect").attr("x", lx).attr("y", 74).attr("width", 11).attr("height", 11).attr("rx", 2).style("fill", DOMAIN_COLORS[i]);
    svg.append("text").attr("x", lx + 17).attr("y", 84).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(`${o.domains[i]} ${Math.round(s * 100)}%`);
  });

  svg.append("text").attr("x", 20).attr("y", 100).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.ui.reReads);
  const tx0 = 120, tW = 470, limitX = tx0 + (1.2 / 2) * tW;
  const rows: [string, number, string][] = [[o.domains[1], rr.code, "code"], [o.domains[2], rr.math, "math"], [o.domains[3], rr.books, "books"]];
  rows.forEach(([name, v], i) => {
    const cy = 122 + i * 34;
    svg.append("text").attr("x", 20).attr("y", cy + 4).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(name);
    svg.append("rect").attr("x", tx0).attr("y", cy - 8).attr("width", tW).attr("height", 16).attr("rx", 8).style("fill", "var(--surface)").style("stroke", "var(--hair)");
    const over = v > 1.2;
    const fw = Math.min(v / 2, 1) * tW;
    const bar = svg.append("rect").attr("y", cy - 8).attr("x", tx0).attr("height", 16).attr("rx", 8).style("fill", over ? hatch : "var(--signal)").style("stroke", over ? "var(--tok-byte)" : "none").style("stroke-width", 1.5);
    if (o.reduce) bar.attr("width", fw); else bar.attr("width", 0).transition().duration(420).attr("width", fw);
    svg.append("text").attr("x", tx0 + tW + 12).attr("y", cy + 4).style("fill", over ? "var(--tok-byte)" : "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(`${v.toFixed(1)}×${over ? " " + o.ui.overfit : ""}`);
  });
  svg.append("line").attr("x1", limitX).attr("y1", 108).attr("x2", limitX).attr("y2", 212).style("stroke", "var(--muted)").style("stroke-width", 1).style("stroke-dasharray", "3 3");
  svg.append("text").attr("x", limitX).attr("y", 226).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.ui.safeLimit);

  svg.append("text").attr("x", 20).attr("y", 258).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(`${o.ui.reasoning}  ${o.m.reasoning}/100`);
  svg.append("rect").attr("x", 20).attr("y", 268).attr("width", barW).attr("height", 14).attr("rx", 7).style("fill", "var(--surface)").style("stroke", "var(--hair)");
  const rw = (o.m.reasoning / 100) * barW;
  const rbar = svg.append("rect").attr("x", 20).attr("y", 268).attr("height", 14).attr("rx", 7).style("fill", o.m.reasoning >= 85 ? "var(--signal)" : "var(--muted)");
  if (o.reduce) rbar.attr("width", rw); else rbar.attr("width", 0).transition().duration(420).attr("width", rw);
  if (o.m.drift) svg.append("text").attr("x", 20).attr("y", 306).style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(`⚠ ${o.ui.driftWarn}`);
}

/* --- DEDUP 1 (dedup N1): the memorization gate -------------------------- */
function drawMemoGate(el: SVGSVGElement, o: { step: number; strength: number; reduce: boolean }) {
  const W = 760;
  const H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 460;
  const gated = o.step >= 1;

  const docs = [
    { y: 40, dup: false },
    { y: 92, dup: true },
    { y: 144, dup: true },
    { y: 196, dup: false },
    { y: 248, dup: true },
    { y: 300, dup: false },
  ];
  const gateX = 340;
  const docX = 44;
  const docW = 150;

  svg.append("rect").attr("x", gateX).attr("y", 24).attr("width", 16).attr("height", H - 48).attr("rx", 8)
    .style("fill", gated ? "var(--signal)" : "var(--border)")
    .style("opacity", gated ? 1 : 0.5);
  svg.append("text").attr("x", gateX + 8).attr("y", 16).attr("text-anchor", "middle")
    .style("fill", gated ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "10.5px")
    .text(gated ? "DEDUP GATE" : "NO GATE");

  docs.forEach((d) => {
    const dropped = gated && d.dup;
    const col = d.dup ? "var(--tok-byte)" : "var(--signal)";
    const g = svg.append("g");
    g.append("rect").attr("x", docX).attr("y", d.y).attr("width", docW).attr("height", 36).attr("rx", 6)
      .style("fill", "none").style("stroke", col).style("stroke-width", 1.6)
      .style("stroke-dasharray", d.dup ? "4 3" : "none")
      .style("opacity", dropped ? 0.28 : 1);
    for (let r = 0; r < 3; r++) {
      g.append("rect").attr("x", docX + 10).attr("y", d.y + 8 + r * 8).attr("width", docW - 20 - (r === 2 ? 60 : 0)).attr("height", 3).attr("rx", 1.5)
        .style("fill", col).style("opacity", dropped ? 0.2 : 0.55);
    }
    g.append("text").attr("x", docX + docW + 8).attr("y", d.y + 23).style("fill", col).style("font-family", MONO).style("font-size", "10px")
      .style("opacity", dropped ? 0.5 : 0.9).text(d.dup ? (dropped ? "DROPPED" : "COPY") : "UNIQUE");

    if (!dropped) {
      const line = svg.append("line").attr("x1", docX + docW + 44).attr("y1", d.y + 18).attr("y2", d.y + 18)
        .style("stroke", col).style("stroke-width", 1.5).style("opacity", 0.6);
      line.attr("x2", docX + docW + 44);
      if (dur) line.transition().duration(dur).attr("x2", gateX); else line.attr("x2", gateX);
    } else {
      svg.append("line").attr("x1", docX + docW + 44).attr("y1", d.y + 18).attr("x2", gateX - 10).attr("y2", d.y + 18)
        .style("stroke", col).style("stroke-width", 1.5).style("stroke-dasharray", "3 3").style("opacity", 0.35);
      svg.append("text").attr("x", gateX - 4).attr("y", d.y + 22).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-size", "13px").style("font-family", MONO).text("✕");
    }
  });

  const inX = gateX + 90;
  const outX = W - 70;
  const nodeYs = [70, 140, 210, 280];
  const rigid = !gated;
  nodeYs.forEach((y1) => {
    nodeYs.forEach((y2, j) => {
      const keep = rigid ? true : (Math.abs(nodeYs.indexOf(y1) - j) <= 1);
      if (!keep) return;
      const link = svg.append("line").attr("x1", inX).attr("y1", y1).attr("x2", inX).attr("y2", y1)
        .style("stroke", rigid ? "var(--tok-byte)" : "var(--signal)")
        .style("stroke-width", rigid ? 2.6 : 1.2)
        .style("opacity", rigid ? 0.5 : 0.7);
      if (dur) link.transition().duration(dur).attr("x2", outX).attr("y2", y2);
      else link.attr("x2", outX).attr("y2", y2);
    });
  });
  nodeYs.forEach((y) => {
    svg.append("circle").attr("cx", inX).attr("cy", y).attr("r", 7).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.6);
    svg.append("circle").attr("cx", outX).attr("cy", y).attr("r", 7).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.6);
  });
  svg.append("text").attr("x", (inX + outX) / 2).attr("y", H - 8).attr("text-anchor", "middle")
    .style("fill", rigid ? "var(--tok-byte)" : "var(--signal-fg)").style("font-family", MONO).style("font-size", "11px")
    .text(rigid ? "OVERFIT · memorised paths" : "BALANCED · general graph");
}

/* --- DEDUP 2 (dedup N5): the funnel + density gauge --------------------- */
function drawFunnel(el: SVGSVGElement, o: { enabled: [boolean, boolean, boolean]; reduce: boolean }) {
  const W = 760;
  const H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  const labels = ["RAW 1 PB", "EXACT", "FUZZY LSH", "SEMDEDUP"];
  const removeFrac = [0.15, 0.2, 0.1];
  let vol = 1000;
  const vols = [1000];
  removeFrac.forEach((f, i) => {
    if (o.enabled[i]) vol *= 1 - f;
    vols.push(vol);
  });

  const cx = 250;
  const maxW = 420;
  const top = 36;
  const rowH = 66;
  vols.forEach((v, i) => {
    const w = (v / 1000) * maxW;
    const y = top + i * rowH;
    const enabledStage = i === 0 || o.enabled[i - 1];
    const bar = svg.append("rect").attr("x", cx - w / 2).attr("y", y).attr("width", w).attr("height", 44).attr("rx", 6)
      .style("fill", i === 0 ? "var(--border)" : enabledStage ? "var(--signal)" : "var(--surface)")
      .style("fill-opacity", i === 0 ? 0.5 : enabledStage ? 0.85 - i * 0.06 : 0.4)
      .style("stroke", "var(--border)").style("stroke-width", 1);
    if (dur && i > 0) {
      bar.attr("x", cx).attr("width", 0).transition().duration(dur).attr("x", cx - w / 2).attr("width", w);
    }
    svg.append("text").attr("x", cx).attr("y", y + 27).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "11.5px")
      .text(`${labels[i]}  ·  ${Math.round(v)} TB`);
    if (i > 0 && !o.enabled[i - 1]) {
      svg.append("text").attr("x", cx + maxW / 2 + 14).attr("y", y + 27).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10px").text("off");
    }
  });

  const res = funnel(o.enabled);
  const gx = W - 66;
  const gTop = top;
  const gH = rowH * 3 + 44;
  svg.append("rect").attr("x", gx).attr("y", gTop).attr("width", 26).attr("height", gH).attr("rx", 8).style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
  const fillH = (res.density / 100) * gH;
  const fill = svg.append("rect").attr("x", gx).attr("width", 26).attr("rx", 8)
    .style("fill", res.density >= 85 ? "var(--signal)" : "var(--tok-num)");
  if (dur) fill.attr("y", gTop + gH).attr("height", 0).transition().duration(dur).attr("y", gTop + gH - fillH).attr("height", fillH);
  else fill.attr("y", gTop + gH - fillH).attr("height", fillH);
  svg.append("text").attr("x", gx + 13).attr("y", gTop - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "9.5px").text("DENSITY");
  svg.append("text").attr("x", gx + 13).attr("y", gTop + gH + 18).attr("text-anchor", "middle").style("fill", res.density >= 85 ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(res.density.toFixed(0));
}

/* --- RECIPE shared: a labelled horizontal stacked share-bar (Recipe.tsx) - */
const DOMAIN_FILL: Record<string, string> = {
  web: "var(--tok-space)",
  code: "var(--tok-num)",
  math: "var(--tok-sub)",
  books: "var(--tok-word)",
  synth: "var(--signal)",
};
const DOMAIN_INK: Record<string, string> = { synth: "#0a0a09" };

function normalize<T extends string>(mix: Record<T, number>, keys: T[]): Record<T, number> {
  const s = keys.reduce((a, k) => a + Math.max(0, mix[k]), 0) || 1;
  const out = {} as Record<T, number>;
  keys.forEach((k) => (out[k] = (Math.max(0, mix[k]) / s) * 100));
  return out;
}

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

/* --- RECIPE 1 (recipe N1): natural vs your recipe ----------------------- */
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

/* --- RECIPE 3 (recipe N6): raw web vs frontier recipe (5 streams) -------- */
function drawFinal(el: SVGSVGElement, o: { raw: RcRecipe; yours: RcRecipe; labels: Record<string, string>; rawLabel: string; finalLabel: string; rawBench: number; yourBench: number; reduce: boolean }) {
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
 * Shared component helpers.
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

function useDP() {
  const { t, lang } = useAcademy();
  return { cp: t.dataPipeline, lang };
}

function navLabels(lang: string) {
  return {
    labelPrev: lang === "es" ? "Paso anterior" : "Previous step",
    labelNext: lang === "es" ? "Paso siguiente" : "Next step",
  };
}

function pctOf(mix: Mix, k: DomainKey): number {
  const s = mix.web + mix.code + mix.math + mix.books || 1;
  return (Math.max(0, mix[k]) / s) * 100;
}

/** RECIPE 2 (recipe N4): the messy seed beside the generated textbook. */
function SynthPanels({ seedLabel, outLabel, paraphraseOut, mode }: { seedLabel: string; outLabel: string; paraphraseOut: string; mode: RewriteMode }) {
  const panel = (label: string, tone: "neutral" | "ok", body: string) => (
    <div style={{ border: `1px solid ${tone === "ok" ? "var(--signal)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: tone === "ok" ? "var(--signal-fg)" : "var(--muted)", padding: "9px 12px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>{label}</div>
      <pre style={{ margin: 0, padding: "12px 13px", fontFamily: MONO, fontSize: 12, lineHeight: 1.55, color: "var(--fg)", whiteSpace: "pre-wrap", minHeight: 200 }}>{body}</pre>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 12 }}>
      {panel(seedLabel, "neutral", SEED_TEXT)}
      {panel(outLabel, "ok", mode === "textbook" ? TEXTBOOK_TEXT : paraphraseOut)}
    </div>
  );
}

/* ======================================================================== *
 * Node components — one per re-homed source node, reading t.dataPipeline.
 * ======================================================================== */

/* -------- GATHER -------- */

function Node1({ reduce }: { reduce: boolean }) {
  const { cp, lang } = useDP();
  const n = cp.nodes[0];
  const ui = n.ui as unknown as Ui1;
  const [threshold, setThreshold] = useState(55);
  const [tiers, setTiers] = useState([true, true, true, false]);
  const [lastTier, setLastTier] = useState(-1);
  const y = computeYield(threshold, tiers);
  const note = lastTier >= 0 ? n.optionNotes?.[lastTier] : n.sliderNote;
  return (
    <SceneShell
      id="dp-node-1" index={1} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={n.steps} captions={n.captions} hint={n.hint} reduce={reduce}
      {...navLabels(lang)} note={note}
      controls={
        <>
          <Slider id="dp-min-auth" label={ui.slider} value={threshold} display={String(threshold)} min={0} max={100} onChange={(v) => { setThreshold(v); setLastTier(-1); }} />
          <ControlRow>
            {ui.toggles.map((name, i) => (
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
  const { cp, lang } = useDP();
  const n = cp.nodes[1];
  const ui = n.ui as unknown as Ui2;
  const tierKeys: CommonCrawlTier[] = ["warc", "wat", "wet"];
  const [tier, setTier] = useState<CommonCrawlTier>("warc");
  const m = datasetTier(tier);
  const idx = tierKeys.indexOf(tier);
  const manual = useRef(false);
  const pick = (k: CommonCrawlTier) => { setTier(k); manual.current = true; };
  return (
    <SceneShell
      id="dp-node-2" index={2} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setTier(tierKeys[s]); manual.current = false; }}
      {...navLabels(lang)} note={n.optionNotes?.[idx]}
      aside={<Callout label={ui.callout.label} title={ui.callout.title}>{ui.callout.body}</Callout>}
      controls={
        <ControlRow>
          {ui.segments.map((lab, i) => (
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

/* -------- EXTRACT -------- */

function Node3({ reduce }: { reduce: boolean }) {
  const { cp, lang } = useDP();
  const n = cp.nodes[2];
  const ui = n.ui as unknown as Ui3;
  const [parserIdx, setParserIdx] = useState(0);
  const b = parserBench(PARSERS[parserIdx]);
  const manual = useRef(false);
  const pick = (i: number) => { setParserIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="dp-node-3" index={3} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setParserIdx(s); manual.current = false; }}
      {...navLabels(lang)} note={n.optionNotes?.[parserIdx]}
      controls={
        <ControlRow>
          {ui.segments.map((lab, i) => (
            <Toggle key={i} on={parserIdx === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={`${n.readoutTitle} · ${ui.segments[parserIdx]}`} note={n.readoutNote} rows={[
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
  const { cp, lang } = useDP();
  const n = cp.nodes[3];
  const ui = n.ui as unknown as Ui4;
  const [recipe, setRecipe] = useState<DomRecipe>(DOM_PRESETS[1]);
  const [presetIdx, setPresetIdx] = useState(1);
  const manual = useRef(false);
  const m = recipeMetrics(recipe);
  const rr = reReads(recipe);
  const worst = rr.math >= rr.code && rr.math >= rr.books ? [ui.domains[2], rr.math] as const : rr.code >= rr.books ? [ui.domains[1], rr.code] as const : [ui.domains[3], rr.books] as const;
  const note = m.drift
    ? ui.driftNote.replace("{web}", String(Math.round(recipe.web * 100)))
    : m.overfit
      ? ui.overfitNote.replace("{name}", worst[0]).replace("{x}", worst[1].toFixed(1))
      : ui.okNote;
  const pickPreset = (i: number) => { setRecipe(DOM_PRESETS[i]); setPresetIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="dp-node-4" index={4} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={DOM_PRESETS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      {...navLabels(lang)}
      onStep={(s) => { if (!manual.current) { setRecipe(DOM_PRESETS[s]); setPresetIdx(s); } manual.current = false; }}
      aside={<Callout label={ui.callout.label} title={ui.callout.title}>{rich(ui.callout.body)}</Callout>}
      note={note}
      controls={
        <>
          <ControlRow>
            {ui.presets.map((lab, i) => (
              <Toggle key={i} on={presetIdx === i} onClick={() => pickPreset(i)}>{lab}</Toggle>
            ))}
          </ControlRow>
          {DOMAIN_KEYS.map((k, i) => (
            <Slider key={k} id={`dp-mix-${k}`} label={ui.domains[i]} value={Math.round(recipe[k] * 100)} display={`${Math.round(recipe[k] * 100)}%`} min={0} max={100}
              onChange={(v) => { setRecipe((r) => rebalance(r, k, v / 100)); setPresetIdx(-1); manual.current = true; }} />
          ))}
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawRecipe(el, { recipe, m, reduce, domains: ui.domains, ui: { theMix: ui.theMix, reReads: ui.reReads, overfit: ui.overfit, safeLimit: ui.safeLimit, reasoning: ui.reasoning, driftWarn: ui.driftWarn } })} deps={[recipe, reduce]} />}
    </SceneShell>
  );
}

/* -------- DEDUPLICATE -------- */

function Node5({ reduce }: { reduce: boolean }) {
  const { cp, lang } = useDP();
  const n = cp.nodes[4];
  return (
    <SceneShell
      id="dp-node-5" index={5} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} captions={n.captions} hint={n.hint} reduce={reduce}
      {...navLabels(lang)}
      controls={null}
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawMemoGate(el, { step, strength: 62, reduce })} deps={[step, reduce]} />}
    </SceneShell>
  );
}

function Node6({ reduce }: { reduce: boolean }) {
  const { cp, lang } = useDP();
  const n = cp.nodes[5];
  const ui = n.ui as unknown as Ui6;
  const [enabled, setEnabled] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const manual = useRef(false);
  const set = (idx: number) => { setEnabled((p) => { const q = [...p] as [boolean, boolean, boolean]; q[idx] = !q[idx]; return q; }); manual.current = true; };
  return (
    <SceneShell
      id="dp-node-6" index={6} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={4} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setEnabled([s >= 1, s >= 2, s >= 3]); manual.current = false; }}
      {...navLabels(lang)}
      controls={
        <ControlRow>
          {ui.toggles.map((label, i) => (
            <Toggle key={i} on={enabled[i]} onClick={() => set(i)}>{label}: {enabled[i] ? "ON" : "OFF"}</Toggle>
          ))}
        </ControlRow>
      }
      note={
        <span style={{ display: "grid", gap: 5 }}>
          {(n.optionNotes ?? []).map((txt, i) => (
            <span key={i} style={{ display: "block", opacity: enabled[i] ? 1 : 0.55 }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: enabled[i] ? "var(--signal-fg)" : "var(--muted)" }}>{enabled[i] ? "ON " : "OFF"}</span>{" · "}{txt}
            </span>
          ))}
        </span>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawFunnel(el, { enabled, reduce })} deps={[enabled, reduce]} />}
    </SceneShell>
  );
}

/* -------- THE RECIPE -------- */

function Node7({ reduce }: { reduce: boolean }) {
  const { cp, lang } = useDP();
  const n = cp.nodes[6];
  const ui = n.ui as unknown as Ui7;
  const [mix, setMix] = useState<Mix>({ ...RC_PRESETS[1].mix });
  const [lastPreset, setLastPreset] = useState(1);
  const norm: Mix = { web: pctOf(mix, "web"), code: pctOf(mix, "code"), math: pctOf(mix, "math"), books: pctOf(mix, "books") };
  const sc = scoreMix(norm);
  const domLabels: Record<string, string> = { web: ui.domains[0], code: ui.domains[1], math: ui.domains[2], books: ui.domains[3] };
  const keys: DomainKey[] = ["web", "code", "math", "books"];
  const note = sc.drift ? rich(ui.driftNote) : lastPreset >= 0 ? n.optionNotes?.[lastPreset] : rich(n.sliderNote ?? "");
  const setShare = (k: DomainKey, v: number) => { setMix((p) => ({ ...p, [k]: v })); setLastPreset(-1); };
  return (
    <SceneShell
      id="dp-node-7" index={7} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      {...navLabels(lang)} note={note}
      controls={
        <>
          <ControlRow>
            {ui.presets.map((label, i) => (
              <Toggle key={i} on={lastPreset === i} onClick={() => { setMix({ ...RC_PRESETS[i].mix }); setLastPreset(i); }}>{label}</Toggle>
            ))}
          </ControlRow>
          {keys.map((k, i) => (
            <Slider key={k} id={`dp-share-${k}`} label={ui.domains[i]} value={Math.round(mix[k])} display={`${Math.round(norm[k])}%`} min={0} max={100} onChange={(v) => setShare(k, v)} />
          ))}
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawMix(el, { natural: { web: DOMAINS[0].natural, code: DOMAINS[1].natural, math: DOMAINS[2].natural, books: DOMAINS[3].natural }, yours: norm, labels: domLabels, naturalLabel: ui.natural, yoursLabel: ui.yours, drift: sc.drift, driftWarn: ui.driftWarn, reduce })} deps={[mix, reduce]} />}
    </SceneShell>
  );
}

function Node8({ reduce }: { reduce: boolean }) {
  const { cp, lang } = useDP();
  const n = cp.nodes[7];
  const ui = n.ui as unknown as Ui8;
  const modes: RewriteMode[] = ["paraphrase", "textbook"];
  const [mode, setMode] = useState<RewriteMode>("paraphrase");
  const idx = modes.indexOf(mode);
  const manual = useRef(false);
  const pick = (m: RewriteMode) => { setMode(m); manual.current = true; };
  return (
    <SceneShell
      id="dp-node-8" index={8} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setMode(modes[s]); manual.current = false; }}
      {...navLabels(lang)} note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {ui.segments.map((label, i) => (
            <Toggle key={i} on={mode === modes[i]} onClick={() => pick(modes[i])}>{label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <SynthPanels seedLabel={ui.seedLabel} outLabel={ui.outLabel} paraphraseOut={ui.paraphraseOut} mode={mode} />}
    </SceneShell>
  );
}

function Node9({ reduce }: { reduce: boolean }) {
  const { cp, lang } = useDP();
  const n = cp.nodes[8];
  const ui = n.ui as unknown as Ui9;
  const [recipe, setRecipe] = useState<RcRecipe>({ ...DEFAULT_RECIPE });
  const keys: StreamKey[] = ["web", "code", "math", "synth", "books"];
  const norm = normalize(recipe, keys);
  const res = evalRecipe(norm);
  const raw: RcRecipe = { web: 82, code: 9, math: 2, synth: 0, books: 7 };
  const rawRes = evalRecipe(raw);
  const labels: Record<string, string> = { web: ui.streams[0], code: ui.streams[1], math: ui.streams[2], synth: ui.streams[3], books: ui.streams[4] };
  const setShare = (k: StreamKey, v: number) => setRecipe((p) => ({ ...p, [k]: v }));
  return (
    <SceneShell
      id="dp-node-9" index={9} total={9} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      {...navLabels(lang)} note={n.sliderNote ? rich(n.sliderNote) : undefined}
      controls={
        <>
          {keys.map((k, i) => (
            <Slider key={k} id={`dp-final-${k}`} label={ui.streams[i]} value={Math.round(recipe[k])} display={`${Math.round(norm[k])}%`} min={0} max={100} onChange={(v) => setShare(k, v)} />
          ))}
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawFinal(el, { raw, yours: recipe, labels, rawLabel: ui.rawLabel, finalLabel: ui.finalLabel, rawBench: rawRes.benchmark, yourBench: res.benchmark, reduce })} deps={[recipe, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The article
 * ======================================================================== */

export default function DataPipeline() {
  const { t, lang } = useAcademy();
  const cp = t.dataPipeline;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);
  const stationLabel = lang === "es" ? "ESTACIÓN" : "STATION";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero + station map ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{cp.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {cp.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{cp.lede}</p>
        <PipelineMap stations={cp.stations} mapLabel={cp.mapLabel} />
      </div>

      {/* ---- Stations + nodes ---- */}
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(40px, 6vw, 80px)", marginTop: "clamp(40px, 6vw, 80px)" }}>
        <StationHeader stations={cp.stations} activeKey="gather" stationLabel={stationLabel} />
        <Node1 reduce={reduce} />
        <Node2 reduce={reduce} />
        <StationHeader stations={cp.stations} activeKey="extract" stationLabel={stationLabel} />
        <Node3 reduce={reduce} />
        <Node4 reduce={reduce} />
        <StationHeader stations={cp.stations} activeKey="dedup" stationLabel={stationLabel} />
        <Node5 reduce={reduce} />
        <Node6 reduce={reduce} />
        <StationHeader stations={cp.stations} activeKey="recipe" stationLabel={stationLabel} />
        <Node7 reduce={reduce} />
        <Node8 reduce={reduce} />
        <Node9 reduce={reduce} />
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{cp.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{cp.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(cp.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{cp.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(cp.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href={cp.prevHref} className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {cp.prevLabel}</Link>
        <Link href={cp.nextHref} className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{cp.nextLabel} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
