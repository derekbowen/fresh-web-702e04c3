
-- Mirror tables for Sharetribe Integration API data
CREATE TABLE public.st_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharetribe_id text NOT NULL UNIQUE,
  email text,
  display_name text,
  first_name text,
  last_name text,
  banned boolean NOT NULL DEFAULT false,
  deleted boolean NOT NULL DEFAULT false,
  email_verified boolean NOT NULL DEFAULT false,
  pending_email text,
  role text,
  created_at_st timestamptz,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.st_users TO authenticated;
GRANT ALL ON public.st_users TO service_role;
ALTER TABLE public.st_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.st_users FORCE ROW LEVEL SECURITY;
CREATE POLICY "admins read st_users" ON public.st_users FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_st_users_updated BEFORE UPDATE ON public.st_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX st_users_email_idx ON public.st_users (lower(email));
CREATE INDEX st_users_created_idx ON public.st_users (created_at_st DESC);

CREATE TABLE public.st_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharetribe_id text NOT NULL UNIQUE,
  author_st_id text,
  title text,
  description text,
  state text,
  geolocation jsonb,
  city text,
  region text,
  country text,
  price_amount bigint,
  price_currency text,
  photos_count int NOT NULL DEFAULT 0,
  created_at_st timestamptz,
  updated_at_st timestamptz,
  public_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.st_listings TO authenticated;
GRANT ALL ON public.st_listings TO service_role;
ALTER TABLE public.st_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.st_listings FORCE ROW LEVEL SECURITY;
CREATE POLICY "admins read st_listings" ON public.st_listings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_st_listings_updated BEFORE UPDATE ON public.st_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX st_listings_author_idx ON public.st_listings (author_st_id);
CREATE INDEX st_listings_state_idx ON public.st_listings (state);
CREATE INDEX st_listings_updated_idx ON public.st_listings (updated_at_st DESC);

CREATE TABLE public.st_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharetribe_id text NOT NULL UNIQUE,
  process_name text,
  last_transition text,
  last_transitioned_at timestamptz,
  listing_st_id text,
  listing_title text,
  customer_st_id text,
  provider_st_id text,
  booking_start timestamptz,
  booking_end timestamptz,
  payin_total_cents bigint,
  payout_total_cents bigint,
  provider_commission_cents bigint,
  customer_commission_cents bigint,
  currency text,
  state text,
  created_at_st timestamptz,
  transitions jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.st_transactions TO authenticated;
GRANT ALL ON public.st_transactions TO service_role;
ALTER TABLE public.st_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.st_transactions FORCE ROW LEVEL SECURITY;
CREATE POLICY "admins read st_transactions" ON public.st_transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_st_transactions_updated BEFORE UPDATE ON public.st_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX st_tx_provider_idx ON public.st_transactions (provider_st_id);
CREATE INDEX st_tx_customer_idx ON public.st_transactions (customer_st_id);
CREATE INDEX st_tx_listing_idx ON public.st_transactions (listing_st_id);
CREATE INDEX st_tx_last_trans_idx ON public.st_transactions (last_transitioned_at DESC);
CREATE INDEX st_tx_state_idx ON public.st_transactions (state, last_transitioned_at DESC);

CREATE TABLE public.st_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharetribe_id text NOT NULL UNIQUE,
  transaction_st_id text,
  sender_st_id text,
  content text NOT NULL,
  created_at_st timestamptz NOT NULL,
  scanned boolean NOT NULL DEFAULT false,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.st_messages TO authenticated;
GRANT ALL ON public.st_messages TO service_role;
ALTER TABLE public.st_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.st_messages FORCE ROW LEVEL SECURITY;
CREATE POLICY "admins read st_messages" ON public.st_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX st_messages_tx_idx ON public.st_messages (transaction_st_id, created_at_st DESC);
CREATE INDEX st_messages_sender_idx ON public.st_messages (sender_st_id);
CREATE INDEX st_messages_created_idx ON public.st_messages (created_at_st DESC);
CREATE INDEX st_messages_unscanned_idx ON public.st_messages (scanned) WHERE scanned = false;

CREATE TABLE public.st_sync_state (
  resource text PRIMARY KEY,
  last_synced_at timestamptz,
  last_cursor text,
  last_run_at timestamptz,
  last_run_status text,
  last_run_error text,
  last_run_rows int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.st_sync_state TO authenticated;
GRANT ALL ON public.st_sync_state TO service_role;
ALTER TABLE public.st_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.st_sync_state FORCE ROW LEVEL SECURITY;
CREATE POLICY "admins read st_sync_state" ON public.st_sync_state FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_st_sync_updated BEFORE UPDATE ON public.st_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.security_alert_category AS ENUM ('off_platform','harassment','fraud','safety');
CREATE TYPE public.security_alert_severity AS ENUM ('low','medium','high');
CREATE TYPE public.security_alert_status AS ENUM ('open','reviewed','dismissed','escalated');

CREATE TABLE public.st_security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_st_id text NOT NULL,
  transaction_st_id text,
  sender_st_id text,
  category public.security_alert_category NOT NULL,
  severity public.security_alert_severity NOT NULL,
  matched_terms text[] NOT NULL DEFAULT '{}',
  snippet text NOT NULL,
  status public.security_alert_status NOT NULL DEFAULT 'open',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_st_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.st_security_alerts TO authenticated;
GRANT ALL ON public.st_security_alerts TO service_role;
ALTER TABLE public.st_security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.st_security_alerts FORCE ROW LEVEL SECURITY;
CREATE POLICY "admins read st_alerts" ON public.st_security_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_st_alerts_updated BEFORE UPDATE ON public.st_security_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX st_alerts_status_idx ON public.st_security_alerts (status, created_at DESC);
CREATE INDEX st_alerts_severity_idx ON public.st_security_alerts (severity, created_at DESC);
