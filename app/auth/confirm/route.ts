import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies email-link tokens (password recovery, email confirmation) via
 * token_hash, which — unlike the PKCE code flow — works no matter which
 * browser or device the link is opened in. This is the Supabase-recommended
 * pattern for links that arrive by email.
 *
 * Requires the email templates to link here, e.g. the Reset Password template:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/dashboard";

  // Only allow same-origin relative redirects.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error("Email link verification failed:", error.message);
    const dest = type === "recovery" ? "/forgot-password?error=expired" : "/login?error=expired";
    return NextResponse.redirect(new URL(dest, url.origin));
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
