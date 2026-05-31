-- Enable RLS on the backup table (admin-only via service_role; no anon/authenticated access)
ALTER TABLE public.content_pages_backup_2026_05_31_tx_refresh ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.content_pages_backup_2026_05_31_tx_refresh FROM anon, authenticated;
GRANT ALL ON public.content_pages_backup_2026_05_31_tx_refresh TO service_role;

-- Revoke public EXECUTE on the trigger-only SECURITY DEFINER function.
-- It's invoked by triggers (which run as table owner) and should never be callable directly.
REVOKE EXECUTE ON FUNCTION public.tg_refresh_host_acq_related() FROM PUBLIC, anon, authenticated;