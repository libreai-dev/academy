"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Slider } from "./webscale-kit";
import { timeline, fmtMs, type Timeline } from "../lib/prefill-vs-decode";
import type {
  PrefillVsDecodeLesson,
  PvdDiagram1,
  PvdDiagram2,
  PvdDiagram3,
} from "../lib/copy/prefill-vs-decode";

/* ======================================================================== *
 * Copy access. `t.prefillVsDecode` is registered by the copy integrator; read
 * it through a narrow cast so this file compiles on its own.
 * ======================================================================== */
function usePvd(): PrefillVsDecodeLesson {
  const { t } = useAcademy();
  return (t as unknown as { prefillVsDecode: PrefillVsDecodeLesson }).prefillVsDecode;
}

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so design tokens + theme flips resolve live.
 * ======================================================================== */

/* --- Node 1: the whole prompt read in one parallel pass ------------------ */
function drawPrefill(el: SVGSVGElement, o: { n: number; reduce: boolean; d: PvdDiagram1 }) {
  const W = 760;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 460;

  const cols = 8;
  const cell = 26;
  const gap = 6;
  const rows = Math.ceil(o.n / cols);
  const gridW = cols * cell + (cols - 1) * gap;
  const gridH = rows * cell + (rows - 1) * gap;
  const gx = 46;
  const gy = (H - gridH) / 2 - 4;
  const midY = gy + gridH / 2;

  // every prompt token, lit together (one simultaneous pulse = "in parallel")
  for (let i = 0; i < o.n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = gx + c * (cell + gap);
    const y = gy + r * (cell + gap);
    const rect = svg
      .append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", cell)
      .attr("height", cell)
      .attr("rx", 5)
      .style("fill", "var(--signal)")
      .style("stroke", "var(--bg)")
      .style("stroke-width", 1);
    if (dur) rect.style("fill-opacity", 0.18).transition().duration(dur).style("fill-opacity", 0.92);
    else rect.style("fill-opacity", 0.92);
  }

  svg
    .append("text")
    .attr("x", gx + gridW / 2)
    .attr("y", gy + gridH + 24)
    .attr("text-anchor", "middle")
    .style("fill", "var(--fg)")
    .style("font-family", MONO)
    .style("font-size", "13px")
    .text(`${o.n} ${o.d.tokens}`);

  // one arrow → context-memory box
  const ax0 = gx + gridW + 20;
  const boxX = 520;
  const boxW = 200;
  svg.append("line").attr("x1", ax0).attr("y1", midY).attr("x2", boxX - 2).attr("y2", midY).style("stroke", "var(--fg)").style("stroke-width", 2);
  svg.append("path").attr("d", `M ${boxX - 11} ${midY - 6} L ${boxX - 1} ${midY} L ${boxX - 11} ${midY + 6} Z`).style("fill", "var(--fg)");
  svg
    .append("text")
    .attr("x", (ax0 + boxX) / 2)
    .attr("y", midY - 12)
    .attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)")
    .style("font-family", MONO)
    .style("font-size", "13px")
    .text(o.d.step);

  svg.append("rect").attr("x", boxX).attr("y", midY - 40).attr("width", boxW).attr("height", 80).attr("rx", 12).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", boxX + boxW / 2).attr("y", midY - 5).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px").text(o.d.memory);
  svg.append("text").attr("x", boxX + boxW / 2).attr("y", midY + 17).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.d.memorySub);
}

/* --- Node 2: the answer written one token per step ----------------------- */
function drawDecode(el: SVGSVGElement, o: { n: number; reduce: boolean; d: PvdDiagram2 }) {
  const W = 760;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const step = o.reduce ? 0 : 90;

  // prompt is already in memory — a static pill up top
  const pillW = 260;
  svg.append("rect").attr("x", 46).attr("y", 24).attr("width", pillW).attr("height", 40).attr("rx", 10).style("fill", "var(--surface)").style("stroke", "var(--border)");
  svg.append("text").attr("x", 46 + pillW / 2).attr("y", 49).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12.5px").text(o.d.promptMemo);

  svg.append("text").attr("x", 46).attr("y", 96).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.d.out.toUpperCase());

  // output tokens dripping out, left→right, each its own numbered step
  const cols = 8;
  const cell = 30;
  const gap = 8;
  const gx = 46;
  const gy = 108;
  for (let i = 0; i < o.n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = gx + c * (cell + gap);
    const y = gy + r * (cell + gap);
    const last = i === o.n - 1;
    const g = svg.append("g");
    g.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", cell)
      .attr("height", cell)
      .attr("rx", 6)
      .style("fill", "var(--signal)")
      .style("fill-opacity", last ? 1 : 0.9)
      .style("stroke", last ? "var(--fg)" : "var(--bg)")
      .style("stroke-width", last ? 2 : 1);
    g.append("text").attr("x", x + cell / 2).attr("y", y + cell / 2 + 4).attr("text-anchor", "middle").style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "12px").style("font-weight", 600).text(String(i + 1));
    if (step) g.style("opacity", 0).transition().delay(i * step).duration(160).style("opacity", 1);
  }

  // the sequence is the point: N output tokens = N sequential steps
  svg.append("text").attr("x", 46).attr("y", H - 40).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "13px").text(`${o.n} ${o.d.out} · ${o.n} ${o.d.steps}`);
  svg.append("text").attr("x", 46).attr("y", H - 18).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.d.reads);
}

/* --- Node 3: the serving timeline — prefill burst, then decode drip ------- */
function drawTimeline(el: SVGSVGElement, o: { tl: Timeline; reduce: boolean; d: PvdDiagram3 }) {
  const W = 760;
  const H = 260;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  const x0 = 56;
  const x1 = W - 40;
  const laneY = 78;
  const laneH = 56;
  const x = d3.scaleLinear().domain([0, Math.max(1, o.tl.totalMs)]).range([x0, x1]);
  const pfX = x(o.tl.prefillMs);

  // lane background
  svg.append("rect").attr("x", x0).attr("y", laneY).attr("width", x1 - x0).attr("height", laneH).attr("rx", 8).style("fill", "var(--surface)").style("stroke", "var(--border)");

  // decode region wash + drip ticks (one thin tick per token, capped for density)
  svg.append("rect").attr("x", pfX).attr("y", laneY).attr("width", Math.max(0, x1 - pfX)).attr("height", laneH).attr("rx", 4).style("fill", "var(--signal)").style("fill-opacity", 0.1);
  const ticks = Math.min(o.tl.answerTokens, 90);
  for (let k = 0; k < ticks; k++) {
    const tx = pfX + ((k + 0.5) / ticks) * (x1 - pfX);
    const line = svg.append("line").attr("x1", tx).attr("x2", tx).attr("y1", laneY + 6).attr("y2", laneY + laneH - 6).style("stroke", "var(--signal-fg)").style("stroke-width", 1).style("stroke-opacity", 0.5);
    if (dur) line.style("stroke-opacity", 0).transition().delay((k / ticks) * dur).duration(90).style("stroke-opacity", 0.5);
  }

  // prefill block (solid) — the quick burst
  const pf = svg.append("rect").attr("y", laneY).attr("height", laneH).attr("x", x0).attr("rx", 8).style("fill", "var(--signal)").style("fill-opacity", 0.92);
  if (dur) pf.attr("width", 0).transition().duration(dur * 0.4).attr("width", Math.max(2, pfX - x0));
  else pf.attr("width", Math.max(2, pfX - x0));

  // first-token marker
  svg.append("line").attr("x1", pfX).attr("x2", pfX).attr("y1", laneY - 16).attr("y2", laneY + laneH + 10).style("stroke", "var(--fg)").style("stroke-width", 1.5).style("stroke-dasharray", "4 4");
  svg.append("text").attr("x", pfX + 6).attr("y", laneY - 6).attr("text-anchor", "start").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(`${o.d.firstToken} · ${fmtMs(o.tl.ttftMs)}`);

  // segment labels below the lane
  const lblY = laneY + laneH + 30;
  svg.append("text").attr("x", x0).attr("y", lblY).attr("text-anchor", "start").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12.5px").text(`${o.d.prefill} · ${fmtMs(o.tl.prefillMs)} · ${o.d.onePass}`);
  svg.append("text").attr("x", x1).attr("y", lblY).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12.5px").text(`${o.d.decode} · ${fmtMs(o.tl.decodeMs)} · ${o.tl.answerTokens} tok, ${o.d.oneAtATime}`);

  // time axis
  const axisY = lblY + 26;
  svg.append("line").attr("x1", x0).attr("x2", x1).attr("y1", axisY).attr("y2", axisY).style("stroke", "var(--hair)").style("stroke-width", 1);
  svg.append("text").attr("x", x0).attr("y", axisY + 18).attr("text-anchor", "start").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text("0");
  svg.append("text").attr("x", (x0 + x1) / 2).attr("y", axisY + 18).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.d.time);
  svg.append("text").attr("x", x1).attr("y", axisY + 18).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "12px").text(fmtMs(o.tl.totalMs));
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

function Node1({ reduce }: { reduce: boolean }) {
  const lesson = usePvd();
  const n = lesson.nodes[0];
  const [prompt, setPrompt] = useState(16);
  return (
    <SceneShell
      id="pvd-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="pvd-prompt-1" label={lesson.n1slider} value={prompt} display={`${prompt} tok`} min={4} max={40} onChange={setPrompt} />
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawPrefill(el, { n: prompt, reduce, d: lesson.n1diagram })} deps={[prompt, reduce]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const lesson = usePvd();
  const n = lesson.nodes[1];
  const [answer, setAnswer] = useState(8);
  return (
    <SceneShell
      id="pvd-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="pvd-answer-2" label={lesson.n2slider} value={answer} display={`${answer} tok`} min={2} max={24} onChange={setAnswer} />
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawDecode(el, { n: answer, reduce, d: lesson.n2diagram })} deps={[answer, reduce]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const lesson = usePvd();
  const n = lesson.nodes[2];
  const [prompt, setPrompt] = useState(400);
  const [answer, setAnswer] = useState(200);
  const tl = timeline(prompt, answer);
  return (
    <SceneShell
      id="pvd-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <>
          <Slider id="pvd-prompt-3" label={lesson.n3promptSlider} value={prompt} display={`${prompt} tok`} min={50} max={1500} step={50} onChange={setPrompt} />
          <Slider id="pvd-answer-3" label={lesson.n3answerSlider} value={answer} display={`${answer} tok`} min={20} max={1000} step={20} onChange={setAnswer} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: fmtMs(tl.ttftMs) },
          { k: n.rows[1], v: fmtMs(tl.decodeMs) },
          { k: n.rows[2], v: fmtMs(tl.totalMs), hi: true },
          { k: n.rows[3], v: `${Math.round(tl.decodePct)}%`, hi: true },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTimeline(el, { tl, reduce, d: lesson.n3diagram })} deps={[prompt, answer, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function PrefillVsDecode() {
  const { t, lang } = useAcademy();
  const lesson = (t as unknown as { prefillVsDecode: PrefillVsDecodeLesson }).prefillVsDecode;
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

        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{lesson.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 8 }}>
            {lesson.pipeline.map((label, i) => (
              <a key={i} href={`#pvd-node-${i + 1}`} className="u-hover-fg-border"
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
        <Link href="/stage/0/why-alignment" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {lesson.prevRoadmap}</Link>
        <Link href="/stage/0" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{lesson.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
