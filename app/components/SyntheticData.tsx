"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow } from "./webscale-kit";
import {
  OP_KEYS,
  VERIFIER_ORDER,
  type VerifierKey,
  funnelStats,
} from "../lib/synthetic-data";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * A wide viewBox (720u) keeps label text ≥12px when the card renders on a phone.
 * ======================================================================== */

const VB_W = 720;

/** Greedy word-wrap into lines of at most `maxChars`. */
function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxChars) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* --- Node 1: seed → four evolved variants (a mutation tree) -------------- */

function drawEvolveTree(
  el: SVGSVGElement,
  o: { opIdx: number; ops: string[]; seedLabel: string; seed: string; harderTag: string; reduce: boolean },
) {
  const H = 430;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  // Seed box (left), vertically centred.
  const sx = 16;
  const sw = 210;
  const sh = 132;
  const sy = (H - sh) / 2;
  const seedMidY = sy + sh / 2;
  const seedRight = sx + sw;

  // Four branch boxes (right).
  const bx = 434;
  const bw = 270;
  const bh = 78;
  const gap = 18;
  const top = 24;
  const branchMid = (i: number) => top + i * (bh + gap) + bh / 2;

  // Connectors seed → each branch (selected one green + thick).
  o.ops.forEach((_, i) => {
    const my = branchMid(i);
    const active = i === o.opIdx;
    const cx1 = seedRight + (bx - seedRight) * 0.5;
    const path = d3.path();
    path.moveTo(seedRight, seedMidY);
    path.bezierCurveTo(cx1, seedMidY, cx1, my, bx, my);
    svg
      .append("path")
      .attr("d", path.toString())
      .style("fill", "none")
      .style("stroke", active ? "var(--signal)" : "var(--hair)")
      .style("stroke-width", active ? 3.5 : 2);
  });

  // Seed box.
  svg.append("rect").attr("x", sx).attr("y", sy).attr("width", sw).attr("height", sh).attr("rx", 14)
    .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", sx + 18).attr("y", sy + 34).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "27px").style("letter-spacing", ".08em").text(o.seedLabel);
  wrapLines(o.seed, 13).forEach((ln, i) => {
    svg.append("text").attr("x", sx + 18).attr("y", sy + 70 + i * 34).style("fill", "var(--fg)").style("font-family", DISPLAY).style("font-size", "29px").style("font-weight", 600).text(ln);
  });

  // Branch boxes.
  o.ops.forEach((label, i) => {
    const y = top + i * (bh + gap);
    const active = i === o.opIdx;
    const g = svg.append("g").style("opacity", active ? 1 : 0.5);
    if (dur && active) g.style("opacity", 0).transition().duration(dur).style("opacity", 1);
    g.append("rect").attr("x", bx).attr("y", y).attr("width", bw).attr("height", bh).attr("rx", 12)
      .style("fill", active ? "var(--signal-wash)" : "var(--bg)")
      .style("stroke", active ? "var(--signal)" : "var(--border)")
      .style("stroke-width", active ? 2.5 : 1.5);
    g.append("text").attr("x", bx + 20).attr("y", y + bh / 2 + 9).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "27px").style("font-weight", active ? 700 : 400).text(label);
    if (active) {
      g.append("text").attr("x", bx + bw - 16).attr("y", y + 30).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "25px").style("font-weight", 700).text("✓ " + o.harderTag);
    }
  });
}

/* --- Node 2: prompt → reasoning steps → answer (grows per step) ---------- */

function drawReasoningChain(
  el: SVGSVGElement,
  o: { step: number; titles: string[]; snippets: string[]; answerOnly: string; traceTag: string; reduce: boolean },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 380;

  const revealed = Math.min(o.step, 3); // reasoning lines shown: 0..3
  const solid = o.step >= 4; // final: whole trace becomes one example

  // Node list: prompt, revealed reasoning steps, answer.
  interface N { title: string; snippet: string; kind: "prompt" | "step" | "answer" }
  const nodes: N[] = [{ title: o.titles[0], snippet: o.snippets[0], kind: "prompt" }];
  for (let i = 1; i <= revealed; i++) nodes.push({ title: o.titles[i], snippet: o.snippets[i], kind: "step" });
  nodes.push({ title: o.titles[4], snippet: o.snippets[4], kind: "answer" });

  const boxW = 430;
  const boxH = 52;
  const gapY = 34;
  const cx = VB_W / 2 + 40; // shift right to leave room for left titles
  const bx = cx - boxW / 2;
  const top = 16;
  const rowY = (i: number) => top + i * (boxH + gapY);
  const H = rowY(nodes.length - 1) + boxH + (solid ? 52 : 16);
  svg.attr("viewBox", `0 0 ${VB_W} ${H}`);

  // Connectors between consecutive nodes.
  for (let i = 0; i < nodes.length - 1; i++) {
    const y1 = rowY(i) + boxH;
    const y2 = rowY(i + 1);
    const gapNode = nodes[i].kind === "prompt" && nodes[i + 1].kind === "answer"; // step 0 dashed gap
    const line = svg.append("line").attr("x1", cx).attr("y1", y1).attr("x2", cx).attr("y2", y2 - 6)
      .style("stroke", solid ? "var(--signal)" : "var(--muted)").style("stroke-width", 2.5);
    if (gapNode) line.style("stroke-dasharray", "4 6").style("stroke", "var(--border)");
    // arrowhead
    svg.append("path").attr("d", `M ${cx - 6} ${y2 - 12} L ${cx} ${y2 - 4} L ${cx + 6} ${y2 - 12}`)
      .style("fill", "none").style("stroke", gapNode ? "var(--border)" : solid ? "var(--signal)" : "var(--muted)").style("stroke-width", 2.5);
    if (gapNode) {
      svg.append("text").attr("x", cx + 16).attr("y", (y1 + y2) / 2 + 8).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(o.answerOnly + " ?");
    }
  }

  // Node boxes + left titles.
  nodes.forEach((n, i) => {
    const y = rowY(i);
    const isAnswer = n.kind === "answer";
    const green = isAnswer || (solid && n.kind === "step");
    const g = svg.append("g");
    if (dur && n.kind === "step" && i === nodes.length - 2) g.style("opacity", 0).transition().duration(dur).style("opacity", 1);
    // left title
    svg.append("text").attr("x", bx - 20).attr("y", y + boxH / 2 + 8).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(n.title);
    // box
    g.append("rect").attr("x", bx).attr("y", y).attr("width", boxW).attr("height", boxH).attr("rx", 11)
      .style("fill", green ? "var(--signal-wash)" : "var(--surface)")
      .style("stroke", green ? "var(--signal)" : "var(--border)")
      .style("stroke-width", green ? 2.5 : 1.5);
    g.append("text").attr("x", bx + 20).attr("y", y + boxH / 2 + 10).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "28px").style("font-weight", n.kind === "prompt" ? 700 : 500).text(n.snippet);
    // trace tag centred under the answer once the trace solidifies
    if (isAnswer && solid) {
      svg.append("text").attr("x", cx).attr("y", y + boxH + 34).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "26px").style("font-weight", 700).text("↑ " + o.traceTag);
    }
  });
}

/* --- Node 3: rejection-sampling funnel ---------------------------------- */

function drawFunnel(
  el: SVGSVGElement,
  o: {
    active: Record<VerifierKey, boolean>;
    gateNames: string[];
    genLabel: string;
    keptLabel: string;
    dropWord: string;
    toSet: string;
    skipped: string;
    reasons: string[];
    reduce: boolean;
  },
) {
  const H = 470;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VB_W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  const stats = funnelStats(o.active);
  const total = stats.generated;
  const cx = 300;
  const maxW = 470;
  const barH = 48;
  const wOf = (n: number) => Math.max(52, (n / total) * maxW);

  // Row counts: generated, then after each gate (kept = last).
  const counts = [total, ...stats.stages.map((s) => s.after)];
  const rowY = [40, 150, 260, 370];

  // Trapezoid connectors (the funnel narrowing).
  for (let i = 0; i < counts.length - 1; i++) {
    const w0 = wOf(counts[i]);
    const w1 = wOf(counts[i + 1]);
    const yb = rowY[i] + barH;
    const yt = rowY[i + 1];
    svg.append("path")
      .attr("d", `M ${cx - w0 / 2} ${yb} L ${cx + w0 / 2} ${yb} L ${cx + w1 / 2} ${yt} L ${cx - w1 / 2} ${yt} Z`)
      .style("fill", "var(--signal-wash)").style("stroke", "none");
  }

  // Bars.
  counts.forEach((n, i) => {
    const w = wOf(n);
    const isKept = i === counts.length - 1;
    const bar = svg.append("rect").attr("y", rowY[i]).attr("height", barH).attr("rx", 10)
      .style("fill", isKept ? "var(--signal)" : "var(--surface)")
      .style("stroke", isKept ? "var(--signal)" : "var(--border)").style("stroke-width", 1.5);
    if (dur) bar.attr("x", cx).attr("width", 0).transition().duration(dur).attr("x", cx - w / 2).attr("width", w);
    else bar.attr("x", cx - w / 2).attr("width", w);
    svg.append("text").attr("x", cx).attr("y", rowY[i] + barH / 2 + 11).attr("text-anchor", "middle")
      .style("fill", isKept ? "#0a0a09" : "var(--fg)").style("font-family", MONO).style("font-size", "31px").style("font-weight", 700).text(String(n));
  });

  // Top / bottom labels.
  svg.append("text").attr("x", cx).attr("y", rowY[0] - 12).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").style("letter-spacing", ".06em").text(`${o.genLabel} · ${total}`);
  svg.append("text").attr("x", cx).attr("y", rowY[3] + barH + 34).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "26px").style("font-weight", 700).text(`${o.keptLabel} ${stats.kept} ${o.toSet}`);

  // Gate labels + drop counts, one per transition.
  stats.stages.forEach((s, i) => {
    const midY = (rowY[i] + barH + rowY[i + 1]) / 2 + 8;
    const name = o.gateNames[i];
    svg.append("text").attr("x", 24).attr("y", midY).style("fill", s.active ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "26px").style("font-weight", s.active ? 700 : 400).text(name);
    if (!s.active) {
      svg.append("text").attr("x", 24).attr("y", midY + 28).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "24px").text(o.skipped);
    } else if (s.dropped > 0) {
      const rx = VB_W - 24;
      svg.append("text").attr("x", rx).attr("y", midY).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "28px").style("font-weight", 700).text(`−${s.dropped}`);
      svg.append("text").attr("x", rx).attr("y", midY + 28).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "24px").text(`${o.reasons[i]} ${o.dropWord}`);
    }
  });
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

function useSD() {
  const { t } = useAcademy();
  return t.syntheticData;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const sd = useSD();
  const n = sd.nodes[0];
  const [opIdx, setOpIdx] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => { setOpIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="sd-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={OP_KEYS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setOpIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[opIdx]}
      controls={
        <ControlRow>
          {sd.n1ops.map((lab, i) => (
            <Toggle key={i} on={opIdx === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawEvolveTree(el, { opIdx, ops: sd.n1ops, seedLabel: sd.n1seedLabel, seed: sd.n1seed, harderTag: sd.n1harderTag, reduce })} deps={[opIdx, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const sd = useSD();
  const n = sd.nodes[1];
  return (
    <SceneShell
      id="sd-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={5} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      controls={null}
      readout={null}
    >
      {(step) => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawReasoningChain(el, { step, titles: sd.n2nodeTitles, snippets: sd.n2snippets, answerOnly: sd.n2answerOnly, traceTag: sd.n2traceTag, reduce })} deps={[step, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const sd = useSD();
  const n = sd.nodes[2];
  const [active, setActive] = useState<Record<VerifierKey, boolean>>({ format: true, tests: true, judge: true });
  const [lastIdx, setLastIdx] = useState(-1);
  const toggle = (i: number) => {
    const key = VERIFIER_ORDER[i];
    setActive((p) => ({ ...p, [key]: !p[key] }));
    setLastIdx(i);
  };
  const note = lastIdx >= 0 ? n.optionNotes?.[lastIdx] : n.sliderNote;
  return (
    <SceneShell
      id="sd-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <ControlRow>
          {sd.n3verifiers.map((lab, i) => (
            <Toggle key={i} on={active[VERIFIER_ORDER[i]]} onClick={() => toggle(i)}>{lab}: {active[VERIFIER_ORDER[i]] ? "ON" : "OFF"}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawFunnel(el, { active, gateNames: sd.n3gateNames, genLabel: sd.n3genLabel, keptLabel: sd.n3keptLabel, dropWord: sd.n3dropWord, toSet: sd.n3toSet, skipped: sd.n3skipped, reasons: sd.n3reasons, reduce })} deps={[active, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function SyntheticData() {
  const { t, lang } = useAcademy();
  const sd = t.syntheticData;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{sd.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {sd.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{sd.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{sd.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {sd.pipeline.map((label, i) => (
              <a key={i} href={`#sd-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{sd.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{sd.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(sd.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{sd.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(sd.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/supervised-fine-tuning" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {sd.prevLesson}</Link>
        <Link href="/stage/0/reward-modeling" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{sd.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
