SELECT cron.schedule('poll-sharetribe-hosts-daily', '0 14 * * *', $$
SELECT net.http_post(
  url := 'https://fresh-web.lovable.app/api/public/hooks/poll-sharetribe-hosts',
  headers := jsonb_build_object(
    'Content-Type','application/json',
    'x-admin-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hooks_admin_token' LIMIT 1)
  ),
  body := '{}'::jsonb
);
$$);

SELECT cron.schedule('send-host-drip-emails-5m', '*/5 * * * *', $$
SELECT net.http_post(
  url := 'https://fresh-web.lovable.app/api/public/hooks/send-host-drip-emails',
  headers := jsonb_build_object(
    'Content-Type','application/json',
    'x-admin-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hooks_admin_token' LIMIT 1)
  ),
  body := '{}'::jsonb
);
$$);