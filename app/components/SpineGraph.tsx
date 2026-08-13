"use client";

// SpineGraph — the read path as a clickable stepper over the six LangGraph
// nodes (fan_out → retrieve → rerank → ground → guardrails → audit). A d3 rail
// draws the graph; a side panel reveals what each node produced for the fixed
// example question, "Why did the premium on POL-55012 go up?" as an adjuster.

import * as d3 from "d3";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { C, MONO, SANS } from "../lib/site";

type Artifact = { title: string; lines: { text: string; muted?: boolean; strike?: boolean }[] };

const NODES = ["fan_out", "retrieve", "rerank", "ground", "guardrails", "audit"] as const;

const ARTIFACTS: Artifact[] = [
  {
    title: "One question becomes several",
    lines: [
      { text: '"POL-55012 premium increase reason"' },
      { text: '"POL-55012 recent claims"' },
      { text: '"POL-55012 rating factors changed"' },
    ],
  },
  {
    title: "Retrieve — filtered to scope acme__prod, role adjuster",
    lines: [
      { text: "claim/88431 — water damage" },
      { text: "policy/POL-55012 — renewal rating" },
      { text: "underwriting/POL-55012-memo — filtered out (role: underwriter)", muted: true, strike: true },
    ],
  },
  {
    title: "Rerank — the causal passage rises to the top",
    lines: [
      { text: "1 · claim/88431  (was #2)" },
      { text: "2 · policy/POL-55012  (was #1)" },
    ],
  },
  {
    title: "Ground — answer drafted only from the retrieved passages",
    lines: [
      { text: "POL-55012's premium rose at renewal after a" },
      { text: "water-damage claim (claim 88431) changed its" },
      { text: "rating tier. [1][2]" },
    ],
  },
  {
    title: "Guardrails — score, then publish or abstain",
    lines: [
      { text: "groundedness 0.91  ·  threshold 0.65" },
      { text: "above threshold → not abstained" },
      { text: "no PII leak · no injection" },
    ],
  },
  {
    title: "Audit — an immutable row, every query",
    lines: [
      { text: "user u_demo · scope acme__prod" },
      { text: "retrieved [claim/88431, policy/POL-55012]" },
      { text: "groundedness 0.91 · answer_hash sha256:…" },
    ],
  },
];

function draw(svg: SVGSVGElement, step: number, reduce: boolean) {
  const W = 220;
  const n = NODES.length;
  const padY = 26;
  const gap = 52;
  const H = padY * 2 + gap * (n - 1);
  const cx = 78;

  const sel = d3.select(svg).attr("viewBox", `0 0 ${W} ${H}`);
  sel.selectAll("*").remove();

  // edges
  for (let i = 0; i < n - 1; i++) {
    const y1 = padY + gap * i;
    const y2 = padY + gap * (i + 1);
    sel
      .append("line")
      .attr("x1", cx)
      .attr("y1", y1 + 12)
      .attr("x2", cx)
      .attr("y2", y2 - 12)
      .attr("stroke", i < step ? "var(--signal)" : C.line)
      .attr("stroke-width", 1.5);
  }

  NODES.forEach((id, i) => {
    const y = padY + gap * i;
    const active = i === step;
    const done = i < step;
    const g = sel.append("g");

    const box = g
      .append("rect")
      .attr("x", cx - 12)
      .attr("y", y - 12)
      .attr("width", 24)
      .attr("height", 24)
      .attr("rx", 7)
      .attr("fill", active ? "var(--signal)" : done ? "var(--signal-wash)" : C.bg)
      .attr("stroke", active ? "var(--signal)" : done ? "var(--signal-fg)" : C.line)
      .attr("stroke-width", 1.5);

    if (active && !reduce) {
      box
        .attr("transform", "scale(0.9)")
        .attr("transform-origin", `${cx}px ${y}px`)
        .transition()
        .duration(220)
        .attr("transform", "scale(1)");
    }

    g.append("text")
      .attr("x", cx)
      .attr("y", y + 1)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-family", MONO)
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("fill", active ? "#fff" : done ? "var(--signal-fg)" : C.ghost)
      .text(done ? "✓" : String(i + 1));

    g.append("text")
      .attr("x", cx + 22)
      .attr("y", y + 1)
      .attr("dominant-baseline", "middle")
      .attr("font-family", MONO)
      .attr("font-size", 13)
      .attr("font-weight", active ? 700 : 500)
      .attr("fill", active ? C.ink : done ? C.body : C.ghost)
      .text(id);
  });
}

export default function SpineGraph() {
  const ref = useRef<SVGSVGElement>(null);
  const [step, setStep] = useState(0);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (ref.current) draw(ref.current, step, !!reduce);
  }, [step, reduce]);

  const art = ARTIFACTS[step];

  return (
    <div
      style={{
        fontFamily: SANS,
        color: C.ink,
        border: `1px solid ${C.hair}`,
        borderRadius: 14,
        background: C.bg,
        padding: "clamp(16px, 3vw, 24px)",
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
        query graph
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(16px, 3vw, 28px)",
          marginTop: 14,
          alignItems: "flex-start",
        }}
      >
        <svg
          ref={ref}
          role="img"
          aria-label={`Query pipeline, node ${step + 1} of ${NODES.length}: ${NODES[step]}`}
          style={{ width: 200, maxWidth: "100%", height: "auto", flex: "0 0 auto" }}
        />
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.ghost }}>
            {String(step + 1).padStart(2, "0")} / {NODES.length}
          </div>
          <h3 style={{ margin: "6px 0 12px", fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", color: C.ink }}>
            {art.title}
          </h3>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 12.5,
              lineHeight: 1.7,
              background: "var(--readout-bg)",
              color: "var(--readout-fg)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            {art.lines.map((l, i) => (
              <div
                key={i}
                style={{
                  color: l.muted ? "var(--readout-muted)" : "var(--readout-fg)",
                  textDecoration: l.strike ? "line-through" : "none",
                }}
              >
                {l.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={navBtn(step === 0)}
        >
          ‹ Prev
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(NODES.length - 1, s + 1))}
          disabled={step === NODES.length - 1}
          style={navBtn(step === NODES.length - 1)}
        >
          Next ›
        </button>
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.faint, letterSpacing: "0.04em" }}>
          {step === NODES.length - 1 ? "cited answer, audited" : `next: ${NODES[step + 1]}`}
        </span>
      </div>
    </div>
  );
}

function navBtn(disabled: boolean): CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.03em",
    border: `1px solid ${C.line}`,
    background: C.bg,
    color: disabled ? C.ghost : C.body,
    padding: "8px 13px",
    borderRadius: 9,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}
