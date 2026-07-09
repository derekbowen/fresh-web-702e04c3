import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { aa as Route, S as SiteHeader, e as SiteFooter } from "./router-B7ZiUt1j.js";
import { Share2, Heart, Camera, Calendar, MapPin, Users, Droplets, Ruler, Flame, Mountain, Sparkles, ShieldCheck, Check, Sun, Trees, Gift, ListChecks, ChevronLeft, ChevronRight } from "lucide-react";
import "@tanstack/react-router";
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
import "./client-TSMcDHCK.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
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
import "./renter-drip.server-69Dq0r1C.js";
import "node:fs";
import "node:path";
import "./host-drip.server-d8aCbPyC.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const ADVANTAGE_LABELS = {
  "shaded-area-nearby": {
    icon: Trees,
    label: "Shaded area nearby"
  },
  "night-lighting": {
    icon: Sun,
    label: "Night lighting"
  },
  "heated-pool": {
    icon: Flame,
    label: "Heated pool — 85°"
  },
  "music-system": {
    icon: Sparkles,
    label: "Music system"
  },
  "fire-pit-nearby": {
    icon: Flame,
    label: "Fire pit nearby"
  },
  "poolside-dining-area": {
    icon: Sun,
    label: "Poolside dining"
  },
  "pool-cleaning-included": {
    icon: Sparkles,
    label: "Pool cleaning included"
  },
  "lifeguard-on-duty": {
    icon: ShieldCheck,
    label: "Lifeguard on duty"
  }
};
const POOL_AMENITY_LABELS = {
  deep_end: "Deep end + diving board",
  bbq: "BBQ grill",
  covered_seating: "Covered seating",
  restroom: "Restroom",
  ada: "ADA accessible",
  fenced: "Fully fenced",
  changing_area: "Changing area",
  parking: "On-site parking (10+ spaces)",
  saltwater: "Saltwater",
  cameras: "Security cameras"
};
const RULE_LABELS = {
  no_glass: "No glass in or near pool",
  no_djs: "No outside DJs",
  music_curfew: "Music ends at 10 PM",
  no_nudity: "No nudity",
  no_pets: "No pets",
  supervised_minors: "Minors must be supervised",
  host_present: "Host present on property",
  cameras_disclosed: "Security cameras on exterior"
};
function JanPage() {
  const {
    listing
  } = Route.useLoaderData();
  const [lightbox, setLightbox] = useState(null);
  const [shared, setShared] = useState(false);
  const locStr = [listing.city, listing.state].filter(Boolean).join(", ");
  const heroImg = listing.heroImage ?? "";
  const galleryRest = listing.images.slice(1, 5);
  const extraPhotos = listing.images.slice(5);
  const totalPhotos = listing.images.length;
  const bookHref = listing.bookUrl;
  const signupHref = `/signup?next=${encodeURIComponent(bookHref)}`;
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url
        });
      } catch {
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2e3);
      } catch {
      }
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "bg-background pb-20", children: [
      /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 pt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary", children: "J" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: "Hosted by Jan · Top provider" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Pacific Northwest backyard sanctuary · 85° heated · Mountain & lake views" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: handleShare, className: "inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-transform hover:scale-[1.02]", children: [
            /* @__PURE__ */ jsx(Share2, { className: "h-4 w-4" }),
            shared ? "Link copied!" : "Share this pool"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 text-[11px] font-bold text-black shadow", children: [
            /* @__PURE__ */ jsx(Heart, { className: "h-3 w-3" }),
            " PRNM Newest Featured Pool"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 pt-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground", children: [
            /* @__PURE__ */ jsx(Camera, { className: "h-4 w-4 text-primary" }),
            totalPhotos,
            " photos"
          ] }),
          totalPhotos > 5 && /* @__PURE__ */ jsxs("button", { onClick: () => setLightbox(0), className: "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-accent", children: [
            "View all ",
            totalPhotos
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 md:grid-cols-4 md:grid-rows-2 md:gap-3", children: [
          heroImg && /* @__PURE__ */ jsx("button", { onClick: () => setLightbox(0), className: "group relative col-span-2 row-span-2 overflow-hidden rounded-2xl md:col-span-2", children: /* @__PURE__ */ jsx("img", { src: heroImg, alt: listing.title, className: "h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-full" }) }),
          galleryRest.map((src, i) => /* @__PURE__ */ jsxs("button", { onClick: () => setLightbox(i + 1), className: "group relative overflow-hidden rounded-2xl", children: [
            /* @__PURE__ */ jsx("img", { src, alt: `${listing.title} photo ${i + 2}`, loading: "lazy", className: "aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 md:aspect-auto" }),
            i === 3 && totalPhotos > 5 && /* @__PURE__ */ jsxs("span", { className: "absolute bottom-2 right-2 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-md md:bottom-3 md:right-3 md:px-3 md:py-1.5 md:text-xs", children: [
              "+",
              totalPhotos - 5,
              " more"
            ] })
          ] }, src))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto mt-8 max-w-7xl px-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-border bg-card shadow-sm", children: /* @__PURE__ */ jsx("video", { poster: heroImg || void 0, controls: true, playsInline: true, preload: "metadata", className: "h-auto w-full bg-black", children: /* @__PURE__ */ jsx("source", { src: "/__l5e/assets-v1/115e9299-b846-44cf-9392-b54189659e8c/jan-swimpark.mp4", type: "video/mp4" }) }) }),
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-border bg-card shadow-sm", children: /* @__PURE__ */ jsx("video", { poster: heroImg || void 0, controls: true, playsInline: true, preload: "metadata", className: "h-auto w-full bg-black", children: /* @__PURE__ */ jsx("source", { src: "/__l5e/assets-v1/d84cc872-4898-46c3-87a2-062b1e06a4a8/jan-swimpark-2.mp4", type: "video/mp4" }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsxs("a", { href: bookHref, className: "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02]", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5" }),
            "Book now"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Summer fun pool vibes · 85° heated saltwater pool" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto mt-8 max-w-7xl px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 md:flex-row md:items-start md:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight text-foreground md:text-5xl", children: listing.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-base text-foreground/75 md:text-lg", children: "A private backyard sanctuary with Olympic & Cascade mountain views, hosted by Jan." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground", children: [
            locStr && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
              locStr
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }),
              "Up to ",
              listing.guests ?? 50,
              " guests"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Droplets, { className: "h-4 w-4" }),
              "85° heated · Diving board"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Ruler, { className: "h-4 w-4" }),
              "3,000 sq ft pool area"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:items-end", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("span", { className: "text-3xl font-bold text-foreground", children: [
              "$",
              listing.pricePerHour
            ] }),
            /* @__PURE__ */ jsx("span", { className: "ml-1 text-sm text-muted-foreground", children: "/ hour" })
          ] }),
          /* @__PURE__ */ jsxs("a", { href: bookHref, className: "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
            "Check availability & book"
          ] }),
          /* @__PURE__ */ jsx("a", { href: signupHref, className: "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5", children: "New here? Sign up to book" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "3-hour minimum Fri–Sun · 4-hour on holidays" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto mt-10 max-w-7xl px-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [
        /* @__PURE__ */ jsx(Fact, { icon: Flame, label: "85° heated", sub: "Year-round swimmable" }),
        /* @__PURE__ */ jsx(Fact, { icon: Mountain, label: "Mountain views", sub: "Olympic & Cascade" }),
        /* @__PURE__ */ jsx(Fact, { icon: Users, label: "Fits 50 guests", sub: "Big parties welcome" }),
        /* @__PURE__ */ jsx(Fact, { icon: Sparkles, label: "3,000 sq ft", sub: "Pool area + gardens" })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto mt-12 grid max-w-7xl gap-12 px-4 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-2xl font-bold text-foreground", children: [
            /* @__PURE__ */ jsx(Droplets, { className: "h-6 w-6 text-primary" }),
            "About TheSwimpark"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85", children: listing.description }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: "Great for" }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: ["Weddings & receptions", "Bridal showers", "Birthday parties", "Family reunions", "Corporate events", "Photo & video shoots", "Graduation parties", "Bar & bat mitzvahs", "Bachelor/bachelorette", "Team building"].map((tag) => /* @__PURE__ */ jsx("span", { className: "rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/85", children: tag }, tag)) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("aside", { className: "md:sticky md:top-24 md:self-start", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-2xl font-bold text-foreground", children: [
              "$",
              listing.pricePerHour
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "/ hour" })
          ] }),
          /* @__PURE__ */ jsx("a", { href: bookHref, className: "mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]", children: "Book now" }),
          /* @__PURE__ */ jsx("a", { href: signupHref, className: "mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card py-2.5 text-sm font-semibold text-primary hover:bg-primary/5", children: "Sign up to book" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-3 text-sm text-foreground/85", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "mt-0.5 h-4 w-4 text-primary" }),
              /* @__PURE__ */ jsx("span", { children: "$2M liability insurance included on every booking" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 text-primary" }),
              /* @__PURE__ */ jsx("span", { children: "0% host fees through 2026 — lower than Swimply" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 text-primary" }),
              /* @__PURE__ */ jsx("span", { children: "Check in with host on arrival" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 text-primary" }),
              /* @__PURE__ */ jsx("span", { children: "Parking for 10+ vehicles" })
            ] })
          ] })
        ] }) })
      ] }),
      (listing.advantages.length > 0 || listing.poolAmenities.length > 0) && /* @__PURE__ */ jsxs("section", { className: "mx-auto mt-16 max-w-7xl px-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-2xl font-bold text-foreground", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6 text-primary" }),
          "What's included"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [
          listing.advantages.map((code) => {
            const cfg = ADVANTAGE_LABELS[code];
            if (!cfg) return null;
            const Icon = cfg.icon;
            return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-border bg-card p-4", children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 text-primary" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: cfg.label })
            ] }, code);
          }),
          listing.poolAmenities.map((code) => {
            const label = POOL_AMENITY_LABELS[code];
            if (!label) return null;
            return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-border bg-card p-4", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-primary" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: label })
            ] }, `pa-${code}`);
          }),
          ["Diving board", "Pool floats", "Tables & umbrellas", "Tetherball", "Ice chest", "Barbecue"].map((label) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-border bg-card p-4", children: [
            /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: label })
          ] }, `s-${label}`))
        ] })
      ] }),
      listing.amenities.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mx-auto mt-16 max-w-7xl px-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-2xl font-bold text-foreground", children: [
          /* @__PURE__ */ jsx(Gift, { className: "h-6 w-6 text-primary" }),
          "Add-on extras"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Optional add-ons you can request with your booking." }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", children: listing.amenities.map((a) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: a.name }),
            a.priceCents > 0 ? /* @__PURE__ */ jsxs("span", { className: "shrink-0 text-xs font-semibold text-primary", children: [
              "+$",
              (a.priceCents / 100).toFixed(0)
            ] }) : /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs font-medium text-muted-foreground", children: "Free" })
          ] }),
          a.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: a.description })
        ] }, a.id)) })
      ] }),
      listing.houseRules.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mx-auto mt-16 max-w-7xl px-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-2xl font-bold text-foreground", children: [
          /* @__PURE__ */ jsx(ListChecks, { className: "h-6 w-6 text-primary" }),
          "House rules"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2", children: listing.houseRules.map((code) => {
          const label = RULE_LABELS[code];
          if (!label) return null;
          return /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-foreground/85", children: [
            /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }),
            label
          ] }, code);
        }) })
      ] }),
      extraPhotos.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mx-auto mt-16 max-w-7xl px-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-end justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-2xl font-bold text-foreground", children: [
            /* @__PURE__ */ jsx(Camera, { className: "h-6 w-6 text-primary" }),
            "The full tour"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
            "All ",
            totalPhotos,
            " photos of TheSwimpark — tap any photo to enlarge."
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4", children: extraPhotos.map((src, i) => /* @__PURE__ */ jsx("button", { onClick: () => setLightbox(i + 5), className: "group overflow-hidden rounded-xl", children: /* @__PURE__ */ jsx("img", { src, alt: `${listing.title} photo ${i + 6}`, loading: "lazy", className: "aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105" }) }, src)) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto mt-20 max-w-4xl px-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-card p-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground md:text-3xl", children: "Ready to book your day at TheSwimpark?" }),
        /* @__PURE__ */ jsxs("p", { className: "mx-auto mt-3 max-w-xl text-foreground/75", children: [
          "Up to ",
          listing.guests ?? 50,
          " guests. Pick your date and time, book in under 2 minutes. Jan personally checks in every guest on arrival."
        ] }),
        /* @__PURE__ */ jsxs("a", { href: bookHref, className: "mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02]", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5" }),
          "Book TheSwimpark — $",
          listing.pricePerHour,
          "/hour"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "0% host fees through 2026 · $2M liability insurance included" })
      ] }) })
    ] }),
    lightbox !== null && listing.images[lightbox] && /* @__PURE__ */ jsxs("div", { onClick: () => setLightbox(null), className: "fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4", children: [
      /* @__PURE__ */ jsx("img", { src: listing.images[lightbox], alt: `${listing.title} photo ${lightbox + 1}`, className: "max-h-full max-w-full rounded-lg object-contain" }),
      /* @__PURE__ */ jsx("button", { onClick: (e) => {
        e.stopPropagation();
        setLightbox(null);
      }, className: "absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20", "aria-label": "Close", children: "✕" }),
      /* @__PURE__ */ jsx("button", { onClick: (e) => {
        e.stopPropagation();
        setLightbox((lightbox - 1 + totalPhotos) % totalPhotos);
      }, className: "absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-6", "aria-label": "Previous photo", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsx("button", { onClick: (e) => {
        e.stopPropagation();
        setLightbox((lightbox + 1) % totalPhotos);
      }, className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-6", "aria-label": "Next photo", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsxs("span", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white", children: [
        lightbox + 1,
        " / ",
        totalPhotos
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Fact({
  icon: Icon,
  label,
  sub
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 text-primary" }),
    /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm font-semibold text-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: sub })
  ] });
}
export {
  JanPage as component
};
