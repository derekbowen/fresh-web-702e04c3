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
                  "FULL article in markdown, 2,500–3,500 words, following the 9-section VA template exactly (H1, Intro, Main Educational Content with 4–6 H2s + at least one markdown table + one numbered process, Mid-Page Earnings Callout blockquote, '## How This Affects Pool Rental Hosts', '## Offset Your [TOPIC] Costs With Pool Rental Income', '## Frequently Asked Questions' with 5–7 ### Q: questions, '## Related Pool Owner Guides' with the required internal links, and the exact Final CTA block). Topic-specific only — never generic.",
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
  const system = `You are an expert SEO content writer and pool care specialist writing for Pool Rental Near Me (poolrentalnearme.com) — a marketplace where homeowners rent out private pools by the hour to earn passive income ($3,000–$15,000/year).

Your content serves two audiences simultaneously:
1. Pool owners who need accurate, actionable information about the page's topic
2. Pool owners who could earn money renting their pool on PRNM

BRAND DIFFERENTIATORS (weave in naturally — never list all on one page):
- 10% flat host fee (vs Swimply's 15%+)
- $2M liability insurance included on every booking
- Payouts within 24 hours
- Free to list, full host control over guests and schedule

ABSOLUTE RULES — these override everything else:
🚫 NEVER copy or closely paraphrase any other pool website. All content must be original.
🚫 NEVER use AI-obvious phrases: "In conclusion", "It is worth noting", "It is important to", "Dive into", "In this guide", "In this article".
🚫 NEVER pad with generic filler — every paragraph must teach the reader something real.
🚫 NEVER skip a section. NEVER stop before 2,500 words.
✅ Write as a pool professional with 10+ years experience talking to a knowledgeable neighbor.

MANDATORY 9-SECTION STRUCTURE (in this exact order, with these exact H2 wordings):

## SECTION 1 — H1
Use: # {H1} (must match the provided H1 exactly, no markdown bold)

## SECTION 2 — Introduction (150–200 words)
- Open with a relatable pain point or question a real pool owner has
- Use the PRIMARY KEYWORD naturally in the first 100 words
- Promise what the reader will learn
- Do NOT mention pool rentals here — pure education

## SECTION 3 — Main Educational Content (1,000–1,500 words, 4–6 H2 subsections)
- Specific numbers, measurements, chemical ratios, timeframes, dollar ranges
- At least 1 markdown comparison/data table
- At least 1 numbered step-by-step process
- Common mistakes + pro tips that show real expertise
- Each H2 must add unique value — no filler

## SECTION 4 — Mid-Page Callout (REQUIRED, exact blockquote)
Insert this exact blockquote after Section 3:
> 💰 **Did you know?** Pool owners on Pool Rental Near Me earn an average of
> **$500–$1,500/month** renting their pool by the hour. That's enough to cover
> your entire annual pool maintenance budget — often with money to spare.
> [See how much your pool could earn →](/p/hosting)

## SECTION 5 — How This Affects Pool Rental Hosts (300–400 words)
H2 must be exactly: ## How This Affects Pool Rental Hosts
- Connect THIS page's specific topic to hosting on PRNM
- Why proper handling of this topic earns better reviews
- Cite a concrete standard hosts should meet
- Sound like a successful host, not a sales pitch

## SECTION 6 — Offset Your {TOPIC} Costs With Pool Rental Income (400–500 words)
H2 must be exactly: ## Offset Your {TOPIC} Costs With Pool Rental Income
(replace {TOPIC} with this page's actual topic — e.g. "Chlorine", "Pool Heating", "Quinceañera Venue")
- Open with the real annual cost of THIS topic
- Contrast with realistic PRNM rental earnings ($3,000–$15,000/year by city)
- Briefly explain the model (list, set price, approve bookings, 10% fee, $2M coverage)
- Give a specific city earnings example (e.g. "A host in Phoenix renting 3 hrs/day, 4 days/week at $45/hr earns ~$2,800/month")
- Close with: [Calculate what your pool could earn →](/p/hosting)

## SECTION 7 — FAQ (5–7 questions, 60–100 words each)
H2 must be exactly: ## Frequently Asked Questions
Format every question as: ### Q: {question}
Questions must be UNIQUE to this page's topic — not interchangeable with any other page.

## SECTION 8 — Related Pool Owner Guides (REQUIRED)
H2 must be exactly: ## Related Pool Owner Guides
Write a 2-sentence intro, then list EVERY internal link provided as natural-anchor markdown bullets.
Never use "click here", "read more", or bare URLs.

## SECTION 9 — Final CTA (REQUIRED, exact block)
End with this exact markdown block, unchanged:
---
## Ready to Turn Your Pool Into Income?
You already do the work to keep your pool perfect. Now let it pay you back.
Pool owners in your area are earning $500–$2,000/month renting their pool by the hour to swimmers, families, and fitness enthusiasts — with full control over their schedule.
**[→ List Your Pool for Free on Pool Rental Near Me](/p/hosting)**
**[→ See How Much Your Pool Could Earn](/p/hosting#calculator)**
---

CITY-PAGE EXTRAS: When the page is for a city, cite 3–5 real neighborhoods, mention the local swim-season length, give realistic local hourly price ranges ($45–$95+ depending on metro), and execute the UNIQUENESS ANGLE concretely (numbers, neighborhoods, ordinances, real seasonality).

EACH PAGE in a batch must be structurally distinct (different opening hook, different H2 ordering inside Section 3, different table topic). Do not template across pages.

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
  count: z.number().int().min(1).max(25).default(5),
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
      if (words < 2200) {
        errors.push(`${plan.slug}: too short (${words} words, need 2,500+)`);
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
      const requiredSections: Array<[RegExp, string]> = [
        [/##\s*How This Affects Pool Rental Hosts/i, "Section 5 (How This Affects Hosts)"],
        [/##\s*Offset Your .+ Costs With Pool Rental Income/i, "Section 6 (Offset Costs)"],
        [/##\s*Frequently Asked Questions/i, "Section 7 (FAQ)"],
        [/##\s*Related Pool Owner Guides/i, "Section 8 (Related Guides)"],
        [/##\s*Ready to Turn Your Pool Into Income\?/i, "Section 9 (Final CTA)"],
        [/💰\s*\*\*Did you know\?\*\*/, "Section 4 (Mid-page Callout)"],
      ];
      const missingSections = requiredSections
        .filter(([re]) => !re.test(body))
        .map(([, label]) => label);
      if (missingSections.length > 0) {
        errors.push(`${plan.slug}: missing ${missingSections.join(", ")}`);
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
