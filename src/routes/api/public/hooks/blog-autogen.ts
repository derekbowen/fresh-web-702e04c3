import { createFileRoute } from "@tanstack/react-router";
import { runBlogAutogen } from "@/server/blog-autogen.server";
import { authorizeHookRequest } from "@/server/hook-auth.server";

export const Route = createFileRoute("/api/public/hooks/blog-autogen")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = authorizeHookRequest(request);
        if (unauth) return unauth;
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        const count = Number.isFinite(body?.count) ? Number(body.count) : 2;
        const topic = typeof body?.topic === "string" ? body.topic : undefined;
        const titleHint = typeof body?.titleHint === "string" ? body.titleHint : undefined;
        const autoPublish = body?.autoPublish === true;

        try {
          const result = await runBlogAutogen({ count, topic, titleHint, autoPublish });
          return Response.json({ ok: true, ...result });
        } catch (e) {
          console.error("blog-autogen failed:", e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});
