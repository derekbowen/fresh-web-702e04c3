#!/usr/bin/env node
/**
 * check:price-variants — a tiered listing must actually offer its tiers.
 *
 * The invariant: if a listing has more than one `publicData.priceVariants`
 * entry, it MUST also have `publicData.priceVariationsEnabled === true`.
 *
 * Why this check exists, concretely. In server/api-util/lineItems.js the unit
 * price resolves as:
 *
 *     isBookable && priceVariationsEnabled && isPriceInSubunitsValid
 *       ? new Money(priceInSubunits, currency)   // the selected tier
 *       : <the listing's base price>
 *
 * `priceVariationsEnabled` is a required conjunct. Without it the tiers are
 * inert and every booking bills at the base price, silently. That is exactly
 * what happened to "Justice For Pools" (importedFrom swimply:10961): seven
 * tiers from $200 to $500/hr, and every booking priced at $200 because the
 * flag was never written at import time.
 *
 * This is a DATA invariant, not a code one — the code was always correct. So it
 * is checked against live listings rather than asserted in a unit test.
 *
 * Needs Integration API credentials, which exist on the production host but not
 * in CI, so it is wired into verify:deploy rather than verify:production. With
 * no credentials it exits 0 and says it skipped, rather than failing a CI job
 * for the wrong reason — but on the box, where the creds are, a violation fails
 * the deploy.
 *
 * env: SHARETRIBE_INTEG_CLIENT_ID / SHARETRIBE_INTEG_CLIENT_SECRET
 *      (or SHARETRIBE_INTEGRATION_SDK_CLIENT_ID / _SECRET)
 *      STATES (default "published,draft,pendingApproval,closed")
 */
const ID =
  process.env.SHARETRIBE_INTEG_CLIENT_ID || process.env.SHARETRIBE_INTEGRATION_SDK_CLIENT_ID;
const SECRET =
  process.env.SHARETRIBE_INTEG_CLIENT_SECRET ||
  process.env.SHARETRIBE_INTEGRATION_SDK_CLIENT_SECRET;
const STATES = (process.env.STATES || "published,draft,pendingApproval,closed").split(",");
const BASE = "https://flex-integ-api.sharetribe.com";

if (!ID || !SECRET) {
  console.log("check:price-variants — SKIPPED (no Integration API credentials in this environment)");
  console.log("  This check runs on the production host via verify:deploy, where the creds live.");
  process.exit(0);
}

const token = await (async () => {
  const r = await fetch(`${BASE}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: ID,
      client_secret: SECRET,
      scope: "integ",
    }),
  });
  if (!r.ok) {
    console.error(`FAIL — Integration API auth returned ${r.status}`);
    process.exit(1);
  }
  return (await r.json()).access_token;
})();

const query = async (params) => {
  const r = await fetch(`${BASE}/v1/integration_api/listings/query?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    console.error(`FAIL — listings/query returned ${r.status}`);
    process.exit(1);
  }
  return r.json();
};

const tiered = [];
const violations = [];
for (const state of STATES) {
  for (let page = 1; page <= 20; page++) {
    const res = await query({ states: state, perPage: "100", page: String(page) });
    for (const l of res.data || []) {
      const pd = l.attributes.publicData || {};
      const pv = pd.priceVariants;
      if (!Array.isArray(pv) || pv.length <= 1) continue;
      const id = typeof l.id === "string" ? l.id : l.id.uuid;
      const row = {
        id,
        state,
        title: l.attributes.title,
        n: pv.length,
        flag: pd.priceVariationsEnabled,
        base: (l.attributes.price || {}).amount,
        lo: Math.min(...pv.map((v) => v.priceInSubunits ?? Infinity)),
        hi: Math.max(...pv.map((v) => v.priceInSubunits ?? -Infinity)),
        importedFrom: pd.importedFrom,
      };
      tiered.push(row);
      if (row.flag !== true) violations.push(row);
    }
    if (page >= (res.meta?.totalPages ?? 1)) break;
  }
}

console.log(`check:price-variants — states ${STATES.join(",")}`);
console.log(`  listings with >1 priceVariants        : ${tiered.length}`);
console.log(`  missing priceVariationsEnabled:true   : ${violations.length}`);

if (violations.length) {
  console.error(
    `\nTIERS ARE INERT — these listings carry price tiers that OrderPanel will never offer,\n` +
      `so every booking bills at the base price:`,
  );
  for (const v of violations) {
    const loss = v.hi - v.base;
    console.error(
      `  ${v.id}  ${v.state}  ${v.n} tiers  flag=${v.flag}  base=${v.base}  range=${v.lo}-${v.hi}` +
        (loss > 0 ? `  (up to ${loss} subunits/hr under-billed)` : "") +
        `  ${v.importedFrom ? `[${v.importedFrom}] ` : ""}${v.title}`,
    );
  }
  console.error(
    `\nFix: set publicData.priceVariationsEnabled = true. Do NOT change the host's\n` +
      `priceVariants amounts or the listing price while doing it.`,
  );
  process.exit(1);
}

console.log("\nPASS — every tiered listing actually offers its tiers.");
