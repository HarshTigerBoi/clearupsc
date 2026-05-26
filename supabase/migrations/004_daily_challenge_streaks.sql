CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  question_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Daily challenges readable" ON daily_challenges;
CREATE POLICY "Daily challenges readable"
  ON daily_challenges
  FOR SELECT
  USING (true);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS streak_freezes_remaining int DEFAULT 2;

