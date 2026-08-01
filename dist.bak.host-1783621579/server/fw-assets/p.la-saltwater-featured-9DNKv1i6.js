import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { S as SiteHeader, a3 as heroNight, a4 as INCLUDED, a5 as FAQS, e as SiteFooter } from "./router-BskH5uAy.js";
import { Component, useState, useEffect, useMemo } from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { AlertCircle, Loader2, ChevronLeft, ChevronRight, Trophy, Users, Droplets, Flame, ShieldCheck, Film, Utensils, Sparkles, Heart, PartyPopper, Camera, MessageCircle, X, Check } from "lucide-react";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { c as createServerFn } from "../server.js";
import { isValidIsoPair } from "./availability.utils-ohL_VTYY.js";
import "@tanstack/react-router";
import "@tanstack/react-query";
import "./site-footer-defaults-C6_J6kuR.js";
import "zod";
import "./auth-middleware-C3cX-s7a.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "./client.server-D5ro3rAQ.js";
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
import "./renter-drip.server-BUH95fZo.js";
import "node:fs";
import "node:path";
import "./host-drip.server-MvSzhhAo.js";
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
const getListingAvailability = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const id = String(data?.listingId ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("Invalid listing ID");
  }
  const days = Math.min(Math.max(Number(data?.days) || 60, 1), 90);
  return {
    listingId: id,
    days
  };
}).handler(createSsrRpc("cc8247edfb764bc249057bfb7ed1c1c3b7fb767a9ecb3a0527db515930482181"));
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatHour(iso) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "--";
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return m === 0 ? `${h}${period}` : `${h}:${String(m).padStart(2, "0")}${period}`;
}
class AvailabilityErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.error("AvailabilityCalendar render error:", err);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
function AvailabilityCalendar(props) {
  const baseUrl = String(props.bookingBaseUrl ?? "https://poolrentalnearme.com").replace(/\/$/, "");
  const fallback = /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm", children: [
    /* @__PURE__ */ jsx(AlertCircle, { className: "h-6 w-6 text-muted-foreground" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Calendar temporarily unavailable." }),
    /* @__PURE__ */ jsx(
      "a",
      {
        href: `${baseUrl}/l/${props.listingSlug}/${props.listingId}`,
        className: "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground",
        children: "Click to book directly →"
      }
    )
  ] }) });
  return /* @__PURE__ */ jsx(AvailabilityErrorBoundary, { fallback, children: /* @__PURE__ */ jsx(AvailabilityCalendarInner, { ...props }) });
}
function AvailabilityCalendarInner({
  listingId,
  listingSlug,
  bookingBaseUrl = "https://poolrentalnearme.com",
  days = 60
}) {
  const fetchAvailability = useServerFn(getListingAvailability);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const today = useMemo(() => {
    const d = /* @__PURE__ */ new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = () => setReloadKey((k) => k + 1);
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    fetchAvailability({ data: { listingId, days } }).then((res) => {
      if (cancelled) return;
      const safe = res && typeof res === "object" ? {
        listingId: String(res.listingId ?? listingId),
        fetchedAt: String(res.fetchedAt ?? (/* @__PURE__ */ new Date()).toISOString()),
        slots: Array.isArray(res.slots) ? res.slots : [],
        error: res.error ?? null,
        cached: res.cached
      } : { listingId, fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), slots: [], error: "Bad response" };
      setData(safe);
      setIsError(!!safe.error);
    }).catch(() => {
      if (cancelled) return;
      setIsError(true);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId, days, reloadKey]);
  const slotsByDay = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    const rawSlots = Array.isArray(data?.slots) ? data.slots : [];
    for (const s of rawSlots) {
      const v = isValidIsoPair(s?.start, s?.end);
      if (!v) continue;
      const dt = new Date(v.start);
      if (isNaN(dt.getTime())) continue;
      const key = ymd(dt);
      const arr = map.get(key) ?? [];
      arr.push({ start: v.start, end: v.end });
      map.set(key, arr);
    }
    return map;
  }, [data]);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  }, [today, days]);
  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = firstOfMonth.getDay();
    const lastOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);
  const canGoPrev = viewMonth > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoNext = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1) <= maxDate;
  const selectedSlots = selectedDate ? slotsByDay.get(selectedDate) ?? [] : [];
  function buildBookingUrl(startISO, endISO) {
    const base = String(bookingBaseUrl ?? "https://poolrentalnearme.com").replace(/\/$/, "");
    const params = new URLSearchParams({
      bookingStart: startISO,
      bookingEnd: endISO
    });
    return `${base}/l/${listingSlug}/${listingId}/checkout?${params.toString()}`;
  }
  return /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: "Live availability" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Pick a day, then a time" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Real-time openings from the host's calendar. Tap a date to see hourly slots." })
    ] }),
    !mounted ? /* @__PURE__ */ jsxs("div", { className: "mt-8 flex items-center justify-center gap-2 rounded-3xl border border-border bg-card px-6 py-16 text-sm text-muted-foreground shadow-sm", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      "Loading live availability…"
    ] }) : /* @__PURE__ */ jsxs("div", { className: "mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-3 sm:px-6", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => canGoPrev && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)),
            disabled: !canGoPrev,
            className: "rounded-full p-2 text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30",
            "aria-label": "Previous month",
            children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "text-base font-semibold text-foreground sm:text-lg", children: [
          MONTHS[viewMonth.getMonth()],
          " ",
          viewMonth.getFullYear()
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => canGoNext && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)),
            disabled: !canGoNext,
            className: "rounded-full p-2 text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30",
            "aria-label": "Next month",
            children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-5 w-5" })
          }
        )
      ] }),
      isLoading && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        "Loading live availability…"
      ] }),
      !isLoading && isError && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 px-6 py-12 text-center", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-6 w-6 text-muted-foreground" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Calendar temporarily unavailable." }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: `${bookingBaseUrl.replace(/\/$/, "")}/l/${listingSlug}/${listingId}`,
            className: "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground",
            children: "Click to book directly →"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => refetch(),
            className: "text-xs font-medium text-muted-foreground underline hover:text-foreground",
            children: "Try again"
          }
        )
      ] }),
      !isLoading && !isError && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 border-b border-border bg-secondary/40 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", children: DAY_NAMES.map((d) => /* @__PURE__ */ jsx("div", { className: "py-2", children: d }, d)) }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7", children: grid.map((d, i) => {
          if (!d) return /* @__PURE__ */ jsx("div", { className: "aspect-square" }, i);
          const key = ymd(d);
          const past = d < today;
          const beyond = d > maxDate;
          const slots = slotsByDay.get(key);
          const hasSlots = !!slots && slots.length > 0;
          const isSelected = selectedDate === key;
          const disabled = past || beyond || !hasSlots;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => !disabled && setSelectedDate(key),
              disabled,
              className: [
                "group relative aspect-square border-b border-r border-border p-1 text-xs sm:text-sm",
                "flex flex-col items-center justify-center gap-1 transition",
                isSelected ? "bg-primary text-primary-foreground" : hasSlots ? "bg-card text-foreground hover:bg-primary/10" : "bg-secondary/20 text-muted-foreground",
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              ].join(" "),
              "aria-label": hasSlots ? `${d.toDateString()}, ${slots.length} slots available` : `${d.toDateString()}, unavailable`,
              children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: d.getDate() }),
                hasSlots && !isSelected && /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary" }),
                hasSlots && isSelected && /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-medium opacity-90", children: [
                  slots.length,
                  " slots"
                ] })
              ]
            },
            i
          );
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "border-t border-border bg-secondary/20 p-4 sm:p-6", children: [
          !selectedDate && /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground", children: "Select an available date above to see open hours." }),
          selectedDate && selectedSlots.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground", children: "No openings on this date. Try another day." }),
          selectedDate && selectedSlots.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-3 text-sm font-semibold text-foreground", children: [
              "Available times on",
              " ",
              (/* @__PURE__ */ new Date(selectedDate + "T12:00:00")).toLocaleDateString(void 0, {
                weekday: "long",
                month: "long",
                day: "numeric"
              })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4", children: selectedSlots.map((s) => {
              const startLabel = formatHour(s.start);
              const endLabel = formatHour(s.end);
              if (startLabel === "--" || endLabel === "--") return null;
              return /* @__PURE__ */ jsxs(
                "a",
                {
                  href: buildBookingUrl(s.start, s.end),
                  className: "group flex items-center justify-center rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow",
                  children: [
                    startLabel,
                    /* @__PURE__ */ jsx("span", { className: "mx-1 text-muted-foreground group-hover:text-primary-foreground/80", children: "–" }),
                    endLabel
                  ]
                },
                s.start
              );
            }) }),
            /* @__PURE__ */ jsx("p", { className: "mt-3 text-center text-xs text-muted-foreground", children: "Tap a time to continue checkout on poolrentalnearme.com." })
          ] })
        ] })
      ] })
    ] }),
    mounted && data && (Array.isArray(data.slots) ? data.slots.length : 0) === 0 && !isError && !isLoading && /* @__PURE__ */ jsxs("p", { className: "mt-4 text-center text-xs text-muted-foreground", children: [
      "No openings in the next ",
      days,
      " days. Message the host for custom dates."
    ] })
  ] });
}
const poolsideDay = "/fw-assets/poolside-day-eP9nlg5C.jpg";
const poolSpa = "/fw-assets/pool-spa-DQ_I-1M2.jpg";
const shellFloat = "/fw-assets/shell-float-BsEdKbq4.jpg";
const nightGlow = "/fw-assets/night-glow-DAwFDLD0.jpg";
const firePit = "/fw-assets/fire-pit-CjwieAAX.jpg";
const dining = "/fw-assets/dining-M1gnL4Lc.jpg";
const bathroom = "/fw-assets/bathroom-B2uWWFoP.jpg";
const balcony = "/fw-assets/balcony-Bzk7LVod.jpg";
const BOOK_URL = "https://go.poolrentalnearme.com/lasaltwater";
const GALLERY = [{
  src: heroNight,
  alt: "La Saltwater pool at night with blue lighting and palm trees"
}, {
  src: poolsideDay,
  alt: "Daytime poolside lounge with white umbrella"
}, {
  src: poolSpa,
  alt: "Saltwater pool with adjoining heated spa"
}, {
  src: shellFloat,
  alt: "Iridescent shell float in the saltwater pool"
}, {
  src: nightGlow,
  alt: "Pool glowing at night under string lights"
}, {
  src: firePit,
  alt: "Outdoor fire pit lounge area"
}, {
  src: dining,
  alt: "Outdoor dining set beside the pool"
}, {
  src: bathroom,
  alt: "Modern marble guest bathroom"
}, {
  src: balcony,
  alt: "Shaded patio lounge overlooking the pool"
}];
const ADDONS = [{
  icon: Film,
  label: "Outdoor movie night",
  desc: 'Projector, 180" screen, Fire Stick with all major streaming apps.'
}, {
  icon: Utensils,
  label: "Grill & BBQ setup",
  desc: "Half-propane, half-charcoal grill with fuel and tools provided."
}, {
  icon: Sparkles,
  label: "Fire pit & fire tables",
  desc: "Propane fire pit + tables with fuel included. Cozy night-swim ambiance."
}, {
  icon: Heart,
  label: "Romantic setup",
  desc: "Rose petals, candles, ice bucket. Proposals, anniversaries, date nights."
}, {
  icon: PartyPopper,
  label: "Photo backdrops",
  desc: "Birthday, Congratulations, Summer Vibes, VIP, Movie Night themes."
}, {
  icon: Camera,
  label: "Red carpet & ropes",
  desc: "Velvet ropes set up before arrival. VIP entrance for any event."
}];
const PERFECT_FOR = ["Adult & kids birthday parties", "Bachelor & bachelorette parties", "Photo & video shoots", "Weddings & receptions", "Baby showers", "Corporate events & team building", "Family gatherings", "Swim lessons & fitness classes", "Fundraisers & charity events"];
const HOUSE_RULES = ["No alcohol", "No glass containers", "No smoking", "No pets", "No outside DJs", "Music ends by 10pm", "No after-dark swimming", "Adult supervision required for minors", "Pre-approved vendors only"];
function LaSaltwaterPage() {
  const [lightbox, setLightbox] = useState(null);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "bg-background pb-24", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative isolate overflow-hidden", children: [
        /* @__PURE__ */ jsx("img", { src: heroNight, alt: "La Saltwater Pool & Spa at night", className: "absolute inset-0 h-full w-full object-cover", fetchPriority: "high" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 text-xs font-semibold text-black shadow", children: [
              /* @__PURE__ */ jsx(Trophy, { className: "h-3 w-3 fill-current" }),
              " Ranked Top 9 Pools in LA 2025"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-semibold text-white shadow", children: "🔥 PRNM Featured Host" })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl", children: "La Saltwater Pool & Spa" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg font-medium text-white/95", children: "Your private saltwater resort in Sherman Oaks 🌴" }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-2xl text-base text-white/85 sm:text-lg", children: "Saltwater pool with free heat, heated spa included, Sonos sound, ambient night-swim lighting, and a fully-loaded backyard built for celebrations, shoots, and dreamy night swims. Fits up to 45 guests." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx("a", { href: BOOK_URL, className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]", children: "Check availability" }),
            /* @__PURE__ */ jsx("a", { href: "#gallery", className: "inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20", children: "View all photos" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { "aria-label": "At a glance", className: "border-b border-border bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Users, { className: "mx-auto h-6 w-6 text-primary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold text-foreground", children: "Up to 45" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Guests" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Droplets, { className: "mx-auto h-6 w-6 text-primary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold text-foreground", children: "Saltwater" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Heated to 85°F" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Flame, { className: "mx-auto h-6 w-6 text-primary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold text-foreground", children: "Spa included" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Up to 105°F, free" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "mx-auto h-6 w-6 text-primary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-xl font-bold text-foreground", children: "0% host fees (2026)" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Lowest host fee in the market" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { id: "availability", children: /* @__PURE__ */ jsx(AvailabilityCalendar, { listingId: "69ff1cde-1688-41e0-8f27-9bceeb69573b", listingSlug: "la-saltwater-pool-spa", bookingBaseUrl: "https://poolrentalnearme.com", days: 60 }) }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-3xl", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Everything included with your booking" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "No surprise fees. Heat, spa, sound, lighting, and lounge furniture all come standard. Not a single line item to add later." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: INCLUDED.map((a) => {
          const Icon = a.icon;
          return /* @__PURE__ */ jsxs("div", { className: "group flex min-h-[160px] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md", children: [
            /* @__PURE__ */ jsx(Icon, { className: "h-7 w-7 text-primary", "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 text-sm font-semibold text-foreground", children: a.label }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: a.desc })
          ] }, a.label);
        }) })
      ] }),
      /* @__PURE__ */ jsx("section", { id: "gallery", className: "bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Photo gallery" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Tap any photo to view larger." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:hidden", children: GALLERY.map((g, i) => /* @__PURE__ */ jsx("button", { onClick: () => setLightbox(i), className: "relative h-56 w-72 shrink-0 overflow-hidden rounded-xl ring-1 ring-border", children: /* @__PURE__ */ jsx("img", { src: g.src, alt: g.alt, loading: "lazy", className: "h-full w-full object-cover" }) }, i)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 hidden gap-4 sm:block sm:columns-2 lg:columns-3 [&>*]:mb-4", children: GALLERY.map((g, i) => /* @__PURE__ */ jsx("button", { onClick: () => setLightbox(i), className: "block w-full overflow-hidden rounded-xl ring-1 ring-border transition hover:ring-primary", children: /* @__PURE__ */ jsx("img", { src: g.src, alt: g.alt, loading: "lazy", className: "w-full object-cover transition-transform duration-300 hover:scale-[1.02]" }) }, i)) })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-3xl", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Make it unforgettable, add-ons available" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Optional upgrades you can add at booking. Perfect for birthdays, proposals, shoots, and movie nights under the stars." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: ADDONS.map((a) => {
          const Icon = a.icon;
          return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md", children: [
            /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6 text-primary" }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 text-sm font-semibold text-foreground", children: a.label }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: a.desc })
          ] }, a.label);
        }) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Perfect for" }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-wrap gap-2", children: PERFECT_FOR.map((p) => /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground", children: p }, p)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-8 md:grid-cols-2 md:items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "Meet your host" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Quang, interior designer & resort host" }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: `"Hello, I'm Quang. Interior designer who enjoys sharing his little slice of paradise. I can be hospitable and available, or hands-off, whether it's a daytime dip or swimming under the stars."` }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-3 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-xl border border-border bg-card p-4", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "h-5 w-5 shrink-0 text-primary" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-foreground", children: "PRNM Verified" }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Hand-checked by our team" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-xl border border-border bg-card p-4", children: [
              /* @__PURE__ */ jsx(MessageCircle, { className: "h-5 w-5 shrink-0 text-primary" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-foreground", children: "Direct messaging" }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Talk to the host, no middleman" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: "House rules" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Quick read so there are no surprises on the day." }),
          /* @__PURE__ */ jsx("ul", { className: "mt-4 grid gap-2 sm:grid-cols-2", children: HOUSE_RULES.map((r) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-sm text-foreground", children: [
            /* @__PURE__ */ jsx(X, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
            /* @__PURE__ */ jsx("span", { children: r })
          ] }, r)) }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-muted-foreground", children: "Cancellation: free up to 24 hours before reservation start." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Booking on PRNM vs. other platforms" }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-3", children: [{
          label: "Flat host fee",
          prnm: "10%",
          other: "15–30%+"
        }, {
          label: "Direct host messaging",
          prnm: "Yes",
          other: "Limited"
        }, {
          label: "US-based support",
          prnm: "Yes",
          other: "Varies"
        }].map((row) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-foreground", children: row.label }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-primary" }),
            /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
              "PRNM: ",
              row.prnm
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Others: ",
              row.other
            ] })
          ] })
        ] }, row.label)) })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Frequently asked" }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 divide-y divide-border rounded-2xl border border-border bg-card", children: FAQS.map((f) => /* @__PURE__ */ jsxs("details", { className: "group p-5", children: [
          /* @__PURE__ */ jsxs("summary", { className: "flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground sm:text-base", children: [
            f.q,
            /* @__PURE__ */ jsx("span", { className: "ml-4 text-primary transition-transform group-open:rotate-45", children: "+" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: f.a })
        ] }, f.q)) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold sm:text-3xl", children: "Ready to book La Saltwater?" }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base", children: "Free heat, heated spa, Sonos sound, night-swim lighting, fits 45 guests. Check live availability and the host's current rates." }),
        /* @__PURE__ */ jsx("a", { href: BOOK_URL, className: "mt-6 inline-flex items-center justify-center rounded-full bg-background px-6 py-3 text-base font-semibold text-foreground shadow-lg transition-transform hover:scale-[1.02]", children: "Check availability" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-lg backdrop-blur md:hidden", children: /* @__PURE__ */ jsx("a", { href: BOOK_URL, className: "flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow", children: "Check availability — La Saltwater" }) }),
    lightbox !== null && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4", onClick: () => setLightbox(null), children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setLightbox(null), className: "absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20", "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsx("img", { src: GALLERY[lightbox].src, alt: GALLERY[lightbox].alt, className: "max-h-[90vh] max-w-[95vw] rounded-lg object-contain", onClick: (e) => e.stopPropagation() })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  LaSaltwaterPage as component
};
