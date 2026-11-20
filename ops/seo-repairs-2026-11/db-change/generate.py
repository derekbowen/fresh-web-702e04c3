#!/usr/bin/env python3
"""Generate the F5 + F14 content-repair SQL from the two reviewed CSVs.

Standard library only. Reproducible: the same inputs always give byte-identical output.

    python3 generate.py                       # writes apply.sql, dry-run.sql, rollback.sql, manifests, P1 reads
    python3 generate.py --pins pins/ --out build/   # with the field md5 pins read from production (PENDING-READS P1)

Field guard: apply.sql changes a field only when its md5 equals the pin read by P1 (link and fee fields alike). The pins
are read once, the dry run built from the same pins is reviewed, and apply.sql built from the same pins runs after
Derek's GO. A field that changed after the reviewed pin read, or that was not in it, is skipped and logged.

Rule ids are derived from content (F5-<md5(form|path)[:10]>, F14-<md5(table|row|column|old_text)[:10]>), so they do not
move when a CSV is re-sorted or rows are added; the manifest keeps the CSV row for reference.

Inputs (read-only):
    ../fees/fee-corrections.csv   rows with action = FIX become fee rules (one rule per CSV row)
    ../links/link-mapping.csv     rows with action = REWRITE or UNLINK and at least one database row become link rules

Everything else (NEEDS_DEREK rows, link targets with no database row) is listed in excluded-pending-derek.csv.

Options used by the local test only:
    --expected FILE   TSV rule_id<TAB>expected_rows: overrides the snapshot count of fields holding each link rule's target
    --out DIR         write the outputs somewhere else (default: this directory)
"""
import argparse
import csv
import hashlib
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FEES_CSV = os.path.join(HERE, "..", "fees", "fee-corrections.csv")
LINKS_CSV = os.path.join(HERE, "..", "links", "link-mapping.csv")

LINK_SNAPSHOT = "content_pages / blog_posts link counts recomputed 2026-11-15 ~22:04 UTC (links/README.md)"
DQ = "$seo$"  # dollar-quote tag for every embedded literal; asserted absent from all data
LINK_COLUMNS = [("content_pages", "content"), ("content_pages", "body_markdown"), ("blog_posts", "content")]
TOL_LINK_ABS, TOL_LINK_PCT = 2, 0.05   # link rule: |present now - expected present| <= 2 + floor(5% of expected)
TOL_FEE_ABS, TOL_FEE_PCT = 2, 0.02     # fee rules (aggregate): |found - expected| <= 2 + floor(2% of expected)
PIN_BATCH = 500
LINK_PIN_SHARDS = ["01", "23", "45", "67", "89", "ab", "cd", "ef"]   # first hex digit of the row id

# ---------------------------------------------------------------- regex building (PostgreSQL ARE syntax)

def ci(s):
    """Case-insensitive ARE fragment for a literal (letters become [Aa], everything else is escaped)."""
    out = []
    for ch in s:
        if ch.isalpha() and ch.isascii():
            out.append("[%s%s]" % (ch.upper(), ch.lower()))
        else:
            out.append(esc(ch))
    return "".join(out)


def esc(s):
    """Escape a literal for an ARE: every ASCII non-alphanumeric character gets a backslash."""
    return "".join(("\\" + ch) if (ch.isascii() and not ch.isalnum()) else ch for ch in s)


DOMAIN = "poolrentalnearme.com"
DOMAIN_W = "[Hh][Tt][Tt][Pp][Ss]?://" + ci("www." + DOMAIN)       # absolute www form
DOMAIN_N = "[Hh][Tt][Tt][Pp][Ss]?://" + ci(DOMAIN)                # absolute non-www form
URLCH = "[^)\\s\"'<>\\\\]"                                          # a URL character (same set as the audit extractor)
QSFRAG = "(?:\\?[^#)\\s\"'<>\\\\]*)?(?:#" + URLCH + "*)?"         # optional ?query then optional #fragment (kept)
TERM = "(?=[)\\s\"'<>\\\\]|$)"                                     # URL must end here: no longer URL can match
CTX = "(\\]\\(\\s*<?|[Hh][Rr][Ee][Ff]\\s*=\\s*\\\\?[\"'])"           # markdown ]( or ](< ; HTML href= with ' or " (or \")

# The extractor and normalisation are the ones the 2026-11-15 database counts used (links/README.md "How it was built"),
# so the expected counts and the live counts measure the same thing. href is matched case-insensitively here (superset).
EXTRACTOR = "(?:\\]\\(\\s*<?|[Hh][Rr][Ee][Ff]\\s*=\\s*\\\\?[\"'])(" + URLCH + "+)"
PREFILTER = "poolrentalnearme|\\]\\(\\s*<?/|href"
# Insurance guard for links. A link is left alone (and logged for Derek) when its block mentions insurance, liability,
# coverage, claims, damage or a close relative. A block is one line of the field, cut further at HTML block tags, so a
# paragraph or a list item: an abbreviation such as "e.g." or "vs." can no longer separate the link from the words, and
# an HTML <li> next to an insurance <li> is not swept in. Over-matching only leaves a link unchanged.
INS_RE = ("insur|liabil|coverage|\\mcovered\\M|claim|damage|waiver|injur|indemn|"
          "\\mseguros?\\M|responsabilidad|cobertura|reclam|\\mdaños?\\M|lesi[oó]n")
BLOCK_SPLIT = ("\\n|<(?:/?(?:[Pp]|[Ll][Ii]|[Uu][Ll]|[Oo][Ll]|[Hh][1-6]|[Dd][Ii][Vv]|[Tt][RrDdHh]|[Tt][Aa][Bb][Ll][Ee]|"
               "[Bb][Ll][Oo][Cc][Kk][Qq][Uu][Oo][Tt][Ee]|[Ss][Ee][Cc][Tt][Ii][Oo][Nn]|[Dd][DdTt])\\M[^>]*|[Bb][Rr]\\s*/?)>")


def norm_target(t):
    """(form, path) exactly as the audit normalised links: form n = non-www absolute, w = relative or www absolute."""
    form = "n" if re.match(r"^https?://poolrentalnearme\.com", t, re.I) else "w"
    p = re.sub(r"^https?://(www\.)?poolrentalnearme\.com", "", t, flags=re.I)
    p = p.split("#")[0].split("?")[0]
    p = re.sub(r"/+$", "", p) or "/"
    return form, p


def url_core(form, path):
    """ARE for the URL up to (not including) the query/fragment, in every allowed form, with optional trailing slashes."""
    if form == "n":
        return DOMAIN_N + ("/*" if path == "/" else esc(path) + "/*")
    if path == "/":
        return "(?:" + DOMAIN_W + "/*|/)"
    return "(?:" + DOMAIN_W + ")?" + esc(path) + "/*"


def link_patterns(form, path, dest):
    core = url_core(form, path)
    pat_ctx = CTX + core + "(" + QSFRAG + ")" + TERM
    repl_ctx = "\\1" + dest + "\\2" if dest else ""
    # [text](url) / [text](url "title") / [text](<url>) -> text ; not an image (![...]) and not an escaped \[
    pat_md = ("(?<![!\\\\])\\[([^][]*)\\]\\(\\s*<?" + core + QSFRAG +
              ">?(?:\\s+(?:\"[^\"]*\"|'[^']*'))?\\s*\\)")
    # <a ... href="url" ...>text</a> -> text (text may contain other tags, but not </a>)
    pat_html = ("<[Aa]\\s(?:[^>]*\\s)?[Hh][Rr][Ee][Ff]\\s*=\\s*\\\\?[\"']" + core + QSFRAG +
                "\\\\?[\"'][^>]*>((?:[^<]|<(?!/[Aa]\\s*>))*)</[Aa]\\s*>")
    return pat_ctx, repl_ctx, pat_md, pat_html

# ---------------------------------------------------------------- helpers


def lit(s):
    if s is None:
        return "null"
    if DQ in s:
        raise SystemExit("dollar-quote tag %s found in data; choose another tag" % DQ)
    return DQ + s + DQ


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def md5(s):
    return hashlib.md5(s.encode("utf-8")).hexdigest()


def tol(n, a, p):
    return a + int(n * p)


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

# ---------------------------------------------------------------- load inputs


def load_links(expected_override):
    rules, excluded = [], []
    with open(LINKS_CSV, newline="", encoding="utf-8") as f:
        for i, r in enumerate(csv.DictReader(f), 1):
            src = "links/link-mapping.csv row %d" % i
            form, path = norm_target(r["old_target"])
            rid = "F5-" + md5(form + "|" + path)[:10]
            n = {c: int(r[k] or 0) for c, k in (("content", "db_content_rows"), ("body_markdown", "db_body_markdown_rows"),
                                                  ("blog", "db_blog_posts_rows"))}
            present = n["content"] + n["body_markdown"] + n["blog"]
            if r["action"] not in ("REWRITE", "UNLINK"):
                excluded.append(("link", rid, src, r["old_target"], "", r["action"],
                                 "NEEDS_DEREK: " + r["reason"] + " | proposal: " + r["destination"]))
                continue
            if present == 0:
                excluded.append(("link", rid, src, r["old_target"], "", r["action"] + " (code or render only)",
                                 "no content/body_markdown/blog_posts row holds this link (snapshot 2026-11-15); "
                                 "fix is in application code, see links/code-handoff.md"))
                continue
            dest = r["destination"] if r["action"] == "REWRITE" else ""
            if r["action"] == "REWRITE":
                assert re.fullmatch(r"/[A-Za-z0-9/_\-.%~]*", dest), dest
            assert "\\" not in dest
            ins = int(r["db_rows_in_insurance_sentences"] or 0)
            exp_present = present
            if rid in expected_override:
                exp_present = expected_override[rid]
            pat_ctx, repl_ctx, pat_md, pat_html = link_patterns(form, path, dest)
            # The count guard compares fields that hold the target now (changed + insurance-skipped + already applied)
            # with the snapshot count, so it measures drift in the data, independent of how the insurance guard
            # classifies a field.
            rules.append(dict(rule_id=rid, src=src, form=form, path=path, action=r["action"], old_target=r["old_target"],
                              dest=dest, exp_present=exp_present, exp_ins=ins, exp_change=exp_present,
                              tol=tol(exp_present, TOL_LINK_ABS, TOL_LINK_PCT), pat_ctx=pat_ctx, repl_ctx=repl_ctx,
                              pat_md=pat_md, pat_html=pat_html, cols=n))
    keys = [(x["form"], x["path"]) for x in rules]
    assert len(keys) == len(set(keys)), "two link rules share one (form, path)"
    ids = [x["rule_id"] for x in rules] + [x[1] for x in excluded]
    assert len(ids) == len(set(ids)), "link rule id collision"
    return rules, excluded


def load_pins(spec):
    pins = {}
    if not spec:
        return None
    files = []
    for s in spec:
        if os.path.isdir(s):
            files += sorted(os.path.join(s, x) for x in os.listdir(s) if x.endswith(".tsv"))
        else:
            files.append(s)
    for fn in files:
        with open(fn, encoding="utf-8") as f:
            for line in f:
                parts = line.rstrip("\n").split("\t")
                if len(parts) != 4 or parts[0] not in ("content_pages", "blog_posts"):
                    continue
                t, rid, col, m = parts
                pins[(t, rid, col)] = m if re.fullmatch(r"[0-9a-f]{32}", m) else "MISSING"
    if not pins:
        raise SystemExit("--pins given but no pin lines were read")
    return pins


def load_fees(pins, verified_only=False):
    rules, excluded = [], []
    with open(FEES_CSV, newline="", encoding="utf-8") as f:
        for i, r in enumerate(csv.DictReader(f), 1):
            src = "fees/fee-corrections.csv row %d" % i
            rid = "F14-" + md5("|".join((r["table"], r["row_id"], r["column"], r["old_text"])))[:10]
            if r["action"] != "FIX":
                excluded.append(("fee", rid, src, r["slug"], r["column"], r["action"] + " " + r["category"],
                                 r["reasoning"]))
                continue
            if verified_only and not r["verified"].startswith("YES"):
                excluded.append(("fee", rid, src, r["slug"], r["column"], "FIX " + r["category"] + " (verification pending)",
                                 "left out by --verified-only: " + r["verified"]))
                continue
            assert r["table"] in ("content_pages", "blog_posts") and re.fullmatch(r"[a-z_]+", r["column"])
            assert re.fullmatch(r"[0-9a-f-]{36}", r["row_id"]), r["row_id"]
            assert r["old_text"] and r["new_text"] and r["old_text"] != r["new_text"]
            key = (r["table"], r["row_id"], r["column"])
            pin = None
            if pins is not None:
                if key not in pins:
                    raise SystemExit("no pin for %s %s %s in the --pins files (run every P1 file)" % key)
                pin = pins[key]
            rules.append(dict(rule_id=rid, src=src, t=r["table"], rid=r["row_id"], slug=r["slug"], col=r["column"],
                              line=int(r["line"] or 0), category=r["category"], old=r["old_text"],
                              old_md5=md5(r["old_text"]), new=r["new_text"], pin=pin, verified=r["verified"]))
    ids = [x["rule_id"] for x in rules] + [x[1] for x in excluded]
    assert len(ids) == len(set(ids)), "fee rule id collision"
    # within one field: anchors never contain each other or each other's replacement (so sequential replace is safe)
    by = {}
    for x in rules:
        by.setdefault((x["t"], x["rid"], x["col"]), []).append(x)
    for k, v in by.items():
        v.sort(key=lambda x: (x["line"], x["rule_id"]))
        for o, x in enumerate(v, 1):
            x["ord"] = o
        for a in v:
            for b in v:
                if a is not b:
                    assert a["old"] not in b["old"] and a["old"] not in b["new"], (k, a["rule_id"], b["rule_id"])
    return rules, excluded, by

# ---------------------------------------------------------------- SQL pieces


LINK_COLS = ("rule_id, form, path, action, old_target, dest, exp_present, exp_ins, exp_change, tol, "
             "pat_ctx, repl_ctx, pat_md, pat_html")
FEE_COLS = "rule_id, t, rid, slug, col, ord, category, old_text, old_md5, new_text, pin"
PIN_COLS = "t, rid, col, md5"


def link_values(rules):
    rows = []
    for x in rules:
        rows.append("(%s)" % ", ".join([
            lit(x["rule_id"]), lit(x["form"]), lit(x["path"]), lit(x["action"]), lit(x["old_target"]), lit(x["dest"]),
            str(x["exp_present"]), str(x["exp_ins"]), str(x["exp_change"]), str(x["tol"]),
            lit(x["pat_ctx"]), lit(x["repl_ctx"]), lit(x["pat_md"]), lit(x["pat_html"])]))
    return ",\n".join(rows)


def fee_values(rules):
    rows = []
    for x in rules:
        rows.append("(%s)" % ", ".join([
            lit(x["rule_id"]), lit(x["t"]), lit(x["rid"]), lit(x["slug"]), lit(x["col"]), str(x["ord"]),
            lit(x["category"]), lit(x["old"]), lit(x["old_md5"]), lit(x["new"]),
            (lit(x["pin"]) if x["pin"] is not None else "null::text")]))
    return ",\n".join(rows)


def pin_values(pins):
    """every pin (link and fee fields), sorted; ids and md5s are checked so a plain quote is safe"""
    rows = []
    for (t, rid, col), m in sorted((pins or {}).items()):
        assert t in ("content_pages", "blog_posts") and re.fullmatch(r"[a-z_]+", col) and re.fullmatch(r"[0-9a-f-]{36}", rid)
        assert m == "MISSING" or re.fullmatch(r"[0-9a-f]{32}", m)
        rows.append("('%s', '%s', '%s', '%s')" % (t, rid, col, m))
    return ",\n".join(rows)


def pins_digest(pins):
    if pins is None:
        return "none"
    h = hashlib.sha256()
    for (t, rid, col), m in sorted(pins.items()):
        h.update(("%s\t%s\t%s\t%s\n" % (t, rid, col, m)).encode())
    return h.hexdigest()


def field_union(shard=None):
    parts = []
    for t, c in LINK_COLUMNS:
        extra = ""
        if shard:
            extra = " and left(x.id::text, 1) in (%s)" % ", ".join("'%s'" % ch for ch in shard)
        parts.append("    select %s::text as t, x.id::text as rid, x.slug, %s::text as col, x.%s as val\n"
                     "    from public.%s x where x.%s ~* %s%s" % (lit(t), lit(c), c, t, c, lit(PREFILTER), extra))
    return "\n    union all\n".join(parts)


def link_fields_sql(shard=None):
    """(t, rid, slug, col, val, form, path) for every field holding a link to a target of the rules in _seo_link_rules"""
    return """  select f.t, f.rid, f.slug, f.col, f.val, n.form, n.path
  from (
%(fields)s
  ) f
  cross join lateral (
    select distinct
      case when m[1] ~* '^https?://poolrentalnearme\\.com' then 'n' else 'w' end as form,
      coalesce(nullif(regexp_replace(split_part(split_part(
        regexp_replace(m[1], '^https?://(www\\.)?poolrentalnearme\\.com', '', 'i'), '#', 1), '?', 1), '/+$', ''), ''), '/') as path
    from regexp_matches(f.val, %(extractor)s, 'g') m
    where m[1] ~* '^https?://(www\\.)?poolrentalnearme\\.com' or (m[1] ~ '^/' and m[1] !~ '^//')
  ) n""" % dict(fields=field_union(shard), extractor=lit(EXTRACTOR))


def link_eval_sql():
    return """select r.rule_id, k.t, k.rid, k.slug, k.col, md5(k.val) as cur_md5, pn.md5 as pin,
  (select count(*) from regexp_matches(k.val, r.pat_ctx, 'g'))::int as present,
  (case when r.action = 'REWRITE' then (select count(*) from regexp_matches(k.val, r.pat_ctx, 'g'))
        else (select count(*) from regexp_matches(k.val, r.pat_md, 'g'))
           + (select count(*) from regexp_matches(k.val, r.pat_html, 'g')) end)::int as handled,
  exists (select 1 from regexp_split_to_table(k.val, %(split)s) b
          where b ~ r.pat_ctx and b ~* %(ins)s) as ins
from (
%(fields)s
) k
join _seo_link_rules r on r.form = k.form and r.path = k.path
left join _seo_pins pn on pn.t = k.t and pn.rid = k.rid and pn.col = k.col""" % dict(
        split=lit(BLOCK_SPLIT), ins=lit(INS_RE), fields=link_fields_sql())


def fee_eval_sql(fee_rules):
    cols = {}
    for x in fee_rules:
        cols.setdefault(x["t"], set()).add(x["col"])
    branches = []
    for t in sorted(cols):
        cases = " ".join("when %s then x.%s" % (lit(c), c) for c in sorted(cols[t]))
        branches.append("    select true as row_found, (case r.col %s end)::text as val\n"
                        "    from public.%s x where r.t = %s and x.id = r.rid::uuid" % (cases, t, lit(t)))
    if not branches:
        branches.append("    select true as row_found, null::text as val where false")
    return """select r.rule_id, r.t, r.rid, r.slug, r.col, r.ord, r.old_md5, r.pin,
  md5(r.old_text) = r.old_md5 as lit_ok,
  coalesce(v.row_found, false) as row_found,
  v.val is not null as has_val,
  md5(v.val) as cur_md5,
  coalesce((length(v.val) - length(replace(v.val, r.old_text, ''))) / length(r.old_text), 0) as occ
from _seo_fee_rules r
left join lateral (
%s
) v on true""" % "\n    union all\n".join(branches)


def needed_columns(fee_rules):
    need = set(LINK_COLUMNS)
    for x in fee_rules:
        need.add((x["t"], x["col"]))
    return sorted(need)


def header(kind, fee_rules, link_rules, pins, extra=""):
    if pins is not None:
        pinned = "yes: %d fields (link and fee), pin set sha256 %s" % (len(pins), pins_digest(pins))
    else:
        pinned = "NO - apply.sql refuses to run until regenerated with --pins (PENDING-READS.md P1)"
    return """-- =====================================================================================================
-- SEO content repair 2026-11 (audit fixes F5 internal links + F14 fee statements): %s
-- GENERATED by ops/seo-repairs-2026-11/db-change/generate.py - do not edit by hand; edit the CSVs and regenerate.
-- inputs:
--   fees/fee-corrections.csv  sha256 %s
--   links/link-mapping.csv    sha256 %s
-- fee rules: %d (action FIX, one per CSV row) on %d fields
-- link rules: %d (REWRITE %d, UNLINK %d) - targets with at least one database row; expected counts from
--   %s
-- link columns: content_pages.content, content_pages.body_markdown, blog_posts.content
-- field md5 pins: %s
-- field guard: a field is changed only when md5(field) equals its pin; otherwise it is skipped and logged
-- count guard: link rule |fields holding the target now (pin-matching to change + insurance-skipped) + already applied
--              - expected| <= %d + floor(%d%% of expected); fee rules together <= %d + floor(%d%% of %d)
%s-- =====================================================================================================
""" % (kind, sha256(FEES_CSV), sha256(LINKS_CSV), len(fee_rules),
       len({(x["t"], x["rid"], x["col"]) for x in fee_rules}), len(link_rules),
       sum(1 for x in link_rules if x["action"] == "REWRITE"), sum(1 for x in link_rules if x["action"] == "UNLINK"),
       LINK_SNAPSHOT, pinned, TOL_LINK_ABS, int(TOL_LINK_PCT * 100), TOL_FEE_ABS, int(TOL_FEE_PCT * 100), len(fee_rules),
       extra)


def preflight_sql(cols):
    checks = ",\n    ".join("(%s, %s)" % (lit(t), lit(c)) for t, c in cols)
    tables = sorted({t for t, _ in cols})
    idchecks = ",\n    ".join("(%s, 'id')" % lit(t) for t in tables)
    return """do $pre$
declare v_missing text;
begin
  select string_agg(n.t || '.' || n.c, ', ') into v_missing
  from (values
    %s) n(t, c)
  where not exists (select 1 from information_schema.columns ic
                    where ic.table_schema = 'public' and ic.table_name = n.t and ic.column_name = n.c
                      and ic.data_type in ('text', 'character varying'));
  if v_missing is not null then
    raise exception 'SEO repair preflight: these columns are missing or not text: %%', v_missing;
  end if;
  select string_agg(n.t || '.id / .slug / .updated_at', ', ') into v_missing
  from (values
    %s) n(t, c)
  where not exists (select 1 from information_schema.columns ic
                    where ic.table_schema = 'public' and ic.table_name = n.t and ic.column_name = 'id' and ic.data_type = 'uuid')
     or not exists (select 1 from information_schema.columns ic
                    where ic.table_schema = 'public' and ic.table_name = n.t and ic.column_name = 'slug')
     or not exists (select 1 from information_schema.columns ic
                    where ic.table_schema = 'public' and ic.table_name = n.t and ic.column_name = 'updated_at'
                      and ic.data_type like 'timestamp%%');
  if v_missing is not null then
    raise exception 'SEO repair preflight: id is not uuid, or slug / updated_at missing: %%', v_missing;
  end if;
end
$pre$;
""" % (checks, idchecks)


LOG_TABLES_SQL = """create table if not exists public.seo_repair_backup_20261115 (
  table_name     text not null,
  row_id         text not null,
  column_name    text not null,
  old_value      text not null,
  old_md5        text not null,
  old_updated_at timestamptz,
  taken_at       timestamptz not null default now(),
  run_id         text not null,
  primary key (table_name, row_id, column_name, old_md5)
);
comment on table public.seo_repair_backup_20261115 is
  'SEO repair 2026-11 (F5/F14): full value of every field before apply.sql first changed it, and the row''s updated_at at that moment. Never overwritten.';
create table if not exists public.seo_repair_change_log (
  id             bigserial primary key,
  run_id         text not null,
  rule_id        text not null,
  table_name     text not null,
  row_id         text not null,
  slug           text,
  column_name    text not null,
  old_md5        text not null,
  new_md5        text not null,
  occurrences    integer not null,
  applied_at     timestamptz not null default now(),
  rolled_back_at timestamptz
);
create index if not exists seo_repair_change_log_field_idx
  on public.seo_repair_change_log (table_name, row_id, column_name);
create table if not exists public.seo_repair_skip_log (
  id          bigserial primary key,
  run_id      text not null,
  rule_id     text not null,
  table_name  text not null,
  row_id      text not null,
  slug        text,
  column_name text not null,
  reason      text not null,
  logged_at   timestamptz not null default now()
);
create table if not exists public.seo_repair_rollback_log (
  id           bigserial primary key,
  rollback_run text not null,
  table_name   text not null,
  row_id       text not null,
  slug         text,
  column_name  text not null,
  status       text not null,
  reason       text,
  logged_at    timestamptz not null default now()
);
-- Not readable or writable through the public API (same convention as the 2026-05 backup tables).
alter table public.seo_repair_backup_20261115 enable row level security;
alter table public.seo_repair_change_log enable row level security;
alter table public.seo_repair_skip_log enable row level security;
alter table public.seo_repair_rollback_log enable row level security;
do $grants$
declare r text; t text;
begin
  foreach t in array array['seo_repair_backup_20261115', 'seo_repair_change_log', 'seo_repair_skip_log',
                           'seo_repair_rollback_log'] loop
    foreach r in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = r) then
        execute format('revoke all on public.%I from %I', t, r);
      end if;
    end loop;
  end loop;
end
$grants$;
"""

APPLY_DO = r"""do $apply$
declare
  v_run      text := (select run_id from _seo_run);
  v_bad      text[] := '{}';
  v_nbad     int := 0;
  rec        record;
  fld        record;
  fr         record;
  lr         record;
  v_val      text;
  v_orig     text;
  v_new      text;
  v_slug     text;
  v_upd      timestamptz;
  v_row_upd  timestamptz;
  v_row_key  text := '';
  v_pin      text;
  v_last     text;
  v_n        int;
  v_left     int;
  v_rows     int;
  v_total    int;
  v_would    int;
  v_prior    int;
  v_tol      int;
  v_fields   int := 0;
  v_done     int := 0;
  v_skipf    int := 0;
begin
  -- guard 1: every embedded fee anchor arrived byte-exact
  if exists (select 1 from _seo_fee_eval where not lit_ok) then
    raise exception 'SEO repair: a fee old_text literal does not match its md5 (file damaged in transit); nothing changed';
  end if;
  -- guard 2: the field md5 pins (PENDING-READS P1) must be in this script
  select count(*) into v_n from _seo_fee_rules where pin is null;
  if v_n > 0 or not exists (select 1 from _seo_pins) then
    raise exception 'SEO repair: % fee rule(s) have no field md5 pin and % pins are loaded; run PENDING-READS P1, regenerate with --pins, re-run the tests. Nothing changed',
      v_n, (select count(*) from _seo_pins);
  end if;
  -- guard 3: per link rule, fields holding the target now (pin-matching ones it would change + insurance-skipped)
  -- plus fields an earlier run already changed, against the snapshot count
  for rec in
    select r.rule_id, r.old_target, r.exp_present, r.tol,
           (select count(*) from _seo_link_eval e where e.rule_id = r.rule_id and e.handled > 0 and not e.ins
              and e.pin = e.cur_md5)::int as would,
           (select count(*) from _seo_link_eval e where e.rule_id = r.rule_id and e.ins)::int as ins,
           coalesce((select p.n from _seo_prior p where p.rule_id = r.rule_id), 0)::int as prior
    from _seo_link_rules r order by r.rule_id
  loop
    if abs(rec.would + rec.ins + rec.prior - rec.exp_present) > rec.tol then
      v_nbad := v_nbad + 1;
      raise notice 'COUNT GUARD %: % expected % (tolerance %), found % to change + % insurance-skipped + % already applied',
        rec.rule_id, rec.old_target, rec.exp_present, rec.tol, rec.would, rec.ins, rec.prior;
      if v_nbad <= 25 then
        v_bad := v_bad || format('%s expected %s found %s+%s+%s', rec.rule_id, rec.exp_present, rec.would, rec.ins, rec.prior);
      end if;
    end if;
  end loop;
  -- guard 4: fee rules together (each is one field; a field edited since the pin is skipped, not overwritten)
  select count(*) into v_total from _seo_fee_rules;
  select count(*) into v_would from _seo_fee_eval where lit_ok and has_val and occ = 1 and cur_md5 = pin;
  select count(*) into v_prior from _seo_prior p join _seo_fee_rules r using (rule_id);
  v_tol := 2 + floor(v_total * 0.02)::int;
  if abs(v_would + v_prior - v_total) > v_tol then
    v_nbad := v_nbad + 1;
    v_bad := v_bad || format('fee rules expected %s found %s+%s (tolerance %s)', v_total, v_would, v_prior, v_tol);
  end if;
  raise notice 'count guard: fee rules expected %, would change %, already applied %, tolerance %',
    v_total, v_would, v_prior, v_tol;
  if v_nbad > 0 then
    raise exception 'SEO repair aborted by the count guard (% rule group(s) out of tolerance; the script is stale or the data moved): %',
      v_nbad, array_to_string(v_bad, '; ');
  end if;

  -- apply, one field at a time, under a row lock
  for fld in
    select t, rid, col from (
      select t, rid, col from _seo_fee_rules
      union
      select t, rid, col from _seo_link_eval
    ) x order by t, rid, col
  loop
    execute format('select %I, slug, updated_at from public.%I where id = $1::uuid for update', fld.col, fld.t)
      into v_val, v_slug, v_upd using fld.rid;
    get diagnostics v_rows = row_count;  -- EXECUTE does not set FOUND
    if v_rows = 0 then
      insert into public.seo_repair_skip_log (run_id, rule_id, table_name, row_id, slug, column_name, reason)
      select v_run, rule_id, fld.t, fld.rid, null, fld.col, 'row no longer exists'
      from (select rule_id from _seo_fee_rules where t = fld.t and rid = fld.rid and col = fld.col
            union all select rule_id from _seo_link_eval where t = fld.t and rid = fld.rid and col = fld.col) z;
      continue;
    end if;
    v_orig := v_val;
    -- the row's updated_at before this run touched it (fields of one row are consecutive; the trigger bumps it on
    -- the first changed field)
    if v_row_key is distinct from fld.t || '/' || fld.rid then
      v_row_key := fld.t || '/' || fld.rid;
      v_row_upd := v_upd;
    end if;

    -- field guard: the value must be exactly the one the reviewed pin read saw (PENDING-READS P1)
    select md5 into v_pin from _seo_pins where t = fld.t and rid = fld.rid and col = fld.col;
    if v_val is null or v_pin is null or md5(v_val) <> v_pin then
      -- an earlier run of this change wrote the current value: nothing to do, nothing to log
      select c.new_md5 into v_last from public.seo_repair_change_log c
      where c.table_name = fld.t and c.row_id = fld.rid and c.column_name = fld.col and c.rolled_back_at is null
      order by c.id desc limit 1;
      if v_val is not null and v_last is not null and md5(v_val) = v_last then
        v_done := v_done + 1;
        continue;
      end if;
      insert into public.seo_repair_skip_log (run_id, rule_id, table_name, row_id, slug, column_name, reason)
      select v_run, rule_id, fld.t, fld.rid, v_slug, fld.col,
             case when v_pin is null then 'field was not in the reviewed pin read (P1); not changed'
                  else 'field changed since the reviewed pin read (P1); not changed' end
      from (select rule_id from _seo_fee_rules where t = fld.t and rid = fld.rid and col = fld.col
            union all select rule_id from _seo_link_eval where t = fld.t and rid = fld.rid and col = fld.col) z;
      v_skipf := v_skipf + 1;
      continue;
    end if;

    -- F14 fee corrections: exact substring, exactly one occurrence
    for fr in select * from _seo_fee_rules where t = fld.t and rid = fld.rid and col = fld.col order by ord loop
      v_n := (length(v_val) - length(replace(v_val, fr.old_text, ''))) / length(fr.old_text);
      if v_n <> 1 then
        insert into public.seo_repair_skip_log (run_id, rule_id, table_name, row_id, slug, column_name, reason)
        values (v_run, fr.rule_id, fld.t, fld.rid, v_slug, fld.col,
                format('old_text occurs %s times (exactly 1 required); not applied', v_n));
        continue;
      end if;
      v_new := replace(v_val, fr.old_text, fr.new_text);
      insert into public.seo_repair_change_log
        (run_id, rule_id, table_name, row_id, slug, column_name, old_md5, new_md5, occurrences)
      values (v_run, fr.rule_id, fld.t, fld.rid, v_slug, fld.col, md5(v_val), md5(v_new), 1);
      v_val := v_new;
    end loop;

    -- F5 internal links: exact URL boundary, link contexts only
    for lr in
      select e.rule_id, e.ins, r.action, r.pat_ctx, r.repl_ctx, r.pat_md, r.pat_html
      from _seo_link_eval e join _seo_link_rules r using (rule_id)
      where e.t = fld.t and e.rid = fld.rid and e.col = fld.col
      order by e.rule_id
    loop
      if lr.ins then
        insert into public.seo_repair_skip_log (run_id, rule_id, table_name, row_id, slug, column_name, reason)
        values (v_run, lr.rule_id, fld.t, fld.rid, v_slug, fld.col,
                'link sits in a paragraph or list item mentioning insurance/liability/coverage/claims/damage: not changed, pending Derek');
        continue;
      end if;
      if lr.action = 'REWRITE' then
        v_n := (select count(*) from regexp_matches(v_val, lr.pat_ctx, 'g'));
        v_new := regexp_replace(v_val, lr.pat_ctx, lr.repl_ctx, 'g');
      else
        v_n := (select count(*) from regexp_matches(v_val, lr.pat_md, 'g'))
             + (select count(*) from regexp_matches(v_val, lr.pat_html, 'g'));
        v_new := regexp_replace(regexp_replace(v_val, lr.pat_md, '\1', 'g'), lr.pat_html, '\1', 'g');
      end if;
      v_left := (select count(*) from regexp_matches(v_new, lr.pat_ctx, 'g'));
      if v_left > 0 then
        insert into public.seo_repair_skip_log (run_id, rule_id, table_name, row_id, slug, column_name, reason)
        values (v_run, lr.rule_id, fld.t, fld.rid, v_slug, fld.col,
                format('%s occurrence(s) in a form this rule does not rewrite (e.g. image or nested link) left unchanged', v_left));
      end if;
      if v_n > 0 and v_new is distinct from v_val then
        insert into public.seo_repair_change_log
          (run_id, rule_id, table_name, row_id, slug, column_name, old_md5, new_md5, occurrences)
        values (v_run, lr.rule_id, fld.t, fld.rid, v_slug, fld.col, md5(v_val), md5(v_new), v_n);
        v_val := v_new;
      end if;
    end loop;

    if v_val is distinct from v_orig then
      -- backup BEFORE the change; one row per field and old value, never overwritten; keeps the row's updated_at
      insert into public.seo_repair_backup_20261115 (table_name, row_id, column_name, old_value, old_md5, old_updated_at, run_id)
      values (fld.t, fld.rid, fld.col, v_orig, md5(v_orig), v_row_upd, v_run)
      on conflict (table_name, row_id, column_name, old_md5) do nothing;
      execute format('update public.%I set %I = $1 where id = $2::uuid and md5(%I) = $3', fld.t, fld.col, fld.col)
        using v_val, fld.rid, md5(v_orig);
      get diagnostics v_rows = row_count;
      if v_rows <> 1 then
        raise exception 'SEO repair: guarded update of %.% id % touched % rows; aborting', fld.t, fld.col, fld.rid, v_rows;
      end if;
      v_fields := v_fields + 1;
    end if;
  end loop;
  insert into _seo_run_stats values (v_fields, v_done, v_skipf);
  raise notice 'SEO repair run %: % field(s) changed, % already applied by an earlier run (not logged), % skipped by the field guard',
    v_run, v_fields, v_done, v_skipf;
end
$apply$;
"""

ROLLBACK_SQL = r"""\set ON_ERROR_STOP on
-- Optional: roll back one apply run only:  psql ... -v only_run=apply-YYYYMMDDTHHMMSSZ-<txid> -f rollback.sql
-- Without it, every change not yet rolled back is considered. Either way a field is restored only when its current
-- md5 equals the md5 that run wrote last, so a field a later run or a person changed is skipped, never overwritten.
\if :{?only_run}
\else
\set only_run ''
\endif
begin;
set local statement_timeout = '60min';
set local lock_timeout = '15s';

create table if not exists public.seo_repair_rollback_log (
  id           bigserial primary key,
  rollback_run text not null,
  table_name   text not null,
  row_id       text not null,
  slug         text,
  column_name  text not null,
  status       text not null,
  reason       text,
  logged_at    timestamptz not null default now()
);
alter table public.seo_repair_rollback_log enable row level security;
do $rbgrants$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on public.seo_repair_rollback_log from %I', r);
    end if;
  end loop;
end
$rbgrants$;

create temp table _seo_rb_run on commit drop as
select 'rollback-' || to_char(now() at time zone 'utc', 'YYYYMMDD"T"HH24MISS"Z"') || '-' || txid_current()::text as run_id,
       nullif(:'only_run', '')::text as only_run;

do $rb$
declare
  v_run   text := (select run_id from _seo_rb_run);
  v_only  text := (select only_run from _seo_rb_run);
  f       record;
  e       record;
  v_first text;
  v_last  text;
  v_slug  text;
  v_ok    boolean;
  v_why   text;
  v_val   text;
  v_bak   text;
  v_rows  int;
  v_rest  int := 0;
  v_skip  int := 0;
begin
  if to_regclass('public.seo_repair_change_log') is null or to_regclass('public.seo_repair_backup_20261115') is null then
    raise notice 'SEO repair rollback: no change log or backup table (apply never committed); nothing to roll back';
    return;
  end if;
  if v_only is not null and not exists (select 1 from public.seo_repair_change_log where run_id = v_only) then
    raise notice 'SEO repair rollback: run % has no logged changes; nothing to roll back', v_only;
  end if;
  for f in
    select distinct table_name, row_id, column_name
    from public.seo_repair_change_log where rolled_back_at is null and (v_only is null or run_id = v_only)
    order by 1, 2, 3
  loop
    v_first := null; v_last := null; v_ok := true; v_why := null; v_slug := null;
    for e in
      select * from public.seo_repair_change_log
      where table_name = f.table_name and row_id = f.row_id and column_name = f.column_name and rolled_back_at is null
        and (v_only is null or run_id = v_only)
      order by id
    loop
      if v_first is null then
        v_first := e.old_md5;
      elsif e.old_md5 <> v_last then
        v_ok := false;
        v_why := 'change chain broken: the field was edited between two logged changes; restore by hand from the backup table';
      end if;
      v_last := e.new_md5;
      v_slug := coalesce(e.slug, v_slug);
    end loop;

    execute format('select %I from public.%I where id = $1::uuid for update', f.column_name, f.table_name)
      into v_val using f.row_id;
    get diagnostics v_rows = row_count;  -- EXECUTE does not set FOUND
    if v_rows = 0 then
      v_ok := false; v_why := 'row no longer exists';
    elsif v_ok and md5(v_val) is distinct from v_last then
      v_ok := false; v_why := 'field was edited after apply, or a later run changed it (current md5 differs from the md5 this run wrote); left as is';
    end if;
    if v_ok then
      select old_value into v_bak from public.seo_repair_backup_20261115
      where table_name = f.table_name and row_id = f.row_id and column_name = f.column_name and old_md5 = v_first;
      if not found then
        v_ok := false; v_why := 'no backup row with the md5 of the value before the first change';
      end if;
    end if;

    if v_ok then
      execute format('update public.%I set %I = $1 where id = $2::uuid and md5(%I) = $3',
                     f.table_name, f.column_name, f.column_name)
        using v_bak, f.row_id, v_last;
      get diagnostics v_rows = row_count;
      if v_rows <> 1 then
        raise exception 'SEO repair rollback: guarded restore of %.% id % touched % rows; aborting',
          f.table_name, f.column_name, f.row_id, v_rows;
      end if;
      update public.seo_repair_change_log set rolled_back_at = now()
      where table_name = f.table_name and row_id = f.row_id and column_name = f.column_name and rolled_back_at is null
        and (v_only is null or run_id = v_only);
      insert into public.seo_repair_rollback_log (rollback_run, table_name, row_id, slug, column_name, status)
      values (v_run, f.table_name, f.row_id, v_slug, f.column_name, 'restored');
      v_rest := v_rest + 1;
    else
      insert into public.seo_repair_rollback_log (rollback_run, table_name, row_id, slug, column_name, status, reason)
      values (v_run, f.table_name, f.row_id, v_slug, f.column_name, 'skipped', v_why);
      v_skip := v_skip + 1;
    end if;
  end loop;
  raise notice 'SEO repair rollback %: % field(s) restored, % skipped', v_run, v_rest, v_skip;
end
$rb$;

\echo '=== rollback: fields restored / skipped (this run) ==='
select status, count(*) as fields
from public.seo_repair_rollback_log where rollback_run = (select run_id from _seo_rb_run)
group by status order by status;

\echo '=== rollback: skipped fields and why ==='
select table_name, row_id, slug, column_name, reason
from public.seo_repair_rollback_log
where rollback_run = (select run_id from _seo_rb_run) and status = 'skipped'
order by table_name, slug, column_name;

select to_regclass('public.seo_repair_change_log') is not null as seo_has_change_log \gset
\if :seo_has_change_log
\echo '=== rollback: restored changes per rule (this run) ==='
select rule_id, count(*) as fields
from public.seo_repair_change_log
where rolled_back_at = now()
group by rule_id order by rule_id;
\else
\echo '=== rollback: no change log table; apply never committed ==='
\endif

commit;
"""


def pins_table_sql(pins):
    return ("create temp table _seo_pins (t text, rid text, col text, md5 text, primary key (t, rid, col)) on commit drop;\n" +
            ("insert into _seo_pins (" + PIN_COLS + ") values\n" + pin_values(pins) + ";\n" if pins else ""))


def apply_sql(link_rules, fee_rules, pins):
    cols = needed_columns(fee_rules)
    return header("APPLY (one transaction)", fee_rules, link_rules, pins) + """
\\set ON_ERROR_STOP on
begin;
set local statement_timeout = '60min';
set local lock_timeout = '15s';

-- 0. preflight: every column this script writes exists and is text; ids are uuid; slug and updated_at exist
""" + preflight_sql(cols) + """
-- 1. backup and log tables (created once; never dropped or truncated by this script)
""" + LOG_TABLES_SQL + """
-- 2. this run
create temp table _seo_run on commit drop as
select 'apply-' || to_char(now() at time zone 'utc', 'YYYYMMDD"T"HH24MISS"Z"') || '-' || txid_current()::text as run_id;
create temp table _seo_run_stats (fields_changed int, fields_already_applied int, fields_skipped_by_pin int) on commit drop;

-- 3. rules (data generated from the reviewed CSVs) and the field md5 pins (PENDING-READS P1)
create temp table _seo_link_rules (rule_id text primary key, form text, path text, action text, old_target text,
  dest text, exp_present int, exp_ins int, exp_change int, tol int, pat_ctx text, repl_ctx text, pat_md text,
  pat_html text) on commit drop;
""" + ("insert into _seo_link_rules (" + LINK_COLS + ") values\n" + link_values(link_rules) + ";\n"
       if link_rules else "") + """
create temp table _seo_fee_rules (rule_id text primary key, t text, rid text, slug text, col text, ord int,
  category text, old_text text, old_md5 text, new_text text, pin text) on commit drop;
""" + ("insert into _seo_fee_rules (" + FEE_COLS + ") values\n" + fee_values(fee_rules) + ";\n"
       if fee_rules else "") + pins_table_sql(pins) + """
-- 4. evaluation against the live data (the same queries as dry-run.sql)
create temp table _seo_link_eval on commit drop as
""" + link_eval_sql() + """;
create temp table _seo_fee_eval on commit drop as
""" + fee_eval_sql(fee_rules) + """;
create temp table _seo_prior on commit drop as
select rule_id, count(*)::int as n
from (select distinct rule_id, table_name, row_id, column_name
      from public.seo_repair_change_log where rolled_back_at is null) d
group by rule_id;

-- 5. count guard, field guard, backup, apply, log
""" + APPLY_DO + """
-- 6. summary: rows changed per rule in this run
\\echo '=== apply: fields changed per rule (this run) ==='
select l.rule_id, l.kind, l.label, l.expected,
       coalesce(c.fields, 0) as fields_changed, coalesce(c.occ, 0) as occurrences, coalesce(s.skipped, 0) as skipped
from (select rule_id, 'link ' || action as kind,
             old_target || ' -> ' || coalesce(nullif(dest, ''), '(unlink)') as label, exp_present as expected
      from _seo_link_rules
      union all
      select rule_id, 'fee ' || category, slug || ' / ' || col, 1 from _seo_fee_rules) l
left join (select rule_id, count(*) as fields, sum(occurrences) as occ from public.seo_repair_change_log
           where run_id = (select run_id from _seo_run) group by rule_id) c using (rule_id)
left join (select rule_id, count(*) as skipped from public.seo_repair_skip_log
           where run_id = (select run_id from _seo_run) group by rule_id) s using (rule_id)
order by l.rule_id;

\\echo '=== apply: totals (this run) ==='
select (select run_id from _seo_run) as run_id,
       (select count(*) from public.seo_repair_change_log where run_id = (select run_id from _seo_run)) as field_changes,
       (select count(distinct (table_name, row_id, column_name)) from public.seo_repair_change_log
         where run_id = (select run_id from _seo_run)) as fields_changed,
       (select count(*) from public.seo_repair_backup_20261115 where run_id = (select run_id from _seo_run)) as backups_written,
       (select count(*) from public.seo_repair_skip_log where run_id = (select run_id from _seo_run)) as skips_logged,
       (select fields_already_applied from _seo_run_stats) as fields_already_applied_not_logged,
       (select fields_skipped_by_pin from _seo_run_stats) as fields_skipped_by_field_guard;

\\echo '=== apply: skip reasons (this run) ==='
select reason, count(*) from public.seo_repair_skip_log where run_id = (select run_id from _seo_run)
group by reason order by 2 desc, 1;

commit;
"""


def dry_run_sql(link_rules, fee_rules, pins):
    cols = needed_columns(fee_rules)
    colvals = ",\n    ".join("(%s, %s)" % (lit(t), lit(c)) for t, c in cols)
    lv = link_values(link_rules) if link_rules else (
        "(null::text, null::text, null::text, null::text, null::text, null::text, 0, 0, 0, 0, null::text, null::text, "
        "null::text, null::text)")
    fv = fee_values(fee_rules) if fee_rules else (
        "(null::text, null::text, null::text, null::text, null::text, 0, null::text, null::text, null::text, null::text, "
        "null::text)")
    pv = pin_values(pins) if pins else "(null::text, null::text, null::text, null::text)"
    # without pins (the checked-in copy) the field guard is not evaluated: every field counts as matching
    pin_ok = "(e.pin = e.cur_md5)" if pins else "true"
    pin_bad = "(e.pin is distinct from e.cur_md5)" if pins else "false"
    prior = """select split_part(x, ':', 1) as rule_id, split_part(x, ':', 2)::int as n
  from unnest(string_to_array(
    case when to_regclass('public.seo_repair_change_log') is null then ''
         else coalesce((xpath('/row/j/text()', query_to_xml(
           'select string_agg(rule_id || '':'' || n, '','') as j from (select rule_id, count(*) as n from '
           || '(select distinct rule_id, table_name, row_id, column_name from public.seo_repair_change_log '
           || 'where rolled_back_at is null) d group by rule_id) x', false, true, '')))[1]::text, '') end, ',')) x
  where x <> ''"""
    link_ctes = """with _seo_link_rules (""" + LINK_COLS + """) as (values
""" + lv + """
),
_seo_pins (""" + PIN_COLS + """) as (values
""" + pv + """
),
_seo_link_eval as (
""" + link_eval_sql() + """
)"""
    fee_ctes = """with _seo_fee_rules (""" + FEE_COLS + """) as (values
""" + fv + """
),
_seo_fee_eval as (
""" + fee_eval_sql(fee_rules) + """
)"""
    return "set transaction read only;\n" + header("DRY RUN (read-only)", fee_rules, link_rules, pins,
                  "-- run: psql -X -1 -v ON_ERROR_STOP=1 -f dry-run.sql > dry-run-<date>.txt   (-1 makes the first line effective)\n") + """

\\echo '=== pins this dry run was built with (apply.sql built from the same pins prints the same digest) ==='
select """ + lit(pins_digest(pins)) + """ as pin_set_sha256, """ + str(len(pins or {})) + """ as pinned_fields, """ + \
        ("'field guard evaluated'" if pins else "'UNPINNED: field guard not evaluated; build with --pins for the reviewed dry run'") + """ as note;

\\echo '=== preflight: columns this change writes (must be text), ids (must be uuid), updated_at ==='
select n.t as table_name, n.c as column_name, coalesce(ic.data_type, 'MISSING') as data_type
from (values
    """ + colvals + """) n(t, c)
left join information_schema.columns ic
  on ic.table_schema = 'public' and ic.table_name = n.t and ic.column_name = n.c
union all
select ic.table_name, ic.column_name, ic.data_type from information_schema.columns ic
where ic.table_schema = 'public' and ic.table_name in ('content_pages', 'blog_posts') and ic.column_name in ('id', 'updated_at')
order by 1, 2;

\\echo '=== preflight: triggers that will fire on update ==='
select event_object_table as table_name, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public' and event_object_table in ('content_pages', 'blog_posts')
order by 1, 2, 4;

\\echo '=== link rules: fields per rule today (verdict uses the same count guard as apply.sql) ==='
""" + link_ctes + """,
_seo_prior as (
  """ + prior + """
),
agg as (
  select r.rule_id, r.action, r.old_target, coalesce(nullif(r.dest, ''), '(unlink)') as dest,
         r.exp_present, r.tol,
         count(e.rule_id)::int as present_rows,
         (count(*) filter (where e.handled > 0 and not e.ins and """ + pin_ok + """))::int as would_change,
         (count(*) filter (where e.handled > 0 and not e.ins and """ + pin_bad + """))::int as field_guard_skip,
         (count(*) filter (where e.ins))::int as insurance_skip,
         (count(*) filter (where e.present > e.handled and not e.ins))::int as unsupported_form_rows,
         coalesce(sum(e.handled) filter (where not e.ins and """ + pin_ok + """), 0)::int as occurrences,
         coalesce((select p.n from _seo_prior p where p.rule_id = r.rule_id), 0)::int as already_applied
  from _seo_link_rules r left join _seo_link_eval e on e.rule_id = r.rule_id
  where r.rule_id is not null
  group by r.rule_id, r.action, r.old_target, r.dest, r.exp_present, r.tol
)
select rule_id, action, old_target, dest, exp_present as expected_present_20261115, present_rows as present_now,
       would_change, field_guard_skip, insurance_skip, already_applied, unsupported_form_rows, occurrences,
       case when abs(would_change + insurance_skip + already_applied - exp_present) <= tol then 'ok'
            else 'OUT OF TOLERANCE (apply aborts)' end as verdict
from agg
order by rule_id;

\\echo '=== link fields left alone for Derek: the link sits in a paragraph or list item about insurance/liability/coverage/claims/damage ==='
""" + link_ctes + """
select e.rule_id, r.old_target, e.t as table_name, e.slug, e.col as column_name
from _seo_link_eval e join _seo_link_rules r using (rule_id)
where e.ins
order by r.old_target, e.slug, e.col;

\\echo '=== link fields the field guard will skip (changed since the pin read, or not in it) ==='
""" + link_ctes + """
select e.rule_id, r.old_target, e.t as table_name, e.slug, e.col as column_name,
       case when e.pin is null then 'not in pin read' else 'changed since pin read' end as why
from _seo_link_eval e join _seo_link_rules r using (rule_id)
where e.handled > 0 and not e.ins and """ + pin_bad + """
order by r.old_target, e.slug, e.col;

\\echo '=== fee rules: summary ==='
""" + fee_ctes + """,
st as (
  select e.*,
         case when not e.lit_ok then 'LITERAL DAMAGED'
              when not e.row_found then 'row missing'
              when not e.has_val then 'field is null'
              when e.occ = 0 then 'old_text absent (changed since snapshot, or already applied)'
              when e.occ > 1 then 'old_text occurs more than once'
              when e.pin is null then 'ok, but UNPINNED (apply refuses until pinned)'
              when e.pin <> e.cur_md5 then 'field md5 differs from pin'
              else 'ok' end as status
  from _seo_fee_eval e where e.rule_id is not null
)
select status, count(*) as fee_rules, count(distinct (t, rid, col)) as fields
from st group by status order by status;

\\echo '=== fee rules that would not apply today (none listed = all apply) ==='
""" + fee_ctes + """
select rule_id, slug, col, occ, row_found, has_val, (pin is not null and pin = cur_md5) as pin_ok
from _seo_fee_eval
where rule_id is not null and not (lit_ok and has_val and occ = 1 and (pin is null or pin = cur_md5))
order by rule_id;
"""


def verify_sql(link_rules, fee_rules, pins):
    """read-only: fields whose value is no longer what the repair wrote (a stale writer may have put old text back)"""
    cols = needed_columns(fee_rules)
    ccase = " ".join("when %s then c.%s" % (lit(c), c) for t, c in cols if t == "content_pages")
    bcase = " ".join("when %s then b.%s" % (lit(c), c) for t, c in cols if t == "blog_posts")
    return "set transaction read only;\n" + header("VERIFY after apply (read-only)", fee_rules, link_rules, pins,
        "-- run right after apply, again about an hour later and the next day:\n"
        "--   psql -X -1 -v ON_ERROR_STOP=1 -f verify.sql > verify-<ts>.txt\n") + """
select to_regclass('public.seo_repair_change_log') is not null as seo_has_change_log \\gset
\\if :seo_has_change_log
\\echo '=== repaired fields whose current value differs from the value the repair wrote (expect 0 rows) ==='
with last as (
  select distinct on (table_name, row_id, column_name) table_name, row_id, column_name, slug, new_md5, run_id
  from public.seo_repair_change_log where rolled_back_at is null
  order by table_name, row_id, column_name, id desc
)
select l.table_name, l.slug, l.column_name, l.run_id,
       case when c.id is null and b.id is null then 'row gone' else 'value changed after the repair' end as state
from last l
left join public.content_pages c on l.table_name = 'content_pages' and c.id = l.row_id::uuid
left join public.blog_posts b on l.table_name = 'blog_posts' and b.id = l.row_id::uuid
where md5(case l.table_name when 'content_pages' then (case l.column_name """ + ccase + """ end)
                            when 'blog_posts' then (case l.column_name """ + (bcase or "when '' then null") + """ end) end)
      is distinct from l.new_md5
order by 1, 2, 3;
\\echo '=== repaired fields: total / unchanged since the repair ==='
with last as (
  select distinct on (table_name, row_id, column_name) table_name, row_id, column_name, new_md5
  from public.seo_repair_change_log where rolled_back_at is null
  order by table_name, row_id, column_name, id desc
)
select count(*) as repaired_fields,
       count(*) filter (where md5(case l.table_name when 'content_pages' then (case l.column_name """ + ccase + """ end)
                            when 'blog_posts' then (case l.column_name """ + (bcase or "when '' then null") + """ end) end) = l.new_md5)
         as unchanged_since_repair
from last l
left join public.content_pages c on l.table_name = 'content_pages' and c.id = l.row_id::uuid
left join public.blog_posts b on l.table_name = 'blog_posts' and b.id = l.row_id::uuid;
\\else
\\echo '=== no change log table: apply never committed ==='
\\endif
"""


def pin_queries(by_field):
    keys = sorted(by_field)
    out = []
    nb = (len(keys) + PIN_BATCH - 1) // PIN_BATCH
    for b in range(0, len(keys), PIN_BATCH):
        chunk = keys[b:b + PIN_BATCH]
        cols = {}
        for t, _, c in chunk:
            cols.setdefault(t, set()).add(c)
        branches = []
        for t in sorted(cols):
            branches.append("  left join public.%s x_%s on k.t = %s and x_%s.id = k.rid::uuid" % (t, t, lit(t), t))
        exprs = []
        for t in sorted(cols):
            cases = " ".join("when %s then x_%s.%s" % (lit(c), t, c) for c in sorted(cols[t]))
            exprs.append("when %s then (case k.col %s end)" % (lit(t), cases))
        vals = ",\n".join("(%s, %s, %s)" % (lit(t), lit(r), lit(c)) for t, r, c in chunk)
        n = b // PIN_BATCH + 1
        out.append(("p1_fee_field_pins_%02d.sql" % n, """set transaction read only;
-- PENDING-READS P1 (fee fields), batch %d of %d: md5 of the current value of every field a fee rule changes.
-- run: psql -X -q -A -t -F "$(printf '\\t')" -1 -f pending/p1_fee_field_pins_%02d.sql > pins/p1_fee_field_pins_%02d.tsv
-- output: table <TAB> row_id <TAB> column <TAB> md5 (empty when the row or the field is gone)
select k.t, k.rid, k.col, coalesce(md5(case k.t %s end), '') as field_md5
from (values
%s
) k(t, rid, col)
%s
order by 1, 2, 3;
""" % (n, nb, n, n, " ".join(exprs), vals, "\n".join(branches))))
    return out


def link_pin_queries(link_rules):
    """P1 for link fields: md5 of every field that holds a link to a target of a link rule (sharded by row id)"""
    vals = ",\n".join("(%s, %s)" % (lit(x["form"]), lit(x["path"])) for x in link_rules)
    out = []
    for n, shard in enumerate(LINK_PIN_SHARDS, 1):
        out.append(("p1_link_field_pins_%02d.sql" % n, """set transaction read only;
-- PENDING-READS P1 (link fields), shard %d of %d (row ids starting with %s): md5 of the current value of every
-- content / body_markdown / blog_posts field that holds a link to one of the %d link-rule targets.
-- run: psql -X -q -A -t -F "$(printf '\\t')" -1 -f pending/p1_link_field_pins_%02d.sql > pins/p1_link_field_pins_%02d.tsv
-- output: table <TAB> row_id <TAB> column <TAB> md5
with _seo_link_rules (form, path) as (values
%s
)
select distinct k.t, k.rid, k.col, md5(k.val) as field_md5
from (
%s
) k
join _seo_link_rules r on r.form = k.form and r.path = k.path
order by 1, 2, 3;
""" % (n, len(LINK_PIN_SHARDS), "/".join(shard), len(link_rules), n, n, vals, link_fields_sql(shard))))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pins", "--fee-pins", dest="pins", nargs="*",
                    help="TSV file(s) or directory from PENDING-READS P1 (fee and link field pins)")
    ap.add_argument("--verified-only", action="store_true",
                    help="leave out fee rows whose verified column is not YES (fees/README.md section 6, strict reading)")
    ap.add_argument("--expected", help="TSV rule_id<TAB>expected (test only)")
    ap.add_argument("--out", default=HERE)
    a = ap.parse_args()

    override = {}
    if a.expected:
        for line in open(a.expected, encoding="utf-8"):
            if line.strip():
                k, v = line.rstrip("\n").split("\t")
                override[k] = int(v)
    pins = load_pins(a.pins)
    link_rules, link_ex = load_links(override)
    fee_rules, fee_ex, by_field = load_fees(pins, a.verified_only)
    ids = [x["rule_id"] for x in link_rules + fee_rules] + [x[1] for x in link_ex + fee_ex]
    assert len(ids) == len(set(ids)), "rule id collision"
    for x in link_rules:
        for k in ("pat_ctx", "pat_md", "pat_html", "repl_ctx", "old_target", "dest", "path"):
            lit(x[k])

    out = a.out
    write(os.path.join(out, "apply.sql"), apply_sql(link_rules, fee_rules, pins))
    write(os.path.join(out, "dry-run.sql"), dry_run_sql(link_rules, fee_rules, pins))
    write(os.path.join(out, "rollback.sql"), header("ROLLBACK (one transaction)", fee_rules, link_rules, pins) + "\n" +
          ROLLBACK_SQL)
    write(os.path.join(out, "verify.sql"), verify_sql(link_rules, fee_rules, pins))
    pend = os.path.join(out, "pending")
    if os.path.isdir(pend):
        for fn in os.listdir(pend):
            if fn.startswith("p1_") and fn.endswith(".sql"):
                os.remove(os.path.join(pend, fn))
    for fn, q in pin_queries(by_field) + link_pin_queries(link_rules):
        write(os.path.join(pend, fn), q)

    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(["rule_id", "kind", "source", "action_or_category", "target_or_slug", "column", "destination_or_new",
                "expected_fields_present_20261115", "tolerance", "insurance_sentence_rows_20261115",
                "content_rows", "body_markdown_rows", "blog_posts_rows", "verified"])
    for x in link_rules:
        w.writerow([x["rule_id"], "link", x["src"], x["action"], x["old_target"], "", x["dest"] or "(unlink)",
                    x["exp_present"], x["tol"], x["exp_ins"], x["cols"]["content"],
                    x["cols"]["body_markdown"], x["cols"]["blog"], ""])
    for x in fee_rules:
        w.writerow([x["rule_id"], "fee", x["src"], "FIX " + x["category"], x["slug"], x["col"],
                    "see fee-corrections.csv", 1, "", "", "", "", "", x["verified"]])
    write(os.path.join(out, "rules-manifest.csv"), buf.getvalue())

    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(["kind", "rule_id", "source", "target_or_slug", "column", "action", "why_not_applied"])
    for row in link_ex + fee_ex:
        w.writerow(row)
    write(os.path.join(out, "excluded-pending-derek.csv"), buf.getvalue())

    print("link rules %d (REWRITE %d, UNLINK %d), excluded link targets %d; fee rules %d on %d fields, excluded fee "
          "rows %d; pins %s" % (len(link_rules), sum(1 for x in link_rules if x["action"] == "REWRITE"),
                                sum(1 for x in link_rules if x["action"] == "UNLINK"), len(link_ex), len(fee_rules),
                                len(by_field), len(fee_ex), len(pins) if pins is not None else "no"), file=sys.stderr)


if __name__ == "__main__":
    main()
