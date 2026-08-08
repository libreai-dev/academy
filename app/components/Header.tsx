"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAcademy } from "../providers";
import { GITHUB_URL, OVERALL_PROGRESS } from "../lib/copy";

/**
 * Sticky global header shared by the roadmap and every lesson: back-link to the
 * umbrella site, the Academy wordmark (→ roadmap), an overall progress meter,
 * the working EN/ES language dropdown, GitHub, and the light/dark toggle.
 */
export default function Header() {
  const { theme, lang, t, toggleTheme, setLang } = useAcademy();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close the language menu on outside click / Escape.
  useEffect(() => {
    if (!langOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLangOpen(false);
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  const mono = "var(--font-jetbrains-mono),monospace";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        backdropFilter: "blur(18px)",
        background: "color-mix(in oklab, var(--bg) 78%, transparent)",
        borderBottom: "1px solid var(--hair)",
      }}
    >
      <nav
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {/* Wordmark: "libreai" → the umbrella site, "Academy" → the roadmap. */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginRight: 16 }}>
          <a
            href="https://www.libreai.dev"
            aria-label="libreai.dev"
            className="u-hover-muted"
            style={{ display: "flex", alignItems: "center", gap: 9 }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                border: "2px solid var(--fg)",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--fg)" }} />
            </span>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk),sans-serif",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "-.035em",
              }}
            >
              libreai
            </span>
          </a>
          <Link
            href="/"
            aria-label="Academy home"
            className="u-hover-muted"
            style={{
              fontFamily: "var(--font-space-grotesk),sans-serif",
              fontWeight: 500,
              fontSize: 17,
              letterSpacing: "-.035em",
              color: "var(--muted)",
            }}
          >
            Academy
          </Link>
        </div>

        <span style={{ flex: "1 1 20px" }} />

        <div
          className="nav-progress"
          style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}
        >
          <span
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: ".1em",
              color: "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            {OVERALL_PROGRESS}% {t.progress}
          </span>
          <span
            style={{
              width: 76,
              height: 4,
              borderRadius: 99,
              background: "var(--hair)",
              overflow: "hidden",
              display: "block",
            }}
          >
            <span
              style={{
                display: "block",
                height: "100%",
                background: "var(--fg)",
                width: `${OVERALL_PROGRESS}%`,
              }}
            />
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <div ref={langRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={langOpen}
            aria-label="Language"
            className="u-hover-fg-border"
            style={{
              appearance: "none",
              border: "1px solid var(--border)",
              font: "inherit",
              fontFamily: mono,
              fontSize: 12,
              letterSpacing: ".08em",
              color: "var(--fg)",
              background: "var(--bg)",
              padding: "9px 12px",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {lang === "en" ? "EN" : "ES"}
            <span style={{ fontSize: 9, color: "var(--muted)" }}>▾</span>
          </button>
          {langOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 9px)",
                right: 0,
                width: 186,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 6,
                boxShadow: "0 22px 50px rgba(10,10,9,.10)",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                animation: "rise .14s ease both",
                zIndex: 70,
              }}
            >
              {(["en", "es"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={lang === code}
                  onClick={() => {
                    setLang(code);
                    setLangOpen(false);
                  }}
                  className="u-hover-surface"
                  style={{
                    appearance: "none",
                    border: 0,
                    background: "transparent",
                    font: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "var(--fg)",
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 14.5,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  {code === "en" ? "English" : "Español"}
                  <span style={{ color: "var(--muted)" }}>{lang === code ? "✓" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <a
          href={GITHUB_URL}
          aria-label="GitHub"
          title="GitHub"
          className="u-icon-link"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://cdn.simpleicons.org/github/6C6C67" alt="" width={18} height={18} />
        </a>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle light and dark mode"
          title="Toggle light and dark mode"
          className="u-hover-fg-border"
          style={{
            appearance: "none",
            cursor: "pointer",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted)",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
          }}
        >
          <span>{theme === "light" ? "☾" : "☀"}</span>
        </button>
        </div>
      </nav>
    </header>
  );
}
