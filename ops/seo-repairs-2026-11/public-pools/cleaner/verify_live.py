#!/usr/bin/env python3
"""Compare live pages with the values an apply run wrote (files only; no network, no database).

    python3 -I cleaner/verify_live.py verify-expected.csv verify-pages.jsonl

verify-expected.csv  from verify-live.sql (url, tbl, col, rule_id, new_value, old_value)
verify-pages.jsonl   from text-defects/extract_live.py run on the same URLs (GET only, < 2 requests/s)

For every changed field it prints NEW (the page shows the new value), OLD (the page still shows the old value:
cache, a copy of the data, or pp-ssr not reading this database), or NEITHER (something else), using the same
field mapping that matched the 2026-11-15 extract byte for byte: "Best for:" text = ai_best_for, the About
paragraphs joined by a blank line = ai_description, the <details> question/answer pairs = the FAQ entries with a
string answer, the city text after the header sentence = ai_intro. Exit code 0 only if every field is NEW.
"""
import csv
import json
import sys

csv.field_size_limit(10 ** 8)


def page_value(rec, col):
    if col == "ai_best_for":
        return rec.get("best_for")
    if col == "ai_description":
        return "\n\n".join(rec["about"]) if rec.get("about") else None
    if col == "ai_intro":
        return rec.get("intro")
    if col == "ai_faqs":
        return [(e.get("q"), e.get("a")) for e in rec.get("faqs") or []]
    return None


def db_value(v, col):
    if v is None:
        return None
    if col == "ai_faqs":
        return [(e.get("q"), e.get("a").strip()) for e in json.loads(v)
                if isinstance(e, dict) and isinstance(e.get("a"), str)]
    return v.strip()


def classify(rec, row):
    if rec is None or rec.get("status") != "200":
        return "NO_PAGE"
    got = page_value(rec, row["col"])
    if got is not None and row["col"] != "ai_faqs":
        got = got.strip()
    if got == db_value(row["new_value"], row["col"]):
        return "NEW"
    if got == db_value(row["old_value"], row["col"]):
        return "OLD"
    return "NEITHER"


def main(exp_path, pages_path):
    pages = {}
    for line in open(pages_path, encoding="utf-8"):
        r = json.loads(line)
        pages[r["url"]] = r
    counts = {}
    rows = list(csv.DictReader(open(exp_path, encoding="utf-8", newline="")))
    for row in rows:
        c = classify(pages.get(row["url"]), row)
        counts[c] = counts.get(c, 0) + 1
        if c != "NEW":
            print(f"{c:8s} {row['tbl']}.{row['col']} {row['rule_id']} {row['url']}")
    print("summary:", json.dumps(counts, sort_keys=True), "of", len(rows), "fields")
    return 0 if counts.get("NEW", 0) == len(rows) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
