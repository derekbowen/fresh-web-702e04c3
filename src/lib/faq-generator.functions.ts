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

const FAQ_MODEL = "google/gemini-3-flash-preview";

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

    const { data: page, error: pErr } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("id, body_markdown")
      .eq("url_path", data.url_path)
      .maybeSingle();
    if (pErr || !page) return { success: false, error: pErr?.message ?? "Page not found" };

    const block = buildMarkdown(data.faqs).trim();
    let body: string = page.body_markdown ?? "";

    // If the page already has an FAQ section, optionally replace it.
    const faqHeadingRe = /(^|\n)(##\s+frequently\s+asked\s+questions[\s\S]*?)(?=\n##\s|\n#\s|$)/i;
    if (data.replace_existing && faqHeadingRe.test(body)) {
      body = body.replace(faqHeadingRe, `\n\n${block}\n`);
    } else {
      body = `${body.replace(/\s+$/, "")}\n\n${block}\n`;
    }

    const { error: uErr } = await supabaseAdmin
      .from("content_pages")
      .update({ body_markdown: body, content_refreshed_at: new Date().toISOString() })
      .eq("id", page.id);
    if (uErr) return { success: false, error: uErr.message };

    return { success: true, error: null };
  });
