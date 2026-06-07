/**
 * Sharetribe Marketplace API SDK — locked to the TEST marketplace.
 *
 * Separate from the existing Integration API client (`sharetribe.server.ts`)
 * and the env-aware Integration client (`sharetribe-env.server.ts`). This
 * one talks to the user-facing Marketplace API (search, currentUser,
 * password login, signup, transactions) — the surface cardbay uses.
 *
 * Scope: TEST environment only. Reads:
 *   SHARETRIBE_TEST_CLIENT_ID
 *   SHARETRIBE_TEST_CLIENT_SECRET
 *   SHARETRIBE_TEST_MARKETPLACE_URL (optional, only used as a sanity log)
 *
 * Never reads the LIVE client id/secret. If you need the LIVE SDK later,
 * stand up a sibling file — do not parameterize this one.
 */
// @ts-ignore — package ships its own CJS types
import sharetribeSdk from "sharetribe-flex-sdk";

function testCreds() {
  const clientId = process.env.SHARETRIBE_TEST_CLIENT_ID;
  const clientSecret = process.env.SHARETRIBE_TEST_CLIENT_SECRET;
  if (!clientId) throw new Error("SHARETRIBE_TEST_CLIENT_ID is not configured");
  return { clientId, clientSecret };
}

/**
 * Anonymous SDK against TEST. Good for public search-style calls.
 * Uses an in-memory token store so nothing leaks into request cookies.
 */
export function getTestSdkAnon(): any {
  const { clientId } = testCreds();
  return sharetribeSdk.createInstance({
    clientId,
    tokenStore: sharetribeSdk.tokenStore.memoryStore(),
  });
}

/**
 * Trusted (client_credentials) SDK against TEST. Use only from admin-gated
 * server fns — it is NOT a user-context token, so calls that require a
 * customer/provider identity (transactions.initiate request-payment, etc.)
 * will 403. For now we use this for listings.query, users.show, and other
 * read-style calls that accept a trusted-client token.
 */
export function getTestSdkTrusted(): any {
  const { clientId, clientSecret } = testCreds();
  if (!clientSecret) {
    throw new Error("SHARETRIBE_TEST_CLIENT_SECRET is not configured");
  }
  return sharetribeSdk.createInstance({
    clientId,
    clientSecret,
    tokenStore: sharetribeSdk.tokenStore.memoryStore(),
  });
}

export function sdkErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Unexpected error";
  const e = err as { data?: { errors?: Array<{ title?: string; code?: string }> }; message?: string; status?: number };
  const apiMsg = e.data?.errors?.[0]?.title;
  const code = e.data?.errors?.[0]?.code;
  if (apiMsg) return code ? `${apiMsg} (${code})` : apiMsg;
  return e.message ?? `Sharetribe SDK error${e.status ? ` [${e.status}]` : ""}`;
}
