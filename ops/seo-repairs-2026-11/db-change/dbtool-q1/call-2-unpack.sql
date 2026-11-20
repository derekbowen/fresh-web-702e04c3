-- seo_repair database-tool mode, call 2 of 2: check the fetched bundle and run its loader. Wait a few seconds
-- after call 1. Fails, changing nothing, unless the fetched file has exactly the sha256 given in call 1.
do $u$
declare v_body text; v_sha text;
begin
  select r.content into v_body from net._http_response r
  where r.id = (select v::bigint from seo_repair.stage_meta where k = 'bundle_request') and r.status_code = 200;
  if v_body is null then
    raise exception 'bundle not fetched (yet): %', (select coalesce(status_code::text, 'no status') || ' ' || coalesce(error_msg, '')
      from net._http_response where id = (select v::bigint from seo_repair.stage_meta where k = 'bundle_request'));
  end if;
  v_sha := encode(sha256(convert_to(v_body, 'UTF8')), 'hex');
  if v_sha is distinct from (select v from seo_repair.stage_meta where k = 'bundle_sha256') then
    raise exception 'bundle sha256 % is not the expected one; nothing loaded', v_sha;
  end if;
  execute (v_body::jsonb -> 'files' ->> 'loader.sql');
end
$u$;
select k, v from seo_repair.stage_meta order by k;
