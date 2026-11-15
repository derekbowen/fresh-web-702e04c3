#!/usr/bin/env python3
"""Track the URL groups touched by the 2026-11 SEO repairs, before and after release.

    python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py            # all groups, live site
    python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py --only F11,F6a
    BASE=http://127.0.0.1:3000 python3 -I .../track_groups.py --only F11   # a local build

Read-only: plain GET requests, no redirect following, at most about 3 per second.
Writes reports/<UTC date>/track-<UTC time>.json and .md next to this file.

Each check states what the repaired site must do, so a run before release shows
which fixes are not live yet ("FAIL (not live)" is expected then). It observes
the site; it does not observe Google. Index counts come only from Search
Console, and a passing check here says nothing about indexing by itself.
"""
import argparse, datetime, json, os, re, sys, time, urllib.error, urllib.request
from urllib.parse import urljoin

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get("BASE", "https://www.poolrentalnearme.com").rstrip("/")
UA = "Mozilla/5.0 (compatible; prnm-seo-tracker/1.0)"
PAUSE = float(os.environ.get("PAUSE", "0.35"))


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


_opener = urllib.request.build_opener(_NoRedirect)


def get(url, host=None):
    """One GET, no redirects. Returns (status, headers dict lower-case, body text)."""
    headers = {"User-Agent": UA}
    if host:
        headers["Host"] = host
    req = urllib.request.Request(url, headers=headers)
    err = None
    for attempt in range(2):  # one retry, for network errors only
        time.sleep(PAUSE * (1 + 3 * attempt))
        try:
            r = _opener.open(req, timeout=30)
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace") if e.fp else ""
            return e.code, {k.lower(): v for k, v in e.headers.items()}, body
        except Exception as e:  # network error: recorded as status 0, never treated as a pass
            err = e
    return 0, {}, "ERR %s" % err


def chain(url, max_hops=6):
    """Follow redirects by hand; returns [(path, status)] and the final (status, headers, body)."""
    hops = []
    for _ in range(max_hops):
        st, h, body = get(url)
        hops.append((url.replace(BASE, ""), st))
        if st in (301, 302, 307, 308) and h.get("location"):
            url = urljoin(url, h["location"])
            continue
        return hops, (st, h, body)
    return hops, (0, {}, "")


def canonical(body):
    m = re.search(r'(?is)<link\b[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', body) or \
        re.search(r'(?is)<link\b[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']canonical', body)
    return m.group(1) if m else None


def robots_meta(body, headers):
    m = re.findall(r'(?is)<meta\b[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']*)', body)
    return ",".join(m + ([headers["x-robots-tag"]] if headers.get("x-robots-tag") else [])).lower()


def h1(body):
    m = re.search(r"(?is)<h1\b[^>]*>(.*?)</h1>", body)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(1))).strip() if m else None


def title(body):
    m = re.search(r"(?is)<title[^>]*>(.*?)</title>", body)
    return re.sub(r"\s+", " ", m.group(1)).strip() if m else None


def lines(name):
    return [l.strip() for l in open(os.path.join(HERE, "data", name)) if l.strip()]


RESULTS = []


def record(group, name, ok, detail, kind="check"):
    RESULTS.append({"group": group, "check": name, "ok": bool(ok), "detail": str(detail)[:300], "kind": kind})


# --------------------------------------------------------------- groups ------
def g_regression():
    """Marketplace and site entry points still answer (they must keep working through every release)."""
    for path in ["/", "/s", "/login", "/signup", "/p/hosting", "/p/become-a-host", "/p/all-locations", "/sitemap.xml", "/robots.txt"]:
        st, h, body = get(BASE + path)
        record("regression", "%s -> 200" % path, st == 200, st)


def g_F11():
    for path in ["/p", "/p/"]:
        hops, (st, h, body) = chain(BASE + path)
        record("F11", "%s ends in 404 without a loop" % path, st == 404 and len(hops) <= 2, hops)
        record("F11", "%s answers 404 directly (needs the WEST nginx change too)" % path, len(hops) == 1 and st == 404, hops)
    for path in ["/p/null", "/p/details", "/p/mailto:someone"]:
        st, h, body = get(BASE + path)
        record("F11", "%s -> 404, not a redirect to the homepage" % path, st == 404, (st, h.get("location")))
    multi, broken = [], []
    for slug in lines("redirect-slugs.txt"):
        hops, (st, h, body) = chain(BASE + "/p/" + slug)
        redirects = sum(1 for _, s in hops if s in (301, 302, 307, 308))
        if redirects > 1:
            multi.append((slug, hops))
        if st != 200:
            broken.append((slug, hops[-1]))
    n = len(lines("redirect-slugs.txt"))
    record("F11", "stored redirects that take more than one hop (target 0)", not multi, "%d of %d; e.g. %s" % (len(multi), n, multi[:3]))
    record("F11", "stored redirects that do not end at a 200 (target 0)", not broken, "%d of %d; e.g. %s" % (len(broken), n, broken[:3]))


def g_F6a():
    bad = []
    for bare, suffixed in (l.split("\t") for l in lines("comparison-exact-dups.tsv")):
        st, h, _ = get(BASE + bare)
        loc = (h.get("location") or "").replace(BASE, "")
        if not (st == 301 and loc == suffixed):
            bad.append((bare, st, loc))
        st2, _, body2 = get(BASE + suffixed)
        if st2 != 200:
            bad.append((suffixed, st2, "target not 200"))
    record("F6a", "78 exact-duplicate comparison URLs 301 once to their state-suffixed twin", not bad, "%d problems; e.g. %s" % (len(bad), bad[:3]))


def g_F14():
    for slug, wrong in [("become-a-swimming-pool-host-saratoga-springs-ny", "10% service fee"),
                        ("swim-instructor-pool-rental-fair-oaks-ranch-tx", "10% booking fee"),
                        ("swim-instructor-pool-rental-mount-vernon-va", "10% booking fee"),
                        ("affiliate", "10% platform fee")]:
        st, h, body = get(BASE + "/p/" + slug)
        record("F14", "/p/%s no longer says '%s'" % (slug, wrong), st == 200 and wrong.lower() not in body.lower(), st)


def g_F1_F7():
    host_h1, renter_h1, host_notice = {}, {}, []
    for slug in lines("sample-host.txt"):
        st, h, body = get(BASE + "/p/" + slug)
        host_h1[slug] = h1(body)
        top = body[: max(1, len(body) // 3)]
        if re.search(r"We're still adding pools|There are no pools listed in", top):
            host_notice.append(slug)
    for slug in lines("sample-renter.txt"):
        st, h, body = get(BASE + "/p/" + slug)
        renter_h1[slug] = (h1(body) or "", title(body) or "")
    record("F1", "sampled host pages do not open with the empty-inventory notice (25)", not host_notice, "%d with notice; e.g. %s" % (len(host_notice), host_notice[:3]))
    hostlike = [s for s, (hh, tt) in renter_h1.items() if re.search(r"(?i)rent your .* pool|become a pool host|0% host fees", hh)]
    record("F7", "sampled renter city pages carry a renter heading, not the host heading (25)", not hostlike, "%d host-style; e.g. %s" % (len(hostlike), hostlike[:3]))
    dupe = len(host_h1) - len(set(v for v in host_h1.values() if v)) - sum(1 for v in host_h1.values() if not v)
    record("F7", "sampled host pages have distinct H1s", dupe <= 0, "%d duplicates among 25" % max(dupe, 0))


def _locs(xml):
    return [u.replace("&amp;", "&") for u in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)]


def g_F4():
    st, h, idx = get(BASE + "/sitemap.xml")
    # Each child once, in index order; /public-pools.xml only if the index omits it
    # (adding it twice counted all 2,529 of its URLs as duplicates on 2026-11-15).
    children = list(dict.fromkeys(_locs(idx)))
    if BASE + "/public-pools.xml" not in children:
        children.append(BASE + "/public-pools.xml")
    seen, dupes, urls = {}, [], []
    for c in children:
        cst, ch, xml = get(c)
        if cst != 200:
            record("F4", "child sitemap %s -> 200" % c.replace(BASE, ""), False, cst)
            continue
        for u in _locs(xml):
            if u in seen:
                dupes.append(u)
            seen[u] = c
            urls.append(u)
    record("F4", "no URL listed in two sitemaps (target 0)", not dupes, "%d; e.g. %s" % (len(dupes), dupes[:3]))
    record("F4", "config/test listing absent", not any("config-listing" in u for u in urls), "")
    record("F4", "noindex /p/pool-pros absent", BASE + "/p/pool-pros" not in seen, "")
    st, h, body = get(BASE + "/sitemap-directory.xml")
    record("F4", "/sitemap-directory.xml no longer advertises noindex URLs (410 or no <loc>)", st == 410 or not _locs(body), st)
    # A sample of listed URLs, spread across files: each must be 200, indexable, self-canonical.
    step = max(1, len(urls) // 150)
    bad = []
    for u in urls[::step]:
        sst, sh, sbody = get(u)
        can = canonical(sbody)
        if sst != 200 or "noindex" in robots_meta(sbody, sh) or (can and can.rstrip("/") != u.rstrip("/")):
            bad.append((u.replace(BASE, ""), sst, can))
    record("F4", "sampled sitemap URLs are 200, indexable and self-canonical (~150 sampled of %d)" % len(urls), not bad, "%d bad; e.g. %s" % (len(bad), bad[:3]))


def g_F10():
    # US pages served on a ccTLD host must canonicalise to www.poolrentalnearme.com.
    # /p/hosting is a static route; the US city page is a database page, the case F10 is about.
    for host in ["www.poolrentalnearme.co.uk", "www.poolrentalnearme.ca", "www.poolrentalnearme.com.au"]:
        for path in ["/p/hosting", "/p/become-a-swimming-pool-host-aberdeen-sd"]:
            st, h, body = get("https://%s%s" % (host, path))
            can = canonical(body) or ""
            record("F10", "%s%s canonical -> www.poolrentalnearme.com" % (host, path), can.startswith("https://www.poolrentalnearme.com/"), (st, can))
        rst, rh, rbody = get("https://%s/robots.txt" % host)
        allowed = re.search(r"(?im)^allow:\s*/sitemap-country\.xml", rbody) is not None
        record("F10", "%s robots.txt allows its own /sitemap-country.xml" % host, allowed, rst)


GROUPS = {"regression": g_regression, "F11": g_F11, "F6a": g_F6a, "F14": g_F14,
          "F1F7": g_F1_F7, "F4": g_F4, "F10": g_F10}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    wanted = [g for g in (a.only.split(",") if a.only else GROUPS) if g]
    started = datetime.datetime.utcnow()
    for g in wanted:
        print("== %s" % g, flush=True)
        GROUPS[g]()
    out_dir = os.path.join(HERE, "reports", started.strftime("%Y-%m-%d"))
    os.makedirs(out_dir, exist_ok=True)
    stem = os.path.join(out_dir, "track-%s" % started.strftime("%H%M%S"))
    json.dump({"base": BASE, "started_utc": started.isoformat() + "Z", "results": RESULTS}, open(stem + ".json", "w"), indent=1)
    with open(stem + ".md", "w") as fh:
        fh.write("# SEO repair tracking, %s UTC, %s\n\n" % (started.strftime("%Y-%m-%d %H:%M"), BASE))
        fh.write("Observed site behaviour only. It does not measure indexing.\n\n| Group | Check | Result | Detail |\n|---|---|---|---|\n")
        for r in RESULTS:
            fh.write("| %s | %s | %s | %s |\n" % (r["group"], r["check"], "PASS" if r["ok"] else "FAIL", r["detail"].replace("|", "/")[:160]))
    for r in RESULTS:
        print("%-4s %-10s %s" % ("PASS" if r["ok"] else "FAIL", r["group"], r["check"]))
    print("report:", stem + ".md")


if __name__ == "__main__":
    main()
