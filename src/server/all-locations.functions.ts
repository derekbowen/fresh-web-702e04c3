/**
 * /p/all-locations directory data.
 *
 * Server-only enumeration of every public URL on the site, grouped by
 * category. Uses supabaseAdmin (service role) because content_pages has no
 * public SELECT grants.
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface DirectoryLink {
  href: string;
  label: string;
  sub?: string | null;
}

export interface DirectoryGroup {
  id: string;
  title: string;
  description: string;
  links: DirectoryLink[];
}

export interface AllLocationsData {
  groups: DirectoryGroup[];
  totalUrls: number;
  generatedAt: string;
}

const TEMPLATE_GROUPS: Array<{
  id: string;
  title: string;
  description: string;
  templateTypes: string[];
  basePath: string;
}> = [
  {
    id: "host-acquisition",
    title: "Become a Host by City",
    description: "Earnings potential, regulations, and how to list a pool in each market.",
    templateTypes: ["host_acq_city", "host_acq_hub"],
    basePath: "/p",
  },
  {
    id: "swim-instructors",
    title: "Swim Instructors by City",
    description: "Local swim instructor directories for parents and lesson seekers.",
    templateTypes: ["swim_instructor_city", "swim_instructor_hub"],
    basePath: "/p",
  },
  {
    id: "event-guides",
    title: "Event & Party Pool Guides",
    description: "Birthdays, photoshoots, swim lessons, corporate events, and more.",
    templateTypes: ["event_guide"],
    basePath: "/p",
  },
  {
    id: "money-guides",
    title: "Money & Income Guides",
    description: "Earnings calculators, tax tips, and pricing strategies for hosts.",
    templateTypes: ["money_page"],
    basePath: "/p",
  },
  {
    id: "advocacy",
    title: "Pool Rental Laws & Advocacy",
    description: "State-by-state legality, permits, and zoning requirements.",
    templateTypes: ["host_advocacy_hub", "host_advocacy_state"],
    basePath: "/p",
  },
  {
    id: "resources",
    title: "Articles & Resources",
    description: "How-to guides, safety, maintenance, and platform comparisons.",
    templateTypes: ["resource", "resource_article", "other"],
    basePath: "/p",
  },
  {
    id: "academy",
    title: "Host Academy & Courses",
    description: "Free courses for new and experienced pool rental hosts.",
    templateTypes: ["elearning"],
    basePath: "/p",
  },
  {
    id: "spanish",
    title: "Guías en Español",
    description: "Recursos completos para anfitriones hispanohablantes.",
    templateTypes: ["spanish_host_acq", "spanish_resource", "host_acq_city_es"],
    basePath: "/p",
  },
];

const STATIC_GROUP: DirectoryGroup = {
  id: "main",
  title: "Main Pages",
  description: "Core sections of PRNM (PoolRentalNearMe).",
  links: [
    { href: "/", label: "Home" },
    { href: "/s", label: "Search Pools" },
    { href: "/p/hosting", label: "Become a Host" },
    { href: "/p/how-it-works", label: "How It Works" },
    { href: "/p/free-host-tools", label: "Free Host Tools" },
  ],
};

export const getAllLocations = createServerFn({ method: "GET" }).handler(
  async (): Promise<AllLocationsData> => {
    const groups: DirectoryGroup[] = [STATIC_GROUP];
    let total = STATIC_GROUP.links.length;

    // 1. content_pages — paginate to bypass 1000-row limit
    for (const tg of TEMPLATE_GROUPS) {
      const links: DirectoryLink[] = [];
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabaseAdmin
          .from("content_pages")
          .select("slug, title, seo_title")
          .in("template_type", tg.templateTypes)
          .eq("in_sitemap", true)
          .not("slug", "is", null)
          .order("slug", { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) {
          console.error(`[all-locations] ${tg.id}`, error.message);
          break;
        }
        if (!data || data.length === 0) break;
        for (const row of data) {
          if (!row.slug) continue;
          links.push({
            href: `${tg.basePath}/${row.slug}`,
            label: row.title || row.seo_title || row.slug,
          });
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
      if (links.length > 0) {
        groups.push({
          id: tg.id,
          title: tg.title,
          description: tg.description,
          links,
        });
        total += links.length;
      }
    }

    // (Cities table block removed: only ~1 of 1030 published `cities` rows
    // had a matching /p/{slug} content_pages entry, so the rest produced
    // broken links. The 200 canonical city pages are already surfaced via
    // the `host_acq_city` group above. If/when standalone city landing pages
    // exist as real routes, re-introduce a filtered version here.)

    // 4. live listings (synced)
    {
      const { data } = await supabaseAdmin
        .from("synced_listings")
        .select("slug, sharetribe_id, title, city, state_code")
        .eq("state", "published")
        .eq("is_deleted", false)
        .order("title", { ascending: true })
        .limit(1000);
      if (data && data.length > 0) {
        const links = data
          .filter((l) => l.slug && l.sharetribe_id)
          .map((l) => ({
            href: `/l/${l.slug}/${l.sharetribe_id}`,
            label: l.title,
            sub: [l.city, l.state_code].filter(Boolean).join(", ") || null,
          }));
        if (links.length > 0) {
          groups.push({
            id: "listings",
            title: "Active Pool Listings",
            description: "Individual pools currently available to book.",
            links,
          });
          total += links.length;
        }
      }
    }

    return {
      groups,
      totalUrls: total,
      generatedAt: new Date().toISOString(),
    };
  },
);
