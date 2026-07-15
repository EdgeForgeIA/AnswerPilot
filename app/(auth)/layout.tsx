import Link from "next/link";
import { PenTool } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-on-accent">
          <PenTool className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="text-lg font-semibold tracking-tight text-ink">VeriQuill</span>
      </Link>
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 shadow-card">
        {children}
      </div>
    </div>
  );
}
