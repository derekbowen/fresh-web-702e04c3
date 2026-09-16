/**
 * Host lifecycle state — derived from real marketplace data, never from elapsed
 * time. Pure functions: no I/O, fully unit-tested.
 *
 *   SIGNED_UP → LISTING_STARTED → ADDRESS_ADDED → PHOTOS_ADDED → LISTING_READY
 *   → PUBLISHED → STRIPE_CONNECTED → FIRST_BOOKING → ACTIVE_HOST
 *
 * Inputs are the minimal shapes read from the Sharetribe Integration API
 * (users/query, listings/query with include=images, transactions/query).
 */

export type LifecycleState =
  | "SIGNED_UP"
  | "LISTING_STARTED"
  | "ADDRESS_ADDED"
  | "PHOTOS_ADDED"
  | "LISTING_READY"
  | "PENDING_APPROVAL"
  | "PUBLISHED"
  | "STRIPE_CONNECTED"
  | "FIRST_BOOKING"
  | "ACTIVE_HOST"
  | "CLOSED";

export const LIFECYCLE_STATES: LifecycleState[] = [
  "SIGNED_UP",
  "LISTING_STARTED",
  "ADDRESS_ADDED",
  "PHOTOS_ADDED",
  "LISTING_READY",
  "PENDING_APPROVAL",
  "PUBLISHED",
  "STRIPE_CONNECTED",
  "FIRST_BOOKING",
  "ACTIVE_HOST",
  "CLOSED",
];

export interface StUser {
  id: string;
  email: string;
  firstName: string | null;
  createdAt: string; // ISO
  emailVerified: boolean;
  banned: boolean;
  deleted: boolean;
  stripeConnected: boolean;
  userType: string | null; // profile.publicData.userType
}

export interface StListing {
  id: string;
  authorId: string;
  title: string | null;
  description: string | null;
  state: "draft" | "pendingApproval" | "published" | "closed";
  hasGeolocation: boolean;
  hasAddress: boolean; // publicData.location.address
  hasPrice: boolean;
  photoCount: number;
  createdAt: string; // ISO
}

/** A transaction that reached a real booking (accepted or beyond). */
export interface StBooking {
  providerId: string;
  transactionId: string;
  bookedAt: string; // ISO of the accept/confirm transition
}

export type MissingPiece = "address" | "photos" | "price" | "description" | "title";

export interface HostLifecycleRow {
  user_id: string;
  email: string;
  first_name: string | null;
  user_type: string | null;
  st_created_at: string;
  email_verified: boolean;
  banned: boolean;
  deleted: boolean;
  stripe_connected: boolean;
  listing_id: string | null;
  listing_title: string | null;
  listing_state: string | null;
  listing_created_at: string | null;
  has_title: boolean;
  has_description: boolean;
  has_address: boolean;
  has_price: boolean;
  photo_count: number;
  listing_ready: boolean;
  booking_count: number;
  first_booking_at: string | null;
  last_booking_at: string | null;
  lifecycle_state: LifecycleState;
  missing: MissingPiece[];
}

/** Which transitions mean "a booking actually happened" for the provider. */
export const BOOKING_TRANSITIONS = new Set([
  "transition/accept",
  "transition/operator-accept",
  "transition/confirm-payment",
  "transition/complete",
]);

const STATE_RANK: Record<string, number> = { published: 4, pendingApproval: 3, draft: 2, closed: 1 };

/** The listing that best represents where the host is: published > pendingApproval > readiest draft > closed. */
export function pickPrimaryListing(listings: StListing[]): StListing | null {
  if (listings.length === 0) return null;
  return [...listings].sort((a, b) => {
    const r = (STATE_RANK[b.state] ?? 0) - (STATE_RANK[a.state] ?? 0);
    if (r !== 0) return r;
    const c = completenessScore(b) - completenessScore(a);
    if (c !== 0) return c;
    return b.createdAt.localeCompare(a.createdAt);
  })[0];
}

export function missingPieces(l: StListing): MissingPiece[] {
  const m: MissingPiece[] = [];
  if (!l.title) m.push("title");
  if (!l.description) m.push("description");
  if (!(l.hasGeolocation && l.hasAddress)) m.push("address");
  if (!l.hasPrice) m.push("price");
  if (l.photoCount < 1) m.push("photos");
  return m;
}

export function isListingReady(l: StListing): boolean {
  return missingPieces(l).length === 0;
}

function completenessScore(l: StListing): number {
  return 5 - missingPieces(l).length;
}

/** True when the account should be treated as a host (provider) for lifecycle purposes. */
export function isHostAccount(user: StUser, listings: StListing[]): boolean {
  if (user.deleted || user.banned) return false;
  return user.userType === "provider" || listings.length > 0;
}

export function deriveState(
  user: StUser,
  listings: StListing[],
  bookings: StBooking[],
): HostLifecycleRow {
  const primary = pickPrimaryListing(listings);
  const mine = bookings.filter((b) => b.providerId === user.id);
  const bookedAts = mine.map((b) => b.bookedAt).sort();
  const bookingCount = mine.length;
  const missing = primary ? missingPieces(primary) : [];
  const ready = primary ? missing.length === 0 : false;

  let state: LifecycleState;
  if (!primary) {
    state = "SIGNED_UP";
  } else if (primary.state === "closed") {
    state = bookingCount > 0 ? "ACTIVE_HOST" : "CLOSED";
  } else if (primary.state === "published") {
    if (bookingCount >= 2) state = "ACTIVE_HOST";
    else if (bookingCount === 1) state = "FIRST_BOOKING";
    else if (user.stripeConnected) state = "STRIPE_CONNECTED";
    else state = "PUBLISHED";
  } else if (primary.state === "pendingApproval") {
    state = "PENDING_APPROVAL";
  } else {
    // draft
    if (ready) state = "LISTING_READY";
    else if (primary.photoCount >= 1) state = "PHOTOS_ADDED";
    else if (primary.hasGeolocation && primary.hasAddress) state = "ADDRESS_ADDED";
    else state = "LISTING_STARTED";
  }

  return {
    user_id: user.id,
    email: user.email,
    first_name: user.firstName,
    user_type: user.userType,
    st_created_at: user.createdAt,
    email_verified: user.emailVerified,
    banned: user.banned,
    deleted: user.deleted,
    stripe_connected: user.stripeConnected,
    listing_id: primary?.id ?? null,
    listing_title: primary?.title ?? null,
    listing_state: primary?.state ?? null,
    listing_created_at: primary?.createdAt ?? null,
    has_title: !!primary?.title,
    has_description: !!primary?.description,
    has_address: !!(primary?.hasGeolocation && primary?.hasAddress),
    has_price: !!primary?.hasPrice,
    photo_count: primary?.photoCount ?? 0,
    listing_ready: ready,
    booking_count: bookingCount,
    first_booking_at: bookedAts[0] ?? null,
    last_booking_at: bookedAts[bookedAts.length - 1] ?? null,
    lifecycle_state: state,
    missing,
  };
}

/** Safe first name for "Hi Sarah," — never an id, never an email fragment. */
export function safeFirstName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().split(/\s+/)[0] ?? "";
  if (s.length < 2 || s.length > 24) return null;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+$/.test(s)) return null;
  if (/^(test|user|host|guest|admin|null|undefined)$/i.test(s)) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
