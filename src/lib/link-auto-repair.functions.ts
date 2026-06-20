/**
 * Broken-link auto-repair workflow.
 *
 * 1) Scans /p/* pages for missing internal /p/ targets (reuses link-checker logic via direct query).
 * 2) For each broken href, gathers candidate replacement pages by slug/title token search.
 * 3) Asks Lovable AI to pick the single BEST replacement URL with confidence + reason.
 * 4) Returns proposals; UI applies them one-click via existing fixBrokenLink RPC.
 *
 * Admin-only. supabaseAdmin everywhere.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MODEL = "google/gemini-3-flash-preview";

export interface RepairProposal {
  page_id: string;
  page_url: string;
  page_title: string | null;
  href: string;
  label: string;
  proposed_href: string | null;
  confidence: number; // 0..100
  reason: string;
  candidates: Array<{ url_path: string; title: string | null }>;
}

export interface ScanResult {
  proposals: RepairProposal[];
  scanned_pages: number;
  broken_count: number;
  error?: string;
}

const STOP = new Set([
  "the","a","an","and","or","of","in","at","to","for","by","on","near","me","you","your",
  "is","are","with","best","top","find","how","what","pool","pools","rental","rentals",
]);
const slugify = (s: string) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const tokenize = (s: string) =>
  slugify(s).split("-").filter((t) => t && !STOP.has(t) && t.length > 1);

const MD_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

async function isAdmin(uid: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return !!data;
}

async function findCandidates(slug: string, label: string, limit = 8) {
  const tokens = Array.from(new Set([...tokenize(slug), ...tokenize(label)]))
    .sort((a, b) => b.length - a.length).slice(0, 4);
  const found = new Map<string, { url_path: string; title: string | null }>();
  const sb = supabaseAdmin as any;
  // legacy_slugs exact
  const { data: legacy } = await sb.from("content_pages")
    .select("url_path, title")
    .contains("legacy_slugs", [slug])
    .eq("status", "published").limit(2);
  for (const r of legacy || []) found.set(r.url_path, r);
  for (const tok of tokens) {
    const safe = tok.replace(/[%_]/g, "");
    if (safe.length < 3) continue;
    const [{ data: bySlug }, { data: byTitle }] = await Promise.all([
      sb.from("content_pages").select("url_path, title")
        .ilike("slug", `%${safe}%`).eq("status", "published").like("url_path", "/p/%").limit(8),
      sb.from("content_pages").select("url_path, title")
        .ilike("title", `%${safe}%`).eq("status", "published").like("url_path", "/p/%").limit(8),
    ]);
    for (const r of [...(bySlug || []), ...(byTitle || [])]) {
      if (r?.url_path && !found.has(r.url_path)) found.set(r.url_path, r);
      if (found.size >= limit * 3) break;
    }
    if (found.size >= limit * 3) break;
  }
  return Array.from(found.values()).slice(0, limit * 2);
}

interface BrokenItem {
  page_id: string;
  page_url: string;
  page_title: string | null;
  href: string;
  label: string;
  slug: string;
}

async function aiPickBest(
  item: BrokenItem,
  candidates: Array<{ url_path: string; title: string | null }>,
): Promise<{ proposed_href: string | null; confidence: number; reason: string }> {
  if (!candidates.length) return { proposed_href: null, confidence: 0, reason: "No candidates found" };
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { proposed_href: candidates[0].url_path, confidence: 30, reason: "Heuristic fallback (no AI key)" };

  const prompt = `You are repairing a broken internal link on a pool-rental marketplace.

Source page: ${item.page_url} — ${item.page_title || ""}
Broken link text: "${item.label}"
Broken href: ${item.href}
Broken slug: ${item.slug}

Candidate replacement pages (pick the BEST single match, or "none" if none truly fit):
${candidates.map((c, i) => `${i + 1}. ${c.url_path} — ${c.title || ""}`).join("\n")}

Respond by calling the pick_replacement tool.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "pick_replacement",
            description: "Pick the single best replacement URL or none.",
            parameters: {
              type: "object",
              properties: {
                proposed_url_path: { type: "string", description: "The /p/... path of the chosen candidate, or 'none'." },
                confidence: { type: "number", description: "0-100 confidence the replacement matches intent." },
                reason: { type: "string", description: "Short reason (under 80 chars)." },
              },
              required: ["proposed_url_path", "confidence", "reason"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "pick_replacement" } },
      }),
    });
    if (!res.ok) {
      return { proposed_href: candidates[0].url_path, confidence: 25, reason: `AI ${res.status} fallback` };
    }
    const j = await res.json();
    const tc = j?.choices?.[0]?.message?.tool_calls?.[0];
    const args = tc?.function?.arguments ? JSON.parse(tc.function.arguments) : null;
    if (!args) return { proposed_href: candidates[0].url_path, confidence: 25, reason: "AI no-arg fallback" };
    const chosen = String(args.proposed_url_path || "").trim();
    if (chosen === "none" || !chosen.startsWith("/p/")) {
      return { proposed_href: null, confidence: Number(args.confidence) || 0, reason: String(args.reason || "AI: no fit") };
    }
    if (!candidates.some((c) => c.url_path === chosen)) {
      return { proposed_href: null, confidence: 0, reason: "AI hallucinated path" };
    }
    return {
      proposed_href: chosen,
      confidence: Math.max(0, Math.min(100, Math.round(Number(args.confidence) || 0))),
      reason: String(args.reason || "AI pick").slice(0, 120),
    };
  } catch (e) {
    return { proposed_href: candidates[0].url_path, confidence: 20, reason: `AI error fallback` };
  }
}

export const scanAndProposeRepairs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      urlContains: z.string().trim().max(200).optional(),
      maxPages: z.number().int().min(10).max(500).default(150),
      maxBroken: z.number().int().min(5).max(200).default(60),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<ScanResult> => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { proposals: [], scanned_pages: 0, broken_count: 0, error: "Forbidden" };

    const sb = supabaseAdmin as any;
    let q = sb.from("content_pages")
      .select("id, url_path, title, body_markdown")
      .eq("status", "published")
      .like("url_path", "/p/%")
      .order("url_path", { ascending: true })
      .limit(data.maxPages);
    if (data.urlContains) {
      const c = data.urlContains.replace(/[%_]/g, "");
      if (c) q = q.ilike("url_path", `%${c}%`);
    }
    const { data: pages, error } = await q;
    if (error) return { proposals: [], scanned_pages: 0, broken_count: 0, error: error.message };

    const list = (pages || []) as Array<{ id: string; url_path: string; title: string | null; body_markdown: string | null }>;

    // Collect all referenced /p/ paths and which pages reference them.
    const refs = new Map<string, Array<{ page: typeof list[number]; href: string; label: string }>>();
    for (const p of list) {
      const body = p.body_markdown || "";
      MD_LINK_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = MD_LINK_RE.exec(body)) !== null) {
        const href = m[2];
        let path: string | null = null;
        if (href.startsWith("/p/")) path = href.split(/[?#]/)[0];
        else if (/^https?:\/\//i.test(href)) {
          try { const u = new URL(href);
            if (/poolrentalnearme\.com$/i.test(u.hostname) && u.pathname.startsWith("/p/")) path = u.pathname;
          } catch {}
        }
        if (!path) continue;
        if (!refs.has(path)) refs.set(path, []);
        refs.get(path)!.push({ page: p, href, label: m[1] });
      }
    }

    if (!refs.size) return { proposals: [], scanned_pages: list.length, broken_count: 0 };

    // Existence check
    const allRefs = Array.from(refs.keys());
    const existing = new Set<string>();
    const chunkSize = 200;
    for (let i = 0; i < allRefs.length; i += chunkSize) {
      const slice = allRefs.slice(i, i + chunkSize);
      const { data: rows } = await sb.from("content_pages")
        .select("url_path").in("url_path", slice).eq("status", "published");
      for (const r of rows || []) existing.add(r.url_path);
    }

    const broken: BrokenItem[] = [];
    for (const [path, occurrences] of refs) {
      if (existing.has(path)) continue;
      const slug = path.replace(/^\/p\//, "").replace(/\/$/, "");
      for (const o of occurrences) {
        broken.push({
          page_id: o.page.id, page_url: o.page.url_path, page_title: o.page.title,
          href: o.href, label: o.label, slug,
        });
        if (broken.length >= data.maxBroken) break;
      }
      if (broken.length >= data.maxBroken) break;
    }

    // De-dupe by (page_id, href) so we only ask the AI once per occurrence row.
    // Per unique broken slug, propose once and reuse.
    const slugProposals = new Map<string, { proposed_href: string | null; confidence: number; reason: string; candidates: Array<{ url_path: string; title: string | null }> }>();
    const uniqueSlugs = Array.from(new Set(broken.map((b) => b.slug)));

    // Run with mild concurrency
    const CONC = 4;
    let idx = 0;
    async function worker() {
      while (idx < uniqueSlugs.length) {
        const my = idx++;
        const slug = uniqueSlugs[my];
        const sample = broken.find((b) => b.slug === slug)!;
        const candidates = await findCandidates(slug, sample.label, 8);
        const pick = await aiPickBest(sample, candidates);
        slugProposals.set(slug, { ...pick, candidates });
      }
    }
    await Promise.all(Array.from({ length: CONC }, worker));

    const proposals: RepairProposal[] = broken.map((b) => {
      const p = slugProposals.get(b.slug)!;
      return {
        page_id: b.page_id, page_url: b.page_url, page_title: b.page_title,
        href: b.href, label: b.label,
        proposed_href: p.proposed_href, confidence: p.confidence, reason: p.reason,
        candidates: p.candidates,
      };
    });

    return { proposals, scanned_pages: list.length, broken_count: broken.length };
  });

export const applyRepair = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      pageId: z.string().uuid(),
      href: z.string().min(1).max(2000),
      newHref: z.string().min(1).max(2000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    const sb = supabaseAdmin as any;
    const { data: page } = await sb.from("content_pages")
      .select("id, body_markdown").eq("id", data.pageId).maybeSingle();
    if (!page?.body_markdown) return { ok: false as const, error: "Page not found" };
    const esc = data.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");
    let replaced = 0;
    const next = (page.body_markdown as string).replace(re, (_: string, label: string) => {
      replaced++; return `[${label}](${data.newHref})`;
    });
    if (!replaced) return { ok: false as const, error: "Link not found in body" };
    const { error } = await sb.from("content_pages").update({
      body_markdown: next, updated_at: new Date().toISOString(),
    }).eq("id", data.pageId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, replaced };
  });
