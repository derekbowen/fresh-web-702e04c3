import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
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
const STOPWORDS = /* @__PURE__ */ new Set(["a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "of", "on", "or", "that", "the", "their", "this", "to", "was", "were", "what", "when", "where", "which", "who", "why", "will", "with", "you", "your", "about", "can", "do", "does", "get", "my", "make", "more", "new", "not", "now", "one", "our", "out", "over", "so", "than", "then", "they", "we", "best", "top", "guide", "guides", "tips", "tip", "vs", "via", "like", "most", "every", "ever", "just", "also", "too", "much", "many", "need", "needs", "using", "use", "uses", "used", "step", "steps", "way", "ways", "blog", "post", "posts", "pool", "pools"]);
function tokenize(s) {
  if (!s) return /* @__PURE__ */ new Set();
  return new Set(s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/).filter((w) => w.length >= 4 && !STOPWORDS.has(w)));
}
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}
async function loadAllPublished() {
  const {
    data
  } = await supabaseAdmin.from("blog_posts").select("slug, title, excerpt, topic").eq("is_published", true).limit(2e3);
  return data ?? [];
}
function pickRelated(target, all, limit = 6) {
  const targetTokens = tokenize(`${target.title ?? ""} ${target.excerpt ?? ""}`);
  const scored = all.filter((p) => p.slug !== target.slug).map((p) => {
    const t = tokenize(`${p.title ?? ""} ${p.excerpt ?? ""}`);
    let score = jaccard(targetTokens, t);
    if (p.topic && target.topic && p.topic === target.topic) score += 0.15;
    return {
      slug: p.slug,
      score
    };
  }).filter((p) => p.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  return scored.map((s) => s.slug);
}
async function generateTldr(title, body) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  const trimmed = body.slice(0, 12e3);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "system",
          content: "You write crisp 'Key takeaways' bullet lists for blog posts. Each bullet is one short, specific, useful sentence (max 18 words). No fluff, no marketing, no emoji. Sentence case."
        }, {
          role: "user",
          content: `Title: ${title}

Article:
${trimmed}

Return 3-5 key takeaway bullets via the tool.`
        }],
        tools: [{
          type: "function",
          function: {
            name: "set_tldr",
            description: "Return the key takeaway bullets for the article.",
            parameters: {
              type: "object",
              properties: {
                bullets: {
                  type: "array",
                  minItems: 3,
                  maxItems: 5,
                  items: {
                    type: "string"
                  }
                }
              },
              required: ["bullets"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: {
          type: "function",
          function: {
            name: "set_tldr"
          }
        }
      })
    });
    if (!res.ok) {
      console.error("[generateTldr] AI gateway", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) return null;
    const parsed = JSON.parse(args);
    const bullets = parsed?.bullets;
    if (!Array.isArray(bullets)) return null;
    return bullets.filter((b) => typeof b === "string" && b.trim().length > 0).map((b) => b.trim()).slice(0, 5);
  } catch (err) {
    console.error("[generateTldr] error", err);
    return null;
  }
}
const enrichBlogPost_createServerFn_handler = createServerRpc({
  id: "28d7cfc72c18ac332f7e7b2aa4a786ed86045dd487d3f78b9fc2a292b36c148a",
  name: "enrichBlogPost",
  filename: "src/server/blog-enrichment.functions.ts"
}, (opts) => enrichBlogPost.__executeServer(opts));
const enrichBlogPost = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(200),
  force: z.boolean().optional()
}).parse(d)).handler(enrichBlogPost_createServerFn_handler, async ({
  data
}) => {
  const {
    data: rows
  } = await supabaseAdmin.from("blog_posts").select("slug, title, excerpt, content, topic, tldr_bullets, related_slugs").eq("slug", data.slug).eq("is_published", true).limit(1);
  const post = (rows ?? [])[0];
  if (!post) return {
    ok: false,
    reason: "not_found"
  };
  const all = await loadAllPublished();
  const related = pickRelated(post, all, 6);
  const hadTldr = Array.isArray(post.tldr_bullets) && post.tldr_bullets.length > 0;
  let tldr = hadTldr ? post.tldr_bullets : null;
  if (data.force || !hadTldr) {
    tldr = await generateTldr(post.title ?? post.slug, post.content ?? "");
  }
  const update = {
    related_slugs: related,
    enrichment_generated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (tldr && tldr.length > 0) update.tldr_bullets = tldr;
  const {
    error
  } = await supabaseAdmin.from("blog_posts").update(update).eq("slug", data.slug);
  if (error) {
    console.error("[enrichBlogPost] update", error);
    return {
      ok: false,
      reason: "update_error"
    };
  }
  return {
    ok: true,
    slug: data.slug,
    tldr_count: tldr?.length ?? 0,
    related_count: related.length
  };
});
const enrichBlogBatch_createServerFn_handler = createServerRpc({
  id: "80fd41dac91508246c5234c30eda47006932830f1a03667fd94897d820f08bd1",
  name: "enrichBlogBatch",
  filename: "src/server/blog-enrichment.functions.ts"
}, (opts) => enrichBlogBatch.__executeServer(opts));
const enrichBlogBatch = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(50).default(10),
  onlyMissing: z.boolean().default(true)
}).parse(d ?? {})).handler(enrichBlogBatch_createServerFn_handler, async ({
  data
}) => {
  let q = supabaseAdmin.from("blog_posts").select("slug, title, excerpt, content, topic, tldr_bullets").eq("is_published", true).order("published_at", {
    ascending: false,
    nullsFirst: false
  }).limit(data.limit);
  if (data.onlyMissing) q = q.is("tldr_bullets", null);
  const {
    data: rows
  } = await q;
  const posts = rows ?? [];
  const all = await loadAllPublished();
  const results = [];
  for (const post of posts) {
    const related = pickRelated(post, all, 6);
    let tldr = null;
    const hadTldr = Array.isArray(post.tldr_bullets) && post.tldr_bullets.length > 0;
    if (!hadTldr) {
      tldr = await generateTldr(post.title ?? post.slug, post.content ?? "");
    }
    const update = {
      related_slugs: related,
      enrichment_generated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (tldr && tldr.length > 0) update.tldr_bullets = tldr;
    const {
      error
    } = await supabaseAdmin.from("blog_posts").update(update).eq("slug", post.slug);
    results.push({
      slug: post.slug,
      ok: !error,
      tldr: tldr?.length ?? 0,
      related: related.length
    });
    await new Promise((r) => setTimeout(r, 250));
  }
  return {
    processed: results.length,
    results
  };
});
const getRelatedBlogMeta_createServerFn_handler = createServerRpc({
  id: "d3c2a7e99e4d6ccb47b45f44ca1869f634951802f68222a756eb44b43a717566",
  name: "getRelatedBlogMeta",
  filename: "src/server/blog-enrichment.functions.ts"
}, (opts) => getRelatedBlogMeta.__executeServer(opts));
const getRelatedBlogMeta = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slugs: z.array(z.string().min(1).max(200)).max(12)
}).parse(d)).handler(getRelatedBlogMeta_createServerFn_handler, async ({
  data
}) => {
  if (data.slugs.length === 0) return {
    posts: []
  };
  const {
    data: rows
  } = await supabaseAdmin.from("blog_posts").select("slug, title, topic, excerpt, cover_image_url").in("slug", data.slugs).eq("is_published", true);
  const list = rows ?? [];
  const order = new Map(data.slugs.map((s, i) => [s, i]));
  list.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  return {
    posts: list
  };
});
export {
  enrichBlogBatch_createServerFn_handler,
  enrichBlogPost_createServerFn_handler,
  getRelatedBlogMeta_createServerFn_handler
};
