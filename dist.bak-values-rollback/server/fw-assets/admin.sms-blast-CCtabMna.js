import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { A as AdminLayout } from "./admin-layout-D-GLXJwf.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { T as Textarea } from "./textarea-DSyJ1nlY.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { toast } from "sonner";
import "@tanstack/react-router";
import "lucide-react";
import "./router-B2eXowiP.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
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
import "./renter-drip.server-JSvbm2ii.js";
import "node:fs";
import "node:path";
import "./host-drip.server-b0u8F2OF.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
const filterSchema = z.object({
  source: z.enum(["all", "jobsxml", "googlejobs", "jooble", "indeed", "ziprecruiter"]).default("all"),
  city: z.string().trim().max(120).optional().nullable(),
  region: z.string().trim().max(20).optional().nullable(),
  sinceDays: z.number().int().min(1).max(365).optional().nullable()
});
const previewSmsBlast = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => filterSchema.parse(d)).handler(createSsrRpc("9805350f35915072881e532c84e72bd84b3465a5836b6b9749b3af281cb18325"));
const sendSchema = filterSchema.extend({
  body: z.string().trim().min(10).max(1500),
  scheduleAt: z.string().datetime().optional().nullable(),
  dryRun: z.boolean().default(false),
  dedupeDays: z.number().int().min(0).max(90).default(7)
});
const sendSmsBlast = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => sendSchema.parse(d)).handler(createSsrRpc("ed88ca29c540be0a952d5f62840a169bfd27edb6304345b2da68d986c8749393"));
const SOURCES = ["all", "jobsxml", "googlejobs", "jooble", "indeed", "ziprecruiter"];
function Page() {
  const preview = useServerFn(previewSmsBlast);
  const send = useServerFn(sendSmsBlast);
  const [source, setSource] = useState("all");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [sinceDays, setSinceDays] = useState(30);
  const [dedupeDays, setDedupeDays] = useState(7);
  const [body, setBody] = useState("Hey {first_name}, it's Pool Rental Near Me. Quick Q — still interested in renting out your pool in {city}? Reply YES and I'll send next steps. Reply STOP to opt out.");
  const [previewRes, setPreviewRes] = useState(null);
  const [sendRes, setSendRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const filterPayload = () => ({
    source,
    city: city || null,
    region: region || null,
    sinceDays: sinceDays === "" ? null : Number(sinceDays)
  });
  async function onPreview() {
    setBusy(true);
    try {
      const r = await preview({
        data: filterPayload()
      });
      setPreviewRes(r);
    } catch (e) {
      toast.error(e.message ?? "Preview failed");
    } finally {
      setBusy(false);
    }
  }
  async function onSend(dryRun) {
    if (!dryRun && !confirm(`Send SMS to eligible leads now?`)) return;
    setBusy(true);
    setSendRes(null);
    try {
      const r = await send({
        data: {
          ...filterPayload(),
          body,
          dryRun,
          dedupeDays
        }
      });
      setSendRes(r);
      if (r.ok) toast.success(dryRun ? "Dry run complete" : `Scheduled ${r.scheduled} messages`);
      else toast.error(r.error || "Send failed");
    } catch (e) {
      toast.error(e.message ?? "Send failed");
    } finally {
      setBusy(false);
    }
  }
  const chars = body.length;
  const segments = Math.ceil(chars / 160) || 1;
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-3xl", children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "SMS blast" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "One-off SMS to host_leads. Schedules via Twilio cron sender. Auto-skips opt-outs and recent recipients." })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-lg border bg-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Filter recipients" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Source" }),
          /* @__PURE__ */ jsx("select", { value: source, onChange: (e) => setSource(e.target.value), className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm", children: SOURCES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "City (optional)" }),
          /* @__PURE__ */ jsx(Input, { value: city, onChange: (e) => setCity(e.target.value), placeholder: "Austin" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "State (optional)" }),
          /* @__PURE__ */ jsx(Input, { value: region, onChange: (e) => setRegion(e.target.value), placeholder: "TX" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Since (days)" }),
          /* @__PURE__ */ jsx(Input, { type: "number", value: sinceDays, onChange: (e) => setSinceDays(e.target.value === "" ? "" : Number(e.target.value)), placeholder: "30" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: onPreview, disabled: busy, variant: "outline", children: "Preview audience" }),
      previewRes?.ok && /* @__PURE__ */ jsxs("div", { className: "text-sm space-y-1 rounded-md bg-muted p-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("b", { children: previewRes.eligible }),
          " eligible · ",
          previewRes.optedOut,
          " opted out · ",
          previewRes.total,
          " total match"
        ] }),
        previewRes.sample?.length > 0 && /* @__PURE__ */ jsx("ul", { className: "text-xs text-muted-foreground mt-2 space-y-0.5", children: previewRes.sample.map((s) => /* @__PURE__ */ jsxs("li", { children: [
          s.name,
          " · ",
          s.phone,
          " · ",
          s.city ?? "—"
        ] }, s.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-lg border bg-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Message" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(Label, { children: [
          "Body — use ",
          "{first_name}",
          " and ",
          "{city}",
          '. Must include "STOP".'
        ] }),
        /* @__PURE__ */ jsx(Textarea, { value: body, onChange: (e) => setBody(e.target.value), rows: 5, className: "mt-1 font-mono text-sm" }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
          chars,
          " chars · ",
          segments,
          " segment",
          segments > 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-end gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Dedupe window (days)" }),
        /* @__PURE__ */ jsx(Input, { type: "number", value: dedupeDays, onChange: (e) => setDedupeDays(Number(e.target.value)), className: "w-32" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "Skip phones with any SMS in the last N days. 0 = none." })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx(Button, { onClick: () => onSend(true), disabled: busy, variant: "outline", children: "Dry run" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => onSend(false), disabled: busy, children: "Schedule & send" })
      ] }),
      sendRes && /* @__PURE__ */ jsx("pre", { className: "text-xs rounded-md bg-muted p-3 overflow-auto", children: JSON.stringify(sendRes, null, 2) })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
      "Sender cron picks up pending rows every minute via ",
      /* @__PURE__ */ jsx("code", { children: "/api/public/hooks/sms-sender" }),
      "."
    ] })
  ] }) });
}
export {
  Page as component
};
