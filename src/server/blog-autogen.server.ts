import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type GeneratedBlogRow = {
  slug: string;
  title: string;
  topic: string | null;
  word_count: number;
};

export type BlogAutogenInput = {
  count?: number;
  topic?: string;
  titleHint?: string;
  model?: string;
  autoPublish?: boolean;
};

export type BlogAutogenResult = {
  created: GeneratedBlogRow[];
  errors: string[];
  published: number;
};

function slugify(input: string): string {
  return String(input)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function callAiJson(apiKey: string, model: string, system: string, user: string): Promise<any> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (resp.status === 429) throw new Error("Rate limited by AI gateway. Try again in a minute.");
  if (resp.status === 402) throw new Error("AI credits exhausted. Add funds in Workspace > Usage.");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`AI gateway error ${resp.status}: ${t.slice(0, 200)}`);
  }
  const json = await resp.json();
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function runBlogAutogen(input: BlogAutogenInput): Promise<BlogAutogenResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const model = input.model || "google/gemini-3-flash-preview";
  const count = Math.min(Math.max(input.count ?? 1, 1), 10);
  const autoPublish = !!input.autoPublish;

  const { data: existing } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, title")
    .order("updated_at", { ascending: false })
    .limit(300);
  const existingSlugs = new Set((existing ?? []).map((r: any) => r.slug));
  const existingTitlesPreview = (existing ?? [])
    .slice(0, 80)
    .map((r: any) => `- ${r.title}`)
    .join("\n");

  const brainstormSystem =
    "You are an SEO content strategist for 'Pool Rental Near Me', a peer-to-peer pool rental marketplace. Propose original, search-driven blog topics for pool owners, hosts, and renters. Avoid duplicates of existing posts. Use sentence case for titles.";
  const brainstormUser = `Propose ${count} new blog post ideas${
    input.topic ? ` in the category "${input.topic}"` : ""
  }${input.titleHint ? ` related to: "${input.titleHint}"` : ""}.

Existing recent titles to AVOID overlapping with:
${existingTitlesPreview || "(none)"}

Return ONLY valid JSON with this exact shape:
{"ideas":[{"title": string (50-65 chars), "topic": string (short category, 1-3 words), "slug": string (kebab-case, 3-8 words)}]}`;

  const brainstorm = await callAiJson(apiKey, model, brainstormSystem, brainstormUser);
  const rawIdeas: any[] = Array.isArray(brainstorm?.ideas) ? brainstorm.ideas : [];

  const created: GeneratedBlogRow[] = [];
  const errors: string[] = [];
  let published = 0;

  for (const raw of rawIdeas.slice(0, count)) {
    const title = String(raw?.title ?? "").trim();
    if (!title) continue;
    const baseSlug = slugify(String(raw?.slug ?? title));
    if (!baseSlug) continue;
    let slug = baseSlug;
    let n = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${n++}`;
      if (n > 50) break;
    }
    const topic = String(raw?.topic ?? "").trim().slice(0, 60) || input.topic || null;

    const writeSystem =
      "You are an expert SEO content writer for 'Pool Rental Near Me'. Write authoritative, useful, original articles in clear American English. Use sentence case for headings. Prefer concrete numbers, steps, and lists. No fluff.";
    const writeUser = `Write a comprehensive 800-1000 word SEO blog post.
Title: ${title}
Category: ${topic ?? "General"}
Audience: pool owners, hosts, and people looking to rent backyard pools.
Structure: H1 matching the title, 4-6 H2 sections, end with an FAQ (3-5 Q/A) and a short call-to-action mentioning Pool Rental Near Me.
No external links.

Return ONLY valid JSON with this exact shape:
{"seo_title": string (<=60 chars), "seo_description": string (<=160 chars), "excerpt": string (<=200 chars), "tldr_bullets": string[] (3-5 short bullets), "content_markdown": string}`;

    try {
      const article = await callAiJson(apiKey, model, writeSystem, writeUser);
      const content = String(article?.content_markdown ?? "").trim();
      if (!content) {
        errors.push(`${title}: empty content`);
        continue;
      }
      const tldr = Array.isArray(article?.tldr_bullets)
        ? article.tldr_bullets.map((b: any) => String(b)).slice(0, 5)
        : null;

      const insertRow: Record<string, unknown> = {
        slug,
        title,
        topic,
        content,
        excerpt: article?.excerpt ? String(article.excerpt).slice(0, 280) : null,
        seo_title: article?.seo_title ? String(article.seo_title).slice(0, 60) : title.slice(0, 60),
        seo_description: article?.seo_description ? String(article.seo_description).slice(0, 160) : null,
        tldr_bullets: tldr,
        author: "Pool Rental Near Me",
        is_published: autoPublish,
        published_at: autoPublish ? new Date().toISOString() : null,
      };

      const { error: insErr } = await supabaseAdmin.from("blog_posts").insert(insertRow as never);
      if (insErr) {
        errors.push(`${title}: ${insErr.message}`);
        continue;
      }
      existingSlugs.add(slug);
      if (autoPublish) published++;
      created.push({
        slug,
        title,
        topic,
        word_count: content.split(/\s+/).filter(Boolean).length,
      });
    } catch (e) {
      errors.push(`${title}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { created, errors, published };
}
