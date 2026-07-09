import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
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
const InputSchema = z.object({
  limit: z.number().int().min(10).max(500).default(100),
  /** how many recent runs to aggregate */
  runs: z.number().int().min(1).max(50).default(10),
  /** only return rows that have at least one source page of this template_type */
  templateType: z.string().min(1).max(60).optional(),
  /** filter by classification */
  klass: z.enum(["all", "broken", "redirected"]).default("all")
});
function classify(status) {
  const s = Number(status ?? 0);
  if (s >= 300 && s < 400) return "redirected";
  if (s === 0 || s === 404 || s === 410 || s >= 500 && s < 600) return "broken";
  if (s >= 400 && s < 500) return "broken";
  return "other";
}
const getLinkAuditDashboard_createServerFn_handler = createServerRpc({
  id: "50977da0f56beed28dafab7675260dffbcccd997227b6b5c63f5828fa60a86ee",
  name: "getLinkAuditDashboard",
  filename: "src/server/link-audit-dashboard.functions.ts"
}, (opts) => getLinkAuditDashboard.__executeServer(opts));
const getLinkAuditDashboard = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => InputSchema.parse(d ?? {})).handler(getLinkAuditDashboard_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  const {
    data: runs
  } = await sb.from("link_health_runs").select("id, ran_at, broken").order("ran_at", {
    ascending: false
  }).limit(data.runs);
  const runRows = runs || [];
  const byPath = /* @__PURE__ */ new Map();
  for (const r of runRows) {
    const arr = Array.isArray(r.broken) ? r.broken : [];
    for (const b of arr) {
      const path = String(b?.path ?? "").trim();
      if (!path) continue;
      const key = path;
      const cur = byPath.get(key) || {
        path,
        hits: 0,
        lastStatus: null,
        lastReason: "",
        sources: /* @__PURE__ */ new Set()
      };
      cur.hits += 1;
      cur.lastStatus = typeof b?.status === "number" ? b.status : cur.lastStatus;
      cur.lastReason = String(b?.reason ?? cur.lastReason ?? "");
      const src = String(b?.source ?? "").trim();
      if (src && src !== "(seed)") cur.sources.add(src);
      byPath.set(key, cur);
    }
  }
  const allSources = /* @__PURE__ */ new Set();
  for (const a of byPath.values()) for (const s of a.sources) allSources.add(s);
  const sourcePaths = Array.from(allSources).slice(0, 5e3);
  const sourceMeta = /* @__PURE__ */ new Map();
  if (sourcePaths.length) {
    for (let i = 0; i < sourcePaths.length; i += 200) {
      const chunk = sourcePaths.slice(i, i + 200);
      const {
        data: pages
      } = await sb.from("content_pages").select("url_path, template_type").in("url_path", chunk);
      for (const p of pages || []) {
        sourceMeta.set(p.url_path, p.template_type ?? null);
      }
    }
  }
  let totalBrokenEntries = 0;
  const allRows = [];
  const allTemplateTypes = /* @__PURE__ */ new Set();
  for (const a of byPath.values()) {
    const klass = classify(a.lastStatus);
    const sources = Array.from(a.sources).map((p) => ({
      path: p,
      templateType: sourceMeta.get(p) ?? null
    }));
    const templateTypes = Array.from(new Set(sources.map((s) => s.templateType).filter((t) => !!t)));
    for (const t of templateTypes) allTemplateTypes.add(t);
    totalBrokenEntries += a.hits;
    allRows.push({
      path: a.path,
      hits: a.hits,
      status: a.lastStatus,
      reason: a.lastReason,
      klass,
      sources,
      templateTypes
    });
  }
  let filtered = allRows;
  if (data.klass !== "all") filtered = filtered.filter((r) => r.klass === data.klass);
  if (data.templateType) {
    const tt = data.templateType;
    filtered = filtered.filter((r) => r.templateTypes.includes(tt));
  }
  filtered.sort((a, b) => b.hits - a.hits || a.path.localeCompare(b.path));
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    runsConsidered: runRows.length,
    totalBrokenEntries,
    templateTypes: Array.from(allTemplateTypes).sort(),
    rows: filtered.slice(0, data.limit)
  };
});
export {
  getLinkAuditDashboard_createServerFn_handler
};
