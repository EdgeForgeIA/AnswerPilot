import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrgContext } from "@/lib/data";
import { getStripe, priceIdFor } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

const bodySchema = z.object({ plan: z.enum(["pro", "scale"]) });

export async function POST(request: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Guard against swapped/misconfigured price env vars: verify the Stripe
    // price actually charges what this plan advertises before checking out.
    const priceId = priceIdFor(parsed.data.plan);
    const price = await stripe.prices.retrieve(priceId);
    const expectedCents = PLANS[parsed.data.plan].priceMonthly * 100;
    if (price.unit_amount !== expectedCents || price.recurring?.interval !== "month") {
      console.error(
        `Stripe price mismatch: ${priceId} charges ${price.unit_amount} ${price.currency}/${price.recurring?.interval}, ` +
          `but the ${parsed.data.plan} plan advertises ${expectedCents} usd/month. ` +
          `Check STRIPE_PRICE_PRO / STRIPE_PRICE_SCALE — the values are likely swapped.`
      );
      return NextResponse.json(
        {
          error:
            "Billing is misconfigured on the server (plan/price mismatch) — checkout was blocked to avoid charging the wrong amount. Ask the operator to check the STRIPE_PRICE_* env vars.",
        },
        { status: 500 }
      );
    }

    // Reuse the Stripe customer if we have one.
    let customerId = ctx.org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ctx.user.email ?? undefined,
        name: ctx.org.name,
        metadata: { org_id: ctx.org.id },
      });
      customerId = customer.id;
      await ctx.supabase.from("orgs").update({ stripe_customer_id: customerId }).eq("id", ctx.org.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { org_id: ctx.org.id } },
      metadata: { org_id: ctx.org.id, plan: parsed.data.plan },
      success_url: `${siteUrl}/settings?checkout=success`,
      cancel_url: `${siteUrl}/settings?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
