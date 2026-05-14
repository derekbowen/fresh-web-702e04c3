CREATE OR REPLACE FUNCTION public.get_hooks_admin_token()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'hooks_admin_token' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_hooks_admin_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_hooks_admin_token() TO service_role;