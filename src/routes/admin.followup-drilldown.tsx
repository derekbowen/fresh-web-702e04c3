import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { AdminLayout } from "@/components/admin-layout";
import { getFollowupDrilldown, type DrilldownItem } from "@/lib/followup-analytics.functions";

const searchSchema = z.object({
  source: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  rangeDays: z.coerce.number().int().min(1).max(365).default(90),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});

export const Route = createFileRoute("/admin/followup-drilldown")({
  validateSearch: zodValidator(searchSchema),
  component: FollowupDrilldownPage,
});

function fmtDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
}

function statusColor(status: string) {
  switch (status) {
    case "converted": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "connected": return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
    case "attempting": return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "not_interested":
    case "do_not_contact": return "bg-red-500/15 text-red-700 dark:text-red-300";
    case "no_response": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-foreground";
  }
}

function FollowupDrilldownPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/followup-drilldown" });
  const fetchDrill = useServerFn(getFollowupDrilldown);

  const { data, isLoading, error } = useQuery({
    queryKey: ["followup-drilldown", search],
    queryFn: () => fetchDrill({ data: {
      source: search.source ?? null,
      city: search.city ?? null,
      region: search.region ?? null,
      rangeDays: search.rangeDays,
      page: search.page,
      pageSize: search.pageSize,
    } }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const filterChips: Array<{ key: "source" | "city" | "region"; label: string }> = [];
  if (search.source) filterChips.push({ key: "source", label: `Source: ${search.source}` });
  if (search.city) filterChips.push({ key: "city", label: `City: ${search.city}` });
  if (search.region) filterChips.push({ key: "region", label: `Region: ${search.region}` });

  return (
    <AdminLayout title="Follow-up drilldown">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Follow-up drilldown</h1>
            <p className="text-sm text-muted-foreground">
              Filtered list of follow-ups with status, outcome, and AI score. Last {search.rangeDays} days.
            </p>
          </div>
          <Link
            to="/admin/followup-performance"
            className="text-sm text-primary hover:underline"
          >
            ← Back to performance
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterChips.length === 0 && (
            <span className="text-xs text-muted-foreground">All follow-ups</span>
          )}
          {filterChips.map((c) => (
            <button
              key={c.key}
              onClick={() => navigate({ search: (p) => ({ ...p, [c.key]: undefined, page: 1 }) })}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-muted"
            >
              {c.label} ✕
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load: {(error as Error).message}
          </div>
        )}
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

        {data && (
          <>
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Lead</th>
                    <th className="px-3 py-2 text-left">Source</th>
                    <th className="px-3 py-2 text-left">City</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Last outcome</th>
                    <th className="px-3 py-2 text-right">AI score</th>
                    <th className="px-3 py-2 text-right">Touches</th>
                    <th className="px-3 py-2 text-right">Last touch</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No follow-ups match.</td></tr>
                  )}
                  {data.items.map((it) => (
                    <Row key={it.id} it={it} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {data.total.toLocaleString()} total • page {data.page} of {totalPages}
              </div>
              <div className="flex gap-1">
                <button
                  disabled={data.page <= 1}
                  onClick={() => navigate({ search: (p) => ({ ...p, page: Math.max(1, p.page - 1) }) })}
                  className="rounded border border-border bg-card px-3 py-1 text-xs disabled:opacity-50 hover:bg-muted"
                >
                  ← Prev
                </button>
                <button
                  disabled={data.page >= totalPages}
                  onClick={() => navigate({ search: (p) => ({ ...p, page: p.page + 1 }) })}
                  className="rounded border border-border bg-card px-3 py-1 text-xs disabled:opacity-50 hover:bg-muted"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Row({ it }: { it: DrilldownItem }) {
  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-3 py-2">
        <Link
          to="/admin/follow-ups"
          search={{ q: it.display_name ?? it.lead_id } as never}
          className="font-medium text-primary hover:underline"
        >
          {it.display_name ?? it.lead_id.slice(0, 8)}
        </Link>
        {it.display_subtitle && (
          <div className="text-xs text-muted-foreground">{it.display_subtitle}</div>
        )}
      </td>
      <td className="px-3 py-2 text-xs">{it.source}</td>
      <td className="px-3 py-2 text-xs">
        {it.city ?? "—"}{it.region ? `, ${it.region}` : ""}
      </td>
      <td className="px-3 py-2">
        <span className={`rounded px-2 py-0.5 text-xs ${statusColor(it.status)}`}>{it.status}</span>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{it.last_outcome ?? "—"}</td>
      <td className="px-3 py-2 text-right tabular-nums">
        {it.ai_score == null ? "—" : it.ai_score.toFixed(0)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{it.touch_count}</td>
      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{fmtDate(it.last_touch_at)}</td>
    </tr>
  );
}
