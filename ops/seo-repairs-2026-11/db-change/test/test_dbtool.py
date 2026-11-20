#!/usr/bin/env python3
"""Equivalence test: the database-tool mode (dbtool.py) against the tested psql package (generate.py).

Started by test.sh after test_repair.py, on the same throwaway cluster. For each fee-rule set (all FIX rules, and
--verified-only, the set production uses) it builds the fixtures of test_repair.py twice, in database A and database B,
then runs the same scenario on both:

  A: the psql package exactly as RUNBOOK.md runs it (P1 pin files, generate.py --pins, dry-run.sql, apply.sql,
     rollback.sql), via psql -f;
  B: the database-tool mode exactly as RUNBOOK-dbtool.md runs it: call-1-bootstrap.sql, call-2-unpack.sql and the
     one-line calls of CALLS.md, each sent as ONE simple-query string (psql -c), as the Supabase database tool does,
     with a stand-in for pg_net that serves bundle.json from a table.

It then requires: the same pin set sha256; the same dry-run rows in every section; byte-identical field values after
apply, after a second apply and after rollback; the same change-log, backup and skip-log rows. B is also checked on its
own: the refusals (unreviewed pins, tampered stage tables, wrong bundle sha256, a second pin read, a second load while
pins exist), the privileges of the private schema, and verify.
"""
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, PKG)
import test_repair as tr  # noqa: E402
import generate as g      # noqa: E402

WORK = os.environ.get("SEO_TEST_WORK", "/tmp/seo_repair_test_work") + "-dbtool"
DBTOOL = os.path.join(PKG, "dbtool.py")
URL = "https://raw.githubusercontent.com/derekbowen/fresh-web-702e04c3/%s/ops/seo-repairs-2026-11/db-change/dbtool/bundle.json"
PASSED = []

NET_STUB = r"""
create schema net;
create table net._http_response (id bigint primary key, status_code int, content_type text, headers jsonb,
  content text, timed_out boolean, error_msg text, created timestamptz not null default now());
create table net.test_files (url text primary key, content text not null);
create sequence net.req_seq;
create function net.http_get(url text, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb,
                             timeout_milliseconds integer default 5000) returns bigint language plpgsql as $f$
declare i bigint := nextval('net.req_seq'); f text;
begin
  select t.content into f from net.test_files t where t.url = http_get.url;
  insert into net._http_response (id, status_code, content, timed_out)
  values (i, case when f is null then 404 else 200 end, f, false);
  return i;
end
$f$;
"""


def log(*a):
    print(*a, flush=True)


def check(cond, msg):
    if not cond:
        log("FAIL: " + msg)
        sys.exit(1)
    PASSED.append(msg)
    log("ok   " + msg)


def run(db, args, sql=None, file=None, expect_fail=False):
    return tr.psql(args, sql=sql, file=file, db=db, expect_fail=expect_fail)


def q(db, sql):
    return run(db, ["-q", "-A", "-t", "-F", "\t"], sql=sql).stdout.rstrip("\n")


def call(db, sql, expect_fail=False):
    """one database-tool call: the whole text as one simple query (psql -c), no meta-commands"""
    assert not any(l.lstrip().startswith("\\") for l in sql.split("\n"))
    return run(db, ["-q", "-A", "-t", "-F", "\t"], sql=sql, expect_fail=expect_fail)


def qjson(db, name):
    out = call(db, "begin; set transaction read only; select x::text from seo_repair.q('%s') x; commit;" % name).stdout
    return [json.loads(l) for l in out.split("\n") if l.startswith("{")]


def state(db):
    out = {}
    for t, cols in tr.TEXT_COLS.items():
        sel = ", ".join("coalesce(replace(encode(convert_to(%s, 'UTF8'), 'base64'), E'\\n', ''), '~NULL~')" % c
                        for c in cols)
        for line in q(db, "select id, %s from public.%s order by id" % (sel, t)).split("\n"):
            if not line:
                continue
            parts = line.split("\t")
            for c, v in zip(cols, parts[1:]):
                out[(t, parts[0], c)] = None if v == "~NULL~" else base64.b64decode(v).decode("utf-8")
    return out


def logs(db, schema):
    cl = q(db, "select rule_id, table_name, row_id, column_name, old_md5, new_md5, occurrences, "
               "(rolled_back_at is not null) from %s.seo_repair_change_log "
               "order by table_name, row_id, column_name, id" % schema)
    bk = q(db, "select table_name, row_id, column_name, old_md5, md5(old_value), (old_updated_at is not null) "
               "from %s.seo_repair_backup_20261115 order by 1, 2, 3, 4" % schema)
    sk = q(db, "select rule_id, table_name, row_id, column_name, reason from %s.seo_repair_skip_log "
               "order by 1, 2, 3, 4, 5" % schema)
    return cl, bk, sk


def psql_sections(text):
    """unaligned psql output (-A, tab) -> {title: [dict row]}"""
    out, cur, hdr = {}, None, None
    for line in text.split("\n"):
        m = re.match(r"^=== (.*) ===$", line)
        if m:
            cur, hdr = m.group(1), None
            out[cur] = []
            continue
        if cur is None or not line or re.match(r"^\(\d+ rows?\)$", line):
            continue
        if hdr is None:
            hdr = line.split("\t")
            continue
        out[cur].append(dict(zip(hdr, line.split("\t"))))
    return out


def norm(v):
    if v is None:
        return ""
    if v is True:
        return "t"
    if v is False:
        return "f"
    return str(v)


def bag(rows):
    return sorted(json.dumps({k: norm(v) for k, v in r.items()}, sort_keys=True) for r in rows)


DRY = {"dry_preflight_columns": "preflight: columns this change writes (must be text), ids (must be uuid), updated_at",
       "dry_preflight_triggers": "preflight: triggers that will fire on update",
       "dry_links": "link rules: fields per rule today (verdict uses the same count guard as apply.sql)",
       "dry_links_insurance": "link fields left alone for Derek: the link sits in a paragraph or list item about insurance/liability/coverage/claims/damage",
       "dry_links_field_guard": "link fields the field guard will skip (changed since the pin read, or not in it)",
       "dry_fees_summary": "fee rules: summary",
       "dry_fees_not_applying": "fee rules that would not apply today (none listed = all apply)"}


def scenario(variant):
    verified = variant == "verified-only"
    extra = ["--verified-only"] if verified else []
    w = os.path.join(WORK, variant)
    os.makedirs(w)
    log("\n######## variant: %s fee rules" % variant)
    g0 = os.path.join(w, "gen")
    log("   " + tr.gen(g0, *extra))
    rules = tr.manifest(os.path.join(g0, "rules-manifest.csv"))
    rows, expect, expected_rows, hand, fee_fields, dup_key, dup_rule, pin_key, fee_by_rule, hid = tr.build_fixtures(rules)
    exp_file = os.path.join(w, "expected.tsv")
    with open(exp_file, "w") as f:
        for k, v in sorted(expected_rows.items()):
            f.write("%s\t%d\n" % (k, v))
    # the bundle B fetches (fixture expected counts, same rule set)
    bdir = os.path.join(w, "dbtool")
    p = subprocess.run([sys.executable, DBTOOL, "--out", bdir, "--expected", exp_file] + extra, capture_output=True, text=True)
    check(p.returncode == 0, "dbtool.py built the bundle: " + p.stderr.strip().split("\n")[-1])
    bundle = open(os.path.join(bdir, "bundle.json"), encoding="utf-8").read()
    bsha = hashlib.sha256(bundle.encode("utf-8")).hexdigest()
    check(all(ord(ch) < 128 for ch in bundle), "bundle.json is ASCII (no encoding step between GitHub and the database)")
    fake_commit = "0" * 40
    url = URL % fake_commit
    call1 = open(os.path.join(bdir, "call-1-bootstrap.sql")).read().replace("__COMMIT__", fake_commit) \
        .replace("__BUNDLE_SHA256__", bsha)
    call2 = open(os.path.join(bdir, "call-2-unpack.sql")).read()
    calls = open(os.path.join(bdir, "CALLS.md")).read()

    def cmd(step):
        m = re.search(r"^\| %s \| `([^`]+)`" % re.escape(step), calls, re.M)
        assert m, step
        return m.group(1)
    PINS, APPLY, ROLLBACK = cmd("3 pin read (P1)"), cmd("6 apply"), None
    ROLLBACK = re.search(r"then `([^`]+)` and `rollback_summary", calls).group(1)
    MARK = cmd("5 mark reviewed")

    log("== load identical fixtures into A (psql package) and B (database-tool mode)")
    fx = os.path.join(w, "fixtures.sql")
    open(fx, "w", encoding="utf-8").write(tr.fixture_sql(rows))
    A, B = "seo_dbt_a", "seo_dbt_b"
    for db in (A, B):
        run("postgres", [], sql="drop database if exists %s" % db)
        run("postgres", [], sql="create database %s" % db)
        run(db, ["-q"], file=os.path.join(HERE, "fixture-schema.sql"))
        run(db, ["-q"], file=fx)
    run(B, ["-q"], sql=NET_STUB)
    bf = os.path.join(w, "serve-bundle.sql")
    assert "$bundle$" not in bundle
    open(bf, "w", encoding="utf-8").write("insert into net.test_files (url, content) values ('%s', $bundle$%s$bundle$);\n"
                                          % (url, bundle))
    run(B, ["-q"], file=bf)
    check(state(A) == state(B), "A and B hold the same %d fixture fields" % len(state(A)))

    log("== B: a wrong bundle sha256 is refused and loads nothing")
    call(B, call1.replace(bsha, "0" * 64))
    p = call(B, call2, expect_fail=True)
    check("is not the expected one" in p.stderr, "call 2 refused a bundle whose sha256 differs from the one in call 1")
    check(q(B, "select count(*) from information_schema.tables where table_schema = 'seo_repair' and table_name like 'stage_%'") == "1",
          "nothing but stage_meta exists after the refused load")

    log("== bootstrap + unpack (B)")
    out = call(B, call1).stdout
    check("bundle_request" in out and bsha in out, "call 1 queued the fetch and recorded the expected sha256")
    out = call(B, call2).stdout
    meta = dict(l.split("\t", 1) for l in out.split("\n") if "\t" in l)
    check(meta.get("staged_link_rules") == str(sum(1 for r in rules if r["kind"] == "link")) and
          meta.get("staged_fee_rules") == str(sum(1 for r in rules if r["kind"] == "fee")),
          "call 2 staged %s link and %s fee rules (= the manifest)" % (meta.get("staged_link_rules"), meta.get("staged_fee_rules")))
    bj = json.loads(bundle)
    check(meta.get("staged_rules_digest") == "%s / %s" % (bj["digests"]["link_rules"], bj["digests"]["fee_rules"]),
          "staged rules digest equals the generator's (field-by-field, recomputed in SQL)")
    for role in ("anon", "authenticated", "service_role"):
        pr = q(B, "select bool_or(has_table_privilege('%s', c.oid, 'select,insert,update,delete')) from pg_class c "
                  "join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'seo_repair' and c.relkind = 'r'" % role)
        su = q(B, "select has_schema_privilege('%s', 'seo_repair', 'usage')" % role)
        fx_ = q(B, "select bool_or(has_function_privilege('%s', p.oid, 'execute')) from pg_proc p "
                   "join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'seo_repair'" % role)
        check(pr == "f" and su == "f" and fx_ == "f", "%s: no usage of schema seo_repair, no table or function privilege" % role)

    log("== P1 pins: A reads the 13 psql pin files, B runs pins.sql")
    pins_dir = os.path.join(w, "pins")
    os.makedirs(pins_dir)
    for fn in sorted(os.listdir(os.path.join(g0, "pending"))):
        if not fn.startswith("p1_"):
            continue
        p = run(A, ["-q", "-A", "-t", "-F", "\t", "-1"], file=os.path.join(g0, "pending", fn))
        open(os.path.join(pins_dir, fn.replace(".sql", ".tsv")), "w").write(p.stdout)
    pins = g.load_pins([pins_dir])
    call(B, PINS)
    bpin = q(B, "select v from seo_repair.stage_meta where k = 'pin_set_sha256'")
    check(bpin == g.pins_digest(pins), "pin set sha256 identical: psql P1 files %s = in-database pin read %s (%d pins)"
          % (g.pins_digest(pins)[:12], bpin[:12], len(pins)))
    p = call(B, PINS, expect_fail=True)
    check("pins were already read" in p.stderr, "a second pin read is refused")
    p = call(B, call2, expect_fail=True)
    check("pins were already read for the staged rules" in p.stderr, "loading a bundle again while pins exist is refused")

    log("== the same three edits after the pin read, in both")
    t, rid, col = pin_key
    h9 = "Created after the pin read: [FAQ](/faq).\n"
    for db in (A, B):
        run(db, ["-q"], sql="update public.%s set %s = %s || ' Edited after the pin was read.' where id = '%s'" % (t, col, col, rid))
        run(db, ["-q"], sql="update public.content_pages set body_markdown = body_markdown || 'Edited after the pin.' where id = '%s'" % hid("h8"))
        run(db, ["-q"], sql="insert into public.content_pages (id, slug, title, body_markdown) values ('%s', 'fixture-h9-new-after-pin', 'h9', %s)"
            % (hid("h9"), tr.dq(h9)))
    expect[pin_key] = rows[(t, rid)]["cols"][col] + " Edited after the pin was read."
    expect[("content_pages", hid("h8"), "body_markdown")] = rows[("content_pages", hid("h8"))]["cols"]["body_markdown"] + "Edited after the pin."
    expect[("content_pages", hid("h9"), "body_markdown")] = h9
    s0 = state(A)
    check(s0 == state(B), "A and B identical before apply")

    g1 = os.path.join(w, "gen-pinned")
    tr.gen(g1, "--pins", pins_dir, "--expected", exp_file, *extra)

    log("== dry run: every section, A (psql -A) against B (seo_repair.q)")
    da = psql_sections(run(A, ["-A", "-F", "\t", "-1"], file=os.path.join(g1, "dry-run.sql")).stdout)
    for name, title in DRY.items():
        rb = qjson(B, name + ".sql")
        ra = da[title]
        same = bag(ra) == bag(rb)
        if not same:
            sa, sb = set(bag(ra)), set(bag(rb))
            for x in sorted(sa - sb)[:3]:
                log("   only A: " + x[:400])
            for x in sorted(sb - sa)[:3]:
                log("   only B: " + x[:400])
        check(same, "dry run %s: %d rows, identical in A and B" % (name, len(ra)))
    check(all(r["verdict"] == "ok" for r in da[DRY["dry_links"]]), "every link verdict ok (fixture counts)")
    dp = qjson(B, "dry_pins.sql")[0]
    check(dp["pin_set_sha256"] == dp["pin_set_sha256_now"] == bpin and dp["fee_rules_without_pin"] == 0,
          "dry_pins: pin set unchanged since the pin read, every fee rule pinned")
    check(state(A) == s0 == state(B), "the dry runs changed nothing")

    log("== B: apply refuses until the pin set is marked reviewed, and refuses tampered stage tables")
    p = call(B, APPLY, expect_fail=True)
    check("has not been marked reviewed" in p.stderr and state(B) == s0, "apply without the review mark: refused, nothing changed")
    check(q(B, "select to_regclass('seo_repair.seo_repair_change_log') is null") == "t", "  ... and no log table was created")
    call(B, MARK.replace("<pin_set_sha256 from dry_pins>", bpin))
    for tamper, undo, msg in (
            ("update seo_repair.stage_link_rules set dest = '/p/elsewhere' where rule_id = (select min(rule_id) from seo_repair.stage_link_rules where action = 'REWRITE')",
             None, "staged link rule changed"),
            ("update seo_repair.stage_pins set md5 = md5('x') where (t, rid, col) = (select t, rid, col from seo_repair.stage_pins order by 1, 2, 3 limit 1)",
             None, "staged pin changed")):
        snap = q(B, "select string_agg(md5(x::text), ',' order by x::text) from (select * from seo_repair.stage_link_rules) x") + \
            q(B, "select string_agg(md5(x::text), ',' order by x::text) from (select * from seo_repair.stage_pins) x")
        run(B, ["-q"], sql="create table public._undo_l as select * from seo_repair.stage_link_rules; "
                           "create table public._undo_p as select * from seo_repair.stage_pins;")
        run(B, ["-q"], sql=tamper)
        p = call(B, APPLY, expect_fail=True)
        check(("staged rules are not the rules" in p.stderr or "staged pins changed" in p.stderr) and state(B) == s0,
              "apply refused (%s), nothing changed" % msg)
        run(B, ["-q"], sql="delete from seo_repair.stage_link_rules; insert into seo_repair.stage_link_rules select * from public._undo_l; "
                           "delete from seo_repair.stage_pins; insert into seo_repair.stage_pins select * from public._undo_p; "
                           "drop table public._undo_l, public._undo_p;")
        check(snap == q(B, "select string_agg(md5(x::text), ',' order by x::text) from (select * from seo_repair.stage_link_rules) x") +
              q(B, "select string_agg(md5(x::text), ',' order by x::text) from (select * from seo_repair.stage_pins) x"),
              "  stage tables restored for the next step")
    run(B, ["-q"], sql="update seo_repair.stage_file set content = content || ' ' where name = 'apply.sql'")
    p = call(B, APPLY, expect_fail=True)
    check("does not match its sha256" in p.stderr and state(B) == s0, "a modified staged script is refused")
    run(B, ["-q"], sql="update seo_repair.stage_file set content = left(content, length(content) - 1) where name = 'apply.sql'")

    log("== apply: A (psql apply.sql) and B (seo_repair.run('apply.sql'))")
    run(A, [], file=os.path.join(g1, "apply.sql"))
    call(B, APPLY)
    s1 = state(A)
    check(s1 == state(B), "after apply, A and B hold byte-identical values in all %d fields" % len(s1))
    changed = {k for k in s1 if s1[k] != s0[k]}
    want = {k for k, v in expect.items() if v != s0[k]}
    if not verified:
        check(changed == want and all(s1[k] == expect[k] for k in want),
              "B changed exactly the %d expected fields, each to its expected value" % len(want))
    else:
        # the fixtures carry every fee anchor (verified or not); only the verified rules may act
        man_fee = {r["rule_id"] for r in rules if r["kind"] == "fee"}
        logged = set(q(B, "select distinct rule_id from seo_repair.seo_repair_change_log where rule_id like 'F14-%'").split("\n")) - {""}
        skipped = set(q(B, "select distinct rule_id from seo_repair.seo_repair_skip_log where rule_id like 'F14-%'").split("\n")) - {""}
        check(changed <= want, "B changed only fields the fixtures expect to change (%d of %d)" % (len(changed), len(want)))
        check(logged <= man_fee and man_fee <= logged | skipped,
              "only verified fee rules changed text (%d applied, %d skipped, 0 unverified)" % (len(logged), len(man_fee - logged)))
    nchg = len(changed)
    la, lb = logs(A, "public"), logs(B, "seo_repair")
    check(la[0] == lb[0] and la[0], "change logs identical (%d rows)" % len(la[0].split("\n")))
    check(la[1] == lb[1] and la[1], "backups identical (%d rows, same old values)" % len(la[1].split("\n")))
    check(la[2] == lb[2], "skip logs identical (%d rows)" % len(la[2].split("\n")))
    check(q(B, "select to_regclass('public.seo_repair_change_log') is null and to_regclass('public.seo_repair_backup_20261115') is null") == "t",
          "B created no seo_repair table in public (backups live in the private schema)")
    for role in ("anon", "authenticated", "service_role"):
        pr = q(B, "select bool_or(has_table_privilege('%s', c.oid, 'select,insert,update,delete,truncate')) from pg_class c "
                  "join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'seo_repair' and c.relkind = 'r'" % role)
        check(pr == "f", "%s holds no privilege on any seo_repair table after apply (backup and logs included)" % role)
    tot = qjson(B, "apply_totals.sql")[0]
    check(tot["fields_changed"] == nchg == tot["backups_written"], "apply_totals: %d fields changed, %d backups"
          % (tot["fields_changed"], tot["backups_written"]))
    vt = qjson(B, "verify_totals.sql")[0]
    check(vt["repaired_fields"] == vt["unchanged_since_repair"] == nchg and not qjson(B, "verify_changed.sql"),
          "verify right after apply: %d repaired fields, 0 changed since" % nchg)
    ar = {r["rule_id"]: r for r in qjson(B, "apply_rules.sql")}
    check(len(ar) == len(rules), "apply_rules lists every rule (%d)" % len(ar))

    log("== second apply: nothing changes in either")
    run(A, [], file=os.path.join(g1, "apply.sql"))
    call(B, APPLY)
    check(state(A) == s1 == state(B), "second apply changed nothing")
    la2, lb2 = logs(A, "public"), logs(B, "seo_repair")
    check(la2[0] == la[0] and lb2[0] == lb[0] and la2[1] == la[1] and lb2[1] == lb[1],
          "second apply wrote no change-log or backup row")
    check(la2[2] == lb2[2], "skip logs still identical after the second apply")

    log("== a person edits one repaired field; rollback in both")
    t, rid, col, _ = hand["h1"]
    for db in (A, B):
        run(db, ["-q"], sql="update public.%s set %s = %s || 'Edited by a person after the repair.' where id = '%s'" % (t, col, col, rid))
    ch = qjson(B, "verify_changed.sql")
    check(len(ch) == 1 and ch[0]["slug"] == "fixture-h1-markdown-forms", "verify_changed reports the one edited field")
    s_e = state(A)
    call(B, "insert into seo_repair.stage_meta (k, v) values ('rollback_only_run', 'apply-20000101T000000Z-1') "
            "on conflict (k) do update set v = excluded.v, at = now();")
    call(B, ROLLBACK)
    check(state(B) == s_e, "rollback limited to a run that does not exist restores nothing")
    call(B, "insert into seo_repair.stage_meta (k, v) values ('rollback_only_run', '') "
            "on conflict (k) do update set v = excluded.v, at = now();")
    run(A, [], file=os.path.join(g0, "rollback.sql"))
    call(B, ROLLBACK)
    s2 = state(A)
    check(s2 == state(B), "after rollback, A and B identical")
    check({k for k in s2 if s2[k] != s0[k]} == {(t, rid, col)}, "rollback restored every field except the person's edit")
    rs = {r["status"]: r["fields"] for r in qjson(B, "rollback_summary.sql")}
    check(rs.get("restored") == nchg - 1 and rs.get("skipped") == 1, "rollback_summary: %s" % rs)
    check(logs(A, "public")[0] == logs(B, "seo_repair")[0], "change logs identical after rollback (rolled_back_at set alike)")

    log("== apply again after the rollback")
    run(A, [], file=os.path.join(g1, "apply.sql"))
    call(B, APPLY)
    check(state(A) == state(B), "re-apply: A and B identical")
    check(logs(A, "public")[1] == logs(B, "seo_repair")[1], "re-apply: backups identical, not duplicated")


def main():
    if os.path.isdir(WORK):
        shutil.rmtree(WORK)
    os.makedirs(WORK)
    log("== database-tool mode equivalence test")
    for variant in ("all", "verified-only"):
        scenario(variant)
    log("\nALL %d DBTOOL CHECKS PASSED" % len(PASSED))


if __name__ == "__main__":
    main()
