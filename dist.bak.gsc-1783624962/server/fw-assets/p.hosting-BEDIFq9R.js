import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, t as heroImage, ae as ACADEMY_HREF, af as FAQS, e as SiteFooter } from "./router-Bw8GQi9C.js";
import { useRef, useState, useEffect, useMemo } from "react";
import { Check, DollarSign, ShieldCheck, FileCheck, GraduationCap, Users, AlertCircle, Home, GitBranch, Camera, Plus } from "lucide-react";
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
import "./client-Dh5RMKgP.js";
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
const CONNECT_HREF = "https://connect.poolrentalnearme.com/community/welcome";
const STEPS = [{
  n: "1",
  title: "List your pool in 15 minutes",
  body: "Photos, hourly rate, availability calendar, house rules. Our team reviews every pool before it goes live. Want help pricing? Take the free 15-minute pricing strategy class in Pool Host Academy first."
}, {
  n: "2",
  title: "Approve bookings on your schedule",
  body: "You stay in full control. Auto-approve trusted guests or review every request. Block off dates, raise prices on holidays, set group size limits. Our free “Difficult Guest Scenarios” course preps you for every edge case."
}, {
  n: "3",
  title: "Get paid in 24 hours",
  body: "We process your payout within 24 hours of each booking ending. Most banks deposit it 1–3 business days later. Swimply takes 48 hours just to start, then 3–7 more days. We handle payments, taxes (1099-K), and guest messaging. You just host."
}];
const REASONS = [{
  icon: DollarSign,
  title: "Keep 100% — 0% host fees in 2026",
  body: "We charge a flat 0% through 2026 — you keep 100%. Swimply charges 15% to 30% per booking depending on which pricing structure you use. On a $1,000 weekend, you keep the full $1,000 with us versus $700–$850 with them. Over a season, that's thousands in your pocket instead of theirs."
}, {
  icon: ShieldCheck,
  title: "$2M liability on every booking",
  body: "Every booking is automatically protected by up to $2 million in third-party liability insurance, included on every booking. No add-ons, no separate premium. Swimply's protection is $1M."
}, {
  icon: FileCheck,
  title: "One predictable fee, every booking",
  body: "Swimply charges 15–30% per booking, depending on pricing structure, guest count, and booking type. We charge 0% through all of 2026. You can do the math in your head before you accept a request."
}, {
  icon: GraduationCap,
  title: "135 free classes on hosting",
  body: "Pool Host Academy is the only training platform built specifically for pool hosts. 135 video lessons covering pricing strategy, guest screening, insurance, taxes, marketing, holiday upcharges, and difficult-guest scenarios. 100% free, English and Spanish, host certifications you can share. Swimply has webinars. We built a real curriculum.",
  cta: {
    label: "Browse 135 free classes →",
    href: ACADEMY_HREF
  }
}, {
  icon: Users,
  title: "A real host community, not a Facebook group",
  body: "PRNM Connect is our private community board for hosts only. Local SEO playbooks, pricing strategy threads, guest-from-hell stories, and direct lines to other hosts in your market. Search it, post in it, learn from hosts who are 6 months ahead of you. Swimply has a Facebook group — we built a purpose-built tool.",
  cta: {
    label: "Visit PRNM Connect →",
    href: CONNECT_HREF
  }
}];
const COURSES = [{
  icon: ShieldCheck,
  title: "Water Rescue Equipment",
  desc: "Life ring vs shepherd's hook — when to use each, and where to mount them."
}, {
  icon: AlertCircle,
  title: "Managing Police Intervention",
  desc: "Blue lights in the driveway — what to say, what to do, what your guests should do."
}, {
  icon: Home,
  title: "Neighbor Complaints in Real Time",
  desc: "Defuse problems before they become 911 calls. Scripts, scenarios, and how to keep your HOA on your side."
}, {
  icon: GitBranch,
  title: "Multi-Platform Hosting",
  desc: "Cross-list on PRNM, Swimply, and Peerspace without double-bookings. The exact workflow."
}, {
  icon: DollarSign,
  title: "Pricing Strategy",
  desc: "Set rates that maximize bookings without leaving money on the table. Holiday upcharges included."
}, {
  icon: Camera,
  title: "Creating Content the Easy Way",
  desc: "Photos and videos that book pools fast — even if you've never touched a camera."
}];
const COMPARE = [["Host service fee", "15–30% (varies)", "0% (through 2026)"], ["Hosts keep", "70–85%", "100%"], ["Liability coverage", "$1,000,000", "$2,000,000"], ["Payout speed", "48 hr + 3–7 days to bank", "24 hr + 1–3 days to bank"], ["Fee predictability", "Varies by tier", "0% through 2026"], ["Host education", "Webinars, help articles", "135 free classes (Pool Host Academy)"], ["Host community", "Facebook group", "Private board (PRNM Connect)"], ["Listing fee", "Free", "Free"]];
const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});
function HostingPage() {
  const calcRef = useRef(null);
  const heroRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const obs = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), {
      rootMargin: "0px 0px -20% 0px"
    });
    obs.observe(heroEl);
    return () => obs.disconnect();
  }, []);
  const scrollToCalc = () => {
    calcRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("section", { ref: heroRef, className: "bg-sky-50", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-primary", children: "For Pool Owners" }),
          /* @__PURE__ */ jsx("h1", { className: "mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl", children: "Turn your pool into income — and keep more of it." }),
          /* @__PURE__ */ jsx("p", { className: "mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl", children: "Swimply's host fee runs 15% to 30% per booking. Ours is 0% through all of 2026. Plus $2M coverage versus their $1M, money in your bank 4–7 days faster, and 135 free classes on hosting. No other platform does that." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx("a", { href: LIST_HREF, className: "inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90", children: "List my pool — it's free" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: scrollToCalc, className: "inline-flex items-center justify-center rounded-full border border-border bg-background px-7 py-3.5 text-base font-semibold text-foreground transition hover:bg-muted", children: "Estimate my earnings" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "mt-8 grid grid-cols-2 gap-3 text-sm text-foreground sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2", children: ["Free to list", "0% host fees through 2026", "$2M liability per booking", "135 free classes"].map((t) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 shrink-0 text-primary" }),
            /* @__PURE__ */ jsx("span", { children: t })
          ] }, t)) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Connect with other pool hosts" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm text-muted-foreground", children: "Join our private Facebook group of 130+ hosts for pricing tips, hosting advice, and support." }),
            /* @__PURE__ */ jsx("a", { href: "https://www.facebook.com/groups/poolrentalnearme/", target: "_blank", rel: "noopener", className: "mt-3 inline-flex items-center text-sm font-semibold text-primary hover:underline", children: "Join the Group →" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("img", { src: heroImage, alt: "Backyard swimming pool at golden hour with lounger in the foreground", width: 1200, height: 900, className: "aspect-[4/3] w-full rounded-3xl object-cover shadow-xl", loading: "eager" }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { id: "calculator", ref: calcRef, className: "bg-background py-20 scroll-mt-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-3xl", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "How much can you actually earn?" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg text-muted-foreground", children: "Adjust the sliders. We'll show you what you'd take home on PRNM versus Swimply's 15–30% range." })
        ] }),
        /* @__PURE__ */ jsx(EarningsCalc, {})
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-muted/40 py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "How it works" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-3xl text-lg text-muted-foreground", children: "Three steps. Most hosts go from signup to first booking in under a week — and our free classes help you charge more from day one." }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-3", children: STEPS.map((s) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-7 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground", children: s.n }),
          /* @__PURE__ */ jsx("h3", { className: "mt-5 text-lg font-semibold text-foreground", children: s.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: s.body })
        ] }, s.n)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-background py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Five reasons hosts switch from Swimply" }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-3 md:[&>*:nth-child(4)]:col-start-1 md:[&>*:nth-child(4)]:col-end-3 md:[&>*:nth-child(5)]:col-start-3 lg:[&>*:nth-child(4)]:col-start-1 lg:[&>*:nth-child(4)]:col-end-2 lg:[&>*:nth-child(5)]:col-start-2 lg:[&>*:nth-child(5)]:col-end-3", children: REASONS.map((r) => {
          const Icon = r.icon;
          return /* @__PURE__ */ jsxs("div", { className: "flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsx("h3", { className: "mt-5 text-lg font-semibold text-foreground", children: r.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 flex-1 text-sm leading-relaxed text-muted-foreground", children: r.body }),
            r.cta && /* @__PURE__ */ jsx("a", { href: r.cta.href, className: "mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline", children: r.cta.label })
          ] }, r.title);
        }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-amber-50/60 py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "135 free classes. Built for pool hosts." }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-4 max-w-3xl text-lg text-muted-foreground", children: "No other platform teaches you how to host. We do — and we don't charge for it. No signup required." }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground", children: "Sample categories" }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-5 grid-cols-2 lg:grid-cols-3 text-left", children: COURSES.map((c) => {
          const Icon = c.icon;
          return /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl border border-border bg-card p-5 shadow-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground", children: "Free" }),
            /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsx("h3", { className: "mt-4 text-base font-semibold text-foreground", children: c.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm text-muted-foreground", children: c.desc })
          ] }, c.title);
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 flex flex-col items-center", children: [
          /* @__PURE__ */ jsx("a", { href: ACADEMY_HREF, className: "inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90", children: "Browse all 135 free classes →" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "100% free. No signup required. English & español." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-sky-50/60 py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Pool Rental Near Me vs. Swimply" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm italic text-muted-foreground", children: "Numbers from Swimply's own help docs and hosting page. Verified May 2026." }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-5 py-3 text-left font-semibold text-foreground", children: "Feature" }),
            /* @__PURE__ */ jsx("th", { className: "px-5 py-3 text-left font-semibold text-muted-foreground", children: "Swimply" }),
            /* @__PURE__ */ jsx("th", { className: "px-5 py-3 text-left font-semibold text-primary", children: "PRNM" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: COMPARE.map(([label, sw, prnm]) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "px-5 py-4 font-medium text-foreground", children: label }),
            /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-muted-foreground", children: sw }),
            /* @__PURE__ */ jsx("td", { className: "px-5 py-4 font-semibold text-primary", children: prnm })
          ] }, label)) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 space-y-4 md:hidden", children: COMPARE.map(([label, sw, prnm]) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5 shadow-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: label }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-2 gap-3 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Swimply" }),
              /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-muted-foreground", children: sw })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-primary", children: "PRNM" }),
              /* @__PURE__ */ jsx("p", { className: "mt-0.5 font-semibold text-primary", children: prnm })
            ] })
          ] })
        ] }, label)) }),
        /* @__PURE__ */ jsx("p", { className: "mt-6 text-xs italic text-muted-foreground", children: "Sources: swimply.com/become-a-host, Swimply Help Center (Pricing Structure article), and Pool Rental Near Me commission settings. Verified May 2026." })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-background py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Got questions? Here's all the answers." }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 space-y-3", children: FAQS.map((f) => /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden", children: [
          /* @__PURE__ */ jsxs("summary", { className: "flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: f.q }),
            /* @__PURE__ */ jsx(Plus, { className: "h-5 w-5 shrink-0 text-primary transition group-open:rotate-45" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: "node" in f && f.node ? f.node : f.a })
        ] }, f.q)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border bg-background py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Free host tools" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-muted-foreground", children: "Everything you need to price, list, protect, and market your pool — free for Pool Rental Near Me hosts." }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [{
          href: "/p/start-hosting",
          title: "Start hosting",
          body: "Earn $1,500–$8,000/month — 0% host fees in 2026, $2M coverage."
        }, {
          href: "/p/ai-listing-generator",
          title: "AI listing generator",
          body: "Upload one photo, get a booking-ready listing draft."
        }, {
          href: "/p/pool-heating-cost-calculator",
          title: "Pool heating cost calculator",
          body: "Gas vs heat pump vs solar — monthly run-cost and payback."
        }, {
          href: "/p/pool-rules-generator",
          title: "Pool rules generator",
          body: "Printable house rules tuned to your pool — in 60 seconds."
        }, {
          href: "/p/waiver-generator",
          title: "Waiver generator",
          body: "Digital liability waiver every guest signs on their phone."
        }, {
          href: "/p/host-marketing-playbook",
          title: "Host marketing playbook",
          body: "Flyers, social templates, seasonal campaigns."
        }, {
          href: "/p/earnings-calculator",
          title: "Earnings calculator",
          body: "See what your pool can earn by city and season."
        }, {
          href: "/p/free-host-tools",
          title: "All free host tools",
          body: "Pricing, calendar, screening, payouts, tax reports."
        }].map((t) => /* @__PURE__ */ jsxs("a", { href: t.href, className: "rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-base font-semibold text-foreground", children: [
            t.title,
            " →"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: t.body })
        ] }, t.href)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border bg-background py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Pool hosting: flexible income from home" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-muted-foreground", children: "Think of pool hosting as a flexible job you run from home — you set your hours, keep 100% with 0% host fees through 2026, and only work the bookings you accept. Go deeper with these host guides:" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-6 grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { className: "font-semibold text-primary hover:underline", href: "/p/learningacademy", children: "Free Pool Host Academy — training to earn from your pool" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { className: "font-semibold text-primary hover:underline", href: "/p/pool-rental-host-fees-compared", children: "Pool rental host fees compared: Swimply vs PRNM (0% fees)" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { className: "font-semibold text-primary hover:underline", href: "/p/why-hosts-are-leaving-swimply", children: "Why hosts are leaving Swimply in 2026" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { className: "font-semibold text-primary hover:underline", href: "/p/insurance-guide-for-pool-owners", children: "Pool rental insurance guide for hosts" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { className: "font-semibold text-primary hover:underline", href: "/p/howtoturnyourbackyardpoolintoabusinessasset", children: "Turn your backyard pool into a business asset" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-primary py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl", children: "Ready to keep more of your money?" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-primary-foreground/90", children: "Free to list. Free 135 classes. No monthly fees. Be live in 15 minutes. We review every pool to keep quality high." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap justify-center gap-3", children: [
          /* @__PURE__ */ jsx("a", { href: LIST_HREF, className: "inline-flex items-center justify-center rounded-full bg-background px-7 py-3.5 text-base font-semibold text-primary shadow-lg transition hover:bg-background/90", children: "List my pool — it's free" }),
          /* @__PURE__ */ jsx("a", { href: "/p/affiliate", className: "inline-flex items-center justify-center rounded-full border border-primary-foreground/60 bg-transparent px-7 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/10", children: "Refer a host (earn $50)" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { "aria-hidden": !showStickyBar, className: `fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-200 lg:hidden ${showStickyBar ? "translate-y-0" : "translate-y-full"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: "Ready to start earning?" }),
      /* @__PURE__ */ jsx("a", { href: LIST_HREF, className: "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow", children: "List my pool" })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function EarningsCalc() {
  const [rate, setRate] = useState(65);
  const [bookings, setBookings] = useState(4);
  const [hours, setHours] = useState(3);
  const [season, setSeason] = useState(6);
  const {
    grossMonthly,
    prnm,
    swimplyBest,
    swimplyWorst,
    monthlyDiffMax,
    annualDiffMax
  } = useMemo(() => {
    const monthlyHours = bookings * hours * 4.33;
    const gross = monthlyHours * rate;
    const prnmTake = gross * 0.9;
    const swBest = gross * 0.85;
    const swWorst = gross * 0.7;
    const diffMax = prnmTake - swWorst;
    return {
      grossMonthly: gross,
      prnm: prnmTake,
      swimplyBest: swBest,
      swimplyWorst: swWorst,
      monthlyDiffMax: diffMax,
      annualDiffMax: diffMax * season
    };
  }, [rate, bookings, hours, season]);
  return /* @__PURE__ */ jsxs("div", { className: "mt-10 grid gap-8 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-7 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
      /* @__PURE__ */ jsx(Slider, { label: "Your hourly rate", value: rate, min: 20, max: 200, step: 5, display: `$${rate}/hr`, helper: "Most pools rent for $50–$125/hr. Premium backyards with hot tubs go higher.", onChange: setRate }),
      /* @__PURE__ */ jsx(Slider, { label: "Bookings per week", value: bookings, min: 0, max: 20, step: 1, display: `${bookings} ${bookings === 1 ? "booking" : "bookings"}`, helper: "Active pools in busy markets average 6–10 weekend bookings.", onChange: setBookings }),
      /* @__PURE__ */ jsx(Slider, { label: "Hours per booking", value: hours, min: 1, max: 8, step: 0.5, display: `${hours} ${hours === 1 ? "hour" : "hours"}`, helper: "Most bookings are 2–4 hours. Birthday parties and family days run longer.", onChange: setHours }),
      /* @__PURE__ */ jsx(Slider, { label: "Active season", value: season, min: 3, max: 12, step: 1, display: `${season} months`, helper: "Year-round in CA, FL, TX, AZ. Shorter elsewhere unless you're heated.", onChange: setSeason })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "Gross monthly bookings" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-4xl font-bold text-foreground", children: fmt.format(grossMonthly) }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "rate × bookings/wk × hours × 4.33" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "my-6 h-px bg-border" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-primary", children: "Your monthly income on PRNM" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-5xl font-extrabold text-primary", children: fmt.format(prnm) }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "100% of gross — 0% PRNM host fees through 2026" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs italic text-muted-foreground", children: "Plus a guest service fee applies at checkout. We never touch your share." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "my-6 h-px bg-border" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "What you'd take home on Swimply" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-3xl font-bold text-muted-foreground", children: [
            fmt.format(swimplyWorst),
            " – ",
            fmt.format(swimplyBest)
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "70–85% of gross — Swimply's host fee runs 15% to 30% per booking" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive", children: [
            "Up to ",
            fmt.format(monthlyDiffMax),
            " less per month with Swimply. Up to ",
            fmt.format(annualDiffMax),
            " less per year."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: LIST_HREF, className: "inline-flex w-full items-center justify-center rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90", children: [
        "Start earning ",
        fmt.format(prnm),
        "/month →"
      ] })
    ] })
  ] });
}
function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  helper,
  onChange
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
      /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-foreground", children: label }),
      /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-primary", children: display })
    ] }),
    /* @__PURE__ */ jsx("input", { type: "range", min, max, step, value, onChange: (e) => onChange(Number(e.target.value)), className: "mt-3 w-full accent-primary", "aria-label": label }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs leading-relaxed text-muted-foreground", children: helper })
  ] });
}
export {
  HostingPage as component
};
