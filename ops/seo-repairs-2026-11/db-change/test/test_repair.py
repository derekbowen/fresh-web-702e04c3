#!/usr/bin/env python3
"""Local end-to-end test of apply.sql / dry-run.sql / rollback.sql on a throwaway PostgreSQL 16 cluster.

Started by test.sh, which creates the cluster and exports PGHOST / PGPORT / PGUSER. Standard library only.
Every check is an assertion; the first failure exits non-zero.

Fixtures:
  * every fee rule (all 2,843 FIX rows) with its real old_text from the production extract, in synthetic fields that
    carry the real row id, slug and column;
  * every link rule (562) once, in a markdown body, in the form its CSV row names;
  * hand-written cases with hand-written expected output: every link form (markdown, title, <angle>, HTML " and ',
    backslash-escaped quotes, www / non-www / upper-case host, trailing slash, ?query, #fragment), longer URLs and other
    domains that must not match, plain prose, the same link several times in one field, a field with no match, UNLINK in
    markdown and HTML, an image link UNLINK must leave alone, a link inside an insurance sentence, a blog post;
  * a fee field and a link field edited after the md5 pins were read, and a link field created after it (all must be
    skipped and logged), a fee anchor that occurs twice (must be skipped);
  * insurance guard cases: a link separated from "Liability coverage" only by "e.g." / "vs." (must be left alone) and an
    HTML list whose neighbouring <li> mentions liability (the link in its own <li> must be rewritten);
  * rollback on a database where apply never ran, rollback of one named run, a field edited by a human after apply
    (rollback must leave it alone).
"""
import base64
import csv
import hashlib
import os
import re
import shutil
import subprocess
import sys
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
GEN = os.path.join(PKG, "generate.py")
WORK = os.environ.get("SEO_TEST_WORK", "/tmp/seo_repair_test_work")
DB = "seo_repair_test"
FEES_CSV = os.path.join(PKG, "..", "fees", "fee-corrections.csv")
INS = re.compile(r"insur|liabil|coverage|\bcovered\b|claim|damage|waiver|injur|indemn|\bseguros?\b|responsabilidad|"
                 r"cobertura|reclam|\bdaños?\b|lesi[oó]n", re.I)
LINK_LINE = re.compile(r"^\s*F5-[0-9a-f]{10}\s*\|")


def fee_rule_id(r):
    return "F14-" + hashlib.md5("|".join((r["table"], r["row_id"], r["column"], r["old_text"])).encode()).hexdigest()[:10]


def section(text, title):
    """lines of one '=== title ... ===' section of a psql output"""
    i = text.index("=== " + title)
    j = text.find("\n===", i + 4)
    return text[i:j if j > 0 else len(text)]

TEXT_COLS = {"content_pages": ["content", "body_markdown", "description", "seo_title", "seo_description",
                               "og_description", "raw_html"],
             "blog_posts": ["content"]}
PASSED = []


def log(*a):
    print(*a, flush=True)


def check(cond, msg):
    if not cond:
        log("FAIL: " + msg)
        sys.exit(1)
    PASSED.append(msg)
    log("ok   " + msg)


def psql(args, sql=None, file=None, db=DB, expect_fail=False):
    cmd = ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", db] + args
    if file:
        cmd += ["-f", file]
    if sql is not None:
        cmd += ["-c", sql]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if (p.returncode != 0) != expect_fail:
        log("psql exit %d (expect_fail=%s)\nSTDOUT:\n%s\nSTDERR:\n%s" % (p.returncode, expect_fail, p.stdout[-4000:],
                                                                       p.stderr[-4000:]))
        sys.exit(1)
    return p


def q(sql):
    return psql(["-q", "-A", "-t", "-F", "\t"], sql=sql).stdout.rstrip("\n")


def md5(s):
    return hashlib.md5(s.encode("utf-8")).hexdigest()


def state():
    """(table, id, column) -> full value, for every text column of every fixture row (byte-exact via base64)."""
    out = {}
    for t, cols in TEXT_COLS.items():
        sel = ", ".join("coalesce(replace(encode(convert_to(%s, 'UTF8'), 'base64'), E'\\n', ''), '~NULL~')" % c
                        for c in cols)
        for line in q("select id, %s from public.%s order by id" % (sel, t)).split("\n"):
            if not line:
                continue
            parts = line.split("\t")
            for c, v in zip(cols, parts[1:]):
                out[(t, parts[0], c)] = None if v == "~NULL~" else base64.b64decode(v).decode("utf-8")
    return out


def gen(out, *extra):
    if os.path.isdir(out):
        shutil.rmtree(out)
    p = subprocess.run([sys.executable, GEN, "--out", out] + list(extra), capture_output=True, text=True)
    if p.returncode != 0:
        log(p.stdout, p.stderr)
        sys.exit(1)
    return p.stderr.strip()


def dq(s):
    assert "$fx$" not in s
    return "$fx$" + s + "$fx$"


def manifest(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

# ------------------------------------------------------------------------------------------------ fixtures


def build_fixtures(rules):
    links = [r for r in rules if r["kind"] == "link"]
    by_target = {r["target_or_slug"]: r for r in links}
    rows = {}            # (table, id) -> {slug, cols}
    expect = {}          # (table, id, col) -> expected value after apply
    expected_rows = {r["rule_id"]: 0 for r in links}
    handcrafted = {}

    def put(t, rid, slug, col, before, after, rule_counts=None):
        rows.setdefault((t, rid), {"slug": slug, "cols": {}})["cols"][col] = before
        expect[(t, rid, col)] = after
        for k, n in (rule_counts or {}).items():
            expected_rows[k] += n

    # 1. every fee rule, real anchors, real ids and slugs
    fees = {}
    with open(FEES_CSV, newline="", encoding="utf-8") as f:
        for i, r in enumerate(csv.DictReader(f), 1):
            if r["action"] == "FIX":
                fees.setdefault((r["table"], r["row_id"], r["column"]), []).append(
                    (int(r["line"] or 0), fee_rule_id(r), r))
    fee_fields = {}
    for (t, rid, col), lst in sorted(fees.items()):
        lst.sort(key=lambda x: (x[0], x[1]))
        slug = lst[0][2]["slug"]
        sep = "\n\nFixture paragraph between corrections.\n\n"
        before = "Fixture field for %s (%s).\n\n" % (slug, col) + sep.join(x[2]["old_text"] for x in lst) + "\n\nEnd of fixture.\n"
        after = "Fixture field for %s (%s).\n\n" % (slug, col) + sep.join(x[2]["new_text"] for x in lst) + "\n\nEnd of fixture.\n"
        for x in lst:
            assert before.count(x[2]["old_text"]) == 1, (slug, col, x[1])
        put(t, rid, slug, col, before, after)
        fee_fields[(t, rid, col)] = [x[1] for x in lst]

    # 2. every link rule once, in the form its CSV row names
    for r in links:
        rid = str(uuid.uuid5(uuid.NAMESPACE_URL, "bulk:" + r["rule_id"]))
        url = r["target_or_slug"]
        before = "Bulk fixture %s.\n\nSee [Anchor %s](%s) for details.\n" % (r["rule_id"], r["rule_id"], url)
        counts = {r["rule_id"]: 1}             # fields holding the target (the count guard's measure)
        if INS.search(url):
            after = before                      # the block mentions an insurance word (via the URL): left alone
        elif r["action_or_category"] == "REWRITE":
            after = before.replace("](%s)" % url, "](%s)" % r["destination_or_new"])
        else:
            after = before.replace("[Anchor %s](%s)" % (r["rule_id"], url), "Anchor %s" % r["rule_id"])
        put("content_pages", rid, "fixture-bulk-" + r["rule_id"].lower(), "body_markdown", before, after, counts)

    # 3. hand-written cases with hand-written expectations
    T = by_target["/p/free-host-tools"]["rule_id"]
    N = by_target["https://poolrentalnearme.com/p/hosting"]["rule_id"]
    R = by_target["https://poolrentalnearme.com/"]["rule_id"]
    U = by_target["/b/backyard-design-tips"]["rule_id"]
    UN = by_target["https://poolrentalnearme.com/guides/backyard-oasis-tips"]["rule_id"]
    assert by_target["/p/free-host-tools"]["destination_or_new"] == "/p/pool-host-tools"
    assert by_target["https://poolrentalnearme.com/p/hosting"]["destination_or_new"] == "/p/hosting"
    assert by_target["https://poolrentalnearme.com/"]["destination_or_new"] == "/"
    assert by_target["/b/backyard-design-tips"]["action_or_category"] == "UNLINK"
    assert by_target["https://poolrentalnearme.com/guides/backyard-oasis-tips"]["action_or_category"] == "UNLINK"

    def hid(name):
        return str(uuid.uuid5(uuid.NAMESPACE_URL, "hand:" + name))

    h1_before = (
        "Start: [Free tools](/p/free-host-tools) and again [tools again](/p/free-host-tools/).\n"
        "Title form: [T](/p/free-host-tools \"Our tools\").\n"
        "Angle form: [A](</p/free-host-tools>).\n"
        "Absolute www with fragment: [W](https://www.poolrentalnearme.com/p/free-host-tools#calculators).\n"
        "Upper-case host, query and fragment: [U](HTTPS://WWW.PoolRentalNearMe.com/p/free-host-tools?ref=nav#top).\n"
        "Longer URLs must not change: [L](/p/free-host-tools-extra) [L2](/p/free-host-tools/sub) "
        "[L3](/p/free-host-tools.html) [L4](https://www.poolrentalnearme.com/p/free-host-toolsX).\n"
        "Plain prose must not change: visit /p/free-host-tools or https://www.poolrentalnearme.com/p/free-host-tools today.\n")
    h1_after = (
        "Start: [Free tools](/p/pool-host-tools) and again [tools again](/p/pool-host-tools).\n"
        "Title form: [T](/p/pool-host-tools \"Our tools\").\n"
        "Angle form: [A](</p/pool-host-tools>).\n"
        "Absolute www with fragment: [W](/p/pool-host-tools#calculators).\n"
        "Upper-case host, query and fragment: [U](/p/pool-host-tools?ref=nav#top).\n"
        "Longer URLs must not change: [L](/p/free-host-tools-extra) [L2](/p/free-host-tools/sub) "
        "[L3](/p/free-host-tools.html) [L4](https://www.poolrentalnearme.com/p/free-host-toolsX).\n"
        "Plain prose must not change: visit /p/free-host-tools or https://www.poolrentalnearme.com/p/free-host-tools today.\n")
    put("content_pages", hid("h1"), "fixture-h1-markdown-forms", "body_markdown", h1_before, h1_after, {T: 1})
    handcrafted["h1"] = ("content_pages", hid("h1"), "body_markdown", {T: 6})

    h2_before = (
        "<p>Read the <a href=\"/p/free-host-tools\">host tools</a> and "
        "<a class=\"btn\" href='https://www.poolrentalnearme.com/p/free-host-tools/#faq' target=\"_blank\">FAQ</a>.</p>\n"
        "<p>Escaped quotes: <a href=\\\"/p/free-host-tools\\\">tools</a></p>\n"
        "<p>Non-www: <a href=\"https://poolrentalnearme.com/p/hosting\">hosting</a>, "
        "<a href=\"https://poolrentalnearme.com/\">home</a> and <a href=\"https://poolrentalnearme.com\">home again</a>.</p>\n"
        "<p>Other domains must not change: <a href=\"https://poolrentalnearme.com.au/p/hosting\">au</a> "
        "<a href=\"https://example.com/p/free-host-tools\">ex</a></p>\n"
        "<p>Plain prose must not change: https://poolrentalnearme.com/p/hosting is text.</p>\n")
    h2_after = (
        "<p>Read the <a href=\"/p/pool-host-tools\">host tools</a> and "
        "<a class=\"btn\" href='/p/pool-host-tools#faq' target=\"_blank\">FAQ</a>.</p>\n"
        "<p>Escaped quotes: <a href=\\\"/p/pool-host-tools\\\">tools</a></p>\n"
        "<p>Non-www: <a href=\"/p/hosting\">hosting</a>, "
        "<a href=\"/\">home</a> and <a href=\"/\">home again</a>.</p>\n"
        "<p>Other domains must not change: <a href=\"https://poolrentalnearme.com.au/p/hosting\">au</a> "
        "<a href=\"https://example.com/p/free-host-tools\">ex</a></p>\n"
        "<p>Plain prose must not change: https://poolrentalnearme.com/p/hosting is text.</p>\n")
    put("content_pages", hid("h2"), "fixture-h2-html-forms", "content", h2_before, h2_after, {T: 1, N: 1, R: 1})
    handcrafted["h2"] = ("content_pages", hid("h2"), "content", {T: 3, N: 1, R: 2})

    h3_before = (
        "Ideas: [backyard design tips](/b/backyard-design-tips) and [again](/b/backyard-design-tips/ \"Tips\").\n"
        "Not this one: [other](/b/backyard-design-tips-2024).\n"
        "An image is left alone: ![pic](/b/backyard-design-tips)\n"
        "Plain prose: /b/backyard-design-tips\n"
        "Non-www unlink: [oasis ideas](https://poolrentalnearme.com/guides/backyard-oasis-tips#top).\n")
    h3_after = (
        "Ideas: backyard design tips and again.\n"
        "Not this one: [other](/b/backyard-design-tips-2024).\n"
        "An image is left alone: ![pic](/b/backyard-design-tips)\n"
        "Plain prose: /b/backyard-design-tips\n"
        "Non-www unlink: oasis ideas.\n")
    put("content_pages", hid("h3"), "fixture-h3-unlink-markdown", "body_markdown", h3_before, h3_after, {U: 1, UN: 1})
    handcrafted["h3"] = ("content_pages", hid("h3"), "body_markdown", {U: 2, UN: 1})

    h4_before = ("<ul><li><a href=\"/b/backyard-design-tips\" class=\"x\">Design <em>tips</em></a></li>\n"
                 "<li><A HREF='https://poolrentalnearme.com/guides/backyard-oasis-tips'>Oasis</A></li></ul>\n")
    h4_after = "<ul><li>Design <em>tips</em></li>\n<li>Oasis</li></ul>\n"
    put("content_pages", hid("h4"), "fixture-h4-unlink-html", "content", h4_before, h4_after, {U: 1, UN: 1})
    handcrafted["h4"] = ("content_pages", hid("h4"), "content", {U: 1, UN: 1})

    h5 = ("Hosts should review their insurance before listing, see [our tools](/p/free-host-tools). "
          "That sentence is left for Derek.\n")
    put("content_pages", hid("h5"), "fixture-h5-insurance-sentence", "body_markdown", h5, h5, {T: 1})

    h6 = "No old link here: [Pool tools](/p/pool-host-tools), [hosting](/p/hosting), poolrentalnearme.com in prose.\n"
    put("content_pages", hid("h6"), "fixture-h6-no-match", "content", h6, h6)

    put("blog_posts", hid("h7"), "fixture-h7-blog", "content",
        "Blog: [tools](https://www.poolrentalnearme.com/p/free-host-tools).\n",
        "Blog: [tools](/p/pool-host-tools).\n", {T: 1})
    handcrafted["h7"] = ("blog_posts", hid("h7"), "content", {T: 1})

    F = by_target["/faq"]["rule_id"]
    assert by_target["/faq"]["destination_or_new"] == "/p/faq"
    # h8: a link field that a person edits after the pins were read (edited in main()): must be skipped and logged
    h8 = "Questions? Read the [FAQ](/faq) first.\n"
    put("content_pages", hid("h8"), "fixture-h8-link-edited-after-pin", "body_markdown", h8, h8, {F: 1})
    # h10: "e.g." and "vs." used to split the sentence away from "Liability coverage": the link must be left alone
    h10 = "Liability coverage rules differ by state (e.g. Texas vs. Florida), so read [our FAQ](/faq) first.\n"
    put("content_pages", hid("h10"), "fixture-h10-insurance-abbreviation", "body_markdown", h10, h10, {F: 1})
    # h11: an HTML list item about liability next to a list item with the link: the link's own item is rewritten
    h11_before = '<ul><li>Get liability coverage.</li><li>See the <a href="/faq">FAQ</a></li></ul>\n'
    h11_after = '<ul><li>Get liability coverage.</li><li>See the <a href="/p/faq">FAQ</a></li></ul>\n'
    put("content_pages", hid("h11"), "fixture-h11-html-list-neighbour", "content", h11_before, h11_after, {F: 1})
    handcrafted["h11"] = ("content_pages", hid("h11"), "content", {F: 1})

    # 4. fee edge cases: an anchor that occurs twice (skip that rule only) and a field edited after the pin (skip all)
    dup_key = next(k for k, v in sorted(fee_fields.items()) if len(v) >= 3 and k[2] == "body_markdown")
    fee_by_rule = {x[1]: x[2] for lst in fees.values() for x in lst}
    dup_rule = fee_fields[dup_key][0]
    dup_old = fee_by_rule[dup_rule]["old_text"]
    rows[(dup_key[0], dup_key[1])]["cols"][dup_key[2]] += "\nDuplicated anchor: " + dup_old + "\n"
    # expected: every other rule of the field applied; the duplicated anchor (both copies) unchanged
    lst = sorted(fees[dup_key], key=lambda x: (x[0], x[1]))
    sep = "\n\nFixture paragraph between corrections.\n\n"
    expect[dup_key] = ("Fixture field for %s (%s).\n\n" % (lst[0][2]["slug"], dup_key[2]) +
                       sep.join(x[2]["old_text"] if x[1] == dup_rule else x[2]["new_text"] for x in lst) +
                       "\n\nEnd of fixture.\n" + "\nDuplicated anchor: " + dup_old + "\n")

    pin_key = next(k for k, v in sorted(fee_fields.items())
                   if fee_by_rule[v[0]]["slug"] == "become-a-swimming-pool-host-saratoga-springs-ny" and k[2] == "content")

    return rows, expect, expected_rows, handcrafted, fee_fields, dup_key, dup_rule, pin_key, fee_by_rule, hid


def fixture_sql(rows):
    out = []
    for (t, rid), r in sorted(rows.items()):
        cols = sorted(r["cols"])
        if t == "content_pages":
            names = ["id", "slug", "title"] + cols
            vals = [dq(rid), dq(r["slug"]), dq("Fixture " + r["slug"])] + [dq(r["cols"][c]) for c in cols]
        else:
            names = ["id", "slug", "title"] + cols
            vals = [dq(rid), dq(r["slug"]), dq("Fixture " + r["slug"])] + [dq(r["cols"][c]) for c in cols]
        out.append("insert into public.%s (%s) values (%s);" % (t, ", ".join(names), ", ".join(vals)))
    return "\n".join(out) + "\n"

# ------------------------------------------------------------------------------------------------ main


def main():
    if os.path.isdir(WORK):
        shutil.rmtree(WORK)
    os.makedirs(WORK)
    log("== 0. reproducibility: the checked-in SQL is exactly what generate.py produces from the CSVs")
    g0 = os.path.join(WORK, "gen-checkin")
    log("   " + gen(g0))
    files = ["apply.sql", "dry-run.sql", "rollback.sql", "verify.sql", "rules-manifest.csv", "excluded-pending-derek.csv"] + \
        ["pending/" + x for x in sorted(os.listdir(os.path.join(g0, "pending")))]
    for fn in files:
        a = open(os.path.join(g0, fn), "rb").read()
        b = open(os.path.join(PKG, fn), "rb").read()
        check(a == b, "checked-in %s is byte-identical to a fresh generation" % fn)

    rules = manifest(os.path.join(g0, "rules-manifest.csv"))
    rows, expect, expected_rows, hand, fee_fields, dup_key, dup_rule, pin_key, fee_by_rule, hid = build_fixtures(rules)
    log("   fixtures: %d rows, %d fields (%d fee fields with %d fee rules, %d link rules)" % (
        len(rows), len(expect), len(fee_fields), sum(len(v) for v in fee_fields.values()),
        sum(1 for r in rules if r["kind"] == "link")))

    log("== 1. load the fixture database")
    psql([], sql="drop database if exists %s" % DB, db="postgres")
    psql([], sql="create database %s" % DB, db="postgres")
    psql(["-q"], file=os.path.join(HERE, "fixture-schema.sql"))
    fx = os.path.join(WORK, "fixtures.sql")
    open(fx, "w", encoding="utf-8").write(fixture_sql(rows))
    psql(["-q"], file=fx)
    check(int(q("select count(*) from content_pages")) + int(q("select count(*) from blog_posts")) == len(rows),
          "all %d fixture rows loaded" % len(rows))
    s_fresh = state()
    p = psql([], file=os.path.join(PKG, "rollback.sql"))
    check("nothing to roll back" in p.stderr and "no change log table" in p.stdout,
          "rollback.sql on a database where apply never ran exits 0 and says there is nothing to roll back")
    check(state() == s_fresh and q("select to_regclass('public.seo_repair_change_log') is null") == "t",
          "that rollback changed no field and created no change log")
    p = psql(["-1"], file=os.path.join(PKG, "verify.sql"))
    check("apply never committed" in p.stdout, "verify.sql on a database where apply never ran says so and exits 0")

    log("== 2. PENDING-READS P1 on the fixture: read the field md5 pins (fee and link fields), then change three fields")
    pins_dir = os.path.join(WORK, "pins")
    os.makedirs(pins_dir)
    for fn in sorted(os.listdir(os.path.join(g0, "pending"))):
        p = psql(["-q", "-A", "-t", "-F", "\t", "-1"], file=os.path.join(g0, "pending", fn))
        open(os.path.join(pins_dir, fn.replace("p1_fee_field_pins", "field-pins").replace(".sql", ".tsv")), "w").write(p.stdout)
    pin_lines = [l.rstrip("\n").split("\t") for fn in sorted(os.listdir(pins_dir))
                 for l in open(os.path.join(pins_dir, fn)) if l.count("\t") == 3]
    pinned = {(a, b, c): m for a, b, c, m in pin_lines}
    check(all(k in pinned for k in fee_fields), "P1 returned a pin for every fee field (%d)" % len(fee_fields))
    link_fields = {k for k in expect if k[0:3] not in fee_fields and k[1] not in (hid("h6"),)}
    check(link_fields <= set(pinned), "P1 returned a pin for every field holding a link-rule target (%d)" % len(link_fields))
    check(all(pinned[k] == md5(rows[(k[0], k[1])]["cols"][k[2]]) for k in pinned),
          "every pin is the md5 of the field value at the pin read (%d pins)" % len(pinned))
    t, rid, col = pin_key
    psql(["-q"], sql="update public.%s set %s = %s || ' Edited after the pin was read.' where id = '%s'" % (t, col, col, rid))
    expect[pin_key] = rows[(t, rid)]["cols"][col] + " Edited after the pin was read."
    h8key = ("content_pages", hid("h8"), "body_markdown")
    psql(["-q"], sql="update public.content_pages set body_markdown = body_markdown || 'Edited after the pin.' where id = '%s'" % hid("h8"))
    expect[h8key] = rows[("content_pages", hid("h8"))]["cols"]["body_markdown"] + "Edited after the pin."
    h9key = ("content_pages", hid("h9"), "body_markdown")
    h9 = "Created after the pin read: [FAQ](/faq).\n"
    psql(["-q"], sql="insert into public.content_pages (id, slug, title, body_markdown) values ('%s', 'fixture-h9-new-after-pin', 'h9', %s)"
         % (hid("h9"), dq(h9)))
    expect[h9key] = h9
    upd0 = dict(tuple(l.split("\t")[:2]) for l in q("select id, updated_at::text from content_pages union all "
                                                    "select id, updated_at::text from blog_posts").split("\n"))
    s0 = state()

    # expected link counts by construction
    exp_file = os.path.join(WORK, "expected.tsv")
    with open(exp_file, "w") as f:
        for k, v in sorted(expected_rows.items()):
            f.write("%s\t%d\n" % (k, v))
    g1 = os.path.join(WORK, "gen-test")
    log("   " + gen(g1, "--pins", pins_dir, "--expected", exp_file))

    log("== 3. the checked-in (unpinned) apply.sql refuses to run")
    p = psql([], file=os.path.join(PKG, "apply.sql"), expect_fail=True)
    check("have no field md5 pin" in p.stderr, "unpinned apply.sql raised 'no field md5 pin'")
    check(state() == s0, "database unchanged after the refused run")
    check(q("select to_regclass('public.seo_repair_change_log') is null") == "t",
          "log tables were not created (the whole transaction rolled back)")

    log("== 4. the count guard aborts when a rule's count is off")
    T = next(r["rule_id"] for r in rules if r["target_or_slug"] == "/p/free-host-tools")
    U = next(r["rule_id"] for r in rules if r["target_or_slug"] == "/b/backyard-design-tips")
    for rule, delta in ((T, 3), (U, -3)):
        bad = os.path.join(WORK, "expected-bad.tsv")
        with open(bad, "w") as f:
            for k, v in sorted(expected_rows.items()):
                f.write("%s\t%d\n" % (k, v + (delta if k == rule else 0)))
        g2 = os.path.join(WORK, "gen-bad")
        gen(g2, "--pins", pins_dir, "--expected", bad)
        p = psql([], file=os.path.join(g2, "apply.sql"), expect_fail=True)
        check("aborted by the count guard" in p.stderr and rule in p.stderr,
              "count guard aborted when %s expected %+d" % (rule, delta))
        check(state() == s0, "database unchanged after the aborted run (%s)" % rule)
    # fee guard: many fee fields changed since the pin -> abort
    snap_desc = q("select count(*) from content_pages where description is not null")
    check(int(snap_desc) > 60, "fixture has %s description fields for the fee guard test" % snap_desc)
    fee_guard_sql = open(os.path.join(g1, "apply.sql"), encoding="utf-8").read().replace(
        "\\set ON_ERROR_STOP on\nbegin;\n",
        "\\set ON_ERROR_STOP on\nbegin;\nupdate public.content_pages set description = description || ' edited' "
        "where description is not null;\n", 1)
    fg = os.path.join(WORK, "apply-fee-guard.sql")
    open(fg, "w", encoding="utf-8").write(fee_guard_sql)
    p = psql([], file=fg, expect_fail=True)
    check("aborted by the count guard" in p.stderr and "fee rules expected" in p.stderr,
          "fee count guard aborted when %s fee fields changed after the pins" % snap_desc)
    check(state() == s0, "database unchanged after the fee-guard abort")

    log("== 5. dry-run (read-only) on the fixture")
    p = psql(["-1"], file=os.path.join(g1, "dry-run.sql"))
    dry = p.stdout
    open(os.path.join(PKG, "dry-run-local-fixture.txt"), "w").write(
        "dry-run.sql (generated with the fixture pins and fixture expected counts) run on the local fixture database, "
        "%s\n\n" % "see test-output.txt" + dry)
    check(state() == s0, "dry-run changed nothing")
    p0 = psql(["-1"], file=os.path.join(PKG, "dry-run.sql"))
    check("UNPINNED: field guard not evaluated" in p0.stdout and state() == s0,
          "the checked-in (unpinned) dry-run.sql runs read-only and says the field guard was not evaluated")
    p2 = psql(["-1"], sql="set transaction read only; create table public.should_fail (x int);", expect_fail=True)
    check("read-only transaction" in p2.stderr, "'set transaction read only' under psql -1 blocks writes")
    sec = section(dry, "link rules: fields per rule today")
    link_lines = [l for l in sec.split("\n") if LINK_LINE.match(l)]
    check(len(link_lines) == sum(1 for r in rules if r["kind"] == "link"), "dry-run reports every link rule")
    check(all(l.rstrip().endswith("ok") for l in link_lines), "dry-run verdict ok for every link rule")
    lt = {l.split("|")[0].strip(): [c.strip() for c in l.split("|")] for l in link_lines}
    # columns: rule_id action old dest exp present_now would field_guard_skip insurance_skip already unsupported occ verdict
    check(lt[T][6] == str(expected_rows[T] - 1) and lt[T][8] == "1",
          "dry-run: %s would change %d fields, 1 skipped for an insurance paragraph" % (T, expected_rows[T] - 1))
    check(lt[U][10] == "1", "dry-run: %s reports 1 row with an image link it does not unlink" % U)
    F = next(r["rule_id"] for r in rules if r["target_or_slug"] == "/faq")
    check(lt[F][6] == "2" and lt[F][7] == "2" and lt[F][8] == "1",
          "dry-run: /faq would change 2 fields; field guard skips 2 (edited / created after the pins); insurance 1")
    ins_sec = section(dry, "link fields left alone for Derek")
    check("fixture-h10-insurance-abbreviation" in ins_sec and "fixture-h5-insurance-sentence" in ins_sec
          and "fixture-h11-html-list-neighbour" not in ins_sec,
          "dry-run lists the insurance-guarded fields for Derek (abbreviation case in, HTML list neighbour out)")
    fg_sec = section(dry, "link fields the field guard will skip")
    check(re.search(r"fixture-h8-link-edited-after-pin.*changed since pin read", fg_sec) and
          re.search(r"fixture-h9-new-after-pin.*not in pin read", fg_sec),
          "dry-run lists the link fields the field guard will skip, with the reason")
    nfee = sum(len(v) for v in fee_fields.values())
    skipped_fee = len(fee_fields[pin_key]) + 1
    m = re.search(r"^\s*ok\s*\|\s*(\d+)\s*\|", dry, re.M)
    check(m and int(m.group(1)) == nfee - skipped_fee,
          "dry-run: %d fee rules ok, %d not (pin mismatch field + duplicated anchor)" % (nfee - skipped_fee, skipped_fee))

    log("== 6. apply")
    p = psql([], file=os.path.join(g1, "apply.sql"))
    open(os.path.join(WORK, "apply-1.out"), "w").write(p.stdout + p.stderr)
    s1 = state()
    changed = {k for k in s1 if s1[k] != s0[k]}
    want = {k for k, v in expect.items() if v != s0[k]}
    for k in sorted(changed ^ want)[:5]:
        log("   DIFF %s changed=%s wanted=%s\n   before=%r\n   after =%r\n   expect=%r" % (
            k, k in changed, k in want, (s0[k] or "")[:300], (s1[k] or "")[:300], (expect.get(k) or "")[:300]))
    check(changed == want, "apply changed exactly the %d expected fields (and nothing else)" % len(want))
    wrong = [k for k in want if s1[k] != expect[k]]
    for k in wrong[:5]:
        log("   WRONG %s\n   after =%r\n   expect=%r" % (k, s1[k][:400], expect[k][:400]))
    check(not wrong, "every changed field equals its hand-written / constructed expected value byte for byte")
    for name, (t, rid, col, counts) in sorted(hand.items()):
        for rule, n in counts.items():
            got = q("select occurrences from seo_repair_change_log where rule_id = '%s' and row_id = '%s' and column_name = '%s'"
                    % (rule, rid, col))
            check(got == str(n), "%s: change_log records %d occurrence(s) for %s" % (name, n, rule))
    nlog = int(q("select count(distinct (table_name, row_id, column_name)) from seo_repair_change_log"))
    nbak = int(q("select count(*) from seo_repair_backup_20261115"))
    check(nlog == len(want) == nbak, "one backup row per changed field (%d) and every changed field logged" % nbak)
    bad_bak = q("select count(*) from seo_repair_backup_20261115 b where md5(b.old_value) <> b.old_md5")
    check(bad_bak == "0", "backup old_md5 matches the stored old value")
    check(all(s0[(b.split("\t")[0], b.split("\t")[1], b.split("\t")[2])] is not None and
              md5(s0[(b.split("\t")[0], b.split("\t")[1], b.split("\t")[2])]) == b.split("\t")[3]
              for b in q("select table_name, row_id, column_name, old_md5 from seo_repair_backup_20261115").split("\n")),
          "every backup holds the exact pre-apply value")
    chain_bad = q("""select count(*) from seo_repair_change_log a join seo_repair_change_log b
                     on a.table_name = b.table_name and a.row_id = b.row_id and a.column_name = b.column_name
                     and b.id = (select min(id) from seo_repair_change_log c where c.table_name = a.table_name
                                 and c.row_id = a.row_id and c.column_name = a.column_name and c.id > a.id)
                     where a.new_md5 <> b.old_md5""")
    check(chain_bad == "0", "change_log old/new md5 form an unbroken chain per field")
    skips = q("select rule_id, row_id, reason from seo_repair_skip_log order by id")
    check(("field changed since the reviewed pin read" in skips) and
          sum(1 for l in skips.split("\n") if pin_key[1] in l) == len(fee_fields[pin_key]),
          "fee field edited after the pin: all %d of its rules skipped and logged" % len(fee_fields[pin_key]))
    check(any(l.startswith(F + "\t" + hid("h8")) and "changed since the reviewed pin read" in l for l in skips.split("\n")),
          "link field edited after the pin: skipped and logged")
    check(any(l.startswith(F + "\t" + hid("h9")) and "not in the reviewed pin read" in l for l in skips.split("\n")),
          "link field created after the pin read: skipped and logged")
    check(any(l.startswith(F + "\t" + hid("h10")) and "insurance" in l for l in skips.split("\n")),
          "link separated from 'Liability coverage' only by 'e.g.'/'vs.': left alone and logged")
    bad_upd = [b for b in q("select table_name, row_id, coalesce(old_updated_at::text, '') from seo_repair_backup_20261115").split("\n")
               if b and upd0.get(b.split("\t")[1]) != b.split("\t")[2]]
    check(not bad_upd, "every backup row keeps the row's updated_at from before the change")
    check(any(l.startswith(dup_rule + "\t") and "occurs 2 times" in l for l in skips.split("\n")),
          "fee anchor present twice: %s skipped and logged" % dup_rule)
    check("insurance" in skips and any(l.startswith(T + "\t") and "insurance" in l for l in skips.split("\n")),
          "link inside an insurance sentence: skipped and logged")
    check(any(l.startswith(U + "\t") and "does not rewrite" in l for l in skips.split("\n")),
          "image link UNLINK cannot handle: left and logged")
    check("=== apply: fields changed per rule (this run) ===" in p.stdout and re.search(
        r"^\s*%s\s*\|.*\|\s*%d\s*\|\s*%d\s*\|\s*\d+\s*\|\s*1\s*$" % (T, expected_rows[T], expected_rows[T] - 1), p.stdout, re.M),
        "apply printed the per-rule summary (%s: %d fields hold it, %d changed, 1 skipped)" % (T, expected_rows[T], expected_rows[T] - 1))
    sar = [k for k in fee_fields if fee_by_rule[fee_fields[k][0]]["slug"] == "become-a-swimming-pool-host-saratoga-springs-ny"
           and k[2] == "body_markdown"][0]
    check("a Saratoga host keeps the full $10,800." in s1[sar] and "walk away with nearly" not in s1[sar],
          "seed: Saratoga Springs body_markdown corrected")
    for slug, needle in (("swim-instructor-pool-rental-fair-oaks-ranch-tx", "15% guest booking fee added at checkout"),
                         ("swim-instructor-pool-rental-mount-vernon-va", "Booking fee (15% of pool rental, paid by you at checkout)")):
        ks = [k for k in fee_fields if fee_by_rule[fee_fields[k][0]]["slug"] == slug]
        check(ks and all(needle in s1[k] and "10%" not in s1[k] for k in ks if k != dup_key),
              "seed: %s corrected in %d field(s)" % (slug, len(ks)))
    p = psql(["-1"], file=os.path.join(PKG, "verify.sql"))
    vt = section(p.stdout, "repaired fields: total")
    check(re.search(r"^\s*%d\s*\|\s*%d\s*$" % (len(want), len(want)), vt, re.M) is not None and
          "value changed after the repair" not in p.stdout,
          "verify.sql right after apply: all %d repaired fields still hold what the repair wrote" % len(want))
    anon = q("select has_table_privilege('anon', 'public.seo_repair_backup_20261115', 'select')")
    rls = q("select relrowsecurity from pg_class where oid = 'public.seo_repair_backup_20261115'::regclass")
    check(anon == "f" and rls == "t", "backup table: row level security on, no anon access")

    log("== 7. second apply changes nothing and does not touch the backup")
    bak_md5 = q("select md5(string_agg(table_name||row_id||column_name||old_md5||md5(old_value)||taken_at::text||run_id, ',' "
                "order by table_name, row_id, column_name, old_md5)) from seo_repair_backup_20261115")
    ncl = q("select count(*) from seo_repair_change_log")
    p = psql([], file=os.path.join(g1, "apply.sql"))
    open(os.path.join(WORK, "apply-2.out"), "w").write(p.stdout + p.stderr)
    check(state() == s1, "second apply: every field unchanged")
    check(q("select count(*) from seo_repair_change_log") == ncl, "second apply: no new change_log rows")
    check(q("select md5(string_agg(table_name||row_id||column_name||old_md5||md5(old_value)||taken_at::text||run_id, ',' "
            "order by table_name, row_id, column_name, old_md5)) from seo_repair_backup_20261115") == bak_md5,
          "second apply: backup table byte-identical")
    check(re.search(r"\|\s*0\s*\|\s*0\s*\|\s*0\s*\|", p.stdout) is not None, "second apply summary: 0 changes, 0 fields, 0 backups")
    run2 = q("select run_id from seo_repair_skip_log order by id desc limit 1")
    r2 = q("select distinct reason from seo_repair_skip_log where run_id = '%s'" % run2).split("\n")
    check(not any("already" in x for x in r2) and all(("insurance" in x) or ("pin read" in x) for x in r2 if x),
          "second apply logs no 'already applied' skips, only real ones (insurance, field guard): %d reason(s)" % len(r2))
    tot = section(p.stdout, "apply: totals").split("\n")
    check(any(re.search(r"\|\s*0\s*\|\s*0\s*\|\s*0\s*\|\s*\d+\s*\|\s*[1-9]\d*\s*\|\s*\d+\s*$", l) for l in tot),
          "second apply totals report the fields an earlier run already changed (not logged as skips)")

    log("== 8. a human edits one repaired field, then rollback")
    t, rid, col, _ = hand["h1"]
    psql(["-q"], sql="update public.%s set %s = %s || 'Edited by a person after the repair.' where id = '%s'" % (t, col, col, rid))
    edited = state()[(t, rid, col)]
    p = psql(["-1"], file=os.path.join(PKG, "verify.sql"))
    check(p.stdout.count("value changed after the repair") == 1 and "fixture-h1-markdown-forms" in p.stdout,
          "verify.sql reports the one repaired field a person changed afterwards")
    s_before_rb = state()
    p = psql(["-v", "only_run=apply-20000101T000000Z-1"], file=os.path.join(PKG, "rollback.sql"))
    check(state() == s_before_rb and "has no logged changes" in p.stderr,
          "rollback limited to a run that does not exist restores nothing")
    p = psql([], file=os.path.join(PKG, "rollback.sql"))
    open(os.path.join(WORK, "rollback-1.out"), "w").write(p.stdout + p.stderr)
    s2 = state()
    diff = {k for k in s2 if s2[k] != s0[k]}
    check(diff == {(t, rid, col)}, "rollback restored every field byte-identical to before apply, except the edited one")
    check(s2[(t, rid, col)] == edited, "rollback left the human-edited field exactly as the person left it")
    check(re.search(r"restored\s*\|\s*%d" % (len(want) - 1), p.stdout) and re.search(r"skipped\s*\|\s*1\b", p.stdout),
          "rollback reported %d restored, 1 skipped" % (len(want) - 1))
    check("field was edited after apply" in p.stdout, "rollback reported why it skipped")

    log("== 9. rollback again: nothing more to restore")
    p = psql([], file=os.path.join(PKG, "rollback.sql"))
    check(state() == s2, "second rollback changed nothing")
    check(re.search(r"^\s*restored\s*\|", p.stdout, re.M) is None and re.search(r"^\s*skipped\s*\|\s*1\b", p.stdout, re.M),
          "second rollback restored 0 fields (the edited one is reported skipped again)")

    log("== 10. apply again after the rollback (backup not duplicated)")
    nbak = q("select count(*) from seo_repair_backup_20261115")
    p = psql([], file=os.path.join(g1, "apply.sql"))
    s3 = state()
    check({k for k in s3 if s3[k] != s2[k]} == want - {(t, rid, col)}, "re-apply changed the same fields again")
    check(all(s3[k] == expect[k] for k in want - {(t, rid, col)}), "re-applied values equal the expected values")
    check(q("select count(*) from seo_repair_backup_20261115") == nbak, "backup rows not duplicated by the re-apply")

    log("\nALL %d CHECKS PASSED" % len(PASSED))


if __name__ == "__main__":
    main()
