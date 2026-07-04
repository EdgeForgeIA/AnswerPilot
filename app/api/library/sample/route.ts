import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/data";
import { SAMPLE_KB } from "@/lib/sample-kb";
import { embedKbRows } from "@/lib/embeddings";

export async function POST() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Idempotent: don't double-load the sample set.
  const { count } = await ctx.supabase
    .from("kb_entries")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.org.id)
    .eq("source", "sample");
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "The sample library is already loaded." }, { status: 409 });
  }

  const { data, error } = await ctx.supabase
    .from("kb_entries")
    .insert(SAMPLE_KB.map((e) => ({ ...e, org_id: ctx.org.id, source: "sample" })))
    .select("id, org_id, question, answer, category, source, created_at, updated_at");

  if (error) {
    return NextResponse.json({ error: "Could not load the sample library." }, { status: 500 });
  }

  await embedKbRows(ctx.supabase, data ?? []); // no-op without VOYAGE_API_KEY

  return NextResponse.json({ entries: data });
}
