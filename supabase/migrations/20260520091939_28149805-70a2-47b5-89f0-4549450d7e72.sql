
CREATE OR REPLACE FUNCTION public.compute_related_city_slugs(
  p_slug text,
  p_template text
)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state text;
  v_result text[];
BEGIN
  v_state := lower(substring(p_slug from '-([a-z]{2})$'));

  WITH eligible AS (
    SELECT cp.slug, COALESCE(cp.gsc_impressions, 0) AS imp
    FROM content_pages cp
    WHERE cp.template_type = p_template
      AND cp.status = 'published'
      AND cp.slug <> p_slug
      -- Drop legacy `become-a-pool-host-X` when canonical
      -- `become-a-swimming-pool-host-X` is also published.
      AND NOT (
        cp.slug LIKE 'become-a-pool-host-%'
        AND EXISTS (
          SELECT 1 FROM content_pages c2
          WHERE c2.template_type = p_template
            AND c2.status = 'published'
            AND c2.slug = 'become-a-swimming-pool-host-' || substring(cp.slug from 'become-a-pool-host-(.+)$')
        )
      )
  ),
  state_siblings AS (
    SELECT slug, imp FROM eligible
    WHERE v_state IS NOT NULL AND slug ~ ('-' || v_state || '$')
    ORDER BY imp DESC, slug ASC
    LIMIT 10
  ),
  fallback AS (
    SELECT slug, imp FROM eligible
    WHERE slug NOT IN (SELECT slug FROM state_siblings)
    ORDER BY imp DESC, slug ASC
    LIMIT 10
  ),
  merged AS (
    SELECT slug FROM state_siblings
    UNION ALL
    SELECT slug FROM fallback
  )
  SELECT array_agg(slug) INTO v_result
  FROM (SELECT slug FROM merged LIMIT 10) s;

  RETURN COALESCE(v_result, ARRAY[]::text[]);
END;
$$;
