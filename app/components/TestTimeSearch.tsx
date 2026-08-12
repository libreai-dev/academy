"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Slider, Deeper } from "./webscale-kit";
import {
  bestOfN,
  MAX_N,
  SEARCH_TREE,
  searchAt,
  BUDGET_MAX,
  revealedCount,
  COMPUTE_LEVELS,
  BON_QUALITY,
  TREE_QUALITY,
} from "../lib/test-time-search";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * Font sizes are large in viewBox units so labels clear ~12px when the card
 * shrinks to phone width.
 * ======================================================================== */

/* --- Node 1: Best-of-N candidate score bars ----------------------------- */

function drawFan(
  el: SVGSVGElement,
  o: { n: number; reduce: boolean; title: string; keptLabel: string },
) {
  const W = 440;
  const top = 46;
  const rowH = 40;
  const res = bestOfN(o.n);
  const H = top + res.scores.length * rowH + 14;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  svg.append("text").attr("x", 12).attr("y", 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "18px").style("letter-spacing", ".02em").text(o.title);

  const x0 = 58;
  const x1 = 318;
  const trackW = x1 - x0;

  res.scores.forEach((s, i) => {
    const y = top + i * rowH;
    const best = i === res.bestIdx;
    // candidate index
    svg.append("text").attr("x", 12).attr("y", y + 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "18px").text(`#${i + 1}`);
    // track
    svg.append("rect").attr("x", x0).attr("y", y + 6).attr("width", trackW).attr("height", 26).attr("rx", 7).style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
    // bar
    const w = (s / 100) * trackW;
    const bar = svg.append("rect").attr("x", x0).attr("y", y + 6).attr("height", 26).attr("rx", 7)
      .style("fill", best ? "var(--signal)" : "var(--tok-num)")
      .style("fill-opacity", best ? 1 : 0.8)
      .style("stroke", best ? "var(--fg)" : "none").style("stroke-width", best ? 1.5 : 0);
    if (dur) bar.attr("width", 0).transition().duration(dur).attr("width", w);
    else bar.attr("width", w);
    // score (+ kept tag on the winner)
    svg.append("text").attr("x", x1 + 10).attr("y", y + 25).style("fill", best ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", best ? 700 : 400)
      .text(best ? `${s} · ${o.keptLabel}` : `${s}`);
  });
}

/* --- Node 2: reasoning tree, revealed best-first ------------------------ */

function drawTree(
  el: SVGSVGElement,
  o: { budget: number; reduce: boolean; title: string; legendValue: string; legendBest: string },
) {
  const W = 520;
  const H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const state = searchAt(o.budget);
  const leftPad = 50;
  const colStep = (W - 100) / 5; // 6 leaf columns 0..5
  const colX = (col: number) => leftPad + col * colStep;
  const yOf = (depth: number) => (depth === 0 ? 46 : depth === 1 ? 152 : 268);

  const pos: Record<string, { x: number; y: number }> = {};
  SEARCH_TREE.forEach((n) => (pos[n.id] = { x: colX(n.col), y: yOf(n.depth) }));

  svg.append("text").attr("x", 12).attr("y", 22).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.title);

  // edges (parent → child), drawn first so nodes sit on top
  SEARCH_TREE.forEach((n) => {
    if (!n.parent) return;
    const p = pos[n.parent];
    const c = pos[n.id];
    const onBest = state.bestPath.has(n.id) && state.bestPath.has(n.parent);
    const revealed = state.revealed.has(n.id);
    const line = svg.append("line").attr("x1", p.x).attr("y1", p.y + 22).attr("x2", c.x).attr("y2", c.y - 22)
      .style("stroke", onBest ? "var(--signal)" : "var(--fg)")
      .style("stroke-width", onBest ? 3 : 1.5)
      .style("stroke-opacity", revealed ? (onBest ? 1 : 0.5) : 0.16);
    if (!revealed) line.style("stroke-dasharray", "3 5");
  });

  // nodes
  SEARCH_TREE.forEach((n) => {
    const c = pos[n.id];
    const revealed = state.revealed.has(n.id);
    const onBest = state.bestPath.has(n.id);
    const isRoot = n.kind === "root";
    const bw = isRoot ? 104 : n.kind === "step" ? 78 : 66;
    const bh = 44;
    const rect = svg.append("rect").attr("x", c.x - bw / 2).attr("y", c.y - bh / 2).attr("width", bw).attr("height", bh).attr("rx", 10)
      .style("fill", onBest && !isRoot ? "var(--signal-wash)" : "var(--bg)")
      .style("stroke", onBest ? "var(--signal)" : revealed ? "var(--fg)" : "var(--border)")
      .style("stroke-width", onBest ? 2.4 : 1.4)
      .style("stroke-opacity", revealed || isRoot ? 1 : 0.4);
    if (!revealed && !isRoot) rect.style("stroke-dasharray", "3 5");

    const label = isRoot ? "prompt" : revealed ? String(n.value) : "?";
    svg.append("text").attr("x", c.x).attr("y", c.y + (isRoot ? 8 : 9)).attr("text-anchor", "middle")
      .style("fill", onBest ? "var(--signal-fg)" : revealed || isRoot ? "var(--fg)" : "var(--muted)")
      .style("font-family", MONO).style("font-size", isRoot ? "22px" : "26px").style("font-weight", onBest ? 700 : isRoot ? 400 : 600)
      .style("fill-opacity", revealed || isRoot ? 1 : 0.5)
      .text(label);
  });

  // legend
  const ly = H - 18;
  const chip = (x: number, stroke: string, fill: string, text: string) => {
    svg.append("rect").attr("x", x).attr("y", ly - 15).attr("width", 18).attr("height", 18).attr("rx", 4).style("fill", fill).style("stroke", stroke).style("stroke-width", 2);
    svg.append("text").attr("x", x + 26).attr("y", ly).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(text);
  };
  chip(12, "var(--fg)", "var(--bg)", o.legendValue);
  chip(280, "var(--signal)", "var(--signal-wash)", o.legendBest);
}

/* --- Node 3: same-budget quality, Best-of-N vs tree search --------------- */

function drawTradeoff(
  el: SVGSVGElement,
  o: { level: number; reduce: boolean; bonLabel: string; treeLabel: string; budgetWord: string },
) {
  const W = 440;
  const H = 320;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 480;

  const calls = COMPUTE_LEVELS[o.level];
  const bon = BON_QUALITY[o.level];
  const tree = TREE_QUALITY[o.level];

  svg.append("text").attr("x", W / 2).attr("y", 30).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(`${calls} ${o.budgetWord}`);

  const trackTop = 66;
  const trackBot = 256;
  const trackH = trackBot - trackTop;
  const barW = 62;

  const col = (cx: number, score: number, label: string, colour: string) => {
    // track
    svg.append("rect").attr("x", cx - barW / 2).attr("y", trackTop).attr("width", barW).attr("height", trackH).attr("rx", 8).style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
    // fill
    const h = (score / 100) * trackH;
    const bar = svg.append("rect").attr("x", cx - barW / 2).attr("width", barW).attr("rx", 8).style("fill", colour);
    if (dur) bar.attr("y", trackBot).attr("height", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("y", trackBot - h).attr("height", h);
    else bar.attr("y", trackBot - h).attr("height", h);
    // score
    svg.append("text").attr("x", cx).attr("y", trackTop - 12).attr("text-anchor", "middle").style("fill", colour).style("font-family", DISPLAY).style("font-size", "30px").style("font-weight", 700).text(String(score));
    // method label
    svg.append("text").attr("x", cx).attr("y", trackBot + 30).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "19px").text(label);
  };

  col(W * 0.32, bon, o.bonLabel, "var(--tok-num)");
  col(W * 0.68, tree, o.treeLabel, "var(--signal)");
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

function useTTS() {
  const { t } = useAcademy();
  return t.testTimeSearch;
}

function DeeperBlock({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ maxWidth: 760, margin: "18px auto 0" }}>
      <Deeper title={title}>{rich(body)}</Deeper>
    </div>
  );
}

/* ---- Node 1: Best-of-N -------------------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const l = useTTS();
  const n = l.nodes[0];
  const [nn, setNn] = useState(6);
  const res = bestOfN(nn);
  return (
    <div>
      <SceneShell
        id="tts-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
        cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
        labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
        controls={
          <Slider id="tts-n" label={l.n1slider} value={nn} display={`${nn} / ${MAX_N}`} min={1} max={MAX_N} onChange={setNn} />
        }
        readout={
          <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
            { k: n.rows[0], v: String(nn) },
            { k: n.rows[1], v: String(res.best), hi: true },
            { k: n.rows[2], v: res.mean.toFixed(1) },
          ]} />
        }
      >
        {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawFan(el, { n: nn, reduce, title: l.n1title, keptLabel: l.n1keptLabel })} deps={[nn, reduce]} />}
      </SceneShell>
      <DeeperBlock title={l.deeper1Title} body={l.deeper1Body} />
    </div>
  );
}

/* ---- Node 2: Tree search ----------------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const l = useTTS();
  const n = l.nodes[1];
  const [budget, setBudget] = useState(2);
  const state = searchAt(budget);
  const bestPathStr = state.bestScore > 0 ? String(state.bestScore) : "—";
  return (
    <div>
      <SceneShell
        id="tts-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
        cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
        labelPrev="Previous step" labelNext="Next step" note={l.n2steps[budget]}
        controls={
          <Slider id="tts-budget" label={l.n2slider} value={budget} display={`${budget} / ${BUDGET_MAX}`} min={0} max={BUDGET_MAX} onChange={setBudget} />
        }
        readout={
          <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
            { k: n.rows[0], v: String(budget) },
            { k: n.rows[1], v: `${revealedCount(budget)} / ${SEARCH_TREE.length}` },
            { k: n.rows[2], v: bestPathStr, hi: state.bestScore > 0 },
          ]} />
        }
      >
        {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTree(el, { budget, reduce, title: l.n2title, legendValue: l.n2legendValue, legendBest: l.n2legendBest })} deps={[budget, reduce]} />}
      </SceneShell>
      <DeeperBlock title={l.deeper2Title} body={l.deeper2Body} />
    </div>
  );
}

/* ---- Node 3: the trade-off --------------------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const l = useTTS();
  const n = l.nodes[2];
  const [level, setLevel] = useState(2);
  const calls = COMPUTE_LEVELS[level];
  return (
    <SceneShell
      id="tts-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={l.n3note}
      controls={
        <Slider id="tts-budget3" label={l.n3slider} value={level} display={`${calls} ${l.n3budgetWord}`} min={0} max={COMPUTE_LEVELS.length - 1} onChange={setLevel} />
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTradeoff(el, { level, reduce, bonLabel: l.n3bonLabel, treeLabel: l.n3treeLabel, budgetWord: l.n3budgetWord })} deps={[level, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function TestTimeSearch() {
  const { t, lang } = useAcademy();
  const l = t.testTimeSearch;
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

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{l.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {l.pipeline.map((label, i) => (
              <a key={i} href={`#tts-node-${i + 1}`} className="u-hover-fg-border"
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
        <Link href="/stage/0/tool-calling" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {l.prevLesson}</Link>
        <Link href="/stage/0/mixed-precision" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{l.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
