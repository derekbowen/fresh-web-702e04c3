import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sb = () => supabaseAdmin as any;
const SOURCES = ["ig", "fb", "tiktok", "nextdoor", "craigslist", "youtube"] as const;

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export type SocialLeadRow = {
  id: string;
  source: typeof SOURCES[number];
  source_url: string;
  profile_url: string | null;
  handle: string | null;
  display_name: string | null;
  title: string | null;
  snippet: string | null;
  query: string | null;
  location_hint: string | null;
  contacted: boolean;
  contacted_at: string | null;
  notes: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
};

export const listSocialLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      source: z.enum(["all", ...SOURCES]).default("all"),
      filter: z.enum(["all", "new", "contacted"]).default("new"),
      limit: z.number().min(1).max(500).default(300),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    let q = sb().from("social_leads").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.source !== "all") q = q.eq("source", data.source);
    if (data.filter === "new") q = q.eq("contacted", false);
    if (data.filter === "contacted") q = q.eq("contacted", true);
    const { data: rows, error } = await q;
    if (error) return { ok: false, rows: [] as SocialLeadRow[], error: error.message };
    return { ok: true, rows: (rows || []) as SocialLeadRow[] };
  });

export const runSocialLeadHuntNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      sources: z.array(z.enum(SOURCES)).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { runSocialLeadHunt } = await import("./social-lead-hunter.server");
    return runSocialLeadHunt({ sources: data.sources });
  });

export const setSocialLeadContacted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), contacted: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb().from("social_leads").update({
      contacted: data.contacted,
      contacted_at: data.contacted ? new Date().toISOString() : null,
    }).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const updateSocialLeadNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), notes: z.string().max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb().from("social_leads").update({ notes: data.notes }).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const deleteSocialLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb().from("social_leads").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
