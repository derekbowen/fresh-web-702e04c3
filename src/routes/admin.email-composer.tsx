import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useState, useMemo, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  wrapInShell,
  renderForRecipient,
  composeFromPlainText,
  STARTER_TEMPLATES,
} from "@/lib/email-static/composer/_shell";

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
      .select("id, subject, audience, recipient_count, sent_count, failed_count, status, test_only, scheduled_at, created_at, ab_test_id, ab_variant, sequence_id, sequence_position, plain_body, preview_text")
      .order("created_at", { ascending: false })
      .limit(30);
    return data || [];
  });

const fetchAbTests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { listAbTests } = await import("@/server/email-composer-extras.server");
    return await listAbTests();
  });

const fetchSnippets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { listSnippets } = await import("@/server/email-composer-extras.server");
    return await listSnippets();
  });

const runSaveSnippet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; body: string; category?: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { saveSnippet } = await import("@/server/email-composer-extras.server");
    return await saveSnippet({ ...data, createdBy: userId });
  });

const runDeleteSnippet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { deleteSnippet } = await import("@/server/email-composer-extras.server");
    return await deleteSnippet(data.id);
  });

const runLookupRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { lookupRecipient } = await import("@/server/email-composer-extras.server");
    return await lookupRecipient(data.email);
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

const runGenerateSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { description: string; touches: number; tone?: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { generateSequenceWithAI } = await import("@/server/email-composer-extras.server");
    return await generateSequenceWithAI(data);
  });

const runScheduleSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    audience: "hosts" | "renters" | "waitlist" | "custom" | "single";
    customEmails?: string[];
    singleEmail?: string;
    drafts: Array<{ subject: string; bodyText: string; dayOffset: number }>;
    preview?: string;
    startAt?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { scheduleSequence } = await import("@/server/email-composer-extras.server");
    return await scheduleSequence({ ...data, createdBy: userId });
  });

const runSendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    audience: "hosts" | "renters" | "waitlist" | "custom" | "single";
    customEmails?: string[];
    singleEmail?: string;
    subject: string;
    bodyText: string;
    preview?: string;
    testOnly?: boolean;
    testRecipient?: string;
    delayMs?: number;
  }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { sendComposerEmail } = await import("@/server/email-composer.server");
    return await sendComposerEmail({ ...data, createdBy: userId });
  });

const runScheduleEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    audience: "hosts" | "renters" | "waitlist" | "custom" | "single";
    customEmails?: string[];
    singleEmail?: string;
    subject: string;
    bodyText: string;
    preview?: string;
    scheduledAt: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { scheduleComposerEmail } = await import("@/server/email-composer.server");
    return await scheduleComposerEmail({ ...data, createdBy: userId });
  });

const cancelScheduledCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { campaignId: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("composer_campaigns" as any)
      .update({ status: "cancelled" })
      .eq("id", data.campaignId)
      .eq("status", "scheduled");
    return { ok: true };
  });

const runStartAbTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    audience: "hosts" | "renters" | "waitlist" | "custom" | "single";
    customEmails?: string[];
    subjectA: string;
    subjectB: string;
    bodyText: string;
    preview?: string;
    samplePercent?: number;
    winnerAfterMinutes?: number;
  }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { startAbTest } = await import("@/server/email-composer-extras.server");
    return await startAbTest({ ...data, createdBy: userId });
  });

const runPickWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { abTestId: string; variant?: "a" | "b" }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { pickAbWinner } = await import("@/server/email-composer-extras.server");
    return await pickAbWinner({ ...data, pickedBy: "manual" });
  });

const runCancelAb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { abTestId: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { cancelAbTest } = await import("@/server/email-composer-extras.server");
    return await cancelAbTest(data.abTestId);
  });

export const Route = createFileRoute("/admin/email-composer")({
  component: Page,
});

// ---------- UI ----------

type Audience = "hosts" | "renters" | "waitlist" | "custom" | "single";
type Tab = "ai" | "templates" | "snippets" | "write";
type SendMode = "now" | "later" | "ab" | "sequence";

type SequenceDraft = { subject: string; bodyText: string; dayOffset: number; intent?: string };

function Page() {
  const getCounts = useServerFn(fetchAudienceCounts);
  const getRecent = useServerFn(fetchRecentCampaigns);
  const getAb = useServerFn(fetchAbTests);
  const getSnips = useServerFn(fetchSnippets);
  const saveSnip = useServerFn(runSaveSnippet);
  const delSnip = useServerFn(runDeleteSnippet);
  const lookup = useServerFn(runLookupRecipient);
  const genAI = useServerFn(runGenerateAI);
  const genSeq = useServerFn(runGenerateSequence);
  const schedSeq = useServerFn(runScheduleSequence);
  const send = useServerFn(runSendEmail);
  const schedule = useServerFn(runScheduleEmail);
  const cancel = useServerFn(cancelScheduledCampaign);
  const startAb = useServerFn(runStartAbTest);
  const pickWinner = useServerFn(runPickWinner);
  const cancelAb = useServerFn(runCancelAb);

  const counts = useQuery({ queryKey: ["composer-counts"], queryFn: () => getCounts() });
  const recent = useQuery({ queryKey: ["composer-recent"], queryFn: () => getRecent() });
  const ab = useQuery({ queryKey: ["composer-ab"], queryFn: () => getAb() });
  const snippets = useQuery({ queryKey: ["composer-snippets"], queryFn: () => getSnips() });

  const [audience, setAudience] = useState<Audience>("renters");
  const [customEmailsRaw, setCustomEmailsRaw] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectB, setSubjectB] = useState("");
  const [preview, setPreview] = useState("");
  const [bodyText, setBodyText] = useState(STARTER_TEMPLATES.announcement.text);
  const [tab, setTab] = useState<Tab>("write");
  const [aiDescription, setAiDescription] = useState("");
  const [aiTone, setAiTone] = useState("Friendly, founder-mentor");
  const [aiMode, setAiMode] = useState<"single" | "sequence">("single");
  const [touches, setTouches] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [sequenceDrafts, setSequenceDrafts] = useState<SequenceDraft[] | null>(null);
  const [sending, setSending] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [result, setResult] = useState<string>("");
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduledLocal, setScheduledLocal] = useState<string>(defaultScheduleValue());
  const [sequenceStartLocal, setSequenceStartLocal] = useState<string>(defaultScheduleValue());
  const [samplePercent, setSamplePercent] = useState(10);
  const [winnerHours, setWinnerHours] = useState(2);
  const [delayMs, setDelayMs] = useState(700);

  // Preview-as-recipient
  const [previewEmail, setPreviewEmail] = useState("");
  const [previewRecipient, setPreviewRecipient] = useState<{
    found: boolean; email: string; firstName: string; audience: string | null; unsubscribeUrl: string;
  } | null>(null);

  // Snippet form
  const [snipName, setSnipName] = useState("");
  const [snipCategory, setSnipCategory] = useState("intro");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

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

  // Render preview with active recipient merge fields (or fake Alex by default)
  const previewHtml = useMemo(() => {
    const { html } = composeFromPlainText(bodyText || "");
    const shell = wrapInShell({ subject: subject || "(no subject)", bodyHtml: html, preview });
    const firstName = previewRecipient?.firstName || "Alex";
    const unsubscribeUrl = previewRecipient?.unsubscribeUrl || "#preview-unsubscribe";
    return renderForRecipient(shell, { firstName, unsubscribeUrl });
  }, [subject, bodyText, preview, previewRecipient]);

  // A/B disabled for single recipient
  useEffect(() => {
    if (sendMode === "ab" && (audience === "single" || audienceCount < 20)) {
      // keep mode but warn at send
    }
  }, [sendMode, audience, audienceCount]);

  async function handlePreviewAs() {
    if (!previewEmail.trim()) { setPreviewRecipient(null); return; }
    try {
      const r: any = await lookup({ data: { email: previewEmail } });
      setPreviewRecipient(r);
    } catch (e: any) {
      alert(`Lookup failed: ${e?.message || e}`);
    }
  }

  async function handleGenerate() {
    if (!aiDescription.trim()) { alert("Describe the email first"); return; }
    setGenerating(true);
    try {
      if (aiMode === "single") {
        const r: any = await genAI({ data: { description: aiDescription, tone: aiTone } });
        if (r.subject) setSubject(r.subject);
        if (r.bodyText) setBodyText(r.bodyText);
        setTab("write");
      } else {
        const r: any = await genSeq({ data: { description: aiDescription, touches, tone: aiTone } });
        setSequenceDrafts(r.drafts);
        setSendMode("sequence");
      }
    } catch (e: any) {
      alert(`AI failed: ${e?.message || e}`);
    } finally {
      setGenerating(false);
    }
  }

  function insertSnippetIntoBody(body: string) {
    const ta = bodyRef.current;
    if (!ta) { setBodyText(bodyText + "\n\n" + body); return; }
    const start = ta.selectionStart, end = ta.selectionEnd;
    const next = bodyText.slice(0, start) + body + bodyText.slice(end);
    setBodyText(next);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + body.length;
    }, 0);
  }

  async function handleSaveSnippet() {
    if (!snipName.trim()) { alert("Snippet needs a name"); return; }
    if (!bodyText.trim()) { alert("Body is empty"); return; }
    try {
      await saveSnip({ data: { name: snipName, body: bodyText, category: snipCategory } });
      setSnipName("");
      snippets.refetch();
    } catch (e: any) {
      alert(`Save failed: ${e?.message || e}`);
    }
  }

  async function handleDeleteSnippet(id: string) {
    if (!confirm("Delete this snippet?")) return;
    await delSnip({ data: { id } });
    snippets.refetch();
  }

  async function handleTestSend() {
    if (!testRecipient.trim()) { alert("Enter your test email"); return; }
    if (!subject.trim() || !bodyText.trim()) { alert("Subject and body required"); return; }
    setSending(true);
    setResult("");
    try {
      const r: any = await send({
        data: {
          audience, subject, bodyText, preview,
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
    if (sendMode === "sequence") return handleScheduleSequence();
    if (sendMode === "ab") return handleStartAb();

    if (audienceCount === 0) { alert("No recipients"); return; }
    if (!subject.trim() || !bodyText.trim()) { alert("Subject and body required"); return; }
    const label = audience === "single" ? singleEmail : `${audienceCount} ${audience} recipients`;
    if (sendMode === "now") {
      if (!confirm(`Send "${subject}" to ${label} NOW? This cannot be undone.`)) return;
    } else {
      const when = new Date(scheduledLocal);
      if (isNaN(when.getTime()) || when.getTime() < Date.now()) {
        alert("Pick a future date/time");
        return;
      }
      if (!confirm(`Schedule "${subject}" to ${label} for ${when.toLocaleString()}?`)) return;
    }
    setSending(true);
    setResult("");
    try {
      const customEmails = audience === "custom"
        ? customEmailsRaw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)
        : undefined;
      if (sendMode === "now") {
        const r: any = await send({
          data: {
            audience, customEmails,
            singleEmail: audience === "single" ? singleEmail : undefined,
            subject, bodyText, preview,
            delayMs,
          },
        });
        setResult(`✅ Campaign ${r.campaignId.slice(0, 8)}… complete. Sent ${r.sent}/${r.total}, failed ${r.failed}.`);
      } else {
        const r: any = await schedule({
          data: {
            audience, customEmails,
            singleEmail: audience === "single" ? singleEmail : undefined,
            subject, bodyText, preview,
            scheduledAt: new Date(scheduledLocal).toISOString(),
          },
        });
        setResult(`🕒 Scheduled for ${new Date(r.scheduledAt).toLocaleString()} (campaign ${r.campaignId.slice(0, 8)}…)`);
      }
      recent.refetch();
    } catch (e: any) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }

  async function handleScheduleSequence() {
    if (!sequenceDrafts || sequenceDrafts.length === 0) { alert("Generate a sequence first"); return; }
    if (audienceCount === 0) { alert("No recipients"); return; }
    const start = new Date(sequenceStartLocal);
    if (isNaN(start.getTime())) { alert("Invalid start time"); return; }
    if (!confirm(`Schedule ${sequenceDrafts.length}-touch sequence to ${audienceCount} recipients starting ${start.toLocaleString()}?`)) return;
    setSending(true);
    setResult("");
    try {
      const customEmails = audience === "custom"
        ? customEmailsRaw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)
        : undefined;
      const r: any = await schedSeq({
        data: {
          audience, customEmails,
          singleEmail: audience === "single" ? singleEmail : undefined,
          drafts: sequenceDrafts,
          preview,
          startAt: start.toISOString(),
        },
      });
      setResult(`🗓 Sequence scheduled (${r.campaigns.length} touches). Sequence ID ${r.sequenceId.slice(0, 8)}…`);
      recent.refetch();
    } catch (e: any) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }

  async function handleStartAb() {
    if (!subject.trim() || !subjectB.trim()) { alert("Both subject lines required"); return; }
    if (!bodyText.trim()) { alert("Body required"); return; }
    if (audience === "single") { alert("A/B needs a multi-recipient audience"); return; }
    if (audienceCount < 20) { alert("A/B needs at least 20 recipients"); return; }
    if (!confirm(`Send each subject to ${samplePercent}% of ${audienceCount}, then auto-pick winner after ${winnerHours}h?`)) return;
    setSending(true);
    setResult("");
    try {
      const customEmails = audience === "custom"
        ? customEmailsRaw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)
        : undefined;
      const r: any = await startAb({
        data: {
          audience, customEmails,
          subjectA: subject, subjectB,
          bodyText, preview,
          samplePercent,
          winnerAfterMinutes: Math.round(winnerHours * 60),
        },
      });
      setResult(`🧪 A/B started. Sample A: ${r.sampleA}, B: ${r.sampleB}. Winner auto-picks at ${new Date(r.winnerAt).toLocaleString()}. You can also pick manually below.`);
      ab.refetch();
      recent.refetch();
    } catch (e: any) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }

  async function handlePickWinner(abTestId: string, variant: "a" | "b") {
    if (!confirm(`Send variant ${variant.toUpperCase()} to all remaining recipients now?`)) return;
    try {
      const r: any = await pickWinner({ data: { abTestId, variant } });
      alert(`Winner sent: ${r.sent}/${r.recipients} (${r.failed} failed)`);
      ab.refetch();
      recent.refetch();
    } catch (e: any) {
      alert(`Pick failed: ${e?.message || e}`);
    }
  }

  async function handleCancelAb(id: string) {
    if (!confirm("Cancel this A/B test? Samples already sent stay sent.")) return;
    await cancelAb({ data: { abTestId: id } });
    ab.refetch();
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled send?")) return;
    await cancel({ data: { campaignId: id } });
    recent.refetch();
  }

  function handleDuplicate(r: any) {
    setSubject(r.subject || "");
    setBodyText(r.plain_body || "");
    setPreview(r.preview_text || "");
    const aud = String(r.audience || "").split(":")[0];
    if (["hosts", "renters", "waitlist", "custom", "single"].includes(aud)) {
      setAudience(aud as Audience);
    }
    setSendMode("now");
    setTab("write");
    setResult(`📋 Duplicated "${r.subject}". Edit and send when ready.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              placeholder={sendMode === "ab" ? "Subject A" : "Your subject line"}
              className="w-full border rounded p-2"
            />
            {sendMode === "ab" && (
              <input
                type="text"
                value={subjectB}
                onChange={(e) => setSubjectB(e.target.value)}
                placeholder="Subject B (alternative)"
                className="w-full border rounded p-2 mt-2"
              />
            )}
            <input
              type="text"
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              placeholder="Preview text (optional — shown in inbox preview)"
              className="w-full border rounded p-2 mt-2 text-sm"
            />
          </section>

          {/* Body */}
          <section className="border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-3">3. Message</h2>
            <div className="flex gap-2 mb-3 border-b flex-wrap">
              <TabBtn active={tab === "write"} onClick={() => setTab("write")}>✏️ Write</TabBtn>
              <TabBtn active={tab === "ai"} onClick={() => setTab("ai")}>✨ AI Generate</TabBtn>
              <TabBtn active={tab === "templates"} onClick={() => setTab("templates")}>📝 Starters</TabBtn>
              <TabBtn active={tab === "snippets"} onClick={() => setTab("snippets")}>
                🧩 Snippets {snippets.data ? `(${snippets.data.length})` : ""}
              </TabBtn>
            </div>

            {tab === "write" && (
              <div className="space-y-2">
                <textarea
                  ref={bodyRef}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={16}
                  className="w-full border rounded p-3 text-sm leading-relaxed font-mono"
                  placeholder={"Just type your message.\n\n# Big news, {{first_name}}\n\nA paragraph here.\n\n[Button text](https://example.com)"}
                />
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer">Formatting cheatsheet</summary>
                  <div className="mt-2 space-y-1 pl-2">
                    <div><code># Heading</code> — big section title</div>
                    <div><code>## Subheading</code></div>
                    <div><code>- item</code> or <code>1. item</code> — lists</div>
                    <div><code>[Button text](https://url)</code> on its own line → branded button</div>
                    <div><code>**bold**</code>  <code>*italic*</code>  <code>[link](url)</code></div>
                    <div><code>{"{{first_name}}"}</code> — auto-replaced per recipient</div>
                  </div>
                </details>
              </div>
            )}

            {tab === "ai" && (
              <div className="space-y-2">
                <div className="flex gap-3 text-sm mb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={aiMode === "single"} onChange={() => setAiMode("single")} />
                    Single email
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={aiMode === "sequence"} onChange={() => setAiMode("sequence")} />
                    Multi-touch sequence
                  </label>
                  {aiMode === "sequence" && (
                    <label className="flex items-center gap-2 text-xs">
                      Touches:
                      <input type="number" min={2} max={7} value={touches}
                        onChange={(e) => setTouches(Math.max(2, Math.min(7, Number(e.target.value) || 3)))}
                        className="w-14 border rounded p-1" />
                    </label>
                  )}
                </div>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder={aiMode === "sequence"
                    ? "e.g. 'Write a 3-touch onboarding sequence about our $2M liability insurance for new hosts'"
                    : "Describe the email you want. e.g. 'Tell hosts about new insurance and ask them to refresh photos.'"}
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
                  {generating ? "Generating…" : (aiMode === "sequence" ? `Generate ${touches}-touch sequence` : "Generate single email")}
                </button>

                {aiMode === "sequence" && sequenceDrafts && (
                  <div className="mt-3 border rounded p-3 bg-slate-50">
                    <p className="text-sm font-semibold mb-2">Generated {sequenceDrafts.length}-touch sequence:</p>
                    <ol className="space-y-2 text-sm">
                      {sequenceDrafts.map((d, i) => (
                        <li key={i} className="border rounded bg-white p-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <div className="font-medium">Day {d.dayOffset}: {d.subject}</div>
                              {d.intent && <div className="text-xs text-slate-500 italic">{d.intent}</div>}
                            </div>
                            <button
                              onClick={() => { setSubject(d.subject); setBodyText(d.bodyText); setTab("write"); }}
                              className="text-xs underline shrink-0"
                            >Edit this touch</button>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="text-xs text-slate-600 mt-2">
                      Set Send mode to <strong>Schedule sequence</strong> below to ship all touches.
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === "templates" && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STARTER_TEMPLATES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { setBodyText(v.text); setTab("write"); }}
                    className="border rounded p-3 text-left hover:bg-slate-50"
                  >
                    <div className="font-medium text-sm">{v.label}</div>
                  </button>
                ))}
              </div>
            )}

            {tab === "snippets" && (
              <div className="space-y-3">
                <div className="border rounded p-2 bg-slate-50">
                  <p className="text-sm font-medium mb-2">Save current body as snippet</p>
                  <div className="flex gap-2">
                    <input
                      value={snipName}
                      onChange={(e) => setSnipName(e.target.value)}
                      placeholder="Snippet name (e.g. 'Insurance CTA')"
                      className="flex-1 border rounded p-2 text-sm"
                    />
                    <select
                      value={snipCategory}
                      onChange={(e) => setSnipCategory(e.target.value)}
                      className="border rounded p-2 text-sm"
                    >
                      <option value="intro">Intro</option>
                      <option value="cta">CTA</option>
                      <option value="signoff">Sign-off</option>
                      <option value="general">General</option>
                    </select>
                    <button
                      onClick={handleSaveSnippet}
                      className="px-3 py-2 rounded bg-sky-600 text-white text-sm"
                    >Save</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-72 overflow-auto">
                  {(snippets.data || []).length === 0 && (
                    <p className="text-sm text-slate-500 italic">No snippets yet. Write something useful, then save it above.</p>
                  )}
                  {(snippets.data || []).map((s: any) => (
                    <div key={s.id} className="border rounded p-2 bg-white">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{s.name} <span className="text-xs text-slate-500">({s.category})</span></div>
                          <div className="text-xs text-slate-500 truncate">{s.body.slice(0, 100)}</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => insertSnippetIntoBody(s.body)} className="text-xs px-2 py-1 border rounded hover:bg-slate-50">Insert</button>
                          <button onClick={() => { setBodyText(s.body); setTab("write"); }} className="text-xs px-2 py-1 border rounded hover:bg-slate-50">Replace</button>
                          <button onClick={() => handleDeleteSnippet(s.id)} className="text-xs px-2 py-1 text-red-600 hover:underline">Del</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

            <div className="flex gap-3 mb-3 text-sm flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={sendMode === "now"} onChange={() => setSendMode("now")} />
                Send now
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={sendMode === "later"} onChange={() => setSendMode("later")} />
                Send later
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={sendMode === "ab"} onChange={() => setSendMode("ab")} />
                🧪 A/B subject test
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={sendMode === "sequence"} onChange={() => setSendMode("sequence")} />
                🗓 Schedule sequence
              </label>
            </div>

            {sendMode === "later" && (
              <input
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                min={defaultScheduleValue()}
                className="w-full border rounded p-2 text-sm mb-3"
              />
            )}

            {sendMode === "ab" && (
              <div className="space-y-2 mb-3 text-sm border rounded p-2 bg-slate-50">
                <div className="flex gap-3 flex-wrap items-center">
                  <label className="flex items-center gap-1">
                    Sample %:
                    <input type="number" min={5} max={40} value={samplePercent}
                      onChange={(e) => setSamplePercent(Math.max(5, Math.min(40, Number(e.target.value) || 10)))}
                      className="w-16 border rounded p-1" />
                  </label>
                  <label className="flex items-center gap-1">
                    Pick winner after (hours):
                    <input type="number" min={0.25} max={72} step={0.25} value={winnerHours}
                      onChange={(e) => setWinnerHours(Math.max(0.25, Math.min(72, Number(e.target.value) || 2)))}
                      className="w-20 border rounded p-1" />
                  </label>
                </div>
                <p className="text-xs text-slate-600">
                  Sends {samplePercent}% to subject A and {samplePercent}% to subject B. After {winnerHours}h,
                  the winner (lower failure rate, or your manual pick) ships to the remaining {Math.max(0, 100 - samplePercent * 2)}%.
                </p>
              </div>
            )}

            {sendMode === "sequence" && (
              <div className="space-y-2 mb-3 text-sm border rounded p-2 bg-slate-50">
                <label className="block">
                  Start the sequence at:
                  <input
                    type="datetime-local"
                    value={sequenceStartLocal}
                    onChange={(e) => setSequenceStartLocal(e.target.value)}
                    min={defaultScheduleValue()}
                    className="w-full border rounded p-2 text-sm mt-1"
                  />
                </label>
                <p className="text-xs text-slate-600">
                  {sequenceDrafts
                    ? `Will schedule ${sequenceDrafts.length} touches starting from this time, spaced by each touch's day offset.`
                    : "Generate a sequence in the AI tab first."}
                </p>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || (sendMode !== "sequence" && audienceCount === 0)}
              className="w-full px-4 py-3 rounded bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              {sending
                ? "Working…"
                : sendMode === "now" ? `Send to ${audienceCount} recipient${audienceCount === 1 ? "" : "s"}`
                : sendMode === "later" ? `Schedule for ${audienceCount} recipient${audienceCount === 1 ? "" : "s"}`
                : sendMode === "ab" ? `Start A/B (${audienceCount} total)`
                : `Schedule ${sequenceDrafts?.length || 0}-touch sequence`}
            </button>
            {result && (
              <p className="mt-3 text-sm whitespace-pre-wrap">{result}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Paced under Emailit's 2/sec limit. One-click unsubscribe, postal address, and plain-text version are added to every send. Suppressed addresses are skipped.
            </p>
          </section>
        </div>

        {/* RIGHT: live preview */}
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-white sticky top-32">
            <div className="px-4 py-2 border-b bg-slate-50 flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Live preview</span>
              <div className="flex-1" />
              <input
                type="email"
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
                placeholder="preview as someone@example.com"
                className="border rounded p-1 text-xs w-56"
              />
              <button onClick={handlePreviewAs} className="text-xs px-2 py-1 border rounded hover:bg-slate-100">
                Preview as
              </button>
              {previewRecipient && (
                <button onClick={() => { setPreviewRecipient(null); setPreviewEmail(""); }} className="text-xs text-slate-500 hover:underline">
                  clear
                </button>
              )}
            </div>
            {previewRecipient && (
              <div className={`px-4 py-1 text-xs ${previewRecipient.found ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {previewRecipient.found
                  ? `✓ Rendering as ${previewRecipient.email} — first name "${previewRecipient.firstName || "(none on file)"}", audience: ${previewRecipient.audience}`
                  : `⚠ ${previewRecipient.email} not in any list. Using placeholder merge fields.`}
              </div>
            )}
            <iframe
              title="email-preview"
              srcDoc={previewHtml}
              className="w-full"
              style={{ height: "70vh", border: "0" }}
            />
          </div>
        </div>
      </div>

      {/* A/B tests in flight */}
      {ab.data && ab.data.length > 0 && (
        <section className="mt-8 border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">🧪 A/B subject tests</h2>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left border-b">
              <th className="p-2">Started</th><th>Subject A</th><th>Subject B</th><th>Samples</th><th>Winner picks at</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {ab.data.map((t: any) => (
                <tr key={t.id} className="border-b align-top">
                  <td className="p-2 whitespace-nowrap text-xs">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="max-w-[200px]">
                    <div className="truncate" title={t.subject_a}>{t.subject_a}</div>
                    {t.winner_variant === "a" && <span className="text-xs text-emerald-700">★ winner</span>}
                  </td>
                  <td className="max-w-[200px]">
                    <div className="truncate" title={t.subject_b}>{t.subject_b}</div>
                    {t.winner_variant === "b" && <span className="text-xs text-emerald-700">★ winner</span>}
                  </td>
                  <td className="text-xs">A:{t.sample_a_count} B:{t.sample_b_count}<br/>of {t.total_recipients}</td>
                  <td className="text-xs whitespace-nowrap">{new Date(t.scheduled_winner_at).toLocaleString()}</td>
                  <td className="text-xs">{t.status}</td>
                  <td className="space-x-1">
                    {t.status === "awaiting_winner" && (
                      <>
                        <button onClick={() => handlePickWinner(t.id, "a")} className="text-xs px-2 py-1 border rounded hover:bg-slate-50">Send A</button>
                        <button onClick={() => handlePickWinner(t.id, "b")} className="text-xs px-2 py-1 border rounded hover:bg-slate-50">Send B</button>
                        <button onClick={() => handleCancelAb(t.id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Recent campaigns */}
      <section className="mt-8 border rounded-lg p-4 bg-card">
        <h2 className="font-semibold mb-3">Recent & scheduled campaigns</h2>
        {recent.isLoading ? <p>Loading…</p> : (
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left border-b">
              <th className="p-2">When</th><th>Subject</th><th>Audience</th><th>Tag</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {(recent.data || []).map((r: any) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 whitespace-nowrap text-xs">
                    {r.scheduled_at && (r.status === "scheduled" || r.status === "ab_pending")
                      ? <span title="Scheduled for">🕒 {new Date(r.scheduled_at).toLocaleString()}</span>
                      : new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="truncate max-w-[220px]">{r.subject}</td>
                  <td className="text-xs">{r.audience}{r.test_only ? " (test)" : ""}</td>
                  <td className="text-xs">
                    {r.ab_variant ? <span className="px-1 bg-purple-100 text-purple-700 rounded">A/B {r.ab_variant}</span> : null}
                    {r.sequence_id ? <span className="px-1 bg-blue-100 text-blue-700 rounded ml-1">seq #{r.sequence_position}</span> : null}
                  </td>
                  <td>{r.recipient_count}</td>
                  <td>{r.sent_count}</td>
                  <td>{r.failed_count}</td>
                  <td className="text-xs">{r.status}</td>
                  <td>
                    {r.status === "scheduled" && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminLayout>
  );
}

function defaultScheduleValue(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
