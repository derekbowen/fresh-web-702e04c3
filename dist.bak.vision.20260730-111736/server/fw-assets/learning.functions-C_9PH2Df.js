import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
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
async function requireAdmin(userId) {
  const { data, error } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}
const SlugInput = z.object({
  course_slug: z.string().min(1).max(120)
});
const getMyCourseStatus_createServerFn_handler = createServerRpc({
  id: "afac8bfe3154b7457c0db8b9e08466da974975f534e76a53513642ddb73adf4b",
  name: "getMyCourseStatus",
  filename: "src/server/learning.functions.ts"
}, (opts) => getMyCourseStatus.__executeServer(opts));
const getMyCourseStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => SlugInput.parse(input)).handler(getMyCourseStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const [enrollRes, completeRes] = await Promise.all([supabase.from("course_enrollments").select("id").eq("user_id", userId).eq("course_slug", data.course_slug).maybeSingle(), supabase.from("course_completions").select("certificate_uid, completed_at, revoked_at").eq("user_id", userId).eq("course_slug", data.course_slug).maybeSingle()]);
  const completion = completeRes.data && !completeRes.data.revoked_at ? completeRes.data : null;
  return {
    course_slug: data.course_slug,
    is_enrolled: !!enrollRes.data || !!completion,
    is_completed: !!completion,
    certificate_uid: completion?.certificate_uid ?? null,
    completed_at: completion?.completed_at ?? null
  };
});
const enrollInCourse_createServerFn_handler = createServerRpc({
  id: "dfde4fa660570864703719cf860047fc23c67875bd40bfd03034d595792652e5",
  name: "enrollInCourse",
  filename: "src/server/learning.functions.ts"
}, (opts) => enrollInCourse.__executeServer(opts));
const enrollInCourse = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => SlugInput.parse(input)).handler(enrollInCourse_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("course_enrollments").upsert({
    user_id: userId,
    course_slug: data.course_slug
  }, {
    onConflict: "user_id,course_slug",
    ignoreDuplicates: true
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const markCourseComplete_createServerFn_handler = createServerRpc({
  id: "9f66b1ab0dfa44ad4bfce93f6d4651d0b255f149641cc2a1d38197880a889f48",
  name: "markCourseComplete",
  filename: "src/server/learning.functions.ts"
}, (opts) => markCourseComplete.__executeServer(opts));
const markCourseComplete = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => SlugInput.parse(input)).handler(markCourseComplete_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: existing
  } = await supabase.from("course_completions").select("certificate_uid, revoked_at").eq("user_id", userId).eq("course_slug", data.course_slug).maybeSingle();
  if (existing && !existing.revoked_at) {
    return {
      ok: true,
      certificate_uid: existing.certificate_uid,
      already: true
    };
  }
  const {
    data: course,
    error: courseErr
  } = await supabaseAdmin.from("courses").select("slug, title, is_published").eq("slug", data.course_slug).maybeSingle();
  if (courseErr) throw new Error(courseErr.message);
  if (!course || !course.is_published) {
    throw new Error("Course not found or not published");
  }
  const {
    data: profile
  } = await supabase.from("profiles").select("full_name, display_name").eq("user_id", userId).maybeSingle();
  const claims = context.claims;
  const learnerName = profile?.full_name || profile?.display_name || claims?.["email"]?.split("@")[0] || "Learner";
  await supabase.from("course_enrollments").upsert({
    user_id: userId,
    course_slug: data.course_slug
  }, {
    onConflict: "user_id,course_slug",
    ignoreDuplicates: true
  });
  const {
    data: inserted,
    error: insertErr
  } = await supabaseAdmin.from("course_completions").insert({
    user_id: userId,
    course_slug: data.course_slug,
    course_title: course.title,
    learner_name: learnerName
  }).select("certificate_uid").single();
  if (insertErr) throw new Error(insertErr.message);
  await supabase.from("course_progress").upsert({
    user_id: userId,
    course_slug: data.course_slug,
    progress_pct: 100,
    completed_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_activity_at: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    onConflict: "user_id,course_slug"
  });
  await supabase.from("course_progress_events").insert({
    user_id: userId,
    course_slug: data.course_slug,
    event_type: "completed"
  });
  return {
    ok: true,
    certificate_uid: inserted.certificate_uid,
    already: false
  };
});
const HeartbeatInput = z.object({
  course_slug: z.string().min(1).max(120),
  seconds_delta: z.number().int().min(1).max(120),
  // cap per ping
  expected_minutes: z.number().int().min(1).max(600).optional()
});
const recordHeartbeat_createServerFn_handler = createServerRpc({
  id: "4932e8049137a0c68fcd0c502a9ba97bcdf61f39ceb22ce98be6986be3c44902",
  name: "recordHeartbeat",
  filename: "src/server/learning.functions.ts"
}, (opts) => recordHeartbeat.__executeServer(opts));
const recordHeartbeat = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => HeartbeatInput.parse(input)).handler(recordHeartbeat_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  let expectedMin = data.expected_minutes;
  if (!expectedMin) {
    const {
      data: course
    } = await supabaseAdmin.from("courses").select("duration_minutes").eq("slug", data.course_slug).maybeSingle();
    expectedMin = course?.duration_minutes || 30;
  }
  const {
    data: existing
  } = await supabase.from("course_progress").select("total_seconds_spent, progress_pct, started_at, completed_at").eq("user_id", userId).eq("course_slug", data.course_slug).maybeSingle();
  const isFirst = !existing;
  const newSeconds = (existing?.total_seconds_spent ?? 0) + data.seconds_delta;
  const targetSeconds = expectedMin * 60;
  const computedPct = Math.min(99, Math.floor(newSeconds / targetSeconds * 100));
  const nextPct = Math.max(existing?.progress_pct ?? 0, computedPct);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const {
    data: upserted,
    error
  } = await supabase.from("course_progress").upsert({
    user_id: userId,
    course_slug: data.course_slug,
    total_seconds_spent: newSeconds,
    progress_pct: nextPct,
    last_activity_at: nowIso,
    ...isFirst ? {
      started_at: nowIso
    } : {}
  }, {
    onConflict: "user_id,course_slug"
  }).select("course_slug, progress_pct, total_seconds_spent, started_at, last_activity_at, completed_at").single();
  if (error) throw new Error(error.message);
  await supabase.from("course_progress_events").insert({
    user_id: userId,
    course_slug: data.course_slug,
    event_type: isFirst ? "started" : "heartbeat",
    metadata: {
      seconds_delta: data.seconds_delta,
      progress_pct: nextPct
    }
  });
  return upserted;
});
const LogEventInput = z.object({
  course_slug: z.string().min(1).max(120),
  event_type: z.enum(["mark_complete_clicked", "certificate_downloaded", "certificate_verified", "resumed", "progress_updated"]),
  metadata: z.record(z.string(), z.unknown()).optional()
});
const logProgressEvent_createServerFn_handler = createServerRpc({
  id: "72e184fb111cf2c1c9cedf0c8d37df0f11c74914f1412e1bc5d0663dca09c3b6",
  name: "logProgressEvent",
  filename: "src/server/learning.functions.ts"
}, (opts) => logProgressEvent.__executeServer(opts));
const logProgressEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => LogEventInput.parse(input)).handler(logProgressEvent_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("course_progress_events").insert({
    user_id: userId,
    course_slug: data.course_slug,
    event_type: data.event_type,
    metadata: data.metadata ?? null
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const getMyCourseProgress_createServerFn_handler = createServerRpc({
  id: "02e21d1616191cc60af89621448091dda8d9055192d4874fdc05e4bf180ffbac",
  name: "getMyCourseProgress",
  filename: "src/server/learning.functions.ts"
}, (opts) => getMyCourseProgress.__executeServer(opts));
const getMyCourseProgress = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => SlugInput.parse(input)).handler(getMyCourseProgress_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: row
  } = await supabase.from("course_progress").select("course_slug, progress_pct, total_seconds_spent, started_at, last_activity_at, completed_at").eq("user_id", userId).eq("course_slug", data.course_slug).maybeSingle();
  return row ?? null;
});
const listMyProgress_createServerFn_handler = createServerRpc({
  id: "6ff6acd7fec4aa821745b01f6bb55b9cb8715ded6ff746e0a0fa4a69a5fca9d7",
  name: "listMyProgress",
  filename: "src/server/learning.functions.ts"
}, (opts) => listMyProgress.__executeServer(opts));
const listMyProgress = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(listMyProgress_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: rows
  } = await supabase.from("course_progress").select("course_slug, progress_pct, total_seconds_spent, started_at, last_activity_at, completed_at").eq("user_id", userId).order("last_activity_at", {
    ascending: false
  });
  return {
    rows: rows ?? []
  };
});
const adminGetCourseSummary_createServerFn_handler = createServerRpc({
  id: "06b78fe09a0da92572bf55b5e9eb09bb5037bb40b5df2773391bbf2b91140bd8",
  name: "adminGetCourseSummary",
  filename: "src/server/learning.functions.ts"
}, (opts) => adminGetCourseSummary.__executeServer(opts));
const adminGetCourseSummary = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(adminGetCourseSummary_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const [enrollRes, completeRes, progressRes, coursesRes] = await Promise.all([supabaseAdmin.from("course_enrollments").select("course_slug"), supabaseAdmin.from("course_completions").select("course_slug, revoked_at"), supabaseAdmin.from("course_progress").select("course_slug, progress_pct"), supabaseAdmin.from("courses").select("slug, title")]);
  const titles = /* @__PURE__ */ new Map();
  for (const c of coursesRes.data ?? []) titles.set(c.slug, c.title);
  const enrollCount = /* @__PURE__ */ new Map();
  for (const r of enrollRes.data ?? []) enrollCount.set(r.course_slug, (enrollCount.get(r.course_slug) ?? 0) + 1);
  const completeCount = /* @__PURE__ */ new Map();
  for (const r of completeRes.data ?? []) {
    if (r.revoked_at) continue;
    completeCount.set(r.course_slug, (completeCount.get(r.course_slug) ?? 0) + 1);
  }
  const pctSum = /* @__PURE__ */ new Map();
  for (const r of progressRes.data ?? []) {
    const cur = pctSum.get(r.course_slug) ?? {
      sum: 0,
      n: 0
    };
    cur.sum += r.progress_pct;
    cur.n += 1;
    pctSum.set(r.course_slug, cur);
  }
  const slugs = /* @__PURE__ */ new Set([...enrollCount.keys(), ...completeCount.keys(), ...pctSum.keys()]);
  const rows = Array.from(slugs).map((slug) => {
    const p = pctSum.get(slug);
    return {
      course_slug: slug,
      course_title: titles.get(slug) ?? null,
      enrollments: enrollCount.get(slug) ?? 0,
      completions: completeCount.get(slug) ?? 0,
      avg_progress_pct: p && p.n > 0 ? Math.round(p.sum / p.n) : 0
    };
  });
  rows.sort((a, b) => b.enrollments - a.enrollments);
  return {
    rows
  };
});
const adminListLearners_createServerFn_handler = createServerRpc({
  id: "f0ad419ab02c5dbdf80964f35052b8107ec9bfca80b84033c194f670f5327c97",
  name: "adminListLearners",
  filename: "src/server/learning.functions.ts"
}, (opts) => adminListLearners.__executeServer(opts));
const adminListLearners = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(adminListLearners_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const [enrollRes, completeRes, progressRes] = await Promise.all([supabaseAdmin.from("course_enrollments").select("user_id"), supabaseAdmin.from("course_completions").select("user_id, revoked_at"), supabaseAdmin.from("course_progress").select("user_id, last_activity_at")]);
  const userIds = /* @__PURE__ */ new Set();
  for (const r of enrollRes.data ?? []) userIds.add(r.user_id);
  for (const r of completeRes.data ?? []) userIds.add(r.user_id);
  for (const r of progressRes.data ?? []) userIds.add(r.user_id);
  const idList = Array.from(userIds);
  const {
    data: profiles
  } = idList.length ? await supabaseAdmin.from("profiles").select("user_id, display_name, full_name").in("user_id", idList) : {
    data: []
  };
  const profileMap = /* @__PURE__ */ new Map();
  for (const p of profiles ?? []) profileMap.set(p.user_id, {
    display_name: p.display_name ?? null,
    full_name: p.full_name ?? null
  });
  const enrollCount = /* @__PURE__ */ new Map();
  for (const r of enrollRes.data ?? []) enrollCount.set(r.user_id, (enrollCount.get(r.user_id) ?? 0) + 1);
  const completeCount = /* @__PURE__ */ new Map();
  for (const r of completeRes.data ?? []) {
    if (r.revoked_at) continue;
    const uid = r.user_id;
    completeCount.set(uid, (completeCount.get(uid) ?? 0) + 1);
  }
  const lastActivity = /* @__PURE__ */ new Map();
  for (const r of progressRes.data ?? []) {
    const uid = r.user_id;
    const ts = r.last_activity_at;
    const cur = lastActivity.get(uid);
    if (!cur || ts > cur) lastActivity.set(uid, ts);
  }
  const rows = idList.map((uid) => ({
    user_id: uid,
    display_name: profileMap.get(uid)?.display_name ?? null,
    full_name: profileMap.get(uid)?.full_name ?? null,
    enrollments: enrollCount.get(uid) ?? 0,
    completions: completeCount.get(uid) ?? 0,
    last_activity_at: lastActivity.get(uid) ?? null
  }));
  rows.sort((a, b) => (b.last_activity_at ?? "").localeCompare(a.last_activity_at ?? ""));
  return {
    rows
  };
});
const adminGetLearnerDetail_createServerFn_handler = createServerRpc({
  id: "7a4992e2888b2164eada30c13e302f362c546163880609baa0016d7c153a9421",
  name: "adminGetLearnerDetail",
  filename: "src/server/learning.functions.ts"
}, (opts) => adminGetLearnerDetail.__executeServer(opts));
const adminGetLearnerDetail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  user_id: z.string().uuid()
}).parse(input)).handler(adminGetLearnerDetail_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const [profRes, progRes, evRes, compRes] = await Promise.all([supabaseAdmin.from("profiles").select("user_id, display_name, full_name").eq("user_id", data.user_id).maybeSingle(), supabaseAdmin.from("course_progress").select("course_slug, progress_pct, total_seconds_spent, started_at, last_activity_at, completed_at").eq("user_id", data.user_id).order("last_activity_at", {
    ascending: false
  }), supabaseAdmin.from("course_progress_events").select("id, course_slug, event_type, metadata, created_at").eq("user_id", data.user_id).order("created_at", {
    ascending: false
  }).limit(200), supabaseAdmin.from("course_completions").select("course_slug, course_title, completed_at, certificate_uid, revoked_at").eq("user_id", data.user_id).order("completed_at", {
    ascending: false
  })]);
  const slugs = /* @__PURE__ */ new Set();
  for (const r of progRes.data ?? []) slugs.add(r.course_slug);
  const {
    data: courses
  } = slugs.size ? await supabaseAdmin.from("courses").select("slug, title").in("slug", Array.from(slugs)) : {
    data: []
  };
  const titleMap = /* @__PURE__ */ new Map();
  for (const c of courses ?? []) titleMap.set(c.slug, c.title);
  return {
    profile: profRes.data ?? null,
    progress: (progRes.data ?? []).map((r) => ({
      course_slug: r.course_slug,
      progress_pct: r.progress_pct,
      total_seconds_spent: r.total_seconds_spent,
      started_at: r.started_at,
      last_activity_at: r.last_activity_at,
      completed_at: r.completed_at,
      course_title: titleMap.get(r.course_slug) ?? null
    })),
    events: (evRes.data ?? []).map((e) => ({
      id: e.id,
      course_slug: e.course_slug,
      event_type: e.event_type,
      metadata: e.metadata ?? null,
      created_at: e.created_at
    })),
    completions: compRes.data ?? []
  };
});
const listMyLearning_createServerFn_handler = createServerRpc({
  id: "24ba682363f7014edc4d8dacd6fe835b82e127123292d0a671e973afbac3f435",
  name: "listMyLearning",
  filename: "src/server/learning.functions.ts"
}, (opts) => listMyLearning.__executeServer(opts));
const listMyLearning = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(listMyLearning_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const [enrollRes, completionsRes] = await Promise.all([supabase.from("course_enrollments").select("course_slug, enrolled_at").eq("user_id", userId).order("enrolled_at", {
    ascending: false
  }), supabase.from("course_completions").select("course_slug, course_title, completed_at, certificate_uid, revoked_at").eq("user_id", userId).is("revoked_at", null).order("completed_at", {
    ascending: false
  })]);
  const slugs = /* @__PURE__ */ new Set();
  (enrollRes.data ?? []).forEach((r) => slugs.add(r.course_slug));
  (completionsRes.data ?? []).forEach((r) => slugs.add(r.course_slug));
  const slugList = Array.from(slugs);
  const {
    data: courses
  } = slugList.length ? await supabaseAdmin.from("courses").select("slug, title").in("slug", slugList) : {
    data: []
  };
  const titleMap = /* @__PURE__ */ new Map();
  for (const c of courses ?? []) titleMap.set(c.slug, c.title);
  const enrollMap = /* @__PURE__ */ new Map();
  for (const e of enrollRes.data ?? []) enrollMap.set(e.course_slug, e.enrolled_at);
  const completionMap = /* @__PURE__ */ new Map();
  for (const c of completionsRes.data ?? []) {
    completionMap.set(c.course_slug, {
      course_title: c.course_title,
      completed_at: c.completed_at,
      certificate_uid: c.certificate_uid
    });
  }
  const rows = slugList.map((slug) => {
    const completion = completionMap.get(slug);
    return {
      course_slug: slug,
      course_title: completion?.course_title ?? titleMap.get(slug) ?? null,
      enrolled_at: enrollMap.get(slug) ?? null,
      completed_at: completion?.completed_at ?? null,
      certificate_uid: completion?.certificate_uid ?? null
    };
  });
  rows.sort((a, b) => {
    const ad = a.completed_at ?? a.enrolled_at ?? "";
    const bd = b.completed_at ?? b.enrolled_at ?? "";
    return bd.localeCompare(ad);
  });
  return {
    rows
  };
});
const verifyCertificate_createServerFn_handler = createServerRpc({
  id: "527352d4978d7394473053acb19c293f29c6b941b12799fa668b092f2debd786",
  name: "verifyCertificate",
  filename: "src/server/learning.functions.ts"
}, (opts) => verifyCertificate.__executeServer(opts));
const verifyCertificate = createServerFn({
  method: "POST"
}).inputValidator((input) => z.object({
  certificate_uid: z.string().min(4).max(40)
}).parse(input)).handler(verifyCertificate_createServerFn_handler, async ({
  data
}) => {
  const {
    data: row,
    error
  } = await supabaseAdmin.from("course_completions").select("certificate_uid, course_slug, course_title, learner_name, completed_at, revoked_at, revoke_reason").eq("certificate_uid", data.certificate_uid).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return {
    found: false
  };
  return {
    found: true,
    certificate_uid: row.certificate_uid,
    course_slug: row.course_slug,
    course_title: row.course_title,
    learner_name: row.learner_name,
    completed_at: row.completed_at,
    revoked_at: row.revoked_at ?? null,
    revoke_reason: row.revoke_reason ?? null
  };
});
export {
  adminGetCourseSummary_createServerFn_handler,
  adminGetLearnerDetail_createServerFn_handler,
  adminListLearners_createServerFn_handler,
  enrollInCourse_createServerFn_handler,
  getMyCourseProgress_createServerFn_handler,
  getMyCourseStatus_createServerFn_handler,
  listMyLearning_createServerFn_handler,
  listMyProgress_createServerFn_handler,
  logProgressEvent_createServerFn_handler,
  markCourseComplete_createServerFn_handler,
  recordHeartbeat_createServerFn_handler,
  verifyCertificate_createServerFn_handler
};
