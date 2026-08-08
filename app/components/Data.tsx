"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import LessonRail from "./LessonRail";
import {
  MONO,
  DISPLAY,
  KIND_COLOR,
  useReducedMotion,
  useCountUp,
  Cap,
  rich,
  Chip,
  Stat,
  FlowBand,
  FlowArrow,
} from "./lesson-kit";
import { loadEncoder, countTokens, classify, showPiece } from "../lib/tokenizer";
import { STAGES, cleanTo, type DocResult, type DocKind } from "../lib/dataset";

/** Hardcoded, real o200k encoding of the hero clean sentence — paints instantly. */
const HERO: { id: number; piece: string }[] = [
  { id: 38941, piece: "Photos" },
  { id: 73972, piece: "ynthesis" },
  { id: 18304, piece: " turns" },
  { id: 4207, piece: " light" },
  { id: 1511, piece: " into" },
  { id: 15377, piece: " chemical" },
  { id: 5954, piece: " energy" },
  { id: 13, piece: "." },
];

/** Lightweight highlighter for the raw crawl markup so it reads as code:
 *  HTML tags <…> blue, {{templates}} red, [[links]] green, ''' bold ''' orange. */
function MarkupCode({ code }: { code: string }) {
  const re = /(<\/?[a-zA-Z][^>]*>)|(\{\{[^}]*\}\})|(\[\[[^\]]*\]\])|(''')/g;
  const parts: { t: string; c: string }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) parts.push({ t: code.slice(last, m.index), c: "var(--fg)" });
    parts.push({ t: m[0], c: m[1] ? "var(--tok-num)" : m[2] ? "var(--tok-byte)" : m[3] ? "var(--tok-word)" : "var(--tok-sub)" });
    last = re.lastIndex;
  }
  if (last < code.length) parts.push({ t: code.slice(last), c: "var(--fg)" });
  return (
    <code style={{ display: "block", fontFamily: MONO, fontSize: "clamp(12px, 1.5vw, 14px)", lineHeight: 1.7, wordBreak: "break-word" }}>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.c }}>{p.t}</span>
      ))}
    </code>
  );
}

/* ---------------------------------------------------------------- format --- */

function fmtCompact(n: number): string {
  if (n >= 1e12) return `${+(n / 1e12).toFixed(n >= 1e13 ? 0 : 1)}T`;
  if (n >= 1e9) return `${+(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`;
  return String(Math.round(n));
}
function fmtBytes(b: number): string {
  if (b >= 1e12) return `${+(b / 1e12).toFixed(1)} TB`;
  if (b >= 1e9) return `${+(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${+(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${+(b / 1e3).toFixed(1)} KB`;
  return `${Math.round(b)} B`;
}

/* ----------------------------------------------------------- dense tape --- */

interface Cell {
  sep: boolean;
  id: number;
}
/** Deterministic seeded window into the token tape (stable across SSR/CSR). */
function makeTape(n: number): Cell[] {
  const out: Cell[] = [];
  let s = 1234567;
  const next = () => (s = (s * 48271) % 2147483647) / 2147483647;
  let since = 0;
  for (let i = 0; i < n; i++) {
    since++;
    if (since > 20 && next() < 0.14) {
      out.push({ sep: true, id: -1 });
      since = 0;
    } else {
      out.push({ sep: false, id: 1 + Math.floor(next() * 198000) });
    }
  }
  return out;
}
const TAPE = makeTape(480);

/* ------------------------------------------------------------- d3 compare -- */

interface CmpDatum {
  label: string;
  value: number;
  display: string;
  color: string;
}
function drawCompare(el: SVGSVGElement, data: CmpDatum[], reduce: boolean): void {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  const W = 1000;
  const rowH = 92;
  const top = 4;
  const H = data.length * rowH + top;
  const track0 = 12;
  const track1 = 988;

  svg.attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img");
  svg.selectAll("*").remove();

  const maxV = d3.max(data, (d) => d.value) ?? 1;
  const x = d3.scaleLinear().domain([0, maxV || 1]).range([0, track1 - track0]);

  const rows = svg
    .selectAll<SVGGElement, CmpDatum>("g.row")
    .data(data)
    .join("g")
    .attr("class", "row")
    .attr("transform", (_d, i) => `translate(${track0}, ${top + i * rowH})`);

  rows
    .append("text")
    .attr("x", 0)
    .attr("y", 24)
    .style("fill", "var(--fg)")
    .style("font-size", "27px")
    .style("font-weight", "600")
    .style("font-family", DISPLAY)
    .text((d) => d.label);

  rows
    .append("rect")
    .attr("x", 0)
    .attr("y", 38)
    .attr("height", 34)
    .attr("rx", 9)
    .attr("width", track1 - track0)
    .style("fill", "var(--surface)")
    .style("stroke", "var(--border)");

  const bars = rows
    .append("rect")
    .attr("x", 0)
    .attr("y", 38)
    .attr("height", 34)
    .attr("rx", 9)
    .style("fill", (d) => d.color)
    .attr("width", 0);

  bars
    .transition()
    .duration(reduce ? 0 : 780)
    .ease(d3.easeCubicOut)
    .attr("width", (d) => Math.max(4, x(d.value)));

  rows
    .append("text")
    .attr("x", (d) => Math.max(4, x(d.value)) + 12)
    .attr("y", 62)
    .style("fill", "var(--fg)")
    .style("font-size", "24px")
    .style("font-weight", "700")
    .style("font-family", MONO)
    .text((d) => d.display);
}

/* -------------------------------------------------------------- component -- */

export default function Data() {
  const { t, lang } = useAcademy();
  const d = t.data;
  const reduce = useReducedMotion();

  const [enc, setEnc] = useState<Awaited<ReturnType<typeof loadEncoder>> | null>(null);
  const [stage, setStage] = useState(-1); //   -1 = raw, 0..4 = after STAGES[0..stage]
  const [pagesExp, setPagesExp] = useState(0); // 0..6 → 10^exp pages
  const [hoverCell, setHoverCell] = useState<{ id: number; piece: string; sep: boolean } | null>(null);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [deeperOpen, setDeeperOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    loadEncoder("o200k_base").then((e) => alive && setEnc(e));
    return () => {
      alive = false;
    };
  }, []);

  const tokensOf = useMemo(() => {
    return (text: string) => (enc ? countTokens(enc, text) : Math.ceil(text.length / 4));
  }, [enc]);

  // ---- Interactive A: the pipeline -----------------------------------------
  const rawDocs = useMemo(() => d.docs.map((doc) => ({ id: doc.id, raw: doc.raw })), [d.docs]);
  const titleById = useMemo(() => new Map(d.docs.map((doc) => [doc.id, doc.title])), [d.docs]);
  const results = useMemo<DocResult[]>(() => cleanTo(rawDocs, stage), [rawDocs, stage]);

  const docsTotal = rawDocs.length;
  const tokensTotal = useMemo(
    () => cleanTo(rawDocs, -1).reduce((s, r) => s + tokensOf(r.text), 0),
    [rawDocs, tokensOf],
  );
  const kept = results.filter((r) => !r.dropped);
  const docsKept = kept.length;
  const tokensKept = kept.reduce((s, r) => s + tokensOf(r.text), 0);
  const animKeptTokens = useCountUp(tokensKept, reduce);

  const complete = stage >= STAGES.length - 1;
  const stageName = stage < 0 ? d.rawStageName : d.stages[stage].name;
  const stageDesc = stage < 0 ? d.cleanBody : d.stages[stage].desc;

  function reasonFor(r: DocResult): string {
    switch (r.kind) {
      case "boilerplate":
        return d.reasonBoilerplate;
      case "dup":
        return `${Math.round((r.similarity ?? 0.9) * 100)}% ${d.reasonDup}`;
      case "spam":
        return d.reasonSpam;
      case "pii":
        return d.reasonPii;
      case "benchmark":
        return d.reasonBenchmark;
      default:
        return "";
    }
  }

  // ---- Interactive B: scale + dense tape ------------------------------------
  const pages = Math.pow(10, pagesExp);
  const scaleTokens = pages * 1000;
  const storageBytes = scaleTokens * 2; // uint16
  const animScaleTokens = useCountUp(scaleTokens, reduce);

  const tapeCells = useMemo(() => {
    return TAPE.map((c) => {
      if (c.sep) return { sep: true, id: -1, piece: "", color: "var(--fg)" };
      let piece = "";
      if (enc) {
        try {
          piece = enc.decode([c.id]);
        } catch {
          piece = "";
        }
      }
      const kind = piece ? classify(piece) : "num";
      return { sep: false, id: c.id, piece, color: KIND_COLOR[kind] };
    });
  }, [enc]);

  // ---- d3 comparison bar ----------------------------------------------------
  const cmpRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (!cmpRef.current) return;
    drawCompare(
      cmpRef.current,
      [
        { label: d.compareWiki, value: 4e9, display: "≈ 4B", color: "var(--tok-word)" },
        { label: d.compareFrontier, value: 15e12, display: "≈ 15T", color: "var(--tok-num)" },
      ],
      reduce,
    );
  }, [d.compareWiki, d.compareFrontier, reduce]);

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "clamp(26px, 3vw, 40px) 32px 0",
        display: "flex",
        flexWrap: "wrap",
        gap: "clamp(28px, 4vw, 60px)",
        alignItems: "flex-start",
      }}
    >
      <LessonRail current={2} />

      <article style={{ flex: "1 1 560px", minWidth: 0, paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{d.crumb}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1, margin: "16px 0 0" }}>
          {d.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "58ch", textWrap: "pretty" }}>
          {d.lede}
        </p>

        {/* ---- Hero flow: raw → clean → tokens → integers ------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", background: "var(--surface)" }}>
          <div style={{ padding: "clamp(20px,2.5vw,30px)" }}>
            <FlowBand label={d.heroRawLabel}>
              <MarkupCode code={d.heroRaw} />
            </FlowBand>
            <FlowArrow reduce={reduce} />
            <FlowBand label={d.heroCleanLabel}>
              <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2.6vw, 26px)", fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)", textWrap: "pretty" }}>
                {d.heroClean}
              </div>
            </FlowBand>
            <FlowArrow reduce={reduce} />
            <FlowBand label={d.heroTokensLabel}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {HERO.map((h, i) => (
                  <Chip key={i} tok={{ id: h.id, piece: h.piece, kind: classify(h.piece) }} animate={!reduce} i={i} />
                ))}
              </div>
            </FlowBand>
            <FlowArrow reduce={reduce} />
            <FlowBand label={d.heroIdsLabel}>
              <div style={{ fontFamily: MONO, fontSize: "clamp(13px, 1.7vw, 16px)", fontWeight: 700, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", wordBreak: "break-word" }}>
                [{HERO.map((h) => h.id).join(", ")}]
              </div>
            </FlowBand>
          </div>
          <p style={{ margin: 0, padding: "16px clamp(20px,2.5vw,30px)", borderTop: "1px solid var(--hair)", background: "var(--bg)", fontSize: 15, lineHeight: 1.6, color: "var(--muted)", textWrap: "pretty" }}>
            {d.heroCaption}
          </p>
        </div>

        {/* ---- Concept ----------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {d.concept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive A: Clean this dataset --------------------- */}
        <div style={{ marginTop: "clamp(30px, 3.5vw, 44px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
          <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
            <Cap>{d.cleanLabel}</Cap>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{d.cleanTitle}</div>
            <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{d.cleanBody}</p>
          </div>

          <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
            {/* stage stepper — a clickable pipeline that wraps, never scrolls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span aria-hidden style={{ fontSize: 14, color: "var(--muted)" }}>⚙</span>
              <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{d.stepperHint}</span>
            </div>
            <div role="group" aria-label={d.stepperHint} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 5px" }}>
              {d.stages.map((s, i) => {
                const state = i < stage ? "done" : i === stage ? "active" : "todo";
                return (
                  <Fragment key={i}>
                    {i > 0 && (
                      <span aria-hidden style={{ flex: "0 0 auto", fontSize: 14, lineHeight: 1, color: i <= stage ? "var(--tok-word)" : "var(--border)" }}>
                        →
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setStage(i)}
                      aria-current={state === "active" ? "step" : undefined}
                      className={state === "active" ? undefined : "u-hover-fg-border"}
                      style={{
                        appearance: "none",
                        cursor: "pointer",
                        font: "inherit",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        fontFamily: MONO,
                        fontSize: 12.5,
                        padding: "7px 11px 7px 8px",
                        borderRadius: 999,
                        border: `1px solid ${state === "active" ? "var(--fg)" : state === "done" ? "color-mix(in srgb, var(--tok-word) 45%, var(--border))" : "var(--border)"}`,
                        background: state === "active" ? "var(--surface)" : "var(--bg)",
                        color: state === "todo" ? "var(--muted)" : "var(--fg)",
                        fontWeight: state === "active" ? 700 : 400,
                        boxShadow: state === "active" ? "0 0 0 3px color-mix(in srgb, var(--fg) 12%, transparent)" : "none",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: "inline-grid",
                          placeItems: "center",
                          width: 19,
                          height: 19,
                          borderRadius: "50%",
                          fontSize: 11,
                          fontWeight: 700,
                          flex: "0 0 auto",
                          background: state === "active" ? "var(--fg)" : state === "done" ? "var(--tok-word)" : "transparent",
                          color: state === "active" ? "var(--accent-ink)" : state === "done" ? "var(--bg)" : "var(--muted)",
                          border: state === "todo" ? "1.5px solid var(--border)" : "none",
                        }}
                      >
                        {state === "done" ? "✓" : i + 1}
                      </span>
                      {s.name}
                    </button>
                  </Fragment>
                );
              })}
            </div>

            {/* current stage line */}
            <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, flex: "0 0 auto" }}>
                {stage < 0 ? "" : `${stage + 1}. `}
                {stageName}
              </span>
              <span style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, flex: "1 1 260px", minWidth: 0 }}>{stageDesc}</span>
            </div>

            {/* meter */}
            <div style={{ marginTop: 16, display: "flex", gap: "clamp(18px, 3vw, 40px)", flexWrap: "wrap" }}>
              <Meter label={d.docsKeptLabel} value={`${docsKept} / ${docsTotal}`} frac={docsKept / docsTotal} color="var(--tok-word)" />
              <Meter label={d.tokensKeptLabel} value={fmtCompact(animKeptTokens)} frac={tokensTotal ? tokensKept / tokensTotal : 1} color="var(--tok-num)" />
            </div>

            {/* controls */}
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!complete ? (
                <button
                  type="button"
                  onClick={() => setStage((s) => Math.min(STAGES.length - 1, s + 1))}
                  className="u-hover-opacity"
                  style={{ appearance: "none", border: 0, cursor: "pointer", font: "inherit", fontSize: 15, fontWeight: 600, color: "var(--accent-ink)", background: "var(--fg)", padding: "11px 18px", borderRadius: 11 }}
                >
                  {stage < 0 ? d.runLabel : d.nextStageLabel}
                </button>
              ) : null}
              {stage > -1 && (
                <button
                  type="button"
                  onClick={() => setStage(-1)}
                  className="u-hover-fg-border"
                  style={{ appearance: "none", cursor: "pointer", font: "inherit", fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}
                >
                  {d.resetLabel}
                </button>
              )}
            </div>

            {/* doc cards */}
            <div style={{ marginTop: 20, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 244px), 1fr))" }}>
              {results.map((r) => (
                <DocCard
                  key={r.id}
                  r={r}
                  title={titleById.get(r.id) ?? r.id}
                  reason={reasonFor(r)}
                  keptBadge={d.keptBadge}
                  qualityWord={d.qualityWord}
                  tokensWord={d.tokensWord}
                  showTokens={complete}
                  tokens={tokensOf(r.text)}
                  reduce={reduce}
                />
              ))}
            </div>

            {complete && (
              <div style={{ marginTop: 20, border: "1px solid var(--border)", borderRadius: 16, padding: "clamp(16px,2vw,22px)", background: "var(--surface)", animation: reduce ? undefined : "rise .18s ease both" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, letterSpacing: "-.03em" }}>{d.resultTitle}</div>
                <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.62, color: "var(--muted)", maxWidth: "72ch", textWrap: "pretty" }}>{d.resultBody}</p>
                <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>
                  {docsTotal} {d.docsWord} · {fmtCompact(tokensTotal)} {d.tokensWord} → {docsKept} {d.docsWord} · {fmtCompact(tokensKept)} {d.tokensWord}
                </div>
              </div>
            )}

            {/* ---- How the score works (aside) ---------------------- */}
            <div style={{ marginTop: "clamp(18px, 2.2vw, 24px)", border: "1px solid var(--border)", borderRadius: 14, padding: "clamp(15px, 2vw, 18px)", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: "var(--tok-num)" }}>
                <span aria-hidden style={{ width: 7, height: 7, borderRadius: 2, background: "var(--tok-num)", flex: "0 0 auto" }} />
                {d.scoreAsideLabel}
              </div>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.64, color: "var(--fg)", maxWidth: "74ch", textWrap: "pretty" }}>{rich(d.scoreAsideBody)}</p>
            </div>

            <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{d.illustrativeNote}</p>
          </div>
        </div>

        {/* ---- Interactive B: scale + dense tape --------------------- */}
        <div style={{ marginTop: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)" }}>
          <Cap>{d.scaleLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 2.2vw, 27px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{d.scaleTitle}</div>
          <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--muted)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{d.scaleBody}</p>

          <div style={{ marginTop: 18, display: "flex", gap: "clamp(18px, 3vw, 40px)", flexWrap: "wrap" }}>
            <Stat label={d.scalePagesLabel} value={fmtCompact(pages)} big />
            <Stat label={d.scaleTokensLabel} value={fmtCompact(animScaleTokens)} big />
            <Stat label={d.scaleStorageLabel} value={fmtBytes(storageBytes)} big />
          </div>

          <label htmlFor="scale-range" style={{ display: "block", fontSize: 13.5, color: "var(--muted)", margin: "18px 0 8px", fontFamily: MONO }}>
            {fmtCompact(pages)} {d.scalePagesLabel.toLowerCase()}
          </label>
          <input
            id="scale-range"
            type="range"
            min={0}
            max={6}
            step={1}
            value={pagesExp}
            onChange={(e) => setPagesExp(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--fg)" }}
          />

          {/* dense block */}
          <div style={{ marginTop: 22 }}>
            <Cap>{d.denseBlockLabel}</Cap>
            <p style={{ margin: "10px 0 0", fontSize: 15, color: "var(--muted)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(d.tapeBridge)}</p>
            <div
              aria-hidden
              onMouseLeave={() => setHoverCell(null)}
              onMouseOver={(e) => {
                const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
                if (!el) return;
                setHoverCell({
                  id: Number(el.dataset.id),
                  piece: el.dataset.piece ?? "",
                  sep: el.dataset.sep === "1",
                });
              }}
              style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 3, padding: 12, border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}
            >
              {tapeCells.map((c, i) =>
                c.sep ? (
                  <span key={i} data-cell data-sep="1" style={{ width: 4, height: 15, background: "var(--fg)", borderRadius: 1, opacity: 0.85 }} />
                ) : (
                  <span
                    key={i}
                    data-cell
                    data-id={c.id}
                    data-piece={c.piece}
                    style={{ width: 15, height: 15, borderRadius: 3, background: c.color, opacity: hoverCell?.id === c.id ? 1 : 0.85, outline: hoverCell?.id === c.id ? "2px solid var(--fg)" : "none" }}
                  />
                ),
              )}
            </div>
            <p style={{ margin: "10px 0 0", minHeight: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.6, fontFamily: hoverCell ? MONO : undefined }}>
              {hoverCell ? (
                hoverCell.sep ? (
                  d.denseSepLabel
                ) : (
                  <>
                    #{hoverCell.id}
                    {hoverCell.piece ? ` · "${showPiece(hoverCell.piece)}"` : ""}
                  </>
                )
              ) : (
                `${d.denseBlockNote} ${d.hoverHint}`
              )}
            </p>
          </div>

          {/* comparison */}
          <div style={{ marginTop: 26, paddingTop: 22, borderTop: "1px solid var(--hair)" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, letterSpacing: "-.03em" }}>{d.compareTitle}</div>
            <p style={{ margin: "8px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(d.compareBody)}</p>
            <div style={{ marginTop: 16 }}>
              <svg ref={cmpRef} width="100%" style={{ display: "block", overflow: "visible" }} aria-hidden />
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{d.compareNote}</p>
          </div>
        </div>

        {/* ---- The tape concept -------------------------------------- */}
        <div style={{ marginTop: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)" }}>
          <Cap>{d.tapeLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 2.2vw, 27px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{d.tapeTitle}</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14, maxWidth: "74ch" }}>
            {d.tape.map((p, i) => (
              <p key={i} style={{ margin: 0, fontSize: 16.5, lineHeight: 1.66, textWrap: "pretty" }}>{rich(p)}</p>
            ))}
          </div>
          <p style={{ margin: "16px 0 0", paddingTop: 16, borderTop: "1px solid var(--hair)", fontSize: 16.5, lineHeight: 1.66, maxWidth: "74ch", textWrap: "pretty" }}>{rich(d.cutoffBody)}</p>
        </div>

        {/* ---- Chicken-and-egg loop ---------------------------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)", background: "var(--surface)" }}>
          <Cap>{d.loopLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(18px, 2vw, 23px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{d.loopTitle}</div>
          <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--muted)", lineHeight: 1.64, maxWidth: "74ch", textWrap: "pretty" }}>{rich(d.loopBody)}</p>
        </div>

        {/* ---- Explain it back --------------------------------------- */}
        <div style={{ marginTop: "clamp(28px, 3.2vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
          <Cap>{t.explainLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, maxWidth: "52ch", textWrap: "balance" }}>{d.explainQ}</div>
          <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
            {answerOpen ? t.hide : t.reveal}
          </button>
          {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, maxWidth: "74ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{d.explainA}</p>}
        </div>

        {/* ---- Go deeper --------------------------------------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)" }}>
          <button type="button" onClick={() => setDeeperOpen((v) => !v)} aria-expanded={deeperOpen} style={{ appearance: "none", border: 0, background: "transparent", font: "inherit", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, color: "var(--fg)", padding: 0 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: "-.03em" }}>{d.deeperTitle}</span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{deeperOpen ? "−" : "+"}</span>
          </button>
          {deeperOpen && <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.68, color: "var(--muted)", maxWidth: "74ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(d.deeperBody)}</p>}
        </div>

        {/* ---- Bridge to Bias ---------------------------------------- */}
        <Link href="/stage/1/bias" className="u-card" style={{ display: "block", marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{d.bridgeLabel}</div>
          <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", maxWidth: "60ch", textWrap: "pretty" }}>{d.bridgeBody}</p>
        </Link>

        {/* ---- Controls ---------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/stage/1/tokens" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {d.prev}</Link>
            <Link href="/stage/1/bias" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{d.next} →</Link>
          </div>
          <button type="button" onClick={() => setDone((v) => !v)} aria-pressed={done} className="u-hover-opacity" style={{ appearance: "none", border: 0, font: "inherit", cursor: "pointer", fontSize: 15.5, fontWeight: 600, color: "var(--accent-ink)", background: "var(--fg)", padding: "13px 22px", borderRadius: 11 }}>
            {done ? t.completed : t.markComplete}
          </button>
        </div>

        <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
          {lang === "es" ? "Idioma: Español" : "Language: English"}
        </div>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------ subparts --- */

function Meter({ label, value, frac, color }: { label: string; value: string; frac: number; color: string }) {
  return (
    <div style={{ flex: "1 1 180px", minWidth: 150 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.1, color: "var(--fg)" }}>{value}</div>
      <span style={{ marginTop: 8, display: "block", height: 6, borderRadius: 99, background: "var(--hair)", overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${Math.max(0, Math.min(1, frac)) * 100}%`, background: color, transition: "width .5s ease" }} />
      </span>
    </div>
  );
}

const KIND_TINT: Record<DocKind, string> = {
  good: "var(--tok-word)",
  markup: "var(--tok-sub)",
  boilerplate: "var(--tok-space)",
  dup: "var(--tok-punct)",
  spam: "var(--tok-byte)",
  pii: "var(--tok-num)",
  benchmark: "var(--tok-num)",
};

function DocCard({
  r,
  title,
  reason,
  keptBadge,
  qualityWord,
  tokensWord,
  showTokens,
  tokens,
  reduce,
}: {
  r: DocResult;
  title: string;
  reason: string;
  keptBadge: string;
  qualityWord: string;
  tokensWord: string;
  showTokens: boolean;
  tokens: number;
  reduce: boolean;
}) {
  const tint = KIND_TINT[r.kind];
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${r.dropped ? "var(--border)" : tint}`,
        borderRadius: 12,
        padding: "12px 13px",
        background: "var(--bg)",
        opacity: r.dropped ? 0.55 : 1,
        transition: reduce ? undefined : "opacity .35s ease",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {r.dropped ? (
          <span aria-hidden style={{ fontFamily: MONO, fontSize: 15, color: "var(--muted)", flex: "0 0 auto" }}>✕</span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", color: tint, border: `1px solid ${tint}`, borderRadius: 6, padding: "2px 6px", flex: "0 0 auto" }}>{keptBadge}</span>
        )}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--muted)",
          textDecoration: r.dropped ? "line-through" : "none",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {r.text || "—"}
      </div>
      {r.dropped && reason && (
        <div style={{ fontSize: 11.5, color: "var(--fg)", fontWeight: 500 }}>{reason}</div>
      )}
      {!r.dropped && r.quality != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--muted)", flex: "0 0 auto" }}>{qualityWord}</span>
          <span style={{ flex: "1 1 auto", height: 5, borderRadius: 99, background: "var(--hair)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${Math.round(r.quality * 100)}%`, background: "var(--tok-word)" }} />
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--muted)", flex: "0 0 auto" }}>{Math.round(r.quality * 100)}</span>
        </div>
      )}
      {!r.dropped && showTokens && (
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: "var(--fg)", fontWeight: 600 }}>{tokens} {tokensWord}</div>
      )}
    </div>
  );
}
