"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAcademy } from "../providers";
import {
  BACKBONE,
  LEVELS,
  STAGE_GLYPH,
  levelRank,
  pathCount,
  visibleAtDepth,
  type Level,
} from "../lib/backbone";
import { drawGlyph } from "../lib/glyphs";

const DISPLAY = "var(--font-space-grotesk),sans-serif";
const MONO = "var(--font-jetbrains-mono),monospace";

/** Level → accent for the small per-article depth chip. */
const LEVEL_INK: Record<Level, string> = {
  fundamentals: "var(--fg)",
  medium: "var(--muted)",
  expert: "var(--signal-fg)",
};

/** One d3 glyph mounted into an <svg>. Colour comes from CSS `color`. */
function Glyph({ name, size }: { name: string; size: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current) drawGlyph(ref.current, name);
  }, [name]);
  return <svg ref={ref} width={size} height={size} aria-hidden style={{ display: "block", flex: "0 0 auto" }} />;
}

/** Three tiny bars that fill up with the level's depth — the "how deep" glyph. */
function DepthMeter({ rank, active }: { rank: number; active: boolean }) {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "flex-end", height: 12 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4 + i * 4,
            borderRadius: 1,
            background:
              i <= rank
                ? active
                  ? "var(--signal)"
                  : "var(--fg)"
                : "var(--border)",
          }}
        />
      ))}
    </span>
  );
}

/**
 * The Stage-0 backbone: a scrollable pipeline spine (9 stations) with a "how
 * deep?" selector that reveals lessons cumulatively (Fundamentals → Medium →
 * Expert). Mobile-first — the spine is a vertical rail; a horizontal mini-map
 * of stations sits in the hero for quick jumps.
 */
export default function Backbone() {
  const { t } = useAcademy();
  const bb = t.backbone;

  const [depth, setDepth] = useState<Level>("fundamentals");
  const rank = levelRank(depth);
  const count = pathCount(depth);

  // Stick the depth selector directly under the (sticky, variable-height) header.
  const [hdr, setHdr] = useState(56);
  useEffect(() => {
    const el = document.querySelector("header");
    if (!el) return;
    const upd = () => setHdr(el.getBoundingClientRect().height);
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const anchorOffset = hdr + 92; // header + selector, for #st-<key> landings

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
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(34px, 4.5vw, 64px) 20px clamp(28px, 3.5vw, 44px)" }}>
          <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".14em", color: "var(--signal-fg)" }}>
            {bb.eyebrow}
          </div>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: "clamp(32px, 5.4vw, 66px)",
              fontWeight: 600,
              lineHeight: 1.0,
              letterSpacing: "-.045em",
              margin: "16px 0 0",
              maxWidth: "17ch",
              textWrap: "balance",
            }}
          >
            {bb.title}
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: "clamp(16px, 1.7vw, 20px)", lineHeight: 1.55, color: "var(--muted)", maxWidth: "58ch", textWrap: "pretty" }}>
            {bb.lede}
          </p>

          {/* Horizontal station mini-map — the backbone at a glance. */}
          <div
            aria-hidden
            style={{
              marginTop: "clamp(22px, 3vw, 34px)",
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 6,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
            }}
          >
            {BACKBONE.map((st, i) => {
              const s = bb.stations[st.key];
              return (
                <a
                  key={st.key}
                  href={`#st-${st.key}`}
                  className="u-hover-fg-border"
                  style={{
                    flex: "0 0 auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "8px 14px 8px 10px",
                    background: "var(--bg)",
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: "var(--signal-fg)", display: "flex" }}>
                    <Glyph name={STAGE_GLYPH[st.key]} size={18} />
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.t}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Sticky "how deep?" selector -------------------------------- */}
      <div
        style={{
          position: "sticky",
          top: hdr,
          zIndex: 40,
          background: "color-mix(in oklab, var(--bg) 88%, transparent)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--hair)",
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: "var(--muted)", whiteSpace: "nowrap" }}>
              {bb.depthLabel.toUpperCase()}
            </span>
            <div
              role="tablist"
              aria-label={bb.depthLabel}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 6,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 4,
                flex: "1 1 260px",
              }}
            >
              {LEVELS.map((lvl) => {
                const active = lvl === depth;
                const lv = bb.levels[lvl];
                return (
                  <button
                    key={lvl}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setDepth(lvl)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                      padding: "8px 6px",
                      borderRadius: 9,
                      border: active ? "1px solid var(--signal)" : "1px solid transparent",
                      background: active ? "var(--signal-wash)" : "transparent",
                      color: "var(--fg)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 600, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>
                      {lv.t}
                    </span>
                    <DepthMeter rank={levelRank(lvl)} active={active} />
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, color: "var(--fg)", fontSize: 16 }}>{count}</span>{" "}
            {bb.pathWord}
          </div>
        </div>
        {/* One-line meaning of the chosen depth. */}
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px 11px" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, textWrap: "pretty" }}>
            <span style={{ color: LEVEL_INK[depth], fontWeight: 600 }}>{bb.levels[depth].t}</span>
            {" — "}
            {bb.levels[depth].d}
          </p>
        </div>
      </div>

      {/* ---- The spine -------------------------------------------------- */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(24px, 3.5vw, 44px) 20px 8px" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {BACKBONE.map((st, i) => {
            const s = bb.stations[st.key];
            const visible = visibleAtDepth(st, depth);
            const hasLive = st.articles.some((a) => a.href);
            const num = String(i + 1).padStart(2, "0");
            const last = i === BACKBONE.length - 1;

            return (
              <div
                key={st.key}
                id={`st-${st.key}`}
                style={{
                  scrollMarginTop: anchorOffset,
                  display: "grid",
                  gridTemplateColumns: "clamp(38px, 8vw, 52px) 1fr",
                  columnGap: "clamp(12px, 2.4vw, 24px)",
                }}
              >
                {/* Rail: numbered node + connector line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: "clamp(38px, 8vw, 46px)",
                      aspectRatio: "1",
                      borderRadius: 14,
                      border: `1px solid ${hasLive ? "var(--signal)" : "var(--border)"}`,
                      background: "var(--bg)",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: DISPLAY,
                      fontSize: "clamp(14px, 3vw, 16px)",
                      fontWeight: 600,
                      flex: "0 0 auto",
                      position: "relative",
                    }}
                  >
                    {num}
                    {hasLive && (
                      <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "var(--signal)", border: "2px solid var(--bg)" }} />
                    )}
                  </div>
                  {!last && <div style={{ flex: "1 1 auto", width: 1, background: "var(--hair)", minHeight: 20 }} />}
                </div>

                {/* Station card */}
                <div style={{ paddingBottom: "clamp(20px, 2.6vw, 30px)", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    {/* Stage identity glyph */}
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: hasLive ? "var(--signal-fg)" : "var(--fg)",
                        display: "grid",
                        placeItems: "center",
                        flex: "0 0 auto",
                      }}
                    >
                      <Glyph name={STAGE_GLYPH[st.key]} size={26} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(20px, 2.6vw, 27px)", fontWeight: 600, letterSpacing: "-.035em", lineHeight: 1.1, margin: 0 }}>
                          {s.t}
                        </h2>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>
                          {visible.length} / {st.articles.length}
                        </span>
                      </div>
                      <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 14.5, lineHeight: 1.5, textWrap: "pretty" }}>
                        {s.d}
                      </p>
                    </div>
                  </div>

                  {/* Article list, filtered by depth */}
                  <div style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 16, background: "var(--bg)", overflow: "hidden" }}>
                    {visible.map((a, j) => {
                      const art = bb.articles[a.key];
                      const initial = bb.levels[a.level].t.charAt(0).toUpperCase();
                      const inner = (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "auto 1fr auto",
                            alignItems: "start",
                            gap: "10px 12px",
                            padding: "13px 14px",
                            borderTop: j === 0 ? "none" : "1px solid var(--hair)",
                          }}
                        >
                          {/* topic glyph + level letter (non-colour depth cue) */}
                          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: "0 0 auto", marginTop: 1 }}>
                            <span
                              title={bb.levels[a.level].t}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: `1px solid ${a.level === "expert" ? "var(--signal)" : "var(--border)"}`,
                                background: a.level === "expert" ? "var(--signal-wash)" : "var(--surface)",
                                color: LEVEL_INK[a.level],
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              <Glyph name={a.motif} size={18} />
                            </span>
                            <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: ".04em", color: LEVEL_INK[a.level] }}>
                              {initial}
                            </span>
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <span
                              className={a.href ? "u-hover-muted" : undefined}
                              style={{ display: "block", fontSize: 15.5, fontWeight: 600, lineHeight: 1.3, color: a.href ? "var(--fg)" : "var(--muted)" }}
                            >
                              {art.t}
                            </span>
                            <span style={{ display: "block", marginTop: 3, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.45, textWrap: "pretty" }}>
                              {art.d}
                            </span>
                          </span>
                          {/* status */}
                          {a.href ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--signal-fg)", whiteSpace: "nowrap", marginTop: 2 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--signal)" }} />
                              {bb.liveWord}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap", marginTop: 2 }}>
                              {bb.comingSoon}
                            </span>
                          )}
                        </div>
                      );

                      return a.href ? (
                        <Link key={a.key} href={a.href} className="u-hover-surface" style={{ display: "block" }}>
                          {inner}
                        </Link>
                      ) : (
                        <div key={a.key}>{inner}</div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
