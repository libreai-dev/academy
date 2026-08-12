"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import {
  N1_PROBS,
  surprise,
  W_MIN,
  W_MAX,
  W_OPT,
  W_START,
  lossAt,
  gdStep,
  rateRegime,
  valleyCurve,
  trainLoss,
  tokensSeen,
  trainCurve,
  fmtTokens,
} from "../lib/how-models-learn";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

/* --- Node 1: next-token guess → loss ------------------------------------ */

function drawGuess(
  el: SVGSVGElement,
  o: {
    sel: number;
    words: string[];
    probs: readonly number[];
    axisLabel: string;
    trueTag: string;
    lossTag: string;
    reduce: boolean;
  },
) {
  const W = 760;
  const H = 430;
  const m = { top: 64, right: 24, bottom: 54, left: 24 };
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 450;

  const x = d3.scaleBand<number>().domain(d3.range(o.words.length)).range([m.left, W - m.right]).padding(0.34);
  const y = d3.scaleLinear().domain([0, 0.72]).range([H - m.bottom, m.top]);

  // y-axis caption (top-left)
  svg.append("text").attr("x", m.left).attr("y", 26).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.axisLabel);

  // baseline
  svg.append("line").attr("x1", m.left).attr("y1", H - m.bottom).attr("x2", W - m.right).attr("y2", H - m.bottom).style("stroke", "var(--hair)").style("stroke-width", 1.5);

  const bw = x.bandwidth();
  o.words.forEach((word, i) => {
    const p = o.probs[i] ?? 0;
    const bx = x(i)!;
    const bh = (H - m.bottom) - y(p);
    const picked = i === o.sel;
    const bar = svg.append("rect")
      .attr("x", bx)
      .attr("width", bw)
      .attr("rx", 6)
      .style("fill", picked ? "var(--signal)" : "var(--border)")
      .style("fill-opacity", picked ? 1 : 0.55);
    if (dur) bar.attr("y", H - m.bottom).attr("height", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("y", y(p)).attr("height", bh);
    else bar.attr("y", y(p)).attr("height", bh);

    // percentage label above each bar
    svg.append("text").attr("x", bx + bw / 2).attr("y", y(p) - 8).attr("text-anchor", "middle").style("fill", picked ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("font-weight", picked ? 700 : 400).text(`${Math.round(p * 100)}%`);

    // word label under each bar
    svg.append("text").attr("x", bx + bw / 2).attr("y", H - m.bottom + 24).attr("text-anchor", "middle").style("fill", picked ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "14px").style("font-weight", picked ? 700 : 400).text(word);
  });

  // The chosen bar carries the loss: a tag above + the big number.
  const sp = o.probs[o.sel] ?? 0;
  const sbx = x(o.sel)! + bw / 2;
  const loss = surprise(sp);
  svg.append("text").attr("x", sbx).attr("y", 48).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text("↑ " + o.trueTag);

  // big loss readout, right side of the plot
  const lx = W - m.right;
  svg.append("text").attr("x", lx).attr("y", 26).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.lossTag);
  const big = svg.append("text").attr("x", lx).attr("y", 56).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", DISPLAY).style("font-size", "34px").style("font-weight", 600).text(`loss ${loss.toFixed(2)}`);
  if (dur) big.style("opacity", 0).transition().duration(dur).style("opacity", 1);
}

/* --- Node 2: gradient descent on a one-weight loss valley --------------- */

function drawValley(
  el: SVGSVGElement,
  o: {
    w: number;
    prevW: number;
    trail: number[];
    steps: number;
    xLabel: string;
    lossLabel: string;
    minTag: string;
    youTag: string;
    stepsWord: string;
    reduce: boolean;
  },
) {
  const W = 760;
  const H = 380;
  const m = { top: 40, right: 26, bottom: 44, left: 26 };
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  const x = d3.scaleLinear().domain([W_MIN, W_MAX]).range([m.left, W - m.right]);
  const yMax = lossAt(W_MIN);
  const y = d3.scaleLinear().domain([0, yMax]).range([H - m.bottom, m.top]);

  // axis captions
  svg.append("text").attr("x", m.left).attr("y", 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.lossLabel);
  svg.append("text").attr("x", W - m.right).attr("y", H - 12).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.xLabel);
  svg.append("line").attr("x1", m.left).attr("y1", H - m.bottom).attr("x2", W - m.right).attr("y2", H - m.bottom).style("stroke", "var(--hair)").style("stroke-width", 1.5);

  // the valley curve
  const curve = valleyCurve();
  const line = d3.line<{ w: number; l: number }>().x((d) => x(d.w)).y((d) => y(d.l)).curve(d3.curveBasis);
  svg.append("path").datum(curve).attr("d", line).style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 2);

  // minimum marker
  svg.append("circle").attr("cx", x(W_OPT)).attr("cy", y(lossAt(W_OPT))).attr("r", 4).style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2);
  svg.append("text").attr("x", x(W_OPT)).attr("y", y(lossAt(W_OPT)) + 26).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.minTag);

  // trail of previous positions
  o.trail.slice(-14).forEach((tw, i, arr) => {
    svg.append("circle").attr("cx", x(tw)).attr("cy", y(lossAt(tw))).attr("r", 3).style("fill", "var(--signal)").style("fill-opacity", 0.18 + 0.5 * (i / Math.max(1, arr.length)));
  });

  // the ball
  const cyNow = y(lossAt(o.w));
  const ball = svg.append("circle").attr("r", 9).style("fill", "var(--signal)").style("stroke", "var(--bg)").style("stroke-width", 2);
  if (dur && o.prevW !== o.w) {
    ball.attr("cx", x(o.prevW)).attr("cy", y(lossAt(o.prevW))).transition().duration(dur).ease(d3.easeCubicInOut).attr("cx", x(o.w)).attr("cy", cyNow);
  } else {
    ball.attr("cx", x(o.w)).attr("cy", cyNow);
  }
  svg.append("text").attr("x", x(o.w)).attr("y", cyNow - 16).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", 700).text(o.youTag);

  // live loss + step count, top-right
  svg.append("text").attr("x", W - m.right).attr("y", 24).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").text(`loss ${lossAt(o.w).toFixed(2)} · ${o.steps} ${o.stepsWord}`);
}

/* --- Node 3: training loss over the whole run --------------------------- */

function drawTrain(
  el: SVGSVGElement,
  o: {
    p: number;
    xLabel: string;
    lossLabel: string;
    tokensWord: string;
    nowTag: string;
    reduce: boolean;
  },
) {
  const W = 760;
  const H = 380;
  const m = { top: 44, right: 26, bottom: 44, left: 26 };
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const x = d3.scaleLinear().domain([0, 1]).range([m.left, W - m.right]);
  const y = d3.scaleLinear().domain([0, trainLoss(0) * 1.02]).range([H - m.bottom, m.top]);

  svg.append("text").attr("x", m.left).attr("y", 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.lossLabel);
  svg.append("text").attr("x", W - m.right).attr("y", H - 12).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.xLabel);
  svg.append("line").attr("x1", m.left).attr("y1", H - m.bottom).attr("x2", W - m.right).attr("y2", H - m.bottom).style("stroke", "var(--hair)").style("stroke-width", 1.5);

  const full = trainCurve();
  const line = d3.line<{ p: number; l: number }>().x((d) => x(d.p)).y((d) => y(d.l)).curve(d3.curveBasis);

  // full curve, faint (the whole run)
  svg.append("path").datum(full).attr("d", line).style("fill", "none").style("stroke", "var(--border)").style("stroke-width", 2);

  // traversed portion, solid green (up to current progress)
  const done = full.filter((d) => d.p <= o.p);
  if (done.length > 1) {
    svg.append("path").datum(done).attr("d", line).style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 3);
  }

  // moving point at "now"
  const lv = trainLoss(o.p);
  const px = x(o.p);
  const py = y(lv);
  svg.append("line").attr("x1", px).attr("y1", py).attr("x2", px).attr("y2", H - m.bottom).style("stroke", "var(--signal)").style("stroke-width", 1).style("stroke-dasharray", "3 4").style("opacity", 0.6);
  svg.append("circle").attr("cx", px).attr("cy", py).attr("r", 8).style("fill", "var(--signal)").style("stroke", "var(--bg)").style("stroke-width", 2);
  svg.append("text").attr("x", px).attr("y", py - 16).attr("text-anchor", px > W - 120 ? "end" : "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", 700).text(o.nowTag);

  // live loss + tokens, top-right
  svg.append("text").attr("x", W - m.right).attr("y", 24).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", DISPLAY).style("font-size", "30px").style("font-weight", 600).text(`loss ${lv.toFixed(2)}`);
  svg.append("text").attr("x", W - m.right).attr("y", 42).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${fmtTokens(tokensSeen(o.p))} ${o.tokensWord}`);
}

/* ======================================================================== *
 * Node components — state + controls, wrapping SceneShell.
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

function useHML() {
  const { t } = useAcademy();
  return t.howModelsLearn;
}

function Node1({ reduce }: { reduce: boolean }) {
  const l = useHML();
  const n = l.nodes[0];
  const [sel, setSel] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => { setSel(i); manual.current = true; };
  return (
    <SceneShell
      id="hml-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={l.n1candidates.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setSel(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[sel]}
      aside={<Deeper title={l.n1deeperTitle}>{rich(l.n1deeperBody)}</Deeper>}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 13, color: "var(--muted)" }}>{rich("`" + l.n1context + "`")}</div>
          <ControlRow>
            {l.n1candidates.map((word, i) => (
              <Toggle key={i} on={sel === i} onClick={() => pick(i)}>{word}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawGuess(el, { sel, words: l.n1candidates, probs: N1_PROBS, axisLabel: l.n1axisLabel, trueTag: l.n1trueTag, lossTag: l.n1lossTag, reduce })} deps={[sel, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const l = useHML();
  const n = l.nodes[1];
  const [w, setW] = useState(W_START);
  const [prevW, setPrevW] = useState(W_START);
  const [trail, setTrail] = useState<number[]>([W_START]);
  const [steps, setSteps] = useState(0);
  const [rate, setRate] = useState(1);
  const regime = rateRegime(rate);
  const doStep = () => {
    const next = gdStep(w, rate);
    setPrevW(w);
    setW(next);
    setTrail((prev) => [...prev, next]);
    setSteps((s) => s + 1);
  };
  const reset = () => { setPrevW(W_START); setW(W_START); setTrail([W_START]); setSteps(0); };
  return (
    <SceneShell
      id="hml-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={l.n2rateNotes[regime]}
      aside={<Deeper title={l.n2deeperTitle}>{rich(l.n2deeperBody)}</Deeper>}
      controls={
        <>
          <Slider id="hml-rate" label={l.n2rateLabel} value={rate} display={rate.toFixed(1)} min={0.1} max={4.5} step={0.1} onChange={setRate} />
          <ControlRow>
            <Toggle on={false} onClick={doStep}>{l.n2stepLabel}</Toggle>
            <Toggle on={false} onClick={reset}>{l.n2resetLabel}</Toggle>
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawValley(el, { w, prevW, trail, steps, xLabel: l.n2xLabel, lossLabel: l.n2lossLabel, minTag: l.n2minTag, youTag: l.n2youTag, stepsWord: l.n2stepsWord, reduce })} deps={[w, prevW, trail, steps, reduce]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const l = useHML();
  const n = l.nodes[2];
  const [pct, setPct] = useState(6); // start early: the steep part
  const p = pct / 100;
  return (
    <SceneShell
      id="hml-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={p < 0.5 ? l.n3earlyNote : l.n3lateNote}
      aside={<Callout label={l.calloutLabel} title={l.calloutTitle}>{rich(l.calloutBody)}</Callout>}
      controls={
        <Slider id="hml-progress" label={l.n3slider} value={pct} display={`${pct}%`} min={0} max={100} onChange={setPct} />
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTrain(el, { p, xLabel: l.n3xLabel, lossLabel: l.n3lossLabel, tokensWord: l.n3tokensWord, nowTag: l.n3nowTag, reduce })} deps={[pct, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function HowModelsLearn() {
  const { t, lang } = useAcademy();
  const l = t.howModelsLearn;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{l.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {l.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{l.lede}</p>

        {/* loop chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{l.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 8 }}>
            {l.pipeline.map((label, i) => (
              <a key={i} href={`#hml-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{l.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{l.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(l.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{l.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(l.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/autoregressive-loop" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {l.prevLesson}</Link>
        <Link href="/stage/0/base-vs-assistant" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{l.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
