import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
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
const COLS = "slug, title, subtitle, excerpt, cover_image_url, category, language, level, duration_minutes, is_featured, tier";
const getAcademyHub_createServerFn_handler = createServerRpc({
  id: "9ac8d7a29dd3aecbedd0a672eaaa51070a136b7b2346698a08d0ddec5fcc5919",
  name: "getAcademyHub",
  filename: "src/server/academy-hub.functions.ts"
}, (opts) => getAcademyHub.__executeServer(opts));
const getAcademyHub = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).default("en")
}).parse(d ?? {})).handler(getAcademyHub_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      data: rows,
      error
    } = await supabaseAdmin.from("courses").select(COLS).eq("is_published", true).eq("language", data.language).order("is_featured", {
      ascending: false
    }).order("published_at", {
      ascending: false,
      nullsFirst: false
    });
    if (error) {
      console.error("getAcademyHub:", error);
      return {
        language: data.language,
        total: 0,
        featured: [],
        categories: []
      };
    }
    const courses = rows ?? [];
    const featured = courses.filter((c) => c.is_featured).slice(0, 6);
    const byCat = /* @__PURE__ */ new Map();
    for (const c of courses) {
      const cat = c.category || "general";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(c);
    }
    const categories = Array.from(byCat.entries()).map(([category, list]) => ({
      category,
      count: list.length,
      courses: list
    })).sort((a, b) => b.count - a.count);
    return {
      language: data.language,
      total: courses.length,
      featured,
      categories
    };
  } catch (err) {
    console.error("getAcademyHub failed:", err);
    return {
      language: data.language,
      total: 0,
      featured: [],
      categories: []
    };
  }
});
const listAcademyCourses_createServerFn_handler = createServerRpc({
  id: "92e3c948d3e68671260d896de132374bd970009577c9f2021504d97b38c1b938",
  name: "listAcademyCourses",
  filename: "src/server/academy-hub.functions.ts"
}, (opts) => listAcademyCourses.__executeServer(opts));
const listAcademyCourses = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).default("en")
}).parse(d ?? {})).handler(listAcademyCourses_createServerFn_handler, async ({
  data
}) => {
  const hub = await getAcademyHub({
    data: {
      language: data.language
    }
  });
  return hub.categories.flatMap((g) => g.courses).map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.excerpt
  }));
});
export {
  getAcademyHub_createServerFn_handler,
  listAcademyCourses_createServerFn_handler
};
