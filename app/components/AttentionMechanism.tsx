"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Deeper } from "./webscale-kit";
import {
  EMB,
  QVEC,
  KVEC,
  VVEC,
  FOCUS,
  ROLE_ORDER,
  type Role,
  scores,
  weights,
  topAttended,
  blend,
  blockOutput,
} from "../lib/attention-mechanism";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so CSS tokens + theme flips resolve live.
 *
 * FONT FLOOR: every viewBox is 520 units wide and renders as narrow as ~290px
 * on a phone, so the smallest label is 22 units (≈ 12.4px rendered). Never
 * drop below 22 here.
 * ======================================================================== */

const W = 520;
const ROLE_COLOR: Record<Role, string> = {
  query: "var(--signal)",
  key: "var(--tok-num)",
  value: "var(--tok-sub)",
};

/** Draw a vector as a row of 4 cells, opacity ∝ |value| / max|value|. */
function strip(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  vec: number[],
  x0: number,
  y: number,
  cellW: number,
  h: number,
  color: string,
) {
  const max = Math.max(1e-6, ...vec.map((v) => Math.abs(v)));
  vec.forEach((v, i) => {
    g.append("rect")
      .attr("x", x0 + i * (cellW + 3))
      .attr("y", y)
      .attr("width", cellW)
      .attr("height", h)
      .attr("rx", 4)
      .style("fill", color)
      .style("fill-opacity", 0.18 + 0.82 * (Math.abs(v) / max))
      .style("stroke", "var(--bg)")
      .style("stroke-width", 1);
  });
}

/* --- Node 1: one token → query / key / value ---------------------------- */

function drawRoles(el: SVGSVGElement, o: { roleIdx: number; reduce: boolean; embLabel: string; word: string; roles: string[] }) {
  const H = 340;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");

  // top: the embedding of the focus token
  g.append("text").attr("x", W / 2).attr("y", 30).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px")
    .text(`${o.embLabel} ${o.word}`);
  strip(g, EMB[FOCUS], 180, 44, 40, 34, "var(--tok-punct)");

  const cols = [95, 260, 425];
  const vecs = [QVEC[FOCUS], KVEC[FOCUS], VVEC[FOCUS]];
  const roles = ROLE_ORDER;

  // highlight box behind the selected role column
  g.append("rect").attr("x", cols[o.roleIdx] - 78).attr("y", 128).attr("width", 156).attr("height", 92).attr("rx", 12)
    .style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 2);

  // fan-out arrows
  cols.forEach((cx) => {
    g.append("line").attr("x1", W / 2).attr("y1", 80).attr("x2", cx).attr("y2", 126)
      .style("stroke", "var(--hair)").style("stroke-width", 2);
  });

  cols.forEach((cx, i) => {
    const selected = i === o.roleIdx;
    const grp = g.append("g").style("opacity", selected ? 1 : 0.5);
    grp.append("text").attr("x", cx).attr("y", 156).attr("text-anchor", "middle")
      .style("fill", ROLE_COLOR[roles[i]]).style("font-family", DISPLAY).style("font-size", "24px")
      .style("font-weight", selected ? 700 : 600).text(o.roles[i]);
    strip(grp, vecs[i], cx - 60, 172, 30, 30, ROLE_COLOR[roles[i]]);
  });
}

/* --- Node 2: the match — attention weights over the token row ------------ */

function drawMatch(
  el: SVGSVGElement,
  o: { q: number; reduce: boolean; tokens: string[]; colScore: string; colWeight: string; sumLabel: string; selfLabel: string },
) {
  const sc = scores(o.q);
  const wt = weights(o.q);
  const win = topAttended(o.q);
  const rows = o.tokens.length;
  const y0 = 58;
  const stepY = 50;
  const H = y0 + rows * stepY + 34;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");

  const barX = 195;
  const barMax = 210;

  // column headers
  g.append("text").attr("x", 132).attr("y", 34).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(o.colScore);
  g.append("text").attr("x", barX + barMax / 2).attr("y", 34).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(o.colWeight);

  o.tokens.forEach((tok, i) => {
    const rowTop = y0 + i * stepY;
    const isSelf = i === o.q;
    const isWin = i === win;

    // token word
    g.append("text").attr("x", 8).attr("y", rowTop + 23)
      .style("fill", isSelf ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "24px")
      .style("font-weight", isSelf ? 700 : 400).text(tok);
    if (isSelf) {
      const wpx = tok.length * 14 + 16;
      g.append("text").attr("x", 8 + wpx).attr("y", rowTop + 23)
        .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").text(`· ${o.selfLabel}`);
    }

    // raw score
    g.append("text").attr("x", 188).attr("y", rowTop + 23).attr("text-anchor", "end")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(sc[i].toFixed(2));

    // weight bar track + fill
    g.append("rect").attr("x", barX).attr("y", rowTop).attr("width", barMax).attr("height", 32).attr("rx", 8)
      .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
    const w = Math.max(3, wt[i] * barMax);
    const bar = g.append("rect").attr("x", barX).attr("y", rowTop).attr("height", 32).attr("rx", 8)
      .style("fill", isWin ? "var(--signal)" : "var(--muted)").style("fill-opacity", isWin ? 1 : 0.45);
    if (o.reduce) bar.attr("width", w);
    else bar.attr("width", 0).transition().duration(500).ease(d3.easeCubicOut).attr("width", w);

    // weight percent
    g.append("text").attr("x", barX + barMax + 8).attr("y", rowTop + 23)
      .style("fill", isWin ? "var(--signal-fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "22px")
      .style("font-weight", isWin ? 700 : 400).text(`${Math.round(wt[i] * 100)}%`);
  });

  g.append("text").attr("x", W / 2).attr("y", H - 12).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(o.sumLabel);
}

/* --- Node 3: the blend — weighted values → residual → RMSNorm ------------ */

function drawBlend(
  el: SVGSVGElement,
  o: {
    q: number; wrapper: boolean; reduce: boolean; tokens: string[];
    valuesLabel: string; blendLabel: string; inputLabel: string; normLabel: string; outLabel: string;
  },
) {
  const wt = weights(o.q);
  const rows = o.tokens.length;
  const stepY = 42;
  const y0 = 46;
  const sx = 120; // strip x
  const cellW = 30;

  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const g = svg.append("g");

  g.append("text").attr("x", 8).attr("y", 28)
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(o.valuesLabel);

  o.tokens.forEach((tok, j) => {
    const rowTop = y0 + j * stepY;
    const op = 0.28 + 0.72 * wt[j];
    const grp = g.append("g").style("opacity", op);
    grp.append("text").attr("x", 8).attr("y", rowTop + 22)
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").text(tok);
    strip(grp, VVEC[j], sx, rowTop, cellW, 28, "var(--tok-sub)");
    grp.append("text").attr("x", sx + 4 * (cellW + 3) + 12).attr("y", rowTop + 22)
      .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "22px").text(`${Math.round(wt[j] * 100)}%`);
  });

  const yA = y0 + rows * stepY;
  g.append("text").attr("x", sx).attr("y", yA + 8).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text("↓");

  // blended vector
  const yBlend = yA + 20;
  g.append("text").attr("x", 8).attr("y", yBlend + 22)
    .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").text(o.blendLabel);
  strip(g, blend(o.q), sx, yBlend, cellW, 30, "var(--signal)");

  let H = yBlend + 30 + 18;

  if (o.wrapper) {
    // + input
    const yIn = yBlend + 50;
    g.append("text").attr("x", 8).attr("y", yIn + 22)
      .style("fill", "var(--tok-punct)").style("font-family", MONO).style("font-size", "22px").text(o.inputLabel);
    strip(g, EMB[o.q], sx, yIn, cellW, 30, "var(--tok-punct)");
    // residual sum (blend + input), then normalize arrow
    const yNorm = yIn + 44;
    g.append("text").attr("x", sx).attr("y", yNorm).attr("text-anchor", "middle")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "22px").text(`↓ ${o.normLabel}`);
    // output
    const yOut = yNorm + 12;
    g.append("rect").attr("x", 4).attr("y", yOut - 6).attr("width", W - 8).attr("height", 44).attr("rx", 10)
      .style("fill", "var(--signal-wash)").style("stroke", "var(--signal)").style("stroke-width", 2);
    g.append("text").attr("x", 14).attr("y", yOut + 22)
      .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "22px").style("font-weight", 700).text(o.outLabel);
    strip(g, blockOutput(o.q), sx + 8, yOut, cellW, 28, "var(--signal)");
    H = yOut + 44;
  }

  svg.attr("viewBox", `0 0 ${W} ${H}`);
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

function useAM() {
  const { t } = useAcademy();
  return t.attentionMechanism;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const am = useAM();
  const n = am.nodes[0];
  const [roleIdx, setRoleIdx] = useState(0);
  const manual = useRef(false);
  const pick = (i: number) => { setRoleIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="am-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setRoleIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes ? rich(n.optionNotes[roleIdx]) : undefined}
      controls={
        <ControlRow>
          {am.n1roles.map((lab, i) => (
            <Toggle key={i} on={roleIdx === i} onClick={() => pick(i)}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawRoles(el, { roleIdx, reduce, embLabel: am.n1embLabel, word: am.tokens[FOCUS], roles: am.n1roles })} deps={[roleIdx, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const am = useAM();
  const n = am.nodes[1];
  const [q, setQ] = useState(FOCUS);
  const manual = useRef(false);
  const pick = (i: number) => { setQ(i); manual.current = true; };
  const win = topAttended(q);
  const p = Math.round(weights(q)[win] * 100);
  const note = am.n2noteTemplate
    .replace("{q}", am.tokens[q])
    .replace("{k}", am.tokens[win])
    .replace("{p}", String(p));
  return (
    <SceneShell
      id="am-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={am.tokens.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setQ(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={rich(note)}
      aside={<Deeper title={am.n2deeperTitle}>{rich(am.n2deeperBody)}</Deeper>}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{am.n2queryLabel}</div>
          <ControlRow>
            {am.tokens.map((tok, i) => (
              <Toggle key={i} on={q === i} onClick={() => pick(i)}>{tok}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawMatch(el, { q, reduce, tokens: am.tokens, colScore: am.n2colScore, colWeight: am.n2colWeight, sumLabel: am.n2sumLabel, selfLabel: am.n2selfLabel })} deps={[q, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const am = useAM();
  const n = am.nodes[2];
  const [wrapper, setWrapper] = useState(false);
  const manual = useRef(false);
  const toggle = () => { setWrapper((v) => !v); manual.current = true; };
  return (
    <SceneShell
      id="am-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setWrapper(s === 1); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={rich(wrapper ? am.n3wrapperNote : am.n3blendNote)}
      aside={<Deeper title={am.n3deeperTitle}>{rich(am.n3deeperBody)}</Deeper>}
      controls={
        <ControlRow>
          <Toggle on={wrapper} onClick={toggle}>{am.n3wrapperLabel}: {wrapper ? "ON" : "OFF"}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawBlend(el, { q: FOCUS, wrapper, reduce, tokens: am.tokens, valuesLabel: am.n3valuesLabel, blendLabel: am.n3blendLabel, inputLabel: am.n3inputLabel, normLabel: am.n3normLabel, outLabel: am.n3outLabel })} deps={[wrapper, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function AttentionMechanism() {
  const { t, lang } = useAcademy();
  const am = t.attentionMechanism;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{am.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {am.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{am.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{am.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {am.pipeline.map((label, i) => (
              <a key={i} href={`#am-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{am.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{am.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(am.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{am.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(am.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/multi-turn-formatting" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {am.prevLesson}</Link>
        <Link href="/stage/0/feed-forward" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{am.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
