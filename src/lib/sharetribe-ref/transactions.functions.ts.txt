// Transactions + messaging server functions backed by the Sharetribe
// `default-purchase` process (alias `release-1`). Stripe payment transitions
// are intentionally NOT wired yet — buyers start a transaction via
// `transition/inquire`, and from there both parties can message and (later)
// move into the payment + delivery transitions.
//
// State machine (default-purchase, abridged):
//   inquiry --request-payment--> pending-payment --confirm-payment--> purchased
//   purchased --mark-delivered--> delivered --mark-received--> completed
// Plus cancel/dispute/auto-* branches we expose through `transitionTransaction`.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSdk, sdkErrorMessage } from "@/integrations/sharetribe/sdk.server";

export const TX_PROCESS_ALIAS =
  process.env.SHARETRIBE_TX_PROCESS_ALIAS ?? "default-purchase/release-1";

export const TX_TRANSITIONS = {
  INQUIRE: "transition/inquire",
  REQUEST_PAYMENT_AFTER_INQUIRY: "transition/request-payment-after-inquiry",
  REQUEST_PAYMENT: "transition/request-payment",
  CONFIRM_PAYMENT: "transition/confirm-payment",
  EXPIRE_PAYMENT: "transition/expire-payment",
  MARK_DELIVERED: "transition/mark-delivered",
  MARK_RECEIVED: "transition/mark-received",
  AUTO_MARK_RECEIVED: "transition/auto-mark-received",
  AUTO_COMPLETE: "transition/auto-complete",
  CANCEL: "transition/cancel",
  OPERATOR_CANCEL: "transition/operator-cancel",
  REVIEW_BY_CUSTOMER: "transition/review-1-by-customer",
  REVIEW_BY_PROVIDER: "transition/review-1-by-provider",
  REVIEW_BY_CUSTOMER_SECOND: "transition/review-2-by-customer",
  REVIEW_BY_PROVIDER_SECOND: "transition/review-2-by-provider",
  EXPIRE_REVIEW_PERIOD: "transition/expire-review-period",
} as const;

// ---------- types ----------

export interface ClientTxMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string;
}

export interface ClientTransaction {
  id: string;
  processName: string | null;
  state: string; // last transition's resulting state
  lastTransition: string | null;
  lastTransitionedAt: string | null;
  createdAt: string | null;
  role: "customer" | "provider";

  // counter-party (the other side from the viewer's `role`)
  counterpartyId: string | null;
  counterpartyName: string;

  // listing snapshot
  listingId: string | null;
  listingTitle: string;
  listingImageUrl: string | null;

  // money — payinTotal is what the customer pays, payoutTotal is what provider receives
  totalAmount: number | null;
  totalCurrency: string | null;

  // optional message preview / count
  lastMessageAt: string | null;

  // shipping snapshot from protectedData (set at checkout / mark-shipped)
  shippingAddress: {
    name?: string;
    address?: string;
    city?: string;
    postal?: string;
    country?: string;
  } | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;

  // review state — true once the viewer has submitted a review
  viewerHasReviewed: boolean;
}

interface SdkRef {
  id: { uuid: string } | string;
  type: string;
}
interface SdkResource<A> extends SdkRef {
  attributes: A;
  relationships?: Record<string, { data?: SdkRef | SdkRef[] | null }>;
}
interface TxAttributes {
  createdAt?: string | Date;
  processName?: string;
  lastTransition?: string;
  lastTransitionedAt?: string | Date;
  payinTotal?: { amount?: number; currency?: string } | null;
  payoutTotal?: { amount?: number; currency?: string } | null;
  transitions?: Array<{ transition: string; createdAt: string | Date; by: string }>;
  protectedData?: Record<string, unknown>;
}
interface ListingAttrs {
  title?: string;
}
interface UserAttrs {
  profile?: { displayName?: string; firstName?: string };
}
interface ImageAttrs {
  variants?: Record<string, { url?: string }>;
}
interface MessageAttrs {
  content?: string;
  createdAt?: string | Date;
}

function rid(id: { uuid: string } | string): string {
  return typeof id === "string" ? id : id.uuid;
}
function findIncluded<A>(
  included: Array<SdkResource<unknown>>,
  type: string,
  id: string | null,
): SdkResource<A> | undefined {
  if (!id) return undefined;
  return included.find((i) => i.type === type && rid(i.id) === id) as
    | SdkResource<A>
    | undefined;
}

function transitionToState(t: string | null | undefined): string {
  if (!t) return "unknown";
  // strip leading "transition/"
  return t.replace(/^transition\//, "").replace(/-/g, " ");
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toTransaction(
  tx: SdkResource<TxAttributes>,
  included: Array<SdkResource<unknown>>,
  viewerId: string,
): ClientTransaction {
  const a = tx.attributes;
  const customerRel = tx.relationships?.customer?.data as SdkRef | undefined;
  const providerRel = tx.relationships?.provider?.data as SdkRef | undefined;
  const listingRel = tx.relationships?.listing?.data as SdkRef | undefined;
  const messagesRel = (tx.relationships?.messages?.data ?? []) as SdkRef[];

  const customerId = customerRel ? rid(customerRel.id) : null;
  const providerId = providerRel ? rid(providerRel.id) : null;
  const listingId = listingRel ? rid(listingRel.id) : null;

  const role: "customer" | "provider" =
    viewerId && providerId === viewerId ? "provider" : "customer";
  const counterpartyId = role === "customer" ? providerId : customerId;
  const counterparty = findIncluded<UserAttrs>(included, "user", counterpartyId);
  const counterpartyName =
    counterparty?.attributes.profile?.displayName ??
    counterparty?.attributes.profile?.firstName ??
    "Member";

  const listing = findIncluded<ListingAttrs>(included, "listing", listingId);
  const listingTitle = listing?.attributes.title ?? "Listing";

  // listing image (first image, if expanded)
  let listingImageUrl: string | null = null;
  const listingImageRel = listing?.relationships?.images?.data as
    | SdkRef[]
    | undefined;
  if (listingImageRel?.length) {
    const img = findIncluded<ImageAttrs>(included, "image", rid(listingImageRel[0].id));
    const variants = img?.attributes.variants;
    listingImageUrl =
      variants?.["square-small"]?.url ??
      variants?.["default"]?.url ??
      Object.values(variants ?? {})[0]?.url ??
      null;
  }

  let lastMessageAt: string | null = null;
  if (messagesRel.length) {
    const ordered = messagesRel
      .map((m) => findIncluded<MessageAttrs>(included, "message", rid(m.id)))
      .filter((m): m is SdkResource<MessageAttrs> => !!m)
      .sort((x, y) =>
        (toIsoString(x.attributes.createdAt) ?? "").localeCompare(
          toIsoString(y.attributes.createdAt) ?? "",
        ),
      );
    for (const msg of ordered) {
      const t = toIsoString(msg.attributes.createdAt);
      if (t && (!lastMessageAt || t > lastMessageAt)) lastMessageAt = t;
    }
  }

  const protectedData = (a.protectedData ?? {}) as Record<string, unknown>;
  const shipping = (protectedData.shipping ?? null) as ClientTransaction["shippingAddress"];
  const tracking = (protectedData.tracking ?? null) as
    | { number?: string; carrier?: string }
    | null;

  // Detect if the viewer has already submitted a review by walking the
  // transitions array.
  let viewerHasReviewed = false;
  const reviewerTransitions: string[] =
    role === "customer"
      ? [TX_TRANSITIONS.REVIEW_BY_CUSTOMER, TX_TRANSITIONS.REVIEW_BY_CUSTOMER_SECOND]
      : [TX_TRANSITIONS.REVIEW_BY_PROVIDER, TX_TRANSITIONS.REVIEW_BY_PROVIDER_SECOND];
  for (const t of a.transitions ?? []) {
    if (reviewerTransitions.includes(t.transition)) {
      viewerHasReviewed = true;
      break;
    }
  }

  return {
    id: rid(tx.id),
    processName: a.processName ?? null,
    state: transitionToState(a.lastTransition),
    lastTransition: a.lastTransition ?? null,
    lastTransitionedAt: toIsoString(a.lastTransitionedAt),
    createdAt: toIsoString(a.createdAt),
    role,
    counterpartyId,
    counterpartyName,
    listingId,
    listingTitle,
    listingImageUrl,
    totalAmount: a.payinTotal?.amount ?? null,
    totalCurrency: a.payinTotal?.currency ?? null,
    lastMessageAt,
    shippingAddress: shipping,
    trackingNumber: tracking?.number ?? null,
    trackingCarrier: tracking?.carrier ?? null,
    viewerHasReviewed,
  };
}

async function getViewerId(sdk: ReturnType<typeof getSdk>): Promise<string> {
  const me = await sdk.currentUser.show();
  const data = me.data?.data as SdkRef | undefined;
  if (!data) throw new Error("Not signed in");
  return rid(data.id);
}

// ---------- queryTransactions ----------

const queryTxSchema = z.object({
  role: z.enum(["customer", "provider"]).default("customer"),
});

export const queryTransactions = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => queryTxSchema.parse(d ?? {}))
  .handler(
    async ({ data }): Promise<{ transactions: ClientTransaction[] }> => {
      const sdk = getSdk();
      try {
        const viewerId = await getViewerId(sdk);
        // NOTE: Sharetribe's `transactions.query` requires `lastTransitions`
        // to include transactions across the full process — without it,
        // inquiry-state transactions (which is where our pre-Stripe flow
        // currently sits) are excluded from the inbox listing.
        const res = await sdk.transactions.query({
          only: data.role === "provider" ? "sale" : "order",
          lastTransitions: Object.values(TX_TRANSITIONS),
          include: ["customer", "provider", "listing", "listing.images", "messages"],
          "fields.image": ["variants.square-small"],
          perPage: 50,
        });
        const items = (res.data?.data ?? []) as Array<SdkResource<TxAttributes>>;
        const included = (res.data?.included ?? []) as Array<SdkResource<unknown>>;
        return {
          transactions: items
            .map((it) => toTransaction(it, included, viewerId))
            // sort newest first
            .sort((a, b) => {
              const ta = toIsoString(a.lastMessageAt ?? a.lastTransitionedAt ?? a.createdAt) ?? "";
              const tb = toIsoString(b.lastMessageAt ?? b.lastTransitionedAt ?? b.createdAt) ?? "";
              return tb.localeCompare(ta);
            }),
        };
      } catch (err) {
        throw new Error(sdkErrorMessage(err));
      }
    },
  );

// ---------- showTransaction ----------

const showTxSchema = z.object({ id: z.string().min(1).max(64) });

export interface TransactionWithMessages {
  transaction: ClientTransaction;
  messages: ClientTxMessage[];
  availableTransitions: string[]; // transitions the viewer is permitted to invoke
}

function availableTransitionsFor(tx: ClientTransaction): string[] {
  const last = tx.lastTransition ?? "";
  const out: string[] = [];

  // From inquiry → checkout (request payment)
  if (last === TX_TRANSITIONS.INQUIRE && tx.role === "customer") {
    out.push(TX_TRANSITIONS.REQUEST_PAYMENT_AFTER_INQUIRY);
  }

  // After payment is confirmed → seller can ship, either side can cancel
  if (last === TX_TRANSITIONS.CONFIRM_PAYMENT) {
    if (tx.role === "provider") out.push(TX_TRANSITIONS.MARK_DELIVERED);
    out.push(TX_TRANSITIONS.CANCEL);
  }

  // Shipped → buyer confirms receipt
  if (last === TX_TRANSITIONS.MARK_DELIVERED && tx.role === "customer") {
    out.push(TX_TRANSITIONS.MARK_RECEIVED);
  }

  // Completed (received or auto-received) → reviews
  const inReviewWindow =
    last === TX_TRANSITIONS.MARK_RECEIVED ||
    last === TX_TRANSITIONS.AUTO_MARK_RECEIVED ||
    last === TX_TRANSITIONS.AUTO_COMPLETE;
  if (inReviewWindow && !tx.viewerHasReviewed) {
    out.push(
      tx.role === "customer"
        ? TX_TRANSITIONS.REVIEW_BY_CUSTOMER
        : TX_TRANSITIONS.REVIEW_BY_PROVIDER,
    );
  }

  // After one side has reviewed, the other can still leave one (review-2-by-*)
  if (
    (last === TX_TRANSITIONS.REVIEW_BY_CUSTOMER && tx.role === "provider" && !tx.viewerHasReviewed) ||
    (last === TX_TRANSITIONS.REVIEW_BY_PROVIDER && tx.role === "customer" && !tx.viewerHasReviewed)
  ) {
    out.push(
      tx.role === "customer"
        ? TX_TRANSITIONS.REVIEW_BY_CUSTOMER_SECOND
        : TX_TRANSITIONS.REVIEW_BY_PROVIDER_SECOND,
    );
  }

  return out;
}

export const showTransaction = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => showTxSchema.parse(d))
  .handler(async ({ data }): Promise<TransactionWithMessages | null> => {
    const sdk = getSdk();
    try {
      const viewerId = await getViewerId(sdk);
      const res = await sdk.transactions.show({
        id: data.id,
        include: [
          "customer",
          "provider",
          "listing",
          "listing.images",
          "messages",
          "messages.sender",
        ],
        "fields.image": ["variants.square-small", "variants.default"],
      });
      const item = res.data?.data as SdkResource<TxAttributes> | null;
      if (!item) return null;
      const included = (res.data?.included ?? []) as Array<SdkResource<unknown>>;
      const tx = toTransaction(item, included, viewerId);

      const msgRefs = (item.relationships?.messages?.data ?? []) as SdkRef[];
      const messages: ClientTxMessage[] = msgRefs
        .map((ref) => {
          const m = findIncluded<MessageAttrs>(included, "message", rid(ref.id));
          if (!m) return null;
          const senderRef = m.relationships?.sender?.data as SdkRef | undefined;
          const senderId = senderRef ? rid(senderRef.id) : "";
          const sender = findIncluded<UserAttrs>(included, "user", senderId);
          return {
            id: rid(m.id),
            content: m.attributes.content ?? "",
            createdAt: toIsoString(m.attributes.createdAt) ?? "",
            senderId,
            senderName:
              sender?.attributes.profile?.displayName ??
              sender?.attributes.profile?.firstName ??
              "Member",
          } satisfies ClientTxMessage;
        })
        .filter((m): m is ClientTxMessage => m !== null)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      return {
        transaction: tx,
        messages,
        availableTransitions: availableTransitionsFor(tx),
      };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- initiateInquiry ----------
// Creates a transaction in `state/inquiry` so buyer + seller can message.
// This is also our pre-Stripe entry point — once payments are wired, the
// customer transitions to `request-payment-after-inquiry`.

const initiateInquirySchema = z.object({
  listingId: z.string().min(1).max(64),
  message: z.string().min(1).max(5000),
});

export const initiateInquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => initiateInquirySchema.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const sdk = getSdk();
    try {
      const viewerId = await getViewerId(sdk);
      const listingRes = await sdk.listings.show({ id: data.listingId });
      const listingItem = listingRes.data?.data as
        | (SdkRef & { relationships?: { author?: { data?: SdkRef } } })
        | undefined;
      const authorRef = listingItem?.relationships?.author?.data;
      const authorId = authorRef ? rid(authorRef.id) : null;
      if (authorId && authorId === viewerId) {
        throw new Error("You can't message yourself about your own listing.");
      }
      const res = await sdk.transactions.initiate({
        processAlias: TX_PROCESS_ALIAS,
        transition: TX_TRANSITIONS.INQUIRE,
        params: {
          listingId: data.listingId,
          // initial message is sent as a separate call below — many process
          // configs don't accept message via params on inquiry.
        },
      });
      const item = res.data?.data as SdkRef | undefined;
      const id = item ? rid(item.id) : "";
      if (!id) throw new Error("Inquiry creation returned no id");

      // Attach the buyer's first message to the new thread.
      try {
        await sdk.messages.send({ transactionId: id, content: data.message });
      } catch {
        // Non-fatal: the transaction exists even if the first message fails.
      }
      return { id };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- sendMessage ----------

const sendMessageSchema = z.object({
  transactionId: z.string().min(1).max(64),
  content: z.string().min(1).max(5000),
});

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sendMessageSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sdk = getSdk();
    try {
      await sdk.messages.send({
        transactionId: data.transactionId,
        content: data.content,
      });
      return { ok: true };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- transitionTransaction ----------
// Generic transition driver for state-changing actions: mark-delivered,
// mark-received, cancel, and reviews. Stripe payment transitions
// (request-payment, confirm-payment) live in payments.functions.ts because
// they need the trusted SDK + return Stripe state to the client.

const transitionSchema = z.object({
  id: z.string().min(1).max(64),
  transition: z.string().min(1).max(128),
  params: z.record(z.string(), z.unknown()).default({}),
});

export const transitionTransaction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => transitionSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sdk = getSdk();
    try {
      await sdk.transactions.transition({
        id: data.id,
        transition: data.transition,
        params: data.params,
      });
      return { ok: true };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- markShipped ----------
// Convenience wrapper: marks the order as delivered (shipped) and stores
// optional tracking info in protectedData.

const markShippedSchema = z.object({
  id: z.string().min(1).max(64),
  trackingNumber: z.string().max(128).optional(),
  trackingCarrier: z.string().max(64).optional(),
});

export const markShipped = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => markShippedSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sdk = getSdk();
    try {
      const protectedDataPatch =
        data.trackingNumber || data.trackingCarrier
          ? {
              tracking: {
                number: data.trackingNumber,
                carrier: data.trackingCarrier,
              },
            }
          : {};
      await sdk.transactions.transition({
        id: data.id,
        transition: TX_TRANSITIONS.MARK_DELIVERED,
        params: { protectedData: protectedDataPatch },
      });
      return { ok: true };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- submitReview ----------

const reviewSchema = z.object({
  id: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1).max(2000),
  isFirst: z.boolean(),
  role: z.enum(["customer", "provider"]),
});

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => reviewSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sdk = getSdk();
    const transition = data.isFirst
      ? data.role === "customer"
        ? TX_TRANSITIONS.REVIEW_BY_CUSTOMER
        : TX_TRANSITIONS.REVIEW_BY_PROVIDER
      : data.role === "customer"
        ? TX_TRANSITIONS.REVIEW_BY_CUSTOMER_SECOND
        : TX_TRANSITIONS.REVIEW_BY_PROVIDER_SECOND;
    try {
      await sdk.transactions.transition({
        id: data.id,
        transition,
        params: { reviewRating: data.rating, reviewContent: data.content },
      });
      return { ok: true };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });