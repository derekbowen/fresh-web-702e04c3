-- 1. Backup
CREATE TABLE public.blog_posts_backup_2026_05_31_ph_slug_fix AS
SELECT id, slug, title, is_published, updated_at
FROM public.blog_posts
WHERE slug IN ('high-pH-pool-problems-and-fixes', 'low-pH-pool-problems-and-fixes');

-- 2. Rename slugs to lowercase
UPDATE public.blog_posts
SET slug = lower(slug), updated_at = now()
WHERE slug IN ('high-pH-pool-problems-and-fixes', 'low-pH-pool-problems-and-fixes');

-- 3. Enforce lowercase slugs going forward
ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_slug_lowercase_chk
  CHECK (slug = lower(slug));
