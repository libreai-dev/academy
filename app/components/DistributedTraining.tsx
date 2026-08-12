"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import {
  dataParallel,
  memPerGpu,
  fmtGB,
  ZERO_STAGES,
  type ZeroStage,
  GPU_CAP_GB,
} from "../lib/distributed-training";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * Full-width cards use a wide viewBox with large fonts so labels never render
 * below ~12px on a 360px phone; the two side-by-side panels use a narrow
 * viewBox (they render at their own column width) and can run smaller.
 * ======================================================================== */

/** A per-GPU palette so each shard reads as a distinct chip. */
const GPU_COLORS = ["var(--signal)", "var(--tok-num)", "var(--tok-sub)", "var(--tok-word)"];

/* --- Node 1: the data-parallel GPU grid --------------------------------- */

function drawDataParallel(el: SVGSVGElement, o: { n: number; reduce: boolean; busLabel: string }) {
  const W = 720;
  const cols = Math.min(o.n, 4);
  const rows = Math.ceil(o.n / 4);
  const cardW = 150;
  const cardH = 150;
  const gapX = 18;
  const gapY = 24;
  const gridW = cols * cardW + (cols - 1) * gapX;
  const startX = (W - gridW) / 2;
  const top = 16;
  const gridBottom = top + rows * cardH + (rows - 1) * gapY;
  const busY = gridBottom + 42;
  const H = busY + 56;

  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  for (let i = 0; i < o.n; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = startX + col * (cardW + gapX);
    const y = top + row * (cardH + gapY);
    const g = svg.append("g");
    // card shell
    g.append("rect").attr("x", x).attr("y", y).attr("width", cardW).attr("height", cardH).attr("rx", 16)
      .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1.5);
    // full model block (identical green on every card = a full replica)
    const mx = x + 12;
    const my = y + 12;
    const mw = cardW - 24;
    const mh = cardH - 52;
    const model = g.append("rect").attr("x", mx).attr("y", my).attr("width", mw).attr("rx", 9)
      .style("fill", "var(--signal)");
    if (dur) model.attr("height", 0).attr("y", my + mh).transition().duration(dur).attr("height", mh).attr("y", my);
    else model.attr("height", mh);
    // big GPU numeral on the model
    g.append("text").attr("x", mx + mw / 2).attr("y", my + mh / 2 + 14).attr("text-anchor", "middle")
      .style("fill", "#0a0a09").style("font-family", DISPLAY).style("font-weight", 700).style("font-size", "42px")
      .text(i + 1);
    // batch shard strip (distinct colour = this GPU's unique data)
    g.append("rect").attr("x", mx).attr("y", y + cardH - 32).attr("width", mw).attr("height", 20).attr("rx", 6)
      .style("fill", "var(--tok-num)").style("fill-opacity", 0.9);
    // connector down to the all-reduce bus
    if (row === rows - 1 || i + 4 >= o.n) {
      svg.append("line").attr("x1", x + cardW / 2).attr("y1", y + cardH).attr("x2", x + cardW / 2).attr("y2", busY)
        .style("stroke", "var(--signal)").style("stroke-width", 2).style("stroke-opacity", 0.7);
    }
  }

  // the all-reduce bus
  svg.append("rect").attr("x", startX).attr("y", busY).attr("width", gridW).attr("height", 9).attr("rx", 4.5)
    .style("fill", "var(--signal)");
  svg.append("text").attr("x", W / 2).attr("y", busY + 40).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "30px").text(o.busLabel);
}

/* --- Node 2a: tensor parallel — one layer sliced into strips ------------- */

function drawTensor(el: SVGSVGElement, o: { deg: number; reduce: boolean; allgatherLabel: string }) {
  const W = 360;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  const lx = 34;
  const ly = 40;
  const lw = W - 2 * lx;
  const lh = 150;
  const stripW = lw / o.deg;

  // the one layer, cut into vertical strips (one per GPU)
  for (let i = 0; i < o.deg; i++) {
    const sx = lx + i * stripW;
    svg.append("rect").attr("x", sx + 2).attr("y", ly).attr("width", Math.max(2, stripW - 4)).attr("height", lh).attr("rx", 6)
      .style("fill", GPU_COLORS[i % GPU_COLORS.length]).style("fill-opacity", 0.82)
      .style("stroke", "var(--bg)").style("stroke-width", 2);
    svg.append("text").attr("x", sx + stripW / 2).attr("y", ly + lh / 2 + 8).attr("text-anchor", "middle")
      .style("fill", "#0a0a09").style("font-family", DISPLAY).style("font-weight", 700).style("font-size", "24px")
      .text(i + 1);
  }
  // frame around the whole layer
  svg.append("rect").attr("x", lx).attr("y", ly).attr("width", lw).attr("height", lh).attr("rx", 8)
    .style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 1.5);

  // all-gather: arrows from each strip converging to a bar below
  const gy = ly + lh + 44;
  for (let i = 0; i < o.deg; i++) {
    const sx = lx + i * stripW + stripW / 2;
    const line = svg.append("line").attr("x1", sx).attr("y1", ly + lh).attr("x2", W / 2).attr("y2", gy)
      .style("stroke", "var(--muted)").style("stroke-width", 1.5);
    if (dur) line.style("opacity", 0).transition().duration(dur).style("opacity", 1);
  }
  svg.append("rect").attr("x", lx + lw / 4).attr("y", gy).attr("width", lw / 2).attr("height", 34).attr("rx", 9)
    .style("fill", "var(--bg)").style("stroke", "var(--signal)").style("stroke-width", 1.5);
  svg.append("text").attr("x", W / 2).attr("y", gy + 22).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "16px").text(o.allgatherLabel);
}

/* --- Node 2b: pipeline parallel — the layer stack cut into stages -------- */

function drawPipeline(el: SVGSVGElement, o: { deg: number; reduce: boolean; microLabel: string }) {
  const W = 360;
  const H = 300;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const totalLayers = 8;
  const stageOf = (layer: number) => Math.min(o.deg - 1, Math.floor((layer * o.deg) / totalLayers));
  const lx = 96;
  const lw = W - lx - 34;
  const top = 26;
  const layerH = 22;
  const gap = 6;

  // group layers into stages; draw a coloured stage box + a numeral
  for (let s = 0; s < o.deg; s++) {
    const layersIn = [];
    for (let l = 0; l < totalLayers; l++) if (stageOf(l) === s) layersIn.push(l);
    if (layersIn.length === 0) continue;
    const y0 = top + layersIn[0] * (layerH + gap);
    const y1 = top + layersIn[layersIn.length - 1] * (layerH + gap) + layerH;
    const color = GPU_COLORS[s % GPU_COLORS.length];
    // stage box
    svg.append("rect").attr("x", lx - 8).attr("y", y0 - 8).attr("width", lw + 16).attr("height", y1 - y0 + 16).attr("rx", 10)
      .style("fill", color).style("fill-opacity", 0.12).style("stroke", color).style("stroke-width", 1.8);
    // GPU numeral on the left
    svg.append("text").attr("x", 44).attr("y", (y0 + y1) / 2 + 8).attr("text-anchor", "middle")
      .style("fill", color).style("font-family", DISPLAY).style("font-weight", 700).style("font-size", "26px")
      .text(s + 1);
    // the layer bars inside
    for (const l of layersIn) {
      const y = top + l * (layerH + gap);
      svg.append("rect").attr("x", lx).attr("y", y).attr("width", lw).attr("height", layerH).attr("rx", 4)
        .style("fill", color).style("fill-opacity", 0.55);
    }
  }

  // a micro-batch dot flowing down through the stages
  const cx = lx + lw / 2;
  const yStart = top;
  const yEnd = top + (totalLayers - 1) * (layerH + gap) + layerH;
  const dot = svg.append("circle").attr("cx", cx).attr("r", 9).style("fill", "var(--fg)").style("stroke", "var(--bg)").style("stroke-width", 2);
  svg.append("text").attr("x", cx).attr("y", H - 12).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").text(o.microLabel);
  if (o.reduce) {
    dot.attr("cy", yStart + 6);
  } else {
    const loop = () => {
      dot.attr("cy", yStart).style("opacity", 1)
        .transition().duration(1600).ease(d3.easeLinear).attr("cy", yEnd)
        .transition().duration(200).style("opacity", 0)
        .on("end", loop);
    };
    loop();
  }
}

/* --- Node 3: the per-GPU memory bar under the 80 GB line ----------------- */

function drawMemoryBar(
  el: SVGSVGElement,
  o: {
    mem: { params: number; grads: number; optim: number; total: number; fits: boolean };
    reduce: boolean;
    capLabel: string;
    fitsLabel: string;
    nofitLabel: string;
  },
) {
  const W = 720;
  const H = 380;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 520;

  const maxGB = 130;
  const bottom = 330;
  const topPad = 40;
  const y = d3.scaleLinear().domain([0, maxGB]).range([bottom, topPad]).clamp(true);

  // baseline (0 GB)
  svg.append("line").attr("x1", 60).attr("y1", bottom).attr("x2", W - 40).attr("y2", bottom)
    .style("stroke", "var(--hair)").style("stroke-width", 1.5);

  // bar geometry
  const barX = 96;
  const barW = 150;
  const segs = [
    { v: o.mem.params, color: "var(--signal)" },
    { v: o.mem.grads, color: "var(--tok-num)" },
    { v: o.mem.optim, color: "var(--tok-sub)" },
  ];
  let acc = 0;
  for (const s of segs) {
    const y0 = y(acc);
    const y1 = y(acc + s.v);
    const h = Math.max(0, y0 - y1);
    const rect = svg.append("rect").attr("x", barX).attr("width", barW).attr("rx", 3)
      .style("fill", s.color).style("stroke", "var(--bg)").style("stroke-width", 1);
    if (dur) rect.attr("y", bottom).attr("height", 0).transition().duration(dur).attr("y", y1).attr("height", h);
    else rect.attr("y", y1).attr("height", h);
    acc += s.v;
  }

  // 80 GB capacity line across the whole chart
  const capY = y(GPU_CAP_GB);
  svg.append("line").attr("x1", 60).attr("y1", capY).attr("x2", W - 40).attr("y2", capY)
    .style("stroke", "var(--tok-byte)").style("stroke-width", 2.5).style("stroke-dasharray", "8 6");
  svg.append("text").attr("x", W - 44).attr("y", capY - 12).attr("text-anchor", "end")
    .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "24px").text(o.capLabel);

  // big total + fit badge, to the right of the bar
  const tx = 300;
  svg.append("text").attr("x", tx).attr("y", 150).attr("text-anchor", "start")
    .style("fill", "var(--fg)").style("font-family", DISPLAY).style("font-weight", 700).style("font-size", "58px")
    .text(`${fmtGB(o.mem.total)} GB`);
  svg.append("text").attr("x", tx + 4).attr("y", 184).attr("text-anchor", "start")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "24px").text("/ GPU");

  const badgeColor = o.mem.fits ? "var(--signal)" : "var(--tok-byte)";
  const badgeText = o.mem.fits ? o.fitsLabel : o.nofitLabel;
  svg.append("rect").attr("x", tx).attr("y", 210).attr("width", 240).attr("height", 52).attr("rx", 12)
    .style("fill", "color-mix(in srgb, " + badgeColor + " 14%, transparent)").style("stroke", badgeColor).style("stroke-width", 2);
  svg.append("text").attr("x", tx + 120).attr("y", 245).attr("text-anchor", "middle")
    .style("fill", badgeColor).style("font-family", MONO).style("font-weight", 700).style("font-size", "28px").text(badgeText);
}

/* ======================================================================== *
 * Small shared pieces
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

/** A tiny colour-swatch legend rendered as HTML (keeps svg text large). */
function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 12 }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>
          <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: it.color, flex: "0 0 auto" }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function useDT() {
  const { t } = useAcademy();
  return t.distributedTraining;
}

/** A titled panel wrapping one of the Node 2 comparison diagrams. */
function ComparePanel({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".08em", color: "var(--signal-fg)", fontWeight: 700 }}>{title}</div>
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{sub}</div>
      </div>
      <div style={{ padding: "12px 13px" }}>{children}</div>
    </div>
  );
}

/* ======================================================================== *
 * Node components
 * ======================================================================== */

function Node1({ reduce }: { reduce: boolean }) {
  const dt = useDT();
  const n = dt.nodes[0];
  const [gpus, setGpus] = useState(4);
  const stat = dataParallel(gpus);
  return (
    <SceneShell
      id="dt-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<Callout label={dt.calloutSyncLabel} title={dt.calloutSyncTitle}>{dt.calloutSyncBody}</Callout>}
      controls={<Slider id="dt-gpus" label={dt.n1slider} value={gpus} display={String(gpus)} min={1} max={8} onChange={setGpus} />}
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${stat.gpus}` },
          { k: n.rows[1], v: `${stat.globalBatch} samples` },
          { k: n.rows[2], v: `${stat.throughput}×`, hi: true },
          { k: n.rows[3], v: `${fmtGB(stat.modelGB)} GB` },
        ]} />
      }
    >
      {() => (
        <>
          <DiagramSvg label={n.aria ?? ""} draw={(el) => drawDataParallel(el, { n: gpus, reduce, busLabel: dt.n1bus })} deps={[gpus, reduce]} />
          <Legend items={[{ color: "var(--signal)", label: dt.n1legend[0] }, { color: "var(--tok-num)", label: dt.n1legend[1] }]} />
        </>
      )}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const dt = useDT();
  const n = dt.nodes[1];
  const [deg, setDeg] = useState(3);
  return (
    <SceneShell
      id="dt-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={<Slider id="dt-deg" label={dt.n2slider} value={deg} display={String(deg)} min={2} max={4} onChange={setDeg} />}
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${deg}` },
          { k: n.rows[1], v: `1/${deg} per layer` },
          { k: n.rows[2], v: `1/${deg} of layers` },
          { k: n.rows[3], v: `1/${deg}`, hi: true },
        ]} />
      }
    >
      {() => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
          <ComparePanel title={dt.n2tensorLabel} sub={dt.n2tensorSub}>
            <DiagramSvg label={dt.n2tensorLabel} draw={(el) => drawTensor(el, { deg, reduce, allgatherLabel: dt.n2allgather })} deps={[deg, reduce]} />
          </ComparePanel>
          <ComparePanel title={dt.n2pipelineLabel} sub={dt.n2pipelineSub}>
            <DiagramSvg label={dt.n2pipelineLabel} draw={(el) => drawPipeline(el, { deg, reduce, microLabel: dt.n2micro })} deps={[deg, reduce]} />
          </ComparePanel>
        </div>
      )}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const dt = useDT();
  const n = dt.nodes[2];
  const [stage, setStage] = useState<ZeroStage>("ddp");
  const [shards, setShards] = useState(8);
  const mem = memPerGpu(stage, shards);
  const stageIdx = ZERO_STAGES.indexOf(stage);
  return (
    <>
      <SceneShell
        id="dt-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
        cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
        labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[stageIdx]}
        aside={<Callout label={dt.callout3dLabel} title={dt.callout3dTitle}>{dt.callout3dBody}</Callout>}
        controls={
          <>
            <ControlRow>
              {dt.n3stages.map((lab, i) => (
                <Toggle key={i} on={stage === ZERO_STAGES[i]} onClick={() => setStage(ZERO_STAGES[i])}>{lab}</Toggle>
              ))}
            </ControlRow>
            <Slider id="dt-shard" label={dt.n3slider} value={shards} display={String(shards)} min={1} max={16} onChange={setShards} />
          </>
        }
        readout={
          <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
            { k: n.rows[0], v: dt.n3stages[stageIdx] },
            { k: n.rows[1], v: `${shards} GPUs` },
            { k: n.rows[2], v: `${fmtGB(mem.total)} GB`, hi: true },
            { k: n.rows[3], v: mem.fits ? dt.n3fits : dt.n3nofit },
          ]} />
        }
      >
        {() => (
          <>
            <DiagramSvg label={n.aria ?? ""} draw={(el) => drawMemoryBar(el, { mem, reduce, capLabel: dt.n3capLabel, fitsLabel: dt.n3fits, nofitLabel: dt.n3nofit })} deps={[stage, shards, reduce]} />
            <Legend items={[
              { color: "var(--signal)", label: `${dt.n3seg[0]} · ${fmtGB(mem.params)} GB` },
              { color: "var(--tok-num)", label: `${dt.n3seg[1]} · ${fmtGB(mem.grads)} GB` },
              { color: "var(--tok-sub)", label: `${dt.n3seg[2]} · ${fmtGB(mem.optim)} GB` },
            ]} />
          </>
        )}
      </SceneShell>
      <div style={{ maxWidth: 760, margin: "16px auto 0" }}>
        <Deeper title={dt.n3deeperTitle}>{rich(dt.n3deeperBody)}</Deeper>
      </div>
    </>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function DistributedTraining() {
  const { t, lang } = useAcademy();
  const dt = t.distributedTraining;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{dt.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {dt.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{dt.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{dt.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 8 }}>
            {dt.pipeline.map((label, i) => (
              <a key={i} href={`#dt-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{dt.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{dt.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(dt.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{dt.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(dt.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/mixed-precision" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {dt.navPrev}</Link>
        <Link href="/stage/0/matrix-optimizers" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{dt.navNext} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
