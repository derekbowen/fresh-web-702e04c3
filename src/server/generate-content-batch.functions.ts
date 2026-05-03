import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Admin-only: pull N PENDING rows from content_plan, generate full long-form
 * pages via Lovable AI (Gemini) — each guided by its own H1, meta, primary +
 * supporting keywords, uniqueness angle, and required internal links — then
 * validate and insert into content_pages. On success, mark plan rows as
 * generated.
 */

type GeneratedPage = {
  plan_slug: string;
  body_markdown: string;
};

const PER_PAGE_TOOL = {
  type: "function" as const,
  function: {
    name: "write_pages",
    description:
      "Return one full markdown body per planned page. Match the slug exactly to the planned slug.",
    parameters: {
      type: "object",
      properties: {
        pages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              plan_slug: {
                type: "string",
                description: "MUST match exactly one of the planned slugs provided.",
              },
              body_markdown: {
                type: "string",
                description:
                  "FULL article in markdown, 1100-1700 words. Use ## and ### headings. Real paragraphs (not bullet stubs). Cite specific neighborhoods, ordinances, season patterns, dollar ranges. Include the requested internal links as markdown links. Include a UNIQUE-TO-THIS-PAGE section reflecting the uniqueness_angle. End with ## Frequently asked questions (5 ### questions) and a final CTA paragraph.",
              },
            },
            required: ["plan_slug", "body_markdown"],
            additionalProperties: false,
          },
        },
      },
      required: ["pages"],
      additionalProperties: false,
    },
  },
};

type PlanRow = {
  slug: string;
  source_type: string;
  city: string | null;
  state: string | null;
  state_code: string | null;
  population_2024: number | null;
  warm_climate: boolean | null;
  h1: string | null;
  meta_title: string | null;
  meta_description: string | null;
  primary_keyword: string | null;
  supporting_keywords: string | null;
  uniqueness_angle: string | null;
  internal_links: string | null;
  schema_suggestions: string | null;
  notes: string | null;
  search_intent: string | null;
};

function buildPrompt(rows: PlanRow[]) {
  const system = `You write SEO long-form content for Pool Rental Near Me (PRNM), a marketplace where homeowners rent out private pools by the hour.

Brand differentiators (weave in naturally — never list all on one page):
- 10% flat host fee (vs Swimply's 15%+)
- $2M liability insurance included for hosts
- Fast payouts, real human host support

HARD RULES (every page):
1. 1100–1700 words of REAL content. No filler, no "in this article", no bullet-stub paragraphs.
2. Match the page's PRIMARY KEYWORD intent. Use the SUPPORTING KEYWORDS naturally across H2/H3 and prose. Do not keyword-stuff.
3. Include a section that DIRECTLY EXECUTES the UNIQUENESS ANGLE provided — this is what prevents doorway-page cannibalization. Make it concrete (numbers, neighborhood names, ordinance citations, real seasonality).
4. Include EVERY internal link listed in INTERNAL LINKS as a contextual markdown link with varied anchor text. Format: [anchor](/p/{slug-or-path}). If the listed path starts with "/", use it as-is.
5. End with "## Frequently asked questions" containing 5 "### question" subheadings, each answered in 2–4 sentences.
6. End with a final CTA paragraph encouraging the reader to list their pool, linking to /l/draft/00000000-0000-0000-0000-000000000000/new/details
7. Each page in the batch MUST be structurally different from the others (different H2 patterns, different opening hook, different ordering). Do not template across pages.
8. For city pages: cite 3–5 real neighborhoods, mention typical swim-season length for that climate, give realistic hourly price ranges ($45–$95+ depending on metro).

Return ONLY by calling the write_pages tool with one entry per planned page. Match plan_slug exactly.`;

  const planLines = rows
    .map((r, i) => {
      const links = (r.internal_links ?? "")
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      return `--- PAGE ${i + 1} ---
plan_slug: ${r.slug}
H1: ${r.h1 ?? ""}
meta_title: ${r.meta_title ?? ""}
meta_description: ${r.meta_description ?? ""}
primary_keyword: ${r.primary_keyword ?? ""}
supporting_keywords: ${r.supporting_keywords ?? ""}
uniqueness_angle: ${r.uniqueness_angle ?? ""}
internal_links (REQUIRED, all of these): ${links.join(" | ")}
${r.city ? `city: ${r.city}, ${r.state} (${r.state_code})` : ""}
${r.population_2024 ? `population: ${r.population_2024.toLocaleString()}` : ""}
${r.warm_climate === true ? "climate: warm/long swim season" : r.warm_climate === false ? "climate: short/seasonal swim window" : ""}
${r.search_intent ? `search_intent: ${r.search_intent}` : ""}
${r.notes ? `notes: ${r.notes}` : ""}`;
    })
    .join("\n\n");

  const user = `Write ${rows.length} pages now, one per spec below. Each must follow the HARD RULES and be obviously different from its siblings.

${planLines}`;

  return { system, user };
}

const InputSchema = z.object({
  count: z.number().int().min(1).max(10).default(5),
  tier: z
    .enum(["T1 (200k+)", "T2 (75k–199k)", "T3 (25k–74k)", "T4 (10k–24k)", "longtail"])
    .optional(),
  stateCode: z.string().length(2).optional(),
  warmOnly: z.boolean().default(false),
  model: z.string().default("google/gemini-2.5-pro"),
  dryRun: z.boolean().default(false),
});

export const generateContentBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Pull pending plan rows
    let q = supabaseAdmin
      .from("content_plan")
      .select(
        "slug, source_type, city, state, state_code, population_2024, warm_climate, h1, meta_title, meta_description, primary_keyword, supporting_keywords, uniqueness_angle, internal_links, schema_suggestions, notes, search_intent",
      )
      .eq("status", "pending")
      .order("priority_score", { ascending: false, nullsFirst: false })
      .limit(data.count);

    if (data.tier === "longtail") q = q.eq("source_type", "longtail");
    else if (data.tier) q = q.eq("priority_tier", data.tier);
    if (data.stateCode) q = q.eq("state_code", data.stateCode.toUpperCase());
    if (data.warmOnly) q = q.eq("warm_climate", true);

    const { data: planRows, error: planErr } = await q;
    if (planErr) throw new Error(`plan query failed: ${planErr.message}`);
    if (!planRows || planRows.length === 0) {
      return {
        ok: false,
        inserted: 0,
        attempted: 0,
        validationErrors: ["No pending plan rows match those filters."],
        pages: [],
      };
    }

    // Mark them as generating so concurrent runs don't grab the same rows
    if (!data.dryRun) {
      await supabaseAdmin
        .from("content_plan")
        .update({ status: "generating" })
        .in(
          "slug",
          planRows.map((r) => r.slug),
        );
    }

    const { system, user } = buildPrompt(planRows as PlanRow[]);

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
          tools: [PER_PAGE_TOOL],
          tool_choice: { type: "function", function: { name: "write_pages" } },
        }),
      },
    );

    if (aiResp.status === 429) {
      await supabaseAdmin
        .from("content_plan")
        .update({ status: "pending" })
        .in("slug", planRows.map((r) => r.slug));
      throw new Error("Rate limited by AI gateway. Try again in a minute.");
    }
    if (aiResp.status === 402) {
      await supabaseAdmin
        .from("content_plan")
        .update({ status: "pending" })
        .in("slug", planRows.map((r) => r.slug));
      throw new Error("AI credits exhausted. Add funds in Workspace → Usage.");
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      await supabaseAdmin
        .from("content_plan")
        .update({ status: "pending", last_error: `AI ${aiResp.status}` })
        .in("slug", planRows.map((r) => r.slug));
      throw new Error(`AI gateway ${aiResp.status}: ${t.slice(0, 400)}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments)
      throw new Error("AI did not return a tool call");

    let parsed: { pages: GeneratedPage[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse AI tool arguments as JSON");
    }
    const generated = parsed.pages ?? [];
    const bySlug = new Map(generated.map((g) => [g.plan_slug, g]));

    // Validate each plan row's generated body
    const errors: string[] = [];
    const okPages: Array<{ plan: PlanRow; body: string }> = [];

    for (const plan of planRows as PlanRow[]) {
      const gen = bySlug.get(plan.slug);
      if (!gen) {
        errors.push(`${plan.slug}: AI did not return a body`);
        continue;
      }
      const body = gen.body_markdown ?? "";
      const words = body.split(/\s+/).filter(Boolean).length;
      if (words < 900) {
        errors.push(`${plan.slug}: too short (${words} words)`);
        continue;
      }
      const requiredLinks = (plan.internal_links ?? "")
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      const missing = requiredLinks.filter((l) => !body.includes(l));
      if (missing.length > requiredLinks.length / 2) {
        errors.push(
          `${plan.slug}: missing ${missing.length}/${requiredLinks.length} required internal links`,
        );
        continue;
      }
      if (!/##\s*Frequently asked questions/i.test(body)) {
        errors.push(`${plan.slug}: missing FAQ section`);
        continue;
      }
      okPages.push({ plan, body });
    }

    if (data.dryRun) {
      // Reset status
      await supabaseAdmin
        .from("content_plan")
        .update({ status: "pending" })
        .in("slug", planRows.map((r) => r.slug));
      return {
        ok: errors.length === 0,
        dryRun: true,
        attempted: planRows.length,
        validationErrors: errors,
        pages: okPages.map(({ plan, body }) => ({
          slug: plan.slug,
          title: plan.h1,
          words: body.split(/\s+/).filter(Boolean).length,
        })),
      };
    }

    if (okPages.length === 0) {
      await supabaseAdmin
        .from("content_plan")
        .update({ status: "pending", last_error: errors.join("; ").slice(0, 500) })
        .in("slug", planRows.map((r) => r.slug));
      return {
        ok: false,
        inserted: 0,
        attempted: planRows.length,
        validationErrors: errors,
        pages: [],
      };
    }

    // Determine template_type/category from source_type
    const rows = okPages.map(({ plan, body }) => {
      const isCity = plan.source_type === "city";
      return {
        slug: plan.slug,
        url_path: `/p/${plan.slug}`,
        template_type: isCity ? "host_acq_city" : "resource",
        category: isCity ? "Host/City Acquisition" : "Resource/Article Page",
        locale: "en",
        status: "published",
        title: plan.h1 ?? plan.meta_title ?? plan.slug,
        description: plan.meta_description ?? "",
        content: body,
        body_markdown: body,
        seo_title: (plan.meta_title ?? plan.h1 ?? "").slice(0, 70),
        seo_description: (plan.meta_description ?? "").slice(0, 160),
        legacy_slugs: [] as string[],
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upErr, count } = await supabaseAdmin
      .from("content_pages")
      .upsert(rows, { onConflict: "url_path", count: "exact" });

    if (upErr) throw new Error(`upsert failed: ${upErr.message}`);

    // Mark generated rows; revert the failed ones
    const generatedSlugs = okPages.map((p) => p.plan.slug);
    const failedSlugs = (planRows as PlanRow[])
      .map((r) => r.slug)
      .filter((s) => !generatedSlugs.includes(s));

    if (generatedSlugs.length > 0) {
      await supabaseAdmin
        .from("content_plan")
        .update({
          status: "generated",
          generated_at: new Date().toISOString(),
          last_error: null,
        })
        .in("slug", generatedSlugs);
    }
    if (failedSlugs.length > 0) {
      await supabaseAdmin
        .from("content_plan")
        .update({
          status: "pending",
          last_error: errors.join("; ").slice(0, 500),
        })
        .in("slug", failedSlugs);
    }

    return {
      ok: true,
      inserted: count ?? rows.length,
      attempted: planRows.length,
      validationErrors: errors,
      pages: rows.map((r) => ({
        slug: r.slug,
        url_path: r.url_path,
        title: r.title,
      })),
    };
  });
