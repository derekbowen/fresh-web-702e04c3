#!/usr/bin/env python3
"""Report on internal link targets that are not in any sitemap (stage 2 crawl)."""
import json, re, collections
site = "https://www.poolrentalnearme.com"
fam = dict(l.rstrip("\n").split("\t") for l in open("stage2_urls.tsv"))
inl = {}; src = {}
for l in open("link_targets.tsv"):
    u, c, s = l.rstrip("\n").split("\t"); inl[u] = int(c); src[u] = s
rows = [json.loads(l) for l in open("stage2.jsonl")]
in_sm = set(l.split("\t")[0] for l in open("urls.tsv"))
by = collections.defaultdict(list)
for r in rows: by[fam.get(r["url"], "?")].append(r)
print(f"{'family':10s} {'fetched':>7s} {'200':>5s} {'301/302':>7s} {'404/410':>7s} {'other':>5s} {'noindex':>7s} {'canon≠self':>10s} {'inlinks to non-200':>18s}")
for f, rs in sorted(by.items(), key=lambda kv: -len(kv[1])):
    ok = [r for r in rs if r["status"] == 200]; rd = [r for r in rs if r["status"] in (301, 302, 307, 308)]; nf = [r for r in rs if r["status"] in (404, 410)]
    ni = [r for r in ok if "noindex" in ((r.get("meta_robots") or "") + (r.get("x-robots-tag") or "")).lower()]
    cm = [r for r in ok if r.get("canonical") and r["canonical"] != r["url"]]
    bad_in = sum(inl.get(r["url"], 0) for r in rd + nf)
    print(f"{f:10s} {len(rs):7d} {len(ok):5d} {len(rd):7d} {len(nf):7d} {len(rs)-len(ok)-len(rd)-len(nf):5d} {len(ni):7d} {len(cm):10d} {bad_in:18d}")
def show(title, rs, n=8, key=lambda r: -inl.get(r["url"], 0)):
    print("\n" + title)
    for r in sorted(rs, key=key)[:n]:
        print(f"  {r['status']} inlinks={inl.get(r['url'],0):5d} {r['url'].replace(site,'')[:78]} -> {(r.get('location') or '').replace(site,'')[:70]}  (e.g. from {src.get(r['url'],'').replace(site,'')[:45]})")
P = by["p"]
show("/p/ targets that redirect (top by inlinks):", [r for r in P if r["status"] in (301, 302)])
show("/p/ targets that are 404/410 (top by inlinks):", [r for r in P if r["status"] in (404, 410)])
# redirect destination: does it land on a sitemap URL?
rd = [r for r in P if r["status"] in (301, 302)]
dest = collections.Counter("dest in sitemap" if (r.get("location") or "") in in_sm else "dest NOT in sitemap" for r in rd)
print("\n/p/ redirects:", dict(dest))
pat = collections.Counter()
for r in rd:
    a = r["url"].replace(site, ""); b = (r.get("location") or "").replace(site, "")
    if a.replace("_", "-") == b: k = "underscore -> hyphen"
    elif re.sub(r"-[a-z]{2}$", "", b) == a: k = "city -> city-st (state suffix added)"
    elif a.rstrip("/") == b.rstrip("/"): k = "trailing slash"
    elif a.lower() == b.lower(): k = "case"
    elif b.startswith("/p/") and a.split("/")[-1] in b: k = "slug extended"
    else: k = "other"
    pat[k] += 1
print("/p/ redirect patterns:", pat.most_common())
ok = [r for r in P if r["status"] == 200]
print("\n/p/ targets that are 200 but in no sitemap:", len(ok), "| of which noindex:", sum(1 for r in ok if "noindex" in (r.get("meta_robots") or "")), "| canonical elsewhere:", sum(1 for r in ok if r.get("canonical") and r["canonical"] != r["url"]))
show("  top 200-but-not-in-sitemap /p/ pages by inlinks:", ok, 12)
cm = collections.Counter(re.sub(r"^(https?://[^/]+).*", r"\1", r["canonical"]) for r in ok if r.get("canonical") and r["canonical"] != r["url"])
print("  canonical hosts for those:", cm.most_common(5))
PP = by["pp"]
print("\npublic-pools pages linked but not in public-pools.xml:", collections.Counter(r["status"] for r in PP), "| median words", sorted(r.get("words") or 0 for r in PP)[len(PP)//2], "| noindex", sum(1 for r in PP if "noindex" in (r.get("meta_robots") or "")), "| canonical self", sum(1 for r in PP if r.get("canonical") == r["url"]))
show("  examples:", PP, 4)
show("misc targets (non-/p/ paths found in page bodies), non-200:", [r for r in by["misc"] if r["status"] != 200], 14)
print("misc status:", collections.Counter(r["status"] for r in by["misc"]))
show("non-www absolute links:", by["otherhost"], 3)
print("otherhost status:", collections.Counter(r["status"] for r in by["otherhost"]))
for f in ("s", "s?", "u", "l", "p?"):
    rs = by[f]
    print(f"\n[{f}] status {collections.Counter(r['status'] for r in rs)} | x-robots {collections.Counter((r.get('x-robots-tag') or '-') for r in rs).most_common(3)} | meta robots {collections.Counter((r.get('meta_robots') or '-') for r in rs).most_common(3)} | canonical==self {sum(1 for r in rs if r.get('canonical')==r['url'])}/{len(rs)} | maintenance text {sum(1 for r in rs if r.get('flag_maintenance'))} | titles {collections.Counter((r.get('title') or '-')[:50] for r in rs).most_common(2)}")
    if rs: print("   canonical example:", rs[0]["url"].replace(site, "")[:70], "->", (rs[0].get("canonical") or "none").replace(site, "")[:70])
