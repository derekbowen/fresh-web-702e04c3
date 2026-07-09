import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { z } from "zod";
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
    data,
    error
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}
const log404_createServerFn_handler = createServerRpc({
  id: "b861a391ff5c69a64cd5ed90870fe31a07d11e4cc934dbc141a9c9100f88d251",
  name: "log404",
  filename: "src/server/content-404-log.functions.ts"
}, (opts) => log404.__executeServer(opts));
const log404 = createServerFn({
  method: "POST"
}).inputValidator((data) => z.object({
  urlPath: z.string().min(1).max(2048),
  slug: z.string().nullable().optional(),
  referrer: z.string().max(2048).nullable().optional(),
  userAgent: z.string().max(1024).nullable().optional()
}).parse(data)).handler(log404_createServerFn_handler, async ({
  data
}) => {
  try {
    let referrer = data.referrer ?? null;
    let userAgent = data.userAgent ?? null;
    try {
      const {
        getRequestHeader
      } = await import("./server-CMgekyTN.js");
      if (!referrer) referrer = getRequestHeader("referer") ?? null;
      if (!userAgent) userAgent = getRequestHeader("user-agent") ?? null;
    } catch {
    }
    const {
      data: existing
    } = await supabaseAdmin.from("content_404_log").select("id, hit_count").eq("url_path", data.urlPath).maybeSingle();
    if (existing) {
      await supabaseAdmin.from("content_404_log").update({
        hit_count: (existing.hit_count ?? 0) + 1,
        last_seen_at: (/* @__PURE__ */ new Date()).toISOString(),
        referrer: data.referrer ?? void 0,
        user_agent: data.userAgent ?? void 0,
        resolved_at: null
      }).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("content_404_log").insert({
        url_path: data.urlPath,
        slug: data.slug ?? null,
        referrer: data.referrer ?? null,
        user_agent: data.userAgent ?? null
      });
    }
  } catch (err) {
    console.error("[404-log] failed to record", data.urlPath, err);
  }
  return {
    ok: true
  };
});
const list404s_createServerFn_handler = createServerRpc({
  id: "d5855c7ec203d5072570f9def7914c5e5262be6d56334e14bb4311ed151aa05f",
  name: "list404s",
  filename: "src/server/content-404-log.functions.ts"
}, (opts) => list404s.__executeServer(opts));
const list404s = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  unresolvedOnly: z.boolean().optional().default(true),
  pPathsOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(500).optional().default(100)
}).parse(data ?? {})).handler(list404s_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  let q = supabaseAdmin.from("content_404_log").select("*").order("last_seen_at", {
    ascending: false
  }).limit(data.limit);
  if (data.unresolvedOnly) q = q.is("resolved_at", null);
  if (data.pPathsOnly) q = q.like("url_path", "/p/%");
  const {
    data: rows,
    error
  } = await q;
  if (error) {
    console.error("[404-log] list failed", error);
    return {
      rows: []
    };
  }
  return {
    rows: rows ?? []
  };
});
const resolve404_createServerFn_handler = createServerRpc({
  id: "8ab83e7b79975e2413e8d5fee5092790d00f93658f9d201d5fee2697a02c319a",
  name: "resolve404",
  filename: "src/server/content-404-log.functions.ts"
}, (opts) => resolve404.__executeServer(opts));
const resolve404 = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional()
}).parse(data)).handler(resolve404_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    error
  } = await supabaseAdmin.from("content_404_log").update({
    resolved_at: (/* @__PURE__ */ new Date()).toISOString(),
    resolution_notes: data.notes ?? null
  }).eq("id", data.id);
  if (error) {
    console.error("[404-log] resolve failed", error);
    return {
      ok: false,
      error: error.message
    };
  }
  return {
    ok: true
  };
});
const redirect404_createServerFn_handler = createServerRpc({
  id: "ea4ced18ec0e39e288b27807d289364d09296a0c283167fb93894c1c5c895484",
  name: "redirect404",
  filename: "src/server/content-404-log.functions.ts"
}, (opts) => redirect404.__executeServer(opts));
const redirect404 = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  id: z.string().uuid(),
  target: z.string().trim().min(1).max(2048)
}).parse(data)).handler(redirect404_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    data: row,
    error: rowErr
  } = await supabaseAdmin.from("content_404_log").select("url_path, slug").eq("id", data.id).maybeSingle();
  if (rowErr || !row) return {
    ok: false,
    error: rowErr?.message || "404 row not found"
  };
  const target = data.target.startsWith("/") || data.target.startsWith("http") ? data.target : `/${data.target}`;
  const slug = (row.slug || row.url_path.replace(/^\/p\//, "")).slice(0, 200);
  const {
    data: existing
  } = await supabaseAdmin.from("content_pages").select("id").eq("url_path", row.url_path).maybeSingle();
  if (existing) {
    await supabaseAdmin.from("content_pages").update({
      redirect_to: target,
      status: "redirect",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("content_pages").insert({
      url_path: row.url_path,
      slug,
      redirect_to: target,
      status: "redirect",
      title: `Redirect → ${target}`,
      in_sitemap: false,
      template_type: "redirect"
    });
  }
  await supabaseAdmin.from("content_404_log").update({
    resolved_at: (/* @__PURE__ */ new Date()).toISOString(),
    resolution_notes: `redirect → ${target}`
  }).eq("id", data.id);
  return {
    ok: true,
    target
  };
});
const createPageFor404_createServerFn_handler = createServerRpc({
  id: "3f7d63ee75bd9996df2c97408fec354252b401593e294069550cf2f3408a9210",
  name: "createPageFor404",
  filename: "src/server/content-404-log.functions.ts"
}, (opts) => createPageFor404.__executeServer(opts));
const createPageFor404 = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  id: z.string().uuid()
}).parse(data)).handler(createPageFor404_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    data: row
  } = await supabaseAdmin.from("content_404_log").select("url_path, slug").eq("id", data.id).maybeSingle();
  if (!row) return {
    ok: false,
    error: "404 row not found"
  };
  if (!row.url_path.startsWith("/p/")) {
    return {
      ok: false,
      error: `Only /p/* paths can be auto-built (got ${row.url_path}). Use Redirect or Dismiss.`
    };
  }
  const slug = (row.slug || row.url_path.replace(/^\/p\//, "")).replace(/\/+$/, "");
  if (!slug || slug.includes("/") === false ? !/^[a-z0-9-]+$/.test(slug) : false) ;
  if (!slug) return {
    ok: false,
    error: "Cannot derive slug from URL"
  };
  const {
    data: existing
  } = await supabaseAdmin.from("content_pages").select("id, status").eq("url_path", row.url_path).maybeSingle();
  if (existing?.status === "published") {
    await supabaseAdmin.from("content_404_log").update({
      resolved_at: (/* @__PURE__ */ new Date()).toISOString(),
      resolution_notes: "page already exists"
    }).eq("id", data.id);
    return {
      ok: true,
      alreadyExists: true
    };
  }
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return {
    ok: false,
    error: "LOVABLE_API_KEY not configured"
  };
  const {
    data: linkPool
  } = await supabaseAdmin.from("content_pages").select("url_path, title").eq("status", "published").like("url_path", "/p/%").neq("url_path", row.url_path).order("updated_at", {
    ascending: false
  }).limit(30);
  const linkLines = (linkPool ?? []).map((p) => `- ${p.url_path} — ${p.title || p.url_path}`).join("\n");
  const title = slug.split(/[-/]/).filter(Boolean).map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
  const SYSTEM = `You write SEO content for Pool Rental Near Me, a marketplace where homeowners rent private pools by the hour. 10% flat host fee, $2M liability insurance included. Voice: confident, friendly, host-first, second person. Sentence case headings. No em dashes. Markdown only with ## and ### headings. Include 2-4 internal links chosen ONLY from the candidate list below (use exact url_path). Also include the marketplace CTAs: search /s, list a pool /l/draft/00000000-0000-0000-0000-000000000000/new/details. End with a CTA paragraph linking to the list-a-pool URL. Do NOT invent any other internal URLs. Return ONLY by calling write_page.

Candidate internal links:
${linkLines || "(none yet — use only /s and the list-a-pool CTA)"}`;
  const userPrompt = `Write a page for the URL ${row.url_path}. Inferred title: "${title}". Build the article around what someone landing on that URL would want. 600-1000 words. seo_title ≤60 chars, seo_description ≤155 chars.`;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [{
        role: "system",
        content: SYSTEM
      }, {
        role: "user",
        content: userPrompt
      }],
      tools: [{
        type: "function",
        function: {
          name: "write_page",
          parameters: {
            type: "object",
            required: ["title", "seo_title", "seo_description", "body_markdown"],
            properties: {
              title: {
                type: "string"
              },
              seo_title: {
                type: "string"
              },
              seo_description: {
                type: "string"
              },
              body_markdown: {
                type: "string"
              }
            },
            additionalProperties: false
          }
        }
      }],
      tool_choice: {
        type: "function",
        function: {
          name: "write_page"
        }
      }
    })
  });
  if (resp.status === 402) return {
    ok: false,
    error: "AI credits exhausted"
  };
  if (!resp.ok) return {
    ok: false,
    error: `AI gateway ${resp.status}`
  };
  const json = await resp.json();
  const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) return {
    ok: false,
    error: "AI response missing tool call"
  };
  const gen = JSON.parse(tc.function.arguments);
  if (existing) {
    const {
      error: upErr
    } = await supabaseAdmin.from("content_pages").update({
      status: "published",
      in_sitemap: true,
      title: gen.title,
      seo_title: gen.seo_title,
      seo_description: gen.seo_description,
      body_markdown: gen.body_markdown,
      template_type: "resource",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", existing.id);
    if (upErr) return {
      ok: false,
      error: upErr.message
    };
    await supabaseAdmin.from("content_404_log").update({
      resolved_at: (/* @__PURE__ */ new Date()).toISOString(),
      resolution_notes: "existing row published via AI"
    }).eq("id", data.id);
    return {
      ok: true,
      slug,
      words: (gen.body_markdown || "").split(/\s+/).length
    };
  }
  const {
    error: insErr
  } = await supabaseAdmin.from("content_pages").insert({
    url_path: row.url_path,
    slug,
    status: "published",
    in_sitemap: true,
    title: gen.title,
    seo_title: gen.seo_title,
    seo_description: gen.seo_description,
    body_markdown: gen.body_markdown,
    template_type: "resource"
  });
  if (insErr) return {
    ok: false,
    error: insErr.message
  };
  await supabaseAdmin.from("content_404_log").update({
    resolved_at: (/* @__PURE__ */ new Date()).toISOString(),
    resolution_notes: "page created via AI"
  }).eq("id", data.id);
  return {
    ok: true,
    slug,
    words: (gen.body_markdown || "").split(/\s+/).length
  };
});
export {
  createPageFor404_createServerFn_handler,
  list404s_createServerFn_handler,
  log404_createServerFn_handler,
  redirect404_createServerFn_handler,
  resolve404_createServerFn_handler
};
