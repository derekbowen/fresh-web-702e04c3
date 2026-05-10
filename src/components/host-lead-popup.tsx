import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitHostLead } from "@/lib/host-lead.functions";

interface Props {
  cityName?: string;
  stateCode?: string;
  delayMs?: number;
}

export function HostLeadPopup({ cityName, stateCode, delayMs = 20000 }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const submit = useServerFn(submitHostLead);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "host-lead-popup-shown";
    if (sessionStorage.getItem(KEY)) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(KEY, "1");
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submit({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: cityName ?? null,
          region: stateCode ?? null,
          page: typeof window !== "undefined" ? window.location.pathname : null,
        },
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="host-lead-popup-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              ✓
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">You're on the list</h2>
            <p className="mt-2 text-muted-foreground">
              A host advisor will reach out shortly to help you get your{" "}
              {cityName || "pool"} listing live.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Free 5-min host consult
            </div>
            <h2
              id="host-lead-popup-title"
              className="mt-2 text-2xl font-bold leading-tight text-foreground"
            >
              Want help listing your {cityName || "pool"}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Drop your details and a PRNM host advisor will call to walk you
              through pricing, photos, and your first booking.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                maxLength={120}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                maxLength={255}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                maxLength={40}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Get my free consult"}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">
                No spam. We'll only use this to help you start hosting.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
