SELECT cron.unschedule('sync-sharetribe-listings-hourly');
SELECT cron.schedule(
  'sync-sharetribe-listings-hourly',
  '15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fresh-web.lovable.app/api/public/hooks/sync-listings',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-admin-token', public.get_hooks_admin_token()
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 600000
  ) AS request_id;
  $$
);