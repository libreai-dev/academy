"use client";

/* ===========================================================================
   Data Pipeline · Part 2 — "Inside the data pipeline".

   A self-contained, additive article: 12 nodes re-homed (not rewritten) from
   four Stage-0 lessons — web-scale ingestion, domain sources, deduplication and
   data recipe — organised under the shared 4-station backbone (gather → extract
   → dedup → recipe). Every `draw*` function, interactive and helper is COPIED
   verbatim from the source component and adapted only to read its labels from
   the node's own `ui` bundle (app/lib/copy/data-pipeline-deep.ts); the original
   lessons are left byte-for-byte unchanged so this feature is reversible by
   deleting this file, its copy module and its route. The one new drawing is the
   LSH S-curve (drawSCurve), folded into the near-duplicates node.
   =========================================================================== */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import { PipelineMap, StationHeader } from "./pipeline-map";
import { AGENTS, DEFAULT_ROBOTS, robotsDecision, RETRAIN_MS, estTokens } from "../lib/webscale";
import {
  computePack,
  FILE_SEP,
  auditRepo,
  type LicenseAudit,
  type PackResult,
  REPO_ROOT_LICENSE,
  NAIVE_SCRAMBLE,
  RESTORED_LATEX,
} from "../lib/domains";
import { type ExactMode, signatureCells, DOC_A, DOC_B, EMBEDDINGS, semDedup, lshProbability, lshThreshold } from "../lib/dedup";
import { temperatureMix, NATURAL_FREQ, type DomainKey, lossCurve, SYNTH_DOCS, type Gate, auditDoc } from "../lib/recipe";
import type { PipePayload } from "../lib/copy/pipeline-shell";

/* ======================================================================== *
 * Local label shapes — narrow subsets of the source lessons' DomUi, so the
 * copied domain diagrams read exactly the labels they need from a node's `ui`.
 * ======================================================================== */
interface RepoLabels { keep: string; drop: string; wontParse: string; machineMade: string; packed: string }
interface LicenseLabels { quarantine: string; copyleft: string; permissive: string; safeToTrain: string; leaked: string }
interface PdfLabels { naive: string; vision: string; scrambled: string; cleanLatex: string }

type Svg = d3.Selection<SVGSVGElement, unknown, null, undefined>;

/** A 45° cross-hatch fill for "danger / quarantine" zones. (from Domains.tsx) */
function addHatch(svg: Svg, id: string, color: string): string {
  const p = svg.append("defs").append("pattern").attr("id", id)
    .attr("patternUnits", "userSpaceOnUse").attr("width", 7).attr("height", 7).attr("patternTransform", "rotate(45)");
  p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 7).style("stroke", color).style("stroke-width", 2.2);
  return `url(#${id})`;
}

/** Word-wrap a string into <tspan> lines under a mono text node. (from Domains.tsx) */
function wrapLines(g: d3.Selection<SVGGElement, unknown, null, undefined>, text: string, x: number, y: number, maxChars: number, lineH: number, fill: string, size = 11) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  const t = g.append("text").attr("x", x).attr("y", y).style("fill", fill).style("font-family", MONO).style("font-size", `${size}px`);
  lines.slice(0, 5).forEach((ln, i) => t.append("tspan").attr("x", x).attr("dy", i === 0 ? 0 : lineH).text(ln));
  return lines.length;
}

/* ======================================================================== *
 * GATHER — Node 1: robots.txt gate (from WebScale.tsx drawGate)
 * ======================================================================== */

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

/* ======================================================================== *
 * GATHER — Node 2: retrain-vs-retrieve bar (from WebScale.tsx drawRetrainBar)
 * ======================================================================== */

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
 * EXTRACT — Node 4: sort files then pack (from Domains.tsx drawRepo)
 * ======================================================================== */

const REPO_ORDER = ["main.py", "models.py", "utils.py", "vendor/bundle.min.js", "proto/schema_pb2.py", "broken.py"];

function shortName(path: string): string {
  const b = path.split("/").pop() ?? path;
  return b.length > 16 ? b.slice(0, 15) + "…" : b;
}

function drawRepo(el: SVGSVGElement, o: { step: number; pack: PackResult; reduce: boolean; ui: RepoLabels }) {
  const W = 760, H = 320;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const hatch = addHatch(svg, "dpd-d2-hatch", "var(--tok-byte)");
  const byPath = new Map(o.pack.files.map((f) => [f.file.path, f]));

  // Left: the six file cards with keep / drop stamps.
  const cw = 168, ch = 62;
  REPO_ORDER.forEach((path, i) => {
    const pf = byPath.get(path);
    if (!pf) return;
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const gx = 20 + col * 186, gy = 20 + row * 74;
    const dropped = pf.dropped !== null;
    const g = svg.append("g").attr("transform", `translate(${gx},${gy})`);
    g.append("rect").attr("width", cw).attr("height", ch).attr("rx", 8)
      .style("fill", dropped ? hatch : "var(--bg)").style("fill-opacity", dropped ? 0.5 : 1)
      .style("stroke", dropped ? "var(--tok-byte)" : "var(--signal)").style("stroke-width", 1.5);
    g.append("text").attr("x", 12).attr("y", 23).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").style("text-decoration", dropped ? "line-through" : "none").text(shortName(path));
    if (dropped) {
      const reason = pf.dropped === "syntax" ? o.ui.wontParse : o.ui.machineMade;
      g.append("text").attr("x", 12).attr("y", 45).style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(`✗ ${o.ui.drop} · ${reason}`);
    } else {
      g.append("text").attr("x", 12).attr("y", 45).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(`✓ ${o.ui.keep} · ${pf.file.kb} KB`);
    }
  });

  // Right: the packed stream (step 2).
  if (o.step >= 1) {
    const kept = o.pack.files.filter((f) => f.order >= 0).sort((a, b) => a.order - b.order);
    svg.append("text").attr("x", 470).attr("y", 16).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.ui.packed);
    svg.append("line").attr("x1", 470).attr("y1", 26).attr("x2", 470).attr("y2", 26 + kept.length * 62).style("stroke", "var(--signal)").style("stroke-width", 2);
    kept.forEach((pf, i) => {
      const gy = 30 + i * 62;
      const g = svg.append("g").attr("transform", `translate(482,${gy})`);
      g.append("text").attr("x", 0).attr("y", 10).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(FILE_SEP);
      g.append("rect").attr("x", 0).attr("y", 16).attr("width", 258).attr("height", 30).attr("rx", 7).style("fill", "var(--signal)").style("fill-opacity", 0.12).style("stroke", "var(--signal)");
      g.append("text").attr("x", 12).attr("y", 35).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(pf.file.path);
    });
  }
}

/* ======================================================================== *
 * EXTRACT — Node 5: quarantine copyleft (from Domains.tsx drawLicense)
 * ======================================================================== */

function drawLicense(el: SVGSVGElement, o: { step: number; audit: LicenseAudit; deepScan: boolean; reduce: boolean; ui: LicenseLabels }) {
  const W = 760, H = 400;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const hatch = addHatch(svg, "dpd-d3-hatch", "var(--tok-byte)");
  const leaked = o.step >= 1 && !o.deepScan && o.audit.leaked;

  // Repo container + root license.
  svg.append("rect").attr("x", 20).attr("y", 40).attr("width", 340).attr("height", 320).attr("rx", 12).style("fill", "none").style("stroke", leaked ? "var(--tok-byte)" : "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", 36).attr("y", 30).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(`repo/ · LICENSE: ${REPO_ROOT_LICENSE}`);

  // Quarantine bin (right).
  svg.append("rect").attr("x", 470).attr("y", 70).attr("width", 260).attr("height", 250).attr("rx", 12).style("fill", hatch).style("fill-opacity", 0.4).style("stroke", "var(--tok-byte)").style("stroke-width", 1.5);
  svg.append("text").attr("x", 600).attr("y", 60).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(o.ui.quarantine);

  let q = 0;
  o.audit.subtrees.forEach((s, i) => {
    const copyleft = s.sub.cls === "copyleft";
    const quarantined = o.step >= 1 && o.deepScan && copyleft;
    const bx = 40, by = 58 + i * 58;
    const tx = 490, ty = 92 + q * 56;
    const g = svg.append("g");
    if (quarantined) q += 1;
    const targetX = quarantined ? tx : bx, targetY = quarantined ? ty : by;
    if (o.reduce || !quarantined) g.attr("transform", `translate(${targetX},${targetY})`);
    else g.attr("transform", `translate(${bx},${by})`).transition().duration(500).attr("transform", `translate(${targetX},${targetY})`);
    const stroke = quarantined || (leaked && copyleft) ? "var(--tok-byte)" : copyleft ? "var(--tok-sub)" : "var(--signal)";
    g.append("rect").attr("width", 226).attr("height", 44).attr("rx", 8).style("fill", "var(--bg)").style("stroke", stroke).style("stroke-width", 1.5);
    g.append("text").attr("x", 12).attr("y", 19).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(s.sub.path);
    g.append("text").attr("x", 12).attr("y", 34).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${s.sub.license} · ${copyleft ? o.ui.copyleft : o.ui.permissive}`);
    g.append("circle").attr("cx", 212).attr("cy", 22).attr("r", 5).style("fill", stroke);
    if (o.step >= 1 && o.deepScan && !copyleft) g.append("text").attr("x", 234).attr("y", 26).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(`→ ${o.ui.safeToTrain}`);
  });

  if (leaked) {
    svg.append("rect").attr("x", 20).attr("y", 40).attr("width", 340).attr("height", 320).attr("rx", 12).style("fill", "var(--tok-byte)").style("fill-opacity", 0.06).style("stroke", "none");
    svg.append("text").attr("x", 190).attr("y", 384).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(`⚠ ${o.ui.leaked}`);
  }
}

/* ======================================================================== *
 * EXTRACT — Node 6: naive read vs vision model (from Domains.tsx drawPdf)
 * ======================================================================== */

function drawPdf(el: SVGSVGElement, o: { restored: boolean; reduce: boolean; ui: PdfLabels }) {
  const W = 760, H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const hatch = addHatch(svg, "dpd-d4-hatch", "var(--tok-byte)");

  // The two-column page.
  const pg = svg.append("g").attr("transform", "translate(30,96)");
  pg.append("rect").attr("width", 108).attr("height", 150).attr("rx", 5).style("fill", "var(--bg)").style("stroke", "var(--border)").style("stroke-width", 1.5);
  [10, 58].forEach((cx) => [18, 32, 46, 60, 74].forEach((ry) => pg.append("line").attr("x1", cx).attr("y1", ry).attr("x2", cx + 40).attr("y2", ry).style("stroke", "var(--muted)").style("stroke-width", 2).style("opacity", 0.45)));
  pg.append("text").attr("x", 54).attr("y", 116).attr("text-anchor", "middle").style("fill", "var(--tok-sub)").style("font-family", MONO).style("font-size", "16px").text("√ ∑ ∫");

  // arrow to the active output
  svg.append("line").attr("x1", 142).attr("y1", 171).attr("x2", 300).attr("y2", o.restored ? 250 : 92).style("stroke", o.restored ? "var(--signal)" : "var(--tok-byte)").style("stroke-width", 2.5);

  // Panel A — naive read (scrambled).
  const aActive = !o.restored;
  svg.append("rect").attr("x", 300).attr("y", 34).attr("width", 430).attr("height", 116).attr("rx", 10).style("fill", aActive ? hatch : "none").style("fill-opacity", aActive ? 0.5 : 1).style("stroke", aActive ? "var(--tok-byte)" : "var(--border)").style("stroke-width", 1.5).style("opacity", aActive ? 1 : 0.4);
  const ga = svg.append("g").style("opacity", aActive ? 1 : 0.4);
  ga.append("text").attr("x", 316).attr("y", 56).style("fill", aActive ? "var(--tok-byte)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.ui.naive);
  wrapLines(ga, NAIVE_SCRAMBLE, 316, 76, 52, 14, aActive ? "var(--tok-byte)" : "var(--muted)", 12);
  ga.append("text").attr("x", 316).attr("y", 140).style("fill", aActive ? "var(--tok-byte)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`✗ ${o.ui.scrambled}`);

  // Panel B — vision model (clean LaTeX).
  const bActive = o.restored;
  svg.append("rect").attr("x", 300).attr("y", 190).attr("width", 430).attr("height", 116).attr("rx", 10).style("fill", "var(--signal)").style("fill-opacity", bActive ? 0.1 : 0).style("stroke", bActive ? "var(--signal)" : "var(--border)").style("stroke-width", 1.5).style("opacity", bActive ? 1 : 0.4);
  const gb = svg.append("g").style("opacity", bActive ? 1 : 0.4);
  gb.append("text").attr("x", 316).attr("y", 212).style("fill", bActive ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.ui.vision);
  wrapLines(gb, RESTORED_LATEX, 316, 232, 52, 14, bActive ? "var(--fg)" : "var(--muted)", 12);
  gb.append("text").attr("x", 316).attr("y", 296).style("fill", bActive ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`✓ ${o.ui.cleanLatex}`);
}

/* ======================================================================== *
 * DEDUP — Node 7: exact dedup engine (from Dedup.tsx drawExact)
 * ======================================================================== */

function drawExact(el: SVGSVGElement, o: { step: number; mode: ExactMode; strip: boolean; reduce: boolean }) {
  const W = 760;
  const H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 460;
  const active = o.step >= 1;

  if (o.mode === "hash") {
    const docs = [0, 1, 2, 3, 4, 5];
    const dupIdx = new Set([1, 3, 4]);
    const startX = 30;
    docs.forEach((i) => {
      const y = 40 + i * 46;
      const dropped = active && dupIdx.has(i);
      const col = dupIdx.has(i) ? "var(--tok-byte)" : "var(--signal)";
      svg.append("rect").attr("x", startX).attr("y", y).attr("width", 96).attr("height", 32).attr("rx", 6)
        .style("fill", "none").style("stroke", col).style("stroke-width", 1.5).style("opacity", dropped ? 0.3 : 1);
      svg.append("text").attr("x", startX + 48).attr("y", y + 21).attr("text-anchor", "middle").style("fill", col).style("font-family", MONO).style("font-size", "10px")
        .style("opacity", dropped ? 0.5 : 0.9).text(dupIdx.has(i) ? (dropped ? "drop" : "dupe") : "keep");
    });
    const shaX = 200;
    svg.append("rect").attr("x", shaX).attr("y", 120).attr("width", 120).attr("height", 96).attr("rx", 10).style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 1.6);
    svg.append("text").attr("x", shaX + 60).attr("y", 165).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").text("SHA-256");
    svg.append("text").attr("x", shaX + 60).attr("y", 185).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10px").text("O(1) lookup");
    const tblX = 400;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 10; c++) {
        const hit = active && ((r * 10 + c) % 7 === 0);
        svg.append("rect").attr("x", tblX + c * 26).attr("y", 90 + r * 26).attr("width", 22).attr("height", 22).attr("rx", 3)
          .style("fill", hit ? "var(--signal)" : "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1)
          .style("opacity", hit ? (dur ? 0 : 0.9) : 1)
          .call((s) => { if (hit && dur) s.transition().duration(dur).style("opacity", 0.9); });
      }
    }
    svg.append("text").attr("x", tblX).attr("y", 78).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px").text("HASH TABLE / BLOOM FILTER");
    return;
  }

  const docX = 60;
  const docW = 380;
  const rows = [
    { label: "article body", boiler: false },
    { label: "article body", boiler: false },
    { label: o.strip ? "cookie + privacy banner (60 words)" : "shared nav banner", boiler: true },
    { label: "article body", boiler: false },
    { label: "license / disclaimer footer", boiler: true },
  ];
  const rh = 46;
  rows.forEach((r, i) => {
    const y = 40 + i * rh;
    const trimmed = active && r.boiler;
    const col = r.boiler ? "var(--tok-byte)" : "var(--signal)";
    svg.append("rect").attr("x", docX).attr("y", y).attr("width", docW).attr("height", rh - 12).attr("rx", 5)
      .style("fill", r.boiler ? "color-mix(in srgb, var(--tok-byte) 14%, transparent)" : "color-mix(in srgb, var(--signal) 12%, transparent)")
      .style("stroke", col).style("stroke-width", 1.2).style("opacity", trimmed ? 0.25 : 1);
    svg.append("text").attr("x", docX + 12).attr("y", y + 22).style("fill", col).style("font-family", MONO).style("font-size", "11px").style("opacity", trimmed ? 0.5 : 0.95).text(r.label);
    if (trimmed) {
      const laser = svg.append("line").attr("x1", docX).attr("y1", y + (rh - 12) / 2).attr("x2", docX).attr("y2", y + (rh - 12) / 2)
        .style("stroke", "var(--signal)").style("stroke-width", 2.5);
      if (dur) laser.transition().duration(dur).attr("x2", docX + docW); else laser.attr("x2", docX + docW);
      svg.append("text").attr("x", docX + docW + 10).attr("y", y + 22).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "10px").text("sliced");
    }
  });
  svg.append("text").attr("x", docX).attr("y", 28).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px").text("ONE UNIQUE FILE · suffix-array span scan");
}

/* ======================================================================== *
 * DEDUP — Node 8: MinHash signatures (from Dedup.tsx drawMinHash) + the
 * LSH candidate S-curve (drawSCurve — new, using the exact lib equation).
 * ======================================================================== */

function drawMinHash(el: SVGSVGElement, o: { step: number; shingleN: number; numPerm: number; reduce: boolean }) {
  const W = 760;
  const H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  const wordsA = DOC_A.split(/\s+/).slice(0, 22);
  const wordsB = DOC_B.split(/\s+/).slice(0, 22);
  const drawWords = (words: string[], y: number, label: string) => {
    svg.append("text").attr("x", 20).attr("y", y - 10).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px").text(label);
    let x = 20;
    words.forEach((w, i) => {
      const wpx = Math.max(26, w.length * 7.4 + 12);
      if (x + wpx > W - 20) return;
      const shared = i >= 1 && i <= 15;
      svg.append("rect").attr("x", x).attr("y", y).attr("width", wpx).attr("height", 22).attr("rx", 5)
        .style("fill", shared ? "color-mix(in srgb, var(--signal) 15%, transparent)" : "color-mix(in srgb, var(--tok-byte) 12%, transparent)")
        .style("stroke", shared ? "var(--signal)" : "var(--tok-byte)").style("stroke-width", 1).style("stroke-opacity", 0.5);
      svg.append("text").attr("x", x + wpx / 2).attr("y", y + 15).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "10px").text(w);
      x += wpx + 5;
    });
  };

  if (o.step < 1) {
    drawWords(wordsA, 60, "DOC A · shingled");
    drawWords(wordsB, 150, "DOC B · shingled");
    svg.append("text").attr("x", 20).attr("y", 250).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "11px").text(`${o.shingleN}-word shingles · green = shared body, red = site chrome`);
    return;
  }

  const cells = signatureCells(o.shingleN, o.numPerm, 32);
  const cols = 16;
  const cw = 42;
  const ch = 26;
  const gridX = 30;
  const drawSig = (y: number, label: string) => {
    svg.append("text").attr("x", gridX).attr("y", y - 8).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px").text(label);
    cells.forEach((match, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const cx = gridX + c * (cw + 2);
      const cy = y + r * (ch + 2);
      const cell = svg.append("rect").attr("x", cx).attr("y", cy).attr("width", cw).attr("height", ch).attr("rx", 3)
        .style("fill", match ? "var(--signal)" : "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
      if (match && dur) cell.style("opacity", 0).transition().delay(i * 8).duration(220).style("opacity", 0.92);
      else cell.style("opacity", match ? 0.92 : 1);
    });
  };
  drawSig(56, "SIG(A)");
  drawSig(140, "SIG(B)");

  const matched = cells.filter(Boolean).length;
  svg.append("text").attr("x", gridX).attr("y", 245).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px")
    .text(`${matched} / ${cells.length} cells agree  →  est. Jaccard ≈ ${(matched / cells.length).toFixed(2)}`);
  svg.append("text").attr("x", gridX).attr("y", 268).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px")
    .text("more permutations → the estimate tightens toward the true similarity");
}

/** The LSH candidate-pair S-curve: P(candidate) = 1 − (1 − sʳ)ᵇ, plotted over
 *  similarity s, with the steepest-point threshold marked. Pure d3 line chart. */
function drawSCurve(el: SVGSVGElement, o: { b: number; r: number; axisX: string; axisY: string; reduce: boolean }) {
  const W = 760, H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const pad = { l: 54, r: 24, t: 26, b: 48 };
  const x = d3.scaleLinear().domain([0, 1]).range([pad.l, W - pad.r]);
  const y = d3.scaleLinear().domain([0, 1]).range([H - pad.b, pad.t]);

  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    svg.append("line").attr("x1", x(t)).attr("y1", pad.t).attr("x2", x(t)).attr("y2", H - pad.b).style("stroke", "var(--hair)").style("opacity", 0.5);
    svg.append("text").attr("x", x(t)).attr("y", H - pad.b + 18).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(t.toFixed(2));
    svg.append("line").attr("x1", pad.l).attr("y1", y(t)).attr("x2", W - pad.r).attr("y2", y(t)).style("stroke", "var(--hair)").style("opacity", 0.4);
    svg.append("text").attr("x", pad.l - 8).attr("y", y(t) + 4).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(t.toFixed(1));
  });

  const pts = d3.range(0, 1.0001, 0.02).map((s) => ({ s, p: lshProbability(s, o.b, o.r) }));
  const line = d3.line<{ s: number; p: number }>().x((d) => x(d.s)).y((d) => y(d.p)).curve(d3.curveMonotoneX);
  const path = svg.append("path").datum(pts).attr("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2.8).attr("d", line);
  if (!o.reduce) {
    const len = (path.node() as SVGPathElement).getTotalLength();
    path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(500).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
  }

  const th = lshThreshold(o.b, o.r);
  if (th >= 0 && th <= 1) {
    svg.append("line").attr("x1", x(th)).attr("y1", pad.t).attr("x2", x(th)).attr("y2", H - pad.b).style("stroke", "var(--signal)").style("stroke-width", 1.4).style("stroke-dasharray", "4 4").style("opacity", 0.85);
    svg.append("text").attr("x", x(th)).attr("y", pad.t - 8).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(`threshold ≈ ${th.toFixed(2)} · b=${o.b} r=${o.r}`);
  }

  svg.append("text").attr("x", (pad.l + W - pad.r) / 2).attr("y", H - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.axisX);
  svg.append("text").attr("transform", `translate(16 ${(pad.t + H - pad.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.axisY);
}

/* ======================================================================== *
 * DEDUP — Node 9: embedding cluster map (from Dedup.tsx drawClusters)
 * ======================================================================== */

const CLUSTER_FILL = ["var(--tok-word)", "var(--tok-num)", "var(--tok-sub)", "var(--tok-space)"];

function drawClusters(el: SVGSVGElement, o: { step: number; radius: number; eps: number; reduce: boolean }) {
  const W = 760;
  const H = 380;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 380;
  const pad = 40;
  const x = (v: number) => pad + v * (W - pad * 2);
  const y = (v: number) => pad + v * (H - pad * 2);
  const res = semDedup(o.radius, o.eps);
  const pruning = o.step >= 1;

  if (pruning) {
    const c0 = EMBEDDINGS.filter((p) => p.cluster === 0);
    const cx = x(d3.mean(c0, (p) => p.x)!);
    const cy = y(d3.mean(c0, (p) => p.y)!);
    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 0).style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2).style("stroke-dasharray", "5 4")
      .transition().duration(dur).attr("r", 62);
  }

  EMBEDDINGS.forEach((p, i) => {
    const kept = res.kept[i];
    const isTail = p.cluster === -1;
    const fill = isTail ? "var(--fg)" : CLUSTER_FILL[p.cluster];
    const dot = svg.append("circle").attr("cx", x(p.x)).attr("cy", y(p.y)).attr("r", isTail ? 4.5 : 4)
      .style("fill", fill)
      .style("stroke", isTail ? "var(--signal)" : "var(--bg)").style("stroke-width", isTail ? 1.4 : 1);
    if (pruning && !kept) {
      if (dur) dot.transition().duration(dur).style("opacity", 0.12).attr("r", 2);
      else dot.style("opacity", 0.12).attr("r", 2);
    } else {
      dot.style("opacity", isTail ? 1 : 0.95);
    }
  });

  svg.append("text").attr("x", pad).attr("y", H - 12).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px")
    .text(pruning ? `pruned ${res.redundancyPrunedPct}% redundant · long-tail uniques (ringed dots) kept` : "embeddings in concept clusters + long-tail uniques");
}

/* ======================================================================== *
 * RECIPE — Node 10: temperature sampling (from Recipe.tsx drawTemp)
 * ======================================================================== */

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
  svg.append("line").attr("x1", pad.l).attr("y1", y(0)).attr("x2", W - pad.r).attr("y2", y(0)).style("stroke", "var(--hair)");
  svg.append("rect").attr("x", pad.l).attr("y", 8).attr("width", 12).attr("height", 12).attr("rx", 2).style("fill", "var(--tok-space)").style("fill-opacity", 0.5);
  svg.append("text").attr("x", pad.l + 18).attr("y", 18).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.natLabel);
  svg.append("rect").attr("x", pad.l + 150).attr("y", 8).attr("width", 12).attr("height", 12).attr("rx", 2).style("fill", "var(--signal)");
  svg.append("text").attr("x", pad.l + 168).attr("y", 18).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.adjLabel);

  keys.forEach((k, i) => {
    const gx = pad.l + i * groupW + groupW / 2;
    const pVal = NATURAL_FREQ[k];
    const qVal = q[k];
    svg.append("rect").attr("x", gx - bw - 3).attr("y", y(pVal)).attr("width", bw).attr("height", y(0) - y(pVal))
      .attr("rx", 3).style("fill", "var(--tok-space)").style("fill-opacity", 0.45);
    const qh = y(0) - y(qVal);
    const bar = svg.append("rect").attr("x", gx + 3).attr("width", bw).attr("rx", 3).style("fill", "var(--signal)");
    if (o.reduce) bar.attr("y", y(qVal)).attr("height", qh);
    else bar.attr("y", y(0)).attr("height", 0).transition().duration(420).ease(d3.easeCubicOut).attr("y", y(qVal)).attr("height", qh);
    svg.append("text").attr("x", gx + 3 + bw / 2).attr("y", y(qVal) - 6).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(`${Math.round(qVal * 100)}%`);
    svg.append("text").attr("x", gx).attr("y", H - pad.b + 20).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(o.domainLabels[k]);
  });
}

/* ======================================================================== *
 * RECIPE — Node 11: validation-loss cliff (from Recipe.tsx drawLoss)
 * ======================================================================== */

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

  svg.append("rect").attr("x", x(CLIFF)).attr("y", pad.t).attr("width", (W - pad.r) - x(CLIFF)).attr("height", (H - pad.b) - pad.t)
    .style("fill", "var(--tok-byte)").style("fill-opacity", 0.08);
  svg.append("text").attr("x", (x(CLIFF) + (W - pad.r)) / 2).attr("y", pad.t + 16).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").style("opacity", 0.85).text(o.cliffLabel);

  [1, 2, 3, 4, 5].forEach((t) => {
    svg.append("line").attr("x1", x(t)).attr("y1", pad.t).attr("x2", x(t)).attr("y2", H - pad.b).style("stroke", "var(--hair)").style("stroke-width", 1).style("opacity", 0.5);
    svg.append("text").attr("x", x(t)).attr("y", H - pad.b + 18).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${t}×`);
  });
  svg.append("text").attr("x", (pad.l + W - pad.r) / 2).attr("y", H - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.axisX);
  svg.append("text").attr("transform", `translate(14 ${(pad.t + H - pad.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.axisY);

  svg.append("path").datum(full).attr("fill", "none").style("stroke", "var(--muted)").style("stroke-width", 1.2).style("stroke-dasharray", "3 4").style("opacity", 0.5).attr("d", line);

  const travelled = full.filter((p) => p.epoch <= o.cap + 1e-9);
  const green = travelled.filter((p) => p.epoch <= CLIFF + 1e-9);
  const red = travelled.filter((p) => p.epoch >= CLIFF - 1e-9);
  const gp = svg.append("path").datum(green).attr("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2.8).attr("d", line);
  if (red.length > 1) svg.append("path").datum(red).attr("fill", "none").style("stroke", "var(--tok-byte)").style("stroke-width", 2.8).attr("d", line);
  if (!o.reduce) {
    const len = (gp.node() as SVGPathElement).getTotalLength();
    gp.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(500).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
  }

  svg.append("line").attr("x1", x(2)).attr("y1", pad.t).attr("x2", x(2)).attr("y2", H - pad.b).style("stroke", "var(--signal)").style("stroke-width", 1).style("stroke-dasharray", "4 4").style("opacity", 0.6);
  svg.append("text").attr("x", x(2) + 5).attr("y", H - pad.b - 6).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.safeLabel);

  const capPt = full.find((p) => Math.abs(p.epoch - o.cap) < 0.06) ?? full[full.length - 1];
  const capCol = o.cap <= CLIFF ? "var(--signal)" : "var(--tok-byte)";
  svg.append("circle").attr("cx", x(o.cap)).attr("cy", y(capPt.loss)).attr("r", 5).style("fill", capCol).style("stroke", "var(--bg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", x(o.cap)).attr("y", pad.t + 12).attr("text-anchor", "middle").style("fill", capCol).style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(`cap ${o.cap.toFixed(1)}×`);
}

/* ======================================================================== *
 * RECIPE — Node 12: the 3-gate synthetic audit (from Recipe.tsx drawGates)
 * ======================================================================== */

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

  svg.append("rect").attr("x", docX).attr("y", cy - 26).attr("width", docW).attr("height", 52).attr("rx", 10).style("fill", "var(--surface)").style("stroke", "var(--fg)").style("stroke-width", 1.4);
  svg.append("text").attr("x", docX + docW / 2).attr("y", cy + 5).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(o.docLabel);

  gateKeys.forEach((g, i) => {
    const on = o.gates[g];
    svg.append("rect").attr("x", gx[i]).attr("y", cy - gh / 2).attr("width", gw).attr("height", gh).attr("rx", 12)
      .style("fill", "var(--bg)").style("stroke", on ? "var(--fg)" : "var(--border)").style("stroke-width", 1.5).style("stroke-dasharray", on ? "none" : "4 4").style("opacity", on ? 1 : 0.5);
    svg.append("text").attr("x", gx[i] + gw / 2).attr("y", cy - 4).attr("text-anchor", "middle").style("fill", on ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.gateLabels[i]);
    svg.append("text").attr("x", gx[i] + gw / 2).attr("y", cy + 14).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(on ? "ON" : "OFF");
  });

  const reached = o.landed === "buffer";
  svg.append("rect").attr("x", bufX).attr("y", cy - 30).attr("width", bufW).attr("height", 60).attr("rx", 12)
    .style("fill", reached ? "color-mix(in srgb, var(--signal) 16%, transparent)" : "var(--surface)").style("stroke", reached ? "var(--signal)" : "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", bufX + bufW / 2).attr("y", cy + 4).attr("text-anchor", "middle").style("fill", reached ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "600").text(o.bufferLabel);

  const landIdx = o.landed === "buffer" ? gateKeys.length : gateKeys.indexOf(o.landed);
  const stops = [docX + docW, ...gx.map((gxi) => gxi + gw / 2), bufX];
  const segEnd = o.landed === "buffer" ? bufX : gx[landIdx] + gw / 2;
  const col = o.landed === "buffer" ? "var(--signal)" : "var(--tok-byte)";
  const path = svg.append("line").attr("x1", docX + docW).attr("y1", cy).attr("x2", docX + docW).attr("y2", cy).style("stroke", col).style("stroke-width", 2.5);
  if (o.reduce) path.attr("x2", segEnd);
  else path.transition().duration(500).ease(d3.easeCubicOut).attr("x2", segEnd);

  if (o.landed !== "buffer") {
    const dropX = gx[landIdx] + gw / 2;
    svg.append("line").attr("x1", dropX).attr("y1", cy + gh / 2).attr("x2", dropX).attr("y2", H - 42).style("stroke", "var(--tok-byte)").style("stroke-width", 2).style("stroke-dasharray", "4 4");
    svg.append("text").attr("x", dropX).attr("y", H - 24).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").style("font-weight", "700").text(`✕ ${o.dropLabel}`);
  }
  void stops;
}

/* ======================================================================== *
 * Shared helper components
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

function useDeep() {
  return useAcademy().t.dataPipelineDeep;
}

function NodeCallout({ c }: { c: { label: string; title: string; body: string } }) {
  return <Callout label={c.label} title={c.title}>{rich(c.body)}</Callout>;
}

/** One metric column for the retrain/retrieve compare. (from WebScale.tsx) */
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

function RetrainCompare({ mode, tokens, reduce, barLabel, ragLabel, retrainLabel, metrics }: { mode: "rag" | "retrain"; tokens: number; reduce: boolean; barLabel: string; ragLabel: string; retrainLabel: string; metrics: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Cap>{barLabel}</Cap>
        <div style={{ marginTop: 8 }}>
          <DiagramSvg label={barLabel} draw={(el) => drawRetrainBar(el, { mode, reduce, ragLabel, retrainLabel })} deps={[mode, reduce]} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
        <MetricCol title={ragLabel} labels={metrics} values={["~120 ms", "$0", "0", `+${tokens}`]} active={mode === "rag"} />
        <MetricCol title={retrainLabel} labels={metrics} values={["~3 weeks", "$12.4M", "405B", "0"]} active={mode === "retrain"} />
      </div>
    </div>
  );
}

function InjectionPanels({ pay, sanitiser, seeLabel, readsLabel, pageVisible, outputLabel }: { pay: PipePayload; sanitiser: boolean; seeLabel: string; readsLabel: string; pageVisible: string; outputLabel: string }) {
  const panel = (label: string, tone: "neutral" | "ok" | "bad", body: React.ReactNode) => (
    <div style={{ border: `1px solid ${tone === "bad" ? "var(--tok-byte)" : tone === "ok" ? "var(--signal)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)", padding: "9px 12px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>{label}</div>
      <div style={{ padding: "12px 13px", fontSize: 14, lineHeight: 1.6, minHeight: 96 }}>{body}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
        {panel(seeLabel, "neutral", <span style={{ color: "var(--fg)" }}>{pageVisible}</span>)}
        {panel(readsLabel, sanitiser ? "ok" : "bad", (
          <>
            <span style={{ color: "var(--fg)" }}>{pageVisible}</span>{" "}
            {sanitiser ? (
              <span style={{ color: "var(--signal-fg)", textDecoration: "line-through", opacity: 0.8 }}>{pay.hidden}</span>
            ) : (
              <span style={{ color: "var(--tok-byte)", fontWeight: 600 }}>{pay.hidden}</span>
            )}
          </>
        ))}
      </div>
      <div style={{ background: "var(--readout-bg)", border: "1px solid var(--readout-border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ color: "var(--readout-muted)", fontSize: 11, letterSpacing: ".08em", marginBottom: 4 }}>{outputLabel}</div>
        <div style={{ color: sanitiser ? "var(--readout-fg)" : "var(--tok-byte)" }}>{sanitiser ? pay.clean : pay.attacked}</div>
      </div>
    </div>
  );
}

const NAV = { labelPrev: "Previous step", labelNext: "Next step" };
const preStyle: React.CSSProperties = { margin: 0, fontFamily: MONO, fontSize: 12, lineHeight: 1.55, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg)", overflowX: "auto", whiteSpace: "pre-wrap" };

/* ======================================================================== *
 * Node components — one per re-homed node, reading labels from n.ui.
 * ======================================================================== */

const SEND_AGENTS = ["GPTBot", "ClaudeBot", "OAI-SearchBot"];

function Node1({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[0];
  const ui = n.ui ?? {};
  const segs = ui.segments ?? [];
  const [agentName, setAgentName] = useState("GPTBot");
  const agent = AGENTS.find((a) => a.name === agentName) ?? AGENTS[0];
  const dec = robotsDecision(DEFAULT_ROBOTS, agent.name, "/article/news-10492");
  const agentIdx = SEND_AGENTS.indexOf(agentName);
  const manual = useRef(false);
  const pick = (name: string) => { setAgentName(name); manual.current = true; };
  return (
    <SceneShell
      id="dpd-node-1" index={1} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      onStep={(s) => { if (!manual.current) setAgentName(SEND_AGENTS[s]); manual.current = false; }}
      note={n.optionNotes?.[agentIdx < 0 ? 0 : agentIdx]}
      aside={ui.callout ? <NodeCallout c={ui.callout} /> : undefined}
      controls={
        <>
          <ControlRow>
            {segs.map((label, i) => (
              <Toggle key={i} on={agentName === SEND_AGENTS[i]} onClick={() => pick(SEND_AGENTS[i])}>{label}</Toggle>
            ))}
          </ControlRow>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{(ui.labels ?? [])[0]}</div>
          <pre style={preStyle}>{DEFAULT_ROBOTS}</pre>
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

function Node2({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[1];
  const ui = n.ui ?? {};
  const segs = ui.segments ?? [];
  const labels = ui.labels ?? [];
  const metrics = ui.domains ?? [];
  const [mode, setMode] = useState<"rag" | "retrain">("rag");
  const [headline, setHeadline] = useState(labels[1] ?? "");
  const tokens = estTokens(headline);
  const manual = useRef(false);
  const pick = (m: "rag" | "retrain") => { setMode(m); manual.current = true; };
  return (
    <SceneShell
      id="dpd-node-2" index={2} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} hideStepper captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      onStep={(s) => { if (!manual.current) setMode(s === 0 ? "rag" : "retrain"); manual.current = false; }}
      note={n.optionNotes?.[mode === "rag" ? 0 : 1]}
      controls={
        <>
          <label htmlFor="dpd-headline" style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{labels[0]}</label>
          <input id="dpd-headline" value={headline} onChange={(e) => setHeadline(e.target.value)}
            suppressHydrationWarning
            className="u-textarea"
            style={{ width: "100%", fontFamily: MONO, fontSize: 13.5, padding: "11px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }} />
          <ControlRow>
            <Toggle on={mode === "rag"} onClick={() => pick("rag")}>{segs[0]}</Toggle>
            <Toggle on={mode === "retrain"} onClick={() => pick("retrain")}>{segs[1]}</Toggle>
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
      {() => <RetrainCompare mode={mode} tokens={tokens} reduce={reduce} barLabel={labels[2] ?? ""} ragLabel={labels[3] ?? ""} retrainLabel={labels[4] ?? ""} metrics={metrics} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[2];
  const ui = n.ui ?? {};
  const payloads = ui.payloads ?? [];
  const labels = ui.labels ?? [];
  const [payloadKey, setPayloadKey] = useState(payloads[0]?.key ?? "");
  const [sanitiser, setSanitiser] = useState(false); // off by default: show the attack first
  const cpIdx = payloads.findIndex((p) => p.key === payloadKey);
  const pay = payloads[cpIdx] ?? payloads[0];
  const manual = useRef(false);
  const pickPayload = (k: string) => { setPayloadKey(k); manual.current = true; };
  const toggleSan = () => { setSanitiser((v) => !v); manual.current = true; };
  if (!pay) return null;
  return (
    <SceneShell
      id="dpd-node-3" index={3} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={4} hideStepper captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      onStep={(s) => {
        if (!manual.current) {
          if (s < 3) { setPayloadKey(payloads[s].key); setSanitiser(false); }
          else setSanitiser(true);
        }
        manual.current = false;
      }}
      note={n.optionNotes?.[cpIdx < 0 ? 0 : cpIdx]}
      controls={
        <>
          <ControlRow>
            {payloads.map((p) => (
              <Toggle key={p.key} on={payloadKey === p.key} onClick={() => pickPayload(p.key)}>{p.label}</Toggle>
            ))}
          </ControlRow>
          <Toggle on={sanitiser} onClick={toggleSan}>{labels[0]}: {sanitiser ? "ON" : "OFF"}</Toggle>
        </>
      }
      readout={null}
    >
      {() => <InjectionPanels pay={pay} sanitiser={sanitiser} seeLabel={labels[1] ?? ""} readsLabel={labels[2] ?? ""} pageVisible={labels[3] ?? ""} outputLabel={labels[4] ?? ""} />}
    </SceneShell>
  );
}

function Node4({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[3];
  const ui = n.ui ?? {};
  const toggles = ui.toggles ?? [];
  const L = ui.labels ?? [];
  const notes = ui.notes ?? [];
  const repoUi: RepoLabels = { keep: L[0] ?? "", drop: L[1] ?? "", wontParse: L[2] ?? "", machineMade: L[3] ?? "", packed: L[4] ?? "" };
  const [dropBroken, setDropBroken] = useState(true);
  const [dropGen, setDropGen] = useState(true);
  const [packByImport, setPack] = useState(true);
  const pack = computePack({
    rejectUnparseable: dropBroken,
    pruneLicense: true,
    packByImport,
    maxRatio: dropGen ? 6 : 99,
    minifyThreshold: dropGen ? 2000 : 1e9,
  });
  const dropped = pack.droppedCounts.syntax + pack.droppedCounts.anomalous + pack.droppedCounts.minified;
  const note = dropBroken
    ? (notes[0] ?? "").replace("{n}", String(dropped)).replace("{k}", String(pack.kept)).replace("{links}", String(pack.crossFileLinks))
    : notes[1];
  return (
    <SceneShell
      id="dpd-node-4" index={4} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      aside={ui.callout ? <NodeCallout c={ui.callout} /> : undefined}
      note={note}
      controls={
        <ControlRow>
          <Toggle on={dropBroken} onClick={() => setDropBroken((v) => !v)}>{toggles[0]}</Toggle>
          <Toggle on={dropGen} onClick={() => setDropGen((v) => !v)}>{toggles[1]}</Toggle>
          <Toggle on={packByImport} onClick={() => setPack((v) => !v)}>{toggles[2]}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawRepo(el, { step, pack, reduce, ui: repoUi })} deps={[step, dropBroken, dropGen, packByImport, reduce]} />}
    </SceneShell>
  );
}

function Node5({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[4];
  const ui = n.ui ?? {};
  const segs = ui.segments ?? [];
  const L = ui.labels ?? [];
  const notes = ui.notes ?? [];
  const licUi: LicenseLabels = { quarantine: L[0] ?? "", copyleft: L[1] ?? "", permissive: L[2] ?? "", safeToTrain: L[3] ?? "", leaked: L[4] ?? "" };
  const [allowed, setAllowed] = useState<string[]>(["MIT", "Apache-2.0", "BSD"]);
  const [deepScan, setDeep] = useState(true);
  const audit = auditRepo(new Set(allowed), deepScan);
  const toggle = (lic: string) => setAllowed((a) => (a.includes(lic) ? a.filter((x) => x !== lic) : [...a, lic]));
  const note = deepScan
    ? (notes[0] ?? "").replace("{q}", String(audit.quarantined)).replace("{kb}", String(audit.passedKb))
    : notes[1];
  return (
    <SceneShell
      id="dpd-node-5" index={5} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      aside={ui.callout ? <NodeCallout c={ui.callout} /> : undefined}
      note={note}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>{L[5]}</div>
          <ControlRow>
            {segs.map((lic) => (
              <Toggle key={lic} on={allowed.includes(lic)} onClick={() => toggle(lic)}>{lic}</Toggle>
            ))}
          </ControlRow>
          <Toggle on={deepScan} onClick={() => setDeep((v) => !v)}>{L[6]}: {deepScan ? "ON" : "OFF"}</Toggle>
        </>
      }
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLicense(el, { step, audit, deepScan, reduce, ui: licUi })} deps={[step, allowed, deepScan, reduce]} />}
    </SceneShell>
  );
}

function Node6({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[5];
  const ui = n.ui ?? {};
  const segs = ui.segments ?? [];
  const L = ui.labels ?? [];
  const notes = ui.notes ?? [];
  const pdfUi: PdfLabels = { naive: L[0] ?? "", vision: L[1] ?? "", scrambled: L[2] ?? "", cleanLatex: L[3] ?? "" };
  const [mode, setMode] = useState<"naive" | "twostage">("twostage");
  const restored = mode === "twostage";
  const note = restored ? notes[0] : notes[1];
  return (
    <SceneShell
      id="dpd-node-6" index={6} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      aside={ui.callout ? <NodeCallout c={ui.callout} /> : undefined}
      note={note}
      controls={
        <ControlRow>
          <Toggle on={mode === "naive"} onClick={() => setMode("naive")}>{segs[0]}</Toggle>
          <Toggle on={mode === "twostage"} onClick={() => setMode("twostage")}>{segs[1]}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawPdf(el, { restored, reduce, ui: pdfUi })} deps={[mode, reduce]} />}
    </SceneShell>
  );
}

function Node7({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[6];
  const ui = n.ui ?? {};
  const segs = ui.segments ?? [];
  return (
    <SceneShell
      id="dpd-node-7" index={7} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      controls={null}
      readout={null}
    >
      {() => (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <Cap>{segs[0]}</Cap>
            <div style={{ marginTop: 8 }}><DiagramSvg label={segs[0] ?? ""} draw={(el) => drawExact(el, { step: 1, mode: "hash", strip: true, reduce })} deps={[reduce]} /></div>
          </div>
          <div>
            <Cap>{segs[1]}</Cap>
            <div style={{ marginTop: 8 }}><DiagramSvg label={segs[1] ?? ""} draw={(el) => drawExact(el, { step: 1, mode: "suffix", strip: true, reduce })} deps={[reduce]} /></div>
          </div>
        </div>
      )}
    </SceneShell>
  );
}

function Node8({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[7];
  const ui = n.ui ?? {};
  const L = ui.labels ?? [];
  const notes = ui.notes ?? [];
  const [b, setB] = useState(20);
  const [r, setR] = useState(4);
  return (
    <SceneShell
      id="dpd-node-8" index={8} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      note={notes[0]}
      aside={
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>{L[0]}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>{DOC_A.slice(0, 96)}…</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>{L[1]}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>{DOC_B.slice(0, 96)}…</div>
          </div>
          {ui.deeperTitle && <Deeper title={ui.deeperTitle}>{rich(ui.deeperBody ?? "")}</Deeper>}
        </div>
      }
      controls={
        <>
          <Slider id="dpd-bands" label={ui.slider ?? "b"} value={b} display={String(b)} min={1} max={40} onChange={setB} />
          <Slider id="dpd-rows" label={ui.slider2 ?? "r"} value={r} display={String(r)} min={1} max={12} onChange={setR} />
        </>
      }
      readout={null}
    >
      {(step) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <DiagramSvg label={n.aria ?? ""} draw={(el) => drawMinHash(el, { step, shingleN: 5, numPerm: 128, reduce })} deps={[step, reduce]} />
          <div>
            <Cap>{L[2]}</Cap>
            <div style={{ marginTop: 8 }}><DiagramSvg label={L[2] ?? ""} draw={(el) => drawSCurve(el, { b, r, axisX: L[3] ?? "", axisY: L[4] ?? "", reduce })} deps={[b, r, reduce]} /></div>
          </div>
        </div>
      )}
    </SceneShell>
  );
}

function Node9({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[8];
  return (
    <SceneShell
      id="dpd-node-9" index={9} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      controls={null}
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawClusters(el, { step, radius: 1.0, eps: 0.05, reduce })} deps={[step, reduce]} />}
    </SceneShell>
  );
}

function Node10({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[9];
  const ui = n.ui ?? {};
  const L = ui.labels ?? [];
  const domains = ui.domains ?? [];
  const [tau, setTau] = useState(0.5);
  const domLabels: Record<string, string> = { web: domains[0] ?? "", code: domains[1] ?? "", math: domains[2] ?? "", books: domains[3] ?? "" };
  return (
    <SceneShell
      id="dpd-node-10" index={10} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      note={n.sliderNote ? rich(n.sliderNote) : undefined}
      aside={ui.deeperTitle ? <Deeper title={ui.deeperTitle}>{rich(ui.deeperBody ?? "")}</Deeper> : undefined}
      controls={<Slider id="dpd-tau" label={ui.slider ?? ""} value={Math.round(tau * 100)} display={`τ = ${tau.toFixed(2)}`} min={10} max={100} step={5} onChange={(v) => setTau(v / 100)} />}
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTemp(el, { tau, natLabel: L[0] ?? "", adjLabel: L[1] ?? "", domainLabels: domLabels, reduce })} deps={[tau, reduce]} />}
    </SceneShell>
  );
}

function Node11({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[10];
  const ui = n.ui ?? {};
  const L = ui.labels ?? [];
  const [cap, setCap] = useState(1.8);
  return (
    <SceneShell
      id="dpd-node-11" index={11} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      note={n.sliderNote ? rich(n.sliderNote) : undefined}
      controls={<Slider id="dpd-cap" label={ui.slider ?? ""} value={Math.round(cap * 10)} display={`${cap.toFixed(1)}×`} min={10} max={50} step={1} onChange={(v) => setCap(v / 10)} />}
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLoss(el, { cap, safeLabel: L[0] ?? "", cliffLabel: L[1] ?? "", axisX: L[2] ?? "", axisY: L[3] ?? "", reduce })} deps={[cap, reduce]} />}
    </SceneShell>
  );
}

function Node12({ reduce }: { reduce: boolean }) {
  const cp = useDeep();
  const n = cp.nodes[11];
  const ui = n.ui ?? {};
  const segs = ui.segments ?? [];
  const toggles = ui.toggles ?? [];
  const L = ui.labels ?? [];
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
      id="dpd-node-12" index={12} total={12} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      onStep={(s) => { if (!manual.current) setDocIdx(s); manual.current = false; }}
      note={n.optionNotes?.[docIdx]}
      controls={
        <>
          <ControlRow>
            {segs.map((label, i) => (
              <Toggle key={i} on={docIdx === i} onClick={() => pickDoc(i)}>{label}</Toggle>
            ))}
          </ControlRow>
          <ControlRow>
            {gateKeys.map((g, i) => (
              <Toggle key={g} on={gates[g]} onClick={() => toggleGate(g)}>{toggles[i]}: {gates[g] ? "ON" : "OFF"}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawGates(el, { docLabel: segs[docIdx] ?? "", fails: doc.fails, gates, landed, gateLabels: toggles, bufferLabel: L[0] ?? "", dropLabel: L[1] ?? "", reduce })} deps={[docIdx, gates, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The article
 * ======================================================================== */

export default function DataPipelineDeep() {
  const { t, lang } = useAcademy();
  const cp = t.dataPipelineDeep;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);
  const stationLabel = lang === "es" ? "ESTACIÓN" : "STATION";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
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
        <Node5 reduce={reduce} />
        <Node6 reduce={reduce} />
        <StationHeader stations={cp.stations} activeKey="dedup" stationLabel={stationLabel} />
        <Node7 reduce={reduce} />
        <Node8 reduce={reduce} />
        <Node9 reduce={reduce} />
        <StationHeader stations={cp.stations} activeKey="recipe" stationLabel={stationLabel} />
        <Node10 reduce={reduce} />
        <Node11 reduce={reduce} />
        <Node12 reduce={reduce} />
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
