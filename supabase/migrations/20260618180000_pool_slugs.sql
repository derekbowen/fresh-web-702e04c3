-- Frozen, unique SEO slug map for pool listings.
--
-- The render mirror (synced_listings.slug) is title-derived and REGENERATED on
-- every sync, so it is NOT safe as a public URL — a host editing their title
-- would silently change the URL and 301-break the page (re-triggering Google
-- rejection). pool_slugs assigns a slug ONCE and never changes it: the contract
-- behind /pools-for-rent/{state}/{city}/{slug}.
--
-- Unique within (state_code, city_slug, slug); one row per Sharetribe listing.

CREATE TABLE public.pool_slugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharetribe_id text NOT NULL UNIQUE,
  state_code text NOT NULL,   -- lowercased 2-letter, URL segment
  city_slug text NOT NULL,    -- lowercased kebab city, URL segment
  slug text NOT NULL,         -- frozen, title-derived, unique within the city
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (state_code, city_slug, slug)
);

-- Public SEO mapping — readable by anyone (the resolver runs service-role anyway).
GRANT SELECT ON public.pool_slugs TO anon, authenticated;
GRANT ALL ON public.pool_slugs TO service_role;
ALTER TABLE public.pool_slugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pool_slugs" ON public.pool_slugs
  FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX pool_slugs_lookup_idx ON public.pool_slugs (state_code, city_slug, slug);
CREATE INDEX pool_slugs_st_idx ON public.pool_slugs (sharetribe_id);
