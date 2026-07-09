import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { z } from "zod";
import { c as createServerFn, g as getRequestHeader } from "../server.js";
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
function logRedirect(fromSlug, toSlug) {
  let userAgent = null;
  let referrer = null;
  try {
    userAgent = getRequestHeader("user-agent") ?? null;
    referrer = getRequestHeader("referer") ?? null;
  } catch {
  }
  void supabaseAdmin.from("redirect_log").insert({
    from_slug: fromSlug,
    to_slug: toSlug,
    user_agent: userAgent,
    referrer
  }).then((res) => {
    if (res?.error) console.error("[redirect_log] insert failed", res.error);
  });
}
function redirectLookup(fromSlug, rawTarget) {
  const target = rawTarget.trim();
  const redirectPath = target.startsWith("http") || target.startsWith("/") ? target : `/p/${target.replace(/^p\//, "")}`;
  const canonicalSlug = redirectPath.startsWith("/p/") ? redirectPath.slice(3).replace(/^\/+|\/+$/g, "") : target;
  if (canonicalSlug && canonicalSlug !== fromSlug) logRedirect(fromSlug, canonicalSlug);
  return {
    kind: "redirect",
    canonicalSlug: canonicalSlug || target,
    redirectPath
  };
}
const lookupContentPage_createServerFn_handler = createServerRpc({
  id: "8dc39875112299d43280ab8e8415072c8c2cbfa2f198c720671e85a7d1af18b7",
  name: "lookupContentPage",
  filename: "src/server/content-pages.functions.ts"
}, (opts) => lookupContentPage.__executeServer(opts));
const lookupContentPage = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  slug: z.string().min(1)
}).parse(data)).handler(lookupContentPage_createServerFn_handler, async ({
  data
}) => {
  const {
    slug
  } = data;
  const canonicalPath = `/p/${slug}`;
  const {
    data: rows
  } = await supabaseAdmin.from("content_pages").select("*").eq("slug", slug).in("status", ["published", "redirect"]).order("priority", {
    ascending: false
  }).limit(5);
  const list = rows ?? [];
  const exactRedirect = list.find((r) => {
    const redirectTo = r.redirect_to;
    return r.url_path === canonicalPath && r.status === "redirect" && typeof redirectTo === "string" && redirectTo.trim();
  });
  if (exactRedirect) {
    return redirectLookup(slug, exactRedirect.redirect_to);
  }
  const page = list.find((r) => r.url_path === canonicalPath && r.status === "published") ?? list.find((r) => r.status === "published") ?? null;
  if (page) {
    const redirectTo = page.redirect_to;
    if (redirectTo && typeof redirectTo === "string") {
      const target = redirectTo.startsWith("/p/") ? redirectTo.slice(3) : redirectTo;
      if (target && target !== slug) return redirectLookup(slug, target);
    }
    return {
      kind: "found",
      page
    };
  }
  const {
    data: aliasRows
  } = await supabaseAdmin.from("content_pages").select("slug").contains("legacy_slugs", [slug]).in("status", ["published", "redirect"]).limit(1);
  const alias = (aliasRows ?? [])[0];
  if (alias?.slug && alias.slug !== slug) {
    return redirectLookup(slug, alias.slug);
  }
  const KNOWN_PREFIXES = ["become-a-swimming-pool-host-", "swim-instructor-pool-rental-", "rent-a-swimming-pool-", "pool-rental-", "host-acquisition-"];
  const matchedPrefix = KNOWN_PREFIXES.find((p) => slug.startsWith(p));
  if (matchedPrefix) {
    const citySlug = slug.slice(matchedPrefix.length);
    if (!/-[a-z]{2}$/.test(citySlug) && citySlug.length > 0) {
      const {
        data: cityRows
      } = await supabaseAdmin.from("cities").select("slug, state_code").eq("slug", citySlug).eq("is_published", true).limit(1);
      const city = (cityRows ?? [])[0];
      if (city?.state_code) {
        const candidate = `${matchedPrefix}${citySlug}-${city.state_code.toLowerCase()}`;
        const {
          data: candRows
        } = await supabaseAdmin.from("content_pages").select("slug").eq("slug", candidate).in("status", ["published", "redirect"]).limit(1);
        if ((candRows ?? []).length > 0) {
          return redirectLookup(slug, candidate);
        }
      }
    }
  }
  const {
    data: blogRows
  } = await supabaseAdmin.from("blog_posts").select("id, slug, title, excerpt, content, cover_image_url, author, seo_title, seo_description, is_published, published_at, updated_at, topic, tldr_bullets, related_slugs").eq("slug", slug).eq("is_published", true).limit(1);
  const blog = (blogRows ?? [])[0];
  if (blog) {
    const tldr = Array.isArray(blog.tldr_bullets) ? blog.tldr_bullets.filter((s) => typeof s === "string") : null;
    const related = Array.isArray(blog.related_slugs) ? blog.related_slugs.filter((s) => typeof s === "string") : null;
    const synthetic = {
      id: blog.id,
      slug: blog.slug,
      url_path: `/p/${blog.slug}`,
      source_url: `${""}`,
      template_type: "resource",
      category: blog.topic ?? "blog",
      locale: "en",
      title: blog.title,
      seo_title: blog.seo_title,
      seo_description: blog.seo_description,
      hero_image_url: blog.cover_image_url,
      body_markdown: blog.content,
      raw_html: null,
      status: "published",
      scraped_at: null,
      updated_at: blog.updated_at,
      description: blog.excerpt,
      content: blog.content,
      cover_image_url: blog.cover_image_url,
      language: "en",
      author: blog.author,
      published_at: blog.published_at,
      is_published: true,
      legacy_slugs: [],
      hreflang_alt: null,
      tldr_bullets: tldr,
      related_slugs: related,
      topic: blog.topic
    };
    return {
      kind: "found",
      page: synthetic
    };
  }
  return {
    kind: "not_found"
  };
});
const getHreflangSibling_createServerFn_handler = createServerRpc({
  id: "8eadb45829ba365a732b45664ac3bef32a1fd5c9ca6b40aad78fd50c7efb8468",
  name: "getHreflangSibling",
  filename: "src/server/content-pages.functions.ts"
}, (opts) => getHreflangSibling.__executeServer(opts));
const getHreflangSibling = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  pageId: z.string().uuid()
}).parse(data)).handler(getHreflangSibling_createServerFn_handler, async ({
  data
}) => {
  const {
    pageId
  } = data;
  const {
    data: pageRow
  } = await supabaseAdmin.from("content_pages").select("id, locale, hreflang_group").eq("id", pageId).maybeSingle();
  if (!pageRow) return {
    sibling: null
  };
  const group = pageRow.hreflang_group;
  if (!group) return {
    sibling: null
  };
  const {
    data: sibRows
  } = await supabaseAdmin.from("content_pages").select("slug, locale").eq("hreflang_group", group).eq("status", "published").neq("id", pageId).limit(1);
  const sib = (sibRows ?? [])[0];
  if (sib?.slug && sib?.locale) {
    return {
      sibling: {
        slug: sib.slug,
        language: sib.locale
      }
    };
  }
  return {
    sibling: null
  };
});
export {
  getHreflangSibling_createServerFn_handler,
  lookupContentPage_createServerFn_handler
};
