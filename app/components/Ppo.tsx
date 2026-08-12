"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import { PPO_ROLES, type PpoRole, clipStep, ppoOutcome } from "../lib/ppo";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * Big fonts (viewBox is ~640 wide, cards render ~290–560px): a 28-unit label
 * renders ≥12px even on the narrowest phone.
 * ======================================================================== */

/** A line with a small filled arrowhead at (x2,y2). */
function arrow(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false,
) {
  const line = svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
    .style("stroke", color).style("stroke-width", 2.5);
  if (dashed) line.style("stroke-dasharray", "8 7");
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const s = 13;
  const p1 = [x2 - s * Math.cos(ang - Math.PI / 7), y2 - s * Math.sin(ang - Math.PI / 7)];
  const p2 = [x2 - s * Math.cos(ang + Math.PI / 7), y2 - s * Math.sin(ang + Math.PI / 7)];
  svg.append("path").attr("d", `M${x2},${y2} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} Z`).style("fill", color);
}

/* --- Node 1: the actor–critic loop -------------------------------------- */

interface CastText {
  roles: string[];
  answer: string;
  score: string;
  update: string;
  leash: string;
  frozen: string;
}

function drawCast(el: SVGSVGElement, o: { sel: PpoRole; reduce: boolean; text: CastText }) {
  const W = 640;
  const H = 560;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const box = (x: number, y: number, w: number, h: number, label: string, role: PpoRole) => {
    const on = o.sel === role;
    svg.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", h).attr("rx", 16)
      .style("fill", on ? "var(--signal-wash)" : "var(--surface)")
      .style("stroke", on ? "var(--signal)" : "var(--border)")
      .style("stroke-width", on ? 3 : 1.5);
    svg.append("text").attr("x", x + w / 2).attr("y", y + h / 2 + 11).attr("text-anchor", "middle")
      .style("fill", on ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO)
      .style("font-size", "32px").style("font-weight", on ? 700 : 600).text(label);
  };

  // three centred boxes down the middle + the frozen reference off to the left
  const bw = 300;
  const bx = 170;
  const cx = bx + bw / 2; // 320
  box(bx, 30, bw, 90, o.text.roles[0], "policy"); //     POLICY   30..120
  box(bx, 205, bw, 90, o.text.roles[2], "reward"); //    REWARD  205..295
  box(bx, 380, bw, 90, o.text.roles[3], "critic"); //    CRITIC  380..470

  // the frozen reference (left) — a two-line box so its label never overflows
  {
    const rx = 16, ry = 205, rw = 150, rh = 90;
    const on = o.sel === "reference";
    const words = o.text.frozen.split(" ");
    const lines = words.length >= 2 ? [words[0], words.slice(1).join(" ")] : words;
    svg.append("rect").attr("x", rx).attr("y", ry).attr("width", rw).attr("height", rh).attr("rx", 16)
      .style("fill", on ? "var(--signal-wash)" : "var(--surface)")
      .style("stroke", on ? "var(--signal)" : "var(--border)").style("stroke-width", on ? 3 : 1.5);
    lines.forEach((ln, i) => {
      svg.append("text").attr("x", rx + rw / 2).attr("y", ry + rh / 2 + 9 + (i - (lines.length - 1) / 2) * 30).attr("text-anchor", "middle")
        .style("fill", on ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO)
        .style("font-size", "27px").style("font-weight", on ? 700 : 600).text(ln);
    });
  }

  // loop arrows
  arrow(svg, cx, 120, cx, 205, "var(--fg)");
  svg.append("text").attr("x", cx + 14).attr("y", 168).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "28px").text(o.text.answer);
  arrow(svg, cx, 295, cx, 380, "var(--fg)");
  svg.append("text").attr("x", cx + 14).attr("y", 343).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "28px").text(o.text.score);

  // critic → policy return path up the right side
  const rx = 600;
  svg.append("path").attr("d", `M470,425 H${rx} V75 H470`).style("fill", "none").style("stroke", "var(--fg)").style("stroke-width", 2.5);
  arrow(svg, rx, 75, 470, 75, "var(--fg)");
  svg.append("text").attr("transform", `rotate(-90 ${rx + 22} 250)`).attr("x", rx + 22).attr("y", 250).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "28px").text(o.text.update);

  // KL leash: dashed spring from the frozen reference up to the policy
  arrow(svg, 91, 205, 168, 120, "var(--signal)", true);
  svg.append("text").attr("x", 16).attr("y", 176).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "28px").text(o.text.leash);
}

/* --- Node 2: the clip — two ratio-line panels --------------------------- */

interface ClipText {
  noClip: string;
  clip: string;
  trustBand: string;
  clippedTag: string;
}

function drawClip(
  el: SVGSVGElement,
  o: { ratio: number; epsilon: number; good: boolean; reduce: boolean; text: ClipText },
) {
  const W = 640;
  const H = 430;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const X0 = 44;
  const X1 = 596;
  const x = d3.scaleLinear().domain([0.5, 2.0]).range([X0, X1]).clamp(true);
  const cs = clipStep(o.ratio, o.epsilon, o.good);
  const barColor = o.good ? "var(--signal)" : "var(--tok-byte)";

  const panel = (baseY: number, title: string, applied: number, showBand: boolean, showClipTag: boolean) => {
    svg.append("text").attr("x", X0).attr("y", baseY - 58).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "30px").style("font-weight", 700).text(title);

    // trust band (PPO panel only)
    if (showBand) {
      const bx = x(cs.lo);
      const bw = x(cs.hi) - bx;
      svg.append("rect").attr("x", bx).attr("y", baseY - 26).attr("width", bw).attr("height", 52).attr("rx", 6)
        .style("fill", "var(--signal)").style("fill-opacity", 0.16).style("stroke", "var(--signal)").style("stroke-opacity", 0.5);
      svg.append("text").attr("x", bx + bw / 2).attr("y", baseY - 34).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "26px").text(o.text.trustBand);
    }

    // the track
    svg.append("line").attr("x1", X0).attr("y1", baseY).attr("x2", X1).attr("y2", baseY).style("stroke", "var(--border)").style("stroke-width", 3);
    // r = 1.0 origin tick
    const x1 = x(1);
    svg.append("line").attr("x1", x1).attr("y1", baseY - 30).attr("x2", x1).attr("y2", baseY + 30).style("stroke", "var(--muted)").style("stroke-width", 1.5).style("stroke-dasharray", "3 4");
    svg.append("text").attr("x", x1).attr("y", baseY + 52).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text("1.0");

    // applied step: a bar from 1.0 to the applied ratio
    const xa = x(applied);
    const lo = Math.min(x1, xa);
    const hi = Math.max(x1, xa);
    const bar = svg.append("rect").attr("y", baseY - 13).attr("height", 26).attr("rx", 6).attr("x", lo).style("fill", barColor);
    if (o.reduce) bar.attr("width", hi - lo);
    else bar.attr("width", 0).attr("x", x1).transition().duration(420).ease(d3.easeCubicOut).attr("x", lo).attr("width", hi - lo);
    // value at the bar end
    const endX = applied >= 1 ? hi + 10 : lo - 10;
    svg.append("text").attr("x", endX).attr("y", baseY + 9).attr("text-anchor", applied >= 1 ? "start" : "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "28px").style("font-weight", 700).text(`×${applied.toFixed(2)}`);

    if (showClipTag && cs.clipped) {
      svg.append("text").attr("x", X1).attr("y", baseY - 34).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "26px").style("font-weight", 700).text(o.text.clippedTag);
    }
  };

  panel(150, o.text.noClip, cs.ratio, false, false);
  panel(340, o.text.clip, cs.applied, true, true);
}

/* --- Node 3: the KL leash + reward/quality bars ------------------------- */

interface LeashText {
  ref: string;
  policy: string;
  drift: string;
  rmLabel: string;
  qualityLabel: string;
  verdict: string;
  verdictColor: string;
}

function drawLeash(
  el: SVGSVGElement,
  o: { epsilon: number; beta: number; reduce: boolean; text: LeashText },
) {
  const W = 640;
  const H = 470;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const out = ppoOutcome(o.epsilon, o.beta);

  // --- the leash: frozen reference anchor → policy dot, gap = drift ---
  const refX = 16, refY = 34, refW = 150, refH = 84;
  svg.append("rect").attr("x", refX).attr("y", refY).attr("width", refW).attr("height", refH).attr("rx", 14)
    .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1.5);
  svg.append("text").attr("x", refX + refW / 2).attr("y", refY + refH / 2 + 10).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "28px").style("font-weight", 700).text(o.text.ref);

  const anchorX = refX + refW; // 166
  const cy = refY + refH / 2; // 76
  const policyX = Math.min(600, 210 + out.drift * 38);

  // faint "reward-hacking" zone past the healthy band (drift > 4.5)
  const hackX = 210 + 4.5 * 38;
  svg.append("rect").attr("x", hackX).attr("y", cy - 34).attr("width", Math.max(0, 610 - hackX)).attr("height", 68).attr("rx", 8)
    .style("fill", "var(--tok-byte)").style("fill-opacity", 0.1);

  // tether (dashed spring)
  const tether = svg.append("line").attr("x1", anchorX).attr("y1", cy).attr("y2", cy).style("stroke", "var(--fg)").style("stroke-width", 2.5).style("stroke-dasharray", "8 7");
  if (o.reduce) tether.attr("x2", policyX - 20);
  else tether.attr("x2", anchorX).transition().duration(420).ease(d3.easeCubicOut).attr("x2", policyX - 20);
  // policy dot
  const dot = svg.append("circle").attr("cy", cy).attr("r", 20).style("fill", "var(--signal)").style("stroke", "var(--bg)").style("stroke-width", 2);
  if (o.reduce) dot.attr("cx", policyX);
  else dot.attr("cx", anchorX + 20).transition().duration(420).ease(d3.easeCubicOut).attr("cx", policyX);
  svg.append("text").attr("x", policyX).attr("y", cy + 44).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(o.text.policy);
  // drift readout above the tether
  svg.append("text").attr("x", (anchorX + policyX) / 2).attr("y", cy - 28).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "28px").style("font-weight", 700).text(`${o.text.drift} ${out.drift.toFixed(1)}`);

  // --- two outcome bars: reward-model score, true quality ---
  const trackX0 = 196, trackX1 = 610;
  const trackW = trackX1 - trackX0;
  const bar = (y: number, label: string, val: number, color: string) => {
    svg.append("text").attr("x", 16).attr("y", y + 36).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "27px").text(label);
    svg.append("rect").attr("x", trackX0).attr("y", y).attr("width", trackW).attr("height", 50).attr("rx", 9).style("fill", "var(--surface)").style("stroke", "var(--border)");
    const w = (val / 100) * trackW;
    const b = svg.append("rect").attr("x", trackX0).attr("y", y).attr("height", 50).attr("rx", 9).style("fill", color);
    if (o.reduce) b.attr("width", w);
    else b.attr("width", 0).transition().duration(520).ease(d3.easeCubicOut).attr("width", w);
    svg.append("text").attr("x", trackX0 + 14).attr("y", y + 34).style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "26px").style("font-weight", 700).text(String(val));
  };
  bar(170, o.text.rmLabel, out.rmScore, "var(--signal)");
  bar(250, o.text.qualityLabel, out.quality, out.quality >= 55 ? "var(--signal)" : "var(--tok-byte)");

  // --- verdict ---
  svg.append("text").attr("x", W / 2).attr("y", 400).attr("text-anchor", "middle").style("fill", o.text.verdictColor).style("font-family", DISPLAY).style("font-size", "30px").style("font-weight", 700).text(o.text.verdict);
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

function usePpo() {
  const { t } = useAcademy();
  return t.ppo;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const p = usePpo();
  const n = p.nodes[0];
  const [sel, setSel] = useState<PpoRole>("policy");
  const idx = PPO_ROLES.indexOf(sel);
  const text: CastText = {
    roles: p.n1roles,
    answer: p.n1answer,
    score: p.n1score,
    update: p.n1update,
    leash: p.n1leash,
    frozen: p.n1frozen,
  };
  return (
    <SceneShell
      id="ppo-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Callout label={p.calloutLabel} title={p.calloutTitle}>{p.calloutBody}</Callout>}
      controls={
        <ControlRow>
          {p.n1roles.map((lab, i) => (
            <Toggle key={i} on={sel === PPO_ROLES[i]} onClick={() => setSel(PPO_ROLES[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawCast(el, { sel, reduce, text: { ...text, roles: p.n1roles } })} deps={[sel, reduce, p.n1roles]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const p = usePpo();
  const n = p.nodes[1];
  const [epsilon, setEpsilon] = useState(0.2);
  const [ratio, setRatio] = useState(1.6);
  const [good, setGood] = useState(true);
  const cs = clipStep(ratio, epsilon, good);
  const text: ClipText = { noClip: p.n2panelNoClip, clip: p.n2panelClip, trustBand: p.n2trustBand, clippedTag: p.n2clippedTag };
  return (
    <SceneShell
      id="ppo-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={cs.clipped ? p.n2clippedNote : p.n2freeNote}
      aside={<Deeper title={p.n2deeperTitle}>{rich(p.n2deeperBody)}</Deeper>}
      controls={
        <>
          <Slider id="ppo-clip" label={p.n2clipSlider} value={epsilon} display={epsilon.toFixed(2)} min={0.05} max={0.4} step={0.05} onChange={setEpsilon} />
          <Slider id="ppo-ratio" label={p.n2ratioSlider} value={ratio} display={ratio.toFixed(2)} min={0.5} max={2} step={0.05} onChange={setRatio} />
          <ControlRow>
            <Toggle on={good} onClick={() => setGood(true)}>{p.n2good}</Toggle>
            <Toggle on={!good} onClick={() => setGood(false)}>{p.n2bad}</Toggle>
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawClip(el, { ratio, epsilon, good, reduce, text })} deps={[ratio, epsilon, good, reduce, p.n2panelNoClip]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const p = usePpo();
  const n = p.nodes[2];
  const [epsilon, setEpsilon] = useState(0.2);
  const [beta, setBeta] = useState(0.02);
  const out = ppoOutcome(epsilon, beta);
  const verdictColor =
    out.regime === "healthy" ? "var(--signal-fg)" : out.regime === "hacking" ? "var(--tok-byte)" : "var(--tok-sub)";
  const text: LeashText = {
    ref: p.n3ref,
    policy: p.n3policy,
    drift: p.n3drift,
    rmLabel: p.n3rmLabel,
    qualityLabel: p.n3qualityLabel,
    verdict: p.n3regimeLabels[out.regime],
    verdictColor,
  };
  return (
    <SceneShell
      id="ppo-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={p.n3regimeNotes[out.regime]}
      aside={<Deeper title={p.n3deeperTitle}>{rich(p.n3deeperBody)}</Deeper>}
      controls={
        <>
          <Slider id="ppo-kl-clip" label={p.n3clipSlider} value={epsilon} display={epsilon.toFixed(2)} min={0.1} max={0.4} step={0.05} onChange={setEpsilon} />
          <Slider id="ppo-kl-beta" label={p.n3klSlider} value={beta} display={beta.toFixed(2)} min={0} max={0.5} step={0.02} onChange={setBeta} />
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLeash(el, { epsilon, beta, reduce, text })} deps={[epsilon, beta, reduce, p.n3ref, verdictColor, p.n3regimeLabels]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function Ppo() {
  const { t, lang } = useAcademy();
  const p = t.ppo;
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
              <a key={i} href={`#ppo-node-${i + 1}`} className="u-hover-fg-border"
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
        <Link href="/stage/0/parameter-efficient-finetuning" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {p.prevLesson}</Link>
        <Link href="/stage/0/grpo" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{p.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
