CREATE TABLE public.cities_backup_2026_05_30_republish AS
SELECT c.slug, c.name, c.state_code, c.is_published, c.updated_at
FROM public.cities c
WHERE c.is_published = false
  AND c.slug NOT IN ('akron-oh','baltimore-md','bend-or','avon-in')
  AND EXISTS (
    SELECT 1 FROM public.content_pages cp
    WHERE cp.slug = c.slug
       OR cp.slug = 'pool-rental-' || c.slug
       OR cp.slug = 'rent-a-pool-' || c.slug
       OR cp.slug = 'become-a-pool-host-' || c.slug
       OR cp.slug = 'peerspace-vs-pool-rental-near-me-in-' || c.slug
       OR cp.slug = 'swimply-alternative-vs-pool-rental-near-me-in-' || c.slug
       OR cp.slug = 'giggster-vs-pool-rental-near-me-for-pool-owners-in-' || c.slug
       OR cp.url_path LIKE '%/' || c.slug
       OR cp.url_path LIKE '%/' || c.slug || '-' || lower(c.state_code)
  );

GRANT ALL ON public.cities_backup_2026_05_30_republish TO service_role;
ALTER TABLE public.cities_backup_2026_05_30_republish ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage republish backup"
  ON public.cities_backup_2026_05_30_republish
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));