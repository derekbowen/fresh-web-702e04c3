import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHostLifecycleJobHtml, getHostLifecycleOverview, previewHostLifecycleTemplate } from "@/server/host-lifecycle.functions";
import { TEMPLATE_KEYS } from "@/lib/host-lifecycle/templates";

export const Route = createFileRoute("/admin/host-lifecycle")({
  component: HostLifecyclePage,
});

/**
 * Read-only observability + template preview for the host lifecycle engine.
 * No button on this page sends anything. Sending is governed by EAST's
 * environment (HOST_EMAIL_MODE, HOST_LIFECYCLE_EMAILS_ENABLED) and the cron.
 */
function HostLifecyclePage() {
  const getOverview = useServerFn(getHostLifecycleOverview);
  const preview = useServerFn(previewHostLifecycleTemplate);
  const getJobHtml = useServerFn(getHostLifecycleJobHtml);
  const q = useQuery({ queryKey: ["host-lifecycle-overview"], queryFn: () => getOverview(), refetchInterval: 60_000 });
  const [template, setTemplate] = React.useState<string>(TEMPLATE_KEYS[0]);
  const [firstName, setFirstName] = React.useState("Sarah");
  const [listingTitle, setListingTitle] = React.useState("Backyard Saltwater Pool with Shade");
  const [rendered, setRendered] = React.useState<{ subject: string; html: string; ctaUrl: string; productionReady: boolean; placeholders: string[] } | null>(null);
  const [jobHtml, setJobHtml] = React.useState<{ subject: string; rendered_html: string } | null>(null);

  const d = q.data;
  return (
    <AdminLayout title="Host lifecycle">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Engine state</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-4">
            <div><div className="text-muted-foreground">Mode</div><div className="font-semibold">{d?.mode ?? "…"}</div></div>
            <div><div className="text-muted-foreground">Kill switch</div><div className="font-semibold">{d ? (d.enabled ? "ENABLED (emails may leave)" : "OFF — nothing can be sent") : "…"}</div></div>
            <div><div className="text-muted-foreground">Daily cap</div><div className="font-semibold">{d?.dailyCap ?? "…"}</div></div>
            <div><div className="text-muted-foreground">Derek support phone</div><div className="font-semibold">{d ? (d.supportPhoneConfigured ? "configured" : "NOT SET — placeholder in templates, production blocked") : "…"}</div></div>
            <div className="sm:col-span-4 text-muted-foreground">Last Sharetribe sync: {d?.lastSync ?? "never"} · hosts tracked: {d?.hosts ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hosts by lifecycle state (current, from Sharetribe)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-6">
              {d && Object.entries(d.byState).map(([s, n]) => (
                <div key={s} className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">{s}</div><div className="text-xl font-bold">{n}</div></div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Campaigns</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1">Campaign</th><th>Rule</th><th>queued</th><th>dry_run</th><th>sent</th><th>suppressed</th><th>cancelled</th><th>failed</th></tr></thead>
              <tbody>
                {d?.campaigns.map((c) => {
                  const s = d.summary[c.key] ?? {};
                  return (
                    <tr key={c.key} className="border-t border-border">
                      <td className="py-1 font-mono">{c.key}</td><td className="text-muted-foreground">{c.description}{c.after ? ` (≥ ${c.after.hours} h after ${c.after.campaign})` : ""}</td>
                      <td>{s.queued ?? 0}</td><td>{s.dry_run ?? 0}</td><td>{s.sent ?? 0}</td><td>{s.suppressed ?? 0}</td><td>{s.cancelled ?? 0}</td><td>{s.failed ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">Today (UTC): {d ? Object.entries(d.todayCounts).map(([k, v]) => `${k} ${v}`).join(" · ") : "…"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent jobs (masked recipients)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground"><th>when</th><th>campaign</th><th>state</th><th>recipient</th><th>status</th><th>reason / error</th><th>msg id</th><th></th></tr></thead>
              <tbody>
                {d?.jobs.map((j) => (
                  <tr key={j.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap py-1">{String(j.sent_at ?? j.updated_at).slice(0, 16).replace("T", " ")}</td>
                    <td className="font-mono">{j.campaign_key}</td><td>{j.lifecycle_state}</td><td>{j.recipient}</td>
                    <td className="font-semibold">{j.status}{j.mode ? ` (${j.mode})` : ""}</td>
                    <td className="max-w-[28rem] text-muted-foreground">{j.suppressed_reason ?? j.last_error ?? j.eligibility_reason ?? ""}</td>
                    <td className="font-mono">{j.provider_message_id ?? ""}</td>
                    <td>{(j.status === "dry_run" || j.status === "sent") && <button className="text-primary underline" onClick={async () => setJobHtml(await getJobHtml({ data: { id: j.id } }))}>view</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobHtml && (
              <div className="mt-4 rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">{jobHtml.subject}</span><Button variant="outline" size="sm" onClick={() => setJobHtml(null)}>Close</Button></div>
                <iframe title="job preview" sandbox="" srcDoc={jobHtml.rendered_html} className="h-[720px] w-full rounded border border-border bg-white" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent engine runs</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground"><th>started</th><th>phase</th><th>mode</th><th>enabled</th><th>stats</th><th>error</th></tr></thead>
              <tbody>
                {d?.runs.map((r, i) => (
                  <tr key={i} className="border-t border-border align-top">
                    <td className="whitespace-nowrap py-1">{String(r.started_at).slice(0, 19).replace("T", " ")}</td><td>{r.phase}</td><td>{r.mode}</td><td>{String(r.enabled)}</td>
                    <td className="font-mono text-[11px]">{JSON.stringify(r.stats).slice(0, 300)}</td><td className="text-red-600">{r.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Template preview (renders only; sends nothing)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">Template<br />
                <select className="rounded border border-border bg-background px-2 py-1" value={template} onChange={(e) => setTemplate(e.target.value)}>
                  {TEMPLATE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label className="text-sm">First name<br /><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-40" /></label>
              <label className="text-sm">Listing title<br /><Input value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} className="w-80" /></label>
              <Button onClick={async () => setRendered(await preview({ data: { template, first_name: firstName, listing_title: listingTitle } }))}>Render</Button>
            </div>
            {rendered && (
              <div>
                <p className="text-sm"><strong>Subject:</strong> {rendered.subject} · <strong>CTA:</strong> <a className="text-primary underline" href={rendered.ctaUrl} target="_blank" rel="noreferrer">{rendered.ctaUrl}</a> · {rendered.productionReady ? "production-ready" : `placeholders: ${rendered.placeholders.join(", ")}`}</p>
                <iframe title="template preview" sandbox="" srcDoc={rendered.html} className="mt-2 h-[760px] w-full rounded border border-border bg-white" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
