import { test } from "node:test";
import assert from "node:assert/strict";
import { canTestSend, decideDelivery, loadConfig } from "../src/config";
import { renderTemplate, sampleVars, TEMPLATE_KEYS } from "../../../src/lib/host-lifecycle/templates";
import { sendDue, type EmailitLike } from "../src/send";

test("kill switch off → record only, in every mode", () => {
  for (const mode of ["dry_run", "allowlist", "production"] as const) {
    assert.equal(decideDelivery({ enabled: false, mode, allowlist: ["derek@example.com"] }, "derek@example.com").kind, "record_only");
  }
});
test("dry_run never sends even when enabled", () => {
  assert.equal(decideDelivery({ enabled: true, mode: "dry_run", allowlist: [] }, "host@example.com").kind, "record_only");
});
test("allowlist sends only to allowlisted recipients", () => {
  const cfg = { enabled: true, mode: "allowlist" as const, allowlist: ["derek@example.com"] };
  assert.equal(decideDelivery(cfg, "Derek@Example.com").kind, "send");
  assert.equal(decideDelivery(cfg, "host@example.com").kind, "record_only");
});
test("production sends when enabled", () => {
  assert.equal(decideDelivery({ enabled: true, mode: "production", allowlist: [] }, "host@example.com").kind, "send");
});
test("test-send only in allowlist mode, to an allowlisted reviewer, with the switch on and the phone set", () => {
  const ok = { enabled: true, mode: "allowlist" as const, allowlist: ["derek@example.com"], supportPhone: "909-000-0000" };
  assert.equal(canTestSend(ok, "Derek@Example.com").ok, true);
  assert.equal(canTestSend({ ...ok, enabled: false }, "derek@example.com").ok, false);
  assert.equal(canTestSend({ ...ok, mode: "production" }, "derek@example.com").ok, false);
  assert.equal(canTestSend({ ...ok, mode: "dry_run" }, "derek@example.com").ok, false);
  assert.equal(canTestSend(ok, "host@example.com").ok, false);
  assert.equal(canTestSend({ ...ok, supportPhone: null }, "derek@example.com").ok, false);
});
test("config defaults are the safe ones", () => {
  const cfg = loadConfig({} as NodeJS.ProcessEnv);
  assert.equal(cfg.enabled, false); assert.equal(cfg.mode, "dry_run"); assert.equal(cfg.dailyCap, 25); assert.equal(cfg.userGapHours, 24);
  assert.equal(loadConfig({ HOST_EMAIL_MODE: "PRODUCTION", HOST_LIFECYCLE_EMAILS_ENABLED: "true" } as NodeJS.ProcessEnv).mode, "production");
  assert.equal(loadConfig({ HOST_EMAIL_MODE: "nonsense" } as NodeJS.ProcessEnv).mode, "dry_run");
});
test("every template renders, carries the Derek support block, unsubscribe link, CTA, and no forbidden language", () => {
  for (const key of TEMPLATE_KEYS) {
    const r = renderTemplate(key, sampleVars());
    assert.ok(r.subject.length > 5 && r.subject.length < 80, key);
    assert.match(r.html, /I'm Derek with Pool Rental Near Me/);
    assert.match(r.html, /Unsubscribe from host reminders/);
    assert.match(r.html, new RegExp(r.ctaUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(r.html, /prnm-logo-240\.png/);
    for (const bad of [/90%/, /10% (flat )?host fee/i, /insur/i, /Hartford/i, /Stephen/i, /guarantee/i, /\$2M/]) assert.doesNotMatch(r.html + r.text, bad, `${key} contains forbidden language ${bad}`);
    assert.equal(r.productionReady, false); assert.deepEqual(r.placeholders, ["support_phone"]);
    assert.match(r.html, /\{\{DEREK_SUPPORT_PHONE\}\}/);
  }
  const ready = renderTemplate("stripe_1", sampleVars({ support_phone: "(555) 010-0000" }));
  assert.equal(ready.productionReady, true); assert.match(ready.html, /tel:5550100000/);
  const noName = renderTemplate("no_listing_1", sampleVars({ first_name: null }));
  assert.match(noName.html, /Hi there,/);
});

// ---- send-phase gates against a fake database ---------------------------------
type Row = Record<string, any>;
function fakeDb(opts: { jobs: Row[]; hosts: Row[]; suppressed?: string[]; tokensUsed?: string[]; sentToday?: number; lastEmail?: Record<string, string> }) {
  const updates: Row[] = [];
  const table = (name: string) => {
    const q: any = { _f: [] as Array<[string, any]>, _name: name };
    const chain = () => q;
    q.select = chain; q.eq = (k: string, v: any) => { q._f.push([k, v]); return q; }; q.in = chain; q.or = chain; q.ilike = (k: string, v: any) => { q._f.push([k, v]); return q; }; q.not = chain; q.gte = chain; q.order = chain; q.limit = chain; q.upsert = chain;
    q.maybeSingle = async () => {
      if (name === "host_lifecycle_state") return { data: opts.hosts.find((h) => h.user_id === q._f[0][1]) ?? null };
      if (name === "email_unsubscribe_tokens") return { data: { token: "tok", used_at: null } };
      return { data: null };
    };
    q.update = (patch: Row) => ({ eq: async (_k: string, id: string) => { updates.push({ id, ...patch }); return {}; } });
    q.then = (res: any) => res(q._result());
    q._result = () => {
      if (name === "suppressed_emails") return { data: (opts.suppressed ?? []).includes(q._f[0]?.[1]) ? [{ reason: "bounce" }] : [] };
      if (name === "email_unsubscribe_tokens") return { data: (opts.tokensUsed ?? []).includes(q._f[0]?.[1]) ? [{ used_at: "x" }] : [] };
      if (name === "host_subscribers" || name === "composer_unsubscribes") return { data: [] };
      if (name === "communication_jobs") {
        if (q._selectCount) return { count: opts.sentToday ?? 0 };
        const uid = q._f.find((f: any) => f[0] === "user_id")?.[1];
        const last = uid && opts.lastEmail?.[uid];
        return { data: last ? [{ sent_at: last, updated_at: last, status: "sent" }] : [] };
      }
      return { data: [] };
    };
    const origSelect = q.select; q.select = (_c?: string, o?: any) => { if (o?.count) q._selectCount = true; return origSelect(); };
    return q;
  };
  return {
    updates,
    from: (name: string) => table(name),
    rpc: async () => ({ data: opts.jobs.map((j) => ({ attempt_count: 1, ...j })) }),
  } as any;
}
const host = (o: Row = {}): Row => ({ user_id: "u1", email: "host@example.com", first_name: "Sarah", user_type: "provider", st_created_at: "2026-09-01T00:00:00Z", email_verified: true, banned: false, deleted: false, stripe_connected: false, listing_id: "l1", listing_title: "Pool", listing_state: "published", listing_created_at: "2026-09-02T00:00:00Z", has_title: true, has_description: true, has_address: true, has_price: true, photo_count: 3, listing_ready: true, booking_count: 0, first_booking_at: null, last_booking_at: null, lifecycle_state: "PUBLISHED", missing: [], state_entered_at: "2026-09-02T00:00:00Z", published_at: "2026-09-02T00:00:00Z", last_synced_at: new Date().toISOString(), ...o });
const job = (o: Row = {}): Row => ({ id: "j1", user_id: "u1", campaign_key: "stripe_1", template_key: "stripe_1", recipient: "host@example.com", ...o });
const baseCfg = () => ({ ...loadConfig({} as NodeJS.ProcessEnv), supportPhone: "(555) 010-0000", origin: "https://example.test" });
class FakeEmailit implements EmailitLike { sent: any[] = []; async send(i: any) { this.sent.push(i); return { id: "msg1" }; } }

test("dry-run records the exact email and sends nothing", async () => {
  const db = fakeDb({ jobs: [job()], hosts: [host()] }); const em = new FakeEmailit();
  const s = await sendDue(db, baseCfg(), em, "test");
  assert.equal(em.sent.length, 0); assert.equal(s.recorded, 1);
  const u = db.updates.find((x: Row) => x.id === "j1"); assert.equal(u.status, "would_send"); assert.equal(u.sent_at, null); assert.match(u.subject, /One last step/); assert.ok(u.rendered_html.includes("Set up payouts"));
});
test("stale state immediately before send → cancelled, nothing sent", async () => {
  const db = fakeDb({ jobs: [job()], hosts: [host({ stripe_connected: true, lifecycle_state: "STRIPE_CONNECTED" })] }); const em = new FakeEmailit();
  const cfg = { ...baseCfg(), enabled: true, mode: "production" as const };
  await sendDue(db, cfg, em, "test");
  assert.equal(em.sent.length, 0); assert.equal(db.updates[0].status, "cancelled"); assert.match(db.updates[0].suppressed_reason, /state changed/);
});
test("bounced / unsubscribed → suppressed, nothing sent", async () => {
  for (const o of [{ suppressed: ["host@example.com"] }, { tokensUsed: ["host@example.com"] }]) {
    const db = fakeDb({ jobs: [job()], hosts: [host()], ...o }); const em = new FakeEmailit();
    await sendDue(db, { ...baseCfg(), enabled: true, mode: "production" }, em, "test");
    assert.equal(em.sent.length, 0); assert.equal(db.updates[0].status, "suppressed");
  }
});
test("per-user 24 h gap defers; daily cap defers; allowlist blocks non-allowlisted", async () => {
  const recent = new Date(Date.now() - 3600_000).toISOString();
  let db = fakeDb({ jobs: [job()], hosts: [host()], lastEmail: { u1: recent } }); let em = new FakeEmailit();
  await sendDue(db, { ...baseCfg(), enabled: true, mode: "production" }, em, "test");
  assert.equal(em.sent.length, 0); assert.equal(db.updates[0].status, "queued"); assert.match(db.updates[0].last_error, /per-user gap/);
  db = fakeDb({ jobs: [job()], hosts: [host()], sentToday: 25 }); em = new FakeEmailit();
  await sendDue(db, { ...baseCfg(), enabled: true, mode: "production" }, em, "test");
  assert.equal(em.sent.length, 0); assert.match(db.updates[0].last_error, /daily cap/);
  db = fakeDb({ jobs: [job()], hosts: [host()] }); em = new FakeEmailit();
  await sendDue(db, { ...baseCfg(), enabled: true, mode: "allowlist", allowlist: ["derek@example.com"] }, em, "test");
  assert.equal(em.sent.length, 0); assert.equal(db.updates[0].status, "would_send"); assert.match(db.updates[0].suppressed_reason, /not allowlisted/);
});
test("placeholder support phone blocks a real send; kill switch blocks at the last moment", async () => {
  let db = fakeDb({ jobs: [job()], hosts: [host()] }); let em = new FakeEmailit();
  await sendDue(db, { ...baseCfg(), supportPhone: null, enabled: true, mode: "production" }, em, "test");
  assert.equal(em.sent.length, 0); assert.match(db.updates[0].last_error, /not production-ready/);
  db = fakeDb({ jobs: [job()], hosts: [host()] }); em = new FakeEmailit();
  await sendDue(db, { ...baseCfg(), enabled: false, mode: "production" }, em, "test");
  assert.equal(em.sent.length, 0); assert.equal(db.updates[0].status, "would_send");
});
