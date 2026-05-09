export function TldrCard({ bullets }: { bullets: string[] }) {
  if (!bullets || bullets.length === 0) return null;
  return (
    <aside
      className="not-prose mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6"
      aria-label="Key takeaways"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
        Key takeaways
      </h2>
      <ul className="mt-3 space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-base leading-relaxed text-foreground">
            <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
