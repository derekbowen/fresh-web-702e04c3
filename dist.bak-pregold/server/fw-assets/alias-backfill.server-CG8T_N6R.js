import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
const KNOWN_PREFIXES = [
  "become-a-swimming-pool-host-",
  "swim-instructor-pool-rental-",
  "rent-a-swimming-pool-",
  "pool-rental-",
  "host-acquisition-"
];
const STATIC_ALIASES = {
  "become-a-pool-host": "become-a-swimming-pool-host",
  "howithostsworks": "how-it-works",
  "how-it-works-host": "how-it-works",
  "event-guides": "learningacademy",
  "careers": "about",
  "pool-pros": "providers",
  "sign-a-waiver": "waivers"
};
async function pageExists(slug) {
  const { data } = await supabaseAdmin.from("content_pages").select("slug").eq("slug", slug).in("status", ["pending", "scraped", "drafted", "migrated", "published"]).limit(1);
  return (data ?? []).length > 0;
}
async function resolveSlug(legacySlug) {
  if (STATIC_ALIASES[legacySlug]) {
    const target = STATIC_ALIASES[legacySlug];
    if (await pageExists(target)) {
      return { canonical: target, reason: `static_alias→${target}` };
    }
    return { canonical: null, reason: `static_alias_target_missing:${target}` };
  }
  for (const prefix of KNOWN_PREFIXES) {
    if (!legacySlug.startsWith(prefix)) continue;
    const rest = legacySlug.slice(prefix.length);
    if (!rest) continue;
    const looksSuffixed = /-[a-z]{2}$/.test(rest);
    if (looksSuffixed) {
      for (const altPrefix of KNOWN_PREFIXES) {
        if (altPrefix === prefix) continue;
        const cand = `${altPrefix}${rest}`;
        if (await pageExists(cand)) {
          return { canonical: cand, reason: `prefix_swap:${prefix}→${altPrefix}` };
        }
      }
      return { canonical: null, reason: `suffixed_no_match` };
    }
    const { data: cityRows } = await supabaseAdmin.from("cities").select("slug, state_code").eq("slug", rest).eq("is_published", true).limit(1);
    const city = (cityRows ?? [])[0];
    if (city?.state_code) {
      const cand = `${prefix}${rest}-${city.state_code.toLowerCase()}`;
      if (await pageExists(cand)) {
        return { canonical: cand, reason: `city_state_suffix:${city.state_code}` };
      }
    }
    return { canonical: null, reason: `bare_city_no_match` };
  }
  return { canonical: null, reason: `no_rule` };
}
async function attachAlias(canonicalSlug, legacySlug, reason) {
  const { data: rows } = await supabaseAdmin.from("content_pages").select("id, legacy_slugs").eq("slug", canonicalSlug).in("status", ["pending", "scraped", "drafted", "migrated", "published"]).limit(1);
  const row = (rows ?? [])[0];
  if (!row) return;
  const existing = Array.isArray(row.legacy_slugs) ? row.legacy_slugs : [];
  if (existing.includes(legacySlug)) ;
  else {
    const next = [...existing, legacySlug];
    await supabaseAdmin.from("content_pages").update({ legacy_slugs: next }).eq("id", row.id);
  }
  await supabaseAdmin.from("content_404_log").update({
    resolved_at: (/* @__PURE__ */ new Date()).toISOString(),
    resolution_notes: `alias→${canonicalSlug} (${reason})`
  }).eq("slug", legacySlug).is("resolved_at", null);
}
async function runAliasBackfill(opts = {}) {
  const limit = Math.min(Math.max(opts.limit ?? 500, 1), 2e3);
  const { data: rows, error } = await supabaseAdmin.from("content_404_log").select("slug, hit_count, url_path").is("resolved_at", null).not("slug", "is", null).order("hit_count", { ascending: false }).limit(limit);
  if (error) throw new Error(`Failed to load 404 log: ${error.message}`);
  const candidates = (rows ?? []).filter((r) => r.url_path.startsWith("/p/"));
  const results = [];
  for (const r of candidates) {
    const { canonical, reason } = await resolveSlug(r.slug);
    if (canonical && !opts.dryRun) {
      await attachAlias(canonical, r.slug, reason);
    }
    results.push({
      legacy_slug: r.slug,
      canonical_slug: canonical,
      status: canonical ? "resolved" : "unresolved",
      reason,
      hit_count: r.hit_count
    });
  }
  const summary = results.reduce(
    (acc, r) => {
      acc.total = (acc.total ?? 0) + 1;
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      acc.hits_recovered = (acc.hits_recovered ?? 0) + (r.status === "resolved" ? r.hit_count : 0);
      return acc;
    },
    { total: 0 }
  );
  return { results, summary };
}
export {
  runAliasBackfill as r
};
