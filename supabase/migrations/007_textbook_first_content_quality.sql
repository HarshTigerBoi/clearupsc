-- Textbook-first content status support.
-- Apply this before syncing source-verified chapter decodes into Supabase.

alter table public.topics
  add column if not exists content_quality text default 'fallback';

alter table public.topics
  drop constraint if exists topics_content_quality_check;

alter table public.topics
  add constraint topics_content_quality_check
  check (
    content_quality in (
      'fallback',
      'wiki_seeded',
      'ncert_enriched',
      'human_review_needed',
      'publish_ready',
      'source_packet_ready_for_human_decode',
      'textbook_decoded'
    )
  );

create index if not exists idx_topics_content_quality on public.topics(content_quality);
