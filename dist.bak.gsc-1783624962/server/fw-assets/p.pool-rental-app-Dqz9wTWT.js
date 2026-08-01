import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, T as heroImage, U as APP_STORE_URL, V as PLAY_STORE_URL, W as FAQS, e as SiteFooter } from "./router-Bw8GQi9C.js";
import { Link } from "@tanstack/react-router";
import "react";
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
import "./renter-drip.server-CMz_M9Zp.js";
import "node:fs";
import "node:path";
import "./host-drip.server-nBw4NS9X.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";
const CITY_LINKS = [{
  name: "Los Angeles, CA",
  slug: "los-angeles-ca"
}, {
  name: "San Diego, CA",
  slug: "san-diego-ca"
}, {
  name: "Sacramento, CA",
  slug: "sacramento-ca"
}, {
  name: "Phoenix, AZ",
  slug: "phoenix-az"
}, {
  name: "Las Vegas, NV",
  slug: "las-vegas-nv"
}, {
  name: "Miami, FL",
  slug: "miami-fl"
}, {
  name: "Orlando, FL",
  slug: "orlando-fl"
}, {
  name: "Tampa, FL",
  slug: "tampa-fl"
}, {
  name: "Austin, TX",
  slug: "austin-tx"
}, {
  name: "Dallas, TX",
  slug: "dallas-tx"
}, {
  name: "Houston, TX",
  slug: "houston-tx"
}, {
  name: "Atlanta, GA",
  slug: "atlanta-ga"
}];
function PoolRentalAppPage() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
          /* @__PURE__ */ jsx("img", { src: heroImage, alt: "Pool Rental Near Me app on a phone next to a private backyard pool", className: "h-full w-full object-cover", loading: "eager" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-3xl px-4 py-20 text-center text-white sm:py-28", children: [
          /* @__PURE__ */ jsxs("nav", { className: "mb-4 text-xs text-white/80", children: [
            /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-white", children: "Home" }),
            /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
            /* @__PURE__ */ jsx("span", { children: "Pool rental app" })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight sm:text-5xl", children: "Pool rental app: book a private pool from your phone" }),
          /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-relaxed text-white/90 sm:text-xl", children: "Find a private pool for rent by the hour, anywhere in America. The Pool Rental Near Me app puts heated pools, hot tubs, and party-friendly backyards in your pocket. Book in minutes, message your host, and show up ready to swim. Every booking carries $2M in liability coverage at no extra cost." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row", children: [
            /* @__PURE__ */ jsx("a", { href: APP_STORE_URL, rel: "noopener", "aria-label": "Download Pool Rental Near Me on the App Store", className: "inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-black shadow-lg transition hover:opacity-90", children: "Download on the App Store" }),
            /* @__PURE__ */ jsx("a", { href: PLAY_STORE_URL, rel: "noopener", "aria-label": "Get Pool Rental Near Me on Google Play", className: "inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20", children: "Get it on Google Play" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-12 sm:py-16", children: [
        /* @__PURE__ */ jsxs("article", { className: "prose prose-slate max-w-none text-foreground\n              prose-headings:font-semibold prose-headings:tracking-tight\n              prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2\n              prose-h3:mt-8 prose-h3:text-xl\n              prose-p:leading-relaxed\n              prose-a:text-primary hover:prose-a:underline\n              prose-strong:text-foreground\n              prose-ul:my-4 prose-li:my-1.5\n              dark:prose-invert", children: [
          /* @__PURE__ */ jsx("h2", { children: "What the pool rental app does" }),
          /* @__PURE__ */ jsx("p", { children: "The Pool Rental Near Me app turns your phone into a live map of every private pool you can book by the hour. Open the app, allow location access, and you see heated pools, hot tubs, saltwater backyards, and party-friendly spots near you with hourly rates, photos, and host reviews." }),
          /* @__PURE__ */ jsx("p", { children: "Booking takes under a minute. Pick a slot on the host's calendar, choose how many hours you need, pay in-app, and message the host with any questions. Most bookings confirm in under an hour. Push notifications let you know the second the host replies, so you are not refreshing your phone all afternoon." }),
          /* @__PURE__ */ jsx("p", { children: "Once your booking is confirmed, the address, parking notes, and house rules appear inside the app. Pull up directions, message your host on arrival, and rate the space when you leave. Saved listings, past bookings, and refunds all live in one place." }),
          /* @__PURE__ */ jsxs("div", { className: "not-prose my-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6", children: [
            /* @__PURE__ */ jsxs("figure", { className: "mx-auto w-full max-w-[320px]", children: [
              /* @__PURE__ */ jsx("img", { src: "/fw-assets/app/filter-search.png", alt: "Pool Rental Near Me app filter screen with water type, guest capacity, and event type options", loading: "lazy", width: 883, height: 1920, className: "w-full rounded-2xl border border-border bg-card shadow-sm" }),
              /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: "Filter by water type, guest count, and event type." })
            ] }),
            /* @__PURE__ */ jsxs("figure", { className: "mx-auto w-full max-w-[320px]", children: [
              /* @__PURE__ */ jsx("img", { src: "/fw-assets/app/sort-by.png", alt: "Sort search results by newest, oldest, closest distance, or price in the Pool Rental Near Me app", loading: "lazy", width: 883, height: 1920, className: "w-full rounded-2xl border border-border bg-card shadow-sm" }),
              /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: "Sort by closest distance or price in one tap." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "Why a pool rental app beats a browser tab" }),
          /* @__PURE__ */ jsx("p", { children: "You could book on the website, and plenty of people do. The pool rental app is faster on a phone because the map loads first, the filters are one tap away, and your saved searches sync across devices. Push notifications mean you find out about a host reply while you are still picking a date, not three hours later when you open your laptop." }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Map-first search." }),
              " See every available pool near you, with hourly rates on the pins."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "One-tap filters." }),
              " Heated, hot tub, saltwater, pet-friendly, party-friendly, ADA accessible."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "In-app messaging." }),
              " Talk to the host without sharing your phone number or email."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Push notifications." }),
              " Host replies, booking confirmations, and reminders show up the moment they happen."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Saved listings and trips." }),
              " Build a shortlist for this weekend, plus a folder for the birthday in July."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("figure", { className: "not-prose my-8 mx-auto w-full max-w-[320px]", children: [
            /* @__PURE__ */ jsx("img", { src: "/fw-assets/app/wishlist.png", alt: "Saved pools wishlist with hourly rates in the Pool Rental Near Me app", loading: "lazy", width: 883, height: 1920, className: "w-full rounded-2xl border border-border bg-card shadow-sm" }),
            /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: "Save pools to your wishlist and come back when you are ready." })
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "Hosts: list your pool from the app" }),
          /* @__PURE__ */ jsx("p", { children: "The same pool rental app lets you list your backyard pool in about 15 minutes. Add photos, set your hourly rate and house rules, pick your weekly availability, and you are live to every guest searching your city." }),
          /* @__PURE__ */ jsx("h3", { children: "Get listed in 5 fields" }),
          /* @__PURE__ */ jsx("p", { children: "The minimum-viable listing is intentionally short. Five fields are required to publish: pool name, description, location, photos, and price. Skip the rest and refine later from your dashboard." }),
          /* @__PURE__ */ jsxs("div", { className: "not-prose my-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6", children: [
            /* @__PURE__ */ jsxs("figure", { className: "mx-auto w-full max-w-[320px]", children: [
              /* @__PURE__ */ jsx("img", { src: "/fw-assets/app/listing-creation-select-type.png", alt: "Select listing type screen when creating a new pool listing in the Pool Rental Near Me app", loading: "lazy", width: 883, height: 1920, className: "w-full rounded-2xl border border-border bg-card shadow-sm" }),
              /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: "Start by picking your listing type." })
            ] }),
            /* @__PURE__ */ jsxs("figure", { className: "mx-auto w-full max-w-[320px]", children: [
              /* @__PURE__ */ jsx("img", { src: "/fw-assets/app/listing-creation-basic-info.png", alt: "Basic Info tab of the host listing flow with Hourly renting, Pool category, and Private Pool subcategory selected", loading: "lazy", width: 883, height: 1920, className: "w-full rounded-2xl border border-border bg-card shadow-sm" }),
              /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: "Hourly renting is the primary model. Pick a category and name your pool." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { children: "The full Basic Info, Where, Rates & Upgrades, and Calendar tabs are all available, but you can publish a working listing in minutes and add depth later. The description field allows up to 5,000 characters, so you have room to tell your story. Hourly renting is the primary booking model. Hosts keep 100% of every booking with 0% host fees through 2026, and $2M liability coverage is included." }),
          /* @__PURE__ */ jsxs("figure", { className: "not-prose my-8 mx-auto w-full max-w-[320px]", children: [
            /* @__PURE__ */ jsx("img", { src: "/fw-assets/app/listing-creation-form.png", alt: "Listing creation form showing category, pool name, description, square footage, and max guest fields", loading: "lazy", width: 883, height: 1920, className: "w-full rounded-2xl border border-border bg-card shadow-sm" }),
            /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: "Set your category, square footage, and max guest capacity at your own pace." })
          ] }),
          /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "Your rules. Your hours. Your earnings. We handle the rest." }) }),
          /* @__PURE__ */ jsxs("p", { children: [
            "You can also start your listing on the web at",
            " ",
            /* @__PURE__ */ jsx("a", { href: LIST_HREF, children: "List your pool free" }),
            " and finish on the app later. Listings sync across both."
          ] }),
          /* @__PURE__ */ jsx("h2", { id: "how-it-works", children: "How a booking works, end to end" }),
          /* @__PURE__ */ jsxs("ol", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Download the app." }),
              " Free on the App Store and Google Play."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Search by city or current location." }),
              " Filter by date, group size, amenities, and price."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Pick a slot and pay." }),
              " Each listing shows the host's hourly rate, minimum hours, and available time slots."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Host confirms." }),
              " Most bookings confirm in under an hour. The address and house rules appear once confirmed."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Show up, swim, head home." }),
              " Stay within your booked window. Leave the space the way you found it."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Rate your host." }),
              " Every booking carries $2M in liability coverage at no extra cost to you."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("figure", { className: "not-prose my-8 mx-auto w-full max-w-[320px]", children: [
            /* @__PURE__ */ jsx("img", { src: "/fw-assets/app/inbox.png", alt: "Direct in-app messaging between renters and pool hosts in the Pool Rental Near Me app", loading: "lazy", width: 883, height: 1920, className: "w-full rounded-2xl border border-border bg-card shadow-sm" }),
            /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: "Message hosts and manage bookings from a single inbox." })
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "Secure sign-in, your way" }),
          /* @__PURE__ */ jsx("p", { children: "Log in to the pool rental app with the option that fits you: email and password, Apple, Google, or Facebook. Whichever you pick, your account is protected with industry-standard encryption, secure password storage, and account recovery built in. Payments and messaging stay inside the app so your contact info and card details are never exposed to other users." }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Email and password" }),
              " with password reset built in."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Sign in with Apple" }),
              " for one-tap login on iOS."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Sign in with Google" }),
              " on any device."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Sign in with Facebook" }),
              " if that is what you already use."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("figure", { className: "not-prose my-8 mx-auto w-full max-w-[320px]", children: [
            /* @__PURE__ */ jsx("img", { src: "/fw-assets/app/login.png", alt: "Pool Rental Near Me app login screen with email, password, Apple, Google, and Facebook sign-in options", loading: "lazy", width: 883, height: 1920, className: "w-full rounded-2xl border border-border bg-card shadow-sm" }),
            /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: "Sign in with email, Apple, Google, or Facebook." })
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "What is not in the app" }),
          /* @__PURE__ */ jsx("p", { children: "Real talk so you download with eyes open:" }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "No instant chat with support inside every screen." }),
              " ",
              "Support lives in Settings. For booking-specific questions, message the host first."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "No group-pay split." }),
              " One person books and pays. Splitting with friends happens outside the app for now."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "No lifeguard service." }),
              " The app books the pool. Adults in your group supervise swimmers."
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "Find a pool rental app listing in your city" }),
          /* @__PURE__ */ jsx("p", { children: "These metros have the deepest pool inventory in the pool rental app right now. Tap your city for local listings and pricing:" }),
          /* @__PURE__ */ jsx("div", { className: "not-prose my-6 grid grid-cols-2 gap-2 sm:grid-cols-3", children: CITY_LINKS.map((c) => /* @__PURE__ */ jsx(Link, { to: `/p/${c.slug}`, className: "rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/5", children: c.name }, c.slug)) }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Browse ",
            /* @__PURE__ */ jsx(Link, { to: "/p/all-locations", children: "every US city with a pool rental available" }),
            " ",
            "for the full directory, or check our",
            " ",
            /* @__PURE__ */ jsx("a", { href: "/p/private-pool-rental", children: "private pool rental guide" }),
            " and",
            " ",
            /* @__PURE__ */ jsx("a", { href: "/p/pool-party-rentals", children: "pool party rentals guide" }),
            " for more on how booking works."
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "Frequently asked questions" }),
          FAQS.map((f) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { children: f.q }),
            /* @__PURE__ */ jsx("p", { children: f.a })
          ] }, f.q))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "not-prose my-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "m-0 text-2xl font-semibold text-foreground", children: "Get the pool rental app" }),
          /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-xl text-base text-muted-foreground", children: "Free on the App Store and Google Play. Find a private pool near you in under a minute. $2M liability coverage on every booking." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row", children: [
            /* @__PURE__ */ jsx("a", { href: APP_STORE_URL, rel: "noopener", "aria-label": "Download Pool Rental Near Me on the App Store", className: "inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-base font-semibold text-background shadow-sm transition hover:opacity-90", children: "Download on the App Store" }),
            /* @__PURE__ */ jsx("a", { href: PLAY_STORE_URL, rel: "noopener", "aria-label": "Get Pool Rental Near Me on Google Play", className: "inline-flex items-center justify-center rounded-full border border-border bg-card px-8 py-3 text-base font-semibold text-foreground shadow-sm transition hover:bg-muted", children: "Get it on Google Play" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "not-prose my-12 rounded-2xl border border-border bg-muted/40 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "m-0 text-xl font-semibold text-foreground", children: "Have a pool? List it free" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-muted-foreground", children: "Hosts on Pool Rental Near Me earn $1,500 to $8,000 a month renting their backyard pool by the hour. 0% host fees through 2026, so you keep 100% of every booking. We eat the credit card processing fees, so 90% means 90%. $2M liability coverage included." }),
          /* @__PURE__ */ jsx("a", { href: LIST_HREF, className: "mt-5 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-base font-semibold text-background shadow-sm transition hover:opacity-90", children: "List your pool free" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  PoolRentalAppPage as component
};
