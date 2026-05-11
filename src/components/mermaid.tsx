import * as React from "react";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "strict",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        flowchart: { htmlLabels: true, curve: "basis" },
      });
      return m.default;
    });
  }
  return mermaidPromise;
}

let counter = 0;

export function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState<string>("");
  const [err, setErr] = React.useState<string>("");
  const id = React.useMemo(() => `mmd-${++counter}-${Math.random().toString(36).slice(2, 8)}`, []);

  React.useEffect(() => {
    let cancelled = false;
    loadMermaid()
      .then(async (mermaid) => {
        try {
          const { svg } = await mermaid.render(id, chart);
          if (!cancelled) setSvg(svg);
        } catch (e: any) {
          if (!cancelled) setErr(e?.message ?? "Failed to render diagram");
        }
      })
      .catch((e) => !cancelled && setErr(e?.message ?? "Failed to load mermaid"));
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return (
    <figure className="overflow-x-auto rounded-lg border border-border bg-card p-4">
      {err ? (
        <pre className="text-xs text-destructive">{err}</pre>
      ) : (
        <div ref={ref} className="[&_svg]:mx-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
