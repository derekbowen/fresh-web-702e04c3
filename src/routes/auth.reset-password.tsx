import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [{ title: "Reset password — Pool Rental Near Me" }],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  // If the URL contains a recovery token (`?type=recovery&...`) Supabase will
  // restore a session for the user — show the "set new password" form.
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (url.searchParams.get("type") === "recovery" || hash.get("type") === "recovery") {
      setHasRecoverySession(true);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecoverySession(true);
    });
  }, []);

  async function sendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email for a reset link.");
    } finally {
      setBusy(false);
    }
  }

  async function setPassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated.");
      navigate({ to: "/account/learning" as never });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {hasRecoverySession ? "Set a new password" : "Reset your password"}
          </h1>

          {hasRecoverySession ? (
            <form onSubmit={setPassword} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Saving…" : "Update password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={sendResetEmail} className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the email associated with your account and we'll send a reset link.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Sending…" : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/auth" className="hover:text-primary">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
