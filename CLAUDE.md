# CLAUDE.md — libreai Academy

Guidance for Claude working in this repo. **academy.libreai.dev** — an interactive,
bilingual (English + Spanish) guided roadmap that takes a software engineer with
**no AI background** to AI-native engineer across six stages. Part of the
libreai.dev umbrella — the living expression of the **Accessible** pillar.

## The golden rules — every lesson/document you build MUST be:

1. **Interactive-first.** The centerpiece of a lesson is something the learner
   *plays with*, not paragraphs. Lead with the interactive; use prose to support
   it. If a concept can be a slider, a playground, a visualization, or a
   click-through diagram, build that — never a wall of text.
2. **Easy to understand.** Plain language. **One idea per lesson.** Frame new
   ideas against things an engineer already knows (a model is a function you
   *fit* to data; embeddings are meaning hashed into vectors). Keep concept prose
   to a few short paragraphs. Math/theory goes in an optional, collapsed
   **"Go deeper"** block, never in the main flow.
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
- `app/lib/copy.ts` — the typed EN/ES copy + the stage list. **Single source of
  truth for text.**
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
