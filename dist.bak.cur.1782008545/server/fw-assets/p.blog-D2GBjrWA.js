import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { an as Route, ao as organizationJsonLd, I as SITE_URL, S as SiteHeader, ap as SITE_NAME, e as SiteFooter, aq as AUTHOR_PERSON_ID, ar as websiteJsonLd } from "./router-HDJJ1Z-a.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./cities.functions-DKA5O9eJ.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./auth-middleware-Bd-cw3tB.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "lucide-react";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "@react-email/components";
import "./registry-Dn-QpeYo.js";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-CRl7J1v1.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DpHoRRhO.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const CLUSTERS = [{
  key: "maintenance_care",
  heading: "Pool maintenance & care",
  blurb: "Weekly upkeep, seasonal tasks, and how to keep your pool guest-ready year-round."
}, {
  key: "water_chemistry_algae",
  heading: "Water chemistry & algae",
  blurb: "Chlorine, pH, alkalinity, and every shade of algae — diagnose it, fix it, prevent it."
}, {
  key: "equipment_repairs",
  heading: "Equipment & repairs",
  blurb: "Pumps, filters, heaters, lights, liners, and shells. When to DIY and when to call the pro."
}, {
  key: "building_design_features",
  heading: "Pool building, design & features",
  blurb: "Costs, materials, permits, and the accessories that turn a pool into a destination."
}, {
  key: "hosting_growing_business",
  heading: "Hosting tips & growing your rental business",
  blurb: "Pricing, photography, welcome kits, accessibility, taxes — the operator's playbook."
}, {
  key: "renting_guest_playbook",
  heading: "Renting a pool: the guest playbook",
  blurb: "How to book a private pool, what to bring, and how to be the kind of guest hosts re-book."
}, {
  key: "parties_events_culture",
  heading: "Pool parties, events & culture",
  blurb: "Themes, music, snacks, lighting — plus the cultural history of the great American pool party."
}, {
  key: "pool_safety_training",
  heading: "Pool safety & training",
  blurb: "Swim lessons, child water safety, storm and freeze prep, and the rules every host should post."
}];
const FAQS = [{
  q: "How often is the Pool Rental Near Me blog updated?",
  a: "We publish new posts weekly and refresh evergreen guides every quarter. The 133 posts in this hub are sorted by published date inside each category, so the newest content surfaces first."
}, {
  q: "Who writes the content on this blog?",
  a: "Every post is published under Derek Bowen, founder of Pool Rental Near Me and author of 7 books on the pool rental economy. Guides are reviewed against operator playbooks built from 5,100+ city pages and thousands of host conversations."
}, {
  q: "Is this blog for pool owners, renters, or both?",
  a: "Both. Five clusters target hosts and pool owners (maintenance, chemistry, equipment, building, hosting tips). Two target renters and party planners (the guest playbook and pool parties). Safety and training applies to everyone."
}, {
  q: "Can I rent a pool through Pool Rental Near Me?",
  a: "Yes. Search private pool rentals in your city at /s, browse a specific listing, and book by the hour. Most US pools rent for $40 to $150 per hour. Liability coverage of $2 million is included on every booking."
}, {
  q: "How do I list my pool to start earning?",
  a: "Click List a pool on any page, add photos, set your hourly rate, and publish. Hosts on the platform typically earn $3,000 to $10,000 a month in summer. We charge a flat 10% host fee — lower than the 15%+ taken by competing platforms."
}];
function BlogHubPage() {
  const {
    posts
  } = Route.useLoaderData();
  const featured = useMemo(() => posts.slice(0, 6), [posts]);
  const grouped = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const p of posts) {
      const key = p.editorial_cluster ?? "uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return map;
  }, [posts]);
  const orderedClusters = useMemo(() => CLUSTERS.map((c) => ({
    ...c,
    posts: grouped.get(c.key) ?? []
  })).filter((c) => c.posts.length > 0), [grouped]);
  const pageUrl = `${SITE_URL}/p/blog`;
  const orgLd = organizationJsonLd();
  const websiteLd = websiteJsonLd();
  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${SITE_URL}/`
    }, {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: pageUrl
    }]
  };
  const authorBreadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#author-breadcrumbs`,
    itemListElement: [{
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${SITE_URL}/`
    }, {
      "@type": "ListItem",
      position: 2,
      name: "Derek Bowen",
      item: `${SITE_URL}/p/author/derek-bowen`
    }, {
      "@type": "ListItem",
      position: 3,
      name: "Blog",
      item: pageUrl
    }]
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: "Pool rental blog — guides for hosts and guests",
    description: "Practical guides on pool care, water chemistry, hosting, safety, and pool parties from Pool Rental Near Me.",
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    inLanguage: "en-US",
    datePublished: "2024-01-15T00:00:00Z",
    dateModified: (/* @__PURE__ */ new Date()).toISOString(),
    author: {
      "@id": AUTHOR_PERSON_ID
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.svg`
      }
    },
    about: CLUSTERS.map((c) => ({
      "@type": "Thing",
      name: c.heading
    }))
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["[data-speakable='faq-question']", "[data-speakable='faq-answer']"]
    },
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a
      }
    }))
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Pool Rental Near Me — Blog",
    numberOfItems: posts.length,
    itemListElement: posts.slice(0, 100).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/p/${p.slug}`,
      name: p.title
    }))
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-6xl px-4 py-10", children: [
      /* @__PURE__ */ jsx("nav", { "aria-label": "Breadcrumb", className: "mb-4 text-sm text-muted-foreground", children: /* @__PURE__ */ jsxs("ol", { className: "flex flex-wrap items-center gap-1", children: [
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-foreground", children: "Home" }) }),
        /* @__PURE__ */ jsx("li", { "aria-hidden": "true", children: "/" }),
        /* @__PURE__ */ jsx("li", { className: "font-medium text-foreground", children: "Blog" })
      ] }) }),
      /* @__PURE__ */ jsxs("header", { className: "mb-10 border-b border-border pb-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: SITE_NAME }),
        /* @__PURE__ */ jsx("h1", { className: "mt-2 text-4xl font-bold tracking-tight md:text-5xl", children: "The Pool Rental Near Me blog" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-4 max-w-3xl text-lg text-muted-foreground", children: [
          posts.length.toLocaleString(),
          " practical guides across",
          " ",
          orderedClusters.length,
          " categories. Written for the homeowner who wants to turn a backyard pool into a $3K–$10K a month side income, and for the guest planning the perfect 3-hour swim."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-12 rounded-xl border border-border bg-card p-6 md:p-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold", children: "About this blog" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "We run the country's largest peer-to-peer pool rental marketplace, with listings in 5,100+ US cities. Everything we publish here is grounded in real host conversations, real bookings, and the operator playbook we use to coach new hosts to their first $1,000 weekend." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Posts are written by Derek Bowen, founder and author of 7 books on the pool rental economy, and reviewed against our internal data on pricing, safety, and what guests actually ask for." })
      ] }),
      featured.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-baseline justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold", children: "Latest posts" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Fresh from the blog" })
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: featured.map((p) => /* @__PURE__ */ jsx("li", { className: "group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg", children: /* @__PURE__ */ jsxs(Link, { to: "/p/$slug", params: {
          slug: p.slug
        }, className: "block", children: [
          p.cover_image_url ? /* @__PURE__ */ jsx("img", { src: p.cover_image_url, alt: "", loading: "lazy", className: "aspect-video w-full object-cover transition-transform group-hover:scale-105" }) : /* @__PURE__ */ jsx("div", { className: "aspect-video w-full bg-muted" }),
          /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold leading-snug group-hover:text-primary", children: p.title }),
            p.excerpt ? /* @__PURE__ */ jsx("p", { className: "mt-2 line-clamp-3 text-sm text-muted-foreground", children: p.excerpt }) : null,
            /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm font-medium text-primary", children: "Read article →" })
          ] })
        ] }) }, p.slug)) })
      ] }) : null,
      /* @__PURE__ */ jsx("div", { className: "space-y-14", children: orderedClusters.map((c) => /* @__PURE__ */ jsxs("section", { id: c.key, children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-semibold md:text-3xl", children: [
            c.heading,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-base font-normal text-muted-foreground", children: [
              "(",
              c.posts.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-muted-foreground", children: c.blurb })
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: c.posts.map((p) => /* @__PURE__ */ jsx("li", { className: "group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary", children: /* @__PURE__ */ jsxs(Link, { to: "/p/$slug", params: {
          slug: p.slug
        }, className: "block", children: [
          p.cover_image_url ? /* @__PURE__ */ jsx("img", { src: p.cover_image_url, alt: "", loading: "lazy", className: "mb-3 aspect-video w-full rounded-md object-cover" }) : null,
          /* @__PURE__ */ jsx("h3", { className: "font-semibold leading-snug group-hover:text-primary", children: p.title }),
          p.excerpt ? /* @__PURE__ */ jsx("p", { className: "mt-2 line-clamp-3 text-sm text-muted-foreground", children: p.excerpt }) : null,
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Read article →" })
        ] }) }, p.slug)) })
      ] }, c.key)) }),
      /* @__PURE__ */ jsxs("section", { className: "mt-20 border-t border-border pt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-4", children: FAQS.map((f) => /* @__PURE__ */ jsxs("details", { className: "group rounded-lg border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsx("summary", { "data-speakable": "faq-question", className: "cursor-pointer list-none text-lg font-semibold marker:hidden group-open:text-primary", children: f.q }),
          /* @__PURE__ */ jsx("p", { "data-speakable": "faq-answer", className: "mt-3 text-muted-foreground", children: f.a })
        ] }, f.q)) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "mt-16 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "For pool owners" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-bold md:text-4xl", children: "Reading about pools? Why not get paid to host yours." }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Hosts on Pool Rental Near Me earn $3,000 to $10,000 a month in summer. Flat 10% host fee, $2 million liability coverage included on every booking, listings live in under 10 minutes." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsx("a", { href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details", className: "inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90", children: "List your pool" }),
          /* @__PURE__ */ jsx("a", { href: "/s", className: "inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-base font-semibold transition-colors hover:bg-muted", children: "Or rent one near you" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {}),
    /* @__PURE__ */ jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
      __html: JSON.stringify(orgLd)
    } }),
    /* @__PURE__ */ jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
      __html: JSON.stringify(websiteLd)
    } }),
    /* @__PURE__ */ jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
      __html: JSON.stringify(breadcrumbsLd)
    } }),
    /* @__PURE__ */ jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
      __html: JSON.stringify(authorBreadcrumbsLd)
    } }),
    /* @__PURE__ */ jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
      __html: JSON.stringify(articleLd)
    } }),
    /* @__PURE__ */ jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
      __html: JSON.stringify(faqLd)
    } }),
    /* @__PURE__ */ jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
      __html: JSON.stringify(itemListLd)
    } })
  ] });
}
export {
  BlogHubPage as component
};
