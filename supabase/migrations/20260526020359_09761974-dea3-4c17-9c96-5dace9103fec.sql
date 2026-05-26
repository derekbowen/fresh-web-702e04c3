
-- 1. Rewrite Swimply leak page metadata
UPDATE public.content_pages
SET
  seo_title = 'Swimply alternatives for pool hosts: lower fees, $2M cover',
  seo_description = 'Compare Swimply to Pool Rental Near Me: 10% flat host fee, $2M liability included, faster payouts. See the side-by-side numbers and how to switch.'
WHERE slug = 'why-hosts-are-leaving-swimply';

-- 2. Consolidate legacy NY slug into canonical
UPDATE public.content_pages
SET legacy_slugs = array_append(COALESCE(legacy_slugs, ARRAY[]::text[]), 'newyork')
WHERE slug = 'new-york-ny'
  AND NOT ('newyork' = ANY(COALESCE(legacy_slugs, ARRAY[]::text[])));

DELETE FROM public.content_pages WHERE slug = 'newyork';

-- 3. Consolidate legacy SD slug into canonical
UPDATE public.content_pages
SET legacy_slugs = array_append(COALESCE(legacy_slugs, ARRAY[]::text[]), 'privatepoolrentalssandiego')
WHERE slug = 'san-diego-ca'
  AND NOT ('privatepoolrentalssandiego' = ANY(COALESCE(legacy_slugs, ARRAY[]::text[])));

DELETE FROM public.content_pages WHERE slug = 'privatepoolrentalssandiego';
