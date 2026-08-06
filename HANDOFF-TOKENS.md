# Handoff — Tokens lesson rebuild (continue locally in Claude Code)

Pick this up in a **local Claude Code session** inside
`/Users/xaviramirez/code/libreai.dev/academy`. The previous work happened in a
cloud Cowork session whose sandbox **could not `npm install` (registry blocked,
403) and could not show a dev server**. You can do both — that's the whole
reason to continue locally.

## What this session did

Rebuilt the **Tokens** lesson around a **real, in-browser tokenizer**
(`js-tiktoken`, `o200k_base` = GPT-4o's vocabulary) plus **real d3** charts,
made graphic/animated and English-first (ES kept in parity). All files below are
already written to disk.

### Files changed
- **`package.json`** — added `d3 ^7.9.0`, `js-tiktoken ^1.0.21`,
  `@types/d3 ^7.4.3`. **Not installed yet** — run `npm install`.
- **`app/lib/tokenizer.ts`** *(new)* — lazy-loads the real encoders
  (`o200k_base`, `cl100k_base`), `encodeTokens` (id + per-token decoded piece +
  kind), a `classify` colouring heuristic (word / word-piece / number / symbol /
  space / raw-bytes), `estimateCost`, `randomEntries` (dictionary demo),
  `showPiece` (whitespace -> shown glyphs).
- **`app/components/Tokens.tsx`** *(rebuilt)* — sections in order:
  animated hero flow (text -> tokens -> numbers, using a hardcoded **real** o200k
  encoding of "The cat sat on the mat" so it paints instantly); concept prose;
  **Token Calculator** (live count, the raw integer array, and colour-coded
  chips showing each id + what it decodes to, plus chars & cost); **"See it
  break"** presets (strawberry / 1234567 / emoji / JSON / Spanish, each with a
  one-line explanation); **dictionary explorer** (search your text -> real
  entries, or roll random real entries); **d3 comparison bars** (o200k vs
  cl100k for your text; English vs Spanish for the same sentence); explain-it-
  back; go-deeper; a forward **bridge card** to `/stage/1/data`; nav controls.
  Responsive (down to 360px), keyboard-operable, and every animation is gated on
  `prefers-reduced-motion` (count-up, chip stagger, d3 transitions, arrow bob).
- **`app/lib/copy.ts`** — added the `TokenLesson` interface + a `tok` field with
  all new lesson copy in **EN and ES**.
- **`app/globals.css`** — appended token-kind colour design tokens
  (`--tok-word/sub/num/punct/space/byte`, light + dark) and the `tok-spin` /
  `tok-bob` keyframes, with a reduced-motion guard.

### Verified in the cloud session
- `tsc --noEmit` against real `react` / `d3` / `js-tiktoken` types: **clean**.
- Real counts (o200k): `strawberry` = 3 tokens; "The cat sat on the mat" = 6
  (ids `976, 9059, 10139, 402, 290, 2450`); EN sample = 12 vs ES = 16 (~33%
  more); emoji = 2 raw-byte tokens. Classifier output validated.
- **Not yet done:** `npm run build`, `npm run lint`, and visual QA in a browser.

## Do next, in order

1. `npm install`
2. `npm run dev` -> open **http://localhost:3000/stage/1/tokens**. QA: light/dark,
   EN/ES, 360px width, keyboard nav, and reduced-motion (OS setting).
3. `npm run lint` and `npm run build` — both must pass before shipping.
4. **Bundle-size fix (important).** The current
   `import { getEncoding } from "js-tiktoken"` pulls **all** encodings
   (~2.5 MB gzipped). Switch `app/lib/tokenizer.ts` to the lite core + explicit
   per-rank dynamic import so only what's used ships (o200k ~1.1 MB gz, cl100k
   ~0.5 MB gz):
   ```ts
   const { Tiktoken } = await import("js-tiktoken/lite");
   const rank = (await import(`js-tiktoken/ranks/${name}`)).default;
   return new Tiktoken(rank);
   ```
   Also **defer cl100k** until the comparison card scrolls into view
   (IntersectionObserver) instead of loading it on mount, and switch
   `import * as d3 from "d3"` to the submodules actually used
   (`d3-selection`, `d3-scale`, `d3-transition`, `d3-ease`). Re-run tsc/lint.
5. Fill the `GITHUB_URL` placeholder in `copy.ts` (still `libreai-dev`).

## Bigger open decision (deferred — discuss with Xavier before doing)

Curriculum **reorder**: Tokens should come *before* Data. Agreed plan — keep
**"Life of an LLM"** as a light orientation map (lesson 1), make **Tokens** the
first real mechanical lesson, then add a **new "Gathering data -> token tape"**
lesson (the running example: ~1M Wikipedia pages -> clean -> tokenize ->
~1B integers -> concatenated into the flat ~15T-token "dense block", and *why*
data is stored as a random-access integer tape). Not built yet. When reordering,
update `stage1List` order, the `crumb` strings, each lesson's rail "current
index" + prev/next labels, in `copy.ts` and the components. The Tokens bridge
card already points at `/stage/1/data`.

## Conventions (from CLAUDE.md — keep following)
- All user-facing text comes from `copy.ts` in **both** languages — never
  hardcode a string. Colours come from **design tokens** only.
- Interactive-first, one idea per lesson, WCAG AA, mobile-first, light + dark.

## Suggested first message for the local session
> "npm install, then npm run dev and open /stage/1/tokens. QA it (light/dark,
> EN/ES, 360px, keyboard, reduced-motion), then run lint + build. Then apply the
> js-tiktoken lite + per-rank import with deferred cl100k, and switch d3 to
> submodule imports, so we don't ship all encodings."
