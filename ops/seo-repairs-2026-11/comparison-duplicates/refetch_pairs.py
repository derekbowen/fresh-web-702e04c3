#!/usr/bin/env python3
"""Re-fetch both URLs of every evidence pair from production and hash their main text.

Read-only: one GET per URL, sequential, at most 2 requests per second, no
redirect following. The main-text extraction is the one the 2026-11-14 audit
crawl used (first <main>…</main>, scripts/styles/comments stripped, tags to
spaces, lower-cased [A-Za-z0-9$%']+ words joined by one space, sha1), so a
sha1 here is comparable with the audit's.

Usage: python3 -I refetch_pairs.py evidence-2026-11-14-exact-dups.json > refetch-<date>.json
"""
import hashlib
import html
import json
import re
import subprocess
import sys
import time

BASE = "https://www.poolrentalnearme.com"
UA = "Mozilla/5.0 (compatible; site-audit/1.0)"
MIN_INTERVAL = 0.5  # seconds between request starts (<= 2 req/s)

TAG = re.compile(r"<[^>]+>")


def text_of(fragment):
    f = re.sub(r"(?is)<(script|style|noscript|svg|template)\b.*?</\1>", " ", fragment)
    f = re.sub(r"(?is)<!--.*?-->", " ", f)
    return re.sub(r"\s+", " ", html.unescape(TAG.sub(" ", f))).strip()


def fetch(path):
    p = subprocess.run(
        ["curl", "-sS", "-m", "45", "--compressed", "-A", UA, "-D", "-", "-o", "-",
         "-w", "\n__STATUS__%{http_code}", BASE + path],
        capture_output=True,
    )
    raw = p.stdout.decode("utf-8", "replace")
    raw, _, code = raw.rpartition("\n__STATUS__")
    head, _, body = raw.partition("\r\n\r\n")
    rec = {"path": path, "status": int(code) if code.isdigit() else 0}
    loc = re.findall(r"(?im)^location:\s*(.+?)\s*$", head)
    if loc:
        rec["location"] = loc[-1]
    can = re.findall(r'(?is)<link\b[^>]*rel\s*=\s*"canonical"[^>]*href\s*=\s*"([^"]*)"', body)
    rec["canonical"] = can[0] if can else None
    m = re.search(r"(?is)<h1\b[^>]*>(.*?)</h1>", body)
    rec["h1"] = text_of(m.group(1))[:200] if m else None
    mm = re.search(r"(?is)<main\b.*?</main>", body)
    rec["has_main"] = bool(mm)
    if mm:
        words = re.findall(r"[A-Za-z0-9$%']+", text_of(mm.group(0)).lower())
        rec["words"] = len(words)
        rec["text_sha1"] = hashlib.sha1(" ".join(words).encode()).hexdigest()
    return rec


def main():
    pairs = json.load(open(sys.argv[1]))
    out = {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "base": BASE, "pairs": []}
    last = 0.0
    for bare, suffixed in pairs:
        recs = []
        for path in (bare, suffixed):
            wait = MIN_INTERVAL - (time.time() - last)
            if wait > 0:
                time.sleep(wait)
            last = time.time()
            recs.append(fetch(path))
        out["pairs"].append({"bare": recs[0], "suffixed": recs[1]})
        print(f"{recs[0]['status']} {recs[1]['status']} "
              f"{'SAME' if recs[0].get('text_sha1') and recs[0].get('text_sha1') == recs[1].get('text_sha1') else 'DIFF'} {bare}",
              file=sys.stderr, flush=True)
    json.dump(out, sys.stdout, indent=1)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
