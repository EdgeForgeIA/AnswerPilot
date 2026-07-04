# AnswerPilot

**Security questionnaires, answered in minutes.** AnswerPilot drafts accurate, cited answers to security questionnaires (SOC 2, SIG Lite, CAIQ, vendor risk reviews, RFP security sections) from your company's own approved answer library — then routes every draft through human review before export.

Every draft is grounded exclusively in your library, graded `high / medium / low` confidence, and cites its sources. Anything the library can't support comes back as an explicit `[NEEDS INPUT: …]` gap instead of a confident hallucination. Approving an answer saves it back to the library, so questionnaire #10 is mostly done before you start.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript (strict)
- **Tailwind CSS v4** (CSS-first config, automatic dark mode)
- **Supabase** — auth (email/password + confirmation links), Postgres with row-level security
- **Stripe** — subscriptions via Checkout + Customer Portal, synced by webhook
- **Anthropic API** — grounded answer drafting with confidence grading
- **Sonner** toasts · **Zod** validation · **Lucide** icons

No ORM: the schema lives in `supabase/migrations/0001_init.sql` and queries go through the Supabase client, so RLS applies everywhere. The only thing that bypasses RLS is the Stripe webhook (service-role key), which is the only writer of billing state.

## 1 — Local setup

```bash
git clone <this repo> && cd answerpilot
npm install
cp .env.example .env.local
```

Now fill in `.env.local` by completing steps 2–4.

## 2 — Supabase

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. **SQL Editor** → paste the entire contents of `supabase/migrations/0001_init.sql` → Run. This creates all tables, RLS policies, and a trigger that provisions a workspace for every new signup.
3. **Project Settings → API**: copy into `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose)
4. **Authentication → URL Configuration**: set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs. (Repeat with your production URL when you deploy.)
5. Optional for fast local testing: **Authentication → Sign In / Providers → Email** → disable "Confirm email" so signups log in immediately.

## 3 — Stripe (test mode)

1. Grab your test secret key from [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) → `STRIPE_SECRET_KEY`.
2. **Product catalog → Add product**, twice:
   - `AnswerPilot Pro` — recurring, $149/month → copy the price ID → `STRIPE_PRICE_PRO`
   - `AnswerPilot Scale` — recurring, $399/month → copy the price ID → `STRIPE_PRICE_SCALE`
3. Forward webhooks locally with the [Stripe CLI](https://stripe.com/docs/stripe-cli):

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Copy the printed `whsec_…` → `STRIPE_WEBHOOK_SECRET`.
4. Test upgrades with card `4242 4242 4242 4242`, any future expiry, any CVC. The webhook flips your workspace's plan; "Manage billing" opens the Customer Portal (enable it once at Settings → Billing → Customer portal in the Stripe dashboard if prompted).

## 4 — Anthropic

Create a key at [console.anthropic.com](https://console.anthropic.com/settings/keys) → `ANTHROPIC_API_KEY`. Optionally override the model with `ANTHROPIC_MODEL` (defaults to `claude-sonnet-4-6`).

## 5 — Optional: semantic retrieval (pgvector + Voyage AI)

Out of the box, retrieval is lexical (IDF-weighted token overlap) — zero setup, works well up to a few hundred library entries. For semantic matching ("Do you encrypt data in transit?" should find your TLS answer even with zero shared keywords):

1. Supabase **SQL Editor** → run `supabase/migrations/0002_pgvector.sql` (enables pgvector, adds an embedding column + HNSW index and a match function).
2. Create an API key at [dashboard.voyageai.com](https://dashboard.voyageai.com) (Voyage AI is Anthropic's recommended embeddings partner; the free tier covers a lot of runway) → set `VOYAGE_API_KEY` in `.env.local`.
3. Restart. That's it — no backfill step needed:
   - New/imported/approved library entries are embedded on write.
   - Existing entries are embedded automatically ("self-healing") the next time you draft a questionnaire.
   - Retrieval becomes **hybrid**: pgvector nearest-neighbour matches merged with lexical matches, so exact-keyword hits and any not-yet-embedded rows still surface.
   - Any embedding failure degrades gracefully to lexical retrieval — drafting never breaks.

Unset `VOYAGE_API_KEY` at any time to fall back to pure lexical retrieval.

## 6 — Run it

```bash
npm run dev
```

The 60-second happy path:

1. `http://localhost:3000` → **Start free** → create an account.
2. Dashboard checklist → **Answer library** → **Load sample library** (15 realistic SOC 2-style entries).
3. **New questionnaire** → paste a few questions, or upload a `.xlsx` questionnaire (the question column is detected automatically, cover sheets are skipped) (try mixing ones the library covers with ones it doesn't):

   ```
   Do you hold a SOC 2 report?
   Is customer data encrypted at rest and in transit?
   Do you enforce MFA for all employees?
   Do you carry cyber liability insurance?
   ```

4. **Create & draft answers** — watch drafts stream in with confidence stamps. Note the last one comes back as a low-confidence `[NEEDS INPUT]` gap: the product refusing to hallucinate is the demo.
5. Approve rows (each approval grows your library), export as **XLSX** (styled, review-ready) or **CSV**, then check Settings → upgrade with the test card.

## Deploy to Vercel

1. Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new). Next.js is auto-detected.
2. Add every variable from `.env.local` to the Vercel project — change `NEXT_PUBLIC_SITE_URL` to your production URL.
3. Create a **production webhook**: Stripe dashboard → Developers → Webhooks → Add endpoint → `https://YOUR-DOMAIN/api/stripe/webhook`, subscribed to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy its signing secret into Vercel as `STRIPE_WEBHOOK_SECRET` (it differs from the CLI one) and redeploy.
4. Update Supabase Auth URL configuration with the production URL and `https://YOUR-DOMAIN/auth/callback`.

## Project structure

```
app/
  page.tsx                     Marketing landing page
  layout.tsx, globals.css      Root layout, design tokens (light/dark)
  (auth)/login, (auth)/signup  Auth pages
  auth/callback, auth/signout  Supabase redirect + signout handlers
  (app)/                       Protected shell (sidebar layout)
    dashboard/                 Stats + onboarding checklist
    library/                   Answer library (add / import CSV / sample)
    questionnaires/            List · new (paste/upload) · [id] review workspace
    settings/                  Workspace + plan & billing
  api/
    library/…                  Create, bulk import, delete, load sample
    questionnaires/…           Create · batched AI drafting · polling · CSV export
    answers/[id]/              Edit / approve (approval feeds the library)
    stripe/…                   Checkout, portal, webhook
components/                    UI primitives + feature components
lib/                           Supabase clients, AI drafting, retrieval, plans, Stripe
supabase/migrations/           0001 schema + RLS · 0002 optional pgvector upgrade
```

## How generation works

Creating a questionnaire inserts one `questions` row per line. The review page then calls `POST /api/questionnaires/[id]/generate` in a loop; each call drafts a batch of 6 pending questions (concurrency 3) and reports progress, keeping every invocation well inside serverless limits regardless of questionnaire size. For each question we rank library entries with lightweight lexical retrieval (IDF-weighted token overlap), pass the top matches to Claude with a strict grounding prompt, and store the answer, confidence grade, and cited entry IDs. Zero matching entries short-circuits to a `[NEEDS INPUT]` gap without an API call.

With `VOYAGE_API_KEY` set (see section 5), retrieval upgrades to hybrid semantic search: each batch of questions is embedded in one API call, matched against the pgvector index, and merged with lexical results.

## Security notes

- Postgres RLS isolates every workspace; membership checks run through a `security definer` function.
- Billing columns are only written by the webhook via the service-role key — clients can't self-upgrade.
- Plan limits are enforced server-side in API routes, not just hidden in the UI.
- The Stripe webhook verifies signatures and is excluded from auth middleware.
