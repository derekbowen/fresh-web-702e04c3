/**
 * Social Lead Hunter — server only.
 *
 * Runs SerpAPI google searches across multiple platforms (IG, FB, TikTok,
 * Nextdoor, Craigslist, YouTube) for pool-rental signals. Each result becomes
 * a row in `social_leads` keyed by (source, source_url).
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sb = () => supabaseAdmin as any;

export type SocialSource = "ig" | "fb" | "tiktok" | "nextdoor" | "craigslist" | "youtube";

export const SOURCE_QUERIES: Record<SocialSource, string[]> = {
  ig: [
    'site:instagram.com "rent my pool"',
    'site:instagram.com "pool for rent"',
    'site:instagram.com "private pool rental"',
    'site:instagram.com "rent our pool"',
    'site:instagram.com "book my pool"',
    'site:instagram.com "swimply"',
    'site:instagram.com "swimply host"',
    'site:instagram.com "backyard pool rental"',
    'site:instagram.com "pool rental"',
    'site:instagram.com "pool party rental"',
    'site:instagram.com "backyard pool party"',
    'site:instagram.com "hot tub rental"',
    'site:instagram.com "rent my hot tub"',
    'site:instagram.com "heated pool rental"',
    'site:instagram.com "luxury pool rental"',
    'site:instagram.com "poolside event"',
    'site:instagram.com "rent a pool"',
    'site:instagram.com "hourly pool rental"',
    'site:instagram.com "swim spa rental"',
    'site:instagram.com "cabana rental"',
  ],
  fb: [
    'site:facebook.com/marketplace "pool for rent"',
    'site:facebook.com/marketplace "rent pool"',
    'site:facebook.com/marketplace "hot tub rental"',
    'site:facebook.com/marketplace "pool rental"',
    'site:facebook.com "pool for rent" "swimply"',
    'site:facebook.com/groups "rent my pool"',
    'site:facebook.com/groups "pool for rent"',
    'site:facebook.com/groups "pool rental"',
    'site:facebook.com/groups "backyard pool party"',
    'site:facebook.com/groups "hot tub rental"',
    'site:facebook.com "swimply host"',
    'site:facebook.com "private pool rental"',
    'site:facebook.com "backyard pool rental"',
    'site:facebook.com "rent a pool"',
    'site:facebook.com "pool party rental"',
    'site:facebook.com "hourly pool rental"',
    'site:facebook.com "luxury pool rental"',
  ],
  tiktok: [
    'site:tiktok.com "rent my pool"',
    'site:tiktok.com "pool for rent"',
    'site:tiktok.com "pool rental"',
    'site:tiktok.com "swimply"',
    'site:tiktok.com "swimply host"',
    'site:tiktok.com "backyard pool rental"',
    'site:tiktok.com "backyard pool party"',
    'site:tiktok.com "hot tub rental"',
    'site:tiktok.com "pool rental business"',
    'site:tiktok.com "rent a pool"',
    'site:tiktok.com "pool side hustle"',
    'site:tiktok.com "airbnb for pools"',
  ],
  nextdoor: [
    'site:nextdoor.com "rent my pool"',
    'site:nextdoor.com "pool for rent"',
    'site:nextdoor.com "pool rental"',
    'site:nextdoor.com "private pool rental"',
    'site:nextdoor.com "hot tub rental"',
    'site:nextdoor.com "backyard pool party"',
    'site:nextdoor.com "rent a pool"',
  ],
  craigslist: [
    'site:craigslist.org "pool for rent"',
    'site:craigslist.org "rent my pool"',
    'site:craigslist.org "pool rental"',
    'site:craigslist.org "private pool rental"',
    'site:craigslist.org "hot tub rental"',
    'site:craigslist.org "backyard pool party"',
    'site:craigslist.org "swimply"',
    'site:craigslist.org "rent a pool"',
  ],
  youtube: [
    'site:youtube.com "rent my pool" swimply',
    'site:youtube.com "backyard pool rental" income',
    'site:youtube.com "pool rental business"',
    'site:youtube.com "swimply host"',
    'site:youtube.com "pool rental" side hustle',
    'site:youtube.com "hot tub rental" business',
    'site:youtube.com "airbnb for pools"',
    'site:youtube.com "backyard pool party" rental',
    'site:youtube.com "how to rent out my pool"',
  ],
};

type SerpResult = { title?: string; link?: string; snippet?: string };

async function googleSearch(query: string, num = 30): Promise<SerpResult[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY not configured");
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: key,
    num: String(num),
    hl: "en",
    gl: "us",
  });
  const resp = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!resp.ok) {
    console.warn("[social-lead-hunter] serpapi", resp.status, await resp.text().catch(() => ""));
    return [];
  }
  const json = await resp.json();
  return (json?.organic_results || []) as SerpResult[];
}

type Parsed = {
  source_url: string;
  profile_url: string | null;
  handle: string | null;
  display_name: string | null;
  title: string | null;
};

function cleanUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    u.hash = "";
    // drop common tracking params
    [...u.searchParams.keys()].forEach((k) => {
      if (/^(utm_|fbclid|gclid|igshid|si|ref)/i.test(k)) u.searchParams.delete(k);
    });
    return u.toString();
  } catch {
    return null;
  }
}

function parseResult(source: SocialSource, r: SerpResult): Parsed | null {
  if (!r.link) return null;
  const url = cleanUrl(r.link);
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.toLowerCase();
  const seg = u.pathname.split("/").filter(Boolean);
  const title = r.title || null;

  switch (source) {
    case "ig": {
      if (!/(^|\.)instagram\.com$/.test(host)) return null;
      if (!seg.length) return null;
      const skip = ["explore", "stories", "directory", "accounts", "developer", "about", "legal"];
      if (skip.includes(seg[0].toLowerCase())) return null;
      const postLike = ["p", "reel", "reels", "tv"].includes(seg[0].toLowerCase());
      let handle: string | null = null;
      if (postLike) {
        const m = title?.match(/\(@([a-zA-Z0-9._]{2,30})\)/);
        handle = m?.[1] ?? null;
      } else if (/^[a-zA-Z0-9._]{2,30}$/.test(seg[0])) {
        handle = seg[0];
      }
      const display = title?.match(/^(.+?)\s*\(@/)?.[1]?.trim() || null;
      return {
        source_url: url,
        profile_url: handle ? `https://www.instagram.com/${handle}/` : null,
        handle,
        display_name: display,
        title,
      };
    }
    case "fb": {
      if (!/(^|\.)facebook\.com$/.test(host)) return null;
      // Skip pure landing pages
      if (!seg.length) return null;
      // Handle is first segment if it looks like a page slug
      let handle: string | null = null;
      let profile: string | null = null;
      const first = seg[0].toLowerCase();
      if (first === "marketplace" || first === "groups" || first === "watch") {
        handle = null;
      } else if (/^[a-zA-Z0-9._-]{3,80}$/.test(seg[0])) {
        handle = seg[0];
        profile = `https://www.facebook.com/${handle}`;
      }
      const display = title?.split("|")[0].split("·")[0].trim() || null;
      return { source_url: url, profile_url: profile, handle, display_name: display, title };
    }
    case "tiktok": {
      if (!/(^|\.)tiktok\.com$/.test(host)) return null;
      if (!seg.length) return null;
      let handle: string | null = null;
      if (seg[0].startsWith("@")) handle = seg[0].slice(1);
      const profile = handle ? `https://www.tiktok.com/@${handle}` : null;
      const display = title?.split("|")[0].split("on TikTok")[0].trim() || null;
      return { source_url: url, profile_url: profile, handle, display_name: display, title };
    }
    case "nextdoor": {
      if (!/(^|\.)nextdoor\.com$/.test(host)) return null;
      return { source_url: url, profile_url: null, handle: null, display_name: title, title };
    }
    case "craigslist": {
      if (!/craigslist\.org$/.test(host)) return null;
      // Subdomain (city) is a useful location hint, captured at insert time
      return { source_url: url, profile_url: null, handle: host.split(".")[0], display_name: title, title };
    }
    case "youtube": {
      if (!/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return null;
      let handle: string | null = null;
      let profile: string | null = null;
      if (seg[0]?.startsWith("@")) {
        handle = seg[0].slice(1);
        profile = `https://www.youtube.com/@${handle}`;
      } else if (seg[0] === "channel" && seg[1]) {
        profile = `https://www.youtube.com/channel/${seg[1]}`;
      }
      const display = title?.split(" - YouTube")[0].trim() || null;
      return { source_url: url, profile_url: profile, handle, display_name: display, title };
    }
  }
}

export async function runSocialLeadHunt(opts: { sources?: SocialSource[]; perQuery?: number } = {}): Promise<{
  ok: boolean;
  by_source: Record<string, { queries: number; seen: number; inserted: number; refreshed: number }>;
  inserted: number;
  refreshed: number;
}> {
  const sources = opts.sources ?? (Object.keys(SOURCE_QUERIES) as SocialSource[]);
  const perQuery = opts.perQuery ?? 30;
  const by_source: Record<string, { queries: number; seen: number; inserted: number; refreshed: number }> = {};
  let totalInserted = 0;
  let totalRefreshed = 0;

  for (const source of sources) {
    const queries = SOURCE_QUERIES[source];
    by_source[source] = { queries: queries.length, seen: 0, inserted: 0, refreshed: 0 };
    const seenUrls = new Set<string>();

    for (const q of queries) {
      let results: SerpResult[] = [];
      try {
        results = await googleSearch(q, perQuery);
      } catch (e: any) {
        console.warn("[social-lead-hunter]", source, "query failed", q, e?.message);
        continue;
      }
      for (const r of results) {
        by_source[source].seen++;
        const parsed = parseResult(source, r);
        if (!parsed) continue;
        if (seenUrls.has(parsed.source_url)) continue;
        seenUrls.add(parsed.source_url);

        const snippet = r.snippet?.slice(0, 600) || null;
        const location_hint = source === "craigslist" ? parsed.handle : null;

        const { data: existing } = await sb()
          .from("social_leads")
          .select("id")
          .eq("source", source)
          .eq("source_url", parsed.source_url)
          .maybeSingle();

        if (existing) {
          await sb().from("social_leads").update({
            last_seen_at: new Date().toISOString(),
            ...(snippet ? { snippet } : {}),
            ...(parsed.display_name ? { display_name: parsed.display_name } : {}),
            ...(parsed.title ? { title: parsed.title } : {}),
            query: q,
          }).eq("id", existing.id);
          by_source[source].refreshed++;
          totalRefreshed++;
        } else {
          const { error } = await sb().from("social_leads").insert({
            source,
            source_url: parsed.source_url,
            profile_url: parsed.profile_url,
            handle: parsed.handle,
            display_name: parsed.display_name,
            title: parsed.title,
            snippet,
            query: q,
            location_hint,
          });
          if (!error) {
            by_source[source].inserted++;
            totalInserted++;
          }
        }
      }
    }
  }

  return { ok: true, by_source, inserted: totalInserted, refreshed: totalRefreshed };
}
