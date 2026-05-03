/**
 * Normalize internal links in stored content to canonical /p/{slug} form.
 *
 * Scans:
 *   - content_pages.body_markdown
 *   - content_pages.raw_html
 *   - blog_posts.content
 *   - help_articles.content
 *
 * Replaces any href/src/markdown links targeting legacy multi-segment /p/...
 * paths with the canonical flat /p/{last-segment}.
 *
 * Usage:
 *   bun run scripts/normalize-internal-links.ts          # dry-run (default)
 *   bun run scripts/normalize-internal-links.ts --apply  # write changes
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Site origins that should be treated as internal when present in absolute URLs.
const INTERNAL_HOSTS = [
  "swimply.com",
  "www.swimply.com",
  "fresh-web.lovable.app",
];

/**
 * Given a /p/... path (with or without leading slash, may include query/hash),
 * return the canonical /p/{lastSegment} preserving query+hash.
 * Returns null when input is not a /p/... path or already canonical.
 */
function canonicalize(pPath: string): string | null {
  // Strip query/hash for processing, re-append later.
  const hashIdx = pPath.indexOf("#");
  const queryIdx = pPath.indexOf("?");
  const cut =
    hashIdx === -1 && queryIdx === -1
      ? pPath.length
      : Math.min(
          hashIdx === -1 ? Number.POSITIVE_INFINITY : hashIdx,
          queryIdx === -1 ? Number.POSITIVE_INFINITY : queryIdx,
        );
  const base = pPath.slice(0, cut);
  const suffix = pPath.slice(cut);

  if (!base.startsWith("/p/")) return null;
  const segments = base.slice(3).split("/").filter(Boolean);
  if (segments.length <= 1) return null; // already flat
  const last = segments[segments.length - 1];
  return `/p/${last}${suffix}`;
}

let totalReplacements = 0;

function rewrite(content: string): { next: string; count: number } {
  if (!content) return { next: content, count: 0 };
  let count = 0;

  // 1. Absolute URLs to known internal hosts pointing at /p/...
  const hostAlt = INTERNAL_HOSTS.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|");
  const absRe = new RegExp(
    `https?://(?:${hostAlt})(/p/[^\\s"'<>)]+)`,
    "gi",
  );
  let next = content.replace(absRe, (match, path) => {
    const canon = canonicalize(path);
    if (!canon) return match;
    count++;
    // Convert to root-relative — internal links should not carry the host.
    return canon;
  });

  // 2. Root-relative /p/... paths inside href/src attributes or markdown links.
  //    Match a leading delimiter so we don't rewrite mid-word occurrences.
  const relRe = /(["'(\s])(\/p\/[^\s"')<>]+)/g;
  next = next.replace(relRe, (match, lead, path) => {
    const canon = canonicalize(path);
    if (!canon) return match;
    count++;
    return `${lead}${canon}`;
  });

  return { next, count };
}

interface TableSpec {
  table: string;
  idCol: string;
  cols: string[];
  filter?: (q: any) => any;
}

const TABLES: TableSpec[] = [
  {
    table: "content_pages",
    idCol: "id",
    cols: ["body_markdown", "raw_html"],
  },
  { table: "blog_posts", idCol: "id", cols: ["content"] },
  { table: "help_articles", idCol: "id", cols: ["content"] },
];

async function processTable(spec: TableSpec) {
  console.log(`\n→ Scanning ${spec.table} (${spec.cols.join(", ")})`);
  const pageSize = 500;
  let from = 0;
  let scanned = 0;
  let updated = 0;

  // Build OR filter to only fetch rows where any target col mentions "/p/"
  const orClauses = spec.cols.map((c) => `${c}.ilike.%/p/%`).join(",");

  while (true) {
    const { data, error } = await supabase
      .from(spec.table)
      .select([spec.idCol, ...spec.cols].join(","))
      .or(orClauses)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`  ✗ ${spec.table} fetch failed:`, error.message);
      return;
    }
    if (!data || data.length === 0) break;

    for (const row of data as any[]) {
      scanned++;
      const patch: Record<string, string> = {};
      let rowCount = 0;
      for (const col of spec.cols) {
        const val: string | null = row[col];
        if (!val) continue;
        const { next, count } = rewrite(val);
        if (count > 0 && next !== val) {
          patch[col] = next;
          rowCount += count;
        }
      }
      if (rowCount > 0) {
        updated++;
        totalReplacements += rowCount;
        console.log(
          `  • ${spec.table} ${row[spec.idCol]}: ${rowCount} link(s) rewritten`,
        );
        if (APPLY) {
          const { error: upErr } = await supabase
            .from(spec.table)
            .update(patch)
            .eq(spec.idCol, row[spec.idCol]);
          if (upErr) {
            console.error(`    ✗ update failed: ${upErr.message}`);
          }
        }
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(
    `  scanned=${scanned} rowsChanged=${updated} ${APPLY ? "(applied)" : "(dry-run)"}`,
  );
}

async function main() {
  console.log(
    `Normalizing legacy /p/* links → /p/{slug}  [${APPLY ? "APPLY" : "DRY-RUN"}]`,
  );
  for (const spec of TABLES) {
    await processTable(spec);
  }
  console.log(
    `\nDone. total link replacements=${totalReplacements} ${APPLY ? "" : "(dry-run; pass --apply to write)"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
