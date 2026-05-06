/**
 * Host matcher agent — server only.
 * Above-board only: scrapes the public competitor listing for host first name +
 * city + any contact info the host themselves posted, then cross-references
 * against public business signals (Google, Yelp, public Facebook Pages) via
 * Firecrawl search. Uses Gemini to score candidates. NO face matching, NO
 * social profile scraping that violates ToS.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sb = () => supabaseAdmin as any;

type ListingFacts = {
  host_first_name: string | null;
  host_city: string | null;
  host_state: string | null;
  raw_contact: { emails: string[]; phones: string[]; urls: string[] };
};

type Candidate = {
  candidate_name: string | null;
  candidate_business_name: string | null;
  candidate_email: string | null;
  candidate_phone: string | null;
  candidate_website: string | null;
  candidate_social_url: string | null;
  candidate_source: string;
  candidate_evidence: string;
  match_confidence: number;
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
const URL_RE = /https?:\/\/[^\s)\]"']+/g;

function extractFactsFromListing(markdown: string, url: string): ListingFacts {
  // Heuristic: hosts are usually presented as "Hosted by Sarah" or "Sarah's pool"
  let host_first_name: string | null = null;
  const hostedBy = markdown.match(/Hosted by\s+([A-Z][a-zA-Z]{1,20})/);
  if (hostedBy) host_first_name = hostedBy[1];
  if (!host_first_name) {
    const ownerMatch = markdown.match(/(?:Owner|Host):\s*([A-Z][a-zA-Z]{1,20})/);
    if (ownerMatch) host_first_name = ownerMatch[1];
  }

  // City from listing — Swimply URLs and pages frequently include "in <City>, <ST>"
  let host_city: string | null = null;
  let host_state: string | null = null;
  const cityState = markdown.match(/\bin\s+([A-Z][a-zA-Z .'-]{2,30}),\s*([A-Z]{2})\b/);
  if (cityState) {
    host_city = cityState[1].trim();
    host_state = cityState[2];
  } else {
    // fallback: try URL slug like /pools/austin-tx/...
    const urlSlug = url.match(/\/([a-z]+(?:-[a-z]+)*)-([a-z]{2})(?:\/|$)/);
    if (urlSlug) {
      host_city = urlSlug[1].split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
      host_state = urlSlug[2].toUpperCase();
    }
  }

  // In-listing contact info the host themselves published (totally fair game)
  const emails = Array.from(new Set((markdown.match(EMAIL_RE) || []).filter((e) =>
    !/swimply|peerspace|giggster|sentry|cloudflare|gstatic|googleusercontent/i.test(e)
  ))).slice(0, 5);
  const phones = Array.from(new Set(markdown.match(PHONE_RE) || [])).slice(0, 5);
  const urls = Array.from(new Set((markdown.match(URL_RE) || []).filter((u) =>
    !/swimply|peerspace|giggster|googleapis|google\.com|gstatic|cloudfront|sentry|stripe|cloudflare|facebook\.com\/tr|fbcdn/i.test(u)
  ))).slice(0, 10);

  return {
    host_first_name,
    host_city,
    host_state,
    raw_contact: { emails, phones, urls },
  };
}

async function firecrawlScrape(url: string): Promise<string> {
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) throw new Error("FIRECRAWL_API_KEY not configured");
  const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  if (!resp.ok) throw new Error(`Firecrawl scrape ${resp.status}`);
  const json = await resp.json();
  const doc = json?.data || json;
  return doc?.markdown || "";
}

async function firecrawlSearch(query: string, limit = 5): Promise<Array<{ url: string; title: string; description: string }>> {
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) return [];
  try {
    const resp = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    const results = (json?.data?.web || json?.data || json?.web || []) as any[];
    return results.map((r) => ({
      url: r.url || "",
      title: r.title || "",
      description: r.description || r.snippet || "",
    })).filter((r) => r.url);
  } catch {
    return [];
  }
}

async function geminiRankCandidates(
  facts: ListingFacts,
  searchResults: Array<{ url: string; title: string; description: string; source: string }>,
): Promise<Candidate[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || searchResults.length === 0) return [];

  const prompt = `You are a B2B lead qualifier. A pool owner is renting their pool on Swimply/Peerspace/Giggster. We extracted these public facts from the listing:

Host first name: ${facts.host_first_name || "unknown"}
City: ${facts.host_city || "unknown"}, ${facts.host_state || ""}
Contact info host published in listing: emails=${JSON.stringify(facts.raw_contact.emails)}, phones=${JSON.stringify(facts.raw_contact.phones)}, urls=${JSON.stringify(facts.raw_contact.urls)}

We searched Google/Yelp/Facebook Pages for related public business listings. Here are the top results:

${searchResults.map((r, i) => `[${i}] (source=${r.source}) ${r.title}\n  ${r.url}\n  ${r.description}`).join("\n\n")}

For EACH search result, decide if it plausibly belongs to the same person/household. Match strongly only if: name matches AND city matches, OR business is clearly a pool-related side hustle in the same city, OR result contains an email/phone/website that ALSO appears in the listing.

Return JSON array (max 5 entries, only confidence>=30). Each entry:
{
  "result_index": number,
  "candidate_name": string|null,
  "candidate_business_name": string|null,
  "candidate_email": string|null,
  "candidate_phone": string|null,
  "candidate_website": string|null,
  "candidate_social_url": string|null,
  "candidate_evidence": "one sentence why this matches",
  "match_confidence": 0-100
}

Return ONLY the JSON array, no prose.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content || "";
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr)) return [];
    return arr.map((c: any) => {
      const src = searchResults[c.result_index];
      return {
        candidate_name: c.candidate_name || null,
        candidate_business_name: c.candidate_business_name || null,
        candidate_email: c.candidate_email || null,
        candidate_phone: c.candidate_phone || null,
        candidate_website: c.candidate_website || src?.url || null,
        candidate_social_url: c.candidate_social_url || null,
        candidate_source: src?.source || "web_search",
        candidate_evidence: c.candidate_evidence || "",
        match_confidence: Math.min(100, Math.max(0, Number(c.match_confidence) || 0)),
      } as Candidate;
    }).filter((c) => c.match_confidence >= 30);
  } catch (e) {
    console.error("[host-matcher] gemini parse failed", e);
    return [];
  }
}

/**
 * Main entry: match a single competitor URL.
 * Returns number of candidates inserted.
 */
export async function matchCompetitorUrl(competitor_url_id: string): Promise<{ ok: boolean; inserted: number; reason?: string }> {
  const { data: row } = await sb()
    .from("competitor_urls")
    .select("id, url, site_id")
    .eq("id", competitor_url_id)
    .maybeSingle();
  if (!row) return { ok: false, inserted: 0, reason: "url not found" };

  const { data: site } = await sb()
    .from("competitor_sites").select("domain").eq("id", row.site_id).maybeSingle();
  const domain = site?.domain || null;

  // Skip if we already have matches for this URL
  const { count: existing } = await sb()
    .from("competitor_host_matches").select("id", { count: "exact", head: true })
    .eq("competitor_url_id", competitor_url_id);
  if ((existing || 0) > 0) return { ok: true, inserted: 0, reason: "already matched" };

  let markdown: string;
  try {
    markdown = await firecrawlScrape(row.url);
  } catch (e: any) {
    return { ok: false, inserted: 0, reason: e?.message || "scrape failed" };
  }

  const facts = extractFactsFromListing(markdown, row.url);
  if (!facts.host_first_name && facts.raw_contact.emails.length === 0 && facts.raw_contact.phones.length === 0) {
    return { ok: true, inserted: 0, reason: "no signals to match on" };
  }

  // Build cross-reference search queries (above-board sources only)
  const queries: { q: string; source: string }[] = [];
  const cityQual = facts.host_city ? `"${facts.host_city}"` : "";
  if (facts.host_first_name && facts.host_city) {
    queries.push({ q: `"${facts.host_first_name}" ${cityQual} pool rental OR backyard`, source: "google" });
    queries.push({ q: `${facts.host_first_name} ${cityQual} site:yelp.com`, source: "yelp" });
    queries.push({ q: `${facts.host_first_name} ${cityQual} site:facebook.com/pages`, source: "facebook_page" });
  }
  for (const email of facts.raw_contact.emails) {
    queries.push({ q: `"${email}"`, source: "listing_description" });
  }
  for (const phone of facts.raw_contact.phones) {
    queries.push({ q: `"${phone}"`, source: "listing_description" });
  }
  for (const u of facts.raw_contact.urls.slice(0, 3)) {
    queries.push({ q: `"${u}"`, source: "website_contact" });
  }

  if (queries.length === 0) return { ok: true, inserted: 0, reason: "no queries" };

  // Run searches (cap at 5 to control cost)
  const allResults: Array<{ url: string; title: string; description: string; source: string }> = [];
  for (const { q, source } of queries.slice(0, 5)) {
    const results = await firecrawlSearch(q, 4);
    for (const r of results) allResults.push({ ...r, source });
  }

  if (allResults.length === 0) return { ok: true, inserted: 0, reason: "no search results" };

  const candidates = await geminiRankCandidates(facts, allResults);
  if (candidates.length === 0) return { ok: true, inserted: 0, reason: "no confident matches" };

  const rows = candidates.map((c) => ({
    competitor_url_id,
    competitor_url: row.url,
    domain,
    host_first_name: facts.host_first_name,
    host_city: facts.host_city,
    host_state: facts.host_state,
    ...c,
  }));
  const { error } = await sb().from("competitor_host_matches").insert(rows);
  if (error) return { ok: false, inserted: 0, reason: error.message };

  return { ok: true, inserted: rows.length };
}

/** Run matcher for many URLs. Used by daily scan and manual batch. */
export async function matchManyCompetitorUrls(ids: string[], maxConcurrent = 2): Promise<{ processed: number; matched: number }> {
  let processed = 0;
  let matched = 0;
  for (let i = 0; i < ids.length; i += maxConcurrent) {
    const batch = ids.slice(i, i + maxConcurrent);
    const results = await Promise.all(batch.map((id) => matchCompetitorUrl(id).catch((e) => ({ ok: false, inserted: 0, reason: e?.message }))));
    for (const r of results) {
      processed++;
      if (r.ok && r.inserted > 0) matched++;
    }
  }
  return { processed, matched };
}
