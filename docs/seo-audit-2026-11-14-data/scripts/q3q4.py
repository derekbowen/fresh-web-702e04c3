#!/usr/bin/env python3
"""Q3 (same-city page pairs) and Q4 (zero-inventory vs inventory) from our own crawl. Stdlib only."""
import json, re, collections, statistics, random
random.seed(3)
site = "https://www.poolrentalnearme.com"
crawl = {}
for l in open("crawl.jsonl"):
    r = json.loads(l); crawl[r["url"]] = r
texts = {}; inl = collections.Counter(); outl = {}
for l in open("texts.jsonl"):
    d = json.loads(l); texts[d["url"]] = d["text"]
    tg = set((site + h) if h.startswith("/") else h for h in d["links"])
    outl[d["url"]] = len(tg)
    for t in tg: inl[t] += 1
def sh(t, k=5):
    w = re.findall(r"[a-z0-9$%']+", t.lower())
    return set(hash(" ".join(w[i:i + k])) for i in range(max(1, len(w) - k + 1)))
def jac(a, b):
    A, B = sh(texts[a]), sh(texts[b]); return len(A & B) / max(1, len(A | B))
cities = json.load(open("cities.json"))
pairs = collections.defaultdict(list)
for key, v in cities.items():
    ks = sorted(v)
    for i, a in enumerate(ks):
        for b in ks[i + 1:]:
            if v[a] in texts and v[b] in texts: pairs[(a, b)].append((v[a], v[b]))
print("Q3: same-city page pairs — 5-word-shingle overlap (1.0 = identical text) and identical H1/title rate")
print(f"{'pair':58s} {'cities':>6s} {'p10':>5s} {'p50':>5s} {'p90':>5s} {'sameH1':>6s} {'sameTitle':>9s}")
for (a, b), ps in sorted(pairs.items(), key=lambda kv: -len(kv[1])):
    smp = ps if len(ps) <= 150 else random.sample(ps, 150)
    js = sorted(jac(x, y) for x, y in smp)
    q = lambda p: js[min(len(js) - 1, int(len(js) * p))]
    h1 = sum(1 for x, y in ps if (crawl[x].get("h1") or "").strip().lower() == (crawl[y].get("h1") or "").strip().lower())
    ti = sum(1 for x, y in ps if (crawl[x].get("title") or "").strip().lower() == (crawl[y].get("title") or "").strip().lower())
    print(f"{a + ' × ' + b:58s} {len(ps):6d} {q(.1):5.2f} {q(.5):5.2f} {q(.9):5.2f} {h1:6d} {ti:9d}")
# H1 reuse across the whole site
h1c = collections.Counter(re.sub(r"\b[A-Z][a-zA-Z'.-]+(?: [A-Z][a-zA-Z'.-]+)*\b", "<City>", (r.get("h1") or "")) for r in crawl.values() if "/p/" in r["url"])
print("\nmost common H1 patterns on /p/ pages (proper nouns masked):")
for h, c in h1c.most_common(8): print(f"  {c:5d}  {h[:110]}")
exact = collections.Counter((r.get("h1") or "").strip().lower() for r in crawl.values())
dup_h1_pages = sum(c for h, c in exact.items() if c > 1 and h)
print(f"pages whose exact H1 is shared with at least one other page: {dup_h1_pages} of {len(crawl)}")
tit = collections.Counter((r.get("title") or "").strip().lower() for r in crawl.values())
print(f"pages whose exact <title> is shared with another page: {sum(c for t, c in tit.items() if c > 1 and t)}")
# Q4 zero inventory
def kind(u):
    p = u[len(site):]
    if re.match(r"/p/become-a-swimming-pool-host-", p): return "become-host"
    if re.match(r"/p/[a-z0-9-]+-[a-z]{2}$", p) and "-vs-" not in p: return "city-rental"
    return None
zero_pat = re.compile(r"no pools listed in [^.]{0,60} yet", re.I)
G = collections.defaultdict(list)
for u, r in crawl.items():
    k = kind(u)
    if not k or u not in texts: continue
    z = bool(zero_pat.search(texts[u]))
    G[(k, "zero inventory stated" if z else "no such statement")].append(u)
print("\nQ4: pages that state 'no pools listed in <city> yet' vs those that do not")
print(f"{'kind / state':44s} {'n':>5s} {'med words':>9s} {'med listing links':>17s} {'med inlinks':>11s} {'inlinks=0':>9s} {'med outlinks':>12s}")
for (k, z), us in sorted(G.items()):
    w = [crawl[u].get("words") or 0 for u in us]; ll = [crawl[u].get("listing_links") or 0 for u in us]
    il = [inl.get(u, 0) for u in us]; ol = [outl.get(u, 0) for u in us]
    print(f"{k + ' / ' + z:44s} {len(us):5d} {int(statistics.median(w)):9d} {int(statistics.median(ll)):17d} {int(statistics.median(il)):11d} {sum(1 for x in il if x == 0):9d} {int(statistics.median(ol)):12d}")
json.dump({f"{k}|{z}": us for (k, z), us in G.items()}, open("q4_groups.json", "w"))
# which listing links do zero-inventory pages carry?
smp = G.get(("become-host", "zero inventory stated"), [])[:400]
tg = collections.Counter()
for l in open("texts.jsonl"):
    d = json.loads(l)
    if d["url"] in set(smp):
        for h in d["links"]:
            if h.startswith("/l/"): tg[h] += 1
print("\nlisting links carried by 400 zero-inventory become-host pages: distinct", len(tg), "| top:", [(h[:60], c) for h, c in tg.most_common(4)])
