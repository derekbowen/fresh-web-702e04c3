CREATE TABLE IF NOT EXISTS public.gsc_daily_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_path text NOT NULL,
  date date NOT NULL,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric,
  position numeric,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (url_path, date)
);

CREATE INDEX IF NOT EXISTS idx_gsc_daily_pages_date ON public.gsc_daily_pages (date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_pages_url ON public.gsc_daily_pages (url_path);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_pages_impressions ON public.gsc_daily_pages (impressions DESC);

ALTER TABLE public.gsc_daily_pages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gsc_daily_pages'
      AND policyname = 'admins manage gsc daily pages'
  ) THEN
    CREATE POLICY "admins manage gsc daily pages"
      ON public.gsc_daily_pages
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

REVOKE ALL ON public.gsc_daily_pages FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_daily_pages TO authenticated;

CREATE TABLE IF NOT EXISTS public.gsc_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  start_date date,
  end_date date,
  pages_synced integer NOT NULL DEFAULT 0,
  queries_synced integer NOT NULL DEFAULT 0,
  error text,
  trigger_source text NOT NULL DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_gsc_sync_runs_started_at ON public.gsc_sync_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_sync_runs_status ON public.gsc_sync_runs (status);

ALTER TABLE public.gsc_sync_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gsc_sync_runs'
      AND policyname = 'admins manage gsc sync runs'
  ) THEN
    CREATE POLICY "admins manage gsc sync runs"
      ON public.gsc_sync_runs
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

REVOKE ALL ON public.gsc_sync_runs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsc_sync_runs TO authenticated;

CREATE INDEX IF NOT EXISTS idx_gsc_query_data_captured_at ON public.gsc_query_data (captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_query_data_url_query ON public.gsc_query_data (url_path, query);