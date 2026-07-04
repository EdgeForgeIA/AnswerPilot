import type { SupabaseClient } from "@supabase/supabase-js";
import { rankEntries } from "@/lib/retrieval";
import type { KbEntry } from "@/types/db";

/**
 * Semantic retrieval via Voyage AI embeddings + pgvector.
 *
 * Entirely optional: if VOYAGE_API_KEY is unset, everything falls back to the
 * lexical ranker in lib/retrieval.ts and the product behaves exactly as before.
 * When enabled, retrieval is *hybrid* — vector matches merged with lexical
 * matches — so entries that haven't been embedded yet (or exact-keyword hits
 * that embeddings miss) still surface.
 */

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const EMBED_DIM = 1024;
const CHUNK = 100; // texts per API call

export function embeddingsEnabled(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY);
}

function model(): string {
  return process.env.VOYAGE_MODEL ?? "voyage-3.5-lite";
}

/** Embed a batch of texts. Chunks requests; throws on hard API failure. */
export async function embedTexts(
  texts: string[],
  inputType: "document" | "query"
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set.");
  if (texts.length === 0) return [];

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += CHUNK) {
    const chunk = texts.slice(i, i + CHUNK);
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model(),
        input: chunk,
        input_type: inputType,
        output_dimension: EMBED_DIM,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Voyage embeddings failed (${res.status}): ${detail.slice(0, 200)}`);
    }
    const body = (await res.json()) as { data: Array<{ index: number; embedding: number[] }> };
    const sorted = [...body.data].sort((a, b) => a.index - b.index);
    out.push(...sorted.map((d) => d.embedding));
  }
  return out;
}

/** What we embed for a library entry: the Q and A together carry the meaning. */
export function kbEmbeddingText(question: string, answer: string): string {
  return `${question}\n${answer}`;
}

/**
 * Fire-and-forget style embedding of KB rows after insert/update.
 * Never throws — an embedding failure must not break saving an answer;
 * hybrid retrieval and the self-healing backfill cover the gap.
 */
export async function embedKbRows(
  supabase: SupabaseClient,
  rows: Array<{ id: string; question: string; answer: string }>
): Promise<void> {
  if (!embeddingsEnabled() || rows.length === 0) return;
  try {
    const vectors = await embedTexts(
      rows.map((r) => kbEmbeddingText(r.question, r.answer)),
      "document"
    );
    await Promise.all(
      rows.map((row, i) =>
        supabase.from("kb_entries").update({ embedding: vectors[i] }).eq("id", row.id)
      )
    );
  } catch (err) {
    console.error("KB embedding failed (will backfill later):", err);
  }
}

/** Self-healing: embed up to `limit` rows that are missing vectors. */
export async function backfillMissingEmbeddings(
  supabase: SupabaseClient,
  orgId: string,
  limit = 100
): Promise<number> {
  if (!embeddingsEnabled()) return 0;
  const { data } = await supabase
    .from("kb_entries")
    .select("id, question, answer")
    .eq("org_id", orgId)
    .is("embedding", null)
    .limit(limit);
  const rows = data ?? [];
  if (rows.length > 0) await embedKbRows(supabase, rows);
  return rows.length;
}

/**
 * Hybrid retrieval for one question.
 * Vector top-4 (by cosine similarity) merged with lexical top-4, deduped,
 * capped at `topK`. `queryEmbedding` is passed in so callers can embed a whole
 * batch of questions in one API call.
 */
export async function hybridRetrieve(
  supabase: SupabaseClient,
  orgId: string,
  question: string,
  queryEmbedding: number[] | null,
  allEntries: KbEntry[],
  topK = 6
): Promise<KbEntry[]> {
  const lexical = rankEntries(question, allEntries, 4);

  if (!queryEmbedding) return rankEntries(question, allEntries, topK);

  let vectorHits: KbEntry[] = [];
  try {
    const { data, error } = await supabase.rpc("match_kb_entries", {
      p_org: orgId,
      p_query: queryEmbedding,
      p_count: 4,
    });
    if (error) throw error;
    const byId = new Map(allEntries.map((e) => [e.id, e]));
    vectorHits = ((data ?? []) as Array<{ id: string }>)
      .map((hit) => byId.get(hit.id))
      .filter((e): e is KbEntry => Boolean(e));
  } catch (err) {
    console.error("Vector match failed, falling back to lexical:", err);
    return rankEntries(question, allEntries, topK);
  }

  const merged: KbEntry[] = [];
  const seen = new Set<string>();
  for (const entry of [...vectorHits, ...lexical]) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
    if (merged.length >= topK) break;
  }
  return merged;
}
