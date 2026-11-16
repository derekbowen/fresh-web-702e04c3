#!/usr/bin/env python3
"""Per-host canonical / robots / sitemap-country matrix from production. Read-only.

One GET per cell, sequential, at most 2 requests per second, no redirect
following. For each host: robots.txt (Allow lines, Sitemap line),
sitemap-country.xml (status, <loc> count, hosts of the <loc>s) and, for a
fixed set of pages, status + canonical + hreflang alternates.

Usage: python3 -I measure_live.py > live-<date>.json
"""
import json
import re
import subprocess
import sys
import time

UA = "Mozilla/5.0 (compatible; site-audit/1.0)"
MIN_INTERVAL = 0.5
HOSTS = [
    "www.poolrentalnearme.com",
    "poolrentalnearme.co.uk", "www.poolrentalnearme.co.uk",
    "poolrentalnearme.ca", "www.poolrentalnearme.ca",
    "poolrentalnearme.com.au", "www.poolrentalnearme.com.au",
]
PAGES = [
    "/p/rent-out-your-pool-uk",          # country_launch hub, no override
    "/p/pool-maintenance-canada",        # override to the bare ccTLD, hreflang group
    "/p/pool-rental-london",             # override target robots-blocked on co.uk
    "/p/become-a-swimming-pool-host-austin-tx",  # a US content page
    "/p/peerspace-vs-pool-rental-near-me-in-boston",  # a confirmed duplicate
]
_last = [0.0]


def get(url):
    wait = MIN_INTERVAL - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()
    p = subprocess.run(["curl", "-sS", "-m", "40", "--compressed", "-A", UA, "-D", "-", "-o", "-",
                        "-w", "\n__STATUS__%{http_code}", url], capture_output=True)
    raw = p.stdout.decode("utf-8", "replace")
    raw, _, code = raw.rpartition("\n__STATUS__")
    head, _, body = raw.partition("\r\n\r\n")
    loc = re.findall(r"(?im)^location:\s*(.+?)\s*$", head)
    return int(code) if code.isdigit() else 0, (loc[-1] if loc else None), body


def main():
    out = {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "hosts": {}}
    for host in HOSTS:
        h = {}
        st, _, body = get(f"https://{host}/robots.txt")
        h["robots"] = {
            "status": st,
            "allow": re.findall(r"(?m)^Allow:\s*(\S+)", body),
            "disallow_all": bool(re.search(r"(?m)^Disallow:\s*/\s*$", body)),
            "sitemap": re.findall(r"(?m)^Sitemap:\s*(\S+)", body),
        }
        st, _, body = get(f"https://{host}/sitemap-country.xml")
        locs = re.findall(r"<loc>([^<]+)</loc>", body)
        h["sitemap_country"] = {
            "status": st,
            "locs": len(locs),
            "loc_hosts": sorted({re.sub(r"^https?://([^/]+).*$", r"\1", l) for l in locs}),
            "slugs": sorted(l.split("/p/", 1)[-1] for l in locs),
        }
        pages = {}
        for path in PAGES:
            st, location, body = get(f"https://{host}{path}")
            can = re.findall(r'(?is)<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"', body)
            alts = re.findall(r'(?is)<link\b[^>]*rel="alternate"[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"', body)
            pages[path] = {"status": st, "location": location, "canonical": can,
                           "hreflang": [f"{l} {u}" for l, u in alts]}
        h["pages"] = pages
        out["hosts"][host] = h
        print(host, h["robots"]["status"], h["sitemap_country"]["status"], h["sitemap_country"]["locs"], file=sys.stderr, flush=True)
    json.dump(out, sys.stdout, indent=1)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
