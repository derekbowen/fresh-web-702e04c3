-- Backup affected rows before flipping in_sitemap flags
CREATE TABLE public.content_pages_backup_2026_05_31_sitemap_fix AS
SELECT id, slug, status, in_sitemap, updated_at, now() AS backup_at
FROM public.content_pages
WHERE (in_sitemap = true AND status IN ('redirect','pending'))
   OR (in_sitemap = false AND status = 'published');

-- Remove stale redirect/pending rows from sitemap
UPDATE public.content_pages
SET in_sitemap = false, updated_at = now()
WHERE in_sitemap = true AND status IN ('redirect','pending');

-- Add published rows missing from sitemap
UPDATE public.content_pages
SET in_sitemap = true, updated_at = now()
WHERE in_sitemap = false AND status = 'published';