-- 1. Convert structured_notes from text to jsonb safely
ALTER TABLE topics
  ALTER COLUMN structured_notes TYPE jsonb USING structured_notes::jsonb;

-- 2. Add missing topic fields
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS estimated_minutes int DEFAULT 20,
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by text;

-- 3. Strengthen questions table for official PYQs
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS is_official boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS official_exam text,
  ADD COLUMN IF NOT EXISTS paper_set text,
  ADD COLUMN IF NOT EXISTS answer_key_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS answer_key_source_url text,
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'unreviewed';

-- 4. Add foreign key safety indexes
CREATE INDEX IF NOT EXISTS idx_questions_topic_key ON questions(topic_key);
CREATE INDEX IF NOT EXISTS idx_topics_parent_key ON topics(parent_key);
CREATE INDEX IF NOT EXISTS idx_topics_content_quality ON topics(content_quality);
