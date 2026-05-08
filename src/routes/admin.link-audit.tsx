import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getLinkAuditDashboard,
  type AuditDashboard,
  type AuditLinkRow,
} from "@/server/link-audit-dashboard.functions";

export const Route = createFileRoute("/admin/link-audit")({
  component: LinkAuditPage,
});

function LinkAuditPage() {
  const [data, setData] = React.useState<AuditDashboard | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [klass, setKlass] = React.useState<"all" | "broken" | "redirected">("all");
  const [templateType, setTemplateType] = React.useState<string>("");
  const [runs, setRuns] = React.useState<number>(10);
  const [limit, setLimit] = React.useState<number>(100);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLinkAuditDashboard({
        data: {
          limit,
          runs,
          klass,
          templateType: templateType || undefined,
        },
      });
      setData(res);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load audit");
    } finally {
      setLoading(false);
    }
  }, [klass, templateType, runs, limit]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout title="Link Audit">
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto_auto]">
        <div>
          <label className="text-xs text-muted-foreground">Status</label>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={klass}
            onChange={(e) => setKlass(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="broken">Broken (4xx/5xx/timeout)</option>
            <option value="redirected">Redirected (3xx)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Page type (template_type)</label>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
          >
            <option value="">All page types</option>
            {(data?.templateTypes || []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Runs</label>
          <input
            type="number"
            min={1}
            max={50}
            className="mt-1 h-10 w-20 rounded-md border border-input bg-background px-3 text-sm"
            value={runs}
            onChange={(e) => setRuns(Number(e.target.value) || 10)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Limit</label>
          <input
            type="number"
            min={10}
            max={500}
            className="mt-1 h-10 w-20 rounded-md border border-input bg-background px-3 text-sm"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 100)}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Runs aggregated" value={data?.runsConsidered ?? "—"} />
        <StatCard label="Broken entries (raw)" value={data?.totalBrokenEntries ?? "—"} />
        <StatCard label="Distinct paths shown" value={data?.rows.length ?? "—"} />
      </div>

      <Card>
        <CardHeader><CardTitle>Top problem links</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <Th>Status</Th>
                <Th>Path</Th>
                <Th className="text-right">Hits</Th>
                <Th>HTTP</Th>
                <Th>Reason</Th>
                <Th>Source pages</Th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((r) => <Row key={r.path} row={r} />)}
              {!loading && data && data.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No problem links match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className ?? ""}`}>{children}</th>;
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ row }: { row: AuditLinkRow }) {
  const tone =
    row.klass === "broken" ? "destructive"
    : row.klass === "redirected" ? "secondary"
    : "outline";
  return (
    <tr className="border-t border-border align-top">
      <td className="px-3 py-2"><Badge variant={tone as any}>{row.klass}</Badge></td>
      <td className="px-3 py-2 font-mono text-xs break-all">{row.path}</td>
      <td className="px-3 py-2 text-right tabular-nums">{row.hits}</td>
      <td className="px-3 py-2 tabular-nums">{row.status ?? "—"}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground max-w-[280px] break-words">{row.reason || "—"}</td>
      <td className="px-3 py-2 text-xs">
        {row.sources.length === 0 ? (
          <span className="text-muted-foreground">(seed)</span>
        ) : (
          <ul className="space-y-1">
            {row.sources.slice(0, 8).map((s) => (
              <li key={s.path} className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono">{s.path}</span>
                {s.templateType && <Badge variant="outline" className="text-[10px]">{s.templateType}</Badge>}
              </li>
            ))}
            {row.sources.length > 8 && (
              <li className="text-muted-foreground">+{row.sources.length - 8} more</li>
            )}
          </ul>
        )}
      </td>
    </tr>
  );
}
