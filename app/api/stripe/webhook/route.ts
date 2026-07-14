import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Stripe → database sync. All billing state is written here (and only here)
 * with the service-role key, so users can never grant themselves a plan.
 *
 * Local dev:  stripe listen --forward-to localhost:3000/api/stripe/webhook
 * Production: add an endpoint in the Stripe dashboard for these events:
 *   checkout.session.completed, customer.subscription.updated,
 *   customer.subscription.deleted
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        if (orgId && session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(
            String(session.subscription)
          );
          await applySubscription(supabase, orgId, subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId =
          subscription.metadata?.org_id ?? (await orgIdFromCustomer(supabase, subscription.customer));
        if (orgId) {
          await applySubscription(supabase, orgId, subscription);
        }
        break;
      }
      default:
        break; // Ignore everything else.
    }
  } catch (err) {
    console.error(`Webhook handling failed for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function orgIdFromCustomer(
  supabase: AdminClient,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): Promise<string | null> {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return null;
  const { data } = await supabase
    .from("orgs")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function applySubscription(
  supabase: AdminClient,
  orgId: string,
  subscription: Stripe.Subscription
) {
  const item = subscription.items.data[0];
  const active = subscription.status === "active" || subscription.status === "trialing";
  const plan = active ? planFromPriceId(item?.price?.id) : null;
  const periodEnd = item?.current_period_end;

  // An ACTIVE subscription whose price we don't recognize is a configuration
  // error (STRIPE_PRICE_PRO / STRIPE_PRICE_SCALE don't match the live catalog).
  // Fail loudly so Stripe shows a failed delivery and retries, instead of
  // silently downgrading a paying customer to free.
  if (active && !plan) {
    throw new Error(
      `Unrecognized price "${item?.price?.id}" on active subscription ${subscription.id}. ` +
        `Check STRIPE_PRICE_PRO / STRIPE_PRICE_SCALE env vars against the Stripe product catalog.`
    );
  }

  const { data, error } = await supabase
    .from("orgs")
    .update({
      plan: plan ?? "free",
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq("id", orgId)
    .select("id, plan");

  // A database error OR zero matched rows both mean billing state was NOT
  // synced — e.g. a bad SUPABASE_SERVICE_ROLE_KEY or a wrong org id. Returning
  // 200 here would tell Stripe everything is fine while a customer's payment
  // goes unhonored, so fail loudly instead.
  if (error) {
    throw new Error(`Database write failed while syncing org ${orgId}: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error(
      `Billing sync matched no org row for id ${orgId} — check the service-role key and org metadata.`
    );
  }

  console.log(`Billing synced: org ${orgId} → plan=${data[0].plan}, status=${subscription.status}`);
}
