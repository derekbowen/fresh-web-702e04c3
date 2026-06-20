import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ShareListing } from "@/server/sharetribe.server";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function poolPath(state_code: string, city_slug: string, slug: string): string {
  return `/pools-for-rent/${state_code}/${city_slug}/${slug}`;
}

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("forbidden");
}

export type ResolvedPool = { listing: ShareListing; canonicalPath: string };

/**
 * Resolve /pools-for-rent/{state}/{city}/{slug} -> the rich listing + canonical
 * path. Reads the frozen pool_slugs map (service role), then the rich Sharetribe
 * data. Falls back to the synced_listings mirror if the live fetch is
 * unavailable (e.g. ST integ creds unset), so the page always renders.
 */
export const resolvePoolBySlug = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        state: z.string().max(8),
        city: z.string().max(120),
        slug: z.string().max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<ResolvedPool | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("pool_slugs")
      .select("sharetribe_id, state_code, city_slug, slug")
      .eq("state_code", data.state.toLowerCase())
      .eq("city_slug", data.city.toLowerCase())
      .eq("slug", data.slug.toLowerCase())
      .maybeSingle();
    if (!row) return null;

    const canonicalPath = poolPath(row.state_code, row.city_slug, row.slug);
    const { fetchShareListing } = await import("@/server/sharetribe.server");
    const live = await fetchShareListing(row.sharetribe_id);
    if (live) return { listing: live, canonicalPath };

    // Fallback: build a minimal ShareListing from the mirror so the page (and
    // its schema) still render even when the live Sharetribe fetch is down.
    const { data: m } = await supabaseAdmin
      .from("synced_listings")
      .select("sharetribe_id, slug, title, description, price_amount, city, state_code, primary_image_url, image_urls, latitude, longitude")
      .eq("sharetribe_id", row.sharetribe_id)
      .maybeSingle();
    if (!m) return null;
    const listing: ShareListing = {
      id: m.sharetribe_id,
      slug: m.slug,
      title: m.title,
      description: m.description ?? "",
      pricePerHour: Math.round((m.price_amount ?? 0) / 100),
      city: m.city ?? null,
      state: m.state_code ?? null,
      guests: null,
      poolType: null,
      waterType: null,
      poolSize: null,
      poolDepth: null,
      images: Array.isArray(m.image_urls) ? (m.image_urls as string[]) : m.primary_image_url ? [m.primary_image_url] : [],
      heroImage: m.primary_image_url ?? null,
      amenities: [],
      advantages: [],
      houseRules: [],
      poolAmenities: [],
      bookUrl: `/l/${m.slug}/${m.sharetribe_id}`,
      geolocation: m.latitude && m.longitude ? { lat: Number(m.latitude), lng: Number(m.longitude) } : null,
    };
    return { listing, canonicalPath };
  });

/**
 * Look up the canonical /pools-for-rent path for a Sharetribe listing id.
 * Used by the legacy /l/{slug}/{id} route to 301 to the new URL.
 */
export const getPoolCanonicalPath = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().max(80) }).parse(d))
  .handler(async ({ data }): Promise<string | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("pool_slugs")
      .select("state_code, city_slug, slug")
      .eq("sharetribe_id", data.id)
      .maybeSingle();
    return row ? poolPath(row.state_code, row.city_slug, row.slug) : null;
  });

/**
 * Assign a frozen, unique slug to every published pool that doesn't have one.
 * Idempotent — existing rows are never changed. Run after the mirror sync; safe
 * to re-run. Admin-only.
 */
export const backfillPoolSlugs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: boolean; inserted: number; total: number; skipped: number; error?: string }> => {
    await assertAdmin((context as { userId: string }).userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pools } = await supabaseAdmin
      .from("synced_listings")
      .select("sharetribe_id, title, city, city_slug, state_code")
      .eq("state", "published")
      .eq("is_deleted", false);

    const { data: existing } = await supabaseAdmin
      .from("pool_slugs")
      .select("sharetribe_id, state_code, city_slug, slug");

    const haveId = new Set((existing ?? []).map((r: any) => r.sharetribe_id));
    const taken = new Set((existing ?? []).map((r: any) => `${r.state_code}/${r.city_slug}/${r.slug}`));

    const rows: Array<{ sharetribe_id: string; state_code: string; city_slug: string; slug: string }> = [];
    let skipped = 0;
    for (const p of pools ?? []) {
      if (haveId.has(p.sharetribe_id)) continue;
      const state_code = (p.state_code ?? "").toLowerCase().trim();
      const city_slug = (p.city_slug ?? slugify(p.city ?? "")).toLowerCase().trim();
      if (!state_code || !city_slug) {
        skipped++; // no clean geo → can't form a stable URL; leave on legacy /l/
        continue;
      }
      const base = slugify(p.title ?? "pool") || "pool";
      let slug = base;
      let n = 2;
      while (taken.has(`${state_code}/${city_slug}/${slug}`)) slug = `${base}-${n++}`;
      taken.add(`${state_code}/${city_slug}/${slug}`);
      rows.push({ sharetribe_id: p.sharetribe_id, state_code, city_slug, slug });
    }

    if (rows.length) {
      const { error } = await supabaseAdmin.from("pool_slugs").insert(rows);
      if (error) return { ok: false, inserted: 0, total: (pools ?? []).length, skipped, error: error.message };
    }
    return { ok: true, inserted: rows.length, total: (pools ?? []).length, skipped };
  });
