/**
 * Regression: a dry run must never consume production send state.
 * Drives the REAL evaluate + send code against an in-memory database.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, type EngineConfig } from "../src/config";
import { evaluateAndEnqueue, loadHistory } from "../src/queue";
import { sendDue, sendTestSample, type EmailitLike } from "../src/send";
import { MemDb, type Row } from "./memdb";

class FakeEmailit implements EmailitLike { sent: any[] = []; async send(i: any) { this.sent.push(i); return { id: `msg${this.sent.length}` }; } }
const okUrl = { checkUrl: async () => ({ ok: true, status: 200 }) };
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString();

function signedUpHost(o: Row = {}): Row {
  return { user_id: "u1", email: "host@example.com", first_name: "Sam", user_type: "provider", st_created_at: daysAgo(30), email_verified: true, banned: false, deleted: false,
    stripe_connected: false, listing_id: null, listing_title: null, listing_state: null, listing_created_at: null, has_title: false, has_description: false, has_address: false, has_price: false,
    photo_count: 0, listing_ready: false, booking_count: 0, first_booking_at: null, last_booking_at: null, lifecycle_state: "SIGNED_UP", missing: [], state_entered_at: daysAgo(30), published_at: null, last_synced_at: new Date().toISOString(), ...o };
}
function cfg(o: Partial<EngineConfig>): EngineConfig {
  return { ...loadConfig({} as NodeJS.ProcessEnv), supportPhone: "(555) 010-0000", origin: "https://example.test", ...o };
}
const dry = cfg({ enabled: false, mode: "dry_run" });
const prod = cfg({ enabled: true, mode: "production" });
const allow = cfg({ enabled: true, mode: "allowlist", allowlist: ["derek@example.com"] });
const opts = (c: EngineConfig) => ({ campaigns: c.campaigns, delivery: c });

test("dry_run → logs would_send, does NOT consume production idempotency, same host still gets the real email later", async () => {
  const db = new MemDb(); db.hosts.push(signedUpHost()); const em = new FakeEmailit();

  const e1 = await evaluateAndEnqueue(db, opts(dry));
  assert.equal(e1.enqueued, 1); assert.equal(e1.byCampaign.no_listing_1, 1);
  assert.match(db.jobs[0].idempotency_key, /^sim:u1:no_listing_1:\d{4}-\d{2}-\d{2}$/, "simulation uses its own key");

  const s1 = await sendDue(db, dry, em, "w", new Date(), 20, okUrl);
  assert.equal(em.sent.length, 0); assert.equal(s1.recorded, 1);
  const sim = db.jobs[0];
  assert.equal(sim.status, "would_send"); assert.equal(sim.sent_at ?? null, null); assert.ok(sim.rendered_html.includes("Need help"));
  assert.equal(db.jobs.some((j) => j.idempotency_key === "u1:no_listing_1"), false, "production key untouched");

  // Same day, same mode: the simulation is not repeated (audit stays bounded)…
  const e2 = await evaluateAndEnqueue(db, opts(dry));
  assert.equal(e2.enqueued, 0); assert.equal(e2.alreadyQueued, 1); assert.equal(e2.eligibleByCampaign.no_listing_1, 1, "still ELIGIBLE: the simulation did not mark it sent");
  // …and the evaluator's history sees no genuine send.
  const h = (await loadHistory(db)).get("u1")!;
  assert.deepEqual(h.sent, {}); assert.equal(h.lastEmailAt, null); assert.ok(h.simulatedOn.no_listing_1);

  // Flip to production: the same host is enqueued under the PRODUCTION key and really sent.
  const e3 = await evaluateAndEnqueue(db, opts(prod));
  assert.equal(e3.enqueued, 1);
  const real = db.jobs.find((j) => j.idempotency_key === "u1:no_listing_1")!;
  assert.ok(real, "production key now used"); assert.equal(real.status, "queued");
  const s3 = await sendDue(db, prod, em, "w", new Date(), 20, okUrl);
  assert.equal(s3.sent, 1); assert.equal(em.sent.length, 1); assert.equal(em.sent[0].to, "host@example.com"); assert.equal(em.sent[0].headers["X-PRNM-Campaign"], "no_listing_1");
  assert.equal(real.status, "sent"); assert.ok(real.sent_at); assert.equal(real.provider_message_id, "msg1");
  // The would_send audit row is still there, untouched.
  assert.equal(sim.status, "would_send"); assert.equal(db.jobs.length, 2);
});

test("real production send → records sent; a duplicate production send is blocked", async () => {
  const db = new MemDb(); db.hosts.push(signedUpHost()); const em = new FakeEmailit();
  await evaluateAndEnqueue(db, opts(prod));
  await sendDue(db, prod, em, "w", new Date(), 20, okUrl);
  assert.equal(em.sent.length, 1); assert.equal(db.jobs[0].status, "sent");
  // Re-evaluate: not eligible any more ("already sent"), nothing enqueued.
  const e = await evaluateAndEnqueue(db, opts(prod));
  assert.equal(e.enqueued, 0); assert.equal(e.eligible, 0); assert.ok(e.reasons["already sent"] >= 1);
  // A second insert under the same production key is rejected by the unique constraint.
  const dup = await db.from("communication_jobs").insert({ user_id: "u1", campaign_key: "no_listing_1", template_key: "no_listing_1", lifecycle_state: "SIGNED_UP", recipient: "host@example.com", scheduled_at: new Date().toISOString(), idempotency_key: "u1:no_listing_1" });
  assert.ok(dup.error);
  await sendDue(db, prod, em, "w", new Date(), 20, okUrl);
  assert.equal(em.sent.length, 1, "no second provider call");
  // A later dry run for this host does not resurrect the campaign either.
  const e2 = await evaluateAndEnqueue(db, opts(dry));
  assert.equal(e2.enqueued, 0);
});

test("allowlist test send to Derek → provider send occurs to Derek only; production host state is unchanged", async () => {
  const db = new MemDb(); db.hosts.push(signedUpHost()); const em = new FakeEmailit();
  const jobsBefore = db.snapshot("communication_jobs"); const hostsBefore = db.snapshot("host_lifecycle_state");
  const r = await sendTestSample(db, allow, em, "stripe_1", "derek@example.com", "w");
  assert.equal(em.sent.length, 1); assert.equal(em.sent[0].to, "derek@example.com"); assert.match(em.sent[0].subject, /^\[TEST\] /); assert.equal(em.sent[0].headers["X-PRNM-Campaign"], "test:stripe_1");
  assert.equal(r.provider_message_id, "msg1");
  assert.equal(db.snapshot("communication_jobs"), jobsBefore, "no job row created or changed");
  assert.equal(db.snapshot("host_lifecycle_state"), hostsBefore, "no host state changed");
  assert.equal(db.runs.length, 1); assert.equal(db.runs[0].phase, "test-send"); assert.equal(db.runs[0].stats.to, "de***@example.com");
  // The real host represented by the sample data is still eligible for a real send.
  const e = await evaluateAndEnqueue(db, opts(prod));
  assert.equal(e.eligible, 1);
  // Refusals: not allowlisted, wrong mode, switch off, phone unset — and nothing leaves.
  await assert.rejects(() => sendTestSample(db, allow, em, "stripe_1", "host@example.com", "w"), /not in HOST_EMAIL_ALLOWLIST/);
  await assert.rejects(() => sendTestSample(db, prod, em, "stripe_1", "derek@example.com", "w"), /allowlist mode/);
  await assert.rejects(() => sendTestSample(db, { ...allow, enabled: false }, em, "stripe_1", "derek@example.com", "w"), /kill switch/);
  await assert.rejects(() => sendTestSample(db, { ...allow, supportPhone: null }, em, "stripe_1", "derek@example.com", "w"), /SUPPORT_PHONE/);
  assert.equal(em.sent.length, 1);
});

test("allowlist mode: a real host who is not allowlisted is simulated, not sent, and stays eligible for production", async () => {
  const db = new MemDb(); db.hosts.push(signedUpHost()); const em = new FakeEmailit();
  await evaluateAndEnqueue(db, opts(allow));
  assert.match(db.jobs[0].idempotency_key, /^sim:/);
  await sendDue(db, allow, em, "w", new Date(), 20, okUrl);
  assert.equal(em.sent.length, 0); assert.equal(db.jobs[0].status, "would_send"); assert.match(db.jobs[0].suppressed_reason, /not allowlisted/);
  await evaluateAndEnqueue(db, opts(prod)); await sendDue(db, prod, em, "w", new Date(), 20, okUrl);
  assert.equal(em.sent.length, 1); assert.equal(db.jobs.filter((j) => j.status === "sent").length, 1);
});

test("switches flipped between evaluate and send: a production-keyed job that ends record-only releases its key", async () => {
  const db = new MemDb(); db.hosts.push(signedUpHost()); const em = new FakeEmailit();
  await evaluateAndEnqueue(db, opts(prod));
  assert.equal(db.jobs[0].idempotency_key, "u1:no_listing_1");
  await sendDue(db, dry, em, "w", new Date(), 20, okUrl); // operator turned the switch off before the send tick
  assert.equal(em.sent.length, 0); assert.equal(db.jobs[0].status, "would_send"); assert.match(db.jobs[0].idempotency_key, /^sim:u1:no_listing_1:/);
  const e = await evaluateAndEnqueue(db, opts(prod));
  assert.equal(e.enqueued, 1, "production key is free again");
  await sendDue(db, prod, em, "w", new Date(), 20, okUrl);
  assert.equal(em.sent.length, 1);
});

test("hand-run cohort: only listed users and campaigns are enqueued or sent; everyone else is untouched", async () => {
  const db = new MemDb(); db.hosts.push(signedUpHost({ user_id: "a", email: "a@example.com" }), signedUpHost({ user_id: "b", email: "b@example.com" }), signedUpHost({ user_id: "c", email: "c@example.com" }));
  const em = new FakeEmailit();
  const cohort = { ...prod, onlyUsers: ["a", "b"], onlyCampaigns: ["no_listing_1"] };
  const e = await evaluateAndEnqueue(db, { ...opts(cohort), onlyUsers: cohort.onlyUsers, onlyCampaigns: cohort.onlyCampaigns });
  assert.equal(e.eligible, 3); assert.equal(e.enqueued, 2); assert.equal(e.outsideCohort, 1);
  assert.deepEqual(db.jobs.map((j) => j.user_id).sort(), ["a", "b"]);
  // A stray queued job for a non-cohort host is left queued, not sent.
  db.jobs.push({ id: db.nextId(), user_id: "c", campaign_key: "no_listing_1", template_key: "no_listing_1", lifecycle_state: "SIGNED_UP", recipient: "c@example.com", status: "queued", idempotency_key: "c:no_listing_1", scheduled_at: daysAgo(0), created_at: daysAgo(0), updated_at: daysAgo(0) });
  const s = await sendDue(db, cohort, em, "w", new Date(), 20, okUrl);
  assert.equal(s.sent, 2); assert.deepEqual(em.sent.map((m) => m.to).sort(), ["a@example.com", "b@example.com"]);
  const stray = db.jobs.find((j) => j.user_id === "c")!; assert.equal(stray.status, "queued"); assert.match(stray.last_error, /outside hand-run cohort/);
});

test("a queued job for a host+campaign that was already genuinely sent is cancelled before the provider call", async () => {
  const db = new MemDb(); db.hosts.push(signedUpHost()); const em = new FakeEmailit();
  db.jobs.push({ id: db.nextId(), user_id: "u1", campaign_key: "no_listing_1", template_key: "no_listing_1", lifecycle_state: "SIGNED_UP", recipient: "host@example.com", status: "sent", sent_at: daysAgo(2), idempotency_key: "u1:no_listing_1", scheduled_at: daysAgo(2), created_at: daysAgo(2), updated_at: daysAgo(2) });
  db.jobs.push({ id: db.nextId(), user_id: "u1", campaign_key: "no_listing_1", template_key: "no_listing_1", lifecycle_state: "SIGNED_UP", recipient: "host@example.com", status: "queued", idempotency_key: "sim:u1:no_listing_1:stray", scheduled_at: daysAgo(0), created_at: daysAgo(0), updated_at: daysAgo(0) });
  const s = await sendDue(db, prod, em, "w", new Date(), 20, okUrl);
  assert.equal(em.sent.length, 0); assert.equal(s.cancelled, 1); assert.match(db.jobs[1].suppressed_reason, /already genuinely sent/);
});

test("provider 429 → one paced inline retry, job ends sent; consecutive sends are spaced", async () => {
  class Flaky implements EmailitLike { sent: any[] = []; calls = 0; async send(i: any) { this.calls++; if (this.calls === 1) throw new Error('Emailit 429: {"error":"Rate limit exceeded","retry_after":1}'); this.sent.push(i); return { id: `msg${this.sent.length}` }; } }
  const db = new MemDb(); db.hosts.push(signedUpHost({ user_id: "a", email: "a@example.com" }), signedUpHost({ user_id: "b", email: "b@example.com" }));
  const em = new Flaky(); const sleeps: number[] = [];
  await evaluateAndEnqueue(db, opts(prod));
  const s = await sendDue(db, prod, em, "w", new Date(), 20, { ...okUrl, sleep: async (ms) => { sleeps.push(ms); } });
  assert.equal(s.sent, 2); assert.equal(s.failed, 0); assert.equal(em.calls, 3);
  assert.equal(db.jobs.filter((j) => j.status === "sent" && j.provider_message_id).length, 2);
  assert.ok(sleeps.includes(1000), "waited retry_after before the 429 retry"); assert.ok(sleeps.includes(600), "spaced the second send");
  assert.ok(db.jobs.some((j) => j.last_error === "sent on retry after provider 429"));
});

test("simulations never count toward the per-user gap; real sends do", async () => {
  const db = new MemDb(); db.hosts.push(signedUpHost({ user_id: "u2", email: "two@example.com" })); const em = new FakeEmailit();
  db.jobs.push({ id: db.nextId(), user_id: "u2", campaign_key: "publish_1", template_key: "publish_1", lifecycle_state: "LISTING_READY", recipient: "two@example.com", status: "would_send", idempotency_key: "sim:u2:publish_1:x", scheduled_at: daysAgo(0), created_at: daysAgo(0), updated_at: new Date().toISOString(), sent_at: null });
  await evaluateAndEnqueue(db, opts(prod));
  await sendDue(db, prod, em, "w", new Date(), 20, okUrl);
  assert.equal(em.sent.length, 1, "a would_send an hour ago does not defer a real send");
});
