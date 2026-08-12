"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import {
  FORMATS,
  formatOf,
  type FormatKey,
  scaleGrads,
  countSurviving,
  sci,
  memBudget,
  GPU_CAPACITY_GB,
} from "../lib/mixed-precision";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * viewBox width is kept ~560 so label text stays ≥12px when the card is narrow.
 * ======================================================================== */

const VW = 560;

/* --- Node 1: bit layouts of FP32 / BF16 / FP8, one pixel-width per bit ---- */

function drawBits(
  el: SVGSVGElement,
  o: { selected: FormatKey; reduce: boolean; signLbl: string; expLbl: string; mantLbl: string; bitsWord: string },
) {
  const H = 328;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VW} ${H}`);
  svg.selectAll("*").remove();

  const bitW = 12; //           fixed px per bit → wider format = physically wider bar
  const x0 = 132; //            bars start here; left column holds the format name
  const barH = 40;
  const rowPitch = 72;
  const top = 22;

  const SIGN = "var(--tok-punct)";
  const EXP = "var(--signal)";
  const MANT = "var(--tok-num)";

  FORMATS.forEach((f, i) => {
    const y = top + i * rowPitch;
    const isSel = f.key === o.selected;

    // selection highlight behind the whole row
    if (isSel) {
      svg.append("rect").attr("x", 6).attr("y", y - 13).attr("width", VW - 12).attr("height", barH + 26).attr("rx", 11)
        .style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 2);
    }

    // format name (left column, right-aligned to the bar)
    svg.append("text").attr("x", x0 - 14).attr("y", y + barH / 2 - 3).attr("text-anchor", "end").attr("dominant-baseline", "middle")
      .style("fill", "var(--fg)").style("font-family", DISPLAY).style("font-size", "27px").style("font-weight", isSel ? "700" : "600")
      .text(f.name);
    svg.append("text").attr("x", x0 - 14).attr("y", y + barH / 2 + 22).attr("text-anchor", "end")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px")
      .text(`${f.bits} ${o.bitsWord}`);

    // three field segments, widths ∝ bit counts (same scale across every row)
    const segs = [
      { bits: f.sign, fill: SIGN },
      { bits: f.exponent, fill: EXP },
      { bits: f.mantissa, fill: MANT },
    ];
    let x = x0;
    segs.forEach((s) => {
      const w = s.bits * bitW;
      svg.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", barH).attr("rx", 3)
        .style("fill", s.fill).style("fill-opacity", isSel ? 0.95 : 0.5).style("stroke", "var(--bg)").style("stroke-width", 1);
      // faint per-bit ticks so it reads as discrete bits
      for (let b = 1; b < s.bits; b++) {
        svg.append("line").attr("x1", x + b * bitW).attr("y1", y).attr("x2", x + b * bitW).attr("y2", y + barH)
          .style("stroke", "var(--bg)").style("stroke-width", 0.75).style("stroke-opacity", 0.5);
      }
      // bit-count numeral inside exponent + mantissa (skip the 1-bit sign)
      if (s.bits >= 3) {
        svg.append("text").attr("x", x + w / 2).attr("y", y + barH / 2 + 2).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
          .style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "24px").style("font-weight", "700")
          .style("opacity", isSel ? 1 : 0.72).text(String(s.bits));
      }
      x += w;
    });
  });

  // legend — one item per row so long ES labels never overflow the width
  const items: [string, string][] = [[SIGN, o.signLbl], [EXP, o.expLbl], [MANT, o.mantLbl]];
  const ly0 = top + FORMATS.length * rowPitch - 2;
  items.forEach(([c, label], i) => {
    const yy = ly0 + i * 28;
    svg.append("rect").attr("x", 8).attr("y", yy - 15).attr("width", 17).attr("height", 17).attr("rx", 3)
      .style("fill", c).style("fill-opacity", 0.9);
    svg.append("text").attr("x", 34).attr("y", yy).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(label);
  });
}

/* --- Node 2: gradient survival list (raw → ×S → survives / lost) --------- */

function drawSurvival(
  el: SVGSVGElement,
  o: {
    lossScale: number;
    reduce: boolean;
    rawHead: string;
    scaledHead: string;
    floorNote: string;
    keptWord: string;
    lostWord: string;
    summaryWord: string;
  },
) {
  const rows = scaleGrads(o.lossScale);
  const kept = countSurviving(rows);
  const H = 356;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VW} ${H}`);
  svg.selectAll("*").remove();

  const rawX = 150; //   right edge of the raw magnitude column
  const sclX = 330; //   right edge of the scaled magnitude column
  const statX = 344; //  left edge of the status word

  // column headers
  svg.append("text").attr("x", rawX).attr("y", 24).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(o.rawHead);
  svg.append("text").attr("x", sclX).attr("y", 24).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(o.scaledHead);

  const top = 44;
  const pitch = 44;
  rows.forEach((r, i) => {
    const y = top + i * pitch;
    const col = r.survives ? "var(--signal)" : "var(--tok-byte)";
    // row band
    svg.append("rect").attr("x", 6).attr("y", y - 3).attr("width", VW - 12).attr("height", 36).attr("rx", 9)
      .style("fill", r.survives ? "var(--signal-wash)" : "color-mix(in srgb, var(--tok-byte) 12%, transparent)")
      .style("stroke", col).style("stroke-opacity", 0.5).style("stroke-width", 1);
    // raw magnitude
    svg.append("text").attr("x", rawX).attr("y", y + 22).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "23px").text(sci(r.raw));
    // arrow
    svg.append("text").attr("x", rawX + 42).attr("y", y + 22).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text("→");
    // scaled magnitude
    svg.append("text").attr("x", sclX).attr("y", y + 22).attr("text-anchor", "end").style("fill", col).style("font-family", MONO).style("font-size", "23px").style("font-weight", "700").text(sci(r.scaled));
    // status
    svg.append("text").attr("x", statX).attr("y", y + 22).style("fill", col).style("font-family", MONO).style("font-size", "22px").style("font-weight", "600")
      .text(`${r.survives ? "✓ " : "✕ "}${r.survives ? o.keptWord : o.lostWord}`);
  });

  const fy = top + rows.length * pitch + 6;
  // floor reminder
  svg.append("text").attr("x", 8).attr("y", fy + 4).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(o.floorNote);
  // summary
  svg.append("text").attr("x", 8).attr("y", fy + 40).style("fill", "var(--fg)").style("font-family", DISPLAY).style("font-size", "30px").style("font-weight", "700")
    .text(`${o.summaryWord} ${kept} / ${rows.length}`);
}

/* --- Node 3: memory budget — stacked bar against the 80 GB capacity line -- */

function drawBudget(
  el: SVGSVGElement,
  o: {
    precision: "fp32" | "bf16";
    checkpoint: boolean;
    microBatch: number;
    accumSteps: number;
    reduce: boolean;
    segStatesLbl: string;
    segActLbl: string;
    capacityLbl: string;
    fitWord: string;
    oomWord: string;
  },
) {
  const b = memBudget(o);
  const H = 232;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VW} ${H}`);
  svg.selectAll("*").remove();

  const x0 = 16;
  const x1 = VW - 16;
  const maxGB = 170; //          headroom so overflow past 80 GB is visible
  const x = d3.scaleLinear().domain([0, maxGB]).range([x0, x1]).clamp(true);

  const barY = 84;
  const barH = 50;
  const fits = b.fits;
  const verdictCol = fits ? "var(--signal)" : "var(--tok-byte)";

  // verdict + total (top)
  svg.append("text").attr("x", x0).attr("y", 36).style("fill", verdictCol).style("font-family", DISPLAY).style("font-size", "30px").style("font-weight", "700")
    .text(fits ? o.fitWord : o.oomWord);
  svg.append("text").attr("x", x1).attr("y", 36).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "24px")
    .text(`${b.totalGB.toFixed(0)} / ${GPU_CAPACITY_GB} GB`);

  // track
  svg.append("rect").attr("x", x0).attr("y", barY).attr("width", x1 - x0).attr("height", barH).attr("rx", 8)
    .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);

  const dur = o.reduce ? 0 : 450;
  // stacked segments
  const statesW = x(b.modelStateGB) - x0;
  const actW = Math.max(0, x(b.modelStateGB + b.activationGB) - x(b.modelStateGB));
  const seg1 = svg.append("rect").attr("x", x0).attr("y", barY).attr("height", barH).attr("rx", 8).style("fill", "var(--tok-num)").style("fill-opacity", 0.9);
  const seg2 = svg.append("rect").attr("x", x0 + statesW).attr("y", barY).attr("height", barH).style("fill", fits ? "var(--signal)" : "var(--tok-byte)");
  if (dur) {
    seg1.attr("width", 0).transition().duration(dur).attr("width", statesW);
    seg2.attr("width", 0).transition().duration(dur).attr("width", actW);
  } else {
    seg1.attr("width", statesW);
    seg2.attr("width", actW);
  }

  // capacity line at 80 GB
  const cap = x(GPU_CAPACITY_GB);
  svg.append("line").attr("x1", cap).attr("y1", barY - 16).attr("x2", cap).attr("y2", barY + barH + 8).style("stroke", "var(--fg)").style("stroke-width", 2).style("stroke-dasharray", "6 5");
  svg.append("text").attr("x", cap).attr("y", barY - 22).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").text(o.capacityLbl);

  // legend rows below the bar
  const legend = (yy: number, colour: string, label: string, val: string) => {
    svg.append("rect").attr("x", x0).attr("y", yy - 15).attr("width", 17).attr("height", 17).attr("rx", 3).style("fill", colour).style("fill-opacity", 0.9);
    svg.append("text").attr("x", x0 + 26).attr("y", yy).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(label);
    svg.append("text").attr("x", x1).attr("y", yy).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").style("font-weight", "600").text(val);
  };
  legend(barY + barH + 30, "var(--tok-num)", o.segStatesLbl, `${b.modelStateGB.toFixed(0)} GB`);
  legend(barY + barH + 60, fits ? "var(--signal)" : "var(--tok-byte)", o.segActLbl, `${b.activationGB.toFixed(1)} GB`);
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

function useMP() {
  const { t } = useAcademy();
  return t.mixedPrecision;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const mp = useMP();
  const n = mp.nodes[0];
  const keys: FormatKey[] = ["fp32", "bf16", "fp8"];
  const [sel, setSel] = useState<FormatKey>("bf16");
  const f = formatOf(sel);
  const idx = keys.indexOf(sel);
  const manual = useRef(false);
  const pick = (k: FormatKey) => { setSel(k); manual.current = true; };
  return (
    <SceneShell
      id="mp-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setSel(keys[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <>
          <ControlRow>
            {FORMATS.map((ff) => (
              <Toggle key={ff.key} on={sel === ff.key} onClick={() => pick(ff.key)}>{ff.name}</Toggle>
            ))}
          </ControlRow>
          <Deeper title={mp.n1deeperTitle}>{rich(mp.n1deeperBody)}</Deeper>
        </>
      }
      readout={
        <Readout title={`${n.readoutTitle} · ${f.name}`} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${f.bytes} ${f.bytes === 1 ? mp.n1byteWord : mp.n1bytesWord}`, hi: true },
          { k: n.rows[1], v: f.maxAbs },
          { k: n.rows[2], v: f.sigDigits },
          { k: n.rows[3], v: `${f.speed}×` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawBits(el, { selected: sel, reduce, signLbl: mp.n1legendSign, expLbl: mp.n1legendExp, mantLbl: mp.n1legendMant, bitsWord: mp.n1bitsWord })} deps={[sel, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const mp = useMP();
  const n = mp.nodes[1];
  const [k, setK] = useState(0); //           loss scale S = 2^k
  const lossScale = Math.pow(2, k);
  const rows = scaleGrads(lossScale);
  const kept = countSurviving(rows);
  const smallestAlive = rows.filter((r) => r.survives).map((r) => r.raw).sort((a, b) => a - b)[0];
  return (
    <SceneShell
      id="mp-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<Callout label={mp.calloutMasterLabel} title={mp.calloutMasterTitle}>{rich(mp.calloutMasterBody)}</Callout>}
      controls={
        <>
          <Slider id="mp-loss-scale" label={mp.n2slider} value={k} display={`2^${k} = ${lossScale.toLocaleString()}`} min={0} max={15} onChange={setK} />
          <Deeper title={mp.n2deeperTitle}>{rich(mp.n2deeperBody)}</Deeper>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `2^${k} = ${lossScale.toLocaleString()}` },
          { k: n.rows[1], v: `${kept} / ${rows.length}`, hi: kept === rows.length },
          { k: n.rows[2], v: smallestAlive != null ? sci(smallestAlive) : "—" },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawSurvival(el, {
        lossScale, reduce, rawHead: mp.n2rawHead, scaledHead: mp.n2scaledHead, floorNote: mp.n2floorNote,
        keptWord: mp.n2kept, lostWord: mp.n2lost, summaryWord: mp.n2summaryFmt,
      })} deps={[k, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const mp = useMP();
  const n = mp.nodes[2];
  const [precision, setPrecision] = useState<"fp32" | "bf16">("bf16");
  const [checkpoint, setCheckpoint] = useState(false);
  const [microBatch, setMicroBatch] = useState(4);
  const [accumSteps, setAccumSteps] = useState(1);
  const [note, setNote] = useState<string>(mp.nodes[2].optionNotes?.[1] ?? "");
  const b = memBudget({ precision, checkpoint, microBatch, accumSteps });
  return (
    <SceneShell
      id="mp-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <ControlRow>
            {mp.n3precision.map((lab, i) => {
              const p: "fp32" | "bf16" = i === 0 ? "fp32" : "bf16";
              return (
                <Toggle key={lab} on={precision === p} onClick={() => { setPrecision(p); setNote(n.optionNotes?.[i] ?? ""); }}>{lab}</Toggle>
              );
            })}
            <Toggle on={checkpoint} onClick={() => { setCheckpoint((v) => !v); setNote(mp.n3ckptNote); }}>
              {mp.n3checkpointLabel}: {checkpoint ? mp.n3on : mp.n3off}
            </Toggle>
          </ControlRow>
          <Slider id="mp-micro" label={mp.n3microSlider} value={microBatch} display={String(microBatch)} min={1} max={8} onChange={(v) => { setMicroBatch(v); setNote(mp.n3batchNote); }} />
          <Slider id="mp-accum" label={mp.n3accumSlider} value={accumSteps} display={String(accumSteps)} min={1} max={16} onChange={(v) => { setAccumSteps(v); setNote(mp.n3batchNote); }} />
          <Deeper title={mp.n3deeperTitle}>{rich(mp.n3deeperBody)}</Deeper>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${b.modelStateGB.toFixed(0)} GB` },
          { k: n.rows[1], v: `${b.activationGB.toFixed(1)} GB` },
          { k: n.rows[2], v: `${b.totalGB.toFixed(0)} GB`, hi: b.fits },
          { k: n.rows[3], v: `${b.effectiveBatch}` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawBudget(el, {
        precision, checkpoint, microBatch, accumSteps, reduce,
        segStatesLbl: mp.n3segStates, segActLbl: mp.n3segAct, capacityLbl: mp.n3capacityLabel,
        fitWord: mp.n3fit, oomWord: mp.n3oom,
      })} deps={[precision, checkpoint, microBatch, accumSteps, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function MixedPrecision() {
  const { t, lang } = useAcademy();
  const mp = t.mixedPrecision;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{mp.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {mp.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{mp.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{mp.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {mp.pipeline.map((label, i) => (
              <a key={i} href={`#mp-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{mp.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{mp.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(mp.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{mp.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(mp.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/test-time-search" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {mp.prevLesson}</Link>
        <Link href="/stage/0/distributed-training" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{mp.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
