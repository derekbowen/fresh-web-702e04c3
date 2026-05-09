// Scrape empty host advocacy pages from the Wayback Machine, bypassing the
// fresh-web reverse proxy loop (which now serves a 404 placeholder for any
// advocacy slug that has no body in the DB).
//
// Strategy: source_url points at https://www.poolrentalnearme.com/p/<slug>.
// Wrap that with `https://web.archive.org/web/2025/<original>` and let
// Wayback redirect Firecrawl to the closest captured snapshot. Wayback
// strips its own toolbar markup when given the bare snapshot URL, so the
// resulting markdown is the original page body.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FC = process.env.FIRECRAWL_API_KEY!;
if (!SUPABASE_URL || !SVC || !FC) {
  console.error("missing env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / FIRECRAWL_API_KEY)");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SVC, { auth: { persistSession: false } });

const REJECT_MARKERS = [
  "Page not found",
  "this page doesn't exist",
  "data-lovable-blank-page-placeholder",
  "maintenance mode",
  "marketplace is not fully operational",
];

function isUnusable(md: string | null) {
  if (!md) return true;
  // Wayback toolbar + Sharetribe maintenance shell is ~500 bytes; real
  // captured advocacy pages are 30KB+. 2KB is a safe floor.
  if (md.length < 2000) return true;
  const lower = md.toLowerCase();
  return REJECT_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

function waybackUrl(original: string) {
  // Use a generic year prefix; Wayback 302s to the closest snapshot.
  // Trailing `if_` would strip the toolbar, but the bare form already gives
  // clean markdown via Firecrawl's onlyMainContent.
  return `https://web.archive.org/web/2025/${original}`;
}

async function firecrawl(url: string) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FC}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
      onlyMainContent: true,
      waitFor: 1500,
    }),
  });
  const json: any = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`fc ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  const doc = json?.data ?? json;
  return {
    markdown: (doc?.markdown ?? null) as string | null,
    html: (doc?.html ?? doc?.rawHtml ?? null) as string | null,
    title: (doc?.metadata?.title ?? null) as string | null,
    description: (doc?.metadata?.description ?? null) as string | null,
  };
}

// Strip residual Wayback toolbar / nav if Firecrawl left any in.
function cleanWaybackMarkdown(md: string) {
  return md
    .replace(/\[\!\[Wayback Machine\][\s\S]*?\)\s*/g, "")
    .replace(/^.*web\.archive\.org\/web\/.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function processRow(row: any) {
  const original = (row.source_url as string)?.replace(/^http:\/\//, "https://");
  if (!original) return { slug: row.slug, status: "no-source-url" };

  const url = waybackUrl(original);
  let scraped;
  try {
    scraped = await firecrawl(url);
  } catch (e) {
    return { slug: row.slug, status: "scrape-failed", error: (e as Error).message };
  }

  const md = scraped.markdown ? cleanWaybackMarkdown(scraped.markdown) : null;
  if (looksLikeProxy404(md)) {
    return { slug: row.slug, status: "no-archive-or-empty", bytes: md?.length ?? 0 };
  }

  const update: Record<string, unknown> = {
    body_markdown: md,
    raw_html: scraped.html,
    scraped_at: new Date().toISOString(),
    status: "scraped",
  };
  if (!row.title && scraped.title) update.title = scraped.title;
  if (scraped.title && !row.seo_title) update.seo_title = scraped.title.slice(0, 200);
  if (scraped.description && !row.seo_description) {
    update.seo_description = scraped.description.slice(0, 300);
  }

  const { error } = await sb.from("content_pages").update(update).eq("id", row.id);
  if (error) return { slug: row.slug, status: "update-failed", error: error.message };
  return { slug: row.slug, status: "ok", bytes: md!.length, title: scraped.title };
}

async function main() {
  const { data: rows, error } = await sb
    .from("content_pages")
    .select("id, slug, source_url, title, seo_title, seo_description, body_markdown, template_type")
    .in("template_type", ["host_advocacy_state", "host_advocacy_hub"])
    .or("body_markdown.is.null,body_markdown.eq.");
  if (error) throw error;

  const targets = (rows ?? []).filter(
    (r: any) => !r.body_markdown || r.body_markdown.length < 200,
  );
  console.log(`Targets: ${targets.length}`);

  const results: any[] = [];
  for (const r of targets) {
    const t0 = Date.now();
    const out = await processRow(r);
    console.log(JSON.stringify({ ms: Date.now() - t0, ...out }));
    results.push(out);
    // Be polite to Wayback.
    await new Promise((res) => setTimeout(res, 1200));
  }
  const ok = results.filter((r) => r.status === "ok").length;
  console.log(`\nDONE: ok=${ok} / ${results.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
