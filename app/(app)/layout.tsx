import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/data";
import { planFor } from "@/lib/plans";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-canvas md:flex-row">
      <AppNav orgName={ctx.org.name} planName={planFor(ctx.org.plan).name} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
