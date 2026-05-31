import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authorizeHookRequest } from "@/server/hook-auth.server";
import {
  ACADEMY_SLUGS,
  ACADEMY_OCCASION_SLUGS,
  ACADEMY_HUB_SLUGS,
  classifyAcademyHealth,
  type AcademyHealth,
} from "@/lib/academy-config";

/**
 * Daily health check for academy slugs surfaced on the homepage.
 * Returns 200 + "ok" report when healthy, 500 + alert payload when degraded
 * (so pg_cron's job_run_details + Cloudflare logs both surface the failure).
 */
async function runCheck() {
  const sb = supabaseAdmin as any;
  const { data } = await sb
    .from("content_pages")
    .select("slug, status, body_markdown")
    .in("slug", ACADEMY_SLUGS);

  const health: Record<string, AcademyHealth> = Object.fromEntries(
    ACADEMY_SLUGS.map((s) => [s, "missing" as const]),
  );
  for (const r of (data ?? []) as Array<{
    slug: string | null;
    status: string | null;
    body_markdown: string | null;
  }>) {
    if (!r.slug || !ACADEMY_SLUGS.includes(r.slug)) continue;
    if (r.status !== "published") continue;
    health[r.slug] = classifyAcademyHealth((r.body_markdown ?? "").trim().length);
  }

  const missing = ACADEMY_SLUGS.filter((s) => health[s] === "missing");
  const short = ACADEMY_SLUGS.filter((s) => health[s] === "short");
  const healthyOccasionCount = ACADEMY_OCCASION_SLUGS.filter(
    (s) => health[s] === "published",
  ).length;
  const hubsHealthy = ACADEMY_HUB_SLUGS.some((s) => health[s] === "published");
  const sectionHidden = healthyOccasionCount < 2 || !hubsHealthy;
  const degraded = sectionHidden || missing.length > 0 || short.length > 0;

  const report = {
    tag: "academy_health_cron",
    checkedAt: new Date().toISOString(),
    sectionHidden,
    healthyOccasionCount,
    hubsHealthy,
    missing,
    short,
    totalTracked: ACADEMY_SLUGS.length,
  };
  if (degraded) console.warn(JSON.stringify(report));
  return { ok: !degraded, ...report };
}

export const Route = createFileRoute("/api/public/hooks/academy-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const res = await runCheck();
        return new Response(JSON.stringify(res), {
          status: res.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const res = await runCheck();
        return new Response(JSON.stringify(res), {
          status: res.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
