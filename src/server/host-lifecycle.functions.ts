/**
 * Read-only admin views for the host lifecycle engine (counts, queue, runs,
 * template preview). Nothing here enqueues or sends; the engine runs from
 * EAST's crontab (ops/host-lifecycle). Admin-only via user_roles.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CAMPAIGNS } from "@/lib/host-lifecycle/campaigns";
import { LIFECYCLE_STATES } from "@/lib/host-lifecycle/state";
import { renderTemplate, sampleVars, TEMPLATE_KEYS, type TemplateVars } from "@/lib/host-lifecycle/templates";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  if (!d) return "***";
  return `${u.slice(0, 2)}***@${d}`;
}

export type LifecycleJobRow = {
  id: string;
  user_id: string;
  campaign_key: string;
  status: string;
  recipient: string;
  subject: string | null;
  cta_url: string | null;
  scheduled_at: string;
  sent_at: string | null;
  suppressed_reason: string | null;
  last_error: string | null;
  provider_message_id: string | null;
  attempt_count: number;
  mode: string | null;
  lifecycle_state: string;
  eligibility_reason: string | null;
  updated_at: string;
};

export type LifecycleRunRow = {
  phase: string;
  started_at: string;
  finished_at: string | null;
  mode: string;
  enabled: boolean;
  worker: string | null;
  stats: Record<string, number | string | boolean | null> | null;
  error: string | null;
};

export const getHostLifecycleOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const sb = supabaseAdmin as any;
    const [statesRes, jobsRes, runsRes] = await Promise.all([
      sb.from("host_lifecycle_state").select("lifecycle_state, last_synced_at"),
      sb.from("communication_jobs").select("id, user_id, campaign_key, status, recipient, subject, cta_url, scheduled_at, sent_at, suppressed_reason, last_error, provider_message_id, attempt_count, mode, lifecycle_state, eligibility_reason, updated_at").order("updated_at", { ascending: false }).limit(400),
      sb.from("host_lifecycle_runs").select("phase, started_at, finished_at, mode, enabled, worker, stats, error").order("started_at", { ascending: false }).limit(20),
    ]);
    const byState: Record<string, number> = Object.fromEntries(LIFECYCLE_STATES.map((s) => [s, 0]));
    let lastSync: string | null = null;
    for (const r of statesRes.data ?? []) { byState[r.lifecycle_state] = (byState[r.lifecycle_state] ?? 0) + 1; if (!lastSync || r.last_synced_at > lastSync) lastSync = r.last_synced_at; }
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const jobs = (jobsRes.data ?? []) as LifecycleJobRow[];
    const runs = (runsRes.data ?? []) as LifecycleRunRow[];
    const summary: Record<string, Record<string, number>> = {};
    const todayCounts: Record<string, number> = { eligible: 0, queued: 0, would_send: 0, sent: 0, suppressed: 0, cancelled: 0, failed: 0 };
    for (const j of jobs) {
      summary[j.campaign_key] ??= {}; summary[j.campaign_key][j.status] = (summary[j.campaign_key][j.status] ?? 0) + 1;
      if (Date.parse(j.updated_at) >= today.getTime()) { todayCounts[j.status] = (todayCounts[j.status] ?? 0) + 1; todayCounts.eligible++; }
    }
    return {
      hosts: statesRes.data?.length ?? 0,
      byState,
      lastSync,
      campaigns: CAMPAIGNS.map((c) => ({ key: c.key, group: c.group, description: c.description, after: c.after ?? null })),
      summary,
      todayCounts,
      jobs: jobs.slice(0, 150).map((j): LifecycleJobRow => ({ ...j, recipient: maskEmail(j.recipient), user_id: j.user_id.slice(0, 8) })),
      runs,
      mode: process.env.HOST_EMAIL_MODE ?? "dry_run",
      enabled: (process.env.HOST_LIFECYCLE_EMAILS_ENABLED ?? "false") === "true",
      dailyCap: process.env.HOST_LIFECYCLE_DAILY_CAP ?? "25",
      supportPhoneConfigured: !!process.env.HOST_LIFECYCLE_SUPPORT_PHONE,
    };
  });

const PreviewSchema = z.object({
  template: z.string(),
  first_name: z.string().max(40).optional(),
  listing_title: z.string().max(120).optional(),
});

export const previewHostLifecycleTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PreviewSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const key = TEMPLATE_KEYS.find((k) => k === data.template);
    if (!key) throw new Error("Unknown template");
    const vars: TemplateVars = sampleVars({
      first_name: data.first_name?.trim() || null,
      listing_title: data.listing_title?.trim() || null,
      support_phone: process.env.HOST_LIFECYCLE_SUPPORT_PHONE?.trim() || null,
      postal_address: process.env.HOST_LIFECYCLE_POSTAL_ADDRESS?.trim() || null,
    });
    const r = renderTemplate(key, vars);
    return { subject: r.subject, preheader: r.preheader, html: r.html, text: r.text, ctaLabel: r.ctaLabel, ctaUrl: r.ctaUrl, productionReady: r.productionReady, placeholders: r.placeholders };
  });

export const getHostLifecycleJobHtml = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { data: job } = await (supabaseAdmin as any).from("communication_jobs").select("subject, rendered_html, status, campaign_key").eq("id", data.id).maybeSingle();
    return job ?? null;
  });
