/**
 * Env-aware Sharetribe Integration API client.
 *
 * Lets the new Marketplace Console (/admin/marketplace) flip between the
 * Live and Test Sharetribe marketplaces without disturbing the existing
 * default integration client used by sync jobs, the SEO layer, etc.
 *
 * Uses these secrets:
 *   live:  SHARETRIBE_INTEG_CLIENT_ID  +  SHARETRIBE_INTEG_CLIENT_SECRET
 *   test:  SHARETRIBE_TEST_INTEG_CLIENT_ID + SHARETRIBE_TEST_INTEG_CLIENT_SECRET
 */
const INTEGRATION_API_BASE = "https://flex-integ-api.sharetribe.com";

export type StEnv = "live" | "test";

type TokenCache = { token: string; expiresAt: number };
const tokenCache: Record<StEnv, TokenCache | null> = { live: null, test: null };

function creds(env: StEnv): { id: string; secret: string } {
  if (env === "test") {
    const id = process.env.SHARETRIBE_TEST_INTEG_CLIENT_ID;
    const secret = process.env.SHARETRIBE_TEST_INTEG_CLIENT_SECRET;
    if (!id || !secret) throw new Error("Sharetribe TEST integration creds missing");
    return { id, secret };
  }
  const id = process.env.SHARETRIBE_INTEG_CLIENT_ID;
  const secret = process.env.SHARETRIBE_INTEG_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Sharetribe LIVE integration creds missing");
  return { id, secret };
}

async function token(env: StEnv): Promise<string> {
  const now = Date.now();
  const cached = tokenCache[env];
  if (cached && cached.expiresAt > now + 30_000) return cached.token;
  const { id, secret } = creds(env);
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: "client_credentials",
    scope: "integ",
  });
  const res = await fetch(`${INTEGRATION_API_BASE}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Sharetribe ${env} auth [${res.status}]: ${t.slice(0, 200)}`);
  }
  const j = (await res.json()) as { access_token: string; expires_in?: number };
  tokenCache[env] = { token: j.access_token, expiresAt: now + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

export async function stIntegGet<T = any>(
  env: StEnv,
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const t = await token(env);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const url = `${INTEGRATION_API_BASE}/v1/integration_api${path}${params.size ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${t}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ST ${env} GET ${path} [${res.status}]: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}
