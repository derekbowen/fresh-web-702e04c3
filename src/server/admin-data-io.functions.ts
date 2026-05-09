import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TABLES = ["content_plan", "content_pages"] as const;
type TableName = (typeof TABLES)[number];

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const head = cols.join(",");
  const body = rows
    .map((r) => cols.map((c) => csvEscape(r[c])).join(","))
    .join("\n");
  return head + "\n" + body;
}

export const exportTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: TableName }) => {
    if (!TABLES.includes(d.table)) throw new Error("Invalid table");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);

    const all: Record<string, unknown>[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data: rows, error } = await supabaseAdmin
        .from(data.table)
        .select("*")
        .order("created_at", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) break;
      all.push(...(rows as Record<string, unknown>[]));
      if (rows.length < pageSize) break;
      from += pageSize;
    }

    return { csv: toCsv(all), rowCount: all.length, columns: all[0] ? Object.keys(all[0]) : [] };
  });

// Minimal CSV parser (handles quoted fields, escaped quotes, CR/LF)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        cur = "";
        rows.push(row);
        row = [];
      } else cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

function coerceValue(raw: string, col: string): unknown {
  if (raw === "") return null;
  // jsonb / array columns: try JSON first
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through
    }
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return raw;
}

async function getTableColumns(table: TableName): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .limit(1);
  if (error) throw new Error(`Schema lookup failed: ${error.message}`);
  if (data && data.length > 0) return Object.keys(data[0] as object);
  // Fall back to inserting nothing — column discovery only works with a sample row
  return [];
}

export const previewImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: TableName; csv: string }) => {
    if (!TABLES.includes(d.table)) throw new Error("Invalid table");
    if (!d.csv) throw new Error("Empty CSV");
    if (d.csv.length > 25 * 1024 * 1024) throw new Error("CSV too large (>25MB)");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);

    const parsed = parseCsv(data.csv);
    if (parsed.length < 2) throw new Error("CSV has no data rows");
    const header = parsed[0];
    const dataRows = parsed.slice(1);

    const tableCols = await getTableColumns(data.table);
    const knownCols = new Set(tableCols);
    const unknownCols = tableCols.length > 0
      ? header.filter((c) => !knownCols.has(c))
      : [];
    const missingCols = tableCols.length > 0
      ? tableCols.filter((c) => !header.includes(c))
      : [];

    const conflictColumn = data.table === "content_plan" ? "slug" : "id";
    const conflictIdx = header.indexOf(conflictColumn);
    const conflictValues: string[] = [];
    if (conflictIdx >= 0) {
      for (const r of dataRows) {
        const v = r[conflictIdx];
        if (v) conflictValues.push(v);
      }
    }

    let existingCount = 0;
    if (conflictValues.length > 0) {
      // Chunk lookups to avoid query-size limits
      const lookupChunk = 500;
      for (let i = 0; i < conflictValues.length; i += lookupChunk) {
        const slice = conflictValues.slice(i, i + lookupChunk);
        const { count } = await supabaseAdmin
          .from(data.table)
          .select(conflictColumn, { count: "exact", head: true })
          .in(conflictColumn, slice);
        existingCount += count ?? 0;
      }
    }

    const sampleSize = Math.min(5, dataRows.length);
    const sample = dataRows.slice(0, sampleSize).map((r) => {
      const obj: Record<string, any> = {};
      header.forEach((col, i) => {
        obj[col] = coerceValue(r[i] ?? "", col);
      });
      return obj;
    });

    return {
      totalRows: dataRows.length,
      header,
      tableColumns: tableCols,
      unknownColumns: unknownCols,
      missingColumns: missingCols,
      conflictColumn,
      hasConflictColumn: conflictIdx >= 0,
      existingMatches: existingCount,
      newRowsEstimate: dataRows.length - existingCount,
      sample,
    };
  });

export const importTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      table: TableName;
      csv: string;
      mode: "upsert" | "insert";
      conflictColumn?: string;
      dryRun?: boolean;
      ignoreUnknownColumns?: boolean;
    }) => {
      if (!TABLES.includes(d.table)) throw new Error("Invalid table");
      if (!d.csv || d.csv.length === 0) throw new Error("Empty CSV");
      if (d.csv.length > 25 * 1024 * 1024) throw new Error("CSV too large (>25MB)");
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);

    const parsed = parseCsv(data.csv);
    if (parsed.length < 2) throw new Error("CSV has no data rows");
    const header = parsed[0];

    let effectiveHeader = header;
    let dropIdx: Set<number> = new Set();
    if (data.ignoreUnknownColumns) {
      const tableCols = new Set(await getTableColumns(data.table));
      if (tableCols.size > 0) {
        header.forEach((c, i) => {
          if (!tableCols.has(c)) dropIdx.add(i);
        });
        effectiveHeader = header.filter((_, i) => !dropIdx.has(i));
      }
    }

    const rows = parsed.slice(1).map((r) => {
      const obj: Record<string, any> = {};
      effectiveHeader.forEach((col) => {
        const i = header.indexOf(col);
        obj[col] = coerceValue(r[i] ?? "", col);
      });
      return obj;
    });

    const conflictColumn =
      data.conflictColumn || (data.table === "content_plan" ? "slug" : "id");

    if (data.dryRun) {
      return {
        dryRun: true,
        totalRows: rows.length,
        inserted: 0,
        errors: [] as string[],
        columns: effectiveHeader,
        droppedColumns: header.filter((_, i) => dropIdx.has(i)),
      };
    }

    const chunkSize = 500;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const tbl = supabaseAdmin.from(data.table) as any;
      const q =
        data.mode === "upsert"
          ? tbl.upsert(chunk, { onConflict: conflictColumn })
          : tbl.insert(chunk);
      const { error } = await q;
      if (error) {
        errors.push(`Rows ${i + 1}-${i + chunk.length}: ${error.message}`);
      } else {
        inserted += chunk.length;
      }
    }

    return {
      dryRun: false,
      totalRows: rows.length,
      inserted,
      errors,
      columns: effectiveHeader,
      droppedColumns: header.filter((_, i) => dropIdx.has(i)),
    };
  });

