/**
 * Public worker endpoint to bulk-generate AI long-form content + FAQs for
 * published providers that don't yet have `long_description`.
 *
 * Auth: requires x-admin-token (or BACKFILL_ADMIN_TOKEN / SUPABASE_SERVICE_ROLE_KEY fallback)
 * via authorizeHookRequest.
 *
 * GET  → returns { remaining } (count of providers still missing AI content)
 * POST → processes up to ?limit=N (default 8, max 20) providers in parallel
 *        and returns { attempted, succeeded, failed, remaining, results }
 *
 * Designed to be called repeatedly from the sandbox (or pg_cron) until
 * `remaining === 0`. Each invocation is bounded so it stays well under
 * Worker timeout limits even if the AI gateway is slow.
 */
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authorizeHookRequest } from "@/server/hook-auth.server";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

const SYSTEM_PROMPT =
  "You write SEO-optimized, factual long-form content for a pool services directory. Use second person, friendly founder-mentor tone. No banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge. No em dashes. Output valid JSON only.";

type Provider = {
  id: string;
  name: string;
  city: string | null;
  state_code: string | null;
  primary_category: string | null;
  description: string | null;
  services: string[] | null;
};

async function generateOne(p: Provider, apiKey: string): Promise<{ id: string; ok: boolean; error?: string }> {
  try {
    const user = `Write content for ${p.name}${p.city ? ` in ${p.city}, ${p.state_code}` : ""}. Category: ${p.primary_category ?? "pool services"}. Services: ${(p.services ?? []).join(", ") || "general pool services"}. Existing description: ${p.description ?? "(none)"}.

Return JSON: { "long_description": string (700-900 words, markdown, no headings above h3), "faq": Array<{question:string,answer:string}> (5 items, locally relevant) }.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (r.status === 429) return { id: p.id, ok: false, error: "rate_limited" };
    if (r.status === 402) return { id: p.id, ok: false, error: "credits_exhausted" };
    if (!r.ok) return { id: p.id, ok: false, error: `gateway_${r.status}` };
    const j: any = await r.json();
    const raw = j.choices?.[0]?.message?.content ?? "{}";
    const content = JSON.parse(raw);
    if (!content.long_description || typeof content.long_description !== "string") {
      return { id: p.id, ok: false, error: "no_long_description" };
    }
    const { error } = await supabaseAdmin
      .from("providers")
      .update({
        long_description: content.long_description,
        faq: Array.isArray(content.faq) ? content.faq : [],
        ai_content_generated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    if (error) return { id: p.id, ok: false, error: `db: ${error.message}` };
    return { id: p.id, ok: true };
  } catch (e: any) {
    return { id: p.id, ok: false, error: e?.message || String(e) };
  }
}

async function countRemaining(): Promise<number> {
  const { count } = await supabaseAdmin
    .from("providers")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .is("long_description", null);
  return count ?? 0;
}

export const Route = createFileRoute("/api/public/hooks/provider-ai-worker")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unauth = authorizeHookRequest(request);
        if (unauth) return unauth;
        const remaining = await countRemaining();
        return Response.json({ remaining });
      },
      POST: async ({ request }) => {
        const unauth = authorizeHookRequest(request);
        if (unauth) return unauth;

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "LOVABLE_API_KEY not configured" }, { status: 500 });
        }

        const url = new URL(request.url);
        const limitRaw = parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
        const limit = Math.max(1, Math.min(MAX_LIMIT, isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw));

        const { data: rows, error } = await supabaseAdmin
          .from("providers")
          .select("id, name, city, state_code, primary_category, description, services")
          .eq("is_published", true)
          .is("long_description", null)
          .order("updated_at", { ascending: true })
          .limit(limit);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const targets = (rows ?? []) as Provider[];
        if (targets.length === 0) {
          return Response.json({ attempted: 0, succeeded: 0, failed: 0, remaining: 0, results: [] });
        }

        // Run in parallel — Lovable AI gateway accepts concurrent requests.
        const results = await Promise.all(targets.map((p) => generateOne(p, apiKey)));
        const succeeded = results.filter((r) => r.ok).length;
        const failed = results.length - succeeded;
        const remaining = await countRemaining();

        return Response.json({
          attempted: results.length,
          succeeded,
          failed,
          remaining,
          results,
        });
      },
    },
  },
});
