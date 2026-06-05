import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

const filterSchema = z.object({
  source: z.enum(["all", "jobsxml", "googlejobs", "jooble", "indeed", "ziprecruiter"]).default("all"),
  city: z.string().trim().max(120).optional().nullable(),
  region: z.string().trim().max(20).optional().nullable(),
  sinceDays: z.number().int().min(1).max(365).optional().nullable(),
});

type Filter = z.infer<typeof filterSchema>;

async function queryLeads(f: Filter, limit = 5000) {
  let q = (supabaseAdmin as any)
    .from("host_leads")
    .select("id, name, phone_e164, city, region, page, created_at")
    .not("phone_e164", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (f.source && f.source !== "all") {
    q = q.ilike("page", `%source=${f.source}%`);
  }
  if (f.city) q = q.ilike("city", f.city);
  if (f.region) q = q.ilike("region", f.region);
  if (f.sinceDays) {
    const since = new Date(Date.now() - f.sinceDays * 86400000).toISOString();
    q = q.gte("created_at", since);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    name: string;
    phone_e164: string;
    city: string | null;
    region: string | null;
    page: string | null;
    created_at: string;
  }>;
}

function renderBody(template: string, lead: { name: string; city: string | null }) {
  const first = (lead.name || "there").split(" ")[0].slice(0, 30);
  return template
    .replaceAll("{first_name}", first)
    .replaceAll("{name}", first)
    .replaceAll("{city}", lead.city || "your area")
    .slice(0, 1500);
}

export const previewSmsBlast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const leads = await queryLeads(data, 5000);

    // Drop opt-outs
    const phones = leads.map((l) => l.phone_e164);
    const { data: optouts } = await (supabaseAdmin as any)
      .from("sms_opt_outs")
      .select("phone_e164")
      .in("phone_e164", phones.length ? phones : ["__none__"]);
    const optedSet = new Set((optouts ?? []).map((o: any) => o.phone_e164));

    const eligible = leads.filter((l) => !optedSet.has(l.phone_e164));
    return {
      ok: true as const,
      total: leads.length,
      optedOut: leads.length - eligible.length,
      eligible: eligible.length,
      sample: eligible.slice(0, 5).map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone_e164,
        city: l.city,
        page: l.page,
      })),
    };
  });

const sendSchema = filterSchema.extend({
  body: z.string().trim().min(10).max(1500),
  scheduleAt: z.string().datetime().optional().nullable(),
  dryRun: z.boolean().default(false),
  dedupeDays: z.number().int().min(0).max(90).default(7),
});

export const sendSmsBlast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);

    if (!/\bSTOP\b/i.test(data.body)) {
      return { ok: false as const, error: "Message must include 'STOP' opt-out language (e.g. 'Reply STOP to opt out')." };
    }

    const leads = await queryLeads(data, 5000);
    const phones = leads.map((l) => l.phone_e164);
    if (phones.length === 0) {
      return { ok: true as const, scheduled: 0, skippedOptOut: 0, skippedRecent: 0, dryRun: data.dryRun };
    }

    // Opt-outs
    const { data: optouts } = await (supabaseAdmin as any)
      .from("sms_opt_outs")
      .select("phone_e164")
      .in("phone_e164", phones);
    const optedSet = new Set((optouts ?? []).map((o: any) => o.phone_e164));

    // Dedupe: skip phones we've sent ANY sms to in the last N days
    let recentSet = new Set<string>();
    if (data.dedupeDays > 0) {
      const cutoff = new Date(Date.now() - data.dedupeDays * 86400000).toISOString();
      const { data: recent } = await (supabaseAdmin as any)
        .from("sms_messages")
        .select("phone_e164")
        .in("phone_e164", phones)
        .gte("created_at", cutoff)
        .in("status", ["pending", "sent"]);
      recentSet = new Set((recent ?? []).map((r: any) => r.phone_e164));
    }

    const scheduledAt = data.scheduleAt ?? new Date().toISOString();
    const rows: any[] = [];
    let skippedOptOut = 0;
    let skippedRecent = 0;

    for (const l of leads) {
      if (optedSet.has(l.phone_e164)) { skippedOptOut++; continue; }
      if (recentSet.has(l.phone_e164)) { skippedRecent++; continue; }
      rows.push({
        lead_id: l.id,
        phone_e164: l.phone_e164,
        body: renderBody(data.body, l),
        step: 99, // blast marker
        scheduled_at: scheduledAt,
        status: "pending",
      });
    }

    if (data.dryRun) {
      return {
        ok: true as const,
        dryRun: true,
        wouldSchedule: rows.length,
        skippedOptOut,
        skippedRecent,
        sample: rows.slice(0, 3).map((r) => ({ phone: r.phone_e164, body: r.body })),
      };
    }

    if (rows.length === 0) {
      return { ok: true as const, scheduled: 0, skippedOptOut, skippedRecent, dryRun: false };
    }

    // Insert in chunks of 500
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await (supabaseAdmin as any).from("sms_messages").insert(chunk);
      if (error) return { ok: false as const, error: error.message, inserted };
      inserted += chunk.length;
    }

    return {
      ok: true as const,
      scheduled: inserted,
      skippedOptOut,
      skippedRecent,
      dryRun: false,
      scheduledAt,
    };
  });
