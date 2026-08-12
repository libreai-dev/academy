"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  totalWork,
  wastedWork,
  speedup,
  memoryState,
  VRAM_GB,
  WEIGHTS_GB,
  fmtTokens,
} from "../lib/kv-cache";
import type { KvDiagram1, KvDiagram2, KvDiagram3 } from "../lib/copy/kv-cache";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * Fonts are in viewBox units (W≈720); kept large so labels stay ≥12px when the
 * card renders down to ~320px on a phone.
 * ======================================================================== */

/* --- Node 1: the rising staircase of wasted work ------------------------ */

function drawNaive(el: SVGSVGElement, o: { n: number; reduce: boolean; d: KvDiagram1 }) {
  const W = 720;
  const H = 470;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 550;

  const x0 = 34;
  const x1 = W - 34;
  const plotW = x1 - x0;
  const baseline = 300;
  const top = 108;
  const plotH = baseline - top;
  const n = Math.max(1, o.n);
  const step = plotW / n;
  const barW = Math.max(3, step * 0.72);
  const unit = plotH / n; // height of one token's work

  // headline: how much of the work was pure repetition
  const wasted = wastedWork(n);
  svg.append("text").attr("x", x0).attr("y", 54).style("fill", "var(--fg)").style("font-family", DISPLAY).style("font-size", "44px").style("font-weight", "600").style("letter-spacing", "-.03em").text(String(wasted));
  svg.append("text").attr("x", x0).attr("y", 90).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "28px").text(o.d.total);

  // baseline
  svg.append("line").attr("x1", x0).attr("y1", baseline).attr("x2", x1).attr("y2", baseline).style("stroke", "var(--hair)").style("stroke-width", 2);

  // bars: amber = recomputed history, a green cap = the one genuinely new token
  const g = svg.selectAll("g.bar").data(d3.range(n)).join("g").attr("class", "bar")
    .attr("transform", (i) => `translate(${x0 + i * step + (step - barW) / 2},0)`);
  g.append("rect")
    .attr("x", 0).attr("width", barW).attr("rx", Math.min(3, barW / 3))
    .style("fill", "var(--tok-sub)").style("fill-opacity", 0.85)
    .attr("y", baseline).attr("height", 0)
    .transition().duration(dur).delay((i) => (o.reduce ? 0 : Math.min(i * 10, 300)))
    .attr("y", (i) => baseline - (i + 1) * unit).attr("height", (i) => (i + 1) * unit);
  g.append("rect")
    .attr("x", 0).attr("width", barW).attr("rx", Math.min(3, barW / 3))
    .style("fill", "var(--signal)")
    .attr("y", baseline).attr("height", 0)
    .transition().duration(dur).delay((i) => (o.reduce ? 0 : Math.min(i * 10, 300)))
    .attr("y", (i) => baseline - (i + 1) * unit).attr("height", Math.max(2, unit));

  // axis caption
  svg.append("text").attr("x", (x0 + x1) / 2).attr("y", 340).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "28px").text(o.d.step);

  // legend (stacked so each label has room on a narrow phone)
  const legend = (y: number, fill: string, label: string) => {
    svg.append("rect").attr("x", x0).attr("y", y - 20).attr("width", 24).attr("height", 24).attr("rx", 5).style("fill", fill);
    svg.append("text").attr("x", x0 + 34).attr("y", y).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "28px").text(label);
  };
  legend(392, "var(--signal)", o.d.newest);
  legend(438, "var(--tok-sub)", o.d.redone);
}

/* --- Node 2: staircase (ghost) vs flat line (cache on) ------------------- */

function drawCompare(el: SVGSVGElement, o: { n: number; cached: boolean; reduce: boolean; d: KvDiagram2 }) {
  const W = 720;
  const H = 400;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 550;

  const x0 = 34;
  const x1 = W - 34;
  const plotW = x1 - x0;
  const baseline = 306;
  const top = 78;
  const plotH = baseline - top;
  const n = Math.max(1, o.n);
  const step = plotW / n;
  const barW = Math.max(3, step * 0.72);
  const unit = plotH / n;

  // baseline
  svg.append("line").attr("x1", x0).attr("y1", baseline).attr("x2", x1).attr("y2", baseline).style("stroke", "var(--hair)").style("stroke-width", 2);

  const g = svg.selectAll("g.bar").data(d3.range(n)).join("g").attr("class", "bar")
    .attr("transform", (i) => `translate(${x0 + i * step + (step - barW) / 2},0)`);

  // ghost outline: what the naive path would do (always visible for reference)
  g.append("rect")
    .attr("x", 0).attr("width", barW).attr("rx", Math.min(3, barW / 3))
    .attr("y", (i) => baseline - (i + 1) * unit).attr("height", (i) => (i + 1) * unit)
    .style("fill", "none").style("stroke", "var(--tok-sub)").style("stroke-width", 1.4).style("stroke-opacity", 0.6);

  // saved region (only when cached): fill between the flat bar and the ghost top
  if (o.cached) {
    g.append("rect")
      .attr("x", 0).attr("width", barW)
      .attr("y", (i) => baseline - (i + 1) * unit).attr("height", (i) => Math.max(0, (i + 1) * unit - unit))
      .style("fill", "var(--signal)").style("fill-opacity", 0.15);
  }

  // solid bars: the actual work in the current mode
  g.append("rect")
    .attr("x", 0).attr("width", barW).attr("rx", Math.min(3, barW / 3))
    .style("fill", "var(--signal)")
    .attr("y", baseline).attr("height", 0)
    .transition().duration(dur).delay((i) => (o.reduce ? 0 : Math.min(i * 8, 240)))
    .attr("y", (i) => baseline - (o.cached ? 1 : i + 1) * unit)
    .attr("height", (i) => Math.max(2, (o.cached ? 1 : i + 1) * unit));

  // labels
  svg.append("text").attr("x", x1).attr("y", top + 6).attr("text-anchor", "end").style("fill", "var(--tok-sub)").style("font-family", MONO).style("font-size", "28px").text(o.d.without);
  svg.append("text").attr("x", x0).attr("y", baseline - unit - 14).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "28px").text(o.d.withCache);
  if (o.cached) {
    svg.append("text").attr("x", (x0 + x1) / 2).attr("y", top + plotH * 0.4).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", DISPLAY).style("font-size", "34px").style("font-weight", "600").style("opacity", 0).text(o.d.saved)
      .transition().duration(dur).style("opacity", 0.92);
  }

  // axis caption
  svg.append("text").attr("x", (x0 + x1) / 2).attr("y", 362).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "28px").text(o.d.step);
}

/* --- Node 3: the VRAM grid the cache eats into -------------------------- */

function drawMemory(el: SVGSVGElement, o: { ctxTokens: number; reduce: boolean; d: KvDiagram3 }) {
  const W = 720;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();

  const m = memoryState(o.ctxTokens);
  const cols = 10;
  const rows = 8; // 80 cells, 1 GB each
  const x0 = 34;
  const gTop = 92;
  const gap = 5;
  const cellW = (W - x0 * 2 - gap * (cols - 1)) / cols;
  const cellH = 26;
  const rowStep = cellH + gap;
  const gridBottom = gTop + rows * rowStep;

  const weightsCells = WEIGHTS_GB;
  const cacheCells = Math.min(VRAM_GB - WEIGHTS_GB, Math.round(m.cache));

  // title
  svg.append("text").attr("x", x0).attr("y", 50).style("fill", "var(--fg)").style("font-family", DISPLAY).style("font-size", "34px").style("font-weight", "600").style("letter-spacing", "-.02em").text(o.d.vram);

  // cells, row-major from the top
  for (let idx = 0; idx < VRAM_GB; idx++) {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const x = x0 + c * (cellW + gap);
    const y = gTop + r * rowStep;
    let fill = "transparent";
    let stroke = "var(--border)";
    let op = 1;
    if (idx < weightsCells) {
      fill = "var(--muted)";
      op = 0.5;
      stroke = "var(--muted)";
    } else if (idx < weightsCells + cacheCells) {
      fill = "var(--signal)";
      op = 0.9;
      stroke = "var(--signal)";
    }
    svg.append("rect").attr("x", x).attr("y", y).attr("width", cellW).attr("height", cellH).attr("rx", 4)
      .style("fill", fill).style("fill-opacity", op).style("stroke", stroke).style("stroke-width", 1.4)
      .style("stroke-opacity", idx < weightsCells + cacheCells ? 0.9 : 0.6);
  }

  // overflow tag: the cache wants more than fits
  let y = gridBottom + 18;
  if (!m.fits) {
    svg.append("rect").attr("x", x0).attr("y", y).attr("width", W - x0 * 2).attr("height", 42).attr("rx", 9)
      .style("fill", "var(--tok-byte)").style("fill-opacity", 0.16).style("stroke", "var(--tok-byte)").style("stroke-width", 1.8);
    svg.append("text").attr("x", W / 2).attr("y", y + 29).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "27px").style("font-weight", "700").text(`${o.d.overflow}  +${m.overflow.toFixed(0)} GB`);
    y += 60;
  }

  // legend (stacked, three lines, so each fits a narrow phone)
  const legend = (ly: number, fill: string, op: number, label: string) => {
    svg.append("rect").attr("x", x0).attr("y", ly - 21).attr("width", 26).attr("height", 26).attr("rx", 5).style("fill", fill).style("fill-opacity", op).style("stroke", fill === "transparent" ? "var(--border)" : fill).style("stroke-opacity", 0.7);
    svg.append("text").attr("x", x0 + 38).attr("y", ly).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "28px").text(label);
  };
  const l0 = y + 8;
  legend(l0, "var(--muted)", 0.5, `${o.d.weights} · ${WEIGHTS_GB} GB`);
  legend(l0 + 44, "var(--signal)", 0.9, `${o.d.cache} · ${m.cache.toFixed(1)} GB`);
  legend(l0 + 88, "transparent", 1, `${o.d.free} · ${m.free.toFixed(0)} GB`);

  svg.attr("viewBox", `0 0 ${W} ${l0 + 110}`);
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

function useKV() {
  const { t } = useAcademy();
  return t.kvCache;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const kv = useKV();
  const n = kv.nodes[0];
  const [len, setLen] = useState(24);
  const total = totalWork(len, false);
  const wasted = wastedWork(len);
  return (
    <SceneShell
      id="kv-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="kv-n1-len" label={kv.n1slider} value={len} display={`${len} ${kv.n1tokensWord}`} min={4} max={48} onChange={setLen} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${len}×` },
          { k: n.rows[1], v: `${total}`, hi: true },
          { k: n.rows[2], v: `${wasted}` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawNaive(el, { n: len, reduce, d: kv.n1diagram })} deps={[len, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

const N2_LEN = 32;

function Node2({ reduce }: { reduce: boolean }) {
  const kv = useKV();
  const n = kv.nodes[1];
  const [cached, setCached] = useState(true); // default ON: show the win first
  const without = totalWork(N2_LEN, false);
  const withC = totalWork(N2_LEN, true);
  const sp = speedup(N2_LEN);
  return (
    <SceneShell
      id="kv-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[cached ? 1 : 0]}
      controls={
        <ControlRow>
          <Toggle on={cached} onClick={() => setCached(true)}>{kv.n2cacheOn}</Toggle>
          <Toggle on={!cached} onClick={() => setCached(false)}>{kv.n2cacheOff}</Toggle>
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${without}` },
          { k: n.rows[1], v: `${withC}`, hi: true },
          { k: n.rows[2], v: `${sp.toFixed(1)}×` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawCompare(el, { n: N2_LEN, cached, reduce, d: kv.n2diagram })} deps={[cached, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const kv = useKV();
  const n = kv.nodes[2];
  const [ctx, setCtx] = useState(48000);
  const m = memoryState(ctx);
  return (
    <SceneShell
      id="kv-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="kv-n3-ctx" label={kv.n3slider} value={ctx} display={`${fmtTokens(ctx)} ${kv.n1tokensWord}`} min={2000} max={160000} step={2000} onChange={setCtx} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${m.cache.toFixed(1)} GB`, hi: true },
          { k: n.rows[1], v: `${Math.round(m.pctOfVram * 100)}%` },
          { k: n.rows[2], v: m.fits ? kv.n3okLabel : kv.n3overflowLabel, hi: !m.fits },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawMemory(el, { ctxTokens: ctx, reduce, d: kv.n3diagram })} deps={[ctx, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function KvCache() {
  const { t, lang } = useAcademy();
  const kv = t.kvCache;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{kv.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {kv.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{kv.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{kv.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {kv.pipeline.map((label, i) => (
              <a key={i} href={`#kv-node-${i + 1}`} className="u-hover-fg-border"
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

      {/* ---- Go deeper ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0" }}>
        <Deeper title={kv.deeperTitle}>{rich(kv.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{kv.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{kv.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(kv.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{kv.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(kv.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/preference-optimization" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {kv.prevLesson}</Link>
        <Link href="/stage/0" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{kv.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
