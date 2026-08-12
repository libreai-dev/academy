"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Deeper } from "./webscale-kit";
import {
  BIT_WIDTHS,
  type BitWidth,
  levels,
  modelGB,
  maxErrorPct,
  QUALITY,
  SPEEDUP,
  FITS_ON,
  quantizeNaive,
  quantizeCalibrated,
  type MethodResult,
} from "../lib/quantization";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Narrow viewBoxes keep label text ≥12px when the card renders on a phone.
 * All colour via .style() so CSS tokens + theme flips resolve live.
 * ======================================================================== */

/* --- Node 1: weight distribution snapped onto discrete levels ------------ */

function drawLevels(
  el: SVGSVGElement,
  o: { bits: BitWidth; reduce: boolean; distLabel: string; levelsWord: string; contLabel: string; gapLabel: string },
) {
  const W = 380;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const x0 = 22;
  const x1 = W - 22;
  const baseY = 232;
  const peakY = 74;
  const x = (v: number) => x0 + ((v + 1) / 2) * (x1 - x0);
  const sigma = 0.36;
  const dens = (v: number) => Math.exp(-(v * v) / (2 * sigma * sigma));
  const y = (v: number) => baseY - dens(v) * (baseY - peakY);

  // header labels
  svg.append("text").attr("x", x0).attr("y", 32).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").style("letter-spacing", ".04em").text(o.distLabel);
  const n = levels(o.bits);
  svg.append("text").attr("x", x1).attr("y", 32).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "15px").text(`${n.toLocaleString()} ${o.levelsWord}`);

  // the smooth distribution (filled area) — the true spread of weights
  const pts = d3.range(-1, 1.0001, 0.02);
  const area = d3.area<number>().x((v) => x(v)).y0(baseY).y1((v) => y(v)).curve(d3.curveBasis);
  svg.append("path").datum(pts).attr("d", area).style("fill", "var(--border)").style("fill-opacity", 0.5);
  const line = d3.line<number>().x((v) => x(v)).y((v) => y(v)).curve(d3.curveBasis);
  svg.append("path").datum(pts).attr("d", line).style("fill", "none").style("stroke", "var(--muted)").style("stroke-width", 1.5);

  // baseline + axis ticks
  svg.append("line").attr("x1", x0).attr("y1", baseY).attr("x2", x1).attr("y2", baseY).style("stroke", "var(--fg)").style("stroke-width", 1.5);
  [-1, 0, 1].forEach((v) => {
    svg.append("text").attr("x", x(v)).attr("y", baseY + 22).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "14px").text(v > 0 ? "+1" : String(v));
  });

  const dur = o.reduce ? 0 : 420;

  if (n <= 16) {
    // Draw each level as a green tick — the coarse steps are now visible.
    const step = 2 / (n - 1);
    for (let i = 0; i < n; i++) {
      const v = -1 + i * step;
      const ln = svg.append("line").attr("x1", x(v)).attr("y1", baseY).attr("x2", x(v)).attr("y2", peakY - 6).style("stroke", "var(--signal)").style("stroke-width", 1.6).style("stroke-opacity", 0.85);
      if (dur) ln.attr("y1", baseY).attr("y2", baseY).transition().duration(dur).attr("y2", peakY - 6);
    }
    // max rounding gap: a labelled double-ended arrow between two adjacent
    // centre levels — it visibly widens as the bit-width drops.
    const iMid = Math.floor(n / 2);
    const gLo = -1 + (iMid - 1) * step;
    const gHi = -1 + iMid * step;
    const gy = peakY - 22;
    svg.append("line").attr("x1", x(gLo)).attr("y1", gy).attr("x2", x(gHi)).attr("y2", gy).style("stroke", "var(--signal-fg)").style("stroke-width", 2).style("stroke-linecap", "round");
    [gLo, gHi].forEach((gv) => svg.append("line").attr("x1", x(gv)).attr("y1", gy - 5).attr("x2", x(gv)).attr("y2", gy + 5).style("stroke", "var(--signal-fg)").style("stroke-width", 2));
    svg.append("text").attr("x", (x(gLo) + x(gHi)) / 2).attr("y", gy - 10).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "13.5px").text(o.gapLabel);
  } else {
    // Too many levels to draw — a solid green band reads as "continuous".
    const band = svg.append("rect").attr("x", x0).attr("y", peakY - 6).attr("width", x1 - x0).attr("height", baseY - (peakY - 6)).style("fill", "var(--signal)").style("fill-opacity", 0.14);
    if (dur) band.style("fill-opacity", 0).transition().duration(dur).style("fill-opacity", 0.14);
    svg.append("text").attr("x", (x0 + x1) / 2).attr("y", peakY + 22).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "15px").style("font-weight", 700).text(o.contLabel);
  }
}

/* --- Node 2: one panel of weights, quantized (naive or calibrated) ------- */

function drawMethodPanel(
  el: SVGSVGElement,
  o: { res: MethodResult; title: string; avgLabel: string; salientLabel: string; good: boolean; reduce: boolean },
) {
  const W = 360;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const rows = o.res.rows;
  const n = rows.length;
  const x0 = 20;
  const x1 = W - 20;
  const baseY = 150;
  const amp = 96;
  const slot = (x1 - x0) / n;
  const barW = Math.min(22, slot - 10);
  const yv = (v: number) => baseY - v * amp;
  const dur = o.reduce ? 0 : 380;

  // title
  svg.append("text").attr("x", x0).attr("y", 30).style("fill", o.good ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "15px").style("letter-spacing", ".04em").style("font-weight", 700).text(o.title);

  // zero baseline
  svg.append("line").attr("x1", x0).attr("y1", baseY).attr("x2", x1).attr("y2", baseY).style("stroke", "var(--fg)").style("stroke-width", 1.2).style("stroke-opacity", 0.6);
  svg.append("text").attr("x", x1).attr("y", baseY + 4).attr("text-anchor", "start").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text("0").attr("dx", 2);

  rows.forEach((r, i) => {
    const cx = x0 + slot * i + slot / 2;
    // salient highlight backdrop
    if (r.salient) {
      svg.append("rect").attr("x", cx - slot / 2 + 2).attr("y", 42).attr("width", slot - 4).attr("height", H - 78).attr("rx", 6).style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 1.4);
      svg.append("text").attr("x", cx).attr("y", H - 26).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12.5px").text(o.salientLabel);
    }
    // true weight bar (grey)
    svg.append("rect").attr("x", cx - barW / 2).attr("y", Math.min(baseY, yv(r.w))).attr("width", barW).attr("height", Math.abs(yv(r.w) - baseY)).attr("rx", 3).style("fill", "var(--border)").style("fill-opacity", 0.9);
    // error segment (red) from stored value to true value
    const errCol = "var(--tok-byte)";
    if (r.err > 0.004) {
      const eSeg = svg.append("line").attr("x1", cx).attr("y1", yv(r.q)).attr("x2", cx).attr("y2", yv(r.w)).style("stroke", errCol).style("stroke-width", 3).style("stroke-linecap", "round");
      if (dur) eSeg.attr("y2", yv(r.q)).transition().duration(dur).attr("y2", yv(r.w));
    }
    // stored (quantized) value — green tick
    svg.append("line").attr("x1", cx - barW / 2 - 2).attr("y1", yv(r.q)).attr("x2", cx + barW / 2 + 2).attr("y2", yv(r.q)).style("stroke", "var(--signal)").style("stroke-width", 2.4);
  });

  // avg error footer
  const avg = o.res.avgErr;
  svg.append("text").attr("x", x0).attr("y", H - 8).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.avgLabel);
  svg.append("text").attr("x", x1).attr("y", H - 8).attr("text-anchor", "end").style("fill", o.good ? "var(--signal-fg)" : "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").style("font-weight", 700).text(avg.toFixed(3));
}

/* --- Node 3: size / speed / quality trade-off bars ---------------------- */

function drawTradeoff(
  el: SVGSVGElement,
  o: { bits: BitWidth; reduce: boolean; sizeLabel: string; speedLabel: string; qualityLabel: string },
) {
  const W = 380;
  const H = 232;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const x0 = 20;
  const x1 = W - 20;
  const trackW = x1 - x0;
  const dur = o.reduce ? 0 : 460;

  const gb = modelGB(o.bits);
  const q = QUALITY[o.bits];
  const metrics = [
    { label: o.sizeLabel, frac: gb / modelGB(16), value: `${gb.toFixed(2)} GB`, col: "var(--muted)" },
    { label: o.speedLabel, frac: SPEEDUP[o.bits] / SPEEDUP[2], value: `${SPEEDUP[o.bits].toFixed(1)}×`, col: "var(--signal)" },
    { label: o.qualityLabel, frac: q / 100, value: `${q}%`, col: q >= 95 ? "var(--signal)" : "var(--tok-byte)" },
  ];

  metrics.forEach((m, i) => {
    const yTop = 20 + i * 70;
    svg.append("text").attr("x", x0).attr("y", yTop).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "15px").style("letter-spacing", ".04em").text(m.label);
    svg.append("text").attr("x", x1).attr("y", yTop).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", 700).text(m.value);
    const barY = yTop + 12;
    svg.append("rect").attr("x", x0).attr("y", barY).attr("width", trackW).attr("height", 24).attr("rx", 7).style("fill", "var(--surface)").style("stroke", "var(--border)");
    const w = Math.max(6, m.frac * trackW);
    const bar = svg.append("rect").attr("x", x0).attr("y", barY).attr("height", 24).attr("rx", 7).style("fill", m.col);
    if (dur) bar.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", w);
    else bar.attr("width", w);
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

function useQ() {
  const { t } = useAcademy();
  return t.quantization;
}

function fmtErr(pct: number): string {
  if (pct < 0.01) return "<0.01%";
  if (pct < 1) return `${pct.toFixed(2)}%`;
  return `${pct.toFixed(1)}%`;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const q = useQ();
  const n = q.nodes[0];
  const [bits, setBits] = useState<BitWidth>(16);
  const idx = BIT_WIDTHS.indexOf(bits);
  const manual = useRef(false);
  const pick = (b: BitWidth) => { setBits(b); manual.current = true; };
  return (
    <SceneShell
      id="q-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={BIT_WIDTHS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setBits(BIT_WIDTHS[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {q.n1widths.map((lab, i) => (
            <Toggle key={i} on={bits === BIT_WIDTHS[i]} onClick={() => pick(BIT_WIDTHS[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${bits}-bit` },
          { k: n.rows[1], v: levels(bits).toLocaleString(), hi: true },
          { k: n.rows[2], v: `${modelGB(bits).toFixed(2)} GB`, hi: true },
          { k: n.rows[3], v: fmtErr(maxErrorPct(bits)) },
        ]} />
      }
    >
      {() => (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLevels(el, { bits, reduce, distLabel: q.n1distLabel, levelsWord: q.n1levelsLabel, contLabel: q.n1contLabel, gapLabel: q.n1gapLabel })} deps={[bits, reduce]} />
          <Deeper title={q.n1deeperTitle}>{rich(q.n1deeperBody)}</Deeper>
        </div>
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const q = useQ();
  const n = q.nodes[1];
  const [method, setMethod] = useState(0); // 0 GPTQ · 1 AWQ · 2 GGUF
  const naive = quantizeNaive(4);
  const calib = quantizeCalibrated(4);
  const naiveSalient = naive.rows.find((r) => r.salient)?.err ?? 0;
  const calibSalient = calib.rows.find((r) => r.salient)?.err ?? 0;
  const panel = (res: MethodResult, title: string, good: boolean, label: string) => (
    <div style={{ border: `1px solid ${good ? "var(--signal)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
      <DiagramSvg label={label} draw={(el) => drawMethodPanel(el, { res, title, avgLabel: q.n2avgLabel, salientLabel: q.n2salientLabel, good, reduce })} deps={[method, reduce]} />
    </div>
  );
  return (
    <SceneShell
      id="q-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[method]}
      controls={
        <ControlRow>
          {q.n2methods.map((lab, i) => (
            <Toggle key={i} on={method === i} onClick={() => setMethod(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} rows={[
          { k: n.rows[0], v: q.n2methods[method], hi: true },
          { k: n.rows[1], v: `${naive.avgErr.toFixed(3)} → ${calib.avgErr.toFixed(3)}`, hi: true },
          { k: n.rows[2], v: `${naiveSalient.toFixed(3)} → ${calibSalient.toFixed(3)}` },
        ]} />
      }
    >
      {() => (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
            {panel(naive, q.n2naiveLabel, false, q.n2naiveLabel)}
            {panel(calib, `${q.n2smartLabel} · ${q.n2methods[method]}`, true, q.n2smartLabel)}
          </div>
          <Deeper title={q.n2deeperTitle}>{rich(q.n2deeperBody)}</Deeper>
        </div>
      )}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const q = useQ();
  const n = q.nodes[2];
  const [bits, setBits] = useState<BitWidth>(16);
  const idx = BIT_WIDTHS.indexOf(bits);
  const manual = useRef(false);
  const pick = (b: BitWidth) => { setBits(b); manual.current = true; };
  return (
    <SceneShell
      id="q-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={BIT_WIDTHS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setBits(BIT_WIDTHS[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {q.n3widths.map((lab, i) => (
            <Toggle key={i} on={bits === BIT_WIDTHS[i]} onClick={() => pick(BIT_WIDTHS[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${modelGB(bits).toFixed(2)} GB`, hi: true },
          { k: n.rows[1], v: `${SPEEDUP[bits].toFixed(1)}×`, hi: true },
          { k: n.rows[2], v: `${QUALITY[bits]}%`, hi: QUALITY[bits] >= 95 },
          { k: n.rows[3], v: FITS_ON[bits] },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTradeoff(el, { bits, reduce, sizeLabel: q.n3sizeLabel, speedLabel: q.n3speedLabel, qualityLabel: q.n3qualityLabel })} deps={[bits, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Quantization() {
  const { t, lang } = useAcademy();
  const q = t.quantization;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{q.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {q.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{q.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{q.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {q.pipeline.map((label, i) => (
              <a key={i} href={`#q-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{q.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{q.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(q.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{q.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(q.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/kv-cache-systems" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {q.prevLesson}</Link>
        <Link href="/stage/0/speculative-decoding" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{q.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
