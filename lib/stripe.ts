import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/** Lazy so the app can build without Stripe env vars present. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local — see .env.example.");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export function priceIdFor(plan: "pro" | "scale"): string {
  const id = plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_SCALE;
  if (!id) {
    throw new Error(
      `Missing Stripe price ID for the ${plan} plan. Set STRIPE_PRICE_PRO / STRIPE_PRICE_SCALE in .env.local.`
    );
  }
  return id;
}

export function planFromPriceId(priceId: string | undefined): "pro" | "scale" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_SCALE) return "scale";
  return null;
}
