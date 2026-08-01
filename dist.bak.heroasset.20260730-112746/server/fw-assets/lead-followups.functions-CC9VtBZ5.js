import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
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
async function isAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}
function denied(extra) {
  return {
    ...extra,
    error: "Forbidden"
  };
}
const getFollowupInbox_createServerFn_handler = createServerRpc({
  id: "8404956fca184665ffcbb34fcb5c220c619fd6f63755d8b24173d3685980daea",
  name: "getFollowupInbox",
  filename: "src/lib/lead-followups.functions.ts"
}, (opts) => getFollowupInbox.__executeServer(opts));
const getFollowupInbox = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["all", "new", "attempting", "connected", "no_response", "not_interested", "converted", "do_not_contact"]).optional(),
  source: z.enum(["all", "host_lead", "ig_lead", "social_lead", "provider_lead"]).optional(),
  sort: z.enum(["score", "newest", "next_action"]).optional(),
  limit: z.number().int().min(1).max(500).optional()
}).parse(d ?? {})).handler(getFollowupInbox_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  if (!await isAdmin(userId)) {
    return denied({
      rows: []
    });
  }
  try {
    let q = supabaseAdmin.from("lead_followups").select("*").limit(data.limit ?? 200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.source && data.source !== "all") q = q.eq("source", data.source);
    if (data.sort === "next_action") {
      q = q.order("next_action_at", {
        ascending: true,
        nullsFirst: false
      });
    } else if (data.sort === "newest") {
      q = q.order("created_at", {
        ascending: false
      });
    } else {
      q = q.order("ai_score", {
        ascending: false,
        nullsFirst: false
      }).order("created_at", {
        ascending: false
      });
    }
    const {
      data: rows,
      error
    } = await q;
    if (error) throw error;
    const bySource = {
      host_lead: [],
      ig_lead: [],
      social_lead: [],
      provider_lead: []
    };
    for (const r of rows ?? []) bySource[r.source]?.push(r.lead_id);
    const lookups = /* @__PURE__ */ new Map();
    const k = (s, id) => `${s}:${id}`;
    if (bySource.host_lead.length) {
      const {
        data: hl
      } = await supabaseAdmin.from("host_leads").select("id, name, email, phone_e164, city, region").in("id", bySource.host_lead);
      for (const r of hl ?? []) {
        lookups.set(k("host_lead", r.id), {
          name: r.name,
          subtitle: [r.city, r.region].filter(Boolean).join(", ") || r.email,
          link: r.phone_e164 ? `tel:${r.phone_e164}` : `mailto:${r.email}`
        });
      }
    }
    if (bySource.ig_lead.length) {
      const {
        data: il
      } = await supabaseAdmin.from("ig_leads").select("id, profile_handle, profile_name, instagram_url, snippet").in("id", bySource.ig_lead);
      for (const r of il ?? []) {
        lookups.set(k("ig_lead", r.id), {
          name: r.profile_name || r.profile_handle || "IG lead",
          subtitle: r.snippet?.slice(0, 120) ?? null,
          link: r.instagram_url
        });
      }
    }
    const out = (rows ?? []).map((r) => {
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
        display_link: look?.link ?? null
      };
    });
    return {
      rows: out,
      error: null
    };
  } catch (e) {
    console.error("[followup-inbox] failed", e);
    return {
      rows: [],
      error: e instanceof Error ? e.message : "Failed"
    };
  }
});
const updateFollowup_createServerFn_handler = createServerRpc({
  id: "febfe38c97fa3a15ae7724864767fb2d35205dd0336258ca6f98378fef8f4425",
  name: "updateFollowup",
  filename: "src/lib/lead-followups.functions.ts"
}, (opts) => updateFollowup.__executeServer(opts));
const updateFollowup = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "attempting", "connected", "no_response", "not_interested", "converted", "do_not_contact"]).optional(),
  next_action_at: z.string().nullable().optional(),
  notes: z.string().max(4e3).nullable().optional()
}).parse(d)).handler(updateFollowup_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  if (!await isAdmin(userId)) return {
    ok: false,
    error: "Forbidden"
  };
  const patch = {};
  if (data.status !== void 0) patch.status = data.status;
  if (data.next_action_at !== void 0) patch.next_action_at = data.next_action_at;
  if (data.notes !== void 0) patch.notes = data.notes;
  const {
    error
  } = await supabaseAdmin.from("lead_followups").update(patch).eq("id", data.id);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    error: null
  };
});
const logTouch_createServerFn_handler = createServerRpc({
  id: "b26d8c3c8196e8f65dfee018911296dee203eb684fd3033fe75559316dda448d",
  name: "logTouch",
  filename: "src/lib/lead-followups.functions.ts"
}, (opts) => logTouch.__executeServer(opts));
const logTouch = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  followup_id: z.string().uuid(),
  channel: z.enum(["sms", "call", "email", "dm", "note", "other"]),
  outcome: z.enum(["sent", "delivered", "replied", "bounced", "no_answer", "voicemail", "interested", "not_interested", "meeting_booked", "converted"]).nullable().optional(),
  body: z.string().max(4e3).nullable().optional()
}).parse(d)).handler(logTouch_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  if (!await isAdmin(userId)) return {
    ok: false,
    error: "Forbidden"
  };
  const {
    error
  } = await supabaseAdmin.from("lead_touches").insert({
    followup_id: data.followup_id,
    channel: data.channel,
    outcome: data.outcome ?? null,
    body: data.body ?? null,
    by_user_id: userId
  });
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    error: null
  };
});
const getTouches_createServerFn_handler = createServerRpc({
  id: "f374c38bad61a2c47688980d05f1207efa58882bb1a89466e339d07ba040c76c",
  name: "getTouches",
  filename: "src/lib/lead-followups.functions.ts"
}, (opts) => getTouches.__executeServer(opts));
const getTouches = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  followup_id: z.string().uuid()
}).parse(d)).handler(getTouches_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  if (!await isAdmin(userId)) return {
    rows: [],
    error: "Forbidden"
  };
  const {
    data: rows,
    error
  } = await supabaseAdmin.from("lead_touches").select("*").eq("followup_id", data.followup_id).order("occurred_at", {
    ascending: false
  });
  if (error) return {
    rows: [],
    error: error.message
  };
  return {
    rows: rows ?? [],
    error: null
  };
});
const SCORING_MODEL = "google/gemini-3-flash-preview";
async function scoreOne(input) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  const sys = "You score pool-rental host leads 0-100 for likelihood to list a backyard pool on poolrentalnearme.com. Higher = better. Score only, return tool call.";
  const user = `Lead source: ${input.source}

${input.context}

Consider: real pool indicators in bio/captions, location demand (CA/TX/FL/AZ high), profile completeness, contact intent signals, suburban single-family hints, age cohort. Penalize commercial accounts, agents, condos, vague bios.`;
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: SCORING_MODEL,
        messages: [{
          role: "system",
          content: sys
        }, {
          role: "user",
          content: user
        }],
        tools: [{
          type: "function",
          function: {
            name: "score_lead",
            description: "Return a 0-100 score and one-sentence reason.",
            parameters: {
              type: "object",
              properties: {
                score: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100
                },
                reason: {
                  type: "string",
                  maxLength: 240
                }
              },
              required: ["score", "reason"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: {
          type: "function",
          function: {
            name: "score_lead"
          }
        }
      })
    });
    if (!resp.ok) {
      console.warn("[ai-score] gateway", resp.status);
      return null;
    }
    const json = await resp.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    const reason = String(parsed.reason ?? "").slice(0, 240);
    return {
      score,
      reason
    };
  } catch (e) {
    console.error("[ai-score] failed", e);
    return null;
  }
}
async function buildContextForLead(source, leadId) {
  if (source === "host_lead") {
    const {
      data: r
    } = await supabaseAdmin.from("host_leads").select("name, email, phone_e164, city, region, page, email_sendable").eq("id", leadId).maybeSingle();
    if (!r) return null;
    return `Name: ${r.name}
Email: ${r.email} (sendable: ${r.email_sendable})
Phone: ${r.phone_e164}
Location: ${r.city ?? ""}, ${r.region ?? ""}
Landing page: ${r.page ?? ""}`;
  }
  if (source === "ig_lead") {
    const {
      data: r
    } = await supabaseAdmin.from("ig_leads").select("profile_handle, profile_name, snippet, query, instagram_url").eq("id", leadId).maybeSingle();
    if (!r) return null;
    return `Handle: ${r.profile_handle}
Name: ${r.profile_name ?? ""}
Bio/snippet: ${r.snippet ?? ""}
Found via query: ${r.query ?? ""}
URL: ${r.instagram_url}`;
  }
  return null;
}
const aiScoreFollowup_createServerFn_handler = createServerRpc({
  id: "2847a868ec2f518d61b90ae38ad0a6b05a42679e39885a7f28bc5472947122b4",
  name: "aiScoreFollowup",
  filename: "src/lib/lead-followups.functions.ts"
}, (opts) => aiScoreFollowup.__executeServer(opts));
const aiScoreFollowup = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(aiScoreFollowup_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  if (!await isAdmin(userId)) return {
    ok: false,
    score: null,
    reason: null,
    error: "Forbidden"
  };
  const {
    data: f
  } = await supabaseAdmin.from("lead_followups").select("id, source, lead_id").eq("id", data.id).maybeSingle();
  if (!f) return {
    ok: false,
    score: null,
    reason: null,
    error: "Not found"
  };
  const ctx = await buildContextForLead(f.source, f.lead_id);
  if (!ctx) return {
    ok: false,
    score: null,
    reason: null,
    error: "Lead missing"
  };
  const out = await scoreOne({
    source: f.source,
    context: ctx
  });
  if (!out) return {
    ok: false,
    score: null,
    reason: null,
    error: "AI scoring failed"
  };
  const {
    error
  } = await supabaseAdmin.from("lead_followups").update({
    ai_score: out.score,
    ai_score_reason: out.reason,
    ai_scored_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.id);
  if (error) return {
    ok: false,
    score: null,
    reason: null,
    error: error.message
  };
  return {
    ok: true,
    score: out.score,
    reason: out.reason,
    error: null
  };
});
const aiScoreUnscored_createServerFn_handler = createServerRpc({
  id: "67d1a19e82f7379a1dc4cef9d75188a1cded1dc9e030cc32f8722d50c3c60038",
  name: "aiScoreUnscored",
  filename: "src/lib/lead-followups.functions.ts"
}, (opts) => aiScoreUnscored.__executeServer(opts));
const aiScoreUnscored = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(50).optional()
}).parse(d ?? {})).handler(aiScoreUnscored_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  if (!await isAdmin(userId)) return {
    processed: 0,
    error: "Forbidden"
  };
  const {
    data: rows
  } = await supabaseAdmin.from("lead_followups").select("id, source, lead_id").is("ai_score", null).order("created_at", {
    ascending: false
  }).limit(data.limit ?? 10);
  let processed = 0;
  for (const r of rows ?? []) {
    const ctx = await buildContextForLead(r.source, r.lead_id);
    if (!ctx) continue;
    const out = await scoreOne({
      source: r.source,
      context: ctx
    });
    if (!out) continue;
    await supabaseAdmin.from("lead_followups").update({
      ai_score: out.score,
      ai_score_reason: out.reason,
      ai_scored_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", r.id);
    processed++;
  }
  return {
    processed,
    error: null
  };
});
export {
  aiScoreFollowup_createServerFn_handler,
  aiScoreUnscored_createServerFn_handler,
  getFollowupInbox_createServerFn_handler,
  getTouches_createServerFn_handler,
  logTouch_createServerFn_handler,
  updateFollowup_createServerFn_handler
};
