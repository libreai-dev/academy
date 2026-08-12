"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Deeper } from "./webscale-kit";
import { PHASE_COUNT, turnsAtPhase, isToolCall, type Role } from "../lib/tool-calling";
import type { TcRequest, TcTool } from "../lib/copy/tool-calling";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS tokens + theme flips resolve live. The
 * viewBox is ~400 wide so label text stays ≥12px even on a ~300px phone card.
 * ======================================================================== */

const VB_W = 400;

/** A vertical connector with a filled arrowhead. */
function arrowDown(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x: number,
  y1: number,
  y2: number,
  color: string,
) {
  svg.append("line").attr("x1", x).attr("y1", y1).attr("x2", x).attr("y2", y2 - 6).style("stroke", color).style("stroke-width", 2);
  svg.append("path").attr("d", `M ${x - 6},${y2 - 7} L ${x},${y2} L ${x + 6},${y2 - 7} Z`).style("fill", color);
}

/* --- Node 1: user request → prose OR a structured tool_call -------------- */

function drawEmit(
  el: SVGSVGElement,
  o: {
    req: TcRequest;
    userLabel: string;
    modelLabel: string;
    modelSub: string;
    proseLabel: string;
    callLabel: string;
    nameKey: string;
    argsKey: string;
    reduce: boolean;
  },
) {
  const isCall = isToolCall(o.req.tool);
  const outY = 190;
  const outH = isCall ? 128 : 66;
  const H = outY + outH + (isCall ? 30 : 14);
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const cx = VB_W / 2;
  const cardX = 20;
  const cardW = VB_W - 40;

  // USER card
  svg.append("rect").attr("x", cardX).attr("y", 8).attr("width", cardW).attr("height", 62).attr("rx", 12).style("fill", "var(--surface)").style("stroke", "var(--border)");
  svg.append("text").attr("x", 36).attr("y", 32).style("fill", "var(--tok-num)").style("font-family", MONO).style("font-size", "17px").style("letter-spacing", ".06em").text(o.userLabel);
  svg.append("text").attr("x", 36).attr("y", 56).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.req.user);

  arrowDown(svg, cx, 72, 94, "var(--fg)");

  // MODEL box
  svg.append("rect").attr("x", 110).attr("y", 96).attr("width", 180).attr("height", 56).attr("rx", 10).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", cx).attr("y", 122).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text(o.modelLabel);
  svg.append("text").attr("x", cx).attr("y", 142).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "17px").text(o.modelSub);

  arrowDown(svg, cx, 154, 184, isCall ? "var(--signal)" : "var(--fg)");

  const out = svg.append("g");
  if (o.reduce) out.style("opacity", 1);
  else out.style("opacity", 0).transition().duration(320).style("opacity", 1);

  if (isCall) {
    // structured tool_call card — green frame = the special-token block
    out.append("rect").attr("x", cardX).attr("y", outY).attr("width", cardW).attr("height", outH).attr("rx", 12).style("fill", "var(--bg)").style("stroke", "var(--signal)").style("stroke-width", 2);
    out.append("text").attr("x", 36).attr("y", outY + 26).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text("tool_call");
    out.append("text").attr("x", 36).attr("y", outY + 58).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "17px").text(o.nameKey);
    out.append("text").attr("x", 120).attr("y", outY + 58).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.req.tool);
    out.append("text").attr("x", 36).attr("y", outY + 92).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "17px").text(o.argsKey);
    out.append("text").attr("x", 120).attr("y", outY + 92).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "19px").text(o.req.args);
    // caption tying to the green frame
    svg.append("text").attr("x", cx).attr("y", outY + outH + 22).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "17px").text(o.callLabel);
  } else {
    out.append("rect").attr("x", cardX).attr("y", outY).attr("width", cardW).attr("height", outH).attr("rx", 12).style("fill", "var(--surface)").style("stroke", "var(--border)");
    out.append("text").attr("x", 36).attr("y", outY + 30).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.req.prose);
    out.append("text").attr("x", 36).attr("y", outY + 54).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "17px").text(o.proseLabel);
  }
}

/* --- Node 2: model suspended (above) vs the runtime executing (below) ---- */

function drawExecute(
  el: SVGSVGElement,
  o: {
    tool: TcTool;
    error: boolean;
    insideLabel: string;
    insideBody: string;
    runtimeLabel: string;
    parseStep: string;
    callStep: string;
    resultStep: string;
    okTag: string;
    errTag: string;
    reduce: boolean;
  },
) {
  const H = 322;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const cx = VB_W / 2;
  const cardX = 20;
  const cardW = VB_W - 40;
  const bad = o.error;
  const rc = bad ? "var(--tok-byte)" : "var(--signal)";

  // Panel A — INSIDE THE MODEL (frozen)
  svg.append("rect").attr("x", cardX).attr("y", 8).attr("width", cardW).attr("height", 66).attr("rx", 12).style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-dasharray", "5 4");
  svg.append("text").attr("x", 36).attr("y", 32).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "17px").style("letter-spacing", ".06em").text(o.insideLabel);
  svg.append("text").attr("x", 36).attr("y", 58).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(`⏸  ${o.insideBody}`);

  arrowDown(svg, cx, 76, 100, "var(--fg)");

  // Panel B — OUTSIDE · the runtime
  const pbY = 104;
  const pbH = 200;
  svg.append("rect").attr("x", cardX).attr("y", pbY).attr("width", cardW).attr("height", pbH).attr("rx", 12).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", 36).attr("y", pbY + 26).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "17px").style("font-weight", "700").style("letter-spacing", ".04em").text(o.runtimeLabel);

  svg.append("text").attr("x", 36).attr("y", pbY + 58).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "19px").text(`1 · ${o.parseStep}`);

  // step 2 — call
  const s2 = svg.append("text").attr("x", 36).attr("y", pbY + 90).style("font-family", MONO).style("font-size", "19px");
  s2.append("tspan").style("fill", "var(--fg)").text(`2 · ${o.callStep} `);
  s2.append("tspan").style("fill", "var(--signal-fg)").style("font-weight", "700").text(o.tool.fn);
  svg.append("text").attr("x", 52).attr("y", pbY + 114).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "17px").text(o.tool.call);

  // step 3 — result pill
  svg.append("text").attr("x", 36).attr("y", pbY + 146).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "19px").text(`3 · ${o.resultStep}`);
  const pillY = pbY + 156;
  const pill = svg.append("g");
  if (!o.reduce) pill.style("opacity", 0).transition().duration(300).style("opacity", 1);
  pill.append("rect").attr("x", 36).attr("y", pillY).attr("width", cardW - 32).attr("height", 34).attr("rx", 8).style("fill", `color-mix(in srgb, ${rc} 14%, transparent)`).style("stroke", rc).style("stroke-width", 1.5);
  pill.append("text").attr("x", 50).attr("y", pillY + 23).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").text(bad ? o.tool.err : o.tool.ok);
  pill.append("text").attr("x", cardW - 6).attr("y", pillY + 23).attr("text-anchor", "end").style("fill", rc).style("font-family", MONO).style("font-size", "17px").style("font-weight", "700").text(bad ? o.errTag : o.okTag);
}

/* --- Node 3: the conversation thread grows one turn at a time ------------ */

function drawTranscript(
  el: SVGSVGElement,
  o: {
    phase: number;
    roleUser: string;
    roleAssistant: string;
    roleTool: string;
    userText: string;
    callName: string;
    callArgs: string;
    resultText: string;
    answerText: string;
    contextLabel: string;
    pauseLabel: string;
    loopLabel: string;
    reduce: boolean;
  },
) {
  const roles = turnsAtPhase(o.phase);
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();

  const cardX = 44;
  const cardW = VB_W - cardX - 20;
  const gap = 14;
  const heightOf: Record<Role, number> = { user: 58, "assistant-call": 88, tool: 62, "assistant-answer": 62 };

  // pre-measure the stack
  let yy = 34;
  const placed: { role: Role; y: number; h: number }[] = [];
  roles.forEach((r) => {
    const h = heightOf[r];
    placed.push({ role: r, y: yy, h });
    yy += h + gap;
  });
  const lastBottom = yy - gap;
  const extra = o.phase === 1 ? 30 : o.phase === 3 ? 30 : 10;
  const H = lastBottom + extra;
  svg.attr("viewBox", `0 0 ${VB_W} ${H}`);

  // context bar (grows with the thread) + label
  svg.append("text").attr("x", cardX).attr("y", 22).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "17px").style("letter-spacing", ".04em").text(o.contextLabel);
  svg.append("line").attr("x1", 30).attr("y1", 30).attr("x2", 30).attr("y2", lastBottom).style("stroke", "var(--signal)").style("stroke-width", 3).style("stroke-linecap", "round");

  const tagColor: Record<Role, string> = {
    user: "var(--tok-num)",
    "assistant-call": "var(--signal-fg)",
    tool: "var(--tok-sub)",
    "assistant-answer": "var(--signal-fg)",
  };
  const tagText: Record<Role, string> = {
    user: o.roleUser,
    "assistant-call": o.roleAssistant,
    tool: o.roleTool,
    "assistant-answer": o.roleAssistant,
  };

  placed.forEach((p, i) => {
    const fresh = i === placed.length - 1;
    const g = svg.append("g");
    if (fresh && !o.reduce) g.style("opacity", 0).transition().duration(300).style("opacity", 1);
    g.append("rect").attr("x", cardX).attr("y", p.y).attr("width", cardW).attr("height", p.h).attr("rx", 11)
      .style("fill", fresh ? `color-mix(in srgb, ${tagColor[p.role]} 9%, var(--bg))` : "var(--bg)")
      .style("stroke", fresh ? tagColor[p.role] : "var(--border)")
      .style("stroke-width", fresh ? 2 : 1);
    g.append("text").attr("x", cardX + 14).attr("y", p.y + 24).style("fill", tagColor[p.role]).style("font-family", MONO).style("font-size", "17px").style("font-weight", "700").style("letter-spacing", ".06em").text(tagText[p.role]);

    if (p.role === "user") {
      g.append("text").attr("x", cardX + 14).attr("y", p.y + 48).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.userText);
    } else if (p.role === "assistant-call") {
      const t = g.append("text").attr("x", cardX + 14).attr("y", p.y + 50).style("font-family", MONO).style("font-size", "20px");
      t.append("tspan").style("fill", "var(--muted)").text("tool_call → ");
      t.append("tspan").style("fill", "var(--signal-fg)").style("font-weight", "700").text(o.callName);
      g.append("text").attr("x", cardX + 14).attr("y", p.y + 74).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "18px").text(o.callArgs);
    } else if (p.role === "tool") {
      g.append("text").attr("x", cardX + 14).attr("y", p.y + 48).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "19px").text(o.resultText);
    } else {
      g.append("text").attr("x", cardX + 14).attr("y", p.y + 48).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.answerText);
    }
  });

  // pause note while the call is the newest turn (waiting on the runtime)
  if (o.phase === 1) {
    svg.append("text").attr("x", VB_W / 2).attr("y", lastBottom + 22).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "17px").text(`⏸  ${o.pauseLabel}`);
  }

  // loop-back arrow: answer can trigger another call
  if (o.phase === 3) {
    const answer = placed[3];
    const tool = placed[2];
    const aMid = answer.y + answer.h / 2;
    const tMid = tool.y + tool.h / 2;
    const rx = cardX + cardW;
    svg.append("path").attr("d", `M ${rx},${aMid} C ${rx + 22},${aMid} ${rx + 22},${tMid} ${rx},${tMid}`).style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2).style("stroke-dasharray", "5 4");
    svg.append("path").attr("d", `M ${rx - 6},${tMid - 6} L ${rx},${tMid} L ${rx - 6},${tMid + 6}`).style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 2);
    svg.append("text").attr("x", VB_W / 2).attr("y", lastBottom + 22).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "17px").text(`↻  ${o.loopLabel}`);
  }
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

function useTC() {
  const { t } = useAcademy();
  return t.toolCalling;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const tc = useTC();
  const n = tc.nodes[0];
  const [reqIdx, setReqIdx] = useState(0);
  const req = tc.n1requests[reqIdx];
  return (
    <SceneShell
      id="tc-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[reqIdx]}
      controls={
        <ControlRow>
          {tc.n1requests.map((r, i) => (
            <Toggle key={i} on={reqIdx === i} onClick={() => setReqIdx(i)}>{r.label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawEmit(el, {
            req, userLabel: tc.n1userLabel, modelLabel: tc.n1modelLabel, modelSub: tc.n1modelSub,
            proseLabel: tc.n1proseLabel, callLabel: tc.n1callLabel,
            nameKey: tc.n1nameKey, argsKey: tc.n1argsKey, reduce,
          })}
          deps={[reqIdx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const tc = useTC();
  const n = tc.nodes[1];
  const [toolIdx, setToolIdx] = useState(0);
  const [error, setError] = useState(false);
  const tool = tc.n2tools[toolIdx];
  const note = error ? tc.n2errorNote : n.optionNotes?.[toolIdx];
  return (
    <SceneShell
      id="tc-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <ControlRow>
            {tc.n2tools.map((tl, i) => (
              <Toggle key={i} on={toolIdx === i} onClick={() => setToolIdx(i)}>{tl.label}</Toggle>
            ))}
          </ControlRow>
          <ControlRow>
            <Toggle on={error} onClick={() => setError((v) => !v)}>{tc.n2errorToggle}: {error ? "ON" : "OFF"}</Toggle>
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawExecute(el, {
            tool, error, insideLabel: tc.n2insideLabel, insideBody: tc.n2insideBody, runtimeLabel: tc.n2runtimeLabel,
            parseStep: tc.n2parseStep, callStep: tc.n2callStep, resultStep: tc.n2resultStep, okTag: tc.n2okTag, errTag: tc.n2errTag, reduce,
          })}
          deps={[toolIdx, error, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const tc = useTC();
  const n = tc.nodes[2];
  const [phase, setPhase] = useState(0);
  const manual = useRef(false);
  const pick = (p: number) => { setPhase(p); manual.current = true; };
  return (
    <SceneShell
      id="tc-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={PHASE_COUNT} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setPhase(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[phase]}
      controls={
        <ControlRow>
          {tc.n3phaseButtons.map((lab, i) => (
            <Toggle key={i} on={phase === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawTranscript(el, {
            phase, roleUser: tc.n3roleUser, roleAssistant: tc.n3roleAssistant, roleTool: tc.n3roleTool,
            userText: tc.n3userText, callName: tc.n3callName, callArgs: tc.n3callArgs, resultText: tc.n3resultText,
            answerText: tc.n3answerText, contextLabel: tc.n3contextLabel, pauseLabel: tc.n3pauseLabel, loopLabel: tc.n3loopLabel, reduce,
          })}
          deps={[phase, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function ToolCalling() {
  const { t, lang } = useAcademy();
  const tc = t.toolCalling;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{tc.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {tc.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{tc.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{tc.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {tc.pipeline.map((label, i) => (
              <a key={i} href={`#tc-node-${i + 1}`} className="u-hover-fg-border"
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
        <Deeper title={tc.deeperTitle}>{rich(tc.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{tc.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{tc.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(tc.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{tc.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(tc.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/reasoning-tokens" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {tc.prevLesson}</Link>
        <Link href="/stage/0/test-time-search" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{tc.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
