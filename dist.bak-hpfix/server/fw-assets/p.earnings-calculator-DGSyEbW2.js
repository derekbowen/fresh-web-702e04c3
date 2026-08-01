import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { S as SiteHeader, e as SiteFooter } from "./router-BPpbotmS.js";
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
const PRESETS = {
  "Warm climate (FL/AZ/TX/CA)": {
    rate: 50,
    hpw: 12,
    weeks: 50
  },
  "Sunbelt (GA/NC/SC/NV)": {
    rate: 45,
    hpw: 10,
    weeks: 38
  },
  "Midwest / Northeast": {
    rate: 40,
    hpw: 9,
    weeks: 22
  },
  "Custom": {
    rate: 45,
    hpw: 10,
    weeks: 30
  }
};
const HOST_FEE = 0;
function fmt(n) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}
function EarningsCalculatorPage() {
  const [preset, setPreset] = React.useState("Warm climate (FL/AZ/TX/CA)");
  const [rate, setRate] = React.useState(50);
  const [hpw, setHpw] = React.useState(12);
  const [weeks, setWeeks] = React.useState(50);
  const applyPreset = (key) => {
    setPreset(key);
    const p = PRESETS[key];
    if (p) {
      setRate(p.rate);
      setHpw(p.hpw);
      setWeeks(p.weeks);
    }
  };
  const gross = rate * hpw * weeks;
  const fee = gross * HOST_FEE;
  const net = gross - fee;
  const monthly = net / 12;
  const swimplyFee = gross * 0.15;
  const savedVsSwimply = swimplyFee - fee;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-gradient-to-br from-primary/5 via-background to-background", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl px-4 py-16 sm:py-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: "Free Tool · No Sign-Up" }),
        /* @__PURE__ */ jsxs("h1", { className: "mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: [
          "Pool rental",
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-primary", children: "earnings calculator" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "See exactly what your backyard pool could earn on Pool Rental Near Me. Adjust your hourly rate, weekly bookings, and swim season — get an honest annual estimate with 0% host fees in 2026 — you keep every dollar." })
      ] }) }) }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-6xl px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-5", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 sm:p-8", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Your numbers" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-foreground", children: "Climate preset" }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: Object.keys(PRESETS).map((k) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => applyPreset(k), className: "rounded-full border px-3 py-1.5 text-xs font-medium transition " + (preset === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"), children: k }, k)) })
          ] }),
          /* @__PURE__ */ jsx(Slider, { label: "Hourly rate", value: rate, min: 20, max: 150, step: 5, unit: "$/hr", onChange: (v) => {
            setRate(v);
            setPreset("Custom");
          }, hint: "Most pools charge $35–$75/hr. High-amenity pools (hot tub, slide, pool house) charge $80+." }),
          /* @__PURE__ */ jsx(Slider, { label: "Hours booked per week", value: hpw, min: 1, max: 40, step: 1, unit: "hrs", onChange: (v) => {
            setHpw(v);
            setPreset("Custom");
          }, hint: "Active hosts average 8–15 hours/week. Weekend-heavy bookings are normal." }),
          /* @__PURE__ */ jsx(Slider, { label: "Swim season length", value: weeks, min: 8, max: 52, step: 1, unit: "weeks/yr", onChange: (v) => {
            setWeeks(v);
            setPreset("Custom");
          }, hint: "FL/AZ ≈ 50 weeks · TX/CA ≈ 40 · GA/NC ≈ 30 · Midwest/NE ≈ 18–22." })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-24 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border-2 border-primary bg-primary/5 p-6", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "Your estimated take-home" }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 text-5xl font-bold tracking-tight text-foreground", children: [
              fmt(net),
              /* @__PURE__ */ jsx("span", { className: "text-base font-medium text-muted-foreground", children: "/yr" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
              "≈ ",
              fmt(monthly),
              "/mo · 0% host fees in 2026"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 text-sm", children: [
            /* @__PURE__ */ jsx(Row, { label: "Gross bookings", value: fmt(gross) }),
            /* @__PURE__ */ jsx(Row, { label: "PRNM host fee (0% in 2026)", value: `− ${fmt(fee)}`, muted: true }),
            /* @__PURE__ */ jsx("div", { className: "my-3 border-t border-border" }),
            /* @__PURE__ */ jsx(Row, { label: "Net to you", value: fmt(net), bold: true }),
            /* @__PURE__ */ jsx("div", { className: "my-3 border-t border-dashed border-border" }),
            /* @__PURE__ */ jsx(Row, { label: "Same bookings on Swimply (15%)", value: fmt(gross - swimplyFee), muted: true }),
            /* @__PURE__ */ jsx(Row, { label: "You keep more with PRNM", value: `+ ${fmt(savedVsSwimply)}`, accent: true })
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/p/hosting", className: "block rounded-full bg-primary px-6 py-3 text-center text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90", children: "List your pool — start earning →" }),
          /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-muted-foreground", children: "Free to list · $2M liability included · Payouts in 24 hrs" })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Average host earnings", value: "$8,400/yr" }),
        /* @__PURE__ */ jsx(Stat, { label: "Top-quartile hosts (warm states)", value: "$22k+/yr" }),
        /* @__PURE__ */ jsx(Stat, { label: "Liability coverage on every booking", value: "$2M" })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-3xl px-4 py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground", children: "Honest answers about pool rental income" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-6", children: [
          /* @__PURE__ */ jsx(Faq, { q: "Are these numbers realistic?", a: "Yes — they're based on actual host data. The calculator is intentionally conservative on hours/week. A single 4-hour weekend booking at $50/hr puts you at $200; doing that twice a week for a 30-week season is $12,000 gross." }),
          /* @__PURE__ */ jsx(Faq, { q: "Is there really a 0% host fee in 2026?", a: "Payment processing, $2M liability insurance per booking, guest screening, the booking platform, customer support, and marketing that drives renters to your listing. There are no other fees — no listing fee, no monthly subscription, no per-photo charge." }),
          /* @__PURE__ */ jsx(Faq, { q: "How do I increase my hourly rate?", a: "The biggest levers are amenities (hot tub, pool house, BBQ, restroom access), professional photos, and fast response time. Pools with 10+ photos and a 5-star rating routinely charge $20–$40/hr more than baseline." }),
          /* @__PURE__ */ jsx(Faq, { q: "What about taxes?", a: "Pool rental income is reported on Schedule E (rental) or Schedule C (active business). PRNM issues a 1099-K each January. You can typically deduct a portion of pool maintenance, utilities, insurance, and depreciation — talk to a CPA for your situation." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-12 rounded-2xl border border-border bg-card p-8 text-center", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground", children: "Ready to turn your pool into income?" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Setup takes about 15 minutes. Most hosts get their first booking within 10 days." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-3", children: [
            /* @__PURE__ */ jsx(Link, { to: "/p/hosting", className: "rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90", children: "Become a host" }),
            /* @__PURE__ */ jsx(Link, { to: "/p/free-host-tools", className: "rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted", children: "Free host tools" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  hint,
  onChange
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between", children: [
      /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground", children: label }),
      /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-primary", children: [
        value.toLocaleString(),
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: unit })
      ] })
    ] }),
    /* @__PURE__ */ jsx("input", { type: "range", min, max, step, value, onChange: (e) => onChange(Number(e.target.value)), className: "mt-2 w-full accent-primary" }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { children: min }),
      /* @__PURE__ */ jsx("span", { children: max })
    ] }),
    hint && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: hint })
  ] });
}
function Row({
  label,
  value,
  bold,
  muted,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between py-1", children: [
    /* @__PURE__ */ jsx("span", { className: muted ? "text-muted-foreground" : accent ? "font-medium text-primary" : "text-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: (bold ? "text-lg font-bold " : "font-medium ") + (accent ? "text-primary" : "text-foreground"), children: value })
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold tracking-tight text-foreground", children: value }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: label })
  ] });
}
function Faq({
  q,
  a
}) {
  return /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border border-border bg-card p-5 open:border-primary/40", children: [
    /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer list-none text-base font-semibold text-foreground", children: [
      /* @__PURE__ */ jsx("span", { className: "mr-2 text-primary group-open:hidden", children: "+" }),
      /* @__PURE__ */ jsx("span", { className: "mr-2 hidden text-primary group-open:inline", children: "−" }),
      q
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: a })
  ] });
}
export {
  EarningsCalculatorPage as component
};
