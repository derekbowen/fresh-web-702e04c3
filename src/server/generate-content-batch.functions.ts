import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Admin-only: generate a batch of diverse, long-form content_pages via
 * Lovable AI (Gemini) using tool-calling for structured output, validate,
 * inject internal links between siblings, then upsert into content_pages.
 *
 * No copy-paste-SQL. No schema mismatches. No duplicates.
 */

type GeneratedPage = {
  slug: string;
  title: string;
  description: string;
  body_markdown: string;
  seo_title: string;
  seo_description: string;
  template_type:
    | "event_guide"
    | "resource"
    | "host_acq_city"
    | "host_advocacy_state"
    | "amenity";
  category: string;
};

const TOOL = {
  type: "function" as const,
  function: {
    name: "write_pages",
    description: "Return 10 fully-written, distinct PRNM content pages.",
    parameters: {
      type: "object",
      properties: {
        pages: {
          type: "array",
          minItems: 10,
          maxItems: 10,
          items: {
            type: "object",
            properties: {
              slug: {
                type: "string",
                description:
                  "kebab-case, lowercase, ASCII only, 30-80 chars. Must be globally unique.",
              },
              title: { type: "string", description: "H1, 40-70 chars" },
              description: {
                type: "string",
                description: "1-sentence summary, 120-180 chars",
              },
              body_markdown: {
                type: "string",
                description:
                  "FULL article, 1100-1600 words. Markdown ## and ### headings, real paragraphs (not bullet stubs), specific neighborhoods/numbers/examples. MUST include 3-5 internal links to other pages in this batch using relative paths /p/{sibling-slug}. Include a UNIQUE-TO-THIS-PAGE section that no other page in the batch has. End with a 5-question FAQ and a CTA paragraph linking to /l/draft/00000000-0000-0000-0000-000000000000/new/details.",
              },
              seo_title: { type: "string", description: "≤60 chars" },
              seo_description: { type: "string", description: "≤155 chars" },
              template_type: {
                type: "string",
                enum: [
                  "event_guide",
                  "resource",
                  "host_acq_city",
                  "host_advocacy_state",
                  "amenity",
                ],
              },
              category: { type: "string" },
            },
            required: [
              "slug",
              "title",
              "description",
              "body_markdown",
              "seo_title",
              "seo_description",
              "template_type",
              "category",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["pages"],
      additionalProperties: false,
    },
  },
};

function buildPrompt(existingSlugs: string[], theme: string | undefined) {
  const system = `You write SEO content for Pool Rental Near Me (PRNM), a marketplace where homeowners rent out private pools by the hour.

Differentiators to weave in naturally (not all on every page):
- 10% flat host fee (vs Swimply's 15%+)
- $2M liability insurance included
- 5,100+ city pages, fast payouts

HARD RULES:
1. Every page must be 1100-1600 words of REAL content. No filler. No "in this article". No bullet-stub paragraphs.
2. Every page in the batch must be structurally DIFFERENT (different H2 patterns, different angles). Do not template.
3. Each page must contain a "UNIQUE SECTION" — a heading + paragraphs covering an angle no other page in the batch covers.
4. Internal linking: each page MUST include 3-5 markdown links to OTHER slugs in the same batch, formatted as [anchor text](/p/{sibling-slug}). Use varied, contextual anchor text.
5. End every page with a 5-question FAQ (## Frequently asked questions, then ### per question) and a single CTA paragraph linking to /l/draft/00000000-0000-0000-0000-000000000000/new/details
6. Slugs: lowercase kebab-case, descriptive (e.g. phoenix-az-private-pool-rentals-guide, bachelorette-pool-party-planning). Never reuse a slug from the forbidden list.
7. Mix of templates across the batch:
   - 4 city/area guides (template_type: "event_guide", category: "Event/City Guide")
   - 3 occasion/event guides (template_type: "event_guide", category: "Event/City Guide")
   - 2 host-facing resources (template_type: "resource", category: "Resource/Article Page")
   - 1 comparison or how-to (template_type: "resource", category: "Resource/Article Page")

Return ONLY by calling the write_pages tool.`;

  const forbidden =
    existingSlugs.length > 0
      ? `\n\nFORBIDDEN SLUGS (already exist — do NOT use any of these): ${existingSlugs.join(", ")}`
      : "";

  const themeLine = theme
    ? `\n\nTheme/focus for this batch: ${theme}`
    : "\n\nPick fresh, high-intent topics across different US metros and pool-rental occasions.";

  const user = `Generate 10 distinct PRNM pages now.${themeLine}${forbidden}

Each page must follow the HARD RULES above. Cross-link them. Make each one obviously different from the others.`;

  return { system, user };
}

const InputSchema = z.object({
  theme: z.string().max(500).optional(),
  model: z.string().default("google/gemini-2.5-pro"),
  dryRun: z.boolean().default(false),
});

export const generateContentBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };

    // admin gate
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Pull existing slugs to avoid collisions
    const { data: existing } = await supabaseAdmin
      .from("content_pages")
      .select("slug")
      .not("slug", "is", null)
      .limit(2000);
    const existingSlugs = (existing ?? [])
      .map((r) => r.slug as string)
      .filter(Boolean);

    const { system, user } = buildPrompt(existingSlugs.slice(0, 400), data.theme);

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: data.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          tools: [TOOL],
          tool_choice: { type: "function", function: { name: "write_pages" } },
        }),
      },
    );

    if (aiResp.status === 429) throw new Error("Rate limited by AI gateway. Try again in a minute.");
    if (aiResp.status === 402)
      throw new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI gateway ${aiResp.status}: ${t.slice(0, 400)}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments)
      throw new Error("AI did not return tool call");

    let parsed: { pages: GeneratedPage[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      throw new Error("Failed to parse AI tool arguments as JSON");
    }
    const pages = parsed.pages ?? [];

    // Validation
    const errors: string[] = [];
    const seenSlugs = new Set<string>();
    const batchSlugs = new Set(pages.map((p) => p.slug));

    for (const p of pages) {
      if (!p.slug || !/^[a-z0-9-]{10,100}$/.test(p.slug))
        errors.push(`bad slug: "${p.slug}"`);
      if (seenSlugs.has(p.slug)) errors.push(`duplicate slug in batch: ${p.slug}`);
      seenSlugs.add(p.slug);
      if (existingSlugs.includes(p.slug))
        errors.push(`slug already exists in DB: ${p.slug}`);
      const wordCount = (p.body_markdown || "").split(/\s+/).filter(Boolean).length;
      if (wordCount < 800)
        errors.push(`${p.slug}: too short (${wordCount} words)`);
      // internal links
      const linkMatches = [
        ...(p.body_markdown || "").matchAll(/\]\(\/p\/([a-z0-9-]+)\)/g),
      ];
      const linkedSlugs = linkMatches.map((m) => m[1]);
      const validInternal = linkedSlugs.filter((s) => batchSlugs.has(s) && s !== p.slug);
      if (validInternal.length < 2)
        errors.push(
          `${p.slug}: only ${validInternal.length} valid sibling links (need 2+)`,
        );
    }

    if (errors.length > 0 && !data.dryRun) {
      // Surface but still allow partial save? -> reject if more than 30% fail
      const fatal = errors.length > Math.ceil(pages.length * 0.3);
      if (fatal) {
        return {
          ok: false,
          inserted: 0,
          attempted: pages.length,
          validationErrors: errors,
          pages: pages.map((p) => ({ slug: p.slug, title: p.title })),
        };
      }
    }

    if (data.dryRun) {
      return {
        ok: errors.length === 0,
        dryRun: true,
        attempted: pages.length,
        validationErrors: errors,
        pages: pages.map((p) => ({
          slug: p.slug,
          title: p.title,
          words: (p.body_markdown || "").split(/\s+/).length,
        })),
      };
    }

    // Upsert
    const rows = pages.map((p) => ({
      slug: p.slug,
      url_path: `/p/${p.slug}`,
      template_type: p.template_type,
      category: p.category,
      locale: "en",
      status: "published",
      title: p.title,
      description: p.description,
      content: p.body_markdown,
      body_markdown: p.body_markdown,
      seo_title: p.seo_title.slice(0, 70),
      seo_description: p.seo_description.slice(0, 160),
      legacy_slugs: [] as string[],
      updated_at: new Date().toISOString(),
    }));

    const { error: upErr, count } = await supabaseAdmin
      .from("content_pages")
      .upsert(rows, { onConflict: "url_path", count: "exact" });

    if (upErr) throw new Error(`upsert failed: ${upErr.message}`);

    return {
      ok: true,
      inserted: count ?? rows.length,
      attempted: pages.length,
      validationErrors: errors,
      pages: rows.map((r) => ({ slug: r.slug, url_path: r.url_path, title: r.title })),
    };
  });
