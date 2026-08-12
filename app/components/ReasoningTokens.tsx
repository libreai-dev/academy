"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  REASONING_STEPS,
  BLURT_ANSWER,
  THINK_ANSWER,
  THINK_OPEN,
  THINK_CLOSE,
  THINK_OPEN_ID,
  THINK_CLOSE_ID,
  MAX_STEPS,
  forwardPasses,
  reachesAnswer,
  answerFor,
  STREAM,
} from "../lib/reasoning-tokens";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * viewBox width 700; every label ≥26 units so it renders ≥12px on a ~320px
 * phone (12·700/320 ≈ 26). Height is set per-draw so blocks can grow/shrink.
 * ======================================================================== */

const SIGNAL = "var(--signal)";
const SIGNAL_FG = "var(--signal-fg)";
const WRONG = "var(--tok-byte)";

/** Wrap a string into lines of at most `max` characters (whole words). */
function wrapText(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line.length + w.length + 1 > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type Sel = d3.Selection<SVGSVGElement, unknown, null, undefined>;

/** Rounded rect helper bound to a selection. */
function rrect(
  svg: Sel,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  opts: { fill?: string; stroke?: string; sw?: number; dash?: string; op?: number },
) {
  const rect = svg
    .append("rect")
    .attr("x", x)
    .attr("y", y)
    .attr("width", w)
    .attr("height", h)
    .attr("rx", r)
    .style("fill", opts.fill ?? "none");
  if (opts.op != null) rect.style("fill-opacity", opts.op);
  if (opts.stroke) rect.style("stroke", opts.stroke).style("stroke-width", opts.sw ?? 1.5);
  if (opts.dash) rect.style("stroke-dasharray", opts.dash);
  return rect;
}

function label(
  svg: Sel,
  x: number,
  y: number,
  text: string,
  opts: { size?: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number; ls?: string },
) {
  return svg
    .append("text")
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", opts.anchor ?? "start")
    .style("fill", opts.fill ?? "var(--fg)")
    .style("font-family", MONO)
    .style("font-size", `${opts.size ?? 28}px`)
    .style("font-weight", opts.weight ?? 400)
    .style("letter-spacing", opts.ls ?? "0")
    .text(text);
}

/* --- Node 1: the think block (vertical stream) -------------------------- */

interface ThinkBlockOpts {
  reason: boolean;
  raw: boolean;
  reduce: boolean;
  promptLabel: string;
  promptText: string;
  scratchpadLabel: string;
  hiddenText: string;
  answerLabel: string;
  thinkTag: string;
  blurtTag: string;
  openTag: string; //   "special token · id 200001"
  closeTag: string; //  "special token · id 200002"
  steps: string[];
}

function drawThinkBlock(el: SVGSVGElement, o: ThinkBlockOpts) {
  const W = 700;
  const M = 12;
  const IW = W - 2 * M;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  let y = 18;

  // PROMPT
  const pLines = wrapText(o.promptText, 42);
  const pH = 52 + pLines.length * 34 + 14;
  rrect(svg, M, y, IW, pH, 14, { fill: "var(--surface)", stroke: "var(--border)", sw: 1 });
  label(svg, M + 20, y + 34, o.promptLabel, { size: 26, fill: "var(--muted)", ls: ".08em" });
  pLines.forEach((ln, i) => label(svg, M + 20, y + 70 + i * 34, ln, { size: 27, fill: "var(--fg)" }));
  y += pH + 16;

  // a thin connector
  const connector = (yy: number) => {
    svg.append("line").attr("x1", W / 2).attr("y1", yy).attr("x2", W / 2).attr("y2", yy + 16).style("stroke", "var(--border)").style("stroke-width", 2);
  };

  if (o.reason) {
    connector(y - 16);
    // <think> delimiter pill
    const pillW = 236;
    rrect(svg, M, y, pillW, 58, 12, { fill: "color-mix(in srgb, var(--signal) 12%, transparent)", stroke: SIGNAL, sw: 2 });
    label(svg, M + pillW / 2, y + 38, THINK_OPEN, { size: 30, fill: SIGNAL_FG, anchor: "middle", weight: 700 });
    label(svg, M + pillW + 18, y + 37, o.openTag, { size: 26, fill: "var(--muted)" });
    y += 58 + 16;

    // SCRATCHPAD (dashed)
    const bodyH = o.raw ? o.steps.length * 40 + 14 : 60;
    const spH = 50 + bodyH;
    rrect(svg, M, y, IW, spH, 14, { fill: "var(--bg)", stroke: "var(--muted)", sw: 1.5, dash: "7 6" });
    label(svg, M + 20, y + 34, o.scratchpadLabel, { size: 26, fill: "var(--muted)", ls: ".06em" });
    if (o.raw) {
      o.steps.forEach((s, i) =>
        label(svg, M + 34, y + 70 + i * 40, `${i + 1}.  ${s}`, { size: 27, fill: "var(--fg)" }),
      );
    } else {
      label(svg, M + IW / 2, y + 50 + bodyH / 2 - 4, o.hiddenText, { size: 27, fill: "var(--muted)", anchor: "middle" });
    }
    y += spH + 16;

    connector(y - 16);
    // </think> delimiter pill
    const pillW2 = 236;
    rrect(svg, M, y, pillW2, 58, 12, { fill: "color-mix(in srgb, var(--signal) 12%, transparent)", stroke: SIGNAL, sw: 2 });
    label(svg, M + pillW2 / 2, y + 38, THINK_CLOSE, { size: 30, fill: SIGNAL_FG, anchor: "middle", weight: 700 });
    label(svg, M + pillW2 + 18, y + 37, o.closeTag, { size: 26, fill: "var(--muted)" });
    y += 58 + 16;

    connector(y - 16);
    // ANSWER (correct)
    const aH = 92;
    rrect(svg, M, y, IW, aH, 14, { fill: "color-mix(in srgb, var(--signal) 14%, transparent)", stroke: SIGNAL, sw: 2 });
    label(svg, M + 20, y + 40, o.answerLabel, { size: 26, fill: SIGNAL_FG, ls: ".06em" });
    label(svg, M + 20, y + 76, `${THINK_ANSWER}   ✓ ${o.thinkTag}`, { size: 30, fill: "var(--fg)", weight: 700 });
    y += aH + 18;
  } else {
    connector(y - 16);
    // ANSWER (blurted, wrong)
    const aH = 92;
    rrect(svg, M, y, IW, aH, 14, { fill: "color-mix(in srgb, var(--tok-byte) 12%, transparent)", stroke: WRONG, sw: 2 });
    label(svg, M + 20, y + 40, o.answerLabel, { size: 26, fill: WRONG, ls: ".06em" });
    label(svg, M + 20, y + 76, `${BLURT_ANSWER}   ✗ ${o.blurtTag}`, { size: 30, fill: "var(--fg)", weight: 700 });
    y += aH + 18;
  }

  svg.attr("viewBox", `0 0 ${W} ${y}`);
}

/* --- Node 2: thinking budget → compute → answer ------------------------- */

interface BudgetOpts {
  steps: number;
  reduce: boolean;
  unlockedLabel: string;
  passesLabel: string;
  passesWord: string;
  verdictRight: string;
  verdictWrong: string;
  answerLabel: string;
  stepsText: string[];
}

function drawBudget(el: SVGSVGElement, o: BudgetOpts) {
  const W = 700;
  const M = 12;
  const IW = W - 2 * M;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 450;
  let y = 20;

  // reasoning steps
  label(svg, M, y + 22, o.unlockedLabel, { size: 26, fill: "var(--muted)", ls: ".06em" });
  y += 42;
  o.stepsText.forEach((s, i) => {
    const on = i < o.steps;
    rrect(svg, M, y, IW, 46, 10, {
      fill: on ? "color-mix(in srgb, var(--signal) 12%, transparent)" : "var(--surface)",
      stroke: on ? SIGNAL : "var(--border)",
      sw: on ? 1.8 : 1,
      op: on ? 1 : 0.5,
    });
    label(svg, M + 18, y + 31, `${i + 1}`, { size: 26, fill: on ? SIGNAL_FG : "var(--muted)", weight: 700 });
    label(svg, M + 54, y + 31, s, { size: 27, fill: on ? "var(--fg)" : "var(--muted)" });
    y += 46 + 10;
  });
  y += 12;

  // compute meter
  const passes = forwardPasses(o.steps);
  const maxPasses = forwardPasses(MAX_STEPS);
  label(svg, M, y + 22, o.passesLabel, { size: 26, fill: "var(--muted)", ls: ".06em" });
  y += 38;
  const barH = 40;
  rrect(svg, M, y, IW, barH, 10, { fill: "var(--surface)", stroke: "var(--border)", sw: 1 });
  const bw = Math.max(8, (passes / maxPasses) * IW);
  const bar = svg.append("rect").attr("x", M).attr("y", y).attr("height", barH).attr("rx", 10).style("fill", SIGNAL).style("fill-opacity", 0.85);
  if (dur) bar.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", bw);
  else bar.attr("width", bw);
  label(svg, M + IW - 12, y + 28, `${passes} ${o.passesWord}`, { size: 28, fill: "var(--fg)", anchor: "end", weight: 700 });
  y += barH + 22;

  // verdict
  const right = reachesAnswer(o.steps);
  const col = right ? SIGNAL : WRONG;
  const aH = 84;
  rrect(svg, M, y, IW, aH, 14, { fill: `color-mix(in srgb, ${col} 13%, transparent)`, stroke: col, sw: 2 });
  label(svg, M + 20, y + 36, o.answerLabel, { size: 26, fill: right ? SIGNAL_FG : WRONG, ls: ".06em" });
  label(svg, M + 20, y + 70, `${answerFor(o.steps)}   ${right ? "✓" : "✗"} ${right ? o.verdictRight : o.verdictWrong}`, { size: 30, fill: "var(--fg)", weight: 700 });
  y += aH + 18;

  svg.attr("viewBox", `0 0 ${W} ${y}`);
}

/* --- Node 3: the generated stream, one token at a time ------------------ */

interface StreamOpts {
  upto: number;
  reduce: boolean;
  contextLabel: string;
  newest: string;
  feedback: string;
  idWord: string;
}

function drawStream(el: SVGSVGElement, o: StreamOpts) {
  const W = 700;
  const M = 12;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();

  label(svg, M, 30, o.contextLabel, { size: 26, fill: "var(--muted)", ls: ".06em" });

  const topY = 82; //   space above for the "just generated" callout
  const chipH = 58;
  const rowGap = 48; //  room for id line + spacing
  const gapX = 16;
  const shown = STREAM.slice(0, o.upto + 1);

  // layout chips into wrapping rows — sized to fit both the piece and the id line
  interface Placed {
    x: number;
    y: number;
    w: number;
    i: number;
  }
  const placed: Placed[] = [];
  let x = M;
  let y = topY;
  shown.forEach((tk, i) => {
    const idChars = `${o.idWord} ${tk.id}`.length;
    const w = Math.max(100, tk.piece.length * 17 + 30, idChars * 15 + 22);
    if (x + w > W - M) {
      x = M;
      y += chipH + rowGap;
    }
    placed.push({ x, y, w, i });
    x += w + gapX;
  });

  placed.forEach((p) => {
    const tk = STREAM[p.i];
    const newest = p.i === o.upto;
    const strokeCol = newest ? SIGNAL : tk.special ? "var(--muted)" : "var(--border)";
    const fill = tk.eos
      ? "color-mix(in srgb, var(--tok-byte) 12%, transparent)"
      : newest
        ? "color-mix(in srgb, var(--signal) 12%, transparent)"
        : "var(--surface)";
    const rect = rrect(svg, p.x, p.y, p.w, chipH, 12, { fill, stroke: strokeCol, sw: newest ? 2.6 : 1.6 });
    if (tk.special) rect.style("stroke-dasharray", "6 5");
    label(svg, p.x + p.w / 2, p.y + 37, tk.piece, {
      size: 28,
      fill: tk.eos ? WRONG : newest ? SIGNAL_FG : "var(--fg)",
      anchor: "middle",
      weight: 700,
    });
    label(svg, p.x + p.w / 2, p.y + chipH + 28, `${o.idWord} ${tk.id}`, { size: 26, fill: "var(--muted)", anchor: "middle" });

    if (newest) {
      // "just generated" tag above the newest chip
      label(svg, p.x + p.w / 2, p.y - 16, `↓ ${o.newest}`, { size: 26, fill: SIGNAL_FG, anchor: "middle", weight: 700 });
    }
  });

  // feedback annotation under the tape
  const last = placed[placed.length - 1];
  const fy = (last ? last.y : topY) + chipH + rowGap + 8;
  svg.append("line").attr("x1", M).attr("y1", fy).attr("x2", W - M).attr("y2", fy).style("stroke", "var(--hair)").style("stroke-width", 1);
  label(svg, M, fy + 36, `↻ ${o.feedback}`, { size: 26, fill: "var(--muted)" });

  svg.attr("viewBox", `0 0 ${W} ${fy + 52}`);
}

/* ======================================================================== *
 * Node components — state + controls, wrapping SceneShell.
 * ======================================================================== */

function DiagramSvg({ draw, deps, label: aria }: { draw: (el: SVGSVGElement) => void; deps: unknown[]; label: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const { lang } = useAcademy();
  useEffect(() => {
    if (ref.current) draw(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, lang]);
  return <svg ref={ref} role="img" aria-label={aria} style={{ width: "100%", height: "auto", display: "block" }} />;
}

function useRT() {
  const { t } = useAcademy();
  return t.reasoningTokens;
}

function Node1({ reduce }: { reduce: boolean }) {
  const rt = useRT();
  const n = rt.nodes[0];
  const [reason, setReason] = useState(true);
  const [raw, setRaw] = useState(true);
  const [touched, setTouched] = useState<"reason" | "view">("reason");
  const hiddenText = rt.n1hiddenFmt.replace("{n}", String(REASONING_STEPS.length));
  const note =
    touched === "reason"
      ? n.optionNotes?.[reason ? 0 : 1]
      : n.optionNotes?.[raw ? 2 : 3];
  return (
    <SceneShell
      id="rt-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <ControlRow>
            <Toggle on={reason} onClick={() => { setReason(true); setTouched("reason"); }}>{rt.n1reasonOn}</Toggle>
            <Toggle on={!reason} onClick={() => { setReason(false); setTouched("reason"); }}>{rt.n1reasonOff}</Toggle>
          </ControlRow>
          <ControlRow>
            <Toggle on={raw} onClick={() => { setRaw(true); setTouched("view"); }} ariaLabel={rt.n1viewRaw}>{rt.n1viewRaw}</Toggle>
            <Toggle on={!raw} onClick={() => { setRaw(false); setTouched("view"); }} ariaLabel={rt.n1viewUser}>{rt.n1viewUser}</Toggle>
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          deps={[reason, raw, reduce]}
          draw={(el) =>
            drawThinkBlock(el, {
              reason,
              raw: reason ? raw : true,
              reduce,
              promptLabel: rt.promptLabel,
              promptText: rt.promptText,
              scratchpadLabel: rt.n1scratchpadLabel,
              hiddenText,
              answerLabel: rt.n1answerLabel,
              thinkTag: rt.n1thinkTag,
              blurtTag: rt.n1blurtTag,
              openTag: rt.n1specialFmt.replace("{id}", String(THINK_OPEN_ID)),
              closeTag: rt.n1specialFmt.replace("{id}", String(THINK_CLOSE_ID)),
              steps: REASONING_STEPS,
            })
          }
        />
      )}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const rt = useRT();
  const n = rt.nodes[1];
  const [steps, setSteps] = useState(0);
  return (
    <SceneShell
      id="rt-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<p style={{ margin: 0, fontFamily: MONO, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{rt.n2illustrative}</p>}
      controls={
        <Slider
          id="rt-budget" label={rt.n2slider}
          value={steps} display={`${steps} ${rt.n2stepWord}`}
          min={0} max={MAX_STEPS} onChange={setSteps}
        />
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          deps={[steps, reduce]}
          draw={(el) =>
            drawBudget(el, {
              steps,
              reduce,
              unlockedLabel: rt.n2unlockedLabel,
              passesLabel: rt.n2passesLabel,
              passesWord: rt.n2passesWord,
              verdictRight: rt.n2verdictRight,
              verdictWrong: rt.n2verdictWrong,
              answerLabel: rt.n1answerLabel,
              stepsText: REASONING_STEPS,
            })
          }
        />
      )}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const rt = useRT();
  const n = rt.nodes[2];
  const total = STREAM.length;
  return (
    <SceneShell
      id="rt-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={total} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous token" labelNext="Next token"
      controls={
        <div style={{ display: "flex", gap: 9, alignItems: "center", fontFamily: MONO, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
          <span aria-hidden style={{ flex: "0 0 auto", width: 22, height: 15, borderRadius: 5, border: "1.6px dashed var(--muted)", display: "inline-block" }} />
          <span>{rt.n3specialLegend}</span>
        </div>
      }
      readout={null}
    >
      {(step) => (
        <DiagramSvg
          label={n.aria ?? ""}
          deps={[step, reduce]}
          draw={(el) =>
            drawStream(el, {
              upto: step,
              reduce,
              contextLabel: rt.n3contextLabel,
              newest: rt.n3newest,
              feedback: rt.n3feedback,
              idWord: rt.n3idWord,
            })
          }
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function ReasoningTokens() {
  const { t, lang } = useAcademy();
  const rt = t.reasoningTokens;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{rt.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {rt.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{rt.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{rt.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 8 }}>
            {rt.pipeline.map((l, i) => (
              <a key={i} href={`#rt-node-${i + 1}`} className="u-hover-fg-border"
                style={{ display: "flex", gap: 9, alignItems: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13, color: "var(--fg)" }}>
                <span style={{ color: "var(--signal-fg)", flex: "0 0 auto" }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{l}</span>
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
        <Deeper title={rt.deeperTitle}>{rich(rt.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{rt.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{rt.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(rt.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{rt.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(rt.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/constrained-decoding" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {rt.prevLesson}</Link>
        <Link href="/stage/0/tool-calling" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{rt.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
