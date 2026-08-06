"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAcademy } from "../providers";
import LessonRail from "./LessonRail";
import { MONO, DISPLAY, useReducedMotion, Cap, rich } from "./lesson-kit";
import { qualityScore } from "../lib/dataset";

const TEXT_COLOR = "var(--tok-num)"; //  share of training text
const POP_COLOR = "var(--tok-word)"; //  share of world population

function pct(v: number): string {
  return v < 0.01 ? `${(v * 100).toFixed(1)}%` : `${Math.round(v * 100)}%`;
}

export default function Bias() {
  const { t, lang } = useAcademy();
  const b = t.bias;
  const reduce = useReducedMotion();

  const [selLang, setSelLang] = useState<number | null>(0);
  const [selPair, setSelPair] = useState(0);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [deeperOpen, setDeeperOpen] = useState(false);
  const [done, setDone] = useState(false);

  const maxShare = useMemo(
    () => Math.max(...b.langs.flatMap((l) => [l.text, l.pop])),
    [b.langs],
  );

  const pair = b.pairs[selPair];
  const formalScore = useMemo(() => qualityScore(pair.formal), [pair.formal]);
  const informalScore = useMemo(() => qualityScore(pair.informal), [pair.informal]);

  const sel = selLang != null ? b.langs[selLang] : null;
  const selFactor = sel ? sel.text / sel.pop : 1;
  const selOver = selFactor >= 1;
  const selMult = selOver ? selFactor : 1 / selFactor;

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
      <LessonRail current={3} />

      <article style={{ flex: "1 1 560px", minWidth: 0, paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{b.crumb}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1, margin: "16px 0 0" }}>
          {b.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "58ch", textWrap: "pretty" }}>
          {b.lede}
        </p>

        {/* ---- Concept ----------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 16, maxWidth: "66ch" }}>
          {b.concept.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.68, textWrap: "pretty" }}>{rich(p)}</p>
          ))}
        </div>

        {/* ---- Interactive A: representation meter ------------------- */}
        <div style={{ marginTop: "clamp(30px, 3.5vw, 44px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)" }}>
          <Cap>{b.repLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 2.2vw, 27px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{b.repTitle}</div>
          <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--muted)", lineHeight: 1.62, maxWidth: "64ch", textWrap: "pretty" }}>{b.repBody}</p>

          {/* legend */}
          <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
            {[
              { c: TEXT_COLOR, l: b.repTextLabel },
              { c: POP_COLOR, l: b.repPopLabel },
            ].map((x, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--muted)", fontFamily: MONO, letterSpacing: ".04em" }}>
                <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: x.c }} />
                {x.l}
              </span>
            ))}
          </div>

          {/* rows */}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            {b.langs.map((l, i) => {
              const factor = l.text / l.pop;
              const over = factor >= 1;
              const mult = over ? factor : 1 / factor;
              const isSel = selLang === i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={isSel}
                  onClick={() => setSelLang(i)}
                  className="u-hover-surface"
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    font: "inherit",
                    textAlign: "left",
                    display: "grid",
                    gridTemplateColumns: "minmax(84px, 108px) 1fr auto",
                    alignItems: "center",
                    gap: "4px 12px",
                    padding: "10px 10px",
                    margin: "0 -10px",
                    borderRadius: 10,
                    border: `1px solid ${isSel ? "var(--fg)" : "transparent"}`,
                    background: "transparent",
                    color: "var(--fg)",
                  }}
                >
                  <span style={{ gridColumn: 1, fontSize: 14.5, fontWeight: isSel ? 700 : 500 }}>{l.key}</span>
                  <span style={{ gridColumn: 2, display: "flex", flexDirection: "column", gap: 4, width: "100%", minWidth: 0 }}>
                    <Bar frac={l.text / maxShare} color={TEXT_COLOR} label={pct(l.text)} reduce={reduce} />
                    <Bar frac={l.pop / maxShare} color={POP_COLOR} label={pct(l.pop)} reduce={reduce} />
                  </span>
                  <span style={{ gridColumn: 3, fontFamily: MONO, fontSize: 12, color: over ? TEXT_COLOR : "var(--muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {mult >= 10 ? Math.round(mult) : mult.toFixed(1)}× {over ? "↑" : "↓"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* readout */}
          <div style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.6, color: "var(--fg)", minHeight: 24, textWrap: "pretty" }}>
            {sel ? (
              <>
                <strong style={{ fontWeight: 700 }}>{sel.key}</strong>: {pct(sel.text)} {b.repTextLabel.toLowerCase()} · {pct(sel.pop)} {b.repPopLabel.toLowerCase()} —{" "}
                <strong style={{ fontWeight: 700, color: selOver ? TEXT_COLOR : "var(--fg)" }}>
                  {selMult >= 10 ? Math.round(selMult) : selMult.toFixed(1)}× {selOver ? b.repOver : b.repUnder}
                </strong>{" "}
                {b.repFactorWord}.
              </>
            ) : (
              <span style={{ color: "var(--muted)" }}>{b.repSelectHint}</span>
            )}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "66ch", textWrap: "pretty" }}>{b.repNote}</p>
        </div>

        {/* ---- Interactive B: the filter's norm ---------------------- */}
        <div style={{ marginTop: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)" }}>
          <Cap>{b.filterLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 2.2vw, 27px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{b.filterTitle}</div>
          <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--muted)", lineHeight: 1.62, maxWidth: "64ch", textWrap: "pretty" }}>{b.filterBody}</p>

          {/* topic tabs */}
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {b.pairs.map((p, i) => {
              const active = i === selPair;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelPair(i)}
                  aria-pressed={active}
                  className="u-hover-fg-border"
                  style={{ appearance: "none", cursor: "pointer", font: "inherit", fontFamily: MONO, fontSize: 13, padding: "8px 13px", borderRadius: 10, border: `1px solid ${active ? "var(--fg)" : "var(--border)"}`, background: active ? "var(--fg)" : "var(--bg)", color: active ? "var(--accent-ink)" : "var(--fg)" }}
                >
                  {p.topic}
                </button>
              );
            })}
          </div>

          {/* register cards */}
          <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
            <RegisterCard label={b.filterFormalLabel} text={pair.formal} score={formalScore} scoreWord={b.filterScoreWord} winner={formalScore >= informalScore} reduce={reduce} />
            <RegisterCard label={b.filterInformalLabel} text={pair.informal} score={informalScore} scoreWord={b.filterScoreWord} winner={informalScore > formalScore} reduce={reduce} />
          </div>

          <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--fg)", lineHeight: 1.62, maxWidth: "64ch", textWrap: "pretty" }}>{pair.note}</p>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: "66ch", textWrap: "pretty" }}>{b.filterNote}</p>
        </div>

        {/* ---- Teaser: association bias ------------------------------ */}
        <div style={{ marginTop: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)", background: "var(--surface)" }}>
          <Cap>{b.assocLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(18px, 2vw, 23px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{b.assocTitle}</div>
          <p style={{ margin: "10px 0 0", fontSize: 16.5, color: "var(--muted)", lineHeight: 1.66, maxWidth: "66ch", textWrap: "pretty" }}>{rich(b.assocBody)}</p>
        </div>

        {/* ---- Mitigations ------------------------------------------- */}
        <div style={{ marginTop: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.5vw, 28px)" }}>
          <Cap>{b.mitLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 2.2vw, 27px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{b.mitTitle}</div>
          <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--muted)", lineHeight: 1.62, maxWidth: "64ch", textWrap: "pretty" }}>{b.mitBody}</p>

          <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
            {b.mitigations.map((m, i) => (
              <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "15px 16px", background: "var(--bg)" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, letterSpacing: "-.02em" }}>{m.title}</div>
                <p style={{ margin: "7px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.58, textWrap: "pretty" }}>{m.body}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: "16px 0 0", fontSize: 16, color: "var(--fg)", lineHeight: 1.64, maxWidth: "66ch", textWrap: "pretty" }}>{rich(b.mitClosing)}</p>
        </div>

        {/* ---- Explain it back --------------------------------------- */}
        <div style={{ marginTop: "clamp(28px, 3.2vw, 40px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
          <Cap>{t.explainLabel}</Cap>
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, maxWidth: "52ch", textWrap: "balance" }}>{b.explainQ}</div>
          <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
            {answerOpen ? t.hide : t.reveal}
          </button>
          {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, maxWidth: "64ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{b.explainA}</p>}
        </div>

        {/* ---- Go deeper --------------------------------------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)" }}>
          <button type="button" onClick={() => setDeeperOpen((v) => !v)} aria-expanded={deeperOpen} style={{ appearance: "none", border: 0, background: "transparent", font: "inherit", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, color: "var(--fg)", padding: 0 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: "-.03em" }}>{b.deeperTitle}</span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{deeperOpen ? "−" : "+"}</span>
          </button>
          {deeperOpen && <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.68, color: "var(--muted)", maxWidth: "66ch", textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(b.deeperBody)}</p>}
        </div>

        {/* ---- Bridge to Neural networks (not yet built) ------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{b.bridgeLabel}</div>
          <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", maxWidth: "60ch", textWrap: "pretty" }}>{b.bridgeBody}</p>
        </div>

        {/* ---- Controls ---------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/stage/1/data" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {b.prev}</Link>
            <span aria-disabled style={{ fontSize: 15, fontWeight: 600, border: "1px dashed var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>{b.next} →</span>
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

function Bar({ frac, color, label, reduce }: { frac: number; color: string; label: string; reduce: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
      <span style={{ flex: "1 1 auto", height: 12, borderRadius: 99, background: "var(--hair)", overflow: "hidden", minWidth: 0 }}>
        <span style={{ display: "block", height: "100%", width: `${Math.max(1.5, frac * 100)}%`, background: color, borderRadius: 99, transition: reduce ? undefined : "width .5s ease" }} />
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: "var(--muted)", flex: "0 0 auto", width: 40, textAlign: "right" }}>{label}</span>
    </span>
  );
}

function RegisterCard({
  label,
  text,
  score,
  scoreWord,
  winner,
  reduce,
}: {
  label: string;
  text: string;
  score: number;
  scoreWord: string;
  winner: boolean;
  reduce: boolean;
}) {
  return (
    <div
      style={{
        border: `1px solid ${winner ? "var(--tok-word)" : "var(--border)"}`,
        borderRadius: 14,
        padding: "15px 16px",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".08em", color: "var(--muted)" }}>{label}</div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--fg)", textWrap: "pretty" }}>“{text}”</p>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--muted)", flex: "0 0 auto", textTransform: "uppercase", letterSpacing: ".08em" }}>{scoreWord}</span>
        <span style={{ flex: "1 1 auto", height: 8, borderRadius: 99, background: "var(--hair)", overflow: "hidden" }}>
          <span style={{ display: "block", height: "100%", width: `${Math.round(score * 100)}%`, background: "var(--tok-word)", borderRadius: 99, transition: reduce ? undefined : "width .5s ease" }} />
        </span>
        <span style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, letterSpacing: "-.03em", color: "var(--fg)", flex: "0 0 auto" }}>{Math.round(score * 100)}</span>
      </div>
    </div>
  );
}
