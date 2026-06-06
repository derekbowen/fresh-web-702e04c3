
ALTER TABLE public.host_subscribers
  ADD COLUMN IF NOT EXISTS intercom_id text,
  ADD COLUMN IF NOT EXISTS intercom_paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS intercom_synced_at timestamptz;

ALTER TABLE public.renter_subscribers
  ADD COLUMN IF NOT EXISTS intercom_id text,
  ADD COLUMN IF NOT EXISTS intercom_paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS intercom_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_host_subscribers_intercom_id ON public.host_subscribers(intercom_id);
CREATE INDEX IF NOT EXISTS idx_renter_subscribers_intercom_id ON public.renter_subscribers(intercom_id);

CREATE TABLE IF NOT EXISTS public.intercom_events_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  email text,
  intercom_contact_id text,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  result text
);
CREATE INDEX IF NOT EXISTS idx_intercom_events_email ON public.intercom_events_log(email);
CREATE INDEX IF NOT EXISTS idx_intercom_events_topic ON public.intercom_events_log(topic);

GRANT ALL ON public.intercom_events_log TO service_role;
ALTER TABLE public.intercom_events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intercom_events_log FORCE ROW LEVEL SECURITY;
