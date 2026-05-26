ALTER TABLE current_affairs
  ADD COLUMN IF NOT EXISTS upsc_angle text,
  ADD COLUMN IF NOT EXISTS static_link text,
  ADD COLUMN IF NOT EXISTS prelims_hook text,
  ADD COLUMN IF NOT EXISTS mains_angle text;
