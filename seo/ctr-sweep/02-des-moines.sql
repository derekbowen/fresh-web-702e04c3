-- CTR SWEEP · Bucket B · /p/des-moines  (424 imp, 0.71% CTR, pos 8.7)
-- Keyword-first title + hook. STAGED — not applied.
UPDATE content_pages SET
  seo_title = 'Pool Rental Des Moines, IA — Private Pools by the Hour',
  seo_description = 'Rent a private pool by the hour in Des Moines, IA — no crowds, no membership. Browse local backyard pools with photos, hourly prices, and reviews.',
  og_title = 'Pool Rental Des Moines, IA — Private Pools by the Hour',
  og_description = 'Rent a private backyard pool by the hour in Des Moines, IA. See photos, hourly prices, and reviews.',
  content_refreshed_at = now()
WHERE slug = 'des-moines';
