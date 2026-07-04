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

  await supabase
    .from("orgs")
    .update({
      plan: plan ?? "free",
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq("id", orgId);
}
