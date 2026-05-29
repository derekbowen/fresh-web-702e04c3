import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { buildMeta } from "@/lib/seo";

export const Route = createFileRoute("/admin/founder-blast")({
  head: () =>
    buildMeta({
      title: "Founder email retired | Admin",
      description: "The one-off founder email tool has been disabled",
      path: "/admin/founder-blast",
      noindex: true,
    }),
  component: Page,
});

function Page() {
  return (
    <AdminLayout>
      <section className="max-w-2xl rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-bold">Founder email test retired</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This one-off email sender is disabled. It will not dry-run, send, or touch your content pages.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          App email infrastructure is the path for future one-to-one emails, like confirmations and account notices.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/admin/email-branding"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Email settings
          </Link>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold"
          >
            Admin dashboard
          </Link>
        </div>
      </section>
    </AdminLayout>
  );
}
