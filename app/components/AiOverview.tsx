"use client";

import { useState } from "react";
import { C, MONO, SANS } from "../lib/site";
import {
  type OverviewResult,
  type Block,
  type Source,
  groundedness,
  publisherHue,
} from "../lib/ai-overviews";

/**
 * The AI-Overview widget — a visual replica of an "AI Mode" answer surface (the
 * top tabs and search bar are decorative), wrapped in a small teaching control
 * strip. Answer citation chips and source cards highlight each other, and a
 * Retrieval toggle shows the same model with no sources (confident, uncited,
 * wrong). Shared by the blog post (deterministic) and the `open-overview` repo.
 */

const G = {
  text: "#1f1f1f",
  sec: "#5f6368",
  border: "#dadce0",
  line: "#ececef",
  bubble: "#f0f1f3",
  hover: "#f1f3f4",
  accent: "#1a73e8",
  accentWash: "#e8f0fe",
  bg: "#ffffff",
};

export default function AiOverview({ data }: { data: OverviewResult }) {
  const [retrieval, setRetrieval] = useState(true);
  const [hoverBlock, setHoverBlock] = useState<number | null>(null);
  const [hoverSource, setHoverSource] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const blocks = retrieval ? data.answer : data.ungrounded;
  const score = retrieval ? groundedness(data.answer) : 0;
  const byId = (id: string) => data.sources.find((s) => s.id === id);

  const activeSources = new Set<string>(
    hoverBlock != null ? blocks[hoverBlock]?.cites ?? [] : hoverSource ? [hoverSource] : [],
  );
  const blockActive = (i: number) =>
    hoverBlock === i || (hoverSource != null && (blocks[i]?.cites.includes(hoverSource) ?? false));

  const visibleSources = showAll ? data.sources : data.sources.slice(0, 3);

  return (
    <div style={{ fontFamily: SANS, border: `1px solid ${C.hair}`, borderRadius: 14, overflow: "hidden", background: C.bg }}>
      {/* ── teaching control strip (this is the blog's, not the replica's) ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "9px 14px",
          background: C.wash,
          borderBottom: `1px solid ${C.hair}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ghost }}>
            Demo controls
          </span>
          <Toggle on={retrieval} onChange={setRetrieval} />
        </div>
        <Meter score={score} />
      </div>

      {/* ── replicated AI Mode surface (chrome below is decorative) ── */}
      <div style={{ background: G.bg, color: G.text }}>
        <Tabs />

        <div style={{ padding: "18px clamp(14px, 3vw, 26px) 6px" }}>
          <div className="aio-grid" style={{ display: "grid", gap: "0 clamp(20px, 4vw, 44px)" }}>
            {/* answer column (the query bubble lives here, above the answer, so
                it never sits over the sources sidebar) */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "80%", background: G.bubble, borderRadius: 20, padding: "12px 18px", fontSize: 16, lineHeight: 1.4 }}>
                  {data.query}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: G.sec, margin: "6px 2px 18px" }}>7:54 PM</div>

              {!retrieval && (
                <div role="status" style={{ display: "flex", gap: 7, alignItems: "baseline", marginBottom: 16, fontSize: 13, color: "#b3261e" }}>
                  <span aria-hidden>⚠</span>
                  <span><strong style={{ fontWeight: 600 }}>No retrieval</strong> — answering from training data (frozen ~2024), so it misses anything newer.</span>
                </div>
              )}

              {blocks.map((b, i) => (
                <AnswerBlock
                  key={i}
                  block={b}
                  source={b.cites[0] ? byId(b.cites[0]) : undefined}
                  extra={Math.max(0, b.cites.length - 1)}
                  active={blockActive(i)}
                  onEnter={() => setHoverBlock(i)}
                  onLeave={() => setHoverBlock(null)}
                  onCiteEnter={() => setHoverBlock(i)}
                />
              ))}
            </div>

            {/* sources card */}
            <aside className="aio-side" style={{ minWidth: 0 }}>
              <div style={{ border: `1px solid ${G.border}`, borderRadius: 24, padding: "8px 8px 12px" }}>
                {retrieval ? (
                  <>
                    {visibleSources.map((s, i) => (
                      <SourceRow
                        key={s.id}
                        source={s}
                        divider={i > 0}
                        active={activeSources.has(s.id)}
                        onEnter={() => setHoverSource(s.id)}
                        onLeave={() => setHoverSource(null)}
                      />
                    ))}
                    {data.sources.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAll((v) => !v)}
                        style={{
                          display: "block",
                          width: "calc(100% - 16px)",
                          margin: "8px auto 4px",
                          padding: "10px 16px",
                          border: 0,
                          borderRadius: 999,
                          background: G.hover,
                          color: G.text,
                          font: "inherit",
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        {showAll ? "Show less" : "Show all"}
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ padding: "26px 18px", textAlign: "center", color: G.sec, fontSize: 13.5, lineHeight: 1.6 }}>
                    <div aria-hidden style={{ fontSize: 20, opacity: 0.5, marginBottom: 6 }}>◌</div>
                    Nothing retrieved. The model can only draw on what it saw in
                    training — it has no way to know what has changed since.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        <AskBar />
      </div>

      <style>{`
        .aio-grid { grid-template-columns: minmax(0, 1fr); }
        .aio-side { margin-top: 20px; }
        @media (min-width: 820px) {
          .aio-grid { grid-template-columns: minmax(0, 1fr) 340px; }
          .aio-side { margin-top: 0; }
        }
      `}</style>
    </div>
  );
}

// ── answer block (paragraph / heading / bullet) ────────────────────────────
function AnswerBlock({
  block,
  source,
  extra,
  active,
  onEnter,
  onLeave,
  onCiteEnter,
}: {
  block: Block;
  source?: Source;
  extra: number;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onCiteEnter: () => void;
}) {
  if (block.kind === "heading") {
    return (
      <h3 style={{ margin: "26px 0 12px", fontSize: "clamp(19px, 2.2vw, 23px)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3, color: G.text }}>
        {block.text}
      </h3>
    );
  }

  const cite = source ? (
    <Cite source={source} extra={extra} active={active} onEnter={onCiteEnter} onLeave={onLeave} />
  ) : null;

  const body = (
    <>
      {block.lead && <strong style={{ fontWeight: 600 }}>{block.lead}</strong>}
      {block.lead && block.text ? " " : ""}
      {block.text}
      {cite}
    </>
  );

  const hl = {
    background: active ? G.accentWash : "transparent",
    borderRadius: 6,
    transition: "background 0.12s ease",
  } as const;

  if (block.kind === "bullet") {
    return (
      <div
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{ display: "flex", gap: 12, padding: "6px 8px", margin: "0 -8px", ...hl }}
      >
        <span aria-hidden style={{ color: G.sec, lineHeight: 1.7, flex: "0 0 auto" }}>•</span>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: G.text }}>{body}</p>
      </div>
    );
  }
  // para (bold summary line)
  return (
    <p
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ margin: "0 -8px 10px", padding: "6px 8px", fontSize: 16, lineHeight: 1.7, color: G.text, ...hl }}
    >
      {body}
    </p>
  );
}

// ── citation chip: favicon + publisher + "+N" ──────────────────────────────
function Cite({
  source,
  extra,
  active,
  onEnter,
  onLeave,
}: {
  source: Source;
  extra: number;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      aria-label={`Source: ${source.publisher}${extra ? ` and ${extra} more` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        verticalAlign: "middle",
        margin: "0 0 0 6px",
        padding: "2px 8px 2px 5px",
        borderRadius: 999,
        border: `1px solid ${active ? G.accent : G.border}`,
        background: active ? G.accentWash : G.bg,
        font: "inherit",
        fontSize: 12.5,
        color: G.sec,
        cursor: "pointer",
        maxWidth: 190,
        whiteSpace: "nowrap",
        transition: "border-color 0.12s ease, background 0.12s ease",
      }}
    >
      <Favicon source={source} size={15} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{source.publisher}</span>
      {extra > 0 && <span style={{ color: G.sec }}>+{extra}</span>}
    </button>
  );
}

// ── one source card row ────────────────────────────────────────────────────
function SourceRow({
  source,
  divider,
  active,
  onEnter,
  onLeave,
}: {
  source: Source;
  divider: boolean;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const hue = publisherHue(source.publisher);
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      style={{
        display: "block",
        padding: "12px 12px",
        borderRadius: 18,
        borderTop: divider ? `1px solid ${G.line}` : "none",
        background: active ? G.accentWash : "transparent",
        transition: "background 0.12s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Favicon source={source} size={18} round />
        <span style={{ fontSize: 13, color: G.sec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {source.publisher}
        </span>
        <span aria-hidden style={{ marginLeft: "auto", color: G.sec, fontSize: 16, lineHeight: 1 }}>⋮</span>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 7 }}>
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.35, color: G.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {source.title}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.45, color: G.sec, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {source.snippet}
          </div>
        </div>
        <div
          aria-hidden
          style={{
            flex: "0 0 auto",
            width: 72,
            height: 72,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 600,
            fontSize: 20,
            background: `linear-gradient(135deg, hsl(${hue} 55% 58%), hsl(${(hue + 40) % 360} 50% 42%))`,
          }}
        >
          {source.publisher[0]}
        </div>
      </div>
    </a>
  );
}

function Favicon({ source, size, round }: { source: Source; size: number; round?: boolean }) {
  const hue = publisherHue(source.publisher);
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        flex: "0 0 auto",
        borderRadius: round ? "50%" : 4,
        display: "grid",
        placeItems: "center",
        fontFamily: MONO,
        fontSize: size * 0.62,
        fontWeight: 700,
        color: "#fff",
        background: `hsl(${hue} 48% 46%)`,
      }}
    >
      {source.publisher[0]}
    </span>
  );
}

// ── decorative chrome (non-interactive) ────────────────────────────────────
function Tabs() {
  const tabs = ["AI Mode", "All", "Images", "Videos", "News", "More ▾"];
  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        gap: 26,
        padding: "0 clamp(14px, 3vw, 26px)",
        borderBottom: `1px solid ${G.line}`,
        overflowX: "auto",
        userSelect: "none",
      }}
    >
      {tabs.map((t, i) => (
        <span
          key={t}
          style={{
            padding: "14px 0",
            fontSize: 14,
            whiteSpace: "nowrap",
            color: i === 0 ? G.text : G.sec,
            fontWeight: i === 0 ? 600 : 400,
            borderBottom: i === 0 ? `3px solid ${G.text}` : "3px solid transparent",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function AskBar() {
  return (
    <div style={{ padding: "10px clamp(14px, 3vw, 26px) 18px" }}>
      <div
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          border: `1px solid ${G.border}`,
          borderRadius: 28,
          padding: "12px 18px",
          color: G.sec,
          userSelect: "none",
        }}
      >
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: G.hover, display: "grid", placeItems: "center", fontSize: 18, flex: "0 0 auto" }}>+</span>
        <span style={{ flex: "1 1 auto", fontSize: 15 }}>Ask anything</span>
        <span style={{ fontSize: 16, flex: "0 0 auto" }}>🎤</span>
      </div>
    </div>
  );
}

// ── teaching controls ──────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint }}>
        Retrieval
      </span>
      <div style={{ display: "flex", border: `1px solid ${C.chip}`, borderRadius: 8, overflow: "hidden" }}>
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={on === v}
            style={{
              font: "inherit",
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.04em",
              padding: "5px 10px",
              cursor: "pointer",
              border: 0,
              background: on === v ? C.ink : C.bg,
              color: on === v ? C.bg : C.faint,
              transition: "all 0.12s ease",
            }}
          >
            {v ? "On" : "Off"}
          </button>
        ))}
      </div>
    </div>
  );
}

function Meter({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const warn = pct === 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }} title="Share of answer claims backed by a source">
      <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint }}>
        Grounded
      </span>
      <span style={{ width: 56, height: 5, borderRadius: 99, background: C.hair, overflow: "hidden", display: "block" }}>
        <span style={{ display: "block", height: "100%", width: `${pct}%`, background: warn ? "#b3261e" : C.ink, transition: "width 0.2s ease" }} />
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: warn ? "#b3261e" : C.ink, minWidth: 30 }}>{pct}%</span>
    </div>
  );
}
