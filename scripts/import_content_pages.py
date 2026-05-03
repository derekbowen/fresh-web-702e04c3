"""
Import the PRNM master URL inventory (XLSX or CSV) into public.content_pages.

Usage:
  # From the workbook on disk:
  python scripts/import_content_pages.py /path/to/PRNM_Master_Link_List.xlsx

Requires env vars:
  SUPABASE_URL                 (or VITE_SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY    (admin key — needed to bypass RLS)

Idempotent: upserts on source_url. Re-runs are safe.
"""
import os, sys, re, json
from urllib.parse import urlparse
import pandas as pd
import requests

# ---- Category → template_type / locale / priority mapping --------------------
CATEGORY_MAP = {
    "Host Acquisition (City pSEO)":   ("host_acq_city",       "en", 50),
    "Host Acquisition (Hub)":         ("host_acq_hub",        "en", 90),
    "Public Pools — Individual Pool": ("public_pool",         "en", 20),
    "Public Pools — City Page":       ("public_pool_city",    "en", 40),
    "Public Pools — State Hub":       ("public_pool_state",   "en", 60),
    "Event/City Guide":               ("event_guide",         "en", 40),
    "Resource/Article Page":          ("resource",            "en", 30),
    "Amenity Page (individual)":      ("amenity",             "en", 20),
    "Amenities Hub":                  ("amenity_hub",         "en", 80),
    "eLearning Academy":              ("elearning",           "en", 30),
    "Host Advocacy (Hub)":            ("host_advocacy_hub",   "en", 50),
    "Host Advocacy (State Guide)":    ("host_advocacy_state", "en", 50),
    "Spanish Content":                ("spanish",             "es", 40),
    "Listing (Pool)":                 ("listing",             "en", 5),
    "Account/Legal":                  ("account_legal",       "en", 10),
    "Homepage":                       ("homepage",            "en", 100),
    "Other":                          ("other",               "en", 0),
}

# Refine Spanish into sub-templates by URL pattern
def refine_spanish(path: str) -> str:
    if "/conviertete-en-anfitrion" in path: return "spanish_host_acq"
    if "/aprende-a-rentar"        in path: return "spanish_resource"
    return "spanish"

def parse_row(url: str, category: str, in_sitemap, sitemap_source):
    parsed = urlparse(url)
    path = parsed.path or "/"
    slug = path.rstrip("/").rsplit("/", 1)[-1] or None

    tmpl, locale, priority = CATEGORY_MAP.get(category, ("other", "en", 0))
    if tmpl == "spanish":
        tmpl = refine_spanish(path)

    # hreflang group: strip the locale-specific prefix to pair en/es siblings
    hreflang_group = re.sub(
        r"^/(?:p/)?(?:conviertete-en-anfitrion|aprende-a-rentar|become-a-pool-host|learn-to-rent)-",
        "/__hreflang__/",
        path,
    )

    return {
        "source_url":     url,
        "url_path":       path,
        "slug":           slug,
        "category":       category,
        "template_type":  tmpl,
        "locale":         locale,
        "hreflang_group": hreflang_group if hreflang_group != path else None,
        "in_sitemap":     str(in_sitemap).strip().lower() in ("yes", "true", "1"),
        "sitemap_source": (sitemap_source or None) if pd.notna(sitemap_source) else None,
        "priority":       priority,
        "status":         "pending",
    }

def load_rows(path: str):
    if path.endswith((".xlsx", ".xls")):
        df = pd.read_excel(path, sheet_name="All URLs", header=1)
    else:
        df = pd.read_csv(path, header=1)
    df.columns = ["url", "category", "in_sitemap", "sitemap_source"][: len(df.columns)]
    df = df.dropna(subset=["url"])
    df = df[df["url"].astype(str).str.startswith(("http://", "https://"))]
    return [parse_row(r.url, r.category, r.in_sitemap, r.sitemap_source) for r in df.itertuples(index=False)]

def upsert_batch(supabase_url: str, service_key: str, rows: list[dict]):
    endpoint = f"{supabase_url}/rest/v1/content_pages?on_conflict=source_url"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    BATCH = 500
    total = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        r = requests.post(endpoint, headers=headers, data=json.dumps(chunk), timeout=60)
        if not r.ok:
            print(f"❌ batch {i//BATCH} failed: {r.status_code} {r.text[:300]}", file=sys.stderr)
            sys.exit(1)
        total += len(chunk)
        print(f"  upserted {total}/{len(rows)}")
    return total

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    src = sys.argv[1]
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    service_key  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not (supabase_url and service_key):
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr); sys.exit(1)

    rows = load_rows(src)
    print(f"📥 parsed {len(rows)} rows from {src}")
    by_tmpl = {}
    for r in rows:
        by_tmpl[r["template_type"]] = by_tmpl.get(r["template_type"], 0) + 1
    print("🔖 by template:", json.dumps(by_tmpl, indent=2))

    n = upsert_batch(supabase_url.rstrip("/"), service_key, rows)
    print(f"✅ done — {n} rows upserted into content_pages")

if __name__ == "__main__":
    main()
