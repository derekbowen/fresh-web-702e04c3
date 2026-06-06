import * as React from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Wand2, Database, AlertTriangle, Newspaper,
  GraduationCap, Image as ImageIcon, MousePointerClick, Building2, ShieldCheck,
  CreditCard, Search, Bot, Mail, Activity, ChevronLeft, ChevronDown, Menu, X, Home, LinkIcon,
  TrendingUp, Swords, Network, Radar, Sparkles, Instagram, CheckCircle2, Bell, Share2,
} from "lucide-react";
import { SiteHeader, ShowChromeOverride } from "@/components/site-layout";
import { BgJobsRunner } from "@/components/bg-jobs-runner";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

// Demo mode: shrinks the sidebar to only the customer-facing tools so
// the admin can record clean demo videos / screenshare with prospects
// without exposing internal ops (leads, claims, team, etc.).
// Toggle via the "Demo mode" button in the sidebar footer or by
// appending ?demo=1 / ?demo=0 to any /admin URL.
const DEMO_KEY = "prnm_demo_mode";

const DEMO_ALLOWED_PATHS = new Set<string>([
  "/admin/quick-page",
  "/admin/generate-content",
  "/admin/content-pages",
  "/admin/seo-health",
  "/admin/link-checker",
]);

function filterGroupsForDemo(groups: typeof GROUPS) {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => DEMO_ALLOWED_PATHS.has(it.to)),
    }))
    .filter((g) => g.items.length > 0);
}

const GROUPS: Array<{ label: string; items: Item[] }> = [
  {
    label: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/prnm-coach", label: "PRNM Coach 🤖", icon: Sparkles },
      { to: "/admin/opportunities", label: "Opportunities", icon: CheckCircle2 },
      { to: "/admin/job-history", label: "Job history", icon: Activity },
      { to: "/admin/tech-docs", label: "Technical docs", icon: FileText },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/quick-page", label: "Quick page builder", icon: Wand2 },
      { to: "/admin/generate-content", label: "Generate content", icon: Bot },
      { to: "/admin/content-pages", label: "Bulk page editor", icon: FileText },
      { to: "/admin/content-migration", label: "Content migration", icon: Database },
      { to: "/admin/blog", label: "Blog admin", icon: Newspaper },
      { to: "/admin/learning", label: "Learning admin", icon: GraduationCap },
      { to: "/admin/cities-heroes", label: "City heroes", icon: ImageIcon },
      { to: "/admin/data-export", label: "Data export", icon: Database },
      { to: "/admin/data-import", label: "Data import", icon: Database },
    ],
  },
  {
    label: "SEO",
    items: [
      { to: "/admin/competitor-radar", label: "Competitor radar 🚨", icon: Radar },
      { to: "/admin/rank-tracker", label: "Rank tracker", icon: TrendingUp },
      { to: "/admin/page-auditor", label: "AI page auditor", icon: Sparkles },
      { to: "/admin/seo-critic", label: "AI SEO critic 🔍", icon: Sparkles },
      { to: "/admin/faq-generator", label: "FAQ generator ✨", icon: Sparkles },
      { to: "/admin/listing-auditor", label: "Listing auditor", icon: Sparkles },
      { to: "/admin/keyword-opportunities", label: "Keyword opportunities", icon: TrendingUp },
      { to: "/admin/competitors", label: "Competitor tracker", icon: Swords },
      { to: "/admin/internal-links", label: "Internal link recommender", icon: Network },
      { to: "/admin/seo-health", label: "SEO health", icon: Activity },
      { to: "/admin/auto-refresh", label: "Auto-refresh queue 🔄", icon: Sparkles },
      { to: "/admin/missing-pages", label: "Missing pages (404s)", icon: AlertTriangle },
      { to: "/admin/indexing", label: "Sitemap & indexing", icon: Search },
      { to: "/admin/gsc-import", label: "GSC import", icon: Search },
      { to: "/admin/scrape-import", label: "Scrape import", icon: Database },
      { to: "/admin/click-report", label: "Click report", icon: MousePointerClick },
    ],
  },
  {
    label: "Links",
    items: [
      { to: "/admin/link-checker", label: "Link checker", icon: LinkIcon },
      { to: "/admin/link-audit", label: "Link audit dashboard", icon: LinkIcon },
      { to: "/admin/link-auto-repair", label: "Link auto-repair 🪄", icon: Wand2 },
    ],
  },
  {
    label: "Email",
    items: [
      { to: "/admin/founder-blast", label: "Founder blast", icon: Mail },
      { to: "/admin/host-drip", label: "Host drip", icon: Mail },
      { to: "/admin/renter-drip", label: "Renter drip", icon: Mail },
      { to: "/admin/drip-subscribers", label: "Subscribers ⏯", icon: Mail },
      { to: "/admin/add-contacts", label: "Add contacts ➕", icon: Mail },
    ],
  },
  {
    label: "Social",
    items: [
      { to: "/admin/ig-lead-hunter", label: "IG lead hunter", icon: Instagram },
      { to: "/admin/social-lead-hunter", label: "Social lead hunter", icon: Radar },
      { to: "/admin/sms-blast", label: "SMS blast", icon: Bell },
    ],
  },
  {
    label: "Leads & CRM",
    items: [
      { to: "/admin/leads", label: "Lead inbox", icon: Mail },
      { to: "/admin/follow-ups", label: "Follow-ups 📞", icon: Activity },
      { to: "/admin/followup-performance", label: "Follow-up performance 📊", icon: TrendingUp },
      { to: "/admin/followup-reminders", label: "Follow-up reminders 🔔", icon: Bell },
      { to: "/admin/auto-outreach", label: "Auto-outreach 🤖", icon: Bot },
    ],
  },
  {
    label: "Site & Ops",
    items: [
      { to: "/admin/site-footer", label: "Site footer", icon: LinkIcon },
      { to: "/admin/directory", label: "Directory moderation", icon: Building2 },
      { to: "/admin/claims", label: "Listing claims", icon: ShieldCheck },
      { to: "/admin/plan-requests", label: "Plan requests", icon: CreditCard },
      { to: "/admin/team", label: "Admin team", icon: ShieldCheck },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

function useCurrentPath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

const OPEN_GROUPS_KEY = "prnm_admin_open_groups";

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, demoMode, onToggleDemo }: {
  collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void;
  demoMode: boolean; onToggleDemo: () => void;
}) {
  const path = useCurrentPath();
  const navigate = useNavigate();
  const groups = demoMode ? filterGroupsForDemo(GROUPS) : GROUPS;

  // Which group contains the active route — always force-open it.
  const activeGroupLabel = React.useMemo(
    () => groups.find((g) => g.items.some((it) => path === it.to || path.startsWith(it.to + "/")))?.label,
    [groups, path],
  );

  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(OPEN_GROUPS_KEY);
      setOpenMap(raw ? JSON.parse(raw) : { Overview: true });
    } catch { setOpenMap({ Overview: true }); }
  }, []);
  const toggleGroup = (label: string) => {
    setOpenMap((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try { localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const isOpen = (label: string) => collapsed || label === activeGroupLabel || openMap[label] === true;

  // ── Search ──
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [highlight, setHighlight] = React.useState(0);

  const flatItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Array<{ group: string } & Item>;
    return groups
      .flatMap((g) => g.items.map((it) => ({ group: g.label, ...it })))
      .filter((it) => it.label.toLowerCase().includes(q) || it.to.toLowerCase().includes(q));
  }, [groups, query]);

  React.useEffect(() => { setHighlight(0); }, [flatItems.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flatItems[highlight];
      if (it) {
        navigate({ to: it.to });
        setQuery("");
        onMobileClose();
      }
    } else if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={[
          "z-50 shrink-0 border-r border-border bg-card transition-all flex flex-col",
          "lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:block",
          collapsed ? "lg:w-14" : "lg:w-60",
          "fixed inset-y-0 left-0 w-64 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-12 items-center justify-between gap-2 border-b border-border px-3">
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {demoMode ? "PRNM CMS" : "Admin"}
            </span>
          )}
          <button onClick={onToggle} className="hidden rounded p-1 hover:bg-muted lg:inline-flex" aria-label="Toggle sidebar">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <button onClick={onMobileClose} className="rounded p-1 hover:bg-muted lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="relative border-b border-border px-3 py-2">
            <Search className="pointer-events-none absolute left-[1.15rem] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Jump to…"
              className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {query && flatItems.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 border-b border-x border-border bg-popover shadow-lg">
                <ul className="max-h-64 overflow-y-auto py-1">
                  {flatItems.map((it, idx) => (
                    <li key={`${it.to}-${idx}`}>
                      <Link
                        to={it.to}
                        onClick={() => { setQuery(""); onMobileClose(); }}
                        className={[
                          "flex items-center gap-2 px-3 py-1.5 text-sm",
                          idx === highlight ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                        ].join(" ")}
                        onMouseEnter={() => setHighlight(idx)}
                      >
                        <it.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="flex-1 truncate">{it.label}</span>
                        <span className="shrink-0 text-[10px] opacity-60">{it.group}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {query && flatItems.length === 0 && (
              <div className="absolute left-0 right-0 top-full z-50 border-b border-x border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-lg">
                No results
              </div>
            )}
          </div>
        )}

        <nav className="flex h-[calc(100%-6.5rem)] flex-col overflow-y-auto p-2">
          <div className="flex-1">
            {groups.map((g) => {
              const open = isOpen(g.label);
              const groupActive = g.label === activeGroupLabel;
              return (
                <div key={g.label} className="mb-1">
                  {!collapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(g.label)}
                      className={[
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                        groupActive ? "text-foreground" : "text-muted-foreground hover:bg-muted",
                      ].join(" ")}
                      aria-expanded={open}
                    >
                      <span>{g.label}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`} />
                    </button>
                  ) : null}
                  {open && (
                    <ul className="space-y-0.5 pt-0.5">
                      {g.items.map((it) => {
                        const active = path === it.to || path.startsWith(it.to + "/");
                        return (
                          <li key={it.to}>
                            <Link
                              to={it.to}
                              onClick={onMobileClose}
                              title={collapsed ? it.label : undefined}
                              className={[
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                                active ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-muted",
                              ].join(" ")}
                            >
                              <it.icon className="h-4 w-4 shrink-0" />
                              {!collapsed && <span className="truncate">{it.label}</span>}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2 border-t border-border pt-2">
            <button
              onClick={onToggleDemo}
              title={collapsed ? (demoMode ? "Exit demo mode" : "Enter demo mode") : undefined}
              className={[
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                demoMode ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span className="truncate">{demoMode ? "Demo mode: ON" : "Demo mode"}</span>}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

export function AdminLayout({ title, children, maxWidth = "max-w-7xl" }: {
  title?: string; children: React.ReactNode; maxWidth?: string;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [demoMode, setDemoMode] = React.useState(false);
  const path = useCurrentPath();

  // Initialize demo mode from URL (?demo=1) or localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("demo");
    if (q === "1") {
      setDemoMode(true);
      try { localStorage.setItem(DEMO_KEY, "1"); } catch {}
    } else if (q === "0") {
      setDemoMode(false);
      try { localStorage.removeItem(DEMO_KEY); } catch {}
    } else {
      try { setDemoMode(localStorage.getItem(DEMO_KEY) === "1"); } catch {}
    }
  }, []);

  const toggleDemo = React.useCallback(() => {
    setDemoMode((prev) => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(DEMO_KEY, "1");
        else localStorage.removeItem(DEMO_KEY);
      } catch {}
      return next;
    });
  }, []);

  const visibleItems = demoMode
    ? ALL_ITEMS.filter((i) => DEMO_ALLOWED_PATHS.has(i.to))
    : ALL_ITEMS;
  const current = visibleItems.find((i) => path === i.to || path.startsWith(i.to + "/"))
    ?? ALL_ITEMS.find((i) => path === i.to || path.startsWith(i.to + "/"));
  const isDashboard = path === "/admin/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="hidden lg:block"><ShowChromeOverride><SiteHeader /></ShowChromeOverride></div>
      {/* Mobile top bar — slim, sticky, native-app feel */}
      <div className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted active:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="truncate text-sm font-semibold">
          {current?.label ?? title ?? "Admin"}
        </span>
        <Link
          to="/"
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
          aria-label="Go to site"
        >
          <Home className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-1">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          demoMode={demoMode}
          onToggleDemo={toggleDemo}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop breadcrumb bar */}
          <div className="sticky top-16 z-30 hidden h-12 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:flex lg:px-8">
            {!isDashboard && (
              <Link to="/admin/dashboard" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
              </Link>
            )}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground"><Home className="h-3.5 w-3.5" /></Link>
              <span>/</span>
              <Link to="/admin/dashboard" className="hover:text-foreground">Admin</Link>
              {current && !isDashboard && (
                <>
                  <span>/</span>
                  <span className="font-medium text-foreground">{current.label}</span>
                </>
              )}
            </nav>
            {title && <span className="ml-auto truncate text-sm font-semibold text-foreground/80">{title}</span>}
          </div>
          <main className={`mx-auto w-full flex-1 px-3 py-4 sm:px-6 lg:px-8 lg:py-6 ${maxWidth}`}>
            {children}
          </main>
        </div>
      </div>
      <BgJobsRunner />
    </div>
  );
}

export { GROUPS as ADMIN_NAV_GROUPS };
