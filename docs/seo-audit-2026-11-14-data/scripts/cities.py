#!/usr/bin/env python3
"""Which URL families compete for the same city, from the crawl. Stdlib only."""
import json, re, collections, sys
site = "https://www.poolrentalnearme.com"
crawl = {}
for l in open("crawl.jsonl"):
    r = json.loads(l); crawl[r["url"]] = r
STATES = {"alabama":"al","alaska":"ak","arizona":"az","arkansas":"ar","california":"ca","colorado":"co","connecticut":"ct","delaware":"de","florida":"fl","georgia":"ga","hawaii":"hi","idaho":"id","illinois":"il","indiana":"in","iowa":"ia","kansas":"ks","kentucky":"ky","louisiana":"la","maine":"me","maryland":"md","massachusetts":"ma","michigan":"mi","minnesota":"mn","mississippi":"ms","missouri":"mo","montana":"mt","nebraska":"ne","nevada":"nv","new-hampshire":"nh","new-jersey":"nj","new-mexico":"nm","new-york":"ny","north-carolina":"nc","north-dakota":"nd","ohio":"oh","oklahoma":"ok","oregon":"or","pennsylvania":"pa","rhode-island":"ri","south-carolina":"sc","south-dakota":"sd","tennessee":"tn","texas":"tx","utah":"ut","vermont":"vt","virginia":"va","washington":"wa","west-virginia":"wv","wisconsin":"wi","wyoming":"wy","district-of-columbia":"dc"}
ST = set(STATES.values())
by_city = collections.defaultdict(dict)
kinds = collections.Counter()
for u in crawl:
    p = re.sub(r"^https?://[^/]+", "", u).rstrip("/")
    m = re.match(r"/public-pools/([a-z-]+)/([a-z0-9-]+)$", p)
    if m and m.group(1) in STATES:
        by_city[(m.group(2), STATES[m.group(1)])]["public-pools city"] = u; kinds["public-pools city"] += 1; continue
    if not p.startswith("/p/"): continue
    s = p[3:]
    tests = [("become-host", r"become-a-swimming-pool-host-+(.+)-([a-z]{2})$"), ("vs-giggster", r"giggster-vs-pool-rental-near-me-in-(.+)-([a-z]{2})$"), ("vs-peerspace", r"peerspace-vs-pool-rental-near-me-in-(.+)-([a-z]{2})$"), ("vs-swimply", r"swimply-vs-pool-rental-near-me-in-(.+)-([a-z]{2})$"), ("city rental (/p/city-st)", r"([a-z0-9-]+)-([a-z]{2})$")]
    for k, rx in tests:
        m = re.match(rx, s)
        if m and m.group(2) in ST:
            by_city[(m.group(1), m.group(2))][k] = u; kinds[k] += 1; break
print("pages classified by kind:", dict(kinds))
combo = collections.Counter(tuple(sorted(v.keys())) for v in by_city.values())
print("cities:", len(by_city))
for c, n in combo.most_common(15): print(f"  {n:5d} cities have: {', '.join(c)}")
# show a sample of cities with the most page kinds
rich = sorted(by_city.items(), key=lambda kv: -len(kv[1]))[:8]
for (city, st), v in rich:
    print(f"\n== {city}, {st.upper()} ==")
    for k, u in sorted(v.items()):
        r = crawl[u]
        print(f"  [{k}] {u.replace(site,'')}\n      title: {r.get('title')}\n      h1: {r.get('h1')} | words {r.get('words')} | canonical self: {r.get('canonical') == u}")
json.dump({f"{c}|{s}": v for (c, s), v in by_city.items()}, open("cities.json", "w"))
