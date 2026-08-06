"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import LessonRail from "./LessonRail";
import {
  loadEncoder,
  encodeTokens,
  countTokens,
  estimateCost,
  randomEntries,
  lookupEntries,
  showPiece,
  classify,
  ENCODING_LABEL,
  type Tok,
  type TokenKind,
} from "../lib/tokenizer";

const MONO = "var(--font-jetbrains-mono),monospace";
const DISPLAY = "var(--font-space-grotesk),sans-serif";

/** Colour token per kind — all defined in globals.css so both themes stay on-brand. */
const KIND_COLOR: Record<TokenKind, string> = {
  word: "var(--tok-word)",
  sub: "var(--tok-sub)",
  num: "var(--tok-num)",
  punct: "var(--tok-punct)",
  space: "var(--tok-space)",
  byte: "var(--tok-byte)",
};

/** Hardcoded, real o200k encoding of the hero example (verified) — renders instantly. */
const DEMO: { id: number; piece: string }[] = [
  { id: 976, piece: "The" },
  { id: 9059, piece: " cat" },
  { id: 10139, piece: " sat" },
  { id: 402, piece: " on" },
  { id: 290, piece: " the" },
  { id: 2450, piece: " mat" },
];

/* ---------------------------------------------------------------- hooks --- */

function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduce;
}

/** Smoothly count a number up to its new value (instant when reduced-motion). */
function useCountUp(value: number, reduce: boolean): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const to = value;
    const start = performance.now();
    const dur = 380;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return display;
}

/* ------------------------------------------------------------- d3 chart --- */

interface BarDatum {
  label: string;
  value: number;
  color: string;
}

function drawBars(el: SVGSVGElement, data: BarDatum[], reduce: boolean): void {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  const W = 1000;
  const rowH = 82;
  const top = 4;
  const H = data.length * rowH + top;
  const track0 = 12;
  const track1 = 748;
  const valueX = 770;

  svg.attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img");
  svg.selectAll("*").remove();

  const maxV = d3.max(data, (d) => d.value) ?? 1;
  const x = d3.scaleLinear().domain([0, maxV || 1]).range([0, track1 - track0]);

  const rows = svg
    .selectAll<SVGGElement, BarDatum>("g.row")
    .data(data)
    .join("g")
    .attr("class", "row")
    .attr("transform", (_d, i) => `translate(${track0}, ${top + i * rowH})`);

  rows
    .append("text")
    .attr("x", 0)
    .attr("y", 22)
    .style("fill", "var(--fg)")
    .style("font-size", "27px")
    .style("font-weight", "600")
    .style("font-family", DISPLAY)
    .text((d) => d.label);

  rows
    .append("rect")
    .attr("x", 0)
    .attr("y", 34)
    .attr("height", 34)
    .attr("rx", 9)
    .attr("width", track1 - track0)
    .style("fill", "var(--surface)")
    .style("stroke", "var(--border)");

  const bars = rows
    .append("rect")
    .attr("x", 0)
    .attr("y", 34)
    .attr("height", 34)
    .attr("rx", 9)
    .style("fill", (d) => d.color)
    .attr("width", 0);

  bars
    .transition()
    .duration(reduce ? 0 : 680)
    .ease(d3.easeCubicOut)
    .attr("width", (d) => Math.max(3, x(d.value)));

  rows
    .append("text")
    .attr("x", valueX)
    .attr("y", 60)
    .style("fill", "var(--fg)")
    .style("font-size", "30px")
    .style("font-weight", "700")
    .style("font-family", MONO)
    .text((d) => String(d.value));
}

function BarChart({
  data,
  reduce,
  ready,
  loadingLabel,
}: {
  data: BarDatum[];
  reduce: boolean;
  ready: boolean;
  loadingLabel: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const key = data.map((d) => `${d.label}:${d.value}`).join("|");
  useEffect(() => {
    if (ref.current && ready) drawBars(ref.current, data, reduce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduce, ready]);

  if (!ready) {
    return (
      <div style={{ padding: "18px 2px", color: "var(--muted)", fontSize: 14, fontFamily: MONO }}>
        {loadingLabel}
      </div>
    );
  }
  return <svg ref={ref} width="100%" style={{ display: "block", overflow: "visible" }} aria-hidden />;
}

/* ---------------------------------------------------------------- chips --- */

function Chip({ tok, animate, i }: { tok: Tok; animate: boolean; i: number }) {
  const color = KIND_COLOR[tok.kind];
  return (
    <span
      title={`#${tok.id} · ${tok.kind}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 3,
        alignItems: "flex-start",
        padding: "6px 8px 5px",
        borderRadius: 9,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 38%, var(--border))`,
        animation: animate ? "rise .2s ease both" : undefined,
        animationDelay: animate ? `${Math.min(i * 30, 600)}ms` : undefined,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: 2, background: color, flex: "0 0 auto" }} />
        <span style={{ fontFamily: MONO, fontSize: 14, color: "var(--fg)", whiteSpace: "pre" }}>
          {showPiece(tok.piece)}
        </span>
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>{tok.id}</span>
    </span>
  );
}

function cap(label: string) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{label}</div>
  );
}

/**
 * Minimal inline renderer for copy strings so `copy.ts` can carry emphasis
 * (**bold**, *italic*, `code`) without hardcoding markup in the component.
 */
function rich(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] != null) {
      nodes.push(
        <strong key={k++} style={{ fontWeight: 700, color: "var(--fg)" }}>
          {m[1]}
        </strong>,
      );
    } else if (m[2] != null) {
      nodes.push(<em key={k++}>{m[2]}</em>);
    } else {
      nodes.push(
        <code
          key={k++}
          style={{ fontFamily: MONO, fontSize: "0.9em", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 5, padding: "1px 5px" }}
        >
          {m[3]}
        </code>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/* -------------------------------------------------------------- component --- */

export default function Tokens() {
  const { t, lang } = useAcademy();
  const tk = t.tok;
  const reduce = useReducedMotion();

  const [enc, setEnc] = useState<Awaited<ReturnType<typeof loadEncoder>> | null>(null);
  const [encCl, setEncCl] = useState<Awaited<ReturnType<typeof loadEncoder>> | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [presetNote, setPresetNote] = useState<string | null>(null);

  const [dictQuery, setDictQuery] = useState("");
  const [randoms, setRandoms] = useState<Tok[]>([]);
  const [randSeed, setRandSeed] = useState(1);

  const [answerOpen, setAnswerOpen] = useState(false);
  const [deeperOpen, setDeeperOpen] = useState(false);
  const [done, setDone] = useState(false);

  // Lazy-load the real tokenizers after first paint.
  useEffect(() => {
    let alive = true;
    loadEncoder("o200k_base").then((e) => alive && setEnc(e));
    loadEncoder("cl100k_base").then((e) => alive && setEncCl(e));
    return () => {
      alive = false;
    };
  }, []);

  const value = text ?? tk.seed;
  const tokens = useMemo<Tok[]>(() => (enc ? encodeTokens(enc, value) : []), [enc, value]);
  const count = tokens.length;
  const animatedCount = useCountUp(count, reduce);
  const cost = estimateCost(count);

  // Comparison data.
  const clCount = useMemo(() => (encCl ? countTokens(encCl, value) : 0), [encCl, value]);
  const enCount = useMemo(() => (enc ? countTokens(enc, tk.cmpEnText) : 0), [enc, tk.cmpEnText]);
  const esCount = useMemo(() => (enc ? countTokens(enc, tk.cmpEsText) : 0), [enc, tk.cmpEsText]);

  const dictTokens = useMemo<Tok[]>(
    () => (enc && dictQuery ? encodeTokens(enc, dictQuery) : []),
    [enc, dictQuery],
  );
  // Encode common words the way they actually appear in running text — with a
  // leading space — so each resolves to its real "word" entry (matching the hero
  // flow) instead of the bare word-piece variant.
  const commons = useMemo<Tok[]>(
    () => (enc ? lookupEntries(enc, tk.commonWords.map((w) => ` ${w}`)) : []),
    [enc, tk.commonWords],
  );
  const whyCommon = useMemo<Tok[]>(
    () => (enc ? encodeTokens(enc, tk.dictWhyCommon) : []),
    [enc, tk.dictWhyCommon],
  );
  const whyRare = useMemo<Tok[]>(
    () => (enc ? encodeTokens(enc, tk.dictWhyRare) : []),
    [enc, tk.dictWhyRare],
  );

  // What the dictionary table currently shows: your search, a random roll, or
  // the preloaded common words (the default).
  const dictSearching = dictQuery.trim().length > 0;
  const dictRolled = randoms.length > 0;
  const dictRows = dictSearching ? dictTokens : dictRolled ? randoms : commons;
  const dictCaption = dictSearching
    ? `“${dictQuery.trim()}”`
    : dictRolled
      ? tk.dictRandom
      : tk.dictCommon;

  function rollRandom() {
    if (!enc) return;
    const seed = randSeed * 7 + 13;
    setRandSeed(seed);
    setRandoms(randomEntries(enc, 12, seed));
  }

  const legend: { kind: TokenKind; label: string }[] = [
    { kind: "word", label: tk.legendWord },
    { kind: "sub", label: tk.legendSub },
    { kind: "num", label: tk.legendNum },
    { kind: "punct", label: tk.legendPunct },
    { kind: "space", label: tk.legendSpace },
    { kind: "byte", label: tk.legendByte },
  ];

  return (
    <div
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        padding: "clamp(26px, 3vw, 40px) 32px 0",
        display: "flex",
        flexWrap: "wrap",
        gap: "clamp(28px, 4vw, 60px)",
        alignItems: "flex-start",
      }}
    >
      {/* ---- Left rail ------------------------------------------------ */}
      <LessonRail current={1} />

      {/* ---- Article -------------------------------------------------- */}
      <article style={{ flex: "1 1 560px", minWidth: 0, paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{t.crumb}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1, margin: "16px 0 0" }}>
          {t.lessonTitle}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "56ch", textWrap: "pretty" }}>
          {t.lessonLede}
        </p>

        {/* ---- Hero flow: text → tokens → numbers --------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", background: "var(--surface)" }}>
          <div style={{ padding: "clamp(20px,2.5vw,30px)", display: "flex", flexDirection: "column", gap: 0 }}>
            {/* stage 1 */}
            <FlowBand label={tk.flowText}>
              <div style={{ fontFamily: DISPLAY, fontSize: "clamp(24px, 3.6vw, 34px)", fontWeight: 600, letterSpacing: "-.03em", color: "var(--fg)" }}>
                “The cat sat on the mat”
              </div>
            </FlowBand>
            <FlowArrow reduce={reduce} />
            {/* stage 2 */}
            <FlowBand label={tk.flowTokens}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {DEMO.map((d, i) => (
                  <Chip key={i} tok={{ id: d.id, piece: d.piece, kind: classify(d.piece) }} animate={!reduce} i={i} />
                ))}
              </div>
            </FlowBand>
            <FlowArrow reduce={reduce} />
            {/* stage 3 */}
            <FlowBand label={tk.flowIds}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DEMO.map((d, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: MONO,
                      fontSize: "clamp(16px, 2.4vw, 22px)",
                      fontWeight: 700,
                      color: "var(--fg)",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 9,
                      padding: "6px 11px",
                      animation: !reduce ? "rise .2s ease both" : undefined,
                      animationDelay: !reduce ? `${300 + i * 40}ms` : undefined,
                    }}
                  >
                    {d.id}
                  </span>
                ))}
              </div>
            </FlowBand>
          </div>
          <p style={{ margin: 0, padding: "16px clamp(20px,2.5vw,30px)", borderTop: "1px solid var(--hair)", background: "var(--bg)", fontSize: 15, lineHeight: 1.6, color: "var(--muted)", textWrap: "pretty" }}>
            {tk.flowCaption}
          </p>
        </div>

        {/* ---- Concept ------------------------------------------------ */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 18, maxWidth: "66ch" }}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(t.p1)}</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
            {t.conceptList.map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 12, fontSize: 16.5, lineHeight: 1.6, textWrap: "pretty" }}>
                <span aria-hidden style={{ marginTop: 9, width: 6, height: 6, borderRadius: "50%", background: "var(--tok-num)", flex: "0 0 auto" }} />
                <span>{rich(item)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- The Token Calculator ---------------------------------- */}
        <div style={{ marginTop: "clamp(30px, 3.5vw, 44px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
          <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              {cap(tk.calcLabel)}
              <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{tk.calcTitle}</div>
            </div>
            <div style={{ display: "flex", gap: "clamp(16px, 2.4vw, 30px)", alignItems: "flex-end" }}>
              <Stat label={tk.countLabel} value={enc ? String(animatedCount) : "—"} big />
              <Stat label={t.charsLabel} value={String(value.length)} />
              <Stat label={t.costLabel} value={`$${cost.toFixed(5)}`} />
            </div>
          </div>

          <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
            <label htmlFor="tok-input" style={{ display: "block", fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
              {tk.calcInputLabel}
            </label>
            <textarea
              id="tok-input"
              className="u-textarea"
              value={value}
              onChange={(e) => {
                setText(e.target.value);
                setPresetNote(null);
              }}
              rows={3}
              spellCheck={false}
              style={{ width: "100%", resize: "vertical", font: "inherit", fontSize: 16, lineHeight: 1.6, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}
            />

            {!enc ? (
              <div style={{ marginTop: 18, minHeight: 60, display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontFamily: MONO, fontSize: 14 }}>
                <span className="tok-spin" aria-hidden style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--fg)", display: "inline-block" }} />
                {tk.loading}
              </div>
            ) : (
              <>
                {/* colour legend */}
                <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                  {legend.map((l) => (
                    <span key={l.kind} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>
                      <span aria-hidden style={{ width: 9, height: 9, borderRadius: 3, background: KIND_COLOR[l.kind] }} />
                      {l.label}
                    </span>
                  ))}
                </div>

                {/* chips: piece + id */}
                <div aria-label={tk.decodeLabel} style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 7, minHeight: 44 }}>
                  {tokens.map((tok, i) => (
                    <Chip key={i} tok={tok} animate={false} i={i} />
                  ))}
                </div>

                {/* raw integer array */}
                <div style={{ marginTop: 20 }}>
                  {cap(tk.idsLabel)}
                  <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 13.5, lineHeight: 1.7, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", wordBreak: "break-word" }}>
                    [{tokens.map((tk2) => tk2.id).join(", ")}]
                  </div>
                </div>
              </>
            )}

            <p style={{ margin: "16px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "64ch" }}>{tk.engineNote}</p>
          </div>
        </div>

        {/* ---- See it break (presets) -------------------------------- */}
        <div style={{ marginTop: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)" }}>
          {cap(tk.tryLabel)}
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{tk.tryTitle}</div>
          <p style={{ margin: "8px 0 0", fontSize: 15, color: "var(--muted)", lineHeight: 1.6, maxWidth: "60ch" }}>{tk.tryBody}</p>
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 9 }}>
            {tk.presets.map((p, i) => {
              const active = value === p.text;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setText(p.text);
                    setPresetNote(p.note);
                  }}
                  className="u-hover-fg-border"
                  style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13.5, padding: "9px 13px", borderRadius: 10, border: `1px solid ${active ? "var(--fg)" : "var(--border)"}`, background: active ? "var(--fg)" : "var(--bg)", color: active ? "var(--accent-ink)" : "var(--fg)" }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {presetNote && (
            <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--fg)", maxWidth: "62ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>
              {presetNote}
            </p>
          )}
        </div>

        {/* ---- The dictionary ---------------------------------------- */}
        <div style={{ marginTop: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)" }}>
          {cap(tk.dictLabel)}
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 2.2vw, 27px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{tk.dictTitle}</div>
          <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--muted)", lineHeight: 1.62, maxWidth: "64ch", textWrap: "pretty" }}>{rich(tk.dictBody)}</p>

          {/* caption reflects what the table is currently showing */}
          <div style={{ marginTop: 18, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            {cap(dictCaption)}
          </div>

          {/* entries table — piece of text first, then its number */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 78px 62px", background: "var(--surface)", borderBottom: "1px solid var(--hair)" }}>
              <div style={{ ...thStyle }}>{tk.dictColPiece}</div>
              <div style={{ ...thStyle, textAlign: "right" }}>{tk.dictColId}</div>
              <div style={{ ...thStyle, textAlign: "right" }}>{tk.dictColKind}</div>
            </div>
            {dictRows.length === 0 ? (
              <div style={{ padding: "16px", fontSize: 14, color: "var(--muted)", fontFamily: MONO }}>
                {enc ? tk.dictEmpty : tk.loading}
              </div>
            ) : (
              dictRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 78px 62px", borderTop: i === 0 ? "none" : "1px solid var(--hair)", alignItems: "center" }}>
                  <div style={{ ...tdStyle, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 2, background: KIND_COLOR[row.kind], flex: "0 0 auto" }} />
                      “{showPiece(row.piece)}”
                    </span>
                  </div>
                  <div style={{ ...tdStyle, fontWeight: 700, textAlign: "right" }}>{row.id}</div>
                  <div style={{ ...tdStyle, textAlign: "right", color: "var(--muted)", fontSize: 12 }}>{row.kind}</div>
                </div>
              ))
            )}
          </div>

          {/* explore: look up your own text, or roll random entries */}
          <label htmlFor="dict-input" style={{ display: "block", fontSize: 14, color: "var(--muted)", margin: "18px 0 8px" }}>{tk.dictSearchLabel}</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              id="dict-input"
              className="u-textarea"
              value={dictQuery}
              onChange={(e) => setDictQuery(e.target.value)}
              placeholder="cat, tokenization, 42…"
              disabled={!enc}
              style={{ flex: "1 1 240px", font: "inherit", fontSize: 15, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}
            />
            <button
              type="button"
              onClick={rollRandom}
              disabled={!enc}
              className="u-hover-fg-border"
              style={{ appearance: "none", cursor: enc ? "pointer" : "default", font: "inherit", fontSize: 14, fontWeight: 600, padding: "11px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)", opacity: enc ? 1 : 0.5 }}
            >
              {tk.dictRandom}
            </button>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{tk.dictNote}</p>

          {/* ---- Why some words are several tokens ------------------- */}
          <div style={{ marginTop: "clamp(22px, 2.6vw, 30px)", paddingTop: "clamp(20px, 2.4vw, 26px)", borderTop: "1px solid var(--hair)" }}>
            {cap(tk.dictWhyLabel)}
            <div style={{ fontFamily: DISPLAY, fontSize: "clamp(18px, 2vw, 23px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{tk.dictWhyTitle}</div>
            <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--muted)", lineHeight: 1.62, maxWidth: "64ch", textWrap: "pretty" }}>{rich(tk.dictWhyBody)}</p>

            <div style={{ marginTop: 18, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {[
                { word: tk.dictWhyCommon, toks: whyCommon, note: tk.dictWhyInList, accent: "var(--tok-word)" },
                { word: tk.dictWhyRare, toks: whyRare, note: tk.dictWhyBuilt, accent: "var(--tok-sub)" },
              ].map((ex, i) => (
                <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "16px 16px 14px", background: "var(--surface)" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)" }}>“{ex.word}”</div>
                  <div aria-hidden style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, minHeight: 40 }}>
                    {enc ? (
                      ex.toks.map((tok, j) => <Chip key={j} tok={tok} animate={false} i={j} />)
                    ) : (
                      <span style={{ fontFamily: MONO, fontSize: 13, color: "var(--muted)" }}>{tk.loading}</span>
                    )}
                  </div>
                  <div style={{ marginTop: 13, display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: ex.accent, letterSpacing: "-.03em" }}>
                      {enc ? ex.toks.length : "—"}
                    </span>
                    <span style={{ fontSize: 13.5, color: "var(--muted)" }}>
                      {ex.toks.length === 1 ? tk.tokensWord.replace(/s$/, "") : tk.tokensWord} · {ex.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ---- Curiosity: why ~4 characters per token ----------- */}
            <div style={{ marginTop: "clamp(18px, 2.2vw, 24px)", border: "1px solid var(--border)", borderRadius: 14, padding: "clamp(15px, 2vw, 18px)", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: "var(--tok-num)" }}>
                <span aria-hidden style={{ width: 7, height: 7, borderRadius: 2, background: "var(--tok-num)", flex: "0 0 auto" }} />
                {tk.curiosityLabel}
              </div>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.64, color: "var(--fg)", maxWidth: "64ch", textWrap: "pretty" }}>{rich(tk.curiosityBody)}</p>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.64, color: "var(--fg)", maxWidth: "64ch", textWrap: "pretty" }}>{rich(tk.curiosityBody2)}</p>
            </div>
          </div>
        </div>

        {/* ---- Comparison (d3) --------------------------------------- */}
        <div style={{ marginTop: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)" }}>
          {cap(tk.cmpLabel)}
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 2.2vw, 27px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{tk.cmpTitle}</div>
          <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--muted)", lineHeight: 1.62, maxWidth: "64ch", textWrap: "pretty" }}>{tk.cmpBody}</p>

          <div style={{ marginTop: 18 }}>
            {cap(`${tk.cmpNote}`)}
            <div style={{ marginTop: 12 }}>
              <BarChart
                reduce={reduce}
                ready={!!enc && !!encCl}
                loadingLabel={tk.loading}
                data={[
                  { label: ENCODING_LABEL.o200k_base, value: count, color: "var(--tok-num)" },
                  { label: ENCODING_LABEL.cl100k_base, value: clCount, color: "var(--tok-punct)" },
                ]}
              />
            </div>
          </div>

          <div style={{ marginTop: 26, paddingTop: 22, borderTop: "1px solid var(--hair)" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, letterSpacing: "-.03em" }}>{tk.cmpLangTitle}</div>
            <p style={{ margin: "8px 0 0", fontSize: 15, color: "var(--muted)", lineHeight: 1.6, maxWidth: "62ch", textWrap: "pretty" }}>{tk.cmpLangBody}</p>
            <div style={{ marginTop: 14 }}>
              <BarChart
                reduce={reduce}
                ready={!!enc}
                loadingLabel={tk.loading}
                data={[
                  { label: `${tk.cmpEnLabel} — “${tk.cmpEnText}”`, value: enCount, color: "var(--tok-word)" },
                  { label: `${tk.cmpEsLabel} — “${tk.cmpEsText}”`, value: esCount, color: "var(--tok-sub)" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ---- Explain it back --------------------------------------- */}
        <div style={{ marginTop: "clamp(28px, 3.2vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
          {cap(t.explainLabel)}
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, maxWidth: "48ch", textWrap: "balance" }}>{t.explainQ}</div>
          <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
            {answerOpen ? t.hide : t.reveal}
          </button>
          {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, maxWidth: "62ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{t.explainA}</p>}
        </div>

        {/* ---- Go deeper --------------------------------------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)" }}>
          <button type="button" onClick={() => setDeeperOpen((v) => !v)} aria-expanded={deeperOpen} style={{ appearance: "none", border: 0, background: "transparent", font: "inherit", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, color: "var(--fg)", padding: 0 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: "-.03em" }}>{t.deeperTitle}</span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{deeperOpen ? "−" : "+"}</span>
          </button>
          {deeperOpen && <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.68, color: "var(--muted)", maxWidth: "64ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{t.deeperBody}</p>}
        </div>

        {/* ---- Bridge to next lesson --------------------------------- */}
        <Link href="/stage/1/data" className="u-card" style={{ display: "block", marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{tk.bridgeLabel}</div>
          <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", maxWidth: "60ch", textWrap: "pretty" }}>{tk.bridgeBody}</p>
        </Link>

        {/* ---- Controls ---------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/stage/1/life-of-an-llm" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {t.prev}</Link>
            <Link href="/stage/1/data" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{t.next} →</Link>
          </div>
          <button type="button" onClick={() => setDone((v) => !v)} aria-pressed={done} className="u-hover-opacity" style={{ appearance: "none", border: 0, font: "inherit", cursor: "pointer", fontSize: 15.5, fontWeight: 600, color: "var(--accent-ink)", background: "var(--fg)", padding: "13px 22px", borderRadius: 11 }}>
            {done ? t.completed : t.markComplete}
          </button>
        </div>

        {/* language hint */}
        <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
          {lang === "es" ? "Idioma: Español" : "Language: English"}
        </div>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------ subparts --- */

const thStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: ".1em",
  color: "var(--muted)",
  padding: "10px 14px",
};
const tdStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 14,
  color: "var(--fg)",
  padding: "11px 14px",
};

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: big ? 34 : 24, fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.05, color: "var(--fg)" }}>{value}</div>
    </div>
  );
}

function FlowBand({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: "var(--muted)" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function FlowArrow({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
      <span
        className={reduce ? undefined : "tok-bob"}
        style={{ fontSize: 22, color: "var(--muted)", lineHeight: 1 }}
      >
        ↓
      </span>
    </div>
  );
}
