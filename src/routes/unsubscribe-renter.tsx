import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useState } from "react";

const unsubscribeRenter = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(8).max(128) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("renter_subscribers")
      .select("id, email, status")
      .eq("unsubscribe_token", data.token)
      .maybeSingle();
    if (!sub) return { ok: false, reason: "invalid" as const };
    if (sub.status === "unsubscribed") return { ok: true, already: true, email: sub.email };
    await supabaseAdmin
      .from("renter_subscribers")
      .update({ status: "unsubscribed" })
      .eq("id", sub.id);
    await supabaseAdmin
      .from("renter_emails")
      .update({ status: "cancelled" })
      .eq("subscriber_id", sub.id)
      .eq("status", "pending");
    return { ok: true, email: sub.email };
  });

export const Route = createFileRoute("/unsubscribe-renter")({
  validateSearch: (s: Record<string, unknown>) => ({ token: String(s.token || "") }),
  component: Page,
});

function Page() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function confirm() {
    setState("loading");
    try {
      const r = await unsubscribeRenter({ data: { token } });
      if (r.ok) {
        setMsg(r.already ? `${r.email} is already unsubscribed.` : `Unsubscribed ${r.email}.`);
        setState("done");
      } else {
        setMsg("That unsubscribe link is invalid or expired.");
        setState("error");
      }
    } catch {
      setMsg("Something went wrong. Try again.");
      setState("error");
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "80px auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Unsubscribe</h1>
      {!token ? (
        <p>Missing unsubscribe token.</p>
      ) : state === "done" || state === "error" ? (
        <p>{msg}</p>
      ) : (
        <>
          <p style={{ color: "#475569", marginBottom: 24 }}>
            Stop receiving pool recommendation emails from Pool Rental Near Me?
          </p>
          <button
            onClick={confirm}
            disabled={state === "loading"}
            style={{ background: "#0ea5e9", color: "#fff", padding: "10px 18px", borderRadius: 8, border: 0, fontWeight: 600, cursor: "pointer" }}
          >
            {state === "loading" ? "Unsubscribing…" : "Yes, unsubscribe me"}
          </button>
        </>
      )}
    </main>
  );
}
