import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/admin") {
      throw redirect({ to: "/admin/dashboard", replace: true });
    }

    // Server-side + client-side auth gate for every /admin/* route.
    // On SSR (no session in localStorage), this redirects to /auth before
    // any admin HTML/shell is emitted. On the client, it re-validates after
    // hydration. Child routes may add their own checks as defense-in-depth.
    if (path === "/admin/no-access") return;

    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }
    if (!userId) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.pathname, mode: "signin" },
      });
    }
    try {
      const { isAdmin } = await checkAdminRole();
      if (!isAdmin) throw redirect({ to: "/admin/no-access" });
    } catch (e: any) {
      if (e?.isRedirect) throw e;
      throw redirect({
        to: "/auth",
        search: { redirect: location.pathname, mode: "signin" },
      });
    }
  },
  head: () => ({
    meta: [
      // iOS: launch full-screen with no Safari chrome when saved to Home Screen
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "PRNM Admin" },
      { name: "theme-color", content: "#0ea5e9" },
      { name: "robots", content: "noindex,nofollow" },
    ],
    links: [
      { rel: "manifest", href: "/admin-manifest.webmanifest" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  }),
  component: () => <Outlet />,
});
