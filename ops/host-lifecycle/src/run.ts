/**
 * Host lifecycle engine CLI (runs on EAST from the repo checkout):
 *   node ops/host-lifecycle/dist/run.mjs sync      pull Sharetribe → host_lifecycle_state
 *   node ops/host-lifecycle/dist/run.mjs evaluate  enqueue eligible campaigns
 *   node ops/host-lifecycle/dist/run.mjs send      lease + (record | send) due jobs
 *   node ops/host-lifecycle/dist/run.mjs tick      sync + evaluate + send
 *   node ops/host-lifecycle/dist/run.mjs report    counts by state / campaign / status (read-only)
 *   node ops/host-lifecycle/dist/run.mjs preview <template> [out.html]
 *   node ops/host-lifecycle/dist/run.mjs config    print the effective, redacted configuration
 *   node ops/host-lifecycle/dist/run.mjs test-send <template> <to>
 *                                                  one sample to an allowlisted reviewer (allowlist mode only)
 * Always run with `node --env-file=/home/ubuntu/fresh-web/.env`.
 */
import { writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { renderTemplate, sampleVars, TEMPLATE_KEYS } from "../../../src/lib/host-lifecycle/templates";
import type { TemplateKey } from "../../../src/lib/host-lifecycle/campaigns";
import { canTestSend, loadConfig } from "./config";
import { finishRun, makeDb, startRun, type Db } from "./db";
import { evaluateAndEnqueue } from "./queue";
import { EmailitClient, sendDue } from "./send";
import { oneClickUnsubscribeUrl } from "../../../src/lib/host-lifecycle/urls";
import { SharetribeReader } from "./sharetribe";
import { syncState } from "./sync";

const WORKER = `${hostname()}:${process.pid}`;

async function phaseSync(db: Db, cfg: ReturnType<typeof loadConfig>) {
  const runId = await startRun(db, "sync", cfg, WORKER);
  try {
    const st = new SharetribeReader(cfg);
    const [users, listings, bookings] = await Promise.all([st.users(), st.listings(), st.bookings()]);
    const stats = await syncState(db, { users, listings, bookings });
    await finishRun(db, runId, stats);
    return stats;
  } catch (e) { await finishRun(db, runId, {}, e); throw e; }
}

async function phaseEvaluate(db: Db, cfg: ReturnType<typeof loadConfig>) {
  const runId = await startRun(db, "evaluate", cfg, WORKER);
  try {
    const { explain, ...stats } = await evaluateAndEnqueue(db, cfg.campaigns);
    await finishRun(db, runId, stats);
    return { stats, explain };
  } catch (e) { await finishRun(db, runId, {}, e); throw e; }
}

async function phaseSend(db: Db, cfg: ReturnType<typeof loadConfig>) {
  const runId = await startRun(db, "send", cfg, WORKER);
  try {
    const emailit = cfg.emailitApiKey ? new EmailitClient(cfg.emailitApiKey) : null;
    const stats = await sendDue(db, cfg, emailit, WORKER);
    await finishRun(db, runId, stats);
    return stats;
  } catch (e) { await finishRun(db, runId, {}, e); throw e; }
}

async function report(db: Db) {
  const { data: states } = await db.from("host_lifecycle_state").select("lifecycle_state");
  const byState: Record<string, number> = {};
  for (const r of states ?? []) byState[r.lifecycle_state] = (byState[r.lifecycle_state] ?? 0) + 1;
  const { data: jobs } = await db.from("communication_jobs").select("campaign_key, status, suppressed_reason");
  const byCampaign: Record<string, Record<string, number>> = {};
  const suppressedReasons: Record<string, number> = {};
  for (const j of jobs ?? []) {
    byCampaign[j.campaign_key] ??= {}; byCampaign[j.campaign_key][j.status] = (byCampaign[j.campaign_key][j.status] ?? 0) + 1;
    if (j.status === "suppressed" || j.status === "cancelled") suppressedReasons[String(j.suppressed_reason).split(":")[0]] = (suppressedReasons[String(j.suppressed_reason).split(":")[0]] ?? 0) + 1;
  }
  const { data: runs } = await db.from("host_lifecycle_runs").select("phase, started_at, finished_at, mode, enabled, stats, error").order("started_at", { ascending: false }).limit(6);
  return { byState, byCampaign, suppressedReasons, recentRuns: runs };
}

function redacted(cfg: ReturnType<typeof loadConfig>) {
  return { enabled: cfg.enabled, mode: cfg.mode, allowlist: cfg.allowlist.length, dailyCap: cfg.dailyCap, userGapHours: cfg.userGapHours, supportPhone: cfg.supportPhone ? "set" : "MISSING (placeholder)", from: cfg.from, replyTo: cfg.replyTo, postalAddress: cfg.postalAddress ? "set" : "unset", origin: cfg.origin, campaigns: cfg.campaigns, emailit: !!cfg.emailitApiKey, supabase: !!cfg.supabaseUrl, sharetribe: !!cfg.sharetribeClientId };
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const cfg = loadConfig();
  if (cmd === "config") { console.log(JSON.stringify(redacted(cfg), null, 2)); return; }
  if (cmd === "preview") {
    const key = args[0] as TemplateKey;
    if (!TEMPLATE_KEYS.includes(key)) throw new Error(`unknown template; one of ${TEMPLATE_KEYS.join(", ")}`);
    const r = renderTemplate(key, sampleVars({ support_phone: cfg.supportPhone, postal_address: cfg.postalAddress }));
    if (args[1]) { writeFileSync(args[1], r.html); console.log(`${key}: ${r.subject} -> ${args[1]} (productionReady=${r.productionReady})`); }
    else console.log(r.html);
    return;
  }
  const db = makeDb(cfg);
  console.log(`[lifecycle] ${cmd} mode=${cfg.mode} enabled=${cfg.enabled} worker=${WORKER}`);
  if (cmd === "test-send") {
    // Hand-run sample of one template to an allowlisted reviewer, through the
    // real Emailit path. Every call is recorded in host_lifecycle_runs.
    const key = args[0] as TemplateKey; const to = (args[1] ?? "").trim();
    if (!TEMPLATE_KEYS.includes(key)) throw new Error(`unknown template; one of ${TEMPLATE_KEYS.join(", ")}`);
    const gate = canTestSend(cfg, to);
    if (!gate.ok) { console.log(`[lifecycle] test-send REFUSED: ${gate.reason}`); process.exit(3); }
    const r = renderTemplate(key, sampleVars({ support_phone: cfg.supportPhone, support_email: cfg.replyTo, postal_address: cfg.postalAddress }));
    if (!r.productionReady) throw new Error(`template not production-ready: ${r.placeholders.join(",")}`);
    if (!cfg.emailitApiKey) throw new Error("EMAILIT_API_KEY missing");
    const runId = await startRun(db, "test-send", cfg, WORKER);
    try {
      const res = await new EmailitClient(cfg.emailitApiKey).send({
        from: cfg.from, to, subject: `[TEST] ${r.subject}`, html: r.html, text: r.text, replyTo: cfg.replyTo,
        headers: { "List-Unsubscribe": `<${oneClickUnsubscribeUrl(cfg.origin, "sample")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click", "X-PRNM-Campaign": `test:${key}` },
      });
      await finishRun(db, runId, { template: key, to: to.replace(/^(..).*@/, "$1***@"), provider_message_id: res.id, subject: r.subject });
      console.log(JSON.stringify({ template: key, to, subject: r.subject, provider_message_id: res.id }));
    } catch (e) { await finishRun(db, runId, { template: key }, e); throw e; }
    return;
  }
  if (cmd === "sync") console.log(JSON.stringify(await phaseSync(db, cfg)));
  else if (cmd === "evaluate") { const r = await phaseEvaluate(db, cfg); console.log(JSON.stringify(r.stats)); }
  else if (cmd === "send") console.log(JSON.stringify(await phaseSend(db, cfg)));
  else if (cmd === "tick") {
    const s = await phaseSync(db, cfg); console.log("sync", JSON.stringify(s));
    const e = await phaseEvaluate(db, cfg); console.log("evaluate", JSON.stringify(e.stats));
    const d = await phaseSend(db, cfg); console.log("send", JSON.stringify(d));
  }
  else if (cmd === "report") console.log(JSON.stringify(await report(db), null, 2));
  else { console.error("usage: run.mjs sync|evaluate|send|tick|report|preview <template> [out]|config|test-send <template> <to>"); process.exit(2); }
}

main().catch((e) => { console.error("[lifecycle] FAILED", e); process.exit(1); });
