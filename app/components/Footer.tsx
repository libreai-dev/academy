"use client";

import { useAcademy } from "../providers";
import { GITHUB_URL } from "../lib/copy";

/** Shared footer: back to the umbrella site, contribute, and contact links. */
export default function Footer() {
  const { t } = useAcademy();
  return (
    <footer style={{ marginTop: "clamp(48px, 6vw, 88px)", borderTop: "1px solid var(--hair)" }}>
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "32px 32px 46px",
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, color: "var(--muted)" }}>{t.footer}</span>
        <span style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14 }}>
          <a href="https://libreai.dev" className="u-hover-muted" style={{ color: "var(--muted)" }}>
            libreai.dev
          </a>
          <a href={GITHUB_URL} className="u-hover-muted" style={{ color: "var(--muted)" }}>
            {t.contribute}
          </a>
          <a
            href="https://libreai.dev/contact"
            className="u-hover-muted"
            style={{ color: "var(--muted)" }}
          >
            {t.contact}
          </a>
        </span>
      </div>
    </footer>
  );
}
