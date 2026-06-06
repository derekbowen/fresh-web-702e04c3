
ALTER TABLE public.composer_campaigns
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS preview_text text,
  ADD COLUMN IF NOT EXISTS custom_emails jsonb,
  ADD COLUMN IF NOT EXISTS single_email text,
  ADD COLUMN IF NOT EXISTS plain_body text;

CREATE INDEX IF NOT EXISTS composer_campaigns_scheduled_idx
  ON public.composer_campaigns (scheduled_at)
  WHERE status = 'scheduled';
