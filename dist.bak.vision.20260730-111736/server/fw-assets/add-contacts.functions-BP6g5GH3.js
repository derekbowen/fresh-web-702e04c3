import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { z } from "zod";
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
const InputSchema = z.object({
  raw: z.string().min(1).max(5e5),
  lists: z.array(z.enum(["host", "renter"])).min(1),
  scheduleDrip: z.boolean().default(true)
});
function parseLines(raw) {
  const rows = [];
  const invalid = [];
  const seen = /* @__PURE__ */ new Set();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const lineRaw of raw.split(/\r?\n/)) {
    const line = lineRaw.trim();
    if (!line) continue;
    let email = "";
    let name = null;
    const angle = line.match(/^(.*?)<([^>]+)>$/);
    if (angle) {
      name = angle[1].trim().replace(/,$/, "") || null;
      email = angle[2].trim();
    } else {
      const parts = line.split(/[,\t;]/).map((p) => p.trim()).filter(Boolean);
      email = parts[0] ?? "";
      name = parts[1] ?? null;
    }
    email = email.toLowerCase();
    if (!emailRe.test(email) || email.length > 255) {
      invalid.push(line);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    rows.push({
      email,
      name: name && name.length <= 120 ? name : null
    });
  }
  return {
    rows,
    invalid
  };
}
const addContacts_createServerFn_handler = createServerRpc({
  id: "20fb37e44ef09307e4c93b5261b25fd5f39a9483ac83d961a77183c66ff26d61",
  name: "addContacts",
  filename: "src/server/add-contacts.functions.ts"
}, (opts) => addContacts.__executeServer(opts));
const addContacts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => InputSchema.parse(d)).handler(addContacts_createServerFn_handler, async ({
  data,
  context
}) => {
  const result = {
    ok: false,
    parsed: 0,
    invalid: [],
    perList: {
      host: {
        added: 0,
        existing: 0,
        scheduled: 0,
        skipped: 0
      },
      renter: {
        added: 0,
        existing: 0,
        scheduled: 0,
        skipped: 0
      }
    }
  };
  try {
    const {
      supabaseAdmin
    } = await import("./client.server-D5ro3rAQ.js");
    const {
      userId
    } = context;
    const {
      data: roleRow
    } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return {
      ...result,
      error: "Not authorized"
    };
    const {
      rows,
      invalid
    } = parseLines(data.raw);
    result.parsed = rows.length;
    result.invalid = invalid.slice(0, 20);
    if (rows.length === 0) return {
      ...result,
      ok: true,
      error: "No valid emails found"
    };
    for (const list of data.lists) {
      const table = list === "host" ? "host_subscribers" : "renter_subscribers";
      for (const r of rows) {
        const {
          data: existing
        } = await supabaseAdmin.from(table).select("id, status, sequence_scheduled").ilike("email", r.email).maybeSingle();
        let subscriberId = existing?.id ?? null;
        if (existing) {
          result.perList[list].existing += 1;
          if (existing.status !== "active") {
            result.perList[list].skipped += 1;
            continue;
          }
        } else {
          const {
            data: ins,
            error
          } = await supabaseAdmin.from(table).insert({
            email: r.email,
            name: r.name
          }).select("id").single();
          if (error || !ins) {
            result.perList[list].skipped += 1;
            continue;
          }
          subscriberId = ins.id;
          result.perList[list].added += 1;
        }
        if (data.scheduleDrip && subscriberId && !existing?.sequence_scheduled) {
          try {
            if (list === "host") {
              const {
                scheduleSequence
              } = await import("./host-drip.server-BcWebfNA.js");
              await scheduleSequence(subscriberId);
            } else {
              const {
                scheduleSequence
              } = await import("./renter-drip.server-C0_mcvap.js");
              await scheduleSequence(subscriberId);
            }
            result.perList[list].scheduled += 1;
          } catch (e) {
            console.error("[add-contacts] schedule failed", list, r.email, e);
          }
        }
      }
    }
    return {
      ...result,
      ok: true
    };
  } catch (e) {
    return {
      ...result,
      ok: false,
      error: e?.message ?? String(e)
    };
  }
});
export {
  addContacts_createServerFn_handler
};
