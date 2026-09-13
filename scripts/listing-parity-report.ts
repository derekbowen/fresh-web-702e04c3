/**
 * Listing read parity harness.
 *
 * Queries BOTH sources for the same set of reads, structurally diffs them with
 * src/lib/listing-parity.ts, and prints one report. Read-only: it never writes
 * to Sharetribe or Supabase, and it does not depend on PRNM_LISTING_READ_SOURCE
 * (it always compares both, whatever the flag says).
 *
 * Run on EAST, where SHARETRIBE_INTEG_* and SUPABASE_SERVICE_ROLE_KEY exist:
 *
 *   bun scripts/listing-parity-report.ts
 *   bun scripts/listing-parity-report.ts --cities austin,dallas --per-page 24
 *   bun scripts/listing-parity-report.ts --states TX,CA --listings 20
 *   bun scripts/listing-parity-report.ts --json > parity.json
 *
 * Exit code is 1 when any blocking or unsupported finding is present, so this
 * can gate a cutover in CI. Degraded and cosmetic findings do not fail the run;
 * they are still printed in full.
 */
import {
  fetchListingFromMirror,
  fetchListing,
  searchListingsFromMirror,
  searchListingsFromSharetribe,
  type SearchOptions,
} from "../src/server/sharetribe.server";
import {
  buildParityReport,
  classifyImageUrl,
  diffListing,
  diffSearchResult,
  formatParityReport,
  sharetribeImageIds,
  type ParityFinding,
} from "../src/lib/listing-parity";
import { mirrorUnsupportedOptsFor } from "../src/lib/listing-read-source";

interface Args {
  cities: string[];
  states: string[];
  perPage: number;
  listings: number;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const list = (flag: string): string[] =>
    (get(flag) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    cities: list("--cities"),
    states: list("--states"),
    perPage: Number(get("--per-page") ?? 24),
    listings: Number(get("--listings") ?? 10),
    json: argv.includes("--json"),
  };
}

/** The queries production actually issues, so the report reflects real traffic. */
function buildQueries(args: Args): SearchOptions[] {
  const queries: SearchOptions[] = [
    // Homepage featured — no filters, so today this goes straight to Sharetribe.
    { perPage: args.perPage },
    // Homepage "nearby" — distance sort, which the mirror cannot express.
    { perPage: 5, origin: "30.2672,-97.7431" },
  ];
  for (const citySlug of args.cities) {
    queries.push({ citySlug, perPage: args.perPage });
    queries.push({ citySlug, perPage: args.perPage, page: 2 });
  }
  for (const stateCode of args.states) {
    queries.push({ stateCode, perPage: 12 });
  }
  return queries;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allFindings: ParityFinding[] = [];
  let comparedListings = 0;
  const perQuery: Array<{ label: string; findings: number; blocking: number }> = [];

  // ── Search parity ──────────────────────────────────────────────────────────
  for (const opts of buildQueries(args)) {
    const label = `search(${JSON.stringify(opts)})`;
    const unsupported = mirrorUnsupportedOptsFor(opts as Record<string, unknown>);

    let sharetribeResult = null;
    try {
      sharetribeResult = await searchListingsFromSharetribe(opts);
    } catch (err) {
      console.error(`  ! Sharetribe search failed for ${label}:`, (err as Error).message);
    }
    const mirrorResult = unsupported.length ? null : await searchListingsFromMirror(opts);

    const findings = diffSearchResult(sharetribeResult, mirrorResult, {
      unsupportedOpts: unsupported,
    });
    // Prefix so findings from different queries stay distinguishable.
    for (const f of findings) allFindings.push({ ...f, field: `${label} ${f.field}` });

    comparedListings += sharetribeResult?.listings.length ?? 0;
    perQuery.push({
      label,
      findings: findings.length,
      blocking: findings.filter((f) => f.severity === "blocking" || f.severity === "unsupported")
        .length,
    });
  }

  // ── Detail parity, over ids Sharetribe actually returns ────────────────────
  let detailIds: string[] = [];
  try {
    const sample = await searchListingsFromSharetribe({ perPage: args.listings });
    detailIds = sample.listings.map((l) => l.id).filter(Boolean);
  } catch (err) {
    console.error("  ! could not sample listing ids:", (err as Error).message);
  }

  const imageUrls: unknown[] = [];
  for (const id of detailIds) {
    const [legacy, mirror] = await Promise.all([fetchListing(id), fetchListingFromMirror(id)]);
    const st = legacy?.listing ?? null;
    if (st?.imageUrl) imageUrls.push(st.imageUrl);
    if (mirror && mirror.imageUrl) imageUrls.push(mirror.imageUrl);

    if (mirror === undefined) {
      allFindings.push({
        field: `listing(${id})`,
        severity: "blocking",
        code: "mirror-query-errored",
        sharetribe: st?.id ?? null,
        mirror: null,
        detail: "The mirror detail query errored for this listing.",
      });
      continue;
    }
    for (const f of diffListing(st, mirror, "")) {
      allFindings.push({ ...f, field: `listing(${id}) ${f.field}` });
    }
  }

  // ── Image durability summary ───────────────────────────────────────────────
  const facts = imageUrls.map((u) => classifyImageUrl(u));
  const sharetribeHosted = facts.filter((f) => f.diesWithSharetribe);
  const prnmHosted = facts.filter((f) => f.prnmHosted);
  const imageIds = sharetribeImageIds(imageUrls);

  const report = buildParityReport(
    `${perQuery.length} queries, ${detailIds.length} listing details`,
    comparedListings,
    allFindings,
  );

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          report,
          perQuery,
          images: {
            urlsSeen: imageUrls.length,
            sharetribeHosted: sharetribeHosted.length,
            prnmHosted: prnmHosted.length,
            distinctSharetribeImageIds: imageIds.length,
            imageIds,
          },
        },
        null,
        2,
      ),
    );
  } else {
    console.log(formatParityReport(report));
    console.log("");
    console.log("Per query:");
    for (const q of perQuery) {
      console.log(
        `  ${q.blocking > 0 ? "FAIL" : q.findings > 0 ? "warn" : "ok  "}  ` +
          `${String(q.findings).padStart(4)} findings  ${q.label}`,
      );
    }
    console.log("");
    console.log("Images:");
    const pct = imageUrls.length
      ? ((prnmHosted.length / imageUrls.length) * 100).toFixed(1)
      : "0.0";
    console.log(`  URLs seen:                          ${imageUrls.length}`);
    console.log(`  PRNM-hosted (survive cutover):      ${prnmHosted.length}  (${pct}%)`);
    console.log(`  Sharetribe-hosted (die at cutover): ${sharetribeHosted.length}`);
    console.log(`  Distinct Sharetribe image UUIDs:    ${imageIds.length}`);
    if (sharetribeHosted.length > 0) {
      console.log("  Those UUIDs are the Phase 1b worklist — the bytes are only fetchable while");
      console.log("  Sharetribe still serves them. Run: bun run rehost:images");
    }
  }

  const gate = report.bySeverity.blocking + report.bySeverity.unsupported;
  if (gate > 0) {
    console.error(
      `\n${gate} blocking/unsupported finding(s) — the mirror cannot serve these reads yet.`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("listing-parity-report failed:", err);
  process.exit(1);
});
