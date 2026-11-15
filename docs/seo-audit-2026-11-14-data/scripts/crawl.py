#!/usr/bin/env python3
"""Resumable read-only crawl of every URL in urls.tsv. One GET per URL, no redirect following.
Writes crawl.jsonl (features per URL) and texts.jsonl (main text + internal links). Stdlib + curl only."""
import subprocess, re, json, sys, html, hashlib, threading, time, os, tempfile
from concurrent.futures import ThreadPoolExecutor
UA = "Mozilla/5.0 (compatible; site-audit/1.0)"
CONC = int(os.environ.get("CONC", "6"))
LIMIT = int(os.environ.get("LIMIT", "0"))
lock = threading.Lock()
done = set()
if os.path.exists("crawl.jsonl"):
    for line in open("crawl.jsonl"):
        try: done.add(json.loads(line)["url"])
        except Exception: pass
rows = [l.rstrip("\n").split("\t") for l in open(sys.argv[1] if len(sys.argv) > 1 else "urls.tsv") if l.strip()]
todo = [(u, s) for u, s in rows if u not in done]
if LIMIT: todo = todo[:LIMIT]
print(f"total {len(rows)} done {len(done)} todo {len(todo)} conc {CONC}", flush=True)
TAG = re.compile(r"<[^>]+>")
def text_of(fragment):
    f = re.sub(r"(?is)<(script|style|noscript|svg|template)\b.*?</\1>", " ", fragment)
    f = re.sub(r"(?is)<!--.*?-->", " ", f)
    return re.sub(r"\s+", " ", html.unescape(TAG.sub(" ", f))).strip()
def simhash(words):
    v = [0] * 64
    for i in range(max(1, len(words) - 2)):
        h = int.from_bytes(hashlib.md5(" ".join(words[i:i + 3]).encode()).digest()[:8], "big")
        for b in range(64):
            v[b] += 1 if (h >> b) & 1 else -1
    return "%016x" % sum((1 << b) for b in range(64) if v[b] > 0)
def attr(tag, name):
    m = re.search(name + r'\s*=\s*"([^"]*)"|' + name + r"\s*=\s*'([^']*)'", tag, re.I)
    return html.unescape((m.group(1) or m.group(2) or "")) if m else None
def fetch(item):
    url, sms = item
    with tempfile.TemporaryDirectory() as d:
        b, h = os.path.join(d, "b"), os.path.join(d, "h")
        rec = {"url": url, "sitemaps": sms}
        for attempt in range(3):
            p = subprocess.run(["curl", "-sS", "-m", "45", "--compressed", "-A", UA, "-o", b, "-D", h,
                                "-w", "%{http_code}\t%{size_download}\t%{time_total}", url], capture_output=True)
            out = p.stdout.decode("utf-8", "replace").split("\t")
            code = out[0] if out else "000"
            if code not in ("000", "429", "502", "503", "504", "520", "521", "522", "523", "524") or attempt == 2:
                break
            time.sleep(4 * (attempt + 1))
        rec["status"] = int(code) if code.isdigit() else 0
        rec["attempts"] = attempt + 1
        rec["bytes"] = int(float(out[1])) if len(out) > 1 else 0
        rec["secs"] = float(out[2]) if len(out) > 2 else None
        if p.returncode != 0: rec["curl_err"] = p.stderr.decode("utf-8", "replace")[:200]
        hdr = open(h, encoding="utf-8", errors="replace").read() if os.path.exists(h) else ""
        for k in ("location", "x-robots-tag", "content-type", "cache-control", "cf-cache-status", "age", "link"):
            m = re.findall(r"(?im)^" + re.escape(k) + r":\s*(.+?)\s*$", hdr)
            if m: rec[k] = m[-1][:400]
        body = open(b, encoding="utf-8", errors="replace").read() if os.path.exists(b) else ""
    txt = None
    if body and "html" in rec.get("content-type", "html"):
        head = body[:body.lower().find("</head>")] if "</head>" in body.lower() else body[:20000]
        cans = [attr(t, "href") for t in re.findall(r"(?is)<link\b[^>]*rel\s*=\s*[\"']canonical[\"'][^>]*>", body)]
        rec["canonical"] = cans[0] if cans else None
        rec["canonical_count"] = len(cans)
        robots = [attr(t, "content") for t in re.findall(r"(?is)<meta\b[^>]*name\s*=\s*[\"'](?:robots|googlebot)[\"'][^>]*>", body)]
        rec["meta_robots"] = ",".join(x for x in robots if x) or None
        m = re.search(r"(?is)<title[^>]*>(.*?)</title>", body); rec["title"] = text_of(m.group(1))[:300] if m else None
        m = re.search(r"(?is)<meta\b[^>]*name\s*=\s*[\"']description[\"'][^>]*>", body); rec["desc"] = (attr(m.group(0), "content") or "")[:320] if m else None
        h1s = [text_of(x) for x in re.findall(r"(?is)<h1\b[^>]*>(.*?)</h1>", body)]
        rec["h1"] = h1s[0][:300] if h1s else None; rec["h1_count"] = len(h1s)
        rec["hreflang"] = len(re.findall(r"(?i)hreflang\s*=", head))
        m = re.search(r"(?is)<meta\b[^>]*property\s*=\s*[\"']og:url[\"'][^>]*>", body); rec["og_url"] = attr(m.group(0), "content") if m else None
        rec["jsonld"] = len(re.findall(r"(?i)application/ld\+json", body))
        mm = re.search(r"(?is)<main\b.*?</main>", body)
        main = mm.group(0) if mm else re.sub(r"(?is)<(header|footer|nav)\b.*?</\1>", " ", body)
        rec["has_main"] = bool(mm)
        txt = text_of(main)
        words = re.findall(r"[A-Za-z0-9$%']+", txt.lower())
        rec["words"] = len(words); rec["simhash"] = simhash(words) if words else None
        rec["text_sha1"] = hashlib.sha1(" ".join(words).encode()).hexdigest()
        hrefs = set()
        for t in re.findall(r"(?is)<a\b[^>]*>", body):
            hv = attr(t, "href")
            if not hv: continue
            hv = hv.split("#")[0].strip()
            if hv.startswith("/") and not hv.startswith("//"): hrefs.add(hv)
            elif re.match(r"https?://(www\.)?poolrentalnearme\.(com|ca|co\.uk|com\.au)(/|$)", hv): hrefs.add(hv)
        main_links = len(re.findall(r"(?is)<a\b[^>]*href", main))
        rec["links_internal"] = len(hrefs); rec["links_in_main"] = main_links
        rec["listing_links"] = sum(1 for x in hrefs if re.search(r"/l/[^/]+/[0-9a-f-]{36}", x))
        low = txt.lower()
        rec["flag_no_private_pools"] = bool(re.search(r"no (private )?pools? (are |is )?(currently )?(listed|available)", low))
        rec["flag_notfound"] = bool(re.search(r"page not found|404|couldn.t find", (rec.get("title") or "").lower()))
        rec["flag_maintenance"] = "maintenance mode" in low
    with lock:
        with open("crawl.jsonl", "a") as f: f.write(json.dumps(rec) + "\n")
        if txt is not None:
            with open("texts.jsonl", "a") as f: f.write(json.dumps({"url": url, "text": txt[:60000], "links": sorted(hrefs)}) + "\n")
    return rec["status"]
t0 = time.time(); n = 0; codes = {}
with ThreadPoolExecutor(CONC) as ex:
    for st in ex.map(fetch, todo):
        n += 1; codes[st] = codes.get(st, 0) + 1
        if n % 250 == 0: print(f"{n}/{len(todo)} {time.time() - t0:.0f}s {codes}", flush=True)
print(f"DONE {n} in {time.time() - t0:.0f}s {codes}", flush=True)
