-- Minimal stand-in for production public.content_pages: the columns 4d reads or writes, the two
-- triggers and the three functions, copied from pg_get_functiondef on production (2026-11-19).
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
create schema if not exists seo_repair;
revoke all on schema seo_repair from public;
create table public.cities (id uuid primary key);
create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  template_type text,
  status text,
  redirect_to text,
  in_sitemap boolean default true,
  url_path text,
  updated_at timestamptz default now(),
  related_slugs text[],
  gsc_impressions integer,
  city_id uuid references public.cities(id),
  hreflang_alt uuid references public.content_pages(id),
  content text,
  body_markdown text
);
grant select on public.content_pages to anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_related_city_slugs(p_slug text, p_template text)
 RETURNS text[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
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
    SELECT slug, imp,
           (ROW_NUMBER() OVER (ORDER BY imp DESC, slug ASC) - 1)::int AS idx,
           (COUNT(*) OVER ())::int AS n
    FROM eligible
    WHERE v_state IS NOT NULL AND slug ~ ('-' || v_state || '$')
  ),
  src AS (SELECT idx, n FROM state_ranked WHERE slug = p_slug),
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
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
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

CREATE OR REPLACE FUNCTION public.tg_refresh_host_acq_related()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.template_type = 'host_acq_city')
     OR (TG_OP = 'DELETE' AND OLD.template_type = 'host_acq_city')
     OR (TG_OP = 'UPDATE' AND (
            NEW.template_type = 'host_acq_city' OR OLD.template_type = 'host_acq_city'
          ) AND (
            NEW.status IS DISTINCT FROM OLD.status
            OR NEW.template_type IS DISTINCT FROM OLD.template_type
            OR NEW.slug IS DISTINCT FROM OLD.slug
          ))
  THEN
    PERFORM public.refresh_related_slugs_for_template('host_acq_city');
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER tg_host_acq_related_refresh AFTER INSERT OR DELETE OR UPDATE ON public.content_pages FOR EACH ROW EXECUTE FUNCTION tg_refresh_host_acq_related();
CREATE TRIGGER trg_content_pages_updated_at BEFORE UPDATE ON public.content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
