import Link from "next/link";
import { PenTool } from "lucide-react";

/**
 * Marketing chrome for the blog. Mirrors the landing page nav/footer
 * (app/page.tsx) at the narrower reading width used by the legal pages.
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Wordmark />
          <nav className="flex items-center gap-5 text-sm text-ink-soft">
            <Link href="/blog" className="hover:text-ink">
              Blog
            </Link>
            <Link href="/#pricing" className="hidden hover:text-ink sm:inline">
              Pricing
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-on-accent hover:bg-accent-strong"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Wordmark />
          <nav className="flex items-center gap-5 text-xs font-medium text-ink-faint">
            <Link href="/blog" className="hover:text-ink">
              Blog
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
          </nav>
          <p className="font-mono text-xs text-ink-faint">
            © {new Date().getFullYear()} VeriQuill · Security questionnaires, answered.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-on-accent">
        <PenTool className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">VeriQuill</span>
    </Link>
  );
}
