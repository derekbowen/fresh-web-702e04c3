"""Compare the SQL plan (cleaner/core.sql, run in a local database) with the Python reference, field by field."""
import json
import os

import reference as R

HERE = os.path.dirname(os.path.abspath(__file__))


def core_text():
    txt = open(os.path.join(HERE, "core.sql"), encoding="utf-8").read()
    return txt.split("\n", 2)[2]  # drop the 2 header comment lines


def sql_plan(cluster, db):
    q = "set jit = off;\nset enable_nestloop = off;\nwith " + core_text() + """
select tbl, row_id::text, col, coalesce(new_text, '\\N'), coalesce(rules, ''), coalesce(skips, ''),
       n_del_sentences, n_del_entries from plan;"""
    out = {}
    for r in cluster.rows(db, q):
        tbl, rid, col, new, rules, skips, nds, nde = r
        out[(tbl, rid, col)] = {"new": None if new == "\\N" else new, "rules": rules,
                                "skips": set(s for s in skips.split("; ") if s), "n_del_sentences": int(nds),
                                "n_del_entries": int(nde)}
    return out


def reference_plan(cities, pools, merges):
    """Expected plan from reference.py. merges: {(state_slug, city_slug): n}."""
    by_city = {c["id"]: c for c in cities}
    actual = {}
    for p in pools:
        if p.get("is_published"):
            actual[p["city_id"]] = actual.get(p["city_id"], 0) + 1
    exp = {}

    def put(tbl, rid, col, d):
        skips = set(f"{k}:{v}" for k, v in d["skips"].items())
        if d["new"] is None and not skips:
            return
        exp[(tbl, rid, col)] = {"new": d["new"], "rules": "+".join(d["rules"]), "skips": skips}
    for p in pools:
        if not p.get("is_published"):
            continue
        c = by_city.get(p["city_id"])
        row = dict(p, state_slug=c["state_slug"] if c else None)
        for col, d in R.plan_pool(row).items():
            put("pp_pools", p["id"], col, d)
    for c in cities:
        if not c.get("is_published"):
            continue
        a = actual.get(c["id"], 0)
        m = merges.get((c["state_slug"], c["city_slug"]))
        for col, d in R.plan_city(c, a, a - m if m is not None else None).items():
            put("pp_cities", c["id"], col, d)
    return exp


def diff(sqlp, refp, limit=20):
    """List of human-readable differences (empty = identical)."""
    out = []
    for key in sorted(set(sqlp) | set(refp)):
        s, r = sqlp.get(key), refp.get(key)
        if s is None or r is None:
            out.append(f"{key}: only in {'reference' if s is None else 'SQL'}: {r if s is None else s}")
            continue
        sn, rn = s["new"], r["new"]
        if key[2] == "ai_faqs" and sn is not None:
            sn = json.loads(sn)
        if sn != rn:
            out.append(f"{key}: new value differs\n   SQL: {str(sn)[:600]}\n   REF: {str(rn)[:600]}")
        if s["rules"] != r["rules"]:
            out.append(f"{key}: rules SQL={s['rules']} REF={r['rules']}")
        if s["skips"] != r["skips"]:
            out.append(f"{key}: skips SQL={sorted(s['skips'])} REF={sorted(r['skips'])}")
    return out
