import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import Firecrawl from "@mendable/firecrawl-js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const BUCKET = "city-heroes";
const MODEL = "google/gemini-3.1-flash-image-preview";
function buildPrompt(cityName, state) {
  const where = state ? `${cityName}, ${state}` : cityName;
  return [
    `A photorealistic backyard swimming pool scene evoking ${where}.`,
    `Crystal-clear turquoise water, warm afternoon sun, lush landscaping,`,
    `comfortable lounge chairs and a tasteful patio. Wide cinematic 16:9 framing,`,
    `golden hour lighting, soft depth of field. No people, no text, no logos,`,
    `no recognizable landmarks. Suitable as a website hero image for a pool rental listing.`
  ].join(" ");
}
function pickImageFromCompletion(json) {
  const choices = json.choices;
  const msg = choices?.[0]?.message;
  if (!msg) return null;
  if (Array.isArray(msg.images)) {
    for (const img of msg.images) {
      const url = img?.image_url?.url ?? img?.url;
      if (typeof url === "string" && url.startsWith("data:image/")) return url;
      if (typeof url === "string" && /^https?:\/\//.test(url)) return url;
    }
  }
  if (typeof msg.content === "string") {
    const m = msg.content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
    if (m) return m[0];
  }
  return null;
}
async function dataUrlOrFetchToBytes(src) {
  if (src.startsWith("data:")) {
    const [meta, b64] = src.split(",", 2);
    const ctMatch = meta.match(/data:([^;]+);base64/);
    const contentType2 = ctMatch?.[1] ?? "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, contentType: contentType2 };
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch image ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/png";
  return { bytes: buf, contentType };
}
async function generateAndUploadHero(citySlug, cityName, state) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY is not configured" };
  const prompt = buildPrompt(cityName, state);
  let res;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        modalities: ["image", "text"],
        messages: [{ role: "user", content: prompt }]
      })
    });
  } catch (e) {
    return { ok: false, error: `gateway fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (res.status === 429) return { ok: false, error: "AI gateway rate limit (429)" };
  if (res.status === 402) return { ok: false, error: "AI gateway credits exhausted (402)" };
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return { ok: false, error: `gateway ${res.status}: ${txt.slice(0, 200)}` };
  }
  const json = await res.json().catch(() => null);
  const imgRef = json ? pickImageFromCompletion(json) : null;
  if (!imgRef) return { ok: false, error: "no image returned by AI gateway" };
  let bytes;
  let contentType;
  try {
    ({ bytes, contentType } = await dataUrlOrFetchToBytes(imgRef));
  } catch (e) {
    return { ok: false, error: `decode image failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
  const path = `${citySlug}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true, cacheControl: "31536000" });
  if (upErr) return { ok: false, error: `storage upload: ${upErr.message}` };
  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  if (!pub?.publicUrl) return { ok: false, error: "no public URL" };
  return { ok: true, hero_url: pub.publicUrl };
}
const URL_OVERRIDES = {
  "los-angeles": "https://www.poolrentalnearme.com/p/losangeles",
  "san-diego": "https://www.poolrentalnearme.com/p/sandiego",
  "miami": "https://www.poolrentalnearme.com/p/miami",
  "austin": "https://www.poolrentalnearme.com/p/austin",
  "kansas-city-mo": "https://www.poolrentalnearme.com/p/kansascity"
};
async function harvestSourceUrls() {
  const html = await fetchWithBackoff(
    "https://www.poolrentalnearme.com/p/all-locations",
    { headers: { "User-Agent": "Mozilla/5.0 LovableHeroBackfill/1.0" } },
    { maxAttempts: 5 }
  );
  const map = /* @__PURE__ */ new Map();
  const re = /\/p\/(become-a-(?:swimming-)?pool-host-([a-z0-9-]+))/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const path = m[1];
    const tail = m[2];
    const url = `https://www.poolrentalnearme.com/p/${path}`;
    const segments = tail.split("-");
    if (segments.length < 2) continue;
    const stateSeg = segments[segments.length - 1];
    const cityOnly = segments.slice(0, -1).join("-");
    const stateCode = STATE_NAME_TO_CODE[stateSeg] ?? stateSeg;
    if (!map.has(cityOnly)) map.set(cityOnly, url);
    const fullKey = `${cityOnly}-${stateCode}`;
    if (!map.has(fullKey)) map.set(fullKey, url);
  }
  return map;
}
const STATE_NAME_TO_CODE = {
  alabama: "al",
  alaska: "ak",
  arizona: "az",
  arkansas: "ar",
  california: "ca",
  colorado: "co",
  connecticut: "ct",
  delaware: "de",
  florida: "fl",
  georgia: "ga",
  hawaii: "hi",
  idaho: "id",
  illinois: "il",
  indiana: "in",
  iowa: "ia",
  kansas: "ks",
  kentucky: "ky",
  louisiana: "la",
  maine: "me",
  maryland: "md",
  massachusetts: "ma",
  michigan: "mi",
  minnesota: "mn",
  mississippi: "ms",
  missouri: "mo",
  montana: "mt",
  nebraska: "ne",
  nevada: "nv",
  "new-hampshire": "nh",
  "new-jersey": "nj",
  "new-mexico": "nm",
  "new-york": "ny",
  "north-carolina": "nc",
  "north-dakota": "nd",
  ohio: "oh",
  oklahoma: "ok",
  oregon: "or",
  pennsylvania: "pa",
  "rhode-island": "ri",
  "south-carolina": "sc",
  "south-dakota": "sd",
  tennessee: "tn",
  texas: "tx",
  utah: "ut",
  vermont: "vt",
  virginia: "va",
  washington: "wa",
  "west-virginia": "wv",
  wisconsin: "wi",
  wyoming: "wy"
};
async function loadCanonicalUrlPaths(citySlugs) {
  if (citySlugs.length === 0) return /* @__PURE__ */ new Map();
  const candidates = /* @__PURE__ */ new Set();
  for (const s of citySlugs) {
    candidates.add(s);
    candidates.add(`become-a-swimming-pool-host-${s}`);
    candidates.add(`become-a-pool-host-${s}`);
  }
  const { data } = await supabaseAdmin.from("content_pages").select("slug,url_path,status").in("slug", Array.from(candidates)).eq("status", "published");
  const bySlug = /* @__PURE__ */ new Map();
  for (const row of data ?? []) {
    if (row.url_path) bySlug.set(row.slug, row.url_path);
  }
  const out = /* @__PURE__ */ new Map();
  for (const s of citySlugs) {
    const path = bySlug.get(s) ?? bySlug.get(`become-a-swimming-pool-host-${s}`) ?? bySlug.get(`become-a-pool-host-${s}`);
    if (path) out.set(s, path);
  }
  return out;
}
function resolveSourceUrl(citySlug, cityStateCode, directory, canonical) {
  if (URL_OVERRIDES[citySlug]) return URL_OVERRIDES[citySlug];
  const fromDb = canonical?.get(citySlug);
  if (fromDb) return `https://www.poolrentalnearme.com${fromDb}`;
  const direct = directory.get(citySlug);
  if (direct) return direct;
  if (cityStateCode) {
    const withState = directory.get(`${citySlug}-${cityStateCode.toLowerCase()}`);
    if (withState) return withState;
  }
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
function extractHeroUrl(html) {
  if (!html) return null;
  const decode = (s) => s.replace(/&amp;/g, "&").replace(/\\u0026/g, "&").replace(/&#x2F;/g, "/");
  const metaRe = /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*content=["']([^"']+)["']/gi;
  const metaRe2 = /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["']/gi;
  for (const re of [metaRe, metaRe2]) {
    let m2;
    while ((m2 = re.exec(html)) !== null) {
      const u = decode(m2[1]).trim();
      if (/^https?:\/\//i.test(u) && !/favicon|logo|sprite|icon/i.test(u)) {
        return u;
      }
    }
  }
  const preloadRe = /<link[^>]+rel=["']preload["'][^>]+as=["']image["'][^>]+href=["']([^"']+)["']/gi;
  let pm;
  while ((pm = preloadRe.exec(html)) !== null) {
    const u = decode(pm[1]).trim();
    if (/^https?:\/\//i.test(u)) return u;
  }
  const isLargeEnough = (u) => {
    const wMatch = u.match(/[?&]w=(\d+)/);
    const hMatch = u.match(/[?&]h=(\d+)/);
    const w = wMatch ? Number(wMatch[1]) : 0;
    const h = hMatch ? Number(hMatch[1]) : 0;
    return w >= 800 || h >= 500;
  };
  const stRe = /https:\/\/sharetribe-assets\.imgix\.net\/[A-Za-z0-9._/-]+\?[^"'\s)]+/g;
  const stCandidates = [];
  let m;
  while ((m = stRe.exec(html)) !== null) stCandidates.push(decode(m[0]));
  if (stCandidates.length) {
    return stCandidates.find(isLargeEnough) || stCandidates[0];
  }
  const cdnRe = /https:\/\/[A-Za-z0-9.-]+(?:imgix\.net|cloudinary\.com|cloudfront\.net|images\.unsplash\.com|supabase\.co\/storage\/v1\/object\/public|lovable-uploads|gstatic\.com\/images|googleusercontent\.com)\/[^"'\s)<>]+\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s)<>]*)?/gi;
  const cdn = [];
  while ((m = cdnRe.exec(html)) !== null) {
    const u = decode(m[0]);
    if (!/favicon|logo|sprite|icon|avatar|profile/i.test(u)) cdn.push(u);
  }
  if (cdn.length) return cdn.find(isLargeEnough) || cdn[0];
  const imgRe = /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpe?g|png|webp|avif)(?:\?[^"']*)?)["'][^>]*>/gi;
  while ((m = imgRe.exec(html)) !== null) {
    const u = decode(m[1]);
    if (!/favicon|logo|sprite|icon|avatar|profile/i.test(u)) return u;
  }
  return null;
}
function buildSourceUrlCandidates(_citySlug, primary) {
  if (!primary) return [];
  return [primary];
}
function normalizeHeroUrl(url) {
  if (!/imgix\.net/i.test(url)) return url;
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function jitteredDelay(attempt, base = 800, max = 3e4) {
  const exp = Math.min(max, base * 2 ** (attempt - 1));
  return Math.floor(exp / 2 + Math.random() * (exp / 2));
}
function parseRetryAfter(h) {
  if (!h) return null;
  const n = Number(h);
  if (Number.isFinite(n)) return Math.max(0, n * 1e3);
  const t = Date.parse(h);
  if (Number.isFinite(t)) return Math.max(0, t - Date.now());
  return null;
}
async function fetchWithBackoff(url, init = {}, opts = {}) {
  const max = opts.maxAttempts ?? 5;
  let lastErr = null;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return await res.text();
      if (res.status === 429 || res.status >= 500) {
        const ra = parseRetryAfter(res.headers.get("retry-after"));
        const wait = ra ?? jitteredDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
        if (attempt < max) {
          await sleep(wait);
          continue;
        }
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
function isRetryableScrapeError(e) {
  const msg = (e instanceof Error ? e.message : String(e)) || "";
  const status = e?.status ?? e?.statusCode ?? e?.response?.status ?? null;
  const m = msg.match(/\b(429|5\d\d)\b/);
  const code = status ?? (m ? Number(m[1]) : null);
  if (code === 429 || typeof code === "number" && code >= 500) {
    const raMatch = msg.match(/retry[-\s]?after[:\s]+(\d+)/i);
    const waitMs = raMatch ? Number(raMatch[1]) * 1e3 : void 0;
    return { retry: true, waitMs };
  }
  if (/timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|fetch failed|network/i.test(msg)) {
    return { retry: true };
  }
  return { retry: false };
}
async function scrapeOne(client, citySlug, cityName, sourceUrl) {
  const candidates = buildSourceUrlCandidates(citySlug, sourceUrl);
  let lastError = null;
  let lastUrl = sourceUrl;
  const maxAttempts = 3;
  for (const url of candidates) {
    lastUrl = url;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await client.scrape(url, {
          formats: ["rawHtml"],
          onlyMainContent: false,
          waitFor: 3e3
        });
        const html = res.rawHtml ?? res.data?.rawHtml ?? "";
        const heroRaw = extractHeroUrl(html);
        if (!heroRaw) break;
        const hero = normalizeHeroUrl(heroRaw);
        const { error } = await supabaseAdmin.from("cities").update({ hero_image_url: hero }).eq("slug", citySlug);
        if (error) {
          return {
            slug: citySlug,
            name: cityName,
            source_url: url,
            status: "error",
            error: error.message
          };
        }
        return {
          slug: citySlug,
          name: cityName,
          source_url: url,
          status: "ok",
          hero_url: hero
        };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        const { retry, waitMs } = isRetryableScrapeError(e);
        if (!retry || attempt >= maxAttempts) break;
        await sleep(waitMs ?? jitteredDelay(attempt, 1e3, 3e4));
      }
    }
  }
  if (lastError) {
    return {
      slug: citySlug,
      name: cityName,
      source_url: lastUrl,
      status: "error",
      error: lastError
    };
  }
  return { slug: citySlug, name: cityName, source_url: lastUrl, status: "miss" };
}
async function backfillCityHeroes(opts) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
  const client = new Firecrawl({ apiKey });
  const directory = await harvestSourceUrls();
  const batchSize = Math.min(Math.max(opts.batchSize ?? 25, 1), 100);
  const concurrency = Math.min(Math.max(opts.concurrency ?? 2, 1), 8);
  const maxDurationMs = Math.min(Math.max(opts.maxDurationMs ?? 45e3, 5e3), 12e4);
  const startedAt = Date.now();
  const effectiveLimit = Math.min(opts.limit ?? batchSize, batchSize);
  let dataQuery = supabaseAdmin.from("cities").select("slug,name,state_code").eq("is_published", true).order("name", { ascending: true });
  if (!opts.force) dataQuery = dataQuery.is("hero_image_url", null);
  if (opts.onlySlugs?.length) dataQuery = dataQuery.in("slug", opts.onlySlugs);
  if (opts.excludeSlugs?.length) {
    const list = `(${opts.excludeSlugs.map((s) => `"${s.replace(/"/g, '""')}"`).join(",")})`;
    dataQuery = dataQuery.not("slug", "in", list);
  }
  const { data: cities, error } = await dataQuery.limit(effectiveLimit);
  if (error) throw new Error(`Failed to load cities: ${error.message}`);
  const canonical = await loadCanonicalUrlPaths(
    (cities ?? []).map((c) => c.slug)
  );
  async function logAttempt(r) {
    await supabaseAdmin.from("cities_hero_backfill_log").insert({
      city_slug: r.slug,
      source_url: r.source_url,
      status: r.status,
      image_url: r.hero_url ?? null,
      error: r.error ?? null
    });
  }
  const results = [];
  let stoppedReason = "completed";
  const fallbackBudget = Math.max(0, opts.maxFallbacksPerBatch ?? 10);
  let fallbacksUsed = 0;
  async function maybeFallback(r, cityState) {
    if (!opts.generateFallback) return r;
    if (r.status !== "miss") return r;
    if (fallbacksUsed >= fallbackBudget) return r;
    fallbacksUsed++;
    const gen = await generateAndUploadHero(r.slug, r.name, cityState);
    if (!gen.ok) {
      return { ...r, error: `${r.error ?? r.status}; fallback failed: ${gen.error}` };
    }
    const { error: error2 } = await supabaseAdmin.from("cities").update({ hero_image_url: gen.hero_url }).eq("slug", r.slug);
    if (error2) {
      return { ...r, error: `${r.error ?? r.status}; fallback save failed: ${error2.message}` };
    }
    return {
      slug: r.slug,
      name: r.name,
      source_url: r.source_url,
      status: "generated",
      hero_url: gen.hero_url
    };
  }
  if (cities?.length) {
    let cursor = 0;
    let cooldownUntil = 0;
    let timeUp = false;
    async function worker() {
      while (cursor < cities.length) {
        if (Date.now() - startedAt > maxDurationMs) {
          timeUp = true;
          return;
        }
        const i = cursor++;
        const c = cities[i];
        const now = Date.now();
        if (cooldownUntil > now) await sleep(cooldownUntil - now);
        const url = resolveSourceUrl(c.slug, c.state_code, directory, canonical);
        if (!url) {
          const r2 = {
            slug: c.slug,
            name: c.name,
            source_url: null,
            status: "skipped",
            error: "no canonical content_pages url_path"
          };
          results.push(r2);
          try {
            await logAttempt(r2);
          } catch {
          }
          continue;
        }
        let r = await scrapeOne(client, c.slug, c.name, url);
        if (r.status === "error" && /\b429\b|rate.?limit/i.test(r.error || "")) {
          cooldownUntil = Date.now() + 1e4;
        }
        r = await maybeFallback(r, c.state_code);
        results.push(r);
        try {
          await logAttempt(r);
        } catch {
        }
        await sleep(300);
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
    stoppedReason = timeUp ? "time_budget" : cities.length >= effectiveLimit ? "batch_full" : "completed";
  }
  const processedSlugs = results.map((r) => r.slug);
  const exclusionForCount = [...opts.excludeSlugs ?? [], ...processedSlugs];
  const { count: remainingCount } = await (() => {
    let q = supabaseAdmin.from("cities").select("slug", { count: "exact", head: true }).eq("is_published", true);
    if (!opts.force) q = q.is("hero_image_url", null);
    if (opts.onlySlugs?.length) q = q.in("slug", opts.onlySlugs);
    if (exclusionForCount.length) {
      const list = `(${exclusionForCount.map((s) => `"${s.replace(/"/g, '""')}"`).join(",")})`;
      q = q.not("slug", "in", list);
    }
    return q;
  })();
  const remaining = remainingCount ?? 0;
  if (remaining === 0) stoppedReason = "completed";
  const summary = results.reduce(
    (acc, r) => {
      acc.total = (acc.total || 0) + 1;
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );
  return { results, summary, remaining, processedSlugs, stoppedReason };
}
const inputSchema = z.object({
  force: z.boolean().optional(),
  limit: z.number().int().positive().max(500).optional(),
  onlySlugs: z.array(z.string()).max(500).optional(),
  batchSize: z.number().int().positive().max(100).optional(),
  concurrency: z.number().int().positive().max(8).optional(),
  excludeSlugs: z.array(z.string()).max(1e4).optional(),
  maxDurationMs: z.number().int().positive().max(12e4).optional(),
  generateFallback: z.boolean().optional(),
  maxFallbacksPerBatch: z.number().int().positive().max(50).optional()
});
const runHeroBackfill_createServerFn_handler = createServerRpc({
  id: "1a5beb97f89a4ff75edde8c7f9e00a0e670cf3f7248931056faa67622874a406",
  name: "runHeroBackfill",
  filename: "src/server/cities-hero-backfill.functions.ts"
}, (opts) => runHeroBackfill.__executeServer(opts));
const runHeroBackfill = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => inputSchema.parse(data)).handler(runHeroBackfill_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    data: roleRow,
    error: roleErr
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (roleErr) throw new Error(roleErr.message);
  if (!roleRow) throw new Error("Admin role required");
  return backfillCityHeroes({
    force: data.force,
    limit: data.limit,
    onlySlugs: data.onlySlugs,
    batchSize: data.batchSize,
    concurrency: data.concurrency,
    excludeSlugs: data.excludeSlugs,
    maxDurationMs: data.maxDurationMs,
    generateFallback: data.generateFallback,
    maxFallbacksPerBatch: data.maxFallbacksPerBatch
  });
});
export {
  runHeroBackfill_createServerFn_handler
};
