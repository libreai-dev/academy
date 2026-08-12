"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import type { FeedForwardLesson } from "../lib/copy/feed-forward";
import {
  D_MODEL,
  expandStat,
  gateValues,
  firingCount,
  FIRE_COLS,
  FIRE_ROWS,
  FIRE_N,
  FIRE_THRESHOLD,
} from "../lib/feed-forward";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so design tokens + theme flips resolve live.
 * viewBox width 460 so labels stay ≥12px even on a ~292px phone card.
 * ======================================================================== */

const fmtInt = (n: number) => n.toLocaleString("en-US");

/* --- Node 1: the up-projection (narrow → wide) -------------------------- */

function drawExpand(
  el: SVGSVGElement,
  o: { factor: number; dFf: number; paramsM: number; inputLabel: string; hiddenLabel: string; dimsWord: string; upLabel: string; paramsWord: string },
) {
  const W = 460;
  const H = 320;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const cy = 158;

  // input column (fixed narrow bar)
  const inX = 40, inW = 50, inH = 116, inY = cy - inH / 2;
  // hidden column: taller as the factor grows
  const hh = 74 + ((o.factor - 1) / 7) * 150; // 74 → 224
  const hX = 322, hW = 50, hY = cy - hh / 2;

  // up-projection trapezoid (the W_up matrix)
  svg.append("path")
    .attr("d", `M${inX + inW},${inY} L${hX},${hY} L${hX},${hY + hh} L${inX + inW},${inY + inH} Z`)
    .style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 1.5);

  // input bar + inner divisions
  svg.append("rect").attr("x", inX).attr("y", inY).attr("width", inW).attr("height", inH).attr("rx", 6)
    .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1.5);
  for (let i = 1; i < 6; i++) {
    svg.append("line").attr("x1", inX).attr("x2", inX + inW).attr("y1", inY + (inH / 6) * i).attr("y2", inY + (inH / 6) * i)
      .style("stroke", "var(--hair)").style("stroke-width", 1);
  }

  // hidden bar + denser divisions (more units)
  svg.append("rect").attr("x", hX).attr("y", hY).attr("width", hW).attr("height", hh).attr("rx", 6)
    .style("fill", "color-mix(in srgb, var(--signal) 16%, transparent)").style("stroke", "var(--signal)").style("stroke-width", 1.5);
  const nDiv = Math.min(22, Math.round(4 * o.factor));
  for (let i = 1; i < nDiv; i++) {
    svg.append("line").attr("x1", hX).attr("x2", hX + hW).attr("y1", hY + (hh / nDiv) * i).attr("y2", hY + (hh / nDiv) * i)
      .style("stroke", "color-mix(in srgb, var(--signal) 30%, transparent)").style("stroke-width", 1);
  }

  // up-projection label (top centre)
  svg.append("text").attr("x", (inX + inW + hX) / 2).attr("y", 34).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").style("font-weight", 700)
    .text(`×${o.factor} ${o.upLabel}`);

  // input labels
  svg.append("text").attr("x", inX + inW / 2).attr("y", inY - 12).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.inputLabel);
  svg.append("text").attr("x", inX + inW / 2).attr("y", inY + inH + 26).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(`${fmtInt(D_MODEL)} ${o.dimsWord}`);

  // hidden labels
  svg.append("text").attr("x", hX + hW / 2).attr("y", hY - 12).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.hiddenLabel);
  svg.append("text").attr("x", hX + hW / 2).attr("y", hY + hh + 26).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "20px").style("font-weight", 700).text(`${fmtInt(o.dFf)} ${o.dimsWord}`);

  // parameter count (bottom centre)
  svg.append("text").attr("x", W / 2).attr("y", H - 10).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px")
    .text(`≈ ${fmtInt(o.paramsM)}M ${o.paramsWord}`);
}

/* --- Node 2: which hidden units fire ------------------------------------ */

function drawGate(
  el: SVGSVGElement,
  o: { vals: number[]; count: number; inputLabel: string; reduce: boolean; unitsLabel: string; firingWord: string; ofWord: string; inputWord: string },
) {
  const W = 460;
  const H = 306;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  // header: the input token
  svg.append("text").attr("x", 40).attr("y", 40).attr("text-anchor", "start")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(`${o.inputWord}:`);
  svg.append("text").attr("x", 92).attr("y", 40).attr("text-anchor", "start")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").style("font-weight", 700).text(o.inputLabel);

  // grid of sampled units
  const x0 = 40, x1 = 420, y0 = 62, y1 = 244;
  const cw = (x1 - x0) / FIRE_COLS;
  const ch = (y1 - y0) / FIRE_ROWS;
  const pad = 3;
  o.vals.forEach((v, i) => {
    const col = i % FIRE_COLS;
    const row = Math.floor(i / FIRE_COLS);
    const fires = v > FIRE_THRESHOLD;
    const strength = fires ? 0.4 + 0.6 * Math.min(1, (v - FIRE_THRESHOLD) / (1 - FIRE_THRESHOLD)) : 0;
    const cell = svg.append("rect")
      .attr("x", x0 + col * cw + pad).attr("y", y0 + row * ch + pad)
      .attr("width", cw - pad * 2).attr("height", ch - pad * 2).attr("rx", 4)
      .style("fill", fires ? "var(--signal)" : "var(--surface)")
      .style("stroke", fires ? "var(--signal)" : "var(--border)").style("stroke-width", 1);
    if (o.reduce) cell.style("fill-opacity", fires ? strength : 1);
    else cell.style("fill-opacity", 0).transition().duration(320).delay(Math.min(i * 4, 200)).style("fill-opacity", fires ? strength : 1);
  });

  // footer: firing count + what the grid is
  svg.append("text").attr("x", 40).attr("y", H - 30).attr("text-anchor", "start")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").style("font-weight", 700)
    .text(`${o.count} ${o.ofWord} ${FIRE_N} ${o.firingWord}`);
  svg.append("text").attr("x", 40).attr("y", H - 8).attr("text-anchor", "start")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.unitsLabel);
}

/* --- Node 3: down-projection + residual --------------------------------- */

function drawCompress(
  el: SVGSVGElement,
  o: { residual: boolean; reduce: boolean; inLabel: string; editLabel: string; editTag: string; outLabel: string; lostLabel: string },
) {
  const W = 460;
  const H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const bx = 176, bw = 268, bh = 40;
  const yIn = 26, yEd = 96, yOut = 172;
  const labelX = 12;

  // Row: token in
  const inDim = o.residual ? 1 : 0.35;
  svg.append("rect").attr("x", bx).attr("y", yIn).attr("width", bw).attr("height", bh).attr("rx", 7)
    .style("fill", "var(--muted)").style("fill-opacity", 0.5 * inDim).style("stroke", "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", labelX).attr("y", yIn + 26).style("fill", o.residual ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "20px").text(o.inLabel);
  if (!o.residual) {
    svg.append("line").attr("x1", bx).attr("y1", yIn).attr("x2", bx + bw).attr("y2", yIn + bh).style("stroke", "var(--tok-byte)").style("stroke-width", 2);
    svg.append("text").attr("x", bx + bw - 6).attr("y", yIn + 26).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "20px").text(`✕ ${o.lostLabel}`);
  }

  // "+" between rows
  svg.append("text").attr("x", labelX + 2).attr("y", (yIn + bh + yEd) / 2 + 8).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text("+");

  // Row: feed-forward edit (green) with a compress tag
  svg.append("rect").attr("x", bx).attr("y", yEd).attr("width", bw).attr("height", bh).attr("rx", 7)
    .style("fill", "var(--signal)").style("fill-opacity", 0.9).style("stroke", "var(--signal)").style("stroke-width", 1.5);
  svg.append("text").attr("x", labelX).attr("y", yEd + 20).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.editLabel);
  svg.append("text").attr("x", labelX).attr("y", yEd + 40).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "20px").text(o.editTag);

  // "=" before the output row
  svg.append("text").attr("x", labelX + 2).attr("y", (yEd + bh + yOut) / 2 + 8).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text("=");

  // Row: token out
  if (o.residual) {
    // both present: grey base + green overlay = sum
    svg.append("rect").attr("x", bx).attr("y", yOut).attr("width", bw).attr("height", bh).attr("rx", 7)
      .style("fill", "var(--muted)").style("fill-opacity", 0.5).style("stroke", "var(--signal)").style("stroke-width", 2);
    svg.append("rect").attr("x", bx).attr("y", yOut).attr("width", bw).attr("height", bh).attr("rx", 7)
      .style("fill", "var(--signal)").style("fill-opacity", 0.45).style("stroke", "none");
  } else {
    // edit only
    svg.append("rect").attr("x", bx).attr("y", yOut).attr("width", bw).attr("height", bh).attr("rx", 7)
      .style("fill", "var(--signal)").style("fill-opacity", 0.9).style("stroke", "var(--tok-byte)").style("stroke-width", 2).style("stroke-dasharray", "6 5");
  }
  svg.append("text").attr("x", labelX).attr("y", yOut + 26).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").style("font-weight", 700).text(o.outLabel);

  // caption
  svg.append("text").attr("x", bx + bw / 2).attr("y", H - 10).attr("text-anchor", "middle")
    .style("fill", o.residual ? "var(--signal-fg)" : "var(--tok-byte)").style("font-family", MONO).style("font-size", "20px")
    .text(o.residual ? "output = input + edit" : "output = edit — input discarded");
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

function useFF(): FeedForwardLesson {
  const { t } = useAcademy();
  return t.feedForward;
}

/* ---- Node 1 — expand --------------------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const ff = useFF();
  const n = ff.nodes[0];
  const [factor, setFactor] = useState(4);
  const stat = expandStat(factor);
  return (
    <SceneShell
      id="ff-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="ff-factor" label={ff.n1slider} value={factor} display={`×${factor}`} min={1} max={8} onChange={setFactor} />
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawExpand(el, { factor, dFf: stat.dFf, paramsM: stat.paramsM, inputLabel: ff.n1inputLabel, hiddenLabel: ff.n1hiddenLabel, dimsWord: ff.n1dimsWord, upLabel: ff.n1upLabel, paramsWord: ff.n1paramsWord })}
          deps={[factor]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 — activate ------------------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const ff = useFF();
  const n = ff.nodes[1];
  const [idx, setIdx] = useState(0);
  const vals = gateValues(idx);
  const count = firingCount(vals);
  const manual = useRef(false);
  const pick = (i: number) => { setIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="ff-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Callout label={ff.calloutLabel} title={ff.calloutTitle}>{ff.calloutBody}</Callout>}
      controls={
        <ControlRow>
          {ff.n2inputs.map((lab, i) => (
            <Toggle key={i} on={idx === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawGate(el, { vals, count, inputLabel: ff.n2inputs[idx], reduce, unitsLabel: ff.n2unitsLabel, firingWord: ff.n2firingWord, ofWord: ff.n2ofWord, inputWord: ff.n2inputWord })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3 — compress ------------------------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const ff = useFF();
  const n = ff.nodes[2];
  const [residual, setResidual] = useState(true);
  return (
    <SceneShell
      id="ff-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[residual ? 0 : 1]}
      controls={
        <Toggle on={residual} onClick={() => setResidual((v) => !v)}>{ff.n3toggle}: {residual ? "ON" : "OFF"}</Toggle>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawCompress(el, { residual, reduce, inLabel: ff.n3inLabel, editLabel: ff.n3editLabel, editTag: ff.n3editTag, outLabel: residual ? ff.n3outOn : ff.n3outOff, lostLabel: ff.n3lostLabel })}
          deps={[residual, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function FeedForward() {
  const { t, lang } = useAcademy();
  const ff = t.feedForward;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{ff.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {ff.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{ff.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{ff.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {ff.pipeline.map((label, i) => (
              <a key={i} href={`#ff-node-${i + 1}`} className="u-hover-fg-border"
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
        <Deeper title={ff.deeperTitle}>{rich(ff.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{ff.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{ff.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(ff.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{ff.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(ff.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/attention-mechanism" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {ff.prevLesson}</Link>
        <Link href="/stage/0/sampling-strategies" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{ff.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
