import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

// Allowlisted internal path prefixes we won't flag (Sharetribe + sibling Lovable apps + assets)
const INTERNAL_ALLOWED_PREFIXES = [
  "/s", "/l/", "/signup", "/login", "/inbox", "/auth/", "/account/",
  "/profile/", "/messages/", "/listings/", "/saved-listings",
  "/amenity/", "/amenities", "/public-pools/", "/referral", "/admin",
  "/sitemap.xml", "/pools-directory-sitemap.xml", "/landing-page",
  "/fw-assets/", "/api/",
];

export type BrokenLink = {
  page_id: string;
  page_url: string;
  page_title: string | null;
  href: string;
  label: string;
  reason: "missing_p_page" | "unknown_internal_path" | "malformed";
  suggestion?: { href: string; reason: string } | null;
};

const MD_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function classifyHref(href: string): { kind: "external" | "internal" | "anchor" | "mail" | "tel" | "malformed"; path?: string } {
  const h = href.trim();
  if (!h) return { kind: "malformed" };
  if (h.startsWith("#")) return { kind: "anchor" };
  if (h.startsWith("mailto:")) return { kind: "mail" };
  if (h.startsWith("tel:")) return { kind: "tel" };
  if (/^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (/(^|\.)poolrentalnearme\.com$/i.test(u.hostname) || /lovable\.app$/i.test(u.hostname)) {
        return { kind: "internal", path: u.pathname };
      }
      return { kind: "external" };
    } catch { return { kind: "malformed" }; }
  }
  if (h.startsWith("/")) return { kind: "internal", path: h.split(/[?#]/)[0] };
  return { kind: "malformed" };
}

function isAllowedInternal(path: string): boolean {
  if (path === "/") return true;
  return INTERNAL_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p));
}

export const scanBrokenLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      offset: z.number().int().min(0).default(0),
      batchSize: z.number().int().min(10).max(500).default(200),
      urlPrefix: z.string().trim().max(200).optional(),
      urlContains: z.string().trim().max(200).optional(),
      pageIds: z.array(z.string().uuid()).max(2000).optional(),
      onlyMissingPPage: z.boolean().optional(),
      rangeStart: z.string().trim().max(200).optional(),
      rangeEnd: z.string().trim().max(200).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const sb = supabaseAdmin as any;

    // Build filtered query of published /p/* pages
    let q = sb
      .from("content_pages")
      .select("id, url_path, title, body_markdown", { count: "exact" })
      .eq("status", "published");

    if (data.pageIds && data.pageIds.length) {
      q = q.in("id", data.pageIds);
    } else {
      // Always restrict to /p/* unless caller pinned page IDs
      const prefix = (data.urlPrefix || "/p/").trim();
      const safePrefix = prefix.startsWith("/p/") || prefix === "/p" ? prefix : "/p/";
      q = q.like("url_path", `${safePrefix}${safePrefix.endsWith("%") ? "" : "%"}`);
      if (data.urlContains) {
        const c = data.urlContains.replace(/[%_]/g, "");
        if (c) q = q.ilike("url_path", `%${c}%`);
      }
      if (data.rangeStart) q = q.gte("url_path", data.rangeStart);
      if (data.rangeEnd) q = q.lte("url_path", data.rangeEnd);
    }

    const { data: pages, count } = await q
      .order("url_path", { ascending: true })
      .range(data.offset, data.offset + data.batchSize - 1);

    const list = (pages || []) as Array<{ id: string; url_path: string; title: string | null; body_markdown: string | null }>;

    // Collect every distinct internal /p/ href referenced in this batch
    const referencedPPaths = new Set<string>();
    const perPage: Array<{ page: typeof list[number]; links: Array<{ href: string; label: string }> }> = [];
    for (const p of list) {
      const body = p.body_markdown || "";
      const links: Array<{ href: string; label: string }> = [];
      MD_LINK_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = MD_LINK_RE.exec(body)) !== null) {
        links.push({ label: m[1], href: m[2] });
        const c = classifyHref(m[2]);
        if (c.kind === "internal" && c.path && c.path.startsWith("/p/")) {
          referencedPPaths.add(c.path);
        }
      }
      perPage.push({ page: p, links });
    }

    // Existence check for /p/ pages in one query
    const existing = new Set<string>();
    if (referencedPPaths.size) {
      const { data: rows } = await sb
        .from("content_pages")
        .select("url_path")
        .in("url_path", Array.from(referencedPPaths))
        .eq("status", "published");
      for (const r of rows || []) existing.add((r as any).url_path);
    }

    const broken: BrokenLink[] = [];
    for (const { page, links } of perPage) {
      for (const { href, label } of links) {
        const c = classifyHref(href);
        if (c.kind === "external" || c.kind === "anchor" || c.kind === "mail" || c.kind === "tel") continue;
        if (c.kind === "malformed") {
          broken.push({ page_id: page.id, page_url: page.url_path, page_title: page.title, href, label, reason: "malformed", suggestion: null });
          continue;
        }
        const path = c.path!;
        if (path.startsWith("/p/")) {
          if (!existing.has(path)) {
            broken.push({ page_id: page.id, page_url: page.url_path, page_title: page.title, href, label, reason: "missing_p_page" });
          }
        } else if (!isAllowedInternal(path)) {
          broken.push({ page_id: page.id, page_url: page.url_path, page_title: page.title, href, label, reason: "unknown_internal_path", suggestion: null });
        }
      }
    }

    // Optional post-filter: only return missing_p_page issues
    const filteredBroken = data.onlyMissingPPage ? broken.filter((b) => b.reason === "missing_p_page") : broken;
    broken.length = 0;
    broken.push(...filteredBroken);

    // Suggest replacements for missing /p/ pages by fuzzy slug match (legacy_slugs first, then ilike)
    const missingSlugs = Array.from(new Set(
      broken.filter((b) => b.reason === "missing_p_page").map((b) => {
        const c = classifyHref(b.href);
        return c.path ? c.path.replace(/^\/p\//, "").replace(/\/$/, "") : "";
      }).filter(Boolean),
    ));

    const suggestions = new Map<string, { href: string; reason: string }>();
    for (const slug of missingSlugs) {
      // 1) legacy_slugs exact match
      const { data: legacy } = await sb
        .from("content_pages")
        .select("url_path")
        .contains("legacy_slugs", [slug])
        .eq("status", "published")
        .limit(1);
      if (legacy && legacy.length) {
        suggestions.set(slug, { href: (legacy[0] as any).url_path, reason: "legacy slug match" });
        continue;
      }
      // 2) ilike close match
      const { data: similar } = await sb
        .from("content_pages")
        .select("url_path, slug")
        .ilike("slug", `%${slug.replace(/[%_]/g, "")}%`)
        .eq("status", "published")
        .like("url_path", "/p/%")
        .limit(3);
      if (similar && similar.length) {
        // pick shortest difference in length
        const best = (similar as any[]).sort((a, b) =>
          Math.abs((a.slug || "").length - slug.length) - Math.abs((b.slug || "").length - slug.length),
        )[0];
        suggestions.set(slug, { href: best.url_path, reason: "similar slug" });
      }
    }

    for (const b of broken) {
      if (b.reason !== "missing_p_page") continue;
      const c = classifyHref(b.href);
      const slug = c.path ? c.path.replace(/^\/p\//, "").replace(/\/$/, "") : "";
      const s = suggestions.get(slug);
      if (s) b.suggestion = s;
    }

    return {
      broken,
      offset: data.offset,
      batchSize: data.batchSize,
      total: count || 0,
      nextOffset: data.offset + list.length,
      done: data.offset + list.length >= (count || 0),
    };
  });

export const fixBrokenLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      pageId: z.string().uuid(),
      href: z.string().min(1).max(2000),
      action: z.enum(["replace", "unlink", "remove"]),
      newHref: z.string().min(1).max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const sb = supabaseAdmin as any;
    const { data: page } = await sb.from("content_pages").select("id, body_markdown").eq("id", data.pageId).maybeSingle();
    if (!page || !page.body_markdown) return { ok: false, error: "Page or body not found" };

    const body: string = page.body_markdown;
    // Escape href for regex
    const esc = data.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match [label](href) optionally with title
    const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");

    let replaced = 0;
    let next = body;
    if (data.action === "replace") {
      if (!data.newHref) return { ok: false, error: "newHref required" };
      next = body.replace(re, (_, label) => { replaced++; return `[${label}](${data.newHref})`; });
    } else if (data.action === "unlink") {
      next = body.replace(re, (_, label) => { replaced++; return label; });
    } else if (data.action === "remove") {
      next = body.replace(re, () => { replaced++; return ""; });
    }

    if (!replaced) return { ok: false, error: "Link not found in body" };

    const { error } = await sb.from("content_pages").update({
      body_markdown: next, updated_at: new Date().toISOString(),
    }).eq("id", data.pageId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, replaced };
  });

export const bulkFixBrokenLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      action: z.enum(["replace", "unlink", "remove"]),
      items: z.array(z.object({
        pageId: z.string().uuid(),
        href: z.string().min(1).max(2000),
        newHref: z.string().min(1).max(2000).optional(),
      })).min(1).max(2000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const sb = supabaseAdmin as any;

    // Group items by page so we update each page once
    const byPage = new Map<string, Array<{ href: string; newHref?: string }>>();
    for (const it of data.items) {
      if (data.action === "replace" && !it.newHref) continue;
      const arr = byPage.get(it.pageId) || [];
      arr.push({ href: it.href, newHref: it.newHref });
      byPage.set(it.pageId, arr);
    }

    let pagesUpdated = 0;
    let linksFixed = 0;
    let linksSkipped = 0;
    const errors: Array<{ pageId: string; error: string }> = [];

    const pageIds = Array.from(byPage.keys());
    // Fetch page bodies in chunks
    for (let i = 0; i < pageIds.length; i += 100) {
      const chunk = pageIds.slice(i, i + 100);
      const { data: pages } = await sb.from("content_pages").select("id, body_markdown").in("id", chunk);
      for (const p of (pages || []) as Array<{ id: string; body_markdown: string | null }>) {
        const items = byPage.get(p.id) || [];
        let body = p.body_markdown || "";
        if (!body) { linksSkipped += items.length; continue; }
        let pageReplaced = 0;
        for (const it of items) {
          const esc = it.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");
          let hits = 0;
          if (data.action === "replace") {
            body = body.replace(re, (_, label) => { hits++; return `[${label}](${it.newHref})`; });
          } else if (data.action === "unlink") {
            body = body.replace(re, (_, label) => { hits++; return label; });
          } else {
            body = body.replace(re, () => { hits++; return ""; });
          }
          if (hits) pageReplaced += hits; else linksSkipped++;
        }
        if (pageReplaced > 0) {
          const { error } = await sb.from("content_pages").update({
            body_markdown: body, updated_at: new Date().toISOString(),
          }).eq("id", p.id);
          if (error) errors.push({ pageId: p.id, error: error.message });
          else { pagesUpdated++; linksFixed += pageReplaced; }
        }
      }
    }

    return { ok: true, pagesUpdated, linksFixed, linksSkipped, errors };
  });
