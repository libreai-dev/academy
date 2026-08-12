"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import {
  WEIGHTS_GB,
  PASS_MS,
  COMPUTE_USED_PCT,
  expectedTokens,
  speedup,
  acceptedPrefix,
} from "../lib/speculative-decoding";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * viewBox width 640; label fonts kept large enough to render ~12px on phones.
 * ======================================================================== */

const W = 640;

/** Centered, word-wrapped svg text — returns the y just below the last line. */
function wrapCentered(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  text: string,
  cx: number,
  y: number,
  maxChars: number,
  fontPx: number,
  lineH: number,
  fill: string,
  weight = 400,
): number {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  words.forEach((w) => {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  });
  if (cur) lines.push(cur);
  lines.forEach((ln, i) => {
    g.append("text")
      .attr("x", cx)
      .attr("y", y + i * lineH)
      .attr("text-anchor", "middle")
      .style("fill", fill)
      .style("font-family", MONO)
      .style("font-size", `${fontPx}px`)
      .style("font-weight", weight)
      .text(ln);
  });
  return y + (lines.length - 1) * lineH;
}

/* --- Node 1: one pass — memory vs compute ------------------------------- */

function drawPass(
  el: SVGSVGElement,
  o: {
    n: number;
    reduce: boolean;
    passLabel: string;
    memLabel: string;
    computeLabel: string;
    producesLabel: string;
    perTokenLabel: string;
    tokWord: string;
  },
) {
  const H = 440;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 500;
  const x0 = 24;
  const barW = W - 48;

  // title
  svg.append("text").attr("x", x0).attr("y", 34).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "30px").style("letter-spacing", ".04em").text(o.passLabel);

  // MEMORY — the long, fixed bar (loading all weights is the wall)
  svg.append("text").attr("x", x0).attr("y", 82).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "27px").text(o.memLabel);
  const memY = 96;
  svg.append("rect").attr("x", x0).attr("y", memY).attr("width", barW).attr("height", 50).attr("rx", 10).style("fill", "var(--tok-num)").style("fill-opacity", 0.85);
  svg.append("text").attr("x", x0 + 16).attr("y", memY + 33).style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "29px").style("font-weight", "700").text(`${WEIGHTS_GB} GB · ${PASS_MS.toFixed(0)} ms`);

  // COMPUTE — a deliberately tiny bar; the GPU math finishes fast and idles
  svg.append("text").attr("x", x0).attr("y", 194).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "27px").text(o.computeLabel);
  const compY = 208;
  const compW = 52 + o.n * 12; // grows slightly with tokens, stays tiny vs memory
  const cbar = svg.append("rect").attr("x", x0).attr("y", compY).attr("height", 50).attr("rx", 10).style("fill", "var(--signal)");
  if (dur) cbar.attr("width", 0).transition().duration(dur).attr("width", compW);
  else cbar.attr("width", compW);
  svg.append("text").attr("x", x0 + compW + 14).attr("y", compY + 33).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "27px").text(`~${COMPUTE_USED_PCT}% used`);

  // PRODUCES — n green squares = tokens this pass
  svg.append("text").attr("x", x0).attr("y", 306).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "27px").text(`${o.producesLabel} · ${o.n} ${o.tokWord}`);
  const sq = 46;
  const gap = 10;
  for (let i = 0; i < o.n; i++) {
    const cell = svg.append("rect").attr("x", x0 + i * (sq + gap)).attr("y", 320).attr("width", sq).attr("height", sq).attr("rx", 8).style("fill", "var(--signal)").style("stroke", "var(--bg)").style("stroke-width", 2);
    if (dur) cell.style("opacity", 0).transition().duration(240).delay(i * 40).style("opacity", 1);
  }

  // per-token time — the number that collapses as n grows
  svg.append("text").attr("x", x0).attr("y", 412).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "27px").text(o.perTokenLabel);
  svg.append("text").attr("x", W - 24).attr("y", 418).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", DISPLAY).style("font-size", "44px").style("font-weight", "700").style("letter-spacing", "-.03em").text(`${(PASS_MS / o.n).toFixed(1)} ms`);
}

/* --- Node 2: draft → verify → accept prefix ----------------------------- */

interface ChipItem {
  text: string;
  state: "ok" | "rej" | "drop" | "bonus";
}

function drawDraftVerify(
  el: SVGSVGElement,
  o: {
    spec: boolean;
    k: number;
    alpha: number;
    tokens: string[];
    reduce: boolean;
    draftLabel: string;
    acceptWord: string;
    rejectWord: string;
    bonusLabel: string;
    meterLabel: string;
    plainBar: string;
    specBar: string;
  },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const dur = o.reduce ? 0 : 300;
  const x0 = 24;

  // --- draft tape ---
  g.append("text").attr("x", x0).attr("y", 32).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "27px").text(o.draftLabel);

  const accP = acceptedPrefix(o.alpha, o.k);
  const items: ChipItem[] = [];
  if (!o.spec) {
    items.push({ text: o.tokens[0] ?? "tok", state: "ok" });
  } else {
    for (let i = 0; i < o.k; i++) {
      const t = o.tokens[i % o.tokens.length];
      items.push({ text: t, state: i < accP ? "ok" : i === accP ? "rej" : "drop" });
    }
    items.push({ text: "✓", state: "bonus" });
  }

  const chipH = 54;
  const gapX = 9;
  const rowGap = 14;
  let x = x0;
  let y = 48;
  items.forEach((it, i) => {
    const label = it.state === "bonus" ? "✓" : it.text.replace(/ /g, "·");
    const w = Math.max(64, label.length * 17 + 30);
    if (x > x0 && x + w > W - x0) {
      x = x0;
      y += chipH + rowGap;
    }
    const fill =
      it.state === "ok" || it.state === "bonus" ? "var(--signal)" : it.state === "rej" ? "var(--tok-byte)" : "var(--border)";
    const wash =
      it.state === "bonus" ? "var(--signal)" : `color-mix(in srgb, ${fill} 16%, transparent)`;
    const cell = g.append("g").attr("transform", `translate(${x},${y})`).style("opacity", it.state === "drop" ? 0.4 : 1);
    if (dur) cell.style("opacity", 0).transition().duration(dur).delay(Math.min(i * 40, 300)).style("opacity", it.state === "drop" ? 0.4 : 1);
    cell.append("rect").attr("width", w).attr("height", chipH).attr("rx", 10).style("fill", wash).style("stroke", fill).style("stroke-width", it.state === "bonus" ? 3 : 1.5);
    cell.append("text").attr("x", w / 2).attr("y", chipH / 2 + 10).attr("text-anchor", "middle").style("fill", it.state === "bonus" ? "#0a0a09" : it.state === "rej" ? "var(--tok-byte)" : "var(--fg)").style("font-family", MONO).style("font-size", "29px").style("font-weight", it.state === "bonus" ? "700" : "400").text(label);
    if (it.state === "rej") cell.append("text").attr("x", w - 8).attr("y", 22).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", "24px").text("✕");
    x += w + gapX;
  });
  let bottom = y + chipH;

  // caption row: accepted / bonus legend
  bottom += 34;
  if (o.spec) {
    const rejTxt = accP < o.k ? `  1 ${o.rejectWord}` : "";
    g.append("text").attr("x", x0).attr("y", bottom).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "25px").text(`${accP} ${o.acceptWord}${rejTxt}  +1 ${o.bonusLabel}`);
  }

  // --- speed-up meter: big-model passes for 100 tokens ---
  const E = o.spec ? expectedTokens(o.alpha, o.k) : 1;
  const su = o.spec ? speedup(o.alpha, o.k) : 1;
  const plainPasses = 100;
  const specPasses = Math.max(1, Math.round(100 / E));
  const meterY = bottom + 40;
  const fullW = W - 48;
  g.append("text").attr("x", x0).attr("y", meterY).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").style("letter-spacing", ".03em").text(o.meterLabel);

  // plain bar
  const p1y = meterY + 20;
  g.append("text").attr("x", x0).attr("y", p1y + 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(o.plainBar);
  g.append("rect").attr("x", x0).attr("y", p1y + 34).attr("width", fullW).attr("height", 40).attr("rx", 9).style("fill", "var(--border)");
  g.append("text").attr("x", x0 + fullW - 12).attr("y", p1y + 61).attr("text-anchor", "end").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "26px").style("font-weight", "700").text(`${plainPasses}`);

  // spec bar (shorter = faster)
  const p2y = p1y + 100;
  g.append("text").attr("x", x0).attr("y", p2y + 24).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "26px").text(o.specBar);
  const specW = Math.max(70, fullW / E);
  const sbar = g.append("rect").attr("x", x0).attr("y", p2y + 34).attr("height", 40).attr("rx", 9).style("fill", "var(--signal)");
  if (dur) sbar.attr("width", 0).transition().duration(500).ease(d3.easeCubicOut).attr("width", specW);
  else sbar.attr("width", specW);
  g.append("text").attr("x", x0 + specW - 12).attr("y", p2y + 61).attr("text-anchor", "end").style("fill", "#0a0a09").style("font-family", MONO).style("font-size", "26px").style("font-weight", "700").text(`${specPasses}`);
  g.append("text").attr("x", x0 + specW + 14).attr("y", p2y + 61).style("fill", "var(--signal-fg)").style("font-family", DISPLAY).style("font-size", "34px").style("font-weight", "700").style("letter-spacing", "-.03em").text(`${su.toFixed(1)}×`);

  svg.attr("viewBox", `0 0 ${W} ${p2y + 100}`);
}

/* --- Node 3: separate draft model vs bolt-on heads ---------------------- */

function drawArch(
  el: SVGSVGElement,
  o: {
    sel: number;
    reduce: boolean;
    optA: string;
    optB: string;
    bigLabel: string;
    draftLabel: string;
    headLabel: string;
    guessLabel: string;
    verifyLabel: string;
  },
) {
  const H = 400;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const gap = 20;
  const pw = (W - gap) / 2;
  const boxW = 250;

  const drawPanel = (px: number, selected: boolean, title: string, kind: "sep" | "heads") => {
    const g = svg.append("g");
    const cx = px + pw / 2;
    // title (wrapped)
    wrapCentered(g, title, cx, 34, 15, 27, 32, selected ? "var(--signal-fg)" : "var(--muted)", 700);
    // panel frame
    g.append("rect").attr("x", px + 6).attr("y", 84).attr("width", pw - 12).attr("height", 300).attr("rx", 16).style("fill", selected ? "var(--signal-wash)" : "var(--bg)").style("stroke", selected ? "var(--signal)" : "var(--border)").style("stroke-width", selected ? 2.5 : 1.5);

    const boxX = cx - boxW / 2;
    if (kind === "sep") {
      // small draft model box on top
      g.append("rect").attr("x", boxX).attr("y", 108).attr("width", boxW).attr("height", 64).attr("rx", 12).style("fill", "var(--surface)").style("stroke", "var(--tok-num)").style("stroke-width", 2);
      g.append("text").attr("x", cx).attr("y", 148).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "27px").text(o.draftLabel);
      // guesses arrow down
      g.append("line").attr("x1", cx).attr("y1", 172).attr("x2", cx).attr("y2", 218).style("stroke", "var(--signal)").style("stroke-width", 2.5).attr("marker-end", "");
      g.append("text").attr("x", cx + 12).attr("y", 200).style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "26px").text(o.guessLabel);
      // big model box
      g.append("rect").attr("x", boxX).attr("y", 222).attr("width", boxW).attr("height", 74).attr("rx", 12).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 2.5);
      g.append("text").attr("x", cx).attr("y", 266).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "28px").style("font-weight", "700").text(o.bigLabel);
      // verify
      g.append("text").attr("x", cx).attr("y", 344).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(`↓ ${o.verifyLabel}`);
    } else {
      // heads on top of the big model
      const nH = 3;
      const hw = 58;
      const totalW = nH * hw + (nH - 1) * 16;
      const startX = cx - totalW / 2;
      for (let i = 0; i < nH; i++) {
        g.append("rect").attr("x", startX + i * (hw + 16)).attr("y", 120).attr("width", hw).attr("height", 40).attr("rx", 8).style("fill", "var(--signal)").style("fill-opacity", 0.85).style("stroke", "var(--bg)").style("stroke-width", 2);
        g.append("line").attr("x1", startX + i * (hw + 16) + hw / 2).attr("y1", 160).attr("x2", startX + i * (hw + 16) + hw / 2).attr("y2", 200).style("stroke", "var(--signal)").style("stroke-width", 2);
      }
      g.append("text").attr("x", cx).attr("y", 108).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "26px").text(`3 × ${o.headLabel}`);
      // big model box
      g.append("rect").attr("x", boxX).attr("y", 204).attr("width", boxW).attr("height", 92).attr("rx", 12).style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 2.5);
      g.append("text").attr("x", cx).attr("y", 256).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "28px").style("font-weight", "700").text(o.bigLabel);
      g.append("text").attr("x", cx).attr("y", 344).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(`↓ ${o.verifyLabel}`);
    }
  };

  drawPanel(0, o.sel === 0, o.optA, "sep");
  drawPanel(pw + gap, o.sel === 1, o.optB, "heads");
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

function useSD() {
  const { t } = useAcademy();
  return t.speculativeDecoding;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const sd = useSD();
  const n = sd.nodes[0];
  const [pos, setPos] = useState(1);
  return (
    <SceneShell
      id="sd-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      controls={
        <Slider id="sd-pos" label={sd.n1slider} value={pos} display={String(pos)} min={1} max={8} onChange={setPos} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${WEIGHTS_GB} GB` },
          { k: n.rows[1], v: `~${PASS_MS.toFixed(0)} ms` },
          { k: n.rows[2], v: String(pos) },
          { k: n.rows[3], v: `${(PASS_MS / pos).toFixed(1)} ms`, hi: true },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawPass(el, { n: pos, reduce, passLabel: sd.n1passLabel, memLabel: sd.n1memLabel, computeLabel: sd.n1computeLabel, producesLabel: sd.n1producesLabel, perTokenLabel: sd.n1perTokenLabel, tokWord: sd.n1tokWord })}
          deps={[pos, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const sd = useSD();
  const n = sd.nodes[1];
  const [spec, setSpec] = useState(true);
  const [k, setK] = useState(4);
  const [pct, setPct] = useState(80); // accept rate %
  const alpha = pct / 100;
  const E = spec ? expectedTokens(alpha, k) : 1;
  const su = spec ? speedup(alpha, k) : 1;
  const passes = spec ? Math.max(1, Math.round(100 / E)) : 100;

  return (
    <div>
      <SceneShell
        id="sd-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
        cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
        labelPrev="Previous step" labelNext="Next step" note={spec ? n.optionNotes?.[0] : sd.n2offNote}
        controls={
          <>
            <ControlRow>
              <Toggle on={spec} onClick={() => setSpec((v) => !v)}>{sd.n2spec}: {spec ? "ON" : "OFF"}</Toggle>
            </ControlRow>
            <Slider id="sd-k" label={sd.n2kSlider} value={k} display={String(k)} min={1} max={8} onChange={setK} />
            <Slider id="sd-alpha" label={sd.n2aSlider} value={pct} display={`${pct}%`} min={40} max={95} onChange={setPct} />
          </>
        }
        readout={
          <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
            { k: n.rows[0], v: E.toFixed(2) },
            { k: n.rows[1], v: String(passes) },
            { k: n.rows[2], v: `${su.toFixed(1)}×`, hi: true },
          ]} />
        }
      >
        {() => (
          <DiagramSvg
            label={n.aria ?? ""}
            draw={(el) => drawDraftVerify(el, { spec, k, alpha, tokens: sd.n2draftTokens, reduce, draftLabel: sd.n2draftLabel, acceptWord: sd.n2acceptWord, rejectWord: sd.n2rejectWord, bonusLabel: sd.n2bonusLabel, meterLabel: sd.n2meterLabel, plainBar: sd.n2plainBar, specBar: sd.n2specBar })}
            deps={[spec, k, pct, reduce]}
          />
        )}
      </SceneShell>
      <div style={{ maxWidth: 760, margin: "18px auto 0" }}>
        <Deeper title={sd.n2deeperTitle}>{rich(sd.n2deeperBody)}</Deeper>
      </div>
    </div>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const sd = useSD();
  const n = sd.nodes[2];
  const [sel, setSel] = useState(1); // default to the self-drafting heads (the interesting one)
  return (
    <SceneShell
      id="sd-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[sel]}
      aside={<Callout label={sd.calloutLabel} title={sd.calloutTitle}>{sd.calloutBody}</Callout>}
      controls={
        <ControlRow>
          {sd.n3opts.map((lab, i) => (
            <Toggle key={i} on={sel === i} onClick={() => setSel(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawArch(el, { sel, reduce, optA: sd.n3opts[0], optB: sd.n3opts[1], bigLabel: sd.n3bigLabel, draftLabel: sd.n3draftLabel, headLabel: sd.n3headLabel, guessLabel: sd.n3guessLabel, verifyLabel: sd.n3verifyLabel })}
          deps={[sel, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function SpeculativeDecoding() {
  const { t, lang } = useAcademy();
  const sd = t.speculativeDecoding;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{sd.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {sd.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{sd.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{sd.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {sd.pipeline.map((label, i) => (
              <a key={i} href={`#sd-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{sd.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{sd.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(sd.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{sd.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(sd.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/quantization" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {sd.prevLesson}</Link>
        <Link href="/stage/0" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{sd.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
