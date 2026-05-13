/**
 * AI FAQ generator. Takes a content_pages url_path, pulls the top GSC queries
 * for it, asks Lovable AI to write FAQ Q&A blocks (with FAQPage JSON-LD),
 * previews them, and inserts them into the page body markdown.
 *
 * Admin-only. All access via supabaseAdmin.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FAQ_MODEL = "google/gemini-2.5-flash";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqPreview {
  faqs: FaqItem[];
  markdown: string; // ready-to-insert markdown block
  jsonLd: string; // FAQPage schema JSON
  queries: Array<{ query: string; clicks: number; impressions: number; position: number | null }>;
  page: { url_path: string; title: string | null; focus_keyword: string | null };
  error?: string;
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

/**
 * Fire-and-forget debug logger. Writes one row to faq_generator_logs per call
 * so admins can see request payloads, durations, and stack traces when the
 * FAQ generator misbehaves. Failures here are swallowed — logging must never
 * break the actual endpoint.
 */
async function logFaqEvent(entry: {
  endpoint: string;
  userId?: string | null;
  url_path?: string | null;
  payload?: unknown;
  status: "ok" | "error" | "skipped" | "forbidden";
  error?: unknown;
  durationMs?: number;
  httpStatus?: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const err = entry.error;
    const errorMessage =
      err instanceof Error ? err.message : err == null ? null : String(err);
    const errorStack =
      err instanceof Error && err.stack ? err.stack.slice(0, 8000) : null;
    await (supabaseAdmin as any).from("faq_generator_logs").insert({
      endpoint: entry.endpoint,
      user_id: entry.userId ?? null,
      url_path: entry.url_path ?? null,
      payload: entry.payload ?? null,
      status: entry.status,
      error_message: errorMessage,
      error_stack: errorStack,
      duration_ms: entry.durationMs ?? null,
      http_status: entry.httpStatus ?? null,
      meta: entry.meta ?? null,
    });
  } catch (logErr) {
    console.error("[faq-generator] failed to write debug log", logErr);
  }
}

function buildMarkdown(faqs: FaqItem[]): string {
  const lines = ["", "## Frequently asked questions", ""];
  for (const f of faqs) {
    lines.push(`### ${f.question}`, "", f.answer, "");
  }
  return lines.join("\n");
}

function buildJsonLd(faqs: FaqItem[]): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    null,
    2,
  );
}

// ---------- internal helpers (admin-checked at call sites) ----------

async function generateFaqPreview(
  url_path: string,
  count: number,
): Promise<FaqPreview> {
  const empty: FaqPreview = {
    faqs: [],
    markdown: "",
    jsonLd: "",
    queries: [],
    page: { url_path, title: null, focus_keyword: null },
  };
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ...empty, error: "LOVABLE_API_KEY not configured" };

  const data = { url_path, count };

    const { data: page } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("id, url_path, title, focus_keyword, body_markdown")
      .eq("url_path", data.url_path)
      .maybeSingle();
    if (!page) return { ...empty, error: "Page not found" };

    // Pull top GSC queries by impressions in last 90 days.
    const since = new Date(Date.now() - 90 * 86400_000).toISOString();
    const { data: q } = await (supabaseAdmin as any)
      .from("gsc_query_data")
      .select("query, clicks, impressions, position, captured_at")
      .eq("url_path", data.url_path)
      .gte("captured_at", since)
      .order("impressions", { ascending: false })
      .limit(40);

    // De-dupe queries (keep highest impressions row).
    const byQ = new Map<string, { query: string; clicks: number; impressions: number; position: number | null }>();
    for (const row of q ?? []) {
      const key = (row.query as string).toLowerCase().trim();
      const cur = byQ.get(key);
      if (!cur || row.impressions > cur.impressions) {
        byQ.set(key, {
          query: row.query,
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          position: row.position == null ? null : Number(row.position),
        });
      }
    }
    const queries = [...byQ.values()].slice(0, 25);
    if (queries.length === 0) {
      return { ...empty, page: { url_path: page.url_path, title: page.title, focus_keyword: page.focus_keyword }, error: "No GSC queries found for this URL in the last 90 days." };
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
${(page.body_markdown ?? "").slice(0, 6000)}
"""

Generate ${data.count} FAQ items grounded in these queries. Prefer the highest-impression queries and merge near-duplicates.`;

    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: FAQ_MODEL,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userMsg },
          ],
          tools: [
            {
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
                          question: { type: "string" },
                          answer: { type: "string" },
                        },
                        required: ["question", "answer"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["faqs"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "save_faqs" } },
        }),
      });

      if (!aiRes.ok) {
        if (aiRes.status === 429)
          return { ...empty, queries, page: { url_path: page.url_path, title: page.title, focus_keyword: page.focus_keyword }, error: "AI rate limit. Try again in a minute." };
        if (aiRes.status === 402)
          return { ...empty, queries, page: { url_path: page.url_path, title: page.title, focus_keyword: page.focus_keyword }, error: "AI credits exhausted. Add credits in Workspace > Usage." };
        const txt = await aiRes.text();
        return { ...empty, queries, page: { url_path: page.url_path, title: page.title, focus_keyword: page.focus_keyword }, error: `AI error ${aiRes.status}: ${txt.slice(0, 200)}` };
      }

      const json = await aiRes.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = call ? JSON.parse(call) : null;
      const faqs: FaqItem[] = Array.isArray(parsed?.faqs) ? parsed.faqs : [];
      if (faqs.length === 0) {
        return { ...empty, queries, page: { url_path: page.url_path, title: page.title, focus_keyword: page.focus_keyword }, error: "AI returned no FAQs." };
      }

      return {
        faqs,
        markdown: buildMarkdown(faqs),
        jsonLd: buildJsonLd(faqs),
        queries,
        page: { url_path: page.url_path, title: page.title, focus_keyword: page.focus_keyword },
      };
    } catch (e) {
      return {
        ...empty,
        queries,
        page: { url_path: page.url_path, title: page.title, focus_keyword: page.focus_keyword },
        error: e instanceof Error ? e.message : "AI request failed",
      };
    }
}

// ---------- preview server fn ----------

export const previewFaqForUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ url_path: z.string().min(1), count: z.number().int().min(3).max(10).default(6) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<FaqPreview> => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) {
      return {
        faqs: [], markdown: "", jsonLd: "", queries: [],
        page: { url_path: data.url_path, title: null, focus_keyword: null },
        error: "Forbidden",
      };
    }
    return generateFaqPreview(data.url_path, data.count);
  });

// ---------- insert ----------

// Match a wide range of FAQ-style headings so existing blocks are reliably
// replaced even if the heading text varies slightly. Tolerates leading emoji,
// bold/italic markers, trailing punctuation, and heading levels h1-h4.
function buildFaqHeadingLineRe(): RegExp {
  return /^[ \t]*#{1,4}[ \t]+[*_~`]*\s*(?:[^\w\s#]+\s*)?(?:frequently\s+asked\s+questions?|frequent(?:ly)?\s+questions?|common(?:ly\s+asked)?\s+questions?|questions?\s*(?:&|and)\s*answers?|q\s*&\s*a|f\s*\.?\s*a\s*\.?\s*q\s*\.?s?|got\s+questions|have\s+questions)[*_~`:?!.\s]*$/im;
}

export function hasFaqHeading(body: string): boolean {
  if (!body) return false;
  return buildFaqHeadingLineRe().test(body);
}

/**
 * Replace the existing FAQ section (heading + content up to the next
 * same-or-higher-level heading) with the provided block. If no FAQ heading
 * is found, returns the body unchanged.
 */
export function replaceFaqSection(body: string, block: string): string {
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
  const trailing = after ? `\n\n${after}` : "\n";
  return `${before}\n\n${block}\n${trailing}`;
}

async function insertFaqsIntoPath(
  url_path: string,
  faqs: FaqItem[],
  replace_existing: boolean,
): Promise<{ success: boolean; error: string | null }> {
  const { data: page, error: pErr } = await (supabaseAdmin as any)
    .from("content_pages")
    .select("id, body_markdown")
    .eq("url_path", url_path)
    .maybeSingle();
  if (pErr || !page) return { success: false, error: pErr?.message ?? "Page not found" };

  const block = buildMarkdown(faqs).trim();
  let body: string = page.body_markdown ?? "";

  if (replace_existing && hasFaqHeading(body)) {
    body = replaceFaqSection(body, block);
  } else {
    body = `${body.replace(/\s+$/, "")}\n\n${block}\n`;
  }

  const { error: uErr } = await (supabaseAdmin as any)
    .from("content_pages")
    .update({
      body_markdown: body,
      faq_items: faqs,
      content_refreshed_at: new Date().toISOString(),
    })
    .eq("id", page.id);
  if (uErr) return { success: false, error: uErr.message };

  return { success: true, error: null };
}

export const insertFaqIntoPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        url_path: z.string().min(1),
        faqs: z
          .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
          .min(1)
          .max(15),
        replace_existing: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { success: false, error: "Forbidden" };
    return insertFaqsIntoPath(data.url_path, data.faqs, data.replace_existing);
  });

// ---------- bulk ----------

export interface BulkFaqResult {
  url_path: string;
  status: "inserted" | "skipped" | "error";
  error?: string;
  faq_count?: number;
  queries?: number;
}

export interface BulkFaqResponse {
  results: BulkFaqResult[];
  total: number;
  inserted: number;
  failed: number;
  error?: string;
}

export const bulkGenerateFaqs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        url_paths: z.array(z.string().min(1)).min(1).max(50),
        count: z.number().int().min(3).max(10).default(6),
        replace_existing: z.boolean().default(true),
        skip_if_has_faq: z.boolean().default(false),
        delay_ms: z.number().int().min(0).max(5000).default(800),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<BulkFaqResponse> => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) {
      return { results: [], total: 0, inserted: 0, failed: 0, error: "Forbidden" };
    }

    const seen = new Set<string>();
    const paths = data.url_paths
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !seen.has(p) && (seen.add(p), true));

    const results: BulkFaqResult[] = [];
    let inserted = 0;
    let failed = 0;

    for (const url_path of paths) {
      try {
        if (data.skip_if_has_faq) {
          const { data: page } = await (supabaseAdmin as any)
            .from("content_pages")
            .select("body_markdown")
            .eq("url_path", url_path)
            .maybeSingle();
          if (page?.body_markdown && hasFaqHeading(page.body_markdown)) {
            results.push({ url_path, status: "skipped", error: "Already has FAQ" });
            continue;
          }
        }

        const preview = await generateFaqPreview(url_path, data.count);
        if (preview.error || preview.faqs.length === 0) {
          failed++;
          results.push({
            url_path,
            status: "error",
            error: preview.error ?? "No FAQs generated",
            queries: preview.queries.length,
          });
          continue;
        }

        const ins = await insertFaqsIntoPath(url_path, preview.faqs, data.replace_existing);
        if (!ins.success) {
          failed++;
          results.push({ url_path, status: "error", error: ins.error ?? "Insert failed" });
          continue;
        }

        inserted++;
        results.push({
          url_path,
          status: "inserted",
          faq_count: preview.faqs.length,
          queries: preview.queries.length,
        });
      } catch (e) {
        failed++;
        results.push({
          url_path,
          status: "error",
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }

      if (data.delay_ms > 0) {
        await new Promise((r) => setTimeout(r, data.delay_ms));
      }
    }

    return { results, total: paths.length, inserted, failed };
  });
