CREATE TABLE IF NOT EXISTS public.content_pages_backup_2026_05_29_markdown_fix AS
SELECT id, slug, template_type, body_markdown, content, updated_at
FROM public.content_pages
WHERE body_markdown ~ '\[(/[pl]/[^\]\s]+)\]\(\1\)'
   OR content ~ '\[(/[pl]/[^\]\s]+)\]\(\1\)';

ALTER TABLE public.content_pages_backup_2026_05_29_markdown_fix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage markdown fix backup"
  ON public.content_pages_backup_2026_05_29_markdown_fix
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_pages_backup_2026_05_29_markdown_fix TO authenticated;
GRANT ALL ON public.content_pages_backup_2026_05_29_markdown_fix TO service_role;