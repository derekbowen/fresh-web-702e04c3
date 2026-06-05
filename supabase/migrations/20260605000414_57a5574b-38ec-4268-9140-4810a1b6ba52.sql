SELECT cron.unschedule('sms-sender-every-5min');

SELECT cron.schedule(
  'sms-sender-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fresh-web.lovable.app/api/public/hooks/sms-sender',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-admin-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hooks_admin_token' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);