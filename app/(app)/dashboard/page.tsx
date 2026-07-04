import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookMarked, CheckCircle2, Circle, FileSpreadsheet, Plus } from "lucide-react";
import { getOrgContext } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { Card, StatusBadge } from "@/components/ui";
import type { Questionnaire } from "@/types/db";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { supabase, org } = ctx;

  const [{ count: kbCount }, { count: approvedCount }, { data: recent }] = await Promise.all([
    supabase.from("kb_entries").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "approved"),
    supabase
      .from("questionnaires")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const questionnaires = (recent ?? []) as Questionnaire[];
  const hoursSaved = Math.round(((approvedCount ?? 0) * 4) / 60); // ~4 min saved per answered question
  const hasLibrary = (kbCount ?? 0) > 0;
  const hasQuestionnaire = questionnaires.length > 0;
  const hasApproved = (approvedCount ?? 0) > 0;
  const onboarded = hasLibrary && hasQuestionnaire && hasApproved;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{org.name}</h1>
        </div>
        <Link
          href="/questionnaires/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-strong"
        >
          <Plus className="h-4 w-4" aria-hidden /> New questionnaire
        </Link>
      </div>

      {!onboarded && (
        <Card className="mt-8 p-6">
          <h2 className="text-[15px] font-semibold text-ink">Get to your first answered questionnaire</h2>
          <p className="mt-1 text-sm text-ink-soft">Three steps, about two minutes.</p>
          <ul className="mt-5 space-y-3">
            <ChecklistItem
              done={hasLibrary}
              href="/library"
              label="Add answers to your library"
              hint="Paste past answers, import a CSV, or load the sample library to try it out."
            />
            <ChecklistItem
              done={hasQuestionnaire}
              href="/questionnaires/new"
              label="Create a questionnaire"
              hint="Paste the questions from the spreadsheet a customer sent you."
            />
            <ChecklistItem
              done={hasApproved}
              href={hasQuestionnaire ? `/questionnaires` : "/questionnaires/new"}
              label="Review and approve the AI drafts"
              hint="Approved answers are saved back to your library automatically."
            />
          </ul>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Library entries" value={kbCount ?? 0} />
        <Stat label="Answers approved" value={approvedCount ?? 0} />
        <Stat label="Est. hours saved" value={hoursSaved} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Recent questionnaires</h2>
          {questionnaires.length > 0 && (
            <Link
              href="/questionnaires"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>

        {questionnaires.length === 0 ? (
          <Card className="mt-4 flex items-center gap-4 p-6">
            <FileSpreadsheet className="h-8 w-8 shrink-0 text-ink-faint" aria-hidden />
            <div>
              <p className="text-sm font-medium text-ink">No questionnaires yet</p>
              <p className="text-sm text-ink-soft">
                When one lands in your inbox, paste it in and watch it answer itself.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="mt-4 divide-y divide-line">
            {questionnaires.map((q) => (
              <Link
                key={q.id}
                href={`/questionnaires/${q.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-raised"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{q.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-ink-faint">
                    {q.question_count} questions · {formatDate(q.created_at)}
                    {q.requester ? ` · for ${q.requester}` : ""}
                  </p>
                </div>
                <StatusBadge status={q.status} />
              </Link>
            ))}
          </Card>
        )}
      </div>

      {!hasLibrary && (
        <Link
          href="/library"
          className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-5 py-4 text-sm text-ink-soft hover:border-accent hover:text-ink"
        >
          <BookMarked className="h-4.5 w-4.5 text-accent" aria-hidden />
          Tip: the answer library powers everything — start there.
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="font-mono text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-[13px] text-ink-soft">{label}</p>
    </Card>
  );
}

function ChecklistItem({
  done,
  href,
  label,
  hint,
}: {
  done: boolean;
  href: string;
  label: string;
  hint: string;
}) {
  return (
    <li>
      <Link href={href} className="group flex items-start gap-3">
        {done ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
        ) : (
          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-line-strong" aria-hidden />
        )}
        <span>
          <span
            className={
              done
                ? "text-sm font-medium text-ink-faint line-through"
                : "text-sm font-medium text-ink group-hover:text-accent"
            }
          >
            {label}
          </span>
          {!done && <span className="block text-[13px] text-ink-soft">{hint}</span>}
        </span>
      </Link>
    </li>
  );
}
