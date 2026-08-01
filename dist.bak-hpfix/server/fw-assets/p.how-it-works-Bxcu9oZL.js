import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, a4 as Breadcrumbs, ab as PATH, ac as STEPS, ad as FAQS, e as SiteFooter } from "./router-BPpbotmS.js";
import { CheckCircle2, Lock, ShieldCheck, Star, Headphones, CloudRain, AlertTriangle, PhoneCall, PartyPopper, Users, Camera, Flame, HeartPulse, Dumbbell } from "lucide-react";
import "@tanstack/react-router";
import "react";
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
const heroImage = "/fw-assets/how-it-works-hero-Duw7nI1j.jpg";
const INCLUDED = [{
  icon: Lock,
  title: "Secure online payment",
  body: "All payments run through PCI-compliant rails (Stripe). Funds are held until your booking is complete, then released to the host within 24 hours. Your card details never touch the host's phone."
}, {
  icon: ShieldCheck,
  title: "Up to $2M liability protection",
  body: "Every booking is automatically protected by up to $2 million in third-party liability insurance, covering both the host's property and guests during the rental window. No extra cost, no add-ons."
}, {
  icon: Star,
  title: "Host-verified listings + real reviews",
  body: "Every pool is reviewed by our team before going live. Listings show real guest reviews — not stock content — so you know what to expect before you book."
}, {
  icon: Headphones,
  title: "24/7 support team",
  body: "Real humans available 24/7 by chat, email, or phone (1-888-940-4247). Issue at the pool? Late host arrival? Weather concern? We're on it."
}];
const TROUBLE = [{
  icon: CloudRain,
  title: "It rains or the weather turns",
  body: "Cancel for a full refund up to 24 hours before your booking starts on flexible listings. Day-of cancellations on flexible listings get 50% refunded. Strict listings have stricter rules — always shown on the listing page before you book."
}, {
  icon: AlertTriangle,
  title: "The pool isn't as described",
  body: "Show up, see the pool, take photos. If it's dirty, unsafe, or not as advertised, contact our 24/7 support BEFORE you start your swim. We'll help you find another pool nearby OR refund your booking in full. Hosts who fail repeatedly get removed."
}, {
  icon: PhoneCall,
  title: "The host doesn't show or won't respond",
  body: "Most hosts auto-approve bookings and send check-in info immediately. If you're locked out at your booking time, call our 24/7 support line (1-888-940-4247). We can reach the host directly, and if they don't respond, you get a full refund + help finding an alternative pool."
}];
const USE_CASES = [{
  icon: PartyPopper,
  title: "Birthdays & parties",
  desc: "Rent the whole backyard for the afternoon.",
  href: "/s?keyword=party"
}, {
  icon: Users,
  title: "Quiet family swims",
  desc: "Skip crowded public pools. 2-hour bookings under $100 in most cities.",
  href: "/s"
}, {
  icon: Camera,
  title: "Photoshoots & content",
  desc: "Photographers and creators book private pools by the hour for shoots.",
  href: "/s?keyword=photoshoot"
}, {
  icon: Flame,
  title: "Hot tub nights",
  desc: "Heated pool, hot tub, fire pit. Filter for properties that have all three.",
  href: "/amenity/hot-tub"
}, {
  icon: HeartPulse,
  title: "Pool therapy & rehab",
  desc: "Warm-water pools by the hour for swim therapy, aquatic rehab, and seniors.",
  href: "/s?keyword=therapy"
}, {
  icon: Dumbbell,
  title: "Group fitness",
  desc: "Aqua aerobics, swim team practice, and personal training in private pools.",
  href: "/s?keyword=fitness"
}];
function HowItWorksPage() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 pb-20 sm:pb-0", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-border", children: [
        /* @__PURE__ */ jsx("img", { src: heroImage, alt: "Private backyard pool with rock waterfall, slide, and grotto at sunset", className: "absolute inset-0 h-full w-full object-cover", loading: "eager", fetchPriority: "high" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-black/70" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8", children: [
          /* @__PURE__ */ jsx("div", { className: "[&_*]:!text-white/90 flex justify-center", children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
            name: "Home",
            path: "/"
          }, {
            name: "How It Works",
            path: PATH
          }] }) }),
          /* @__PURE__ */ jsx("p", { className: "mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/90", children: "How it works" }),
          /* @__PURE__ */ jsxs("h1", { className: "mt-3 text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl", children: [
            "Book a private pool by the hour.",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-white/90", children: "No memberships. No surprises." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-white/90 drop-shadow sm:text-xl", children: "Pool Rental Near Me lets you rent private backyard pools by the hour for parties, family swims, photoshoots, or a quiet afternoon. Every booking is paid securely and protected by up to $2 million in liability insurance." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap justify-center gap-3", children: [
            /* @__PURE__ */ jsx("a", { href: "/s", className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90", children: "Find a pool near you" }),
            /* @__PURE__ */ jsx("a", { href: "#included", className: "inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20", children: "See what's included" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 text-left text-sm text-white sm:grid-cols-4 sm:text-center", children: ["Verified hosts and real reviews", "$2M liability per booking", "Secure online payment", "24/7 support team"].map((t) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 sm:flex-col sm:items-center", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 shrink-0 text-white" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: t })
          ] }, t)) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Book a pool in 3 steps" }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground", children: "No memberships. No crowded public pools. No scheduling headaches." }),
        /* @__PURE__ */ jsx("ol", { className: "mt-10 grid gap-6 sm:grid-cols-3", children: STEPS.map((s, i) => /* @__PURE__ */ jsxs("li", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground", children: i + 1 }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold text-foreground", children: s.name }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: s.text })
        ] }, s.name)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 flex justify-center", children: /* @__PURE__ */ jsx("a", { href: "/s", className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90", children: "Find a pool near you →" }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { id: "included", className: "bg-accent/40 border-y border-border scroll-mt-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "What's included in every booking" }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-6 sm:grid-cols-2", children: INCLUDED.map(({
          icon: Icon,
          title,
          body
        }) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-background p-6 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold text-foreground", children: title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: body })
        ] }, title)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "What you'll actually pay" }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground", children: "No memberships. No hidden fees. The price you see at checkout is the price you pay." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 grid gap-8 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: "Your booking total" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "Sample 3-hour booking, 6 guests" }),
              /* @__PURE__ */ jsxs("dl", { className: "mt-4 space-y-2 font-mono text-sm text-foreground", children: [
                /* @__PURE__ */ jsx(Row, { label: "Hourly rate × 3 hours", value: "$180.00" }),
                /* @__PURE__ */ jsx(Row, { label: "Cleaning fee", value: "$25.00" }),
                /* @__PURE__ */ jsx(Row, { label: "Extra-guest fee (2 over base)", value: "$20.00" }),
                /* @__PURE__ */ jsx("div", { className: "my-2 border-t border-border" }),
                /* @__PURE__ */ jsx(Row, { label: "Subtotal", value: "$225.00" }),
                /* @__PURE__ */ jsx(Row, { label: "PRNM guest service fee", value: "At checkout" }),
                /* @__PURE__ */ jsx("div", { className: "my-2 border-t border-border" }),
                /* @__PURE__ */ jsx(Row, { label: "Total you pay", value: "Shown at checkout", bold: true })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: "Every fee is shown upfront before you confirm. You'll never see a charge that wasn't on the booking page." })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: "What the guest service fee covers" }),
            /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-relaxed text-muted-foreground", children: "A guest service fee is added to your booking subtotal at checkout. It covers payment processing, the $2M insurance policy on every booking, our 24/7 support team, and the verification process that keeps bad listings off the platform. Hosts keep 100% of their rate — 0% host fees through 2026." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm text-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Compare:" }),
              " Swimply charges guests 9–13% per booking (varies, not always shown upfront) plus charges hosts 15–30%. Our flat 10/10 is the most transparent in the industry."
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-muted/40 border-y border-border", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "What if something goes wrong?" }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground", children: "Things happen. Here's exactly what we do about it." }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-3", children: TROUBLE.map(({
          icon: Icon,
          title,
          body
        }) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-background p-6 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold text-foreground", children: title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: body })
        ] }, title)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 flex justify-center", children: /* @__PURE__ */ jsx("a", { href: "/p/learningacademy", className: "inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted", children: "Read full cancellation policies →" }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "What people book pools for" }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3", children: USE_CASES.map(({
          icon: Icon,
          title,
          desc,
          href
        }) => /* @__PURE__ */ jsxs("a", { href, className: "group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-md", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-base font-semibold text-foreground group-hover:text-primary", children: title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: desc }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm font-semibold text-primary", children: "Find one near you →" })
        ] }, title)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-muted/40 border-y border-border", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsx("dl", { className: "mt-10 space-y-3", children: FAQS.map((f) => /* @__PURE__ */ jsxs("details", { className: "group rounded-2xl border border-border bg-background p-5 [&_summary::-webkit-details-marker]:hidden", children: [
          /* @__PURE__ */ jsxs("summary", { className: "flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-foreground", children: [
            f.q,
            /* @__PURE__ */ jsx("span", { className: "text-2xl leading-none text-primary transition group-open:rotate-45", children: "+" })
          ] }),
          /* @__PURE__ */ jsx("dd", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: f.a })
        ] }, f.q)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-primary", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl", children: "Ready for your swim?" }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90", children: "Search private pools near you. Book in under 5 minutes. Show up and dive in." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap justify-center gap-3", children: [
          /* @__PURE__ */ jsx("a", { href: "/s", className: "inline-flex items-center justify-center rounded-full bg-background px-6 py-3 text-base font-semibold text-primary shadow-lg transition hover:bg-background/90", children: "Find a pool near you" }),
          /* @__PURE__ */ jsx("a", { href: "/p/hosting", className: "inline-flex items-center justify-center rounded-full border border-primary-foreground/40 bg-transparent px-6 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/10", children: "Have a pool? List it →" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 py-3 shadow-lg sm:hidden", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: "Ready to book?" }),
      /* @__PURE__ */ jsx("a", { href: "/s", className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow", children: "Find a pool near you" })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Row({
  label,
  value,
  bold
}) {
  return /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between ${bold ? "font-bold text-foreground" : ""}`, children: [
    /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("dd", { children: value })
  ] });
}
export {
  HowItWorksPage as component
};
