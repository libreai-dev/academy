"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import LessonRail from "./LessonRail";
import { MONO, DISPLAY, useReducedMotion, useCountUp, Cap, rich } from "./lesson-kit";
import { sigmoid } from "../lib/neuralnet";
import { forwardHotdog, NET_W1, NET_B1, NET_W2, NET_B2, FUSE_W, FUSE_B, FUSE_SENTENCES } from "../lib/hotdog";

const A_COLOR = "var(--tok-num)"; //  positive contribution
const NEG_COLOR = "var(--tok-byte)"; // negative contribution
const SPAM_COLOR = "var(--tok-byte)";
const HAM_COLOR = "var(--tok-word)";

/* number helpers */
const f2 = (x: number) => x.toFixed(2);
const signed = (x: number) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(2);
const fmtInt = (x: number) => Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function fmtCompact(x: number): string {
  if (x >= 1e12) return `${+(x / 1e12).toFixed(x >= 1e13 ? 0 : 1)}T`;
  if (x >= 1e9) return `${+(x / 1e9).toFixed(x >= 1e10 ? 0 : 1)}B`;
  if (x >= 1e6) return `${+(x / 1e6).toFixed(x >= 1e7 ? 0 : 1)}M`;
  if (x >= 1e3) return `${+(x / 1e3).toFixed(x >= 1e4 ? 0 : 1)}k`;
  return String(Math.round(x));
}

/* single-neuron defaults */
const NA_W = { wL: 2.6, wK: -3.2, b: -0.1 };

export default function Neural() {
  const { t, lang } = useAcademy();
  const n = t.neural;
  const reduce = useReducedMotion();

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 32px 0", display: "flex", flexWrap: "wrap", gap: "clamp(28px, 4vw, 60px)", alignItems: "flex-start" }}>
      <LessonRail current={4} />

      <article style={{ flex: "1 1 560px", minWidth: 0, paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1, margin: "16px 0 0" }}>{n.title}</h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "60ch", textWrap: "pretty" }}>{rich(n.lede)}</p>

        {/* ---- Hero: an LLM is a neural network -------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", background: "var(--surface)" }}>
          <div style={{ padding: "clamp(22px,3vw,34px) clamp(20px,2.5vw,30px)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            {/* prompt */}
            <HeroStage label={n.heroPromptLabel}>
              <div style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)" }}>“{n.heroPromptText}”</div>
            </HeroStage>
            <HeroArrow caption={n.heroStepTokenize} reduce={reduce} />
            {/* tokens */}
            <HeroStage label={n.heroTokensLabel}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {[{ p: "I", id: 40 }, { p: "want", id: 1682 }, { p: "a", id: 261 }, { p: "hot", id: 3648 }, { p: "dog", id: 6446 }, { p: "to", id: 316 }].map((t, i) => (
                  <span key={i} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1, fontFamily: MONO, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 8px" }}>
                    <span style={{ fontSize: 10.5, color: "var(--muted)" }}>{t.p}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg)" }}>{t.id}</span>
                  </span>
                ))}
              </div>
            </HeroStage>
            <HeroArrow caption={n.heroStepFlow} reduce={reduce} />
            {/* network */}
            <HeroStage label={n.heroNetLabel} sub={n.heroNetSub}>
              <div style={{ width: "min(100%, 480px)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 10px", background: "var(--bg)" }}>
                <HeroNet reduce={reduce} />
              </div>
            </HeroStage>
            <HeroArrow caption={n.heroStepPredict} reduce={reduce} />
            {/* prediction */}
            <HeroStage label={n.heroNextLabel}>
              <div style={{ display: "inline-flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <span style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,3.6vw,34px)", fontWeight: 700, letterSpacing: "-.03em", color: "var(--tok-word)" }}>“{n.heroPredict}”</span>
                <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>71%</span>
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{n.heroAlt1} 12% · {n.heroAlt2} 8%</span>
              </div>
            </HeroStage>
          </div>
          <p style={{ margin: 0, padding: "16px clamp(20px,2.5vw,30px)", borderTop: "1px solid var(--hair)", background: "var(--bg)", fontSize: 15, lineHeight: 1.62, color: "var(--muted)", textWrap: "pretty" }}>{rich(n.heroCaption)}</p>
        </div>

        {/* ---- Concept: parameters (the "12B" beat) ---------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", maxWidth: "74ch" }}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(n.concept[0])}</p>
        </div>

        {/* ---- The anatomy of a network (labelled) ----------------- */}
        <NetworkAnatomy n={n} />

        {/* ---- The scale calculator (a 70B model) ------------------ */}
        <ParamCalculator n={n} reduce={reduce} />

        {/* ---- Concept: you already know this (the neuron) --------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {n.concept.slice(1).map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive A: one neuron --------------------------- */}
        <OneNeuron n={n} reduce={reduce} />

        {/* ---- Interactive: the dot product ------------------------ */}
        <DotProduct n={n} reduce={reduce} />

        {/* ---- Mid concept: why stack ------------------------------ */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "74ch" }}>
          {n.midConcept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive B: the playground ----------------------- */}
        <Hotdog n={n} reduce={reduce} />

        {/* ---- Closing --------------------------------------------- */}
        <p style={{ marginTop: "clamp(24px, 3vw, 36px)", fontSize: 17, lineHeight: 1.68, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.closeConcept)}</p>

        {/* ---- Explain it back ------------------------------------- */}
        <div style={{ marginTop: "clamp(28px, 3.2vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
          <ExplainBack q={n.explainQ} a={n.explainA} reveal={t.reveal} hide={t.hide} label={t.explainLabel} reduce={reduce} />
        </div>

        {/* ---- Go deeper ------------------------------------------- */}
        <Deeper title={n.deeperTitle} body={n.deeperBody} reduce={reduce} />
        <Deeper title={n.sizeDeeperTitle} body={n.sizeDeeperBody} reduce={reduce} />
        <Deeper title={n.interpDeeperTitle} body={n.interpDeeperBody} reduce={reduce} />

        {/* ---- Bridge to Embeddings -------------------------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{n.bridgeLabel}</div>
          <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", maxWidth: "60ch", textWrap: "pretty" }}>{rich(n.bridgeBody)}</p>
        </div>

        {/* ---- Controls -------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/stage/1/bias" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {n.prev}</Link>
            <Link href="/stage/1/gpu-or-cpu" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>{n.next} →</Link>
          </div>
          <MarkComplete markLabel={t.markComplete} doneLabel={t.completed} />
        </div>

        <div style={{ marginTop: 18, fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>{lang === "es" ? "Idioma: Español" : "Language: English"}</div>
      </article>
    </div>
  );
}

/* =====================================================================
   Interactive A — a single neuron, with the arithmetic on show
   ===================================================================== */

function OneNeuron({ n, reduce }: { n: ReturnType<typeof useAcademy>["t"]["neural"]; reduce: boolean }) {
  const [L, setL] = useState(0.65); //  suspicious links
  const [K, setK] = useState(0.35); //  known sender
  const [wL, setWL] = useState(NA_W.wL);
  const [wK, setWK] = useState(NA_W.wK);
  const [b, setB] = useState(NA_W.b);
  const [note, setNote] = useState<string | null>(null);

  const cL = wL * L;
  const cK = wK * K;
  const z = cL + cK + b;
  const p = sigmoid(z);
  const pct = Math.round(p * 100);
  const animPct = useCountUp(pct, reduce);
  const spam = p > 0.5;

  function preset(i: number) {
    const cfg = [
      { L: 1, K: 0 },
      { L: 0.15, K: 1 },
      { L: 0.62, K: 0.55 },
    ][i];
    setL(cfg.L);
    setK(cfg.K);
    setWL(NA_W.wL);
    setWK(NA_W.wK);
    setB(NA_W.b);
    setNote(n.naPresets[i].note);
  }

  return (
    <div style={{ marginTop: "clamp(30px, 3.5vw, 44px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{n.naLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{n.naTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.naBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)", display: "flex", flexWrap: "wrap", gap: "clamp(20px,3vw,30px)" }}>
        {/* left: the inputs + dials */}
        <div style={{ flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <Cap>{n.naScenarioLabel}</Cap>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 14 }}>
              <Slider label={n.naInput1} lo={n.naInput1Lo} hi={n.naInput1Hi} value={L} min={0} max={1} step={0.01} onChange={(v) => { setL(v); setNote(null); }} accent={A_COLOR} />
              <Slider label={n.naInput2} lo={n.naInput2Lo} hi={n.naInput2Hi} value={K} min={0} max={1} step={0.01} onChange={(v) => { setK(v); setNote(null); }} accent={A_COLOR} />
            </div>
          </div>
          <div>
            <Cap>{n.naDialsLabel}</Cap>
            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{n.naDialsHint}</p>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
              <Slider label={`${n.weightWord}: ${n.naInput1}`} value={wL} min={-5} max={5} step={0.1} onChange={(v) => { setWL(v); setNote(null); }} showValue />
              <Slider label={`${n.weightWord}: ${n.naInput2}`} value={wK} min={-5} max={5} step={0.1} onChange={(v) => { setWK(v); setNote(null); }} showValue />
              <Slider label={n.biasWord} value={b} min={-3} max={3} step={0.1} onChange={(v) => { setB(v); setNote(null); }} showValue />
            </div>
          </div>
        </div>

        {/* right: the computation + output */}
        <div style={{ flex: "1 1 260px", minWidth: 240 }}>
          <Cap>{n.naComputeLabel}</Cap>
          <div style={{ marginTop: 10, border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", fontFamily: MONO, fontSize: 13.5, background: "var(--surface)" }}>
            <CalcRow label={n.naInput1} mid={`${f2(L)} × ${signed(wL)}`} val={signed(cL)} color={cL >= 0 ? A_COLOR : NEG_COLOR} />
            <CalcRow label={n.naInput2} mid={`${f2(K)} × ${signed(wK)}`} val={signed(cK)} color={cK >= 0 ? A_COLOR : NEG_COLOR} />
            <CalcRow label={n.biasWord} mid="" val={signed(b)} color="var(--muted)" />
            <CalcRow label={n.naSumLabel} mid="" val={signed(z)} color="var(--fg)" strong top />
            <CalcRow label={n.naSquashLabel} mid={`σ(${signed(z)})`} val={f2(p)} color={spam ? SPAM_COLOR : HAM_COLOR} strong />
          </div>

          {/* squash curve */}
          <div style={{ marginTop: 12 }}>
            <svg viewBox="0 0 100 40" width="100%" aria-hidden style={{ display: "block", overflow: "visible" }}>
              <line x1="0" y1="20" x2="100" y2="20" stroke="var(--hair)" strokeWidth="0.6" strokeDasharray="2 2" />
              <path d={sigPath()} fill="none" stroke="var(--tok-punct)" strokeWidth="1.6" strokeLinecap="round" />
              {(() => {
                const cx = Math.max(0, Math.min(100, ((z + 6) / 12) * 100));
                const cy = (1 - p) * 40;
                return <>
                  <line x1={cx} y1="0" x2={cx} y2="40" stroke="var(--border)" strokeWidth="0.6" />
                  <circle cx={cx} cy={cy} r={3} fill={spam ? SPAM_COLOR : HAM_COLOR} stroke="var(--bg)" strokeWidth="1.2" />
                </>;
              })()}
            </svg>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, textWrap: "pretty" }}>{rich(n.naSquashHelp)}</p>

          {/* verdict meter */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", fontFamily: MONO }}>
              <span>{n.naHam}</span><span>{n.naSpam}</span>
            </div>
            <div style={{ position: "relative", marginTop: 6, height: 10, borderRadius: 99, background: "var(--hair)", overflow: "hidden" }}>
              <span style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${HAM_COLOR}, ${SPAM_COLOR})`, opacity: 0.28 }} />
              <span style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--border)" }} />
              <span style={{ position: "absolute", top: -3, left: `calc(${Math.max(0, Math.min(100, p * 100))}% - 8px)`, width: 16, height: 16, borderRadius: "50%", background: spam ? SPAM_COLOR : HAM_COLOR, border: "2px solid var(--bg)", transition: reduce ? undefined : "left .18s ease" }} />
            </div>
            <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 700, letterSpacing: "-.04em", color: spam ? SPAM_COLOR : HAM_COLOR }}>{animPct}%</span>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg)" }}>{spam ? n.naVerdictSpam : n.naVerdictHam}</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".08em", color: "var(--muted)", marginTop: 2 }}>{n.naOutputLabel}</div>
          </div>
        </div>
      </div>

      {/* presets */}
      <div style={{ padding: "0 clamp(20px, 2.5vw, 28px) clamp(20px, 2.5vw, 28px)" }}>
        <div style={{ paddingTop: 16, borderTop: "1px solid var(--hair)", display: "flex", flexWrap: "wrap", gap: 9 }}>
          {n.naPresets.map((pr, i) => (
            <button key={i} type="button" onClick={() => preset(i)} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13, padding: "9px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }}>{pr.label}</button>
          ))}
        </div>
        {note && <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--fg)", maxWidth: "72ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(note)}</p>}
        <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{n.naNote}</p>
      </div>
    </div>
  );
}

function sigPath() {
  let d = "";
  for (let i = 0; i <= 48; i++) {
    const z = -6 + (i / 48) * 12;
    const x = ((z + 6) / 12) * 100;
    const y = (1 - sigmoid(z)) * 40;
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d;
}

function CalcRow({ label, mid, val, color, strong, top }: { label: string; mid: string; val: string; color: string; strong?: boolean; top?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "2px 10px", padding: "9px 12px", borderTop: top ? "1px solid var(--border)" : "1px solid var(--hair)" }}>
      <span style={{ minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0 8px", color: "var(--muted)" }}>
        <b style={{ color: "var(--fg)", fontWeight: strong ? 700 : 500 }}>{label}</b>
        {mid ? <span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{mid}</span> : null}
      </span>
      <span style={{ fontWeight: 700, color, fontSize: strong ? 15 : 13.5, whiteSpace: "nowrap" }}>{val}</span>
    </div>
  );
}

/* A labelled range slider with optional endpoint hints / numeric value. */
function Slider({ label, lo, hi, value, min, max, step, onChange, accent, showValue, valueText }: { label: string; lo?: string; hi?: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent?: string; showValue?: boolean; valueText?: string }) {
  return (
    <label style={{ display: "block", fontSize: 13.5 }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "var(--fg)" }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <b style={{ fontFamily: MONO, color: "var(--fg)" }}>{valueText ?? (showValue ? signed(value) : value.toFixed(2))}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", marginTop: 6, accentColor: accent ?? "var(--fg)" }} />
      {(lo || hi) && (
        <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", fontFamily: MONO, marginTop: -2 }}>
          <span>{lo}</span><span>{hi}</span>
        </span>
      )}
    </label>
  );
}

/* =====================================================================
   Interactive B — a layer of neurons predicts the next word
   ===================================================================== */

type HdSel =
  | { kind: "input"; k: number }
  | { kind: "hidden"; h: number }
  | { kind: "output"; o: number }
  | { kind: "edge1"; k: number; h: number }
  | { kind: "edge2"; h: number; o: number }
  | null;

/** Small coloured weight chip for the inspector readout. */
function Wt({ v }: { v: number }) {
  return <b style={{ fontFamily: MONO, color: v >= 0 ? "var(--tok-num)" : "var(--tok-sub)" }}>{signed(v)}</b>;
}

function Hotdog({ n, reduce }: { n: ReturnType<typeof useAcademy>["t"]["neural"]; reduce: boolean }) {
  const [sel, setSel] = useState<HdSel>(null);
  const note = n.nwPresets[0]?.note ?? null;
  const { inputs, hidden, probs } = forwardHotdog(0);
  const winner = probs[0] >= probs[1] ? 0 : 1;
  const ref = useRef<SVGSVGElement | null>(null);

  const vocabRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    drawHotdogNet(ref.current, { inputs, hidden, probs, winner, sel, reduce, inputLabels: n.nwFeatures, hiddenLabels: n.nwConcepts, outputLabels: n.nwWords, firesTag: n.nwFiresTag, quietTag: n.nwQuietTag, onSelect: setSel });
  }, [inputs, hidden, probs, winner, sel, reduce, n.nwFeatures, n.nwConcepts, n.nwWords, n.nwFiresTag, n.nwQuietTag]);
  useEffect(() => {
    drawVocab(vocabRef.current, { reduce, count: n.nwVocabCount });
  }, [reduce, n.nwVocabCount]);

  return (
    <div style={{ marginTop: "clamp(20px, 2.5vw, 30px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{n.nwLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{n.nwTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.nwBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        {/* the one sentence, same as the hero */}
        <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
          “{n.nwSentence}” <span style={{ color: "var(--muted)", fontWeight: 400 }}>{n.nwPromptTail}</span>
        </div>

        {/* column captions */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", gap: 8, fontFamily: MONO, fontSize: 9.5, letterSpacing: ".05em", color: "var(--muted)" }}>
          <span>{n.nwInputLabel}</span>
          <span style={{ textAlign: "center" }}>{n.nwHiddenLabel}</span>
          <span style={{ textAlign: "right" }}>{n.nwOutputLabel}</span>
        </div>

        {/* the network graph (scrolls horizontally on very narrow screens) */}
        <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", overflowX: "auto" }}>
          <div style={{ minWidth: 500, maxWidth: 620, margin: "0 auto", padding: "14px 12px" }}>
            <svg ref={ref} width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label={n.nwTitle} />
          </div>
        </div>

        {/* inspector readout — the parameters, live */}
        <div style={{ marginTop: 10, minHeight: 40, border: "1px solid var(--border)", borderRadius: 12, padding: "10px 13px", background: "var(--surface)", fontSize: 13.5, lineHeight: 1.6, color: "var(--fg)" }}>
          {sel === null ? (
            <span style={{ color: "var(--muted)" }}>{rich(n.nwInspectHint)}</span>
          ) : sel.kind === "edge1" ? (
            <span><b style={{ fontFamily: MONO }}>{n.nwFeatures[sel.k]} → {n.nwConcepts[sel.h]}</b> · {n.weightWord} <Wt v={NET_W1[sel.h][sel.k]} /></span>
          ) : sel.kind === "edge2" ? (
            <span><b style={{ fontFamily: MONO }}>{n.nwConcepts[sel.h]} → {n.nwWords[sel.o]}</b> · {n.weightWord} <Wt v={NET_W2[sel.o][sel.h]} /></span>
          ) : sel.kind === "input" ? (
            <span style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 8px" }}>
              <b style={{ fontFamily: MONO }}>{n.nwFeatures[sel.k]} →</b>
              {n.nwConcepts.map((c, h) => (
                <span key={h} style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{c} <Wt v={NET_W1[h][sel.k]} /></span>
              ))}
            </span>
          ) : sel.kind === "hidden" ? (
            <span style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 8px" }}>
              <b style={{ fontFamily: MONO }}>{n.nwConcepts[sel.h]} ←</b>
              {n.nwFeatures.map((f, k) => (
                <span key={k} style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{f} <Wt v={NET_W1[sel.h][k]} /></span>
              ))}
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{n.biasWord} <b style={{ color: "var(--fg)" }}>{signed(NET_B1[sel.h])}</b></span>
            </span>
          ) : (
            <span style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 8px" }}>
              <b style={{ fontFamily: MONO }}>{n.nwWords[sel.o]} ←</b>
              {n.nwConcepts.map((c, h) => (
                <span key={h} style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{c} <Wt v={NET_W2[sel.o][h]} /></span>
              ))}
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{n.biasWord} <b style={{ color: "var(--fg)" }}>{signed(NET_B2[sel.o])}</b></span>
            </span>
          )}
        </div>

        <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.nwParamNote)}</p>

        {note && <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--fg)", maxWidth: "72ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(note)}</p>}

        {/* scale-up: a real LLM's output layer is one neuron per vocabulary token */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".09em", color: "var(--muted)" }}>{n.nwVocabLead}</div>
          <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", overflowX: "auto" }}>
            <div style={{ minWidth: 440, maxWidth: 620, margin: "0 auto", padding: "14px 12px 10px" }}>
              <svg ref={vocabRef} width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label={n.nwVocabLead} />
            </div>
          </div>
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.nwWhy)}</p>
      </div>
    </div>
  );
}

/** Draw the intent network as a real 3 → 2 → 2 graph: three input neurons feed
 *  two hidden context gates, which feed two output neurons (EAT / PET). Edge colour
 *  = weight sign, thickness = |weight|; node fill = activation; the winning output
 *  is lit. Click any node or wire to inspect its parameter. */
function drawHotdogNet(
  el: SVGSVGElement | null,
  opts: { inputs: number[]; hidden: number[]; probs: number[]; winner: number; sel: HdSel; reduce: boolean; inputLabels: string[]; hiddenLabels: string[]; outputLabels: string[]; firesTag: string; quietTag: string; onSelect: (s: HdSel) => void },
): void {
  if (!el) return;
  const { inputs, hidden, probs, winner, sel, reduce, inputLabels, hiddenLabels, outputLabels, firesTag, quietTag, onSelect } = opts;
  const W = 620, H = 236;
  const IX = 140, HX = 358, OX = 540;
  const IY = [46, 118, 190];
  const HY = [88, 156];
  const OY = [88, 156];
  const GREEN = "var(--tok-word)", RED = "var(--tok-byte)";
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const anySel = !!sel;
  const maxIn = Math.max(1, ...inputs.map((v) => Math.abs(v)));
  const opFor = (hot: boolean, active: boolean) => (hot ? 0.92 : anySel ? 0.05 : active ? 0.34 : 0.08);

  // input → hidden
  for (let k = 0; k < IY.length; k++) {
    for (let h = 0; h < HY.length; h++) {
      const w = NET_W1[h][k];
      const active = inputs[k] / maxIn >= 0.4;
      const hot = !!sel && ((sel.kind === "edge1" && sel.k === k && sel.h === h) || (sel.kind === "input" && sel.k === k) || (sel.kind === "hidden" && sel.h === h));
      g.append("line").attr("x1", IX).attr("y1", IY[k]).attr("x2", HX).attr("y2", HY[h]).attr("stroke", "transparent").attr("stroke-width", 12).style("cursor", "pointer").on("click", () => onSelect({ kind: "edge1", k, h }));
      g.append("line").attr("x1", IX).attr("y1", IY[k]).attr("x2", HX).attr("y2", HY[h]).attr("stroke", w >= 0 ? GREEN : RED).attr("stroke-width", (hot ? 1.2 : 0) + 0.5 + Math.min(3, Math.abs(w) * 0.7)).attr("stroke-opacity", opFor(hot, active)).attr("stroke-linecap", "round").style("pointer-events", "none");
    }
  }
  // hidden → output
  for (let h = 0; h < HY.length; h++) {
    for (let o = 0; o < OY.length; o++) {
      const w = NET_W2[o][h];
      const active = hidden[h] >= 0.5;
      const hot = !!sel && ((sel.kind === "edge2" && sel.h === h && sel.o === o) || (sel.kind === "hidden" && sel.h === h) || (sel.kind === "output" && sel.o === o));
      g.append("line").attr("x1", HX).attr("y1", HY[h]).attr("x2", OX).attr("y2", OY[o]).attr("stroke", "transparent").attr("stroke-width", 12).style("cursor", "pointer").on("click", () => onSelect({ kind: "edge2", h, o }));
      g.append("line").attr("x1", HX).attr("y1", HY[h]).attr("x2", OX).attr("y2", OY[o]).attr("stroke", w >= 0 ? GREEN : RED).attr("stroke-width", (hot ? 1.2 : 0) + 0.5 + Math.min(3, Math.abs(w) * 0.7)).attr("stroke-opacity", opFor(hot, active)).attr("stroke-linecap", "round").style("pointer-events", "none");
    }
  }

  // input neurons
  IY.forEach((iy, k) => {
    const val = inputs[k];
    const on = !!sel && sel.kind === "input" && sel.k === k;
    const grp = g.append("g").style("cursor", "pointer").on("click", () => onSelect({ kind: "input", k }));
    grp.append("text").attr("x", IX - 20).attr("y", iy - 1).attr("text-anchor", "end").style("font-family", MONO).style("font-size", "11px").style("font-weight", val / maxIn >= 0.4 ? "700" : "400").style("fill", val / maxIn >= 0.4 ? "var(--fg)" : "var(--muted)").text(inputLabels[k]);
    grp.append("text").attr("x", IX - 20).attr("y", iy + 11).attr("text-anchor", "end").style("font-family", MONO).style("font-size", "9px").style("fill", "var(--muted)").text(val.toFixed(1));
    grp.append("circle").attr("cx", IX).attr("cy", iy).attr("r", 13).attr("fill", GREEN).attr("fill-opacity", 0.08 + (val / maxIn) * 0.82).attr("stroke", on ? "var(--fg)" : "var(--border)").attr("stroke-width", on ? 2.4 : 1.2);
  });

  // hidden gates (label on a chip below)
  HY.forEach((hy, h) => {
    const act = hidden[h];
    const firing = act >= 0.5;
    const on = !!sel && sel.kind === "hidden" && sel.h === h;
    const grp = g.append("g").style("cursor", "pointer").on("click", () => onSelect({ kind: "hidden", h }));
    grp.append("circle").attr("cx", HX).attr("cy", hy).attr("r", 15).attr("fill", GREEN).attr("fill-opacity", 0.08 + act * 0.82).attr("stroke", on ? "var(--fg)" : "var(--border)").attr("stroke-width", on ? 2.4 : 1.3);
    grp.append("text").attr("x", HX).attr("y", hy + 3).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "8px").style("font-weight", "700").style("fill", firing ? "var(--accent-ink)" : "var(--muted)").style("pointer-events", "none").text(act.toFixed(2));
    const label = hiddenLabels[h];
    const lw = label.length * 6.4 + 14;
    grp.append("rect").attr("x", HX - lw / 2).attr("y", hy + 18).attr("width", lw).attr("height", 15).attr("rx", 7.5).attr("fill", "var(--surface)").attr("stroke", firing ? GREEN : "var(--border)").attr("stroke-width", 1);
    grp.append("text").attr("x", HX).attr("y", hy + 28.5).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "9.5px").style("font-weight", firing ? "700" : "500").style("fill", firing ? GREEN : "var(--muted)").text(label);
    grp.append("text").attr("x", HX).attr("y", hy - 20).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "8.5px").style("fill", firing ? GREEN : "var(--muted)").style("pointer-events", "none").text(firing ? firesTag : quietTag);
  });

  // output neurons (EAT / PET)
  OY.forEach((oy, o) => {
    const p = probs[o];
    const win = o === winner;
    const on = !!sel && sel.kind === "output" && sel.o === o;
    const r = 7 + p * 12;
    const grp = g.append("g").style("cursor", "pointer").on("click", () => onSelect({ kind: "output", o }));
    grp.append("circle").attr("cx", OX).attr("cy", oy).attr("r", r).attr("fill", GREEN).attr("fill-opacity", 0.14 + p * 0.72).attr("stroke", win ? GREEN : on ? "var(--fg)" : "var(--border)").attr("stroke-width", win ? 2.6 : on ? 2 : 1.2);
    grp.append("text").attr("x", OX + 24).attr("y", oy - 1).attr("text-anchor", "start").style("font-family", MONO).style("font-size", win ? "13px" : "12px").style("font-weight", win ? "700" : "500").style("fill", win ? "var(--fg)" : "var(--muted)").text(outputLabels[o]);
    grp.append("text").attr("x", OX + 24).attr("y", oy + 13).attr("text-anchor", "start").style("font-family", MONO).style("font-size", "10px").style("font-weight", "700").style("fill", win ? GREEN : "var(--muted)").text(`${Math.round(p * 100)}%`);
  });

  // pulses: the firing gates push the signal to the winning action
  if (!reduce) {
    HY.forEach((hy, h) => {
      if (hidden[h] < 0.5) return;
      g.append("circle").attr("r", 2.6).attr("fill", GREEN).attr("cx", HX).attr("cy", hy).style("pointer-events", "none")
        .transition().duration(760).ease(d3.easeQuadInOut).attr("cx", OX).attr("cy", OY[winner]).attr("r", 1.5).style("opacity", 0).remove();
    });
  }
}

/** The output distribution of a *real* LLM: one probability bar per vocabulary
 *  token — "eat" wins, the rest fade into a long tail of ~200,000. Drawn with d3. */
function drawVocab(el: SVGSVGElement | null, opts: { reduce: boolean; count: string }): void {
  if (!el) return;
  const { reduce, count } = opts;
  const W = 620, H = 150;
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const N = 96;
  const top = [0.71, 0.12, 0.08, 0.05]; //  eat, pet, grab, buy
  const probs = d3.range(N).map((i) => (i < top.length ? top[i] : 0.02 * Math.exp(-(i - 4) / 16) * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7)))));
  const max = 0.71;
  const band = d3.scaleBand<number>().domain(d3.range(N)).range([10, W - 10]).padding(0.24);
  const bw = band.bandwidth();
  const baseY = H - 26;
  const maxH = baseY - 22;
  // sqrt height so the long tail of tiny probabilities still reads as a carpet of tokens
  const hOf = (p: number) => Math.max(3, (Math.sqrt(p) / Math.sqrt(max)) * maxH);

  g.append("line").attr("x1", 6).attr("x2", W - 6).attr("y1", baseY).attr("y2", baseY).attr("stroke", "var(--hair)").attr("stroke-width", 1);
  g.selectAll<SVGRectElement, number>("rect").data(probs).join("rect")
    .attr("x", (_d, i) => band(i)!).attr("width", bw).attr("rx", 1)
    .attr("fill", (_d, i) => (i === 0 ? "var(--tok-word)" : i < 4 ? "var(--tok-num)" : "var(--muted)"))
    .attr("fill-opacity", (_d, i) => (i < 4 ? 0.92 : 0.3))
    .attr("y", baseY).attr("height", 0)
    .transition().duration(reduce ? 0 : 620).delay((_d, i) => (reduce ? 0 : Math.min(i * 5, 340))).ease(d3.easeCubicOut)
    .attr("y", (d) => baseY - hOf(d)).attr("height", (d) => hOf(d));

  // label the winning token
  const cx0 = band(0)! + bw / 2;
  g.append("text").attr("x", cx0).attr("y", baseY - hOf(0.71) - 6).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "12px").style("font-weight", "700").style("fill", "var(--tok-word)").text("“eat” 71%");
  // the vast rest
  g.append("text").attr("x", W - 8).attr("y", baseY + 16).attr("text-anchor", "end").style("font-family", MONO).style("font-size", "10px").style("fill", "var(--muted)").text(`…  ${count}`);
  g.append("text").attr("x", band(4)!).attr("y", baseY + 16).attr("text-anchor", "start").style("font-family", MONO).style("font-size", "9.5px").style("fill", "var(--muted)").text("one bar = one token · softmax");
}
/* ------------------------------------------------------------ shared --- */

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

function Deeper({ title, body, reduce }: { title: string; body: string | string[]; reduce: boolean }) {
  const [open, setOpen] = useState(false);
  const paras = Array.isArray(body) ? body : [body];
  return (
    <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ appearance: "none", border: 0, background: "transparent", font: "inherit", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, color: "var(--fg)", padding: 0 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: "-.03em" }}>{title}</span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: reduce ? undefined : "rise .16s ease both" }}>
          {paras.map((p, i) => (
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

/* =====================================================================
   Hero — an LLM is a neural network (animated d3 pipeline)
   ===================================================================== */

function HeroStage({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: "var(--muted)" }}>{label}</div>
      {children}
      {sub && <div style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

function HeroArrow({ caption, reduce }: { caption: string; reduce: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 0" }}>
      <span aria-hidden className={reduce ? undefined : "tok-bob"} style={{ fontSize: 20, color: "var(--muted)", lineHeight: 1 }}>↓</span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)", letterSpacing: ".02em" }}>{caption}</span>
    </div>
  );
}

/** A small layered network whose neurons pulse in a left→right wave (real d3). */
function HeroNet({ reduce }: { reduce: boolean }) {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const W = 520;
    const H = 140;
    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
    svg.selectAll("*").remove();

    const layers = [4, 4, 4, 3];
    const xs = d3.scalePoint<number>().domain(layers.map((_, i) => i)).range([30, W - 30]).padding(0.2);
    type Node = { col: number; x: number; y: number; r: number };
    const nodes: Node[] = [];
    layers.forEach((cnt, ci) => {
      const ys = d3.scalePoint<number>().domain(d3.range(cnt)).range([22, H - 22]).padding(0.5);
      for (let r = 0; r < cnt; r++) nodes.push({ col: ci, x: xs(ci)!, y: ys(r)!, r: 6 });
    });
    const byCol = layers.map((_, ci) => nodes.filter((nd) => nd.col === ci));
    const edges: { a: Node; b: Node }[] = [];
    for (let ci = 0; ci < layers.length - 1; ci++) for (const a of byCol[ci]) for (const b of byCol[ci + 1]) edges.push({ a, b });

    svg.append("g").selectAll("line").data(edges).join("line")
      .attr("x1", (d) => d.a.x).attr("y1", (d) => d.a.y).attr("x2", (d) => d.b.x).attr("y2", (d) => d.b.y)
      .attr("stroke", "var(--tok-num)").attr("stroke-width", 0.9).attr("stroke-opacity", 0.4);

    const circ = svg.append("g").selectAll<SVGCircleElement, Node>("circle").data(nodes).join("circle")
      .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", (d) => d.r)
      .attr("fill", "var(--tok-num)").attr("fill-opacity", 0.36);

    if (reduce) {
      circ.attr("fill-opacity", 0.7);
      return;
    }
    const sweep = () => {
      circ.interrupt()
        .attr("fill-opacity", 0.36).attr("r", (d) => d.r)
        .transition("pulse").delay((d) => d.col * 170).duration(220).ease(d3.easeQuadOut)
        .attr("fill-opacity", 1).attr("r", (d) => d.r * 1.55)
        .transition().duration(520).ease(d3.easeCubicOut)
        .attr("fill-opacity", 0.36).attr("r", (d) => d.r);
    };
    sweep();
    const timer = d3.interval(sweep, 2200);
    return () => timer.stop();
  }, [reduce]);
  return <svg ref={ref} width="100%" style={{ display: "block", overflow: "visible" }} aria-hidden />;
}

/* =====================================================================
   The dot product — an animated match score (real d3)
   ===================================================================== */

// Neuron 3, the "Hot + Dog" Fusion Detector: a dot product of the weight vector
// w over the sentence's word vector x [hot, dog, cold, cute].
const W_PATTERN = FUSE_W; //     [1.75, 1.75, -1.0, -1.0]
const DP_BIAS = FUSE_B; //       0
const DP_INPUTS = FUSE_SENTENCES;

function DotProduct({ n, reduce }: { n: ReturnType<typeof useAcademy>["t"]["neural"]; reduce: boolean }) {
  const [pi, setPi] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const note = n.dpPresets[pi]?.note ?? null;

  const w = W_PATTERN;
  const x = DP_INPUTS[pi];
  const products = w.map((wi, i) => wi * x[i]);
  const dot = products.reduce((a, b) => a + b, 0); //   w · x       (the raw dot product)
  const z = dot + DP_BIAS; //                           w · x + b
  const p = sigmoid(z); //                              σ(w·x + b)  (the 0–1 activation)
  const animDot = useCountUp(Math.round(dot * 100), reduce);
  const animPct = useCountUp(Math.round(p * 100), reduce);
  const found = p >= 0.5;
  const dotColor = found ? "var(--tok-word)" : "var(--muted)";

  const ref = useRef<SVGSVGElement | null>(null);
  const sigRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    drawDotMatrix(ref.current, { weights: w, inputs: x, features: n.dpFeatures, rowW: n.dpRowTaste, rowX: n.dpRowMovie, rowP: n.dpRowProduct, sel, reduce, onSelect: setSel });
  }, [w, x, n.dpFeatures, n.dpRowTaste, n.dpRowMovie, n.dpRowProduct, sel, reduce]);
  useEffect(() => {
    drawSigmoid(sigRef.current, { z, reduce });
  }, [z, reduce]);

  return (
    <div style={{ marginTop: "clamp(20px, 2.5vw, 30px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{n.dpLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{n.dpTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.dpBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        {/* pick a sentence */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {n.dpPresets.map((p, i) => {
            const on = i === pi;
            return (
              <button key={i} type="button" aria-pressed={on} onClick={() => { setPi(i); setSel(null); }} className={on ? undefined : "u-hover-fg-border"}
                style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13, padding: "9px 13px", borderRadius: 10, border: `1px solid ${on ? "var(--fg)" : "var(--border)"}`, background: on ? "var(--fg)" : "var(--bg)", color: on ? "var(--accent-ink)" : "var(--fg)" }}>{p.label}</button>
            );
          })}
        </div>

        {/* the definition — two vectors, same length, one dot product */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", background: "var(--surface)" }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".09em", color: "var(--muted)" }}>{n.dpQuestionLead}</div>
          <div style={{ fontFamily: MONO, fontSize: "clamp(16px, 2.6vw, 20px)", fontWeight: 700, letterSpacing: "-.01em", marginTop: 8, color: "var(--fg)" }}>
            w · x = <span style={{ color: "var(--tok-num)" }}>∑</span><sub style={{ fontSize: "0.6em" }}>i=1</sub><sup style={{ fontSize: "0.6em" }}>{w.length}</sup> w<sub>i</sub> x<sub>i</sub>
          </div>
          <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--muted)" }}>{n.dpCandidates}</div>
        </div>

        <p style={{ margin: "14px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.dpLedgerLegend)}</p>

        {/* the two vectors, multiplied component by component (scrolls on narrow screens) */}
        <div style={{ marginTop: 10, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", overflowX: "auto" }}>
          <div style={{ minWidth: 460, maxWidth: 620, margin: "0 auto", padding: "12px 12px" }}>
            <svg ref={ref} width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label={n.dpTitle} />
          </div>
        </div>

        {/* the sum written out in the common notation */}
        <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 14, lineHeight: 1.9, overflowX: "auto", whiteSpace: "nowrap" }}>
          <span style={{ color: "var(--muted)" }}>w · x = </span>
          {products.map((_p, i) => (
            <span key={i}>
              {i > 0 ? <span style={{ color: "var(--muted)" }}> + </span> : null}
              <span style={{ color: "var(--muted)" }}>(</span>
              <span style={{ color: w[i] >= 0 ? "var(--tok-num)" : "var(--tok-sub)", fontWeight: 700 }}>{signed(w[i])}</span>
              <span style={{ color: "var(--muted)" }}>)(</span>
              <span style={{ color: "var(--fg)" }}>{x[i]}</span>
              <span style={{ color: "var(--muted)" }}>)</span>
            </span>
          ))}
          <span style={{ color: "var(--muted)" }}> = </span>
          <span style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: "-.03em", color: dotColor, verticalAlign: "-2px" }}>{(animDot / 100).toFixed(2)}</span>
        </div>

        {/* the squash: a neuron runs w·x through σ */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", background: "var(--surface)" }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".09em", color: "var(--muted)" }}>{n.dpSquashLead}</div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: "12px 18px", flexWrap: "wrap" }}>
            <svg ref={sigRef} width="150" height="72" style={{ display: "block", flex: "0 0 auto", overflow: "visible" }} aria-hidden />
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: MONO, fontSize: 13, color: "var(--muted)" }}>σ({(animDot / 100).toFixed(2)} − {Math.abs(DP_BIAS).toFixed(2)}) =</span>
              <span style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 700, letterSpacing: "-.04em", color: found ? "var(--tok-word)" : "var(--tok-byte)" }}>{animPct}%</span>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg)" }}>→ {found ? n.dpKeep : n.dpDrop}</span>
            </div>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, textWrap: "pretty" }}>{rich(n.dpSquashNote)}</p>
        </div>

        {/* inspector: the selected component's term */}
        <div style={{ marginTop: 10, minHeight: 20, fontSize: 13.5, lineHeight: 1.5, color: "var(--fg)" }}>
          {sel === null ? (
            <span style={{ color: "var(--muted)" }}>{rich(n.dpMatrixHint)}</span>
          ) : (
            <span style={{ fontFamily: MONO }}>
              <b>{n.dpFeatures[sel]}</b> · w<sub>{sel + 1}</sub> <b style={{ color: w[sel] >= 0 ? "var(--tok-num)" : "var(--tok-sub)" }}>{signed(w[sel])}</b> × x<sub>{sel + 1}</sub> <b style={{ color: "var(--fg)" }}>{x[sel]}</b> = <b style={{ color: products[sel] >= 0 ? "var(--tok-word)" : "var(--tok-byte)" }}>{signed(products[sel])}</b>
            </span>
          )}
        </div>

        <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.dpParamNote)}</p>

        {note && <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--fg)", maxWidth: "72ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(note)}</p>}
        <p style={{ margin: "16px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.dpWhy)}</p>
      </div>
    </div>
  );
}

/** One matrix cell: a rounded rect tinted by magnitude with its value centred. */
function dpCell(g: d3.Selection<SVGGElement, unknown, null, undefined>, cx: number, y: number, cw: number, ch: number, fill: string, op: number, txt: string, txtColor: string, on: boolean) {
  g.append("rect").attr("x", cx).attr("y", y).attr("width", cw).attr("height", ch).attr("rx", 6).attr("fill", fill).attr("fill-opacity", op).attr("stroke", on ? "var(--fg)" : "var(--border)").attr("stroke-width", on ? 1.8 : 1).style("pointer-events", "none");
  g.append("text").attr("x", cx + cw / 2).attr("y", y + ch / 2 + 4).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "12px").style("font-weight", "700").style("fill", txtColor).style("pointer-events", "none").text(txt);
}

/** Draw the dot product as two bracketed vectors of the same length — the weight
 *  vector w over the input vector x — multiplied component by component into a
 *  product row. Click a component to inspect its term. */
function drawDotMatrix(
  el: SVGSVGElement | null,
  opts: { weights: number[]; inputs: number[]; features: string[]; rowW: string; rowX: string; rowP: string; sel: number | null; reduce: boolean; onSelect: (i: number | null) => void },
): void {
  if (!el) return;
  const { weights, inputs, features, rowW, rowX, rowP, sel, onSelect } = opts;
  const W = 620, H = 182;
  const GREEN = "var(--tok-word)", RED = "var(--tok-byte)", BLUE = "var(--tok-num)", ORANGE = "var(--tok-sub)";
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const nc = weights.length;
  const band = d3.scaleBand<number>().domain(d3.range(nc)).range([124, 584]).padding(0.16);
  const cw = band.bandwidth();
  const x0 = band(0)!, x1 = band(nc - 1)! + cw;
  const products = weights.map((v, i) => v * inputs[i]);
  const maxW = Math.max(...weights.map((v) => Math.abs(v)));
  const maxP = Math.max(0.5, ...products.map((v) => Math.abs(v)));
  const wY = 34, xY = 90, pY = 146, ch = 30;

  const rowLabel = (y: number, txt: string) =>
    g.append("text").attr("x", 92).attr("y", y + ch / 2 + 4).attr("text-anchor", "end").style("font-family", MONO).style("font-size", "12px").style("font-weight", "700").style("fill", "var(--fg)").text(txt);
  rowLabel(wY, rowW);
  rowLabel(xY, rowX);
  rowLabel(pY, rowP);

  // vector brackets around the w and x rows
  const bracket = (x: number, y: number, open: boolean) => {
    const t = open ? 5 : -5;
    g.append("path").attr("d", `M${x + t},${y - 3} L${x},${y - 3} L${x},${y + ch + 3} L${x + t},${y + ch + 3}`).attr("fill", "none").attr("stroke", "var(--muted)").attr("stroke-width", 1.4);
  };
  [wY, xY].forEach((y) => { bracket(x0 - 9, y, true); bracket(x1 + 9, y, false); });

  d3.range(nc).forEach((i) => {
    const cx = band(i)!;
    const on = sel === i;
    // clickable column
    g.append("rect").attr("x", cx - 3).attr("y", 4).attr("width", cw + 6).attr("height", H - 8).attr("rx", 8).attr("fill", "var(--band)").attr("fill-opacity", on ? 1 : 0).style("cursor", "pointer").on("click", () => onSelect(on ? null : i));
    // component label (the concept word)
    g.append("text").attr("x", cx + cw / 2).attr("y", 20).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "10px").style("font-weight", on ? "700" : "400").style("fill", on ? "var(--fg)" : "var(--muted)").style("pointer-events", "none").text(features[i]);
    // w cell
    const wv = weights[i];
    dpCell(g, cx, wY, cw, ch, wv >= 0 ? GREEN : RED, 0.08 + (Math.abs(wv) / maxW) * 0.32, signed(wv), wv >= 0 ? BLUE : ORANGE, on);
    g.append("text").attr("x", cx + cw / 2).attr("y", wY + ch + 14).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "12px").style("fill", "var(--muted)").style("pointer-events", "none").text("×");
    // x cell
    const xv = inputs[i];
    dpCell(g, cx, xY, cw, ch, GREEN, 0.05 + Math.min(1, xv) * 0.5, `${xv}`, xv >= 0.5 ? "var(--fg)" : "var(--muted)", on);
    g.append("text").attr("x", cx + cw / 2).attr("y", xY + ch + 14).attr("text-anchor", "middle").style("font-family", MONO).style("font-size", "12px").style("fill", "var(--muted)").style("pointer-events", "none").text("=");
    // product cell
    const pv = products[i];
    dpCell(g, cx, pY, cw, ch, pv >= 0 ? GREEN : RED, 0.08 + (Math.abs(pv) / maxP) * 0.5, signed(pv), pv >= 0 ? GREEN : RED, on);
  });
}

/** A small sigmoid curve with the current point marked — the squash, drawn with d3. */
function drawSigmoid(el: SVGSVGElement | null, opts: { z: number; reduce: boolean }): void {
  if (!el) return;
  const { z, reduce } = opts;
  const W = 150, H = 72;
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const xs = d3.scaleLinear().domain([-5, 5]).range([6, W - 6]);
  const ys = d3.scaleLinear().domain([0, 1]).range([H - 8, 8]);
  g.append("line").attr("x1", 6).attr("x2", W - 6).attr("y1", ys(0.5)).attr("y2", ys(0.5)).attr("stroke", "var(--hair)").attr("stroke-width", 0.8).attr("stroke-dasharray", "2 2");
  const line = d3.line<number>().x((d) => xs(d)).y((d) => ys(1 / (1 + Math.exp(-d)))).curve(d3.curveBasis);
  g.append("path").attr("d", line(d3.range(-5, 5.01, 0.25))).attr("fill", "none").attr("stroke", "var(--tok-punct)").attr("stroke-width", 1.7).attr("stroke-linecap", "round");
  const zc = Math.max(-5, Math.min(5, z));
  const p = 1 / (1 + Math.exp(-z));
  g.append("line").attr("x1", xs(zc)).attr("x2", xs(zc)).attr("y1", 8).attr("y2", H - 8).attr("stroke", "var(--border)").attr("stroke-width", 0.7);
  const dot = g.append("circle").attr("cx", xs(zc)).attr("cy", ys(p)).attr("r", 4).attr("fill", p >= 0.5 ? "var(--tok-word)" : "var(--tok-byte)").attr("stroke", "var(--bg)").attr("stroke-width", 1.5);
  if (!reduce) dot.attr("r", 0).transition().duration(320).ease(d3.easeCubicOut).attr("r", 4);
}

/* =====================================================================
   Where the billions come from — width × depth dials
   ===================================================================== */

const WIDTHS = [128, 256, 512, 768, 1024, 1536, 2048, 3072, 4096, 6144, 8192, 12288];
const LAYERS = [4, 5, 5, 4];
const SUBS = "₁₂₃₄₅₆₇₈₉";
const sub = (i: number) => SUBS.charAt(i - 1) || String(i);

/** The labelled anatomy diagram — click a neuron to trace its weights. */
function NetworkAnatomy({ n }: { n: ReturnType<typeof useAcademy>["t"]["neural"] }) {
  const [sel, setSel] = useState<{ col: number; row: number }>({ col: 1, row: 2 });
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    drawSchematic(ref.current, sel, (nd) => setSel(nd));
  }, [sel]);

  const nIn = LAYERS[sel.col - 1];
  const terms: number[] = nIn <= 4 ? Array.from({ length: nIn }, (_v, i) => i + 1) : [1, 2, -1, nIn];

  return (
    <div style={{ marginTop: "clamp(20px, 2.5vw, 30px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{n.psAnatomyLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{n.psTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.psBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "14px 12px", background: "var(--surface)" }}>
          <svg ref={ref} width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label={n.psTitle} />
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, textWrap: "pretty" }}>{n.psLegend}</p>

        <div style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 12, padding: "13px 15px", background: "var(--surface)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".08em", color: "var(--muted)" }}>{n.psFormulaLead}</div>
          <div style={{ marginTop: 8, fontFamily: MONO, fontSize: "clamp(14px, 2.2vw, 18px)", color: "var(--fg)", lineHeight: 1.5 }}>
            activation({" "}
            {terms.map((t, i) => (
              <span key={i}>
                {i > 0 ? " + " : ""}
                {t === -1 ? "…" : <><b style={{ color: "var(--tok-num)" }}>w{sub(t)}</b>·a{sub(t)}</>}
              </span>
            ))}
            {" + "}
            <b style={{ color: "var(--tok-word)" }}>b</b>
            {" )"}
          </div>
        </div>

        <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--fg)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.psTotalNote)}</p>
      </div>
    </div>
  );
}

/** The scale calculator — two dials (width, depth) turn into neurons + parameters. */
function ParamCalculator({ n, reduce }: { n: ReturnType<typeof useAcademy>["t"]["neural"]; reduce: boolean }) {
  const [wi, setWi] = useState(8); //   4096
  const [depth, setDepth] = useState(60);
  const [note, setNote] = useState<string | null>(n.psPresets[1].note);

  const width = WIDTHS[wi];
  const params = 12 * depth * width * width;
  const neurons = 5 * depth * width;
  const animParams = useCountUp(params, reduce);

  function preset(i: number) {
    const cfg = [
      { wi: 3, depth: 12 }, //  ≈85M
      { wi: 8, depth: 60 }, //  ≈12B
      { wi: 10, depth: 88 }, // ≈70B
    ][i];
    setWi(cfg.wi);
    setDepth(cfg.depth);
    setNote(n.psPresets[i].note);
  }

  return (
    <div style={{ marginTop: "clamp(16px, 2vw, 22px)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ padding: "20px clamp(20px, 2.5vw, 28px)", borderBottom: "1px solid var(--hair)" }}>
        <Cap>{n.psLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{n.psCalcTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.psCalcBody)}</p>
      </div>

      <div style={{ padding: "clamp(20px, 2.5vw, 28px)", display: "flex", flexWrap: "wrap", gap: "clamp(20px,3vw,34px)" }}>
        <div style={{ flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 14 }}>
          <Slider label={n.psWidthLabel} value={wi} min={0} max={WIDTHS.length - 1} step={1} onChange={(v) => { setWi(v); setNote(null); }} valueText={fmtInt(WIDTHS[wi])} />
          <Slider label={n.psDepthLabel} value={depth} min={2} max={96} step={1} onChange={(v) => { setDepth(v); setNote(null); }} valueText={String(depth)} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {n.psPresets.map((p, i) => (
              <button key={i} type="button" onClick={() => preset(i)} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }}>{p.label}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: "1 1 220px", minWidth: 220, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", gap: "clamp(16px,3vw,30px)", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{n.psNeuronsLabel}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, letterSpacing: "-.04em", color: "var(--fg)" }}>~{fmtCompact(neurons)}</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{n.psParamsLabel}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, letterSpacing: "-.04em", color: "var(--tok-num)" }}>~{fmtCompact(animParams)}</div>
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
            <span style={{ color: "var(--fg)", fontWeight: 700 }}>params</span> ≈ 12 × <span style={{ color: "var(--fg)" }}>depth</span> × <span style={{ color: "var(--fg)" }}>width²</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 clamp(20px, 2.5vw, 28px) clamp(20px, 2.5vw, 28px)" }}>
        {note && <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--fg)", maxWidth: "74ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(note)}</p>}
        <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.psConnNote)}</p>
        <p style={{ margin: "12px 0 0", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.62, maxWidth: "74ch", textWrap: "pretty" }}>{rich(n.psTwoDials)}</p>
      </div>
    </div>
  );
}

/** The anatomy diagram: every line is a weight; click a neuron to light up the
 *  weights feeding it and label the previous layer's outputs a₁…aₙ. */
function drawSchematic(el: SVGSVGElement | null, sel: { col: number; row: number }, onSelect: (nd: { col: number; row: number }) => void) {
  if (!el) return;
  const W = 340;
  const H = 190;
  const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const xs = d3.scalePoint<number>().domain(LAYERS.map((_, i) => i)).range([42, W - 22]).padding(0.08);
  type Node = { x: number; y: number; col: number; row: number };
  const nodes: Node[] = [];
  LAYERS.forEach((cnt, ci) => {
    const ys = d3.scalePoint<number>().domain(d3.range(cnt)).range([22, H - 34]).padding(0.55);
    for (let r = 0; r < cnt; r++) nodes.push({ x: xs(ci)!, y: ys(r)!, col: ci, row: r });
  });
  const byCol = LAYERS.map((_, ci) => nodes.filter((nd) => nd.col === ci));
  const isSel = (nd: Node) => nd.col === sel.col && nd.row === sel.row;
  const edges: { a: Node; b: Node; hot: boolean }[] = [];
  for (let ci = 0; ci < LAYERS.length - 1; ci++) for (const a of byCol[ci]) for (const b of byCol[ci + 1]) edges.push({ a, b, hot: isSel(b) });

  const eg = svg.append("g");
  eg.selectAll("line.dim").data(edges.filter((e) => !e.hot)).join("line")
    .attr("x1", (d) => d.a.x).attr("y1", (d) => d.a.y).attr("x2", (d) => d.b.x).attr("y2", (d) => d.b.y)
    .attr("stroke", "var(--tok-num)").attr("stroke-width", 0.8).attr("stroke-opacity", 0.45);
  eg.selectAll("line.hot").data(edges.filter((e) => e.hot)).join("line")
    .attr("x1", (d) => d.a.x).attr("y1", (d) => d.a.y).attr("x2", (d) => d.b.x).attr("y2", (d) => d.b.y)
    .attr("stroke", "var(--tok-num)").attr("stroke-width", 2).attr("stroke-opacity", 0.95);

  const ng = svg.append("g");
  ng.selectAll<SVGCircleElement, Node>("circle").data(nodes).join("circle")
    .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", (d) => (isSel(d) ? 8 : 6))
    .attr("fill", (d) => (isSel(d) ? "color-mix(in srgb, var(--tok-num) 30%, var(--bg))" : "var(--bg)"))
    .attr("stroke", (d) => (isSel(d) ? "var(--tok-num)" : d.col === sel.col - 1 ? "var(--fg)" : "var(--border)"))
    .attr("stroke-width", (d) => (isSel(d) ? 2.2 : 1.5))
    .style("cursor", (d) => (d.col >= 1 ? "pointer" : "default"))
    .on("click", (_e, d) => { if (d.col >= 1) onSelect({ col: d.col, row: d.row }); });

  // label the previous layer's outputs a₁…aₙ
  ng.selectAll<SVGTextElement, Node>("text.a").data(byCol[sel.col - 1]).join("text")
    .attr("x", (d) => d.x - 11).attr("y", (d) => d.y + 3).attr("text-anchor", "end")
    .style("font-family", MONO).style("font-size", "9px").style("fill", "var(--muted)")
    .text((_d, i) => `a${sub(i + 1)}`);

  // layer numbers along the bottom
  svg.append("g").selectAll("text.layer").data(LAYERS).join("text")
    .attr("x", (_d, i) => xs(i)!).attr("y", H - 8).attr("text-anchor", "middle")
    .style("font-family", MONO).style("font-size", "9.5px").style("fill", "var(--muted)")
    .text((_d, i) => String(i + 1));
}
