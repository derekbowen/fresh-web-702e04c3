import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
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
async function requireAdmin(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Not authorized");
  return supabaseAdmin;
}
function rangeStart(range) {
  const ms = range === "24h" ? 864e5 : range === "7d" ? 7 * 864e5 : 30 * 864e5;
  return new Date(Date.now() - ms).toISOString();
}
const getDeliverabilityStats_createServerFn_handler = createServerRpc({
  id: "f0cb6905eba0f5a089b7ee924350d6940cd8f2fe75fa831e7675c6a2fda59397",
  name: "getDeliverabilityStats",
  filename: "src/server/email-deliverability.functions.ts"
}, (opts) => getDeliverabilityStats.__executeServer(opts));
const getDeliverabilityStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => ({
  range: input?.range ?? "7d"
})).handler(getDeliverabilityStats_createServerFn_handler, async ({
  data,
  context
}) => {
  try {
    const {
      userId
    } = context;
    const sb = await requireAdmin(userId);
    const since = rangeStart(data.range);
    const {
      data: rows,
      error
    } = await sb.from("email_send_log").select("message_id, template_name, status, created_at").gte("created_at", since).order("created_at", {
      ascending: false
    }).limit(2e4);
    if (error) throw error;
    const latest = /* @__PURE__ */ new Map();
    let nullKeyIdx = 0;
    for (const r of rows ?? []) {
      const key = r.message_id ?? `__null_${nullKeyIdx++}`;
      if (!latest.has(key)) latest.set(key, {
        template: r.template_name,
        status: r.status
      });
    }
    const stats = {
      total: latest.size,
      sent: 0,
      failed: 0,
      bounced: 0,
      complained: 0,
      suppressed: 0,
      pending: 0,
      byTemplate: []
    };
    const tplMap = /* @__PURE__ */ new Map();
    for (const v of latest.values()) {
      if (v.status === "sent") stats.sent++;
      else if (v.status === "bounced") stats.bounced++;
      else if (v.status === "complained") stats.complained++;
      else if (v.status === "suppressed") stats.suppressed++;
      else if (v.status === "pending") stats.pending++;
      else stats.failed++;
      const t = tplMap.get(v.template) ?? {
        sent: 0,
        failed: 0,
        bounced: 0
      };
      if (v.status === "sent") t.sent++;
      else if (v.status === "bounced") t.bounced++;
      else if (v.status !== "pending") t.failed++;
      tplMap.set(v.template, t);
    }
    stats.byTemplate = Array.from(tplMap.entries()).map(([template, t]) => ({
      template,
      ...t
    })).sort((a, b) => b.sent + b.failed + b.bounced - (a.sent + a.failed + a.bounced)).slice(0, 25);
    return {
      ok: true,
      stats
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message ?? "Failed to load stats"
    };
  }
});
const getDeliverabilityLog_createServerFn_handler = createServerRpc({
  id: "52fde4b573c10d1d9329a5933b8294b9b35a104e6107454152742daaca53a71a",
  name: "getDeliverabilityLog",
  filename: "src/server/email-deliverability.functions.ts"
}, (opts) => getDeliverabilityLog.__executeServer(opts));
const getDeliverabilityLog = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => ({
  range: input?.range ?? "7d",
  status: input?.status ?? "all",
  template: input?.template ?? "all",
  q: input?.q?.trim().toLowerCase() ?? "",
  limit: Math.min(input?.limit ?? 200, 500)
})).handler(getDeliverabilityLog_createServerFn_handler, async ({
  data,
  context
}) => {
  try {
    const {
      userId
    } = context;
    const sb = await requireAdmin(userId);
    const since = rangeStart(data.range);
    let query = sb.from("email_send_log").select("message_id, template_name, recipient_email, status, error_message, created_at").gte("created_at", since).order("created_at", {
      ascending: false
    }).limit(5e3);
    if (data.template !== "all") query = query.eq("template_name", data.template);
    if (data.q) query = query.ilike("recipient_email", `%${data.q}%`);
    const {
      data: rows,
      error
    } = await query;
    if (error) throw error;
    const latest = /* @__PURE__ */ new Map();
    let nullKeyIdx = 0;
    for (const r of rows ?? []) {
      const key = r.message_id ?? `__null_${nullKeyIdx++}`;
      if (!latest.has(key)) latest.set(key, r);
    }
    let result = Array.from(latest.values());
    if (data.status !== "all") result = result.filter((r) => r.status === data.status);
    result = result.slice(0, data.limit);
    const {
      data: tplRows
    } = await sb.from("email_send_log").select("template_name").gte("created_at", rangeStart("30d")).limit(5e3);
    const templates = Array.from(new Set((tplRows ?? []).map((r) => r.template_name))).sort();
    return {
      ok: true,
      rows: result,
      templates
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message ?? "Failed to load log"
    };
  }
});
const getSuppressions_createServerFn_handler = createServerRpc({
  id: "b8a1e1921902dbf68a352ddcb5fec294660a93a020c1d0d903b32895277262a4",
  name: "getSuppressions",
  filename: "src/server/email-deliverability.functions.ts"
}, (opts) => getSuppressions.__executeServer(opts));
const getSuppressions = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => ({
  q: input?.q?.trim().toLowerCase() ?? "",
  reason: input?.reason ?? "all",
  limit: Math.min(input?.limit ?? 200, 500)
})).handler(getSuppressions_createServerFn_handler, async ({
  data,
  context
}) => {
  try {
    const {
      userId
    } = context;
    const sb = await requireAdmin(userId);
    let query = sb.from("suppressed_emails").select("email, reason, created_at").order("created_at", {
      ascending: false
    }).limit(data.limit);
    if (data.reason !== "all") query = query.eq("reason", data.reason);
    if (data.q) query = query.ilike("email", `%${data.q}%`);
    const {
      data: rows,
      error
    } = await query;
    if (error) throw error;
    const {
      data: all
    } = await sb.from("suppressed_emails").select("reason");
    const counts = {
      bounce: 0,
      complaint: 0,
      unsubscribe: 0
    };
    for (const r of all ?? []) counts[r.reason] = (counts[r.reason] ?? 0) + 1;
    return {
      ok: true,
      rows: rows ?? [],
      counts
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message ?? "Failed to load suppressions"
    };
  }
});
const removeSuppression_createServerFn_handler = createServerRpc({
  id: "b1eb7b860b1766661e5a8669dc1c357ae0d312f2b36cf54cebb37048275ccef8",
  name: "removeSuppression",
  filename: "src/server/email-deliverability.functions.ts"
}, (opts) => removeSuppression.__executeServer(opts));
const removeSuppression = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => {
  const email = input?.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  return {
    email
  };
}).handler(removeSuppression_createServerFn_handler, async ({
  data,
  context
}) => {
  try {
    const {
      userId
    } = context;
    const sb = await requireAdmin(userId);
    const {
      error
    } = await sb.from("suppressed_emails").delete().eq("email", data.email);
    if (error) throw error;
    return {
      ok: true
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message ?? "Failed to remove"
    };
  }
});
const addSuppression_createServerFn_handler = createServerRpc({
  id: "340f36031167a774ec1f65a5247288e23ddeecae00c8ffe95200abacbe56c6bd",
  name: "addSuppression",
  filename: "src/server/email-deliverability.functions.ts"
}, (opts) => addSuppression.__executeServer(opts));
const addSuppression = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => {
  const email = input?.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  const reason = input?.reason ?? "unsubscribe";
  return {
    email,
    reason
  };
}).handler(addSuppression_createServerFn_handler, async ({
  data,
  context
}) => {
  try {
    const {
      userId
    } = context;
    const sb = await requireAdmin(userId);
    const {
      error
    } = await sb.from("suppressed_emails").upsert({
      email: data.email,
      reason: data.reason,
      metadata: {
        added_by: userId,
        manual: true
      }
    }, {
      onConflict: "email"
    });
    if (error) throw error;
    return {
      ok: true
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message ?? "Failed to add"
    };
  }
});
export {
  addSuppression_createServerFn_handler,
  getDeliverabilityLog_createServerFn_handler,
  getDeliverabilityStats_createServerFn_handler,
  getSuppressions_createServerFn_handler,
  removeSuppression_createServerFn_handler
};
