import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { c as createServerFn } from "../server.js";
import { useQuery } from "@tanstack/react-query";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { useState, useRef, useMemo, useEffect } from "react";
import { A as AdminLayout } from "./admin-layout-B2eMXHXP.js";
import { S as STARTER_TEMPLATES, c as composeFromPlainText, w as wrapInShell, r as renderForRecipient } from "./_shell-Fd6w8MnJ.js";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "@tanstack/react-router";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "./createMiddleware-BvN2ghIY.js";
import "lucide-react";
import "./router-BEu57YoG.js";
import "./site-footer-defaults-C7gHxS5b.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "./emailit-DRsipvVx.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-DJqUcyMM.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BfIDzqiI.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const fetchAudienceCounts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("e028b1393a816be28be64b94c2d5933631462a52b897f4192fa14f666644c741"));
const fetchRecentCampaigns = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("2763f9edb025ee2b66f2f52462e132526956f0f2c0e28e32264e76fb66855d55"));
const fetchAbTests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("841744c410b9297ab5699138e9456fd9e5b5aa8533a3809393f15e6108e0f70d"));
const fetchSnippets = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("99a8e82493d70a0e7d40812e4f80ab150c3f894be8eafb4a257936a9aeab283b"));
const runSaveSnippet = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("c7bbc480c3bf13ed9ecee26ae3a1767e88b6bf195a4a372a5e4013d28c0be0b9"));
const runDeleteSnippet = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("129778482587e2b6ab1ffa854777b583c9491c0b44d92d2262a82d68d2885729"));
const runLookupRecipient = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("7a813682b2b8b0897f3de72bc1bf8ab0f57baa7b03f6a41531b43e940b9c0047"));
const runGenerateAI = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("b792d18ba013e13c93d779d80a5a9efba7e0669120762a75c0794f012e5369f7"));
const runGenerateSequence = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("59f43ca0ad560f4154b968c9829d9fc3b367f61762fe396d7f0b117257969af9"));
const runScheduleSequence = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("389dc7360df13ff0a3386662a570daf452582c923492ac2e27886e146448200b"));
const runSendEmail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("e596b113679319da4bbc1cfe0d014d07062197c47a75f1f6dbcbb56a58ba7c34"));
const runScheduleEmail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("427a57ee72019d351543c364c765132d84370e971e55bd2b682da2a4cb73846d"));
const cancelScheduledCampaign = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("aa848c22d4b0256b0e726b89345165648e7e032382de5554eb0cae7a52fa33fd"));
const runStartAbTest = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("0d06a9cef7c08c845cd1904749fc41478d272582d8485abaa2dff4c4c00c78be"));
const runPickWinner = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("04540870ccc7efaa1f88b7ab4f0ccad475189a4a88265c5fba8b74186d875512"));
const runCancelAb = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("ddeb190d8fa1890ee565d011fc81afeb75cca67b79bfcc2cb0a3cd759be6a251"));
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
  const counts = useQuery({
    queryKey: ["composer-counts"],
    queryFn: () => getCounts()
  });
  const recent = useQuery({
    queryKey: ["composer-recent"],
    queryFn: () => getRecent()
  });
  const ab = useQuery({
    queryKey: ["composer-ab"],
    queryFn: () => getAb()
  });
  const snippets = useQuery({
    queryKey: ["composer-snippets"],
    queryFn: () => getSnips()
  });
  const [audience, setAudience] = useState("renters");
  const [customEmailsRaw, setCustomEmailsRaw] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectB, setSubjectB] = useState("");
  const [preview, setPreview] = useState("");
  const [bodyText, setBodyText] = useState(STARTER_TEMPLATES.announcement.text);
  const [tab, setTab] = useState("write");
  const [aiDescription, setAiDescription] = useState("");
  const [aiTone, setAiTone] = useState("Friendly, founder-mentor");
  const [aiMode, setAiMode] = useState("single");
  const [touches, setTouches] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [sequenceDrafts, setSequenceDrafts] = useState(null);
  const [sending, setSending] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [result, setResult] = useState("");
  const [sendMode, setSendMode] = useState("now");
  const [scheduledLocal, setScheduledLocal] = useState(defaultScheduleValue());
  const [sequenceStartLocal, setSequenceStartLocal] = useState(defaultScheduleValue());
  const [samplePercent, setSamplePercent] = useState(10);
  const [winnerHours, setWinnerHours] = useState(2);
  const [delayMs, setDelayMs] = useState(700);
  const [previewEmail, setPreviewEmail] = useState("");
  const [previewRecipient, setPreviewRecipient] = useState(null);
  const [snipName, setSnipName] = useState("");
  const [snipCategory, setSnipCategory] = useState("intro");
  const bodyRef = useRef(null);
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
    const {
      html
    } = composeFromPlainText(bodyText || "");
    const shell = wrapInShell({
      subject: subject || "(no subject)",
      bodyHtml: html,
      preview
    });
    const firstName = previewRecipient?.firstName || "Alex";
    const unsubscribeUrl = previewRecipient?.unsubscribeUrl || "#preview-unsubscribe";
    return renderForRecipient(shell, {
      firstName,
      unsubscribeUrl
    });
  }, [subject, bodyText, preview, previewRecipient]);
  useEffect(() => {
  }, [sendMode, audience, audienceCount]);
  async function handlePreviewAs() {
    if (!previewEmail.trim()) {
      setPreviewRecipient(null);
      return;
    }
    try {
      const r = await lookup({
        data: {
          email: previewEmail
        }
      });
      setPreviewRecipient(r);
    } catch (e) {
      alert(`Lookup failed: ${e?.message || e}`);
    }
  }
  async function handleGenerate() {
    if (!aiDescription.trim()) {
      alert("Describe the email first");
      return;
    }
    setGenerating(true);
    try {
      if (aiMode === "single") {
        const r = await genAI({
          data: {
            description: aiDescription,
            tone: aiTone
          }
        });
        if (r.subject) setSubject(r.subject);
        if (r.bodyText) setBodyText(r.bodyText);
        setTab("write");
      } else {
        const r = await genSeq({
          data: {
            description: aiDescription,
            touches,
            tone: aiTone
          }
        });
        setSequenceDrafts(r.drafts);
        setSendMode("sequence");
      }
    } catch (e) {
      alert(`AI failed: ${e?.message || e}`);
    } finally {
      setGenerating(false);
    }
  }
  function insertSnippetIntoBody(body) {
    const ta = bodyRef.current;
    if (!ta) {
      setBodyText(bodyText + "\n\n" + body);
      return;
    }
    const start = ta.selectionStart, end = ta.selectionEnd;
    const next = bodyText.slice(0, start) + body + bodyText.slice(end);
    setBodyText(next);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + body.length;
    }, 0);
  }
  async function handleSaveSnippet() {
    if (!snipName.trim()) {
      alert("Snippet needs a name");
      return;
    }
    if (!bodyText.trim()) {
      alert("Body is empty");
      return;
    }
    try {
      await saveSnip({
        data: {
          name: snipName,
          body: bodyText,
          category: snipCategory
        }
      });
      setSnipName("");
      snippets.refetch();
    } catch (e) {
      alert(`Save failed: ${e?.message || e}`);
    }
  }
  async function handleDeleteSnippet(id) {
    if (!confirm("Delete this snippet?")) return;
    await delSnip({
      data: {
        id
      }
    });
    snippets.refetch();
  }
  async function handleTestSend() {
    if (!testRecipient.trim()) {
      alert("Enter your test email");
      return;
    }
    if (!subject.trim() || !bodyText.trim()) {
      alert("Subject and body required");
      return;
    }
    setSending(true);
    setResult("");
    try {
      const r = await send({
        data: {
          audience,
          subject,
          bodyText,
          preview,
          testOnly: true,
          testRecipient
        }
      });
      setResult(`✅ Test sent to ${testRecipient} (sent ${r.sent}, failed ${r.failed})`);
    } catch (e) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }
  async function handleSend() {
    if (sendMode === "sequence") return handleScheduleSequence();
    if (sendMode === "ab") return handleStartAb();
    if (audienceCount === 0) {
      alert("No recipients");
      return;
    }
    if (!subject.trim() || !bodyText.trim()) {
      alert("Subject and body required");
      return;
    }
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
      const customEmails = audience === "custom" ? customEmailsRaw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean) : void 0;
      if (sendMode === "now") {
        const r = await send({
          data: {
            audience,
            customEmails,
            singleEmail: audience === "single" ? singleEmail : void 0,
            subject,
            bodyText,
            preview,
            delayMs
          }
        });
        setResult(`✅ Campaign ${r.campaignId.slice(0, 8)}… complete. Sent ${r.sent}/${r.total}, failed ${r.failed}.`);
      } else {
        const r = await schedule({
          data: {
            audience,
            customEmails,
            singleEmail: audience === "single" ? singleEmail : void 0,
            subject,
            bodyText,
            preview,
            scheduledAt: new Date(scheduledLocal).toISOString()
          }
        });
        setResult(`🕒 Scheduled for ${new Date(r.scheduledAt).toLocaleString()} (campaign ${r.campaignId.slice(0, 8)}…)`);
      }
      recent.refetch();
    } catch (e) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }
  async function handleScheduleSequence() {
    if (!sequenceDrafts || sequenceDrafts.length === 0) {
      alert("Generate a sequence first");
      return;
    }
    if (audienceCount === 0) {
      alert("No recipients");
      return;
    }
    const start = new Date(sequenceStartLocal);
    if (isNaN(start.getTime())) {
      alert("Invalid start time");
      return;
    }
    if (!confirm(`Schedule ${sequenceDrafts.length}-touch sequence to ${audienceCount} recipients starting ${start.toLocaleString()}?`)) return;
    setSending(true);
    setResult("");
    try {
      const customEmails = audience === "custom" ? customEmailsRaw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean) : void 0;
      const r = await schedSeq({
        data: {
          audience,
          customEmails,
          singleEmail: audience === "single" ? singleEmail : void 0,
          drafts: sequenceDrafts,
          preview,
          startAt: start.toISOString()
        }
      });
      setResult(`🗓 Sequence scheduled (${r.campaigns.length} touches). Sequence ID ${r.sequenceId.slice(0, 8)}…`);
      recent.refetch();
    } catch (e) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }
  async function handleStartAb() {
    if (!subject.trim() || !subjectB.trim()) {
      alert("Both subject lines required");
      return;
    }
    if (!bodyText.trim()) {
      alert("Body required");
      return;
    }
    if (audience === "single") {
      alert("A/B needs a multi-recipient audience");
      return;
    }
    if (audienceCount < 20) {
      alert("A/B needs at least 20 recipients");
      return;
    }
    if (!confirm(`Send each subject to ${samplePercent}% of ${audienceCount}, then auto-pick winner after ${winnerHours}h?`)) return;
    setSending(true);
    setResult("");
    try {
      const customEmails = audience === "custom" ? customEmailsRaw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean) : void 0;
      const r = await startAb({
        data: {
          audience,
          customEmails,
          subjectA: subject,
          subjectB,
          bodyText,
          preview,
          samplePercent,
          winnerAfterMinutes: Math.round(winnerHours * 60)
        }
      });
      setResult(`🧪 A/B started. Sample A: ${r.sampleA}, B: ${r.sampleB}. Winner auto-picks at ${new Date(r.winnerAt).toLocaleString()}. You can also pick manually below.`);
      ab.refetch();
      recent.refetch();
    } catch (e) {
      setResult(`❌ ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  }
  async function handlePickWinner(abTestId, variant) {
    if (!confirm(`Send variant ${variant.toUpperCase()} to all remaining recipients now?`)) return;
    try {
      const r = await pickWinner({
        data: {
          abTestId,
          variant
        }
      });
      alert(`Winner sent: ${r.sent}/${r.recipients} (${r.failed} failed)`);
      ab.refetch();
      recent.refetch();
    } catch (e) {
      alert(`Pick failed: ${e?.message || e}`);
    }
  }
  async function handleCancelAb(id) {
    if (!confirm("Cancel this A/B test? Samples already sent stay sent.")) return;
    await cancelAb({
      data: {
        abTestId: id
      }
    });
    ab.refetch();
  }
  async function handleCancel(id) {
    if (!confirm("Cancel this scheduled send?")) return;
    await cancel({
      data: {
        campaignId: id
      }
    });
    recent.refetch();
  }
  function handleDuplicate(r) {
    setSubject(r.subject || "");
    setBodyText(r.plain_body || "");
    setPreview(r.preview_text || "");
    const aud = String(r.audience || "").split(":")[0];
    if (["hosts", "renters", "waitlist", "custom", "single"].includes(aud)) {
      setAudience(aud);
    }
    setSendMode("now");
    setTab("write");
    setResult(`📋 Duplicated "${r.subject}". Edit and send when ready.`);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Email Composer", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("section", { className: "border rounded-lg p-4 bg-card", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "1. Audience" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 mb-3", children: [
            /* @__PURE__ */ jsx(AudienceBtn, { label: `Hosts (${counts.data?.hosts ?? "…"})`, active: audience === "hosts", onClick: () => setAudience("hosts") }),
            /* @__PURE__ */ jsx(AudienceBtn, { label: `Renters (${counts.data?.renters ?? "…"})`, active: audience === "renters", onClick: () => setAudience("renters") }),
            /* @__PURE__ */ jsx(AudienceBtn, { label: `Waitlist (${counts.data?.waitlist ?? "…"})`, active: audience === "waitlist", onClick: () => setAudience("waitlist") }),
            /* @__PURE__ */ jsx(AudienceBtn, { label: "Custom list", active: audience === "custom", onClick: () => setAudience("custom") }),
            /* @__PURE__ */ jsx(AudienceBtn, { label: "Single recipient", active: audience === "single", onClick: () => setAudience("single") })
          ] }),
          audience === "custom" && /* @__PURE__ */ jsx("textarea", { value: customEmailsRaw, onChange: (e) => setCustomEmailsRaw(e.target.value), placeholder: "paste emails separated by commas, spaces, or newlines", rows: 4, className: "w-full border rounded p-2 text-sm font-mono" }),
          audience === "single" && /* @__PURE__ */ jsx("input", { type: "email", value: singleEmail, onChange: (e) => setSingleEmail(e.target.value), placeholder: "someone@example.com", className: "w-full border rounded p-2 text-sm" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 mt-2", children: [
            "Will send to ",
            /* @__PURE__ */ jsx("strong", { children: audienceCount }),
            " recipient",
            audienceCount === 1 ? "" : "s",
            " (suppressed/unsubscribed are excluded)."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "border rounded-lg p-4 bg-card", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "2. Subject" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: subject, onChange: (e) => setSubject(e.target.value), placeholder: sendMode === "ab" ? "Subject A" : "Your subject line", className: "w-full border rounded p-2" }),
          sendMode === "ab" && /* @__PURE__ */ jsx("input", { type: "text", value: subjectB, onChange: (e) => setSubjectB(e.target.value), placeholder: "Subject B (alternative)", className: "w-full border rounded p-2 mt-2" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: preview, onChange: (e) => setPreview(e.target.value), placeholder: "Preview text (optional — shown in inbox preview)", className: "w-full border rounded p-2 mt-2 text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "border rounded-lg p-4 bg-card", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "3. Message" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-3 border-b flex-wrap", children: [
            /* @__PURE__ */ jsx(TabBtn, { active: tab === "write", onClick: () => setTab("write"), children: "✏️ Write" }),
            /* @__PURE__ */ jsx(TabBtn, { active: tab === "ai", onClick: () => setTab("ai"), children: "✨ AI Generate" }),
            /* @__PURE__ */ jsx(TabBtn, { active: tab === "templates", onClick: () => setTab("templates"), children: "📝 Starters" }),
            /* @__PURE__ */ jsxs(TabBtn, { active: tab === "snippets", onClick: () => setTab("snippets"), children: [
              "🧩 Snippets ",
              snippets.data ? `(${snippets.data.length})` : ""
            ] })
          ] }),
          tab === "write" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("textarea", { ref: bodyRef, value: bodyText, onChange: (e) => setBodyText(e.target.value), rows: 16, className: "w-full border rounded p-3 text-sm leading-relaxed font-mono", placeholder: "Just type your message.\n\n# Big news, {{first_name}}\n\nA paragraph here.\n\n[Button text](https://example.com)" }),
            /* @__PURE__ */ jsxs("details", { className: "text-xs text-slate-500", children: [
              /* @__PURE__ */ jsx("summary", { className: "cursor-pointer", children: "Formatting cheatsheet" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-1 pl-2", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("code", { children: "# Heading" }),
                  " — big section title"
                ] }),
                /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("code", { children: "## Subheading" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("code", { children: "- item" }),
                  " or ",
                  /* @__PURE__ */ jsx("code", { children: "1. item" }),
                  " — lists"
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("code", { children: "[Button text](https://url)" }),
                  " on its own line → branded button"
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("code", { children: "**bold**" }),
                  "  ",
                  /* @__PURE__ */ jsx("code", { children: "*italic*" }),
                  "  ",
                  /* @__PURE__ */ jsx("code", { children: "[link](url)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("code", { children: "{{first_name}}" }),
                  " — auto-replaced per recipient"
                ] })
              ] })
            ] })
          ] }),
          tab === "ai" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 text-sm mb-1", children: [
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                /* @__PURE__ */ jsx("input", { type: "radio", checked: aiMode === "single", onChange: () => setAiMode("single") }),
                "Single email"
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                /* @__PURE__ */ jsx("input", { type: "radio", checked: aiMode === "sequence", onChange: () => setAiMode("sequence") }),
                "Multi-touch sequence"
              ] }),
              aiMode === "sequence" && /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
                "Touches:",
                /* @__PURE__ */ jsx("input", { type: "number", min: 2, max: 7, value: touches, onChange: (e) => setTouches(Math.max(2, Math.min(7, Number(e.target.value) || 3))), className: "w-14 border rounded p-1" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("textarea", { value: aiDescription, onChange: (e) => setAiDescription(e.target.value), placeholder: aiMode === "sequence" ? "e.g. 'Write a 3-touch onboarding sequence about our $2M liability insurance for new hosts'" : "Describe the email you want. e.g. 'Tell hosts about new insurance and ask them to refresh photos.'", rows: 5, className: "w-full border rounded p-2 text-sm" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: aiTone, onChange: (e) => setAiTone(e.target.value), placeholder: "Tone (e.g. friendly founder-mentor, urgent, celebratory)", className: "w-full border rounded p-2 text-sm" }),
            /* @__PURE__ */ jsx("button", { onClick: handleGenerate, disabled: generating, className: "px-4 py-2 rounded bg-sky-600 text-white disabled:opacity-50", children: generating ? "Generating…" : aiMode === "sequence" ? `Generate ${touches}-touch sequence` : "Generate single email" }),
            aiMode === "sequence" && sequenceDrafts && /* @__PURE__ */ jsxs("div", { className: "mt-3 border rounded p-3 bg-slate-50", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold mb-2", children: [
                "Generated ",
                sequenceDrafts.length,
                "-touch sequence:"
              ] }),
              /* @__PURE__ */ jsx("ol", { className: "space-y-2 text-sm", children: sequenceDrafts.map((d, i) => /* @__PURE__ */ jsx("li", { className: "border rounded bg-white p-2", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                    "Day ",
                    d.dayOffset,
                    ": ",
                    d.subject
                  ] }),
                  d.intent && /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 italic", children: d.intent })
                ] }),
                /* @__PURE__ */ jsx("button", { onClick: () => {
                  setSubject(d.subject);
                  setBodyText(d.bodyText);
                  setTab("write");
                }, className: "text-xs underline shrink-0", children: "Edit this touch" })
              ] }) }, i)) }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-600 mt-2", children: [
                "Set Send mode to ",
                /* @__PURE__ */ jsx("strong", { children: "Schedule sequence" }),
                " below to ship all touches."
              ] })
            ] })
          ] }),
          tab === "templates" && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: Object.entries(STARTER_TEMPLATES).map(([k, v]) => /* @__PURE__ */ jsx("button", { onClick: () => {
            setBodyText(v.text);
            setTab("write");
          }, className: "border rounded p-3 text-left hover:bg-slate-50", children: /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: v.label }) }, k)) }),
          tab === "snippets" && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "border rounded p-2 bg-slate-50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium mb-2", children: "Save current body as snippet" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx("input", { value: snipName, onChange: (e) => setSnipName(e.target.value), placeholder: "Snippet name (e.g. 'Insurance CTA')", className: "flex-1 border rounded p-2 text-sm" }),
                /* @__PURE__ */ jsxs("select", { value: snipCategory, onChange: (e) => setSnipCategory(e.target.value), className: "border rounded p-2 text-sm", children: [
                  /* @__PURE__ */ jsx("option", { value: "intro", children: "Intro" }),
                  /* @__PURE__ */ jsx("option", { value: "cta", children: "CTA" }),
                  /* @__PURE__ */ jsx("option", { value: "signoff", children: "Sign-off" }),
                  /* @__PURE__ */ jsx("option", { value: "general", children: "General" })
                ] }),
                /* @__PURE__ */ jsx("button", { onClick: handleSaveSnippet, className: "px-3 py-2 rounded bg-sky-600 text-white text-sm", children: "Save" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 max-h-72 overflow-auto", children: [
              (snippets.data || []).length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 italic", children: "No snippets yet. Write something useful, then save it above." }),
              (snippets.data || []).map((s) => /* @__PURE__ */ jsx("div", { className: "border rounded p-2 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "font-medium text-sm", children: [
                    s.name,
                    " ",
                    /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500", children: [
                      "(",
                      s.category,
                      ")"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 truncate", children: s.body.slice(0, 100) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-1 shrink-0", children: [
                  /* @__PURE__ */ jsx("button", { onClick: () => insertSnippetIntoBody(s.body), className: "text-xs px-2 py-1 border rounded hover:bg-slate-50", children: "Insert" }),
                  /* @__PURE__ */ jsx("button", { onClick: () => {
                    setBodyText(s.body);
                    setTab("write");
                  }, className: "text-xs px-2 py-1 border rounded hover:bg-slate-50", children: "Replace" }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteSnippet(s.id), className: "text-xs px-2 py-1 text-red-600 hover:underline", children: "Del" })
                ] })
              ] }) }, s.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "border rounded-lg p-4 bg-card", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "4. Send" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-3", children: [
            /* @__PURE__ */ jsx("input", { type: "email", value: testRecipient, onChange: (e) => setTestRecipient(e.target.value), placeholder: "your-email@example.com", className: "flex-1 border rounded p-2 text-sm" }),
            /* @__PURE__ */ jsx("button", { onClick: handleTestSend, disabled: sending, className: "px-3 py-2 rounded border text-sm disabled:opacity-50", children: "Send test" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mb-3 text-sm flex-wrap", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx("input", { type: "radio", checked: sendMode === "now", onChange: () => setSendMode("now") }),
              "Send now"
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx("input", { type: "radio", checked: sendMode === "later", onChange: () => setSendMode("later") }),
              "Send later"
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx("input", { type: "radio", checked: sendMode === "ab", onChange: () => setSendMode("ab") }),
              "🧪 A/B subject test"
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx("input", { type: "radio", checked: sendMode === "sequence", onChange: () => setSendMode("sequence") }),
              "🗓 Schedule sequence"
            ] })
          ] }),
          sendMode === "later" && /* @__PURE__ */ jsx("input", { type: "datetime-local", value: scheduledLocal, onChange: (e) => setScheduledLocal(e.target.value), min: defaultScheduleValue(), className: "w-full border rounded p-2 text-sm mb-3" }),
          sendMode === "ab" && /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-3 text-sm border rounded p-2 bg-slate-50", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 flex-wrap items-center", children: [
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1", children: [
                "Sample %:",
                /* @__PURE__ */ jsx("input", { type: "number", min: 5, max: 40, value: samplePercent, onChange: (e) => setSamplePercent(Math.max(5, Math.min(40, Number(e.target.value) || 10))), className: "w-16 border rounded p-1" })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1", children: [
                "Pick winner after (hours):",
                /* @__PURE__ */ jsx("input", { type: "number", min: 0.25, max: 72, step: 0.25, value: winnerHours, onChange: (e) => setWinnerHours(Math.max(0.25, Math.min(72, Number(e.target.value) || 2))), className: "w-20 border rounded p-1" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-600", children: [
              "Sends ",
              samplePercent,
              "% to subject A and ",
              samplePercent,
              "% to subject B. After ",
              winnerHours,
              "h, the winner (lower failure rate, or your manual pick) ships to the remaining ",
              Math.max(0, 100 - samplePercent * 2),
              "%."
            ] })
          ] }),
          sendMode === "sequence" && /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-3 text-sm border rounded p-2 bg-slate-50", children: [
            /* @__PURE__ */ jsxs("label", { className: "block", children: [
              "Start the sequence at:",
              /* @__PURE__ */ jsx("input", { type: "datetime-local", value: sequenceStartLocal, onChange: (e) => setSequenceStartLocal(e.target.value), min: defaultScheduleValue(), className: "w-full border rounded p-2 text-sm mt-1" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600", children: sequenceDrafts ? `Will schedule ${sequenceDrafts.length} touches starting from this time, spaced by each touch's day offset.` : "Generate a sequence in the AI tab first." })
          ] }),
          (sendMode === "now" || sendMode === "later") && /* @__PURE__ */ jsxs("div", { className: "mb-3 text-xs border rounded p-2 bg-slate-50", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "⏱ Throttle:" }),
              /* @__PURE__ */ jsx("input", { type: "range", min: 500, max: 3e3, step: 100, value: delayMs, onChange: (e) => setDelayMs(Number(e.target.value)), className: "flex-1 min-w-[120px]" }),
              /* @__PURE__ */ jsxs("span", { className: "font-mono w-16 text-right", children: [
                delayMs,
                "ms"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-slate-500", children: [
                "(~",
                Math.round(6e4 / delayMs),
                "/min)"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-1", children: "Lower = faster, but Emailit caps at 2/sec. 700ms is safe." })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: handleSend, disabled: sending || sendMode !== "sequence" && audienceCount === 0, className: "w-full px-4 py-3 rounded bg-blue-700 text-white font-semibold disabled:opacity-50", children: sending ? "Working…" : sendMode === "now" ? `Send to ${audienceCount} recipient${audienceCount === 1 ? "" : "s"}` : sendMode === "later" ? `Schedule for ${audienceCount} recipient${audienceCount === 1 ? "" : "s"}` : sendMode === "ab" ? `Start A/B (${audienceCount} total)` : `Schedule ${sequenceDrafts?.length || 0}-touch sequence` }),
          result && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm whitespace-pre-wrap", children: result }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-2", children: "Paced under Emailit's 2/sec limit. One-click unsubscribe, postal address, and plain-text version are added to every send. Suppressed addresses are skipped." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "border rounded-lg overflow-hidden bg-white sticky top-32", children: [
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 border-b bg-slate-50 flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-wide text-slate-500 font-semibold", children: "Live preview" }),
          /* @__PURE__ */ jsx("div", { className: "flex-1" }),
          /* @__PURE__ */ jsx("input", { type: "email", value: previewEmail, onChange: (e) => setPreviewEmail(e.target.value), placeholder: "preview as someone@example.com", className: "border rounded p-1 text-xs w-56" }),
          /* @__PURE__ */ jsx("button", { onClick: handlePreviewAs, className: "text-xs px-2 py-1 border rounded hover:bg-slate-100", children: "Preview as" }),
          previewRecipient && /* @__PURE__ */ jsx("button", { onClick: () => {
            setPreviewRecipient(null);
            setPreviewEmail("");
          }, className: "text-xs text-slate-500 hover:underline", children: "clear" })
        ] }),
        previewRecipient && /* @__PURE__ */ jsx("div", { className: `px-4 py-1 text-xs ${previewRecipient.found ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`, children: previewRecipient.found ? `✓ Rendering as ${previewRecipient.email} — first name "${previewRecipient.firstName || "(none on file)"}", audience: ${previewRecipient.audience}` : `⚠ ${previewRecipient.email} not in any list. Using placeholder merge fields.` }),
        /* @__PURE__ */ jsx("iframe", { title: "email-preview", srcDoc: previewHtml, className: "w-full", style: {
          height: "70vh",
          border: "0"
        } })
      ] }) })
    ] }),
    ab.data && ab.data.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-8 border rounded-lg p-4 bg-card", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "🧪 A/B subject tests" }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "Started" }),
          /* @__PURE__ */ jsx("th", { children: "Subject A" }),
          /* @__PURE__ */ jsx("th", { children: "Subject B" }),
          /* @__PURE__ */ jsx("th", { children: "Samples" }),
          /* @__PURE__ */ jsx("th", { children: "Winner picks at" }),
          /* @__PURE__ */ jsx("th", { children: "Status" }),
          /* @__PURE__ */ jsx("th", { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: ab.data.map((t) => /* @__PURE__ */ jsxs("tr", { className: "border-b align-top", children: [
          /* @__PURE__ */ jsx("td", { className: "p-2 whitespace-nowrap text-xs", children: new Date(t.created_at).toLocaleString() }),
          /* @__PURE__ */ jsxs("td", { className: "max-w-[200px]", children: [
            /* @__PURE__ */ jsx("div", { className: "truncate", title: t.subject_a, children: t.subject_a }),
            t.winner_variant === "a" && /* @__PURE__ */ jsx("span", { className: "text-xs text-emerald-700", children: "★ winner" })
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "max-w-[200px]", children: [
            /* @__PURE__ */ jsx("div", { className: "truncate", title: t.subject_b, children: t.subject_b }),
            t.winner_variant === "b" && /* @__PURE__ */ jsx("span", { className: "text-xs text-emerald-700", children: "★ winner" })
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "text-xs", children: [
            "A:",
            t.sample_a_count,
            " B:",
            t.sample_b_count,
            /* @__PURE__ */ jsx("br", {}),
            "of ",
            t.total_recipients
          ] }),
          /* @__PURE__ */ jsx("td", { className: "text-xs whitespace-nowrap", children: new Date(t.scheduled_winner_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "text-xs", children: t.status }),
          /* @__PURE__ */ jsx("td", { className: "space-x-1", children: t.status === "awaiting_winner" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", { onClick: () => handlePickWinner(t.id, "a"), className: "text-xs px-2 py-1 border rounded hover:bg-slate-50", children: "Send A" }),
            /* @__PURE__ */ jsx("button", { onClick: () => handlePickWinner(t.id, "b"), className: "text-xs px-2 py-1 border rounded hover:bg-slate-50", children: "Send B" }),
            /* @__PURE__ */ jsx("button", { onClick: () => handleCancelAb(t.id), className: "text-xs text-red-600 hover:underline", children: "Cancel" })
          ] }) })
        ] }, t.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-8 border rounded-lg p-4 bg-card", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "Recent & scheduled campaigns" }),
      recent.isLoading ? /* @__PURE__ */ jsx("p", { children: "Loading…" }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "When" }),
          /* @__PURE__ */ jsx("th", { children: "Subject" }),
          /* @__PURE__ */ jsx("th", { children: "Audience" }),
          /* @__PURE__ */ jsx("th", { children: "Tag" }),
          /* @__PURE__ */ jsx("th", { children: "Recipients" }),
          /* @__PURE__ */ jsx("th", { children: "Sent" }),
          /* @__PURE__ */ jsx("th", { children: "Failed" }),
          /* @__PURE__ */ jsx("th", { children: "Status" }),
          /* @__PURE__ */ jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: (recent.data || []).map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("td", { className: "p-2 whitespace-nowrap text-xs", children: r.scheduled_at && (r.status === "scheduled" || r.status === "ab_pending") ? /* @__PURE__ */ jsxs("span", { title: "Scheduled for", children: [
            "🕒 ",
            new Date(r.scheduled_at).toLocaleString()
          ] }) : new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "truncate max-w-[220px]", children: r.subject }),
          /* @__PURE__ */ jsxs("td", { className: "text-xs", children: [
            r.audience,
            r.test_only ? " (test)" : ""
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "text-xs", children: [
            r.ab_variant ? /* @__PURE__ */ jsxs("span", { className: "px-1 bg-purple-100 text-purple-700 rounded", children: [
              "A/B ",
              r.ab_variant
            ] }) : null,
            r.sequence_id ? /* @__PURE__ */ jsxs("span", { className: "px-1 bg-blue-100 text-blue-700 rounded ml-1", children: [
              "seq #",
              r.sequence_position
            ] }) : null
          ] }),
          /* @__PURE__ */ jsx("td", { children: r.recipient_count }),
          /* @__PURE__ */ jsx("td", { children: r.sent_count }),
          /* @__PURE__ */ jsx("td", { children: r.failed_count }),
          /* @__PURE__ */ jsx("td", { className: "text-xs", children: r.status }),
          /* @__PURE__ */ jsxs("td", { className: "space-x-2 whitespace-nowrap", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => handleDuplicate(r), className: "text-xs text-sky-700 hover:underline", title: "Load subject + body into composer to send again", children: "Duplicate" }),
            r.status === "scheduled" && /* @__PURE__ */ jsx("button", { onClick: () => handleCancel(r.id), className: "text-xs text-red-600 hover:underline", children: "Cancel" })
          ] })
        ] }, r.id)) })
      ] })
    ] })
  ] });
}
function defaultScheduleValue() {
  const d = new Date(Date.now() + 30 * 60 * 1e3);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function AudienceBtn({
  label,
  active,
  onClick
}) {
  return /* @__PURE__ */ jsx("button", { onClick, className: `text-sm px-3 py-2 rounded border ${active ? "bg-sky-600 text-white border-sky-600" : "bg-white hover:bg-slate-50"}`, children: label });
}
function TabBtn({
  active,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx("button", { onClick, className: `px-3 py-2 text-sm -mb-px border-b-2 ${active ? "border-sky-600 text-sky-700 font-semibold" : "border-transparent text-slate-600"}`, children });
}
export {
  Page as component
};
