import { jsxs, jsx } from "react/jsx-runtime";
import { bQ as Route, S as SiteHeader, a4 as Breadcrumbs, e as SiteFooter } from "./router-BvRNdW25.js";
import "@tanstack/react-router";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./cities.functions-XBYRqf13.js";
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
import "./auth-middleware-rMMNsPLB.js";
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
import "./renter-drip.server-CBcoOJUi.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-LDeZNUHd.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function ListingPage() {
  const {
    listing
  } = Route.useLoaderData();
  const params = Route.useParams();
  const loc = [listing.city, listing.state].filter(Boolean).join(", ");
  const externalUrl = `https://www.poolrentalnearme.com/l/${params.slug}/${params.id}`;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
        name: "Home",
        path: "/"
      }, {
        name: loc || "Pool Rentals",
        path: "/"
      }, {
        name: listing.title,
        path: `/l/${params.slug}/${params.id}`
      }] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-video overflow-hidden rounded-2xl bg-muted", children: listing.imageUrl ? /* @__PURE__ */ jsx("img", { src: listing.imageUrl, alt: listing.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: "No image available" }) }),
          /* @__PURE__ */ jsx("h1", { className: "mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: listing.title }),
          loc && /* @__PURE__ */ jsx("p", { className: "mt-2 text-base text-muted-foreground", children: loc }),
          listing.description && /* @__PURE__ */ jsx("div", { className: "prose prose-sm mt-6 max-w-none whitespace-pre-line text-foreground", children: listing.description })
        ] }),
        /* @__PURE__ */ jsx("aside", { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
          listing.price && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("span", { className: "text-3xl font-bold text-foreground", children: [
              "$",
              (listing.price.amount / 100).toFixed(0)
            ] }),
            /* @__PURE__ */ jsx("span", { className: "ml-1 text-base text-muted-foreground", children: "/ hour" })
          ] }),
          /* @__PURE__ */ jsx("a", { href: externalUrl, className: "mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow", children: "Book this pool" }),
          /* @__PURE__ */ jsxs("ul", { className: "mt-6 space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx("li", { children: "✓ $2M liability insurance included" }),
            /* @__PURE__ */ jsx("li", { children: "✓ Instant booking confirmation" }),
            /* @__PURE__ */ jsx("li", { children: "✓ Hourly rentals — flexible" })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  ListingPage as component
};
