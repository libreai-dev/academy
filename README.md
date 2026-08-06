# libreai Academy — academy.libreai.dev

The **libreai Academy** site: an interactive, bilingual (English + Spanish)
guided roadmap that takes a software engineer with no AI background to
AI-native engineer across six stages. Built with **Next.js (App Router) +
TypeScript + React 19**. Part of the libreai.dev umbrella — the living
expression of the **Accessible** pillar.

This is a **standalone app** (its own `package.json`), separate from the
marketing site in `../site`. It is designed to deploy to the `academy.libreai.dev`
**subdomain** as its own Vercel project (Root Directory → `academy`), but nothing
ties it to a subdomain — it can be rebased under a path later if that decision
changes.

## Routes

| Route              | What it is                                              |
| ------------------ | ------------------------------------------------------- |
| `/`                | Home = the roadmap: the six stages, progress, CTAs      |
| `/stage/1/tokens`  | The Stage 1 → "Tokens" sample lesson (live tokenizer)   |

This is **Phase 1** of the information architecture (`docs/academy/…`): the
home/roadmap plus one real interactive lesson, in both languages. Later phases
add the remaining stages, lesson routes, path selector, and progress tracking.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run lint
```

## Deploying to Vercel

Import the repo as its own Vercel project and set **Root Directory → `academy`**.
Everything else is auto-detected (Next.js preset). No environment variables are
required. Point the `academy.libreai.dev` DNS record at that project.

## Architecture

- **App Router**, TypeScript, React 19.
- **Fonts** via `next/font/google` (Space Grotesk, Instrument Sans, JetBrains
  Mono), exposed as `--font-space-grotesk`, `--font-instrument-sans`,
  `--font-jetbrains-mono`.
- **Design tokens** for light **and** dark mode live in `app/globals.css` under
  `:root` / `:root[data-theme="dark"]`; the palette matches the marketing site.
- **`app/providers.tsx`** — a small client context holding the active **theme**
  (light/dark) and **language** (EN/ES). Both persist to `localStorage` and are
  applied before first paint by the no-flash script in `app/layout.tsx`, so the
  choice survives navigation with no flash.
- **Components** (`app/components/`): `Header`, `Footer`, `Home` (roadmap), and
  `Tokens` (the lesson). All read copy from the context.
- **`app/lib/copy.ts`** — the full EN/ES copy, typed, plus the stage list.
  Neither language is primary; both are authored in full.
- **`app/lib/tokenize.ts`** — the client-side subword tokenizer powering the
  live interactive.

## Placeholders

- `GITHUB_URL` in `app/lib/copy.ts` — the GitHub org handle (currently
  `libreai-dev`), pending the finalised org.
