import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const listPublishedBlogPosts_createServerFn_handler = createServerRpc({
  id: "cbca93b18615dd3c3b1e7f928ad8fca76984653bf22824178e3306e102dfd77d",
  name: "listPublishedBlogPosts",
  filename: "src/server/blog-posts.functions.ts"
}, (opts) => listPublishedBlogPosts.__executeServer(opts));
const listPublishedBlogPosts = createServerFn({
  method: "GET"
}).handler(listPublishedBlogPosts_createServerFn_handler, async () => {
  try {
    const {
      data,
      error
    } = await supabaseAdmin.from("blog_posts").select("slug, title, topic, editorial_cluster, excerpt, cover_image_url, published_at, updated_at").eq("is_published", true).order("published_at", {
      ascending: false,
      nullsFirst: false
    }).order("updated_at", {
      ascending: false
    }).limit(500);
    if (error) throw error;
    return {
      posts: data ?? []
    };
  } catch {
    return {
      posts: []
    };
  }
});
export {
  listPublishedBlogPosts_createServerFn_handler
};
