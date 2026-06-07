import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  getMarketplaceOverview,
  listMarketplaceResource,
  type MarketplaceOverview,
  type StList,
} from "@/lib/marketplace-console.functions";
import {
  sdkTestPing,
  sdkTestSearchListings,
  type SdkPingResult,
  type SdkListing,
} from "@/lib/sharetribe-test/test.functions";
import {
  BarChart3,
  Users as UsersIcon,
  Package,
  Network,
  Receipt,
  DollarSign,
  Star,
  Settings as SettingsIcon,
  Library,
  ShieldCheck,
  Globe,
  FlaskConical,
  LogOut,
  RefreshCw,
  Beaker,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

type View =
  | "overview"
  | "users"
  | "listings"
  | "catalog"
  | "transactions"
  | "gmv"
  | "reviews"
  | "sdk_test"
  | "settings"
  | "library"
  | "access";

type Env = "live" | "test";

const NAV: Array<{ id: View; label: string; icon: any }> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "listings", label: "Listings", icon: Package },
  { id: "catalog", label: "Catalog", icon: Network },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "gmv", label: "GMV", icon: DollarSign },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "sdk_test", label: "SDK Test (cardbay)", icon: Beaker },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "library", label: "Master Library", icon: Library },
  { id: "access", label: "Access", icon: ShieldCheck },
];

export const Route = createFileRoute("/admin/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace Console — PRNM Admin" }] }),
  component: MarketplaceConsole,
});

function fmtMoney(cents: number, currency = "USD") {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`;
}

function MarketplaceConsole() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "overview";
    return (localStorage.getItem("mc.view") as View) || "overview";
  });
  const [env, setEnv] = useState<Env>(() => {
    if (typeof window === "undefined") return "live";
    return (localStorage.getItem("mc.env") as Env) || "live";
  });
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("mc.view", view);
  }, [view]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("mc.env", env);
  }, [env]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin", redirect: "/admin/marketplace" } });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 bg-slate-950 text-slate-100 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold leading-tight">Marketplace</div>
            <div className="text-xs text-slate-400">Dashboard</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-blue-600/20 text-white ring-1 ring-blue-500/40"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 opacity-80" />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Sharetribe env</div>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-800/60 p-1">
            <button
              onClick={() => setEnv("live")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition ${
                env === "live" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Live
            </button>
            <button
              onClick={() => setEnv("test")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition ${
                env === "test" ? "bg-amber-500/90 text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" /> Test
            </button>
          </div>
          {email && <div className="text-xs text-slate-400 truncate">{email}</div>}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-x-auto">
        <ViewHeader view={view} env={env} />
        <ViewBody view={view} env={env} />
      </main>
    </div>
  );
}

function ViewHeader({ view, env }: { view: View; env: Env }) {
  const title = NAV.find((n) => n.id === view)?.label ?? "";
  return (
    <div className="flex items-end justify-between mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          env === "live"
            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
            : "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
        }`}
      >
        {env.toUpperCase()} marketplace
      </span>
    </div>
  );
}

function ViewBody({ view, env }: { view: View; env: Env }) {
  if (view === "overview") return <OverviewView env={env} />;
  if (view === "gmv") return <GmvView env={env} />;
  if (view === "users") return <ResourceView env={env} resource="users" />;
  if (view === "listings") return <ResourceView env={env} resource="listings" />;
  if (view === "transactions") return <ResourceView env={env} resource="transactions" />;
  if (view === "reviews") return <ResourceView env={env} resource="reviews" />;
  if (view === "catalog") return <CatalogView env={env} />;
  return <PlaceholderView view={view} />;
}

function OverviewView({ env }: { env: Env }) {
  const fn = useServerFn(getMarketplaceOverview);
  const q = useQuery({
    queryKey: ["mc.overview", env],
    queryFn: () => fn({ data: { env } }),
  });
  if (q.isLoading) return <p className="text-slate-500">Loading overview…</p>;
  if (q.error)
    return (
      <ErrorCard
        title="Could not load overview"
        message={(q.error as Error).message}
        onRetry={() => q.refetch()}
      />
    );
  const d = q.data as MarketplaceOverview;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Users" value={d.counts.users.toLocaleString()} />
        <Stat label="Listings" value={d.counts.listings.toLocaleString()} />
        <Stat label="Transactions" value={d.counts.transactions.toLocaleString()} />
        <Stat label="Reviews" value={d.counts.reviews.toLocaleString()} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Stat label="GMV (30d)" value={fmtMoney(d.gmv.last30dCents, d.gmv.currency)} sub="mirror data, live only" />
        <Stat label="GMV (all time)" value={fmtMoney(d.gmv.allTimeCents, d.gmv.currency)} sub="mirror data, live only" />
      </div>
      <div className="text-xs text-slate-400">
        Fetched {new Date(d.fetchedAt).toLocaleString()} from {env} Integration API.
      </div>
    </div>
  );
}

function GmvView({ env }: { env: Env }) {
  const fn = useServerFn(getMarketplaceOverview);
  const q = useQuery({ queryKey: ["mc.gmv", env], queryFn: () => fn({ data: { env } }) });
  if (q.isLoading) return <p className="text-slate-500">Loading GMV…</p>;
  if (q.error) return <ErrorCard title="GMV failed" message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  const d = q.data as MarketplaceOverview;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      <Stat label="Last 30 days" value={fmtMoney(d.gmv.last30dCents, d.gmv.currency)} />
      <Stat label="All time" value={fmtMoney(d.gmv.allTimeCents, d.gmv.currency)} />
      <div className="md:col-span-2 text-sm text-slate-500 bg-white rounded-lg border border-slate-200 p-4">
        GMV is computed from the Supabase Sharetribe mirror, which syncs Live transactions every 15 minutes. Test
        environment shows $0 — wire up a test mirror if you want it.
      </div>
    </div>
  );
}

const LISTING_STATES = ["", "published", "pendingApproval", "draft", "closed"];
const TX_TRANSITIONS = ["", "transition/confirm-payment", "transition/complete", "transition/cancel"];

function ResourceView({
  env,
  resource,
}: {
  env: Env;
  resource: "users" | "listings" | "transactions" | "reviews";
}) {
  const fn = useServerFn(listMarketplaceResource);
  const [page, setPage] = useState(1);
  const [keywords, setKeywords] = useState("");
  const [debounced, setDebounced] = useState("");
  const [state, setState] = useState("");
  const [lastTransition, setLastTransition] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keywords.trim()), 350);
    return () => clearTimeout(t);
  }, [keywords]);

  useEffect(() => {
    setPage(1);
  }, [env, resource, debounced, state, lastTransition]);

  const q = useQuery({
    queryKey: ["mc.resource", env, resource, page, debounced, state, lastTransition],
    queryFn: () =>
      fn({
        data: {
          env,
          resource,
          page,
          perPage: 25,
          keywords: debounced || undefined,
          state: state || undefined,
          lastTransition: lastTransition || undefined,
        },
      }),
  });

  const data = q.data as StList | undefined;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder={`Search ${resource}…`}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm w-64"
        />
        {resource === "listings" && (
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          >
            {LISTING_STATES.map((s) => (
              <option key={s} value={s}>
                {s || "all states"}
              </option>
            ))}
          </select>
        )}
        {resource === "transactions" && (
          <select
            value={lastTransition}
            onChange={(e) => setLastTransition(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          >
            {TX_TRANSITIONS.map((s) => (
              <option key={s} value={s}>
                {s || "all transitions"}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => q.refetch()}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm flex items-center gap-1.5 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
        {data?.meta?.totalItems != null && (
          <span className="text-xs text-slate-500 ml-auto">
            {data.meta.totalItems.toLocaleString()} total
          </span>
        )}
      </div>

      {q.isLoading && <p className="text-slate-500">Loading {resource}…</p>}
      {q.error && (
        <ErrorCard
          title={`Could not load ${resource}`}
          message={(q.error as Error).message}
          onRetry={() => q.refetch()}
        />
      )}

      {data && data.data.length === 0 && !q.isLoading && (
        <p className="text-slate-500 text-sm">No {resource} found.</p>
      )}

      {data && data.data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                {columnHeaders(resource).map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row) => (
                <ResourceRow key={row.id} row={row} resource={resource} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1.5 rounded border border-slate-300 bg-white disabled:opacity-40"
        >
          ← Prev
        </button>
        <span className="text-slate-500">
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1.5 rounded border border-slate-300 bg-white disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function columnHeaders(resource: string): string[] {
  if (resource === "users") return ["Email", "Name", "Created", "Banned"];
  if (resource === "listings") return ["Title", "State", "Price", "Created"];
  if (resource === "transactions") return ["ID", "Last transition", "Total", "Booking", "Updated"];
  if (resource === "reviews") return ["Rating", "Type", "Content", "Created"];
  return ["ID"];
}

function ResourceRow({ row, resource }: { row: any; resource: string }) {
  const a = row.attributes || {};
  if (resource === "users") {
    return (
      <tr className="border-t border-slate-100 hover:bg-slate-50/60">
        <td className="px-4 py-2.5 font-mono text-xs">{a.email || "—"}</td>
        <td className="px-4 py-2.5">
          {a.profile?.displayName || `${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`.trim() || "—"}
        </td>
        <td className="px-4 py-2.5 text-slate-500 text-xs">
          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
        </td>
        <td className="px-4 py-2.5">
          {a.banned ? <span className="text-red-600 font-medium">yes</span> : <span className="text-slate-400">no</span>}
        </td>
      </tr>
    );
  }
  if (resource === "listings") {
    const price = a.price ? `$${(a.price.amount / 100).toFixed(0)} ${a.price.currency}` : "—";
    return (
      <tr className="border-t border-slate-100 hover:bg-slate-50/60">
        <td className="px-4 py-2.5 max-w-md truncate">{a.title || "—"}</td>
        <td className="px-4 py-2.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">{a.state || "—"}</span>
        </td>
        <td className="px-4 py-2.5">{price}</td>
        <td className="px-4 py-2.5 text-slate-500 text-xs">
          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
        </td>
      </tr>
    );
  }
  if (resource === "transactions") {
    const total = a.payinTotal ? `$${(a.payinTotal.amount / 100).toFixed(2)} ${a.payinTotal.currency}` : "—";
    const booking = a.bookingStart
      ? `${new Date(a.bookingStart).toLocaleDateString()}`
      : "—";
    return (
      <tr className="border-t border-slate-100 hover:bg-slate-50/60">
        <td className="px-4 py-2.5 font-mono text-xs">{row.id.slice(0, 8)}</td>
        <td className="px-4 py-2.5 text-xs">{a.lastTransition || "—"}</td>
        <td className="px-4 py-2.5">{total}</td>
        <td className="px-4 py-2.5 text-xs">{booking}</td>
        <td className="px-4 py-2.5 text-slate-500 text-xs">
          {a.lastTransitionedAt ? new Date(a.lastTransitionedAt).toLocaleString() : "—"}
        </td>
      </tr>
    );
  }
  if (resource === "reviews") {
    return (
      <tr className="border-t border-slate-100 hover:bg-slate-50/60">
        <td className="px-4 py-2.5">
          <span className="text-amber-500 font-medium">{"★".repeat(a.rating || 0)}</span>
          <span className="text-slate-300">{"★".repeat(Math.max(0, 5 - (a.rating || 0)))}</span>
        </td>
        <td className="px-4 py-2.5 text-xs">{a.type || "—"}</td>
        <td className="px-4 py-2.5 max-w-lg truncate">{a.content || "—"}</td>
        <td className="px-4 py-2.5 text-slate-500 text-xs">
          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
        </td>
      </tr>
    );
  }
  return null;
}

function CatalogView({ env }: { env: Env }) {
  const fn = useServerFn(listMarketplaceResource);
  const q = useQuery({
    queryKey: ["mc.catalog", env],
    queryFn: () =>
      fn({ data: { env, resource: "listings" as const, page: 1, perPage: 100, state: "published" } }),
  });
  const tree = useMemo(() => {
    if (!q.data) return null;
    const byCity = new Map<string, number>();
    for (const r of (q.data as StList).data) {
      const city = (r.attributes?.publicData as any)?.city || "Unknown";
      byCity.set(city, (byCity.get(city) || 0) + 1);
    }
    return [...byCity.entries()].sort((a, b) => b[1] - a[1]);
  }, [q.data]);

  if (q.isLoading) return <p className="text-slate-500">Loading hierarchy…<br />Fetching all listings…</p>;
  if (q.error) return <ErrorCard title="Catalog failed" message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  if (!tree) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 max-w-xl">
      <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-slate-600">
        Published listings by city
      </div>
      <ul className="divide-y divide-slate-100">
        {tree.map(([city, n]) => (
          <li key={city} className="px-4 py-2.5 flex items-center justify-between text-sm">
            <span>{city}</span>
            <span className="text-slate-400 text-xs">{n} listing{n === 1 ? "" : "s"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaceholderView({ view }: { view: View }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center max-w-xl">
      <p className="text-slate-600 font-medium capitalize">{view}</p>
      <p className="text-sm text-slate-400 mt-1">
        Coming next. Tell me what you want to see here and I'll wire it up.
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function ErrorCard({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-2xl">
      <div className="font-medium text-red-800">{title}</div>
      <div className="text-sm text-red-700 mt-1 font-mono break-words">{message}</div>
      <button
        onClick={onRetry}
        className="mt-3 text-sm px-3 py-1.5 rounded-md bg-white border border-red-300 text-red-700 hover:bg-red-100"
      >
        Retry
      </button>
    </div>
  );
}
