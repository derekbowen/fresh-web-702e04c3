import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { A as AdminLayout } from "./admin-layout-Ck0iqDJo.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { T as Textarea } from "./textarea-DSyJ1nlY.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-DK4TJU2r.js";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { aT as getSiteFooterAdmin, aU as resetSiteFooter, aV as updateSiteFooter } from "./router-BTf4C8qB.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "./client-Dh5RMKgP.js";
import "@supabase/supabase-js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
import "./client.server-D5ro3rAQ.js";
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
  urls: z.array(z.string().min(1).max(500)).min(1).max(50)
});
const validateSocialUrlsFn = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => InputSchema.parse(data)).handler(createSsrRpc("72bc10a4bba57c55fb85cc14e6562cbbb1e0616b73c26bfd99034d5612eb4fe6"));
const SOCIAL_OPTIONS = ["facebook", "x", "twitter", "youtube", "linkedin", "instagram", "tiktok", "pinterest"];
function SiteFooterAdmin() {
  const [data, setData] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [validating, setValidating] = React.useState(false);
  const [socialResults, setSocialResults] = React.useState({});
  React.useEffect(() => {
    getSiteFooterAdmin().then(setData).catch((e) => toast.error(e.message));
  }, []);
  if (!data) {
    return /* @__PURE__ */ jsx(AdminLayout, { title: "Site Footer", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }) });
  }
  const update = (key, value) => setData((d) => d ? {
    ...d,
    [key]: value
  } : d);
  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updateSiteFooter({
        data
      });
      toast.success("Footer saved. Reload pages to see changes.");
    } catch (e) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };
  const reset = async () => {
    if (!confirm("Reset footer to defaults?")) return;
    setSaving(true);
    try {
      await resetSiteFooter();
      const fresh = await getSiteFooterAdmin();
      setData(fresh);
      toast.success("Reset to defaults.");
    } catch (e) {
      toast.error(e.message ?? "Reset failed");
    } finally {
      setSaving(false);
    }
  };
  const validateSocials = async () => {
    if (!data) return;
    const urls = data.socials.map((s) => s.href).filter((h) => /^https?:\/\//i.test(h));
    if (urls.length === 0) {
      toast.error("No http(s) social URLs to validate.");
      return;
    }
    setValidating(true);
    try {
      const {
        results
      } = await validateSocialUrlsFn({
        data: {
          urls
        }
      });
      const map = {};
      let rewrites = 0;
      let broken = 0;
      const next = [...data.socials];
      results.forEach((r) => {
        const idx = next.findIndex((s) => s.href === r.input);
        if (idx === -1) return;
        map[idx] = {
          status: r.status,
          httpStatus: r.httpStatus,
          reason: r.reason,
          workingUrl: r.workingUrl
        };
        if (r.workingUrl && r.workingUrl !== r.input && (r.status === "rewritten" || r.status === "ok")) {
          next[idx] = {
            ...next[idx],
            href: r.workingUrl
          };
          rewrites += 1;
        }
        if (r.status === "not_found" || r.status === "redirect_to_login" || r.status === "invalid") {
          broken += 1;
        }
      });
      setSocialResults(map);
      if (rewrites > 0) {
        update("socials", next);
        toast.success(`Rewrote ${rewrites} URL${rewrites === 1 ? "" : "s"}. Click Save to persist.`);
      } else if (broken > 0) {
        toast.warning(`${broken} link${broken === 1 ? "" : "s"} look broken. See badges below.`);
      } else {
        toast.success("All social links look healthy.");
      }
    } catch (e) {
      toast.error(e.message ?? "Validation failed");
    } finally {
      setValidating(false);
    }
  };
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Site Footer", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 pb-6", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Edit company links, contact info, social icons, and popular markets shown in the global footer." }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: reset, disabled: saving, children: "Reset defaults" }),
        /* @__PURE__ */ jsx(Button, { onClick: save, disabled: saving, children: saving ? "Saving…" : "Save changes" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Contact" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsx(Field, { label: "Phone label", value: data.contact_phone_label ?? "", onChange: (v) => update("contact_phone_label", v || null), placeholder: "Call us 888-940-4247" }),
          /* @__PURE__ */ jsx(Field, { label: "Phone link (tel:)", value: data.contact_phone ?? "", onChange: (v) => update("contact_phone", v || null), placeholder: "tel:18889404247" }),
          /* @__PURE__ */ jsx(Field, { label: "Hours", value: data.contact_phone_hours ?? "", onChange: (v) => update("contact_phone_hours", v || null), placeholder: "10am - 5pm PST" }),
          /* @__PURE__ */ jsx(Field, { label: "Support email", value: data.contact_email ?? "", onChange: (v) => update("contact_email", v || null), placeholder: "support@example.com" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Bottom legal text" }),
            /* @__PURE__ */ jsx(Textarea, { value: data.bottom_text ?? "", onChange: (e) => update("bottom_text", e.target.value || null), placeholder: "© 2026 Company Inc.", rows: 2 })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Social Links" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: validateSocials, disabled: validating, children: validating ? "Validating…" : "Validate & fix URLs" })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          data.socials.map((s, i) => {
            const r = socialResults[i];
            return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_1fr_2fr_auto] gap-2", children: [
                /* @__PURE__ */ jsx("select", { className: "h-10 rounded-md border border-input bg-background px-2 text-sm", value: s.icon, onChange: (e) => updateArrayItem(setData, "socials", i, {
                  ...s,
                  icon: e.target.value
                }), children: SOCIAL_OPTIONS.map((o) => /* @__PURE__ */ jsx("option", { value: o, children: o }, o)) }),
                /* @__PURE__ */ jsx(Input, { value: s.label, onChange: (e) => updateArrayItem(setData, "socials", i, {
                  ...s,
                  label: e.target.value
                }), placeholder: "Label" }),
                /* @__PURE__ */ jsx(Input, { value: s.href, onChange: (e) => updateArrayItem(setData, "socials", i, {
                  ...s,
                  href: e.target.value
                }), placeholder: "https://…" }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => removeArrayItem(setData, "socials", i), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
              ] }),
              r ? /* @__PURE__ */ jsx(SocialStatusBadge, { status: r.status, httpStatus: r.httpStatus, reason: r.reason }) : null
            ] }, i);
          }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => addArrayItem(setData, "socials", {
            label: "",
            href: "",
            icon: "facebook"
          }), children: [
            /* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }),
            " Add social"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(LinkColumnEditor, { title: "Explore", field: "explore_links", data, setData }),
      /* @__PURE__ */ jsx(LinkColumnEditor, { title: "Become a Host", field: "host_links", data, setData }),
      /* @__PURE__ */ jsx(LinkColumnEditor, { title: "Compare", field: "compare_links", data, setData }),
      /* @__PURE__ */ jsx(LinkColumnEditor, { title: "Company", field: "company_links", data, setData }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Popular Markets" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          data.popular_markets.map((mkt, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_1fr_auto] gap-2", children: [
            /* @__PURE__ */ jsx(Input, { value: mkt.name, onChange: (e) => updateArrayItem(setData, "popular_markets", i, {
              ...mkt,
              name: e.target.value
            }), placeholder: "City, ST" }),
            /* @__PURE__ */ jsx(Input, { value: mkt.slug, onChange: (e) => updateArrayItem(setData, "popular_markets", i, {
              ...mkt,
              slug: e.target.value
            }), placeholder: "city-st" }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => removeArrayItem(setData, "popular_markets", i), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
          ] }, i)),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => addArrayItem(setData, "popular_markets", {
            name: "",
            slug: ""
          }), children: [
            /* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }),
            " Add market"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: reset, disabled: saving, children: "Reset defaults" }),
      /* @__PURE__ */ jsx(Button, { onClick: save, disabled: saving, children: saving ? "Saving…" : "Save changes" })
    ] })
  ] });
}
function SocialStatusBadge({
  status,
  httpStatus,
  reason
}) {
  const tone = status === "ok" ? "bg-emerald-100 text-emerald-800" : status === "rewritten" ? "bg-blue-100 text-blue-800" : status === "blocked" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  const label = status === "ok" ? "OK" : status === "rewritten" ? "Rewritten ✓" : status === "blocked" ? `Blocked (${httpStatus ?? "?"}) — likely live` : status === "redirect_to_login" ? "Redirects to login (broken)" : status === "not_found" ? `Not found (${httpStatus ?? "?"})` : status === "invalid" ? "Invalid URL" : status === "network_error" ? "Network error" : status;
  return /* @__PURE__ */ jsx("div", { className: `inline-block rounded px-2 py-0.5 text-xs ${tone}`, title: reason, children: label });
}
function Field({
  label,
  value,
  onChange,
  placeholder
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Label, { children: label }),
    /* @__PURE__ */ jsx(Input, { value, onChange: (e) => onChange(e.target.value), placeholder })
  ] });
}
function LinkColumnEditor({
  title,
  field,
  data,
  setData
}) {
  const items = data[field];
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: title }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
      items.map((it, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_2fr_auto] gap-2", children: [
        /* @__PURE__ */ jsx(Input, { value: it.label, onChange: (e) => updateArrayItem(setData, field, i, {
          ...it,
          label: e.target.value
        }), placeholder: "Label" }),
        /* @__PURE__ */ jsx(Input, { value: it.href, onChange: (e) => updateArrayItem(setData, field, i, {
          ...it,
          href: e.target.value
        }), placeholder: "/path or https://…" }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => removeArrayItem(setData, field, i), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
      ] }, i)),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => addArrayItem(setData, field, {
        label: "",
        href: ""
      }), children: [
        /* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }),
        " Add link"
      ] })
    ] })
  ] });
}
function updateArrayItem(setData, key, index, value) {
  setData((d) => {
    if (!d) return d;
    const arr = [...d[key]];
    arr[index] = value;
    return {
      ...d,
      [key]: arr
    };
  });
}
function addArrayItem(setData, key, value) {
  setData((d) => d ? {
    ...d,
    [key]: [...d[key], value]
  } : d);
}
function removeArrayItem(setData, key, index) {
  setData((d) => {
    if (!d) return d;
    const arr = [...d[key]];
    arr.splice(index, 1);
    return {
      ...d,
      [key]: arr
    };
  });
}
export {
  SiteFooterAdmin as component
};
