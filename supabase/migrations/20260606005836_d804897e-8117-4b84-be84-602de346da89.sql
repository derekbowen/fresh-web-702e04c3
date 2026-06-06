-- Composer campaigns
CREATE TABLE IF NOT EXISTS public.composer_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID,
  subject TEXT NOT NULL,
  audience TEXT NOT NULL,
  body_html TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued',
  test_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.composer_campaigns TO authenticated;
GRANT ALL ON public.composer_campaigns TO service_role;
ALTER TABLE public.composer_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaigns" ON public.composer_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Per-recipient send log
CREATE TABLE IF NOT EXISTS public.composer_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.composer_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  emailit_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS composer_email_log_campaign_idx ON public.composer_email_log(campaign_id);
CREATE INDEX IF NOT EXISTS composer_email_log_recipient_idx ON public.composer_email_log(lower(recipient_email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.composer_email_log TO authenticated;
GRANT ALL ON public.composer_email_log TO service_role;
ALTER TABLE public.composer_email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read log" ON public.composer_email_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Composer-specific unsubscribes (token-based, by email)
CREATE TABLE IF NOT EXISTS public.composer_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS composer_unsubscribes_email_idx ON public.composer_unsubscribes(lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.composer_unsubscribes TO authenticated;
GRANT ALL ON public.composer_unsubscribes TO service_role;
ALTER TABLE public.composer_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read unsubs" ON public.composer_unsubscribes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));