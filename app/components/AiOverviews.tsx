import Link from "next/link";
import { C, MONO, SANS, MAXW } from "../lib/site";
import { DEMO } from "../lib/ai-overviews";
import AiOverview from "./AiOverview";
import RagVsRetrain from "./RagVsRetrain";
import AiPipeline from "./AiPipeline";

/** The series: the same pipeline, taken into production in a regulated domain.
 *  Each post is an insurance-shaped problem that absorbs part of the pipeline
 *  (placeholders — wired to real routes as each is built). */
const UPCOMING: { title: string; covers: string; teaser: string; href?: string }[] = [
  {
    title: "Your own AI Overview: the spine",
    covers: "The whole pipeline",
    href: "/writing/your-ai-overview-spine",
    teaser: "The same machinery over your own private data: a write path that ingests change data from an S3 data lake and a six-node LangGraph read path that answers with citations. Clone it and run it, zero cloud.",
  },
  {
    title: "Chunking: split the document wrong and you lose the answer",
    covers: "Chunk",
    teaser: "How you cut a claim file decides whether the water-damage detail and its policy number land in the same passage or get orphaned. Chunking as a retrieval decision — measured.",
  },
  {
    title: "Retrieve & rerank: recall finds candidates, rerank decides the answer",
    covers: "Retrieve · rerank",
    teaser: "Cheap dense retrieval casts a wide net; a reranker sharpens precision so the causal passage lands in the top few that fit the budget. Dense vs hybrid, on the same question.",
  },
  {
    title: "Access control at retrieval: filter at retrieval, not after",
    covers: "Access control",
    teaser: "Filter restricted content after the model answers and it leaks anyway. The permission check belongs inside the retrieval query, built from the token, with an audit trail.",
  },
  {
    title: "Grounding & citations: every answer cites the file it came from",
    covers: "Grounding",
    teaser: "Tie every sentence to the source that backs it and score how faithful the answer really is — so an answer in an insurance workflow can be checked, not just believed. Or it abstains.",
  },
  {
    title: "Evals & guardrails: the gate between a demo and production",
    covers: "Evals",
    teaser: "A groundedness eval wired into CI that blocks the release, plus prompt-injection and PII defenses — the line between a demo and a system you can run in a regulated shop.",
  },
];

/** Blog post: "How Google's AI Overview works" — opens with the interactive
 *  replica (the hook), explains why retrieval (freshness), then the pipeline. */
export default function AiOverviews() {
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
      <header style={{ padding: "clamp(40px, 7vh, 80px) 0 28px", borderBottom: `1px solid ${C.ink}` }}>
        <Link href="/writing" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          ← Writing
        </Link>
        <p style={{ margin: "22px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.ghost }}>
          Production · 11 Aug 2026 · 9 min read
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 500, maxWidth: "18em" }}>
          How Google&rsquo;s AI Overview works
        </h1>
        <p style={{ margin: "22px 0 0", fontSize: 19, lineHeight: 1.6, color: C.muted, maxWidth: "34em", textWrap: "pretty" }}>
          You ask a question and get a tidy, cited summary. It looks like magic —
          but underneath it&rsquo;s a retrieval pipeline you can take apart. Let&rsquo;s take
          it apart, starting with a working one you can drive.
        </p>
      </header>

      <article style={{ margin: "36px 0 0" }}>
        {/* ── the hook: the live replica, first ── */}
        <figure style={{ margin: 0 }}>
          <AiOverview data={DEMO} />
          <figcaption style={{ margin: "12px 2px 0", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.6, color: C.faint }}>
            ↳ With <strong style={{ color: C.ink, fontWeight: 600 }}>Retrieval On</strong> it
            fetches today&rsquo;s answer (iPhone 17) and cites it — hover a citation or a
            source and they highlight each other. Flip it{" "}
            <strong style={{ color: C.ink, fontWeight: 600 }}>Off</strong> and the same
            frozen model drops to last year&rsquo;s answer (iPhone 16), with nothing to cite.
          </figcaption>
        </figure>

        {/* ── why retrieval at all (freshness) ── */}
        <h2 style={{ margin: "56px 0 0", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          Why fetch at all?
        </h2>
        <p style={{ margin: "14px 0 0", fontSize: 18, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          The web changes every minute — new headlines, prices, results, product
          launches. But a language model is <strong style={{ fontWeight: 600 }}>frozen at its
          training cutoff</strong>: it can&rsquo;t know what happened after. And you can&rsquo;t
          just teach it the news — retraining a frontier model takes weeks and
          millions, and it&rsquo;s stale again the next day.
        </p>
        <div style={{ margin: "22px 0 0" }}>
          <RagVsRetrain />
        </div>
        <p style={{ margin: "22px 0 0", fontSize: 18, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          So the fresh fact never goes <em>into</em> the model. It&rsquo;s fetched at
          question time and dropped into the prompt — Retrieval-Augmented
          Generation (RAG) — and the answer is written from what was just pulled.
        </p>

        {/* ── the interactive pipeline ── */}
        <h2 style={{ margin: "56px 0 0", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          The pipeline, one stage at a time
        </h2>
        <p style={{ margin: "14px 0 20px", fontSize: 18, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          Getting from your question to that cited answer takes five moves. Step
          through them — each stage lights up in the diagram.
        </p>
        <AiPipeline />

        {/* ── bridge → the repo ── */}
        <a
          href="https://github.com/xaviramirez/open-overview"
          target="_blank"
          rel="noopener noreferrer"
          className="x-card"
          style={{
            display: "block",
            margin: "48px 0 0",
            padding: "24px 26px",
            border: `1px solid ${C.hair}`,
            borderRadius: 14,
            background: C.bg,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
            Run it yourself · open source
          </div>
          <div style={{ margin: "8px 0 0", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>
            open-overview — a transparent AI Overview you can run
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.muted, maxWidth: "46em", textWrap: "pretty" }}>
            The same pipeline, live: a small Python backend (bring-your-own-key)
            does real query fan-out, live retrieval, grounded citations and a
            groundedness eval — every step visible. Reproduces the <em>ideas</em>, not
            Google&rsquo;s index. <span style={{ color: C.ghost }}>(Repo coming soon.)</span>
          </p>
          <span className="x-hoverink" style={{ display: "inline-block", marginTop: 14, fontFamily: MONO, fontSize: 12, color: C.ink }}>
            View on GitHub →
          </span>
        </a>

        {/* ── up next in this series ── */}
        <h2 style={{ margin: "56px 0 0", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          More in this series
        </h2>
        <p style={{ margin: "14px 0 0", fontSize: 18, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          Now take that same machinery into production — where the &ldquo;web&rdquo; is your
          own private corpus and every answer has to be <strong style={{ fontWeight: 600 }}>auditable</strong>.
          That&rsquo;s RAG in a regulated shop like insurance. Each post takes one part of
          the pipeline there:
        </p>
        <ul style={{ listStyle: "none", margin: "22px 0 0", padding: 0, borderTop: `1px solid ${C.hair}` }}>
          {UPCOMING.map((p) => (
            <li key={p.title} style={{ padding: "18px 0", borderBottom: `1px solid ${C.hair}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                {p.href ? (
                  <Link href={p.href} className="x-underline" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.35, color: C.ink }}>
                    {p.title}
                  </Link>
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.35 }}>{p.title}</span>
                )}
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: p.href ? "var(--signal-fg)" : C.ghost,
                    border: `1px solid ${p.href ? "var(--signal-fg)" : C.chip}`,
                    background: p.href ? "var(--signal-wash)" : "transparent",
                    borderRadius: 999,
                    padding: "2px 7px",
                  }}
                >
                  {p.href ? "Live" : "Soon"}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.04em", color: "var(--signal-fg)" }}>
                  ↳ {p.covers}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.6, color: C.faint, maxWidth: "48em", textWrap: "pretty" }}>{p.teaser}</p>
            </li>
          ))}
        </ul>
        <Link href="/writing" className="x-underline" style={{ display: "inline-block", marginTop: 20, fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint }}>
          Browse all Production posts →
        </Link>
      </article>

      <nav style={{ marginTop: 64, paddingTop: 20, borderTop: `1px solid ${C.ink}` }}>
        <Link href="/writing" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          ← All writing
        </Link>
      </nav>
    </main>
  );
}
