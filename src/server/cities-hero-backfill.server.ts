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
import { generateAndUploadHero } from "./cities-hero-fallback.server";

export type BackfillResult = {
  slug: string;
  name: string;
  source_url: string | null;
  status: "ok" | "miss" | "error" | "skipped" | "generated";
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
  const html = await fetchWithBackoff(
    "https://www.poolrentalnearme.com/p/all-locations",
    { headers: { "User-Agent": "Mozilla/5.0 LovableHeroBackfill/1.0" } },
    { maxAttempts: 5 },
  );

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

/**
 * Extract the first plausible hero image URL from rendered HTML.
 *
 * Supports multiple sources, in priority order:
 *   1. og:image / twitter:image meta tags (cleanest signal of "the hero")
 *   2. <link rel="preload" as="image"> (Next/TanStack hero hint)
 *   3. sharetribe-assets imgix URLs (legacy listing photos)
 *   4. Supabase Storage public URLs (city-heroes bucket / lovable uploads)
 *   5. Generic large image URLs from common CDNs (imgix, cloudinary,
 *      cloudfront, unsplash, lovable-uploads, supabase.co/storage)
 */
export function extractHeroUrl(html: string): string | null {
  if (!html) return null;
  const decode = (s: string) =>
    s.replace(/&amp;/g, "&").replace(/\\u0026/g, "&").replace(/&#x2F;/g, "/");

  // 1. og:image / twitter:image
  const metaRe =
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*content=["']([^"']+)["']/gi;
  const metaRe2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["']/gi;
  for (const re of [metaRe, metaRe2]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const u = decode(m[1]).trim();
      if (/^https?:\/\//i.test(u) && !/favicon|logo|sprite|icon/i.test(u)) {
        return u;
      }
    }
  }

  // 2. <link rel="preload" as="image" href="...">
  const preloadRe =
    /<link[^>]+rel=["']preload["'][^>]+as=["']image["'][^>]+href=["']([^"']+)["']/gi;
  let pm: RegExpExecArray | null;
  while ((pm = preloadRe.exec(html)) !== null) {
    const u = decode(pm[1]).trim();
    if (/^https?:\/\//i.test(u)) return u;
  }

  // Helper for sized URLs (imgix-style w=/h= query params).
  const isLargeEnough = (u: string) => {
    const wMatch = u.match(/[?&]w=(\d+)/);
    const hMatch = u.match(/[?&]h=(\d+)/);
    const w = wMatch ? Number(wMatch[1]) : 0;
    const h = hMatch ? Number(hMatch[1]) : 0;
    return w >= 800 || h >= 500;
  };

  // 3. Sharetribe imgix
  const stRe =
    /https:\/\/sharetribe-assets\.imgix\.net\/[A-Za-z0-9._/-]+\?[^"'\s)]+/g;
  const stCandidates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = stRe.exec(html)) !== null) stCandidates.push(decode(m[0]));
  if (stCandidates.length) {
    return stCandidates.find(isLargeEnough) || stCandidates[0];
  }

  // 4 + 5. Generic CDN / hero-ish URLs found anywhere in HTML.
  const cdnRe =
    /https:\/\/[A-Za-z0-9.-]+(?:imgix\.net|cloudinary\.com|cloudfront\.net|images\.unsplash\.com|supabase\.co\/storage\/v1\/object\/public|lovable-uploads|gstatic\.com\/images|googleusercontent\.com)\/[^"'\s)<>]+\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s)<>]*)?/gi;
  const cdn: string[] = [];
  while ((m = cdnRe.exec(html)) !== null) {
    const u = decode(m[0]);
    if (!/favicon|logo|sprite|icon|avatar|profile/i.test(u)) cdn.push(u);
  }
  if (cdn.length) return cdn.find(isLargeEnough) || cdn[0];

  // 6. Last resort: first large-looking <img src> on the page.
  const imgRe =
    /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpe?g|png|webp|avif)(?:\?[^"']*)?)["'][^>]*>/gi;
  while ((m = imgRe.exec(html)) !== null) {
    const u = decode(m[1]);
    if (!/favicon|logo|sprite|icon|avatar|profile/i.test(u)) return u;
  }
  return null;
}

/**
 * Build the list of source URLs to try for a city, in priority order:
 *   1. The resolved Sharetribe-style landing page (if any)
 *   2. Our own rendered city page at /p/{slug} on the production site
 *   3. The host-acquisition city page at /p/host-acquisition/{slug}
 */
export function buildSourceUrlCandidates(
  citySlug: string,
  primary: string | null,
): string[] {
  const own = `https://www.poolrentalnearme.com/p/${citySlug}`;
  const hostAcq = `https://www.poolrentalnearme.com/p/host-acquisition/${citySlug}`;
  const list = [primary, own, hostAcq].filter(
    (u): u is string => !!u && typeof u === "string",
  );
  return Array.from(new Set(list));
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

/* ─────────────────────────── retry / backoff helpers ────────────────────── */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type BackoffOpts = { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number };

function jitteredDelay(attempt: number, base = 800, max = 30_000) {
  const exp = Math.min(max, base * 2 ** (attempt - 1));
  return Math.floor(exp / 2 + Math.random() * (exp / 2));
}

function parseRetryAfter(h: string | null | undefined): number | null {
  if (!h) return null;
  const n = Number(h);
  if (Number.isFinite(n)) return Math.max(0, n * 1000);
  const t = Date.parse(h);
  if (Number.isFinite(t)) return Math.max(0, t - Date.now());
  return null;
}

/** Fetch a URL with exponential backoff on 429/5xx/network errors. Returns body text on success. */
export async function fetchWithBackoff(
  url: string,
  init: RequestInit = {},
  opts: BackoffOpts = {},
): Promise<string> {
  const max = opts.maxAttempts ?? 5;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return await res.text();
      if (res.status === 429 || res.status >= 500) {
        const ra = parseRetryAfter(res.headers.get("retry-after"));
        const wait = ra ?? jitteredDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
        if (attempt < max) { await sleep(wait); continue; }
        throw new Error(`HTTP ${res.status} after ${attempt} attempts`);
      }
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch (e) {
      lastErr = e;
      if (attempt >= max) break;
      await sleep(jitteredDelay(attempt, opts.baseDelayMs, opts.maxDelayMs));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Detect rate-limit / transient errors from the Firecrawl SDK. */
function isRetryableScrapeError(e: unknown): { retry: boolean; waitMs?: number } {
  const msg = (e instanceof Error ? e.message : String(e)) || "";
  const status =
    (e as { status?: number; statusCode?: number; response?: { status?: number } })?.status ??
    (e as { statusCode?: number })?.statusCode ??
    (e as { response?: { status?: number } })?.response?.status ??
    null;
  const m = msg.match(/\b(429|5\d\d)\b/);
  const code = status ?? (m ? Number(m[1]) : null);
  if (code === 429 || (typeof code === "number" && code >= 500)) {
    const raMatch = msg.match(/retry[-\s]?after[:\s]+(\d+)/i);
    const waitMs = raMatch ? Number(raMatch[1]) * 1000 : undefined;
    return { retry: true, waitMs };
  }
  // Network-y / timeout errors are also retryable.
  if (/timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|fetch failed|network/i.test(msg)) {
    return { retry: true };
  }
  return { retry: false };
}

async function scrapeOne(
  client: Firecrawl,
  citySlug: string,
  cityName: string,
  sourceUrl: string,
): Promise<BackfillResult> {
  const maxAttempts = 5;
  let lastError: string | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
      lastError = e instanceof Error ? e.message : String(e);
      const { retry, waitMs } = isRetryableScrapeError(e);
      if (!retry || attempt >= maxAttempts) break;
      await sleep(waitMs ?? jitteredDelay(attempt, 1000, 30_000));
    }
  }
  return {
    slug: citySlug, name: cityName, source_url: sourceUrl,
    status: "error", error: lastError ?? "Unknown error",
  };
}

export async function backfillCityHeroes(opts: {
  force?: boolean;
  limit?: number;
  onlySlugs?: string[];
  batchSize?: number;
  concurrency?: number;
  excludeSlugs?: string[];
  maxDurationMs?: number;
  generateFallback?: boolean;
  maxFallbacksPerBatch?: number;
}): Promise<{
  results: BackfillResult[];
  summary: Record<string, number>;
  remaining: number;
  processedSlugs: string[];
  stoppedReason: "completed" | "batch_full" | "time_budget";
}> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");

  const client = new Firecrawl({ apiKey });

  const directory = await harvestSourceUrls();

  const batchSize = Math.min(Math.max(opts.batchSize ?? 25, 1), 100);
  const concurrency = Math.min(Math.max(opts.concurrency ?? 2, 1), 8);
  const maxDurationMs = Math.min(Math.max(opts.maxDurationMs ?? 45_000, 5_000), 120_000);
  const startedAt = Date.now();

  const effectiveLimit = Math.min(opts.limit ?? batchSize, batchSize);
  let dataQuery = supabaseAdmin
    .from("cities")
    .select("slug,name,state_code")
    .eq("is_published", true)
    .order("name", { ascending: true });
  if (!opts.force) dataQuery = dataQuery.is("hero_image_url", null);
  if (opts.onlySlugs?.length) dataQuery = dataQuery.in("slug", opts.onlySlugs);
  if (opts.excludeSlugs?.length) {
    const list = `(${opts.excludeSlugs.map((s) => `"${s.replace(/"/g, '""')}"`).join(",")})`;
    dataQuery = dataQuery.not("slug", "in", list);
  }
  const { data: cities, error } = await dataQuery.limit(effectiveLimit);
  if (error) throw new Error(`Failed to load cities: ${error.message}`);

  async function logAttempt(r: BackfillResult) {
    await supabaseAdmin.from("cities_hero_backfill_log").insert({
      city_slug: r.slug,
      source_url: r.source_url,
      status: r.status,
      image_url: r.hero_url ?? null,
      error: r.error ?? null,
    });
  }

  const results: BackfillResult[] = [];
  let stoppedReason: "completed" | "batch_full" | "time_budget" = "completed";
  const fallbackBudget = Math.max(0, opts.maxFallbacksPerBatch ?? 10);
  let fallbacksUsed = 0;

  async function maybeFallback(r: BackfillResult, cityState: string | null): Promise<BackfillResult> {
    if (!opts.generateFallback) return r;
    if (r.status !== "miss" && r.status !== "skipped") return r;
    if (fallbacksUsed >= fallbackBudget) return r;
    fallbacksUsed++;
    const gen = await generateAndUploadHero(r.slug, r.name, cityState);
    if (!gen.ok) {
      return { ...r, error: `${r.error ?? r.status}; fallback failed: ${gen.error}` };
    }
    const { error } = await supabaseAdmin
      .from("cities").update({ hero_image_url: gen.hero_url }).eq("slug", r.slug);
    if (error) {
      return { ...r, error: `${r.error ?? r.status}; fallback save failed: ${error.message}` };
    }
    return {
      slug: r.slug, name: r.name, source_url: r.source_url,
      status: "generated", hero_url: gen.hero_url,
    };
  }

  if (cities?.length) {
    let cursor = 0;
    let cooldownUntil = 0;
    let timeUp = false;
    async function worker() {
      while (cursor < cities!.length) {
        if (Date.now() - startedAt > maxDurationMs) { timeUp = true; return; }
        const i = cursor++;
        const c = cities![i];
        const now = Date.now();
        if (cooldownUntil > now) await sleep(cooldownUntil - now);
        const url = resolveSourceUrl(c.slug, c.state_code, directory);
        let r: BackfillResult;
        if (!url) {
          r = {
            slug: c.slug, name: c.name, source_url: null,
            status: "skipped", error: "No source URL found in directory or overrides",
          };
        } else {
          r = await scrapeOne(client, c.slug, c.name, url);
          if (r.status === "error" && /\b429\b|rate.?limit/i.test(r.error || "")) {
            cooldownUntil = Date.now() + 10_000;
          }
        }
        // Fallback: generate an AI hero when scraping couldn't find one.
        r = await maybeFallback(r, c.state_code);
        results.push(r);
        try { await logAttempt(r); } catch { /* swallow */ }
        await sleep(300);
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
    stoppedReason = timeUp ? "time_budget" : (cities.length >= effectiveLimit ? "batch_full" : "completed");
  }

  // Compute remaining work for the next batch (excludes what we just processed).
  const processedSlugs = results.map((r) => r.slug);
  const exclusionForCount = [...(opts.excludeSlugs ?? []), ...processedSlugs];
  const { count: remainingCount } = await (() => {
    let q = supabaseAdmin
      .from("cities")
      .select("slug", { count: "exact", head: true })
      .eq("is_published", true);
    if (!opts.force) q = q.is("hero_image_url", null);
    if (opts.onlySlugs?.length) q = q.in("slug", opts.onlySlugs);
    if (exclusionForCount.length) {
      const list = `(${exclusionForCount.map((s) => `"${s.replace(/"/g, '""')}"`).join(",")})`;
      q = q.not("slug", "in", list);
    }
    return q;
  })();

  // For non-force runs the OK results no longer match `hero_image_url IS NULL`,
  // so they're already removed from the count. For force runs we exclude
  // explicitly via excludeSlugs/processedSlugs.
  const remaining = remainingCount ?? 0;
  if (remaining === 0) stoppedReason = "completed";

  const summary = results.reduce<Record<string, number>>(
    (acc, r) => {
      acc.total = (acc.total || 0) + 1;
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { total: 0 },
  );
  return { results, summary, remaining, processedSlugs, stoppedReason };
}

