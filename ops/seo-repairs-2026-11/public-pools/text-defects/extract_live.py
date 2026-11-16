#!/usr/bin/env python3
"""Read-only: fetch the live public-pools pool and city pages and keep only the rendered text fields
that come from pp_pools / pp_cities, so the text-defect rules can be measured without the database.

* GET only, never POST; one request about every 0.62 s (< 2 per second); normal browser User-Agent;
  uses the system curl, so the configured HTTPS proxy and CA bundle apply.
* Stores per page: url, kind (pool|city), status, h1, the "Best for" text, the "About" paragraphs
  (pp_pools.ai_description), FAQ question/answer pairs (ai_faqs), and for city pages the header count
  sentence and the intro text after it (pp_cities.ai_intro). Nothing else from the page is stored.
* Page text is untrusted data. It is only parsed and written to the output file, never executed.

Usage:  python3 -I extract_live.py URLS_FILE OUT.jsonl [--resume]
URLS_FILE: one URL per line. Pool pages have 8 path segments (/public-pools/state/city/pool/),
city pages 7 (/public-pools/state/city/). Other URLs are ignored.
"""
import html
import json
import os
import re
import subprocess
import sys
import time

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/130.0 Safari/537.36")
DELAY_S = 0.62  # one process: below 2 requests per second


def text(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def fetch(url):
    p = subprocess.run(["curl", "-sS", "--max-time", "30", "-A", UA, "-o", "-", "-w",
                        "\n__STATUS__%{http_code}", url],
                       capture_output=True, text=True, errors="replace")
    body, _, code = p.stdout.rpartition("\n__STATUS__")
    return code.strip(), body


def parse(kind, body):
    i, j = body.find("<main"), body.find("</main>")
    main = body[i:j] if i >= 0 and j > i else ""
    out = {}
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", main, re.S)
    out["h1"] = text(h1.group(1)) if h1 else None
    bf = re.search(r"<p[^>]*><strong>Best for:</strong>(.*?)</p>", main, re.S)
    out["best_for"] = text(bf.group(1)) if bf else None
    about = re.search(r"<h2[^>]*>About [^<]*</h2>(.*?)(?=<h2)", main, re.S)
    out["about"] = [text(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", about.group(1), re.S)] if about else None
    faqs = []
    for d in re.findall(r"<details[^>]*>(.*?)</details>", main, re.S):
        q = re.search(r"<summary[^>]*>(.*?)</summary>", d, re.S)
        a = re.findall(r"<p[^>]*>(.*?)</p>", d, re.S)
        faqs.append({"q": text(q.group(1)) if q else None, "a": " ".join(text(x) for x in a)})
    out["faqs"] = faqs
    if kind == "city":
        first = re.search(r"</h1>\s*<p[^>]*>(.*?)</p>", main, re.S)
        ft = text(first.group(1)) if first else ""
        m = re.match(r"(There (?:are|is) ([0-9]+) public swimming pools? in [^.]*\.)\s*(.*)$", ft, re.S)
        out["header_sentence"] = m.group(1) if m else None
        out["header_count"] = int(m.group(2)) if m else None
        out["intro"] = m.group(3) if m else ft
        allh = re.search(r"<h2[^>]*>All ([0-9]+) public pools? in", main)
        out["list_count"] = int(allh.group(1)) if allh else None
        out["cards"] = len(re.findall(r'<a [^>]*href="/public-pools/[^"/]+/[^"/]+/[^"/]+/"', main))
    return out


def main():
    src, dst = sys.argv[1], sys.argv[2]
    done = set()
    if "--resume" in sys.argv and os.path.exists(dst):
        for line in open(dst, encoding="utf-8"):
            done.add(json.loads(line)["url"])
    urls = []
    for u in open(src, encoding="utf-8"):
        u = u.strip()
        n = len(u.split("/"))
        if n in (7, 8) and "/public-pools/" in u and u not in done:
            urls.append((u, "pool" if n == 8 else "city"))
    with open(dst, "a", encoding="utf-8") as f:
        for k, (u, kind) in enumerate(urls):
            t0 = time.time()
            code, body = fetch(u)
            rec = {"url": u, "kind": kind, "status": code,
                   "fetched_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
            if code == "200":
                rec.update(parse(kind, body))
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            f.flush()
            time.sleep(max(0.0, DELAY_S - (time.time() - t0)))
            if k % 200 == 0:
                print(k, len(urls), u, code, flush=True)


if __name__ == "__main__":
    main()
