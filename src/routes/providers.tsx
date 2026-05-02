import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, itemListJsonLd, ldJsonScript } from "@/lib/seo";

const listProviders = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("providers")
    .select("slug, name, business_type, city, state_code, logo_url")
    .eq("is_published", true)
    .order("name");
  return { providers: data ?? [] };
});

export const Route = createFileRoute("/providers")({
  loader: () => listProviders(),
  head: ({ loaderData }) => {
    const meta = buildMeta({
      title: "Pool Service Providers Directory | Pool Rental Near Me",
      description:
        "Browse trusted pool builders, cleaners, and service providers across the US. Find local pros for your swimming pool.",
      path: "/providers",
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Providers", path: "/providers" },
    ]);
    const list = itemListJsonLd(
      (loaderData?.providers ?? []).slice(0, 50).map((p: { slug: string; name: string; logo_url: string | null }) => ({
        name: p.name,
        path: `/providers/${p.slug}`,
        image: p.logo_url,
      })),
      "Pool Service Providers",
    );
    return { ...meta, scripts: [ldJsonScript(crumbs), ldJsonScript(list)] };
  },
  component: ProvidersIndex,
});

function ProvidersIndex() {
  const { providers } = Route.useLoaderData();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Pool Service Providers</h1>
        <p className="mt-3 text-lg text-muted-foreground">Browse trusted pool builders, cleaners, and service providers.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {providers.length === 0 && <p className="text-muted-foreground">No providers listed yet.</p>}
          {providers.map((p: { slug: string; name: string; business_type: string | null; city: string | null; state_code: string | null; logo_url: string | null }) => (
            <Link key={p.slug} to="/providers/$slug" params={{ slug: p.slug }}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.name} className="h-14 w-14 rounded-lg object-cover"/>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  {p.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-foreground">{p.name}</h2>
                {(p.city || p.state_code) && (
                  <p className="text-sm text-muted-foreground">{[p.city, p.state_code].filter(Boolean).join(", ")}</p>
                )}
                {p.business_type && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{p.business_type}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
