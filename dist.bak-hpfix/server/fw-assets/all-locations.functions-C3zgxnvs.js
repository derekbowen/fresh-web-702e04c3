import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const TEMPLATE_GROUPS = [{
  id: "host-acquisition",
  title: "Become a Host by City",
  description: "Earnings potential, regulations, and how to list a pool in each market.",
  templateTypes: ["host_acq_city", "host_acq_hub"],
  basePath: "/p"
}, {
  id: "swim-instructors",
  title: "Swim Instructors by City",
  description: "Local swim instructor directories for parents and lesson seekers.",
  templateTypes: ["swim_instructor_city", "swim_instructor_hub"],
  basePath: "/p"
}, {
  id: "event-guides",
  title: "Event & Party Pool Guides",
  description: "Birthdays, photoshoots, swim lessons, corporate events, and more.",
  templateTypes: ["event_guide"],
  basePath: "/p"
}, {
  id: "money-guides",
  title: "Money & Income Guides",
  description: "Earnings calculators, tax tips, and pricing strategies for hosts.",
  templateTypes: ["money_page"],
  basePath: "/p"
}, {
  id: "advocacy",
  title: "Pool Rental Laws & Advocacy",
  description: "State-by-state legality, permits, and zoning requirements.",
  templateTypes: ["host_advocacy_hub", "host_advocacy_state"],
  basePath: "/p"
}, {
  id: "resources",
  title: "Articles & Resources",
  description: "How-to guides, safety, maintenance, and platform comparisons.",
  templateTypes: ["resource", "resource_article", "other"],
  basePath: "/p"
}, {
  id: "academy",
  title: "Host Academy & Courses",
  description: "Free courses for new and experienced pool rental hosts.",
  templateTypes: ["elearning"],
  basePath: "/p"
}, {
  id: "pool-maintenance",
  title: "Pool Maintenance Hub",
  description: "Pillar guide and step-by-step tutorials for pool care, chemistry, and seasonal upkeep.",
  templateTypes: ["pool_maintenance_hub", "pool_maintenance"],
  basePath: "/p"
}, {
  id: "spanish",
  title: "Guías en Español",
  description: "Recursos completos para anfitriones hispanohablantes.",
  templateTypes: ["spanish_host_acq", "spanish_resource", "host_acq_city_es"],
  basePath: "/p"
}];
const STATIC_GROUP = {
  id: "main",
  title: "Main Pages",
  description: "Core sections of PRNM (PoolRentalNearMe).",
  links: [{
    href: "/",
    label: "Home"
  }, {
    href: "/s",
    label: "Search Pools"
  }, {
    href: "/p/hosting",
    label: "Become a Host"
  }, {
    href: "/p/how-it-works",
    label: "How It Works"
  }, {
    href: "/p/free-host-tools",
    label: "Free Host Tools"
  }]
};
const getAllLocations_createServerFn_handler = createServerRpc({
  id: "7888cc70b7b717dc0a6b512834aa615767e6dd3827e62604f0ea84ec28de0d6f",
  name: "getAllLocations",
  filename: "src/server/all-locations.functions.ts"
}, (opts) => getAllLocations.__executeServer(opts));
const getAllLocations = createServerFn({
  method: "GET"
}).handler(getAllLocations_createServerFn_handler, async () => {
  const groups = [STATIC_GROUP];
  let total = STATIC_GROUP.links.length;
  for (const tg of TEMPLATE_GROUPS) {
    const links = [];
    const pageSize = 1e3;
    let from = 0;
    while (true) {
      const {
        data,
        error
      } = await supabaseAdmin.from("content_pages").select("slug, title, seo_title").in("template_type", tg.templateTypes).eq("in_sitemap", true).not("slug", "is", null).order("slug", {
        ascending: true
      }).range(from, from + pageSize - 1);
      if (error) {
        console.error(`[all-locations] ${tg.id}`, error.message);
        break;
      }
      if (!data || data.length === 0) break;
      for (const row of data) {
        if (!row.slug) continue;
        links.push({
          href: `${tg.basePath}/${row.slug}`,
          label: row.title || row.seo_title || row.slug
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
        links
      });
      total += links.length;
    }
  }
  {
    const {
      data
    } = await supabaseAdmin.from("synced_listings").select("slug, sharetribe_id, title, city, state_code").eq("state", "published").eq("is_deleted", false).order("title", {
      ascending: true
    }).limit(1e3);
    if (data && data.length > 0) {
      const links = data.filter((l) => l.slug && l.sharetribe_id).map((l) => ({
        href: `/l/${l.slug}/${l.sharetribe_id}`,
        label: l.title,
        sub: [l.city, l.state_code].filter(Boolean).join(", ") || null
      }));
      if (links.length > 0) {
        groups.push({
          id: "listings",
          title: "Active Pool Listings",
          description: "Individual pools currently available to book.",
          links
        });
        total += links.length;
      }
    }
  }
  return {
    groups,
    totalUrls: total,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
export {
  getAllLocations_createServerFn_handler
};
