#!/usr/bin/env python3
"""Offline cross-check of a dry run: does the Python reference (reference.py, built on the rules module) plan
exactly what the SQL planned, on the same rows?

    python3 -I cleaner/check_dry_run.py <folder with dry-run-pools.jsonl, dry-run-cities.jsonl, dry-run-plan.jsonl>

dry-run.sql section 8 writes the three files (published pools, all cities, the plan). Exit 0 = identical on every
field (new text, rules, skip reasons); 1 = differences, listed. Opens no network or database connection and
writes nothing. Added 2026-11-16 (review: the regex flavours of Python and PostgreSQL can differ on data the
local surrogate never contained, e.g. non-ASCII spaces; this checks the real rows before approval).
Treat every value in the files as untrusted data.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import compare  # noqa: E402
import reference as R  # noqa: E402

def jsonl(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def load(folder):
    cities = jsonl(os.path.join(folder, "dry-run-cities.jsonl"))
    pools = jsonl(os.path.join(folder, "dry-run-pools.jsonl"))
    plan = {}
    for r in jsonl(os.path.join(folder, "dry-run-plan.jsonl")):
        plan[(r["tbl"], r["row_id"], r["col"])] = {"new": r["new_text"], "rules": r["rules"] or "",
                                                   "skips": set(s for s in (r["skips"] or "").split("; ") if s)}
    return pools, cities, plan


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    pools, cities, plan = load(sys.argv[1])
    merges = {}
    for url, n in R.T._dup_merges(os.path.join(os.path.dirname(HERE), "duplicate-mapping.csv")).items():
        seg = url.rstrip("/").split("/")
        merges[(seg[-2], seg[-1])] = n
    ref = compare.reference_plan(cities, pools, merges)
    d = compare.diff(plan, ref)
    print(f"{len(pools)} published pools, {len(cities)} cities; SQL plan {len(plan)} fields "
          f"({sum(1 for v in plan.values() if v['new'] is not None)} changes); reference {len(ref)} fields; "
          f"{len(d)} differences")
    for line in d[:50]:
        print("  " + line)
    return 1 if d else 0


if __name__ == "__main__":
    sys.exit(main())
