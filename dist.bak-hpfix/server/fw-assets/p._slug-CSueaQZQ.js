import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { ax as HERO_SIZES, ay as heroSrcSet, az as heroVariant, aA as faqsForContentPage, S as SiteHeader, e as SiteFooter, aB as findAdvocacyState, aC as ADVOCACY_HUB_PATH, aD as ADVOCACY_STATES, aE as relatedAdvocacyStates, aF as normalizeTitleVariant, aG as getVariantCopy, aH as AUTHOR_PERSON_JSONLD_REF, aI as academyHubPath, aJ as FredMascot, aK as FloatingFredTip, aL as Route, aM as academyLangForSlug } from "./router-BPpbotmS.js";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { A as AuthorByline, R as RelatedPages, F as FounderBookingInline, G as GenericPageTemplate } from "./generic-page-C433Tvbr.js";
import { B as BreadcrumbsWithSchema } from "./breadcrumbs-jsonld-CTDBOZJf.js";
import { useMemo, useState, useEffect, Fragment as Fragment$1 } from "react";
import { p as parseCitySlug, c as cityForContentPage } from "./city-slug-Bqls2qOy.js";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import { p as parseActivityCitySlug } from "./activity-city-BV2tWwHi.js";
import { I as I18N, L as LanguageSwitcher, C as CourseCard, g as getCategoryMeta } from "./language-switcher-B5WmgI9N.js";
import "@tanstack/react-query";
import "./site-footer-defaults-Brwu0BKb.js";
import "./auth-middleware-C3cX-s7a.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "./client.server-D5ro3rAQ.js";
import "./site-origin-DalDu5p3.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "lucide-react";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "./emailit-DRsipvVx.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-CFIkIdnw.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BAToYGOj.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
function HeroImage({
  src,
  alt,
  className,
  width = 1600,
  height = 900
}) {
  return /* @__PURE__ */ jsx(
    "img",
    {
      src: heroVariant(src, 1200),
      srcSet: heroSrcSet(src),
      sizes: HERO_SIZES,
      alt,
      width,
      height,
      className,
      loading: "eager",
      fetchPriority: "high",
      decoding: "async"
    }
  );
}
function FaqBlock({
  faqs,
  heading = "Frequently asked questions"
}) {
  if (!faqs || faqs.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "mt-12 border-t border-border pt-8", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-foreground", children: heading }),
    /* @__PURE__ */ jsx("dl", { className: "mt-6 space-y-6", children: faqs.map((f) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("dt", { className: "text-base font-semibold text-foreground", children: f.question }),
      /* @__PURE__ */ jsx("dd", { className: "faq-answer mt-2 text-base leading-relaxed text-muted-foreground", children: f.answer })
    ] }, f.question)) })
  ] });
}
function TldrCard({ bullets }) {
  if (!bullets || bullets.length === 0) return null;
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      className: "not-prose mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6",
      "aria-label": "Key takeaways",
      children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-primary", children: "Key takeaways" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: bullets.map((b, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2 text-base leading-relaxed text-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" }),
          /* @__PURE__ */ jsx("span", { children: b })
        ] }, i)) })
      ]
    }
  );
}
function normalizeTopic(t) {
  if (!t) return "Related";
  return t.replace(/[-_]+/g, " ").trim().split(" ").map((w) => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");
}
function RelatedPostsCard({ posts }) {
  if (!posts || posts.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "not-prose mt-16 border-t border-border pt-10", "aria-label": "Related posts", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold tracking-tight", children: "Related posts" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
      "More from the ",
      normalizeTopic(posts[0]?.topic ?? null),
      " library."
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3", children: posts.slice(0, 6).map((p) => /* @__PURE__ */ jsx("li", { className: "group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md", children: /* @__PURE__ */ jsxs(Link, { to: "/p/$slug", params: { slug: p.slug }, className: "block", children: [
      p.cover_image_url ? /* @__PURE__ */ jsx(
        "img",
        {
          src: p.cover_image_url,
          alt: "",
          loading: "lazy",
          className: "aspect-video w-full object-cover transition-transform group-hover:scale-105"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "aspect-video w-full bg-muted" }),
      /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
        p.topic ? /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: normalizeTopic(p.topic) }) : null,
        /* @__PURE__ */ jsx("h3", { className: "mt-1 text-base font-semibold leading-snug group-hover:text-primary", children: p.title }),
        p.excerpt ? /* @__PURE__ */ jsx("p", { className: "mt-2 line-clamp-2 text-sm text-muted-foreground", children: p.excerpt }) : null
      ] })
    ] }) }, p.slug)) })
  ] });
}
function InlineRelatedCallout({ posts }) {
  if (!posts || posts.length === 0) return null;
  const top = posts.slice(0, 2);
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      className: "not-prose my-10 rounded-xl border-l-4 border-primary bg-muted/40 p-5",
      "aria-label": "Keep reading",
      children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "Keep reading" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1.5", children: top.map((p) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/p/$slug",
            params: { slug: p.slug },
            className: "text-base font-medium text-foreground hover:text-primary hover:underline",
            children: [
              p.title,
              " →"
            ]
          }
        ) }, p.slug)) })
      ]
    }
  );
}
function topicLabel(topic) {
  if (!topic) return null;
  return topic.replace(/[-_]+/g, " ").trim().split(" ").map((w) => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");
}
function splitMarkdownInHalf(body) {
  if (!body) return null;
  const paras = body.split(/\n\n+/);
  if (paras.length < 6) return null;
  const mid = Math.floor(paras.length / 2);
  return [paras.slice(0, mid).join("\n\n"), paras.slice(mid).join("\n\n")];
}
function ResourceArticleTemplate({
  page,
  linkTargets: _linkTargets = [],
  relatedPosts = []
}) {
  const publishedAt = page.published_at ?? null;
  const body = (page.content || page.body_markdown || "").toString();
  const faqs = faqsForContentPage(page);
  const tldr = Array.isArray(page.tldr_bullets) ? page.tldr_bullets : [];
  const topic = page.topic ?? null;
  const topicName = topicLabel(topic);
  const isBlogPost = page.category === "blog" || !!topic;
  const breadcrumbItems = [
    { name: "Home", path: "/" }
  ];
  if (isBlogPost) {
    breadcrumbItems.push({ name: "Blog", path: "/p/blog" });
    if (topicName && topic) {
      breadcrumbItems.push({
        name: topicName,
        path: `/p/blog?topic=${encodeURIComponent(topic)}`
      });
    }
  }
  breadcrumbItems.push({
    name: page.title || page.slug || "",
    path: page.url_path
  });
  const halves = splitMarkdownInHalf(body);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(BreadcrumbsWithSchema, { items: breadcrumbItems }),
      /* @__PURE__ */ jsxs("article", { className: "mt-6", children: [
        topicName ? /* @__PURE__ */ jsx(
          Link,
          {
            to: "/p/blog",
            search: { topic: topic ?? void 0 },
            className: "text-xs font-semibold uppercase tracking-wider text-primary hover:underline",
            children: topicName
          }
        ) : null,
        /* @__PURE__ */ jsx("h1", { className: "mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: page.title || page.seo_title || page.slug }),
        /* @__PURE__ */ jsx(AuthorByline, { date: publishedAt }),
        (page.cover_image_url || page.hero_image_url) && /* @__PURE__ */ jsx("div", { className: "mt-8 aspect-video overflow-hidden rounded-2xl", children: /* @__PURE__ */ jsx(
          HeroImage,
          {
            src: page.cover_image_url || page.hero_image_url,
            alt: page.title || "",
            className: "h-full w-full object-cover"
          }
        ) }),
        tldr.length > 0 ? /* @__PURE__ */ jsx(TldrCard, { bullets: tldr }) : null,
        page.description && /* @__PURE__ */ jsx("p", { className: "mt-8 text-lg text-muted-foreground", children: page.description }),
        body && /* @__PURE__ */ jsx(
          "div",
          {
            className: "prose prose-lg mt-8 max-w-none text-foreground\n                prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground\n                prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2\n                prose-h3:mt-8 prose-h3:text-xl\n                prose-p:leading-relaxed\n                prose-a:text-primary hover:prose-a:underline\n                prose-strong:text-foreground\n                prose-ul:my-4 prose-li:my-1\n                dark:prose-invert",
            children: halves && relatedPosts.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: halves[0] }),
              /* @__PURE__ */ jsx(InlineRelatedCallout, { posts: relatedPosts }),
              /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: halves[1] })
            ] }) : /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: body })
          }
        ),
        /* @__PURE__ */ jsx(FaqBlock, { faqs })
      ] }),
      relatedPosts.length > 0 ? /* @__PURE__ */ jsx(RelatedPostsCard, { posts: relatedPosts }) : /* @__PURE__ */ jsx(RelatedPages, {}),
      /* @__PURE__ */ jsx("div", { className: "mt-12 border-t border-border pt-8", children: /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground",
          children: "← Back home"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function slugifyHeading(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}
function extractToc(markdown) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const lines = markdown.split("\n");
  let inFence = false;
  for (const raw of lines) {
    if (raw.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(raw);
    if (!m) continue;
    const text = m[1].replace(/[*_`]/g, "").trim();
    if (!text) continue;
    let id = slugifyHeading(text);
    if (!id) continue;
    let n = 2;
    while (seen.has(id)) id = `${slugifyHeading(text)}-${n++}`;
    seen.add(id);
    out.push({ id, text });
  }
  return out;
}
function nodeToText(children) {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(nodeToText).join("");
  if (children && typeof children === "object" && "props" in children) {
    const props = children.props;
    return nodeToText(props?.children);
  }
  return "";
}
function StatStrip() {
  return /* @__PURE__ */ jsx("div", { className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
    { k: "$2M", v: "Liability per booking" },
    { k: "0%", v: "Host fee (2026)" },
    { k: "$0", v: "To list your pool" },
    { k: "24/7", v: "US-based support" }
  ].map((s) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: "rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur",
      children: [
        /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-primary", children: s.k }),
        /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-xs font-medium text-muted-foreground", children: s.v })
      ]
    },
    s.v
  )) });
}
function SidebarCTA({ stateName }) {
  const findHref = stateName ? `/s?address=${encodeURIComponent(stateName)}` : "/s";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-xl", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold", children: [
        "Ready to host",
        stateName ? ` in ${stateName}` : "",
        "?"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-primary-foreground/85", children: "Free to list. $2M liability on every confirmed booking. 0% host fees through 2026." }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
          className: "mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow transition-transform hover:scale-[1.02]",
          children: "List your pool →"
        }
      ),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: findHref,
          className: "mt-2 inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20",
          children: [
            "Find pools",
            stateName ? ` in ${stateName}` : "",
            " →"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-6 shadow-sm", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide text-muted-foreground", children: "Host resources" }),
      /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-2 text-sm", children: [
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/p/earnings-calculator", className: "font-medium text-primary hover:underline", children: "Pool host earnings calculator →" }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/p/learningacademy", className: "font-medium text-primary hover:underline", children: "Pool Host Academy (free) →" }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/p/hoa-pool-rental-defense-kit", className: "font-medium text-primary hover:underline", children: "HOA defense kit →" }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/p/pool-rental-insurance-explained", className: "font-medium text-primary hover:underline", children: "$2M insurance, explained →" }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/p/swimply-alternative-vs-pool-rental-near-me", className: "font-medium text-primary hover:underline", children: "PRNM vs Swimply (fees) →" }) })
      ] })
    ] })
  ] });
}
function StateGrid({
  states,
  currentSlug,
  compact = false
}) {
  const cols = compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  return /* @__PURE__ */ jsx("ul", { className: `grid ${cols} gap-x-4 gap-y-2`, children: states.map((s) => {
    const isCurrent = s.slug === currentSlug;
    return /* @__PURE__ */ jsx("li", { children: isCurrent ? /* @__PURE__ */ jsx("span", { className: "block py-1 text-sm font-semibold text-foreground", children: s.name }) : /* @__PURE__ */ jsx(
      "a",
      {
        href: `/p/${s.slug}`,
        className: "block py-1 text-sm text-muted-foreground transition-colors hover:text-primary hover:underline",
        children: s.name
      }
    ) }, s.slug);
  }) });
}
function AdvocacyTemplate({ page }) {
  const isHub = page.template_type === "host_advocacy_hub";
  const state = isHub ? null : findAdvocacyState(page.slug);
  const title = state?.name ? `${state.name} pool host guide` : page.title || page.seo_title || page.slug || "Pool host advocacy hub";
  const lede = page.description || (isHub ? "State-by-state guides on what's allowed, what's required, and how to host your pool the right way — wherever you live." : `What you need to know about hosting a private pool in ${state?.name ?? "your state"}: local rules, HOA tips, taxes, and what we do when neighbors have questions.`);
  const body = page.content || page.body_markdown || "";
  const toc = useMemo(() => extractToc(body), [body]);
  const faqs = useMemo(() => faqsForContentPage(page), [page]);
  const breadcrumbs = isHub ? [
    { name: "Home", path: "/" },
    { name: "Host advocacy", path: page.url_path || ADVOCACY_HUB_PATH }
  ] : [
    { name: "Home", path: "/" },
    { name: "Host advocacy", path: ADVOCACY_HUB_PATH },
    { name: state?.name || title, path: page.url_path || `/p/${page.slug}` }
  ];
  const proseComponents = {
    h2: ({ children, ...rest }) => {
      const id = slugifyHeading(nodeToText(children));
      return /* @__PURE__ */ jsxs(
        "h2",
        {
          id,
          className: "group mt-14 flex scroll-mt-24 items-center gap-3 border-b border-border pb-3 text-2xl font-bold tracking-tight text-foreground",
          ...rest,
          children: [
            /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "block h-6 w-1 rounded-full bg-primary" }),
            /* @__PURE__ */ jsx("span", { children })
          ]
        }
      );
    },
    h3: ({ children, ...rest }) => {
      const id = slugifyHeading(nodeToText(children));
      return /* @__PURE__ */ jsx(
        "h3",
        {
          id,
          className: "mt-8 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground",
          ...rest,
          children
        }
      );
    },
    table: ({ children }) => /* @__PURE__ */ jsx("div", { className: "my-6 overflow-x-auto rounded-2xl border border-border", children: /* @__PURE__ */ jsx("table", { className: "w-full border-collapse text-sm", children }) }),
    th: ({ children }) => /* @__PURE__ */ jsx("th", { className: "bg-secondary/60 px-4 py-2 text-left font-semibold text-foreground", children }),
    td: ({ children }) => /* @__PURE__ */ jsx("td", { className: "border-t border-border px-4 py-2 align-top text-muted-foreground", children }),
    blockquote: ({ children }) => /* @__PURE__ */ jsx("blockquote", { className: "my-6 rounded-r-2xl border-l-4 border-primary bg-primary/5 px-5 py-4 text-foreground", children }),
    a: ({ href, children }) => /* @__PURE__ */ jsx(
      "a",
      {
        href,
        className: "font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary",
        children
      }
    )
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("section", { className: "relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-primary/5", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8", children: [
        /* @__PURE__ */ jsx(BreadcrumbsWithSchema, { items: breadcrumbs }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 max-w-3xl", children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: isHub ? "⚖️ Host advocacy hub" : `⚖️ ${state?.name ?? "State"} host guide` }),
          /* @__PURE__ */ jsx("h1", { className: "mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl", children: title }),
          /* @__PURE__ */ jsx(AuthorByline, { date: page.updated_at }),
          /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl", children: lede }),
          /* @__PURE__ */ jsx(StatStrip, {})
        ] })
      ] }) }),
      isHub && /* @__PURE__ */ jsx(
        "section",
        {
          "aria-label": "All 50 state host guides",
          className: "border-b border-border bg-secondary/30",
          children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Pick your state" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-sm text-muted-foreground", children: "Every state has different rules for renting your pool. Tap yours for local laws, permits, HOA tips, and neighbor-friendly scripts." })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
                ADVOCACY_STATES.length,
                " guides"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7", children: /* @__PURE__ */ jsx(StateGrid, { states: ADVOCACY_STATES, currentSlug: page.slug }) })
          ] })
        }
      ),
      /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-10 lg:grid-cols-12", children: [
        /* @__PURE__ */ jsxs("article", { className: "lg:col-span-8", children: [
          !isHub && /* @__PURE__ */ jsx("p", { className: "mb-6 text-sm", children: /* @__PURE__ */ jsx(
            "a",
            {
              href: ADVOCACY_HUB_PATH,
              className: "text-primary hover:underline",
              children: "← All 50 state host guides"
            }
          ) }),
          body ? /* @__PURE__ */ jsx("div", { className: "prose prose-lg max-w-none text-foreground prose-p:leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:my-4 prose-li:my-1 prose-li:text-muted-foreground dark:prose-invert", children: /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], components: proseComponents, children: body }) }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Guide content is being updated. In the meantime, browse other state guides below." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-14 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-bold tracking-tight text-foreground", children: [
              "Hosting",
              state?.name ? ` in ${state.name}` : "",
              " starts here."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-xl text-sm text-muted-foreground", children: "Free to list. $2M liability insurance on every confirmed booking. 0% host fees through 2026 — the lowest of any pool rental platform." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-col gap-3 sm:flex-row", children: [
              /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
                  className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105",
                  children: "List your pool →"
                }
              ),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: state?.name ? `/s?address=${encodeURIComponent(state.name)}` : "/s",
                  className: "inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary",
                  children: [
                    "Find pools",
                    state?.name ? ` in ${state.name}` : "",
                    " →"
                  ]
                }
              )
            ] })
          ] }),
          !isHub && state && /* @__PURE__ */ jsxs("section", { "aria-label": "Nearby state guides", className: "mt-14", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Nearby state guides" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Hosting rules vary by state. Compare what's allowed nearby." }),
            /* @__PURE__ */ jsx("div", { className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4", children: relatedAdvocacyStates(state, 8).map((s) => /* @__PURE__ */ jsxs(
              "a",
              {
                href: `/p/${s.slug}`,
                className: "group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-foreground", children: s.name }),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      "aria-hidden": true,
                      className: "text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary",
                      children: "→"
                    }
                  )
                ]
              },
              s.slug
            )) })
          ] }),
          faqs.length > 0 && /* @__PURE__ */ jsxs("section", { "aria-label": "Frequently asked questions", className: "mt-14", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Frequently asked questions" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: isHub ? "Quick answers about hosting a pool legally in the US." : `Quick answers for ${state?.name ?? "your state"} hosts.` }),
            /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(FaqBlock, { faqs }) })
          ] }),
          /* @__PURE__ */ jsx(
            RelatedPages,
            {
              heading: "Keep building your hosting business",
              items: /* @__PURE__ */ (() => {
                const items = [
                  { to: "/p/hosting", label: "Become a pool host", description: "What it takes to list your backyard pool" },
                  { to: "/p/earnings-calculator", label: "Pool host earnings calculator", description: "Estimate your monthly income before you list" },
                  { to: "/p/hoa-pool-rental-defense-kit", label: "HOA defense kit", description: "Templates and citations for tough HOA conversations" },
                  { to: "/p/pool-maintenance", label: "Pool maintenance hub", description: "Keep your rental water pristine for paying guests" },
                  { to: "/p/sign-a-waiver", label: "Liability waiver template", description: "What to require before any guest swims" },
                  { to: "/p/free-host-tools", label: "Free host tools", description: "Calculators, checklists, and templates" }
                ];
                return items;
              })()
            }
          )
        ] }),
        /* @__PURE__ */ jsx("aside", { className: "lg:col-span-4", children: /* @__PURE__ */ jsxs("div", { className: "lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 space-y-6", children: [
          toc.length > 1 && /* @__PURE__ */ jsxs(
            "nav",
            {
              "aria-label": "On this page",
              className: "rounded-3xl border border-border bg-card p-5",
              children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "On this page" }),
                /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: toc.map((t) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: `#${t.id}`,
                    className: "block text-sm leading-snug text-muted-foreground transition-colors hover:text-primary",
                    children: t.text
                  }
                ) }, t.id)) })
              ]
            }
          ),
          /* @__PURE__ */ jsx(SidebarCTA, { stateName: state?.name ?? null }),
          !isHub && /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "More state guides" }),
            /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx(
              StateGrid,
              {
                states: ADVOCACY_STATES.slice(0, 12),
                currentSlug: page.slug,
                compact: true
              }
            ) }),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: ADVOCACY_HUB_PATH,
                className: "mt-4 inline-flex text-sm font-semibold text-primary hover:underline",
                children: "View all 50 →"
              }
            )
          ] })
        ] }) })
      ] }) }),
      !isHub && /* @__PURE__ */ jsx("section", { className: "border-t border-border bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "All 50 state host guides" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Pick your state to see local laws, permits, HOA tips, and what to do when neighbors have questions." })
          ] }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: ADVOCACY_HUB_PATH,
              className: "text-sm font-semibold text-primary hover:underline",
              children: "Back to hub →"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8", children: /* @__PURE__ */ jsx(StateGrid, { states: ADVOCACY_STATES, currentSlug: page.slug }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function NearbyCities({
  cities,
  slugPrefix = "",
  heading = "Nearby cities",
  subheading
}) {
  if (!cities || cities.length === 0) return null;
  const hasValidated = cities.some((c) => c.linkSlug);
  const renderable = hasValidated ? cities.filter((c) => c.linkSlug) : cities;
  if (renderable.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "mt-12 border-t border-border pt-8", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: heading }),
    subheading && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: subheading }),
    /* @__PURE__ */ jsx("ul", { className: "mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3", children: renderable.map((c) => {
      const slug = c.linkSlug ?? `${slugPrefix}${c.slug}`;
      const label = c.state_code && !c.slug.endsWith(`-${c.state_code.toLowerCase()}`) ? `${c.name}, ${c.state_code}` : c.name;
      return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
        Link,
        {
          to: "/p/$slug",
          params: { slug },
          className: "block rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary",
          children: label
        }
      ) }, c.slug);
    }) })
  ] });
}
const CITY_SLUG_PREFIXES = [
  "become-a-swimming-pool-host-",
  "become-a-pool-host-",
  "swim-instructor-pool-rental-",
  "conviertete-en-anfitrion-de-piscina-"
];
function stripCityPrefix(slug) {
  for (const p of CITY_SLUG_PREFIXES) {
    if (slug.startsWith(p)) return slug.slice(p.length);
  }
  return slug;
}
function relatedSlugsToItems(relatedSlugs, options) {
  if (!relatedSlugs || relatedSlugs.length === 0) return [];
  const isEs = options?.isSpanish ?? false;
  const max = options?.max;
  const items = [];
  for (let i = 0; i < relatedSlugs.length && items.length < max; i++) {
    const slug = relatedSlugs[i];
    if (!slug) continue;
    const citySlug = stripCityPrefix(slug);
    const { city, stateCode } = parseCitySlug(citySlug);
    if (!city) continue;
    const variant = i % 3;
    let label;
    let description;
    if (isEs) {
      const cityState = stateCode ? `${city}, ${stateCode}` : city;
      if (variant === 0) {
        label = cityState;
        description = "Alquila tu piscina por hora";
      } else if (variant === 1) {
        label = `Anfitrión de piscinas en ${city}`;
        description = stateCode ? `${city}, ${stateCode}` : void 0;
      } else {
        label = `Alquiler de piscinas en ${city}`;
        description = stateCode ? `${city}, ${stateCode}` : void 0;
      }
    } else {
      const cityState = stateCode ? `${city}, ${stateCode}` : city;
      if (variant === 0) {
        label = cityState;
        description = "Local pool host market";
      } else if (variant === 1) {
        label = `Hosting in ${city}`;
        description = stateCode ? `${city}, ${stateCode}` : void 0;
      } else {
        label = `Pool rentals in ${city}`;
        description = stateCode ? `${city}, ${stateCode}` : void 0;
      }
    }
    items.push({ to: `/p/${slug}`, label, description });
  }
  return items;
}
function EarningsCalculator({
  cityName,
  defaultHourlyRate = 75
}) {
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate);
  const [poolSize, setPoolSize] = useState("medium");
  const sizeMultiplier = poolSize === "small" ? 0.85 : poolSize === "large" ? 1.2 : 1;
  const ANNUAL_BOOKING_WEEKS = 28;
  const { weekly, monthly, annual } = useMemo(() => {
    const w = Math.round(hoursPerWeek * hourlyRate * sizeMultiplier);
    return {
      weekly: w,
      monthly: Math.round(w * 4.33),
      annual: Math.round(w * ANNUAL_BOOKING_WEEKS)
    };
  }, [hoursPerWeek, hourlyRate, sizeMultiplier]);
  const max = Math.max(annual, 1);
  const bars = [
    { label: "Weekly", value: weekly },
    { label: "Monthly", value: monthly },
    { label: "Annual", value: annual }
  ];
  return /* @__PURE__ */ jsxs("section", { className: "mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
    /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-semibold text-foreground", children: [
      "Estimate your ",
      cityName,
      " pool rental income"
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
      "Adjust the inputs to model what hosting could look like for you. Estimates assume ",
      ANNUAL_BOOKING_WEEKS,
      " booking weeks per year."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-6 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsx(
        SliderField,
        {
          label: "Hours available per week",
          value: hoursPerWeek,
          min: 1,
          max: 40,
          onChange: setHoursPerWeek,
          format: (v) => `${v} hrs`
        }
      ),
      /* @__PURE__ */ jsx(
        SliderField,
        {
          label: "Hourly rate",
          value: hourlyRate,
          min: 40,
          max: 200,
          step: 5,
          onChange: setHourlyRate,
          format: (v) => `$${v}`
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("fieldset", { className: "mt-6", children: [
      /* @__PURE__ */ jsx("legend", { className: "text-sm font-medium text-foreground", children: "Pool size" }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 inline-flex rounded-full border border-border bg-muted/40 p-1", children: ["small", "medium", "large"].map((size) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setPoolSize(size),
          className: `rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${poolSize === size ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
          "aria-pressed": poolSize === size,
          children: size
        },
        size
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 space-y-3", role: "img", "aria-label": "Estimated earnings chart", children: bars.map((bar) => {
      const pct = Math.max(2, Math.round(bar.value / max * 100));
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: bar.label }),
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-foreground", children: [
            "$",
            bar.value.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 h-3 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "h-full rounded-full bg-primary transition-all",
            style: { width: `${pct}%` }
          }
        ) })
      ] }, bar.label);
    }) }),
    /* @__PURE__ */ jsx("p", { className: "mt-6 text-xs text-muted-foreground", children: "Estimates are illustrative and depend on demand, season, photo quality, and how quickly you respond to bookings. Pool Rental Near Me takes a flat these figures are gross. With 0% host fees through 2026, your net equals your gross." })
  ] });
}
function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxs("span", { className: "flex items-baseline justify-between text-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: label }),
      /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: format(value) })
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "range",
        min,
        max,
        step,
        value,
        onChange: (e) => onChange(Number(e.target.value)),
        className: "mt-2 w-full accent-primary"
      }
    )
  ] });
}
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(40),
  city: z.string().trim().max(120).nullable().optional(),
  region: z.string().trim().max(20).nullable().optional(),
  page: z.string().trim().max(300).nullable().optional()
});
const submitHostLead = createServerFn({
  method: "POST"
}).inputValidator((data) => schema.parse(data)).handler(createSsrRpc("77a019bdcee1129151c815536eb8268c7844203715fff3d45cc20b23559ec740"));
function HostLeadPopup({ cityName, stateCode, delayMs = 2e4 }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const submit = useServerFn(submitHostLead);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "host-lead-popup-shown";
    if (sessionStorage.getItem(KEY)) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(KEY, "1");
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);
  if (!open) return null;
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submit({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: cityName ?? null,
          region: stateCode ?? null,
          page: typeof window !== "undefined" ? window.location.pathname : null
        }
      });
      setDone(true);
    } catch (err) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "host-lead-popup-title",
      children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setOpen(false),
            "aria-label": "Close",
            className: "absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground",
            children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
              /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
              /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
            ] })
          }
        ),
        done ? /* @__PURE__ */ jsxs("div", { className: "py-6 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary", children: "✓" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-4 text-2xl font-bold text-foreground", children: "You're on the list" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-muted-foreground", children: [
            "A host advisor will reach out shortly to help you get your",
            " ",
            cityName || "pool",
            " listing live."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl border border-border bg-muted/40 p-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "While you wait for our text — join our private Facebook group of 130+ pool hosts swapping pricing and hosting tips." }),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://www.facebook.com/groups/poolrentalnearme/",
                target: "_blank",
                rel: "noopener",
                className: "mt-3 inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-muted",
                children: "Join the Host Community →"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setOpen(false),
              className: "mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground",
              children: "Done"
            }
          )
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "Free 5-min host consult" }),
          /* @__PURE__ */ jsxs(
            "h2",
            {
              id: "host-lead-popup-title",
              className: "mt-2 text-2xl font-bold leading-tight text-foreground",
              children: [
                "Want help listing your ",
                cityName || "pool",
                "?"
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Drop your details and a PRNM host advisor will call to walk you through pricing, photos, and your first booking." }),
          /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-5 space-y-3", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                value: name,
                onChange: (e) => setName(e.target.value),
                placeholder: "Full name",
                maxLength: 120,
                className: "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                required: true,
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: "Email",
                maxLength: 255,
                className: "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                required: true,
                value: phone,
                onChange: (e) => setPhone(e.target.value),
                placeholder: "Phone number",
                maxLength: 40,
                className: "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              }
            ),
            error && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: error }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: submitting,
                className: "w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-60",
                children: submitting ? "Sending..." : "Get my free consult"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-center text-[11px] text-muted-foreground", children: "No spam. We'll only use this to help you start hosting." })
          ] })
        ] })
      ] })
    }
  );
}
const PREMIUM_STATES = /* @__PURE__ */ new Set(["CA", "NY", "FL", "TX", "AZ", "NV", "HI", "MA", "WA", "CO"]);
const EMERGING_STATES = /* @__PURE__ */ new Set(["WV", "MS", "AR", "AL", "KY", "OK", "ND", "SD", "MT", "WY"]);
function tierForCity(city) {
  const code = (city.state_code || "").toUpperCase();
  if (PREMIUM_STATES.has(code)) return "premium";
  if (EMERGING_STATES.has(code)) return "emerging";
  return "standard";
}
function defaultRateForTier(tier) {
  switch (tier) {
    case "premium":
      return 95;
    case "emerging":
      return 55;
    default:
      return 75;
  }
}
function seasonsForState(stateCode) {
  const code = stateCode.toUpperCase();
  if (["FL", "HI", "AZ", "TX", "CA", "NV", "LA", "GA", "AL", "MS", "SC"].includes(code)) {
    return "year-round, with peak demand from April through October";
  }
  if (["WA", "OR", "ID", "MT", "WY", "ND", "SD", "MN", "WI", "MI", "ME", "VT", "NH", "MA"].includes(code)) {
    return "concentrated between Memorial Day and mid-September";
  }
  return "running from late April through early October, with shoulder bookings on warm spring and fall weekends";
}
function buildHostCityGuide(city) {
  const cityName = city.name;
  const state = city.state;
  const stateCode = (city.state_code || "").toUpperCase();
  const tier = tierForCity(city);
  const seasons = seasonsForState(stateCode);
  const tierBlurb = {
    premium: `${cityName} sits in one of the strongest pool-rental markets in the country`,
    standard: `${cityName} has a healthy, growing pool-rental scene`,
    emerging: `${cityName} is an emerging pool-rental market where early hosts have a real first-mover advantage`
  }[tier];
  const intro = city.description?.trim() || `If you own a backyard pool in ${cityName}, ${state}, you're sitting on one of the most under-monetized assets in your neighborhood. ${tierBlurb}, and Pool Rental Near Me is the fastest way to turn unused afternoons into real income — without giving up control of your schedule, your guests, or your space.`;
  const sections = [
    {
      heading: `The local market opportunity in ${cityName}`,
      paragraphs: [
        `${cityName} renters are looking for the same thing renters everywhere want: a private, well-kept pool they can book by the hour for a birthday, a small gathering, a swim lesson, or a quiet afternoon away from a crowded public pool. What makes ${cityName} different is the supply side — most homeowners don't know hourly pool rental is legal or that platforms like Pool Rental Near Me even exist. That gap is the opportunity. Hosts who list early in a ${state} market typically capture the lion's share of local search and review volume before competition tightens up.`,
        `Demand in ${cityName} is driven by a mix of families, friend groups, fitness clients, and event planners. Listings that book consistently tend to share three things: clear photos, accurate descriptions, and responsive hosts. None of that requires a renovation — it requires showing up.`
      ]
    },
    {
      heading: `What kinds of pools do well in ${cityName}`,
      paragraphs: [
        `In ${cityName} specifically, three pool types tend to perform best on Pool Rental Near Me. Mid-size in-ground pools (roughly 12x24 to 16x32) hit the sweet spot — large enough for a family gathering, small enough to keep clean between bookings. Resort-style backyards with shade, seating, a grill, and a sound system command premium hourly rates because guests are effectively renting the whole experience, not just the water. And smaller plunge pools or saltwater spas do surprisingly well for couples, photoshoots, and recovery sessions for athletes.`,
        `If your ${cityName} pool is heated, mention it everywhere — heated pools in ${state} routinely book at 20–40% above unheated comps because they extend the rentable season on either end.`
      ]
    },
    {
      heading: `Best seasons to host in ${cityName}, ${stateCode}`,
      paragraphs: [
        `Booking demand in ${cityName} is ${seasons}. Saturday and Sunday afternoons consistently fill first; smart hosts open up 2–3 weekday slots after 4pm to capture the after-work and after-school crowd. Long weekends (Memorial Day, July 4th, Labor Day) book out 2–3 weeks in advance — set your prices higher and require longer minimum durations on those dates.`,
        `Off-season is not dead time. ${cityName} hosts with heated pools or hot tubs see steady bookings from physical therapy clients, swim instructors, and content creators who specifically want quieter, off-peak hours.`
      ]
    },
    {
      heading: `Neighborhoods and guest expectations in ${cityName}`,
      paragraphs: [
        `Guests booking in ${cityName} skew toward locals — neighbors a few zip codes away who'd rather drive 15 minutes than fight crowds at a public facility. That means the bar for cleanliness and safety is the same bar your own family would expect. Skim the surface, wipe down chairs, restock towels, and make sure the gate latches properly between bookings.`,
        `Listings that mention specific ${cityName} neighborhood landmarks — schools, parks, freeway exits — tend to convert better in search because guests are scanning for proximity, not just price.`
      ]
    },
    {
      heading: `Pricing tips specific to the ${cityName} market`,
      paragraphs: [
        `For a ${tier === "premium" ? "premium" : tier === "emerging" ? "newer" : "standard"} ${cityName} listing, an hourly rate in the $${defaultRateForTier(tier) - 15}–$${defaultRateForTier(tier) + 25} range per hour for up to 5 guests is a healthy starting point. Add $10–$15 per additional guest. Charge a small cleaning fee ($25–$50) on every booking — it covers chemicals and time, and guests expect it.`,
        `Use the calculator below to model what your week could look like at different rates and availability. Most ${cityName} hosts who treat hosting like a real side business — not a hobby — clear $1,500–$5,000+ a month in the high season.`
      ]
    },
    {
      heading: `How PRNM's 10% fee compares to alternatives`,
      paragraphs: [
        `Pool Rental Near Me charges hosts 0% host fees in 2026 on each booking — you keep 100%. Swimply takes 15%+ once you stack their host fee, guest fee, and processing. On a $200 booking in ${cityName}, that difference is real money: $0 to PRNM versus $30+ to Swimply, every single time. Across a busy ${state} weekend the gap pays for itself.`,
        `Beyond the fee, PRNM was built for hosts who want to keep more of what they earn, set their own rules, and stop competing on a platform that quietly takes a bigger cut every year. Listing on PRNM is free, there's no exclusivity, and you can publish your ${cityName} pool today.`
      ]
    }
  ];
  return {
    intro,
    sections,
    cityTier: tier,
    defaultHourlyRate: defaultRateForTier(tier)
  };
}
const SOURCE_BUCKET_LABEL = {
  ordinance: "City ordinances",
  hoa_str: "HOA & short-term rental rules",
  noaa: "Climate & swim season",
  demand: "Local demand",
  insurance: "Insurance & liability"
};
function HostAcqCityTemplate({
  page,
  nearbyCities = [],
  city = null,
  linkTargets = [],
  citySources = []
}) {
  const title = page.title || page.seo_title || "Become a pool host";
  const description = page.seo_description || page.description || null;
  const body = page.body_markdown || page.content || null;
  const faqs = faqsForContentPage(page);
  const guide = city ? buildHostCityGuide(city) : null;
  const fallbackCitySlug = cityForContentPage(page.template_type, page.slug) ?? page.slug;
  const fallbackCity = fallbackCitySlug ? parseCitySlug(fallbackCitySlug) : null;
  const rawCityName = city?.name || fallbackCity?.city || "your city";
  const stateCode = (city?.state_code || fallbackCity?.stateCode || "").toUpperCase();
  const cityName = stateCode && rawCityName.toUpperCase().endsWith(" " + stateCode) ? rawCityName.slice(0, rawCityName.length - stateCode.length - 1).trimEnd() : rawCityName;
  const tier = guide?.cityTier ?? "standard";
  const hourlyRate = guide?.defaultHourlyRate ?? 75;
  const variant = normalizeTitleVariant(
    page.title_variant
  );
  const variantCopy = variant ? getVariantCopy(variant, cityName, stateCode) : null;
  const lo = Math.round(hourlyRate * 8 * 4);
  const hi = Math.round(hourlyRate * 18 * 4);
  const earningsBand = `$${lo.toLocaleString()}–$${hi.toLocaleString()}+`;
  const tierLabel = tier === "premium" ? `${cityName} is a top-tier U.S. pool rental market` : tier === "emerging" ? `${cityName} is wide open — early hosts have first-mover advantage` : `${cityName} has steady, growing pool rental demand`;
  const stateName = city?.state || fallbackCity?.stateCode || stateCode;
  const dateModified = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const dateFormatted = new Date(dateModified).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const pageUrl = `https://www.poolrentalnearme.com${page.url_path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `Become a Pool Host in ${cityName}, ${stateCode} — Earn ${earningsBand}/Month`,
        author: AUTHOR_PERSON_JSONLD_REF,
        publisher: {
          "@type": "Organization",
          name: "Pool Rental Near Me",
          logo: { "@type": "ImageObject", url: "https://www.poolrentalnearme.com/logo.png" }
        },
        datePublished: "2026-01-01",
        dateModified,
        mainEntityOfPage: pageUrl
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer }
        }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.poolrentalnearme.com/" },
          { "@type": "ListItem", position: 2, name: "Become a Host", item: "https://www.poolrentalnearme.com/p/hosting" },
          { "@type": "ListItem", position: 3, name: `${cityName}, ${stateCode}` }
        ]
      },
      {
        "@type": "LocalBusiness",
        name: `Pool Rental Near Me — ${cityName}`,
        description: `Peer-to-peer pool rental marketplace in ${cityName}, ${stateName}`,
        areaServed: {
          "@type": "City",
          name: cityName,
          containedInPlace: { "@type": "State", name: stateName }
        },
        url: pageUrl,
        telephone: "+1-888-940-4247",
        priceRange: `$${hourlyRate}/hr`
      },
      {
        "@type": "Organization",
        name: "Pool Rental Near Me",
        url: "https://www.poolrentalnearme.com",
        telephone: "+1-888-940-4247",
        sameAs: [
          "https://www.facebook.com/poolrentalnearme",
          "https://www.instagram.com/poolrentalnearme",
          "https://x.com/poolrentalnearm"
        ]
      }
    ]
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) }
      }
    ),
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 pb-24 lg:pb-0", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-border", children: [
        page.hero_image_url && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            HeroImage,
            {
              src: page.hero_image_url,
              alt: `${cityName} backyard pool`,
              className: "absolute inset-0 h-full w-full object-cover"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" })
        ] }),
        !page.hero_image_url && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/20" }),
        /* @__PURE__ */ jsx("div", { className: "relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx(
          BreadcrumbsWithSchema,
          {
            items: [
              { name: "Home", path: "/" },
              { name: "Become a host", path: "/p/hosting" },
              { name: title, path: page.url_path }
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-5 lg:px-8 lg:py-28", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: [
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary" }),
              stateCode ? `${cityName}, ${stateCode}` : cityName,
              " · For pool owners"
            ] }),
            variantCopy ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("h1", { className: "mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl", children: variantCopy.h1 }),
              /* @__PURE__ */ jsx(AuthorByline, { date: dateModified }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("time", { dateTime: dateModified, children: [
                "Last updated: ",
                dateFormatted
              ] }) }),
              /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground", children: variantCopy.intro })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("h1", { className: "mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl", children: [
                "Rent your ",
                cityName,
                " pool by the hour.",
                " ",
                /* @__PURE__ */ jsxs("span", { className: "bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent", children: [
                  "Earn ",
                  earningsBand,
                  "/mo."
                ] })
              ] }),
              /* @__PURE__ */ jsx(AuthorByline, { date: dateModified }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("time", { dateTime: dateModified, children: [
                "Last updated: ",
                dateFormatted
              ] }) }),
              description ? /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground", children: description }) : /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground", children: "Join the homeowners turning their backyard into income on Pool Rental Near Me — the fastest-growing hourly pool marketplace, with the lowest host fee in the industry." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
              /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
                  className: "inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90",
                  children: "List my pool — it's free"
                }
              ),
              /* @__PURE__ */ jsx(
                "a",
                {
                  href: "#calculator",
                  className: "inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur transition hover:bg-muted",
                  children: "Estimate my income →"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "✓" }),
                " 0% host fees (2026)"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "✓" }),
                " $2M coverage included"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "✓" }),
                " Paid in 24 hours"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "✓" }),
                " Live in 15 min"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
              "Typical ",
              cityName,
              " host earns"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 text-4xl font-bold text-foreground", children: [
              "$",
              (hourlyRate * 12 * 4).toLocaleString(),
              /* @__PURE__ */ jsx("span", { className: "text-lg font-medium text-muted-foreground", children: "/mo" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-muted-foreground", children: [
              "at ~$",
              hourlyRate,
              "/hr · 12 booked hrs/week"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center", children: [
              /* @__PURE__ */ jsx(Stat, { label: "Host fee", value: "0%", sub: "vs 15%+ (2026)" }),
              /* @__PURE__ */ jsx(Stat, { label: "Coverage", value: "$2M", sub: "included" }),
              /* @__PURE__ */ jsx(Stat, { label: "Payout", value: "24h", sub: "direct" })
            ] }),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "#calculator",
                className: "mt-5 block w-full rounded-full bg-foreground px-4 py-2.5 text-center text-sm font-semibold text-background transition hover:opacity-90",
                children: "Run my own numbers"
              }
            )
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-muted/20 py-16 sm:py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: [
            "Why ",
            cityName,
            " hosts pick PRNM"
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "The leader in hourly pool rentals — built for hosts, not investors." }),
          /* @__PURE__ */ jsxs("p", { className: "mt-4 text-lg text-muted-foreground", children: [
            tierLabel,
            ". We give you more of every booking, real liability coverage, and payouts before your skimmer's even dry."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4", children: [
          /* @__PURE__ */ jsx(
            Pillar,
            {
              kicker: "Lowest fee",
              title: "Keep 100%",
              body: "0% host fees through 2026. Swimply takes 15%+ once you stack their host fee, guest fee, and processing. On a $200 booking that's real money — every time."
            }
          ),
          /* @__PURE__ */ jsx(
            Pillar,
            {
              kicker: "Real protection",
              title: "$2M liability",
              body: "Every booking is auto-covered up to $2 million in third-party liability. No add-ons, no separate premium, no fine print games."
            }
          ),
          /* @__PURE__ */ jsx(
            Pillar,
            {
              kicker: "Fast money",
              title: "24-hour payouts",
              body: "Direct deposit within 24 hours of each booking ending. Most platforms hold for 2–5 days. We trust our hosts."
            }
          ),
          /* @__PURE__ */ jsx(
            Pillar,
            {
              kicker: "You're in charge",
              title: "Total host control",
              body: "Approve every guest. Block any date. Set your rules — group size, pets, alcohol, age minimums. Decline anyone, no explanation needed."
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-16 sm:py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: [
          "On a $200 booking in ",
          cityName,
          ", you keep more with PRNM."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-5 py-4 text-left font-semibold text-foreground", children: "Feature" }),
            /* @__PURE__ */ jsx("th", { className: "px-5 py-4 text-left font-semibold text-primary", children: "Pool Rental Near Me" }),
            /* @__PURE__ */ jsx("th", { className: "px-5 py-4 text-left font-semibold text-muted-foreground", children: "Swimply" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: [
            ["Host service fee", "0% (2026)", "15%+"],
            ["You take home on $200", "$180", "≈ $170 or less"],
            ["Liability coverage", "$2M included", "$1M"],
            ["Payout speed", "24 hours", "2–5 days"],
            ["Listing fee", "Free", "Free"],
            ["Guest approval", "Full host approval", "Auto-approve default"]
          ].map(([label, prnm, sw]) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "px-5 py-3.5 font-medium text-foreground", children: label }),
            /* @__PURE__ */ jsx("td", { className: "px-5 py-3.5 font-semibold text-primary", children: prnm }),
            /* @__PURE__ */ jsx("td", { className: "px-5 py-3.5 text-muted-foreground", children: sw })
          ] }, label)) })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-12 sm:py-16", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl border-l-4 border-primary bg-primary/5 p-6 sm:p-8", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-foreground sm:text-2xl", children: "Real insurance, not a self-funded guarantee" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-base leading-relaxed text-foreground/90", children: [
          "Pool Rental Near Me's ",
          /* @__PURE__ */ jsx("strong", { children: "$2M per-occurrence / $4M aggregate general liability" }),
          " ",
          "is carrier-backed third-party insurance underwritten by",
          " ",
          /* @__PURE__ */ jsx("strong", { children: "Hartford Underwriters Insurance Company" }),
          " — not a self-funded host guarantee. Includes ",
          /* @__PURE__ */ jsx("strong", { children: "$150K STRETCH® PLUS property coverage" }),
          " and",
          " ",
          /* @__PURE__ */ jsx("strong", { children: "$10K medical expenses per person" }),
          "."
        ] })
      ] }) }) }) }),
      /* @__PURE__ */ jsx(
        "section",
        {
          id: "calculator",
          className: "scroll-mt-20 border-b border-border bg-muted/20 py-16 sm:py-20",
          children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: [
                cityName,
                " earnings calculator"
              ] }),
              /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Run the numbers for your pool." }),
              /* @__PURE__ */ jsxs("p", { className: "mt-3 text-muted-foreground", children: [
                "Move the sliders to see what your ",
                cityName,
                " pool could pull in across a season. Defaults are pre-tuned to local pricing."
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(
              EarningsCalculator,
              {
                cityName,
                defaultHourlyRate: hourlyRate
              }
            ) })
          ] })
        }
      ),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-16 sm:py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "From sign-up to first booking — usually under a week." }),
        /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-6 md:grid-cols-3", children: [
          {
            n: "01",
            title: "List in 15 minutes",
            body: `Photos, hourly rate, calendar, house rules. Our team reviews every ${cityName} pool before going live.`
          },
          {
            n: "02",
            title: "Approve guests on your terms",
            body: "Auto-approve trusted guests or hand-approve every request. Block dates anytime, raise weekend prices."
          },
          {
            n: "03",
            title: "Get paid in 24 hours",
            body: "Direct deposit within 24 hours of booking end. We handle payments, taxes, and guest messaging."
          }
        ].map((s) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "relative rounded-2xl border border-border bg-card p-6 shadow-sm",
            children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-bold tracking-wider text-primary", children: s.n }),
              /* @__PURE__ */ jsx("h3", { className: "mt-3 text-xl font-semibold text-foreground", children: s.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: s.body })
            ]
          },
          s.n
        )) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-16 sm:py-20", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: body ? /* @__PURE__ */ jsx("div", { className: "prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground prose-table:text-sm prose-th:text-left prose-th:bg-muted prose-th:p-3 prose-td:p-3 prose-td:border prose-th:border prose-table:border prose-ul:list-disc prose-ol:list-decimal", children: /* @__PURE__ */ jsx(
        ReactMarkdown,
        {
          remarkPlugins: [remarkGfm],
          components: {
            // The page H1 is rendered by the hero. Any `#` heading in
            // the markdown body must downgrade to H2 to avoid two H1s
            // on the page (SEO: duplicate H1 across 3,234 host-city
            // pages was the #4 audit finding).
            h1: ({ children, ...props }) => /* @__PURE__ */ jsx("h2", { ...props, children })
          },
          children: body
        }
      ) }) : guide ? /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: [
          "The ",
          cityName,
          " pool host playbook"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-relaxed text-foreground", children: guide.intro }),
        guide.sections.map((s) => /* @__PURE__ */ jsxs("div", { className: "mt-10", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-semibold text-foreground", children: s.heading }),
          s.paragraphs.map((p, i) => /* @__PURE__ */ jsx(
            "p",
            {
              className: "mt-3 text-base leading-relaxed text-foreground/90",
              children: p
            },
            i
          ))
        ] }, s.heading))
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Detailed local guide coming soon." }) }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-16", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx(
        NearbyCities,
        {
          cities: nearbyCities,
          slugPrefix: "become-a-swimming-pool-host-",
          heading: `Become a host near ${cityName}`
        }
      ) }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-muted/20 py-12", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "About the author" }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 text-xl font-bold text-foreground", children: "Derek Bowen" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Founder & CEO, PRNM Corp" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-4 text-base leading-relaxed text-foreground/90", children: [
          "Derek Bowen is the founder and CEO of PRNM Corp, the parent company behind Pool Rental Near Me. A lifelong entrepreneur with 20+ years of marketplace and e-commerce experience, Derek launched Pool Rental Near Me to give pool owners a host-first alternative to high-fee competitors. He is the author of multiple Amazon-published books on pool hosting, including",
          " ",
          /* @__PURE__ */ jsx("em", { children: "Pool Host Riches" }),
          ", ",
          /* @__PURE__ */ jsx("em", { children: "The Backyard Entrepreneur" }),
          ", and the Pool Host Academy companion guides."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-3 text-sm font-semibold", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://www.linkedin.com/in/derekcbowen/",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "rounded-full border border-border bg-background px-4 py-2 text-foreground transition hover:bg-muted",
              children: "LinkedIn"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://www.amazon.com/stores/Derek-Bowen/author/B0FJM55Y12",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "rounded-full border border-border bg-background px-4 py-2 text-foreground transition hover:bg-muted",
              children: "Amazon author page"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/learningacademy",
              className: "rounded-full border border-border bg-background px-4 py-2 text-foreground transition hover:bg-muted",
              children: "Pool Host Academy"
            }
          )
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(FounderBookingInline, { lang: "en" }),
      /* @__PURE__ */ jsx("section", { className: "py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(FaqBlock, { faqs }),
        citySources.length > 0 ? /* @__PURE__ */ jsxs("aside", { className: "mt-12 rounded-2xl border border-border bg-muted/40 p-6", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold text-foreground", children: [
            "Sources for this ",
            cityName,
            " guide"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Every local rule, climate stat and demand figure on this page is grounded in a public, primary source." }),
          /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-3 text-sm", children: citySources.map((s) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: s.url,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "font-medium text-primary underline-offset-4 hover:underline",
                children: s.title
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "ml-1 text-muted-foreground", children: [
              "— ",
              s.publisher,
              SOURCE_BUCKET_LABEL[s.bucket] ? ` · ${SOURCE_BUCKET_LABEL[s.bucket]}` : ""
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: s.key_fact })
          ] }, s.id)) })
        ] }) : null,
        /* @__PURE__ */ jsx(
          RelatedPages,
          {
            heading: `More for ${cityName} pool hosts`,
            items: (() => {
              const items = [];
              items.push(
                ...relatedSlugsToItems(page.related_slugs, { max: 10 })
              );
              const advocacy = stateCode ? ADVOCACY_STATES.find((s) => s.code === stateCode) : null;
              if (advocacy) {
                items.push({
                  to: `/p/${advocacy.slug}`,
                  label: `${advocacy.name} pool host laws & advocacy`,
                  description: `Permits, HOA defense, and what's legal in ${advocacy.name}`
                });
              }
              items.push(
                { to: "/p/learningacademy", label: "Pool Host Academy", description: "70+ free courses for new and growing hosts" },
                { to: "/p/earnings-calculator", label: "Pool host earnings calculator", description: `Estimate your monthly income in ${cityName}` },
                { to: "/p/swimply-alternative-vs-pool-rental-near-me", label: "Swimply alternative — PRNM compared", description: "Side-by-side fees, payouts, and coverage" },
                { to: "/p/peerspace-vs-pool-rental-near-me", label: "Peerspace vs Pool Rental Near Me", description: "Why pool-first beats general venue rental" },
                { to: "/p/giggster-vs-pool-rental-near-me", label: "Giggster vs Pool Rental Near Me", description: "Pool hosts vs film/event rentals" },
                { to: "/p/hoa-pool-rental-defense-kit", label: "HOA pool rental defense kit", description: "What to send your HOA before they push back" },
                { to: `/p/pool-pros?city=${encodeURIComponent(cityName)}`, label: `Pool pros in ${cityName}`, description: "Vetted local cleaners, techs, and repair" },
                { to: "/p/hosting", label: "Become a pool host", description: "Everything new hosts should know before listing" },
                { to: "/p/all-locations", label: "All pool rental locations", description: "Browse host pools across the US" }
              );
              return items;
            })()
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-gradient-to-br from-primary/15 via-background to-accent/15 py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: [
          "Your ",
          cityName,
          " pool could be earning this week."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Free to list. No monthly fees. $2M coverage on every booking. Live in 15 minutes." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap justify-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
              className: "inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90",
              children: "List my pool — it's free"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/hosting",
              className: "inline-flex items-center justify-center rounded-full border border-border bg-background px-8 py-3.5 text-base font-semibold text-foreground transition hover:bg-muted",
              children: "Learn more about hosting"
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "truncate text-xs text-muted-foreground", children: [
          cityName,
          " hosts earn"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "truncate text-sm font-bold text-foreground", children: [
          earningsBand,
          "/mo"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
          className: "shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md",
          children: "List my pool"
        }
      )
    ] }) }),
    page.slug !== "become-a-swimming-pool-host-tracy-ca" && /* @__PURE__ */ jsx(HostLeadPopup, { cityName, stateCode }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Stat({ label, value, sub }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-lg font-bold text-foreground", children: value }),
    /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: sub })
  ] });
}
function Pillar({
  kicker,
  title,
  body
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: kicker }),
    /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold text-foreground", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: body })
  ] });
}
const DEFAULTS = { maxLinks: 8, maxPerTarget: 1 };
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function AutoLinkedContent({
  text,
  targets,
  options,
  className
}) {
  const opts = { ...DEFAULTS, ...options ?? {} };
  if (!text) return null;
  const sorted = [...targets].filter((t) => t.phrase && t.phrase.length >= 3).sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || b.phrase.length - a.phrase.length
  );
  const matches = [];
  const taken = [];
  const perTarget = /* @__PURE__ */ new Map();
  let total = 0;
  const overlaps = (s, e) => taken.some(([ts, te]) => s < te && e > ts);
  for (const target of sorted) {
    if (total >= opts.maxLinks) break;
    const re = new RegExp(`\\b${escapeRegex(target.phrase)}\\b`, "i");
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index;
    const end = start + m[0].length;
    if (overlaps(start, end)) continue;
    const key = target.to;
    const used = perTarget.get(key) ?? 0;
    if (used >= opts.maxPerTarget) continue;
    matches.push({ start, end, target });
    taken.push([start, end]);
    perTarget.set(key, used + 1);
    total += 1;
  }
  matches.sort((a, b) => a.start - b.start);
  const nodes = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) {
      nodes.push(
        /* @__PURE__ */ jsx(PreserveNewlines, { text: text.slice(cursor, m.start) }, `t-${i}`)
      );
    }
    nodes.push(
      /* @__PURE__ */ jsx(
        Link,
        {
          to: m.target.to,
          title: m.target.title,
          className: "text-primary underline-offset-4 hover:underline",
          children: text.slice(m.start, m.end)
        },
        `l-${i}`
      )
    );
    cursor = m.end;
  });
  if (cursor < text.length) {
    nodes.push(/* @__PURE__ */ jsx(PreserveNewlines, { text: text.slice(cursor) }, "t-end"));
  }
  return /* @__PURE__ */ jsx("div", { className, children: nodes });
}
function PreserveNewlines({ text }) {
  const parts = text.split("\n");
  return /* @__PURE__ */ jsx(Fragment, { children: parts.map((p, i) => /* @__PURE__ */ jsxs(Fragment$1, { children: [
    p,
    i < parts.length - 1 ? /* @__PURE__ */ jsx("br", {}) : null
  ] }, i)) });
}
function EventGuideTemplate({
  page,
  linkTargets = [],
  nearbyCities = []
}) {
  const title = page.title || page.seo_title || "Event pool rental guide";
  const description = page.seo_description || page.description || null;
  const body = page.body_markdown || page.content || null;
  const faqs = faqsForContentPage(page);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(
        BreadcrumbsWithSchema,
        {
          items: [
            { name: "Home", path: "/" },
            { name: "Event guides", path: "/p/learningacademy" },
            { name: title, path: page.url_path }
          ]
        }
      ),
      /* @__PURE__ */ jsxs("article", { className: "mt-6", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: title }),
        /* @__PURE__ */ jsx(AuthorByline, { date: page.published_at ?? page.updated_at }),
        description && /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: description }),
        page.hero_image_url && /* @__PURE__ */ jsx("div", { className: "mt-8 aspect-video overflow-hidden rounded-2xl", children: /* @__PURE__ */ jsx(
          HeroImage,
          {
            src: page.hero_image_url,
            alt: title,
            className: "h-full w-full object-cover"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-muted/30 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Book a private pool for your event" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Browse local backyard pools by the hour. Filter by group size, amenities (BBQ, hot tub, restrooms), and pet-friendliness — then book instantly." }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/s",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90",
              children: "Find a pool near you"
            }
          )
        ] }),
        body ? /* @__PURE__ */ jsx(
          AutoLinkedContent,
          {
            text: body,
            targets: linkTargets,
            className: "prose prose-lg mt-10 max-w-none whitespace-pre-line text-foreground"
          }
        ) : /* @__PURE__ */ jsx("p", { className: "mt-10 text-sm text-muted-foreground", children: "Detailed local guide coming soon." }),
        nearbyCities.length > 0 && /* @__PURE__ */ jsx(
          NearbyCities,
          {
            cities: nearbyCities,
            slugPrefix: "",
            heading: "Pool rentals in nearby cities"
          }
        ),
        /* @__PURE__ */ jsx(FaqBlock, { faqs }),
        /* @__PURE__ */ jsx(RelatedPages, {})
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function SwimInstructorCityTemplate({
  page,
  nearbyCities = [],
  linkTargets = []
}) {
  const citySlug = cityForContentPage("swim_instructor_city", page.slug) || "";
  const { city, stateCode } = parseCitySlug(citySlug);
  const cityName = city || "your city";
  const where = stateCode ? `${cityName}, ${stateCode}` : cityName;
  const faqs = faqsForContentPage(page);
  const body = page.body_markdown || page.content || page.description || "";
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 sm:py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(
          BreadcrumbsWithSchema,
          {
            items: [
              { name: "Home", path: "/" },
              { name: "Swim instructor pool rentals", path: "/p/swim-instructor-pool-rental" },
              { name: where, path: page.url_path }
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: [
          "For swim instructors · ",
          where
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl", children: [
          "Rent a Pool to Teach Swim Lessons in ",
          where
        ] }),
        /* @__PURE__ */ jsx(AuthorByline, { date: page.published_at ?? page.updated_at }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-2xl text-lg text-muted-foreground", children: page.seo_description || page.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs("a", { href: "/s", className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90", children: [
            "Find a ",
            cityName,
            " pool"
          ] }),
          /* @__PURE__ */ jsx("a", { href: "/p/swim-instructor-pool-rental", className: "inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted", children: "Read the full instructor guide →" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(AutoLinkedContent, { text: body, targets: linkTargets, className: "whitespace-pre-line text-base leading-relaxed text-foreground/90" }),
        /* @__PURE__ */ jsxs("h2", { className: "mt-10 text-2xl font-bold text-foreground", children: [
          "Hourly pricing benchmarks in ",
          cityName
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-4 space-y-2 text-foreground/90", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "· ",
            /* @__PURE__ */ jsx("strong", { children: "Pool rental:" }),
            " $45–$120/hr depending on amenities & shade"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "· ",
            /* @__PURE__ */ jsx("strong", { children: "Private 1-on-1 lesson rate:" }),
            " $65–$110 per 30-min session"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "· ",
            /* @__PURE__ */ jsx("strong", { children: "Small-group (3–4 kids):" }),
            " $30–$45 per child per 45 min"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "· ",
            /* @__PURE__ */ jsx("strong", { children: "Stroke clinics / adult triathlon:" }),
            " $40–$70 per swimmer per hour"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("h2", { className: "mt-10 text-2xl font-bold text-foreground", children: [
          "What you need before your first ",
          cityName,
          " class"
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-4 space-y-2 text-foreground/90", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "· ",
            /* @__PURE__ */ jsx("strong", { children: "Certification:" }),
            " Red Cross WSI, ASCA Level 1+, USA Swimming, or Starfish Aquatics"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "· ",
            /* @__PURE__ */ jsx("strong", { children: "Insurance:" }),
            " $2M liability is included on every Pool Rental Near Me booking — bring your own professional liability policy on top"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "· ",
            /* @__PURE__ */ jsx("strong", { children: "Equipment:" }),
            " kickboards, noodles, dive rings; some ",
            cityName,
            " hosts include them"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "· ",
            /* @__PURE__ */ jsx("strong", { children: "Permission to instruct:" }),
            ' filter for hosts who have "lessons / instruction allowed" enabled'
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-muted/20 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Keep exploring swim instructor pool rentals" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Start with the full guide, then compare instructor-friendly markets near ",
          cityName,
          "."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/p/$slug",
              params: { slug: "swim-instructor-pool-rental" },
              className: "block rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10",
              children: "📘 Swim Instructor Pool Rental Guide →"
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/s",
              className: "block rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary",
              children: [
                "🏊 Browse ",
                cityName,
                " pools →"
              ]
            }
          )
        ] }),
        (() => {
          const list = nearbyCities.some((c) => c.linkSlug) ? nearbyCities.filter((c) => c.linkSlug) : nearbyCities;
          if (list.length === 0) return null;
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("h3", { className: "mt-8 text-base font-semibold text-foreground", children: [
              "Top swim instructor markets near ",
              cityName
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5", children: list.slice(0, 5).map((c) => {
              const slug = c.linkSlug ?? `swim-instructor-pool-rental-${c.slug}`;
              const label = c.state_code && !c.slug.endsWith(`-${c.state_code.toLowerCase()}`) ? `${c.name}, ${c.state_code}` : c.name;
              return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
                Link,
                {
                  to: "/p/$slug",
                  params: { slug },
                  className: "block rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary",
                  title: `Rent a pool to teach swim lessons in ${label}`,
                  children: [
                    "Swim lessons in ",
                    label
                  ]
                }
              ) }, c.slug);
            }) })
          ] });
        })()
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(FaqBlock, { faqs }),
        /* @__PURE__ */ jsx(RelatedPages, {})
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-gradient-to-br from-primary/15 via-background to-accent/15 py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold tracking-tight text-foreground", children: [
          "Start teaching in ",
          cityName,
          " this week."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Browse instructor-friendly pools, book by the hour, and run your class on your terms." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxs("a", { href: "/s", className: "inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90", children: [
          "Browse ",
          cityName,
          " pools"
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function SwimInstructorHubTemplate({ page, linkTargets = [] }) {
  const body = page.body_markdown || page.content || "";
  const faqs = faqsForContentPage(page);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(BreadcrumbsWithSchema, { items: [{ name: "Home", path: "/" }, { name: "Swim instructor pool rentals", path: page.url_path }] }),
        /* @__PURE__ */ jsx("h1", { className: "mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl", children: page.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: page.seo_description })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-12", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx(AutoLinkedContent, { text: body, targets: linkTargets, className: "prose prose-lg max-w-none whitespace-pre-line text-foreground" }) }) }),
      /* @__PURE__ */ jsx("section", { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(FaqBlock, { faqs }),
        /* @__PURE__ */ jsx(RelatedPages, {})
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
const HUB_PATH = "/p/pool-maintenance";
const HUB_LINKS = [
  { slug: "water-chemistry-basics", label: "Water chemistry basics", tier: "tier2" },
  { slug: "how-to-shock-a-pool", label: "How to shock a pool", tier: "tier2" },
  { slug: "cloudy-pool-water-fix", label: "Cloudy pool water fix", tier: "tier2" },
  { slug: "green-pool-recovery", label: "Green pool recovery", tier: "tier2" },
  { slug: "weekly-pool-cleaning-schedule", label: "Weekly cleaning schedule", tier: "tier2" },
  { slug: "pool-pump-troubleshooting", label: "Pool pump troubleshooting", tier: "tier3" },
  { slug: "pool-filter-types", label: "Pool filter types", tier: "tier3" },
  { slug: "pool-heater-guide", label: "Pool heater guide", tier: "tier3" },
  { slug: "saltwater-pool-care", label: "Saltwater pool care", tier: "tier3" },
  { slug: "pool-vacuums-cleaners", label: "Pool vacuums and cleaners", tier: "tier3" },
  { slug: "opening-a-pool", label: "Opening a pool", tier: "tier4" },
  { slug: "winterizing-a-pool", label: "Winterizing a pool", tier: "tier4" },
  { slug: "after-heavy-rain", label: "Pool care after heavy rain", tier: "tier4" },
  { slug: "pool-stains-removal", label: "Pool stains removal", tier: "tier4" }
];
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}
function extractHeadings(md) {
  if (!md) return [];
  const out = [];
  const re = /^##\s+(.+?)\s*$/gm;
  let m;
  while (m = re.exec(md)) {
    const text = m[1].replace(/[*_`]/g, "").trim();
    if (text) out.push({ id: slugify(text), text });
  }
  return out;
}
function readingMinutes(md) {
  const words = (md || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
function normalizeMarkdownTables(md) {
  return md.replace(
    /(^\|[^\n]*\|[ \t]*$)(?:\n[ \t]*)+(?=^\|)/gm,
    "$1\n"
  );
}
function PoolMaintenanceTemplate({ page }) {
  const isHub = page.slug === "pool-maintenance";
  const body = normalizeMarkdownTables((page.content || page.body_markdown || "").toString());
  const headings = useMemo(() => extractHeadings(body), [body]);
  const minutes = useMemo(() => readingMinutes(body), [body]);
  const faqs = faqsForContentPage(page);
  const relatedSlugs = page.related_slugs ?? [];
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Pool Maintenance", path: HUB_PATH }
  ];
  if (!isHub) {
    breadcrumbs.push({ name: page.title || page.slug || "", path: page.url_path });
  }
  const siblings = (() => {
    const wanted = relatedSlugs && relatedSlugs.length > 0 ? relatedSlugs : HUB_LINKS.filter((l) => l.slug !== page.slug).slice(0, 3).map((l) => l.slug);
    return wanted.map((slug) => HUB_LINKS.find((h) => h.slug === slug)).filter((x) => !!x).slice(0, 3);
  })();
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12", children: [
      /* @__PURE__ */ jsx(BreadcrumbsWithSchema, { items: breadcrumbs }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10", children: [
        !isHub && headings.length > 1 ? /* @__PURE__ */ jsx("aside", { className: "hidden lg:block", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-24", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "On this page" }),
          /* @__PURE__ */ jsxs("nav", { className: "mt-3 space-y-2 border-l border-border pl-4 text-sm", children: [
            headings.map((h) => /* @__PURE__ */ jsx(
              "a",
              {
                href: `#${h.id}`,
                className: "block text-muted-foreground hover:text-primary",
                children: h.text
              },
              h.id
            )),
            faqs.length > 0 ? /* @__PURE__ */ jsx(
              "a",
              {
                href: "#faq",
                className: "block font-medium text-foreground hover:text-primary",
                children: "FAQ"
              }
            ) : null
          ] })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "hidden lg:block" }),
        /* @__PURE__ */ jsxs("article", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("header", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: isHub ? "Pillar guide" : "Pool maintenance" }),
            /* @__PURE__ */ jsx("h1", { className: "mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl", children: page.title || page.seo_title || page.slug }),
            /* @__PURE__ */ jsx(AuthorByline, { date: page.published_at ?? page.updated_at }),
            page.description ? /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-3xl text-lg text-muted-foreground", children: page.description }) : null,
            /* @__PURE__ */ jsxs("p", { className: "mt-4 text-sm text-muted-foreground", children: [
              minutes,
              " min read",
              page.updated_at ? /* @__PURE__ */ jsxs(Fragment, { children: [
                " · Updated ",
                /* @__PURE__ */ jsx("time", { dateTime: page.updated_at, children: new Date(page.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                }) })
              ] }) : null
            ] })
          ] }),
          page.seo_description && !isHub ? /* @__PURE__ */ jsxs(
            "aside",
            {
              "aria-label": "Quick answer",
              className: "mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6",
              children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "60-second answer" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-base leading-relaxed text-foreground", children: page.seo_description }),
                headings.length > 0 ? /* @__PURE__ */ jsxs("p", { className: "mt-4 text-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "In a hurry?" }),
                  " ",
                  headings.slice(0, 3).map((h, i) => /* @__PURE__ */ jsxs("span", { children: [
                    i > 0 ? " · " : "",
                    /* @__PURE__ */ jsx("a", { className: "text-primary hover:underline", href: `#${h.id}`, children: h.text })
                  ] }, h.id)),
                  faqs.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    " · ",
                    /* @__PURE__ */ jsx("a", { className: "text-primary hover:underline", href: "#faq", children: "FAQ" })
                  ] }) : null
                ] }) : null
              ]
            }
          ) : null,
          (() => {
            const vid = page.youtube_video_id;
            if (!vid || !/^[A-Za-z0-9_-]{11}$/.test(vid)) return null;
            return /* @__PURE__ */ jsxs("div", { className: "mt-8 overflow-hidden rounded-2xl border border-border bg-card", children: [
              /* @__PURE__ */ jsx("div", { className: "aspect-video", children: /* @__PURE__ */ jsx(
                "iframe",
                {
                  src: `https://www.youtube-nocookie.com/embed/${vid}`,
                  title: page.title || "Pool maintenance video",
                  loading: "lazy",
                  allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                  allowFullScreen: true,
                  className: "h-full w-full"
                }
              ) }),
              /* @__PURE__ */ jsx("p", { className: "px-4 py-3 text-xs text-muted-foreground", children: "Video embedded from YouTube. We do not own this video; it is provided as supplementary reference." })
            ] });
          })(),
          isHub ? /* @__PURE__ */ jsxs("section", { className: "mt-10 space-y-8", children: [
            /* @__PURE__ */ jsx(
              PillarSection,
              {
                title: "Water chemistry & quick fixes",
                blurb: "The high-volume problems every pool owner Googles first.",
                tier: "tier2"
              }
            ),
            /* @__PURE__ */ jsx(
              PillarSection,
              {
                title: "Equipment guides",
                blurb: "Pumps, filters, heaters, salt cells, and cleaners — what to buy and how to keep them running.",
                tier: "tier3"
              }
            ),
            /* @__PURE__ */ jsx(
              PillarSection,
              {
                title: "Seasonal & event-driven care",
                blurb: "Opening, closing, and the unplanned moments (storms, stains) in between.",
                tier: "tier4"
              }
            )
          ] }) : null,
          body ? /* @__PURE__ */ jsx(BodyWithMidCta, { body, injectCta: !isHub }) : null,
          faqs.length > 0 ? /* @__PURE__ */ jsx("div", { id: "faq", children: /* @__PURE__ */ jsx(FaqBlock, { faqs }) }) : null,
          !isHub && siblings.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "mt-14 border-t border-border pt-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold", children: "Related guides" }),
            /* @__PURE__ */ jsx("ul", { className: "mt-6 grid gap-4 sm:grid-cols-3", children: siblings.map((s) => /* @__PURE__ */ jsx(
              "li",
              {
                className: "rounded-xl border border-border bg-card p-5 transition hover:border-primary",
                children: /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: `/p/${s.slug}`,
                    className: "block",
                    children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: s.tier === "tier2" ? "Water & cleaning" : s.tier === "tier3" ? "Equipment" : "Seasonal" }),
                      /* @__PURE__ */ jsx("p", { className: "mt-2 text-base font-semibold text-foreground", children: s.label }),
                      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-primary", children: "Read the guide →" })
                    ]
                  }
                )
              },
              s.slug
            )) }),
            /* @__PURE__ */ jsx("div", { className: "mt-6 text-sm", children: /* @__PURE__ */ jsx("a", { href: "/p/pool-maintenance", className: "text-primary hover:underline", children: "← Back to the full Pool Maintenance Guide" }) })
          ] }) : null,
          /* @__PURE__ */ jsx(PrnmCta, {}),
          /* @__PURE__ */ jsx(
            RelatedPages,
            {
              heading: isHub ? "Turn your maintenance know-how into income" : "Related on Pool Rental Near Me",
              items: [
                { to: "/p/hosting", label: "Become a pool host", description: "Earn $3K–$10K/month renting your pool by the hour" },
                { to: "/p/earnings-calculator", label: "Pool host earnings calculator", description: "See what your pool could make this month" },
                { to: "/p/free-host-tools", label: "Free host tools", description: "Calculators, checklists, and templates" },
                { to: "/p/all-locations", label: "Browse all pool rental cities", description: "5,000+ city pages across the US" },
                { to: "/p/how-it-works", label: "How pool rental works", description: "Booking, payouts, and insurance, end to end" },
                ...isHub ? [] : [{ to: "/p/pool-maintenance", label: "Back to the Pool Maintenance Guide", description: "Pillar guide and every chapter in one place" }]
              ]
            }
          ),
          /* @__PURE__ */ jsxs("section", { className: "mt-10 rounded-2xl border border-border bg-muted/30 p-6", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: "Written by the PRNM team" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: "Pool Rental Near Me is the peer-to-peer pool rental marketplace America loves — connecting pool owners with guests for hourly rentals across the US. Our editorial team works with hosts and licensed pool pros to keep these guides current." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function PillarSection({
  title,
  blurb,
  tier
}) {
  const links = HUB_LINKS.filter((l) => l.tier === tier);
  return /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: blurb }),
    /* @__PURE__ */ jsx("ul", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: links.map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      "a",
      {
        href: `/p/${l.slug}`,
        className: "group flex items-start gap-2 rounded-lg border border-transparent p-3 transition hover:border-primary hover:bg-primary/5",
        children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground group-hover:text-primary", children: l.label })
        ]
      }
    ) }, l.slug)) })
  ] });
}
function MidContentCta() {
  return /* @__PURE__ */ jsxs("aside", { className: "not-prose my-10 overflow-hidden rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 sm:p-6", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "Got a pool?" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-base font-semibold leading-snug text-foreground sm:text-lg", children: "It can pay for its own upkeep." }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: "Owners on Pool Rental Near Me earn money renting their pool by the hour — no membership, 0% host fees through 2026, $2M liability insurance included." }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
      "a",
      {
        href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
        className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90",
        children: "List your pool →"
      }
    ) })
  ] });
}
function PrnmCta() {
  return /* @__PURE__ */ jsxs("aside", { className: "mt-14 overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 p-6 sm:p-8", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "Turn your pool into income" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Stop paying for pool upkeep. Get paid for it instead." }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-base text-muted-foreground", children: "Hosts on Pool Rental Near Me earn $3K–$10K/month renting their pool by the hour. 0% host fees through 2026 (vs Swimply's 15%+), $2M liability insurance included, you set the rules. Listing takes 10 minutes." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
          className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90",
          children: "List your pool →"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/s",
          className: "inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary",
          children: "Looking to rent a pool instead? Find pools near you →"
        }
      )
    ] })
  ] });
}
function ProseBlock({ children }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "prose prose-lg mt-10 max-w-none text-foreground\n        prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground prose-headings:scroll-mt-24\n        prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2\n        prose-h3:mt-8 prose-h3:text-xl\n        prose-p:leading-relaxed\n        prose-a:text-primary hover:prose-a:underline\n        prose-strong:text-foreground\n        prose-table:border prose-table:border-border\n        prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold\n        prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2\n        prose-li:my-1\n        dark:prose-invert",
      children
    }
  );
}
function renderMarkdown(md) {
  return /* @__PURE__ */ jsx(
    ReactMarkdown,
    {
      remarkPlugins: [remarkGfm],
      components: {
        h2: ({ children, ...props }) => {
          const text = Array.isArray(children) ? children.join("") : String(children ?? "");
          return /* @__PURE__ */ jsx("h2", { id: slugify(text), ...props, children });
        },
        blockquote: ({ children }) => /* @__PURE__ */ jsxs("aside", { className: "not-prose my-6 flex gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100", children: [
          /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "text-xl", children: "💡" }),
          /* @__PURE__ */ jsx("div", { className: "text-base leading-relaxed [&_p]:m-0", children })
        ] }),
        table: ({ children }) => /* @__PURE__ */ jsx("div", { className: "not-prose my-8 overflow-x-auto rounded-xl border border-border", children: /* @__PURE__ */ jsx("table", { className: "w-full min-w-[720px] border-collapse text-left text-sm text-foreground", children }) }),
        th: ({ children }) => /* @__PURE__ */ jsx("th", { className: "border-b border-border bg-muted/60 px-3 py-2 align-top font-semibold text-foreground", children }),
        td: ({ children }) => /* @__PURE__ */ jsx("td", { className: "border-t border-border px-3 py-2 align-top leading-relaxed", children })
      },
      children: md
    }
  );
}
function BodyWithMidCta({ body, injectCta }) {
  const split = useMemo(() => {
    if (!injectCta) return { before: body, after: "" };
    const re = /\n## /g;
    const first = re.exec(body);
    if (!first) return { before: body, after: "" };
    const second = re.exec(body);
    if (!second) return { before: body, after: "" };
    return {
      before: body.slice(0, second.index),
      after: body.slice(second.index + 1)
      // drop the leading newline
    };
  }, [body, injectCta]);
  if (!split.after) {
    return /* @__PURE__ */ jsx(ProseBlock, { children: renderMarkdown(split.before) });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(ProseBlock, { children: renderMarkdown(split.before) }),
    /* @__PURE__ */ jsx(MidContentCta, {}),
    /* @__PURE__ */ jsx(ProseBlock, { children: renderMarkdown(split.after) })
  ] });
}
function ActivityCityTemplate({
  page,
  nearbyCities = []
}) {
  const parsed = parseActivityCitySlug(page.slug);
  const activity = parsed?.activity;
  const citySlug = parsed?.citySlug ?? "";
  const { city, stateCode } = parseCitySlug(citySlug);
  const cityName = city || "your city";
  const where = stateCode ? `${cityName}, ${stateCode}` : cityName;
  const faqs = faqsForContentPage(page);
  const body = page.body_markdown || page.content || page.description || "";
  const h1 = activity?.h1(where) ?? `${page.title || "Pool rentals"} in ${where}`;
  const heroSubtitle = activity?.heroSubtitle(where) ?? page.seo_description ?? `Book a private backyard pool in ${where} by the hour.`;
  const ctaLabel = activity?.ctaLabel(cityName) ?? `Find a ${cityName} pool`;
  const searchHref = `/s?address=${encodeURIComponent(`${cityName}, ${stateCode}`)}`;
  const breadcrumbActivityLabel = activity?.label ?? "Pool rentals";
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 sm:py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(
          BreadcrumbsWithSchema,
          {
            items: [
              { name: "Home", path: "/" },
              { name: breadcrumbActivityLabel, path: page.url_path },
              { name: where, path: page.url_path }
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: [
          breadcrumbActivityLabel,
          " · ",
          where
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl", children: h1 }),
        /* @__PURE__ */ jsx(AuthorByline, { date: page.published_at ?? page.updated_at }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-2xl text-lg text-muted-foreground", children: heroSubtitle }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: searchHref,
              className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90",
              children: ctaLabel
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: `/p/${citySlug}`,
              className: "inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted",
              children: [
                "See all ",
                cityName,
                " pools →"
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-12", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "prose prose-neutral max-w-none text-base leading-relaxed text-foreground/90 dark:prose-invert", children: /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: body }) }) }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-muted/20 py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-foreground", children: [
          "Pool Rental Near Me vs Swimply for ",
          breadcrumbActivityLabel.toLowerCase()
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 overflow-hidden rounded-xl border border-border bg-background", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/40", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "What you care about" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold text-primary", children: "Pool Rental Near Me" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold text-muted-foreground", children: "Swimply" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border", children: [
            /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: "Host fee" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: "0% (2026)" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: "15%+" })
            ] }),
            /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: "Liability insurance" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: "$2M, included on every booking" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: "$1M self-funded guarantee" })
            ] }),
            /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: "Payout speed" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: "Next-day after the booking ends" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: "Up to a week" })
            ] }),
            /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: "Booking model" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: "Hourly, instant book, no membership" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: "Hourly, instant book" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Numbers reflect public information as of 2026. Verify host-specific terms before you book." })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-b border-border py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold text-foreground", children: [
          "Keep exploring ",
          breadcrumbActivityLabel.toLowerCase(),
          " near ",
          cityName
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: searchHref,
              className: "block rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10",
              children: [
                "🔍 Browse all ",
                cityName,
                " pools →"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/p/$slug",
              params: { slug: citySlug },
              className: "block rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary",
              children: [
                "📍 ",
                where,
                " pool rental overview →"
              ]
            }
          )
        ] }),
        (() => {
          const list = nearbyCities.filter((c) => c.slug && c.slug !== citySlug);
          if (list.length === 0) return null;
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("h3", { className: "mt-8 text-base font-semibold text-foreground", children: "Same activity, nearby cities" }),
            /* @__PURE__ */ jsx("ul", { className: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5", children: list.slice(0, 10).map((c) => {
              const activitySlug = activity ? `${activity.slugPrefix}${c.slug}` : c.slug;
              const label = c.state_code && !c.slug.endsWith(`-${c.state_code.toLowerCase()}`) ? `${c.name}, ${c.state_code}` : c.name;
              return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                Link,
                {
                  to: "/p/$slug",
                  params: { slug: activitySlug },
                  className: "block rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary",
                  title: `${breadcrumbActivityLabel} in ${label}`,
                  children: label
                }
              ) }, c.slug);
            }) })
          ] });
        })()
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(FaqBlock, { faqs }),
        /* @__PURE__ */ jsx(RelatedPages, {})
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-gradient-to-br from-primary/15 via-background to-accent/15 py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold tracking-tight text-foreground", children: [
          "Book a ",
          cityName,
          " pool by the hour."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Real backyard pools, real reviews, $2M liability on every booking. No membership." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
          "a",
          {
            href: searchHref,
            className: "inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90",
            children: ctaLabel
          }
        ) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function AcademyHubTemplate({
  page,
  hub,
  lang,
  twinPath
}) {
  const t = I18N[lang];
  const title = page.title || page.seo_title || t.academyTitle;
  const description = page.description || page.seo_description || t.academyTagline;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(
        BreadcrumbsWithSchema,
        {
          items: [
            { name: lang === "es" ? "Inicio" : "Home", path: "/" },
            { name: title, path: page.url_path || academyHubPath(lang) }
          ]
        }
      ),
      /* @__PURE__ */ jsxs("header", { className: "mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-3xl", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(LanguageSwitcher, { current: lang, alternateHref: twinPath ?? null }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: title }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: description }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
            hub.total,
            " ",
            lang === "es" ? "cursos gratuitos" : "free courses"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden items-end gap-3 lg:flex", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative max-w-[220px] rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-md", children: [
            lang === "es" ? "Soy Fred. Empieza con un curso destacado abajo. ↓" : "I'm Fred. Start with a featured course below. ↓",
            /* @__PURE__ */ jsx("div", { className: "absolute -right-1.5 bottom-5 h-3 w-3 rotate-45 border-r border-t border-border bg-card" })
          ] }),
          /* @__PURE__ */ jsx(FredMascot, { variant: "full", className: "h-40 w-40 flex-shrink-0 drop-shadow-xl" })
        ] })
      ] }),
      hub.featured.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-foreground", children: lang === "es" ? "Cursos destacados" : "Featured courses" }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: hub.featured.map((c) => /* @__PURE__ */ jsx(CourseCard, { course: c, lang, featured: true }, c.slug)) })
      ] }),
      hub.categories.map((group) => {
        const meta = getCategoryMeta(group.category, lang);
        return /* @__PURE__ */ jsxs("section", { className: "mt-16", id: `cat-${group.category}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-semibold text-foreground", children: [
                /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: meta.emoji }),
                " ",
                meta.label
              ] }),
              meta.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: meta.description })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
              group.count,
              " ",
              lang === "es" ? "cursos" : "courses"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: group.courses.map((c) => /* @__PURE__ */ jsx(CourseCard, { course: c, lang }, c.slug)) })
        ] }, group.category);
      }),
      hub.total === 0 && /* @__PURE__ */ jsx("p", { className: "mt-12 text-muted-foreground", children: t.noCourses }),
      lang === "en" && /* @__PURE__ */ jsxs("section", { className: "mt-20 border-t border-border pt-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-foreground", children: "Free host tools" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Pair Learn with Fred with the tools top earners use every week." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [
          { href: "/p/start-hosting", title: "Start hosting", body: "Earn $1,500–$8,000/month renting your pool." },
          { href: "/p/ai-listing-generator", title: "AI listing generator", body: "Turn one photo into a booking-ready listing." },
          { href: "/p/pool-heating-cost-calculator", title: "Pool heating cost calculator", body: "Gas vs heat pump vs solar — monthly cost." },
          { href: "/p/pool-rules-generator", title: "Pool rules generator", body: "Printable house rules in under a minute." },
          { href: "/p/waiver-generator", title: "Waiver generator", body: "Digital liability waivers, signed on phone." },
          { href: "/p/host-marketing-playbook", title: "Host marketing playbook", body: "Flyers, captions, seasonal campaigns." }
        ].map((t2) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: t2.href,
            className: "rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm",
            children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold text-foreground", children: [
                t2.title,
                " →"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t2.body })
            ]
          },
          t2.href
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {}),
    /* @__PURE__ */ jsx(FloatingFredTip, {})
  ] });
}
function ContentPageDispatcher() {
  const loaderData = Route.useLoaderData();
  const {
    page,
    nearbyCities,
    city,
    citySources,
    linkTargets,
    academyHub,
    relatedPosts
  } = loaderData ?? {};
  if (!page) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-3xl px-4 py-20 text-center", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Page not found" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "The page you're looking for is unavailable. Try refreshing, or head back home." }),
        /* @__PURE__ */ jsx("a", { href: "/", className: "mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground", children: "Go home" })
      ] }),
      /* @__PURE__ */ jsx(SiteFooter, {})
    ] });
  }
  if (!page.template_type) {
    return /* @__PURE__ */ jsx(GenericPageTemplate, { page, linkTargets });
  }
  const academyLang = academyLangForSlug(page.slug);
  if (academyLang && academyHub) {
    return /* @__PURE__ */ jsx(AcademyHubTemplate, { page, hub: academyHub, lang: academyLang, twinPath: academyHubPath(academyLang === "en" ? "es" : "en") });
  }
  switch (page.template_type) {
    case "host_acq_city":
      return /* @__PURE__ */ jsx(HostAcqCityTemplate, { page, nearbyCities, city, linkTargets, citySources });
    case "event_guide":
      return /* @__PURE__ */ jsx(EventGuideTemplate, { page, linkTargets, nearbyCities });
    case "swim_instructor_city":
      return /* @__PURE__ */ jsx(SwimInstructorCityTemplate, { page, nearbyCities, linkTargets });
    case "swim_instructor_hub":
      return /* @__PURE__ */ jsx(SwimInstructorHubTemplate, { page, linkTargets });
    case "resource":
      return /* @__PURE__ */ jsx(ResourceArticleTemplate, { page, linkTargets, relatedPosts });
    case "pool_maintenance":
    case "pool_maintenance_hub":
      return /* @__PURE__ */ jsx(PoolMaintenanceTemplate, { page });
    case "host_advocacy_hub":
    case "host_advocacy_state":
      return /* @__PURE__ */ jsx(AdvocacyTemplate, { page });
    case "activity_city":
      return /* @__PURE__ */ jsx(ActivityCityTemplate, { page, nearbyCities, linkTargets });
    default:
      return /* @__PURE__ */ jsx(GenericPageTemplate, { page, linkTargets });
  }
}
export {
  ContentPageDispatcher as component
};
