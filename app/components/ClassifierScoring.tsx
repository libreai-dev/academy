"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider } from "./webscale-kit";
import {
  TRAIN_SOURCES,
  SIGNALS,
  SIGNALS_DEFAULT,
  SCORE_BASE,
  scoreFrom,
  HIST,
  HIST_BINS,
  HIST_MAX,
  binCenter,
  keepStats,
  SAMPLE_DOCS,
  fmtCount,
  fmtTokens,
} from "../lib/classifier-scoring";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so the CSS design tokens (and theme flips) resolve
 * live. viewBox width is kept at 560 and the smallest label is 24 units, so
 * text renders ≥12px even when the card is only ~300px wide on a phone.
 * ======================================================================== */

const VB_W = 560;

/* --- Node 1: sort the current example into its labelled pile ------------- */

function drawBins(
  el: SVGSVGElement,
  o: { activeIdx: number; reduce: boolean; goodBin: string; badBin: string; goodTag: string; badTag: string },
) {
  const H = 320;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  const active = TRAIN_SOURCES[o.activeIdx];
  const goods = TRAIN_SOURCES.map((s, i) => ({ s, i })).filter((d) => d.s.label === "good");
  const bads = TRAIN_SOURCES.map((s, i) => ({ s, i })).filter((d) => d.s.label === "bad");

  const bin = (
    y: number,
    label: string,
    tag: string,
    members: { s: (typeof TRAIN_SOURCES)[number]; i: number }[],
    isActive: boolean,
    color: string,
  ) => {
    const x = 16;
    const w = VB_W - 32;
    const h = 128;
    svg
      .append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .attr("rx", 16)
      .style("fill", isActive ? "var(--signal-wash)" : "var(--surface)")
      .style("stroke", isActive ? color : "var(--border)")
      .style("stroke-width", isActive ? 3 : 1.5);
    // header label + tag
    svg
      .append("text")
      .attr("x", x + 20)
      .attr("y", y + 38)
      .style("fill", "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", "24px")
      .style("font-weight", 700)
      .text(label);
    svg
      .append("text")
      .attr("x", x + w - 20)
      .attr("y", y + 38)
      .attr("text-anchor", "end")
      .style("fill", color)
      .style("font-family", MONO)
      .style("font-size", "24px")
      .text(tag);
    // member dots, evenly spread across the lower half of the bin
    const cy = y + h - 40;
    const gap = w / (members.length + 1);
    members.forEach((m, j) => {
      const cx = x + gap * (j + 1);
      const isCur = m.i === o.activeIdx;
      const dot = svg
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", isCur ? 18 : 12)
        .style("fill", isCur ? color : "var(--border)")
        .style("fill-opacity", isCur ? 1 : 0.5)
        .style("stroke", isCur ? "var(--bg)" : "none")
        .style("stroke-width", 3);
      if (isCur && dur) {
        dot.attr("r", 0).transition().duration(dur).ease(d3.easeBackOut).attr("r", 18);
        svg
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 18)
          .style("fill", "none")
          .style("stroke", color)
          .style("stroke-width", 3)
          .style("opacity", 0.9)
          .transition()
          .duration(dur * 1.6)
          .ease(d3.easeCubicOut)
          .attr("r", 34)
          .style("opacity", 0);
      }
    });
  };

  const goodActive = active.label === "good";
  bin(16, o.goodBin, o.goodTag, goods, goodActive, "var(--signal)");
  bin(176, o.badBin, o.badTag, bads, !goodActive, "var(--tok-byte)");
}

/* --- Node 2: signals stack into a 0→1 quality score --------------------- */

function drawMeter(
  el: SVGSVGElement,
  o: {
    on: boolean[];
    reduce: boolean;
    scoreCap: string;
    wordHigh: string;
    wordMid: string;
    wordLow: string;
    low: string;
    high: string;
  },
) {
  const H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;
  const score = scoreFrom(o.on);
  const x0 = 40;
  const x1 = VB_W - 40;
  const x = d3.scaleLinear().domain([0, 1]).range([x0, x1]);
  const trackY = 150;
  const trackH = 40;
  const good = score >= 0.6;
  const mid = score >= 0.35 && score < 0.6;
  const scoreColor = good ? "var(--signal)" : mid ? "var(--tok-sub)" : "var(--tok-byte)";
  const word = good ? o.wordHigh : mid ? o.wordMid : o.wordLow;

  // caption + big number + verdict word
  svg
    .append("text")
    .attr("x", x0)
    .attr("y", 44)
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "24px")
    .style("letter-spacing", ".06em")
    .text(o.scoreCap);
  svg
    .append("text")
    .attr("x", x0)
    .attr("y", 104)
    .style("fill", scoreColor)
    .style("font-family", DISPLAY)
    .style("font-size", "58px")
    .style("font-weight", 700)
    .text(score.toFixed(2));
  svg
    .append("text")
    .attr("x", x0 + 160)
    .attr("y", 104)
    .style("fill", "var(--fg)")
    .style("font-family", MONO)
    .style("font-size", "26px")
    .text(word);

  // track background
  svg
    .append("rect")
    .attr("x", x0)
    .attr("y", trackY)
    .attr("width", x1 - x0)
    .attr("height", trackH)
    .attr("rx", 10)
    .style("fill", "var(--surface)")
    .style("stroke", "var(--border)");

  // base segment (grey) then one green segment per active signal
  let cursor = 0;
  const seg = (from: number, to: number, fill: string, opacity: number) => {
    const gx = x(from);
    const gw = Math.max(0, x(to) - x(from));
    const r = svg
      .append("rect")
      .attr("x", gx)
      .attr("y", trackY)
      .attr("height", trackH)
      .attr("rx", 10)
      .style("fill", fill)
      .style("fill-opacity", opacity);
    if (dur) r.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", gw);
    else r.attr("width", gw);
  };
  seg(0, SCORE_BASE, "var(--border)", 0.9);
  cursor = SCORE_BASE;
  SIGNALS.forEach((s, i) => {
    if (!o.on[i]) return;
    seg(cursor, cursor + s.delta, "var(--signal)", 0.9 - i * 0.06);
    cursor += s.delta;
  });

  // score marker line
  svg
    .append("line")
    .attr("x1", x(score))
    .attr("x2", x(score))
    .attr("y1", trackY - 12)
    .attr("y2", trackY + trackH + 12)
    .style("stroke", "var(--fg)")
    .style("stroke-width", 3);

  // axis ends: 0 / junk … 1 / gold
  svg.append("text").attr("x", x0).attr("y", trackY + trackH + 40).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "24px").text(`0 · ${o.low}`);
  svg.append("text").attr("x", x1).attr("y", trackY + trackH + 40).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "24px").text(`${o.high} · 1`);
}

/* --- Node 3: score histogram + movable keep threshold ------------------- */

function drawHistogram(
  el: SVGSVGElement,
  o: {
    threshold: number;
    reduce: boolean;
    samples: string[];
    keptTag: string;
    keepLabel: string;
    ofWeb: string;
    low: string;
    high: string;
  },
) {
  const H = 384;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;
  const L = 20;
  const R = 20;
  const axisY = 292;
  const topY = 78;
  const x = d3.scaleLinear().domain([0, 1]).range([L, VB_W - R]);
  const barH = (f: number) => (f / HIST_MAX) * (axisY - topY);

  const { keptFrac } = keepStats(o.threshold);

  // bars
  const bw = (x(1 / HIST_BINS) - x(0)) - 4;
  for (let i = 0; i < HIST_BINS; i++) {
    const c = binCenter(i);
    const kept = c >= o.threshold;
    const bx = x(i / HIST_BINS) + 2;
    const h = barH(HIST[i]);
    const rect = svg
      .append("rect")
      .attr("x", bx)
      .attr("width", Math.max(2, bw))
      .attr("rx", 3)
      .style("fill", kept ? "var(--signal)" : "var(--border)")
      .style("fill-opacity", kept ? 0.92 : 0.6);
    if (dur) rect.attr("y", axisY).attr("height", 0).transition().duration(dur).delay(i * 12).ease(d3.easeCubicOut).attr("y", axisY - h).attr("height", h);
    else rect.attr("y", axisY - h).attr("height", h);
  }

  // kept share, top-left
  svg
    .append("text")
    .attr("x", L)
    .attr("y", 40)
    .style("fill", "var(--signal-fg)")
    .style("font-family", DISPLAY)
    .style("font-size", "40px")
    .style("font-weight", 700)
    .text(`${(keptFrac * 100).toFixed(1)}%`);
  svg
    .append("text")
    .attr("x", L)
    .attr("y", 66)
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "24px")
    .text(`${o.keptTag} ${o.ofWeb}`);

  // axis line
  svg.append("line").attr("x1", L).attr("x2", VB_W - R).attr("y1", axisY).attr("y2", axisY).style("stroke", "var(--border)").style("stroke-width", 2);

  // threshold line + label (through bars and the sample lane)
  const tx = x(o.threshold);
  svg
    .append("line")
    .attr("x1", tx)
    .attr("x2", tx)
    .attr("y1", 74)
    .attr("y2", axisY + 60)
    .style("stroke", "var(--signal)")
    .style("stroke-width", 3)
    .style("stroke-dasharray", "6 5");
  const nearRight = o.threshold > 0.62;
  svg
    .append("text")
    .attr("x", nearRight ? tx - 10 : tx + 10)
    .attr("y", 72)
    .attr("text-anchor", nearRight ? "end" : "start")
    .style("fill", "var(--signal-fg)")
    .style("font-family", MONO)
    .style("font-size", "24px")
    .style("font-weight", 700)
    .text(`${o.keepLabel} ${o.threshold.toFixed(2)}`);

  // sample pages, plotted at their score on a lane under the axis
  SAMPLE_DOCS.forEach((d, i) => {
    const sx = x(d.score);
    const kept = d.score >= o.threshold;
    const color = kept ? "var(--signal)" : "var(--muted)";
    svg.append("line").attr("x1", sx).attr("x2", sx).attr("y1", axisY).attr("y2", axisY + 16).style("stroke", color).style("stroke-width", 2);
    svg.append("circle").attr("cx", sx).attr("cy", axisY + 16).attr("r", 7).style("fill", color);
    // keep label off the edges; anchor by position
    const anchor = d.score < 0.2 ? "start" : d.score > 0.8 ? "end" : "middle";
    const lx = d.score < 0.2 ? sx - 6 : d.score > 0.8 ? sx + 6 : sx;
    svg
      .append("text")
      .attr("x", lx)
      .attr("y", axisY + 44)
      .attr("text-anchor", anchor)
      .style("fill", color)
      .style("font-family", MONO)
      .style("font-size", "24px")
      .style("font-weight", kept ? 700 : 400)
      .text(`${kept ? "✓" : "✕"} ${o.samples[i]}`);
  });

  // x-axis ticks: junk … gold
  svg.append("text").attr("x", L).attr("y", axisY + 78).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "24px").text(`0 · ${o.low}`);
  svg.append("text").attr("x", VB_W - R).attr("y", axisY + 78).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "24px").text(`${o.high} · 1`);
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

function useCS() {
  const { t } = useAcademy();
  return t.classifierScoring;
}

/* ---- Node 1: the training signal --------------------------------------- */

/** The current example shown as a page, plus the good/bad sort diagram. */
function TrainPanel({ cs, idx, reduce }: { cs: ReturnType<typeof useCS>; idx: number; reduce: boolean }) {
  const isGood = TRAIN_SOURCES[idx].label === "good";
  const tag = isGood ? cs.n1goodTag : cs.n1badTag;
  const tagColor = isGood ? "var(--signal)" : "var(--tok-byte)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ border: `1px solid ${tagColor}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: "var(--muted)", padding: "9px 13px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>
          <span>{cs.n1previewLabel}</span>
          <span style={{ color: tagColor, fontWeight: 700 }}>{tag}</span>
        </div>
        <div style={{ padding: "13px 14px", fontSize: 15, lineHeight: 1.55, color: "var(--fg)", minHeight: 66 }}>{cs.n1examples[idx]}</div>
      </div>
      <DiagramSvg
        label={cs.nodes[0].aria ?? ""}
        draw={(el) => drawBins(el, { activeIdx: idx, reduce, goodBin: cs.n1goodBin, badBin: cs.n1badBin, goodTag: cs.n1goodTag, badTag: cs.n1badTag })}
        deps={[idx, reduce]}
      />
    </div>
  );
}

function Node1({ reduce }: { reduce: boolean }) {
  const cs = useCS();
  const n = cs.nodes[0];
  const [idx, setIdx] = useState(0);
  return (
    <SceneShell
      id="cs-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {cs.n1sources.map((lab, i) => (
            <Toggle key={i} on={idx === i} onClick={() => setIdx(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <TrainPanel cs={cs} idx={idx} reduce={reduce} />}
    </SceneShell>
  );
}

/* ---- Node 2: scoring a page -------------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const cs = useCS();
  const n = cs.nodes[1];
  const [on, setOn] = useState<boolean[]>(SIGNALS_DEFAULT);
  const [last, setLast] = useState(-1);
  const score = scoreFrom(on);
  const verdict = score >= 0.6 ? cs.n2verdictHigh : score >= 0.35 ? cs.n2verdictMid : cs.n2verdictLow;
  const note = last >= 0 ? n.optionNotes?.[last] : verdict;
  return (
    <SceneShell
      id="cs-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      aside={
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: "var(--muted)", padding: "9px 13px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>{cs.n2docLabel}</div>
          <div style={{ padding: "12px 14px", fontSize: 14.5, lineHeight: 1.55, color: "var(--fg)" }}>{cs.n2docText}</div>
        </div>
      }
      controls={
        <ControlRow>
          {cs.n2signals.map((lab, i) => (
            <Toggle key={i} on={on[i]} onClick={() => { setOn((p) => p.map((v, j) => (j === i ? !v : v))); setLast(i); }}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawMeter(el, { on, reduce, scoreCap: cs.n2scoreCap, wordHigh: cs.n2wordHigh, wordMid: cs.n2wordMid, wordLow: cs.n2wordLow, low: cs.n2low, high: cs.n2high })}
          deps={[on, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3: the threshold --------------------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const cs = useCS();
  const n = cs.nodes[2];
  const [threshold, setThreshold] = useState(0.5);
  const stats = keepStats(threshold);
  return (
    <SceneShell
      id="cs-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="cs-threshold" label={cs.n3slider} value={threshold} display={threshold.toFixed(2)} min={0} max={1} step={0.01} onChange={setThreshold} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${fmtCount(stats.keptDocs)} docs`, hi: true },
          { k: n.rows[1], v: `${(stats.keptFrac * 100).toFixed(1)}%` },
          { k: n.rows[2], v: `${fmtTokens(stats.keptTokens)} tok` },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawHistogram(el, { threshold, reduce, samples: cs.n3samples, keptTag: cs.n3keptTag, keepLabel: cs.n3keepLabel, ofWeb: cs.n3ofWeb, low: cs.n3low, high: cs.n3high })}
          deps={[threshold, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function ClassifierScoring() {
  const { t, lang } = useAcademy();
  const cs = t.classifierScoring;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{cs.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {cs.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{cs.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{cs.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {cs.pipeline.map((label, i) => (
              <a key={i} href={`#cs-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{cs.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{cs.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(cs.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{cs.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(cs.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/extraction-parsing" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {cs.prevLesson}</Link>
        <Link href="/stage/0/safety-filtering" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{cs.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
