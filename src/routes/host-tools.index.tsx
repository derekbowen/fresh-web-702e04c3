import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star, ArrowRight, MessageSquare } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { ToolIcon } from "@/components/tool-icon";
import { TOOLS, CATEGORIES, SIDEBAR_GROUPS, type ToolMeta } from "@/lib/host-tools-registry";

export const Route = createFileRoute("/host-tools/")({
  head: () => ({
    meta: [
      { title: "Pool Host Tools — 56 Free Calculators, Generators & AI for Pool Hosts" },
      { name: "description", content: "Free toolkit for pool rental hosts: earnings & ROI calculators, listing AI writer, marketing engine, liability waivers, safety checklists, and a community message board." },
      { property: "og:title", content: "Pool Host Tools — 56 Tools for Pool Rental Hosts" },
      { property: "og:description", content: "Calculators, generators, planners, checklists, and AI tools to help you run a profitable pool rental business." },
    ],
  }),
  component: HostToolsIndex,
});

function HostToolsIndex() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list: ToolMeta[] = TOOLS;
    if (activeGroup) {
      const slugs = SIDEBAR_GROUPS.find((g) => g.label === activeGroup)?.slugs ?? [];
      const set = new Set(slugs);
      list = list.filter((t) => set.has(t.slug));
    }
    if (activeCategory !== "All") {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q),
      );
    }
    return list;
  }, [query, activeCategory, activeGroup]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Host Pro</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Pool Host Tools</h1>
              <p className="mt-1 text-sm text-muted-foreground">{TOOLS.length} free tools to grow your pool rental business</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/host-tools/$slug" params={{ slug: "message-board" }} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                <MessageSquare className="h-4 w-4" /> Message Board
              </Link>
              <a href="/signup" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95">
                <Star className="h-4 w-4" /> Become a Host
              </a>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar categories */}
          <aside className="space-y-1">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</h2>
            <button
              onClick={() => setActiveGroup(null)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${activeGroup === null ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-secondary"}`}
            >
              <span>All Tools</span>
              <span className="text-xs text-muted-foreground">{TOOLS.length}</span>
            </button>
            {SIDEBAR_GROUPS.map((g) => (
              <button
                key={g.label}
                onClick={() => setActiveGroup(g.label === activeGroup ? null : g.label)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${activeGroup === g.label ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-secondary"}`}
              >
                <span>{g.label}</span>
                <span className="text-xs text-muted-foreground">{g.slugs.length}</span>
              </button>
            ))}
          </aside>

          {/* Main content */}
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${TOOLS.length} tools...`}
                className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Message board hero */}
            <Link
              to="/host-tools/$slug"
              params={{ slug: "message-board" }}
              className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white shadow-md transition-transform hover:scale-[1.005]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Pool Host Message Board</h3>
                  <p className="text-sm text-white/90">Share tips, ask questions, and connect with other pool hosts — live community board</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveCategory(c.name)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === c.name ? "bg-foreground text-background" : "border border-border bg-background text-foreground hover:bg-secondary"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">{filtered.length} tools</p>

            {/* Tool grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No tools match those filters. Try clearing your search.
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolMeta }) {
  const inner = (
    <div className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <ToolIcon name={tool.icon} className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{tool.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tool.summary}</p>
      <div className="mt-4 flex items-center justify-between pt-2">
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{tool.category}</span>
        <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
      </div>
    </div>
  );
  if (tool.external) {
    if (tool.external.startsWith("/")) {
      return (
        <a href={tool.external} className="block">
          {inner}
        </a>
      );
    }
    return (
      <a href={tool.external} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return (
    <Link to="/host-tools/$slug" params={{ slug: tool.slug }} className="block">
      {inner}
    </Link>
  );
}
