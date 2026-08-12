"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  RANKS,
  fullLayerParams,
  loraLayerParams,
  loraPct,
  fullFtGB,
  adapterGB,
  MODEL_PARAMS,
  BASE_BYTES_16,
  BASE_BYTES_4,
  GPU_GB,
  gb1,
} from "../lib/parameter-efficient-finetuning";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() with CSS tokens, so theme flips resolve live.
 * ======================================================================== */

interface InjectLabels {
  frozen: string;
  trainable: string;
  wCap: string;
  adapterCap: string;
  adapterParams: string;
}

/** Node 1: input → (frozen W) + (trainable B·A) → ⊕ → output. */
function drawInject(el: SVGSVGElement, o: { r: number; reduce: boolean; L: InjectLabels }) {
  const W = 600;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;
  const green = "var(--signal)";

  // input x
  svg.append("circle").attr("cx", 34).attr("cy", 150).attr("r", 15).style("fill", "var(--surface)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", 34).attr("y", 156).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").text("x");

  // branch lines
  const line = (x1: number, y1: number, x2: number, y2: number, col = "var(--fg)", dash?: string) => {
    const l = svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2).style("stroke", col).style("stroke-width", 2);
    if (dash) l.style("stroke-dasharray", dash);
  };
  line(49, 150, 96, 150);
  line(96, 80, 96, 222);
  line(96, 80, 130, 80);
  line(96, 222, 130, 222);

  // --- frozen W block (grey) ---
  svg.append("rect").attr("x", 130).attr("y", 40).attr("width", 180).attr("height", 80).attr("rx", 10)
    .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", 220).attr("y", 78).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").style("font-weight", "700").text("W");
  svg.append("text").attr("x", 220).attr("y", 102).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "14px").text(o.L.frozen);
  svg.append("text").attr("x", 220).attr("y", 136).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.L.wCap);

  // --- adapter tags (green) above the adapter ---
  svg.append("text").attr("x", 224).attr("y", 166).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px").style("letter-spacing", ".06em").text(o.L.trainable);
  svg.append("text").attr("x", 224).attr("y", 186).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "14px").style("font-weight", "700").text(o.L.adapterParams);

  // rank → inner fill fraction (log-spaced so 1..64 spreads out)
  const frac = 0.18 + 0.82 * (Math.log2(o.r) / Math.log2(64));

  const adapterBox = (x: number, w: number, big: string, small: string) => {
    svg.append("rect").attr("x", x).attr("y", 194).attr("width", w).attr("height", 58).attr("rx", 9)
      .style("fill", "var(--signal-wash)").style("stroke", green).style("stroke-width", 1.6);
    // inner "rank" fill grows from the bottom with r
    const innerH = 42;
    const fh = frac * innerH;
    const bar = svg.append("rect").attr("x", x + 6).attr("width", w - 12).attr("rx", 3).style("fill", green).style("fill-opacity", 0.5);
    if (dur) bar.attr("y", 246).attr("height", 0).transition().duration(dur).attr("y", 246 - fh).attr("height", fh);
    else bar.attr("y", 246 - fh).attr("height", fh);
    svg.append("text").attr("x", x + w / 2).attr("y", 218).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "17px").style("font-weight", "700").text(big);
    svg.append("text").attr("x", x + w / 2).attr("y", 236).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px").text(small);
  };
  adapterBox(130, 66, "A", "r×d");
  line(196, 223, 214, 223, green);
  adapterBox(214, 104, "B", "k×r");
  svg.append("text").attr("x", 346).attr("y", 228).attr("text-anchor", "start").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "14px").text("×α/r");
  svg.append("text").attr("x", 224).attr("y", 272).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px").text(o.L.adapterCap);

  // --- merge into ⊕ ---
  line(310, 80, 392, 138);
  line(330, 223, 392, 162, green);
  svg.append("circle").attr("cx", 402).attr("cy", 150).attr("r", 17).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.8);
  svg.append("text").attr("x", 402).attr("y", 157).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text("+");

  // --- output h ---
  line(419, 150, 462, 150);
  svg.append("rect").attr("x", 462).attr("y", 120).attr("width", 126).attr("height", 60).attr("rx", 10).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", 525).attr("y", 145).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text("h");
  svg.append("text").attr("x", 525).attr("y", 166).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text("Wx + BAx");
}

interface MemLabels {
  full: string;
  adapter: string;
  baseLegend: string;
  adapterLegend: string;
  gpuLine: string;
  offChart: string;
  fits: string;
  nofit: string;
}

/** Node 2: two memory bars — full fine-tune (off the chart) vs the adapter run. */
function drawMemory(el: SVGSVGElement, o: { fourBit: boolean; reduce: boolean; L: MemLabels }) {
  const W = 560;
  const H = 320;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 520;

  const y0 = 268; //   baseline
  const top = 46; //   top of visible domain
  const domain = 32; // GB visible
  const pxPer = (y0 - top) / domain;
  const yFor = (gb: number) => y0 - Math.min(gb, domain) * pxPer;

  // baseline
  svg.append("line").attr("x1", 40).attr("y1", y0).attr("x2", W - 20).attr("y2", y0).style("stroke", "var(--border)").style("stroke-width", 1.5);

  // GPU line (dashed)
  const gy = yFor(GPU_GB);
  svg.append("line").attr("x1", 40).attr("y1", gy).attr("x2", W - 20).attr("y2", gy).style("stroke", "var(--fg)").style("stroke-width", 1.5).style("stroke-dasharray", "6 5").style("opacity", 0.8);
  svg.append("text").attr("x", W - 22).attr("y", gy - 8).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px").text(o.L.gpuLine);

  const barW = 150;

  // --- Full fine-tune: clamps to the top (off the chart) ---
  const fx = 78;
  const full = fullFtGB();
  const fRect = svg.append("rect").attr("x", fx).attr("width", barW).attr("rx", 6)
    .style("fill", "var(--tok-byte)").style("fill-opacity", 0.22).style("stroke", "var(--tok-byte)").style("stroke-width", 1.6);
  if (dur) fRect.attr("y", y0).attr("height", 0).transition().duration(dur).attr("y", top).attr("height", y0 - top);
  else fRect.attr("y", top).attr("height", y0 - top);
  svg.append("text").attr("x", fx + barW / 2).attr("y", top - 22).attr("text-anchor", "middle").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700").text(gb1(full));
  svg.append("text").attr("x", fx + barW / 2).attr("y", top - 6).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12.5px").text(o.L.offChart + " ✕");
  svg.append("text").attr("x", fx + barW / 2).attr("y", y0 + 22).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px").text(o.L.full);

  // --- Adapter run: frozen base (grey) + adapter/optimizer (green) stacked ---
  const ax = 332;
  const baseGB = (MODEL_PARAMS * (o.fourBit ? BASE_BYTES_4 : BASE_BYTES_16)) / 1e9;
  const total = adapterGB(o.fourBit);
  const extraGB = total - baseGB;
  const baseTop = yFor(baseGB);
  const totalTop = yFor(total);
  // base
  const bRect = svg.append("rect").attr("x", ax).attr("width", barW).attr("rx", 6).style("fill", "var(--border)").style("fill-opacity", 0.85);
  if (dur) bRect.attr("y", y0).attr("height", 0).transition().duration(dur).attr("y", baseTop).attr("height", y0 - baseTop);
  else bRect.attr("y", baseTop).attr("height", y0 - baseTop);
  // adapter (green) on top of base
  const eRect = svg.append("rect").attr("x", ax).attr("width", barW).attr("rx", 6).style("fill", "var(--signal)");
  if (dur) eRect.attr("y", baseTop).attr("height", 0).transition().duration(dur).attr("y", totalTop).attr("height", baseTop - totalTop);
  else eRect.attr("y", totalTop).attr("height", baseTop - totalTop);
  svg.append("text").attr("x", ax + barW / 2).attr("y", totalTop - 10).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700").text(gb1(total));
  svg.append("text").attr("x", ax + barW / 2).attr("y", y0 + 22).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14px").text(o.L.adapter);
  // fits verdict (adapter always < 24 here, but computed honestly)
  const fits = total <= GPU_GB;
  svg.append("text").attr("x", ax + barW / 2).attr("y", y0 + 40).attr("text-anchor", "middle").style("fill", fits ? "var(--signal-fg)" : "var(--tok-byte)").style("font-family", MONO).style("font-size", "13.5px").style("font-weight", "700").text(fits ? o.L.fits : o.L.nofit);

  // legend (base vs adapter swatches)
  const legend = (x: number, col: string, opacity: number, text: string) => {
    svg.append("rect").attr("x", x).attr("y", H - 16).attr("width", 12).attr("height", 12).attr("rx", 2).style("fill", col).style("fill-opacity", opacity);
    svg.append("text").attr("x", x + 18).attr("y", H - 6).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12.5px").text(text);
  };
  legend(78, "var(--border)", 0.85, o.L.baseLegend);
  legend(300, "var(--signal)", 1, o.L.adapterLegend);
}

/** Node 3 · QLoRA mini: a 16-bit weight bar shrinking to a 4-bit one. */
function drawQlora(el: SVGSVGElement, o: { l16: string; l4: string; reduce: boolean }) {
  const W = 320;
  const H = 118;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;
  // 16-bit
  svg.append("text").attr("x", 14).attr("y", 22).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").text(o.l16);
  svg.append("rect").attr("x", 14).attr("y", 30).attr("width", 288).attr("height", 22).attr("rx", 5).style("fill", "var(--border)").style("fill-opacity", 0.85);
  // 4-bit
  svg.append("text").attr("x", 14).attr("y", 78).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "15px").text(o.l4);
  const r4 = svg.append("rect").attr("x", 14).attr("y", 86).attr("height", 22).attr("rx", 5).style("fill", "var(--signal)");
  if (dur) r4.attr("width", 288).transition().duration(dur).attr("width", 72);
  else r4.attr("width", 72);
  svg.append("text").attr("x", 100).attr("y", 102).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "14px").style("font-weight", "700").text("4× ↓");
}

/** Node 3 · DoRA mini: a weight split into magnitude (trained) + direction (LoRA). */
function drawDora(el: SVGSVGElement, o: { formula: string; mag: string; dir: string; trained: string; lora: string }) {
  const W = 320;
  const H = 160;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  svg.append("text").attr("x", 160).attr("y", 24).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "15px").text(o.formula);
  // W node
  svg.append("circle").attr("cx", 30).attr("cy", 98).attr("r", 15).style("fill", "var(--surface)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", 30).attr("y", 103).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "15px").style("font-weight", "700").text("W");
  // branches
  svg.append("line").attr("x1", 45).attr("y1", 98).attr("x2", 70).attr("y2", 98).style("stroke", "var(--fg)").style("stroke-width", 1.8);
  svg.append("line").attr("x1", 70).attr("y1", 62).attr("x2", 70).attr("y2", 134).style("stroke", "var(--fg)").style("stroke-width", 1.8);
  svg.append("line").attr("x1", 70).attr("y1", 62).attr("x2", 96).attr("y2", 62).style("stroke", "var(--fg)").style("stroke-width", 1.8);
  svg.append("line").attr("x1", 70).attr("y1", 134).attr("x2", 96).attr("y2", 134).style("stroke", "var(--fg)").style("stroke-width", 1.8);
  const box = (y: number, big: string, tag: string) => {
    svg.append("rect").attr("x", 96).attr("y", y).attr("width", 210).attr("height", 44).attr("rx", 9).style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 1.5);
    svg.append("text").attr("x", 201).attr("y", y + 20).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "15px").style("font-weight", "700").text(big);
    svg.append("text").attr("x", 201).attr("y", y + 37).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "12.5px").text(tag);
  };
  box(40, o.mag, o.trained);
  box(112, o.dir, o.lora);
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

function usePeft() {
  const { t } = useAcademy();
  return t.parameterEfficientFinetuning;
}

/* ---- Node 1: freeze + inject ------------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const p = usePeft();
  const n = p.nodes[0];
  const [idx, setIdx] = useState(3); // r = 8
  const r = RANKS[idx];
  const trainable = loraLayerParams(r);
  const pct = loraPct(r);
  const note = r <= 4 ? p.n1capLo : p.n1capHi;
  const labels: InjectLabels = {
    frozen: p.n1frozenTag,
    trainable: p.n1trainTag,
    wCap: p.n1wCaption,
    adapterCap: p.n1adapterCaption,
    adapterParams: `+${trainable.toLocaleString()} ${p.n1adapterFmt}`,
  };
  return (
    <SceneShell
      id="peft-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      aside={<Deeper title={p.n1deeperTitle}>{rich(p.n1deeperBody)}</Deeper>}
      controls={
        <Slider id="peft-rank" label={p.n1slider} value={idx} display={`r = ${r}`} min={0} max={RANKS.length - 1} onChange={setIdx} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: String(r) },
          { k: n.rows[1], v: trainable.toLocaleString(), hi: true },
          { k: n.rows[2], v: `${pct.toFixed(2)}% of ${fullLayerParams().toLocaleString()}` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawInject(el, { r, reduce, L: labels })} deps={[idx, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2: the memory win -------------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const p = usePeft();
  const n = p.nodes[1];
  const [fourBit, setFourBit] = useState(false);
  const labels: MemLabels = {
    full: p.n2fullLabel,
    adapter: p.n2adapterLabel,
    baseLegend: p.n2baseLegend,
    adapterLegend: p.n2adapterLegend,
    gpuLine: p.n2gpuLine,
    offChart: p.n2offChart,
    fits: p.n2fits,
    nofit: p.n2nofit,
  };
  return (
    <SceneShell
      id="peft-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[fourBit ? 1 : 0]}
      controls={
        <ControlRow>
          {p.n2seg.map((lab, i) => (
            <Toggle key={i} on={(i === 1) === fourBit} onClick={() => setFourBit(i === 1)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawMemory(el, { fourBit, reduce, L: labels })} deps={[fourBit, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3: variants (QLoRA vs DoRA) ---------------------------------- */

function VariantCards({ p, sel, reduce }: { p: ReturnType<typeof usePeft>; sel: number; reduce: boolean }) {
  const rows = (v: ReturnType<typeof usePeft>["n3variants"][number]) => [
    [p.n3changesLabel, v.changes],
    [p.n3costLabel, v.cost],
    [p.n3payoffLabel, v.payoff],
  ];
  const card = (i: number, mini: React.ReactNode) => {
    const v = p.n3variants[i];
    const active = sel === i;
    return (
      <div key={v.key} style={{ border: `1px solid ${active ? "var(--signal)" : "var(--border)"}`, background: active ? "var(--signal-wash)" : "var(--bg)", borderRadius: 14, overflow: "hidden", transition: "border-color .15s ease, background .15s ease" }}>
        <div style={{ padding: "12px 15px 0", fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, letterSpacing: "-.02em", color: active ? "var(--signal-fg)" : "var(--fg)" }}>{v.name}</div>
        <div style={{ padding: "8px 12px 4px" }}>{mini}</div>
        <div style={{ padding: "6px 15px 15px", display: "flex", flexDirection: "column", gap: 8 }}>
          {rows(v).map(([k, val], j) => (
            <div key={j}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{k}</div>
              <div style={{ fontSize: 14, lineHeight: 1.45, color: "var(--fg)", marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
      {card(0, <DiagramSvg label={p.n3variants[0].name} draw={(el) => drawQlora(el, { l16: p.n3q16, l4: p.n3q4, reduce })} deps={[reduce]} />)}
      {card(1, <DiagramSvg label={p.n3variants[1].name} draw={(el) => drawDora(el, { formula: p.n3formula, mag: p.n3dMag, dir: p.n3dDir, trained: p.n3dTrained, lora: p.n3dLora })} deps={[reduce]} />)}
    </div>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const p = usePeft();
  const n = p.nodes[2];
  const [sel, setSel] = useState(0);
  return (
    <SceneShell
      id="peft-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[sel]}
      aside={<Deeper title={p.n3deeperTitle}>{rich(p.n3deeperBody)}</Deeper>}
      controls={
        <ControlRow>
          {p.n3seg.map((lab, i) => (
            <Toggle key={i} on={sel === i} onClick={() => setSel(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <VariantCards p={p} sel={sel} reduce={reduce} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function ParameterEfficientFinetuning() {
  const { t, lang } = useAcademy();
  const p = t.parameterEfficientFinetuning;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{p.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {p.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{p.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{p.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {p.pipeline.map((label, i) => (
              <a key={i} href={`#peft-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{p.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{p.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(p.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{p.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(p.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/matrix-optimizers" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {p.prevLesson}</Link>
        <Link href="/stage/0/ppo" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{p.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
