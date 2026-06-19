-- Margin-funded host referral rebate ledger ("commission break", v1).
--
-- DECISION (flywheel v1): a booking that originates from a host's own referral
-- link earns that host a rebate paid OUT OF PLATFORM MARGIN, post-booking. We do
-- NOT vary the live Sharetribe transaction commission (that would require
-- transaction-process / privileged-transition changes in the Sharetribe-hosted
-- marketplace app, outside this repo). This mirrors the existing affiliate
-- commission ledger pattern: an internal Supabase ledger, settled separately.
--
-- Idempotent per Sharetribe booking transaction (booking_st_tx_id UNIQUE).

CREATE TABLE public.host_referral_rebates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_st_id text NOT NULL,                          -- Sharetribe provider (host) UUID who shared the link
  booking_st_tx_id text NOT NULL UNIQUE,             -- Sharetribe transaction id; idempotency key
  ref_code text,                                     -- attributing ref code (affiliates.code), if known
  booking_gross_cents bigint NOT NULL DEFAULT 0,
  rebate_rate numeric(5,4) NOT NULL DEFAULT 0.0500,  -- 0.05 = 5% of gross, paid from margin
  rebate_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',            -- pending | approved | paid | reversed
  booking_date timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_referral_rebates TO authenticated;
GRANT ALL ON public.host_referral_rebates TO service_role;

ALTER TABLE public.host_referral_rebates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_referral_rebates FORCE ROW LEVEL SECURITY;

-- Admin-only reads (same pattern as the st_* mirror tables). The settlement job
-- writes via the service role, which bypasses RLS.
CREATE POLICY "admins read host_referral_rebates" ON public.host_referral_rebates
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_host_referral_rebates_updated BEFORE UPDATE ON public.host_referral_rebates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX host_referral_rebates_host_idx ON public.host_referral_rebates (host_st_id);
CREATE INDEX host_referral_rebates_status_idx ON public.host_referral_rebates (status, created_at DESC);
CREATE INDEX host_referral_rebates_ref_idx ON public.host_referral_rebates (ref_code);
