/**
 * Queue concurrency against the real lease RPC. Opt-in: LIFECYCLE_TEST_DB=1
 * with SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Inserts one job for a fake
 * host under campaign "__test__", leases it from two concurrent workers,
 * asserts exactly one wins, then deletes the row. Never sends anything.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const enabled = process.env.LIFECYCLE_TEST_DB === "1" && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

test("two workers cannot lease the same job", { skip: !enabled }, async () => {
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const key = `__test__:${Date.now()}`;
  const { error } = await db.from("communication_jobs").insert({ user_id: "__test__", campaign_key: "__test__", template_key: "__test__", lifecycle_state: "SIGNED_UP", recipient: "nobody@example.invalid", scheduled_at: new Date(Date.now() - 1000).toISOString(), idempotency_key: key });
  assert.equal(error, null);
  try {
    const [a, b] = await Promise.all([db.rpc("lease_communication_jobs", { p_limit: 5, p_worker: "A" }), db.rpc("lease_communication_jobs", { p_limit: 5, p_worker: "B" })]);
    const mine = (r: any) => (r.data ?? []).filter((j: any) => j.idempotency_key === key);
    assert.equal(mine(a).length + mine(b).length, 1, "exactly one worker leased the test job");
    const { data: row } = await db.from("communication_jobs").select("status, leased_by, attempt_count").eq("idempotency_key", key).single();
    assert.equal(row!.status, "leased"); assert.equal(row!.attempt_count, 1);
    // A duplicate enqueue of the same idempotency key must be rejected.
    const dup = await db.from("communication_jobs").insert({ user_id: "__test__", campaign_key: "__test__", template_key: "__test__", lifecycle_state: "SIGNED_UP", recipient: "nobody@example.invalid", scheduled_at: new Date().toISOString(), idempotency_key: key });
    assert.ok(dup.error, "duplicate idempotency key rejected");
  } finally {
    await db.from("communication_jobs").delete().eq("idempotency_key", key);
  }
});
