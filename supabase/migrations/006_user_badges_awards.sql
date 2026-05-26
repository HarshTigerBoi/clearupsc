CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_user_badge
  ON public.user_badges(user_id, badge_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_badges'
      AND policyname = 'Badges insert own'
  ) THEN
    CREATE POLICY "Badges insert own"
      ON public.user_badges
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
