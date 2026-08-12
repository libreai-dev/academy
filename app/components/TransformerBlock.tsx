"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, ControlRow, Toggle, Slider, Deeper } from "./webscale-kit";
import {
  attentionRow,
  topAttended,
  N1_DEFAULT_QUERY,
  nextTokenProbs,
  topPrediction,
  N3_MIN_DEPTH,
  N3_MAX_DEPTH,
  N3_DEFAULT_DEPTH,
} from "../lib/transformer-block";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS tokens + theme flips resolve live.
 * ======================================================================== */

/* --- Node 1: attention links over a token row --------------------------- */

function drawAttention(
  el: SVGSVGElement,
  o: { tokens: string[]; q: number; lookLabel: string; reduce: boolean; onPick: (i: number) => void },
) {
  const W = 760;
  const H = 210;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const n = o.tokens.length;
  const M = 16;
  const slot = (W - 2 * M) / n;
  const chipW = slot - 8;
  const chipH = 42;
  const top = 30;
  const bottom = top + chipH;
  const cx = (i: number) => M + i * slot + slot / 2;

  const row = attentionRow(o.q);
  const maxW = Math.max(...row.map((l) => l.w), 0.0001);
  const dur = o.reduce ? 0 : 450;

  // 1) links (under the chips): from the query down to each earlier token.
  row.forEach((l) => {
    if (l.k === o.q) return; // self shows via the chip highlight, not an arc
    const rel = l.w / maxW;
    const x1 = cx(o.q);
    const x2 = cx(l.k);
    const dip = bottom + 96;
    const path = svg.append("path")
      .attr("d", `M ${x1} ${bottom} Q ${(x1 + x2) / 2} ${dip} ${x2} ${bottom}`)
      .style("fill", "none")
      .style("stroke", "var(--signal)")
      .style("stroke-linecap", "round")
      .style("stroke-width", 2 + rel * 11)
      .style("opacity", 0.18 + rel * 0.7);
    if (dur) {
      const len = (path.node() as SVGPathElement).getTotalLength();
      path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len)
        .transition().duration(dur).attr("stroke-dashoffset", 0);
    }
  });

  // 2) the token chips
  o.tokens.forEach((word, i) => {
    const x = M + i * slot + (slot - chipW) / 2;
    const isQ = i === o.q;
    const link = row.find((l) => l.k === i);
    const future = i > o.q; // causal mask: can't look ahead
    const rel = link ? link.w / maxW : 0;

    const g = svg.append("g").style("cursor", "pointer")
      .on("click", () => o.onPick(i));

    g.append("rect").attr("x", x).attr("y", top).attr("width", chipW).attr("height", chipH).attr("rx", 9)
      .style("fill", isQ ? "var(--signal-wash)" : link && !isQ ? "var(--signal)" : "var(--bg)")
      .style("fill-opacity", isQ ? 1 : link ? 0.1 + rel * 0.32 : future ? 0.4 : 1)
      .style("stroke", isQ ? "var(--signal)" : link ? "var(--signal)" : "var(--border)")
      .style("stroke-width", isQ ? 2.5 : link ? 1.5 : 1)
      .style("stroke-opacity", link && !isQ ? 0.3 + rel * 0.6 : 1);

    g.append("text").attr("x", x + chipW / 2).attr("y", top + chipH / 2 + 5).attr("text-anchor", "middle")
      .style("fill", "var(--fg)").style("opacity", future ? 0.45 : 1)
      .style("font-family", MONO).style("font-size", "13px").style("font-weight", isQ ? 700 : 400)
      .style("pointer-events", "none").text(word);
  });

  // 3) "looking" tag over the query chip
  const qx = M + o.q * slot + (slot - chipW) / 2;
  svg.append("text").attr("x", qx + chipW / 2).attr("y", top - 9).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(`↓ ${o.lookLabel}`);
}

/* --- Node 2: one block's three parts ------------------------------------ */

function drawBlock(
  el: SVGSVGElement,
  o: { part: number; reduce: boolean; inLabel: string; outLabel: string; mix: string; think: string; shortcut: string; add: string },
) {
  const W = 760;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const mid = 148;
  const on = (p: number) => o.part === p;

  const line = (x1: number, y1: number, x2: number, y2: number, active = false) =>
    svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
      .style("stroke", active ? "var(--signal)" : "var(--fg)").style("stroke-width", active ? 2.5 : 2);

  const box = (x: number, w: number, label: string, active: boolean) => {
    svg.append("rect").attr("x", x).attr("y", mid - 46).attr("width", w).attr("height", 92).attr("rx", 12)
      .style("fill", active ? "var(--signal-wash)" : "var(--bg)")
      .style("stroke", active ? "var(--signal)" : "var(--border)").style("stroke-width", active ? 2.5 : 1.5);
    svg.append("text").attr("x", x + w / 2).attr("y", mid + 5).attr("text-anchor", "middle")
      .style("fill", active ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "13px")
      .style("font-weight", active ? 700 : 500).style("letter-spacing", ".04em").text(label);
  };

  const adder = (x: number, active: boolean) => {
    svg.append("circle").attr("cx", x).attr("cy", mid).attr("r", 14)
      .style("fill", "var(--bg)").style("stroke", active ? "var(--signal)" : "var(--fg)").style("stroke-width", active ? 2.5 : 1.5);
    svg.append("text").attr("x", x).attr("y", mid + 6).attr("text-anchor", "middle")
      .style("fill", active ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "17px").style("font-weight", 700).text("+");
    if (active) {
      svg.append("text").attr("x", x).attr("y", mid + 34).attr("text-anchor", "middle")
        .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.add);
    }
  };

  // input tokens (3 dots)
  const inX = 40;
  [110, 148, 186].forEach((y) => {
    svg.append("circle").attr("cx", inX).attr("cy", y).attr("r", 8)
      .style("fill", "var(--fg)").style("opacity", on(0) ? 1 : 0.7);
  });
  svg.append("text").attr("x", inX).attr("y", 224).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.inLabel);

  // when mixing, show the tokens talking to each other
  if (on(0)) {
    [[110, 148], [148, 186], [110, 186]].forEach(([a, b]) => {
      svg.append("path").attr("d", `M ${inX + 10} ${a} C ${inX + 34} ${(a + b) / 2}, ${inX + 34} ${(a + b) / 2}, ${inX + 10} ${b}`)
        .style("fill", "none").style("stroke", "var(--signal)").style("stroke-width", 1.5).style("opacity", 0.85);
    });
  }

  const attnX = 132, attnW = 140;
  const add1X = 306;
  const mlpX = 372, mlpW = 140;
  const add2X = 546;
  const outX = 640;

  // main path: in → attn → +add1 → mlp → +add2 → out
  line(inX + 8, mid, attnX, mid);
  line(attnX + attnW, mid, add1X - 14, mid);
  line(add1X + 14, mid, mlpX, mid);
  line(mlpX + mlpW, mid, add2X - 14, mid);
  line(add2X + 14, mid, outX - 8, mid);

  // residual shortcut arcs (bypass each sublayer)
  const arc = (x1: number, x2: number, active: boolean) => {
    const peak = 46;
    svg.append("path").attr("d", `M ${x1} ${mid} C ${x1} ${peak}, ${x2} ${peak}, ${x2} ${mid - 14}`)
      .style("fill", "none").style("stroke", active ? "var(--signal)" : "var(--muted)")
      .style("stroke-width", active ? 2.5 : 1.5).style("stroke-dasharray", active ? "none" : "5 5");
  };
  arc(attnX - 8, add1X, on(2));
  arc(add1X + 24, add2X, on(2));
  if (on(2)) {
    svg.append("text").attr("x", (attnX + add2X) / 2).attr("y", 34).attr("text-anchor", "middle")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(o.shortcut);
  }

  box(attnX, attnW, o.mix, on(0));
  adder(add1X, on(2));
  box(mlpX, mlpW, o.think, on(1));
  adder(add2X, on(2));

  // when thinking, show independent per-token arrows through the mini-network
  if (on(1)) {
    [124, 148, 172].forEach((y) => {
      svg.append("line").attr("x1", mlpX + 16).attr("y1", y).attr("x2", mlpX + mlpW - 16).attr("y2", y)
        .style("stroke", "var(--signal)").style("stroke-width", 1.5).style("opacity", 0.8);
    });
  }

  // output tokens
  [110, 148, 186].forEach((y) => {
    svg.append("circle").attr("cx", outX).attr("cy", y).attr("r", 8)
      .style("fill", "var(--fg)").style("opacity", 0.85);
  });
  svg.append("text").attr("x", outX).attr("y", 224).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(o.outLabel);
}

/* --- Node 3: a stack of blocks → next-token bars ------------------------ */

function drawStack(
  el: SVGSVGElement,
  o: { depth: number; candidates: string[]; probs: number[]; reduce: boolean; towerLabel: string; inLabel: string; predictLabel: string },
) {
  const W = 760;
  const H = 440;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 550;

  // ---- the tower of blocks (left) ----
  const tx = 74, tw = 220;
  const topY = 60, botY = 372;
  const gap = o.depth > 1 ? Math.min(4, 40 / o.depth) : 0;
  const bh = (botY - topY - gap * (o.depth - 1)) / o.depth;
  for (let i = 0; i < o.depth; i++) {
    const y = botY - bh - i * (bh + gap);
    svg.append("rect").attr("x", tx).attr("y", y).attr("width", tw).attr("height", Math.max(2, bh)).attr("rx", bh > 10 ? 7 : 3)
      .style("fill", "var(--signal)").style("fill-opacity", 0.14 + (i / Math.max(1, o.depth - 1)) * 0.16)
      .style("stroke", "var(--signal)").style("stroke-width", 1).style("stroke-opacity", 0.7);
    if (bh > 20) {
      svg.append("text").attr("x", tx + tw / 2).attr("y", y + bh / 2 + 4).attr("text-anchor", "middle")
        .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12px").text(`block ${i + 1}`);
    }
  }
  // tokens-in arrow at the bottom
  svg.append("line").attr("x1", tx + tw / 2).attr("y1", 404).attr("x2", tx + tw / 2).attr("y2", botY + 2)
    .style("stroke", "var(--fg)").style("stroke-width", 2);
  svg.append("path").attr("d", `M ${tx + tw / 2 - 5} ${botY + 8} L ${tx + tw / 2} ${botY} L ${tx + tw / 2 + 5} ${botY + 8}`)
    .style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 2);
  svg.append("text").attr("x", tx + tw / 2).attr("y", 422).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(`${o.inLabel} · ${o.depth} × ${o.towerLabel}`);

  // ---- connector from the top block into the prediction ----
  svg.append("path").attr("d", `M ${tx + tw} ${topY + 12} C ${tx + tw + 40} ${topY + 12}, ${390} ${72}, ${430} ${72}`)
    .style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 2);

  // ---- next-token bars (right) ----
  const bx = 430;
  const barX = bx + 92;
  const barMax = W - barX - 46;
  const maxP = Math.max(...o.probs, 0.0001);
  svg.append("text").attr("x", bx).attr("y", 58).style("fill", "var(--signal-fg)").style("font-family", MONO)
    .style("font-size", "12px").style("letter-spacing", ".06em").text(o.predictLabel);

  o.candidates.forEach((word, i) => {
    const p = o.probs[i] ?? 0;
    const isTop = i === o.probs.reduce((b, v, j) => (v > o.probs[b] ? j : b), 0);
    const y = 84 + i * 60;
    const w = Math.max(5, (p / maxP) * barMax);
    svg.append("text").attr("x", bx).attr("y", y + 20).style("fill", isTop ? "var(--fg)" : "var(--muted)")
      .style("font-family", MONO).style("font-size", "13px").style("font-weight", isTop ? 700 : 400).text(word);
    svg.append("rect").attr("x", barX).attr("y", y).attr("width", barMax).attr("height", 30).attr("rx", 7)
      .style("fill", "var(--surface)").style("stroke", "var(--border)");
    const bar = svg.append("rect").attr("x", barX).attr("y", y).attr("height", 30).attr("rx", 7)
      .style("fill", "var(--signal)").style("opacity", isTop ? 1 : 0.5);
    if (dur) bar.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", w);
    else bar.attr("width", w);
    svg.append("text").attr("x", barX + w + 8).attr("y", y + 20).style("fill", isTop ? "var(--fg)" : "var(--muted)")
      .style("font-family", MONO).style("font-size", "13px").style("font-weight", isTop ? 700 : 400).text(`${Math.round(p * 100)}%`);
  });
}

/* ======================================================================== *
 * Node components
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

function useTB() {
  const { t } = useAcademy();
  return t.transformerBlock;
}

function fillTemplate(tmpl: string, vars: Record<string, string>): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function Node1({ reduce }: { reduce: boolean }) {
  const tb = useTB();
  const n = tb.nodes[0];
  const [q, setQ] = useState(N1_DEFAULT_QUERY);
  const kWord = tb.n1tokens[topAttended(q)];
  const note = rich(fillTemplate(tb.n1noteTemplate, { q: tb.n1tokens[q], k: kWord }));
  return (
    <SceneShell
      id="tb-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      aside={<Deeper title={tb.n1deeperTitle}>{rich(tb.n1deeperBody)}</Deeper>}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{tb.n1queryLabel}</div>
          <ControlRow>
            {tb.n1tokens.map((word, i) => (
              <Toggle key={i} on={q === i} onClick={() => setQ(i)} ariaLabel={`Make "${word}" the word that looks`}>{word}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawAttention(el, { tokens: tb.n1tokens, q, lookLabel: tb.n1lookLabel, reduce, onPick: setQ })} deps={[q, reduce, tb.n1tokens.join(",")]} />}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const tb = useTB();
  const n = tb.nodes[1];
  const [part, setPart] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => { setPart(i); manual.current = true; };
  return (
    <SceneShell
      id="tb-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setPart(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[part]}
      controls={
        <ControlRow>
          {tb.n2parts.map((lab, i) => (
            <Toggle key={i} on={part === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawBlock(el, { part, reduce, inLabel: tb.n2inLabel, outLabel: tb.n2outLabel, mix: tb.n2mixLabel, think: tb.n2thinkLabel, shortcut: tb.n2shortcutLabel, add: tb.n2addLabel })} deps={[part, reduce]} />}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const tb = useTB();
  const n = tb.nodes[2];
  const [depth, setDepth] = useState(N3_DEFAULT_DEPTH);
  const probs = nextTokenProbs(depth);
  const top = topPrediction(depth);
  const note = rich(fillTemplate(tb.n3noteTemplate, { n: String(depth), word: tb.n3candidates[top], p: String(Math.round(probs[top] * 100)) }));
  return (
    <SceneShell
      id="tb-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <Slider id="tb-depth" label={tb.n3depthLabel} value={depth} display={`${depth} × block`} min={N3_MIN_DEPTH} max={N3_MAX_DEPTH} onChange={setDepth} />
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawStack(el, { depth, candidates: tb.n3candidates, probs, reduce, towerLabel: tb.n3towerLabel, inLabel: tb.n3inLabel, predictLabel: tb.n3predictLabel })} deps={[depth, reduce, tb.n3candidates.join(",")]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function TransformerBlock() {
  const { t, lang } = useAcademy();
  const tb = t.transformerBlock;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{tb.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {tb.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{tb.lede}</p>

        {/* idea chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{tb.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {tb.pipeline.map((label, i) => (
              <a key={i} href={`#tb-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{tb.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{tb.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(tb.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{tb.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(tb.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/embedding-matrix" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {tb.prevLabel}</Link>
        <Link href="/stage/0/choosing-the-next-token" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{tb.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
