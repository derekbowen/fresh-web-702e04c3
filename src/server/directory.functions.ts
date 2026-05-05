import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ServiceCategory = {
  slug: string;
  name: string;
  plural_name: string;
  icon: string | null;
  hero_image_url: string | null;
  intro_markdown: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
};

export type DirectoryProvider = {
  slug: string;
  name: string;
  business_type: string | null;
  city: string | null;
  state_code: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  description: string | null;
  primary_category: string | null;
  secondary_categories: string[];
  is_featured: boolean;
  rating: number | null;
  rating_count: number | null;
};

export const listServiceCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("service_categories")
    .select("slug, name, plural_name, icon, hero_image_url, intro_markdown, seo_title, seo_description, sort_order")
    .eq("is_published", true)
    .order("sort_order");
  const cats = (data ?? []) as ServiceCategory[];
  // also fetch counts per category
  const { data: counts } = await (supabaseAdmin as any).rpc("count_providers_by_category").catch(() => ({ data: null }));
  const countMap = new Map<string, number>();
  if (Array.isArray(counts)) for (const r of counts as any[]) countMap.set(r.primary_category, Number(r.n) || 0);
  return { categories: cats.map((c) => ({ ...c, provider_count: countMap.get(c.slug) ?? 0 })) };
});

export const getCategoryWithProviders = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const [{ data: cat }, { data: provs }] = await Promise.all([
      supabaseAdmin.from("service_categories").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle(),
      supabaseAdmin
        .from("providers")
        .select("slug, name, business_type, city, state_code, logo_url, hero_image_url, description, primary_category, secondary_categories, is_featured, rating, rating_count")
        .eq("is_published", true)
        .or(`primary_category.eq.${data.slug},secondary_categories.cs.{${data.slug}}`)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .order("name")
        .limit(500),
    ]);
    return {
      category: (cat as ServiceCategory | null) ?? null,
      providers: ((provs as any[]) ?? []) as DirectoryProvider[],
    };
  });

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia",
};
export const stateName = (code: string) => STATE_NAMES[code.toUpperCase()] ?? code.toUpperCase();

function citySlugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const getCategoryStateProviders = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1), state: z.string().length(2) }).parse(d))
  .handler(async ({ data }) => {
    const stateCode = data.state.toUpperCase();
    const [{ data: cat }, { data: rows }] = await Promise.all([
      supabaseAdmin.from("service_categories").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle(),
      supabaseAdmin
        .from("providers")
        .select("slug, name, business_type, city, city_slug, state_code, logo_url, hero_image_url, description, primary_category, secondary_categories, is_featured, rating, rating_count")
        .eq("is_published", true)
        .eq("state_code", stateCode)
        .or(`primary_category.eq.${data.slug},secondary_categories.cs.{${data.slug}}`)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .order("name")
        .limit(500),
    ]);
    const provs = (rows ?? []) as any[];
    const cityMap = new Map<string, { name: string; slug: string; count: number }>();
    for (const r of provs) {
      if (!r.city) continue;
      const slug = r.city_slug || citySlugify(r.city);
      const cur = cityMap.get(slug);
      if (cur) cur.count++;
      else cityMap.set(slug, { name: r.city, slug, count: 1 });
    }
    return {
      category: (cat as ServiceCategory | null) ?? null,
      stateCode,
      stateName: stateName(stateCode),
      providers: provs,
      cities: [...cityMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    };
  });

export const getCategoryCityProviders = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1), state: z.string().length(2), city: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const stateCode = data.state.toUpperCase();
    const citySlug = data.city.toLowerCase();
    const [{ data: cat }, { data: provs }] = await Promise.all([
      supabaseAdmin.from("service_categories").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle(),
      supabaseAdmin
        .from("providers")
        .select("slug, name, business_type, city, city_slug, state_code, logo_url, hero_image_url, description, primary_category, secondary_categories, is_featured, rating, rating_count, address, phone, website_url")
        .eq("is_published", true)
        .eq("state_code", stateCode)
        .or(`primary_category.eq.${data.slug},secondary_categories.cs.{${data.slug}}`)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .order("name")
        .limit(500),
    ]);
    const filtered = ((provs ?? []) as any[]).filter((p) => {
      if (p.city_slug) return p.city_slug.toLowerCase() === citySlug;
      if (p.city) return citySlugify(p.city) === citySlug;
      return false;
    });
    const displayCity = filtered[0]?.city || citySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      category: (cat as ServiceCategory | null) ?? null,
      stateCode,
      stateName: stateName(stateCode),
      citySlug,
      cityName: displayCity,
      providers: filtered,
    };
  });

// All (state, city) combos for a category — used by sitemap and state hubs
export const listCategoryGeoCoverage = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { data: rows } = await supabaseAdmin
      .from("providers")
      .select("city, city_slug, state_code")
      .eq("is_published", true)
      .or(`primary_category.eq.${data.slug},secondary_categories.cs.{${data.slug}}`)
      .limit(5000);
    const states = new Map<string, Map<string, { name: string; slug: string; count: number }>>();
    for (const r of rows ?? []) {
      if (!r.state_code || !r.city) continue;
      const sc = r.state_code.toUpperCase();
      const slug = r.city_slug || citySlugify(r.city);
      if (!states.has(sc)) states.set(sc, new Map());
      const cm = states.get(sc)!;
      const cur = cm.get(slug);
      if (cur) cur.count++;
      else cm.set(slug, { name: r.city, slug, count: 1 });
    }
    return {
      states: [...states.entries()]
        .map(([code, cm]) => ({
          code,
          name: stateName(code),
          cities: [...cm.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  });

const ListProviderInput = z.object({
  name: z.string().min(2).max(120),
  primary_category: z.string().min(2),
  city: z.string().min(2).max(80),
  state_code: z.string().length(2),
  website_url: z.string().url().max(300).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().max(160),
  description: z.string().min(20).max(2000),
  services: z.array(z.string().max(60)).max(20).optional(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const submitProviderListing = createServerFn({ method: "POST" })
  .inputValidator((d) => ListProviderInput.parse(d))
  .handler(async ({ data }) => {
    // verify category exists & published
    const { data: cat } = await supabaseAdmin
      .from("service_categories")
      .select("slug")
      .eq("slug", data.primary_category)
      .eq("is_published", true)
      .maybeSingle();
    if (!cat) throw new Error("Invalid category");

    const baseSlug = slugify(`${data.name}-${data.city}-${data.state_code}`);
    let slug = baseSlug;
    // ensure uniqueness
    for (let i = 0; i < 5; i++) {
      const { data: exists } = await supabaseAdmin.from("providers").select("id").eq("slug", slug).maybeSingle();
      if (!exists) break;
      slug = `${baseSlug}-${Math.floor(Math.random() * 9000) + 1000}`;
    }

    const { error } = await supabaseAdmin.from("providers").insert({
      slug,
      name: data.name.trim(),
      business_type: cat.slug,
      primary_category: cat.slug,
      city: data.city.trim(),
      state_code: data.state_code.toUpperCase(),
      website_url: data.website_url || null,
      phone: data.phone || null,
      email: data.email,
      description: data.description.trim(),
      services: data.services ?? [],
      is_published: false,
      submission_status: "pending",
      claim_status: "pending",
      submitter_email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true, slug };
  });

// --- Admin ---
async function requireAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Not authorized");
}

export const adminListPendingProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { data } = await supabaseAdmin
      .from("providers")
      .select("id, slug, name, primary_category, city, state_code, email, submitter_email, description, website_url, phone, services, created_at, submission_status, is_published, is_featured, plan")
      .order("submission_status", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200);
    return { providers: data ?? [] };
  });

export const adminUpdateProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject", "publish", "unpublish", "feature", "unfeature", "delete"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const sb = supabaseAdmin;
    if (data.action === "delete") {
      const { error } = await sb.from("providers").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const patch: Record<string, unknown> = {};
    if (data.action === "approve") {
      patch.submission_status = "approved";
      patch.is_published = true;
    }
    if (data.action === "reject") {
      patch.submission_status = "rejected";
      patch.is_published = false;
    }
    if (data.action === "publish") patch.is_published = true;
    if (data.action === "unpublish") patch.is_published = false;
    if (data.action === "feature") {
      patch.is_featured = true;
      patch.featured_until = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      patch.plan = "featured";
    }
    if (data.action === "unfeature") {
      patch.is_featured = false;
      patch.featured_until = null;
    }
    const { error } = await (sb.from("providers") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
