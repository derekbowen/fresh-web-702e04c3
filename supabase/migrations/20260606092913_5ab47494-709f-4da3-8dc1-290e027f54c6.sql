
-- New enums
CREATE TYPE public.affiliate_tier AS ENUM ('starter', 'lead', 'captain');
CREATE TYPE public.commission_kind AS ENUM ('activation_bonus', 'recurring');

-- Affiliates: tier
ALTER TABLE public.affiliates
  ADD COLUMN tier public.affiliate_tier NOT NULL DEFAULT 'starter',
  ADD COLUMN tier_set_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN tier_override boolean NOT NULL DEFAULT false;

-- Referrals: milestone tracking
ALTER TABLE public.affiliate_referrals
  ADD COLUMN completed_bookings_count integer NOT NULL DEFAULT 0,
  ADD COLUMN activation_paid_at timestamptz,
  ADD COLUMN recurring_unlocked_at timestamptz,
  ADD COLUMN last_booking_at timestamptz,
  ADD COLUMN total_gross_cents bigint NOT NULL DEFAULT 0;

-- Commissions: kind
ALTER TABLE public.affiliate_commissions
  ADD COLUMN kind public.commission_kind NOT NULL DEFAULT 'recurring';

-- Coaching log
CREATE TABLE public.affiliate_coaching_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  note text NOT NULL,
  template_used text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_coaching_log_aff_idx ON public.affiliate_coaching_log(affiliate_id, created_at DESC);
CREATE INDEX affiliate_coaching_log_ref_idx ON public.affiliate_coaching_log(referral_id, created_at DESC);

GRANT SELECT, INSERT ON public.affiliate_coaching_log TO authenticated;
GRANT ALL ON public.affiliate_coaching_log TO service_role;

ALTER TABLE public.affiliate_coaching_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_coaching_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "affiliate reads own coaching log"
  ON public.affiliate_coaching_log
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "affiliate inserts coaching for own crew"
  ON public.affiliate_coaching_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
