import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export type AdminBlogRow = {
  slug: string;
  title: string;
  topic: string | null;
  is_published: boolean;
  word_count: number;
  updated_at: string;
};

export const adminListBlogPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: AdminBlogRow[] }> => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);

    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, title, topic, is_published, content, updated_at")
      .order("topic", { ascending: true })
      .order("title", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);

    const rows: AdminBlogRow[] = (data ?? []).map((r: any) => ({
      slug: r.slug,
      title: r.title,
      topic: r.topic,
      is_published: r.is_published,
      word_count: (r.content ?? "").split(/\s+/).filter(Boolean).length,
      updated_at: r.updated_at,
    }));
    return { rows };
  });

const expandSchema = z.object({
  slug: z.string().min(1).max(160),
  model: z.string().optional(),
});

export const adminExpandBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => expandSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, title, topic")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) throw new Error("Post not found");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const model = data.model || "google/gemini-3-flash-preview";
    const system =
      "You are an expert SEO content writer for a pool rental marketplace called 'Pool Rental Near Me'. Write authoritative, useful, original articles in clear American English. Avoid fluff. Prefer concrete numbers, steps, and lists.";
    const userPrompt = `Write a comprehensive 800-1000 word SEO blog post.
Title: ${post.title}
Category: ${post.topic ?? "General"}
Audience: pool owners and people interested in renting/hosting pools.
Structure: H1 matching the title, 4-6 H2 sections, end with an FAQ (3-5 Q/A) and a short call-to-action mentioning Pool Rental Near Me.
No external links.

Return ONLY valid JSON with this exact shape:
{"seo_title": string (<=60 chars), "seo_description": string (<=160 chars), "excerpt": string (<=200 chars), "content_markdown": string}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
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
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // model returned non-JSON; treat whole text as content
      parsed = { content_markdown: text };
    }

    const update: {
      updated_at: string;
      content?: string;
      excerpt?: string;
      seo_title?: string;
      seo_description?: string;
    } = { updated_at: new Date().toISOString() };
    if (parsed.content_markdown) update.content = String(parsed.content_markdown);
    if (parsed.excerpt) update.excerpt = String(parsed.excerpt).slice(0, 280);
    if (parsed.seo_title) update.seo_title = String(parsed.seo_title).slice(0, 60);
    if (parsed.seo_description) update.seo_description = String(parsed.seo_description).slice(0, 160);

    const { error: upErr } = await supabaseAdmin
      .from("blog_posts")
      .update(update)
      .eq("slug", data.slug);
    if (upErr) throw new Error(upErr.message);

    const wc = String(update.content ?? "").split(/\s+/).filter(Boolean).length;
    return { ok: true, word_count: wc };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Auto-generate brand-new blog posts with AI
// ─────────────────────────────────────────────────────────────────────────────

const generateSchema = z.object({
  count: z.number().int().min(1).max(10).optional(),
  topic: z.string().max(120).optional(),
  titleHint: z.string().max(200).optional(),
  model: z.string().optional(),
  autoPublish: z.boolean().optional(),
});

export type { GeneratedBlogRow } from "./blog-autogen.server";

export const adminGenerateBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => generateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { runBlogAutogen } = await import("./blog-autogen.server");
    return runBlogAutogen(data);
  });

const bulkPublishSchema = z.object({
  slugs: z.array(z.string().min(1).max(160)).min(1).max(100),
  publish: z.boolean(),
});

export const adminBulkPublishBlogPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bulkPublishSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const update: Record<string, unknown> = {
      is_published: data.publish,
      published_at: data.publish ? new Date().toISOString() : null,
    };
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .update(update as never)
      .in("slug", data.slugs);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.slugs.length };
  });

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

export type GeneratedBlogRow = {
  slug: string;
  title: string;
  topic: string | null;
  word_count: number;
};

export const adminGenerateBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => generateSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ created: GeneratedBlogRow[]; errors: string[] }> => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const model = data.model || "google/gemini-3-flash-preview";
    const count = Math.min(Math.max(data.count ?? 1, 1), 10);

    // Pull recent slugs/titles to avoid duplicates
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

    // Step 1 — brainstorm titles
    const brainstormSystem =
      "You are an SEO content strategist for 'Pool Rental Near Me', a peer-to-peer pool rental marketplace. Propose original, search-driven blog topics for pool owners, hosts, and renters. Avoid duplicates of existing posts. Use sentence case for titles.";
    const brainstormUser = `Propose ${count} new blog post ideas${
      data.topic ? ` in the category "${data.topic}"` : ""
    }${data.titleHint ? ` related to: "${data.titleHint}"` : ""}.

Existing recent titles to AVOID overlapping with:
${existingTitlesPreview || "(none)"}

Return ONLY valid JSON with this exact shape:
{"ideas":[{"title": string (50-65 chars), "topic": string (short category, 1-3 words), "slug": string (kebab-case, 3-8 words)}]}`;

    const brainstorm = await callAiJson(apiKey, model, brainstormSystem, brainstormUser);
    const rawIdeas: any[] = Array.isArray(brainstorm?.ideas) ? brainstorm.ideas : [];

    const created: GeneratedBlogRow[] = [];
    const errors: string[] = [];

    for (const raw of rawIdeas.slice(0, count)) {
      const title = String(raw?.title ?? "").trim();
      if (!title) continue;
      let baseSlug = slugify(String(raw?.slug ?? title));
      if (!baseSlug) continue;
      let slug = baseSlug;
      let n = 2;
      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${n++}`;
        if (n > 50) break;
      }
      const topic = String(raw?.topic ?? "").trim().slice(0, 60) || data.topic || null;

      // Step 2 — write full article
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
          is_published: false,
        };

        const { error: insErr } = await supabaseAdmin.from("blog_posts").insert(insertRow as never);
        if (insErr) {
          errors.push(`${title}: ${insErr.message}`);
          continue;
        }
        existingSlugs.add(slug);
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

    return { created, errors };
  });
