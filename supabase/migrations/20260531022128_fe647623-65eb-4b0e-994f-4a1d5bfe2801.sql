CREATE TABLE public.content_pages_backup_2026_05_31_ca_refresh AS
SELECT id, slug, body_markdown, content_refreshed_at, updated_at, now() AS backup_at
FROM public.content_pages
WHERE slug = 'host-advocacy-california';

GRANT ALL ON public.content_pages_backup_2026_05_31_ca_refresh TO service_role;

ALTER TABLE public.content_pages_backup_2026_05_31_ca_refresh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pages_backup_2026_05_31_ca_refresh FORCE ROW LEVEL SECURITY;