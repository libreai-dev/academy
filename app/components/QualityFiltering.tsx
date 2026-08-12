"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider } from "./webscale-kit";
import {
  ARCHETYPES,
  BLOCK_KINDS,
  totalChars,
  type BlockKind,
  RULES,
  type RuleKey,
  DOCS,
  judgeAll,
  type Verdict,
  funnel,
  RAW_TOKENS,
} from "../lib/quality-filtering";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * ======================================================================== */

function blockFill(k: BlockKind): string {
  switch (k) {
    case "prose":
      return "var(--signal)";
    case "nav":
      return "var(--tok-space)";
    case "ad":
      return "var(--tok-byte)";
    case "junk":
      return "var(--tok-byte)";
    case "boilerplate":
      return "var(--tok-punct)";
  }
}

/* --- Node 1: the extracted page, stacked and sized by text ---------------- */

function drawDoc(
  el: SVGSVGElement,
  o: { archetypeIdx: number; kindLabels: string[]; proseTag: string; reduce: boolean },
) {
  const W = 760;
  const H = 384;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const a = ARCHETYPES[o.archetypeIdx];
  const total = totalChars(a);
  const top = 22;
  const gap = 9;
  const x = 96;
  const w = W - x - 196; // right gutter reserved for the prose tag
  const usable = H - top * 2 - gap * (a.blocks.length - 1);
  const dur = o.reduce ? 0 : 420;

  let y = top;
  a.blocks.forEach((b, i) => {
    const h = Math.max(18, (b.chars / total) * usable);
    const prose = b.kind === "prose";
    const pct = Math.round((b.chars / total) * 100);
    const label = o.kindLabels[BLOCK_KINDS.indexOf(b.kind)];

    const rect = svg
      .append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .attr("rx", 6)
      .style("fill", blockFill(b.kind))
      .style("fill-opacity", prose ? 1 : 0.16)
      .style("stroke", prose ? "var(--signal)" : "var(--border)")
      .style("stroke-width", prose ? 2.5 : 1);
    if (dur) rect.style("opacity", 0).transition().duration(dur).delay(i * 40).style("opacity", 1);

    // left label — the kind name
    svg
      .append("text")
      .attr("x", x - 12)
      .attr("y", y + h / 2 + 4)
      .attr("text-anchor", "end")
      .style("fill", prose ? "var(--signal-fg)" : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "12.5px")
      .style("font-weight", prose ? 700 : 400)
      .text(label);

    // percentage inside the block when tall enough
    if (h >= 22) {
      svg
        .append("text")
        .attr("x", x + 13)
        .attr("y", y + h / 2 + 5)
        .attr("text-anchor", "start")
        .style("fill", prose ? "#0a0a09" : "var(--fg)")
        .style("font-family", MONO)
        .style("font-size", "13px")
        .style("font-weight", prose ? 700 : 600)
        .style("opacity", prose ? 1 : 0.72)
        .text(`${pct}%`);
    }

    // the prose tag, out in the right gutter
    if (prose) {
      svg
        .append("text")
        .attr("x", x + w + 12)
        .attr("y", y + h / 2 + 5)
        .attr("text-anchor", "start")
        .style("fill", "var(--signal-fg)")
        .style("font-family", MONO)
        .style("font-size", "12.5px")
        .style("font-weight", 700)
        .text(`← ${o.proseTag}`);
    }

    y += h + gap;
  });
}

/* --- Node 2: the document filter grid ------------------------------------- */

function trunc(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s;
  return s.slice(0, Math.max(1, maxChars - 1)) + "…";
}

function drawGates(
  el: SVGSVGElement,
  o: {
    verdicts: Verdict[];
    docLabels: string[];
    samples: string[];
    ruleLabels: string[];
    keptWord: string;
    dropWord: string;
    caughtBy: string;
    reduce: boolean;
  },
) {
  const W = 760;
  const H = 336;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const cols = 3;
  const rows = 2;
  const m = 4;
  const gap = 12;
  const cardW = (W - 2 * m - (cols - 1) * gap) / cols;
  const cardH = (H - 2 * m - (rows - 1) * gap) / rows;
  const dur = o.reduce ? 0 : 300;

  o.verdicts.forEach((v, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = m + c * (cardW + gap);
    const y = m + r * (cardH + gap);
    const col = v.kept ? "var(--signal)" : "var(--tok-byte)";

    const card = svg
      .append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", cardW)
      .attr("height", cardH)
      .attr("rx", 12)
      .style("fill", `color-mix(in srgb, ${col} 8%, var(--bg))`)
      .style("stroke", col)
      .style("stroke-width", 1.5);
    if (dur) card.style("opacity", 0).transition().duration(dur).delay(i * 45).style("opacity", 1);

    // document label
    svg
      .append("text")
      .attr("x", x + 15)
      .attr("y", y + 27)
      .style("fill", "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", "13.5px")
      .style("font-weight", 700)
      .text(o.docLabels[i]);

    // sample snippet
    svg
      .append("text")
      .attr("x", x + 15)
      .attr("y", y + 49)
      .style("fill", "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "12px")
      .text(trunc(o.samples[i], Math.floor((cardW - 30) / 6.8)));

    // the rule that caught it, on its own line (dropped only)
    if (!v.kept && v.caughtBy) {
      const ruleLabel = o.ruleLabels[RULES.indexOf(v.caughtBy)];
      svg
        .append("text")
        .attr("x", x + 15)
        .attr("y", y + 73)
        .style("fill", "var(--tok-byte)")
        .style("font-family", MONO)
        .style("font-size", "12px")
        .text(trunc(`${o.caughtBy} ${ruleLabel}`, Math.floor((cardW - 30) / 6.4)));
    }

    // verdict badge (bottom-left)
    const badgeW = 62;
    const badgeH = 24;
    const by = y + cardH - 16 - badgeH;
    svg
      .append("rect")
      .attr("x", x + 15)
      .attr("y", by)
      .attr("width", badgeW)
      .attr("height", badgeH)
      .attr("rx", 7)
      .style("fill", `color-mix(in srgb, ${col} 16%, transparent)`)
      .style("stroke", col)
      .style("stroke-width", 1);
    svg
      .append("text")
      .attr("x", x + 15 + badgeW / 2)
      .attr("y", by + badgeH / 2 + 4.5)
      .attr("text-anchor", "middle")
      .style("fill", col)
      .style("font-family", MONO)
      .style("font-size", "12px")
      .style("font-weight", 700)
      .text(v.kept ? o.keptWord : o.dropWord);
  });
}

/* --- Node 3: the quality funnel ------------------------------------------- */

function drawFunnel(
  el: SVGSVGElement,
  o: {
    strictness: number;
    stageLabels: string[];
    dropLabels: string[];
    keptWord: string;
    rawWord: string;
    unit: string;
    reduce: boolean;
  },
) {
  const W = 760;
  const H = 420;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const { stages } = funnel(o.strictness);
  const cx = 300;
  const maxW = 340;
  const top = 44;
  const rowH = (H - top - 22) / stages.length;
  const dur = o.reduce ? 0 : 460;

  // raw-token caption at the top
  svg
    .append("text")
    .attr("x", cx)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "12.5px")
    .text(`${RAW_TOKENS}${o.unit} ${o.rawWord}`);

  stages.forEach((s, i) => {
    const kept = i === stages.length - 1;
    const y = top + i * rowH;
    const bh = rowH - 16;
    const w = Math.max(72, s.remain * maxW);
    const x = cx - w / 2;
    const pct = Math.round(s.remain * 100);
    const val = (RAW_TOKENS * s.remain).toFixed(s.remain < 0.1 ? 1 : 0);

    const rect = svg
      .append("rect")
      .attr("y", y)
      .attr("height", bh)
      .attr("rx", 8)
      .style("fill", kept ? "var(--signal)" : "var(--surface)")
      .style("stroke", kept ? "var(--signal)" : "var(--border)")
      .style("stroke-width", kept ? 2 : 1);
    if (dur) {
      rect.attr("x", cx).attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("x", x).attr("width", w);
    } else {
      rect.attr("x", x).attr("width", w);
    }

    // short stage label on the left
    svg
      .append("text")
      .attr("x", 16)
      .attr("y", y + bh / 2 + 4)
      .style("fill", kept ? "var(--signal-fg)" : "var(--muted)")
      .style("font-family", MONO)
      .style("font-size", "12.5px")
      .style("font-weight", kept ? 700 : 400)
      .text(o.stageLabels[i]);

    // remaining amount, centred in the band
    svg
      .append("text")
      .attr("x", cx)
      .attr("y", y + bh / 2 + 5)
      .attr("text-anchor", "middle")
      .style("fill", kept ? "#0a0a09" : "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", "13px")
      .style("font-weight", 700)
      .text(kept ? `${o.keptWord} · ${pct}% · ${val}${o.unit}` : `${pct}% · ${val}${o.unit}`);

    // what this stage dropped, in the right gutter
    if (i >= 1) {
      const dpct = Math.round(s.dropped * 100);
      svg
        .append("text")
        .attr("x", W - 16)
        .attr("y", y + bh / 2 + 4)
        .attr("text-anchor", "end")
        .style("fill", "var(--tok-byte)")
        .style("font-family", MONO)
        .style("font-size", "12px")
        .text(`− ${o.dropLabels[i - 1]} ${dpct}%`);
    }
  });
}

/* ======================================================================== *
 * Node components — state + controls + readout, wrapping SceneShell.
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

function useQF() {
  const { t } = useAcademy();
  return t.qualityFiltering;
}

function Node1({ reduce }: { reduce: boolean }) {
  const qf = useQF();
  const n = qf.nodes[0];
  const [idx, setIdx] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => {
    setIdx(i);
    manual.current = true;
  };
  return (
    <SceneShell
      id="qf-node-1"
      index={1}
      total={3}
      eyebrow={n.eyebrow}
      title={n.title}
      intro={n.intro}
      bullets={n.bullets}
      cardLabel={n.cardLabel}
      aria={n.aria}
      steps={3}
      hideStepper
      captions={n.captions}
      hint={n.hint}
      reduce={reduce}
      labelPrev="Previous step"
      labelNext="Next step"
      onStep={(s) => {
        if (!manual.current) setIdx(s);
        manual.current = false;
      }}
      note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {qf.n1archetypes.map((label, i) => (
            <Toggle key={i} on={idx === i} onClick={() => pick(i)}>
              {label}
            </Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawDoc(el, { archetypeIdx: idx, kindLabels: qf.n1kindLabels, proseTag: qf.n1proseTag, reduce })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const qf = useQF();
  const n = qf.nodes[1];
  const [enabled, setEnabled] = useState<Record<RuleKey, boolean>>({
    symbol: true,
    repeat: true,
    wordlen: true,
    stopword: true,
  });
  const [lastRule, setLastRule] = useState(-1);
  const verdicts = judgeAll(enabled);
  const keptN = verdicts.filter((v) => v.kept).length;
  const note = lastRule >= 0 ? n.optionNotes?.[lastRule] : n.sliderNote;

  const toggleRule = (i: number) => {
    const key = RULES[i];
    setEnabled((p) => ({ ...p, [key]: !p[key] }));
    setLastRule(i);
  };

  return (
    <SceneShell
      id="qf-node-2"
      index={2}
      total={3}
      eyebrow={n.eyebrow}
      title={n.title}
      intro={n.intro}
      bullets={n.bullets}
      cardLabel={n.cardLabel}
      aria={n.aria}
      steps={1}
      captions={n.captions}
      hint={n.hint}
      reduce={reduce}
      labelPrev="Previous step"
      labelNext="Next step"
      note={note}
      controls={
        <ControlRow>
          {qf.n2rules.map((label, i) => (
            <Toggle key={i} on={enabled[RULES[i]]} onClick={() => toggleRule(i)}>
              {label}
            </Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout
          title={n.readoutTitle}
          note={n.readoutNote}
          rows={[
            { k: n.rows[0], v: `${keptN} / ${DOCS.length}`, hi: true },
            { k: n.rows[1], v: `${DOCS.length - keptN} / ${DOCS.length}` },
          ]}
        />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) =>
            drawGates(el, {
              verdicts,
              docLabels: qf.n2docs.map((d) => d.label),
              samples: qf.n2docs.map((d) => d.sample),
              ruleLabels: qf.n2rules,
              keptWord: qf.n2kept,
              dropWord: qf.n2dropped,
              caughtBy: qf.n2caughtBy,
              reduce,
            })
          }
          deps={[enabled, reduce]}
        />
      )}
    </SceneShell>
  );
}

function Node3({ reduce }: { reduce: boolean }) {
  const qf = useQF();
  const n = qf.nodes[2];
  const [strict, setStrict] = useState(50);
  const { keptFrac } = funnel(strict / 100);
  return (
    <SceneShell
      id="qf-node-3"
      index={3}
      total={3}
      eyebrow={n.eyebrow}
      title={n.title}
      intro={n.intro}
      bullets={n.bullets}
      cardLabel={n.cardLabel}
      aria={n.aria}
      steps={1}
      captions={n.captions}
      hint={n.hint}
      reduce={reduce}
      labelPrev="Previous step"
      labelNext="Next step"
      note={n.sliderNote}
      controls={
        <Slider
          id="qf-strictness"
          label={qf.n3slider}
          value={strict}
          display={`${Math.round(keptFrac * 100)}% ${qf.n3keptLabel}`}
          min={0}
          max={100}
          onChange={setStrict}
        />
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) =>
            drawFunnel(el, {
              strictness: strict / 100,
              stageLabels: qf.n3stageLabels,
              dropLabels: qf.n3dropLabels,
              keptWord: qf.n3keptLabel,
              rawWord: qf.n3rawWord,
              unit: qf.n3unit,
              reduce,
            })
          }
          deps={[strict, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function QualityFiltering() {
  const { t, lang } = useAcademy();
  const qf = t.qualityFiltering;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{qf.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {qf.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{qf.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{qf.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 8 }}>
            {qf.pipeline.map((label, i) => (
              <a key={i} href={`#qf-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{qf.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{qf.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(qf.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{qf.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(qf.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/web-scale-ingestion" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {qf.prevLesson}</Link>
        <Link href="/stage/0/token-dictionary" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{qf.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
