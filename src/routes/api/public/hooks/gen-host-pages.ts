/**
 * Public hook: bulk-generate host_acq_city pages for unresolved
 * /p/become-a-swimming-pool-host-{city}-{state} 404s.
 *
 * Body: { limit?: number (default 20, max 50) }
 * Returns: { ok, processed, succeeded, failed, remaining, results }
 *
 * Idempotent — only picks unresolved 404 rows; skips any url_path that
 * already has a published content_pages row.
 */
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const STATE_NAMES: Record<string, string> = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
  co: "Colorado", ct: "Connecticut", de: "Delaware", fl: "Florida", ga: "Georgia",
  hi: "Hawaii", id: "Idaho", il: "Illinois", in: "Indiana", ia: "Iowa",
  ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland",
  ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi",
  mo: "Missouri", mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire",
  nj: "New Jersey", nm: "New Mexico", ny: "New York", nc: "North Carolina",
  nd: "North Dakota", oh: "Ohio", ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania",
  ri: "Rhode Island", sc: "South Carolina", sd: "South Dakota", tn: "Tennessee",
  tx: "Texas", ut: "Utah", vt: "Vermont", va: "Virginia", wa: "Washington",
  wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming", dc: "District of Columbia",
};

function parseCityState(slug: string): { city: string; state: string; stCode: string } | null {
  const body = slug.replace(/^become-a-swimming-pool-host-/, "");
  const m = body.match(/^(.*)-([a-z]{2})$/);
  if (!m) return null;
  const citySlug = m[1];
  const st = m[2];
  const city = citySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const state = STATE_NAMES[st] || st.toUpperCase();
  return { city, state, stCode: st.toUpperCase() };
}

function buildSystem(city: string, state: string, stCode: string, linkPool: string): string {
  return `You write SEO content for Pool Rental Near Me, a peer-to-peer marketplace where homeowners rent backyard pools by the hour. Differentiators: 10% flat host fee (vs Swimply 15%+), $2M liability insurance included on every booking, 5,100+ city pages indexed.

Voice: founder-mentor talking to a homeowner who could earn $3K-$10K/month from their backyard pool. Confident, friendly, host-first, second person. Sentence case headings. No em dashes. Numbers under 10 spelled out. Dollar amounts as $X/hour. Real numbers only — typical hourly rates $40-150/hr.

Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
Banned phrases: "in this article", "in conclusion", "it's worth noting", "Pool Rental Near Me is the leading".

Write a 2,000-2,800 word host acquisition page for ${city}, ${state} (${stCode}). Markdown only with ## and ### headings. Required sections in order:

1. Lede paragraph (hook with a real local angle)
2. ## Why ${city} pool owners are listing now
3. ## What you can earn in ${city} (typical $40-150/hr range, weekend/weekday split, seasonal swing for ${state})
4. ## How it works (4 short steps)
5. ## What's covered (10% flat host fee, $2M liability insurance per booking, vetted guests, 24/7 support)
6. ## ${city} vs other side hustles (vs Airbnb/VRBO short-term rental, vs Turo, vs dog boarding)
7. ## Local rules to know in ${city}, ${state} (HOA-friendly, fence/gate compliance — generic, no invented ordinances)
8. ## Getting started today (CTA paragraph)

Include 3-5 internal links from the candidate list using exact url_path. Always include the marketplace CTAs: search /s, list a pool /l/draft/00000000-0000-0000-0000-000000000000/new/details. End with a strong CTA paragraph linking to the list-a-pool URL. Do NOT invent any other internal URLs.

Candidate internal links:
${linkPool}`;
}

interface GenResult {
  url_path: string;
  ok: boolean;
  words?: number;
  err?: string;
}

async function generateOne(
  apiKey: string,
  row: { id: string; url_path: string; slug: string },
  linkPool: string,
): Promise<GenResult> {
  const parsed = parseCityState(row.slug);
  if (!parsed) return { url_path: row.url_path, ok: false, err: "could not parse city/state" };
  const { city, state, stCode } = parsed;

  // Skip if already published.
  const { data: existing } = await (supabaseAdmin as any)
    .from("content_pages")
    .select("id, status")
    .eq("url_path", row.url_path)
    .maybeSingle();
  if (existing?.status === "published") {
    await (supabaseAdmin as any).from("content_404_log")
      .update({ resolved_at: new Date().toISOString(), resolution_notes: "already published" })
      .eq("id", row.id);
    return { url_path: row.url_path, ok: true, words: 0 };
  }

  const userMsg = `Write the host acquisition page for ${city}, ${state}. URL: ${row.url_path}. Title: "Become a swimming pool host in ${city}, ${stCode}". seo_title ≤60 chars, seo_description ≤155 chars.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: buildSystem(city, state, stCode, linkPool) },
        { role: "user", content: userMsg },
      ],
      tools: [{
        type: "function",
        function: {
          name: "write_page",
          description: "Write the host city page",
          parameters: {
            type: "object",
            required: ["title", "seo_title", "seo_description", "body_markdown"],
            properties: {
              title: { type: "string" },
              seo_title: { type: "string" },
              seo_description: { type: "string" },
              body_markdown: { type: "string" },
            },
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "write_page" } },
    }),
  });

  if (resp.status === 402) return { url_path: row.url_path, ok: false, err: "AI credits exhausted" };
  if (resp.status === 429) return { url_path: row.url_path, ok: false, err: "rate limited" };
  if (!resp.ok) return { url_path: row.url_path, ok: false, err: `gateway ${resp.status}` };

  const json = await resp.json() as any;
  const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) return { url_path: row.url_path, ok: false, err: "no tool call" };
  let gen: any;
  try { gen = JSON.parse(tc.function.arguments); }
  catch (e) { return { url_path: row.url_path, ok: false, err: "bad JSON from AI" }; }

  const writePayload = {
    url_path: row.url_path,
    slug: row.slug,
    status: "published",
    in_sitemap: true,
    template_type: "host_acq_city",
    category: "host_acquisition",
    title: gen.title,
    seo_title: gen.seo_title,
    seo_description: gen.seo_description,
    body_markdown: gen.body_markdown,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await (supabaseAdmin as any).from("content_pages")
      .update(writePayload).eq("id", existing.id);
    if (error) return { url_path: row.url_path, ok: false, err: error.message };
  } else {
    const { error } = await (supabaseAdmin as any).from("content_pages").insert(writePayload);
    if (error) return { url_path: row.url_path, ok: false, err: error.message };
  }

  await (supabaseAdmin as any).from("content_404_log")
    .update({ resolved_at: new Date().toISOString(), resolution_notes: "ai-generated host_acq_city" })
    .eq("id", row.id);

  const words = (gen.body_markdown || "").split(/\s+/).filter(Boolean).length;
  return { url_path: row.url_path, ok: true, words };
}

export const Route = createFileRoute("/api/public/hooks/gen-host-pages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ ok: false, error: "LOVABLE_API_KEY missing" }),
            { status: 500, headers: { "Content-Type": "application/json" } });
        }

        let body: any = {};
        try { body = await request.json(); } catch {}
        const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50);

        const { data: rows } = await (supabaseAdmin as any)
          .from("content_404_log")
          .select("id, url_path, slug")
          .is("resolved_at", null)
          .like("url_path", "/p/become-a-swimming-pool-host-%")
          .order("hit_count", { ascending: false })
          .limit(limit);

        const todo = (rows ?? []) as Array<{ id: string; url_path: string; slug: string }>;

        // Build link pool once.
        const { data: linkRows } = await (supabaseAdmin as any)
          .from("content_pages")
          .select("url_path, title")
          .eq("status", "published")
          .like("url_path", "/p/%")
          .order("updated_at", { ascending: false })
          .limit(30);
        const linkPool = (linkRows ?? [])
          .map((p: any) => `- ${p.url_path} — ${p.title || p.url_path}`)
          .join("\n");

        // Concurrency = 4
        const results: GenResult[] = [];
        const CONC = 4;
        for (let i = 0; i < todo.length; i += CONC) {
          const batch = todo.slice(i, i + CONC);
          const out = await Promise.all(batch.map((r) => generateOne(apiKey, r, linkPool)));
          results.push(...out);
        }

        const succeeded = results.filter((r) => r.ok).length;
        const failed = results.length - succeeded;

        const { count: remaining } = await (supabaseAdmin as any)
          .from("content_404_log")
          .select("id", { count: "exact", head: true })
          .is("resolved_at", null)
          .like("url_path", "/p/become-a-swimming-pool-host-%");

        return new Response(
          JSON.stringify({ ok: true, processed: results.length, succeeded, failed, remaining, results }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
