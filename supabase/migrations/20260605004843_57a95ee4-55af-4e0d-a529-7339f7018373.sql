-- host_subscribers
CREATE TABLE public.host_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  st_user_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  unsubscribe_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  unsubscribed_at TIMESTAMPTZ,
  sequence_scheduled BOOLEAN NOT NULL DEFAULT false,
  st_created_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_host_subscribers_status ON public.host_subscribers(status);
CREATE INDEX idx_host_subscribers_token ON public.host_subscribers(unsubscribe_token);

GRANT ALL ON public.host_subscribers TO service_role;
ALTER TABLE public.host_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_subscribers FORCE ROW LEVEL SECURITY;

-- host_drip_emails
CREATE TABLE public.host_drip_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.host_subscribers(id) ON DELETE CASCADE,
  step INT NOT NULL,
  kind TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  subject TEXT,
  sent_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  error TEXT,
  emailit_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscriber_id, step)
);
CREATE INDEX idx_host_drip_emails_due ON public.host_drip_emails(status, scheduled_at);
CREATE INDEX idx_host_drip_emails_sub ON public.host_drip_emails(subscriber_id);

GRANT ALL ON public.host_drip_emails TO service_role;
ALTER TABLE public.host_drip_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_drip_emails FORCE ROW LEVEL SECURITY;

-- host_drip_state (singleton)
CREATE TABLE public.host_drip_state (
  id INT PRIMARY KEY,
  last_st_created_at TIMESTAMPTZ,
  last_polled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.host_drip_state (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT ALL ON public.host_drip_state TO service_role;
ALTER TABLE public.host_drip_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_drip_state FORCE ROW LEVEL SECURITY;

-- updated_at triggers
CREATE TRIGGER trg_host_subscribers_updated BEFORE UPDATE ON public.host_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_host_drip_emails_updated BEFORE UPDATE ON public.host_drip_emails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();