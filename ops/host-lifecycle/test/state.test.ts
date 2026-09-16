import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveState, isHostAccount, pickPrimaryListing, safeFirstName, type StListing, type StUser } from "../../../src/lib/host-lifecycle/state";

const user = (o: Partial<StUser> = {}): StUser => ({ id: "u1", email: "a@example.com", firstName: "Sarah", createdAt: "2026-09-01T00:00:00Z", emailVerified: true, banned: false, deleted: false, stripeConnected: false, userType: "provider", ...o });
const listing = (o: Partial<StListing> = {}): StListing => ({ id: "l1", authorId: "u1", title: "Pool", description: "Nice", state: "draft", hasGeolocation: true, hasAddress: true, hasPrice: true, photoCount: 2, createdAt: "2026-09-02T00:00:00Z", ...o });

test("provider with no listing → SIGNED_UP", () => {
  assert.equal(deriveState(user(), [], []).lifecycle_state, "SIGNED_UP");
});
test("customer with no listing is not a host", () => {
  assert.equal(isHostAccount(user({ userType: "customer" }), []), false);
  assert.equal(isHostAccount(user({ userType: "customer" }), [listing()]), true);
});
test("draft without address → LISTING_STARTED; with address, no photos → ADDRESS_ADDED", () => {
  assert.equal(deriveState(user(), [listing({ hasGeolocation: false, hasAddress: false, photoCount: 0 })], []).lifecycle_state, "LISTING_STARTED");
  assert.equal(deriveState(user(), [listing({ photoCount: 0 })], []).lifecycle_state, "ADDRESS_ADDED");
});
test("photos but no price → PHOTOS_ADDED with missing=[price]; complete draft → LISTING_READY", () => {
  const r = deriveState(user(), [listing({ hasPrice: false })], []);
  assert.equal(r.lifecycle_state, "PHOTOS_ADDED"); assert.deepEqual(r.missing, ["price"]);
  assert.equal(deriveState(user(), [listing()], []).lifecycle_state, "LISTING_READY");
});
test("published: no Stripe → PUBLISHED; Stripe → STRIPE_CONNECTED; 1 booking → FIRST_BOOKING; 2 → ACTIVE_HOST", () => {
  const pub = listing({ state: "published" });
  assert.equal(deriveState(user(), [pub], []).lifecycle_state, "PUBLISHED");
  assert.equal(deriveState(user({ stripeConnected: true }), [pub], []).lifecycle_state, "STRIPE_CONNECTED");
  const b = (n: number) => Array.from({ length: n }, (_, i) => ({ providerId: "u1", transactionId: `t${i}`, bookedAt: `2026-09-0${i + 1}T00:00:00Z` }));
  assert.equal(deriveState(user({ stripeConnected: true }), [pub], b(1)).lifecycle_state, "FIRST_BOOKING");
  assert.equal(deriveState(user({ stripeConnected: true }), [pub], b(2)).lifecycle_state, "ACTIVE_HOST");
  assert.equal(deriveState(user(), [pub], [{ providerId: "someone-else", transactionId: "x", bookedAt: "2026-09-01T00:00:00Z" }]).booking_count, 0);
});
test("primary listing prefers published over draft, readiest draft otherwise", () => {
  const p = pickPrimaryListing([listing({ id: "d", state: "draft" }), listing({ id: "p", state: "published" })]);
  assert.equal(p?.id, "p");
  const q = pickPrimaryListing([listing({ id: "bad", photoCount: 0, hasPrice: false }), listing({ id: "good" })]);
  assert.equal(q?.id, "good");
});
test("pendingApproval → PENDING_APPROVAL (no nudge); only closed listings → CLOSED", () => {
  assert.equal(deriveState(user(), [listing({ state: "pendingApproval" })], []).lifecycle_state, "PENDING_APPROVAL");
  assert.equal(deriveState(user(), [listing({ state: "closed" })], []).lifecycle_state, "CLOSED");
});
test("safe first name", () => {
  assert.equal(safeFirstName("sarah jones"), "Sarah");
  assert.equal(safeFirstName("x"), null);
  assert.equal(safeFirstName("test"), null);
  assert.equal(safeFirstName("a@b.com"), null);
  assert.equal(safeFirstName(null), null);
});
