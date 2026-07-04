import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/data";
import { planFor } from "@/lib/plans";
import { SettingsPanel } from "@/components/settings-panel";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const plan = planFor(ctx.org.plan);
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Settings</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Workspace &amp; billing</h1>
      <Suspense>
      <SettingsPanel
        org={{
          id: ctx.org.id,
          name: ctx.org.name,
          plan: ctx.org.plan,
          subscriptionStatus: ctx.org.subscription_status,
          currentPeriodEnd: ctx.org.current_period_end,
          hasStripeCustomer: Boolean(ctx.org.stripe_customer_id),
        }}
        planName={plan.name}
        email={ctx.user.email ?? ""}
      />
      </Suspense>
    </div>
  );
}
