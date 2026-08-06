# Handoff — libreai Academy (start here in the local session)

## Where things stand
- Next.js 15 / React 19 / TS app. Home + two lessons built:
  - `/stage/1/life-of-an-llm` — the six-stage "life of an LLM" document (data → tokenize → pretrain → fine-tune → evaluate → host), each stage with a before→after graphic + four depth panels (what the lab does · tools · hardware · money). Hand-rolled SVG for now.
  - `/stage/1/tokens` — live tokenizer lesson.
- All copy (EN + ES) is in `app/lib/copy.ts`. Full roadmap + per-stage outlines in `docs/academy/`.
- Conventions to follow: `CLAUDE.md` (interactive-first, COMPLETE documents that fully teach the concept, responsive, accessible, design-tokens only).

## Do this, in order
1. **Run locally.** `npm install` if needed, then `npm run dev` → open http://localhost:3000. Review the home, the two lessons, light/dark, and EN/ES.
2. **Add d3** (the reason to be local — cloud couldn't install it): `npm install d3 @types/d3`.
3. **Rebuild the Life-of-an-LLM visuals with real d3**, English-first:
   - Animate the six-stage pipeline (flow of a real example through the stages).
   - Real d3 for the pretrain next-token bars and any loss/scale visuals.
   - Keep each stage's tools/hardware/lab/money depth panels.
4. **Language call:** going forward, English-only is fine (faster). The ES already in `copy.ts` can stay or be removed.
5. **Fill placeholder:** `GITHUB_URL` in `app/lib/copy.ts` (currently `libreai-dev`).
6. **Keep building** the remaining lessons from `docs/academy/` — one complete, interactive document per lesson, following `CLAUDE.md`.
7. **Before deploy:** `npm run build` and `npm run lint` must pass. Deploy on Vercel with Root Directory → `academy`.

## Key files
- `app/lib/copy.ts` — all lesson copy (typed, EN/ES).
- `app/components/LifeOfLLM.tsx` — the six-stage document (refactor to d3 here).
- `app/components/Tokens.tsx` — the tokenizer lesson pattern.
- `app/providers.tsx` — theme + language context. `app/globals.css` — design tokens.
- `docs/academy/00-roadmap.md` + `stage-*.md` — what each lesson should contain.

## First message to the local session
> "npm install d3 and @types/d3, then rebuild the Life-of-an-LLM stage visuals with real d3 (English-first), following CLAUDE.md — complete, interactive, responsive."
