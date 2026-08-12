"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  OPTS,
  ADAMW,
  optByKey,
  adamMemory,
  BYTES,
  stateSavedPct,
  stepsToTargetK,
  curvePoints,
  lossAt,
  fmtGB,
  LOSS_START,
  LOSS_TARGET,
  MAX_STEPS_K,
  type OptKey,
} from "../lib/matrix-optimizers";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so design tokens + theme flips resolve live.
 * viewBox ~560 wide so label text clears the 12px floor on phones.
 * ======================================================================== */

/* --- Node 1: what AdamW stores per weight (five labelled rows) ----------- */

function drawMemRows(
  el: SVGSVGElement,
  o: { paramsB: number; rowLabels: string[]; taxLabel: string; reduce: boolean },
) {
  const W = 560;
  const rowH = 32;
  const gap = 16;
  const top = 22;
  const labelX = 182;
  const barX = 196;
  const barMax = 268; // px for the widest (4-byte) row
  const pxPerByte = barMax / 4;
  const valX = W - 4;

  const rows = [
    { label: o.rowLabels[0], bytes: BYTES.weights, tax: false },
    { label: o.rowLabels[1], bytes: BYTES.grads, tax: false },
    { label: o.rowLabels[2], bytes: BYTES.master, tax: false },
    { label: o.rowLabels[3], bytes: BYTES.momentum, tax: true },
    { label: o.rowLabels[4], bytes: BYTES.variance, tax: true },
  ];
  const H = top + rows.length * (rowH + gap) - gap + 14;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  // green enclosure behind the two optimizer-state rows (momentum + variance)
  const firstTax = rows.findIndex((r) => r.tax);
  const encY = top + firstTax * (rowH + gap) - 7;
  const encH = 2 * (rowH + gap) - gap + 14;
  svg.append("rect").attr("x", 4).attr("y", encY).attr("width", W - 8).attr("height", encH)
    .attr("rx", 10).style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 1).style("stroke-dasharray", "4 4");
  svg.append("text").attr("x", barX).attr("y", encY - 6).style("fill", "var(--signal-fg)")
    .style("font-family", MONO).style("font-size", "23px").text(o.taxLabel);

  rows.forEach((r, i) => {
    const y = top + i * (rowH + gap) + (r.tax ? 8 : 0);
    const w = r.bytes * pxPerByte;
    const gb = o.paramsB * r.bytes;
    // left label
    svg.append("text").attr("x", labelX).attr("y", y + rowH / 2 + 8).attr("text-anchor", "end")
      .style("fill", r.tax ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "23px")
      .style("font-weight", r.tax ? 600 : 400).text(r.label);
    // track
    svg.append("rect").attr("x", barX).attr("y", y).attr("width", barMax).attr("height", rowH).attr("rx", 7)
      .style("fill", "var(--surface)").style("stroke", "var(--border)");
    // fill
    const bar = svg.append("rect").attr("x", barX).attr("y", y).attr("height", rowH).attr("rx", 7)
      .style("fill", r.tax ? "var(--signal)" : "var(--tok-space)").style("fill-opacity", r.tax ? 1 : 0.55);
    if (dur) bar.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", w);
    else bar.attr("width", w);
    // value
    svg.append("text").attr("x", valX).attr("y", y + rowH / 2 + 8).attr("text-anchor", "end")
      .style("fill", r.tax ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "23px")
      .style("font-weight", r.tax ? 600 : 400).text(fmtGB(gb));
  });
}

/* --- Node 2: optimizer-state bytes per weight (four bars) ---------------- */

function drawStateBars(
  el: SVGSVGElement,
  o: { selected: OptKey; names: string[]; suffix: string; reduce: boolean },
) {
  const W = 560;
  const rowH = 36;
  const gap = 22;
  const top = 16;
  const labelX = 150;
  const barX = 164;
  const barMax = 250; // px for AdamW's 8 bytes (leaves room for the value)
  const pxPerByte = barMax / ADAMW.bytesPerWeight;
  const valX = W - 4;
  const H = top + OPTS.length * (rowH + gap) - gap + 12;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  OPTS.forEach((opt, i) => {
    const y = top + i * (rowH + gap);
    const sel = opt.key === o.selected;
    const w = Math.max(4, opt.bytesPerWeight * pxPerByte);
    svg.append("text").attr("x", labelX).attr("y", y + rowH / 2 + 8).attr("text-anchor", "end")
      .style("fill", sel ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "23px")
      .style("font-weight", sel ? 700 : 400).text(o.names[i]);
    svg.append("rect").attr("x", barX).attr("y", y).attr("width", barMax).attr("height", rowH).attr("rx", 8)
      .style("fill", "var(--surface)").style("stroke", "var(--border)");
    const bar = svg.append("rect").attr("x", barX).attr("y", y).attr("height", rowH).attr("rx", 8)
      .style("fill", sel ? "var(--signal)" : "var(--tok-space)").style("fill-opacity", sel ? 1 : 0.5)
      .style("stroke", sel ? "var(--fg)" : "none").style("stroke-width", sel ? 1.5 : 0);
    if (dur) bar.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", w);
    else bar.attr("width", w);
    const label = opt.bytesPerWeight >= 1 ? `${opt.bytesPerWeight}` : `~${opt.bytesPerWeight}`;
    svg.append("text").attr("x", valX).attr("y", y + rowH / 2 + 8).attr("text-anchor", "end")
      .style("fill", sel ? "var(--signal-fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "23px")
      .style("font-weight", sel ? 700 : 400).text(`${label} ${o.suffix}`);
  });
}

/* --- Node 3: loss-vs-steps convergence curves --------------------------- */

function drawConvergence(
  el: SVGSVGElement,
  o: {
    selected: OptKey;
    reduce: boolean;
    xLabel: string;
    yLabel: string;
    targetLabel: string;
    adamwLabel: string;
    selName: string;
  },
) {
  const W = 560;
  const H = 340;
  const m = { top: 30, right: 24, bottom: 52, left: 58 };
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const x = d3.scaleLinear().domain([0, MAX_STEPS_K]).range([m.left, W - m.right]);
  const y = d3.scaleLinear().domain([1.7, LOSS_START + 0.05]).range([H - m.bottom, m.top]);
  const sel = optByKey(o.selected);
  const isAdamw = o.selected === "adamw";

  const line = d3.line<[number, number]>().x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX);

  // grid + y ticks (loss)
  [2, 3, 4].forEach((lv) => {
    svg.append("line").attr("x1", m.left).attr("x2", W - m.right).attr("y1", y(lv)).attr("y2", y(lv))
      .style("stroke", "var(--hair)").style("stroke-width", 1);
    svg.append("text").attr("x", m.left - 8).attr("y", y(lv) + 7).attr("text-anchor", "end")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "23px").text(String(lv));
  });
  // x ticks (k steps)
  [0, 70, 140].forEach((s) => {
    svg.append("text").attr("x", x(s)).attr("y", H - m.bottom + 26).attr("text-anchor", "middle")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "23px").text(`${s}k`);
  });
  // axis titles
  svg.append("text").attr("x", (m.left + W - m.right) / 2).attr("y", H - 10).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "23px").text(o.xLabel);
  svg.append("text").attr("transform", `translate(18, ${(m.top + H - m.bottom) / 2}) rotate(-90)`).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "23px").text(o.yLabel);

  // target-loss line
  svg.append("line").attr("x1", m.left).attr("x2", W - m.right).attr("y1", y(LOSS_TARGET)).attr("y2", y(LOSS_TARGET))
    .style("stroke", "var(--fg)").style("stroke-width", 1.2).style("stroke-dasharray", "3 4").style("opacity", 0.55);
  svg.append("text").attr("x", W - m.right).attr("y", y(LOSS_TARGET) - 8).attr("text-anchor", "end")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "23px").style("opacity", 0.7).text(o.targetLabel);

  const dur = o.reduce ? 0 : 700;
  const drawCurve = (opt: typeof ADAMW, color: string, dash: string | null, width: number) => {
    const pts = curvePoints(opt);
    const path = svg.append("path").datum(pts).attr("fill", "none").attr("d", line)
      .style("stroke", color).style("stroke-width", width);
    if (dash) path.style("stroke-dasharray", dash);
    if (dur) {
      const len = (path.node() as SVGPathElement).getTotalLength();
      path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len)
        .transition().duration(dur).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0)
        .on("end", function () { if (dash) d3.select(this).attr("stroke-dasharray", dash); else d3.select(this).attr("stroke-dasharray", null); });
    }
  };

  // AdamW baseline (grey) — always shown for reference
  drawCurve(ADAMW, "var(--tok-space)", "6 5", 2);
  // selected optimizer (green) — draw over the top
  drawCurve(sel, "var(--signal)", null, 2.6);

  // crossing markers at the target line
  const marker = (opt: typeof ADAMW, color: string, above: boolean) => {
    const sk = stepsToTargetK(opt);
    if (lossAt(opt, MAX_STEPS_K) > LOSS_TARGET) return; // never reaches target
    const cx = x(sk);
    const cy = y(LOSS_TARGET);
    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 4.5).style("fill", color).style("stroke", "var(--bg)").style("stroke-width", 1.5);
    svg.append("text").attr("x", cx).attr("y", above ? cy - 13 : cy + 30).attr("text-anchor", "middle")
      .style("fill", color).style("font-family", MONO).style("font-size", "24px").style("font-weight", 700)
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "3px").style("stroke-linejoin", "round")
      .text(`${sk}k`);
  };
  marker(ADAMW, "var(--tok-space)", false);
  if (!isAdamw) marker(sel, "var(--signal)", true);

  // legend
  const lg = (lx: number, color: string, dash: boolean, text: string) => {
    svg.append("line").attr("x1", lx).attr("x2", lx + 24).attr("y1", m.top - 14).attr("y2", m.top - 14)
      .style("stroke", color).style("stroke-width", 3).style("stroke-dasharray", dash ? "6 4" : "none");
    svg.append("text").attr("x", lx + 30).attr("y", m.top - 8).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").text(text);
  };
  lg(m.left, "var(--signal)", false, o.selName);
  lg(m.left + 168, "var(--tok-space)", true, o.adamwLabel);
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

function useMO() {
  const { t } = useAcademy();
  return t.matrixOptimizers;
}

/* ---- Node 1: AdamW's memory tax ---------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const mo = useMO();
  const n = mo.nodes[0];
  const [paramsB, setParamsB] = useState(8);
  const mem = adamMemory(paramsB);
  return (
    <SceneShell
      id="mo-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="mo-model-size" label={mo.n1slider} value={paramsB} display={`${paramsB}B`} min={1} max={140} onChange={setParamsB} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: fmtGB(mem.totalGB) },
          { k: n.rows[1], v: fmtGB(mem.optStateGB), hi: true },
          { k: n.rows[2], v: "50%" },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawMemRows(el, { paramsB, rowLabels: mo.n1rowLabels, taxLabel: mo.n1taxLabel, reduce })} deps={[paramsB, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2: cheaper state --------------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const mo = useMO();
  const n = mo.nodes[1];
  const keys: OptKey[] = OPTS.map((o) => o.key);
  const [sel, setSel] = useState<OptKey>("lion");
  const opt = optByKey(sel);
  const idx = keys.indexOf(sel);
  const saved = stateSavedPct(opt);
  return (
    <SceneShell
      id="mo-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Deeper title={mo.deeper1Title}>{rich(mo.deeper1Body)}</Deeper>}
      controls={
        <ControlRow>
          {mo.optNames.map((name, i) => (
            <Toggle key={i} on={sel === keys[i]} onClick={() => setSel(keys[i])}>{name}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={`${n.readoutTitle} · ${mo.optNames[idx]}`} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${opt.bytesPerWeight >= 1 ? opt.bytesPerWeight : "~" + opt.bytesPerWeight} ${mo.n2suffix}`, hi: true },
          { k: n.rows[1], v: saved > 0 ? `−${saved}% ${mo.n2savedLabel}` : "baseline" },
          { k: n.rows[2], v: fmtGB(opt.bytesPerWeight * 70) },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawStateBars(el, { selected: sel, names: mo.optNames, suffix: mo.n2suffix, reduce })} deps={[sel, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3: the trade-off --------------------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const mo = useMO();
  const n = mo.nodes[2];
  const keys: OptKey[] = OPTS.map((o) => o.key);
  const [sel, setSel] = useState<OptKey>("muon");
  const opt = optByKey(sel);
  const idx = keys.indexOf(sel);
  const steps = stepsToTargetK(opt);
  const baseSteps = stepsToTargetK(ADAMW);
  const delta = steps - baseSteps;
  const vsAdamw = sel === "adamw" ? "baseline" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)}k`;
  return (
    <SceneShell
      id="mo-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Deeper title={mo.deeper2Title}>{rich(mo.deeper2Body)}</Deeper>}
      controls={
        <ControlRow>
          {mo.optNames.map((name, i) => (
            <Toggle key={i} on={sel === keys[i]} onClick={() => setSel(keys[i])}>{name}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={`${n.readoutTitle} · ${mo.optNames[idx]}`} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${steps}k`, hi: true },
          { k: n.rows[1], v: vsAdamw },
          { k: n.rows[2], v: mo.n3stabWords[idx] },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawConvergence(el, { selected: sel, reduce, xLabel: mo.n3xLabel, yLabel: mo.n3yLabel, targetLabel: mo.n3targetLabel, adamwLabel: mo.n3adamwLabel, selName: mo.optNames[idx] })} deps={[sel, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function MatrixOptimizers() {
  const { t, lang } = useAcademy();
  const mo = t.matrixOptimizers;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{mo.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {mo.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{mo.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{mo.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {mo.pipeline.map((label, i) => (
              <a key={i} href={`#mo-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{mo.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{mo.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(mo.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{mo.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(mo.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/distributed-training" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {mo.prevLesson}</Link>
        <Link href="/stage/0/parameter-efficient-finetuning" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{mo.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
