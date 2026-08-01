import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useSearch } from "@tanstack/react-router";
function UnsubscribePage() {
  const {
    token
  } = useSearch({
    from: "/unsubscribe"
  });
  const [status, setStatus] = React.useState("validating");
  React.useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`).then(async (r) => {
      const body = await r.json().catch(() => ({}));
      if (cancelled) return;
      if (!r.ok) {
        setStatus("invalid");
        return;
      }
      if (body.valid) setStatus("ready");
      else if (body.reason === "already_unsubscribed") setStatus("already");
      else setStatus("invalid");
    }).catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [token]);
  async function confirm() {
    if (!token) return;
    setStatus("submitting");
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token
        })
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus("error");
        return;
      }
      if (body.success) setStatus("success");
      else if (body.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-4 py-16", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Unsubscribe" }),
    status === "validating" && /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "Checking your link…" }),
    status === "ready" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "Click below to stop receiving emails from Pool Rental Near Me." }),
      /* @__PURE__ */ jsx("button", { onClick: confirm, className: "mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow hover:bg-primary/90", children: "Confirm unsubscribe" })
    ] }),
    status === "submitting" && /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "Processing…" }),
    status === "success" && /* @__PURE__ */ jsx("p", { className: "mt-4 text-foreground", children: "You've been unsubscribed. We won't email you again." }),
    status === "already" && /* @__PURE__ */ jsx("p", { className: "mt-4 text-foreground", children: "You're already unsubscribed. No further action needed." }),
    status === "invalid" && /* @__PURE__ */ jsx("p", { className: "mt-4 text-destructive", children: "This unsubscribe link is invalid or expired." }),
    status === "error" && /* @__PURE__ */ jsx("p", { className: "mt-4 text-destructive", children: "Something went wrong. Please try the link again or contact support." })
  ] }) });
}
export {
  UnsubscribePage as component
};
