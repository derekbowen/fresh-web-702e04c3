-- seo_repair database-tool mode, call 1 of 2: private schema + fetch of the reviewed bundle (pg_net).
-- Fill in __COMMIT__ (the fresh-web commit holding dbtool/bundle.json) and __BUNDLE_SHA256__ (sha256sum of that file).
create schema if not exists seo_repair;
revoke all on schema seo_repair from public;
create table if not exists seo_repair.stage_meta (k text primary key, v text, at timestamptz not null default now());
alter table seo_repair.stage_meta enable row level security;
insert into seo_repair.stage_meta (k, v) values
  ('bundle_url', 'https://raw.githubusercontent.com/derekbowen/fresh-web-702e04c3/__COMMIT__/ops/seo-repairs-2026-11/db-change/dbtool/bundle.json'),
  ('bundle_sha256', '__BUNDLE_SHA256__')
on conflict (k) do update set v = excluded.v, at = now();
insert into seo_repair.stage_meta (k, v)
select 'bundle_request', net.http_get(url := v, timeout_milliseconds := 60000)::text
from seo_repair.stage_meta where k = 'bundle_url'
on conflict (k) do update set v = excluded.v, at = now();
select k, v from seo_repair.stage_meta order by k;
