-- 0002_pgvector.sql
-- Semantic retrieval upgrade. Safe to run on a live project.
-- Requires the "vector" extension (available on all Supabase projects).

create extension if not exists vector;

-- voyage-3.5-lite / voyage-3.5 both emit 1024-dim vectors by default.
alter table public.kb_entries
  add column if not exists embedding vector(1024);

-- HNSW: good recall with zero tuning, fine for per-org libraries of any realistic size.
create index if not exists kb_entries_embedding_idx
  on public.kb_entries
  using hnsw (embedding vector_cosine_ops);

-- Nearest-neighbour lookup scoped to one org.
-- SECURITY INVOKER (the default): RLS on kb_entries still applies, so a caller
-- can only ever match entries in orgs they belong to.
create or replace function public.match_kb_entries(
  p_org uuid,
  p_query vector(1024),
  p_count int default 6
)
returns table (id uuid, similarity float)
language sql
stable
as $$
  select k.id,
         1 - (k.embedding <=> p_query) as similarity
  from public.kb_entries k
  where k.org_id = p_org
    and k.embedding is not null
  order by k.embedding <=> p_query
  limit least(p_count, 20);
$$;
