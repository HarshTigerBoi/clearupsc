-- Store strict ChapterTopic payloads produced by the textbook-first pipeline.
-- The full nested chapter data lives in content_payload so the schema can stay
-- stable while ChapterTopic evolves inside TypeScript.

create extension if not exists pgcrypto;

create table if not exists public.ncert_chapters (
  id uuid primary key default gen_random_uuid(),
  topic_key text not null unique,
  subject text not null,
  book text not null,
  chapter_number integer not null,
  content_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ncert_chapters_subject
  on public.ncert_chapters(subject);

create index if not exists idx_ncert_chapters_book_chapter
  on public.ncert_chapters(book, chapter_number);

create index if not exists idx_ncert_chapters_content_payload
  on public.ncert_chapters using gin(content_payload);

create or replace function public.set_ncert_chapters_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ncert_chapters_updated_at on public.ncert_chapters;

create trigger set_ncert_chapters_updated_at
before update on public.ncert_chapters
for each row
execute function public.set_ncert_chapters_updated_at();
