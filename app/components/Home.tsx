import Link from "next/link";
import {
  C,
  MONO,
  SANS,
  MAXW,
  PROFILE,
  EXPERIENCE,
  SELECTED_WORK,
} from "../lib/site";
import { recentPosts } from "../lib/posts";

/** Small mono section label, e.g. "01 · About". Sticky beside its body. */
function Label({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2
      className="x-sec-sticky"
      style={{
        margin: 0,
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.ink,
        fontWeight: 500,
      }}
    >
      {n} · {children}
    </h2>
  );
}

/**
 * The personal-site home for xavier-ramirez.com: hero, then five numbered
 * sections — About, Writing (recent posts), Experience, Selected work, Contact.
 */
export default function Home() {
  const recent = recentPosts(4);

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
      {/* ---- Hero ----------------------------------------------------- */}
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(32px, 5vw, 72px)",
          alignItems: "flex-end",
          padding: "clamp(48px, 10vh, 112px) 0 44px",
          borderBottom: `1px solid ${C.ink}`,
        }}
      >
        <div style={{ flex: "1 1 460px", minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 26px",
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.faint,
            }}
          >
            {PROFILE.role}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(40px, 6vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 500,
            }}
          >
            {PROFILE.shortName}
          </h1>
          <p
            style={{
              margin: "28px 0 0",
              fontSize: "clamp(19px, 2.1vw, 24px)",
              lineHeight: 1.45,
              letterSpacing: "-0.012em",
              color: C.strong,
              maxWidth: "26em",
              textWrap: "pretty",
            }}
          >
            {PROFILE.tagline}
          </p>
          <nav
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 22,
              marginTop: 34,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.02em",
            }}
          >
            <a href={`mailto:${PROFILE.email}`} className="x-underline">
              {PROFILE.email}
            </a>
            <a href={PROFILE.phoneHref} className="x-underline">
              {PROFILE.phone}
            </a>
            <a href={PROFILE.linkedin} className="x-underline">
              LinkedIn
            </a>
          </nav>
        </div>

        <div
          style={{
            flex: "0 0 auto",
            width: "clamp(150px, 20vw, 220px)",
            aspectRatio: "4 / 5",
            border: `1px solid ${C.hair}`,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/portrait.webp"
            alt={`Portrait of ${PROFILE.name}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </header>

      {/* ---- 01 · About ---------------------------------------------- */}
      <section className="x-sec">
        <Label n="01">About</Label>
        <div style={{ maxWidth: "38em" }}>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.6, color: C.ink, textWrap: "pretty" }}>
            {PROFILE.about.map(([text, bold], i) =>
              bold ? (
                <strong key={i} style={{ fontWeight: 600 }}>
                  {text}
                </strong>
              ) : (
                <span key={i}>{text}</span>
              ),
            )}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 24,
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.04em",
              color: C.muted,
            }}
          >
            {PROFILE.stack.map((s) => (
              <span key={s} style={{ border: `1px solid ${C.chip}`, padding: "5px 9px" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 02 · Writing -------------------------------------------- */}
      <section className="x-sec">
        <div>
          <Label n="02">Writing</Label>
          <Link
            href="/writing"
            className="x-underline"
            style={{
              display: "inline-block",
              marginTop: 14,
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.06em",
              color: C.faint,
            }}
          >
            All posts →
          </Link>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: C.ink, maxWidth: "34em", textWrap: "pretty" }}>
            Notes on how AI systems actually work, and what it takes to run them
            in production.
          </p>
          <ul style={{ listStyle: "none", margin: "26px 0 0", padding: 0, borderTop: `1px solid ${C.hair}` }}>
            {recent.map((p) => (
              <li key={p.slug}>
                <Link
                  href={p.href}
                  className="x-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "86px minmax(0, 1fr)",
                    gap: "6px 20px",
                    alignItems: "baseline",
                    padding: "18px 0",
                    borderBottom: `1px solid ${C.hair}`,
                  }}
                >
                  <time style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.04em", color: C.ghost }}>
                    {p.displayDate}
                  </time>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600, lineHeight: 1.35, letterSpacing: "-0.015em", textWrap: "pretty" }}>
                      {p.title}
                    </h3>
                    <p style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.6, color: C.faint, maxWidth: "44em", textWrap: "pretty" }}>
                      {p.summary}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- 03 · Experience ----------------------------------------- */}
      <section className="x-sec">
        <Label n="03">Experience</Label>
        <div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `1px solid ${C.hair}` }}>
            {EXPERIENCE.map((job) => (
              <li
                key={job.org}
                style={{
                  display: "grid",
                  gridTemplateColumns: "118px 42px minmax(0, 1fr)",
                  gap: "4px 16px",
                  padding: "16px 0",
                  borderBottom: `1px solid ${C.hair}`,
                  alignItems: "center",
                }}
              >
                <time style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.06em", color: C.muted }}>
                  {job.period}
                </time>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.logo}
                  alt=""
                  width={42}
                  height={42}
                  style={{ width: 42, height: 42, objectFit: "contain", borderRadius: 4 }}
                />
                <div style={{ fontSize: 18, lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600 }}>{job.org}</span>
                  <span style={{ color: C.faint }}> — {job.role}</span>
                </div>
              </li>
            ))}
          </ul>
          <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.6, color: C.faint }}>
            {PROFILE.education}
          </p>
        </div>
      </section>

      {/* ---- 04 · Selected work -------------------------------------- */}
      <section className="x-sec">
        <Label n="04">Selected work</Label>
        <div style={{ display: "grid", gap: 18 }}>
          {SELECTED_WORK.map((w, i) => (
            <div
              key={w.title}
              className="x-card"
              style={{
                display: "grid",
                gridTemplateColumns: "28px minmax(0, 1fr)",
                gap: "10px 18px",
                border: `1px solid ${C.hair}`,
                padding: "26px 28px",
                background: C.bg,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#b3b3ac", paddingTop: 5 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.28, letterSpacing: "-0.02em", textWrap: "pretty" }}>
                    {w.title}
                  </h3>
                  <span
                    style={{
                      flex: "0 0 auto",
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: C.ink,
                      border: `1px solid ${C.ink}`,
                      padding: "3px 7px",
                    }}
                  >
                    {w.status}
                  </span>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.62, color: C.muted, maxWidth: "44em", textWrap: "pretty" }}>
                  {w.body}
                </p>
                <p style={{ margin: "14px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ghost }}>
                  {w.tags}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- 05 · Contact -------------------------------------------- */}
      <section className="x-sec" style={{ borderBottom: "none" }}>
          <Label n="05">Contact</Label>
          <div>
            <p style={{ margin: 0, fontSize: "clamp(19px, 2vw, 22px)", lineHeight: 1.5, letterSpacing: "-0.01em", maxWidth: "30em", textWrap: "pretty" }}>
              Open to conversations about AI platform work. Reach me at{" "}
              <a href={`mailto:${PROFILE.email}`} style={{ borderBottom: `1px solid ${C.ink}` }}>
                {PROFILE.email}
              </a>
              .
            </p>
            <nav
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 24,
                marginTop: 28,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.faint,
              }}
            >
              <a href={PROFILE.github} className="x-hoverink">GitHub</a>
              <a href={PROFILE.linkedin} className="x-hoverink">LinkedIn</a>
              <a href={PROFILE.cv} className="x-hoverink">CV (PDF)</a>
              <Link href="/writing" className="x-hoverink">Writing</Link>
            </nav>
          </div>
      </section>
    </main>
  );
}
