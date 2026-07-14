import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/data";

/**
 * Deletes a questionnaire and (via ON DELETE CASCADE) its questions.
 * Deliberately does NOT touch kb_entries: answers approved into the library
 * are the org's asset and survive the questionnaire that produced them.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const { data, error } = await ctx.supabase
    .from("questionnaires")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.org.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Could not delete the questionnaire." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Questionnaire not found." }, { status: 404 });
  }
  return NextResponse.json({ deleted: id });
}
