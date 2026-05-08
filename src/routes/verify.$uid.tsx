import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { verifyCertificate } from "@/server/learning.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { coursePath } from "@/lib/course-urls";

export const Route = createFileRoute("/verify/$uid")({
  loader: async ({ params }) => {
    const result = await verifyCertificate({ data: { certificate_uid: params.uid } });
    if (!result.found) throw notFound();
    return { cert: result };
  },
  component: VerifyPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Certificate not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn't find a certificate with that ID.
        </p>
      </main>
      <SiteFooter />
    </div>
  ),
  head: ({ params }) => ({
    meta: [{ title: `Verify certificate ${params.uid} — Pool Rental Near Me` }],
  }),
});

function VerifyPage() {
  const { cert } = Route.useLoaderData();
  const revoked = !!cert.revoked_at;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              revoked
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {revoked ? "✗ Revoked" : "✓ Verified"}
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Certificate {cert.certificate_uid}
          </h1>

          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Awarded to</dt>
              <dd className="text-base font-semibold text-foreground">{cert.learner_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Course</dt>
              <dd className="text-base text-foreground">
                <a
                  href={coursePath(cert.course_slug)}
                  className="hover:text-primary hover:underline"
                >
                  {cert.course_title}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Completed on</dt>
              <dd className="text-base text-foreground">
                {new Date(cert.completed_at).toLocaleDateString()}
              </dd>
            </div>
            {revoked && (
              <div>
                <dt className="text-muted-foreground">Revoked on</dt>
                <dd className="text-base text-foreground">
                  {new Date(cert.revoked_at!).toLocaleDateString()}
                  {cert.revoke_reason ? ` — ${cert.revoke_reason}` : ""}
                </dd>
              </div>
            )}
          </dl>

          {!revoked && (
            <a
              href={`/api/certificates/${cert.certificate_uid}.pdf`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow"
            >
              Download PDF certificate
            </a>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
