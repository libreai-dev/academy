"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion, KIND_COLOR } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider } from "./webscale-kit";
import {
  UNIT_SPLITS,
  UNIT_DICT_SIZE,
  UNIT_WORD,
  type UnitScheme,
  trainBPE,
  segmentWord,
  vocabAfter,
  SAMPLE_WORD,
  type BpeTrace,
} from "../lib/token-dictionary";
import {
  loadEncoder,
  encodeTokens,
  showPiece,
  type Tok,
} from "../lib/tokenizer";

/* ======================================================================== *
 * Chip-tape layout — the shared d3 primitive. Lays coloured token cells out
 * in wrapping rows inside one <svg> mount (no hand-authored SVG shapes).
 * Returns the y just below the last row so sections can stack.
 * ======================================================================== */

interface ChipSpec {
  piece: string; //   text shown in the cell (whitespace already made visible)
  sub?: string; //    small line beneath (an integer id)
  fill: string; //    a CSS colour token
  dim?: boolean; //   render faded (a not-yet-earned entry)
  ring?: boolean; //  strong outline (the freshly-merged / newest entry)
}

const TAPE_W = 720;

/** Estimate a monospace cell width from its glyph count (JetBrains Mono ~ .55em). */
function chipWidth(piece: string, sub?: string): number {
  const glyphs = Math.max(piece.length, sub ? sub.length : 0);
  return Math.max(26, glyphs * 9 + 18);
}

/** Place chips into wrapping rows starting at (x0,y0); returns the bottom y. */
function placeChips(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  chips: ChipSpec[],
  x0: number,
  y0: number,
  reduce: boolean,
): number {
  const hasId = chips.some((c) => c.sub != null);
  const chipH = hasId ? 46 : 34;
  const gapX = 8;
  const rowGapY = 10;
  let x = x0;
  let y = y0;
  chips.forEach((c, i) => {
    const w = chipWidth(c.piece, c.sub);
    if (x > x0 && x + w > TAPE_W - 8) {
      x = x0;
      y += chipH + rowGapY;
    }
    const cell = g.append("g").attr("transform", `translate(${x},${y})`).style("opacity", c.dim ? 0.42 : 1);
    if (!reduce) cell.style("opacity", 0).transition().duration(240).delay(Math.min(i * 14, 320)).style("opacity", c.dim ? 0.42 : 1);
    cell
      .append("rect")
      .attr("width", w)
      .attr("height", chipH)
      .attr("rx", 8)
      .style("fill", `color-mix(in srgb, ${c.fill} 16%, transparent)`)
      .style("stroke", c.ring ? c.fill : `color-mix(in srgb, ${c.fill} 42%, var(--border))`)
      .style("stroke-width", c.ring ? 2.4 : 1);
    // colour swatch dot (top-left) so the category reads even in greyscale
    cell.append("rect").attr("x", 7).attr("y", hasId ? 8 : 12).attr("width", 6).attr("height", 6).attr("rx", 1.5).style("fill", c.fill);
    cell
      .append("text")
      .attr("x", w / 2 + 4)
      .attr("y", hasId ? 20 : chipH / 2 + 5)
      .attr("text-anchor", "middle")
      .style("fill", "var(--fg)")
      .style("font-family", MONO)
      .style("font-size", "15px")
      .style("white-space", "pre")
      .text(c.piece);
    if (c.sub != null) {
      cell
        .append("text")
        .attr("x", w / 2 + 4)
        .attr("y", 37)
        .attr("text-anchor", "middle")
        .style("fill", "var(--muted)")
        .style("font-family", MONO)
        .style("font-size", "12px")
        .text(c.sub);
    }
    x += w + gapX;
  });
  return y + chipH;
}

/** A small mono section label drawn inside the svg. */
function sectionLabel(g: d3.Selection<SVGGElement, unknown, null, undefined>, text: string, x: number, y: number) {
  g.append("text")
    .attr("x", x)
    .attr("y", y)
    .style("fill", "var(--muted)")
    .style("font-family", MONO)
    .style("font-size", "12px")
    .style("letter-spacing", ".08em")
    .text(text);
}

function fitSvg(el: SVGSVGElement, height: number) {
  d3.select(el).attr("viewBox", `0 0 ${TAPE_W} ${height}`);
}

/* ---- Node 1: one word, three ways -------------------------------------- */

function drawUnit(el: SVGSVGElement, o: { scheme: UnitScheme; reduce: boolean; wordLabel: string }) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const fill: Record<UnitScheme, string> = {
    letters: "var(--tok-space)",
    words: "var(--tok-num)",
    subwords: "var(--tok-sub)",
  };
  const pieces = UNIT_SPLITS[o.scheme];
  sectionLabel(g, o.wordLabel, 8, 20);
  const chips: ChipSpec[] = pieces.map((p) => ({ piece: p, fill: fill[o.scheme] }));
  const bottom = placeChips(g, chips, 8, 34, o.reduce);
  fitSvg(el, bottom + 12);
}

/* ---- Node 2: BPE — sample word shrinks, dictionary grows ---------------- */

function drawBpe(
  el: SVGSVGElement,
  o: { trace: BpeTrace; k: number; reduce: boolean; sampleLabel: string; vocabLabel: string; baseLegend: string; mergedLegend: string },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");

  // --- Sample word tape: merged (multi-char) cells are green; the one produced
  //     by the most recent merge gets a strong ring. ---
  const tokens = segmentWord(SAMPLE_WORD, o.trace.merges, o.k);
  const justMerged = o.k > 0 ? o.trace.merges[o.k - 1].merged : null;
  let ringUsed = false;
  const sampleChips: ChipSpec[] = tokens.map((tk) => {
    const merged = tk.length > 1;
    const ring = merged && tk === justMerged && !ringUsed;
    if (ring) ringUsed = true;
    return { piece: tk, fill: merged ? "var(--signal)" : "var(--tok-space)", ring };
  });
  sectionLabel(g, `${o.sampleLabel} · ${SAMPLE_WORD}`, 8, 20);
  const afterSample = placeChips(g, sampleChips, 8, 34, o.reduce);

  // --- Dictionary: base characters (grey), then merged tokens (green), the
  //     newest one ringed. ---
  const vocab = vocabAfter(o.trace, o.k);
  const baseCount = o.trace.baseVocab.length;
  const vy = afterSample + 30;
  sectionLabel(g, o.vocabLabel, 8, vy);
  const vocabChips: ChipSpec[] = vocab.map((v, i) => {
    const isMerged = i >= baseCount;
    const isNewest = i === baseCount + o.k - 1 && o.k > 0;
    return { piece: v, fill: isMerged ? "var(--signal)" : "var(--tok-space)", ring: isNewest };
  });
  const bottom = placeChips(g, vocabChips, 8, vy + 14, o.reduce);

  // --- Legend row ---
  const ly = bottom + 24;
  const legend = (x: number, colour: string, text: string) => {
    g.append("rect").attr("x", x).attr("y", ly - 9).attr("width", 11).attr("height", 11).attr("rx", 2).style("fill", `color-mix(in srgb, ${colour} 22%, transparent)`).style("stroke", colour).style("stroke-width", 1.4);
    g.append("text").attr("x", x + 18).attr("y", ly).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12px").text(text);
  };
  legend(8, "var(--tok-space)", o.baseLegend);
  legend(180, "var(--signal)", o.mergedLegend);
  fitSvg(el, ly + 16);
}

/* ---- Node 3: live token tape from the real tokenizer ------------------- */

function drawTokenTape(el: SVGSVGElement, o: { tokens: Tok[]; reduce: boolean; label: string }) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  sectionLabel(g, o.label, 8, 20);
  if (o.tokens.length === 0) {
    fitSvg(el, 60);
    return;
  }
  const chips: ChipSpec[] = o.tokens.map((tk) => ({
    piece: showPiece(tk.piece),
    sub: String(tk.id),
    fill: KIND_COLOR[tk.kind],
  }));
  const bottom = placeChips(g, chips, 8, 34, o.reduce);
  fitSvg(el, bottom + 12);
}

/* ======================================================================== *
 * Diagram mount + node components
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

function useTD() {
  const { t } = useAcademy();
  return t.tokenDictionary;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const td = useTD();
  const n = td.nodes[0];
  const schemes: UnitScheme[] = ["letters", "words", "subwords"];
  const [scheme, setScheme] = useState<UnitScheme>("subwords");
  const idx = schemes.indexOf(scheme);
  const dict = UNIT_DICT_SIZE[scheme];
  const seq = UNIT_SPLITS[scheme].length;
  const dictStr = dict >= 1000 ? `~${Math.round(dict / 1000)}k ${td.n1entriesWord}` : `~${dict} ${td.n1entriesWord}`;
  return (
    <SceneShell
      id="td-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {td.n1schemes.map((lab, i) => (
            <Toggle key={i} on={scheme === schemes[i]} onClick={() => setScheme(schemes[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} rows={[
          { k: n.rows[0], v: dictStr, hi: scheme === "subwords" },
          { k: n.rows[1], v: `${seq} ${td.n1piecesWord}` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? UNIT_WORD} draw={(el) => drawUnit(el, { scheme, reduce, wordLabel: td.n1wordLabel })} deps={[scheme, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const td = useTD();
  const n = td.nodes[1];
  const trace = useMemo(() => trainBPE(8), []);
  const maxK = trace.merges.length;
  const [k, setK] = useState(0);
  const merge = k > 0 ? trace.merges[k - 1] : null;
  const dictSize = trace.baseVocab.length + k;
  const sampleLen = segmentWord(SAMPLE_WORD, trace.merges, k).length;
  const note = merge
    ? `${td.n2mergeFmt} ${k}: ${merge.a} + ${merge.b} ${td.n2joins} ${merge.merged} · ${td.n2seen} ${merge.count}×${sampleLen === 1 ? ` · ${td.n2done}` : ""}`
    : td.n2mergeStart;
  return (
    <SceneShell
      id="td-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <Slider id="td-merges" label={td.n2slider} value={k} display={`${k} / ${maxK}`} min={0} max={maxK} onChange={setK} />
      }
      readout={
        <Readout title={n.readoutTitle} rows={[
          { k: n.rows[0], v: `${k} / ${maxK}` },
          { k: n.rows[1], v: `${dictSize} ${td.n1entriesWord}`, hi: true },
          { k: n.rows[2], v: `${sampleLen} ${td.n1piecesWord}` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? SAMPLE_WORD} draw={(el) => drawBpe(el, { trace, k, reduce, sampleLabel: td.n2sampleLabel, vocabLabel: td.n2vocabLabel, baseLegend: td.n2baseLegend, mergedLegend: td.n2mergedLegend })} deps={[k, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const td = useTD();
  const n = td.nodes[2];
  const [enc, setEnc] = useState<Awaited<ReturnType<typeof loadEncoder>> | null>(null);
  const [text, setText] = useState(td.n3default);
  const [presetNote, setPresetNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadEncoder("o200k_base").then((e) => alive && setEnc(e));
    return () => { alive = false; };
  }, []);

  const tokens = useMemo<Tok[]>(() => (enc ? encodeTokens(enc, text) : []), [enc, text]);
  const charCount = useMemo(() => [...text].length, [text]);
  const ratio = tokens.length > 0 ? (charCount / tokens.length).toFixed(1) : "—";

  return (
    <SceneShell
      id="td-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={presetNote ?? undefined}
      controls={
        <>
          <label htmlFor="td-input" style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{td.n3inputLabel}</label>
          <input
            id="td-input"
            value={text}
            onChange={(e) => { setText(e.target.value); setPresetNote(null); }}
            suppressHydrationWarning
            className="u-textarea"
            style={{ width: "100%", fontFamily: MONO, fontSize: 13.5, padding: "11px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }}
          />
          <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>{td.n3presetsLabel}</div>
          <ControlRow>
            {td.n3presets.map((p, i) => (
              <Toggle key={i} on={text === p.text} onClick={() => { setText(p.text); setPresetNote(p.note); }}>{p.label}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: enc ? String(tokens.length) : "…", hi: true },
          { k: n.rows[1], v: String(charCount) },
          { k: n.rows[2], v: ratio },
        ]} />
      }
    >
      {() => (
        enc
          ? <DiagramSvg label={n.aria ?? ""} draw={(el) => drawTokenTape(el, { tokens, reduce, label: td.n3tapeLabel })} deps={[tokens, reduce]} />
          : <div style={{ padding: "28px 8px", fontFamily: MONO, fontSize: 13, color: "var(--muted)" }}>{td.n3loading}</div>
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function TokenDictionary() {
  const { t, lang } = useAcademy();
  const td = t.tokenDictionary;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{td.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {td.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{td.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{td.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {td.pipeline.map((label, i) => (
              <a key={i} href={`#td-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{td.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{td.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(td.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{td.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(td.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/quality-filtering" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {td.prevLesson}</Link>
        <Link href="/stage/0/embedding-matrix" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{td.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
