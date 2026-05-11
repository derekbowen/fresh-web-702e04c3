CREATE TABLE IF NOT EXISTS public.prnm_coach_user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('ceo','coo','cs')),
  source text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto','override','admin_set')),
  detected_email text,
  detected_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.prnm_coach_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prnm_coach_user_roles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.prnm_coach_user_roles FROM anon, authenticated;

DROP TRIGGER IF EXISTS prnm_coach_user_roles_updated_at ON public.prnm_coach_user_roles;
CREATE TRIGGER prnm_coach_user_roles_updated_at
BEFORE UPDATE ON public.prnm_coach_user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();