import { jsxs, jsx } from "react/jsx-runtime";
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
}
function ProviderPlanBadges({ p, className = "" }) {
  const now = Date.now();
  const featuredActive = !!p.is_featured && (!p.featured_until || new Date(p.featured_until).getTime() > now);
  const paidActive = !!p.listing_paid_until && new Date(p.listing_paid_until).getTime() > now;
  if (!featuredActive && !paidActive) return null;
  const dateStr = featuredActive ? fmtDate(p.featured_until) : fmtDate(p.listing_paid_until);
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex flex-wrap items-center gap-1.5 ${className}`, children: [
    featuredActive ? /* @__PURE__ */ jsx(
      "span",
      {
        title: dateStr ? `Featured through ${dateStr}` : void 0,
        className: "rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground",
        children: "Featured"
      }
    ) : /* @__PURE__ */ jsx(
      "span",
      {
        title: dateStr ? `Verified listing through ${dateStr}` : void 0,
        className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground",
        children: "Verified"
      }
    ),
    dateStr && /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-medium text-muted-foreground", children: [
      "until ",
      dateStr
    ] })
  ] });
}
export {
  ProviderPlanBadges as P
};
