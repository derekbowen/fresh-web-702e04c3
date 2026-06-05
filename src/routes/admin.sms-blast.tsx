import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminLayout } from "@/components/admin-layout";
import { buildMeta } from "@/lib/seo";
import { previewSmsBlast, sendSmsBlast } from "@/lib/sms-blast.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sms-blast")({
  head: () =>
    buildMeta({
      title: "SMS blast | Admin",
      description: "Send one-off SMS to host leads",
      path: "/admin/sms-blast",
      noindex: true,
    }),
  component: Page,
});

const SOURCES = ["all", "jobsxml", "googlejobs", "jooble", "indeed", "ziprecruiter"] as const;

function Page() {
  const preview = useServerFn(previewSmsBlast);
  const send = useServerFn(sendSmsBlast);

  const [source, setSource] = useState<(typeof SOURCES)[number]>("all");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [sinceDays, setSinceDays] = useState<number | "">(30);
  const [dedupeDays, setDedupeDays] = useState<number>(7);
  const [body, setBody] = useState(
    "Hey {first_name}, it's Pool Rental Near Me. Quick Q — still interested in renting out your pool in {city}? Reply YES and I'll send next steps. Reply STOP to opt out."
  );
  const [previewRes, setPreviewRes] = useState<any>(null);
  const [sendRes, setSendRes] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const filterPayload = () => ({
    source,
    city: city || null,
    region: region || null,
    sinceDays: sinceDays === "" ? null : Number(sinceDays),
  });

  async function onPreview() {
    setBusy(true);
    try {
      const r = await preview({ data: filterPayload() });
      setPreviewRes(r);
    } catch (e: any) {
      toast.error(e.message ?? "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSend(dryRun: boolean) {
    if (!dryRun && !confirm(`Send SMS to eligible leads now?`)) return;
    setBusy(true);
    setSendRes(null);
    try {
      const r = await send({ data: { ...filterPayload(), body, dryRun, dedupeDays } });
      setSendRes(r);
      if ((r as any).ok) toast.success(dryRun ? "Dry run complete" : `Scheduled ${(r as any).scheduled} messages`);
      else toast.error((r as any).error || "Send failed");
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    } finally {
      setBusy(false);
    }
  }

  const chars = body.length;
  const segments = Math.ceil(chars / 160) || 1;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <header>
          <h1 className="text-3xl font-bold">SMS blast</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One-off SMS to host_leads. Schedules via Twilio cron sender. Auto-skips opt-outs and recent recipients.
          </p>
        </header>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Filter recipients</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Source</Label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>City (optional)</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" />
            </div>
            <div>
              <Label>State (optional)</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="TX" />
            </div>
            <div>
              <Label>Since (days)</Label>
              <Input
                type="number"
                value={sinceDays}
                onChange={(e) => setSinceDays(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="30"
              />
            </div>
          </div>
          <Button onClick={onPreview} disabled={busy} variant="outline">Preview audience</Button>
          {previewRes?.ok && (
            <div className="text-sm space-y-1 rounded-md bg-muted p-3">
              <div><b>{previewRes.eligible}</b> eligible · {previewRes.optedOut} opted out · {previewRes.total} total match</div>
              {previewRes.sample?.length > 0 && (
                <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  {previewRes.sample.map((s: any) => (
                    <li key={s.id}>{s.name} · {s.phone} · {s.city ?? "—"}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Message</h2>
          <div>
            <Label>Body — use {"{first_name}"} and {"{city}"}. Must include "STOP".</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="mt-1 font-mono text-sm" />
            <div className="text-xs text-muted-foreground mt-1">
              {chars} chars · {segments} segment{segments > 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <Label>Dedupe window (days)</Label>
              <Input
                type="number"
                value={dedupeDays}
                onChange={(e) => setDedupeDays(Number(e.target.value))}
                className="w-32"
              />
              <div className="text-xs text-muted-foreground mt-1">Skip phones with any SMS in the last N days. 0 = none.</div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => onSend(true)} disabled={busy} variant="outline">Dry run</Button>
            <Button onClick={() => onSend(false)} disabled={busy}>Schedule & send</Button>
          </div>
          {sendRes && (
            <pre className="text-xs rounded-md bg-muted p-3 overflow-auto">{JSON.stringify(sendRes, null, 2)}</pre>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          Sender cron picks up pending rows every minute via <code>/api/public/hooks/sms-sender</code>.
        </p>
      </div>
    </AdminLayout>
  );
}
