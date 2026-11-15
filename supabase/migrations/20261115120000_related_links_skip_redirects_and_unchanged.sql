-- F15 (SEO audit 2026-11-14): the monthly related-links job.
--
-- Before: refresh_related_slugs_for_template() rewrote related_slugs and
-- updated_at on EVERY published row of the template on the 1st of each month
-- (4,452 rows), whether or not the links changed, and
-- compute_related_city_slugs() could pick pages that 301 elsewhere
-- (status 'published' with redirect_to set). On 2026-11-15, 139 published
-- host_acq_city pages linked to one of the 56 such pages.
--
-- After:
--   * a page that redirects (redirect_to set) is never chosen as a related link;
--   * a page that redirects is not itself refreshed (it is never rendered);
--   * only rows whose computed links differ are written, so updated_at moves
--     only when something really changed;
--   * the function returns the number of rows changed, as before.
-- Rollback: ops/seo-repairs-2026-11/related-links-job/rollback.sql restores
-- both functions exactly as they were on 2026-11-15.

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
      AND cp.redirect_to IS NULL
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

CREATE OR REPLACE FUNCTION public.refresh_related_slugs_for_template(p_template text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  -- updated_at is set by trg_content_pages_updated_at on the rows that change.
  UPDATE content_pages cp
  SET related_slugs = x.new_slugs
  FROM (
    SELECT c.id, public.compute_related_city_slugs(c.slug, c.template_type) AS new_slugs
    FROM content_pages c
    WHERE c.template_type = p_template
      AND c.status = 'published'
      AND c.redirect_to IS NULL
  ) x
  WHERE cp.id = x.id
    AND cp.related_slugs IS DISTINCT FROM x.new_slugs;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- Privileges are unchanged by CREATE OR REPLACE; restated for a fresh database.
REVOKE ALL ON FUNCTION public.refresh_related_slugs_for_template(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_related_slugs_for_template(text) TO service_role;
