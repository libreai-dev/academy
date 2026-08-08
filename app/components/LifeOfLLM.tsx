"use client";

import Link from "next/link";
import { useState } from "react";
import { useAcademy } from "../providers";
import LessonRail from "./LessonRail";

const MONO = "var(--font-jetbrains-mono),monospace";
const DISPLAY = "var(--font-space-grotesk),sans-serif";

/** Stage 1 → "The life of an LLM": a complete, engineer-level walkthrough of
 *  the six stages — each with a before → after and the tools / hardware / lab
 *  work / cost behind it. Rendered as a full document, not a click-through. */
export default function LifeOfLLM() {
  const { t } = useAcademy();
  const life = t.life;

  const [answerOpen, setAnswerOpen] = useState(false);
  const [deeperOpen, setDeeperOpen] = useState(false);
  const [done, setDone] = useState(false);

  const cap = (label: string) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", color: "var(--muted)" }}>{label}</div>
  );

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "clamp(26px, 3vw, 40px) 32px 0",
        display: "flex",
        flexWrap: "wrap",
        gap: "clamp(28px, 4vw, 60px)",
        alignItems: "flex-start",
      }}
    >
      {/* ---- Left rail ------------------------------------------------ */}
      <LessonRail current={0} />

      {/* ---- Article -------------------------------------------------- */}
      <article style={{ flex: "1 1 560px", minWidth: 0, paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{life.crumb}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(34px, 4.4vw, 58px)", fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1.02, margin: "16px 0 0" }}>{life.title}</h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "60ch", textWrap: "pretty" }}>{life.lede}</p>

        {/* pipeline map */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 18, padding: "clamp(16px,2vw,22px) clamp(18px,2.2vw,24px)" }}>
          {cap(life.stagesLabel)}
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {life.stages.map((st, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <a href={`#stage-${i}`} className="u-hover-fg-border" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 12.5, padding: "7px 11px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--fg)" }}>
                  <span style={{ color: "var(--muted)" }}>{String(i + 1).padStart(2, "0")}</span>
                  {st.name}
                </a>
                {i < life.stages.length - 1 && <span style={{ color: "var(--muted)", fontSize: 12 }}>→</span>}
              </span>
            ))}
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 14.5, color: "var(--muted)", lineHeight: 1.6, maxWidth: "74ch" }}>{life.intro}</p>
        </div>

        {/* full stage-by-stage document */}
        {life.stages.map((st, i) => (
          <section key={i} id={`stage-${i}`} style={{ marginTop: "clamp(34px, 4vw, 56px)", scrollMarginTop: 90 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>STAGE {String(i + 1).padStart(2, "0")} / {String(life.stages.length).padStart(2, "0")}</span>
              <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 600, letterSpacing: "-.04em", margin: 0 }}>{st.name}</h2>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "clamp(16px, 1.7vw, 19px)", color: "var(--muted)", lineHeight: 1.5, maxWidth: "58ch", textWrap: "pretty" }}>{st.tagline}</p>

            {/* before -> after graphic */}
            <div style={{ marginTop: 20, border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "stretch" }}>
              <div style={{ padding: "clamp(16px,2vw,22px)", minWidth: 0 }}>
                {cap(life.beforeCap)}
                <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 13.5, lineHeight: 1.55, color: "var(--fg)", wordBreak: "break-word" }}>{st.before}</div>
              </div>
              <div aria-hidden style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", color: "var(--muted)", fontSize: 20, borderLeft: "1px solid var(--hair)", borderRight: "1px solid var(--hair)", background: "var(--surface)" }}>→</div>
              <div style={{ padding: "clamp(16px,2vw,22px)", minWidth: 0, background: "var(--surface)" }}>
                {cap(life.afterCap)}
                <div style={{ marginTop: 10 }}>
                  {st.tokens ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {st.tokens.map((tok, k) => (
                        <span key={k} style={{ fontFamily: MONO, fontSize: 13, padding: "5px 8px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", whiteSpace: "pre" }}>{tok === " " ? "␣" : tok}</span>
                      ))}
                    </div>
                  ) : st.bars ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {st.bars.map((b, k) => {
                        const top = k === 0;
                        return (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span style={{ fontFamily: MONO, fontSize: 12.5, flex: "0 0 62px", textAlign: "right", color: top ? "var(--fg)" : "var(--muted)", fontWeight: top ? 700 : 400 }}>{b.label}</span>
                            <div style={{ flex: 1, height: 18, background: "var(--bg)", borderRadius: 5, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(b.p * 100).toFixed(0)}%`, background: "var(--fg)", opacity: top ? 1 : 0.35, borderRadius: 5 }} />
                            </div>
                            <span style={{ fontFamily: MONO, fontSize: 12, flex: "0 0 40px", color: top ? "var(--fg)" : "var(--muted)" }}>{(b.p * 100).toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontFamily: MONO, fontSize: 13.5, lineHeight: 1.55, color: "var(--fg)", wordBreak: "break-word" }}>{st.after}</div>
                  )}
                </div>
              </div>
            </div>

            {/* the four depth panels */}
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 248px), 1fr))", gap: 12 }}>
              {[
                { c: life.labsCap, v: st.labs },
                { c: life.toolsCap, v: st.tools },
                { c: life.hardwareCap, v: st.hardware },
                { c: life.moneyCap, v: st.money },
              ].map((cell, k) => (
                <div key={k} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "16px 17px" }}>
                  {cap(cell.c)}
                  <p style={{ margin: "9px 0 0", fontSize: 14.5, lineHeight: 1.55, textWrap: "pretty" }}>{cell.v}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ---- Explain it back ---------------------------------------- */}
        <div style={{ marginTop: "clamp(36px, 4.4vw, 56px)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
          {cap(t.explainLabel)}
          <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, maxWidth: "54ch", textWrap: "balance" }}>{life.explainQ}</div>
          <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border" style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
            {answerOpen ? t.hide : t.reveal}
          </button>
          {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, maxWidth: "74ch", textWrap: "pretty", animation: "rise .16s ease both" }}>{life.explainA}</p>}
        </div>

        {/* ---- Go deeper ---------------------------------------------- */}
        <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)" }}>
          <button type="button" onClick={() => setDeeperOpen((v) => !v)} aria-expanded={deeperOpen} style={{ appearance: "none", border: 0, background: "transparent", font: "inherit", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, color: "var(--fg)", padding: 0 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: "-.03em" }}>{life.deeperTitle}</span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{deeperOpen ? "−" : "+"}</span>
          </button>
          {deeperOpen && <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.68, color: "var(--muted)", maxWidth: "68ch", textWrap: "pretty", animation: "rise .16s ease both" }}>{life.deeperBody}</p>}
        </div>

        {/* ---- Controls ----------------------------------------------- */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {t.backRoadmap}</Link>
            <Link href="/stage/1/tokens" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{life.nextWord} →</Link>
          </div>
          <button type="button" onClick={() => setDone((v) => !v)} aria-pressed={done} className="u-hover-opacity" style={{ appearance: "none", border: 0, font: "inherit", cursor: "pointer", fontSize: 15.5, fontWeight: 600, color: "var(--accent-ink)", background: "var(--fg)", padding: "13px 22px", borderRadius: 11 }}>
            {done ? t.completed : t.markComplete}
          </button>
        </div>
      </article>
    </div>
  );
}
