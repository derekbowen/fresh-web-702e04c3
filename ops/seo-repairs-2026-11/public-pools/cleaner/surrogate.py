"""Rebuild pp_pools / pp_cities rows from the live-page extract of 2026-11-16 (text-defects/live-2026-11-16/
live-fields.jsonl.gz, GET-only fetch of the 2,000 pool and 476 city pages in the saved sitemap).

Why: the production database could not be read on 2026-11-16 (tool unavailable). The rendered fields of every
compared row equalled the database extract of 2026-11-15 byte for byte (TEXT-DEFECTS.md section 0), so these
rows are a faithful local stand-in FOR THE TEXT COLUMNS of the sampled pages only. They are NOT production:
  * ids are local (uuid from md5 of the page URL); production ids are different;
  * pool rows without a page in the sample are absent; to make each city's published-pool count equal the
    count its page header printed, synthetic text-less "placeholder" pool rows are added (local only);
  * FAQ entries carry only q/a (extra keys seen in 5 production rows are not on the page);
  * pp_pools.city is the title-cased city slug and pp_cities.city_name the name in the city page's H1.
Nothing here is written anywhere except the local test database.
"""
import gzip
import hashlib
import json
import re
import uuid


def uid(key):
    return str(uuid.UUID(hashlib.md5(key.encode()).hexdigest()))


def title(slug):
    return " ".join(w.capitalize() for w in slug.split("-"))


def load_live(path):
    with gzip.open(path, "rt", encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def build(recs):
    """Returns (cities, pools): lists of dicts with the columns the cleaner reads (+ url, is_placeholder)."""
    cities, pools = {}, []
    for r in recs:
        if r["kind"] != "city" or r["status"] != "200":
            continue
        seg = r["url"].split("/")
        st, ci = seg[4], seg[5]
        m = re.match(r"Public Pools in (.*), ([^,]+)$", r.get("h1") or "")
        cities[(st, ci)] = {
            "id": uid(r["url"]), "url": r["url"], "state_slug": st, "city_slug": ci,
            "city_name": m.group(1) if m else title(ci), "ai_intro": r.get("intro") or None,
            "ai_faqs": r.get("faqs") or None, "is_published": True,
            "header_count": int(r["header_count"]) if r.get("header_count") is not None else None}
    for r in recs:
        if r["kind"] != "pool" or r["status"] != "200":
            continue
        seg = r["url"].split("/")
        st, ci, slug = seg[4], seg[5], seg[6]
        if (st, ci) not in cities:   # city page not in the sample: a text-less city row
            cities[(st, ci)] = {"id": uid(f"city:{st}/{ci}"), "url": None, "state_slug": st, "city_slug": ci,
                                "city_name": title(ci), "ai_intro": None, "ai_faqs": None, "is_published": True,
                                "header_count": None}
        about = r.get("about")
        pools.append({
            "id": uid(r["url"]), "url": r["url"], "slug": slug, "name": r.get("h1"), "city": title(ci),
            "city_id": cities[(st, ci)]["id"], "state_slug": st, "ai_best_for": r.get("best_for"),
            "ai_description": "\n\n".join(about) if about else None, "ai_faqs": r.get("faqs") or None,
            "is_published": True, "is_placeholder": False})
    per_city = {}
    for p in pools:
        per_city[p["city_id"]] = per_city.get(p["city_id"], 0) + 1
    for c in cities.values():
        h = c["header_count"]
        have = per_city.get(c["id"], 0)
        for i in range(max(0, (h or 0) - have)):
            pools.append({"id": uid(f"placeholder:{c['state_slug']}/{c['city_slug']}/{i}"), "url": None,
                          "slug": f"placeholder-{c['city_slug']}-{i}", "name": None, "city": title(c["city_slug"]),
                          "city_id": c["id"], "state_slug": c["state_slug"], "ai_best_for": None,
                          "ai_description": None, "ai_faqs": None, "is_published": True, "is_placeholder": True})
    return list(cities.values()), pools


def lit(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (list, dict)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def insert_sql(cities, pools):
    out = ["set client_min_messages = warning;"]
    for c in cities:
        out.append("insert into public.pp_cities (id, city_name, city_slug, state_slug, ai_intro, ai_faqs, is_published, pool_count) "
                   f"values ({lit(c['id'])}, {lit(c['city_name'])}, {lit(c['city_slug'])}, {lit(c['state_slug'])}, "
                   f"{lit(c['ai_intro'])}, {lit(c['ai_faqs'])}, {lit(c['is_published'])}, {lit(c.get('header_count'))});")
    for p in pools:
        out.append("insert into public.pp_pools (id, slug, name, city, city_id, ai_best_for, ai_description, ai_faqs, is_published) "
                   f"values ({lit(p['id'])}, {lit(p['slug'])}, {lit(p['name'])}, {lit(p['city'])}, {lit(p['city_id'])}, "
                   f"{lit(p['ai_best_for'])}, {lit(p['ai_description'])}, {lit(p['ai_faqs'])}, {lit(p['is_published'])});")
    return "\n".join(out) + "\n"
