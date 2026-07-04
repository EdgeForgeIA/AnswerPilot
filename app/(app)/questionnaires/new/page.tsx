import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/data";
import { planFor } from "@/lib/plans";
import { NewQuestionnaireForm } from "@/components/new-questionnaire-form";

export const metadata = { title: "New questionnaire" };

export default async function NewQuestionnairePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const plan = planFor(ctx.org.plan);
  const { count: existingCount } = await ctx.supabase
    .from("questionnaires")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.org.id);
  const { count: kbCount } = await ctx.supabase
    .from("kb_entries")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.org.id);

  const atQuestionnaireLimit =
    plan.questionnaireLimit !== null && (existingCount ?? 0) >= plan.questionnaireLimit;

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">New questionnaire</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
        Paste in the questions
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        One question per line, or upload the .csv/.txt you were sent. Drafting starts
        immediately after you create it.
      </p>
      <NewQuestionnaireForm
        maxQuestions={plan.questionsPerQuestionnaire}
        planName={plan.name}
        atQuestionnaireLimit={atQuestionnaireLimit}
        libraryEmpty={(kbCount ?? 0) === 0}
      />
    </div>
  );
}
