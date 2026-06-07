
CREATE TABLE public.sharetribe_test_listings (
  id uuid PRIMARY KEY,
  title text,
  state text,
  city text,
  listing_type text,
  pool_type text,
  pool_size text,
  pool_depth text,
  max_guests integer,
  is_heated boolean,
  amenities text[] DEFAULT '{}'::text[],
  price_cents integer,
  price_currency text,
  raw jsonb,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.sharetribe_test_listings TO service_role;
ALTER TABLE public.sharetribe_test_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharetribe_test_listings FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.sharetribe_test_listings FROM anon, authenticated;

CREATE INDEX idx_st_test_listings_state ON public.sharetribe_test_listings(state);
CREATE INDEX idx_st_test_listings_city ON public.sharetribe_test_listings(city);
CREATE INDEX idx_st_test_listings_heated ON public.sharetribe_test_listings(is_heated);
CREATE INDEX idx_st_test_listings_synced ON public.sharetribe_test_listings(last_synced_at DESC);

CREATE TRIGGER trg_st_test_listings_updated_at
  BEFORE UPDATE ON public.sharetribe_test_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sharetribe_test_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  total_fetched integer NOT NULL DEFAULT 0,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  error text,
  triggered_by uuid
);

GRANT ALL ON public.sharetribe_test_sync_runs TO service_role;
ALTER TABLE public.sharetribe_test_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharetribe_test_sync_runs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.sharetribe_test_sync_runs FROM anon, authenticated;

CREATE INDEX idx_st_test_sync_runs_started ON public.sharetribe_test_sync_runs(started_at DESC);
