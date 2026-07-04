import type { KbEntry } from "@/types/db";

/**
 * Lightweight lexical retrieval: score library entries against a question
 * using token overlap with IDF-style weighting on the entry set. Good enough
 * for the MVP; swap for embeddings (pgvector) as the library grows.
 */

const STOPWORDS = new Set(
  "a an and are as at be by do does for from has have how in is it its of on or our that the their this to we what when where which who will with you your".split(
    " "
  )
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function rankEntries(question: string, entries: KbEntry[], topK = 6): KbEntry[] {
  if (entries.length === 0) return [];

  const qTokens = new Set(tokenize(question));
  if (qTokens.size === 0) return entries.slice(0, topK);

  // Document frequency across entry questions+answers.
  const df = new Map<string, number>();
  const entryTokens = entries.map((e) => {
    const tokens = new Set(tokenize(`${e.question} ${e.answer}`));
    for (const t of tokens) df.set(t, (df.get(t) ?? 0) + 1);
    return tokens;
  });

  const n = entries.length;
  const scored = entries.map((entry, i) => {
    let score = 0;
    const qFieldTokens = new Set(tokenize(entry.question));
    for (const t of qTokens) {
      if (entryTokens[i].has(t)) {
        const idf = Math.log(1 + n / (df.get(t) ?? 1));
        // Matching the entry's *question* text is a stronger signal than
        // matching somewhere in its answer.
        score += idf * (qFieldTokens.has(t) ? 2 : 1);
      }
    }
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.entry);
}
