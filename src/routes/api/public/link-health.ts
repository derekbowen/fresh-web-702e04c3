/**
 * Runtime internal-link health check.
 *
 * GET /api/public/link-health?seeds=/p/hosting,/p/how-it-works&max=40
 *
 * Crawls a small frontier from the given seeds (or a default set), follows
 * internal <a> hrefs, and reports anything that doesn't resolve to 200 or a
 * 301/308 -> 200 in one hop. Designed as a lightweight production smoke
 * test — keep `max` small (default 40) so the response stays under a few
 * seconds.
 *
 * Returns 200 with `{ ok: true }` when every link passes, or 200 with
 * `{ ok: false, broken: [...] }` so monitors can alert on the JSON body.
 */
import { createFileRoute } from "@tanstack/react-router";
import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EXTERNAL_PREFIXES = [
  "/s", "/l/", "/login", "/signup", "/inbox", "/auth/", "/account/",
  "/profile/", "/messages/", "/listings/", "/saved-listings",
  "/amenity/", "/amenities", "/public-pools/", "/referral",
];
const isExternalOwned = (path: string) =>
  EXTERNAL_PREFIXES.some((p) => path === p || path.startsWith(p));

const DEFAULT_SEEDS = [
  "/",
  "/p/hosting",
  "/p/how-it-works",
  "/p/earnings-calculator",
  "/p/free-host-tools",
  "/p/all-locations",
];

function extractHrefs(html: string): string[] {
  const out = new Set<string>();
  const re = /<a\b[^>]*\bhref=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.add(m[1]);
  return Array.from(out);
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { redirect: "manual", signal: ctl.signal, headers: { "user-agent": "fresh-web-link-health" } });
  } finally {
    clearTimeout(t);
  }
}

export const Route = createFileRoute("/api/public/link-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const seedsParam = url.searchParams.get("seeds");
        const max = Math.min(Number(url.searchParams.get("max") || 40), 150);
        const timeoutMs = Math.min(Number(url.searchParams.get("timeout") || 8000), 15000);

        const xfh = getRequestHeader("x-forwarded-host");
        const proto = getRequestHeader("x-forwarded-proto") || "https";
        const host = xfh || url.host;
        const origin = `${proto}://${host}`;

        const seeds = (seedsParam ? seedsParam.split(",") : DEFAULT_SEEDS)
          .map((s) => s.trim()).filter((s) => s.startsWith("/")).slice(0, 25);

        const seen = new Set<string>();
        const queue: string[] = [...seeds];
        const sources = new Map<string, string>();
        for (const s of seeds) sources.set(s, "(seed)");
        const results: Array<{ path: string; status: number; ok: boolean; reason: string; source?: string }> = [];

        async function check(path: string) {
          if (seen.has(path) || seen.size >= max) return;
          seen.add(path);
          let res: Response;
          try {
            res = await fetchWithTimeout(origin + path, timeoutMs);
          } catch (err: any) {
            results.push({ path, status: 0, ok: false, reason: `fetch failed: ${err?.message || err}`, source: sources.get(path) });
            return;
          }
          const status = res.status;
          let ok = false;
          let reason = "";
          if (status === 200) ok = true;
          else if ([301, 302, 307, 308].includes(status)) {
            const loc = res.headers.get("location") || "";
            if (!loc) reason = `${status} no Location`;
            else {
              try {
                const target = loc.startsWith("http") ? loc : origin + (loc.startsWith("/") ? loc : "/" + loc);
                const r2 = await fetchWithTimeout(target, timeoutMs);
                if (r2.status === 200) { ok = true; reason = `${status} -> 200`; }
                else reason = `${status} -> ${r2.status}`;
              } catch (err: any) {
                reason = `${status} -> error ${err?.message || err}`;
              }
            }
          } else {
            reason = `HTTP ${status}`;
          }
          results.push({ path, status, ok, reason, source: sources.get(path) });

          if (ok && status === 200 && !isExternalOwned(path) && seen.size < max) {
            const ct = res.headers.get("content-type") || "";
            if (/html/i.test(ct)) {
              let body = "";
              try { body = await res.text(); } catch { /* ignore */ }
              for (const raw of extractHrefs(body)) {
                const href = raw.split("#")[0].trim();
                if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
                let p: string | null = null;
                if (href.startsWith("/")) p = href;
                else if (/^https?:\/\//i.test(href)) {
                  try {
                    const u = new URL(href);
                    if (u.host === host) p = u.pathname + (u.search || "");
                  } catch { /* ignore */ }
                }
                if (!p) continue;
                if (!sources.has(p)) sources.set(p, path);
                if (!seen.has(p)) queue.push(p);
              }
            }
          }
        }

        // Sequential with bounded queue; cheap and predictable.
        while (queue.length && seen.size < max) {
          const next = queue.shift()!;
          await check(next);
        }

        const broken = results.filter((r) => !r.ok);
        return new Response(
          JSON.stringify({
            ok: broken.length === 0,
            origin,
            checked: results.length,
            brokenCount: broken.length,
            broken: broken.slice(0, 100),
          }, null, 2),
          { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } },
        );
      },
    },
  },
});
