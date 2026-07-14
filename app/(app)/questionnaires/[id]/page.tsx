import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrgContext } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { StatusBadge, Spinner } from "@/components/ui";
import { ReviewWorkspace } from "@/components/review-workspace";
import { DeleteQuestionnaireButton } from "@/components/delete-questionnaire-button";
import type { KbEntry, Question, Questionnaire } from "@/types/db";

export const metadata = { title: "Review questionnaire" };

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const { data: questionnaireData } = await ctx.supabase
    .from("questionnaires")
    .select("*")
    .eq("id", id)
    .eq("org_id", ctx.org.id)
    .maybeSingle();
  if (!questionnaireData) notFound();
  const questionnaire = questionnaireData as Questionnaire;

  const [{ data: questionsData }, { data: kbData }] = await Promise.all([
    ctx.supabase
      .from("questions")
      .select("*")
      .eq("questionnaire_id", id)
      .order("position", { ascending: true }),
    ctx.supabase
      .from("kb_entries")
      .select("id, question, answer, category")
      .eq("org_id", ctx.org.id),
  ]);

  return (
    <div>
      <Link
        href="/questionnaires"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-faint hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All questionnaires
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{questionnaire.name}</h1>
        <StatusBadge status={questionnaire.status} />
        <DeleteQuestionnaireButton
          id={questionnaire.id}
          name={questionnaire.name}
          questionCount={questionnaire.question_count}
          redirectAfter
          className="ml-auto"
        />
      </div>
      <p className="mt-1 font-mono text-xs text-ink-faint">
        {questionnaire.question_count} questions · created {formatDate(questionnaire.created_at)}
        {questionnaire.requester ? ` · for ${questionnaire.requester}` : ""}
      </p>

      <Suspense fallback={<div className="flex justify-center py-16"><Spinner /></div>}>
        <ReviewWorkspace
          questionnaireId={questionnaire.id}
          initialQuestions={(questionsData ?? []) as Question[]}
          kbEntries={(kbData ?? []) as Pick<KbEntry, "id" | "question" | "answer" | "category">[]}
        />
      </Suspense>
    </div>
  );
}
