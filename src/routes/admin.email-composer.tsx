import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { wrapInShell, renderForRecipient, STARTER_TEMPLATES } from "@/lib/email-static/composer/_shell";

// ---------- Server functions ----------

async function requireAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Forbidden");
}

const fetchAudienceCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { getAudienceCount } = await import("@/server/email-composer.server");
    const [hosts, renters, waitlist] = await Promise.all([
      getAudienceCount("hosts"),
      getAudienceCount("renters"),
      getAudienceCount("waitlist"),
    ]);
    return { hosts, renters, waitlist };
  });

const fetchRecentCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("composer_campaigns" as any)
      .select("id, subject, audience, recipient_count, sent_count, failed_count, status, test_only, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    return data || [];
  });

const runGenerateAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { description: string; tone?: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { generateBodyWithAI } = await import("@/server/email-composer.server");
    return await generateBodyWithAI(data);
  });

const runSendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    audience: "hosts" | "renters" | "waitlist" | "custom" | "single";
    customEmails?: string[];
    singleEmail?: string;
    subject: string;
    bodyHtml: string;
    preview?: string;
    testOnly?: boolean;
    testRecipient?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { sendComposerEmail } = await import("@/server/email-composer.server");
    return await sendComposerEmail({ ...data, createdBy: userId });
  });

export const Route = createFileRoute("/admin/email-composer")({
  component: Page,
});

// ---------- UI ----------

type Audience = "hosts" | "renters" | "waitlist" | "custom" | "single";
type Tab = "ai" | "templates" | "custom";

function Page() {
  const getCounts = useServerFn(fetchAudienceCounts);
  const getRecent = useServerFn(fetchRecentCampaigns);
  const genAI = useServerFn(runGenerateAI);
  const send = useServerFn(runSendEmail);

  const counts = useQuery({ queryKey: ["composer-counts"], queryFn: () => getCounts() });
  const recent = useQuery({ queryKey: ["composer-recent"], queryFn: () => getRecent() });

  const [audience, setAudience] = useState<Audience>("renters");
  const [customEmailsRaw, setCustomEmailsRaw] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [bodyHtml, setBodyHtml] = useState(STARTER_TEMPLATES.announcement.body);
  const [tab, setTab] = useState<Tab>("ai");
  const [aiDescription, setAiDescription] = useState("");
  const [aiTone, setAiTone] = useState("Friendly, founder-mentor");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [result, setResult] = useState<string>("");

  const audienceCount = useMemo(() => {
    if (!counts.data) return 0;
    if (audience === "hosts") return counts.data.hosts;
    if (audience === "renters") return counts.data.renters;
    if (audience === "waitlist") return counts.data.waitlist;
    if (audience === "custom") {
      return customEmailsRaw.split(/[\s,;]+/).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())).length;
    }
    if (audience === "single") return singleEmail.trim() ? 1 : 0;
    return 0;
  }, [audience, counts.data, customEmailsRaw, singleEmail]);

  const previewHtml = useMemo(() => {
    const shell = wrapInShell({ subject: subject || "(no subject)", bodyHtml, preview });
    return renderForRecipient(shell, {
      firstName: "Alex",
      unsubscribeUrl: "#preview-unsubscribe",
    });
  }, [subject, bodyHtml, preview]);

  async function handleGenerate() {
    if (!aiDescription.trim()) { alert("Describe the email first"); return; }
    setGenerating(true);
    try {
      const r: any = await genAI({ data: { description: aiDescription, tone: aiTone } });
      if (r.subject) setSubject(r.subject);
      if (r.bodyHtml) setBodyHtml(r.bodyHtml);
      setTab("custom");
    } catch (e: any) {
      alert(`AI failed: ${e?.message || e}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleTestSend() {
    if (!testRecipient.trim()) { alert("Enter your test email"); return; }
    if (!subject.trim() || !bodyHtml.trim()) { alert("Subject and body required"); return; }
    setSending(true);
    setResult("");
    try {
      const r: any = await send({
        data: {
          audience, subject, bodyHtml, preview,
          testOnly: true,
          testRecipient,
        },
      });
      setResult(`✅ Test sent to ${testRecipient} (sent ${r.sent}, failed ${r.failed})`);
    } catch (e: any) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    if (audienceCount === 0) { alert("No recipients"); return; }
    if (!subject.trim() || !bodyHtml.trim()) { alert("Subject and body required"); return; }
    const label = audience === "single" ? singleEmail : `${audienceCount} ${audience} recipients`;
    if (!confirm(`Send "${subject}" to ${label}? This cannot be undone.`)) return;
    setSending(true);
    setResult("");
    try {
      const customEmails = audience === "custom"
        ? customEmailsRaw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)
        : undefined;
      const r: any = await send({
        data: {
          audience,
          customEmails,
          singleEmail: audience === "single" ? singleEmail : undefined,
          subject, bodyHtml, preview,
        },
      });
      setResult(`✅ Campaign ${r.campaignId.slice(0, 8)}… complete. Sent ${r.sent}/${r.total}, failed ${r.failed}.`);
      recent.refetch();
    } catch (e: any) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminLayout title="Email Composer">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: composer */}
        <div className="space-y-4">
          {/* Audience */}
          <section className="border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-3">1. Audience</h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <AudienceBtn label={`Hosts (${counts.data?.hosts ?? "…"})`} active={audience === "hosts"} onClick={() => setAudience("hosts")} />
              <AudienceBtn label={`Renters (${counts.data?.renters ?? "…"})`} active={audience === "renters"} onClick={() => setAudience("renters")} />
              <AudienceBtn label={`Waitlist (${counts.data?.waitlist ?? "…"})`} active={audience === "waitlist"} onClick={() => setAudience("waitlist")} />
              <AudienceBtn label="Custom list" active={audience === "custom"} onClick={() => setAudience("custom")} />
              <AudienceBtn label="Single recipient" active={audience === "single"} onClick={() => setAudience("single")} />
            </div>
            {audience === "custom" && (
              <textarea
                value={customEmailsRaw}
                onChange={(e) => setCustomEmailsRaw(e.target.value)}
                placeholder="paste emails separated by commas, spaces, or newlines"
                rows={4}
                className="w-full border rounded p-2 text-sm font-mono"
              />
            )}
            {audience === "single" && (
              <input
                type="email"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                placeholder="someone@example.com"
                className="w-full border rounded p-2 text-sm"
              />
            )}
            <p className="text-sm text-slate-600 mt-2">
              Will send to <strong>{audienceCount}</strong> recipient{audienceCount === 1 ? "" : "s"} (suppressed/unsubscribed are excluded).
            </p>
          </section>

          {/* Subject */}
          <section className="border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-3">2. Subject</h2>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your subject line"
              className="w-full border rounded p-2"
            />
            <input
              type="text"
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              placeholder="Preview text (optional, shown in inbox preview)"
              className="w-full border rounded p-2 mt-2 text-sm"
            />
          </section>

          {/* Body */}
          <section className="border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-3">3. Body</h2>
            <div className="flex gap-2 mb-3 border-b">
              <TabBtn active={tab === "ai"} onClick={() => setTab("ai")}>✨ AI Generate</TabBtn>
              <TabBtn active={tab === "templates"} onClick={() => setTab("templates")}>📝 Templates</TabBtn>
              <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>✏️ Edit HTML</TabBtn>
            </div>

            {tab === "ai" && (
              <div className="space-y-2">
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Describe the email you want. e.g. 'Tell hosts about the new $2M liability insurance and ask them to refresh their listing photos.'"
                  rows={5}
                  className="w-full border rounded p-2 text-sm"
                />
                <input
                  type="text"
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  placeholder="Tone (e.g. friendly founder-mentor, urgent, celebratory)"
                  className="w-full border rounded p-2 text-sm"
                />
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 rounded bg-sky-600 text-white disabled:opacity-50"
                >
                  {generating ? "Generating…" : "Generate with AI"}
                </button>
              </div>
            )}

            {tab === "templates" && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STARTER_TEMPLATES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { setBodyHtml(v.body); setTab("custom"); }}
                    className="border rounded p-3 text-left hover:bg-slate-50"
                  >
                    <div className="font-medium text-sm">{v.label}</div>
                  </button>
                ))}
              </div>
            )}

            {tab === "custom" && (
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={16}
                className="w-full border rounded p-2 text-xs font-mono"
                placeholder="Paste or write HTML body. Use {{first_name}} for the recipient's first name."
              />
            )}
          </section>

          {/* Send */}
          <section className="border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-3">4. Send</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="your-email@example.com"
                className="flex-1 border rounded p-2 text-sm"
              />
              <button
                onClick={handleTestSend}
                disabled={sending}
                className="px-3 py-2 rounded border text-sm disabled:opacity-50"
              >
                Send test
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || audienceCount === 0}
              className="w-full px-4 py-3 rounded bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              {sending ? "Sending…" : `Send to ${audienceCount} recipient${audienceCount === 1 ? "" : "s"}`}
            </button>
            {result && (
              <p className="mt-3 text-sm whitespace-pre-wrap">{result}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Paced at ~1.5/sec to stay under Emailit's 2/sec limit. Every email includes a one-click unsubscribe link and the company footer. Suppressed addresses are skipped automatically.
            </p>
          </section>
        </div>

        {/* RIGHT: live preview */}
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-white sticky top-32">
            <div className="px-4 py-2 border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Live preview
            </div>
            <iframe
              title="email-preview"
              srcDoc={previewHtml}
              className="w-full"
              style={{ height: "70vh", border: "0" }}
            />
          </div>
        </div>
      </div>

      {/* Recent campaigns */}
      <section className="mt-8 border rounded-lg p-4 bg-card">
        <h2 className="font-semibold mb-3">Recent campaigns</h2>
        {recent.isLoading ? <p>Loading…</p> : (
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left border-b">
              <th className="p-2">When</th><th>Subject</th><th>Audience</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Status</th>
            </tr></thead>
            <tbody>
              {(recent.data || []).map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="truncate max-w-[200px]">{r.subject}</td>
                  <td>{r.audience}{r.test_only ? " (test)" : ""}</td>
                  <td>{r.recipient_count}</td>
                  <td>{r.sent_count}</td>
                  <td>{r.failed_count}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminLayout>
  );
}

function AudienceBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-2 rounded border ${active ? "bg-sky-600 text-white border-sky-600" : "bg-white hover:bg-slate-50"}`}
    >
      {label}
    </button>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm -mb-px border-b-2 ${active ? "border-sky-600 text-sky-700 font-semibold" : "border-transparent text-slate-600"}`}
    >
      {children}
    </button>
  );
}
