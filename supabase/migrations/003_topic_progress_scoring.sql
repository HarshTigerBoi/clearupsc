ALTER TABLE public.topic_progress
  ADD COLUMN IF NOT EXISTS correct_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mistakes_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_score int;

CREATE INDEX IF NOT EXISTS idx_topic_progress_weak_topics
  ON public.topic_progress(user_id, mistakes_count DESC, last_score);
