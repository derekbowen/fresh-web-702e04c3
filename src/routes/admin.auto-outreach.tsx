import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getAutoOutreachState,
  updateAutoOutreachSettings,
  runAutoOutreachNow,
  cancelAutoOutreachMessage,
} from "@/lib/auto-outreach.functions";

export const Route = createFileRoute("/admin/auto-outreach")({
  component: AutoOutreachPage,
  head: () => ({ meta: [{ title: "Auto-outreach — Admin" }, { name: "robots", content: "noindex" }] }),
});

function AutoOutreachPage() {
  const qc = useQueryClient();
  const fetchState = useServerFn(getAutoOutreachState);
  const saveFn = useServerFn(updateAutoOutreachSettings);
  const runFn = useServerFn(runAutoOutreachNow);
  const cancelFn = useServerFn(cancelAutoOutreachMessage);

  const { data, isLoading } = useQuery({ queryKey: ["auto-outreach-state"], queryFn: () => fetchState({ data: {} } as any) });
  const settings = data?.settings;

  const [form, setForm] = useState({
    email_enabled: true,
    sms_enabled: true,
    dm_drafts_enabled: true,
    from_email: "hello@poolrentalnearme.com",
    from_name: "Pool Rental Near Me",
    reply_to: "",
    max_per_hour: 60,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        email_enabled: !!settings.email_enabled,
        sms_enabled: !!settings.sms_enabled,
        dm_drafts_enabled: !!settings.dm_drafts_enabled,
        from_email: settings.from_email ?? "",
        from_name: settings.from_name ?? "",
        reply_to: settings.reply_to ?? "",
        max_per_hour: settings.max_per_hour ?? 60,
      });
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { ...form, reply_to: form.reply_to || null } } as any),
    onSuccess: (r: any) => { r?.ok ? toast.success("Saved") : toast.error(r?.error || "Failed"); qc.invalidateQueries({ queryKey: ["auto-outreach-state"] }); },
  });

  const runNow = useMutation({
    mutationFn: () => runFn({ data: {} } as any),
    onSuccess: (r: any) => { toast.success(`Enqueued ${r?.enqueued ?? 0} • Sent ${r?.sent ?? 0} • Failed ${r?.failed ?? 0}`); qc.invalidateQueries({ queryKey: ["auto-outreach-state"] }); },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["auto-outreach-state"] }); },
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Auto-outreach 🤖</h1>
            <p className="text-muted-foreground">Every new lead is auto-contacted with an AI-personalized message — no human needed. Cadence: day 0, day 3, day 7.</p>
          </div>
          <Button onClick={() => runNow.mutate()} disabled={runNow.isPending}>{runNow.isPending ? "Running…" : "Run now"}</Button>
        </div>

        {data?.tally && (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(data.tally).map(([k, v]) => (
              <Badge key={k} variant="outline" className="capitalize">{k}: {v as number}</Badge>
            ))}
          </div>
        )}

        <Card className="p-5 space-y-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <Label>Email channel</Label>
              <Switch checked={form.email_enabled} onCheckedChange={(v) => setForm({ ...form, email_enabled: v })} />
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <Label>SMS channel</Label>
              <Switch checked={form.sms_enabled} onCheckedChange={(v) => setForm({ ...form, sms_enabled: v })} />
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <Label>DM drafts</Label>
              <Switch checked={form.dm_drafts_enabled} onCheckedChange={(v) => setForm({ ...form, dm_drafts_enabled: v })} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>From name</Label><Input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} /></div>
            <div><Label>From email</Label><Input value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} /></div>
            <div><Label>Reply-to (optional)</Label><Input value={form.reply_to} onChange={(e) => setForm({ ...form, reply_to: e.target.value })} /></div>
            <div><Label>Max sends / hour</Label><Input type="number" value={form.max_per_hour} onChange={(e) => setForm({ ...form, max_per_hour: Number(e.target.value) || 0 })} /></div>
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save settings"}</Button>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-3">Recent activity</h2>
          {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && (data?.messages?.length ?? 0) === 0 && <div className="text-sm text-muted-foreground">No messages yet. Run now to enqueue.</div>}
          <div className="divide-y">
            {(data?.messages ?? []).map((m: any) => (
              <div key={m.id} className="py-3 flex gap-3 items-start">
                <div className="flex flex-col gap-1 min-w-32">
                  <Badge variant="outline" className="w-fit capitalize">{m.channel} · step {m.step}</Badge>
                  <Badge variant={m.status === "sent" ? "default" : m.status === "failed" ? "destructive" : "secondary"} className="w-fit capitalize">{m.status}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(m.scheduled_at).toLocaleString()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground truncate">{m.source} → {m.to_address || "—"}</div>
                  {m.subject && <div className="text-sm font-medium">{m.subject}</div>}
                  <div className="text-sm whitespace-pre-wrap line-clamp-4">{m.body}</div>
                  {m.error && <div className="text-xs text-destructive mt-1">Error: {m.error}</div>}
                </div>
                {m.status === "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => cancel.mutate(m.id)}>Cancel</Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
