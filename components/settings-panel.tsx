"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/plans";
import { Button, Card, Input, Label } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import type { Plan } from "@/types/db";

type Props = {
  org: {
    id: string;
    name: string;
    plan: Plan;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
    hasStripeCustomer: boolean;
  };
  planName: string;
  email: string;
};

export function SettingsPanel({ org, email }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Returning from Stripe Checkout: acknowledge, then refresh once the
  // webhook has flipped the plan (it usually lands within a second or two).
  useEffect(() => {
    const state = searchParams.get("checkout");
    if (!state) return;
    if (state === "success") {
      toast.success("Payment received — your plan updates as soon as Stripe confirms it.");
      const timer = setTimeout(() => router.refresh(), 2500);
      router.replace("/settings", { scroll: false });
      return () => clearTimeout(timer);
    }
    if (state === "cancelled") {
      toast.info("Checkout cancelled — no changes made.");
      router.replace("/settings", { scroll: false });
    }
  }, [searchParams, router]);
  const [name, setName] = useState(org.name);
  const [savingName, setSavingName] = useState(false);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("The workspace needs a name.");
      return;
    }
    setSavingName(true);
    const supabase = createClient();
    const { error } = await supabase.from("orgs").update({ name: trimmed }).eq("id", org.id);
    setSavingName(false);
    if (error) {
      toast.error("Could not rename the workspace.");
      return;
    }
    toast.success("Workspace renamed.");
    router.refresh();
  }

  async function checkout(plan: "pro" | "scale") {
    setBusyPlan(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const body = await res.json().catch(() => ({}));
    setBusyPlan(null);
    if (!res.ok || !body.url) {
      toast.error(body.error ?? "Could not start checkout.");
      return;
    }
    window.location.href = body.url;
  }

  async function openPortal() {
    setPortalBusy(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setPortalBusy(false);
    if (!res.ok || !body.url) {
      toast.error(body.error ?? "Could not open the billing portal.");
      return;
    }
    window.location.href = body.url;
  }

  const paidPlans = [PLANS.pro, PLANS.scale];

  return (
    <div className="mt-8 space-y-6">
      {/* Workspace */}
      <Card className="p-6">
        <h2 className="text-[15px] font-semibold text-ink">Workspace</h2>
        <form onSubmit={saveName} className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="org-name">Company name</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary" loading={savingName}>
            Save
          </Button>
        </form>
        <p className="mt-3 text-xs text-ink-faint">Signed in as {email}</p>
      </Card>

      {/* Billing */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Plan &amp; billing</h2>
            <p className="mt-1 text-sm text-ink-soft">
              You&apos;re on <span className="font-medium text-ink">{PLANS[org.plan].name}</span>
              {org.subscriptionStatus ? ` (${org.subscriptionStatus})` : ""}
              {org.currentPeriodEnd ? ` · renews ${formatDate(org.currentPeriodEnd)}` : ""}.
            </p>
          </div>
          {org.hasStripeCustomer && (
            <Button variant="secondary" size="sm" onClick={openPortal} loading={portalBusy}>
              <CreditCard className="h-3.5 w-3.5" aria-hidden /> Manage billing
            </Button>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {paidPlans.map((tier) => {
            const isCurrent = org.plan === tier.id;
            return (
              <div
                key={tier.id}
                className={cn(
                  "rounded-xl border p-5",
                  isCurrent ? "border-accent bg-accent-soft/40" : "border-line"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">{tier.name}</h3>
                  <span className="font-mono text-sm text-ink-soft">${tier.priceMonthly}/mo</span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {tier.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  variant={isCurrent ? "secondary" : "primary"}
                  disabled={isCurrent}
                  loading={busyPlan === tier.id}
                  onClick={() => checkout(tier.id as "pro" | "scale")}
                >
                  {isCurrent ? "Current plan" : `Upgrade to ${tier.name}`}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Payments are processed by Stripe. Upgrades take effect immediately; downgrades and
          cancellations apply at the end of the billing period via Manage billing.
        </p>
      </Card>
    </div>
  );
}
