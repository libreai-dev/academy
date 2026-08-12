"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Deeper } from "./webscale-kit";
import { layoutTape, cellCX, CHIP_H, type TapeCell } from "../lib/autoregressive-loop";
import type { LoopToken } from "../lib/copy/autoregressive-loop";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

/** A small arrowhead triangle pointing along (x1,y1)->(x2,y2). */
function arrow(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dash = false,
) {
  const line = svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
    .style("stroke", color).style("stroke-width", 2);
  if (dash) line.style("stroke-dasharray", "5 5");
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 8;
  svg.append("path")
    .attr("d", `M ${x2} ${y2} L ${x2 - s * Math.cos(a - 0.4)} ${y2 - s * Math.sin(a - 0.4)} L ${x2 - s * Math.cos(a + 0.4)} ${y2 - s * Math.sin(a + 0.4)} Z`)
    .style("fill", color);
}

/** Draw one row of token chips. `current` gets the green highlight. */
function drawChips(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  cells: TapeCell[],
  tokens: LoopToken[],
  o: { current: number; reduce: boolean; faded?: boolean; showId?: boolean },
) {
  cells.forEach((c) => {
    const tok = tokens[c.i];
    const isCur = c.i === o.current;
    const isEos = !!tok?.eos;
    const stroke = isEos ? "var(--tok-byte)" : isCur ? "var(--signal)" : "var(--border)";
    const fill = isCur ? "var(--signal-wash)" : "var(--bg)";
    const g = svg.append("g").attr("transform", `translate(${c.x},${c.y})`);
    const rect = g.append("rect").attr("width", c.w).attr("height", CHIP_H).attr("rx", 8)
      .style("fill", fill).style("stroke", stroke).style("stroke-width", isCur || isEos ? 2 : 1)
      .style("opacity", o.faded ? 0.42 : 1);
    if (isCur && !o.reduce) {
      rect.attr("opacity", 0).transition().duration(260).attr("opacity", 1);
    }
    g.append("text").attr("x", c.w / 2).attr("y", o.showId ? 18 : CHIP_H / 2 + 5).attr("text-anchor", "middle")
      .style("fill", isEos ? "var(--tok-byte)" : "var(--fg)").style("font-family", MONO)
      .style("font-size", "14px").style("font-weight", isCur || isEos ? 700 : 500)
      .style("opacity", o.faded ? 0.6 : 1)
      .text(c.piece);
    if (o.showId && tok && !isEos) {
      g.append("text").attr("x", c.w / 2).attr("y", 33).attr("text-anchor", "middle")
        .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px")
        .text(String(tok.id));
    }
  });
}

/* --- Node 1: the generation cycle + growing tape ------------------------ */

function drawLoop(
  el: SVGSVGElement,
  o: {
    tokens: LoopToken[];
    gen: number; // tokens produced so far (0..len)
    reduce: boolean;
    L: {
      context: string; empty: string; count: string; model: string; next: string;
      feedback: string; done: string; tape: string;
    };
  },
) {
  const W = 760;
  const H = 430;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const len = o.tokens.length;
  const cy = 96;
  const boxH = 88;

  // three boxes
  const cx0 = 26, cw0 = 210; //   CONTEXT
  const mx = 300, mw = 150; //    MODEL
  const nx = 512, nw = 222; //    NEXT
  const box = (x: number, w: number, stroke: string, fill = "var(--bg)") =>
    svg.append("rect").attr("x", x).attr("y", cy - boxH / 2).attr("width", w).attr("height", boxH).attr("rx", 12)
      .style("fill", fill).style("stroke", stroke).style("stroke-width", 1.5);

  const predicted = o.gen < len ? o.tokens[o.gen] : null;
  const nextIsEos = !!predicted?.eos;
  const done = o.gen >= len;
  const nextColor = done ? "var(--muted)" : nextIsEos ? "var(--tok-byte)" : "var(--signal)";

  // CONTEXT
  box(cx0, cw0, "var(--border)", "var(--surface)");
  svg.append("text").attr("x", cx0 + cw0 / 2).attr("y", cy - 16).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.L.context);
  svg.append("text").attr("x", cx0 + cw0 / 2).attr("y", cy + 12).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px")
    .text(o.gen === 0 ? o.L.empty : o.L.count.replace("{n}", String(o.gen)));

  // MODEL
  box(mx, mw, "var(--fg)");
  svg.append("text").attr("x", mx + mw / 2).attr("y", cy + 6).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", 700).style("letter-spacing", ".08em").text(o.L.model);

  // NEXT
  box(nx, nw, nextColor);
  svg.append("text").attr("x", nx + nw / 2).attr("y", cy - 16).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.L.next);
  svg.append("text").attr("x", nx + nw / 2).attr("y", cy + 14).attr("text-anchor", "middle")
    .style("fill", nextColor).style("font-family", MONO).style("font-size", done ? "13px" : "18px").style("font-weight", 700)
    .text(done ? o.L.done : (predicted?.piece ?? ""));

  // arrows between boxes
  arrow(svg, cx0 + cw0, cy, mx, cy, "var(--fg)");
  arrow(svg, mx + mw, cy, nx, cy, nextColor, done);

  // feedback loop: NEXT bottom -> curve down -> back to CONTEXT bottom
  const fy = cy + boxH / 2;
  const low = 200;
  const fbColor = done ? "var(--border)" : "var(--signal)";
  const ax = cx0 + cw0 / 2;
  svg.append("path")
    .attr("d", `M ${nx + nw / 2} ${fy} C ${nx + nw / 2} ${low + 24}, ${ax} ${low + 24}, ${ax} ${fy + 4}`)
    .style("fill", "none").style("stroke", fbColor).style("stroke-width", 2).style("stroke-dasharray", done ? "5 5" : "none");
  // arrowhead into CONTEXT bottom, pointing up along the curve tangent
  svg.append("path").attr("d", `M ${ax} ${fy + 2} L ${ax - 6} ${fy + 12} L ${ax + 6} ${fy + 12} Z`).style("fill", fbColor);
  svg.append("text").attr("x", (nx + nw / 2 + cx0 + cw0 / 2) / 2).attr("y", low + 20).attr("text-anchor", "middle")
    .style("fill", done ? "var(--muted)" : "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px").text(o.L.feedback);

  // tape label + growing chips
  svg.append("text").attr("x", cx0).attr("y", 262).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".1em").text(o.L.tape);
  const shown = o.tokens.slice(0, o.gen);
  const cells = layoutTape(shown.map((t) => t.piece), { maxW: W - 52, x0: cx0, y0: 278 });
  drawChips(svg, cells, o.tokens, { current: o.gen - 1, reduce: o.reduce });
}

/* --- Node 2: the stop condition ----------------------------------------- */

function drawStop(
  el: SVGSVGElement,
  o: {
    tokens: LoopToken[]; // includes trailing eos
    emit: boolean;
    ramble: string[];
    reduce: boolean;
    L: { stopCap: string; eos: string; wall: string };
  },
) {
  const W = 760;
  const H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const x0 = 26;
  const y0 = 60;

  const base = o.tokens.filter((t) => !t.eos); // words + period
  const eosTok = o.tokens.find((t) => t.eos);

  // committed sentence — always fully shown
  const cells = layoutTape(base.map((t) => t.piece), { maxW: W - 52, x0, y0 });
  drawChips(svg, cells, base, { current: -1, reduce: o.reduce });
  const last = cells[cells.length - 1];
  let cursorX = last.x + last.w + 10;
  const rowY = last.y;

  if (o.emit && eosTok) {
    // EOS chip (red) + STOP cap
    const ew = Math.max(56, eosTok.piece.length * 8.4 + 24);
    svg.append("rect").attr("x", cursorX).attr("y", rowY).attr("width", ew).attr("height", CHIP_H).attr("rx", 8)
      .style("fill", "var(--bg)").style("stroke", "var(--tok-byte)").style("stroke-width", 2);
    svg.append("text").attr("x", cursorX + ew / 2).attr("y", rowY + CHIP_H / 2 + 5).attr("text-anchor", "middle")
      .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "14px").style("font-weight", 700).text(eosTok.piece);
    svg.append("text").attr("x", cursorX + ew / 2).attr("y", rowY - 8).attr("text-anchor", "middle")
      .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "12px").text(o.L.eos);
    cursorX += ew + 14;
    // STOP cap
    const sw = Math.max(150, o.L.stopCap.length * 7.2 + 28);
    svg.append("rect").attr("x", cursorX).attr("y", rowY).attr("width", sw).attr("height", CHIP_H).attr("rx", 8)
      .style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 2);
    svg.append("text").attr("x", cursorX + sw / 2).attr("y", rowY + CHIP_H / 2 + 5).attr("text-anchor", "middle")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px").style("font-weight", 700).text("■ " + o.L.stopCap);
  } else {
    // no stop token -> ramble on to a MAX LENGTH wall
    const rcells = layoutTape(o.ramble, { maxW: W - 52 - (cursorX - x0), x0: cursorX, y0: rowY });
    o.ramble.forEach((p, i) => {
      const c = rcells[i];
      const g = svg.append("g").attr("transform", `translate(${c.x},${c.y})`);
      g.append("rect").attr("width", c.w).attr("height", CHIP_H).attr("rx", 8)
        .style("fill", "var(--bg)").style("stroke", "var(--border)").style("stroke-width", 1).style("opacity", 0.45);
      g.append("text").attr("x", c.w / 2).attr("y", CHIP_H / 2 + 5).attr("text-anchor", "middle")
        .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "14px").text(p);
    });
    const rlast = rcells[rcells.length - 1];
    const wallX = rlast.x + rlast.w + 12;
    const wallY = rlast.y;
    svg.append("rect").attr("x", wallX).attr("y", wallY - 12).attr("width", 8).attr("height", CHIP_H + 24).attr("rx", 3).style("fill", "var(--tok-byte)");
    svg.append("text").attr("x", wallX + 18).attr("y", wallY + CHIP_H / 2 + 5)
      .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "13px").style("font-weight", 700).text(o.L.wall);
  }
}

/* --- Node 3: parallel read vs serial write ------------------------------ */

function drawSequential(
  el: SVGSVGElement,
  o: {
    prompt: LoopToken[];
    answer: LoopToken[]; // excludes eos
    written: number; // 1..answer.length
    reduce: boolean;
    L: { promptLane: string; answerLane: string; parallelTag: string; serialTag: string };
  },
) {
  const W = 760;
  const H = 360;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const x0 = 26;

  // Lane A — prompt, all read in parallel (green)
  const pY = 62;
  svg.append("text").attr("x", x0).attr("y", pY - 16).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.L.promptLane);
  const pCells = layoutTape(o.prompt.map((t) => t.piece), { maxW: W - 52, x0, y0: pY });
  pCells.forEach((c) => {
    const g = svg.append("g").attr("transform", `translate(${c.x},${c.y})`);
    g.append("rect").attr("width", c.w).attr("height", CHIP_H).attr("rx", 8).style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 1.5);
    g.append("text").attr("x", c.w / 2).attr("y", CHIP_H / 2 + 5).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px").style("font-weight", 500).text(c.piece);
  });
  // parallel tag: one bracket under the whole prompt lane
  const pEnd = pCells[pCells.length - 1];
  const pRight = pEnd.x + pEnd.w;
  svg.append("path").attr("d", `M ${x0} ${pY + CHIP_H + 8} L ${x0} ${pY + CHIP_H + 14} L ${pRight} ${pY + CHIP_H + 14} L ${pRight} ${pY + CHIP_H + 8}`).style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 1.5);
  svg.append("text").attr("x", (x0 + pRight) / 2).attr("y", pY + CHIP_H + 30).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.L.parallelTag);

  // Lane B — answer, written serially
  const aY = 236;
  svg.append("text").attr("x", x0).attr("y", aY - 16).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").style("letter-spacing", ".08em").text(o.L.answerLane);
  const written = o.answer.slice(0, o.written);
  const aCells = layoutTape(written.map((t) => t.piece), { maxW: W - 52, x0, y0: aY });
  const curIdx = o.written - 1;

  // dependency fan-in: from every prior token (prompt + earlier answer) into the current
  if (curIdx >= 0 && aCells[curIdx]) {
    const cur = aCells[curIdx];
    const tx = cellCX(cur);
    const ty = cur.y;
    const sources: { x: number; y: number }[] = [
      ...pCells.map((c) => ({ x: cellCX(c), y: c.y + CHIP_H })),
      ...aCells.slice(0, curIdx).map((c) => ({ x: cellCX(c), y: c.y })),
    ];
    sources.forEach((s, i) => {
      const midY = (s.y + ty) / 2 - 18;
      const path = svg.append("path")
        .attr("d", `M ${s.x} ${s.y} Q ${(s.x + tx) / 2} ${midY} ${tx} ${ty}`)
        .style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 1).style("opacity", 0.32);
      if (!o.reduce) {
        const L = (path.node() as SVGPathElement).getTotalLength();
        path.attr("stroke-dasharray", L).attr("stroke-dashoffset", L).transition().duration(340).delay(i * 20).attr("stroke-dashoffset", 0);
      }
    });
  }

  drawChips(svg, aCells, o.answer, { current: curIdx, reduce: o.reduce });
  if (curIdx >= 0 && aCells[curIdx]) {
    const cur = aCells[curIdx];
    svg.append("text").attr("x", cellCX(cur)).attr("y", cur.y + CHIP_H + 20).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.L.serialTag);
  }
}

/* ======================================================================== *
 * Small shared bits
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

/** A plain action button (Step / Play / Reset) — distinct from the pill Toggle. */
function ActionBtn({ onClick, children, disabled, primary }: { onClick: () => void; children: React.ReactNode; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="u-hover-fg-border"
      style={{
        appearance: "none", cursor: disabled ? "default" : "pointer", font: "inherit", fontFamily: MONO, fontSize: 13,
        padding: "12px 16px", borderRadius: 10,
        border: `1px solid ${primary && !disabled ? "var(--signal)" : "var(--border)"}`,
        background: primary && !disabled ? "var(--signal-wash)" : "var(--bg)",
        color: "var(--fg)", opacity: disabled ? 0.4 : 1, fontWeight: primary ? 700 : 500,
        transition: "border-color .15s ease, background .15s ease",
      }}
    >
      {children}
    </button>
  );
}

function useAL() {
  const { t } = useAcademy();
  return t.autoregressiveLoop;
}

/* ======================================================================== *
 * Nodes
 * ======================================================================== */

function Node1({ reduce }: { reduce: boolean }) {
  const al = useAL();
  const n = al.nodes[0];
  const tokens = al.seqTokens;
  const len = tokens.length;
  const [gen, setGen] = useState(0);
  const [playing, setPlaying] = useState(false);
  const done = gen >= len;

  const step = () => setGen((g) => Math.min(len, g + 1));
  const reset = () => { setGen(0); setPlaying(false); };

  useEffect(() => {
    if (!playing) return;
    if (gen >= len) { setPlaying(false); return; }
    const id = window.setInterval(() => setGen((g) => Math.min(len, g + 1)), reduce ? 520 : 900);
    return () => window.clearInterval(id);
  }, [playing, gen, len, reduce]);

  const predicted = gen < len ? tokens[gen] : null;

  return (
    <SceneShell
      id="al-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      controls={
        <ControlRow>
          <ActionBtn onClick={() => setPlaying((p) => !p)} disabled={done} primary>{playing ? al.n1pause : al.n1play}</ActionBtn>
          <ActionBtn onClick={step} disabled={done || playing}>{al.n1step}</ActionBtn>
          <ActionBtn onClick={reset} disabled={gen === 0 && !playing}>{al.n1reset}</ActionBtn>
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${gen} / ${len}`, hi: true },
          { k: n.rows[1], v: predicted ? predicted.piece : (done ? "—" : "") },
          { k: n.rows[2], v: predicted && !predicted.eos ? String(predicted.id) : "—" },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLoop(el, {
        tokens, gen, reduce,
        L: { context: al.n1contextLabel, empty: al.n1contextEmpty, count: al.n1contextCount, model: al.n1modelLabel, next: al.n1nextLabel, feedback: al.n1feedback, done: al.n1doneNext, tape: al.n1tapeLabel },
      })} deps={[gen, reduce, al]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const al = useAL();
  const n = al.nodes[1];
  const [emit, setEmit] = useState(true); // lead with the clean stop
  return (
    <SceneShell
      id="al-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[emit ? 0 : 1]}
      controls={
        <ControlRow>
          <Toggle on={emit} onClick={() => setEmit(true)}>{al.n2emitOn}</Toggle>
          <Toggle on={!emit} onClick={() => setEmit(false)}>{al.n2emitOff}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawStop(el, {
        tokens: al.seqTokens, emit, ramble: al.n2ramble, reduce,
        L: { stopCap: al.n2stopCap, eos: al.n2eosLabel, wall: al.n2wall },
      })} deps={[emit, reduce, al]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const al = useAL();
  const n = al.nodes[2];
  const answer = al.seqTokens.filter((t) => !t.eos);
  const len = answer.length;
  const [written, setWritten] = useState(1);
  const [playing, setPlaying] = useState(false);
  const done = written >= len;

  const step = () => setWritten((w) => Math.min(len, w + 1));
  const reset = () => { setWritten(1); setPlaying(false); };

  useEffect(() => {
    if (!playing) return;
    if (written >= len) { setPlaying(false); return; }
    const id = window.setInterval(() => setWritten((w) => Math.min(len, w + 1)), reduce ? 520 : 850);
    return () => window.clearInterval(id);
  }, [playing, written, len, reduce]);

  const curIdx = written - 1;
  const dependsOn = al.promptTokens.length + curIdx; // prompt + earlier answer tokens

  return (
    <SceneShell
      id="al-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step"
      controls={
        <ControlRow>
          <ActionBtn onClick={() => setPlaying((p) => !p)} disabled={done} primary>{playing ? al.n1pause : al.n3play}</ActionBtn>
          <ActionBtn onClick={step} disabled={done || playing}>{al.n3step}</ActionBtn>
          <ActionBtn onClick={reset} disabled={written === 1 && !playing}>{al.n3reset}</ActionBtn>
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} rows={[
          { k: n.rows[0], v: `${written} / ${len}`, hi: true },
          { k: n.rows[1], v: `${dependsOn} tokens` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawSequential(el, {
        prompt: al.promptTokens, answer, written, reduce,
        L: { promptLane: al.n3promptLane, answerLane: al.n3answerLane, parallelTag: al.n3parallelTag, serialTag: al.n3serialTag },
      })} deps={[written, reduce, al]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function AutoregressiveLoop() {
  const { t, lang } = useAcademy();
  const al = t.autoregressiveLoop;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{al.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {al.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{al.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{al.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 8 }}>
            {al.pipeline.map((label, i) => (
              <a key={i} href={`#al-node-${i + 1}`} className="u-hover-fg-border"
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
      <div style={{ maxWidth: 760, margin: "clamp(34px,5vw,64px) auto 0" }}>
        <Deeper title={al.deeperTitle}>{rich(al.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(24px,3vw,36px) auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{al.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{al.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? al.hide : al.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(al.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{al.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(al.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/choosing-the-next-token" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {al.navPrev}</Link>
        <Link href="/stage/0/how-models-learn" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{al.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
