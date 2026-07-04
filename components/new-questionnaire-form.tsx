"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button, Card, FieldHint, Input, Label, Textarea } from "@/components/ui";

type Props = {
  maxQuestions: number;
  planName: string;
  atQuestionnaireLimit: boolean;
  libraryEmpty: boolean;
};

/** Split pasted/uploaded text into individual questions. */
function extractQuestions(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) =>
      line
        // strip leading numbering / bullets: "12.", "3)", "-", "•", "Q4:"
        .replace(/^\s*(?:[-•*]|q?\d+[.):]?)\s*/i, "")
        // strip a stray trailing comma from single-column CSV exports
        .replace(/,\s*$/, "")
        .replace(/^"(.*)"$/, "$1")
        .trim()
    )
    .filter((line) => line.length > 2);
}

export function NewQuestionnaireForm({
  maxQuestions,
  planName,
  atQuestionnaireLimit,
  libraryEmpty,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);

  const questions = useMemo(() => extractQuestions(raw), [raw]);
  const overLimit = questions.length > maxQuestions;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    // Spreadsheets get parsed server-side (question-column detection);
    // plain text/CSV is read directly.
    if (/\.xlsx$/i.test(file.name)) {
      setParsing(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/questionnaires/parse", { method: "POST", body });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(payload.error ?? "Could not read that spreadsheet.");
          return;
        }
        setRaw((payload.questions as string[]).join("\n"));
        toast.success(
          `Found ${payload.questions.length} questions in "${payload.sheet}"${
            payload.detectedHeader ? ` (column: ${payload.detectedHeader})` : ""
          }.`
        );
      } catch {
        toast.error("Could not read that spreadsheet. Paste the questions instead.");
      } finally {
        setParsing(false);
      }
      return;
    }

    try {
      const text = await file.text();
      setRaw(text);
      toast.success(`Loaded ${file.name}.`);
    } catch {
      toast.error("Could not read that file. Paste the questions instead.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      toast.error("Give the questionnaire a name.");
      return;
    }
    if (questions.length === 0) {
      toast.error("Add at least one question.");
      return;
    }
    if (overLimit) {
      toast.error(`The ${planName} plan allows up to ${maxQuestions} questions per questionnaire.`);
      return;
    }

    setBusy(true);
    const res = await fetch("/api/questionnaires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        requester: String(form.get("requester") ?? "").trim() || null,
        questions,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      toast.error(body.error ?? "Could not create the questionnaire.");
      return;
    }
    toast.success("Questionnaire created — drafting answers now.");
    router.push(`/questionnaires/${body.id}?autostart=1`);
  }

  if (atQuestionnaireLimit) {
    return (
      <Card className="mt-8 p-6">
        <h2 className="text-[15px] font-semibold text-ink">
          You&apos;ve used your free questionnaire
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          The {planName} plan includes one questionnaire so you can prove it works. Upgrade to
          Pro for unlimited questionnaires — it pays for itself on the first one.
        </p>
        <Link
          href="/settings"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-strong"
        >
          View plans
        </Link>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {libraryEmpty && (
        <p className="rounded-lg bg-amber-soft px-4 py-3 text-sm leading-relaxed text-amber">
          Your answer library is empty, so every draft will come back as a gap.{" "}
          <Link href="/library" className="font-medium underline">
            Add entries or load the sample library
          </Link>{" "}
          first for much better results.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="q-name">Name</Label>
          <Input id="q-name" name="name" placeholder="Acme Corp vendor review" required />
        </div>
        <div>
          <Label htmlFor="q-requester">Customer (optional)</Label>
          <Input id="q-requester" name="requester" placeholder="Acme Corp" />
        </div>
      </div>
      <div>
        <div className="flex items-end justify-between">
          <Label htmlFor="q-questions">Questions</Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mb-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden />{" "}
            {parsing ? "Reading spreadsheet\u2026" : "Upload .xlsx / .csv / .txt"}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.csv,.txt" className="hidden" onChange={onFile} />
        </div>
        <Textarea
          id="q-questions"
          rows={12}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="font-mono text-[13px]"
          placeholder={`Do you hold a SOC 2 report?\nIs customer data encrypted at rest and in transit?\nDo you enforce MFA for all employees?\nDescribe your incident response process.`}
        />
        <FieldHint>
          Numbering and bullets are stripped automatically.{" "}
          <span className={overLimit ? "font-medium text-danger" : ""}>
            {questions.length} question{questions.length === 1 ? "" : "s"} detected
            {overLimit ? ` — over the ${maxQuestions}-question limit on ${planName}` : ""}.
          </span>
        </FieldHint>
      </div>
      <Button type="submit" size="lg" loading={busy} disabled={questions.length === 0 || overLimit}>
        Create &amp; draft answers
      </Button>
    </form>
  );
}
