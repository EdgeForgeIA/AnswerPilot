import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">That page doesn&apos;t exist</h1>
      <Link href="/dashboard" className="mt-5 text-sm font-medium text-accent hover:underline">
        Back to the dashboard
      </Link>
    </div>
  );
}
