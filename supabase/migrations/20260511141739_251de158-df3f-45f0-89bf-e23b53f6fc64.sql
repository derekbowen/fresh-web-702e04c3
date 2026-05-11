CREATE TABLE public.followup_reminder_settings (
  owner_id uuid PRIMARY KEY,
  email text,
  phone_e164 text,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  min_interval_minutes integer NOT NULL DEFAULT 60,
  paused boolean NOT NULL DEFAULT false,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_reminder_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY "admin manage followup_reminder_settings"
  ON public.followup_reminder_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_frs_updated_at
  BEFORE UPDATE ON public.followup_reminder_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.followup_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  channel text NOT NULL,
  due_count integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  error text,
  recipient text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_frl_owner_created ON public.followup_reminder_log (owner_id, created_at DESC);

ALTER TABLE public.followup_reminder_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_reminder_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "admin read followup_reminder_log"
  ON public.followup_reminder_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));