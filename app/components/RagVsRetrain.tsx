"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { C, MONO, SANS } from "../lib/site";

/**
 * "Why retrieval, not retraining?" — the motivation for RAG. A d3 log time-line
 * dramatises the gulf between dropping a fresh fact into the prompt (~120 ms)
 * and baking it into the weights (~3 weeks), plus stat cards. Part of the
 * "How AI Overviews work" post; teaching graphic, so it uses the editorial
 * palette (not the replica's product palette).
 */

const RETRIEVE_S = 0.12; // ~120 ms to put a page into the prompt
const RETRAIN_S = 1_814_400; // ~3 weeks to retrain
const GREEN = "var(--signal)";
const GREEN_FG = "var(--signal-fg)";

const TICKS: { v: number; l: string }[] = [
  { v: 1, l: "1 s" },
  { v: 60, l: "1 min" },
  { v: 3600, l: "1 hr" },
  { v: 86400, l: "1 day" },
  { v: RETRAIN_S, l: "3 weeks" },
];

function draw(el: SVGSVGElement, gen: number, reduce: boolean) {
  const W = 660;
  const H = 170;
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const x = d3.scaleLog().domain([0.09, 2_100_000]).range([64, W - 28]).clamp(true);
  const yAxis = 104;

  // baseline
  svg.append("line").attr("x1", x(0.09)).attr("x2", x(2_100_000)).attr("y1", yAxis).attr("y2", yAxis)
    .style("stroke", C.line).style("stroke-width", 2);

  // ticks
  const tg = svg.append("g");
  TICKS.forEach((t) => {
    const tx = x(t.v);
    tg.append("line").attr("x1", tx).attr("x2", tx).attr("y1", yAxis - 5).attr("y2", yAxis + 5).style("stroke", C.line).style("stroke-width", 1.5);
    tg.append("text").attr("x", tx).attr("y", yAxis + 22).attr("text-anchor", "middle")
      .style("font-family", MONO).style("font-size", "12px").style("fill", C.faint).text(t.l);
  });

  // caption
  svg.append("text").attr("x", x(0.09)).attr("y", 26).style("font-family", MONO).style("font-size", "12px")
    .style("letter-spacing", "0.06em").style("fill", C.ghost).text("TIME TO GET ONE FRESH FACT TO THE MODEL");

  // gap bracket + label
  svg.append("text").attr("x", (x(RETRIEVE_S) + x(RETRAIN_S)) / 2).attr("y", 58).attr("text-anchor", "middle")
    .style("font-family", MONO).style("font-size", "13px").style("font-weight", 600).style("fill", C.ink)
    .text("~15,000,000× slower →");

  // marker helper
  const marker = (v: number, label: string, color: string, textColor: string) => {
    const g = svg.append("g");
    const cx = x(v);
    g.append("line").attr("x1", cx).attr("x2", cx).attr("y1", 64).attr("y2", yAxis).style("stroke", color).style("stroke-width", 1.5).style("stroke-dasharray", "3 3");
    const dot = g.append("circle").attr("cx", cx).attr("cy", yAxis).attr("r", 8).style("fill", color).style("stroke", C.bg).style("stroke-width", 2);
    g.append("text").attr("x", cx).attr("y", 78).attr("text-anchor", "middle")
      .style("font-family", MONO).style("font-size", "12.5px").style("font-weight", 600).style("fill", textColor).text(label);
    if (!reduce) {
      dot.attr("cx", x(0.09)).transition().duration(700).ease(d3.easeCubicOut).attr("cx", cx);
      g.selectAll("line").attr("x1", x(0.09)).attr("x2", x(0.09)).transition().duration(700).ease(d3.easeCubicOut).attr("x1", cx).attr("x2", cx);
      g.selectAll("text").style("opacity", 0).transition().delay(400).duration(300).style("opacity", 1);
    }
  };

  marker(RETRIEVE_S, "RETRIEVE (RAG)", GREEN, GREEN_FG);
  marker(RETRAIN_S, "RETRAIN", C.ink, C.ink);
}

export default function RagVsRetrain() {
  const ref = useRef<SVGSVGElement>(null);
  const [gen, setGen] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    draw(ref.current, gen, reduce);
  }, [gen]);

  return (
    <div style={{ fontFamily: SANS, color: C.ink, border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg, padding: "clamp(18px, 3vw, 26px)" }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.faint }}>
        Why retrieval, not retraining
      </div>
      <h3 style={{ margin: "10px 0 0", fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
        You can&rsquo;t bake today&rsquo;s news into the weights
      </h3>
      <p style={{ margin: "12px 0 0", fontSize: 17, lineHeight: 1.6, color: C.muted, maxWidth: "48em", textWrap: "pretty" }}>
        A trained model&rsquo;s weights are frozen. Teaching it a fresh fact by
        retraining costs weeks and millions — and it&rsquo;s stale again tomorrow. So
        the fact doesn&rsquo;t go <em>into</em> the model at all: it rides in the prompt.
        That&rsquo;s retrieval — the &ldquo;R&rdquo; in RAG.
      </p>

      <svg ref={ref} role="img" aria-label="A logarithmic time-line: retrieving a fact takes about 120 milliseconds; retraining the model to learn it takes about three weeks." style={{ width: "100%", maxWidth: 640, height: "auto", display: "block", margin: "18px auto 4px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12, marginTop: 14 }}>
        <StatCard
          accent="var(--signal)"
          fg="var(--signal-fg)"
          label="Retrieve (RAG)"
          big="~120 ms"
          rows={["$0 — no training run", "0 weights changed", "Always current"]}
        />
        <StatCard
          accent={C.ink}
          fg={C.ink}
          label="Retrain the model"
          big="~3 weeks"
          rows={["~$12.4M compute", "405B weights rewritten", "Stale again tomorrow"]}
        />
      </div>

      <button
        type="button"
        onClick={() => setGen((g) => g + 1)}
        className="x-hoverink"
        style={{ marginTop: 16, fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint, background: "none", border: 0, padding: 0, cursor: "pointer" }}
      >
        ↻ Replay
      </button>
    </div>
  );
}

function StatCard({ accent, fg, label, big, rows }: { accent: string; fg: string; label: string; big: string; rows: string[] }) {
  return (
    <div style={{ border: `1px solid ${C.hair}`, borderLeft: `3px solid ${accent}`, borderRadius: 10, padding: "14px 16px", background: C.wash }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: fg }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: "6px 0 8px" }}>{big}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
        {rows.map((r) => (
          <li key={r} style={{ fontSize: 14, color: C.muted, lineHeight: 1.45 }}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
