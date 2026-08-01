import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { A as AdminLayout } from "./admin-layout-Ck0iqDJo.js";
import { l as listPrivacyRequests } from "./privacy-requests.functions-DLBi1gGr.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BTf4C8qB.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./renter-drip.server-C0Ma8t5O.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DDQBE_qt.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function PrivacyRequestsAdmin() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPrivacyRequests();
      setRows(res.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    void load();
  }, [load]);
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "px-4 py-6 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Privacy requests" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
      "High-engagement signal — privacy-engaged users are stickier. ",
      rows.length,
      " total."
    ] }),
    loading && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: "Loading…" }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-border text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/40", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "Date" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "Type" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "Email" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "Name" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "State" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "GPC" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "Source" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left font-medium", children: "Details" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border bg-background", children: [
        rows.map((r) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 whitespace-nowrap", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.request_type }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.email }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.full_name ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.state_code ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.gpc_signal ? "✓" : "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 max-w-[180px] truncate", title: r.source_url ?? "", children: r.source_url ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.status }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 max-w-[280px] truncate", title: r.details ?? "", children: r.details ?? "—" })
        ] }, r.id)),
        !loading && rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 9, className: "px-3 py-6 text-center text-muted-foreground", children: "No requests yet." }) })
      ] })
    ] }) })
  ] }) });
}
export {
  PrivacyRequestsAdmin as component
};
