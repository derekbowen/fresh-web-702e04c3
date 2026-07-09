import { jsx, jsxs } from "react/jsx-runtime";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { A as AdminLayout } from "./admin-layout-9iu79rRE.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { S as Switch } from "./switch-CQ4rbtn8.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-DK4TJU2r.js";
import { B as Badge } from "./badge-DyfXZgLs.js";
import { toast } from "sonner";
import { Bell, Send, RefreshCw } from "lucide-react";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "./router-DV0zB2xT.js";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
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
import "./renter-drip.server-CKJB2seY.js";
import "node:fs";
import "node:path";
import "./host-drip.server-CJ5RKG29.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-switch";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const getMyReminderSettings = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("b574c0176162cf5328022bda343a01f75d3eedffd63b43ae3c0959e2d490ddd0"));
const UpdateSchema = z.object({
  email: z.string().email().max(254).nullable().or(z.literal("").transform(() => null)),
  phone_e164: z.string().regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format like +15551234567").nullable().or(z.literal("").transform(() => null)),
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  min_interval_minutes: z.number().int().min(15).max(1440),
  paused: z.boolean()
});
const updateMyReminderSettings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => UpdateSchema.parse(d)).handler(createSsrRpc("e75b6e936630b34932918f8f769e4625477c231ae67c055dc1b67f29e78b169b"));
const getRecentReminderLog = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("f4387101a7753eba81e134922b1dd0f7569d20ae36538d44f97ba9f3296be286"));
const getMyDueCount = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("dfba2289918e8d0a9e79618f60fe32178a132c436138b1781e8463c7f9d2e0d1"));
const runReminderWorkerNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("5c6d00db4d1761801b6ca8cf35830370ea571968e8b6ede499c71f3bd5768c72"));
function FollowupRemindersPage() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getMyReminderSettings);
  const saveSettings = useServerFn(updateMyReminderSettings);
  const fetchLog = useServerFn(getRecentReminderLog);
  const fetchDue = useServerFn(getMyDueCount);
  const runNow = useServerFn(runReminderWorkerNow);
  const settingsQ = useQuery({
    queryKey: ["fr-settings"],
    queryFn: () => fetchSettings({})
  });
  const logQ = useQuery({
    queryKey: ["fr-log"],
    queryFn: () => fetchLog({})
  });
  const dueQ = useQuery({
    queryKey: ["fr-due"],
    queryFn: () => fetchDue({})
  });
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [interval, setInterval] = useState(60);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const s = settingsQ.data;
    if (s) {
      setEmail(s.email ?? "");
      setPhone(s.phone_e164 ?? "");
      setEmailEnabled(s.email_enabled);
      setSmsEnabled(s.sms_enabled);
      setInterval(s.min_interval_minutes);
      setPaused(s.paused);
    }
  }, [settingsQ.data]);
  const saveMut = useMutation({
    mutationFn: () => saveSettings({
      data: {
        email: email || null,
        phone_e164: phone || null,
        email_enabled: emailEnabled,
        sms_enabled: smsEnabled,
        min_interval_minutes: interval,
        paused
      }
    }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({
        queryKey: ["fr-settings"]
      });
    },
    onError: (e) => toast.error(e?.message ?? "Save failed")
  });
  const runMut = useMutation({
    mutationFn: () => runNow({}),
    onSuccess: (r) => {
      toast.success(`Owners: ${r.ownersChecked} · Emails: ${r.emailsSent} · SMS: ${r.smsSent}`);
      qc.invalidateQueries({
        queryKey: ["fr-log"]
      });
      qc.invalidateQueries({
        queryKey: ["fr-settings"]
      });
    },
    onError: (e) => toast.error(e?.message ?? "Run failed")
  });
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Bell, { className: "h-6 w-6" }),
          " Follow-up reminders"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "Get email + SMS digests when your assigned follow-ups are past their next-action time." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold", children: dueQ.data?.dueCount ?? "—" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "overdue right now" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Your notification settings" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
            /* @__PURE__ */ jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone (E.164)" }),
            /* @__PURE__ */ jsx(Input, { id: "phone", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+15551234567" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Email digest" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Send a summary of due follow-ups by email." })
          ] }),
          /* @__PURE__ */ jsx(Switch, { checked: emailEnabled, onCheckedChange: setEmailEnabled })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: "SMS reminders" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Short SMS with the count and a link." })
          ] }),
          /* @__PURE__ */ jsx(Switch, { checked: smsEnabled, onCheckedChange: setSmsEnabled })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Pause all reminders" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Temporarily stop without losing settings." })
          ] }),
          /* @__PURE__ */ jsx(Switch, { checked: paused, onCheckedChange: setPaused })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "interval", children: "Minimum minutes between digests" }),
          /* @__PURE__ */ jsx(Input, { id: "interval", type: "number", min: 15, max: 1440, value: interval, onChange: (e) => setInterval(Math.max(15, Math.min(1440, Number(e.target.value) || 60))) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "The cron runs every 15 minutes. We won't notify you more often than this interval." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Button, { onClick: () => saveMut.mutate(), disabled: saveMut.isPending, children: saveMut.isPending ? "Saving…" : "Save settings" }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => runMut.mutate(), disabled: runMut.isPending, children: [
            /* @__PURE__ */ jsx(Send, { className: "h-4 w-4 mr-1" }),
            runMut.isPending ? "Running…" : "Run worker now"
          ] }),
          settingsQ.data?.last_notified_at && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            "Last sent: ",
            new Date(settingsQ.data.last_notified_at).toLocaleString()
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Recent reminder log" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => qc.invalidateQueries({
          queryKey: ["fr-log"]
        }), children: /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: logQ.isLoading ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }) : (logQ.data?.length ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No reminders sent yet." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "When" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Channel" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Due" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Recipient" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Note" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: logQ.data.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 whitespace-nowrap", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: r.channel }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: /* @__PURE__ */ jsx(Badge, { variant: r.status === "sent" ? "default" : r.status === "failed" ? "destructive" : "secondary", children: r.status }) }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: r.due_count }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-muted-foreground", children: r.recipient ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-muted-foreground truncate max-w-[280px]", children: r.error ?? "" })
        ] }, r.id)) })
      ] }) }) })
    ] })
  ] }) });
}
export {
  FollowupRemindersPage as component
};
