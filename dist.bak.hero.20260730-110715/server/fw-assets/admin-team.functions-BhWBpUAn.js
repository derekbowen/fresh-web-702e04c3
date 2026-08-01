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
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}
const getAdminIdentity_createServerFn_handler = createServerRpc({
  id: "50aa65b5b9181806d2feddede74d5380bd60351713a76029858b88959742b3c8",
  name: "getAdminIdentity",
  filename: "src/server/admin-team.functions.ts"
}, (opts) => getAdminIdentity.__executeServer(opts));
const getAdminIdentity = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(getAdminIdentity_createServerFn_handler, async ({
  context
}) => {
  const {
    userId,
    claims
  } = context;
  const email = claims?.email ?? null;
  const [{
    data: roleRow
  }, {
    data: profile
  }] = await Promise.all([supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(), supabaseAdmin.from("profiles").select("display_name, full_name").eq("user_id", userId).maybeSingle()]);
  return {
    isAuthenticated: true,
    isAdmin: !!roleRow,
    userId,
    email,
    displayName: profile?.full_name || profile?.display_name || null
  };
});
async function fetchAuthUsersByIds(ids) {
  const map = /* @__PURE__ */ new Map();
  if (ids.length === 0) return map;
  const idSet = new Set(ids);
  for (let page = 1; page <= 20; page++) {
    const {
      data: list,
      error
    } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200
    });
    if (error) throw new Error(`Auth lookup failed: ${error.message}`);
    const users = list?.users || [];
    for (const u of users) {
      if (idSet.has(u.id)) map.set(u.id, u);
    }
    if (users.length < 200 || map.size === idSet.size) break;
  }
  return map;
}
const listAdmins_createServerFn_handler = createServerRpc({
  id: "89e2192d03c338025d51b96431f650ce8526adc36a6e06c87a128df76a6cd303",
  name: "listAdmins",
  filename: "src/server/admin-team.functions.ts"
}, (opts) => listAdmins.__executeServer(opts));
const listAdmins = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(listAdmins_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: roles
  } = await supabaseAdmin.from("user_roles").select("user_id, created_at").eq("role", "admin");
  const ids = (roles || []).map((r) => r.user_id);
  if (ids.length === 0) return {
    admins: []
  };
  const [{
    data: profiles
  }, authMap] = await Promise.all([supabaseAdmin.from("profiles").select("user_id, display_name, full_name").in("user_id", ids), fetchAuthUsersByIds(ids)]);
  const pmap = /* @__PURE__ */ new Map();
  (profiles || []).forEach((p) => pmap.set(p.user_id, p));
  const admins = (roles || []).map((r) => ({
    user_id: r.user_id,
    email: authMap.get(r.user_id)?.email ?? null,
    display_name: pmap.get(r.user_id)?.display_name ?? null,
    full_name: pmap.get(r.user_id)?.full_name ?? null,
    granted_at: r.created_at ?? null,
    last_sign_in_at: authMap.get(r.user_id)?.last_sign_in_at ?? null
  }));
  admins.sort((a, b) => (a.full_name || a.display_name || a.email || a.user_id).localeCompare(b.full_name || b.display_name || b.email || b.user_id));
  return {
    admins
  };
});
const createAdminUser_createServerFn_handler = createServerRpc({
  id: "15d9f54d7fe9711865453d5c84d6a89717f660a1fa6ca993cab1b796bb5bbc6c",
  name: "createAdminUser",
  filename: "src/server/admin-team.functions.ts"
}, (opts) => createAdminUser.__executeServer(opts));
const createAdminUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().optional()
}).parse(d)).handler(createAdminUser_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const email = data.email.trim().toLowerCase();
  let userId = null;
  for (let page = 1; page <= 10 && !userId; page++) {
    const {
      data: list,
      error
    } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200
    });
    if (error) throw new Error(`Lookup failed: ${error.message}`);
    const users = list?.users || [];
    const hit = users.find((u) => (u.email || "").toLowerCase() === email);
    if (hit) userId = hit.id;
    if (users.length < 200) break;
  }
  if (userId) {
    const {
      error
    } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.password
    });
    if (error) throw new Error(error.message);
  } else {
    const {
      data: created,
      error
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.full_name ? {
        full_name: data.full_name,
        display_name: data.full_name
      } : {}
    });
    if (error) throw new Error(error.message);
    userId = created?.user?.id;
    if (!userId) throw new Error("Failed to create user");
  }
  const {
    error: insErr
  } = await supabaseAdmin.from("user_roles").insert({
    user_id: userId,
    role: "admin"
  });
  if (insErr && !/duplicate|unique/i.test(insErr.message)) {
    throw new Error(insErr.message);
  }
  return {
    ok: true,
    user_id: userId
  };
});
const setAdminPassword_createServerFn_handler = createServerRpc({
  id: "d2b27083bbb30769e31d762ae698178df643c755fca2fe92efce05d347cf5e8a",
  name: "setAdminPassword",
  filename: "src/server/admin-team.functions.ts"
}, (opts) => setAdminPassword.__executeServer(opts));
const setAdminPassword = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  user_id: z.string().uuid(),
  password: z.string().min(8)
}).parse(d)).handler(setAdminPassword_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
    password: data.password
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const sendAdminPasswordReset_createServerFn_handler = createServerRpc({
  id: "d05505b209fbcec1efdc32a7133ad7faf1db5e66b0720ed7cd6640020c4851a5",
  name: "sendAdminPasswordReset",
  filename: "src/server/admin-team.functions.ts"
}, (opts) => sendAdminPasswordReset.__executeServer(opts));
const sendAdminPasswordReset = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  email: z.string().email()
}).parse(d)).handler(sendAdminPasswordReset_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: data.email.trim().toLowerCase()
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const UUID = z.string().uuid();
const grantAdmin_createServerFn_handler = createServerRpc({
  id: "557134d69be0875c7502382a6a37b9427b65f248b03f22baa19c81bb31c4c8e5",
  name: "grantAdmin",
  filename: "src/server/admin-team.functions.ts"
}, (opts) => grantAdmin.__executeServer(opts));
const grantAdmin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  identifier: z.string().min(3)
}).parse(d)).handler(grantAdmin_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const raw = data.identifier.trim();
  let targetId = null;
  if (UUID.safeParse(raw).success) {
    targetId = raw;
  } else if (raw.includes("@")) {
    const email = raw.toLowerCase();
    for (let page = 1; page <= 10 && !targetId; page++) {
      const {
        data: list,
        error
      } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200
      });
      if (error) throw new Error(`Lookup failed: ${error.message}`);
      const users = list?.users || [];
      const hit = users.find((u) => (u.email || "").toLowerCase() === email);
      if (hit) targetId = hit.id;
      if (users.length < 200) break;
    }
    if (!targetId) throw new Error(`No user found with email ${email}. They must sign up at /auth first.`);
  } else {
    throw new Error("Provide a user UUID or email address.");
  }
  const {
    error: insErr
  } = await supabaseAdmin.from("user_roles").insert({
    user_id: targetId,
    role: "admin"
  });
  if (insErr && !/duplicate|unique/i.test(insErr.message)) {
    throw new Error(insErr.message);
  }
  return {
    ok: true,
    user_id: targetId
  };
});
const revokeAdmin_createServerFn_handler = createServerRpc({
  id: "0c129d6bd923c4f8404b9df18bac9feb6db7d9a42c4ebfac9bc676d84b2838d8",
  name: "revokeAdmin",
  filename: "src/server/admin-team.functions.ts"
}, (opts) => revokeAdmin.__executeServer(opts));
const revokeAdmin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  user_id: z.string().uuid()
}).parse(d)).handler(revokeAdmin_createServerFn_handler, async ({
  data,
  context
}) => {
  const callerId = context.userId;
  await assertAdmin(callerId);
  if (data.user_id === callerId) {
    throw new Error("You can't remove your own admin role. Ask another admin.");
  }
  const {
    count
  } = await supabaseAdmin.from("user_roles").select("*", {
    count: "exact",
    head: true
  }).eq("role", "admin");
  if ((count ?? 0) <= 1) {
    throw new Error("Refusing to remove the last admin.");
  }
  const {
    error
  } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id).eq("role", "admin");
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  createAdminUser_createServerFn_handler,
  getAdminIdentity_createServerFn_handler,
  grantAdmin_createServerFn_handler,
  listAdmins_createServerFn_handler,
  revokeAdmin_createServerFn_handler,
  sendAdminPasswordReset_createServerFn_handler,
  setAdminPassword_createServerFn_handler
};
