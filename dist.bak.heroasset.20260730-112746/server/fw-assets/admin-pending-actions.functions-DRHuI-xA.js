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
async function requireAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Not authorized");
}
const listPendingFailures_createServerFn_handler = createServerRpc({
  id: "93fc66fad9ec997fecba32b8afc03be58b59c7017f38ac192357daa55f5a51cb",
  name: "listPendingFailures",
  filename: "src/server/admin-pending-actions.functions.ts"
}, (opts) => listPendingFailures.__executeServer(opts));
const listPendingFailures = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  template_type: z.string().min(1),
  limit: z.number().int().min(1).max(500).default(100)
}).parse(d)).handler(listPendingFailures_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    data: pages
  } = await supabaseAdmin.from("content_pages").select("slug, url_path, title, status, updated_at").like("url_path", "/p/%").neq("status", "published").eq("template_type", data.template_type).order("updated_at", {
    ascending: false
  }).limit(data.limit);
  const slugs = (pages || []).map((p) => p.slug).filter(Boolean);
  const errMap = /* @__PURE__ */ new Map();
  if (slugs.length > 0) {
    const {
      data: plan
    } = await supabaseAdmin.from("content_plan").select("slug, last_error").in("slug", slugs);
    for (const r of plan || []) {
      if (r.last_error) errMap.set(r.slug, r.last_error);
    }
  }
  return (pages || []).map((p) => ({
    slug: p.slug,
    url_path: p.url_path,
    title: p.title,
    status: p.status,
    updated_at: p.updated_at,
    last_error: errMap.get(p.slug) ?? null
  }));
});
const retryPendingTemplate_createServerFn_handler = createServerRpc({
  id: "d75149d360af488d60156946c2fddf95ff5ecb088576b376da7a7f7dac4d4cf6",
  name: "retryPendingTemplate",
  filename: "src/server/admin-pending-actions.functions.ts"
}, (opts) => retryPendingTemplate.__executeServer(opts));
const retryPendingTemplate = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  template_type: z.string().min(1),
  limit: z.number().int().min(1).max(1e3).default(500)
}).parse(d)).handler(retryPendingTemplate_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    data: pages
  } = await supabaseAdmin.from("content_pages").select("slug").like("url_path", "/p/%").neq("status", "published").eq("template_type", data.template_type).limit(data.limit);
  const slugs = (pages || []).map((p) => p.slug).filter(Boolean);
  if (slugs.length === 0) return {
    retried: 0,
    slugs: []
  };
  const {
    error
  } = await supabaseAdmin.from("content_plan").update({
    status: "pending",
    last_error: null
  }).in("slug", slugs);
  if (error) throw new Error(error.message);
  return {
    retried: slugs.length,
    slugs
  };
});
function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const queueSpanishCityBatch_createServerFn_handler = createServerRpc({
  id: "1dbf07014cb459359ad11a211494b7303f665d86bf658d3c23cf450360f6ba8d",
  name: "queueSpanishCityBatch",
  filename: "src/server/admin-pending-actions.functions.ts"
}, (opts) => queueSpanishCityBatch.__executeServer(opts));
const queueSpanishCityBatch = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  count: z.number().int().min(1).max(500).default(100)
}).parse(d)).handler(queueSpanishCityBatch_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    data: existing
  } = await supabaseAdmin.from("content_plan").select("city, state_code").eq("source_type", "hosting_es");
  const existingKeys = new Set((existing || []).map((r) => `${(r.city || "").toLowerCase()}|${(r.state_code || "").toUpperCase()}`).filter((k) => k !== "|"));
  const {
    data: candidates
  } = await supabaseAdmin.from("content_plan").select("city, state, state_code, population_2024").eq("source_type", "city").not("city", "is", null).not("state_code", "is", null).order("population_2024", {
    ascending: false,
    nullsFirst: false
  }).limit(data.count * 4);
  const newRows = [];
  let skipped = 0;
  for (const row of candidates || []) {
    const city = (row.city || "").trim();
    const st = (row.state_code || "").trim().toUpperCase();
    if (!city || !st) continue;
    const key = `${city.toLowerCase()}|${st}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    const citySlug = slugify(city);
    const stateLower = st.toLowerCase();
    newRows.push({
      source_type: "hosting_es",
      priority_tier: "T1 (200k+)",
      priority_score: row.population_2024 ?? 0,
      city,
      state: row.state,
      state_code: st,
      population_2024: row.population_2024,
      slug: `conviertete-en-anfitrion-de-alberca-${citySlug}-${stateLower}`,
      h1: `Conviértete en Anfitrión de Alberca en ${city}, ${st}`,
      meta_title: `Renta Tu Alberca en ${city}, ${st} – Gana $4K-$8K+/Mes`,
      meta_description: `Convierte tu alberca en ${city} en ingresos premium. Seguro de $2M. 90% de ganancias. Soporte en español.`,
      primary_keyword: `renta de alberca ${city}`,
      supporting_keywords: `renta de alberca ${city}; anfitrión de alberca ${city} ${st}; alberca privada ${city}`,
      uniqueness_angle: `Página en español para hispanohablantes en ${city}, ${row.state ?? st}.`,
      status: "pending"
    });
    existingKeys.add(key);
    if (newRows.length >= data.count) break;
  }
  if (newRows.length === 0) return {
    inserted: 0,
    skipped,
    sample: []
  };
  const {
    error
  } = await supabaseAdmin.from("content_plan").upsert(newRows, {
    onConflict: "slug",
    ignoreDuplicates: true
  });
  if (error) throw new Error(error.message);
  return {
    inserted: newRows.length,
    skipped,
    sample: newRows.slice(0, 5).map((r) => r.slug)
  };
});
export {
  listPendingFailures_createServerFn_handler,
  queueSpanishCityBatch_createServerFn_handler,
  retryPendingTemplate_createServerFn_handler
};
