ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS title_variant CHAR(1) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_title_variant ON public.content_pages(title_variant);