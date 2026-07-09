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
async function requireAdmin(userId) {
  const {
    data,
    error
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}
const adminListBlogPosts_createServerFn_handler = createServerRpc({
  id: "df1ce286e5d0c0945818d77c80adb5b1f79260ccf04dcc41d839b3ed89b4f398",
  name: "adminListBlogPosts",
  filename: "src/server/admin-blog.functions.ts"
}, (opts) => adminListBlogPosts.__executeServer(opts));
const adminListBlogPosts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(adminListBlogPosts_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    data,
    error
  } = await supabaseAdmin.from("blog_posts").select("slug, title, topic, is_published, content, updated_at").order("topic", {
    ascending: true
  }).order("title", {
    ascending: true
  }).limit(500);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r) => ({
    slug: r.slug,
    title: r.title,
    topic: r.topic,
    is_published: r.is_published,
    word_count: (r.content ?? "").split(/\s+/).filter(Boolean).length,
    updated_at: r.updated_at
  }));
  return {
    rows
  };
});
const expandSchema = z.object({
  slug: z.string().min(1).max(160),
  model: z.string().optional()
});
const adminExpandBlogPost_createServerFn_handler = createServerRpc({
  id: "89efd1407c91e91778a4f37de8144a2b14ae0ee3365eea29217c7832cd0cee6d",
  name: "adminExpandBlogPost",
  filename: "src/server/admin-blog.functions.ts"
}, (opts) => adminExpandBlogPost.__executeServer(opts));
const adminExpandBlogPost = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => expandSchema.parse(d)).handler(adminExpandBlogPost_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    data: post,
    error
  } = await supabaseAdmin.from("blog_posts").select("slug, title, topic").eq("slug", data.slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!post) throw new Error("Post not found");
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const model = data.model || "google/gemini-3-flash-preview";
  const system = "You are an expert SEO content writer for a pool rental marketplace called 'Pool Rental Near Me'. Write authoritative, useful, original articles in clear American English. Avoid fluff. Prefer concrete numbers, steps, and lists.";
  const userPrompt = `Write a comprehensive 800-1000 word SEO blog post.
Title: ${post.title}
Category: ${post.topic ?? "General"}
Audience: pool owners and people interested in renting/hosting pools.
Structure: H1 matching the title, 4-6 H2 sections, end with an FAQ (3-5 Q/A) and a short call-to-action mentioning Pool Rental Near Me.
No external links.

Return ONLY valid JSON with this exact shape:
{"seo_title": string (<=60 chars), "seo_description": string (<=160 chars), "excerpt": string (<=200 chars), "content_markdown": string}`;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: "system",
        content: system
      }, {
        role: "user",
        content: userPrompt
      }],
      response_format: {
        type: "json_object"
      }
    })
  });
  if (resp.status === 429) throw new Error("Rate limited by AI gateway. Try again in a minute.");
  if (resp.status === 402) throw new Error("AI credits exhausted. Add funds in Workspace > Usage.");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`AI gateway error ${resp.status}: ${t.slice(0, 200)}`);
  }
  const json = await resp.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      content_markdown: text
    };
  }
  const update = {
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (parsed.content_markdown) update.content = String(parsed.content_markdown);
  if (parsed.excerpt) update.excerpt = String(parsed.excerpt).slice(0, 280);
  if (parsed.seo_title) update.seo_title = String(parsed.seo_title).slice(0, 60);
  if (parsed.seo_description) update.seo_description = String(parsed.seo_description).slice(0, 160);
  const {
    error: upErr
  } = await supabaseAdmin.from("blog_posts").update(update).eq("slug", data.slug);
  if (upErr) throw new Error(upErr.message);
  const wc = String(update.content ?? "").split(/\s+/).filter(Boolean).length;
  return {
    ok: true,
    word_count: wc
  };
});
const generateSchema = z.object({
  count: z.number().int().min(1).max(10).optional(),
  topic: z.string().max(120).optional(),
  titleHint: z.string().max(200).optional(),
  model: z.string().optional(),
  autoPublish: z.boolean().optional()
});
const adminGenerateBlogPost_createServerFn_handler = createServerRpc({
  id: "76750b92c29342f211d88835938de0ae626c9febbd33e097a5da36a8af863235",
  name: "adminGenerateBlogPost",
  filename: "src/server/admin-blog.functions.ts"
}, (opts) => adminGenerateBlogPost.__executeServer(opts));
const adminGenerateBlogPost = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => generateSchema.parse(d)).handler(adminGenerateBlogPost_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    runBlogAutogen
  } = await import("./blog-autogen.server-CC6RPtlf.js");
  return runBlogAutogen(data);
});
const bulkPublishSchema = z.object({
  slugs: z.array(z.string().min(1).max(160)).min(1).max(100),
  publish: z.boolean()
});
const adminBulkPublishBlogPosts_createServerFn_handler = createServerRpc({
  id: "a9e8884ed1234a6c7a33fe52762212decdb3f84d1120f7f10f7da435fdfed1d2",
  name: "adminBulkPublishBlogPosts",
  filename: "src/server/admin-blog.functions.ts"
}, (opts) => adminBulkPublishBlogPosts.__executeServer(opts));
const adminBulkPublishBlogPosts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => bulkPublishSchema.parse(d)).handler(adminBulkPublishBlogPosts_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const update = {
    is_published: data.publish,
    published_at: data.publish ? (/* @__PURE__ */ new Date()).toISOString() : null
  };
  const {
    error
  } = await supabaseAdmin.from("blog_posts").update(update).in("slug", data.slugs);
  if (error) throw new Error(error.message);
  return {
    ok: true,
    count: data.slugs.length
  };
});
export {
  adminBulkPublishBlogPosts_createServerFn_handler,
  adminExpandBlogPost_createServerFn_handler,
  adminGenerateBlogPost_createServerFn_handler,
  adminListBlogPosts_createServerFn_handler
};
