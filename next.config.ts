import type { NextConfig } from "next";

/**
 * Security headers: your buyers are security reviewers — many will scan these.
 * CSP is intentionally omitted for now: Next.js inline scripts require a
 * nonce-based setup to do it properly; a sloppy CSP is worse than none.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the dev-mode indicator clear of the sidebar footer.
  devIndicators: {
    position: "bottom-right",
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
