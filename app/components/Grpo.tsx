"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import {
  MODEL_SIZES,
  memoryFor,
  netGB,
  PPO_NETS,
  GRPO_NETS,
  type RlNet,
  GROUP_REWARDS,
  G_MIN,
  G_MAX,
  ADV_PRESETS,
  ADV_PRESET_KEYS,
  advantages,
  fmt1,
} from "../lib/grpo";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so design tokens + theme flips resolve live.
 * Font floor: viewBox ~420 wide → keep primary text ≥18 units (≥12px on a
 * ~292px phone card), secondary legends ≥15.
 * ======================================================================== */

const ROLE_FILL: Record<RlNet["key"], string> = {
  policy: "var(--signal)",
  critic: "var(--tok-byte)",
  reward: "var(--tok-num)",
  reference: "var(--tok-space)",
};

/* --- Node 1: PPO vs GRPO memory stacks (horizontal, PPO = full width) ----- */

function drawMemory(
  el: SVGSVGElement,
  o: {
    paramsB: number;
    reduce: boolean;
    names: Record<RlNet["key"], string>;
    ppoLabel: string;
    grpoLabel: string;
    removedLabel: string;
    trained: string;
    frozen: string;
  },
) {
  const W = 420;
  const H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;

  const mem = memoryFor(o.paramsB);
  const x0 = 14;
  const maxW = 292; // PPO fills this; GRPO is proportionally shorter
  const pxPerGB = maxW / mem.ppo;
  const barH = 44;

  const gbStr = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(1)} TB` : `${Math.round(g)} GB`);

  const drawStack = (nets: RlNet[], y: number, header: string, totalGB: number) => {
    svg.append("text").attr("x", x0).attr("y", y - 8)
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700")
      .text(`${header} · ${gbStr(totalGB)}`);
    let x = x0;
    nets.forEach((n) => {
      const gb = netGB(o.paramsB, n.trained);
      const w = gb * pxPerGB;
      const rect = svg.append("rect").attr("y", y).attr("height", barH).attr("rx", 4)
        .style("fill", ROLE_FILL[n.key])
        .style("fill-opacity", n.trained ? 1 : 0.5)
        .style("stroke", "var(--bg)").style("stroke-width", 1);
      rect.attr("x", x).attr("width", 0).transition().duration(dur).attr("width", w);
      // name inside the wide (trained) segments
      if (w > 60) {
        const inkDark = n.key === "policy";
        svg.append("text").attr("x", x + w / 2).attr("y", y + barH / 2 + 6).attr("text-anchor", "middle")
          .style("fill", inkDark ? "#0a0a09" : "var(--fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700")
          .style("opacity", 0).text(o.names[n.key])
          .transition().duration(dur).style("opacity", 1);
      }
      x += w;
    });
    return x; // right edge of the bar
  };

  drawStack(PPO_NETS, 40, o.ppoLabel, mem.ppo);
  const grpoEnd = drawStack(GRPO_NETS, 132, o.grpoLabel, mem.grpo);

  // Ghost of the removed critic, appended where GRPO's critic would have sat.
  const criticW = netGB(o.paramsB, true) * pxPerGB;
  const gy = 132;
  const ghost = svg.append("rect").attr("x", grpoEnd + 6).attr("y", gy).attr("width", criticW).attr("height", barH).attr("rx", 4)
    .style("fill", "none").style("stroke", "var(--tok-byte)").style("stroke-width", 1.5).style("stroke-dasharray", "5 4");
  if (dur) ghost.style("opacity", 0).transition().delay(dur).duration(300).style("opacity", 1);
  svg.append("text").attr("x", grpoEnd + 6 + criticW / 2).attr("y", gy + barH / 2 + 6).attr("text-anchor", "middle")
    .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").text("✕");

  svg.append("text").attr("x", x0).attr("y", gy + barH + 22)
    .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700")
    .text(`↑ ${o.removedLabel}`);

  // trained vs frozen legend (one explanatory line)
  svg.append("text").attr("x", x0).attr("y", H - 14)
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px")
    .text(`${o.trained} = +grads +optimizer (~8×)  ·  ${o.frozen} = weights only`);
}

/* --- Node 2: one prompt fans out into a group of scored answers ----------- */

function drawGroup(
  el: SVGSVGElement,
  o: { g: number; reduce: boolean; promptLabel: string; answerLabel: string; rewardLabel: string; judgeLabel: string },
) {
  const W = 420;
  const rowH = 46;
  const top = 40;
  const H = top + o.g * rowH + 22;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;

  const groupTop = top;
  const groupBottom = top + o.g * rowH;
  const promptCY = (groupTop + groupBottom) / 2;

  // prompt box (left)
  const pw = 96;
  svg.append("rect").attr("x", 10).attr("y", promptCY - 30).attr("width", pw).attr("height", 60).attr("rx", 10)
    .style("fill", "var(--surface)").style("stroke", "var(--border)");
  svg.append("text").attr("x", 10 + pw / 2).attr("y", promptCY - 4).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text("prompt");
  svg.append("text").attr("x", 10 + pw / 2).attr("y", promptCY + 18).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").text(o.promptLabel);

  // reward-model label over the fan
  svg.append("text").attr("x", 190).attr("y", 22).attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "15px").text(`→ ${o.judgeLabel} →`);

  const ax = 214;
  const aw = 196;
  for (let i = 0; i < o.g; i++) {
    const cy = top + i * rowH + rowH / 2;
    const reward = GROUP_REWARDS[i];
    const line = svg.append("line").attr("x1", 10 + pw).attr("y1", promptCY).attr("x2", ax).attr("y2", cy)
      .style("stroke", "var(--border)").style("stroke-width", 1.5);
    if (dur) line.style("opacity", 0).transition().delay(i * 40).duration(dur).style("opacity", 1);

    const box = svg.append("g").attr("transform", `translate(${ax},${cy - 17})`);
    if (dur) box.style("opacity", 0).transition().delay(i * 40).duration(dur).style("opacity", 1);
    box.append("rect").attr("width", aw).attr("height", 34).attr("rx", 8)
      .style("fill", "var(--bg)").style("stroke", "var(--border)");
    box.append("text").attr("x", 12).attr("y", 22)
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "18px").text(`${o.answerLabel} ${i + 1}`);
    box.append("text").attr("x", aw - 12).attr("y", 22).attr("text-anchor", "end")
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "18px").style("font-weight", "700")
      .text(`${o.rewardLabel} ${fmt1(reward)}`);
  }
}

/* --- Node 3: group → mean → per-answer advantage (lollipops off the mean) - */

function drawAdvantage(
  el: SVGSVGElement,
  o: { rewards: number[]; reduce: boolean; meanLabel: string; answerWord: string; rawLabel: string; upWord: string; downWord: string },
) {
  const W = 420;
  const rowH = 40;
  const top = 58;
  const H = top + o.rewards.length * rowH + 40;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 480;

  const grp = advantages(o.rewards);
  const x = d3.scaleLinear().domain([0, 10]).range([104, 384]);
  const meanX = x(grp.mean);
  const rowsBottom = top + o.rewards.length * rowH;

  // reward axis ticks (0 / 10)
  [0, 5, 10].forEach((t) => {
    svg.append("text").attr("x", x(t)).attr("y", rowsBottom + 20).attr("text-anchor", "middle")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").text(String(t));
  });

  // group-mean vertical line + label
  const mline = svg.append("line").attr("x1", meanX).attr("x2", meanX).attr("y1", top - 12).attr("y2", rowsBottom + 6)
    .style("stroke", "var(--fg)").style("stroke-width", 2).style("stroke-dasharray", "4 4");
  if (dur) mline.style("opacity", 0).transition().duration(dur).style("opacity", 1);
  svg.append("text").attr("x", meanX).attr("y", top - 20).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700")
    .text(`${o.meanLabel} ${fmt1(grp.mean)}`);

  // column header for the per-answer numbers (they are reward − mean, un-normalized)
  svg.append("text").attr("x", 410).attr("y", top - 20).attr("text-anchor", "end")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px")
    .text(o.rawLabel);

  grp.items.forEach((it, i) => {
    const cy = top + i * rowH + rowH / 2;
    const above = it.raw > 0.05;
    const below = it.raw < -0.05;
    const color = above ? "var(--signal)" : below ? "var(--tok-byte)" : "var(--tok-space)";
    const rx = x(it.reward);

    // lollipop from the mean line to the reward
    const seg = svg.append("line").attr("y1", cy).attr("y2", cy).attr("x1", meanX).attr("x2", meanX)
      .style("stroke", color).style("stroke-width", 5).style("stroke-linecap", "round");
    seg.transition().duration(dur).attr("x2", rx);
    const dot = svg.append("circle").attr("cx", meanX).attr("cy", cy).attr("r", 6).style("fill", color);
    dot.transition().duration(dur).attr("cx", rx);

    // answer label (left) + advantage value (right)
    svg.append("text").attr("x", 10).attr("y", cy + 5)
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "16px").text(`${o.answerWord} ${i + 1}`);
    svg.append("text").attr("x", 410).attr("y", cy + 5).attr("text-anchor", "end")
      .style("fill", color).style("font-family", MONO).style("font-size", "16px").style("font-weight", "700")
      .text(`${it.raw >= 0 ? "+" : ""}${fmt1(it.raw)}`);
  });

  // summary line — two separate texts (SVG collapses whitespace inside one)
  svg.append("text").attr("x", 104).attr("y", H - 8)
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700")
    .text(`↑ ${grp.up} ${o.upWord}`);
  svg.append("text").attr("x", 384).attr("y", H - 8).attr("text-anchor", "end")
    .style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "16px").style("font-weight", "700")
    .text(`↓ ${grp.down} ${o.downWord}`);
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

function useG() {
  const { t } = useAcademy();
  return t.grpo;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const g = useG();
  const n = g.nodes[0];
  const [sizeIdx, setSizeIdx] = useState(1); // default 7B
  const paramsB = MODEL_SIZES[sizeIdx];
  const mem = memoryFor(paramsB);
  const gbStr = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} TB` : `${Math.round(v)} GB`);
  return (
    <SceneShell
      id="grpo-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<Deeper title={g.deeperTitle[0]}>{rich(g.deeperBody[0])}</Deeper>}
      controls={
        <Slider id="grpo-size" label={g.n1slider} value={sizeIdx} display={`${paramsB}B`} min={0} max={MODEL_SIZES.length - 1} onChange={setSizeIdx} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: gbStr(mem.ppo) },
          { k: n.rows[1], v: gbStr(mem.grpo), hi: true },
          { k: n.rows[2], v: `${gbStr(mem.saved)} · ${Math.round(mem.savedPct)}%`, hi: true },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawMemory(el, { paramsB, reduce, names: g.n1roleNames, ppoLabel: g.n1ppoLabel, grpoLabel: g.n1grpoLabel, removedLabel: g.n1removed, trained: g.n1trained, frozen: g.n1frozen })} deps={[paramsB, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const g = useG();
  const n = g.nodes[1];
  const [gsize, setGsize] = useState(4);
  return (
    <SceneShell
      id="grpo-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<Deeper title={g.deeperTitle[1]}>{rich(g.deeperBody[1])}</Deeper>}
      controls={
        <Slider id="grpo-gsize" label={g.n2slider} value={gsize} display={String(gsize)} min={G_MIN} max={G_MAX} onChange={setGsize} />
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawGroup(el, { g: gsize, reduce, promptLabel: g.n2promptLabel, answerLabel: g.n2answerLabel, rewardLabel: g.n2rewardLabel, judgeLabel: g.n2judgeLabel })} deps={[gsize, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const g = useG();
  const n = g.nodes[2];
  const [key, setKey] = useState<string>(ADV_PRESET_KEYS[0]);
  const rewards = ADV_PRESETS[key] ?? ADV_PRESETS.mixed;
  const grp = advantages(rewards);
  const idx = g.n3presets.findIndex((p) => p.key === key);
  const manual = useRef(false);
  const pick = (k: string) => { setKey(k); manual.current = true; };
  return (
    <SceneShell
      id="grpo-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={ADV_PRESET_KEYS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setKey(ADV_PRESET_KEYS[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={g.n3presets[idx < 0 ? 0 : idx]?.note}
      aside={<Deeper title={g.deeperTitle[2]}>{rich(g.deeperBody[2])}</Deeper>}
      controls={
        <ControlRow>
          {g.n3presets.map((p) => (
            <Toggle key={p.key} on={key === p.key} onClick={() => pick(p.key)}>{p.label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: fmt1(grp.mean) },
          { k: n.rows[1], v: fmt1(grp.std) },
          { k: n.rows[2], v: String(grp.up), hi: true },
          { k: n.rows[3], v: String(grp.down) },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawAdvantage(el, { rewards, reduce, meanLabel: g.n3meanLabel, answerWord: g.n3answerWord, rawLabel: g.n3rawLabel, upWord: g.n3upLabel, downWord: g.n3downLabel })} deps={[key, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Grpo() {
  const { t, lang } = useAcademy();
  const g = t.grpo;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{g.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {g.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{g.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{g.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {g.pipeline.map((label, i) => (
              <a key={i} href={`#grpo-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{g.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{g.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(g.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{g.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(g.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/ppo" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {g.prevLesson}</Link>
        <Link href="/stage/0/verifiable-rewards" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{g.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
