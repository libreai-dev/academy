"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider, Callout } from "./webscale-kit";
import {
  type Recipe,
  RECIPE_PRESETS,
  recipeMetrics,
  reReads,
  rebalance,
  computePack,
  type PackResult,
  FILE_SEP,
  auditRepo,
  type LicenseAudit,
  REPO_ROOT_LICENSE,
  NAIVE_SCRAMBLE,
  RESTORED_LATEX,
} from "../lib/domains";
import type { DomUi } from "../lib/copy";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Every illustration is literal and labelled; colour via .style() so the CSS
 * design tokens (and theme flips) resolve live.
 * ======================================================================== */

type Svg = d3.Selection<SVGSVGElement, unknown, null, undefined>;

/** A 45° cross-hatch fill for "danger / quarantine" zones. */
function addHatch(svg: Svg, id: string, color: string): string {
  const p = svg.append("defs").append("pattern").attr("id", id)
    .attr("patternUnits", "userSpaceOnUse").attr("width", 7).attr("height", 7).attr("patternTransform", "rotate(45)");
  p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 7).style("stroke", color).style("stroke-width", 2.2);
  return `url(#${id})`;
}

/** Word-wrap a string into <tspan> lines under a mono text node. */
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

const DOMAIN_COLORS = ["var(--tok-space)", "var(--tok-num)", "var(--tok-sub)", "var(--tok-punct)"];
const DOMAIN_KEYS: (keyof Recipe)[] = ["web", "code", "math", "books"];

/* --- Node 1: the mix, its re-reads, and the reasoning it buys ----------- */

function drawRecipe(el: SVGSVGElement, o: { recipe: Recipe; m: ReturnType<typeof recipeMetrics>; reduce: boolean; domains: string[]; ui: DomUi }) {
  const W = 760, H = 322;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const hatch = addHatch(svg, "d1-hatch", "var(--tok-byte)");
  const shares = DOMAIN_KEYS.map((k) => o.recipe[k]);
  const rr = reReads(o.recipe);

  // 1) The mix — a 100% stacked bar with a legend naming every share.
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

  // 2) Re-reads — one gauge per scarce pile (code / maths / books).
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
  // the 1.2× safe limit, drawn across the three gauges
  svg.append("line").attr("x1", limitX).attr("y1", 108).attr("x2", limitX).attr("y2", 212).style("stroke", "var(--muted)").style("stroke-width", 1).style("stroke-dasharray", "3 3");
  svg.append("text").attr("x", limitX).attr("y", 226).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.ui.safeLimit);

  // 3) Reasoning meter.
  svg.append("text").attr("x", 20).attr("y", 258).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(`${o.ui.reasoning}  ${o.m.reasoning}/100`);
  svg.append("rect").attr("x", 20).attr("y", 268).attr("width", barW).attr("height", 14).attr("rx", 7).style("fill", "var(--surface)").style("stroke", "var(--hair)");
  const rw = (o.m.reasoning / 100) * barW;
  const rbar = svg.append("rect").attr("x", 20).attr("y", 268).attr("height", 14).attr("rx", 7).style("fill", o.m.reasoning >= 85 ? "var(--signal)" : "var(--muted)");
  if (o.reduce) rbar.attr("width", rw); else rbar.attr("width", 0).transition().duration(420).attr("width", rw);
  if (o.m.drift) svg.append("text").attr("x", 20).attr("y", 306).style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(`⚠ ${o.ui.driftWarn}`);
}

/* --- Node 2: sort files (keep / drop) then pack them --------------------- */

const REPO_ORDER = ["main.py", "models.py", "utils.py", "vendor/bundle.min.js", "proto/schema_pb2.py", "broken.py"];

function shortName(path: string): string {
  const b = path.split("/").pop() ?? path;
  return b.length > 16 ? b.slice(0, 15) + "…" : b;
}

function drawRepo(el: SVGSVGElement, o: { step: number; pack: PackResult; reduce: boolean; ui: DomUi }) {
  const W = 760, H = 320;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const hatch = addHatch(svg, "d2-hatch", "var(--tok-byte)");
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

/* --- Node 3: scan every folder, quarantine copyleft --------------------- */

function drawLicense(el: SVGSVGElement, o: { step: number; audit: LicenseAudit; deepScan: boolean; reduce: boolean; ui: DomUi }) {
  const W = 760, H = 400;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const hatch = addHatch(svg, "d3-hatch", "var(--tok-byte)");
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
    // safe → training-set tag on the permissive rows after a deep scan
    if (o.step >= 1 && o.deepScan && !copyleft) g.append("text").attr("x", 234).attr("y", 26).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(`→ ${o.ui.safeToTrain}`);
  });

  if (leaked) {
    svg.append("rect").attr("x", 20).attr("y", 40).attr("width", 340).attr("height", 320).attr("rx", 12).style("fill", "var(--tok-byte)").style("fill-opacity", 0.06).style("stroke", "none");
    svg.append("text").attr("x", 190).attr("y", 384).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(`⚠ ${o.ui.leaked}`);
  }
}

/* --- Node 4: naive read vs vision model --------------------------------- */

function drawPdf(el: SVGSVGElement, o: { restored: boolean; reduce: boolean; ui: DomUi }) {
  const W = 760, H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const hatch = addHatch(svg, "d4-hatch", "var(--tok-byte)");

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

function useD() {
  return useAcademy().t.domains;
}

/** The per-node rich-context / plain-language panel, above the interactive. */
function NodeCallout({ c }: { c: { label: string; title: string; body: string } }) {
  return <Callout label={c.label} title={c.title}>{rich(c.body)}</Callout>;
}

const NAV = { labelPrev: "Previous step", labelNext: "Next step" };

function Node1({ reduce }: { reduce: boolean }) {
  const d = useD();
  const n = d.nodes[0];
  const [recipe, setRecipe] = useState<Recipe>(RECIPE_PRESETS[1]);
  const [presetIdx, setPresetIdx] = useState(1);
  const manual = useRef(false);
  const m = recipeMetrics(recipe);
  const rr = reReads(recipe);
  const worst = rr.math >= rr.code && rr.math >= rr.books ? [d.n1domains[2], rr.math] as const : rr.code >= rr.books ? [d.n1domains[1], rr.code] as const : [d.n1domains[3], rr.books] as const;
  const note = m.drift
    ? d.notes.n1drift.replace("{web}", String(Math.round(recipe.web * 100)))
    : m.overfit
      ? d.notes.n1overfit.replace("{name}", worst[0]).replace("{x}", worst[1].toFixed(1))
      : d.notes.n1ok;
  const pickPreset = (i: number) => { setRecipe(RECIPE_PRESETS[i]); setPresetIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="d-node-1" index={1} total={4} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={RECIPE_PRESETS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      onStep={(s) => { if (!manual.current) { setRecipe(RECIPE_PRESETS[s]); setPresetIdx(s); } manual.current = false; }}
      aside={<NodeCallout c={n.callout} />}
      note={note}
      controls={
        <>
          <ControlRow>
            {d.n1presets.map((lab, i) => (
              <Toggle key={i} on={presetIdx === i} onClick={() => pickPreset(i)}>{lab}</Toggle>
            ))}
          </ControlRow>
          {DOMAIN_KEYS.map((k, i) => (
            <Slider key={k} id={`d-mix-${k}`} label={d.n1domains[i]} value={Math.round(recipe[k] * 100)} display={`${Math.round(recipe[k] * 100)}%`} min={0} max={100}
              onChange={(v) => { setRecipe((r) => rebalance(r, k, v / 100)); setPresetIdx(-1); manual.current = true; }} />
          ))}
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria} draw={(el) => drawRecipe(el, { recipe, m, reduce, domains: d.n1domains, ui: d.ui })} deps={[recipe, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const d = useD();
  const n = d.nodes[1];
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
    ? d.notes.n2on.replace("{n}", String(dropped)).replace("{k}", String(pack.kept)).replace("{links}", String(pack.crossFileLinks))
    : d.notes.n2off;
  return (
    <SceneShell
      id="d-node-2" index={2} total={4} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      aside={<NodeCallout c={n.callout} />}
      note={note}
      controls={
        <ControlRow>
          <Toggle on={dropBroken} onClick={() => setDropBroken((v) => !v)}>{d.n2toggles[0]}</Toggle>
          <Toggle on={dropGen} onClick={() => setDropGen((v) => !v)}>{d.n2toggles[1]}</Toggle>
          <Toggle on={packByImport} onClick={() => setPack((v) => !v)}>{d.n2toggles[2]}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria} draw={(el) => drawRepo(el, { step, pack, reduce, ui: d.ui })} deps={[step, dropBroken, dropGen, packByImport, reduce]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const d = useD();
  const n = d.nodes[2];
  const [allowed, setAllowed] = useState<string[]>(["MIT", "Apache-2.0", "BSD"]);
  const [deepScan, setDeep] = useState(true);
  const audit = auditRepo(new Set(allowed), deepScan);
  const toggle = (lic: string) => setAllowed((a) => (a.includes(lic) ? a.filter((x) => x !== lic) : [...a, lic]));
  const note = deepScan
    ? d.notes.n3on.replace("{q}", String(audit.quarantined)).replace("{kb}", String(audit.passedKb))
    : d.notes.n3off;
  return (
    <SceneShell
      id="d-node-3" index={3} total={4} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      aside={<NodeCallout c={n.callout} />}
      note={note}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>{d.n3allowLabel}</div>
          <ControlRow>
            {d.n3licenses.map((lic) => (
              <Toggle key={lic} on={allowed.includes(lic)} onClick={() => toggle(lic)}>{lic}</Toggle>
            ))}
          </ControlRow>
          <Toggle on={deepScan} onClick={() => setDeep((v) => !v)}>{d.n3deepScan}: {deepScan ? "ON" : "OFF"}</Toggle>
        </>
      }
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria} draw={(el) => drawLicense(el, { step, audit, deepScan, reduce, ui: d.ui })} deps={[step, allowed, deepScan, reduce]} />}
    </SceneShell>
  );
}

function Node4({ reduce }: { reduce: boolean }) {
  const d = useD();
  const n = d.nodes[3];
  const [mode, setMode] = useState<"naive" | "twostage">("twostage");
  const restored = mode === "twostage";
  const note = restored ? d.notes.n4vision : d.notes.n4naive;
  return (
    <SceneShell
      id="d-node-4" index={4} total={4} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} captions={n.captions} hint={n.hint} reduce={reduce} {...NAV}
      aside={<NodeCallout c={n.callout} />}
      note={note}
      controls={
        <ControlRow>
          <Toggle on={mode === "naive"} onClick={() => setMode("naive")}>{d.n4modes[0]}</Toggle>
          <Toggle on={mode === "twostage"} onClick={() => setMode("twostage")}>{d.n4modes[1]}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria} draw={(el) => drawPdf(el, { restored, reduce, ui: d.ui })} deps={[mode, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Domains() {
  const { t, lang } = useAcademy();
  const d = t.domains;
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

        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{d.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: 8 }}>
            {d.pipeline.map((label, i) => (
              <a key={i} href={`#d-node-${i + 1}`} className="u-hover-fg-border"
                style={{ display: "flex", gap: 8, alignItems: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13.5, color: "var(--fg)" }}>
                <span style={{ color: "var(--signal-fg)" }}>{label.slice(0, 2)}</span>
                <span>{label.slice(3)}</span>
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
        <Link href="/stage/0/web-scale-ingestion" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {d.prevLesson}</Link>
        <span style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)", opacity: 0.6 }}>{d.nextLesson} →</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
