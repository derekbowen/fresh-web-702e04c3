ALTER TABLE public.content_pages
  ADD COLUMN IF NOT EXISTS hero_image_alt text;
