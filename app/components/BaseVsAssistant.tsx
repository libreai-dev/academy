"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow } from "./webscale-kit";
import { CAPABILITIES, capValue, type Mode } from "../lib/base-vs-assistant";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

/** Greedy word-wrap (monospace text: char width is predictable). "\n" forces a break. */
function wrapLines(text: string, maxChars: number): string[] {
  const out: string[] = [];
  text.split("\n").forEach((para) => {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = "";
    words.forEach((w) => {
      if (cur.length === 0) cur = w;
      else if ((cur + " " + w).length <= maxChars) cur += " " + w;
      else {
        out.push(cur);
        cur = w;
      }
    });
    out.push(cur);
  });
  return out.length ? out : [""];
}

/** Small down-pointing arrow (line + filled triangle) drawn with d3. */
function downArrow(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y0: number, y1: number, color: string) {
  svg.append("line").attr("x1", x).attr("y1", y0).attr("x2", x).attr("y2", y1 - 7).style("stroke", color).style("stroke-width", 2);
  svg.append("path").attr("d", `M ${x - 6} ${y1 - 8} L ${x + 6} ${y1 - 8} L ${x} ${y1} Z`).style("fill", color);
}

/* --- Node 1: prompt → reply that flips base ↔ assistant ------------------ */

function drawReplyFlow(
  el: SVGSVGElement,
  o: { prompt: string; reply: string; mode: Mode; promptLabel: string; modeLabel: string; tag: string; reduce: boolean },
) {
  const W = 760;
  const pad = 18;
  const boxX = 24;
  const boxW = W - boxX * 2;
  const maxChars = 72;
  const lh = 23;

  const promptLines = wrapLines(o.prompt, maxChars);
  const replyLines = wrapLines(o.reply, maxChars);
  const pBoxH = pad * 2 + promptLines.length * lh;
  const rBoxH = pad * 2 + replyLines.length * lh;

  const labelH = 20;
  const gap = 40; // room for the arrow
  const topPad = 6;
  const pTop = topPad + labelH;
  const rLabelY = pTop + pBoxH + gap - 6;
  const rTop = rLabelY + 8;
  const H = rTop + rBoxH + 14;

  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const isAsst = o.mode === "assistant";
  const replyColor = isAsst ? "var(--signal)" : "var(--muted)";
  const replyFill = isAsst ? "var(--signal-wash)" : "var(--surface)";
  const replyInk = isAsst ? "var(--fg)" : "var(--muted)";
  const tagColor = isAsst ? "var(--signal-fg)" : "var(--muted)";

  // prompt label + box
  svg.append("text").attr("x", boxX).attr("y", topPad + 13).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.promptLabel);
  svg.append("rect").attr("x", boxX).attr("y", pTop).attr("width", boxW).attr("height", pBoxH).attr("rx", 12).style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
  promptLines.forEach((ln, i) => {
    svg.append("text").attr("x", boxX + pad).attr("y", pTop + pad + 15 + i * lh).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14.5px").text(ln);
  });

  // arrow
  downArrow(svg, W / 2, pTop + pBoxH + 6, pTop + pBoxH + gap - 8, "var(--muted)");

  // reply tag (mode + what it does) + box
  svg.append("text").attr("x", boxX).attr("y", rLabelY).style("fill", tagColor).style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".06em").style("font-weight", 700).text(`${o.modeLabel} · ${o.tag}`);
  const rect = svg.append("rect").attr("x", boxX).attr("y", rTop).attr("width", boxW).attr("height", rBoxH).attr("rx", 12).style("fill", replyFill).style("stroke", replyColor).style("stroke-width", isAsst ? 1.6 : 1);
  if (!o.reduce) rect.style("opacity", 0).transition().duration(260).style("opacity", 1);
  replyLines.forEach((ln, i) => {
    svg.append("text").attr("x", boxX + pad).attr("y", rTop + pad + 15 + i * lh).style("fill", replyInk).style("font-family", MONO).style("font-size", "14.5px").text(ln);
  });
}

/* --- Node 2: one instruction → response training pair -------------------- */

function drawPair(
  el: SVGSVGElement,
  o: { instruction: string; response: string; instrLabel: string; respLabel: string; learns: string; countNote: string; reduce: boolean },
) {
  const W = 760;
  const cardX = 30;
  const cardW = W - cardX * 2 - 10; // leave room for the stacked shadow at right
  const pad = 18;
  const maxChars = 62;
  const lh = 22;

  const instrLines = wrapLines(o.instruction, maxChars);
  const respLines = wrapLines(o.response, maxChars);
  const labelH = 18;
  const instrH = pad + labelH + instrLines.length * lh + 4;
  const dividerH = 34;
  const respH = pad + labelH + respLines.length * lh + pad;
  const cardH = instrH + dividerH + respH;

  const top = 22; // room for the stacked-shadow cards above/behind
  const H = top + cardH + 34;

  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  // stacked shadow cards behind → "millions of pairs like this"
  [16, 8].forEach((off, i) => {
    svg.append("rect").attr("x", cardX + off).attr("y", top - off).attr("width", cardW).attr("height", cardH).attr("rx", 14).style("fill", "var(--surface)").style("stroke", "var(--border)").style("opacity", 0.5 - i * 0.12);
  });

  // main card
  svg.append("rect").attr("x", cardX).attr("y", top).attr("width", cardW).attr("height", cardH).attr("rx", 14).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.4);

  // instruction half
  svg.append("text").attr("x", cardX + pad).attr("y", top + pad + 4).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "11.5px").style("letter-spacing", ".08em").text(o.instrLabel);
  instrLines.forEach((ln, i) => {
    svg.append("text").attr("x", cardX + pad).attr("y", top + pad + labelH + 14 + i * lh).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px").text(ln);
  });

  // divider + "learns to produce ↓"
  const divY = top + instrH;
  svg.append("line").attr("x1", cardX + pad).attr("y1", divY).attr("x2", cardX + cardW - pad).attr("y2", divY).style("stroke", "var(--hair)").style("stroke-width", 1);
  svg.append("text").attr("x", cardX + pad).attr("y", divY + 21).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(`↓ ${o.learns}`);

  // response half (green target)
  const rTop = divY + dividerH;
  svg.append("rect").attr("x", cardX + 1).attr("y", rTop).attr("width", cardW - 2).attr("height", respH - 1).attr("rx", 12).style("fill", "var(--signal-wash)");
  svg.append("text").attr("x", cardX + pad).attr("y", rTop + pad).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "11.5px").style("letter-spacing", ".08em").style("font-weight", 700).text(o.respLabel);
  const rTextTop = rTop + pad + labelH + 12;
  respLines.forEach((ln, i) => {
    const line = svg.append("text").attr("x", cardX + pad).attr("y", rTextTop + i * lh).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px").text(ln);
    if (!o.reduce) line.style("opacity", 0).transition().delay(i * 55).duration(260).style("opacity", 1);
  });

  // caption under the stack
  svg.append("text").attr("x", cardX).attr("y", H - 12).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.countNote);
}

/* --- Node 3: grouped bars — knowledge vs behaviour, base vs assistant ---- */

function drawBars(
  el: SVGSVGElement,
  o: { mode: Mode; labels: string[]; baseLabel: string; asstLabel: string; caption: string; reduce: boolean },
) {
  const W = 760;
  const rowH = 96;
  const top = 40;
  const H = top + CAPABILITIES.length * rowH + 44;
  const x0 = 210;
  const x1 = W - 70;
  const x = d3.scaleLinear().domain([0, 100]).range([x0, x1]);

  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  // legend
  const legend = [
    { lab: o.baseLabel, color: "var(--muted)", active: o.mode === "base" },
    { lab: o.asstLabel, color: "var(--signal)", active: o.mode === "assistant" },
  ];
  let lx = x0;
  legend.forEach((g) => {
    svg.append("rect").attr("x", lx).attr("y", 14).attr("width", 13).attr("height", 13).attr("rx", 3).style("fill", g.color).style("opacity", g.active ? 1 : 0.45);
    svg.append("text").attr("x", lx + 19).attr("y", 25).style("fill", g.active ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "12.5px").style("font-weight", g.active ? 700 : 400).text(g.lab);
    lx += 24 + g.lab.length * 8.4 + 26;
  });

  CAPABILITIES.forEach((c, i) => {
    const rowTop = top + i * rowH;
    // row label
    svg.append("text").attr("x", 12).attr("y", rowTop + rowH / 2 + 2).style("fill", "var(--fg)").style("font-family", DISPLAY).style("font-size", "17px").style("font-weight", 600).text(o.labels[i]);

    // track
    svg.append("rect").attr("x", x0).attr("y", rowTop + 8).attr("width", x1 - x0).attr("height", rowH - 40).attr("rx", 9).style("fill", "var(--surface)").style("stroke", "var(--border)");

    const bars = [
      { v: c.base, color: "var(--muted)", active: o.mode === "base", y: rowTop + 14 },
      { v: c.assistant, color: "var(--signal)", active: o.mode === "assistant", y: rowTop + 14 + (rowH - 52) / 2 + 4 },
    ];
    const bh = (rowH - 52) / 2;
    bars.forEach((b) => {
      const w = Math.max(4, x(b.v) - x0);
      const bar = svg.append("rect").attr("x", x0).attr("y", b.y).attr("height", bh).attr("rx", 7)
        .style("fill", b.color).style("opacity", b.active ? 1 : 0.4)
        .style("stroke", b.active ? "var(--fg)" : "none").style("stroke-width", b.active ? 1 : 0);
      if (o.reduce) bar.attr("width", w);
      else bar.attr("width", 0).transition().duration(560).ease(d3.easeCubicOut).attr("width", w);
      svg.append("text").attr("x", x(b.v) + 9).attr("y", b.y + bh / 2 + 4).style("fill", b.active ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("font-weight", b.active ? 700 : 400).text(String(b.v));
    });
  });

  // caption
  svg.append("text").attr("x", 12).attr("y", H - 14).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12.5px").text(o.caption);
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

function useBva() {
  const { t } = useAcademy();
  return t.baseVsAssistant;
}

function Node1({ reduce }: { reduce: boolean }) {
  const lesson = useBva();
  const n = lesson.nodes[0];
  const [promptIdx, setPromptIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("base");
  const p = lesson.n1prompts[promptIdx];
  const reply = mode === "base" ? p.base : p.assistant;
  const modeLabel = mode === "base" ? lesson.n1base : lesson.n1assistant;
  const tag = mode === "base" ? lesson.n1baseTag : lesson.n1asstTag;
  return (
    <SceneShell
      id="bva-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[mode === "base" ? 0 : 1]}
      controls={
        <>
          <ControlRow>
            {lesson.n1prompts.map((pr, i) => (
              <Toggle key={pr.key} on={promptIdx === i} onClick={() => setPromptIdx(i)}>{pr.label}</Toggle>
            ))}
          </ControlRow>
          <ControlRow>
            <Toggle on={mode === "base"} onClick={() => setMode("base")}>{lesson.n1base}</Toggle>
            <Toggle on={mode === "assistant"} onClick={() => setMode("assistant")}>{lesson.n1assistant}</Toggle>
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawReplyFlow(el, { prompt: p.prompt, reply, mode, promptLabel: lesson.n1promptLabel, modeLabel, tag, reduce })}
          deps={[promptIdx, mode, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const lesson = useBva();
  const n = lesson.nodes[1];
  const [idx, setIdx] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => { setIdx(i); manual.current = true; };
  const pair = lesson.n2pairs[idx];
  return (
    <SceneShell
      id="bva-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {lesson.n2pairs.map((pr, i) => (
            <Toggle key={pr.key} on={idx === i} onClick={() => pick(i)}>{pr.label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawPair(el, { instruction: pair.instruction, response: pair.response, instrLabel: lesson.n2instrLabel, respLabel: lesson.n2respLabel, learns: lesson.n2learns, countNote: lesson.n2countNote, reduce })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const lesson = useBva();
  const n = lesson.nodes[2];
  const [mode, setMode] = useState<Mode>("base");
  const know = CAPABILITIES[0];
  const beh = CAPABILITIES[1];
  return (
    <SceneShell
      id="bva-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[mode === "base" ? 0 : 1]}
      controls={
        <ControlRow>
          <Toggle on={mode === "base"} onClick={() => setMode("base")}>{lesson.n3base}</Toggle>
          <Toggle on={mode === "assistant"} onClick={() => setMode("assistant")}>{lesson.n3assistant}</Toggle>
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.captions[0]} rows={[
          { k: n.rows[0], v: `${capValue(know, mode)} / 100` },
          { k: n.rows[1], v: `${capValue(beh, mode)} / 100`, hi: mode === "assistant" },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawBars(el, { mode, labels: [lesson.n3knowledge, lesson.n3behaviour], baseLabel: lesson.n3base, asstLabel: lesson.n3assistant, caption: lesson.n3caption, reduce })}
          deps={[mode, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function BaseVsAssistant() {
  const { t, lang } = useAcademy();
  const lesson = t.baseVsAssistant;
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

        {/* step chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{lesson.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {lesson.pipeline.map((label, i) => (
              <a key={i} href={`#bva-node-${i + 1}`} className="u-hover-fg-border"
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
        <Link href="/stage/0/how-models-learn" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {lesson.prevLabel}</Link>
        <Link href="/stage/0/why-alignment" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{lesson.nextLabel} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
