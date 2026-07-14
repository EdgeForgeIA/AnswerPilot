import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/data";
import { draftAnswer } from "@/lib/ai";
import { rankEntries } from "@/lib/retrieval";
import { embeddingsEnabled, embedTexts, hybridRetrieve } from "@/lib/embeddings";
import type { KbEntry, Question } from "@/types/db";

export const maxDuration = 30;

/**
 * Redrafts a single answer from the current library — the companion to
 * "add the missing entry to your library, then regenerate."
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const { data: questionData } = await ctx.supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .eq("org_id", ctx.org.id)
    .maybeSingle();
  if (!questionData) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }
  const question = questionData as Question;
  if (question.status === "approved") {
    return NextResponse.json(
      { error: "This answer is approved. Edit it instead of regenerating." },
      { status: 400 }
    );
  }

  const { data: kbData } = await ctx.supabase
    .from("kb_entries")
    .select("id, org_id, question, answer, category, source, created_at, updated_at")
    .eq("org_id", ctx.org.id);
  const kb = (kbData ?? []) as KbEntry[];

  try {
    let context = rankEntries(question.question, kb);
    if (embeddingsEnabled() && kb.length > 0) {
      try {
        const [embedding] = await embedTexts([question.question], "query");
        context = await hybridRetrieve(ctx.supabase, ctx.org.id, question.question, embedding, kb);
      } catch (err) {
        console.error("Regenerate: embedding failed, using lexical:", err);
      }
    }

    const draft = await draftAnswer(question.question, context);
    const { data: updated, error } = await ctx.supabase
      .from("questions")
      .update({
        ai_answer: draft.answer,
        final_answer: draft.answer,
        confidence: draft.confidence,
        status: draft.confidence === "low" ? "flagged" : "answered",
        source_ids: draft.sourceIds,
      })
      .eq("id", question.id)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: "Could not save the new draft." }, { status: 500 });
    }
    return NextResponse.json({ question: updated });
  } catch (err) {
    console.error(`Regenerate failed for question ${id}:`, err);
    return NextResponse.json({ error: "Drafting failed. Try again." }, { status: 500 });
  }
}
