import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
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
async function buildSnapshot() {
  const sb = supabaseAdmin;
  const week = new Date(Date.now() - 7 * 864e5).toISOString();
  const safe = async (fn, fallback) => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };
  const [pages, pendingTpl, missing, gsc, thin, noMeta] = await Promise.all([safe(async () => {
    const [{
      count: total
    }, {
      count: pub
    }, {
      count: pending
    }, {
      count: last7
    }] = await Promise.all([sb.from("content_pages").select("*", {
      count: "exact",
      head: true
    }), sb.from("content_pages").select("*", {
      count: "exact",
      head: true
    }).eq("status", "published"), sb.from("content_pages").select("*", {
      count: "exact",
      head: true
    }).eq("status", "pending"), sb.from("content_pages").select("*", {
      count: "exact",
      head: true
    }).eq("status", "published").gte("updated_at", week)]);
    return {
      total: total ?? 0,
      published: pub ?? 0,
      pending: pending ?? 0,
      publishedLast7d: last7 ?? 0
    };
  }, {
    total: 0,
    published: 0,
    pending: 0,
    publishedLast7d: 0
  }), safe(async () => {
    const {
      data
    } = await sb.from("content_pages").select("template_type").eq("status", "pending").limit(2e3);
    const counts = {};
    (data || []).forEach((r) => {
      const k = r.template_type || "unknown";
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, []), safe(async () => {
    const {
      count
    } = await sb.from("missing_pages").select("*", {
      count: "exact",
      head: true
    }).eq("resolved", false);
    return count ?? 0;
  }, 0), safe(async () => {
    const {
      data
    } = await sb.from("gsc_daily_pages").select("url_path, clicks, impressions, position, captured_at").gte("captured_at", week).limit(5e3);
    const rows = data || [];
    const clicks = rows.reduce((a, r) => a + (r.clicks || 0), 0);
    const impr = rows.reduce((a, r) => a + (r.impressions || 0), 0);
    const byPage = {};
    rows.forEach((r) => {
      byPage[r.url_path] = (byPage[r.url_path] || 0) + (r.clicks || 0);
    });
    const top = Object.entries(byPage).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const lastCaptured = rows.length ? rows.map((r) => r.captured_at).sort().pop() : null;
    return {
      clicks,
      impr,
      top,
      lastCaptured
    };
  }, {
    clicks: 0,
    impr: 0,
    top: [],
    lastCaptured: null
  }), safe(async () => {
    const {
      data
    } = await sb.from("content_pages").select("body_markdown").eq("status", "published").like("url_path", "/p/%").limit(2e3);
    let thinCount = 0, empty = 0;
    (data || []).forEach((r) => {
      const w = (r.body_markdown || "").split(/\s+/).filter(Boolean).length;
      if (w === 0) empty++;
      else if (w < 500) thinCount++;
    });
    return {
      thin: thinCount,
      empty
    };
  }, {
    thin: 0,
    empty: 0
  }), safe(async () => {
    const {
      count
    } = await sb.from("content_pages").select("*", {
      count: "exact",
      head: true
    }).eq("status", "published").is("seo_description", null);
    return count ?? 0;
  }, 0)]);
  return `LIVE SEO SNAPSHOT (as of ${(/* @__PURE__ */ new Date()).toISOString()}):
- Content pages: ${pages.total} total, ${pages.published} published, ${pages.pending} pending, ${pages.publishedLast7d} published in last 7d
- Pending by template: ${pendingTpl.map(([k, v]) => `${k}=${v}`).join(", ") || "none"}
- Unresolved 404s (missing_pages): ${missing}
- Published page quality: ${thin.empty} empty (0 words), ${thin.thin} thin (<500 words), ${noMeta} missing meta description
- GSC last 7d: ${gsc.clicks} clicks, ${gsc.impr} impressions (last sync: ${gsc.lastCaptured || "never"})
- Top pages by clicks (7d): ${gsc.top.map(([p, c]) => `${p}=${c}`).join(", ") || "no data"}

ADMIN TOOLS YOU CAN RECOMMEND (route → purpose):
- /admin/missing-pages → triage & redirect 404s
- /admin/page-auditor → AI audit + rewrite a single URL
- /admin/keyword-opportunities → import GSC queries, find easy wins
- /admin/internal-links → recommend internal linking
- /admin/seo-health → site-wide title/meta/schema issues
- /admin/content-pages → bulk-fix thin/empty pages, run AI fix
- /admin/quick-page → spin up a new /p/{slug} page in 30s
- /admin/generate-content → batch-generate from templates
- /admin/gsc-import → re-sync Search Console data
- /admin/competitor-radar → see competitor new pages
- /admin/rank-tracker → track keyword positions
- /admin/indexing → submit/inspect sitemap & indexing
- /admin/link-checker → find broken internal links`;
}
const SYSTEM_PROMPT = `You are the SEO Coach for poolrentalnearme.com, embedded inside the admin panel.

Your job: walk the user through fixing real SEO problems on their site, ONE step at a time, like a Socratic mentor.

HARD RULES:
1. Ask ONE yes/no question per turn. Format every question on its own line as: **Q: <yes/no question>** then a "Why I'm asking:" sentence right under it explaining your reasoning.
2. Use the LIVE SEO SNAPSHOT to ground every suggestion in real numbers. Quote the actual count when you say something is broken.
3. Always recommend the EXACT admin route (e.g. "/admin/missing-pages") when telling the user where to fix something. Never invent routes — only use the ones in the snapshot's tool list.
4. After the user answers Yes or No, briefly confirm what they should do next (1-3 sentences max), then ask the NEXT yes/no question. Keep momentum.
5. If user says "just tell me what to do", give them a numbered 3-step action plan with the exact tool routes, then resume yes/no flow.
6. Prioritize impact: 404s & indexing > thin/empty published pages > meta issues > new content. Don't bury the lead.
7. Be terse, direct, founder-to-founder. No fluff, no "great question!", no banned filler words (leverage, robust, dive into, unlock, journey, seamlessly).
8. Never link to /blog, /host-tools, /help-center, /academy, /providers, /pool-builders. They 404 in production.
9. If the user is vague, ask a yes/no clarifier instead of guessing.

Your first message in a NEW chat: greet briefly, name the single most urgent issue from the snapshot with its number, then ask the first yes/no question.`;
const seoCoachChat_createServerFn_handler = createServerRpc({
  id: "e2e5afc73b175525822c27966d8f0445138fcbe6c2120e521299ae1690e12b49",
  name: "seoCoachChat",
  filename: "src/server/admin-seo-coach.functions.ts"
}, (opts) => seoCoachChat.__executeServer(opts));
const seoCoachChat = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(8e3)
  })).min(1).max(40),
  completedRoutes: z.array(z.string().max(120)).max(40).optional()
}).parse(d)).handler(seoCoachChat_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return {
    ok: false,
    error: "LOVABLE_API_KEY not configured"
  };
  const snapshot = await buildSnapshot();
  const completedNote = data.completedRoutes?.length ? `STEPS THE USER HAS ALREADY COMPLETED THIS SESSION (do NOT recommend them again — move to the next priority): ${data.completedRoutes.join(", ")}` : "No steps completed yet this session.";
  const messages = [{
    role: "system",
    content: SYSTEM_PROMPT
  }, {
    role: "system",
    content: snapshot
  }, {
    role: "system",
    content: completedNote
  }, ...data.messages.map((m) => ({
    role: m.role,
    content: m.content
  }))];
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages
      })
    });
    if (resp.status === 402) return {
      ok: false,
      error: "AI credits exhausted — top up in Settings → Workspace → Usage."
    };
    if (resp.status === 429) return {
      ok: false,
      error: "Rate limited. Try again in a moment."
    };
    if (!resp.ok) {
      const t = await resp.text();
      return {
        ok: false,
        error: `AI gateway ${resp.status}: ${t.slice(0, 200)}`
      };
    }
    const json = await resp.json();
    const reply = json?.choices?.[0]?.message?.content?.trim();
    if (!reply) return {
      ok: false,
      error: "AI returned empty reply"
    };
    return {
      ok: true,
      reply
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
export {
  seoCoachChat_createServerFn_handler
};
