import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
const sb = () => supabaseAdmin;
const STOPLIST_DOMAINS = [
  "swimply.com",
  "peerspace.com",
  "giggster.com",
  "splacer.co",
  "airbnb.com",
  "vrbo.com",
  "booking.com",
  "tripadvisor.com",
  "pinterest.com",
  "alamy.com",
  "shutterstock.com",
  "istockphoto.com",
  "gettyimages.com",
  "dreamstime.com",
  "depositphotos.com",
  "123rf.com",
  "unsplash.com",
  "pexels.com",
  "freepik.com",
  "flickr.com",
  "reddit.com",
  "quora.com",
  "wikipedia.org",
  "wikimedia.org",
  "amazon.com",
  "ebay.com",
  "etsy.com",
  "yelp.com",
  "google.com",
  "bing.com",
  "youtube.com",
  "zillow.com",
  "redfin.com",
  "realtor.com",
  "trulia.com",
  "homedepot.com",
  "lowes.com",
  "wayfair.com"
];
async function firecrawlScrapeHtml(url) {
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) throw new Error("FIRECRAWL_API_KEY not configured");
  const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["html", "markdown"], onlyMainContent: false })
  });
  if (!resp.ok) throw new Error(`Firecrawl scrape failed ${resp.status}`);
  const json = await resp.json();
  const doc = json?.data || json;
  return {
    html: doc?.html || doc?.rawHtml || "",
    metadata: doc?.metadata || {},
    markdown: doc?.markdown || ""
  };
}
function extractListingImages(html, metadata) {
  const images = /* @__PURE__ */ new Map();
  const push = (raw, alt, score) => {
    if (!raw) return;
    let url = raw.trim().replace(/&amp;/g, "&");
    if (url.startsWith("//")) url = "https:" + url;
    if (!/^https?:\/\//i.test(url)) return;
    if (/\.(svg|gif|ico)(\?|$)/i.test(url)) return;
    if (/(logo|favicon|sprite|avatar|profile|icon|pixel|tracking|analytics)/i.test(url)) return;
    if (url.length > 600) return;
    const existing = images.get(url);
    if (!existing || existing.score < score) {
      images.set(url, { url, alt, score });
    }
  };
  if (metadata?.ogImage) push(metadata.ogImage, "og:image", 100);
  if (Array.isArray(metadata?.["og:image"])) {
    for (const u of metadata["og:image"]) push(u, "og:image", 100);
  }
  if (metadata?.["twitter:image"]) push(metadata["twitter:image"], "twitter:image", 95);
  const metaRe = /<meta[^>]+(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["'][^>]*content=["']([^"']+)["']/gi;
  let m;
  while (m = metaRe.exec(html)) push(m[1], "og:image", 100);
  const imgRe = /<img\b[^>]*?>/gi;
  while (m = imgRe.exec(html)) {
    const tag = m[0];
    const srcM = tag.match(/\bsrc=["']([^"']+)["']/i);
    const dataSrcM = tag.match(/\bdata-src=["']([^"']+)["']/i);
    const srcsetM = tag.match(/\bsrcset=["']([^"']+)["']/i);
    const altM = tag.match(/\balt=["']([^"']*)["']/i);
    const widthM = tag.match(/\bwidth=["']?(\d+)/i);
    const heightM = tag.match(/\bheight=["']?(\d+)/i);
    const w = widthM ? parseInt(widthM[1], 10) : 0;
    const h = heightM ? parseInt(heightM[1], 10) : 0;
    const alt = altM?.[1];
    const looksLikePool = alt && /(pool|backyard|patio|deck|hot tub|spa|villa|garden|yard|cabana)/i.test(alt);
    let baseScore = 30;
    if (w >= 600 || h >= 400) baseScore += 30;
    if (looksLikePool) baseScore += 25;
    const candidate = srcsetM ? srcsetM[1].split(",").map((s) => s.trim().split(" ")[0]).pop() : null;
    push(candidate || srcM?.[1] || dataSrcM?.[1] || "", alt, baseScore);
  }
  return Array.from(images.values()).sort((a, b) => b.score - a.score);
}
async function googleLensSearch(imageUrl) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY not configured");
  const params = new URLSearchParams({
    engine: "google_lens",
    url: imageUrl,
    api_key: key,
    hl: "en",
    country: "us"
  });
  const resp = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  if (!resp.ok) {
    console.warn("[reverse-image] serpapi", resp.status, await resp.text().catch(() => ""));
    return [];
  }
  const json = await resp.json();
  const matches = json?.visual_matches || json?.exact_matches || [];
  return matches;
}
function isStoplisted(host) {
  const h = host.toLowerCase().replace(/^www\./, "");
  return STOPLIST_DOMAINS.some((s) => h === s || h.endsWith("." + s));
}
function classify(link) {
  try {
    const u = new URL(link);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host.endsWith("instagram.com")) return "instagram";
    if (host.endsWith("facebook.com") || host.endsWith("fb.com")) return "facebook";
    if (host.endsWith("tiktok.com")) return "tiktok";
    if (isStoplisted(host)) return null;
    if (/(blogspot|wordpress|wix|squarespace|weebly|godaddysites)\./.test(host)) return null;
    return "website";
  } catch {
    return null;
  }
}
function extractHandle(link, platform) {
  try {
    const u = new URL(link);
    const seg = u.pathname.split("/").filter(Boolean);
    if (!seg.length) return null;
    if (platform === "instagram") {
      const h = seg[0];
      if (["p", "reel", "explore", "stories", "tv"].includes(h)) return null;
      return "@" + h;
    }
    if (platform === "tiktok") {
      const h = seg[0];
      if (h.startsWith("@")) return h;
      return null;
    }
    if (platform === "facebook") {
      const h = seg[0];
      if (["pages", "people", "groups", "events", "watch", "marketplace", "story.php", "photo.php"].includes(h)) {
        return seg[1] ? seg[1] : null;
      }
      return h;
    }
    return null;
  } catch {
    return null;
  }
}
function filterAndExtractLeads(matches, sourceImage, competitorHost) {
  const leads = [];
  const seen = /* @__PURE__ */ new Set();
  for (const m of matches) {
    const link = m.link || "";
    if (!link) continue;
    let host = "";
    try {
      host = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      continue;
    }
    if (host === competitorHost.toLowerCase().replace(/^www\./, "")) continue;
    const platform = classify(link);
    if (!platform) continue;
    const handle = extractHandle(link, platform);
    const business_name = m.title?.split(/[|·•—\-]/)[0]?.trim() || m.source || null;
    const dedupeKey = `${platform}:${handle || link}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    leads.push({
      platform,
      handle,
      business_name,
      url: link,
      source_image: sourceImage,
      evidence: `Reverse image match (Google Lens) on ${platform}. Title: ${m.title || "n/a"}.`
    });
  }
  return leads;
}
async function runReverseImageMatch(competitor_url_id, opts = {}) {
  const { data: row } = await sb().from("competitor_urls").select("id, url, site_id").eq("id", competitor_url_id).maybeSingle();
  if (!row) return { ok: false, inserted: 0, reason: "url not found" };
  const { data: site } = await sb().from("competitor_sites").select("domain").eq("id", row.site_id).maybeSingle();
  const domain = site?.domain || "";
  let scraped;
  try {
    scraped = await firecrawlScrapeHtml(row.url);
  } catch (e) {
    return { ok: false, inserted: 0, reason: e?.message || "scrape failed" };
  }
  const images = extractListingImages(scraped.html, scraped.metadata);
  if (images.length === 0) return { ok: true, inserted: 0, reason: "no images extracted" };
  const maxImages = opts.maxImages ?? 3;
  const top = images.slice(0, maxImages);
  let competitorHost = "";
  try {
    competitorHost = new URL(row.url).hostname;
  } catch {
  }
  const allLeads = [];
  for (const img of top) {
    let matches = [];
    try {
      matches = await googleLensSearch(img.url);
    } catch (e) {
      console.warn("[reverse-image] lens failed", e?.message);
      continue;
    }
    const leads = filterAndExtractLeads(matches, img.url, competitorHost);
    allLeads.push(...leads);
  }
  const seen = /* @__PURE__ */ new Set();
  const unique = allLeads.filter((l) => {
    const k = `${l.platform}:${l.handle || l.url}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (unique.length === 0) {
    return { ok: true, inserted: 0, reason: "no social/web matches", images_searched: top.length, leads_found: 0 };
  }
  const existingUrls = /* @__PURE__ */ new Set();
  const { data: existing } = await sb().from("competitor_host_matches").select("candidate_social_url, candidate_website").eq("competitor_url_id", competitor_url_id);
  for (const e of existing || []) {
    if (e.candidate_social_url) existingUrls.add(e.candidate_social_url);
    if (e.candidate_website) existingUrls.add(e.candidate_website);
  }
  const rows = unique.filter((l) => !existingUrls.has(l.url)).map((l) => {
    const isSocial = l.platform !== "website";
    return {
      competitor_url_id,
      competitor_url: row.url,
      domain,
      candidate_name: null,
      candidate_business_name: l.business_name,
      candidate_email: null,
      candidate_phone: null,
      candidate_website: isSocial ? null : l.url,
      candidate_social_url: isSocial ? l.url : null,
      candidate_source: `reverse_image_${l.platform}`,
      candidate_evidence: `${l.evidence}${l.handle ? ` Handle: ${l.handle}.` : ""} Source image: ${l.source_image}`,
      match_confidence: 55,
      // routed to review queue for human verification
      status: "review"
    };
  });
  if (rows.length === 0) {
    return { ok: true, inserted: 0, reason: "all leads already known", images_searched: top.length, leads_found: unique.length };
  }
  const { error } = await sb().from("competitor_host_matches").insert(rows);
  if (error) return { ok: false, inserted: 0, reason: error.message };
  return { ok: true, inserted: rows.length, images_searched: top.length, leads_found: unique.length };
}
export {
  extractListingImages,
  filterAndExtractLeads,
  runReverseImageMatch
};
