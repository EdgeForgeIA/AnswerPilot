import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description =
  "VeriQuill drafts accurate, cited answers to security questionnaires from your own approved answer library, so deals stop stalling in vendor review.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VeriQuill — Security questionnaires, answered in minutes",
    template: "%s · VeriQuill",
  },
  description,
  openGraph: {
    title: "VeriQuill — Security questionnaires, answered in minutes",
    description,
    url: siteUrl,
    siteName: "VeriQuill",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VeriQuill — Security questionnaires, answered in minutes",
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <Analytics />
      </body>
    </html>
  );
}
