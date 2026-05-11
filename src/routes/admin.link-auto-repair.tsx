import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import { scanAndProposeRepairs, applyRepair, type RepairProposal } from "@/lib/link-auto-repair.functions";
import { Wand2, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/link-auto-repair")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/admin/link-auto-repair", mode: "signin" } });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/admin/no-access" });
  },
  head: () => ({ meta: [{ title: "Link auto-repair — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: LinkAutoRepair,
});

type RowState = { status: "idle" | "applying" | "fixed" | "error" | "skipped"; msg?: string };

function confColor(c: number) {
  if (c >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (c >= 50) return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-rose-100 text-rose-800 border-rose-300";
}

function LinkAutoRepair() {
  const qc = useQueryClient();
  const scan = useServerFn(scanAndProposeRepairs);
  const apply = useServerFn(applyRepair);

  const [urlContains, setUrlContains] = React.useState("");
  const [maxPages, setMaxPages] = React.useState(150);
  const [minConf, setMinConf] = React.useState(60);
  const [rowState, setRowState] = React.useState<Record<string, RowState>>({});
  const [overrides, setOverrides] = React.useState<Record<string, string>>({});

  const scanQ = useQuery({
    queryKey: ["link-auto-repair", urlContains, maxPages],
    queryFn: () => scan({ data: { urlContains: urlContains || undefined, maxPages, maxBroken: 80 } }),
    enabled: false,
    staleTime: Infinity,
    retry: false,
  });

  const applyM = useMutation({
    mutationFn: async (p: { id: string; pageId: string; href: string; newHref: string }) => {
      setRowState((s) => ({ ...s, [p.id]: { status: "applying" } }));
      const r = await apply({ data: { pageId: p.pageId, href: p.href, newHref: p.newHref } });
      if (!r.ok) throw new Error(r.error);
      return r;
    },
    onSuccess: (_r, v) => setRowState((s) => ({ ...s, [v.id]: { status: "fixed" } })),
    onError: (e: Error, v) => setRowState((s) => ({ ...s, [v.id]: { status: "error", msg: e.message } })),
  });

  const proposals = scanQ.data?.proposals || [];
  const rowKey = (p: RepairProposal, i: number) => `${p.page_id}::${i}::${p.href}`;

  async function fixAll() {
    for (let i = 0; i < proposals.length; i++) {
      const p = proposals[i];
      const id = rowKey(p, i);
      const target = overrides[id] || p.proposed_href;
      if (!target) {
        setRowState((s) => ({ ...s, [id]: { status: "skipped", msg: "No proposal" } }));
        continue;
      }
      if (p.confidence < minConf && !overrides[id]) {
        setRowState((s) => ({ ...s, [id]: { status: "skipped", msg: `Below ${minConf}% confidence` } }));
        continue;
      }
      if (rowState[id]?.status === "fixed") continue;
      try {
        await applyM.mutateAsync({ id, pageId: p.page_id, href: p.href, newHref: target });
      } catch { /* state already set */ }
    }
  }

  const stats = React.useMemo(() => {
    const total = proposals.length;
    const proposed = proposals.filter((p) => p.proposed_href).length;
    const high = proposals.filter((p) => p.confidence >= 80).length;
    const fixed = Object.values(rowState).filter((s) => s.status === "fixed").length;
    return { total, proposed, high, fixed };
  }, [proposals, rowState]);

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Wand2 className="h-6 w-6 text-primary" /> Broken-link auto-repair
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scans /p/* pages for broken internal links, asks AI to pick the best replacement, applies in one click.
            </p>
          </div>
        </header>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">URL contains</span>
              <input
                value={urlContains}
                onChange={(e) => setUrlContains(e.target.value)}
                placeholder="(optional) e.g. los-angeles"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Pages to scan</span>
              <input
                type="number" min={10} max={500}
                value={maxPages}
                onChange={(e) => setMaxPages(Math.max(10, Math.min(500, Number(e.target.value) || 150)))}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Auto-fix min confidence</span>
              <input
                type="number" min={0} max={100}
                value={minConf}
                onChange={(e) => setMinConf(Math.max(0, Math.min(100, Number(e.target.value) || 60)))}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                onClick={() => { setRowState({}); setOverrides({}); qc.removeQueries({ queryKey: ["link-auto-repair"] }); scanQ.refetch(); }}
                disabled={scanQ.isFetching}
                className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {scanQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {scanQ.isFetching ? "Scanning…" : "Scan & propose"}
              </button>
            </div>
          </div>
          {scanQ.data && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Scanned <b className="text-foreground">{scanQ.data.scanned_pages}</b> pages</span>
              <span>•</span>
              <span><b className="text-foreground">{stats.total}</b> broken links</span>
              <span>•</span>
              <span><b className="text-foreground">{stats.proposed}</b> with AI proposal</span>
              <span>•</span>
              <span><b className="text-emerald-700">{stats.high}</b> high-confidence</span>
              <span>•</span>
              <span><b className="text-emerald-700">{stats.fixed}</b> applied</span>
            </div>
          )}
          {scanQ.data?.error && (
            <div className="mt-3 rounded border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
              {scanQ.data.error}
            </div>
          )}
        </section>

        {proposals.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Tip: edit a proposed URL inline to override the AI pick before applying.
            </p>
            <button
              onClick={fixAll}
              disabled={applyM.isPending}
              className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Fix all ≥ {minConf}% confidence
            </button>
          </div>
        )}

        <section className="space-y-3">
          {proposals.map((p, i) => {
            const id = rowKey(p, i);
            const st = rowState[id];
            const target = overrides[id] ?? (p.proposed_href || "");
            return (
              <div key={id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono">{p.page_url}</span>
                      {p.page_title && <span className="truncate">{p.page_title}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Broken:</span>
                      <code className="rounded bg-rose-50 px-2 py-0.5 font-mono text-rose-700 line-through">{p.href}</code>
                      <span className="text-muted-foreground">— "{p.label}"</span>
                    </div>
                  </div>
                  <span className={`rounded border px-2 py-1 text-xs font-medium ${confColor(p.confidence)}`}>
                    {p.confidence}% {p.proposed_href ? "match" : "no fit"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Proposed replacement</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        value={target}
                        onChange={(e) => setOverrides((o) => ({ ...o, [id]: e.target.value }))}
                        placeholder="/p/..."
                        className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm"
                      />
                      {target && (
                        <a href={target} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-2 text-xs text-muted-foreground hover:bg-muted">
                          <ExternalLink className="h-3 w-3" /> open
                        </a>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Reason: {p.reason}</p>
                  </div>
                  <div className="flex items-end gap-2">
                    {st?.status === "fixed" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                        <CheckCircle2 className="h-4 w-4" /> Fixed
                      </span>
                    ) : st?.status === "error" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800" title={st.msg}>
                        <AlertTriangle className="h-4 w-4" /> Error
                      </span>
                    ) : (
                      <button
                        disabled={!target || st?.status === "applying"}
                        onClick={() => applyM.mutate({ id, pageId: p.page_id, href: p.href, newHref: target })}
                        className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {st?.status === "applying" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Apply fix
                      </button>
                    )}
                  </div>
                </div>

                {p.candidates.length > 1 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      Other candidates ({p.candidates.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {p.candidates.map((c) => (
                        <li key={c.url_path} className="flex items-center gap-2">
                          <button
                            onClick={() => setOverrides((o) => ({ ...o, [id]: c.url_path }))}
                            className="rounded border border-border px-2 py-0.5 font-mono hover:bg-muted"
                          >
                            {c.url_path}
                          </button>
                          {c.title && <span className="text-muted-foreground">— {c.title}</span>}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {st?.status === "error" && st.msg && (
                  <p className="mt-2 text-xs text-rose-700">{st.msg}</p>
                )}
              </div>
            );
          })}

          {scanQ.data && proposals.length === 0 && !scanQ.isFetching && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-center text-sm text-emerald-800">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6" />
              No broken /p/ links found in this scan range. Nice.
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
