"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import LessonRail from "./LessonRail";
import { MONO, DISPLAY, useReducedMotion, Cap, rich } from "./lesson-kit";
import { LENS, HERO, QKV, attend, topTarget, runQkv, type Sentence } from "../lib/attention";

type Lesson = ReturnType<typeof useAcademy>["t"]["attn"];
type HeadId = keyof Lesson["heads"];

/** One accent per head, so switching heads visibly recolours the whole lens. */
const HEAD_COLOR: Record<HeadId, string> = {
  reference: "var(--tok-num)",
  previous: "var(--tok-word)",
  syntax: "var(--tok-sub)",
};
const HEAD_ORDER: HeadId[] = ["reference", "previous", "syntax"];

const RIVER = "var(--tok-num)"; //  the river neighbourhood / weight
const MONEY = "var(--tok-sub)"; //  the money neighbourhood / weight
const BANK = "var(--tok-punct)"; // the contextualised word itself

export default function Attention() {
  const { t, lang } = useAcademy();
  const e = t.attn;
  const reduce = useReducedMotion();

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 32px 0", display: "flex", flexWrap: "wrap", gap: "clamp(28px, 4vw, 60px)", alignItems: "flex-start" }}>
      <LessonRail current={7} />

      <article style={{ flex: "1 1 560px", minWidth: 0, paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1, margin: "16px 0 0" }}>{e.title}</h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "60ch", textWrap: "pretty" }}>{rich(e.lede)}</p>

        {/* ---- Hero: one word flips what "it" looks at ------------- */}
        <Hero e={e} reduce={reduce} />

        {/* ---- Concept 1 ------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {e.concept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive 1: the attention lens ------------------- */}
        <Lens e={e} reduce={reduce} />

        {/* ---- Concept 2: query, key, value ------------------------ */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {e.qkvConcept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive 2: the query·key·value toy -------------- */}
        <QkvToy e={e} reduce={reduce} />

        {/* ---- Explain it back ------------------------------------- */}
        <div style={{ marginTop: "clamp(28px, 3.2vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
          <ExplainBack q={e.explainQ} a={e.explainA} reveal={t.reveal} hide={t.hide} label={t.explainLabel} reduce={reduce} />
        </div>

        {/* ---- Go deeper ------------------------------------------- */}
        <Deeper title={e.deeperTitle} body={e.deeperBody} reduce={reduce} />
        <Deeper title={e.maskTitle} body={e.maskBody} reduce={reduce} />

        {/* ---- Bridge to "How training works" ---------------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{e.bridgeLabel}</div>
          <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", maxWidth: "60ch", textWrap: "pretty" }}>{rich(e.bridgeBody)}</p>
        </div>

        {/* ---- Controls -------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/stage/1/embeddings" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {e.prev}</Link>
            <span aria-disabled style={{ fontSize: 15, fontWeight: 600, border: "1px dashed var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>{e.next} →</span>
          </div>
          <MarkComplete markLabel={t.markComplete} doneLabel={t.completed} />
        </div>

        <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>{lang === "es" ? "Idioma: Español" : "Language: English"}</div>
      </article>
    </div>
  );
}

/* =====================================================================
   Hero — "…because it was [tired|wide]" swings what "it" attends to
   ===================================================================== */

function Hero({ e, reduce }: { e: Lesson; reduce: boolean }) {
  const [wide, setWide] = useState(false);
  const ref = useRef<SVGSVGElement | null>(null);

  const last = wide ? e.heroWordWide : e.heroWordTired;
  const tokens = useMemo(() => [...HERO.tokens, last], [last]);
  const weights = useMemo(() => [...(wide ? HERO.weights.wide : HERO.weights.tired), 0], [wide]);

  useEffect(() => {
    drawLens(ref.current, { tokens, weights, sel: HERO.queryIdx, color: RIVER, onSelect: () => {}, queryLabel: "it" });
  }, [tokens, weights]);

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", background: "var(--surface)" }}>
      <div style={{ padding: "clamp(20px,2.6vw,28px) clamp(18px,2.2vw,26px)" }}>
        <div style={{ textAlign: "center" }}><Cap>{e.heroLabel}</Cap></div>
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <svg ref={ref} role="img" aria-label={`${tokens.join(" ")} — "it" attends to ${wide ? "street" : "animal"}`} style={{ display: "block", margin: "0 auto" }} />
        </div>
        {/* flip control */}
        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".06em", color: "var(--muted)" }}>{e.heroToggleLabel}:</span>
          <div role="group" style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 999, overflow: "hidden" }}>
            {[{ w: false, label: e.heroWordTired }, { w: true, label: e.heroWordWide }].map((o) => (
              <button key={o.label} type="button" onClick={() => setWide(o.w)} aria-pressed={wide === o.w} style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: DISPLAY, fontWeight: 600, fontSize: 14, padding: "8px 16px", border: 0, background: wide === o.w ? "var(--fg)" : "transparent", color: wide === o.w ? "var(--accent-ink)" : "var(--muted)" }}>{o.label}</button>
            ))}
          </div>
        </div>
        <p style={{ margin: "16px auto 0", maxWidth: "56ch", textAlign: "center", fontSize: 14.5, lineHeight: 1.6, color: "var(--fg)", textWrap: "pretty", animation: reduce ? undefined : "rise .18s ease both" }} key={String(wide)}>
          {rich(wide ? e.heroReadWide : e.heroReadTired)}
        </p>
        <p style={{ margin: "10px auto 0", maxWidth: "56ch", textAlign: "center", fontSize: 13, lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{rich(e.heroCaption)}</p>
      </div>
    </div>
  );
}

/* =====================================================================
   Interactive 1 — the attention lens (click a word, switch heads)
   ===================================================================== */

function Lens({ e, reduce }: { e: Lesson; reduce: boolean }) {
  const [sel, setSel] = useState(7); //   "it"
  const [head, setHead] = useState<HeadId>("reference");
  const ref = useRef<SVGSVGElement | null>(null);

  const weights = useMemo(() => attend(LENS as Sentence, head, sel), [head, sel]);
  const top = useMemo(() => topTarget(LENS as Sentence, head, sel), [head, sel]);
  const color = HEAD_COLOR[head];

  useEffect(() => {
    drawLens(ref.current, { tokens: LENS.tokens, weights, sel, color, onSelect: setSel, queryLabel: "query" });
  }, [weights, sel, color]);

  const read = e.lensRead.replace("{q}", LENS.tokens[sel]).replace("{k}", LENS.tokens[top.j]);

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{e.lensLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{e.lensTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.lensBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", padding: "8px 4px", overflowX: "auto" }}>
          <svg ref={ref} role="img" aria-label={read.replace(/\*/g, "")} style={{ display: "block", margin: "0 auto", touchAction: "manipulation" }} />
        </div>

        {/* readout */}
        <p style={{ margin: "14px 0 0", fontSize: 15.5, color: "var(--fg)", lineHeight: 1.6, textWrap: "pretty" }}>{rich(read)}</p>

        {/* head selector */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".08em", color: "var(--muted)", marginBottom: 9 }}>{e.lensHeadLabel}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {HEAD_ORDER.map((h) => {
              const active = head === h;
              const c = HEAD_COLOR[h];
              return (
                <button key={h} type="button" onClick={() => setHead(h)} aria-pressed={active} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: DISPLAY, fontWeight: 600, fontSize: 14, padding: "9px 14px", borderRadius: 10, border: `1px solid ${active ? c : "var(--border)"}`, background: active ? `color-mix(in srgb, ${c} 15%, transparent)` : "var(--bg)", color: "var(--fg)" }}>
                  <span aria-hidden style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: c, marginRight: 7, verticalAlign: "middle" }} />
                  {e.heads[h].name}
                </button>
              );
            })}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }} key={head}>{rich(e.heads[head].desc)}</p>
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.lensNote)}</p>
      </div>
    </div>
  );
}

/** Draw one row of token chips with attention arcs from `sel` to each token.
 *  Chip tint + arc thickness/opacity encode the softmax weight. Fully d3; the
 *  SVG sizes to its content and scrolls horizontally inside its container. */
function drawLens(el: SVGSVGElement | null, opts: { tokens: string[]; weights: number[]; sel: number; color: string; onSelect: (i: number) => void; queryLabel: string }) {
  if (!el) return;
  const { tokens, weights, sel, color, onSelect, queryLabel } = opts;
  const svg = d3.select(el);
  svg.selectAll("*").remove();

  const FS = 14, charW = 8, padX = 10, gap = 8, chipH = 30, chipTop = 128, H = 176;
  const widths = tokens.map((t) => Math.max(30, t.length * charW + padX * 2));
  const xs: number[] = [];
  let cx = 8;
  for (const w of widths) { xs.push(cx); cx += w + gap; }
  const totalW = cx - gap + 8;
  const cX = (i: number) => xs[i] + widths[i] / 2;

  // Scale-to-fit: the whole sentence always fits its column (shrinking on narrow
  // screens) instead of overflowing — no critical token ever hides off-screen.
  svg.attr("viewBox", `0 0 ${totalW} ${H}`).attr("width", null).attr("height", null)
    .style("display", "block").style("margin", "0 auto").style("width", "100%").style("max-width", `${totalW}px`).style("height", "auto");

  // arcs from the query token up-and-over to each attended token
  tokens.forEach((_, j) => {
    if (j === sel) return;
    const w = weights[j];
    if (w < 0.03) return;
    const x1 = cX(sel), x2 = cX(j), y = chipTop;
    const dx = Math.abs(x2 - x1);
    const cy = chipTop - Math.min(98, 32 + dx * 0.22);
    svg.append("path")
      .attr("d", `M${x1},${y} Q${(x1 + x2) / 2},${cy} ${x2},${y}`)
      .attr("fill", "none").attr("stroke", color)
      .attr("stroke-width", 0.6 + w * 7).attr("stroke-opacity", 0.16 + w * 0.74)
      .attr("stroke-linecap", "round");
  });

  // chips
  tokens.forEach((tok, j) => {
    const w = weights[j];
    const isSel = j === sel;
    const pct = Math.round(w * 74);
    const node = svg.append("g").style("cursor", "pointer")
      .attr("tabindex", 0).attr("role", "button")
      .on("click", () => onSelect(j))
      .on("keydown", (ev: KeyboardEvent) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(j); } });
    node.append("title").text(tok);
    node.append("rect").attr("x", xs[j]).attr("y", chipTop).attr("width", widths[j]).attr("height", chipH).attr("rx", 8)
      .attr("fill", isSel ? "var(--bg)" : `color-mix(in srgb, ${color} ${pct}%, var(--surface))`)
      .attr("stroke", isSel ? color : `color-mix(in srgb, ${color} ${Math.round(18 + w * 52)}%, var(--border))`)
      .attr("stroke-width", isSel ? 2 : 1);
    node.append("text").attr("x", cX(j)).attr("y", chipTop + chipH / 2 + 5).attr("text-anchor", "middle")
      .style("font-family", DISPLAY).style("font-size", `${FS}px`).style("font-weight", isSel || w > 0.2 ? 700 : 500)
      .style("fill", "var(--fg)").style("pointer-events", "none").text(tok);
    // caption under the chip: "query" for the source, the weight for the rest
    const cap = isSel ? queryLabel : w >= 0.06 ? w.toFixed(2) : "";
    if (cap) svg.append("text").attr("x", cX(j)).attr("y", chipTop + chipH + 13).attr("text-anchor", "middle")
      .style("font-family", MONO).style("font-size", "9.5px").style("font-weight", isSel ? 700 : 400)
      .style("fill", isSel ? color : "var(--muted)").style("pointer-events", "none").text(cap);
  });
}

/* =====================================================================
   Interactive 2 — query · key · value: "bank" finds its meaning
   ===================================================================== */

function QkvToy({ e, reduce }: { e: Lesson; reduce: boolean }) {
  const [t, setT] = useState(0.04);
  const ref = useRef<SVGSVGElement | null>(null);
  const raf = useRef<number>(0);

  const res = useMemo(() => runQkv(t), [t]);
  const labels = useMemo(() => ({ river: e.qkvRiver, money: e.qkvMoney, bank: e.qkvBank }), [e]);

  useEffect(() => {
    drawQkvMap(ref.current, { blended: res.blended, labels });
  }, [res, labels]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // preset buttons ease `t` to the target (instant when reduced-motion)
  const goTo = (target: number) => {
    cancelAnimationFrame(raf.current);
    if (reduce) { setT(target); return; }
    const from = t, start = performance.now(), dur = 520;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setT(from + (target - from) * eased);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const wRiver = res.weights[0], wMoney = res.weights[1];
  const winner = Math.abs(wRiver - wMoney) < 0.12 ? `${labels.river} + ${labels.money}` : wRiver > wMoney ? labels.river : labels.money;
  const read = e.qkvRead.replace("{w}", winner);

  const presets: { key: "river" | "mixed" | "money"; label: string; target: number }[] = [
    { key: "river", label: e.qkvPresetRiver, target: 0.04 },
    { key: "mixed", label: e.qkvPresetMixed, target: 0.5 },
    { key: "money", label: e.qkvPresetMoney, target: 0.96 },
  ];

  return (
    <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{e.qkvLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{e.qkvTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.qkvBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)", display: "flex", flexWrap: "wrap", gap: "clamp(20px,3vw,32px)" }}>
        {/* the meaning map */}
        <div style={{ flex: "1 1 300px", minWidth: 280 }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 10, background: "var(--surface)" }}>
            <svg ref={ref} viewBox="0 0 100 100" width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label={e.qkvTitle} />
          </div>
          {/* presets */}
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {presets.map((p) => (
              <button key={p.key} type="button" onClick={() => goTo(p.target)} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 12.5, fontWeight: 600, padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }}>{p.label}</button>
            ))}
          </div>
        </div>

        {/* controls + readout */}
        <div style={{ flex: "1 1 230px", minWidth: 230, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* slider */}
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".06em", color: "var(--muted)" }}>{e.qkvSliderLabel}</span>
            <input type="range" min={0} max={1} step={0.01} value={t} onChange={(ev) => { cancelAnimationFrame(raf.current); setT(Number(ev.target.value)); }} style={{ width: "100%", accentColor: BANK, cursor: "pointer" }} aria-valuetext={winner} />
            <span style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10.5, color: "var(--muted)" }}>
              <span style={{ color: RIVER }}>◀ {e.qkvSliderLeft}</span>
              <span style={{ color: MONEY }}>{e.qkvSliderRight} ▶</span>
            </span>
          </label>

          {/* attention weights */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".08em", color: "var(--muted)", marginBottom: 8 }}>{e.qkvWeightLabel}</div>
            <WeightBar label={labels.river} value={wRiver} color={RIVER} />
            <div style={{ height: 8 }} />
            <WeightBar label={labels.money} value={wMoney} color={MONEY} />
          </div>

          {/* readout */}
          <div style={{ border: `1px solid ${BANK}`, borderRadius: 12, padding: "13px 15px", background: "var(--surface)" }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{e.qkvMeaningLabel}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, letterSpacing: "-.02em", color: BANK, marginTop: 4, textWrap: "pretty" }}>{rich(read)}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 clamp(20px, 2.5vw, 28px) clamp(20px, 2.5vw, 28px)" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(e.qkvNote)}</p>
      </div>
    </div>
  );
}

function WeightBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 13.5, width: 56, flex: "0 0 auto", color: "var(--fg)" }}>{label}</span>
      <span style={{ position: "relative", flex: 1, height: 10, borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <span style={{ position: "absolute", inset: 0, width: `${Math.round(value * 100)}%`, background: color, borderRadius: 999 }} />
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: "var(--muted)", width: 34, flex: "0 0 auto", textAlign: "right" }}>{value.toFixed(2)}</span>
    </div>
  );
}

/** The little meaning map: fixed river + money points, faint neighbourhood
 *  halos, and the "bank" point sitting at the weighted blend of the two. */
function drawQkvMap(el: SVGSVGElement | null, opts: { blended: [number, number]; labels: { river: string; money: string; bank: string } }) {
  if (!el) return;
  const { blended, labels } = opts;
  const svg = d3.select(el);
  svg.selectAll("*").remove();
  const P = (v: [number, number]): [number, number] => [v[0], 100 - v[1]];
  const river = QKV.tokens[0].value, money = QKV.tokens[1].value;

  // neighbourhood halos
  const halo = (v: [number, number], c: string) => svg.append("circle").attr("cx", P(v)[0]).attr("cy", P(v)[1]).attr("r", 17).attr("fill", c).attr("fill-opacity", 0.1);
  halo(river, RIVER); halo(money, MONEY);

  // dashed track between the two meanings
  svg.append("line").attr("x1", P(river)[0]).attr("y1", P(river)[1]).attr("x2", P(money)[0]).attr("y2", P(money)[1])
    .attr("stroke", "var(--border)").attr("stroke-width", 0.6).attr("stroke-dasharray", "2 2");

  // faint origin of "bank"
  svg.append("circle").attr("cx", P(QKV.base)[0]).attr("cy", P(QKV.base)[1]).attr("r", 1.5).attr("fill", "var(--muted)").attr("fill-opacity", 0.5);

  // fixed context points
  const dot = (v: [number, number], c: string, name: string, dy: number) => {
    svg.append("circle").attr("cx", P(v)[0]).attr("cy", P(v)[1]).attr("r", 3.2).attr("fill", c);
    svg.append("text").attr("x", P(v)[0]).attr("y", P(v)[1] + dy).attr("text-anchor", "middle")
      .style("font-family", MONO).style("font-size", "5px").style("font-weight", 700)
      .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "1.4px").style("stroke-linejoin", "round")
      .style("fill", c).text(name);
  };
  dot(river, RIVER, labels.river, -5); dot(money, MONEY, labels.money, 9);

  // a light connector from base → current meaning
  const [bx, by] = P(blended);
  svg.append("line").attr("x1", P(QKV.base)[0]).attr("y1", P(QKV.base)[1]).attr("x2", bx).attr("y2", by)
    .attr("stroke", BANK).attr("stroke-width", 0.7).attr("stroke-opacity", 0.5);

  // the contextualised "bank" point
  svg.append("circle").attr("cx", bx).attr("cy", by).attr("r", 4.6).attr("fill", BANK).attr("stroke", "var(--bg)").attr("stroke-width", 1.2);
  svg.append("text").attr("x", bx).attr("y", by - 6.5).attr("text-anchor", "middle")
    .style("font-family", DISPLAY).style("font-size", "6px").style("font-weight", 700)
    .style("paint-order", "stroke").style("stroke", "var(--bg)").style("stroke-width", "1.6px").style("stroke-linejoin", "round")
    .style("fill", BANK).text(labels.bank);
}

/* =====================================================================
   Shared small components (same shapes as the other lessons)
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
