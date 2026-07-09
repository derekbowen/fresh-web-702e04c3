import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const TABLES = ["content_plan", "content_pages"];
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
function csvEscape(v) {
  if (v === null || v === void 0) return "";
  let s;
  if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(rows) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return head + "\n" + body;
}
const exportTable_createServerFn_handler = createServerRpc({
  id: "8ec52f704257d0a24eee1ce5ae9039e676ce015f215602c840c8d2ca6240f65e",
  name: "exportTable",
  filename: "src/server/admin-data-io.functions.ts"
}, (opts) => exportTable.__executeServer(opts));
const exportTable = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => {
  if (!TABLES.includes(d.table)) throw new Error("Invalid table");
  return d;
}).handler(exportTable_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const all = [];
  const pageSize = 1e3;
  let from = 0;
  while (true) {
    const {
      data: rows,
      error
    } = await supabaseAdmin.from(data.table).select("*").order("created_at", {
      ascending: true
    }).range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) break;
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return {
    csv: toCsv(all),
    rowCount: all.length,
    columns: all[0] ? Object.keys(all[0]) : []
  };
});
function parseCsv(text) {
  const rows = [];
  let row = [];
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
  return rows.filter((r) => r.length > 1 || r.length === 1 && r[0] !== "");
}
function coerceValue(raw, col) {
  if (raw === "") return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      return JSON.parse(trimmed);
    } catch {
    }
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return raw;
}
async function getTableColumns(table) {
  const {
    data,
    error
  } = await supabaseAdmin.from(table).select("*").limit(1);
  if (error) throw new Error(`Schema lookup failed: ${error.message}`);
  if (data && data.length > 0) return Object.keys(data[0]);
  return [];
}
function applyMapping(header, mapping) {
  const m = header.map((h) => {
    if (!mapping) return h;
    if (!(h in mapping)) return h;
    const v = mapping[h];
    return v && v.length > 0 ? v : null;
  });
  const effective = [];
  m.forEach((v) => {
    if (v) effective.push(v);
  });
  return {
    effective,
    map: m
  };
}
const previewImport_createServerFn_handler = createServerRpc({
  id: "a717a5d95a084d2805aa97e8eaee46426243ec90e90c4bf7a2cf1d26c4100377",
  name: "previewImport",
  filename: "src/server/admin-data-io.functions.ts"
}, (opts) => previewImport.__executeServer(opts));
const previewImport = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => {
  if (!TABLES.includes(d.table)) throw new Error("Invalid table");
  if (!d.csv) throw new Error("Empty CSV");
  if (d.csv.length > 25 * 1024 * 1024) throw new Error("CSV too large (>25MB)");
  return d;
}).handler(previewImport_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const parsed = parseCsv(data.csv);
  if (parsed.length < 2) throw new Error("CSV has no data rows");
  const header = parsed[0];
  const dataRows = parsed.slice(1);
  const tableCols = await getTableColumns(data.table);
  const knownCols = new Set(tableCols);
  const {
    effective: effectiveHeader,
    map: headerMap
  } = applyMapping(header, data.columnMapping);
  const unknownCols = tableCols.length > 0 ? effectiveHeader.filter((c) => !knownCols.has(c)) : [];
  const missingCols = tableCols.length > 0 ? tableCols.filter((c) => !effectiveHeader.includes(c)) : [];
  const conflictColumn = data.table === "content_plan" ? "slug" : "id";
  const conflictEffectiveIdx = effectiveHeader.indexOf(conflictColumn);
  const conflictCsvIdx = headerMap.findIndex((m) => m === conflictColumn);
  const conflictValues = [];
  if (conflictCsvIdx >= 0) {
    for (const r of dataRows) {
      const v = r[conflictCsvIdx];
      if (v) conflictValues.push(v);
    }
  }
  let existingCount = 0;
  if (conflictValues.length > 0) {
    const lookupChunk = 500;
    for (let i = 0; i < conflictValues.length; i += lookupChunk) {
      const slice = conflictValues.slice(i, i + lookupChunk);
      const {
        count
      } = await supabaseAdmin.from(data.table).select(conflictColumn, {
        count: "exact",
        head: true
      }).in(conflictColumn, slice);
      existingCount += count ?? 0;
    }
  }
  const sampleSize = Math.min(5, dataRows.length);
  const sample = dataRows.slice(0, sampleSize).map((r) => {
    const obj = {};
    headerMap.forEach((eff, i) => {
      if (!eff) return;
      obj[eff] = coerceValue(r[i] ?? "");
    });
    return obj;
  });
  return {
    totalRows: dataRows.length,
    header,
    effectiveHeader,
    tableColumns: tableCols,
    unknownColumns: unknownCols,
    missingColumns: missingCols,
    conflictColumn,
    hasConflictColumn: conflictEffectiveIdx >= 0,
    existingMatches: existingCount,
    newRowsEstimate: dataRows.length - existingCount,
    sample
  };
});
const importTable_createServerFn_handler = createServerRpc({
  id: "86c0d5d22d23d76931b7a9499f0aefa088e7598a5f90171665c66698e12bff85",
  name: "importTable",
  filename: "src/server/admin-data-io.functions.ts"
}, (opts) => importTable.__executeServer(opts));
const importTable = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => {
  if (!TABLES.includes(d.table)) throw new Error("Invalid table");
  if (!d.csv || d.csv.length === 0) throw new Error("Empty CSV");
  if (d.csv.length > 25 * 1024 * 1024) throw new Error("CSV too large (>25MB)");
  return d;
}).handler(importTable_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const parsed = parseCsv(data.csv);
  if (parsed.length < 2) throw new Error("CSV has no data rows");
  const header = parsed[0];
  const {
    map: headerMap0
  } = applyMapping(header, data.columnMapping);
  let headerMap = headerMap0;
  const tableCols = new Set(await getTableColumns(data.table));
  const knownSchema = tableCols.size > 0;
  const droppedColumns = [];
  if (data.ignoreUnknownColumns && knownSchema) {
    headerMap = headerMap.map((eff, i) => {
      if (eff && !tableCols.has(eff)) {
        droppedColumns.push(eff || header[i]);
        return null;
      }
      return eff;
    });
  } else {
    headerMap.forEach((eff, i) => {
      if (!eff) droppedColumns.push(header[i]);
    });
  }
  const effectiveHeader = [];
  headerMap.forEach((eff) => {
    if (eff) effectiveHeader.push(eff);
  });
  const rowErrors = [];
  const validRows = [];
  const validRowNumbers = [];
  const conflictColumn = data.conflictColumn || (data.table === "content_plan" ? "slug" : "id");
  const seenKeys = /* @__PURE__ */ new Map();
  parsed.slice(1).forEach((rawRow, idx) => {
    const csvRowNum = idx + 2;
    const obj = {};
    const issues = [];
    headerMap.forEach((col, i) => {
      if (!col) return;
      const raw = rawRow[i] ?? "";
      const trimmed = String(raw).trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          JSON.parse(trimmed);
        } catch {
          issues.push(`Invalid JSON in "${col}"`);
        }
      }
      obj[col] = coerceValue(raw);
    });
    if (effectiveHeader.includes(conflictColumn) && (obj[conflictColumn] === null || obj[conflictColumn] === "")) {
      issues.push(`Missing required "${conflictColumn}"`);
    }
    if (knownSchema) {
      for (const col of effectiveHeader) {
        if (!tableCols.has(col)) {
          issues.push(`Unknown column "${col}"`);
        }
      }
    }
    const keyVal = obj[conflictColumn];
    if (keyVal != null && keyVal !== "") {
      const prior = seenKeys.get(String(keyVal));
      if (prior !== void 0) {
        issues.push(`Duplicate "${conflictColumn}"="${keyVal}" (also on CSV row ${prior})`);
      } else {
        seenKeys.set(String(keyVal), csvRowNum);
      }
    }
    if (issues.length > 0) {
      rowErrors.push({
        row: csvRowNum,
        slug: keyVal != null ? String(keyVal) : void 0,
        reason: issues.join("; ")
      });
      return;
    }
    validRows.push(obj);
    validRowNumbers.push(csvRowNum);
  });
  if (data.dryRun) {
    return {
      dryRun: true,
      totalRows: parsed.length - 1,
      validRowCount: validRows.length,
      inserted: 0,
      rowErrors,
      chunkErrors: [],
      columns: effectiveHeader,
      droppedColumns
    };
  }
  const chunkSize = 500;
  let inserted = 0;
  const chunkErrors = [];
  const writeOne = async (row) => {
    const tbl = supabaseAdmin.from(data.table);
    const q = data.mode === "upsert" ? tbl.upsert([row], {
      onConflict: conflictColumn
    }) : tbl.insert([row]);
    return q;
  };
  for (let i = 0; i < validRows.length; i += chunkSize) {
    const chunk = validRows.slice(i, i + chunkSize);
    const chunkRowNums = validRowNumbers.slice(i, i + chunkSize);
    const tbl = supabaseAdmin.from(data.table);
    const q = data.mode === "upsert" ? tbl.upsert(chunk, {
      onConflict: conflictColumn
    }) : tbl.insert(chunk);
    const {
      error
    } = await q;
    if (!error) {
      inserted += chunk.length;
      continue;
    }
    for (let j = 0; j < chunk.length; j++) {
      const {
        error: rowErr
      } = await writeOne(chunk[j]);
      if (rowErr) {
        rowErrors.push({
          row: chunkRowNums[j],
          slug: chunk[j][conflictColumn] != null ? String(chunk[j][conflictColumn]) : void 0,
          reason: `DB: ${rowErr.message}`
        });
      } else {
        inserted++;
      }
    }
    chunkErrors.push(`Chunk rows ${chunkRowNums[0]}-${chunkRowNums[chunkRowNums.length - 1]} retried per-row: ${error.message}`);
  }
  return {
    dryRun: false,
    totalRows: parsed.length - 1,
    validRowCount: validRows.length,
    inserted,
    rowErrors,
    chunkErrors,
    columns: effectiveHeader,
    droppedColumns
  };
});
const getImportSchema_createServerFn_handler = createServerRpc({
  id: "9c54f877a8bb397df8cee4cecca63b33dad10f189978d03d056e3fad2644b23e",
  name: "getImportSchema",
  filename: "src/server/admin-data-io.functions.ts"
}, (opts) => getImportSchema.__executeServer(opts));
const getImportSchema = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => {
  if (!TABLES.includes(d.table)) throw new Error("Invalid table");
  return d;
}).handler(getImportSchema_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const tableColumns = await getTableColumns(data.table);
  const conflictColumn = data.table === "content_plan" ? "slug" : "id";
  return {
    tableColumns,
    conflictColumn
  };
});
const lookupExistingKeys_createServerFn_handler = createServerRpc({
  id: "1420b7be3e7eeedba6bd4fcf0cfbb88052ef0f5be697cdbbd173c3f1a2b32534",
  name: "lookupExistingKeys",
  filename: "src/server/admin-data-io.functions.ts"
}, (opts) => lookupExistingKeys.__executeServer(opts));
const lookupExistingKeys = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => {
  if (!TABLES.includes(d.table)) throw new Error("Invalid table");
  if (!Array.isArray(d.values)) throw new Error("values must be an array");
  if (d.values.length > 5e3) throw new Error("Too many keys (max 5000 per call)");
  return d;
}).handler(lookupExistingKeys_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  if (data.values.length === 0) return {
    existingCount: 0
  };
  const {
    count
  } = await supabaseAdmin.from(data.table).select(data.conflictColumn, {
    count: "exact",
    head: true
  }).in(data.conflictColumn, data.values);
  return {
    existingCount: count ?? 0
  };
});
const importTableRows_createServerFn_handler = createServerRpc({
  id: "2367840c643efe5074c61f17e21d25d61b5198cdcb733373adc6874491678f54",
  name: "importTableRows",
  filename: "src/server/admin-data-io.functions.ts"
}, (opts) => importTableRows.__executeServer(opts));
const importTableRows = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => {
  if (!TABLES.includes(d.table)) throw new Error("Invalid table");
  if (!Array.isArray(d.rows)) throw new Error("rows must be an array");
  if (d.rows.length === 0) throw new Error("rows is empty");
  if (d.rows.length > 500) throw new Error("Chunk too large (max 500 rows)");
  return d;
}).handler(importTableRows_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const conflictColumn = data.conflictColumn || (data.table === "content_plan" ? "slug" : "id");
  const rowNumbers = data.rowNumbers ?? data.rows.map((_, i) => i + 1);
  const rowErrors = [];
  let inserted = 0;
  const tbl = supabaseAdmin.from(data.table);
  const q = data.mode === "upsert" ? tbl.upsert(data.rows, {
    onConflict: conflictColumn
  }) : tbl.insert(data.rows);
  const {
    error
  } = await q;
  if (!error) {
    inserted = data.rows.length;
  } else {
    for (let j = 0; j < data.rows.length; j++) {
      const tbl2 = supabaseAdmin.from(data.table);
      const q2 = data.mode === "upsert" ? tbl2.upsert([data.rows[j]], {
        onConflict: conflictColumn
      }) : tbl2.insert([data.rows[j]]);
      const {
        error: rowErr
      } = await q2;
      if (rowErr) {
        const r = data.rows[j];
        rowErrors.push({
          row: rowNumbers[j],
          slug: r?.[conflictColumn] != null ? String(r[conflictColumn]) : void 0,
          reason: `DB: ${rowErr.message}`
        });
      } else {
        inserted++;
      }
    }
  }
  return {
    inserted,
    rowErrors,
    chunkError: error ? error.message : null
  };
});
export {
  exportTable_createServerFn_handler,
  getImportSchema_createServerFn_handler,
  importTableRows_createServerFn_handler,
  importTable_createServerFn_handler,
  lookupExistingKeys_createServerFn_handler,
  previewImport_createServerFn_handler
};
