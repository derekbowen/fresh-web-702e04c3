-- run at 2026-11-15T20:32:20.984Z
set transaction read only;
select table_name, column_name, data_type, udt_name, is_nullable from information_schema.columns where table_schema='public' and table_name in ('pp_pools','pp_cities') order by table_name, ordinal_position;