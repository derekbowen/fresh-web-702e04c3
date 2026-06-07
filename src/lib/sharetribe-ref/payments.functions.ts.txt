// Stripe Connect + checkout server functions.
// All Stripe interactions go through Sharetribe's SDK — Sharetribe is the
// platform owner on Stripe Connect, so it manages Connected Accounts,
// PaymentIntents, transfers, and payouts on our behalf. We never call
// Stripe directly here except for the webhook (see api/public/stripe-webhook).
import { createServerFn } from "@tanstack/react-start";
import sharetribeSdk from "sharetribe-flex-sdk";
import { z } from "zod";
import { getSdk, getTrustedSdk, sdkErrorMessage } from "@/integrations/sharetribe/sdk.server";
import { TX_PROCESS_ALIAS, TX_TRANSITIONS } from "./transactions.functions";

// ---- exposed config ---------------------------------------------------

export const getStripePublishableKey = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ publishableKey: string | null }> => {
    return { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? null };
  },
);

// ---- types ------------------------------------------------------------

export interface StripeAccountStatus {
  hasAccount: boolean;
  stripeAccountId: string | null;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
  country: string | null;
  defaultCurrency: string | null;
}

interface StripeAccountAttrs {
  stripeAccountId?: string;
  stripeAccountData?: {
    payouts_enabled?: boolean;
    charges_enabled?: boolean;
    details_submitted?: boolean;
    country?: string;
    default_currency?: string;
    requirements?: {
      currently_due?: string[];
      past_due?: string[];
      eventually_due?: string[];
    };
  };
}

// ---- getStripeAccount -------------------------------------------------

export const getStripeAccount = createServerFn({ method: "GET" }).handler(
  async (): Promise<StripeAccountStatus> => {
    const sdk = getSdk();
    try {
      const res = await sdk.stripeAccount.fetch();
      const data = res.data?.data as { attributes?: StripeAccountAttrs } | undefined;
      const attrs = data?.attributes;
      const sa = attrs?.stripeAccountData;
      const requirementsDue = [
        ...(sa?.requirements?.currently_due ?? []),
        ...(sa?.requirements?.past_due ?? []),
      ];
      return {
        hasAccount: !!attrs?.stripeAccountId,
        stripeAccountId: attrs?.stripeAccountId ?? null,
        payoutsEnabled: !!sa?.payouts_enabled,
        chargesEnabled: !!sa?.charges_enabled,
        detailsSubmitted: !!sa?.details_submitted,
        requirementsDue,
        country: sa?.country ?? null,
        defaultCurrency: sa?.default_currency ?? null,
      };
    } catch (err) {
      // Sharetribe returns 404 when no account is linked yet — treat that as
      // "not connected" instead of an error.
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        return {
          hasAccount: false,
          stripeAccountId: null,
          payoutsEnabled: false,
          chargesEnabled: false,
          detailsSubmitted: false,
          requirementsDue: [],
          country: null,
          defaultCurrency: null,
        };
      }
      throw new Error(sdkErrorMessage(err));
    }
  },
);

// ---- createStripeAccount ---------------------------------------------
// Creates a Stripe Connect Express account via Sharetribe. We rely on
// Sharetribe's hosted onboarding (Account Links) to collect identity,
// bank, and ToS — so no client-side Stripe.js token is required here.

const createAccountSchema = z.object({
  country: z.string().length(2),
  businessProfileMcc: z.string().min(1).max(8).optional(),
  businessProfileUrl: z.string().url().optional(),
});

export const createStripeAccount = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createAccountSchema.parse(d))
  .handler(async ({ data }): Promise<{ stripeAccountId: string }> => {
    const sdk = getSdk();
    const params: Record<string, unknown> = {
      country: data.country,
      requestedCapabilities: ["card_payments", "transfers"],
    };
    if (data.businessProfileMcc) params.businessProfileMCC = data.businessProfileMcc;
    if (data.businessProfileUrl) params.businessProfileURL = data.businessProfileUrl;
    try {
      const res = await sdk.stripeAccount.create(params);
      const created = res.data?.data as { attributes?: StripeAccountAttrs } | undefined;
      let id = created?.attributes?.stripeAccountId ?? null;
      // Some Sharetribe responses don't include stripeAccountId on the create
      // payload — fetch it back to confirm.
      if (!id) {
        try {
          const fetched = await sdk.stripeAccount.fetch();
          const f = fetched.data?.data as { attributes?: StripeAccountAttrs } | undefined;
          id = f?.attributes?.stripeAccountId ?? null;
        } catch {
          // ignore — fall through to error below
        }
      }
      if (!id)
        throw new Error(
          "Stripe account was created but no account id was returned. Try refreshing the page.",
        );
      return { stripeAccountId: id };
    } catch (err) {
      const detail = err as {
        data?: {
          errors?: Array<{
            title?: string;
            code?: string;
            source?: { pointer?: string; parameter?: string };
            meta?: unknown;
          }>;
        };
        status?: number;
      };
      const e0 = detail?.data?.errors?.[0];
      console.error("[stripeAccount.create] failed", {
        status: detail?.status,
        title: e0?.title,
        code: e0?.code,
        source: e0?.source,
        meta: e0?.meta,
        params,
      });
      const where = e0?.source?.pointer || e0?.source?.parameter;
      const msg = e0?.title ? (where ? `${e0.title} (${where})` : e0.title) : sdkErrorMessage(err);
      throw new Error(msg);
    }
  });

// ---- createStripeAccountLink -----------------------------------------

const accountLinkSchema = z.object({
  successURL: z.string().url(),
  failureURL: z.string().url(),
  type: z
    .enum(["account_onboarding", "account_update", "custom_account_verification"])
    .default("account_onboarding"),
  collectionOptions: z
    .object({ fields: z.enum(["currently_due", "eventually_due"]).default("currently_due") })
    .optional(),
});

export const createStripeAccountLink = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => accountLinkSchema.parse(d))
  .handler(async ({ data }): Promise<{ url: string }> => {
    const sdk = getSdk();
    try {
      const params: Record<string, unknown> = {
        type: data.type,
        successURL: data.successURL,
        failureURL: data.failureURL,
      };
      if (data.collectionOptions) params.collectionOptions = data.collectionOptions;
      const res = await sdk.stripeAccountLinks.create(params);
      const link = res.data?.data as { attributes?: { url?: string } } | undefined;
      const url = link?.attributes?.url;
      if (!url) throw new Error("Stripe returned no onboarding URL");
      return { url };
    } catch (err) {
      const detail = err as {
        data?: {
          errors?: Array<{
            title?: string;
            code?: string;
            source?: { pointer?: string; parameter?: string };
            meta?: unknown;
          }>;
        };
        status?: number;
      };
      const e0 = detail?.data?.errors?.[0];
      console.error("[stripeAccountLinks.create] failed", {
        status: detail?.status,
        title: e0?.title,
        code: e0?.code,
        source: e0?.source,
        meta: e0?.meta,
        type: data.type,
      });
      const where = e0?.source?.pointer || e0?.source?.parameter;
      const msg = e0?.title ? (where ? `${e0.title} (${where})` : e0.title) : sdkErrorMessage(err);
      throw new Error(msg);
    }
  });

// ---- initiateCheckout ------------------------------------------------
// Creates (or transitions an inquiry into) `pending-payment` and returns
// the Stripe PaymentIntent client_secret so the buyer can confirm the
// payment client-side. Uses the trusted SDK because request-payment
// transitions on Sharetribe's `default-purchase` process require privileged
// access.

const initiateCheckoutSchema = z.object({
  listingId: z.string().min(1).max(64),
  existingTransactionId: z.string().min(1).max(64).optional(),
  shipping: z
    .object({
      name: z.string().max(120).optional(),
      address: z.string().max(200).optional(),
      city: z.string().max(120).optional(),
      postal: z.string().max(20).optional(),
      country: z.string().max(120).optional(),
    })
    .optional(),
});

interface InitiatedTxAttrs {
  protectedData?: {
    stripePaymentIntents?: {
      default?: {
        stripePaymentIntentId?: string;
        stripePaymentIntentClientSecret?: string;
      };
    };
  };
}

interface SdkRefLite {
  id: { uuid: string } | string;
  type: string;
  attributes?: InitiatedTxAttrs;
  relationships?: Record<string, { data?: { id: { uuid: string } | string } }>;
}

function rid(id: { uuid: string } | string): string {
  return typeof id === "string" ? id : id.uuid;
}

export const initiateCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => initiateCheckoutSchema.parse(d))
  .handler(
    async ({
      data,
    }): Promise<{
      transactionId: string;
      paymentIntentId: string;
      clientSecret: string;
    }> => {
      try {
        // Owner guard via the public SDK (same auth context as the user).
        const publicSdk = getSdk();
        const me = await publicSdk.currentUser.show();
        const viewerId = rid((me.data?.data as { id: { uuid: string } | string }).id);
        const listingRes = await publicSdk.listings.show({ id: data.listingId });
        const listingItem = listingRes.data?.data as
          | (SdkRefLite & {
              attributes?: InitiatedTxAttrs & {
                price?: { amount?: number; currency?: string };
              };
            })
          | undefined;
        const authorRef = listingItem?.relationships?.author?.data;
        const authorId = authorRef ? rid(authorRef.id) : null;
        if (authorId && authorId === viewerId) {
          throw new Error("You can't buy your own listing.");
        }
        const price = listingItem?.attributes?.price;
        if (!price?.amount || !price.currency) {
          throw new Error("Listing has no price set.");
        }

        const sdk = await getTrustedSdk();
        const protectedData = data.shipping ? { shipping: data.shipping } : {};
        // default-purchase's request-payment transitions are privileged and
        // require a `lineItems` array. Without it Sharetribe rejects the call
        // with "missing required key".
        const Money = sharetribeSdk.types.Money;
        const lineItems = [
          {
            code: "line-item/item",
            unitPrice: new Money(price.amount, price.currency),
            quantity: 1,
            includeFor: ["customer", "provider"],
          },
        ];

        const paymentParams = {
          listingId: data.listingId,
          protectedData,
          lineItems,
          // The default purchase process reserves stock when payment is
          // requested. Sharetribe requires this separately from the line-item
          // quantity, otherwise it returns validation-missing-key for
          // params.stockReservationQuantity.
          stockReservationQuantity: 1,
        };

        let txId = data.existingTransactionId ?? "";
        let attrs: InitiatedTxAttrs | undefined;

        if (txId) {
          const res = await sdk.transactions.transition({
            id: txId,
            transition: TX_TRANSITIONS.REQUEST_PAYMENT_AFTER_INQUIRY,
            params: paymentParams,
          }, { expand: true });
          const item = res.data?.data as SdkRefLite | undefined;
          attrs = item?.attributes;
        } else {
          const res = await sdk.transactions.initiate({
            processAlias: TX_PROCESS_ALIAS,
            transition: TX_TRANSITIONS.REQUEST_PAYMENT,
            params: paymentParams,
          }, { expand: true });
          const item = res.data?.data as SdkRefLite | undefined;
          if (!item) throw new Error("Failed to initiate transaction");
          txId = rid(item.id);
          attrs = item.attributes;
        }

        const intent = attrs?.protectedData?.stripePaymentIntents?.default;
        if (!intent?.stripePaymentIntentClientSecret || !intent.stripePaymentIntentId) {
          throw new Error(
            "Stripe payment intent missing — make sure Stripe Connect is configured in Sharetribe Console.",
          );
        }

        return {
          transactionId: txId,
          paymentIntentId: intent.stripePaymentIntentId,
          clientSecret: intent.stripePaymentIntentClientSecret,
        };
      } catch (err) {
        const detail = err as {
          status?: number;
          data?: {
            errors?: Array<{
              title?: string;
              code?: string;
              source?: unknown;
              meta?: unknown;
              details?: unknown;
            }>;
          };
        };
        console.error("[initiateCheckout] failed", {
          status: detail?.status,
          errors: detail?.data?.errors,
        });
        const e0 = detail?.data?.errors?.[0];
        const extra = e0?.source ? ` (${JSON.stringify(e0.source)})` : "";
        const msg = e0?.title ? `${e0.title}${extra}` : sdkErrorMessage(err);
        throw new Error(msg);
      }
    },
  );

// ---- getPendingPaymentIntent ----------------------------------------
// Fetches the existing Stripe PaymentIntent for a transaction that's already
// in pending-payment state, so the buyer can resume checkout without
// re-initiating the transition (which would fail).

const getPendingIntentSchema = z.object({
  transactionId: z.string().min(1).max(64),
});

export const getPendingPaymentIntent = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => getPendingIntentSchema.parse(d))
  .handler(
    async ({
      data,
    }): Promise<{
      transactionId: string;
      paymentIntentId: string;
      clientSecret: string;
    } | null> => {
      const sdk = getSdk();
      try {
        const res = await sdk.transactions.show({ id: data.transactionId });
        const item = res.data?.data as SdkRefLite | undefined;
        const intent =
          item?.attributes?.protectedData?.stripePaymentIntents?.default;
        if (!intent?.stripePaymentIntentClientSecret || !intent.stripePaymentIntentId) {
          return null;
        }
        return {
          transactionId: data.transactionId,
          paymentIntentId: intent.stripePaymentIntentId,
          clientSecret: intent.stripePaymentIntentClientSecret,
        };
      } catch (err) {
        throw new Error(sdkErrorMessage(err));
      }
    },
  );

// ---- confirmCheckout -------------------------------------------------
// Called after Stripe.js has confirmed the PaymentIntent client-side.

const confirmCheckoutSchema = z.object({
  transactionId: z.string().min(1).max(64),
});

export const confirmCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => confirmCheckoutSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sdk = await getTrustedSdk();
    try {
      await sdk.transactions.transition({
        id: data.transactionId,
        transition: TX_TRANSITIONS.CONFIRM_PAYMENT,
        params: {},
      });
      return { ok: true };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });
