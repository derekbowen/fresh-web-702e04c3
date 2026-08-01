import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { s as sendViaEmailit } from "./emailit-DRsipvVx.js";
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
const sb = () => supabaseAdmin;
async function assertAdmin(userId) {
  const {
    data
  } = await sb().from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}
function normalizeListingUrl(input) {
  let u = (input || "").trim();
  if (!u) return u;
  if (!/^https?:\/\//i.test(u)) {
    u = `https://www.poolrentalnearme.com${u.startsWith("/") ? "" : "/"}${u}`;
  }
  return u;
}
async function scrapeListing(url) {
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) throw new Error("FIRECRAWL_API_KEY not configured");
  const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fcKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
      onlyMainContent: true
    })
  });
  if (!resp.ok) throw new Error(`Firecrawl ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = await resp.json();
  const data = j?.data || j || {};
  return {
    html: data.html || "",
    markdown: data.markdown || "",
    title: data?.metadata?.title || data?.metadata?.ogTitle || ""
  };
}
const auditListing_createServerFn_handler = createServerRpc({
  id: "99e9cc7e516ac2c4cf98a1361b7697dead878f774e22434dd718b63a40237628",
  name: "auditListing",
  filename: "src/server/admin-listing-audit.functions.ts"
}, (opts) => auditListing.__executeServer(opts));
const auditListing = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  listing_url: z.string().min(5).max(500),
  host_email: z.string().email().max(255).optional().or(z.literal("")),
  host_name: z.string().max(120).optional().or(z.literal("")),
  send_email: z.boolean().default(false)
}).parse(d)).handler(auditListing_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const lovKey = process.env.LOVABLE_API_KEY;
  if (!lovKey) return {
    ok: false,
    error: "LOVABLE_API_KEY not configured"
  };
  const url = normalizeListingUrl(data.listing_url);
  let scraped;
  try {
    scraped = await scrapeListing(url);
  } catch (e) {
    return {
      ok: false,
      error: `Could not fetch listing: ${e?.message || e}`
    };
  }
  const body = (scraped.markdown || scraped.html.replace(/<[^>]+>/g, " ")).slice(0, 9e3);
  if (body.trim().length < 100) {
    return {
      ok: false,
      error: "Listing page returned almost no content. Double-check the URL."
    };
  }
  const prompt = `You are an expert pool rental marketplace listing coach for Pool Rental Near Me (a Swimply-style platform).
Audit this host listing. Score 0-100 against best-in-class listings (great photos, clear amenities, fair pricing $40-150/hr typical, detailed description, house rules, response info).
Return STRICT JSON only, no markdown fences:
{
  "score": <0-100>,
  "summary": "<one sentence overall verdict written to the host>",
  "strengths": ["<short bullet>", ...],
  "weaknesses": ["<short bullet>", ...],
  "recommendations": ["<specific actionable bullet>", ...],
  "pricing_notes": "<2-3 sentences on pricing positioning>",
  "photo_notes": "<2-3 sentences on photo quality, count, angles>"
}

Listing URL: ${url}
Listing title: ${scraped.title || "(unknown)"}

Listing content (truncated):
${body}`;
  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{
        role: "user",
        content: prompt
      }]
    })
  });
  if (!aiResp.ok) return {
    ok: false,
    error: `AI ${aiResp.status}: ${(await aiResp.text()).slice(0, 200)}`
  };
  const aiJson = await aiResp.json();
  const content = aiJson?.choices?.[0]?.message?.content || "";
  const cleaned = content.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      ok: false,
      error: "AI returned non-JSON",
      raw: content.slice(0, 300)
    };
  }
  const hostEmail = (data.host_email || "").trim() || null;
  const hostName = (data.host_name || "").trim() || null;
  const {
    data: row,
    error
  } = await sb().from("listing_audits").insert({
    listing_url: url,
    listing_title: scraped.title || null,
    host_email: hostEmail,
    host_name: hostName,
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    summary: String(parsed.summary || "").slice(0, 1e3),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 20) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 20) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 20) : [],
    pricing_notes: parsed.pricing_notes ? String(parsed.pricing_notes).slice(0, 2e3) : null,
    photo_notes: parsed.photo_notes ? String(parsed.photo_notes).slice(0, 2e3) : null,
    raw_excerpt: body.slice(0, 4e3),
    created_by: context.userId
  }).select("*").maybeSingle();
  if (error) return {
    ok: false,
    error: error.message
  };
  let emailResult = {
    sent: false
  };
  if (data.send_email && hostEmail) {
    emailResult = await sendListingAuditEmailInternal(row);
    await sb().from("listing_audits").update({
      emailed_at: emailResult.sent ? (/* @__PURE__ */ new Date()).toISOString() : null,
      email_status: emailResult.sent ? "sent" : `error: ${emailResult.error || "unknown"}`
    }).eq("id", row.id);
  }
  const {
    data: refreshed
  } = await sb().from("listing_audits").select("*").eq("id", row.id).maybeSingle();
  return {
    ok: true,
    audit: refreshed,
    email: emailResult
  };
});
function renderAuditHtml(row) {
  const items = (arr, emoji) => (arr || []).map((s) => `<li style="margin:6px 0;">${emoji} ${escape(String(s))}</li>`).join("");
  const greeting = row.host_name ? `Hi ${escape(row.host_name)},` : "Hi there,";
  const scoreColor = row.score >= 80 ? "#059669" : row.score >= 60 ? "#d97706" : "#dc2626";
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#ffffff;color:#0f172a;margin:0;padding:0;">
  <div style="max-width:640px;margin:0 auto;padding:24px 20px;">
    <h1 style="font-size:22px;margin:0 0 4px;">Your Pool Rental Near Me listing audit</h1>
    <p style="color:#64748b;margin:0 0 20px;font-size:13px;">${escape(row.listing_url)}</p>

    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 20px;">We ran a free AI audit on your listing. Here is what stood out and how to push more bookings your way.</p>

    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin:0 0 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;">Overall score</div>
        <div style="font-size:14px;color:#334155;margin-top:4px;">${escape(row.summary || "")}</div>
      </div>
      <div style="font-size:44px;font-weight:800;color:${scoreColor};line-height:1;">${row.score ?? "—"}</div>
    </div>

    <h2 style="font-size:15px;margin:20px 0 6px;">What you're doing well</h2>
    <ul style="padding-left:20px;margin:0 0 16px;">${items(row.strengths, "✅")}</ul>

    <h2 style="font-size:15px;margin:20px 0 6px;">Where you're losing bookings</h2>
    <ul style="padding-left:20px;margin:0 0 16px;">${items(row.weaknesses, "⚠️")}</ul>

    <h2 style="font-size:15px;margin:20px 0 6px;">Do these next</h2>
    <ul style="padding-left:20px;margin:0 0 16px;">${items(row.recommendations, "👉")}</ul>

    ${row.pricing_notes ? `<h2 style="font-size:15px;margin:20px 0 6px;">Pricing</h2><p style="margin:0 0 14px;">${escape(row.pricing_notes)}</p>` : ""}
    ${row.photo_notes ? `<h2 style="font-size:15px;margin:20px 0 6px;">Photos</h2><p style="margin:0 0 14px;">${escape(row.photo_notes)}</p>` : ""}

    <p style="margin:24px 0 4px;color:#64748b;font-size:12px;">Pool Rental Near Me · 10% flat host fee · $2M liability included on every booking.</p>
  </div>
</body></html>`;
}
function escape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function sendListingAuditEmailInternal(row) {
  if (!row?.host_email) return {
    sent: false,
    error: "no host email"
  };
  try {
    await sendViaEmailit({
      from: "Pool Rental Near Me <hosts@poolrentalnearme.online>",
      to: row.host_email,
      subject: `Your listing audit: ${row.score}/100`,
      html: renderAuditHtml(row),
      replyTo: "hosts@poolrentalnearme.online"
    });
    return {
      sent: true
    };
  } catch (e) {
    return {
      sent: false,
      error: e?.message || String(e)
    };
  }
}
const emailListingAudit_createServerFn_handler = createServerRpc({
  id: "874bb6bc79cad05ffdf9e4f0c598bbc51182e9450ccf01dad73a36034c7f07af",
  name: "emailListingAudit",
  filename: "src/server/admin-listing-audit.functions.ts"
}, (opts) => emailListingAudit.__executeServer(opts));
const emailListingAudit = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  override_email: z.string().email().max(255).optional()
}).parse(d)).handler(emailListingAudit_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: row
  } = await sb().from("listing_audits").select("*").eq("id", data.id).maybeSingle();
  if (!row) return {
    ok: false,
    error: "Audit not found"
  };
  const target = {
    ...row,
    host_email: data.override_email || row.host_email
  };
  if (!target.host_email) return {
    ok: false,
    error: "No host email on file"
  };
  const r = await sendListingAuditEmailInternal(target);
  await sb().from("listing_audits").update({
    host_email: target.host_email,
    emailed_at: r.sent ? (/* @__PURE__ */ new Date()).toISOString() : row.emailed_at,
    email_status: r.sent ? "sent" : `error: ${r.error || "unknown"}`
  }).eq("id", data.id);
  return r.sent ? {
    ok: true
  } : {
    ok: false,
    error: r.error
  };
});
const listListingAudits_createServerFn_handler = createServerRpc({
  id: "9d7c5e251bb8725c981dc1834adcda2d30c40cea59e6819fa62f01252949f7b8",
  name: "listListingAudits",
  filename: "src/server/admin-listing-audit.functions.ts"
}, (opts) => listListingAudits.__executeServer(opts));
const listListingAudits = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(5).max(200).default(40)
}).parse(d ?? {})).handler(listListingAudits_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: rows
  } = await sb().from("listing_audits").select("*").order("audited_at", {
    ascending: false
  }).limit(data.limit);
  return {
    rows: rows || []
  };
});
const deleteListingAudit_createServerFn_handler = createServerRpc({
  id: "0e4cc244fd0e40108cd4f9679777bdebb4418c334199cb89f852d2c839ce5d52",
  name: "deleteListingAudit",
  filename: "src/server/admin-listing-audit.functions.ts"
}, (opts) => deleteListingAudit.__executeServer(opts));
const deleteListingAudit = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteListingAudit_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  await sb().from("listing_audits").delete().eq("id", data.id);
  return {
    ok: true
  };
});
export {
  auditListing_createServerFn_handler,
  deleteListingAudit_createServerFn_handler,
  emailListingAudit_createServerFn_handler,
  listListingAudits_createServerFn_handler
};
