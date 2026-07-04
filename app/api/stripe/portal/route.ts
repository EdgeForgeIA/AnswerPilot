import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/data";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!ctx.org.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account yet — upgrade to a paid plan first." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: ctx.org.stripe_customer_id,
      return_url: `${siteUrl}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 500 });
  }
}
