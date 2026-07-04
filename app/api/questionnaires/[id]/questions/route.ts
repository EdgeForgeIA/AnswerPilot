import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/data";

/** Polled by the review workspace while drafting is in progress. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const { data, error } = await ctx.supabase
    .from("questions")
    .select("*")
    .eq("questionnaire_id", id)
    .eq("org_id", ctx.org.id)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Could not load questions." }, { status: 500 });
  }
  return NextResponse.json({ questions: data ?? [] });
}
