#!/usr/bin/env python3
"""Within-template content similarity from texts.jsonl + crawl.jsonl (our own crawl). Stdlib only."""
import json, re, collections, random, statistics, sys
random.seed(7)
crawl = {}
for l in open("crawl.jsonl"):
    r = json.loads(l); crawl[r["url"]] = r
def family(u):
    p = re.sub(r"^https?://[^/]+", "", u)
    if p.startswith("/public-pools/"):
        segs = [s for s in p.strip("/").split("/")]
        return {1: "pp:root", 2: "pp:state", 3: "pp:city", 4: "pp:pool"}.get(len(segs), "pp:other")
    if p.startswith("/l/"): return "listing"
    if not p.startswith("/p/"): return "root-level"
    s = p[3:]
    for pre, name in [("become-a-swimming-pool-host-", "p:become-host-city"), ("pool-rental-", "p:pool-rental-*"), ("swim-instructor", "p:swim-instructor"), ("es/", "p:es")]:
        if s.startswith(pre): return name
    m = re.match(r"([a-z]+)-vs-pool-rental-near-me", s)
    if m: return "p:vs-" + m.group(1)
    if re.search(r"-[a-z]{2}$", s) and s.count("-") <= 4: return "p:city-st"
    return "p:other"
fam = collections.defaultdict(list)
texts = {}
for l in open("texts.jsonl"):
    d = json.loads(l)
    if d["url"] in crawl:
        fam[family(d["url"])].append(d["url"]); texts[d["url"]] = d["text"]
def shingles(t, k=5):
    w = re.findall(r"[a-z0-9$%']+", t.lower())
    return set(hash(" ".join(w[i:i + k])) for i in range(max(1, len(w) - k + 1)))
print(f"{'family':24s} {'n':>5s} {'med_words':>9s} {'pairs':>5s} {'jaccard p10':>11s} {'p50':>6s} {'p90':>6s} {'>=0.9':>6s} {'>=0.6':>6s}  example")
out = {}
for f, urls in sorted(fam.items(), key=lambda kv: -len(kv[1])):
    n = len(urls)
    sample = random.sample(urls, min(n, 120))
    sh = {u: shingles(texts[u]) for u in sample}
    js = []
    pairs = [(a, b) for i, a in enumerate(sample) for b in sample[i + 1:]]
    if len(pairs) > 1500: pairs = random.sample(pairs, 1500)
    for a, b in pairs:
        A, B = sh[a], sh[b]
        js.append(len(A & B) / max(1, len(A | B)))
    w = [crawl[u].get("words") or 0 for u in urls]
    if js:
        js.sort()
        q = lambda p: js[min(len(js) - 1, int(len(js) * p))]
        print(f"{f:24s} {n:5d} {int(statistics.median(w)):9d} {len(js):5d} {q(.10):11.2f} {q(.5):6.2f} {q(.9):6.2f} {sum(1 for x in js if x>=.9)/len(js):6.1%} {sum(1 for x in js if x>=.6)/len(js):6.1%}  {urls[0].replace('https://www.poolrentalnearme.com','')}")
        out[f] = {"n": n, "median_words": int(statistics.median(w)), "j_p10": q(.10), "j_p50": q(.5), "j_p90": q(.9)}
    else:
        print(f"{f:24s} {n:5d} {int(statistics.median(w)) if w else 0:9d}     -")
json.dump(out, open("similarity.json", "w"), indent=1)
