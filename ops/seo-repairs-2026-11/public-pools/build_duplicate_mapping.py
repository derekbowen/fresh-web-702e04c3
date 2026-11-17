#!/usr/bin/env python3
"""Build duplicate-mapping.csv and count-consistency.csv from read-only query output.

MAPPING ONLY. This script reads local text files and writes two CSVs. It never connects to a
database, never sends a request, and never merges, deletes or unpublishes anything.

Inputs (all produced by the SELECT-only queries in duplicate-mapping.sql / count-consistency.sql,
each line ending in a 6-char md5 prefix of the line; a line whose hash is wrong is refused):
  raw/records.txt  one line per published pool that takes part in a candidate pair
  raw/pairs.txt    one line per candidate pair with the server-side evidence
  raw/cities.txt   one line per published city whose pool_count differs from the real count,
                   or that has zero published pools
  raw/public-pools.xml   copy of https://www.poolrentalnearme.com/public-pools.xml fetched once on
                   2026-11-15 19:27 UTC (md5 029de5a60c76925edd96864f161c0d38; passed as argument)
  raw/live-status.tsv    optional: one GET per record URL (http status, redirect, canonical, noindex)

Usage:
  python3 -I build_duplicate_mapping.py raw/public-pools.xml
"""
import csv
import difflib
import hashlib
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
SITE = "https://www.poolrentalnearme.com"

# Haversine in the SQL uses least(1, ...), and LEAST ignores NULL: a pair where one record has no
# coordinates comes back as half the earth's circumference instead of NULL. Treat it as "unknown".
NULL_DISTANCE_ARTEFACT = 20015087

CLOSE_M = 75      # task threshold
FAR_M = 500       # beyond this, with usable coordinates, the two points are not one site
MIN_DECIMALS = 3  # coordinates with fewer decimals (about +-100 m or worse) are "low precision"


def read_hashed(path, nfields):
    rows = []
    with open(path, encoding="utf-8") as fh:
        for n, line in enumerate(fh, 1):
            line = line.rstrip("\n")
            if not line:
                continue
            body, h = line.rsplit("^", 1)
            if hashlib.md5(body.encode("utf-8")).hexdigest()[:6] != h:
                sys.exit(f"{path}:{n}: hash mismatch, refusing to continue")
            f = body.split("^")
            if len(f) != nfields:
                sys.exit(f"{path}:{n}: expected {nfields} fields, got {len(f)}")
            rows.append(f)
    return rows


def load_records():
    recs = {}
    for f in read_hashed(os.path.join(RAW, "records.txt"), 16):
        idx = int(f[0])
        recs[idx] = dict(
            idx=idx, slug=f[1], state_slug=f[2], city_slug=f[3], name=f[4], address=f[5], zip5=f[6],
            has_place_id=f[7] == "1", has_phone=f[8] == "1", has_website=f[9] == "1",
            coord_decimals=int(f[10]), rating=f[11], review_count=f[12], n_filled=int(f[13]),
            created=f[14], updated=f[15],
        )
        recs[idx]["path"] = f"/public-pools/{f[2]}/{f[3]}/{f[1]}/"
    return recs


def load_pairs():
    out = []
    for f in read_hashed(os.path.join(RAW, "pairs.txt"), 13):
        dist = int(f[10]) if f[10] != "" else None
        out.append(dict(
            ia=int(f[0]), ib=int(f[1]), e_pid=f[2], name_eq=f[3] == "1", same_city=f[4] == "1",
            name_sim=f[5] == "1", jac_all=f[6], jac_core=f[7], e_street=f[8], e_zip=f[9],
            dist_raw=dist, e_phone=f[11], e_web=f[12],
        ))
    return out


def load_live():
    """raw/live-status.tsv: url, http status, redirect target, canonical href, noindex flag (GET of each
    record URL on 2026-11-15, one request per ~0.6 s). Optional: columns stay empty without it."""
    path = os.path.join(RAW, "live-status.tsv")
    out = {}
    if not os.path.exists(path):
        return out
    for line in open(path, encoding="utf-8"):
        f = line.rstrip("\n").split("\t")
        if len(f) != 5:
            continue
        url, code, redir, canon, noindex = f
        out[url[len(SITE):]] = dict(http=code, redirect=redir, canonical_self=int(canon == url) if canon else "",
                                    noindex=int(noindex not in ("", "0")))
    return out


def load_sitemap(path):
    xml = open(path, encoding="utf-8").read()
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    paths = set()
    for u in locs:
        if not u.startswith(SITE + "/public-pools/"):
            continue
        paths.add(u[len(SITE):])
    return locs, paths


ABBR = {"street": "st", "avenue": "ave", "av": "ave", "boulevard": "blvd", "drive": "dr", "road": "rd",
        "lane": "ln", "court": "ct", "place": "pl", "parkway": "pkwy", "highway": "hwy", "circle": "cir",
        "trail": "trl", "terrace": "ter", "square": "sq", "north": "n", "south": "s", "east": "e",
        "west": "w", "northeast": "ne", "northwest": "nw", "southeast": "se", "southwest": "sw",
        "suite": "ste", "way": "wy"}


def street_parts(address):
    first = address.split(",", 1)[0].lower()
    toks = [ABBR.get(t, t) for t in re.split(r"[^a-z0-9]+", first) if t]
    if not toks or not re.fullmatch(r"\d+", toks[0]):
        return None, None
    return int(toks[0]), " ".join(toks[1:])


def street_near(a, b):
    """Near-match of the street part, used only when the SQL exact match (e_street='a') fails:
    house numbers within 50 and street names similar (ratio >= 0.85), or the same house number with
    one street name a prefix of the other (e.g. '1325 Q St' vs '1325 Q St Ste 200').
    Examples it catches: 1597/1599 City Park Dr, Wisseman/Wissemann Dr, Fauntleroy Way/Wy.
    It is a weaker signal than an exact match and is labelled separately (street_near)."""
    na, sa = street_parts(a)
    nb, sb = street_parts(b)
    if na is None or nb is None or not sa or not sb:
        return False
    if na == nb and (sa.startswith(sb) or sb.startswith(sa)):
        return True
    if abs(na - nb) > 50:
        return False
    return difflib.SequenceMatcher(None, sa, sb).ratio() >= 0.85


QUALIFIERS = {"indoor", "outdoor", "kiddie", "diving", "wading", "competition", "lap", "wave", "deep"}


def qualifiers(name):
    return {t for t in re.split(r"[^a-z]+", name.lower()) if t in QUALIFIERS}


REVIEW_DIFF = 0.20  # review counts of one Google listing scraped on one day agree within a few percent


def review_counts_differ(A, B):
    """(differ, text). True when both records carry a review count, were created on the same day, and the
    counts differ by more than REVIEW_DIFF of the larger one: the two records were filled from two DIFFERENT
    Google listings, whatever their place_id says (added 2026-11-16 after the content review: Welles Park
    634 vs 143, Holstein Park 389 vs 159, Hamilton Fish 1205 vs 193; a listing really shared by two records
    gives e.g. 4087/4087, 10765/10761, 944/944)."""
    try:
        a, b = int(A["review_count"]), int(B["review_count"])
    except (TypeError, ValueError):
        return False, ""
    if a <= 0 or b <= 0 or A["created"] != B["created"]:
        return False, ""
    return abs(a - b) / max(a, b) > REVIEW_DIFF, "%d vs %d reviews" % (a, b)


def same_street_name(a, b):
    """Same street name (ignoring the house number), e.g. '2425 S Arizona Ave' and '3838 S Arizona Ave'."""
    na, sa = street_parts(a)
    nb, sb = street_parts(b)
    return bool(sa) and sa == sb


def street_name_conflict(a, b):
    """Both records have a street address and the street NAMES differ (affirmative evidence of two places)."""
    na, sa = street_parts(a)
    nb, sb = street_parts(b)
    return bool(sa) and bool(sb) and sa != sb and not street_near(a, b)


def coord_error_m(dec):
    """Worst-case rounding error of a lat/lon pair given with `dec` decimals (approx. metres)."""
    return 78500 * 10 ** (-dec)


def classify(p, A, B):
    """Returns (class, literal_rule, distance, low_precision, street_near, agree, disagree, missing, notes).

    SAME_FACILITY  place id identical (task rule), or address+zip identical and within 75 m while
                   only one record has a place id (no identifier contradicts it).
    LIKELY_SAME    strong but incomplete evidence; the note says what is missing or conflicting.
    DIFFERENT      affirmative evidence of two locations (see conditions below).
    UNDETERMINED   everything else, including every pair that rests on a shared name alone.
    """
    agree, disagree, missing, notes = [], [], [], []
    dist = p["dist_raw"]
    if dist == NULL_DISTANCE_ARTEFACT or A["coord_decimals"] < 0 or B["coord_decimals"] < 0:
        dist = None
    mindec = min(A["coord_decimals"], B["coord_decimals"])
    low_prec = dist is not None and mindec < MIN_DECIMALS
    close = dist is not None and dist <= CLOSE_M

    def far(threshold):  # distance beyond threshold AND beyond 3x the rounding error
        return dist is not None and dist > max(threshold, 3 * coord_error_m(mindec))

    near_st = p["e_street"] != "a" and street_near(A["address"], B["address"])
    addr_match = p["e_street"] == "a" or near_st
    street_differs = p["e_street"] == "d" and not near_st
    name_ok = p["name_eq"] or p["name_sim"]
    try:
        jac_all = float(p["jac_all"])
    except ValueError:
        jac_all = 0.0
    strong_name = p["name_eq"] or jac_all >= 0.5
    contact = p["e_phone"] == "a" or p["e_web"] == "a"
    qa, qb = qualifiers(A["name"]), qualifiers(B["name"])
    qual_conflict = bool(qa and qb and qa != qb)  # e.g. "Indoor Pool" vs "Outdoor Pool"

    def tri(code, label):
        {"a": agree, "d": disagree, "m": missing}[code].append(label)
    tri(p["e_pid"], "place_id")
    if p["name_eq"]:
        agree.append("name_exact")
    elif p["name_sim"]:
        agree.append("name_similar")
    else:
        disagree.append("name")
    if p["e_street"] == "a":
        agree.append("street")
    elif near_st:
        agree.append("street_near")
    else:
        tri(p["e_street"], "street")
    tri(p["e_zip"], "zip")
    if dist is None:
        missing.append("coordinates")
    elif close:
        agree.append("coords_within_75m")
    elif low_prec:
        missing.append("coordinates_low_precision(%dm)" % dist)
    else:
        disagree.append("coords_%dm" % dist)
    tri(p["e_phone"], "phone")
    tri(p["e_web"], "website")
    (agree if p["same_city"] else disagree).append("city_id")

    literal_same = p["e_pid"] == "a" or (p["e_street"] == "a" and p["e_zip"] == "a" and close)
    coord_txt = ("no coordinates on one record" if dist is None else
                 f"{dist} m apart, one record has only {mindec} coordinate decimals" if low_prec else
                 f"{dist} m apart")

    rc_differ, rc_txt = review_counts_differ(A, B)
    qual_diff = qual_conflict or bool(qa) != bool(qb)
    if p["e_pid"] == "a" and (rc_differ or qual_diff):
        # Revised 2026-11-16 (content review): a shared place id does NOT make one facility when the names
        # point to different pools or the review counts show two different Google listings.
        if rc_differ and qual_diff:
            cls = "DIFFERENT"
            notes.append("different pools at one site: identical place id, but the names carry different "
                         "qualifiers (%s vs %s) and the review counts differ (%s, same scrape date), so the two "
                         "records were filled from two different Google listings; the shared place id is wrong, "
                         "not proof of one facility"
                         % ("/".join(sorted(qa)) or "none", "/".join(sorted(qb)) or "none", rc_txt))
        elif rc_differ:
            cls = "UNDETERMINED"
            notes.append("identical place id, but the review counts differ (%s, same scrape date): the records "
                         "were filled from two different Google listings, so the shared place id does not prove "
                         "one facility; needs a human look" % rc_txt)
        else:
            cls = "UNDETERMINED"
            notes.append("identical place id and matching review counts (one Google listing reused), but the "
                         "names point to different pools (%s vs %s): not shown to be duplicates of one listing"
                         % ("/".join(sorted(qa)) or "none", "/".join(sorted(qb)) or "none"))
        if dist is not None and dist > CLOSE_M:
            notes.append("coordinates " + coord_txt)
    elif p["e_pid"] == "a":
        cls = "SAME_FACILITY"
        if dist is not None and dist > CLOSE_M:
            notes.append("identical place id but coordinates " + coord_txt
                         + ("" if low_prec else ": one record's coordinates (or place id) is wrong"))
        if not name_ok:
            notes.append("names differ although the place id is identical (one Google place may cover several "
                         "pools in one park): check before any merge")
    elif literal_same and p["e_pid"] == "m":
        cls = "SAME_FACILITY"
        notes.append("address+zip identical and within 75 m; only one record has a place id")
        if not name_ok:
            notes.append("names differ: check before any merge")
    elif p["e_pid"] == "d" and close and (addr_match or contact) and strong_name and not qual_conflict:
        cls = "LIKELY_SAME"
        notes.append("conflict: the two records carry DIFFERENT place ids (Google lists two places here, "
                     "e.g. a recreation center and its pool) although "
                     + ("street/zip" if addr_match else "phone/website") + ", name and coordinates agree")
    elif p["e_pid"] == "m" and addr_match and p["e_zip"] in ("a", "m") and name_ok:
        cls = "LIKELY_SAME"
        miss = ["place id on one record"]
        if p["e_street"] != "a":
            miss.append("exact street match (only a near match)")
        if p["e_zip"] == "m":
            miss.append("zip on one record")
        if not close:
            miss.append("coordinate agreement (" + coord_txt + ")")
        if not strong_name:
            miss.append("a close name match (names only partly overlap)")
        notes.append("missing: " + "; ".join(miss))
    elif p["e_pid"] == "m" and close and name_ok:
        cls = "LIKELY_SAME"
        miss = ["place id on one record"]
        if not addr_match:
            miss.append("address to compare" if p["e_street"] == "m" else "address agreement")
        notes.append("coordinates within 75 m and names match; missing: " + "; ".join(miss))
    elif low_prec and p["e_pid"] != "d" and far(2000) and p["e_zip"] != "a" and not addr_match \
            and not street_name_conflict(A["address"], B["address"]):
        # Revised 2026-11-16 (content review, G084): when one record has low-precision coordinates and the
        # place ids do not disagree, distance alone is not evidence of two sites. Narrowed on resume: precise
        # coordinates (G091 'hot tub' 21 km, G134 'Pool' 4.4 km apart) still count as evidence.
        if p["name_eq"] and p["same_city"] and same_street_name(A["address"], B["address"]):
            cls = "LIKELY_SAME"
            notes.append("missing: place id on one record" if p["e_pid"] == "m" else "missing: usable coordinates")
            notes.append("same name, same city and same street (house numbers differ); the distance (" + coord_txt
                         + ") rests on " + ("low-precision coordinates" if low_prec else "the coordinates")
                         + (" and a record without a place id" if p["e_pid"] == "m" else "")
                         + ", so it is not taken as evidence of two sites")
        else:
            cls = "UNDETERMINED"
            notes.append("far apart (" + coord_txt + "), but the coordinates are low precision"
                         + (" and one record has no place id" if p["e_pid"] == "m" else "")
                         + ": distance alone is not taken as evidence of two sites; needs a human look")
    elif p["e_pid"] == "d" and not close and p["name_eq"] and p["e_phone"] == "a" and p["same_city"] \
            and dist is not None and dist <= 2000:
        # Revised 2026-11-16 (content review, G177): same name and phone in the same city, under 2 km apart.
        cls = "UNDETERMINED"
        notes.append("same name and phone in the same city, " + coord_txt + ", different place ids: one listing "
                     "that moved (old and new address) or two branches; needs a human look")
    elif (p["e_pid"] == "d" and not close and (street_differs or far(FAR_M))) \
            or (far(2000) and p["e_zip"] != "a" and not addr_match):
        cls = "DIFFERENT"
        if contact and name_ok:
            notes.append("shared phone/website, different location: one operator with several sites (chain/branch)")
        elif name_ok:
            notes.append("same or similar name, different location (" + coord_txt + ")")
        else:
            notes.append("different location")
    else:
        cls = "UNDETERMINED"
        if p["e_pid"] == "d" and close:
            # Say which LIKELY_SAME condition actually failed (a qualifier conflict alone is reported below).
            why = ("different names" if not strong_name else
                   "no address or phone/website agreement" if not (addr_match or contact) else
                   "names that point to different pools")
            notes.append("within 75 m but different place ids and " + why
                         + ": could be one facility listed twice or separate entities sharing a site "
                           "(pool vs recreation center, club or office at the same address)")
        elif p["e_pid"] == "d" and addr_match:
            notes.append("same street address but different place ids, and coordinates do not confirm one site ("
                         + coord_txt + ")")
        elif addr_match and not name_ok:
            notes.append("same street address/zip but names differ; " + coord_txt)
        elif addr_match:
            notes.append("same name and street, but zip/coordinates disagree (" + coord_txt
                         + "): a data error in one record or two sites")
        elif dist is None and p["e_street"] == "m":
            notes.append("shared name only; no address or coordinates on at least one record to compare")
        elif street_differs and p["e_zip"] == "a":
            notes.append("same name and zip, different street address (" + coord_txt
                         + "); no shared identifier: a data error in one record or a second site")
        else:
            notes.append("signals conflict (" + coord_txt + "); needs a human look")

    if qual_conflict:
        notes.append("names point to different pools at one site (%s vs %s): not duplicates of one listing"
                     % ("/".join(sorted(qa)), "/".join(sorted(qb))))
    elif bool(qa) != bool(qb):
        notes.append("only one name carries a qualifier (%s): the site may have more than one pool; confirm "
                     "before any merge" % "/".join(sorted(qa or qb)))
    if not p["same_city"]:
        notes.append(f"filed under different city pages ({A['city_slug']} vs {B['city_slug']})")
    return cls, literal_same, dist, low_prec, near_st, agree, disagree, missing, notes


# Observations read by hand from the saved live page text (text-defects/live-2026-11-16/live-fields.jsonl.gz,
# fetched read-only 2026-11-16). They are appended to the generated note; they never change a class.
HAND_NOTES = {
    ("welles-park-pool", "welles-park-pool-indoor"):
        "live pages 2026-11-16: welles-park-pool describes 'an outdoor pool' (free, zero-depth entry), "
        "welles-park-pool-indoor describes an indoor pool with weekday hours from 7:30 AM",
    ("holstein-park-pool", "holstein-park-public-pool-outdoor"):
        "live pages 2026-11-16: BOTH texts call Holstein an outdoor pool, but the '(Outdoor)' record carries "
        "weekday hours until 9 PM and is closed on Sunday; two Google listings, and one record's data is "
        "probably attached to the wrong pool: check which pool each page describes (content fix, not a merge)",
    ("hamilton-fish-pool", "hamilton-fish-pool-2"):
        "1205 vs 193 reviews and different phones: two Google listings",
}


def keeper(A, B, in_sm, indexable):
    """Proposal only. Order: in the live sitemap > live page is indexable (200, no noindex) > has place
    id > more filled fields > has a street address with a house number > coordinate precision >
    shorter slug (no numeric or city suffix)."""
    def key(r):
        return (in_sm[r["idx"]], indexable(r), r["has_place_id"], r["n_filled"],
                street_parts(r["address"])[0] is not None, r["coord_decimals"], -len(r["slug"]))
    ka, kb = key(A), key(B)
    if ka == kb:
        return "", "tie on every criterion; owner to choose"
    win, lose = (A, B) if ka > kb else (B, A)
    kw, kl = key(win), key(lose)
    names = ["only one is in the live sitemap", "only one live page is indexable (the other is noindex)",
             "only one has a place id", "more filled fields (%d vs %d)" % (kw[3], kl[3]),
             "only one has a street address", "more precise coordinates", "shorter slug"]
    for i, (x, y) in enumerate(zip(kw, kl)):
        if x != y:
            reason = names[i]
            break
    extra = []
    if lose["has_phone"] and not win["has_phone"]:
        extra.append("phone")
    if lose["has_website"] and not win["has_website"]:
        extra.append("website")
    if not win["has_place_id"] and lose["has_place_id"]:
        extra.append("place id")
    if lose["coord_decimals"] > win["coord_decimals"] and win["coord_decimals"] < MIN_DECIMALS:
        extra.append("more precise coordinates")
    if "," in lose["address"] and "," not in win["address"]:
        extra.append("full postal address")
    if not win["address"] and lose["address"]:
        extra.append("address")
    if extra:
        reason += "; the other record holds " + "/".join(extra) + " that a merge would need to carry over"
    return win["slug"], reason


def components(pairs, n_nodes_hint=None):
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for p in pairs:
        ra, rb = find(p["ia"]), find(p["ib"])
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)
    groups = defaultdict(list)
    for x in list(parent):
        groups[find(x)].append(x)
    order = sorted(groups, key=lambda r: min(groups[r]))
    gid = {}
    for i, r in enumerate(order, 1):
        for x in groups[r]:
            gid[x] = (f"G{i:03d}", len(groups[r]))
    return gid


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    recs = load_records()
    pairs = load_pairs()
    locs, sm_paths = load_sitemap(sys.argv[1])
    in_sm = {i: r["path"] in sm_paths for i, r in recs.items()}
    live = load_live()

    def lv(r, k):
        return live.get(r["path"], {}).get(k, "")

    # self-checks: every record is used, every pair references known records, artefact == missing coords
    used = {p["ia"] for p in pairs} | {p["ib"] for p in pairs}
    assert used == set(recs), "records/pairs mismatch"
    for p in pairs:
        A, B = recs[p["ia"]], recs[p["ib"]]
        nocoord = A["coord_decimals"] < 0 or B["coord_decimals"] < 0
        assert (p["dist_raw"] in (NULL_DISTANCE_ARTEFACT, None)) == nocoord, (A["slug"], B["slug"])

    gid = components(pairs)
    cols = ["group_id", "group_size", "classification", "literal_rule_same_facility", "proposed_keeper",
            "keeper_reason", "a_slug", "b_slug", "a_url", "b_url", "a_in_sitemap", "b_in_sitemap",
            "a_http", "b_http", "a_noindex", "b_noindex", "a_canonical_self", "b_canonical_self",
            "a_name", "b_name", "a_address", "b_address", "a_zip", "b_zip",
            "place_id", "name_exact", "name_similar", "name_jaccard_all", "name_jaccard_core", "street", "street_near",
            "zip", "distance_m", "coords_low_precision", "phone", "website", "same_city_id",
            "signals_agree", "signals_disagree", "signals_missing",
            "a_has_place_id", "b_has_place_id", "a_n_filled", "b_n_filled", "a_coord_decimals", "b_coord_decimals",
            "a_rating", "b_rating", "a_review_count", "b_review_count", "a_created", "b_created", "notes"]
    word = {"a": "agree", "d": "differ", "m": "missing"}
    rows = []
    for p in pairs:
        A, B = recs[p["ia"]], recs[p["ib"]]
        cls, lit, dist, low, near, ag, dis, mi, notes = classify(p, A, B)
        kslug, kreason = ("", "")
        if cls == "SAME_FACILITY":
            if any("different pools at one site" in n for n in notes):
                kslug, kreason = "", "no keeper proposed: the names describe different pools at one site"
            else:
                kslug, kreason = keeper(A, B, in_sm, lambda r: lv(r, "http") == "200" and lv(r, "noindex") == 0)
                if not (p["name_eq"] or p["name_sim"]):
                    kreason += "; names differ, so confirm it is one listing first"
        g, gs = gid[p["ia"]]
        hand = HAND_NOTES.get((A["slug"], B["slug"])) or HAND_NOTES.get((B["slug"], A["slug"]))
        if hand:
            notes.append(hand)
        rows.append({
            "group_id": g, "group_size": gs, "classification": cls, "literal_rule_same_facility": int(lit),
            "proposed_keeper": kslug, "keeper_reason": kreason,
            "a_slug": A["slug"], "b_slug": B["slug"], "a_url": SITE + A["path"], "b_url": SITE + B["path"],
            "a_in_sitemap": int(in_sm[A["idx"]]), "b_in_sitemap": int(in_sm[B["idx"]]),
            "a_http": lv(A, "http"), "b_http": lv(B, "http"), "a_noindex": lv(A, "noindex"), "b_noindex": lv(B, "noindex"),
            "a_canonical_self": lv(A, "canonical_self"), "b_canonical_self": lv(B, "canonical_self"),
            "a_name": A["name"], "b_name": B["name"], "a_address": A["address"], "b_address": B["address"],
            "a_zip": A["zip5"], "b_zip": B["zip5"],
            "place_id": word[p["e_pid"]], "name_exact": int(p["name_eq"]), "name_similar": int(p["name_sim"]),
            "name_jaccard_all": p["jac_all"], "name_jaccard_core": p["jac_core"],
            "street": word[p["e_street"]], "street_near": int(near), "zip": word[p["e_zip"]],
            "distance_m": "" if dist is None else dist, "coords_low_precision": int(low),
            "phone": word[p["e_phone"]], "website": word[p["e_web"]], "same_city_id": int(p["same_city"]),
            "signals_agree": "|".join(ag), "signals_disagree": "|".join(dis), "signals_missing": "|".join(mi),
            "a_has_place_id": int(A["has_place_id"]), "b_has_place_id": int(B["has_place_id"]),
            "a_n_filled": A["n_filled"], "b_n_filled": B["n_filled"],
            "a_coord_decimals": A["coord_decimals"], "b_coord_decimals": B["coord_decimals"],
            "a_rating": A["rating"], "b_rating": B["rating"],
            "a_review_count": A["review_count"], "b_review_count": B["review_count"],
            "a_created": A["created"], "b_created": B["created"], "notes": "; ".join(notes),
        })
    # Keeper proposals must be consistent inside a group: if any SAME_FACILITY pair in a group names
    # different pools at one site, or the pairwise winners do not agree on a single record, no keeper is
    # proposed for that group at all (owner decides).
    by_group = defaultdict(list)
    for r in rows:
        if r["classification"] == "SAME_FACILITY":
            by_group[r["group_id"]].append(r)
    for g, sub in by_group.items():
        conflict = any("different pools at one site" in r["notes"] for r in sub)
        slugs = {r["a_slug"] for r in sub} | {r["b_slug"] for r in sub}
        winners = {r["proposed_keeper"] for r in sub if r["proposed_keeper"]}
        losers = {(r["b_slug"] if r["proposed_keeper"] == r["a_slug"] else r["a_slug"]) for r in sub if r["proposed_keeper"]}
        consistent = len(winners - losers) == 1 and (slugs - losers) == (winners - losers)
        if len(sub) > 1 and (conflict or not consistent):
            why = ("group contains records that name different pools at one site" if conflict
                   else "pairwise proposals in this group do not agree on one record")
            for r in sub:
                r["proposed_keeper"], r["keeper_reason"] = "", "no keeper proposed: " + why + "; owner to choose"
    order = {"SAME_FACILITY": 0, "LIKELY_SAME": 1, "UNDETERMINED": 2, "DIFFERENT": 3}
    rows.sort(key=lambda r: (order[r["classification"]], r["group_id"], r["a_slug"], r["b_slug"]))
    with open(os.path.join(HERE, "duplicate-mapping.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)

    # ---- counts for the README
    cc = Counter(r["classification"] for r in rows)
    print("pairs", len(rows), "records", len(recs), "groups", len({v[0] for v in gid.values()}))
    print("classes", dict(cc))
    print("literal rule SAME_FACILITY", sum(r["literal_rule_same_facility"] for r in rows))
    sf = [r for r in rows if r["classification"] == "SAME_FACILITY"]
    print("SAME_FACILITY both in sitemap", sum(1 for r in sf if r["a_in_sitemap"] and r["b_in_sitemap"]),
          "one", sum(1 for r in sf if r["a_in_sitemap"] != r["b_in_sitemap"]),
          "none", sum(1 for r in sf if not r["a_in_sitemap"] and not r["b_in_sitemap"]))
    for c in order:
        sub = [r for r in rows if r["classification"] == c]
        print(c, "pairs", len(sub), "both-in-sitemap", sum(1 for r in sub if r["a_in_sitemap"] and r["b_in_sitemap"]),
              "one", sum(1 for r in sub if r["a_in_sitemap"] != r["b_in_sitemap"]),
              "records", len({r["a_slug"] for r in sub} | {r["b_slug"] for r in sub}))
    print("records in sitemap", sum(in_sm.values()), "of", len(recs))
    if live:
        print("live http", dict(Counter(lv(r, "http") for r in recs.values())),
              "noindex", sum(1 for r in recs.values() if lv(r, "noindex") == 1),
              "noindex&in_sitemap", sum(1 for r in recs.values() if lv(r, "noindex") == 1 and in_sm[r["idx"]]),
              "canonical_self", dict(Counter(lv(r, "canonical_self") for r in recs.values())))
        for c in order:
            sub = [r for r in rows if r["classification"] == c]
            print(" ", c, "pairs where both pages answer 200 and are indexable",
                  sum(1 for r in sub if r["a_http"] == "200" and r["b_http"] == "200" and r["a_noindex"] == 0 and r["b_noindex"] == 0))
    print("sitemap locs", len(locs), "pool-depth", sum(1 for p in sm_paths if p.strip("/").count("/") == 3))
    print("SAME_FACILITY rows without a proposed keeper", sum(1 for r in sf if not r["proposed_keeper"]))
    print("literal-rule pairs downgraded (different place ids)", dict(Counter(
        r["classification"] for r in rows if r["literal_rule_same_facility"] and r["classification"] != "SAME_FACILITY")))
    print("SAME_FACILITY different city", sum(1 for r in sf if not r["same_city_id"]))
    print("SAME_FACILITY names not similar", sum(1 for r in sf if not r["name_exact"] and not r["name_similar"]))
    print("SAME_FACILITY pid identical but >75m", sum(1 for r in sf if r["place_id"] == "agree" and r["distance_m"] != "" and r["distance_m"] > CLOSE_M))

    # ---- count consistency
    crow = []
    for f in read_hashed(os.path.join(RAW, "cities.txt"), 6):
        state, city, cname, abbr, pc, actual = f
        actual = int(actual)
        path = f"/public-pools/{state}/{city}/"
        if pc == "NULL":
            kind, diff = "pool_count_null", ""
        else:
            diff = actual - int(pc)
            kind = ("zero_published_pools" if actual == 0 and diff == 0 else
                    "zero_published_pools;pool_count_higher" if actual == 0 else
                    "pool_count_lower" if diff > 0 else "pool_count_higher")
        if pc == "NULL" and actual == 0:
            kind = "zero_published_pools;pool_count_null"
        if pc == "NULL":
            bucket = "pool_count NULL"
        elif actual == 0:
            bucket = "zero pools (count agrees)"
        else:
            d = actual - int(pc)
            bucket = ("1" if d == 1 else "2-3" if d <= 3 else "4-9" if d <= 9 else "10+") if d > 0 else "negative"
        crow.append({"state_slug": state, "city_slug": city, "city_name": cname, "state_abbr": abbr,
                     "pool_count_column": pc if pc != "NULL" else "", "published_pools_actual": actual,
                     "difference_actual_minus_column": diff, "difference_bucket": bucket, "issue": kind,
                     "city_url": SITE + path, "city_in_sitemap": int(path in sm_paths)})
    border = {"zero pools (count agrees)": 0, "pool_count NULL": 1, "10+": 2, "4-9": 3, "2-3": 4, "1": 5, "negative": 6}
    crow.sort(key=lambda r: (border[r["difference_bucket"]], r["state_slug"], r["city_slug"]))
    with open(os.path.join(HERE, "count-consistency.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(crow[0]))
        w.writeheader()
        w.writerows(crow)
    bc = Counter(r["difference_bucket"] for r in crow)
    print("cities", len(crow), dict(bc))
    for b in border:
        sub = [r for r in crow if r["difference_bucket"] == b]
        print(" ", b, len(sub), "in sitemap", sum(r["city_in_sitemap"] for r in sub))
    print("NULL-count cities with actual==1:", sum(1 for r in crow if r["difference_bucket"] == "pool_count NULL" and r["published_pools_actual"] == 1))


if __name__ == "__main__":
    main()
