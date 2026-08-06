"use client";

import Link from "next/link";
import { useAcademy } from "../providers";
import { STAGE1_ROUTES } from "../lib/stage1";

const MONO = "var(--font-jetbrains-mono),monospace";
const DISPLAY = "var(--font-space-grotesk),sans-serif";

/**
 * The shared Stage 1 left rail. `current` is the lesson's index into
 * `stage1List` — earlier lessons show a ✓, the current one an arrow, later ones
 * their number. Built lessons (per STAGE1_ROUTES) become links so the whole
 * stage is navigable; unbuilt ones stay plain text.
 */
export default function LessonRail({ current }: { current: number }) {
  const { t } = useAcademy();
  return (
    <aside className="lesson-rail" style={{ flex: "0 1 252px", minWidth: 220, position: "sticky", top: 86 }}>
      <Link href="/" className="u-hover-muted" style={{ color: "var(--muted)", fontSize: 13.5 }}>
        ← {t.backRoadmap}
      </Link>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)", marginTop: 22 }}>
        {t.stage1Label}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 600, letterSpacing: "-.03em", marginTop: 8 }}>
        {t.stage1Title}
      </div>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column" }}>
        {t.stage1List.map((title, i) => {
          const isCurrent = i === current;
          const tick = i < current ? "✓" : isCurrent ? "→" : String(i + 1).padStart(2, "0");
          const route = STAGE1_ROUTES[i];
          const row = (
            <div
              aria-current={isCurrent ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 8px",
                margin: "0 -8px",
                borderRadius: 8,
                borderTop: "1px solid var(--hair)",
                fontSize: 14.5,
                color: isCurrent ? "var(--fg)" : "var(--muted)",
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)", flex: "0 0 16px" }}>{tick}</span>
              <span style={{ fontWeight: isCurrent ? 600 : 400 }}>{title}</span>
            </div>
          );
          return route && !isCurrent ? (
            <Link key={i} href={route} className="u-hover-surface" style={{ display: "block", color: "inherit" }}>
              {row}
            </Link>
          ) : (
            <div key={i}>{row}</div>
          );
        })}
      </div>
    </aside>
  );
}
