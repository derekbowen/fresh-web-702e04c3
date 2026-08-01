import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { A as AdminLayout } from "./admin-layout-Ql_EyRxP.js";
import { a as importTable } from "./admin-data-io.functions-CGhIHfQZ.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-DK4TJU2r.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { Loader2, Download } from "lucide-react";
import "@supabase/supabase-js";
import "@tanstack/react-router";
import "./router-BPpbotmS.js";
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
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
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
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
function TableCard({
  table
}) {
  const [busy, setBusy] = React.useState(null);
  const [status, setStatus] = React.useState("");
  const [importResult, setImportResult] = React.useState(null);
  const [mode, setMode] = React.useState("upsert");
  const fileRef = React.useRef(null);
  const handleExport = async () => {
    setBusy("export");
    setStatus("Downloading CSV...");
    try {
      const {
        data: sess
      } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await fetch(`/api/admin/data-export?table=${table}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const blob = await res.blob();
      const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(`Exported ~${Math.round(blob.size / 1024)} KB`);
    } catch (e) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(null);
    }
  };
  const handleImport = async (file) => {
    setBusy("import");
    setImportResult(null);
    setStatus(`Reading ${file.name}...`);
    try {
      const csv = await file.text();
      setStatus("Uploading and importing...");
      const res = await importTable({
        data: {
          table,
          csv,
          mode
        }
      });
      setImportResult({
        totalRows: res.totalRows,
        inserted: res.inserted,
        rowErrors: res.rowErrors,
        chunkErrors: res.chunkErrors
      });
      const totalErr = res.rowErrors.length;
      setStatus(`Imported ${res.inserted}/${res.totalRows} rows${totalErr ? ` (${totalErr} bad row(s))` : ""}`);
    } catch (e) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "font-mono text-base", children: table }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Button, { onClick: handleExport, disabled: !!busy, className: "w-full sm:w-auto", children: [
        busy === "export" ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "mr-2 h-4 w-4" }),
        "Export to CSV"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 border-t pt-4", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium", children: "Re-import CSV" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 text-sm", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("input", { type: "radio", checked: mode === "upsert", onChange: () => setMode("upsert") }),
            "Upsert (update if exists)"
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("input", { type: "radio", checked: mode === "insert", onChange: () => setMode("insert") }),
            "Insert only"
          ] })
        ] }),
        /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: ".csv,text/csv", disabled: !!busy, onChange: (e) => {
          const f = e.target.files?.[0];
          if (f) handleImport(f);
        }, className: "block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground hover:file:bg-primary/90" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Upsert conflict column:",
          " ",
          /* @__PURE__ */ jsx("code", { children: table === "content_plan" ? "slug" : "id" }),
          ". Max 25MB."
        ] })
      ] }),
      status && /* @__PURE__ */ jsxs("div", { className: "rounded border bg-muted p-3 text-sm", children: [
        busy && /* @__PURE__ */ jsx(Loader2, { className: "mr-2 inline h-3 w-3 animate-spin" }),
        status
      ] }),
      importResult && importResult.rowErrors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded border border-destructive/50 bg-destructive/10 p-3 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-1 font-medium", children: [
          "Bad rows (",
          importResult.rowErrors.length,
          "):"
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "max-h-48 list-inside list-disc space-y-1 overflow-auto", children: [
          importResult.rowErrors.slice(0, 50).map((e, i) => /* @__PURE__ */ jsxs("li", { children: [
            "Row ",
            e.row,
            e.slug ? ` (${e.slug})` : "",
            ": ",
            e.reason
          ] }, i)),
          importResult.rowErrors.length > 50 && /* @__PURE__ */ jsxs("li", { children: [
            "...and ",
            importResult.rowErrors.length - 50,
            " more"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function DataExportPage() {
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Content data export / import" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Download a full snapshot of the content tables as CSV, or restore a previously exported CSV. Exports paginate through all rows; imports run in 500-row chunks." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(TableCard, { table: "content_plan" }),
      /* @__PURE__ */ jsx(TableCard, { table: "content_pages" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Notes" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Upsert" }),
          " matches by the conflict column and overwrites all other fields with the CSV values."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Insert only" }),
          " fails on duplicate keys — use this for fresh restores into an empty table."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "JSON/array columns (e.g. ",
          /* @__PURE__ */ jsx("code", { children: "legacy_slugs" }),
          ") are detected automatically when the value starts with ",
          /* @__PURE__ */ jsx("code", { children: `[` }),
          " or",
          " ",
          /* @__PURE__ */ jsx("code", { children: `{` }),
          "."
        ] })
      ] })
    ] })
  ] }) });
}
export {
  DataExportPage as component
};
