ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS total_xp int DEFAULT 0;
