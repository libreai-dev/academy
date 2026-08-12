"use client";

import Link from "next/link";
import { C, MONO, MAXW, PAGE_PAD, PROFILE } from "../lib/site";

/** Editorial site footer — contact line + external links. Light-only. */
export default function Footer() {
  const links: [string, string][] = [
    ["GitHub", PROFILE.github],
    ["LinkedIn", PROFILE.linkedin],
    ["CV (PDF)", PROFILE.cv],
    ["RSS", "/rss.xml"],
  ];
  return (
    <footer style={{ borderTop: `1px solid ${C.hair}`, background: C.bg }}>
      <div
        style={{
          maxWidth: MAXW,
          margin: "0 auto",
          padding: "40px clamp(20px, 5vw, 56px) 56px",
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, color: C.faint }}>
          © {PROFILE.name} · {PROFILE.location}
        </span>
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: C.faint,
          }}
        >
          {links.map(([label, href]) =>
            href.startsWith("/") ? (
              <Link key={label} href={href} className="x-hoverink">
                {label}
              </Link>
            ) : (
              <a key={label} href={href} className="x-hoverink">
                {label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
