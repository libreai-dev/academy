# Handoff — Data + Bias lessons (Stage 1) — build in Claude Code

Continue in a **local Claude Code session** in
`/Users/xaviramirez/code/libreai.dev/academy`. The **Tokens** lesson is built
(see `HANDOFF-TOKENS.md`); reuse its patterns, now codified in `CLAUDE.md` ->
**"Lesson build patterns — match the Tokens lesson."** Two new lessons to build,
in order: **Data**, then **Bias**.

## Updated Stage 1 order (target)

`Life of an LLM` (map) -> **`Tokens`** [done] -> **`Data`** -> **`Bias`** ->
`Neural networks` -> `How training works` -> `Embeddings` -> `Transformers` ->
`Pretraining -> alignment`.

### Reorder chores (do these first)
- In `copy.ts`, change `stage1List` to put **Tokens before Data** and add
  **Bias**, i.e.:
  `["The life of an LLM","Tokens","Data","Bias","Neural networks","How training works","Embeddings","Transformers","Pretraining -> alignment"]`
  (EN and ES).
- Bump `stage1Label` from `"STAGE 1 · 8 LESSONS"` to `9 LESSONS` (EN + ES).
- Fix the rail **current-index** in every lesson component — it's a hardcoded
  index. `Tokens.tsx` currently uses `const current = i === 2;` and marks
  `i < 2` as done; after the reorder Tokens is index **1**, Data **2**, Bias
  **3**. Update each component's rail accordingly, plus prev/next labels
  (`t.prev` / `t.next`) so the chain reads Tokens <-> Data <-> Bias.
- The Tokens bridge card already links to `/stage/1/data`. Point Data's bridge
  at `/stage/1/bias`, and Bias's at the next lesson.

---

## LESSON 1: Data — "Gathering data: from a million pages to the token tape"

**Route:** `app/stage/1/data/page.tsx` + `app/components/Data.tsx`. **Copy:** a
`data` object in `copy.ts` (EN + ES). **Logic:** reuse `app/lib/tokenizer.ts`;
add `app/lib/dataset.ts` for the seeded sample docs + illustrative dedup/quality
scoring (pure, testable).

**Single idea:** raw web in -> a curated **token tape** out, and *the
throwing-away is the point.* Running example: **Wikipedia** (use it site-wide).

**Sections (lesson anatomy):**
1. **Hero flow** — one raw Wikipedia page (wikitext/HTML) -> clean text -> tokens
   -> integers. Reuse `tokenizer.ts`; hardcode the hero example for instant paint.
2. **Concept** (3 short paras) — where "knowledge" comes from (web, books, code,
   Wikipedia); quality beats raw size.
3. **Interactive A — "Clean this dataset"** *(centerpiece)*. ~15 seeded raw docs
   (good Wikipedia-style paragraphs, HTML boilerplate, spam, a couple of
   near-duplicates, one with an email/PII, one that is a benchmark question).
   Run it stage by stage, each dropping/altering cards with a live "docs kept /
   tokens kept" meter:
   - **Strip markup** -> HTML sheds tags to plain text; pure-boilerplate vanishes.
   - **Deduplicate** -> near-identical cards collapse ("94% similar -> keep 1";
     MinHash-style, illustrative). Note the memorization angle.
   - **Quality filter** -> spam/gibberish fade, each survivor shows a quality
     score (illustrative; heuristic + "textbook-like" classifier idea).
   - **Scrub PII / decontaminate** -> the email card and the benchmark card get
     flagged and dropped (don't train on the test).
   - **Tokenize** the survivors with the real `js-tiktoken`.
   - **Result meter** — "15 docs / ~40k raw tokens -> 6 docs / ~9k tokens." Punch:
     most of it was thrown away, and what's left is the model's world.
4. **Interactive B — Scale dial.** 1 page -> 1,000 -> 1,000,000; a live counter
   runs to ~1B tokens; render the **dense block** (a d3 grid of token cells,
   coloured by id, document-separator lines, hover = id + piece); storage
   (`uint16` -> GB) climbs alongside. Then a d3 bar: **all Wikipedia (~4B)** vs a
   **frontier corpus (~15T)** — Wikipedia is a sliver. Punch: that gap is why you
   crawl the whole web.
5. **Concept** — why store as a flat integer **tape**: the model only eats
   integers; tokenize once, read many times; fixed-width ints -> memory-mappable,
   O(1) random-access training samples; the document-separator token.
6. **Chicken-and-egg callback** — the tokenizer's dictionary (from the Tokens
   lesson) was itself *fit* (BPE merges) to a **sample of this cleaned corpus**,
   then applied to all of it. Closes the loop between the two lessons.
7. **Explain-it-back**, **go-deeper** (BPE vocab building / data mixing), and a
   **bridge card** -> Bias ("the data you just cleaned has a point of view").

**Concepts to cover:** sourcing & the **scale gap** (all Wikipedia ~= 4B tokens ~=
0.03% of 15T); extraction (markup -> text); **deduplication** (+ memorization);
**quality filtering** (heuristic + model classifier — "quality beats size");
**decontamination**; **PII scrubbing**; **data mixing / blend** (teach lightly —
don't claim a specific mix yields a specific skill); **storage as the token tape**
(sharding, doc-separator).

**Numbers to teach with (verified/realistic):** ~1,000 tokens per page; 1M pages
~= 1B tokens; all English Wikipedia ~= 4B; frontier corpus ~= 15T; `uint16` = 2
bytes for a <=65k vocab, `uint32` = 4 bytes for 100k+; 15T x 2 bytes ~= 30 TB.

**Honesty guardrails:** the dedup similarity and quality scores are
**illustrative** — say so on-screen. Don't imply the toy pile is real scale.

---

## LESSON 2: Bias — "The data has a point of view" (companion to Data)

**Route:** `app/stage/1/bias/page.tsx` + `app/components/Bias.tsx`. **Copy:** a
`bias` object in `copy.ts` (EN + ES).

**Single idea:** a model **mirrors its corpus's skews** — bias is the data's
statistics faithfully learned, and *every collection and cleaning choice is a
value choice.*

**Sections:**
1. **Concept** — a model is a compression of its corpus, so it inherits the
   corpus's skews. Not injected by anyone; learned.
2. **Interactive A — Representation meter.** Corpus composition (e.g. 90%+
   English, Global-North-skewed) shown next to world population — the
   "who's in the data vs. who's in the world" gap in one bar. On-mission.
3. **Interactive B — "Your filter has an opinion".** The *same* sentence in a
   formal Wikipedia register vs. an informal/dialect register -> different quality
   scores. Shows that the quality filter from the Data lesson encodes a norm.
   Write the examples **fairly** (never caricatures); label them illustrative.
4. **Teaser** — association bias hidden in co-occurrence stats; forward-reference
   Embeddings ("two lessons on, you'll *see* this as vector geometry").
5. **Mitigations (partial, debated)** — reweighting the mix, targeted collection
   for low-resource languages, documentation (datasheets / data statements),
   bias evals. There is **no unbiased corpus** — only choices.
6. **Explain-it-back**, bridge -> Neural networks.

**Evenhandedness guardrails (important):** teach the **mechanism** (skewed
sample -> skewed model) as fact; present "what's fair" and the fixes as genuinely
**debated**, not settled; avoid moralizing; keep register/dialect examples
respectful. Mission tie-in worth stating: English-centric data is *why* Spanish
costs more tokens **and** is modeled worse — the case for local / own-data
models, which is libreai's thesis.

---

## Build order & per-lesson verification
1. Reorder chores (stage1List, label, rail indices, prev/next).
2. Build **Data** (component + EN/ES copy + route + `dataset.ts`), reusing
   `tokenizer.ts` and the Tokens patterns from `CLAUDE.md`.
3. Build **Bias**.
4. Verify each: works at 360px, keyboard-navigable, light + dark, EN + ES,
   `prefers-reduced-motion` respected, `npm run lint` clean, `npm run build`
   passes.

## Files
- **New:** `app/components/Data.tsx`, `app/stage/1/data/page.tsx`,
  `app/components/Bias.tsx`, `app/stage/1/bias/page.tsx`, `app/lib/dataset.ts`.
- **Edit:** `app/lib/copy.ts` (add `data` + `bias` copy; reorder `stage1List`;
  bump lesson count), the rail current-index in each existing lesson component.

## Suggested first message for the local session
> "Read HANDOFF-DATA.md and CLAUDE.md. Do the Stage 1 reorder chores (Tokens
> before Data, add Bias), then build the Data lesson (Gathering -> token tape),
> reusing app/lib/tokenizer.ts, then the Bias lesson. Follow the Tokens-lesson
> patterns; run lint + build and QA each at 360px, light/dark, EN/ES, and
> reduced-motion."
