CREATE OR REPLACE FUNCTION public.compute_related_city_slugs(p_slug text, p_template text)
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state text;
  v_seed  bigint;
  v_result text[];
BEGIN
  v_state := lower(substring(p_slug from '-([a-z]{2})$'));
  -- Stable per-source seed (so each page picks a different slice deterministically)
  v_seed  := ('x' || substr(md5(p_slug), 1, 8))::bit(32)::bigint;

  WITH eligible AS (
    SELECT cp.slug, COALESCE(cp.gsc_impressions, 0) AS imp
    FROM content_pages cp
    WHERE cp.template_type = p_template
      AND cp.status = 'published'
      AND cp.slug <> p_slug
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
  state_pool AS (
    SELECT slug, imp,
           -- Deterministic rotation: hash(seed || slug) order
           ('x' || substr(md5((v_seed::text) || slug), 1, 8))::bit(32)::bigint AS rot
    FROM eligible
    WHERE v_state IS NOT NULL AND slug ~ ('-' || v_state || '$')
  ),
  -- Half by impressions (top sibling cities anchor the page), half by rotation (spread coverage)
  state_top AS (
    SELECT slug FROM state_pool ORDER BY imp DESC, slug ASC LIMIT 4
  ),
  state_rot AS (
    SELECT slug FROM state_pool
    WHERE slug NOT IN (SELECT slug FROM state_top)
    ORDER BY rot ASC, slug ASC
    LIMIT 6
  ),
  picked AS (
    SELECT slug FROM state_top
    UNION ALL
    SELECT slug FROM state_rot
  ),
  fallback AS (
    SELECT slug,
           ('x' || substr(md5((v_seed::text) || slug), 1, 8))::bit(32)::bigint AS rot
    FROM eligible
    WHERE slug NOT IN (SELECT slug FROM picked)
    ORDER BY rot ASC, slug ASC
    LIMIT 10
  ),
  merged AS (
    SELECT slug FROM picked
    UNION ALL
    SELECT slug FROM fallback
  )
  SELECT array_agg(slug) INTO v_result
  FROM (SELECT slug FROM merged LIMIT 10) s;

  RETURN COALESCE(v_result, ARRAY[]::text[]);
END;
$function$;