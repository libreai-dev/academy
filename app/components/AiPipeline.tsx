"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { C, MONO, SANS } from "../lib/site";
import { DEMO, publisherHue } from "../lib/ai-overviews";

/**
 * Interactive pipeline for "How AI Overviews work": step through the five stages
 * that turn one question into a cited answer — query fan-out → live retrieval →
 * dedup & rank → grounded synthesis → guardrails. A cumulative d3 diagram grows
 * one stage at a time; the last stage has an evidence toggle (publish vs abstain).
 */

const GREEN = "var(--signal)";
const GREEN_FG = "var(--signal-fg)";

const STAGES: { title: string; body: string }[] = [
  { title: "Query fan-out", body: "Your one question becomes several. The system rewrites it into sub-queries, so it searches the way a curious person would — not just the literal words you typed." },
  { title: "Live retrieval", body: "Each sub-query hits a fresh index — the open web and news — and pulls back candidate passages. Notice the near-duplicates: the same story shows up more than once." },
  { title: "Dedup & rank", body: "Near-identical results collapse into one, and what's left is ranked by recency and authority. This is where 'up-to-date' is actually won." },
  { title: "Grounded synthesis", body: "The model writes the answer from the top sources — every claim tied to the source that backs it, so the sources can ride along and be checked." },
  { title: "Guardrails", body: "Enough agreeing evidence? Publish with citations. Too thin or conflicting? A good system abstains instead of guessing — grounding is measurable, and gate-able." },
];

// candidate docs at retrieval: some map to the same final source (duplicates)
const CANDIDATES = ["s1", "s2", "s1", "s3", "s2", "s4", "s3"];

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function draw(el: SVGSVGElement, step: number, thin: boolean, reduce: boolean) {
  const W = 720;
  const H = 388;
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = reduce ? 0 : 450;

  const hueOf = (id: string) => publisherHue(DEMO.sources.find((s) => s.id === id)?.publisher ?? "");
  const pubOf = (id: string) => DEMO.sources.find((s) => s.id === id)?.publisher ?? "";

  type Sel = d3.Selection<any, unknown, null, undefined>;
  const pill = (p: Sel, x: number, y: number, w: number, h: number, fill: string, stroke: string) =>
    p.append("rect").attr("x", x - w / 2).attr("y", y - h / 2).attr("width", w).attr("height", h)
      .attr("rx", h / 2).style("fill", fill).style("stroke", stroke).style("stroke-width", 1.5);
  const label = (p: Sel, x: number, y: number, t: string, size: number, fill: string, weight = 400) =>
    p.append("text").attr("x", x).attr("y", y).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .style("font-family", SANS).style("font-size", `${size}px`).style("font-weight", weight).style("fill", fill).text(t);
  // fade a group in when it's the newly-active stage
  const fadeIn = (g: Sel, on: boolean, delay = 0) => {
    if (!reduce && on) g.style("opacity", 0).transition().delay(delay).duration(dur).style("opacity", 1);
    return g;
  };

  // ── query (always) ──
  const qy = 30;
  pill(svg, 360, qy, 320, 40, C.wash, C.chip);
  label(svg, 360, qy, trunc(DEMO.query, 46), 15, C.ink, 600);

  // ── sub-queries (fan-out; animate on step 0) ──
  const subX = [130, 360, 590];
  const sy = 104;
  DEMO.subQueries.slice(0, 3).forEach((q, i) => {
    const g = svg.append("g");
    g.append("path").attr("d", `M360 ${qy + 20} C360 ${sy - 30}, ${subX[i]} ${sy - 34}, ${subX[i]} ${sy - 18}`)
      .style("fill", "none").style("stroke", step === 0 ? GREEN : C.line).style("stroke-width", 1.5);
    pill(g, subX[i], sy, 200, 32, C.bg, step === 0 ? GREEN : C.chip);
    label(g, subX[i], sy, trunc(q, 26), 12.5, step === 0 ? GREEN_FG : C.muted, 500);
    fadeIn(g, step === 0, i * 70);
  });

  // ── retrieval: candidate dots (only at step 1) ──
  if (step === 1) {
    const cy = 168;
    CANDIDATES.forEach((id, i) => {
      const x = 90 + i * 92;
      const g = svg.append("g");
      g.append("circle").attr("cx", x).attr("cy", cy).attr("r", 13).style("fill", `hsl(${hueOf(id)} 45% 55%)`).style("stroke", C.bg).style("stroke-width", 2);
      label(g, x, cy, pubOf(id)[0], 12, "#fff", 700);
      fadeIn(g, true, i * 55);
    });
    label(svg, 360, cy + 34, "7 candidates · duplicates and low-quality still mixed in", 12, C.faint);
  }

  // ── source cards (step >= 2; animate on step 2) ──
  if (step >= 2) {
    const cardW = 156, cardH = 52, cyC = 176;
    const xs = [98, 268, 438, 608];
    DEMO.sources.forEach((s, i) => {
      const x = xs[i];
      const g = svg.append("g");
      g.append("rect").attr("x", x - cardW / 2).attr("y", cyC - cardH / 2).attr("width", cardW).attr("height", cardH)
        .attr("rx", 9).style("fill", C.bg).style("stroke", C.chip).style("stroke-width", 1.2);
      g.append("rect").attr("x", x - cardW / 2 + 10).attr("y", cyC - 15).attr("width", 16).attr("height", 16).attr("rx", 4)
        .style("fill", `hsl(${hueOf(s.id)} 48% 46%)`);
      g.append("text").attr("x", x - cardW / 2 + 18).attr("y", cyC - 7).attr("text-anchor", "middle").attr("dominant-baseline", "middle")
        .style("font-family", MONO).style("font-size", "10px").style("font-weight", 700).style("fill", "#fff").text(s.publisher[0]);
      g.append("text").attr("x", x - cardW / 2 + 34).attr("y", cyC - 7).attr("dominant-baseline", "middle")
        .style("font-family", MONO).style("font-size", "11px").style("fill", C.faint).text(trunc(s.publisher, 16));
      g.append("text").attr("x", x - cardW / 2 + 10).attr("y", cyC + 13).attr("dominant-baseline", "middle")
        .style("font-family", SANS).style("font-size", "12px").style("fill", C.ink).text(trunc(s.title, 20));
      fadeIn(g, step === 2, i * 70);
    });
    if (step === 2) label(svg, 360, cyC + 42, "deduped to 4 · ranked by recency + authority", 12, GREEN_FG, 500);
  }

  // ── answer + citation links (step >= 3; animate on step 3) ──
  if (step >= 3) {
    const ay = 320;
    const xs = [98, 268, 438, 608];
    const g = svg.append("g");
    xs.forEach((x) => {
      g.append("path").attr("d", `M${x} ${176 + 26} C${x} 270, 360 275, 360 ${ay - 24}`)
        .style("fill", "none").style("stroke", step === 3 ? GREEN : C.line).style("stroke-width", 1.3);
    });
    pill(g, 360, ay, 420, 48, "var(--signal-wash)", GREEN);
    label(g, 360, ay - 6, "Grounded answer", 14, C.ink, 600);
    label(g, 360, ay + 12, "“The newest iPhone is the iPhone 17…” · 4 citations", 12, GREEN_FG);
    fadeIn(g, step === 3);
  }

  // ── guardrails (step 4; animate on entry + on evidence toggle) ──
  if (step >= 4) {
    const gy = 372;
    const g = svg.append("g");
    if (thin) {
      pill(g, 360, gy, 360, 30, "rgba(179,38,30,0.08)", "#d98a84");
      label(g, 360, gy, "⚠ thin / conflicting evidence → abstain (no overview shown)", 12.5, "#b3261e", 600);
    } else {
      pill(g, 360, gy, 320, 30, "var(--signal-wash)", GREEN);
      label(g, 360, gy, "✓ sources agree → published with citations", 12.5, GREEN_FG, 600);
    }
    fadeIn(g, step === 4);
  }
}

export default function AiPipeline() {
  const ref = useRef<SVGSVGElement>(null);
  const [step, setStep] = useState(0);
  const [thin, setThin] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    draw(ref.current, step, thin, reduce);
  }, [step, thin]);

  return (
    <div style={{ fontFamily: SANS, color: C.ink, border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg, padding: "clamp(18px, 3vw, 26px)" }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint }}>
        The pipeline · one question → one cited answer
      </div>

      {/* stage chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0 4px" }}>
        {STAGES.map((s, i) => {
          const on = i === step;
          const done = i < step;
          return (
            <button
              key={s.title}
              type="button"
              onClick={() => setStep(i)}
              aria-pressed={on}
              style={{
                font: "inherit",
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.02em",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 11px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${on ? C.ink : C.chip}`,
                background: on ? C.ink : done ? "var(--signal-wash)" : C.bg,
                color: on ? C.bg : done ? "var(--signal-fg)" : C.faint,
                transition: "all 0.12s ease",
              }}
            >
              <span style={{ opacity: 0.7 }}>{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "stretch", justifyContent: "center", margin: "10px 0 4px" }}>
        <RagRail step={step} />
        <svg ref={ref} role="img" aria-label={`Pipeline diagram, stage ${step + 1}: ${STAGES[step].title}`} style={{ flex: "1 1 auto", minWidth: 0, maxWidth: 660, width: "100%", height: "auto", display: "block" }} />
      </div>

      {/* current-stage explanation */}
      <div style={{ borderTop: `1px solid ${C.hair}`, paddingTop: 14, marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
            <span style={{ fontFamily: MONO, fontSize: 13, color: C.ghost, marginRight: 8 }}>{String(step + 1).padStart(2, "0")}</span>
            {STAGES[step].title}
          </div>
          {step === 4 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint }}>Evidence</span>
              <div style={{ display: "flex", border: `1px solid ${C.chip}`, borderRadius: 8, overflow: "hidden" }}>
                {([["Strong", false], ["Thin", true]] as const).map(([lbl, v]) => (
                  <button key={lbl} type="button" onClick={() => setThin(v)} aria-pressed={thin === v}
                    style={{ font: "inherit", fontFamily: MONO, fontSize: 11, padding: "5px 10px", cursor: "pointer", border: 0, background: thin === v ? C.ink : C.bg, color: thin === v ? C.bg : C.faint }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.muted, maxWidth: "52em", textWrap: "pretty" }}>
          {STAGES[step].body}
        </p>

        {/* prev / next */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="x-hoverink" style={{ font: "inherit", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", background: "none", border: 0, padding: 0, cursor: step === 0 ? "default" : "pointer", color: step === 0 ? C.line : C.faint }}>
            ← Prev
          </button>
          <button type="button" onClick={() => setStep((s) => Math.min(STAGES.length - 1, s + 1))} disabled={step === STAGES.length - 1}
            className="x-hoverink" style={{ font: "inherit", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", background: "none", border: 0, padding: 0, cursor: step === STAGES.length - 1 ? "default" : "pointer", color: step === STAGES.length - 1 ? C.line : C.faint }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

/** Left rail that marks where you are in RAG: Retrieval (fan-out → dedup) vs
 *  Generation (grounded synthesis onward). The active half lights up as you step. */
function RagRail({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 44, flex: "0 0 auto", alignSelf: "stretch" }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: "var(--signal-fg)", fontWeight: 600, textAlign: "center" }}>RAG</div>
      <Zone label="Retrieval" active={step <= 2} grow={3} />
      <Zone label="Generation" active={step >= 3} grow={2} />
    </div>
  );
}

function Zone({ label, active, grow }: { label: string; active: boolean; grow: number }) {
  return (
    <div
      style={{
        flex: `${grow} 1 0`,
        minHeight: 52,
        borderRadius: 10,
        border: `1px solid ${active ? "var(--signal)" : C.chip}`,
        background: active ? "var(--signal-wash)" : C.bg,
        display: "grid",
        placeItems: "center",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
    >
      <span
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: active ? "var(--signal-fg)" : C.faint,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}
