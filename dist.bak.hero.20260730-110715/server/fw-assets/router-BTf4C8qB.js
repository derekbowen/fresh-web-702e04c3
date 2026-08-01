import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { createRootRoute, Link, useRouterState, HeadContent, Scripts, Outlet, createFileRoute, lazyRouteComponent, redirect, notFound, createRouter, useRouter } from "@tanstack/react-router";
import * as React from "react";
import { useEffect, useState, Suspense, lazy, Component } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { D as DEFAULT_FOOTER } from "./site-footer-defaults-asWdr-hi.js";
import { c as createSsrRpc, g as getCityBySlug } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { P as PROD_ORIGIN, g as getCanonicalOrigin, a as absUrl } from "./site-origin-DalDu5p3.js";
import { c as cityForContentPage, p as parseCitySlug$1 } from "./city-slug-Bqls2qOy.js";
import { zodValidator } from "@tanstack/zod-adapter";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { s as sendTransactionalEmailServer, T as TEMPLATES } from "./transactional-email.server-BoL6nxoQ.js";
import { Droplets, Flame, Music, Moon, Bath, Trees, Wifi, Car } from "lucide-react";
import { s as stateName } from "./states-UIdvqlKs.js";
import { createClient } from "@supabase/supabase-js";
import { s as slugSchema, l as listSchema } from "./courses.server-Bfz1suZ4.js";
import { verifyWebhookRequest, WebhookError } from "@lovable.dev/webhooks-js";
import { createHmac, timingSafeEqual } from "crypto";
import { render } from "@react-email/components";
import { s as sendViaEmailit } from "./emailit-DRsipvVx.js";
import { parseEmailWebhookPayload } from "@lovable.dev/email-js";
import { R as ReauthenticationEmail, E as EmailChangeEmail, a as RecoveryEmail, M as MagicLinkEmail, I as InviteEmail, S as SignupEmail } from "./reauthentication-CCohUDQL.js";
import { createHmac as createHmac$1, timingSafeEqual as timingSafeEqual$1 } from "node:crypto";
import { t as toE164, r as recordOptOut, a as recordOptIn, i as isOptedOut, s as sendSms } from "./sms.server-BJah3xxU.js";
import { syncSharetribeMirror } from "./sharetribe-mirror.server-D8Jwl9-L.js";
import { r as runListingSync } from "./listing-sync.server-C2GpYdIM.js";
import { integrationGet } from "./sharetribe.server-BZ7y3aGI.js";
import { sendDueEmails, pollSharetribeRenters } from "./renter-drip.server-C0Ma8t5O.js";
import { sendDueHostEmails, pollSharetribeHosts, enrollNewSignups } from "./host-drip.server-DDQBE_qt.js";
import { runIgLeadHunt } from "./ig-lead-hunter.server-BzgLZUba.js";
import { r as runGscSync } from "./gsc-sync.server-BxVUz4Yz.js";
import { p as processFollowupReminders } from "./followup-reminders.server-cq9Qg0-p.js";
import { runBlogAutogen } from "./blog-autogen.server-CC6RPtlf.js";
import { runAutoOutreach } from "./auto-outreach.server-DLLupcxB.js";
import { r as runAliasBackfill } from "./alias-backfill.server-CG8T_N6R.js";
import { A as ACADEMY_SLUGS, c as classifyAcademyHealth, a as ACADEMY_OCCASION_SLUGS, b as ACADEMY_HUB_SLUGS$1 } from "./academy-config-B5vgptOj.js";
const appCss = "/fw-assets/styles-pkvt8rdC.css";
const fredAvatar = "/fw-assets/fred-avatar-BeNG4olQ.png";
const logoUrl = "/fw-assets/logo-CvU4wdQN.png";
const FOOTER_YEAR = 2026;
const GlobalChromeContext = React.createContext(false);
const FooterDataContext = React.createContext(DEFAULT_FOOTER);
function GlobalChromeProvider({ children }) {
  return /* @__PURE__ */ jsx(GlobalChromeContext.Provider, { value: true, children });
}
function ShowChromeOverride({ children }) {
  return /* @__PURE__ */ jsx(GlobalChromeContext.Provider, { value: false, children });
}
function FooterDataProvider({
  value,
  children
}) {
  return /* @__PURE__ */ jsx(FooterDataContext.Provider, { value, children });
}
function useSuppressChrome() {
  return React.useContext(GlobalChromeContext);
}
function rel(path) {
  if (/^([a-z]+:|\/\/|#|mailto:|tel:)/i.test(path)) return path;
  const base = "/".replace(/\/$/, "");
  if (!base) return path;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
const marketplace = (path) => path.startsWith("/") ? path : `/${path}`;
function SiteHeader({ isAuthed = false } = {}) {
  if (useSuppressChrome()) return null;
  return /* @__PURE__ */ jsx(SiteHeaderInner, { isAuthed });
}
const PRIMARY_NAV = [
  { label: "Find a pool", href: "/s" },
  { label: "Learn with Fred", href: "/p/learningacademy" },
  { label: "How it works", href: "/p/how-it-works" },
  { label: "Neighbors", href: "/p/neighbors" }
];
const APP_NAV = [
  {
    label: "iOS app",
    href: "https://apps.apple.com/us/app/pool-rental-near-me-swim-fun/id6737762373",
    external: true
  },
  {
    label: "Google Play",
    href: "https://play.google.com/store/apps/details?id=com.poolrentalnearme.app.prod",
    external: true
  }
];
const LIST_SPACE_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";
const ACCOUNT_LINKS = [
  { label: "Inbox", href: "/inbox/sales" },
  { label: "Profile settings", href: "/profile-settings" },
  { label: "Account settings", href: "/account" },
  { label: "Manage listings", href: "/listings" }
];
function handleSharetribeLogout() {
  if (typeof document === "undefined") return;
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name.startsWith("st-") || name === "st-authinfo") {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.poolrentalnearme.com`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
  window.location.href = "/";
}
function NavAnchor({
  link,
  className,
  onClick
}) {
  const external = link.external;
  const isFred = link.label === "Learn with Fred";
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: external ? link.href : rel(link.href),
      onClick,
      className: `${className ?? ""} ${isFred ? "inline-flex items-center gap-1.5" : ""}`,
      ...external ? { target: "_blank", rel: "noopener noreferrer" } : {},
      children: [
        isFred && /* @__PURE__ */ jsx(
          "img",
          {
            src: fredAvatar,
            alt: "",
            "aria-hidden": "true",
            width: 20,
            height: 20,
            className: "h-5 w-5 rounded-full object-cover ring-1 ring-border"
          }
        ),
        link.label
      ]
    }
  );
}
function SiteHeaderInner({ isAuthed }) {
  const [open, setOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const accountRef = React.useRef(null);
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const ic2 = window.Intercom;
    if (typeof ic2 !== "function") return;
    ic2("update", { hide_default_launcher: open });
    return () => {
      const ic22 = window.Intercom;
      if (typeof ic22 === "function") ic22("update", { hide_default_launcher: false });
    };
  }, [open]);
  React.useEffect(() => {
    if (!open && !accountOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, accountOpen]);
  React.useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [accountOpen]);
  const navLinkClass = "text-sm font-medium text-muted-foreground hover:text-foreground";
  const ctaPillClass = "hidden h-9 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow sm:inline-flex";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx("a", { href: "/", className: "flex items-center gap-2 justify-self-start", onClick: close, children: /* @__PURE__ */ jsx("img", { src: logoUrl, alt: "Pool Rental Near Me", className: "h-9 w-auto", width: "36", height: "36" }) }),
      /* @__PURE__ */ jsx("nav", { className: "hidden items-center justify-center gap-7 justify-self-center lg:flex", children: PRIMARY_NAV.map((l) => /* @__PURE__ */ jsx(NavAnchor, { link: l, className: navLinkClass }, l.label)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-self-end", children: [
        isAuthed ? /* @__PURE__ */ jsxs("div", { className: "hidden items-center gap-4 md:flex", ref: accountRef, children: [
          /* @__PURE__ */ jsx("a", { href: marketplace("/inbox/sales"), className: navLinkClass, children: "Inbox" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setAccountOpen((v) => !v),
                "aria-expanded": accountOpen,
                "aria-haspopup": "menu",
                className: "inline-flex h-9 items-center justify-center gap-1 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted",
                children: [
                  "Account",
                  /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4", "aria-hidden": "true", children: /* @__PURE__ */ jsx("polyline", { points: "6 9 12 15 18 9" }) })
                ]
              }
            ),
            accountOpen && /* @__PURE__ */ jsxs(
              "div",
              {
                role: "menu",
                className: "absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-border bg-background shadow-lg",
                children: [
                  ACCOUNT_LINKS.map((l) => /* @__PURE__ */ jsx(
                    "a",
                    {
                      href: marketplace(l.href),
                      role: "menuitem",
                      className: "block px-4 py-2.5 text-sm text-foreground hover:bg-muted",
                      onClick: () => setAccountOpen(false),
                      children: l.label
                    },
                    l.label
                  )),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      role: "menuitem",
                      onClick: () => {
                        setAccountOpen(false);
                        handleSharetribeLogout();
                      },
                      className: "block w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted",
                      children: "Logout"
                    }
                  )
                ]
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "hidden items-center gap-4 md:flex", children: [
          /* @__PURE__ */ jsx("a", { href: marketplace("/signup"), className: navLinkClass, children: "Sign up" }),
          /* @__PURE__ */ jsx("a", { href: marketplace("/login"), className: navLinkClass, children: "Log in" })
        ] }),
        /* @__PURE__ */ jsx("a", { href: marketplace(LIST_SPACE_HREF), className: ctaPillClass, children: "List your space now" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-label": "Open menu",
            "aria-expanded": open,
            "aria-controls": "mobile-nav",
            onClick: () => setOpen(true),
            className: "inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted lg:hidden",
            children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-6 w-6", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("line", { x1: "4", y1: "6", x2: "20", y2: "6" }),
              /* @__PURE__ */ jsx("line", { x1: "4", y1: "12", x2: "20", y2: "12" }),
              /* @__PURE__ */ jsx("line", { x1: "4", y1: "18", x2: "20", y2: "18" })
            ] })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `fixed inset-0 z-[60] lg:hidden ${open ? "" : "pointer-events-none"}`,
        "aria-hidden": !open,
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`,
              onClick: close
            }
          ),
          /* @__PURE__ */ jsxs(
            "aside",
            {
              id: "mobile-nav",
              role: "dialog",
              "aria-modal": "true",
              "aria-label": "Site menu",
              className: `absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-background shadow-xl transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex h-16 items-center justify-between border-b border-border px-4", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-base font-semibold text-foreground", children: "Menu" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      "aria-label": "Close menu",
                      onClick: close,
                      className: "inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted",
                      children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-6 w-6", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                        /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                      ] })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("nav", { className: "flex-1 overflow-y-auto px-2 py-3", children: [
                  /* @__PURE__ */ jsx("ul", { className: "flex flex-col", children: PRIMARY_NAV.map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                    NavAnchor,
                    {
                      link: l,
                      onClick: close,
                      className: "block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                    }
                  ) }, l.label)) }),
                  /* @__PURE__ */ jsx("div", { className: "mt-3 px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Get the app" }),
                  /* @__PURE__ */ jsx("ul", { className: "flex flex-col", children: APP_NAV.map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                    NavAnchor,
                    {
                      link: l,
                      onClick: close,
                      className: "block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                    }
                  ) }, l.label)) }),
                  /* @__PURE__ */ jsx("div", { className: "my-3 border-t border-border" }),
                  /* @__PURE__ */ jsx("ul", { className: "flex flex-col", children: isAuthed ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: marketplace("/inbox/sales"),
                        onClick: close,
                        className: "block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted",
                        children: "Inbox"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: marketplace("/profile-settings"),
                        onClick: close,
                        className: "block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted",
                        children: "Profile settings"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: marketplace("/listings"),
                        onClick: close,
                        className: "block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted",
                        children: "Manage listings"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          close();
                          handleSharetribeLogout();
                        },
                        className: "block w-full rounded-md px-3 py-3 text-left text-base font-medium text-foreground hover:bg-muted",
                        children: "Logout"
                      }
                    ) })
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: marketplace("/signup"),
                        onClick: close,
                        className: "block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted",
                        children: "Sign up"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: marketplace("/login"),
                        onClick: close,
                        className: "block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted",
                        children: "Log in"
                      }
                    ) })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "border-t border-border p-4", children: /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: marketplace(LIST_SPACE_HREF),
                    onClick: close,
                    className: "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow",
                    children: "List your space now"
                  }
                ) })
              ]
            }
          )
        ]
      }
    ),
    !open && /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_20px_-12px_rgba(0,0,0,0.25)] backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "a",
        {
          href: marketplace("/s"),
          className: "inline-flex h-11 flex-1 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted",
          children: "Find a pool"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: marketplace(LIST_SPACE_HREF),
          className: "inline-flex h-11 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-glow",
          children: "List your space"
        }
      )
    ] }) })
  ] });
}
const SOCIAL_ICONS = {
  facebook: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-5 w-5", children: /* @__PURE__ */ jsx("path", { d: "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z" }) }),
  x: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-4 w-4", children: /* @__PURE__ */ jsx("path", { d: "M18.244 2H21l-6.52 7.46L22 22h-6.79l-4.78-6.26L4.8 22H2.04l6.97-7.97L2 2h6.96l4.32 5.71L18.24 2zm-2.38 18h1.88L7.27 4H5.27l10.6 16z" }) }),
  twitter: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-4 w-4", children: /* @__PURE__ */ jsx("path", { d: "M18.244 2H21l-6.52 7.46L22 22h-6.79l-4.78-6.26L4.8 22H2.04l6.97-7.97L2 2h6.96l4.32 5.71L18.24 2zm-2.38 18h1.88L7.27 4H5.27l10.6 16z" }) }),
  youtube: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-5 w-5", children: /* @__PURE__ */ jsx("path", { d: "M23.5 6.5a3 3 0 0 0-2.1-2.1C19.4 4 12 4 12 4s-7.4 0-9.4.4A3 3 0 0 0 .5 6.5C0 8.5 0 12 0 12s0 3.5.5 5.5a3 3 0 0 0 2.1 2.1C4.6 20 12 20 12 20s7.4 0 9.4-.4a3 3 0 0 0 2.1-2.1C24 15.5 24 12 24 12s0-3.5-.5-5.5zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" }) }),
  linkedin: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-5 w-5", children: /* @__PURE__ */ jsx("path", { d: "M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-1 1.9-2 3.9-2 4.2 0 5 2.8 5 6.4V21h-4v-5.3c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9z" }) }),
  instagram: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-5 w-5", children: /* @__PURE__ */ jsx("path", { d: "M12 2.2c3.2 0 3.6 0 4.8.1 1.2 0 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.9.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.9.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.9-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.9-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zm5.2-3.1a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" }) }),
  tiktok: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-5 w-5", children: /* @__PURE__ */ jsx("path", { d: "M19.6 6.7a5.5 5.5 0 0 1-3.3-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.6a3 3 0 1 0 2.1 2.8V2h2.5a5.5 5.5 0 0 0 3.3 4.7v.1z" }) }),
  pinterest: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-5 w-5", children: /* @__PURE__ */ jsx("path", { d: "M12 2a10 10 0 0 0-3.7 19.3c-.1-.8-.2-2 0-2.9.2-.8 1.1-4.7 1.1-4.7s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2.6 1.2 1.4 0 .8-.5 2-.8 3.2-.2.9.5 1.7 1.4 1.7 1.7 0 3-1.8 3-4.4 0-2.3-1.6-3.9-4-3.9-2.7 0-4.3 2-4.3 4.1 0 .8.3 1.7.7 2.2.1.1.1.2.1.3l-.3 1c0 .2-.2.2-.3.1-1.2-.6-2-2.4-2-3.9 0-3.1 2.3-6 6.6-6 3.5 0 6.2 2.5 6.2 5.8 0 3.4-2.2 6.2-5.2 6.2-1 0-2-.5-2.3-1.1l-.6 2.4c-.2.8-.8 1.9-1.2 2.5A10 10 0 1 0 12 2z" }) })
};
function socialIcon(key) {
  return SOCIAL_ICONS[key.toLowerCase()] ?? /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-5 w-5", children: /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }) });
}
function SiteFooter() {
  if (useSuppressChrome()) return null;
  return /* @__PURE__ */ jsx(SiteFooterInner, {});
}
function SiteFooterInner() {
  const data = React.useContext(FooterDataContext);
  return /* @__PURE__ */ jsx("footer", { className: "border-t border-border bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid gap-10 lg:grid-cols-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3", children: [
        /* @__PURE__ */ jsx("a", { href: "/", "aria-label": "Pool Rental Near Me", className: "inline-flex", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/icon.svg",
            alt: "Pool Rental Near Me",
            className: "h-14 w-14 rounded-2xl shadow-sm",
            width: "56",
            height: "56"
          }
        ) }),
        data.contact_phone_label && /* @__PURE__ */ jsxs("p", { className: "mt-5 text-sm text-foreground", children: [
          data.contact_phone ? /* @__PURE__ */ jsx("a", { href: data.contact_phone, className: "hover:text-primary", children: data.contact_phone_label }) : /* @__PURE__ */ jsx("span", { children: data.contact_phone_label }),
          data.contact_phone_hours && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
            " ",
            data.contact_phone_hours
          ] })
        ] }),
        data.contact_email && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm", children: /* @__PURE__ */ jsx("a", { href: `mailto:${data.contact_email}`, className: "text-foreground hover:text-primary", children: data.contact_email }) }),
        data.socials.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-5 flex flex-wrap items-center gap-3 text-muted-foreground", children: data.socials.map((s) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          "a",
          {
            href: s.href,
            "aria-label": s.label,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary hover:text-primary",
            children: socialIcon(s.icon)
          }
        ) }, s.label + s.href)) })
      ] }),
      /* @__PURE__ */ jsx(
        FooterColumn,
        {
          title: "Explore",
          items: [
            ...data.explore_links,
            { label: "Pool Maintenance Guide", href: "/p/pool-maintenance" },
            { label: "Blog", href: "/p/blog" }
          ]
        }
      ),
      /* @__PURE__ */ jsx(FooterColumn, { title: "Become a Host", items: data.host_links }),
      /* @__PURE__ */ jsx(FooterColumn, { title: "Compare", items: data.compare_links }),
      /* @__PURE__ */ jsx(FooterColumn, { title: "Company", items: data.company_links }),
      /* @__PURE__ */ jsx(FooterColumn, { title: "Pool Rental Near Me Values", items: data.values_links }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-base font-semibold text-foreground", children: "Popular Markets" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-2 text-sm text-muted-foreground", children: [
          data.popular_markets.map((mkt) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: rel(`/p/${mkt.slug}`), className: "hover:text-primary", children: mkt.name }) }, mkt.slug)),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: rel("/p/all-locations"), className: "hover:text-primary", children: "Pools Near Me" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-12 border-t border-border pt-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-lg font-semibold text-foreground", children: "Get the Pool Rental Near Me app" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Book pools, message hosts, and manage trips on the go." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4", children: [
          /* @__PURE__ */ jsxs("a", { dir: "ltr", href: "https://apps.apple.com/us/app/pool-rental-near-me-swim-fun/id6737762373", target: "_blank", rel: "noopener noreferrer", "aria-label": "Download on the App Store", className: "inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-foreground px-5 text-background shadow-sm transition-transform hover:scale-[1.03] sm:h-16 sm:w-auto sm:justify-start sm:gap-3 sm:rounded-2xl sm:px-6", children: [
            /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "h-7 w-7 shrink-0 sm:h-9 sm:w-9", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M16.365 1.43c0 1.14-.42 2.22-1.18 3.04-.83.9-2.16 1.6-3.27 1.51-.14-1.12.4-2.27 1.16-3.06.83-.86 2.27-1.5 3.29-1.49zM20.5 17.36c-.56 1.29-.83 1.87-1.55 3.01-1 1.59-2.41 3.57-4.16 3.59-1.55.01-1.95-1.01-4.06-1-2.11.01-2.55 1.02-4.1 1-1.75-.02-3.09-1.81-4.09-3.4C0 17.86-.34 13.61 1.4 11.27c1.23-1.66 3.18-2.63 5-2.63 1.86 0 3.03 1.02 4.57 1.02 1.5 0 2.41-1.02 4.56-1.02 1.62 0 3.34.88 4.56 2.41-4.01 2.2-3.36 7.93.41 9.31z" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col leading-tight text-start", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wide opacity-80", children: "Download on the" }),
              /* @__PURE__ */ jsx("span", { className: "text-base font-semibold sm:text-xl", children: "App Store" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("a", { dir: "ltr", href: "https://play.google.com/store/apps/details?id=com.poolrentalnearme.app.prod", target: "_blank", rel: "noopener noreferrer", "aria-label": "Get it on Google Play", className: "inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-foreground px-5 text-background shadow-sm transition-transform hover:scale-[1.03] sm:h-16 sm:w-auto sm:justify-start sm:gap-3 sm:rounded-2xl sm:px-6", children: [
            /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: "h-7 w-7 shrink-0 sm:h-9 sm:w-9", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M3.6 1.6c-.4.3-.6.8-.6 1.5v17.8c0 .7.2 1.2.6 1.5l10.1-10.4L3.6 1.6z", fill: "#34A853" }),
              /* @__PURE__ */ jsx("path", { d: "M17.5 8.6 13.7 12l3.8 3.4 4.5-2.6c1.3-.7 1.3-2.7 0-3.4l-4.5-2.8z", fill: "#FBBC04" }),
              /* @__PURE__ */ jsx("path", { d: "m3.6 22.4 10.1-10.4L17.5 15.4 5.4 22.7c-.7.4-1.4.2-1.8-.3z", fill: "#EA4335" }),
              /* @__PURE__ */ jsx("path", { d: "M3.6 1.6c.4-.5 1.1-.7 1.8-.3l12.1 7.3-3.8 3.4L3.6 1.6z", fill: "#4285F4" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col leading-tight text-start", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wide opacity-80", children: "GET IT ON" }),
              /* @__PURE__ */ jsx("span", { className: "text-base font-semibold sm:text-xl", children: "Google Play" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground", children: [
        "Pool Rental Near Me is operated by PRNM Corp, a Delaware C-Corporation.",
        " ",
        /* @__PURE__ */ jsx("a", { href: rel("/p/about-our-company"), className: "font-medium text-foreground hover:text-primary", children: "Learn more about our company →" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: data.bottom_text || `© ${FOOTER_YEAR} PRNM CORP` }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("a", { href: "/public-pools", className: "hover:text-primary", children: "Public Pools" }),
          /* @__PURE__ */ jsx("a", { href: "/p/blog", className: "hover:text-primary", children: "Blog" }),
          /* @__PURE__ */ jsx("a", { href: "/sitemap.xml", className: "hover:text-primary", children: "Sitemap" })
        ] })
      ] })
    ] })
  ] }) });
}
function FooterColumn({ title, items }) {
  return /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2", children: [
    /* @__PURE__ */ jsx("h4", { className: "text-base font-semibold text-foreground", children: title }),
    /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2 text-sm text-muted-foreground", children: items.map((it) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: rel(it.href), className: "hover:text-primary", children: it.label }) }, it.label + it.href)) })
  ] });
}
function HydrationDebug() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window;
    if (w.__hydrationDebugInstalled) return;
    w.__hydrationDebugInstalled = true;
    const url = window.location.href;
    const path = window.location.pathname;
    const ua = navigator.userAgent;
    const htmlLen = document.documentElement.outerHTML.length;
    const bodyChildren = document.body.children.length;
    console.info("[hydration-debug] mounted", {
      url,
      path,
      ua,
      htmlLen,
      bodyChildren,
      time: (/* @__PURE__ */ new Date()).toISOString()
    });
    const HYDRATION_CODES = ["418", "419", "421", "422", "423", "425"];
    const HYDRATION_KEYWORDS = [
      "hydrat",
      "did not match",
      "Text content does not match",
      "server rendered HTML",
      "Minified React error"
    ];
    const origError = console.error;
    console.error = (...args) => {
      const msg = args.map((a) => {
        if (typeof a === "string") return a;
        if (a instanceof Error) return a.message;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      }).join(" ");
      const isHydration = HYDRATION_KEYWORDS.some((k) => msg.toLowerCase().includes(k.toLowerCase())) || HYDRATION_CODES.some((c) => msg.includes(`Minified React error #${c}`));
      if (isHydration) {
        const stack = new Error("hydration-debug capture").stack;
        try {
          origError.call(
            console,
            "[hydration-debug] HYDRATION ERROR DETECTED",
            {
              url: window.location.href,
              path: window.location.pathname,
              originalArgs: args,
              capturedStack: stack,
              docTitle: document.title,
              firstH1: document.querySelector("h1")?.textContent ?? null,
              bodyPreview: document.body.innerText.slice(0, 200)
            }
          );
        } catch {
        }
      }
      return origError.apply(console, args);
    };
    const onError = (event) => {
      console.warn("[hydration-debug] window.error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };
    const onRejection = (event) => {
      console.warn("[hydration-debug] unhandledrejection", {
        reason: event.reason?.message ?? String(event.reason),
        stack: event.reason?.stack
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      console.error = origError;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      w.__hydrationDebugInstalled = false;
    };
  }, []);
  return null;
}
const ClickSchema = z.object({
  ref_code: z.string().trim().min(1).max(40),
  landing_path: z.string().trim().max(500).optional().or(z.literal("")),
  referrer: z.string().trim().max(500).optional().or(z.literal(""))
});
const recordAffiliateClick = createServerFn({
  method: "POST"
}).inputValidator((d) => ClickSchema.parse(d)).handler(createSsrRpc("f259095c7f085fb2645a4f9a4fee3775cc357340a8183dfbefd1a15b19c60bcd"));
const COOKIE_NAME = "prnm_ref";
const COOKIE_DAYS = 90;
function setCookie(name, value, days) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function AffiliateRefCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (!ref || ref.length > 40) return;
      const code = ref.toUpperCase().trim();
      setCookie(COOKIE_NAME, code, COOKIE_DAYS);
      recordAffiliateClick({
        data: {
          ref_code: code,
          landing_path: url.pathname.slice(0, 500),
          referrer: (document.referrer || "").slice(0, 500)
        }
      }).catch(() => {
      });
    } catch {
    }
  }, []);
  return null;
}
const getSiteFooter = createServerFn({
  method: "GET"
}).handler(createSsrRpc("4f39613f620aba63963fb1552d47c9c5e3f902be3953d01389d12012cb6b73c4"));
const LinkSchema = z.object({
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(500)
});
const MarketSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120)
});
const SocialSchema = z.object({
  label: z.string().min(1).max(60),
  href: z.string().min(1).max(500),
  icon: z.string().min(1).max(40)
});
const UpdateSchema$1 = z.object({
  contact_phone: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_phone_label: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_phone_hours: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_email: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  bottom_text: z.string().max(500).nullable().or(z.literal("").transform(() => null)),
  explore_links: z.array(LinkSchema).max(50),
  host_links: z.array(LinkSchema).max(50),
  company_links: z.array(LinkSchema).max(50),
  compare_links: z.array(LinkSchema).max(50),
  popular_markets: z.array(MarketSchema).max(50),
  socials: z.array(SocialSchema).max(20)
});
const getSiteFooterAdmin = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("ef3fd02513d3cad39306d22ee2ca1c4387e0a6fa82ee660205a133ebe2ef5b5e"));
const updateSiteFooter = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => UpdateSchema$1.parse(data)).handler(createSsrRpc("bf638fbaa59a45334a7e9712503d06a6415be89e7eb19f84a159bbaa6cb2c5ad"));
const resetSiteFooter = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("5ed86f26def732fcfd337ac51d46220d443d9b21c68d09a4c8c1b515f7b3601c"));
const getSharetribeAuthState = createServerFn({
  method: "GET"
}).handler(createSsrRpc("d9670288464c877763105467f3d6f34bbf113cde0e28bd2a76c90768aed8abc0"));
const ogDefaultImage = "/fw-assets/og-default-CVVrfWF2.jpg";
const BRAND_RATING = {
  ratingValue: 5,
  reviewCount: 10,
  asOf: "2026-05-30",
  source: "Google Business Profile — PRNM Corp"
};
function brandRatingActive(r = BRAND_RATING) {
  return r.ratingValue > 0 && r.reviewCount > 0;
}
const SITE_URL = "https://www.poolrentalnearme.com";
const SITE_NAME$3 = "Pool Rental Near Me";
const DEFAULT_OG_IMAGE = ogDefaultImage;
const SITE_LOGO = `${SITE_URL}/icon-512.png`;
const SOCIAL_PROFILES = [
  "https://www.facebook.com/poolrentalnearme",
  "https://x.com/poolrentalnearme",
  "https://www.youtube.com/@poolrentalnearme",
  "https://www.linkedin.com/company/poolrentalnearme",
  "https://www.instagram.com/poolrentalnearme",
  "https://www.tiktok.com/@poolrentalnearme",
  "https://www.pinterest.com/poolrentalnearme"
];
const AUTHOR_PERSON_URL = `${SITE_URL}/p/author/derek-bowen`;
const AUTHOR_PERSON_ID = `${AUTHOR_PERSON_URL}#person`;
const AUTHOR_PERSON_JSONLD_REF = {
  "@type": "Person",
  "@id": AUTHOR_PERSON_ID,
  name: "Derek Bowen",
  url: AUTHOR_PERSON_URL,
  jobTitle: "Founder & CEO, PRNM Corp",
  sameAs: [
    "https://www.amazon.com/stores/Derek-Bowen/author/B0FJM55Y12",
    "https://www.linkedin.com/in/derekcbowen/"
  ]
};
function buildMeta({
  title,
  description,
  path,
  canonicalPath,
  canonicalUrl: canonicalUrlOverride,
  ogTitle,
  ogDescription,
  image,
  type = "website",
  noindex,
  prevPath,
  nextPath,
  origin,
  hreflang
}) {
  const siteOrigin = (origin ?? SITE_URL).replace(/\/+$/, "");
  const canonicalUrl = canonicalUrlOverride ?? `${siteOrigin}${canonicalPath ?? path}`;
  const url = canonicalUrl;
  const rawImage = image === null ? null : image ?? DEFAULT_OG_IMAGE;
  const resolvedImage = rawImage && rawImage.startsWith("/") ? `${siteOrigin}${rawImage}` : rawImage;
  const ogTitleResolved = ogTitle || title;
  const ogDescriptionResolved = ogDescription || description;
  const meta = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: ogTitleResolved },
    { property: "og:description", content: ogDescriptionResolved },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME$3 },
    { name: "twitter:card", content: resolvedImage ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: ogTitleResolved },
    { name: "twitter:description", content: ogDescriptionResolved }
  ];
  if (resolvedImage) {
    meta.push({ property: "og:image", content: resolvedImage });
    meta.push({ property: "og:image:width", content: "1200" });
    meta.push({ property: "og:image:height", content: "630" });
    meta.push({ name: "twitter:image", content: resolvedImage });
  }
  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }
  const links = [
    { rel: "canonical", href: canonicalUrl }
  ];
  if (prevPath) links.push({ rel: "prev", href: `${siteOrigin}${prevPath}` });
  if (nextPath) links.push({ rel: "next", href: `${siteOrigin}${nextPath}` });
  if (hreflang?.length) {
    for (const h of hreflang) {
      links.push({ rel: "alternate", hreflang: h.lang, href: h.href });
    }
  }
  return { meta, links };
}
function breadcrumbJsonLd$1(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`
    }))
  };
}
function itemListJsonLd(items, listName) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...listName ? { name: listName } : {},
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}${item.path}`,
      name: item.name,
      ...item.image ? { image: item.image } : {}
    }))
  };
}
function organizationJsonLd$1() {
  const base = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME$3,
    url: SITE_URL,
    logo: SITE_LOGO,
    sameAs: SOCIAL_PROFILES,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+1-888-940-4247",
        contactType: "customer service",
        email: "support@poolrentalnearme.com",
        areaServed: "US",
        availableLanguage: ["English", "Spanish"]
      }
    ]
  };
  if (brandRatingActive()) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: BRAND_RATING.ratingValue.toFixed(1),
      reviewCount: BRAND_RATING.reviewCount,
      bestRating: "5",
      worstRating: "1"
    };
  }
  return base;
}
function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME$3,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/s?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}
function ldJsonScript(obj2) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(obj2)
  };
}
const IntercomWidget = lazy(
  () => import("./intercom-widget-C2LfK9oG.js").then((m) => ({ default: m.IntercomWidget }))
);
function NotFoundComponent() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("main", { className: "flex flex-1 items-center justify-center px-4 py-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
      /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow",
          children: "Go home"
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
const Route$3m = createRootRoute({
  loader: async () => {
    const [footerRes, authRes] = await Promise.allSettled([
      getSiteFooter(),
      getSharetribeAuthState()
    ]);
    const footer = footerRes.status === "fulfilled" ? footerRes.value : null;
    const isAuthed = authRes.status === "fulfilled" ? !!authRes.value?.isAuthed : false;
    return { footer, isAuthed };
  },
  head: () => {
    const meta = buildMeta({
      title: "Pool Rental Near Me - Starting at $25 hour - Rent a pool now",
      description: "Rent a private pool by the hour or become a pool host. 0% host fees in 2026, $2M liability coverage, 5,100+ pages across the US.",
      path: "/",
      // Do NOT set og:image here. Root head() concatenates into every match,
      // so a root-level og:image would override every leaf route's share
      // preview. Each shareable route sets its own og:image via buildMeta().
      image: null
    });
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "author", content: SITE_NAME$3 },
        { name: "theme-color", content: "#0ea5e9" },
        { name: "google-site-verification", content: "nDLvX6F18GNzJw-bLU6J4HjK3kfbuRIJENjW-6O5ZpU" },
        ...meta.meta
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
        { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "mask-icon", href: "/icon.svg", color: "#0ea5e9" },
        // Do NOT spread meta.links here — it would emit a root-level
        // <link rel="canonical" href="/"> on every page, duplicating the
        // per-route canonical. Each shareable route emits its own canonical
        // via buildMeta() in its head().
        ...meta.links.filter((l) => l.rel !== "canonical")
      ],
      scripts: [ldJsonScript(organizationJsonLd$1()), ldJsonScript(websiteJsonLd())]
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 6e4, refetchOnWindowFocus: false } }
  }));
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const data = Route$3m.useLoaderData();
  const isAdmin = pathname.startsWith("/admin");
  const showIntercom = !isAdmin;
  const footer = data?.footer;
  const isAuthed = !!data?.isAuthed;
  const content = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(HydrationDebug, {}),
    /* @__PURE__ */ jsx(AffiliateRefCapture, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      !isAdmin && /* @__PURE__ */ jsx(SiteHeader, { isAuthed }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-1 flex-col", children: /* @__PURE__ */ jsx(GlobalChromeProvider, { children: /* @__PURE__ */ jsx(Outlet, {}) }) }),
      !isAdmin && /* @__PURE__ */ jsx(SiteFooter, {})
    ] }),
    showIntercom && /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(IntercomWidget, {}) })
  ] });
  const wrapped = footer ? /* @__PURE__ */ jsx(FooterDataProvider, { value: footer, children: content }) : content;
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: wrapped });
}
const $$splitComponentImporter$21 = () => import("./unsubscribe-renter-DbSVfY60.js");
const Route$3l = createFileRoute("/unsubscribe-renter")({
  validateSearch: (s) => ({
    token: String(s.token || "")
  }),
  component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
const $$splitComponentImporter$20 = () => import("./unsubscribe-host-CCVLpPw6.js");
const Route$3k = createFileRoute("/unsubscribe-host")({
  validateSearch: (s) => ({
    token: String(s.token || "")
  }),
  component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
const $$splitComponentImporter$1$ = () => import("./unsubscribe-composer-DSMb7174.js");
const Route$3j = createFileRoute("/unsubscribe-composer")({
  validateSearch: (s) => ({
    token: String(s.token || "")
  }),
  component: lazyRouteComponent($$splitComponentImporter$1$, "component")
});
const $$splitComponentImporter$1_ = () => import("./unsubscribe-scF4ADGK.js");
const searchSchema$1 = z.object({
  token: z.string().optional()
});
const Route$3i = createFileRoute("/unsubscribe")({
  validateSearch: searchSchema$1,
  component: lazyRouteComponent($$splitComponentImporter$1_, "component"),
  head: () => ({
    meta: [{
      title: "Unsubscribe — Pool Rental Near Me"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  })
});
const SITEMAP_PAGE_SIZE = 1e3;
const XML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;"
};
function xmlEscape(s) {
  return s.replace(/[&<>"']/g, (c) => XML_ESCAPE_MAP[c] ?? c);
}
function isoDate(d) {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
function buildUrlsetXml(urls) {
  const usesImages = urls.some((u) => u.images?.length);
  const usesHreflang = urls.some((u) => u.hreflang?.length);
  const namespaces = ['xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'];
  if (usesHreflang) namespaces.push('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  if (usesImages) namespaces.push('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  const body = urls.map((u) => {
    const parts = [`    <loc>${xmlEscape(u.loc)}</loc>`];
    const lastmod = isoDate(u.lastmod);
    if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
    if (u.hreflang?.length) {
      for (const h of u.hreflang) {
        parts.push(
          `    <xhtml:link rel="alternate" hreflang="${xmlEscape(h.lang)}" href="${xmlEscape(h.href)}"/>`
        );
      }
    }
    if (u.images?.length) {
      for (const img of u.images) {
        const inner = [`      <image:loc>${xmlEscape(img.loc)}</image:loc>`];
        if (img.title) inner.push(`      <image:title>${xmlEscape(img.title)}</image:title>`);
        if (img.caption) inner.push(`      <image:caption>${xmlEscape(img.caption)}</image:caption>`);
        parts.push(`    <image:image>
${inner.join("\n")}
    </image:image>`);
      }
    }
    return `  <url>
${parts.join("\n")}
  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${namespaces.join("\n        ")}>
${body}
</urlset>
`;
}
function buildSitemapIndexXml(entries) {
  const body = entries.map((e) => {
    const parts = [`    <loc>${xmlEscape(e.loc)}</loc>`];
    const lastmod = isoDate(e.lastmod);
    if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
    return `  <sitemap>
${parts.join("\n")}
  </sitemap>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}
const SITEMAP_RESPONSE_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  // Short cache during launch window — switch to 1 hour after stable
  "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
  "X-Robots-Tag": "noindex"
};
function sitemapResponse(xml, init) {
  return new Response(xml, {
    status: 200,
    ...init,
    headers: { ...SITEMAP_RESPONSE_HEADERS, ...init?.headers }
  });
}
async function buildContentPagesSitemap(request, templateTypes, pathPrefix, supabase2, siteUrl, options) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const offset = (page - 1) * SITEMAP_PAGE_SIZE;
  const minBodyChars = options?.minBodyChars ?? 0;
  const cols = minBodyChars > 0 ? "slug, url_path, status, updated_at, hero_image_url, body_markdown" : "slug, url_path, status, updated_at, hero_image_url";
  const { data, error } = await supabase2.from("content_pages").select(cols).in("template_type", templateTypes).eq("in_sitemap", true).eq("status", "published").not("slug", "is", null).not("slug", "like", "pool-rentals-%").order("slug").range(offset, offset + SITEMAP_PAGE_SIZE - 1);
  if (error) {
    console.error(`[sitemap] supabase error for ${templateTypes.join(",")}`, error);
    return sitemapResponse(buildUrlsetXml([]));
  }
  const expectedPrefix = `${pathPrefix}/`;
  const filtered = (data ?? []).filter((row) => {
    if (row.url_path && !row.url_path.startsWith(expectedPrefix)) return false;
    if (minBodyChars <= 0) return true;
    const len = (row.body_markdown ?? "").trim().length;
    return len >= minBodyChars;
  });
  const urls = filtered.map((row) => {
    const loc = row.url_path ? `${siteUrl}${row.url_path}` : `${siteUrl}${pathPrefix}/${row.slug}`;
    const sitemapUrl = {
      loc,
      lastmod: row.updated_at
    };
    if (row.hero_image_url) {
      sitemapUrl.images = [{ loc: row.hero_image_url }];
    }
    return sitemapUrl;
  });
  return sitemapResponse(buildUrlsetXml(urls));
}
function redirect301(targetPath, siteUrl) {
  return new Response(null, {
    status: 301,
    headers: {
      Location: `${siteUrl}${targetPath}`,
      "Cache-Control": "public, max-age=86400"
    }
  });
}
const Route$3h = createFileRoute("/sm-74buq58v.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const Route$3g = createFileRoute("/sm-74buq58v-ls.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const Route$3f = createFileRoute("/sm-74buq58v-ho.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const Route$3e = createFileRoute("/sm-74buq58v-ev.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const Route$3d = createFileRoute("/sm-74buq58v-cr.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const Route$3c = createFileRoute("/sm-74buq58v-cn.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const Route$3b = createFileRoute("/sm-74buq58v-ad.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const TEMPLATE_GROUPS = [
  { basePath: "/sitemap-pages-money.xml", templateTypes: ["money_page"] },
  { basePath: "/sitemap-pages-cities.xml", templateTypes: ["city_main"] },
  { basePath: "/sitemap-pages-host-acquisition.xml", templateTypes: ["host_acq_city", "host_acq_hub"] },
  { basePath: "/sitemap-pages-event-guides.xml", templateTypes: ["event_guide"] },
  { basePath: "/sitemap-pages-articles.xml", templateTypes: ["resource", "other", "pool_maintenance", "pool_maintenance_hub"] },
  { basePath: "/sitemap-pages-academy.xml", templateTypes: ["elearning"] },
  { basePath: "/sitemap-pages-advocacy.xml", templateTypes: ["host_advocacy_hub", "host_advocacy_state"] },
  { basePath: "/sitemap-pages-spanish.xml", templateTypes: ["spanish_host_acq", "spanish_resource", "host_acq_city_es"] },
  { basePath: "/sitemap-pages-swim-instructor.xml", templateTypes: ["swim_instructor_city", "swim_instructor_hub"] }
];
const Route$3a = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [];
        entries.push({
          loc: `${SITE_URL}/sitemap-static.xml`,
          lastmod: /* @__PURE__ */ new Date()
        });
        entries.push({
          loc: `${SITE_URL}/sitemap-pages-comparisons.xml`,
          lastmod: /* @__PURE__ */ new Date()
        });
        for (const group of TEMPLATE_GROUPS) {
          const { count, error } = await supabaseAdmin.from("content_pages").select("*", { count: "exact", head: true }).in("template_type", group.templateTypes).eq("in_sitemap", true).eq("status", "published").not("slug", "is", null);
          if (error) {
            console.error(`[sitemap] count error for ${group.basePath}`, error);
            continue;
          }
          if (!count) continue;
          const { data: latest } = await supabaseAdmin.from("content_pages").select("updated_at").in("template_type", group.templateTypes).eq("in_sitemap", true).eq("status", "published").not("slug", "is", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
          const pageCount = Math.ceil(count / SITEMAP_PAGE_SIZE);
          for (let p = 1; p <= pageCount; p++) {
            const loc = p === 1 ? `${SITE_URL}${group.basePath}` : `${SITE_URL}${group.basePath}?page=${p}`;
            entries.push({ loc, lastmod: latest?.updated_at });
          }
        }
        try {
          const { count: blogCount } = await supabaseAdmin.from("blog_posts").select("*", { count: "exact", head: true }).eq("is_published", true);
          if (blogCount && blogCount > 0) {
            const { data: latestBlog } = await supabaseAdmin.from("blog_posts").select("updated_at").eq("is_published", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
            const blogPageCount = Math.ceil(blogCount / SITEMAP_PAGE_SIZE);
            for (let p = 1; p <= blogPageCount; p++) {
              const loc = p === 1 ? `${SITE_URL}/sitemap-pages-blog.xml` : `${SITE_URL}/sitemap-pages-blog.xml?page=${p}`;
              entries.push({ loc, lastmod: latestBlog?.updated_at });
            }
          }
        } catch (err) {
          console.error("[sitemap] blog_posts count error", err);
        }
        try {
          const { count: courseCount } = await supabaseAdmin.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true).not("slug", "is", null);
          if (courseCount && courseCount > 0) {
            const { data: latestCourse } = await supabaseAdmin.from("courses").select("updated_at").eq("is_published", true).not("slug", "is", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
            const coursePageCount = Math.ceil(courseCount / SITEMAP_PAGE_SIZE);
            for (let p = 1; p <= coursePageCount; p++) {
              const loc = p === 1 ? `${SITE_URL}/sitemap-pages-courses.xml` : `${SITE_URL}/sitemap-pages-courses.xml?page=${p}`;
              entries.push({ loc, lastmod: latestCourse?.updated_at });
            }
          }
        } catch (err) {
          console.error("[sitemap] courses count error", err);
        }
        try {
          const { count: listingCount } = await supabaseAdmin.from("synced_listings").select("*", { count: "exact", head: true }).eq("state", "published").eq("is_deleted", false).not("slug", "is", null).not("sharetribe_id", "is", null);
          if (listingCount && listingCount > 0) {
            const { data: latestListing } = await supabaseAdmin.from("synced_listings").select("updated_at").eq("state", "published").eq("is_deleted", false).not("slug", "is", null).not("sharetribe_id", "is", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
            const listingPageCount = Math.ceil(listingCount / SITEMAP_PAGE_SIZE);
            for (let p = 1; p <= listingPageCount; p++) {
              const loc = p === 1 ? `${SITE_URL}/sitemap-listings.xml` : `${SITE_URL}/sitemap-listings.xml?page=${p}`;
              entries.push({ loc, lastmod: latestListing?.updated_at });
            }
          }
        } catch (err) {
          console.error("[sitemap] synced_listings count error", err);
        }
        return sitemapResponse(buildSitemapIndexXml(entries));
      }
    }
  }
});
function stateSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}
const getStateHub = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  state: z.string().min(2).max(40)
}).parse(data)).handler(createSsrRpc("79b64087660bdf4fb3cf48087cdebf222c62fa684137a15386958033986d4752"));
const getAllStateHubs = createServerFn({
  method: "GET"
}).handler(createSsrRpc("7f981f7440b17597ba65cf7c841b484ec4af448efa9dbe9542d6397d003ac5f1"));
function stateHubPath(stateName2) {
  return `/p/pool-rentals-${stateSlug(stateName2)}`;
}
const STATIC_URLS = [
  { path: "/" },
  { path: "/p/hosting" },
  { path: "/p/host-training-academy" },
  { path: "/p/become-a-host" },
  { path: "/p/become-a-swimming-pool-host" },
  { path: "/p/privacy-policy" },
  { path: "/p/terms-of-service" },
  { path: "/p/about" },
  { path: "/p/howitworksforguests" },
  { path: "/p/make-money" },
  { path: "/p/investors" },
  { path: "/p/all-locations" },
  { path: "/p/pool-rentals" },
  { path: "/p/pool-rental-insurance-explained" },
  { path: "/p/pool-rental-host-fees-compared" },
  { path: "/p/pool-rental-permits-by-state" },
  // Phase 1 subdomain consolidation — six new keyword-targeted tool routes.
  { path: "/p/start-hosting" },
  { path: "/p/pool-heating-cost-calculator" },
  { path: "/p/ai-listing-generator" },
  { path: "/p/waiver-generator" },
  { path: "/p/host-marketing-playbook" },
  { path: "/p/pool-rules-generator" },
  { path: "/p/pool-wifi-guide" }
];
const Route$39 = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = /* @__PURE__ */ new Date();
        let stateHubs = [];
        try {
          stateHubs = await getAllStateHubs();
        } catch {
          stateHubs = [];
        }
        const stateEntries = stateHubs.map((h) => ({ path: stateHubPath(h.stateName) }));
        const urls = [...STATIC_URLS, ...stateEntries].map(
          (entry) => ({
            loc: `${SITE_URL}${entry.path}`,
            lastmod: entry.lastmod ?? now
          })
        );
        return sitemapResponse(buildUrlsetXml(urls));
      }
    }
  }
});
const Route$38 = createFileRoute("/sitemap-recent-pages.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const Route$37 = createFileRoute("/sitemap-pages-swim-instructor.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(
        request,
        ["swim_instructor_city", "swim_instructor_hub"],
        "/p",
        supabaseAdmin,
        SITE_URL
      )
    }
  }
});
const Route$36 = createFileRoute("/sitemap-pages-spanish.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(
        request,
        ["spanish_host_acq", "spanish_resource", "host_acq_city_es"],
        "/p",
        supabaseAdmin,
        SITE_URL
      )
    }
  }
});
const Route$35 = createFileRoute("/sitemap-pages-money.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(request, ["money_page"], "/p", supabaseAdmin, SITE_URL)
    }
  }
});
const Route$34 = createFileRoute("/sitemap-pages-host-acquisition.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(request, ["host_acq_city", "host_acq_hub"], "/p", supabaseAdmin, SITE_URL)
    }
  }
});
const Route$33 = createFileRoute("/sitemap-pages-event-guides.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(request, ["event_guide"], "/p", supabaseAdmin, SITE_URL)
    }
  }
});
const Route$32 = createFileRoute("/sitemap-pages-courses.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
        const from = (page - 1) * SITEMAP_PAGE_SIZE;
        const to = from + SITEMAP_PAGE_SIZE - 1;
        const { data, error } = await supabaseAdmin.from("courses").select("slug, cover_image_url, title, updated_at").eq("is_published", true).not("slug", "is", null).order("updated_at", { ascending: false }).range(from, to);
        if (error) {
          console.error("[sitemap-pages-courses] query error", error);
          return sitemapResponse(buildUrlsetXml([]));
        }
        const urls = (data ?? []).filter((r) => !!r?.slug).map((r) => {
          const u = {
            loc: `${SITE_URL}/p/course/${r.slug}`,
            lastmod: r.updated_at ?? null
          };
          if (r.cover_image_url) {
            u.images = [{ loc: r.cover_image_url, title: r.title ?? void 0 }];
          }
          return u;
        });
        return sitemapResponse(buildUrlsetXml(urls));
      }
    }
  }
});
const PILLARS = [
  "/p/giggster-vs-pool-rental-near-me",
  "/p/peerspace-vs-pool-rental-near-me",
  "/p/swimply-alternative-vs-pool-rental-near-me"
];
const COMPETITOR_SLUGS = [
  "giggster-vs-pool-rental-near-me-in-",
  "peerspace-vs-pool-rental-near-me-in-"
];
const Route$31 = createFileRoute("/sitemap-pages-comparisons.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = /* @__PURE__ */ new Date();
        const urls = PILLARS.map((p) => ({
          loc: `${SITE_URL}${p}`,
          lastmod: now
        }));
        const { data, error } = await supabaseAdmin.from("cities").select("slug, updated_at").eq("is_published", true).order("slug", { ascending: true }).limit(5e3);
        if (!error && data) {
          for (const row of data) {
            const lastmod = row.updated_at ? new Date(row.updated_at) : now;
            for (const prefix of COMPETITOR_SLUGS) {
              urls.push({
                loc: `${SITE_URL}/p/${prefix}${row.slug}`,
                lastmod
              });
            }
          }
        }
        return sitemapResponse(buildUrlsetXml(urls));
      }
    }
  }
});
const Route$30 = createFileRoute("/sitemap-pages-cities.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(
        request,
        ["city_main"],
        "/p",
        supabaseAdmin,
        SITE_URL
      )
    }
  }
});
const Route$2$ = createFileRoute("/sitemap-pages-blog.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
        const from = (page - 1) * SITEMAP_PAGE_SIZE;
        const to = from + SITEMAP_PAGE_SIZE - 1;
        const { data, error } = await supabaseAdmin.from("blog_posts").select("slug, cover_image_url, title, updated_at, published_at").eq("is_published", true).order("updated_at", { ascending: false }).range(from, to);
        if (error) {
          console.error("[sitemap-pages-blog] query error", error);
          return sitemapResponse(buildUrlsetXml([]));
        }
        const urls = (data ?? []).filter((r) => !!r?.slug).map((r) => {
          const u = {
            loc: `${SITE_URL}/p/${r.slug}`,
            lastmod: r.updated_at ?? r.published_at ?? null
          };
          if (r.cover_image_url) {
            u.images = [{ loc: r.cover_image_url, title: r.title ?? void 0 }];
          }
          return u;
        });
        return sitemapResponse(buildUrlsetXml(urls));
      }
    }
  }
});
const Route$2_ = createFileRoute("/sitemap-pages-articles.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(request, ["resource", "other", "pool_maintenance", "pool_maintenance_hub"], "/p", supabaseAdmin, SITE_URL)
    }
  }
});
const Route$2Z = createFileRoute("/sitemap-pages-advocacy.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(
        request,
        ["host_advocacy_hub", "host_advocacy_state"],
        "/p",
        supabaseAdmin,
        SITE_URL
      )
    }
  }
});
const Route$2Y = createFileRoute("/sitemap-pages-academy.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildContentPagesSitemap(request, ["elearning"], "/p", supabaseAdmin, SITE_URL, {
        minBodyChars: 800
      })
    }
  }
});
const Route$2X = createFileRoute("/sitemap-listings.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
        const from = (page - 1) * SITEMAP_PAGE_SIZE;
        const to = from + SITEMAP_PAGE_SIZE - 1;
        const { data, error } = await supabaseAdmin.from("synced_listings").select("slug, sharetribe_id, primary_image_url, title, updated_at").eq("state", "published").eq("is_deleted", false).not("slug", "is", null).not("sharetribe_id", "is", null).order("updated_at", { ascending: false }).range(from, to);
        if (error) {
          console.error("[sitemap-listings] query error", error);
          return sitemapResponse(buildUrlsetXml([]));
        }
        const urls = (data ?? []).filter(
          (r) => !!r?.slug && !!r?.sharetribe_id
        ).map((r) => {
          const u = {
            loc: `${SITE_URL}/l/${r.slug}/${r.sharetribe_id}`,
            lastmod: r.updated_at ?? null
          };
          if (r.primary_image_url) {
            u.images = [{ loc: r.primary_image_url, title: r.title ?? void 0 }];
          }
          return u;
        });
        return sitemapResponse(buildUrlsetXml(urls));
      }
    }
  }
});
const Route$2W = createFileRoute("/sitemap-index.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const Route$2V = createFileRoute("/sitemap-hub.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
createServerFn({
  method: "GET"
}).handler(createSsrRpc("6c0b21a070fb08763de1b76b52dfd646879f4eddf8ad7eed82716c88a9ab9507"));
const getCategoryWithProviders = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1)
}).parse(d)).handler(createSsrRpc("5f44553c02f93f264442f97bfed35d50ecec190e1d65a330478233c3847da65b"));
const getCategoryStateProviders = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1),
  state: z.string().length(2)
}).parse(d)).handler(createSsrRpc("279bb652db45f4ad8c915c922ff2210de5b713d798a1fb27a879823d4a0de284"));
const getCategoryCityProviders = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1),
  state: z.string().length(2),
  city: z.string().min(1)
}).parse(d)).handler(createSsrRpc("05f874bd6f89db40ee4d211bf87ae69042d7b545bdeb1a63b5391de69147b7e3"));
const listCategoryGeoCoverage = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1)
}).parse(d)).handler(createSsrRpc("526aa89d0f80b01cf7d4992cd9902ff8987f8aeb5d56b1b252d71b60daffdbef"));
const ListProviderInput = z.object({
  name: z.string().min(2).max(120),
  primary_category: z.string().min(2),
  city: z.string().min(2).max(80),
  state_code: z.string().length(2),
  website_url: z.string().url().max(300).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().max(160),
  description: z.string().min(20).max(2e3),
  services: z.array(z.string().max(60)).max(20).optional()
});
createServerFn({
  method: "POST"
}).inputValidator((d) => ListProviderInput.parse(d)).handler(createSsrRpc("f26aa7f3b2c7ed27a5e5e5b93e26e41604f098702c9f3bfd569b10604f5e2df2"));
const adminListPendingProviders = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(200).default(50),
  status: z.enum(["pending", "approved", "rejected", "all"]).default("all"),
  search: z.string().trim().max(120).default("")
}).partial().parse(d ?? {})).handler(createSsrRpc("cc3b706532e7174d7edb437ba3ccfbee7d0e7324a45604422fea89b4927a090c"));
const adminScrapeProviderUrl = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url: z.string().url(),
  autoCreate: z.boolean().default(true)
}).parse(d)).handler(createSsrRpc("df19e06b9251ffcdb70e5ee23fc9cd363acf591743a9c419d013473dae6d8426"));
const adminListScrapeJobs = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("c22f1be1fa0767dd471b7b210370a75b37ac8ac72829cfb34dd8726fb338316c"));
const adminImportGscRows = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  rows: z.array(z.object({
    slug: z.string(),
    impressions: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative(),
    position: z.number().nullable().optional(),
    kind: z.enum(["provider", "page"]).optional()
  })).max(5e3)
}).parse(d)).handler(createSsrRpc("603285ad21173c223cffc4d531f00f5725f82a23bda3f346a9d613e255810502"));
const adminGenerateProviderContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("9355e8f5cc6ef6bc87f49f106a89800747716d984b4d4f1f25b3d698bb168c24"));
const adminListProvidersMissingAI = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(100).default(10)
}).parse(d)).handler(createSsrRpc("c525005316a5e2a24ffa9100c6ad44bda5f927d3f01aa63048248e2d977ed481"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(50).default(10),
  onlyMissing: z.boolean().default(true)
}).parse(d)).handler(createSsrRpc("11ca4156ce30d160b183589e976fc837dc8ffb2630f4b8341dfd86ef55bf6cba"));
const adminUpdateProvider = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "publish", "unpublish", "feature", "unfeature", "mark_paid", "mark_unpaid", "delete"])
}).parse(d)).handler(createSsrRpc("498c731d7c4b3fedd8e7813883a64e1985cd4668b37a9222b8273997769103d8"));
const SubmitClaimInput = z.object({
  provider_slug: z.string().min(1).max(120),
  claimer_name: z.string().min(2).max(120),
  claimer_email: z.string().email().max(160),
  claimer_phone: z.string().max(40).optional().or(z.literal("")),
  claimer_role: z.string().max(80).optional().or(z.literal("")),
  business_email: z.string().email().max(160).optional().or(z.literal("")),
  business_phone: z.string().max(40).optional().or(z.literal("")),
  business_website: z.string().url().max(300).optional().or(z.literal("")),
  verification_notes: z.string().max(2e3).optional().or(z.literal("")),
  proposed_name: z.string().max(120).optional().or(z.literal("")),
  proposed_description: z.string().max(3e3).optional().or(z.literal("")),
  proposed_address: z.string().max(300).optional().or(z.literal("")),
  proposed_services: z.array(z.string().max(60)).max(20).optional(),
  source_path: z.string().max(300).optional().or(z.literal(""))
});
createServerFn({
  method: "POST"
}).inputValidator((d) => SubmitClaimInput.parse(d)).handler(createSsrRpc("3aaaec4f664ee02a164fc9f41b10527d13e0494de09916546e6f04db26003b06"));
const adminListProviderClaims = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("ab8e621daef98757eb3a39443207e2b68ac2cda182f34797fa603bc57ad3f4e3"));
const adminReviewProviderClaim = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "delete"]),
  admin_notes: z.string().max(2e3).optional(),
  apply_proposed: z.boolean().optional()
}).parse(d)).handler(createSsrRpc("ee5f8a8bcce0d83c807b27a54adc164fd643714a74f443700fb15cedcc4805b7"));
const SubmitPlanInput = z.object({
  provider_slug: z.string().min(1).max(120),
  requester_name: z.string().min(2).max(120),
  requester_email: z.string().email().max(160),
  requester_phone: z.string().max(40).optional().or(z.literal("")),
  requested_plan: z.enum(["paid", "featured"]),
  payment_method: z.string().max(80).optional().or(z.literal("")),
  payment_reference: z.string().max(200).optional().or(z.literal("")),
  amount_usd: z.number().nonnegative().optional(),
  notes: z.string().max(2e3).optional().or(z.literal("")),
  source_path: z.string().max(300).optional().or(z.literal(""))
});
createServerFn({
  method: "POST"
}).inputValidator((d) => SubmitPlanInput.parse(d)).handler(createSsrRpc("97d059c4d6aa722ad3a77614b08622323e968c000ac76acb3738e0b6caee2493"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120),
  email: z.string().email().max(160).optional()
}).parse(d)).handler(createSsrRpc("0d4872eccf19ad759e2fff9edc8c9e191206b13673f783709b07520bed65bc31"));
const adminListPlanRequests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("f0ffadc94a4cf446b4f1be0d3820a5b4d28edb89e5b740e551f235a7a74f332a"));
const adminReviewPlanRequest = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "delete"]),
  admin_notes: z.string().max(2e3).optional()
}).parse(d)).handler(createSsrRpc("aee9607eec0eef59aec13e133b8ce275a93f7aaf470cc2b83346a15ba2bba7da"));
const Route$2U = createFileRoute("/sitemap-directory.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = [{ loc: `${SITE_URL}/p/pool-pros` }];
        const { data: cats } = await supabaseAdmin.from("service_categories").select("slug, updated_at").eq("is_published", true);
        for (const c of cats ?? []) {
          urls.push({ loc: `${SITE_URL}/p/pool-pros/c/${c.slug}`, lastmod: c.updated_at });
          try {
            const { states } = await listCategoryGeoCoverage({ data: { slug: c.slug } });
            for (const st of states) {
              urls.push({ loc: `${SITE_URL}/p/pool-pros/c/${c.slug}/${st.code.toLowerCase()}` });
              for (const city of st.cities) {
                urls.push({
                  loc: `${SITE_URL}/p/pool-pros/c/${c.slug}/${st.code.toLowerCase()}/${city.slug}`
                });
              }
            }
          } catch (e) {
            console.error("[sitemap-directory] coverage error", c.slug, e);
          }
        }
        const { data: provs } = await supabaseAdmin.from("providers").select("slug, updated_at, hero_image_url, logo_url, name").eq("is_published", true).limit(5e3);
        for (const p of provs ?? []) {
          const img = p.hero_image_url || p.logo_url;
          urls.push({
            loc: `${SITE_URL}/p/pool-pros/${p.slug}`,
            lastmod: p.updated_at,
            images: img ? [{ loc: img, title: p.name }] : void 0
          });
        }
        return sitemapResponse(buildUrlsetXml(urls));
      }
    }
  }
});
const Route$2T = createFileRoute("/sitemap-default.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const PROD_HOST = "poolrentalnearme.com";
const Route$2S = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = (() => {
          try {
            return new URL(request.url).hostname.toLowerCase();
          } catch {
            return "";
          }
        })();
        const isProd = host === PROD_HOST || host === `www.${PROD_HOST}`;
        const body = isProd ? `User-agent: *
Allow: /

# Auth-required marketplace flows (Sharetribe-handled, not for indexing)
Disallow: /admin/
Disallow: /account/
Disallow: /auth/
Disallow: /inbox/
Disallow: /listings
Disallow: /profile-settings
Disallow: /verify/

# Sharetribe public user profiles — thin pages stuck in
# "Crawled — currently not indexed". Block to save crawl budget.
# /l/* (pool listings) stays ALLOWED — those are core marketplace content.
Disallow: /u/

# Internal API endpoints
Disallow: /api/sharetribe/
Disallow: /api/public/track-city-click

# Don't index search query strings (paginated/filtered /s),
# but allow the bare search hub at /s
Allow: /s$
Allow: /s
Disallow: /s?

Sitemap: ${SITE_URL}/sitemap.xml
` : `# Non-production host (${host || "unknown"}): block all crawling.
User-agent: *
Disallow: /
`;
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "X-Robots-Tag": isProd ? "all" : "noindex, nofollow"
          }
        });
      }
    }
  }
});
const Route$2R = createFileRoute("/pools-directory-sitemap.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } }
});
const getHomeData = createServerFn({
  method: "GET"
}).handler(createSsrRpc("946ed872e43e051c3166418ae18f78cd38726d78075996dd9d4bf32abbebaea3"));
const getRouteOriginFromRequest = createServerFn({
  method: "GET"
}).handler(createSsrRpc("32fc2146154ce85cd3c251b27b207df0ab03d4017644c2a9d78c7da9c8f73d07"));
const LOVABLE_HOST_MARKER = "lovable.app";
async function getRouteOrigin() {
  if (typeof window !== "undefined") {
    try {
      const host = window.location.host;
      if (!host) return PROD_ORIGIN;
      if (host.includes(LOVABLE_HOST_MARKER)) return PROD_ORIGIN;
      const proto = window.location.protocol.replace(/:$/, "") || "https";
      return `${proto}://${host}`;
    } catch {
      return PROD_ORIGIN;
    }
  }
  return getRouteOriginFromRequest();
}
function formatDistance(miles) {
  if (!Number.isFinite(miles) || miles < 0) return "";
  if (miles < 0.1) return "<0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
function ListingCard({ listing }) {
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: `/l/${listing.slug}/${listing.id}`,
      className: "group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg",
      children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-[4/3] overflow-hidden bg-muted", children: listing.imageUrl ? /* @__PURE__ */ jsx(
          "img",
          {
            src: listing.imageUrl,
            alt: listing.title,
            loading: "lazy",
            className: "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          }
        ) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: "No image" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "line-clamp-1 text-base font-semibold text-foreground", children: listing.title }),
          (listing.city || listing.state || listing.distanceMiles != null) && /* @__PURE__ */ jsxs("p", { className: "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground", children: [
            (listing.city || listing.state) && /* @__PURE__ */ jsx("span", { children: [listing.city, listing.state].filter(Boolean).join(", ") }),
            listing.distanceMiles != null && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground", children: [
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "📍" }),
              formatDistance(listing.distanceMiles),
              " away"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
            listing.price ? /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-foreground", children: [
              "$",
              (listing.price.amount / 100).toFixed(0),
              " ",
              /* @__PURE__ */ jsx("span", { className: "font-normal text-muted-foreground", children: "/ hour" })
            ] }) : /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsx("span", { className: "inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform group-hover:scale-105", children: "Book now →" })
          ] })
        ] })
      ]
    }
  );
}
function Breadcrumbs({
  items
}) {
  return /* @__PURE__ */ jsx("nav", { "aria-label": "Breadcrumb", className: "text-sm text-muted-foreground", children: /* @__PURE__ */ jsx("ol", { className: "flex flex-wrap items-center gap-2", children: items.map((item, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
    i > 0 && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "/" }),
    i === items.length - 1 ? /* @__PURE__ */ jsx("span", { className: "text-foreground", "aria-current": "page", children: item.name }) : /* @__PURE__ */ jsx(Link, { to: item.path, className: "hover:text-foreground hover:underline", children: item.name })
  ] }, item.path)) }) });
}
class ErrorBoundary extends Component {
  state = { hasError: false, errorMessage: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }
  componentDidCatch(error, info) {
    const label = this.props.name ? `[${this.props.name}]` : "";
    console.error(
      `ErrorBoundary${label} caught:`,
      error,
      info?.componentStack
    );
  }
  reset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== void 0) return this.props.fallback;
      if (this.props.silent) return null;
      return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-16 text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground", children: "Something went wrong loading this section." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Please refresh the page. If this keeps happening, try again in a moment." }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/s",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground",
            children: "Browse pools →"
          }
        )
      ] });
    }
    return this.props.children;
  }
}
const bachelorette = "/fw-assets/bachelorette-BqzzaCzE.webp";
const quinceanera = "/fw-assets/quinceanera-BIXhrzuE.webp";
const photoshoot = "/fw-assets/photoshoot-BK8qQKKZ.webp";
const familyReunion = "/fw-assets/family-reunion-BuA_93Pk.webp";
const sweet16 = "/fw-assets/sweet-16-EoWt33Mj.webp";
const babyShower = "/fw-assets/baby-shower-Et3EWhLt.webp";
const bachelor = "/fw-assets/bachelor-BPNbm74T.webp";
const dogPool = "/fw-assets/dog-pool-CN5SBR-J.webp";
const swimTraining = "/fw-assets/swim-training-DSpSpqjA.webp";
const production = "/fw-assets/production-6R26vVrJ.webp";
const aquaFitness = "/fw-assets/aqua-fitness-IgiKtLw_.webp";
const migrate = "/fw-assets/migrate-D7-b7f-U.webp";
const multiPlatform = "/fw-assets/multi-platform-cA3qKmjf.webp";
const income = "/fw-assets/income-DBx3odJC.webp";
const holiday = "/fw-assets/holiday-FwPZy4Va.webp";
const taxes = "/fw-assets/taxes-C_DsTdZi.webp";
const difficultGuests = "/fw-assets/difficult-guests-COxW65F5.webp";
const hoa = "/fw-assets/hoa-BXv62xOd.webp";
const neighborComplaints = "/fw-assets/neighbor-complaints-SqWn6syp.webp";
const ACADEMY_HERO_MAP = {
  "academy/bachelorette.jpg": bachelorette,
  "academy/quinceanera.jpg": quinceanera,
  "academy/photoshoot.jpg": photoshoot,
  "academy/family-reunion.jpg": familyReunion,
  "academy/sweet-16.jpg": sweet16,
  "academy/baby-shower.jpg": babyShower,
  "academy/bachelor.jpg": bachelor,
  "academy/dog-pool.jpg": dogPool,
  "academy/swim-training.jpg": swimTraining,
  "academy/production.jpg": production,
  "academy/aqua-fitness.jpg": aquaFitness,
  "academy/migrate.jpg": migrate,
  "academy/multi-platform.jpg": multiPlatform,
  "academy/income.jpg": income,
  "academy/holiday.jpg": holiday,
  "academy/taxes.jpg": taxes,
  "academy/difficult-guests.jpg": difficultGuests,
  "academy/hoa.jpg": hoa,
  "academy/neighbor-complaints.jpg": neighborComplaints
};
function resolveAcademyHero(coverUrl) {
  if (!coverUrl) return null;
  if (coverUrl.startsWith("http") || coverUrl.startsWith("/")) return coverUrl;
  return ACADEMY_HERO_MAP[coverUrl] ?? null;
}
function LiteYouTube({
  videoId,
  title,
  className
}) {
  const [activated, setActivated] = useState(false);
  const poster = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl ${className ?? ""}`,
      children: activated ? /* @__PURE__ */ jsx(
        "iframe",
        {
          src,
          title,
          loading: "lazy",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowFullScreen: true,
          className: "absolute inset-0 h-full w-full border-0"
        }
      ) : /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setActivated(true),
          "aria-label": `Play video: ${title}`,
          className: "group absolute inset-0 h-full w-full",
          children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: poster,
                alt: title,
                loading: "lazy",
                className: "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" }),
            /* @__PURE__ */ jsx("span", { className: "absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-2xl transition-transform group-hover:scale-110", children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "ml-1 h-8 w-8 fill-primary", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M8 5v14l11-7z" }) }) })
          ]
        }
      )
    }
  );
}
const fredFull = "/fw-assets/fred-BbXWBvj5.png";
function FredMascot({
  variant = "full",
  className = "",
  alt = "Fred, your pool hosting coach"
}) {
  const src = variant === "full" ? fredFull : fredAvatar;
  return /* @__PURE__ */ jsx(
    "img",
    {
      src,
      alt,
      className,
      loading: "lazy",
      decoding: "async"
    }
  );
}
const FRED_TIPS = [
  "Charge 25% more on holidays. Hosts who don't leave $400-$800 per booking on the table.",
  "Reply within 1 hour or you'll lose the booking. The fastest host usually wins.",
  "Add a $50 cleaning fee and 4-hour minimum. Filters out cheapskates.",
  "5 outdoor photos beat 20 indoor ones. Sunlight sells.",
  "Block off the first hour after a booking. You'll need it for cleanup.",
  "Bachelorette parties pay 2x. Don't ban them — set rules and cash in.",
  "List on PRNM, Swimply, and Peerspace. Hosts on 3 platforms earn 60% more.",
  "Heated pools book year-round in Texas, Arizona, Florida. Worth the gas bill.",
  "Photoshoots and content creators pay the highest hourly rates. Pitch them direct.",
  "$2M liability insurance is included on every PRNM booking. Mention it in your listing."
];
function FloatingFredTip() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("fred-tip-dismissed") === "1") {
      setDismissed(true);
      return;
    }
    setTipIdx(Math.floor(Math.random() * FRED_TIPS.length));
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, []);
  if (dismissed) return null;
  const nextTip = () => setTipIdx((i) => (i + 1) % FRED_TIPS.length);
  const dismiss = () => {
    sessionStorage.setItem("fred-tip-dismissed", "1");
    setDismissed(true);
  };
  return /* @__PURE__ */ jsxs("div", { className: "pointer-events-none fixed bottom-6 right-6 z-40 hidden items-end gap-2 sm:flex", children: [
    open && /* @__PURE__ */ jsxs("div", { className: "pointer-events-auto relative mb-2 max-w-[260px] rounded-2xl border border-border bg-card p-3 pr-7 text-sm shadow-xl sm:max-w-xs", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: dismiss,
          "aria-label": "Dismiss Fred",
          className: "absolute right-1.5 top-1.5 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
          children: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: /* @__PURE__ */ jsx("path", { d: "M18 6L6 18M6 6l12 12" }) })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "mb-1 text-xs font-semibold uppercase tracking-wider text-primary", children: "Fred's tip" }),
      /* @__PURE__ */ jsx("p", { className: "leading-snug text-foreground", children: FRED_TIPS[tipIdx] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: nextTip,
          className: "mt-2 text-xs font-semibold text-primary hover:underline",
          children: "Next tip →"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-border bg-card" })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        "aria-label": open ? "Hide Fred" : "Get a tip from Fred",
        className: "pointer-events-auto h-20 w-20 transition-transform hover:scale-110 active:scale-95 sm:h-24 sm:w-24",
        children: /* @__PURE__ */ jsx(FredMascot, { variant: "full", className: "h-full w-full drop-shadow-lg", alt: "Fred" })
      }
    )
  ] });
}
const heroImage$4 = "/fw-assets/hero-family-pool-B63SS9RY.jpg";
const heroNight = "/fw-assets/hero-night-B_5M-4-s.jpg";
const poolTypeSalt = "/fw-assets/saltwater-Bne5kKVq.jpg";
const poolTypeHeated = "/fw-assets/heated-D7yTcfYN.jpg";
const poolTypeResort = "/fw-assets/resort-style-5crouZuy.jpg";
const poolTypeLap = "/fw-assets/lap-BCkqCoxX.jpg";
const poolTypeHotTub = "/fw-assets/hot-tub-DOYvPFOY.jpg";
const poolTypeKitchen = "/fw-assets/outdoor-kitchen-hJN2iTif.jpg";
const poolTypeFire = "/fw-assets/fire-pit-CRhozOED.jpg";
const poolTypePet = "/fw-assets/pet-friendly-C_g1GP81.jpg";
const poolTypeAccessible = "/fw-assets/accessible-CV1zNF3Z.jpg";
const poolTypeTheater = "/fw-assets/outdoor-theater-B_CrOZVr.jpg";
const poolTypeIndoor = "/fw-assets/indoor-CR7CdfSU.jpg";
const poolTypeInfinity = "/fw-assets/infinity-Cgl0O7nz.jpg";
const PoolWaitlistForm = lazy(
  () => import("./pool-waitlist-form-CtXFsgkt.js").then((m) => ({ default: m.PoolWaitlistForm }))
);
const HIDE_LISTING_RE = /swim\s*spa|aquatic|rehab/i;
const NEARBY_RADIUS_MILES = 500;
const FEATURED_OCCASIONS = [
  { slug: "pool-host-income-modeling-city-by-city-earnings-forecast", title: "Pool host income: city-by-city earnings forecast", img: "academy/income.jpg" },
  { slug: "multi-platform-hosting-cross-listing-prnm-swimply-peerspace", title: "Cross-listing on PRNM, Swimply & Peerspace", img: "academy/multi-platform.jpg" },
  { slug: "migrating-from-swimply-to-prnm-complete-switch-guide", title: "Switching from Swimply to PRNM", img: "academy/migrate.jpg" },
  { slug: "holiday-premium-playbook-memorial-day-july-4th-labor-day-halloween", title: "Holiday premium playbook: charging more on peak days", img: "academy/holiday.jpg" },
  { slug: "photoshoot-content-creator-ugc-pool-hosting", title: "Renting to photoshoots & content creators", img: "academy/photoshoot.jpg" },
  { slug: "aqua-fitness-senior-wellness-therapeutic-class-hosting", title: "Aqua fitness & wellness class hosting", img: "academy/wellness.jpg" }
];
const HOMEPAGE_FAQS = [
  {
    q: "Is the pool host insured if a guest gets hurt?",
    a: "Every confirmed booking on PoolRentalNearMe includes $2M liability insurance for the host, so you're protected if a guest is injured during their reservation. Hosts also get the option to add property damage protection for higher-value pools."
  },
  {
    q: "How do I contact a pool owner before booking?",
    a: "Once you've found a pool you like, message the host directly through the listing page. Hosts typically reply within an hour. You can ask about pool depth, parking, sound rules, and bring-your-own-food policies before you confirm."
  },
  {
    q: "Can strangers really swim in my private pool safely?",
    a: "Yes — and the data is on your side. Swimply has hosted millions of bookings without serious incident, and PRNM bookings include built-in liability coverage, ID-verified guests, security deposits, and clear house rules you set yourself. Most hosts say guests treat the pool more carefully than friends do."
  },
  {
    q: "Is it free for kids and families?",
    a: "Pricing is set per-hour by each host, often with a per-guest fee for groups over a threshold (e.g. 6 guests). Many family-friendly hosts include kids under 12 free. Check each listing's price breakdown before booking."
  }
];
const HOMEPAGE_HERO_IMAGE = heroImage$4;
function HomePageContent({ data }) {
  return /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(HomePageInner, { data }) });
}
function HomePageInner({ data }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const safe = (data && typeof data === "object" ? data : null) ?? {
    cities: [],
    cityCount: 0,
    categories: [],
    listings: [],
    nearby: { city: null, region: null, nearestMiles: null },
    academyHealth: {}
  };
  safe.academyHealth && typeof safe.academyHealth === "object" ? safe.academyHealth : {};
  const visibleOccasions = FEATURED_OCCASIONS;
  const cities = Array.isArray(safe.cities) ? safe.cities : [];
  const cityCount = typeof safe.cityCount === "number" ? safe.cityCount : cities.length;
  void safe.categories;
  const rawListings = Array.isArray(safe.listings) ? safe.listings : [];
  const listings = hydrated ? rawListings : rawListings.map((l) => ({ ...l, distanceMiles: null }));
  const rawNearby = (safe.nearby && typeof safe.nearby === "object" ? safe.nearby : null) ?? {
    city: null,
    region: null,
    nearestMiles: null
  };
  const nearby = hydrated ? rawNearby : { city: null, region: null, nearestMiles: null };
  const hasNearbyPools = nearby.nearestMiles !== null && nearby.nearestMiles <= NEARBY_RADIUS_MILES;
  const showWaitlist = hydrated && nearby.city !== null && (nearby.nearestMiles === null || nearby.nearestMiles > NEARBY_RADIUS_MILES);
  const nearbyLabel = nearby.city ? `${nearby.city}${nearby.region ? `, ${nearby.region}` : ""}` : null;
  const searchHref = nearbyLabel ? `/s?address=${encodeURIComponent(nearbyLabel)}` : "/s";
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs(
        "section",
        {
          "aria-label": "Rent a backyard pool by the hour",
          className: "relative overflow-hidden",
          style: { minHeight: "60vh" },
          children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: heroImage$4,
                alt: "",
                width: 1600,
                height: 1067,
                fetchPriority: "high",
                decoding: "async",
                className: "absolute inset-0 h-full w-full object-cover"
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                "aria-hidden": "true",
                className: "absolute inset-0",
                style: { backgroundColor: "rgba(0,0,0,0.55)" }
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center text-white sm:py-16 lg:py-24", children: [
              /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-extrabold leading-tight tracking-tight drop-shadow-md sm:text-5xl lg:text-6xl", children: [
                "Find the pool ",
                /* @__PURE__ */ jsx("span", { style: { color: "#7fe0ff" }, children: "you’ll fall in love with" }),
                "."
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mx-auto mt-4 max-w-xl text-base font-semibold text-white/95 drop-shadow sm:text-lg", children: "Rent a private pool by the hour, anywhere in America — real neighbors, real backyards, booked in minutes." }),
              /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-col items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "/s",
                    "aria-label": "Find a pool to rent near you",
                    className: "inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] sm:text-lg",
                    style: { backgroundColor: "#0EA5E9" },
                    children: "Find a pool near me  →"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "/p/hosting",
                    "aria-label": "Learn how to list your pool",
                    className: "text-sm font-medium text-white/95 underline-offset-4 hover:underline sm:text-base",
                    children: "Have a pool? List it in 10 minutes →"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "/p/pool-rental-app",
                    "aria-label": "Download the Pool Rental Near Me app",
                    className: "text-sm font-medium text-white/90 underline-offset-4 hover:underline",
                    children: "Get the pool rental app →"
                  }
                )
              ] })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("section", { "aria-label": "We love pool hosts", className: "overflow-hidden text-white", style: { backgroundColor: "#0EA5E9" }, children: [
        /* @__PURE__ */ jsx("p", { className: "mx-auto max-w-3xl px-4 pt-4 text-center text-base font-extrabold", children: "We love pool hosts — it’s why this marketplace is what it is. ❤️ 0% host fees. Hosts keep every dollar." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 w-full overflow-hidden pb-3", children: [
          /* @__PURE__ */ jsx("style", { children: `@keyframes prnmTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}.prnm-ticker{display:inline-block;white-space:nowrap;will-change:transform;animation:prnmTicker 45s linear infinite}@media (prefers-reduced-motion:reduce){.prnm-ticker{animation:none}}` }),
          /* @__PURE__ */ jsx("div", { className: "prnm-ticker text-sm font-bold opacity-95", children: "🏊 Hallico Outdoor Oasis — Spring Hill, TN  ·  🏊 Twin Palms Oasis — Las Vegas, NV  ·  🏊 Nobody Likes A Shady Beach — La Grange, KY  ·  🏊 Richmond Hideout — Richmond, TX  ·  🏊 Backyard Bliss — Union, NJ  ·  🏊 The Backyard Blue — Chestertown, MD  ·  🏊 Hallico Outdoor Oasis — Spring Hill, TN  ·  🏊 Twin Palms Oasis — Las Vegas, NV  ·  🏊 Nobody Likes A Shady Beach — La Grange, KY  ·  🏊 Richmond Hideout — Richmond, TX  ·  🏊 Backyard Bliss — Union, NJ  ·  🏊 The Backyard Blue — Chestertown, MD  ·  " })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "section",
        {
          "aria-label": "Zero percent host fees all of 2026",
          className: "relative overflow-hidden",
          style: { background: "linear-gradient(135deg, #0B4A6F 0%, #0EA5E9 58%, #38BDF8 100%)" },
          children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-10 text-center text-white sm:py-14", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-white/85 sm:text-sm", children: "🌞 100 Days of Summer" }),
            /* @__PURE__ */ jsxs("p", { className: "mx-auto mt-5 max-w-2xl text-xl font-semibold leading-snug text-white sm:text-2xl", children: [
              /* @__PURE__ */ jsx("span", { style: { color: "#FFE08A" }, children: "Thank you." }),
              " To every host and guest who made this community what it is — we’re giving back."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-baseline justify-center gap-3 sm:gap-4", children: [
              /* @__PURE__ */ jsx("s", { className: "text-3xl font-bold text-white/50 decoration-[3px] sm:text-4xl", children: "10%" }),
              /* @__PURE__ */ jsx("span", { className: "text-7xl font-black leading-none tracking-tighter drop-shadow-sm sm:text-8xl", children: "0%" })
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "mt-3 text-2xl font-extrabold uppercase tracking-tight sm:text-4xl", children: "Host Fees — All of 2026" }),
            /* @__PURE__ */ jsx("p", { className: "mx-auto mt-4 max-w-xl text-lg font-semibold text-white sm:text-xl", children: "You keep 100% of every booking. List your pool free." }),
            /* @__PURE__ */ jsx("p", { className: "mx-auto mt-2 max-w-xl text-sm text-white/90 sm:text-base", children: "Plus: 5% guest booking fees all summer — 100 Days of Summer 🌞" }),
            /* @__PURE__ */ jsx("div", { className: "mt-7", children: /* @__PURE__ */ jsx(
              "a",
              {
                href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
                "aria-label": "List your pool for free",
                className: "inline-flex items-center justify-center rounded-full bg-white px-9 py-4 text-base font-bold text-[#0B4A6F] shadow-xl transition-transform hover:scale-[1.03] sm:text-lg",
                children: "List Your Pool  →"
              }
            ) }),
            /* @__PURE__ */ jsxs("p", { className: "mx-auto mt-6 max-w-2xl text-[11px] leading-relaxed text-white/70 sm:text-xs", children: [
              "0% host fees valid through Dec 31, 2026 on all bookings. Guest service fee applies at checkout. Promotional guest fee valid for a limited time.",
              " ",
              /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/legal-and-compliance/terms-of-service-pool-rental-near-me",
                  className: "underline underline-offset-2 hover:text-white",
                  children: "Terms"
                }
              ),
              " ",
              "apply."
            ] })
          ] })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "border-b border-border bg-background", children: /* @__PURE__ */ jsx("p", { className: "mx-auto max-w-5xl px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm", children: "0% host fees through 2026 · $2M Hartford-backed insurance · 100% US-based support" }) }),
      /* @__PURE__ */ jsx("section", { "aria-label": "Two ways to use Pool Rental Near Me", className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Two ways to fall for summer." }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground sm:text-base", children: "Book a swimming pool rental as a guest, or list your private pool and earn $3K–$10K/month as a host." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/s",
              "aria-label": "I'm going swimming — find a pool to rent",
              className: "group relative flex min-h-[260px] flex-col items-start overflow-hidden rounded-xl border border-border bg-secondary/30 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-4xl", "aria-hidden": true, children: "🏖" }),
                /* @__PURE__ */ jsx("h3", { className: "mt-3 text-xl font-semibold text-foreground", children: "I'm going swimming" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Rent a private swimming pool by the hour and find private pools near you — simple, affordable, and the best Saturday your kids will remember this summer." }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "mt-auto inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white",
                    style: { backgroundColor: "#0EA5E9" },
                    children: "Find a pool →"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/p/hosting",
              "aria-label": "I'm sharing my pool — list my pool on Pool Rental Near Me",
              className: "group relative flex min-h-[260px] flex-col items-start overflow-hidden rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
              style: {
                backgroundColor: "#ffb8d9",
                border: "3px dashed #ffd21f",
                color: "#22303c"
              },
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-4xl", "aria-hidden": true, children: "💙" }),
                /* @__PURE__ */ jsx("h3", { className: "mt-3 text-xl font-bold", children: "I'm sharing my pool" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm font-medium", style: { color: "#46323c" }, children: "If you can text a photo, you can host. We set it all up with you — $2M Hartford-backed insurance, 0% host fees through 2026, you keep every dollar. Earn $3K-$10K a month." }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "mt-auto inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white",
                    style: { backgroundColor: "#0EA5E9" },
                    children: "List my pool →"
                  }
                )
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { "aria-label": "Browse pools by occasion", className: "bg-secondary/20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl", children: "Any excuse is a good one to dive in." }),
        /* @__PURE__ */ jsx("div", { className: "mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:gap-4 md:max-w-4xl md:grid-cols-3", children: [
          { emoji: "👰", label: "Bachelorette", href: "/s?event=bachelorette", aria: "bachelorette parties" },
          { emoji: "🎂", label: "Birthday", href: "/s?event=birthday", aria: "birthday parties" },
          { emoji: "👨‍👩‍👧", label: "Family Day", href: "/s?event=family-day", aria: "family days" },
          { emoji: "🏊", label: "Swim Lesson", href: "/s?event=swim-lesson", aria: "swim lessons" },
          { emoji: "🎉", label: "Pool Party", href: "/s?event=pool-party", aria: "pool parties" },
          { emoji: "🌤", label: "Just Tuesday", href: "/s", aria: "any day of the week" }
        ].map((t) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: t.href,
            "aria-label": `Browse pools for ${t.aria}`,
            className: "flex aspect-square max-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md",
            children: [
              /* @__PURE__ */ jsx("span", { className: "text-[36px] leading-none", "aria-hidden": true, children: t.emoji }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-foreground", children: t.label })
            ]
          },
          t.label
        )) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { "aria-label": "Why book with Pool Rental Near Me", className: "border-b border-border bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl gap-6 px-4 py-8 text-center sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: "$2M" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm font-semibold text-foreground", children: "Insurance per booking" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "2× the industry standard" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: "10%" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm font-semibold text-foreground", children: "Flat guest fee" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Lowest of any pool platform" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: "40+" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm font-semibold text-foreground", children: "U.S. states" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "From Austin to Albany" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: "24/7" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm font-semibold text-foreground", children: "Live human support" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Before, during & after" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { "aria-label": "Press", className: "border-b border-border bg-background", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "As featured in" }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://realestate.einnews.com/pr_news/908834379/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "font-serif text-base font-semibold text-foreground/80 transition-colors hover:text-foreground",
            children: "EIN Presswire"
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://natlawreview.com/press-releases/two-truck-drivers-built-national-pool-rental-marketplace-their-hours",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "font-serif text-base font-semibold text-foreground/80 transition-colors hover:text-foreground",
            children: "National Law Review"
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://lifestyle.myeaglecountry.com/story/194280/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours/",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "font-serif text-base font-semibold text-foreground/80 transition-colors hover:text-foreground",
            children: "Eagle Country"
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://lifestyle.kbew98country.com/story/194285/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours/",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "font-serif text-base font-semibold text-foreground/80 transition-colors hover:text-foreground",
            children: "KBEW"
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsx("section", { "aria-label": "Featured pool tour", className: "border-b border-border bg-background", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20", children: /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-10 lg:grid-cols-12", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-7", children: /* @__PURE__ */ jsx(LiteYouTube, { videoId: "jJF_OyufFQs", title: "Tour Katy's Staycation Saltwater Getaway" }) }),
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-wide text-primary", children: "Featured pool" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Tour Katy's Staycation Saltwater Getaway" }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-base text-muted-foreground", children: "Heated saltwater pool, private backyard, room for the whole crew. See what one of our top hosts built — then book it for your next reunion, birthday, or chill Sunday." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-col gap-3 sm:flex-row", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/l/katy-staycation-saltwater-getaway/685b3bd3-1e5d-44b8-9483-5f6452306157",
                className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105",
                children: "Book this pool →"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/s",
                className: "inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary",
                children: "Browse all pools"
              }
            )
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx("section", { className: "relative overflow-hidden border-y border-border bg-gradient-to-br from-primary/5 via-background to-primary/10", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20", children: /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-10 lg:grid-cols-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7", children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: "Free · Only on PRNM" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-start gap-4 sm:gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative flex-shrink-0", children: [
              /* @__PURE__ */ jsx(
                FredMascot,
                {
                  variant: "full",
                  className: "h-32 w-32 drop-shadow-xl sm:h-44 sm:w-44 lg:h-56 lg:w-56"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "absolute -right-2 -top-1 inline-flex items-center rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-950 shadow-md sm:text-xs", children: "Your coach" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl", children: "Learn with Fred — the only Pool Host Academy on the internet." }),
              /* @__PURE__ */ jsxs("div", { className: "relative mt-3 inline-block rounded-2xl bg-card px-4 py-2 text-sm font-medium text-foreground shadow-md ring-1 ring-border sm:text-base", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Hey, I'm Fred." }),
                " I've coached 5,000+ hosts. I'll show you what actually works.",
                /* @__PURE__ */ jsx("div", { className: "absolute -left-1.5 top-4 h-3 w-3 rotate-45 bg-card ring-1 ring-border" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg", children: "135 free classes on safety, pricing, marketing, AI tools, guest experience, and the highest-paying booking niches. No other platform teaches you how to host — Fred wrote the playbook." }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-3 sm:grid-cols-2", children: [
            "Safety & Rescue",
            "Marketing & Pricing",
            "AI & Automation",
            "Occasion Playbooks",
            "Legal & Insurance",
            "Switch from Swimply"
          ].map((t) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-2.5", children: [
            /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary", "aria-hidden": true }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: t })
          ] }, t)) }),
          /* @__PURE__ */ jsx("div", { className: "mt-8 flex flex-wrap gap-3", children: /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/learningacademy",
              className: "inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105",
              children: "Learn with Fred — 135 free classes →"
            }
          ) }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-muted-foreground", children: "100% free · English & Español · No sign-up required" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-5", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: visibleOccasions.slice(0, 4).map((o, idx) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: `/p/course/${o.slug}`,
            className: `group relative overflow-hidden rounded-2xl shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ${idx % 2 === 0 ? "translate-y-4" : ""}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "aspect-square overflow-hidden", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: ACADEMY_HERO_MAP[o.img],
                    alt: `${o.title} hosting course`,
                    className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
                    loading: "lazy"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 bottom-0 p-3", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-white/80", children: "Course" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-white", children: o.title })
              ] })
            ]
          },
          o.slug
        )) }) })
      ] }) }) }),
      showWaitlist ? /* @__PURE__ */ jsx(ErrorBoundary, { name: "PoolWaitlistForm", silent: true, children: /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(
        PoolWaitlistForm,
        {
          nearestMiles: nearby.nearestMiles,
          city: nearby.city,
          region: nearby.region
        }
      ) }) }) : listings.length > 0 && /* @__PURE__ */ jsx(ErrorBoundary, { name: "NearbyListingsSection", silent: true, children: /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: hasNearbyPools && nearbyLabel ? `Pools near ${nearbyLabel}` : "Pools near you" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-xl text-muted-foreground", children: "Real backyards from real hosts. Pick one and you could be poolside this weekend." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/p/la-saltwater-featured",
              className: "group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "aspect-[4/3] overflow-hidden bg-muted", children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: heroNight,
                      alt: "La Saltwater Pool & Spa, Sherman Oaks",
                      loading: "lazy",
                      className: "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-1 text-[11px] font-bold text-black shadow", children: "🏆 Top 9 Pools in LA 2025" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
                  /* @__PURE__ */ jsx("h3", { className: "line-clamp-1 text-base font-semibold text-foreground", children: "La Saltwater Pool & Spa" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Sherman Oaks, CA · Saltwater · Heated spa · Fits 45" }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "PRNM Featured" }),
                    /* @__PURE__ */ jsx("span", { className: "inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform group-hover:scale-105", children: "View pool →" })
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/p/jan",
              className: "group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "aspect-[4/3] overflow-hidden bg-muted", children: [
                  data?.janFeatured?.heroImage ? /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: data.janFeatured.heroImage,
                      alt: "TheSwimpark, Bothell WA",
                      loading: "lazy",
                      className: "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    }
                  ) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-400 to-emerald-500 text-white", children: /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold", children: "TheSwimpark" }) }),
                  /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-1 text-[11px] font-bold text-white shadow", children: "✨ NEW · Newest featured pool" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
                  /* @__PURE__ */ jsx("h3", { className: "line-clamp-1 text-base font-semibold text-foreground", children: "TheSwimpark — hosted by Jan" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Pacific Northwest · 85° heated · Mountain views · Fits 50" }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-primary", children: "Top provider" }),
                    /* @__PURE__ */ jsx("span", { className: "inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform group-hover:scale-105", children: "View pool →" })
                  ] })
                ] })
              ]
            }
          ),
          listings.filter((l) => !HIDE_LISTING_RE.test(l.title || "")).slice(0, 11).map((l) => /* @__PURE__ */ jsx(
            ErrorBoundary,
            {
              name: `ListingCard:${l.id}`,
              fallback: null,
              children: /* @__PURE__ */ jsx(ListingCard, { listing: l })
            },
            l.id
          ))
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 text-center", children: /* @__PURE__ */ jsx(
          "a",
          {
            href: searchHref,
            className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105",
            children: "Find a pool near you →"
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-10 lg:grid-cols-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: [
            "Questions? ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "We've thought of everything." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "The four things first-time renters and hosts ask us most." }),
          /* @__PURE__ */ jsx("div", { className: "mt-8 space-y-3", children: HOMEPAGE_FAQS.map((f, i) => /* @__PURE__ */ jsxs("details", { className: "group rounded-2xl border border-border bg-card p-5 open:shadow-md", children: [
            /* @__PURE__ */ jsxs("summary", { className: "flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground", children: [
              f.q,
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground transition-transform group-open:rotate-45", "aria-hidden": true, children: "+" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: f.a })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-5", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-8 flex h-full min-h-[280px] flex-col items-start justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-8 text-primary-foreground shadow-xl", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold", children: "Talk to a real human." }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-primary-foreground/85", children: "Trying to plan a wedding-weekend takeover or a film shoot? Need a custom quote for a 30-person reunion? Skip the search — we'll help you book it." }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "mailto:hello@poolrentalnearme.com",
              className: "mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-105",
              children: "Contact concierge →"
            }
          )
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { "aria-label": "Resources for pool hosts", className: "border-y border-border bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-wider text-primary", children: "For pool hosts" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Host smarter, host legally." }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Free guides on local laws, permits, HOA rules, taxes, and the day-to-day playbook for renting your pool the right way." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/p/host-advocacy",
              className: "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary", children: "Host advocacy hub" }),
                  /* @__PURE__ */ jsx("h3", { className: "mt-4 text-2xl font-bold text-foreground", children: "State-by-state hosting laws and rights" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "What's allowed where you live, how to handle HOAs and neighbors, and how we fight for hosts when local rules get in the way." })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "mt-6 inline-flex items-center text-sm font-semibold text-primary", children: "Browse 50 state guides →" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/p/blog",
              className: "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/40 via-card to-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground", children: "📝 The blog" }),
                  /* @__PURE__ */ jsx("h3", { className: "mt-4 text-2xl font-bold text-foreground", children: "Honest stories from real pool hosts" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "The good, the awkward, and the lessons learned. Hosting tips, platform deep-dives, and the side of pool rentals nobody else writes about." })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "mt-6 inline-flex items-center text-sm font-semibold text-primary", children: "Read the blog →" })
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(PoolTypeGrid, {}),
      cities.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: [
          "Pool rentals in ",
          cityCount.toLocaleString("en-US"),
          "+ U.S. cities"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-muted-foreground", children: [
          "Find a private pool in your zip code, or browse the full",
          " ",
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/all-locations",
              className: "font-medium text-primary underline-offset-2 hover:underline",
              children: "pool rentals near me"
            }
          ),
          " ",
          "directory."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6", children: cities.map((c) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: `/p/${c.slug}`,
            className: "text-sm text-muted-foreground transition-colors hover:text-primary hover:underline",
            children: [
              c.name,
              ", ",
              c.state_code
            ]
          },
          c.slug
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/s",
              className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90",
              children: "Find a pool near you"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
              className: "inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary",
              children: "List your pool"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/pool-rentals",
              className: "inline-flex items-center justify-center px-2 py-3 text-sm font-semibold text-primary hover:underline",
              children: "Browse all states →"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/p/all-locations",
              className: "inline-flex items-center justify-center px-2 py-3 text-sm font-semibold text-primary hover:underline",
              children: "Pool rentals near me →"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold sm:text-3xl", children: "Got a pool? Turn it into income." }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-primary-foreground/85", children: "Top hosts earn $3,000–$10,000 per month renting their backyard a few hours at a time. Free to list, insured on every booking." })
        ] }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
            className: "inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3 text-base font-semibold text-primary shadow-lg transition-transform hover:scale-105",
            children: "List your pool →"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("section", { "aria-label": "Text the founder and follow Pool Rental Near Me", className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12 sm:px-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl p-7 text-center", style: { backgroundColor: "#ffb8d9", border: "3px dashed #ffd21f" }, children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl", "aria-hidden": true, children: "👋" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-1 text-xl font-extrabold", style: { color: "#22303c" }, children: "Stuck on anything? Text Derek." }),
          /* @__PURE__ */ jsx("p", { className: "mx-auto mt-1 max-w-md text-sm font-medium", style: { color: "#46323c" }, children: "He founded Pool Rental Near Me and answers hosts himself, usually within the hour." }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "sms:+18556178207?&body=" + encodeURIComponent("Hi Derek! I’m looking at Pool Rental Near Me and I have a question."),
              className: "mt-4 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-full bg-white px-6 text-[15px] font-extrabold",
              style: { color: "#0EA5E9" },
              children: "Text Derek"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-border bg-background p-6 text-center shadow-sm", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-extrabold text-foreground", children: "Swim with us everywhere 💙" }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap items-center justify-center gap-2.5", children: [
            ["Facebook", "https://www.facebook.com/poolrentalnearme"],
            ["Instagram", "https://www.instagram.com/poolrentalnearme"],
            ["TikTok", "https://www.tiktok.com/@poolrentalnearme"],
            ["YouTube", "https://www.youtube.com/@poolrentalnearme"],
            ["X", "https://x.com/poolrentalnearme"],
            ["LinkedIn", "https://www.linkedin.com/company/poolrentalnearme"],
            ["Pinterest", "https://www.pinterest.com/poolrentalnearme"]
          ].map(([name, url]) => /* @__PURE__ */ jsx(
            "a",
            {
              href: url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "rounded-full px-4 py-2 text-[13px] font-bold",
              style: { backgroundColor: "#e4f4fc", color: "#0369a1" },
              children: name
            },
            name
          )) }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://apps.apple.com/us/app/pool-rental-near-me-swim-fun/id6737762373",
              onClick: (e) => {
                if (typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)) {
                  e.preventDefault();
                  window.location.href = "https://play.google.com/store/apps/details?id=com.poolrentalnearme.app.prod";
                }
              },
              className: "mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white",
              style: { backgroundColor: "#0b2733" },
              children: "📱 Get the app — it knows your phone"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-[15px] font-extrabold text-foreground", children: "Made with ❤️ for pool people." })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
const POOL_TYPES = [
  { name: "Saltwater Pools", slug: "saltwater", img: poolTypeSalt },
  { name: "Heated Pools", slug: "heated", img: poolTypeHeated },
  { name: "Resort-Style Pools", slug: "resort-style", img: poolTypeResort },
  { name: "Lap Pools", slug: "lap", img: poolTypeLap },
  { name: "Pools with Hot Tubs", slug: "hot-tub", img: poolTypeHotTub },
  { name: "Pools with Outdoor Kitchens", slug: "outdoor-kitchen", img: poolTypeKitchen },
  { name: "Pools with Fire Pits", slug: "fire-pit", img: poolTypeFire },
  { name: "Pet-Friendly Pools", slug: "pet-friendly", img: poolTypePet },
  { name: "Wheelchair-Accessible Pools", slug: "accessible", img: poolTypeAccessible },
  { name: "Pools with Outdoor Theaters", slug: "outdoor-theater", img: poolTypeTheater },
  { name: "Indoor Pools", slug: "indoor", img: poolTypeIndoor },
  { name: "Infinity Pools", slug: "infinity", img: poolTypeInfinity }
];
function PoolTypeGrid() {
  return /* @__PURE__ */ jsx("section", { className: "bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Browse by pool type" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Heated pools, hot tubs, infinity edges, fire pits, outdoor theaters — find your vibe." }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6", children: POOL_TYPES.map((t) => /* @__PURE__ */ jsxs(
      "a",
      {
        href: `/s?pub_category=${encodeURIComponent(t.slug)}`,
        className: "group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-sm ring-1 ring-border transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg",
        children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: t.img,
              alt: t.name,
              loading: "lazy",
              className: "absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 p-3", children: /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold leading-tight text-white drop-shadow", children: t.name }) })
        ]
      },
      t.slug
    )) })
  ] }) });
}
const $$splitComponentImporter$1Z = () => import("./landing-page-3nrATr_w.js");
const EMPTY_HOME_DATA$1 = {
  cities: [],
  cityCount: 0,
  categories: [],
  listings: [],
  nearby: {
    city: null,
    region: null,
    count: 0,
    nearestMiles: null
  },
  academyAvailable: [],
  academyHealth: {}
};
const Route$2Q = createFileRoute("/landing-page")({
  loader: async () => {
    const origin = await getRouteOrigin();
    try {
      const data = await getHomeData() ?? EMPTY_HOME_DATA$1;
      return {
        data,
        origin
      };
    } catch (err) {
      console.error("landing-page loader failed:", err);
      return {
        data: EMPTY_HOME_DATA$1,
        origin
      };
    }
  },
  // This route is reverse-proxied at https://www.poolrentalnearme.com/.
  // The browser URL is `/` while the upstream HTML is for `/landing-page`,
  // which makes any data-driven first render risk a hydration mismatch.
  // We render a deterministic empty shell on both server and first client
  // render, then fetch live data in an effect post-hydration.
  head: ({
    loaderData
  }) => {
    const origin = loaderData?.origin;
    const meta = buildMeta({
      title: "Pool Rental Near Me — Rent a Private Pool by the Hour",
      description: "Find and book private pool rentals near you. Heated pools, hot tubs, and luxury backyards. Hourly bookings with $2M liability insurance included.",
      path: "/landing-page",
      // Reverse proxy serves this upstream at https://www.poolrentalnearme.com/.
      // Canonicalize to the root so Google never indexes /landing-page as a
      // separate page competing with /.
      canonicalPath: "/",
      image: HOMEPAGE_HERO_IMAGE,
      origin
    });
    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME$3,
      url: SITE_URL,
      sameAs: ["https://www.poolrentalnearme.com"]
    };
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOMEPAGE_FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a
        }
      }))
    };
    return {
      ...meta,
      scripts: [ldJsonScript(org), ldJsonScript(faqLd)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1Z, "component")
});
const Route$2P = createFileRoute("/jobs.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = getCanonicalOrigin(request);
        const { data: pages } = await supabaseAdmin.from("content_pages").select("slug,url_path,title,seo_title,seo_description,template_type,updated_at").in("template_type", ["host_acq_city"]).eq("status", "published").limit(5e3);
        const rows = pages ?? [];
        const now = (/* @__PURE__ */ new Date()).toUTCString();
        const jobs = [];
        for (const p of rows) {
          const citySlug = cityForContentPage(p.template_type, p.slug);
          if (!citySlug) continue;
          const { city, stateCode } = parseCitySlug$1(citySlug);
          if (!city) continue;
          const seed = p.slug ?? p.url_path ?? city;
          const slugHash = seed.split("").reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 0);
          const dayOffset = Math.abs(slugHash) % 30;
          const posted = /* @__PURE__ */ new Date();
          posted.setUTCHours(0, 0, 0, 0);
          posted.setUTCDate(posted.getUTCDate() - dayOffset);
          const expires = new Date(posted);
          expires.setUTCDate(expires.getUTCDate() + 60);
          const refnum = `prnm-host-${seed}`;
          const url = `${origin}${p.url_path}`;
          const title = `Rent your backyard pool in ${city}, ${stateCode} — earn $40–$150/hour`;
          const desc = `<p>Turn your backyard pool in ${city}, ${stateCode} into income. ${SITE_NAME$3} connects pool owners with local guests who book by the hour. Typical hosts earn $40–$150/hour depending on pool size and amenities.</p>
<h3>What you do</h3>
<ul>
<li>List your pool with photos and an hourly rate you control</li>
<li>Approve booking requests on your own schedule</li>
<li>Welcome guests, then get paid</li>
</ul>
<h3>What we include</h3>
<ul>
<li>$2,000,000 liability insurance on every booking</li>
<li>0% host fees through 2026 (lower than Swimply's 15%+)</li>
<li>Guest verification and secure payouts</li>
</ul>
<h3>Requirements</h3>
<ul>
<li>You own (or have permission to rent) a residential pool in or near ${city}</li>
<li>Pool is clean, safe, and accessible to guests</li>
<li>You can respond to booking requests within 24 hours</li>
</ul>
<p><strong>This is an independent income opportunity, not W2 employment.</strong> You set your own schedule, rates, and house rules.</p>
<p><a href="${url}">Apply / list your pool ${city}</a></p>`;
          jobs.push(`<job>
<title><![CDATA[${title}]]></title>
<date><![CDATA[${posted.toUTCString()}]]></date>
<referencenumber><![CDATA[${refnum}]]></referencenumber>
<expirationdate><![CDATA[${expires.toUTCString()}]]></expirationdate>
<url><![CDATA[${url}?source=jobsxml]]></url>
<company><![CDATA[${SITE_NAME$3}]]></company>
<sourcename><![CDATA[${SITE_NAME$3}]]></sourcename>
<city><![CDATA[${city}]]></city>
<state><![CDATA[${stateCode}]]></state>
<country>US</country>
<postalcode></postalcode>
<description><![CDATA[${desc}]]></description>
<salary><![CDATA[$40-$150/hour]]></salary>
<education><![CDATA[None]]></education>
<jobtype>contract</jobtype>
<category>Income Opportunity</category>
<experience><![CDATA[Entry level]]></experience>
<remotetype>On-site</remotetype>
</job>`);
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
<publisher><![CDATA[${SITE_NAME$3}]]></publisher>
<publisherurl><![CDATA[${origin}]]></publisherurl>
<lastBuildDate><![CDATA[${now}]]></lastBuildDate>
${jobs.join("\n")}
</source>`;
        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=21600"
          }
        });
      }
    }
  }
});
const Route$2O = createFileRoute("/blog")({
  server: {
    handlers: {
      GET: () => redirect301("/p/blog", SITE_URL)
    }
  }
});
const checkAdminRole = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("71074beb2f431503bd63e12e77a9bb17a2f1cc767377df27e8b65871bcf78ae0"));
const DEFAULT_REDIRECT = "/account/learning";
async function resolveRedirect(requested) {
  if (requested !== DEFAULT_REDIRECT) return requested;
  try {
    const r = await checkAdminRole();
    if (r?.isAdmin) return "/admin/dashboard";
  } catch {
  }
  return requested;
}
const $$splitComponentImporter$1Y = () => import("./auth-CbwwL8P2.js");
const SAFE_PATH = /^\/(?!\/|\\)[^\s]*$/;
const safeRedirect = (v) => {
  if (typeof v !== "string") return "/account/learning";
  if (!SAFE_PATH.test(v) || v.includes("://")) return "/account/learning";
  return v;
};
const SearchSchema = z.object({
  redirect: z.preprocess(safeRedirect, z.string()).default("/account/learning"),
  mode: z.enum(["signin", "signup"]).optional().default("signin")
});
const Route$2N = createFileRoute("/auth")({
  validateSearch: zodValidator(SearchSchema),
  beforeLoad: async ({
    search
  }) => {
    const {
      data
    } = await supabase.auth.getUser();
    if (data.user) {
      const dest = await resolveRedirect(search.redirect);
      throw redirect({
        to: dest
      });
    }
  },
  component: lazyRouteComponent($$splitComponentImporter$1Y, "component"),
  head: () => ({
    meta: [{
      title: "Sign in or create an account — Pool Rental Near Me Academy"
    }, {
      name: "description",
      content: "Sign in to track your Pool Rental Near Me Academy progress and earn certificates."
    }]
  })
});
const Route$2M = createFileRoute("/affiliate")({
  beforeLoad: () => {
    throw redirect({ to: "/p/affiliate-dashboard" });
  }
});
const $$splitComponentImporter$1X = () => import("./admin-BFsOu0JM.js");
const Route$2L = createFileRoute("/admin")({
  beforeLoad: async ({
    location
  }) => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/admin") {
      throw redirect({
        to: "/admin/dashboard",
        replace: true
      });
    }
    if (path === "/admin/no-access") return;
    let userId = null;
    try {
      const {
        data
      } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }
    if (!userId) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.pathname,
          mode: "signin"
        }
      });
    }
    try {
      const {
        isAdmin
      } = await checkAdminRole();
      if (!isAdmin) throw redirect({
        to: "/admin/no-access"
      });
    } catch (e) {
      if (e?.isRedirect) throw e;
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.pathname,
          mode: "signin"
        }
      });
    }
  },
  head: () => ({
    meta: [
      // iOS: launch full-screen with no Safari chrome when saved to Home Screen
      {
        name: "apple-mobile-web-app-capable",
        content: "yes"
      },
      {
        name: "mobile-web-app-capable",
        content: "yes"
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent"
      },
      {
        name: "apple-mobile-web-app-title",
        content: "PRNM Admin"
      },
      {
        name: "theme-color",
        content: "#0ea5e9"
      },
      {
        name: "robots",
        content: "noindex,nofollow"
      }
    ],
    links: [{
      rel: "manifest",
      href: "/admin-manifest.webmanifest"
    }, {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1X, "component")
});
const $$splitComponentImporter$1W = () => import("./index-Dke4RGJH.js");
const EMPTY_HOME_DATA = {
  cities: [],
  cityCount: 0,
  categories: [],
  listings: [],
  nearby: {
    city: null,
    region: null,
    count: 0,
    nearestMiles: null
  },
  academyAvailable: [],
  academyHealth: {}
};
const Route$2K = createFileRoute("/")({
  loader: async () => {
    try {
      return await getHomeData() ?? EMPTY_HOME_DATA;
    } catch (err) {
      console.error("index loader failed:", err);
      return EMPTY_HOME_DATA;
    }
  },
  head: () => {
    const meta = buildMeta({
      title: "Pool Rental Near Me: Rent a Private Pool by the Hour",
      description: "Find and book a private pool for rent by the hour. Heated pools, hot tubs, and luxury backyards. Swimming pool rental with $2M liability insurance included.",
      path: "/",
      // Indexability is controlled by the X-Robots-Tag HTTP header in src/start.ts
      // (preview hosts get noindex; production www.poolrentalnearme.com is indexable).
      // Do NOT add a noindex meta tag here — it would deindex the production homepage.
      image: HOMEPAGE_HERO_IMAGE
    });
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOMEPAGE_FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a
        }
      }))
    };
    return {
      ...meta,
      links: [
        ...meta.links ?? [],
        // Preload the LCP hero (CSS background-image) so the browser fetches
        // it in parallel with stylesheet parsing instead of discovering it
        // only after CSS is applied.
        {
          rel: "preload",
          as: "image",
          href: HOMEPAGE_HERO_IMAGE,
          fetchpriority: "high"
        },
        // Speed up navigation to the Sharetribe marketplace search page.
        {
          rel: "prefetch",
          href: "/s"
        },
        // Warm up the connection to the imgix CDN that serves listing photos
        // (hero image + every featured-listing thumbnail).
        {
          rel: "preconnect",
          href: "https://sharetribe.imgix.net",
          crossOrigin: ""
        }
      ],
      scripts: [ldJsonScript(faqLd)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1W, "component")
});
const SlugInput = z.object({
  course_slug: z.string().min(1).max(120)
});
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => SlugInput.parse(input)).handler(createSsrRpc("afac8bfe3154b7457c0db8b9e08466da974975f534e76a53513642ddb73adf4b"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => SlugInput.parse(input)).handler(createSsrRpc("dfde4fa660570864703719cf860047fc23c67875bd40bfd03034d595792652e5"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => SlugInput.parse(input)).handler(createSsrRpc("9f66b1ab0dfa44ad4bfce93f6d4651d0b255f149641cc2a1d38197880a889f48"));
const HeartbeatInput = z.object({
  course_slug: z.string().min(1).max(120),
  seconds_delta: z.number().int().min(1).max(120),
  // cap per ping
  expected_minutes: z.number().int().min(1).max(600).optional()
});
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => HeartbeatInput.parse(input)).handler(createSsrRpc("4932e8049137a0c68fcd0c502a9ba97bcdf61f39ceb22ce98be6986be3c44902"));
const LogEventInput = z.object({
  course_slug: z.string().min(1).max(120),
  event_type: z.enum(["mark_complete_clicked", "certificate_downloaded", "certificate_verified", "resumed", "progress_updated"]),
  metadata: z.record(z.string(), z.unknown()).optional()
});
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => LogEventInput.parse(input)).handler(createSsrRpc("72e184fb111cf2c1c9cedf0c8d37df0f11c74914f1412e1bc5d0663dca09c3b6"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => SlugInput.parse(input)).handler(createSsrRpc("02e21d1616191cc60af89621448091dda8d9055192d4874fdc05e4bf180ffbac"));
const listMyProgress = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("6ff6acd7fec4aa821745b01f6bb55b9cb8715ded6ff746e0a0fa4a69a5fca9d7"));
const adminGetCourseSummary = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("06b78fe09a0da92572bf55b5e9eb09bb5037bb40b5df2773391bbf2b91140bd8"));
const adminListLearners = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("f0ad419ab02c5dbdf80964f35052b8107ec9bfca80b84033c194f670f5327c97"));
const adminGetLearnerDetail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  user_id: z.string().uuid()
}).parse(input)).handler(createSsrRpc("7a4992e2888b2164eada30c13e302f362c546163880609baa0016d7c153a9421"));
const listMyLearning = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("24ba682363f7014edc4d8dacd6fe835b82e127123292d0a671e973afbac3f435"));
const verifyCertificate = createServerFn({
  method: "POST"
}).inputValidator((input) => z.object({
  certificate_uid: z.string().min(4).max(40)
}).parse(input)).handler(createSsrRpc("527352d4978d7394473053acb19c293f29c6b941b12799fa668b092f2debd786"));
const $$splitNotFoundComponentImporter$b = () => import("./verify._uid-C-NUPYuo.js");
const $$splitComponentImporter$1V = () => import("./verify._uid-B0RRfdRg.js");
const Route$2J = createFileRoute("/verify/$uid")({
  loader: async ({
    params
  }) => {
    const result = await verifyCertificate({
      data: {
        certificate_uid: params.uid
      }
    });
    if (!result.found) throw notFound();
    return {
      cert: result
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1V, "component"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$b, "notFoundComponent"),
  head: ({
    params
  }) => ({
    meta: [{
      title: `Verify certificate ${params.uid} — Pool Rental Near Me`
    }]
  })
});
const LEGACY_REDIRECTS = {
  // /for-guests/*
  "/for-guests/understanding-reviews-and-ratings": "/p/how-it-works",
  "/for-guests/what-to-bring-to-a-pool-rental": "/p/how-it-works",
  // /for-hosts/*
  "/for-hosts/collecting-and-responding-to-reviews": "/p/hosting",
  "/for-hosts/revenue-optimization-for-hosts": "/p/hosting",
  "/for-hosts/what-to-include-in-your-pool-listing": "/p/hosting",
  // /guest-information/*
  "/guest-information/accessibility-and-special-requests": "/p/how-it-works",
  "/guest-information/cancellation-and-refund-policy-for-guests": "/p/how-it-works",
  "/guest-information/how-to-search-and-book-a-pool": "/p/how-it-works",
  "/guest-information/understanding-reviews-and-ratings": "/p/how-it-works",
  // /host-information/*
  "/host-information/preparing-your-pool-for-guests": "/p/hosting",
  // /legal-and-compliance/*
  "/legal-and-compliance/host-insurance-requirements-poolrentalnearme-com": "/p/insurance-guide-for-pool-owners",
  "/legal-and-compliance/liability-guide-for-hosts-and-guests-poolrentalnearme-com": "/p/insurance-guide-for-pool-owners",
  "/legal-and-compliance/privacy-policy-pool-rental-near-me": "/p/privacy-policy",
  "/legal-and-compliance/terms-of-service-pool-rental-near-me": "/p/terms-of-service",
  // /marketing-and-growth/*
  "/marketing-and-growth/local-seo-for-pool-hosts-poolrentalnearme-com": "/p/hosting",
  "/marketing-and-growth/partnerships-and-local-promotions-poolrentalnearme-com": "/p/hosting",
  "/marketing-and-growth/seasonal-marketing-strategies-poolrentalnearme-com": "/p/hosting",
  // /pool-management/*
  "/pool-management/cleaning-between-guests": "/p/hosting",
  "/pool-management/water-testing-and-chemical-balance-poolrentalnearme-com": "/p/hosting",
  "/pool-management/weather-and-storm-preparations-poolrentalnearme-com": "/p/hosting",
  // /technical-support/*
  "/technical-support/account-creation-and-verification-poolrentalnearme-com": "/",
  "/technical-support/password-and-login-help-poolrentalnearme-com": "/",
  "/technical-support/troubleshooting-booking-issues-poolrentalnearme-com": "/",
  "/technical-support/updating-your-profile-and-settings-poolrentalnearme-com": "/"
};
const LEGACY_PREFIX_FALLBACKS = {
  "for-guests": "/p/how-it-works",
  "for-hosts": "/p/hosting",
  "guest-information": "/p/how-it-works",
  "host-information": "/p/hosting",
  "legal-and-compliance": "/p/privacy-policy",
  "marketing-and-growth": "/p/hosting",
  "pool-management": "/p/hosting",
  "technical-support": "/"
};
function resolveLegacyRedirect(prefix, splat) {
  const path = `/${prefix}/${splat}`.replace(/\/+$/, "");
  return LEGACY_REDIRECTS[path] ?? LEGACY_PREFIX_FALLBACKS[prefix] ?? "/";
}
function legacyRedirectResponse(target, origin) {
  return new Response(null, {
    status: 301,
    headers: {
      Location: target.startsWith("http") ? target : `${origin}${target}`,
      "Cache-Control": "public, max-age=86400"
    }
  });
}
const Route$2I = createFileRoute("/technical-support/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = params._splat ?? "";
        const target = resolveLegacyRedirect("technical-support", splat);
        return legacyRedirectResponse(target, SITE_URL);
      }
    }
  }
});
const Route$2H = createFileRoute("/pool-management/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = params._splat ?? "";
        const target = resolveLegacyRedirect("pool-management", splat);
        return legacyRedirectResponse(target, SITE_URL);
      }
    }
  }
});
const PATH$o = "/p/waiver-generator";
const FAQS$d = [{
  q: "What is a pool rental liability waiver?",
  a: "It's a short legal document a guest signs before swimming that acknowledges the risks of pool use and waives certain claims against the host. Every serious pool host uses one."
}, {
  q: "Is the waiver generator free?",
  a: "Yes. The hosted, sign-on-phone waiver is free for Pool Rental Near Me hosts. The standalone product at RentalWaivers.com offers extras like custom branding and unlimited industries."
}, {
  q: "Is a digital waiver legally enforceable?",
  a: "Yes — when it's signed, time-stamped, and stored with the guest's identifying info. Our waiver captures all three and stores a PDF on your account for every booking."
}, {
  q: "Does the waiver work in every state?",
  a: "The base language works nationwide and the generator adjusts for state-specific quirks (California, Texas, Florida, New York). For unusual rules, check with a local attorney."
}, {
  q: "What if my guest refuses to sign?",
  a: "Don't host them. Refusing a standard liability waiver is the single strongest predictor of a problem booking. Our cancellation policy supports declining for unsigned waivers."
}];
const BREADCRUMBS$6 = [{
  name: "Home",
  path: "/"
}, {
  name: "Host Tools",
  path: "/p/free-host-tools"
}, {
  name: "Waiver generator",
  path: PATH$o
}];
const heroImage$3 = "/fw-assets/host-pro-hero-Byp59dwp.jpg";
const $$splitComponentImporter$1U = () => import("./p.waiver-generator-DF1Ap10F.js");
const PUBLISHED$6 = "2026-05-23T00:00:00Z";
const MODIFIED$6 = "2026-05-23T00:00:00Z";
const TITLE$p = "Pool waiver generator: free digital liability waivers for hosts | Pool Rental Near Me";
const DESCRIPTION$p = "Free pool waiver generator. Create a digital liability waiver every guest signs on their phone before arrival. State-aware language, PDF copies, host-ready.";
const Route$2G = createFileRoute("/p/waiver-generator")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$p,
      description: DESCRIPTION$p,
      path: PATH$o,
      type: "article",
      image: `${SITE_URL}${heroImage$3}`
    });
    return {
      meta: [...meta.meta, {
        property: "article:published_time",
        content: PUBLISHED$6
      }, {
        property: "article:modified_time",
        content: MODIFIED$6
      }, {
        property: "article:author",
        content: "Pool Rental Near Me"
      }],
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1(BREADCRUMBS$6)), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS$d.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1U, "component")
});
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const Route$2F = createFileRoute("/p/waitlist-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const email = String(body?.email ?? "").trim().toLowerCase();
        const city = body?.city ? String(body.city).slice(0, 160) : null;
        const allowedSources = /* @__PURE__ */ new Set(["zero_results_search", "more_pools_banner"]);
        const reqSource = typeof body?.source === "string" ? body.source : "";
        const source = allowedSources.has(reqSource) ? reqSource : "zero_results_search";
        if (!EMAIL_RE.test(email) || email.length > 254) {
          return Response.json({ error: "Please enter a valid email." }, { status: 400 });
        }
        const userAgent = (request.headers.get("user-agent") || "").slice(0, 300) || null;
        const { error } = await supabaseAdmin.from("pool_waitlist").insert({ email, city, source, user_agent: userAgent });
        if (error) {
          console.error("waitlist-signup insert failed:", error);
          return Response.json({ error: "Could not save your email. Please try again." }, { status: 500 });
        }
        try {
          await sendTransactionalEmailServer({
            templateName: "pool-waitlist-confirmation",
            recipientEmail: email,
            idempotencyKey: `zrs-${email}`,
            templateData: { city, region: null, nearestMiles: null }
          });
        } catch (e) {
          console.error("waitlist-signup confirmation email failed:", e);
        }
        try {
          await sendTransactionalEmailServer({
            templateName: "internal-lead-notification",
            recipientEmail: "hello@poolrentalnearme.com",
            idempotencyKey: `zrs-notify-${email}-${Date.now()}`,
            templateData: {
              formType: "Zero-results search (host acquisition)",
              submitterEmail: email,
              city,
              source
            }
          });
        } catch (e) {
          console.error("waitlist-signup internal notification failed:", e);
        }
        return Response.json({ ok: true });
      }
    }
  }
});
const faqs$5 = [{
  q: "How much does Swimply take from hosts?",
  a: "Swimply's published Host Service Fee article states hosts keep 70–80% of earnings, meaning Swimply's host take is roughly 20–30% depending on location, regulatory and risk factors. PRNM charges a flat 0% host commission through 2026 — you keep 100% — with a guest service fee applied at checkout."
}, {
  q: "Is Pool Rental Near Me really cheaper than Swimply?",
  a: "Compare the published numbers. Swimply's hosts keep 70–80% of earnings; PRNM hosts keep 100% of the booking subtotal through 2026. On a $200 booking that’s the full $200 in your pocket — roughly $40–$60 more than Swimply, every booking."
}, {
  q: "What insurance does Swimply provide vs Pool Rental Near Me?",
  a: "Swimply's published Protection Guarantee provides up to $1,000,000 USD per occurrence in liability protection plus up to $10,000 in property damage protection, secondary to the host's homeowners policy. PRNM's Business Owner's Policy through Hartford Underwriters provides $2,000,000 per-occurrence / $4M aggregate general liability, $10,000 medical expenses per person, and a $150,000 STRETCH® PLUS property coverage blanket — also secondary to your homeowners policy."
}, {
  q: "Can I list my pool on both Swimply and PRNM?",
  a: "Yes. Most hosts maintain listings on both platforms to maximize bookings while they evaluate which one performs better in their market. PRNM does not require exclusivity."
}, {
  q: "Does Swimply offer training like the Pool Host Academy?",
  a: "Swimply maintains a host blog and help articles. PRNM's Pool Host Academy is a structured library of 70+ free courses spanning safety, legal compliance, marketing, revenue optimization and HOA navigation — all free to PRNM hosts."
}, {
  q: "Does Swimply have more pools than Pool Rental Near Me?",
  a: "In several flagship metros (Los Angeles, Phoenix, Miami, NYC/NJ) Swimply has been operating since 2018 and has more brand recognition. PRNM is growing across 40+ states and continues to onboard hosts in those same cities. New hosts often choose PRNM for the lower fee structure, larger insurance coverage and free training library."
}, {
  q: "How do I switch from Swimply to Pool Rental Near Me?",
  a: "Create your free PRNM listing at poolrentalnearme.com/p/start-hosting using the same photos, capacity and rules you already have. You don't have to remove your Swimply listing — most hosts run both for a few months and make the call based on bookings and earnings."
}, {
  q: "Is Swimply or PRNM better for new pool hosts?",
  a: "If you want the lowest published fees, the largest insurance limits and structured training, PRNM is the easier place to start. If you're in a Swimply-mature metro and want immediate brand-driven traffic, list on both and let bookings decide."
}];
function ComparisonPage({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14", children: [
      /* @__PURE__ */ jsxs("nav", { className: "mb-6 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-primary", children: "Home" }),
        /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
        /* @__PURE__ */ jsx("span", { children: "Compare" }),
        /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
        /* @__PURE__ */ jsx("span", { className: "text-foreground", children: title })
      ] }),
      /* @__PURE__ */ jsx(
        "article",
        {
          className: "prose prose-slate max-w-none text-foreground\n            prose-headings:font-semibold prose-headings:tracking-tight\n            prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:mb-6\n            prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2\n            prose-h3:mt-8 prose-h3:text-xl\n            prose-p:leading-relaxed\n            prose-a:text-primary hover:prose-a:underline\n            prose-strong:text-foreground\n            prose-ul:my-4 prose-li:my-1.5\n            prose-blockquote:border-l-primary prose-blockquote:bg-muted/40 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic\n            dark:prose-invert",
          children
        }
      )
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function CTAPrimary() {
  return /* @__PURE__ */ jsxs("div", { className: "not-prose my-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center", children: [
    /* @__PURE__ */ jsx(
      "a",
      {
        href: "/p/start-hosting",
        className: "inline-block rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90",
        children: "🏊 List Your Pool Free →"
      }
    ),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm font-medium text-foreground", children: "Keep 100% · $2M Insurance · 70+ Free Courses · You Control Everything" })
  ] });
}
function CTAMid() {
  return /* @__PURE__ */ jsxs("div", { className: "not-prose my-8 grid gap-3 sm:grid-cols-2", children: [
    /* @__PURE__ */ jsx(
      "a",
      {
        href: "/p/learningacademy",
        className: "rounded-xl border border-border bg-card p-5 text-center font-semibold text-foreground shadow-sm transition hover:border-primary hover:bg-primary/5",
        children: "📚 Browse 70+ Free Pool Host Courses →"
      }
    ),
    /* @__PURE__ */ jsx(
      "a",
      {
        href: "https://go.poolrentalnearme.com/app",
        className: "rounded-xl border border-border bg-card p-5 text-center font-semibold text-foreground shadow-sm transition hover:border-primary hover:bg-primary/5",
        children: "📲 Download the PRNM App →"
      }
    )
  ] });
}
function LastUpdated({ date }) {
  return /* @__PURE__ */ jsxs("p", { className: "not-prose -mt-2 mb-6 text-xs text-muted-foreground", children: [
    /* @__PURE__ */ jsxs("time", { dateTime: date, children: [
      "Last updated: ",
      new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    ] }),
    " · ",
    "Reviewed by Derek Bowen, Founder & CEO, PRNM Corp"
  ] });
}
function HartfordKnockout({
  competitor,
  secondSentence
}) {
  return /* @__PURE__ */ jsx("div", { className: "not-prose my-6 rounded-xl border-l-4 border-primary bg-primary/5 p-4", children: /* @__PURE__ */ jsxs("p", { className: "m-0 text-sm leading-relaxed text-foreground", children: [
    /* @__PURE__ */ jsx("strong", { children: "Pool Rental Near Me's $2M per-occurrence / $4M aggregate general liability is carrier-backed third-party insurance" }),
    " ",
    "underwritten by ",
    /* @__PURE__ */ jsx("strong", { children: "Hartford Underwriters Insurance Company" }),
    ". ",
    secondSentence,
    " ",
    /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
      "(Coverage comparison verified May 2026; check ",
      competitor,
      "'s current published terms before listing.)"
    ] })
  ] }) });
}
function RelatedCompares({ items }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("h2", { children: "See also" }),
    /* @__PURE__ */ jsx("ul", { children: items.map((it) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", { href: it.href, children: [
      "See also: ",
      it.label
    ] }) }, it.href)) })
  ] });
}
function organizationJsonLd() {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Pool Rental Near Me",
      url: "https://www.poolrentalnearme.com",
      telephone: "+1-888-940-4247",
      sameAs: [
        "https://www.facebook.com/poolrentalnearme",
        "https://www.instagram.com/poolrentalnearme",
        "https://x.com/poolrentalnearme",
        "https://www.linkedin.com/company/pool-rental-near-me"
      ]
    })
  };
}
function AuthorBlock() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("h2", { children: "About the Author" }),
    /* @__PURE__ */ jsxs("p", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Derek Bowen" }),
      " is the founder and CEO of PRNM Corp, the parent company behind Pool Rental Near Me. A lifelong entrepreneur with 20+ years of marketplace and e-commerce experience, Derek launched Pool Rental Near Me to give pool owners a host-first alternative to high-fee competitors. He is the author of multiple Amazon-published books on pool hosting, including ",
      /* @__PURE__ */ jsx("em", { children: "Pool Host Riches" }),
      ",",
      " ",
      /* @__PURE__ */ jsx("em", { children: "The Backyard Entrepreneur" }),
      ", and the Pool Host Academy companion guides."
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Connect:",
      " ",
      /* @__PURE__ */ jsx("a", { href: "https://www.linkedin.com/in/derekcbowen/", children: "LinkedIn" }),
      " ·",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/p/learningacademy", children: "Pool Host Academy" })
    ] })
  ] });
}
function FooterBlock({ city }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("h2", { children: "🌐 Connect with Pool Rental Near Me" }),
    /* @__PURE__ */ jsxs("ul", { children: [
      /* @__PURE__ */ jsxs("li", { children: [
        "📸 ",
        /* @__PURE__ */ jsx("strong", { children: "Instagram:" }),
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://www.instagram.com/poolrentalnearme", children: "@poolrentalnearme" })
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "👍 ",
        /* @__PURE__ */ jsx("strong", { children: "Facebook:" }),
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://www.facebook.com/poolrentalnearme", children: "/poolrentalnearme" })
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "💼 ",
        /* @__PURE__ */ jsx("strong", { children: "LinkedIn:" }),
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://www.linkedin.com/in/derekcbowen/", children: "Derek Bowen" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx(CTAPrimary, {}),
    /* @__PURE__ */ jsxs("p", { children: [
      /* @__PURE__ */ jsx("strong", { children: "Contact:" }),
      " 888-940-4247 (10am – 5pm PST) ·",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:support@poolrentalnearme.com", children: "support@poolrentalnearme.com" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "© 2026 PRNM Corp. All rights reserved. ·",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/p/privacy-policy", children: "Privacy Policy" }),
      " ·",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/p/terms-of-service", children: "Terms of Service" })
    ] })
  ] });
}
function buildComparisonMeta(opts) {
  const url = `${SITE_URL}/p/${opts.slug}`;
  const ogImage = DEFAULT_OG_IMAGE.startsWith("/") ? `${SITE_URL}${DEFAULT_OG_IMAGE}` : DEFAULT_OG_IMAGE;
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: opts.title },
      { name: "twitter:description", content: opts.description },
      { name: "twitter:image", content: ogImage },
      { name: "robots", content: "index,follow" }
    ],
    links: [{ rel: "canonical", href: url }]
  };
}
function faqJsonLd$3(faqs2) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs2.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    })
  };
}
function FAQList({ faqs: faqs2 }) {
  return /* @__PURE__ */ jsx(Fragment, { children: faqs2.map((f, i) => /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h3", { children: f.q }),
    /* @__PURE__ */ jsx("p", { children: f.a })
  ] }, i)) });
}
function ComparisonTable({
  competitor,
  rows
}) {
  return /* @__PURE__ */ jsx("div", { className: "not-prose my-8 overflow-x-auto rounded-2xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-muted/60 text-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "Feature" }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold text-primary", children: "Pool Rental Near Me" }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: competitor })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { children: rows.map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border align-top", children: [
      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-foreground", children: r.label }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-foreground", children: r.prnm }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.competitor })
    ] }, i)) })
  ] }) });
}
function articleJsonLd(opts) {
  const url = `https://www.poolrentalnearme.com/p/${opts.slug}`;
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: opts.title,
      description: opts.description,
      author: AUTHOR_PERSON_JSONLD_REF,
      publisher: {
        "@type": "Organization",
        name: "Pool Rental Near Me",
        logo: {
          "@type": "ImageObject",
          url: "https://www.poolrentalnearme.com/favicon.ico"
        }
      },
      datePublished: opts.datePublished ?? "2026-01-15",
      dateModified: opts.dateModified ?? "2026-05-01",
      mainEntityOfPage: { "@type": "WebPage", "@id": url }
    })
  };
}
function breadcrumbJsonLd(items) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: it.url
      }))
    })
  };
}
const $$splitComponentImporter$1T = () => import("./p.swimply-alternative-vs-pool-rental-near-me-CQECdyRs.js");
const SLUG$2 = "swimply-alternative-vs-pool-rental-near-me";
const TITLE$o = "Swimply vs Pool Rental Near Me: 2026 Comparison";
const DESCRIPTION$o = "Honest 2026 comparison of Swimply vs Pool Rental Near Me. PRNM charges 0% host commission through 2026 (down from 10%), includes $2M insurance, and ships 70+ free Pool Host Academy courses. Compare fees, insurance, training and reach.";
const Route$2E = createFileRoute("/p/swimply-alternative-vs-pool-rental-near-me")({
  component: lazyRouteComponent($$splitComponentImporter$1T, "component"),
  head: () => ({
    ...buildComparisonMeta({
      slug: SLUG$2,
      title: TITLE$o,
      description: DESCRIPTION$o
    }),
    scripts: [faqJsonLd$3(faqs$5.map((f) => ({
      q: f.q,
      a: f.a
    }))), articleJsonLd({
      slug: SLUG$2,
      title: TITLE$o,
      description: DESCRIPTION$o,
      dateModified: "2026-05-22"
    }), breadcrumbJsonLd([{
      name: "Home",
      url: "https://www.poolrentalnearme.com/"
    }, {
      name: "Compare",
      url: "https://www.poolrentalnearme.com/p/all-locations"
    }, {
      name: "Swimply vs Pool Rental Near Me",
      url: `https://www.poolrentalnearme.com/p/${SLUG$2}`
    }]), organizationJsonLd()]
  })
});
const PATH$n = "/p/start-hosting";
const FAQS$c = [{
  q: "How do I start hosting my pool?",
  a: "Create a free account, add photos and an hourly rate, pick the days you want to host, and submit. We review every pool before it goes live, usually within 24 hours."
}, {
  q: "How much can I earn hosting a pool?",
  a: "Most hosts earn $1,500 to $8,000 a month in season. Earnings depend on your city, pool size, amenities, and how aggressively you price weekends and holidays."
}, {
  q: "What does it cost to start hosting?",
  a: "Nothing. Listing is free. There's no monthly fee. We take a flat 10% per booking — Swimply charges 15% to 30%."
}, {
  q: "Do I need my own insurance to host?",
  a: "No. Every booking includes up to $2,000,000 in third-party liability coverage built into the host fee. Most hosts also keep their own homeowner policy in place."
}, {
  q: "Can I host without being home?",
  a: "Yes. Many hosts use a smart lock and a digital waiver, plus our automated check-in messages. Our free Pool Host Academy covers the exact setup."
}];
const BREADCRUMBS$5 = [{
  name: "Home",
  path: "/"
}, {
  name: "Host Tools",
  path: "/p/free-host-tools"
}, {
  name: "Start hosting",
  path: PATH$n
}];
const heroImage$2 = "/fw-assets/hosting-hero-CJCu9RSc.jpg";
const $$splitComponentImporter$1S = () => import("./p.start-hosting-CSMoWBB_.js");
const PUBLISHED$5 = "2026-05-23T00:00:00Z";
const MODIFIED$5 = "2026-05-23T00:00:00Z";
const TITLE$n = "Start hosting your pool: earn $1,500 to $8,000 a month | Pool Rental Near Me";
const DESCRIPTION$n = "Start hosting your pool on Pool Rental Near Me. 0% host fees through 2026, $2M liability included, free to list, 24-hour payouts. Be live in 15 minutes.";
const Route$2D = createFileRoute("/p/start-hosting")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$n,
      description: DESCRIPTION$n,
      path: PATH$n,
      type: "article",
      image: `${SITE_URL}${heroImage$2}`
    });
    return {
      meta: [...meta.meta, {
        property: "article:published_time",
        content: PUBLISHED$5
      }, {
        property: "article:modified_time",
        content: MODIFIED$5
      }, {
        property: "article:author",
        content: "Pool Rental Near Me"
      }],
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1(BREADCRUMBS$5)), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS$c.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1S, "component")
});
const $$splitComponentImporter$1R = () => import("./p.sharetribe-C8E_GDd4.js");
const Route$2C = createFileRoute("/p/sharetribe")({
  head: () => ({
    meta: [{
      title: "Marketplace dashboard sign in — PRNM"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1R, "component")
});
const FAQS$b = [{
  q: "How much does a private pool rental cost?",
  a: "Most private pools rent for $40 to $100 per hour. Heated pools and luxury backyards with hot tubs and outdoor kitchens run $100 to $150 per hour. You pay only for the hours you book, with a typical two-hour minimum."
}, {
  q: "What is included in a private pool rental?",
  a: "Exclusive use of the pool and yard for your group during your booking, plus seating, restroom access, and any amenities the host lists (hot tub, grill, sound system, shade). Every booking on Pool Rental Near Me includes $2M in liability coverage at no extra cost."
}, {
  q: "How many people can I bring?",
  a: "Each listing sets its own guest limit, usually between 5 and 25 people. Filter by group size when you search. Going over the limit risks cancellation, so book a larger pool if you are unsure."
}, {
  q: "Can I rent a private pool for just an hour?",
  a: "Most hosts require a two-hour minimum. A few accept one-hour bookings during off-peak times. Use the calendar on each listing to see the host's minimum and available slots."
}, {
  q: "Are private pool rentals safe?",
  a: "Hosts on Pool Rental Near Me are reviewed before going live and rated by every guest. There is no lifeguard on site, so adults are responsible for supervising swimmers. Every booking carries $2M in liability insurance."
}, {
  q: "Can I bring my dog?",
  a: "Some hosts allow pets, most do not. The listing shows the host's pet policy. Filter by pet-friendly when you search if a dog needs to come along."
}];
const $$splitComponentImporter$1Q = () => import("./p.private-pool-rental-I3XjoAsm.js");
const PATH$m = "/p/private-pool-rental";
const TITLE$m = "Private Pool Rental by the Hour | Pool Rental Near Me";
const DESCRIPTION$m = "Book a private pool rental by the hour. Heated pools, hot tubs, saltwater backyards. $2M liability included, hosts keep 100% of every booking.";
const serviceJsonLd$1 = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Private pool rental",
  name: "Private pool rental by the hour",
  description: "Hourly private pool rental marketplace. Heated pools, hot tubs, and luxury backyards with $2M liability insurance included on every booking.",
  provider: {
    "@type": "Organization",
    name: "Pool Rental Near Me",
    url: SITE_URL
  },
  areaServed: {
    "@type": "Country",
    name: "United States"
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "40",
    highPrice: "150",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      priceCurrency: "USD",
      unitText: "HUR"
    }
  },
  url: `${SITE_URL}${PATH$m}`
};
const faqJsonLd$2 = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS$b.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a
    }
  }))
};
const breadcrumb$2 = breadcrumbJsonLd$1([{
  name: "Home",
  path: "/"
}, {
  name: "Private pool rental",
  path: PATH$m
}]);
const Route$2B = createFileRoute("/p/private-pool-rental")({
  component: lazyRouteComponent($$splitComponentImporter$1Q, "component"),
  head: () => ({
    ...buildMeta({
      title: TITLE$m,
      description: DESCRIPTION$m,
      path: PATH$m,
      image: heroImage$4,
      type: "website"
    }),
    scripts: [ldJsonScript(serviceJsonLd$1), ldJsonScript(faqJsonLd$2), ldJsonScript(breadcrumb$2)]
  })
});
const $$splitComponentImporter$1P = () => import("./p.privacy-request-9ybLJ5el.js");
const Route$2A = createFileRoute("/p/privacy-request")({
  head: () => ({
    meta: [{
      title: "Submit a privacy request | Pool Rental Near Me"
    }, {
      name: "description",
      content: "Exercise your privacy rights under CCPA, CPRA, CPA, CTDPA, VCDPA, TDPSA, OCPA and more. We honor Global Privacy Control automatically."
    }, {
      name: "robots",
      content: "index,follow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1P, "component")
});
const PATH$l = "/p/pool-wifi-guide";
const FAQS$a = [{
  q: "Do I really need to provide wifi at my pool rental?",
  a: "If you charge $60/hour or more, yes. Guests bring phones, speakers, work laptops, and kids' tablets. A weak signal at the pool shows up in reviews fast, especially from the 30 to 50 age bracket that books the most hours and tips the best."
}, {
  q: "How far does my house wifi actually reach poolside?",
  a: "Most consumer routers lose 60 to 80 percent of their signal once they pass a wall, a sliding door, and 25 feet of open yard. If the router is centered in the house, expect 5 to 15 Mbps poolside on a good day and dead zones in the shade structures."
}, {
  q: "What's the cheapest fix for weak pool wifi?",
  a: "A single mesh node placed by the back door, in line of sight to the pool. A two-pack TP-Link Deco or Eero costs under $150 and almost always solves it. Outdoor-rated extenders cost more and only beat mesh when there's a long open run with no power outlet at the midpoint."
}, {
  q: "Should I give guests my main wifi password?",
  a: "No. Set up a guest network on your router (every modern router supports it) with its own SSID and password. Guests only see the internet, not your printer, smart TV, cameras, or NAS. Rotate the guest password monthly or after any problem booking."
}, {
  q: "What internet speed do I need for a pool rental?",
  a: "Minimum 25 Mbps down and 5 Mbps up at the pool itself, not at the router. That covers 3 to 4 people streaming music, a video call, and the host's security cameras simultaneously. Below 15 Mbps poolside you'll start seeing wifi complaints in reviews."
}, {
  q: "Can guests download huge files or run pirated streams on my connection?",
  a: "Technically yes, but the guest network on most routers lets you set a per-device bandwidth cap (typically 25 Mbps) and block torrent traffic. If your ISP sends a DMCA notice, it goes to you — so cap it."
}, {
  q: "Do I need a separate router for the pool, or just better placement?",
  a: "Almost always just better placement plus one mesh node. A dedicated outdoor access point only makes sense if your pool is more than 75 feet from the house or fully fenced off behind a detached structure."
}];
const BREADCRUMBS$4 = [{
  name: "Home",
  path: "/"
}, {
  name: "Host Tools",
  path: "/p/free-host-tools"
}, {
  name: "Pool wifi guide",
  path: PATH$l
}];
const $$splitComponentImporter$1O = () => import("./p.pool-wifi-guide-CnuSb2cQ.js");
const PUBLISHED$4 = "2026-05-23T00:00:00Z";
const MODIFIED$4 = "2026-05-23T00:00:00Z";
const TITLE$l = "Pool wifi guide: setup, range, and guest access | Pool Rental Near Me";
const DESCRIPTION$l = "Free pool wifi guide for hosts. How to extend wifi to the pool, give guests safe limited access, hit 25+ Mbps poolside, and avoid the three setups that cause bad reviews.";
const Route$2z = createFileRoute("/p/pool-wifi-guide")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$l,
      description: DESCRIPTION$l,
      path: PATH$l,
      type: "article",
      image: `${SITE_URL}${heroImage$3}`
    });
    return {
      meta: [...meta.meta, {
        property: "article:published_time",
        content: PUBLISHED$4
      }, {
        property: "article:modified_time",
        content: MODIFIED$4
      }, {
        property: "article:author",
        content: "Pool Rental Near Me"
      }],
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1(BREADCRUMBS$4)), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS$a.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1O, "component")
});
const PATH$k = "/p/pool-rules-generator";
const FAQS$9 = [{
  q: "What does the pool rules generator do?",
  a: "It builds a clean, printable house-rules document tailored to your pool — guest count, hours, glass policy, smoking, music limits, kids and pets, photography, and after-hours fees."
}, {
  q: "Is the pool rules generator free?",
  a: "Yes. Free for every host on Pool Rental Near Me. The PDF is yours to use on any platform — Swimply, Peerspace, your own site."
}, {
  q: "Should I make guests sign my pool rules?",
  a: "Yes. Pair the rules with our digital waiver and you have a signed, time-stamped record. That's worth a lot if a guest later disputes a charge or claims damage."
}, {
  q: "Can I require quiet hours or limit music volume?",
  a: "Yes. The generator includes time-windowed rules for noise, music, and parties. Most hosts cap amplified music at 8pm or 9pm to keep neighbors happy."
}, {
  q: "What pool rules cause the most problems for hosts?",
  a: "Glass containers, unannounced extra guests, and unattended kids. Set hard rules on all three and your damage claims drop sharply."
}];
const BREADCRUMBS$3 = [{
  name: "Home",
  path: "/"
}, {
  name: "Host Tools",
  path: "/p/free-host-tools"
}, {
  name: "Pool rules generator",
  path: PATH$k
}];
const $$splitComponentImporter$1N = () => import("./p.pool-rules-generator-qPFzSA6b.js");
const PUBLISHED$3 = "2026-05-23T00:00:00Z";
const MODIFIED$3 = "2026-05-23T00:00:00Z";
const TITLE$k = "Pool rules generator: free house rules every guest signs | Pool Rental Near Me";
const DESCRIPTION$k = "Free pool rules generator for hosts. Build a clear, enforceable house-rules document in 60 seconds — guest count, hours, glass, smoking, music, kids, pets, more.";
const Route$2y = createFileRoute("/p/pool-rules-generator")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$k,
      description: DESCRIPTION$k,
      path: PATH$k,
      type: "article",
      image: `${SITE_URL}${heroImage$3}`
    });
    return {
      meta: [...meta.meta, {
        property: "article:published_time",
        content: PUBLISHED$3
      }, {
        property: "article:modified_time",
        content: MODIFIED$3
      }, {
        property: "article:author",
        content: "Pool Rental Near Me"
      }],
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1(BREADCRUMBS$3)), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS$9.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1N, "component")
});
const getShareListing = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  id: z.string().uuid()
}).parse(data)).handler(createSsrRpc("bb5d3d0d2b3b73dd48ca1c4c0e9431d99be11e49d2b332f4894f8656efdcd926"));
const getListing = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  id: z.string().min(1).max(64)
}).parse(data)).handler(createSsrRpc("24c49324d39d3d16fb55e6a3b1e44e2059495858d3d4ce5ec2db8844fb2d074f"));
const queryListings = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  page: z.number().int().min(1).max(200).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  keywords: z.string().max(200).optional(),
  origin: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/).optional(),
  bounds: z.string().max(200).optional(),
  pub_category: z.string().max(100).optional(),
  citySlug: z.string().max(120).regex(/^[a-z0-9-]+$/).optional(),
  city: z.string().max(120).optional()
}).parse(data)).handler(createSsrRpc("70f04e447e5b237c46a6d2681f5964dc581e01c7e256218597e0c074ddbdebd1"));
const $$splitComponentImporter$1M = () => import("./p.pool-rentals-__state_-b1jKfnVA.js");
const $$splitErrorComponentImporter$d = () => import("./p.pool-rentals-__state_-BjXiCLpG.js");
const $$splitNotFoundComponentImporter$a = () => import("./p.pool-rentals-__state_-I1y4OoPY.js");
const Route$2x = createFileRoute("/p/pool-rentals-{$state}")({
  loader: async ({
    params
  }) => {
    let data = null;
    try {
      data = await getStateHub({
        data: {
          state: params.state
        }
      });
    } catch (err) {
      console.error("[pool-rentals-$state] loader failed:", err);
      data = null;
    }
    if (!data || !data.cities || data.cities.length === 0) throw notFound();
    let listings = [];
    try {
      const res = await queryListings({
        data: {
          stateCode: data.stateCode,
          perPage: 12,
          page: 1
        }
      });
      listings = res.listings ?? [];
    } catch (err) {
      console.error("[pool-rentals-$state] listings fetch failed:", err);
    }
    return {
      ...data,
      listings
    };
  },
  head: ({
    loaderData
  }) => {
    if (!loaderData) return {
      meta: [],
      links: []
    };
    const {
      stateName: stateName2,
      cities
    } = loaderData;
    const title = `Pool rentals in ${stateName2} — ${cities.length} cities | Pool Rental Near Me`;
    const description = `Browse private backyard pool rentals across ${cities.length} cities in ${stateName2}. Book by the hour, $40–150/hour typical, with $2M liability insurance included.`;
    const stateSlug2 = stateName2.toLowerCase().replace(/\s+/g, "-");
    const meta = buildMeta({
      title,
      description,
      path: `/p/pool-rentals-${stateSlug2}`
    });
    return {
      meta: meta.meta,
      links: meta.links
    };
  },
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$a, "notFoundComponent"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$d, "errorComponent"),
  component: lazyRouteComponent($$splitComponentImporter$1M, "component")
});
const $$splitComponentImporter$1L = () => import("./p.pool-rentals-B309aFi9.js");
const $$splitErrorComponentImporter$c = () => import("./p.pool-rentals-BP8rQc5c.js");
const Route$2w = createFileRoute("/p/pool-rentals")({
  loader: async () => {
    const states = await getAllStateHubs();
    return {
      states
    };
  },
  head: () => {
    const meta = buildMeta({
      title: "Pool rentals by state — Browse all 50 states | Pool Rental Near Me",
      description: "Find private backyard pool rentals in every U.S. state. Browse 3,400+ cities across all 50 states and book a pool by the hour near you.",
      path: "/p/pool-rentals"
    });
    return {
      meta: meta.meta,
      links: meta.links
    };
  },
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$c, "errorComponent"),
  component: lazyRouteComponent($$splitComponentImporter$1L, "component")
});
const LAST_UPDATED$2 = "2026-05-22";
const faqs$4 = [{
  q: "Do I need a permit to rent out my pool by the hour?",
  a: "It depends on the state and city. Most US cities do not have a pool-specific permit because hourly pool rental is too new to have its own ordinance category. The legal layer that typically applies is the short-term rental (STR) ordinance, which folds pool rentals in when the booking is paid and includes the property. Roughly 35 states require some form of STR registration in at least their largest cities; about 15 states have no statewide rule and let municipalities decide. The 50-state table above shows where each state currently sits."
}, {
  q: "Which states are hardest for pool rental hosts?",
  a: "California, Florida, Hawaii, Massachusetts, Nevada, and New York are the most regulated. Each has either a statewide STR registry, an aggressive municipal layer in major counties, or both. Within those states, the toughest counties are typically Los Angeles, Riverside (Palm Springs/La Quinta), Miami-Dade, Honolulu, Clark (Las Vegas), and any of the five NYC boroughs."
}, {
  q: "Which states are easiest for pool rental hosts?",
  a: "Alabama, Arkansas, Mississippi, North Dakota, Oklahoma, South Dakota, and West Virginia currently have no statewide STR registry and minimal municipal layers outside their largest cities. A general business license and a sales-tax registration is usually the entire compliance footprint."
}, {
  q: "Does my HOA matter more than state law?",
  a: "Yes, for most hosts. Even in states that pre-empt outright municipal STR bans (Texas, Florida, Indiana, Idaho, Arizona), HOAs and master-planned communities can still enforce their CC&Rs against commercial use of a residential property. Read your HOA documents before listing. Our HOA defense kit covers the most common arguments and includes letter templates."
}, {
  q: "What about the pool itself — drainage, fencing, alarms?",
  a: "Pool barrier and safety requirements come from your state building code, not from STR law. California Title 24, Florida's Residential Swimming Pool Safety Act, Arizona's Pool Barrier Law, and most state codes require some combination of fencing, self-closing gates, and alarms. A pool that complies with state code as a private residential pool generally complies as a rental pool, but commercial use can trigger additional health-department review in a handful of jurisdictions (Hawaii, parts of Florida)."
}];
const $$splitComponentImporter$1K = () => import("./p.pool-rental-permits-by-state-DM3zB2b_.js");
const PATH$j = "/p/pool-rental-permits-by-state";
const TITLE$j = "Pool rental permits by state: 50-state guide for hourly pool hosts (2026)";
const DESCRIPTION$j = "What you legally need to host an hourly pool rental in each US state. Short-term rental registrations, business licenses, health-department rules, HOA exposure, and county-level callouts. Sourced from state and city code.";
const Route$2v = createFileRoute("/p/pool-rental-permits-by-state")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$j,
      description: DESCRIPTION$j,
      path: PATH$j,
      type: "article"
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [ldJsonScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: TITLE$j,
        description: DESCRIPTION$j,
        datePublished: LAST_UPDATED$2,
        dateModified: LAST_UPDATED$2,
        author: AUTHOR_PERSON_JSONLD_REF,
        publisher: {
          "@type": "Organization",
          name: SITE_NAME$3,
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/icon-512.png`
          }
        },
        mainEntityOfPage: `${SITE_URL}${PATH$j}`
      }), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs$4.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
            speakable: {
              "@type": "SpeakableSpecification",
              cssSelector: [".faq-answer"]
            }
          }
        }))
      }), ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "Pool Rental Permits by State",
        path: PATH$j
      }]))]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1K, "component")
});
const LAST_UPDATED$1 = "2026-05-22";
const faqs$3 = [{
  q: "Is Swimply insurance real insurance?",
  a: "No. Swimply's Protection Guarantee is a company-funded reimbursement program — not a third-party insurance policy underwritten by a licensed carrier. Swimply's own terms describe it as a guarantee that pays out at Swimply's discretion, secondary to the host's homeowners policy. There is no carrier name, no policy number, and no certificate of insurance available to hosts. Pool Rental Near Me is the only major pool-rental marketplace that places hosts on a third-party policy from a licensed carrier (The Hartford), with documentary proof available on request."
}, {
  q: "Does my homeowners insurance cover paid pool rentals?",
  a: "Almost never. Standard homeowners policies exclude commercial or 'business pursuits' use of the property. The moment you accept money to let someone swim, most carriers consider that a business activity and will deny the claim — and may cancel the policy. This is why a dedicated commercial liability layer underneath your homeowners policy matters."
}, {
  q: "What is a Business Owner's Policy (BOP) and why does it matter?",
  a: "A BOP is a packaged commercial insurance policy that combines general liability with property and business interruption coverage. PRNM's BOP through Hartford Underwriters Insurance Company provides $2,000,000 per-occurrence and $4,000,000 aggregate general liability, $10,000 medical payments per person, and a $150,000 STRETCH® PLUS property blanket — sitting underneath the host's homeowners policy as primary commercial coverage for the rental activity. It is real insurance with a real carrier and a real certificate."
}, {
  q: "What does Peerspace's $1M Host Liability cover for pool rentals?",
  a: "Peerspace's published terms provide up to $1,000,000 in liability protection per booking, administered through a third-party insurer. The coverage is designed for general venue rentals (photo shoots, meetings, parties) rather than swimming-specific risks. Drowning and water-related bodily injury claims have historically been the highest-severity loss category for pool hosts, which is why a pool-specific BOP with higher limits is the safer floor."
}, {
  q: "What does Giggster's coverage include?",
  a: "Giggster offers a tiered insurance add-on (typically $1M, $2M, or $5M general liability) priced per booking and underwritten through a third-party broker. Coverage applies to the production or event, not specifically to swimming activity. Hosts should confirm in writing that pool-related bodily injury is not excluded before accepting bookings that include swimming."
}, {
  q: "Can I see the actual PRNM insurance certificate?",
  a: "Yes. Hosts can request a Certificate of Insurance (COI) naming themselves as an additional insured, issued directly by The Hartford. This is the same documentation a commercial venue would provide to a corporate event client, and it is something a self-funded guarantee program structurally cannot produce. Email support at the number below to request a COI."
}];
const $$splitComponentImporter$1J = () => import("./p.pool-rental-insurance-explained-Wms-yRL7.js");
const PATH$i = "/p/pool-rental-insurance-explained";
const TITLE$i = "Do You Need Insurance to Rent Out Your Pool? (2026)";
const DESCRIPTION$i = "Yes — most homeowners policies exclude paid pool rentals, so you need commercial liability coverage. Here's what you actually need, plus how Swimply, PRNM, Peerspace and Giggster compare on carriers, limits, and proof.";
const Route$2u = createFileRoute("/p/pool-rental-insurance-explained")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$i,
      description: DESCRIPTION$i,
      path: PATH$i,
      type: "article"
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [ldJsonScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: TITLE$i,
        description: DESCRIPTION$i,
        datePublished: LAST_UPDATED$1,
        dateModified: LAST_UPDATED$1,
        author: AUTHOR_PERSON_JSONLD_REF,
        publisher: {
          "@type": "Organization",
          name: "Pool Rental Near Me",
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/icon-512.png`
          }
        },
        mainEntityOfPage: `${SITE_URL}${PATH$i}`
      }), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs$3.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
            speakable: {
              "@type": "SpeakableSpecification",
              cssSelector: [".faq-answer"]
            }
          }
        }))
      }), ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "Pool Rental Insurance Explained",
        path: PATH$i
      }]))]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1J, "component")
});
const LAST_UPDATED = "2026-07-09";
const faqs$2 = [{
  q: "How much does Swimply charge hosts?",
  a: "Swimply charges hosts roughly 15%–20% per booking, and now promotes a ~$29/month Premium Pass for better search placement and features. On Pool Rental Near Me, host fees are 0% through 2026 — no commission and no monthly pass — so hosts keep everything they earn."
}, {
  q: "Which pool rental platform has the lowest host fee?",
  a: "Pool Rental Near Me charges a 0% flat host commission through 2026 — you keep 100% — the lowest of any major peer-to-peer pool rental marketplace. Swimply, Peerspace, and Giggster each charge 15% or higher on the host side, before any additional guest service fees."
}, {
  q: "What is the difference between host commission and guest service fee?",
  a: "Host commission is deducted from the host's payout — it is what the host actually pays the platform. The guest service fee is added on top of the host's price at checkout and is paid by the guest. Both reduce the platform's effective price competitiveness, but only the host commission affects host take-home."
}, {
  q: "How fast do hosts get paid on each platform?",
  a: "PRNM and Peerspace both pay out approximately 24 hours after the booking ends. Swimply typically takes 1–3 business days. Giggster releases funds after booking completion, with timing varying by payment method."
}, {
  q: "Are there any hidden fees beyond the host commission?",
  a: "On PRNM, the host commission is 0% through 2026 — the lowest of any platform — there are no per-booking add-ons, no insurance surcharges (insurance is included), and no listing fees. Other platforms may charge optional insurance upgrades, premium placement, or processing fees on top of the headline commission."
}];
const $$splitComponentImporter$1I = () => import("./p.pool-rental-host-fees-compared-BN8wfdNL.js");
const PATH$h = "/p/pool-rental-host-fees-compared";
const TITLE$h = "Pool Rental Host Fees Compared 2026: Swimply vs PRNM (0% Fees)";
const DESCRIPTION$h = "See what Swimply (15–20%+ plus a ~$29/mo Premium Pass), Peerspace and Giggster charge hosts — vs 0% host fees on Pool Rental Near Me for 2026. Sourced from each platform's terms.";
const Route$2t = createFileRoute("/p/pool-rental-host-fees-compared")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$h,
      description: DESCRIPTION$h,
      path: PATH$h,
      type: "article"
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [ldJsonScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: TITLE$h,
        description: DESCRIPTION$h,
        datePublished: LAST_UPDATED,
        dateModified: LAST_UPDATED,
        author: AUTHOR_PERSON_JSONLD_REF,
        publisher: {
          "@type": "Organization",
          name: "Pool Rental Near Me",
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/icon-512.png`
          }
        },
        mainEntityOfPage: `${SITE_URL}${PATH$h}`
      }), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs$2.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
            speakable: {
              "@type": "SpeakableSpecification",
              cssSelector: [".faq-answer"]
            }
          }
        }))
      }), ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "Pool Rental Host Fees Compared",
        path: PATH$h
      }]))]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1I, "component")
});
const APP_STORE_URL = "https://apps.apple.com/us/app/pool-rental-near-me-swim-fun/id6737762373";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.poolrentalnearme.app.prod";
const FAQS$8 = [{
  q: "Is the Pool Rental Near Me app free to download?",
  a: "Yes. The pool rental app is free on the App Store and Google Play. You only pay when you book a pool. Hourly rates are set by each host and run $40 to $150 per hour depending on the city, pool size, and amenities."
}, {
  q: "What can I do in the app?",
  a: "Search private pools near you, filter by date, group size, heated, hot tub, saltwater, or pet-friendly, message the host, pay in-app, and manage your bookings. Every booking carries $2M in liability coverage at no extra cost."
}, {
  q: "Does the app work in my city?",
  a: "Pool Rental Near Me has listings in every major US metro and thousands of smaller cities. Open the app, allow location access, and the map shows pools near you. If your city has zero listings yet, you can be the first host."
}, {
  q: "Can I list my pool from the app?",
  a: "Yes. Tap List your pool in the app, add photos, set your hourly rate and house rules, and you are live. Hosts keep 100% of every booking — 0% host fees through 2026. We eat the credit card processing fees, so 100% means 100%."
}, {
  q: "Is the app safe to use?",
  a: "Hosts are reviewed before listings go live, payments run through the app, and every booking includes $2M in liability coverage. Message the host inside the app to keep your contact info private until you are ready to share."
}, {
  q: "Do I need the app, or can I book on the website?",
  a: "Both work. The website at poolrentalnearme.com has the same inventory. The pool rental app is faster on a phone, shows the map by default, and sends push notifications when a host replies or your booking confirms."
}];
const heroImage$1 = "/fw-assets/pool-hero-default-D2KM7lvJ.jpg";
const $$splitComponentImporter$1H = () => import("./p.pool-rental-app-nxclir2i.js");
const PATH$g = "/p/pool-rental-app";
const TITLE$g = "Pool Rental App: Book a Private Pool From Your Phone | Pool Rental Near Me";
const DESCRIPTION$g = "Download the Pool Rental Near Me app. Find and book private pools by the hour. Heated pools, hot tubs, and backyard parties with $2M liability included.";
const APP_NAME = "Pool Rental Near Me: Swim & Fun";
const iosAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: APP_NAME,
  operatingSystem: "iOS",
  applicationCategory: "TravelApplication",
  url: APP_STORE_URL,
  installUrl: APP_STORE_URL,
  downloadUrl: APP_STORE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  publisher: {
    "@type": "Organization",
    name: "Pool Rental Near Me",
    url: SITE_URL
  }
};
const androidAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: APP_NAME,
  operatingSystem: "Android",
  applicationCategory: "TravelApplication",
  url: PLAY_STORE_URL,
  installUrl: PLAY_STORE_URL,
  downloadUrl: PLAY_STORE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  publisher: {
    "@type": "Organization",
    name: "Pool Rental Near Me",
    url: SITE_URL
  }
};
const faqJsonLd$1 = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS$8.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a
    }
  }))
};
const breadcrumb$1 = breadcrumbJsonLd$1([{
  name: "Home",
  path: "/"
}, {
  name: "Pool rental app",
  path: PATH$g
}]);
const Route$2s = createFileRoute("/p/pool-rental-app")({
  component: lazyRouteComponent($$splitComponentImporter$1H, "component"),
  head: () => ({
    ...buildMeta({
      title: TITLE$g,
      description: DESCRIPTION$g,
      path: PATH$g,
      image: heroImage$1,
      type: "website"
    }),
    scripts: [ldJsonScript(iosAppJsonLd), ldJsonScript(androidAppJsonLd), ldJsonScript(faqJsonLd$1), ldJsonScript(breadcrumb$1)]
  })
});
createServerFn({
  method: "GET"
}).handler(createSsrRpc("4c9441d3b6002616fda31deda2a8a4227b4d053d0084d0605b76c816e2b0b836"));
const listAllBuilders = createServerFn({
  method: "GET"
}).handler(createSsrRpc("e32249312a5ac6377e83cd7ab18c9f46b327d1ba0ddaac9b1602a5aea2558b03"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  state: z.string().regex(/^[a-z]{2}$/)
}).parse(d)).handler(createSsrRpc("e8a588df9ea5f16c934ded3c1ab3c467647278f0d31bcc331d6d263391563e68"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  state: z.string().regex(/^[a-z]{2}$/),
  city: z.string().regex(/^[a-z0-9-]+$/).max(80)
}).parse(d)).handler(createSsrRpc("ddd8a524252354f8d281e76dc64a8671b3ce2e032663c538ed516e6667f90ffd"));
const submitProviderLead = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state_code: z.string().trim().max(4).optional().or(z.literal("")),
  message: z.string().trim().max(2e3).optional().or(z.literal("")),
  source_provider_slug: z.string().trim().max(120).optional().or(z.literal("")),
  source_path: z.string().trim().max(300).optional().or(z.literal(""))
}).parse(d)).handler(createSsrRpc("52e5a9df7f3d469c9a46bf9fb8b5c0a4f283ae5bd87ec1dce2093dc046a3161e"));
const $$splitComponentImporter$1G = () => import("./p.pool-pros-CB0Y9Jvt.js");
const Route$2r = createFileRoute("/p/pool-pros")({
  loader: async () => {
    const {
      providers
    } = await listAllBuilders();
    return {
      providers
    };
  },
  head: ({
    loaderData
  }) => {
    loaderData?.providers?.length ?? 0;
    const meta = buildMeta({
      title: "Pool Pros Directory | Pool Rental Near Me",
      description: "Search pool builders, cleaners, and service pros across the US. Filter by service type, city, and rating.",
      path: "/p/pool-pros",
      noindex: true
    });
    meta.links = meta.links.filter((l) => l.rel !== "canonical");
    const crumbs = breadcrumbJsonLd$1([{
      name: "Home",
      path: "/"
    }, {
      name: "Pool Pros",
      path: "/p/pool-pros"
    }]);
    return {
      ...meta,
      scripts: [ldJsonScript(crumbs)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1G, "component")
});
const FAQS$7 = [{
  q: "How much do pool party rentals cost?",
  a: "Most backyard pool party rentals run $40 to $200 per hour depending on group size, amenities, and city. A small birthday for 10 guests usually books for $60 to $100 per hour. A 30-guest graduation or quinceañera with a heated pool and hot tub runs $120 to $200 per hour. Most listings have a two-hour minimum."
}, {
  q: "How many guests can I bring to a pool party rental?",
  a: "Each host sets a maximum guest count, usually between 10 and 50 people. Filter listings by group size when you search. Going over the limit can get the booking cancelled, so pick a pool sized for your full group plus a few extra."
}, {
  q: "Can I bring catering or hire a food truck?",
  a: "Most hosts allow outside catering and food trucks with advance notice. Glass containers are usually banned in the pool area, so plan for plastic or cans. Ask the host before booking if you plan to set up tents, bounce houses, or a DJ."
}, {
  q: "Can I bring inflatables or a bounce house?",
  a: "Pool floats and inflatables are usually fine. Bounce houses, water slides, and anchored structures need host approval and yard space. Mention it in your booking request so the host can confirm."
}, {
  q: "Is there a lifeguard at pool party rentals?",
  a: "No, there is no lifeguard on site. Adults in your group are responsible for supervising swimmers, especially when kids are present. Many cities have private lifeguard services that come to the pool. Pricing varies by city."
}, {
  q: "What happens if it rains?",
  a: "Each host sets a cancellation and rain policy on their listing. Read the policy before you book a date with iffy weather. Many hosts offer free reschedule with 24 to 48 hours notice for weather."
}, {
  q: "Can I book a pool party for under 3 hours?",
  a: "Most hosts require a two or three hour minimum. A few accept shorter bookings on weekday off-peak slots. Check the booking calendar on each listing for the host's minimum hours."
}];
const heroImage = "/fw-assets/hero-pool-party-DgwniAN1.jpg";
const $$splitComponentImporter$1F = () => import("./p.pool-party-rentals-BEDmO-zv.js");
const PATH$f = "/p/pool-party-rentals";
const TITLE$f = "Pool Party Rentals by the Hour | Pool Rental Near Me";
const DESCRIPTION$f = "Book a private backyard for your birthday, graduation, baby shower, or company offsite. Pool party rentals across America with $2M liability included.";
const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Pool party rental",
  name: "Pool party rentals by the hour",
  description: "Hourly pool party rentals across America. Birthdays, graduations, baby showers, bachelorettes, and company offsites with $2M liability insurance included on every booking.",
  provider: {
    "@type": "Organization",
    name: "Pool Rental Near Me",
    url: SITE_URL
  },
  areaServed: {
    "@type": "Country",
    name: "United States"
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "40",
    highPrice: "200",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      priceCurrency: "USD",
      unitText: "HUR"
    }
  },
  url: `${SITE_URL}${PATH$f}`
};
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS$7.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a
    }
  }))
};
const breadcrumb = breadcrumbJsonLd$1([{
  name: "Home",
  path: "/"
}, {
  name: "Pool party rentals",
  path: PATH$f
}]);
const Route$2q = createFileRoute("/p/pool-party-rentals")({
  component: lazyRouteComponent($$splitComponentImporter$1F, "component"),
  head: () => ({
    ...buildMeta({
      title: TITLE$f,
      description: DESCRIPTION$f,
      path: PATH$f,
      image: heroImage,
      type: "website"
    }),
    scripts: [ldJsonScript(serviceJsonLd), ldJsonScript(faqJsonLd), ldJsonScript(breadcrumb)]
  })
});
const PATH$e = "/p/pool-heating-cost-calculator";
const FAQS$6 = [{
  q: "What does a pool heating cost calculator do?",
  a: "It estimates how much you'll spend each month to keep your pool at a target temperature, based on pool size, cover use, location, and the heater type (gas, electric heat pump, or solar)."
}, {
  q: "Which pool heater is cheapest to run?",
  a: "Solar is cheapest after install. Electric heat pumps typically cost $100–$300/month to run in mild climates. Natural gas is fastest but usually the most expensive per BTU."
}, {
  q: "Do I really need a pool cover to control heating costs?",
  a: "Yes. A solar or thermal cover cuts heat loss by 50–70%. Without one, your heater fights evaporation 24/7 and run-costs roughly double."
}, {
  q: "How much does it cost to heat a pool per month for rentals?",
  a: "For a typical 15,000-gallon backyard rental in a mild climate, expect $150–$450/month with a heat pump and cover, or $400–$900/month with gas and no cover."
}, {
  q: "Is the calculator free?",
  a: "Yes. It's free for everyone, with no signup required. Hosts on Pool Rental Near Me can save preset profiles for each of their listings."
}];
const BREADCRUMBS$2 = [{
  name: "Home",
  path: "/"
}, {
  name: "Host Tools",
  path: "/p/free-host-tools"
}, {
  name: "Pool heating cost calculator",
  path: PATH$e
}];
const $$splitComponentImporter$1E = () => import("./p.pool-heating-cost-calculator-CDVcnz8t.js");
const PUBLISHED$2 = "2026-05-23T00:00:00Z";
const MODIFIED$2 = "2026-05-23T00:00:00Z";
const TITLE$e = "Pool heating cost calculator: gas, heat pump, and solar | Pool Rental Near Me";
const DESCRIPTION$e = "Free swimming pool heating cost calculator. Compare gas, heat pump, and solar — see monthly run-cost and payback time for your pool's size and climate.";
const Route$2p = createFileRoute("/p/pool-heating-cost-calculator")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$e,
      description: DESCRIPTION$e,
      path: PATH$e,
      type: "article",
      image: `${SITE_URL}${heroImage$3}`
    });
    return {
      meta: [...meta.meta, {
        property: "article:published_time",
        content: PUBLISHED$2
      }, {
        property: "article:modified_time",
        content: MODIFIED$2
      }, {
        property: "article:author",
        content: "Pool Rental Near Me"
      }],
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1(BREADCRUMBS$2)), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS$6.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1E, "component")
});
function buildFaqs$1(city) {
  return [{
    q: `Is Peerspace or Pool Rental Near Me better in ${city.name}?`,
    a: `For typical residential pools in ${city.name}, ${city.state} renting at $45–$150/hour for recreational use, Pool Rental Near Me is the better-fit channel: 0% host fee (2026) vs Peerspace's 20%, $2M liability vs $1M, and pool-specific guest demand. Peerspace makes sense in ${city.name} if your pool is luxury/photogenic and you want production crew or event-planner bookings at $200+/hour.`
  }, {
    q: `What does Peerspace charge ${city.name} pool hosts?`,
    a: `Peerspace charges hosts in ${city.name} the same 20% service fee it charges nationally — applied to the booking subtotal plus add-ons like cleaning. Pool Rental Near Me charges ${city.name} hosts 0% commission through 2026 — you keep 100%.`
  }, {
    q: `How much can I earn renting my pool in ${city.name}?`,
    a: `Most ${city.name} pool hosts price between $45 and $150 per hour depending on amenities, capacity, and season. With 0% Pool Rental Near Me host fees through 2026, on a $300 booking you keep the full $300; on Peerspace's 20% fee you'd keep $240 — a $60 swing per booking.`
  }, {
    q: `Is pool rental legal in ${city.state}?`,
    a: `Pool rentals are legal in most ${city.state} jurisdictions when you carry adequate liability coverage and follow local zoning, occupancy and noise rules. Pool Rental Near Me's $2M liability policy is structured for residential pool hosting. Always check ${city.name} city ordinances before listing.`
  }];
}
const lookupContentPage = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  slug: z.string().min(1)
}).parse(data)).handler(createSsrRpc("8dc39875112299d43280ab8e8415072c8c2cbfa2f198c720671e85a7d1af18b7"));
const getHreflangSibling = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  pageId: z.string().uuid()
}).parse(data)).handler(createSsrRpc("8eadb45829ba365a732b45664ac3bef32a1fd5c9ca6b40aad78fd50c7efb8468"));
const $$splitNotFoundComponentImporter$9 = () => import("./p.peerspace-vs-pool-rental-near-me-in-__city_-vVNTL0-e.js");
const $$splitComponentImporter$1D = () => import("./p.peerspace-vs-pool-rental-near-me-in-__city_-BQERkSzE.js");
const Route$2o = createFileRoute("/p/peerspace-vs-pool-rental-near-me-in-{$city}")({
  loader: async ({
    params
  }) => {
    const fullSlug = `peerspace-vs-pool-rental-near-me-in-${params.city}`;
    const lookup = await lookupContentPage({
      data: {
        slug: fullSlug
      }
    });
    if (lookup.kind === "redirect" && lookup.redirectPath) {
      throw redirect({
        href: lookup.redirectPath,
        statusCode: 301
      });
    }
    const city = await getCityBySlug({
      data: {
        slug: params.city
      }
    });
    if (!city) throw notFound();
    return {
      city
    };
  },
  head: ({
    loaderData
  }) => {
    const city = loaderData?.city;
    if (!city) return {
      meta: [{
        title: "City not found"
      }]
    };
    const slug = `peerspace-vs-pool-rental-near-me-in-${city.slug}`;
    const title = `Peerspace vs Pool Rental Near Me in ${city.name}, ${city.state_code} (2026)`;
    const description = `${city.name} pool hosts: should you list on Peerspace or Pool Rental Near Me? 0% vs 20% host fee (2026), $2M vs $1M liability, local pricing benchmarks for ${city.name}, ${city.state}.`;
    return {
      ...buildComparisonMeta({
        slug,
        title,
        description
      }),
      scripts: [articleJsonLd({
        slug,
        title,
        description
      }), breadcrumbJsonLd([{
        name: "Home",
        url: absUrl("/")
      }, {
        name: "Compare",
        url: absUrl("/p/peerspace-vs-pool-rental-near-me")
      }, {
        name: `Peerspace vs PRNM in ${city.name}`,
        url: absUrl(`/p/${slug}`)
      }]), faqJsonLd$3(buildFaqs$1(city).map((f) => ({
        q: f.q,
        a: f.a
      })))]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1D, "component"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$9, "notFoundComponent")
});
const faqs$1 = [{
  q: "What does Peerspace charge hosts?",
  a: "Peerspace's published support article confirms a 20% host service fee charged on the booking subtotal plus add-ons like cleaning. Peerspace also charges guests a separate processing fee at checkout. Pool Rental Near Me charges a flat 0% host commission through 2026 — you keep 100% — with a guest service fee at checkout."
}, {
  q: "Is Peerspace a good Swimply alternative for pool rentals?",
  a: "Peerspace lists pools alongside lofts, warehouses, mansions and event halls — it's a general venue marketplace, not a pool marketplace. If you want a true Swimply alternative built only for pools, Pool Rental Near Me is the closer match: 0% host fees through 2026, $2M liability, and 5,100+ pool-intent landing pages driving guests who specifically searched for a pool."
}, {
  q: "Is Peerspace mainly for pool rentals?",
  a: "No. Peerspace is a general venue marketplace where pools are listed alongside lofts, warehouses, mansions, restaurants, photo studios, and meeting spaces. Pool Rental Near Me is built specifically for pool rentals, which means pool-seeking guests find your listing faster."
}, {
  q: "What insurance does Peerspace provide?",
  a: "Peerspace publishes $1,000,000 in host General Liability insurance and a $25,000 Property Damage Guarantee for qualifying US bookings. Pool Rental Near Me provides $2,000,000 per-occurrence / $4M aggregate general liability and a $150,000 STRETCH® PLUS property blanket through Hartford Underwriters."
}, {
  q: "Should I list my pool on both Peerspace and Pool Rental Near Me?",
  a: "If your pool fits the production / event-venue buyer (high-end finishes, photogenic, large capacity, $200+/hour pricing), listing on both makes sense. For typical residential pools booking $45–$150/hour recreational use, Pool Rental Near Me is the better-fit channel."
}, {
  q: "Does Peerspace have pool-specific training?",
  a: "Peerspace's resources are venue-generic. Pool Rental Near Me's Pool Host Academy ships 70+ free courses specifically for pool hosting — safety, waivers, pricing, HOA navigation and revenue optimization."
}, {
  q: "Which platform pays out faster?",
  a: "Peerspace publishes a 3–7 day post-booking payout window. Pool Rental Near Me also pays out shortly after completed bookings; verify exact timing during host onboarding."
}, {
  q: "Can I charge production rates on Pool Rental Near Me?",
  a: "Yes — you set your own pricing on Pool Rental Near Me, including premium rates for production crews. The platform's strength is recreational hourly bookings; you can still accept higher-rate use cases when they come in."
}, {
  q: "Why is fee math different on a venue platform vs a pool platform?",
  a: "Venue platforms spread their take across many categories — Peerspace's 20% host fee is the same whether you're listing a loft, a warehouse, or a pool. Pool Rental Near Me's 0% host fees through 2026 is built specifically around pool unit economics, which is why it's lower."
}, {
  q: "Is Pool Rental Near Me cheaper than Peerspace for hosts?",
  a: "Yes — Pool Rental Near Me's 0% host commission (through 2026) beats Peerspace's published 20% host fee. On a $300 booking, that's $0 to Pool Rental Near Me vs $60 to Peerspace, putting the full $60 per booking back in your pocket."
}];
const $$splitComponentImporter$1C = () => import("./p.peerspace-vs-pool-rental-near-me-4pJBU5WA.js");
const SLUG$1 = "peerspace-vs-pool-rental-near-me";
const TITLE$d = "Peerspace vs Pool Rental Near Me (2026): Fees, Insurance & Best Pool Host Platform";
const DESCRIPTION$d = "Peerspace vs Pool Rental Near Me 2026: 0% vs 20% host fee (2026), $2M vs $1M liability, pool-specialized vs general venue. Side-by-side comparison for pool owners.";
const Route$2n = createFileRoute("/p/peerspace-vs-pool-rental-near-me")({
  component: lazyRouteComponent($$splitComponentImporter$1C, "component"),
  head: () => ({
    ...buildComparisonMeta({
      slug: SLUG$1,
      title: TITLE$d,
      description: DESCRIPTION$d
    }),
    scripts: [faqJsonLd$3(faqs$1.map((f) => ({
      q: f.q,
      a: f.a
    }))), articleJsonLd({
      slug: SLUG$1,
      title: TITLE$d,
      description: DESCRIPTION$d,
      dateModified: "2026-05-22"
    }), breadcrumbJsonLd([{
      name: "Home",
      url: absUrl("/")
    }, {
      name: "Compare",
      url: absUrl("/p/all-locations")
    }, {
      name: "Peerspace vs Pool Rental Near Me",
      url: absUrl(`/p/${SLUG$1}`)
    }]), organizationJsonLd()]
  })
});
const PATH$d = "/p/neighbors";
const $$splitComponentImporter$1B = () => import("./p.neighbors-Bi_NU3cg.js");
const TITLE$c = "Neighbors | Pool Rental Near Me Good Neighbor Standards";
const DESCRIPTION$c = "Pool Rental Near Me hosts follow good neighbor practices: notify neighbors, share contact info, limit guests and noise, and stay on-site for larger reservations. Report a host any time.";
const Route$2m = createFileRoute("/p/neighbors")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$c,
      description: DESCRIPTION$c,
      path: PATH$d,
      type: "article"
    });
    return {
      ...meta,
      scripts: [ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "Neighbors",
        path: PATH$d
      }]))]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1B, "component")
});
const $$splitComponentImporter$1A = () => import("./p.lukes-lounge-CYlHTJLp.js");
const LISTING_ID$1 = "68865990-2dec-4c64-a6a3-475f95ffe556";
const PATH$c = "/p/lukes-lounge";
const Route$2l = createFileRoute("/p/lukes-lounge")({
  loader: async () => {
    const origin = await getRouteOrigin();
    const {
      listing
    } = await getShareListing({
      data: {
        id: LISTING_ID$1
      }
    });
    if (!listing) throw notFound();
    return {
      listing,
      origin
    };
  },
  head: ({
    loaderData
  }) => {
    if (!loaderData) return {
      meta: [{
        title: "Pool rental — Pool Rental Near Me"
      }]
    };
    const {
      listing,
      origin
    } = loaderData;
    const locStr = [listing.city, listing.state].filter(Boolean).join(", ");
    const title = `${listing.title} — Private pool rental${locStr ? ` in ${locStr}` : ""}`;
    const description = `Book Luke's Lounge, a private saltwater pool near Philadelphia. $${listing.pricePerHour}/hour. Heated, fenced, BBQ, games, restroom. Free cancellation up to 2 hours before.`;
    const meta = buildMeta({
      title,
      description,
      path: PATH$c,
      image: listing.heroImage ?? void 0,
      type: "article",
      origin
    });
    const lodging = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: listing.title,
      description,
      image: listing.images.slice(0, 6),
      url: `${origin}${PATH$c}`,
      priceRange: `$${listing.pricePerHour}/hr`,
      address: locStr ? {
        "@type": "PostalAddress",
        addressLocality: listing.city ?? void 0,
        addressRegion: listing.state ?? void 0,
        addressCountry: "US"
      } : void 0,
      geo: listing.geolocation ? {
        "@type": "GeoCoordinates",
        latitude: listing.geolocation.lat,
        longitude: listing.geolocation.lng
      } : void 0
    };
    return {
      ...meta,
      scripts: [ldJsonScript(lodging)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1A, "component")
});
const INCLUDED = [{
  icon: Droplets,
  label: "Saltwater pool, free heat to 85°F",
  desc: "Complimentary heating included with every booking. Year-round swimmable."
}, {
  icon: Flame,
  label: "Heated spa, free with every booking",
  desc: "Hot tub heated to your preferred temp, up to 105°F. Always included."
}, {
  icon: Music,
  label: "Sonos outdoor sound system",
  desc: "Built-in speakers throughout the pool area. Leave your speakers at home."
}, {
  icon: Moon,
  label: "Ambience lighting",
  desc: "Underwater LEDs and ambient lighting for night swims and date nights."
}, {
  icon: Bath,
  label: "Private indoor bathroom + shower",
  desc: "Guest-only entrance. Never enter the main residence."
}, {
  icon: Trees,
  label: "Daybeds, loungers & umbrellas",
  desc: "Styled resort-style lounge furniture for sun-drenched relaxing."
}, {
  icon: Wifi,
  label: "AT&T fiber Wi-Fi",
  desc: "Throughout the property. Stream, browse, stay connected."
}, {
  icon: Car,
  label: "3 parking spots",
  desc: "1 covered garage + 2 driveway. Discreet arrival and easy load-in."
}];
const FAQS$5 = [{
  q: "How much does it cost?",
  a: "Pricing varies by day and group size. Click any 'Book' button to see live availability and the host's current rates on PRNM. Weekday rates are the host's lowest."
}, {
  q: "Is the pool actually heated for free?",
  a: "Yes. Saltwater pool is heated up to 85°F and the spa up to 105°F at no extra charge with every booking."
}, {
  q: "How many guests can I bring?",
  a: "Up to 45 guests. Great for medium and large parties, weddings, and corporate events."
}, {
  q: "Is the host on-site during my booking?",
  a: "Yes, the host is present. You also get a private indoor bathroom with its own guest entrance, so you never need to enter the main residence."
}, {
  q: "What's the cancellation policy?",
  a: "Free cancellation up to 24 hours before your reservation start time."
}, {
  q: "Can I bring outside vendors (chef, photographer, DJ)?",
  a: "Pre-approved vendors only. A small third-party vendor fee applies for outside services and is waived when you use the host's in-house vendors. No outside DJs."
}];
const $$splitComponentImporter$1z = () => import("./p.la-saltwater-featured-DdMLu3-R.js");
const PATH$b = "/p/la-saltwater-featured";
const TITLE$b = "La Saltwater Pool & Spa | Sherman Oaks Resort Rental | PRNM";
const DESCRIPTION$b = "Private saltwater pool & spa resort in Sherman Oaks. Free heat, heated spa, night swim, outdoor theater, fire pit. Up to 45 guests. Book on PRNM.";
const Route$2k = createFileRoute("/p/la-saltwater-featured")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$b,
      description: DESCRIPTION$b,
      path: PATH$b,
      image: heroNight,
      type: "article"
    });
    const lodging = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: "La Saltwater Pool & Spa",
      description: "Private saltwater pool and heated spa resort in Sherman Oaks, CA. Free heat, Sonos sound, outdoor theater, fire pit, fits up to 45 guests. Featured on Pool Rental Near Me.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sherman Oaks",
        addressRegion: "CA",
        addressCountry: "US"
      },
      image: [`${SITE_URL}${heroNight}`],
      url: `${SITE_URL}${PATH$b}`,
      maximumAttendeeCapacity: 45,
      amenityFeature: INCLUDED.map((a) => ({
        "@type": "LocationFeatureSpecification",
        name: a.label,
        value: true
      }))
    };
    const faq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS$5.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a
        }
      }))
    };
    return {
      ...meta,
      scripts: [ldJsonScript(lodging), ldJsonScript(faq)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1z, "component")
});
const $$splitComponentImporter$1y = () => import("./p.jan-BNxipUZk.js");
const LISTING_ID = "6a1a4c13-02fe-458e-89ba-e33b5fc7612b";
const PATH$a = "/p/jan";
const Route$2j = createFileRoute("/p/jan")({
  loader: async () => {
    const origin = await getRouteOrigin();
    const {
      listing
    } = await getShareListing({
      data: {
        id: LISTING_ID
      }
    });
    if (!listing) throw notFound();
    return {
      listing,
      origin
    };
  },
  head: ({
    loaderData
  }) => {
    if (!loaderData) return {
      meta: [{
        title: "TheSwimpark — Pool Rental Near Me"
      }]
    };
    const {
      listing,
      origin
    } = loaderData;
    const locStr = [listing.city, listing.state].filter(Boolean).join(", ");
    const title = `TheSwimpark — private backyard pool${locStr ? ` in ${locStr}` : ""}`;
    const description = `Book TheSwimpark with host Jan. 85° heated pool, diving board, mountain & lake views, fits up to ${listing.guests ?? 50} guests. $${listing.pricePerHour}/hour. Weddings, parties, photo shoots welcome.`;
    const meta = buildMeta({
      title,
      description,
      path: PATH$a,
      image: listing.heroImage ?? void 0,
      type: "article",
      origin
    });
    const lodging = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: listing.title,
      description,
      image: listing.images.slice(0, 6),
      url: `${origin}${PATH$a}`,
      priceRange: `$${listing.pricePerHour}/hr`,
      address: locStr ? {
        "@type": "PostalAddress",
        addressLocality: listing.city ?? void 0,
        addressRegion: listing.state ?? void 0,
        addressCountry: "US"
      } : void 0,
      geo: listing.geolocation ? {
        "@type": "GeoCoordinates",
        latitude: listing.geolocation.lat,
        longitude: listing.geolocation.lng
      } : void 0
    };
    return {
      ...meta,
      scripts: [ldJsonScript(lodging)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1y, "component")
});
const PATH$9 = "/p/how-it-works";
const STEPS = [{
  name: "Search pools near you",
  text: "Enter your city, ZIP, or address. Filter by date, group size, hot tub, slides, restrooms, shade, Wi-Fi, and pet-friendly. Every listing shows real photos, host reviews, house rules, and clear hourly pricing — no hidden fees, no bait-and-switch."
}, {
  name: "Book by the hour",
  text: "Pick your date and time window. Booking is fully online — no phone tag, no haggling. You'll see the total upfront, including cleaning fee and any extra-guest fees. Payment is held securely; the host is only paid AFTER your swim ends."
}, {
  name: "Show up and swim",
  text: "Once confirmed, you get the address and check-in details. Arrive on time, enjoy the pool with your group, and leave it the way you found it. Drop a review afterward to help future guests."
}];
const FAQS$4 = [{
  q: "How much does it cost to rent a pool?",
  a: "Hourly rates are set by each host and typically range from $40 to $150 per hour, depending on pool size, amenities (hot tub, slides, etc.), and location. The booking total includes any cleaning fee and extra-guest fees, plus a guest service fee shown at checkout. Everything is shown upfront before you confirm — no surprise charges."
}, {
  q: "Is the pool insured during my booking?",
  a: "Yes. Every Pool Rental Near Me booking includes up to $2 million in liability protection at no extra cost — covering both the host's property and guests during the rental window. (For comparison, Swimply offers $1M.)"
}, {
  q: "How do I know the pool is clean and safe?",
  a: "Hosts are required to maintain water chemistry and clean the deck before each booking. Listings show recent guest reviews and photos. If something is wrong on arrival, contact our 24/7 support team for a refund or rebooking before you start your swim."
}, {
  q: "Can I cancel a booking?",
  a: "Cancellation policies are set per listing — flexible, moderate, or strict — and are shown clearly on every listing page before you book. Most flexible listings refund 100% up to 24 hours before your booking starts, and 50% within 24 hours."
}, {
  q: "What if it rains or the weather is bad?",
  a: "Cancellation timing rules apply (see above). Outside of those windows, refunds are at the host's discretion. Pro tip: hosts with covered pools, indoor hot tubs, or heated pools are great rain-day backups — filter for those in the search."
}, {
  q: "How many guests can I bring?",
  a: "Each listing has its own max-guest count (typically 6–25 guests). Some hosts allow more for an extra per-guest fee. The number you select at booking is the max — bringing extra guests can result in the booking being canceled and no refund."
}, {
  q: "Can I book a pool for a same-day reservation?",
  a: `Yes, depending on the host's auto-approve settings. Many listings approve instantly. Others require host review (typically within 1-2 hours during business hours). Filter for "Book instantly" listings if you need same-day certainty.`
}, {
  q: "What if I have a question about a specific pool?",
  a: "Message the host directly through the listing page before you book. Hosts typically reply within an hour during the day. For platform questions, contact our 24/7 support: chat, email, or phone 1-888-940-4247."
}];
const $$splitComponentImporter$1x = () => import("./p.how-it-works-B0djT-Ut.js");
const TITLE$a = "How Does Pool Rental Work? Book a Private Pool by the Hour";
const DESCRIPTION$a = "Rent private backyard pools by the hour for parties, family swims, or quiet afternoons. Up to $2M insurance per booking, 24/7 support, a transparent guest service fee shown at checkout. Book in 5 minutes.";
const Route$2i = createFileRoute("/p/how-it-works")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$a,
      description: DESCRIPTION$a,
      path: PATH$9,
      type: "article"
    });
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How Pool Rental Near Me Works",
      description: DESCRIPTION$a,
      author: {
        "@type": "Organization",
        name: SITE_NAME$3,
        url: SITE_URL
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME$3,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon-512.png`
        }
      },
      mainEntityOfPage: `${SITE_URL}${PATH$9}`,
      inLanguage: "en"
    };
    const guestHowTo = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to book a private pool by the hour",
      description: "Find, book, and enjoy a private pool rental in three steps with Pool Rental Near Me.",
      totalTime: "PT5M",
      step: STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text
      }))
    };
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS$4.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a
        }
      }))
    };
    return {
      ...meta,
      scripts: [ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "How It Works",
        path: PATH$9
      }])), ldJsonScript(article), ldJsonScript(guestHowTo), ldJsonScript(faqLd)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1x, "component")
});
const ACADEMY_HREF = "/p/learningacademy";
const FAQS$3 = [{
  q: "How do I get paid?",
  a: "Guests are charged upfront through Stripe — same as Swimply. We process your payout within 24 hours of each booking ending, with 0% host fees through 2026 — you keep 100%. Most banks deposit it 1–3 business days later. (Swimply takes 48 hours to start, then 3–7 more days. So your money lands 4–7 days faster with us.)"
}, {
  q: "How much does it cost to list my pool?",
  a: "$0 to list. We charge 0% host fees through 2026 only on confirmed bookings. Free to list, free to keep listed, free if you take a month off. You only pay when you earn. Swimply charges 15–30% per booking depending on the pricing structure you use — ours is 0% on every booking through 2026, no exceptions."
}, {
  q: "What protection do I get on every booking?",
  a: "Up to $2 million in third-party liability insurance, automatically, on every booking. No add-ons, no extra premium, included on every booking. Most homeowner insurance policies don't cover paid pool rentals — that gap is exactly why this matters. (Swimply's coverage is $1M.)"
}, {
  q: "Are the host classes really free?",
  a: "Yes. 135 video lessons in the Pool Host Academy, all free, no credit card required, no upsell. We built it because Swimply hosts kept telling us they had to learn everything by trial and error. Topics include pricing strategy, guest screening, holiday upcharges, taxes, insurance, difficult guest scenarios, and booking acceleration. English and Spanish. Host certifications you can display on your listing."
}, {
  q: "Do I need to be home during bookings?",
  a: "Not at all. You can provide check-in info to confirmed guests through our app and let them self-serve. About 60% of our hosts choose to be home anyway — it's a personal preference, not a requirement.",
  node: /* @__PURE__ */ jsxs(Fragment, { children: [
    "Not at all. You can provide check-in info to confirmed guests through",
    " ",
    /* @__PURE__ */ jsx("a", { href: "/p/pool-rental-app", className: "font-semibold text-primary hover:underline", children: "the Pool Rental Near Me app" }),
    " ",
    "and let them self-serve. About 60% of our hosts choose to be home anyway — it's a personal preference, not a requirement."
  ] })
}, {
  q: "Can I be home during bookings?",
  a: "Yes. It's your house. Guests only see the spaces you give them access to. Many hosts find that being around leads to better reviews and repeat bookings — especially for first-time guests."
}, {
  q: "How do I price my pool?",
  a: "Use the calculator above as a starting point, then adjust based on what similar pools in your area charge. The Pool Host Academy has a full free course on pricing strategy, holiday markups, and weekend premiums. Common starting range: $50–$125/hr. Premium backyards with hot tubs, fire pits, or sound systems go higher."
}, {
  q: "Do I need to provide a restroom?",
  a: "Optional, but recommended. About 80% of successful hosts provide one — they earn more and get longer bookings. Options: an outdoor bathroom dedicated to pool guests, a side-entry into a powder room, or a porta-potty rental (~$200/month and a real option for hosts who don't want guests in the house at all)."
}, {
  q: "What if something comes up during a booking?",
  a: "24/7 host support via chat, email, and phone. Real humans, not bots. We deal with guest complaints, late arrivals, damage claims, and disputes so you don't have to. Phone: 1-888-940-4247."
}, {
  q: "What if a guest damages my pool or property?",
  a: "Document the damage with photos within 24 hours, file a report through our app, and we'll work directly with the guest's account to resolve charges. Severe damage is escalated to our liability insurance partner. (Note: Swimply offers $10K in property damage coverage. We're adding equivalent coverage in the next 60 days. For now, our $2M liability covers injury claims — the bigger insurance exposure for most hosts.)"
}, {
  q: "How is PRNM different from Swimply?",
  a: "Four things hosts tell us. (1) Our host fee is 0% through 2026 — Swimply's is 15–30%, and most hosts don't realize until they see their deposit. (2) We include $2M liability vs Swimply's $1M. (3) Money reaches your bank 4–7 days faster with us. (4) We have 135 free classes and a private host community board — Swimply has a Facebook group."
}, {
  q: "I'm currently on Swimply. Can I list on both?",
  a: "Yes. We don't lock you in. Most hosts start by listing on both — it's the smart move while you're building bookings on PRNM. Just sync your calendar between platforms manually so you don't double-book. We even have a free course on this exact topic: Multi-platform hosting: cross-listing PRNM, Swimply & Peerspace (15 minutes, the exact workflow). Some hosts keep both indefinitely; others delist from Swimply once their PRNM bookings are consistent. Your call.",
  node: /* @__PURE__ */ jsxs(Fragment, { children: [
    "Yes. We don't lock you in. Most hosts start by listing on both — it's the smart move while you're building bookings on PRNM. Just sync your calendar between platforms manually so you don't double-book.",
    " ",
    /* @__PURE__ */ jsxs("span", { className: "block mt-2", children: [
      "We even have a free course on this exact topic:",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/p/course/multi-platform-hosting-cross-listing-prnm-swimply-peerspace", className: "font-semibold text-primary hover:underline", children: "Multi-platform hosting: cross-listing PRNM, Swimply & Peerspace" }),
      ". 15 minutes, the exact workflow."
    ] }),
    /* @__PURE__ */ jsx("span", { className: "block mt-2", children: "Some hosts keep both indefinitely; others delist from Swimply once your PRNM bookings are consistent. Your call." })
  ] })
}];
const $$splitComponentImporter$1w = () => import("./p.hosting-BCfaSDHe.js");
const PATH$8 = "/p/hosting";
const TITLE$9 = "List Your Pool — 0% Host Fees All of 2026 | Pool Rental Near Me";
const DESCRIPTION$9 = "Earn $1,500–$8,000+ a month renting your pool. 0% host fees through 2026 — Swimply charges 15–30%. Free to list, $2M coverage, 135 free classes, 24-hr payouts.";
const Route$2h = createFileRoute("/p/hosting")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$9,
      description: DESCRIPTION$9,
      path: PATH$8,
      type: "article",
      image: `${SITE_URL}${heroImage$2}`
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "List Your Pool",
        path: PATH$8
      }])), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS$3.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      }), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Pool Rental Earnings Calculator",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any",
        url: `${SITE_URL}${PATH$8}#calculator`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD"
        },
        description: "Estimate your monthly take-home from renting your pool on Pool Rental Near Me vs Swimply."
      }), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "Pool Host Academy",
        url: `${SITE_URL}${ACADEMY_HREF}`,
        description: "135 free video lessons for pool rental hosts: pricing, taxes, insurance, guest screening, holiday upcharges, difficult-guest scenarios."
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1w, "component")
});
const PATH$7 = "/p/host-marketing-playbook";
const FAQS$2 = [{
  q: "What's in the host marketing playbook?",
  a: "Printable neighborhood flyers, Instagram and TikTok caption templates, a 12-month seasonal campaign calendar, email outreach scripts, and review-request templates that actually get a response."
}, {
  q: "Is the playbook free?",
  a: "Yes. It's free for every Pool Rental Near Me host. You can download the PDFs, copy the templates, and reuse them across any platform — Swimply, Peerspace, your own site."
}, {
  q: "Will the templates work outside of pool rentals?",
  a: "Many of them yes — the social and email frameworks generalize. The flyers and seasonal campaigns are tuned for pool rental demand specifically."
}, {
  q: "How often is the playbook updated?",
  a: "We refresh it each season. Spring openings, summer peak, fall winddown, and winter (event hosting, hot-tub-only) all get their own templates and timing notes."
}, {
  q: "Do you have templates in Spanish?",
  a: "Yes. The social and outreach templates ship in English and Spanish. Flyer PDFs are bilingual or come in a Spanish-only version."
}];
const BREADCRUMBS$1 = [{
  name: "Home",
  path: "/"
}, {
  name: "Host Tools",
  path: "/p/free-host-tools"
}, {
  name: "Host marketing playbook",
  path: PATH$7
}];
const $$splitComponentImporter$1v = () => import("./p.host-marketing-playbook-B3rdh1OH.js");
const PUBLISHED$1 = "2026-05-23T00:00:00Z";
const MODIFIED$1 = "2026-05-23T00:00:00Z";
const TITLE$8 = "Host marketing playbook: free templates, flyers, and seasonal campaigns | Pool Rental Near Me";
const DESCRIPTION$8 = "Free host marketing playbook: printable flyers, social post templates, seasonal campaign calendars, and outreach scripts that fill your booking calendar.";
const Route$2g = createFileRoute("/p/host-marketing-playbook")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$8,
      description: DESCRIPTION$8,
      path: PATH$7,
      type: "article",
      image: `${SITE_URL}${heroImage$3}`
    });
    return {
      meta: [...meta.meta, {
        property: "article:published_time",
        content: PUBLISHED$1
      }, {
        property: "article:modified_time",
        content: MODIFIED$1
      }, {
        property: "article:author",
        content: "Pool Rental Near Me"
      }],
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1(BREADCRUMBS$1)), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS$2.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1v, "component")
});
const PRODUCTION_HUB_SLUGS = /* @__PURE__ */ new Set(["los-angeles", "new-york", "new-york-city", "nyc", "brooklyn", "atlanta", "austin", "chicago"]);
function cityTier(city) {
  return PRODUCTION_HUB_SLUGS.has(city.slug) ? "hub" : "secondary";
}
function buildFaqs(city) {
  const isHub = cityTier(city) === "hub";
  return [{
    q: `Is Giggster or Pool Rental Near Me better for a pool in ${city.name}?`,
    a: isHub ? `${city.name} is one of Giggster's strongest production-hub markets, so a camera-ready ${city.name} pool can earn premium per-hour production rates ($150–$500+/hour) on Giggster while still capturing recreational weekend bookings ($45–$150/hour) on Pool Rental Near Me. The smart play in ${city.name} is to list on both, segment your calendar (weekday production / weekend recreational), and let each platform's buyer base do its job.` : `For a typical residential pool in ${city.name}, ${city.state}, Pool Rental Near Me is the realistic channel. Giggster's buyer base is film and photo production crews concentrated in production-hub metros — outside of those metros, Giggster's pool-buyer flow is thin. Pool Rental Near Me is built specifically for recreational hourly pool rentals to families, friend groups, and small parties at $45–$150 / hour, which matches typical ${city.name} demand.`
  }, {
    q: `What does Giggster charge ${city.name} pool hosts in 2026?`,
    a: `Giggster's national rate applies in ${city.name}: per Giggster's Help Center article "How much commission does Giggster take?" (verified May 2026), Giggster takes a 19% commission out of the host's total payout (location fee + additional fees) for the booking, plus a separate Processing Fee charged to the renter at checkout that scales with booking size. Pool Rental Near Me charges ${city.name} hosts 0% host commission through 2026 — you keep 100% — with a guest service fee applied at checkout.`
  }, {
    q: `On a $400 ${city.name} booking, how much do I keep on each platform?`,
    a: `On Pool Rental Near Me a $400 host payout is yours in full — 0% host commission through 2026. On Giggster a $400 host payout becomes $324 after the 19% host commission. That’s $76 more per booking on Pool Rental Near Me from the same gross payout, before payment processing on either side.`
  }, {
    q: `What insurance do I need to host a pool in ${city.name} on Giggster?`,
    a: `Per Giggster's Help Center articles "As a host, do I need insurance?" and "Do I need insurance to host production?", ${city.name} hosts on Giggster must carry their own homeowner's insurance, and renters (production crews) must supply a Certificate of Insurance with at least $2 million in general liability and property damage before each shoot. Renters can purchase Giggster's optional Production/Event Insurance at checkout or use their own. Pool Rental Near Me automatically covers every approved ${city.name} booking with $2,000,000 per-occurrence / $4,000,000 aggregate Hartford-backed general liability — no separate renter COI required.`
  }, {
    q: `Can I list my ${city.name} pool on Giggster and Pool Rental Near Me at the same time?`,
    a: `Yes. Many ${city.name} pool owners run both platforms. Use Giggster for production / photo / event bookings and Pool Rental Near Me for recreational hourly rentals to local families and small groups. Sync your calendar across both to prevent double-bookings.`
  }, {
    q: `Is pool rental legal in ${city.state}?`,
    a: `Hosting recreational pool rentals is legal in most ${city.state} jurisdictions when the host carries adequate liability insurance and follows local zoning, occupancy, noise, parking, and short-term-rental rules. Always verify ${city.name} city ordinances and any HOA covenants before listing. Pool Rental Near Me's Pool Host Academy includes a free HOA Defense Kit and a liability waiver generator built for residential pool hosting.`
  }];
}
const $$splitNotFoundComponentImporter$8 = () => import("./p.giggster-vs-pool-rental-near-me-in-__city_-BvR2GnZn.js");
const $$splitComponentImporter$1u = () => import("./p.giggster-vs-pool-rental-near-me-in-__city_-DRUmwsHl.js");
const Route$2f = createFileRoute("/p/giggster-vs-pool-rental-near-me-in-{$city}")({
  loader: async ({
    params
  }) => {
    const fullSlug = `giggster-vs-pool-rental-near-me-in-${params.city}`;
    const lookup = await lookupContentPage({
      data: {
        slug: fullSlug
      }
    });
    if (lookup.kind === "redirect" && lookup.redirectPath) {
      throw redirect({
        href: lookup.redirectPath,
        statusCode: 301
      });
    }
    const city = await getCityBySlug({
      data: {
        slug: params.city
      }
    });
    if (!city) throw notFound();
    return {
      city
    };
  },
  head: ({
    loaderData
  }) => {
    const city = loaderData?.city;
    if (!city) return {
      meta: [{
        title: "City not found"
      }]
    };
    const slug = `giggster-vs-pool-rental-near-me-in-${city.slug}`;
    const title = `Giggster vs Pool Rental Near Me in ${city.name}, ${city.state_code} (2026): Fees, Insurance & Best Use`;
    const description = `${city.name}, ${city.state} pool hosts: Giggster vs Pool Rental Near Me compared with verified 2026 facts — 19% vs 0% host commission (2026), renter COI vs included $2M Hartford liability, production vs recreational buyers, and the smart play for a ${city.name} pool.`;
    return {
      ...buildComparisonMeta({
        slug,
        title,
        description
      }),
      scripts: [articleJsonLd({
        slug,
        title,
        description,
        datePublished: "2026-01-15",
        dateModified: "2026-05-05"
      }), breadcrumbJsonLd([{
        name: "Home",
        url: absUrl("/")
      }, {
        name: "Giggster vs Pool Rental Near Me",
        url: absUrl("/p/giggster-vs-pool-rental-near-me")
      }, {
        name: `Giggster vs PRNM in ${city.name}`,
        url: absUrl(`/p/${slug}`)
      }]), faqJsonLd$3(buildFaqs(city).map((f) => ({
        q: f.q,
        a: f.a
      })))]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1u, "component"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$8, "notFoundComponent")
});
const faqs = [{
  q: "What is the Giggster host commission in 2026?",
  a: `Per Giggster's published Help Center article "How much commission does Giggster take?" (last updated by Giggster staff April 13, 2023, still live as of May 2026): "Giggster takes a 19% commission out of the host's total payout (location fee + additional fees (if any)) for the booking." Giggster also collects a separate Processing Fee from the renter that scales with the overall cost and features of the booking. Pool Rental Near Me charges a flat 0% host commission through 2026 — you keep 100% — with a guest service fee applied at checkout.`
}, {
  q: "Is Giggster a pool rental marketplace?",
  a: "Giggster is a production-location marketplace — film shoots, photo shoots, video, commercials, and events. Pools are listed as one Giggster category, but Giggster's buyer base is production crews and event renters, not families booking weekend swim time. Pool Rental Near Me is built specifically for recreational, hourly residential pool rentals."
}, {
  q: "What insurance does Giggster require vs Pool Rental Near Me?",
  a: `Per Giggster's Help Center articles "As a host, do I need insurance?" and "Do I need insurance to host production?": Giggster hosts must carry their own homeowner's insurance, and renters must provide a Certificate of Insurance (COI) with at least $2 million in general liability + property damage before each booking. Renters can buy Giggster's optional Production/Event Insurance at checkout or supply their own. Pool Rental Near Me's parent company PRNM Corp maintains a Business Owner's Policy through Hartford Underwriters that provides $2,000,000 per-occurrence / $4,000,000 aggregate general liability, $10,000 medical-expenses-per-person, and a $150,000 STRETCH® PLUS property coverage blanket on every approved booking — no separate renter COI required.`
}, {
  q: "On a $400 pool booking, how much do I keep on Giggster vs PRNM?",
  a: "On Pool Rental Near Me, a $400 host payout is yours in full — 0% host commission through 2026, so you keep $400. On Giggster, a $400 host payout is reduced by the 19% host commission ($76), so you keep $324. PRNM hosts keep $76 more per $400 booking. The renter-side fees on each platform are separate and are charged to the renter, not the host."
}, {
  q: "Can I list my pool on both Giggster and Pool Rental Near Me at the same time?",
  a: "Yes. Many pool owners in production-hub markets like Los Angeles, New York, Atlanta, Austin, and Chicago run both: premium per-hour production rates ($150–$500+/hour) on Giggster targeting film/photo crews, and recreational hourly rates ($45–$150/hour) on Pool Rental Near Me targeting families and small parties. Sync your calendar across both platforms to prevent conflicts."
}, {
  q: "Does Giggster have a pool host training program?",
  a: "Giggster's Help Center is production-focused — COIs, location agreements, custom rates, payouts. Pool Rental Near Me ships the Pool Host Academy: 70+ free courses on pool-specific safety, liability waiver workflows, the HOA Defense Kit, marketing, listing setup, and revenue optimization, plus a free liability waiver generator at RentalWaivers.com."
}, {
  q: "Which platform earns more in Los Angeles?",
  a: "It depends on your pool. If your pool is camera-ready and you can host weekday production crews, Giggster's production buyers in LA often pay $150–$500+/hour and can outpace recreational rates per booking. For weekend recreational bookings from LA-area families, friend groups, and small parties, Pool Rental Near Me's recreational buyer base is the better fit. Many LA pools list on both and segment availability."
}, {
  q: "Is Giggster the same as Gigster?",
  a: "No. Giggster (with two G's) is the production-location marketplace discussed on this page. Gigster (with one G) is an unrelated software-development talent marketplace. They are different companies with different business models."
}, {
  q: "Where is Giggster strongest geographically?",
  a: "Giggster was founded in 2016 in Los Angeles and is heaviest in production-hub markets — Los Angeles, New York City, Atlanta, Austin, Chicago, and select international hubs. Outside of those production hubs, Giggster's buyer demand for pools thins out, because production scouts (not local families) are the demand source."
}, {
  q: "How is the renter checkout fee structured on Giggster?",
  a: `Per Giggster's Help Center, in addition to the 19% host commission Giggster collects a Processing Fee from the renter at checkout. Giggster states the percentage "often depends on the overall cost and features of the booking" and that the rate can decrease as booking size increases. Exact figures are disclosed at checkout. Always verify current renter-side fees against Giggster's published terms.`
}];
const $$splitComponentImporter$1t = () => import("./p.giggster-vs-pool-rental-near-me-2RD2LARx.js");
const SLUG = "giggster-vs-pool-rental-near-me";
const TITLE$7 = "Giggster vs Pool Rental Near Me (2026): Fees, Insurance & Best Use Cases";
const DESCRIPTION$7 = "Side-by-side 2026 comparison of Giggster vs Pool Rental Near Me for pool owners — verified 19% vs 0% host commission (2026), COI vs included $2M insurance, production vs recreational buyers, and which platform pays more in LA, NYC, Atlanta, Austin, and Chicago.";
const Route$2e = createFileRoute("/p/giggster-vs-pool-rental-near-me")({
  component: lazyRouteComponent($$splitComponentImporter$1t, "component"),
  head: () => ({
    ...buildComparisonMeta({
      slug: SLUG,
      title: TITLE$7,
      description: DESCRIPTION$7
    }),
    scripts: [faqJsonLd$3(faqs.map((f) => ({
      q: f.q,
      a: f.a
    }))), articleJsonLd({
      slug: SLUG,
      title: TITLE$7,
      description: DESCRIPTION$7,
      datePublished: "2026-01-15",
      dateModified: "2026-05-22"
    }), breadcrumbJsonLd([{
      name: "Home",
      url: absUrl("/")
    }, {
      name: "Compare",
      url: absUrl("/p/")
    }, {
      name: "Giggster vs Pool Rental Near Me",
      url: absUrl(`/p/${SLUG}`)
    }]), organizationJsonLd()]
  })
});
const APP_URL = "https://hostpro.poolrentalnearme.com/";
const $$splitComponentImporter$1s = () => import("./p.free-host-tools-DUOtTMtR.js");
const PATH$6 = "/p/free-host-tools";
const TITLE$6 = "Host Pro — Free Tools for Pool Hosts | Pool Rental Near Me";
const DESCRIPTION$6 = "Free app for pool hosts: smart pricing, booking calendar, guest screening, waivers, earnings tracker, and tax-ready reports. No subscription, no credit card.";
const Route$2d = createFileRoute("/p/free-host-tools")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$6,
      description: DESCRIPTION$6,
      path: PATH$6,
      type: "website",
      image: `${SITE_URL}${heroImage$3}`
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "Free Host Tools",
        path: PATH$6
      }])), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Host Pro by Pool Rental Near Me",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: APP_URL,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD"
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "127"
        }
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1s, "component")
});
const $$splitComponentImporter$1r = () => import("./p.earnings-calculator-DERz6lRw.js");
const PATH$5 = "/p/earnings-calculator";
const TITLE$5 = "Pool Rental Earnings Calculator — See What Your Pool Could Earn";
const DESCRIPTION$5 = "Free calculator: estimate how much your backyard pool can earn on Pool Rental Near Me. Adjust hourly rate, hours per week, and season length to see annual income with 0% host fees in 2026 — you keep 100%.";
const Route$2c = createFileRoute("/p/earnings-calculator")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$5,
      description: DESCRIPTION$5,
      path: PATH$5,
      type: "website"
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "Earnings Calculator",
        path: PATH$5
      }])), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Pool Rental Earnings Calculator",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: `${SITE_URL}${PATH$5}`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD"
        }
      }), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [{
          "@type": "Question",
          name: "How much can I really earn renting my pool?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most active hosts earn $3,000–$15,000 per year. Warm-climate hosts in Florida, Arizona, Texas, and California with high-amenity pools regularly clear $20,000+. Earnings depend on your hourly rate, weekly bookings, and length of swim season."
          }
        }, {
          "@type": "Question",
          name: "What fee does Pool Rental Near Me take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PRNM charges 0% host fees through 2026 — no monthly subscription, no listing fee, no surprise deductions. Every booking includes $2M liability coverage at no extra cost."
          }
        }, {
          "@type": "Question",
          name: "How is this different from Swimply?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PRNM's host fee is 0% through 2026 versus Swimply's 15%. On the same $50/hr rate that means you keep $50 vs $42.50 per hour booked — roughly $2,000 more per year for an average host."
          }
        }]
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1r, "component")
});
const $$splitComponentImporter$1q = () => import("./p.dog-BTU5dmpx.js");
const Route$2b = createFileRoute("/p/dog")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/dashboard",
      replace: true
    });
  },
  head: () => ({
    meta: [{
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1q, "component")
});
const listPublishedBlogPosts = createServerFn({
  method: "GET"
}).handler(createSsrRpc("cbca93b18615dd3c3b1e7f928ad8fca76984653bf22824178e3306e102dfd77d"));
const $$splitComponentImporter$1p = () => import("./p.blog-AOPGZDAp.js");
const Route$2a = createFileRoute("/p/blog")({
  loader: async () => {
    const {
      posts
    } = await listPublishedBlogPosts();
    return {
      posts
    };
  },
  head: () => ({
    ...buildMeta({
      title: "Pool rental blog — guides for hosts and guests",
      description: "Practical guides on pool care, water chemistry, hosting, safety, and pool parties from Pool Rental Near Me. 133 posts across 8 categories.",
      path: "/p/blog",
      type: "website"
    })
  }),
  component: lazyRouteComponent($$splitComponentImporter$1p, "component")
});
const getAllLocations = createServerFn({
  method: "GET"
}).handler(createSsrRpc("7888cc70b7b717dc0a6b512834aa615767e6dd3827e62604f0ea84ec28de0d6f"));
const getTopCities = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(60).default(24)
}).parse(d ?? {})).handler(createSsrRpc("a299d5188002fd52fc20aa4ee3efab12b571e61773a00c95f2ec04990df7c25f"));
const $$splitComponentImporter$1o = () => import("./p.all-locations-NJawkbr1.js");
const Route$29 = createFileRoute("/p/all-locations")({
  loader: async () => {
    const [data, topCities] = await Promise.all([getAllLocations(), getTopCities({
      data: {
        limit: 24
      }
    }).catch(() => [])]);
    return {
      ...data,
      topCities
    };
  },
  head: ({
    loaderData
  }) => {
    const meta = buildMeta({
      title: `Pool rentals near me — every US city with a private pool for rent`,
      description: "Pool rentals near me, by state and city. Browse every US city with a private backyard pool to rent by the hour. $2M insurance included on every booking.",
      path: "/p/all-locations"
    });
    return {
      meta: meta.meta,
      links: meta.links
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1o, "component")
});
const PATH$4 = "/p/ai-listing-generator";
const FAQS$1 = [{
  q: "What does the AI pool listing generator do?",
  a: "You upload one or more photos of your pool. The tool returns a finished listing: title, two-paragraph description, amenities list, suggested hourly rate, and a starter set of house rules."
}, {
  q: "Is the AI listing generator free?",
  a: "Yes. It's free for every host on Pool Rental Near Me — no caps, no credit card. Listings you create flow straight into your dashboard."
}, {
  q: "Can I edit what the AI writes?",
  a: "Everything is editable. The output is a strong first draft, not a final answer. Most hosts tweak the title, swap one or two amenities, and publish in under five minutes."
}, {
  q: "Will my photos be used to train other models?",
  a: "No. Your photos are used to generate your listing copy and stored on your account. We never use them to train external models or share them with other hosts."
}, {
  q: "What pool rental description generator works best for SEO?",
  a: "Ours is tuned on the top-ranking pool rental listings on Pool Rental Near Me, Swimply, and Peerspace. It uses the keywords renters actually search and avoids the boilerplate that hurts rankings."
}];
const BREADCRUMBS = [{
  name: "Home",
  path: "/"
}, {
  name: "Host Tools",
  path: "/p/free-host-tools"
}, {
  name: "AI listing generator",
  path: PATH$4
}];
const $$splitComponentImporter$1n = () => import("./p.ai-listing-generator-CfA92qFD.js");
const PUBLISHED = "2026-05-23T00:00:00Z";
const MODIFIED = "2026-05-23T00:00:00Z";
const TITLE$4 = "AI pool listing generator: turn one photo into a booking-ready listing | Pool Rental Near Me";
const DESCRIPTION$4 = "Upload one photo of your pool and our AI pool listing generator writes the title, description, amenities list, and house rules in under a minute. Free for hosts.";
const Route$28 = createFileRoute("/p/ai-listing-generator")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$4,
      description: DESCRIPTION$4,
      path: PATH$4,
      type: "article",
      image: `${SITE_URL}${heroImage$3}`
    });
    return {
      meta: [...meta.meta, {
        property: "article:published_time",
        content: PUBLISHED
      }, {
        property: "article:modified_time",
        content: MODIFIED
      }, {
        property: "article:author",
        content: "Pool Rental Near Me"
      }],
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1(BREADCRUMBS)), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS$1.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1n, "component")
});
const $$splitComponentImporter$1m = () => import("./p.affiliate-program-CjCQTy08.js");
const PATH$3 = "/p/affiliate-program";
const TITLE$3 = "Apply to the Pool Rental Near Me Affiliate Program";
const DESCRIPTION$3 = "Refer pool hosts to Pool Rental Near Me and earn 5% of every booking they take, for the lifetime of the host. No password required — sign in with a magic link.";
const Route$27 = createFileRoute("/p/affiliate-program")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$3,
      description: DESCRIPTION$3,
      path: PATH$3
    });
    return {
      meta: meta.meta,
      links: meta.links
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1m, "component")
});
const $$splitComponentImporter$1l = () => import("./p.affiliate-dashboard-D42ZeNh_.js");
const Route$26 = createFileRoute("/p/affiliate-dashboard")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/p/affiliate-program"
      });
    }
  },
  head: () => ({
    meta: [{
      title: "Affiliate dashboard — Pool Rental Near Me"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1l, "component")
});
const FAQS = [{
  q: "Who counts as an 'approved' host?",
  a: "An approved host has completed onboarding, passed safety review, listed at least one pool, and completed at least one paid booking using your referral link."
}, {
  q: "When does the 0% fee window start?",
  a: "The day your 5th referral completes their first paid booking. It runs for 12 consecutive months from that date and applies to every booking on every pool you host."
}, {
  q: "How is the 5% recruiter commission paid?",
  a: "Monthly, via the same payout method as your hosting earnings. You'll see a separate 'Recruiter commission' line in your dashboard with a breakdown by referred host."
}, {
  q: "Can I do both — earn the fee waiver AND recruit?",
  a: "Yes. The fee waiver applies to your own hosting income. The 5% recruiter commission is a separate program for active recruiters. Many top recruiters do both."
}, {
  q: "Is there a cap?",
  a: "No cap on referrals or commission. Some of our top recruiters earn more from commissions than from their own pool."
}];
const $$splitComponentImporter$1k = () => import("./p.affiliate-7C-h8Od8.js");
const PATH$2 = "/p/affiliate";
const TITLE$2 = "Host Referral Program — Refer 5 Hosts, Pay $0 Fees for a Year";
const DESCRIPTION$2 = "Refer 5 approved pool hosts and we waive your platform fees for 12 months. Recruit pools and earn 5% of their bookings for 2 years.";
const Route$25 = createFileRoute("/p/affiliate")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$2,
      description: DESCRIPTION$2,
      path: PATH$2
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "Host Referral Program",
        path: PATH$2
      }])), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      }), ldJsonScript({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: TITLE$2,
        description: DESCRIPTION$2,
        url: `${SITE_URL}${PATH$2}`
      })]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1k, "component")
});
const PATH$1 = "/p/about-our-company";
const $$splitComponentImporter$1j = () => import("./p.about-our-company-DNY3VsJt.js");
const TITLE$1 = "About Our Company | PRNM Corp & 10,000 Solutions LLC";
const DESCRIPTION$1 = "Pool Rental Near Me is operated by PRNM Corp, a Delaware C-Corporation, sister to 10,000 Solutions LLC. Meet the leadership and brands behind the marketplace.";
const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pool Rental Near Me",
  alternateName: "PRNM",
  url: "https://poolrentalnearme.com",
  logo: "https://poolrentalnearme.com/logo.png",
  parentOrganization: {
    "@type": "Organization",
    name: "PRNM Corp",
    url: "https://poolrentalnearme.com"
  },
  founder: [{
    "@type": "Person",
    name: "Derek Bowen",
    jobTitle: "Founder & CEO"
  }, {
    "@type": "Person",
    name: "Brandon Elias",
    jobTitle: "Co-Founder & COO"
  }],
  sameAs: ["https://www.einpresswire.com/article/908834379/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours"]
};
const Route$24 = createFileRoute("/p/about-our-company")({
  head: () => {
    const meta = buildMeta({
      title: TITLE$1,
      description: DESCRIPTION$1,
      path: PATH$1,
      type: "website"
    });
    return {
      ...meta,
      scripts: [ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "About Our Company",
        path: PATH$1
      }])), ldJsonScript(ORG_LD)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1j, "component")
});
const ACADEMY_HUB_PATH = "/p/learningacademy";
const SPANISH_ACADEMY_HUB_PATH = "/p/aprende-a-rentar-tu-piscina";
const ACADEMY_HUB_SLUGS = {
  en: "learningacademy",
  es: "aprende-a-rentar-tu-piscina"
};
function academyHubPath(lang = "en") {
  return lang === "es" ? SPANISH_ACADEMY_HUB_PATH : ACADEMY_HUB_PATH;
}
function coursePath(slug) {
  return `/p/course/${encodeURIComponent(slug)}`;
}
function academyLangForSlug(slug) {
  if (!slug) return null;
  if (slug === ACADEMY_HUB_SLUGS.en) return "en";
  if (slug === ACADEMY_HUB_SLUGS.es) return "es";
  return null;
}
const getNearbyCitiesForPage = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  templateType: z.string().nullable(),
  slug: z.string().nullable(),
  limit: z.number().int().min(1).max(24).optional(),
  requirePathPrefix: z.string().optional()
}).parse(data)).handler(createSsrRpc("78b890a64751dc1fa77a1fcbd4136714e6c2205a7ea32c71ae1882b50242c20d"));
const getCitySources = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  slug: z.string().min(1)
}).parse(data)).handler(createSsrRpc("938eb8f8e10b36adf2cedd77488d0ef03e85b4a35ad99c31f79fdc76b5f81397"));
const getInternalLinkTargets = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  citySlug: z.string().nullable().optional(),
  nearbyCitySlugs: z.array(z.string()).optional()
}).parse(data)).handler(createSsrRpc("73cb5e46062dcac03bae88abd15e15438c0a270fb576390d6dfaf491512c5864"));
const log404 = createServerFn({
  method: "POST"
}).inputValidator((data) => z.object({
  urlPath: z.string().min(1).max(2048),
  slug: z.string().nullable().optional(),
  referrer: z.string().max(2048).nullable().optional(),
  userAgent: z.string().max(1024).nullable().optional()
}).parse(data)).handler(createSsrRpc("b861a391ff5c69a64cd5ed90870fe31a07d11e4cc934dbc141a9c9100f88d251"));
const list404s = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  unresolvedOnly: z.boolean().optional().default(true),
  pPathsOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(500).optional().default(100)
}).parse(data ?? {})).handler(createSsrRpc("d5855c7ec203d5072570f9def7914c5e5262be6d56334e14bb4311ed151aa05f"));
const resolve404 = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional()
}).parse(data)).handler(createSsrRpc("8ab83e7b79975e2413e8d5fee5092790d00f93658f9d201d5fee2697a02c319a"));
const redirect404 = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  id: z.string().uuid(),
  target: z.string().trim().min(1).max(2048)
}).parse(data)).handler(createSsrRpc("ea4ced18ec0e39e288b27807d289364d09296a0c283167fb93894c1c5c895484"));
const createPageFor404 = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  id: z.string().uuid()
}).parse(data)).handler(createSsrRpc("3f7d63ee75bd9996df2c97408fec354252b401593e294069550cf2f3408a9210"));
const ADVOCACY_HUB_PATH = "/p/host-advocacy";
const ADVOCACY_STATES = [
  { slug: "host-advocacy-alabama", name: "Alabama", code: "AL" },
  { slug: "host-advocacy-alaska", name: "Alaska", code: "AK" },
  { slug: "host-advocacy-arizona", name: "Arizona", code: "AZ" },
  { slug: "host-advocacy-arkansas", name: "Arkansas", code: "AR" },
  { slug: "host-advocacy-california", name: "California", code: "CA" },
  { slug: "host-advocacy-colorado", name: "Colorado", code: "CO" },
  { slug: "host-advocacy-connecticut", name: "Connecticut", code: "CT" },
  { slug: "host-advocacy-delaware", name: "Delaware", code: "DE" },
  { slug: "host-advocacy-florida", name: "Florida", code: "FL" },
  { slug: "host-advocacy-georgia", name: "Georgia", code: "GA" },
  { slug: "host-advocacy-hawaii", name: "Hawaii", code: "HI" },
  { slug: "host-advocacy-idaho", name: "Idaho", code: "ID" },
  { slug: "host-advocacy-illinois", name: "Illinois", code: "IL" },
  { slug: "host-advocacy-indiana", name: "Indiana", code: "IN" },
  { slug: "host-advocacy-iowa", name: "Iowa", code: "IA" },
  { slug: "host-advocacy-kansas", name: "Kansas", code: "KS" },
  { slug: "host-advocacy-kentucky", name: "Kentucky", code: "KY" },
  { slug: "host-advocacy-louisiana", name: "Louisiana", code: "LA" },
  { slug: "host-advocacy-maine", name: "Maine", code: "ME" },
  { slug: "host-advocacy-maryland", name: "Maryland", code: "MD" },
  { slug: "host-advocacy-massachusetts", name: "Massachusetts", code: "MA" },
  { slug: "host-advocacy-michigan", name: "Michigan", code: "MI" },
  { slug: "host-advocacy-minnesota", name: "Minnesota", code: "MN" },
  { slug: "host-advocacy-mississippi", name: "Mississippi", code: "MS" },
  { slug: "host-advocacy-missouri", name: "Missouri", code: "MO" },
  { slug: "host-advocacy-montana", name: "Montana", code: "MT" },
  { slug: "host-advocacy-nebraska", name: "Nebraska", code: "NE" },
  { slug: "host-advocacy-nevada", name: "Nevada", code: "NV" },
  { slug: "host-advocacy-new-hampshire", name: "New Hampshire", code: "NH" },
  { slug: "host-advocacy-new-jersey", name: "New Jersey", code: "NJ" },
  { slug: "host-advocacy-new-mexico", name: "New Mexico", code: "NM" },
  { slug: "host-advocacy-new-york", name: "New York", code: "NY" },
  { slug: "host-advocacy-north-carolina", name: "North Carolina", code: "NC" },
  { slug: "host-advocacy-north-dakota", name: "North Dakota", code: "ND" },
  { slug: "host-advocacy-ohio", name: "Ohio", code: "OH" },
  { slug: "host-advocacy-oklahoma", name: "Oklahoma", code: "OK" },
  { slug: "host-advocacy-oregon", name: "Oregon", code: "OR" },
  { slug: "host-advocacy-pennsylvania", name: "Pennsylvania", code: "PA" },
  { slug: "host-advocacy-rhode-island", name: "Rhode Island", code: "RI" },
  { slug: "host-advocacy-south-carolina", name: "South Carolina", code: "SC" },
  { slug: "host-advocacy-south-dakota", name: "South Dakota", code: "SD" },
  { slug: "host-advocacy-tennessee", name: "Tennessee", code: "TN" },
  { slug: "host-advocacy-texas", name: "Texas", code: "TX" },
  { slug: "host-advocacy-utah", name: "Utah", code: "UT" },
  { slug: "host-advocacy-vermont", name: "Vermont", code: "VT" },
  { slug: "host-advocacy-virginia", name: "Virginia", code: "VA" },
  { slug: "host-advocacy-washington", name: "Washington", code: "WA" },
  { slug: "host-advocacy-west-virginia", name: "West Virginia", code: "WV" },
  { slug: "host-advocacy-wisconsin", name: "Wisconsin", code: "WI" },
  { slug: "host-advocacy-wyoming", name: "Wyoming", code: "WY" }
];
const NEIGHBORS = {
  AL: ["MS", "GA", "TN", "FL"],
  AK: ["WA", "OR", "HI", "CA"],
  AZ: ["CA", "NV", "UT", "NM"],
  AR: ["TX", "LA", "MS", "TN", "MO", "OK"],
  CA: ["NV", "AZ", "OR"],
  CO: ["NM", "UT", "WY", "NE", "KS", "OK"],
  CT: ["NY", "MA", "RI"],
  DE: ["NJ", "PA", "MD"],
  FL: ["GA", "AL"],
  GA: ["FL", "AL", "TN", "NC", "SC"],
  HI: ["CA", "AK"],
  ID: ["WA", "OR", "NV", "UT", "WY", "MT"],
  IL: ["IN", "IA", "MO", "KY", "WI"],
  IN: ["IL", "OH", "KY", "MI"],
  IA: ["IL", "WI", "MN", "SD", "NE", "MO"],
  KS: ["NE", "MO", "OK", "CO"],
  KY: ["TN", "VA", "WV", "OH", "IN", "IL", "MO"],
  LA: ["TX", "AR", "MS"],
  ME: ["NH", "MA", "VT"],
  MD: ["VA", "WV", "PA", "DE"],
  MA: ["NY", "CT", "RI", "NH", "VT"],
  MI: ["OH", "IN", "WI"],
  MN: ["WI", "IA", "SD", "ND"],
  MS: ["LA", "AR", "TN", "AL"],
  MO: ["KS", "NE", "IA", "IL", "KY", "TN", "AR", "OK"],
  MT: ["ID", "WY", "SD", "ND"],
  NE: ["KS", "MO", "IA", "SD", "WY", "CO"],
  NV: ["CA", "OR", "ID", "UT", "AZ"],
  NH: ["VT", "ME", "MA"],
  NJ: ["NY", "PA", "DE"],
  NM: ["AZ", "CO", "OK", "TX"],
  NY: ["NJ", "PA", "CT", "MA", "VT"],
  NC: ["SC", "GA", "TN", "VA"],
  ND: ["MN", "SD", "MT"],
  OH: ["MI", "IN", "KY", "WV", "PA"],
  OK: ["TX", "NM", "CO", "KS", "MO", "AR"],
  OR: ["CA", "NV", "ID", "WA"],
  PA: ["NY", "NJ", "DE", "MD", "WV", "OH"],
  RI: ["CT", "MA"],
  SC: ["NC", "GA"],
  SD: ["ND", "MN", "IA", "NE", "WY", "MT"],
  TN: ["KY", "VA", "NC", "GA", "AL", "MS", "AR", "MO"],
  TX: ["NM", "OK", "AR", "LA"],
  UT: ["ID", "WY", "CO", "NM", "AZ", "NV"],
  VT: ["NY", "NH", "MA"],
  VA: ["NC", "TN", "KY", "WV", "MD"],
  WA: ["OR", "ID"],
  WV: ["KY", "VA", "MD", "PA", "OH"],
  WI: ["MN", "IA", "IL", "MI"],
  WY: ["MT", "SD", "NE", "CO", "UT", "ID"]
};
const BY_CODE = Object.fromEntries(
  ADVOCACY_STATES.map((s) => [s.code, s])
);
const BY_SLUG = Object.fromEntries(
  ADVOCACY_STATES.map((s) => [s.slug, s])
);
function findAdvocacyState(slug) {
  if (!slug) return null;
  const direct = BY_SLUG[slug];
  if (direct) return direct;
  if (slug.includes("-pa-")) return BY_CODE.PA ?? null;
  return null;
}
function relatedAdvocacyStates(state, limit = 6) {
  const out = [];
  const seen = /* @__PURE__ */ new Set([state.code]);
  for (const code of NEIGHBORS[state.code] ?? []) {
    const row = BY_CODE[code];
    if (row && !seen.has(code)) {
      out.push(row);
      seen.add(code);
      if (out.length >= limit) return out;
    }
  }
  const popular = ["CA", "FL", "TX", "NY", "AZ", "GA", "NC", "NJ", "PA", "OH"];
  for (const code of popular) {
    const row = BY_CODE[code];
    if (row && !seen.has(code)) {
      out.push(row);
      seen.add(code);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
const STATE_NAMES$3 = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "Washington, D.C."
};
function parseCitySlug(citySlug) {
  const parts = citySlug.split("-");
  const last = parts[parts.length - 1]?.toUpperCase() ?? "";
  const isState = last.length === 2 && STATE_NAMES$3[last];
  const stateCode = isState ? last : null;
  const cityParts = isState ? parts.slice(0, -1) : parts;
  const city = cityParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  return { city, stateCode };
}
function hostAcqFaqs(city, stateCode) {
  const where = stateCode ? `${city}, ${stateCode}` : city;
  return [
    {
      question: `How much can I earn renting out my pool in ${where}?`,
      answer: `Most Pool Rental Near Me hosts in ${where} earn $5,000–$15,000 per month during peak season. Earnings depend on your pool's amenities, photos, and how many hours you make it available.`
    },
    {
      question: `What does it cost to list my pool in ${where}?`,
      answer: `Listing is free. Pool Rental Near Me charges 0% host fees through 2026 on completed bookings — no monthly fees, no setup costs, no upfront payment.`
    },
    {
      question: `Is my pool covered by insurance when I host in ${where}?`,
      answer: `Yes. Every booking includes $2 million in liability protection at no extra cost to the host.`
    },
    {
      question: `How is Pool Rental Near Me different from Swimply?`,
      answer: `Pool Rental Near Me charges 0% host fees through 2026 — significantly less than Swimply's 15%+ fees — and our team prioritizes host support, including the free Pool Host Academy with 70+ training courses.`
    },
    {
      question: `How quickly can I start accepting bookings in ${where}?`,
      answer: `Most ${where} hosts go live within 24–48 hours of submitting their listing. Add 6+ photos, your hourly rate, and your availability, and you can be booked the same week.`
    }
  ];
}
function hostAdvocacyFaqs(stateName2) {
  return [
    {
      question: `Is it legal to rent out my pool in ${stateName2}?`,
      answer: `Renting your residential pool is legal in every US state, including ${stateName2}. The specific rules come from four layers: state pool safety code, county and city ordinances, your HOA covenants, and your homeowner's insurance contract. Most ${stateName2} hosts can list legally as long as their pool meets state barrier code and they notify their insurance carrier in writing.`
    },
    {
      question: `Do I need a permit to host pool rentals in ${stateName2}?`,
      answer: `Most ${stateName2} cities do not require a separate permit for hourly pool rentals because guests do not stay overnight. A growing number of cities (especially in Florida, Arizona, and parts of California) fold pool rentals into their short-term rental ordinance and require a $50–$400 annual registration. Check your city or county clerk before listing.`
    },
    {
      question: `What pool barrier requirements apply in ${stateName2}?`,
      answer: `${stateName2} follows some version of the International Swimming Pool and Spa Code. Expect a continuous barrier at least 48 inches high (60 inches in a few states), self-closing and self-latching gates that open outward, anti-entrapment drain covers compliant with the federal VGB Act, and in some states an additional layer such as door alarms or a safety cover.`
    },
    {
      question: `Will hosting affect my homeowner's insurance in ${stateName2}?`,
      answer: `Standard homeowner's policies contain a business-pursuits exclusion that can void coverage for guest injuries during a paid rental. Every Pool Rental Near Me booking includes $2 million in liability protection, but you should still notify your homeowner's carrier in writing so unrelated claims are not affected.`
    },
    {
      question: `How much can I earn renting my pool in ${stateName2}?`,
      answer: `${stateName2} hosts typically charge $40–$150 per hour and earn $3,000–$10,000 per month during peak season, depending on location, amenities, and how many hours the pool is available. Pool Rental Near Me charges 0% host fees through 2026, lower than competing platforms.`
    },
    {
      question: `Can my HOA stop me from renting my pool in ${stateName2}?`,
      answer: `An HOA can enforce its CC&Rs, which often include a "no commercial use" clause. The rule is enforceable through fines or a lien but it is private contract law, not state law. Many ${stateName2} HOAs approve pool rentals when given a written hosting plan, proof of $2M liability coverage, and clear house rules.`
    }
  ];
}
function hostAdvocacyHubFaqs() {
  return [
    {
      question: `Is renting your pool by the hour legal in the United States?`,
      answer: `Yes. Hourly pool rentals are legal in every US state. There is no federal law that specifically regulates private short-term pool rentals. All governance comes from state pool safety codes, county and city ordinances, HOA covenants, and your homeowner's insurance contract.`
    },
    {
      question: `What pool safety code applies to a rental pool?`,
      answer: `Almost every state has adopted some version of the International Swimming Pool and Spa Code (ISPSC) or the federal Virginia Graeme Baker Pool and Spa Safety Act standards. The baseline: a continuous 48-inch barrier (60 inches in some states), self-closing self-latching gates, anti-entrapment drain covers, and in some states pool or door alarms.`
    },
    {
      question: `Do I need to register as a short-term rental?`,
      answer: `Most short-term rental ordinances regulate overnight transient lodging and do not apply to pool-only rentals. A growing number of cities (Scottsdale, parts of Los Angeles County, Miami-Dade) treat any commercial use of a residence as subject to STR registration. Check your city's specific rule before listing.`
    },
    {
      question: `Does my homeowner's insurance cover pool rental income?`,
      answer: `Standard HO-3 and HO-5 policies contain a business-pursuits exclusion that typically denies coverage for guest injuries during a paid rental. Pool Rental Near Me includes $2 million in per-booking liability coverage, and we recommend notifying your homeowner's carrier in writing as well.`
    },
    {
      question: `How is pool rental income taxed?`,
      answer: `Federally, hosting income is reportable on Schedule C if you host actively or Schedule E if hosting is more passive. State income tax applies in any state with one. A small but growing number of cities (mostly in FL, AZ, and CA) require collection of a transient occupancy tax even on day-only pool rentals.`
    },
    {
      question: `Where do I find the rules for my state?`,
      answer: `Use the state index on this page. Each state guide covers specific code citations, fence heights, alarm rules, HOA prevalence, short-term rental treatment, and tax notes for that state.`
    }
  ];
}
function swimInstructorCityFaqs(city, stateCode) {
  const where = stateCode ? `${city}, ${stateCode}` : city;
  return [
    {
      question: `Can I rent a private pool to teach swim lessons in ${where}?`,
      answer: `Yes. Pool Rental Near Me lets certified swim instructors book private backyard pools in ${where} by the hour — perfect for private and small-group lessons without the overhead of a public facility.`
    },
    {
      question: `How much does it cost to rent a pool for swim lessons in ${where}?`,
      answer: `Pool rentals in ${where} typically run $40–$120 per hour. Most instructors price private lessons at $60–$100 and group lessons at $25–$40 per swimmer to clear a healthy margin after the rental fee.`
    },
    {
      question: `Do I need lifeguard or swim instructor certification to teach in a rented pool?`,
      answer: `Hosts generally expect instructors to carry current Red Cross WSI, ASCA, or equivalent certification, plus CPR/First Aid. We recommend showing certifications to the host before booking.`
    },
    {
      question: `Am I covered by insurance when teaching lessons in a rented ${where} pool?`,
      answer: `Pool Rental Near Me bookings include $2M in property liability for the host. Instructors should carry their own professional liability policy (commonly through K&K or a swim-school carrier) to cover the lessons themselves.`
    },
    {
      question: `How do I find pools in ${where} that allow swim instruction?`,
      answer: `Search ${where} on Pool Rental Near Me, filter for shallow-end depth and pool size that fits your students, and message hosts to confirm they're comfortable with paid lessons on-site.`
    }
  ];
}
function swimInstructorHubFaqs() {
  return [
    {
      question: `Can swim instructors rent private pools to teach lessons?`,
      answer: `Yes. Pool Rental Near Me is one of the most popular ways for independent swim instructors and small swim schools to access private backyard pools by the hour, without signing a long-term lease.`
    },
    {
      question: `What does a swim instructor typically pay to rent a pool?`,
      answer: `Most instructors pay $40–$120 per hour for a backyard pool, depending on size, location, and amenities. Many hosts offer recurring weekly discounts for ongoing lesson schedules.`
    },
    {
      question: `What certifications do swim instructors need?`,
      answer: `Hosts generally expect Red Cross Water Safety Instructor (WSI), ASCA Level 1+, or equivalent, plus current CPR and First Aid. Some hosts may also ask for proof of liability insurance.`
    },
    {
      question: `Is there liability coverage when teaching in a rented pool?`,
      answer: `Each booking includes $2M in property liability for the host. Instructors should carry their own professional liability insurance for the lessons themselves.`
    }
  ];
}
function eventGuideFaqs(eventLabel, where) {
  return [
    {
      question: `How much does it cost to rent a pool for a ${eventLabel} in ${where}?`,
      answer: `Most ${where} pool rentals run $40–$150 per hour. Total cost depends on group size, time of day, and add-ons like a hot tub, BBQ, or covered patio. You'll see the full price before booking.`
    },
    {
      question: `How many guests can I bring to a ${eventLabel} pool rental in ${where}?`,
      answer: `Each ${where} listing sets its own guest cap, typically 10–25 people. Filter by guest count when you search to find pools that fit your group.`
    },
    {
      question: `Can I host a ${eventLabel} at a private pool with food and music?`,
      answer: `Most hosts allow food, drinks, and reasonable music — many even include a grill or BBQ area. Check the listing's house rules and message the host before booking if you're planning catering or amplified sound.`
    },
    {
      question: `Is there liability coverage for a ${eventLabel} pool rental?`,
      answer: `Yes. Every Pool Rental Near Me booking includes $2 million in liability coverage at no extra cost to the guest or host.`
    },
    {
      question: `How far in advance should I book a pool for a ${eventLabel} in ${where}?`,
      answer: `For weekends in peak summer, book 2–4 weeks ahead. Mid-week and shoulder-season ${where} bookings are usually available within a few days.`
    }
  ];
}
function genericResourceFaqs(title) {
  return [
    {
      question: `What is Pool Rental Near Me?`,
      answer: `Pool Rental Near Me is a peer-to-peer marketplace where homeowners rent out their backyard pools by the hour. Guests get a private pool, hosts earn money, and every booking includes $2M in liability coverage.`
    },
    {
      question: `How much does a private pool rental cost?`,
      answer: `Most pool rentals range from $40 to $150 per hour depending on the pool, amenities, location, and time of day. You see the full price before you book.`
    },
    {
      question: `How much can I earn renting out my pool?`,
      answer: `Typical hosts earn $3,000–$10,000 per month during peak season, with top hosts clearing $15,000+. Pool Rental Near Me charges 0% host fees through 2026 — lower than Swimply's 15%+.`
    },
    {
      question: `Is there liability insurance included?`,
      answer: `Yes. Every booking includes $2 million in liability protection at no extra cost to the host or guest. (Reference: ${title}.)`
    }
  ];
}
function parseEventGuideSlug(slug) {
  const m = slug.match(/^guide-to-(.+?)-pool-rental-(.+)$/);
  if (!m) return null;
  const eventLabel = m[1].split("-").join(" ");
  return { eventLabel, citySlug: m[2] };
}
function faqsForContentPage(page) {
  const stored = page.faq_items;
  if (Array.isArray(stored) && stored.length > 0) {
    const cleaned = stored.filter((f) => !!f && typeof f.question === "string" && typeof f.answer === "string" && f.question.trim() !== "" && f.answer.trim() !== "").map((f) => ({ question: f.question, answer: f.answer }));
    if (cleaned.length > 0) return cleaned;
  }
  const t = page.template_type;
  if (t === "host_acq_city" || t === "spanish_host_acq") {
    const citySlug = cityForContentPage(t, page.slug);
    if (!citySlug) return [];
    const { city, stateCode } = parseCitySlug(citySlug);
    return hostAcqFaqs(city, stateCode);
  }
  if (t === "swim_instructor_city") {
    const citySlug = cityForContentPage(t, page.slug);
    if (!citySlug) return [];
    const { city, stateCode } = parseCitySlug(citySlug);
    return swimInstructorCityFaqs(city, stateCode);
  }
  if (t === "swim_instructor_hub") {
    return swimInstructorHubFaqs();
  }
  if (t === "host_advocacy_hub") {
    return hostAdvocacyHubFaqs();
  }
  if (t === "host_advocacy_state" && page.slug) {
    const state = findAdvocacyState(page.slug);
    if (state) return hostAdvocacyFaqs(state.name);
    const m = page.slug.match(/-([a-z]{2})$/i);
    if (m) {
      const code = m[1].toUpperCase();
      return hostAdvocacyFaqs(STATE_NAMES$3[code] ?? code);
    }
  }
  if (t === "event_guide" && page.slug) {
    const parsed = parseEventGuideSlug(page.slug);
    if (parsed) {
      const { city, stateCode } = parseCitySlug(parsed.citySlug);
      const where = stateCode ? `${city}, ${stateCode}` : city;
      return eventGuideFaqs(parsed.eventLabel, where);
    }
    return [];
  }
  if (t === "resource" || t === "spanish_resource") {
    const title = page.title || page.seo_title || "this guide";
    return genericResourceFaqs(title);
  }
  return [];
}
function faqPageJsonLd(faqs2) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs2.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".faq-answer"]
        }
      }
    }))
  };
}
const IMGIX_HOSTS = ["imgix.net", "sharetribe-assets.imgix.net"];
const UNSPLASH_HOST = "images.unsplash.com";
const SUPABASE_RENDER = "/storage/v1/render/image/public/";
const SUPABASE_OBJECT = "/storage/v1/object/public/";
const HERO_BREAKPOINTS = [480, 768, 1200, 1600];
function isImgix(u) {
  return IMGIX_HOSTS.some((h) => u.hostname.endsWith(h));
}
function isUnsplash(u) {
  return u.hostname === UNSPLASH_HOST;
}
function isSupabaseObject(u) {
  return u.pathname.includes(SUPABASE_OBJECT);
}
function heroVariant(src, width) {
  try {
    const u = new URL(src);
    if (isImgix(u) || isUnsplash(u)) {
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      u.searchParams.set("w", String(width));
      u.searchParams.set("h", String(Math.round(width * 9 / 16)));
      u.searchParams.set("q", "70");
      return u.toString();
    }
    if (isSupabaseObject(u)) {
      const transformed = u.pathname.replace(SUPABASE_OBJECT, SUPABASE_RENDER);
      const t = new URL(u.origin + transformed);
      t.searchParams.set("width", String(width));
      t.searchParams.set("quality", "70");
      t.searchParams.set("resize", "cover");
      return t.toString();
    }
    return src;
  } catch {
    return src;
  }
}
function heroSrcSet(src) {
  return HERO_BREAKPOINTS.map((w) => `${heroVariant(src, w)} ${w}w`).join(", ");
}
const HERO_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px";
function heroPreloadLinks(src) {
  if (!src) return [];
  return [
    {
      rel: "preload",
      as: "image",
      href: heroVariant(src, 1200),
      imagesrcset: heroSrcSet(src),
      imagesizes: HERO_SIZES,
      fetchpriority: "high"
    }
  ];
}
const CITY_TEMPLATE_TYPES = /* @__PURE__ */ new Set([
  "host_acq_city",
  "spanish_host_acq",
  "swim_instructor_city"
]);
function localBusinessForContentPage(page) {
  if (!page.template_type || !CITY_TEMPLATE_TYPES.has(page.template_type)) {
    return null;
  }
  const citySlug = cityForContentPage(page.template_type, page.slug);
  if (!citySlug) return null;
  const { city, stateCode } = parseCitySlug$1(citySlug);
  if (!city) return null;
  const language = page.language || (page.template_type === "spanish_host_acq" ? "es" : "en");
  const areaServed = {
    "@type": "City",
    name: city
  };
  if (stateCode) {
    areaServed.containedInPlace = {
      "@type": "State",
      name: stateCode,
      addressCountry: "US"
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Pool rental marketplace",
    provider: {
      "@type": "Organization",
      name: SITE_NAME$3,
      url: SITE_URL
    },
    areaServed,
    url: `${SITE_URL}${page.url_path}`,
    inLanguage: language
  };
}
const HOST_ACQ_TEMPLATES = /* @__PURE__ */ new Set(["host_acq_city", "spanish_host_acq"]);
function hostAcqSchemasForPage(page, city) {
  if (!page.template_type || !HOST_ACQ_TEMPLATES.has(page.template_type)) {
    return [];
  }
  const citySlug = cityForContentPage(page.template_type, page.slug);
  const parsed = citySlug ? parseCitySlug$1(citySlug) : null;
  const cityName = city?.name || parsed?.city || null;
  const stateCode = (city?.state_code || parsed?.stateCode || "").toUpperCase();
  const stateName2 = city?.state || stateCode || null;
  if (!cityName) return [];
  const language = page.language || (page.template_type === "spanish_host_acq" ? "es" : "en");
  const pageUrl = `${SITE_URL}${page.url_path}`;
  const geoArea = {
    "@type": "City",
    name: cityName,
    ...stateName2 ? {
      containedInPlace: {
        "@type": "State",
        name: stateName2,
        addressCountry: "US"
      }
    } : {}
  };
  const poolOwnerAudience = {
    "@type": "BusinessAudience",
    audienceType: "Pool Owners",
    geographicArea: geoArea
  };
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: pageUrl,
    name: page.seo_title || page.title || `Become a pool host in ${cityName}, ${stateCode}`,
    inLanguage: language,
    audience: poolOwnerAudience,
    isPartOf: { "@type": "WebSite", name: SITE_NAME$3, url: SITE_URL }
  };
  const professionalService = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME$3,
    url: SITE_URL,
    serviceType: "Peer-to-peer pool hosting platform",
    areaServed: geoArea,
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Homeowners with pools"
    }
  };
  const offer = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: `List Your Pool in ${cityName}, ${stateCode}`,
    category: "Income Opportunity",
    eligibleCustomerType: "PropertyOwner",
    areaServed: geoArea,
    url: pageUrl,
    seller: { "@type": "Organization", name: SITE_NAME$3, url: SITE_URL }
  };
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to List Your Pool for Rent in ${cityName}`,
    inLanguage: language,
    totalTime: "PT15M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Submit your pool details",
        text: "Add photos, amenities, and a short description of your backyard pool.",
        url: `${pageUrl}#step-submit`
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Set your hourly rate",
        text: "Set a rate that reflects your pool size, location, and amenities. You stay in control.",
        url: `${pageUrl}#step-rate`
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Get verified and insured",
        text: "Every booking includes $2M liability coverage at no extra cost to you.",
        url: `${pageUrl}#step-insured`
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Accept your first booking",
        text: "Guests request specific dates and times — you approve, they pay, you host.",
        url: `${pageUrl}#step-booking`
      }
    ]
  };
  const slugSeed = page.slug ?? page.url_path ?? cityName;
  const slugHash = slugSeed.split("").reduce((acc, ch) => acc * 31 + ch.charCodeAt(0) | 0, 0);
  const dayOffset = Math.abs(slugHash) % 30;
  const postedAt = /* @__PURE__ */ new Date();
  postedAt.setUTCHours(0, 0, 0, 0);
  postedAt.setUTCDate(postedAt.getUTCDate() - dayOffset);
  const validThrough = new Date(postedAt);
  validThrough.setUTCDate(validThrough.getUTCDate() + 60);
  const cityHook = page.seo_description && page.seo_description.trim().length > 60 ? page.seo_description.trim() : `Turn your backyard pool in ${cityName}, ${stateCode} into income. ${SITE_NAME$3} connects pool owners with local guests who book by the hour. Hosts typically earn $40–$150/hour depending on pool size, location, and amenities.`;
  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: `Rent your backyard pool in ${cityName}, ${stateCode} — earn $40–$150/hour`,
    description: `<p>${cityHook}</p><h3>What you do</h3><ul><li>List your pool with photos and an hourly rate</li><li>Approve booking requests on your schedule</li><li>Welcome guests, then get paid</li></ul><h3>What we include</h3><ul><li>$2,000,000 liability insurance on every booking</li><li>0% host fees through 2026 (lower than Swimply's 15%+)</li><li>Guest verification and secure payouts</li></ul><h3>Requirements</h3><ul><li>You own (or have permission to rent) a residential pool in or near ${cityName}</li><li>Pool is clean, safe, and accessible to guests</li><li>You can respond to booking requests within 24 hours</li></ul><p><strong>This is an independent income opportunity, not W2 employment.</strong> You set your own schedule, rates, and house rules.</p>`,
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME$3,
      value: `host-${slugSeed}`
    },
    datePosted: postedAt.toISOString().slice(0, 10),
    validThrough: validThrough.toISOString().slice(0, 10),
    employmentType: "CONTRACTOR",
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME$3,
      sameAs: SITE_URL,
      logo: `${SITE_URL}/fw-assets/logo.png`
    },
    jobLocationType: "TELECOMMUTE",
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: cityName,
        addressRegion: stateCode,
        addressCountry: "US"
      }
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: 40,
        maxValue: 150,
        unitText: "HOUR"
      }
    },
    directApply: true,
    url: pageUrl,
    applicantLocationRequirements: {
      "@type": "City",
      name: cityName
    }
  };
  return [webPage, professionalService, offer, howTo, jobPosting];
}
function normalizeTitleVariant(raw) {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toUpperCase();
  return v === "A" || v === "B" || v === "C" || v === "D" ? v : null;
}
function getVariantCopy(variant, cityName, stateCode) {
  const ST = (stateCode || "").toUpperCase();
  const State = stateName(ST) || ST;
  switch (variant) {
    case "A":
      return {
        title: `Become a Pool Host in ${cityName}, ${State} | Pool Rental Near Me`,
        h1: `Become a Pool Host in ${cityName}, ${State}`,
        metaDescription: `Turn your ${cityName} pool into income. List on Pool Rental Near Me — 0% host fees through 2026, $2M liability included, full control of your schedule and rates.`,
        intro: `Becoming a pool host in ${cityName}, ${State} means your backyard works for you. Pool Rental Near Me connects you with neighbors and guests in ${cityName} who want to book by the hour. You set the price, you set the hours, you keep 100%. Full liability coverage included on every booking.`
      };
    case "B":
      return {
        title: `Rent Out Your Pool in ${cityName}, ${ST} | List for Free`,
        h1: `Rent Out Your Pool in ${cityName}, ${ST}`,
        metaDescription: `Rent out your pool in ${cityName} by the hour. Free to list, 0% host fees through 2026, $2M liability per booking, payouts via Stripe. List your pool today.`,
        intro: `Renting out your pool in ${cityName}, ${State} is the fastest way to put it to work. List for free on Pool Rental Near Me, set your hourly rate, and start accepting bookings. You stay in control of your calendar, your rules, and your earnings. We handle payments and insurance.`
      };
    case "C":
      return {
        title: `Make Money With Your Pool in ${cityName}, ${ST}`,
        h1: `Make Money With Your Pool in ${cityName}, ${ST}`,
        metaDescription: `Make money with your pool in ${cityName}. List on Pool Rental Near Me, set your hourly rate, and keep 100%. Free to list, $2M liability covered.`,
        intro: `Your ${cityName}, ${State} pool is an asset most homeowners leave idle. Make money with your pool by listing it on Pool Rental Near Me. Hourly bookings, transparent fees, full liability coverage. You decide who books and when.`
      };
    case "D":
      return {
        title: `How to Rent Out Your Pool in ${cityName}, ${ST} Safely`,
        h1: `How to Rent Out Your Pool in ${cityName}, ${ST} Safely`,
        metaDescription: `How to rent out your pool safely in ${cityName}. Step-by-step guide to listing, pricing, and protecting your home with $2M liability included on every booking.`,
        intro: `If you've been wondering how to rent out your pool in ${cityName}, ${State} safely, this is the playbook. List on Pool Rental Near Me, set your rate, and book guests who agree to a digital waiver before access. Every booking is backed by $2M in liability coverage. Your pool, your rules, your protection.`
      };
  }
}
const getAcademyHub = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).default("en")
}).parse(d ?? {})).handler(createSsrRpc("9ac8d7a29dd3aecbedd0a672eaaa51070a136b7b2346698a08d0ddec5fcc5919"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).default("en")
}).parse(d ?? {})).handler(createSsrRpc("92e3c948d3e68671260d896de132374bd970009577c9f2021504d97b38c1b938"));
createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(200),
  force: z.boolean().optional()
}).parse(d)).handler(createSsrRpc("28d7cfc72c18ac332f7e7b2aa4a786ed86045dd487d3f78b9fc2a292b36c148a"));
createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(50).default(10),
  onlyMissing: z.boolean().default(true)
}).parse(d ?? {})).handler(createSsrRpc("80fd41dac91508246c5234c30eda47006932830f1a03667fd94897d820f08bd1"));
const getRelatedBlogMeta = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slugs: z.array(z.string().min(1).max(200)).max(12)
}).parse(d)).handler(createSsrRpc("d3c2a7e99e4d6ccb47b45f44ca1869f634951802f68222a756eb44b43a717566"));
const $$splitNotFoundComponentImporter$7 = () => import("./p._slug-BgiLv5P_.js");
const $$splitErrorComponentImporter$b = () => import("./p._slug-DVYq_Us2.js");
const $$splitComponentImporter$1i = () => import("./p._slug-CuOJ9Dcl.js");
const Route$23 = createFileRoute("/p/$slug")({
  beforeLoad: async ({
    params
  }) => {
    if (params.slug === "null" || params.slug === "details" || params.slug.startsWith("mailto:")) {
      throw redirect({
        href: "/",
        statusCode: 301,
        replace: true
      });
    }
    const lower = params.slug.toLowerCase();
    if (lower !== params.slug) {
      throw redirect({
        to: "/p/$slug",
        params: {
          slug: lower
        },
        statusCode: 301,
        replace: true
      });
    }
    const result = await lookupContentPage({
      data: {
        slug: params.slug
      }
    });
    if (result.kind === "redirect") {
      if (result.redirectPath?.startsWith("/")) {
        throw redirect({
          href: result.redirectPath,
          statusCode: 301,
          replace: true
        });
      }
      throw redirect({
        to: "/p/$slug",
        params: {
          slug: result.canonicalSlug
        },
        statusCode: 301,
        replace: true
      });
    }
    if (result.kind === "not_found") {
      void log404({
        data: {
          urlPath: `/p/${params.slug}`,
          slug: params.slug
        }
      });
      throw notFound();
    }
    return {
      page: result.page
    };
  },
  loader: async ({
    context
  }) => {
    const page = context.page;
    let nearbyCities = [];
    let city = null;
    let citySources = [];
    if (page.template_type === "host_acq_city" || page.template_type === "spanish_host_acq" || page.template_type === "swim_instructor_city" || page.template_type === "activity_city") {
      try {
        const requirePathPrefix = page.template_type === "host_acq_city" ? "become-a-swimming-pool-host-" : page.template_type === "swim_instructor_city" ? "swim-instructor-pool-rental-" : void 0;
        nearbyCities = await getNearbyCitiesForPage({
          data: {
            templateType: page.template_type,
            slug: page.slug,
            limit: 6,
            ...requirePathPrefix ? {
              requirePathPrefix
            } : {}
          }
        });
      } catch {
        nearbyCities = [];
      }
      const citySlug = cityForContentPage(page.template_type, page.slug);
      if (citySlug) {
        try {
          city = await getCityBySlug({
            data: {
              slug: citySlug
            }
          });
        } catch {
          city = null;
        }
        if (page.template_type === "host_acq_city") {
          try {
            citySources = await getCitySources({
              data: {
                slug: citySlug
              }
            });
          } catch {
            citySources = [];
          }
        }
      }
    }
    let linkTargets = [];
    try {
      const citySlug = cityForContentPage(page.template_type, page.slug);
      linkTargets = await getInternalLinkTargets({
        data: {
          citySlug: citySlug ?? null,
          nearbyCitySlugs: nearbyCities.map((c) => c.slug)
        }
      });
    } catch {
      linkTargets = [];
    }
    let academyHub = null;
    const academyLang = academyLangForSlug(page.slug);
    if (academyLang) {
      try {
        academyHub = await getAcademyHub({
          data: {
            language: academyLang
          }
        });
      } catch {
        academyHub = null;
      }
    }
    let hreflangSibling = null;
    const pageForSibling = page;
    if (pageForSibling.hreflang_group) {
      try {
        const res = await getHreflangSibling({
          data: {
            pageId: page.id
          }
        });
        hreflangSibling = res.sibling;
      } catch {
        hreflangSibling = null;
      }
    }
    let relatedPosts = [];
    const relatedSlugs = page.related_slugs;
    if (Array.isArray(relatedSlugs) && relatedSlugs.length > 0) {
      try {
        const r = await getRelatedBlogMeta({
          data: {
            slugs: relatedSlugs.slice(0, 8)
          }
        });
        relatedPosts = r.posts;
      } catch {
        relatedPosts = [];
      }
    }
    const origin = await getRouteOrigin();
    return {
      page,
      nearbyCities,
      city,
      citySources,
      linkTargets,
      academyHub,
      hreflangSibling,
      relatedPosts,
      origin
    };
  },
  head: ({
    loaderData,
    params
  }) => {
    if (!loaderData?.page) return {};
    const p = loaderData.page;
    const path = `/p/${params.slug}`;
    const canonicalPath = p.url_path || `/p/${p.slug ?? params.slug}`;
    const titleBase = p.title || p.seo_title || params.slug;
    let title = p.seo_title || `${titleBase} | ${SITE_NAME$3}`;
    let description = (p.seo_description || p.description || titleBase || "").slice(0, 160);
    const variant = p.template_type === "host_acq_city" ? normalizeTitleVariant(p.title_variant) : null;
    if (variant) {
      const citySlug = cityForContentPage(p.template_type, p.slug);
      const parsed = citySlug ? parseCitySlug$1(citySlug) : null;
      const cityName = loaderData.city?.name || parsed?.city || "your city";
      const stateCode = (loaderData.city?.state_code || parsed?.stateCode || "").toUpperCase();
      const copy = getVariantCopy(variant, cityName, stateCode);
      title = copy.title;
      description = copy.metaDescription;
    }
    const academyLang = academyLangForSlug(p.slug);
    const origin = loaderData.origin ?? SITE_URL;
    let hreflang;
    if (academyLang) {
      hreflang = [{
        lang: "en",
        href: `${origin}${academyHubPath("en")}`
      }, {
        lang: "es",
        href: `${origin}${academyHubPath("es")}`
      }, {
        lang: "x-default",
        href: `${origin}${academyHubPath("en")}`
      }];
    } else {
      hreflang = buildHreflangLinks(p, loaderData.hreflangSibling ?? null, origin);
    }
    const pAny = p;
    const meta = buildMeta({
      title,
      description,
      path,
      canonicalPath,
      canonicalUrl: pAny.canonical_override?.trim() || void 0,
      ogTitle: pAny.og_title?.trim() || void 0,
      ogDescription: pAny.og_description?.trim() || void 0,
      image: p.cover_image_url || p.hero_image_url || void 0,
      type: isArticleType(p.template_type) || academyLang ? "article" : "website",
      origin,
      hreflang
    });
    const ARTICLE_OG_TYPES = /* @__PURE__ */ new Set(["resource", "resource_article", "event_guide", "guide"]);
    if (ARTICLE_OG_TYPES.has(p.template_type ?? "")) {
      const publishedIso = toIsoOrUndefined(p.published_at) ?? toIsoOrUndefined(p.scraped_at);
      const modifiedIso = toIsoOrUndefined(p.updated_at);
      const articleMeta = [{
        property: "article:author",
        content: p.author || "Pool Rental Near Me"
      }];
      if (publishedIso) articleMeta.push({
        property: "article:published_time",
        content: publishedIso
      });
      if (modifiedIso) articleMeta.push({
        property: "article:modified_time",
        content: modifiedIso
      });
      meta.meta = [...meta.meta ?? [], ...articleMeta];
    }
    if (variant) {
      meta.meta = [...meta.meta ?? [], {
        name: "title_test_variant",
        content: variant
      }];
    }
    const scripts = [];
    const blogTopic = p.topic ?? null;
    const blogCrumbs = p.template_type === "resource" && (blogTopic || p.category === "blog" || blogTopic !== null);
    if (blogCrumbs) {
      const topicLabel = blogTopic ? blogTopic.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
      const crumbs = [{
        name: "Home",
        path: "/"
      }, {
        name: "Blog",
        path: "/p/blog"
      }];
      if (topicLabel && blogTopic) {
        crumbs.push({
          name: topicLabel,
          path: `/p/blog?topic=${encodeURIComponent(blogTopic)}`
        });
      }
      crumbs.push({
        name: titleBase || path,
        path
      });
      scripts.push(ldJsonScript(breadcrumbJsonLd$1(crumbs)));
    } else {
      scripts.push(ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: titleBase || path,
        path
      }])));
    }
    if (isArticleType(p.template_type)) {
      const authorName = p.author || "Derek Bowen";
      const isDerek = authorName === "Derek Bowen";
      const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.title,
        description,
        image: p.cover_image_url ? [p.cover_image_url] : void 0,
        author: isDerek ? AUTHOR_PERSON_JSONLD_REF : {
          "@type": "Person",
          name: authorName
        },
        datePublished: toIsoOrUndefined(p.published_at),
        dateModified: toIsoOrUndefined(p.updated_at) ?? toIsoOrUndefined(p.published_at),
        mainEntityOfPage: `${SITE_URL}${path}`,
        publisher: {
          "@type": "Organization",
          name: SITE_NAME$3,
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/icon-512.png`
          }
        },
        inLanguage: p.language
      };
      scripts.push(ldJsonScript(article));
    }
    const faqs2 = faqsForContentPage(p);
    if (faqs2.length > 0) {
      scripts.push(ldJsonScript(faqPageJsonLd(faqs2)));
    }
    const localBiz = localBusinessForContentPage(p);
    if (localBiz) {
      scripts.push(ldJsonScript(localBiz));
    }
    for (const block of hostAcqSchemasForPage(p, loaderData.city ?? null)) {
      scripts.push(ldJsonScript(block));
    }
    if (p.template_type === "host_advocacy_state" && p.slug) {
      const stateMatch = p.slug.match(/^host-advocacy-(.+)$/);
      const stateName2 = stateMatch ? stateMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
      if (stateName2) {
        scripts.push(ldJsonScript({
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Pool rental marketplace",
          provider: {
            "@type": "Organization",
            name: SITE_NAME$3,
            url: SITE_URL
          },
          areaServed: {
            "@type": "State",
            name: stateName2,
            addressCountry: "US"
          },
          url: `${SITE_URL}${path}`,
          inLanguage: p.language || "en"
        }));
      }
    }
    const hub = loaderData.academyHub;
    if (academyLang && hub && hub.total > 0) {
      const allCourses = hub.categories.flatMap((g) => g.courses);
      scripts.push(ldJsonScript({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: titleBase,
        description,
        url: `${SITE_URL}${canonicalPath}`,
        inLanguage: academyLang,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: allCourses.length,
          itemListElement: allCourses.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/p/course/${c.slug}`,
            name: c.title
          }))
        }
      }));
    }
    const heroForPreload = p.hero_image_url || p.cover_image_url || null;
    const links = [...meta.links ?? [], ...heroPreloadLinks(heroForPreload)];
    return {
      ...meta,
      links,
      scripts
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1i, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$b, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$7, "notFoundComponent")
});
function toIsoOrUndefined(value) {
  if (!value) return void 0;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return void 0;
  return d.toISOString();
}
function isArticleType(t) {
  const v = t;
  return v === "resource" || v === "elearning" || v === "event_guide" || v === "host_advocacy_hub" || v === "host_advocacy_state" || v === "spanish_resource" || v === "pool_maintenance" || v === "pool_maintenance_hub";
}
function buildHreflangLinks(p, sibling, origin = SITE_URL) {
  const pAny = p;
  if (!sibling || !pAny.hreflang_group) return void 0;
  const pagePath = p.url_path || `/p/${p.slug ?? ""}`;
  const siblingPath = `/p/${sibling.slug}`;
  const pageLang = p.locale || p.language || "en";
  const regional = (lang) => lang === "en" ? "en-US" : lang === "es" ? "es-US" : lang;
  const englishHref = pageLang === "en" ? `${origin}${pagePath}` : sibling.language === "en" ? `${origin}${siblingPath}` : `${origin}${pagePath}`;
  return [{
    lang: regional(pageLang),
    href: `${origin}${pagePath}`
  }, {
    lang: regional(sibling.language),
    href: `${origin}${siblingPath}`
  }, {
    lang: "x-default",
    href: englishHref
  }];
}
const $$splitComponentImporter$1h = () => import("./p._-BTU5dmpx.js");
const Route$22 = createFileRoute("/p/$")({
  beforeLoad: ({
    params
  }) => {
    const splat = params._splat ?? "";
    const segments = splat.split("/").filter(Boolean);
    const canonicalSlug = segments[segments.length - 1];
    if (!canonicalSlug) {
      throw redirect({
        to: "/",
        statusCode: 301,
        replace: true
      });
    }
    throw redirect({
      to: "/p/$slug",
      params: {
        slug: canonicalSlug
      },
      statusCode: 301,
      replace: true
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$1h, "component")
});
const Route$21 = createFileRoute("/marketing-and-growth/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = params._splat ?? "";
        const target = resolveLegacyRedirect("marketing-and-growth", splat);
        return legacyRedirectResponse(target, SITE_URL);
      }
    }
  }
});
const Route$20 = createFileRoute("/legal-and-compliance/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = params._splat ?? "";
        const target = resolveLegacyRedirect("legal-and-compliance", splat);
        return legacyRedirectResponse(target, SITE_URL);
      }
    }
  }
});
const Route$1$ = createFileRoute("/host-information/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = params._splat ?? "";
        const target = resolveLegacyRedirect("host-information", splat);
        return legacyRedirectResponse(target, SITE_URL);
      }
    }
  }
});
const Route$1_ = createFileRoute("/guest-information/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = params._splat ?? "";
        const target = resolveLegacyRedirect("guest-information", splat);
        return legacyRedirectResponse(target, SITE_URL);
      }
    }
  }
});
const Route$1Z = createFileRoute("/for-hosts/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = params._splat ?? "";
        const target = resolveLegacyRedirect("for-hosts", splat);
        return legacyRedirectResponse(target, SITE_URL);
      }
    }
  }
});
const Route$1Y = createFileRoute("/for-guests/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = params._splat ?? "";
        const target = resolveLegacyRedirect("for-guests", splat);
        return legacyRedirectResponse(target, SITE_URL);
      }
    }
  }
});
function redactEmail$2(email) {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}
const Route$1X = createFileRoute("/email/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabaseUrl = "https://ptfjspcphskifoseidut.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) {
          return Response.json({ error: "Token is required" }, { status: 400 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: tokenRecord, error: lookupError } = await supabase2.from("email_unsubscribe_tokens").select("*").eq("token", token).maybeSingle();
        if (lookupError || !tokenRecord) {
          return Response.json({ error: "Invalid or expired token" }, { status: 404 });
        }
        if (tokenRecord.used_at) {
          return Response.json({ valid: false, reason: "already_unsubscribed" });
        }
        return Response.json({ valid: true });
      },
      POST: async ({ request }) => {
        const supabaseUrl = "https://ptfjspcphskifoseidut.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        const url = new URL(request.url);
        let token = url.searchParams.get("token");
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const formText = await request.text();
          const params = new URLSearchParams(formText);
          if (!params.get("List-Unsubscribe")) {
            const formToken = params.get("token");
            if (formToken) {
              token = formToken;
            }
          }
        } else {
          try {
            const body = await request.json();
            if (body.token) {
              token = body.token;
            }
          } catch {
          }
        }
        if (!token) {
          return Response.json({ error: "Token is required" }, { status: 400 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: tokenRecord, error: lookupError } = await supabase2.from("email_unsubscribe_tokens").select("*").eq("token", token).maybeSingle();
        if (lookupError || !tokenRecord) {
          return Response.json({ error: "Invalid or expired token" }, { status: 404 });
        }
        if (tokenRecord.used_at) {
          return Response.json({ success: false, reason: "already_unsubscribed" });
        }
        const { data: updated, error: updateError } = await supabase2.from("email_unsubscribe_tokens").update({ used_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("token", token).is("used_at", null).select().maybeSingle();
        if (updateError) {
          console.error("Failed to mark token as used", { error: updateError, token });
          return Response.json({ error: "Failed to process unsubscribe" }, { status: 500 });
        }
        if (!updated) {
          return Response.json({ success: false, reason: "already_unsubscribed" });
        }
        const { error: suppressError } = await supabase2.from("suppressed_emails").upsert(
          { email: tokenRecord.email.toLowerCase(), reason: "unsubscribe" },
          { onConflict: "email" }
        );
        if (suppressError) {
          console.error("Failed to suppress email", {
            error: suppressError,
            email_redacted: redactEmail$2(tokenRecord.email)
          });
          return Response.json({ error: "Failed to process unsubscribe" }, { status: 500 });
        }
        console.log("Email unsubscribed", {
          email_redacted: redactEmail$2(tokenRecord.email)
        });
        return Response.json({ success: true });
      }
    }
  }
});
const Route$1W = createFileRoute("/blog/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = (params._splat ?? "").replace(/^\/+|\/+$/g, "");
        const target = splat ? `/p/${splat}` : "/p/blog";
        return redirect301(target, SITE_URL);
      }
    }
  }
});
const $$splitComponentImporter$1g = () => import("./auth.reset-password-qyxzta8o.js");
const Route$1V = createFileRoute("/auth/reset-password")({
  component: lazyRouteComponent($$splitComponentImporter$1g, "component"),
  head: () => ({
    meta: [{
      title: "Reset password — Pool Rental Near Me"
    }]
  })
});
const $$splitComponentImporter$1f = () => import("./admin.tech-docs-CJQkGf2b.js");
const Route$1U = createFileRoute("/admin/tech-docs")({
  head: () => ({
    meta: [{
      title: "Technical Docs — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1f, "component")
});
const $$splitComponentImporter$1e = () => import("./admin.team-aN5ZCoo6.js");
const Route$1T = createFileRoute("/admin/team")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/team",
          mode: "signin"
        }
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Admin team — PRNM"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1e, "component")
});
const $$splitComponentImporter$1d = () => import("./admin.social-lead-hunter-BozVel3-.js");
const Route$1S = createFileRoute("/admin/social-lead-hunter")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/social-lead-hunter",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Social Lead Hunter — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1d, "component")
});
const $$splitComponentImporter$1c = () => import("./admin.sms-blast-S7N1MbTo.js");
const Route$1R = createFileRoute("/admin/sms-blast")({
  head: () => buildMeta({
    title: "SMS blast | Admin",
    description: "Send one-off SMS to host leads",
    path: "/admin/sms-blast",
    noindex: true
  }),
  component: lazyRouteComponent($$splitComponentImporter$1c, "component")
});
const $$splitComponentImporter$1b = () => import("./admin.site-footer-DNtAOkyw.js");
const Route$1Q = createFileRoute("/admin/site-footer")({
  component: lazyRouteComponent($$splitComponentImporter$1b, "component")
});
const $$splitComponentImporter$1a = () => import("./admin.sharetribe-prune-C5ak3uUM.js");
const Route$1P = createFileRoute("/admin/sharetribe-prune")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/sharetribe-prune",
          mode: "signin"
        }
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Prune Become-a-Host pages — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1a, "component")
});
const $$splitComponentImporter$19 = () => import("./admin.sharetribe-Ceclzh8x.js");
const Route$1O = createFileRoute("/admin/sharetribe")({
  component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
const $$splitComponentImporter$18 = () => import("./admin.seo-health-dx7sTX5X.js");
const Route$1N = createFileRoute("/admin/seo-health")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/seo-health",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "SEO Health — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
const $$splitComponentImporter$17 = () => import("./admin.seo-critic-uP1YsyZY.js");
const Route$1M = createFileRoute("/admin/seo-critic")({
  component: lazyRouteComponent($$splitComponentImporter$17, "component"),
  head: () => ({
    meta: [{
      title: "AI SEO Critic — Admin"
    }, {
      name: "robots",
      content: "noindex"
    }]
  })
});
const $$splitComponentImporter$16 = () => import("./admin.seo-coach-CO3cbluw.js");
const Route$1L = createFileRoute("/admin/seo-coach")({
  component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
const $$splitComponentImporter$15 = () => import("./admin.scrape-import-DfBtonmQ.js");
const Route$1K = createFileRoute("/admin/scrape-import")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/scrape-import",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Scrape directory URLs — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
const $$splitComponentImporter$14 = () => import("./admin.renter-drip-CYOgP8TS.js");
const Route$1J = createFileRoute("/admin/renter-drip")({
  component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
const $$splitComponentImporter$13 = () => import("./admin.redirect-aliases-DOgcrRoa.js");
const Route$1I = createFileRoute("/admin/redirect-aliases")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth"
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$13, "component"),
  head: () => ({
    meta: [{
      title: "Redirect aliases — Admin"
    }]
  })
});
const $$splitComponentImporter$12 = () => import("./admin.rank-tracker-6w19UfbL.js");
const Route$1H = createFileRoute("/admin/rank-tracker")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/rank-tracker",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Rank Tracker — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
const $$splitComponentImporter$11 = () => import("./admin.quick-page-z8Kp0GpI.js");
const Route$1G = createFileRoute("/admin/quick-page")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/quick-page",
          mode: "signin"
        }
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Quick Page Builder — PRNM Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
const $$splitComponentImporter$10 = () => import("./admin.prnm-coach-QF8NhUkz.js");
const Route$1F = createFileRoute("/admin/prnm-coach")({
  component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
const $$splitComponentImporter$$ = () => import("./admin.privacy-requests-LVtuo-EX.js");
const Route$1E = createFileRoute("/admin/privacy-requests")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/privacy-requests",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Privacy Requests — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$$, "component")
});
const $$splitErrorComponentImporter$a = () => import("./admin.plan-requests-BnLV6vRs.js");
const $$splitComponentImporter$_ = () => import("./admin.plan-requests-D5hBBp1O.js");
const Route$1D = createFileRoute("/admin/plan-requests")({
  loader: () => adminListPlanRequests(),
  head: () => buildMeta({
    title: "Plan Requests | Admin",
    description: "Review provider plan and payment requests",
    path: "/admin/plan-requests",
    noindex: true
  }),
  component: lazyRouteComponent($$splitComponentImporter$_, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$a, "errorComponent")
});
const $$splitComponentImporter$Z = () => import("./admin.page-health-CJ-ogMlI.js");
const Route$1C = createFileRoute("/admin/page-health")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth"
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$Z, "component"),
  head: () => ({
    meta: [{
      title: "Page health — Admin"
    }]
  })
});
const $$splitComponentImporter$Y = () => import("./admin.page-auditor-CMM2EU57.js");
const Route$1B = createFileRoute("/admin/page-auditor")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/page-auditor",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "AI Page Auditor — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$Y, "component")
});
const $$splitComponentImporter$X = () => import("./admin.opportunities-5t_7Q2Ok.js");
const Route$1A = createFileRoute("/admin/opportunities")({
  component: lazyRouteComponent($$splitComponentImporter$X, "component")
});
const $$splitComponentImporter$W = () => import("./admin.no-access-R32Krqrr.js");
const Route$1z = createFileRoute("/admin/no-access")({
  beforeLoad: async () => {
    const {
      data
    } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/dashboard",
          mode: "signin"
        }
      });
    }
  },
  head: () => ({
    meta: [{
      title: "Admin access required — PRNM"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$W, "component")
});
const $$splitComponentImporter$V = () => import("./admin.missing-pages-uuFumWok.js");
const Route$1y = createFileRoute("/admin/missing-pages")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/missing-pages",
          mode: "signin"
        }
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Missing /p/* pages — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$V, "component")
});
const $$splitComponentImporter$U = () => import("./admin.marketplace-CVk5FCJU.js");
const Route$1x = createFileRoute("/admin/marketplace")({
  head: () => ({
    meta: [{
      title: "Marketplace Console — PRNM Admin"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$U, "component")
});
const $$splitComponentImporter$T = () => import("./admin.listing-auditor-MMDat39u.js");
const Route$1w = createFileRoute("/admin/listing-auditor")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/listing-auditor",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Listing Auditor — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$T, "component")
});
const $$splitComponentImporter$S = () => import("./admin.link-checker-CyRS29n9.js");
const Route$1v = createFileRoute("/admin/link-checker")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/link-checker",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Link checker — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$S, "component")
});
const $$splitComponentImporter$R = () => import("./admin.link-auto-repair-BuKbDcwv.js");
const Route$1u = createFileRoute("/admin/link-auto-repair")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/link-auto-repair",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Link auto-repair — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$R, "component")
});
const $$splitComponentImporter$Q = () => import("./admin.link-audit-BhU_CuiN.js");
const Route$1t = createFileRoute("/admin/link-audit")({
  component: lazyRouteComponent($$splitComponentImporter$Q, "component")
});
const $$splitComponentImporter$P = () => import("./admin.learning-B6dJ8enn.js");
const Route$1s = createFileRoute("/admin/learning")({
  beforeLoad: async ({
    location
  }) => {
    const {
      data
    } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.pathname,
          mode: "signin"
        }
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$P, "component"),
  head: () => ({
    meta: [{
      title: "Learning admin — Pool Rental Near Me"
    }]
  })
});
const $$splitComponentImporter$O = () => import("./admin.leads-CqBwdbVH.js");
const Route$1r = createFileRoute("/admin/leads")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/leads",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Lead Inbox — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$O, "component")
});
const $$splitComponentImporter$N = () => import("./admin.landing-link-check-BMiw7OPX.js");
const Route$1q = createFileRoute("/admin/landing-link-check")({
  component: lazyRouteComponent($$splitComponentImporter$N, "component")
});
const $$splitComponentImporter$M = () => import("./admin.keyword-opportunities-r5JIatae.js");
const Route$1p = createFileRoute("/admin/keyword-opportunities")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/keyword-opportunities",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Keyword opportunities — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$M, "component")
});
const $$splitComponentImporter$L = () => import("./admin.job-history-BX8RWRwc.js");
const Route$1o = createFileRoute("/admin/job-history")({
  head: () => ({
    meta: [{
      title: "Job history — Admin"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$L, "component")
});
const $$splitComponentImporter$K = () => import("./admin.internal-links-CeFIv9V7.js");
const Route$1n = createFileRoute("/admin/internal-links")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/internal-links",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Internal links — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$K, "component")
});
const $$splitComponentImporter$J = () => import("./admin.indexing-VsUOPabM.js");
const Route$1m = createFileRoute("/admin/indexing")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/indexing",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Sitemap & Indexing — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$J, "component")
});
const $$splitComponentImporter$I = () => import("./admin.ig-lead-hunter-DCzRDx3K.js");
const Route$1l = createFileRoute("/admin/ig-lead-hunter")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/ig-lead-hunter",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "IG Lead Hunter — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$I, "component")
});
const $$splitComponentImporter$H = () => import("./admin.host-drip-BAIl-N5E.js");
const Route$1k = createFileRoute("/admin/host-drip")({
  component: lazyRouteComponent($$splitComponentImporter$H, "component")
});
const $$splitComponentImporter$G = () => import("./admin.gsc-import-BqooEFGM.js");
const Route$1j = createFileRoute("/admin/gsc-import")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/gsc-import",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "GSC Import — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$G, "component")
});
const $$splitComponentImporter$F = () => import("./admin.generate-content-msw-uUnO.js");
const Route$1i = createFileRoute("/admin/generate-content")({
  component: lazyRouteComponent($$splitComponentImporter$F, "component")
});
const $$splitComponentImporter$E = () => import("./admin.founder-blast-B-C9zdMs.js");
const Route$1h = createFileRoute("/admin/founder-blast")({
  head: () => buildMeta({
    title: "Founder email retired | Admin",
    description: "The one-off founder email tool has been disabled",
    path: "/admin/founder-blast",
    noindex: true
  }),
  component: lazyRouteComponent($$splitComponentImporter$E, "component")
});
const $$splitComponentImporter$D = () => import("./admin.followup-reminders-QRD5NiP_.js");
const Route$1g = createFileRoute("/admin/followup-reminders")({
  component: lazyRouteComponent($$splitComponentImporter$D, "component")
});
const $$splitComponentImporter$C = () => import("./admin.followup-performance-Cf9jUGYo.js");
const Route$1f = createFileRoute("/admin/followup-performance")({
  component: lazyRouteComponent($$splitComponentImporter$C, "component")
});
const $$splitComponentImporter$B = () => import("./admin.followup-drilldown-C5dB_h81.js");
const searchSchema = z.object({
  source: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  rangeDays: z.coerce.number().int().min(1).max(365).default(90),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25)
});
const Route$1e = createFileRoute("/admin/followup-drilldown")({
  validateSearch: zodValidator(searchSchema),
  component: lazyRouteComponent($$splitComponentImporter$B, "component")
});
const $$splitComponentImporter$A = () => import("./admin.follow-ups-CIS2yv8l.js");
const Route$1d = createFileRoute("/admin/follow-ups")({
  component: lazyRouteComponent($$splitComponentImporter$A, "component")
});
const $$splitComponentImporter$z = () => import("./admin.faq-generator-0O2WjeyO.js");
const Route$1c = createFileRoute("/admin/faq-generator")({
  component: lazyRouteComponent($$splitComponentImporter$z, "component")
});
const $$splitComponentImporter$y = () => import("./admin.email-verify-C_ote1HT.js");
const Route$1b = createFileRoute("/admin/email-verify")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/email-verify",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Email verify — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$y, "component")
});
const $$splitComponentImporter$x = () => import("./admin.email-queue-BqSZ6rbN.js");
const Route$1a = createFileRoute("/admin/email-queue")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/email-queue",
          mode: "signin"
        }
      });
    }
  },
  head: () => ({
    meta: [{
      title: "Email queue — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$x, "component")
});
const $$splitComponentImporter$w = () => import("./admin.email-deliverability-BnoUX-w5.js");
const Route$19 = createFileRoute("/admin/email-deliverability")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/email-deliverability",
          mode: "signin"
        }
      });
    }
  },
  head: () => ({
    meta: [{
      title: "Email deliverability — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$w, "component")
});
const $$splitErrorComponentImporter$9 = () => import("./admin.email-composer-EL_eW4lF.js");
const $$splitComponentImporter$v = () => import("./admin.email-composer-BSGRPhNo.js");
const Route$18 = createFileRoute("/admin/email-composer")({
  component: lazyRouteComponent($$splitComponentImporter$v, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$9, "errorComponent")
});
const $$splitComponentImporter$u = () => import("./admin.email-branding-VrpIlypl.js");
const Route$17 = createFileRoute("/admin/email-branding")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/email-branding",
          mode: "signin"
        }
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Email Branding — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$u, "component")
});
const $$splitComponentImporter$t = () => import("./admin.drip-subscribers-mcIXSWJe.js");
const Route$16 = createFileRoute("/admin/drip-subscribers")({
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./admin.directory-Q-A9zgXH.js");
const Route$15 = createFileRoute("/admin/directory")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/directory",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Directory Moderation — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./admin.data-import-DA8tJB56.js");
const Route$14 = createFileRoute("/admin/data-import")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/data-import",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./admin.data-export-TqHMXJUG.js");
const Route$13 = createFileRoute("/admin/data-export")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/data-export",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./admin.dashboard--n_MCVbM.js");
const Route$12 = createFileRoute("/admin/dashboard")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/dashboard",
          mode: "signin"
        }
      });
    }
  },
  head: () => ({
    meta: [{
      title: "Morning Command Center — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./admin.content-pages-B9Qh8ZYx.js");
const Route$11 = createFileRoute("/admin/content-pages")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/content-pages",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Bulk page editor — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const $$splitComponentImporter$n = () => import("./admin.content-migration-Dv_BLjcQ.js");
const Route$10 = createFileRoute("/admin/content-migration")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/content-migration",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./admin.content-health-pI2pCDuK.js");
const Route$$ = createFileRoute("/admin/content-health")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth"
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$m, "component"),
  head: () => ({
    meta: [{
      title: "Content health — Admin"
    }]
  })
});
const $$splitComponentImporter$l = () => import("./admin.competitors-Czi5kbAi.js");
const Route$_ = createFileRoute("/admin/competitors")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/competitors",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Competitors — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./admin.competitor-radar-BdxWvjH3.js");
const Route$Z = createFileRoute("/admin/competitor-radar")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/competitor-radar",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Competitor Radar — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./admin.click-report-BvjdKKah.js");
const Route$Y = createFileRoute("/admin/click-report")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth"
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$j, "component"),
  head: () => ({
    meta: [{
      title: "Nearby-city click report — Admin"
    }]
  })
});
const $$splitErrorComponentImporter$8 = () => import("./admin.claims-Bs5aWN3M.js");
const $$splitComponentImporter$i = () => import("./admin.claims-D3NSySUv.js");
const Route$X = createFileRoute("/admin/claims")({
  loader: () => adminListProviderClaims(),
  head: () => buildMeta({
    title: "Listing Claims | Admin",
    description: "Review provider listing claims",
    path: "/admin/claims",
    noindex: true
  }),
  component: lazyRouteComponent($$splitComponentImporter$i, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$8, "errorComponent")
});
const $$splitComponentImporter$h = () => import("./admin.cities-heroes-report-CIYVh5Op.js");
const Route$W = createFileRoute("/admin/cities-heroes-report")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth"
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$h, "component"),
  head: () => ({
    meta: [{
      title: "Hero backfill report — Admin"
    }]
  })
});
const $$splitComponentImporter$g = () => import("./admin.cities-heroes-DnuzV3qA.js");
const Route$V = createFileRoute("/admin/cities-heroes")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth"
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$g, "component"),
  head: () => ({
    meta: [{
      title: "Backfill city heroes — Admin"
    }]
  })
});
const $$splitComponentImporter$f = () => import("./admin.blog-DdX5L61k.js");
const Route$U = createFileRoute("/admin/blog")({
  beforeLoad: async ({
    location
  }) => {
    const {
      data
    } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.pathname,
          mode: "signin"
        }
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$f, "component"),
  head: () => ({
    meta: [{
      title: "Blog admin — Pool Rental Near Me"
    }]
  })
});
const $$splitComponentImporter$e = () => import("./admin.auto-refresh-DTe27QOg.js");
const Route$T = createFileRoute("/admin/auto-refresh")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth"
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$e, "component"),
  head: () => ({
    meta: [{
      title: "Auto-refresh queue — Admin"
    }]
  })
});
const $$splitErrorComponentImporter$7 = () => import("./admin.auto-outreach-N0pcaEh3.js");
const $$splitComponentImporter$d = () => import("./admin.auto-outreach-ByErtOA5.js");
const Route$S = createFileRoute("/admin/auto-outreach")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$7, "errorComponent"),
  head: () => ({
    meta: [{
      title: "Auto-outreach — Admin"
    }, {
      name: "robots",
      content: "noindex"
    }]
  })
});
const $$splitComponentImporter$c = () => import("./admin.affiliates-8_hcic3E.js");
const Route$R = createFileRoute("/admin/affiliates")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth",
      search: {
        redirect: "/admin/affiliates",
        mode: "signin"
      }
    });
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  head: () => ({
    meta: [{
      title: "Affiliates — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./admin.add-contacts-DNpd16gd.js");
const Route$Q = createFileRoute("/admin/add-contacts")({
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin/add-contacts",
          mode: "signin"
        }
      });
    }
  },
  head: () => ({
    meta: [{
      title: "Add contacts — Admin"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./admin.activity-cities-Bc-PT7kF.js");
const Route$P = createFileRoute("/admin/activity-cities")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./account.learning-DV2kVZZH.js");
const Route$O = createFileRoute("/account/learning")({
  beforeLoad: async ({
    location
  }) => {
    const {
      data
    } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.pathname,
          mode: "signin"
        }
      });
    }
  },
  component: lazyRouteComponent($$splitComponentImporter$9, "component"),
  head: () => ({
    meta: [{
      title: "My learning — Learn with Fred"
    }]
  })
});
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/)
}).parse(d)).handler(createSsrRpc("b7d5e20c6a117310b3122bfe251ba965bc2120364f0d609be4ba0bbf80e9e131"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/)
}).parse(d)).handler(createSsrRpc("3e449c74c7e0ea3c0c398d29ca14c4c274929be533910e98753c07ce9ef33724"));
const getProvider = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/)
}).parse(d)).handler(createSsrRpc("3ba4b56c2f9808243a7605abde47d54a8f807a577eb5133a33619a3b33cd3acc"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/)
}).parse(d)).handler(createSsrRpc("a80684d216c66308d6f632d62319ae188bc81e487da0555b3d4945a269971dda"));
createServerFn({
  method: "GET"
}).handler(createSsrRpc("845e56bf958978679713246213ffdd1df479f40d4e56eb0729a5a36ce9bf1295"));
createServerFn({
  method: "GET"
}).handler(createSsrRpc("6ca5a289633d6eaa7a4851b9081e08bbcb3a9bdaa52a83587bcdb50e654f0030"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  state_code: z.string().length(2).optional(),
  limit: z.number().int().min(1).max(24).optional()
}).parse(d)).handler(createSsrRpc("cc5e4db90b9b483e6286479667f56c7e1c074a40536427192affc125d0fc4d8e"));
createServerFn({
  method: "GET"
}).handler(createSsrRpc("7c1d440a83f1f9f599d8f19dcb19bd1ca5197c705707963261fc065d2f6e1e81"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
  topic: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/).optional(),
  q: z.string().trim().min(1).max(120).optional()
}).parse(d ?? {})).handler(createSsrRpc("bddc5486b7ffdadbfbad0b252ca7b71efad4a86e9e583642f8b1a476e20128d0"));
createServerFn({
  method: "GET"
}).handler(createSsrRpc("a3b734f6aebba577023470bdd15d9f3b76d26a913df7b8dd7f50fbfc868dc984"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  state_code: z.string().length(2).regex(/^[A-Z]{2}$/)
}).parse(d)).handler(createSsrRpc("83d4989f4968bbabb330981ca27f1539e8d0240555e6aba8d72b8d6bd3f6feda"));
const $$splitNotFoundComponentImporter$6 = () => import("./p.pool-pros._slug-LFfV_ccC.js");
const $$splitErrorComponentImporter$6 = () => import("./p.pool-pros._slug-DVPRS4kk.js");
const $$splitComponentImporter$8 = () => import("./p.pool-pros._slug-BXBzQPWj.js");
const Route$N = createFileRoute("/p/pool-pros/$slug")({
  loader: async ({
    params
  }) => {
    const {
      provider
    } = await getProvider({
      data: {
        slug: params.slug
      }
    });
    if (!provider) throw notFound();
    return {
      provider
    };
  },
  head: ({
    loaderData,
    params
  }) => {
    if (!loaderData?.provider) return {};
    const p = loaderData.provider;
    const title = p.seo_title || `${p.name}${p.city ? ` — Pool Services in ${p.city}, ${p.state_code}` : ""}`.trim();
    const description = (p.seo_description || p.long_description?.slice(0, 160) || p.description || `Learn about ${p.name}, a pool service provider.`).slice(0, 160);
    const path = `/p/pool-pros/${params.slug}`;
    const meta = buildMeta({
      title,
      description,
      path,
      image: p.hero_image_url || p.logo_url,
      noindex: true
    });
    const business = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: p.name,
      url: `${SITE_URL}${path}`,
      ...p.website_url && {
        sameAs: [p.website_url]
      },
      ...p.phone && {
        telephone: p.phone
      },
      ...p.email && {
        email: p.email
      },
      ...p.logo_url && {
        logo: p.logo_url
      },
      ...p.hero_image_url && {
        image: p.hero_image_url
      },
      ...typeof p.rating === "number" && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: p.rating,
          reviewCount: p.rating_count ?? 1
        }
      },
      ...p.city && p.state_code && {
        address: {
          "@type": "PostalAddress",
          addressLocality: p.city,
          addressRegion: p.state_code,
          addressCountry: "US"
        }
      }
    };
    const category = p.primary_category || "pool-builders";
    const stateCode = p.state_code?.toLowerCase();
    const citySlug = p.city_slug ?? null;
    const crumbs = breadcrumbJsonLd$1([{
      name: "Home",
      path: "/"
    }, {
      name: "Pool Pros",
      path: "/p/pool-pros"
    }, {
      name: category,
      path: `/p/pool-pros/c/${category}`
    }, ...stateCode ? [{
      name: p.state_code,
      path: `/p/pool-pros/c/${category}/${stateCode}`
    }] : [], ...stateCode && citySlug && p.city ? [{
      name: p.city,
      path: `/p/pool-pros/c/${category}/${stateCode}/${citySlug}`
    }] : [], {
      name: p.name,
      path
    }]);
    const scripts = [ldJsonScript(business), ldJsonScript(crumbs)];
    const faqArr = Array.isArray(p.faq) ? p.faq : [];
    if (faqArr.length) {
      scripts.push(ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqArr.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer
          }
        }))
      }));
    }
    return {
      ...meta,
      scripts
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$8, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$6, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$6, "notFoundComponent")
});
const $$splitNotFoundComponentImporter$5 = () => import("./p.es._slug-DmrA9Cld.js");
const $$splitErrorComponentImporter$5 = () => import("./p.es._slug-CF_iizbQ.js");
const $$splitComponentImporter$7 = () => import("./p.es._slug-Czklz_QE.js");
const ES_TO_EN_SLUG = {
  "houston-gana-dinero-alberca": "become-a-swimming-pool-host-houston-tx",
  "dallas-renta-tu-alberca": "become-a-swimming-pool-host-dallas-tx",
  "san-antonio-rentar-alberca": "become-a-swimming-pool-host-san-antonio-tx",
  "austin-alquila-tu-alberca": "become-a-swimming-pool-host-austin-tx",
  "katy-gana-dinero-alberca": "become-a-swimming-pool-host-katy-tx"
};
const Route$M = createFileRoute("/p/es/$slug")({
  beforeLoad: async ({
    params
  }) => {
    const compositeSlug = `es/${params.slug}`;
    const result = await lookupContentPage({
      data: {
        slug: compositeSlug
      }
    });
    if (result.kind === "redirect") {
      if (result.redirectPath?.startsWith("/")) {
        throw redirect({
          href: result.redirectPath,
          statusCode: 301,
          replace: true
        });
      }
      const stripped = result.canonicalSlug.startsWith("es/") ? result.canonicalSlug.slice(3) : result.canonicalSlug;
      throw redirect({
        to: "/p/es/$slug",
        params: {
          slug: stripped
        },
        statusCode: 301,
        replace: true
      });
    }
    if (result.kind === "not_found") {
      void log404({
        data: {
          urlPath: `/p/es/${params.slug}`,
          slug: compositeSlug
        }
      });
      throw notFound();
    }
    return {
      page: result.page
    };
  },
  loader: async ({
    context
  }) => {
    const page = context.page;
    let linkTargets = [];
    try {
      linkTargets = await getInternalLinkTargets({
        data: {
          citySlug: null,
          nearbyCitySlugs: []
        }
      });
    } catch {
      linkTargets = [];
    }
    const origin = await getRouteOrigin();
    return {
      page,
      linkTargets,
      origin
    };
  },
  head: ({
    loaderData,
    params
  }) => {
    if (!loaderData?.page) return {};
    const p = loaderData.page;
    const path = `/p/es/${params.slug}`;
    const canonicalPath = p.url_path || path;
    const titleBase = p.title || p.seo_title || params.slug;
    const title = p.seo_title || `${titleBase} | ${SITE_NAME$3}`;
    const description = (p.seo_description || p.description || titleBase || "").slice(0, 160);
    const origin = loaderData.origin ?? SITE_URL;
    const enTwin = ES_TO_EN_SLUG[params.slug];
    const hreflang = enTwin ? [{
      lang: "es",
      href: `${origin}${path}`
    }, {
      lang: "en",
      href: `${origin}/p/${enTwin}`
    }, {
      lang: "x-default",
      href: `${origin}/p/${enTwin}`
    }] : void 0;
    const meta = buildMeta({
      title,
      description,
      path,
      canonicalPath,
      image: p.cover_image_url || p.hero_image_url || void 0,
      type: "article",
      origin,
      hreflang
    });
    const scripts = [ldJsonScript(breadcrumbJsonLd$1([{
      name: "Home",
      path: "/"
    }, {
      name: titleBase || path,
      path
    }])), ldJsonScript({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p.title,
      description,
      image: p.cover_image_url ? [p.cover_image_url] : void 0,
      author: AUTHOR_PERSON_JSONLD_REF,
      dateModified: p.updated_at,
      mainEntityOfPage: `${SITE_URL}${path}`,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME$3,
        url: SITE_URL
      },
      inLanguage: "es"
    })];
    return {
      ...meta,
      htmlAttrs: {
        lang: "es"
      },
      scripts
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$7, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$5, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$5, "notFoundComponent")
});
createServerFn({
  method: "GET"
}).inputValidator((d) => listSchema.parse(d ?? {})).handler(createSsrRpc("475a2840d66ebaf221ee3508cdc5e93277ff0a700e559d06ece9060fd0e6d494"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).optional()
}).parse(d ?? {})).handler(createSsrRpc("d94dc264efa75c39026c070896372b405481e85dc08e151999fa7438b0447f4d"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).optional()
}).parse(d ?? {})).handler(createSsrRpc("d3ff98f9d089d040cc34f1df45804fcbfead514ba58283f97d23599d95ce1d26"));
createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).optional(),
  limit: z.number().int().min(1).max(12).default(3)
}).parse(d ?? {})).handler(createSsrRpc("a4846eb44c303f1117f2d39802aa4e8d165dc0e42119615f9173f513a0096ebf"));
const getCourse = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: slugSchema
}).parse(d)).handler(createSsrRpc("d3261a09eb1aee5521c098d60c84270987b322d7a7085005c7b3a4e6abffcee9"));
const getRelatedCourses = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: slugSchema,
  category: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/),
  language: z.enum(["en", "es"]).default("en")
}).parse(d)).handler(createSsrRpc("74c376c755c49bc9421a0b79ca08d46b3142b6654356be257c29003817e6562f"));
createServerFn({
  method: "GET"
}).handler(createSsrRpc("c23683e9e1831ce3ced44ae91cf1d5440fe645e1ef72ddd8d8df167a4c5d0a08"));
const ES_TO_EN = {
  // Spanish Health pack (safety)
  "prevencion-de-ahogamientos-para-anfitriones-es": "drowning-response-in-pools",
  "como-certificarse-en-rcp-es": "how-to-get-cpr-certified",
  "equipo-de-rescate-acuatico-es": "water-rescue-equipment-life-ring-vs-shepherd-s-hook",
  "plan-de-accion-de-emergencia-para-anfitriones-es": "emergency-action-planning-eap-incident-response-guide-for-poolrentalnearme-hosts-instructors-and-guests",
  "supervision-designada-y-seguridad-del-agua-es": "water-safety-designated-supervision",
  "prevencion-de-resbalones-y-caidas-es": "preventing-slip-and-falls-in-your-pool-area",
  "prevencion-de-enfermedades-transmitidas-por-el-agua-es": "waterborne-illness-prevention-guide",
  // getting-started
  "de-swimply-a-pool-rental-near-me-es": "migrating-from-swimply-to-prnm-complete-switch-guide",
  "como-empezar-publica-tu-alberca-es": "market-rent-your-pool-a-hands-on-guide",
  "tu-primer-anuncio-fotos-y-descripcion-es": "listing-optimization-guide-photography-copy-conversion-science-for-poolrentalnearme-hosts",
  "configura-disponibilidad-y-reglas-de-la-casa-es": "pool-rental-near-me-availability-management-guide",
  // pricing
  "como-fijar-el-precio-de-tu-alberca-es": "pricing-strategy-dynamic-revenue-management-guide",
  "precios-dinamicos-alta-demanda-es": "price-variations-dynamic-pricing-guide",
  "amenidades-que-aumentan-tu-tarifa-es": "the-convenience-upsell-playbook",
  "paquetes-y-ofertas-personalizadas-es": "guide-designing-tiered-experience-packages-base-premium-vip-for-a-pool-clothing-optional-or-wellness-swim-venue",
  "maximiza-tus-ingresos-por-temporada-es": "seasonal-business-management-for-pool-rental-near-me-hosts-year-round-revenue-mastery",
  "entiende-tus-numeros-ingresos-gastos-ganancia-es": "cost-per-swim-modeling-for-pool-hosts",
  // legal
  "seguro-y-cobertura-de-responsabilidad-es": "insurance-legal-essentials-for-pool-hosts",
  "exencion-de-responsabilidad-waivers-es": "liability-waivers-that-actually-protect-you",
  "impuestos-para-anfitriones-de-alberca-es": "tax-implications-for-pool-rental-income",
  "permisos-y-regulaciones-locales-es": "regulatory-compliance-essentials-guide-for-pool-rental-hosts",
  "como-manejar-tu-hoa-es": "hoa-warfare-bypass-restrictions-rent-your-pool",
  "forma-una-llc-para-tu-negocio-de-alberca-es": "forming-an-llc-for-your-pool-business"
};
const EN_TO_ES = Object.fromEntries(
  Object.entries(ES_TO_EN).map(([es, en]) => [en, es])
);
function courseTwinSlug(slug, lang) {
  return lang === "es" ? ES_TO_EN[slug] ?? null : EN_TO_ES[slug] ?? null;
}
const $$splitNotFoundComponentImporter$4 = () => import("./p.course._slug-f2PAzKlG.js");
const $$splitErrorComponentImporter$4 = () => import("./p.course._slug-B5mgdh8v.js");
const $$splitComponentImporter$6 = () => import("./p.course._slug-CNTvJFmd.js");
const Route$L = createFileRoute("/p/course/$slug")({
  loader: async ({
    params
  }) => {
    const {
      course
    } = await getCourse({
      data: {
        slug: params.slug
      }
    });
    if (!course) throw notFound();
    let related = [];
    try {
      const r = await getRelatedCourses({
        data: {
          slug: course.slug,
          category: course.category,
          language: course.language === "es" ? "es" : "en"
        }
      });
      related = r.related ?? [];
    } catch {
      related = [];
    }
    return {
      course,
      related
    };
  },
  head: ({
    loaderData,
    params
  }) => {
    if (!loaderData?.course) return {};
    const c = loaderData.course;
    const path = `/p/course/${params.slug}`;
    const lang = c.language === "es" ? "es" : "en";
    const titleBase = c.title;
    const title = c.seo_title || `${titleBase} | ${SITE_NAME$3}`;
    const description = (c.seo_description || c.excerpt || c.subtitle || titleBase || "").slice(0, 160);
    const image = c.cover_image_url || void 0;
    const twinSlug = courseTwinSlug(params.slug, lang);
    const twinLang = lang === "es" ? "en" : "es";
    const hreflang = twinSlug ? [{
      lang,
      href: `${SITE_URL}${path}`
    }, {
      lang: twinLang,
      href: `${SITE_URL}/p/course/${twinSlug}`
    }, {
      lang: "x-default",
      href: `${SITE_URL}${lang === "en" ? path : `/p/course/${twinSlug}`}`
    }] : void 0;
    const meta = buildMeta({
      title,
      description,
      path,
      canonicalPath: path,
      image: image ?? null,
      type: "article",
      hreflang
    });
    const hubPath = academyHubPath(lang);
    const scripts = [ldJsonScript(breadcrumbJsonLd$1([{
      name: lang === "es" ? "Inicio" : "Home",
      path: "/"
    }, {
      name: lang === "es" ? "Academia" : "Academy",
      path: hubPath
    }, {
      name: titleBase,
      path
    }])), ldJsonScript({
      "@context": "https://schema.org",
      "@type": "Course",
      name: titleBase,
      description,
      provider: {
        "@type": "Organization",
        name: SITE_NAME$3,
        sameAs: SITE_URL
      },
      inLanguage: lang,
      url: `${SITE_URL}${path}`,
      ...image ? {
        image
      } : {}
    })];
    return {
      ...meta,
      htmlAttrs: lang === "es" ? {
        lang: "es"
      } : void 0,
      scripts
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$6, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$4, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$4, "notFoundComponent")
});
const PATH = "/p/author/derek-bowen";
const cover = (id) => `https://m.media-amazon.com/images/I/${id}._SY425_.jpg`;
const amazonUrl = (asin) => `https://www.amazon.com/dp/${asin}`;
const BOOKS = [{
  asin: "B0FG5C7LRJ",
  title: "Pool Host Riches",
  subtitle: "Transform Your Pool into a Money-Making Machine — The Complete Guide to Starting, Growing, and Scaling Your Pool Hosting Business",
  cover: "51y-llKFeQL",
  blurb: "Proven strategies for building a $50K+/year pool rental business, from the first listing through scaling to multiple properties."
}, {
  asin: "B0FY67SZTJ",
  title: "The Backyard Entrepreneur",
  subtitle: "Your Complete Guide to Hosting Profitable Events at Home — Start and Scale a Pool Rental Business from Scratch",
  cover: "81BCOb6KTUL",
  blurb: "How homeowners turn underused backyards into rental income, with a focus on private pools and outdoor venues."
}, {
  asin: "B0GGZHM71K",
  title: "The Pool Rental & Spa Playbook",
  subtitle: "Turn Your Backyard Into Passive Income",
  cover: "61JbOhremYL",
  blurb: "A practical playbook for listing, booking, and profiting from your pool or spa without the daily overwhelm."
}, {
  asin: "B0GS1ZDZTT",
  title: "The Complete Guide to Renting Your Swimming Pool in the United States",
  subtitle: "State-by-State Laws, Safety, Permits, and Best Practices",
  cover: "21npsEPobxL",
  blurb: "Everything U.S. homeowners need: regulations, insurance, pricing, and safety frameworks for every state."
}, {
  asin: "B0GCTKKD9T",
  title: "The Pool Rental Side Hustle",
  subtitle: "How to Make Money in the Private Pool Economy Without Owning a Pool",
  cover: "71SoNmfzwrL",
  blurb: "Build a profitable pool rental business as a middleman, property manager, or service provider — no pool required."
}, {
  asin: "B0GCT1VL46",
  title: "Backyard Brands",
  subtitle: "Turn Your Pool into a Premium Event Venue and Charge 10X More — The High-Ticket Strategy for Pool Hosts",
  cover: "31+JMj3xuwL",
  blurb: "Stop competing on price. Position your pool as a premium brand and command rates that high-ticket clients pay."
}, {
  asin: "B0GCT47DGB",
  title: "Turn Your Swimming Pool Into a Goldmine",
  subtitle: "The Complete Guide to Earning $3K–$12K Monthly by Hosting Pool Rentals on Pool Rental Near Me",
  cover: "616h0KNFbjL",
  blurb: "A step-by-step guide to $3K–$12K monthly recurring income from one backyard pool using Pool Rental Near Me."
}];
const LINKEDIN_URL = "https://www.linkedin.com/in/derekcbowen/";
const AMAZON_AUTHOR_URL = "https://www.amazon.com/stores/Derek-Bowen/author/B0FJM55Y12";
const PRESS_URL = "https://www.einpresswire.com/article/908834379/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours";
const $$splitComponentImporter$5 = () => import("./p.author.derek-bowen-Cw-021zi.js");
const TITLE = "Derek Bowen — Founder, Pool Rental Near Me | Author of 7 books on pool hosting";
const DESCRIPTION = "Derek Bowen is the founder of Pool Rental Near Me and author of 7 books on the pool rental economy. Class A CDL truck driver turned marketplace operator, writing about pool hosting, programmatic SEO, and bootstrapped startups.";
const PERSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Derek Bowen",
  url: `${SITE_URL}${PATH}`,
  jobTitle: "Founder & CEO, PRNM Corp",
  description: "Founder of Pool Rental Near Me and author of seven books on the pool rental economy. 20+ years of marketplace and e-commerce experience.",
  worksFor: {
    "@type": "Organization",
    name: "PRNM Corp",
    url: SITE_URL
  },
  sameAs: [AMAZON_AUTHOR_URL, LINKEDIN_URL, PRESS_URL, ...BOOKS.map((b) => amazonUrl(b.asin))],
  knowsAbout: ["Pool rental hosting", "Peer-to-peer marketplace operations", "Programmatic SEO", "Bootstrapped startup growth", "Short-term rental insurance", "Pool safety and liability"]
};
const BOOKS_LD = BOOKS.map((b) => ({
  "@context": "https://schema.org",
  "@type": "Book",
  name: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title,
  author: {
    "@type": "Person",
    name: "Derek Bowen"
  },
  url: amazonUrl(b.asin),
  image: cover(b.cover),
  bookFormat: "https://schema.org/EBook",
  publisher: {
    "@type": "Organization",
    name: "Amazon Kindle Direct Publishing"
  },
  identifier: {
    "@type": "PropertyValue",
    propertyID: "ASIN",
    value: b.asin
  }
}));
const Route$K = createFileRoute("/p/author/derek-bowen")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "website"
    });
    return {
      ...meta,
      scripts: [ldJsonScript(breadcrumbJsonLd$1([{
        name: "Home",
        path: "/"
      }, {
        name: "Authors",
        path: "/p/author/derek-bowen"
      }, {
        name: "Derek Bowen",
        path: PATH
      }])), ldJsonScript(PERSON_LD), ...BOOKS_LD.map((b) => ldJsonScript(b))]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
function parseSuppressionPayload(body) {
  const parsed = JSON.parse(body);
  if (!parsed.data) {
    throw new Error("Missing data field in payload");
  }
  const data = parsed.data;
  if (!data.email || !data.reason) {
    throw new Error("Missing required fields: email, reason");
  }
  return data;
}
function mapReasonToStatus(reason) {
  switch (reason) {
    case "bounce":
      return "bounced";
    case "complaint":
      return "complained";
    default:
      return "suppressed";
  }
}
function mapReasonToMessage(reason) {
  switch (reason) {
    case "bounce":
      return "Permanent bounce — email address is invalid or rejected";
    case "complaint":
      return "Spam complaint — recipient marked email as spam";
    case "unsubscribe":
      return "Recipient unsubscribed";
    default:
      return "Email suppressed";
  }
}
const Route$J = createFileRoute("/lovable/email/suppression")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        const supabaseUrl = "https://ptfjspcphskifoseidut.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
          console.error("Missing required environment variables");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        let payload;
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseSuppressionPayload
          });
          payload = verified.payload;
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case "invalid_signature":
                console.error("Invalid webhook signature");
                return Response.json({ error: "Invalid signature" }, { status: 401 });
              case "stale_timestamp":
                console.error("Stale webhook timestamp");
                return Response.json({ error: "Stale timestamp" }, { status: 401 });
              case "invalid_payload":
              case "invalid_json":
                console.error("Invalid payload", { code: error.code });
                return Response.json({ error: "Invalid payload" }, { status: 400 });
              default:
                console.error("Webhook verification failed", {
                  code: error.code,
                  message: error.message
                });
                return Response.json({ error: "Verification failed" }, { status: 401 });
            }
          }
          console.error("Unexpected error during verification", { error });
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const normalizedEmail = payload.email.toLowerCase();
        const { error: suppressError } = await supabase2.from("suppressed_emails").upsert(
          {
            email: normalizedEmail,
            reason: payload.reason,
            metadata: payload.metadata ?? null
          },
          { onConflict: "email" }
        );
        if (suppressError) {
          console.error("Failed to upsert suppressed email", {
            error: suppressError,
            email_redacted: normalizedEmail[0] + "***@" + normalizedEmail.split("@")[1]
          });
          return Response.json({ error: "Failed to write suppression" }, { status: 500 });
        }
        const sendLogStatus = mapReasonToStatus(payload.reason);
        const sendLogMessage = mapReasonToMessage(payload.reason);
        const { error: insertError } = await supabase2.from("email_send_log").insert({
          message_id: payload.message_id ?? null,
          template_name: "system",
          recipient_email: normalizedEmail,
          status: sendLogStatus,
          error_message: sendLogMessage,
          metadata: payload.metadata ?? null
        });
        if (insertError) {
          console.warn("Failed to insert email_send_log", {
            error: insertError
          });
        }
        console.log("Suppression processed", {
          email_redacted: normalizedEmail[0] + "***@" + normalizedEmail.split("@")[1],
          reason: payload.reason,
          is_retry: payload.is_retry,
          retry_count: payload.retry_count,
          has_message_id: !!payload.message_id
        });
        return Response.json({ success: true });
      }
    }
  }
});
const SIG_HEADER = "x-emailit-signature";
const TS_HEADER = "x-emailit-timestamp";
const obj = (evt) => evt.data && (evt.data.object || evt.data) || {};
function extractEmail(evt) {
  const o = obj(evt);
  const candidate = o.email || o.to || o.recipient || o.email_address || o.recipient_email || (typeof o.to === "object" ? o.to?.email : null) || evt.email || evt.recipient || evt.to;
  if (typeof candidate !== "string") return null;
  return candidate.trim().toLowerCase() || null;
}
function extractMessageId(evt) {
  const o = obj(evt);
  const candidate = o.email_id || o.message_id || o.id || o.object_id || evt.message_id || null;
  return typeof candidate === "string" ? candidate : null;
}
function extractType(evt) {
  return (evt.type || evt.event || "").toLowerCase();
}
function isHardBounce(evt) {
  const o = obj(evt);
  if (evt.hard === true || o.hard === true) return true;
  const bt = (evt.bounce_type || o.bounce_type || o.type || "").toLowerCase();
  if (bt === "hard" || bt === "permanent") return true;
  if (bt === "soft" || bt === "transient") return false;
  return true;
}
function hexEq(a, b) {
  let ab;
  let bb;
  try {
    ab = Buffer.from(a, "hex");
    bb = Buffer.from(b, "hex");
  } catch {
    return false;
  }
  if (ab.length === 0 || ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}
const Route$I = createFileRoute("/lovable/email/emailit-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.EMAILIT_WEBHOOK_SECRET;
        const supabaseUrl = "https://ptfjspcphskifoseidut.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!secret || !supabaseUrl || !supabaseServiceKey) {
          console.error("emailit-webhook: missing required env vars");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        const rawBody = await request.text();
        const signature = (request.headers.get(SIG_HEADER) || "").replace(/^sha256=/i, "").trim();
        const timestamp = (request.headers.get(TS_HEADER) || "").trim();
        if (!signature || !timestamp) {
          return Response.json({ error: "Missing signature headers" }, { status: 401 });
        }
        const signedPayload = `${timestamp}.${rawBody}`;
        const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
        if (!hexEq(signature, expected)) {
          console.warn("emailit-webhook: invalid signature");
          return Response.json({ error: "Invalid signature" }, { status: 401 });
        }
        const tsSeconds = Number(timestamp);
        if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1e3 - tsSeconds) > 300) {
          return Response.json({ error: "Stale or invalid timestamp" }, { status: 401 });
        }
        let evt;
        try {
          const parsed = JSON.parse(rawBody);
          evt = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const type = extractType(evt);
        const email = extractEmail(evt);
        const messageId = extractMessageId(evt);
        const eventId = evt.event_id || null;
        if (type.includes("bounce")) {
          if (!email) return Response.json({ ok: true, skipped: "no_email" });
          const hard = isHardBounce(evt);
          if (hard) {
            await supabase2.from("suppressed_emails").upsert({ email, reason: "bounce", metadata: evt }, { onConflict: "email" });
            await supabase2.from("email_send_log").insert({
              message_id: messageId,
              template_name: "system",
              recipient_email: email,
              status: "bounced",
              error_message: "Hard bounce reported by Emailit",
              metadata: { event_id: eventId, type }
            });
            return Response.json({ ok: true, action: "suppressed_bounce" });
          }
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: "system",
            recipient_email: email,
            status: "failed",
            error_message: "Soft bounce (transient) reported by Emailit",
            metadata: { event_id: eventId, type }
          });
          return Response.json({ ok: true, action: "soft_bounce_logged" });
        }
        if (type.includes("complain") || type.includes("spam")) {
          if (!email) return Response.json({ ok: true, skipped: "no_email" });
          await supabase2.from("suppressed_emails").upsert({ email, reason: "complaint", metadata: evt }, { onConflict: "email" });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: "system",
            recipient_email: email,
            status: "complained",
            error_message: "Spam complaint reported by Emailit",
            metadata: { event_id: eventId, type }
          });
          return Response.json({ ok: true, action: "suppressed_complaint" });
        }
        const engagement = {
          "email.loaded": "opened",
          "email.clicked": "clicked",
          "email.delivered": "delivered"
        };
        const status = engagement[type];
        if (status) {
          if (!email && !messageId) return Response.json({ ok: true, skipped: "no_key" });
          if (eventId) {
            const { data: dup } = await supabase2.from("email_send_log").select("id").eq("metadata->>event_id", eventId).limit(1);
            if (dup && dup.length > 0) return Response.json({ ok: true, action: "duplicate" });
          }
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: "event",
            recipient_email: email,
            status: "sent",
            error_message: null,
            metadata: { event_id: eventId, type, engagement: status }
          });
          return Response.json({ ok: true, action: status });
        }
        console.log("emailit-webhook: ack (no-op)", { type, has_email: !!email });
        return Response.json({ ok: true, action: "ack", type });
      }
    }
  }
});
const $$splitNotFoundComponentImporter$3 = () => import("./l._slug._id-DM0z9gBm.js");
const $$splitErrorComponentImporter$3 = () => import("./l._slug._id-DaXx0peb.js");
const $$splitComponentImporter$4 = () => import("./l._slug._id-BnVeJVYB.js");
const Route$H = createFileRoute("/l/$slug/$id")({
  loader: async ({
    params
  }) => {
    const {
      listing
    } = await getListing({
      data: {
        id: params.id
      }
    });
    if (!listing) throw notFound();
    return {
      listing
    };
  },
  head: ({
    loaderData,
    params
  }) => {
    if (!loaderData?.listing) return {};
    const l = loaderData.listing;
    const loc = [l.city, l.state].filter(Boolean).join(", ");
    const title = `${l.title}${loc ? ` — ${loc}` : ""} | Pool Rental Near Me`;
    const desc = (l.description || `Rent ${l.title} by the hour. Book instantly with $2M liability insurance included.`).replace(/\s+/g, " ").slice(0, 160);
    const meta = buildMeta({
      title,
      description: desc,
      path: `/l/${params.slug}/${params.id}`,
      image: l.imageUrl,
      type: "product"
    });
    const product = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: l.title,
      description: desc,
      image: l.imageUrl ? [l.imageUrl] : void 0,
      url: `${SITE_URL}/l/${params.slug}/${params.id}`,
      ...l.price && {
        offers: {
          "@type": "Offer",
          priceCurrency: l.price.currency,
          price: (l.price.amount / 100).toFixed(2),
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: (l.price.amount / 100).toFixed(2),
            priceCurrency: l.price.currency,
            unitCode: "HUR"
          },
          availability: "https://schema.org/InStock"
        }
      }
    };
    const crumbs = breadcrumbJsonLd$1([{
      name: "Home",
      path: "/"
    }, {
      name: "Pool Rentals",
      path: "/"
    }, {
      name: l.title,
      path: `/l/${params.slug}/${params.id}`
    }]);
    return {
      ...meta,
      scripts: [ldJsonScript(product), ldJsonScript(crumbs)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$4, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$3, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$3, "notFoundComponent")
});
const slugRegex = /^[a-z0-9-]+$/;
const Body = z.object({
  to_city_slug: z.string().min(1).max(120).regex(slugRegex),
  from_city_slug: z.string().min(1).max(120).regex(slugRegex).optional().nullable(),
  referrer_path: z.string().max(2e3).optional().nullable()
});
function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(/;\s*/);
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    if (p.slice(0, eq) === name) return decodeURIComponent(p.slice(eq + 1));
  }
  return null;
}
function randomVisitorId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += b.toString(36);
  return out.slice(0, 24);
}
const Route$G = createFileRoute("/api/public/track-city-click")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          const raw = await request.text();
          parsed = Body.parse(JSON.parse(raw));
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const headers2 = request.headers;
        const ua = (headers2.get("user-agent") || "").slice(0, 500);
        const country = headers2.get("cf-ipcountry") || headers2.get("x-vercel-ip-country") || headers2.get("x-country") || null;
        const region = headers2.get("cf-region") || headers2.get("x-vercel-ip-country-region") || headers2.get("x-region") || null;
        let visitorHash = getCookie(headers2.get("cookie"), "prnm_vid");
        const setCookie2 = !visitorHash;
        if (!visitorHash) visitorHash = randomVisitorId();
        const { error } = await supabaseAdmin.from("city_link_clicks").insert({
          to_city_slug: parsed.to_city_slug,
          from_city_slug: parsed.from_city_slug ?? null,
          referrer_path: parsed.referrer_path ?? null,
          user_agent: ua || null,
          visitor_hash: visitorHash,
          country,
          region
        });
        if (error) {
          console.error("track-city-click insert failed", error);
          return new Response("error", { status: 500 });
        }
        const resHeaders = {
          "content-type": "text/plain",
          "cache-control": "no-store"
        };
        if (setCookie2) {
          resHeaders["set-cookie"] = `prnm_vid=${visitorHash}; Path=/; Max-Age=${60 * 60 * 24 * 90}; SameSite=Lax; HttpOnly; Secure`;
        }
        return new Response("ok", { status: 204, headers: resHeaders });
      }
    }
  }
});
const EXTERNAL_PREFIXES = [
  "/s",
  "/l/",
  "/login",
  "/signup",
  "/inbox",
  "/auth/",
  "/account/",
  "/profile/",
  "/messages/",
  "/listings/",
  "/saved-listings",
  "/amenity/",
  "/amenities",
  "/public-pools/",
  "/referral"
];
const isExternalOwned = (path) => EXTERNAL_PREFIXES.some((p) => path === p || path.startsWith(p));
const DEFAULT_SEEDS = [
  "/",
  "/p/hosting",
  "/p/how-it-works",
  "/p/earnings-calculator",
  "/p/free-host-tools",
  "/p/all-locations"
];
function extractHrefs(html) {
  const out = /* @__PURE__ */ new Set();
  const re = /<a\b[^>]*\bhref=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.add(m[1]);
  return Array.from(out);
}
async function fetchWithTimeout(url, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { redirect: "manual", signal: ctl.signal, headers: { "user-agent": "fresh-web-link-health" } });
  } finally {
    clearTimeout(t);
  }
}
const Route$F = createFileRoute("/api/public/link-health")({
  server: {
    handlers: {
      GET: async ({ request }) => handle$1(request),
      POST: async ({ request }) => handle$1(request)
    }
  }
});
async function handle$1(request) {
  const t0 = Date.now();
  const url = new URL(request.url);
  const seedsParam = url.searchParams.get("seeds");
  const max = Math.min(Number(url.searchParams.get("max") || 40), 150);
  const timeoutMs = Math.min(Number(url.searchParams.get("timeout") || 8e3), 15e3);
  const persist = url.searchParams.get("persist") === "1";
  const source = (url.searchParams.get("source") || "manual").slice(0, 32);
  const PROD_ORIGIN2 = "https://www.poolrentalnearme.com";
  const origin = PROD_ORIGIN2;
  const host = new URL(origin).host;
  const seeds = (seedsParam ? seedsParam.split(",") : DEFAULT_SEEDS).map((s) => s.trim()).filter((s) => s.startsWith("/")).slice(0, 25);
  const seen = /* @__PURE__ */ new Set();
  const queue = [...seeds];
  const sources = /* @__PURE__ */ new Map();
  for (const s of seeds) sources.set(s, "(seed)");
  const results = [];
  async function check(path) {
    if (seen.has(path) || seen.size >= max) return;
    seen.add(path);
    let res;
    try {
      res = await fetchWithTimeout(origin + path, timeoutMs);
    } catch (err) {
      results.push({ path, status: 0, ok: false, reason: `fetch failed: ${err?.message || err}`, source: sources.get(path) });
      return;
    }
    const status = res.status;
    let ok = false;
    let reason = "";
    if (status === 200) ok = true;
    else if ([301, 302, 307, 308].includes(status)) {
      const loc = res.headers.get("location") || "";
      if (!loc) reason = `${status} no Location`;
      else {
        try {
          const target = loc.startsWith("http") ? loc : origin + (loc.startsWith("/") ? loc : "/" + loc);
          const r2 = await fetchWithTimeout(target, timeoutMs);
          if (r2.status === 200) {
            ok = true;
            reason = `${status} -> 200`;
          } else reason = `${status} -> ${r2.status}`;
        } catch (err) {
          reason = `${status} -> error ${err?.message || err}`;
        }
      }
    } else {
      reason = `HTTP ${status}`;
    }
    results.push({ path, status, ok, reason, source: sources.get(path) });
    if (ok && status === 200 && !isExternalOwned(path) && seen.size < max) {
      const ct = res.headers.get("content-type") || "";
      if (/html/i.test(ct)) {
        let body = "";
        try {
          body = await res.text();
        } catch {
        }
        for (const raw of extractHrefs(body)) {
          const href = raw.split("#")[0].trim();
          if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
          let p = null;
          if (href.startsWith("/")) p = href;
          else if (/^https?:\/\//i.test(href)) {
            try {
              const u = new URL(href);
              if (u.host === host) p = u.pathname + (u.search || "");
            } catch {
            }
          }
          if (!p) continue;
          if (!sources.has(p)) sources.set(p, path);
          if (!seen.has(p)) queue.push(p);
        }
      }
    }
  }
  while (queue.length && seen.size < max) {
    const next = queue.shift();
    await check(next);
  }
  const broken = results.filter((r) => !r.ok);
  const durationMs = Date.now() - t0;
  if (persist) {
    try {
      await supabaseAdmin.from("link_health_runs").insert({
        origin,
        checked: results.length,
        broken_count: broken.length,
        ok: broken.length === 0,
        broken: broken.slice(0, 200),
        duration_ms: durationMs,
        source
      });
    } catch (err) {
      console.error("link_health_runs insert failed:", err);
    }
  }
  return new Response(
    JSON.stringify({
      ok: broken.length === 0,
      origin,
      checked: results.length,
      brokenCount: broken.length,
      durationMs,
      broken: broken.slice(0, 100)
    }, null, 2),
    { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
const STATE_NAMES$2 = {
  al: "Alabama",
  ak: "Alaska",
  az: "Arizona",
  ar: "Arkansas",
  ca: "California",
  co: "Colorado",
  ct: "Connecticut",
  de: "Delaware",
  fl: "Florida",
  ga: "Georgia",
  hi: "Hawaii",
  id: "Idaho",
  il: "Illinois",
  in: "Indiana",
  ia: "Iowa",
  ks: "Kansas",
  ky: "Kentucky",
  la: "Louisiana",
  me: "Maine",
  md: "Maryland",
  ma: "Massachusetts",
  mi: "Michigan",
  mn: "Minnesota",
  ms: "Mississippi",
  mo: "Missouri",
  mt: "Montana",
  ne: "Nebraska",
  nv: "Nevada",
  nh: "New Hampshire",
  nj: "New Jersey",
  nm: "New Mexico",
  ny: "New York",
  nc: "North Carolina",
  nd: "North Dakota",
  oh: "Ohio",
  ok: "Oklahoma",
  or: "Oregon",
  pa: "Pennsylvania",
  ri: "Rhode Island",
  sc: "South Carolina",
  sd: "South Dakota",
  tn: "Tennessee",
  tx: "Texas",
  ut: "Utah",
  vt: "Vermont",
  va: "Virginia",
  wa: "Washington",
  wv: "West Virginia",
  wi: "Wisconsin",
  wy: "Wyoming",
  dc: "District of Columbia"
};
const STATE_LONG_TO_CODE = Object.fromEntries(
  Object.entries(STATE_NAMES$2).map(([code, name]) => [
    name.toLowerCase().replace(/\s+/g, "-"),
    code.toUpperCase()
  ])
);
function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
function classify(slug) {
  const hostMatch = slug.match(
    /^become-a-(?:swimming-)?pool-host-+(.+?)-(?:([a-z]{2})|([a-z-]+))$/i
  );
  if (hostMatch) {
    const cityRaw = hostMatch[1].replace(/^-+|-+$/g, "");
    const stateCode = hostMatch[2]?.toUpperCase();
    const stateLong = hostMatch[3];
    let code = stateCode;
    let name = stateCode ? STATE_NAMES$2[stateCode.toLowerCase()] : void 0;
    if (!code && stateLong && STATE_LONG_TO_CODE[stateLong]) {
      code = STATE_LONG_TO_CODE[stateLong];
      name = titleCase(stateLong.replace(/-/g, " "));
    }
    if (code) {
      return {
        kind: "host_city",
        city: titleCase(cityRaw.replace(/-/g, " ")),
        stateCode: code,
        stateName: name || code
      };
    }
  }
  const advMatch = slug.match(/^([a-z-]+)-pool-host-advocacy-guide$/i);
  if (advMatch) {
    const long = advMatch[1].toLowerCase();
    const code = STATE_LONG_TO_CODE[long];
    if (code) {
      return {
        kind: "state_advocacy",
        stateCode: code,
        stateName: titleCase(long.replace(/-/g, " "))
      };
    }
  }
  return { kind: "resource", topic: titleCase(slug.replace(/-/g, " ")) };
}
function buildPrompt(row) {
  const slug = row.slug || row.url_path.replace(/^\/p\//, "");
  const cls = classify(slug);
  const sharedRules = `
You write SEO content for Pool Rental Near Me (PRNM), a marketplace where homeowners rent out their private pools by the hour.
Differentiators to mention naturally: 10% flat host fee (vs Swimply's 15%+), $2M liability insurance included, 5,100+ city pages.
Markdown only. Use H2 (##) and H3 (###). Short paragraphs. Real, useful content — no filler, no "in this article we will". Do not invent statistics.
Internal links allowed: /s, /s?address={City%2C+ST}, /p/hosting, /p/all-locations, /p/earnings-calculator, /p/how-it-works, /p/waivers, /p/hoa-pool-rental-defense-kit.
List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details
Return your answer ONLY by calling the write_page tool.
`.trim();
  if (cls.kind === "host_city") {
    return {
      system: sharedRules,
      user: `Write a host-recruitment landing page for ${cls.city}, ${cls.stateCode}.

Title: "Become a Pool Host in ${cls.city}, ${cls.stateCode}"
Length: 800-1200 words.

Required sections (use ## headings, paraphrase the heading text — don't copy verbatim):
1. Opening hook on the local pool-rental opportunity in ${cls.city}, ${cls.stateName}
2. What pools rent best here (architectural styles, heated/saltwater/spa, capacity)
3. Best seasons & peak demand windows for ${cls.city}'s climate
4. Realistic pricing tips ($/hour ranges, weekend premiums, peak vs shoulder)
5. Why list on PRNM — 10% flat fee vs Swimply's 15%+, $2M insurance, fast payouts. Link to /p/earnings-calculator and /p/hosting.
6. Nearby cities also strong for hosting (mention 3-5 real cities near ${cls.city} the host could also serve)
7. FAQ — 5 questions specific to ${cls.city}/${cls.stateName} hosting (insurance, neighbors/HOA, taxes, season, getting started)

End with a one-sentence CTA linking to /l/draft/00000000-0000-0000-0000-000000000000/new/details ("List your pool free").

seo_title (≤60 chars): "Become a Pool Host in ${cls.city}, ${cls.stateCode} | PRNM"
seo_description (≤155 chars): mention earnings, 10% fee, ${cls.city}.`
    };
  }
  if (cls.kind === "state_advocacy") {
    return {
      system: sharedRules,
      user: `Write a Pool Host Advocacy & Legality guide for ${cls.stateName} (${cls.stateCode}).

Title: "Pool Host Advocacy & Legality in ${cls.stateName}"
Length: 1000-1500 words. Be factual; if uncertain, use cautious language ("typically", "in most jurisdictions") and tell hosts to confirm with their city/county.

Required sections:
1. Is short-term pool rental legal in ${cls.stateName}? (general status — most states have no statewide ban; regulation is municipal)
2. Permits & business licenses commonly required at the city/county level
3. HOA & deed restrictions — how to defend your right to host (link to /p/hoa-pool-rental-defense-kit)
4. Insurance requirements — note PRNM's included $2M liability
5. Tax implications — Schedule E vs Schedule C, lodging tax, sales tax
6. How to operate compliantly — waivers (link /p/waivers), capacity limits, neighbor relations
7. FAQ — 5 questions specific to ${cls.stateName} hosts

End with CTA linking to /l/draft/00000000-0000-0000-0000-000000000000/new/details.

seo_title (≤60 chars), seo_description (≤155 chars) optimized for "${cls.stateName} pool rental laws".`
    };
  }
  return {
    system: sharedRules,
    user: `Write a genuinely useful article on the topic implied by the URL slug: "${slug}".
The slug IS the topic — interpret it literally. Topic phrase: "${cls.topic}".

Length: 800-1500 words.
Use ## section headings. Include practical, specific tips. If the topic is host-facing, link to /p/hosting and /p/all-locations and the List Your Pool CTA. If the topic is renter-facing, link to /s and /p/how-it-works. Include 3-5 internal links naturally in the body.

End with a short CTA paragraph appropriate to the topic.

seo_title (≤60 chars), seo_description (≤155 chars) targeting the literal topic.`
  };
}
const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "write_page",
    description: "Return the generated page content.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Human-readable page title (H1)" },
        seo_title: { type: "string", description: "≤60 chars" },
        seo_description: { type: "string", description: "≤155 chars" },
        body_markdown: { type: "string", description: "Full markdown body, no frontmatter" }
      },
      required: ["title", "seo_title", "seo_description", "body_markdown"],
      additionalProperties: false
    }
  }
};
async function callAI(row, model) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");
  const { system, user } = buildPrompt(row);
  let attempt = 0;
  while (true) {
    attempt++;
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "write_page" } }
      })
    });
    if (resp.status === 429 && attempt <= 3) {
      const wait = 2e3 * attempt;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (resp.status === 402) {
      throw new Error("AI credits exhausted (402). Add funds in Settings → Workspace → Usage.");
    }
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI gateway ${resp.status}: ${t.slice(0, 300)}`);
    }
    const data = await resp.json();
    const tc = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc?.function?.arguments) {
      throw new Error("AI response missing tool call");
    }
    const parsed = JSON.parse(tc.function.arguments);
    if (!parsed.body_markdown || parsed.body_markdown.length < 400) {
      throw new Error(`Generated body too short (${parsed.body_markdown?.length ?? 0} chars)`);
    }
    return parsed;
  }
}
const CATEGORY_ORDER = {
  "Host Acquisition (Hub)": 0,
  "Host Advocacy (State Guide)": 1,
  "Host Acquisition (City pSEO)": 2,
  "Resource/Article Page": 3,
  "Event/City Guide": 4
};
async function runBackfillContentPages(input) {
  const data = z.object({
    adminToken: z.string().min(8),
    limit: z.number().int().min(1).max(50).default(10),
    model: z.string().default("openai/gpt-5"),
    dryRun: z.boolean().default(false)
  }).parse(input);
  const expected = process.env.BACKFILL_ADMIN_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expected || data.adminToken !== expected) {
    throw new Error("Unauthorized");
  }
  {
    const { data: rows, error } = await supabaseAdmin.from("content_pages").select("id, slug, url_path, category, template_type, body_markdown, status, priority").like("url_path", "/p/%").neq("status", "published").order("priority", { ascending: false, nullsFirst: false }).limit(300);
    if (error) throw new Error(`select failed: ${error.message}`);
    const candidates = (rows || []).filter((r) => !!r.url_path && (!r.body_markdown || r.body_markdown.length < 200)).sort((a, b) => {
      const pa = a.priority ?? 0;
      const pb = b.priority ?? 0;
      if (pa !== pb) return pb - pa;
      const ca = CATEGORY_ORDER[a.category] ?? 99;
      const cb = CATEGORY_ORDER[b.category] ?? 99;
      if (ca !== cb) return ca - cb;
      return (a.url_path ?? "").localeCompare(b.url_path ?? "");
    }).slice(0, data.limit);
    if (data.dryRun) {
      return {
        dryRun: true,
        count: candidates.length,
        slugs: candidates.map((r) => ({
          url_path: r.url_path ?? "",
          category: r.category,
          classified: classify(r.slug || (r.url_path ?? "").replace(/^\/p\//, "")).kind
        }))
      };
    }
    const results = [];
    for (const row of candidates) {
      try {
        const gen = await callAI(row, data.model);
        const { error: upErr } = await supabaseAdmin.from("content_pages").update({
          title: gen.title,
          seo_title: gen.seo_title.slice(0, 70),
          seo_description: gen.seo_description.slice(0, 160),
          body_markdown: gen.body_markdown,
          status: "published",
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", row.id);
        if (upErr) throw new Error(upErr.message);
        results.push({
          url_path: row.url_path ?? "",
          ok: true,
          words: gen.body_markdown.split(/\s+/).length
        });
      } catch (e) {
        results.push({
          url_path: row.url_path ?? "",
          ok: false,
          error: e instanceof Error ? e.message : String(e)
        });
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
    return {
      dryRun: false,
      attempted: results.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results
    };
  }
}
const Route$E = createFileRoute("/api/public/backfill-content-pages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body = {};
        try {
          const text = await request.text();
          body = text ? JSON.parse(text) : {};
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        try {
          const headerToken = request.headers.get("x-admin-token") || void 0;
          const adminToken = body?.adminToken || headerToken;
          if (!adminToken || typeof adminToken !== "string") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
          const result = await runBackfillContentPages({ ...body, adminToken });
          return new Response(JSON.stringify(result, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return new Response(JSON.stringify({ error: msg }), {
            status: msg === "Unauthorized" ? 401 : 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
const TABLES = ["content_plan", "content_pages"];
function csvEscape(v) {
  if (v === null || v === void 0) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
async function authorize(request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, res: new Response("Unauthorized", { status: 401 }) };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const sb = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return { ok: false, res: new Response("Unauthorized", { status: 401 }) };
  const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  if (!role) return { ok: false, res: new Response("Forbidden", { status: 403 }) };
  return { ok: true };
}
const Route$D = createFileRoute("/api/admin/data-export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authorize(request);
        if (!auth.ok) return auth.res;
        const url = new URL(request.url);
        const table = url.searchParams.get("table");
        if (!table || !TABLES.includes(table)) {
          return new Response("Invalid table", { status: 400 });
        }
        const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const filename = `${table}-${ts}.csv`;
        const stream = new ReadableStream({
          async start(controller) {
            const enc = new TextEncoder();
            try {
              const pageSize = 500;
              let from = 0;
              let cols = null;
              while (true) {
                const { data: rows, error } = await supabaseAdmin.from(table).select("*").order("created_at", { ascending: true }).range(from, from + pageSize - 1);
                if (error) throw new Error(error.message);
                if (!rows || rows.length === 0) break;
                if (!cols) {
                  cols = Object.keys(rows[0]);
                  controller.enqueue(enc.encode(cols.join(",") + "\n"));
                }
                for (const r of rows) {
                  const line = cols.map((c) => csvEscape(r[c])).join(",");
                  controller.enqueue(enc.encode(line + "\n"));
                }
                if (rows.length < pageSize) break;
                from += pageSize;
              }
              controller.close();
            } catch (e) {
              controller.error(e);
            }
          }
        });
        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store"
          }
        });
      }
    }
  }
});
const $$splitComponentImporter$3 = () => import("./admin.learning._userId--8NbB9Jl.js");
const Route$C = createFileRoute("/admin/learning/$userId")({
  beforeLoad: async ({
    location
  }) => {
    const {
      data
    } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.pathname,
          mode: "signin"
        }
      });
    }
    const {
      isAdmin
    } = await checkAdminRole();
    if (!isAdmin) throw redirect({
      to: "/admin/no-access"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$3, "component"),
  head: () => ({
    meta: [{
      title: "Learner detail — Pool Rental Near Me"
    }]
  })
});
const $$splitErrorComponentImporter$2 = () => import("./p.pool-pros.c._category-U72oTqwo.js");
const $$splitNotFoundComponentImporter$2 = () => import("./p.pool-pros.c._category-Vpf78i3t.js");
const $$splitComponentImporter$2 = () => import("./p.pool-pros.c._category-CU_iBn_N.js");
const Route$B = createFileRoute("/p/pool-pros/c/$category")({
  loader: async ({
    params
  }) => {
    const res = await getCategoryWithProviders({
      data: {
        slug: params.category
      }
    });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({
    loaderData,
    params
  }) => {
    if (!loaderData?.category) return {};
    const c = loaderData.category;
    const path = `/p/pool-pros/c/${params.category}`;
    const title = c.seo_title || `${c.plural_name} Directory | Pool Rental Near Me`;
    const description = c.seo_description || `Browse ${c.plural_name.toLowerCase()} across the US.`;
    const meta = buildMeta({
      title,
      description,
      path,
      image: c.hero_image_url,
      noindex: true
    });
    meta.links = meta.links.filter((l) => l.rel !== "canonical");
    const crumbs = breadcrumbJsonLd$1([{
      name: "Home",
      path: "/"
    }, {
      name: "Pool Pros",
      path: "/p/pool-pros"
    }, {
      name: c.plural_name,
      path
    }]);
    const list = itemListJsonLd((loaderData.providers ?? []).slice(0, 50).map((p) => ({
      name: p.name,
      path: `/p/pool-pros/${p.slug}`,
      image: p.logo_url
    })), c.plural_name);
    return {
      ...meta,
      scripts: [ldJsonScript(crumbs), ldJsonScript(list)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$2, "component"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$2, "notFoundComponent"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$2, "errorComponent")
});
const SITE_NAME$2 = "Pool Rental Near Me";
const SENDER_DOMAIN$2 = "notify.poolfriends.poolrentalnearme.com";
const FROM_DOMAIN$2 = "notify.poolfriends.poolrentalnearme.com";
function redactEmail$1(email) {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}
function generateToken$1() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const Route$A = createFileRoute("/lovable/email/transactional/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = "https://ptfjspcphskifoseidut.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          console.error("Missing required environment variables");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user }, error: authError } = await supabase2.auth.getUser(token);
        if (authError || !user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        let templateName;
        let recipientEmail;
        let idempotencyKey;
        let messageId;
        let templateData = {};
        try {
          const body = await request.json();
          templateName = body.templateName || body.template_name;
          recipientEmail = body.recipientEmail || body.recipient_email;
          messageId = crypto.randomUUID();
          idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId;
          if (body.templateData && typeof body.templateData === "object") {
            templateData = body.templateData;
          }
        } catch {
          return Response.json(
            { error: "Invalid JSON in request body" },
            { status: 400 }
          );
        }
        if (!templateName) {
          return Response.json(
            { error: "templateName is required" },
            { status: 400 }
          );
        }
        const template = TEMPLATES[templateName];
        if (!template) {
          console.error("Template not found in registry", { templateName });
          return Response.json(
            {
              error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`
            },
            { status: 404 }
          );
        }
        let resolvedRecipient = template.to;
        if (!resolvedRecipient) {
          const callerEmail = user.email?.toLowerCase() ?? null;
          const requested = recipientEmail?.toLowerCase() ?? null;
          const { data: isAdmin } = await supabase2.rpc("has_role", {
            _user_id: user.id,
            _role: "admin"
          });
          if (isAdmin === true) {
            resolvedRecipient = recipientEmail;
          } else if (requested && callerEmail && requested === callerEmail) {
            resolvedRecipient = recipientEmail;
          } else if (!requested && callerEmail) {
            resolvedRecipient = user.email ?? void 0;
          } else {
            return Response.json(
              { error: "recipientEmail must match the authenticated user's email" },
              { status: 403 }
            );
          }
        }
        const effectiveRecipient = resolvedRecipient;
        if (!effectiveRecipient) {
          return Response.json(
            {
              error: "recipientEmail is required (unless the template defines a fixed recipient)"
            },
            { status: 400 }
          );
        }
        const { data: suppressed, error: suppressionError } = await supabase2.from("suppressed_emails").select("id").eq("email", effectiveRecipient.toLowerCase()).maybeSingle();
        if (suppressionError) {
          console.error("Suppression check failed — refusing to send", {
            error: suppressionError,
            recipient_redacted: redactEmail$1(effectiveRecipient)
          });
          return Response.json(
            { error: "Failed to verify suppression status" },
            { status: 500 }
          );
        }
        if (suppressed) {
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "suppressed"
          });
          console.log("Email suppressed", {
            templateName,
            recipient_redacted: redactEmail$1(effectiveRecipient)
          });
          return Response.json({ success: false, reason: "email_suppressed" });
        }
        const normalizedEmail = effectiveRecipient.toLowerCase();
        let unsubscribeToken;
        const { data: existingToken, error: tokenLookupError } = await supabase2.from("email_unsubscribe_tokens").select("token, used_at").eq("email", normalizedEmail).maybeSingle();
        if (tokenLookupError) {
          console.error("Token lookup failed", {
            error: tokenLookupError,
            email_redacted: redactEmail$1(normalizedEmail)
          });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "failed",
            error_message: "Failed to look up unsubscribe token"
          });
          return Response.json(
            { error: "Failed to prepare email" },
            { status: 500 }
          );
        }
        if (existingToken && !existingToken.used_at) {
          unsubscribeToken = existingToken.token;
        } else if (!existingToken) {
          unsubscribeToken = generateToken$1();
          const { error: tokenError } = await supabase2.from("email_unsubscribe_tokens").upsert(
            { token: unsubscribeToken, email: normalizedEmail },
            { onConflict: "email", ignoreDuplicates: true }
          );
          if (tokenError) {
            console.error("Failed to create unsubscribe token", {
              error: tokenError
            });
            await supabase2.from("email_send_log").insert({
              message_id: messageId,
              template_name: templateName,
              recipient_email: effectiveRecipient,
              status: "failed",
              error_message: "Failed to create unsubscribe token"
            });
            return Response.json(
              { error: "Failed to prepare email" },
              { status: 500 }
            );
          }
          const { data: storedToken, error: reReadError } = await supabase2.from("email_unsubscribe_tokens").select("token").eq("email", normalizedEmail).maybeSingle();
          if (reReadError || !storedToken) {
            console.error("Failed to read back unsubscribe token after upsert", {
              error: reReadError,
              email_redacted: redactEmail$1(normalizedEmail)
            });
            await supabase2.from("email_send_log").insert({
              message_id: messageId,
              template_name: templateName,
              recipient_email: effectiveRecipient,
              status: "failed",
              error_message: "Failed to confirm unsubscribe token storage"
            });
            return Response.json(
              { error: "Failed to prepare email" },
              { status: 500 }
            );
          }
          unsubscribeToken = storedToken.token;
        } else {
          console.warn("Unsubscribe token already used but email not suppressed", {
            email_redacted: redactEmail$1(normalizedEmail)
          });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "suppressed",
            error_message: "Unsubscribe token used but email missing from suppressed list"
          });
          return Response.json({ success: false, reason: "email_suppressed" });
        }
        const renderProps = { ...templateData, unsubscribeToken };
        const element = React.createElement(template.component, renderProps);
        const html = await render(element);
        const plainText = await render(element, { plainText: true });
        const resolvedSubject = typeof template.subject === "function" ? template.subject(templateData) : template.subject;
        await supabase2.from("email_send_log").insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: effectiveRecipient,
          status: "pending"
        });
        const { error: enqueueError } = await supabase2.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: effectiveRecipient,
            from: `${SITE_NAME$2} <noreply@${FROM_DOMAIN$2}>`,
            sender_domain: SENDER_DOMAIN$2,
            subject: resolvedSubject,
            html,
            text: plainText,
            purpose: "transactional",
            label: templateName,
            idempotency_key: idempotencyKey,
            unsubscribe_token: unsubscribeToken,
            queued_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        if (enqueueError) {
          console.error("Failed to enqueue email", {
            error: enqueueError,
            templateName,
            recipient_redacted: redactEmail$1(effectiveRecipient)
          });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "failed",
            error_message: "Failed to enqueue email"
          });
          return Response.json(
            { error: "Failed to enqueue email" },
            { status: 500 }
          );
        }
        console.log("Transactional email enqueued", {
          templateName,
          recipient_redacted: redactEmail$1(effectiveRecipient)
        });
        return Response.json({ success: true, queued: true });
      }
    }
  }
});
const Route$z = createFileRoute("/lovable/email/transactional/preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace(/^Bearer\s+/i, "");
        if (token !== apiKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const templateNames = Object.keys(TEMPLATES);
        const results = [];
        for (const name of templateNames) {
          const entry = TEMPLATES[name];
          const displayName = entry.displayName || name;
          if (!entry.previewData) {
            results.push({
              templateName: name,
              displayName,
              subject: "",
              html: "",
              status: "preview_data_required"
            });
            continue;
          }
          try {
            const html = await render(
              React.createElement(entry.component, entry.previewData)
            );
            const resolvedSubject = typeof entry.subject === "function" ? entry.subject(entry.previewData) : entry.subject;
            results.push({
              templateName: name,
              displayName,
              subject: resolvedSubject,
              html,
              status: "ready"
            });
          } catch (err) {
            console.error("Failed to render template for preview", {
              template: name,
              error: err
            });
            results.push({
              templateName: name,
              displayName,
              subject: "",
              html: "",
              status: "render_failed",
              errorMessage: err instanceof Error ? err.message : String(err)
            });
          }
        }
        return Response.json({ templates: results });
      }
    }
  }
});
const MAX_RETRIES = 5;
const EMAILIT_FROM = "Pool Rental Near Me <noreply@poolrentalnearme.com>";
const EMAILIT_REPLY_TO = "support@poolrentalnearme.com";
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_SEND_DELAY_MS = 200;
const DEFAULT_AUTH_TTL_MINUTES = 15;
const DEFAULT_TRANSACTIONAL_TTL_MINUTES = 60;
function isRateLimited(error) {
  if (error && typeof error === "object" && "status" in error) {
    return error.status === 429;
  }
  return error instanceof Error && error.message.includes("429");
}
function isForbidden(error) {
  if (error && typeof error === "object" && "status" in error) {
    return error.status === 403;
  }
  return error instanceof Error && error.message.includes("403");
}
function getRetryAfterSeconds(error) {
  if (error && typeof error === "object" && "retryAfterSeconds" in error) {
    return error.retryAfterSeconds ?? 60;
  }
  return 60;
}
async function moveToDlq(supabase2, queue, msg, reason) {
  const payload = msg.message;
  await supabase2.from("email_send_log").insert({
    message_id: payload.message_id,
    template_name: payload.label || queue,
    recipient_email: payload.to,
    status: "dlq",
    error_message: reason
  });
  const { error } = await supabase2.rpc("move_to_dlq", {
    source_queue: queue,
    dlq_name: `${queue}_dlq`,
    message_id: msg.msg_id,
    payload
  });
  if (error) {
    console.error("Failed to move message to DLQ", { queue, msg_id: msg.msg_id, reason, error });
  }
}
const Route$y = createFileRoute("/lovable/email/queue/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.EMAILIT_API_KEY;
        const supabaseUrl = "https://ptfjspcphskifoseidut.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
          console.error("Missing required environment variables");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (token !== supabaseServiceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: state } = await supabase2.from("email_send_state").select("retry_after_until, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes").single();
        if (state?.retry_after_until && new Date(state.retry_after_until) > /* @__PURE__ */ new Date()) {
          return Response.json({ skipped: true, reason: "rate_limited" });
        }
        const batchSize = state?.batch_size ?? DEFAULT_BATCH_SIZE;
        const sendDelayMs = state?.send_delay_ms ?? DEFAULT_SEND_DELAY_MS;
        const ttlMinutes = {
          auth_emails: state?.auth_email_ttl_minutes ?? DEFAULT_AUTH_TTL_MINUTES,
          transactional_emails: state?.transactional_email_ttl_minutes ?? DEFAULT_TRANSACTIONAL_TTL_MINUTES
        };
        let totalProcessed = 0;
        for (const queue of ["auth_emails", "transactional_emails"]) {
          const { data: messages, error: readError } = await supabase2.rpc("read_email_batch", {
            queue_name: queue,
            batch_size: batchSize,
            vt: 30
          });
          if (readError) {
            console.error("Failed to read email batch", { queue, error: readError });
            continue;
          }
          if (!messages?.length) continue;
          const messageIds = Array.from(
            new Set(
              messages.map(
                (msg) => msg?.message?.message_id && typeof msg.message.message_id === "string" ? msg.message.message_id : null
              ).filter((id) => Boolean(id))
            )
          );
          const failedAttemptsByMessageId = /* @__PURE__ */ new Map();
          if (messageIds.length > 0) {
            const { data: failedRows, error: failedRowsError } = await supabase2.from("email_send_log").select("message_id").in("message_id", messageIds).eq("status", "failed");
            if (failedRowsError) {
              console.error("Failed to load failed-attempt counters", {
                queue,
                error: failedRowsError
              });
            } else {
              for (const row of failedRows ?? []) {
                const messageId = row?.message_id;
                if (typeof messageId !== "string" || !messageId) continue;
                failedAttemptsByMessageId.set(
                  messageId,
                  (failedAttemptsByMessageId.get(messageId) ?? 0) + 1
                );
              }
            }
          }
          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const payload = msg.message;
            const failedAttempts = payload?.message_id && typeof payload.message_id === "string" ? failedAttemptsByMessageId.get(payload.message_id) ?? 0 : msg.read_ct ?? 0;
            const queuedAt = payload.queued_at ?? msg.enqueued_at;
            if (queuedAt) {
              const ageMs = Date.now() - new Date(queuedAt).getTime();
              const maxAgeMs = ttlMinutes[queue] * 60 * 1e3;
              if (ageMs > maxAgeMs) {
                console.warn("Email expired (TTL exceeded)", {
                  queue,
                  msg_id: msg.msg_id,
                  queued_at: queuedAt,
                  ttl_minutes: ttlMinutes[queue]
                });
                await moveToDlq(supabase2, queue, msg, `TTL exceeded (${ttlMinutes[queue]} minutes)`);
                continue;
              }
            }
            if (failedAttempts >= MAX_RETRIES) {
              await moveToDlq(supabase2, queue, msg, `Max retries (${MAX_RETRIES}) exceeded (attempted ${failedAttempts} times)`);
              continue;
            }
            if (payload.message_id) {
              const { data: alreadySent } = await supabase2.from("email_send_log").select("id").eq("message_id", payload.message_id).eq("status", "sent").maybeSingle();
              if (alreadySent) {
                console.warn("Skipping duplicate send (already sent)", {
                  queue,
                  msg_id: msg.msg_id,
                  message_id: payload.message_id
                });
                const { error: dupDelError } = await supabase2.rpc("delete_email", {
                  queue_name: queue,
                  message_id: msg.msg_id
                });
                if (dupDelError) {
                  console.error("Failed to delete duplicate message from queue", { queue, msg_id: msg.msg_id, error: dupDelError });
                }
                continue;
              }
            }
            try {
              await sendViaEmailit({
                from: EMAILIT_FROM,
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
                replyTo: EMAILIT_REPLY_TO
              });
              await supabase2.from("email_send_log").insert({
                message_id: payload.message_id,
                template_name: payload.label || queue,
                recipient_email: payload.to,
                status: "sent"
              });
              const { error: delError } = await supabase2.rpc("delete_email", {
                queue_name: queue,
                message_id: msg.msg_id
              });
              if (delError) {
                console.error("Failed to delete sent message from queue", { queue, msg_id: msg.msg_id, error: delError });
              }
              totalProcessed++;
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              console.error("Email send failed", {
                queue,
                msg_id: msg.msg_id,
                read_ct: msg.read_ct,
                failed_attempts: failedAttempts,
                error: errorMsg
              });
              if (isRateLimited(error)) {
                await supabase2.from("email_send_log").insert({
                  message_id: payload.message_id,
                  template_name: payload.label || queue,
                  recipient_email: payload.to,
                  status: "failed",
                  error_message: errorMsg.slice(0, 1e3)
                });
                const retryAfterSecs = getRetryAfterSeconds(error);
                await supabase2.from("email_send_state").update({
                  retry_after_until: new Date(
                    Date.now() + retryAfterSecs * 1e3
                  ).toISOString(),
                  updated_at: (/* @__PURE__ */ new Date()).toISOString()
                }).eq("id", 1);
                return Response.json({ processed: totalProcessed, stopped: "rate_limited" });
              }
              if (isForbidden(error)) {
                await moveToDlq(supabase2, queue, msg, errorMsg.slice(0, 1e3));
                return Response.json({ processed: totalProcessed, stopped: "forbidden" });
              }
              await supabase2.from("email_send_log").insert({
                message_id: payload.message_id,
                template_name: payload.label || queue,
                recipient_email: payload.to,
                status: "failed",
                error_message: errorMsg.slice(0, 1e3)
              });
              if (payload?.message_id && typeof payload.message_id === "string") {
                failedAttemptsByMessageId.set(payload.message_id, failedAttempts + 1);
              }
            }
            if (i < messages.length - 1) {
              await new Promise((r) => setTimeout(r, sendDelayMs));
            }
          }
        }
        return Response.json({ processed: totalProcessed });
      }
    }
  }
});
const DEFAULT_BRANDING = {
  site_name: "fresh-web",
  sender_name: "fresh-web",
  logo_url: null,
  primary_color: "#000000",
  primary_text_color: "#ffffff",
  footer_text: null
};
async function loadEmailBranding() {
  const {
    data,
    error
  } = await supabaseAdmin.from("email_branding").select("site_name, sender_name, logo_url, primary_color, primary_text_color, footer_text").eq("id", 1).maybeSingle();
  if (error || !data) return DEFAULT_BRANDING;
  return {
    ...DEFAULT_BRANDING,
    ...data
  };
}
const getEmailBranding = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("6fa876458b59315b8310895746df89279bc4859d10dc62900c6fbe62a958e791"));
const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color");
const UpdateSchema = z.object({
  site_name: z.string().min(1).max(120),
  sender_name: z.string().min(1).max(120),
  logo_url: z.string().url().max(500).nullable().or(z.literal("").transform(() => null)),
  primary_color: HexColor,
  primary_text_color: HexColor,
  footer_text: z.string().max(500).nullable().or(z.literal("").transform(() => null))
});
const updateEmailBranding = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => UpdateSchema.parse(data)).handler(createSsrRpc("d120ac3644f89dbf72c968cee435af07316f838a8b6393fecd2faf4a9d4fe6c3"));
const previewAuthEmail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  type: z.string()
}).parse(data)).handler(createSsrRpc("ea699fac7c9b1dc6ded35057d44edc2d5cc0995b6989313865436a8c98617741"));
const EMAIL_SUBJECTS = {
  signup: "Confirm your email",
  invite: "You've been invited",
  magiclink: "Your login link",
  recovery: "Reset your password",
  email_change: "Confirm your new email",
  reauthentication: "Your verification code"
};
const EMAIL_TEMPLATES$1 = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail
};
const SENDER_DOMAIN$1 = "poolrentalnearme.com";
const ROOT_DOMAIN = "poolrentalnearme.com";
const FROM_DOMAIN$1 = "poolrentalnearme.com";
const FROM_LOCAL = "derek";
function redactEmail(email) {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}
const Route$x = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          console.error("LOVABLE_API_KEY not configured");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        let payload;
        let run_id = "";
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseEmailWebhookPayload
          });
          payload = verified.payload;
          run_id = payload.run_id;
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case "invalid_signature":
              case "missing_timestamp":
              case "invalid_timestamp":
              case "stale_timestamp":
                console.error("Invalid webhook signature", { error: error.message });
                return Response.json(
                  { error: "Invalid signature" },
                  { status: 401 }
                );
              case "invalid_payload":
              case "invalid_json":
                console.error("Invalid webhook payload", { error: error.message });
                return Response.json(
                  { error: "Invalid webhook payload" },
                  { status: 400 }
                );
            }
          }
          console.error("Webhook verification failed", { error });
          return Response.json(
            { error: "Invalid webhook payload" },
            { status: 400 }
          );
        }
        if (!run_id) {
          console.error("Webhook payload missing run_id");
          return Response.json(
            { error: "Invalid webhook payload" },
            { status: 400 }
          );
        }
        if (payload.version !== "1") {
          console.error("Unsupported payload version", { version: payload.version, run_id });
          return Response.json(
            { error: `Unsupported payload version: ${payload.version}` },
            { status: 400 }
          );
        }
        const emailType = payload.data.action_type;
        console.log("Received auth event", {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          run_id
        });
        const EmailTemplate = EMAIL_TEMPLATES$1[emailType];
        if (!EmailTemplate) {
          console.error("Unknown email type", { emailType, run_id });
          return Response.json(
            { error: `Unknown email type: ${emailType}` },
            { status: 400 }
          );
        }
        const brandingRow = await loadEmailBranding();
        const branding = {
          siteName: brandingRow.site_name,
          senderName: brandingRow.sender_name,
          logoUrl: brandingRow.logo_url,
          primaryColor: brandingRow.primary_color,
          primaryTextColor: brandingRow.primary_text_color,
          footerText: brandingRow.footer_text
        };
        const templateProps = {
          siteName: branding.siteName,
          siteUrl: `https://${ROOT_DOMAIN}`,
          recipient: payload.data.email,
          confirmationUrl: payload.data.url,
          token: payload.data.token,
          email: payload.data.email,
          oldEmail: payload.data.old_email,
          newEmail: payload.data.new_email,
          branding
        };
        const element = React.createElement(EmailTemplate, templateProps);
        const html = await render(element);
        const text = await render(element, { plainText: true });
        const supabaseUrl = "https://ptfjspcphskifoseidut.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          console.error("Missing Supabase environment variables");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const messageId = crypto.randomUUID();
        await supabase2.from("email_send_log").insert({
          message_id: messageId,
          template_name: emailType,
          recipient_email: payload.data.email,
          status: "pending"
        });
        const { error: enqueueError } = await supabase2.rpc("enqueue_email", {
          queue_name: "auth_emails",
          payload: {
            run_id,
            message_id: messageId,
            to: payload.data.email,
            from: `${branding.senderName} <${FROM_LOCAL}@${FROM_DOMAIN$1}>`,
            sender_domain: SENDER_DOMAIN$1,
            subject: EMAIL_SUBJECTS[emailType] || "Notification",
            html,
            text,
            purpose: "transactional",
            label: emailType,
            queued_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        if (enqueueError) {
          console.error("Failed to enqueue auth email", { error: enqueueError, run_id, emailType });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: payload.data.email,
            status: "failed",
            error_message: "Failed to enqueue email"
          });
          return Response.json(
            { error: "Failed to enqueue email" },
            { status: 500 }
          );
        }
        console.log("Auth email enqueued", {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          run_id
        });
        return Response.json({ success: true, queued: true });
      }
    }
  }
});
const EMAIL_TEMPLATES = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail
};
const SITE_NAME$1 = "fresh-web";
const SAMPLE_PROJECT_URL = "https://fresh-web.lovable.app";
const SAMPLE_EMAIL = "user@example.test";
const SAMPLE_DATA = {
  signup: {
    siteName: SITE_NAME$1,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  magiclink: {
    siteName: SITE_NAME$1,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  recovery: {
    siteName: SITE_NAME$1,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  invite: {
    siteName: SITE_NAME$1,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  email_change: {
    siteName: SITE_NAME$1,
    oldEmail: SAMPLE_EMAIL,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  reauthentication: {
    token: "123456"
  }
};
const Route$w = createFileRoute("/lovable/email/auth/preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        let type;
        try {
          const body = await request.json();
          type = body.type;
        } catch {
          return Response.json(
            { error: "Invalid JSON in request body" },
            { status: 400 }
          );
        }
        const EmailTemplate = EMAIL_TEMPLATES[type];
        if (!EmailTemplate) {
          return Response.json(
            { error: `Unknown email type: ${type}` },
            { status: 400 }
          );
        }
        const brandingRow = await loadEmailBranding();
        const branding = {
          siteName: brandingRow.site_name,
          senderName: brandingRow.sender_name,
          logoUrl: brandingRow.logo_url,
          primaryColor: brandingRow.primary_color,
          primaryTextColor: brandingRow.primary_text_color,
          footerText: brandingRow.footer_text
        };
        const sampleData = { ...SAMPLE_DATA[type] || {}, siteName: branding.siteName, branding };
        const html = await render(React.createElement(EmailTemplate, sampleData));
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
    }
  }
});
const STOP_WORDS = /* @__PURE__ */ new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);
const START_WORDS = /* @__PURE__ */ new Set(["start", "unstop", "yes"]);
const HELP_WORDS = /* @__PURE__ */ new Set(["help", "info"]);
function verifyTwilioSignature(authToken, url, params, signature) {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const k of sortedKeys) data += k + params[k];
  const expected = createHmac$1("sha1", authToken).update(data).digest("base64");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual$1(a, b);
  } catch {
    return false;
  }
}
function twiml(message) {
  const body = message ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>` : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" }
  });
}
function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
}
const Route$v = createFileRoute("/api/public/hooks/twilio-inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const params = {};
        for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!authToken) {
          console.error("[twilio-inbound] TWILIO_AUTH_TOKEN not set");
          return new Response("Server misconfigured", { status: 500 });
        }
        const signature = request.headers.get("x-twilio-signature") ?? "";
        const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
        const fwdHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
        const path = new URL(request.url).pathname + new URL(request.url).search;
        const fullUrl = `${fwdProto}://${fwdHost}${path}`;
        if (!signature || !verifyTwilioSignature(authToken, fullUrl, params, signature)) {
          return new Response("Invalid signature", { status: 403 });
        }
        const fromRaw = params["From"] ?? "";
        const to = params["To"] ?? "";
        const body = (params["Body"] ?? "").trim();
        const sid = params["MessageSid"] ?? "";
        const fromE164 = toE164(fromRaw) ?? fromRaw;
        const keyword = body.toLowerCase().replace(/[^a-z]/g, "");
        let action = "received";
        let reply;
        if (STOP_WORDS.has(keyword)) {
          await recordOptOut(fromE164, "inbound_stop");
          action = "opt_out";
          reply = "You're opted out of Pool Rental Near Me messages. Reply START to opt back in.";
        } else if (START_WORDS.has(keyword)) {
          await recordOptIn(fromE164);
          action = "opt_in";
          reply = "You're opted back in to Pool Rental Near Me messages. Reply STOP anytime to opt out.";
        } else if (HELP_WORDS.has(keyword)) {
          action = "help";
          reply = "Pool Rental Near Me: hosting support. Msg&data rates may apply. Reply STOP to opt out. hello@poolrentalnearme.com";
        }
        await supabaseAdmin.from("sms_inbound_log").insert({
          from_phone: fromE164,
          to_phone: to,
          body,
          twilio_sid: sid,
          action
        });
        return twiml(reply);
      }
    }
  }
});
let vaultToken = null;
let lastFetch = 0;
let inflight = null;
const TTL_MS = 5 * 6e4;
function refreshVaultToken() {
  if (inflight) return;
  inflight = (async () => {
    try {
      const { data } = await supabaseAdmin.rpc("get_hooks_admin_token");
      if (data) {
        vaultToken = String(data);
        lastFetch = Date.now();
      }
    } catch {
    } finally {
      inflight = null;
    }
  })();
}
async function authorizeHookRequest(request) {
  const envExpected = process.env.HOOKS_ADMIN_TOKEN || process.env.BACKFILL_ADMIN_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const provided = request.headers.get("x-admin-token") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || new URL(request.url).searchParams.get("token");
  if (Date.now() - lastFetch > TTL_MS) refreshVaultToken();
  if (!provided) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (envExpected && provided === envExpected) return null;
  if (!vaultToken && inflight) {
    try {
      await inflight;
    } catch {
    }
  }
  if (vaultToken && provided === vaultToken) return null;
  if (!envExpected && !vaultToken) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured: no hook admin token set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
refreshVaultToken();
async function run$6(request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const result = await syncSharetribeMirror();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("[sync-sharetribe-mirror]", e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
const Route$u = createFileRoute("/api/public/hooks/sync-sharetribe-mirror")({
  server: {
    handlers: {
      GET: async ({ request }) => run$6(request),
      POST: async ({ request }) => run$6(request)
    }
  }
});
async function handle(request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  const result = await runListingSync();
  return new Response(JSON.stringify(result), {
    status: result.status === "success" ? 200 : 500,
    headers: { "Content-Type": "application/json" }
  });
}
const Route$t = createFileRoute("/api/public/hooks/sync-listings")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request)
    }
  }
});
const LEAD_ACTIVE_HOSTS = 5;
const CAPTAIN_30D_GMV_CENTS = 1e6;
const ACTIVE_WINDOW_DAYS = 60;
async function recomputeAffiliateTier(affiliateId) {
  const {
    supabaseAdmin: supabaseAdmin2
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data: aff
  } = await supabaseAdmin2.from("affiliates").select("id,tier,tier_override").eq("id", affiliateId).maybeSingle();
  if (!aff) return "starter";
  if (aff.tier_override) return aff.tier;
  const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 864e5).toISOString();
  const {
    data: refs
  } = await supabaseAdmin2.from("affiliate_referrals").select("id,completed_bookings_count,last_booking_at,total_gross_cents").eq("affiliate_id", affiliateId);
  const activeHosts = (refs || []).filter((r) => (r.completed_bookings_count ?? 0) >= 3 && r.last_booking_at && r.last_booking_at >= activeCutoff).length;
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const {
    data: recent
  } = await supabaseAdmin2.from("affiliate_commissions").select("booking_gross_cents,kind").eq("affiliate_id", affiliateId).eq("kind", "recurring").gte("booking_date", since30);
  const gmv30 = (recent || []).reduce((s, c) => s + (c.booking_gross_cents || 0), 0);
  let newTier = "starter";
  if (activeHosts >= LEAD_ACTIVE_HOSTS) newTier = "lead";
  if (newTier === "lead" && gmv30 >= CAPTAIN_30D_GMV_CENTS) newTier = "captain";
  if (newTier !== aff.tier) {
    await supabaseAdmin2.from("affiliates").update({
      tier: newTier,
      tier_set_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", affiliateId);
  }
  return newTier;
}
const setAffiliateTierOverride = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  affiliate_id: z.string().uuid(),
  tier: z.enum(["starter", "lead", "captain"]),
  override: z.boolean()
}).parse(d)).handler(createSsrRpc("2d8388ffca0b3f985380529ec4df68811129eddbadb29f9c36c72e0da54b3cc4"));
const COMMISSION_RATE = 0.05;
const ACTIVATION_BONUS_CENTS = 1e4;
const ACTIVATION_BOOKING = 1;
const RECURRING_UNLOCK_AT = 3;
const REFUND_WINDOW_DAYS = 7;
const DORMANT_PAUSE_DAYS = 60;
function unwrapId(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "uuid" in v) return String(v.uuid);
  return null;
}
async function syncAffiliateCommissions() {
  const errors = [];
  const { data: latest } = await supabaseAdmin.from("affiliate_commissions").select("booking_date").order("booking_date", { ascending: false }).limit(1).maybeSingle();
  const sinceDate = latest?.booking_date ? new Date(new Date(latest.booking_date).getTime() - 2 * 864e5) : new Date(Date.now() - 90 * 864e5);
  const since = sinceDate.toISOString();
  let scanned = 0;
  let matched = 0;
  let inserted_activation = 0;
  let inserted_recurring = 0;
  let skipped_dormant = 0;
  let page = 1;
  const perPage = 100;
  let pages = 0;
  const touchedAffiliates = /* @__PURE__ */ new Set();
  while (page <= 50) {
    pages = page;
    let resp;
    try {
      resp = await integrationGet("/transactions/query", {
        lastTransition: "transition/complete",
        lastTransitionedAtStart: since,
        include: "provider,listing",
        page,
        perPage
      });
    } catch (e) {
      errors.push(`page ${page}: ${e.message}`);
      break;
    }
    const txs = resp.data || [];
    if (!txs.length) break;
    scanned += txs.length;
    const listingTitles = /* @__PURE__ */ new Map();
    for (const inc of resp.included || []) {
      if (inc.type === "listing") {
        const id = unwrapId(inc.id);
        if (id && inc.attributes?.title) listingTitles.set(id, inc.attributes.title);
      }
    }
    const providerIds = Array.from(
      new Set(txs.map((t) => unwrapId(t.relationships?.provider?.data?.id)).filter((x) => !!x))
    );
    if (providerIds.length) {
      const { data: refs } = await supabaseAdmin.from("affiliate_referrals").select(
        "id,affiliate_id,sharetribe_user_id,first_booking_at,completed_bookings_count,activation_paid_at,recurring_unlocked_at,last_booking_at,total_gross_cents"
      ).in("sharetribe_user_id", providerIds);
      const refByHost = /* @__PURE__ */ new Map();
      for (const r of refs || []) refByHost.set(r.sharetribe_user_id, r);
      const sorted = [...txs].sort((a, b) => {
        const ad = a.attributes.lastTransitionedAt || a.attributes.createdAt || "";
        const bd = b.attributes.lastTransitionedAt || b.attributes.createdAt || "";
        return ad.localeCompare(bd);
      });
      for (const tx of sorted) {
        const providerId = unwrapId(tx.relationships?.provider?.data?.id);
        if (!providerId) continue;
        const ref = refByHost.get(providerId);
        if (!ref) continue;
        matched++;
        const txId = unwrapId(tx.id);
        if (!txId) continue;
        const { data: existing } = await supabaseAdmin.from("affiliate_commissions").select("id").eq("sharetribe_tx_id", txId).maybeSingle();
        if (existing) continue;
        const gross = tx.attributes.payinTotal?.amount ?? 0;
        const currency = tx.attributes.payinTotal?.currency || "USD";
        const bookingDate = tx.attributes.lastTransitionedAt || tx.attributes.createdAt || (/* @__PURE__ */ new Date()).toISOString();
        const listingId = unwrapId(tx.relationships?.listing?.data?.id);
        const listingTitle = listingId && listingTitles.get(listingId) || null;
        const nextCount = (ref.completed_bookings_count ?? 0) + 1;
        let kind = null;
        let commissionCents = 0;
        if (nextCount === ACTIVATION_BOOKING) {
          kind = "activation_bonus";
          commissionCents = ACTIVATION_BONUS_CENTS;
        } else if (nextCount >= RECURRING_UNLOCK_AT) {
          kind = "recurring";
          commissionCents = Math.round(gross * COMMISSION_RATE);
        }
        if (kind) {
          const { error: insErr } = await supabaseAdmin.from("affiliate_commissions").insert({
            affiliate_id: ref.affiliate_id,
            referral_id: ref.id,
            sharetribe_tx_id: txId,
            host_user_id: providerId,
            listing_id: listingId,
            listing_title: listingTitle,
            booking_gross_cents: gross,
            commission_cents: commissionCents,
            currency,
            booking_date: bookingDate,
            status: "pending",
            kind
          });
          if (insErr) {
            errors.push(`insert ${txId}: ${insErr.message}`);
            continue;
          }
          if (kind === "activation_bonus") inserted_activation++;
          else inserted_recurring++;
          touchedAffiliates.add(ref.affiliate_id);
        }
        const update = {
          completed_bookings_count: nextCount,
          last_booking_at: bookingDate,
          total_gross_cents: (ref.total_gross_cents ?? 0) + gross
        };
        if (!ref.first_booking_at) update.first_booking_at = bookingDate;
        if (nextCount === ACTIVATION_BOOKING && !ref.activation_paid_at) update.activation_paid_at = bookingDate;
        if (nextCount >= RECURRING_UNLOCK_AT && !ref.recurring_unlocked_at) update.recurring_unlocked_at = bookingDate;
        await supabaseAdmin.from("affiliate_referrals").update(update).eq("id", ref.id);
        Object.assign(ref, update);
      }
    }
    const totalPages = resp.meta?.totalPages ?? page;
    if (page >= totalPages) break;
    page++;
  }
  const cutoff = new Date(Date.now() - REFUND_WINDOW_DAYS * 864e5).toISOString();
  const { count: approved } = await supabaseAdmin.from("affiliate_commissions").update({ status: "approved" }, { count: "exact" }).eq("status", "pending").lt("booking_date", cutoff);
  for (const aid of touchedAffiliates) {
    try {
      await recomputeAffiliateTier(aid);
    } catch (e) {
      errors.push(`tier recompute ${aid}: ${e.message}`);
    }
  }
  const dormantCutoff = new Date(Date.now() - DORMANT_PAUSE_DAYS * 864e5).toISOString();
  const { count: dormantCount } = await supabaseAdmin.from("affiliate_referrals").select("id", { count: "exact", head: true }).lt("last_booking_at", dormantCutoff).gte("completed_bookings_count", RECURRING_UNLOCK_AT);
  skipped_dormant = dormantCount || 0;
  return {
    scanned,
    matched,
    inserted_activation,
    inserted_recurring,
    skipped_dormant,
    approved: approved || 0,
    pages,
    since,
    errors
  };
}
async function run$5(request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const result = await syncAffiliateCommissions();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("[sync-affiliate-commissions]", e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
const Route$s = createFileRoute("/api/public/hooks/sync-affiliate-commissions")({
  server: {
    handlers: {
      GET: async ({ request }) => run$5(request),
      POST: async ({ request }) => run$5(request)
    }
  }
});
const Route$r = createFileRoute("/api/public/hooks/sms-sender")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        const { data: due, error } = await supabaseAdmin.from("sms_messages").select("id, phone_e164, body, lead_id").eq("status", "pending").lte("scheduled_at", nowIso).order("scheduled_at", { ascending: true }).limit(50);
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
        const results = [];
        for (const msg of due ?? []) {
          if (await isOptedOut(msg.phone_e164)) {
            await supabaseAdmin.from("sms_messages").update({ status: "cancelled", error: "opted_out" }).eq("id", msg.id);
            results.push({ id: msg.id, status: "cancelled" });
            continue;
          }
          const { sid, error: sendErr } = await sendSms(msg.phone_e164, msg.body);
          if (sendErr) {
            await supabaseAdmin.from("sms_messages").update({ status: "failed", error: sendErr }).eq("id", msg.id);
            results.push({ id: msg.id, status: "failed", error: sendErr });
          } else {
            await supabaseAdmin.from("sms_messages").update({ status: "sent", sent_at: (/* @__PURE__ */ new Date()).toISOString(), twilio_sid: sid ?? null }).eq("id", msg.id);
            results.push({ id: msg.id, status: "sent", sid });
          }
        }
        return new Response(
          JSON.stringify({ ok: true, processed: results.length, results }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }
});
const UA = "Mozilla/5.0 (compatible; PoolRentalNearMeBot/1.0; +https://www.poolrentalnearme.com)";
async function fetchSitemapUrls$1(sitemapUrl, depth = 0) {
  if (depth > 2) return [];
  const res = await fetch(sitemapUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Sitemap fetch ${res.status}`);
  const xml = await res.text();
  const locs = Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)).map((m) => m[1]);
  if (/<sitemapindex/i.test(xml)) {
    const out = [];
    for (const child of locs.slice(0, 10)) {
      try {
        out.push(...await fetchSitemapUrls$1(child, depth + 1));
      } catch {
      }
    }
    return out;
  }
  return locs;
}
async function runRadar() {
  const sb = supabaseAdmin;
  const { count: before } = await sb.from("competitor_urls").select("*", { count: "exact", head: true });
  const { data: sites } = await sb.from("competitor_sites").select("*").eq("is_active", true);
  const results = [];
  for (const site of sites || []) {
    try {
      const urls = await fetchSitemapUrls$1(site.sitemap_url);
      const unique = Array.from(new Set(urls)).slice(0, 1e4);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { data: existing } = await sb.from("competitor_urls").select("url").eq("site_id", site.id);
      const existingSet = new Set((existing || []).map((r) => r.url));
      const newOnes = unique.filter((u) => !existingSet.has(u));
      if (newOnes.length) {
        await sb.from("competitor_urls").insert(
          newOnes.map((url) => ({ site_id: site.id, url, first_seen_at: now, last_seen_at: now }))
        );
      }
      await sb.from("competitor_sites").update({ last_checked_at: now, last_url_count: unique.length }).eq("id", site.id);
      results.push({ domain: site.domain, new_count: newOnes.length, total: unique.length });
    } catch (e) {
      results.push({ domain: site.domain, error: e?.message });
    }
  }
  const { count: after } = await sb.from("competitor_urls").select("*", { count: "exact", head: true });
  return { before, after, delta: (after || 0) - (before || 0), results };
}
async function runSerp() {
  const sb = supabaseAdmin;
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) return { error: "FIRECRAWL_API_KEY missing" };
  const { count: before } = await sb.from("serp_rankings").select("*", { count: "exact", head: true });
  const { data: kws } = await sb.from("tracked_keywords").select("*").eq("is_active", true).order("last_checked_at", { ascending: true, nullsFirst: true }).limit(2);
  const results = [];
  for (const kw of kws || []) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(kw.keyword)}&gl=${kw.market || "us"}&num=100`;
      const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: searchUrl, formats: ["html"], onlyMainContent: false })
      });
      if (!resp.ok) {
        results.push({ keyword: kw.keyword, error: `FC ${resp.status}` });
        continue;
      }
      const json = await resp.json();
      const html = json?.data?.html || json?.html || "";
      const urlMatches = Array.from(html.matchAll(/href="(https?:\/\/[^"]+)"/g)).map((m) => m[1]);
      const seen = /* @__PURE__ */ new Set();
      const ordered = [];
      for (const u of urlMatches) {
        if (u.includes("google.com") || u.includes("/search?") || u.includes("webcache.")) continue;
        if (seen.has(u)) continue;
        seen.add(u);
        ordered.push(u);
      }
      let position = null;
      let urlFound = null;
      for (let i = 0; i < ordered.length; i++) {
        if (ordered[i].includes("poolrentalnearme.com")) {
          position = i + 1;
          urlFound = ordered[i];
          break;
        }
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await sb.from("serp_rankings").insert({ keyword_id: kw.id, position, url_found: urlFound, checked_at: now });
      await sb.from("tracked_keywords").update({
        previous_position: kw.last_position,
        last_position: position,
        last_checked_at: now
      }).eq("id", kw.id);
      results.push({ keyword: kw.keyword, position, sample_results: ordered.length });
    } catch (e) {
      results.push({ keyword: kw.keyword, error: e?.message });
    }
  }
  const { count: after } = await sb.from("serp_rankings").select("*", { count: "exact", head: true });
  return { before, after, delta: (after || 0) - (before || 0), results };
}
async function runAudit() {
  const sb = supabaseAdmin;
  const lovKey = process.env.LOVABLE_API_KEY;
  if (!lovKey) return { error: "LOVABLE_API_KEY missing" };
  const { count: before } = await sb.from("page_audits").select("*", { count: "exact", head: true });
  const { data: page } = await sb.from("content_pages").select("url_path, title, seo_description, body_markdown").not("body_markdown", "is", null).not("url_path", "is", null).limit(1).maybeSingle();
  if (!page) return { error: "No content page found to audit" };
  const ourBody = (page.body_markdown || "").slice(0, 6e3);
  const prompt = `You are an SEO auditor. Score this page 0-100 and return STRICT JSON:
{"score": <0-100>, "summary": "<one sentence>", "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."]}

Page URL: ${page.url_path}
Title: ${page.title || "(none)"}
Description: ${page.seo_description || "(none)"}
Body (truncated):
${ourBody}

Return ONLY JSON, no markdown fences.`;
  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "user", content: prompt }] })
  });
  if (!aiResp.ok) return { error: `AI ${aiResp.status}: ${(await aiResp.text()).slice(0, 200)}` };
  const aiJson = await aiResp.json();
  const content = aiJson?.choices?.[0]?.message?.content || "";
  const cleaned = content.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { error: "non-JSON", raw: content.slice(0, 200) };
  }
  const { data: row, error } = await sb.from("page_audits").insert({
    url_path: page.url_path,
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    summary: String(parsed.summary || "").slice(0, 1e3),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 20) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 20) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 20) : []
  }).select("id, url_path, score, summary").maybeSingle();
  if (error) return { error: error.message };
  const { count: after } = await sb.from("page_audits").select("*", { count: "exact", head: true });
  return { before, after, delta: (after || 0) - (before || 0), audit: row };
}
async function runAll() {
  const radar = await runRadar();
  const serp = await runSerp();
  const audit = await runAudit();
  return { ok: true, radar, serp, audit, ran_at: (/* @__PURE__ */ new Date()).toISOString() };
}
const Route$q = createFileRoute("/api/public/hooks/seo-self-test")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        return Response.json(await runAll());
      },
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        return Response.json(await runAll());
      }
    }
  }
});
const ISSUE_KINDS = ["thin", "empty", "missing_meta", "title_is_slug"];
const listSeoIssues = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  kind: z.enum(ISSUE_KINDS),
  limit: z.number().int().min(1).max(500).default(100)
}).parse(d)).handler(createSsrRpc("fc02a41f5ec37438ca69db0567d5ed6f96222b6b644e33140bf345903f39e4e4"));
const listLeads = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["all", "new", "contacted", "closed"]).default("all"),
  limit: z.number().int().min(1).max(500).default(100)
}).parse(d ?? {})).handler(createSsrRpc("165714cf7e1003bb06d266765590a7b3c3922ded0d88c53e75de27700059bca4"));
const updateLeadStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "closed"])
}).parse(d)).handler(createSsrRpc("1bc5e7a88df293520aa9f613a33b0ec55e8d9947f55613bf63763e5d2567e093"));
const listContentPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  q: z.string().max(200).default(""),
  status: z.enum(["all", "published", "pending", "draft", "scraped"]).default("all"),
  template: z.string().max(80).default(""),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(1e3).default(50)
}).parse(d ?? {})).handler(createSsrRpc("6f854ea9a97838e7b6fa3eee3f72bdd86b1a844d15f2d149cf69b667a0ee59a3"));
const bulkUpdateContentPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(["publish", "unpublish", "delete"])
}).parse(d)).handler(createSsrRpc("e8142dacd605cc6d45e8796883a52e6e0c95fd4c5c4c3b8e2bee1bfe7a5ebaa1"));
const getIndexingStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("8604f1e01566d19935905d0bad5929550c0caaf1aea7fe528d4b409785da1cf5"));
const SEO_SYSTEM = `
You write SEO + brand content for Pool Rental Near Me (PRNM), a marketplace where homeowners rent out private pools by the hour.
Differentiators (mention naturally): 10% flat host fee (vs Swimply's 15%+), $2M liability insurance included.
Voice: confident, friendly, host-first. Short paragraphs. Real, useful copy. No filler. Sentence case headings. No em dashes.
Format: Markdown only. Use ## and ### headings. Include 3-5 internal links from this set where relevant:
  /s, /p/hosting, /p/all-locations, /p/earnings-calculator, /p/how-it-works
List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details
Always end with a short CTA paragraph linking to the List Your Pool URL or /s.
Return your answer ONLY by calling the write_page tool.
`.trim();
const SEO_TOOL = {
  type: "function",
  function: {
    name: "write_page",
    description: "Return the repaired page content.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Human-readable H1 title (case-correct, no slug-style)"
        },
        seo_title: {
          type: "string",
          description: "<=60 chars"
        },
        seo_description: {
          type: "string",
          description: "<=155 chars, compelling meta description"
        },
        body_markdown: {
          type: "string",
          description: "Full markdown body, 800-1200 words, no frontmatter"
        }
      },
      required: ["title", "seo_title", "seo_description", "body_markdown"],
      additionalProperties: false
    }
  }
};
function humanizeSlug(slug) {
  return slug.replace(/^\/p\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
async function runSeoFix(pageId, mode) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return {
    ok: false,
    error: "LOVABLE_API_KEY not configured"
  };
  const {
    data: page,
    error: pErr
  } = await supabaseAdmin.from("content_pages").select("id, url_path, slug, title, seo_title, seo_description, body_markdown, template_type, category").eq("id", pageId).maybeSingle();
  if (pErr || !page) return {
    ok: false,
    error: "Page not found"
  };
  const topic = humanizeSlug(page.url_path || page.slug || "");
  const currentBody = page.body_markdown || "";
  const wordCount = currentBody.split(/\s+/).filter(Boolean).length;
  let userPrompt = "";
  if (mode === "meta_only" || mode === "title_only") {
    userPrompt = `Generate ONLY a clean human-readable title and SEO title/description for this existing page.

URL: ${page.url_path}
Topic (derived from slug): ${topic}
Existing title: ${page.title || "(none)"}
Existing body excerpt (first 800 chars): ${currentBody.slice(0, 800)}

Produce:
- title: proper sentence-case H1 (NOT the slug)
- seo_title: <=60 chars, includes primary keyword
- seo_description: <=155 chars, compelling and specific

For body_markdown, return the EXISTING body unchanged.`;
  } else {
    const reason = wordCount === 0 ? "Page body is EMPTY — write fresh content." : wordCount < 500 ? `Page body is THIN (${wordCount} words) — expand to 800-1200 words while keeping any existing facts.` : "Improve the existing page.";
    userPrompt = `Repair this content page.

URL: ${page.url_path}
Topic (derived from slug): ${topic}
Existing title: ${page.title || "(none)"}
Issue: ${reason}
${currentBody ? `Existing body to expand/improve:
---
${currentBody.slice(0, 3e3)}
---` : ""}

Length: 800-1200 words. Use ## sections and ### sub-points. Strong opening, no fluff.`;
  }
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{
        role: "system",
        content: SEO_SYSTEM
      }, {
        role: "user",
        content: userPrompt
      }],
      tools: [SEO_TOOL],
      tool_choice: {
        type: "function",
        function: {
          name: "write_page"
        }
      }
    })
  });
  if (resp.status === 402) return {
    ok: false,
    error: "AI credits exhausted"
  };
  if (resp.status === 429) return {
    ok: false,
    error: "Rate limited — slow down"
  };
  if (!resp.ok) return {
    ok: false,
    error: `AI gateway ${resp.status}: ${(await resp.text()).slice(0, 200)}`
  };
  const json = await resp.json();
  const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) return {
    ok: false,
    error: "AI returned no tool call"
  };
  const gen = JSON.parse(tc.function.arguments);
  const update = {
    title: gen.title || page.title,
    seo_title: (gen.seo_title || page.seo_title || gen.title || "").slice(0, 70),
    seo_description: (gen.seo_description || page.seo_description || "").slice(0, 160),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (mode === "full" && gen.body_markdown && gen.body_markdown.length > 300) {
    update.body_markdown = gen.body_markdown;
    if (gen.body_markdown.length >= 1e3) {
      update.status = "published";
      update.in_sitemap = true;
    }
  }
  const {
    error: uErr
  } = await supabaseAdmin.from("content_pages").update(update).eq("id", pageId);
  if (uErr) return {
    ok: false,
    error: uErr.message
  };
  return {
    ok: true,
    newWords: (update.body_markdown || currentBody).split(/\s+/).filter(Boolean).length,
    newTitle: update.title
  };
}
const aiFixContentPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  mode: z.enum(["full", "meta_only", "title_only"]).default("full")
}).parse(d)).handler(createSsrRpc("8c6d7a29603e7ebdfeebdb0d73a7284fa51d359c5b8325f7ea010c3465ad4186"));
const enqueueSeoFixJobs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  pageIds: z.array(z.string().uuid()).min(1).max(500),
  mode: z.enum(["full", "meta_only", "title_only"]).default("full")
}).parse(d)).handler(createSsrRpc("b6c8d1cca1795d3b5f10935dfc421e26c998b4d8ffbf96b5fe08752fe4b218e2"));
const getSeoJobStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  batchId: z.string().uuid().optional(),
  pageIds: z.array(z.string().uuid()).max(500).optional()
}).parse(d ?? {})).handler(createSsrRpc("615bebc119f42ace95a0f884be2e85d9b7950d435b4c7fcb93ab59d2ee71564e"));
const processSeoFixQueue = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  batchId: z.string().uuid().optional(),
  max: z.number().int().min(1).max(25).default(10)
}).parse(d ?? {})).handler(createSsrRpc("3a9c3e11425028ed3fa4afa4be80282ac22267cf119a454c5f7a673576a51756"));
const cancelQueuedSeoJobs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  batchId: z.string().uuid()
}).parse(d)).handler(createSsrRpc("2ebcc13773815515ed8a0d1d37a7327d567434b61fab75f94af6de30d24e22b5"));
const listSeoBatches = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  sinceHours: z.number().int().min(1).max(720).default(72),
  onlyActive: z.boolean().default(false)
}).parse(d ?? {})).handler(createSsrRpc("b8fbb509d83b05d3892500a0bde0dfa83cf33106f8642cd0a57828fbcbb76a5c"));
const getSeoBatchDetails = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  batchId: z.string().uuid()
}).parse(d)).handler(createSsrRpc("4f826cd9a13b0c4c2d3026951d8805e0833343c7e802a3e128bc1ec8d1478260"));
const getContentPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("b9ca57870a2438c6117cca538d93f10c1257c32a22171da0cddc10494dd7c96e"));
const updateContentPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  title: z.string().max(300).optional(),
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(400).optional(),
  og_title: z.string().max(200).optional().nullable(),
  og_description: z.string().max(400).optional().nullable(),
  focus_keyword: z.string().max(120).optional().nullable(),
  canonical_override: z.string().max(500).optional().nullable(),
  hero_image_url: z.string().max(2e3).optional().nullable(),
  body_markdown: z.string().max(2e5).optional(),
  status: z.enum(["draft", "pending", "published"]).optional()
}).parse(d)).handler(createSsrRpc("16b0c0cb551c8dcedd95980594d532a00b189cb4338f3c3952a6901284fef8c0"));
const appendAiContentToPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  prompt: z.string().min(3).max(2e3),
  append: z.boolean().default(true)
}).parse(d)).handler(createSsrRpc("dc5b555f2796ebba8fac6a32a735f7032ce506c28749359f63b2f8dd43957ae4"));
const generateFullPageContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("6de3a256c0ef25fb47fd514317501ba6d4b1efd9bf05fe9e059082797240d557"));
const improvePageContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("952b6d9105bdc31d5634eff7a384cb52b3adc77598a92392b3651e7bef8e4da5"));
const generateSeoMeta = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("dce35cda167e7a9206ef18c1745df18e8007fc94feedcf95d9ef50fe59912b1c"));
const SECTION_PRESETS = [{
  key: "faq",
  label: "FAQ (5 questions)",
  prompt: "Write a 5-question FAQ section. Use ## FAQ as the heading and **bold** for each question. Tailor questions to this page's topic."
}, {
  key: "pricing_table",
  label: "Pricing table",
  prompt: "Add a pricing comparison section. Use a Markdown table with columns: Pool size, Typical hourly rate, Best for. Use realistic PRNM ranges ($40-150/hr)."
}, {
  key: "what_to_expect",
  label: "What to expect checklist",
  prompt: 'Add a "What to expect" section with a checklist of 6-8 items using `- [ ]` Markdown task list syntax, tailored to this page topic.'
}, {
  key: "landmarks",
  label: "Local landmarks (city pages)",
  prompt: "Add a 'Things to do nearby' section listing 5-7 well-known local landmarks, parks, or attractions for this city. Each as a bullet with a one-sentence note on why pool guests would care."
}, {
  key: "insurance",
  label: "Insurance & liability",
  prompt: "Add an 'Insurance and liability' section explaining PRNM's $2M liability coverage, what it covers, what it doesn't, and how it compares to Swimply."
}, {
  key: "host_tips",
  label: "Host tips & safety",
  prompt: "Add a 'Host tips and safety' section with 5 actionable tips a new pool host should follow before their first booking. Use a numbered list."
}, {
  key: "comparison",
  label: "PRNM vs Swimply",
  prompt: "Add a comparison section using a Markdown table with rows: Host fee, Liability insurance, Payout speed, Support, Listing approval time. Be factual and PRNM-favorable."
}, {
  key: "internal_links",
  label: "Related cities (auto)",
  prompt: "__INTERNAL_LINKS__"
}, {
  key: "testimonials",
  label: "Testimonials block",
  prompt: "Add a 'What hosts are saying' section with 3 short testimonial-style quotes (placeholder names like 'Sarah, host in [generic city]'). Mark clearly that they are placeholders so the admin can replace them."
}];
const generateSectionPreset = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  preset_key: z.string().min(1).max(50)
}).parse(d)).handler(createSsrRpc("6068228523749141a6362364ba27648f58de6667f777a0b25f3cadc80e7ecfa4"));
const listSectionPresets = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("b1f2572e4f0eb94cd91fc4ca3538d9903ff2d430b9c5de66ebdb6a802d31957a"));
const saveSectionPreset = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(80),
  prompt: z.string().min(5).max(4e3),
  sort_order: z.number().int().min(0).max(9999).default(0)
}).parse(d)).handler(createSsrRpc("76b039cb4e7cd7eaf76edc19df2ee2939b7eff460c2dc5e510ca63daf66a0a47"));
const deleteSectionPreset = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("56d900c7891fdc1b56cb3fc1a5f501dddd31cd460cdc4ee0804cb09210a34c3d"));
const generateCustomSection = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  preset_id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("124c50cc4aef51a5c466b46248cb3e0a375bfcd00bf4d41451bccb427990adf3"));
const autoFixSeo = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("d10a81f375ec19c033c2ef9462002cd90a5ac634c2afc8416dff4dde2c8073fe"));
const MAX_PER_INVOCATION = 5;
async function processBatch() {
  const sb = supabaseAdmin;
  const { data: jobs } = await sb.from("seo_fix_jobs").select("id, page_id, mode, attempts, max_attempts").eq("status", "queued").order("created_at", { ascending: true }).limit(MAX_PER_INVOCATION);
  const list = jobs || [];
  const results = [];
  for (const job of list) {
    const { data: claimed } = await sb.from("seo_fix_jobs").update({ status: "processing", started_at: (/* @__PURE__ */ new Date()).toISOString(), attempts: job.attempts + 1 }).eq("id", job.id).eq("status", "queued").select("id").maybeSingle();
    if (!claimed) continue;
    try {
      const res = await runSeoFix(job.page_id, job.mode);
      if (res.ok) {
        await sb.from("seo_fix_jobs").update({
          status: "done",
          result: res,
          finished_at: (/* @__PURE__ */ new Date()).toISOString(),
          error: null
        }).eq("id", job.id);
        results.push({ id: job.id, ok: true });
      } else {
        const giveUp = job.attempts + 1 >= job.max_attempts;
        await sb.from("seo_fix_jobs").update({
          status: giveUp ? "failed" : "queued",
          error: res.error,
          finished_at: giveUp ? (/* @__PURE__ */ new Date()).toISOString() : null
        }).eq("id", job.id);
        results.push({ id: job.id, ok: false, error: res.error });
      }
    } catch (e) {
      const giveUp = job.attempts + 1 >= job.max_attempts;
      await sb.from("seo_fix_jobs").update({
        status: giveUp ? "failed" : "queued",
        error: e?.message || "Worker exception",
        finished_at: giveUp ? (/* @__PURE__ */ new Date()).toISOString() : null
      }).eq("id", job.id);
      results.push({ id: job.id, ok: false, error: e?.message });
    }
  }
  return { processed: results.length, results };
}
const Route$p = createFileRoute("/api/public/hooks/seo-fix-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        return Response.json(await processBatch());
      },
      GET: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        return Response.json(await processBatch());
      }
    }
  }
});
async function run$4(request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const out = await sendDueEmails(25);
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
const Route$o = createFileRoute("/api/public/hooks/send-renter-emails")({
  server: {
    handlers: {
      GET: async ({ request }) => run$4(request),
      POST: async ({ request }) => run$4(request)
    }
  }
});
async function run$3(request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const out = await sendDueHostEmails(20);
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
const Route$n = createFileRoute("/api/public/hooks/send-host-drip-emails")({
  server: {
    handlers: {
      GET: async ({ request }) => run$3(request),
      POST: async ({ request }) => run$3(request)
    }
  }
});
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const SYSTEM_PROMPT = "You write SEO-optimized, factual long-form content for a pool services directory. Use second person, friendly founder-mentor tone. No banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge. No em dashes. Output valid JSON only.";
async function generateOne$1(p, apiKey) {
  try {
    const user = `Write content for ${p.name}${p.city ? ` in ${p.city}, ${p.state_code}` : ""}. Category: ${p.primary_category ?? "pool services"}. Services: ${(p.services ?? []).join(", ") || "general pool services"}. Existing description: ${p.description ?? "(none)"}.

Return JSON: { "long_description": string (700-900 words, markdown, no headings above h3), "faq": Array<{question:string,answer:string}> (5 items, locally relevant) }.`;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user }
        ],
        response_format: { type: "json_object" }
      })
    });
    if (r.status === 429) return { id: p.id, ok: false, error: "rate_limited" };
    if (r.status === 402) return { id: p.id, ok: false, error: "credits_exhausted" };
    if (!r.ok) return { id: p.id, ok: false, error: `gateway_${r.status}` };
    const j = await r.json();
    const raw = j.choices?.[0]?.message?.content ?? "{}";
    const content = JSON.parse(raw);
    if (!content.long_description || typeof content.long_description !== "string") {
      return { id: p.id, ok: false, error: "no_long_description" };
    }
    const { error } = await supabaseAdmin.from("providers").update({
      long_description: content.long_description,
      faq: Array.isArray(content.faq) ? content.faq : [],
      ai_content_generated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", p.id);
    if (error) return { id: p.id, ok: false, error: `db: ${error.message}` };
    return { id: p.id, ok: true };
  } catch (e) {
    return { id: p.id, ok: false, error: e?.message || String(e) };
  }
}
async function countRemaining() {
  const { count } = await supabaseAdmin.from("providers").select("id", { count: "exact", head: true }).eq("is_published", true).is("long_description", null);
  return count ?? 0;
}
const Route$m = createFileRoute("/api/public/hooks/provider-ai-worker")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const remaining = await countRemaining();
        return Response.json({ remaining });
      },
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "LOVABLE_API_KEY not configured" }, { status: 500 });
        }
        const url = new URL(request.url);
        const limitRaw = parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
        const limit = Math.max(1, Math.min(MAX_LIMIT, isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw));
        const { data: rows, error } = await supabaseAdmin.from("providers").select("id, name, city, state_code, primary_category, description, services").eq("is_published", true).is("long_description", null).order("updated_at", { ascending: true }).limit(limit);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        const targets = rows ?? [];
        if (targets.length === 0) {
          return Response.json({ attempted: 0, succeeded: 0, failed: 0, remaining: 0, results: [] });
        }
        const results = await Promise.all(targets.map((p) => generateOne$1(p, apiKey)));
        const succeeded = results.filter((r) => r.ok).length;
        const failed = results.length - succeeded;
        const remaining = await countRemaining();
        return Response.json({
          attempted: results.length,
          succeeded,
          failed,
          remaining,
          results
        });
      }
    }
  }
});
async function run$2(request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const out = await pollSharetribeRenters();
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
const Route$l = createFileRoute("/api/public/hooks/poll-sharetribe-renters")({
  server: {
    handlers: {
      GET: async ({ request }) => run$2(request),
      POST: async ({ request }) => run$2(request)
    }
  }
});
async function run$1(request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const out = await pollSharetribeHosts();
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
const Route$k = createFileRoute("/api/public/hooks/poll-sharetribe-hosts")({
  server: {
    handlers: {
      GET: async ({ request }) => run$1(request),
      POST: async ({ request }) => run$1(request)
    }
  }
});
const MD_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
function classifyHref(href) {
  const h = (href || "").trim();
  if (!h) return { kind: "other" };
  if (h.startsWith("/")) return { kind: "internal", path: h.split(/[?#]/)[0] };
  if (/^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (/(^|\.)poolrentalnearme\.com$/i.test(u.hostname) || /lovable\.app$/i.test(u.hostname)) {
        return { kind: "internal", path: u.pathname };
      }
    } catch {
    }
  }
  return { kind: "other" };
}
async function runLinkAutoFix(opts = {}) {
  const sb = supabaseAdmin;
  const batchSize = Math.min(Math.max(opts.batchSize ?? 200, 50), 500);
  const maxPages = Math.min(Math.max(opts.maxPages ?? 1e3, 100), 5e3);
  let scanned = 0;
  let pagesUpdated = 0;
  let linksFixed = 0;
  let unresolved = 0;
  let offset = 0;
  const legacyCache = /* @__PURE__ */ new Map();
  async function lookupLegacy(slug) {
    if (legacyCache.has(slug)) return legacyCache.get(slug);
    const { data } = await sb.from("content_pages").select("url_path").contains("legacy_slugs", [slug]).eq("status", "published").limit(1);
    const hit = data && data.length ? data[0].url_path : null;
    legacyCache.set(slug, hit);
    return hit;
  }
  while (scanned < maxPages) {
    const { data: pages } = await sb.from("content_pages").select("id, url_path, body_markdown").eq("status", "published").like("url_path", "/p/%").order("url_path", { ascending: true }).range(offset, offset + batchSize - 1);
    const list = pages || [];
    if (!list.length) break;
    scanned += list.length;
    offset += list.length;
    const referenced = /* @__PURE__ */ new Set();
    for (const p of list) {
      const body = p.body_markdown || "";
      MD_LINK_RE.lastIndex = 0;
      let m;
      while ((m = MD_LINK_RE.exec(body)) !== null) {
        const c = classifyHref(m[2]);
        if (c.kind === "internal" && c.path.startsWith("/p/")) referenced.add(c.path);
      }
    }
    if (!referenced.size) continue;
    const existing = /* @__PURE__ */ new Set();
    const refArr = Array.from(referenced);
    for (let i = 0; i < refArr.length; i += 200) {
      const chunk = refArr.slice(i, i + 200);
      const { data: rows } = await sb.from("content_pages").select("url_path").in("url_path", chunk).eq("status", "published");
      for (const r of rows || []) existing.add(r.url_path);
    }
    for (const p of list) {
      let body = p.body_markdown || "";
      if (!body) continue;
      let pageReplaced = 0;
      let pageUnresolved = 0;
      const seen = /* @__PURE__ */ new Set();
      MD_LINK_RE.lastIndex = 0;
      let m;
      const replacements = [];
      while ((m = MD_LINK_RE.exec(body)) !== null) {
        const href = m[2];
        if (seen.has(href)) continue;
        seen.add(href);
        const c = classifyHref(href);
        if (c.kind !== "internal" || !c.path.startsWith("/p/")) continue;
        if (existing.has(c.path)) continue;
        const slug = c.path.replace(/^\/p\//, "").replace(/\/$/, "");
        if (!slug) continue;
        const canonical = await lookupLegacy(slug);
        if (canonical) replacements.push({ from: href, to: canonical });
        else pageUnresolved++;
      }
      for (const r of replacements) {
        const esc = r.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");
        let hits = 0;
        body = body.replace(re, (_, label) => {
          hits++;
          return `[${label}](${r.to})`;
        });
        pageReplaced += hits;
      }
      if (pageReplaced > 0) {
        const { error } = await sb.from("content_pages").update({
          body_markdown: body,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", p.id);
        if (!error) {
          pagesUpdated++;
          linksFixed += pageReplaced;
        }
      }
      unresolved += pageUnresolved;
    }
  }
  return { pagesScanned: scanned, pagesUpdated, linksFixed, unresolved };
}
const Route$j = createFileRoute("/api/public/hooks/link-auto-fix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const result = await runLinkAutoFix({ batchSize: 200, maxPages: 2e3 });
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          console.error("[link-auto-fix] failed", e);
          return new Response(
            JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
const API = "https://api.intercom.io";
const VERSION = "2.11";
function headers() {
  const token = process.env.INTERCOM_ACCESS_TOKEN;
  if (!token) throw new Error("INTERCOM_ACCESS_TOKEN not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Intercom-Version": VERSION
  };
}
async function ic(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : void 0
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(
      `Intercom ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`
    );
    err.status = res.status;
    throw err;
  }
  return await res.json();
}
async function findContactByEmail(email) {
  const out = await ic(
    "POST",
    "/contacts/search",
    {
      query: {
        field: "email",
        operator: "=",
        value: email.toLowerCase()
      }
    }
  );
  return out.data?.[0] ?? null;
}
async function upsertContact(args) {
  const email = args.email.toLowerCase();
  const existing = await findContactByEmail(email);
  const body = {
    role: args.role ?? "lead",
    email,
    name: args.name ?? void 0,
    external_id: args.externalId ?? void 0,
    custom_attributes: args.customAttributes ?? void 0
  };
  if (existing) {
    return ic("PUT", `/contacts/${existing.id}`, body);
  }
  return ic("POST", "/contacts", body);
}
async function hasOpenConversation(email) {
  try {
    const out = await ic(
      "POST",
      "/conversations/search",
      {
        query: {
          operator: "AND",
          value: [
            { field: "source.author.email", operator: "=", value: email.toLowerCase() },
            { field: "open", operator: "=", value: true }
          ]
        },
        pagination: { per_page: 1 }
      }
    );
    return (out.total_count ?? 0) > 0;
  } catch (err) {
    console.warn("[intercom] hasOpenConversation failed", err?.message);
    return false;
  }
}
const intercom_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  findContactByEmail,
  hasOpenConversation,
  upsertContact
}, Symbol.toStringTag, { value: "Module" }));
function buildHostAttrs(r) {
  return {
    user_type: "host",
    marketplace: "poolrentalnearme",
    source: "prnm_host_subscribers",
    sharetribe_id: r.st_user_id ?? null
  };
}
function buildRenterAttrs(r) {
  return {
    user_type: "guest",
    marketplace: "poolrentalnearme",
    source: "prnm_renter_subscribers",
    sharetribe_id: r.st_user_id ?? null,
    signup_city: r.city ?? null,
    signup_state: r.state_code ?? null
  };
}
function diffAttrs(proposed, existing) {
  const out = {};
  for (const [k, v] of Object.entries(proposed)) {
    const cur = existing?.[k];
    const a = cur === void 0 || cur === "" ? null : cur;
    const b = v === void 0 || v === "" ? null : v;
    if (a !== b) out[k] = { from: cur ?? null, to: v ?? null };
  }
  return out;
}
async function syncTable(audience, rows, buildAttrs, table, dryRun) {
  if (rows.length === 0)
    return { considered: 0, synced: 0, failed: 0, dryRun, diffs: dryRun ? [] : void 0 };
  let synced = 0, failed = 0;
  const diffs = [];
  for (const r of rows) {
    try {
      const proposed = buildAttrs(r);
      if (dryRun) {
        const existing = await findContactByEmail(r.email);
        const changes = diffAttrs(proposed ?? {}, existing?.custom_attributes);
        if (existing && r.name && existing.name !== r.name) {
          changes.name = { from: existing.name ?? null, to: r.name };
        }
        if (existing && r.st_user_id && existing.external_id !== r.st_user_id) {
          changes.external_id = { from: existing.external_id ?? null, to: r.st_user_id };
        }
        diffs.push({
          email: r.email,
          intercom_id: existing?.id ?? null,
          action: !existing ? "create" : Object.keys(changes).length === 0 ? "noop" : "update",
          changes
        });
        await new Promise((res) => setTimeout(res, 120));
        continue;
      }
      const contact = await upsertContact({
        email: r.email,
        name: r.name,
        role: "lead",
        externalId: r.st_user_id ?? void 0,
        customAttributes: proposed
      });
      await supabaseAdmin.from(table).update({
        intercom_id: contact.id,
        intercom_synced_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", r.id);
      synced++;
      await new Promise((res) => setTimeout(res, 120));
    } catch (err) {
      failed++;
      console.warn(`[intercom-sync ${audience}]`, r.email, err?.message);
    }
  }
  return {
    considered: rows.length,
    synced,
    failed,
    dryRun,
    diffs: dryRun ? diffs : void 0
  };
}
async function syncHostSubscribersToIntercom(limit = 100, opts = {}) {
  const dryRun = !!opts.dryRun;
  let q = supabaseAdmin.from("host_subscribers").select("id, email, name, status, st_user_id, intercom_id, intercom_synced_at, updated_at, created_at").eq("status", "active");
  if (!dryRun) q = q.is("intercom_id", null);
  const { data: rows } = await q.order("created_at", { ascending: false }).limit(limit);
  return syncTable("host", rows ?? [], buildHostAttrs, "host_subscribers", dryRun);
}
async function syncRenterSubscribersToIntercom(limit = 100, opts = {}) {
  const dryRun = !!opts.dryRun;
  let q = supabaseAdmin.from("renter_subscribers").select("id, email, name, city, state_code, status, st_user_id, intercom_id, intercom_synced_at, updated_at, created_at").eq("status", "active");
  if (!dryRun) q = q.is("intercom_id", null);
  const { data: rows } = await q.order("created_at", { ascending: false }).limit(limit);
  return syncTable("renter", rows ?? [], buildRenterAttrs, "renter_subscribers", dryRun);
}
async function syncAllToIntercom(opts = {}) {
  const limit = opts.limit ?? 100;
  const hosts = await syncHostSubscribersToIntercom(limit, { dryRun: opts.dryRun });
  const renters = await syncRenterSubscribersToIntercom(limit, { dryRun: opts.dryRun });
  return { dryRun: !!opts.dryRun, hosts, renters };
}
const Route$i = createFileRoute("/api/public/hooks/intercom-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const url = new URL(request.url);
          const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
          const limit = Math.min(
            500,
            Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10) || 100)
          );
          const out = await syncAllToIntercom({ dryRun, limit });
          return Response.json({ ok: true, ...out });
        } catch (err) {
          return Response.json(
            { ok: false, error: err?.message || String(err) },
            { status: 500 }
          );
        }
      },
      GET: async () => Response.json({
        ok: true,
        hint: "POST with x-admin-token header to run sync. Add ?dryRun=1 to preview. Optional ?limit=N (default 100, max 500)."
      })
    }
  }
});
const Route$h = createFileRoute("/api/public/hooks/intercom")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.INTERCOM_IDENTITY_SECRET;
        if (!secret) {
          return new Response("INTERCOM_IDENTITY_SECRET not set", { status: 500 });
        }
        const sigHeader = request.headers.get("x-hub-signature") || "";
        const body = await request.text();
        const expected = "sha1=" + createHmac("sha1", secret).update(body).digest("hex");
        const a = Buffer.from(sigHeader);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }
        let payload;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const topic = payload?.topic || "unknown";
        const data = payload?.data?.item || payload?.data || {};
        const contactId = data?.user?.id || data?.contacts?.contacts?.[0]?.id || data?.id || null;
        const email = (data?.user?.email || data?.source?.author?.email || data?.contacts?.contacts?.[0]?.email || data?.email || null)?.toLowerCase() ?? null;
        const { data: logRow } = await supabaseAdmin.from("intercom_events_log").insert({
          topic,
          email,
          intercom_contact_id: contactId,
          payload
        }).select("id").single();
        let result = "ignored";
        try {
          if (topic === "conversation.user.replied" && email) {
            const now = (/* @__PURE__ */ new Date()).toISOString();
            const { data: h } = await supabaseAdmin.from("host_subscribers").update({ intercom_paused_at: now }).eq("email", email).select("id");
            const { data: r } = await supabaseAdmin.from("renter_subscribers").update({ intercom_paused_at: now }).ilike("email", email).select("id");
            if (h && h.length > 0) {
              await supabaseAdmin.from("host_drip_emails").update({ status: "skipped", error: "intercom user replied" }).eq("status", "pending").in("subscriber_id", h.map((x) => x.id));
            }
            if (r && r.length > 0) {
              await supabaseAdmin.from("renter_emails").update({ status: "skipped", error: "intercom user replied" }).eq("status", "pending").in("subscriber_id", r.map((x) => x.id));
            }
            result = `paused host:${h?.length ?? 0} renter:${r?.length ?? 0}`;
          } else if (topic === "conversation.admin.closed" && email) {
            await supabaseAdmin.from("host_subscribers").update({ intercom_paused_at: null }).eq("email", email);
            await supabaseAdmin.from("renter_subscribers").update({ intercom_paused_at: null }).ilike("email", email);
            result = "unpaused";
          }
        } catch (err) {
          result = `error: ${err?.message || String(err)}`;
        }
        if (logRow?.id) {
          await supabaseAdmin.from("intercom_events_log").update({ processed_at: (/* @__PURE__ */ new Date()).toISOString(), result }).eq("id", logRow.id);
        }
        return Response.json({ ok: true, topic, result });
      },
      // Intercom ping during webhook setup
      GET: async () => Response.json({ ok: true })
    }
  }
});
const Route$g = createFileRoute("/api/public/hooks/ig-lead-hunter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const result = await runIgLeadHunt();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          console.error("[ig-lead-hunter cron] failed", e);
          return new Response(JSON.stringify({ ok: false, error: e?.message || "failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
const STATE_NAMES$1 = {
  al: "Alabama",
  ak: "Alaska",
  az: "Arizona",
  ar: "Arkansas",
  ca: "California",
  co: "Colorado",
  ct: "Connecticut",
  de: "Delaware",
  fl: "Florida",
  ga: "Georgia",
  hi: "Hawaii",
  id: "Idaho",
  il: "Illinois",
  in: "Indiana",
  ia: "Iowa",
  ks: "Kansas",
  ky: "Kentucky",
  la: "Louisiana",
  me: "Maine",
  md: "Maryland",
  ma: "Massachusetts",
  mi: "Michigan",
  mn: "Minnesota",
  ms: "Mississippi",
  mo: "Missouri",
  mt: "Montana",
  ne: "Nebraska",
  nv: "Nevada",
  nh: "New Hampshire",
  nj: "New Jersey",
  nm: "New Mexico",
  ny: "New York",
  nc: "North Carolina",
  nd: "North Dakota",
  oh: "Ohio",
  ok: "Oklahoma",
  or: "Oregon",
  pa: "Pennsylvania",
  ri: "Rhode Island",
  sc: "South Carolina",
  sd: "South Dakota",
  tn: "Tennessee",
  tx: "Texas",
  ut: "Utah",
  vt: "Vermont",
  va: "Virginia",
  wa: "Washington",
  wv: "West Virginia",
  wi: "Wisconsin",
  wy: "Wyoming",
  dc: "District of Columbia"
};
const STATE_NAME_TO_CODE = Object.fromEntries(
  Object.entries(STATE_NAMES$1).map(([code, name]) => [name.toLowerCase().replace(/\s+/g, "-"), code])
);
async function parseCityState$1(slug) {
  const titleize = (s) => s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  let m = slug.match(/^become-a-(?:swimming-)?pool-host-(.+)-([a-z]{2})$/);
  if (m && STATE_NAMES$1[m[2]]) {
    return { city: titleize(m[1]), state: STATE_NAMES$1[m[2]], stCode: m[2].toUpperCase() };
  }
  m = slug.match(/^become-a-(?:swimming-)?pool-host-(.+)$/);
  if (m) {
    const tokens = m[1].split("-");
    for (const take of [1, 2]) {
      if (tokens.length <= take) continue;
      const stateKey = tokens.slice(-take).join("-");
      const code = STATE_NAME_TO_CODE[stateKey];
      if (code) {
        return { city: titleize(tokens.slice(0, -take).join("-")), state: STATE_NAMES$1[code], stCode: code.toUpperCase() };
      }
    }
    const cityName = titleize(tokens.join("-"));
    const { data } = await supabaseAdmin.from("cities").select("name, state, state_code").ilike("name", cityName).eq("is_published", true).limit(1).maybeSingle();
    if (data?.state_code) {
      return { city: data.name, state: data.state, stCode: data.state_code };
    }
  }
  return null;
}
const BOILER_RE = /\n#+\s*Related Pool Owner Guides[\s\S]*$/i;
const MAKE_MONEY_RE = /\n[\*\-]\s*\[Make Money Renting Out Your Pool\][\s\S]*$/i;
const LEGACY_LINK_RE = /\n[\*\-]\s*\[\/make_money_renting_out_your_pool[\s\S]*$/i;
function stripBoiler(body) {
  if (!body) return "";
  let out = body;
  out = out.replace(BOILER_RE, "");
  out = out.replace(MAKE_MONEY_RE, "");
  out = out.replace(LEGACY_LINK_RE, "");
  return out.trimEnd();
}
const VOICE_RULES = `Voice: founder-mentor to homeowner. Second person ("your pool"). Sentence case headings.
No em dashes. Numbers under 10 spelled out, 10+ numerals. Dollar amounts $X/hour.
Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
Banned phrases: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "proven track record".
Real numbers only: hourly rates $40-150, monthly $3,000-$10,000 in season.
If unsure of specific neighborhood names in this city, use phrasing like "neighborhoods near downtown {city}" or "{city}'s east side" — do not invent names.`;
function tailPrompt(city, state) {
  return `Write a city-specific closing block for a pool-rental host acquisition page about ${city}, ${state}.

REQUIREMENTS:
- 700-900 characters of markdown
- Start with an H2 like "## Why ${city} pools earn" or "## Renting your ${city} pool"
- Must mention: ${city}, ${state}, 2-3 real neighborhoods or districts in ${city}, one climate/season detail specific to ${city} (months pools are usable, summer highs, monsoon, humidity, etc.)
- One CTA paragraph with a markdown link to /p/hosting
- Mention Pool Rental Near Me's 10% flat host fee and $2M liability insurance naturally, once
${VOICE_RULES}

Output ONLY the markdown block. No preamble, no commentary, no code fence.`;
}
function fullPrompt(city, state, stCode) {
  return `Write a complete ~1,200-word host acquisition page in markdown for pool owners in ${city}, ${state} (${stCode}).

STRUCTURE (use these exact H2 headings in order):
1. # Rent your pool in ${city}, ${state} (H1, one line)
2. ## Why ${city} backyard pools earn (climate, pool season months, why local demand is real — ~200 words)
3. ## What you can earn in ${city} (hourly $40-150, monthly $3,000-$10,000 in season, one math example — ~200 words)
4. ## Neighborhoods where pools rent fastest (2-3 real neighborhoods or districts in ${city} with one sentence each on why — ~200 words)
5. ## What hosting actually looks like (booking, $2M liability insurance, 10% flat host fee, payouts — ~200 words)
6. ## ${city} vs other side hustles (vs Airbnb short-term rental, vs Turo, vs dog boarding — ~150 words)
7. ## Get started in ${city} (numbered steps, link to /p/hosting and /signup — ~150 words)

${VOICE_RULES}

Output ONLY the markdown. No preamble, no code fence.`;
}
async function callAi(apiKey, prompt) {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (resp.status === 402) return { ok: false, err: "AI credits exhausted" };
    if (resp.status === 429) return { ok: false, err: "rate limited" };
    if (!resp.ok) return { ok: false, err: `gateway ${resp.status}` };
    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") return { ok: false, err: "empty AI response" };
    return { ok: true, text: text.trim().replace(/^```(?:markdown)?\s*/i, "").replace(/```\s*$/, "").trim() };
  } catch (e) {
    return { ok: false, err: `fetch_error:${e?.message || "unknown"}` };
  }
}
const Route$f = createFileRoute("/api/public/hooks/host-city-tail-fix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ ok: false, error: "LOVABLE_API_KEY missing" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        let body = {};
        try {
          body = await request.json();
        } catch {
        }
        const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 40);
        let work = [];
        const { data: emptyRows } = await supabaseAdmin.from("content_pages").select("id, slug, body_markdown").eq("template_type", "host_acq_city").eq("status", "published").or("body_markdown.is.null,body_markdown.eq.").is("content_refreshed_at", null).limit(limit);
        work = emptyRows ?? [];
        if (work.length < limit) {
          const need = limit - work.length;
          const { data: tailRows } = await supabaseAdmin.from("content_pages").select("id, slug, body_markdown").eq("template_type", "host_acq_city").eq("status", "published").ilike("body_markdown", "%Related Pool Owner Guides%").is("content_refreshed_at", null).limit(need);
          work = work.concat(tailRows ?? []);
        }
        const errors = [];
        let succeeded_full = 0;
        let succeeded_tail = 0;
        let failed = 0;
        const CONC = 5;
        for (let i = 0; i < work.length; i += CONC) {
          const batch = work.slice(i, i + CONC);
          await Promise.all(batch.map(async (row) => {
            const parsed = await parseCityState$1(row.slug);
            if (!parsed) {
              failed++;
              errors.push(`unparseable:${row.slug}`);
              await supabaseAdmin.from("content_pages").update({ content_refreshed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", row.id);
              return;
            }
            const { city, state, stCode } = parsed;
            const isFull = !row.body_markdown || row.body_markdown.trim().length === 0;
            const prompt = isFull ? fullPrompt(city, state, stCode) : tailPrompt(city, state);
            const aiRes = await callAi(apiKey, prompt);
            if (!aiRes.ok) {
              failed++;
              if (errors.length < 10) errors.push(`${row.slug}:${aiRes.err}`);
              return;
            }
            let newBody;
            if (isFull) {
              newBody = aiRes.text;
            } else {
              const stripped = stripBoiler(row.body_markdown || "");
              let tail = aiRes.text;
              if (!tail.includes("/p/hosting")) {
                tail += `

[List your ${city} pool today](/p/hosting)`;
              }
              newBody = stripped + "\n\n" + tail + "\n";
            }
            const { error: upErr } = await supabaseAdmin.from("content_pages").update({
              body_markdown: newBody,
              content_refreshed_at: (/* @__PURE__ */ new Date()).toISOString(),
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }).eq("id", row.id);
            if (upErr) {
              failed++;
              if (errors.length < 10) errors.push(`${row.slug}:db:${upErr.message}`);
              return;
            }
            if (isFull) succeeded_full++;
            else succeeded_tail++;
          }));
        }
        const { count: remainingEmpty } = await supabaseAdmin.from("content_pages").select("id", { count: "exact", head: true }).eq("template_type", "host_acq_city").eq("status", "published").or("body_markdown.is.null,body_markdown.eq.").is("content_refreshed_at", null);
        const { count: remainingTail } = await supabaseAdmin.from("content_pages").select("id", { count: "exact", head: true }).eq("template_type", "host_acq_city").eq("status", "published").ilike("body_markdown", "%Related Pool Owner Guides%").is("content_refreshed_at", null);
        return new Response(JSON.stringify({
          ok: true,
          processed: work.length,
          succeeded_full,
          succeeded_tail,
          failed,
          remaining_full: remainingEmpty ?? 0,
          remaining_tail: remainingTail ?? 0,
          errors
        }), { headers: { "Content-Type": "application/json" } });
      }
    }
  }
});
const Route$e = createFileRoute("/api/public/hooks/gsc-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const result = await runGscSync({ days: 3, rowLimit: 25e3, triggerSource: "cron" });
          return Response.json(result, { status: result.ok ? 200 : 500 });
        } catch (e) {
          console.error("[gsc-sync] hook failed", e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 }
          );
        }
      }
    }
  }
});
const STATE_NAMES = {
  al: "Alabama",
  ak: "Alaska",
  az: "Arizona",
  ar: "Arkansas",
  ca: "California",
  co: "Colorado",
  ct: "Connecticut",
  de: "Delaware",
  fl: "Florida",
  ga: "Georgia",
  hi: "Hawaii",
  id: "Idaho",
  il: "Illinois",
  in: "Indiana",
  ia: "Iowa",
  ks: "Kansas",
  ky: "Kentucky",
  la: "Louisiana",
  me: "Maine",
  md: "Maryland",
  ma: "Massachusetts",
  mi: "Michigan",
  mn: "Minnesota",
  ms: "Mississippi",
  mo: "Missouri",
  mt: "Montana",
  ne: "Nebraska",
  nv: "Nevada",
  nh: "New Hampshire",
  nj: "New Jersey",
  nm: "New Mexico",
  ny: "New York",
  nc: "North Carolina",
  nd: "North Dakota",
  oh: "Ohio",
  ok: "Oklahoma",
  or: "Oregon",
  pa: "Pennsylvania",
  ri: "Rhode Island",
  sc: "South Carolina",
  sd: "South Dakota",
  tn: "Tennessee",
  tx: "Texas",
  ut: "Utah",
  vt: "Vermont",
  va: "Virginia",
  wa: "Washington",
  wv: "West Virginia",
  wi: "Wisconsin",
  wy: "Wyoming",
  dc: "District of Columbia"
};
function parseCityState(slug) {
  const body = slug.replace(/^become-a-swimming-pool-host-/, "");
  const m = body.match(/^(.*)-([a-z]{2})$/);
  if (!m) return null;
  const citySlug = m[1];
  const st = m[2];
  const city = citySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const state = STATE_NAMES[st] || st.toUpperCase();
  return { city, state, stCode: st.toUpperCase() };
}
function buildSystem(city, state, stCode, linkPool) {
  return `You write SEO content for Pool Rental Near Me, a peer-to-peer marketplace where homeowners rent backyard pools by the hour. Differentiators: 10% flat host fee (vs Swimply 15%+), $2M liability insurance included on every booking, 5,100+ city pages indexed.

Voice: founder-mentor talking to a homeowner who could earn $3K-$10K/month from their backyard pool. Confident, friendly, host-first, second person. Sentence case headings. No em dashes. Numbers under 10 spelled out. Dollar amounts as $X/hour. Real numbers only — typical hourly rates $40-150/hr.

Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
Banned phrases: "in this article", "in conclusion", "it's worth noting", "Pool Rental Near Me is the leading".

Write a 2,000-2,800 word host acquisition page for ${city}, ${state} (${stCode}). Markdown only with ## and ### headings. Required sections in order:

1. Lede paragraph (hook with a real local angle)
2. ## Why ${city} pool owners are listing now
3. ## What you can earn in ${city} (typical $40-150/hr range, weekend/weekday split, seasonal swing for ${state})
4. ## How it works (4 short steps)
5. ## What's covered (10% flat host fee, $2M liability insurance per booking, vetted guests, 24/7 support)
6. ## ${city} vs other side hustles (vs Airbnb/VRBO short-term rental, vs Turo, vs dog boarding)
7. ## Local rules to know in ${city}, ${state} (HOA-friendly, fence/gate compliance — generic, no invented ordinances)
8. ## Getting started today (CTA paragraph)

Include 3-5 internal links from the candidate list using exact url_path. Always include the marketplace CTAs: search /s, list a pool /l/draft/00000000-0000-0000-0000-000000000000/new/details. End with a strong CTA paragraph linking to the list-a-pool URL. Do NOT invent any other internal URLs.

Candidate internal links:
${linkPool}`;
}
async function generateOne(apiKey, row, linkPool) {
  const parsed = parseCityState(row.slug);
  if (!parsed) return { url_path: row.url_path, ok: false, err: "could not parse city/state" };
  const { city, state, stCode } = parsed;
  const { data: existing } = await supabaseAdmin.from("content_pages").select("id, status").eq("url_path", row.url_path).maybeSingle();
  if (existing?.status === "published") {
    await supabaseAdmin.from("content_404_log").update({ resolved_at: (/* @__PURE__ */ new Date()).toISOString(), resolution_notes: "already published" }).eq("id", row.id);
    return { url_path: row.url_path, ok: true, words: 0 };
  }
  const userMsg = `Write the host acquisition page for ${city}, ${state}. URL: ${row.url_path}. Title: "Become a swimming pool host in ${city}, ${stCode}". seo_title ≤60 chars, seo_description ≤155 chars.`;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: buildSystem(city, state, stCode, linkPool) },
        { role: "user", content: userMsg }
      ],
      tools: [{
        type: "function",
        function: {
          name: "write_page",
          description: "Write the host city page",
          parameters: {
            type: "object",
            required: ["title", "seo_title", "seo_description", "body_markdown"],
            properties: {
              title: { type: "string" },
              seo_title: { type: "string" },
              seo_description: { type: "string" },
              body_markdown: { type: "string" }
            },
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "write_page" } }
    })
  });
  if (resp.status === 402) return { url_path: row.url_path, ok: false, err: "AI credits exhausted" };
  if (resp.status === 429) return { url_path: row.url_path, ok: false, err: "rate limited" };
  if (!resp.ok) return { url_path: row.url_path, ok: false, err: `gateway ${resp.status}` };
  const json = await resp.json();
  const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) return { url_path: row.url_path, ok: false, err: "no tool call" };
  let gen;
  try {
    gen = JSON.parse(tc.function.arguments);
  } catch (e) {
    return { url_path: row.url_path, ok: false, err: "bad JSON from AI" };
  }
  const writePayload = {
    url_path: row.url_path,
    slug: row.slug,
    status: "published",
    in_sitemap: true,
    template_type: "host_acq_city",
    category: "host_acquisition",
    title: gen.title,
    seo_title: gen.seo_title,
    seo_description: gen.seo_description,
    body_markdown: gen.body_markdown,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (existing) {
    const { error } = await supabaseAdmin.from("content_pages").update(writePayload).eq("id", existing.id);
    if (error) return { url_path: row.url_path, ok: false, err: error.message };
  } else {
    const { error } = await supabaseAdmin.from("content_pages").insert(writePayload);
    if (error) return { url_path: row.url_path, ok: false, err: error.message };
  }
  await supabaseAdmin.from("content_404_log").update({ resolved_at: (/* @__PURE__ */ new Date()).toISOString(), resolution_notes: "ai-generated host_acq_city" }).eq("id", row.id);
  const words = (gen.body_markdown || "").split(/\s+/).filter(Boolean).length;
  return { url_path: row.url_path, ok: true, words };
}
const Route$d = createFileRoute("/api/public/hooks/gen-host-pages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ ok: false, error: "LOVABLE_API_KEY missing" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        let body = {};
        try {
          body = await request.json();
        } catch {
        }
        const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50);
        const { data: rows } = await supabaseAdmin.from("content_404_log").select("id, url_path, slug").is("resolved_at", null).like("url_path", "/p/become-a-swimming-pool-host-%").order("hit_count", { ascending: false }).limit(limit);
        const todo = rows ?? [];
        const { data: linkRows } = await supabaseAdmin.from("content_pages").select("url_path, title").eq("status", "published").like("url_path", "/p/%").order("updated_at", { ascending: false }).limit(30);
        const linkPool = (linkRows ?? []).map((p) => `- ${p.url_path} — ${p.title || p.url_path}`).join("\n");
        const results = [];
        const CONC = 4;
        for (let i = 0; i < todo.length; i += CONC) {
          const batch = todo.slice(i, i + CONC);
          const out = await Promise.all(batch.map((r) => generateOne(apiKey, r, linkPool)));
          results.push(...out);
        }
        const succeeded = results.filter((r) => r.ok).length;
        const failed = results.length - succeeded;
        const { count: remaining } = await supabaseAdmin.from("content_404_log").select("id", { count: "exact", head: true }).is("resolved_at", null).like("url_path", "/p/become-a-swimming-pool-host-%");
        return new Response(
          JSON.stringify({ ok: true, processed: results.length, succeeded, failed, remaining, results }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }
});
const Route$c = createFileRoute("/api/public/hooks/followup-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const result = await processFollowupReminders();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
async function run(request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const out = await enrollNewSignups();
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
const Route$b = createFileRoute("/api/public/hooks/enroll-host-signups")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request)
    }
  }
});
const SITE_NAME = "Pool Rental Near Me";
const SENDER_DOMAIN = "notify.poolfriends.poolrentalnearme.com";
const FROM_DOMAIN = "notify.poolfriends.poolrentalnearme.com";
const RECIPIENT = "derek@poolrentalnearme.com";
async function buildDigestData() {
  const sb = supabaseAdmin;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
  const { data: newPagesRows, count: newPagesCount } = await sb.from("competitor_pages").select("url, domain, title", { count: "exact" }).gte("created_at", since).order("created_at", { ascending: false }).limit(15);
  const { data: auditsRows, count: auditsCount } = await sb.from("page_audits").select("url_path, score, summary", { count: "exact" }).lt("score", 60).gte("audited_at", since).order("score", { ascending: true }).limit(15);
  let rankDrops = [];
  try {
    const { data: rankRows } = await sb.from("serp_rankings").select("keyword, position, checked_at").gte("checked_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString()).order("checked_at", { ascending: false }).limit(500);
    if (rankRows && Array.isArray(rankRows)) {
      const byKeyword = /* @__PURE__ */ new Map();
      for (const r of rankRows) {
        const list = byKeyword.get(r.keyword) || [];
        list.push(r);
        byKeyword.set(r.keyword, list);
      }
      for (const [keyword, list] of byKeyword.entries()) {
        if (list.length < 2) continue;
        const [current, previous] = list;
        const cur = current.position ?? 100;
        const prev = previous.position ?? 100;
        if (cur - prev >= 5) {
          rankDrops.push({ keyword, previous_position: previous.position, current_position: current.position });
        }
      }
      rankDrops = rankDrops.slice(0, 10);
    }
  } catch {
  }
  let hostLeads = [];
  let totalHostLeads = 0;
  try {
    const { data: leadRows, count: leadCount } = await sb.from("competitor_host_matches").select("competitor_url, domain, candidate_name, candidate_business_name, candidate_email, candidate_phone, candidate_website, candidate_evidence, match_confidence", { count: "exact" }).eq("status", "new").gte("match_confidence", 50).gte("created_at", since).order("match_confidence", { ascending: false }).limit(10);
    hostLeads = leadRows || [];
    totalHostLeads = leadCount || 0;
  } catch {
  }
  return {
    dateLabel: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    }),
    newCompetitorPages: newPagesRows || [],
    totalNewCompetitor: newPagesCount || 0,
    criticalAudits: auditsRows || [],
    totalCriticalAudits: auditsCount || 0,
    rankDrops,
    hostLeads,
    totalHostLeads
  };
}
function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sendDigest(force) {
  const sb = supabaseAdmin;
  const data = await buildDigestData();
  const totalSignals = data.totalNewCompetitor + data.totalCriticalAudits + data.rankDrops.length + data.totalHostLeads;
  if (!force && totalSignals === 0) {
    return { sent: false, reason: "no_signals", data };
  }
  const template = TEMPLATES["daily-seo-digest"];
  if (!template) throw new Error("Template not registered");
  const { data: suppressed } = await sb.from("suppressed_emails").select("id").eq("email", RECIPIENT.toLowerCase()).maybeSingle();
  if (suppressed) return { sent: false, reason: "suppressed" };
  let token;
  const { data: existing } = await sb.from("email_unsubscribe_tokens").select("token, used_at").eq("email", RECIPIENT.toLowerCase()).maybeSingle();
  if (existing && !existing.used_at) {
    token = existing.token;
  } else {
    token = generateToken();
    await sb.from("email_unsubscribe_tokens").upsert(
      { token, email: RECIPIENT.toLowerCase() },
      { onConflict: "email", ignoreDuplicates: true }
    );
    const { data: stored } = await sb.from("email_unsubscribe_tokens").select("token").eq("email", RECIPIENT.toLowerCase()).maybeSingle();
    token = stored?.token || token;
  }
  const element = React.createElement(template.component, { ...data, unsubscribeToken: token });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject = typeof template.subject === "function" ? template.subject(data) : template.subject;
  const messageId = `daily-seo-digest-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
  const idempotencyKey = messageId;
  await sb.from("email_send_log").insert({
    message_id: messageId,
    template_name: "daily-seo-digest",
    recipient_email: RECIPIENT,
    status: "pending"
  });
  const { error: enqErr } = await sb.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: RECIPIENT,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: "daily-seo-digest",
      idempotency_key: idempotencyKey,
      unsubscribe_token: token,
      queued_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  if (enqErr) {
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: "daily-seo-digest",
      recipient_email: RECIPIENT,
      status: "failed",
      error_message: enqErr.message || "enqueue failed"
    });
    return { sent: false, error: enqErr.message };
  }
  return { sent: true, message_id: messageId, signals: totalSignals, summary: {
    new_competitor_pages: data.totalNewCompetitor,
    critical_audits: data.totalCriticalAudits,
    rank_drops: data.rankDrops.length
  } };
}
const Route$a = createFileRoute("/api/public/hooks/daily-seo-digest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "1";
        try {
          const result = await sendDigest(force);
          return Response.json(result);
        } catch (e) {
          console.error("daily-seo-digest hook failed", e);
          return Response.json({ ok: false, error: e?.message || "unknown" }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "1";
        try {
          const result = await sendDigest(force);
          return Response.json(result);
        } catch (e) {
          console.error("daily-seo-digest hook failed", e);
          return Response.json({ ok: false, error: e?.message || "unknown" }, { status: 500 });
        }
      }
    }
  }
});
const Route$9 = createFileRoute("/api/public/hooks/composer-scheduled")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const { runScheduledComposerEmails } = await import("./email-composer.server-DhGnJ9F6.js");
          const result = await runScheduledComposerEmails();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
async function fetchSitemapUrls(sitemapUrl, depth = 0) {
  if (depth > 2) return [];
  const res = await fetch(sitemapUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; PoolRentalNearMeBot/1.0; +https://www.poolrentalnearme.com)" } });
  if (!res.ok) throw new Error(`Sitemap fetch ${res.status}`);
  const xml = await res.text();
  const locs = Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)).map((m) => m[1]);
  if (/<sitemapindex/i.test(xml)) {
    const out = [];
    for (const child of locs.slice(0, 25)) {
      try {
        out.push(...await fetchSitemapUrls(child, depth + 1));
      } catch {
      }
    }
    return out;
  }
  return locs;
}
async function runScan() {
  const sb = supabaseAdmin;
  const { data: sites } = await sb.from("competitor_sites").select("*").eq("is_active", true);
  const results = [];
  const newlyInsertedIds = [];
  for (const site of sites || []) {
    try {
      const urls = await fetchSitemapUrls(site.sitemap_url);
      const unique = Array.from(new Set(urls)).slice(0, 1e4);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { data: existing } = await sb.from("competitor_urls").select("url").eq("site_id", site.id);
      const existingSet = new Set((existing || []).map((r) => r.url));
      const newOnes = unique.filter((u) => !existingSet.has(u));
      if (newOnes.length) {
        const { data: inserted } = await sb.from("competitor_urls").insert(
          newOnes.map((url) => ({ site_id: site.id, url, first_seen_at: now, last_seen_at: now }))
        ).select("id");
        for (const r of inserted || []) newlyInsertedIds.push(r.id);
      }
      await sb.from("competitor_sites").update({
        last_checked_at: now,
        last_url_count: unique.length
      }).eq("id", site.id);
      results.push({ domain: site.domain, new_count: newOnes.length, total: unique.length });
    } catch (e) {
      results.push({ domain: site.domain, error: e?.message || "scan failed" });
    }
  }
  let matcherResult = null;
  if (newlyInsertedIds.length > 0) {
    try {
      const { matchManyCompetitorUrls } = await import("./host-matcher.server-DwygPzut.js");
      matcherResult = await matchManyCompetitorUrls(newlyInsertedIds.slice(0, 25), 2);
    } catch (e) {
      console.error("[radar-scan] matcher failed", e);
    }
  }
  let enrichResult = null;
  try {
    const { data: freshMatches } = await sb.from("competitor_host_matches").select("id").is("enriched_at", null).order("created_at", { ascending: false }).limit(50);
    const ids = (freshMatches || []).map((r) => r.id);
    if (ids.length > 0) {
      const { enrichManyHostMatches } = await import("./contact-enricher.server-XIm3a7Aa.js");
      enrichResult = await enrichManyHostMatches(ids);
    }
  } catch (e) {
    console.error("[radar-scan] enrich failed", e);
  }
  return { ok: true, results, matcher: matcherResult, enrich: enrichResult, ran_at: (/* @__PURE__ */ new Date()).toISOString() };
}
const Route$8 = createFileRoute("/api/public/hooks/competitor-radar-scan")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        return Response.json(await runScan());
      },
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        return Response.json(await runScan());
      }
    }
  }
});
const Route$7 = createFileRoute("/api/public/hooks/blog-autogen")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        let body = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        const count = Number.isFinite(body?.count) ? Number(body.count) : 2;
        const topic = typeof body?.topic === "string" ? body.topic : void 0;
        const titleHint = typeof body?.titleHint === "string" ? body.titleHint : void 0;
        const autoPublish = body?.autoPublish === true;
        try {
          const result = await runBlogAutogen({ count, topic, titleHint, autoPublish });
          return Response.json({ ok: true, ...result });
        } catch (e) {
          console.error("blog-autogen failed:", e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 }
          );
        }
      }
    }
  }
});
const Route$6 = createFileRoute("/api/public/hooks/auto-outreach-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const r = await runAutoOutreach();
          return new Response(JSON.stringify(r), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (e) {
          console.error("[auto-outreach-worker] failed", e);
          return new Response(JSON.stringify({ ok: false, error: e?.message || "failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
    }
  }
});
const Route$5 = createFileRoute("/api/public/hooks/alias-backfill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const out = await runAliasBackfill({ limit: 1e3 });
          return new Response(
            JSON.stringify({ ok: true, summary: out.summary }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (e) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: e instanceof Error ? e.message : String(e)
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
async function runCheck() {
  const sb = supabaseAdmin;
  const { data } = await sb.from("content_pages").select("slug, status, body_markdown").in("slug", ACADEMY_SLUGS);
  const health = Object.fromEntries(
    ACADEMY_SLUGS.map((s) => [s, "missing"])
  );
  for (const r of data ?? []) {
    if (!r.slug || !ACADEMY_SLUGS.includes(r.slug)) continue;
    if (r.status !== "published") continue;
    health[r.slug] = classifyAcademyHealth((r.body_markdown ?? "").trim().length);
  }
  const missing = ACADEMY_SLUGS.filter((s) => health[s] === "missing");
  const short = ACADEMY_SLUGS.filter((s) => health[s] === "short");
  const healthyOccasionCount = ACADEMY_OCCASION_SLUGS.filter(
    (s) => health[s] === "published"
  ).length;
  const hubsHealthy = ACADEMY_HUB_SLUGS$1.some((s) => health[s] === "published");
  const sectionHidden = healthyOccasionCount < 2 || !hubsHealthy;
  const degraded = sectionHidden || missing.length > 0 || short.length > 0;
  const report = {
    tag: "academy_health_cron",
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sectionHidden,
    healthyOccasionCount,
    hubsHealthy,
    missing,
    short,
    totalTracked: ACADEMY_SLUGS.length
  };
  if (degraded) console.warn(JSON.stringify(report));
  return { ok: !degraded, ...report };
}
const Route$4 = createFileRoute("/api/public/hooks/academy-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const res = await runCheck();
        return new Response(JSON.stringify(res), {
          status: res.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" }
        });
      },
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        const res = await runCheck();
        return new Response(JSON.stringify(res), {
          status: res.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }
});
const Route$3 = createFileRoute("/api/public/hooks/ab-auto-winner")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const { runAbAutoWinnerCron } = await import("./email-composer-extras.server-5IcsiDVo.js");
          const result = await runAbAutoWinnerCron();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
function escapePdf(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function buildPdf(opts) {
  const W = 792;
  const H = 612;
  const lines = [];
  const push = (s) => lines.push(s);
  push("q");
  push("0.05 0.35 0.6 RG");
  push("4 w");
  push(`24 24 ${W - 48} ${H - 48} re S`);
  push("1 w");
  push(`36 36 ${W - 72} ${H - 72} re S`);
  push("Q");
  push("BT");
  push("/F2 36 Tf");
  push("0.05 0.35 0.6 rg");
  const title = "Certificate of Completion";
  const titleWidth = title.length * 18;
  push(`${(W - titleWidth) / 2} ${H - 130} Td`);
  push(`(${escapePdf(title)}) Tj`);
  push("ET");
  push("BT");
  push("/F1 14 Tf");
  push("0.3 0.3 0.3 rg");
  const awarded = "This is to certify that";
  push(`${(W - awarded.length * 7) / 2} ${H - 200} Td`);
  push(`(${escapePdf(awarded)}) Tj`);
  push("ET");
  push("BT");
  push("/F2 32 Tf");
  push("0 0 0 rg");
  const nameWidth = opts.learnerName.length * 16;
  push(`${(W - nameWidth) / 2} ${H - 260} Td`);
  push(`(${escapePdf(opts.learnerName)}) Tj`);
  push("ET");
  push("BT");
  push("/F1 14 Tf");
  push("0.3 0.3 0.3 rg");
  const completed = "has successfully completed the course";
  push(`${(W - completed.length * 7) / 2} ${H - 310} Td`);
  push(`(${escapePdf(completed)}) Tj`);
  push("ET");
  push("BT");
  push("/F2 22 Tf");
  push("0.05 0.35 0.6 rg");
  const courseWidth = opts.courseTitle.length * 11;
  push(`${(W - courseWidth) / 2} ${H - 360} Td`);
  push(`(${escapePdf(opts.courseTitle)}) Tj`);
  push("ET");
  push("BT");
  push("/F1 14 Tf");
  push("0.3 0.3 0.3 rg");
  const dateLine = `Completed on ${opts.completedOn}`;
  push(`${(W - dateLine.length * 7) / 2} ${H - 410} Td`);
  push(`(${escapePdf(dateLine)}) Tj`);
  push("ET");
  push("BT");
  push("/F2 12 Tf");
  push("0 0 0 rg");
  push(`70 90 Td`);
  push(`(Pool Rental Near Me Academy) Tj`);
  push("ET");
  push("BT");
  push("/F1 10 Tf");
  push("0.4 0.4 0.4 rg");
  push(`70 72 Td`);
  push(`(Issuing organization) Tj`);
  push("ET");
  push("BT");
  push("/F2 12 Tf");
  push("0 0 0 rg");
  const idLine = `ID ${opts.certificateUid}`;
  push(`${W - 70 - idLine.length * 6} 90 Td`);
  push(`(${escapePdf(idLine)}) Tj`);
  push("ET");
  push("BT");
  push("/F1 10 Tf");
  push("0.4 0.4 0.4 rg");
  push(`${W - 70 - opts.verifyUrl.length * 5} 72 Td`);
  push(`(Verify at ${escapePdf(opts.verifyUrl)}) Tj`);
  push("ET");
  const content = lines.join("\n");
  const contentBytes = new TextEncoder().encode(content);
  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`
  );
  objects.push(`<< /Length ${contentBytes.length} >>
stream
${content}
endstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  let pdf = "%PDF-1.4\n%âãÏÓ\n";
  const offsets = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${i + 1} 0 obj
${objects[i]}
endobj
`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, "0")} 00000 n 
`;
  }
  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;
  return new TextEncoder().encode(pdf);
}
const Route$2 = createFileRoute("/api/certificates/$uid/pdf")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const uid = params.uid;
        if (!/^[A-Z0-9-]{6,40}$/.test(uid)) {
          return new Response("Bad request", { status: 400 });
        }
        const { data, error } = await supabaseAdmin.from("course_completions").select("certificate_uid, course_title, learner_name, completed_at, revoked_at").eq("certificate_uid", uid).maybeSingle();
        if (error) return new Response("Server error", { status: 500 });
        if (!data) return new Response("Not found", { status: 404 });
        if (data.revoked_at) {
          return new Response("Certificate has been revoked", { status: 410 });
        }
        const origin = new URL(request.url).origin;
        const pdf = buildPdf({
          learnerName: data.learner_name,
          courseTitle: data.course_title,
          completedOn: new Date(data.completed_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }),
          certificateUid: data.certificate_uid,
          verifyUrl: `${origin}/verify/${data.certificate_uid}`
        });
        return new Response(pdf, {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `inline; filename="${data.certificate_uid}.pdf"`,
            "cache-control": "private, max-age=300"
          }
        });
      }
    }
  }
});
const $$splitErrorComponentImporter$1 = () => import("./p.pool-pros.c._category._state-CADYclzZ.js");
const $$splitNotFoundComponentImporter$1 = () => import("./p.pool-pros.c._category._state-23TFQ6S0.js");
const $$splitComponentImporter$1 = () => import("./p.pool-pros.c._category._state-Dwo63kte.js");
const Route$1 = createFileRoute("/p/pool-pros/c/$category/$state")({
  loader: async ({
    params
  }) => {
    if (!/^[a-z]{2}$/i.test(params.state)) throw notFound();
    const res = await getCategoryStateProviders({
      data: {
        slug: params.category,
        state: params.state
      }
    });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({
    loaderData,
    params
  }) => {
    if (!loaderData?.category) return {};
    const c = loaderData.category;
    const sn = loaderData.stateName;
    const path = `/p/pool-pros/c/${params.category}/${params.state.toLowerCase()}`;
    const title = `${c.plural_name} in ${sn} | Pool Rental Near Me`;
    const description = `Find ${c.plural_name.toLowerCase()} across ${sn}. Browse vetted local pool pros by city.`;
    const meta = buildMeta({
      title,
      description,
      path,
      image: c.hero_image_url,
      noindex: true
    });
    meta.links = meta.links.filter((l) => l.rel !== "canonical");
    const crumbs = breadcrumbJsonLd$1([{
      name: "Home",
      path: "/"
    }, {
      name: "Pool Pros",
      path: "/p/pool-pros"
    }, {
      name: c.plural_name,
      path: `/p/pool-pros/c/${params.category}`
    }, {
      name: sn,
      path
    }]);
    const list = itemListJsonLd((loaderData.cities ?? []).slice(0, 50).map((city) => ({
      name: `${c.plural_name} in ${city.name}, ${loaderData.stateCode}`,
      path: `${path}/${city.slug}`
    })), `${c.plural_name} in ${sn}`);
    return {
      ...meta,
      scripts: [ldJsonScript(crumbs), ldJsonScript(list)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1, "component"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$1, "notFoundComponent"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$1, "errorComponent")
});
const $$splitErrorComponentImporter = () => import("./p.pool-pros.c._category._state._city-DYgo1MX9.js");
const $$splitNotFoundComponentImporter = () => import("./p.pool-pros.c._category._state._city-CtqwsIfn.js");
const $$splitComponentImporter = () => import("./p.pool-pros.c._category._state._city-DAJVZDuN.js");
const Route = createFileRoute("/p/pool-pros/c/$category/$state/$city")({
  loader: async ({
    params
  }) => {
    if (!/^[a-z]{2}$/i.test(params.state)) throw notFound();
    const res = await getCategoryCityProviders({
      data: {
        slug: params.category,
        state: params.state,
        city: params.city
      }
    });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({
    loaderData,
    params
  }) => {
    if (!loaderData?.category) return {};
    const c = loaderData.category;
    const title = `${c.plural_name} in ${loaderData.cityName}, ${loaderData.stateCode}`;
    const description = `Top ${c.plural_name.toLowerCase()} serving ${loaderData.cityName}, ${loaderData.stateName}. Compare local pool pros, ratings and contact info.`;
    const path = `/p/pool-pros/c/${params.category}/${params.state.toLowerCase()}/${params.city.toLowerCase()}`;
    const meta = buildMeta({
      title: `${title} | Pool Rental Near Me`,
      description,
      path,
      image: c.hero_image_url,
      noindex: true
    });
    const crumbs = breadcrumbJsonLd$1([{
      name: "Home",
      path: "/"
    }, {
      name: "Pool Pros",
      path: "/p/pool-pros"
    }, {
      name: c.plural_name,
      path: `/p/pool-pros/c/${params.category}`
    }, {
      name: loaderData.stateName,
      path: `/p/pool-pros/c/${params.category}/${params.state.toLowerCase()}`
    }, {
      name: loaderData.cityName,
      path
    }]);
    const list = itemListJsonLd((loaderData.providers ?? []).slice(0, 50).map((p) => ({
      name: p.name,
      path: `/p/pool-pros/${p.slug}`,
      image: p.logo_url
    })), title);
    return {
      ...meta,
      scripts: [ldJsonScript(crumbs), ldJsonScript(list)]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter, "component"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent")
});
const UnsubscribeRenterRoute = Route$3l.update({
  id: "/unsubscribe-renter",
  path: "/unsubscribe-renter",
  getParentRoute: () => Route$3m
});
const UnsubscribeHostRoute = Route$3k.update({
  id: "/unsubscribe-host",
  path: "/unsubscribe-host",
  getParentRoute: () => Route$3m
});
const UnsubscribeComposerRoute = Route$3j.update({
  id: "/unsubscribe-composer",
  path: "/unsubscribe-composer",
  getParentRoute: () => Route$3m
});
const UnsubscribeRoute = Route$3i.update({
  id: "/unsubscribe",
  path: "/unsubscribe",
  getParentRoute: () => Route$3m
});
const Sm74buq58vDotxmlRoute = Route$3h.update({
  id: "/sm-74buq58v.xml",
  path: "/sm-74buq58v.xml",
  getParentRoute: () => Route$3m
});
const Sm74buq58vLsDotxmlRoute = Route$3g.update({
  id: "/sm-74buq58v-ls.xml",
  path: "/sm-74buq58v-ls.xml",
  getParentRoute: () => Route$3m
});
const Sm74buq58vHoDotxmlRoute = Route$3f.update({
  id: "/sm-74buq58v-ho.xml",
  path: "/sm-74buq58v-ho.xml",
  getParentRoute: () => Route$3m
});
const Sm74buq58vEvDotxmlRoute = Route$3e.update({
  id: "/sm-74buq58v-ev.xml",
  path: "/sm-74buq58v-ev.xml",
  getParentRoute: () => Route$3m
});
const Sm74buq58vCrDotxmlRoute = Route$3d.update({
  id: "/sm-74buq58v-cr.xml",
  path: "/sm-74buq58v-cr.xml",
  getParentRoute: () => Route$3m
});
const Sm74buq58vCnDotxmlRoute = Route$3c.update({
  id: "/sm-74buq58v-cn.xml",
  path: "/sm-74buq58v-cn.xml",
  getParentRoute: () => Route$3m
});
const Sm74buq58vAdDotxmlRoute = Route$3b.update({
  id: "/sm-74buq58v-ad.xml",
  path: "/sm-74buq58v-ad.xml",
  getParentRoute: () => Route$3m
});
const SitemapDotxmlRoute = Route$3a.update({
  id: "/sitemap.xml",
  path: "/sitemap.xml",
  getParentRoute: () => Route$3m
});
const SitemapStaticDotxmlRoute = Route$39.update({
  id: "/sitemap-static.xml",
  path: "/sitemap-static.xml",
  getParentRoute: () => Route$3m
});
const SitemapRecentPagesDotxmlRoute = Route$38.update({
  id: "/sitemap-recent-pages.xml",
  path: "/sitemap-recent-pages.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesSwimInstructorDotxmlRoute = Route$37.update({
  id: "/sitemap-pages-swim-instructor.xml",
  path: "/sitemap-pages-swim-instructor.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesSpanishDotxmlRoute = Route$36.update({
  id: "/sitemap-pages-spanish.xml",
  path: "/sitemap-pages-spanish.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesMoneyDotxmlRoute = Route$35.update({
  id: "/sitemap-pages-money.xml",
  path: "/sitemap-pages-money.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesHostAcquisitionDotxmlRoute = Route$34.update({
  id: "/sitemap-pages-host-acquisition.xml",
  path: "/sitemap-pages-host-acquisition.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesEventGuidesDotxmlRoute = Route$33.update({
  id: "/sitemap-pages-event-guides.xml",
  path: "/sitemap-pages-event-guides.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesCoursesDotxmlRoute = Route$32.update({
  id: "/sitemap-pages-courses.xml",
  path: "/sitemap-pages-courses.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesComparisonsDotxmlRoute = Route$31.update({
  id: "/sitemap-pages-comparisons.xml",
  path: "/sitemap-pages-comparisons.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesCitiesDotxmlRoute = Route$30.update({
  id: "/sitemap-pages-cities.xml",
  path: "/sitemap-pages-cities.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesBlogDotxmlRoute = Route$2$.update({
  id: "/sitemap-pages-blog.xml",
  path: "/sitemap-pages-blog.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesArticlesDotxmlRoute = Route$2_.update({
  id: "/sitemap-pages-articles.xml",
  path: "/sitemap-pages-articles.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesAdvocacyDotxmlRoute = Route$2Z.update({
  id: "/sitemap-pages-advocacy.xml",
  path: "/sitemap-pages-advocacy.xml",
  getParentRoute: () => Route$3m
});
const SitemapPagesAcademyDotxmlRoute = Route$2Y.update({
  id: "/sitemap-pages-academy.xml",
  path: "/sitemap-pages-academy.xml",
  getParentRoute: () => Route$3m
});
const SitemapListingsDotxmlRoute = Route$2X.update({
  id: "/sitemap-listings.xml",
  path: "/sitemap-listings.xml",
  getParentRoute: () => Route$3m
});
const SitemapIndexDotxmlRoute = Route$2W.update({
  id: "/sitemap-index.xml",
  path: "/sitemap-index.xml",
  getParentRoute: () => Route$3m
});
const SitemapHubDotxmlRoute = Route$2V.update({
  id: "/sitemap-hub.xml",
  path: "/sitemap-hub.xml",
  getParentRoute: () => Route$3m
});
const SitemapDirectoryDotxmlRoute = Route$2U.update({
  id: "/sitemap-directory.xml",
  path: "/sitemap-directory.xml",
  getParentRoute: () => Route$3m
});
const SitemapDefaultDotxmlRoute = Route$2T.update({
  id: "/sitemap-default.xml",
  path: "/sitemap-default.xml",
  getParentRoute: () => Route$3m
});
const RobotsDottxtRoute = Route$2S.update({
  id: "/robots.txt",
  path: "/robots.txt",
  getParentRoute: () => Route$3m
});
const PoolsDirectorySitemapDotxmlRoute = Route$2R.update({
  id: "/pools-directory-sitemap.xml",
  path: "/pools-directory-sitemap.xml",
  getParentRoute: () => Route$3m
});
const LandingPageRoute = Route$2Q.update({
  id: "/landing-page",
  path: "/landing-page",
  getParentRoute: () => Route$3m
});
const JobsDotxmlRoute = Route$2P.update({
  id: "/jobs.xml",
  path: "/jobs.xml",
  getParentRoute: () => Route$3m
});
const BlogRoute = Route$2O.update({
  id: "/blog",
  path: "/blog",
  getParentRoute: () => Route$3m
});
const AuthRoute = Route$2N.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$3m
});
const AffiliateRoute = Route$2M.update({
  id: "/affiliate",
  path: "/affiliate",
  getParentRoute: () => Route$3m
});
const AdminRoute = Route$2L.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$3m
});
const IndexRoute = Route$2K.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$3m
});
const VerifyUidRoute = Route$2J.update({
  id: "/verify/$uid",
  path: "/verify/$uid",
  getParentRoute: () => Route$3m
});
const TechnicalSupportSplatRoute = Route$2I.update({
  id: "/technical-support/$",
  path: "/technical-support/$",
  getParentRoute: () => Route$3m
});
const PoolManagementSplatRoute = Route$2H.update({
  id: "/pool-management/$",
  path: "/pool-management/$",
  getParentRoute: () => Route$3m
});
const PWaiverGeneratorRoute = Route$2G.update({
  id: "/p/waiver-generator",
  path: "/p/waiver-generator",
  getParentRoute: () => Route$3m
});
const PWaitlistSignupRoute = Route$2F.update({
  id: "/p/waitlist-signup",
  path: "/p/waitlist-signup",
  getParentRoute: () => Route$3m
});
const PSwimplyAlternativeVsPoolRentalNearMeRoute = Route$2E.update({
  id: "/p/swimply-alternative-vs-pool-rental-near-me",
  path: "/p/swimply-alternative-vs-pool-rental-near-me",
  getParentRoute: () => Route$3m
});
const PStartHostingRoute = Route$2D.update({
  id: "/p/start-hosting",
  path: "/p/start-hosting",
  getParentRoute: () => Route$3m
});
const PSharetribeRoute = Route$2C.update({
  id: "/p/sharetribe",
  path: "/p/sharetribe",
  getParentRoute: () => Route$3m
});
const PPrivatePoolRentalRoute = Route$2B.update({
  id: "/p/private-pool-rental",
  path: "/p/private-pool-rental",
  getParentRoute: () => Route$3m
});
const PPrivacyRequestRoute = Route$2A.update({
  id: "/p/privacy-request",
  path: "/p/privacy-request",
  getParentRoute: () => Route$3m
});
const PPoolWifiGuideRoute = Route$2z.update({
  id: "/p/pool-wifi-guide",
  path: "/p/pool-wifi-guide",
  getParentRoute: () => Route$3m
});
const PPoolRulesGeneratorRoute = Route$2y.update({
  id: "/p/pool-rules-generator",
  path: "/p/pool-rules-generator",
  getParentRoute: () => Route$3m
});
const PPoolRentalsChar123stateChar125Route = Route$2x.update({
  id: "/p/pool-rentals-{$state}",
  path: "/p/pool-rentals-{$state}",
  getParentRoute: () => Route$3m
});
const PPoolRentalsRoute = Route$2w.update({
  id: "/p/pool-rentals",
  path: "/p/pool-rentals",
  getParentRoute: () => Route$3m
});
const PPoolRentalPermitsByStateRoute = Route$2v.update({
  id: "/p/pool-rental-permits-by-state",
  path: "/p/pool-rental-permits-by-state",
  getParentRoute: () => Route$3m
});
const PPoolRentalInsuranceExplainedRoute = Route$2u.update({
  id: "/p/pool-rental-insurance-explained",
  path: "/p/pool-rental-insurance-explained",
  getParentRoute: () => Route$3m
});
const PPoolRentalHostFeesComparedRoute = Route$2t.update({
  id: "/p/pool-rental-host-fees-compared",
  path: "/p/pool-rental-host-fees-compared",
  getParentRoute: () => Route$3m
});
const PPoolRentalAppRoute = Route$2s.update({
  id: "/p/pool-rental-app",
  path: "/p/pool-rental-app",
  getParentRoute: () => Route$3m
});
const PPoolProsRoute = Route$2r.update({
  id: "/p/pool-pros",
  path: "/p/pool-pros",
  getParentRoute: () => Route$3m
});
const PPoolPartyRentalsRoute = Route$2q.update({
  id: "/p/pool-party-rentals",
  path: "/p/pool-party-rentals",
  getParentRoute: () => Route$3m
});
const PPoolHeatingCostCalculatorRoute = Route$2p.update({
  id: "/p/pool-heating-cost-calculator",
  path: "/p/pool-heating-cost-calculator",
  getParentRoute: () => Route$3m
});
const PPeerspaceVsPoolRentalNearMeInChar123cityChar125Route = Route$2o.update({
  id: "/p/peerspace-vs-pool-rental-near-me-in-{$city}",
  path: "/p/peerspace-vs-pool-rental-near-me-in-{$city}",
  getParentRoute: () => Route$3m
});
const PPeerspaceVsPoolRentalNearMeRoute = Route$2n.update({
  id: "/p/peerspace-vs-pool-rental-near-me",
  path: "/p/peerspace-vs-pool-rental-near-me",
  getParentRoute: () => Route$3m
});
const PNeighborsRoute = Route$2m.update({
  id: "/p/neighbors",
  path: "/p/neighbors",
  getParentRoute: () => Route$3m
});
const PLukesLoungeRoute = Route$2l.update({
  id: "/p/lukes-lounge",
  path: "/p/lukes-lounge",
  getParentRoute: () => Route$3m
});
const PLaSaltwaterFeaturedRoute = Route$2k.update({
  id: "/p/la-saltwater-featured",
  path: "/p/la-saltwater-featured",
  getParentRoute: () => Route$3m
});
const PJanRoute = Route$2j.update({
  id: "/p/jan",
  path: "/p/jan",
  getParentRoute: () => Route$3m
});
const PHowItWorksRoute = Route$2i.update({
  id: "/p/how-it-works",
  path: "/p/how-it-works",
  getParentRoute: () => Route$3m
});
const PHostingRoute = Route$2h.update({
  id: "/p/hosting",
  path: "/p/hosting",
  getParentRoute: () => Route$3m
});
const PHostMarketingPlaybookRoute = Route$2g.update({
  id: "/p/host-marketing-playbook",
  path: "/p/host-marketing-playbook",
  getParentRoute: () => Route$3m
});
const PGiggsterVsPoolRentalNearMeInChar123cityChar125Route = Route$2f.update({
  id: "/p/giggster-vs-pool-rental-near-me-in-{$city}",
  path: "/p/giggster-vs-pool-rental-near-me-in-{$city}",
  getParentRoute: () => Route$3m
});
const PGiggsterVsPoolRentalNearMeRoute = Route$2e.update({
  id: "/p/giggster-vs-pool-rental-near-me",
  path: "/p/giggster-vs-pool-rental-near-me",
  getParentRoute: () => Route$3m
});
const PFreeHostToolsRoute = Route$2d.update({
  id: "/p/free-host-tools",
  path: "/p/free-host-tools",
  getParentRoute: () => Route$3m
});
const PEarningsCalculatorRoute = Route$2c.update({
  id: "/p/earnings-calculator",
  path: "/p/earnings-calculator",
  getParentRoute: () => Route$3m
});
const PDogRoute = Route$2b.update({
  id: "/p/dog",
  path: "/p/dog",
  getParentRoute: () => Route$3m
});
const PBlogRoute = Route$2a.update({
  id: "/p/blog",
  path: "/p/blog",
  getParentRoute: () => Route$3m
});
const PAllLocationsRoute = Route$29.update({
  id: "/p/all-locations",
  path: "/p/all-locations",
  getParentRoute: () => Route$3m
});
const PAiListingGeneratorRoute = Route$28.update({
  id: "/p/ai-listing-generator",
  path: "/p/ai-listing-generator",
  getParentRoute: () => Route$3m
});
const PAffiliateProgramRoute = Route$27.update({
  id: "/p/affiliate-program",
  path: "/p/affiliate-program",
  getParentRoute: () => Route$3m
});
const PAffiliateDashboardRoute = Route$26.update({
  id: "/p/affiliate-dashboard",
  path: "/p/affiliate-dashboard",
  getParentRoute: () => Route$3m
});
const PAffiliateRoute = Route$25.update({
  id: "/p/affiliate",
  path: "/p/affiliate",
  getParentRoute: () => Route$3m
});
const PAboutOurCompanyRoute = Route$24.update({
  id: "/p/about-our-company",
  path: "/p/about-our-company",
  getParentRoute: () => Route$3m
});
const PSlugRoute = Route$23.update({
  id: "/p/$slug",
  path: "/p/$slug",
  getParentRoute: () => Route$3m
});
const PSplatRoute = Route$22.update({
  id: "/p/$",
  path: "/p/$",
  getParentRoute: () => Route$3m
});
const MarketingAndGrowthSplatRoute = Route$21.update({
  id: "/marketing-and-growth/$",
  path: "/marketing-and-growth/$",
  getParentRoute: () => Route$3m
});
const LegalAndComplianceSplatRoute = Route$20.update({
  id: "/legal-and-compliance/$",
  path: "/legal-and-compliance/$",
  getParentRoute: () => Route$3m
});
const HostInformationSplatRoute = Route$1$.update({
  id: "/host-information/$",
  path: "/host-information/$",
  getParentRoute: () => Route$3m
});
const GuestInformationSplatRoute = Route$1_.update({
  id: "/guest-information/$",
  path: "/guest-information/$",
  getParentRoute: () => Route$3m
});
const ForHostsSplatRoute = Route$1Z.update({
  id: "/for-hosts/$",
  path: "/for-hosts/$",
  getParentRoute: () => Route$3m
});
const ForGuestsSplatRoute = Route$1Y.update({
  id: "/for-guests/$",
  path: "/for-guests/$",
  getParentRoute: () => Route$3m
});
const EmailUnsubscribeRoute = Route$1X.update({
  id: "/email/unsubscribe",
  path: "/email/unsubscribe",
  getParentRoute: () => Route$3m
});
const BlogSplatRoute = Route$1W.update({
  id: "/$",
  path: "/$",
  getParentRoute: () => BlogRoute
});
const AuthResetPasswordRoute = Route$1V.update({
  id: "/reset-password",
  path: "/reset-password",
  getParentRoute: () => AuthRoute
});
const AdminTechDocsRoute = Route$1U.update({
  id: "/tech-docs",
  path: "/tech-docs",
  getParentRoute: () => AdminRoute
});
const AdminTeamRoute = Route$1T.update({
  id: "/team",
  path: "/team",
  getParentRoute: () => AdminRoute
});
const AdminSocialLeadHunterRoute = Route$1S.update({
  id: "/social-lead-hunter",
  path: "/social-lead-hunter",
  getParentRoute: () => AdminRoute
});
const AdminSmsBlastRoute = Route$1R.update({
  id: "/sms-blast",
  path: "/sms-blast",
  getParentRoute: () => AdminRoute
});
const AdminSiteFooterRoute = Route$1Q.update({
  id: "/site-footer",
  path: "/site-footer",
  getParentRoute: () => AdminRoute
});
const AdminSharetribePruneRoute = Route$1P.update({
  id: "/sharetribe-prune",
  path: "/sharetribe-prune",
  getParentRoute: () => AdminRoute
});
const AdminSharetribeRoute = Route$1O.update({
  id: "/sharetribe",
  path: "/sharetribe",
  getParentRoute: () => AdminRoute
});
const AdminSeoHealthRoute = Route$1N.update({
  id: "/seo-health",
  path: "/seo-health",
  getParentRoute: () => AdminRoute
});
const AdminSeoCriticRoute = Route$1M.update({
  id: "/seo-critic",
  path: "/seo-critic",
  getParentRoute: () => AdminRoute
});
const AdminSeoCoachRoute = Route$1L.update({
  id: "/seo-coach",
  path: "/seo-coach",
  getParentRoute: () => AdminRoute
});
const AdminScrapeImportRoute = Route$1K.update({
  id: "/scrape-import",
  path: "/scrape-import",
  getParentRoute: () => AdminRoute
});
const AdminRenterDripRoute = Route$1J.update({
  id: "/renter-drip",
  path: "/renter-drip",
  getParentRoute: () => AdminRoute
});
const AdminRedirectAliasesRoute = Route$1I.update({
  id: "/redirect-aliases",
  path: "/redirect-aliases",
  getParentRoute: () => AdminRoute
});
const AdminRankTrackerRoute = Route$1H.update({
  id: "/rank-tracker",
  path: "/rank-tracker",
  getParentRoute: () => AdminRoute
});
const AdminQuickPageRoute = Route$1G.update({
  id: "/quick-page",
  path: "/quick-page",
  getParentRoute: () => AdminRoute
});
const AdminPrnmCoachRoute = Route$1F.update({
  id: "/prnm-coach",
  path: "/prnm-coach",
  getParentRoute: () => AdminRoute
});
const AdminPrivacyRequestsRoute = Route$1E.update({
  id: "/privacy-requests",
  path: "/privacy-requests",
  getParentRoute: () => AdminRoute
});
const AdminPlanRequestsRoute = Route$1D.update({
  id: "/plan-requests",
  path: "/plan-requests",
  getParentRoute: () => AdminRoute
});
const AdminPageHealthRoute = Route$1C.update({
  id: "/page-health",
  path: "/page-health",
  getParentRoute: () => AdminRoute
});
const AdminPageAuditorRoute = Route$1B.update({
  id: "/page-auditor",
  path: "/page-auditor",
  getParentRoute: () => AdminRoute
});
const AdminOpportunitiesRoute = Route$1A.update({
  id: "/opportunities",
  path: "/opportunities",
  getParentRoute: () => AdminRoute
});
const AdminNoAccessRoute = Route$1z.update({
  id: "/no-access",
  path: "/no-access",
  getParentRoute: () => AdminRoute
});
const AdminMissingPagesRoute = Route$1y.update({
  id: "/missing-pages",
  path: "/missing-pages",
  getParentRoute: () => AdminRoute
});
const AdminMarketplaceRoute = Route$1x.update({
  id: "/marketplace",
  path: "/marketplace",
  getParentRoute: () => AdminRoute
});
const AdminListingAuditorRoute = Route$1w.update({
  id: "/listing-auditor",
  path: "/listing-auditor",
  getParentRoute: () => AdminRoute
});
const AdminLinkCheckerRoute = Route$1v.update({
  id: "/link-checker",
  path: "/link-checker",
  getParentRoute: () => AdminRoute
});
const AdminLinkAutoRepairRoute = Route$1u.update({
  id: "/link-auto-repair",
  path: "/link-auto-repair",
  getParentRoute: () => AdminRoute
});
const AdminLinkAuditRoute = Route$1t.update({
  id: "/link-audit",
  path: "/link-audit",
  getParentRoute: () => AdminRoute
});
const AdminLearningRoute = Route$1s.update({
  id: "/learning",
  path: "/learning",
  getParentRoute: () => AdminRoute
});
const AdminLeadsRoute = Route$1r.update({
  id: "/leads",
  path: "/leads",
  getParentRoute: () => AdminRoute
});
const AdminLandingLinkCheckRoute = Route$1q.update({
  id: "/landing-link-check",
  path: "/landing-link-check",
  getParentRoute: () => AdminRoute
});
const AdminKeywordOpportunitiesRoute = Route$1p.update({
  id: "/keyword-opportunities",
  path: "/keyword-opportunities",
  getParentRoute: () => AdminRoute
});
const AdminJobHistoryRoute = Route$1o.update({
  id: "/job-history",
  path: "/job-history",
  getParentRoute: () => AdminRoute
});
const AdminInternalLinksRoute = Route$1n.update({
  id: "/internal-links",
  path: "/internal-links",
  getParentRoute: () => AdminRoute
});
const AdminIndexingRoute = Route$1m.update({
  id: "/indexing",
  path: "/indexing",
  getParentRoute: () => AdminRoute
});
const AdminIgLeadHunterRoute = Route$1l.update({
  id: "/ig-lead-hunter",
  path: "/ig-lead-hunter",
  getParentRoute: () => AdminRoute
});
const AdminHostDripRoute = Route$1k.update({
  id: "/host-drip",
  path: "/host-drip",
  getParentRoute: () => AdminRoute
});
const AdminGscImportRoute = Route$1j.update({
  id: "/gsc-import",
  path: "/gsc-import",
  getParentRoute: () => AdminRoute
});
const AdminGenerateContentRoute = Route$1i.update({
  id: "/generate-content",
  path: "/generate-content",
  getParentRoute: () => AdminRoute
});
const AdminFounderBlastRoute = Route$1h.update({
  id: "/founder-blast",
  path: "/founder-blast",
  getParentRoute: () => AdminRoute
});
const AdminFollowupRemindersRoute = Route$1g.update({
  id: "/followup-reminders",
  path: "/followup-reminders",
  getParentRoute: () => AdminRoute
});
const AdminFollowupPerformanceRoute = Route$1f.update({
  id: "/followup-performance",
  path: "/followup-performance",
  getParentRoute: () => AdminRoute
});
const AdminFollowupDrilldownRoute = Route$1e.update({
  id: "/followup-drilldown",
  path: "/followup-drilldown",
  getParentRoute: () => AdminRoute
});
const AdminFollowUpsRoute = Route$1d.update({
  id: "/follow-ups",
  path: "/follow-ups",
  getParentRoute: () => AdminRoute
});
const AdminFaqGeneratorRoute = Route$1c.update({
  id: "/faq-generator",
  path: "/faq-generator",
  getParentRoute: () => AdminRoute
});
const AdminEmailVerifyRoute = Route$1b.update({
  id: "/email-verify",
  path: "/email-verify",
  getParentRoute: () => AdminRoute
});
const AdminEmailQueueRoute = Route$1a.update({
  id: "/email-queue",
  path: "/email-queue",
  getParentRoute: () => AdminRoute
});
const AdminEmailDeliverabilityRoute = Route$19.update({
  id: "/email-deliverability",
  path: "/email-deliverability",
  getParentRoute: () => AdminRoute
});
const AdminEmailComposerRoute = Route$18.update({
  id: "/email-composer",
  path: "/email-composer",
  getParentRoute: () => AdminRoute
});
const AdminEmailBrandingRoute = Route$17.update({
  id: "/email-branding",
  path: "/email-branding",
  getParentRoute: () => AdminRoute
});
const AdminDripSubscribersRoute = Route$16.update({
  id: "/drip-subscribers",
  path: "/drip-subscribers",
  getParentRoute: () => AdminRoute
});
const AdminDirectoryRoute = Route$15.update({
  id: "/directory",
  path: "/directory",
  getParentRoute: () => AdminRoute
});
const AdminDataImportRoute = Route$14.update({
  id: "/data-import",
  path: "/data-import",
  getParentRoute: () => AdminRoute
});
const AdminDataExportRoute = Route$13.update({
  id: "/data-export",
  path: "/data-export",
  getParentRoute: () => AdminRoute
});
const AdminDashboardRoute = Route$12.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AdminRoute
});
const AdminContentPagesRoute = Route$11.update({
  id: "/content-pages",
  path: "/content-pages",
  getParentRoute: () => AdminRoute
});
const AdminContentMigrationRoute = Route$10.update({
  id: "/content-migration",
  path: "/content-migration",
  getParentRoute: () => AdminRoute
});
const AdminContentHealthRoute = Route$$.update({
  id: "/content-health",
  path: "/content-health",
  getParentRoute: () => AdminRoute
});
const AdminCompetitorsRoute = Route$_.update({
  id: "/competitors",
  path: "/competitors",
  getParentRoute: () => AdminRoute
});
const AdminCompetitorRadarRoute = Route$Z.update({
  id: "/competitor-radar",
  path: "/competitor-radar",
  getParentRoute: () => AdminRoute
});
const AdminClickReportRoute = Route$Y.update({
  id: "/click-report",
  path: "/click-report",
  getParentRoute: () => AdminRoute
});
const AdminClaimsRoute = Route$X.update({
  id: "/claims",
  path: "/claims",
  getParentRoute: () => AdminRoute
});
const AdminCitiesHeroesReportRoute = Route$W.update({
  id: "/cities-heroes-report",
  path: "/cities-heroes-report",
  getParentRoute: () => AdminRoute
});
const AdminCitiesHeroesRoute = Route$V.update({
  id: "/cities-heroes",
  path: "/cities-heroes",
  getParentRoute: () => AdminRoute
});
const AdminBlogRoute = Route$U.update({
  id: "/blog",
  path: "/blog",
  getParentRoute: () => AdminRoute
});
const AdminAutoRefreshRoute = Route$T.update({
  id: "/auto-refresh",
  path: "/auto-refresh",
  getParentRoute: () => AdminRoute
});
const AdminAutoOutreachRoute = Route$S.update({
  id: "/auto-outreach",
  path: "/auto-outreach",
  getParentRoute: () => AdminRoute
});
const AdminAffiliatesRoute = Route$R.update({
  id: "/affiliates",
  path: "/affiliates",
  getParentRoute: () => AdminRoute
});
const AdminAddContactsRoute = Route$Q.update({
  id: "/add-contacts",
  path: "/add-contacts",
  getParentRoute: () => AdminRoute
});
const AdminActivityCitiesRoute = Route$P.update({
  id: "/activity-cities",
  path: "/activity-cities",
  getParentRoute: () => AdminRoute
});
const AccountLearningRoute = Route$O.update({
  id: "/account/learning",
  path: "/account/learning",
  getParentRoute: () => Route$3m
});
const PPoolProsSlugRoute = Route$N.update({
  id: "/$slug",
  path: "/$slug",
  getParentRoute: () => PPoolProsRoute
});
const PEsSlugRoute = Route$M.update({
  id: "/p/es/$slug",
  path: "/p/es/$slug",
  getParentRoute: () => Route$3m
});
const PCourseSlugRoute = Route$L.update({
  id: "/p/course/$slug",
  path: "/p/course/$slug",
  getParentRoute: () => Route$3m
});
const PAuthorDerekBowenRoute = Route$K.update({
  id: "/p/author/derek-bowen",
  path: "/p/author/derek-bowen",
  getParentRoute: () => Route$3m
});
const LovableEmailSuppressionRoute = Route$J.update({
  id: "/lovable/email/suppression",
  path: "/lovable/email/suppression",
  getParentRoute: () => Route$3m
});
const LovableEmailEmailitWebhookRoute = Route$I.update({
  id: "/lovable/email/emailit-webhook",
  path: "/lovable/email/emailit-webhook",
  getParentRoute: () => Route$3m
});
const LSlugIdRoute = Route$H.update({
  id: "/l/$slug/$id",
  path: "/l/$slug/$id",
  getParentRoute: () => Route$3m
});
const ApiPublicTrackCityClickRoute = Route$G.update({
  id: "/api/public/track-city-click",
  path: "/api/public/track-city-click",
  getParentRoute: () => Route$3m
});
const ApiPublicLinkHealthRoute = Route$F.update({
  id: "/api/public/link-health",
  path: "/api/public/link-health",
  getParentRoute: () => Route$3m
});
const ApiPublicBackfillContentPagesRoute = Route$E.update({
  id: "/api/public/backfill-content-pages",
  path: "/api/public/backfill-content-pages",
  getParentRoute: () => Route$3m
});
const ApiAdminDataExportRoute = Route$D.update({
  id: "/api/admin/data-export",
  path: "/api/admin/data-export",
  getParentRoute: () => Route$3m
});
const AdminLearningUserIdRoute = Route$C.update({
  id: "/$userId",
  path: "/$userId",
  getParentRoute: () => AdminLearningRoute
});
const PPoolProsCCategoryRoute = Route$B.update({
  id: "/c/$category",
  path: "/c/$category",
  getParentRoute: () => PPoolProsRoute
});
const LovableEmailTransactionalSendRoute = Route$A.update({
  id: "/lovable/email/transactional/send",
  path: "/lovable/email/transactional/send",
  getParentRoute: () => Route$3m
});
const LovableEmailTransactionalPreviewRoute = Route$z.update({
  id: "/lovable/email/transactional/preview",
  path: "/lovable/email/transactional/preview",
  getParentRoute: () => Route$3m
});
const LovableEmailQueueProcessRoute = Route$y.update({
  id: "/lovable/email/queue/process",
  path: "/lovable/email/queue/process",
  getParentRoute: () => Route$3m
});
const LovableEmailAuthWebhookRoute = Route$x.update({
  id: "/lovable/email/auth/webhook",
  path: "/lovable/email/auth/webhook",
  getParentRoute: () => Route$3m
});
const LovableEmailAuthPreviewRoute = Route$w.update({
  id: "/lovable/email/auth/preview",
  path: "/lovable/email/auth/preview",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksTwilioInboundRoute = Route$v.update({
  id: "/api/public/hooks/twilio-inbound",
  path: "/api/public/hooks/twilio-inbound",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksSyncSharetribeMirrorRoute = Route$u.update({
  id: "/api/public/hooks/sync-sharetribe-mirror",
  path: "/api/public/hooks/sync-sharetribe-mirror",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksSyncListingsRoute = Route$t.update({
  id: "/api/public/hooks/sync-listings",
  path: "/api/public/hooks/sync-listings",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksSyncAffiliateCommissionsRoute = Route$s.update({
  id: "/api/public/hooks/sync-affiliate-commissions",
  path: "/api/public/hooks/sync-affiliate-commissions",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksSmsSenderRoute = Route$r.update({
  id: "/api/public/hooks/sms-sender",
  path: "/api/public/hooks/sms-sender",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksSeoSelfTestRoute = Route$q.update({
  id: "/api/public/hooks/seo-self-test",
  path: "/api/public/hooks/seo-self-test",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksSeoFixWorkerRoute = Route$p.update({
  id: "/api/public/hooks/seo-fix-worker",
  path: "/api/public/hooks/seo-fix-worker",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksSendRenterEmailsRoute = Route$o.update({
  id: "/api/public/hooks/send-renter-emails",
  path: "/api/public/hooks/send-renter-emails",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksSendHostDripEmailsRoute = Route$n.update({
  id: "/api/public/hooks/send-host-drip-emails",
  path: "/api/public/hooks/send-host-drip-emails",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksProviderAiWorkerRoute = Route$m.update({
  id: "/api/public/hooks/provider-ai-worker",
  path: "/api/public/hooks/provider-ai-worker",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksPollSharetribeRentersRoute = Route$l.update({
  id: "/api/public/hooks/poll-sharetribe-renters",
  path: "/api/public/hooks/poll-sharetribe-renters",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksPollSharetribeHostsRoute = Route$k.update({
  id: "/api/public/hooks/poll-sharetribe-hosts",
  path: "/api/public/hooks/poll-sharetribe-hosts",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksLinkAutoFixRoute = Route$j.update({
  id: "/api/public/hooks/link-auto-fix",
  path: "/api/public/hooks/link-auto-fix",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksIntercomSyncRoute = Route$i.update({
  id: "/api/public/hooks/intercom-sync",
  path: "/api/public/hooks/intercom-sync",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksIntercomRoute = Route$h.update({
  id: "/api/public/hooks/intercom",
  path: "/api/public/hooks/intercom",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksIgLeadHunterRoute = Route$g.update({
  id: "/api/public/hooks/ig-lead-hunter",
  path: "/api/public/hooks/ig-lead-hunter",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksHostCityTailFixRoute = Route$f.update({
  id: "/api/public/hooks/host-city-tail-fix",
  path: "/api/public/hooks/host-city-tail-fix",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksGscSyncRoute = Route$e.update({
  id: "/api/public/hooks/gsc-sync",
  path: "/api/public/hooks/gsc-sync",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksGenHostPagesRoute = Route$d.update({
  id: "/api/public/hooks/gen-host-pages",
  path: "/api/public/hooks/gen-host-pages",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksFollowupRemindersRoute = Route$c.update({
  id: "/api/public/hooks/followup-reminders",
  path: "/api/public/hooks/followup-reminders",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksEnrollHostSignupsRoute = Route$b.update({
  id: "/api/public/hooks/enroll-host-signups",
  path: "/api/public/hooks/enroll-host-signups",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksDailySeoDigestRoute = Route$a.update({
  id: "/api/public/hooks/daily-seo-digest",
  path: "/api/public/hooks/daily-seo-digest",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksComposerScheduledRoute = Route$9.update({
  id: "/api/public/hooks/composer-scheduled",
  path: "/api/public/hooks/composer-scheduled",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksCompetitorRadarScanRoute = Route$8.update({
  id: "/api/public/hooks/competitor-radar-scan",
  path: "/api/public/hooks/competitor-radar-scan",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksBlogAutogenRoute = Route$7.update({
  id: "/api/public/hooks/blog-autogen",
  path: "/api/public/hooks/blog-autogen",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksAutoOutreachWorkerRoute = Route$6.update({
  id: "/api/public/hooks/auto-outreach-worker",
  path: "/api/public/hooks/auto-outreach-worker",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksAliasBackfillRoute = Route$5.update({
  id: "/api/public/hooks/alias-backfill",
  path: "/api/public/hooks/alias-backfill",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksAcademyHealthRoute = Route$4.update({
  id: "/api/public/hooks/academy-health",
  path: "/api/public/hooks/academy-health",
  getParentRoute: () => Route$3m
});
const ApiPublicHooksAbAutoWinnerRoute = Route$3.update({
  id: "/api/public/hooks/ab-auto-winner",
  path: "/api/public/hooks/ab-auto-winner",
  getParentRoute: () => Route$3m
});
const ApiCertificatesUidPdfRoute = Route$2.update({
  id: "/api/certificates/$uid/pdf",
  path: "/api/certificates/$uid/pdf",
  getParentRoute: () => Route$3m
});
const PPoolProsCCategoryStateRoute = Route$1.update({
  id: "/$state",
  path: "/$state",
  getParentRoute: () => PPoolProsCCategoryRoute
});
const PPoolProsCCategoryStateCityRoute = Route.update({
  id: "/$city",
  path: "/$city",
  getParentRoute: () => PPoolProsCCategoryStateRoute
});
const AdminLearningRouteChildren = {
  AdminLearningUserIdRoute
};
const AdminLearningRouteWithChildren = AdminLearningRoute._addFileChildren(
  AdminLearningRouteChildren
);
const AdminRouteChildren = {
  AdminActivityCitiesRoute,
  AdminAddContactsRoute,
  AdminAffiliatesRoute,
  AdminAutoOutreachRoute,
  AdminAutoRefreshRoute,
  AdminBlogRoute,
  AdminCitiesHeroesRoute,
  AdminCitiesHeroesReportRoute,
  AdminClaimsRoute,
  AdminClickReportRoute,
  AdminCompetitorRadarRoute,
  AdminCompetitorsRoute,
  AdminContentHealthRoute,
  AdminContentMigrationRoute,
  AdminContentPagesRoute,
  AdminDashboardRoute,
  AdminDataExportRoute,
  AdminDataImportRoute,
  AdminDirectoryRoute,
  AdminDripSubscribersRoute,
  AdminEmailBrandingRoute,
  AdminEmailComposerRoute,
  AdminEmailDeliverabilityRoute,
  AdminEmailQueueRoute,
  AdminEmailVerifyRoute,
  AdminFaqGeneratorRoute,
  AdminFollowUpsRoute,
  AdminFollowupDrilldownRoute,
  AdminFollowupPerformanceRoute,
  AdminFollowupRemindersRoute,
  AdminFounderBlastRoute,
  AdminGenerateContentRoute,
  AdminGscImportRoute,
  AdminHostDripRoute,
  AdminIgLeadHunterRoute,
  AdminIndexingRoute,
  AdminInternalLinksRoute,
  AdminJobHistoryRoute,
  AdminKeywordOpportunitiesRoute,
  AdminLandingLinkCheckRoute,
  AdminLeadsRoute,
  AdminLearningRoute: AdminLearningRouteWithChildren,
  AdminLinkAuditRoute,
  AdminLinkAutoRepairRoute,
  AdminLinkCheckerRoute,
  AdminListingAuditorRoute,
  AdminMarketplaceRoute,
  AdminMissingPagesRoute,
  AdminNoAccessRoute,
  AdminOpportunitiesRoute,
  AdminPageAuditorRoute,
  AdminPageHealthRoute,
  AdminPlanRequestsRoute,
  AdminPrivacyRequestsRoute,
  AdminPrnmCoachRoute,
  AdminQuickPageRoute,
  AdminRankTrackerRoute,
  AdminRedirectAliasesRoute,
  AdminRenterDripRoute,
  AdminScrapeImportRoute,
  AdminSeoCoachRoute,
  AdminSeoCriticRoute,
  AdminSeoHealthRoute,
  AdminSharetribeRoute,
  AdminSharetribePruneRoute,
  AdminSiteFooterRoute,
  AdminSmsBlastRoute,
  AdminSocialLeadHunterRoute,
  AdminTeamRoute,
  AdminTechDocsRoute
};
const AdminRouteWithChildren = AdminRoute._addFileChildren(AdminRouteChildren);
const AuthRouteChildren = {
  AuthResetPasswordRoute
};
const AuthRouteWithChildren = AuthRoute._addFileChildren(AuthRouteChildren);
const BlogRouteChildren = {
  BlogSplatRoute
};
const BlogRouteWithChildren = BlogRoute._addFileChildren(BlogRouteChildren);
const PPoolProsCCategoryStateRouteChildren = {
  PPoolProsCCategoryStateCityRoute
};
const PPoolProsCCategoryStateRouteWithChildren = PPoolProsCCategoryStateRoute._addFileChildren(
  PPoolProsCCategoryStateRouteChildren
);
const PPoolProsCCategoryRouteChildren = {
  PPoolProsCCategoryStateRoute: PPoolProsCCategoryStateRouteWithChildren
};
const PPoolProsCCategoryRouteWithChildren = PPoolProsCCategoryRoute._addFileChildren(PPoolProsCCategoryRouteChildren);
const PPoolProsRouteChildren = {
  PPoolProsSlugRoute,
  PPoolProsCCategoryRoute: PPoolProsCCategoryRouteWithChildren
};
const PPoolProsRouteWithChildren = PPoolProsRoute._addFileChildren(
  PPoolProsRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AdminRoute: AdminRouteWithChildren,
  AffiliateRoute,
  AuthRoute: AuthRouteWithChildren,
  BlogRoute: BlogRouteWithChildren,
  JobsDotxmlRoute,
  LandingPageRoute,
  PoolsDirectorySitemapDotxmlRoute,
  RobotsDottxtRoute,
  SitemapDefaultDotxmlRoute,
  SitemapDirectoryDotxmlRoute,
  SitemapHubDotxmlRoute,
  SitemapIndexDotxmlRoute,
  SitemapListingsDotxmlRoute,
  SitemapPagesAcademyDotxmlRoute,
  SitemapPagesAdvocacyDotxmlRoute,
  SitemapPagesArticlesDotxmlRoute,
  SitemapPagesBlogDotxmlRoute,
  SitemapPagesCitiesDotxmlRoute,
  SitemapPagesComparisonsDotxmlRoute,
  SitemapPagesCoursesDotxmlRoute,
  SitemapPagesEventGuidesDotxmlRoute,
  SitemapPagesHostAcquisitionDotxmlRoute,
  SitemapPagesMoneyDotxmlRoute,
  SitemapPagesSpanishDotxmlRoute,
  SitemapPagesSwimInstructorDotxmlRoute,
  SitemapRecentPagesDotxmlRoute,
  SitemapStaticDotxmlRoute,
  SitemapDotxmlRoute,
  Sm74buq58vAdDotxmlRoute,
  Sm74buq58vCnDotxmlRoute,
  Sm74buq58vCrDotxmlRoute,
  Sm74buq58vEvDotxmlRoute,
  Sm74buq58vHoDotxmlRoute,
  Sm74buq58vLsDotxmlRoute,
  Sm74buq58vDotxmlRoute,
  UnsubscribeRoute,
  UnsubscribeComposerRoute,
  UnsubscribeHostRoute,
  UnsubscribeRenterRoute,
  AccountLearningRoute,
  EmailUnsubscribeRoute,
  ForGuestsSplatRoute,
  ForHostsSplatRoute,
  GuestInformationSplatRoute,
  HostInformationSplatRoute,
  LegalAndComplianceSplatRoute,
  MarketingAndGrowthSplatRoute,
  PSplatRoute,
  PSlugRoute,
  PAboutOurCompanyRoute,
  PAffiliateRoute,
  PAffiliateDashboardRoute,
  PAffiliateProgramRoute,
  PAiListingGeneratorRoute,
  PAllLocationsRoute,
  PBlogRoute,
  PDogRoute,
  PEarningsCalculatorRoute,
  PFreeHostToolsRoute,
  PGiggsterVsPoolRentalNearMeRoute,
  PGiggsterVsPoolRentalNearMeInChar123cityChar125Route,
  PHostMarketingPlaybookRoute,
  PHostingRoute,
  PHowItWorksRoute,
  PJanRoute,
  PLaSaltwaterFeaturedRoute,
  PLukesLoungeRoute,
  PNeighborsRoute,
  PPeerspaceVsPoolRentalNearMeRoute,
  PPeerspaceVsPoolRentalNearMeInChar123cityChar125Route,
  PPoolHeatingCostCalculatorRoute,
  PPoolPartyRentalsRoute,
  PPoolProsRoute: PPoolProsRouteWithChildren,
  PPoolRentalAppRoute,
  PPoolRentalHostFeesComparedRoute,
  PPoolRentalInsuranceExplainedRoute,
  PPoolRentalPermitsByStateRoute,
  PPoolRentalsRoute,
  PPoolRentalsChar123stateChar125Route,
  PPoolRulesGeneratorRoute,
  PPoolWifiGuideRoute,
  PPrivacyRequestRoute,
  PPrivatePoolRentalRoute,
  PSharetribeRoute,
  PStartHostingRoute,
  PSwimplyAlternativeVsPoolRentalNearMeRoute,
  PWaitlistSignupRoute,
  PWaiverGeneratorRoute,
  PoolManagementSplatRoute,
  TechnicalSupportSplatRoute,
  VerifyUidRoute,
  ApiAdminDataExportRoute,
  ApiPublicBackfillContentPagesRoute,
  ApiPublicLinkHealthRoute,
  ApiPublicTrackCityClickRoute,
  LSlugIdRoute,
  LovableEmailEmailitWebhookRoute,
  LovableEmailSuppressionRoute,
  PAuthorDerekBowenRoute,
  PCourseSlugRoute,
  PEsSlugRoute,
  ApiCertificatesUidPdfRoute,
  ApiPublicHooksAbAutoWinnerRoute,
  ApiPublicHooksAcademyHealthRoute,
  ApiPublicHooksAliasBackfillRoute,
  ApiPublicHooksAutoOutreachWorkerRoute,
  ApiPublicHooksBlogAutogenRoute,
  ApiPublicHooksCompetitorRadarScanRoute,
  ApiPublicHooksComposerScheduledRoute,
  ApiPublicHooksDailySeoDigestRoute,
  ApiPublicHooksEnrollHostSignupsRoute,
  ApiPublicHooksFollowupRemindersRoute,
  ApiPublicHooksGenHostPagesRoute,
  ApiPublicHooksGscSyncRoute,
  ApiPublicHooksHostCityTailFixRoute,
  ApiPublicHooksIgLeadHunterRoute,
  ApiPublicHooksIntercomRoute,
  ApiPublicHooksIntercomSyncRoute,
  ApiPublicHooksLinkAutoFixRoute,
  ApiPublicHooksPollSharetribeHostsRoute,
  ApiPublicHooksPollSharetribeRentersRoute,
  ApiPublicHooksProviderAiWorkerRoute,
  ApiPublicHooksSendHostDripEmailsRoute,
  ApiPublicHooksSendRenterEmailsRoute,
  ApiPublicHooksSeoFixWorkerRoute,
  ApiPublicHooksSeoSelfTestRoute,
  ApiPublicHooksSmsSenderRoute,
  ApiPublicHooksSyncAffiliateCommissionsRoute,
  ApiPublicHooksSyncListingsRoute,
  ApiPublicHooksSyncSharetribeMirrorRoute,
  ApiPublicHooksTwilioInboundRoute,
  LovableEmailAuthPreviewRoute,
  LovableEmailAuthWebhookRoute,
  LovableEmailQueueProcessRoute,
  LovableEmailTransactionalPreviewRoute,
  LovableEmailTransactionalSendRoute
};
const routeTree = Route$3m._addFileChildren(rootRouteChildren)._addFileTypes();
function extractFirstLocation(stack) {
  if (!stack) return null;
  const lines = stack.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/\(?([^()\s]+:\d+:\d+)\)?$/);
    if (m) return m[1];
  }
  return null;
}
function hashCode(input) {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = (h << 5) + h + input.charCodeAt(i) | 0;
  return (h >>> 0).toString(36).toUpperCase().slice(0, 6);
}
function DefaultErrorComponent({ error, reset }) {
  const router2 = useRouter();
  const name = error?.name || "Error";
  const message = error?.message || "Unknown error";
  const location = extractFirstLocation(error?.stack) || "unknown location";
  const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const code = `ERR-${hashCode(`${name}|${message}|${location}`)}`;
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!/dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(message)) return;
    const k = "fw_chunk_reload_at";
    const last = Number(sessionStorage.getItem(k) || 0);
    if (Date.now() - last > 1e4) {
      sessionStorage.setItem(k, String(Date.now()));
      window.location.reload();
    }
  }, [message]);
  const details = `Code: ${code}
Name: ${name}
Message: ${message}
Location: ${location}
Path: ${path}
Time: ${timestamp}
Stack:
${error?.stack ?? "(no stack)"}`;
  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(details).catch(() => {
      });
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 text-destructive", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" }) }) }),
    /* @__PURE__ */ jsx("h1", { className: "text-center text-2xl font-bold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-center text-sm text-muted-foreground", children: "Copy the details below so it can be fixed fast." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-destructive/30 bg-muted/40 p-4 text-left", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs", children: [
        /* @__PURE__ */ jsx("span", { className: "rounded bg-destructive px-2 py-1 font-mono font-bold text-destructive-foreground", children: code }),
        /* @__PURE__ */ jsx("span", { className: "rounded bg-background px-2 py-1 font-mono text-foreground", children: name }),
        /* @__PURE__ */ jsx("span", { className: "ml-auto font-mono text-muted-foreground", children: timestamp })
      ] }),
      /* @__PURE__ */ jsxs("dl", { className: "mt-3 space-y-2 font-mono text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: "Message" }),
          /* @__PURE__ */ jsx("dd", { className: "break-words text-destructive", children: message })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: "Location" }),
          /* @__PURE__ */ jsx("dd", { className: "break-all text-foreground", children: location })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: "Path" }),
          /* @__PURE__ */ jsx("dd", { className: "break-all text-foreground", children: path || "(ssr)" })
        ] })
      ] }),
      error?.stack && /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
        /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-xs text-muted-foreground", children: "Stack trace" }),
        /* @__PURE__ */ jsx("pre", { className: "mt-2 max-h-64 overflow-auto rounded bg-background p-2 font-mono text-[11px] text-foreground", children: error.stack })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: copy,
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent",
          children: "Copy error details"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent
  });
  if (typeof window !== "undefined") {
    window.addEventListener("vite:preloadError", () => {
      const k = "fw_chunk_reload_at";
      const last = Number(sessionStorage.getItem(k) || 0);
      if (Date.now() - last > 1e4) {
        sessionStorage.setItem(k, String(Date.now()));
        window.location.reload();
      }
    });
  }
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  FAQS$6 as $,
  AuthorBlock as A,
  BREADCRUMBS$6 as B,
  ComparisonPage as C,
  FAQS$9 as D,
  Route$2x as E,
  FAQS$d as F,
  ListingCard as G,
  HomePageContent as H,
  SITE_URL as I,
  Route$2w as J,
  LAST_UPDATED$2 as K,
  LastUpdated as L,
  faqs$4 as M,
  LAST_UPDATED$1 as N,
  faqs$3 as O,
  LAST_UPDATED as P,
  faqs$2 as Q,
  Route$3l as R,
  SiteHeader as S,
  heroImage$1 as T,
  APP_STORE_URL as U,
  PLAY_STORE_URL as V,
  FAQS$8 as W,
  Route$2r as X,
  heroImage as Y,
  FAQS$7 as Z,
  BREADCRUMBS$2 as _,
  Route$3k as a,
  Route$1D as a$,
  Route$2o as a0,
  buildFaqs$1 as a1,
  ComparisonTable as a2,
  faqs$1 as a3,
  Breadcrumbs as a4,
  PATH$d as a5,
  Route$2l as a6,
  heroNight as a7,
  INCLUDED as a8,
  FAQS$5 as a9,
  faqsForContentPage as aA,
  findAdvocacyState as aB,
  ADVOCACY_HUB_PATH as aC,
  ADVOCACY_STATES as aD,
  relatedAdvocacyStates as aE,
  normalizeTitleVariant as aF,
  getVariantCopy as aG,
  AUTHOR_PERSON_JSONLD_REF as aH,
  academyHubPath as aI,
  FredMascot as aJ,
  FloatingFredTip as aK,
  Route$23 as aL,
  academyLangForSlug as aM,
  resolveAcademyHero as aN,
  processSeoFixQueue as aO,
  getSeoJobStatus as aP,
  listSeoBatches as aQ,
  cancelQueuedSeoJobs as aR,
  ShowChromeOverride as aS,
  getSiteFooterAdmin as aT,
  resetSiteFooter as aU,
  updateSiteFooter as aV,
  listSeoIssues as aW,
  enqueueSeoFixJobs as aX,
  aiFixContentPage as aY,
  adminListScrapeJobs as aZ,
  adminScrapeProviderUrl as a_,
  Route$2j as aa,
  PATH$9 as ab,
  STEPS as ac,
  FAQS$4 as ad,
  ACADEMY_HREF as ae,
  FAQS$3 as af,
  BREADCRUMBS$1 as ag,
  FAQS$2 as ah,
  Route$2f as ai,
  cityTier as aj,
  buildFaqs as ak,
  faqs as al,
  APP_URL as am,
  Route$2a as an,
  organizationJsonLd$1 as ao,
  SITE_NAME$3 as ap,
  AUTHOR_PERSON_ID as aq,
  websiteJsonLd as ar,
  Route$29 as as,
  BREADCRUMBS as at,
  FAQS$1 as au,
  FAQS as av,
  PATH$1 as aw,
  HERO_SIZES as ax,
  heroSrcSet as ay,
  heroVariant as az,
  Route$3j as b,
  adminReviewPlanRequest as b0,
  list404s as b1,
  createPageFor404 as b2,
  redirect404 as b3,
  resolve404 as b4,
  adminGetCourseSummary as b5,
  adminListLearners as b6,
  listLeads as b7,
  updateLeadStatus as b8,
  getSeoBatchDetails as b9,
  adminReviewProviderClaim as bA,
  setAffiliateTierOverride as bB,
  listMyLearning as bC,
  listMyProgress as bD,
  ACADEMY_HUB_PATH as bE,
  submitProviderLead as bF,
  Route$N as bG,
  Route$M as bH,
  Route$L as bI,
  courseTwinSlug as bJ,
  PATH as bK,
  LINKEDIN_URL as bL,
  AMAZON_AUTHOR_URL as bM,
  PRESS_URL as bN,
  BOOKS as bO,
  cover as bP,
  amazonUrl as bQ,
  Route$H as bR,
  Route$C as bS,
  adminGetLearnerDetail as bT,
  Route$B as bU,
  Route$1 as bV,
  Route as bW,
  intercom_server as bX,
  router as bY,
  getIndexingStats as ba,
  adminImportGscRows as bb,
  Route$1e as bc,
  getEmailBranding as bd,
  previewAuthEmail as be,
  updateEmailBranding as bf,
  adminListPendingProviders as bg,
  adminGenerateProviderContent as bh,
  adminListProvidersMissingAI as bi,
  adminUpdateProvider as bj,
  listContentPages as bk,
  bulkUpdateContentPages as bl,
  updateContentPage as bm,
  getContentPage as bn,
  listSectionPresets as bo,
  SECTION_PRESETS as bp,
  generateFullPageContent as bq,
  improvePageContent as br,
  generateSeoMeta as bs,
  generateSectionPreset as bt,
  appendAiContentToPage as bu,
  generateCustomSection as bv,
  deleteSectionPreset as bw,
  saveSectionPreset as bx,
  autoFixSeo as by,
  Route$X as bz,
  Route$2Q as c,
  Route$2N as d,
  SiteFooter as e,
  Route$2K as f,
  Route$2J as g,
  coursePath as h,
  heroImage$3 as i,
  CTAPrimary as j,
  HartfordKnockout as k,
  CTAMid as l,
  FAQList as m,
  faqs$5 as n,
  RelatedCompares as o,
  FooterBlock as p,
  BREADCRUMBS$5 as q,
  resolveRedirect as r,
  FAQS$c as s,
  heroImage$2 as t,
  checkAdminRole as u,
  heroImage$4 as v,
  FAQS$b as w,
  BREADCRUMBS$4 as x,
  FAQS$a as y,
  BREADCRUMBS$3 as z
};
