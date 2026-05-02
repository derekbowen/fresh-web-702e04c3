/**
 * Server-only helpers for scraping city hero images from poolrentalnearme.com
 * and persisting them to cities.hero_image_url.
 *
 * Strategy:
 *   1. Harvest the public site directory `/p/all-locations` once per run to
 *      build an authoritative map of { citySlug -> sourceUrl }. This avoids
 *      slug-guessing for ~350 cities.
 *   2. Apply manual OVERRIDES for ~30 large markets where a richer rental
 *      landing page exists (e.g. /p/losangeles), which always wins.
 *   3. For each target city, scrape the resolved URL via Firecrawl, extract
 *      the first sharetribe-assets imgix hero URL, and persist.
 *   4. Log every attempt (ok / miss / skipped / error) to
 *      cities_hero_backfill_log so the user can audit failures from the
 *      admin page.
 */
import Firecrawl from "@mendable/firecrawl-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type BackfillResult = {
  slug: string;
  name: string;
  source_url: string | null;
  status: "ok" | "miss" | "error" | "skipped";
  hero_url?: string;
  error?: string;
};

/**
 * Manual overrides — large markets that have a dedicated rental landing page
 * (`/p/{cityslug}` template) with a richer city-specific hero. These win over
 * any URL discovered in the directory.
 */
const URL_OVERRIDES: Record<string, string> = {
  "los-angeles": "https://www.poolrentalnearme.com/p/losangeles",
  "san-diego": "https://www.poolrentalnearme.com/p/sandiego",
  "miami": "https://www.poolrentalnearme.com/p/miami",
  "austin": "https://www.poolrentalnearme.com/p/austin",
  "kansas-city-mo": "https://www.poolrentalnearme.com/p/kansascity",
};

/**
 * Harvest the all-locations directory once. Returns a map keyed by a
 * normalized city + state-code key (e.g. "birmingham-al") AND by city-only
 * key (e.g. "birmingham") so we can match against DB slugs that may or may
 * not include the state suffix.
 */
export async function harvestSourceUrls(): Promise<Map<string, string>> {
  const res = await fetch("https://www.poolrentalnearme.com/p/all-locations", {
    headers: { "User-Agent": "Mozilla/5.0 LovableHeroBackfill/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch directory: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  const map = new Map<string, string>();
  // Match both URL templates listed in the directory:
  //   /p/become-a-swimming-pool-host-{city-slug}-{state-code}
  //   /p/become-a-pool-host-{city-slug}-{state-name}
  const re =
    /\/p\/(become-a-(?:swimming-)?pool-host-([a-z0-9-]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const path = m[1]; // become-a-swimming-pool-host-birmingham-al
    const tail = m[2]; // birmingham-al  OR  phoenix-arizona
    const url = `https://www.poolrentalnearme.com/p/${path}`;

    // The last hyphen-segment is the state (code or name). Strip it for the
    // city-only key.
    const segments = tail.split("-");
    if (segments.length < 2) continue;
    const stateSeg = segments[segments.length - 1];
    const cityOnly = segments.slice(0, -1).join("-");

    // Two-letter state codes are unambiguous. Multi-letter state names get a
    // synthesized state code where possible.
    const stateCode = STATE_NAME_TO_CODE[stateSeg] ?? stateSeg;

    // Index by both keys; first occurrence wins so the directory's preferred
    // URL is kept stable.
    if (!map.has(cityOnly)) map.set(cityOnly, url);
    const fullKey = `${cityOnly}-${stateCode}`;
    if (!map.has(fullKey)) map.set(fullKey, url);
  }

  return map;
}

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca",
  colorado: "co", connecticut: "ct", delaware: "de", florida: "fl", georgia: "ga",
  hawaii: "hi", idaho: "id", illinois: "il", indiana: "in", iowa: "ia",
  kansas: "ks", kentucky: "ky", louisiana: "la", maine: "me", maryland: "md",
  massachusetts: "ma", michigan: "mi", minnesota: "mn", mississippi: "ms",
  missouri: "mo", montana: "mt", nebraska: "ne", nevada: "nv",
  "new-hampshire": "nh", "new-jersey": "nj", "new-mexico": "nm",
  "new-york": "ny", "north-carolina": "nc", "north-dakota": "nd", ohio: "oh",
  oklahoma: "ok", oregon: "or", pennsylvania: "pa", "rhode-island": "ri",
  "south-carolina": "sc", "south-dakota": "sd", tennessee: "tn", texas: "tx",
  utah: "ut", vermont: "vt", virginia: "va", washington: "wa",
  "west-virginia": "wv", wisconsin: "wi", wyoming: "wy",
};

/**
 * Resolve the source URL for a given city: override > directory map > null.
 */
export function resolveSourceUrl(
  citySlug: string,
  cityStateCode: string | null | undefined,
  directory: Map<string, string>,
): string | null {
  if (URL_OVERRIDES[citySlug]) return URL_OVERRIDES[citySlug];

  // Direct slug match.
  const direct = directory.get(citySlug);
  if (direct) return direct;

  // Try with state suffix (some DB slugs are bare city names like "birmingham"
  // but the directory key is "birmingham-al").
  if (cityStateCode) {
    const withState = directory.get(`${citySlug}-${cityStateCode.toLowerCase()}`);
    if (withState) return withState;
  }

  // Try the city portion of a "city-state" DB slug (e.g. our slug
  // "kansas-city-mo" should match directory key "kansas-city").
  const segs = citySlug.split("-");
  if (segs.length > 1) {
    const last = segs[segs.length - 1];
    if (last.length === 2) {
      const cityOnly = segs.slice(0, -1).join("-");
      const m1 = directory.get(cityOnly);
      if (m1) return m1;
      const m2 = directory.get(`${cityOnly}-${last}`);
      if (m2) return m2;
    }
  }
  return null;
}

/** Extract the first plausible hero image URL from rendered HTML. */
export function extractHeroUrl(html: string): string | null {
  if (!html) return null;
  const re =
    /https:\/\/sharetribe-assets\.imgix\.net\/[A-Za-z0-9._/-]+\?[^"'\s)]+/g;
  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    candidates.push(m[0].replace(/&amp;/g, "&").replace(/\\u0026/g, "&"));
  }
  if (!candidates.length) return null;

  const isLargeEnough = (u: string) => {
    const wMatch = u.match(/[?&]w=(\d+)/);
    const hMatch = u.match(/[?&]h=(\d+)/);
    const w = wMatch ? Number(wMatch[1]) : 0;
    const h = hMatch ? Number(hMatch[1]) : 0;
    return w >= 800 || h >= 500;
  };
  return candidates.find(isLargeEnough) || candidates[0];
}

export function normalizeHeroUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("w", "1600");
    u.searchParams.set("h", "900");
    return u.toString();
  } catch {
    return url;
  }
}

async function logAttempt(r: BackfillResult) {
  await supabaseAdmin.from("cities_hero_backfill_log").insert({
    city_slug: r.slug,
    source_url: r.source_url,
    status: r.status,
    image_url: r.hero_url ?? null,
    error: r.error ?? null,
  });
}

async function scrapeOne(
  client: Firecrawl,
  citySlug: string,
  cityName: string,
  sourceUrl: string,
): Promise<BackfillResult> {
  try {
    const res = await client.scrape(sourceUrl, {
      formats: ["rawHtml"],
      onlyMainContent: false,
      waitFor: 3000,
    });
    const html =
      (res as { rawHtml?: string }).rawHtml ??
      (res as { data?: { rawHtml?: string } }).data?.rawHtml ??
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
        slug: citySlug, name: cityName, source_url: sourceUrl,
        status: "error", error: error.message,
      };
    }
    return {
      slug: citySlug, name: cityName, source_url: sourceUrl,
      status: "ok", hero_url: hero,
    };
  } catch (e) {
    return {
      slug: citySlug, name: cityName, source_url: sourceUrl,
      status: "error", error: e instanceof Error ? e.message : String(e),
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

  const directory = await harvestSourceUrls();

  let query = supabaseAdmin
    .from("cities")
    .select("slug,name,state_code")
    .eq("is_published", true)
    .order("name", { ascending: true });

  if (!opts.force) query = query.is("hero_image_url", null);
  if (opts.onlySlugs?.length) query = query.in("slug", opts.onlySlugs);
  if (opts.limit) query = query.limit(opts.limit);

  const { data: cities, error } = await query;
  if (error) throw new Error(`Failed to load cities: ${error.message}`);
  if (!cities?.length) return { results: [], summary: { total: 0 } };

  const concurrency = 3;
  const results: BackfillResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < cities!.length) {
      const i = cursor++;
      const c = cities![i];
      const url = resolveSourceUrl(c.slug, c.state_code, directory);
      let r: BackfillResult;
      if (!url) {
        r = {
          slug: c.slug, name: c.name, source_url: null,
          status: "skipped", error: "No source URL found in directory or overrides",
        };
      } else {
        r = await scrapeOne(client, c.slug, c.name, url);
      }
      results.push(r);
      // Best-effort log; don't fail the run if logging fails.
      try { await logAttempt(r); } catch { /* swallow */ }
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
