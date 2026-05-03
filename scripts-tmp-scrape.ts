// Bulk-fill the empty content_pages rows for our top-clicked indexed URLs.
// Scrapes via Firecrawl, writes title + seo_description + body_markdown +
// raw_html, marks status='scraped' (NOT 'published') so the dispatcher can
// already render the body via GenericPageTemplate.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FC = process.env.FIRECRAWL_API_KEY!;
if (!SUPABASE_URL || !SVC || !FC) {
  console.error("missing env"); process.exit(1);
}

const sb = createClient(SUPABASE_URL, SVC, { auth: { persistSession: false } });

// Top 40 clicked /p/* slugs from GSC, in priority order.
const TOP_SLUGS = [
  "all-locations","newyork","riverside","privatepoolrentalssandiego","las-vegas-search-page",
  "american-cities-with-pools","top-20-romantic-us-retreats-with-pools","host-advocacy-texas",
  "pool-rental-tax-write-offs-your-missing-out-on","sacramentobestprivatepools",
  "best-poolside-beers","howtoturnyourbackyardpoolintoabusinessasset","hosting","losangeles",
  "katytexas","swimply-alternative-vs-pool-rental-near-me","insurance-guide-for-pool-owners",
  "host-poolside-movie-night","host-advocacy-florida","earthquakes-and-inground-pools-guide",
  "dive-into-the-seventies-the-legendary-era-of-1970s-pool-parties","host-advocacy-alabama",
  "everything-you-need-to-know-about-pool-alarms","bestpoolsjurupavalleyca",
  "host-advocacy-new-jersey","host-advocacy-georgia","host-advocacy-california",
  "guide-to-graduation-party-pool-rental-mansfield-oh","conviertete-en-anfitrion-de-piscina-tampa-fl",
  "allowing-nudity-at-your-pool","about","the-evolution-and-rise-of-pool-toys-a-journey-through-summer-fun",
];

async function firecrawl(url: string) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FC}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown","html"], onlyMainContent: true }),
  });
  const json: any = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`fc ${res.status}: ${JSON.stringify(json).slice(0,200)}`);
  const doc = json?.data ?? json;
  return {
    markdown: (doc?.markdown ?? null) as string | null,
    html: (doc?.html ?? doc?.rawHtml ?? null) as string | null,
    title: (doc?.metadata?.title ?? null) as string | null,
    description: (doc?.metadata?.description ?? null) as string | null,
  };
}

async function processSlug(slug: string) {
  // Pick the canonical /p/{slug} row when there are duplicates.
  const { data: rows, error } = await sb
    .from("content_pages")
    .select("id, slug, url_path, source_url, title, body_markdown, status, template_type")
    .eq("slug", slug);
  if (error) throw error;
  if (!rows?.length) return { slug, status: "missing-row" };

  const canonical =
    rows.find((r: any) => r.url_path === `/p/${slug}`) ?? rows[0];

  if ((canonical as any).body_markdown && (canonical as any).body_markdown.length > 200) {
    return { slug, status: "already-filled" };
  }

  let url = (canonical as any).source_url as string;
  if (!url) return { slug, status: "no-source-url" };
  // Source URLs point at the legacy production site. Force https + www.
  url = url.replace(/^http:\/\//, "https://");

  let scraped;
  try {
    scraped = await firecrawl(url);
  } catch (e) {
    return { slug, status: "scrape-failed", error: (e as Error).message };
  }

  if (!scraped.markdown && !scraped.html) {
    return { slug, status: "empty-result" };
  }

  const update: Record<string, unknown> = {
    raw_html: scraped.html,
    body_markdown: scraped.markdown,
    scraped_at: new Date().toISOString(),
    status: "scraped",
  };
  if (!canonical.title && scraped.title) update.title = scraped.title;
  if (scraped.description) update.seo_description = scraped.description.slice(0, 300);
  if (scraped.title && !(canonical as any).seo_title) {
    update.seo_title = scraped.title.slice(0, 200);
  }

  const { error: upErr } = await sb
    .from("content_pages")
    .update(update)
    .eq("id", (canonical as any).id);
  if (upErr) return { slug, status: "update-failed", error: upErr.message };

  return {
    slug,
    status: "ok",
    bytes_md: scraped.markdown?.length ?? 0,
    title: scraped.title,
  };
}

async function main() {
  const results: any[] = [];
  for (const slug of TOP_SLUGS) {
    const t0 = Date.now();
    const r = await processSlug(slug);
    const ms = Date.now() - t0;
    console.log(JSON.stringify({ ms, ...r }));
    results.push(r);
  }
  const ok = results.filter(r => r.status === "ok").length;
  const skipped = results.filter(r => r.status === "already-filled").length;
  const failed = results.length - ok - skipped;
  console.log(`\nDONE: ok=${ok} already=${skipped} failed=${failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
