import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  DEFAULT_FOOTER,
  type SiteFooterSettings,
  type FooterLink,
  type FooterMarket,
  type FooterSocial,
} from "@/lib/site-footer-defaults";

export { DEFAULT_FOOTER };
export type { SiteFooterSettings, FooterLink, FooterMarket, FooterSocial };

export async function loadSiteFooter(): Promise<SiteFooterSettings> {
  try {
    const { data } = await supabaseAdmin
      .from("site_footer_settings" as any)
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return DEFAULT_FOOTER;
    const row = data as any;
    const arr = (v: any, fallback: any[]) => (Array.isArray(v) && v.length > 0 ? v : fallback);
    return {
      contact_phone: row.contact_phone ?? DEFAULT_FOOTER.contact_phone,
      contact_phone_label: row.contact_phone_label ?? DEFAULT_FOOTER.contact_phone_label,
      contact_phone_hours: row.contact_phone_hours ?? DEFAULT_FOOTER.contact_phone_hours,
      contact_email: row.contact_email ?? DEFAULT_FOOTER.contact_email,
      bottom_text: row.bottom_text ?? DEFAULT_FOOTER.bottom_text,
      explore_links: arr(row.explore_links, DEFAULT_FOOTER.explore_links),
      host_links: arr(row.host_links, DEFAULT_FOOTER.host_links),
      company_links: arr(row.company_links, DEFAULT_FOOTER.company_links),
      popular_markets: arr(row.popular_markets, DEFAULT_FOOTER.popular_markets),
      socials: arr(row.socials, DEFAULT_FOOTER.socials),
    };
  } catch {
    return DEFAULT_FOOTER;
  }
}

export const getSiteFooter = createServerFn({ method: "GET" }).handler(async () => {
  return loadSiteFooter();
});

const LinkSchema = z.object({ label: z.string().min(1).max(120), href: z.string().min(1).max(500) });
const MarketSchema = z.object({ name: z.string().min(1).max(120), slug: z.string().min(1).max(120) });
const SocialSchema = z.object({
  label: z.string().min(1).max(60),
  href: z.string().min(1).max(500),
  icon: z.string().min(1).max(40),
});

const UpdateSchema = z.object({
  contact_phone: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_phone_label: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_phone_hours: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_email: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  bottom_text: z.string().max(500).nullable().or(z.literal("").transform(() => null)),
  explore_links: z.array(LinkSchema).max(50),
  host_links: z.array(LinkSchema).max(50),
  company_links: z.array(LinkSchema).max(50),
  popular_markets: z.array(MarketSchema).max(50),
  socials: z.array(SocialSchema).max(20),
});

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const getSiteFooterAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    return loadSiteFooter();
  });

export const updateSiteFooter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => UpdateSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { error } = await supabaseAdmin
      .from("site_footer_settings" as any)
      .upsert({ id: 1, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetSiteFooter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { error } = await supabaseAdmin
      .from("site_footer_settings" as any)
      .upsert({ id: 1, ...DEFAULT_FOOTER });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
