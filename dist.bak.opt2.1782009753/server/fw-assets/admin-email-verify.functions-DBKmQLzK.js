import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
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
const API_BASE = "https://app.emailverify.io/api";
const VALID_STATUSES = /* @__PURE__ */ new Set(["valid"]);
function isSendable(status) {
  if (!status) return false;
  return VALID_STATUSES.has(status.toLowerCase());
}
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const getEmailVerifyBalance_createServerFn_handler = createServerRpc({
  id: "0e199a31686823a745e07fad9b717c60b8ea24a01088ddc2fa9f161a39d22c80",
  name: "getEmailVerifyBalance",
  filename: "src/server/admin-email-verify.functions.ts"
}, (opts) => getEmailVerifyBalance.__executeServer(opts));
const getEmailVerifyBalance = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getEmailVerifyBalance_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const key = process.env.EMAILVERIFY_API_KEY;
  if (!key) return {
    ok: false,
    error: "EMAILVERIFY_API_KEY not configured"
  };
  try {
    const res = await fetch(`${API_BASE}/v2/check-account-balance?key=${encodeURIComponent(key)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return {
      ok: false,
      error: `Balance check failed (${res.status})`,
      raw: data
    };
    return {
      ok: true,
      status: data.api_status,
      credits: data.available_credits ?? 0
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "Network error"
    };
  }
});
const getEmailVerifyStats_createServerFn_handler = createServerRpc({
  id: "1cd2279de169d725f82cbb992e95dbbc500811fe24aee9efc8f3e173aae2d18c",
  name: "getEmailVerifyStats",
  filename: "src/server/admin-email-verify.functions.ts"
}, (opts) => getEmailVerifyStats.__executeServer(opts));
const getEmailVerifyStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getEmailVerifyStats_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  try {
    const {
      data,
      error
    } = await supabaseAdmin.from("host_leads").select("email_status, email_sendable, email_verified_at");
    if (error) throw error;
    const total = data?.length || 0;
    const verified = data?.filter((r) => r.email_verified_at).length || 0;
    const unverified = total - verified;
    const sendable = data?.filter((r) => r.email_sendable === true).length || 0;
    const invalid = data?.filter((r) => r.email_verified_at && r.email_sendable === false).length || 0;
    const byStatus = {};
    for (const r of data || []) {
      if (r.email_status) byStatus[r.email_status] = (byStatus[r.email_status] || 0) + 1;
    }
    return {
      ok: true,
      total,
      verified,
      unverified,
      sendable,
      invalid,
      byStatus
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "Stats failed",
      total: 0,
      verified: 0,
      unverified: 0,
      sendable: 0,
      invalid: 0,
      byStatus: {}
    };
  }
});
const verifyHostLeadBatch_createServerFn_handler = createServerRpc({
  id: "70c63b88de77e94ff0369a104d532e357bf6aff7a591587b212edda6bdb61edd",
  name: "verifyHostLeadBatch",
  filename: "src/server/admin-email-verify.functions.ts"
}, (opts) => verifyHostLeadBatch.__executeServer(opts));
const verifyHostLeadBatch = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator(z.object({
  limit: z.number().min(1).max(100).default(25)
}).parse).handler(verifyHostLeadBatch_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const key = process.env.EMAILVERIFY_API_KEY;
  if (!key) return {
    ok: false,
    error: "EMAILVERIFY_API_KEY not configured",
    processed: 0,
    results: []
  };
  try {
    const {
      data: rows,
      error
    } = await supabaseAdmin.from("host_leads").select("id, email").is("email_verified_at", null).order("created_at", {
      ascending: false
    }).limit(data.limit);
    if (error) throw error;
    if (!rows || rows.length === 0) {
      return {
        ok: true,
        processed: 0,
        results: [],
        message: "No unverified leads remaining"
      };
    }
    const results = [];
    for (const row of rows) {
      try {
        const url = `${API_BASE}/v1/validate?key=${encodeURIComponent(key)}&email=${encodeURIComponent(row.email)}`;
        const res = await fetch(url);
        const v = await res.json().catch(() => ({}));
        if (!res.ok) {
          results.push({
            id: row.id,
            email: row.email,
            status: "error",
            sub_status: "",
            sendable: false,
            error: v?.error || `HTTP ${res.status}`
          });
          if (res.status === 401 || res.status === 402 || /credit/i.test(JSON.stringify(v))) break;
          continue;
        }
        const status = String(v.status || "unknown").toLowerCase();
        const sub = String(v.sub_status || "");
        const sendable = isSendable(status);
        await supabaseAdmin.from("host_leads").update({
          email_status: status,
          email_sub_status: sub,
          email_sendable: sendable,
          email_verified_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", row.id);
        results.push({
          id: row.id,
          email: row.email,
          status,
          sub_status: sub,
          sendable
        });
      } catch (e) {
        results.push({
          id: row.id,
          email: row.email,
          status: "error",
          sub_status: "",
          sendable: false,
          error: e?.message || "Request failed"
        });
      }
    }
    return {
      ok: true,
      processed: results.length,
      results
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "Batch failed",
      processed: 0,
      results: []
    };
  }
});
const listVerifiedLeads_createServerFn_handler = createServerRpc({
  id: "6340da91574d15a251a5bec78865c862bf9ec79fcf2e2798f8476063e9c0a0f8",
  name: "listVerifiedLeads",
  filename: "src/server/admin-email-verify.functions.ts"
}, (opts) => listVerifiedLeads.__executeServer(opts));
const listVerifiedLeads = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator(z.object({
  filter: z.enum(["all", "sendable", "invalid", "unverified"]).default("all")
}).parse).handler(listVerifiedLeads_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  try {
    let q = supabaseAdmin.from("host_leads").select("id, name, email, phone_e164, city, region, created_at, email_status, email_sub_status, email_sendable, email_verified_at").order("created_at", {
      ascending: false
    }).limit(500);
    if (data.filter === "sendable") q = q.eq("email_sendable", true);
    else if (data.filter === "invalid") q = q.eq("email_sendable", false);
    else if (data.filter === "unverified") q = q.is("email_verified_at", null);
    const {
      data: rows,
      error
    } = await q;
    if (error) throw error;
    return {
      ok: true,
      rows: rows || []
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "Load failed",
      rows: []
    };
  }
});
export {
  getEmailVerifyBalance_createServerFn_handler,
  getEmailVerifyStats_createServerFn_handler,
  listVerifiedLeads_createServerFn_handler,
  verifyHostLeadBatch_createServerFn_handler
};
