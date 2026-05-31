ALTER TABLE public.blog_posts_backup_2026_05_31_ph_slug_fix ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.blog_posts_backup_2026_05_31_ph_slug_fix FROM anon, authenticated;
GRANT ALL ON public.blog_posts_backup_2026_05_31_ph_slug_fix TO service_role;
