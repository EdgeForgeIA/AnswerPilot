import Anthropic from "@anthropic-ai/sdk";
import type { Confidence, KbEntry } from "@/types/db";

export type DraftResult = {
  answer: string;
  confidence: Confidence;
  sourceIds: string[];
};

const SYSTEM_PROMPT = `You are VeriQuill, an assistant that drafts vendor responses to security and compliance questionnaires (SOC 2, vendor risk, DDQ, RFP security sections).

You answer ON BEHALF OF THE VENDOR, in first person plural ("We..."), in a precise, professional compliance register. You are given the customer's question and a set of knowledge-base entries from the vendor's approved answer library.

Rules — follow them exactly:
1. Ground every claim in the provided knowledge-base entries. Never invent certifications, tools, policies, dates, or practices that are not supported by the entries.
2. If the entries fully answer the question, write a complete, self-contained answer (typically 1-4 sentences; longer only if the question genuinely requires it).
3. If the entries only partially cover the question, answer what is supported and clearly mark the gap with the literal placeholder [NEEDS INPUT: <what is missing>].
4. If the entries do not cover the question at all, set the answer to a single placeholder line: [NEEDS INPUT: <short description of what the security team must provide>].
5. Grade your confidence:
   - "high" — entries directly and fully answer the question.
   - "medium" — entries substantially cover it but you adapted, combined, or generalized.
   - "low" — coverage is partial or absent; a human must fill gaps.
6. Cite which entries you used by their IDs.

Respond with ONLY a JSON object, no markdown fences, matching:
{"answer": string, "confidence": "high" | "medium" | "low", "source_ids": string[]}`;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local — see .env.example.");
  }
  return new Anthropic({ apiKey });
}

export async function draftAnswer(question: string, context: KbEntry[]): Promise<DraftResult> {
  // No library context at all → deterministic low-confidence gap, no API call.
  if (context.length === 0) {
    return {
      answer:
        "[NEEDS INPUT: No matching entry in your answer library. Add the relevant policy or a past answer to the library, then regenerate.]",
      confidence: "low",
      sourceIds: [],
    };
  }

  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const contextBlock = context
    .map(
      (e) =>
        `<entry id="${e.id}"${e.category ? ` category="${e.category}"` : ""}>\nQ: ${e.question}\nA: ${e.answer}\n</entry>`
    )
    .join("\n\n");

  const message = await client.messages.create({
    model,
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Knowledge-base entries:\n\n${contextBlock}\n\nCustomer question:\n"${question}"\n\nDraft the vendor's answer as JSON.`,
      },
    ],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return parseDraft(text, context);
}

function parseDraft(raw: string, context: KbEntry[]): DraftResult {
  const validIds = new Set(context.map((e) => e.id));
  try {
    const cleaned = raw.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
      answer?: unknown;
      confidence?: unknown;
      source_ids?: unknown;
    };

    const answer = typeof parsed.answer === "string" && parsed.answer.trim() ? parsed.answer.trim() : null;
    const confidence: Confidence =
      parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
        ? parsed.confidence
        : "low";
    const sourceIds = Array.isArray(parsed.source_ids)
      ? parsed.source_ids.filter((id): id is string => typeof id === "string" && validIds.has(id))
      : [];

    if (!answer) throw new Error("empty answer");
    return { answer, confidence, sourceIds };
  } catch {
    // Model returned malformed JSON — degrade gracefully instead of failing the row.
    return {
      answer: raw.trim() || "[NEEDS INPUT: Generation failed for this question. Click Regenerate.]",
      confidence: "low",
      sourceIds: [],
    };
  }
}
