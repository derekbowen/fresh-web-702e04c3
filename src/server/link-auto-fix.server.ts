/**
 * Conservative nightly auto-fix for broken /p/ links.
 *
 * Strategy: only auto-replaces when the broken slug exactly matches a
 * `legacy_slugs[]` entry on a published `content_pages` row. This is the
 * highest-confidence rewrite (it's the same mechanism a 301 alias uses).
 * All other broken-link cases stay manual via /admin/link-checker so we
 * never replace links autonomously without a strong signal.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MD_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function classifyHref(href: string): { kind: "internal"; path: string } | { kind: "other" } {
  const h = (href || "").trim();
  if (!h) return { kind: "other" };
  if (h.startsWith("/")) return { kind: "internal", path: h.split(/[?#]/)[0] };
  if (/^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (/(^|\.)poolrentalnearme\.com$/i.test(u.hostname) || /lovable\.app$/i.test(u.hostname)) {
        return { kind: "internal", path: u.pathname };
      }
    } catch { /* ignore */ }
  }
  return { kind: "other" };
}

export type AutoFixResult = {
  pagesScanned: number;
  pagesUpdated: number;
  linksFixed: number;
  unresolved: number;
};

export async function runLinkAutoFix(opts: { batchSize?: number; maxPages?: number } = {}): Promise<AutoFixResult> {
  const sb = supabaseAdmin as any;
  const batchSize = Math.min(Math.max(opts.batchSize ?? 200, 50), 500);
  const maxPages = Math.min(Math.max(opts.maxPages ?? 1000, 100), 5000);

  let scanned = 0;
  let pagesUpdated = 0;
  let linksFixed = 0;
  let unresolved = 0;
  let offset = 0;

  // Cache: legacy_slug -> canonical url_path (or null if unresolved)
  const legacyCache = new Map<string, string | null>();

  async function lookupLegacy(slug: string): Promise<string | null> {
    if (legacyCache.has(slug)) return legacyCache.get(slug)!;
    const { data } = await sb
      .from("content_pages")
      .select("url_path")
      .contains("legacy_slugs", [slug])
      .eq("status", "published")
      .limit(1);
    const hit = data && data.length ? (data[0] as any).url_path as string : null;
    legacyCache.set(slug, hit);
    return hit;
  }

  while (scanned < maxPages) {
    const { data: pages } = await sb
      .from("content_pages")
      .select("id, url_path, body_markdown")
      .eq("status", "published")
      .like("url_path", "/p/%")
      .order("url_path", { ascending: true })
      .range(offset, offset + batchSize - 1);
    const list = (pages || []) as Array<{ id: string; url_path: string; body_markdown: string | null }>;
    if (!list.length) break;
    scanned += list.length;
    offset += list.length;

    // Collect every distinct internal /p/ href referenced
    const referenced = new Set<string>();
    for (const p of list) {
      const body = p.body_markdown || "";
      MD_LINK_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = MD_LINK_RE.exec(body)) !== null) {
        const c = classifyHref(m[2]);
        if (c.kind === "internal" && c.path.startsWith("/p/")) referenced.add(c.path);
      }
    }
    if (!referenced.size) continue;

    // Existence check in one query
    const existing = new Set<string>();
    const refArr = Array.from(referenced);
    for (let i = 0; i < refArr.length; i += 200) {
      const chunk = refArr.slice(i, i + 200);
      const { data: rows } = await sb
        .from("content_pages")
        .select("url_path")
        .in("url_path", chunk)
        .eq("status", "published");
      for (const r of rows || []) existing.add((r as any).url_path);
    }

    // Per page: rewrite missing /p/ links whose slug matches a legacy_slugs entry
    for (const p of list) {
      let body = p.body_markdown || "";
      if (!body) continue;
      let pageReplaced = 0;
      let pageUnresolved = 0;

      const seen = new Set<string>();
      MD_LINK_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      const replacements: Array<{ from: string; to: string }> = [];
      while ((m = MD_LINK_RE.exec(body)) !== null) {
        const href = m[2];
        if (seen.has(href)) continue;
        seen.add(href);
        const c = classifyHref(href);
        if (c.kind !== "internal" || !c.path.startsWith("/p/")) continue;
        if (existing.has(c.path)) continue;
        const slug = c.path.replace(/^\/p\//, "").replace(/\/$/, "");
        if (!slug) continue;
        const canonical = await lookupLegacy(slug);
        if (canonical) replacements.push({ from: href, to: canonical });
        else pageUnresolved++;
      }

      for (const r of replacements) {
        const esc = r.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");
        let hits = 0;
        body = body.replace(re, (_, label) => { hits++; return `[${label}](${r.to})`; });
        pageReplaced += hits;
      }

      if (pageReplaced > 0) {
        const { error } = await sb.from("content_pages").update({
          body_markdown: body,
          updated_at: new Date().toISOString(),
        }).eq("id", p.id);
        if (!error) {
          pagesUpdated++;
          linksFixed += pageReplaced;
        }
      }
      unresolved += pageUnresolved;
    }
  }

  return { pagesScanned: scanned, pagesUpdated, linksFixed, unresolved };
}
