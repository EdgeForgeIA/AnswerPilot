"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookMarked, Plus, Search, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Button, Card, EmptyState, FieldHint, Input, Label, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { KbEntry } from "@/types/db";

type Props = {
  initialEntries: KbEntry[];
  kbLimit: number | null;
  planName: string;
};

export function LibraryManager({ initialEntries, kbLimit, planName }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<KbEntry[]>(initialEntries);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"none" | "add" | "import">("none");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.question.toLowerCase().includes(q) ||
        e.answer.toLowerCase().includes(q) ||
        (e.category ?? "").toLowerCase().includes(q)
    );
  }, [entries, query]);

  const atLimit = kbLimit !== null && entries.length >= kbLimit;

  async function addEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      entries: [
        {
          question: String(form.get("question") ?? "").trim(),
          answer: String(form.get("answer") ?? "").trim(),
          category: String(form.get("category") ?? "").trim() || null,
        },
      ],
    };
    if (!payload.entries[0].question || !payload.entries[0].answer) {
      toast.error("Both a question and an answer are required.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "Could not save the entry.");
      return;
    }
    setEntries((prev) => [...(body.entries as KbEntry[]), ...prev]);
    setMode("none");
    toast.success("Entry added to your library.");
    router.refresh();
  }

  async function bulkImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const csv = String(form.get("csv") ?? "").trim();
    if (!csv) {
      toast.error("Paste at least one question,answer line.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    setBusy(false);

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "Import failed.");
      return;
    }
    const added = body.entries as KbEntry[];
    setEntries((prev) => [...added, ...prev]);
    setMode("none");
    toast.success(`Imported ${added.length} ${added.length === 1 ? "entry" : "entries"}.`);
    router.refresh();
  }

  async function loadSample() {
    setBusy(true);
    const res = await fetch("/api/library/sample", { method: "POST" });
    setBusy(false);

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "Could not load the sample library.");
      return;
    }
    setEntries((prev) => [...(body.entries as KbEntry[]), ...prev]);
    toast.success("Sample library loaded — try answering a questionnaire with it.");
    router.refresh();
  }

  async function remove(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      toast.error("Could not delete the entry.");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Entry deleted.");
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library…"
            className="pl-9"
            aria-label="Search library"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-faint">
            {entries.length}
            {kbLimit !== null ? ` / ${kbLimit}` : ""} entries
          </span>
          <Button variant="secondary" size="sm" onClick={() => setMode(mode === "import" ? "none" : "import")}>
            <Upload className="h-3.5 w-3.5" aria-hidden /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setMode(mode === "add" ? "none" : "add")} disabled={atLimit}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add entry
          </Button>
        </div>
      </div>

      {atLimit && (
        <p className="mt-3 rounded-lg bg-amber-soft px-4 py-2.5 text-sm text-amber">
          You&apos;ve reached the {kbLimit}-entry limit on the {planName} plan. Upgrade in
          Settings for an unlimited library.
        </p>
      )}

      {mode === "add" && (
        <Card className="mt-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Add an entry</h2>
            <button onClick={() => setMode("none")} aria-label="Close" className="text-ink-faint hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={addEntry} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="kb-question">Question it answers</Label>
              <Input id="kb-question" name="question" placeholder="Do you encrypt data at rest?" required />
            </div>
            <div>
              <Label htmlFor="kb-answer">Approved answer</Label>
              <Textarea
                id="kb-answer"
                name="answer"
                rows={4}
                placeholder="Yes. All customer data is encrypted at rest using AES-256…"
                required
              />
            </div>
            <div className="max-w-xs">
              <Label htmlFor="kb-category">Category (optional)</Label>
              <Input id="kb-category" name="category" placeholder="Data protection" />
            </div>
            <Button type="submit" loading={busy}>
              Save to library
            </Button>
          </form>
        </Card>
      )}

      {mode === "import" && (
        <Card className="mt-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Bulk import</h2>
            <button onClick={() => setMode("none")} aria-label="Close" className="text-ink-faint hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={bulkImport} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="kb-csv">One entry per line: question,answer</Label>
              <Textarea
                id="kb-csv"
                name="csv"
                rows={7}
                className="font-mono text-[13px]"
                placeholder={`Do you hold a SOC 2 report?,"Yes, we maintain a SOC 2 Type II report…"\nWhere is data hosted?,"AWS us-east-1, with EU residency available."`}
              />
              <FieldHint>
                Quote fields that contain commas. The fastest start: export your last completed
                questionnaire and paste it here.
              </FieldHint>
            </div>
            <Button type="submit" loading={busy}>
              Import entries
            </Button>
          </form>
        </Card>
      )}

      <div className="mt-6">
        {entries.length === 0 ? (
          <EmptyState
            icon={<BookMarked className="h-8 w-8" aria-hidden />}
            title="Your library is empty"
            description="Add your first approved answers — or load a realistic sample library to see the whole product working in the next 60 seconds."
            action={
              <Button onClick={loadSample} loading={busy} variant="secondary">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden /> Load sample library
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">No entries match “{query}”.</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((entry) => (
              <Card key={entry.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.category && <span className="stamp text-ink-soft bg-line/50">{entry.category}</span>}
                      {entry.source === "approved_answer" && (
                        <span className="stamp text-accent bg-accent-soft">from approval</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-snug text-ink">{entry.question}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                      {entry.answer}
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-ink-faint">
                      added {formatDate(entry.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(entry.id)}
                    loading={deletingId === entry.id}
                    aria-label={`Delete entry: ${entry.question}`}
                    className="text-ink-faint hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
