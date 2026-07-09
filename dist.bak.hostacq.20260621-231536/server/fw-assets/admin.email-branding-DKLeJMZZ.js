import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { bd as getEmailBranding, be as previewAuthEmail, bf as updateEmailBranding } from "./router-OI82CwOi.js";
import { A as AdminLayout } from "./admin-layout-7nNRKAex.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { T as Textarea } from "./textarea-DSyJ1nlY.js";
import { toast } from "sonner";
import "@tanstack/react-router";
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
import "./client-Dh5RMKgP.js";
import "lucide-react";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "@react-email/components";
import "./registry-Dn-QpeYo.js";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-CZnPPh9d.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Cdm15px5.js";
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
const EMPTY = {
  site_name: "",
  sender_name: "",
  logo_url: "",
  primary_color: "#000000",
  primary_text_color: "#ffffff",
  footer_text: ""
};
const TYPES = [{
  id: "signup",
  label: "Signup confirmation"
}, {
  id: "magiclink",
  label: "Magic link"
}, {
  id: "recovery",
  label: "Password recovery"
}, {
  id: "invite",
  label: "Invite"
}, {
  id: "email_change",
  label: "Email change"
}, {
  id: "reauthentication",
  label: "Reauthentication"
}];
function EmailBrandingPage() {
  const [form, setForm] = React.useState(EMPTY);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [previewType, setPreviewType] = React.useState("signup");
  const [previewHtml, setPreviewHtml] = React.useState("");
  const [previewLoading, setPreviewLoading] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        const data = await getEmailBranding();
        setForm({
          site_name: data.site_name,
          sender_name: data.sender_name,
          logo_url: data.logo_url ?? "",
          primary_color: data.primary_color,
          primary_text_color: data.primary_text_color,
          footer_text: data.footer_text ?? ""
        });
      } catch (e) {
        toast.error(e?.message || "Failed to load branding");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const set = (k, v) => setForm((f) => ({
    ...f,
    [k]: v
  }));
  async function loadPreview(type) {
    setPreviewLoading(true);
    setPreviewHtml("");
    try {
      const {
        html
      } = await previewAuthEmail({
        data: {
          type
        }
      });
      setPreviewHtml(html);
    } catch (e) {
      setPreviewHtml(`<p style="padding:24px;font-family:sans-serif;color:#888">Preview unavailable: ${e?.message || "error"}</p>`);
    } finally {
      setPreviewLoading(false);
    }
  }
  React.useEffect(() => {
    void loadPreview(previewType);
  }, [previewType]);
  async function handleSave() {
    setSaving(true);
    try {
      await updateEmailBranding({
        data: {
          site_name: form.site_name,
          sender_name: form.sender_name,
          logo_url: form.logo_url || null,
          primary_color: form.primary_color,
          primary_text_color: form.primary_text_color,
          footer_text: form.footer_text || null
        }
      });
      toast.success("Branding saved");
      void loadPreview(previewType);
    } catch (e) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return /* @__PURE__ */ jsx(AdminLayout, { title: "Email branding", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }) });
  }
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Email branding", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Branding" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Applied to all auth emails (signup, magic link, password reset, invite, email change, reauthentication)." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "site_name", children: "Site name" }),
        /* @__PURE__ */ jsx(Input, { id: "site_name", value: form.site_name, onChange: (e) => set("site_name", e.target.value) }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Shown in subjects, body copy, and previews." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "sender_name", children: "Sender name" }),
        /* @__PURE__ */ jsx(Input, { id: "sender_name", value: form.sender_name, onChange: (e) => set("sender_name", e.target.value) }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: '"From" name on the email envelope.' })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "logo_url", children: "Logo URL" }),
        /* @__PURE__ */ jsx(Input, { id: "logo_url", placeholder: "https://…/logo.png", value: form.logo_url, onChange: (e) => set("logo_url", e.target.value) }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Optional. Renders at the top of every email (~40px tall)." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "primary_color", children: "Button background" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx("input", { type: "color", value: form.primary_color, onChange: (e) => set("primary_color", e.target.value), className: "h-10 w-12 cursor-pointer rounded border border-border bg-background" }),
            /* @__PURE__ */ jsx(Input, { id: "primary_color", value: form.primary_color, onChange: (e) => set("primary_color", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "primary_text_color", children: "Button text" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx("input", { type: "color", value: form.primary_text_color, onChange: (e) => set("primary_text_color", e.target.value), className: "h-10 w-12 cursor-pointer rounded border border-border bg-background" }),
            /* @__PURE__ */ jsx(Input, { id: "primary_text_color", value: form.primary_text_color, onChange: (e) => set("primary_text_color", e.target.value) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "footer_text", children: "Footer text" }),
        /* @__PURE__ */ jsx(Textarea, { id: "footer_text", rows: 3, placeholder: "© Pool Rental Near Me · 123 Main St · Reply to this email if you need help.", value: form.footer_text, onChange: (e) => set("footer_text", e.target.value) }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Optional. Appears below the body of every auth email." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsx(Button, { onClick: handleSave, disabled: saving, children: saving ? "Saving…" : "Save branding" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: TYPES.map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setPreviewType(t.id), className: `rounded-md border px-2.5 py-1 text-xs ${previewType === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`, children: t.label }, t.id)) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-white", children: previewLoading ? /* @__PURE__ */ jsx("div", { className: "p-6 text-sm text-muted-foreground", children: "Loading preview…" }) : /* @__PURE__ */ jsx("iframe", { title: "Email preview", srcDoc: previewHtml, className: "h-[640px] w-full border-0" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Preview reflects the saved branding. Save changes, then re-render to update." })
    ] })
  ] }) });
}
export {
  EmailBrandingPage as component
};
