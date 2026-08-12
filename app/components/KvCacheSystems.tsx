"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import {
  TOTAL_BLOCKS,
  N1_RESERVE_MIN,
  N1_RESERVE_MAX,
  computeFrag,
  N2_MAX_REQ,
  N2_PAGE,
  computePaging,
  N3_PREFIX,
  N3_MIN_REQ,
  N3_MAX_REQ,
  computeRadix,
} from "../lib/kv-cache-systems";

/* ======================================================================== *
 * Diagrams — one <svg> mount each, pure d3 (no JSX shapes). Colour via
 * .style() so CSS design tokens + theme flips resolve live. viewBox width is
 * 560 so label text stays ≥12px when the card renders on a narrow phone.
 * ======================================================================== */

const VW = 560;
/** Categorical colour per request — reused across the paged + radix diagrams. */
const REQ_COLORS = [
  "var(--tok-num)",
  "var(--tok-sub)",
  "var(--tok-word)",
  "var(--tok-punct)",
  "var(--signal)",
  "var(--tok-byte)",
];

/** A small filled-swatch + label legend item. */
function legend(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x: number,
  y: number,
  fill: string,
  stroke: string,
  dashed: boolean,
  text: string,
) {
  svg
    .append("rect")
    .attr("x", x)
    .attr("y", y - 13)
    .attr("width", 17)
    .attr("height", 17)
    .attr("rx", 3)
    .style("fill", fill)
    .style("stroke", stroke)
    .style("stroke-width", 1.4)
    .style("stroke-dasharray", dashed ? "3 3" : "none");
  svg
    .append("text")
    .attr("x", x + 24)
    .attr("y", y)
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "20px")
    .text(text);
}

/* --- Node 1: the fragmented strip --------------------------------------- */

function drawFrag(
  el: SVGSVGElement,
  o: {
    reserve: number;
    freeR2: boolean;
    reduce: boolean;
    legUsed: string;
    legReserved: string;
    legFree: string;
    freedTag: string;
  },
) {
  const H = 148;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VW} ${H}`);
  svg.selectAll("*").remove();
  const res = computeFrag(o.reserve, o.freeR2);

  const x0 = 16;
  const span = VW - 32;
  const step = span / TOTAL_BLOCKS;
  const bw = step - 2.5;
  const cellY = 46;
  const cellH = 58;

  // base: every block faint (free surface)
  d3.range(TOTAL_BLOCKS).forEach((b) => {
    svg
      .append("rect")
      .attr("x", x0 + b * step)
      .attr("y", cellY)
      .attr("width", bw)
      .attr("height", cellH)
      .attr("rx", 3)
      .style("fill", "var(--surface)")
      .style("stroke", "var(--hair)")
      .style("stroke-width", 1);
  });

  const dur = o.reduce ? 0 : 320;
  res.slabs.forEach((s) => {
    const midX = x0 + s.start * step + (s.reserve * step) / 2;
    // request id above its slab (freed → muted byte colour)
    svg
      .append("text")
      .attr("x", midX)
      .attr("y", 34)
      .attr("text-anchor", "middle")
      .style("fill", s.freed ? "var(--tok-byte)" : "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", "20px")
      .text(s.id);
    for (let b = s.start; b < s.start + s.reserve && b < TOTAL_BLOCKS; b++) {
      const x = x0 + b * step;
      if (s.freed) {
        svg
          .append("rect")
          .attr("x", x)
          .attr("y", cellY)
          .attr("width", bw)
          .attr("height", cellH)
          .attr("rx", 3)
          .style("fill", "color-mix(in srgb, var(--tok-byte) 12%, transparent)")
          .style("stroke", "var(--tok-byte)")
          .style("stroke-width", 1.2)
          .style("stroke-dasharray", "3 3");
      } else if (b - s.start < s.used) {
        const cell = svg
          .append("rect")
          .attr("x", x)
          .attr("y", cellY)
          .attr("width", bw)
          .attr("height", cellH)
          .attr("rx", 3)
          .style("fill", "var(--signal)");
        if (dur) cell.style("opacity", 0).transition().duration(dur).style("opacity", 1);
      } else {
        svg
          .append("rect")
          .attr("x", x)
          .attr("y", cellY)
          .attr("width", bw)
          .attr("height", cellH)
          .attr("rx", 3)
          .style("fill", "none")
          .style("stroke", "var(--muted)")
          .style("stroke-width", 1.2)
          .style("stroke-dasharray", "3 3");
      }
    }
    if (s.freed) {
      svg
        .append("text")
        .attr("x", midX)
        .attr("y", cellY + cellH / 2 + 6)
        .attr("text-anchor", "middle")
        .style("fill", "var(--tok-byte)")
        .style("font-family", MONO)
        .style("font-size", "18px")
        .text(o.freedTag);
    }
  });

  const ly = 132;
  legend(svg, x0, ly, "var(--signal)", "var(--signal)", false, o.legUsed);
  legend(svg, x0 + 150, ly, "none", "var(--muted)", true, o.legReserved);
  legend(svg, x0 + 330, ly, "var(--surface)", "var(--hair)", false, o.legFree);
}

/* --- Node 2: contiguous strip vs paged grid ----------------------------- */

function drawPaging(
  el: SVGSVGElement,
  o: {
    active: number;
    reduce: boolean;
    contigLabel: string;
    pagedLabel: string;
    legRequest: string;
    legReserved: string;
    rejected: string;
  },
) {
  const H = 256;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VW} ${H}`);
  svg.selectAll("*").remove();
  const r = computePaging(o.active);
  const x0 = 16;
  const span = VW - 32;

  // --- Row A: contiguous ---
  svg
    .append("text")
    .attr("x", x0)
    .attr("y", 24)
    .style("fill", "var(--fg)")
    .style("font-family", MONO)
    .style("font-size", "21px")
    .text(o.contigLabel);
  if (r.contigRejected.length > 0) {
    const names = r.contigRejected.map((i) => `R${i + 1}`).join(", ");
    svg
      .append("text")
      .attr("x", VW - 16)
      .attr("y", 24)
      .attr("text-anchor", "end")
      .style("fill", "var(--tok-byte)")
      .style("font-family", MONO)
      .style("font-size", "18px")
      .text(`${names} ✕ ${o.rejected}`);
  }

  const stepA = span / TOTAL_BLOCKS;
  const bwA = stepA - 2.5;
  const yA = 40;
  const hA = 48;
  d3.range(TOTAL_BLOCKS).forEach((b) => {
    svg
      .append("rect")
      .attr("x", x0 + b * stepA)
      .attr("y", yA)
      .attr("width", bwA)
      .attr("height", hA)
      .attr("rx", 3)
      .style("fill", "var(--surface)")
      .style("stroke", "var(--hair)")
      .style("stroke-width", 1);
  });
  r.contigSlabs.forEach((s) => {
    const col = REQ_COLORS[s.owner % REQ_COLORS.length];
    for (let b = s.start; b < s.start + s.reserve && b < TOTAL_BLOCKS; b++) {
      const x = x0 + b * stepA;
      if (b - s.start < s.used) {
        svg.append("rect").attr("x", x).attr("y", yA).attr("width", bwA).attr("height", hA).attr("rx", 3).style("fill", col);
      } else {
        svg
          .append("rect")
          .attr("x", x)
          .attr("y", yA)
          .attr("width", bwA)
          .attr("height", hA)
          .attr("rx", 3)
          .style("fill", "none")
          .style("stroke", "var(--muted)")
          .style("stroke-width", 1.1)
          .style("stroke-dasharray", "3 3");
      }
    }
  });

  // --- Row B: paged ---
  svg
    .append("text")
    .attr("x", x0)
    .attr("y", 124)
    .style("fill", "var(--fg)")
    .style("font-family", MONO)
    .style("font-size", "21px")
    .text(o.pagedLabel);
  const nPages = TOTAL_BLOCKS / N2_PAGE;
  const stepB = span / nPages;
  const bwB = stepB - 3;
  const yB = 140;
  const hB = 48;
  const dur = o.reduce ? 0 : 300;
  r.pages.forEach((owner, p) => {
    const x = x0 + p * stepB;
    if (owner < 0) {
      svg
        .append("rect")
        .attr("x", x)
        .attr("y", yB)
        .attr("width", bwB)
        .attr("height", hB)
        .attr("rx", 4)
        .style("fill", "var(--surface)")
        .style("stroke", "var(--hair)")
        .style("stroke-width", 1);
    } else {
      const cell = svg
        .append("rect")
        .attr("x", x)
        .attr("y", yB)
        .attr("width", bwB)
        .attr("height", hB)
        .attr("rx", 4)
        .style("fill", REQ_COLORS[owner % REQ_COLORS.length]);
      if (dur) cell.style("opacity", 0).transition().duration(dur).style("opacity", 1);
    }
  });

  legend(svg, x0, 214, "var(--tok-num)", "var(--tok-num)", false, o.legRequest);
  legend(svg, x0, 240, "none", "var(--muted)", true, o.legReserved);
}

/* --- Node 3: separate chains vs a shared radix trunk -------------------- */

function drawRadix(
  el: SVGSVGElement,
  o: {
    active: number;
    share: boolean;
    reduce: boolean;
    title: string;
    prefixTag: string;
    legPrefix: string;
    legUnique: string;
  },
) {
  const r = computeRadix(o.active);
  const bs = 26;
  const gap = 3;
  const bstep = bs + gap;
  const x0 = 18;
  const rowStep = 42;
  const rowsTop = 66;
  const H = rowsTop + o.active * rowStep + 30;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${VW} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 300;

  svg
    .append("text")
    .attr("x", x0)
    .attr("y", 26)
    .style("fill", "var(--fg)")
    .style("font-family", MONO)
    .style("font-size", "21px")
    .text(o.title);

  const blk = (x: number, y: number, fill: string, i = 0) => {
    const cell = svg.append("rect").attr("x", x).attr("y", y).attr("width", bs).attr("height", bs).attr("rx", 4).style("fill", fill);
    if (dur) cell.style("opacity", 0).transition().duration(dur).delay(Math.min(i * 12, 260)).style("opacity", 1);
  };

  if (!o.share) {
    // N separate chains, each repeating the grey prefix.
    r.suffixes.forEach((suf, i) => {
      const y = rowsTop + i * rowStep;
      svg
        .append("text")
        .attr("x", x0)
        .attr("y", y - 8)
        .style("fill", "var(--muted)")
        .style("font-family", MONO)
        .style("font-size", "16px")
        .text(`R${i + 1}`);
      let bi = 0;
      for (let b = 0; b < N3_PREFIX; b++) blk(x0 + bi++ * bstep, y, "var(--tok-space)", b);
      for (let b = 0; b < suf; b++) blk(x0 + bi++ * bstep, y, "var(--signal)", N3_PREFIX + b);
    });
  } else {
    // one shared trunk, branches for the unique suffixes.
    const branchX = x0 + N3_PREFIX * bstep + 22;
    const midY = rowsTop + ((o.active - 1) * rowStep) / 2;
    // prefix tag over the trunk
    svg
      .append("text")
      .attr("x", x0)
      .attr("y", rowsTop - 16)
      .style("fill", "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "16px")
      .text(o.prefixTag);
    // connectors first (under the blocks)
    r.suffixes.forEach((_suf, i) => {
      const y = rowsTop + i * rowStep;
      svg
        .append("path")
        .attr("d", `M ${x0 + N3_PREFIX * bstep - gap} ${midY + bs / 2} C ${branchX - 12} ${midY + bs / 2}, ${branchX - 12} ${y + bs / 2}, ${branchX} ${y + bs / 2}`)
        .style("fill", "none")
        .style("stroke", "var(--border)")
        .style("stroke-width", 1.6);
    });
    // shared trunk (grey), vertically centred
    for (let b = 0; b < N3_PREFIX; b++) blk(x0 + b * bstep, midY, "var(--tok-space)", b);
    // unique suffix branches (green)
    r.suffixes.forEach((suf, i) => {
      const y = rowsTop + i * rowStep;
      for (let b = 0; b < suf; b++) blk(branchX + b * bstep, y, "var(--signal)", b);
    });
  }

  const ly = H - 12;
  legend(svg, x0, ly, "var(--tok-space)", "var(--tok-space)", false, o.legPrefix);
  legend(svg, x0 + 200, ly, "var(--signal)", "var(--signal)", false, o.legUnique);
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

function useKV() {
  const { t } = useAcademy();
  return t.kvCacheSystems;
}

function fmtPct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function Node1({ reduce }: { reduce: boolean }) {
  const kv = useKV();
  const n = kv.nodes[0];
  const [reserve, setReserve] = useState(8);
  const [freeR2, setFreeR2] = useState(false);
  const res = computeFrag(reserve, freeR2);
  return (
    <SceneShell
      id="kv-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={freeR2 ? kv.n1freeNote : n.sliderNote}
      controls={
        <>
          <Slider id="kv-reserve" label={kv.n1reserveLabel} value={reserve} display={`${reserve} blk`} min={N1_RESERVE_MIN} max={N1_RESERVE_MAX} onChange={setReserve} />
          <ControlRow>
            <Toggle on={freeR2} onClick={() => setFreeR2((v) => !v)}>{kv.n1free}: {freeR2 ? "ON" : "OFF"}</Toggle>
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${res.usedBlocks} / ${TOTAL_BLOCKS} · ${fmtPct(res.utilPct)}`, hi: true },
          { k: n.rows[1], v: `${res.emptyReserved} blk` },
          { k: n.rows[2], v: `${res.largestGap} / ${res.freeTotal} free` },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawFrag(el, { reserve, freeR2, reduce, legUsed: kv.n1legUsed, legReserved: kv.n1legReserved, legFree: kv.n1legFree, freedTag: kv.n1freedTag })}
          deps={[reserve, freeR2, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const kv = useKV();
  const n = kv.nodes[1];
  const [active, setActive] = useState(4);
  const r = computePaging(active);
  const contigUtil = r.contigLocked > 0 ? r.contigUsed / r.contigLocked : 0;
  const pagedUtil = r.pagedLocked > 0 ? r.pagedUsed / r.pagedLocked : 0;
  return (
    <SceneShell
      id="kv-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.sliderNote}
      aside={<Callout label={kv.n2callLabel} title={kv.n2callTitle}>{rich(kv.n2callBody)}</Callout>}
      controls={
        <Slider id="kv-active" label={kv.n2slider} value={active} display={`${active}`} min={1} max={N2_MAX_REQ} onChange={setActive} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${fmtPct(contigUtil)} full` },
          { k: n.rows[1], v: `${fmtPct(pagedUtil)} full`, hi: true },
          { k: n.rows[2], v: `${r.contigRejected.length}` },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawPaging(el, { active, reduce, contigLabel: kv.n2contigLabel, pagedLabel: kv.n2pagedLabel, legRequest: kv.n2legRequest, legReserved: kv.n2legReserved, rejected: kv.n2rejected })}
          deps={[active, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const kv = useKV();
  const n = kv.nodes[2];
  const [active, setActive] = useState(4);
  const [share, setShare] = useState(false); // off first: show the duplication
  const r = computeRadix(active);
  return (
    <SceneShell
      id="kv-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[share ? 1 : 0]}
      controls={
        <>
          <Slider id="kv-share-n" label={kv.n3slider} value={active} display={`${active}`} min={N3_MIN_REQ} max={N3_MAX_REQ} onChange={setActive} />
          <ControlRow>
            <Toggle on={share} onClick={() => setShare((v) => !v)}>{kv.n3share}: {share ? "ON" : "OFF"}</Toggle>
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${share ? r.storedShared : r.storedNaive} blk`, hi: true },
          { k: n.rows[1], v: `${r.storedNaive} blk` },
          { k: n.rows[2], v: share ? `${r.savedBlocks} blk · ${fmtPct(r.savedPct)}` : "0%" },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawRadix(el, { active, share, reduce, title: share ? kv.n3sharedLabel : kv.n3separateLabel, prefixTag: kv.n3prefixTag, legPrefix: kv.n3legPrefix, legUnique: kv.n3legUnique })}
          deps={[active, share, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

function DeeperBlock({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ maxWidth: 760, margin: "clamp(16px, 2vw, 22px) auto 0" }}>
      <Deeper title={title}>{rich(body)}</Deeper>
    </div>
  );
}

export default function KvCacheSystems() {
  const { t, lang } = useAcademy();
  const kv = t.kvCacheSystems;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{kv.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {kv.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{kv.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{kv.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {kv.pipeline.map((label, i) => (
              <a key={i} href={`#kv-node-${i + 1}`} className="u-hover-fg-border"
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
        <div>
          <Node1 reduce={reduce} />
          <DeeperBlock title={kv.n1deeperTitle} body={kv.n1deeperBody} />
        </div>
        <div>
          <Node2 reduce={reduce} />
          <DeeperBlock title={kv.n2deeperTitle} body={kv.n2deeperBody} />
        </div>
        <div>
          <Node3 reduce={reduce} />
          <DeeperBlock title={kv.n3deeperTitle} body={kv.n3deeperBody} />
        </div>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{kv.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{kv.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(kv.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{kv.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(kv.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/verifiable-rewards" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {kv.prevLesson}</Link>
        <Link href="/stage/0/quantization" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{kv.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
