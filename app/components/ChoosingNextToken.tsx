"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  LOGITS,
  HIDDEN_STATE,
  NUDGE_COUNT,
  LOGIT_MIN,
  LOGIT_MAX,
  softmax,
  argmax,
  sampleIndex,
  pct,
  type PromptKey,
} from "../lib/nextToken";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

/* --- Node 1: hidden state → unembedding → raw logits -------------------- */

function drawLogits(
  el: SVGSVGElement,
  o: { logits: number[]; tokens: string[]; hiddenLabel: string; unembedLabel: string; title: string; reduce: boolean },
) {
  const W = 760;
  const H = 400;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  // --- header strip: the hidden-state vector feeding the unembedding ---
  svg.append("text").attr("x", 20).attr("y", 20).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.hiddenLabel);
  const cellW = 42;
  const cellGap = 6;
  HIDDEN_STATE.forEach((v, i) => {
    const x = 20 + i * (cellW + cellGap);
    svg.append("rect").attr("x", x).attr("y", 30).attr("width", cellW).attr("height", 26).attr("rx", 5)
      .style("fill", "var(--surface)").style("stroke", "var(--border)");
    svg.append("text").attr("x", x + cellW / 2).attr("y", 47).attr("text-anchor", "middle")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(v.toFixed(1));
  });
  const vecEnd = 20 + HIDDEN_STATE.length * (cellW + cellGap);
  svg.append("text").attr("x", vecEnd + 8).attr("y", 47).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px").text(o.unembedLabel);

  // section divider + title for the bars
  svg.append("line").attr("x1", 20).attr("y1", 72).attr("x2", W - 20).attr("y2", 72).style("stroke", "var(--hair)").style("stroke-width", 1);
  svg.append("text").attr("x", 20).attr("y", 92).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.title);

  // --- the logit bars (raw scores; can be negative) ---
  const top = 106;
  const rowH = (H - top - 8) / o.tokens.length;
  const barH = Math.min(28, rowH - 10);
  const min = Math.min(0, d3.min(o.logits) ?? 0);
  const max = d3.max(o.logits) ?? 1;
  const x = d3.scaleLinear().domain([min - 0.4, max + 0.6]).range([160, W - 70]);
  const xZero = x(0);
  const best = argmax(o.logits);

  // zero baseline
  svg.append("line").attr("x1", xZero).attr("y1", top - 4).attr("x2", xZero).attr("y2", top + o.tokens.length * rowH - 6).style("stroke", "var(--border)").style("stroke-width", 1);
  svg.append("text").attr("x", xZero).attr("y", top - 8).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text("0");

  o.tokens.forEach((tok, i) => {
    const cy = top + i * rowH + rowH / 2;
    const yBar = cy - barH / 2;
    const l = o.logits[i];
    const positive = l >= 0;
    const isBest = i === best;
    // token label
    svg.append("text").attr("x", 150).attr("y", cy + 4).attr("text-anchor", "end")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", isBest ? 700 : 400).text(tok);
    // bar
    const xL = positive ? xZero : x(l);
    const wFull = Math.abs(x(l) - xZero);
    const bar = svg.append("rect").attr("y", yBar).attr("height", barH).attr("rx", 5)
      .style("fill", positive ? "var(--signal)" : "var(--tok-byte)")
      .style("fill-opacity", isBest ? 1 : 0.7);
    if (dur) bar.attr("x", xZero).attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("x", xL).attr("width", wFull);
    else bar.attr("x", xL).attr("width", wFull);
    // value
    svg.append("text").attr("x", positive ? x(l) + 8 : x(l) - 8).attr("y", cy + 4).attr("text-anchor", positive ? "start" : "end")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", isBest ? 700 : 400).text(l.toFixed(1));
  });
}

/* --- Nodes 2 & 3: softmax probability bars ------------------------------ */

function drawProbs(
  el: SVGSVGElement,
  o: { probs: number[]; tokens: string[]; leader: number; showPick: boolean; chosenLabel: string; title: string; reduce: boolean },
) {
  const W = 760;
  const H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  svg.append("text").attr("x", 20).attr("y", 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.title);

  const top = 46;
  const rowH = (H - top - 8) / o.tokens.length;
  const barH = Math.min(28, rowH - 12);
  const x0 = 160;
  const x1 = 650;
  const x = d3.scaleLinear().domain([0, 1]).range([x0, x1]);

  o.tokens.forEach((tok, i) => {
    const cy = top + i * rowH + rowH / 2;
    const yBar = cy - barH / 2;
    const p = o.probs[i];
    const chosen = i === o.leader;
    const emphasise = chosen; // leader is bold in both modes
    const dim = o.showPick && !chosen;
    // token label
    svg.append("text").attr("x", 150).attr("y", cy + 4).attr("text-anchor", "end")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", emphasise ? 700 : 400).style("opacity", dim ? 0.55 : 1).text(tok);
    // track
    svg.append("rect").attr("x", x0).attr("y", yBar).attr("width", x1 - x0).attr("height", barH).attr("rx", 5).style("fill", "var(--surface)").style("stroke", "var(--border)");
    // fill
    const wFull = Math.max(0, x(p) - x0);
    const bar = svg.append("rect").attr("x", x0).attr("y", yBar).attr("height", barH).attr("rx", 5)
      .style("fill", "var(--signal)")
      .style("fill-opacity", dim ? 0.4 : chosen ? 1 : 0.85)
      .style("stroke", emphasise ? "var(--fg)" : "none").style("stroke-width", 1.5);
    // Set widths directly (no from-zero transition): keeps slider drags smooth.
    bar.attr("width", wFull);
    // percentage (right-aligned column)
    svg.append("text").attr("x", W - 16).attr("y", cy + 4).attr("text-anchor", "end")
      .style("fill", emphasise ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", emphasise ? 700 : 400).style("opacity", dim ? 0.55 : 1).text(pct(p));
    // "chosen" marker after the bar, only in pick mode
    if (o.showPick && chosen) {
      const mx = Math.min(x0 + wFull + 10, x1 - 4);
      svg.append("text").attr("x", mx).attr("y", cy + 4).attr("text-anchor", "start")
        .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").style("font-weight", 700).text(o.chosenLabel);
    }
  });
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

function useNT() {
  const { t } = useAcademy();
  return t.nextToken;
}

function Node1({ reduce }: { reduce: boolean }) {
  const lesson = useNT();
  const n = lesson.nodes[0];
  const promptKeys: PromptKey[] = ["france", "sky"];
  const [idx, setIdx] = useState(0);
  const key = promptKeys[idx];
  const logits = LOGITS[key];
  const tokens = lesson.tokens[idx];
  return (
    <SceneShell
      id="nt-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {lesson.n1prompts.map((lab, i) => (
            <Toggle key={i} on={idx === i} onClick={() => setIdx(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLogits(el, { logits, tokens, hiddenLabel: lesson.n1hiddenLabel, unembedLabel: lesson.n1unembedLabel, title: lesson.n1logitsTitle, reduce })} deps={[idx, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const lesson = useNT();
  const n = lesson.nodes[1];
  const tokens = lesson.tokens[0];
  const [logits, setLogits] = useState<number[]>([...LOGITS.france]);
  const probs = softmax(logits);
  const leader = argmax(probs);
  const setAt = (i: number, v: number) => setLogits((prev) => prev.map((x, j) => (j === i ? v : x)));
  return (
    <SceneShell
      id="nt-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      note={`${lesson.n2leadPrefix} ${tokens[leader]} · ${pct(probs[leader])}`}
      controls={
        <>
          {Array.from({ length: NUDGE_COUNT }, (_, i) => (
            <Slider key={i} id={`nt-logit-${i}`} label={`${tokens[i]} · logit`} value={logits[i]} display={logits[i].toFixed(1)}
              min={LOGIT_MIN} max={LOGIT_MAX} step={0.5} onChange={(v) => setAt(i, v)} />
          ))}
          <Deeper title={lesson.n2deeperTitle}>{rich(lesson.n2deeperBody)}</Deeper>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawProbs(el, { probs, tokens, leader, showPick: false, chosenLabel: lesson.chosenLabel, title: lesson.n2sumTitle, reduce })} deps={[logits, reduce]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const lesson = useNT();
  const n = lesson.nodes[2];
  const tokens = lesson.tokens[0];
  const probs = softmax(LOGITS.france);
  const top = argmax(probs);
  const [mode, setMode] = useState<"greedy" | "sample">("greedy");
  const [rolled, setRolled] = useState(top); // deterministic until the learner rolls
  const roll = () => setRolled(sampleIndex(probs, Math.random()));
  const pickMode = (m: "greedy" | "sample") => {
    setMode(m);
    if (m === "sample") roll();
  };
  const chosen = mode === "greedy" ? top : rolled;
  return (
    <SceneShell
      id="nt-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[mode === "greedy" ? 0 : 1]}
      controls={
        <>
          <ControlRow>
            <Toggle on={mode === "greedy"} onClick={() => pickMode("greedy")}>{lesson.n3greedy}</Toggle>
            <Toggle on={mode === "sample"} onClick={() => pickMode("sample")}>{lesson.n3sample}</Toggle>
          </ControlRow>
          {mode === "sample" && (
            <button type="button" onClick={roll} className="u-hover-fg-border"
              style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--signal)", background: "var(--signal-wash)", color: "var(--fg)", alignSelf: "flex-start" }}>
              {lesson.n3roll}
            </button>
          )}
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawProbs(el, { probs, tokens, leader: chosen, showPick: true, chosenLabel: lesson.chosenLabel, title: lesson.n3probsTitle, reduce })} deps={[mode, chosen, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function ChoosingNextToken() {
  const { t, lang } = useAcademy();
  const lesson = t.nextToken;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{lesson.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {lesson.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{lesson.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{lesson.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {lesson.pipeline.map((label, i) => (
              <a key={i} href={`#nt-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{lesson.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{lesson.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(lesson.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{lesson.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(lesson.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/transformer-block" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {lesson.prevRoadmap}</Link>
        <Link href="/stage/0/autoregressive-loop" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{lesson.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
