import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/data";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const { error } = await ctx.supabase
    .from("kb_entries")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.org.id);

  if (error) {
    return NextResponse.json({ error: "Could not delete the entry." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
