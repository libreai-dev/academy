"use client";

// ChunkViz — the read-path chunking decision, made playable. Two knobs (chunk
// size + overlap) re-chop a real underwriting note live; a d3 rail draws every
// chunk window over a shared character axis, with the answer-bearing sentence
// marked in signal green. The verdict — does the answer survive inside one
// chunk (hit), get torn across a boundary (miss), or drown in a giant chunk
// (buried) — is drawn inside the diagram and echoed in plain language below.

import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { C, MONO, SANS } from "../lib/site";

// A lightly-redacted underwriting narrative — the same doc the repo seeds. The
// emphasized sentence is the answer to "why did the premium on POL-55012 go up?"
const DOC =
  "Underwriting narrative — Policy POL-55012 (Homeowners). Insured property is a single-family dwelling, wood frame construction, built 1998, with a fully updated roof replaced in 2021. The prior policy term was rated at standard tier with no surcharges and a clean loss history. During the most recent term the insured filed claim 88431 for water damage that originated from a failed supply line feeding the second-floor laundry; the paid indemnity on that claim was $14,200. Following claim 88431, the account was re-tiered and the annual premium increased 18% at renewal, reflecting the water-loss history and the absence of a leak-detection device. The underwriter noted the recent roof update as a mitigating factor and recommended offering a leak-detection discount at the next renewal if a monitored device is installed on the main water supply. No other open claims are associated with the policy, and the billing account remains in good standing with no lapses in the past three years.";
const ANSWER =
  "Following claim 88431, the account was re-tiered and the annual premium increased 18% at renewal, reflecting the water-loss history and the absence of a leak-detection device.";

const N = DOC.length;
const A_START = DOC.indexOf(ANSWER);
const A_END = A_START + ANSWER.length;

const SIZE_MIN = 120;
const SIZE_MAX = 1200;
const OVER_MIN = 0;
const OVER_MAX = 300;
const MAX_ROWS = 9;

type Chunk = { start: number; end: number };
type State = "hit" | "miss" | "buried";

type Verdict = {
  chunks: Chunk[];
  state: State;
  containing: number; // index of the chunk that fully holds the answer, or -1
  splitAt: number; // char offset where a boundary tears the answer (miss only)
};

function chunksFor(size: number, overlap: number): Chunk[] {
  const step = Math.max(1, size - overlap);
  const out: Chunk[] = [];
  let start = 0;
  // Mirrors the real NaiveChunker loop: fixed window, slide by (size - overlap).
  while (start < N && out.length < 400) {
    out.push({ start, end: Math.min(start + size, N) });
    start += step;
  }
  return out;
}

function verdictFor(size: number, overlap: number): Verdict {
  const chunks = chunksFor(size, overlap);
  const containing = chunks.findIndex((c) => c.start <= A_START && c.end >= A_END);
  const hit = containing >= 0;
  const state: State = !hit ? "miss" : chunks.length === 1 ? "buried" : "hit";

  // For a miss, find where the tear falls: the end of the chunk that covers the
  // answer's first character. That end lands inside the answer sentence.
  let splitAt = A_END;
  if (!hit) {
    const covering = chunks.filter((c) => c.start <= A_START);
    const cover = covering[covering.length - 1];
    if (cover && cover.end > A_START && cover.end < A_END) splitAt = cover.end;
  }
  return { chunks, state, containing, splitAt };
}

// Which contiguous window of chunks to draw so the answer region is always shown.
function visibleWindow(chunks: Chunk[]): [number, number] {
  const touching = chunks
    .map((c, i) => (c.end > A_START && c.start < A_END ? i : -1))
    .filter((i) => i >= 0);
  const first = touching.length ? touching[0] : 0;
  const last = touching.length ? touching[touching.length - 1] : chunks.length - 1;
  let startIdx = Math.max(0, first - 1);
  if (last - startIdx + 1 > MAX_ROWS) startIdx = Math.max(0, last - MAX_ROWS + 1);
  const endIdx = Math.min(chunks.length - 1, startIdx + MAX_ROWS - 1);
  return [startIdx, endIdx];
}

function draw(svg: SVGSVGElement, width: number, v: Verdict, reduce: boolean) {
  const padL = 12;
  const padR = 12;
  const labelW = 62;
  const trackL = padL + labelW;
  const trackR = width - padR;
  const [startIdx, endIdx] = visibleWindow(v.chunks);
  const rows = endIdx - startIdx + 1;

  const headerY = 18;
  const rowsTop = 46;
  const rowH = 26;
  const barH = 15;
  const hidden = v.chunks.length - rows;
  const height = rowsTop + rows * rowH + (hidden > 0 ? 22 : 10);

  const x = (char: number) => trackL + (char / N) * (trackR - trackL);

  const sel = d3.select(svg).attr("viewBox", `0 0 ${width} ${height}`);
  sel.selectAll("*").remove();

  // ── header: chunk count (left) + verdict badge (right) ──
  sel
    .append("text")
    .attr("x", padL)
    .attr("y", headerY)
    .attr("font-family", MONO)
    .attr("font-size", 12.5)
    .attr("fill", C.faint)
    .text(`${v.chunks.length} chunk${v.chunks.length === 1 ? "" : "s"}`);

  const badge =
    v.state === "hit"
      ? { label: "✓ answer intact", color: "var(--signal)", fg: "var(--signal-fg)" }
      : v.state === "miss"
        ? { label: "✕ answer split", color: "var(--tok-byte)", fg: "var(--tok-byte)" }
        : { label: "⚠ answer buried", color: "var(--tok-sub)", fg: "var(--tok-sub)" };

  const bw = badge.label.length * 7.7 + 20;
  const bg = sel.append("g");
  bg.append("rect")
    .attr("x", trackR - bw)
    .attr("y", headerY - 14)
    .attr("width", bw)
    .attr("height", 20)
    .attr("rx", 6)
    .attr("fill", "none")
    .attr("stroke", badge.color)
    .attr("stroke-width", 1.4);
  bg.append("text")
    .attr("x", trackR - bw / 2)
    .attr("y", headerY - 0.5)
    .attr("text-anchor", "middle")
    .attr("font-family", MONO)
    .attr("font-size", 12.5)
    .attr("font-weight", 700)
    .attr("fill", badge.fg)
    .text(badge.label);

  // ── answer stripe: a vertical band across every row ──
  const stripeTop = rowsTop - 6;
  const stripeBot = rowsTop + rows * rowH;
  sel
    .append("rect")
    .attr("x", x(A_START))
    .attr("y", stripeTop)
    .attr("width", Math.max(2, x(A_END) - x(A_START)))
    .attr("height", stripeBot - stripeTop)
    .attr("fill", "var(--signal-wash)");
  [A_START, A_END].forEach((ch) =>
    sel
      .append("line")
      .attr("x1", x(ch))
      .attr("y1", stripeTop)
      .attr("x2", x(ch))
      .attr("y2", stripeBot)
      .attr("stroke", "var(--signal)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 3"),
  );
  sel
    .append("text")
    .attr("x", x(A_START))
    .attr("y", rowsTop - 12)
    .attr("font-family", MONO)
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .attr("fill", "var(--signal-fg)")
    .text("answer sentence");

  // ── one row per visible chunk ──
  for (let i = 0; i < rows; i++) {
    const gi = startIdx + i;
    const c = v.chunks[gi];
    const rowY = rowsTop + i * rowH;
    const barY = rowY + (rowH - barH) / 2;
    const contains = c.start <= A_START && c.end >= A_END;
    const touches = c.end > A_START && c.start < A_END;
    const cut = touches && !contains;

    let fill: string = C.surface;
    let fillOpacity = 1;
    let stroke: string = C.line;
    let textColor: string = C.ghost;
    if (contains) {
      fill = "var(--signal-wash)";
      stroke = "var(--signal)";
      textColor = "var(--signal-fg)";
    } else if (cut) {
      fill = "var(--tok-byte)";
      fillOpacity = 0.16;
      stroke = "var(--tok-byte)";
      textColor = "var(--tok-byte)";
    }

    sel
      .append("text")
      .attr("x", padL)
      .attr("y", barY + barH * 0.75)
      .attr("font-family", MONO)
      .attr("font-size", 12)
      .attr("font-weight", contains || cut ? 700 : 500)
      .attr("fill", textColor)
      .text(`chunk ${gi + 1}`);

    const bx = x(c.start);
    const bwidth = Math.max(2, x(c.end) - x(c.start));
    const rect = sel
      .append("rect")
      .attr("x", bx)
      .attr("y", barY)
      .attr("height", barH)
      .attr("rx", 4)
      .attr("fill", fill)
      .attr("fill-opacity", fillOpacity)
      .attr("stroke", stroke)
      .attr("stroke-width", contains || cut ? 1.6 : 1);

    if (reduce) {
      rect.attr("width", bwidth);
    } else {
      rect.attr("width", 0).transition().duration(320).attr("width", bwidth);
    }
  }

  if (hidden > 0) {
    sel
      .append("text")
      .attr("x", trackL)
      .attr("y", rowsTop + rows * rowH + 15)
      .attr("font-family", MONO)
      .attr("font-size", 12)
      .attr("fill", C.ghost)
      .text(`+ ${hidden} more chunk${hidden === 1 ? "" : "s"} not shown`);
  }
}

const PRESETS: { label: string; size: number; overlap: number; hint: string }[] = [
  { label: "Repo default", size: 800, overlap: 100, hint: "800 / 100 — the answer lands whole" },
  { label: "Split it", size: 520, overlap: 0, hint: "520 / 0 — a boundary cuts the answer" },
  { label: "One giant chunk", size: 1200, overlap: 100, hint: "1200 / 100 — the whole note in one" },
];

export default function ChunkViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState(800);
  const [overlap, setOverlap] = useState(100);
  const [width, setWidth] = useState(640);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Overlap must stay strictly below size (mirrors the real 0 <= overlap < size guard).
  const maxOverlap = Math.min(OVER_MAX, size - 20);
  const clampedOverlap = Math.min(overlap, maxOverlap);

  const v = useMemo(() => verdictFor(size, clampedOverlap), [size, clampedOverlap]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(280, Math.floor(w)));
    });
    ro.observe(el);
    setWidth(Math.max(280, Math.floor(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (svgRef.current) draw(svgRef.current, width, v, !!reduce);
  }, [width, v, reduce]);

  // Plain-language note + the answer sentence shown whole or torn.
  const note =
    v.state === "hit"
      ? "This split keeps the whole answer sentence inside one chunk, so a search for “why did POL-55012 go up?” can return the reason in full. That is a retrieval hit."
      : v.state === "miss"
        ? "A boundary just sliced the answer sentence in two. One chunk ends mid-fact; the next starts mid-fact. Neither passage answers the question on its own — a retrieval miss no reranker or bigger model can undo."
        : "Now the whole note is one chunk. The answer is in there — but so is the roof, the build year and the discount note. The match is diluted and one noisy passage eats the model’s context budget.";

  const splitRel = v.splitAt - A_START;
  const answerLeft = ANSWER.slice(0, splitRel);
  const answerRight = ANSWER.slice(splitRel);

  const badgeColor =
    v.state === "hit" ? "var(--signal-fg)" : v.state === "miss" ? "var(--tok-byte)" : "var(--tok-sub)";

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
        chunk the document
      </div>

      {/* presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {PRESETS.map((pre) => {
          const on = size === pre.size && clampedOverlap === Math.min(pre.overlap, pre.size - 20);
          return (
            <button
              key={pre.label}
              type="button"
              onClick={() => {
                setSize(pre.size);
                setOverlap(pre.overlap);
              }}
              title={pre.hint}
              style={presetBtn(on)}
            >
              {pre.label}
            </button>
          );
        })}
      </div>

      {/* the d3 rail */}
      <div ref={wrapRef} style={{ marginTop: 16 }}>
        <svg
          ref={svgRef}
          role="img"
          aria-label={`Chunking the document at size ${size} and overlap ${clampedOverlap}: ${
            v.state === "hit" ? "answer intact" : v.state === "miss" ? "answer split across a boundary" : "answer buried in one large chunk"
          }`}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(16px, 4vw, 32px)", marginTop: 18 }}>
        <label style={ctrl}>
          <span style={ctrlLabel}>
            Chunk size <span style={{ color: C.ghost }}>· {size} chars</span>
          </span>
          <input
            type="range"
            min={SIZE_MIN}
            max={SIZE_MAX}
            step={20}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--signal)" }}
          />
        </label>
        <label style={ctrl}>
          <span style={ctrlLabel}>
            Overlap <span style={{ color: C.ghost }}>· {clampedOverlap} chars</span>
          </span>
          <input
            type="range"
            min={OVER_MIN}
            max={OVER_MAX}
            step={10}
            value={clampedOverlap}
            onChange={(e) => setOverlap(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--signal)" }}
          />
        </label>
      </div>

      <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.6, color: C.faint, maxWidth: "44em" }}>
        ↳ Small chunks fracture the fact; big chunks bury it. Overlap is what saves a fact sitting on a boundary.
      </p>

      {/* the answer sentence, whole or torn — the concrete payload */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          border: `1px solid ${C.hair}`,
          borderRadius: 10,
          background: C.surface,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: badgeColor }}>
          {v.state === "hit"
            ? `The answer, whole in chunk ${v.containing + 1}`
            : v.state === "miss"
              ? "The answer, torn at a chunk boundary"
              : "The answer, buried in one oversized chunk"}
        </div>
        <p style={{ margin: "8px 0 0", fontFamily: MONO, fontSize: 13, lineHeight: 1.7, color: C.body, textWrap: "pretty" }}>
          {v.state === "miss" ? (
            <>
              <span style={{ background: "var(--signal-wash)" }}>{answerLeft}</span>
              <span style={{ color: "var(--tok-byte)", fontWeight: 700 }}> ✂ </span>
              <span style={{ background: "rgba(192,80,79,0.14)" }}>{answerRight}</span>
            </>
          ) : (
            <span style={{ background: "var(--signal-wash)" }}>{ANSWER}</span>
          )}
        </p>
      </div>

      {/* plain-language verdict, announced for AT */}
      <p aria-live="polite" style={{ margin: "14px 0 0", fontSize: 15.5, lineHeight: 1.65, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
        {note}
      </p>
    </div>
  );
}

const ctrl: CSSProperties = { flex: "1 1 220px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 };
const ctrlLabel: CSSProperties = { fontFamily: MONO, fontSize: 12.5, color: C.body, letterSpacing: "0.02em" };

function presetBtn(on: boolean): CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: on ? 700 : 500,
    letterSpacing: "0.02em",
    border: `1px solid ${on ? "var(--signal-fg)" : C.line}`,
    background: on ? "var(--signal-wash)" : C.bg,
    color: on ? "var(--signal-fg)" : C.body,
    padding: "7px 12px",
    borderRadius: 999,
    cursor: "pointer",
  };
}
