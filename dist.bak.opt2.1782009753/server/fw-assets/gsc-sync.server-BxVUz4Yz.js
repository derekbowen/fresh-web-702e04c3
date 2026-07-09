import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
const DEFAULT_SITE_URL = "sc-domain:poolrentalnearme.com";
const GATEWAY_BASE = "https://connector-gateway.lovable.dev/google_search_console";
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function resolveDateRange(options) {
  if (options.startDate && options.endDate) return { startDate: options.startDate, endDate: options.endDate };
  const days = Math.min(Math.max(options.days ?? 3, 1), 30);
  const end = new Date(Date.now() - 2 * 864e5);
  const start = new Date(end.getTime() - (days - 1) * 864e5);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}
function checkGatewayCreds() {
  const missing = [];
  if (!process.env.LOVABLE_API_KEY) missing.push("LOVABLE_API_KEY");
  if (!process.env.GOOGLE_SEARCH_CONSOLE_API_KEY) missing.push("GOOGLE_SEARCH_CONSOLE_API_KEY");
  return missing.length ? { ok: false, missingSecrets: missing } : { ok: true };
}
function normalizeUrlPath(raw) {
  if (!raw) return null;
  try {
    if (raw.startsWith("/")) return raw.replace(/\/$/, "") || "/";
    const url = new URL(raw);
    return `${url.pathname.replace(/\/$/, "") || "/"}${url.search || ""}`;
  } catch {
    return null;
  }
}
async function fetchSearchAnalytics(siteUrl, body, maxRows) {
  const rows = [];
  const pageSize = Math.min(Math.max(Number(body.rowLimit || 25e3), 1), 25e3);
  const url = `${GATEWAY_BASE}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  for (let startRow = 0; startRow < maxRows; startRow += pageSize) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": process.env.GOOGLE_SEARCH_CONSOLE_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ...body, rowLimit: pageSize, startRow })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error?.message || `Search Console gateway request failed (${res.status})`);
    }
    const batch = Array.isArray(json.rows) ? json.rows : [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}
async function upsertInChunks(table, rows, onConflict) {
  let synced = 0;
  for (let i = 0; i < rows.length; i += 1e3) {
    const chunk = rows.slice(i, i + 1e3);
    const { error } = await supabaseAdmin.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    synced += chunk.length;
  }
  return synced;
}
async function updateContentPagesFromDaily(pageRows) {
  const byPath = /* @__PURE__ */ new Map();
  for (const row of pageRows) {
    if (!row.url_path.startsWith("/p/")) continue;
    const cur = byPath.get(row.url_path) || { clicks: 0, impressions: 0, weightedPosition: 0, positionWeight: 0 };
    cur.clicks += row.clicks;
    cur.impressions += row.impressions;
    if (row.position != null && row.impressions > 0) {
      cur.weightedPosition += row.position * row.impressions;
      cur.positionWeight += row.impressions;
    }
    byPath.set(row.url_path, cur);
  }
  let updated = 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const [url_path, agg] of byPath.entries()) {
    const { count, error } = await supabaseAdmin.from("content_pages").update({
      gsc_clicks: agg.clicks,
      gsc_impressions: agg.impressions,
      gsc_position: agg.positionWeight ? agg.weightedPosition / agg.positionWeight : null,
      gsc_updated_at: now
    }, { count: "exact" }).eq("url_path", url_path);
    if (!error && (count ?? 0) > 0) updated += count ?? 0;
  }
  return updated;
}
async function runGscSync(options = {}) {
  const { startDate, endDate } = resolveDateRange(options);
  const rowLimit = Math.min(Math.max(options.rowLimit ?? 25e3, 100), 1e5);
  const siteUrl = process.env.GSC_SITE_URL || DEFAULT_SITE_URL;
  const sb = supabaseAdmin;
  const creds = checkGatewayCreds();
  if (!creds.ok) {
    return {
      ok: false,
      runId: null,
      startDate,
      endDate,
      siteUrl,
      pagesSynced: 0,
      queriesSynced: 0,
      contentPagesUpdated: 0,
      missingSecrets: creds.missingSecrets,
      error: `Missing required secret: ${(creds.missingSecrets || []).join(", ")}`
    };
  }
  const { data: run, error: runError } = await sb.from("gsc_sync_runs").insert({ status: "running", start_date: startDate, end_date: endDate, trigger_source: options.triggerSource || "manual" }).select("id").single();
  if (runError) throw new Error(`Could not create GSC sync run: ${runError.message}`);
  const runId = run.id;
  try {
    const capturedAt = (/* @__PURE__ */ new Date()).toISOString();
    const pageApiRows = await fetchSearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ["page", "date"],
      dataState: "final",
      rowLimit
    }, rowLimit);
    const dailyRows = pageApiRows.map((row) => {
      const url_path = normalizeUrlPath(row.keys?.[0]);
      const date = row.keys?.[1];
      if (!url_path || !date) return null;
      return {
        url_path,
        date,
        clicks: Math.round(row.clicks || 0),
        impressions: Math.round(row.impressions || 0),
        ctr: row.ctr ?? null,
        position: row.position ?? null,
        captured_at: capturedAt
      };
    }).filter(Boolean);
    const pagesSynced = await upsertInChunks("gsc_daily_pages", dailyRows, "url_path,date");
    const contentPagesUpdated = await updateContentPagesFromDaily(dailyRows);
    const queryApiRows = await fetchSearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ["page", "query"],
      dataState: "final",
      rowLimit
    }, rowLimit);
    const queryRows = queryApiRows.map((row) => {
      const url_path = normalizeUrlPath(row.keys?.[0]);
      const query = row.keys?.[1]?.trim();
      if (!url_path || !query) return null;
      return {
        url_path,
        query: query.slice(0, 300),
        clicks: Math.round(row.clicks || 0),
        impressions: Math.round(row.impressions || 0),
        ctr: row.ctr ?? null,
        position: row.position ?? null,
        captured_at: capturedAt
      };
    }).filter(Boolean);
    const queriesSynced = await upsertInChunks("gsc_query_data", queryRows, "url_path,query");
    await sb.from("gsc_sync_runs").update({
      status: "success",
      finished_at: (/* @__PURE__ */ new Date()).toISOString(),
      pages_synced: pagesSynced,
      queries_synced: queriesSynced
    }).eq("id", runId);
    return { ok: true, runId, startDate, endDate, siteUrl, pagesSynced, queriesSynced, contentPagesUpdated };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await sb.from("gsc_sync_runs").update({ status: "error", finished_at: (/* @__PURE__ */ new Date()).toISOString(), error }).eq("id", runId);
    return { ok: false, runId, startDate, endDate, siteUrl, pagesSynced: 0, queriesSynced: 0, contentPagesUpdated: 0, error };
  }
}
async function getGscSyncOverview() {
  const sb = supabaseAdmin;
  const [{ data: latestRun }, { count: dailyCount }, { count: queryCount }] = await Promise.all([
    sb.from("gsc_sync_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("gsc_daily_pages").select("*", { count: "exact", head: true }),
    sb.from("gsc_query_data").select("*", { count: "exact", head: true })
  ]);
  return {
    latestRun: latestRun || null,
    dailyRows: dailyCount || 0,
    queryRows: queryCount || 0,
    siteUrl: process.env.GSC_SITE_URL || DEFAULT_SITE_URL,
    configured: Boolean(process.env.LOVABLE_API_KEY && process.env.GOOGLE_SEARCH_CONSOLE_API_KEY)
  };
}
export {
  getGscSyncOverview as g,
  runGscSync as r
};
