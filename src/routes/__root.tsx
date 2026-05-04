import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { HydrationDebug } from "@/components/hydration-debug";
import { IntercomWidget } from "@/components/intercom-widget";
import {
  buildMeta,
  ldJsonScript,
  organizationJsonLd,
  websiteJsonLd,
  SITE_NAME,
} from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold text-foreground">404</h1>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
            >
              Go home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export const Route = createRootRoute({
  head: () => {
    const meta = buildMeta({
      title: "Pool Rental Near Me - Starting at $25 hour - Rent a pool now",
      description:
        "Rent a private pool by the hour or become a pool host. 10% flat fee, $2M liability coverage, 5,100+ pages across the US.",
      path: "/",
      image: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c756e8fe-7c1e-4f71-8c20-05980f90b6f7",
    });
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "author", content: SITE_NAME },
        { name: "theme-color", content: "#0ea5e9" },
        ...meta.meta,
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico" },
        ...meta.links,
      ],
      scripts: [ldJsonScript(organizationJsonLd()), ldJsonScript(websiteJsonLd())],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showIntercom = pathname === "/" || pathname.startsWith("/admin");
  return (
    <>
      <HydrationDebug />
      <Outlet />
      {showIntercom && <IntercomWidget />}
    </>
  );
}

