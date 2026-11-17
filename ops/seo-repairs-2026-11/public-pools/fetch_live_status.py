#!/usr/bin/env python3
"""Read-only: one GET per duplicate-candidate record URL, to record whether the live page answers,
whether it redirects, its canonical href and whether it carries a robots noindex.

It sends GET requests only (never POST), at most one about every 0.65 s, with a normal browser
User-Agent, does not follow redirects, and stores nothing from the pages but those four facts.
Uses the system curl (so the configured HTTPS proxy and CA bundle apply).

Usage:  python3 -I fetch_live_status.py raw/records.txt raw/live-status.tsv
Output: url <TAB> http_status <TAB> redirect_target <TAB> canonical_href <TAB> noindex(0/1)
"""
import re
import subprocess
import sys
import time

SITE = "https://www.poolrentalnearme.com"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/130.0 Safari/537.36")
DELAY_S = 0.65


def urls(records_path):
    out = []
    for line in open(records_path, encoding="utf-8"):
        f = line.rstrip("\n").split("^")
        if len(f) >= 4:
            out.append(f"{SITE}/public-pools/{f[2]}/{f[3]}/{f[1]}/")
    return out


def fetch(url):
    p = subprocess.run(["curl", "-sS", "--max-time", "30", "-A", UA, "-o", "-", "-w",
                        "\n__STATUS__%{http_code}\t%{redirect_url}", url],
                       capture_output=True, text=True, errors="replace")
    body, _, tail = p.stdout.rpartition("\n__STATUS__")
    code, _, redir = tail.partition("\t")
    canon = re.search(r'<link[^>]+rel="canonical"[^>]*href="([^"]*)"', body, re.I)
    robots = re.search(r'<meta[^>]+name="robots"[^>]*content="([^"]*)"', body, re.I)
    noindex = int(bool(robots and "noindex" in robots.group(1).lower()))
    return code or "ERR", redir.strip(), canon.group(1) if canon else "", noindex


def main():
    src, dst = sys.argv[1], sys.argv[2]
    todo = urls(src)
    with open(dst, "w", encoding="utf-8") as out:
        for i, u in enumerate(todo, 1):
            code, redir, canon, noindex = fetch(u)
            out.write(f"{u}\t{code}\t{redir}\t{canon}\t{noindex}\n")
            out.flush()
            if i % 50 == 0:
                print(i, "of", len(todo), flush=True)
            time.sleep(DELAY_S)


if __name__ == "__main__":
    main()
