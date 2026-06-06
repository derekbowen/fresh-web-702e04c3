import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useState } from "react";

const unsubscribeComposer = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(8).max(512) }).parse(d))
  .handler(async ({ data }) => {
    const { unsubscribeComposerByToken } = await import("@/server/email-composer.server");
    return await unsubscribeComposerByToken(data.token);
  });

export const Route = createFileRoute("/unsubscribe-composer")({
  validateSearch: (s: Record<string, unknown>) => ({ token: String(s.token || "") }),
  component: Page,
});

function Page() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function confirm() {
    setState("loading");
    try {
      const r = await unsubscribeComposer({ data: { token } });
      if (r.ok) {
        setMsg(r.already ? `${r.email} is already unsubscribed.` : `Unsubscribed ${r.email}.`);
        setState("done");
      } else {
        setMsg("That unsubscribe link is invalid or expired.");
        setState("error");
      }
    } catch {
      setMsg("Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold mb-3">Unsubscribe</h1>
      {state === "idle" && (
        <>
          <p className="text-slate-600 mb-4">Click to unsubscribe from Pool Rental Near Me emails.</p>
          <button onClick={confirm} className="px-4 py-2 rounded bg-sky-600 text-white">Confirm unsubscribe</button>
        </>
      )}
      {state === "loading" && <p>Working…</p>}
      {(state === "done" || state === "error") && <p className={state === "error" ? "text-red-600" : "text-emerald-700"}>{msg}</p>}
    </main>
  );
}
