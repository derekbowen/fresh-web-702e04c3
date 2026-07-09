import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
const sb = () => supabaseAdmin;
const IG_LEAD_QUERIES = [
  'site:instagram.com "rent my pool"',
  'site:instagram.com "pool for rent"',
  'site:instagram.com "private pool rental"',
  'site:instagram.com "rent our pool"',
  'site:instagram.com "book my pool"',
  'site:instagram.com "swimply"',
  'site:instagram.com "peerspace pool"',
  'site:instagram.com "backyard pool rental"'
];
async function googleSearch(query, num = 30) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY not configured");
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: key,
    num: String(num),
    hl: "en",
    gl: "us"
  });
  const resp = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!resp.ok) {
    console.warn("[ig-lead-hunter] serpapi", resp.status, await resp.text().catch(() => ""));
    return [];
  }
  const json = await resp.json();
  return json?.organic_results || [];
}
function parseIgResult(url, title) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)instagram\.com$/.test(u.hostname)) return null;
  const seg = u.pathname.split("/").filter(Boolean);
  if (!seg.length) return null;
  const first = seg[0].toLowerCase();
  const skipSystem = ["explore", "stories", "directory", "accounts", "developer", "about", "legal"];
  if (skipSystem.includes(first)) return null;
  const cleanUrl = `https://www.instagram.com${u.pathname}${u.pathname.endsWith("/") ? "" : "/"}`;
  const postLike = ["p", "reel", "reels", "tv"].includes(first);
  if (postLike) {
    const m = title?.match(/\(@([a-zA-Z0-9._]{2,30})\)/);
    if (!m) return null;
    const handle2 = m[1];
    return {
      handle: handle2,
      profileUrl: `https://www.instagram.com/${handle2}/`,
      sourceUrl: cleanUrl
    };
  }
  const handle = seg[0];
  if (!/^[a-zA-Z0-9._]{2,30}$/.test(handle)) return null;
  const profileUrl = `https://www.instagram.com/${handle}/`;
  return { handle, profileUrl, sourceUrl: cleanUrl };
}
function extractProfileName(title, handle) {
  if (!title) return null;
  const m = title.match(/^(.+?)\s*\(@/);
  if (m) return m[1].trim();
  return title.split("|")[0].split("•")[0].trim() || null;
}
async function runIgLeadHunt(opts = {}) {
  const queries = opts.queries ?? IG_LEAD_QUERIES;
  const perQuery = opts.perQuery ?? 30;
  let resultsSeen = 0;
  let inserted = 0;
  let refreshed = 0;
  const seenUrls = /* @__PURE__ */ new Set();
  for (const q of queries) {
    let results = [];
    try {
      results = await googleSearch(q, perQuery);
    } catch (e) {
      console.warn("[ig-lead-hunter] query failed", q, e?.message);
      continue;
    }
    for (const r of results) {
      resultsSeen++;
      if (!r.link) continue;
      const parsed = parseIgResult(r.link, r.title);
      if (!parsed) continue;
      if (seenUrls.has(parsed.sourceUrl)) continue;
      seenUrls.add(parsed.sourceUrl);
      const profile_name = extractProfileName(r.title, parsed.handle);
      const snippet = r.snippet?.slice(0, 600) || null;
      const { data: existing } = await sb().from("ig_leads").select("id").eq("source_url", parsed.sourceUrl).maybeSingle();
      if (existing) {
        await sb().from("ig_leads").update({
          last_seen_at: (/* @__PURE__ */ new Date()).toISOString(),
          instagram_url: parsed.profileUrl,
          ...snippet ? { snippet } : {},
          ...profile_name ? { profile_name } : {},
          query: q
        }).eq("id", existing.id);
        refreshed++;
      } else {
        const { error } = await sb().from("ig_leads").insert({
          instagram_url: parsed.profileUrl,
          source_url: parsed.sourceUrl,
          profile_handle: parsed.handle,
          profile_name,
          snippet,
          query: q
        });
        if (!error) inserted++;
      }
    }
  }
  return {
    ok: true,
    queries_run: queries.length,
    results_seen: resultsSeen,
    inserted,
    refreshed
  };
}
export {
  IG_LEAD_QUERIES,
  runIgLeadHunt
};
