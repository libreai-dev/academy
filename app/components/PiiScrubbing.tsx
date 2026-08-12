"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Callout, Deeper } from "./webscale-kit";
import {
  PII_CATEGORIES,
  CATEGORY_FAMILY,
  DETECTORS,
  countSpans,
  type Detector,
  type Family,
} from "../lib/pii-scrubbing";
import type { PiiLine, PiiProbe, PiiScrubbingLesson } from "../lib/copy/pii-scrubbing";

/* ======================================================================== *
 * Colour per category / detector — all design tokens so both themes hold.
 * ======================================================================== */

const CAT_COLOR: Record<string, string> = {
  email: "var(--tok-num)", //     blue
  phone: "var(--tok-sub)", //     orange
  ssn: "var(--tok-punct)", //     purple
  card: "var(--tok-word)", //     teal
  name: "var(--signal)", //       green
  address: "var(--tok-byte)", //  red
};

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * ======================================================================== */

/* --- Node 1: the two detector families ---------------------------------- */

function drawFamilies(
  el: SVGSVGElement,
  o: {
    types: string[];
    detector: string[];
    examples: string[];
    sel: number;
    patternLabel: string;
    modelLabel: string;
    caughtBy: string;
    reduce: boolean;
  },
) {
  const W = 560;
  const H = 402;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const cols: { label: string; x: number; fam: Family }[] = [
    { label: o.patternLabel, x: 24, fam: "pattern" },
    { label: o.modelLabel, x: 292, fam: "model" },
  ];
  const colW = 244;

  cols.forEach((c) => {
    svg
      .append("text")
      .attr("x", c.x + colW / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("fill", "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "15px")
      .style("letter-spacing", "0.06em")
      .text(c.label);

    const cats = PII_CATEGORIES.map((k, i) => ({ k, i })).filter((d) => CATEGORY_FAMILY[d.k] === c.fam);
    const chipH = 46;
    const gap = 13;
    cats.forEach((d, row) => {
      const y = 52 + row * (chipH + gap);
      const on = d.i === o.sel;
      const col = CAT_COLOR[d.k];
      svg
        .append("rect")
        .attr("x", c.x)
        .attr("y", y)
        .attr("width", colW)
        .attr("height", chipH)
        .attr("rx", 11)
        .style("fill", on ? "var(--signal-wash)" : "var(--surface)")
        .style("stroke", on ? "var(--signal)" : "var(--border)")
        .style("stroke-width", on ? 2.5 : 1);
      // colour dot for the category
      svg
        .append("circle")
        .attr("cx", c.x + 20)
        .attr("cy", y + chipH / 2)
        .attr("r", 6)
        .style("fill", col)
        .style("opacity", on ? 1 : 0.7);
      svg
        .append("text")
        .attr("x", c.x + 38)
        .attr("y", y + chipH / 2 + 6)
        .style("fill", "var(--fg)")
        .style("font-family", MONO)
        .style("font-size", "18px")
        .style("font-weight", on ? 700 : 400)
        .text(o.types[d.i]);
    });
  });

  // detail box for the selected category
  const dy = 300;
  const dh = 82;
  const selCol = CAT_COLOR[PII_CATEGORIES[o.sel]];
  svg
    .append("rect")
    .attr("x", 24)
    .attr("y", dy)
    .attr("width", W - 48)
    .attr("height", dh)
    .attr("rx", 13)
    .style("fill", "var(--bg)")
    .style("stroke", selCol)
    .style("stroke-width", 1.5);
  svg
    .append("rect")
    .attr("x", 24)
    .attr("y", dy)
    .attr("width", 6)
    .attr("height", dh)
    .style("fill", selCol);
  svg
    .append("text")
    .attr("x", 44)
    .attr("y", dy + 34)
    .style("fill", "var(--fg)")
    .style("font-family", MONO)
    .style("font-size", "22px")
    .style("font-weight", 700)
    .text(o.examples[o.sel]);
  svg
    .append("text")
    .attr("x", 44)
    .attr("y", dy + 62)
    .style("fill", "var(--signal-fg)")
    .style("font-family", MONO)
    .style("font-size", "15px")
    .text(`${o.caughtBy}: ${o.detector[o.sel]}`);
}

/* --- Node 2: the document, detected then masked ------------------------- */

function drawDoc(
  el: SVGSVGElement,
  o: {
    lines: PiiLine[];
    step: number;
    active: Record<Detector, boolean>;
    placeholders: Record<Detector, string>;
    removedWord: string;
    leakedWord: string;
    reduce: boolean;
  },
) {
  const W = 560;
  const fontSize = 24;
  const charW = 14.35; // JetBrains Mono advance at this size
  const x0 = 26;
  const top = 46;
  const lineH = 42;
  const H = top + o.lines.length * lineH + 44;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  o.lines.forEach((line, li) => {
    const baseline = top + li * lineH;
    let cursor = x0;
    line.forEach((seg) => {
      const det = seg.det;
      const isPii = !!det;
      const on = isPii && o.active[det as Detector];
      let display = seg.text;
      let textColor = "var(--fg)";
      let rectCol: string | null = null;
      let strong = false;
      if (isPii && det) {
        const col = CAT_COLOR[det];
        if (on) {
          rectCol = col;
          if (o.step === 1) {
            display = o.placeholders[det];
            textColor = col;
            strong = true;
          }
        } else {
          textColor = "var(--tok-byte)"; // leaked into the corpus
        }
      }
      const wpx = display.length * charW;
      if (rectCol) {
        svg
          .append("rect")
          .attr("x", cursor - 4)
          .attr("y", baseline - 21)
          .attr("width", wpx + 8)
          .attr("height", 30)
          .attr("rx", 6)
          .style("fill", `color-mix(in srgb, ${rectCol} ${o.step === 1 ? 22 : 15}%, transparent)`)
          .style("stroke", rectCol)
          .style("stroke-width", 1.4);
      }
      svg
        .append("text")
        .attr("x", cursor)
        .attr("y", baseline)
        .style("fill", textColor)
        .style("font-family", MONO)
        .style("font-size", `${fontSize}px`)
        .style("font-weight", strong ? 700 : 400)
        .text(display);
      // dashed underline marks a leaked span
      if (isPii && !on) {
        svg
          .append("line")
          .attr("x1", cursor)
          .attr("y1", baseline + 6)
          .attr("x2", cursor + wpx)
          .attr("y2", baseline + 6)
          .style("stroke", "var(--tok-byte)")
          .style("stroke-width", 1.6)
          .style("stroke-dasharray", "4 3");
      }
      cursor += wpx;
    });
  });

  // footer count
  const tally = countSpans(o.lines, o.active);
  const fy = top + o.lines.length * lineH + 14;
  const t = svg.append("text").attr("x", x0).attr("y", fy).style("font-family", MONO).style("font-size", "22px");
  t.append("tspan").style("fill", "var(--signal-fg)").style("font-weight", 700).text(`${tally.caught}/${tally.total} ${o.removedWord}`);
  t.append("tspan").style("fill", "var(--muted)").text("  ·  ");
  t.append("tspan").style("fill", tally.leaked > 0 ? "var(--tok-byte)" : "var(--muted)").style("font-weight", tally.leaked > 0 ? 700 : 400).text(`${tally.leaked} ${o.leakedWord}`);
}

/* ======================================================================== *
 * Small shared render helper.
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

function usePii(): PiiScrubbingLesson {
  const { t } = useAcademy();
  return t.piiScrubbing;
}

/* --- Node 3 centrepiece: prompt beside the model's output --------------- */

function ProbePanels({ lesson, probe, mode }: { lesson: PiiScrubbingLesson; probe: PiiProbe; mode: "raw" | "scrubbed" }) {
  const bad = mode === "raw";
  const tone = bad ? "var(--tok-byte)" : "var(--signal)";
  const panel = (label: string, border: string, body: React.ReactNode) => (
    <div style={{ border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)", padding: "9px 12px", borderBottom: "1px solid var(--hair)", background: "var(--surface)" }}>{label}</div>
      <div style={{ padding: "12px 13px", fontSize: 14.5, lineHeight: 1.55, minHeight: 92 }}>{body}</div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
      {panel(lesson.n3promptLabel, "var(--border)", <span style={{ color: "var(--fg)" }}>{probe.prompt}</span>)}
      {panel(
        `${lesson.n3outputLabel} · ${bad ? lesson.n3rawTag : lesson.n3scrubbedTag}`,
        tone,
        <span style={{ color: tone, fontWeight: bad ? 700 : 500 }}>{bad ? probe.raw : probe.scrubbed}</span>,
      )}
    </div>
  );
}

/* ======================================================================== *
 * Node components.
 * ======================================================================== */

function Node1({ reduce }: { reduce: boolean }) {
  const lesson = usePii();
  const n = lesson.nodes[0];
  const [sel, setSel] = useState(0);
  return (
    <SceneShell
      id="pii-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[sel]}
      controls={
        <ControlRow>
          {lesson.n1types.map((label, i) => (
            <Toggle key={i} on={sel === i} onClick={() => setSel(i)}>{label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawFamilies(el, { types: lesson.n1types, detector: lesson.n1detector, examples: lesson.n1examples, sel, patternLabel: lesson.n1patternLabel, modelLabel: lesson.n1modelLabel, caughtBy: lesson.n1caughtBy, reduce })}
          deps={[sel, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const lesson = usePii();
  const n = lesson.nodes[1];
  const [active, setActive] = useState<Record<Detector, boolean>>(() =>
    DETECTORS.reduce((acc, d) => ({ ...acc, [d]: true }), {} as Record<Detector, boolean>),
  );
  const [lastDet, setLastDet] = useState(0);
  const toggle = (i: number) => {
    const d = DETECTORS[i];
    setActive((p) => ({ ...p, [d]: !p[d] }));
    setLastDet(i);
  };
  return (
    <SceneShell
      id="pii-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Detect" labelNext="Mask" note={n.optionNotes?.[lastDet]}
      aside={<Deeper title={lesson.deeperTitle}>{lesson.deeperBody.map((p, i) => (<p key={i} style={{ margin: i ? "12px 0 0" : 0 }}>{rich(p)}</p>))}</Deeper>}
      controls={
        <ControlRow>
          {lesson.n2detectors.map((label, i) => (
            <Toggle key={i} on={active[DETECTORS[i]]} onClick={() => toggle(i)}>{label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {(step) => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawDoc(el, { lines: lesson.n2doc, step, active, placeholders: lesson.n2placeholders, removedWord: lesson.n2removed, leakedWord: lesson.n2leaked, reduce })}
          deps={[step, active, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const lesson = usePii();
  const n = lesson.nodes[2];
  const [probeIdx, setProbeIdx] = useState(0);
  const [mode, setMode] = useState<"raw" | "scrubbed">("raw"); // raw first: show the leak
  const probe = lesson.n3probes[probeIdx] ?? lesson.n3probes[0];
  return (
    <SceneShell
      id="pii-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[probeIdx]}
      aside={<Callout label={lesson.calloutLawLabel} title={lesson.calloutLawTitle}>{rich(lesson.calloutLawBody)}</Callout>}
      controls={
        <>
          <ControlRow>
            {lesson.n3probes.map((p, i) => (
              <Toggle key={p.key} on={probeIdx === i} onClick={() => setProbeIdx(i)}>{p.label}</Toggle>
            ))}
          </ControlRow>
          <ControlRow>
            <Toggle on={mode === "raw"} onClick={() => setMode("raw")}>{lesson.n3raw}</Toggle>
            <Toggle on={mode === "scrubbed"} onClick={() => setMode("scrubbed")}>{lesson.n3scrubbed}</Toggle>
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <ProbePanels lesson={lesson} probe={probe} mode={mode} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson.
 * ======================================================================== */

export default function PiiScrubbing() {
  const { t, lang } = useAcademy();
  const lesson = t.piiScrubbing;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{lesson.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {lesson.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{lesson.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{lesson.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 8 }}>
            {lesson.pipeline.map((label, i) => (
              <a key={i} href={`#pii-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{lesson.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{lesson.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(lesson.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{lesson.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(lesson.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {lesson.prevLesson}</Link>
        <Link href="/stage/0/bin-packing" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{lesson.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
