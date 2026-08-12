"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Callout, Deeper } from "./webscale-kit";
import {
  PAGE_BLOCKS,
  extractionYield,
  FORMAT_KEYS,
  type FormatKey,
  LANG_SAMPLES,
  LANG_SAMPLE_KEYS,
  type LangSampleKey,
  sortedScores,
  topLang,
  isConfident,
} from "../lib/extraction-parsing";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS design tokens + theme flips resolve live.
 * viewBox widths are kept small so label text stays >=12px when the card
 * renders down to ~300px wide on a phone.
 * ======================================================================== */

/* --- Node 1: a page as a stack of blocks -------------------------------- */

function drawPage(
  el: SVGSVGElement,
  o: { on: boolean; reduce: boolean; labels: string[]; summaryOff: string; summaryOn: string },
) {
  const W = 400;
  const rowH = 32;
  const gap = 8;
  const top = 12;
  const n = PAGE_BLOCKS.length;
  const summaryY = top + n * (rowH + gap) + 20;
  const H = summaryY + 18;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 340;

  PAGE_BLOCKS.forEach((b, i) => {
    const y = top + i * (rowH + gap);
    const isBody = b.kind === "body";
    const dropped = o.on && !isBody;
    const kept = o.on && isBody;

    const fill = kept
      ? "color-mix(in srgb, var(--signal) 16%, transparent)"
      : "var(--surface)";
    const stroke = kept ? "var(--signal)" : "var(--border)";

    const g = svg.append("g");
    const rect = g
      .append("rect")
      .attr("x", 12)
      .attr("y", y)
      .attr("width", W - 24)
      .attr("height", rowH)
      .attr("rx", 8)
      .style("fill", fill)
      .style("stroke", stroke)
      .style("stroke-width", kept ? 2 : 1)
      .style("stroke-dasharray", dropped ? "5 5" : "none")
      .style("opacity", dropped ? 0.42 : 1);
    if (dur) rect.style("opacity", null).transition().duration(dur).style("opacity", dropped ? 0.42 : 1);

    // leading marker — solid green square for a kept article block
    g.append("rect")
      .attr("x", 24)
      .attr("y", y + rowH / 2 - 6)
      .attr("width", 12)
      .attr("height", 12)
      .attr("rx", 3)
      .style("fill", kept ? "var(--signal)" : "var(--border)")
      .style("opacity", dropped ? 0.5 : 1);

    g.append("text")
      .attr("x", 48)
      .attr("y", y + rowH / 2 + 6)
      .style("fill", dropped ? "var(--muted)" : "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", "18px")
      .style("opacity", dropped ? 0.7 : 1)
      .text(o.labels[i] ?? b.key);
  });

  svg
    .append("text")
    .attr("x", 12)
    .attr("y", summaryY)
    .style("fill", o.on ? "var(--signal-fg)" : "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "20px")
    .style("font-weight", 700)
    .text(o.on ? o.summaryOn : o.summaryOff);
}

/* --- Node 2: a hard file → clean markdown ------------------------------- */

/** Draw the format-specific "raw file" depiction inside a box (abstract shapes). */
function drawRawFile(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  key: FormatKey,
  x0: number,
  y0: number,
  w: number,
  h: number,
) {
  const line = (x: number, y: number, ln: number, col: string, op = 0.7) =>
    g
      .append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", ln)
      .attr("height", 8)
      .attr("rx", 4)
      .style("fill", col)
      .style("opacity", op);

  if (key === "html") {
    // tidy, already-clean lines
    const lens = [w - 40, w - 90, w - 30, w - 130];
    lens.forEach((ln, i) => line(x0 + 20, y0 + 18 + i * 22, ln, "var(--tok-space)"));
    return;
  }
  if (key === "pdf") {
    // two columns; a red path shows the wrong straight-across reading order
    const colW = (w - 60) / 2;
    const lx = x0 + 20;
    const rx = x0 + 40 + colW;
    for (let i = 0; i < 4; i++) {
      line(lx, y0 + 16 + i * 22, colW - 6, "var(--tok-space)");
      line(rx, y0 + 16 + i * 22, colW - 20, "var(--tok-space)");
    }
    const pathY = y0 + 20;
    g.append("path")
      .attr(
        "d",
        `M${lx} ${pathY} H${lx + colW - 6} L${rx} ${pathY} H${rx + colW - 20} M${lx} ${pathY + 22} H${lx + colW - 6} L${rx} ${pathY + 22} H${rx + colW - 20}`,
      )
      .style("fill", "none")
      .style("stroke", "var(--tok-byte)")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "4 3")
      .style("opacity", 0.85);
    return;
  }
  if (key === "scan") {
    // a pixel grid — an image with no text layer
    const cols = 14;
    const rows = 5;
    const cw = (w - 40) / cols;
    const ch = (h - 40) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = (r * 7 + c * 3) % 5 < 2; // deterministic speckle
        g.append("rect")
          .attr("x", x0 + 20 + c * cw)
          .attr("y", y0 + 16 + r * ch)
          .attr("width", cw - 2)
          .attr("height", ch - 2)
          .attr("rx", 2)
          .style("fill", on ? "var(--muted)" : "var(--border)")
          .style("opacity", on ? 0.55 : 0.35);
      }
    }
    return;
  }
  // table & math — a small grid + a formula blob
  const gx = x0 + 20;
  const gy = y0 + 16;
  const gw = w - 120;
  const gh = h - 40;
  const c3 = gw / 3;
  const r3 = gh / 3;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      g.append("rect")
        .attr("x", gx + c * c3)
        .attr("y", gy + r * r3)
        .attr("width", c3 - 4)
        .attr("height", r3 - 4)
        .attr("rx", 3)
        .style("fill", r === 0 ? "color-mix(in srgb, var(--tok-space) 30%, transparent)" : "var(--surface)")
        .style("stroke", "var(--border)")
        .style("stroke-width", 1);
  g.append("text")
    .attr("x", x0 + w - 66)
    .attr("y", y0 + h / 2 + 8)
    .attr("text-anchor", "middle")
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "22px")
    .text("∫ x²");
}

function drawFormat(
  el: SVGSVGElement,
  o: { key: FormatKey; reduce: boolean; rawLabel: string; mdLabel: string; technique: string; md: string[]; formatLabel: string },
) {
  const W = 400;
  const rawTop = 34;
  const rawH = 116;
  const chipY = rawTop + rawH + 20;
  const mdLabelY = chipY + 44;
  const mdTop = mdLabelY + 12;
  const lineH = 26;
  const mdH = o.md.length * lineH + 22;
  const H = mdTop + mdH + 12;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  // RAW heading + box
  svg
    .append("text")
    .attr("x", 14)
    .attr("y", 22)
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "18px")
    .style("letter-spacing", ".06em")
    .text(`${o.rawLabel} · ${o.formatLabel}`);
  svg
    .append("rect")
    .attr("x", 12)
    .attr("y", rawTop)
    .attr("width", W - 24)
    .attr("height", rawH)
    .attr("rx", 12)
    .style("fill", "var(--bg)")
    .style("stroke", "var(--border)")
    .style("stroke-width", 1);
  const rawG = svg.append("g");
  drawRawFile(rawG, o.key, 12, rawTop, W - 24, rawH);

  // technique chip between the two, with a down arrow
  svg
    .append("text")
    .attr("x", W / 2)
    .attr("y", chipY - 18)
    .attr("text-anchor", "middle")
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "20px")
    .text("↓");
  const chipW = Math.min(W - 28, o.technique.length * 12 + 36);
  svg
    .append("rect")
    .attr("x", (W - chipW) / 2)
    .attr("y", chipY)
    .attr("width", chipW)
    .attr("height", 32)
    .attr("rx", 16)
    .style("fill", "var(--signal-wash)")
    .style("stroke", "var(--signal)")
    .style("stroke-width", 1.5);
  svg
    .append("text")
    .attr("x", W / 2)
    .attr("y", chipY + 21)
    .attr("text-anchor", "middle")
    .style("fill", "var(--signal-fg)")
    .style("font-family", MONO)
    .style("font-size", "18px")
    .text(o.technique);

  // MARKDOWN heading + box + clean text lines
  svg
    .append("text")
    .attr("x", 14)
    .attr("y", mdLabelY)
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "18px")
    .style("letter-spacing", ".06em")
    .text(o.mdLabel);
  svg
    .append("rect")
    .attr("x", 12)
    .attr("y", mdTop)
    .attr("width", W - 24)
    .attr("height", mdH)
    .attr("rx", 12)
    .style("fill", "color-mix(in srgb, var(--signal) 7%, var(--surface))")
    .style("stroke", "var(--signal)")
    .style("stroke-width", 1);
  const g = svg.append("g");
  o.md.forEach((ln, i) => {
    const t = g
      .append("text")
      .attr("x", 28)
      .attr("y", mdTop + 24 + i * lineH)
      .style("fill", i === 0 ? "var(--signal-fg)" : "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", "20px")
      .style("font-weight", i === 0 ? 700 : 400)
      .text(ln);
    if (!o.reduce) t.style("opacity", 0).transition().duration(300).delay(i * 60).style("opacity", 1);
  });
}

/* --- Node 3: language-confidence bars ----------------------------------- */

function drawLang(
  el: SVGSVGElement,
  o: {
    sampleKey: LangSampleKey;
    reduce: boolean;
    sampleText: string;
    names: Record<string, string>;
    taggedPrefix: string;
    uncertain: string;
  },
) {
  const W = 400;
  const scores = sortedScores(LANG_SAMPLES[o.sampleKey]);
  const top = topLang(scores);
  const confident = isConfident(LANG_SAMPLES[o.sampleKey]);
  const barTop = 60;
  const rowH = 44;
  const tagY = barTop + scores.length * rowH + 14;
  const H = tagY + 18;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 460;

  // the sample text the classifier read
  svg
    .append("text")
    .attr("x", 14)
    .attr("y", 30)
    .style("fill", "var(--fg)")
    .style("font-family", MONO)
    .style("font-size", "18px")
    .text(`“${o.sampleText}”`);

  const trackX = 140;
  const trackW = W - trackX - 58;

  scores.forEach((s, i) => {
    const y = barTop + i * rowH;
    const win = confident && s.code === top.code;
    // language name
    svg
      .append("text")
      .attr("x", 14)
      .attr("y", y + 20)
      .style("fill", win ? "var(--fg)" : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "18px")
      .style("font-weight", win ? 700 : 400)
      .text(o.names[s.code] ?? s.code);
    // track
    svg
      .append("rect")
      .attr("x", trackX)
      .attr("y", y)
      .attr("width", trackW)
      .attr("height", 28)
      .attr("rx", 7)
      .style("fill", "var(--surface)")
      .style("stroke", "var(--border)")
      .style("stroke-width", 1);
    // fill
    const w = Math.max(4, trackW * s.p);
    const bar = svg
      .append("rect")
      .attr("x", trackX)
      .attr("y", y)
      .attr("height", 28)
      .attr("rx", 7)
      .style("fill", win ? "var(--signal)" : "var(--tok-space)")
      .style("opacity", win ? 1 : 0.6);
    if (dur) bar.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", w);
    else bar.attr("width", w);
    // percentage
    const pct = s.p >= 0.01 ? `${Math.round(s.p * 100)}%` : "<1%";
    svg
      .append("text")
      .attr("x", W - 14)
      .attr("y", y + 20)
      .attr("text-anchor", "end")
      .style("fill", win ? "var(--fg)" : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "18px")
      .style("font-weight", win ? 700 : 400)
      .text(pct);
  });

  // verdict
  const tagText = confident ? `→ ${o.taggedPrefix} ${o.names[top.code] ?? top.code} (${top.code})` : `→ ${o.uncertain}`;
  svg
    .append("text")
    .attr("x", 14)
    .attr("y", tagY)
    .style("fill", confident ? "var(--signal-fg)" : "var(--tok-byte)")
    .style("font-family", MONO)
    .style("font-size", "20px")
    .style("font-weight", 700)
    .text(tagText);
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

function useEP() {
  const { t } = useAcademy();
  return t.extractionParsing;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const ep = useEP();
  const n = ep.nodes[0];
  const [on, setOn] = useState(false);
  const y = extractionYield(PAGE_BLOCKS);
  return (
    <SceneShell
      id="ep-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[on ? 1 : 0]}
      controls={
        <ControlRow>
          <Toggle on={on} onClick={() => setOn((v) => !v)} ariaLabel={ep.n1toggle}>
            {ep.n1toggle}: {on ? ep.n1on : ep.n1off}
          </Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawPage(el, { on, reduce, labels: ep.n1blockLabels, summaryOff: ep.n1summaryOff, summaryOn: ep.n1summaryOn })}
          deps={[on, reduce, y.keptBlocks]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const ep = useEP();
  const n = ep.nodes[1];
  const [idx, setIdx] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => { setIdx(i); manual.current = true; };
  const key: FormatKey = FORMAT_KEYS[idx];
  return (
    <SceneShell
      id="ep-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={FORMAT_KEYS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Deeper title={ep.n2deeperTitle}>{ep.n2deeperBody}</Deeper>}
      controls={
        <ControlRow>
          {ep.n2formats.map((lab, i) => (
            <Toggle key={i} on={idx === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawFormat(el, { key, reduce, rawLabel: ep.n2rawLabel, mdLabel: ep.n2mdLabel, technique: ep.n2techniques[idx], md: ep.n2output[idx], formatLabel: ep.n2formats[idx] })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const ep = useEP();
  const n = ep.nodes[2];
  const [idx, setIdx] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => { setIdx(i); manual.current = true; };
  const sampleKey: LangSampleKey = LANG_SAMPLE_KEYS[idx];
  const sample = ep.n3samples[idx];
  return (
    <SceneShell
      id="ep-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={LANG_SAMPLE_KEYS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Callout label={ep.calloutFastLabel} title={ep.calloutFastTitle}>{ep.calloutFastBody}</Callout>}
      controls={
        <ControlRow>
          {ep.n3samples.map((s, i) => (
            <Toggle key={s.key} on={idx === i} onClick={() => pick(i)}>{s.label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawLang(el, { sampleKey, reduce, sampleText: sample.text, names: ep.n3langNames, taggedPrefix: ep.n3taggedPrefix, uncertain: ep.n3uncertain })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function ExtractionParsing() {
  const { t, lang } = useAcademy();
  const ep = t.extractionParsing;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{ep.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {ep.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{ep.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{ep.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {ep.pipeline.map((label, i) => (
              <a key={i} href={`#ep-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{ep.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{ep.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(ep.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{ep.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(ep.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/quality-filtering" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {ep.prevLesson}</Link>
        <Link href="/stage/0/classifier-scoring" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{ep.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
