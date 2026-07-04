import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrgContext } from "@/lib/data";
import { embedKbRows } from "@/lib/embeddings";
import { planFor } from "@/lib/plans";
import { parseTwoColumnCsv } from "@/lib/csv";

const entrySchema = z.object({
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(8000),
  category: z.string().max(120).nullable().optional(),
});

const bodySchema = z.union([
  z.object({ entries: z.array(entrySchema).min(1).max(500) }),
  z.object({ csv: z.string().min(1).max(500_000) }),
]);

export async function POST(request: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const source = "csv" in parsed.data ? "import" : "manual";
  const rows =
    "csv" in parsed.data
      ? parseTwoColumnCsv(parsed.data.csv).map((r) => ({ ...r, category: null as string | null }))
      : parsed.data.entries.map((e) => ({
          question: e.question,
          answer: e.answer,
          category: e.category ?? null,
        }));

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found. Use the format: question,answer — one per line." },
      { status: 400 }
    );
  }

  // Plan limit check
  const plan = planFor(ctx.org.plan);
  if (plan.kbLimit !== null) {
    const { count } = await ctx.supabase
      .from("kb_entries")
      .select("id", { count: "exact", head: true })
      .eq("org_id", ctx.org.id);
    if ((count ?? 0) + rows.length > plan.kbLimit) {
      return NextResponse.json(
        {
          error: `This import would exceed the ${plan.kbLimit}-entry limit on the ${plan.name} plan. Upgrade in Settings for an unlimited library.`,
        },
        { status: 403 }
      );
    }
  }

  const { data, error } = await ctx.supabase
    .from("kb_entries")
    .insert(rows.map((r) => ({ ...r, org_id: ctx.org.id, source })))
    .select("id, org_id, question, answer, category, source, created_at, updated_at");

  if (error) {
    return NextResponse.json({ error: "Could not save entries. Try again." }, { status: 500 });
  }

  // Semantic index (no-op unless VOYAGE_API_KEY is set; never blocks the save).
  await embedKbRows(ctx.supabase, data ?? []);

  return NextResponse.json({ entries: data });
}
