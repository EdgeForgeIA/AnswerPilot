import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getOrgContext } from "@/lib/data";
import { toCsv } from "@/lib/csv";
import type { Question, Questionnaire } from "@/types/db";

export const runtime = "nodejs";

/** Export a questionnaire: ?format=csv (default) or ?format=xlsx. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const { data: questionnaireData } = await ctx.supabase
    .from("questionnaires")
    .select("*")
    .eq("id", id)
    .eq("org_id", ctx.org.id)
    .maybeSingle();
  if (!questionnaireData) {
    return NextResponse.json({ error: "Questionnaire not found." }, { status: 404 });
  }
  const questionnaire = questionnaireData as Questionnaire;

  const { data } = await ctx.supabase
    .from("questions")
    .select("*")
    .eq("questionnaire_id", id)
    .order("position", { ascending: true });
  const questions = (data ?? []) as Question[];

  const filename =
    questionnaire.name.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-") || "questionnaire";

  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  if (format === "xlsx") {
    const buffer = await buildWorkbook(questionnaire, questions);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const rows: string[][] = [
    ["#", "Question", "Answer", "Confidence", "Status"],
    ...questions.map((q, i) => [
      String(i + 1),
      q.question,
      q.final_answer ?? "",
      q.confidence ?? "",
      q.status,
    ]),
  ];
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}

async function buildWorkbook(
  questionnaire: Questionnaire,
  questions: Question[]
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AnswerPilot";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Answers", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "#", key: "n", width: 6 },
    { header: "Question", key: "question", width: 60 },
    { header: "Answer", key: "answer", width: 80 },
    { header: "Confidence", key: "confidence", width: 12 },
    { header: "Status", key: "status", width: 12 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B7A6B" } };
  header.height = 20;

  questions.forEach((q, i) => {
    const row = sheet.addRow({
      n: i + 1,
      question: q.question,
      answer: q.final_answer ?? "",
      confidence: q.confidence ?? "",
      status: q.status,
    });
    row.getCell("question").alignment = { wrapText: true, vertical: "top" };
    row.getCell("answer").alignment = { wrapText: true, vertical: "top" };
    if (q.confidence === "low" || (q.final_answer ?? "").includes("[NEEDS INPUT")) {
      row.getCell("answer").font = { color: { argb: "FF9A6700" } };
    }
  });

  // Metadata sheet: where this export came from.
  const meta = workbook.addWorksheet("About");
  meta.columns = [{ width: 22 }, { width: 60 }];
  meta.addRows([
    ["Questionnaire", questionnaire.name],
    ["Requester", questionnaire.requester ?? ""],
    ["Questions", String(questions.length)],
    ["Exported", new Date().toISOString()],
    ["Generated with", "AnswerPilot — drafts grounded in your approved answer library"],
  ]);

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
