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
                  "FULL article in markdown. Follow the exact template specified for this page's source_type (resource/city = 9-section VA, event_guide = Michelin v2.1 10-section guide, hosting_es = Spanish anfitrion template). Topic- and city-specific only — never generic.",
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

const SYSTEM_VA = `You are an expert SEO content writer and pool care specialist writing for Pool Rental Near Me (poolrentalnearme.com) — a marketplace where homeowners rent out private pools by the hour to earn passive income ($3,000–$15,000/year).

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

## SECTION 3 — Main Educational Content (1,000–1,500 words, 4–6 H2 subsections, at least 1 markdown table, at least 1 numbered process)

## SECTION 4 — Mid-Page Callout (REQUIRED, exact blockquote)
> 💰 **Did you know?** Pool owners on Pool Rental Near Me earn an average of
> **$500–$1,500/month** renting their pool by the hour. That's enough to cover
> your entire annual pool maintenance budget — often with money to spare.
> [See how much your pool could earn →](/p/hosting)

## SECTION 5 — How This Affects Pool Rental Hosts (300–400 words)
H2 must be exactly: ## How This Affects Pool Rental Hosts

## SECTION 6 — Offset Your {TOPIC} Costs With Pool Rental Income (400–500 words)
H2 must be exactly: ## Offset Your {TOPIC} Costs With Pool Rental Income

## SECTION 7 — FAQ (5–7 ### Q: questions)
H2 must be exactly: ## Frequently Asked Questions

## SECTION 8 — Related Pool Owner Guides (REQUIRED)
H2 must be exactly: ## Related Pool Owner Guides
List EVERY internal link provided as natural-anchor markdown bullets.

## SECTION 9 — Final CTA (REQUIRED, exact block)
---
## Ready to Turn Your Pool Into Income?
You already do the work to keep your pool perfect. Now let it pay you back.
Pool owners in your area are earning $500–$2,000/month renting their pool by the hour to swimmers, families, and fitness enthusiasts — with full control over their schedule.
**[→ List Your Pool for Free on Pool Rental Near Me](/p/hosting)**
**[→ See How Much Your Pool Could Earn](/p/hosting#calculator)**
---

Return ONLY by calling the write_pages tool with one entry per planned page. Match plan_slug exactly.`;

const SYSTEM_EVENT_GUIDE = `You are a Senior Local Editor and SEO Strategist for Pool Rental Near Me (poolrentalnearme.com). Write 4,000-word, locally authoritative Michelin-Guide-quality articles for renting a pool for an EVENT TYPE in a specific CITY/STATE.

ABSOLUTE LOCAL RULE: If you can swap [CITY] for any other city and the sentence still makes sense, DELETE and rewrite. Every paragraph must be unique to this city — real climate, real neighborhoods (NEVER invented), real local venues, real cultural events.

EEAT: Author = Derek Bowen, founder of Pool Rental Near Me, author of 6 Amazon books on pool hosting. Be honest about costs and alternatives.

STRICT LINKING (do NOT invent URLs — only these):
- Internal: /p/guest-pool-safety-guidelines, /p/swimply-alternative-vs-pool-rental-near-me, /p/free-host-tools, /p/faq, /p/learningacademy
- Subdomains: https://earn.poolrentalnearme.com, https://waiver.poolrentalnearme.com, https://rules.poolrentalnearme.com
- Search soft-landing: https://www.poolrentalnearme.com/s?address={CITY}%2C+{STATE} (spaces=+, comma=%2C+)
- App store images (use exact markdown):
  [![Download on the App Store](https://i.imgur.com/Tm9YQ6u.png)](https://apps.apple.com/us/app/pool-rental-near-me/id6737762373)
  [![Get it on Google Play](https://res.cloudinary.com/doybcwjsn/image/upload/v1733169830/google-play_2_a4jpw5.png)](https://play.google.com/store/apps/details?id=com.poolrentalnearme.app.prod&pcampaignid=web_share)

MANDATORY STRUCTURE (use these exact H2s — replace [CITY] / [GUIDE_TYPE] with actual values from the page spec):

# {H1}

## Section 1 — Why [CITY] Is Perfect (Or Necessary) For a [GUIDE_TYPE] at a Pool 🌡️ (250 words; visceral local opening; 1 blockquote with [CITY] weather/culture stat; image placeholder)

## Section 2 — Every Option for a [GUIDE_TYPE] in [CITY] (And What They Actually Cost) 🎯 (500 words; ### Option 1 = real local equivalent venue; ### Option 2 = real public pool/park in [CITY]; ### Option 3 = Private Pool Rental Through Pool Rental Near Me; close with cost-comparison blockquote)

## Section 3 — The Complete [GUIDE_TYPE] Planning Guide for [CITY] 📋 (1,000 words; 8 numbered ### Step subsections covering date, capacity, amenities, booking, what-to-bring, setup, during, wrap-up; 1 [CITY]-specific pro-tip blockquote; image placeholder)

## Section 4 — What a [GUIDE_TYPE] Pool Rental Actually Costs in [CITY] 💰 (300 words; real [CITY] hourly ranges; comparison vs alternative; 1 budgeting blockquote; include the search soft-landing link)

## Section 5 — Best [CITY] Neighborhoods for a [GUIDE_TYPE] Pool Rental 📍 (350 words; 6–8 REAL [CITY] neighborhood names; never invent; 1 blockquote)

## Section 6 — Safety & Peace of Mind for Your [GUIDE_TYPE] 🛡️ (250 words; mention $2M liability included; link to /p/guest-pool-safety-guidelines, /p/swimply-alternative-vs-pool-rental-near-me, https://waiver.poolrentalnearme.com, https://rules.poolrentalnearme.com)

## Section 7 — Making Your [GUIDE_TYPE] Unforgettable 🌟 (250 words; local creative ideas; 1 blockquote; image placeholder)

## Section 8 — Find Your Pool in [CITY] 🚀 (150 words; warm CTA; include the city-encoded search link, /p/faq link, AND the App Store + Google Play image markdown above)

## Section 9 — Do You Own a Pool in [CITY]? 🏡 (250 words; the host flip; 1 blockquote; link to https://earn.poolrentalnearme.com, /p/free-host-tools, /p/learningacademy)

## Section 10 — 20 Frequently Asked Questions About [GUIDE_TYPE] Pool Rentals in [CITY] ❓ (numbered **1.** through **20.** as bold; each answer minimum 3 sentences and explicitly references [CITY] weather/neighborhoods/pricing/laws/culture; cover booking lead time, cost, capacity, neighborhoods, alcohol, rain, supplies, child safety, music/DJ, decorations, food/catering, booking process, insurance, vs Swimply, weekday rentals, heated pools, shallow ends, cancellation, reviews, host-flip)

## About This Guide 📖 (Derek Bowen bio paragraph + links to /p/learningacademy, /p/free-host-tools, /p/faq)

OUTPUT TARGETS: 4,000+ words (HARD MIN 3,800), 5+ city-specific blockquotes, 20 city-localized FAQs, [📸 IMAGE: ...] placeholders, App Store + Google Play markdown in Section 8, encoded search URL in Sections 4 and 8, 100% original.

Return ONLY by calling the write_pages tool. Match plan_slug exactly.`;

const SYSTEM_HOSTING_ES = `Eres un editor SEO senior escribiendo en ESPAÑOL NEUTRO para Pool Rental Near Me. Genera una página única "Conviértete en Anfitrión de Piscina" para una ciudad de EE. UU. con población hispana significativa.

REGLAS:
- Español neutro. Usa "piscina", "alberca" (México) y "pileta" (Argentina) donde encaje.
- 1,800–2,200 palabras de contenido 100% único — NUNCA cambios perezosos de nombre de ciudad.
- Investiga la ciudad: clima, vecindarios reales, demografía hispana.
- Sin tablas. Markdown simple.
- NO inventes URLs. Usa solo: /p/hosting, /p/free-host-tools, /p/faq, /p/learningacademy, https://earn.poolrentalnearme.com
- Soporte: espanol@poolrentalnearme.com, (213) 444-3745

DIFERENCIADORES: 10% tarifa plana, seguro $2M incluido, pagos en 24h, soporte en español, anfitriones ganan $3,000–$15,000+/año.

ESTRUCTURA OBLIGATORIA:

# {H1}

## ¿Por Qué Rentar Tu Piscina en {CIUDAD}, {ESTADO}? 🏊 (200 palabras, clima/vecindarios reales)

## Cuánto Puedes Ganar Como Anfitrión en {CIUDAD} 💰

## Cómo Funciona en 5 Pasos 📋

## Por Qué Pool Rental Near Me y No Swimply 🛡️

## Vecindarios de {CIUDAD} con Mayor Demanda 📍 (3–5 vecindarios REALES)

## Casos de Uso Más Populares 🎉 (quinceañera, cumpleaños, reunión familiar, baby shower, despedida de soltera, clases de natación, sesión de fotos, baño para perros)

## Herramientas Gratuitas para Anfitriones 🛠️

## Soporte en Español Cuando Lo Necesites 📞 (espanol@poolrentalnearme.com, (213) 444-3745)

## Preguntas Frecuentes ❓ (15 preguntas formato **1.** ... respuestas localizadas a {CIUDAD}, mínimo 3 oraciones)

## ¿Listo Para Empezar? 🚀 (CTA final con /p/hosting y https://earn.poolrentalnearme.com)

Devuelve SOLO llamando a write_pages. Coincide exactamente con plan_slug.`;

function pickSystem(rows: PlanRow[]): string {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.source_type] = (counts[r.source_type] ?? 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (top === "event_guide") return SYSTEM_EVENT_GUIDE;
  if (top === "hosting_es") return SYSTEM_HOSTING_ES;
  return SYSTEM_VA;
}

function buildPrompt(rows: PlanRow[]) {
  const system = pickSystem(rows);

  const planLines = rows
    .map((r, i) => {
      const links = (r.internal_links ?? "")
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      return `--- PAGE ${i + 1} ---
plan_slug: ${r.slug}
source_type: ${r.source_type}
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

  const user = `Write ${rows.length} pages now, one per spec below. Each must follow the HARD RULES for its source_type and be obviously different from its siblings.

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

      const isEvent = plan.source_type === "event_guide";
      const isEs = plan.source_type === "hosting_es";
      const minWords = isEvent ? 3500 : isEs ? 1600 : 2200;
      if (words < minWords) {
        errors.push(`${plan.slug}: too short (${words} words, need ${minWords}+)`);
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

      let requiredSections: Array<[RegExp, string]> = [];
      if (isEvent) {
        requiredSections = [
          [/##\s*Section\s*1\b.*Why\b/i, "Section 1 (Why City)"],
          [/##\s*Section\s*3\b.*Planning Guide/i, "Section 3 (Planning Guide)"],
          [/##\s*Section\s*5\b.*Neighborhoods/i, "Section 5 (Neighborhoods)"],
          [/##\s*Section\s*9\b.*Do You Own/i, "Section 9 (Host Flip)"],
          [/##\s*Section\s*10\b.*Frequently Asked/i, "Section 10 (20 FAQs)"],
          [/\*\*20\.\*\*/, "20 numbered FAQs"],
        ];
      } else if (isEs) {
        requiredSections = [
          [/##\s*¿Por Qué Rentar Tu Piscina/i, "¿Por Qué Rentar?"],
          [/##\s*Cuánto Puedes Ganar/i, "Cuánto Puedes Ganar"],
          [/##\s*Preguntas Frecuentes/i, "Preguntas Frecuentes"],
          [/##\s*¿Listo Para Empezar\?/i, "¿Listo Para Empezar?"],
          [/\*\*15\.\*\*/, "15 numbered FAQs"],
        ];
      } else {
        requiredSections = [
          [/##\s*How This Affects Pool Rental Hosts/i, "Section 5 (How This Affects Hosts)"],
          [/##\s*Offset Your .+ Costs With Pool Rental Income/i, "Section 6 (Offset Costs)"],
          [/##\s*Frequently Asked Questions/i, "Section 7 (FAQ)"],
          [/##\s*Related Pool Owner Guides/i, "Section 8 (Related Guides)"],
          [/##\s*Ready to Turn Your Pool Into Income\?/i, "Section 9 (Final CTA)"],
          [/💰\s*\*\*Did you know\?\*\*/, "Section 4 (Mid-page Callout)"],
        ];
      }
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
      const t = plan.source_type;
      const isCity = t === "city";
      const isEvent = t === "event_guide";
      const isEs = t === "hosting_es";
      const template_type = isCity
        ? "host_acq_city"
        : isEvent
        ? "event_guide"
        : isEs
        ? "host_acq_city_es"
        : "resource";
      const category = isCity
        ? "Host/City Acquisition"
        : isEvent
        ? "Event Guide"
        : isEs
        ? "Host/City Acquisition (ES)"
        : "Resource/Article Page";
      return {
        slug: plan.slug,
        url_path: `/p/${plan.slug}`,
        template_type,
        category,
        locale: isEs ? "es" : "en",
        status: "published",
        in_sitemap: true,
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
