"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Callout, Deeper } from "./webscale-kit";
import {
  FAILURES,
  MOMENTS,
  decode,
  shownProb,
  maskCounts,
  TOKEN_CLASSES,
  GRAMMAR_STATES,
  GBNF,
  isAllowed,
  type FailureCase,
  type DecodeMoment,
  type GrammarState,
} from "../lib/constrained-decoding";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS tokens + theme flips resolve live. A tight
 * viewBox (W≈420) keeps label text ≥12px even when the card renders ~320px.
 * ======================================================================== */

/* --- Node 1: a broken JSON string with the offending span in red -------- */
function drawFailure(el: SVGSVGElement, o: { fc: FailureCase; invalidLabel: string }) {
  const W = 440;
  const H = 128;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const bad = "var(--tok-byte)";

  // ✕ INVALID pill, top-right.
  const pillW = 150;
  svg.append("rect").attr("x", W - pillW - 12).attr("y", 14).attr("width", pillW).attr("height", 30).attr("rx", 8)
    .style("fill", "color-mix(in srgb, var(--tok-byte) 14%, transparent)").style("stroke", bad).style("stroke-width", 1.5);
  svg.append("text").attr("x", W - pillW / 2 - 12).attr("y", 34).attr("text-anchor", "middle")
    .style("fill", bad).style("font-family", MONO).style("font-size", "16px").style("font-weight", "700").text(`✕ ${o.invalidLabel}`);

  // The produced string, rendered as three chained runs so the red span lands
  // exactly over the offending characters (measured, not estimated).
  const x0 = 16;
  const y = 84;
  const fs = 21;
  const pre = o.fc.text.slice(0, o.fc.badStart);
  const badTxt = o.fc.text.slice(o.fc.badStart, o.fc.badStart + o.fc.badLen);
  const post = o.fc.text.slice(o.fc.badStart + o.fc.badLen);

  const tPre = svg.append("text").attr("x", x0).attr("y", y).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", `${fs}px`).text(pre);
  const w1 = (tPre.node() as SVGTextElement).getComputedTextLength();
  const tBad = svg.append("text").attr("x", x0 + w1).attr("y", y).style("fill", bad).style("font-family", MONO).style("font-size", `${fs}px`).style("font-weight", "700").text(badTxt);
  const w2 = (tBad.node() as SVGTextElement).getComputedTextLength();
  svg.append("text").attr("x", x0 + w1 + w2).attr("y", y).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", `${fs}px`).text(post);

  // red underline + caret beneath the bad span
  svg.append("rect").attr("x", x0 + w1).attr("y", y + 7).attr("width", Math.max(4, w2)).attr("height", 3).attr("rx", 1.5).style("fill", bad);
  svg.append("text").attr("x", x0 + w1 + w2 / 2).attr("y", y + 30).attr("text-anchor", "middle").style("fill", bad).style("font-family", MONO).style("font-size", "18px").style("font-weight", "700").text("▲");
}

/* --- Node 2: candidate next-tokens as probability bars, masked → 0 ------- */
function drawCandidates(
  el: SVGSVGElement,
  o: { m: DecodeMoment; constrained: boolean; reduce: boolean; maskedTag: string; chosenTag: string; prefixLabel: string; validBadge: string; breakBadge: string; candLabel: string },
) {
  const W = 440;
  const rowH = 46;
  const top = 84;
  const H = top + o.m.candidates.length * rowH + 8;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;
  const chosen = decode(o.m, o.constrained);
  const ok = chosen.valid;
  const good = "var(--signal)";
  const bad = "var(--tok-byte)";

  // --- header: OUTPUT SO FAR = prefix + chosen token, + a validity badge ---
  svg.append("text").attr("x", 16).attr("y", 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("letter-spacing", ".08em").text(o.prefixLabel);
  const px = 16;
  const py = 52;
  const tPre = svg.append("text").attr("x", px).attr("y", py).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.m.prefix);
  const pw = (tPre.node() as SVGTextElement).getComputedTextLength();
  svg.append("text").attr("x", px + pw + (o.m.prefix ? 4 : 0)).attr("y", py).style("fill", ok ? "var(--signal-fg)" : bad).style("font-family", MONO).style("font-size", "20px").style("font-weight", "700").text(chosen.tok);

  const badgeTxt = ok ? o.validBadge : o.breakBadge;
  const bw = Math.min(210, badgeTxt.length * 8.4 + 22);
  svg.append("rect").attr("x", W - bw - 12).attr("y", 36).attr("width", bw).attr("height", 26).attr("rx", 7)
    .style("fill", `color-mix(in srgb, ${ok ? good : bad} 14%, transparent)`).style("stroke", ok ? good : bad).style("stroke-width", 1.3);
  svg.append("text").attr("x", W - bw / 2 - 12).attr("y", 53).attr("text-anchor", "middle").style("fill", ok ? "var(--signal-fg)" : bad).style("font-family", MONO).style("font-size", "13px").style("font-weight", "700").text(badgeTxt);

  svg.append("text").attr("x", 16).attr("y", top - 12).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("letter-spacing", ".08em").text(o.candLabel);

  // --- candidate rows ---
  const barX0 = 150;
  const barX1 = W - 58;
  const barW = barX1 - barX0;
  o.m.candidates.forEach((c, i) => {
    const y = top + i * rowH;
    const masked = o.constrained && !c.valid;
    const p = shownProb(o.m, c, o.constrained);
    const isChosen = c.tok === chosen.tok && p > 0;
    const barColor = masked ? "var(--border)" : c.valid ? good : bad;

    // token label (left)
    svg.append("text").attr("x", 16).attr("y", y + 22).style("fill", masked ? "var(--muted)" : "var(--fg)").style("font-family", MONO).style("font-size", "17px").style("font-weight", isChosen ? "700" : "400").style("text-decoration", masked ? "line-through" : "none").text(c.tok);

    // bar track
    svg.append("rect").attr("x", barX0).attr("y", y + 4).attr("width", barW).attr("height", 26).attr("rx", 7).style("fill", "var(--surface)").style("stroke", "var(--border)");
    // bar fill
    const targetW = Math.max(masked ? 0 : 3, p * barW);
    const bar = svg.append("rect").attr("x", barX0).attr("y", y + 4).attr("height", 26).attr("rx", 7).style("fill", barColor).style("opacity", masked ? 0.5 : 1).style("stroke", isChosen ? "var(--fg)" : "none").style("stroke-width", isChosen ? 1.6 : 0);
    if (dur) bar.attr("width", 0).transition().duration(dur).attr("width", targetW);
    else bar.attr("width", targetW);

    // right-side annotation: % or masked tag or chosen tag
    if (masked) {
      svg.append("text").attr("x", barX0 + 8).attr("y", y + 22).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(o.maskedTag);
    } else {
      svg.append("text").attr("x", barX1 + 6).attr("y", y + 22).style("fill", isChosen ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "14px").style("font-weight", isChosen ? "700" : "400").text(`${Math.round(p * 100)}%`);
    }
    if (isChosen) {
      svg.append("text").attr("x", barX0 + 8).attr("y", y + 22).style("fill", ok ? "#0a0a09" : "#fff").style("font-family", MONO).style("font-size", "12.5px").style("font-weight", "700").text(`▸ ${o.chosenTag}`);
    }
  });
}

/* --- Node 3: two panels of token classes, free (all) vs grammar (legal) -- */
function drawAllowed(
  el: SVGSVGElement,
  o: { s: GrammarState; freeLabel: string; grammarLabel: string; emittedLabel: string; anything: string },
) {
  const W = 420;
  const cols = 3;
  const rows = Math.ceil(TOKEN_CLASSES.length / cols);
  const gridTop = 108;
  const chipH = 34;
  const chipGap = 8;
  const H = gridTop + rows * (chipH + chipGap) + 6;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const good = "var(--signal)";

  // emitted-so-far context line
  svg.append("text").attr("x", 12).attr("y", 24).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").style("letter-spacing", ".08em").text(o.emittedLabel);
  svg.append("text").attr("x", 12).attr("y", 50).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "20px").text(o.s.emitted === "" ? "∅" : o.s.emitted);
  // next-slot caret
  const et = svg.append("text").attr("x", 12).attr("y", 50).style("font-family", MONO).style("font-size", "20px").style("opacity", 0).text(o.s.emitted === "" ? "∅" : o.s.emitted);
  const ew = (et.node() as SVGTextElement).getComputedTextLength();
  et.remove();
  svg.append("rect").attr("x", 12 + ew + 6).attr("y", 34).attr("width", 11).attr("height", 20).attr("rx", 2).style("fill", good).style("opacity", 0.8);

  const panelW = (W - 12 - 12 - 14) / 2;
  const panel = (px: number, label: string, allowAll: boolean, sub: string) => {
    svg.append("rect").attr("x", px).attr("y", gridTop - 34).attr("width", panelW).attr("height", H - gridTop + 30).attr("rx", 12)
      .style("fill", "none").style("stroke", allowAll ? "var(--border)" : good).style("stroke-width", allowAll ? 1 : 1.6);
    svg.append("text").attr("x", px + 12).attr("y", gridTop - 14).style("fill", allowAll ? "var(--muted)" : "var(--signal-fg)").style("font-family", MONO).style("font-size", "13px").style("letter-spacing", ".05em").style("font-weight", "700").text(label);
    if (allowAll) {
      svg.append("text").attr("x", px + panelW - 12).attr("y", gridTop - 14).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13px").text(sub);
    }
    const cw = (panelW - 12 - (cols - 1) * chipGap - 12) / cols;
    TOKEN_CLASSES.forEach((tc, i) => {
      const r = Math.floor(i / cols);
      const cc = i % cols;
      const x = px + 12 + cc * (cw + chipGap);
      const y = gridTop + r * (chipH + chipGap);
      const lit = allowAll || isAllowed(o.s, tc);
      const dim = !allowAll && !isAllowed(o.s, tc);
      svg.append("rect").attr("x", x).attr("y", y).attr("width", cw).attr("height", chipH).attr("rx", 8)
        .style("fill", dim ? "transparent" : `color-mix(in srgb, ${good} 16%, transparent)`)
        .style("stroke", lit ? good : "var(--border)").style("stroke-width", lit ? 1.4 : 1).style("opacity", dim ? 0.4 : 1);
      svg.append("text").attr("x", x + cw / 2).attr("y", y + chipH / 2 + 5).attr("text-anchor", "middle")
        .style("fill", dim ? "var(--muted)" : "var(--fg)").style("font-family", MONO).style("font-size", "16px").style("opacity", dim ? 0.7 : 1).text(tc);
    });
  };
  panel(12, o.freeLabel, true, o.anything);
  panel(12 + panelW + 14, o.grammarLabel, false, "");
}

/* ======================================================================== *
 * Mount + node components
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

function useCD() {
  const { t } = useAcademy();
  return t.constrainedDecoding;
}

/* ---- Node 1: the problem ---------------------------------------------- */
function Node1({ reduce }: { reduce: boolean }) {
  const cd = useCD();
  const n = cd.nodes[0];
  const [idx, setIdx] = useState(0);
  const fc = FAILURES[idx];
  return (
    <SceneShell
      id="cd-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={
        <div style={{ fontFamily: MONO, fontSize: 13, color: "var(--muted)" }}>
          {cd.n1askLabel}: <span style={{ color: "var(--signal-fg)" }}>{cd.n1ask}</span>
        </div>
      }
      controls={
        <ControlRow>
          {cd.n1modes.map((lab, i) => (
            <Toggle key={i} on={idx === i} onClick={() => setIdx(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={
        <Readout title={n.readoutTitle} rows={[
          { k: n.rows[0], v: cd.n1invalid },
          { k: n.rows[1], v: String(fc.badStart) },
          { k: n.rows[2], v: fc.err },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawFailure(el, { fc, invalidLabel: cd.n1invalid })} deps={[idx, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2: logit masking -------------------------------------------- */
function Node2({ reduce }: { reduce: boolean }) {
  const cd = useCD();
  const n = cd.nodes[1];
  const [mIdx, setMIdx] = useState(0);
  const [constrained, setConstrained] = useState(true); // mask ON by default: show it working
  const m = MOMENTS[mIdx];
  const chosen = decode(m, constrained);
  const { kept, masked } = maskCounts(m);
  return (
    <SceneShell
      id="cd-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[mIdx]}
      controls={
        <>
          <ControlRow>
            {cd.n2moments.map((lab, i) => (
              <Toggle key={i} on={mIdx === i} onClick={() => setMIdx(i)}>{lab}</Toggle>
            ))}
          </ControlRow>
          <ControlRow>
            <Toggle on={constrained} onClick={() => setConstrained((v) => !v)}>
              {cd.n2constraintLabel}: {constrained ? cd.n2on : cd.n2off}
            </Toggle>
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: constrained ? String(kept) : String(m.candidates.length), hi: true },
          { k: n.rows[1], v: constrained ? String(masked) : "0" },
          { k: n.rows[2], v: `${Math.round(chosen.prob * 100)}%` },
        ]} />
      }
    >
      {() => (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <DiagramSvg label={n.aria ?? ""} draw={(el) => drawCandidates(el, { m, constrained, reduce, maskedTag: cd.n2maskedTag, chosenTag: cd.n2chosenTag, prefixLabel: cd.n2prefixLabel, validBadge: cd.n2validBadge, breakBadge: cd.n2breakBadge, candLabel: cd.n2candLabel })} deps={[mIdx, constrained, reduce]} />
          <Deeper title={cd.n2deeperTitle}>{rich(cd.n2deeperBody)}</Deeper>
        </div>
      )}
    </SceneShell>
  );
}

/* ---- Node 3: grammars ------------------------------------------------- */
function Node3({ reduce }: { reduce: boolean }) {
  const cd = useCD();
  const n = cd.nodes[2];
  const [pIdx, setPIdx] = useState(0);
  const s = GRAMMAR_STATES[pIdx];
  return (
    <SceneShell
      id="cd-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[pIdx]}
      aside={<Callout label={cd.calloutLabel} title={cd.calloutTitle}>{rich(cd.calloutBody)}</Callout>}
      controls={
        <>
          <ControlRow>
            {cd.n3positions.map((lab, i) => (
              <Toggle key={i} on={pIdx === i} onClick={() => setPIdx(i)}>{lab}</Toggle>
            ))}
          </ControlRow>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{cd.n3refLabel}</div>
          <pre style={{ margin: 0, fontFamily: MONO, fontSize: 12.5, lineHeight: 1.55, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg)", overflowX: "auto", whiteSpace: "pre" }}>{GBNF}</pre>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: cd.n3positions[pIdx] },
          { k: n.rows[1], v: s.allowed.join("  "), hi: true },
          { k: n.rows[2], v: cd.n3anything },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawAllowed(el, { s, freeLabel: cd.n3freeLabel, grammarLabel: cd.n3grammarLabel, emittedLabel: cd.n3emittedLabel, anything: cd.n3anything })} deps={[pIdx, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function ConstrainedDecoding() {
  const { t, lang } = useAcademy();
  const cd = t.constrainedDecoding;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{cd.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {cd.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{cd.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{cd.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 8 }}>
            {cd.pipeline.map((label, i) => (
              <a key={i} href={`#cd-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{cd.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{cd.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(cd.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{cd.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(cd.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/mixture-of-experts" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {cd.prevLesson}</Link>
        <Link href="/stage/0/reasoning-tokens" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{cd.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
