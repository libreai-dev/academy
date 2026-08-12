"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  SEQ_STOPS,
  GRID_DENSITY,
  scoreMatrixBytes,
  bytesToGB,
  GPU_HBM_GB,
  BLOCK_STOPS,
  TILE_N,
  numTiles,
  naiveBytes,
  flashBytes,
  type Sharing,
  SHARINGS,
  QUERY_HEADS,
  kvHeadsFor,
  groupOf,
  kvCacheBytes,
  fmtBytes,
  fmtTokens,
  fmtCount,
} from "../lib/flash-attention";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * Fonts are large in the viewBox so labels stay ≥12px on a ~320px phone card.
 * ======================================================================== */

/* --- Node 1: the memory wall -------------------------------------------- */

function drawWall(
  el: SVGSVGElement,
  o: { seqIdx: number; reduce: boolean; gridLabel: string; axisLabel: string; gpuLabel: string; overflow: string },
) {
  const W = 640;
  const H = 380;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  const n = SEQ_STOPS[o.seqIdx];
  const bytes = scoreMatrixBytes(n);
  const gb = bytesToGB(bytes);
  const over = gb > GPU_HBM_GB;

  // --- the N×N grid, densifying as N grows ---
  const gx = 44;
  const gy = 78;
  const side = 240;
  const g = GRID_DENSITY[o.seqIdx];
  svg.append("text").attr("x", gx + side / 2).attr("y", gy - 22).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").text(o.gridLabel);
  svg.append("rect").attr("x", gx).attr("y", gy).attr("width", side).attr("height", side).attr("rx", 6)
    .style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 2);
  const cell = side / g;
  for (let i = 1; i < g; i++) {
    svg.append("line").attr("x1", gx + i * cell).attr("y1", gy).attr("x2", gx + i * cell).attr("y2", gy + side)
      .style("stroke", "var(--signal)").style("stroke-width", 0.6).style("opacity", 0.5);
    svg.append("line").attr("x1", gx).attr("y1", gy + i * cell).attr("x2", gx + side).attr("y2", gy + i * cell)
      .style("stroke", "var(--signal)").style("stroke-width", 0.6).style("opacity", 0.5);
  }
  // axis: N tokens
  svg.append("text").attr("x", gx + side / 2).attr("y", gy + side + 30).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "18px")
    .text(`${o.axisLabel} · N = ${fmtTokens(n)}`);

  // --- the memory bar vs GPU line ---
  const bx = 470;
  const bw = 96;
  const bTop = 70;
  const bBot = 330;
  const barH = bBot - bTop;
  const cap = 160; // GB shown full-scale
  const yFor = (v: number) => bBot - (barH * Math.min(v, cap)) / cap;

  svg.append("rect").attr("x", bx).attr("y", bTop).attr("width", bw).attr("height", barH).attr("rx", 8)
    .style("fill", "var(--surface)").style("stroke", "var(--border)");

  const h = bBot - yFor(gb);
  const bar = svg.append("rect").attr("x", bx).attr("width", bw).attr("rx", 8)
    .style("fill", over ? "var(--tok-byte)" : "var(--signal)");
  if (dur) bar.attr("y", bBot).attr("height", 0).transition().duration(dur).attr("y", yFor(gb)).attr("height", h);
  else bar.attr("y", yFor(gb)).attr("height", h);

  // GPU capacity line
  const yLine = yFor(GPU_HBM_GB);
  svg.append("line").attr("x1", bx - 14).attr("y1", yLine).attr("x2", bx + bw + 14).attr("y2", yLine)
    .style("stroke", "var(--fg)").style("stroke-width", 2).style("stroke-dasharray", "6 5");
  svg.append("text").attr("x", bx + bw + 20).attr("y", yLine + 6).attr("text-anchor", "start")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "16px").text(o.gpuLabel);

  // value on top of the bar
  svg.append("text").attr("x", bx + bw / 2).attr("y", Math.max(bTop + 26, yFor(gb) - 12)).attr("text-anchor", "middle")
    .style("fill", over ? "var(--tok-byte)" : "var(--signal-fg)").style("font-family", MONO).style("font-size", "24px").style("font-weight", "700")
    .text(fmtBytes(bytes));
  if (over) {
    svg.append("text").attr("x", bx + bw / 2).attr("y", Math.max(bTop + 48, yFor(gb) + 12)).attr("text-anchor", "middle")
      .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").text(o.overflow);
  }
}

/* --- Node 2: naive (whole grid) vs flash (one tile) --------------------- */

function drawTiling(
  el: SVGSVGElement,
  o: { blockIdx: number; reduce: boolean; naiveLabel: string; flashLabel: string; tilesWord: string; sramLabel: string; outLabel: string },
) {
  const W = 680;
  const H = 380;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  const block = BLOCK_STOPS[o.blockIdx];
  const tiles = numTiles(block);
  const naive = naiveBytes();
  const flash = flashBytes(block);

  const gridS = 108;
  const gridX = 22;
  const barX = 158;
  const barX1 = W - 20;
  const barW = barX1 - barX;

  // Both bars share one scale (naive = full) so flash reads as a sliver.
  const wOf = (b: number) => Math.max(4, (barW * b) / naive);

  function row(topY: number, heading: string, tiled: boolean, bytes: number, active: string) {
    const cy = topY + gridS / 2;
    // heading
    svg.append("text").attr("x", gridX).attr("y", topY - 12).attr("text-anchor", "start")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "17px").style("font-weight", "700").text(heading);
    // grid square
    svg.append("rect").attr("x", gridX).attr("y", topY).attr("width", gridS).attr("height", gridS).attr("rx", 5)
      .style("fill", tiled ? "none" : "var(--signal)").style("fill-opacity", tiled ? 0 : 0.85)
      .style("stroke", "var(--signal)").style("stroke-width", 2);
    if (tiled) {
      // partition into vertical tile stripes; highlight the middle one as "in SRAM"
      const stripeW = gridS / tiles;
      const hot = Math.floor(tiles / 2);
      for (let i = 0; i < tiles; i++) {
        svg.append("rect").attr("x", gridX + i * stripeW).attr("y", topY).attr("width", Math.max(0.8, stripeW - 0.8)).attr("height", gridS)
          .style("fill", i === hot ? "var(--signal)" : "var(--signal)").style("fill-opacity", i === hot ? 0.9 : 0.12);
      }
      // running-output column on the right edge
      svg.append("rect").attr("x", gridX + gridS + 6).attr("y", topY).attr("width", 9).attr("height", gridS).attr("rx", 2)
        .style("fill", "var(--signal)").style("fill-opacity", 0.5);
      svg.append("text").attr("x", gridX + gridS + 20).attr("y", topY + gridS + 2).attr("text-anchor", "start")
        .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.outLabel);
      svg.append("text").attr("x", gridX).attr("y", topY + gridS + 22).attr("text-anchor", "start")
        .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "14px").text(`${tiles} ${o.tilesWord} · ${o.sramLabel}`);
    }
    // memory bar
    svg.append("rect").attr("x", barX).attr("y", cy - 22).attr("width", barW).attr("height", 44).attr("rx", 8)
      .style("fill", "var(--surface)").style("stroke", "var(--border)");
    const w = wOf(bytes);
    const bar = svg.append("rect").attr("x", barX).attr("y", cy - 22).attr("height", 44).attr("rx", 8)
      .style("fill", tiled ? "var(--signal)" : "var(--tok-byte)");
    if (dur) bar.attr("width", 0).transition().duration(dur).attr("width", w);
    else bar.attr("width", w);
    svg.append("text").attr("x", barX + w + 12).attr("y", cy + 6).attr("text-anchor", w > barW - 120 ? "end" : "start")
      .attr("x", w > barW - 120 ? barX + w - 12 : barX + w + 12)
      .style("fill", w > barW - 120 ? "#0a0a09" : "var(--fg)").style("font-family", MONO).style("font-size", "20px").style("font-weight", "700")
      .text(fmtBytes(bytes));
    // sublabel under heading
    svg.append("text").attr("x", barX).attr("y", cy - 30).attr("text-anchor", "start")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(active);
  }

  row(50, "NAIVE", false, naive, o.naiveLabel);
  row(240, "FLASHATTENTION", true, flash, o.flashLabel);
}

/* --- Node 3: query heads sharing K/V heads ------------------------------ */

function drawSharing(
  el: SVGSVGElement,
  o: { sharing: Sharing; reduce: boolean; queryLabel: string; kvLabel: string; shareWord: string; cacheMax: number },
) {
  const W = 680;
  const H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 450;

  const kvHeads = kvHeadsFor(o.sharing);
  const cache = kvCacheBytes(kvHeads);

  const qW = 54;
  const qGap = 13;
  const step = qW + qGap;
  const startX = (W - (QUERY_HEADS * qW + (QUERY_HEADS - 1) * qGap)) / 2;
  const qY = 60;
  const qH = 44;
  const kvY = 176;
  const kvH = 44;
  const qCx = (i: number) => startX + i * step + qW / 2;

  // row labels
  svg.append("text").attr("x", startX).attr("y", qY - 16).attr("text-anchor", "start")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").text(`${QUERY_HEADS} ${o.queryLabel}`);
  svg.append("text").attr("x", startX).attr("y", kvY + kvH + 26).attr("text-anchor", "start")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").text(`${kvHeads} ${o.kvLabel}`);

  // wiring first (under the boxes)
  for (let i = 0; i < QUERY_HEADS; i++) {
    const grp = groupOf(i, kvHeads);
    const perGroup = QUERY_HEADS / kvHeads;
    const grpCx = startX + (grp * perGroup + perGroup / 2) * step - qGap / 2;
    const line = svg.append("line").attr("x1", qCx(i)).attr("y1", qY + qH).attr("x2", grpCx).attr("y2", kvY)
      .style("stroke", "var(--signal)").style("stroke-width", 1.6).style("opacity", 0.7);
    if (dur) line.style("opacity", 0).transition().duration(dur).style("opacity", 0.7);
  }

  // query head boxes
  for (let i = 0; i < QUERY_HEADS; i++) {
    svg.append("rect").attr("x", startX + i * step).attr("y", qY).attr("width", qW).attr("height", qH).attr("rx", 8)
      .style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
    svg.append("text").attr("x", qCx(i)).attr("y", qY + qH / 2 + 6).attr("text-anchor", "middle")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "16px").text(`Q${i + 1}`);
  }

  // kv head boxes (span their group)
  const perGroup = QUERY_HEADS / kvHeads;
  for (let gI = 0; gI < kvHeads; gI++) {
    const x0 = startX + gI * perGroup * step;
    const w = perGroup * step - qGap;
    const kvBox = svg.append("rect").attr("x", x0).attr("y", kvY).attr("width", w).attr("height", kvH).attr("rx", 8)
      .style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 2);
    if (dur) kvBox.style("opacity", 0).transition().duration(dur).style("opacity", 1);
    svg.append("text").attr("x", x0 + w / 2).attr("y", kvY + kvH / 2 + 6).attr("text-anchor", "middle")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700")
      .text(perGroup > 1 ? `K/V · ${o.shareWord} ×${perGroup}` : "K/V");
  }

  // KV cache bar
  const barX = 24;
  const barW = W - 48;
  const barY = 286;
  svg.append("rect").attr("x", barX).attr("y", barY).attr("width", barW).attr("height", 34).attr("rx", 8)
    .style("fill", "var(--surface)").style("stroke", "var(--border)");
  const w = Math.max(6, (barW * cache) / o.cacheMax);
  const bar = svg.append("rect").attr("x", barX).attr("y", barY).attr("height", 34).attr("rx", 8).style("fill", "var(--signal)");
  if (dur) bar.attr("width", 0).transition().duration(dur).attr("width", w);
  else bar.attr("width", w);
  svg.append("text").attr("x", barX + w + 12).attr("y", barY + 23).attr("text-anchor", "start")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text(fmtBytes(cache));
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

function useFA() {
  const { t } = useAcademy();
  return t.flashAttention;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const fa = useFA();
  const n = fa.nodes[0];
  const [seqIdx, setSeqIdx] = useState(3);
  const seq = SEQ_STOPS[seqIdx];
  const bytes = scoreMatrixBytes(seq);
  const over = bytesToGB(bytes) > GPU_HBM_GB;
  return (
    <SceneShell
      id="fa-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="fa-seq" label={fa.n1slider} value={seqIdx} display={`${fmtTokens(seq)} tokens`} min={0} max={SEQ_STOPS.length - 1} onChange={setSeqIdx} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${fmtTokens(seq)} tokens` },
          { k: n.rows[1], v: fmtCount(seq * seq) },
          { k: n.rows[2], v: fmtBytes(bytes), hi: true },
          { k: n.rows[3], v: over ? `> ${GPU_HBM_GB} GB` : `${GPU_HBM_GB} GB`, hi: over },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawWall(el, { seqIdx, reduce, gridLabel: fa.n1gridLabel, axisLabel: fa.n1axisLabel, gpuLabel: fa.n1gpuLabel, overflow: fa.n1overflow })} deps={[seqIdx, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const fa = useFA();
  const n = fa.nodes[1];
  const [blockIdx, setBlockIdx] = useState(2);
  const block = BLOCK_STOPS[blockIdx];
  return (
    <SceneShell
      id="fa-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<Deeper title={fa.n2deeperTitle}>{rich(fa.n2deeperBody)}</Deeper>}
      controls={
        <Slider id="fa-block" label={fa.n2slider} value={blockIdx} display={`${fmtTokens(block)} · ${numTiles(block)} ${fa.n2tilesWord}`} min={0} max={BLOCK_STOPS.length - 1} onChange={setBlockIdx} />
      }
      readout={
        <Readout title={`${n.readoutTitle} · N = ${fmtTokens(TILE_N)}`} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${fmtTokens(block)} tokens` },
          { k: n.rows[1], v: String(numTiles(block)) },
          { k: n.rows[2], v: fmtBytes(naiveBytes()) },
          { k: n.rows[3], v: fmtBytes(flashBytes(block)), hi: true },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTiling(el, { blockIdx, reduce, naiveLabel: fa.n2naiveLabel, flashLabel: fa.n2flashLabel, tilesWord: fa.n2tilesWord, sramLabel: fa.n2sramLabel, outLabel: fa.n2outLabel })} deps={[blockIdx, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const fa = useFA();
  const n = fa.nodes[2];
  const [sharing, setSharing] = useState<Sharing>("mha");
  const idx = SHARINGS.indexOf(sharing);
  const manual = useRef(false);
  const cacheMax = kvCacheBytes(kvHeadsFor("mha"));
  const kvHeads = kvHeadsFor(sharing);
  const pick = (s: Sharing) => { setSharing(s); manual.current = true; };
  return (
    <SceneShell
      id="fa-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={SHARINGS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setSharing(SHARINGS[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Deeper title={fa.n3deeperTitle}>{rich(fa.n3deeperBody)}</Deeper>}
      controls={
        <ControlRow>
          {fa.n3seg.map((lab, i) => (
            <Toggle key={i} on={sharing === SHARINGS[i]} onClick={() => pick(SHARINGS[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: fa.n3seg[idx] },
          { k: n.rows[1], v: String(QUERY_HEADS) },
          { k: n.rows[2], v: String(kvHeads), hi: true },
          { k: n.rows[3], v: fmtBytes(kvCacheBytes(kvHeads)), hi: true },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawSharing(el, { sharing, reduce, queryLabel: fa.n3queryLabel, kvLabel: fa.n3kvLabel, shareWord: fa.n3shareWord, cacheMax })} deps={[sharing, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function FlashAttention() {
  const { t, lang } = useAcademy();
  const fa = t.flashAttention;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{fa.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {fa.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{fa.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{fa.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {fa.pipeline.map((label, i) => (
              <a key={i} href={`#fa-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{fa.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{fa.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(fa.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{fa.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(fa.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/long-context" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {fa.prevLesson}</Link>
        <Link href="/stage/0/mixture-of-experts" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{fa.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
