import Link from "next/link";
import { C, MONO, SANS, MAXW } from "../lib/site";
import CodeBlock from "./CodeBlock";
import SpineGraph from "./SpineGraph";

// "Your own AI Overview: the spine" — Production series, post 01. The whole
// pipeline, thin but real: a write path that ingests from an S3 data lake and a
// read path that answers with citations. Prose is inline (editorial layer);
// the interactive read-path stepper and the code illustrations are components.

const CHIPS = [
  { n: "01", label: "Spine", active: true },
  { n: "02", label: "Chunking" },
  { n: "03", label: "Retrieve & rerank" },
  { n: "04", label: "Access control" },
  { n: "05", label: "Grounding & citations" },
  { n: "06", label: "Evals & guardrails" },
];

const EVENTS_PY = `class ChangeEvent(StrEnum):
    BATCH_TABLE_WRITTEN = "batchTableWrittenOut"
    BATCH_COMPLETED = "batchCompleted"
    STREAMING_BATCH_COMPLETED = "streamingBatchCompleted"
    SCHEMA_CHANGED = "tableSchemaChanged"

# Events that mean "a committed batch is ready to ingest for this table".
INGESTABLE = {ChangeEvent.STREAMING_BATCH_COMPLETED, ChangeEvent.BATCH_TABLE_WRITTEN}`;

const MERGE_PY = `for key, row in latest.items():
    doc_id = f"{doc_type}/{key}"
    if _op(row) == "D":
        deletes.append(doc_id)     # tombstone → evict from the index
        continue
    upserts.append(Document(...))  # latest state → chunk, embed, upsert`;

const GRAPH_PY = `g = StateGraph(QueryState)

g.add_node("fan_out",    lambda st: fan_out.run(st, s))
g.add_node("retrieve",   lambda st: retrieve.run(st, s, embedder=embedder, store=store))
g.add_node("rerank",     lambda st: rerank.run(st, s, reranker=reranker))
g.add_node("ground",     lambda st: ground.run(st, s, llm=llm))
g.add_node("guardrails", lambda st: guardrails.run(st, s))
g.add_node("audit",      lambda st: audit.run(st, s))

g.add_edge(START, "fan_out")
g.add_edge("fan_out", "retrieve")
g.add_edge("retrieve", "rerank")
g.add_edge("rerank", "ground")
g.add_edge("ground", "guardrails")
g.add_edge("guardrails", "audit")
g.add_edge("audit", END)`;

const TENANTSCOPE_PY = `@dataclass(frozen=True, slots=True)
class TenantScope:
    tenant_id: str
    env: str  # e.g. "dev", "qa", "prod"

    def namespace(self) -> str:
        return f"{self.tenant_id}__{self.env}"`;

const CLONE_BASH = `git clone https://github.com/xaviramirezcom/open-ai-overview
cd open-ai-overview
git checkout v1-spine

uv sync --extra local
cp .env.example .env        # set the *_PROVIDER / VECTOR_STORE values to "local"

own-overview seed           # generate synthetic P&C data + ingest it
own-overview query "Why did the premium on POL-55012 go up?" --role adjuster
own-overview query "Why did the premium on POL-55012 go up?" --role underwriter`;

const BUILD_GRAPH_PY = `def build_query_graph(*, settings=None, embedder=None, store=None,
                      reranker=None, llm=None):
    """Compile the query graph. Components default from config but can be
    injected (tests, notebooks, alternate providers)."""
    s = settings or get_settings()
    embedder = embedder or build_embedder(s)
    store = store or build_vector_store(s, embedder=embedder)
    reranker = reranker or build_reranker(s)
    llm = llm or build_llm(s)

    g = StateGraph(QueryState)
    g.add_node("fan_out",    lambda st: fan_out.run(st, s))
    g.add_node("retrieve",   lambda st: retrieve.run(st, s, embedder=embedder, store=store))
    # ... rerank · ground · guardrails · audit, then edges wire them in order ...
    return g.compile()`;

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

export default function AiSpine() {
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
          href="/writing/how-ai-overviews-work"
          className="x-hoverink"
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}
        >
          ← How Google&rsquo;s AI Overview works
        </Link>
        <p style={{ margin: "22px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
          Your own AI Overview · 01
        </p>
        <h1 style={{ margin: "10px 0 0", fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 500, maxWidth: "18em" }}>
          Your own AI Overview: the spine
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: 19, lineHeight: 1.6, color: C.muted, maxWidth: "34em", textWrap: "pretty" }}>
          Clone it and run it — retrieval over your own private data, end to end.
        </p>
        <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          Google&rsquo;s AI Overview retrieves, grounds, and cites over the open web. This
          series rebuilds that same machinery over your <em>private</em> data —
          claims, policies, underwriting — the way a regulated insurer can actually ship
          it. This first post is the whole spine, minimal but real: a write path that
          ingests change data from an S3 data lake, and a read path that answers a
          question with citations. One repo, one <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>git clone</code>, runs on your laptop.
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
          ↳ This post is the spine — the whole pipeline, thin. Each chip after it is one
          post that deepens that stage.
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

        {/* ── NODE A — write path ── */}
        <p style={{ ...eyebrow, margin: "48px 0 0" }}>Write path</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>How a claim gets into the index</h2>
        <p style={p}>
          Before you can retrieve anything, a change in your systems of record has to
          travel — safely — into a vector store.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Trigger on the commit, not the file.</strong> Your data platform writes
            Parquet to an <strong>S3 data lake</strong> and <em>then</em> fires a{" "}
            <strong>change event</strong> when the batch is committed in{" "}
            <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>manifest.json</code>. We listen for that on EventBridge — not
            raw S3 <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>ObjectCreated</code>, which fires per file <em>before</em> the batch is
            done and would read a half-written table.
          </li>
          <li style={li}>
            <strong>The feed is change-data-capture, not a snapshot.</strong> Each row carries
            an operation — Insert, Update or Delete. We collapse the rows to each record&rsquo;s
            latest state before indexing, so claim 88431 is one current document, not a pile
            of edits.
          </li>
          <li style={li}>
            <strong>A delete must leave the index.</strong> Deletes arrive as tombstone rows
            (the operation column set to <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>&apos;D&apos;</code>). We don&rsquo;t skip them — we{" "}
            <strong>evict</strong> that document from the store. A redacted claim disappears
            from retrieval, which in a regulated shop is not optional.
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
          <div style={{ ...eyebrow, color: "var(--signal-fg)" }}>Why the commit event, not the S3 event?</div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "44em", textWrap: "pretty" }}>
            The data platform writes many Parquet objects per batch, then commits by
            updating <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>manifest.json</code>. Raw{" "}
            <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>ObjectCreated</code> events fire on each object <em>before</em> that commit —
            trigger on them and you read a half-written table. The batch-committed change
            event is the reliable signal: it only fires once the manifest is updated.
          </p>
        </div>

        <CodeBlock code={EVENTS_PY} lang="python" filename="ingestion/change_events.py" />
        <p style={{ ...p, margin: "18px 0 0" }}>
          And the fork that makes a delete a first-class outcome — the tombstone becomes an
          eviction, not a skipped row:
        </p>
        <CodeBlock code={MERGE_PY} lang="python" filename="ingestion/merge.py" />

        {/* ── NODE B — read path ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>Read path</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>Six nodes from question to citation</h2>
        <p style={p}>
          The query side is one explicit LangGraph graph — step through it and watch a real
          insurance question turn into a grounded, cited answer.
        </p>
        <ul style={{ margin: "16px 0 20px", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Identity comes from the token, never the prompt.</strong> The signed
            token resolves to a tenant, an environment, and roles. The question can ask for
            anything; it can&rsquo;t grant itself access.
          </li>
          <li style={li}>
            <strong>Each phase is a graph node.</strong> Because the pipeline is an explicit
            graph, every later post in this series deepens exactly one node without touching
            the others.
          </li>
          <li style={li}>
            <strong>Thin evidence means abstain.</strong> If retrieval comes back weak, the
            guardrail node scores groundedness and the system declines rather than guessing —
            then writes an audit record either way.
          </li>
        </ul>

        <SpineGraph />

        <p style={{ ...p, margin: "22px 0 0" }}>
          That stepper isn&rsquo;t a diagram of the code — it <em>is</em> the code. The graph is
          wired once, one node per phase:
        </p>
        <CodeBlock code={GRAPH_PY} lang="python" filename="own_overview/pipeline/graph.py" />

        {/* ── NODE C — isolation ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>Isolation</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>Why nothing crosses tenants</h2>
        <p style={p}>
          The same code serves every insurer and every environment — what keeps them apart
          is one key carried end to end. A <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>TenantScope</code> (tenant + env) rides on every
          document, chunk and query, and the vector index is namespaced{" "}
          <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>tenant__env</code>. Retrieval fails closed: a query for <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>acme</code> can only
          ever look inside <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>acme__prod</code>, so a <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>globex</code> chunk — or a{" "}
          <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>dev</code> chunk — is physically unreachable.
        </p>
        <CodeBlock code={TENANTSCOPE_PY} lang="python" filename="own_overview/contracts.py" />

        {/* ── clone this stage ── */}
        <div
          className="x-card"
          style={{ margin: "56px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
            Run it yourself · own-overview @ v1-spine
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            This whole post is one repo at one tag. Clone it, seed synthetic P&amp;C insurance
            data, and ask it a question — grounded and cited, on your laptop, zero cloud.
          </p>
          <CodeBlock code={CLONE_BASH} lang="bash" filename="terminal" />
          <p style={{ margin: "16px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            The answer changes with <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>--role</code>. The <strong>adjuster</strong> gets a cited
            answer from the claim and the policy; the <strong>underwriter</strong> additionally
            sees the restricted risk memo. Same question, same index — different access,
            enforced <em>at retrieval</em>. That&rsquo;s the thread Post 4 pulls on.
          </p>
          <CodeBlock code={BUILD_GRAPH_PY} lang="python" filename="own_overview/pipeline/graph.py" />
          <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55, color: C.ghost, maxWidth: "46em" }}>
            Teaching-grade reference implementation, not a production insurance product. It
            reproduces the ideas and the S3-data-lake integration shape; bring your own data
            and keys. MIT-licensed.
          </p>
        </div>

        {/* ── explain it back ── */}
        <h2 style={{ ...h2 }}>Explain it back</h2>
        <p style={p}>
          Your team wires the ingestion Lambda to fire on S3 <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>ObjectCreated</code> so new data
          shows up &ldquo;the instant it lands.&rdquo; A week later, answers occasionally cite garbled,
          half-populated claims. What went wrong, and what should the trigger have been?
        </p>
        <details style={{ margin: "16px 0 0", maxWidth: "42em" }}>
          <summary style={{ fontFamily: MONO, fontSize: 13, color: "var(--signal-fg)", cursor: "pointer" }}>
            Reveal a model answer
          </summary>
          <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.7, color: C.body, textWrap: "pretty" }}>
            The data platform writes a batch as <em>many</em> Parquet objects and only commits it by updating{" "}
            <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>manifest.json</code>. <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>ObjectCreated</code> fires per object, <em>before</em> the
            commit — so the Lambda sometimes reads a table still being written and indexes
            partial rows. Trigger instead on the batch-committed <strong>change event</strong>{" "}
            (<code style={{ fontFamily: MONO, fontSize: "0.9em" }}>streamingBatchCompleted</code> / <code style={{ fontFamily: MONO, fontSize: "0.9em" }}>batchTableWrittenOut</code>) delivered via
            EventBridge: that event is the commit watermark, so you only ingest a finished
            batch. Bonus — the same event path is where you honor DELETE tombstones and evict
            redacted records, something a per-file S3 trigger gives you no clean hook for.
          </p>
        </details>

        {/* ── bridge → post 02 ── */}
        <Link
          href="/writing/your-ai-overview-chunking"
          className="x-card"
          style={{ display: "block", margin: "48px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
            Next in the series · 02
          </div>
          <div style={{ margin: "8px 0 0", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Chunking: split the document wrong and you lose the answer
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.muted, maxWidth: "46em", textWrap: "pretty" }}>
            The spine chunks with a naive splitter — good enough to run, not to trust. How you
            cut a claim file decides whether the water-damage detail and its policy number land
            in the same passage or get orphaned into two. Next we make chunking a retrieval
            decision and measure it.
          </p>
          <span className="x-hoverink" style={{ display: "inline-block", marginTop: 14, fontFamily: MONO, fontSize: 12, color: C.ink }}>
            Continue to Chunking →
          </span>
        </Link>
      </article>

      <nav style={{ marginTop: 64, paddingTop: 20, borderTop: `1px solid ${C.ink}`, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <Link href="/writing/how-ai-overviews-work" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          ← How Google&rsquo;s AI Overview works
        </Link>
        <Link href="/writing" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          All writing →
        </Link>
      </nav>
    </main>
  );
}
