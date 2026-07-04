import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSpreadsheet, Plus } from "lucide-react";
import { getOrgContext } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import type { Questionnaire } from "@/types/db";

export const metadata = { title: "Questionnaires" };

export default async function QuestionnairesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { data } = await ctx.supabase
    .from("questionnaires")
    .select("*")
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: false });

  const questionnaires = (data ?? []) as Questionnaire[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Questionnaires</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">All questionnaires</h1>
        </div>
        <Link
          href="/questionnaires/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-strong"
        >
          <Plus className="h-4 w-4" aria-hidden /> New questionnaire
        </Link>
      </div>

      <div className="mt-8">
        {questionnaires.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet className="h-8 w-8" aria-hidden />}
            title="No questionnaires yet"
            description="Paste in the questions from that spreadsheet a customer sent you, and AnswerPilot will draft every answer from your library."
            action={
              <Link
                href="/questionnaires/new"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-strong"
              >
                <Plus className="h-4 w-4" aria-hidden /> Create your first
              </Link>
            }
          />
        ) : (
          <Card className="divide-y divide-line">
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
    </div>
  );
}
