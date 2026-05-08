import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export type AuditLinkClass = "broken" | "redirected" | "other";

export type AuditLinkRow = {
  path: string;
  hits: number;
  status: number | null;
  reason: string;
  klass: AuditLinkClass;
  sources: Array<{ path: string; templateType: string | null }>;
  templateTypes: string[];
};

export type AuditDashboard = {
  generatedAt: string;
  runsConsidered: number;
  totalBrokenEntries: number;
  templateTypes: string[];
  rows: AuditLinkRow[];
};

const InputSchema = z.object({
  limit: z.number().int().min(10).max(500).default(100),
  /** how many recent runs to aggregate */
  runs: z.number().int().min(1).max(50).default(10),
  /** only return rows that have at least one source page of this template_type */
  templateType: z.string().min(1).max(60).optional(),
  /** filter by classification */
  klass: z.enum(["all", "broken", "redirected"]).default("all"),
});

function classify(status: number | null | undefined): AuditLinkClass {
  const s = Number(status ?? 0);
  if (s >= 300 && s < 400) return "redirected";
  if (s === 0 || s === 404 || s === 410 || (s >= 500 && s < 600)) return "broken";
  if (s >= 400 && s < 500) return "broken";
  return "other";
}

export const getLinkAuditDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<AuditDashboard> => {
    await assertAdmin((context as any).userId);
    const sb = supabaseAdmin as any;

    const { data: runs } = await sb
      .from("link_health_runs")
      .select("id, ran_at, broken")
      .order("ran_at", { ascending: false })
      .limit(data.runs);

    const runRows = (runs || []) as Array<{ id: string; ran_at: string; broken: any }>;

    // Aggregate per (path)
    type Agg = {
      path: string;
      hits: number;
      lastStatus: number | null;
      lastReason: string;
      sources: Set<string>;
    };
    const byPath = new Map<string, Agg>();

    for (const r of runRows) {
      const arr = Array.isArray(r.broken) ? r.broken : [];
      for (const b of arr) {
        const path = String(b?.path ?? "").trim();
        if (!path) continue;
        const key = path;
        const cur = byPath.get(key) || {
          path,
          hits: 0,
          lastStatus: null,
          lastReason: "",
          sources: new Set<string>(),
        };
        cur.hits += 1;
        cur.lastStatus = typeof b?.status === "number" ? b.status : cur.lastStatus;
        cur.lastReason = String(b?.reason ?? cur.lastReason ?? "");
        const src = String(b?.source ?? "").trim();
        if (src && src !== "(seed)") cur.sources.add(src);
        byPath.set(key, cur);
      }
    }

    // Resolve template_type for every distinct source page (limit lookups)
    const allSources = new Set<string>();
    for (const a of byPath.values()) for (const s of a.sources) allSources.add(s);
    const sourcePaths = Array.from(allSources).slice(0, 5000);

    const sourceMeta = new Map<string, string | null>(); // path -> template_type
    if (sourcePaths.length) {
      // Look up by url_path in chunks
      for (let i = 0; i < sourcePaths.length; i += 200) {
        const chunk = sourcePaths.slice(i, i + 200);
        const { data: pages } = await sb
          .from("content_pages")
          .select("url_path, template_type")
          .in("url_path", chunk);
        for (const p of (pages || []) as Array<{ url_path: string; template_type: string | null }>) {
          sourceMeta.set(p.url_path, p.template_type ?? null);
        }
      }
    }

    let totalBrokenEntries = 0;
    const allRows: AuditLinkRow[] = [];
    const allTemplateTypes = new Set<string>();

    for (const a of byPath.values()) {
      const klass = classify(a.lastStatus);
      const sources = Array.from(a.sources).map((p) => ({
        path: p,
        templateType: sourceMeta.get(p) ?? null,
      }));
      const templateTypes = Array.from(
        new Set(sources.map((s) => s.templateType).filter((t): t is string => !!t)),
      );
      for (const t of templateTypes) allTemplateTypes.add(t);
      totalBrokenEntries += a.hits;
      allRows.push({
        path: a.path,
        hits: a.hits,
        status: a.lastStatus,
        reason: a.lastReason,
        klass,
        sources,
        templateTypes,
      });
    }

    // Filter
    let filtered = allRows;
    if (data.klass !== "all") filtered = filtered.filter((r) => r.klass === data.klass);
    if (data.templateType) {
      const tt = data.templateType;
      filtered = filtered.filter((r) => r.templateTypes.includes(tt));
    }

    // Sort: hits desc, then path asc
    filtered.sort((a, b) => (b.hits - a.hits) || a.path.localeCompare(b.path));

    return {
      generatedAt: new Date().toISOString(),
      runsConsidered: runRows.length,
      totalBrokenEntries,
      templateTypes: Array.from(allTemplateTypes).sort(),
      rows: filtered.slice(0, data.limit),
    };
  });
