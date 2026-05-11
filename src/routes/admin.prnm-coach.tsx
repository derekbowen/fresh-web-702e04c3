import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, RotateCcw, ExternalLink, Check, Wrench } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { prnmCoachChat } from "@/server/admin-prnm-coach.functions";

type Msg = { role: "user" | "assistant"; content: string };
type Role = "ceo" | "coo" | "cs";

const ROLE_OPTIONS: Array<{ value: Role | "auto"; label: string; hint: string }> = [
  { value: "auto", label: "Auto-detect", hint: "By email" },
  { value: "ceo",  label: "Mike (CEO)",     hint: "Growth, revenue, SEO" },
  { value: "coo",  label: "Brandon (COO)",  hint: "Outreach, ops" },
  { value: "cs",   label: "Michelle (CS)",  hint: "Replies, follow-ups" },
];

function extractAdminRoutes(text: string): string[] {
  const re = /\/admin\/[a-z0-9][a-z0-9-/]*/gi;
  const found = new Set<string>();
  for (const m of text.matchAll(re)) {
    const clean = m[0].replace(/[).,;:`'"]+$/, "").toLowerCase();
    if (clean !== "/admin" && clean !== "/admin/") found.add(clean);
  }
  return Array.from(found);
}

const ROUTE_LABELS: Record<string, string> = {
  "/admin/missing-pages": "Triage 404s",
  "/admin/page-auditor": "Audit a page",
  "/admin/listing-auditor": "Audit a listing",
  "/admin/keyword-opportunities": "Find keyword wins",
  "/admin/internal-links": "Add internal links",
  "/admin/seo-health": "Open SEO health",
  "/admin/content-pages": "Bulk-fix pages",
  "/admin/quick-page": "Build a new page",
  "/admin/generate-content": "Batch generate",
  "/admin/gsc-import": "Re-sync GSC",
  "/admin/competitor-radar": "Open competitor radar",
  "/admin/rank-tracker": "Open rank tracker",
  "/admin/indexing": "Open sitemap & indexing",
  "/admin/link-checker": "Run link checker",
  "/admin/leads": "Open leads pipeline",
  "/admin/ig-lead-hunter": "Hunt IG prospects",
  "/admin/contact-enricher": "Enrich contacts",
  "/admin/feature-requests": "Review feature requests",
  "/admin/sms": "Open SMS sequences",
};
const labelFor = (r: string) => ROUTE_LABELS[r] || `Open ${r}`;

const STARTER_PROMPTS = [
  "What's the single biggest opportunity right now?",
  "I have 30 minutes — what should I do?",
  "Which hosts need a follow-up today?",
  "Where am I leaking revenue?",
];

export const Route = createFileRoute("/admin/prnm-coach")({
  component: PrnmCoachPage,
});

function PrnmCoachPage() {
  const chat = useServerFn(prnmCoachChat);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());
  const [roleSel, setRoleSel] = React.useState<Role | "auto">("auto");
  const [activeRole, setActiveRole] = React.useState<Role | null>(null);
  const [lastTools, setLastTools] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  React.useEffect(() => {
    if (messages.length === 0) void send("Start. Look at my role's data, find the single highest-leverage thing for me to do today, and ask the first yes/no question.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restart whenever role changes
  React.useEffect(() => {
    if (messages.length > 0) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleSel]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: {
        messages: next,
        completedRoutes: Array.from(completed),
        roleOverride: roleSel === "auto" ? undefined : roleSel,
      } });
      if (res.ok) {
        setMessages([...next, { role: "assistant", content: res.reply }]);
        setActiveRole(res.role);
        setLastTools(res.toolsUsed || []);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setCompleted(new Set());
    setError(null);
    setLastTools([]);
    setTimeout(() => void send("Start. Look at my role's data, find the single highest-leverage thing for me to do today, and ask the first yes/no question."), 50);
  }

  function answerYesNo(answer: "Yes" | "No") { void send(answer); }

  function doItNow(route: string) {
    if (typeof window !== "undefined") window.open(route, "_blank", "noopener,noreferrer");
    setCompleted((prev) => { const n = new Set(prev); n.add(route); return n; });
    void send(`✅ Done — opened ${route} and started working on it. Mark complete and ask the next yes/no question for the next priority.`);
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b px-4 py-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-lg font-semibold">PRNM Coach</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Platform advisor — pulls live data from leads, listings, SEO, support
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={roleSel}
              onChange={(e) => setRoleSel(e.target.value as any)}
              className="text-xs rounded-md border bg-background px-2 py-1.5"
              title="Switch role"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label} — {o.hint}</option>
              ))}
            </select>
            {activeRole && (
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                {activeRole.toUpperCase()}
              </span>
            )}
            <button onClick={reset} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3 w-3" /> Restart
            </button>
          </div>
        </div>

        {lastTools.length > 0 && (
          <div className="px-4 py-1.5 border-b bg-muted/30 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <Wrench className="h-3 w-3" />
            <span>Last turn used:</span>
            {lastTools.map((t, i) => (
              <code key={i} className="px-1.5 py-0.5 rounded bg-background border text-[10px]">{t}</code>
            ))}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && <div className="text-sm text-muted-foreground">Loading your snapshot…</div>}
          {messages.map((m, i) => {
            const routes = m.role === "assistant" ? extractAdminRoutes(m.content) : [];
            return (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm"
                    : "max-w-[85%] rounded-lg bg-muted px-4 py-3 text-sm space-y-3"
                }>
                  {m.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} className="text-primary underline" target={href?.startsWith("/admin") ? undefined : "_blank"}>
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                      {routes.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                          {routes.map((route) => {
                            const isDone = completed.has(route);
                            return (
                              <button
                                key={route}
                                onClick={() => !isDone && doItNow(route)}
                                disabled={isDone}
                                className={
                                  isDone
                                    ? "inline-flex items-center gap-1.5 rounded-md bg-green-600/10 text-green-700 dark:text-green-400 px-3 py-1.5 text-xs font-medium cursor-default"
                                    : "inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 px-3 py-1.5 text-xs font-semibold"
                                }
                                title={route}
                              >
                                {isDone ? <><Check className="h-3 w-3" /> Done — {labelFor(route)}</> : <><ExternalLink className="h-3 w-3" /> Do it now: {labelFor(route)}</>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : m.content}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3 w-3 animate-pulse" /> Thinking & querying data…
              </div>
            </div>
          )}
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        </div>

        {messages.length > 0 && messages[messages.length - 1].role === "assistant" && !loading && (
          <div className="flex gap-2 px-4 pb-2">
            <button onClick={() => answerYesNo("Yes")} className="flex-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2">Yes</button>
            <button onClick={() => answerYesNo("No")} className="flex-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2">No</button>
            <button onClick={() => void send("Why?")} className="rounded-md border px-3 text-sm hover:bg-muted">Why?</button>
            <button onClick={() => void send("Skip — show me a different priority")} className="rounded-md border px-3 text-sm hover:bg-muted">Skip</button>
          </div>
        )}

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {STARTER_PROMPTS.map((p) => (
              <button key={p} onClick={() => void send(p)} className="text-xs rounded-full border px-3 py-1 hover:bg-muted">{p}</button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="flex gap-2 border-t p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything — leads, listings, SEO, support, revenue…"
            className="flex-1 rounded-md border px-3 py-2 text-sm bg-background"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50 flex items-center gap-1">
            <Send className="h-4 w-4" /> Send
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
