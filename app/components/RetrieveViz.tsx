"use client";

// RetrieveViz — the two-stage funnel for post 03. A d3 diagram draws the
// wide dense-recall list (12 candidates) on the left and the reranked order on
// the right; connector paths make the reorder legible. The chunk ranked #9 by
// vector similarity is the one that actually answers the question, and the
// reranker lifts it to #1 — drawn in signal green on both sides with a bold
// connector. A single slider sets rerank_k (the context budget): rows below the
// budget fade out on the right with a "dropped" tag. All positions are fixed;
// only the kept/dropped styling changes with the slider.

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { C, MONO, SANS } from "../lib/site";

// Dense retrieval order (vector similarity, descending). Realistic-but-
// illustrative scores. Index 8 (dense rank #9) is the answer-bearing chunk —
// an underwriting note on why POL-55012's premium changed.
const DENSE: { id: string; s: number }[] = [
  { id: "claim/88431", s: 0.71 },
  { id: "policy/55012", s: 0.69 },
  { id: "renewal/rates", s: 0.66 },
  { id: "faq/premiums", s: 0.64 },
  { id: "claim/88420", s: 0.61 },
  { id: "policy/55021", s: 0.59 },
  { id: "inspection/12", s: 0.57 },
  { id: "bulletin/naic", s: 0.55 },
  { id: "uw-note/55012", s: 0.53 }, // ← answer, dense rank #9
  { id: "claim/88399", s: 0.51 },
  { id: "policy/54980", s: 0.49 },
  { id: "glossary/rate", s: 0.47 },
];

// Reranked order, best first, as (dense index, rerank score). The answer chunk
// (dense index 8) rises to the top; two other on-topic chunks follow.
const RERANK: { di: number; s: number }[] = [
  { di: 8, s: 0.94 },
  { di: 1, s: 0.88 },
  { di: 0, s: 0.81 },
  { di: 2, s: 0.72 },
  { di: 6, s: 0.63 },
  { di: 3, s: 0.55 },
  { di: 4, s: 0.48 },
  { di: 7, s: 0.44 },
  { di: 5, s: 0.4 },
  { di: 9, s: 0.36 },
  { di: 10, s: 0.31 },
  { di: 11, s: 0.27 },
];

const ANSWER_DI = 8; // dense index of the answer chunk
const N = DENSE.length;

// map dense index → its row on the reranked (right) side
const RIGHT_POS = new Map<number, number>();
RERANK.forEach((r, j) => RIGHT_POS.set(r.di, j));

// ---- layout constants (viewBox units) ----
const W = 360;
const PAD_TOP = 46;
const ROW_STEP = 23;
const ROW_H = 19;
const H = PAD_TOP + N * ROW_STEP + 10;
const LEFT_X = 4;
const COL_W = 152;
const RIGHT_X = 204;
const rowY = (r: number) => PAD_TOP + r * ROW_STEP;
const rowMid = (r: number) => rowY(r) + ROW_H / 2;

function fmt(s: number) {
  return s.toFixed(2);
}

function draw(svg: SVGSVGElement, rerankK: number, reduce: boolean) {
  const sel = d3.select(svg).attr("viewBox", `0 0 ${W} ${H}`);
  sel.selectAll("*").remove();

  const kept = rerankK;
  const dropped = N - rerankK;

  // ---- column headers ----
  sel
    .append("text")
    .attr("x", LEFT_X + 2)
    .attr("y", 16)
    .attr("font-family", MONO)
    .attr("font-size", 12.5)
    .attr("font-weight", 700)
    .style("fill", C.ink)
    .text("Retrieve");
  sel
    .append("text")
    .attr("x", LEFT_X + 2)
    .attr("y", 32)
    .attr("font-family", MONO)
    .attr("font-size", 12)
    .style("fill", C.faint)
    .text("12 candidates · recall");

  sel
    .append("text")
    .attr("x", RIGHT_X + 2)
    .attr("y", 16)
    .attr("font-family", MONO)
    .attr("font-size", 12.5)
    .attr("font-weight", 700)
    .style("fill", C.ink)
    .text("Rerank");
  const rh = sel
    .append("text")
    .attr("x", RIGHT_X + 2)
    .attr("y", 32)
    .attr("font-family", MONO)
    .attr("font-size", 12);
  rh.append("tspan").style("fill", "var(--signal-fg)").text(`kept ${kept}`);
  rh.append("tspan").style("fill", C.faint).text(` · dropped ${dropped}`);

  // ---- connector paths (left dense row → right rerank row) ----
  for (let d = 0; d < N; d++) {
    const yL = rowMid(d);
    const j = RIGHT_POS.get(d) ?? d;
    const yR = rowMid(j);
    const x1 = LEFT_X + COL_W;
    const x2 = RIGHT_X;
    const mx = (x1 + x2) / 2;
    const isAnswer = d === ANSWER_DI;
    const rightDropped = j >= rerankK;
    const path = sel
      .append("path")
      .attr("d", `M${x1},${yL} C${mx},${yL} ${mx},${yR} ${x2},${yR}`)
      .attr("fill", "none")
      .style("stroke", isAnswer ? "var(--signal)" : C.line)
      .style("stroke-width", isAnswer ? 2.2 : 1)
      .style("opacity", isAnswer ? 0.95 : rightDropped ? 0.28 : 0.6);
    if (isAnswer && !reduce) {
      const len = (path.node() as SVGPathElement).getTotalLength();
      path
        .attr("stroke-dasharray", `${len} ${len}`)
        .attr("stroke-dashoffset", len)
        .transition()
        .duration(650)
        .attr("stroke-dashoffset", 0);
    }
  }

  // ---- left column: dense order ----
  DENSE.forEach((c, i) => {
    const isAnswer = i === ANSWER_DI;
    const g = sel.append("g");
    g.append("rect")
      .attr("x", LEFT_X)
      .attr("y", rowY(i))
      .attr("width", COL_W)
      .attr("height", ROW_H)
      .attr("rx", 6)
      .style("fill", isAnswer ? "var(--signal-wash)" : C.bg)
      .style("stroke", isAnswer ? "var(--signal)" : C.line)
      .style("stroke-width", isAnswer ? 1.6 : 1);
    g.append("text")
      .attr("x", LEFT_X + 9)
      .attr("y", rowMid(i))
      .attr("dominant-baseline", "middle")
      .attr("font-family", MONO)
      .attr("font-size", 12)
      .attr("font-weight", isAnswer ? 700 : 500)
      .style("fill", isAnswer ? C.ink : C.body)
      .text(`${i + 1}·${c.id}`);
    g.append("text")
      .attr("x", LEFT_X + COL_W - 9)
      .attr("y", rowMid(i))
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-family", MONO)
      .attr("font-size", 12)
      .style("fill", isAnswer ? "var(--signal-fg)" : C.faint)
      .text(fmt(c.s));
  });

  // ---- right column: reranked order ----
  RERANK.forEach((r, j) => {
    const c = DENSE[r.di];
    const isAnswer = r.di === ANSWER_DI;
    const isDropped = j >= rerankK;
    const g = sel.append("g");
    if (!reduce) g.style("opacity", 0).transition().duration(280).style("opacity", 1);
    g.append("rect")
      .attr("x", RIGHT_X)
      .attr("y", rowY(j))
      .attr("width", COL_W)
      .attr("height", ROW_H)
      .attr("rx", 6)
      .style("fill", isDropped ? C.wash : isAnswer ? "var(--signal-wash)" : C.bg)
      .style("stroke", isDropped ? C.hair : isAnswer ? "var(--signal)" : C.line)
      .style("stroke-width", isAnswer && !isDropped ? 1.6 : 1);
    g.append("text")
      .attr("x", RIGHT_X + 9)
      .attr("y", rowMid(j))
      .attr("dominant-baseline", "middle")
      .attr("font-family", MONO)
      .attr("font-size", 12)
      .attr("font-weight", isAnswer && !isDropped ? 700 : 500)
      .style("fill", isDropped ? C.ghost : isAnswer ? C.ink : C.body)
      .text(`${j + 1}·${c.id}`);
    g.append("text")
      .attr("x", RIGHT_X + COL_W - 9)
      .attr("y", rowMid(j))
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-family", MONO)
      .attr("font-size", 12)
      .style("fill", isDropped ? C.ghost : isAnswer ? "var(--signal-fg)" : C.faint)
      .text(isDropped ? "dropped" : fmt(r.s));
  });

  // ---- budget cut line, just under the last kept row ----
  const cutY = rowY(rerankK) - (ROW_STEP - ROW_H) / 2;
  sel
    .append("line")
    .attr("x1", RIGHT_X - 3)
    .attr("x2", RIGHT_X + COL_W + 3)
    .attr("y1", cutY)
    .attr("y2", cutY)
    .style("stroke", "var(--signal)")
    .style("stroke-width", 1.2)
    .style("stroke-dasharray", "3 3")
    .style("opacity", 0.7);
  sel
    .append("text")
    .attr("x", RIGHT_X + COL_W + 3)
    .attr("y", cutY - 3)
    .attr("text-anchor", "end")
    .attr("font-family", MONO)
    .attr("font-size", 12)
    .style("fill", "var(--signal-fg)")
    .text("context budget");
}

export default function RetrieveViz() {
  const ref = useRef<SVGSVGElement>(null);
  const [rerankK, setRerankK] = useState(5);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (ref.current) draw(ref.current, rerankK, !!reduce);
  }, [rerankK, reduce]);

  const answerSafe = rerankK >= 1; // answer is rerank #1, always kept in 3–8
  const note =
    rerankK <= 3
      ? `Budget ${rerankK}: sharp and cheap, but the net is tight — on-topic chunks below the answer fall out. Cut it too far and a real answer can go with them.`
      : rerankK >= 7
        ? `Budget ${rerankK}: the answer is safe, but you now pay for chunks the model doesn't need — more context isn't more truth.`
        : `Budget ${rerankK}: the underwriting note (vector rank #9) sits comfortably inside the budget — the reranker put it at #1.`;

  return (
    <div
      style={{
        fontFamily: SANS,
        color: C.ink,
        border: `1px solid ${C.hair}`,
        borderRadius: 14,
        background: C.bg,
        padding: "clamp(16px, 3vw, 24px)",
        margin: "22px 0 0",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: C.faint,
        }}
      >
        retrieve → rerank
      </div>

      <svg
        ref={ref}
        role="img"
        aria-label={`Two-stage retrieval. Twelve candidates from vector search on the left; reranked order on the right, keeping the top ${rerankK}. The underwriting note ranked ninth by vectors is reranked first.`}
        style={{ width: "100%", height: "auto", marginTop: 14, display: "block" }}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px 16px",
          marginTop: 18,
        }}
      >
        <label
          htmlFor="rerank-k"
          style={{ fontFamily: MONO, fontSize: 12.5, color: C.body, fontWeight: 600 }}
        >
          Answers kept for the model
        </label>
        <span
          aria-hidden="true"
          style={{
            fontFamily: MONO,
            fontSize: 12.5,
            color: "var(--signal-fg)",
            border: "1px solid var(--signal-fg)",
            background: "var(--signal-wash)",
            borderRadius: 999,
            padding: "2px 10px",
            fontWeight: 700,
          }}
        >
          rerank_k = {rerankK}
        </span>
        <input
          id="rerank-k"
          type="range"
          min={3}
          max={8}
          step={1}
          value={rerankK}
          onChange={(e) => setRerankK(Number(e.target.value))}
          aria-valuetext={`${rerankK} answers kept`}
          style={{ flex: "1 1 200px", minWidth: 160, accentColor: "var(--signal)", cursor: "pointer" }}
        />
      </div>

      <p
        style={{
          margin: "10px 0 0",
          fontFamily: MONO,
          fontSize: 12,
          lineHeight: 1.6,
          color: C.faint,
        }}
      >
        ↳ The reranker reorders all 12; the budget decides how many survive to the model.
      </p>

      <p
        style={{
          margin: "12px 0 0",
          fontSize: 14.5,
          lineHeight: 1.6,
          color: answerSafe ? C.body : C.body,
          maxWidth: "46em",
          textWrap: "pretty",
        }}
      >
        {note}
      </p>

      <p
        style={{
          margin: "14px 0 0",
          fontSize: 14.5,
          lineHeight: 1.65,
          color: C.muted,
          maxWidth: "46em",
          textWrap: "pretty",
        }}
      >
        Vector search is a librarian who fetches every book with the right words on the
        spine. The reranker is the one who opens each book and checks which page actually
        answers you. You need the first pass to be fast; you need the second to be right.
      </p>
    </div>
  );
}
