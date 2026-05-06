import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Wand2, Database, AlertTriangle, Newspaper,
  GraduationCap, Image as ImageIcon, MousePointerClick, Building2, ShieldCheck,
  CreditCard, Search, Bot, Mail, Activity, ChevronLeft, Menu, X, Home, LinkIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-layout";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const GROUPS: Array<{ label: string; items: Item[] }> = [
  {
    label: "Overview",
    items: [{ to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/quick-page", label: "Quick page builder", icon: Wand2 },
      { to: "/admin/generate-content", label: "Generate content", icon: Bot },
      { to: "/admin/content-migration", label: "Content migration", icon: Database },
      { to: "/admin/content-pages", label: "Bulk page editor", icon: FileText },
      { to: "/admin/blog", label: "Blog admin", icon: Newspaper },
      { to: "/admin/learning", label: "Learning admin", icon: GraduationCap },
      { to: "/admin/cities-heroes", label: "City heroes", icon: ImageIcon },
    ],
  },
  {
    label: "SEO",
    items: [
      { to: "/admin/seo-health", label: "SEO health", icon: Activity },
      { to: "/admin/link-checker", label: "Link checker", icon: LinkIcon },
      { to: "/admin/missing-pages", label: "Missing pages (404s)", icon: AlertTriangle },
      { to: "/admin/indexing", label: "Sitemap & indexing", icon: Search },
      { to: "/admin/gsc-import", label: "GSC import", icon: Search },
      { to: "/admin/scrape-import", label: "Scrape import", icon: Database },
      { to: "/admin/click-report", label: "Click report", icon: MousePointerClick },
    ],
  },
  {
    label: "Users & Ops",
    items: [
      { to: "/admin/leads", label: "Lead inbox", icon: Mail },
      { to: "/admin/email-branding", label: "Email branding", icon: Mail },
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

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: {
  collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void;
}) {
  const path = useCurrentPath();
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={[
          "z-50 shrink-0 border-r border-border bg-card transition-all",
          "lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:block",
          collapsed ? "lg:w-14" : "lg:w-60",
          "fixed inset-y-0 left-0 w-64 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-12 items-center justify-between gap-2 border-b border-border px-3">
          {!collapsed && <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</span>}
          <button onClick={onToggle} className="hidden rounded p-1 hover:bg-muted lg:inline-flex" aria-label="Toggle sidebar">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <button onClick={onMobileClose} className="rounded p-1 hover:bg-muted lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="h-[calc(100%-3rem)] overflow-y-auto p-2">
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-3">
              {!collapsed && (
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{g.label}</div>
              )}
              <ul className="space-y-0.5">
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
            </div>
          ))}
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
  const path = useCurrentPath();
  const current = ALL_ITEMS.find((i) => path === i.to || path.startsWith(i.to + "/"));
  const isDashboard = path === "/admin/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="hidden lg:block"><SiteHeader /></div>
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
    </div>
  );
}

export { GROUPS as ADMIN_NAV_GROUPS };
