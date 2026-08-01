import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-fwIJkCGX.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { toast } from "sonner";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "lucide-react";
import "./router-Bw8GQi9C.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./renter-drip.server-CMz_M9Zp.js";
import "node:fs";
import "node:path";
import "./host-drip.server-nBw4NS9X.js";
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
const adminListBlogPosts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("df1ce286e5d0c0945818d77c80adb5b1f79260ccf04dcc41d839b3ed89b4f398"));
const expandSchema = z.object({
  slug: z.string().min(1).max(160),
  model: z.string().optional()
});
const adminExpandBlogPost = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => expandSchema.parse(d)).handler(createSsrRpc("89efd1407c91e91778a4f37de8144a2b14ae0ee3365eea29217c7832cd0cee6d"));
const generateSchema = z.object({
  count: z.number().int().min(1).max(10).optional(),
  topic: z.string().max(120).optional(),
  titleHint: z.string().max(200).optional(),
  model: z.string().optional(),
  autoPublish: z.boolean().optional()
});
const adminGenerateBlogPost = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => generateSchema.parse(d)).handler(createSsrRpc("76750b92c29342f211d88835938de0ae626c9febbd33e097a5da36a8af863235"));
const bulkPublishSchema = z.object({
  slugs: z.array(z.string().min(1).max(160)).min(1).max(100),
  publish: z.boolean()
});
const adminBulkPublishBlogPosts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => bulkPublishSchema.parse(d)).handler(createSsrRpc("a9e8884ed1234a6c7a33fe52762212decdb3f84d1120f7f10f7da435fdfed1d2"));
function AdminBlogPage() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState({});
  const [filter, setFilter] = useState("");
  const [genCount, setGenCount] = useState("3");
  const [genTopic, setGenTopic] = useState("");
  const [genHint, setGenHint] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const toggleSel = (slug) => setSelected((s) => {
    const next = new Set(s);
    next.has(slug) ? next.delete(slug) : next.add(slug);
    return next;
  });
  const generate = async (autoPublish) => {
    const n = Math.min(Math.max(parseInt(genCount) || 1, 1), 10);
    const verb = autoPublish ? "Generate & publish" : "Generate";
    if (!confirm(`${verb} ${n} new blog post${n > 1 ? "s" : ""} with AI?${autoPublish ? " They will go LIVE immediately." : " They'll be saved as drafts."} Uses credits.`)) return;
    setGenerating(true);
    try {
      const res = await adminGenerateBlogPost({
        data: {
          count: n,
          topic: genTopic.trim() || void 0,
          titleHint: genHint.trim() || void 0,
          autoPublish
        }
      });
      if (res.created.length > 0) {
        toast.success(`Created ${res.created.length} ${autoPublish ? "live post" : "draft"}${res.created.length > 1 ? "s" : ""}.`);
      }
      if (res.errors.length > 0) {
        toast.error(`${res.errors.length} failed: ${res.errors[0]}`);
      }
      if (res.created.length === 0 && res.errors.length === 0) {
        toast.info("No posts generated. Try a different topic.");
      }
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };
  const bulkPublish = async (publish) => {
    const slugs = Array.from(selected);
    if (slugs.length === 0) {
      toast.info("Select some posts first.");
      return;
    }
    if (!confirm(`${publish ? "Publish" : "Unpublish"} ${slugs.length} post${slugs.length > 1 ? "s" : ""}?`)) return;
    setBulkBusy(true);
    try {
      await adminBulkPublishBlogPosts({
        data: {
          slugs,
          publish
        }
      });
      toast.success(`${publish ? "Published" : "Unpublished"} ${slugs.length}.`);
      setSelected(/* @__PURE__ */ new Set());
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkBusy(false);
    }
  };
  const refresh = () => {
    adminListBlogPosts({
      data: void 0
    }).then((r) => setRows(r.rows)).catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  };
  useEffect(() => {
    refresh();
  }, []);
  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(q) || (r.topic ?? "").toLowerCase().includes(q) || r.slug.includes(q));
  }, [rows, filter]);
  const expand = async (slug) => {
    setBusy((b) => ({
      ...b,
      [slug]: true
    }));
    try {
      const res = await adminExpandBlogPost({
        data: {
          slug
        }
      });
      toast.success(`Expanded: ${res.word_count} words`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy((b) => ({
        ...b,
        [slug]: false
      }));
    }
  };
  const expandAllShort = async () => {
    if (!filtered) return;
    const targets = filtered.filter((r) => r.word_count < 500);
    if (targets.length === 0) {
      toast.info("Nothing under 500 words to expand.");
      return;
    }
    if (!confirm(`Expand ${targets.length} posts with AI? This will use credits.`)) return;
    for (const t of targets) {
      await expand(t.slug);
      await new Promise((r) => setTimeout(r, 600));
    }
  };
  const grouped = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const r of filtered ?? []) {
      const k = r.topic ?? "Uncategorized";
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("section", { className: "mb-6 rounded-lg border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Auto-generate posts with AI" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Brainstorms titles, writes full ~900-word drafts, saves as unpublished. Optional category and topic hint focus the output." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "How many" }),
          /* @__PURE__ */ jsx(Input, { type: "number", min: 1, max: 10, value: genCount, onChange: (e) => setGenCount(e.target.value), className: "w-20" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Category (optional)" }),
          /* @__PURE__ */ jsx(Input, { placeholder: "e.g. Hosting, Pricing, Insurance", value: genTopic, onChange: (e) => setGenTopic(e.target.value), className: "w-56" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-xs flex-1 min-w-[220px]", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Topic hint (optional)" }),
          /* @__PURE__ */ jsx(Input, { placeholder: "e.g. winterizing, pet-friendly rentals, LLC setup", value: genHint, onChange: (e) => setGenHint(e.target.value) })
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: () => generate(false), disabled: generating, variant: "secondary", children: generating ? "Generating…" : "Generate drafts" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => generate(true), disabled: generating, children: generating ? "Generating…" : "Generate & publish" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Daily auto-generation runs in the background — drafts appear here for review." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold", children: "Blog admin" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          rows?.length ?? "…",
          " posts. Click ",
          /* @__PURE__ */ jsx("em", { children: "Expand with AI" }),
          " to replace seed content with a full article."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Input, { placeholder: "Filter by title, topic, slug…", value: filter, onChange: (e) => setFilter(e.target.value), className: "w-64" }),
        /* @__PURE__ */ jsx(Button, { variant: "secondary", onClick: expandAllShort, disabled: !rows, children: "Expand all short" }),
        /* @__PURE__ */ jsxs(Button, { variant: "secondary", onClick: () => bulkPublish(true), disabled: bulkBusy || selected.size === 0, children: [
          "Publish selected (",
          selected.size,
          ")"
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => bulkPublish(false), disabled: bulkBusy || selected.size === 0, children: "Unpublish" })
      ] })
    ] }),
    err && /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", children: err }),
    !rows && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }),
    grouped.map(([topic, list]) => /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
      /* @__PURE__ */ jsxs("h2", { className: "mb-3 text-lg font-semibold", children: [
        topic,
        " ",
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-normal text-muted-foreground", children: [
          "(",
          list.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-md border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 w-8" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Title" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 w-24", children: "Words" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 w-20", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 w-56", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: list.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 align-middle", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selected.has(r.slug), onChange: () => toggleSel(r.slug), "aria-label": `Select ${r.title}` }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: r.title }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              "/p/",
              r.slug
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 tabular-nums", children: /* @__PURE__ */ jsx("span", { className: r.word_count < 500 ? "text-amber-600" : "", children: r.word_count }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.is_published ? /* @__PURE__ */ jsx("span", { className: "text-green-700", children: "Live" }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Draft" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => expand(r.slug), disabled: busy[r.slug], children: busy[r.slug] ? "Expanding…" : "Expand with AI" }),
            /* @__PURE__ */ jsx(Link, { to: "/p/$slug", params: {
              slug: r.slug
            }, target: "_blank", className: "text-sm underline self-center", children: "View" })
          ] }) })
        ] }, r.slug)) })
      ] }) })
    ] }, topic))
  ] });
}
export {
  AdminBlogPage as component
};
