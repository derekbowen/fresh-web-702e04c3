
CREATE TABLE public.prnm_coach_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('ceo','coo','cs')),
  title TEXT NOT NULL,
  why TEXT,
  impact TEXT CHECK (impact IN ('high','medium','low')) DEFAULT 'high',
  effort TEXT CHECK (effort IN ('quick','medium','deep')) DEFAULT 'medium',
  action_label TEXT,
  action_route TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  batch_id UUID,
  generated_by UUID,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prnm_coach_opps_role_open ON public.prnm_coach_opportunities (role, completed_at, dismissed_at, created_at DESC);

ALTER TABLE public.prnm_coach_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prnm_coach_opportunities FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.prnm_coach_opportunities FROM anon, authenticated;

CREATE TRIGGER trg_prnm_coach_opps_updated
BEFORE UPDATE ON public.prnm_coach_opportunities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
