ALTER TABLE public.content_pages
  ADD COLUMN IF NOT EXISTS content_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS hero_backfill_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hero_backfill_last_error text,
  ADD COLUMN IF NOT EXISTS refresh_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refresh_last_error text;

CREATE INDEX IF NOT EXISTS content_pages_refresh_picker_idx
  ON public.content_pages (content_refreshed_at NULLS FIRST)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS content_pages_hero_backfill_idx
  ON public.content_pages (hero_backfill_attempts, updated_at)
  WHERE status = 'published' AND (hero_image_url IS NULL OR hero_image_url = '');