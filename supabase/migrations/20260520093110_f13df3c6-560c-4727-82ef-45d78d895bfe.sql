CREATE OR REPLACE FUNCTION public.compute_related_city_slugs(p_slug text, p_template text)
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  state_ranked AS (
    -- Stable ranking within state by impressions DESC. Includes source page
    -- so its row number becomes the source's unique offset for round-robin.
    SELECT slug, imp,
           (ROW_NUMBER() OVER (ORDER BY imp DESC, slug ASC) - 1)::int AS idx,
           (COUNT(*) OVER ())::int AS n
    FROM eligible
    WHERE v_state IS NOT NULL AND slug ~ ('-' || v_state || '$')
  ),
  src AS (SELECT idx, n FROM state_ranked WHERE slug = p_slug),
  -- Round-robin: shift by source's index so every source picks a different
  -- consecutive window. Wraps around. Excludes source. Gives each target
  -- page in a state with N>=11 pages exactly 10 inbound links.
  state_pick AS (
    SELECT sr.slug,
           ((sr.idx - src.idx - 1 + src.n) % src.n) AS pos
    FROM state_ranked sr CROSS JOIN src
    WHERE sr.slug <> p_slug
  ),
  state_top10 AS (
    SELECT slug FROM state_pick ORDER BY pos ASC LIMIT 10
  ),
  fallback AS (
    -- Used only when in-state pool < 10. Cross-state, ranked by impressions
    -- with a slug tiebreaker for stability.
    SELECT slug FROM eligible
    WHERE slug <> p_slug
      AND slug NOT IN (SELECT slug FROM state_top10)
    ORDER BY imp DESC, slug ASC
    LIMIT 10
  ),
  merged AS (
    SELECT slug FROM state_top10
    UNION ALL
    SELECT slug FROM fallback
  )
  SELECT array_agg(slug) INTO v_result
  FROM (SELECT slug FROM merged LIMIT 10) s;

  RETURN COALESCE(v_result, ARRAY[]::text[]);
END;
$function$;