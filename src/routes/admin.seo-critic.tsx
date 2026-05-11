import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, ExternalLink } from "lucide-react";
import { critiquePage, type SeoCritique } from "@/lib/seo-critic.functions";

export const Route = createFileRoute("/admin/seo-critic")({
  component: SeoCriticPage,
  head: () => ({ meta: [{ title: "AI SEO Critic — Admin" }, { name: "robots", content: "noindex" }] }),
});

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="font-mono">{score}</span></div>
      <div className="h-2 rounded bg-muted overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${score}%` }} /></div>
    </div>
  );
}

function copyTo(text: string) { navigator.clipboard?.writeText(text); toast.success("Copied"); }

function SeoCriticPage() {
  const fn = useServerFn(critiquePage);
  const [path, setPath] = useState("/p/");
  const [data, setData] = useState<SeoCritique | null>(null);
  const [suggestions, setSuggestions] = useState<{ url_path: string; title: string }[]>([]);

  const run = useMutation({
    mutationFn: (p: string) => fn({ data: { url_path: p } } as any),
    onSuccess: (r: any) => {
      if (r?.ok && r.critique) { setData(r.critique); setSuggestions([]); }
      else { setData(null); setSuggestions(r?.suggestions ?? []); toast.error(r?.error || "Failed"); }
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="size-7 text-primary" />AI SEO Critic</h1>
          <p className="text-muted-foreground">One-click critique: title/meta, intent match, internal-link gaps, voice rules.</p>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input placeholder="/p/your-slug" value={path} onChange={(e) => setPath(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run.mutate(path); }} />
            <Button onClick={() => run.mutate(path)} disabled={run.isPending}>{run.isPending ? "Critiquing…" : "Critique page"}</Button>
          </div>
          {suggestions.length > 0 && (
            <div className="text-sm">
              <div className="text-muted-foreground mb-1">Did you mean:</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s.url_path} className="text-xs px-2 py-1 border rounded hover:bg-muted" onClick={() => { setPath(s.url_path); run.mutate(s.url_path); }}>{s.url_path}</button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {data && (
          <>
            <Card className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">{data.url_path}</div>
                  <h2 className="text-xl font-semibold">{data.overall.one_liner}</h2>
                </div>
                <a href={data.url_path} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1 shrink-0">View <ExternalLink className="size-3" /></a>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <ScoreBar score={data.overall.score} label="Overall" />
                <ScoreBar score={data.meta_review.score} label="Title & meta" />
                <ScoreBar score={data.intent.score} label="Intent match" />
                <ScoreBar score={data.voice.score} label="Voice" />
              </div>
              {data.overall.top_actions.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Top actions</div>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    {data.overall.top_actions.map((a, i) => <li key={i}>{a}</li>)}
                  </ol>
                </div>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="font-semibold">Title & meta</h3>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Current title ({(data.title || "").length}):</span> {data.title || "(none)"}</div>
                <div><span className="text-muted-foreground">Current meta ({(data.meta || "").length}):</span> {data.meta || "(none)"}</div>
              </div>
              {data.meta_review.issues.length > 0 && (
                <ul className="list-disc pl-5 text-sm space-y-0.5">
                  {data.meta_review.issues.map((i, k) => <li key={k}>{i}</li>)}
                </ul>
              )}
              {data.meta_review.rewrites.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Suggested rewrites</div>
                  {data.meta_review.rewrites.map((r, i) => (
                    <div key={i} className="border rounded p-3 space-y-1 bg-muted/30">
                      <div className="text-sm"><strong>Title</strong> ({r.title.length}): {r.title}</div>
                      <div className="text-sm"><strong>Meta</strong> ({r.meta.length}): {r.meta}</div>
                      <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => copyTo(r.title)}>Copy title</Button><Button size="sm" variant="outline" onClick={() => copyTo(r.meta)}>Copy meta</Button></div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="font-semibold">Intent match</h3>
              <p className="text-sm">{data.intent.verdict}</p>
              {data.intent.missing_topics.length > 0 && (
                <div>
                  <div className="text-sm font-medium">Topics to add</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.intent.missing_topics.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
                  </div>
                </div>
              )}
              {data.intent.top_queries.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Top queries (90d)</div>
                  <div className="text-xs grid grid-cols-1 md:grid-cols-2 gap-1">
                    {data.intent.top_queries.map((q, i) => (
                      <div key={i} className="flex justify-between border-b py-0.5"><span className="truncate">{q.query}</span><span className="text-muted-foreground ml-2">{q.impressions} · pos {q.position?.toFixed?.(1) ?? "?"}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="font-semibold">Internal links</h3>
              <div className="text-sm text-muted-foreground">Pages currently linking in: {data.internal_links.incoming_count}</div>
              {data.internal_links.suggest_link_to.length > 0 && (
                <div>
                  <div className="text-sm font-medium">Add links FROM this page →</div>
                  <ul className="text-sm space-y-1">
                    {data.internal_links.suggest_link_to.map((l, i) => (
                      <li key={i} className="flex justify-between gap-2 border-b py-1"><a href={l.url_path} target="_blank" rel="noreferrer" className="text-primary truncate">{l.url_path}</a><span className="text-muted-foreground text-xs ml-2 shrink-0">{l.reason}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {data.internal_links.suggest_link_from.length > 0 && (
                <div>
                  <div className="text-sm font-medium">Add links TO this page from →</div>
                  <ul className="text-sm space-y-1">
                    {data.internal_links.suggest_link_from.map((l, i) => (
                      <li key={i} className="flex justify-between gap-2 border-b py-1"><a href={l.url_path} target="_blank" rel="noreferrer" className="text-primary truncate">{l.url_path}</a><span className="text-xs ml-2 shrink-0 italic">"{l.anchor}"</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="font-semibold">Voice & style</h3>
              {data.voice.issues.length === 0 && <div className="text-sm text-emerald-600">No regex hits.</div>}
              {data.voice.issues.length > 0 && (
                <ul className="text-sm space-y-1">
                  {data.voice.issues.map((v, i) => (
                    <li key={i} className="flex gap-2"><Badge variant="outline" className="shrink-0">{v.where}</Badge><span><strong>{v.kind}</strong> — <span className="text-muted-foreground">{v.example}</span></span></li>
                  ))}
                </ul>
              )}
              {data.voice.ai_notes.length > 0 && (
                <ul className="list-disc pl-5 text-sm space-y-0.5">
                  {data.voice.ai_notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
