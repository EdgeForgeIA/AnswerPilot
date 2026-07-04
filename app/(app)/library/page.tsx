import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/data";
import { planFor } from "@/lib/plans";
import { LibraryManager } from "@/components/library-manager";
import type { KbEntry } from "@/types/db";

export const metadata = { title: "Answer library" };

export default async function LibraryPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { data } = await ctx.supabase
    .from("kb_entries")
    .select("id, org_id, question, answer, category, source, created_at, updated_at")
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: false });

  const plan = planFor(ctx.org.plan);

  return (
    <div>
      <p className="eyebrow">Answer library</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
        Your single source of truth
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Every AI draft is grounded in these entries — nothing else. Add your policies and past
        questionnaire answers here; approving answers in a questionnaire adds them automatically.
      </p>
      <LibraryManager
        initialEntries={(data ?? []) as KbEntry[]}
        kbLimit={plan.kbLimit}
        planName={plan.name}
      />
    </div>
  );
}
