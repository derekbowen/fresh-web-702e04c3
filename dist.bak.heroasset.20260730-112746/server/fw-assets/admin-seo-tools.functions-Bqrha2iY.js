import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { z } from "zod";
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
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const sb = () => supabaseAdmin;
const importGscQueries_createServerFn_handler = createServerRpc({
  id: "2033915202afff1ecdcab94a8d5cb7129d202dd3f5332d4a864d814baf7ede56",
  name: "importGscQueries",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => importGscQueries.__executeServer(opts));
const importGscQueries = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  rows: z.array(z.object({
    url_path: z.string().min(1),
    query: z.string().min(1).max(300),
    clicks: z.number().int().min(0).default(0),
    impressions: z.number().int().min(0).default(0),
    ctr: z.number().nullable().optional(),
    position: z.number().nullable().optional()
  })).min(1).max(5e3)
}).parse(d)).handler(importGscQueries_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const captured_at = (/* @__PURE__ */ new Date()).toISOString();
  const payload = data.rows.map((r) => ({
    ...r,
    ctr: r.ctr ?? null,
    position: r.position ?? null,
    captured_at
  }));
  const {
    error,
    count
  } = await sb().from("gsc_query_data").upsert(payload, {
    onConflict: "url_path,query",
    count: "exact"
  });
  if (error) return {
    ok: false,
    error: error.message,
    total: data.rows.length
  };
  return {
    ok: true,
    total: data.rows.length,
    upserted: count ?? data.rows.length
  };
});
const findKeywordOpportunities_createServerFn_handler = createServerRpc({
  id: "60bd55c1c6dfa9680eebd080845d94a4a14b439e39650c610e49367d28a96939",
  name: "findKeywordOpportunities",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => findKeywordOpportunities.__executeServer(opts));
const findKeywordOpportunities = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  minPosition: z.number().min(1).max(100).default(5),
  maxPosition: z.number().min(1).max(100).default(20),
  minImpressions: z.number().int().min(0).default(50),
  limit: z.number().int().min(10).max(500).default(100),
  pathLike: z.string().max(200).default("")
}).parse(d ?? {})).handler(findKeywordOpportunities_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("gsc_query_data").select("*", {
    count: "exact"
  }).gte("position", data.minPosition).lte("position", data.maxPosition).gte("impressions", data.minImpressions).order("impressions", {
    ascending: false
  }).limit(data.limit);
  if (data.pathLike) q = q.ilike("url_path", `%${data.pathLike}%`);
  const {
    data: rows,
    count
  } = await q;
  return {
    rows: rows || [],
    total: count || 0
  };
});
const getKeywordStats_createServerFn_handler = createServerRpc({
  id: "d08326e8cd7b793b8e3e5c27654807fd98f6d2e6bc7a862fb18a91c75c053c3f",
  name: "getKeywordStats",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => getKeywordStats.__executeServer(opts));
const getKeywordStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getKeywordStats_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const [{
    count: totalQueries
  }, {
    count: opportunities
  }, {
    count: top3
  }] = await Promise.all([sb().from("gsc_query_data").select("*", {
    count: "exact",
    head: true
  }), sb().from("gsc_query_data").select("*", {
    count: "exact",
    head: true
  }).gte("position", 5).lte("position", 20).gte("impressions", 50), sb().from("gsc_query_data").select("*", {
    count: "exact",
    head: true
  }).lte("position", 3)]);
  return {
    totalQueries: totalQueries || 0,
    opportunities: opportunities || 0,
    top3: top3 || 0
  };
});
const listCompetitorPages_createServerFn_handler = createServerRpc({
  id: "18c4d88a88f01b6faf6dc97883d6a278b4bfe7051d0ea47ede4eff9b181d44e8",
  name: "listCompetitorPages",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => listCompetitorPages.__executeServer(opts));
const listCompetitorPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  q: z.string().max(200).default(""),
  limit: z.number().int().min(10).max(500).default(100)
}).parse(d ?? {})).handler(listCompetitorPages_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("competitor_pages").select("id, url, domain, title, meta_description, h1, word_count, notes, last_scraped_at, updated_at").order("updated_at", {
    ascending: false
  }).limit(data.limit);
  if (data.q) q = q.or(`url.ilike.%${data.q}%,title.ilike.%${data.q}%,domain.ilike.%${data.q}%`);
  const {
    data: rows
  } = await q;
  return {
    rows: rows || []
  };
});
const scrapeCompetitorUrl_createServerFn_handler = createServerRpc({
  id: "abcedb62da03db7f2ad3350d24d21ab7da713b62d6f689ba430c13b65e023004",
  name: "scrapeCompetitorUrl",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => scrapeCompetitorUrl.__executeServer(opts));
const scrapeCompetitorUrl = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url: z.string().url(),
  notes: z.string().max(1e3).optional()
}).parse(d)).handler(scrapeCompetitorUrl_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) return {
    ok: false,
    error: "FIRECRAWL_API_KEY not configured"
  };
  let isSpa = false;
  try {
    const h = new URL(data.url).hostname.replace(/^www\./, "");
    isSpa = /poolrentalnearme\.com|swimply\.com|peerspace\.com|giggster\.com/.test(h);
  } catch {
  }
  const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fcKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: data.url,
      formats: ["markdown"],
      onlyMainContent: !isSpa,
      // SPAs need full DOM, main-content extraction strips listing details
      waitFor: isSpa ? 4e3 : 0
    })
  });
  if (resp.status === 402) return {
    ok: false,
    error: "Firecrawl credits exhausted"
  };
  if (!resp.ok) return {
    ok: false,
    error: `Firecrawl ${resp.status}: ${(await resp.text()).slice(0, 200)}`
  };
  const json = await resp.json();
  const doc = json?.data || json;
  const markdown = doc?.markdown || "";
  const meta = doc?.metadata || {};
  if (!markdown || markdown.trim().length < 50) {
    return {
      ok: false,
      error: `Scrape returned ${markdown.length} chars. Page may block bots or render entirely client-side. Try a different URL.`
    };
  }
  let domain = null;
  try {
    domain = new URL(data.url).hostname.replace(/^www\./, "");
  } catch {
  }
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  const headings = Array.from(markdown.matchAll(/^(#{1,3})\s+(.+)$/gm)).slice(0, 50).map((m) => ({
    level: m[1].length,
    text: m[2].trim()
  }));
  const word_count = markdown.split(/\s+/).filter(Boolean).length;
  const {
    data: row,
    error
  } = await sb().from("competitor_pages").upsert({
    url: data.url,
    domain,
    title: meta.title || meta.ogTitle || null,
    meta_description: meta.description || meta.ogDescription || null,
    h1: h1Match ? h1Match[1].trim() : null,
    word_count,
    headings,
    markdown: markdown.slice(0, 5e4),
    notes: data.notes ?? null,
    last_scraped_at: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    onConflict: "url"
  }).select("id, url, word_count").maybeSingle();
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    id: row?.id,
    word_count: row?.word_count
  };
});
const compareCompetitorToPage_createServerFn_handler = createServerRpc({
  id: "ee0e9e2133ef2cd6ef2a909fab2dfb7c0aea8c8465511c40df71be8acc135db1",
  name: "compareCompetitorToPage",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => compareCompetitorToPage.__executeServer(opts));
const compareCompetitorToPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  competitor_id: z.string().uuid(),
  our_url_path: z.string().min(1)
}).parse(d)).handler(compareCompetitorToPage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const [{
    data: comp
  }, {
    data: ours
  }] = await Promise.all([sb().from("competitor_pages").select("url, title, h1, word_count, headings, markdown").eq("id", data.competitor_id).maybeSingle(), sb().from("content_pages").select("url_path, title, body_markdown").eq("url_path", data.our_url_path).maybeSingle()]);
  if (!comp) return {
    ok: false,
    error: "Competitor page not found"
  };
  if (!ours) return {
    ok: false,
    error: "Our page not found"
  };
  const ourWords = (ours.body_markdown || "").split(/\s+/).filter(Boolean).length;
  const ourHeadings = Array.from((ours.body_markdown || "").matchAll(/^(#{1,3})\s+(.+)$/gm)).map((m) => m[2].trim().toLowerCase());
  const compHeadings = comp.headings || [];
  const missing = compHeadings.filter((h) => !ourHeadings.includes(h.text.toLowerCase()));
  return {
    ok: true,
    our: {
      url_path: ours.url_path,
      title: ours.title,
      word_count: ourWords,
      headings: ourHeadings.length
    },
    competitor: {
      url: comp.url,
      title: comp.title,
      word_count: comp.word_count,
      headings: compHeadings.length
    },
    word_gap: comp.word_count - ourWords,
    missing_sections: missing.slice(0, 30)
  };
});
const deleteCompetitor_createServerFn_handler = createServerRpc({
  id: "01307473f0636f6dcc058befb82d2bc8bbac42361618ef95e6024c9792fb29b5",
  name: "deleteCompetitor",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => deleteCompetitor.__executeServer(opts));
const deleteCompetitor = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteCompetitor_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("competitor_pages").delete().eq("id", data.id);
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true
  };
});
const STOP = /* @__PURE__ */ new Set(["the", "a", "an", "and", "or", "of", "in", "to", "for", "with", "on", "at", "by", "from", "is", "are", "was", "were", "be", "been", "being", "this", "that", "these", "those", "it", "its", "as", "but", "if", "then", "than", "so", "you", "your", "i", "we", "our", "they", "them", "their", "he", "she", "his", "her", "not", "no", "yes", "do", "does", "did", "have", "has", "had", "will", "would", "can", "could", "should", "may", "might", "just", "also", "very", "more", "most", "all", "any", "some", "one", "two", "three", "up", "down", "out", "into", "over", "under", "about", "near", "there", "here"]);
function tokenize(text) {
  return new Set((text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
const generateLinkSuggestions_createServerFn_handler = createServerRpc({
  id: "ecbc4f3f2bcda1eb2070b56e715844b0c372e02b3ab9298ad9991797d73d8073",
  name: "generateLinkSuggestions",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => generateLinkSuggestions.__executeServer(opts));
const generateLinkSuggestions = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  sampleSize: z.number().int().min(20).max(2e3).default(500),
  minScore: z.number().min(0.05).max(1).default(0.18),
  perPage: z.number().int().min(1).max(20).default(5)
}).parse(d ?? {})).handler(generateLinkSuggestions_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: pages
  } = await sb().from("content_pages").select("url_path, title, body_markdown").eq("status", "published").like("url_path", "/p/%").order("updated_at", {
    ascending: false
  }).limit(data.sampleSize);
  if (!pages?.length) return {
    ok: false,
    error: "No pages to analyze"
  };
  const tokenized = pages.map((p) => ({
    url: p.url_path,
    title: p.title,
    body: p.body_markdown,
    tokens: tokenize(`${p.title || ""} ${(p.body_markdown || "").slice(0, 4e3)}`)
  }));
  const suggestions = [];
  for (let i = 0; i < tokenized.length; i++) {
    const a = tokenized[i];
    const candidates = [];
    for (let j = 0; j < tokenized.length; j++) {
      if (i === j) continue;
      const b = tokenized[j];
      const score = jaccard(a.tokens, b.tokens);
      if (score < data.minScore) continue;
      if (a.body && a.body.includes(b.url)) continue;
      candidates.push({
        to_url: b.url,
        anchor_text: b.title,
        score
      });
    }
    candidates.sort((x, y) => y.score - x.score);
    for (const c of candidates.slice(0, data.perPage)) {
      suggestions.push({
        from_url: a.url,
        to_url: c.to_url,
        anchor_text: c.anchor_text,
        score: Math.round(c.score * 1e3) / 1e3,
        reason: `Topic overlap (Jaccard ${(c.score * 100).toFixed(1)}%)`
      });
    }
  }
  if (!suggestions.length) return {
    ok: true,
    count: 0
  };
  const {
    error,
    count
  } = await sb().from("internal_link_suggestions").upsert(suggestions, {
    onConflict: "from_url,to_url",
    count: "exact"
  });
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    count: count ?? suggestions.length
  };
});
const listLinkSuggestions_createServerFn_handler = createServerRpc({
  id: "3db742c56eae54ce7923952b7facb873d1bd7dafa05dbe7c55db6409c5ef9e70",
  name: "listLinkSuggestions",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => listLinkSuggestions.__executeServer(opts));
const listLinkSuggestions = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["pending", "applied", "dismissed", "all"]).default("pending"),
  q: z.string().max(200).default(""),
  limit: z.number().int().min(10).max(500).default(100)
}).parse(d ?? {})).handler(listLinkSuggestions_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("internal_link_suggestions").select("id, from_url, to_url, anchor_text, score, reason, status, created_at").order("score", {
    ascending: false
  }).limit(data.limit);
  if (data.status !== "all") q = q.eq("status", data.status);
  if (data.q) q = q.or(`from_url.ilike.%${data.q}%,to_url.ilike.%${data.q}%,anchor_text.ilike.%${data.q}%`);
  const {
    data: rows
  } = await q;
  return {
    rows: rows || []
  };
});
const updateLinkSuggestionStatus_createServerFn_handler = createServerRpc({
  id: "cf2b6276ee034a7c3b59050dfd297c16caf07f0096f5ff8f5701c01fbe09b7e2",
  name: "updateLinkSuggestionStatus",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => updateLinkSuggestionStatus.__executeServer(opts));
const updateLinkSuggestionStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  status: z.enum(["pending", "applied", "dismissed"])
}).parse(d)).handler(updateLinkSuggestionStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("internal_link_suggestions").update({
    status: data.status,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).in("id", data.ids);
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true,
    count: data.ids.length
  };
});
const applyLinkSuggestion_createServerFn_handler = createServerRpc({
  id: "ce8f67d5d07510af79a3c3f6bf73d90e78a639da2b8f0151e7b8bb372215c2ca",
  name: "applyLinkSuggestion",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => applyLinkSuggestion.__executeServer(opts));
const applyLinkSuggestion = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(applyLinkSuggestion_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: sug
  } = await sb().from("internal_link_suggestions").select("from_url, to_url, anchor_text").eq("id", data.id).maybeSingle();
  if (!sug) return {
    ok: false,
    error: "Suggestion not found"
  };
  const {
    data: page
  } = await sb().from("content_pages").select("id, body_markdown").eq("url_path", sug.from_url).maybeSingle();
  if (!page) return {
    ok: false,
    error: "From-page not found"
  };
  if ((page.body_markdown || "").includes(sug.to_url)) {
    await sb().from("internal_link_suggestions").update({
      status: "applied",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", data.id);
    return {
      ok: true,
      alreadyLinked: true
    };
  }
  const anchor = sug.anchor_text || sug.to_url;
  const linkLine = `

Related: [${anchor}](${sug.to_url})`;
  const newBody = (page.body_markdown || "") + linkLine;
  const {
    error: uErr
  } = await sb().from("content_pages").update({
    body_markdown: newBody,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", page.id);
  if (uErr) return {
    ok: false,
    error: uErr.message
  };
  await sb().from("internal_link_suggestions").update({
    status: "applied",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.id);
  return {
    ok: true
  };
});
const applyLinkSuggestionsBulk_createServerFn_handler = createServerRpc({
  id: "7e290d83e150fa34d3041f674f34af64f0462dee6613c76c7c3f54748d706a2d",
  name: "applyLinkSuggestionsBulk",
  filename: "src/server/admin-seo-tools.functions.ts"
}, (opts) => applyLinkSuggestionsBulk.__executeServer(opts));
const applyLinkSuggestionsBulk = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(2500)
}).parse(d)).handler(applyLinkSuggestionsBulk_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const client = sb();
  const {
    data: sugs
  } = await client.from("internal_link_suggestions").select("id, from_url, to_url, anchor_text, status").in("id", data.ids);
  if (!sugs?.length) return {
    ok: false,
    error: "No suggestions found"
  };
  const byPage = /* @__PURE__ */ new Map();
  for (const s of sugs) {
    if (!byPage.has(s.from_url)) byPage.set(s.from_url, []);
    byPage.get(s.from_url).push(s);
  }
  let applied = 0, skipped = 0, failed = 0;
  const appliedIds = [];
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  for (const [fromUrl, items] of byPage) {
    const {
      data: page
    } = await client.from("content_pages").select("id, body_markdown").eq("url_path", fromUrl).maybeSingle();
    if (!page) {
      failed += items.length;
      continue;
    }
    let body = page.body_markdown || "";
    for (const s of items) {
      if (body.includes(s.to_url)) {
        skipped++;
        appliedIds.push(s.id);
        continue;
      }
      const anchor = s.anchor_text || s.to_url;
      body += `

Related: [${anchor}](${s.to_url})`;
      applied++;
      appliedIds.push(s.id);
    }
    const {
      error: uErr
    } = await client.from("content_pages").update({
      body_markdown: body,
      updated_at: nowIso
    }).eq("id", page.id);
    if (uErr) {
      failed += items.length;
      continue;
    }
  }
  if (appliedIds.length) {
    await client.from("internal_link_suggestions").update({
      status: "applied",
      updated_at: nowIso
    }).in("id", appliedIds);
  }
  return {
    ok: true,
    applied,
    skipped,
    failed,
    total: sugs.length
  };
});
export {
  applyLinkSuggestion_createServerFn_handler,
  applyLinkSuggestionsBulk_createServerFn_handler,
  compareCompetitorToPage_createServerFn_handler,
  deleteCompetitor_createServerFn_handler,
  findKeywordOpportunities_createServerFn_handler,
  generateLinkSuggestions_createServerFn_handler,
  getKeywordStats_createServerFn_handler,
  importGscQueries_createServerFn_handler,
  listCompetitorPages_createServerFn_handler,
  listLinkSuggestions_createServerFn_handler,
  scrapeCompetitorUrl_createServerFn_handler,
  updateLinkSuggestionStatus_createServerFn_handler
};
