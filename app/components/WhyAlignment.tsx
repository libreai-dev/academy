"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider } from "./webscale-kit";
import {
  REWARD_MAX,
  MAX_ROUNDS,
  rewardOf,
  winRate,
  winCurve,
  type FeedbackMode,
} from "../lib/why-alignment";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

/* --- Node 2: the reward scale (preferred high, rejected low) ------------- */

function drawReward(
  el: SVGSVGElement,
  o: {
    chosen: number;
    rejected: number;
    gap: number;
    reduce: boolean;
    preferredLabel: string;
    rejectedLabel: string;
    rewardWord: string;
    gapWord: string;
    lowLabel: string;
    highLabel: string;
    nudgeLabel: string;
  },
) {
  const W = 720;
  const H = 210;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const x0 = 96;
  const x1 = W - 96;
  const axisY = 150;
  const x = d3.scaleLinear().domain([-REWARD_MAX, REWARD_MAX]).range([x0, x1]);
  const dur = o.reduce ? 0 : 620;

  // baseline + ticks
  svg.append("line").attr("x1", x0).attr("y1", axisY).attr("x2", x1).attr("y2", axisY).style("stroke", "var(--border)").style("stroke-width", 2);
  [-5, -2.5, 0, 2.5, 5].forEach((t) => {
    svg.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", axisY - 6).attr("y2", axisY + 6).style("stroke", t === 0 ? "var(--fg)" : "var(--border)").style("stroke-width", t === 0 ? 2 : 1);
  });
  // end + zero labels (below the axis)
  svg.append("text").attr("x", x0).attr("y", axisY + 28).attr("text-anchor", "start").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(o.lowLabel);
  svg.append("text").attr("x", x1).attr("y", axisY + 28).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.highLabel);
  svg.append("text").attr("x", x(0)).attr("y", axisY + 28).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text("0");

  // gap bracket across the top
  const xr = x(o.rejected);
  const xc = x(o.chosen);
  const bracketY = 58;
  const bracket = svg.append("g");
  const bracketLines = bracket.append("g");
  const bracketText = bracket.append("text").attr("y", bracketY - 8).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px");
  const drawBracket = (a: number, b: number) => {
    bracketLines.selectAll("*").remove();
    bracketLines.append("line").attr("x1", a).attr("x2", b).attr("y1", bracketY).attr("y2", bracketY).style("stroke", "var(--muted)").style("stroke-width", 1.5);
    bracketLines.append("line").attr("x1", a).attr("x2", a).attr("y1", bracketY).attr("y2", bracketY + 7).style("stroke", "var(--muted)").style("stroke-width", 1.5);
    bracketLines.append("line").attr("x1", b).attr("x2", b).attr("y1", bracketY).attr("y2", bracketY + 7).style("stroke", "var(--muted)").style("stroke-width", 1.5);
    bracketText.attr("x", (a + b) / 2);
  };
  drawBracket(x(0), x(0));
  bracketText.text(`${o.rewardWord} · ${o.gapWord} ${o.gap.toFixed(1)}`);
  if (dur) {
    bracket.transition().duration(dur).ease(d3.easeCubicOut).tween("bracket", () => {
      const ia = d3.interpolateNumber(x(0), xr);
      const ib = d3.interpolateNumber(x(0), xc);
      return (tt) => drawBracket(ia(tt), ib(tt));
    });
  } else {
    drawBracket(xr, xc);
  }

  // one answer marker: name above, value above, dot on the axis, nudge arrow
  const marker = (val: number, color: string, name: string, dir: -1 | 1) => {
    const accent = color === "var(--signal)" ? "var(--signal-fg)" : "var(--tok-byte)";
    const g = svg.append("g");
    const nameText = g.append("text").attr("y", 96).attr("text-anchor", "middle").style("fill", accent).style("font-family", MONO).style("font-size", "13px").style("font-weight", 700).text(name);
    const valText = g.append("text").attr("y", 116).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px");
    const dot = g.append("circle").attr("cy", axisY).attr("r", 10).style("fill", color).style("stroke", "var(--bg)").style("stroke-width", 2);
    // short nudge arrow pointing outward from the dot
    const arrow = g.append("g");
    const drawAt = (cx: number, v: number) => {
      dot.attr("cx", cx);
      nameText.attr("x", cx);
      valText.attr("x", cx).text(v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1));
      arrow.selectAll("*").remove();
      const tip = cx + dir * 34;
      arrow.append("line").attr("x1", cx + dir * 12).attr("y1", axisY).attr("x2", tip).attr("y2", axisY).style("stroke", color).style("stroke-width", 2.5);
      arrow.append("path").attr("d", `M ${tip} ${axisY} l ${-dir * 8} -5 l 0 10 Z`).style("fill", color);
      arrow.append("text").attr("x", tip + dir * 6).attr("y", axisY - 12).attr("text-anchor", dir < 0 ? "end" : "start").style("fill", accent).style("font-family", MONO).style("font-size", "12px").text(o.nudgeLabel);
    };
    drawAt(x(0), 0);
    if (dur) {
      g.transition().duration(dur).ease(d3.easeCubicOut).tween("m", () => {
        const ix = d3.interpolateNumber(x(0), x(val));
        const iv = d3.interpolateNumber(0, val);
        return (tt) => drawAt(ix(tt), iv(tt));
      });
    } else {
      drawAt(x(val), val);
    }
  };
  marker(o.rejected, "var(--tok-byte)", o.rejectedLabel, -1);
  marker(o.chosen, "var(--signal)", o.preferredLabel, 1);
}

/* --- Node 3: the learning curve (preferred rate vs rounds) --------------- */

function drawCurve(
  el: SVGSVGElement,
  o: {
    mode: FeedbackMode;
    rounds: number;
    reduce: boolean;
    curveLabel: string;
    axisRounds: string;
    markerLabel: string;
  },
) {
  const W = 720;
  const H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const L = 58;
  const R = 28;
  const T = 30;
  const B = 54;
  const x = d3.scaleLinear().domain([0, MAX_ROUNDS]).range([L, W - R]);
  const y = d3.scaleLinear().domain([45, 95]).range([H - B, T]);
  const dur = o.reduce ? 0 : 750;

  // y gridlines + labels
  [50, 60, 70, 80, 90].forEach((p) => {
    svg.append("line").attr("x1", L).attr("x2", W - R).attr("y1", y(p)).attr("y2", y(p)).style("stroke", "var(--hair)").style("stroke-width", 1);
    svg.append("text").attr("x", L - 10).attr("y", y(p) + 4).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${p}%`);
  });
  // x axis ticks
  [0, 500, 1000, 1500, 2000].forEach((r) => {
    svg.append("text").attr("x", x(r)).attr("y", H - B + 22).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(String(r));
  });
  svg.append("text").attr("x", (L + W - R) / 2).attr("y", H - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.axisRounds);
  // curve label (top-left of plot)
  svg.append("text").attr("x", L + 4).attr("y", T + 2).attr("text-anchor", "start").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px").text(`↑ ${o.curveLabel}`);

  // the curve
  const pts = winCurve(o.mode);
  const line = d3.line<[number, number]>().x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX);
  const path = svg.append("path").datum(pts).attr("d", line).style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 3);
  if (dur) {
    const len = (path.node() as SVGPathElement).getTotalLength();
    path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(dur).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
  }

  // current marker
  const pct = winRate(o.rounds, o.mode);
  const mx = x(o.rounds);
  const my = y(pct);
  svg.append("line").attr("x1", mx).attr("x2", mx).attr("y1", H - B).attr("y2", my).style("stroke", "var(--muted)").style("stroke-width", 1.5).style("stroke-dasharray", "4 4");
  svg.append("circle").attr("cx", mx).attr("cy", my).attr("r", 6).style("fill", "var(--signal)").style("stroke", "var(--bg)").style("stroke-width", 2);
  const anchor = o.rounds > MAX_ROUNDS * 0.7 ? "end" : "start";
  const dx = anchor === "end" ? -12 : 12;
  svg.append("text").attr("x", mx + dx).attr("y", my - 12).attr("text-anchor", anchor).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "15px").style("font-weight", 700).text(`${pct.toFixed(0)}%`);
  svg.append("text").attr("x", mx + dx).attr("y", my + 4).attr("text-anchor", anchor).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.markerLabel);
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

function useWA() {
  const { t } = useAcademy();
  return t.whyAlignment;
}

/* --- Node 1: pick the better answer (text-vs-text panels) ---------------- */

function AnswerCard({
  name,
  body,
  tag,
  isBetter,
  picked,
  onPick,
  badgePreferred,
  chooseLabel,
}: {
  name: string;
  body: string;
  tag: string;
  isBetter: boolean;
  picked: boolean;
  onPick: () => void;
  badgePreferred: string;
  chooseLabel: string;
}) {
  const tagColor = isBetter ? "var(--signal-fg)" : "var(--tok-byte)";
  return (
    <button
      type="button"
      aria-pressed={picked}
      onClick={onPick}
      style={{
        appearance: "none",
        font: "inherit",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        border: `1px solid ${picked ? "var(--signal)" : "var(--border)"}`,
        background: picked ? "var(--signal-wash)" : "var(--bg)",
        borderRadius: 14,
        padding: "14px 15px",
        transition: "border-color .15s ease, background .15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".08em", color: "var(--muted)" }}>{name}</span>
        <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".08em", color: tagColor, border: `1px solid ${tagColor}`, borderRadius: 6, padding: "2px 7px" }}>{tag}</span>
      </div>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--fg)", textWrap: "pretty" }}>{body}</p>
      <span
        style={{
          marginTop: 2,
          alignSelf: "flex-start",
          fontFamily: MONO,
          fontSize: 11.5,
          letterSpacing: ".06em",
          color: picked ? "var(--signal-fg)" : "var(--muted)",
          fontWeight: picked ? 700 : 400,
        }}
      >
        {picked ? `● ${badgePreferred}` : `○ ${chooseLabel}`}
      </span>
    </button>
  );
}

function Node1({ reduce }: { reduce: boolean }) {
  const wa = useWA();
  const n = wa.nodes[0];
  const prompts = wa.n1prompts;
  const [pIdx, setPIdx] = useState(0);
  const [pick, setPick] = useState<"a" | "b">(prompts[0].better);
  const manual = useRef(false);
  const p = prompts[pIdx];

  const choosePrompt = (i: number) => {
    setPIdx(i);
    setPick(prompts[i].better);
    manual.current = true;
  };

  const chosenName = pick === "a" ? wa.n1aName : wa.n1bName;
  const rejectedName = pick === "a" ? wa.n1bName : wa.n1aName;

  return (
    <SceneShell
      id="wa-node-1"
      index={1}
      total={3}
      eyebrow={n.eyebrow}
      title={n.title}
      intro={n.intro}
      bullets={n.bullets}
      cardLabel={n.cardLabel}
      aria={n.aria}
      steps={3}
      hideStepper
      captions={n.captions}
      hint={n.hint}
      reduce={reduce}
      labelPrev="Previous prompt"
      labelNext="Next prompt"
      onStep={(s) => {
        if (!manual.current) {
          setPIdx(s);
          setPick(prompts[s].better);
        }
        manual.current = false;
      }}
      note={p.note}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{wa.n1promptLabel}</div>
          <ControlRow>
            {prompts.map((pr, i) => (
              <Toggle key={pr.key} on={pIdx === i} onClick={() => choosePrompt(i)}>
                {String(i + 1).padStart(2, "0")}
              </Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* the user's prompt */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", background: "var(--surface)" }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)", marginBottom: 6 }}>PROMPT</div>
            <div style={{ fontSize: 15, lineHeight: 1.5, color: "var(--fg)", textWrap: "pretty" }}>{p.prompt}</div>
          </div>
          {/* two candidate answers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
            <AnswerCard name={wa.n1aName} body={p.answerA} tag={p.tagA} isBetter={p.better === "a"} picked={pick === "a"} onPick={() => setPick("a")} badgePreferred={wa.n1preferred} chooseLabel={wa.n1chooseThis} />
            <AnswerCard name={wa.n1bName} body={p.answerB} tag={p.tagB} isBetter={p.better === "b"} picked={pick === "b"} onPick={() => setPick("b")} badgePreferred={wa.n1preferred} chooseLabel={wa.n1chooseThis} />
          </div>
          {/* the recorded preference pair */}
          <div style={{ background: "var(--readout-bg)", border: "1px solid var(--readout-border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ color: "var(--readout-muted)", fontSize: 11, letterSpacing: ".08em", marginBottom: 4 }}>{wa.n1pairLabel}</div>
            <div style={{ color: "var(--readout-fg)" }}>
              <span style={{ color: "var(--readout-signal)" }}>{chosenName}</span> ≻ {rejectedName}
            </div>
          </div>
        </div>
      )}
    </SceneShell>
  );
}

/* --- Node 2: reward as a score ------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const wa = useWA();
  const n = wa.nodes[1];
  const [margin, setMargin] = useState(70);
  const r = rewardOf(margin);
  return (
    <SceneShell
      id="wa-node-2"
      index={2}
      total={3}
      eyebrow={n.eyebrow}
      title={n.title}
      intro={n.intro}
      bullets={n.bullets}
      cardLabel={n.cardLabel}
      aria={n.aria}
      steps={1}
      captions={n.captions}
      hint={n.hint}
      reduce={reduce}
      labelPrev="Previous step"
      labelNext="Next step"
      note={n.sliderNote}
      controls={
        <Slider id="wa-margin" label={wa.n2slider} value={margin} display={`${margin} / 100`} min={0} max={100} onChange={setMargin} />
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) =>
            drawReward(el, {
              chosen: r.chosen,
              rejected: r.rejected,
              gap: r.gap,
              reduce,
              preferredLabel: wa.n2preferred,
              rejectedLabel: wa.n2rejected,
              rewardWord: wa.n2rewardLabel,
              gapWord: wa.n2gapWord,
              lowLabel: wa.n2low,
              highLabel: wa.n2high,
              nudgeLabel: wa.n2nudge,
            })
          }
          deps={[margin, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* --- Node 3: learning from feedback ------------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const wa = useWA();
  const n = wa.nodes[2];
  const [rounds, setRounds] = useState(600);
  const [mode, setMode] = useState<FeedbackMode>("human");
  return (
    <SceneShell
      id="wa-node-3"
      index={3}
      total={3}
      eyebrow={n.eyebrow}
      title={n.title}
      intro={n.intro}
      bullets={n.bullets}
      cardLabel={n.cardLabel}
      aria={n.aria}
      steps={1}
      captions={n.captions}
      hint={n.hint}
      reduce={reduce}
      labelPrev="Previous step"
      labelNext="Next step"
      note={n.optionNotes?.[mode === "human" ? 0 : 1]}
      controls={
        <>
          <Slider id="wa-rounds" label={wa.n3slider} value={rounds} display={String(rounds)} min={0} max={MAX_ROUNDS} step={20} onChange={setRounds} />
          <ControlRow>
            <Toggle on={mode === "human"} onClick={() => setMode("human")}>{wa.n3human}</Toggle>
            <Toggle on={mode === "ai"} onClick={() => setMode("ai")}>{wa.n3ai}</Toggle>
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawCurve(el, { mode, rounds, reduce, curveLabel: wa.n3curveLabel, axisRounds: wa.n3axisRounds, markerLabel: wa.n3marker })}
          deps={[mode, rounds, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function WhyAlignment() {
  const { t, lang } = useAcademy();
  const wa = t.whyAlignment;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{wa.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {wa.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{wa.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{wa.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {wa.pipeline.map((label, i) => (
              <a key={i} href={`#wa-node-${i + 1}`} className="u-hover-fg-border" style={{ display: "flex", gap: 9, alignItems: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13, color: "var(--fg)" }}>
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
        <Cap>{wa.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{wa.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(wa.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{wa.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(wa.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/base-vs-assistant" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {wa.prevRoadmap}</Link>
        <Link href="/stage/0/prefill-vs-decode" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{wa.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
