import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, e as SiteFooter } from "./router-BEu57YoG.js";
function ToolPlaceholderPage({
  eyebrow,
  h1,
  intro,
  heroSrc,
  heroAlt,
  bullets,
  faqs,
  primaryCta,
  secondaryCta,
  breadcrumbItems,
  whyExists,
  whoUses,
  howItWorks,
  scenarios
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: heroSrc,
            alt: heroAlt,
            width: 1600,
            height: 896,
            className: "absolute inset-0 h-full w-full object-cover",
            loading: "eager"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/40" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-6xl px-4 py-20 sm:py-28", children: [
          /* @__PURE__ */ jsx(
            "nav",
            {
              "aria-label": "Breadcrumb",
              className: "mb-4 text-xs text-muted-foreground",
              children: breadcrumbItems.map((b, i) => /* @__PURE__ */ jsxs("span", { children: [
                i > 0 && /* @__PURE__ */ jsx("span", { className: "mx-1", children: "/" }),
                i < breadcrumbItems.length - 1 ? /* @__PURE__ */ jsx("a", { href: b.path, className: "hover:text-foreground", children: b.name }) : /* @__PURE__ */ jsx("span", { className: "text-foreground", children: b.name })
              ] }, b.path))
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
            /* @__PURE__ */ jsx("div", { className: "inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: eyebrow }),
            /* @__PURE__ */ jsx("h1", { className: "mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl", children: h1 }),
            /* @__PURE__ */ jsx("p", { className: "mt-5 text-base text-muted-foreground sm:text-lg", children: intro }),
            (primaryCta || secondaryCta) && /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-wrap gap-3", children: [
              primaryCta && /* @__PURE__ */ jsx(
                "a",
                {
                  href: primaryCta.href,
                  className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 sm:text-base",
                  children: primaryCta.label
                }
              ),
              secondaryCta && /* @__PURE__ */ jsx(
                "a",
                {
                  href: secondaryCta.href,
                  className: "inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-muted sm:text-base",
                  children: secondaryCta.label
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-muted-foreground", children: "The full tool is rolling out shortly. Bookmark this page — we'll notify list members the day it goes live." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-5xl px-4 py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "What you'll be able to do" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-6 grid gap-4 sm:grid-cols-2", children: bullets.map((b) => /* @__PURE__ */ jsxs(
          "li",
          {
            className: "flex gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground",
            children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  "aria-hidden": true,
                  className: "mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary"
                }
              ),
              /* @__PURE__ */ jsx("span", { children: b })
            ]
          },
          b
        )) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: whyExists.heading }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 space-y-4 text-base leading-relaxed text-muted-foreground", children: whyExists.paragraphs.map((p, i) => /* @__PURE__ */ jsx("p", { children: p }, i)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border bg-muted/20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: whoUses.heading }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 space-y-4 text-base leading-relaxed text-muted-foreground", children: whoUses.paragraphs.map((p, i) => /* @__PURE__ */ jsx("p", { children: p }, i)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: howItWorks.heading }),
        /* @__PURE__ */ jsx("ol", { className: "mt-6 space-y-5", children: howItWorks.steps.map((s, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-4 rounded-xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground", children: i + 1 }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-foreground", children: s.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm leading-relaxed text-muted-foreground", children: s.body })
          ] })
        ] }, s.title)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border bg-muted/20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: scenarios.heading }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-4 sm:grid-cols-2", children: scenarios.items.map((s) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-foreground", children: s.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: s.body })
        ] }, s.title)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-3", children: faqs.map((f) => /* @__PURE__ */ jsxs(
          "details",
          {
            className: "group rounded-xl border border-border bg-card p-5",
            children: [
              /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-base font-semibold text-foreground", children: f.q }),
              /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: f.a })
            ]
          },
          f.q
        )) })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-5xl px-4 py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Related host resources" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/hosting",
              className: "rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition hover:border-primary/40",
              children: "List your pool — 0% host fees through 2026 →"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/learningacademy",
              className: "rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition hover:border-primary/40",
              children: "Pool Host Academy — 135 free classes →"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/free-host-tools",
              className: "rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition hover:border-primary/40",
              children: "All free host tools →"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/earnings-calculator",
              className: "rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition hover:border-primary/40",
              children: "Pool rental earnings calculator →"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  ToolPlaceholderPage as T
};
