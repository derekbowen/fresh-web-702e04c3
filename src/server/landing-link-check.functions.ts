import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Verifies every course / academy link on the landing page resolves to a
 * published `/p/{slug}` content page (i.e. nginx forwards it to fresh-web
 * and it does NOT fall through to Sharetribe's 404).
 *
 * Source of truth lives in src/components/home-page.tsx. Keep in sync.
 */
const LANDING_ACADEMY_LINKS: Array<{ label: string; href: string }> = [
  { label: "Browse 100+ free courses (CTA)", href: "/p/learning-academy" },
  { label: "Earn certifications (CTA)", href: "/p/host-training-academy" },
  { label: "Taxes & Pool Rental Income", href: "/p/elearning-academy-tax-deduction-tracking-guide-pool-hosts" },
  { label: "Difficult Guest Scenarios", href: "/p/elearning-academy-dealing-with-difficult-scenarios-pool-hosts" },
  { label: "HOA Navigation", href: "/p/elearning-academy-hoa-navigation-guide-pool-hosts" },
  { label: "Neighbor Complaints", href: "/p/elearning-academy-dealing-with-neighbor-complaints-in-real-time" },
  { label: "Content Marketing", href: "/p/elearning-academy-content-marketing-for-pool-rentals" },
  { label: "Photography & Listings", href: "/p/elearning-academy-listing-optimization-photography-conversion" },
];

export type LandingLinkCheck = {
  label: string;
  href: string;
  ok: boolean;
  status: "published" | "missing" | "unpublished";
};

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const checkLandingAcademyLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).userId);
    const sb = supabaseAdmin as any;

    const paths = LANDING_ACADEMY_LINKS.map((l) => l.href);
    const { data: rows } = await sb
      .from("content_pages")
      .select("url_path, status")
      .in("url_path", paths);

    const byPath = new Map<string, string>();
    for (const r of (rows || []) as Array<{ url_path: string; status: string }>) {
      byPath.set(r.url_path, r.status);
    }

    const results: LandingLinkCheck[] = LANDING_ACADEMY_LINKS.map((l) => {
      const status = byPath.get(l.href);
      if (!status) return { ...l, ok: false, status: "missing" };
      if (status !== "published") return { ...l, ok: false, status: "unpublished" };
      return { ...l, ok: true, status: "published" };
    });

    const okCount = results.filter((r) => r.ok).length;
    return {
      results,
      total: results.length,
      ok: okCount,
      broken: results.length - okCount,
      checkedAt: new Date().toISOString(),
    };
  });
