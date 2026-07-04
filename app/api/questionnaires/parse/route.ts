import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getOrgContext } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_ROWS = 2000;

/**
 * Extracts questions from an uploaded .xlsx questionnaire.
 *
 * Real-world questionnaires are messy, so column detection is heuristic:
 *   1. A header cell matching /question/i wins.
 *   2. Otherwise, the column with the most question-looking cells
 *      (ends in "?", or long interrogative text) wins.
 *   3. Otherwise, the first column with text wins.
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

  let workbook: ExcelJS.Workbook;
  try {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that file. Is it a valid .xlsx workbook?" },
      { status: 422 }
    );
  }

  // Pick the sheet with the most content — questionnaires often have
  // cover/instructions sheets first.
  let best: { sheet: ExcelJS.Worksheet; cells: number } | null = null;
  workbook.eachSheet((sheet) => {
    let cells = 0;
    sheet.eachRow((row) => {
      row.eachCell(() => cells++);
    });
    if (!best || cells > best.cells) best = { sheet, cells };
  });
  const picked = best as { sheet: ExcelJS.Worksheet; cells: number } | null;
  if (!picked || picked.cells === 0) {
    return NextResponse.json({ error: "That workbook looks empty." }, { status: 422 });
  }
  const sheet = picked.sheet;

  // Collect cell text per column.
  const columns = new Map<number, { header: string; values: string[] }>();
  let rowCount = 0;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowCount >= MAX_ROWS) return;
    rowCount++;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = cellText(cell);
      if (!text) return;
      let col = columns.get(colNumber);
      if (!col) {
        col = { header: "", values: [] };
        columns.set(colNumber, col);
      }
      if (rowNumber <= 3 && !col.header) col.header = text;
      else col.values.push(text);
    });
  });

  if (columns.size === 0) {
    return NextResponse.json({ error: "No text content found in that workbook." }, { status: 422 });
  }

  // Heuristic 1: header named like "question".
  let chosen: { header: string; values: string[] } | undefined;
  for (const col of columns.values()) {
    if (/question|inquiry|control|requirement/i.test(col.header)) {
      chosen = col;
      break;
    }
  }

  // Heuristic 2: most question-like content.
  if (!chosen) {
    let bestScore = -1;
    for (const col of columns.values()) {
      const score = col.values.reduce((acc, v) => {
        if (v.trim().endsWith("?")) return acc + 2;
        if (v.length > 25 && /\b(do|does|is|are|how|describe|provide|have|what)\b/i.test(v))
          return acc + 1;
        return acc;
      }, 0);
      if (score > bestScore && col.values.length > 0) {
        bestScore = score;
        chosen = col;
      }
    }
  }

  if (!chosen || chosen.values.length === 0) {
    return NextResponse.json(
      { error: "Couldn't find a question column in that sheet." },
      { status: 422 }
    );
  }

  // If the header itself looks like a question (no real header row), keep it.
  const questions = [
    ...(chosen.header.trim().endsWith("?") ? [chosen.header] : []),
    ...chosen.values,
  ]
    .map((q) => q.replace(/\s+/g, " ").trim())
    .filter((q) => q.length >= 5);

  return NextResponse.json({
    questions,
    sheet: sheet.name,
    detectedHeader: chosen.header || null,
  });
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
