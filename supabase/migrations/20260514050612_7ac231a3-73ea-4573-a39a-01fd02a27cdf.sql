SELECT cron.unschedule('auto-generate-content-batch');

SELECT cron.schedule(
  'auto-generate-content-batch',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ptfjspcphskifoseidut.supabase.co/functions/v1/generate-content-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-admin-token', public.get_hooks_admin_token()
    ),
    body := jsonb_build_object('action','start','count',10,'model','google/gemini-3-flash-preview')
  ) AS request_id;
  $$
);