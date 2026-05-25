-- ClearUPSC content strategy migration.
-- Apply this in Supabase SQL Editor before running:
-- npm run content:wiki
-- npm run content:sources
-- npm run content:ncert
-- npm run notes:generate

alter table public.topics add column if not exists wiki_slug text;
alter table public.topics add column if not exists structured_notes text;
alter table public.topics add column if not exists govt_sources jsonb default '[]'::jsonb;
alter table public.topics add column if not exists ncert_refs jsonb default '[]'::jsonb;

create table if not exists public.topic_wiki_cache (
  topic_key text primary key references public.topics(key) on delete cascade,
  wiki_slug text not null,
  summary text,
  description text,
  image_url text,
  source_url text,
  attribution text default 'Source: Wikipedia, CC BY-SA.',
  fetched_at timestamptz default now()
);

create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  topic_key text references public.topics(key) on delete set null,
  tags text[] default '{}',
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pyq_questions (
  id text primary key,
  year int,
  paper text,
  question_text text not null,
  options jsonb default '[]'::jsonb,
  correct_option int,
  explanation text,
  topics text[] default '{}',
  difficulty text default 'medium',
  source text default 'Based on UPSC pattern'
);

create table if not exists public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text not null,
  essay_text text not null,
  word_count int default 0,
  time_taken_seconds int default 0,
  score int,
  feedback text,
  created_at timestamptz default now()
);

create table if not exists public.revision_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_key text references public.topics(key) on delete cascade,
  due_date date not null,
  status text default 'due',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.topic_wiki_cache enable row level security;
alter table public.user_notes enable row level security;
alter table public.pyq_questions enable row level security;
alter table public.essay_submissions enable row level security;
alter table public.revision_schedule enable row level security;

drop policy if exists "Topic wiki cache readable" on public.topic_wiki_cache;
create policy "Topic wiki cache readable" on public.topic_wiki_cache for select using (true);

drop policy if exists "PYQs readable" on public.pyq_questions;
create policy "PYQs readable" on public.pyq_questions for select using (true);

drop policy if exists "Notes own" on public.user_notes;
create policy "Notes own" on public.user_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Essay own" on public.essay_submissions;
create policy "Essay own" on public.essay_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Revision own" on public.revision_schedule;
create policy "Revision own" on public.revision_schedule for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
