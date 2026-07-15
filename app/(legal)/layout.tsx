import Link from "next/link";
import { PenTool } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-on-accent">
              <PenTool className="h-4 w-4" aria-hidden />
            </span>
            VeriQuill
          </Link>
          <Link href="/" className="text-sm font-medium text-ink-soft hover:text-ink">
            Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <article className="legal-doc">{children}</article>
      </main>
    </div>
  );
}
