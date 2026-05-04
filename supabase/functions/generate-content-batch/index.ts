import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://fresh-web.lovable.app",
  "https://www.poolrentalnearme.com",
  "https://poolrentalnearme.com",
]);

function corsHeaders(origin: string | null) {
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.has(origin) ||
      origin.endsWith(".lovable.app") ||
      origin.endsWith(".lovableproject.com"));
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "https://fresh-web.lovable.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

type GeneratedPage = {
  plan_slug: string;
  body_markdown: string;
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

type Input = {
  count?: number;
  tier?: string;
  stateCode?: string;
  warmOnly?: boolean;
  model?: string;
  dryRun?: boolean;
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

Return ONLY valid JSON with this exact shape: {"pages":[{"plan_slug":"...","body_markdown":"..."}]}. Match plan_slug exactly.`;

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

## Section 8 — Find Your Pool in [CITY] 🚀 (150 words; include the city-encoded search link, /p/faq link, AND the App Store + Google Play image markdown above)

## Section 9 — Do You Own a Pool in [CITY]? 🏡 (250 words; the host flip; 1 blockquote; link to https://earn.poolrentalnearme.com, /p/free-host-tools, /p/learningacademy)

## Section 10 — 20 Frequently Asked Questions About [GUIDE_TYPE] Pool Rentals in [CITY] ❓ (numbered **1.** through **20.** as bold; each answer minimum 3 sentences and explicitly references [CITY] weather/neighborhoods/pricing/laws/culture)

## About This Guide 📖 (Derek Bowen bio paragraph + links to /p/learningacademy, /p/free-host-tools, /p/faq)

OUTPUT TARGETS: 4,000+ words (HARD MIN 3,800), 5+ city-specific blockquotes, 20 city-localized FAQs, [📸 IMAGE: ...] placeholders, App Store + Google Play markdown in Section 8, encoded search URL in Sections 4 and 8, 100% original.

Return ONLY valid JSON with this exact shape: {"pages":[{"plan_slug":"...","body_markdown":"..."}]}. Match plan_slug exactly.`;

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

Devuelve SOLO JSON válido con esta forma exacta: {"pages":[{"plan_slug":"...","body_markdown":"..."}]}. Coincide exactamente con plan_slug.`;

function pickSystem(row: PlanRow): string {
  if (row.source_type === "event_guide") return SYSTEM_EVENT_GUIDE;
  if (row.source_type === "hosting_es") return SYSTEM_HOSTING_ES;
  return SYSTEM_VA;
}

function buildPrompt(row: PlanRow) {
  const links = (row.internal_links ?? "")
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);

  const user = `Write exactly one page now. Follow the HARD RULES for its source_type.

plan_slug: ${row.slug}
source_type: ${row.source_type}
H1: ${row.h1 ?? ""}
meta_title: ${row.meta_title ?? ""}
meta_description: ${row.meta_description ?? ""}
primary_keyword: ${row.primary_keyword ?? ""}
supporting_keywords: ${row.supporting_keywords ?? ""}
uniqueness_angle: ${row.uniqueness_angle ?? ""}
internal_links (REQUIRED, all of these): ${links.join(" | ")}
${row.city ? `city: ${row.city}, ${row.state} (${row.state_code})` : ""}
${row.population_2024 ? `population: ${row.population_2024.toLocaleString()}` : ""}
${row.warm_climate === true ? "climate: warm/long swim season" : row.warm_climate === false ? "climate: short/seasonal swim window" : ""}
${row.search_intent ? `search_intent: ${row.search_intent}` : ""}
${row.notes ? `notes: ${row.notes}` : ""}

Return valid JSON only in this exact shape: {"pages":[{"plan_slug":"${row.slug}","body_markdown":"..."}]}`;

  return { system: pickSystem(row), user };
}

function parseInput(value: unknown): Required<Input> {
  const input = (value && typeof value === "object" ? value : {}) as Input;
  const countRaw = Number(input.count ?? 1);
  const count = Number.isFinite(countRaw) ? Math.min(5, Math.max(1, Math.trunc(countRaw))) : 1;
  const stateCode = typeof input.stateCode === "string" && input.stateCode.trim()
    ? input.stateCode.trim().toUpperCase().slice(0, 2)
    : "";
  const tier = typeof input.tier === "string" ? input.tier : "";
  return {
    count,
    tier,
    stateCode,
    warmOnly: Boolean(input.warmOnly),
    model: typeof input.model === "string" && input.model ? input.model : "google/gemini-2.5-pro",
    dryRun: Boolean(input.dryRun),
  };
}

function extractJson(text: string): { pages?: GeneratedPage[] } {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(trimmed);
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function generateOne(plan: PlanRow, model: string, apiKey: string): Promise<GeneratedPage | null> {
  const { system, user } = buildPrompt(plan);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 145_000);
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_tokens: plan.source_type === "event_guide" ? 12000 : 8500,
      }),
    });

    if (resp.status === 429) throw new Error("Rate limited by AI gateway. Try again in a minute.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Add funds in Workspace > Usage.");
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`AI gateway error ${resp.status}: ${text.slice(0, 300)}`);
    }

    const payload = await resp.json();
    const message = payload?.choices?.[0]?.message;
    const raw = message?.content ?? message?.tool_calls?.[0]?.function?.arguments;
    if (!raw || typeof raw !== "string") throw new Error("AI returned an empty response");
    const parsed = extractJson(raw);
    const page = parsed.pages?.[0];
    if (!page?.body_markdown) throw new Error("AI returned JSON without body_markdown");
    return { plan_slug: plan.slug, body_markdown: page.body_markdown };
  } catch (e) {
    console.error(`[generate-content-batch:${plan.slug}] ${errorMessage(e)}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Backend is not configured");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing in backend function environment");

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = parseInput(await req.json().catch(() => ({})));

    await supabase
      .from("content_plan")
      .update({ status: "pending", last_error: "Released from interrupted generation run" })
      .eq("status", "generating")
      .lt("updated_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

    let query = supabase
      .from("content_plan")
      .select("slug, source_type, city, state, state_code, population_2024, warm_climate, h1, meta_title, meta_description, primary_keyword, supporting_keywords, uniqueness_angle, internal_links, schema_suggestions, notes, search_intent")
      .eq("status", "pending")
      .order("priority_score", { ascending: false, nullsFirst: false })
      .limit(data.count);

    if (data.tier === "longtail") query = query.eq("source_type", "longtail");
    else if (data.tier) query = query.eq("priority_tier", data.tier);
    if (data.stateCode) query = query.eq("state_code", data.stateCode);
    if (data.warmOnly) query = query.eq("warm_climate", true);

    const { data: planRowsRaw, error: planErr } = await query;
    if (planErr) throw new Error(`plan query failed: ${planErr.message}`);
    const planRows = (planRowsRaw ?? []) as PlanRow[];
    if (planRows.length === 0) {
      return new Response(JSON.stringify({
        ok: false,
        inserted: 0,
        attempted: 0,
        validationErrors: ["No pending plan rows match those filters."],
        pages: [],
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (!data.dryRun) {
      await supabase
        .from("content_plan")
        .update({ status: "generating" })
        .in("slug", planRows.map((r) => r.slug));
    }

    const generated: GeneratedPage[] = [];
    for (const row of planRows) {
      const result = await generateOne(row, data.model, apiKey);
      if (result) generated.push(result);
    }

    const bySlug = new Map(generated.map((g) => [g.plan_slug, g]));
    const errors: string[] = [];
    const okPages: Array<{ plan: PlanRow; body: string }> = [];

    for (const plan of planRows) {
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
        errors.push(`${plan.slug}: missing ${missing.length}/${requiredLinks.length} required internal links`);
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
      const missingSections = requiredSections.filter(([re]) => !re.test(body)).map(([, label]) => label);
      if (missingSections.length > 0) {
        errors.push(`${plan.slug}: missing ${missingSections.join(", ")}`);
        continue;
      }
      okPages.push({ plan, body });
    }

    if (data.dryRun) {
      await supabase.from("content_plan").update({ status: "pending" }).in("slug", planRows.map((r) => r.slug));
      return new Response(JSON.stringify({
        ok: errors.length === 0,
        dryRun: true,
        attempted: planRows.length,
        validationErrors: errors,
        pages: okPages.map(({ plan, body }) => ({
          slug: plan.slug,
          title: plan.h1,
          words: body.split(/\s+/).filter(Boolean).length,
        })),
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (okPages.length === 0) {
      await supabase
        .from("content_plan")
        .update({ status: "pending", last_error: errors.join("; ").slice(0, 500) })
        .in("slug", planRows.map((r) => r.slug));
      return new Response(JSON.stringify({
        ok: false,
        inserted: 0,
        attempted: planRows.length,
        validationErrors: errors,
        pages: [],
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const rows = okPages.map(({ plan, body }) => {
      const isCity = plan.source_type === "city";
      const isEvent = plan.source_type === "event_guide";
      const isEs = plan.source_type === "hosting_es";
      const template_type = isCity ? "host_acq_city" : isEvent ? "event_guide" : isEs ? "host_acq_city_es" : "resource";
      const category = isCity ? "Host/City Acquisition" : isEvent ? "Event Guide" : isEs ? "Host/City Acquisition (ES)" : "Resource/Article Page";
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
        legacy_slugs: [],
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upErr, count } = await supabase
      .from("content_pages")
      .upsert(rows, { onConflict: "url_path", count: "exact" });
    if (upErr) throw new Error(`upsert failed: ${upErr.message}`);

    const generatedSlugs = okPages.map((p) => p.plan.slug);
    const failedSlugs = planRows.map((r) => r.slug).filter((s) => !generatedSlugs.includes(s));

    if (generatedSlugs.length > 0) {
      await supabase.from("content_plan").update({
        status: "generated",
        generated_at: new Date().toISOString(),
        last_error: null,
      }).in("slug", generatedSlugs);
    }
    if (failedSlugs.length > 0) {
      await supabase.from("content_plan").update({
        status: "pending",
        last_error: errors.join("; ").slice(0, 500),
      }).in("slug", failedSlugs);
    }

    return new Response(JSON.stringify({
      ok: true,
      inserted: count ?? rows.length,
      attempted: planRows.length,
      validationErrors: errors,
      pages: rows.map((r) => ({ slug: r.slug, url_path: r.url_path, title: r.title })),
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[generate-content-batch]", e);
    return new Response(JSON.stringify({ error: errorMessage(e) }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }
});
