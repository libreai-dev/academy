import Link from "next/link";
import { C, MONO, SANS, MAXW } from "../lib/site";
import CodeBlock from "./CodeBlock";
import RetrieveViz from "./RetrieveViz";

// "Your own AI Overview: Retrieve & rerank" — Production series, post 03. One
// idea: retrieval is recall (a wide, cheap net); rerank is precision (a careful
// reorder that decides which few passages the model actually reads). The chunk
// vector search ranks #9 can be the one the reranker puts #1. Prose is inline
// (editorial layer); the two-stage funnel is the interactive centerpiece, and
// the code illustrations are real, lightly trimmed repo snippets.

const CHIPS = [
  { n: "01", label: "Spine" },
  { n: "02", label: "Chunking" },
  { n: "03", label: "Retrieve & rerank", active: true },
  { n: "04", label: "Access control" },
  { n: "05", label: "Grounding & citations" },
  { n: "06", label: "Evals & guardrails" },
];

const RETRIEVE_PY = `def run(state, settings, *, embedder: Embedder, store: VectorStore) -> dict:
    identity = state["identity"]
    # The filter is derived only from the signed identity — never the prompt.
    # Fail-closed: no roles => no results. (That RBAC deep-dive is Post 4.)
    flt = build_filter(identity)

    queries = state.get("sub_queries") or [state.get("question", "")]
    queries = [q for q in queries if q and q.strip()]

    best: dict[str, Retrieved] = {}
    for q in queries:
        vec = embedder.embed_query(q)
        for hit in store.search(vec, flt, k=settings.retrieve_k):   # k = 12
            cid = hit.chunk.chunk_id
            existing = best.get(cid)
            # Keep the strongest score seen for a chunk across sub-queries.
            if existing is None or hit.score > existing.score:
                best[cid] = hit

    candidates = sorted(best.values(), key=lambda r: r.score, reverse=True)
    return {"candidates": candidates, ...}`;

const RERANK_PY = `def run(state, settings, *, reranker: Reranker) -> dict:
    question = state.get("question", "")
    candidates = state.get("candidates", [])
    # Reorder by true relevance, then trim to the context budget.
    reranked = reranker.rerank(question, candidates, k=settings.rerank_k)  # k = 5
    return {"reranked": reranked, ...}`;

const RERANKER_PY = `class BedrockReranker:
    """Reranker backed by a managed Rerank API, with a graceful fallback."""

    def rerank(self, query, candidates, k):
        candidates = list(candidates)
        if not candidates:
            return []
        try:
            return self._rerank_via_service(query, candidates, k)
        except Exception as exc:            # rerank is best-effort, never fatal
            logger.warning("Rerank failed (%s); falling back to retrieval order.", exc)
            return candidates[:k]           # degrade to dense order, don't break


class NoopReranker:
    """Local / reranker=none passthrough — keep retrieval order, trim to k."""

    def rerank(self, query, candidates, k):
        return list(candidates[:k])`;

const CLONE_BASH = `git clone https://github.com/xaviramirezcom/open-ai-overview
cd open-ai-overview
git checkout v3-retrieval

uv sync --extra local
cp .env.example .env         # set the *_PROVIDER / VECTOR_STORE knobs to "local"

own-overview seed            # synthetic P&C insurance data + ingest
own-overview query "Why did the premium on POL-55012 go up?" --role adjuster`;

const h2 = {
  margin: "56px 0 0",
  fontSize: "clamp(24px, 3vw, 32px)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: 1.15,
} as const;
const eyebrow = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--signal-fg)",
} as const;
const p = {
  margin: "14px 0 0",
  fontSize: 18,
  lineHeight: 1.7,
  color: C.body,
  maxWidth: "36em",
  textWrap: "pretty",
} as const;
const li = { margin: "10px 0 0", fontSize: 16.5, lineHeight: 1.6, color: C.body } as const;
const code = { fontFamily: MONO, fontSize: "0.9em" } as const;

export default function AiRetrieval() {
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
        <Link
          href="/writing/your-ai-overview-chunking"
          className="x-hoverink"
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}
        >
          ← Your own AI Overview: Chunking
        </Link>
        <p style={{ margin: "22px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
          Your own AI Overview · 03
        </p>
        <h1 style={{ margin: "10px 0 0", fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 500, maxWidth: "18em" }}>
          Your own AI Overview: Retrieve &amp; rerank
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: 19, lineHeight: 1.6, color: C.muted, maxWidth: "34em", textWrap: "pretty" }}>
          Dense recall finds candidates; reranking decides the answer.
        </p>
        <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          A cheap vector search casts a wide net — the top dozen chunks that <em>look</em>{" "}
          related. A reranker then reads the question and each chunk together and reorders
          them, so the passage that actually answers you lands in the top few you can afford
          to send the model. This post opens up the two middle nodes of the pipeline:{" "}
          <code style={code}>retrieve</code> and <code style={code}>rerank</code>.
        </p>

        {/* pipeline chip grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "24px 0 0" }}>
          {CHIPS.map((c) => (
            <span
              key={c.n}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.03em",
                color: c.active ? "var(--signal-fg)" : C.ghost,
                border: `1px solid ${c.active ? "var(--signal-fg)" : C.chip}`,
                background: c.active ? "var(--signal-wash)" : "transparent",
                borderRadius: 999,
                padding: "5px 11px",
                fontWeight: c.active ? 600 : 400,
              }}
            >
              {c.n} · {c.label}
            </span>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.6, color: C.faint }}>
          ↳ Post 01 was the whole spine, thin. This is node 03 — the two-stage funnel that
          turns a wide net of candidates into the few passages the model reads.
        </p>
      </header>

      <article style={{ margin: "8px 0 0" }}>
        {/* ── worked-example panel ── */}
        <div
          style={{
            margin: "28px 0 0",
            padding: "14px 18px",
            border: `1px solid ${C.hair}`,
            borderRadius: 12,
            background: C.surface,
            display: "flex",
            gap: 12,
            alignItems: "baseline",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--signal-fg)", whiteSpace: "nowrap" }}>
            Worked example
          </span>
          <span style={{ fontSize: 15, lineHeight: 1.6, color: C.body, maxWidth: "44em", textWrap: "pretty" }}>
            This series uses <strong>property &amp; casualty (P&amp;C) insurance</strong> as its
            running example — policies, claims and underwriting notes. The pipeline itself
            is domain-agnostic; the data just happens to be an insurer&rsquo;s.
          </span>
        </div>

        {/* ── NODE A — the two-stage funnel ── */}
        <p style={{ ...eyebrow, margin: "48px 0 0" }}>The two-stage funnel</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>Retrieve wide, rerank sharp</h2>
        <p style={p}>
          One search can&rsquo;t be both fast over millions of chunks <em>and</em> precise about
          which one answers the question — so we do two passes.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Retrieve casts a wide net.</strong> Vector search compares the question&rsquo;s
            embedding to every chunk&rsquo;s and returns the top <code style={code}>k</code>{" "}
            &ldquo;roughly similar&rdquo; ones — cheap, and tuned for <em>recall</em> (don&rsquo;t miss the
            answer), not for getting the order right. Default <code style={code}>k = 12</code>.
          </li>
          <li style={li}>
            <strong>Rerank decides the answer.</strong> A reranker reads the question and each
            candidate <em>together</em> and scores true relevance, then keeps the top{" "}
            <code style={code}>rerank_k</code> (default <strong>5</strong>). That smaller,
            sharper set is the <em>context budget</em> the grounding step gets.
          </li>
          <li style={li}>
            <strong>The order flips.</strong> The chunk vector search ranked <strong>#9</strong>{" "}
            can be the one the reranker puts <strong>#1</strong> — because &ldquo;similar
            embeddings&rdquo; and &ldquo;actually answers this&rdquo; are not the same thing.
          </li>
          <li style={li}>
            <strong>It fails soft.</strong> If the reranker errors, the pipeline degrades to
            retrieval order (<code style={code}>candidates[:k]</code>) instead of breaking —
            rerank is a quality boost, not a correctness gate.
          </li>
        </ul>

        <div
          style={{
            margin: "22px 0 0",
            padding: "16px 18px",
            borderLeft: `2px solid var(--signal)`,
            background: "var(--signal-wash)",
            borderRadius: "0 10px 10px 0",
          }}
        >
          <div style={{ ...eyebrow, color: "var(--signal-fg)" }}>Why two passes, not one?</div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "44em", textWrap: "pretty" }}>
            A reranker is accurate but expensive — you can&rsquo;t run it over a million chunks per
            query. Vector search is the opposite: cheap enough to score everything, but only
            &ldquo;roughly&rdquo; right about order. So the net catches a wide dozen fast, and the
            reranker spends its precision on just those twelve. Recall first, precision second.
          </p>
        </div>

        {/* the interactive centerpiece */}
        <RetrieveViz />

        <p style={{ ...p, margin: "22px 0 0" }}>
          That funnel isn&rsquo;t a diagram of the code — it <em>is</em> the code. The retrieve
          node embeds each sub-query, searches with a permission filter, and merges the hits,
          keeping each chunk&rsquo;s best score:
        </p>
        <CodeBlock code={RETRIEVE_PY} lang="python" filename="pipeline/nodes/retrieve.py" />
        <p style={{ ...p, margin: "18px 0 0" }}>
          The rerank node is deliberately tiny — reorder by true relevance, trim to the budget,
          hand the sharper set on to grounding:
        </p>
        <CodeBlock code={RERANK_PY} lang="python" filename="pipeline/nodes/rerank.py" />

        {/* ── NODE B — dense vs hybrid ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>Where vectors fumble</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>When meaning isn&rsquo;t enough</h2>
        <p style={p}>
          Embeddings are great at &ldquo;what is this about&rdquo; and surprisingly bad at &ldquo;does it
          contain exactly <code style={code}>POL-55012</code>&rdquo;.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Dense search matches meaning.</strong> It embeds the query and finds chunks
            with <em>similar meaning</em> — perfect for &ldquo;why did the premium rise&rdquo;, weak when
            the answer hinges on an exact string the embedding blurs.
          </li>
          <li style={li}>
            <strong>Identifiers are exact tokens.</strong> <code style={code}>POL-55012</code>,{" "}
            <code style={code}>claim 88431</code>, a form code, a state abbreviation — a
            near-miss (<code style={code}>POL-55021</code>) is a <em>wrong</em> answer, not a
            close one. Vectors don&rsquo;t guarantee the exact token is even present.
          </li>
          <li style={li}>
            <strong>Keyword search nails exact tokens.</strong> Classic term matching (BM25)
            finds the chunk that literally contains <code style={code}>POL-55012</code>, even
            when its surrounding prose isn&rsquo;t semantically &ldquo;similar&rdquo; to the question.
          </li>
          <li style={li}>
            <strong>Hybrid = both, then merge.</strong> Run dense <em>and</em> keyword, combine
            the scores, hand the union to the reranker. You get semantic recall <em>and</em>{" "}
            exact-match precision.
          </li>
        </ul>
        <p style={{ ...p, margin: "18px 0 0" }}>
          Ask a librarian who only understands <em>topics</em> to find the file numbered 55012
          and they&rsquo;ll hand you five files <em>about</em> the same policy. Add a clerk who reads
          numbers and the exact file comes first. Production RAG usually wants both.
        </p>

        <div
          className="x-card"
          style={{ margin: "22px 0 0", padding: "18px 20px", border: `1px solid ${C.hair}`, borderRadius: 12, background: C.surface }}
        >
          <div style={{ ...eyebrow, color: "var(--signal-fg)" }}>What ships in v3-retrieval</div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.65, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            Be honest about the code: the default query today is <strong>dense k-NN + the
            permission filter + a reranker</strong>. True hybrid — a keyword (BM25) pass merged
            with the vectors — is the documented <em>next</em> step, not something already
            wired into the default query. It&rsquo;s a small reach, though: the search index already
            stores the chunk text as a full-text field, so a keyword pass is one query away.
            This section shows <em>why</em> you&rsquo;d add it — an honest next commit, not a claim
            that it runs.
          </p>
        </div>

        <p style={{ ...p, margin: "22px 0 0" }}>
          The reranker is the one place this stage can call an outside service, so it&rsquo;s built
          to fail soft — a service error degrades to plain retrieval order rather than breaking
          the answer. Local mode uses a no-op passthrough, so the graph runs with zero cloud:
        </p>
        <CodeBlock code={RERANKER_PY} lang="python" filename="retrieval/rerank.py" />

        {/* ── clone this stage ── */}
        <div
          className="x-card"
          style={{ margin: "56px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
            Run it yourself · own-overview @ v3-retrieval
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            This whole post is one repo at one tag. Clone it, seed synthetic P&amp;C insurance
            data, and watch the two-stage funnel run on your laptop — dense recall, then a
            reranker that reorders and trims to the budget.
          </p>
          <CodeBlock code={CLONE_BASH} lang="bash" filename="terminal" />
          <p style={{ margin: "16px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            You&rsquo;ll see the answer with <strong>numbered citations back to the source
            chunks</strong> — the top-5 reranked passages the model was allowed to read. Both
            vector-store backends implement the same <code style={code}>search(query_vector, flt, k)</code>{" "}
            contract and apply the permission filter <em>before</em> scoring: local mode is
            numpy cosine, the default is a k-NN index with the filter compiled into the query.
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55, color: C.ghost, maxWidth: "46em" }}>
            Teaching-grade reference implementation, not a production insurance product. It
            reproduces the ideas; bring your own data and keys. MIT-licensed.
          </p>
        </div>

        {/* ── explain it back ── */}
        <h2 style={{ ...h2 }}>Explain it back</h2>
        <p style={p}>
          Your vector search returns 12 chunks and the one that actually answers the question
          is sitting at rank #9. You send the top 5 to the model. Two things are now true —
          name the problem, and name the fix.
        </p>
        <details style={{ margin: "16px 0 0", maxWidth: "42em" }}>
          <summary style={{ fontFamily: MONO, fontSize: 13, color: "var(--signal-fg)", cursor: "pointer" }}>
            Reveal a model answer
          </summary>
          <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.7, color: C.body, textWrap: "pretty" }}>
            <strong>The problem:</strong> dense similarity ranked the answer #9, so a naive
            &ldquo;top-5 by vector score&rdquo; cuts it — the model never sees the passage it needs and
            either guesses or abstains. <strong>The fix:</strong> rerank before you trim. A
            reranker reads the question and each candidate together, scores true relevance, and
            can lift that #9 chunk to #1 — so it&rsquo;s safely inside the top-5 budget the model
            receives. (And if the exact identifier matters, add a keyword/hybrid pass so the
            chunk that literally names <code style={code}>POL-55012</code> can&rsquo;t be missed in
            the first place.)
          </p>
        </details>

        {/* ── bridge → post 04 ── */}
        <Link
          href="/writing/your-ai-overview-access-control"
          className="x-card"
          style={{ display: "block", margin: "48px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
            Next in the series · 04
          </div>
          <div style={{ margin: "8px 0 0", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Access control at retrieval
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.muted, maxWidth: "46em", textWrap: "pretty" }}>
            You saw <code style={code}>build_filter(identity)</code> ride along on every search
            here — quietly deciding which chunks were even <em>candidates</em>. In a regulated
            insurer that filter is the whole game: an adjuster and an underwriter ask the same
            question and get different answers, because restricted chunks are excluded{" "}
            <em>before</em> the model sees them. Next: how the signed token becomes a query
            filter, why fail-closed matters, and what the audit log records.
          </p>
          <span className="x-hoverink" style={{ display: "inline-block", marginTop: 14, fontFamily: MONO, fontSize: 12, color: C.ink }}>
            Continue to Access control →
          </span>
        </Link>
      </article>

      <nav style={{ marginTop: 64, paddingTop: 20, borderTop: `1px solid ${C.ink}`, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <Link href="/writing/your-ai-overview-chunking" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          ← Chunking
        </Link>
        <Link href="/writing" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          All writing →
        </Link>
      </nav>
    </main>
  );
}
