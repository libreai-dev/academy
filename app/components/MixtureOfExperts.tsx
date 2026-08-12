"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Slider, Callout, Deeper } from "./webscale-kit";
import {
  MOE_TOKENS,
  NUM_EXPERTS,
  routeToken,
  activeFraction,
  loadDistribution,
  BATCH_TOKENS,
  type MoeToken,
} from "../lib/mixture-of-experts";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens (and theme flips) resolve live.
 * Font floor: viewBoxes ~700 wide render down to ~290px on a phone, so labels
 * are ≥30 viewBox units (≈12px rendered) and values/headings larger.
 * ======================================================================== */

/* --- Node 1: token → router → top-K experts ----------------------------- */

function drawRoute(
  el: SVGSVGElement,
  o: { token: MoeToken; k: number; reduce: boolean; routerLabel: string; expertPrefix: string },
) {
  const W = 700;
  const H = 520;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 420;
  const cy = H / 2;

  const routing = routeToken(o.token.logits, o.k);
  const selectedSet = new Set(routing.selected);
  const maxProb = Math.max(...routing.probs) || 1;

  // expert column geometry
  const ex0 = 466;
  const ew = 218;
  const eh = 44;
  const gap = 16;
  const totalH = NUM_EXPERTS * eh + (NUM_EXPERTS - 1) * gap;
  const ey0 = (H - totalH) / 2;
  const expertCy = (i: number) => ey0 + i * (eh + gap) + eh / 2;

  // token box
  const tokW = 150;
  const tokH = 78;
  svg.append("rect").attr("x", 12).attr("y", cy - tokH / 2).attr("width", tokW).attr("height", tokH).attr("rx", 12)
    .style("fill", "var(--surface)").style("stroke", "var(--border)");
  svg.append("text").attr("x", 12 + tokW / 2).attr("y", cy + 12).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "34px").style("font-weight", "700").text(o.token.glyph);

  // arrow token → router
  const routerX = 200;
  const routerW = 176;
  const routerH = 90;
  svg.append("line").attr("x1", 12 + tokW).attr("y1", cy).attr("x2", routerX).attr("y2", cy).style("stroke", "var(--fg)").style("stroke-width", 2);
  // router box
  svg.append("rect").attr("x", routerX).attr("y", cy - routerH / 2).attr("width", routerW).attr("height", routerH).attr("rx", 14)
    .style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.6);
  svg.append("text").attr("x", routerX + routerW / 2).attr("y", cy + 11).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "30px").text(o.routerLabel);

  // connecting lines router → selected experts (drawn first, under the boxes)
  routing.selected.forEach((i) => {
    const line = svg.append("line").attr("x1", routerX + routerW).attr("y1", cy).attr("x2", ex0).attr("y2", expertCy(i))
      .style("stroke", "var(--signal)").style("stroke-width", 2.6);
    if (dur) line.style("opacity", 0).transition().duration(dur).style("opacity", 1);
  });

  // experts
  for (let i = 0; i < NUM_EXPERTS; i++) {
    const ey = ey0 + i * (eh + gap);
    const sel = selectedSet.has(i);
    const fillW = 10 + (routing.probs[i] / maxProb) * (ew - 14);
    const g = svg.append("g").style("opacity", sel ? 1 : 0.55);
    // track
    g.append("rect").attr("x", ex0).attr("y", ey).attr("width", ew).attr("height", eh).attr("rx", 10)
      .style("fill", "var(--surface)")
      .style("stroke", sel ? "var(--signal)" : "var(--border)")
      .style("stroke-width", sel ? 2.6 : 1);
    // score fill (the router's score for this expert)
    const fill = g.append("rect").attr("x", ex0).attr("y", ey).attr("height", eh).attr("rx", 10)
      .style("fill", sel ? "var(--signal)" : "var(--tok-space)")
      .style("fill-opacity", sel ? 0.32 : 0.28);
    if (dur) fill.attr("width", 0).transition().duration(dur).attr("width", fillW);
    else fill.attr("width", fillW);
    // label
    g.append("text").attr("x", ex0 + 14).attr("y", ey + eh / 2 + 10).attr("text-anchor", "start")
      .style("fill", sel ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", "30px").style("font-weight", sel ? "700" : "400")
      .text(`${o.expertPrefix}${i + 1}`);
    // selected tick
    if (sel) {
      g.append("text").attr("x", ex0 + ew - 12).attr("y", ey + eh / 2 + 10).attr("text-anchor", "end")
        .style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", "30px").style("font-weight", "700").text("✓");
    }
  }
}

/* --- Node 2: tokens-per-expert bars, capacity line, red overflow -------- */

function drawLoad(
  el: SVGSVGElement,
  o: { load: number[]; capacity: number; reduce: boolean; capacityLabel: string; expertPrefix: string },
) {
  const W = 700;
  const H = 400;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 520;

  const x0 = 44;
  const baseline = 336;
  const top = 40;
  const plotH = baseline - top;
  const slot = (W - x0 - 16) / NUM_EXPERTS;
  const barW = slot - 26;
  const maxScale = Math.max(Math.max(...o.load), o.capacity) * 1.12;
  const yOf = (v: number) => (v / maxScale) * plotH;

  // baseline
  svg.append("line").attr("x1", x0 - 8).attr("y1", baseline).attr("x2", W - 8).attr("y2", baseline).style("stroke", "var(--border)").style("stroke-width", 1.5);

  // bars
  for (let i = 0; i < NUM_EXPERTS; i++) {
    const bx = x0 + i * slot + (slot - barW) / 2;
    const served = Math.min(o.load[i], o.capacity);
    const over = Math.max(0, o.load[i] - o.capacity);
    const servedH = yOf(served);
    const overH = yOf(over);
    // served portion (green)
    const gBar = svg.append("rect").attr("x", bx).attr("width", barW).attr("rx", 5).style("fill", "var(--signal)").style("fill-opacity", 0.85);
    // overflow portion (red) — dropped tokens
    const rBar = svg.append("rect").attr("x", bx).attr("width", barW).attr("rx", 5).style("fill", "var(--tok-byte)");
    if (dur) {
      gBar.attr("y", baseline).attr("height", 0).transition().duration(dur).attr("y", baseline - servedH).attr("height", servedH);
      rBar.attr("y", baseline - servedH).attr("height", 0).transition().duration(dur).attr("y", baseline - servedH - overH).attr("height", overH);
    } else {
      gBar.attr("y", baseline - servedH).attr("height", servedH);
      rBar.attr("y", baseline - servedH - overH).attr("height", overH);
    }
    // expert label under baseline
    svg.append("text").attr("x", bx + barW / 2).attr("y", baseline + 32).attr("text-anchor", "middle")
      .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "30px").text(`${o.expertPrefix}${i + 1}`);
  }

  // capacity line (dashed) + label
  const capY = baseline - yOf(o.capacity);
  svg.append("line").attr("x1", x0 - 8).attr("y1", capY).attr("x2", W - 8).attr("y2", capY)
    .style("stroke", "var(--fg)").style("stroke-width", 1.6).style("stroke-dasharray", "8 6");
  svg.append("text").attr("x", W - 12).attr("y", capY - 12).attr("text-anchor", "end")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "30px").text(o.capacityLabel);
}

/* --- Node 3: shared expert + top-K routed experts → output -------------- */

function drawShared(
  el: SVGSVGElement,
  o: { shared: boolean; routedK: number; reduce: boolean; tokenGlyph: string; sharedLabel: string; expertPrefix: string; outputLabel: string },
) {
  const W = 700;
  const H = 460;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 380;
  const cy = H / 2;

  // token
  const tokW = 120;
  const tokH = 76;
  svg.append("rect").attr("x", 12).attr("y", cy - tokH / 2).attr("width", tokW).attr("height", tokH).attr("rx", 12)
    .style("fill", "var(--surface)").style("stroke", "var(--border)");
  svg.append("text").attr("x", 12 + tokW / 2).attr("y", cy + 12).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "34px").style("font-weight", "700").text(o.tokenGlyph);

  // expert column + output geometry
  const ex0 = 250;
  const ew = 210;
  const eh = 50;
  const gap = 16;
  const outX = 512;
  const outW = 172;

  // build the item list: shared (if on) then routed experts
  interface Item { kind: "shared" | "routed"; idx: number }
  const items: Item[] = [];
  if (o.shared) items.push({ kind: "shared", idx: 0 });
  for (let i = 0; i < o.routedK; i++) items.push({ kind: "routed", idx: i });
  const totalH = items.length * eh + (items.length - 1) * gap;
  const y0 = cy - totalH / 2;
  const itemCy = (row: number) => y0 + row * (eh + gap) + eh / 2;

  // output box (sum)
  const outH = Math.max(96, totalH * 0.6);
  svg.append("rect").attr("x", outX).attr("y", cy - outH / 2).attr("width", outW).attr("height", outH).attr("rx", 14)
    .style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.6);
  svg.append("text").attr("x", outX + outW / 2).attr("y", cy - 4).attr("text-anchor", "middle")
    .style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "30px").style("letter-spacing", "0.02em").text(o.outputLabel);
  svg.append("text").attr("x", outX + outW / 2).attr("y", cy + 28).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "30px").text("Σ");

  items.forEach((it, row) => {
    const ey = y0 + row * (eh + gap);
    const iy = itemCy(row);
    const isShared = it.kind === "shared";
    // connecting line: token → item, and item → output
    svg.append("line").attr("x1", 12 + tokW).attr("y1", cy).attr("x2", ex0).attr("y2", iy)
      .style("stroke", isShared ? "var(--signal)" : "var(--muted)").style("stroke-width", isShared ? 2.6 : 1.8).style("opacity", isShared ? 1 : 0.7);
    const l2 = svg.append("line").attr("x1", ex0 + ew).attr("y1", iy).attr("x2", outX).attr("y2", cy)
      .style("stroke", isShared ? "var(--signal)" : "var(--muted)").style("stroke-width", isShared ? 2.6 : 1.8).style("opacity", isShared ? 1 : 0.7);
    if (dur && isShared) l2.style("opacity", 0).transition().duration(dur).style("opacity", 1);

    // box
    svg.append("rect").attr("x", ex0).attr("y", ey).attr("width", ew).attr("height", eh).attr("rx", 10)
      .style("fill", isShared ? "var(--signal-wash)" : "var(--surface)")
      .style("stroke", isShared ? "var(--signal)" : "var(--border)")
      .style("stroke-width", isShared ? 2.6 : 1);

    // routed boxes with NO shared expert grow a grey "common" band (duplicated basics)
    if (!isShared && !o.shared) {
      svg.append("rect").attr("x", ex0).attr("y", ey).attr("width", 40).attr("height", eh).attr("rx", 10)
        .style("fill", "var(--tok-space)").style("fill-opacity", 0.5);
    }

    // label
    const label = isShared ? o.sharedLabel : `${o.expertPrefix}${it.idx + 1}`;
    svg.append("text").attr("x", isShared ? ex0 + ew / 2 : ex0 + (!o.shared ? 56 : 16)).attr("y", ey + eh / 2 + 10)
      .attr("text-anchor", isShared ? "middle" : "start")
      .style("fill", isShared ? "var(--fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "30px").style("font-weight", isShared ? "700" : "400")
      .text(label);
  });
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

function useMoe() {
  const { t } = useAcademy();
  return t.mixtureOfExperts;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const moe = useMoe();
  const n = moe.nodes[0];
  const [tokenIdx, setTokenIdx] = useState(0);
  const [k, setK] = useState(2);
  const [last, setLast] = useState<"token" | "k">("token");
  const token = MOE_TOKENS[tokenIdx];
  const pct = Math.round(activeFraction(k) * 100);
  const note = last === "k" ? n.sliderNote : n.optionNotes?.[tokenIdx];
  return (
    <SceneShell
      id="moe-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <ControlRow>
            {moe.n1tokenLabels.map((lab, i) => (
              <Toggle key={i} on={tokenIdx === i} onClick={() => { setTokenIdx(i); setLast("token"); }}>{lab}</Toggle>
            ))}
          </ControlRow>
          <Slider id="moe-topk" label={moe.n1topk} value={k} display={`${k} / ${NUM_EXPERTS}`} min={1} max={4} onChange={(v) => { setK(v); setLast("k"); }} />
        </>
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: String(NUM_EXPERTS) },
          { k: n.rows[1], v: String(k), hi: true },
          { k: n.rows[2], v: `${k}/${NUM_EXPERTS} · ${pct}%` },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawRoute(el, { token, k, reduce, routerLabel: moe.n1routerLabel, expertPrefix: moe.n1expertPrefix })} deps={[tokenIdx, k, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const moe = useMoe();
  const n = moe.nodes[1];
  const [alpha100, setAlpha100] = useState(0);
  const alpha = alpha100 / 100;
  const st = loadDistribution(alpha);
  const bucket = alpha100 < 34 ? 0 : alpha100 < 67 ? 1 : 2;
  return (
    <SceneShell
      id="moe-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={moe.n2notes[bucket]}
      aside={<Callout label={moe.calloutLabel} title={moe.calloutTitle}>{rich(moe.calloutBody)}</Callout>}
      controls={
        <Slider id="moe-alpha" label={moe.n2slider} value={alpha100} display={alpha.toFixed(2)} min={0} max={100} onChange={setAlpha100} />
      }
      readout={
        <Readout title={n.readoutTitle} note={n.readoutNote} rows={[
          { k: n.rows[0], v: `${st.busiest} / ${st.capacity}`, hi: st.busiest > st.capacity },
          { k: n.rows[1], v: `${st.idle} / ${NUM_EXPERTS}` },
          { k: n.rows[2], v: `${st.dropped} / ${BATCH_TOKENS}`, hi: st.dropped > 0 },
        ]} />
      }
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawLoad(el, { load: st.load, capacity: st.capacity, reduce, capacityLabel: moe.n2capacityLabel, expertPrefix: moe.n2expertPrefix })} deps={[alpha100, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const moe = useMoe();
  const n = moe.nodes[2];
  const [shared, setShared] = useState(true);
  const [k, setK] = useState(2);
  const note = n.optionNotes?.[shared ? 1 : 0];
  return (
    <SceneShell
      id="moe-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <ControlRow>
            <Toggle on={shared} onClick={() => setShared((v) => !v)}>{moe.n3shared}: {shared ? "ON" : "OFF"}</Toggle>
          </ControlRow>
          <Slider id="moe-routed" label={moe.n3routedSlider} value={k} display={`${k} / ${NUM_EXPERTS}`} min={1} max={4} onChange={setK} />
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawShared(el, { shared, routedK: k, reduce, tokenGlyph: moe.n3tokenGlyph, sharedLabel: moe.n3sharedLabel, expertPrefix: moe.n3expertPrefix, outputLabel: moe.n3outputLabel })} deps={[shared, k, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function MixtureOfExperts() {
  const { t, lang } = useAcademy();
  const moe = t.mixtureOfExperts;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{moe.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {moe.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{moe.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{moe.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {moe.pipeline.map((label, i) => (
              <a key={i} href={`#moe-node-${i + 1}`} className="u-hover-fg-border"
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

      {/* ---- Go deeper ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0" }}>
        <Deeper title={moe.deeperTitle}>{rich(moe.deeperBody)}</Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{moe.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{moe.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(moe.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{moe.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(moe.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/flash-attention" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {moe.prevLesson}</Link>
        <Link href="/stage/0/constrained-decoding" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{moe.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
