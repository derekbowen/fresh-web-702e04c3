import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { I as SITE_URL } from "./router-BvRNdW25.js";
function BreadcrumbsWithSchema({ items, className }) {
  if (!items?.length) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`
    }))
  };
  const isInternal = (p) => p === "/" || p.startsWith("/p/") || p.startsWith("/landing-page");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("nav", { "aria-label": "Breadcrumb", className: className ?? "text-sm text-muted-foreground", children: /* @__PURE__ */ jsx("ol", { className: "flex flex-wrap items-center gap-1.5", children: items.map((c, i) => {
      const last = i === items.length - 1;
      return /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-1.5", children: [
        last ? /* @__PURE__ */ jsx("span", { "aria-current": "page", className: "text-foreground font-medium", children: c.name }) : isInternal(c.path) ? /* @__PURE__ */ jsx(Link, { to: c.path, className: "hover:text-primary hover:underline", children: c.name }) : /* @__PURE__ */ jsx("a", { href: c.path, className: "hover:text-primary hover:underline", children: c.name }),
        !last && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "›" })
      ] }, `${c.path}-${i}`);
    }) }) }),
    /* @__PURE__ */ jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(ld) } })
  ] });
}
export {
  BreadcrumbsWithSchema as B
};
