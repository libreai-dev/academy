"use client";

import Link from "next/link";
import { C, MONO, MAXW, PAGE_PAD, PROFILE } from "../lib/site";

/**
 * Editorial site header, shared by the home page, the writing index and every
 * post (the interactive lessons). Wordmark → home, then Writing and CV.
 * Light-only, hairline underline — matches the exported design.
 */
export default function Header() {
  return (
    <header style={{ borderBottom: `1px solid ${C.hair}`, background: C.bg }}>
      <div
        style={{
          maxWidth: MAXW,
          margin: "0 auto",
          padding: PAGE_PAD,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          className="x-hoverink"
          style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: "0.04em",
            fontWeight: 500,
            color: C.ink,
          }}
        >
          {PROFILE.domain}
        </Link>
        <nav
          style={{
            display: "flex",
            gap: 26,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: C.faint,
          }}
        >
          <Link href="/writing" className="x-hoverink">
            Writing
          </Link>
          <a href={PROFILE.cv} className="x-hoverink">
            CV
          </a>
        </nav>
      </div>
    </header>
  );
}
