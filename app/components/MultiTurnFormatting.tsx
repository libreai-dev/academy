"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout } from "./webscale-kit";
import {
  IM_START,
  ROLE_FILL,
  estTokens,
  wrapLine,
  type Block,
} from "../lib/multi-turn-formatting";

/* ======================================================================== *
 * The one shared diagram: a vertical stack of role blocks drawn with d3 into
 * one <svg> mount. Every node feeds it a different `blocks` array. Colour via
 * .style() only, so the design tokens + theme flips resolve live.
 * ======================================================================== */

function drawTranscript(el: SVGSVGElement, o: { blocks: Block[]; reduce: boolean }) {
  const W = 340;
  const pad = 12;
  const innerW = W - pad * 2;
  const textX = 14; //   left inset inside a block (clears the accent bar)
  const maxChars = 30;
  const lineH = 21;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 240;

  let y = 6;
  o.blocks.forEach((b, bi) => {
    const fill = ROLE_FILL[b.role];
    const contentLines = b.text ? wrapLine(b.text, maxChars) : [];
    const thinkLines = b.think ? wrapLine(b.think, maxChars) : [];

    // measure block height up front (viewBox units)
    let h = 30; //                                    header row
    if (b.think) h += 22 + thinkLines.length * lineH + 22 + 6; // <think> … </think>
    h += contentLines.length * lineH; //              answer / body
    if (b.active && !b.text) h += 22; //              caret line for an empty turn
    if (b.tag) h += 22; //                            muted tag line
    h += 12; //                                       bottom padding

    const grp = svg.append("g").attr("transform", `translate(${pad}, ${y})`);
    if (dur) grp.style("opacity", 0).transition().duration(dur).delay(Math.min(bi * 45, 420)).style("opacity", 1);

    grp.append("rect").attr("width", innerW).attr("height", h).attr("rx", 10)
      .style("fill", b.active ? "var(--signal-wash)" : "var(--surface)")
      .style("stroke", b.active ? "var(--signal)" : "var(--border)")
      .style("stroke-width", b.active ? 2 : 1);
    // role accent bar
    grp.append("rect").attr("x", 0).attr("y", 0).attr("width", 4).attr("height", h).attr("rx", 2).style("fill", fill);

    // header: <|im_start|>role
    const header = grp.append("text").attr("x", textX).attr("y", 20).style("font-family", MONO).style("font-size", "15px");
    header.append("tspan").style("fill", "var(--muted)").text(IM_START);
    header.append("tspan").style("fill", fill).style("font-weight", "700").text(b.role);

    let ty = 46; //                                   first body baseline
    // reasoning scratchpad, greyed, inside the assistant block
    if (b.think) {
      grp.append("text").attr("x", textX).attr("y", ty).style("font-family", MONO).style("font-size", "15px").style("fill", "var(--tok-space)").text("<think>");
      ty += 22;
      thinkLines.forEach((l) => {
        grp.append("text").attr("x", textX + 8).attr("y", ty).style("font-family", MONO).style("font-size", "16px").style("font-style", "italic").style("fill", "var(--muted)").text(l);
        ty += lineH;
      });
      grp.append("text").attr("x", textX).attr("y", ty).style("font-family", MONO).style("font-size", "15px").style("fill", "var(--tok-space)").text("</think>");
      ty += 22 + 6;
    }
    // body text
    contentLines.forEach((l) => {
      grp.append("text").attr("x", textX).attr("y", ty).style("font-family", MONO).style("font-size", "16px").style("fill", "var(--fg)").text(l);
      ty += lineH;
    });
    // caret for the open, being-generated block
    if (b.active && !b.text) {
      grp.append("text").attr("x", textX).attr("y", ty + 2).style("font-family", MONO).style("font-size", "16px").style("fill", "var(--signal-fg)").text("▍");
      ty += 22;
    }
    // muted tag line
    if (b.tag) {
      grp.append("text").attr("x", textX).attr("y", ty).style("font-family", MONO).style("font-size", "15px").style("fill", b.active ? "var(--signal-fg)" : "var(--muted)").text(b.tag);
      ty += 22;
    }

    y += h + 10;
  });

  svg.attr("viewBox", `0 0 ${W} ${y}`);
}

/* ======================================================================== *
 * Mount + node components
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

function useMtf() {
  const { t } = useAcademy();
  return t.multiTurnFormatting;
}

/* ---- Node 1: stacking turns -------------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const m = useMtf();
  const n = m.nodes[0];
  const maxTurns = m.n1turns.length;
  const [turns, setTurns] = useState(2);

  const blocks: Block[] = [{ role: "system", text: m.n1system }];
  for (let i = 0; i < turns; i++) {
    const tn = m.n1turns[i];
    blocks.push({ role: "user", text: tn.user });
    if (i < turns - 1) {
      blocks.push({ role: "assistant", text: tn.assistant });
    } else {
      blocks.push({ role: "assistant", text: "", active: true, tag: m.n1activeTag });
    }
  }
  const tokenEst = blocks.reduce((s, b) => s + estTokens(b.text) + 4, 0); // +4 tokens/block for delimiters

  return (
    <SceneShell
      id="mtf-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<Callout label={m.calloutLabel} title={m.calloutTitle}>{rich(m.calloutBody)}</Callout>}
      controls={
        <Slider id="mtf-turns" label={m.n1slider} value={turns} display={`${turns} / ${maxTurns}`} min={1} max={maxTurns} onChange={setTurns} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${blocks.length} ${m.n1blocksWord}`, hi: true },
          { k: n.rows[1], v: `~${tokenEst} ${m.n1tokensWord}` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTranscript(el, { blocks, reduce })} deps={[turns, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2: tool results fold in -------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const m = useMtf();
  const n = m.nodes[1];
  const [toolIdx, setToolIdx] = useState(0);
  const tool = m.n2tools[toolIdx];
  const manual = useRef(false);
  const pick = (i: number) => { setToolIdx(i); manual.current = true; };

  const blocks: Block[] = [
    { role: "user", text: tool.user },
    { role: "assistant", text: tool.call },
    { role: "tool", text: tool.result, tag: m.n2toolTag },
    { role: "assistant", text: tool.answer },
  ];

  return (
    <SceneShell
      id="mtf-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setToolIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[toolIdx]}
      controls={
        <ControlRow>
          {m.n2tools.map((tl, i) => (
            <Toggle key={tl.label} on={toolIdx === i} onClick={() => pick(i)}>{tl.label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTranscript(el, { blocks, reduce })} deps={[toolIdx, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3: the reasoning scratchpad ---------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const m = useMtf();
  const n = m.nodes[2];
  const [on, setOn] = useState(false); // off first: show the plain answer, then reveal the scratchpad

  const blocks: Block[] = [
    { role: "user", text: m.n3user },
    on
      ? { role: "assistant", text: m.n3answerOn, think: m.n3think }
      : { role: "assistant", text: m.n3answerOff },
  ];

  return (
    <SceneShell
      id="mtf-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[on ? 1 : 0]}
      controls={
        <ControlRow>
          <Toggle on={on} onClick={() => setOn((v) => !v)}>{m.n3toggle}: {on ? m.n3on : m.n3off}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTranscript(el, { blocks, reduce })} deps={[on, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function MultiTurnFormatting() {
  const { t, lang } = useAcademy();
  const m = t.multiTurnFormatting;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{m.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {m.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{m.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{m.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {m.pipeline.map((label, i) => (
              <a key={i} href={`#mtf-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{m.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{m.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(m.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{m.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(m.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/special-tokens" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {m.prevLesson}</Link>
        <Link href="/stage/0/attention-mechanism" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{m.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
