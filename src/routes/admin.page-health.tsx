import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import {
  getPageHealthReport,
  getCannibalizationReport,
  type PageHealthReport,
  type PageHealthRow,
  type CannibalReport,
} from "@/lib/page-health.functions";

export const Route = createFileRoute("/admin/page-health")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" as never });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/admin/no-access" });
  },
  component: PageHealthPage,
  head: () => ({ meta: [{ title: "Page health — Admin" }] }),
});

type SortKey =
  | "health_score"
  | "clicks_28d"
  | "impressions_28d"
  | "position_28d"
  | "clicks_delta_pct"
  | "word_count"
  | "days_since_refresh";

type FilterKey =
  | "all"
  | "decaying"
  | "striking-distance"
  | "zero-click"
  | "stale"
  | "thin"
  | "no-hero"
  | "missing-meta"
  | "not-in-sitemap";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "decaying", label: "Decaying" },
  { key: "striking-distance", label: "Striking distance (8-20)" },
  { key: "zero-click", label: "Zero click" },
  { key: "stale", label: "Stale (90d+)" },
  { key: "thin", label: "Thin (<500w)" },
  { key: "no-hero", label: "No hero" },
  { key: "missing-meta", label: "Missing meta" },
  { key: "not-in-sitemap", label: "Not in sitemap" },
];

function PageHealthPage() {
  const [tab, setTab] = useState<"pages" | "cannibal">("pages");
  const [report, setReport] = useState<PageHealthReport | null>(null);
  const [cannibal, setCannibal] = useState<CannibalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("health_score");
  const [sortAsc, setSortAsc] = useState(true);
  const [templateFilter, setTemplateFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [r, c] = await Promise.all([
        getPageHealthReport({ data: { limit: 3000 } }),
        getCannibalizationReport({
          data: { minImpressions: 50, minPagesPerQuery: 2, limit: 200 },
        }),
      ]);
      setReport(r);
      setCannibal(c);
      if (r.error) setErr(r.error);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const templates = useMemo(() => {
    const set = new Set<string>();
    report?.rows.forEach((r) => r.template_type && set.add(r.template_type));
    return Array.from(set).sort();
  }, [report]);

  const visible = useMemo(() => {
    if (!report) return [] as PageHealthRow[];
    let rows = report.rows.slice();
    if (filter !== "all") rows = rows.filter((r) => r.badges.includes(filter));
    if (templateFilter !== "all")
      rows = rows.filter((r) => r.template_type === templateFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => r.url_path.toLowerCase().includes(q));
    }
    rows.sort((a, b) => {
      const av = (a[sortKey] ?? -Infinity) as number;
      const bv = (b[sortKey] ?? -Infinity) as number;
      return sortAsc ? av - bv : bv - av;
    });
    return rows.slice(0, 500);
  }, [report, filter, templateFilter, search, sortKey, sortAsc]);

  const totals = useMemo(() => {
    if (!report) return null;
    const r = report.rows;
    return {
      pages: r.length,
      avgScore:
        r.length > 0
          ? Math.round(r.reduce((s, x) => s + x.health_score, 0) / r.length)
          : 0,
      stale: r.filter((x) => x.badges.includes("stale")).length,
      decaying: r.filter((x) => x.badges.includes("decaying")).length,
      striking: r.filter((x) => x.badges.includes("striking-distance")).length,
      thin: r.filter((x) => x.badges.includes("thin")).length,
      noHero: r.filter((x) => x.badges.includes("no-hero")).length,
      missingMeta: r.filter((x) => x.badges.includes("missing-meta")).length,
      totalClicks: r.reduce((s, x) => s + x.clicks_28d, 0),
      totalImpressions: r.reduce((s, x) => s + x.impressions_28d, 0),
    };
  }, [report]);

  const exportCsv = () => {
    if (!report) return;
    const cols: (keyof PageHealthRow)[] = [
      "url_path",
      "template_type",
      "health_score",
      "clicks_28d",
      "impressions_28d",
      "ctr_28d",
      "position_28d",
      "clicks_delta_pct",
      "word_count",
      "days_since_refresh",
      "in_sitemap",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      cols.join(","),
      ...report.rows.map((r) => cols.map((c) => esc(r[c])).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `page-health-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function sortBtn(label: string, key: SortKey) {
    const active = sortKey === key;
    return (
      <button
        onClick={() => {
          if (active) setSortAsc(!sortAsc);
          else {
            setSortKey(key);
            setSortAsc(false);
          }
        }}
        className={`text-left ${active ? "font-semibold text-primary" : ""}`}
      >
        {label}
        {active ? (sortAsc ? " ↑" : " ↓") : ""}
      </button>
    );
  }

  return (
    <AdminLayout title="Page health">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("pages")}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                tab === "pages" ? "bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setTab("cannibal")}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                tab === "cannibal"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background"
              }`}
            >
              Cannibalization
              {cannibal ? (
                <span className="ml-2 opacity-70">({cannibal.groups.length})</span>
              ) : null}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-1.5 rounded-md text-sm border"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            {tab === "pages" ? (
              <button
                onClick={exportCsv}
                disabled={!report}
                className="px-3 py-1.5 rounded-md text-sm border"
              >
                Export CSV
              </button>
            ) : null}
          </div>
        </div>

        {err ? (
          <div className="p-3 rounded-md border border-destructive text-destructive text-sm">
            {err}
          </div>
        ) : null}

        {tab === "pages" ? (
          <>
            {totals ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Pages" value={totals.pages} />
                <Stat label="Avg health score" value={`${totals.avgScore}/100`} />
                <Stat label="Clicks (28d)" value={totals.totalClicks.toLocaleString()} />
                <Stat
                  label="Impressions (28d)"
                  value={totals.totalImpressions.toLocaleString()}
                />
                <Stat label="Decaying" value={totals.decaying} tone="warn" />
                <Stat label="Striking distance" value={totals.striking} tone="ok" />
                <Stat label="Stale (90d+)" value={totals.stale} tone="warn" />
                <Stat label="Thin (<500w)" value={totals.thin} tone="warn" />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 rounded-md text-xs border ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Filter by URL path…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1.5 rounded-md border text-sm flex-1 min-w-[200px]"
              />
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-md border text-sm"
              >
                <option value="all">All templates</option>
                {templates.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-2">{sortBtn("Score", "health_score")}</th>
                    <th className="p-2">URL</th>
                    <th className="p-2 text-right">
                      {sortBtn("Clicks 28d", "clicks_28d")}
                    </th>
                    <th className="p-2 text-right">
                      {sortBtn("Impr 28d", "impressions_28d")}
                    </th>
                    <th className="p-2 text-right">
                      {sortBtn("Pos", "position_28d")}
                    </th>
                    <th className="p-2 text-right">
                      {sortBtn("Δ clicks", "clicks_delta_pct")}
                    </th>
                    <th className="p-2 text-right">
                      {sortBtn("Words", "word_count")}
                    </th>
                    <th className="p-2 text-right">
                      {sortBtn("Age", "days_since_refresh")}
                    </th>
                    <th className="p-2">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.url_path} className="border-t">
                      <td className="p-2">
                        <ScoreBadge score={r.health_score} />
                      </td>
                      <td className="p-2 max-w-[320px]">
                        <a
                          href={r.url_path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline truncate block"
                        >
                          {r.url_path}
                        </a>
                        <div className="text-xs text-muted-foreground">
                          {r.template_type ?? "—"} · {r.locale}
                        </div>
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {r.clicks_28d.toLocaleString()}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {r.impressions_28d.toLocaleString()}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {r.position_28d != null ? r.position_28d.toFixed(1) : "—"}
                      </td>
                      <td
                        className={`p-2 text-right tabular-nums ${
                          r.clicks_delta_pct != null && r.clicks_delta_pct < 0
                            ? "text-destructive"
                            : r.clicks_delta_pct != null && r.clicks_delta_pct > 0
                              ? "text-emerald-600"
                              : ""
                        }`}
                      >
                        {r.clicks_delta_pct != null
                          ? `${r.clicks_delta_pct > 0 ? "+" : ""}${r.clicks_delta_pct.toFixed(0)}%`
                          : "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums">{r.word_count}</td>
                      <td className="p-2 text-right tabular-nums">
                        {r.days_since_refresh != null
                          ? `${r.days_since_refresh}d`
                          : "—"}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {r.badges.map((b) => (
                            <span
                              key={b}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted border"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-muted-foreground">
                        No pages match these filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {report && report.rows.length > 500 ? (
              <div className="text-xs text-muted-foreground">
                Showing top 500 of {report.rows.length} pages. Tighten filters to see
                more.
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Queries with multiple URLs ranking in the last 28 days. Consider
              merging, redirecting, or differentiating intent.
            </p>
            {cannibal?.groups.map((g) => (
              <div key={g.query} className="border rounded-md">
                <div className="p-3 flex items-center justify-between bg-muted/30">
                  <div>
                    <div className="font-medium">{g.query}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.pages.length} pages · {g.total_impressions.toLocaleString()}{" "}
                      impressions · {g.total_clicks.toLocaleString()} clicks
                    </div>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {g.pages.map((p) => (
                      <tr key={p.url_path} className="border-t">
                        <td className="p-2">
                          <a
                            href={p.url_path}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            {p.url_path}
                          </a>
                        </td>
                        <td className="p-2 text-right tabular-nums w-24">
                          {p.clicks} clicks
                        </td>
                        <td className="p-2 text-right tabular-nums w-32">
                          {p.impressions.toLocaleString()} impr
                        </td>
                        <td className="p-2 text-right tabular-nums w-20">
                          pos {p.position != null ? p.position.toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {cannibal && cannibal.groups.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground border rounded-md">
                No cannibalization groups detected. (Needs GSC query data —
                run the GSC sync first.)
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-xl font-semibold ${
          tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : score >= 60
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-red-100 text-red-800 border-red-300";
  return (
    <span
      className={`inline-flex items-center justify-center w-12 h-7 rounded text-xs font-semibold border ${tone}`}
    >
      {score}
    </span>
  );
}
