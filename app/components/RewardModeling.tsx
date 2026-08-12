"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  RM_MAX_STEP,
  RM_SCALE_MIN,
  RM_SCALE_MAX,
  rewardAt,
  rankByReward,
  fmt1,
  type RewardState,
} from "../lib/reward-modeling";
import type { RmCandidate } from "../lib/copy/reward-modeling";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * viewBox widths are kept ~520 so label text renders ≥12px even at ~320px.
 * Colour only via .style() so design tokens + theme flips resolve live.
 * ======================================================================== */

/** Greedy word-wrap to a max character count per line. */
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur.length === 0) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* --- Node 1: two answer cards, the preferred one highlighted ------------- */

function drawPair(
  el: SVGSVGElement,
  o: {
    prompt: string;
    aText: string;
    bText: string;
    winner: "a" | "b";
    promptTag: string;
    tagA: string;
    tagB: string;
    preferred: string;
    rejected: string;
  },
) {
  const W = 520;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();

  const promptLines = wrap(o.prompt, 40);
  const cardChars = 19;
  const aLines = wrap(o.aText, cardChars);
  const bLines = wrap(o.bText, cardChars);
  const bodyLines = Math.max(aLines.length, bLines.length);

  const lineH = 25;
  const promptTop = 26;
  const promptBlockH = promptLines.length * 27;
  const cardTop = promptTop + promptBlockH + 16;
  const tagH = 40;
  const cardBodyH = bodyLines * lineH + 14;
  const cardH = tagH + cardBodyH;
  const H = cardTop + cardH + 14;
  svg.attr("viewBox", `0 0 ${W} ${H}`);

  // --- prompt ---
  svg.append("text").attr("x", 4).attr("y", promptTop - 8)
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("letter-spacing", ".08em")
    .text(o.promptTag);
  promptLines.forEach((ln, i) => {
    svg.append("text").attr("x", 4).attr("y", promptTop + 18 + i * 27)
      .style("fill", "var(--fg)").style("font-family", DISPLAY).style("font-size", "21px").style("font-weight", 600)
      .text(ln);
  });

  const cardW = 244;
  const gap = W - cardW * 2;
  const cards: { x: number; tag: string; lines: string[]; win: boolean }[] = [
    { x: 0, tag: o.tagA, lines: aLines, win: o.winner === "a" },
    { x: cardW + gap, tag: o.tagB, lines: bLines, win: o.winner === "b" },
  ];

  cards.forEach((c) => {
    const stroke = c.win ? "var(--signal)" : "var(--border)";
    svg.append("rect").attr("x", c.x).attr("y", cardTop).attr("width", cardW).attr("height", cardH).attr("rx", 14)
      .style("fill", c.win ? "var(--signal-wash)" : "var(--bg)")
      .style("stroke", stroke).style("stroke-width", c.win ? 2.4 : 1.2);

    // tag row: A / B on the left, verdict badge on the right
    svg.append("text").attr("x", c.x + 16).attr("y", cardTop + 27)
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").style("font-weight", 700)
      .text(c.tag);
    const verdict = c.win ? o.preferred : o.rejected;
    const vColor = c.win ? "var(--signal-fg)" : "var(--muted)";
    svg.append("text").attr("x", c.x + cardW - 14).attr("y", cardTop + 27).attr("text-anchor", "end")
      .style("fill", vColor).style("font-family", MONO).style("font-size", "13px").style("letter-spacing", ".06em").style("font-weight", 700)
      .text(c.win ? `✓ ${verdict}` : verdict);

    // divider under the tag row
    svg.append("line").attr("x1", c.x + 12).attr("x2", c.x + cardW - 12).attr("y1", cardTop + tagH - 4).attr("y2", cardTop + tagH - 4)
      .style("stroke", "var(--hair)").style("stroke-width", 1);

    c.lines.forEach((ln, i) => {
      svg.append("text").attr("x", c.x + 16).attr("y", cardTop + tagH + 18 + i * lineH)
        .style("fill", c.win ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "16px")
        .text(ln);
    });
  });
}

/* --- Node 2: a reward axis, preferred vs rejected pulling apart ---------- */

function drawScore(
  el: SVGSVGElement,
  o: {
    st: RewardState;
    reduce: boolean;
    axisLabel: string;
    worse: string;
    better: string;
    chosenTag: string;
    rejectedTag: string;
    marginTag: string;
  },
) {
  const W = 520;
  const H = 266;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  const x0 = 46;
  const x1 = W - 46;
  const axisY = 154;
  const x = d3.scaleLinear().domain([RM_SCALE_MIN, RM_SCALE_MAX]).range([x0, x1]);

  svg.append("text").attr("x", x0).attr("y", 26)
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("letter-spacing", ".08em")
    .text(o.axisLabel);

  // axis line + end labels
  svg.append("line").attr("x1", x0).attr("x2", x1).attr("y1", axisY).attr("y2", axisY)
    .style("stroke", "var(--border)").style("stroke-width", 2);
  svg.append("text").attr("x", x0).attr("y", axisY + 30)
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "14px").text(o.worse);
  svg.append("text").attr("x", x1).attr("y", axisY + 30).attr("text-anchor", "end")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "14px").text(o.better);

  const cx = x(o.st.chosen);
  const rx = x(o.st.rejected);

  // margin bracket along the axis
  const bracket = svg.append("g");
  bracket.append("line").attr("x1", rx).attr("x2", cx).attr("y1", axisY).attr("y2", axisY)
    .style("stroke", "var(--signal)").style("stroke-width", 4).style("opacity", 0.5);
  bracket.append("text").attr("x", (rx + cx) / 2).attr("y", axisY + 52).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "14px").style("font-weight", 700)
    .text(`${o.marginTag} ${fmt1(o.st.margin)}`);

  // marker: dot on the axis + a chip above (preferred) / below? both above, staggered
  const marker = (px: number, value: number, tag: string, green: boolean, above: boolean) => {
    const g = svg.append("g");
    const color = green ? "var(--signal)" : "var(--tok-space)";
    const chipY = above ? axisY - 74 : axisY + 62;
    // stem
    g.append("line").attr("x1", px).attr("x2", px).attr("y1", axisY).attr("y2", chipY + (above ? 40 : 0))
      .style("stroke", color).style("stroke-width", 1.5).style("stroke-dasharray", "3 3");
    // dot
    g.append("circle").attr("cx", px).attr("cy", axisY).attr("r", 7)
      .style("fill", color).style("stroke", "var(--bg)").style("stroke-width", 2);
    // chip
    const chipW = 150;
    g.append("rect").attr("x", px - chipW / 2).attr("y", chipY).attr("width", chipW).attr("height", 40).attr("rx", 9)
      .style("fill", green ? "var(--signal-wash)" : "var(--surface)")
      .style("stroke", color).style("stroke-width", green ? 2 : 1.2);
    g.append("text").attr("x", px).attr("y", chipY + 17).attr("text-anchor", "middle")
      .style("fill", green ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("font-weight", 700)
      .text(tag);
    g.append("text").attr("x", px).attr("y", chipY + 33).attr("text-anchor", "middle")
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", 700)
      .text(fmt1(value));
    if (dur) g.style("opacity", 0).transition().duration(dur).style("opacity", 1);
  };
  marker(cx, o.st.chosen, o.chosenTag, true, true);
  marker(rx, o.st.rejected, o.rejectedTag, false, false);
}

/* --- Node 3: candidate answers as reward bars, sortable ------------------ */

function drawRank(
  el: SVGSVGElement,
  o: {
    candidates: RmCandidate[];
    order: number[];
    ranked: boolean;
    reduce: boolean;
    scoreTag: string;
    bestTag: string;
  },
) {
  const W = 520;
  const rowH = 50;
  const top = 16;
  const H = top + o.candidates.length * rowH + 8;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 480;

  const labelX = 8;
  const barX0 = 196;
  const barX1 = W - 60;
  const maxReward = Math.max(...o.candidates.map((c) => c.reward), 10);
  const x = d3.scaleLinear().domain([0, maxReward]).range([0, barX1 - barX0]);
  const bestIdx = o.order[0];

  o.order.forEach((ci, pos) => {
    const c = o.candidates[ci];
    const y = top + pos * rowH;
    const isBest = o.ranked && ci === bestIdx;
    const color = isBest ? "var(--signal)" : "var(--tok-space)";
    const g = svg.append("g");
    if (dur) g.style("opacity", 0).transition().duration(dur).delay(pos * 40).style("opacity", 1);

    // rank number (only when ranked)
    if (o.ranked) {
      g.append("text").attr("x", labelX).attr("y", y + rowH / 2 + 6)
        .style("fill", isBest ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "18px").style("font-weight", 700)
        .text(`${pos + 1}`);
    }
    // label
    g.append("text").attr("x", labelX + (o.ranked ? 24 : 4)).attr("y", y + rowH / 2 + 6)
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", isBest ? 700 : 400)
      .text(c.label);

    // track
    g.append("rect").attr("x", barX0).attr("y", y + 11).attr("width", barX1 - barX0).attr("height", rowH - 22).attr("rx", 7)
      .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
    // bar
    const w = Math.max(4, x(c.reward));
    const bar = g.append("rect").attr("x", barX0).attr("y", y + 11).attr("height", rowH - 22).attr("rx", 7)
      .style("fill", color).style("opacity", isBest ? 1 : 0.6);
    if (dur) bar.attr("width", 0).transition().duration(dur).delay(pos * 40).attr("width", w);
    else bar.attr("width", w);
    // score value
    g.append("text").attr("x", barX1 + 8).attr("y", y + rowH / 2 + 6)
      .style("fill", isBest ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "16px").style("font-weight", 700)
      .text(fmt1(c.reward));

    // best badge
    if (isBest) {
      g.append("text").attr("x", barX0 + 10).attr("y", y + rowH / 2 + 6)
        .style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "13px").style("font-weight", 700).style("letter-spacing", ".06em")
        .text(o.bestTag);
    }
  });
}

/* ======================================================================== *
 * Node mount + components
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

function useRM() {
  const { t } = useAcademy();
  return t.rewardModeling;
}

function Node1({ reduce }: { reduce: boolean }) {
  const rm = useRM();
  const n = rm.nodes[0];
  const [pairIdx, setPairIdx] = useState(0);
  const [winner, setWinner] = useState<"a" | "b">("a");
  const pair = rm.n1pairs[pairIdx];
  return (
    <SceneShell
      id="rm-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[winner === "a" ? 0 : 1]}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{rm.n1pairSelLabel}</div>
          <ControlRow>
            {rm.n1pairs.map((p, i) => (
              <Toggle key={i} on={pairIdx === i} onClick={() => { setPairIdx(i); setWinner("a"); }}>{p.tag}</Toggle>
            ))}
          </ControlRow>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{rm.n1winnerLabel}</div>
          <ControlRow>
            <Toggle on={winner === "a"} onClick={() => setWinner("a")}>{rm.n1pickA}</Toggle>
            <Toggle on={winner === "b"} onClick={() => setWinner("b")}>{rm.n1pickB}</Toggle>
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawPair(el, { prompt: pair.prompt, aText: pair.a, bText: pair.b, winner, promptTag: rm.n1promptTag, tagA: rm.n1tagA, tagB: rm.n1tagB, preferred: rm.n1preferred, rejected: rm.n1rejected })}
          deps={[pairIdx, winner]}
        />
      )}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const rm = useRM();
  const n = rm.nodes[1];
  const [step, setStep] = useState(0);
  const st = rewardAt(step);
  const note = step === 0 ? rm.n2startNote : step >= RM_MAX_STEP - 3 ? rm.n2trainedNote : undefined;
  return (
    <SceneShell
      id="rm-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <Slider id="rm-steps" label={rm.n2slider} value={step} display={`${step} / ${RM_MAX_STEP}`} min={0} max={RM_MAX_STEP} onChange={setStep} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: fmt1(st.chosen), hi: true },
          { k: n.rows[1], v: fmt1(st.rejected) },
          { k: n.rows[2], v: fmt1(st.margin) },
          { k: n.rows[3], v: `${Math.round(st.match * 100)}%`, hi: true },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawScore(el, { st, reduce, axisLabel: rm.n2axisLabel, worse: rm.n2worse, better: rm.n2better, chosenTag: rm.n2chosenTag, rejectedTag: rm.n2rejectedTag, marginTag: rm.n2marginTag })}
          deps={[step, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const rm = useRM();
  const n = rm.nodes[2];
  const [ranked, setRanked] = useState(false);
  const submitted = rm.n3candidates.map((_, i) => i);
  const order = ranked ? rankByReward(rm.n3candidates) : submitted;
  return (
    <SceneShell
      id="rm-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={ranked ? n.optionNotes?.[1] : n.optionNotes?.[0]}
      aside={
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", background: "var(--surface)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: "var(--muted)" }}>{rm.n3promptTag}</div>
          <div style={{ marginTop: 6, fontSize: 15.5, fontFamily: DISPLAY, fontWeight: 600, color: "var(--fg)" }}>{rm.n3prompt}</div>
        </div>
      }
      controls={
        <ControlRow>
          <Toggle on={!ranked} onClick={() => setRanked(false)}>{rm.n3asWritten}</Toggle>
          <Toggle on={ranked} onClick={() => setRanked(true)}>{rm.n3ranked}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawRank(el, { candidates: rm.n3candidates, order, ranked, reduce, scoreTag: rm.n3scoreTag, bestTag: rm.n3bestTag })}
          deps={[ranked, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function RewardModeling() {
  const { t, lang } = useAcademy();
  const rm = t.rewardModeling;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{rm.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {rm.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{rm.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{rm.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {rm.pipeline.map((label, i) => (
              <a key={i} href={`#rm-node-${i + 1}`} className="u-hover-fg-border"
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
        <Deeper title={rm.deeperTitle}>{rich(rm.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{rm.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{rm.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(rm.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{rm.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(rm.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/synthetic-data" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {rm.prevLesson}</Link>
        <Link href="/stage/0/preference-optimization" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{rm.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
