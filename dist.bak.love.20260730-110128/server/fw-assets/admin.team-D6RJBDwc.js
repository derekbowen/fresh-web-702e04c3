import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { l as listAdmins, c as createAdminUser, g as grantAdmin, s as setAdminPassword, a as sendAdminPasswordReset, r as revokeAdmin } from "./admin-team.functions-qzr_3iZn.js";
import { A as AdminLayout } from "./admin-layout-CDM94Hwn.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { toast } from "sonner";
import "./cities.functions-DKA5O9eJ.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./auth-middleware-Bd-cw3tB.js";
import "./createMiddleware-BvN2ghIY.js";
import "lucide-react";
import "./router-CKC3KRbd.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./renter-drip.server-BojrhpHE.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BKqTDlWn.js";
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
function genPassword(len = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}
function TeamPage() {
  const [admins, setAdmins] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [identifier, setIdentifier] = React.useState("");
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await listAdmins();
      setAdmins(r.admins);
    } catch (e) {
      toast.error(e?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    void load();
  }, [load]);
  async function onCreate(e) {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword || busy) return;
    setBusy(true);
    try {
      await createAdminUser({
        data: {
          email: newEmail.trim(),
          password: newPassword,
          full_name: newName.trim() || void 0
        }
      });
      toast.success(`Admin created. Password: ${newPassword}`);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      await load();
    } catch (e2) {
      toast.error(e2?.message || "Failed to create admin");
    } finally {
      setBusy(false);
    }
  }
  async function onGrant(e) {
    e.preventDefault();
    if (!identifier.trim() || busy) return;
    setBusy(true);
    try {
      await grantAdmin({
        data: {
          identifier: identifier.trim()
        }
      });
      toast.success("Admin granted.");
      setIdentifier("");
      await load();
    } catch (e2) {
      toast.error(e2?.message || "Failed to grant admin");
    } finally {
      setBusy(false);
    }
  }
  async function onRevoke(user_id, label) {
    if (!confirm(`Remove admin access from ${label}?`)) return;
    try {
      await revokeAdmin({
        data: {
          user_id
        }
      });
      toast.success("Admin removed.");
      await load();
    } catch (e) {
      toast.error(e?.message || "Failed to remove admin");
    }
  }
  async function onResetPassword(user_id, label) {
    const pwd = prompt(`Set new password for ${label} (min 8 chars). Leave empty to auto-generate:`);
    if (pwd === null) return;
    const password = pwd.trim() || genPassword();
    if (password.length < 8) {
      toast.error("Password too short");
      return;
    }
    try {
      await setAdminPassword({
        data: {
          user_id,
          password
        }
      });
      window.prompt(`New password for ${label} (copy this):`, password);
      toast.success("Password updated.");
    } catch (e) {
      toast.error(e?.message || "Failed to update password");
    }
  }
  async function onSendReset(email) {
    try {
      await sendAdminPasswordReset({
        data: {
          email
        }
      });
      toast.success(`Password reset email sent to ${email}`);
    } catch (e) {
      toast.error(e?.message || "Failed to send reset email");
    }
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Team", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Admin team" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Create new admin accounts with email + password, or grant admin access to an existing user." }),
    /* @__PURE__ */ jsxs("form", { onSubmit: onCreate, className: "mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Email" }),
        /* @__PURE__ */ jsx(Input, { value: newEmail, onChange: (e) => setNewEmail(e.target.value), placeholder: "user@example.com", type: "email", className: "mt-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Full name (optional)" }),
        /* @__PURE__ */ jsx(Input, { value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "Jane Doe", className: "mt-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Password" }),
        /* @__PURE__ */ jsx(Input, { value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "min 8 chars", className: "mt-1" })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setNewPassword(genPassword()), children: "Generate" }),
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy || !newEmail.trim() || newPassword.length < 8, children: busy ? "Creating…" : "Create admin" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: onGrant, className: "mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-[260px] flex-1", children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Grant admin to existing user (email or user ID)" }),
        /* @__PURE__ */ jsx(Input, { value: identifier, onChange: (e) => setIdentifier(e.target.value), placeholder: "helper@example.com", className: "mt-1" })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", variant: "secondary", disabled: busy || !identifier.trim(), children: busy ? "Granting…" : "Grant admin" })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-8 rounded-xl border border-border", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-2", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold uppercase tracking-wide text-muted-foreground", children: [
          "Current admins (",
          admins.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: load, className: "text-xs font-medium text-primary hover:underline", children: "Refresh" })
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-border", children: [
        loading && /* @__PURE__ */ jsx("li", { className: "px-4 py-6 text-center text-sm text-muted-foreground", children: "Loading…" }),
        !loading && admins.length === 0 && /* @__PURE__ */ jsx("li", { className: "px-4 py-6 text-center text-sm text-muted-foreground", children: "No admins yet." }),
        admins.map((a) => {
          const name = a.full_name || a.display_name || "(no name)";
          const label = a.email || name;
          return /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "truncate text-sm font-medium", children: name }),
              /* @__PURE__ */ jsx("div", { className: "truncate text-xs text-muted-foreground", children: a.email || "(no email)" }),
              /* @__PURE__ */ jsx("div", { className: "truncate font-mono text-[10px] text-muted-foreground/70", children: a.user_id }),
              a.last_sign_in_at && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
                "Last sign-in: ",
                new Date(a.last_sign_in_at).toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => onResetPassword(a.user_id, label), className: "rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold hover:bg-accent", children: "Set password" }),
              a.email && /* @__PURE__ */ jsx("button", { onClick: () => onSendReset(a.email), className: "rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold hover:bg-accent", children: "Send reset email" }),
              /* @__PURE__ */ jsx("button", { onClick: () => onRevoke(a.user_id, label), className: "rounded-md border border-red-500/40 bg-red-500/5 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-300", children: "Remove" })
            ] })
          ] }, a.user_id);
        })
      ] })
    ] })
  ] });
}
export {
  TeamPage as component
};
