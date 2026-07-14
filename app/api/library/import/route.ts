import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getOrgContext } from "@/lib/data";
import { planFor } from "@/lib/plans";
import { parseTwoColumnCsv } from "@/lib/csv";
import { embedKbRows } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ENTRIES = 2000;

/**
 * File-based library import: .csv (question,answer) or .xlsx.
 * XLSX detection mirrors the questionnaire parser's approach: pick the
 * densest sheet, find the question column (header first, content second),
 * and pair it with an answer column.
 */
export async function POST(request: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (8 MB max)." }, { status: 413 });
  }

  let entries: Array<{ question: string; answer: string }>;
  let detail = "";

  if (/\.csv$/i.test(file.name)) {
    entries = parseTwoColumnCsv(await file.text());
    detail = "CSV";
  } else if (/\.xlsx$/i.test(file.name)) {
    const parsed = await parseXlsxLibrary(await file.arrayBuffer());
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 422 });
    }
    entries = parsed.entries;
    detail = `sheet "${parsed.sheet}"`;
  } else {
    return NextResponse.json(
      { error: "Unsupported file type — upload a .csv or .xlsx." },
      { status: 415 }
    );
  }

  entries = entries
    .map((e) => ({ question: e.question.trim(), answer: e.answer.trim() }))
    .filter((e) => e.question.length >= 3 && e.answer.length >= 1)
    .slice(0, MAX_ENTRIES);

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No question/answer pairs found in that file." },
      { status: 422 }
    );
  }

  // Plan limit (server-side, like the paste path).
  const plan = planFor(ctx.org.plan);
  if (plan.kbLimit !== null) {
    const { count } = await ctx.supabase
      .from("kb_entries")
      .select("id", { count: "exact", head: true })
      .eq("org_id", ctx.org.id);
    if ((count ?? 0) + entries.length > plan.kbLimit) {
      return NextResponse.json(
        {
          error: `This import would exceed your plan's library limit of ${plan.kbLimit} entries. Upgrade to import more.`,
        },
        { status: 403 }
      );
    }
  }

  const { data, error } = await ctx.supabase
    .from("kb_entries")
    .insert(entries.map((e) => ({ ...e, org_id: ctx.org.id, source: "import" })))
    .select("id, org_id, question, answer, category, source, created_at, updated_at");

  if (error) {
    return NextResponse.json({ error: "Could not save entries. Try again." }, { status: 500 });
  }

  await embedKbRows(ctx.supabase, data ?? []); // no-op without VOYAGE_API_KEY

  return NextResponse.json({ entries: data, imported: data?.length ?? 0, detail });
}

/* ── XLSX question/answer column detection ───────────────────────── */

type LibParse = { entries: Array<{ question: string; answer: string }>; sheet: string } | { error: string };

async function parseXlsxLibrary(buf: ArrayBuffer): Promise<LibParse> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buf);
  } catch {
    return { error: "Couldn't read that file. Is it a valid .xlsx workbook?" };
  }

  let best: { sheet: ExcelJS.Worksheet; cells: number } | null = null;
  workbook.eachSheet((sheet) => {
    let cells = 0;
    sheet.eachRow((row) => row.eachCell(() => cells++));
    if (!best || cells > best.cells) best = { sheet, cells };
  });
  const picked = best as { sheet: ExcelJS.Worksheet; cells: number } | null;
  if (!picked || picked.cells === 0) return { error: "That workbook looks empty." };
  const sheet = picked.sheet;

  type Col = { header: string; values: string[]; index: number };
  const columns = new Map<number, Col>();
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = cellText(cell);
      if (!text) return;
      let col = columns.get(colNumber);
      if (!col) {
        col = { header: "", values: [], index: colNumber };
        columns.set(colNumber, col);
      }
      if (rowNumber <= 2 && !col.header) col.header = text;
      else col.values.push(text);
    });
  });
  if (columns.size < 2) {
    return { error: "Need at least two columns (question, answer) — found fewer." };
  }

  const cols = [...columns.values()];
  let qCol = cols.find((c) => /question/i.test(c.header));
  let aCol = cols.find((c) => /answer|response/i.test(c.header) && c !== qCol);

  // Fallback: first two columns with content.
  if (!qCol || !aCol) {
    const sorted = cols.sort((a, b) => a.index - b.index);
    qCol = qCol ?? sorted[0];
    aCol = aCol ?? sorted.find((c) => c !== qCol);
  }
  if (!qCol || !aCol) return { error: "Couldn't identify question and answer columns." };

  // Pair by aligned row positions via re-walk (values arrays can misalign when
  // cells are empty, so walk rows directly).
  const entries: Array<{ question: string; answer: string }> = [];
  const startRow = qCol.header || aCol.header ? 2 : 1;
  for (let r = startRow; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const q = cellText(row.getCell(qCol.index));
    const a = cellText(row.getCell(aCol.index));
    if (q && a) entries.push({ question: q, answer: a });
  }

  return { entries, sheet: sheet.name };
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return "";
  if (typeof v === "object") {
    if ("richText" in v && Array.isArray(v.richText)) {
      return v.richText.map((r) => r.text).join("").trim();
    }
    if ("text" in v && typeof v.text === "string") return v.text.trim();
    if ("result" in v && (typeof v.result === "string" || typeof v.result === "number")) {
      return String(v.result).trim();
    }
  }
  return "";
}
