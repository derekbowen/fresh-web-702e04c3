
-- ===== enums =====
DO $$ BEGIN
  CREATE TYPE public.affiliate_status AS ENUM ('pending','approved','rejected','paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.commission_status AS ENUM ('pending','approved','paid','reversed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attribution_source AS ENUM ('cookie','manual_admin','invite_link','form_field');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== code generator (short, legible, unique) =====
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
    END LOOP;
    candidate := substr(candidate,1,4) || '-' || substr(candidate,5,4);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE code = candidate);
  END LOOP;
  RETURN candidate;
END $$;

-- ===== affiliates =====
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  payout_method text,
  payout_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience text,
  promo_plan text,
  notes text,
  code text NOT NULL UNIQUE DEFAULT public.generate_affiliate_code(),
  status public.affiliate_status NOT NULL DEFAULT 'pending',
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX affiliates_email_lower_uniq ON public.affiliates (lower(email));
CREATE INDEX affiliates_user_id_idx ON public.affiliates (user_id);

GRANT SELECT ON public.affiliates TO authenticated;  -- scoped by RLS to own row
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates FORCE ROW LEVEL SECURITY;
CREATE POLICY "affiliate sees own record" ON public.affiliates FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ===== clicks =====
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  ref_code text NOT NULL,
  landing_path text,
  referrer text,
  ip_hash text,
  ua text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_clicks_affiliate_idx ON public.affiliate_clicks (affiliate_id, created_at DESC);
CREATE INDEX affiliate_clicks_code_idx ON public.affiliate_clicks (ref_code, created_at DESC);
GRANT ALL ON public.affiliate_clicks TO service_role;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks FORCE ROW LEVEL SECURITY;

-- ===== referrals (a Sharetribe host attributed to an affiliate) =====
CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  sharetribe_user_id text NOT NULL UNIQUE,
  email_seen text,
  display_name text,
  attribution_source public.attribution_source NOT NULL DEFAULT 'manual_admin',
  attributed_at timestamptz NOT NULL DEFAULT now(),
  first_booking_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_referrals_aff_idx ON public.affiliate_referrals (affiliate_id);

GRANT SELECT ON public.affiliate_referrals TO authenticated;
GRANT ALL ON public.affiliate_referrals TO service_role;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals FORCE ROW LEVEL SECURITY;
CREATE POLICY "affiliate sees own referrals" ON public.affiliate_referrals FOR SELECT TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );

-- ===== payouts (declared before commissions so the FK target exists) =====
CREATE TABLE public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  period_start date,
  period_end date,
  total_cents bigint NOT NULL DEFAULT 0,
  method text,
  reference text,
  notes text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  paid_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_payouts_aff_idx ON public.affiliate_payouts (affiliate_id, paid_at DESC);
GRANT SELECT ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts FORCE ROW LEVEL SECURITY;
CREATE POLICY "affiliate sees own payouts" ON public.affiliate_payouts FOR SELECT TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );

-- ===== commissions =====
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
  sharetribe_tx_id text NOT NULL UNIQUE,
  host_user_id text NOT NULL,
  listing_id text,
  listing_title text,
  booking_gross_cents bigint NOT NULL,
  commission_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  booking_date timestamptz NOT NULL,
  status public.commission_status NOT NULL DEFAULT 'pending',
  payout_id uuid REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_commissions_aff_status_idx ON public.affiliate_commissions (affiliate_id, status);
CREATE INDEX affiliate_commissions_payout_idx ON public.affiliate_commissions (payout_id);
CREATE INDEX affiliate_commissions_booking_date_idx ON public.affiliate_commissions (booking_date DESC);
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT ALL ON public.affiliate_commissions TO service_role;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions FORCE ROW LEVEL SECURITY;
CREATE POLICY "affiliate sees own commissions" ON public.affiliate_commissions FOR SELECT TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );

-- ===== updated_at triggers =====
CREATE TRIGGER tg_affiliates_updated BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_affiliate_referrals_updated BEFORE UPDATE ON public.affiliate_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_affiliate_commissions_updated BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== auto-link affiliate.user_id when matching email signs in =====
CREATE OR REPLACE FUNCTION public.link_affiliate_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.affiliates
     SET user_id = NEW.id, updated_at = now()
   WHERE user_id IS NULL
     AND lower(email) = lower(NEW.email);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_link_affiliate_on_signup ON auth.users;
CREATE TRIGGER tg_link_affiliate_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_affiliate_on_signup();
