/**
 * Activity-modifier city page generator.
 * Admin-only. Generates AI-written content for /p/{activity-prefix}{city-slug}
 * pages and inserts them into content_pages as drafts.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTIVITIES,
  buildActivityCitySlug,
  findActivity,
  type ActivityKey,
} from "@/lib/activity-city";
import { parseCitySlug } from "@/lib/city-slug";

async function requireAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-pro";

const ACTIVITY_KEYS: [ActivityKey, ...ActivityKey[]] = [
  "pool-party",
  "baby-shower",
  "birthday-party",
  "hot-tub",
  "dog-friendly",
];

const generateSchema = z.object({
  activity: z.enum(ACTIVITY_KEYS),
  citySlugs: z.array(z.string().min(1).max(100)).min(1).max(50),
  model: z.string().optional(),
  dryRun: z.boolean().optional(),
});

interface GeneratedPage {
  slug: string;
  citySlug: string;
  cityName: string;
  status: "inserted" | "skipped_exists" | "failed" | "dry_run";
  error?: string;
  wordCount?: number;
  seoTitle?: string;
}

interface PageContent {
  seoTitle: string;
  seoDescription: string;
  body: string;
  faqs: Array<{ question: string; answer: string }>;
}

function buildPrompt(activityKey: ActivityKey, cityName: string, stateCode: string | null): string {
  const a = findActivity(activityKey);
  if (!a) throw new Error(`Unknown activity: ${activityKey}`);
  const where = stateCode ? `${cityName}, ${stateCode}` : cityName;
  return [
    `Write a 1500-2000 word page about "${a.promptTopic}" in ${where}.`,
    `The page lives on Pool Rental Near Me, a peer-to-peer pool rental marketplace.`,
    ``,
    `Voice & style rules (STRICT):`,
    `- Sentence case headings, never Title Case.`,
    `- Second person ("you", "your guests").`,
    `- No em dashes — use commas or restructure.`,
    `- Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.`,
    `- Banned phrases: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "proven track record".`,
    `- Numbers under 10 spelled out, 10+ as numerals. Hourly rates as "$X/hour".`,
    `- Real numbers only. Typical pool rental rates are $40-150/hour. Never invent statistics.`,
    ``,
    `Required structure (use H2 / H3 markdown, NO H1 — the page wraps an H1 already):`,
    `1. Intro (3-4 paragraphs). Must include at least 2 specific signals about ${where}: a real neighborhood name, the climate or swim season, the local event scene, or a landmark. Do NOT copy these from other cities.`,
    `2. ## Why book a ${a.promptTopic} through Pool Rental Near Me. Sub-bullets: $2M liability insurance included on every booking, hourly rates ($40-150 typical), instant book, host fee is 10% flat (lower than competitors).`,
    `3. ## What to expect at a ${a.promptTopic} in ${cityName}. Activity-specific guidance: typical capacity, common amenities renters look for, time-of-day tips, hourly rate band for this activity in this city.`,
    `4. ## Pool features that matter for ${a.promptTopic}. List 4-6 specific features (heated pool, shallow end, shade, restroom access, parking, BBQ, sound system) and why each matters for this activity.`,
    `5. ## How to book your ${cityName} pool. Three-step walkthrough: search, message host, instant book. Mention $2M cover.`,
    `6. ## ${cityName} pool rental rates for ${a.promptTopic}. One paragraph with a realistic hourly range for this activity in this city. Never invent specific dollar averages.`,
    ``,
    `Output format: JSON only, no markdown fences, exactly this shape:`,
    `{`,
    `  "seoTitle": string (50-60 chars, must include "${cityName}", sentence case),`,
    `  "seoDescription": string (140-160 chars, second person, no banned words),`,
    `  "body": string (the markdown body, 1500-2000 words, sections above),`,
    `  "faqs": [ { "question": string, "answer": string } ]  // 6-8 entries, ${cityName}-specific where possible`,
    `}`,
  ].join("\n");
}

async function callAi(prompt: string, model: string): Promise<PageContent> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Derek Bowen, a peer-to-peer pool rental expert writing for Pool Rental Near Me. Follow the structural and voice rules exactly. Output strict JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached. Retry in a minute.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings > Workspace > Usage.");
    throw new Error(`AI gateway error [${res.status}]: ${t.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("AI returned empty content");

  let parsed: PageContent;
  try {
    parsed = JSON.parse(raw) as PageContent;
  } catch (e) {
    throw new Error(`AI returned non-JSON: ${raw.slice(0, 200)}`);
  }

  if (!parsed.seoTitle || !parsed.seoDescription || !parsed.body) {
    throw new Error("AI response missing required fields");
  }
  if (parsed.seoTitle.length > 65) parsed.seoTitle = parsed.seoTitle.slice(0, 60);
  if (parsed.seoDescription.length > 165) parsed.seoDescription = parsed.seoDescription.slice(0, 160);

  const wordCount = parsed.body.split(/\s+/).filter(Boolean).length;
  if (wordCount < 1200) throw new Error(`AI body too short (${wordCount} words, need ≥1200)`);

  return parsed;
}

export const generateActivityCityPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => generateSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ pages: GeneratedPage[] }> => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);

    const activity = findActivity(data.activity);
    if (!activity) throw new Error(`Unknown activity: ${data.activity}`);
    const model = data.model || DEFAULT_MODEL;
    const results: GeneratedPage[] = [];

    for (const citySlug of data.citySlugs) {
      const newSlug = buildActivityCitySlug(activity.key, citySlug);

      // Resolve city display name (prefer cities table; fall back to slug parse)
      let cityName = "";
      let stateCode: string | null = null;
      const { data: cityRow } = await supabaseAdmin
        .from("cities")
        .select("name, state_code")
        .eq("slug", citySlug)
        .maybeSingle();
      if (cityRow) {
        cityName = cityRow.name;
        stateCode = cityRow.state_code;
      } else {
        const parts = parseCitySlug(citySlug);
        cityName = parts.city;
        stateCode = parts.stateCode;
      }

      // Skip if a page with this slug already exists (canonical or legacy alias)
      const { data: existing } = await supabaseAdmin
        .from("content_pages")
        .select("id")
        .or(`slug.eq.${newSlug},legacy_slugs.cs.{${newSlug}}`)
        .maybeSingle();
      if (existing) {
        results.push({
          slug: newSlug,
          citySlug,
          cityName,
          status: "skipped_exists",
        });
        continue;
      }

      try {
        if (data.dryRun) {
          results.push({
            slug: newSlug,
            citySlug,
            cityName,
            status: "dry_run",
            seoTitle: activity.seoTitle(stateCode ? `${cityName}, ${stateCode}` : cityName),
          });
          continue;
        }

        const prompt = buildPrompt(activity.key, cityName, stateCode);
        const content = await callAi(prompt, model);

        const { error: insertErr } = await supabaseAdmin.from("content_pages").insert({
          slug: newSlug,
          url_path: `/p/${newSlug}`,
          source_url: `/p/${newSlug}`,
          template_type: "activity_city",
          category: "activity_city",
          locale: "en",
          status: "draft",
          in_sitemap: false,
          title: activity.h1(stateCode ? `${cityName}, ${stateCode}` : cityName),
          seo_title: content.seoTitle,
          seo_description: content.seoDescription,
          description: content.seoDescription,
          body_markdown: content.body,
          content: content.body,
          faq_items: content.faqs ?? [],
          focus_keyword: `${activity.label.toLowerCase()} ${cityName.toLowerCase()}`,
        });

        if (insertErr) throw new Error(insertErr.message);

        results.push({
          slug: newSlug,
          citySlug,
          cityName,
          status: "inserted",
          wordCount: content.body.split(/\s+/).filter(Boolean).length,
          seoTitle: content.seoTitle,
        });
      } catch (e) {
        results.push({
          slug: newSlug,
          citySlug,
          cityName,
          status: "failed",
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return { pages: results };
  });

const publishSchema = z.object({
  slugs: z.array(z.string().min(1).max(120)).min(1).max(500),
});

export const publishActivityCityPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => publishSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ published: number }> => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);

    const { data: updated, error } = await supabaseAdmin
      .from("content_pages")
      .update({ status: "published", in_sitemap: true })
      .eq("template_type", "activity_city")
      .in("slug", data.slugs)
      .select("id");
    if (error) throw new Error(error.message);
    return { published: updated?.length ?? 0 };
  });

export const listActivityCityPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);

    const { data, error } = await supabaseAdmin
      .from("content_pages")
      .select("slug, seo_title, status, updated_at, content")
      .eq("template_type", "activity_city")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    return {
      rows: (data ?? []).map((r: any) => ({
        slug: r.slug,
        seo_title: r.seo_title,
        status: r.status,
        updated_at: r.updated_at,
        word_count: (r.content ?? "").split(/\s+/).filter(Boolean).length,
      })),
      activities: ACTIVITIES.map((a) => ({ key: a.key, label: a.label, slugPrefix: a.slugPrefix })),
    };
  });

export const listCandidateCities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const limit = data.limit ?? 50;

    // Top metros by GSC impressions on their existing canonical city page
    const { data: rows, error } = await supabaseAdmin
      .from("cities")
      .select("slug, name, state_code")
      .eq("is_published", true)
      .order("name", { ascending: true })
      .limit(limit * 5);
    if (error) throw new Error(error.message);

    return { cities: (rows ?? []).slice(0, limit) };
  });
