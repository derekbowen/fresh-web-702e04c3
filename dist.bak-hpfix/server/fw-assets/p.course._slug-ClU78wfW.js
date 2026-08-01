import { jsxs, jsx } from "react/jsx-runtime";
import { bI as Route, aN as resolveAcademyHero, S as SiteHeader, bJ as courseTwinSlug, h as coursePath, aI as academyHubPath, aJ as FredMascot, e as SiteFooter } from "./router-BPpbotmS.js";
import { B as BreadcrumbsWithSchema } from "./breadcrumbs-jsonld-CTDBOZJf.js";
import { g as getCategoryMeta, a as getTierMeta, L as LanguageSwitcher, I as I18N, C as CourseCard } from "./language-switcher-B5WmgI9N.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "@tanstack/react-router";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-Brwu0BKb.js";
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
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
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
function CoursePage() {
  const {
    course,
    related
  } = Route.useLoaderData();
  const lang = course.language === "es" ? "es" : "en";
  const t = I18N[lang];
  const cat = getCategoryMeta(course.category, lang);
  const tier = getTierMeta(course.tier);
  const heroUrl = resolveAcademyHero(course.cover_image_url);
  const hubPath = academyHubPath(lang);
  const longFormText = typeof course.long_form_content === "string" ? course.long_form_content : course.long_form_content && typeof course.long_form_content === "object" && "markdown" in course.long_form_content ? String(course.long_form_content.markdown) : null;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(BreadcrumbsWithSchema, { items: [{
        name: lang === "es" ? "Inicio" : "Home",
        path: "/"
      }, {
        name: lang === "es" ? "Academia" : "Academy",
        path: hubPath
      }, {
        name: course.title,
        path: `/p/course/${course.slug}`
      }] }),
      /* @__PURE__ */ jsxs("article", { className: "mt-6", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(LanguageSwitcher, { current: lang, alternateHref: courseTwinSlug(course.slug, lang) ? coursePath(courseTwinSlug(course.slug, lang)) : academyHubPath(lang === "en" ? "es" : "en") }) }),
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2 text-xs font-medium", children: [
          /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-primary/10 px-2.5 py-0.5 text-primary", children: [
            cat.emoji,
            " ",
            cat.label
          ] }),
          tier && /* @__PURE__ */ jsxs("span", { className: `rounded-full px-2.5 py-0.5 ${tier.badgeClass}`, children: [
            tier.emoji,
            " ",
            tier.shortLabel
          ] }),
          course.duration_minutes ? /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
            course.duration_minutes,
            " min"
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: course.title }),
        course.subtitle && /* @__PURE__ */ jsx("p", { className: "mt-3 text-xl text-muted-foreground", children: course.subtitle }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-start gap-4 rounded-2xl border border-border bg-card/60 p-4", children: [
          /* @__PURE__ */ jsx(FredMascot, { variant: "full", className: "h-20 w-20 flex-shrink-0 sm:h-24 sm:w-24" }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 rounded-2xl bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground sm:text-base", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -left-1.5 top-5 h-3 w-3 rotate-45 bg-muted/60" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Hey, I'm Fred." }),
            " ",
            lang === "es" ? `Soy tu coach de hosting. Esta clase de ${cat.label.toLowerCase()} te toma${course.duration_minutes ? ` ${course.duration_minutes} minutos` : " pocos minutos"} y vas a salir sabiendo exactamente qué hacer. Vamos.` : `I'm your hosting coach. This ${cat.label.toLowerCase()} class takes ${course.duration_minutes ? `${course.duration_minutes} minutes` : "a few minutes"} and you'll walk away knowing exactly what to do. Let's go.`
          ] })
        ] }),
        heroUrl && /* @__PURE__ */ jsx("div", { className: "mt-8 aspect-video overflow-hidden rounded-2xl", children: /* @__PURE__ */ jsx("img", { src: heroUrl, alt: course.title, className: "h-full w-full object-cover", loading: "eager", fetchPriority: "high" }) }),
        course.embed_url && /* @__PURE__ */ jsx("div", { className: "mt-8 aspect-video overflow-hidden rounded-2xl bg-black", children: /* @__PURE__ */ jsx("iframe", { src: course.embed_url, title: course.title, allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true, className: "h-full w-full" }) }),
        course.excerpt && /* @__PURE__ */ jsx("p", { className: "mt-8 text-lg text-muted-foreground", children: course.excerpt }),
        (course.description || longFormText) && /* @__PURE__ */ jsxs("div", { className: "prose prose-lg mt-10 max-w-none text-foreground dark:prose-invert", children: [
          /* @__PURE__ */ jsx("h2", { children: t.inThisCourse }),
          /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: longFormText || course.description || "" })
        ] })
      ] }),
      related.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-foreground", children: t.related }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: related.map((c) => /* @__PURE__ */ jsx(CourseCard, { course: c, lang }, c.slug)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 border-t border-border pt-8", children: /* @__PURE__ */ jsxs("a", { href: hubPath, className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground", children: [
        "← ",
        t.back
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  CoursePage as component
};
