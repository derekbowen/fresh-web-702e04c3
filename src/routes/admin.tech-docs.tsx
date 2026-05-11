import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import {
  ADMIN_DOC_GROUPS,
  ADMIN_DOC_CROSS_CUTTING,
  type AdminDoc,
} from "@/lib/admin-tech-docs";
import { ADMIN_FLOWS } from "@/lib/admin-tech-flows";
import { Mermaid } from "@/components/mermaid";

export const Route = createFileRoute("/admin/tech-docs")({
  head: () => ({
    meta: [
      { title: "Technical Docs — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TechDocsPage,
});

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

function matches(item: AdminDoc, q: string) {
  if (!q) return true;
  const hay = `${item.label} ${item.route} ${item.what} ${item.how}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((tok) => hay.includes(tok));
}

function TechDocsPage() {
  const [q, setQ] = React.useState("");
  const totalItems = ADMIN_DOC_GROUPS.reduce((n, g) => n + g.items.length, 0);

  const filteredGroups = ADMIN_DOC_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => matches(it, q)),
  })).filter((g) => g.items.length > 0);

  const filteredCross = ADMIN_DOC_CROSS_CUTTING.filter((c) => {
    if (!q) return true;
    return `${c.title} ${c.body}`.toLowerCase().includes(q.toLowerCase());
  });

  const matchCount = filteredGroups.reduce((n, g) => n + g.items.length, 0);

  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const toolId = (route: string) => `tool-${slug(route)}`;
  const groupId = (label: string) => `group-${slug(label)}`;
  const crossId = (title: string) => `cross-${slug(title)}`;
  const flowId = (id: string) => `flow-${id}`;

  const [tocOpen, setTocOpen] = React.useState(true);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Technical docs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reference for every tool inside the admin area: route, what it does, and how it
            works under the hood. {totalItems} tools indexed.
          </p>
        </header>

        <div className="sticky top-16 z-10 -mx-6 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tools, routes, tables, integrations…"
              className="flex-1 min-w-[240px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">
              {q ? `${matchCount} of ${totalItems}` : `${totalItems} tools`}
            </span>
          </div>
          {filteredGroups.length > 0 && (
            <nav className="mt-2 flex flex-wrap gap-2 text-xs">
              <a
                href="#toc"
                className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary hover:bg-primary/25"
              >
                Table of contents
              </a>
              <a
                href="#flows"
                className="rounded-full bg-muted px-2.5 py-1 text-foreground hover:bg-muted/70"
              >
                Diagrams & flows
              </a>
              {filteredGroups.map((g) => (
                <a
                  key={g.label}
                  href={`#${groupId(g.label)}`}
                  className="rounded-full bg-muted px-2.5 py-1 text-foreground hover:bg-muted/70"
                >
                  {g.label} ({g.items.length})
                </a>
              ))}
            </nav>
          )}
        </div>

        {filteredGroups.length === 0 && filteredCross.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No matches for &ldquo;{q}&rdquo;.
          </div>
        )}

        <section
          id="toc"
          className="rounded-lg border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Table of contents</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Jump to any admin tool, diagram, or cross-cutting concern.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTocOpen((v) => !v)}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
            >
              {tocOpen ? "Collapse" : "Expand"}
            </button>
          </div>

          {tocOpen && (
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Diagrams & flows
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {ADMIN_FLOWS.map((f) => (
                    <li key={f.id}>
                      <a
                        href={`#${flowId(f.id)}`}
                        className="text-primary hover:underline"
                      >
                        {f.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {filteredCross.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Cross-cutting concerns
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {filteredCross.map((c) => (
                      <li key={c.title}>
                        <a
                          href={`#${crossId(c.title)}`}
                          className="text-primary hover:underline"
                        >
                          {c.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {filteredGroups.map((g) => (
                <div key={g.label}>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <a href={`#${groupId(g.label)}`} className="hover:underline">
                      {g.label}
                    </a>{" "}
                    <span className="text-muted-foreground/70">({g.items.length})</span>
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {g.items.map((it) => (
                      <li key={it.route} className="flex items-baseline gap-2">
                        <a
                          href={`#${toolId(it.route)}`}
                          className="text-primary hover:underline"
                        >
                          {it.label}
                        </a>
                        <code className="text-xs text-muted-foreground">{it.route}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="flows" className="space-y-6">
          <div>
            <h2 className="border-b border-border pb-1 text-xl font-semibold text-foreground">
              Diagrams & data flows
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Step-by-step walk-throughs of the moving parts behind scraping, status changes,
              publishing, and redirects.
            </p>
          </div>

          {ADMIN_FLOWS.filter((f) => {
            if (!q) return true;
            const hay = `${f.title} ${f.blurb} ${f.steps.map((s) => s.name + " " + s.detail).join(" ")}`.toLowerCase();
            return hay.includes(q.toLowerCase());
          }).map((flow) => (
            <article
              key={flow.id}
              id={flowId(flow.id)}
              className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <header>
                <h3 className="text-lg font-semibold text-foreground">{flow.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{flow.blurb}</p>
              </header>
              <Mermaid chart={flow.diagram} />
              <ol className="space-y-2 text-sm">
                {flow.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-foreground">{s.name}</div>
                      <div className="text-muted-foreground">{s.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </section>

        {filteredGroups.map((group) => (
          <section
            key={group.label}
            id={groupId(group.label)}
            className="space-y-3"
          >
            <h2 className="border-b border-border pb-1 text-xl font-semibold text-foreground">
              {group.label}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {group.items.map((it) => (
                <li
                  key={it.route}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {highlight(it.label, q)}
                    </h3>
                    <Link
                      to={it.route as any}
                      className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      Open →
                    </Link>
                  </div>
                  <code className="mt-1 block text-xs text-muted-foreground">
                    {highlight(it.route, q)}
                  </code>
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-semibold">What it does. </span>
                    {highlight(it.what, q)}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">How it works. </span>
                    {highlight(it.how, q)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {filteredCross.length > 0 && (
          <section className="space-y-3">
            <h2 className="border-b border-border pb-1 text-xl font-semibold text-foreground">
              Cross-cutting concerns
            </h2>
            <ul className="space-y-3">
              {filteredCross.map((c) => (
                <li
                  key={c.title}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <h3 className="text-base font-semibold text-foreground">
                    {highlight(c.title, q)}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {highlight(c.body, q)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
