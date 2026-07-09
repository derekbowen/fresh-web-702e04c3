import { jsxs, jsx } from "react/jsx-runtime";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { S as SiteHeader, e as SiteFooter } from "./router-HDJJ1Z-a.js";
import { Link } from "@tanstack/react-router";
import { B as BreadcrumbsWithSchema } from "./breadcrumbs-jsonld-Dq6dRVf1.js";
import { useRef, useState, useEffect } from "react";
function AuthorByline({
  date,
  className = ""
}) {
  const updated = date ? new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : null;
  return /* @__PURE__ */ jsxs(
    "p",
    {
      className: `mt-3 text-sm text-muted-foreground ${className}`,
      "data-component": "author-byline",
      children: [
        "By",
        " ",
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/p/author/derek-bowen",
            className: "font-medium text-foreground underline-offset-2 hover:underline",
            children: "Derek Bowen"
          }
        ),
        ", founder of Pool Rental Near Me and",
        " ",
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://www.amazon.com/stores/author/B0FJM55Y12/about",
            target: "_blank",
            rel: "noopener",
            className: "font-medium text-foreground underline-offset-2 hover:underline",
            children: "author of 7 books on pool hosting"
          }
        ),
        updated ? /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          " · Updated ",
          updated
        ] }) : null
      ]
    }
  );
}
const DEFAULT_ITEMS = [
  { to: "/p/earnings-calculator", label: "Pool host earnings calculator", description: "Estimate your monthly pool rental income" },
  { to: "/p/free-host-tools", label: "Free pool host tools", description: "Calculators, checklists, and templates" },
  { to: "/p/how-it-works", label: "How pool rental works", description: "Hosting and booking, end to end" },
  { to: "/p/hosting", label: "Become a pool host", description: "Turn your backyard into income" },
  { to: "/p/all-locations", label: "All pool rental locations", description: "Browse pools across the US" },
  { to: "/p/pool-pros", label: "Pool pros directory", description: "Local pool builders, cleaners, and inspectors" }
];
function forceDocumentNavigation(path) {
  return (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.location.assign(path);
  };
}
function RelatedPages({
  items,
  heading = "Keep exploring",
  className
}) {
  const list = items && items.length > 0 ? items : DEFAULT_ITEMS;
  return /* @__PURE__ */ jsxs("section", { className: ["mt-12 border-t border-border pt-8", className].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: heading }),
    /* @__PURE__ */ jsx("ul", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: list.map((it) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      "a",
      {
        href: it.to,
        onClick: forceDocumentNavigation(it.to),
        className: "block rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary",
        children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-foreground", children: it.label }),
          it.description && /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: it.description })
        ]
      }
    ) }, it.to)) })
  ] });
}
const TIDYCAL_URL = "https://tidycal.com/meetderek/15-minute-meeting";
const COPY = {
  en: {
    heading: "Thinking about listing your pool? Talk to Derek, the founder.",
    sub: "Book 15 minutes with me. I'll walk you through how it works, what you could earn, how insurance covers you, and how to get your first booking. No pressure, no sales pitch.",
    slide: "Still thinking it over?",
    slideCta: "Talk to the founder, 15 min",
    dismiss: "Dismiss",
    open: "Open booking",
    close: "Close"
  },
  es: {
    heading: "¿Estás pensando en publicar tu piscina? Habla con Derek, el fundador.",
    sub: "Reserva 15 minutos conmigo. Te explico cómo funciona, cuánto podrías ganar, cómo te cubre el seguro y cómo conseguir tu primera reserva. Sin compromiso y sin ventas.",
    slide: "¿Todavía lo estás pensando?",
    slideCta: "Habla con el fundador, 15 min",
    dismiss: "Cerrar",
    open: "Abrir reserva",
    close: "Cerrar"
  }
};
function FounderBookingInline({ lang = "en" }) {
  const ref = useRef(null);
  const [load, setLoad] = useState(false);
  const t = COPY[lang];
  useEffect(() => {
    if (load || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setLoad(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [load]);
  return /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-muted/20 py-16 sm:py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "Free 15-min founder call" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: t.heading }),
      /* @__PURE__ */ jsx("p", { className: "mx-auto mt-4 max-w-2xl text-lg text-muted-foreground", children: t.sub })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        className: "mx-auto mt-8 w-full max-w-[700px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        style: { minHeight: 640 },
        children: load ? /* @__PURE__ */ jsx(
          "iframe",
          {
            src: TIDYCAL_URL,
            title: "Book a 15-minute call with Derek",
            loading: "lazy",
            className: "h-[640px] w-full",
            style: { border: 0 }
          }
        ) : /* @__PURE__ */ jsx("div", { className: "flex h-[640px] w-full items-center justify-center text-sm text-muted-foreground", children: "Loading calendar…" })
      }
    )
  ] }) });
}
function GenericPageTemplate({
  page,
  linkTargets = []
}) {
  if (!page) {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h1", { className: "mt-6 text-4xl font-bold tracking-tight text-foreground", children: "Page not found" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "The page you're looking for isn't available. Try the homepage or search for a pool near you." })
      ] }),
      /* @__PURE__ */ jsx(SiteFooter, {})
    ] });
  }
  const title = page.title || page.seo_title || page.slug || "";
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(
        BreadcrumbsWithSchema,
        {
          items: [
            { name: "Home", path: "/" },
            { name: title, path: page.url_path }
          ]
        }
      ),
      /* @__PURE__ */ jsx("h1", { className: "mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: title }),
      /* @__PURE__ */ jsx(AuthorByline, { date: page.published_at ?? page.updated_at }),
      page.description && /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: page.description }),
      (page.cover_image_url || page.hero_image_url) && /* @__PURE__ */ jsx("div", { className: "mt-8 aspect-video overflow-hidden rounded-2xl", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: page.cover_image_url || page.hero_image_url,
          alt: page.title || "",
          className: "h-full w-full object-cover",
          loading: "eager",
          fetchPriority: "high"
        }
      ) }),
      (page.content || page.body_markdown) && /* @__PURE__ */ jsx(
        "div",
        {
          className: "prose prose-lg mt-8 max-w-none text-foreground\n              prose-headings:font-semibold prose-headings:tracking-tight\n              prose-h1:text-3xl prose-h1:mt-10\n              prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2\n              prose-h3:mt-8 prose-h3:text-xl\n              prose-p:leading-relaxed\n              prose-a:text-primary hover:prose-a:underline\n              prose-strong:text-foreground\n              prose-ul:my-4 prose-li:my-1\n              prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic\n              dark:prose-invert",
          children: /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: page.content || page.body_markdown })
        }
      ),
      /* @__PURE__ */ jsx(RelatedPages, {})
    ] }),
    (page.template_type === "spanish_host_acq" || page.template_type === "host_acq_city_es") && /* @__PURE__ */ jsx(FounderBookingInline, { lang: "es" }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  AuthorByline as A,
  FounderBookingInline as F,
  GenericPageTemplate as G,
  RelatedPages as R
};
