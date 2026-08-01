import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useMutation } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-B2eMXHXP.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BEu57YoG.js";
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
import "./renter-drip.server-DJqUcyMM.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BfIDzqiI.js";
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
const InputSchema = z.object({
  raw: z.string().min(1).max(5e5),
  lists: z.array(z.enum(["host", "renter"])).min(1),
  scheduleDrip: z.boolean().default(true)
});
const addContacts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => InputSchema.parse(d)).handler(createSsrRpc("20fb37e44ef09307e4c93b5261b25fd5f39a9483ac83d961a77183c66ff26d61"));
function AddContactsPage() {
  const [raw, setRaw] = React.useState("");
  const [hostList, setHostList] = React.useState(false);
  const [renterList, setRenterList] = React.useState(false);
  const [scheduleDrip, setScheduleDrip] = React.useState(true);
  const fn = useServerFn(addContacts);
  const mutation = useMutation({
    mutationFn: () => fn({
      data: {
        raw,
        lists: [hostList && "host", renterList && "renter"].filter(Boolean),
        scheduleDrip
      }
    })
  });
  const canSubmit = raw.trim().length > 0 && (hostList || renterList) && !mutation.isPending;
  const result = mutation.data;
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Add contacts", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Add contacts to email lists" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
      "Paste one email per line. Optional formats: ",
      /* @__PURE__ */ jsx("code", { children: "email,name" }),
      " or ",
      /* @__PURE__ */ jsx("code", { children: "Name <email>" }),
      "."
    ] }),
    /* @__PURE__ */ jsx("textarea", { value: raw, onChange: (e) => setRaw(e.target.value), placeholder: "jane@example.com\njohn@example.com,John Smith\nJane Doe <jane2@example.com>", className: "mt-3 h-64 w-full rounded-md border border-border bg-background p-3 font-mono text-sm" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-md border border-border bg-card p-3", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Add to lists" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-1.5 text-sm", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: hostList, onChange: (e) => setHostList(e.target.checked) }),
          /* @__PURE__ */ jsx("span", { children: "Host drip list (7-touch weekly sequence)" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: renterList, onChange: (e) => setRenterList(e.target.checked) }),
          /* @__PURE__ */ jsx("span", { children: "Renter drip list" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 border-t border-border pt-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: scheduleDrip, onChange: (e) => setScheduleDrip(e.target.checked) }),
          /* @__PURE__ */ jsx("span", { children: "Start the drip sequence for new contacts" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Existing contacts already in a sequence are never duplicated." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: () => mutation.mutate(), disabled: !canSubmit, className: "mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: mutation.isPending ? "Adding…" : "Add contacts" }),
    mutation.isError && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700", children: String(mutation.error) }),
    result && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-md border border-border bg-card p-3 text-sm", children: [
      result.error && /* @__PURE__ */ jsx("div", { className: "mb-2 text-red-600", children: result.error }),
      /* @__PURE__ */ jsxs("div", { children: [
        "Parsed valid emails: ",
        /* @__PURE__ */ jsx("b", { children: result.parsed })
      ] }),
      result.invalid.length > 0 && /* @__PURE__ */ jsxs("details", { className: "mt-1", children: [
        /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-muted-foreground", children: [
          "Skipped invalid lines (",
          result.invalid.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs", children: result.invalid.join("\n") })
      ] }),
      ["host", "renter"].map((k) => {
        const r = result.perList[k];
        const touched = r.added + r.existing + r.skipped;
        if (touched === 0) return null;
        return /* @__PURE__ */ jsxs("div", { className: "mt-3 border-t border-border pt-2", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: k === "host" ? "Host drip" : "Renter drip" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
            "Added: ",
            /* @__PURE__ */ jsx("b", { className: "text-foreground", children: r.added }),
            " · Already on list: ",
            /* @__PURE__ */ jsx("b", { className: "text-foreground", children: r.existing }),
            " · Drip scheduled: ",
            /* @__PURE__ */ jsx("b", { className: "text-foreground", children: r.scheduled }),
            " · Skipped: ",
            /* @__PURE__ */ jsx("b", { className: "text-foreground", children: r.skipped })
          ] })
        ] }, k);
      })
    ] })
  ] }) });
}
export {
  AddContactsPage as component
};
