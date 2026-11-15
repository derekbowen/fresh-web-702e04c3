#!/usr/bin/env python3
"""Internal link targets found on crawled pages: which are not in any sitemap, grouped by family. Writes link_targets.tsv."""
import json, re, collections, sys
site = "https://www.poolrentalnearme.com"
in_sm = set(l.split("\t")[0] for l in open("urls.tsv"))
def absu(h):
    if h.startswith("/"): return site + h
    return h
def fam(u):
    p = re.sub(r"^https?://[^/]+", "", u)
    host = re.sub(r"^(https?://[^/]+).*", r"\1", u)
    if host != site: return "other host: " + host
    path, _, q = p.partition("?")
    segs = path.strip("/").split("/")
    if path.startswith("/s"): return "/s" + ("?…" if q else "")
    if path.startswith("/l/"): return "/l/…"
    if path.startswith("/p/p/"): return "/p/p/…"
    if path.startswith("/p/"): return "/p/…" + ("?…" if q else "")
    if path.startswith("/public-pools"): return "/public-pools/…(%d segs)" % len(segs) + ("?…" if q else "")
    return "/" + segs[0] + ("/…" if len(segs) > 1 else "") + ("?…" if q else "")
inl = collections.Counter(); src = {}
pages = 0
for l in open("texts.jsonl"):
    d = json.loads(l); pages += 1
    for h in d["links"]:
        u = absu(h); inl[u] += 1; src.setdefault(u, d["url"])
print("pages", pages, "distinct internal link targets", len(inl))
not_sm = {u: c for u, c in inl.items() if u not in in_sm and u.rstrip("/") not in in_sm and (u + "/") not in in_sm}
slash_only = [u for u in inl if u not in in_sm and (u.rstrip("/") in in_sm or (u + "/") in in_sm)]
print("targets in a sitemap:", len(inl) - len(not_sm) - 0, "| differ from a sitemap URL only by trailing slash:", len(slash_only), "| not in any sitemap:", len(not_sm))
F = collections.Counter(); FI = collections.Counter(); ex = {}
for u, c in not_sm.items():
    f = fam(u); F[f] += 1; FI[f] += c; ex.setdefault(f, (u, src[u]))
print(f"{'family (not in sitemap)':40s} {'targets':>7s} {'inlinks':>8s}  example  <- linked from")
for f, n in F.most_common(40):
    u, s = ex[f]
    print(f"{f:40s} {n:7d} {FI[f]:8d}  {u.replace(site,'')[:70]}  <- {s.replace(site,'')[:50]}")
with open("link_targets.tsv", "w") as f:
    for u, c in sorted(not_sm.items(), key=lambda kv: -kv[1]): f.write(f"{u}\t{c}\t{src[u]}\n")
# sitemap URLs with no inlinks from any crawled page
orph = [u for u in in_sm if inl.get(u, 0) == 0 and inl.get(u.rstrip("/"), 0) == 0 and inl.get(u + "/", 0) == 0]
print("sitemap URLs with zero internal links from crawled pages (so far):", len(orph), "of", len(in_sm))
