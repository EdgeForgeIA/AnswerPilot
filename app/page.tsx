import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  Check,
  FileDown,
  Radar,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <SiteNav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ── Nav ─────────────────────────────────────────────────────────── */

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-on-accent">
        <ShieldCheck className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">AnswerPilot</span>
    </Link>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
          <a href="#how-it-works" className="hover:text-ink">
            How it works
          </a>
          <a href="#features" className="hover:text-ink">
            Features
          </a>
          <a href="#pricing" className="hover:text-ink">
            Pricing
          </a>
          <a href="#faq" className="hover:text-ink">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-strong"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────── */

const DEMO_ROWS: Array<{ q: string; a: string; conf: "high" | "medium" | "low"; delay: number }> = [
  {
    q: "Is customer data encrypted at rest and in transit?",
    a: "Yes. All customer data is encrypted at rest with AES-256 and in transit with TLS 1.2+.",
    conf: "high",
    delay: 0,
  },
  {
    q: "Do you enforce MFA for all employees?",
    a: "Yes. MFA is enforced through our identity provider; hardware keys are required for admins.",
    conf: "high",
    delay: 1.6,
  },
  {
    q: "Describe your incident response process.",
    a: "We maintain a documented IR plan with severity levels and escalation paths, tested annually.",
    conf: "medium",
    delay: 3.2,
  },
  {
    q: "Do you carry cyber liability insurance?",
    a: "[NEEDS INPUT: policy carrier and coverage amount]",
    conf: "low",
    delay: 4.8,
  },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
        <div className="fade-up">
          <p className="eyebrow mb-5">For B2B teams stuck in vendor security review</p>
          <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            The 240-row security questionnaire,{" "}
            <span className="text-accent">answered before lunch.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink-soft">
            AnswerPilot drafts every answer from your own approved answer library — cited,
            confidence-graded, and never invented. You review, approve, and export. Deals stop
            dying in procurement.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-6 text-[15px] font-medium text-on-accent hover:bg-accent-strong"
            >
              Answer your first questionnaire free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-lg border border-line-strong bg-surface px-6 text-[15px] font-medium text-ink hover:bg-raised"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 font-mono text-xs text-ink-faint">
            No credit card · SIG Lite · CAIQ · SOC 2 · vendor risk · RFP security sections
          </p>
        </div>

        <HeroLedger />
      </div>
    </section>
  );
}

function HeroLedger() {
  return (
    <div className="fade-up rounded-xl border border-line bg-surface shadow-card" aria-hidden>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold text-ink">Acme Corp — Vendor Security Review</p>
          <p className="font-mono text-[11px] text-ink-faint">247 questions · imported 09:14</p>
        </div>
        <span className="stamp text-accent bg-accent-soft">drafting</span>
      </div>
      <ul className="divide-y divide-line">
        {DEMO_ROWS.map((row, i) => (
          <li key={i} className="px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 font-mono text-[11px] font-medium text-ink-faint">
                Q-{String(i + 41).padStart(3, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-ink">{row.q}</p>
                <div className="demo-answer mt-2" style={{ animationDelay: `${row.delay}s` }}>
                  <p
                    className={cn(
                      "text-[13px] leading-relaxed",
                      row.conf === "low" ? "text-amber" : "text-ink-soft"
                    )}
                  >
                    {row.a}
                    <span className="demo-caret ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-accent" />
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "stamp",
                        row.conf === "high" && "text-accent bg-accent-soft",
                        row.conf === "medium" && "text-amber bg-amber-soft",
                        row.conf === "low" && "text-danger bg-danger-soft"
                      )}
                    >
                      {row.conf}
                    </span>
                    {row.conf !== "low" && (
                      <span className="font-mono text-[10px] text-ink-faint">
                        cited from your library
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── How it works ────────────────────────────────────────────────── */

const STEPS = [
  {
    title: "Build your answer library once",
    body: "Add your policies and past questionnaire answers — paste them in, bulk-import a CSV, or start from our sample library. This becomes your single source of truth.",
  },
  {
    title: "Paste in any questionnaire",
    body: "Drop in the questions from that Excel file — one per line or as a CSV. AnswerPilot drafts every answer from your library, with citations and a confidence grade on each row.",
  },
  {
    title: "Review, approve, export",
    body: "High-confidence rows take seconds to approve. Low-confidence rows are flagged with exactly what's missing. Export a clean CSV, and every approved answer grows your library for next time.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink">
          A workflow, not a chatbot
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Generic AI invents certifications you don&apos;t have. AnswerPilot only answers from
          what your team has approved — and tells you when it can&apos;t.
        </p>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="font-mono text-sm font-semibold text-accent">
                Step {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Features ────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: BookMarked,
    title: "Grounded in your library",
    body: "Every draft cites the exact library entries it was built from. No hallucinated SOC 2 reports, no invented policies.",
  },
  {
    icon: Radar,
    title: "Confidence grading",
    body: "Each answer is stamped high, medium, or low so reviewers spend their time only where judgment is actually needed.",
  },
  {
    icon: Sparkles,
    title: "Gaps flagged, not papered over",
    body: "When your library can't answer, you get a [NEEDS INPUT] placeholder describing exactly what security must provide.",
  },
  {
    icon: Timer,
    title: "A library that compounds",
    body: "Approving an answer saves it back to your library automatically. Questionnaire #10 is dramatically faster than #1.",
  },
  {
    icon: FileDown,
    title: "Clean CSV export",
    body: "Export question/answer pairs ready to paste back into whatever portal or spreadsheet the customer sent you.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "Row-level security isolates every workspace. Your library is never used to answer anyone else's questionnaires.",
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20">
      <p className="eyebrow">What you get</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
        Built for the review, not just the draft
      </h2>
      <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <f.icon className="h-[18px] w-[18px]" aria-hidden />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold text-ink">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Pricing ─────────────────────────────────────────────────────── */

function Pricing() {
  const tiers = [PLANS.free, PLANS.pro, PLANS.scale];
  return (
    <section id="pricing" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">Pricing</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
          Cheaper than one hour of the engineer you keep interrupting
        </h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => {
            const featured = tier.id === "pro";
            return (
              <div
                key={tier.id}
                className={cn(
                  "flex flex-col rounded-xl border bg-canvas p-7",
                  featured ? "border-accent shadow-card lg:-my-3 lg:py-10" : "border-line"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-ink">{tier.name}</h3>
                  {featured && <span className="stamp text-accent bg-accent-soft">most popular</span>}
                </div>
                <p className="mt-1 text-sm text-ink-soft">{tier.blurb}</p>
                <p className="mt-5">
                  <span className="text-4xl font-bold tracking-tight text-ink">
                    ${tier.priceMonthly}
                  </span>
                  <span className="ml-1 text-sm text-ink-faint">/ month</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cn(
                    "mt-8 inline-flex h-11 items-center justify-center rounded-lg text-sm font-medium",
                    featured
                      ? "bg-accent text-on-accent hover:bg-accent-strong"
                      : "border border-line-strong bg-surface text-ink hover:bg-raised"
                  )}
                >
                  {tier.id === "free" ? "Start free" : `Start with ${tier.name}`}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Will it make up answers we can't back up?",
    a: "No — that's the entire design. Drafts are generated only from entries in your answer library, each draft cites its sources, and anything your library can't support comes back as a low-confidence [NEEDS INPUT] flag instead of a confident-sounding guess.",
  },
  {
    q: "What formats can I import?",
    a: "Paste questions one per line, or upload a .csv/.txt file. For your library, you can add entries one at a time or bulk-import a two-column CSV of question,answer pairs — most teams start by pasting answers from their last completed questionnaire.",
  },
  {
    q: "Is our security data safe with you?",
    a: "Each workspace is isolated with Postgres row-level security, data is encrypted in transit and at rest by our infrastructure providers (Supabase/AWS), and your library is never used to generate answers for any other customer.",
  },
  {
    q: "How is this different from pasting into ChatGPT?",
    a: "Three ways: grounding (answers come only from your approved library, with citations), workflow (per-row review, approval states, and export built for 200-question spreadsheets), and compounding (every approved answer is saved so the next questionnaire is mostly done before you start).",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Billing runs through Stripe — you can upgrade, downgrade, or cancel from Settings in two clicks, effective at the end of the billing period.",
  },
];

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
      <p className="eyebrow">FAQ</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">Fair questions</h2>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {FAQS.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink">
              {item.q}
              <span className="font-mono text-ink-faint transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── Final CTA + footer ──────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <div className="rounded-2xl border border-line bg-surface px-8 py-14 text-center shadow-card">
        <h2 className="mx-auto max-w-xl text-balance text-3xl font-bold tracking-tight text-ink">
          Your next questionnaire is already sitting in someone&apos;s inbox
        </h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Answer it in minutes instead of a week. The first one is free.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-7 text-[15px] font-medium text-on-accent hover:bg-accent-strong"
        >
          Start free <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <Wordmark />
        <p className="font-mono text-xs text-ink-faint">
          © {new Date().getFullYear()} AnswerPilot · Security questionnaires, answered.
        </p>
      </div>
    </footer>
  );
}
