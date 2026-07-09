import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { A as AdminLayout } from "./admin-layout-CB2q0yk1.js";
import { g as getImportSchema, l as lookupExistingKeys, i as importTableRows } from "./admin-data-io.functions-CGhIHfQZ.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-DK4TJU2r.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { B as Badge } from "./badge-DyfXZgLs.js";
import { FileText, X, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import "./router-B7ZiUt1j.js";
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
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        cur = "";
        rows.push(row);
        row = [];
      } else cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r.length === 1 && r[0] !== "");
}
function coerceValue(raw) {
  if (raw === "") return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      return JSON.parse(trimmed);
    } catch {
    }
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return raw;
}
function applyMapping(header, mapping) {
  const m = header.map((h) => {
    if (!mapping) return h;
    if (!(h in mapping)) return h;
    const v = mapping[h];
    return v && v.length > 0 ? v : null;
  });
  const effective = [];
  m.forEach((v) => {
    if (v) effective.push(v);
  });
  return { effective, map: m };
}
const CHUNK_SIZE = 200;
const LOOKUP_CHUNK = 2e3;
function DataImportPage() {
  const [table, setTable] = React.useState("content_plan");
  const [file, setFile] = React.useState(null);
  const [parsed, setParsed] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [busy, setBusy] = React.useState(null);
  const [progress, setProgress] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [mode, setMode] = React.useState("upsert");
  const [ignoreUnknown, setIgnoreUnknown] = React.useState(true);
  const [confirmText, setConfirmText] = React.useState("");
  const [mapping, setMapping] = React.useState({});
  const fileRef = React.useRef(null);
  const reset = () => {
    setFile(null);
    setParsed(null);
    setPreview(null);
    setError(null);
    setResult(null);
    setProgress(null);
    setConfirmText("");
    setMapping({});
    if (fileRef.current) fileRef.current.value = "";
  };
  const buildPreview = React.useCallback(async (p, m) => {
    setBusy("preview");
    setError(null);
    try {
      const {
        tableColumns,
        conflictColumn
      } = await getImportSchema({
        data: {
          table
        }
      });
      const knownCols = new Set(tableColumns);
      const {
        effective: effectiveHeader,
        map: headerMap
      } = applyMapping(p.header, m);
      const unknownColumns = tableColumns.length > 0 ? effectiveHeader.filter((c) => !knownCols.has(c)) : [];
      const missingColumns = tableColumns.length > 0 ? tableColumns.filter((c) => !effectiveHeader.includes(c)) : [];
      const conflictCsvIdx = headerMap.findIndex((mm) => mm === conflictColumn);
      const conflictValues = [];
      if (conflictCsvIdx >= 0) {
        for (const r of p.rows) {
          const v = r[conflictCsvIdx];
          if (v) conflictValues.push(v);
        }
      }
      let existingMatches = 0;
      for (let i = 0; i < conflictValues.length; i += LOOKUP_CHUNK) {
        const slice = conflictValues.slice(i, i + LOOKUP_CHUNK);
        const {
          existingCount
        } = await lookupExistingKeys({
          data: {
            table,
            conflictColumn,
            values: slice
          }
        });
        existingMatches += existingCount;
      }
      const sampleSize = Math.min(5, p.rows.length);
      const sample = p.rows.slice(0, sampleSize).map((r) => {
        const obj = {};
        headerMap.forEach((eff, i) => {
          if (!eff) return;
          obj[eff] = coerceValue(r[i] ?? "");
        });
        return obj;
      });
      setPreview({
        totalRows: p.rows.length,
        header: p.header,
        effectiveHeader,
        tableColumns,
        unknownColumns,
        missingColumns,
        conflictColumn,
        hasConflictColumn: effectiveHeader.includes(conflictColumn),
        existingMatches,
        newRowsEstimate: p.rows.length - existingMatches,
        sample
      });
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }, [table]);
  const handleFile = async (f) => {
    reset();
    setFile(f);
    setBusy("preview");
    try {
      const text = await f.text();
      const all = parseCsv(text);
      if (all.length < 2) {
        setError("CSV has no data rows");
        setBusy(null);
        return;
      }
      const p = {
        header: all[0],
        rows: all.slice(1)
      };
      setParsed(p);
      await buildPreview(p, {});
    } catch (e) {
      setError(e?.message ?? String(e));
      setBusy(null);
    }
  };
  React.useEffect(() => {
    if (!parsed || !preview) return;
    const t = setTimeout(() => {
      void buildPreview(parsed, mapping);
    }, 300);
    return () => clearTimeout(t);
  }, [mapping]);
  const handleCommit = async () => {
    if (!parsed || !preview) return;
    setBusy("commit");
    setError(null);
    setResult(null);
    setProgress({
      done: 0,
      total: parsed.rows.length
    });
    try {
      const tableCols = new Set(preview.tableColumns);
      const knownSchema = tableCols.size > 0;
      const {
        map: headerMap0
      } = applyMapping(parsed.header, mapping);
      let headerMap = headerMap0;
      const droppedColumns = [];
      if (ignoreUnknown && knownSchema) {
        headerMap = headerMap.map((eff, i) => {
          if (eff && !tableCols.has(eff)) {
            droppedColumns.push(eff || parsed.header[i]);
            return null;
          }
          return eff;
        });
      } else {
        headerMap.forEach((eff, i) => {
          if (!eff) droppedColumns.push(parsed.header[i]);
        });
      }
      const effectiveHeader = [];
      headerMap.forEach((eff) => {
        if (eff) effectiveHeader.push(eff);
      });
      const conflictColumn = preview.conflictColumn;
      const seenKeys = /* @__PURE__ */ new Map();
      const rowErrors = [];
      const validRows = [];
      const validRowNumbers = [];
      parsed.rows.forEach((rawRow, idx) => {
        const csvRowNum = idx + 2;
        const obj = {};
        const issues = [];
        headerMap.forEach((col, i) => {
          if (!col) return;
          const raw = rawRow[i] ?? "";
          const trimmed = String(raw).trim();
          if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
              JSON.parse(trimmed);
            } catch {
              issues.push(`Invalid JSON in "${col}"`);
            }
          }
          obj[col] = coerceValue(raw);
        });
        if (effectiveHeader.includes(conflictColumn) && (obj[conflictColumn] === null || obj[conflictColumn] === "")) {
          issues.push(`Missing required "${conflictColumn}"`);
        }
        if (knownSchema) {
          for (const col of effectiveHeader) {
            if (!tableCols.has(col)) issues.push(`Unknown column "${col}"`);
          }
        }
        const keyVal = obj[conflictColumn];
        if (keyVal != null && keyVal !== "") {
          const prior = seenKeys.get(String(keyVal));
          if (prior !== void 0) {
            issues.push(`Duplicate "${conflictColumn}"="${keyVal}" (also on CSV row ${prior})`);
          } else {
            seenKeys.set(String(keyVal), csvRowNum);
          }
        }
        if (issues.length > 0) {
          rowErrors.push({
            row: csvRowNum,
            slug: keyVal != null ? String(keyVal) : void 0,
            reason: issues.join("; ")
          });
          return;
        }
        validRows.push(obj);
        validRowNumbers.push(csvRowNum);
      });
      let inserted = 0;
      const chunkErrors = [];
      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        const chunk = validRows.slice(i, i + CHUNK_SIZE);
        const chunkRowNums = validRowNumbers.slice(i, i + CHUNK_SIZE);
        try {
          const res = await importTableRows({
            data: {
              table,
              rows: chunk,
              mode,
              conflictColumn,
              rowNumbers: chunkRowNums
            }
          });
          inserted += res.inserted;
          rowErrors.push(...res.rowErrors);
          if (res.chunkError) {
            chunkErrors.push(`Chunk rows ${chunkRowNums[0]}-${chunkRowNums[chunkRowNums.length - 1]} retried per-row: ${res.chunkError}`);
          }
        } catch (e) {
          chunkErrors.push(`Chunk rows ${chunkRowNums[0]}-${chunkRowNums[chunkRowNums.length - 1]} failed entirely: ${e?.message ?? String(e)}`);
        }
        setProgress({
          done: Math.min(i + CHUNK_SIZE, validRows.length),
          total: validRows.length
        });
      }
      setResult({
        inserted,
        totalRows: parsed.rows.length,
        rowErrors,
        chunkErrors,
        droppedColumns
      });
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };
  const effectiveFor = (csvHeader) => {
    if (csvHeader in mapping) {
      const v = mapping[csvHeader];
      return v && v.length > 0 ? v : null;
    }
    return csvHeader;
  };
  const blockingIssues = [];
  if (preview) {
    if (!preview.hasConflictColumn && mode === "upsert") {
      blockingIssues.push(`CSV is missing the "${preview.conflictColumn}" column required for upsert.`);
    }
    if (preview.unknownColumns.length > 0 && !ignoreUnknown) {
      blockingIssues.push(`CSV has ${preview.unknownColumns.length} unknown column(s). Enable "Ignore unknown columns" or fix the CSV.`);
    }
  }
  const requiredConfirm = `${table} ${mode}`;
  const canCommit = !!preview && blockingIssues.length === 0 && !busy && confirmText.trim() === requiredConfirm;
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Import CSV into table" }),
        /* @__PURE__ */ jsx(Link, { to: "/admin/data-export", className: "text-sm text-muted-foreground underline-offset-2 hover:underline", children: "Need an export? →" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
        "Upload a CSV, review the preview, then explicitly confirm to write to the database. Parsing happens in your browser and rows ship in chunks of ",
        CHUNK_SIZE,
        ", so large files (100MB+) work fine."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "1. Target table" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-3", children: ["content_plan", "content_pages"].map((t) => /* @__PURE__ */ jsxs("label", { className: `flex cursor-pointer items-center gap-2 rounded border px-3 py-2 font-mono text-sm ${table === t ? "border-primary bg-primary/10" : ""}`, children: [
        /* @__PURE__ */ jsx("input", { type: "radio", checked: table === t, onChange: () => {
          setTable(t);
          reset();
        } }),
        t
      ] }, t)) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "2. Upload CSV" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: ".csv,text/csv", disabled: busy === "commit", onChange: (e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }, className: "block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground hover:file:bg-primary/90" }),
        file && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: file.name }),
          /* @__PURE__ */ jsx("span", { children: "·" }),
          /* @__PURE__ */ jsxs("span", { children: [
            (file.size / 1024).toFixed(1),
            " KB"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: reset, className: "ml-auto text-destructive hover:underline", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
        ] }),
        busy === "preview" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
          " Parsing and validating..."
        ] })
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error }),
    preview && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "3. Preview" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-4", children: [
          /* @__PURE__ */ jsx(Stat, { label: "Rows in CSV", value: preview.totalRows }),
          /* @__PURE__ */ jsx(Stat, { label: "Existing matches", value: preview.existingMatches, hint: `by ${preview.conflictColumn}` }),
          /* @__PURE__ */ jsx(Stat, { label: "New rows", value: preview.newRowsEstimate, hint: "if upsert/insert" }),
          /* @__PURE__ */ jsx(Stat, { label: "CSV columns", value: preview.header.length })
        ] }),
        preview.unknownColumns.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded border border-amber-500/50 bg-amber-500/10 p-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
            "Unknown columns (",
            preview.unknownColumns.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs", children: preview.unknownColumns.join(", ") })
        ] }),
        preview.missingColumns.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded border bg-muted p-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1 font-medium", children: [
            "Table columns not in CSV (",
            preview.missingColumns.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs text-muted-foreground", children: preview.missingColumns.join(", ") }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "These will be left at their existing value (upsert) or default (insert)." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-2 text-sm font-medium", children: [
            "Sample rows (",
            preview.sample.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-auto rounded border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted", children: /* @__PURE__ */ jsx("tr", { children: preview.header.map((h) => /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left font-mono", children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: preview.sample.map((row, i) => /* @__PURE__ */ jsx("tr", { className: "border-t", children: preview.header.map((h) => /* @__PURE__ */ jsx("td", { className: "max-w-[200px] truncate px-2 py-1", children: row[h] === null ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "null" }) : typeof row[h] === "object" ? JSON.stringify(row[h]) : String(row[h]) }, h)) }, i)) })
          ] }) })
        ] })
      ] })
    ] }),
    preview && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "4. Map CSV columns to table columns" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: 'Each CSV column is mapped to a table column of the same name by default. Pick a different target or "Skip" to ignore a column. Preview updates automatically.' }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [
          /* @__PURE__ */ jsx("button", { className: "rounded border px-2 py-1 hover:bg-muted", onClick: () => setMapping({}), children: "Reset to identity" }),
          /* @__PURE__ */ jsx("button", { className: "rounded border px-2 py-1 hover:bg-muted", onClick: () => {
            const next = {};
            const known = new Set(preview.tableColumns);
            preview.header.forEach((h) => {
              if (!known.has(h)) next[h] = "";
            });
            setMapping(next);
          }, children: "Skip all unknown" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-auto rounded border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "CSV column" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "→ Table column" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Status" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: preview.header.map((h) => {
            const eff = effectiveFor(h);
            const known = preview.tableColumns.length === 0 || eff !== null && preview.tableColumns.includes(eff);
            const dup = eff ? preview.header.filter((x) => effectiveFor(x) === eff).length > 1 : false;
            return /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsx("td", { className: "px-2 py-1 font-mono", children: h }),
              /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: /* @__PURE__ */ jsxs("select", { value: h in mapping ? mapping[h] : h, onChange: (e) => setMapping((m) => ({
                ...m,
                [h]: e.target.value
              })), className: "w-full rounded border bg-background px-2 py-1 font-mono", children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "— Skip —" }),
                preview.tableColumns.length === 0 && /* @__PURE__ */ jsxs("option", { value: h, children: [
                  h,
                  " (identity)"
                ] }),
                preview.tableColumns.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: eff === null ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "skipped" }) : dup ? /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "duplicate target" }) : !known ? /* @__PURE__ */ jsx("span", { className: "text-amber-700 dark:text-amber-400", children: "unknown" }) : /* @__PURE__ */ jsx("span", { className: "text-green-700 dark:text-green-400", children: "ok" }) })
            ] }, h);
          }) })
        ] }) })
      ] })
    ] }),
    preview && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "5. Confirm and import" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm", children: "Mode" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 text-sm", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("input", { type: "radio", checked: mode === "upsert", onChange: () => setMode("upsert") }),
              "Upsert ",
              /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
                "match by ",
                preview.conflictColumn
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("input", { type: "radio", checked: mode === "insert", onChange: () => setMode("insert") }),
              "Insert only ",
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "fails on duplicates" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: ignoreUnknown, onChange: (e) => setIgnoreUnknown(e.target.checked) }),
          "Ignore unknown columns (",
          preview.unknownColumns.length,
          ")"
        ] }),
        blockingIssues.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center gap-2 font-medium", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
            "Blocking issues"
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "ml-4 list-disc", children: blockingIssues.map((b, i) => /* @__PURE__ */ jsx("li", { children: b }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs(Label, { className: "text-sm", children: [
            "Type ",
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: requiredConfirm }),
            " to confirm"
          ] }),
          /* @__PURE__ */ jsx("input", { type: "text", value: confirmText, onChange: (e) => setConfirmText(e.target.value), className: "w-full rounded border bg-background px-3 py-2 font-mono text-sm", placeholder: requiredConfirm })
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: handleCommit, disabled: !canCommit, className: "w-full sm:w-auto", children: busy === "commit" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          " Importing..."
        ] }) : /* @__PURE__ */ jsx(Fragment, { children: "Commit import" }) }),
        progress && busy === "commit" && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          progress.done,
          " / ",
          progress.total,
          " rows shipped"
        ] })
      ] })
    ] }),
    result && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Result" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-green-700 dark:text-green-400", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }),
          "Inserted/updated ",
          /* @__PURE__ */ jsx("strong", { children: result.inserted }),
          " of ",
          result.totalRows,
          " rows."
        ] }),
        result.droppedColumns.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
          "Dropped columns: ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: result.droppedColumns.join(", ") })
        ] }),
        result.chunkErrors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded border border-amber-500/50 bg-amber-500/10 p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-1 font-medium", children: "Chunk-level notes" }),
          /* @__PURE__ */ jsx("ul", { className: "ml-4 list-disc text-xs", children: result.chunkErrors.map((c, i) => /* @__PURE__ */ jsx("li", { children: c }, i)) })
        ] }),
        result.rowErrors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded border border-destructive/50 bg-destructive/10 p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1 font-medium", children: [
            "Row errors (",
            result.rowErrors.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Row" }),
              /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Key" }),
              /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Reason" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: result.rowErrors.slice(0, 200).map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.row }),
              /* @__PURE__ */ jsx("td", { className: "px-2 py-1 font-mono", children: r.slug ?? "—" }),
              /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.reason })
            ] }, i)) })
          ] }) }),
          result.rowErrors.length > 200 && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
            "Showing first 200 of ",
            result.rowErrors.length,
            " errors."
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
function Stat({
  label,
  value,
  hint
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded border bg-card p-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold", children: value.toLocaleString() }),
    hint && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: hint })
  ] });
}
export {
  DataImportPage as component
};
