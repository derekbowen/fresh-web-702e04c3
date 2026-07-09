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
const FIRECRAWL_URL = "https://api.firecrawl.dev/v2/scrape";
async function firecrawlScrape(url) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
  const res = await fetch(FIRECRAWL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
      onlyMainContent: true
    })
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Firecrawl scrape failed [${res.status}]: ${JSON.stringify(json)}`);
  }
  const doc = json?.data ?? json;
  return {
    markdown: doc?.markdown ?? null,
    html: doc?.html ?? doc?.rawHtml ?? null,
    metadata: doc?.metadata ?? null
  };
}
async function assertAdmin(userId) {
  const {
    data,
    error
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin role required");
}
const scrapeContentPage_createServerFn_handler = createServerRpc({
  id: "cc1a925af565cc8102a84bede880710eec0177183540050f638284898ec31e7b",
  name: "scrapeContentPage",
  filename: "src/server/content-scrape.functions.ts"
}, (opts) => scrapeContentPage.__executeServer(opts));
const scrapeContentPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  id: z.string().uuid()
}).parse(data)).handler(scrapeContentPage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: row,
    error: fetchErr
  } = await supabaseAdmin.from("content_pages").select("id, source_url, title, status").eq("id", data.id).maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) throw new Error("content_pages row not found");
  const {
    markdown,
    html,
    metadata
  } = await firecrawlScrape(row.source_url);
  const meta = metadata ?? {};
  const update = {
    raw_html: html,
    body_markdown: markdown,
    scraped_at: (/* @__PURE__ */ new Date()).toISOString(),
    status: "scraped",
    ...!row.title && meta.title ? {
      title: meta.title
    } : {},
    ...meta.description ? {
      seo_description: meta.description
    } : {}
  };
  const {
    data: updated,
    error: upErr
  } = await supabaseAdmin.from("content_pages").update(update).eq("id", data.id).select("*").single();
  if (upErr) throw new Error(upErr.message);
  return {
    page: updated
  };
});
const nextPendingPage_createServerFn_handler = createServerRpc({
  id: "968dc7cf943a155cb3041dcf7f9252a4fb3b76bf149b5b3809fad848722e54a4",
  name: "nextPendingPage",
  filename: "src/server/content-scrape.functions.ts"
}, (opts) => nextPendingPage.__executeServer(opts));
const nextPendingPage = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  template_type: z.string().default("host_acq_city")
}).parse(data ?? {})).handler(nextPendingPage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: row,
    error
  } = await supabaseAdmin.from("content_pages").select("id, url_path, slug, source_url, title, status, template_type").eq("template_type", data.template_type).eq("status", "pending").order("priority", {
    ascending: true
  }).order("url_path", {
    ascending: true
  }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return {
    page: row
  };
});
const scrapeProgress_createServerFn_handler = createServerRpc({
  id: "d9befc9af4bef82f33cfb13162df09215c0864231dd75749925ed8df5ae72b4a",
  name: "scrapeProgress",
  filename: "src/server/content-scrape.functions.ts"
}, (opts) => scrapeProgress.__executeServer(opts));
const scrapeProgress = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  template_type: z.string().default("host_acq_city")
}).parse(data ?? {})).handler(scrapeProgress_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const base = supabaseAdmin.from("content_pages").select("id", {
    count: "exact",
    head: true
  }).eq("template_type", data.template_type);
  const [pendingRes, scrapedRes, totalRes] = await Promise.all([base.eq("status", "pending"), supabaseAdmin.from("content_pages").select("id", {
    count: "exact",
    head: true
  }).eq("template_type", data.template_type).eq("status", "scraped"), supabaseAdmin.from("content_pages").select("id", {
    count: "exact",
    head: true
  }).eq("template_type", data.template_type)]);
  if (pendingRes.error) throw new Error(pendingRes.error.message);
  if (scrapedRes.error) throw new Error(scrapedRes.error.message);
  if (totalRes.error) throw new Error(totalRes.error.message);
  return {
    pending: pendingRes.count ?? 0,
    scraped: scrapedRes.count ?? 0,
    total: totalRes.count ?? 0
  };
});
export {
  nextPendingPage_createServerFn_handler,
  scrapeContentPage_createServerFn_handler,
  scrapeProgress_createServerFn_handler
};
