import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrgContext } from "@/lib/data";
import { planFor } from "@/lib/plans";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  requester: z.string().max(200).nullable().optional(),
  questions: z.array(z.string().min(3).max(4000)).min(1).max(1000),
});

export async function POST(request: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const plan = planFor(ctx.org.plan);

  if (parsed.data.questions.length > plan.questionsPerQuestionnaire) {
    return NextResponse.json(
      {
        error: `The ${plan.name} plan allows up to ${plan.questionsPerQuestionnaire} questions per questionnaire. Upgrade in Settings for more.`,
      },
      { status: 403 }
    );
  }

  if (plan.questionnaireLimit !== null) {
    const { count } = await ctx.supabase
      .from("questionnaires")
      .select("id", { count: "exact", head: true })
      .eq("org_id", ctx.org.id);
    if ((count ?? 0) >= plan.questionnaireLimit) {
      return NextResponse.json(
        { error: "You've used your free questionnaire. Upgrade in Settings to create more." },
        { status: 403 }
      );
    }
  }

  const { data: questionnaire, error } = await ctx.supabase
    .from("questionnaires")
    .insert({
      org_id: ctx.org.id,
      name: parsed.data.name,
      requester: parsed.data.requester ?? null,
      question_count: parsed.data.questions.length,
    })
    .select("*")
    .single();

  if (error || !questionnaire) {
    return NextResponse.json({ error: "Could not create the questionnaire." }, { status: 500 });
  }

  const { error: qError } = await ctx.supabase.from("questions").insert(
    parsed.data.questions.map((question, position) => ({
      questionnaire_id: questionnaire.id,
      org_id: ctx.org.id,
      position,
      question,
    }))
  );

  if (qError) {
    await ctx.supabase.from("questionnaires").delete().eq("id", questionnaire.id);
    return NextResponse.json({ error: "Could not save the questions. Try again." }, { status: 500 });
  }

  return NextResponse.json({ id: questionnaire.id });
}
