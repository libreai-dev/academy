"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, ControlRow, Toggle, Slider, Deeper } from "./webscale-kit";
import {
  BASE_LOGITS,
  RECENT_IDX,
  softmax,
  topK,
  topP,
  renorm,
  penalise,
  argmax,
  countKept,
  mulberry32,
  sampleIndex,
  pct,
} from "../lib/sampling-strategies";

/* ======================================================================== *
 * Diagram — one horizontal bar chart drawn into a single <svg> mount (pure
 * d3, no hand-authored shapes). Horizontal bars so the eight token labels
 * never collide, and the fonts stay well above the 12px floor even when the
 * card is squeezed to ~290px on a phone (viewBox 560 ⇒ 24px ≈ 12.5px there).
 * Colour only via .style() with CSS tokens, so theme flips resolve live.
 * ======================================================================== */

interface RowTag {
  idx: number;
  text: string;
  kind: "signal" | "byte";
}

function drawHBars(
  el: SVGSVGElement,
  o: {
    probs: number[];
    tokens: string[];
    keep: boolean[] | null;
    ringIdx: number;
    penIdx: number;
    tags: RowTag[];
    maxP: number;
    reduce: boolean;
    W: number;
    labelFont: number;
    valFont: number;
    rowH: number;
    rightGutter: number;
  },
) {
  const n = o.probs.length;
  const mT = 14;
  const mB = 12;
  const H = mT + n * o.rowH + mB;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${o.W} ${H}`);
  svg.selectAll("*").remove();
  const dur = o.reduce ? 0 : 480;

  const labelRight = Math.round(o.W * 0.28); // right edge of the label column
  const barX0 = labelRight + 14;
  const barMax = o.W - o.rightGutter;
  const x = d3.scaleLinear().domain([0, Math.max(0.12, o.maxP)]).range([barX0, barMax]).clamp(true);
  const barH = Math.min(o.rowH - 14, o.labelFont + 4);

  o.probs.forEach((p, i) => {
    const kept = o.keep ? o.keep[i] : true;
    const isRing = i === o.ringIdx;
    const isPen = i === o.penIdx;
    const cy = mT + i * o.rowH + o.rowH / 2;
    const fill = isPen ? "var(--tok-byte)" : "var(--signal)";

    // faint full-width track so the scale reads
    svg.append("rect").attr("x", barX0).attr("y", cy - barH / 2).attr("width", barMax - barX0).attr("height", barH)
      .attr("rx", 5).style("fill", "var(--surface)").style("stroke", "var(--hair)").style("stroke-width", 1);

    // token label (right-aligned in its column)
    svg.append("text").attr("x", labelRight).attr("y", cy + o.labelFont * 0.34).attr("text-anchor", "end")
      .style("fill", kept ? "var(--fg)" : "var(--muted)").style("font-family", MONO).style("font-size", `${o.labelFont}px`)
      .style("opacity", kept ? 1 : 0.55)
      .text(o.tokens[i]);

    // the probability bar
    const w = Math.max(kept ? 4 : 3, x(p) - barX0);
    const bar = svg.append("rect").attr("x", barX0).attr("y", cy - barH / 2).attr("height", barH).attr("rx", 5)
      .style("fill", kept ? fill : "var(--border)")
      .style("fill-opacity", kept ? (isPen ? 0.55 : isRing ? 1 : 0.9) : 0.5)
      .style("stroke", isRing ? "var(--signal)" : "none").style("stroke-width", isRing ? 3 : 0);
    if (dur) bar.attr("width", 0).transition().duration(dur).ease(d3.easeCubicOut).attr("width", w);
    else bar.attr("width", w);

    // value label just past the bar end
    svg.append("text").attr("x", Math.min(x(p) + 8, barMax + 8)).attr("y", cy + o.valFont * 0.34).attr("text-anchor", "start")
      .style("fill", kept ? (isRing ? "var(--signal-fg)" : "var(--fg)") : "var(--muted)")
      .style("font-family", MONO).style("font-size", `${o.valFont}px`).style("font-weight", isRing ? 700 : 400)
      .style("opacity", kept ? 1 : 0.6)
      .text(pct(p));

    // optional right-aligned tag (sampled / top pick / penalised)
    const tag = o.tags.find((tg) => tg.idx === i);
    if (tag) {
      svg.append("text").attr("x", o.W - 4).attr("y", cy + o.valFont * 0.34).attr("text-anchor", "end")
        .style("fill", tag.kind === "byte" ? "var(--tok-byte)" : "var(--signal-fg)")
        .style("font-family", MONO).style("font-size", `${o.valFont}px`).style("font-weight", 700)
        .text(tag.text);
    }
  });
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

function useSS() {
  const { t } = useAcademy();
  return t.samplingStrategies;
}

/** The read-only "prompt so far" strip shown above an interactive. */
function PromptStrip({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".08em", color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      <pre style={{ margin: 0, fontFamily: MONO, fontSize: 13, lineHeight: 1.5, padding: "11px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg)", overflowX: "auto", whiteSpace: "pre-wrap" }}>{text}</pre>
    </div>
  );
}

/* ---- Node 1 · Temperature ---------------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const ss = useSS();
  const n = ss.nodes[0];
  const [temp, setTemp] = useState(1);
  const [preset, setPreset] = useState(1); // Balanced by default
  const [sampled, setSampled] = useState(-1);
  const [seed, setSeed] = useState(1);

  const probs = useMemo(() => softmax(BASE_LOGITS, temp), [temp]);
  const maxP = useMemo(() => Math.max(...softmax(BASE_LOGITS, 0.4)), []); // fixed scale (sharpest preset)

  const presetTemps = [0.4, 1.0, 1.6];
  const pickPreset = (i: number) => { setPreset(i); setTemp(presetTemps[i]); setSampled(-1); };
  const onSlider = (v: number) => { setTemp(v); setPreset(-1); setSampled(-1); };
  const roll = () => {
    const r = mulberry32(seed * 2654435761)();
    setSampled(sampleIndex(probs, r));
    setSeed((s) => s + 1);
  };

  const tags: RowTag[] = sampled >= 0 ? [{ idx: sampled, text: `◀ ${ss.n1sampledWord}`, kind: "signal" }] : [];
  const note = sampled >= 0
    ? `${ss.n1sampledFmt} ${ss.tokens[sampled]} · ${pct(probs[sampled])}`
    : preset >= 0
      ? ss.n1presetNotes[preset]
      : n.sliderNote;

  return (
    <SceneShell
      id="ss-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      aside={<Deeper title={ss.deeperTempTitle}>{rich(ss.deeperTempBody)}</Deeper>}
      controls={
        <>
          <PromptStrip label={ss.promptLabel} text={ss.promptText} />
          <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>{ss.n1presetsLabel}</div>
          <ControlRow>
            {ss.n1presets.map((lab, i) => (
              <Toggle key={i} on={preset === i} onClick={() => pickPreset(i)}>{lab}</Toggle>
            ))}
          </ControlRow>
          <Slider id="ss-temp" label={ss.n1slider} value={temp} display={temp.toFixed(1)} min={0.1} max={2} step={0.1} onChange={onSlider} />
          <button type="button" onClick={roll} className="u-hover-fg-border"
            style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13.5, fontWeight: 600, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }}>
            {ss.n1roll}
          </button>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawHBars(el, {
        probs, tokens: ss.tokens, keep: null, ringIdx: sampled, penIdx: -1, tags, maxP,
        reduce, W: 560, labelFont: 25, valFont: 24, rowH: 48, rightGutter: 230,
      })} deps={[probs, sampled, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2 · Top-k / Top-p -------------------------------------------- */

function Panel({ heading, keptLine, children }: { heading: string; keptLine: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "12px 13px", background: "var(--bg)" }}>
      <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".06em", color: "var(--signal-fg)", fontWeight: 700, marginBottom: 8 }}>{heading}</div>
      {children}
      <div style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>{keptLine}</div>
    </div>
  );
}

function Node2({ reduce }: { reduce: boolean }) {
  const ss = useSS();
  const n = ss.nodes[1];
  const [k, setK] = useState(3);
  const [p, setP] = useState(0.9);

  const probs = useMemo(() => softmax(BASE_LOGITS, 1), []);
  const keepK = useMemo(() => topK(probs, k), [probs, k]);
  const keepP = useMemo(() => topP(probs, p), [probs, p]);
  const nK = countKept(keepK);
  const nP = countKept(keepP);

  const keptLine = (kept: number) => `${kept} ${ss.keptWord} · ${probs.length - kept} ${ss.droppedWord}`;
  const note = `${ss.n2kPanel.split("·")[0].trim()}: ${nK} ${ss.keptWord}. ${ss.n2pPanel.split("·")[0].trim()}: ${nP} ${ss.keptWord}.`;

  const drawPanel = (keep: boolean[]) => (el: SVGSVGElement) => drawHBars(el, {
    probs: renorm(probs, keep).map((v, i) => (keep[i] ? v : probs[i])), // kept bars renormalised; dropped show original faint
    tokens: ss.tokens, keep, ringIdx: -1, penIdx: -1, tags: [], maxP: 1,
    reduce, W: 420, labelFont: 21, valFont: 20, rowH: 42, rightGutter: 78,
  });

  return (
    <SceneShell
      id="ss-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <>
          <Slider id="ss-topk" label={ss.n2kSlider} value={k} display={`${k}`} min={1} max={8} step={1} onChange={setK} />
          <Slider id="ss-topp" label={ss.n2pSlider} value={p} display={p.toFixed(2)} min={0.3} max={1} step={0.05} onChange={setP} />
        </>
      }
      readout={null}
    >
      {() => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 12 }}>
          <Panel heading={ss.n2kPanel} keptLine={keptLine(nK)}>
            <DiagramSvg label={`${n.aria ?? ""} — top-k`} draw={drawPanel(keepK)} deps={[k, reduce]} />
          </Panel>
          <Panel heading={ss.n2pPanel} keptLine={keptLine(nP)}>
            <DiagramSvg label={`${n.aria ?? ""} — top-p`} draw={drawPanel(keepP)} deps={[p, reduce]} />
          </Panel>
        </div>
      )}
    </SceneShell>
  );
}

/* ---- Node 3 · Repetition penalty --------------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const ss = useSS();
  const n = ss.nodes[2];
  const [penalty, setPenalty] = useState(1);

  const probs = useMemo(() => softmax(penalise(BASE_LOGITS, RECENT_IDX, penalty), 1), [penalty]);
  const maxP = useMemo(() => Math.max(...softmax(BASE_LOGITS, 1)), []); // fixed scale at penalty 1
  const top = argmax(probs);
  const penActive = penalty > 1.001;
  const repIdx = RECENT_IDX[0];

  const tags: RowTag[] = [];
  if (penActive) tags.push({ idx: repIdx, text: ss.n3penalisedWord, kind: "byte" });
  tags.push({ idx: top, text: `◀ ${ss.topPickWord}`, kind: "signal" });

  const note = !penActive
    ? ss.n3noteOff
    : top !== repIdx
      ? `'${ss.tokens[repIdx]}' ${ss.n3noteFmt} '${ss.tokens[top]}'.`
      : n.sliderNote;

  return (
    <SceneShell
      id="ss-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      aside={<Deeper title={ss.deeperPenTitle}>{rich(ss.deeperPenBody)}</Deeper>}
      controls={
        <>
          <PromptStrip label={ss.n3contextLabel} text={ss.n3contextText} />
          <Slider id="ss-pen" label={ss.n3slider} value={penalty} display={penalty.toFixed(2)} min={1} max={2} step={0.05} onChange={setPenalty} />
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawHBars(el, {
        probs, tokens: ss.tokens, keep: null, ringIdx: top, penIdx: penActive ? repIdx : -1, tags, maxP,
        reduce, W: 560, labelFont: 25, valFont: 24, rowH: 48, rightGutter: 230,
      })} deps={[probs, penalty, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function SamplingStrategies() {
  const { t, lang } = useAcademy();
  const ss = t.samplingStrategies;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{ss.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {ss.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{ss.lede}</p>

        {/* knob chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{ss.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {ss.pipeline.map((label, i) => (
              <a key={i} href={`#ss-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{ss.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{ss.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(ss.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{ss.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(ss.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/feed-forward" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {ss.prevLesson}</Link>
        <Link href="/stage/0/backpropagation" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{ss.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
