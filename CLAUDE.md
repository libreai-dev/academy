# CLAUDE.md — libreai Academy

Guidance for Claude working in this repo. **academy.libreai.dev** — an interactive,
bilingual (English + Spanish) guided roadmap that takes a software engineer with
**no AI background** to AI-native engineer across six stages. Part of the
libreai.dev umbrella — the living expression of the **Accessible** pillar.

> **Responsive-first is non-negotiable.** Every implementation — lessons,
> interactives, diagrams, chrome — is authored **mobile-first** and must work and
> look right from ~360px up to wide desktop before it's considered done. Design
> the small-screen layout first, then enhance for larger viewports; never ship a
> desktop layout that merely "sort of" reflows. Test at narrow widths every time.

## The golden rules — every lesson/document you build MUST be:

1. **Interactive-first.** The centerpiece of a lesson is something the learner
   *plays with*, not paragraphs. Lead with the interactive; use prose to support
   it. If a concept can be a slider, a playground, a visualization, or a
   click-through diagram, build that — never a wall of text.
2. **Easy to understand — write like a Google "AI Overview".** Plain, everyday
   language and short sentences; the fewest words that answer the question.
   **One idea per lesson**, in a clear beginning→middle→end order. Frame new ideas
   against things an engineer already knows (a model is a function you *fit* to
   data; embeddings are meaning hashed into vectors).
   - **No unexplained jargon and no unearned concepts.** Every technical term is
     either explained in one plain clause the first time it appears, or cut. Never
     name-drop a method, format, or acronym the node doesn't actually teach —
     if it's not on the learning path, leave it out.
   - **No rabbit holes.** Stay on the single thread; don't branch into tangents or
     "by the way" asides. Depth/math goes in an optional, collapsed **"Go deeper"**
     block, never in the main flow. If a sentence makes the reader stop and ask
     "wait, what's that?", rewrite or remove it.
3. **Responsive.** Mobile-first. Everything works and looks right from ~360px to
   wide desktop. On small screens the lesson left-rail collapses; interactives
   reflow, never overflow. Test at narrow widths.
4. **Bilingual (EN / ES).** Both languages are authored in full — neither is
   primary. **All user-facing text comes from `app/lib/copy.ts`** and is read via
   the language context; never hardcode a string in a component. Adding a lesson
   means adding its EN *and* ES copy.
5. **Accessible (WCAG AA).** Semantic HTML, keyboard-operable interactives,
   visible focus, sufficient contrast in **both** themes, `alt`/`aria` labels,
   and respect `prefers-reduced-motion`.
6. **On-brand, light + dark.** Use the CSS design tokens in `app/globals.css`
   (`:root` / `:root[data-theme="dark"]`) — never hardcode colors. Match the
   marketing site's warm palette and the three fonts already wired up.

## Stack & structure
- **Next.js 15 (App Router) · React 19 · TypeScript.** No other framework.
- `app/providers.tsx` — client context holding **theme** (light/dark) and
  **language** (EN/ES); both persist to `localStorage` and apply before first
  paint (no-flash script in `app/layout.tsx`). Read them; don't reinvent them.
- `app/lib/copy.ts` — the typed EN/ES copy assembler + the stage list; the
  **single entry point for text** (`COPY[lang]`, read via context). Scroll-driven
  articles keep their own copy in `app/lib/copy/<slug>.ts` and are imported here;
  see "Copy & data split".
- `app/lib/tokenize.ts` — the client-side tokenizer behind the Tokens lesson;
  the pattern for a lesson's interactive logic living in `lib/`.
- `app/components/` — `Header`, `Footer`, `Home` (roadmap), `Tokens` (the lesson
  pattern to copy). Fonts: Space Grotesk / Instrument Sans / JetBrains Mono via
  `next/font/google`.
- Routes: `/` (roadmap home), `/stage/<n>/<lesson>` (a lesson). Content spec for
  every stage & lesson lives in `../docs/academy/` (the roadmap) — build from it.

## Anatomy of a lesson (follow this order)
1. **Concept** — a few short paragraphs, plain language + an engineer analogy.
2. **The interactive** — the working centerpiece (see below).
3. **"Explain it back"** — a short prompt with a reveal-able model answer.
4. **"Go deeper"** — optional, collapsed by default (math/theory).
5. **Navigation** — prev/next lesson + "mark complete".
All copy for 1–5 in both languages, in `copy.ts`.

## Adding a new lesson (checklist)
1. Read its spec in `../docs/academy/stage-<n>-*.md`.
2. Add EN + ES copy to `app/lib/copy.ts` (typed).
3. Put interactive logic in `app/lib/<name>.ts` (pure, testable, no React).
4. Build the lesson component in `app/components/` (a **client component** —
   `"use client"` — since it's interactive), reading copy + theme + language
   from context, styled only with design tokens.
5. Add the route `app/stage/<n>/<lesson>/page.tsx`.
6. Add it to the stage's lesson list so the roadmap and rail update.
7. Verify: works at 360px, keyboard-navigable, both themes, both languages,
   `npm run lint` clean, `npm run build` passes.

## Building interactives
- **Every visualisation is built with d3 — never hand-authored SVG.** Charts,
  graphs, network diagrams, decision surfaces, anything visual: draw it with d3
  (`d3.select` into one mount element, data-joins, `.attr`, `.transition`,
  `d3.interval`), exactly like `drawSchematic` / `HeroNet` / `drawNextWordNet`.
  Do **not** hand-write static `<svg>` shape markup, and do **not** render trees
  of React `<rect>` / `<line>` / `<circle>` / `<path>` as the visual. The single
  empty `<svg ref={…}>` (or `<canvas>`) that d3 selects into is the *mount*, and
  is expected — authoring the shapes yourself in JSX is what's banned. Keep the
  drawing function pure-ish (`draw(el, opts)`), call it from an effect, and
  return its cleanup (stop timers/transitions). This keeps motion, theming, and
  interaction consistent across lessons.
- **Runs in the browser, no backend.** For live model behavior use
  **transformers.js / WebLLM**; for Python use **Pyodide**. Keep heavy libs
  lazy-loaded and behind a loading state so first paint stays fast.
- Prefer small, self-contained, deterministic demos. Show state changing live
  (typing → tokens, slider → output). Give every control a label.
- Keep the logic in `lib/` and the rendering in the component.

## Do / don't
- **Do** keep dependencies minimal — justify anything beyond Next/React/TS and
  the in-browser model/runtime libs.
- **Do** keep both languages in sync in the same PR.
- **Don't** hardcode strings or colors; don't add a server/API for something a
  client interactive can do; don't ship a lesson that's mostly prose.

## Commands
```bash
npm run dev     # http://localhost:3000
npm run build   # must pass before shipping
npm run lint    # must be clean
```

## Open items
- `GITHUB_URL` in `app/lib/copy.ts` is a placeholder (`libreai-dev`) pending the
  finalised org handle.

## Lesson build patterns — match the Tokens lesson

`app/components/Tokens.tsx` is the **reference implementation**. New lessons
should hit its quality bar and reuse its patterns rather than reinventing them.

- **Real engines, not mocks.** When a real in-browser library exists, prefer it
  over a hand-rolled fake so the interactive is honest. Approved and installed:
  - **`js-tiktoken`** — the real GPT tokenizer. `app/lib/tokenizer.ts` already
    wraps it (o200k / cl100k, per-token decode, kind classifier, cost, random
    entries). **Reuse `app/lib/tokenizer.ts`** for anything token-related (the
    Data lesson uses it to tokenize a sample and show the token tape).
  - **`d3`** — real data visualisations (scales, selections, transitions).
  These are deliberate, justified exceptions to "minimal dependencies" — reuse
  them; don't re-justify or add competing libs.
- **Heavy libs: lazy-load + per-page split + lite imports.** Dynamic-`import()`
  big engines inside an effect behind a loading state, so first paint is fast and
  the chunk only ships on that page. For js-tiktoken prefer
  `js-tiktoken/lite` + `js-tiktoken/ranks/<name>` so only the vocab you use ships
  (~1.1 MB gz for o200k) instead of all encodings (~2.5 MB gz). Import only the
  d3 submodules you use.
- **Lesson interactive shape** (adapt, don't copy blindly): an animated **hero
  flow** that paints instantly (hardcode a real precomputed example so it doesn't
  wait on the engine) -> a few short concept paragraphs -> the **interactive
  centerpiece** the learner drives (a live calculator / playground) -> **"see it
  break" presets** (one-tap examples, each with a one-line takeaway) -> a
  supporting **d3** visualisation -> explain-it-back -> go-deeper (collapsed) ->
  a **bridge card** that links to and teases the next lesson -> nav.
- **Motion & colour discipline.** Gate every animation on
  `prefers-reduced-motion` (count-ups, staggers, d3 transitions, bobs). Colour
  only via design tokens — categorical colours live in `globals.css` (see the
  `--tok-*` tokens), tuned for WCAG AA in **both** themes; never hardcode a hue
  in a component.
- **Logic in `app/lib/`**, rendering in the component; all copy in `copy.ts` in
  **both** languages; every interactive control labelled and keyboard-operable.

## Scroll-driven articles — the LLM Fundamentals track (match the Web-scale ingestion lesson)

There are **two lesson formats**. Short single-idea lessons follow the Tokens
pattern above. The deep **Stage 0 · LLM Fundamentals** curriculum
(`../docs/academy/llm-fundamentals-outline.md` — Phases 0–4: how LLMs are built,
trained, run, aligned) uses a second format: longer, **diagram-dense articles made
of scroll-scrubbed "live diagram" nodes.** The **reference implementation is the
Web-scale ingestion lesson** — copy its patterns; don't reinvent them.

**When the user asks for "the next article"** (e.g. 0.1b), they'll usually supply a
detailed per-article guide (nodes, visuals, interactive labs — like the "Phase
0.1a" doc). That guide + this section + the outline is everything you need. If no
guide is given, derive the nodes from the outline and confirm scope briefly.

### Reference files (reuse these — the scene engine is already built)
- `app/components/WebScale.tsx` — a whole article: hero (mono eyebrow + big title +
  lede + a **pipeline chip grid** linking to each node) → N **nodes** →
  explain-it-back → a **bridge** card → prev/next nav.
- `app/components/webscale-kit.tsx` — **shared scene chrome; import, don't rebuild**:
  `SceneShell`, `useSceneStep`, `Stepper`, `Readout`, `Toggle`, `ControlRow`,
  `Slider`.
- `app/lib/webscale.ts` — pure per-node logic + data (no React, no d3).
- `app/lib/copy/webscale.ts` — the article's copy in **its own module**: a
  `WebScaleLesson` interface + `webScaleEN` / `webScaleES` consts. `copy.ts`
  imports it and references `webScale: webScaleEN` inside `COPY`. **Each article
  owns a `app/lib/copy/<slug>.ts` file — never add copy to the big `copy.ts`
  object** (that shared blob caused cross-session edit collisions). See "Copy &
  data split" below.
- `app/stage/0/web-scale-ingestion/page.tsx` — the route (`<Header/> <Lesson/> <Footer/>`).

### Anatomy of a node (one idea each; a handful of nodes per article)
`SceneShell` renders: **eyebrow + title + a one-line `intro` + scannable `bullets`** →
the live diagram → the `↳` `hint` + **controls** the learner drives → a plain-language
**`note`** explaining the current selection → an ink terminal **`Readout`**. You
provide per node: `eyebrow`, `title`, `intro`, `bullets[]`, `cardLabel`, `aria`,
`steps`, `captions[]`, `hint`, `optionNotes[]`, `readoutNote`, `controls`, `note`,
`readout`, and a `(step) => …` diagram child (an `<svg>` d3 mount, or HTML panels for
text-vs-text comparisons). `aside` slots a `Callout` above the interactive. **The
"Node UX" rules below are non-negotiable defaults** — they came straight from review.

### The scene engine (responsive-first — this is the non-negotiable part)
- `useSceneStep` **measures the card** and picks the mode: **fits under the header →
  it pins (sticky) and scrubs steps on scroll (desktop); doesn't fit → it stays in
  normal flow and the `‹ ›` stepper drives the steps (phones / short windows).**
  Never pin a card taller than the viewport — the readout would fall below the fold.
  Both paths are keyboard-operable and reduced-motion-safe. Just use `SceneShell`;
  it handles this.
- Steps are indices `0..N-1`; the diagram + readout redraw per step **and** per
  control state.
- **Scroll-cycling a button group is the default interaction** for a live node with a
  segmented control (tiers, parsers, bots, payloads, modes). Wire it with
  `steps={N} hideStepper onStep={(s)=>{ if(!manual.current) setSel(opts[s]); manual.current=false; }}`
  (a `const manual = useRef(false)`), and each button's onClick pins the choice
  (`setSel(x); manual.current=true`). The demo plays itself as you scroll; a click
  lets the learner take over until the next scroll. Default the state to `opts[0]`.

### Node UX — review-hardened rules (apply to every node, every article)
1. **Scannable + plain-language ("AI Overview" voice).** One short `intro` sentence +
   3–4 `bullets` with **bold lead-ins** — the fewest words that land the idea, in a
   clear order. Turn any enumeration ("the 4 tiers") into its own bullets. **Explain
   or cut every technical term** (one plain clause on first use, or a `Deeper`/term
   aside) — never introduce a concept, format, or acronym the node doesn't teach, and
   don't send the reader down a rabbit hole. Math/edge detail lives in a collapsed
   `Deeper` block, not the main flow.
2. **Controls are the interaction; minimise steps.** Prefer a **single live view**
   driven by toggles/sliders (`steps: 1`). Add a before→after step *only* when it
   genuinely clarifies — never a 4–5-step scrub for its own sake.
3. **Scroll-cycle the button groups** (see the scene engine above) — the expected
   default, not a special case.
4. **Explain every control on interaction.** Pass `note={optionNotes[i]}` — a plain
   "what this option means / what happens" line, rendered right by the buttons. The
   `↳ hint` sits by the controls too, never buried below the card.
5. **Default to NO terminal readout.** The dark instrument `Readout` almost always
   repeats what the diagram + `note` already show and reads as noise (reviewers cross
   it out on sight). Prefer `readout={null}` and surface the outcome **inside the
   diagram** — e.g. label the final step "kept X · dropped Y". Add a readout back only
   for a genuinely useful number the diagram can't show, and keep it to ≤3 rows + a
   one-sentence legend.
6. **Diagrams must communicate instantly, not cleverly.** No abstract/opaque graphics
   (log axes, S-curves, multi-lane "internet" schematics, token-grid abstractions,
   scatter/cluster maps). Prefer **side-by-side comparison cards** (RAG vs retrain),
   **before/after the same object** ("what you see" vs "what the model reads"), and
   **literal flows** (bot → gate → verdict). If a graphic needs a paragraph to decode,
   redesign it.
7. **Two methods → two small graphics, not one toggle.** When a node contrasts
   technique A vs B (SHA-256 vs suffix-array, naive vs vision parse, paraphrase vs full
   rewrite), draw **both** as small labelled panels under the concept, side by side.
   Don't hide one behind a toggle the reader has to discover.
8. **Explain what a step removes, in the step itself.** For a keep/drop or clean-up
   diagram, the second step should *show and say* what left ("broken.py dropped — won't
   parse") — that replaces the readout, it doesn't need both.
9. **Teach the idea, not the named algorithm — and cut deep-technique nodes.** Lead with
   what a thing *does* in plain words; the technique's name is parenthetical at most
   (a "fuzzy near-duplicate finder", not a MinHash/LSH tutorial). If a node's only
   content is a named algorithm and its knobs with no plain-language payoff (an LSH
   S-curve, a τ-temperature formula, a shingle-signature builder), **cut the node or
   fold its point into a sibling.** Never surface a term (epoch, embedding, τ,
   shingling, LaTeX, AST, Jaccard) without one plain clause defining it right there.
10. **Selected controls must look selected.** The active toggle/preset needs an
    unmistakable state — border + `--signal-wash` + weight. A faint outline isn't enough.
11. **No duplicated visuals.** Don't show the same before/after twice (once as the
    concept illustration, once as the interactive) — pick one.
12. **One label per interactive** — a single `cardLabel`; never repeat it as a frame label.
13. **Reference vs. control.** Show reference material (a `robots.txt`, a config)
    **read-only** (a styled `<pre>`), not an editable field — editing is a control only
    when editing *is* the lesson.
14. **Meaningful labels.** Buttons and step/chip titles read as plain intent
    ("Try GPTBot", "How little is text"), never internal jargon ("SEND", "Frontier").
15. **Show the interesting state first** where it teaches (e.g. the injection sanitiser
    **off by default** so the attack lands, then the learner switches it on).
16. **Link terms + tie text to the visual.** Real `[text](url)` links for named things
    (PageRank, Wikipedia, court cases, products); the inline `{ring}` green dot connects
    body copy to a green element in the diagram.
17. **Rich context goes in `Callout` panels**, not inline prose — facts, background,
    legal notes.

### Diagrams
- Every diagram is **one empty `<svg>` mount d3 draws into** (the global d3 rule
  above). Redraw keyed on `[step, ...state, reduce]`; set colour via `.style()` so
  tokens + theme flips resolve live; use a `viewBox` + `width:100%;height:auto` so
  it scales (no fixed pixel sizes); gate transitions on reduced motion.
- **Font floor:** diagram text is in viewBox units and shrinks when the svg scales
  down on phones, so keep a floor of **≥12px** for labels (≥13–16px for values /
  headings). Never drop below 12px. If bigger text collides, widen the viewBox or
  drop the label — don't shrink it.

### Visual system (already in `globals.css` — reuse, never hardcode)
- **Signal green** — `--signal` (graphics/controls/`accentColor`), `--signal-fg`
  (AA-safe green **text** on page backgrounds), `--signal-wash` (active toggle).
- **Instrument readout** — an ink terminal surface that stays dark in both themes:
  `--readout-bg/-border/-fg/-muted/-signal`. Always render it with the `Readout`
  component (title + `{k, v, hi?}` rows).
- Categorical kinds reuse the existing `--tok-*` tokens.

### Copy & data split
- **One copy module per article — `app/lib/copy/<slug>.ts`.** It exports the
  article's `<Name>Lesson` interface + `<slug>EN` / `<slug>ES` consts (full EN
  and ES parity). `app/lib/copy.ts` is only an **assembler**: it imports each
  module, references it inside `COPY` (`webScale: webScaleEN`, …), and re-exports
  the article types (so `import … from "../lib/copy"` keeps working). The shared
  node shape `WsNodeCopy` lives in `app/lib/copy/shared.ts`. **Never add a new
  article's copy to the inline `COPY` object** — that single shared blob is what
  caused two sessions to clobber each other's edits. (Stage-1 lessons predate
  this split and are still inline; extract them the same way when convenient.)
- **All prose lives in that copy module, both languages**: titles, intro,
  bullets, captions, hints, readout **row labels**, control/button labels,
  explain-it-back, bridge. Only code-literal strings may be shared constants in
  `lib/` (robots.txt bodies, hex offsets, proper-noun bot/parser names,
  `WARC/WAT/WET`, `.bin/.idx`).
- Keep numbers realistic-but-illustrative; when a figure is a stand-in, say so.

### Checklist for the next article
1. Read its per-article guide + `../docs/academy/llm-fundamentals-outline.md`.
2. `app/lib/<slug>.ts` — pure logic/data per node.
3. `app/lib/copy/<slug>.ts` — a `<Name>Lesson` interface + `<slug>EN`/`<slug>ES`
   consts (import `WsNodeCopy` from `./shared`). Then in `copy.ts`: add the
   import, add `<name>: <Name>Lesson` to the `Copy` interface, reference
   `<name>: <slug>EN` / `<slug>ES` in `COPY`, and re-export the type. **Don't
   grow the inline `COPY` object.**
4. `app/components/<Name>.tsx` — compose `SceneShell` per node; one `<svg>` d3 mount
   each; controls + `Readout`.
5. `app/stage/0/<slug>/page.tsx` — the route.
6. **Wire it in**: point the previous article's "Continue to …" nav at the new
   route (and/or a home featured card).
7. Verify: 360px + desktop, both themes, both languages, stepper works,
   `npm run lint` + `npm run build` pass.
