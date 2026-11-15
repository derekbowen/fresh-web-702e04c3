#!/usr/bin/env python3
"""Fetch the live sitemap index and every child; write sitemaps.json and urls.tsv. Read-only."""
import subprocess, re, json, sys, html, collections
UA = "Mozilla/5.0 (compatible; site-audit/1.0)"
def get(url):
    p = subprocess.run(["curl", "-sS", "-m", "60", "--compressed", "-A", UA, "-w", "\n%{http_code}", url], capture_output=True)
    out = p.stdout.decode("utf-8", "replace")
    body, _, code = out.rpartition("\n")
    return code.strip(), body
def parse(body):
    locs = [html.unescape(x.strip()) for x in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", body)]
    lastmods = re.findall(r"<lastmod>\s*([^<]+?)\s*</lastmod>", body)
    is_index = "<sitemapindex" in body
    return is_index, locs, lastmods
roots = sys.argv[1:] or ["https://www.poolrentalnearme.com/sitemap.xml", "https://www.poolrentalnearme.com/public-pools.xml"]
seen, children, urls = set(), {}, collections.OrderedDict()
queue = list(roots)
while queue:
    sm = queue.pop(0)
    if sm in seen: continue
    seen.add(sm)
    code, body = get(sm)
    is_index, locs, lastmods = parse(body)
    children[sm] = {"status": code, "is_index": is_index, "count": len(locs), "bytes": len(body),
                    "lastmod_min": min(lastmods) if lastmods else None, "lastmod_max": max(lastmods) if lastmods else None}
    if is_index:
        queue.extend(locs)
    else:
        for u in locs:
            urls.setdefault(u, []).append(sm.rsplit("/", 1)[-1])
json.dump(children, open("sitemaps.json", "w"), indent=1)
with open("urls.tsv", "w") as f:
    for u, sms in urls.items():
        f.write(u + "\t" + ",".join(sms) + "\n")
tot = sum(c["count"] for c in children.values() if not c["is_index"])
print("sitemap files:", len(children), "| url entries:", tot, "| distinct urls:", len(urls))
for sm, c in children.items():
    print(f"{c['status']} {'INDEX' if c['is_index'] else '     '} {c['count']:6d}  lastmod {c['lastmod_min']} .. {c['lastmod_max']}  {sm}")
hosts = collections.Counter(re.sub(r"^(https?://[^/]+).*", r"\1", u) for u in urls)
print("hosts:", dict(hosts))
fam = collections.Counter()
for u in urls:
    path = re.sub(r"^https?://[^/]+", "", u)
    seg = path.strip("/").split("/")
    fam["/" + seg[0] + ("/…" if len(seg) > 1 else "")] += 1
print("path families:", fam.most_common(25))
dups = sum(1 for u, s in urls.items() if len(s) > 1)
print("urls listed in more than one sitemap:", dups)
