const INTEGRATION_API_BASE = "https://flex-integ-api.sharetribe.com";
const tokenCache = { live: null, test: null };
function creds(env) {
  if (env === "test") {
    const id2 = process.env.SHARETRIBE_TEST_INTEG_CLIENT_ID;
    const secret2 = process.env.SHARETRIBE_TEST_INTEG_CLIENT_SECRET;
    if (!id2 || !secret2) throw new Error("Sharetribe TEST integration creds missing");
    return { id: id2, secret: secret2 };
  }
  const id = process.env.SHARETRIBE_INTEG_CLIENT_ID;
  const secret = process.env.SHARETRIBE_INTEG_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Sharetribe LIVE integration creds missing");
  return { id, secret };
}
async function token(env) {
  const now = Date.now();
  const cached = tokenCache[env];
  if (cached && cached.expiresAt > now + 3e4) return cached.token;
  const { id, secret } = creds(env);
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: "client_credentials",
    scope: "integ"
  });
  const res = await fetch(`${INTEGRATION_API_BASE}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Sharetribe ${env} auth [${res.status}]: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  tokenCache[env] = { token: j.access_token, expiresAt: now + (j.expires_in ?? 3600) * 1e3 };
  return j.access_token;
}
async function stIntegGet(env, path, query = {}) {
  const t = await token(env);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== void 0 && v !== null && v !== "") params.set(k, String(v));
  }
  const url = `${INTEGRATION_API_BASE}/v1/integration_api${path}${params.size ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${t}`, Accept: "application/json" }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ST ${env} GET ${path} [${res.status}]: ${text.slice(0, 200)}`);
  }
  return await res.json();
}
export {
  stIntegGet
};
