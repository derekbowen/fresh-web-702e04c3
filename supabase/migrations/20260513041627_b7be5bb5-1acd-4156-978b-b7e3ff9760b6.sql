ALTER TABLE public.content_pages
  ADD COLUMN IF NOT EXISTS youtube_video_id text,
  ADD COLUMN IF NOT EXISTS schema_type text,
  ADD COLUMN IF NOT EXISTS related_slugs text[] DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS content_pages_template_type_idx
  ON public.content_pages (template_type)
  WHERE in_sitemap = true;