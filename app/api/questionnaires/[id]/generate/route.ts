import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/data";
import { draftAnswer } from "@/lib/ai";
import { rankEntries } from "@/lib/retrieval";
import {
  backfillMissingEmbeddings,
  embeddingsEnabled,
  embedTexts,
  hybridRetrieve,
} from "@/lib/embeddings";
import type { KbEntry, Question } from "@/types/db";

export const maxDuration = 60; // Vercel: allow up to 60s per batch

const BATCH_SIZE = 6;
const CONCURRENCY = 3;

/**
 * Drafts answers for the next batch of pending questions. The client calls
 * this endpoint in a loop until `remaining` is 0 — keeping each invocation
 * comfortably inside serverless time limits and giving the user live progress.
 *
 * Retrieval is hybrid when VOYAGE_API_KEY is set (pgvector semantic search
 * merged with lexical ranking) and purely lexical otherwise.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;

  // RLS also protects this, but check explicitly for a clean 404.
  const { data: questionnaire } = await ctx.supabase
    .from("questionnaires")
    .select("id")
    .eq("id", id)
    .eq("org_id", ctx.org.id)
    .maybeSingle();
  if (!questionnaire) {
    return NextResponse.json({ error: "Questionnaire not found." }, { status: 404 });
  }

  const [{ data: pendingData }, { data: kbData }] = await Promise.all([
    ctx.supabase
      .from("questions")
      .select("*")
      .eq("questionnaire_id", id)
      .eq("status", "pending")
      .order("position", { ascending: true })
      .limit(BATCH_SIZE),
    ctx.supabase
      .from("kb_entries")
      .select("id, org_id, question, answer, category, source, created_at, updated_at")
      .eq("org_id", ctx.org.id),
  ]);

  const pending = (pendingData ?? []) as Question[];
  const kb = (kbData ?? []) as KbEntry[];

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  // Semantic retrieval prep: heal any un-embedded library rows, then embed
  // this batch's questions in a single API call. Any failure here degrades
  // gracefully to lexical retrieval — it never blocks drafting.
  let queryEmbeddings: Array<number[] | null> = pending.map(() => null);
  if (embeddingsEnabled() && kb.length > 0) {
    try {
      await backfillMissingEmbeddings(ctx.supabase, ctx.org.id);
      const vectors = await embedTexts(
        pending.map((q) => q.question),
        "query"
      );
      queryEmbeddings = vectors;
    } catch (err) {
      console.error("Query embedding failed, using lexical retrieval:", err);
    }
  }

  let failures = 0;

  // Small concurrency pool.
  const queue = pending.map((question, index) => ({ question, index }));
  async function worker() {
    for (;;) {
      const item = queue.shift();
      if (!item) return;
      const { question, index } = item;
      try {
        const context = embeddingsEnabled()
          ? await hybridRetrieve(
              ctx!.supabase,
              ctx!.org.id,
              question.question,
              queryEmbeddings[index],
              kb
            )
          : rankEntries(question.question, kb);
        const draft = await draftAnswer(question.question, context);
        await ctx!.supabase
          .from("questions")
          .update({
            ai_answer: draft.answer,
            final_answer: draft.answer,
            confidence: draft.confidence,
            status: draft.confidence === "low" ? "flagged" : "answered",
            source_ids: draft.sourceIds,
          })
          .eq("id", question.id);
      } catch (err) {
        failures++;
        console.error(`Draft failed for question ${question.id}:`, err);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));

  const { count: remaining } = await ctx.supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("questionnaire_id", id)
    .eq("status", "pending");

  if (failures === pending.length) {
    // Nothing succeeded — surface the real reason (usually a missing API key).
    const missingKey = !process.env.ANTHROPIC_API_KEY;
    return NextResponse.json(
      {
        error: missingKey
          ? "ANTHROPIC_API_KEY is not configured on the server. Add it to .env.local and restart."
          : "Answer generation failed. Check the server logs and try again.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    processed: pending.length - failures,
    remaining: remaining ?? 0,
  });
}
