"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import LessonRail from "./LessonRail";
import { MONO, DISPLAY, useReducedMotion, useCountUp, Cap, rich } from "./lesson-kit";
import {
  RACE_WIDTHS,
  netLayers,
  netStats,
  neuronInfo,
  CPU_STEP_MS,
  GPU_STEP_MS,
  CPU_CORES,
  CPU_CORE_COLS,
  GPU_CORES,
  GPU_CORE_COLS,
  RACK_PATHS,
  RACKS,
  NODES_PER_RACK,
  GPUS_PER_NODE,
  SPLIT_LAYERS,
  SPLIT_GPU_COUNT,
  ownsNode,
  type SplitKey,
} from "../lib/gpucpu";

const GPU_COLOR = "var(--tok-num)"; //   blue — the parallel machine
const CPU_COLOR = "var(--tok-byte)"; //  red — the serial machine
const FAST_COLOR = "var(--tok-word)"; // green — NVLink / speed-up
const SLOW_COLOR = "var(--tok-sub)"; //  orange — InfiniBand / the network

const fmtInt = (x: number) => Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Stable pseudo-random in [0,1) — same seed → same value, so a given time-tick
 *  paints a stable set of "busy" cores (they shift as the tick advances). */
const rnd = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
/** GPU cores for the layer being computed now (`gl` = layers already done): one
 *  core per neuron in that layer, at random positions — and a fresh random set
 *  each layer, since every layer runs on the GPU all at once. */
const gpuCores = (gl: number, layers: number[], computedLayers: number): ((i: number) => boolean) => {
  if (gl >= computedLayers) return () => false; //  GPU finished — die goes quiet
  const count = layers[gl + 1]; //                 neurons in the layer being computed
  const on = new Set<number>();
  let k = 0;
  while (on.size < count && k < count * 8 + 20) { on.add(Math.floor(rnd((gl + 1) * 977.3 + k * 131.7 + 71) * GPU_CORES)); k++; }
  return (i) => on.has(i);
};

export default function GpuCpu() {
  const { t, lang } = useAcademy();
  const h = t.hw;
  const reduce = useReducedMotion();

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 32px 0", display: "flex", flexWrap: "wrap", gap: "clamp(28px, 4vw, 60px)", alignItems: "flex-start" }}>
      <LessonRail current={5} />

      <article style={{ flex: "1 1 560px", minWidth: 0, paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{h.crumb}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1, margin: "16px 0 0" }}>{h.title}</h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "60ch", textWrap: "pretty" }}>{rich(h.lede)}</p>

        {/* ---- Hero: one layer = one matrix multiply -------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", background: "var(--surface)" }}>
          <div style={{ padding: "clamp(22px,3vw,34px) clamp(20px,2.5vw,30px)" }}>
            <div style={{ textAlign: "center" }}>
              <Cap>{h.heroLabel}</Cap>
              <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{h.heroSub}</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <HeroRace h={h} reduce={reduce} />
            </div>
            <p style={{ margin: "16px auto 0", maxWidth: "48ch", textAlign: "center", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, textWrap: "pretty" }}>{rich(h.heroCaption)}</p>
          </div>
        </div>

        {/* ---- Concept 1 ------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {h.concept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive 1: run the network ---------------------- */}
        <NetworkRace h={h} reduce={reduce} />

        {/* ---- Concept 2 ------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {h.midConcept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive 2: inside a rack ------------------------ */}
        <RackTour h={h} reduce={reduce} />

        {/* ---- Concept 3 ------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {h.splitConcept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive 3: split the model ---------------------- */}
        <ModelSplit h={h} reduce={reduce} />

        {/* ---- Explain it back ------------------------------------- */}
        <div style={{ marginTop: "clamp(28px, 3.2vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
          <ExplainBack q={h.explainQ} a={h.explainA} reveal={t.reveal} hide={t.hide} label={t.explainLabel} reduce={reduce} />
        </div>

        {/* ---- Go deeper ------------------------------------------- */}
        <Deeper title={h.deeperTitle} body={h.deeperBody} reduce={reduce} />
        <Deeper title={h.deeper2Title} body={h.deeper2Body} reduce={reduce} />

        {/* ---- Bridge to Embeddings -------------------------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{h.bridgeLabel}</div>
          <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", maxWidth: "60ch", textWrap: "pretty" }}>{rich(h.bridgeBody)}</p>
        </div>

        {/* ---- Controls -------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/stage/1/neural-networks" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {h.prev}</Link>
            <Link href="/stage/1/embeddings" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>{h.next} →</Link>
          </div>
          <MarkComplete markLabel={t.markComplete} doneLabel={t.completed} />
        </div>

        <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>{lang === "es" ? "Idioma: Español" : "Language: English"}</div>
      </article>
    </div>
  );
}

/* =====================================================================
   A "machine" = a network wired to a processor die (shared by hero + race)
   ===================================================================== */

const DOT_FORMULA = "σ(w·a) = σ( Σᵢ wᵢaᵢ )";
const DOT_SHORT = "σ(w·a)"; //  per-machine line (full formula lives in the header)

type NetNode = { layer: number; idx: number; order: number; isInput: boolean; x: number; y: number };
type Core = { i: number; x: number; y: number; s: number };

/** Node positions + per-neuron processing order for a network drawn in W×H. */
function buildNet(layers: number[], W: number, H: number, padX: number, padY: number): { nodes: NetNode[]; edges: { a: NetNode; b: NetNode }[] } {
  const xs = d3.scalePoint<number>().domain(layers.map((_, i) => i)).range([padX, W - padX]).padding(0.4);
  const yOf = (r: number, cnt: number) => (cnt === 1 ? H / 2 : padY + (r / (cnt - 1)) * (H - 2 * padY));
  const nodes: NetNode[] = [];
  let order = 0;
  layers.forEach((cnt, li) => {
    for (let r = 0; r < cnt; r++) {
      const isInput = li === 0;
      nodes.push({ layer: li, idx: r, order: isInput ? -1 : order++, isInput, x: xs(li)!, y: yOf(r, cnt) });
    }
  });
  const byLayer = layers.map((_, li) => nodes.filter((nd) => nd.layer === li));
  const edges: { a: NetNode; b: NetNode }[] = [];
  for (let li = 0; li < layers.length - 1; li++) for (const a of byLayer[li]) for (const b of byLayer[li + 1]) edges.push({ a, b });
  return { nodes, edges };
}

/** Draw a network (visible edges + dim neurons) above a processor die whose
 *  cores can light up. One svg holds both, so they animate in lock-step. */
function drawMachine(el: SVGSVGElement, layers: number[], color: string, cores: number, coreCols: number, dieLabel: string) {
  const W = 300;
  const netH = 150;
  const H = 250;
  const { nodes, edges } = buildNet(layers, W, netH, 26, 16);
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  // visible connections
  svg.append("g").selectAll("line").data(edges).join("line")
    .attr("x1", (d) => d.a.x).attr("y1", (d) => d.a.y).attr("x2", (d) => d.b.x).attr("y2", (d) => d.b.y)
    .attr("stroke", color).attr("stroke-width", 1).attr("stroke-opacity", 0.32);
  // neurons
  svg.append("g").selectAll<SVGCircleElement, NetNode>("circle.neuron").data(nodes).join("circle")
    .attr("class", "neuron").attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", 7)
    .attr("fill", color).attr("fill-opacity", (d) => (d.isInput ? 0.9 : 0.12))
    .attr("stroke", color).attr("stroke-opacity", (d) => (d.isInput ? 0.95 : 0.3)).attr("stroke-width", 1.2);

  // processor die
  const dieX = 12, dieY = 166, dieW = 276, dieH = 74;
  svg.append("rect").attr("x", dieX).attr("y", dieY).attr("width", dieW).attr("height", dieH).attr("rx", 10)
    .attr("fill", "var(--surface)").attr("stroke", color).attr("stroke-opacity", 0.5).attr("stroke-width", 1.2);
  svg.append("text").attr("x", dieX + 11).attr("y", dieY + 15)
    .style("font-family", MONO).style("font-size", "9px").style("fill", "var(--muted)").style("letter-spacing", ".08em").text(dieLabel);

  // cores
  const gridL = dieX + 13, gridT = dieY + 23, gridW = dieW - 26, gridH = dieH - 32;
  const rows = Math.ceil(cores / coreCols);
  const cw = gridW / coreCols, chh = gridH / rows;
  const sz = Math.max(3.5, Math.min(cw, chh) - 2.5);
  const data: Core[] = d3.range(cores).map((i) => ({ i, x: gridL + (i % coreCols) * cw, y: gridT + Math.floor(i / coreCols) * chh, s: sz }));
  svg.append("g").selectAll<SVGRectElement, Core>("rect.core").data(data).join("rect")
    .attr("class", "core").attr("x", (d) => d.x).attr("y", (d) => d.y).attr("width", (d) => d.s).attr("height", (d) => d.s).attr("rx", 1.5)
    .attr("fill", color).attr("fill-opacity", 0.14);
}

/** Repaint computed neurons + busy cores + the active-layer band — cheap enough
 *  to call every frame. `activeLayer` is the layer being computed right now
 *  (null when idle/done). */
function paintMachine(el: SVGSVGElement, litN: (d: NetNode) => boolean, curN: (d: NetNode) => boolean, coreLit: (i: number) => boolean, color: string, activeLayer: number | null) {
  const svg = d3.select(el);
  // ring (not fill) the layer being computed now, so it reads without a background
  const ringed = (d: NetNode) => activeLayer != null && d.layer === activeLayer && !litN(d);
  svg.selectAll<SVGCircleElement, NetNode>("circle.neuron")
    .attr("fill", color)
    .attr("fill-opacity", (d) => (litN(d) ? 0.95 : 0.12))
    .attr("stroke-opacity", (d) => (litN(d) ? 1 : ringed(d) ? 0.95 : 0.3))
    .attr("stroke-width", (d) => (ringed(d) ? 2.2 : 1.2))
    .attr("r", (d) => (curN(d) ? 9.5 : ringed(d) ? 8.2 : 7));
  svg.selectAll<SVGRectElement, Core>("rect.core").attr("fill-opacity", (d) => (coreLit(d.i) ? 0.95 : 0.14));
}

/* =====================================================================
   Hero — the same small network on two machines, auto-looping (d3)
   ===================================================================== */

function HeroRace({ h, reduce }: { h: ReturnType<typeof useAcademy>["t"]["hw"]; reduce: boolean }) {
  const cpuRef = useRef<SVGSVGElement | null>(null);
  const gpuRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const cpu = cpuRef.current;
    const gpu = gpuRef.current;
    if (!cpu || !gpu) return;
    const layers = netLayers(5);
    const st = netStats(5);
    drawMachine(cpu, layers, CPU_COLOR, CPU_CORES, CPU_CORE_COLS, h.raceCoresWord);
    drawMachine(gpu, layers, GPU_COLOR, GPU_CORES, GPU_CORE_COLS, h.raceCoresWord);
    if (reduce) {
      paintMachine(cpu, () => true, () => false, () => false, CPU_COLOR, null);
      paintMachine(gpu, () => true, () => false, () => false, GPU_COLOR, null);
      return;
    }
    const cycle = 6400;
    const timer = d3.timer((elapsed) => {
      const t = elapsed % cycle;
      const cd = Math.min(st.neurons, Math.floor(t / CPU_STEP_MS));
      const gl = Math.min(st.computedLayers, Math.floor(t / GPU_STEP_MS));
      const cpuLayer = cd < st.neurons ? neuronInfo(cd, layers)?.layer ?? null : null;
      const gpuLayer = gl < st.computedLayers ? gl + 1 : null;
      paintMachine(cpu, (d) => d.isInput || d.order < cd, (d) => !d.isInput && d.order === cd && cd < st.neurons, (i) => cd < st.neurons && i === cd % CPU_CORES, CPU_COLOR, cpuLayer);
      paintMachine(gpu, (d) => d.isInput || d.layer <= gl, () => false, gpuCores(gl, layers, st.computedLayers), GPU_COLOR, gpuLayer);
    });
    return () => timer.stop();
  }, [h, reduce]);

  const machines = [
    { ref: cpuRef, name: h.heroCpu, tag: h.heroCpuTag, color: CPU_COLOR },
    { ref: gpuRef, name: h.heroGpu, tag: h.heroGpuTag, color: GPU_COLOR },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
      {machines.map((m, i) => (
        <div key={i} style={{ flex: "1 1 240px", minWidth: 210, maxWidth: 320 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 4 }}>
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: 2, background: m.color, flex: "0 0 auto" }} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{m.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--muted)" }}>· {m.tag}</span>
          </div>
          <svg ref={m.ref} width="100%" style={{ display: "block", overflow: "visible" }} aria-hidden />
        </div>
      ))}
    </div>
  );
}

/* =====================================================================
   Interactive 1 — run the network, layer by layer (live CPU vs GPU)
   ===================================================================== */

function NetworkRace({ h, reduce }: { h: ReturnType<typeof useAcademy>["t"]["hw"]; reduce: boolean }) {
  const [wIdx, setWIdx] = useState(2); //  width 6
  const width = RACE_WIDTHS[wIdx];
  const st = netStats(width);
  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");
  const [cpuDone, setCpuDone] = useState(0);
  const [gpuDone, setGpuDone] = useState(0);
  const cpuRef = useRef<SVGSVGElement | null>(null);
  const gpuRef = useRef<SVGSVGElement | null>(null);
  const timerRef = useRef<d3.Timer | null>(null);
  const animSpeedup = useCountUp(st.speedup, reduce);

  const paintIdle = () => {
    if (cpuRef.current) paintMachine(cpuRef.current, (d) => d.isInput, () => false, () => false, CPU_COLOR, null);
    if (gpuRef.current) paintMachine(gpuRef.current, (d) => d.isInput, () => false, () => false, GPU_COLOR, null);
  };

  useEffect(() => {
    if (timerRef.current) { timerRef.current.stop(); timerRef.current = null; }
    const layers = netLayers(RACE_WIDTHS[wIdx]);
    if (cpuRef.current) drawMachine(cpuRef.current, layers, CPU_COLOR, CPU_CORES, CPU_CORE_COLS, h.raceCoresWord);
    if (gpuRef.current) drawMachine(gpuRef.current, layers, GPU_COLOR, GPU_CORES, GPU_CORE_COLS, h.raceCoresWord);
    setPhase("idle"); setCpuDone(0); setGpuDone(0);
    paintIdle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wIdx, h]);

  useEffect(() => () => { if (timerRef.current) timerRef.current.stop(); }, []);

  function run() {
    if (timerRef.current) { timerRef.current.stop(); timerRef.current = null; }
    const s = netStats(RACE_WIDTHS[wIdx]);
    const layers = s.layers;
    if (reduce) {
      setPhase("done"); setCpuDone(s.neurons); setGpuDone(s.computedLayers);
      if (cpuRef.current) paintMachine(cpuRef.current, () => true, () => false, () => false, CPU_COLOR, null);
      if (gpuRef.current) paintMachine(gpuRef.current, () => true, () => false, () => false, GPU_COLOR, null);
      return;
    }
    setPhase("run"); setCpuDone(0); setGpuDone(0);
    let lastCd = -1, lastGl = -1;
    timerRef.current = d3.timer((elapsed) => {
      const cd = Math.min(s.neurons, Math.floor(elapsed / CPU_STEP_MS));
      const gl = Math.min(s.computedLayers, Math.floor(elapsed / GPU_STEP_MS));
      const cpuLayer = cd < s.neurons ? neuronInfo(cd, layers)?.layer ?? null : null;
      const gpuLayer = gl < s.computedLayers ? gl + 1 : null;
      if (cpuRef.current) paintMachine(cpuRef.current, (d) => d.isInput || d.order < cd, (d) => !d.isInput && d.order === cd && cd < s.neurons, (i) => cd < s.neurons && i === cd % CPU_CORES, CPU_COLOR, cpuLayer);
      if (gpuRef.current) paintMachine(gpuRef.current, (d) => d.isInput || d.layer <= gl, () => false, gpuCores(gl, layers, s.computedLayers), GPU_COLOR, gpuLayer);
      if (cd !== lastCd) { lastCd = cd; setCpuDone(cd); }
      if (gl !== lastGl) { lastGl = gl; setGpuDone(gl); }
      if (cd >= s.neurons && gl >= s.computedLayers) { if (timerRef.current) timerRef.current.stop(); timerRef.current = null; setPhase("done"); }
    });
  }

  function reset() {
    if (timerRef.current) { timerRef.current.stop(); timerRef.current = null; }
    setPhase("idle"); setCpuDone(0); setGpuDone(0);
    paintIdle();
  }

  const status = (done: number, total: number, word: string) =>
    phase === "idle" ? h.raceReadyWord : done >= total ? `✓ ${h.raceCompleteWord} · ${total} ${h.raceStepsLabel}` : `${word} ${done} / ${total}`;

  const gpuActive = phase === "run" && gpuDone < st.computedLayers ? st.layers[gpuDone + 1] : width;
  const machines = [
    { ref: cpuRef, name: h.raceCpuName, tag: h.raceCpuChip, color: CPU_COLOR, done: cpuDone, total: st.neurons, word: h.raceNeuronWord, parallel: h.raceOneAtATime },
    { ref: gpuRef, name: h.raceGpuName, tag: h.raceGpuChip, color: GPU_COLOR, done: gpuDone, total: st.computedLayers, word: h.raceLayerWord, parallel: `${gpuActive} ${h.raceCoresWord} ${h.raceAtOnce}` },
  ];

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{h.raceLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{h.raceTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(h.raceBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        {/* the dot product every neuron computes */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <span style={{ fontSize: 13.5, color: "var(--muted)" }}>{rich(h.raceDotLabel)}</span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 11px" }}>{DOT_FORMULA}</span>
        </div>

        {/* the two machines, racing */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(14px,2vw,20px)" }}>
          {machines.map((m, i) => {
            const done = m.done >= m.total && phase !== "idle";
            const pct = Math.round((m.done / m.total) * 100);
            return (
              <div key={i} style={{ flex: "1 1 250px", minWidth: 230, border: `1px solid ${done ? m.color : "var(--border)"}`, borderRadius: 14, padding: "13px 14px 15px", background: "var(--surface)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, background: m.color, flex: "0 0 auto" }} />
                  <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: "var(--fg)" }}>{m.name}</span>
                  {done ? (
                    <span style={{ marginLeft: "auto", whiteSpace: "nowrap", fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: m.color, border: `1px solid ${m.color}`, borderRadius: 999, padding: "1.5px 9px" }}>✓ {h.raceCompleteWord}</span>
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--muted)", marginLeft: "auto" }}>{m.tag}</span>
                  )}
                </div>
                <div style={{ margin: "8px 0 2px" }}>
                  <svg ref={m.ref} width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label={m.name} />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11.5, display: "flex", gap: 6, alignItems: "baseline", whiteSpace: "nowrap" }}>
                  <span style={{ color: m.color, fontWeight: 700 }}>{DOT_SHORT}</span>
                  <span style={{ color: "var(--muted)" }}>· {m.parallel}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 7 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: done ? m.color : "var(--muted)", fontWeight: done ? 700 : 400 }}>{status(m.done, m.total, m.word)}</span>
                </div>
                <div aria-hidden style={{ marginTop: 6, height: 5, borderRadius: 3, background: "var(--hair)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: m.color, borderRadius: 3, transition: reduce ? undefined : "width .1s linear" }} />
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, fontFamily: MONO }}>{h.raceCellNote}</p>

        {/* controls + readouts */}
        <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: "clamp(18px,3vw,30px)", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px", minWidth: 230, display: "flex", flexDirection: "column", gap: 14 }}>
            <Slider label={h.raceSizeLabel} value={wIdx} min={0} max={RACE_WIDTHS.length - 1} step={1} onChange={(v) => setWIdx(v)} valueText={String(width)} accent={GPU_COLOR} />
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <button type="button" onClick={run} className="u-hover-opacity" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontSize: 14, fontWeight: 600, padding: "10px 16px", borderRadius: 10, border: 0, background: "var(--fg)", color: "var(--accent-ink)" }}>▸ {h.raceRun}</button>
              <button type="button" onClick={reset} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontSize: 14, fontWeight: 600, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }}>{h.raceReset}</button>
            </div>
          </div>

          <div style={{ flex: "1 1 220px", minWidth: 220, display: "flex", gap: "clamp(14px,3vw,24px)", flexWrap: "wrap", alignItems: "flex-end" }}>
            <MiniStat label={h.raceNeuronsLabel} value={fmtInt(st.neurons)} />
            <MiniStat label={h.raceParamsLabel} value={fmtInt(st.params)} />
            <MiniStat label={h.raceSpeedupLabel} value={`${fmtInt(animSpeedup)}×`} color={FAST_COLOR} big />
          </div>
        </div>
      </div>

      <div style={{ padding: "0 clamp(20px, 2.5vw, 28px) clamp(20px, 2.5vw, 28px)" }}>
        <p style={{ margin: 0, fontSize: 15.5, color: "var(--fg)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(h.raceWinnerNote)}</p>
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(h.raceNote)}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: big ? 30 : 24, fontWeight: 700, letterSpacing: "-.04em", color: color ?? "var(--fg)", marginTop: 2 }}>{value}</div>
    </div>
  );
}

/* =====================================================================
   Interactive 2 — inside a rack (NVLink vs InfiniBand)
   ===================================================================== */

function RackTour({ h, reduce }: { h: ReturnType<typeof useAcademy>["t"]["hw"]; reduce: boolean }) {
  const [pathIdx, setPathIdx] = useState(0);
  const path = RACK_PATHS[pathIdx];
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    return drawRack(ref.current, { pathIdx, reduce });
  }, [pathIdx, reduce]);

  const linkName = path.link === "nvlink" ? h.rackNvlink : h.rackInfiniband;
  const linkColor = path.link === "nvlink" ? FAST_COLOR : SLOW_COLOR;

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{h.rackLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{h.rackTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(h.rackBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".06em", color: "var(--muted)" }}>{h.rackHint}</div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 10 }}>
          {h.rackPaths.map((label, i) => {
            const active = i === pathIdx;
            return (
              <button key={i} type="button" onClick={() => setPathIdx(i)} aria-pressed={active} className={active ? undefined : "u-hover-fg-border"} style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13, padding: "8px 13px", borderRadius: 10, border: active ? "1px solid var(--fg)" : "1px solid var(--border)", background: active ? "var(--fg)" : "var(--bg)", color: active ? "var(--accent-ink)" : "var(--fg)" }}>{label}</button>
            );
          })}
        </div>

        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 14, padding: "14px 12px", background: "var(--surface)" }}>
          <svg ref={ref} width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label={h.rackTitle} />
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: "clamp(14px,3vw,28px)", flexWrap: "wrap" }}>
          <RackStat label={h.rackLinkLabel} value={linkName} color={linkColor} />
          <RackStat label={h.rackBwLabel} value={`${fmtInt(path.bwGBs)} GB/s`} />
          <RackStat label={h.rackTimeLabel} value={`${path.relTime}×`} color={path.relTime > 1 ? SLOW_COLOR : FAST_COLOR} />
          <RackStat label={h.rackHopsLabel} value={String(path.hops)} />
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 15.5, color: "var(--fg)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(h.rackNote)}</p>
      </div>
    </div>
  );
}

function RackStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 700, letterSpacing: "-.03em", color: color ?? "var(--fg)", marginTop: 2 }}>{value}</div>
    </div>
  );
}

/** Draw the rack topology and animate a tensor along the selected path. */
function drawRack(el: SVGSVGElement | null, opts: { pathIdx: number; reduce: boolean }): () => void {
  if (!el) return () => {};
  const { pathIdx, reduce } = opts;
  const path = RACK_PATHS[pathIdx];
  const W = 620;
  const H = 300;
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const RW = 268; //           rack frame width
  const rackGap = 46;
  const rackX = (r: number) => 22 + r * (RW + rackGap);
  const NH = 74; //            node height
  const nodeX = (r: number) => rackX(r) + 14;
  const NW = RW - 28; //       node width
  const nodeY = (nd: number) => 20 + nd * (NH + 16);
  const gpuCenter = (r: number, nd: number, g: number) => {
    const innerL = nodeX(r) + 16;
    const innerW = NW - 32;
    const step = innerW / GPUS_PER_NODE;
    return { x: innerL + step * g + step / 2, y: nodeY(nd) + NH / 2 + 4 };
  };
  const ibY = 214; //          rack InfiniBand switch row
  const ibCenter = (r: number) => ({ x: rackX(r) + RW / 2, y: ibY });
  const spine = { x: (rackX(0) + RW / 2 + rackX(1) + RW / 2) / 2, y: 264 };
  const nodePort = (r: number, nd: number) => ({ x: nodeX(r) + NW / 2, y: nodeY(nd) + NH });

  // rack frames + labels
  for (let r = 0; r < RACKS; r++) {
    svg.append("rect").attr("x", rackX(r)).attr("y", 12).attr("width", RW).attr("height", 218).attr("rx", 12)
      .attr("fill", "none").attr("stroke", "var(--border)").attr("stroke-width", 1.2);
    svg.append("text").attr("x", rackX(r) + RW / 2).attr("y", ibY + 22).attr("text-anchor", "middle")
      .style("font-family", MONO).style("font-size", "9.5px").style("fill", "var(--muted)").text(`rack ${r + 1}`);
  }

  // NVLink lines within each node (draw first, under the GPUs)
  for (let r = 0; r < RACKS; r++) for (let nd = 0; nd < NODES_PER_RACK; nd++) {
    const a = gpuCenter(r, nd, 0);
    const b = gpuCenter(r, nd, GPUS_PER_NODE - 1);
    svg.append("line").attr("x1", a.x).attr("y1", a.y).attr("x2", b.x).attr("y2", b.y)
      .attr("stroke", FAST_COLOR).attr("stroke-width", 2).attr("stroke-opacity", 0.35);
  }

  // nodes + GPUs
  for (let r = 0; r < RACKS; r++) for (let nd = 0; nd < NODES_PER_RACK; nd++) {
    svg.append("rect").attr("x", nodeX(r)).attr("y", nodeY(nd)).attr("width", NW).attr("height", NH).attr("rx", 9)
      .attr("fill", "var(--bg)").attr("stroke", "var(--hair)").attr("stroke-width", 1);
    svg.append("text").attr("x", nodeX(r) + 8).attr("y", nodeY(nd) + 13)
      .style("font-family", MONO).style("font-size", "8.5px").style("fill", "var(--muted)").text(`node ${nd + 1}`);
    // node → rack IB switch stem
    const port = nodePort(r, nd);
    const ib = ibCenter(r);
    svg.append("line").attr("x1", port.x).attr("y1", port.y).attr("x2", ib.x).attr("y2", ib.y)
      .attr("stroke", "var(--border)").attr("stroke-width", 1).attr("stroke-opacity", 0.7);
    for (let g = 0; g < GPUS_PER_NODE; g++) {
      const c = gpuCenter(r, nd, g);
      const isEndpoint = (path.from.rack === r && path.from.node === nd && path.from.gpu === g) || (path.to.rack === r && path.to.node === nd && path.to.gpu === g);
      svg.append("rect").attr("x", c.x - 14).attr("y", c.y - 15).attr("width", 28).attr("height", 30).attr("rx", 5)
        .attr("fill", isEndpoint ? "color-mix(in srgb, var(--tok-num) 26%, var(--bg))" : "var(--surface)")
        .attr("stroke", isEndpoint ? GPU_COLOR : "var(--border)").attr("stroke-width", isEndpoint ? 2 : 1);
      svg.append("text").attr("x", c.x).attr("y", c.y + 3).attr("text-anchor", "middle")
        .style("font-family", MONO).style("font-size", "8px").style("fill", isEndpoint ? "var(--fg)" : "var(--muted)").text("GPU");
    }
  }

  // rack IB switches + spine
  for (let r = 0; r < RACKS; r++) {
    const ib = ibCenter(r);
    svg.append("rect").attr("x", ib.x - 26).attr("y", ib.y - 10).attr("width", 52).attr("height", 20).attr("rx", 5)
      .attr("fill", "var(--bg)").attr("stroke", "var(--border)").attr("stroke-width", 1);
    svg.append("text").attr("x", ib.x).attr("y", ib.y + 4).attr("text-anchor", "middle")
      .style("font-family", MONO).style("font-size", "8px").style("fill", "var(--muted)").text("IB");
    svg.append("line").attr("x1", ib.x).attr("y1", ib.y + 10).attr("x2", spine.x).attr("y2", spine.y)
      .attr("stroke", "var(--border)").attr("stroke-width", 1).attr("stroke-opacity", 0.7);
  }
  svg.append("rect").attr("x", spine.x - 30).attr("y", spine.y - 9).attr("width", 60).attr("height", 18).attr("rx", 5)
    .attr("fill", "var(--bg)").attr("stroke", "var(--border)").attr("stroke-width", 1);
  svg.append("text").attr("x", spine.x).attr("y", spine.y + 4).attr("text-anchor", "middle")
    .style("font-family", MONO).style("font-size", "8px").style("fill", "var(--muted)").text("spine");

  // build the path's waypoints
  const A = path.from;
  const B = path.to;
  const pts: { x: number; y: number }[] = [gpuCenter(A.rack, A.node, A.gpu)];
  if (path.link === "nvlink") {
    pts.push(gpuCenter(B.rack, B.node, B.gpu));
  } else {
    pts.push(nodePort(A.rack, A.node));
    pts.push(ibCenter(A.rack));
    if (A.rack !== B.rack) {
      pts.push(spine);
      pts.push(ibCenter(B.rack));
    }
    pts.push(nodePort(B.rack, B.node));
    pts.push(gpuCenter(B.rack, B.node, B.gpu));
  }

  const pathColor = path.link === "nvlink" ? FAST_COLOR : SLOW_COLOR;
  const lineGen = d3.line<{ x: number; y: number }>().x((d) => d.x).y((d) => d.y);
  svg.append("path").attr("d", lineGen(pts)).attr("fill", "none").attr("stroke", pathColor).attr("stroke-width", 2.5).attr("stroke-opacity", 0.85).attr("stroke-linecap", "round").attr("stroke-linejoin", "round");

  // segment lengths for constant-speed travel
  const segLen = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y);
  const dot = svg.append("circle").attr("r", 5).attr("fill", pathColor).attr("cx", pts[0].x).attr("cy", pts[0].y);

  if (reduce) return () => { svg.selectAll("*").interrupt(); };

  let cancelled = false;
  const speed = 0.16; //  px per ms → longer path takes proportionally longer
  const travel = () => {
    if (cancelled) return;
    dot.attr("cx", pts[0].x).attr("cy", pts[0].y).attr("fill-opacity", 1);
    let chain = dot.transition().duration(120).attr("fill-opacity", 1);
    for (let i = 1; i < pts.length; i++) {
      const dur = Math.max(90, segLen(pts[i - 1], pts[i]) / speed);
      chain = chain.transition().duration(dur).ease(d3.easeLinear).attr("cx", pts[i].x).attr("cy", pts[i].y);
    }
    chain.transition().duration(260).attr("fill-opacity", 0).on("end", () => { if (!cancelled) travel(); });
  };
  travel();
  return () => { cancelled = true; svg.selectAll("*").interrupt(); };
}

/* =====================================================================
   Interactive 3 — split ONE next-word network across 2 GPUs
   ===================================================================== */

function ModelSplit({ h, reduce }: { h: ReturnType<typeof useAcademy>["t"]["hw"]; reduce: boolean }) {
  const [key, setKey] = useState<SplitKey>("data");
  const strat = h.splitStrategies.find((s) => s.key === key) ?? h.splitStrategies[0];
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    return drawSplit(ref.current, { key, reduce });
  }, [key, reduce]);

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{h.splitLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{h.splitTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(h.splitBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {h.splitStrategies.map((s) => {
            const active = s.key === key;
            return (
              <button key={s.key} type="button" onClick={() => setKey(s.key as SplitKey)} aria-pressed={active} className={active ? undefined : "u-hover-fg-border"} style={{ appearance: "none", cursor: "pointer", font: "inherit", textAlign: "left", padding: "10px 14px", borderRadius: 11, border: active ? "1px solid var(--fg)" : "1px solid var(--border)", background: active ? "var(--fg)" : "var(--bg)", color: active ? "var(--accent-ink)" : "var(--fg)" }}>
                <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 14.5 }}>{s.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, opacity: 0.85, marginTop: 2 }}>{s.tag}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 14, padding: "14px 12px 12px", background: "var(--surface)" }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".08em", color: "var(--muted)", textAlign: "center", marginBottom: 8 }}>{h.splitNetLabel}</div>
          <svg ref={ref} width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label={strat.label} />
        </div>

        {/* the direct answer: whole network, or a piece? */}
        <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 15px", background: "var(--surface)" }}>
          <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".06em", color: "var(--muted)" }}>{h.splitOwnLabel}</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)" }}>{rich(strat.own)}</span>
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 15.5, color: "var(--fg)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(strat.desc)}</p>
        <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 10, padding: "9px 13px", background: "var(--surface)" }}>
          <span aria-hidden style={{ width: 9, height: 9, borderRadius: 2, background: SLOW_COLOR, flex: "0 0 auto" }} />
          <span style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{h.splitCommLabel}</span>
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 13.5, color: "var(--fg)" }}>{strat.comm}</span>
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(h.splitNote)}</p>
      </div>
    </div>
  );
}

const SPLIT_GPU_COLORS = [GPU_COLOR, "var(--tok-word)"]; //  GPU 1 blue, GPU 2 green

/** Two GPU boxes, each drawing the SAME next-word network — solid where that GPU
 *  owns the neuron, faint where it lives on the other GPU. Data parallel makes
 *  both boxes fully solid (a whole copy each); tensor splits neurons within every
 *  layer; pipeline splits the layers. An arrow shows what they must exchange. */
function drawSplit(el: SVGSVGElement | null, opts: { key: SplitKey; reduce: boolean }): () => void {
  if (!el) return () => {};
  const { key, reduce } = opts;
  const W = 620, H = 190;
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const boxW = 278, gap = 40, boxY = 8, boxH = 172;
  const boxX = (g: number) => 12 + g * (boxW + gap);

  // arrowhead markers for the communication link
  const defs = svg.append("defs");
  (["start", "end"] as const).forEach((pos) => {
    defs.append("marker").attr("id", `split-${pos}`).attr("viewBox", "0 0 10 10").attr("refX", pos === "end" ? 8 : 2).attr("refY", 5)
      .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", pos === "end" ? "auto" : "auto-start-reverse")
      .append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", SLOW_COLOR);
  });

  // the communication link across the gap
  const midY = boxY + boxH / 2;
  const link = svg.append("line").attr("x1", boxX(0) + boxW - 2).attr("y1", midY).attr("x2", boxX(1) + 2).attr("y2", midY)
    .attr("stroke", SLOW_COLOR).attr("stroke-width", 2.5).attr("stroke-opacity", 0.9).attr("marker-end", "url(#split-end)");
  if (key !== "pipeline") link.attr("marker-start", "url(#split-start)"); //  data + tensor exchange both ways

  const layers = SPLIT_LAYERS;
  for (let g = 0; g < SPLIT_GPU_COUNT; g++) {
    const color = SPLIT_GPU_COLORS[g];
    const bx = boxX(g);
    svg.append("rect").attr("x", bx).attr("y", boxY).attr("width", boxW).attr("height", boxH).attr("rx", 11)
      .attr("fill", "var(--bg)").attr("stroke", color).attr("stroke-opacity", 0.45).attr("stroke-width", 1.3);
    svg.append("text").attr("x", bx + 12).attr("y", boxY + 16)
      .style("font-family", MONO).style("font-size", "10px").style("font-weight", 700).style("fill", color).text(`GPU ${g + 1}`);

    // the network, offset into this box
    const innerX = bx + 14, innerY = boxY + 24, innerW = boxW - 28, innerH = boxH - 38;
    const { nodes, edges } = buildNet(layers, innerW, innerH, 16, 12);
    const nx = (n: NetNode) => innerX + n.x;
    const ny = (n: NetNode) => innerY + n.y;
    const owns = (n: NetNode) => ownsNode(key, g, n.layer, n.idx, layers);

    svg.append("g").selectAll("line").data(edges).join("line")
      .attr("x1", (d) => nx(d.a)).attr("y1", (d) => ny(d.a)).attr("x2", (d) => nx(d.b)).attr("y2", (d) => ny(d.b))
      .attr("stroke", (d) => (owns(d.a) && owns(d.b) ? color : "var(--border)"))
      .attr("stroke-width", (d) => (owns(d.a) && owns(d.b) ? 1 : 0.6))
      .attr("stroke-opacity", (d) => (owns(d.a) && owns(d.b) ? 0.5 : 0.18));

    const circ = svg.append("g").selectAll<SVGCircleElement, NetNode>("circle").data(nodes).join("circle")
      .attr("cx", nx).attr("cy", ny).attr("r", 6)
      .attr("fill", color)
      .attr("stroke", (d) => (owns(d) ? color : "var(--muted)"))
      .attr("stroke-opacity", (d) => (owns(d) ? 1 : 0.3)).attr("stroke-width", 1.1)
      .attr("fill-opacity", (d) => (owns(d) ? 0.92 : 0.07));

    if (!reduce) {
      circ.filter((d) => owns(d)).attr("fill-opacity", 0.07)
        .transition().delay((d) => (key === "pipeline" ? d.layer * 120 : key === "tensor" ? g * 90 : 0) + d.idx * 22).duration(240)
        .attr("fill-opacity", 0.92);
    }
  }

  return () => { svg.selectAll("*").interrupt(); };
}

/* =====================================================================
   Shared small components (mirrors of the Neural lesson's primitives)
   ===================================================================== */

function Slider({ label, value, min, max, step, onChange, accent, valueText }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent?: string; valueText: string }) {
  return (
    <label style={{ display: "block", fontSize: 13.5 }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "var(--fg)" }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <b style={{ fontFamily: MONO, color: "var(--fg)" }}>{valueText}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", marginTop: 6, accentColor: accent ?? "var(--fg)" }} />
    </label>
  );
}

function ExplainBack({ q, a, reveal, hide, label, reduce }: { q: string; a: string; reveal: string; hide: string; label: string; reduce: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Cap>{label}</Cap>
      <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, maxWidth: "54ch", textWrap: "balance" }}>{q}</div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>{open ? hide : reveal}</button>
      {open && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, maxWidth: "74ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{a}</p>}
    </>
  );
}

function Deeper({ title, body, reduce }: { title: string; body: string[]; reduce: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ appearance: "none", border: 0, background: "transparent", font: "inherit", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, color: "var(--fg)", padding: 0 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: "-.03em" }}>{title}</span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: reduce ? undefined : "rise .16s ease both" }}>
          {body.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? "16px 0 0" : 0, fontSize: 16, lineHeight: 1.68, color: "var(--muted)", maxWidth: "74ch", textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function MarkComplete({ markLabel, doneLabel }: { markLabel: string; doneLabel: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" onClick={() => setDone((v) => !v)} aria-pressed={done} className="u-hover-opacity" style={{ appearance: "none", border: 0, font: "inherit", cursor: "pointer", fontSize: 15.5, fontWeight: 600, color: "var(--accent-ink)", background: "var(--fg)", padding: "13px 22px", borderRadius: 11 }}>{done ? doneLabel : markLabel}</button>;
}
