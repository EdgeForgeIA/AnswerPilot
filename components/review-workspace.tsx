"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, Download, Pencil, RefreshCw, Sparkles, X } from "lucide-react";
import { Button, Card, ConfidenceStamp, Textarea } from "@/components/ui";
import { cn, qid } from "@/lib/utils";
import type { KbEntry, Question } from "@/types/db";

type Filter = "all" | "needs_review" | "flagged" | "approved";

type Props = {
  questionnaireId: string;
  initialQuestions: Question[];
  kbEntries: Pick<KbEntry, "id" | "question" | "answer" | "category">[];
};

export function ReviewWorkspace({ questionnaireId, initialQuestions, kbEntries }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [filter, setFilter] = useState<Filter>("all");
  const [generating, setGenerating] = useState(false);
  const [progressDone, setProgressDone] = useState(0);
  const startedRef = useRef(false);

  const kbById = useMemo(() => new Map(kbEntries.map((e) => [e.id, e])), [kbEntries]);
  const total = questions.length;
  const pendingCount = questions.filter((q) => q.status === "pending").length;
  const approvedCount = questions.filter((q) => q.status === "approved").length;
  const flaggedCount = questions.filter((q) => q.status === "flagged").length;

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/questionnaires/${questionnaireId}/questions`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      setQuestions(body.questions as Question[]);
    }
  }, [questionnaireId]);

  const runGeneration = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setGenerating(true);
    setProgressDone(0);

    try {
      for (;;) {
        const res = await fetch(`/api/questionnaires/${questionnaireId}/generate`, {
          method: "POST",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(body.error ?? "Answer generation failed.");
          break;
        }
        await refetch();
        if (body.remaining === 0) {
          toast.success("All answers drafted. Time to review.");
          break;
        }
        setProgressDone((prev) => prev + (body.processed ?? 0));
      }
    } finally {
      setGenerating(false);
      startedRef.current = false;
      router.refresh();
    }
  }, [questionnaireId, refetch, router]);

  // Auto-start drafting when arriving from the create flow.
  useEffect(() => {
    if (searchParams.get("autostart") === "1" && pendingCount > 0) {
      void runGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answeredSoFar = total - pendingCount;
  const progressPct = total === 0 ? 0 : Math.round((answeredSoFar / total) * 100);

  const visible = useMemo(() => {
    switch (filter) {
      case "needs_review":
        return questions.filter((q) => q.status === "answered");
      case "flagged":
        return questions.filter((q) => q.status === "flagged");
      case "approved":
        return questions.filter((q) => q.status === "approved");
      default:
        return questions;
    }
  }, [questions, filter]);

  function updateLocal(updated: Question) {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  }

  return (
    <div className="mt-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", `All · ${total}`],
              ["needs_review", `Needs review · ${questions.filter((q) => q.status === "answered").length}`],
              ["flagged", `Flagged · ${flaggedCount}`],
              ["approved", `Approved · ${approvedCount}`],
            ] as Array<[Filter, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                filter === key
                  ? "bg-ink text-canvas"
                  : "bg-surface text-ink-soft border border-line hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && !generating && (
            <Button size="sm" onClick={runGeneration}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Draft {pendingCount} pending
            </Button>
          )}
          <a
            href={`/api/questionnaires/${questionnaireId}/export?format=xlsx`}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-raised"
          >
            <Download className="h-3.5 w-3.5" aria-hidden /> Export XLSX
          </a>
          <a
            href={`/api/questionnaires/${questionnaireId}/export`}
            className="inline-flex h-8 items-center rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-raised"
          >
            CSV
          </a>
        </div>
      </div>

      {/* Generation progress */}
      {(generating || pendingCount > 0) && (
        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-ink">
              {generating && <RefreshCw className="h-4 w-4 animate-spin text-accent" aria-hidden />}
              {generating
                ? `Drafting answers from your library… ${answeredSoFar} of ${total}`
                : `${pendingCount} question${pendingCount === 1 ? "" : "s"} waiting to be drafted`}
            </span>
            <span className="font-mono text-xs text-ink-faint">{progressPct}%</span>
          </div>
          <div
            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {generating && progressDone >= 0 && (
            <p className="mt-2 text-xs text-ink-faint">
              Each draft is grounded in your answer library and graded for confidence. You can
              start reviewing finished rows now.
            </p>
          )}
        </Card>
      )}

      {/* Question rows */}
      <ul className="mt-5 space-y-3">
        {visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">Nothing here for this filter.</p>
        ) : (
          visible.map((q) => (
            <QuestionRow key={q.id} question={q} kbById={kbById} onUpdated={updateLocal} />
          ))
        )}
      </ul>
    </div>
  );
}

/* ── Single row ──────────────────────────────────────────────────── */

function QuestionRow({
  question,
  kbById,
  onUpdated,
}: {
  question: Question;
  kbById: Map<string, Pick<KbEntry, "id" | "question" | "answer" | "category">>;
  onUpdated: (q: Question) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(question.final_answer ?? "");
  const [busy, setBusy] = useState<"approve" | "save" | null>(null);
  const [showSources, setShowSources] = useState(false);

  const sources = question.source_ids
    .map((id) => kbById.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  async function patch(body: Record<string, unknown>, kind: "approve" | "save") {
    setBusy(kind);
    const res = await fetch(`/api/answers/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      toast.error(payload.error ?? "Could not update the answer.");
      return false;
    }
    onUpdated(payload.question as Question);
    return true;
  }

  async function approve() {
    const ok = await patch(
      { final_answer: draft || question.final_answer, status: "approved", save_to_library: true },
      "approve"
    );
    if (ok) {
      setEditing(false);
      toast.success("Approved and saved to your library.");
    }
  }

  async function saveEdit() {
    if (!draft.trim()) {
      toast.error("The answer can't be empty.");
      return;
    }
    const ok = await patch({ final_answer: draft, status: "answered" }, "save");
    if (ok) {
      setEditing(false);
      toast.success("Answer updated.");
    }
  }

  const isApproved = question.status === "approved";
  const isPending = question.status === "pending";

  return (
    <li>
      <Card
        className={cn(
          "p-5 transition-colors",
          isApproved && "border-accent/40",
          question.status === "flagged" && "border-amber/40"
        )}
      >
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 font-mono text-[11px] font-medium text-ink-faint">
            {qid(question.position)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="max-w-2xl text-sm font-semibold leading-snug text-ink">
                {question.question}
              </p>
              <div className="flex items-center gap-2">
                <ConfidenceStamp confidence={question.confidence} />
                {isApproved && (
                  <span className="stamp text-on-accent bg-accent border-solid">approved</span>
                )}
              </div>
            </div>

            {/* Answer body */}
            <div className="mt-3">
              {isPending ? (
                <p className="text-sm italic text-ink-faint">Waiting to be drafted…</p>
              ) : editing ? (
                <div>
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="mt-2.5 flex gap-2">
                    <Button size="sm" onClick={saveEdit} loading={busy === "save"}>
                      Save changes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(false);
                        setDraft(question.final_answer ?? "");
                      }}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className={cn(
                    "whitespace-pre-wrap text-sm leading-relaxed",
                    question.final_answer?.includes("[NEEDS INPUT") ? "text-amber" : "text-ink-soft"
                  )}
                >
                  {question.final_answer}
                </p>
              )}
            </div>

            {/* Sources */}
            {sources.length > 0 && !editing && (
              <div className="mt-3">
                <button
                  onClick={() => setShowSources((s) => !s)}
                  className="font-mono text-[11px] font-medium text-accent hover:underline"
                >
                  {showSources ? "hide" : "show"} {sources.length} cited{" "}
                  {sources.length === 1 ? "source" : "sources"}
                </button>
                {showSources && (
                  <ul className="mt-2 space-y-2 border-l-2 border-accent-soft pl-3.5">
                    {sources.map((s) => (
                      <li key={s.id} className="text-xs leading-relaxed text-ink-faint">
                        <span className="font-medium text-ink-soft">{s.question}</span> — {s.answer}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Row actions */}
            {!isPending && !editing && (
              <div className="mt-4 flex flex-wrap gap-2">
                {!isApproved && (
                  <Button size="sm" onClick={approve} loading={busy === "approve"}>
                    <Check className="h-3.5 w-3.5" aria-hidden /> Approve
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </li>
  );
}
