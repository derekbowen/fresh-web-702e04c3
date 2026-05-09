import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TABLES = ["content_plan", "content_pages"] as const;
type TableName = (typeof TABLES)[number];

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function authorize(request: Request): Promise<{ ok: true } | { ok: false; res: Response }> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, res: new Response("Unauthorized", { status: 401 }) };

  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return { ok: false, res: new Response("Unauthorized", { status: 401 }) };

  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) return { ok: false, res: new Response("Forbidden", { status: 403 }) };
  return { ok: true };
}

export const Route = createFileRoute("/api/admin/data-export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authorize(request);
        if (!auth.ok) return auth.res;

        const url = new URL(request.url);
        const table = url.searchParams.get("table") as TableName | null;
        if (!table || !TABLES.includes(table)) {
          return new Response("Invalid table", { status: 400 });
        }

        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${table}-${ts}.csv`;

        // Stream rows page-by-page so we never hold the whole table in memory
        // (content_pages has 6700+ rows with large body markdown — building a
        // single CSV string in a server fn response blew the Worker limits).
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const enc = new TextEncoder();
            try {
              const pageSize = 500;
              let from = 0;
              let cols: string[] | null = null;
              while (true) {
                const { data: rows, error } = await supabaseAdmin
                  .from(table)
                  .select("*")
                  .order("created_at", { ascending: true })
                  .range(from, from + pageSize - 1);
                if (error) throw new Error(error.message);
                if (!rows || rows.length === 0) break;
                if (!cols) {
                  cols = Object.keys(rows[0] as object);
                  controller.enqueue(enc.encode(cols.join(",") + "\n"));
                }
                for (const r of rows as Record<string, unknown>[]) {
                  const line = cols.map((c) => csvEscape(r[c])).join(",");
                  controller.enqueue(enc.encode(line + "\n"));
                }
                if (rows.length < pageSize) break;
                from += pageSize;
              }
              controller.close();
            } catch (e) {
              controller.error(e);
            }
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
