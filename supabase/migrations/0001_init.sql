-- AnswerPilot — initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- ─────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My company',
  owner_id uuid not null references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'scale')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.org_members (
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.kb_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  question text not null,
  answer text not null,
  category text,
  source text not null default 'manual' check (source in ('manual', 'import', 'approved_answer', 'sample')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  requester text,
  status text not null default 'in_review' check (status in ('in_review', 'completed')),
  question_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  position int not null default 0,
  question text not null,
  ai_answer text,
  final_answer text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  status text not null default 'pending' check (status in ('pending', 'answered', 'approved', 'flagged')),
  source_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

create index kb_entries_org_idx on public.kb_entries (org_id, created_at desc);
create index questionnaires_org_idx on public.questionnaires (org_id, created_at desc);
create index questions_questionnaire_idx on public.questions (questionnaire_id, position);
create index questions_org_status_idx on public.questions (org_id, status);

-- ─────────────────────────────────────────────────────────────────────
-- Auto-provision an org (and membership) for every new user
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into public.orgs (name, owner_id)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'company', ''), 'My company'), new.id)
  returning id into new_org_id;

  insert into public.org_members (org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────

alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.kb_entries enable row level security;
alter table public.questionnaires enable row level security;
alter table public.questions enable row level security;

-- Membership check. SECURITY DEFINER so it can read org_members without
-- recursive RLS evaluation.
create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

-- orgs: members can read; owners can update the name. Billing fields are
-- written only by the service-role key (webhook), which bypasses RLS.
create policy "orgs: members can select"
  on public.orgs for select
  using (public.is_org_member(id));

create policy "orgs: owner can update"
  on public.orgs for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- org_members: users can see their own memberships.
create policy "org_members: read own"
  on public.org_members for select
  using (user_id = auth.uid());

-- kb_entries / questionnaires / questions: full CRUD for org members.
create policy "kb: member select" on public.kb_entries for select using (public.is_org_member(org_id));
create policy "kb: member insert" on public.kb_entries for insert with check (public.is_org_member(org_id));
create policy "kb: member update" on public.kb_entries for update using (public.is_org_member(org_id));
create policy "kb: member delete" on public.kb_entries for delete using (public.is_org_member(org_id));

create policy "questionnaires: member select" on public.questionnaires for select using (public.is_org_member(org_id));
create policy "questionnaires: member insert" on public.questionnaires for insert with check (public.is_org_member(org_id));
create policy "questionnaires: member update" on public.questionnaires for update using (public.is_org_member(org_id));
create policy "questionnaires: member delete" on public.questionnaires for delete using (public.is_org_member(org_id));

create policy "questions: member select" on public.questions for select using (public.is_org_member(org_id));
create policy "questions: member insert" on public.questions for insert with check (public.is_org_member(org_id));
create policy "questions: member update" on public.questions for update using (public.is_org_member(org_id));
create policy "questions: member delete" on public.questions for delete using (public.is_org_member(org_id));

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger kb_touch before update on public.kb_entries
  for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions
  for each row execute function public.touch_updated_at();
