-- Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated.
-- Keep functions intentionally exposed: has_role (used in RLS), verify_certificate (public cert lookup).

REVOKE EXECUTE ON FUNCTION public.get_hooks_admin_token() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_affiliate_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_affiliate_on_signup() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_related_slugs_for_template(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_refresh_host_acq_related() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_related_city_slugs(text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_followup_for_lead() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_followup_on_touch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_resolve_404_for_page() FROM anon, authenticated, PUBLIC;