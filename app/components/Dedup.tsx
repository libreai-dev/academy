"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow } from "./webscale-kit";
import {
  type ExactMode,
  signatureCells,
  DOC_A,
  DOC_B,
  EMBEDDINGS,
  semDedup,
  funnel,
} from "../lib/dedup";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

const CLUSTER_FILL = ["var(--tok-word)", "var(--tok-num)", "var(--tok-sub)", "var(--tok-space)"];

/* --- Node 1: the memorization gate -------------------------------------- */

function drawMemoGate(el: SVGSVGElement, o: { step: number; strength: number; reduce: boolean }) {
  const W = 760;
  const H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 460;
  const gated = o.step >= 1;

  // Incoming document blocks — a mix of unique (green) and duplicate (red).
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

  // Gate column.
  svg.append("rect").attr("x", gateX).attr("y", 24).attr("width", 16).attr("height", H - 48).attr("rx", 8)
    .style("fill", gated ? "var(--signal)" : "var(--border)")
    .style("opacity", gated ? 1 : 0.5);
  svg.append("text").attr("x", gateX + 8).attr("y", 16).attr("text-anchor", "middle")
    .style("fill", gated ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "10.5px")
    .text(gated ? "DEDUP GATE" : "NO GATE");

  docs.forEach((d, i) => {
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

    // Flow line from doc toward the gate.
    if (!dropped) {
      const line = svg.append("line").attr("x1", docX + docW + 44).attr("y1", d.y + 18).attr("y2", d.y + 18)
        .style("stroke", col).style("stroke-width", 1.5).style("opacity", 0.6);
      line.attr("x2", docX + docW + 44);
      if (dur) line.transition().duration(dur).attr("x2", gateX); else line.attr("x2", gateX);
    } else {
      // Blocked at the gate: a short stub + a small ✕.
      svg.append("line").attr("x1", docX + docW + 44).attr("y1", d.y + 18).attr("x2", gateX - 10).attr("y2", d.y + 18)
        .style("stroke", col).style("stroke-width", 1.5).style("stroke-dasharray", "3 3").style("opacity", 0.35);
      svg.append("text").attr("x", gateX - 4).attr("y", d.y + 22).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-size", "13px").style("font-family", MONO).text("✕");
    }
  });

  // The weight matrix on the right: input nodes → output nodes.
  const inX = gateX + 90;
  const outX = W - 70;
  const nodeYs = [70, 140, 210, 280];
  const rigid = !gated; // step 0 = memorized/rigid; step 1 = balanced
  // Links.
  nodeYs.forEach((y1) => {
    nodeYs.forEach((y2, j) => {
      // Rigid: every link heavy + red. Balanced: a sparse, even subset, thin green.
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

/* --- Node 2: exact dedup engine ----------------------------------------- */

function drawExact(el: SVGSVGElement, o: { step: number; mode: ExactMode; strip: boolean; reduce: boolean }) {
  const W = 760;
  const H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 460;
  const active = o.step >= 1;

  if (o.mode === "hash") {
    // A row of documents → SHA box → bit-array lookup; matches drop.
    const docs = [0, 1, 2, 3, 4, 5];
    const dupIdx = new Set([1, 3, 4]); // byte-identical dupes
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
    // SHA box
    const shaX = 200;
    svg.append("rect").attr("x", shaX).attr("y", 120).attr("width", 120).attr("height", 96).attr("rx", 10).style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 1.6);
    svg.append("text").attr("x", shaX + 60).attr("y", 165).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").text("SHA-256");
    svg.append("text").attr("x", shaX + 60).attr("y", 185).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10px").text("O(1) lookup");
    // bit-array lookup table
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

  // Suffix-array span trimming: one long doc with a boilerplate span sliced out.
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
      // green slicing laser
      const laser = svg.append("line").attr("x1", docX).attr("y1", y + (rh - 12) / 2).attr("x2", docX).attr("y2", y + (rh - 12) / 2)
        .style("stroke", "var(--signal)").style("stroke-width", 2.5);
      if (dur) laser.transition().duration(dur).attr("x2", docX + docW); else laser.attr("x2", docX + docW);
      svg.append("text").attr("x", docX + docW + 10).attr("y", y + 22).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "10px").text("sliced");
    }
  });
  svg.append("text").attr("x", docX).attr("y", 28).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px").text("ONE UNIQUE FILE · suffix-array span scan");
}

/* --- Node 3: MinHash signatures ----------------------------------------- */

function drawMinHash(el: SVGSVGElement, o: { step: number; shingleN: number; numPerm: number; reduce: boolean }) {
  const W = 760;
  const H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  // Step 0: show the two docs cut into shingles (word chips, body shared).
  const wordsA = DOC_A.split(/\s+/).slice(0, 22);
  const wordsB = DOC_B.split(/\s+/).slice(0, 22);
  const drawWords = (words: string[], y: number, label: string) => {
    svg.append("text").attr("x", 20).attr("y", y - 10).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px").text(label);
    let x = 20;
    words.forEach((w, i) => {
      const wpx = Math.max(26, w.length * 7.4 + 12);
      if (x + wpx > W - 20) return;
      // body words (index >= 2 and within shared region) are "shared"
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

  // Step 1: two signature strips; matching cells glow green.
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

  // Connective note between them.
  const matched = cells.filter(Boolean).length;
  svg.append("text").attr("x", gridX).attr("y", 245).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px")
    .text(`${matched} / ${cells.length} cells agree  →  est. Jaccard ≈ ${(matched / cells.length).toFixed(2)}`);
  svg.append("text").attr("x", gridX).attr("y", 268).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "10.5px")
    .text("more permutations → the estimate tightens toward the true similarity");
}

/* --- Node 5: embedding cluster map -------------------------------------- */

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

  // Emphasis ring around the densest cluster (cluster 0).
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

/* --- Node 6: the funnel + density gauge --------------------------------- */

function drawFunnel(el: SVGSVGElement, o: { enabled: [boolean, boolean, boolean]; reduce: boolean }) {
  const W = 760;
  const H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  // Compute cumulative volumes after each enabled stage.
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

  // Density gauge on the right.
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

function useDedup() {
  const { t } = useAcademy();
  return t.dedup;
}

function Node1({ reduce }: { reduce: boolean }) {
  const d = useDedup();
  const n = d.nodes[0];
  return (
    <SceneShell
      id="dd-node-1" index={1} total={5} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      controls={null}
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawMemoGate(el, { step, strength: 62, reduce })} deps={[step, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const d = useDedup();
  const n = d.nodes[1];
  return (
    <SceneShell
      id="dd-node-2" index={2} total={5} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      controls={null}
      readout={null}
    >
      {() => (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <Cap>{d.n2modes[0]}</Cap>
            <div style={{ marginTop: 8 }}><DiagramSvg label={d.n2modes[0]} draw={(el) => drawExact(el, { step: 1, mode: "hash", strip: true, reduce })} deps={[reduce]} /></div>
          </div>
          <div>
            <Cap>{d.n2modes[1]}</Cap>
            <div style={{ marginTop: 8 }}><DiagramSvg label={d.n2modes[1]} draw={(el) => drawExact(el, { step: 1, mode: "suffix", strip: true, reduce })} deps={[reduce]} /></div>
          </div>
        </div>
      )}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const d = useDedup();
  const n = d.nodes[2];
  return (
    <SceneShell
      id="dd-node-3" index={3} total={5} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      aside={
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>{d.n3docA}</div>
          <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>{DOC_A.slice(0, 96)}…</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>{d.n3docB}</div>
          <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>{DOC_B.slice(0, 96)}…</div>
        </div>
      }
      controls={null}
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawMinHash(el, { step, shingleN: 5, numPerm: 128, reduce })} deps={[step, reduce]} />}
    </SceneShell>
  );
}

function Node4({ reduce }: { reduce: boolean }) {
  const d = useDedup();
  const n = d.nodes[3];
  return (
    <SceneShell
      id="dd-node-4" index={4} total={5} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      controls={null}
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria ?? n.title} draw={(el) => drawClusters(el, { step, radius: 1.0, eps: 0.05, reduce })} deps={[step, reduce]} />}
    </SceneShell>
  );
}

function Node5({ reduce }: { reduce: boolean }) {
  const d = useDedup();
  const n = d.nodes[4];
  // scroll builds the funnel up: none → +exact → +fuzzy → +semantic
  const [enabled, setEnabled] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const manual = useRef(false);
  const set = (idx: number) => { setEnabled((p) => { const q = [...p] as [boolean, boolean, boolean]; q[idx] = !q[idx]; return q; }); manual.current = true; };
  return (
    <SceneShell
      id="dd-node-5" index={5} total={5} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={4} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setEnabled([s >= 1, s >= 2, s >= 3]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step"
      controls={
        <ControlRow>
          {d.n6toggles.map((label, i) => (
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

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Dedup() {
  const { t, lang } = useAcademy();
  const d = t.dedup;
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
              <a key={i} href={`#dd-node-${i + 1}`} className="u-hover-fg-border"
                style={{ display: "flex", gap: 8, alignItems: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13.5, color: "var(--fg)" }}>
                <span style={{ color: "var(--signal-fg)" }}>{String(i + 1).padStart(2, "0")}</span>
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
        <Link href="/stage/0/domain-sources" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {d.prevLesson}</Link>
        <Link href="/stage/0/data-recipe" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{d.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
