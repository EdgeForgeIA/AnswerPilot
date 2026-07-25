# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**VeriQuill** — a Next.js 16 SaaS that drafts cited answers to security questionnaires (SOC 2, SIG Lite, CAIQ, vendor risk) from a workspace's own approved answer library, then routes every draft through human review before export.

Note the naming drift: the repo directory and git history say `answerpilot`, `package.json` says `veriquill`, and the product was renamed in commit `a1d40a0`. User-facing strings and the AI system prompt say **VeriQuill** — match that in anything new.

## Commands

```bash
npm run dev         # dev server on :3000
npm run build       # production build
npm run typecheck   # tsc --noEmit — the real correctness gate
```

There is **no test suite** and no ESLint config in the repo (`npm run lint` calls `next lint`, which Next 16 no longer provides — it will fail). `npm run typecheck` plus `npm run build` are the checks that matter; run both before claiming a change works. TypeScript is `strict`, imports use the `@/*` path alias rooted at the repo root.

Database changes are applied by pasting SQL into the Supabase SQL Editor — there is no migration runner wired up. `supabase/migrations/0001_init.sql` is the full schema + RLS; `0002_pgvector.sql` is an optional upgrade.

## Architecture

### Multi-tenancy is enforced in Postgres, not in app code

There is no ORM. Every query goes through a Supabase client so **RLS applies everywhere**. The pattern is:

- `lib/data.ts::getOrgContext()` — the single entry point for both Server Components and Route Handlers. Returns `{ supabase, user, org }` or `null`. Route handlers return 401 on `null`; `app/(app)/layout.tsx` redirects to `/login`.
- `lib/supabase/server.ts` — cookie-aware anon-key client (RLS active). Use this for everything.
- `lib/supabase/admin.ts` — service-role client that **bypasses RLS**. Used by exactly one file: the Stripe webhook. Do not introduce a second caller; billing columns having a single writer is what prevents users self-upgrading.
- `public.is_org_member(uuid)` is a `security definer` function so RLS policies can read `org_members` without recursive evaluation.

Route handlers still add explicit `.eq("org_id", ctx.org.id)` filters even though RLS covers them — that's for clean 404s, keep it.

`middleware.ts` → `lib/supabase/middleware.ts` refreshes sessions on every non-static route and redirects unauthenticated hits to `PROTECTED_PREFIXES`. `api/stripe/webhook` is excluded from the matcher (no cookies, must not redirect). Never insert logic between `createServerClient` and `getUser()` in the middleware — it causes random logouts.

### Generation is client-driven batching, not one long request

`POST /api/questionnaires/[id]/generate` drafts **one batch of 6 pending questions** (concurrency 3) and returns `{ processed, remaining }`. `components/review-workspace.tsx` calls it in a loop until `remaining === 0`, refetching after each batch for live progress. This keeps every invocation inside the 60s serverless limit regardless of questionnaire size — don't refactor it into a single pass over all questions.

Per-question flow:

1. Rank library entries — lexical (`lib/retrieval.ts`, IDF-weighted token overlap) or hybrid (`lib/embeddings.ts`) if `VOYAGE_API_KEY` is set.
2. Pass top matches to Claude with the strict grounding prompt in `lib/ai.ts`.
3. Store `ai_answer`, `final_answer`, `confidence`, `source_ids`. `confidence === "low"` → status `flagged`, otherwise `answered`.

### Refusing to hallucinate is a product feature

Three layers, all deliberate — preserve them:

- Zero retrieved entries short-circuits in `draftAnswer()` to a `[NEEDS INPUT: …]` gap with **no API call**.
- The system prompt requires `[NEEDS INPUT: <what's missing>]` for uncovered or partially-covered questions rather than a plausible answer.
- `parseDraft()` filters `source_ids` against the IDs actually supplied as context, so citations can't be invented, and degrades malformed JSON to a low-confidence row instead of failing the question.

### Embeddings are strictly optional and must degrade silently

`lib/embeddings.ts` is built so every failure path falls back to lexical retrieval and drafting never breaks: `embedKbRows()` never throws, `hybridRetrieve()` catches RPC errors and returns lexical results, and `backfillMissingEmbeddings()` self-heals un-embedded rows at draft time (so there's no backfill script). Keep any new embedding code inside this contract.

### The library flywheel

`PATCH /api/answers/[id]` with `status: "approved"` and `save_to_library: true` writes the approved answer back into `kb_entries` (deduped by exact question text, `source: "approved_answer"`, re-embedded). It also recomputes whether the questionnaire is fully approved and flips `questionnaires.status`. This is the retention mechanic — approvals are what make questionnaire #10 mostly pre-answered.

### Plan limits are server-side

`lib/plans.ts` defines the three tiers and their `questionnaireLimit` / `questionsPerQuestionnaire` / `kbLimit`. Enforce limits in the route handler (see `app/api/questionnaires/route.ts` returning 403), not only by hiding UI. `planFor()` defaults unknown values to free.

### Auth has two link-handling routes

- `app/auth/confirm/route.ts` — `token_hash` + `verifyOtp()`. Works across browsers/devices, so this is the one email templates must point at (password recovery, email confirmation). Both it and `callback` clamp `next` to same-origin relative paths.
- `app/auth/callback/route.ts` — PKCE `exchangeCodeForSession()`, browser-bound.

### Stripe webhook fails loudly on purpose

`app/api/stripe/webhook/route.ts` throws (→ 500, Stripe retries and shows a failed delivery) when an *active* subscription carries an unrecognized price ID, or when the DB update errors or matches zero rows. Returning 200 in those cases would silently downgrade a paying customer. Don't "fix" these into soft failures.

### The blog is file-backed and fails the build on bad content

`content/blog/*.md` (`.mdx` accepted, parsed identically) → `lib/blog.ts` → `/blog` and `/blog/[slug]`. Frontmatter (`title`, `description`, `slug`, `date`) is validated with zod and **throws** on anything invalid — missing fields, a non-kebab slug, an unreal date, an empty body, or a duplicate slug. That's deliberate: a bad post should break the build, not ship with an empty `<title>` or a dead URL. The frontmatter `slug` is authoritative for the URL; filenames may differ.

Two things to know before editing:

- Rendering is **markdown only** (`marked`, GFM). JSX inside an `.mdx` file will render as literal text — there is no MDX compiler wired up.
- Date-only frontmatter is treated as UTC end to end (`formatPostDate`), so a post dated the 20th never displays as the 19th. Don't route blog dates through `lib/utils.ts::formatDate`, which is local-time and meant for DB timestamps.

Declaring an `openGraph` block in a page's metadata opts that page out of inheriting the root `app/opengraph-image.tsx` card, so blog metadata references it explicitly via `SITE_OG_IMAGE` in `lib/site.ts`. Any new page that sets its own `openGraph` needs the same treatment or it ships an imageless social card.

`app/sitemap.ts` calls `getAllPosts()`, so new posts appear in the sitemap with no extra step.

## Styling

Tailwind v4, CSS-first config — no `tailwind.config.js`. Semantic design tokens live in `app/globals.css` under `:root`, are redefined in a `prefers-color-scheme: dark` block, and are mapped to utilities via `@theme inline`. So dark mode is automatic: use `bg-surface`, `text-ink`, `text-ink-soft`, `border-line`, `bg-accent`, `text-on-accent`, `shadow-card` etc. **Never hardcode hex colors or use raw Tailwind palette classes** (`bg-white`, `text-gray-500`) — they break dark mode.

`components/ui.tsx` holds the primitives (`Button`, `Input`, `Textarea`, `Card`, `ConfidenceStamp`, `StatusBadge`, `EmptyState`); compose with `cn()` from `lib/utils.ts`. Feature components in `components/` are the client-side islands — pages are Server Components that fetch via `getOrgContext()` and hand data down.

## Environment

`.env.example` documents everything. `ANTHROPIC_MODEL` defaults to `claude-sonnet-4-6`; `VOYAGE_MODEL` to `voyage-3.5-lite`. Routes that use ExcelJS set `runtime = "nodejs"`; drafting sets `maxDuration = 60`, xlsx parse/export `30`.
