import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readOrFailRequest } from "@/server/request-unavailable.server";

export type BlogHubPost = {
  slug: string;
  title: string;
  topic: string | null;
  editorial_cluster: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
};

/**
 * Public list of published blog posts for the /p/blog hub.
 * Uses supabaseAdmin (RLS-bypassing) — read-only, no PII.
 *
 * Fails closed: a failed read used to be caught and returned as `{ posts: [] }`,
 * which rendered the hub as a 200 with no posts for the edge to cache. Now it
 * flags the request (503, src/start.ts) and throws.
 */
export const listPublishedBlogPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ posts: BlogHubPost[] }> => {
    const data = await readOrFailRequest("blog_posts hub list", (signal) =>
      supabaseAdmin
        .from("blog_posts")
        .select(
          "slug, title, topic, editorial_cluster, excerpt, cover_image_url, published_at, updated_at",
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .limit(500)
        .abortSignal(signal),
    );
    return { posts: (data ?? []) as BlogHubPost[] };
  },
);
