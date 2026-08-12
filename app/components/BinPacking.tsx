"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import {
  SAMPLE_DOCS,
  L_MIN,
  L_MAX,
  buildStream,
  shuffled,
  packBlocks,
  padStats,
  stepTimings,
  type DocKind,
  type StreamTok,
  type SampleDoc,
} from "../lib/bin-packing";

/* ======================================================================== *
 * Colour per document kind — all via CSS tokens so both themes resolve live.
 * The <eos> marker reuses the signal green (the "special" element).
 * ======================================================================== */
const KIND_TOKEN: Record<DocKind | "eos", string> = {
  word: "--tok-word",
  num: "--tok-num",
  sub: "--tok-sub",
  punct: "--tok-punct",
  byte: "--tok-byte",
  eos: "--signal",
};
const cvar = (k: DocKind | "eos") => `var(${KIND_TOKEN[k]})`;

/* ======================================================================== *
 * Node 1 — two stacked training timelines (tokenize-in-loop vs pre-tokenized).
 * viewBox W=480 → labels at font 18 render ≥12px down to ~320px wide.
 * ======================================================================== */
function drawTimeline(
  el: SVGSVGElement,
  o: { gpuSpeed: number; reduce: boolean; onFlyLabel: string; preLabel: string; idleLabel: string; trainLabel: string },
) {
  const W = 480;
  const H = 236;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 450;

  const x0 = 14;
  const barW = W - 28;
  const barH = 34;
  const steps = 3;
  const stepW = barW / steps;
  const { onFlyIdlePct } = stepTimings(o.gpuSpeed);
  const idleFrac = onFlyIdlePct / 100;

  const row = (yTitle: number, yBar: number, title: string, frac: number, idlePct: number) => {
    svg.append("text").attr("x", x0).attr("y", yTitle).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").text(title);
    svg
      .append("text")
      .attr("x", x0 + barW)
      .attr("y", yTitle)
      .attr("text-anchor", "end")
      .style("fill", idlePct > 0 ? "var(--tok-byte)" : "var(--signal-fg)")
      .style("font-family", MONO)
      .style("font-size", "20px")
      .style("font-weight", "700")
      .text(`${idlePct.toFixed(0)}% idle`);
    // track
    svg.append("rect").attr("x", x0).attr("y", yBar).attr("width", barW).attr("height", barH).attr("rx", 6).style("fill", "var(--surface)").style("stroke", "var(--border)");
    for (let s = 0; s < steps; s++) {
      const sx = x0 + s * stepW;
      const idleW = stepW * frac;
      // GPU-idle segment (waiting on CPU)
      if (idleW > 0.5) {
        const seg = svg.append("rect").attr("x", sx).attr("y", yBar).attr("height", barH).attr("rx", 6).style("fill", "var(--border)").style("fill-opacity", 0.85);
        if (dur) seg.attr("width", 0).transition().duration(dur).attr("width", idleW);
        else seg.attr("width", idleW);
      }
      // GPU-training segment
      const trainW = stepW - idleW;
      const t = svg.append("rect").attr("x", sx + idleW).attr("y", yBar).attr("height", barH).attr("rx", 6).style("fill", "var(--signal)");
      if (dur) t.attr("width", 0).transition().duration(dur).attr("width", Math.max(0, trainW));
      else t.attr("width", Math.max(0, trainW));
      // step divider
      if (s > 0) svg.append("line").attr("x1", sx).attr("y1", yBar).attr("x2", sx).attr("y2", yBar + barH).style("stroke", "var(--bg)").style("stroke-width", 2);
    }
  };

  row(30, 40, o.onFlyLabel, idleFrac, onFlyIdlePct);
  row(114, 124, o.preLabel, 0, 0);

  // legend — stacked so the long labels never collide (font ≥18 = ≥12px @320w)
  const swatch = (y: number, colour: string, opacity: number, text: string) => {
    svg.append("rect").attr("x", x0).attr("y", y - 13).attr("width", 15).attr("height", 15).attr("rx", 3).style("fill", colour).style("fill-opacity", opacity);
    svg.append("text").attr("x", x0 + 22).attr("y", y).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "18px").text(text);
  };
  swatch(190, "var(--border)", 0.85, o.idleLabel);
  swatch(218, "var(--signal)", 1, o.trainLabel);
}

/* ======================================================================== *
 * Node 2 — one continuous stream of coloured token cells + <eos> markers.
 * ======================================================================== */
function drawStream(
  el: SVGSVGElement,
  o: { docs: SampleDoc[]; eosOn: boolean; reduce: boolean; topLabel: string; eosLegend: string },
) {
  const W = 480;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");

  let stream: StreamTok[] = buildStream(o.docs);
  if (!o.eosOn) stream = stream.filter((t) => t.kind !== "eos");

  g.append("text").attr("x", 12).attr("y", 22).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "18px").text(o.topLabel);

  const x0 = 12;
  const y0 = 36;
  const cw = 24;
  const ch = 30;
  const gap = 3;
  let x = x0;
  let y = y0;
  stream.forEach((tk, i) => {
    if (x + cw > W - 12) {
      x = x0;
      y += ch + 8;
    }
    const isEos = tk.kind === "eos";
    const cell = g.append("g").attr("transform", `translate(${x},${y})`);
    if (!o.reduce) cell.style("opacity", 0).transition().duration(220).delay(Math.min(i * 12, 320)).style("opacity", 1);
    cell
      .append("rect")
      .attr("width", cw)
      .attr("height", ch)
      .attr("rx", 6)
      .style("fill", isEos ? cvar("eos") : `color-mix(in srgb, ${cvar(tk.kind)} 20%, transparent)`)
      .style("stroke", isEos ? cvar("eos") : `color-mix(in srgb, ${cvar(tk.kind)} 46%, var(--border))`)
      .style("stroke-width", isEos ? 2 : 1);
    if (isEos) {
      // a small ink tick so the marker reads even in greyscale
      cell.append("text").attr("x", cw / 2).attr("y", ch / 2 + 6).attr("text-anchor", "middle").style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text("⌐");
    }
    x += cw + gap;
  });

  // legend (only meaningful with markers on)
  const ly = y + ch + 26;
  if (o.eosOn) {
    g.append("rect").attr("x", x0).attr("y", ly - 13).attr("width", 15).attr("height", 15).attr("rx", 3).style("fill", cvar("eos"));
    g.append("text").attr("x", x0 + 21).attr("y", ly).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "18px").text(o.eosLegend);
  }
  svg.attr("viewBox", `0 0 ${W} ${ly + 12}`);
}

/* ======================================================================== *
 * Node 3 — the centrepiece. Same tokens, two layouts: pad each document vs
 * pack the continuous stream. viewBox W=480; text at font ≥18 (≥12px @320w).
 * ======================================================================== */
function drawPacking(
  el: SVGSVGElement,
  o: { L: number; reduce: boolean; padLabel: string; packLabel: string; wasted: string; blockWord: string },
) {
  const W = 480;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");

  const x0 = 14;
  const avail = W - x0 * 2;
  const cw = avail / o.L;
  const ch = 20;
  const rowGap = 6;

  const cell = (gx: number, gy: number, fill: string, stroke: string, sw: number, i: number) => {
    const c = g.append("rect").attr("x", gx).attr("y", gy).attr("width", Math.max(1, cw - 1.5)).attr("height", ch).attr("rx", 3).style("fill", fill).style("stroke", stroke).style("stroke-width", sw);
    if (!o.reduce) c.style("opacity", 0).transition().duration(180).delay(Math.min(i * 5, 260)).style("opacity", 1);
    return c;
  };

  // ---- Section A: pad each document ----
  const pad = padStats(SAMPLE_DOCS, o.L);
  g.append("text").attr("x", x0).attr("y", 22).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").text(o.padLabel);
  g.append("text").attr("x", x0 + avail).attr("y", 22).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text(`${pad.wastePct.toFixed(0)}% ${o.wasted}`);
  let y = 34;
  pad.rows.forEach((r) => {
    for (let i = 0; i < o.L; i++) {
      const gx = x0 + i * cw;
      if (i < r.real) cell(gx, y, `color-mix(in srgb, ${cvar(r.kind)} 26%, transparent)`, `color-mix(in srgb, ${cvar(r.kind)} 48%, var(--border))`, 1, i);
      else cell(gx, y, "var(--border)", "var(--bg)", 1, i).style("fill-opacity", 0.45); // padding
    }
    y += ch + rowGap;
  });

  // ---- Section B: pack the stream ----
  const stream = buildStream(SAMPLE_DOCS);
  const { blocks } = packBlocks(stream, o.L);
  const secBY = y + 18;
  g.append("text").attr("x", x0).attr("y", secBY).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").text(o.packLabel);
  g.append("text").attr("x", x0 + avail).attr("y", secBY).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text(`0% ${o.wasted}`);
  y = secBY + 12;
  blocks.forEach((blk) => {
    blk.forEach((tk, i) => {
      const gx = x0 + i * cw;
      const isEos = tk.kind === "eos";
      cell(gx, y, isEos ? cvar("eos") : `color-mix(in srgb, ${cvar(tk.kind)} 26%, transparent)`, isEos ? cvar("eos") : `color-mix(in srgb, ${cvar(tk.kind)} 48%, var(--border))`, isEos ? 1.5 : 1, i);
    });
    // block boundary marker at the right edge
    g.append("line").attr("x1", x0 + o.L * cw).attr("y1", y - 1).attr("x2", x0 + o.L * cw).attr("y2", y + ch + 1).style("stroke", "var(--fg)").style("stroke-width", 1).style("opacity", 0.35);
    y += ch + rowGap;
  });
  g.append("text").attr("x", x0).attr("y", y + 13).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "18px").text(`${blocks.length} × L=${o.L} ${o.blockWord} · every cell full`);

  svg.attr("viewBox", `0 0 ${W} ${y + 26}`);
}

/* ======================================================================== *
 * Diagram mount
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
  return t.binPacking;
}

/* ---- Node 1 ------------------------------------------------------------ */
function Node1({ reduce }: { reduce: boolean }) {
  const bp = useBP();
  const n = bp.nodes[0];
  const [gpuSpeed, setGpuSpeed] = useState(6);
  const { onFlyIdlePct } = stepTimings(gpuSpeed);
  return (
    <SceneShell
      id="bp-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="bp-gpu-speed" label={bp.n1slider} value={gpuSpeed} display={`${gpuSpeed}×`} min={1} max={20} onChange={setGpuSpeed} />
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawTimeline(el, { gpuSpeed, reduce, onFlyLabel: bp.n1onFlyLabel, preLabel: bp.n1preLabel, idleLabel: bp.n1idleLabel, trainLabel: bp.n1trainLabel })}
          deps={[gpuSpeed, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */
function Node2({ reduce }: { reduce: boolean }) {
  const bp = useBP();
  const n = bp.nodes[1];
  const [eosOn, setEosOn] = useState(true);
  const [seed, setSeed] = useState(1);
  const docs = seed === 1 ? SAMPLE_DOCS : shuffled(SAMPLE_DOCS, seed);
  return (
    <SceneShell
      id="bp-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={eosOn ? bp.n2noteEosOn : bp.n2noteEosOff}
      aside={<Callout label={bp.calloutEosLabel} title={bp.calloutEosTitle}>{rich(bp.calloutEosBody)}</Callout>}
      controls={
        <ControlRow>
          <Toggle on={eosOn} onClick={() => setEosOn((v) => !v)}>{bp.n2eosToggle}: {eosOn ? bp.n2eosOn : bp.n2eosOff}</Toggle>
          <Toggle on={false} onClick={() => setSeed((s) => s + 1)}>{bp.n2shuffleToggle}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawStream(el, { docs, eosOn, reduce, topLabel: bp.n2docLegend, eosLegend: bp.n2eosLegend })}
          deps={[docs, eosOn, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */
function Node3({ reduce }: { reduce: boolean }) {
  const bp = useBP();
  const n = bp.nodes[2];
  const [L, setL] = useState(12);
  const pad = padStats(SAMPLE_DOCS, L);
  const stream = buildStream(SAMPLE_DOCS);
  const { blocks } = packBlocks(stream, L);
  return (
    <SceneShell
      id="bp-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<Deeper title={bp.n3deeperTitle}>{rich(bp.n3deeperBody)}</Deeper>}
      controls={
        <Slider id="bp-block-len" label={bp.n3slider} value={L} display={`${L}`} min={L_MIN} max={L_MAX} onChange={setL} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${pad.wastePct.toFixed(0)}%` },
          { k: n.rows[1], v: "0%", hi: true },
          { k: n.rows[2], v: `${blocks.length} × ${L}` },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawPacking(el, { L, reduce, padLabel: bp.n3padLabel, packLabel: bp.n3packLabel, wasted: bp.n3wasted, blockWord: bp.n3blockWord })}
          deps={[L, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */
export default function BinPacking() {
  const { t, lang } = useAcademy();
  const bp = t.binPacking;
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
        <Link href="/stage/0/pii-scrubbing" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {bp.prevLesson}</Link>
        <Link href="/stage/0/rope-math" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{bp.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
