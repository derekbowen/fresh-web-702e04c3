
-- Snippets: reusable saved blocks
CREATE TABLE public.composer_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.composer_snippets TO service_role;
ALTER TABLE public.composer_snippets ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated grants — accessed only via supabaseAdmin in server fns.

-- A/B test orchestration
CREATE TABLE public.composer_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID,
  audience TEXT NOT NULL,
  custom_emails JSONB,
  subject_a TEXT NOT NULL,
  subject_b TEXT NOT NULL,
  body_html TEXT NOT NULL,
  plain_body TEXT,
  preview_text TEXT,
  sample_percent INTEGER NOT NULL DEFAULT 10,
  winner_after_minutes INTEGER NOT NULL DEFAULT 120,
  status TEXT NOT NULL DEFAULT 'sampling', -- sampling | awaiting_winner | sending_winner | completed | cancelled
  winner_variant TEXT,            -- 'a' | 'b'
  winner_picked_at TIMESTAMPTZ,
  winner_picked_by TEXT,          -- 'manual' | 'auto' | 'fallback'
  scheduled_winner_at TIMESTAMPTZ NOT NULL,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sample_a_count INTEGER NOT NULL DEFAULT 0,
  sample_b_count INTEGER NOT NULL DEFAULT 0,
  winner_recipient_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT ALL ON public.composer_ab_tests TO service_role;
ALTER TABLE public.composer_ab_tests ENABLE ROW LEVEL SECURITY;

-- Link campaigns to A/B tests + sequences
ALTER TABLE public.composer_campaigns
  ADD COLUMN IF NOT EXISTS ab_test_id UUID REFERENCES public.composer_ab_tests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ab_variant TEXT,
  ADD COLUMN IF NOT EXISTS sequence_id UUID,
  ADD COLUMN IF NOT EXISTS sequence_position INTEGER;

CREATE INDEX IF NOT EXISTS idx_composer_campaigns_ab_test ON public.composer_campaigns(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_composer_campaigns_sequence ON public.composer_campaigns(sequence_id);
CREATE INDEX IF NOT EXISTS idx_composer_ab_tests_status ON public.composer_ab_tests(status, scheduled_winner_at);

-- updated_at trigger for snippets
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_composer_snippets_updated ON public.composer_snippets;
CREATE TRIGGER trg_composer_snippets_updated
  BEFORE UPDATE ON public.composer_snippets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
