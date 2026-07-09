import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const schema = z.object({
  email: z.string().trim().email().max(255),
  nearestMiles: z.number().nullable().optional(),
  city: z.string().trim().min(1).max(120).nullable().optional(),
  region: z.string().trim().min(1).max(20).nullable().optional()
});
const joinPoolWaitlist = createServerFn({
  method: "POST"
}).inputValidator((data) => schema.parse(data)).handler(createSsrRpc("aa4bdb35470374a924313712806bef27436b63448c847ad43833b6ba622835e0"));
function PoolWaitlistForm({ nearestMiles, city, region }) {
  const join = useServerFn(joinPoolWaitlist);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const where = city ? `${city}${region ? `, ${region}` : ""}` : "your area";
  const milesLabel = nearestMiles !== null ? `${Math.round(nearestMiles).toLocaleString()} miles` : "500+ miles";
  async function onSubmit(e) {
    e.preventDefault();
    if (status === "loading") return;
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed) || trimmed.length > 255) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      await join({ data: { email: trimmed, nearestMiles, city, region } });
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }
  return /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-sm sm:p-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary", children: [
        /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "📍" }),
        " No pools near ",
        where,
        " yet"
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Be first when a pool opens near you" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-3 text-base text-muted-foreground", children: [
        "The closest pool we have is about ",
        /* @__PURE__ */ jsx("strong", { children: milesLabel }),
        " from you. Drop your email and we'll let you know the moment a host lists a pool within driving distance."
      ] })
    ] }),
    status === "success" ? /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-foreground", children: "You're on the list! 🎉" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
        "We'll email you as soon as a pool is available near ",
        where,
        "."
      ] })
    ] }) : /* @__PURE__ */ jsxs(
      "form",
      {
        onSubmit,
        className: "mt-8 flex flex-col gap-3 sm:flex-row",
        noValidate: true,
        children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "waitlist-email", className: "sr-only", children: "Email address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "waitlist-email",
              type: "email",
              required: true,
              autoComplete: "email",
              maxLength: 255,
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "you@example.com",
              className: "w-full flex-1 rounded-full border border-border bg-background px-5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
              disabled: status === "loading"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: status === "loading",
              className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60",
              children: status === "loading" ? "Adding…" : "Notify me"
            }
          )
        ]
      }
    ),
    error && /* @__PURE__ */ jsx("p", { className: "mt-3 text-center text-sm text-destructive", children: error }),
    /* @__PURE__ */ jsx("p", { className: "mt-4 text-center text-xs text-muted-foreground", children: "We'll only email you about pools in your area. Unsubscribe anytime." })
  ] }) });
}
export {
  PoolWaitlistForm
};
