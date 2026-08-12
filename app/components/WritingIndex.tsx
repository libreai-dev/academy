"use client";

import Link from "next/link";
import { useState } from "react";
import { C, MONO, SANS, MAXW } from "../lib/site";
import {
  POSTS,
  CATEGORIES,
  CATEGORY_META,
  postCount,
  type Category,
} from "../lib/posts";

type Filter = Category | "All";

/**
 * The /writing index: a filterable list of every post. The category filter row
 * doubles as the site's "levels & stages" — Foundations, then the build-a-model
 * track (Data → Architecture → Training → Alignment → Inference).
 */
export default function WritingIndex() {
  const [active, setActive] = useState<Filter>("All");
  const filters: Filter[] = ["All", ...CATEGORIES];
  const visible = active === "All" ? POSTS : POSTS.filter((p) => p.category === active);

  return (
    <main
      style={{
        maxWidth: MAXW,
        margin: "0 auto",
        padding: "0 clamp(20px, 5vw, 56px) 96px",
        fontFamily: SANS,
        color: C.ink,
      }}
    >
      <header style={{ padding: "clamp(48px, 8vh, 88px) 0 32px", borderBottom: `1px solid ${C.ink}` }}>
        <p
          style={{
            margin: "0 0 22px",
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.faint,
          }}
        >
          Writing · {postCount} posts
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.02, letterSpacing: "-0.03em", fontWeight: 500, maxWidth: "20em" }}>
          Notes on how AI systems actually work
        </h1>
        <p style={{ margin: "22px 0 0", fontSize: 18, lineHeight: 1.6, color: C.muted, maxWidth: "36em", textWrap: "pretty" }}>
          Explainers on the mechanisms, and notes from taking these systems apart
          and putting them back together. Every post is a live, interactive
          lesson — categories run from the foundations up through the pieces of a
          model, in the order you would build one.
        </p>
      </header>

      {/* Category filter — the site's levels & stages */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 20px",
          padding: "22px 0",
          borderBottom: `1px solid ${C.hair}`,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {filters.map((f) => {
          const on = f === active;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              title={f === "All" ? "All posts" : CATEGORY_META[f]}
              style={{
                font: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
                background: "none",
                border: 0,
                padding: "0 0 4px",
                cursor: "pointer",
                color: on ? C.ink : C.ghost,
                borderBottom: `1px solid ${on ? C.ink : "transparent"}`,
                fontWeight: on ? 600 : 400,
                transition: "color 0.14s ease",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {visible.map((p) => (
          <li key={p.slug}>
            <Link
              href={p.href}
              className="x-row"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: 8,
                padding: "26px 0",
                borderBottom: `1px solid ${C.hair}`,
              }}
            >
              <div className="x-row-grid">
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px 12px",
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: C.ghost,
                  }}
                >
                  <time>{p.displayDate}</time>
                  <span style={{ textTransform: "uppercase" }}>{p.category}</span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: 23, fontWeight: 600, lineHeight: 1.28, letterSpacing: "-0.02em", textWrap: "pretty" }}>
                      {p.title}
                    </h2>
                    {p.lang === "es" && (
                      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: C.faint, border: `1px solid ${C.chip}`, padding: "2px 5px" }}>
                        ES
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.62, color: C.muted, maxWidth: "44em", textWrap: "pretty" }}>
                    {p.summary}
                  </p>
                  <p style={{ margin: "10px 0 0", fontFamily: MONO, fontSize: 11, color: C.ghost }}>
                    {p.read}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p style={{ margin: "36px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
        <a href="/rss.xml" className="x-underline">RSS feed</a>
      </p>
    </main>
  );
}
