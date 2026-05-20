
-- Helper to compute related sibling city slugs for a given page.
-- Strategy: same template_type, same state suffix (last 2-letter token),
-- ranked by gsc_impressions DESC NULLS LAST, then slug. Falls back to
-- same-template alphabetical if state-mates < 10. Returns at most 10 slugs.
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
  -- Extract 2-letter state code from end of slug (e.g. "...-houston-tx")
  v_state := lower(substring(p_slug from '-([a-z]{2})$'));

  -- Same-state siblings first, ranked by impressions
  WITH state_siblings AS (
    SELECT slug, COALESCE(gsc_impressions, 0) AS imp
    FROM content_pages
    WHERE template_type = p_template
      AND status = 'published'
      AND slug <> p_slug
      AND v_state IS NOT NULL
      AND slug ~ ('-' || v_state || '$')
    ORDER BY imp DESC, slug ASC
    LIMIT 10
  ),
  fallback AS (
    SELECT slug, COALESCE(gsc_impressions, 0) AS imp
    FROM content_pages
    WHERE template_type = p_template
      AND status = 'published'
      AND slug <> p_slug
      AND slug NOT IN (SELECT slug FROM state_siblings)
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

REVOKE ALL ON FUNCTION public.compute_related_city_slugs(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_related_city_slugs(text, text) TO service_role;

-- Batch refresh function — recomputes related_slugs for all rows of a template.
CREATE OR REPLACE FUNCTION public.refresh_related_slugs_for_template(p_template text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE content_pages cp
  SET related_slugs = public.compute_related_city_slugs(cp.slug, cp.template_type),
      updated_at    = now()
  WHERE cp.template_type = p_template
    AND cp.status = 'published';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_related_slugs_for_template(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_related_slugs_for_template(text) TO service_role;

-- Monthly cron: 1st of month at 03:00 UTC
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing schedule if present
DO $$
BEGIN
  PERFORM cron.unschedule('refresh-related-slugs-monthly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'refresh-related-slugs-monthly',
  '0 3 1 * *',
  $$
    SELECT public.refresh_related_slugs_for_template('host_acq_city');
    SELECT public.refresh_related_slugs_for_template('host_acq_city_es');
  $$
);
