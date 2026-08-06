"use client";

import Link from "next/link";
import { useAcademy } from "../providers";

const MONO = "var(--font-jetbrains-mono),monospace";
const DISPLAY = "var(--font-space-grotesk),sans-serif";
const LESSON_HREF = "/stage/1/life-of-an-llm";

/**
 * Deterministic decorative lattice for the hero: filled cells cluster toward the
 * top-left ("what you already understand"), the rest stay empty ("what stays
 * magic"). Deterministic so it renders identically on server and client.
 */
function buildLattice() {
  return Array.from({ length: 96 }, (_, i) => {
    const col = i % 16;
    const row = Math.floor(i / 16);
    const filled = ((col * 7 + row * 11) % 23) < 9 && !(col > 11 && row > 3);
    return filled;
  });
}

export default function Home() {
  const { t } = useAcademy();
  const lattice = buildLattice();
  const filledCount = lattice.filter(Boolean).length;

  return (
    <>
      {/* ---- Hero ------------------------------------------------------- */}
      <section
        style={{
          backgroundImage: "radial-gradient(var(--dot) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          backgroundPosition: "-1px -1px",
          borderBottom: "1px solid var(--hair)",
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "clamp(40px, 5vw, 76px) 32px clamp(44px, 5.5vw, 80px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "clamp(36px, 5vw, 72px)",
            alignItems: "end",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                fontSize: 13,
                fontWeight: 500,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "7px 14px 7px 10px",
                borderRadius: 999,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fg)" }} />
              {t.badge}
            </div>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(42px, 6.2vw, 86px)",
                fontWeight: 600,
                lineHeight: 0.96,
                letterSpacing: "-.05em",
                margin: "24px 0 0",
                maxWidth: "16ch",
                textWrap: "balance",
              }}
            >
              {t.heroTitle}
            </h1>
            <p
              style={{
                margin: "22px 0 0",
                fontSize: "clamp(17px, 1.8vw, 21px)",
                lineHeight: 1.55,
                color: "var(--muted)",
                maxWidth: "52ch",
                textWrap: "pretty",
              }}
            >
              {t.heroSub}
            </p>
            <div className="hero-cta" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 32 }}>
              <Link
                href={LESSON_HREF}
                className="u-hover-opacity"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--accent-ink)",
                  background: "var(--fg)",
                  padding: "15px 24px",
                  borderRadius: 12,
                }}
              >
                {t.ctaStart}
              </Link>
              <a
                href="#paths"
                className="u-hover-fg-border"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  padding: "15px 24px",
                  borderRadius: 12,
                }}
              >
                {t.ctaPaths}
              </a>
            </div>
          </div>

          {/* "black box, opened" graphic */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 22,
              background: "var(--bg)",
              padding: "clamp(22px, 2.6vw, 30px)",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>
                {t.graphicLabel}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>
                {filledCount} / {lattice.length} {t.graphicMetaWord}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: 5 }}>
              {lattice.map((filled, i) => (
                <span
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 2,
                    background: filled ? "var(--fg)" : "var(--surface)",
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid var(--hair)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--fg)", flex: "0 0 auto" }} />
                <span style={{ fontSize: 14.5, color: "var(--muted)" }}>{t.legend1}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid var(--hair)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--surface)", border: "1px solid var(--border)", flex: "0 0 auto" }} />
                <span style={{ fontSize: 14.5, color: "var(--muted)" }}>{t.legend2}</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, textWrap: "pretty" }}>{t.whyLede}</p>
          </div>
        </div>
      </section>

      {/* ---- Roadmap ---------------------------------------------------- */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(52px, 6.5vw, 92px) 32px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".14em", color: "var(--muted)" }}>
              {t.roadmapLabel}
            </div>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(30px, 3.8vw, 50px)",
                fontWeight: 600,
                letterSpacing: "-.04em",
                lineHeight: 1.02,
                margin: "16px 0 0",
                maxWidth: "22ch",
                textWrap: "balance",
              }}
            >
              {t.roadmapTitle}
            </h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 16.5, lineHeight: 1.6, maxWidth: "38ch", textWrap: "pretty" }}>
            {t.roadmapSub}
          </p>
        </div>

        <div style={{ marginTop: "clamp(32px, 4vw, 52px)", display: "flex", flexDirection: "column" }}>
          {t.stages.map((stage, i) => {
            const num = String(i + 1).padStart(2, "0");
            const action = stage.pct > 0 ? t.review : i === 0 ? t.start : t.locked;
            const actionable = i === 0;
            const card = (
              <div
                className="u-card"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  background: "var(--bg)",
                  padding: "clamp(20px, 2.4vw, 28px)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                  gap: "14px 32px",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontFamily: DISPLAY, fontSize: "clamp(21px, 2.2vw, 27px)", fontWeight: 600, letterSpacing: "-.035em", lineHeight: 1.1 }}>
                    {stage.title}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 15.5, lineHeight: 1.55, marginTop: 7, maxWidth: "46ch", textWrap: "pretty" }}>
                    {stage.desc}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "clamp(14px, 2vw, 26px)", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: "var(--muted)" }}>
                      {stage.lessons} {t.lessonsWord}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 8 }}>
                      <span style={{ width: 64, height: 4, borderRadius: 99, background: "var(--hair)", overflow: "hidden", display: "block" }}>
                        <span style={{ display: "block", height: "100%", background: "var(--fg)", width: `${stage.pct}%` }} />
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 11.5, color: "var(--muted)" }}>{stage.pct}%</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "11px 17px", borderRadius: 11, whiteSpace: "nowrap" }}>
                    {action}
                  </span>
                </div>
              </div>
            );

            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "56px 1fr", columnGap: "clamp(16px, 2.4vw, 28px)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg)", display: "grid", placeItems: "center", fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, flex: "0 0 auto" }}>
                    {num}
                  </div>
                  {i < t.stages.length - 1 && <div style={{ flex: "1 1 auto", width: 1, background: "var(--hair)", minHeight: 24 }} />}
                </div>
                <div style={{ paddingBottom: "clamp(18px, 2.2vw, 26px)" }}>
                  {actionable ? (
                    <Link href={LESSON_HREF} style={{ display: "block" }}>
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- How it works ---------------------------------------------- */}
      <section style={{ background: "var(--band)", color: "var(--band-fg)", marginTop: "clamp(52px, 6.5vw, 92px)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(52px, 6.5vw, 88px) 32px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".14em", color: "var(--band-muted)" }}>
            {t.howLabel}
          </div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 3.6vw, 46px)", fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.04, margin: "16px 0 0", maxWidth: "24ch", textWrap: "balance" }}>
            {t.howTitle}
          </h2>
          <div style={{ marginTop: "clamp(34px, 4vw, 56px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", columnGap: 44, rowGap: 6 }}>
            {[
              [t.how1, t.how1d],
              [t.how2, t.how2d],
              [t.how3, t.how3d],
              [t.how4, t.how4d],
            ].map(([title, desc], i) => (
              <div key={i} style={{ padding: "24px 0 28px", borderTop: "1px solid var(--band-hair)" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, letterSpacing: "-.03em" }}>{title}</div>
                <p style={{ margin: "9px 0 0", color: "var(--band-muted)", fontSize: 15.5, lineHeight: 1.6, textWrap: "pretty" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Two paths -------------------------------------------------- */}
      <section id="paths" style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(52px, 6.5vw, 92px) 32px 0", scrollMarginTop: 96 }}>
        <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".14em", color: "var(--muted)" }}>{t.pathsLabel}</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(30px, 3.8vw, 50px)", fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.02, margin: "16px 0 0", maxWidth: "20ch", textWrap: "balance" }}>
          {t.pathsTitle}
        </h2>
        <div style={{ marginTop: "clamp(28px, 3.5vw, 44px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16 }}>
          {[
            { route: t.path1Route, title: t.path1, desc: t.path1d, cta: t.path1cta },
            { route: t.path2Route, title: t.path2, desc: t.path2d, cta: t.path2cta },
          ].map((p, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(24px, 3vw, 34px)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{p.route}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: "clamp(22px, 2.4vw, 29px)", fontWeight: 600, letterSpacing: "-.035em", lineHeight: 1.08 }}>{p.title}</div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 15.5, lineHeight: 1.6, textWrap: "pretty" }}>{p.desc}</p>
              <Link href={LESSON_HREF} className="u-hover-muted" style={{ marginTop: "auto", paddingTop: 10, fontSize: 15.5, fontWeight: 600, color: "var(--fg)" }}>
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
