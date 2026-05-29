CREATE TABLE IF NOT EXISTS public.content_pages_backup_2026_05_29_flavor_b AS
SELECT id, slug, template_type, body_markdown, content, updated_at
FROM public.content_pages
WHERE body_markdown ~ '(^|[^\]\(])/p/[a-z0-9-]+'
   OR content ~ '(^|[^\]\(])/p/[a-z0-9-]+'
   OR body_markdown ILIKE '%localhost%/p/%'
   OR content ILIKE '%localhost%/p/%';

ALTER TABLE public.content_pages_backup_2026_05_29_flavor_b ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage flavor b backup" ON public.content_pages_backup_2026_05_29_flavor_b;
CREATE POLICY "Admins manage flavor b backup"
ON public.content_pages_backup_2026_05_29_flavor_b
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_pages_backup_2026_05_29_flavor_b TO authenticated;
GRANT ALL ON public.content_pages_backup_2026_05_29_flavor_b TO service_role;