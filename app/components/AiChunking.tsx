import Link from "next/link";
import { C, MONO, SANS, MAXW } from "../lib/site";
import CodeBlock from "./CodeBlock";
import ChunkViz from "./ChunkViz";

// "Your own AI Overview: chunking" — Production series, post 02. The one idea:
// chunking is a retrieval decision, not preprocessing. Split the answer across a
// boundary and no reranker, bigger model or better prompt can find it again.
// Prose is inline (editorial layer); the live chunker is a client component.

const CHIPS = [
  { n: "01", label: "Spine" },
  { n: "02", label: "Chunking", active: true },
  { n: "03", label: "Retrieve & rerank" },
  { n: "04", label: "Access control" },
  { n: "05", label: "Grounding & citations" },
  { n: "06", label: "Evals & guardrails" },
];

const CHUNKER_PY = `_DEFAULT_SIZE = 800
_DEFAULT_OVERLAP = 100


class NaiveChunker:
    """Fixed-size character window with overlap. Implements the Chunker Protocol."""

    def __init__(self, chunk_size: int = _DEFAULT_SIZE, overlap: int = _DEFAULT_OVERLAP) -> None:
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive")
        if not 0 <= overlap < chunk_size:
            raise ValueError("overlap must be in [0, chunk_size)")
        self.chunk_size = chunk_size
        self.overlap = overlap

    def split(self, doc: Document) -> list[Chunk]:
        text = doc.text or ""
        if not text.strip():
            return []

        step = self.chunk_size - self.overlap
        chunks: list[Chunk] = []
        start = 0
        idx = 0
        while start < len(text):
            piece = text[start : start + self.chunk_size]
            chunks.append(
                Chunk(
                    chunk_id=f"{doc.doc_id}#{idx}",
                    doc_id=doc.doc_id,
                    # Isolation + ACL metadata copied verbatim so the retrieval
                    # filter and citations keep working on the chunk.
                    scope=doc.scope,
                    doc_type=doc.doc_type,
                    source_id=doc.source_id,
                    text=piece,
                    acl_roles=doc.acl_roles,
                    updated_at=doc.updated_at,
                    metadata=dict(doc.metadata),
                )
            )
            idx += 1
            start += step
        return chunks`;

const PROTOCOL_PY = `@runtime_checkable
class Chunker(Protocol):
    """Splits a Document into retrievable Chunks. The naive splitter ships in
    the spine; structure-aware splitting is its own deep-dive post."""

    def split(self, doc: Document) -> list[Chunk]: ...`;

const CLONE_BASH = `git clone https://github.com/xaviramirezcom/open-ai-overview
cd open-ai-overview
git checkout v2-chunking

# local, zero-cloud mode — no keys, no AWS. Split the sample note and print
# each chunk's char range plus which chunk holds the answer sentence.
uv run python -m own_overview.demo.chunking \\
    --doc samples/pol-55012.txt --size 800 --overlap 100`;

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
const codeInline = { fontFamily: MONO, fontSize: "0.9em" } as const;

export default function AiChunking() {
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
          href="/writing/your-ai-overview-spine"
          className="x-hoverink"
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}
        >
          ← Your own AI Overview: the spine
        </Link>
        <p style={{ margin: "22px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
          Your own AI Overview · 02
        </p>
        <h1 style={{ margin: "10px 0 0", fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 500, maxWidth: "18em" }}>
          Your own AI Overview: chunking
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: 19, lineHeight: 1.6, color: C.muted, maxWidth: "34em", textWrap: "pretty" }}>
          Split the document wrong and you lose the answer.
        </p>
        <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          Before anything gets retrieved, the document is chopped into passages. That chop is
          the most under-rated decision in retrieval: a <strong>chunk</strong> is the smallest
          thing search can hand back, so if the sentence that says{" "}
          <em>&ldquo;premium increased 18% following claim 88431&rdquo;</em> lands half in one chunk and
          half in the next, neither chunk answers the question. Here you drive the chunker
          yourself over a real underwriting note and watch the answer survive — or get cut.
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
          ↳ You are here — the split that decides what&rsquo;s findable. Post 01 built the whole
          spine; this post deepens the chunking stage.
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

        {/* ── NODE A — the split ── */}
        <p style={{ ...eyebrow, margin: "48px 0 0" }}>The split</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>The chunk you keep is the answer you can find</h2>
        <p style={p}>
          Drag the two knobs and watch the same underwriting note re-chop live. The question
          only gets answered when its evidence lands inside a single chunk.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>A chunk is the unit of retrieval.</strong> Search returns whole chunks, never
            half of one. Whatever the split leaves stranded, the system can&rsquo;t hand back.
          </li>
          <li style={li}>
            <strong>Size is a trade-off.</strong> Too small and the answer spans several chunks, so
            no single passage carries the full fact. Too large and each chunk is mostly noise,
            which dilutes the match and burns the model&rsquo;s context budget.
          </li>
          <li style={li}>
            <strong>Overlap is the safety net.</strong> Chunks share a few characters at their edges,
            so a fact sitting on a boundary still lands <em>whole</em> in at least one neighbour. It
            costs storage; it buys recall.
          </li>
          <li style={li}>
            <strong>This is decided once, upstream.</strong> Nothing downstream — reranking, a bigger
            model, a smarter prompt — can rejoin a fact the split already tore apart.
          </li>
        </ul>

        <div style={{ margin: "24px 0 0" }}>
          <ChunkViz />
        </div>

        <div
          style={{
            margin: "22px 0 0",
            padding: "16px 18px",
            borderLeft: `2px solid var(--signal)`,
            background: "var(--signal-wash)",
            borderRadius: "0 10px 10px 0",
          }}
        >
          <div style={{ ...eyebrow, color: "var(--signal-fg)" }}>Why overlap earns its storage</div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "44em", textWrap: "pretty" }}>
            Set overlap to <code style={codeInline}>0</code> and shrink the chunk size until a
            boundary lands inside the answer sentence — the verdict flips to <em>split</em>. Now nudge
            overlap up: the same fact reappears whole in the next chunk, because neighbours share
            their edges. That shared margin is cheap insurance against a fact falling on a seam.
          </p>
        </div>

        {/* ── NODE B — naive vs structure-aware ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>Two ways to cut</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>Cut by character count, or cut where the meaning changes</h2>
        <p style={p}>
          The baseline counts characters. The upgrade cuts on the document&rsquo;s own structure — and
          that changes what each chunk is <em>about</em>.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Naive = fixed-size window.</strong> Slide an 800-character window across the raw
            text with a little overlap. Simple, fast, and blind to meaning — a chunk can start
            mid-sentence and mix the roof detail with the premium reason.
          </li>
          <li style={li}>
            <strong>Structure-aware = cut on the document&rsquo;s seams.</strong> Split on the record&rsquo;s
            real boundaries: headings and paragraphs for a prose claim note, fields for a structured
            policy record. Each chunk becomes one coherent thing.
          </li>
          <li style={li}>
            <strong>Same evidence, cleaner packaging.</strong> Structure-aware chunks put &ldquo;premium
            change + reason&rdquo; in one passage and &ldquo;roof / mitigation&rdquo; in another, so the reason
            isn&rsquo;t diluted by unrelated facts.
          </li>
          <li style={li}>
            <strong>It&rsquo;s still the honest baseline first.</strong> The spine ships naive on
            purpose — it&rsquo;s the measurable floor. Structure-aware is the upgrade you reach for when
            retrieval quality needs it, not a reflex.
          </li>
        </ul>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", margin: "24px 0 0" }}>
          {/* naive card */}
          <div style={{ border: `1px solid ${C.hair}`, borderRadius: 12, background: C.bg, padding: "16px 18px" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint }}>
              Naive · fixed-size window
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <SplitBlock topics={["end of coverage", "start of premium reason"]} note="chunk 2 = two topics" mixed />
              <PlainBlock label="chunk 3" topic="premium reason + roof note" tint="var(--tok-sub)" />
              <PlainBlock label="chunk 4" topic="recommendation + billing" tint="var(--tok-num)" />
            </div>
            <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: C.faint }}>
              A single window straddles two unrelated topics — the match for &ldquo;why did premium
              rise&rdquo; is diluted by coverage text it happened to include.
            </p>
          </div>
          {/* structure-aware card */}
          <div style={{ border: `1px solid var(--signal-fg)`, borderRadius: 12, background: "var(--signal-wash)", padding: "16px 18px" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
              Structure-aware · cut on seams
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <PlainBlock label="loss history" topic="claim 88431 · water damage" tint="var(--tok-word)" />
              <PlainBlock label="rating decision" topic="premium +18% · the reason" tint="var(--signal)" strong />
              <PlainBlock label="recommendation" topic="leak-detection discount" tint="var(--tok-punct)" />
            </div>
            <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: "var(--signal-fg)" }}>
              Each chunk is about one thing. The &ldquo;rating decision&rdquo; chunk is the reason and
              nothing else — easy to retrieve, easy to cite.
            </p>
          </div>
        </div>
        <p style={{ ...p, margin: "18px 0 0" }}>
          Both strategies split the exact same document. The naive window is blind to meaning, so
          some chunks mix topics and dilute the match. Cutting on the document&rsquo;s own structure
          gives you chunks that are each about one thing — easier to retrieve and easier to cite.
          The spine ships only the naive splitter today; structure-aware is the upgrade this post
          argues for, not shipped code.
        </p>

        {/* ── NODE C — metadata rides along ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>What rides along</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>A chunk carries its document&rsquo;s guardrails, not just its words</h2>
        <p style={p}>
          When you cut a document into chunks, each piece has to keep the labels that say{" "}
          <em>who can see it</em> and <em>where it came from</em> — or you&rsquo;ve quietly broken
          security and citations.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Provenance rides along.</strong> Every chunk keeps its{" "}
            <code style={codeInline}>source_id</code> (e.g. <code style={codeInline}>claim/88431</code>)
            so any answer built from it can cite the exact record it came from.
          </li>
          <li style={li}>
            <strong>Isolation rides along.</strong> Every chunk keeps its{" "}
            <code style={codeInline}>scope</code> — the tenant + environment — so one insurer&rsquo;s
            data and dev/prod never blur together at search time.
          </li>
          <li style={li}>
            <strong>Permissions ride along.</strong> Every chunk keeps its{" "}
            <code style={codeInline}>acl_roles</code>, so a passage from an underwriter-only memo
            stays underwriter-only after it&rsquo;s been split.
          </li>
          <li style={li}>
            <strong>Lose any of these and the split silently leaks.</strong> A chunk with no roles is
            a chunk the filter can&rsquo;t gate; a chunk with no <code style={codeInline}>source_id</code>{" "}
            is an answer you can&rsquo;t trace.
          </li>
        </ul>
        <p style={{ ...p, margin: "18px 0 0" }}>
          That&rsquo;s why the real splitter copies <code style={codeInline}>scope</code>,{" "}
          <code style={codeInline}>doc_type</code>, <code style={codeInline}>source_id</code>,{" "}
          <code style={codeInline}>acl_roles</code> and <code style={codeInline}>updated_at</code> onto
          every chunk verbatim — it isn&rsquo;t incidental, it&rsquo;s what lets the retrieval filter run
          in the query and every answer cite its source. Chunking preserves the guardrails; it
          doesn&rsquo;t just cut the text. That thread — permissions enforced at retrieval — is what
          Post 04 pulls on.
        </p>

        {/* ── clone this stage ── */}
        <div
          className="x-card"
          style={{ margin: "56px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
            Run it yourself · own-overview @ v2-chunking
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            This isn&rsquo;t pseudocode. The spine ships <code style={codeInline}>NaiveChunker</code>: a
            fixed-size character window with overlap that copies each document&rsquo;s isolation and ACL
            metadata onto every chunk, so the rest of the pipeline keeps working. Check out the tag
            and read the whole thing — it&rsquo;s about 40 lines.
          </p>
          <CodeBlock code={CLONE_BASH} lang="bash" filename="terminal" />
          <p style={{ margin: "16px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            The whole chunker is the fixed window you just drove, plus the metadata copy that keeps
            each chunk filterable and citable:
          </p>
          <CodeBlock code={CHUNKER_PY} lang="python" filename="pipeline/chunk.py" />
          <p style={{ margin: "16px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            It implements one small <code style={codeInline}>Chunker</code> Protocol, so swapping in a
            structure-aware splitter later is a one-line change in the wiring — nothing else in the
            pipeline moves:
          </p>
          <CodeBlock code={PROTOCOL_PY} lang="python" filename="pipeline/contracts.py" />
          <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55, color: C.ghost, maxWidth: "46em" }}>
            Teaching-grade reference implementation, not a production insurance product. Only the
            naive splitter ships at this tag; structure-aware chunking is the argued next step, not
            shipped code. Bring your own data and keys. MIT-licensed. The demo command splits the
            sample note locally and prints which chunk holds the answer — illustrative, and it runs.
          </p>
        </div>

        {/* ── explain it back ── */}
        <h2 style={{ ...h2 }}>Explain it back</h2>
        <p style={p}>
          A teammate says: <em>&ldquo;Chunking is just preprocessing — we&rsquo;ll tune it later once
          retrieval and the model are good.&rdquo;</em> In one or two sentences, why is that backwards?
        </p>
        <details style={{ margin: "16px 0 0", maxWidth: "42em" }}>
          <summary style={{ fontFamily: MONO, fontSize: 13, color: "var(--signal-fg)", cursor: "pointer" }}>
            Reveal a model answer
          </summary>
          <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.7, color: C.body, textWrap: "pretty" }}>
            Chunking isn&rsquo;t downstream of retrieval — it <em>defines</em> what retrieval can return,
            because a chunk is the smallest unit search can hand back. If the split tore the answer
            across a boundary, it&rsquo;s already gone: no reranker, bigger model or better prompt can
            retrieve a passage that was never stored whole. Chunking is the <em>first</em> thing to get
            right, not the last — a retrieval decision, not preprocessing.
          </p>
        </details>

        {/* ── bridge → post 03 ── */}
        <Link
          href="/writing/your-ai-overview-retrieval"
          className="x-card"
          style={{ display: "block", margin: "48px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
            Next in the series · 03
          </div>
          <div style={{ margin: "8px 0 0", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Retrieve &amp; rerank: dense recall finds candidates; reranking decides the answer
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.muted, maxWidth: "46em", textWrap: "pretty" }}>
            Now the document is split into clean, self-contained, permission-carrying chunks. Next we
            go find them: turn the question into a vector, pull the closest chunks out of the store,
            then rerank so the passage that actually answers the question rises to the top of a small
            context budget. Good chunks make retrieval possible — the next post makes it precise.
          </p>
          <span className="x-hoverink" style={{ display: "inline-block", marginTop: 14, fontFamily: MONO, fontSize: 12, color: C.ink }}>
            Continue to Retrieve &amp; rerank →
          </span>
        </Link>
      </article>

      <nav style={{ marginTop: 64, paddingTop: 20, borderTop: `1px solid ${C.ink}`, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <Link href="/writing/your-ai-overview-spine" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          ← Your own AI Overview: the spine
        </Link>
        <Link href="/writing" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          All writing →
        </Link>
      </nav>
    </main>
  );
}

// Small labelled chunk block for the naive-vs-structure comparison cards.
function PlainBlock({
  label,
  topic,
  tint,
  strong,
}: {
  label: string;
  topic: string;
  tint: string;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${strong ? "var(--signal-fg)" : C.hair}`,
        borderLeft: `4px solid ${tint}`,
        background: C.bg,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 12, color: C.body }}>{topic}</span>
    </div>
  );
}

// A block that visibly mixes two topics (the naive window straddling a seam).
function SplitBlock({ topics, note, mixed }: { topics: [string, string]; note: string; mixed?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${C.hair}`,
        background: `linear-gradient(90deg, color-mix(in srgb, var(--tok-num) 16%, ${C.bg}) 0 50%, color-mix(in srgb, var(--tok-byte) 16%, ${C.bg}) 50% 100%)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--tok-num)" }}>{topics[0]}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: mixed ? "var(--tok-byte)" : C.body }}>│</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--tok-byte)" }}>{topics[1]}</span>
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11, color: C.faint }}>{note}</span>
    </div>
  );
}
