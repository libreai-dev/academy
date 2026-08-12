"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider } from "./webscale-kit";
import {
  CATEGORIES,
  SAFETY_DOCS,
  GATE_THRESHOLD,
  topCategory,
  gateVerdict,
  tally,
  tradeoff,
  fmtCount,
} from "../lib/safety-filtering";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so the CSS design tokens (and theme flips) resolve
 * live. viewBox width is kept at 560 so labels stay ≥12px on a ~300px phone.
 * ======================================================================== */

const VB_W = 560;
const HARM = "var(--tok-byte)"; //  removed / harmful (red)
const FP = "var(--tok-num)"; //     false positive (amber)
const OK = "var(--signal)"; //      kept / safe (green)

/* --- Node 1: the four harm-category detectors --------------------------- */

function drawDetectors(el: SVGSVGElement, o: { sel: number; names: string[]; removeStamp: string; keepLabel: string }) {
  const pad = 14;
  const gapX = 16;
  const gapY = 16;
  const tileW = (VB_W - pad * 2 - gapX) / 2;
  const tileH = 120;
  const stripY = 10 + tileH * 2 + gapY + 20;
  const stripH = 50;
  const H = stripY + stripH + 10;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();

  o.names.forEach((name, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = pad + col * (tileW + gapX);
    const y = 10 + row * (tileH + gapY);
    const active = i === o.sel;
    svg
      .append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", tileW)
      .attr("height", tileH)
      .attr("rx", 16)
      .style("fill", active ? "color-mix(in srgb, var(--tok-byte) 15%, transparent)" : "var(--surface)")
      .style("stroke", active ? HARM : "var(--border)")
      .style("stroke-width", active ? 3 : 1.5);
    // flag glyph on the active tile
    svg
      .append("text")
      .attr("x", x + 18)
      .attr("y", y + 34)
      .style("fill", active ? HARM : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "22px")
      .text(active ? "⚑" : "○");
    // category name
    svg
      .append("text")
      .attr("x", x + 18)
      .attr("y", y + 74)
      .style("fill", active ? "var(--fg)" : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "23px")
      .style("font-weight", active ? 700 : 400)
      .text(name);
    svg
      .append("text")
      .attr("x", x + 18)
      .attr("y", y + tileH - 18)
      .style("fill", active ? HARM : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "20px")
      .style("font-weight", active ? 700 : 400)
      .style("opacity", active ? 1 : 0.45)
      .text(active ? o.removeStamp : "idle");
  });

  // the complement: everything clean is kept
  svg
    .append("rect")
    .attr("x", pad)
    .attr("y", stripY)
    .attr("width", VB_W - pad * 2)
    .attr("height", stripH)
    .attr("rx", 14)
    .style("fill", "color-mix(in srgb, var(--signal) 12%, transparent)")
    .style("stroke", OK)
    .style("stroke-width", 1.5);
  svg
    .append("text")
    .attr("x", VB_W / 2)
    .attr("y", stripY + stripH / 2 + 8)
    .attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)")
    .style("font-family", MONO)
    .style("font-size", "22px")
    .text("✓ " + o.keepLabel);
}

/* --- Node 2: page → classifiers → verdict, with a running tally ---------- */

function drawGate(
  el: SVGSVGElement,
  o: {
    docLabel: string;
    gateLabel: string;
    catNames: string[];
    scores: number[];
    threshold: number;
    flagged: boolean;
    topName: string;
    topScore: number;
    topIdx: number;
    keptWord: string;
    flagWord: string;
    keptTag: string;
    flagTag: string;
    kept: number;
    flaggedCount: number;
    reduce: boolean;
  },
) {
  const H = 470;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 450;
  const pad = 14;
  const w = VB_W - pad * 2;

  // 1) the page chip
  svg.append("rect").attr("x", pad).attr("y", 8).attr("width", w).attr("height", 52).attr("rx", 12).style("fill", "var(--bg)").style("stroke", "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", pad + 18).attr("y", 40).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text("PAGE");
  svg.append("text").attr("x", VB_W - pad - 18).attr("y", 40).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "24px").style("font-weight", 700).text(o.docLabel);

  // connector
  svg.append("line").attr("x1", VB_W / 2).attr("x2", VB_W / 2).attr("y1", 60).attr("y2", 82).style("stroke", "var(--border)").style("stroke-width", 2);

  // 2) the classifier bank
  const gy = 82;
  const gh = 232;
  svg.append("rect").attr("x", pad).attr("y", gy).attr("width", w).attr("height", gh).attr("rx", 14).style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", pad + 18).attr("y", gy + 32).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").style("letter-spacing", ".06em").text(o.gateLabel);

  // per-detector score bars
  const barX0 = pad + 172;
  const barX1 = VB_W - pad - 70;
  const x = d3.scaleLinear().domain([0, 1]).range([barX0, barX1]);
  const rowY0 = gy + 58;
  const rowGap = 42;
  o.catNames.forEach((name, i) => {
    const y = rowY0 + i * rowGap;
    const isTop = i === o.topIdx;
    const trips = o.scores[i] >= o.threshold;
    const color = trips ? HARM : isTop ? "var(--fg)" : "var(--border)";
    svg.append("text").attr("x", pad + 18).attr("y", y + 15).style("fill", isTop ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "20px").style("font-weight", isTop ? 700 : 400).text(name);
    // track
    svg.append("rect").attr("x", barX0).attr("y", y).attr("width", barX1 - barX0).attr("height", 20).attr("rx", 6).style("fill", "var(--bg)").style("stroke", "var(--border)").style("stroke-width", 1);
    // fill
    const bar = svg.append("rect").attr("x", barX0).attr("y", y).attr("height", 20).attr("rx", 6).style("fill", color).style("fill-opacity", trips ? 1 : 0.55);
    const wv = Math.max(3, x(o.scores[i]) - barX0);
    if (dur) bar.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", wv);
    else bar.attr("width", wv);
    // value
    svg.append("text").attr("x", barX1 + 10).attr("y", y + 16).style("fill", trips ? HARM : "var(--muted)").style("font-family", MONO).style("font-size", "20px").style("font-weight", trips ? 700 : 400).text(o.scores[i].toFixed(2));
  });
  // the bar / threshold line across the detector rows
  const tx = x(o.threshold);
  svg.append("line").attr("x1", tx).attr("x2", tx).attr("y1", rowY0 - 8).attr("y2", rowY0 + o.catNames.length * rowGap - rowGap + 28).style("stroke", "var(--fg)").style("stroke-width", 2).style("stroke-dasharray", "5 5");
  svg.append("text").attr("x", tx).attr("y", gy + gh - 10).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "19px").text(`bar ${o.threshold.toFixed(2)}`);

  // connector
  svg.append("line").attr("x1", VB_W / 2).attr("x2", VB_W / 2).attr("y1", gy + gh).attr("y2", gy + gh + 22).style("stroke", "var(--border)").style("stroke-width", 2);

  // 3) the verdict
  const vy = gy + gh + 22;
  const vh = 64;
  const vColor = o.flagged ? HARM : OK;
  svg.append("rect").attr("x", pad).attr("y", vy).attr("width", w).attr("height", vh).attr("rx", 14).style("fill", "color-mix(in srgb, " + vColor + " 14%, transparent)").style("stroke", vColor).style("stroke-width", 2.5);
  const verdictText = o.flagged ? `✕ ${o.flagWord} · ${o.topName}` : `✓ ${o.keptWord}`;
  svg.append("text").attr("x", pad + 18).attr("y", vy + vh / 2 + 9).style("fill", vColor).style("font-family", MONO).style("font-size", "26px").style("font-weight", 700).text(verdictText);
  svg.append("text").attr("x", VB_W - pad - 18).attr("y", vy + vh / 2 + 8).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(`max ${o.topScore.toFixed(2)}`);

  // 4) the running batch tally
  const ty = vy + vh + 30;
  svg.append("text").attr("x", pad).attr("y", ty).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").style("font-weight", 700).text(`${o.keptTag} ${o.kept}`);
  svg.append("text").attr("x", VB_W - pad).attr("y", ty).attr("text-anchor", "end").style("fill", HARM).style("font-family", MONO).style("font-size", "22px").style("font-weight", 700).text(`${o.flagTag} ${o.flaggedCount}`);
  svg.append("text").attr("x", VB_W / 2).attr("y", ty).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(`of ${SAFETY_DOCS.length}`);
}

/* --- Node 3: the strictness tradeoff (two proportion bars) --------------- */

function drawTradeoff(
  el: SVGSVGElement,
  o: {
    harmfulRemoved: number;
    legitLost: number;
    harmfulRow: string;
    legitRow: string;
    removed: string;
    missed: string;
    kept: string;
    wrong: string;
    reduce: boolean;
  },
) {
  const H = 330;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 550;
  const pad = 16;
  const w = VB_W - pad * 2;
  const barH = 56;

  const row = (
    y: number,
    title: string,
    frac: number, // fraction of this population that is filled with `fillColor` from the left
    fillColor: string,
    restColor: string,
    fillWord: string,
    restWord: string,
    fillPct: string,
    flagFill: boolean, // whether the "fill" side is the concerning one (drives the bold %)
  ) => {
    svg.append("text").attr("x", pad).attr("y", y - 12).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "23px").style("font-weight", 700).text(title);
    // track
    svg.append("rect").attr("x", pad).attr("y", y).attr("width", w).attr("height", barH).attr("rx", 12).style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1.5);
    // filled segment (from the left)
    const fw = Math.max(0, w * frac);
    const seg = svg.append("rect").attr("x", pad).attr("y", y).attr("height", barH).attr("rx", 12).style("fill", fillColor).style("fill-opacity", 0.92);
    if (dur) seg.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", fw);
    else seg.attr("width", fw);
    // remainder segment
    const rw = Math.max(0, w - fw);
    svg.append("rect").attr("x", pad + fw).attr("y", y).attr("width", rw).attr("height", barH).attr("rx", 12).style("fill", restColor).style("fill-opacity", 0.32);
    // big % on the fill side
    svg.append("text").attr("x", pad + 14).attr("y", y + barH / 2 + 10).style("fill", "var(--bg)").style("font-family", DISPLAY).style("font-size", "30px").style("font-weight", 700).style("opacity", frac > 0.14 ? 1 : 0).text(fillPct);
    // legend under the bar
    svg.append("text").attr("x", pad).attr("y", y + barH + 30).style("fill", fillColor).style("font-family", MONO).style("font-size", "21px").style("font-weight", flagFill ? 700 : 400).text(`■ ${fillWord} ${fillPct}`);
    svg.append("text").attr("x", pad + w).attr("y", y + barH + 30).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "21px").text(`${restWord}`);
  };

  const hr = o.harmfulRemoved;
  const ll = o.legitLost;
  // Row 1 — harmful pages: removed (good, red) vs missed (grey)
  row(30, o.harmfulRow, hr, HARM, "var(--muted)", o.removed, o.missed, `${(hr * 100).toFixed(0)}%`, false);
  // Row 2 — legit pages: wrongly removed (bad, amber, drawn from the right) so the
  // "kept" green dominates the left. We fill kept green, remainder amber.
  const keptFrac = 1 - ll;
  row(
    182,
    o.legitRow,
    keptFrac,
    OK,
    FP,
    o.kept,
    `${o.wrong} ${(ll * 100).toFixed(1)}%`,
    `${(keptFrac * 100).toFixed(0)}%`,
    false,
  );
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

function useSF() {
  const { t } = useAcademy();
  return t.safetyFiltering;
}

/* ---- Node 1: the harm categories --------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const sf = useSF();
  const n = sf.nodes[0];
  const [sel, setSel] = useState(0);
  return (
    <SceneShell
      id="sf-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[sel]}
      aside={
        <div style={{ border: `1px solid ${HARM}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: "var(--muted)", padding: "9px 13px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>
            <span>{sf.n1docLabel}</span>
            <span style={{ color: HARM, fontWeight: 700 }}>{sf.n1removeStamp}</span>
          </div>
          <div style={{ padding: "13px 14px", fontSize: 15, lineHeight: 1.55, color: "var(--fg)", minHeight: 44 }}>{sf.n1examples[sel]}</div>
        </div>
      }
      controls={
        <ControlRow>
          {sf.n1categories.map((lab, i) => (
            <Toggle key={i} on={sel === i} onClick={() => setSel(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawDetectors(el, { sel, names: sf.n1categories, removeStamp: sf.n1removeStamp, keepLabel: sf.n1keepLabel })}
          deps={[sel]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2: the gate -------------------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const sf = useSF();
  const n = sf.nodes[1];
  const [idx, setIdx] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => { setIdx(i); manual.current = true; };
  const doc = SAFETY_DOCS[idx];
  const top = topCategory(doc);
  const verdict = gateVerdict(doc, GATE_THRESHOLD);
  const topIdx = CATEGORIES.indexOf(top.cat);
  const topName = sf.n1categories[topIdx];
  const { kept, flagged } = tally(GATE_THRESHOLD);
  const scores = CATEGORIES.map((c) => doc.scores[c]);
  return (
    <SceneShell
      id="sf-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={SAFETY_DOCS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {sf.n2docs.map((lab, i) => (
            <Toggle key={i} on={idx === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: sf.n2docs[idx] },
          { k: n.rows[1], v: topName },
          { k: n.rows[2], v: top.score.toFixed(2) },
          { k: n.rows[3], v: verdict.flagged ? `${sf.n2flagWord} · ${topName}` : sf.n2keptWord, hi: !verdict.flagged },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawGate(el, {
            docLabel: sf.n2docs[idx], gateLabel: sf.n2gateLabel, catNames: sf.n1categories, scores,
            threshold: GATE_THRESHOLD, flagged: verdict.flagged, topName, topScore: top.score, topIdx,
            keptWord: sf.n2keptWord, flagWord: sf.n2flagWord, keptTag: sf.n2keptTag, flagTag: sf.n2flagTag,
            kept, flaggedCount: flagged, reduce,
          })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3: the strictness tradeoff ----------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const sf = useSF();
  const n = sf.nodes[2];
  const [strictness, setStrictness] = useState(50);
  const s = tradeoff(strictness);
  const zone = strictness < 34 ? 0 : strictness < 70 ? 1 : 2;
  return (
    <SceneShell
      id="sf-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[zone]}
      controls={
        <Slider id="sf-strictness" label={sf.n3slider} value={strictness} display={`${strictness}`} min={0} max={100} onChange={setStrictness} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${(s.harmfulRemoved * 100).toFixed(0)}%`, hi: true },
          { k: n.rows[1], v: `${(s.legitLost * 100).toFixed(1)}% · ${fmtCount(s.legitLostDocs)}` },
          { k: n.rows[2], v: `${(s.corpusKept * 100).toFixed(1)}%` },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawTradeoff(el, {
            harmfulRemoved: s.harmfulRemoved, legitLost: s.legitLost,
            harmfulRow: sf.n3harmfulRow, legitRow: sf.n3legitRow,
            removed: sf.n3removed, missed: sf.n3missed, kept: sf.n3kept, wrong: sf.n3wrong, reduce,
          })}
          deps={[strictness, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function SafetyFiltering() {
  const { t, lang } = useAcademy();
  const sf = t.safetyFiltering;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{sf.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {sf.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{sf.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{sf.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {sf.pipeline.map((label, i) => (
              <a key={i} href={`#sf-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{sf.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{sf.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(sf.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{sf.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(sf.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/classifier-scoring" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {sf.prevLesson}</Link>
        <Link href="/stage/0/positional-encoding" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{sf.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
