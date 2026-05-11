import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

type ChatMsg = { role: "user" | "assistant" | "tool" | "system"; content: string; tool_call_id?: string; tool_calls?: any };
type Role = "ceo" | "coo" | "cs";

// ---------------- Role detection (auto by email/name + override) ----------------
function autoDetectRole(email: string | null | undefined, name: string | null | undefined): Role {
  const e = (email || "").toLowerCase();
  const n = (name || "").toLowerCase();
  const hay = `${e} ${n}`;
  // COO: Brandon
  if (/(^|[^a-z])brandon([^a-z]|$)/.test(hay)) return "coo";
  // CS: Michelle
  if (/(^|[^a-z])(michelle|lupo)([^a-z]|$)/.test(hay)) return "cs";
  // Default: CEO (Derek, anyone else with admin)
  return "ceo";
}

const ROLE_LABELS: Record<Role, string> = {
  ceo: "Derek (CEO) — strategy, growth, revenue, SEO",
  coo: "Brandon (COO) — outreach, customer success, operations",
  cs:  "Michelle (CS) — replies, follow-ups, host onboarding",
};

const ROLE_PRIORITIES: Record<Role, string> = {
  ceo: "Prioritize: revenue & growth wins (new listings, GSC clicks, top pages, indexing health, competitor gaps). Surface BIG bets, kill busywork.",
  coo: "Prioritize: outreach pipeline (host_leads & ig_leads not yet contacted, stalled SMS sequences, low-quality listings to coach, support backlog). Practical to-dos.",
  cs:  "Prioritize: unanswered inbound SMS, recent feature_requests, host_leads from last 48h that need a personal reply, listing audits emailed but no follow-up.",
};

// Resolve & persist the user's role. Order:
//  1. Stored override / admin_set in prnm_coach_user_roles (sticky)
//  2. Auto-detected from email + display_name + full_name (persisted as 'auto')
async function resolveRole(userId: string): Promise<{
  role: Role; source: "auto" | "override" | "admin_set"; email: string | null; name: string | null;
}> {
  const sbAny = supabaseAdmin as any;
  const { data: existing } = await sbAny
    .from("prnm_coach_user_roles")
    .select("role, source, detected_email, detected_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing && (existing.source === "override" || existing.source === "admin_set")) {
    return { role: existing.role as Role, source: existing.source, email: existing.detected_email, name: existing.detected_name };
  }

  // Look up email + name
  let email: string | null = null;
  let name: string | null = null;
  try {
    const { data: u } = await sbAny.auth.admin.getUserById(userId);
    email = u?.user?.email ?? null;
    name = (u?.user?.user_metadata?.full_name as string | undefined)
      ?? (u?.user?.user_metadata?.name as string | undefined)
      ?? null;
  } catch {}
  if (!name) {
    const { data: prof } = await sbAny
      .from("profiles").select("display_name, full_name").eq("user_id", userId).maybeSingle();
    name = prof?.full_name || prof?.display_name || null;
  }

  const role = autoDetectRole(email, name);
  // Upsert as auto so we don't re-query auth.users on every turn
  await sbAny.from("prnm_coach_user_roles").upsert({
    user_id: userId, role, source: "auto", detected_email: email, detected_name: name,
  }, { onConflict: "user_id" });
  return { role, source: "auto", email, name };
}

export const getCoachRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({}).parse(d ?? {}))
  .handler(async ({ context }) => {
    const ctx = context as any;
    await assertAdmin(ctx.userId);
    return resolveRole(ctx.userId);
  });

export const setCoachRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    role: z.enum(["ceo", "coo", "cs"]).nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx.userId);
    const sbAny = supabaseAdmin as any;
    if (data.role === null) {
      // Clear override → re-run auto detection on next call
      await sbAny.from("prnm_coach_user_roles").delete().eq("user_id", ctx.userId);
      return resolveRole(ctx.userId);
    }
    await sbAny.from("prnm_coach_user_roles").upsert({
      user_id: ctx.userId, role: data.role, source: "override",
    }, { onConflict: "user_id" });
    return resolveRole(ctx.userId);
  });

// ---------------- Tools the agent can call ----------------
type ToolResult = Record<string, unknown> | { error: string };

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_seo_snapshot",
      description: "Site-wide SEO + content health: page counts, pending by template, 404s, GSC clicks/impressions last 7d, thin/empty pages, missing meta.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "query_leads",
      description: "Host lead pipeline: host_leads (popup signups) + ig_leads (Instagram prospects). Returns recent counts, uncontacted, by city, stalled SMS sequences.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", description: "Lookback days (default 14)", default: 14 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_listings",
      description: "Marketplace listing health from synced_listings: total published, new last 30d, missing photos, missing description, listings by state, low-capacity.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "query_support",
      description: "Customer support backlog: recent feature_requests, unanswered inbound SMS (sms_inbound_log), recent 404 spikes (content_404_log).",
      parameters: {
        type: "object",
        properties: { days: { type: "integer", default: 7 } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_traffic",
      description: "GSC traffic detail: top queries (with position & impressions), top landing pages, queries on page 2 (positions 11-20) — easy ranking wins.",
      parameters: {
        type: "object",
        properties: { days: { type: "integer", default: 14 } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_revenue_proxies",
      description: "Revenue & marketplace value signals: total inventory $ value (sum of listing prices), avg/median price by state, top-priced listings, AND supply/demand gaps — cities with host_leads (demand to host) or ig_leads but few/no published listings.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "query_pages",
      description: "Search content_pages for a specific issue: low word count, missing seo_description, missing focus_keyword, or by template_type.",
      parameters: {
        type: "object",
        properties: {
          issue: { type: "string", enum: ["thin", "no_meta", "no_keyword", "empty"] },
          template_type: { type: "string", description: "Optional template filter, e.g. host_acq_city" },
          limit: { type: "integer", default: 15 },
        },
        required: ["issue"],
        additionalProperties: false,
      },
    },
  },
] as const;

// ---------------- Tool implementations ----------------
const sb = supabaseAdmin as any;
const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try { return await fn(); } catch { return fallback; }
};

async function tool_get_seo_snapshot(): Promise<ToolResult> {
  const week = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [pages, pendingTpl, missing404, gsc, thin, noMeta] = await Promise.all([
    safe(async () => {
      const [{ count: total }, { count: pub }, { count: pending }, { count: last7 }] = await Promise.all([
        sb.from("content_pages").select("*", { count: "exact", head: true }),
        sb.from("content_pages").select("*", { count: "exact", head: true }).eq("status", "published"),
        sb.from("content_pages").select("*", { count: "exact", head: true }).eq("status", "pending"),
        sb.from("content_pages").select("*", { count: "exact", head: true }).eq("status", "published").gte("updated_at", week),
      ]);
      return { total: total ?? 0, published: pub ?? 0, pending: pending ?? 0, publishedLast7d: last7 ?? 0 };
    }, { total: 0, published: 0, pending: 0, publishedLast7d: 0 }),
    safe(async () => {
      const { data } = await sb.from("content_pages").select("template_type").eq("status", "pending").limit(2000);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => { const k = r.template_type || "unknown"; counts[k] = (counts[k] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8);
    }, [] as Array<[string, number]>),
    safe(async () => {
      const { count } = await sb.from("content_404_log").select("*", { count: "exact", head: true }).is("resolved_at", null);
      return count ?? 0;
    }, 0),
    safe(async () => {
      const { data } = await sb.from("gsc_query_data").select("clicks, impressions, captured_at").gte("captured_at", week).limit(5000);
      const rows = data || [];
      const clicks = rows.reduce((a: number, r: any) => a + (r.clicks || 0), 0);
      const impr = rows.reduce((a: number, r: any) => a + (r.impressions || 0), 0);
      const lastCaptured = rows.length ? rows.map((r: any) => r.captured_at).sort().pop() : null;
      return { clicks, impressions: impr, lastCaptured };
    }, { clicks: 0, impressions: 0, lastCaptured: null }),
    safe(async () => {
      const { data } = await sb.from("content_pages").select("body_markdown").eq("status", "published").limit(2000);
      let thinCount = 0, empty = 0;
      (data || []).forEach((r: any) => {
        const w = (r.body_markdown || "").split(/\s+/).filter(Boolean).length;
        if (w === 0) empty++; else if (w < 500) thinCount++;
      });
      return { thin: thinCount, empty };
    }, { thin: 0, empty: 0 }),
    safe(async () => {
      const { count } = await sb.from("content_pages").select("*", { count: "exact", head: true }).eq("status", "published").is("seo_description", null);
      return count ?? 0;
    }, 0),
  ]);
  return { pages, pendingByTemplate: pendingTpl, unresolved404s: missing404, gsc7d: gsc, contentQuality: { ...thin, missingMeta: noMeta } };
}

async function tool_query_leads(days: number): Promise<ToolResult> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [hostStats, hostRecent, igStats, smsStalled, byCity] = await Promise.all([
    safe(async () => {
      const [{ count: total }, { count: recent }, { count: verified }] = await Promise.all([
        sb.from("host_leads").select("*", { count: "exact", head: true }),
        sb.from("host_leads").select("*", { count: "exact", head: true }).gte("created_at", since),
        sb.from("host_leads").select("*", { count: "exact", head: true }).eq("email_sendable", true),
      ]);
      return { total: total ?? 0, recent: recent ?? 0, emailVerified: verified ?? 0 };
    }, { total: 0, recent: 0, emailVerified: 0 }),
    safe(async () => {
      const { data } = await sb.from("host_leads").select("name, email, phone_e164, city, region, created_at, page").gte("created_at", since).order("created_at", { ascending: false }).limit(15);
      return data || [];
    }, []),
    safe(async () => {
      const [{ count: total }, { count: uncontacted }, { count: recent }] = await Promise.all([
        sb.from("ig_leads").select("*", { count: "exact", head: true }),
        sb.from("ig_leads").select("*", { count: "exact", head: true }).eq("contacted", false),
        sb.from("ig_leads").select("*", { count: "exact", head: true }).gte("first_seen_at", since),
      ]);
      return { total: total ?? 0, uncontacted: uncontacted ?? 0, recent: recent ?? 0 };
    }, { total: 0, uncontacted: 0, recent: 0 }),
    safe(async () => {
      const { count: pending } = await sb.from("sms_messages").select("*", { count: "exact", head: true }).eq("status", "pending").lte("scheduled_at", new Date().toISOString());
      const { count: failed } = await sb.from("sms_messages").select("*", { count: "exact", head: true }).eq("status", "failed");
      return { duePending: pending ?? 0, failed: failed ?? 0 };
    }, { duePending: 0, failed: 0 }),
    safe(async () => {
      const { data } = await sb.from("host_leads").select("city, region").gte("created_at", since).limit(500);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        const k = `${r.city || "?"}, ${r.region || "?"}`;
        counts[k] = (counts[k] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10);
    }, [] as Array<[string, number]>),
  ]);
  return { lookbackDays: days, hostLeads: hostStats, recentHostLeads: hostRecent, igLeads: igStats, smsSequence: smsStalled, leadsByCity: byCity };
}

async function tool_query_listings(): Promise<ToolResult> {
  const month = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [counts, recent, quality, byState] = await Promise.all([
    safe(async () => {
      const [{ count: total }, { count: pub }] = await Promise.all([
        sb.from("synced_listings").select("*", { count: "exact", head: true }).eq("is_deleted", false),
        sb.from("synced_listings").select("*", { count: "exact", head: true }).eq("is_deleted", false).eq("state", "published"),
      ]);
      return { total: total ?? 0, published: pub ?? 0 };
    }, { total: 0, published: 0 }),
    safe(async () => {
      const { count } = await sb.from("synced_listings").select("*", { count: "exact", head: true }).eq("is_deleted", false).gte("st_created_at", month);
      return count ?? 0;
    }, 0),
    safe(async () => {
      const { data } = await sb.from("synced_listings").select("title, image_urls, description, capacity, city, state_code, slug").eq("is_deleted", false).eq("state", "published").limit(2000);
      const rows = data || [];
      const noPhotos = rows.filter((r: any) => !r.image_urls || r.image_urls.length === 0).length;
      const fewPhotos = rows.filter((r: any) => r.image_urls && r.image_urls.length > 0 && r.image_urls.length < 4).length;
      const noDesc = rows.filter((r: any) => !r.description || r.description.length < 100).length;
      const lowCap = rows.filter((r: any) => r.capacity != null && r.capacity < 5).length;
      const samples = rows.filter((r: any) => !r.image_urls || r.image_urls.length < 4 || !r.description || r.description.length < 100).slice(0, 8).map((r: any) => ({ title: r.title, city: r.city, state: r.state_code, photos: (r.image_urls || []).length, descLen: (r.description || "").length, slug: r.slug }));
      return { noPhotos, fewPhotos, noDesc, lowCapacity: lowCap, samples };
    }, { noPhotos: 0, fewPhotos: 0, noDesc: 0, lowCapacity: 0, samples: [] }),
    safe(async () => {
      const { data } = await sb.from("synced_listings").select("state_code").eq("is_deleted", false).eq("state", "published").limit(5000);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => { const k = r.state_code || "?"; counts[k] = (counts[k] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10);
    }, [] as Array<[string, number]>),
  ]);
  return { counts, newLast30d: recent, quality, topStates: byState };
}

async function tool_query_support(days: number): Promise<ToolResult> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [features, sms404, hot404] = await Promise.all([
    safe(async () => {
      const { data } = await sb.from("feature_requests").select("name, email, request_text, city, region, created_at, status").gte("created_at", since).order("created_at", { ascending: false }).limit(15);
      const { count: open } = await sb.from("feature_requests").select("*", { count: "exact", head: true }).eq("status", "new");
      return { open: open ?? 0, recent: data || [] };
    }, { open: 0, recent: [] }),
    safe(async () => {
      const { data } = await sb.from("sms_inbound_log").select("from_phone, body, action, received_at").gte("received_at", since).order("received_at", { ascending: false }).limit(20);
      const needsReply = (data || []).filter((r: any) => r.action !== "STOP" && r.action !== "START").length;
      return { needsReply, recent: data || [] };
    }, { needsReply: 0, recent: [] }),
    safe(async () => {
      const { data } = await sb.from("content_404_log").select("url_path, hit_count, last_seen_at").is("resolved_at", null).order("hit_count", { ascending: false }).limit(10);
      return data || [];
    }, []),
  ]);
  return { lookbackDays: days, featureRequests: features, inboundSms: sms404, top404s: hot404 };
}

async function tool_query_traffic(days: number): Promise<ToolResult> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [topQueries, topPages, page2] = await Promise.all([
    safe(async () => {
      const { data } = await sb.from("gsc_query_data").select("query, clicks, impressions, position").gte("captured_at", since).limit(5000);
      const agg: Record<string, { clicks: number; impressions: number; pos: number; n: number }> = {};
      (data || []).forEach((r: any) => {
        const k = r.query;
        agg[k] = agg[k] || { clicks: 0, impressions: 0, pos: 0, n: 0 };
        agg[k].clicks += r.clicks || 0;
        agg[k].impressions += r.impressions || 0;
        agg[k].pos += r.position || 0;
        agg[k].n += 1;
      });
      return Object.entries(agg).map(([q, v]) => ({ query: q, clicks: v.clicks, impressions: v.impressions, avgPos: +(v.pos / Math.max(v.n, 1)).toFixed(1) })).sort((a, b) => b.clicks - a.clicks).slice(0, 15);
    }, []),
    safe(async () => {
      const { data } = await sb.from("gsc_query_data").select("url_path, clicks, impressions").gte("captured_at", since).limit(5000);
      const agg: Record<string, { clicks: number; impressions: number }> = {};
      (data || []).forEach((r: any) => {
        agg[r.url_path] = agg[r.url_path] || { clicks: 0, impressions: 0 };
        agg[r.url_path].clicks += r.clicks || 0;
        agg[r.url_path].impressions += r.impressions || 0;
      });
      return Object.entries(agg).map(([p, v]) => ({ path: p, ...v })).sort((a, b) => b.clicks - a.clicks).slice(0, 15);
    }, []),
    safe(async () => {
      const { data } = await sb.from("gsc_query_data").select("query, url_path, impressions, position, clicks").gte("captured_at", since).gte("position", 11).lte("position", 20).order("impressions", { ascending: false }).limit(20);
      return data || [];
    }, []),
  ]);
  return { lookbackDays: days, topQueries, topPages, page2Opportunities: page2 };
}

async function tool_query_pages(issue: string, template_type?: string, limit = 15): Promise<ToolResult> {
  return safe(async () => {
    let q = sb.from("content_pages").select("url_path, title, template_type, body_markdown, seo_description, focus_keyword").eq("status", "published");
    if (template_type) q = q.eq("template_type", template_type);
    if (issue === "no_meta") q = q.is("seo_description", null);
    if (issue === "no_keyword") q = q.is("focus_keyword", null);
    const { data } = await q.limit(800);
    let rows = data || [];
    if (issue === "thin") rows = rows.filter((r: any) => { const w = (r.body_markdown || "").split(/\s+/).filter(Boolean).length; return w > 0 && w < 500; });
    if (issue === "empty") rows = rows.filter((r: any) => !(r.body_markdown || "").trim());
    return { count: rows.length, samples: rows.slice(0, limit).map((r: any) => ({ url: r.url_path, title: r.title, template: r.template_type, words: (r.body_markdown || "").split(/\s+/).filter(Boolean).length })) };
  }, { count: 0, samples: [] });
}

async function tool_query_revenue_proxies(): Promise<ToolResult> {
  const [inventory, byState, topPriced, supplyDemand] = await Promise.all([
    safe(async () => {
      const { data } = await sb.from("synced_listings").select("price_amount, price_currency").eq("is_deleted", false).eq("state", "published").limit(5000);
      const rows = (data || []).filter((r: any) => typeof r.price_amount === "number" && r.price_amount > 0);
      const total = rows.reduce((a: number, r: any) => a + (r.price_amount || 0), 0);
      const avg = rows.length ? Math.round(total / rows.length) : 0;
      const sorted = rows.map((r: any) => r.price_amount).sort((a: number, b: number) => a - b);
      const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
      // Sharetribe stores price in cents; show dollars
      return { listingsWithPrice: rows.length, totalInventoryValue: Math.round(total / 100), avgHourlyPrice: Math.round(avg / 100), medianHourlyPrice: Math.round(median / 100), currency: rows[0]?.price_currency || "USD" };
    }, { listingsWithPrice: 0, totalInventoryValue: 0, avgHourlyPrice: 0, medianHourlyPrice: 0, currency: "USD" }),
    safe(async () => {
      const { data } = await sb.from("synced_listings").select("state_code, price_amount").eq("is_deleted", false).eq("state", "published").limit(5000);
      const agg: Record<string, { sum: number; n: number }> = {};
      (data || []).forEach((r: any) => {
        if (!r.state_code || !r.price_amount) return;
        agg[r.state_code] = agg[r.state_code] || { sum: 0, n: 0 };
        agg[r.state_code].sum += r.price_amount; agg[r.state_code].n += 1;
      });
      return Object.entries(agg).map(([s, v]) => ({ state: s, listings: v.n, avgHourly: Math.round(v.sum / v.n / 100) })).sort((a, b) => b.listings - a.listings).slice(0, 10);
    }, []),
    safe(async () => {
      const { data } = await sb.from("synced_listings").select("title, city, state_code, price_amount, slug").eq("is_deleted", false).eq("state", "published").not("price_amount", "is", null).order("price_amount", { ascending: false }).limit(8);
      return (data || []).map((r: any) => ({ title: r.title, city: r.city, state: r.state_code, hourly: Math.round((r.price_amount || 0) / 100), slug: r.slug }));
    }, []),
    safe(async () => {
      // Demand: host_leads + ig_leads grouped by city. Supply: published listings per city.
      const [{ data: hl }, { data: il }, { data: sl }] = await Promise.all([
        sb.from("host_leads").select("city, region").not("city", "is", null).limit(2000),
        sb.from("ig_leads").select("query, snippet").limit(1000),
        sb.from("synced_listings").select("city, state_code").eq("is_deleted", false).eq("state", "published").limit(5000),
      ]);
      const supply: Record<string, number> = {};
      (sl || []).forEach((r: any) => { const k = `${(r.city || "").toLowerCase()}|${r.state_code || ""}`; supply[k] = (supply[k] || 0) + 1; });
      const demand: Record<string, { city: string; state: string; n: number }> = {};
      (hl || []).forEach((r: any) => {
        const k = `${(r.city || "").toLowerCase()}|${r.region || ""}`;
        demand[k] = demand[k] || { city: r.city, state: r.region, n: 0 };
        demand[k].n += 1;
      });
      const gaps = Object.entries(demand)
        .map(([k, v]) => ({ city: v.city, state: v.state, hostLeads: v.n, listings: supply[k] || 0 }))
        .filter((r) => r.hostLeads >= 1 && r.listings <= 1)
        .sort((a, b) => b.hostLeads - a.hostLeads)
        .slice(0, 10);
      return { gapCities: gaps, totalIgProspects: (il || []).length };
    }, { gapCities: [], totalIgProspects: 0 }),
  ]);
  return { inventory, byState, topPriced, supplyDemandGaps: supplyDemand };
}

async function runTool(name: string, args: any): Promise<ToolResult> {
  try {
    switch (name) {
      case "get_seo_snapshot":      return await tool_get_seo_snapshot();
      case "query_leads":           return await tool_query_leads(Number(args?.days ?? 14));
      case "query_listings":        return await tool_query_listings();
      case "query_support":         return await tool_query_support(Number(args?.days ?? 7));
      case "query_traffic":         return await tool_query_traffic(Number(args?.days ?? 14));
      case "query_revenue_proxies": return await tool_query_revenue_proxies();
      case "query_pages":           return await tool_query_pages(String(args?.issue || "thin"), args?.template_type, Number(args?.limit ?? 15));
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tool failed" };
  }
}

// ---------------- System prompt ----------------
const ADMIN_ROUTES = `
ADMIN TOOLS YOU CAN RECOMMEND (route → purpose):
- /admin/missing-pages → triage & redirect 404s
- /admin/page-auditor → AI audit + rewrite a single URL
- /admin/keyword-opportunities → find easy ranking wins from GSC
- /admin/internal-links → recommend internal linking
- /admin/seo-health → site-wide title/meta/schema issues
- /admin/content-pages → bulk-fix thin/empty pages, run AI fix
- /admin/quick-page → spin up a new /p/{slug} page in 30s
- /admin/generate-content → batch-generate from templates
- /admin/gsc-import → re-sync Search Console data
- /admin/competitor-radar → see competitor new pages
- /admin/rank-tracker → track keyword positions
- /admin/indexing → submit/inspect sitemap & indexing
- /admin/link-checker → find broken internal links
- /admin/listing-auditor → AI audit a host's marketplace listing
- /admin/leads → host_leads pipeline (popup signups)
- /admin/ig-lead-hunter → discover Instagram pool host prospects
- /admin/contact-enricher → find emails/phones for prospects
- /admin/feature-requests → user-submitted feature ideas
- /admin/sms → SMS follow-up sequences for host leads`;

function buildSystemPrompt(role: Role, agentMode = false): string {
  return `You are the **PRNM Coach** — embedded inside the poolrentalnearme.com admin panel.

You are NOT just an SEO bot. You are a platform advisor for the whole business: SEO, marketplace listings, host outreach, customer success, support, and revenue.

CURRENT USER: ${ROLE_LABELS[role]}
${ROLE_PRIORITIES[role]}

HOW YOU WORK:
1. You have TOOLS spanning SEO, leads/outreach, listings quality, support inbox, traffic, AND revenue/marketplace value. CALL THEM before giving advice. Never invent numbers.
2. On the FIRST turn of a chat, call AT LEAST 3 tools across DIFFERENT categories (e.g., one revenue/listings, one leads, one traffic/SEO) so your recommendation reflects the whole platform — not just SEO.
3. Cross-reference signals. Examples: cities with host_leads but zero listings = host outreach gap; high-impression page-2 queries on a thin page = rewrite + republish; uncontacted ig_leads in a high-supply state = outbound priority.
4. After gathering, give ONE focused recommendation with the EXACT admin route, grounded in specific numbers from the tools.
5. Ask ONE yes/no follow-up: **Q: <yes/no question>** then a one-line "Why I'm asking:".

HARD RULES:
- Ground EVERY claim in tool data. If you say "X is broken", quote the count.
- Recommend EXACT routes from the list below. Never invent routes.
- Be terse, founder-to-founder. No fluff. No "great question". Banned words: leverage, robust, dive into, unlock, journey, seamlessly, elevate, vibrant, thriving, bustling.
- Never link to /blog, /host-tools, /help-center, /academy, /providers, /pool-builders — they 404.
- Match priorities to the user's ROLE above. Don't send the COO into a meta-description audit. Don't send CS into competitor research.
- Skip work that won't move the needle. If everything looks fine in a category, SAY so and move on.

FIRST MESSAGE in a new chat: call 3+ tools across DIFFERENT categories (revenue/listings, leads, traffic, support) — not just SEO. Then surface the SINGLE highest-leverage thing they should do today, with the route and a yes/no question.
${agentMode ? `
🔬 AGENT MODE — DEEP RESEARCH IS ACTIVE:
- Run AT LEAST 6 tool calls across AT LEAST 4 different categories before any recommendation.
- After your first round of tools, RUN MORE tools to follow leads. Examples:
  • If query_leads shows uncontacted leads in city X, then call query_listings AND query_revenue_proxies to check supply/demand in X.
  • If query_traffic surfaces a page-2 query, call query_pages with issue=thin to check if the ranking page needs a rewrite.
  • If query_support shows an inbound SMS theme, cross-check with feature_requests and recent host_leads.
- Build a chain of EVIDENCE. Open your reply with a "## Evidence" section listing 3-6 numbered findings, each citing the specific tool + number. Then "## Recommendation" with the single action and route. Then the yes/no question.
- Do NOT stop after one round. Plan → query → reflect → query again → recommend.
` : ""}
${ADMIN_ROUTES}`;
}

// ---------------- Main handler with agent loop ----------------
export const prnmCoachChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })).min(1).max(40),
      completedRoutes: z.array(z.string().max(120)).max(40).optional(),
      roleOverride: z.enum(["ceo", "coo", "cs"]).optional(),
      agentMode: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; reply: string; role: Role; toolsUsed: string[] } | { ok: false; error: string }> => {
    const ctx = context as any;
    await assertAdmin(ctx.userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY not configured" };

    // Resolve role: explicit override (one-shot, this turn only) wins over the
    // persisted role; otherwise use the stored override or auto-detected role.
    const resolved = await resolveRole(ctx.userId);
    const role: Role = data.roleOverride || resolved.role;

    const completedNote = data.completedRoutes?.length
      ? `STEPS ALREADY COMPLETED THIS SESSION (do NOT recommend again): ${data.completedRoutes.join(", ")}`
      : "No steps completed yet this session.";

    const agentMode = !!data.agentMode;
    const messages: ChatMsg[] = [
      { role: "system", content: buildSystemPrompt(role, agentMode) },
      { role: "system", content: completedNote },
      ...data.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const toolsUsed: string[] = [];
    const MAX_ITERATIONS = agentMode ? 12 : 6;

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      let resp: Response;
      try {
        resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages,
            tools: TOOLS,
            tool_choice: iter === 0 ? "required" : "auto",
          }),
        });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Network error" };
      }

      if (resp.status === 402) return { ok: false, error: "AI credits exhausted — top up in Settings → Workspace → Usage." };
      if (resp.status === 429) return { ok: false, error: "Rate limited. Try again in a moment." };
      if (!resp.ok) {
        const t = await resp.text();
        return { ok: false, error: `AI gateway ${resp.status}: ${t.slice(0, 300)}` };
      }

      const json = await resp.json();
      const choice = json?.choices?.[0]?.message;
      if (!choice) return { ok: false, error: "AI returned no message" };

      const toolCalls = choice.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;

      if (!toolCalls || toolCalls.length === 0) {
        const reply = (choice.content || "").trim();
        if (!reply) return { ok: false, error: "AI returned empty reply" };
        return { ok: true, reply, role, toolsUsed };
      }

      // Execute tools in parallel
      messages.push({ role: "assistant", content: choice.content || "", tool_calls: toolCalls } as any);
      const results = await Promise.all(toolCalls.map(async (tc) => {
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        toolsUsed.push(tc.function.name);
        const result = await runTool(tc.function.name, args);
        return { tool_call_id: tc.id, role: "tool" as const, content: JSON.stringify(result).slice(0, 12000) };
      }));
      messages.push(...results as any);
    }

    return { ok: false, error: "Agent exceeded max iterations without final answer" };
  });

// ============================================================================
// PRIORITIZED OPPORTUNITIES — durable to-do list per role with check-off
// ============================================================================

type OppRow = {
  id: string;
  role: Role;
  title: string;
  why: string | null;
  impact: "high" | "medium" | "low";
  effort: "quick" | "medium" | "deep";
  action_label: string | null;
  action_route: string | null;
  evidence: any;
  batch_id: string | null;
  completed_at: string | null;
  dismissed_at: string | null;
  created_at: string;
};

const ALLOWED_ROUTES = new Set([
  "/admin/missing-pages","/admin/page-auditor","/admin/keyword-opportunities",
  "/admin/internal-links","/admin/seo-health","/admin/content-pages",
  "/admin/quick-page","/admin/generate-content","/admin/gsc-import",
  "/admin/competitor-radar","/admin/rank-tracker","/admin/indexing",
  "/admin/link-checker","/admin/listing-auditor","/admin/leads",
  "/admin/ig-lead-hunter","/admin/contact-enricher","/admin/feature-requests",
  "/admin/sms","/admin/dashboard","/admin/job-history","/admin/prnm-coach",
]);

export const listOpportunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    role: z.enum(["ceo", "coo", "cs"]).optional(),
    includeCompleted: z.boolean().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx.userId);
    let q = (sb as any).from("prnm_coach_opportunities").select("*").is("dismissed_at", null);
    if (data.role) q = q.eq("role", data.role);
    if (!data.includeCompleted) q = q.is("completed_at", null);
    const { data: rows, error } = await q.order("completed_at", { ascending: true, nullsFirst: true })
      .order("impact", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, items: (rows || []) as OppRow[] };
  });

export const markOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    action: z.enum(["complete", "reopen", "dismiss"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx.userId);
    const patch: any = {};
    if (data.action === "complete") { patch.completed_at = new Date().toISOString(); patch.completed_by = ctx.userId; }
    else if (data.action === "reopen") { patch.completed_at = null; patch.completed_by = null; }
    else if (data.action === "dismiss") { patch.dismissed_at = new Date().toISOString(); }
    const { error } = await (sb as any).from("prnm_coach_opportunities").update(patch).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const OPP_SCHEMA_PROMPT = `Return ONLY a JSON object with this exact shape — no prose, no markdown fences:
{
  "opportunities": [
    {
      "title": "<short imperative — max 80 chars>",
      "why": "<1-2 sentence rationale citing a specific NUMBER from a tool>",
      "impact": "high" | "medium" | "low",
      "effort": "quick" | "medium" | "deep",
      "action_label": "<short button label, e.g. 'Triage 404s'>",
      "action_route": "<one of the allowed /admin/... routes>"
    }
  ]
}
Rules:
- 4 to 7 opportunities. ONLY high or medium impact — skip low-value busywork.
- Sort by impact DESC, then effort ASC (quick wins float up).
- Every "why" MUST cite a real number you saw from a tool (e.g. "247 uncontacted ig_leads").
- action_route MUST be from the admin route list. No invented routes. No /blog, /academy, /providers.
- Tailor strictly to the role's priorities.`;

export const generateOpportunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    role: z.enum(["ceo", "coo", "cs"]).optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ ok: true; count: number; role: Role; batchId: string } | { ok: false; error: string }> => {
    const ctx = context as any;
    await assertAdmin(ctx.userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY not configured" };

    const resolved = await resolveRole(ctx.userId);
    const role: Role = data.role || resolved.role;

    const sysPrompt = `${buildSystemPrompt(role, true)}

YOU ARE NOW IN OPPORTUNITY-LIST MODE.
Run AT LEAST 5 tools across DIFFERENT categories, then output the prioritized opportunity list.
${OPP_SCHEMA_PROMPT}`;

    const messages: ChatMsg[] = [
      { role: "system", content: sysPrompt },
      { role: "user", content: `Generate today's prioritized opportunity list for ${ROLE_LABELS[role]}. Use tools first, then output JSON only.` },
    ];

    const toolsUsed: string[] = [];
    const MAX_ITER = 10;
    let finalContent = "";

    for (let iter = 0; iter < MAX_ITER; iter++) {
      let resp: Response;
      try {
        resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages,
            tools: TOOLS,
            tool_choice: iter === 0 ? "required" : "auto",
            response_format: iter > 2 ? { type: "json_object" } : undefined,
          }),
        });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Network error" };
      }
      if (resp.status === 402) return { ok: false, error: "AI credits exhausted." };
      if (resp.status === 429) return { ok: false, error: "Rate limited. Try again soon." };
      if (!resp.ok) return { ok: false, error: `AI gateway ${resp.status}: ${(await resp.text()).slice(0, 300)}` };

      const json = await resp.json();
      const choice = json?.choices?.[0]?.message;
      if (!choice) return { ok: false, error: "AI returned no message" };
      const toolCalls = choice.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;

      if (!toolCalls || toolCalls.length === 0) {
        finalContent = (choice.content || "").trim();
        break;
      }
      messages.push({ role: "assistant", content: choice.content || "", tool_calls: toolCalls } as any);
      const results = await Promise.all(toolCalls.map(async (tc) => {
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        toolsUsed.push(tc.function.name);
        const result = await runTool(tc.function.name, args);
        return { tool_call_id: tc.id, role: "tool" as const, content: JSON.stringify(result).slice(0, 12000) };
      }));
      messages.push(...results as any);
    }

    if (!finalContent) return { ok: false, error: "AI did not return final list" };

    // Parse JSON (strip code fences if present)
    let parsed: any = null;
    const cleaned = finalContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    try { parsed = JSON.parse(cleaned); } catch {
      // fall back: find first { ... }
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }
    const opps = Array.isArray(parsed?.opportunities) ? parsed.opportunities : [];
    if (opps.length === 0) return { ok: false, error: "Could not parse opportunities from AI output" };

    const batchId = crypto.randomUUID();
    const rows = opps
      .map((o: any) => {
        const route = typeof o.action_route === "string" ? o.action_route.toLowerCase().trim() : null;
        return {
          role,
          title: String(o.title || "").slice(0, 200),
          why: o.why ? String(o.why).slice(0, 1000) : null,
          impact: ["high","medium","low"].includes(o.impact) ? o.impact : "high",
          effort: ["quick","medium","deep"].includes(o.effort) ? o.effort : "medium",
          action_label: o.action_label ? String(o.action_label).slice(0, 80) : null,
          action_route: route && ALLOWED_ROUTES.has(route) ? route : null,
          evidence: { tools_used: toolsUsed },
          batch_id: batchId,
          generated_by: ctx.userId,
        };
      })
      .filter((r: any) => r.title);

    if (rows.length === 0) return { ok: false, error: "No valid opportunities to save" };

    // Auto-dismiss prior open items for this role so the list stays focused
    await (sb as any).from("prnm_coach_opportunities")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("role", role).is("completed_at", null).is("dismissed_at", null);

    const { error } = await (sb as any).from("prnm_coach_opportunities").insert(rows);
    if (error) return { ok: false, error: error.message };

    return { ok: true, count: rows.length, role, batchId };
  });
