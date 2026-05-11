/**
 * Follow-up performance analytics. Aggregates lead_followups + lead_touches
 * + host_leads/ig_leads to compute response rate, conversion rate,
 * time-to-reply, and AI score distribution by source and city.
 *
 * Admin-only. All access via supabaseAdmin.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface DashboardSummary {
  total: number;
  contacted: number;
  responded: number;
  converted: number;
  responseRate: number;
  conversionRate: number;
  medianHoursToReply: number | null;
  avgScore: number | null;
}

export interface SourceBucket {
  source: string;
  total: number;
  contacted: number;
  responded: number;
  converted: number;
  responseRate: number;
  conversionRate: number;
  avgScore: number | null;
}

export interface CityBucket {
  city: string;
  region: string | null;
  total: number;
  responded: number;
  converted: number;
  responseRate: number;
  conversionRate: number;
  avgScore: number | null;
}

export interface ScoreBucket {
  bucket: string; // "0-20", "21-40", ...
  count: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  bySource: SourceBucket[];
  byCity: CityBucket[];
  scoreDist: ScoreBucket[];
  rangeDays: number;
}

const RESPONDED_OUTCOMES = new Set(["replied", "interested", "meeting_booked", "converted"]);
const CONVERTED_OUTCOMES = new Set(["converted"]);
const CONTACTED_CHANNELS = new Set(["sms", "call", "email", "dm"]);

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export const getFollowupDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ rangeDays: z.number().int().min(1).max(365).default(90) }).parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<DashboardData> => {
    const since = new Date(Date.now() - data.rangeDays * 86400_000).toISOString();

    // Pull follow-ups in window
    const { data: fups } = await supabaseAdmin
      .from("lead_followups")
      .select("id, source, lead_id, status, ai_score, created_at, last_outcome")
      .gte("created_at", since)
      .limit(10000);
    const followups = fups ?? [];
    const fupIds = followups.map((f) => f.id);
    const fupById = new Map(followups.map((f) => [f.id, f]));

    // Touches for those follow-ups
    const { data: touches } = fupIds.length
      ? await supabaseAdmin
          .from("lead_touches")
          .select("followup_id, channel, outcome, occurred_at")
          .in("followup_id", fupIds)
          .order("occurred_at", { ascending: true })
          .limit(50000)
      : { data: [] as any[] };
    const touchesByFup = new Map<string, any[]>();
    for (const t of touches ?? []) {
      const arr = touchesByFup.get(t.followup_id) ?? [];
      arr.push(t);
      touchesByFup.set(t.followup_id, arr);
    }

    // City lookups
    const hostIds = followups.filter((f) => f.source === "host_lead").map((f) => f.lead_id);
    const igIds = followups.filter((f) => f.source === "ig_lead").map((f) => f.lead_id);
    const cityByLead = new Map<string, { city: string | null; region: string | null }>();
    if (hostIds.length) {
      const { data: hl } = await supabaseAdmin
        .from("host_leads")
        .select("id, city, region")
        .in("id", hostIds);
      for (const r of hl ?? []) cityByLead.set(`host_lead:${r.id}`, { city: r.city, region: r.region });
    }
    if (igIds.length) {
      const { data: il } = await supabaseAdmin
        .from("ig_leads")
        .select("id, query")
        .in("id", igIds);
      // ig_leads has no city; fall back to query string
      for (const r of il ?? []) cityByLead.set(`ig_lead:${r.id}`, { city: r.query ?? null, region: null });
    }

    // Aggregate
    let contacted = 0, responded = 0, converted = 0;
    const replyHours: number[] = [];
    const scores: number[] = [];

    const bySrc = new Map<string, SourceBucket>();
    const byCity = new Map<string, CityBucket>();
    const scoreBuckets: Record<string, number> = {
      "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0, unscored: 0,
    };

    for (const f of followups) {
      const ts = touchesByFup.get(f.id) ?? [];
      const wasContacted = ts.some((t) => CONTACTED_CHANNELS.has(t.channel));
      const respondT = ts.find((t) => RESPONDED_OUTCOMES.has(t.outcome ?? ""));
      const convertedHit = f.status === "converted" || ts.some((t) => CONVERTED_OUTCOMES.has(t.outcome ?? ""));

      if (wasContacted) contacted++;
      if (respondT) {
        responded++;
        const firstOut = ts.find((t) => CONTACTED_CHANNELS.has(t.channel));
        if (firstOut) {
          const dh = (new Date(respondT.occurred_at).getTime() - new Date(firstOut.occurred_at).getTime()) / 3_600_000;
          if (dh >= 0) replyHours.push(dh);
        }
      }
      if (convertedHit) converted++;
      if (typeof f.ai_score === "number") scores.push(f.ai_score);

      // Score distribution
      if (typeof f.ai_score !== "number") scoreBuckets.unscored++;
      else if (f.ai_score <= 20) scoreBuckets["0-20"]++;
      else if (f.ai_score <= 40) scoreBuckets["21-40"]++;
      else if (f.ai_score <= 60) scoreBuckets["41-60"]++;
      else if (f.ai_score <= 80) scoreBuckets["61-80"]++;
      else scoreBuckets["81-100"]++;

      // By source
      const sb = bySrc.get(f.source) ?? {
        source: f.source, total: 0, contacted: 0, responded: 0, converted: 0,
        responseRate: 0, conversionRate: 0, avgScore: null,
      };
      sb.total++;
      if (wasContacted) sb.contacted++;
      if (respondT) sb.responded++;
      if (convertedHit) sb.converted++;
      bySrc.set(f.source, sb);

      // By city
      const loc = cityByLead.get(`${f.source}:${f.lead_id}`);
      const cityKey = (loc?.city ?? "Unknown").trim() || "Unknown";
      const cb = byCity.get(cityKey) ?? {
        city: cityKey, region: loc?.region ?? null,
        total: 0, responded: 0, converted: 0,
        responseRate: 0, conversionRate: 0, avgScore: null,
      };
      cb.total++;
      if (respondT) cb.responded++;
      if (convertedHit) cb.converted++;
      byCity.set(cityKey, cb);
    }

    // Per-source avg score
    const scoresBySrc = new Map<string, number[]>();
    const scoresByCity = new Map<string, number[]>();
    for (const f of followups) {
      if (typeof f.ai_score !== "number") continue;
      const arrS = scoresBySrc.get(f.source) ?? [];
      arrS.push(f.ai_score);
      scoresBySrc.set(f.source, arrS);
      const loc = cityByLead.get(`${f.source}:${f.lead_id}`);
      const cityKey = (loc?.city ?? "Unknown").trim() || "Unknown";
      const arrC = scoresByCity.get(cityKey) ?? [];
      arrC.push(f.ai_score);
      scoresByCity.set(cityKey, arrC);
    }
    for (const [s, b] of bySrc) {
      b.responseRate = b.contacted ? b.responded / b.contacted : 0;
      b.conversionRate = b.total ? b.converted / b.total : 0;
      const arr = scoresBySrc.get(s);
      b.avgScore = arr && arr.length ? arr.reduce((a, n) => a + n, 0) / arr.length : null;
    }
    for (const [c, b] of byCity) {
      b.responseRate = b.total ? b.responded / b.total : 0;
      b.conversionRate = b.total ? b.converted / b.total : 0;
      const arr = scoresByCity.get(c);
      b.avgScore = arr && arr.length ? arr.reduce((a, n) => a + n, 0) / arr.length : null;
    }

    return {
      rangeDays: data.rangeDays,
      summary: {
        total: followups.length,
        contacted,
        responded,
        converted,
        responseRate: contacted ? responded / contacted : 0,
        conversionRate: followups.length ? converted / followups.length : 0,
        medianHoursToReply: median(replyHours),
        avgScore: scores.length ? scores.reduce((a, n) => a + n, 0) / scores.length : null,
      },
      bySource: [...bySrc.values()].sort((a, b) => b.total - a.total),
      byCity: [...byCity.values()].sort((a, b) => b.total - a.total).slice(0, 25),
      scoreDist: Object.entries(scoreBuckets).map(([bucket, count]) => ({ bucket, count })),
    };
  });

// ---------- drilldown ----------

export interface DrilldownItem {
  id: string;
  source: LeadSource;
  lead_id: string;
  status: FollowupStatus;
  ai_score: number | null;
  last_outcome: TouchOutcome | null;
  last_touch_at: string | null;
  next_action_at: string | null;
  touch_count: number;
  created_at: string;
  display_name: string | null;
  display_subtitle: string | null;
  city: string | null;
  region: string | null;
}

export interface DrilldownResult {
  items: DrilldownItem[];
  total: number;
  page: number;
  pageSize: number;
  filter: {
    source: string | null;
    city: string | null;
    region: string | null;
    rangeDays: number;
  };
}

type LeadSource = "host_lead" | "ig_lead" | "social_lead" | "provider_lead";
type FollowupStatus =
  | "new" | "attempting" | "connected" | "no_response"
  | "not_interested" | "converted" | "do_not_contact";
type TouchOutcome =
  | "sent" | "delivered" | "replied" | "bounced" | "no_answer"
  | "voicemail" | "interested" | "not_interested" | "meeting_booked" | "converted";

export const getFollowupDrilldown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      source: z.string().nullish(),
      city: z.string().nullish(),
      region: z.string().nullish(),
      rangeDays: z.number().int().min(1).max(365).default(90),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(10).max(100).default(25),
    }).parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<DrilldownResult> => {
    const since = new Date(Date.now() - data.rangeDays * 86400_000).toISOString();
    let q = supabaseAdmin
      .from("lead_followups")
      .select("id, source, lead_id, status, ai_score, last_outcome, last_touch_at, next_action_at, touch_count, created_at")
      .gte("created_at", since)
      .order("ai_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5000);
    if (data.source) q = q.eq("source", data.source as LeadSource);
    const { data: fups } = await q;
    let followups = fups ?? [];

    // City filter requires lead lookup
    const hostIds = followups.filter((f) => f.source === "host_lead").map((f) => f.lead_id);
    const igIds = followups.filter((f) => f.source === "ig_lead").map((f) => f.lead_id);
    const leadInfo = new Map<string, { city: string | null; region: string | null; name: string | null; subtitle: string | null }>();

    if (hostIds.length) {
      const { data: hl } = await supabaseAdmin
        .from("host_leads")
        .select("id, city, region, name, email, phone_e164")
        .in("id", hostIds);
      for (const r of hl ?? []) {
        leadInfo.set(`host_lead:${r.id}`, {
          city: r.city, region: r.region,
          name: r.name ?? null,
          subtitle: r.email ?? r.phone_e164 ?? null,
        });
      }
    }
    if (igIds.length) {
      const { data: il } = await supabaseAdmin
        .from("ig_leads")
        .select("id, query, profile_handle, profile_name")
        .in("id", igIds);
      for (const r of il ?? []) {
        leadInfo.set(`ig_lead:${r.id}`, {
          city: r.query ?? null, region: null,
          name: r.profile_name ?? r.profile_handle ?? null,
          subtitle: r.profile_handle ? `@${r.profile_handle}` : null,
        });
      }
    }

    if (data.city) {
      const want = data.city.trim().toLowerCase();
      followups = followups.filter((f) => {
        const li = leadInfo.get(`${f.source}:${f.lead_id}`);
        const c = (li?.city ?? "Unknown").trim().toLowerCase();
        return c === want;
      });
    }

    const total = followups.length;
    const start = (data.page - 1) * data.pageSize;
    const pageItems = followups.slice(start, start + data.pageSize);

    const items: DrilldownItem[] = pageItems.map((f) => {
      const li = leadInfo.get(`${f.source}:${f.lead_id}`);
      return {
        id: f.id,
        source: f.source as LeadSource,
        lead_id: f.lead_id,
        status: f.status as FollowupStatus,
        ai_score: f.ai_score,
        last_outcome: (f.last_outcome ?? null) as TouchOutcome | null,
        last_touch_at: f.last_touch_at,
        next_action_at: f.next_action_at,
        touch_count: f.touch_count ?? 0,
        created_at: f.created_at,
        display_name: li?.name ?? null,
        display_subtitle: li?.subtitle ?? null,
        city: li?.city ?? null,
        region: li?.region ?? null,
      };
    });

    return {
      items,
      total,
      page: data.page,
      pageSize: data.pageSize,
      filter: {
        source: data.source ?? null,
        city: data.city ?? null,
        region: data.region ?? null,
        rangeDays: data.rangeDays,
      },
    };
  });
