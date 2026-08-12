"use client";

/* ===========================================================================
   The "you are here" pipeline map — the navigational glue shared by both
   Data Pipeline articles. Two pieces:

   - <PipelineMap>   the hero overview: four numbered station cards, in order,
                     each an anchor link to its station section.
   - <StationHeader> a full-width divider that opens each station, with a compact
                     4-segment rail that highlights the current station ("you are
                     here") and links back to the other stations.

   Pure chrome (numbered nav cards + a progress rail), so it's plain flex/grid +
   design tokens — not a d3 data-visualisation. Colour only via tokens; works in
   both themes and from ~360px up. Matches the mono/display type of the lessons.
   =========================================================================== */

import { MONO, DISPLAY, rich } from "./lesson-kit";
import type { StationCopy } from "../lib/copy/pipeline-shell";

const num = (i: number) => String(i + 1).padStart(2, "0");

/** Hero overview map: the four stations as ordered, linkable cards. */
export function PipelineMap({ stations, mapLabel }: { stations: StationCopy[]; mapLabel: string }) {
  return (
    <nav aria-label={mapLabel} style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--signal-fg)" }}>{mapLabel}</div>
      <ol
        style={{
          listStyle: "none",
          margin: "14px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 168px), 1fr))",
          gap: 10,
        }}
      >
        {stations.map((s, i) => (
          <li key={s.key} style={{ display: "flex" }}>
            <a
              href={`#station-${s.key}`}
              className="u-hover-fg-border"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                width: "100%",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "14px 15px",
                background: "var(--bg)",
                color: "var(--fg)",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: "var(--signal-fg)", fontWeight: 700 }}>{num(i)}</span>
                <span aria-hidden style={{ flex: 1, height: 1, background: "var(--hair)" }} />
                {i < stations.length - 1 && (
                  <span aria-hidden style={{ fontFamily: MONO, fontSize: 13, color: "var(--muted)" }}>→</span>
                )}
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".12em", color: "var(--muted)" }}>{s.label}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.2 }}>{s.title}</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--muted)", textWrap: "pretty" }}>{rich(s.blurb)}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The compact 4-segment progress rail — highlights the active station. */
function ProgressRail({ stations, activeKey }: { stations: StationCopy[]; activeKey: string }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: 6, flexWrap: "wrap" }}>
      {stations.map((s, i) => {
        const active = s.key === activeKey;
        return (
          <li key={s.key} style={{ flex: "1 1 auto", minWidth: 0 }}>
            <a
              href={`#station-${s.key}`}
              aria-current={active ? "step" : undefined}
              className="u-hover-fg-border"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 9px",
                borderRadius: 9,
                border: `1px solid ${active ? "var(--signal)" : "var(--border)"}`,
                background: active ? "var(--signal-wash)" : "transparent",
                color: active ? "var(--fg)" : "var(--muted)",
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".08em",
                textDecoration: "none",
                overflow: "hidden",
              }}
            >
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", flex: "0 0 auto", background: active ? "var(--signal)" : "var(--border)" }} />
              <span style={{ fontWeight: active ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {num(i)} {s.label}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * A station divider — anchored so the hero map + rail can link to it. Renders
 * "STATION n · LABEL", the station title, the blurb, and the progress rail with
 * this station marked "you are here".
 */
export function StationHeader({
  stations,
  activeKey,
  stationLabel,
}: {
  stations: StationCopy[];
  activeKey: string;
  /** Localised word for "STATION" (e.g. "ESTACIÓN"). */
  stationLabel: string;
}) {
  const i = stations.findIndex((s) => s.key === activeKey);
  const s = stations[i] ?? stations[0];
  return (
    <section id={`station-${activeKey}`} aria-label={s.title} style={{ maxWidth: 760, margin: "0 auto", scrollMarginTop: 80 }}>
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "clamp(22px, 3vw, 32px)" }}>
        <ProgressRail stations={stations} activeKey={activeKey} />
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--signal-fg)", marginTop: 20 }}>
          {stationLabel} {num(i)} · {s.label}
        </div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px, 4.4vw, 40px)", fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.05, margin: "10px 0 0", textWrap: "balance" }}>
          {s.title}
        </h2>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 18px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{rich(s.blurb)}</p>
      </div>
    </section>
  );
}
