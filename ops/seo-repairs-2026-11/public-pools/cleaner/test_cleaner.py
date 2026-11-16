#!/usr/bin/env python3
"""Local test of dry-run.sql / apply.sql / rollback.sql on a throwaway PostgreSQL 16 cluster.

    python3 -I cleaner/test_cleaner.py            # writes ../test-output.txt, exits non-zero on any failure

No network, no production access. The cluster (pglocal.py) runs as the unprivileged user `postgres`, keeps its
data under /tmp, listens on a Unix socket on port 55441 only, and is stopped and deleted at the end.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import compare  # noqa: E402
import pglocal  # noqa: E402
import reference as R  # noqa: E402
import surrogate as S  # noqa: E402

T = R.T
LOG = []
FAILS = []


def log(msg=""):
    print(msg, flush=True)
    LOG.append(msg)


def check(name, ok, detail=""):
    log(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" -- {detail}" if detail else ""))
    if not ok:
        FAILS.append(name)
    return ok


TEXT_COLS = {"pp_pools": ["ai_best_for", "ai_description", "ai_faqs"], "pp_cities": ["ai_intro", "ai_faqs"]}


def snapshot(cl, db):
    """{(tbl,id,col): text} for the cleaned columns + {(tbl,id,'_rest'): md5 of every other column}."""
    snap = {}
    for tbl, cols in TEXT_COLS.items():
        sel = ", ".join(f"coalesce({c}::text, '\\N')" for c in cols)
        rest = "md5((to_jsonb(t) - " + " - ".join(f"'{c}'" for c in cols) + ")::text)"
        for r in cl.rows(db, f"select id::text, {rest}, {sel} from public.{tbl} t;"):
            rid, rmd5, vals = r[0], r[1], r[2:]
            snap[(tbl, rid, "_rest")] = rmd5
            for c, v in zip(cols, vals):
                snap[(tbl, rid, c)] = None if v == "\\N" else v
    return snap


def table_md5(cl, db, table):
    r = cl.rows(db, f"select to_regclass('{table}') is not null;")
    if r[0][0] != "t":
        return None
    return cl.rows(db, f"select md5(coalesce(string_agg(t::text, E'\\n' order by t::text), '')) from {table} t;")[0][0]


def run_file(cl, db, fname, args=(), single=False):
    path = cl.copy_in(os.path.join(OUT, fname))
    a = ["-v", "ON_ERROR_STOP=1"] + (["--single-transaction"] if single else []) + list(args) + ["-f", path]
    t0 = time.time()
    r = cl.psql(db, a)
    return r, time.time() - t0


def parse_guard(out):
    m = re.findall(r"^\s*(\d+)\s*\|\s*([0-9a-f]{32})\s*$", out, re.M)
    return (int(m[-1][0]), m[-1][1]) if m else (None, None)


def load(cl, db, cities, pools):
    cl.createdb(db)
    cl.sql(db, open(os.path.join(HERE, "schema.sql"), encoding="utf-8").read())
    cl.sql(db, S.insert_sql(cities, pools))


def merges_by_city():
    m = {}
    for url, n in T._dup_merges(os.path.join(OUT, "duplicate-mapping.csv")).items():
        seg = url.rstrip("/").split("/")
        m[(seg[-2], seg[-1])] = n
    return m


def answers_text(v):
    try:
        arr = json.loads(v)
    except (TypeError, ValueError):
        return v or ""
    return "\n".join(e["a"] for e in arr if isinstance(e, dict) and isinstance(e.get("a"), str))


API_ROLES = ("anon", "authenticated", "service_role")
ROLES_SQL = """do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;"""
# what Supabase does in schema public: every new table/sequence is granted to the API roles
DEFAULT_PRIVS_SQL = ("alter default privileges in schema public grant all on tables to anon, authenticated, service_role;\n"
                     "alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;")
TRIGGER_SQL = """create function public.test_touch() returns trigger language plpgsql as $f$
begin new.updated_at := now(); return new; end $f$;
create trigger pp_pools_touch before update on public.pp_pools for each row execute function public.test_touch();
create trigger pp_cities_touch before update on public.pp_cities for each row execute function public.test_touch();"""


def api_privileges(cl, db):
    """[(role, table, privilege)] that an API role still holds on the backup / log tables."""
    q = ("select r.rolname, t.tbl, p.priv from pg_roles r cross join (values ('public.seo_repair_pp_backup_20261115'), "
         "('public.seo_repair_pp_change_log')) t(tbl) cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), "
         "('TRUNCATE')) p(priv) where r.rolname in ('anon', 'authenticated', 'service_role') "
         "and has_table_privilege(r.oid, t.tbl, p.priv) order by 1, 2, 3;")
    return cl.rows(db, q)


def founder_sql(cl, db):
    q = ("set jit = off;\nset enable_nestloop = off;\nwith " + compare.core_text() + """
select f.tbl, f.rid::text, f.col, f3.s from fin f
  join f3 on f3.tbl = f.tbl and f3.rid = f.rid and f3.col = f.col and f3.ent = f.ent and f3.k = f.k
 where f.keep and f3.kind = 'singular' and f3.is_founder;""")
    return sorted(tuple(r) for r in cl.rows(db, q))


def founder_reference(cities, pools, merges):
    """The same list from reference.py: founder-class sentences in the text each field has AFTER the plan."""
    plan = compare.reference_plan(cities, pools, merges)
    out = []

    def scan(tbl, rid, col, val):
        new = plan.get((tbl, rid, col), {}).get("new")
        val = new if new is not None else val
        if val is None:
            return
        texts = ([e["a"] for e in val if T._plain_entry(e)] if col == "ai_faqs" else [val])
        for t in texts:
            for x in T.split_sentences(t):
                if T.is_narrator(x) == "singular" and re.search(T.FOUNDER, x):
                    out.append((tbl, rid, col, x))
    for p in pools:
        if p.get("is_published"):
            scan("pp_pools", p["id"], "ai_description", p.get("ai_description"))
            if isinstance(p.get("ai_faqs"), list):
                scan("pp_pools", p["id"], "ai_faqs", p["ai_faqs"])
    for c in cities:
        if c.get("is_published"):
            scan("pp_cities", c["id"], "ai_intro", c.get("ai_intro"))
            if isinstance(c.get("ai_faqs"), list):
                scan("pp_cities", c["id"], "ai_faqs", c["ai_faqs"])
    return sorted(out)


def main():
    fx = json.load(open(os.path.join(HERE, "fixtures.json"), encoding="utf-8"))
    cities, pools = fx["cities"], fx["pools"]
    merges = merges_by_city()
    log("Public-pools text cleaner: local test")
    log(f"run at {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
    log(f"fixtures: {fx['real_text_rows']} real rows (live pages of 2026-11-16, seed {fx['seed']}), "
        f"{sum(1 for p in pools if p.get('synthetic') and not p.get('is_placeholder'))} synthetic pool rows, "
        f"{sum(1 for c in cities if c.get('synthetic') and c.get('ai_intro'))} synthetic city rows, "
        f"{len(pools)} pool rows / {len(cities)} city rows in total (incl. text-less placeholders), "
        f"{len(fx['must_keep'])} must-keep sentences")

    # ---------------------------------------------------------------- 0. static checks
    log("\n== 0. generated files")
    core = compare.core_text()
    md5 = hashlib.md5(core.encode()).hexdigest()
    for f in ("dry-run.sql", "apply.sql"):
        txt = open(os.path.join(OUT, f), encoding="utf-8").read()
        blocks = re.findall(r"-- >>> CORE BEGIN \(md5 of the core text: ([0-9a-f]{32})\)\n(.*?)-- <<< CORE END", txt, re.S)
        check(f"{f}: every embedded core is byte-identical to cleaner/core.sql (md5 {md5})",
              len(blocks) > 0 and all(b[0] == md5 and b[1] == core for b in blocks), f"{len(blocks)} copies")
    dr = open(os.path.join(OUT, "dry-run.sql"), encoding="utf-8").read()
    stmts = [ln for ln in dr.splitlines() if ln.strip() and not ln.startswith("--")]
    check("dry-run.sql: first statement is 'set transaction read only;'", stmts[0] == "set transaction read only;")
    body = re.sub(r"-- >>> CORE BEGIN.*?-- <<< CORE END", "", dr, flags=re.S)
    bad = re.findall(r"(?im)^\s*(insert|update|delete|create|alter|drop|truncate|grant|merge|copy)\b", body)
    check("dry-run.sql: no write statement outside SELECT", not bad, str(bad))
    code = "\n".join(ln.split("--")[0] for ln in core.splitlines())   # comments removed
    check("core: no procedural language, function or extension needed",
          not re.search(r"(?i)(\blanguage\b|\bdo\s+\$|plpgsql|create\s+(extension|function|procedure))", code))

    cl = pglocal.Cluster(port=55441).start()
    try:
        ver = cl.rows("postgres", "select current_setting('server_version'), (select datcollate||'/'||datctype from pg_database where datname='postgres');")[0]
        log(f"local cluster: PostgreSQL {ver[0]}, collate/ctype {ver[1]}, data dir under {cl.root}, port {cl.port}, "
            f"run as user '{pglocal.RUN_AS}'")
        cl.sql("postgres", ROLES_SQL)

        # ---------------------------------------------------------------- 0b. whitespace class
        log("\n== 0b. whitespace: the explicit class WS (used instead of \\s) matches the same code points in Python and SQL")
        py_ws = [c for c in range(0x110000) if not 0xD800 <= c <= 0xDFFF and re.match(r"\s", chr(c))]
        py_ws2 = [c for c in range(0x110000) if not 0xD800 <= c <= 0xDFFF and re.match(T.WS, chr(c))]
        check("Python: WS matches exactly the code points of \\s", py_ws == py_ws2, f"{len(py_ws)} code points")
        cands = sorted(set(py_ws + [0x200B, 0x2060, 0xFEFF, 0x180E, 0x41, 0x2E, 0x5F]))
        vals = ", ".join(f"({c})" for c in cands)
        got = cl.rows("postgres", f"select c, chr(c) ~ {T.pg(T.WS)}, chr(c) ~ {T.pg(T.NOT_WS)}, chr(c) ~ '\\s' "
                                  f"from (values {vals}) v(c) order by c;")
        bad = [r[0] for r in got if (r[1] == "t") != (int(r[0]) in py_ws) or (r[2] == "t") == (int(r[0]) in py_ws)]
        pg_s = [hex(int(r[0])) for r in got if (r[3] == "t") != (int(r[0]) in py_ws)]
        check("PostgreSQL: WS / NOT_WS agree with Python on all 29 whitespace and 7 non-whitespace code points", not bad,
              f"(for the record, PostgreSQL's own \\s differs from Python's here at {', '.join(pg_s) or 'none'})")
        bad_pat = [k for k, v in vars(T).items() if k.isupper() and isinstance(v, str) and re.search(r"\\[sS]", v)]
        check("no rule pattern uses \\s or \\S (they use WS)", not bad_pat, str(bad_pat))

        # ---------------------------------------------------------------- 1. load fixtures
        log("\n== 1. load fixtures")
        cl.createdb("fx")
        cl.sql("fx", DEFAULT_PRIVS_SQL)    # as on Supabase: new public tables are granted to the API roles
        cl.sql("fx", open(os.path.join(HERE, "schema.sql"), encoding="utf-8").read())
        cl.sql("fx", S.insert_sql(cities, pools))
        before = snapshot(cl, "fx")
        log(f"loaded; {sum(1 for k in before if k[2] != '_rest')} text fields")
        pr = open(os.path.join(OUT, "PENDING-READS.md"), encoding="utf-8").read()
        pr7 = re.findall(r"```sql\n(.*?)```", pr[pr.index("## PR-7"):], re.S)[0]
        r = cl.psql("fx", ["-v", "ON_ERROR_STOP=1", "--single-transaction", "-x"], stdin=pr7)
        check("PENDING-READS PR-7 runs read-only on the fixture database", r.returncode == 0,
              " ".join(r.stdout.split())[:400] if r.returncode == 0 else r.stderr.strip()[-300:])

        # ---------------------------------------------------------------- 1b. missing variables
        log("\n== 1b. a missing required variable fails with a non-zero exit (never exit 0)")
        for f, args, want in (("apply.sql", [], "ABORT: pass -v run_id"),
                              ("apply.sql", ["-v", "run_id=x"], "ABORT: pass -v expected_changes"),
                              ("apply.sql", ["-v", "run_id=x", "-v", "expected_changes=1"], "ABORT: pass -v manifest_md5"),
                              ("rollback.sql", [], "ABORT: pass -v run_id"),
                              ("verify-live.sql", [], "ABORT: pass -v run_id")):
            r, _ = run_file(cl, "fx", f, args, single=f == "verify-live.sql")
            check(f"{f} {' '.join(args) or '(no variables)'}: exit {r.returncode} with '{want}'",
                  r.returncode == 3 and want in r.stderr, r.stderr.strip()[-160:])
        check("those runs changed nothing", snapshot(cl, "fx") == before)

        # ---------------------------------------------------------------- 2. dry run
        log("\n== 2. dry run")
        r, _ = run_file(cl, "fx", "dry-run.sql", single=False)
        check("dry-run without --single-transaction aborts at the read-only check",
              r.returncode != 0 and "ABORT: this transaction is not read-only" in r.stderr, r.stderr.strip()[-160:])
        r, secs = run_file(cl, "fx", "dry-run.sql", ["-v", "seed=test"], single=True)
        check("dry-run (read-only, single transaction) exits 0", r.returncode == 0, r.stderr.strip()[-400:])
        dry_out = r.stdout
        exp_n, man_md5 = parse_guard(dry_out)
        check("dry-run prints expected_changes and manifest_md5", exp_n is not None, f"{exp_n} {man_md5} ({secs:.1f}s)")
        check("dry-run wrote approved-manifest.csv", os.path.exists(os.path.join(cl.work, "approved-manifest.csv")))
        man_lines = open(os.path.join(cl.work, "approved-manifest.csv"), encoding="utf-8").read().splitlines()
        check("manifest rows = expected_changes", len(man_lines) - 1 == exp_n, f"{len(man_lines) - 1}")
        check("dry-run changed nothing", snapshot(cl, "fx") == before)
        check("dry-run created no table", table_md5(cl, "fx", "public.seo_repair_pp_change_log") is None
              and table_md5(cl, "fx", "public.seo_repair_pp_backup_20261115") is None)
        # the read-only measurement SQL of PENDING-READS (text-defects/text-defects-measure.sql) parses and runs
        mtext = open(os.path.join(OUT, "text-defects", "text-defects-measure.sql"), encoding="utf-8").read()
        stmts = [blk.split("\n", 1)[1].strip() for blk in re.split(r"(?m)^-- \[", mtext)[1:]]
        mres = [cl.psql("fx", ["-v", "ON_ERROR_STOP=1", "--single-transaction"], stdin=st) for st in stmts]
        check("text-defects-measure.sql: every statement runs read-only on the fixtures", len(stmts) == 2
              and all(m.returncode == 0 for m in mres) and snapshot(cl, "fx") == before,
              "; ".join(m.stderr.strip()[-160:] for m in mres if m.returncode != 0) or f"{len(stmts)} statements")

        # ---------------------------------------------------------------- 3. SQL plan = reference, = hand expectations
        log("\n== 3. SQL plan versus the Python reference and the hand-derived expectations")
        sq = compare.sql_plan(cl, "fx")
        ref = compare.reference_plan(cities, pools, merges)
        d = compare.diff(sq, ref)
        check("SQL plan equals reference.py on every fixture field (new text, rules, skip reasons)", not d,
              f"{len(sq)} planned/skipped fields; {len(d)} differences" + ("\n   " + "\n   ".join(d[:10]) if d else ""))
        n_changed = sum(1 for v in sq.values() if v["new"] is not None)
        check("plan changes = expected_changes of the dry run", n_changed == exp_n, f"{n_changed}")
        per_rule = {}
        for (tbl, rid, col), v in sq.items():
            for ru in (v["rules"].split("+") if v["rules"] else []):
                per_rule[ru] = per_rule.get(ru, 0) + 1
            for sk in v["skips"]:
                per_rule["skip " + sk] = per_rule.get("skip " + sk, 0) + 1
        for k in sorted(per_rule):
            log(f"     {per_rule[k]:4d}  {k}")
        miss = []
        for e in fx["expect"]:
            key = (e["tbl"], e["id"], e["col"])
            got = sq.get(key)
            got_new = None if got is None or got["new"] is None else (
                json.loads(got["new"]) if e["col"] == "ai_faqs" else got["new"])
            got_rules = got["rules"] if got else ""
            got_skips = got["skips"] if got else set()
            want_skips = set(s for s in (e.get("skip") or "").split("; ") if s)
            rf = ref.get(key)
            ref_new = rf["new"] if rf else None
            if got_new != e["new"] or got_rules != e["rules"] or got_skips != want_skips or ref_new != e["new"]:
                miss.append(f"{key[2]} {e['why'][:70]}: SQL={str(got_new)[:120]} rules={got_rules} skips={sorted(got_skips)}")
        check(f"all {len(fx['expect'])} hand-derived synthetic expectations hold (SQL and reference)", not miss,
              "\n   " + "\n   ".join(miss) if miss else "")

        # ---------------------------------------------------------------- 4. apply
        log("\n== 4. apply")
        r, secs = run_file(cl, "fx", "apply.sql", ["-v", "run_id=test-1", "-v", f"expected_changes={exp_n}",
                                                   "-v", f"manifest_md5={man_md5}"])
        check("apply exits 0", r.returncode == 0, (r.stderr.strip()[-600:] or f"{secs:.1f}s"))
        log("   " + "\n   ".join(ln for ln in r.stdout.splitlines() if ln.strip())[:3000])
        after = snapshot(cl, "fx")
        changed = {k for k in before if before[k] != after.get(k)}
        planned = {k for k, v in sq.items() if v["new"] is not None}
        check("apply changed exactly the planned fields (and no other column of any row)", changed == planned,
              f"changed {len(changed)}, planned {len(planned)}; unexpected {sorted(changed - planned)[:5]}, "
              f"missing {sorted(planned - changed)[:5]}")
        bad_val = [k for k in planned if (json.loads(after[k]) if k[2] == "ai_faqs" else after[k])
                   != (json.loads(sq[k]["new"]) if k[2] == "ai_faqs" else sq[k]["new"])]
        check("every changed field holds exactly the planned new value", not bad_val, str(bad_val[:5]))
        empty = []
        for k in planned:
            v = after[k]
            if k[2] == "ai_faqs":
                arr = json.loads(v)
                if not arr or any(isinstance(e, dict) and isinstance(e.get("a"), str) and not e["a"].strip() for e in arr):
                    empty.append(k)
            elif v is None or not v.strip():
                empty.append(k)
        check("no output field is empty (text non-blank; FAQ arrays non-empty, no blank answer)", not empty, str(empty[:5]))
        lost = []
        for m in fx["must_keep"]:
            v = after.get((m["tbl"], m["id"], m["col"]))
            hay = answers_text(v) if m["col"] == "ai_faqs" else (v or "")
            if m["s"] not in hay:
                lost.append(m)
        check(f"all {len(fx['must_keep'])} must-keep sentences are still present", not lost,
              "; ".join(f"{x['col']}: {x['s'][:80]}" for x in lost[:5]))
        bk = cl.rows("fx", "select tbl, row_id::text, col, old_md5, md5(old_value) = old_md5, old_value from public.seo_repair_pp_backup_20261115;")
        bk_ok = all(b[4] == "t" and (json.loads(b[5]) == json.loads(before[(b[0], b[1], b[2])]) if b[2] == "ai_faqs"
                                     else b[5] == before[(b[0], b[1], b[2])]) for b in bk)
        check("backup holds the full old value of every changed field", len(bk) == len(planned) and bk_ok,
              f"{len(bk)} backup rows")
        lg = cl.rows("fx", "select action, count(*) from public.seo_repair_pp_change_log where run_id='test-1' group by 1 order by 1;")
        log(f"   change log test-1: {lg}")
        check("change log has one 'applied' row per changed field",
              dict((a, int(n)) for a, n in lg).get("applied") == len(planned))
        backup_md5 = table_md5(cl, "fx", "public.seo_repair_pp_backup_20261115")
        privs = api_privileges(cl, "fx")
        check("backup and change log: anon / authenticated / service_role hold no privilege (default privileges "
              "granted ALL; apply revoked them)", not privs, str(privs[:6]))

        # ---------------------------------------------------------------- 5. second apply
        log("\n== 5. second apply (same manifest, new run id)")
        r, _ = run_file(cl, "fx", "apply.sql", ["-v", "run_id=test-2", "-v", f"expected_changes={exp_n}",
                                                "-v", f"manifest_md5={man_md5}"])
        check("second apply exits 0", r.returncode == 0, r.stderr.strip()[-600:])
        check("second apply changed no field", snapshot(cl, "fx") == after)
        check("second apply left the backup byte-identical", table_md5(cl, "fx", "public.seo_repair_pp_backup_20261115") == backup_md5)
        lg2 = dict((a, int(n)) for a, n in cl.rows("fx", "select action, count(*) from public.seo_repair_pp_change_log where run_id='test-2' group by 1;"))
        check("second apply logged 0 applied, every manifest row already_applied",
              "applied" not in lg2 and lg2.get("already_applied") == exp_n, str(lg2))
        again = {k: v for k, v in compare.sql_plan(cl, "fx").items() if v["new"] is not None}
        check("second apply logged every change the plan would make again as planned_not_in_manifest (not applied)",
              lg2.get("planned_not_in_manifest", 0) == len(again), f"{len(again)}")
        for k, v in sorted(again.items()):
            log(f"   would change again: {k[0]}.{k[2]} {v['rules']} row {k[1]}")
        r, _ = run_file(cl, "fx", "apply.sql", ["-v", "run_id=test-1", "-v", f"expected_changes={exp_n}",
                                                "-v", f"manifest_md5={man_md5}"])
        check("apply refuses a reused run_id", r.returncode != 0 and "already used" in r.stderr, r.stderr.strip()[-120:])

        # ---------------------------------------------------------------- 6. rollback with an edit after apply
        log("\n== 6. rollback (one field edited by hand after apply)")
        edit_key = next(k for k in sorted(planned) if k[2] == "ai_description")
        cl.sql("fx", f"update public.pp_pools set ai_description = ai_description || ' Edited by hand after apply.' "
                     f"where id = '{edit_key[1]}';")
        edited_val = snapshot(cl, "fx")[edit_key]
        r, secs = run_file(cl, "fx", "rollback.sql", ["-v", "run_id=test-1"])
        check("rollback with one field left unrestored commits the restores and then exits 3 with 'ROLLBACK INCOMPLETE'",
              r.returncode == 3 and "ROLLBACK INCOMPLETE" in r.stderr, r.stderr.strip()[-300:])
        log("   " + "\n   ".join(ln for ln in r.stdout.splitlines() if ln.strip())[:1500])
        rb = snapshot(cl, "fx")
        not_restored = [k for k in before if k != edit_key and rb.get(k) != before[k]]
        check("rollback restored every other field byte-identical to the original", not not_restored,
              str(not_restored[:5]))
        check("rollback skipped the field edited after apply (edit kept)", rb[edit_key] == edited_val)
        lg3 = dict((a, int(n)) for a, n in cl.rows("fx", "select action, count(*) from public.seo_repair_pp_change_log where run_id='test-1/rollback' group by 1;"))
        check("rollback logged the edited field as skipped and the rest as restored",
              lg3.get("rollback_skip_edited_after_apply") == 1 and lg3.get("restored") == len(planned) - 1, str(lg3))
        r, _ = run_file(cl, "fx", "rollback.sql", ["-v", "run_id=test-1"])
        check("a second rollback changes nothing (and still reports the unrestored field: exit 3)",
              r.returncode == 3 and "ROLLBACK INCOMPLETE" in r.stderr and snapshot(cl, "fx") == rb, r.stderr.strip()[-300:])

        # ---------------------------------------------------------------- 7. guards
        log("\n== 7. guards (fresh copy of the fixtures)")
        load(cl, "fx2", cities, pools)
        r, _ = run_file(cl, "fx2", "dry-run.sql", single=True)
        n2, md52 = parse_guard(r.stdout)
        b2 = snapshot(cl, "fx2")
        r, _ = run_file(cl, "fx2", "apply.sql", ["-v", "run_id=g-1", "-v", f"expected_changes={n2 + 1}", "-v", f"manifest_md5={md52}"])
        check("apply aborts when expected_changes does not match the manifest", r.returncode != 0 and "count guard" in r.stderr,
              r.stderr.strip()[-160:])
        r, _ = run_file(cl, "fx2", "apply.sql", ["-v", "run_id=g-2", "-v", f"expected_changes={n2}", "-v", "manifest_md5=" + "0" * 32])
        check("apply aborts when the manifest md5 differs", r.returncode != 0 and "manifest md5" in r.stderr, r.stderr.strip()[-160:])
        drift_key = next(k for k in sorted(planned) if k[2] == "ai_intro")
        cl.sql("fx2", f"update public.pp_cities set ai_intro = ai_intro || ' Edited after the dry run.' where id = '{drift_key[1]}';")
        b2d = snapshot(cl, "fx2")
        r, _ = run_file(cl, "fx2", "apply.sql", ["-v", "run_id=g-3", "-v", f"expected_changes={n2}", "-v", f"manifest_md5={md52}"])
        check("count guard: apply aborts when a planned field changed after the dry run (max_drift=0)",
              r.returncode != 0 and "drifted since the dry run" in r.stderr, r.stderr.strip()[-200:])
        check("aborted apply changed nothing and left no backup/log table",
              snapshot(cl, "fx2") == b2d and table_md5(cl, "fx2", "public.seo_repair_pp_change_log") is None)
        r, _ = run_file(cl, "fx2", "apply.sql", ["-v", "run_id=g-4", "-v", f"expected_changes={n2}", "-v", f"manifest_md5={md52}",
                                                  "-v", "max_drift=1"])
        check("with max_drift=1 apply proceeds", r.returncode == 0, r.stderr.strip()[-300:])
        a2 = snapshot(cl, "fx2")
        check("the drifted field was NOT overwritten", a2[drift_key] == b2d[drift_key])
        lg4 = cl.rows("fx2", f"select action from public.seo_repair_pp_change_log where run_id='g-4' and row_id='{drift_key[1]}' and col='ai_intro';")
        check("the drifted field is logged skip_changed_since_dry_run (and its new plan as planned_not_in_manifest), "
              "never 'applied'", ["skip_changed_since_dry_run"] in lg4 and ["applied"] not in lg4, str(lg4))
        others = {k for k in b2d if b2d[k] != a2.get(k)}
        check("every other planned field was applied", others == planned - {drift_key}, f"{len(others)}")
        cl.dropdb("fx2")

        # ---------------------------------------------------------------- 7b. triggers
        log("\n== 7b. a trigger on pp_pools / pp_cities stops apply and rollback unless named exactly")
        load(cl, "fx3", cities, pools)
        cl.sql("fx3", TRIGGER_SQL)
        r, _ = run_file(cl, "fx3", "dry-run.sql", single=True)
        n3, md53 = parse_guard(r.stdout)
        b3 = snapshot(cl, "fx3")
        ga = ["-v", f"expected_changes={n3}", "-v", f"manifest_md5={md53}"]
        r, _ = run_file(cl, "fx3", "apply.sql", ["-v", "run_id=t-1"] + ga)
        check("apply aborts when a trigger exists (nothing changed, no backup/log table)",
              r.returncode != 0 and "trigger(s) on pp_pools/pp_cities" in r.stderr and snapshot(cl, "fx3") == b3
              and table_md5(cl, "fx3", "public.seo_repair_pp_change_log") is None, r.stderr.strip()[-220:])
        r, _ = run_file(cl, "fx3", "apply.sql", ["-v", "run_id=t-2", "-v", "allow_triggers=public.pp_pools.pp_pools_touch"] + ga)
        check("apply aborts when allow_triggers names only some of them", r.returncode != 0 and "trigger(s)" in r.stderr
              and snapshot(cl, "fx3") == b3, r.stderr.strip()[-160:])
        allow = "pp_cities.pp_cities_touch,pp_pools.pp_pools_touch"
        r, _ = run_file(cl, "fx3", "apply.sql", ["-v", "run_id=t-3", "-v", f"allow_triggers={allow}"] + ga)
        check("apply proceeds when allow_triggers names every trigger exactly", r.returncode == 0, r.stderr.strip()[-300:])
        r, _ = run_file(cl, "fx3", "rollback.sql", ["-v", "run_id=t-3"])
        check("rollback aborts on the trigger too unless it is named", r.returncode != 0 and "trigger(s)" in r.stderr,
              r.stderr.strip()[-160:])
        r, _ = run_file(cl, "fx3", "rollback.sql", ["-v", "run_id=t-3", "-v", f"allow_triggers={allow}"])
        rb3 = snapshot(cl, "fx3")
        check("with the triggers named, rollback restores every text field (updated_at is NOT restored: documented)",
              r.returncode == 0 and all(rb3[k] == b3[k] for k in b3 if k[2] != "_rest"), r.stderr.strip()[-300:])
        cl.dropdb("fx3")

        # ---------------------------------------------------------------- 7d. canary, then full run, then undo both
        log("\n== 7d. canary (RUNBOOK section 6 step 2, its shell lines run literally), full run, undo both runs")
        load(cl, "fx4", cities, pools)
        r, _ = run_file(cl, "fx4", "dry-run.sql", single=True)
        n4, md54 = parse_guard(r.stdout)
        b4 = snapshot(cl, "fx4")
        rb_lines = open(os.path.join(OUT, "RUNBOOK.md"), encoding="utf-8").read().splitlines()
        i0 = next(i for i, ln in enumerate(rb_lines) if ln.strip().startswith("mkdir -p canary"))
        shell = [ln.strip() for ln in rb_lines[i0:i0 + 3]]
        man4 = open(os.path.join(cl.work, "approved-manifest.csv"), encoding="utf-8").read().splitlines()
        can_row = next(ln.split(",")[1] for ln in man4[1:] if ln.split(",")[2] == "ai_best_for")
        script = "\n".join(shell).replace("<chosen row id>", can_row) + "\nprintf '%s' \"$md5\"\n"
        sh = subprocess.run(["bash", "-euc", script], cwd=cl.work, capture_output=True, text=True)
        can_md5 = sh.stdout.strip()
        cdir = os.path.join(cl.work, "canary")
        if os.geteuid() == 0 and os.path.isdir(cdir):
            for p in (cdir, os.path.join(cdir, "approved-manifest.csv")):
                shutil.chown(p, pglocal.RUN_AS, pglocal.RUN_AS)
        check("the RUNBOOK canary lines build a one-line manifest and its md5",
              sh.returncode == 0 and re.fullmatch(r"[0-9a-f]{32}", can_md5 or "") is not None
              and len(open(os.path.join(cdir, "approved-manifest.csv")).read().splitlines()) == 2,
              (sh.stderr.strip() or can_md5)[-200:])
        run_file(cl, "fx4", "apply.sql")   # only copies apply.sql into the work dir (exits 3: no variables)
        r = cl.psql("fx4", ["-v", "ON_ERROR_STOP=1", "-v", "run_id=c-canary", "-v", "expected_changes=1",
                            "-v", f"manifest_md5={can_md5}", "-f", "../apply.sql"], cwd=cdir)
        a4c = snapshot(cl, "fx4")
        ch4 = {k for k in b4 if b4[k] != a4c.get(k)}
        check("canary apply (run from canary/, md5 as the RUNBOOK computes it) exits 0 and changes exactly one field",
              r.returncode == 0 and ch4 == {("pp_pools", can_row, "ai_best_for")}, r.stderr.strip()[-300:] or str(ch4))
        r, _ = run_file(cl, "fx4", "apply.sql", ["-v", "run_id=c-full", "-v", f"expected_changes={n4}",
                                                  "-v", f"manifest_md5={md54}"])
        lg5 = dict((a, int(n)) for a, n in cl.rows("fx4", "select action, count(*) from public.seo_repair_pp_change_log "
                                                         "where run_id='c-full' group by 1;"))
        check("full run after the canary exits 0; the canary field is already_applied, not drift",
              r.returncode == 0 and lg5.get("already_applied") == 1 and lg5.get("applied") == n4 - 1, str(lg5))
        r, _ = run_file(cl, "fx4", "rollback.sql", ["-v", "run_id=c-full"])
        r4 = snapshot(cl, "fx4")
        left = {k for k in b4 if b4[k] != r4.get(k)}
        check("rolling back the full run alone leaves only the canary field changed, and its output names the canary run",
              r.returncode == 0 and left == {("pp_pools", can_row, "ai_best_for")}
              and re.search(r"c-canary\s*\|\s*1", r.stdout) is not None, r.stderr.strip()[-200:] or str(left))
        r, _ = run_file(cl, "fx4", "rollback.sql", ["-v", "run_id=c-canary"])
        check("then rolling back the canary run restores every field byte-identical (exit 0)",
              r.returncode == 0 and snapshot(cl, "fx4") == b4, r.stderr.strip()[-200:])
        cl.dropdb("fx4")

        # ---------------------------------------------------------------- 7c. non-ASCII whitespace
        log("\n== 7c. non-ASCII whitespace (NBSP, U+202F, U+0085, U+2007, U+001F) in the text: SQL = reference")
        wc = [{"id": S.uid("ws-city"), "url": None, "state_slug": "ws-state", "city_slug": "ws-city",
               "city_name": "Wsville", "ai_intro": None, "ai_faqs": None, "is_published": True, "header_count": 1}]
        wp, n = [], 0
        bodies = ["It was a fine time,{w}we loved the vibe. The pool has six lanes and a slide.",
                  "Great vibe overall,{w}I really liked it. The pool has six lanes and a slide.",
                  "Open daily from 9 to 5.{w}I'd definitely recommend it for a casual swim.{w}It has a slide.",
                  "Open daily from 9 to 5.{w}I'd definitely recommend it for a casual swim. Lifeguards are on duty.",
                  "The pool has six lanes.{w}Honestly,{w}I'd say it's a nice spot. Lifeguards are on duty every day."]
        for w in ("\u00a0", "\u202f", "\u0085", "\u2007", "\u001f", " "):
            for b in bodies:
                n += 1
                wp.append({"id": S.uid(f"ws-pool-{n}"), "url": None, "slug": f"ws-pool-{n}", "name": "Ws Pool",
                           "city": "Wsville", "city_id": wc[0]["id"], "state_slug": "ws-state", "ai_best_for": None,
                           "ai_description": b.format(w=w) + " It is a public pool run by the city of Wsville.",
                           "ai_faqs": [{"q": "Is it good?", "a": b.format(w=w)}], "is_published": True,
                           "is_placeholder": False})
        wc[0]["header_count"] = len(wp)
        load(cl, "ws", wc, wp)
        sq_ws = compare.sql_plan(cl, "ws")
        ref_ws = compare.reference_plan(wc, wp, {})
        d = compare.diff(sq_ws, ref_ws)
        check(f"SQL plan equals reference.py on {len(wp)} rows with non-ASCII whitespace", not d,
              f"{sum(1 for v in sq_ws.values() if v['new'] is not None)} changes; {len(d)} differences"
              + ("\n   " + "\n   ".join(d[:6]) if d else ""))
        cl.dropdb("ws")

        # ---------------------------------------------------------------- 8. whole live extract
        log("\n== 8. the whole live-page extract (2,000 pool + 476 city pages, 2026-11-16) as a surrogate table")
        recs = S.load_live(os.path.join(OUT, "text-defects", "live-2026-11-16", "live-fields.jsonl.gz"))
        sc, sp = S.build(recs)
        load(cl, "sur", sc, sp)
        t0 = time.time()
        sqs = compare.sql_plan(cl, "sur")
        secs = time.time() - t0
        refs = compare.reference_plan(sc, sp, merges)
        d = compare.diff(sqs, refs)
        check("SQL plan equals reference.py on every field of the 2,476 live pages", not d,
              f"{len(sqs)} planned/skipped fields, {sum(1 for v in sqs.values() if v['new'] is not None)} changes, "
              f"{secs:.0f}s; {len(d)} differences" + ("\n   " + "\n   ".join(d[:10]) if d else ""))
        bs = snapshot(cl, "sur")
        r, secs = run_file(cl, "sur", "dry-run.sql", single=True)
        ns, mds = parse_guard(r.stdout)
        check("surrogate dry run exits 0", r.returncode == 0, f"{ns} changes, {secs:.0f}s")
        fs, fr = founder_sql(cl, "sur"), founder_reference(sc, sp, merges)
        sec7 = r.stdout[r.stdout.index("== 7. MUST DECIDE"):r.stdout.index("== 8.")]
        n7 = re.search(r"\((\d+) rows?\)", sec7)
        check("dry run section 7 (founder voice left in place) = the reference list, sentence by sentence",
              fs == fr and n7 is not None and int(n7.group(1)) == len(fr), f"{len(fs)} sentences (reference {len(fr)})")
        v = subprocess.run([sys.executable, "-I", os.path.join(HERE, "check_dry_run.py"), cl.work],
                           capture_output=True, text=True)
        check("check_dry_run.py on the dry run's own JSONL files (section 8): reference plans exactly the same",
              v.returncode == 0, (v.stdout.strip().splitlines() or [v.stderr[-300:]])[0])
        r, secs = run_file(cl, "sur", "apply.sql", ["-v", "run_id=sur-1", "-v", f"expected_changes={ns}",
                                                    "-v", f"manifest_md5={mds}"])
        check("surrogate apply exits 0", r.returncode == 0, f"{secs:.0f}s " + r.stderr.strip()[-300:])
        as_ = snapshot(cl, "sur")
        planned_s = {k for k, v in sqs.items() if v["new"] is not None}
        check("surrogate apply changed exactly the planned fields", {k for k in bs if bs[k] != as_.get(k)} == planned_s,
              f"{len(planned_s)}")
        again = {k: v for k, v in compare.sql_plan(cl, "sur").items() if v["new"] is not None}
        log(f"   after apply the plan would change {len(again)} field(s) again (idempotency gap; each needs a new "
            f"dry run and approval):")
        for k, v in sorted(again.items()):
            log(f"     {k[0]}.{k[2]} {v['rules']} row {k[1]}")
        r, _ = run_file(cl, "sur", "verify-live.sql", ["-v", "run_id=sur-1"], single=True)
        exp_csv = os.path.join(cl.work, "verify-expected.csv")
        check("verify-live.sql (read-only) lists every applied field", r.returncode == 0 and os.path.exists(exp_csv)
              and sum(1 for _ in open(exp_csv, encoding="utf-8")) > len(planned_s), r.stderr.strip()[-300:])
        import gzip
        import subprocess as sp_
        pages = os.path.join(cl.root, "pages-2026-11-16.jsonl")
        with gzip.open(os.path.join(OUT, "text-defects", "live-2026-11-16", "live-fields.jsonl.gz"), "rb") as src, \
                open(pages, "wb") as dst:
            dst.write(src.read())
        v = sp_.run([sys.executable, "-I", os.path.join(HERE, "verify_live.py"), exp_csv, pages],
                    capture_output=True, text=True)
        summary = v.stdout.strip().splitlines()[-1] if v.stdout.strip() else v.stderr[-300:]
        check("verify_live.py rates every changed field of the pages fetched BEFORE apply (2026-11-16) as OLD "
              "(checks the URL building and the page-to-column mapping offline)",
              f'"OLD": {len(planned_s)}' in summary and v.returncode == 1, summary)
        r, secs = run_file(cl, "sur", "rollback.sql", ["-v", "run_id=sur-1"])
        check("surrogate rollback restores every field byte-identical and exits 0 ('rollback complete')",
              r.returncode == 0 and "rollback complete" in r.stdout and snapshot(cl, "sur") == bs, f"{secs:.0f}s")
        check("surrogate rollback takes under 30 s (planner settings + analyze; it was 67 s)", secs < 30, f"{secs:.1f}s")
        cl.dropdb("sur")
    finally:
        cl.stop(remove=True)
        log(f"\nlocal cluster stopped and {cl.root} removed: {not os.path.exists(cl.root)}")

    log(f"\nRESULT: {'FAIL' if FAILS else 'PASS'} ({len(FAILS)} failed check(s))")
    for f in FAILS:
        log(f"  failed: {f}")
    with open(os.path.join(OUT, "test-output.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(LOG) + "\n")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
