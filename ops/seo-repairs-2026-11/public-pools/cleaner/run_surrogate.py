#!/usr/bin/env python3
"""Run dry-run.sql on the SURROGATE table (live pages of 2026-11-16 rebuilt as rows, see surrogate.py) in a
throwaway local PostgreSQL 16 cluster, and write

    ../dry-run-SURROGATE-live-2026-11-16.txt   the dry-run output (NOT production; header says so)
    ../before-after-sample.md                   15 random fields per rule (same seeded selection as dry-run.sql
                                                section 4) with exact old and new text, and every skipped field

    python3 -I cleaner/run_surrogate.py

No network, no production access; the cluster is removed at the end.
"""
import collections
import json
import os
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
SEED = "2026-11-15"
LIVE = os.path.join(OUT, "text-defects", "live-2026-11-16", "live-fields.jsonl.gz")
DRY_OUT = "dry-run-SURROGATE-live-2026-11-16.txt"

HEADER = """==========================================================================================================
SURROGATE DRY RUN -- NOT PRODUCTION
==========================================================================================================
This is dry-run.sql (core md5 {md5}) run on {when} in a throwaway local PostgreSQL 16 cluster against a
SURROGATE copy of the data: the text fields of the 2,000 pool pages and 476 city pages fetched read-only from
https://www.poolrentalnearme.com/public-pools/ on 2026-11-16T19:36Z-20:05Z (text-defects/live-2026-11-16/),
rebuilt as pp_pools / pp_cities rows by cleaner/surrogate.py. Those rendered fields equalled the production
extract of 2026-11-15 byte for byte wherever compared, but:
  * row_id values below are LOCAL (md5 of the page URL); production ids differ. ref = pool slug or state/city;
  * only rows that have a page in the saved sitemap are present (production: 3,381 pools, 647 cities);
  * published-pool counts per city come from each city page's header ("There are N public swimming pools");
    the pools without a sampled page are text-less local placeholders.
The production dry run could not be run on 2026-11-16 (database tool unavailable). It is PR-6 in
PENDING-READS.md; its output, not this file, is what the owner approves (expected_changes / manifest_md5).
==========================================================================================================

"""


def url_maps(cities, pools):
    city_by_id = {c["id"]: c for c in cities}
    m = {}
    for c in cities:
        if c["url"]:
            m[("pp_cities", c["id"])] = c["url"].replace("https://www.poolrentalnearme.com", "")
    for p in pools:
        if p["url"]:
            m[("pp_pools", p["id"])] = p["url"].replace("https://www.poolrentalnearme.com", "")
    return m, city_by_id


def deleted_sentences(old, new):
    left = collections.Counter(T.split_sentences(new))
    out = []
    for s in T.split_sentences(old):
        if left[s] > 0:
            left[s] -= 1
        else:
            out.append(s)
    return out


def quote(text):
    return "\n".join("> " + (ln if ln.strip() else "") for ln in text.split("\n"))


def faq_block(old, new):
    o, n = json.loads(old), json.loads(new)
    lines = []
    # match entries by their question (entries are only ever deleted or have their answer shortened)
    rest = list(n)
    for e in o:
        q = e.get("q") if isinstance(e, dict) else None
        hit = next((x for x in rest if isinstance(x, dict) and x.get("q") == q), None)
        lines.append(f"- **Q:** {q}")
        if hit is None:
            lines.append("  - **entry deleted** (R5). Old answer:")
            lines.append("\n".join("    " + ln for ln in quote(e.get("a", "")).split("\n")))
            continue
        rest.remove(hit)
        if hit.get("a") == e.get("a"):
            lines.append("  - answer unchanged")
        else:
            lines.append("  - old answer:")
            lines.append("\n".join("    " + ln for ln in quote(e["a"]).split("\n")))
            lines.append("  - new answer:")
            lines.append("\n".join("    " + ln for ln in quote(hit["a"]).split("\n")))
            for s in deleted_sentences(e["a"], hit["a"]):
                lines.append(f"  - deleted: “{s}”")
    return "\n".join(lines)


def main():
    cities, pools = S.build(S.load_live(LIVE))
    urls, _ = url_maps(cities, pools)
    core = compare.core_text()
    import hashlib
    md5 = hashlib.md5(core.encode()).hexdigest()
    cl = pglocal.Cluster(port=55447).start()
    try:
        cl.createdb("sur")
        cl.sql("sur", open(os.path.join(HERE, "schema.sql"), encoding="utf-8").read())
        cl.sql("sur", S.insert_sql(cities, pools))
        path = cl.copy_in(os.path.join(OUT, "dry-run.sql"))
        t0 = time.time()
        r = cl.psql("sur", ["-v", "ON_ERROR_STOP=1", "--single-transaction", "-v", f"seed={SEED}", "-f", path])
        if r.returncode != 0:
            raise SystemExit("dry run failed: " + r.stderr[-2000:])
        when = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        with open(os.path.join(OUT, DRY_OUT), "w", encoding="utf-8") as f:
            f.write(HEADER.format(md5=md5, when=when) + r.stdout)
        print("dry run", round(time.time() - t0), "s ->", DRY_OUT)
        q = ("set jit = off;\nset enable_nestloop = off;\nwith " + core +
             ",\nr(rule) as (values ('R1'), ('R2'), ('R3'), ('R4'), ('R5'), ('R6')),\n"
             "s as (select r.rule, p.*, row_number() over (partition by r.rule order by md5(p.row_id::text || p.col || "
             f"'{SEED}')) n, count(*) over (partition by r.rule) total\n"
             "  from r join plan p on p.new_text is not null and r.rule = any (string_to_array(p.rules, '+')))\n"
             "select rule, n, total, tbl, row_id::text, col, rules, old_text, new_text, n_del_sentences, n_del_entries "
             "from s where n <= 15 order by rule, n;")
        sample = cl.rows("sur", q)
        plan = compare.sql_plan(cl, "sur")
    finally:
        cl.stop()

    by_rule = collections.OrderedDict()
    for row in sample:
        by_rule.setdefault(row[0], []).append(row)
    changed = collections.Counter()
    for (tbl, rid, col), v in plan.items():
        if v["new"] is not None:
            changed[(tbl, col, v["rules"])] += 1
    skips = collections.defaultdict(list)
    for (tbl, rid, col), v in plan.items():
        for s in v["skips"]:
            skips[s].append((urls.get((tbl, rid), "?"), tbl, col, "changed by another rule" if v["new"] else ""))

    md = []
    md.append("# Public-pools text cleaner: before / after sample\n")
    md.append("> **Data source: SURROGATE, NOT PRODUCTION.** The production dry run could not be run on 2026-11-16 "
              "(database tool unavailable; PR-6 in [PENDING-READS.md](PENDING-READS.md)). The rows below are real "
              "text: the fields of the live pages fetched read-only on **2026-11-16** (2,000 pool and 476 city pages "
              "of the saved sitemap), which equalled the production extract of 2026-11-15 byte for byte wherever "
              "compared. They were loaded into a throwaway local PostgreSQL 16 table and run through the SAME SQL as "
              "dry-run.sql (core md5 `" + md5 + "`). The 15 fields per rule were chosen in the database with the "
              "dry run's own seeded selection (`order by md5(row_id || col || '" + SEED + "')`, row ids being local "
              "md5s of the page URL). The production dry run prints the same section (section 4) on production rows; "
              "**that** is the sample to approve. Whether pp-ssr reads this database live is **UNVERIFIED**.\n")
    md.append("Every change below either deletes whole sentences, deletes whole FAQ entries, or re-joins an existing "
              "list (R1). No word is added or reworded. Rules: [rules.json](rules.json), "
              "[TEXT-DEFECTS.md](TEXT-DEFECTS.md); field-level additions A1-A4: [RUNBOOK.md](RUNBOOK.md) section 3.\n")
    md.append("## Totals on the surrogate (2,476 live pages, 2026-11-16)\n")
    md.append("| Table | Column | Rules | Fields changed |\n|---|---|---|---|")
    for (tbl, col, rules), n in sorted(changed.items()):
        md.append(f"| {tbl} | {col} | {rules} | {n:,} |")
    md.append(f"| | | **total** | **{sum(changed.values()):,}** |\n")
    md.append("Fields skipped (a rule would have changed them, a skip condition stopped it), by reason:\n")
    md.append("| Skip | Fields |\n|---|---|")
    for s in sorted(skips, key=lambda k: (-len(skips[k]), k)):
        md.append(f"| `{s}` | {len(skips[s])} |")
    md.append("")
    names = {"R1": "R1: Best-for JSON array becomes a plain list", "R2": "R2: narrator sentences in pool descriptions",
             "R3": "R3: narrator sentences in pool FAQ answers", "R4": "R4: narrator sentences in city intros / FAQ answers",
             "R5": "R5: wholly non-informative FAQ entries", "R6": "R6: pool-count sentences contradicted by the page count"}
    for rule, rows in by_rule.items():
        total = rows[0][2]
        md.append(f"## {names[rule]}\n")
        md.append(f"{len(rows)} of {int(total):,} fields carrying {rule}" +
                  (" (all of them: fewer than 15 exist on the surrogate)" if len(rows) < 15 else "") + ".\n")
        for row in rows:
            _, n, _, tbl, rid, col, rules, old, new, nds, nde = row
            md.append(f"### {rule}.{n} `{tbl}.{col}` {urls.get((tbl, rid), rid)} (rules applied to this field: {rules})\n")
            if col == "ai_faqs":
                md.append(faq_block(old, new) + "\n")
            elif col == "ai_best_for":
                md.append("Before:\n\n" + quote(old) + "\n\nAfter:\n\n" + quote(new) + "\n")
            else:
                md.append("Before:\n\n" + quote(old) + "\n\nAfter:\n\n" + quote(new) + "\n")
                md.append("Deleted sentence(s):\n")
                for s in deleted_sentences(old, new):
                    md.append(f"- “{s}”")
                md.append("")
    md.append("## Every skipped field, with the reason\n")
    md.append("Production row ids come from the production dry run (section 3). Here each field is identified by its "
              "live page. `ALL:` = the field was frozen before any sentence rule ran (insurance word, A3, A4); "
              "`R5:`/`R6:`/`R2:`/`R3:`/`R4:` = that pass was skipped and the field left as the other passes made it. "
              "Reasons: `next_sentence_refers_back` (the next kept sentence starts with It/They/That/So ...), "
              "`deleted_sentence_names_an_entity`, `field_would_be_empty`, `below_min_length` (A1), `paragraph_break` "
              "(A2), `insurance` (a narrator sentence mentions insurance/liability/coverage/claims/damage), "
              "`insurance_anywhere` (A3), `contains_mark` (A4), `empty_list` (R1: `[]`).\n")
    md.append("| Skip | Page | Field | Note |\n|---|---|---|---|")
    for s in sorted(skips):
        for u, tbl, col, note in sorted(skips[s]):
            md.append(f"| `{s}` | {u} | {tbl}.{col} | {note} |")
    md.append("")
    with open(os.path.join(OUT, "before-after-sample.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print("wrote before-after-sample.md:", {k: len(v) for k, v in by_rule.items()}, "skips", sum(len(v) for v in skips.values()))


if __name__ == "__main__":
    main()
