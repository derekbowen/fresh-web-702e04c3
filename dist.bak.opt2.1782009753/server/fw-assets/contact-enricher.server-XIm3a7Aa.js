import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { validateEmail, validateUSPhone, formatPhoneForDisplay } from "./lead-validators.server-C0OugZJy.js";
import "@supabase/supabase-js";
const sb = () => supabaseAdmin;
const DAILY_SPEND_CAP_USD = 10;
const PRIORITY_CITIES = new Set(
  [
    "los angeles",
    "long beach",
    "anaheim",
    "santa monica",
    "burbank",
    "phoenix",
    "scottsdale",
    "mesa",
    "tempe",
    "chandler",
    "gilbert",
    "glendale",
    "dallas",
    "fort worth",
    "arlington",
    "plano",
    "frisco",
    "irving",
    "tampa",
    "st petersburg",
    "saint petersburg",
    "clearwater",
    "miami",
    "fort lauderdale",
    "hollywood",
    "hialeah",
    "houston",
    "sugar land",
    "the woodlands",
    "austin",
    "round rock",
    "cedar park",
    "atlanta",
    "marietta",
    "alpharetta",
    "san diego",
    "chula vista",
    "las vegas",
    "henderson",
    "north las vegas"
  ].map((c) => c.toLowerCase())
);
const EMPTY = {
  full_name: null,
  emails: [],
  phones: [],
  social_profiles: [],
  property_address: null,
  property_city: null,
  property_state: null,
  property_zip: null
};
function sanitizeShape(s, firstName) {
  const emails = [];
  for (const e of s.emails) {
    if (validateEmail(e, { firstName }).ok && !emails.includes(e.toLowerCase())) emails.push(e.toLowerCase());
  }
  const phones = [];
  for (const p of s.phones) {
    const v = validateUSPhone(p);
    if (v.ok && v.normalized) {
      const display = formatPhoneForDisplay(v.normalized);
      if (!phones.includes(display)) phones.push(display);
    }
  }
  return { ...s, emails, phones };
}
function normalizeKey(parts) {
  return parts.map((p) => (p || "").toLowerCase().trim().replace(/\s+/g, " ")).filter(Boolean).join("|");
}
function isPriorityCity(city) {
  if (!city) return false;
  return PRIORITY_CITIES.has(city.toLowerCase().trim());
}
async function getDailySpend() {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const { data } = await sb().from("enrichment_spend_log").select("cost_usd").eq("spend_date", today);
  return (data || []).reduce((sum, r) => sum + Number(r.cost_usd || 0), 0);
}
async function logSpend(provider, match_id, cost_usd, outcome) {
  try {
    await sb().from("enrichment_spend_log").insert({
      provider,
      match_id,
      cost_usd,
      outcome
    });
  } catch {
  }
}
async function readCache(cacheKey) {
  const { data } = await sb().from("enriched_contacts").select("*").eq("cache_key", cacheKey).gt("expires_at", (/* @__PURE__ */ new Date()).toISOString()).maybeSingle();
  if (!data) return null;
  return {
    full_name: data.full_name,
    emails: Array.isArray(data.emails) ? data.emails : [],
    phones: Array.isArray(data.phones) ? data.phones : [],
    social_profiles: Array.isArray(data.social_profiles) ? data.social_profiles : [],
    property_address: data.property_address,
    property_city: data.property_city,
    property_state: data.property_state,
    property_zip: data.property_zip
  };
}
async function writeCache(cacheKey, tier, data, raw, cost) {
  try {
    await sb().from("enriched_contacts").upsert(
      {
        cache_key: cacheKey,
        source_tier: tier,
        full_name: data.full_name,
        emails: data.emails,
        phones: data.phones,
        social_profiles: data.social_profiles,
        property_address: data.property_address,
        property_city: data.property_city,
        property_state: data.property_state,
        property_zip: data.property_zip,
        raw_response: raw,
        cost_usd: cost,
        fetched_at: (/* @__PURE__ */ new Date()).toISOString(),
        expires_at: new Date(Date.now() + 90 * 86400 * 1e3).toISOString()
      },
      { onConflict: "cache_key" }
    );
  } catch (e) {
    console.error("[enricher] cache write failed", e);
  }
}
async function firecrawlSearch(query, limit = 4) {
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) return [];
  try {
    const resp = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit })
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    const results = json?.data?.web || json?.data || json?.web || [];
    return results.map((r) => ({
      url: r.url || "",
      title: r.title || "",
      description: r.description || r.snippet || ""
    })).filter((r) => r.url);
  } catch {
    return [];
  }
}
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
const ADDRESS_RE = /\b\d{1,6}\s+[A-Z][a-zA-Z0-9.\- ]{2,40}\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Pl|Place|Pkwy|Parkway|Ter|Terrace)\b/g;
async function tier0Osint(input) {
  const out = { ...EMPTY, emails: [], phones: [], social_profiles: [] };
  const queries = [];
  if (input.first_name && input.city) {
    queries.push(`"${input.first_name}" "${input.city}" pool rental site:facebook.com`);
    queries.push(`"${input.first_name}" "${input.city}" ${input.state || ""} site:linkedin.com/in`);
    queries.push(`"${input.first_name}" "${input.city}" pool party rental`);
  }
  if (input.existing_email) queries.push(`"${input.existing_email}"`);
  if (input.existing_phone) queries.push(`"${input.existing_phone}"`);
  const allText = [];
  for (const q of queries.slice(0, 5)) {
    const results = await firecrawlSearch(q, 4);
    for (const r of results) {
      if (/facebook\.com\/[^/]+\/?$/i.test(r.url) || /linkedin\.com\/in\//i.test(r.url) || /instagram\.com\/[^/]+\/?$/i.test(r.url)) {
        if (!out.social_profiles.includes(r.url)) out.social_profiles.push(r.url);
      }
      allText.push(`${r.title} ${r.description}`);
    }
  }
  const blob = allText.join(" ");
  const emails = Array.from(new Set((blob.match(EMAIL_RE) || []).filter(
    (e) => !/swimply|peerspace|giggster|sentry|cloudflare|gstatic|googleusercontent|wixpress|squarespace/i.test(e)
  ))).slice(0, 3);
  const phones = Array.from(new Set(blob.match(PHONE_RE) || [])).slice(0, 3);
  const addresses = Array.from(new Set(blob.match(ADDRESS_RE) || []));
  out.emails = emails;
  out.phones = phones;
  if (addresses.length > 0) out.property_address = addresses[0];
  out.property_city = input.city;
  out.property_state = input.state;
  await logSpend("osint", input.match_id, 0, out.emails.length || out.phones.length || out.social_profiles.length ? "hit" : "miss");
  return out;
}
async function tier1BatchData(input) {
  const apiKey = process.env.BATCHDATA_API_KEY;
  if (!apiKey) {
    return { data: EMPTY, cost: 0 };
  }
  const cost = 0.1;
  try {
    const resp = await fetch("https://api.batchdata.com/api/v1/property/skip-trace", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            propertyAddress: {
              street: input.property_address,
              city: input.city || void 0,
              state: input.state || void 0
            }
          }
        ]
      })
    });
    if (!resp.ok) {
      await logSpend("batchdata", input.match_id, 0, "error");
      return { data: EMPTY, cost: 0 };
    }
    const json = await resp.json();
    const person = json?.results?.persons?.[0] || json?.results?.[0]?.person || null;
    if (!person) {
      await logSpend("batchdata", input.match_id, cost, "miss");
      return { data: EMPTY, cost };
    }
    const data = {
      full_name: [person.name?.first, person.name?.last].filter(Boolean).join(" ") || null,
      emails: (person.emails || []).map((e) => e?.email || e).filter(Boolean).slice(0, 5),
      phones: (person.phoneNumbers || person.phones || []).map((p) => p?.number || p).filter(Boolean).slice(0, 5),
      social_profiles: [],
      property_address: input.property_address,
      property_city: input.city,
      property_state: input.state,
      property_zip: person.address?.zip || null
    };
    await logSpend("batchdata", input.match_id, cost, data.emails.length || data.phones.length ? "hit" : "miss");
    return { data, cost };
  } catch (e) {
    console.error("[enricher] batchdata failed", e);
    await logSpend("batchdata", input.match_id, 0, "error");
    return { data: EMPTY, cost: 0 };
  }
}
async function tier2Pdl(input) {
  const apiKey = process.env.PDL_API_KEY;
  if (!apiKey) return { data: EMPTY, cost: 0 };
  const cost = 0.2;
  try {
    const params = new URLSearchParams();
    if (input.existing_email) params.set("email", input.existing_email);
    else {
      params.set("first_name", input.first_name);
      params.set("locality", input.city);
      if (input.state) params.set("region", input.state);
    }
    params.set("min_likelihood", "6");
    const resp = await fetch(`https://api.peopledatalabs.com/v5/person/enrich?${params}`, {
      method: "GET",
      headers: { "X-Api-Key": apiKey }
    });
    if (resp.status === 404) {
      await logSpend("pdl", input.match_id, 0, "miss");
      return { data: EMPTY, cost: 0 };
    }
    if (!resp.ok) {
      await logSpend("pdl", input.match_id, 0, "error");
      return { data: EMPTY, cost: 0 };
    }
    const json = await resp.json();
    const p = json?.data;
    if (!p) {
      await logSpend("pdl", input.match_id, cost, "miss");
      return { data: EMPTY, cost };
    }
    const data = {
      full_name: p.full_name || null,
      emails: (p.emails || []).map((e) => e?.address || e).filter(Boolean).slice(0, 5),
      phones: (p.phone_numbers || []).filter(Boolean).slice(0, 5),
      social_profiles: (p.profiles || []).map((s) => s?.url).filter(Boolean).slice(0, 10),
      property_address: null,
      property_city: p.location_locality || input.city,
      property_state: p.location_region || input.state,
      property_zip: p.location_postal_code || null
    };
    await logSpend("pdl", input.match_id, cost, data.emails.length || data.phones.length ? "hit" : "miss");
    return { data, cost };
  } catch (e) {
    console.error("[enricher] pdl failed", e);
    await logSpend("pdl", input.match_id, 0, "error");
    return { data: EMPTY, cost: 0 };
  }
}
function scoreRevenueSignal(markdown) {
  if (!markdown) return { score: 0, notes: "no listing text" };
  const notes = [];
  let score = 0;
  const priceMatch = markdown.match(/\$\s?(\d{2,4})(?:\s*\/\s*hour|\s*per hour|\s*\/hr|\s*\/h\b)/i);
  if (priceMatch) {
    const price = Number(priceMatch[1]);
    if (price >= 100) {
      score += 40;
      notes.push(`$${price}/hour premium pricing`);
    } else if (price >= 60) {
      score += 20;
      notes.push(`$${price}/hour mid pricing`);
    }
  }
  const reviewMatch = markdown.match(/(\d{1,4})\s*review/i);
  if (reviewMatch) {
    const reviews = Number(reviewMatch[1]);
    if (reviews >= 50) {
      score += 35;
      notes.push(`${reviews} reviews`);
    } else if (reviews >= 20) {
      score += 20;
      notes.push(`${reviews} reviews`);
    } else if (reviews >= 5) {
      score += 10;
      notes.push(`${reviews} reviews`);
    }
  }
  if (/super\s*host|top\s*host|elite\s*host/i.test(markdown)) {
    score += 15;
    notes.push("superhost badge");
  }
  const sinceMatch = markdown.match(/(?:host(?:ing)?\s+since|joined\s+in)\s+(20\d{2})/i);
  if (sinceMatch) {
    const year = Number(sinceMatch[1]);
    const monthsActive = ((/* @__PURE__ */ new Date()).getFullYear() - year) * 12;
    if (monthsActive >= 12) {
      score += 15;
      notes.push(`hosting ${monthsActive}mo`);
    } else if (monthsActive >= 6) {
      score += 8;
      notes.push(`hosting ${monthsActive}mo`);
    }
  }
  return { score: Math.min(100, score), notes: notes.join(", ") };
}
async function enrichHostMatch(match_id, opts) {
  const { data: match } = await sb().from("competitor_host_matches").select("*").eq("id", match_id).maybeSingle();
  if (!match) return { ok: false, match_id, tier_reached: "skipped", cost_usd: 0, emails_found: 0, phones_found: 0, reason: "match not found" };
  const cacheKey = normalizeKey([
    match.candidate_email,
    match.candidate_phone,
    match.host_first_name,
    match.host_city,
    match.host_state
  ]);
  if (cacheKey) {
    const cached = await readCache(cacheKey);
    if (cached) {
      await sb().from("competitor_host_matches").update({
        enriched_at: (/* @__PURE__ */ new Date()).toISOString(),
        enriched_tier: "cached",
        enriched_emails: cached.emails,
        enriched_phones: cached.phones,
        enriched_socials: cached.social_profiles,
        property_address: cached.property_address
      }).eq("id", match_id);
      return { ok: true, match_id, tier_reached: "cached", cost_usd: 0, emails_found: cached.emails.length, phones_found: cached.phones.length };
    }
  }
  let listingMd = null;
  try {
    const { data: page } = await sb().from("competitor_pages").select("markdown").eq("url", match.competitor_url).maybeSingle();
    listingMd = page?.markdown || null;
  } catch {
  }
  const revenue = scoreRevenueSignal(listingMd);
  const t0 = await tier0Osint({
    match_id,
    first_name: match.host_first_name,
    city: match.host_city,
    state: match.host_state,
    existing_email: match.candidate_email,
    existing_phone: match.candidate_phone
  });
  let combined = sanitizeShape({ ...t0 }, match.host_first_name);
  let highestTier = "osint";
  let totalCost = 0;
  const spentToday = await getDailySpend();
  const overCap = spentToday >= DAILY_SPEND_CAP_USD;
  let listingCapHit = false;
  try {
    const since = new Date(Date.now() - 30 * 86400 * 1e3).toISOString();
    const { data: recent } = await sb().from("competitor_host_matches").select("id, enrichment_cost_usd, enriched_at").eq("competitor_url_id", match.competitor_url_id).gt("enriched_at", since);
    const paidCalls = (recent || []).filter((r) => Number(r.enrichment_cost_usd || 0) > 0 && r.id !== match_id).length;
    if (paidCalls >= 1) listingCapHit = true;
  } catch {
  }
  const priority = isPriorityCity(match.host_city);
  const confidence = Number(match.match_confidence || 0);
  const hasAnyValidatedSignal = combined.emails.length > 0 || combined.phones.length > 0 || !!match.host_first_name;
  if (!hasAnyValidatedSignal && !opts?.force_tier) {
    await sb().from("competitor_host_matches").update({
      enriched_at: (/* @__PURE__ */ new Date()).toISOString(),
      enriched_tier: "osint",
      enriched_emails: combined.emails,
      enriched_phones: combined.phones,
      enriched_socials: combined.social_profiles,
      revenue_signal_score: revenue.score,
      revenue_signal_notes: revenue.notes,
      enrichment_cost_usd: 0
    }).eq("id", match_id);
    return { ok: true, match_id, tier_reached: "osint", cost_usd: 0, emails_found: 0, phones_found: 0, reason: "no validated signal — paid tiers skipped" };
  }
  const tier1Eligible = !overCap && !listingCapHit && priority && confidence >= 85 && !!combined.property_address;
  const forceT1 = opts?.force_tier === "batchdata" || opts?.force_tier === "pdl";
  if ((tier1Eligible || forceT1) && combined.property_address) {
    const t1 = await tier1BatchData({
      match_id,
      property_address: combined.property_address,
      city: match.host_city,
      state: match.host_state
    });
    totalCost += t1.cost;
    if (t1.data.emails.length || t1.data.phones.length) {
      combined.full_name = combined.full_name || t1.data.full_name;
      combined.emails = Array.from(/* @__PURE__ */ new Set([...combined.emails, ...t1.data.emails]));
      combined.phones = Array.from(/* @__PURE__ */ new Set([...combined.phones, ...t1.data.phones]));
      combined.property_zip = combined.property_zip || t1.data.property_zip;
      highestTier = "batchdata";
    }
  }
  const stillUnderCap = await getDailySpend() < DAILY_SPEND_CAP_USD;
  const tier2Eligible = stillUnderCap && !listingCapHit && priority && confidence >= 85 && revenue.score >= 50 && !!(match.host_first_name && match.host_city);
  const forceT2 = opts?.force_tier === "pdl";
  if ((tier2Eligible || forceT2) && match.host_first_name && match.host_city) {
    const t2 = await tier2Pdl({
      match_id,
      first_name: match.host_first_name,
      city: match.host_city,
      state: match.host_state,
      existing_email: combined.emails[0] || match.candidate_email
    });
    totalCost += t2.cost;
    if (t2.data.emails.length || t2.data.phones.length || t2.data.social_profiles.length) {
      combined.full_name = combined.full_name || t2.data.full_name;
      combined.emails = Array.from(/* @__PURE__ */ new Set([...combined.emails, ...t2.data.emails]));
      combined.phones = Array.from(/* @__PURE__ */ new Set([...combined.phones, ...t2.data.phones]));
      combined.social_profiles = Array.from(/* @__PURE__ */ new Set([...combined.social_profiles, ...t2.data.social_profiles]));
      highestTier = "pdl";
    }
  }
  combined = sanitizeShape(combined, match.host_first_name);
  if (cacheKey) {
    await writeCache(cacheKey, highestTier, combined, { revenue, listingMd: !!listingMd }, totalCost);
  }
  await sb().from("competitor_host_matches").update({
    enriched_at: (/* @__PURE__ */ new Date()).toISOString(),
    enriched_tier: highestTier,
    enriched_emails: combined.emails,
    enriched_phones: combined.phones,
    enriched_socials: combined.social_profiles,
    property_address: combined.property_address,
    revenue_signal_score: revenue.score,
    revenue_signal_notes: revenue.notes,
    enrichment_cost_usd: totalCost
  }).eq("id", match_id);
  return {
    ok: true,
    match_id,
    tier_reached: highestTier,
    cost_usd: totalCost,
    emails_found: combined.emails.length,
    phones_found: combined.phones.length,
    reason: listingCapHit ? "30-day per-listing cap hit, paid tiers skipped" : overCap ? "daily cap reached, paid tiers skipped" : void 0
  };
}
async function enrichManyHostMatches(match_ids) {
  let total_cost = 0;
  let processed = 0;
  let cap_hit = false;
  for (const id of match_ids) {
    const spent = await getDailySpend();
    if (spent >= DAILY_SPEND_CAP_USD) {
      cap_hit = true;
      await enrichHostMatch(id).catch(() => null);
      processed++;
      continue;
    }
    const r = await enrichHostMatch(id).catch(() => null);
    if (r) {
      total_cost += r.cost_usd;
      processed++;
    }
  }
  return { processed, total_cost, cap_hit };
}
export {
  enrichHostMatch,
  enrichManyHostMatches,
  scoreRevenueSignal
};
