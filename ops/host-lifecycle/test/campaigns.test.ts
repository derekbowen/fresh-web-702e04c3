import { test } from "node:test";
import assert from "node:assert/strict";
import { eligibleCampaigns, evaluateCampaign, stillApplies, type EligibilityInput } from "../../../src/lib/host-lifecycle/campaigns";
import type { HostLifecycleRow } from "../../../src/lib/host-lifecycle/state";

const NOW = new Date("2026-09-20T12:00:00Z");
const row = (o: Partial<HostLifecycleRow> = {}): HostLifecycleRow => ({
  user_id: "u1", email: "a@example.com", first_name: "Sarah", user_type: "provider", st_created_at: "2026-09-10T00:00:00Z",
  email_verified: true, banned: false, deleted: false, stripe_connected: false, listing_id: null, listing_title: null, listing_state: null,
  listing_created_at: null, has_title: false, has_description: false, has_address: false, has_price: false, photo_count: 0,
  listing_ready: false, booking_count: 0, first_booking_at: null, last_booking_at: null, lifecycle_state: "SIGNED_UP", missing: [], ...o,
});
const input = (r: HostLifecycleRow, o: Partial<EligibilityInput> = {}): EligibilityInput => ({ row: r, stateEnteredAt: "2026-09-10T00:00:00Z", history: { sent: {}, lastEmailAt: null }, now: NOW, ...o });

test("provider/no listing qualifies for no_listing_1 after 24 h; a customer does not", () => {
  assert.equal(evaluateCampaign("no_listing_1", input(row())).eligible, true);
  assert.equal(evaluateCampaign("no_listing_1", input(row({ user_type: "customer" }))).eligible, false);
  assert.equal(evaluateCampaign("no_listing_1", input(row({ st_created_at: "2026-09-20T06:00:00Z" }))).eligible, false);
});
test("provider with a listing never gets the no-listing email", () => {
  const r = row({ listing_id: "l1", lifecycle_state: "LISTING_STARTED" });
  assert.equal(stillApplies("no_listing_1", r).ok, false);
  assert.equal(eligibleCampaigns(input(r)).some((e) => e.campaign.startsWith("no_listing")), false);
});
test("no_listing_2 waits 72 h after no_listing_1 and is capped at two", () => {
  const r = row();
  assert.match(evaluateCampaign("no_listing_2", input(r)).reason, /waiting for no_listing_1/);
  assert.equal(evaluateCampaign("no_listing_2", input(r, { history: { sent: { no_listing_1: "2026-09-19T00:00:00Z" }, lastEmailAt: null } })).eligible, false);
  assert.equal(evaluateCampaign("no_listing_2", input(r, { history: { sent: { no_listing_1: "2026-09-16T00:00:00Z" }, lastEmailAt: null } })).eligible, true);
  assert.equal(evaluateCampaign("no_listing_2", input(r, { history: { sent: { no_listing_1: "2026-09-16T00:00:00Z", no_listing_2: "2026-09-19T00:00:00Z" }, lastEmailAt: null } })).reason, "already sent");
});
test("old provider accounts are outside the onboarding window", () => {
  assert.match(evaluateCampaign("no_listing_1", input(row({ st_created_at: "2026-01-01T00:00:00Z" }))).reason, /onboarding window/);
});
test("incomplete listing: photos vs info are mutually exclusive and stop when complete", () => {
  const photos = row({ listing_id: "l1", lifecycle_state: "ADDRESS_ADDED", has_address: true, photo_count: 0, missing: ["photos"] });
  assert.equal(evaluateCampaign("incomplete_photos", input(photos)).eligible, true);
  assert.equal(stillApplies("incomplete_info", photos).ok, false);
  const info = row({ listing_id: "l1", lifecycle_state: "LISTING_STARTED", has_address: false, photo_count: 0, missing: ["address", "price"] });
  assert.equal(evaluateCampaign("incomplete_info", input(info)).eligible, true);
  const done = row({ listing_id: "l1", lifecycle_state: "LISTING_READY", listing_ready: true, has_address: true, photo_count: 3 });
  assert.equal(stillApplies("incomplete_photos", done).ok, false);
  assert.equal(stillApplies("incomplete_info", done).ok, false);
  assert.equal(evaluateCampaign("publish_1", input(done)).eligible, true);
});
test("publish stops once published; stripe stops once connected; no-booking stops on first booking", () => {
  const pub = row({ listing_id: "l1", listing_state: "published", lifecycle_state: "PUBLISHED", listing_ready: true, has_address: true, photo_count: 3 });
  assert.equal(stillApplies("publish_1", pub).ok, false);
  assert.equal(evaluateCampaign("stripe_1", input(pub)).eligible, true);
  const stripe = { ...pub, stripe_connected: true, lifecycle_state: "STRIPE_CONNECTED" as const };
  assert.equal(stillApplies("stripe_1", stripe).ok, false);
  assert.equal(stillApplies("stripe_2", stripe).ok, false);
  assert.equal(evaluateCampaign("no_booking_1", input(stripe, { stateEnteredAt: "2026-09-01T00:00:00Z" })).eligible, true);
  assert.equal(evaluateCampaign("no_booking_1", input(stripe, { stateEnteredAt: "2026-09-15T00:00:00Z" })).eligible, false);
  const booked = { ...stripe, booking_count: 1, lifecycle_state: "FIRST_BOOKING" as const };
  assert.equal(stillApplies("no_booking_1", booked).ok, false);
});
test("never more than one campaign per group per host, and unverified emails never qualify", () => {
  const pub = row({ listing_id: "l1", listing_state: "published", lifecycle_state: "PUBLISHED" });
  const all = eligibleCampaigns(input(pub, { history: { sent: { stripe_1: "2026-09-10T00:00:00Z" }, lastEmailAt: null } }));
  assert.deepEqual(all.map((e) => e.campaign), ["stripe_2"]);
  assert.equal(eligibleCampaigns(input(row({ email_verified: false }))).length, 0);
});
test("deleted or banned accounts are excluded everywhere", () => {
  assert.equal(stillApplies("no_listing_1", row({ deleted: true })).ok, false);
  assert.equal(stillApplies("stripe_1", row({ banned: true, lifecycle_state: "PUBLISHED", listing_state: "published" })).ok, false);
});
