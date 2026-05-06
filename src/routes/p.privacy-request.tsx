import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { submitPrivacyRequest } from "@/server/privacy-requests.functions";

export const Route = createFileRoute("/p/privacy-request")({
  head: () => ({
    meta: [
      { title: "Submit a privacy request | Pool Rental Near Me" },
      {
        name: "description",
        content:
          "Exercise your privacy rights under CCPA, CPRA, CPA, CTDPA, VCDPA, TDPSA, OCPA and more. We honor Global Privacy Control automatically.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyRequestPage,
});

const REQUEST_TYPES: Array<{ value: string; label: string }> = [
  { value: "access", label: "Access — give me a copy of my data" },
  { value: "delete", label: "Delete — erase my data" },
  { value: "correct", label: "Correct — fix inaccurate data" },
  { value: "portability", label: "Portability — export in machine-readable format" },
  { value: "opt_out_sale_share", label: "Opt out of sale or sharing" },
  { value: "limit_sensitive", label: "Limit use of sensitive personal information" },
  { value: "appeal", label: "Appeal a previous decision" },
  { value: "other", label: "Other privacy question" },
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

function PrivacyRequestPage() {
  const [requestType, setRequestType] = React.useState("access");
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [stateCode, setStateCode] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [gpc, setGpc] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await submitPrivacyRequest({
        data: {
          requestType: requestType as any,
          email: email.trim(),
          fullName: fullName.trim() || null,
          stateCode: stateCode || null,
          details: details.trim() || null,
          sourceUrl:
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : null,
        },
      });
      setGpc(res.gpcDetected);
      setStatus("success");
      setEmail("");
      setFullName("");
      setStateCode("");
      setDetails("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Submit a privacy request
        </h1>
        <p className="mt-3 text-muted-foreground">
          We honor every US state privacy right, regardless of where you live.
          Global Privacy Control signals from your browser are detected
          automatically. We respond within 45 days (90 with notice for complex
          requests).
        </p>

        {status === "success" ? (
          <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="text-xl font-semibold text-foreground">Got it.</h2>
            <p className="mt-2 text-muted-foreground">
              We received your request. You will get a confirmation email at the
              address you provided, and a follow-up once we verify your
              identity.
            </p>
            {gpc && (
              <p className="mt-3 text-sm text-muted-foreground">
                We also detected a Global Privacy Control signal from your
                browser and have applied an opt-out of sale/sharing to your
                session.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Request type</span>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                required
              >
                {REQUEST_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                required
                maxLength={255}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">Full name (optional)</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                maxLength={120}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">State (optional)</span>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="">— Select —</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">Details (optional)</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={4000}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              />
            </label>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting…" : "Submit request"}
            </button>

            <p className="text-xs text-muted-foreground">
              By submitting, you agree we may contact you to verify your
              identity before fulfilling the request. See our{" "}
              <a href="/privacy-policy" className="underline">privacy policy</a>{" "}
              for details.
            </p>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
