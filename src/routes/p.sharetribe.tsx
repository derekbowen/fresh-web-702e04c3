import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/p/sharetribe")({
  head: () => ({
    meta: [
      { title: "Marketplace dashboard sign in — PRNM" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SharetribeLoginGate,
});

function SharetribeLoginGate() {
  const [status, setStatus] = React.useState<"checking" | "signed_out" | "no_access" | "ready">(
    "checking",
  );
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setStatus("signed_out");
        return;
      }
      setEmail(data.user.email ?? null);
      try {
        const r = await checkAdminRole();
        if (cancelled) return;
        if (r.isAdmin) {
          window.location.replace("/admin/sharetribe");
        } else {
          setStatus("no_access");
        }
      } catch {
        if (!cancelled) setStatus("no_access");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">Marketplace dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to view the Sharetribe marketplace dashboard for poolrentalnearme.com.
          </p>

          {status === "checking" && (
            <p className="mt-6 text-sm text-muted-foreground">Checking your access…</p>
          )}

          {status === "signed_out" && (
            <div className="mt-6 space-y-3">
              <Link
                to="/auth"
                search={{ redirect: "/admin/sharetribe", mode: "signin" }}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                Sign in to continue
              </Link>
              <Link
                to="/auth"
                search={{ redirect: "/admin/sharetribe", mode: "signup" }}
                className="inline-flex w-full items-center justify-center rounded-md border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                Create an account
              </Link>
              <p className="text-xs text-muted-foreground">
                After creating an account, ask an existing admin to grant you access.
              </p>
            </div>
          )}

          {status === "no_access" && (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                You're signed in as <span className="font-mono">{email}</span>, but this account
                doesn't have access to the marketplace dashboard yet. Send your email to an existing
                admin to be granted access.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={signOut}>
                  Sign in as a different account
                </Button>
                <Link
                  to="/"
                  className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Back to site
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
