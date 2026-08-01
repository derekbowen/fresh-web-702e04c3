import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
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
const FAQ_MODEL = "google/gemini-3-flash-preview";
async function isAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}
async function logFaqEvent(entry) {
  try {
    const err = entry.error;
    const errorMessage = err instanceof Error ? err.message : err == null ? null : String(err);
    const errorStack = err instanceof Error && err.stack ? err.stack.slice(0, 8e3) : null;
    await supabaseAdmin.from("faq_generator_logs").insert({
      endpoint: entry.endpoint,
      user_id: entry.userId ?? null,
      url_path: entry.url_path ?? null,
      payload: entry.payload ?? null,
      status: entry.status,
      error_message: errorMessage,
      error_stack: errorStack,
      duration_ms: entry.durationMs ?? null,
      http_status: entry.httpStatus ?? null,
      meta: entry.meta ?? null
    });
  } catch (logErr) {
    console.error("[faq-generator] failed to write debug log", logErr);
  }
}
function buildMarkdown(faqs) {
  const lines = ["", "## Frequently asked questions", ""];
  for (const f of faqs) {
    lines.push(`### ${f.question}`, "", f.answer, "");
  }
  return lines.join("\n");
}
function buildJsonLd(faqs) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer
      }
    }))
  }, null, 2);
}
async function generateFaqPreview(url_path, count) {
  const empty = {
    faqs: [],
    markdown: "",
    jsonLd: "",
    queries: [],
    page: {
      url_path,
      title: null,
      focus_keyword: null
    }
  };
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return {
    ...empty,
    error: "LOVABLE_API_KEY not configured"
  };
  const data = {
    url_path,
    count
  };
  const {
    data: page
  } = await supabaseAdmin.from("content_pages").select("id, url_path, title, focus_keyword, body_markdown").eq("url_path", data.url_path).maybeSingle();
  if (!page) return {
    ...empty,
    error: "Page not found"
  };
  const since = new Date(Date.now() - 90 * 864e5).toISOString();
  const {
    data: q
  } = await supabaseAdmin.from("gsc_query_data").select("query, clicks, impressions, position, captured_at").eq("url_path", data.url_path).gte("captured_at", since).order("impressions", {
    ascending: false
  }).limit(40);
  const byQ = /* @__PURE__ */ new Map();
  for (const row of q ?? []) {
    const key = row.query.toLowerCase().trim();
    const cur = byQ.get(key);
    if (!cur || row.impressions > cur.impressions) {
      byQ.set(key, {
        query: row.query,
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        position: row.position == null ? null : Number(row.position)
      });
    }
  }
  const queries = [...byQ.values()].slice(0, 25);
  if (queries.length === 0) {
    return {
      ...empty,
      page: {
        url_path: page.url_path,
        title: page.title,
        focus_keyword: page.focus_keyword
      },
      error: "No GSC queries found for this URL in the last 90 days."
    };
  }
  const sys = `You write FAQ blocks for poolrentalnearme.com, a peer-to-peer pool rental marketplace.

Your job: turn the user's real Google Search queries into a tight FAQ block that directly answers what they asked.

Voice rules (strict):
- Sentence case for headings and questions.
- Second person ("you", "your pool").
- No em dashes. Use commas, periods, or restructure.
- Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
- Numbers under 10 spelled out, 10+ as numerals. Hourly rates $40-150/hr only. Never invent statistics.
- Each answer 2-4 sentences, max ~80 words. Direct, useful, no marketing fluff.
- Questions should mirror real searcher intent (rephrase queries into natural questions).

Return JSON only via the provided tool.`;
  const userMsg = `Page: ${page.url_path}
Title: ${page.title ?? "(none)"}
Focus keyword: ${page.focus_keyword ?? "(none)"}

Top Google queries this page receives (query | impressions | avg position):
${queries.map((x) => `- ${x.query} | ${x.impressions} | ${x.position?.toFixed(1) ?? "-"}`).join("\n")}

Page body excerpt for context:
"""
${(page.body_markdown ?? "").slice(0, 6e3)}
"""

Generate ${data.count} FAQ items grounded in these queries. Prefer the highest-impression queries and merge near-duplicates.`;
  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: FAQ_MODEL,
        messages: [{
          role: "system",
          content: sys
        }, {
          role: "user",
          content: userMsg
        }],
        tools: [{
          type: "function",
          function: {
            name: "save_faqs",
            description: "Save the generated FAQ items.",
            parameters: {
              type: "object",
              properties: {
                faqs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: {
                        type: "string"
                      },
                      answer: {
                        type: "string"
                      }
                    },
                    required: ["question", "answer"],
                    additionalProperties: false
                  }
                }
              },
              required: ["faqs"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: {
          type: "function",
          function: {
            name: "save_faqs"
          }
        }
      })
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) return {
        ...empty,
        queries,
        page: {
          url_path: page.url_path,
          title: page.title,
          focus_keyword: page.focus_keyword
        },
        error: "AI rate limit. Try again in a minute."
      };
      if (aiRes.status === 402) return {
        ...empty,
        queries,
        page: {
          url_path: page.url_path,
          title: page.title,
          focus_keyword: page.focus_keyword
        },
        error: "AI credits exhausted. Add credits in Workspace > Usage."
      };
      const txt = await aiRes.text();
      return {
        ...empty,
        queries,
        page: {
          url_path: page.url_path,
          title: page.title,
          focus_keyword: page.focus_keyword
        },
        error: `AI error ${aiRes.status}: ${txt.slice(0, 200)}`
      };
    }
    const json = await aiRes.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = call ? JSON.parse(call) : null;
    const faqs = Array.isArray(parsed?.faqs) ? parsed.faqs : [];
    if (faqs.length === 0) {
      return {
        ...empty,
        queries,
        page: {
          url_path: page.url_path,
          title: page.title,
          focus_keyword: page.focus_keyword
        },
        error: "AI returned no FAQs."
      };
    }
    return {
      faqs,
      markdown: buildMarkdown(faqs),
      jsonLd: buildJsonLd(faqs),
      queries,
      page: {
        url_path: page.url_path,
        title: page.title,
        focus_keyword: page.focus_keyword
      }
    };
  } catch (e) {
    return {
      ...empty,
      queries,
      page: {
        url_path: page.url_path,
        title: page.title,
        focus_keyword: page.focus_keyword
      },
      error: e instanceof Error ? e.message : "AI request failed"
    };
  }
}
const previewFaqForUrl_createServerFn_handler = createServerRpc({
  id: "efcac919d928c60fe8b8637f3b7f54ba8e59199ff6817a9ea662c1ca5bb22df1",
  name: "previewFaqForUrl",
  filename: "src/lib/faq-generator.functions.ts"
}, (opts) => previewFaqForUrl.__executeServer(opts));
const previewFaqForUrl = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_path: z.string().min(1),
  count: z.number().int().min(3).max(10).default(6)
}).parse(d)).handler(previewFaqForUrl_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  const startedAt = Date.now();
  if (!await isAdmin(userId)) {
    await logFaqEvent({
      endpoint: "previewFaqForUrl",
      userId,
      url_path: data.url_path,
      payload: data,
      status: "forbidden",
      durationMs: Date.now() - startedAt
    });
    return {
      faqs: [],
      markdown: "",
      jsonLd: "",
      queries: [],
      page: {
        url_path: data.url_path,
        title: null,
        focus_keyword: null
      },
      error: "Forbidden"
    };
  }
  try {
    const result = await generateFaqPreview(data.url_path, data.count);
    await logFaqEvent({
      endpoint: "previewFaqForUrl",
      userId,
      url_path: data.url_path,
      payload: data,
      status: result.error ? "error" : "ok",
      error: result.error ? new Error(result.error) : void 0,
      durationMs: Date.now() - startedAt,
      meta: {
        faq_count: result.faqs.length,
        query_count: result.queries.length
      }
    });
    return result;
  } catch (e) {
    await logFaqEvent({
      endpoint: "previewFaqForUrl",
      userId,
      url_path: data.url_path,
      payload: data,
      status: "error",
      error: e,
      durationMs: Date.now() - startedAt
    });
    throw e;
  }
});
function buildFaqHeadingLineRe() {
  return /^[ \t]*#{1,4}[ \t]+[*_~`]*\s*(?:[^\w\s#]+\s*)?(?:frequently\s+asked\s+questions?|frequent(?:ly)?\s+questions?|common(?:ly\s+asked)?\s+questions?|questions?\s*(?:&|and)\s*answers?|q\s*&\s*a|f\s*\.?\s*a\s*\.?\s*q\s*\.?s?|got\s+questions|have\s+questions)[*_~`:?!.\s]*$/im;
}
function hasFaqHeading(body) {
  if (!body) return false;
  return buildFaqHeadingLineRe().test(body);
}
function replaceFaqSection(body, block) {
  const headingRe = buildFaqHeadingLineRe();
  const m = headingRe.exec(body);
  if (!m) return body;
  const start = m.index;
  const headingLine = m[0];
  const levelMatch = headingLine.match(/^[ \t]*(#{1,4})[ \t]+/);
  const level = levelMatch ? levelMatch[1].length : 2;
  const afterStart = start + headingLine.length;
  const rest = body.slice(afterStart);
  const levelPattern = new RegExp(`\\n[ \\t]*#{1,${level}}[ \\t]+\\S`);
  const nextRel = rest.search(levelPattern);
  const end = nextRel === -1 ? body.length : afterStart + nextRel;
  const before = body.slice(0, start).replace(/\s+$/, "");
  const after = body.slice(end).replace(/^\s+/, "");
  const trailing = after ? `

${after}` : "\n";
  return `${before}

${block}
${trailing}`;
}
async function insertFaqsIntoPath(url_path, faqs, replace_existing) {
  const {
    data: page,
    error: pErr
  } = await supabaseAdmin.from("content_pages").select("id, body_markdown").eq("url_path", url_path).maybeSingle();
  if (pErr || !page) return {
    success: false,
    error: pErr?.message ?? "Page not found"
  };
  const block = buildMarkdown(faqs).trim();
  let body = page.body_markdown ?? "";
  if (replace_existing && hasFaqHeading(body)) {
    body = replaceFaqSection(body, block);
  } else {
    body = `${body.replace(/\s+$/, "")}

${block}
`;
  }
  const {
    error: uErr
  } = await supabaseAdmin.from("content_pages").update({
    body_markdown: body,
    faq_items: faqs,
    content_refreshed_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", page.id);
  if (uErr) return {
    success: false,
    error: uErr.message
  };
  return {
    success: true,
    error: null
  };
}
const insertFaqIntoPage_createServerFn_handler = createServerRpc({
  id: "81c00e8a07d3fb7c003cf18481c293adf6f4a30fd5fc4756485691bad365d4a9",
  name: "insertFaqIntoPage",
  filename: "src/lib/faq-generator.functions.ts"
}, (opts) => insertFaqIntoPage.__executeServer(opts));
const insertFaqIntoPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_path: z.string().min(1),
  faqs: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1)
  })).min(1).max(15),
  replace_existing: z.boolean().default(true)
}).parse(d)).handler(insertFaqIntoPage_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  const startedAt = Date.now();
  if (!await isAdmin(userId)) {
    await logFaqEvent({
      endpoint: "insertFaqIntoPage",
      userId,
      url_path: data.url_path,
      payload: {
        url_path: data.url_path,
        faq_count: data.faqs.length,
        replace_existing: data.replace_existing
      },
      status: "forbidden",
      durationMs: Date.now() - startedAt
    });
    return {
      success: false,
      error: "Forbidden"
    };
  }
  try {
    const result = await insertFaqsIntoPath(data.url_path, data.faqs, data.replace_existing);
    await logFaqEvent({
      endpoint: "insertFaqIntoPage",
      userId,
      url_path: data.url_path,
      payload: {
        url_path: data.url_path,
        faq_count: data.faqs.length,
        replace_existing: data.replace_existing
      },
      status: result.success ? "ok" : "error",
      error: result.error ? new Error(result.error) : void 0,
      durationMs: Date.now() - startedAt
    });
    return result;
  } catch (e) {
    await logFaqEvent({
      endpoint: "insertFaqIntoPage",
      userId,
      url_path: data.url_path,
      payload: {
        url_path: data.url_path,
        faq_count: data.faqs.length,
        replace_existing: data.replace_existing
      },
      status: "error",
      error: e,
      durationMs: Date.now() - startedAt
    });
    throw e;
  }
});
const bulkGenerateFaqs_createServerFn_handler = createServerRpc({
  id: "5011daf5605a661f03ac98f3377907106a189586626054c3dbbe10b0280ed173",
  name: "bulkGenerateFaqs",
  filename: "src/lib/faq-generator.functions.ts"
}, (opts) => bulkGenerateFaqs.__executeServer(opts));
const bulkGenerateFaqs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_paths: z.array(z.string().min(1)).min(1).max(50),
  count: z.number().int().min(3).max(10).default(6),
  replace_existing: z.boolean().default(true),
  skip_if_has_faq: z.boolean().default(false),
  delay_ms: z.number().int().min(0).max(5e3).default(800)
}).parse(d)).handler(bulkGenerateFaqs_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  const bulkStartedAt = Date.now();
  if (!await isAdmin(userId)) {
    await logFaqEvent({
      endpoint: "bulkGenerateFaqs",
      userId,
      payload: {
        url_count: data.url_paths.length,
        count: data.count
      },
      status: "forbidden",
      durationMs: Date.now() - bulkStartedAt
    });
    return {
      results: [],
      total: 0,
      inserted: 0,
      failed: 0,
      error: "Forbidden"
    };
  }
  const seen = /* @__PURE__ */ new Set();
  const paths = data.url_paths.map((p) => p.trim()).filter((p) => p.length > 0 && !seen.has(p) && (seen.add(p), true));
  const results = [];
  let inserted = 0;
  let failed = 0;
  for (const url_path of paths) {
    const itemStartedAt = Date.now();
    try {
      if (data.skip_if_has_faq) {
        const {
          data: page
        } = await supabaseAdmin.from("content_pages").select("body_markdown").eq("url_path", url_path).maybeSingle();
        if (page?.body_markdown && hasFaqHeading(page.body_markdown)) {
          results.push({
            url_path,
            status: "skipped",
            error: "Already has FAQ"
          });
          await logFaqEvent({
            endpoint: "bulkGenerateFaqs",
            userId,
            url_path,
            payload: {
              count: data.count,
              replace_existing: data.replace_existing,
              skip_if_has_faq: true
            },
            status: "skipped",
            durationMs: Date.now() - itemStartedAt
          });
          continue;
        }
      }
      const preview = await generateFaqPreview(url_path, data.count);
      if (preview.error || preview.faqs.length === 0) {
        failed++;
        const errMsg = preview.error ?? "No FAQs generated";
        results.push({
          url_path,
          status: "error",
          error: errMsg,
          queries: preview.queries.length
        });
        await logFaqEvent({
          endpoint: "bulkGenerateFaqs",
          userId,
          url_path,
          payload: {
            count: data.count,
            replace_existing: data.replace_existing
          },
          status: "error",
          error: new Error(errMsg),
          durationMs: Date.now() - itemStartedAt,
          meta: {
            phase: "preview",
            query_count: preview.queries.length
          }
        });
        continue;
      }
      const ins = await insertFaqsIntoPath(url_path, preview.faqs, data.replace_existing);
      if (!ins.success) {
        failed++;
        const errMsg = ins.error ?? "Insert failed";
        results.push({
          url_path,
          status: "error",
          error: errMsg
        });
        await logFaqEvent({
          endpoint: "bulkGenerateFaqs",
          userId,
          url_path,
          payload: {
            count: data.count,
            replace_existing: data.replace_existing
          },
          status: "error",
          error: new Error(errMsg),
          durationMs: Date.now() - itemStartedAt,
          meta: {
            phase: "insert",
            faq_count: preview.faqs.length
          }
        });
        continue;
      }
      inserted++;
      results.push({
        url_path,
        status: "inserted",
        faq_count: preview.faqs.length,
        queries: preview.queries.length
      });
      await logFaqEvent({
        endpoint: "bulkGenerateFaqs",
        userId,
        url_path,
        payload: {
          count: data.count,
          replace_existing: data.replace_existing
        },
        status: "ok",
        durationMs: Date.now() - itemStartedAt,
        meta: {
          faq_count: preview.faqs.length,
          query_count: preview.queries.length
        }
      });
    } catch (e) {
      failed++;
      results.push({
        url_path,
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error"
      });
      await logFaqEvent({
        endpoint: "bulkGenerateFaqs",
        userId,
        url_path,
        payload: {
          count: data.count,
          replace_existing: data.replace_existing
        },
        status: "error",
        error: e,
        durationMs: Date.now() - itemStartedAt,
        meta: {
          phase: "exception"
        }
      });
    }
    if (data.delay_ms > 0) {
      await new Promise((r) => setTimeout(r, data.delay_ms));
    }
  }
  await logFaqEvent({
    endpoint: "bulkGenerateFaqs:summary",
    userId,
    payload: {
      url_count: data.url_paths.length,
      count: data.count,
      replace_existing: data.replace_existing,
      skip_if_has_faq: data.skip_if_has_faq
    },
    status: failed === 0 ? "ok" : "error",
    durationMs: Date.now() - bulkStartedAt,
    meta: {
      total: paths.length,
      inserted,
      failed
    }
  });
  return {
    results,
    total: paths.length,
    inserted,
    failed
  };
});
export {
  bulkGenerateFaqs_createServerFn_handler,
  insertFaqIntoPage_createServerFn_handler,
  previewFaqForUrl_createServerFn_handler
};
