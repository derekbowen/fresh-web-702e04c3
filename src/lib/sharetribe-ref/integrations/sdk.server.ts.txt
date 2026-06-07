// Server-only Sharetribe SDK factory. Each request gets its own SDK instance
// whose token store is backed by an HTTP-only cookie.
import sharetribeSdk from "sharetribe-flex-sdk";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";

const TOKEN_COOKIE = "st_token";

type StoredToken = Record<string, unknown> | null;

function makeCookieTokenStore() {
  // The Sharetribe SDK calls these synchronously.
  let cached: StoredToken = readFromCookie();

  function readFromCookie(): StoredToken {
    const raw = getCookie(TOKEN_COOKIE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return {
    getToken: () => cached,
    setToken: (token: unknown) => {
      cached = token as StoredToken;
      setCookie(TOKEN_COOKIE, JSON.stringify(token), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    },
    removeToken: () => {
      cached = null;
      deleteCookie(TOKEN_COOKIE, { path: "/" });
    },
  };
}

export function getSdk() {
  const clientId =
    process.env.SHARETRIBE_SDK_CLIENT_ID ??
    process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
  if (!clientId) throw new Error("Sharetribe Client ID is not configured");

  // NOTE: Do NOT pass clientSecret here. The public SDK is used for user
  // password login / signup / currentUser flows. Adding clientSecret turns
  // the call into a trusted-client (client_credentials) flow and causes 401s.
  // Use a separate trusted SDK instance for privileged server-only operations.
  return sharetribeSdk.createInstance({
    clientId,
    tokenStore: makeCookieTokenStore(),
  });
}

// Trusted SDK in user context. Sharetribe requires that "trusted" calls
// (e.g. transactions.initiate with privileged transitions like
// `request-payment`) carry an exchanged user token — passing only
// clientId+clientSecret yields an anonymous client_credentials token
// which Sharetribe rejects with 403 Forbidden when the API expects a
// customer to act.
export async function getTrustedSdk() {
  const clientId =
    process.env.SHARETRIBE_SDK_CLIENT_ID ??
    process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
  const clientSecret = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Sharetribe trusted SDK credentials are not configured");
  }
  // 1) SDK seeded with the user's cookie token. clientSecret must be set on
  // the instance — exchangeToken reads it from the SDK config, not params.
  const userSdk = sharetribeSdk.createInstance({
    clientId,
    clientSecret,
    tokenStore: makeCookieTokenStore(),
  });
  // 2) Exchange the user token for a trusted user token.
  const tokenRes = await userSdk.exchangeToken();
  const trustedToken = tokenRes.data;
  // 3) Trusted SDK whose in-memory tokenStore is pre-seeded with the
  // exchanged token, so subsequent calls act on behalf of the user.
  const memStore = sharetribeSdk.tokenStore.memoryStore();
  memStore.setToken(trustedToken);
  return sharetribeSdk.createInstance({
    clientId,
    clientSecret,
    tokenStore: memStore,
  });
}

// Helper to surface SDK error messages cleanly.
export function sdkErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Unexpected error";
  const e = err as { data?: { errors?: Array<{ title?: string }> }; message?: string };
  const apiMsg = e.data?.errors?.[0]?.title;
  return apiMsg ?? e.message ?? "Unexpected error";
}
