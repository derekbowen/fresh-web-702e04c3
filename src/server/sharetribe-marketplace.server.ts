/**
 * Per-user Sharetribe Marketplace API access (NOT the admin Integration API).
 *
 * The rest of the app talks to Sharetribe via the server-to-server Integration
 * API (see sharetribe-env.server.ts / sharetribe.server.ts). That client is
 * admin-scoped and cannot answer "who is the host currently looking at this
 * page?". For the host Money Sheet we need exactly that.
 *
 * Hosts log in on the Sharetribe-hosted marketplace UI (same poolrentalnearme.com
 * domain). Sharetribe's browser SDK stores the user's OAuth token in a cookie
 * named `st-{clientId}-token` (NOT HttpOnly — the browser SDK reads it). We read
 * that cookie server-side, pull the access token, and call the Marketplace API
 * `current_user/show` with it. The returned user UUID equals the `provider_st_id`
 * the mirror stores on that host's transactions, so it keys the Money Sheet.
 *
 * No SDK dependency — raw fetch, mirroring stIntegGet's style.
 */
import { getRequestHeader } from "@tanstack/react-start/server";

const MARKETPLACE_API_BASE = "https://flex-api.sharetribe.com";

export type CurrentHost = {
  id: string;
  email: string | null;
  displayName: string | null;
};

/**
 * Extract the Sharetribe user access token from the request cookies.
 * The token lives in a `st-{clientId}-token` cookie whose value is a
 * URL-encoded JSON token-store blob: { access_token, refresh_token, ... }.
 */
function extractStAccessToken(cookieHeader: string): string | null {
  // `st-authinfo` does not end in `-token`, so this only matches the token cookie.
  const match = cookieHeader.match(/(?:^|;\s*)st-[^=;]*-token=([^;]+)/i);
  if (!match) return null;

  let raw = match[1];
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // fall through with the raw value
  }

  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.access_token === "string" && obj.access_token) {
      return obj.access_token;
    }
  } catch {
    // not JSON — unusable
  }
  return null;
}

/**
 * Resolve the Sharetribe host (provider) for the current request, or null if
 * no authenticated Sharetribe session is present. Never throws.
 */
export async function getCurrentHost(): Promise<CurrentHost | null> {
  try {
    const cookieHeader = getRequestHeader("cookie") || "";
    if (!cookieHeader) return null;

    const token = extractStAccessToken(cookieHeader);
    if (!token) return null;

    const res = await fetch(`${MARKETPLACE_API_BASE}/v1/api/current_user/show`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return null;

    const j = (await res.json()) as {
      data?: {
        id?: string | { uuid?: string };
        attributes?: { email?: string; profile?: { displayName?: string } };
      };
    };
    const d = j?.data;
    if (!d) return null;

    const id = typeof d.id === "string" ? d.id : d.id?.uuid;
    if (!id) return null;

    return {
      id,
      email: d.attributes?.email ?? null,
      displayName: d.attributes?.profile?.displayName ?? null,
    };
  } catch {
    return null;
  }
}
