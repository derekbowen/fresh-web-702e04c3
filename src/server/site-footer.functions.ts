import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type FooterLink = { label: string; href: string };
export type FooterMarket = { name: string; slug: string };
export type FooterSocial = { label: string; href: string; icon: string };

export type SiteFooterSettings = {
  contact_phone: string | null;
  contact_phone_label: string | null;
  contact_phone_hours: string | null;
  contact_email: string | null;
  bottom_text: string | null;
  explore_links: FooterLink[];
  host_links: FooterLink[];
  company_links: FooterLink[];
  popular_markets: FooterMarket[];
  socials: FooterSocial[];
};

const MARKETPLACE_ORIGIN = "https://www.poolrentalnearme.com";
const m = (p: string) => `${MARKETPLACE_ORIGIN}${p.startsWith("/") ? p : `/${p}`}`;

export const DEFAULT_FOOTER: SiteFooterSettings = {
  contact_phone: "tel:18889404247",
  contact_phone_label: "Call us 888-940-4247",
  contact_phone_hours: "10am - 5pm PST",
  contact_email: "support@poolrentalnearme.com",
  bottom_text: "© 2026 PRNM CORP Riverside, Ca 92509",
  explore_links: [
    { label: "Search Listings", href: m("/s") },
    { label: "Pool Pros Directory", href: "/directory" },
    { label: "List Your Business", href: "/directory/list" },
    { label: "How It Works", href: "/p/how-it-works" },
    { label: "Start a Business", href: "/p/hosting" },
    { label: "Pool Rental Near Me vs Swimply", href: "/p/swimply-alternative-vs-pool-rental-near-me" },
    { label: "Pool Rental Near Me vs Peerspace", href: "/p/peerspace-vs-pool-rental-near-me" },
    { label: "Pool Rental Near Me vs Giggster", href: "/p/giggster-vs-pool-rental-near-me" },
    { label: "Sign a Waiver", href: "/p/sign-a-waiver" },
    { label: "Public Pools", href: "https://www.poolrentalnearme.com/public-pools" },
  ],
  host_links: [
    { label: "List Your Pool for Free", href: m("/l/draft/00000000-0000-0000-0000-000000000000/new/details") },
    { label: "How Hosting Works", href: "/p/hosting" },
    { label: "Find Locations Near You", href: "/p/all-locations" },
    { label: "Earnings Calculator", href: "/p/earnings-calculator" },
    { label: "Host Pro Tools", href: "/p/free-host-tools" },
    { label: "Host Connect", href: "https://connect.poolrentalnearme.com" },
    { label: "HOA Defense Kit", href: "/p/hoa-pool-rental-defense-kit" },
    { label: "Host Make More $$$", href: "/p/hosting" },
  ],
  company_links: [
    { label: "About", href: "/p/about" },
    { label: "Careers", href: "/p/careers" },
    { label: "Investors", href: "/p/investors" },
    { label: "Terms", href: "/terms-of-service" },
    { label: "Privacy", href: "/privacy-policy" },
    { label: "Video Chat Support", href: "https://meetn.com/poolrentalnearme" },
    { label: "Refer Pool Owners", href: "/referral" },
  ],
  popular_markets: [
    { name: "Los Angeles, CA", slug: "los-angeles-ca" },
    { name: "San Diego, CA", slug: "san-diego-ca" },
    { name: "Riverside, CA", slug: "riverside-ca" },
    { name: "Sacramento, CA", slug: "sacramento-ca" },
    { name: "Tampa, FL", slug: "tampa-fl" },
    { name: "Scottsdale, AZ", slug: "scottsdale-az" },
    { name: "Nashville, TN", slug: "nashville-tn" },
    { name: "Katy, TX", slug: "katy-tx" },
  ],
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/poolrentalnearme", icon: "facebook" },
    { label: "X", href: "https://x.com/poolrentalnearme", icon: "x" },
    { label: "YouTube", href: "https://www.youtube.com/@poolrentalnearme", icon: "youtube" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/poolrentalnearme", icon: "linkedin" },
    { label: "Instagram", href: "https://www.instagram.com/poolrentalnearme", icon: "instagram" },
    { label: "TikTok", href: "https://www.tiktok.com/@poolrentalnearme", icon: "tiktok" },
    { label: "Pinterest", href: "https://www.pinterest.com/poolrentalnearme", icon: "pinterest" },
  ],
};

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
