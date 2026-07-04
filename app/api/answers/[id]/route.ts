import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrgContext } from "@/lib/data";
import { embedKbRows } from "@/lib/embeddings";
import type { Question } from "@/types/db";

const bodySchema = z.object({
  final_answer: z.string().max(10000).optional(),
  status: z.enum(["answered", "approved", "flagged"]).optional(),
  save_to_library: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.final_answer !== undefined) update.final_answer = parsed.data.final_answer;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;

  const { data, error } = await ctx.supabase
    .from("questions")
    .update(update)
    .eq("id", id)
    .eq("org_id", ctx.org.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update the answer." }, { status: 500 });
  }
  const question = data as Question;

  // The flywheel: approving an answer grows the library (deduplicated by question text).
  if (parsed.data.status === "approved" && parsed.data.save_to_library && question.final_answer) {
    const { data: existing } = await ctx.supabase
      .from("kb_entries")
      .select("id")
      .eq("org_id", ctx.org.id)
      .eq("question", question.question)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await ctx.supabase
        .from("kb_entries")
        .update({ answer: question.final_answer })
        .eq("id", existing.id);
      await embedKbRows(ctx.supabase, [
        { id: existing.id, question: question.question, answer: question.final_answer },
      ]);
    } else {
      const { data: inserted } = await ctx.supabase
        .from("kb_entries")
        .insert({
          org_id: ctx.org.id,
          question: question.question,
          answer: question.final_answer,
          source: "approved_answer",
        })
        .select("id, question, answer")
        .single();
      if (inserted) await embedKbRows(ctx.supabase, [inserted]);
    }
  }

  // Mark the questionnaire completed when every question is approved.
  const { count: unapproved } = await ctx.supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("questionnaire_id", question.questionnaire_id)
    .neq("status", "approved");
  await ctx.supabase
    .from("questionnaires")
    .update({ status: (unapproved ?? 0) === 0 ? "completed" : "in_review" })
    .eq("id", question.questionnaire_id);

  return NextResponse.json({ question });
}
