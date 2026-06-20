/**
 * Unified lead follow-up tracker. Backs the /admin/follow-ups inbox and
 * lets admins log touches across host_leads, ig_leads, social_leads, and
 * provider_leads from one place. AI scoring uses Lovable AI to rank leads
 * 0-100 by likelihood-to-convert.
 *
 * Admin-only. All access via supabaseAdmin.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type LeadSource = "host_lead" | "ig_lead" | "social_lead" | "provider_lead";
export type FollowupStatus =
  | "new"
  | "attempting"
  | "connected"
  | "no_response"
  | "not_interested"
  | "converted"
  | "do_not_contact";
export type TouchChannel = "sms" | "call" | "email" | "dm" | "note" | "other";
export type TouchOutcome =
  | "sent"
  | "delivered"
  | "replied"
  | "bounced"
  | "no_answer"
  | "voicemail"
  | "interested"
  | "not_interested"
  | "meeting_booked"
  | "converted";

export interface FollowupRow {
  id: string;
  source: LeadSource;
  lead_id: string;
  status: FollowupStatus;
  ai_score: number | null;
  ai_score_reason: string | null;
  last_touch_at: string | null;
  next_action_at: string | null;
  last_outcome: TouchOutcome | null;
  touch_count: number;
  notes: string | null;
  created_at: string;
  // Joined snippet from the underlying lead row.
  display_name: string | null;
  display_subtitle: string | null;
  display_link: string | null;
}

export interface TouchRow {
  id: string;
  followup_id: string;
  channel: TouchChannel;
  outcome: TouchOutcome | null;
  body: string | null;
  occurred_at: string;
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

function denied<T>(extra: T): T & { error: string } {
  return { ...extra, error: "Forbidden" };
}

// ---------- list inbox ----------

export const getFollowupInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z
          .enum(["all", "new", "attempting", "connected", "no_response", "not_interested", "converted", "do_not_contact"])
          .optional(),
        source: z.enum(["all", "host_lead", "ig_lead", "social_lead", "provider_lead"]).optional(),
        sort: z.enum(["score", "newest", "next_action"]).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) {
      return denied({ rows: [] as FollowupRow[] });
    }
    try {
      let q = (supabaseAdmin as any).from("lead_followups").select("*").limit(data.limit ?? 200);
      if (data.status && data.status !== "all") q = q.eq("status", data.status);
      if (data.source && data.source !== "all") q = q.eq("source", data.source);

      if (data.sort === "next_action") {
        q = q.order("next_action_at", { ascending: true, nullsFirst: false });
      } else if (data.sort === "newest") {
        q = q.order("created_at", { ascending: false });
      } else {
        q = q.order("ai_score", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
      }

      const { data: rows, error } = await q;
      if (error) throw error;

      // Hydrate display fields by source.
      const bySource: Record<LeadSource, string[]> = {
        host_lead: [],
        ig_lead: [],
        social_lead: [],
        provider_lead: [],
      };
      for (const r of rows ?? []) bySource[r.source as LeadSource]?.push(r.lead_id);

      const lookups = new Map<string, { name: string | null; subtitle: string | null; link: string | null }>();
      const k = (s: LeadSource, id: string) => `${s}:${id}`;

      if (bySource.host_lead.length) {
        const { data: hl } = await (supabaseAdmin as any)
          .from("host_leads")
          .select("id, name, email, phone_e164, city, region")
          .in("id", bySource.host_lead);
        for (const r of hl ?? []) {
          lookups.set(k("host_lead", r.id), {
            name: r.name,
            subtitle: [r.city, r.region].filter(Boolean).join(", ") || r.email,
            link: r.phone_e164 ? `tel:${r.phone_e164}` : `mailto:${r.email}`,
          });
        }
      }
      if (bySource.ig_lead.length) {
        const { data: il } = await (supabaseAdmin as any)
          .from("ig_leads")
          .select("id, profile_handle, profile_name, instagram_url, snippet")
          .in("id", bySource.ig_lead);
        for (const r of il ?? []) {
          lookups.set(k("ig_lead", r.id), {
            name: r.profile_name || r.profile_handle || "IG lead",
            subtitle: r.snippet?.slice(0, 120) ?? null,
            link: r.instagram_url,
          });
        }
      }

      const out: FollowupRow[] = (rows ?? []).map((r: any) => {
        const look = lookups.get(k(r.source, r.lead_id));
        return {
          id: r.id,
          source: r.source,
          lead_id: r.lead_id,
          status: r.status,
          ai_score: r.ai_score,
          ai_score_reason: r.ai_score_reason,
          last_touch_at: r.last_touch_at,
          next_action_at: r.next_action_at,
          last_outcome: r.last_outcome,
          touch_count: r.touch_count,
          notes: r.notes,
          created_at: r.created_at,
          display_name: look?.name ?? null,
          display_subtitle: look?.subtitle ?? null,
          display_link: look?.link ?? null,
        };
      });
      return { rows: out, error: null as string | null };
    } catch (e) {
      console.error("[followup-inbox] failed", e);
      return { rows: [] as FollowupRow[], error: e instanceof Error ? e.message : "Failed" };
    }
  });

// ---------- update status / next action / notes ----------

export const updateFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z
          .enum(["new", "attempting", "connected", "no_response", "not_interested", "converted", "do_not_contact"])
          .optional(),
        next_action_at: z.string().nullable().optional(),
        notes: z.string().max(4000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { ok: false, error: "Forbidden" };
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.next_action_at !== undefined) patch.next_action_at = data.next_action_at;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await (supabaseAdmin as any).from("lead_followups").update(patch).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });

// ---------- log a touch ----------

export const logTouch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        followup_id: z.string().uuid(),
        channel: z.enum(["sms", "call", "email", "dm", "note", "other"]),
        outcome: z
          .enum([
            "sent",
            "delivered",
            "replied",
            "bounced",
            "no_answer",
            "voicemail",
            "interested",
            "not_interested",
            "meeting_booked",
            "converted",
          ])
          .nullable()
          .optional(),
        body: z.string().max(4000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { ok: false, error: "Forbidden" };
    const { error } = await (supabaseAdmin as any).from("lead_touches").insert({
      followup_id: data.followup_id,
      channel: data.channel,
      outcome: data.outcome ?? null,
      body: data.body ?? null,
      by_user_id: userId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });

// ---------- touches for a followup ----------

export const getTouches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ followup_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { rows: [] as TouchRow[], error: "Forbidden" as string | null };
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("lead_touches")
      .select("*")
      .eq("followup_id", data.followup_id)
      .order("occurred_at", { ascending: false });
    if (error) return { rows: [] as TouchRow[], error: error.message };
    return { rows: (rows ?? []) as TouchRow[], error: null as string | null };
  });

// ---------- AI scoring ----------

const SCORING_MODEL = "google/gemini-3-flash-preview";

async function scoreOne(input: {
  source: LeadSource;
  context: string;
}): Promise<{ score: number; reason: string } | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;

  const sys =
    "You score pool-rental host leads 0-100 for likelihood to list a backyard pool on poolrentalnearme.com. Higher = better. Score only, return tool call.";
  const user = `Lead source: ${input.source}\n\n${input.context}\n\nConsider: real pool indicators in bio/captions, location demand (CA/TX/FL/AZ high), profile completeness, contact intent signals, suburban single-family hints, age cohort. Penalize commercial accounts, agents, condos, vague bios.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: SCORING_MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_lead",
              description: "Return a 0-100 score and one-sentence reason.",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  reason: { type: "string", maxLength: 240 },
                },
                required: ["score", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_lead" } },
      }),
    });
    if (!resp.ok) {
      console.warn("[ai-score] gateway", resp.status);
      return null;
    }
    const json: any = await resp.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    const reason = String(parsed.reason ?? "").slice(0, 240);
    return { score, reason };
  } catch (e) {
    console.error("[ai-score] failed", e);
    return null;
  }
}

async function buildContextForLead(source: LeadSource, leadId: string): Promise<string | null> {
  if (source === "host_lead") {
    const { data: r } = await (supabaseAdmin as any)
      .from("host_leads")
      .select("name, email, phone_e164, city, region, page, email_sendable")
      .eq("id", leadId)
      .maybeSingle();
    if (!r) return null;
    return `Name: ${r.name}\nEmail: ${r.email} (sendable: ${r.email_sendable})\nPhone: ${r.phone_e164}\nLocation: ${r.city ?? ""}, ${r.region ?? ""}\nLanding page: ${r.page ?? ""}`;
  }
  if (source === "ig_lead") {
    const { data: r } = await (supabaseAdmin as any)
      .from("ig_leads")
      .select("profile_handle, profile_name, snippet, query, instagram_url")
      .eq("id", leadId)
      .maybeSingle();
    if (!r) return null;
    return `Handle: ${r.profile_handle}\nName: ${r.profile_name ?? ""}\nBio/snippet: ${r.snippet ?? ""}\nFound via query: ${r.query ?? ""}\nURL: ${r.instagram_url}`;
  }
  return null;
}

export const aiScoreFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { ok: false, score: null as number | null, reason: null as string | null, error: "Forbidden" };

    const { data: f } = await (supabaseAdmin as any)
      .from("lead_followups")
      .select("id, source, lead_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!f) return { ok: false, score: null, reason: null, error: "Not found" };

    const ctx = await buildContextForLead(f.source as LeadSource, f.lead_id);
    if (!ctx) return { ok: false, score: null, reason: null, error: "Lead missing" };

    const out = await scoreOne({ source: f.source as LeadSource, context: ctx });
    if (!out) return { ok: false, score: null, reason: null, error: "AI scoring failed" };

    const { error } = await (supabaseAdmin as any)
      .from("lead_followups")
      .update({ ai_score: out.score, ai_score_reason: out.reason, ai_scored_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) return { ok: false, score: null, reason: null, error: error.message };
    return { ok: true, score: out.score, reason: out.reason, error: null as string | null };
  });

export const aiScoreUnscored = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { processed: 0, error: "Forbidden" };
    const { data: rows } = await (supabaseAdmin as any)
      .from("lead_followups")
      .select("id, source, lead_id")
      .is("ai_score", null)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 10);

    let processed = 0;
    for (const r of rows ?? []) {
      const ctx = await buildContextForLead(r.source as LeadSource, r.lead_id);
      if (!ctx) continue;
      const out = await scoreOne({ source: r.source as LeadSource, context: ctx });
      if (!out) continue;
      await (supabaseAdmin as any)
        .from("lead_followups")
        .update({ ai_score: out.score, ai_score_reason: out.reason, ai_scored_at: new Date().toISOString() })
        .eq("id", r.id);
      processed++;
    }
    return { processed, error: null as string | null };
  });
