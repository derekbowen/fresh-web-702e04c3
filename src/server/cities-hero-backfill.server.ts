/**
 * Server-only helpers for scraping city hero images from poolrentalnearme.com
 * and persisting them to cities.hero_image_url.
 *
 * The source site is a Sharetribe SPA — heroes are hydrated client-side as
 * CSS background-images on a hero <section>. We use Firecrawl to render the
 * page, then parse the returned HTML for the first sharetribe-assets imgix URL.
 */
import Firecrawl from "@mendable/firecrawl-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type BackfillResult = {
  slug: string;
  name: string;
  source_url: string;
  status: "ok" | "miss" | "error" | "skipped";
  hero_url?: string;
  error?: string;
};

// Cities whose source key on poolrentalnearme.com differs from a naive
// "lowercase + strip non-letters" of city name.
const SOURCE_KEY_OVERRIDES: Record<string, string> = {
  // db slug -> source key
  "kansas-city-mo": "kansascity",
  "kansas-city-ks": "kansascityks",
  "saint-petersburg-fl": "stpetersburg",
  "saint-paul-mn": "stpaul",
  "saint-louis-mo": "stlouis",
  "saint-augustine-fl": "staugustine",
  "fort-lauderdale-fl": "fortlauderdale",
  "fort-worth-tx": "fortworth",
  "fort-myers-fl": "fortmyers",
  "fort-collins-co": "fortcollins",
  "las-vegas-nv": "lasvegas",
  "los-angeles-ca": "losangeles",
  "san-diego-ca": "sandiego",
  "san-francisco-ca": "sanfrancisco",
  "san-jose-ca": "sanjose",
  "san-antonio-tx": "sanantonio",
  "new-york-ny": "newyork",
  "new-orleans-la": "neworleans",
};

export function deriveSourceKey(citySlug: string, cityName: string): string {
  const override = SOURCE_KEY_OVERRIDES[citySlug];
  if (override) return override;
  return cityName.toLowerCase().replace(/[^a-z]/g, "");
}

export function sourceUrlFor(citySlug: string, cityName: string): string {
  return `https://www.poolrentalnearme.com/p/${deriveSourceKey(citySlug, cityName)}`;
}

/**
 * Extract the first hero image URL from rendered HTML.
 * Looks for sharetribe-assets imgix URLs, which is where every hero on the
 * source site is stored. Skips obvious non-hero tiny imgix URLs (avatar/logo)
 * by ignoring URLs whose normalized width hint is < 400.
 */
export function extractHeroUrl(html: string): string | null {
  if (!html) return null;
  // Match either background-image:url(...) values or src="..." values pointing
  // at imgix.
  const re =
    /https:\/\/sharetribe-assets\.imgix\.net\/[A-Za-z0-9._\/-]+\?[^"'\s)]+/g;
  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = m[0]
      .replace(/&amp;/g, "&")
      .replace(/\\u0026/g, "&");
    candidates.push(url);
  }
  if (!candidates.length) return null;

  // Filter out tiny variants (logos / avatars). Keep the first big one.
  const isLargeEnough = (u: string) => {
    const wMatch = u.match(/[?&]w=(\d+)/);
    const hMatch = u.match(/[?&]h=(\d+)/);
    const w = wMatch ? Number(wMatch[1]) : 0;
    const h = hMatch ? Number(hMatch[1]) : 0;
    return w >= 800 || h >= 500;
  };

  const big = candidates.find(isLargeEnough);
  return big || candidates[0];
}

/** Normalize the imgix URL so we always store a clean, large variant. */
export function normalizeHeroUrl(url: string): string {
  try {
    const u = new URL(url);
    // Force a clean, hero-sized format. Keep imgix signature if present
    // (required for signed accounts).
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("w", "1600");
    u.searchParams.set("h", "900");
    return u.toString();
  } catch {
    return url;
  }
}

async function scrapeOne(
  client: Firecrawl,
  citySlug: string,
  cityName: string,
): Promise<BackfillResult> {
  const sourceUrl = sourceUrlFor(citySlug, cityName);
  try {
    const res = await client.scrape(sourceUrl, {
      formats: ["html"],
      onlyMainContent: false,
      waitFor: 3000,
    });
    // SDK shape: { html, metadata, ... } | { data: {...} }
    const html =
      (res as { html?: string }).html ??
      (res as { data?: { html?: string } }).data?.html ??
      "";
    const heroRaw = extractHeroUrl(html);
    if (!heroRaw) {
      return { slug: citySlug, name: cityName, source_url: sourceUrl, status: "miss" };
    }
    const hero = normalizeHeroUrl(heroRaw);
    const { error } = await supabaseAdmin
      .from("cities")
      .update({ hero_image_url: hero })
      .eq("slug", citySlug);
    if (error) {
      return {
        slug: citySlug,
        name: cityName,
        source_url: sourceUrl,
        status: "error",
        error: error.message,
      };
    }
    return {
      slug: citySlug,
      name: cityName,
      source_url: sourceUrl,
      status: "ok",
      hero_url: hero,
    };
  } catch (e) {
    return {
      slug: citySlug,
      name: cityName,
      source_url: sourceUrl,
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function backfillCityHeroes(opts: {
  force?: boolean;
  limit?: number;
  onlySlugs?: string[];
}): Promise<{ results: BackfillResult[]; summary: Record<string, number> }> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");

  const client = new Firecrawl({ apiKey });

  // Pick the cities to process.
  let query = supabaseAdmin
    .from("cities")
    .select("slug,name")
    .eq("is_published", true)
    .order("name", { ascending: true });

  if (!opts.force) query = query.is("hero_image_url", null);
  if (opts.onlySlugs?.length) query = query.in("slug", opts.onlySlugs);
  if (opts.limit) query = query.limit(opts.limit);

  const { data: cities, error } = await query;
  if (error) throw new Error(`Failed to load cities: ${error.message}`);
  if (!cities?.length) return { results: [], summary: { total: 0 } };

  // Throttle to 3 concurrent scrapes.
  const concurrency = 3;
  const results: BackfillResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < cities!.length) {
      const i = cursor++;
      const c = cities![i];
      const r = await scrapeOne(client, c.slug, c.name);
      results.push(r);
      // Small jitter to be polite.
      await new Promise((res) => setTimeout(res, 150));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const summary = results.reduce<Record<string, number>>(
    (acc, r) => {
      acc.total = (acc.total || 0) + 1;
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { total: 0 },
  );
  return { results, summary };
}
