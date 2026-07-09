import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { l as listSchema, C as COURSE_FIELDS, s as slugSchema } from "./courses.server-Bfz1suZ4.js";
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
const listCourses_createServerFn_handler = createServerRpc({
  id: "475a2840d66ebaf221ee3508cdc5e93277ff0a700e559d06ece9060fd0e6d494",
  name: "listCourses",
  filename: "src/server/courses.functions.ts"
}, (opts) => listCourses.__executeServer(opts));
const listCourses = createServerFn({
  method: "GET"
}).inputValidator((d) => listSchema.parse(d ?? {})).handler(listCourses_createServerFn_handler, async ({
  data
}) => {
  const from = (data.page - 1) * data.pageSize;
  const to = from + data.pageSize - 1;
  let q = supabaseAdmin.from("courses").select(COURSE_FIELDS, {
    count: "exact"
  }).eq("is_published", true);
  if (data.category) q = q.eq("category", data.category);
  if (data.language) q = q.eq("language", data.language);
  if (data.tier) q = q.eq("tier", data.tier);
  if (data.search) {
    const s = data.search.replace(/[%_,()]/g, " ");
    q = q.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%`);
  }
  const {
    data: rows,
    count,
    error
  } = await q.order("is_featured", {
    ascending: false
  }).order("published_at", {
    ascending: false,
    nullsFirst: false
  }).range(from, to);
  if (error) console.error("listCourses:", error);
  return {
    courses: rows ?? [],
    total: count ?? 0,
    page: data.page,
    pageSize: data.pageSize,
    category: data.category ?? null,
    language: data.language ?? null,
    search: data.search ?? null,
    tier: data.tier ?? null
  };
});
const listCourseTiers_createServerFn_handler = createServerRpc({
  id: "d94dc264efa75c39026c070896372b405481e85dc08e151999fa7438b0447f4d",
  name: "listCourseTiers",
  filename: "src/server/courses.functions.ts"
}, (opts) => listCourseTiers.__executeServer(opts));
const listCourseTiers = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).optional()
}).parse(d ?? {})).handler(listCourseTiers_createServerFn_handler, async ({
  data
}) => {
  let q = supabaseAdmin.from("courses").select("tier").eq("is_published", true).not("tier", "is", null);
  if (data.language) q = q.eq("language", data.language);
  const {
    data: rows,
    error
  } = await q;
  if (error) console.error("listCourseTiers:", error);
  const counts = /* @__PURE__ */ new Map();
  for (const row of rows ?? []) {
    const t = row.tier;
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const tiers = Array.from(counts.entries()).map(([slug, count]) => ({
    slug,
    count
  })).sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    tiers
  };
});
const listCourseCategories_createServerFn_handler = createServerRpc({
  id: "d3ff98f9d089d040cc34f1df45804fcbfead514ba58283f97d23599d95ce1d26",
  name: "listCourseCategories",
  filename: "src/server/courses.functions.ts"
}, (opts) => listCourseCategories.__executeServer(opts));
const listCourseCategories = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).optional()
}).parse(d ?? {})).handler(listCourseCategories_createServerFn_handler, async ({
  data
}) => {
  let q = supabaseAdmin.from("courses").select("category").eq("is_published", true);
  if (data.language) q = q.eq("language", data.language);
  const {
    data: rows,
    error
  } = await q;
  if (error) console.error("listCourseCategories:", error);
  const counts = /* @__PURE__ */ new Map();
  for (const row of rows ?? []) {
    const c = row.category;
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const categories = Array.from(counts.entries()).map(([slug, count]) => ({
    slug,
    count
  })).sort((a, b) => b.count - a.count);
  return {
    categories
  };
});
const listFeaturedCourses_createServerFn_handler = createServerRpc({
  id: "a4846eb44c303f1117f2d39802aa4e8d165dc0e42119615f9173f513a0096ebf",
  name: "listFeaturedCourses",
  filename: "src/server/courses.functions.ts"
}, (opts) => listFeaturedCourses.__executeServer(opts));
const listFeaturedCourses = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  language: z.enum(["en", "es"]).optional(),
  limit: z.number().int().min(1).max(12).default(3)
}).parse(d ?? {})).handler(listFeaturedCourses_createServerFn_handler, async ({
  data
}) => {
  let q = supabaseAdmin.from("courses").select(COURSE_FIELDS + ", excerpt").eq("is_published", true).eq("is_featured", true);
  if (data.language) q = q.eq("language", data.language);
  const {
    data: rows,
    error
  } = await q.order("published_at", {
    ascending: false,
    nullsFirst: false
  }).limit(data.limit);
  if (error) console.error("listFeaturedCourses:", error);
  return {
    courses: rows ?? []
  };
});
const getCourse_createServerFn_handler = createServerRpc({
  id: "d3261a09eb1aee5521c098d60c84270987b322d7a7085005c7b3a4e6abffcee9",
  name: "getCourse",
  filename: "src/server/courses.functions.ts"
}, (opts) => getCourse.__executeServer(opts));
const getCourse = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: slugSchema
}).parse(d)).handler(getCourse_createServerFn_handler, async ({
  data
}) => {
  const {
    data: course,
    error
  } = await supabaseAdmin.from("courses").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle();
  if (error) console.error("getCourse:", error);
  return {
    course: course ?? null
  };
});
const getRelatedCourses_createServerFn_handler = createServerRpc({
  id: "74c376c755c49bc9421a0b79ca08d46b3142b6654356be257c29003817e6562f",
  name: "getRelatedCourses",
  filename: "src/server/courses.functions.ts"
}, (opts) => getRelatedCourses.__executeServer(opts));
const getRelatedCourses = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: slugSchema,
  category: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/),
  language: z.enum(["en", "es"]).default("en")
}).parse(d)).handler(getRelatedCourses_createServerFn_handler, async ({
  data
}) => {
  const {
    data: rows,
    error
  } = await supabaseAdmin.from("courses").select(COURSE_FIELDS).eq("is_published", true).eq("category", data.category).eq("language", data.language).neq("slug", data.slug).order("is_featured", {
    ascending: false
  }).order("published_at", {
    ascending: false,
    nullsFirst: false
  }).limit(4);
  if (error) console.error("getRelatedCourses:", error);
  return {
    related: rows ?? []
  };
});
const listAllCourseSlugs_createServerFn_handler = createServerRpc({
  id: "c23683e9e1831ce3ced44ae91cf1d5440fe645e1ef72ddd8d8df167a4c5d0a08",
  name: "listAllCourseSlugs",
  filename: "src/server/courses.functions.ts"
}, (opts) => listAllCourseSlugs.__executeServer(opts));
const listAllCourseSlugs = createServerFn({
  method: "GET"
}).handler(listAllCourseSlugs_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("courses").select("slug, updated_at").eq("is_published", true);
  if (error) console.error("listAllCourseSlugs:", error);
  return {
    courses: data ?? []
  };
});
export {
  getCourse_createServerFn_handler,
  getRelatedCourses_createServerFn_handler,
  listAllCourseSlugs_createServerFn_handler,
  listCourseCategories_createServerFn_handler,
  listCourseTiers_createServerFn_handler,
  listCourses_createServerFn_handler,
  listFeaturedCourses_createServerFn_handler
};
