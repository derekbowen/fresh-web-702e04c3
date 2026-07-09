import { jsx, jsxs } from "react/jsx-runtime";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { A as AdminLayout } from "./admin-layout-CB2q0yk1.js";
import { C as Card } from "./card-DK4TJU2r.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { S as Switch } from "./switch-CQ4rbtn8.js";
import { B as Badge } from "./badge-DyfXZgLs.js";
import { toast } from "sonner";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-B7ZiUt1j.js";
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
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
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
const getAutoOutreachState = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("f21bd80c9b38e795c2db3e974a2af4e79f02f21c0f3c6438ba80a82396479f1b"));
const settingsSchema = z.object({
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  dm_drafts_enabled: z.boolean(),
  from_email: z.string().email().max(200),
  from_name: z.string().min(1).max(120),
  reply_to: z.string().email().max(200).nullable().optional(),
  max_per_hour: z.number().int().min(1).max(1e3)
});
const updateAutoOutreachSettings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => settingsSchema.parse(d)).handler(createSsrRpc("929a4afaed7f8ed0755b255e401e54216dd83a71fda27cf43b56c86bac2436a2"));
const runAutoOutreachNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("db7425dbb8ab0aefcb4099c78e776e0c672d82462eda5b663ade7f61324a403d"));
const cancelAutoOutreachMessage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("7c92389154c37b73eee6341dcd6568e18e04983a6fa33ccd16f6a9a7fb7b85a9"));
function AutoOutreachPage() {
  const qc = useQueryClient();
  const fetchState = useServerFn(getAutoOutreachState);
  const saveFn = useServerFn(updateAutoOutreachSettings);
  const runFn = useServerFn(runAutoOutreachNow);
  const cancelFn = useServerFn(cancelAutoOutreachMessage);
  const {
    data,
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ["auto-outreach-state"],
    queryFn: () => fetchState({
      data: {}
    }),
    retry: false
  });
  const settings = data?.settings;
  const [form, setForm] = useState({
    email_enabled: true,
    sms_enabled: true,
    dm_drafts_enabled: true,
    from_email: "hello@poolrentalnearme.com",
    from_name: "Pool Rental Near Me",
    reply_to: "",
    max_per_hour: 60
  });
  useEffect(() => {
    if (settings) {
      setForm({
        email_enabled: !!settings.email_enabled,
        sms_enabled: !!settings.sms_enabled,
        dm_drafts_enabled: !!settings.dm_drafts_enabled,
        from_email: settings.from_email ?? "",
        from_name: settings.from_name ?? "",
        reply_to: settings.reply_to ?? "",
        max_per_hour: settings.max_per_hour ?? 60
      });
    }
  }, [settings]);
  const save = useMutation({
    mutationFn: () => saveFn({
      data: {
        ...form,
        reply_to: form.reply_to || null
      }
    }),
    onSuccess: (r) => {
      r?.ok ? toast.success("Saved") : toast.error(r?.error || "Failed");
      qc.invalidateQueries({
        queryKey: ["auto-outreach-state"]
      });
    },
    onError: (e) => toast.error(e?.message || "Save failed")
  });
  const runNow = useMutation({
    mutationFn: () => runFn({
      data: {}
    }),
    onSuccess: (r) => {
      toast.success(`Enqueued ${r?.enqueued ?? 0} • Sent ${r?.sent ?? 0} • Failed ${r?.failed ?? 0}`);
      qc.invalidateQueries({
        queryKey: ["auto-outreach-state"]
      });
    },
    onError: (e) => toast.error(e?.message || "Run failed — check server logs")
  });
  const cancel = useMutation({
    mutationFn: (id) => cancelFn({
      data: {
        id
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["auto-outreach-state"]
      });
    },
    onError: (e) => toast.error(e?.message || "Cancel failed")
  });
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Auto-outreach 🤖" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Every new lead is auto-contacted with an AI-personalized message — no human needed. Cadence: day 0, day 3, day 7." })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: () => runNow.mutate(), disabled: runNow.isPending, children: runNow.isPending ? "Running…" : "Run now" })
    ] }),
    queryError && /* @__PURE__ */ jsxs("div", { className: "border border-destructive/40 bg-destructive/10 text-destructive rounded-md p-3 text-sm", children: [
      "Couldn't load state: ",
      queryError?.message || String(queryError)
    ] }),
    data?.tally && /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap", children: Object.entries(data.tally).map(([k, v]) => /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "capitalize", children: [
      k,
      ": ",
      v
    ] }, k)) }),
    /* @__PURE__ */ jsxs(Card, { className: "p-5 space-y-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Settings" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md px-3 py-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Email channel" }),
          /* @__PURE__ */ jsx(Switch, { checked: form.email_enabled, onCheckedChange: (v) => setForm({
            ...form,
            email_enabled: v
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md px-3 py-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "SMS channel" }),
          /* @__PURE__ */ jsx(Switch, { checked: form.sms_enabled, onCheckedChange: (v) => setForm({
            ...form,
            sms_enabled: v
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md px-3 py-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "DM drafts" }),
          /* @__PURE__ */ jsx(Switch, { checked: form.dm_drafts_enabled, onCheckedChange: (v) => setForm({
            ...form,
            dm_drafts_enabled: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "From name" }),
          /* @__PURE__ */ jsx(Input, { value: form.from_name, onChange: (e) => setForm({
            ...form,
            from_name: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "From email" }),
          /* @__PURE__ */ jsx(Input, { value: form.from_email, onChange: (e) => setForm({
            ...form,
            from_email: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Reply-to (optional)" }),
          /* @__PURE__ */ jsx(Input, { value: form.reply_to, onChange: (e) => setForm({
            ...form,
            reply_to: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Max sends / hour" }),
          /* @__PURE__ */ jsx(Input, { type: "number", value: form.max_per_hour, onChange: (e) => setForm({
            ...form,
            max_per_hour: Number(e.target.value) || 0
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: () => save.mutate(), disabled: save.isPending, children: save.isPending ? "Saving…" : "Save settings" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-3", children: "Recent activity" }),
      isLoading && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }),
      !isLoading && (data?.messages?.length ?? 0) === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "No messages yet. Run now to enqueue." }),
      /* @__PURE__ */ jsx("div", { className: "divide-y", children: (data?.messages ?? []).map((m) => /* @__PURE__ */ jsxs("div", { className: "py-3 flex gap-3 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 min-w-32", children: [
          /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "w-fit capitalize", children: [
            m.channel,
            " · step ",
            m.step
          ] }),
          /* @__PURE__ */ jsx(Badge, { variant: m.status === "sent" ? "default" : m.status === "failed" ? "destructive" : "secondary", className: "w-fit capitalize", children: m.status }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: new Date(m.scheduled_at).toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
            m.source,
            " → ",
            m.to_address || "—"
          ] }),
          m.subject && /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: m.subject }),
          /* @__PURE__ */ jsx("div", { className: "text-sm whitespace-pre-wrap line-clamp-4", children: m.body }),
          m.error && /* @__PURE__ */ jsxs("div", { className: "text-xs text-destructive mt-1", children: [
            "Error: ",
            m.error
          ] })
        ] }),
        m.status === "pending" && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => cancel.mutate(m.id), children: "Cancel" })
      ] }, m.id)) })
    ] })
  ] }) });
}
export {
  AutoOutreachPage as component
};
