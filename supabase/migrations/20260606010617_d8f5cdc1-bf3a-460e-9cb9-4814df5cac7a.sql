do $$
declare jid int;
begin
  select jobid into jid from cron.job where jobname = 'auto-outreach-worker';
  if jid is not null then perform cron.unschedule(jid); end if;
end $$;

select cron.schedule(
  'auto-outreach-worker',
  '*/5 * * * *',
  $$ select net.http_post(
       url := 'https://fresh-web.lovable.app/api/public/hooks/auto-outreach-worker',
       headers := jsonb_build_object(
         'Content-Type','application/json',
         'x-admin-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hooks_admin_token' LIMIT 1)
       ),
       body := '{}'::jsonb
     ) $$
);