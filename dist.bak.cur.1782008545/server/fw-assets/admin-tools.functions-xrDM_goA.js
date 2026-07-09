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
const ISSUE_KINDS = ["thin", "empty", "missing_meta", "title_is_slug"];
const listSeoIssues_createServerFn_handler = createServerRpc({
  id: "fc02a41f5ec37438ca69db0567d5ed6f96222b6b644e33140bf345903f39e4e4",
  name: "listSeoIssues",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => listSeoIssues.__executeServer(opts));
const listSeoIssues = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  kind: z.enum(ISSUE_KINDS),
  limit: z.number().int().min(1).max(500).default(100)
}).parse(d)).handler(listSeoIssues_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = supabaseAdmin.from("content_pages").select("id, url_path, title, template_type, body_markdown, seo_description, updated_at, slug, status").eq("status", "published").like("url_path", "/p/%").order("updated_at", {
    ascending: false
  }).limit(500);
  const {
    data: rows
  } = await q;
  const mapped = (rows || []).map((r) => {
    const words = (r.body_markdown || "").split(/\s+/).filter(Boolean).length;
    return {
      id: r.id,
      url_path: r.url_path,
      title: r.title,
      template_type: r.template_type,
      words,
      has_meta: !!r.seo_description,
      updated_at: r.updated_at
    };
  });
  let filtered = mapped;
  const slugFromPath = (p) => (p || "").replace(/^\/p\//, "").replace(/-/g, " ").trim().toLowerCase();
  const titleEqualsSlug = (r) => {
    const t = (r.title || "").trim().toLowerCase();
    return !!t && t === slugFromPath(r.url_path);
  };
  if (data.kind === "thin") filtered = mapped.filter((r) => r.words > 0 && r.words < 500);
  else if (data.kind === "empty") filtered = mapped.filter((r) => r.words === 0);
  else if (data.kind === "missing_meta") filtered = mapped.filter((r) => !r.has_meta);
  else if (data.kind === "title_is_slug") filtered = mapped.filter(titleEqualsSlug);
  return {
    rows: filtered.slice(0, data.limit)
  };
});
const listLeads_createServerFn_handler = createServerRpc({
  id: "165714cf7e1003bb06d266765590a7b3c3922ded0d88c53e75de27700059bca4",
  name: "listLeads",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => listLeads.__executeServer(opts));
const listLeads = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["all", "new", "contacted", "closed"]).default("all"),
  limit: z.number().int().min(1).max(500).default(100)
}).parse(d ?? {})).handler(listLeads_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = supabaseAdmin.from("provider_leads").select("*").order("created_at", {
    ascending: false
  }).limit(data.limit);
  if (data.status !== "all") q = q.eq("status", data.status);
  const {
    data: rows
  } = await q;
  return {
    rows: rows || []
  };
});
const updateLeadStatus_createServerFn_handler = createServerRpc({
  id: "1bc5e7a88df293520aa9f613a33b0ec55e8d9947f55613bf63763e5d2567e093",
  name: "updateLeadStatus",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => updateLeadStatus.__executeServer(opts));
const updateLeadStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "closed"])
}).parse(d)).handler(updateLeadStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await supabaseAdmin.from("provider_leads").update({
    status: data.status
  }).eq("id", data.id);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
function computePageScore(r) {
  const body = r.body_markdown || "";
  const words = body.split(/\s+/).filter(Boolean).length;
  const titleLen = (r.seo_title || "").length;
  const descLen = (r.seo_description || "").length;
  const fk = String(r.focus_keyword || "").trim().toLowerCase();
  const internal = (body.match(/\]\(\/[^)]+\)/g) || []).length;
  const hasH1 = !!(r.title && String(r.title).trim());
  const hasHero = !!(r.hero_image_url && String(r.hero_image_url).trim());
  let s = 0;
  if (titleLen >= 50 && titleLen <= 60) s += 15;
  else if (titleLen >= 40 && titleLen <= 65) s += 8;
  if (descLen >= 140 && descLen <= 155) s += 15;
  else if (descLen >= 120 && descLen <= 165) s += 8;
  if (hasH1) s += 10;
  if (words >= 800) s += 20;
  else if (words >= 400) s += 10;
  if (internal >= 3) s += 10;
  else if (internal >= 1) s += 5;
  if (hasHero) s += 5;
  if (fk) {
    s += 5;
    if ((r.seo_title || "").toLowerCase().includes(fk)) s += 7;
    if ((r.seo_description || "").toLowerCase().includes(fk)) s += 7;
    if (body.slice(0, 800).toLowerCase().includes(fk)) s += 6;
  }
  return {
    words,
    titleLen,
    descLen,
    internal,
    hasHero,
    hasFk: !!fk,
    score: Math.min(100, s)
  };
}
const listContentPages_createServerFn_handler = createServerRpc({
  id: "6f854ea9a97838e7b6fa3eee3f72bdd86b1a844d15f2d149cf69b667a0ee59a3",
  name: "listContentPages",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => listContentPages.__executeServer(opts));
const listContentPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  q: z.string().max(200).default(""),
  status: z.enum(["all", "published", "pending", "draft", "scraped"]).default("all"),
  template: z.string().max(80).default(""),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(1e3).default(50)
}).parse(d ?? {})).handler(listContentPages_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let base = supabaseAdmin.from("content_pages").select("id, url_path, title, template_type, status, body_markdown, updated_at, seo_title, seo_description, focus_keyword, hero_image_url", {
    count: "exact"
  }).like("url_path", "/p/%");
  if (data.status !== "all") base = base.eq("status", data.status);
  if (data.template) base = base.eq("template_type", data.template);
  if (data.q) base = base.or(`url_path.ilike.%${data.q}%,title.ilike.%${data.q}%`);
  const from = (data.page - 1) * data.pageSize;
  const to = from + data.pageSize - 1;
  const {
    data: rows,
    count
  } = await base.order("updated_at", {
    ascending: false
  }).range(from, to);
  const mapped = (rows || []).map((r) => {
    const m = computePageScore(r);
    return {
      id: r.id,
      url_path: r.url_path,
      title: r.title,
      template_type: r.template_type,
      status: r.status,
      words: m.words,
      updated_at: r.updated_at,
      seo_title_len: m.titleLen,
      seo_desc_len: m.descLen,
      has_keyword: m.hasFk,
      has_hero: m.hasHero,
      internal_links: m.internal,
      score: m.score
    };
  });
  return {
    rows: mapped,
    total: count || 0
  };
});
const bulkUpdateContentPages_createServerFn_handler = createServerRpc({
  id: "e8142dacd605cc6d45e8796883a52e6e0c95fd4c5c4c3b8e2bee1bfe7a5ebaa1",
  name: "bulkUpdateContentPages",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => bulkUpdateContentPages.__executeServer(opts));
const bulkUpdateContentPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(["publish", "unpublish", "delete"])
}).parse(d)).handler(bulkUpdateContentPages_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  if (data.action === "delete") {
    const {
      error: error2
    } = await supabaseAdmin.from("content_pages").delete().in("id", data.ids);
    return error2 ? {
      ok: false,
      error: error2.message
    } : {
      ok: true,
      count: data.ids.length,
      skipped: 0,
      skippedSlugs: []
    };
  }
  if (data.action === "publish") {
    const MIN_WORDS = 300;
    const {
      data: rows,
      error: fetchErr
    } = await supabaseAdmin.from("content_pages").select("id, slug, body_markdown").in("id", data.ids);
    if (fetchErr) return {
      ok: false,
      error: fetchErr.message
    };
    const eligible = [];
    const skipped = [];
    for (const r of rows || []) {
      const wc = String(r.body_markdown || "").split(/\s+/).filter(Boolean).length;
      if (wc >= MIN_WORDS) eligible.push(r.id);
      else skipped.push(r.slug || r.id);
    }
    if (eligible.length === 0) {
      return {
        ok: true,
        count: 0,
        skipped: skipped.length,
        skippedSlugs: skipped,
        reason: `All selected pages have fewer than ${MIN_WORDS} words and were kept as draft.`
      };
    }
    const {
      error: error2
    } = await supabaseAdmin.from("content_pages").update({
      status: "published",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).in("id", eligible);
    if (error2) return {
      ok: false,
      error: error2.message
    };
    return {
      ok: true,
      count: eligible.length,
      skipped: skipped.length,
      skippedSlugs: skipped
    };
  }
  const {
    error
  } = await supabaseAdmin.from("content_pages").update({
    status: "draft",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).in("id", data.ids);
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true,
    count: data.ids.length,
    skipped: 0,
    skippedSlugs: []
  };
});
const getIndexingStats_createServerFn_handler = createServerRpc({
  id: "8604f1e01566d19935905d0bad5929550c0caaf1aea7fe528d4b409785da1cf5",
  name: "getIndexingStats",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => getIndexingStats.__executeServer(opts));
const getIndexingStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getIndexingStats_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  const day = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
  const [{
    count: totalPub
  }, {
    data: tpl
  }, {
    data: r404
  }, {
    count: unres
  }, {
    count: recent
  }] = await Promise.all([sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).eq("status", "published").like("url_path", "/p/%"), sb.from("content_pages").select("template_type, status").eq("status", "published").like("url_path", "/p/%").limit(5e3), sb.from("content_404_log").select("id, url_path, hit_count, last_seen_at").is("resolved_at", null).order("hit_count", {
    ascending: false
  }).limit(20), sb.from("content_404_log").select("*", {
    count: "exact",
    head: true
  }).is("resolved_at", null), sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).eq("status", "published").like("url_path", "/p/%").gte("updated_at", day)]);
  const tplMap = /* @__PURE__ */ new Map();
  for (const r of tpl || []) {
    const k = r.template_type || "(none)";
    tplMap.set(k, (tplMap.get(k) || 0) + 1);
  }
  return {
    totalPublished: totalPub || 0,
    byTemplate: Array.from(tplMap.entries()).map(([template_type, count]) => ({
      template_type,
      count
    })).sort((a, b) => b.count - a.count),
    recent404s: r404 || [],
    unresolved404s: unres || 0,
    recentlyPublished: recent || 0
  };
});
const SEO_SYSTEM = `
You write SEO + brand content for Pool Rental Near Me (PRNM), a marketplace where homeowners rent out private pools by the hour.
Differentiators (mention naturally): 10% flat host fee (vs Swimply's 15%+), $2M liability insurance included.
Voice: confident, friendly, host-first. Short paragraphs. Real, useful copy. No filler. Sentence case headings. No em dashes.
Format: Markdown only. Use ## and ### headings. Include 3-5 internal links from this set where relevant:
  /s, /p/hosting, /p/all-locations, /p/earnings-calculator, /p/how-it-works
List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details
Always end with a short CTA paragraph linking to the List Your Pool URL or /s.
Return your answer ONLY by calling the write_page tool.
`.trim();
const SEO_TOOL = {
  type: "function",
  function: {
    name: "write_page",
    description: "Return the repaired page content.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Human-readable H1 title (case-correct, no slug-style)"
        },
        seo_title: {
          type: "string",
          description: "<=60 chars"
        },
        seo_description: {
          type: "string",
          description: "<=155 chars, compelling meta description"
        },
        body_markdown: {
          type: "string",
          description: "Full markdown body, 800-1200 words, no frontmatter"
        }
      },
      required: ["title", "seo_title", "seo_description", "body_markdown"],
      additionalProperties: false
    }
  }
};
function humanizeSlug(slug) {
  return slug.replace(/^\/p\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
async function runSeoFix(pageId, mode) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return {
    ok: false,
    error: "LOVABLE_API_KEY not configured"
  };
  const {
    data: page,
    error: pErr
  } = await supabaseAdmin.from("content_pages").select("id, url_path, slug, title, seo_title, seo_description, body_markdown, template_type, category").eq("id", pageId).maybeSingle();
  if (pErr || !page) return {
    ok: false,
    error: "Page not found"
  };
  const topic = humanizeSlug(page.url_path || page.slug || "");
  const currentBody = page.body_markdown || "";
  const wordCount = currentBody.split(/\s+/).filter(Boolean).length;
  let userPrompt = "";
  if (mode === "meta_only" || mode === "title_only") {
    userPrompt = `Generate ONLY a clean human-readable title and SEO title/description for this existing page.

URL: ${page.url_path}
Topic (derived from slug): ${topic}
Existing title: ${page.title || "(none)"}
Existing body excerpt (first 800 chars): ${currentBody.slice(0, 800)}

Produce:
- title: proper sentence-case H1 (NOT the slug)
- seo_title: <=60 chars, includes primary keyword
- seo_description: <=155 chars, compelling and specific

For body_markdown, return the EXISTING body unchanged.`;
  } else {
    const reason = wordCount === 0 ? "Page body is EMPTY — write fresh content." : wordCount < 500 ? `Page body is THIN (${wordCount} words) — expand to 800-1200 words while keeping any existing facts.` : "Improve the existing page.";
    userPrompt = `Repair this content page.

URL: ${page.url_path}
Topic (derived from slug): ${topic}
Existing title: ${page.title || "(none)"}
Issue: ${reason}
${currentBody ? `Existing body to expand/improve:
---
${currentBody.slice(0, 3e3)}
---` : ""}

Length: 800-1200 words. Use ## sections and ### sub-points. Strong opening, no fluff.`;
  }
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{
        role: "system",
        content: SEO_SYSTEM
      }, {
        role: "user",
        content: userPrompt
      }],
      tools: [SEO_TOOL],
      tool_choice: {
        type: "function",
        function: {
          name: "write_page"
        }
      }
    })
  });
  if (resp.status === 402) return {
    ok: false,
    error: "AI credits exhausted"
  };
  if (resp.status === 429) return {
    ok: false,
    error: "Rate limited — slow down"
  };
  if (!resp.ok) return {
    ok: false,
    error: `AI gateway ${resp.status}: ${(await resp.text()).slice(0, 200)}`
  };
  const json = await resp.json();
  const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) return {
    ok: false,
    error: "AI returned no tool call"
  };
  const gen = JSON.parse(tc.function.arguments);
  const update = {
    title: gen.title || page.title,
    seo_title: (gen.seo_title || page.seo_title || gen.title || "").slice(0, 70),
    seo_description: (gen.seo_description || page.seo_description || "").slice(0, 160),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (mode === "full" && gen.body_markdown && gen.body_markdown.length > 300) {
    update.body_markdown = gen.body_markdown;
    if (gen.body_markdown.length >= 1e3) {
      update.status = "published";
      update.in_sitemap = true;
    }
  }
  const {
    error: uErr
  } = await supabaseAdmin.from("content_pages").update(update).eq("id", pageId);
  if (uErr) return {
    ok: false,
    error: uErr.message
  };
  return {
    ok: true,
    newWords: (update.body_markdown || currentBody).split(/\s+/).filter(Boolean).length,
    newTitle: update.title
  };
}
const aiFixContentPage_createServerFn_handler = createServerRpc({
  id: "8c6d7a29603e7ebdfeebdb0d73a7284fa51d359c5b8325f7ea010c3465ad4186",
  name: "aiFixContentPage",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => aiFixContentPage.__executeServer(opts));
const aiFixContentPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  mode: z.enum(["full", "meta_only", "title_only"]).default("full")
}).parse(d)).handler(aiFixContentPage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  return runSeoFix(data.id, data.mode);
});
const enqueueSeoFixJobs_createServerFn_handler = createServerRpc({
  id: "b6c8d1cca1795d3b5f10935dfc421e26c998b4d8ffbf96b5fe08752fe4b218e2",
  name: "enqueueSeoFixJobs",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => enqueueSeoFixJobs.__executeServer(opts));
const enqueueSeoFixJobs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  pageIds: z.array(z.string().uuid()).min(1).max(500),
  mode: z.enum(["full", "meta_only", "title_only"]).default("full")
}).parse(d)).handler(enqueueSeoFixJobs_createServerFn_handler, async ({
  data,
  context
}) => {
  const userId = context.userId;
  await assertAdmin(userId);
  const sb = supabaseAdmin;
  const batchId = crypto.randomUUID();
  const rows = data.pageIds.map((pid) => ({
    page_id: pid,
    mode: data.mode,
    status: "queued",
    batch_id: batchId,
    enqueued_by: userId
  }));
  const {
    error
  } = await sb.from("seo_fix_jobs").insert(rows);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    batchId,
    count: rows.length
  };
});
const getSeoJobStatus_createServerFn_handler = createServerRpc({
  id: "615bebc119f42ace95a0f884be2e85d9b7950d435b4c7fcb93ab59d2ee71564e",
  name: "getSeoJobStatus",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => getSeoJobStatus.__executeServer(opts));
const getSeoJobStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  batchId: z.string().uuid().optional(),
  pageIds: z.array(z.string().uuid()).max(500).optional()
}).parse(d ?? {})).handler(getSeoJobStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  let q = sb.from("seo_fix_jobs").select("id, page_id, mode, status, attempts, result, error, batch_id, created_at, finished_at").order("created_at", {
    ascending: false
  }).limit(500);
  if (data.batchId) q = q.eq("batch_id", data.batchId);
  if (data.pageIds && data.pageIds.length) q = q.in("page_id", data.pageIds);
  const {
    data: jobs
  } = await q;
  const summary = {
    queued: 0,
    processing: 0,
    done: 0,
    failed: 0,
    cancelled: 0
  };
  const seen = /* @__PURE__ */ new Set();
  const latest = [];
  for (const j of jobs || []) {
    if (seen.has(j.page_id)) continue;
    seen.add(j.page_id);
    latest.push(j);
    summary[j.status] = (summary[j.status] || 0) + 1;
  }
  return {
    jobs: latest,
    summary
  };
});
const processSeoFixQueue_createServerFn_handler = createServerRpc({
  id: "3a9c3e11425028ed3fa4afa4be80282ac22267cf119a454c5f7a673576a51756",
  name: "processSeoFixQueue",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => processSeoFixQueue.__executeServer(opts));
const processSeoFixQueue = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  batchId: z.string().uuid().optional(),
  max: z.number().int().min(1).max(25).default(10)
}).parse(d ?? {})).handler(processSeoFixQueue_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  let q = sb.from("seo_fix_jobs").select("id, page_id, mode, attempts, max_attempts, batch_id").eq("status", "queued").order("created_at", {
    ascending: true
  }).limit(data.max);
  if (data.batchId) q = q.eq("batch_id", data.batchId);
  const {
    data: jobs
  } = await q;
  const list = jobs || [];
  const results = [];
  for (const job of list) {
    const {
      data: claimed
    } = await sb.from("seo_fix_jobs").update({
      status: "processing",
      started_at: (/* @__PURE__ */ new Date()).toISOString(),
      attempts: job.attempts + 1
    }).eq("id", job.id).eq("status", "queued").select("id").maybeSingle();
    if (!claimed) continue;
    try {
      const res = await runSeoFix(job.page_id, job.mode);
      if (res.ok) {
        await sb.from("seo_fix_jobs").update({
          status: "done",
          result: res,
          finished_at: (/* @__PURE__ */ new Date()).toISOString(),
          error: null
        }).eq("id", job.id);
        results.push({
          id: job.id,
          ok: true
        });
      } else {
        const giveUp = job.attempts + 1 >= job.max_attempts;
        await sb.from("seo_fix_jobs").update({
          status: giveUp ? "failed" : "queued",
          error: res.error,
          finished_at: giveUp ? (/* @__PURE__ */ new Date()).toISOString() : null
        }).eq("id", job.id);
        results.push({
          id: job.id,
          ok: false,
          error: res.error
        });
      }
    } catch (e) {
      const giveUp = job.attempts + 1 >= job.max_attempts;
      await sb.from("seo_fix_jobs").update({
        status: giveUp ? "failed" : "queued",
        error: e?.message || "Worker exception",
        finished_at: giveUp ? (/* @__PURE__ */ new Date()).toISOString() : null
      }).eq("id", job.id);
      results.push({
        id: job.id,
        ok: false,
        error: e?.message
      });
    }
  }
  return {
    processed: results.length,
    results
  };
});
const cancelQueuedSeoJobs_createServerFn_handler = createServerRpc({
  id: "2ebcc13773815515ed8a0d1d37a7327d567434b61fab75f94af6de30d24e22b5",
  name: "cancelQueuedSeoJobs",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => cancelQueuedSeoJobs.__executeServer(opts));
const cancelQueuedSeoJobs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  batchId: z.string().uuid()
}).parse(d)).handler(cancelQueuedSeoJobs_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error,
    count
  } = await supabaseAdmin.from("seo_fix_jobs").update({
    status: "cancelled",
    finished_at: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    count: "exact"
  }).eq("batch_id", data.batchId).eq("status", "queued");
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    cancelled: count || 0
  };
});
const listSeoBatches_createServerFn_handler = createServerRpc({
  id: "b8fbb509d83b05d3892500a0bde0dfa83cf33106f8642cd0a57828fbcbb76a5c",
  name: "listSeoBatches",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => listSeoBatches.__executeServer(opts));
const listSeoBatches = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  sinceHours: z.number().int().min(1).max(720).default(72),
  onlyActive: z.boolean().default(false)
}).parse(d ?? {})).handler(listSeoBatches_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  const since = new Date(Date.now() - data.sinceHours * 36e5).toISOString();
  const {
    data: rows
  } = await sb.from("seo_fix_jobs").select("batch_id, status, mode, created_at, finished_at, enqueued_by").gte("created_at", since).not("batch_id", "is", null).order("created_at", {
    ascending: false
  }).limit(5e3);
  const map = /* @__PURE__ */ new Map();
  for (const r of rows || []) {
    let b = map.get(r.batch_id);
    if (!b) {
      b = {
        batchId: r.batch_id,
        total: 0,
        queued: 0,
        processing: 0,
        done: 0,
        failed: 0,
        cancelled: 0,
        mode: r.mode,
        startedAt: r.created_at,
        finishedAt: r.finished_at,
        enqueuedBy: r.enqueued_by
      };
      map.set(r.batch_id, b);
    }
    b.total += 1;
    b[r.status] = (b[r.status] || 0) + 1;
    if (r.created_at < b.startedAt) b.startedAt = r.created_at;
    if (r.finished_at && (!b.finishedAt || r.finished_at > b.finishedAt)) b.finishedAt = r.finished_at;
    if (b.mode !== "mixed" && b.mode !== r.mode) b.mode = "mixed";
  }
  let batches = Array.from(map.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  if (data.onlyActive) batches = batches.filter((b) => b.queued + b.processing > 0);
  return {
    batches
  };
});
const getSeoBatchDetails_createServerFn_handler = createServerRpc({
  id: "4f826cd9a13b0c4c2d3026951d8805e0833343c7e802a3e128bc1ec8d1478260",
  name: "getSeoBatchDetails",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => getSeoBatchDetails.__executeServer(opts));
const getSeoBatchDetails = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  batchId: z.string().uuid()
}).parse(d)).handler(getSeoBatchDetails_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  const {
    data: rows
  } = await sb.from("seo_fix_jobs").select("id, page_id, mode, status, attempts, error, created_at, finished_at, result").eq("batch_id", data.batchId).order("created_at", {
    ascending: true
  }).limit(1e3);
  const list = rows || [];
  const ids = Array.from(new Set(list.map((r) => r.page_id)));
  let pages = /* @__PURE__ */ new Map();
  if (ids.length) {
    const {
      data: pgs
    } = await sb.from("content_pages").select("id, url_path, title").in("id", ids);
    pages = new Map((pgs || []).map((p) => [p.id, {
      url_path: p.url_path,
      title: p.title
    }]));
  }
  return {
    jobs: list.map((j) => ({
      ...j,
      url_path: pages.get(j.page_id)?.url_path ?? null,
      title: pages.get(j.page_id)?.title ?? null
    }))
  };
});
const PAGE_SELECT = "id, url_path, slug, title, seo_title, seo_description, og_title, og_description, focus_keyword, canonical_override, hero_image_url, body_markdown, template_type, status, updated_at, created_at";
const getContentPage_createServerFn_handler = createServerRpc({
  id: "b9ca57870a2438c6117cca538d93f10c1257c32a22171da0cddc10494dd7c96e",
  name: "getContentPage",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => getContentPage.__executeServer(opts));
const getContentPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(getContentPage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: row,
    error
  } = await supabaseAdmin.from("content_pages").select(PAGE_SELECT).eq("id", data.id).maybeSingle();
  if (error) return {
    ok: false,
    error: error.message
  };
  if (!row) return {
    ok: false,
    error: "Not found"
  };
  return {
    ok: true,
    page: row
  };
});
const updateContentPage_createServerFn_handler = createServerRpc({
  id: "16b0c0cb551c8dcedd95980594d532a00b189cb4338f3c3952a6901284fef8c0",
  name: "updateContentPage",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => updateContentPage.__executeServer(opts));
const updateContentPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  title: z.string().max(300).optional(),
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(400).optional(),
  og_title: z.string().max(200).optional().nullable(),
  og_description: z.string().max(400).optional().nullable(),
  focus_keyword: z.string().max(120).optional().nullable(),
  canonical_override: z.string().max(500).optional().nullable(),
  hero_image_url: z.string().max(2e3).optional().nullable(),
  body_markdown: z.string().max(2e5).optional(),
  status: z.enum(["draft", "pending", "published"]).optional()
}).parse(d)).handler(updateContentPage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    id,
    ...rest
  } = data;
  const update = {
    ...rest,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  for (const k of ["og_title", "og_description", "focus_keyword", "canonical_override", "hero_image_url"]) {
    if (typeof update[k] === "string" && update[k].trim() === "") update[k] = null;
  }
  if (update.status === "published") update.in_sitemap = true;
  const {
    error
  } = await supabaseAdmin.from("content_pages").update(update).eq("id", id);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
const appendAiContentToPage_createServerFn_handler = createServerRpc({
  id: "dc5b555f2796ebba8fac6a32a735f7032ce506c28749359f63b2f8dd43957ae4",
  name: "appendAiContentToPage",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => appendAiContentToPage.__executeServer(opts));
const appendAiContentToPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  prompt: z.string().min(3).max(2e3),
  append: z.boolean().default(true)
}).parse(d)).handler(appendAiContentToPage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return {
    ok: false,
    error: "LOVABLE_API_KEY not configured"
  };
  const {
    data: page
  } = await supabaseAdmin.from("content_pages").select("id, url_path, title, body_markdown").eq("id", data.id).maybeSingle();
  if (!page) return {
    ok: false,
    error: "Page not found"
  };
  const sys = `${SEO_SYSTEM}

You are ADDING a new section to an existing page. Match the page topic and existing tone. Output Markdown only, starting with a ## heading. 200-600 words. No frontmatter, no preamble.`;
  const user = `Page URL: ${page.url_path}
Page title: ${page.title || "(none)"}
Existing body excerpt (first 1500 chars):
---
${(page.body_markdown || "").slice(0, 1500)}
---

User request for the new section:
${data.prompt}

Write the new section now.`;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{
        role: "system",
        content: sys
      }, {
        role: "user",
        content: user
      }]
    })
  });
  if (resp.status === 402) return {
    ok: false,
    error: "AI credits exhausted"
  };
  if (resp.status === 429) return {
    ok: false,
    error: "Rate limited — try again shortly"
  };
  if (!resp.ok) return {
    ok: false,
    error: `AI gateway ${resp.status}`
  };
  const json = await resp.json();
  const added = (json?.choices?.[0]?.message?.content || "").trim();
  if (!added) return {
    ok: false,
    error: "AI returned empty content"
  };
  const newBody = data.append ? `${(page.body_markdown || "").trimEnd()}

${added}
` : added;
  const {
    error: uErr
  } = await supabaseAdmin.from("content_pages").update({
    body_markdown: newBody,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.id);
  if (uErr) return {
    ok: false,
    error: uErr.message
  };
  return {
    ok: true,
    body_markdown: newBody,
    added
  };
});
const BRAND_VOICE = `
Brand voice rules (apply to ALL output):
- Sentence case headings (no Title Case).
- Second person ("you", "your pool").
- No em dashes; use commas, periods, or restructure.
- Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
- Banned phrases: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "proven track record", "Pool Rental Near Me is the leading".
- Numbers under 10 spelled out, 10+ as numerals.
- Dollar amounts as $X/hour, not "$X per hour".
- Real numbers only. Typical hourly rates $40-150/hr. Never invent statistics.
- Differentiators (mention naturally where relevant): 10% flat host fee (vs Swimply's 15%+), $2M liability insurance included, 5,100+ city pages indexed.
- Internal links to use where relevant: /s, /p/hosting, /p/all-locations, /p/earnings-calculator, /p/how-it-works
- List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details
`.trim();
async function callAi(opts) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return {
    ok: false,
    error: "LOVABLE_API_KEY not configured"
  };
  const body = {
    model: opts.model ?? "google/gemini-2.5-pro",
    messages: [{
      role: "system",
      content: opts.system
    }, {
      role: "user",
      content: opts.user
    }]
  };
  if (opts.json) body.response_format = {
    type: "json_object"
  };
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (resp.status === 402) return {
    ok: false,
    error: "AI credits exhausted"
  };
  if (resp.status === 429) return {
    ok: false,
    error: "Rate limited — try again shortly"
  };
  if (!resp.ok) return {
    ok: false,
    error: `AI gateway ${resp.status}`
  };
  const json = await resp.json();
  const content = (json?.choices?.[0]?.message?.content || "").trim();
  if (!content) return {
    ok: false,
    error: "AI returned empty content"
  };
  return {
    ok: true,
    content
  };
}
async function loadPageForAi(id) {
  const {
    data: page
  } = await supabaseAdmin.from("content_pages").select("id, url_path, slug, title, seo_title, seo_description, focus_keyword, template_type, body_markdown").eq("id", id).maybeSingle();
  return page;
}
function pageContext(p) {
  return `Page URL: ${p.url_path ?? "(none)"}
Slug: ${p.slug ?? "(none)"}
Template: ${p.template_type ?? "(generic)"}
H1 title: ${p.title ?? "(none)"}
Current SEO title: ${p.seo_title ?? "(none)"}
Current SEO description: ${p.seo_description ?? "(none)"}
Focus keyword: ${p.focus_keyword ?? "(none)"}`;
}
const generateFullPageContent_createServerFn_handler = createServerRpc({
  id: "6de3a256c0ef25fb47fd514317501ba6d4b1efd9bf05fe9e059082797240d557",
  name: "generateFullPageContent",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => generateFullPageContent.__executeServer(opts));
const generateFullPageContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(generateFullPageContent_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const p = await loadPageForAi(data.id);
  if (!p) return {
    ok: false,
    error: "Page not found"
  };
  const sys = `You write SEO + brand content for Pool Rental Near Me (PRNM).
${BRAND_VOICE}
Output ONLY Markdown body (no frontmatter, no preamble, no closing remark). Use ## and ### headings. 800-1200 words. Include 3-5 internal links from the allowed set. End with a short CTA paragraph linking to the List Your Pool URL or /s.`;
  const user = `Write the FULL page body from scratch for this page.

${pageContext(p)}

Structure suggestions by template:
- host_acq_city / host_advocacy_state: intro, why host here, local demand signals, regulations summary, earnings range, getting started CTA.
- event_guide: intro, what to expect, planning checklist, local venue tips, FAQ, CTA.
- resource: intro, problem, step-by-step, common mistakes, FAQ, CTA.
- generic: intro, 3-5 H2 sections relevant to the title, FAQ, CTA.`;
  const r = await callAi({
    system: sys,
    user
  });
  if (!r.ok) return r;
  return {
    ok: true,
    body_markdown: r.content
  };
});
const improvePageContent_createServerFn_handler = createServerRpc({
  id: "952b6d9105bdc31d5634eff7a384cb52b3adc77598a92392b3651e7bef8e4da5",
  name: "improvePageContent",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => improvePageContent.__executeServer(opts));
const improvePageContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(improvePageContent_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const p = await loadPageForAi(data.id);
  if (!p) return {
    ok: false,
    error: "Page not found"
  };
  if (!p.body_markdown || p.body_markdown.trim().length < 50) {
    return {
      ok: false,
      error: "Body is too short to improve. Use Generate full page instead."
    };
  }
  const sys = `You are an editor improving an existing PRNM content page.
${BRAND_VOICE}
Tasks:
1. Remove banned words and phrases. 2. Replace em dashes. 3. Tighten verbose sentences.
4. Convert any Title Case headings to sentence case. 5. Ensure focus keyword (if given) appears in the H1 area, first paragraph, and at least one ## heading.
6. Expand any section with fewer than 3 sentences. 7. Keep total length within 10% of original. 8. Preserve all existing internal links unless they are in the banned set.
Output ONLY the rewritten Markdown body. No preamble, no commentary, no diff markers.`;
  const user = `${pageContext(p)}

Current body:
---
${p.body_markdown}
---

Rewrite it now.`;
  const r = await callAi({
    system: sys,
    user
  });
  if (!r.ok) return r;
  return {
    ok: true,
    body_markdown: r.content
  };
});
const generateSeoMeta_createServerFn_handler = createServerRpc({
  id: "dce35cda167e7a9206ef18c1745df18e8007fc94feedcf95d9ef50fe59912b1c",
  name: "generateSeoMeta",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => generateSeoMeta.__executeServer(opts));
const generateSeoMeta = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(generateSeoMeta_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const p = await loadPageForAi(data.id);
  if (!p) return {
    ok: false,
    error: "Page not found"
  };
  const sys = `You write SEO + social metadata for PRNM.
${BRAND_VOICE}
Return ONLY a JSON object with these exact keys: seo_title, seo_description, og_title, og_description.
- seo_title: 50-60 chars, includes focus keyword if given.
- seo_description: 140-155 chars, compelling click-through copy.
- og_title: 40-60 chars, punchier social headline (can be different from seo_title).
- og_description: 100-150 chars, social-share friendly.`;
  const user = `${pageContext(p)}

First 1500 chars of body:
---
${(p.body_markdown ?? "").slice(0, 1500)}
---

Return the JSON now.`;
  const r = await callAi({
    system: sys,
    user,
    json: true
  });
  if (!r.ok) return r;
  try {
    const parsed = JSON.parse(r.content);
    const s = (k) => typeof parsed[k] === "string" ? parsed[k].trim() : "";
    const seo_title = s("seo_title");
    const seo_description = s("seo_description");
    const og_title = s("og_title") || seo_title;
    const og_description = s("og_description") || seo_description;
    if (!seo_title || !seo_description) return {
      ok: false,
      error: "AI returned incomplete metadata"
    };
    return {
      ok: true,
      seo_title,
      seo_description,
      og_title,
      og_description
    };
  } catch {
    return {
      ok: false,
      error: "AI returned invalid JSON"
    };
  }
});
const SECTION_PRESETS = [{
  key: "faq",
  label: "FAQ (5 questions)",
  prompt: "Write a 5-question FAQ section. Use ## FAQ as the heading and **bold** for each question. Tailor questions to this page's topic."
}, {
  key: "pricing_table",
  label: "Pricing table",
  prompt: "Add a pricing comparison section. Use a Markdown table with columns: Pool size, Typical hourly rate, Best for. Use realistic PRNM ranges ($40-150/hr)."
}, {
  key: "what_to_expect",
  label: "What to expect checklist",
  prompt: 'Add a "What to expect" section with a checklist of 6-8 items using `- [ ]` Markdown task list syntax, tailored to this page topic.'
}, {
  key: "landmarks",
  label: "Local landmarks (city pages)",
  prompt: "Add a 'Things to do nearby' section listing 5-7 well-known local landmarks, parks, or attractions for this city. Each as a bullet with a one-sentence note on why pool guests would care."
}, {
  key: "insurance",
  label: "Insurance & liability",
  prompt: "Add an 'Insurance and liability' section explaining PRNM's $2M liability coverage, what it covers, what it doesn't, and how it compares to Swimply."
}, {
  key: "host_tips",
  label: "Host tips & safety",
  prompt: "Add a 'Host tips and safety' section with 5 actionable tips a new pool host should follow before their first booking. Use a numbered list."
}, {
  key: "comparison",
  label: "PRNM vs Swimply",
  prompt: "Add a comparison section using a Markdown table with rows: Host fee, Liability insurance, Payout speed, Support, Listing approval time. Be factual and PRNM-favorable."
}, {
  key: "internal_links",
  label: "Related cities (auto)",
  prompt: "__INTERNAL_LINKS__"
}, {
  key: "testimonials",
  label: "Testimonials block",
  prompt: "Add a 'What hosts are saying' section with 3 short testimonial-style quotes (placeholder names like 'Sarah, host in [generic city]'). Mark clearly that they are placeholders so the admin can replace them."
}];
async function buildInternalLinksMarkdown(slug) {
  if (!slug) return "";
  try {
    const {
      data: nearby
    } = await supabaseAdmin.rpc("nearby_cities_by_distance", {
      _slug: slug,
      _limit: 6
    });
    const list2 = nearby ?? [];
    if (list2.length >= 3) {
      const items2 = list2.map((c) => `- [Pool rentals in ${c.out_name}, ${c.out_state_code}](/p/${c.out_slug})`).join("\n");
      return `## Nearby cities to explore

${items2}
`;
    }
  } catch {
  }
  const {
    data: rows
  } = await supabaseAdmin.from("content_pages").select("slug, title, url_path").eq("status", "published").like("url_path", "/p/%").neq("slug", slug).order("updated_at", {
    ascending: false
  }).limit(6);
  const list = rows ?? [];
  if (!list.length) return "";
  const items = list.map((r) => `- [${r.title ?? r.slug}](${r.url_path})`).join("\n");
  return `## Related guides

${items}
`;
}
const generateSectionPreset_createServerFn_handler = createServerRpc({
  id: "6068228523749141a6362364ba27648f58de6667f777a0b25f3cadc80e7ecfa4",
  name: "generateSectionPreset",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => generateSectionPreset.__executeServer(opts));
const generateSectionPreset = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  preset_key: z.string().min(1).max(50)
}).parse(d)).handler(generateSectionPreset_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const preset = SECTION_PRESETS.find((p2) => p2.key === data.preset_key);
  if (!preset) return {
    ok: false,
    error: "Unknown preset"
  };
  const p = await loadPageForAi(data.id);
  if (!p) return {
    ok: false,
    error: "Page not found"
  };
  if (preset.prompt === "__INTERNAL_LINKS__") {
    const md = await buildInternalLinksMarkdown(p.slug);
    if (!md) return {
      ok: false,
      error: "No related pages found to link to"
    };
    return {
      ok: true,
      markdown: md
    };
  }
  const sys = `You add a single new section to an existing PRNM page.
${BRAND_VOICE}
Output ONLY the Markdown for the new section. Start with a ## heading. 150-450 words. No preamble, no commentary, no closing remark.`;
  const user = `${pageContext(p)}

Existing body excerpt (first 1500 chars):
---
${(p.body_markdown ?? "").slice(0, 1500)}
---

Section to write:
${preset.prompt}`;
  const r = await callAi({
    system: sys,
    user
  });
  if (!r.ok) return r;
  return {
    ok: true,
    markdown: r.content
  };
});
const listSectionPresets_createServerFn_handler = createServerRpc({
  id: "b1f2572e4f0eb94cd91fc4ca3538d9903ff2d430b9c5de66ebdb6a802d31957a",
  name: "listSectionPresets",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => listSectionPresets.__executeServer(opts));
const listSectionPresets = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(listSectionPresets_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data
  } = await supabaseAdmin.from("admin_section_presets").select("id, label, prompt, sort_order, updated_at").order("sort_order", {
    ascending: true
  }).order("created_at", {
    ascending: true
  });
  return {
    rows: data ?? []
  };
});
const saveSectionPreset_createServerFn_handler = createServerRpc({
  id: "76b039cb4e7cd7eaf76edc19df2ee2939b7eff460c2dc5e510ca63daf66a0a47",
  name: "saveSectionPreset",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => saveSectionPreset.__executeServer(opts));
const saveSectionPreset = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(80),
  prompt: z.string().min(5).max(4e3),
  sort_order: z.number().int().min(0).max(9999).default(0)
}).parse(d)).handler(saveSectionPreset_createServerFn_handler, async ({
  data,
  context
}) => {
  const userId = context.userId;
  await assertAdmin(userId);
  if (data.id) {
    const {
      error: error2
    } = await supabaseAdmin.from("admin_section_presets").update({
      label: data.label,
      prompt: data.prompt,
      sort_order: data.sort_order,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", data.id);
    if (error2) return {
      ok: false,
      error: error2.message
    };
    return {
      ok: true,
      id: data.id
    };
  }
  const {
    data: row,
    error
  } = await supabaseAdmin.from("admin_section_presets").insert({
    label: data.label,
    prompt: data.prompt,
    sort_order: data.sort_order,
    created_by: userId
  }).select("id").single();
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    id: row.id
  };
});
const deleteSectionPreset_createServerFn_handler = createServerRpc({
  id: "56d900c7891fdc1b56cb3fc1a5f501dddd31cd460cdc4ee0804cb09210a34c3d",
  name: "deleteSectionPreset",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => deleteSectionPreset.__executeServer(opts));
const deleteSectionPreset = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteSectionPreset_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await supabaseAdmin.from("admin_section_presets").delete().eq("id", data.id);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
const generateCustomSection_createServerFn_handler = createServerRpc({
  id: "124c50cc4aef51a5c466b46248cb3e0a375bfcd00bf4d41451bccb427990adf3",
  name: "generateCustomSection",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => generateCustomSection.__executeServer(opts));
const generateCustomSection = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  preset_id: z.string().uuid()
}).parse(d)).handler(generateCustomSection_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: preset
  } = await supabaseAdmin.from("admin_section_presets").select("label, prompt").eq("id", data.preset_id).maybeSingle();
  if (!preset) return {
    ok: false,
    error: "Preset not found"
  };
  const p = await loadPageForAi(data.id);
  if (!p) return {
    ok: false,
    error: "Page not found"
  };
  const sys = `You add a single new section to an existing PRNM page.
${BRAND_VOICE}
Output ONLY the Markdown for the new section. Start with a ## heading. 150-450 words. No preamble, no commentary, no closing remark.`;
  const user = `${pageContext(p)}

Existing body excerpt (first 1500 chars):
---
${(p.body_markdown ?? "").slice(0, 1500)}
---

Section to write:
${preset.prompt}`;
  const r = await callAi({
    system: sys,
    user
  });
  if (!r.ok) return r;
  return {
    ok: true,
    markdown: r.content,
    label: preset.label
  };
});
const autoFixSeo_createServerFn_handler = createServerRpc({
  id: "d10a81f375ec19c033c2ef9462002cd90a5ac634c2afc8416dff4dde2c8073fe",
  name: "autoFixSeo",
  filename: "src/server/admin-tools.functions.ts"
}, (opts) => autoFixSeo.__executeServer(opts));
const autoFixSeo = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(autoFixSeo_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const p = await loadPageForAi(data.id);
  if (!p) return {
    ok: false,
    error: "Page not found"
  };
  const body = p.body_markdown ?? "";
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const internalLinks = (body.match(/\]\(\/[^)]+\)/g) ?? []).length;
  const needsBodyRewrite = wordCount < 800 || internalLinks < 3;
  const sys = `You are an SEO specialist for Pool Rental Near Me (PRNM).
${BRAND_VOICE}

Your job: produce a JSON object that makes EVERY SEO check pass for this page.

Required checks (you MUST satisfy all):
- focus_keyword: 2-5 word phrase, lowercase, naturally describes the page topic.
- seo_title: 50-60 characters, includes focus_keyword near the start.
- seo_description: 140-155 characters, includes focus_keyword, compelling click copy.
- og_title: 40-60 characters.
- og_description: 100-150 characters.
${needsBodyRewrite ? `- body_markdown: rewritten/expanded to 850-1100 words. MUST contain at least 4 markdown links to internal /p/ or /s or /l/ paths from the allowed list. Focus keyword MUST appear in the first paragraph and at least one ## heading. Sentence-case headings only. End with a CTA paragraph.` : `- body_markdown: keep as-is (return null).`}

Return ONLY a JSON object with these exact keys:
{ "focus_keyword": string, "seo_title": string, "seo_description": string, "og_title": string, "og_description": string, "body_markdown": string | null }`;
  const user = `${pageContext(p)}

Word count: ${wordCount}
Internal link count: ${internalLinks}

${needsBodyRewrite ? `Current body to rewrite/expand:
---
${body || "(empty)"}
---` : `(Body already meets length and link checks; return body_markdown: null.)`}

Return the JSON now.`;
  const r = await callAi({
    system: sys,
    user,
    json: true
  });
  if (!r.ok) return r;
  let parsed;
  try {
    parsed = JSON.parse(r.content);
  } catch {
    return {
      ok: false,
      error: "AI returned invalid JSON"
    };
  }
  const s = (k) => typeof parsed?.[k] === "string" ? parsed[k].trim() : "";
  const focus_keyword = s("focus_keyword").toLowerCase();
  const seo_title = s("seo_title");
  const seo_description = s("seo_description");
  const og_title = s("og_title") || seo_title;
  const og_description = s("og_description") || seo_description;
  const newBody = typeof parsed?.body_markdown === "string" && parsed.body_markdown.trim().length > 200 ? parsed.body_markdown : null;
  if (!seo_title || !seo_description || !focus_keyword) {
    return {
      ok: false,
      error: "AI returned incomplete SEO fields"
    };
  }
  const update = {
    focus_keyword,
    seo_title,
    seo_description,
    og_title,
    og_description,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const changed = ["focus_keyword", "seo_title", "seo_description", "og_title", "og_description"];
  if (newBody) {
    update.body_markdown = newBody;
    changed.push("body_markdown");
  }
  const {
    error
  } = await supabaseAdmin.from("content_pages").update(update).eq("id", p.id);
  if (error) return {
    ok: false,
    error: error.message
  };
  const refreshed = await loadPageForAi(p.id);
  if (!refreshed) return {
    ok: false,
    error: "Failed to reload page"
  };
  return {
    ok: true,
    page: refreshed,
    changed
  };
});
export {
  aiFixContentPage_createServerFn_handler,
  appendAiContentToPage_createServerFn_handler,
  autoFixSeo_createServerFn_handler,
  bulkUpdateContentPages_createServerFn_handler,
  cancelQueuedSeoJobs_createServerFn_handler,
  deleteSectionPreset_createServerFn_handler,
  enqueueSeoFixJobs_createServerFn_handler,
  generateCustomSection_createServerFn_handler,
  generateFullPageContent_createServerFn_handler,
  generateSectionPreset_createServerFn_handler,
  generateSeoMeta_createServerFn_handler,
  getContentPage_createServerFn_handler,
  getIndexingStats_createServerFn_handler,
  getSeoBatchDetails_createServerFn_handler,
  getSeoJobStatus_createServerFn_handler,
  improvePageContent_createServerFn_handler,
  listContentPages_createServerFn_handler,
  listLeads_createServerFn_handler,
  listSectionPresets_createServerFn_handler,
  listSeoBatches_createServerFn_handler,
  listSeoIssues_createServerFn_handler,
  processSeoFixQueue_createServerFn_handler,
  saveSectionPreset_createServerFn_handler,
  updateContentPage_createServerFn_handler,
  updateLeadStatus_createServerFn_handler
};
