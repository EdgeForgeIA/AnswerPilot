"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeleteQuestionnaireButton({
  id,
  name,
  questionCount,
  redirectAfter = false,
  className,
}: {
  id: string;
  name: string;
  questionCount: number;
  redirectAfter?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const ok = window.confirm(
      `Delete "${name}" and its ${questionCount} drafted answer${questionCount === 1 ? "" : "s"}?\n\n` +
        `Answers you approved into your library are kept. This can't be undone.`
    );
    if (!ok) return;

    setBusy(true);
    const res = await fetch(`/api/questionnaires/${id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      toast.error(body.error ?? "Could not delete the questionnaire.");
      return;
    }
    toast.success(`Deleted "${name}".`);
    if (redirectAfter) {
      router.push("/questionnaires");
    }
    router.refresh();
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      title="Delete questionnaire"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[13px] font-medium text-ink-faint transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-50",
        className
      )}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
