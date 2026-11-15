#!/usr/bin/env python3
"""Summarise crawl.jsonl by sitemap group. Read-only analysis of our own crawl."""
import json, re, collections, statistics, sys
rows = [json.loads(l) for l in open("crawl.jsonl")]
def norm(u):
    return (u or "").strip()
def grp(r):
    s = r["sitemaps"].split(",")[0]
    return re.sub(r"\?page=\d+", "", s)
G = collections.defaultdict(list)
for r in rows: G[grp(r)].append(r)
print(f"rows {len(rows)}")
hdr = f"{'group':38s} {'n':>5s} {'non200':>6s} {'canon≠url':>9s} {'nocanon':>7s} {'noindex':>7s} {'xrobots':>7s} {'med_w':>5s} {'<150w':>5s} {'<300w':>5s} {'dupTxt':>6s} {'dupTitle':>8s} {'noPriv':>6s} {'maint':>5s} {'listLk0':>7s}"
print(hdr)
tot = collections.Counter()
for g, rs in sorted(G.items(), key=lambda kv: -len(kv[1])):
    n = len(rs)
    non200 = sum(1 for r in rs if r["status"] != 200)
    cm = sum(1 for r in rs if r.get("canonical") and norm(r["canonical"]) != norm(r["url"]))
    nc = sum(1 for r in rs if r["status"] == 200 and not r.get("canonical"))
    ni = sum(1 for r in rs if "noindex" in (r.get("meta_robots") or "").lower())
    xr = sum(1 for r in rs if "noindex" in (r.get("x-robots-tag") or "").lower())
    w = [r.get("words") or 0 for r in rs if r["status"] == 200]
    sha = collections.Counter(r.get("text_sha1") for r in rs if r.get("text_sha1"))
    dupt = sum(c for c in sha.values() if c > 1)
    tit = collections.Counter((r.get("title") or "").strip().lower() for r in rs)
    dupti = sum(c for t, c in tit.items() if c > 1 and t)
    npv = sum(1 for r in rs if r.get("flag_no_private_pools"))
    mt = sum(1 for r in rs if r.get("flag_maintenance"))
    ll0 = sum(1 for r in rs if r["status"] == 200 and not r.get("listing_links"))
    print(f"{g:38s} {n:5d} {non200:6d} {cm:9d} {nc:7d} {ni:7d} {xr:7d} {int(statistics.median(w)) if w else 0:5d} {sum(1 for x in w if x<150):5d} {sum(1 for x in w if x<300):5d} {dupt:6d} {dupti:8d} {npv:6d} {mt:5d} {ll0:7d}")
print("\nstatus:", collections.Counter(r["status"] for r in rows).most_common())
print("cf-cache-status:", collections.Counter(r.get("cf-cache-status") for r in rows).most_common(6))
secs = sorted(r.get("secs") or 0 for r in rows)
print("secs p50 %.2f p90 %.2f p99 %.2f max %.2f" % (secs[len(secs)//2], secs[int(len(secs)*.9)], secs[int(len(secs)*.99)], secs[-1]))
print("retries:", collections.Counter(r.get("attempts") for r in rows))
# canonical mismatch patterns
pat = collections.Counter()
ex = collections.defaultdict(list)
for r in rows:
    c = r.get("canonical")
    if c and norm(c) != norm(r["url"]):
        u = r["url"]
        if c.rstrip("/") == u.rstrip("/"): k = "trailing slash only"
        elif c.lower() == u.lower(): k = "case only"
        elif re.sub(r"^https?://[^/]+", "", c) == re.sub(r"^https?://[^/]+", "", u): k = "different host: " + re.sub(r"^(https?://[^/]+).*", r"\1", c)
        else: k = "different path"
        pat[(grp(r), k)] += 1
        if len(ex[(grp(r), k)]) < 3: ex[(grp(r), k)].append((u, c))
print("\ncanonical differs from sitemap URL:")
for (g, k), n in pat.most_common(30):
    print(f"  {n:5d} {g} :: {k}")
    for u, c in ex[(g, k)]: print(f"        {u}\n     -> {c}")
print("\nmeta robots values:", collections.Counter((r.get("meta_robots") or "(none)").lower() for r in rows).most_common(8))
print("x-robots-tag values:", collections.Counter((r.get("x-robots-tag") or "(none)").lower() for r in rows).most_common(6))
print("h1 missing:", sum(1 for r in rows if r["status"]==200 and not r.get("h1")), "| multiple h1:", sum(1 for r in rows if (r.get("h1_count") or 0) > 1), "| no <main>:", sum(1 for r in rows if r["status"]==200 and not r.get("has_main")))
print("hreflang tag count distribution:", collections.Counter(r.get("hreflang") for r in rows).most_common(6))
