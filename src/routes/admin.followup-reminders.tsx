import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Send, RefreshCw } from "lucide-react";
import {
  getMyReminderSettings,
  updateMyReminderSettings,
  getRecentReminderLog,
  getMyDueCount,
  runReminderWorkerNow,
} from "@/lib/followup-reminders.functions";

export const Route = createFileRoute("/admin/followup-reminders")({
  component: FollowupRemindersPage,
});

function FollowupRemindersPage() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getMyReminderSettings);
  const saveSettings = useServerFn(updateMyReminderSettings);
  const fetchLog = useServerFn(getRecentReminderLog);
  const fetchDue = useServerFn(getMyDueCount);
  const runNow = useServerFn(runReminderWorkerNow);

  const settingsQ = useQuery({ queryKey: ["fr-settings"], queryFn: () => fetchSettings({}) });
  const logQ = useQuery({ queryKey: ["fr-log"], queryFn: () => fetchLog({}) });
  const dueQ = useQuery({ queryKey: ["fr-due"], queryFn: () => fetchDue({}) });

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [interval, setInterval] = useState(60);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const s = settingsQ.data;
    if (s) {
      setEmail(s.email ?? "");
      setPhone(s.phone_e164 ?? "");
      setEmailEnabled(s.email_enabled);
      setSmsEnabled(s.sms_enabled);
      setInterval(s.min_interval_minutes);
      setPaused(s.paused);
    }
  }, [settingsQ.data]);

  const saveMut = useMutation({
    mutationFn: () =>
      saveSettings({
        data: {
          email: email || null,
          phone_e164: phone || null,
          email_enabled: emailEnabled,
          sms_enabled: smsEnabled,
          min_interval_minutes: interval,
          paused,
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["fr-settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const runMut = useMutation({
    mutationFn: () => runNow({}),
    onSuccess: (r: any) => {
      toast.success(`Owners: ${r.ownersChecked} · Emails: ${r.emailsSent} · SMS: ${r.smsSent}`);
      qc.invalidateQueries({ queryKey: ["fr-log"] });
      qc.invalidateQueries({ queryKey: ["fr-settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Run failed"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" /> Follow-up reminders
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Get email + SMS digests when your assigned follow-ups are past their next-action time.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{dueQ.data?.dueCount ?? "—"}</div>
            <div className="text-xs text-muted-foreground">overdue right now</div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your notification settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone (E.164)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15551234567" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">Email digest</div>
                <div className="text-sm text-muted-foreground">Send a summary of due follow-ups by email.</div>
              </div>
              <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">SMS reminders</div>
                <div className="text-sm text-muted-foreground">Short SMS with the count and a link.</div>
              </div>
              <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">Pause all reminders</div>
                <div className="text-sm text-muted-foreground">Temporarily stop without losing settings.</div>
              </div>
              <Switch checked={paused} onCheckedChange={setPaused} />
            </div>

            <div>
              <Label htmlFor="interval">Minimum minutes between digests</Label>
              <Input
                id="interval"
                type="number"
                min={15}
                max={1440}
                value={interval}
                onChange={(e) => setInterval(Math.max(15, Math.min(1440, Number(e.target.value) || 60)))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The cron runs every 15 minutes. We won&apos;t notify you more often than this interval.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                {saveMut.isPending ? "Saving…" : "Save settings"}
              </Button>
              <Button variant="outline" onClick={() => runMut.mutate()} disabled={runMut.isPending}>
                <Send className="h-4 w-4 mr-1" />
                {runMut.isPending ? "Running…" : "Run worker now"}
              </Button>
              {settingsQ.data?.last_notified_at && (
                <span className="text-xs text-muted-foreground">
                  Last sent: {new Date(settingsQ.data.last_notified_at).toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent reminder log</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => qc.invalidateQueries({ queryKey: ["fr-log"] })}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {logQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (logQ.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No reminders sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">When</th>
                      <th className="py-2 pr-3">Channel</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Due</th>
                      <th className="py-2 pr-3">Recipient</th>
                      <th className="py-2 pr-3">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logQ.data!.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-3">{r.channel}</td>
                        <td className="py-2 pr-3">
                          <Badge
                            variant={r.status === "sent" ? "default" : r.status === "failed" ? "destructive" : "secondary"}
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">{r.due_count}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{r.recipient ?? "—"}</td>
                        <td className="py-2 pr-3 text-muted-foreground truncate max-w-[280px]">{r.error ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
