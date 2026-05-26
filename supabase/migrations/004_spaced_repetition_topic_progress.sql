ALTER TABLE topic_progress
  ADD COLUMN IF NOT EXISTS next_review_at date,
  ADD COLUMN IF NOT EXISTS ease_factor float DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS review_interval_days int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_topic_progress_next_review_at
  ON topic_progress(user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;
