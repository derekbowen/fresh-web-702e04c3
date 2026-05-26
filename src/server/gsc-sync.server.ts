import { supabaseAdmin } from "@/integrations/supabase/client.server";

type GscRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type GscSearchResponse = {
  rows?: GscRow[];
  responseAggregationType?: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

export type GscSyncOptions = {
  startDate?: string;
  endDate?: string;
  days?: number;
  rowLimit?: number;
  triggerSource?: "manual" | "cron";
};

export type GscSyncResult = {
  ok: boolean;
  runId: string | null;
  startDate: string;
  endDate: string;
  siteUrl: string;
  pagesSynced: number;
  queriesSynced: number;
  contentPagesUpdated: number;
  error?: string;
  missingSecrets?: string[];
};

const DEFAULT_SITE_URL = "sc-domain:poolrentalnearme.com";
const GATEWAY_BASE = "https://connector-gateway.lovable.dev/google_search_console";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function resolveDateRange(options: GscSyncOptions): { startDate: string; endDate: string } {
  if (options.startDate && options.endDate) return { startDate: options.startDate, endDate: options.endDate };
  const days = Math.min(Math.max(options.days ?? 3, 1), 30);
  const end = new Date(Date.now() - 2 * 86400_000);
  const start = new Date(end.getTime() - (days - 1) * 86400_000);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function checkGatewayCreds(): { ok: boolean; missingSecrets?: string[] } {
  const missing: string[] = [];
  if (!process.env.LOVABLE_API_KEY) missing.push("LOVABLE_API_KEY");
  if (!process.env.GOOGLE_SEARCH_CONSOLE_API_KEY) missing.push("GOOGLE_SEARCH_CONSOLE_API_KEY");
  return missing.length ? { ok: false, missingSecrets: missing } : { ok: true };
}

function normalizeUrlPath(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    if (raw.startsWith("/")) return raw.replace(/\/$/, "") || "/";
    const url = new URL(raw);
    return `${url.pathname.replace(/\/$/, "") || "/"}${url.search || ""}`;
  } catch {
    return null;
  }
}

async function fetchSearchAnalytics(
  siteUrl: string,
  body: Record<string, unknown>,
  maxRows: number,
): Promise<GscRow[]> {
  const rows: GscRow[] = [];
  const pageSize = Math.min(Math.max(Number(body.rowLimit || 25000), 1), 25000);
  const url = `${GATEWAY_BASE}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  for (let startRow = 0; startRow < maxRows; startRow += pageSize) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": process.env.GOOGLE_SEARCH_CONSOLE_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, rowLimit: pageSize, startRow }),
    });
    const json = (await res.json().catch(() => ({}))) as GscSearchResponse & { error?: { message?: string } };
    if (!res.ok) {
      throw new Error(json?.error?.message || `Search Console gateway request failed (${res.status})`);
    }
    const batch = Array.isArray(json.rows) ? json.rows : [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}


async function upsertInChunks(table: string, rows: any[], onConflict: string): Promise<number> {
  let synced = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000);
    const { error } = await (supabaseAdmin as any)
      .from(table)
      .upsert(chunk, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    synced += chunk.length;
  }
  return synced;
}

async function updateContentPagesFromDaily(pageRows: Array<{ url_path: string; clicks: number; impressions: number; position: number | null }>) {
  const byPath = new Map<string, { clicks: number; impressions: number; weightedPosition: number; positionWeight: number }>();
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
  const now = new Date().toISOString();
  for (const [url_path, agg] of byPath.entries()) {
    const { count, error } = await (supabaseAdmin as any)
      .from("content_pages")
      .update({
        gsc_clicks: agg.clicks,
        gsc_impressions: agg.impressions,
        gsc_position: agg.positionWeight ? agg.weightedPosition / agg.positionWeight : null,
        gsc_updated_at: now,
      }, { count: "exact" })
      .eq("url_path", url_path);
    if (!error && (count ?? 0) > 0) updated += count ?? 0;
  }
  return updated;
}

export async function runGscSync(options: GscSyncOptions = {}): Promise<GscSyncResult> {
  const { startDate, endDate } = resolveDateRange(options);
  const rowLimit = Math.min(Math.max(options.rowLimit ?? 25000, 100), 100000);
  const siteUrl = process.env.GSC_SITE_URL || DEFAULT_SITE_URL;
  const sb = supabaseAdmin as any;

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
      error: `Missing required secret: ${(creds.missingSecrets || []).join(", ")}`,
    };
  }

  const { data: run, error: runError } = await sb
    .from("gsc_sync_runs")
    .insert({ status: "running", start_date: startDate, end_date: endDate, trigger_source: options.triggerSource || "manual" })
    .select("id")
    .single();
  if (runError) throw new Error(`Could not create GSC sync run: ${runError.message}`);
  const runId = run.id as string;

  try {
    const token = await getAccessToken(parsed.account);
    const capturedAt = new Date().toISOString();

    const pageApiRows = await fetchSearchAnalytics(token, siteUrl, {
      startDate,
      endDate,
      dimensions: ["page", "date"],
      dataState: "final",
      rowLimit,
    }, rowLimit);

    const dailyRows = pageApiRows
      .map((row) => {
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
          captured_at: capturedAt,
        };
      })
      .filter(Boolean) as Array<{ url_path: string; date: string; clicks: number; impressions: number; ctr: number | null; position: number | null; captured_at: string }>;

    const pagesSynced = await upsertInChunks("gsc_daily_pages", dailyRows, "url_path,date");
    const contentPagesUpdated = await updateContentPagesFromDaily(dailyRows);

    const queryApiRows = await fetchSearchAnalytics(token, siteUrl, {
      startDate,
      endDate,
      dimensions: ["page", "query"],
      dataState: "final",
      rowLimit,
    }, rowLimit);

    const queryRows = queryApiRows
      .map((row) => {
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
          captured_at: capturedAt,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    const queriesSynced = await upsertInChunks("gsc_query_data", queryRows, "url_path,query");

    await sb
      .from("gsc_sync_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        pages_synced: pagesSynced,
        queries_synced: queriesSynced,
      })
      .eq("id", runId);

    return { ok: true, runId, startDate, endDate, siteUrl, pagesSynced, queriesSynced, contentPagesUpdated };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await sb
      .from("gsc_sync_runs")
      .update({ status: "error", finished_at: new Date().toISOString(), error })
      .eq("id", runId);
    return { ok: false, runId, startDate, endDate, siteUrl, pagesSynced: 0, queriesSynced: 0, contentPagesUpdated: 0, error };
  }
}

export async function getGscSyncOverview() {
  const sb = supabaseAdmin as any;
  const [{ data: latestRun }, { count: dailyCount }, { count: queryCount }] = await Promise.all([
    sb.from("gsc_sync_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("gsc_daily_pages").select("*", { count: "exact", head: true }),
    sb.from("gsc_query_data").select("*", { count: "exact", head: true }),
  ]);

  return {
    latestRun: latestRun || null,
    dailyRows: dailyCount || 0,
    queryRows: queryCount || 0,
    siteUrl: process.env.GSC_SITE_URL || DEFAULT_SITE_URL,
    configured: Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON),
  };
}
