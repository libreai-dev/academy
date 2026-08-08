"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import LessonRail from "./LessonRail";
import { MONO, DISPLAY, useReducedMotion, Cap, rich } from "./lesson-kit";
import { EMB, EMB_GROUPS, type EmbGroup, type EmbWord, embOf, nearest, analogy, ANALOGIES } from "../lib/embeddings";

const GROUP_COLOR: Record<EmbGroup, string> = {
  people: "var(--tok-num)",
  animal: "var(--tok-word)",
  food: "var(--tok-sub)",
  tech: "var(--tok-punct)",
};

// map data-space (0..100, y up) → svg-space (y down), with a small margin
const sx = (x: number) => x;
const sy = (y: number) => 100 - y;
const rnd = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

type Lesson = ReturnType<typeof useAcademy>["t"]["emb"];

export default function Embeddings() {
  const { t, lang } = useAcademy();
  const e = t.emb;
  const reduce = useReducedMotion();
  const label = (w: string) => e.words[w] ?? w;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 32px 0", display: "flex", flexWrap: "wrap", gap: "clamp(28px, 4vw, 60px)", alignItems: "flex-start" }}>
      <LessonRail current={6} />

      <article style={{ flex: "1 1 560px", minWidth: 0, paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{e.crumb}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1, margin: "16px 0 0" }}>{e.title}</h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "60ch", textWrap: "pretty" }}>{rich(e.lede)}</p>

        {/* ---- Hero: a word becomes a point ------------------------ */}
        <Hero e={e} reduce={reduce} label={label} />

        {/* ---- Concept 1 ------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {e.concept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive 1: the map ------------------------------ */}
        <MapExplore e={e} reduce={reduce} label={label} />

        {/* ---- Concept 2: pretraining ------------------------------ */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {e.ptConcept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive 2: arithmetic --------------------------- */}
        <Arithmetic e={e} reduce={reduce} label={label} />

        {/* ---- The embedding & unembedding matrices --------------- */}
        <EmbMatrix e={e} reduce={reduce} />

        {/* ---- Interactive 3: how this becomes the next token ------ */}
        <NextToken e={e} reduce={reduce} />

        {/* ---- Explain it back ------------------------------------- */}
        <div style={{ marginTop: "clamp(28px, 3.2vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
          <ExplainBack q={e.explainQ} a={e.explainA} reveal={t.reveal} hide={t.hide} label={t.explainLabel} reduce={reduce} />
        </div>

        {/* ---- Go deeper ------------------------------------------- */}
        <Deeper title={e.deeperTitle} body={e.deeperBody} reduce={reduce} />
        <Deeper title={e.cosTitle} body={e.cosBody} reduce={reduce} />

        {/* ---- Bridge to Transformers ------------------------------ */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{e.bridgeLabel}</div>
          <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", maxWidth: "60ch", textWrap: "pretty" }}>{rich(e.bridgeBody)}</p>
        </div>

        {/* ---- Controls -------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/stage/1/gpu-or-cpu" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {e.prev}</Link>
            <Link href="/stage/1/transformers" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>{e.next} →</Link>
          </div>
          <MarkComplete markLabel={t.markComplete} doneLabel={t.completed} />
        </div>

        <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>{lang === "es" ? "Idioma: Español" : "Language: English"}</div>
      </article>
    </div>
  );
}

/* =====================================================================
   Hero — the word "queen" → a vector → a point next to "king"
   ===================================================================== */

function Hero({ e, reduce, label }: { e: Lesson; reduce: boolean; label: (w: string) => string }) {
  const vec = [0.82, -0.14, 0.37, 0.05, -0.61, 0.29]; //  illustrative numbers
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const svg = d3.select(el).attr("viewBox", "0 0 100 80");
    svg.selectAll("*").remove();
    // four words from different neighbourhoods — queen lands by king, far from cat/pizza
    const raw = ["king", "queen", "cat", "pizza"].map((w) => ({ ...embOf(w)!, hot: w === "queen" }));
    const xs = raw.map((r) => r.x), ys = raw.map((r) => r.y);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const NX = (x: number) => 18 + ((x - minx) / (maxx - minx)) * 64;
    const NY = (y: number) => 64 - ((y - miny) / (maxy - miny)) * 50; //  y up
    const pts = raw.map((p) => ({ ...p, cx: NX(p.x), cy: NY(p.y) }));
    svg.append("g").selectAll<SVGCircleElement, (typeof pts)[number]>("circle").data(pts).join("circle")
      .attr("cx", (d) => d.cx).attr("cy", (d) => d.cy).attr("r", (d) => (d.hot ? 5 : 3.4))
      .attr("fill", (d) => GROUP_COLOR[d.g]).attr("fill-opacity", (d) => (d.hot ? 1 : 0.6));
    svg.append("g").selectAll<SVGTextElement, (typeof pts)[number]>("text").data(pts).join("text")
      .attr("x", (d) => d.cx).attr("y", (d) => d.cy - 7).attr("text-anchor", "middle")
      .style("font-family", MONO).style("font-size", "6px").style("font-weight", (d) => (d.hot ? 700 : 400))
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "1.4px").style("stroke-linejoin", "round")
      .style("fill", (d) => (d.hot ? "var(--fg)" : "var(--muted)")).text((d) => label(d.w));
    if (!reduce) {
      svg.selectAll<SVGCircleElement, (typeof pts)[number]>("circle").filter((d) => d.hot).attr("r", 0).transition().delay(450).duration(500).ease(d3.easeBackOut).attr("r", 5);
    }
  }, [e, reduce, label]);

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", background: "var(--surface)" }}>
      <div style={{ padding: "clamp(22px,3vw,34px) clamp(20px,2.5vw,30px)" }}>
        <div style={{ textAlign: "center" }}><Cap>{e.heroLabel}</Cap></div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "clamp(12px,2.5vw,26px)", marginTop: 18 }}>
          {/* word */}
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,4vw,40px)", fontWeight: 600, letterSpacing: "-.03em", color: GROUP_COLOR.people }}>“{e.heroWord}”</div>
          <span aria-hidden style={{ fontSize: 22, color: "var(--muted)" }}>→</span>
          {/* vector */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", maxWidth: 230 }}>
              {vec.map((n, i) => (
                <span key={i} style={{ fontFamily: MONO, fontSize: 12.5, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 6px", color: "var(--fg)" }}>{n >= 0 ? " " : ""}{n.toFixed(2)}</span>
              ))}
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)", alignSelf: "center" }}>…</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--muted)" }}>{e.heroVecLabel}</div>
          </div>
          <span aria-hidden style={{ fontSize: 22, color: "var(--muted)" }}>→</span>
          {/* map crop */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg)", padding: 6, width: 150 }}>
              <svg ref={ref} width="100%" style={{ display: "block", overflow: "visible" }} aria-hidden />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--muted)", maxWidth: 170, textAlign: "center", lineHeight: 1.4 }}>{e.heroMapLabel}</div>
          </div>
        </div>
        <p style={{ margin: "18px auto 0", maxWidth: "52ch", textAlign: "center", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, textWrap: "pretty" }}>{rich(e.heroCaption)}</p>
      </div>
    </div>
  );
}

/* =====================================================================
   Interactive 1 — the map: click for neighbours, watch it "train"
   ===================================================================== */

function MapExplore({ e, reduce, label }: { e: Lesson; reduce: boolean; label: (w: string) => string }) {
  const [sel, setSel] = useState<string>("king");
  const [scattered, setScattered] = useState(false);
  const ref = useRef<SVGSVGElement | null>(null);

  const learned = useMemo(() => Object.fromEntries(EMB.map((d) => [d.w, { x: d.x, y: d.y }])), []);
  const random = useMemo(() => Object.fromEntries(EMB.map((d, i) => [d.w, { x: 8 + rnd(i * 3.1 + 1) * 84, y: 8 + rnd(i * 7.7 + 2) * 84 }])), []);
  const pos = scattered ? random : learned;

  const neighbours = useMemo(() => (sel && !scattered ? nearest(learned[sel].x, learned[sel].y, [sel], 3) : []), [sel, scattered, learned]);
  const nbSet = useMemo(() => new Set(neighbours.map((n) => n.word.w)), [neighbours]);

  useEffect(() => {
    drawScatter(ref.current, { pos, sel: scattered ? null : sel, nbSet, reduce, label, onSelect: (w) => { if (!scattered) setSel(w); } });
  }, [pos, sel, nbSet, scattered, reduce, label]);

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{e.mapLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{e.mapTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.mapBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        {/* legend + train toggle */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {EMB_GROUPS.map((g) => (
              <span key={g} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>
                <span aria-hidden style={{ width: 9, height: 9, borderRadius: 999, background: GROUP_COLOR[g] }} />{e.groupLabels[g]}
              </span>
            ))}
          </div>
          <button type="button" onClick={() => setScattered((v) => !v)} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 12.5, fontWeight: 600, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }}>
            {scattered ? "▸ train (settle)" : "↺ randomise"}
          </button>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "10px", background: "var(--surface)" }}>
          <svg ref={ref} width="100%" viewBox="-4 -4 108 108" style={{ display: "block", overflow: "visible", touchAction: "manipulation" }} role="img" aria-label={e.mapTitle} />
        </div>

        {/* neighbours readout */}
        <div style={{ marginTop: 14, minHeight: 30, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          {!scattered && (
            <>
              <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".06em", color: "var(--muted)" }}>{label(sel)} · {e.mapNearLabel}:</span>
              {neighbours.map((n) => (
                <button key={n.word.w} type="button" onClick={() => setSel(n.word.w)} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: DISPLAY, fontWeight: 600, fontSize: 13.5, padding: "5px 11px", borderRadius: 999, border: `1px solid ${GROUP_COLOR[n.word.g]}`, background: `color-mix(in srgb, ${GROUP_COLOR[n.word.g]} 12%, transparent)`, color: "var(--fg)" }}>{label(n.word.w)}</button>
              ))}
            </>
          )}
        </div>

        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.mapNote)}</p>
      </div>
    </div>
  );
}

/** Scatter of every word; transitions dots to `pos`, highlights `sel` + `nbSet`. */
function drawScatter(el: SVGSVGElement | null, opts: { pos: Record<string, { x: number; y: number }>; sel: string | null; nbSet: Set<string>; reduce: boolean; label: (w: string) => string; onSelect: (w: string) => void }) {
  if (!el) return;
  const { pos, sel, nbSet, reduce, label, onSelect } = opts;
  const svg = d3.select(el);
  const hot = (w: string) => w === sel || nbSet.has(w);
  const dim = (w: string) => (sel ? (hot(w) ? 1 : 0.28) : 1);

  // neighbour links
  const links = sel ? [...nbSet].map((w) => ({ a: pos[sel], b: pos[w] })) : [];
  svg.selectAll<SVGLineElement, { a: { x: number; y: number }; b: { x: number; y: number } }>("line.nb").data(links).join("line").attr("class", "nb")
    .attr("x1", (d) => sx(d.a.x)).attr("y1", (d) => sy(d.a.y)).attr("x2", (d) => sx(d.b.x)).attr("y2", (d) => sy(d.b.y))
    .attr("stroke", GROUP_COLOR.people).attr("stroke-width", 0.5).attr("stroke-opacity", 0.5);

  const dur = reduce ? 0 : 850;
  const g = svg.selectAll<SVGGElement, EmbWord>("g.node").data(EMB, (d) => d.w).join(
    (enter) => {
      const gg = enter.append("g").attr("class", "node").style("cursor", "pointer");
      gg.append("circle");
      gg.append("text");
      gg.on("click", (_ev, d) => onSelect(d.w));
      return gg;
    },
  );
  g.select("circle")
    .attr("r", (d) => (d.w === sel ? 2.8 : nbSet.has(d.w) ? 2.2 : 1.8))
    .attr("fill", (d) => GROUP_COLOR[d.g]).attr("fill-opacity", (d) => dim(d.w))
    .attr("stroke", (d) => GROUP_COLOR[d.g]).attr("stroke-opacity", (d) => (d.w === sel ? 1 : 0)).attr("stroke-width", 0.8);
  g.select("text")
    .attr("dx", 2.6).attr("dy", 1.2).style("font-family", MONO)
    .style("font-size", (d) => (d.w === sel ? "3.6px" : "2.9px")).style("font-weight", (d) => (hot(d.w) ? 700 : 400))
    .style("fill", (d) => (hot(d.w) ? "var(--fg)" : "var(--muted)")).style("fill-opacity", (d) => dim(d.w))
    .text((d) => label(d.w));
  g.transition().duration(dur).attr("transform", (d) => `translate(${sx(pos[d.w].x)},${sy(pos[d.w].y)})`);
}

/* =====================================================================
   Interactive 2 — vector arithmetic: a − b + c ≈ ?
   ===================================================================== */

function Arithmetic({ e, reduce, label }: { e: Lesson; reduce: boolean; label: (w: string) => string }) {
  const [a, setA] = useState("king");
  const [b, setB] = useState("man");
  const [c, setC] = useState("woman");
  const [stage, setStage] = useState(5); //  1 points · 2 base · 3 −b · 4 +c · 5 nearest
  const ref = useRef<SVGSVGElement | null>(null);
  const timers = useRef<number[]>([]);
  const res = useMemo(() => analogy(a, b, c), [a, b, c]);

  useEffect(() => {
    drawArith(ref.current, { a, b, c, res, stage, label });
  }, [a, b, c, res, stage, label]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const setOp = (na: string, nb: string, nc: string) => { setA(na); setB(nb); setC(nc); setStage(5); };
  const play = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setStage(1);
    if (reduce) { setStage(5); return; }
    [2, 3, 4, 5].forEach((s, i) => timers.current.push(window.setTimeout(() => setStage(s), 850 * (i + 1))));
  };

  const opts = EMB.map((d) => d.w);
  const Sel = ({ value, onChange, tag }: { value: string; onChange: (v: string) => void; tag: string }) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".06em", color: "var(--muted)" }}>{tag}</span>
      <select value={value} onChange={(ev) => { onChange(ev.target.value); setStage(4); }} style={{ appearance: "none", font: "inherit", fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)", cursor: "pointer" }}>
        {opts.map((w) => <option key={w} value={w}>{label(w)}</option>)}
      </select>
    </label>
  );

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{e.arLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{e.arTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.arBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)", display: "flex", flexWrap: "wrap", gap: "clamp(20px,3vw,32px)" }}>
        <div style={{ flex: "1 1 320px", minWidth: 290 }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "10px", background: "var(--surface)" }}>
            <svg ref={ref} width="100%" viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }} role="img" aria-label={e.arTitle} />
          </div>
          {/* stage controls */}
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {([
              [1, "var(--muted)", "1 · points"],
              [2, "var(--tok-num)", `2 · ${label(a)}`],
              [3, "var(--tok-byte)", `3 · − ${label(b)}`],
              [4, "var(--tok-word)", `4 · + ${label(c)}`],
              [5, "var(--tok-num)", `5 · ≈ ${res ? label(res.ranked[0].word.w) : "?"}`],
            ] as [number, string, string][]).map(([n, color, text]) => (
              <StepChip key={n} active={stage === n} color={color} onClick={() => setStage(n)}>{text}</StepChip>
            ))}
            <button type="button" onClick={play} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 12.5, fontWeight: 600, padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)", marginLeft: "auto" }}>▸ play</button>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, textWrap: "pretty" }}>{rich(e.arRead)}</p>
        </div>

        <div style={{ flex: "1 1 210px", minWidth: 210, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* presets */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ANALOGIES.map((p, i) => (
              <button key={i} type="button" onClick={() => setOp(p.a, p.b, p.c)} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 12, padding: "7px 10px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }}>{label(p.a)}−{label(p.b)}+{label(p.c)}</button>
            ))}
          </div>
          {/* selects */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Sel value={a} onChange={setA} tag={e.arSlotStart} />
            <Sel value={b} onChange={setB} tag={e.arSlotMinus} />
            <Sel value={c} onChange={setC} tag={e.arSlotPlus} />
          </div>
          {/* result */}
          <div style={{ border: `1px solid ${res ? GROUP_COLOR[res.ranked[0].word.g] : "var(--border)"}`, borderRadius: 12, padding: "14px 16px", background: "var(--surface)" }}>
            <div style={{ fontFamily: MONO, fontSize: 13, color: "var(--fg)" }}>{label(a)} − {label(b)} + {label(c)}</div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)", marginTop: 10 }}>{e.arResultLabel}</div>
            {res && <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, letterSpacing: "-.03em", color: GROUP_COLOR[res.ranked[0].word.g], marginTop: 2 }}>{label(res.ranked[0].word.w)}</div>}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 clamp(20px, 2.5vw, 28px) clamp(20px, 2.5vw, 28px)" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.arNote)}</p>
      </div>
    </div>
  );
}

function StepChip({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 12.5, fontWeight: 700, padding: "8px 12px", borderRadius: 9, border: `1px solid ${active ? color : "var(--border)"}`, background: active ? `color-mix(in srgb, ${color} 14%, transparent)` : "var(--bg)", color: active ? "var(--fg)" : "var(--muted)" }}>{children}</button>
  );
}

/** A staged vector diagram: (1) all concept points — hover any to see its vector
 *  from 0; (2) the base word as a vector; (3) subtract b; (4) add c; (5) the
 *  result and the nearest word. Stage 1 shows the whole map; later stages zoom
 *  to the operation so the vectors are big. */
function drawArith(el: SVGSVGElement | null, opts: { a: string; b: string; c: string; res: ReturnType<typeof analogy>; stage: number; label: (w: string) => string }) {
  if (!el) return;
  const { a, b, c, res, stage, label } = opts;
  const svg = d3.select(el);
  svg.selectAll("*").remove();
  if (!res) return;
  const A = embOf(a), B = embOf(b), C = embOf(c);
  if (!A || !B || !C) return;

  const cen = (w: { x: number; y: number }) => ({ x: w.x, y: w.y }); //  raw coords → origin stays at bottom-left (one quadrant)
  const O = { x: 0, y: 0 };
  const Ac = cen(A), Bc = cen(B), Cc = cen(C);
  const pB = { x: Ac.x - Bc.x, y: Ac.y - Bc.y }; //  base − b
  const pC = { x: pB.x + Cc.x, y: pB.y + Cc.y }; //  … + c = result (≈ nearest word)
  const win = res.ranked[0].word, winc = cen(win);

  // one fixed frame for every stage — points never move, only the vectors change
  const framePts = [...EMB.map(cen), O];
  const fx = framePts.map((p) => p.x), fy = framePts.map((p) => p.y);
  const cX = (Math.min(...fx) + Math.max(...fx)) / 2, cY = (Math.min(...fy) + Math.max(...fy)) / 2;
  const half = (Math.max(Math.max(...fx) - Math.min(...fx), Math.max(...fy) - Math.min(...fy)) / 2) * 1.35 + 6;
  const sc = 44 / half;
  const PX = (v: { x: number; y: number }) => 50 + (v.x - cX) * sc;
  const PY = (v: { x: number; y: number }) => 50 - (v.y - cY) * sc;

  const BLUE = "var(--tok-num)", RED = "var(--tok-byte)", GRN = "var(--tok-word)", MUT = "var(--muted)";

  const defs = svg.append("defs");
  const mk = (id: string, color: string) => defs.append("marker").attr("id", id).attr("viewBox", "0 0 10 10").attr("refX", 8).attr("refY", 5).attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 5.5).attr("markerHeight", 5.5).attr("orient", "auto").append("path").attr("d", "M0,1.5 L9,5 L0,8.5 z").attr("fill", color);
  mk("ah-blue", BLUE); mk("ah-red", RED); mk("ah-grn", GRN);

  // axes + origin
  svg.append("line").attr("x1", 0).attr("y1", PY(O)).attr("x2", 100).attr("y2", PY(O)).attr("stroke", "var(--border)").attr("stroke-width", 0.5).attr("stroke-opacity", 0.8);
  svg.append("line").attr("x1", PX(O)).attr("y1", 0).attr("x2", PX(O)).attr("y2", 100).attr("stroke", "var(--border)").attr("stroke-width", 0.5).attr("stroke-opacity", 0.8);
  svg.append("circle").attr("cx", PX(O)).attr("cy", PY(O)).attr("r", 0.8).attr("fill", MUT);
  svg.append("text").attr("x", PX(O) + 2.8).attr("y", PY(O) + 3.4).style("font-family", MONO).style("font-size", "3.4px").style("fill", MUT).text("0");

  const inView = (d: EmbWord) => { const x = PX(cen(d)), y = PY(cen(d)); return x >= 1 && x <= 99 && y >= 1 && y <= 99; };
  const arrow = (p: { x: number; y: number }, q: { x: number; y: number }, color: string, marker: string, w: number, op: number) =>
    svg.append("line").attr("x1", PX(p)).attr("y1", PY(p)).attr("x2", PX(q)).attr("y2", PY(q)).attr("stroke", color).attr("stroke-width", w).attr("stroke-opacity", op).attr("marker-end", `url(#${marker})`);
  const dot = (p: { x: number; y: number }, color: string, r: number) => svg.append("circle").attr("cx", PX(p)).attr("cy", PY(p)).attr("r", r).attr("fill", color);
  const tag = (p: { x: number; y: number }, text: string, color: string, dyy = -4.8) =>
    svg.append("text").attr("x", PX(p)).attr("y", PY(p) + dyy).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "4px").style("font-weight", 700)
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "1.2px").style("stroke-linejoin", "round").style("fill", color).text(text);
  const midTag = (p: { x: number; y: number }, q: { x: number; y: number }, text: string, color: string) => {
    const x1 = PX(p), y1 = PY(p), x2 = PX(q), y2 = PY(q), dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    svg.append("text").attr("x", x1 + dx * 0.5 + (-dy / len) * 4.6).attr("y", y1 + dy * 0.5 + (dx / len) * 4.6).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "4px").style("font-weight", 700)
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "1.2px").style("stroke-linejoin", "round").style("fill", color).text(text);
  };

  // a faint field of every concept point — identical on every stage
  svg.append("g").selectAll("circle").data(EMB.filter(inView)).join("circle")
    .attr("cx", (d) => PX(cen(d))).attr("cy", (d) => PY(cen(d))).attr("r", 1.4).attr("fill", (d) => GROUP_COLOR[d.g]).attr("fill-opacity", 0.16);

  const W = 0.8; //  uniform, solid stroke for every vector
  if (stage === 1) {
    // the three original word-vectors, straight from 0
    arrow(O, Ac, BLUE, "ah-blue", W, 1); dot(Ac, BLUE, 1.8); tag(Ac, label(a), BLUE);
    arrow(O, Bc, RED, "ah-red", W, 1); dot(Bc, RED, 1.8); tag(Bc, label(b), RED);
    arrow(O, Cc, GRN, "ah-grn", W, 1); dot(Cc, GRN, 1.8); tag(Cc, label(c), GRN);
  } else if (stage === 2) {
    // the base word, as a single vector from 0
    arrow(O, Ac, BLUE, "ah-blue", W, 1); dot(Ac, BLUE, 1.7); tag(Ac, label(a), BLUE);
  } else if (stage === 3) {
    // subtract b: chain −b onto the base
    arrow(O, Ac, BLUE, "ah-blue", W, 1); dot(Ac, BLUE, 1.6); tag(Ac, label(a), "var(--fg)");
    arrow(Ac, pB, RED, "ah-red", W, 1); midTag(Ac, pB, `− ${label(b)}`, RED); dot(pB, RED, 1.4);
  } else if (stage === 4) {
    // add c: chain +c → the result point
    arrow(O, Ac, BLUE, "ah-blue", W, 1); dot(Ac, BLUE, 1.6); tag(Ac, label(a), "var(--fg)");
    arrow(Ac, pB, RED, "ah-red", W, 1); midTag(Ac, pB, `− ${label(b)}`, RED);
    arrow(pB, pC, GRN, "ah-grn", W, 1); midTag(pB, pC, `+ ${label(c)}`, GRN); dot(pC, "var(--fg)", 1.4);
  } else {
    // stage 5 — the chain lands, and the nearest word is the answer
    arrow(O, Ac, BLUE, "ah-blue", W, 1);
    arrow(Ac, pB, RED, "ah-red", W, 1);
    arrow(pB, pC, GRN, "ah-grn", W, 1);
    dot(winc, GROUP_COLOR[win.g], 2.2); tag(winc, label(win.w), GROUP_COLOR[win.g], -5.6);
  }
}

/* =====================================================================
   Interactive 3 — how this becomes the next token (d3 pipeline)
   ===================================================================== */

const WEIGHT = "var(--tok-num)"; //  learned weight matrices (the fixed bookends) — blue
const DATA = "var(--tok-sub)"; //    live data flowing through at inference — warm accent
const PIPE_TOKENS = ["the", "cat", "sat", "on"]; //  a prompt; next token → "mat"
const PIPE_WINNER = "mat";
const SH = { emb: "200k × 4k", seq: "N × 4k", vec: "1 × 4k", unemb: "4k × 200k", log: "1 × 200k" };
const prand = (n: number) => { const s = Math.sin(n * 91.7) * 43758.5; return s - Math.floor(s); };

/* =====================================================================
   The embedding & unembedding matrices — where the 200k tokens live
   ===================================================================== */

/** A few illustrative coordinates for a token's 4,096-number row (deterministic
 *  per word, so it's stable across renders — these are for the *shape* of it). */
function emNums(word: string): string[] {
  const seed = [...word].reduce((s, c) => s + c.charCodeAt(0), 0);
  return Array.from({ length: 5 }, (_, i) => {
    const v = (prand(seed + i * 17.3) * 2 - 1) * 1.6;
    return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
  });
}

function EmbMatrix({ e, reduce }: { e: Lesson; reduce: boolean }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [sel, setSel] = useState(0);
  useEffect(() => { drawEmbMatrix(ref.current, e, sel, reduce, setSel); }, [e, sel, reduce]);
  const word = e.emWords[sel];

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{e.emLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{e.emTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.emBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        {/* token picker */}
        <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{e.emPick}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {e.emWords.map((w, i) => (
            <button key={w} type="button" onClick={() => setSel(i)} aria-pressed={i === sel} style={chipBtn(i === sel)}>{w}</button>
          ))}
        </div>

        {/* the matrix */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", padding: "10px clamp(8px,2vw,16px)", overflowX: "auto" }}>
          <svg ref={ref} viewBox="0 0 580 236" style={{ display: "block", width: "100%", minWidth: 440 }} role="img" aria-label={e.emTitle} />
        </div>

        {/* readout for the picked token's row */}
        <div aria-live="polite" style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", padding: "14px clamp(14px,2vw,20px)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: "var(--fg)" }}>{e.emReadout.replace("{word}", word)}</span>
          <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
            {emNums(word).map((num, i) => (
              <span key={i} style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "var(--fg)", background: `color-mix(in srgb, ${DATA} 22%, var(--bg))`, border: `1px solid ${DATA}`, borderRadius: 6, padding: "1px 7px" }}>{num}</span>
            ))}
            <span style={{ fontFamily: MONO, fontSize: 13, color: "var(--muted)", alignSelf: "center" }}>… ×4,096</span>
          </span>
        </div>

        {/* unembedding + pretraining notes */}
        <div style={{ marginTop: 18, fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, letterSpacing: "-.02em" }}>{e.emUnembTitle}</div>
        <p style={{ margin: "6px 0 0", fontSize: 15, color: "var(--muted)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.emUnembBody)}</p>
        <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--fg)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.emPretrain)}</p>
      </div>
    </div>
  );
}

/** The embedding matrix as a table: rows = tokens, columns = the 4,096 dims.
 *  The picked row is lit; the readout below shows its vector. */
function drawEmbMatrix(el: SVGSVGElement | null, e: Lesson, sel: number, reduce: boolean, onPick: (i: number) => void) {
  if (!el) return;
  const svg = d3.select(el).attr("viewBox", "0 0 580 236");
  svg.selectAll("*").remove();
  const words = e.emWords;

  const mx = 150, my = 52, cols = 24, cw = 17, rowH = 22, rows = words.length;
  const gridRight = mx + cols * cw;

  // header: columns = dimensions
  svg.append("text").attr("x", (mx + gridRight) / 2).attr("y", 30).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "11px").style("font-weight", 700).style("fill", WEIGHT).text(e.emCols);
  // side: rows = tokens (rotated)
  svg.append("text").attr("transform", `translate(20, ${my + (rows * rowH) / 2}) rotate(-90)`).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "11px").style("font-weight", 700).style("fill", "var(--muted)").text(e.emRows);

  // rows
  words.forEach((w, r) => {
    const on = r === sel;
    const y = my + r * rowH;
    const g = svg.append("g").style("cursor", "pointer").on("click", () => onPick(r));
    // full-width hit + selected band
    g.append("rect").attr("x", mx - 2).attr("y", y + 1).attr("width", cols * cw + 4).attr("height", rowH - 2).attr("rx", 4).attr("fill", on ? `color-mix(in srgb, ${WEIGHT} 12%, transparent)` : "transparent").attr("stroke", on ? WEIGHT : "transparent").attr("stroke-opacity", on ? 0.9 : 0).attr("stroke-width", 1.2);
    // cells
    for (let c = 0; c < cols - 1; c++) {
      const op = on ? 0.5 + prand(r * 31 + c) * 0.45 : 0.1 + prand(r * 31 + c) * 0.14;
      g.append("rect").attr("x", mx + c * cw + 1.5).attr("y", y + 3.5).attr("width", cw - 3).attr("height", rowH - 7).attr("rx", 2).attr("fill", WEIGHT).attr("fill-opacity", op);
    }
    g.append("text").attr("x", mx + (cols - 0.5) * cw).attr("y", y + rowH / 2 + 3.5).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "11px").style("fill", "var(--muted)").text("…");
    // token label
    g.append("text").attr("x", mx - 12).attr("y", y + rowH / 2 + 4).attr("text-anchor", "end").style("font-family", MONO).style("font-size", "12px").style("font-weight", on ? 700 : 500).style("fill", on ? "var(--fg)" : "var(--muted)").text(w);
  });

  // "…and ~200,000 more rows"
  svg.append("text").attr("x", mx - 12).attr("y", my + rows * rowH + 16).attr("text-anchor", "end").style("font-family", MONO).style("font-size", "10.5px").style("fill", "var(--muted)").text("⋮");
  svg.append("text").attr("x", mx).attr("y", my + rows * rowH + 16).attr("text-anchor", "start").style("font-family", MONO).style("font-size", "10.5px").style("fill", "var(--muted)").text("+ ~199,994 more rows, one per token");

  void reduce;
}

function NextToken({ e, reduce }: { e: Lesson; reduce: boolean }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const n = e.ntSteps.length;
  useEffect(() => { drawPipeline(ref.current, e, active, zoom, reduce, setActive); }, [e, active, zoom, reduce]);
  const step = e.ntSteps[active];

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{e.ntLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{e.ntTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.ntBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        {/* legend: weights vs live data */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}><span aria-hidden style={{ width: 11, height: 11, borderRadius: 3, background: WEIGHT }} />{e.ntWeights}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}><span aria-hidden style={{ width: 11, height: 11, borderRadius: 3, background: DATA }} />{e.ntData}</span>
        </div>

        {/* the big picture — the active stage is outlined; zoom focuses just it */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", padding: "10px clamp(8px,2vw,16px)", overflowX: zoom ? "hidden" : "auto" }}>
          <svg ref={ref} viewBox="0 0 720 160" style={{ display: "block", width: "100%", minWidth: zoom ? undefined : 460 }} role="img" aria-label={e.ntTitle} />
        </div>

        {/* stage navigation + zoom toggle */}
        <div role="tablist" aria-label={e.ntTitle} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 14 }}>
          <button type="button" onClick={() => setActive((a) => (a - 1 + n) % n)} aria-label={e.ntPrev} style={navBtn(false)}>‹</button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {e.ntSteps.map((s, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === active} aria-label={`${i + 1}. ${s.t}`} onClick={() => setActive(i)} style={navDot(i === active)}>{i + 1}</button>
            ))}
          </div>
          <button type="button" onClick={() => setActive((a) => (a + 1) % n)} aria-label={e.ntNext} style={navBtn(false)}>›</button>
          <button type="button" onClick={() => setZoom((z) => !z)} aria-pressed={zoom} style={{ ...navDot(zoom), width: "auto", padding: "0 12px", height: 30, fontWeight: 600, marginLeft: "auto" }}>{zoom ? e.ntZoomOut : e.ntZoomIn}</button>
        </div>

        {/* explanation box for the active stage */}
        <div aria-live="polite" style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", padding: "16px clamp(16px,2.2vw,22px)", display: "flex", gap: 13, alignItems: "flex-start" }}>
          <span aria-hidden style={{ flex: "0 0 auto", width: 26, height: 26, borderRadius: 999, background: "var(--fg)", color: "var(--accent-ink)", fontFamily: MONO, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{active + 1}</span>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 17, letterSpacing: "-.02em", color: "var(--fg)" }}>{step.t}</div>
            <p style={{ margin: "5px 0 0", fontSize: 15, lineHeight: 1.6, color: "var(--muted)", textWrap: "pretty" }}>{rich(step.d)}</p>
          </div>
        </div>

        {/* weight-tying note */}
        <p style={{ margin: "18px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.ntTying)}</p>
        {/* takeaway */}
        <p style={{ margin: "12px 0 0", fontSize: 15.5, color: "var(--fg)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.ntTakeaway)}</p>
      </div>
    </div>
  );
}

const navBtn = (on: boolean): React.CSSProperties => ({ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: on ? "var(--fg)" : "var(--bg)", color: on ? "var(--accent-ink)" : "var(--fg)", fontFamily: MONO, fontSize: 16, lineHeight: 1, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" });
const navDot = (on: boolean): React.CSSProperties => ({ width: 30, height: 30, borderRadius: 8, border: on ? "1px solid var(--fg)" : "1px solid var(--border)", background: on ? "var(--fg)" : "var(--bg)", color: on ? "var(--accent-ink)" : "var(--muted)", fontFamily: MONO, fontSize: 13, fontWeight: 700, cursor: "pointer" });
const chipBtn = (on: boolean): React.CSSProperties => ({ height: 32, padding: "0 14px", borderRadius: 999, border: on ? "1px solid var(--fg)" : "1px solid var(--border)", background: on ? "var(--fg)" : "var(--bg)", color: on ? "var(--accent-ink)" : "var(--fg)", fontFamily: MONO, fontSize: 13, fontWeight: 700, cursor: "pointer" });

/** The big picture, in miniature: a horizontal 8-stage inference pipeline —
 *  tokens → embedding weights → sequence → the model (a small neural net) →
 *  next-word vector → × unembedding weights → 200k scores → next token. The
 *  `active` stage is lit and outlined; the rest are dimmed. Clicking a stage
 *  calls `onPick`. Weight matrices in WEIGHT colour, live data in DATA colour. */
type Sel = d3.Selection<SVGGElement, unknown, null, undefined>;
function drawPipeline(el: SVGSVGElement | null, e: Lesson, active: number, zoom: boolean, reduce: boolean, onPick: (i: number) => void) {
  if (!el) return;
  const svg = d3.select(el);
  svg.selectAll("*").remove();

  const defs = svg.append("defs");
  defs.append("marker").attr("id", "pl-arrow").attr("viewBox", "0 0 10 10").attr("refX", 8).attr("refY", 5).attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M0,1.5 L9,5 L0,8.5 z").attr("fill", "var(--muted)");

  const S = [
    { cx: 55, hw: 26 }, { cx: 137, hw: 30 }, { cx: 213, hw: 20 }, { cx: 301, hw: 42 },
    { cx: 384, hw: 15 }, { cx: 465, hw: 30 }, { cx: 569, hw: 48 }, { cx: 667, hw: 24 },
  ];
  const midY = 94;
  const boxL = (i: number) => S[i].cx - S[i].hw - 7; //  highlight-box left edge
  const boxR = (i: number) => S[i].cx + S[i].hw + 7; //  highlight-box right edge

  // connectors sit fully in the gaps between highlight boxes (never inside one)
  const arrow = (x1: number, x2: number) => svg.append("line").attr("x1", x1).attr("y1", midY).attr("x2", x2).attr("y2", midY).attr("stroke", "var(--muted)").attr("stroke-width", 1).attr("stroke-opacity", 0.6).attr("marker-end", "url(#pl-arrow)");
  for (let i = 0; i < S.length - 1; i++) arrow(boxR(i) + 1, boxL(i + 1) - 1);
  // × between the vector (5) and the unembedding matrix (6)
  svg.append("text").attr("x", (boxR(4) + boxL(5)) / 2).attr("y", midY - 8).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "12px").style("font-weight", 700).style("fill", "var(--muted)").text("×");

  const grp = (i: number): Sel => {
    const on = i === active;
    const g = svg.append("g").style("cursor", "pointer").on("click", () => onPick(i));
    g.append("rect").attr("x", S[i].cx - S[i].hw - 7).attr("y", 30).attr("width", S[i].hw * 2 + 14).attr("height", 108).attr("rx", 10).attr("fill", on ? "color-mix(in srgb, var(--fg) 6%, transparent)" : "transparent").attr("stroke", on ? "var(--fg)" : "transparent").attr("stroke-opacity", on ? 0.3 : 0).attr("stroke-width", 1.2);
    g.append("circle").attr("cx", S[i].cx).attr("cy", 16).attr("r", 9).attr("fill", on ? "var(--fg)" : "var(--surface)").attr("stroke", "var(--border)").attr("stroke-width", 1);
    g.append("text").attr("x", S[i].cx).attr("y", 19.5).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "9.5px").style("font-weight", 700).style("fill", on ? "var(--accent-ink)" : "var(--muted)").text(String(i + 1));
    return g;
  };
  const gridGlyph = (p: Sel, gx: number, gy: number, gw: number, gh: number, hot: number[]) => {
    const rows = 9;
    p.append("rect").attr("x", gx).attr("y", gy).attr("width", gw).attr("height", gh).attr("rx", 3).attr("fill", `color-mix(in srgb, ${WEIGHT} 8%, var(--bg))`).attr("stroke", WEIGHT).attr("stroke-width", 1.2);
    const rh = gh / rows;
    for (let r = 0; r < rows; r++) {
      if (hot.includes(r)) p.append("rect").attr("x", gx + 1).attr("y", gy + r * rh + 0.5).attr("width", gw - 2).attr("height", rh - 1).attr("fill", WEIGHT).attr("fill-opacity", 0.85);
      else if (r > 0) p.append("line").attr("x1", gx).attr("y1", gy + r * rh).attr("x2", gx + gw).attr("y2", gy + r * rh).attr("stroke", WEIGHT).attr("stroke-opacity", 0.25).attr("stroke-width", 0.5);
    }
  };
  const dataBlock = (p: Sel, bx: number, by: number, bw: number, bh: number, rows: number) => {
    p.append("rect").attr("x", bx).attr("y", by).attr("width", bw).attr("height", bh).attr("rx", 3).attr("fill", `color-mix(in srgb, ${DATA} 22%, var(--bg))`).attr("stroke", DATA).attr("stroke-width", 1.2);
    const rh = bh / rows;
    for (let r = 1; r < rows; r++) p.append("line").attr("x1", bx).attr("y1", by + r * rh).attr("x2", bx + bw).attr("y2", by + r * rh).attr("stroke", DATA).attr("stroke-opacity", 0.4).attr("stroke-width", 0.5);
  };
  const shapeL = (p: Sel, x: number, text: string, color: string) => p.append("text").attr("x", x).attr("y", 150).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "8.5px").style("font-weight", 700).style("fill", color).text(text);

  // 1 — input tokens (a small vertical stack of chips)
  {
    const g = grp(0), cx = S[0].cx;
    PIPE_TOKENS.forEach((t, i) => {
      const y = 66 + i * 14;
      g.append("rect").attr("x", cx - 22).attr("y", y).attr("width", 44).attr("height", 12).attr("rx", 3).attr("fill", "var(--bg)").attr("stroke", "var(--border)");
      g.append("text").attr("x", cx).attr("y", y + 8.5).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "7.5px").style("fill", "var(--fg)").text(t);
    });
  }
  // 2 — embedding matrix (weights), looked-up rows lit
  { const g = grp(1), cx = S[1].cx; gridGlyph(g, cx - 27, 62, 54, 64, [1, 3, 4, 6]); shapeL(g, cx, SH.emb, WEIGHT); }
  // 3 — the sequence (live data, N × 4k)
  { const g = grp(2), cx = S[2].cx; dataBlock(g, cx - 16, 66, 32, 56, 5); shapeL(g, cx, SH.seq, DATA); }
  // 4 — the model: a small neural network
  {
    const g = grp(3), cx = S[3].cx;
    g.append("rect").attr("x", cx - 40).attr("y", 60).attr("width", 80).attr("height", 72).attr("rx", 9).attr("fill", "color-mix(in srgb, var(--fg) 6%, var(--bg))").attr("stroke", "var(--fg)").attr("stroke-opacity", 0.5).attr("stroke-width", 1.3);
    const cols = [cx - 26, cx, cx + 26];
    const rows = [[80, 96, 112], [72, 89, 106, 123], [80, 96, 112]];
    for (let c = 0; c < 2; c++) for (const y1 of rows[c]) for (const y2 of rows[c + 1]) g.append("line").attr("x1", cols[c]).attr("y1", y1).attr("x2", cols[c + 1]).attr("y2", y2).attr("stroke", "var(--fg)").attr("stroke-opacity", 0.16).attr("stroke-width", 0.4);
    rows.forEach((ys, c) => ys.forEach((y1) => g.append("circle").attr("cx", cols[c]).attr("cy", y1).attr("r", 2.3).attr("fill", "var(--fg)").attr("fill-opacity", 0.55)));
    shapeL(g, cx, e.ntModel, "var(--fg)");
  }
  // 5 — the next-word vector (live data, 1 × 4k)
  {
    const g = grp(4), cx = S[4].cx;
    g.append("rect").attr("x", cx - 11).attr("y", 62).attr("width", 22).attr("height", 64).attr("rx", 3).attr("fill", `color-mix(in srgb, ${DATA} 22%, var(--bg))`).attr("stroke", DATA).attr("stroke-width", 1.2);
    ["0.71", "−0.14", "0.37", "…"].forEach((t, i) => g.append("text").attr("x", cx).attr("y", 78 + i * 14).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "6.5px").style("fill", "var(--fg)").text(t));
    shapeL(g, cx, SH.vec, DATA);
  }
  // 6 — unembedding matrix (weights, 4k × 200k)
  { const g = grp(5), cx = S[5].cx; gridGlyph(g, cx - 27, 62, 54, 64, []); shapeL(g, cx, SH.unemb, WEIGHT); }
  // 7 — logits: ~200k scores as tiny bars, the winner highlighted
  {
    const g = grp(6), cx = S[6].cx, lx = cx - 46, lw = 92, lBot = 126, n = 40, bw = lw / n, winIdx = 20;
    for (let i = 0; i < n; i++) {
      const h = i === winIdx ? 52 : 4 + prand(i) * 22;
      g.append("rect").attr("x", lx + i * bw).attr("y", lBot - h).attr("width", Math.max(1.4, bw - 0.8)).attr("height", h).attr("rx", 0.4).attr("fill", DATA).attr("fill-opacity", i === winIdx ? 1 : 0.32);
    }
    g.append("text").attr("x", lx + winIdx * bw + bw / 2).attr("y", lBot - 56).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "8px").style("font-weight", 700).style("fill", DATA).text(PIPE_WINNER);
    shapeL(g, cx, SH.log, DATA);
  }
  // 8 — the chosen next token
  {
    const g = grp(7), cx = S[7].cx;
    g.append("rect").attr("x", cx - 22).attr("y", 84).attr("width", 44).attr("height", 22).attr("rx", 5).attr("fill", `color-mix(in srgb, ${DATA} 20%, var(--bg))`).attr("stroke", DATA).attr("stroke-width", 1.3);
    g.append("text").attr("x", cx).attr("y", 99).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "10px").style("font-weight", 700).style("fill", "var(--fg)").text(PIPE_WINNER);
    g.append("text").attr("x", cx).attr("y", 122).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "8px").style("fill", "var(--muted)").text(`→ ${e.ntNextToken}`);
  }

  // frame the view: whole pipeline, or zoomed onto the active stage
  const FULL = "0 0 720 160";
  const zw = 232, zx = Math.max(0, Math.min(720 - zw, S[active].cx - zw / 2));
  const target = zoom ? `${zx} 0 ${zw} 160` : FULL;
  const prev = el.getAttribute("viewBox");
  if (!prev) svg.attr("viewBox", target);
  else if (reduce || prev === target) svg.attr("viewBox", target);
  else svg.transition().duration(380).ease(d3.easeCubicInOut).attr("viewBox", target);
}

/* =====================================================================
   Shared small components
   ===================================================================== */

function ExplainBack({ q, a, reveal, hide, label, reduce }: { q: string; a: string; reveal: string; hide: string; label: string; reduce: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Cap>{label}</Cap>
      <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, maxWidth: "54ch", textWrap: "balance" }}>{q}</div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>{open ? hide : reveal}</button>
      {open && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, maxWidth: "74ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{a}</p>}
    </>
  );
}

function Deeper({ title, body, reduce }: { title: string; body: string[]; reduce: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ appearance: "none", border: 0, background: "transparent", font: "inherit", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, color: "var(--fg)", padding: 0 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: "-.03em" }}>{title}</span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: reduce ? undefined : "rise .16s ease both" }}>
          {body.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? "16px 0 0" : 0, fontSize: 16, lineHeight: 1.68, color: "var(--muted)", maxWidth: "74ch", textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function MarkComplete({ markLabel, doneLabel }: { markLabel: string; doneLabel: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" onClick={() => setDone((v) => !v)} aria-pressed={done} className="u-hover-opacity" style={{ appearance: "none", border: 0, font: "inherit", cursor: "pointer", fontSize: 15.5, fontWeight: 600, color: "var(--accent-ink)", background: "var(--fg)", padding: "13px 22px", borderRadius: 11 }}>{done ? doneLabel : markLabel}</button>;
}
