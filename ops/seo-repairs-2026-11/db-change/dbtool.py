#!/usr/bin/env python3
"""Database-tool mode of the F5 + F14 content repair: the same change, run without psql or a connection string.

The production database is reachable from the operator's session only through the Supabase database tool: one SQL
text per call, about 2 MB at most, no psql meta-commands, no files. This builds everything the tool needs from the
same generator (generate.py), so the SQL that evaluates and changes the data is the tested SQL:

    dbtool/bundle.json          every rule (from the two reviewed CSVs) and every SQL script, ASCII JSON
    dbtool/call-1-bootstrap.sql  pasted into the tool with the commit SHA and the bundle sha256 filled in: creates the
                                 private schema `seo_repair` and asks pg_net to fetch bundle.json from GitHub at that
                                 commit
    dbtool/call-2-unpack.sql     pasted next: checks the fetched bundle's sha256 and runs its loader, which creates
                                 the stage tables and the two runner functions, unpacks the rules and checks their
                                 digests
    dbtool/CALLS.md              every later call, each a one-liner: seo_repair.run('<script>') or
                                 seo_repair.q('<query>')

Differences from the psql package, all deliberate:
  * rules and pins live in tables of the schema `seo_repair` (not exposed by the Supabase API) instead of inline
    VALUES lists; the apply copies them into the same temp tables the psql apply uses;
  * the P1 pin read runs inside the database (pins.sql) in one transaction and records its sha256 (same format as
    generate.pins_digest); apply refuses unless that digest is the one written to seo_repair.stage_meta as
    'reviewed_pin_set_sha256' after the dry run was read;
  * the backup and log tables are created in `seo_repair` instead of `public` (RELEASE.md step 4: backups outside the
    schema the API exposes); names are otherwise unchanged;
  * psql-only parts are gone (\\set, \\echo, \\if, :'var'); the rollback's optional run id comes from
    seo_repair.stage_meta 'rollback_only_run'; summaries are separate read-only queries.

Usage:
    python3 dbtool.py [--verified-only] [--out DIR]          # writes DIR/bundle.json + the two call files + CALLS.md
    python3 dbtool.py ... --expected FILE                     # test only (as generate.py)
"""
import argparse
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import generate as g  # noqa: E402

SCHEMA = "seo_repair"
FORMAT = "seo-repair-dbtool-1"
LINK_FIELDS = ["rule_id", "form", "path", "action", "old_target", "dest", "exp_present", "exp_ins", "exp_change", "tol",
               "pat_ctx", "repl_ctx", "pat_md", "pat_html"]
FEE_FIELDS = ["rule_id", "t", "rid", "slug", "col", "ord", "category", "old_text", "old_md5", "new_text"]
FEE_KEYS = {"old_text": "old", "new_text": "new"}          # bundle field -> generate.py rule dict key
REPO_PATH = "ops/seo-repairs-2026-11/db-change/dbtool/bundle.json"
RAW_URL = "https://raw.githubusercontent.com/derekbowen/fresh-web-702e04c3/__COMMIT__/" + REPO_PATH


def to_schema(sql):
    """backup / log tables: public.seo_repair_* -> seo_repair.seo_repair_*"""
    out = sql.replace("public.seo_repair_", SCHEMA + ".seo_repair_")
    out = out.replace("revoke all on public.%I from %I", "revoke all on " + SCHEMA + ".%I from %I")
    assert "public.seo_repair" not in out and "on public.%I" not in out
    return out


def no_psql(sql, name):
    for ln in sql.split("\n"):
        assert not ln.lstrip().startswith("\\"), (name, ln)
    assert not re.search(r":'[A-Za-z_]\w*'|:\{\?|(?<![:\w]):[A-Za-z_]\w*\b(?!:)", re.sub(r"'[^']*'|::\w+", "", sql)), name
    return sql


# ------------------------------------------------------------------ digests (the loader recomputes them in SQL)

def frepr(v):
    if v is None:
        return "~"
    s = str(v)
    return "%d:%s" % (len(s), s)


def rows_digest(rows):
    """sha256 over rows sorted by their first field (byte order = COLLATE "C"); each field length-prefixed"""
    h = hashlib.sha256()
    for r in sorted(rows, key=lambda r: r[0].encode("utf-8")):
        h.update(("|".join(frepr(v) for v in r) + "\n").encode("utf-8"))
    return h.hexdigest()


def sql_digest(table, cols):
    parts = ", ".join("case when %s is null then '~' else length(%s::text)::text || ':' || %s::text end" % (c, c, c)
                      for c in cols)
    return ("(select coalesce(encode(sha256(convert_to(string_agg(concat_ws('|', %s) || E'\\n', '' "
            "order by %s collate \"C\"), 'UTF8')), 'hex'), encode(sha256(''::bytea), 'hex')) from %s)"
            % (parts, cols[0], table))


PIN_DIGEST_SQL = ("(select coalesce(encode(sha256(convert_to(string_agg(t || E'\\t' || rid || E'\\t' || col || E'\\t' || md5 "
                  "|| E'\\n', '' order by t collate \"C\", rid collate \"C\", col collate \"C\"), 'UTF8')), 'hex'), "
                  "encode(sha256(''::bytea), 'hex')) from %s.stage_pins)" % SCHEMA)

# ------------------------------------------------------------------ the SQL scripts

TABLES_SQL = """create schema if not exists seo_repair;
revoke all on schema seo_repair from public;
create table if not exists seo_repair.stage_meta (k text primary key, v text, at timestamptz not null default now());
create table if not exists seo_repair.stage_file (name text primary key, sha256 text not null, content text not null);
create table if not exists seo_repair.stage_link_rules (rule_id text primary key, form text, path text, action text,
  old_target text, dest text, exp_present int, exp_ins int, exp_change int, tol int, pat_ctx text, repl_ctx text,
  pat_md text, pat_html text);
create table if not exists seo_repair.stage_fee_rules (rule_id text primary key, t text, rid text, slug text, col text,
  ord int, category text, old_text text, old_md5 text, new_text text, pin text);
create table if not exists seo_repair.stage_pins (t text, rid text, col text, md5 text, primary key (t, rid, col));

create or replace function seo_repair.run(p_name text) returns text language plpgsql as $f$
declare v text; v_sha text;
begin
  select content, sha256 into v, v_sha from seo_repair.stage_file where name = p_name;
  if v is null then
    raise exception 'seo_repair.run: no staged script %', p_name;
  end if;
  if encode(sha256(convert_to(v, 'UTF8')), 'hex') <> v_sha then
    raise exception 'seo_repair.run: staged script % does not match its sha256', p_name;
  end if;
  execute v;
  return p_name || ': done';
end
$f$;

create or replace function seo_repair.q(p_name text) returns setof jsonb language plpgsql as $f$
declare v text; v_sha text;
begin
  select content, sha256 into v, v_sha from seo_repair.stage_file where name = p_name;
  if v is null then
    raise exception 'seo_repair.q: no staged query %', p_name;
  end if;
  if encode(sha256(convert_to(v, 'UTF8')), 'hex') <> v_sha then
    raise exception 'seo_repair.q: staged query % does not match its sha256', p_name;
  end if;
  return query execute 'select to_jsonb(x) from (' || v || ') x';
end
$f$;

-- nobody but the owner (the role running this) can use the schema, its tables or its functions
alter table seo_repair.stage_meta enable row level security;
alter table seo_repair.stage_file enable row level security;
alter table seo_repair.stage_link_rules enable row level security;
alter table seo_repair.stage_fee_rules enable row level security;
alter table seo_repair.stage_pins enable row level security;
revoke all on all tables in schema seo_repair from public;
revoke all on function seo_repair.run(text), seo_repair.q(text) from public;
do $g$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema seo_repair from %I', r);
      execute format('revoke all on all tables in schema seo_repair from %I', r);
      execute format('revoke all on all sequences in schema seo_repair from %I', r);
      execute format('revoke all on all functions in schema seo_repair from %I', r);
    end if;
  end loop;
end
$g$;
"""


def loader_sql(digests):
    link_cols = ", ".join(LINK_FIELDS)
    link_typed = ", ".join("%s %s" % (c, "int" if c in ("exp_present", "exp_ins", "exp_change", "tol") else "text")
                           for c in LINK_FIELDS)
    fee_cols = ", ".join(FEE_FIELDS)
    fee_typed = ", ".join("%s %s" % (c, "int" if c == "ord" else "text") for c in FEE_FIELDS)
    return TABLES_SQL + """
do $ld$
declare
  v_body text;
  b      jsonb;
  v_sha  text;
  v_bad  text;
begin
  select r.content into v_body from net._http_response r
  where r.id = (select v::bigint from seo_repair.stage_meta where k = 'bundle_request') and r.status_code = 200;
  v_sha := encode(sha256(convert_to(v_body, 'UTF8')), 'hex');
  if v_body is null or v_sha is distinct from (select v from seo_repair.stage_meta where k = 'bundle_sha256') then
    raise exception 'seo_repair loader: the fetched bundle is missing or its sha256 is not the expected one';
  end if;
  b := v_body::jsonb;
  if b ->> 'format' is distinct from '%(format)s' then
    raise exception 'seo_repair loader: unknown bundle format %%', b ->> 'format';
  end if;
  if exists (select 1 from seo_repair.stage_pins) then
    raise exception 'seo_repair loader: pins were already read for the staged rules (%%). Loading another bundle would detach them; delete from seo_repair.stage_pins first if a new pin read, dry run and review are intended',
      (select v from seo_repair.stage_meta where k = 'pin_set_sha256');
  end if;
  delete from seo_repair.stage_link_rules;
  delete from seo_repair.stage_fee_rules;
  delete from seo_repair.stage_file;
  insert into seo_repair.stage_link_rules (%(link_cols)s)
  select %(link_cols)s from jsonb_to_recordset(b -> 'link_rules') as x(%(link_typed)s);
  insert into seo_repair.stage_fee_rules (%(fee_cols)s)
  select %(fee_cols)s from jsonb_to_recordset(b -> 'fee_rules') as x(%(fee_typed)s);
  insert into seo_repair.stage_file (name, sha256, content)
  select f.key, encode(sha256(convert_to(f.value #>> '{}', 'UTF8')), 'hex'), f.value #>> '{}'
  from jsonb_each(b -> 'files') f;
  -- every staged script is byte-identical to the one the bundle lists
  select string_agg(f.name, ', ') into v_bad
  from seo_repair.stage_file f
  where f.sha256 is distinct from (b -> 'file_sha256' ->> f.name);
  if v_bad is not null or (select count(*) from seo_repair.stage_file) <> (select count(*) from jsonb_object_keys(b -> 'file_sha256')) then
    raise exception 'seo_repair loader: staged scripts differ from the bundle manifest: %%', coalesce(v_bad, 'count');
  end if;
  -- the staged rules are exactly the generator's rules (field by field, length-prefixed)
  if %(link_digest_sql)s <> '%(link_digest)s' then
    raise exception 'seo_repair loader: staged link rules digest differs from the generator''s';
  end if;
  if %(fee_digest_sql)s <> '%(fee_digest)s' then
    raise exception 'seo_repair loader: staged fee rules digest differs from the generator''s';
  end if;
  insert into seo_repair.stage_meta (k, v) values
    ('bundle_loaded', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
    ('bundle_inputs', (b -> 'inputs')::text),
    ('staged_link_rules', (select count(*) from seo_repair.stage_link_rules)::text),
    ('staged_fee_rules', (select count(*) from seo_repair.stage_fee_rules)::text),
    ('staged_rules_digest', '%(link_digest)s / %(fee_digest)s')
  on conflict (k) do update set v = excluded.v, at = now();
end
$ld$;
""" % dict(format=FORMAT, link_cols=link_cols, link_typed=link_typed, fee_cols=fee_cols, fee_typed=fee_typed,
           link_digest_sql=sql_digest("seo_repair.stage_link_rules", LINK_FIELDS), link_digest=digests["link_rules"],
           fee_digest_sql=sql_digest("seo_repair.stage_fee_rules", FEE_FIELDS), fee_digest=digests["fee_rules"])


def fee_pin_expr(fee_rules):
    cols = {}
    for x in fee_rules:
        cols.setdefault(x["t"], set()).add(x["col"])
    exprs = []
    for t in sorted(cols):
        cases = " ".join("when %s then x.%s" % (g.lit(c), c) for c in sorted(cols[t]))
        exprs.append("when %s then (select (case f.col %s end)::text from public.%s x where x.id = f.rid::uuid)"
                     % (g.lit(t), cases, t))
    if not exprs:
        return "null::text"
    return "case f.t %s end" % " ".join(exprs)


def pins_sql(fee_rules):
    """PENDING-READS P1, inside the database: the md5 of every field the change may write, in one transaction"""
    return """do $p0$
begin
  if exists (select 1 from seo_repair.stage_pins) then
    raise exception 'seo_repair pins: pins were already read (pin set %%). A new pin read is a new dry run and a new review; delete from seo_repair.stage_pins first if that is intended',
      (select v from seo_repair.stage_meta where k = 'pin_set_sha256');
  end if;
  if not exists (select 1 from seo_repair.stage_link_rules) and not exists (select 1 from seo_repair.stage_fee_rules) then
    raise exception 'seo_repair pins: no staged rules';
  end if;
end
$p0$;
create temp table _seo_link_rules on commit drop as select * from seo_repair.stage_link_rules;
insert into seo_repair.stage_pins (t, rid, col, md5)
select distinct k.t, k.rid, k.col, md5(k.val)
from (
%(fields)s
) k
join _seo_link_rules r on r.form = k.form and r.path = k.path;
insert into seo_repair.stage_pins (t, rid, col, md5)
select f.t, f.rid, f.col, coalesce(md5(%(fee_expr)s), 'MISSING')
from (select distinct t, rid, col from seo_repair.stage_fee_rules) f
on conflict (t, rid, col) do nothing;
update seo_repair.stage_fee_rules r set pin = p.md5
from seo_repair.stage_pins p where p.t = r.t and p.rid = r.rid and p.col = r.col;
do $p1$
begin
  if exists (select 1 from seo_repair.stage_fee_rules where pin is null) then
    raise exception 'seo_repair pins: a fee rule has no pin';
  end if;
end
$p1$;
insert into seo_repair.stage_meta (k, v) values
  ('pin_set_sha256', %(digest)s),
  ('pinned_fields', (select count(*) from seo_repair.stage_pins)::text),
  ('pinned_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
on conflict (k) do update set v = excluded.v, at = now();
""" % dict(fields=g.link_fields_sql(), fee_expr=fee_pin_expr(fee_rules), digest=PIN_DIGEST_SQL)


STAGED_RULES_SECTION = """-- 3. rules and field md5 pins: copied from the stage tables, after checking they are the reviewed ones
do $chk$
declare v_pins text := %(pin_digest)s;
begin
  if %(link_digest_sql)s <> '%(link_digest)s' or %(fee_digest_sql)s <> '%(fee_digest)s' then
    raise exception 'SEO repair: the staged rules are not the rules of this bundle; nothing changed';
  end if;
  if v_pins is distinct from (select v from seo_repair.stage_meta where k = 'pin_set_sha256') then
    raise exception 'SEO repair: the staged pins changed after the pin read; nothing changed';
  end if;
  if v_pins is distinct from (select v from seo_repair.stage_meta where k = 'reviewed_pin_set_sha256') then
    raise exception 'SEO repair: pin set %% has not been marked reviewed (seo_repair.stage_meta reviewed_pin_set_sha256); nothing changed', v_pins;
  end if;
end
$chk$;
create temp table _seo_link_rules (rule_id text primary key, form text, path text, action text, old_target text,
  dest text, exp_present int, exp_ins int, exp_change int, tol int, pat_ctx text, repl_ctx text, pat_md text,
  pat_html text) on commit drop;
insert into _seo_link_rules (%(link_cols)s) select %(link_cols)s from seo_repair.stage_link_rules;
create temp table _seo_fee_rules (rule_id text primary key, t text, rid text, slug text, col text, ord int,
  category text, old_text text, old_md5 text, new_text text, pin text) on commit drop;
insert into _seo_fee_rules (%(fee_cols)s) select %(fee_cols)s from seo_repair.stage_fee_rules;
create temp table _seo_pins (t text, rid text, col text, md5 text, primary key (t, rid, col)) on commit drop;
insert into _seo_pins (t, rid, col, md5) select t, rid, col, md5 from seo_repair.stage_pins;

"""


def apply_script(link_rules, fee_rules, digests):
    a = g.apply_sql(link_rules, fee_rules, None)
    start = "\\set ON_ERROR_STOP on\nbegin;\n"
    i0 = a.index(start) + len(start)
    s3 = a.index("-- 3. rules (data generated from the reviewed CSVs)")
    s4 = a.index("-- 4. evaluation against the live data")
    s6 = a.index("-- 6. summary: rows changed per rule in this run")
    staged = STAGED_RULES_SECTION % dict(
        pin_digest=PIN_DIGEST_SQL, link_digest_sql=sql_digest("seo_repair.stage_link_rules", LINK_FIELDS),
        link_digest=digests["link_rules"], fee_digest_sql=sql_digest("seo_repair.stage_fee_rules", FEE_FIELDS),
        fee_digest=digests["fee_rules"], link_cols=g.LINK_COLS, fee_cols=g.FEE_COLS)
    body = (a[i0:s3] + staged + a[s4:s6] +
            "-- 6. remember this run for the summary queries\n"
            "insert into seo_repair.stage_meta (k, v) values ('last_apply_run', (select run_id from _seo_run))\n"
            "on conflict (k) do update set v = excluded.v, at = now();\n")
    return no_psql(to_schema(body), "apply")


def rollback_script():
    r = g.ROLLBACK_SQL
    i0 = r.index("set local statement_timeout = '60min';")
    i1 = r.index("$rb$;") + len("$rb$;")
    body = r[i0:i1]
    old = "nullif(:'only_run', '')::text as only_run"
    assert body.count(old) == 1
    body = body.replace(old, "(select nullif(v, '') from seo_repair.stage_meta where k = 'rollback_only_run') as only_run")
    body += ("\ninsert into seo_repair.stage_meta (k, v) values ('last_rollback_run', (select run_id from _seo_rb_run))\n"
             "on conflict (k) do update set v = excluded.v, at = now();\n")
    return no_psql(to_schema(body), "rollback")


def query(sql):
    s = sql.strip()
    if s.startswith("set transaction read only;"):
        s = s[len("set transaction read only;"):].strip()
    while s.endswith(";"):
        s = s[:-1].rstrip()
    assert ";" not in s.replace("';'", ""), s[:200]   # one statement only
    return no_psql(s, "query")


def split_sections(text):
    """psql output script -> {title: sql} for every \\echo '=== title ===' section"""
    out = {}
    parts = text.split("\\echo '=== ")
    for p in parts[1:]:
        title, sql = p.split(" ===", 1)
        sql = sql.split("\n", 1)[1]
        out[title] = sql
    return out


def dry_run_queries(link_rules, fee_rules):
    dummy = {("content_pages", "00000000-0000-0000-0000-000000000000", "content"): "MISSING"}
    d = g.dry_run_sql(link_rules, fee_rules, dummy)
    lv = g.link_values(link_rules)
    pv = g.pin_values(dummy)
    link_src = ("with _seo_link_rules (" + g.LINK_COLS + ") as (values\n" + lv + "\n),\n_seo_pins (" + g.PIN_COLS +
                ") as (values\n" + pv + "\n),\n")
    link_dst = ("with _seo_link_rules as (select " + g.LINK_COLS + " from seo_repair.stage_link_rules),\n"
                "_seo_pins as (select " + g.PIN_COLS + " from seo_repair.stage_pins),\n")
    # the generator's fee VALUES list (rules loaded without pins: pin is null)
    fv_gen = g.fee_values(fee_rules)
    fee_src = "with _seo_fee_rules (" + g.FEE_COLS + ") as (values\n" + fv_gen + "\n),\n"
    fee_dst = "with _seo_fee_rules as (select " + g.FEE_COLS + " from seo_repair.stage_fee_rules),\n"
    secs = split_sections(d)
    names = {
        "preflight: columns this change writes (must be text), ids (must be uuid), updated_at": "dry_preflight_columns",
        "preflight: triggers that will fire on update": "dry_preflight_triggers",
        "link rules: fields per rule today (verdict uses the same count guard as apply.sql)": "dry_links",
        "link fields left alone for Derek: the link sits in a paragraph or list item about insurance/liability/coverage/claims/damage": "dry_links_insurance",
        "link fields the field guard will skip (changed since the pin read, or not in it)": "dry_links_field_guard",
        "fee rules: summary": "dry_fees_summary",
        "fee rules that would not apply today (none listed = all apply)": "dry_fees_not_applying",
    }
    out = {}
    for title, name in names.items():
        s = secs[title]
        if "_seo_link_rules (" in s:
            assert s.count(link_src) == 1, name
            s = s.replace(link_src, link_dst)
        if "_seo_fee_rules (" in s:
            assert s.count(fee_src) == 1, name
            s = s.replace(fee_src, fee_dst)
        assert "(values\n(" not in s, name
        out[name + ".sql"] = query(to_schema(s))
    assert set(secs) - set(names) == {"pins this dry run was built with (apply.sql built from the same pins prints the same digest)"}
    out["dry_pins.sql"] = query("""select (select v from seo_repair.stage_meta where k = 'pin_set_sha256') as pin_set_sha256,
  %s as pin_set_sha256_now,
  (select v from seo_repair.stage_meta where k = 'pinned_fields') as pinned_fields,
  (select v from seo_repair.stage_meta where k = 'pinned_at') as pinned_at,
  (select count(*) from seo_repair.stage_pins where md5 = 'MISSING') as pins_missing_field,
  (select count(*) from seo_repair.stage_fee_rules where pin is null) as fee_rules_without_pin,
  (select v from seo_repair.stage_meta where k = 'reviewed_pin_set_sha256') as reviewed_pin_set_sha256,
  (select v from seo_repair.stage_meta where k = 'staged_rules_digest') as staged_rules_digest""" % PIN_DIGEST_SQL)
    return out


def summary_queries():
    run = "(select v from seo_repair.stage_meta where k = 'last_apply_run')"
    rb = "(select v from seo_repair.stage_meta where k = 'last_rollback_run')"
    return {
        "apply_rules.sql": query(to_schema("""select l.rule_id, l.kind, l.label, l.expected,
       coalesce(c.fields, 0) as fields_changed, coalesce(c.occ, 0) as occurrences, coalesce(s.skipped, 0) as skipped
from (select rule_id, 'link ' || action as kind,
             old_target || ' -> ' || coalesce(nullif(dest, ''), '(unlink)') as label, exp_present as expected
      from seo_repair.stage_link_rules
      union all
      select rule_id, 'fee ' || category, slug || ' / ' || col, 1 from seo_repair.stage_fee_rules) l
left join (select rule_id, count(*) as fields, sum(occurrences) as occ from public.seo_repair_change_log
           where run_id = %s group by rule_id) c using (rule_id)
left join (select rule_id, count(*) as skipped from public.seo_repair_skip_log
           where run_id = %s group by rule_id) s using (rule_id)
order by l.rule_id""" % (run, run))),
        "apply_totals.sql": query(to_schema("""select %(run)s as run_id,
       (select count(*) from public.seo_repair_change_log where run_id = %(run)s) as field_changes,
       (select count(distinct (table_name, row_id, column_name)) from public.seo_repair_change_log
         where run_id = %(run)s) as fields_changed,
       (select count(*) from public.seo_repair_backup_20261115 where run_id = %(run)s) as backups_written,
       (select count(*) from public.seo_repair_skip_log where run_id = %(run)s) as skips_logged""" % dict(run=run))),
        "apply_skips.sql": query(to_schema("""select reason, count(*) as n from public.seo_repair_skip_log where run_id = %s
group by reason order by 2 desc, 1""" % run)),
        "rollback_summary.sql": query(to_schema("""select status, count(*) as fields
from public.seo_repair_rollback_log where rollback_run = %s
group by status order by status""" % rb)),
        "rollback_skipped.sql": query(to_schema("""select table_name, row_id, slug, column_name, reason
from public.seo_repair_rollback_log
where rollback_run = %s and status = 'skipped'
order by table_name, slug, column_name""" % rb)),
    }


def verify_queries(link_rules, fee_rules):
    v = g.verify_sql(link_rules, fee_rules, None)
    secs = split_sections(v)
    a = secs["repaired fields whose current value differs from the value the repair wrote (expect 0 rows)"]
    b = secs["repaired fields: total / unchanged since the repair"].split("\\else")[0]
    return {"verify_changed.sql": query(to_schema(a)), "verify_totals.sql": query(to_schema(b))}


CALL1 = """-- seo_repair database-tool mode, call 1 of 2: private schema + fetch of the reviewed bundle (pg_net).
-- Fill in __COMMIT__ (the fresh-web commit holding dbtool/bundle.json) and __BUNDLE_SHA256__ (sha256sum of that file).
create schema if not exists seo_repair;
revoke all on schema seo_repair from public;
create table if not exists seo_repair.stage_meta (k text primary key, v text, at timestamptz not null default now());
alter table seo_repair.stage_meta enable row level security;
insert into seo_repair.stage_meta (k, v) values
  ('bundle_url', '%s'),
  ('bundle_sha256', '__BUNDLE_SHA256__')
on conflict (k) do update set v = excluded.v, at = now();
insert into seo_repair.stage_meta (k, v)
select 'bundle_request', net.http_get(url := v, timeout_milliseconds := 60000)::text
from seo_repair.stage_meta where k = 'bundle_url'
on conflict (k) do update set v = excluded.v, at = now();
select k, v from seo_repair.stage_meta order by k;
""" % RAW_URL

CALL2 = """-- seo_repair database-tool mode, call 2 of 2: check the fetched bundle and run its loader. Wait a few seconds
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
"""

CALLS_MD = """# Database-tool calls (generated by dbtool.py; see RUNBOOK-dbtool.md)

Each block is one call of the database tool. `seo_repair.run(name)` executes a staged script after re-checking its
sha256; `seo_repair.q(name)` returns a staged read-only query's rows as JSON.

| Step | Call |
|---|---|
| 1 bootstrap | `call-1-bootstrap.sql` with `__COMMIT__` and `__BUNDLE_SHA256__` filled in |
| 2 unpack | `call-2-unpack.sql` (a few seconds after 1) |
| 3 pin read (P1) | `begin; set local statement_timeout = '30min'; select seo_repair.run('pins.sql'); commit;` |
| 4 dry run | `begin; set transaction read only; select * from seo_repair.q('<query>'); commit;` for each `dry_*.sql` (aggregate in the call as needed) |
| 5 mark reviewed | `insert into seo_repair.stage_meta (k, v) values ('reviewed_pin_set_sha256', '<pin_set_sha256 from dry_pins>') on conflict (k) do update set v = excluded.v, at = now();` |
| 6 apply | `begin; set local statement_timeout = '60min'; select seo_repair.run('apply.sql'); commit;` |
| 7 summaries | `select * from seo_repair.q('apply_totals.sql')`, `apply_skips.sql`, `apply_rules.sql` |
| 8 verify | `select * from seo_repair.q('verify_totals.sql')`, `verify_changed.sql` (expect 0 rows) |
| rollback | optional run id: `insert into seo_repair.stage_meta (k, v) values ('rollback_only_run', '<run id or empty>') on conflict (k) do update set v = excluded.v, at = now();` then `begin; set local statement_timeout = '60min'; select seo_repair.run('rollback.sql'); commit;` and `rollback_summary.sql`, `rollback_skipped.sql` |

Staged scripts (name, sha256):

%s
"""


def build(link_rules, fee_rules, inputs):
    link_rows = [[x[k] for k in LINK_FIELDS] for x in link_rules]
    fee_rows = [[x[FEE_KEYS.get(k, k)] for k in FEE_FIELDS] for x in fee_rules]
    digests = {"link_rules": rows_digest(link_rows), "fee_rules": rows_digest(fee_rows)}
    files = {"loader.sql": no_psql(loader_sql(digests), "loader"),
             "pins.sql": no_psql(pins_sql(fee_rules), "pins"),
             "apply.sql": apply_script(link_rules, fee_rules, digests),
             "rollback.sql": rollback_script()}
    files.update(dry_run_queries(link_rules, fee_rules))
    files.update(summary_queries())
    files.update(verify_queries(link_rules, fee_rules))
    for name, sql in files.items():
        for ch in sql:
            assert ch != "\x00", name
    bundle = {
        "format": FORMAT,
        "inputs": inputs,
        "digests": digests,
        "file_sha256": {k: hashlib.sha256(v.encode("utf-8")).hexdigest() for k, v in sorted(files.items())},
        "files": dict(sorted(files.items())),
        "link_rules": [dict(zip(LINK_FIELDS, r)) for r in link_rows],
        "fee_rules": [dict(zip(FEE_FIELDS, r)) for r in fee_rows],
    }
    text = json.dumps(bundle, ensure_ascii=True, sort_keys=False, separators=(",", ":"), indent=None) + "\n"
    assert "\\u0000" not in text
    return text, bundle


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verified-only", action="store_true")
    ap.add_argument("--expected", help="TSV rule_id<TAB>expected (test only)")
    ap.add_argument("--out", default=os.path.join(HERE, "dbtool"))
    a = ap.parse_args()
    override = {}
    if a.expected:
        for line in open(a.expected, encoding="utf-8"):
            if line.strip():
                k, v = line.rstrip("\n").split("\t")
                override[k] = int(v)
    link_rules, _ = g.load_links(override)
    fee_rules, _, by_field = g.load_fees(None, a.verified_only)
    inputs = {"fees_csv_sha256": g.sha256(g.FEES_CSV), "links_csv_sha256": g.sha256(g.LINKS_CSV),
              "verified_only": a.verified_only, "expected_override": bool(override),
              "link_rules": len(link_rules), "fee_rules": len(fee_rules), "fee_fields": len(by_field)}
    text, bundle = build(link_rules, fee_rules, inputs)
    os.makedirs(a.out, exist_ok=True)
    g.write(os.path.join(a.out, "bundle.json"), text)
    g.write(os.path.join(a.out, "call-1-bootstrap.sql"), CALL1)
    g.write(os.path.join(a.out, "call-2-unpack.sql"), CALL2)
    g.write(os.path.join(a.out, "CALLS.md"), CALLS_MD % "\n".join(
        "- `%s` %s" % (k, v) for k, v in bundle["file_sha256"].items()))
    print("bundle %s: %d bytes, sha256 %s; link rules %d, fee rules %d on %d fields (verified_only=%s)" % (
        os.path.join(a.out, "bundle.json"), len(text.encode()), hashlib.sha256(text.encode()).hexdigest(),
        len(link_rules), len(fee_rules), len(by_field), a.verified_only), file=sys.stderr)


if __name__ == "__main__":
    main()
