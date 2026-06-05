-- Renter subscribers
CREATE TABLE public.renter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  st_user_id text UNIQUE,
  email text NOT NULL,
  name text,
  zip text,
  city text,
  state_code text,
  latitude numeric,
  longitude numeric,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','unsubscribed','bounced','complained')),
  unsubscribe_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  st_created_at timestamptz,
  sequence_scheduled boolean NOT NULL DEFAULT false,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX renter_subscribers_email_lower_idx ON public.renter_subscribers(lower(email));
CREATE INDEX renter_subscribers_status_idx ON public.renter_subscribers(status);

GRANT ALL ON public.renter_subscribers TO service_role;
ALTER TABLE public.renter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renter_subscribers FORCE ROW LEVEL SECURITY;

CREATE TRIGGER renter_subscribers_updated_at
  BEFORE UPDATE ON public.renter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Renter email queue
CREATE TABLE public.renter_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES public.renter_subscribers(id) ON DELETE CASCADE,
  step int NOT NULL,
  kind text NOT NULL CHECK (kind IN ('welcome','pool_of_day','referral')),
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled','skipped')),
  listing_id text,
  subject text,
  emailit_id text,
  error text,
  attempts int NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX renter_emails_due_idx ON public.renter_emails(scheduled_at) WHERE status='pending';
CREATE INDEX renter_emails_subscriber_idx ON public.renter_emails(subscriber_id);
CREATE INDEX renter_emails_listing_idx ON public.renter_emails(subscriber_id, listing_id) WHERE listing_id IS NOT NULL;

GRANT ALL ON public.renter_emails TO service_role;
ALTER TABLE public.renter_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renter_emails FORCE ROW LEVEL SECURITY;

-- Poll cursor
CREATE TABLE public.renter_drip_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_st_created_at timestamptz,
  last_polled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.renter_drip_state (id, last_st_created_at)
VALUES (1, now() - interval '24 hours')
ON CONFLICT (id) DO NOTHING;

GRANT ALL ON public.renter_drip_state TO service_role;
ALTER TABLE public.renter_drip_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renter_drip_state FORCE ROW LEVEL SECURITY;

-- Cron: poll Sharetribe every 15 min
SELECT cron.schedule(
  'poll-sharetribe-renters-15m',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fresh-web.lovable.app/api/public/hooks/poll-sharetribe-renters',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-admin-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hooks_admin_token' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cron: send due renter emails every minute
SELECT cron.schedule(
  'send-renter-emails-1m',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fresh-web.lovable.app/api/public/hooks/send-renter-emails',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-admin-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hooks_admin_token' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);