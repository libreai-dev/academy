import Link from "next/link";
import { C, MONO, SANS, MAXW } from "../lib/site";
import CodeBlock from "./CodeBlock";
import AccessViz from "./AccessViz";

// "Your own AI Overview: Access control at retrieval" — Production series, post
// 04, the differentiator. One opinion, landed hard: the permission check belongs
// inside the retrieval query, not in the prompt after. The leak demo (AccessViz)
// is the centerpiece; the prose + code illustrations support it.

const CHIPS = [
  { n: "01", label: "Spine" },
  { n: "02", label: "Chunking" },
  { n: "03", label: "Retrieve & rerank" },
  { n: "04", label: "Access control", active: true },
  { n: "05", label: "Grounding & citations" },
  { n: "06", label: "Evals & guardrails" },
];

const BUILD_FILTER_PY = `def build_filter(identity: Identity, *, doc_types: set[str] | None = None) -> RetrievalFilter:
    if not identity.roles:
        # No roles => can retrieve nothing. Fail closed, never open.
        return RetrievalFilter(scope=identity.scope, roles=frozenset(), doc_types=frozenset())
    return RetrievalFilter(
        scope=identity.scope,
        roles=frozenset(identity.roles),
        doc_types=frozenset(doc_types) if doc_types else None,
    )


def is_visible(chunk_scope, chunk_roles: frozenset[str], flt: RetrievalFilter) -> bool:
    if chunk_scope != flt.scope:       # 1. tenant + env must match
        return False
    if not (chunk_roles & flt.roles):  # 2. at least one role must overlap
        return False
    return True`;

const RETRIEVE_PY = `def run(state: QueryState, settings, *, embedder: Embedder, store: VectorStore) -> dict:
    identity = state["identity"]
    # The filter is derived only from the signed identity. Fail-closed logic
    # (no roles => no results) lives in build_filter / the store.
    flt = build_filter(identity)

    queries = state.get("sub_queries") or [state.get("question", "")]
    best: dict[str, Retrieved] = {}
    for q in (q for q in queries if q and q.strip()):
        vec = embedder.embed_query(q)
        for hit in store.search(vec, flt, k=settings.retrieve_k):  # filter pushed into the query
            best[hit.chunk.chunk_id] = hit
    return {"retrieved": list(best.values())}`;

const TENANTSCOPE_PY = `@dataclass(frozen=True, slots=True)
class TenantScope:
    tenant_id: str
    env: str  # e.g. "dev", "qa", "prod"

    def namespace(self) -> str:
        """Vector-store namespace / index suffix for this scope."""
        return f"{self.tenant_id}__{self.env}"`;

const CLONE_BASH = `git clone https://github.com/xaviramirezcom/open-ai-overview
cd open-ai-overview
git checkout v4-access-control
pip install -e ".[local]"

# Broker: policy only — the underwriting risk memo is never retrieved
own-overview query "Why did POL-55012's premium rise?" \\
  --tenant acme --env prod --role broker

# Underwriter: same question, now the risk memo is in scope
own-overview query "Why did POL-55012's premium rise?" \\
  --tenant acme --env prod --role underwriter`;

const AUDIT_JSON = `{"timestamp":"2026-08-13T18:04:11Z","user_id":"u_88","tenant":"acme","env":"prod",
 "question":"Why did POL-55012's premium rise?","retrieved_chunk_ids":["POL-55012#0"],
 "groundedness":0.94,"abstained":false}`;

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

export default function AiAccessControl() {
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
          href="/writing/your-ai-overview-retrieval"
          className="x-hoverink"
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}
        >
          ← Retrieve &amp; rerank
        </Link>
        <p style={{ margin: "22px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
          Your own AI Overview · 04
        </p>
        <h1 style={{ margin: "10px 0 0", fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 500, maxWidth: "18em" }}>
          Access control at retrieval
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: 19, lineHeight: 1.6, color: C.muted, maxWidth: "34em", textWrap: "pretty" }}>
          Filter at retrieval, not after.
        </p>
        <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          An AI Overview over your own data is only as safe as the <em>retrieval</em> step.
          Ask it &ldquo;why did POL-55012&rsquo;s premium go up?&rdquo; and it will happily pull every
          passage that looks relevant &mdash; including an underwriting risk memo a broker was
          never allowed to see, or a near-identical claim from a <em>different</em> insurer on
          the same system. The tempting fix is to retrieve everything and then <em>tell</em> the
          model to hide the restricted parts. That leaks. This post shows the version that
          doesn&rsquo;t: the permission check is compiled into the query, built from the caller&rsquo;s
          signed token, and applied <em>before</em> a single passage reaches the model.
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
          ↳ This post deepens one stage of the spine: the access check that runs <em>inside</em>{" "}
          retrieval.
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

        {/* ── NODE A — the leak demo (centerpiece) ── */}
        <p style={{ ...eyebrow, margin: "48px 0 0" }}>The leak</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>Filter after, and it leaks</h2>
        <p style={p}>
          Same question, same corpus, one switch. Watch what rides into the answer when the
          filter runs <em>after</em> retrieval instead of <em>inside</em> it.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Filter at retrieval (ON).</strong> The query itself excludes anything the
            caller can&rsquo;t see. The model only ever receives passages it&rsquo;s allowed to read.
          </li>
          <li style={li}>
            <strong>Filter after (OFF).</strong> The model retrieves everything, then is{" "}
            <em>told</em> to hide the restricted parts. It doesn&rsquo;t reliably obey — and the
            restricted text is already in its context.
          </li>
          <li style={li}>
            <strong>Two ways to leak.</strong> A <strong>role leak</strong> (the underwriting
            memo reaching a broker) and a <strong>cross-tenant leak</strong> (another insurer&rsquo;s
            claim reaching you).
          </li>
          <li style={li}>
            <strong>The point.</strong> &ldquo;The model saw it but chose not to say it&rdquo; is not
            access control. Not-retrieved is the only safe state.
          </li>
        </ul>

        <AccessViz />

        <p style={{ ...p, margin: "22px 0 0" }}>
          With the filter off, the broker&rsquo;s answer quotes an underwriting risk memo and a
          claim from <em>another insurer</em> — because the model saw both, and &ldquo;please hide
          them&rdquo; is not a security control. With the filter on, those documents are never
          retrieved, so they can&rsquo;t leak. The safe answer and the leaky answer differ by one
          thing: <em>where</em> the check runs.
        </p>

        {/* ── NODE B — provenance ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>Provenance</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>The filter is built from the token, never the prompt</h2>
        <p style={p}>
          The permission check is compiled from the caller&rsquo;s signed identity — tenant,
          environment and roles — resolved from a verified token (a JWT in production). The
          question the user typed can never widen access.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Signed token, not text.</strong> Tenant, env and roles come from verified
            claims. The question is data to answer, never a source of permissions.
          </li>
          <li style={li}>
            <strong>Identity → RetrievalFilter.</strong> The token resolves to an{" "}
            <code style={code}>Identity</code>, and <code style={code}>build_filter</code> turns
            it into the exact <code style={code}>RetrievalFilter</code> pushed into the search.
          </li>
          <li style={li}>
            <strong>Three conditions, all required.</strong> Scope match (tenant <em>and</em>{" "}
            env), role overlap (<code style={code}>chunk.acl_roles ∩ roles ≠ ∅</code>), and an
            optional doc-type narrowing.
          </li>
          <li style={li}>
            <strong>Fail closed.</strong> No roles → the filter matches <em>nothing</em>. The
            default is deny, never allow — an empty role list must not become an open door.
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
          <div style={{ ...eyebrow, color: "var(--signal-fg)" }}>Why not read roles from the request?</div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "44em", textWrap: "pretty" }}>
            If access came from the request body or the question text, a user could type
            themselves into the underwriter role — it&rsquo;s forgeable, because the user controls
            it. Deriving the filter <em>only</em> from verified token claims is what closes that
            hole. This is the single bug the whole post exists to prevent.
          </p>
        </div>

        <p style={{ ...p, margin: "18px 0 0" }}>
          <code style={code}>build_filter</code> fails closed on empty roles;{" "}
          <code style={code}>is_visible</code> is the one definition of &ldquo;allowed&rdquo; both stores
          share — the local store calls it directly, and the production store encodes the same
          scope + role test as a boolean filter query:
        </p>
        <CodeBlock code={BUILD_FILTER_PY} lang="python" filename="own_overview/security/access.py" />

        <p style={{ ...p, margin: "18px 0 0" }}>
          And the retrieve node uses it in exactly one place — the filter is derived from the
          identity, then pushed <em>into</em> the search call, not applied to the results
          afterward:
        </p>
        <CodeBlock code={RETRIEVE_PY} lang="python" filename="own_overview/pipeline/nodes/retrieve.py" />

        {/* ── NODE C — isolation ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>Isolation</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>Tenant and env are partition keys, not afterthoughts</h2>
        <p style={p}>
          The same scope check that stops role leaks stops one insurer from ever seeing
          another — and dev from ever leaking into prod. Every document, chunk and query
          carries a <code style={code}>TenantScope</code> (tenant + env), and the vector index
          is namespaced <code style={code}>tenant__env</code>.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Namespace = <code style={code}>tenant__env</code>.</strong> The index is
            partitioned by it, so <code style={code}>acme__prod</code> and{" "}
            <code style={code}>fjord__prod</code> don&rsquo;t share storage — a query for one can&rsquo;t
            reach the other.
          </li>
          <li style={li}>
            <strong>Scope is a mandatory filter.</strong> Retrieval always filters on scope —
            no scope, no results. There is no &ldquo;search across everything&rdquo; path to get wrong.
          </li>
          <li style={li}>
            <strong>Envs are isolated too.</strong> <code style={code}>dev</code>,{" "}
            <code style={code}>qa</code> and <code style={code}>prod</code> are separate scopes.
            A test document in <code style={code}>dev</code> can never surface in a{" "}
            <code style={code}>prod</code> answer.
          </li>
          <li style={li}>
            <strong>Deletes really delete.</strong> When the data lake sends a delete
            tombstone, the document leaves the index for that scope — a redacted claim stops
            being retrievable, the governance story that matters in insurance.
          </li>
        </ul>
        <CodeBlock code={TENANTSCOPE_PY} lang="python" filename="own_overview/contracts.py" />

        {/* ── why this matters (Callout) ── */}
        <div
          className="x-card"
          style={{ margin: "40px 0 0", padding: "22px 24px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.surface }}
        >
          <div style={{ ...eyebrow }}>Why this is the post that matters in a regulated insurer</div>
          <ul style={{ margin: "12px 0 0", paddingLeft: 20, maxWidth: "46em" }}>
            <li style={{ ...li, fontSize: 15.5 }}>
              <strong>Multi-tenant isolation is non-negotiable.</strong> A cloud RAG system
              serves many insurers across environments (dev/qa/prod). One insurer seeing
              another&rsquo;s claim isn&rsquo;t a bug, it&rsquo;s a breach. Making{" "}
              <code style={code}>tenant__env</code> the index partition key — so a query{" "}
              <em>can&rsquo;t</em> cross it — is the honest guarantee, not a{" "}
              <code style={code}>WHERE</code> clause you hope nobody forgets.
            </li>
            <li style={{ ...li, fontSize: 15.5 }}>
              <strong>CCPA / GDPR need auditability and deletion.</strong> &ldquo;Who accessed what,
              when, over which tenant&rdquo; has to be reconstructable — hence one append-only audit
              line per query. And when a record is redacted, the delete tombstone removes the
              document from retrieval, so a right-to-be-forgotten request actually takes effect.
            </li>
            <li style={{ ...li, fontSize: 15.5 }}>
              <strong>Least privilege at the data layer, not the UI.</strong> An adjuster, an
              underwriter and a broker see different things by role — enforced where the data is
              fetched, not by trusting a prompt or hiding a button.
            </li>
          </ul>
        </div>

        {/* ── clone this stage ── */}
        <div
          className="x-card"
          style={{ margin: "48px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
            Run it yourself · own-overview @ v4-access-control
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            Everything above is one stage of the repo. Check out this tag and the access filter
            is wired into the retrieve node — no cloud required, it runs against the local
            in-memory store. Ask the <em>same</em> question as two roles and watch the answer
            change with access, not with the prompt.
          </p>
          <CodeBlock code={CLONE_BASH} lang="bash" filename="terminal" />
          <p style={{ margin: "16px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            The <strong>broker</strong>&rsquo;s answer is grounded in the policy alone; the{" "}
            <strong>underwriter</strong>&rsquo;s cites the risk memo too. Nothing about the{" "}
            <em>question</em> changed — only the signed role did, and the retrieval filter did
            the rest.
          </p>
          <p style={{ margin: "18px 0 6px", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            Every answered query appends one JSON line to the audit log — who asked, over which
            tenant/env, which chunk ids were retrieved, and whether we answered or abstained. It
            logs chunk ids and the groundedness score, <strong>never</strong> the passage text —
            a trail, not a second copy of sensitive data:
          </p>
          <CodeBlock code={AUDIT_JSON} lang="json" filename="audit.log" />
          <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55, color: C.ghost, maxWidth: "46em" }}>
            Teaching-grade reference implementation, not a production insurance product. It
            reproduces the ideas; bring your own data and keys. MIT-licensed.
          </p>
        </div>

        {/* ── explain it back ── */}
        <h2 style={{ ...h2 }}>Explain it back</h2>
        <p style={p}>
          A teammate says: &ldquo;We already tell the model, in the system prompt, to never reveal
          anything the user isn&rsquo;t cleared for. Isn&rsquo;t that access control?&rdquo; What&rsquo;s wrong with
          that, in one breath?
        </p>
        <details style={{ margin: "16px 0 0", maxWidth: "42em" }}>
          <summary style={{ fontFamily: MONO, fontSize: 13, color: "var(--signal-fg)", cursor: "pointer" }}>
            Reveal a model answer
          </summary>
          <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.7, color: C.body, textWrap: "pretty" }}>
            By the time the model reads the system prompt, the restricted passage is{" "}
            <em>already in its context</em> — it was retrieved. &ldquo;Please don&rsquo;t say this&rdquo; is a
            request, not a boundary; models don&rsquo;t obey it reliably, and even a perfectly
            obedient model has still <em>processed</em> data the caller was never allowed to
            touch. Real access control keeps restricted data out of retrieval entirely: the
            filter is built from the caller&rsquo;s signed token (tenant, env, roles) and pushed into
            the query, so the restricted chunk is never returned, never seen, never leakable.
            Not-retrieved is the only safe state.
          </p>
        </details>

        {/* ── bridge → post 05 ── */}
        <Link
          href="/writing/your-ai-overview-grounding"
          className="x-card"
          style={{ display: "block", margin: "48px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
            Next in the series · 05
          </div>
          <div style={{ margin: "8px 0 0", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Grounding &amp; citations: answer only from what you retrieved
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.muted, maxWidth: "46em", textWrap: "pretty" }}>
            Now the model only receives passages the caller is allowed to read. The next job is
            making it <em>answer only from them</em> — every sentence tied to the file it came
            from, and an honest abstain when the passages don&rsquo;t support a claim.
          </p>
          <span className="x-hoverink" style={{ display: "inline-block", marginTop: 14, fontFamily: MONO, fontSize: 12, color: C.ink }}>
            Every answer cites the file it came from — or it abstains →
          </span>
        </Link>
      </article>

      <nav style={{ marginTop: 64, paddingTop: 20, borderTop: `1px solid ${C.ink}`, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <Link href="/writing/your-ai-overview-retrieval" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          ← Retrieve &amp; rerank
        </Link>
        <Link href="/writing/your-ai-overview-grounding" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          Grounding &amp; citations →
        </Link>
      </nav>
    </main>
  );
}
