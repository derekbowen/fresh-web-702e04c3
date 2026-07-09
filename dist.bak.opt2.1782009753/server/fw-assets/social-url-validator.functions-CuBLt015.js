import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
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
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
function detectPlatform(host) {
  const h = host.replace(/^www\./, "").toLowerCase();
  if (h === "facebook.com" || h === "fb.com" || h.endsWith(".facebook.com")) return "facebook";
  if (h === "instagram.com" || h.endsWith(".instagram.com")) return "instagram";
  if (h === "youtube.com" || h === "youtu.be" || h.endsWith(".youtube.com")) return "youtube";
  if (h === "x.com") return "x";
  if (h === "twitter.com") return "twitter";
  if (h === "tiktok.com" || h.endsWith(".tiktok.com")) return "tiktok";
  if (h === "linkedin.com" || h.endsWith(".linkedin.com")) return "linkedin";
  if (h === "pinterest.com" || h.endsWith(".pinterest.com")) return "pinterest";
  return "unknown";
}
function canonicalize(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  u.protocol = "https:";
  const platform = detectPlatform(u.hostname);
  const stripPrefixes = ["utm_", "fbclid", "igshid", "_ga", "mc_"];
  for (const k of [...u.searchParams.keys()]) {
    if (stripPrefixes.some((p) => k.toLowerCase().startsWith(p))) u.searchParams.delete(k);
  }
  switch (platform) {
    case "facebook": {
      u.hostname = "www.facebook.com";
      u.pathname = u.pathname.replace(/^\/pg\//i, "/");
      break;
    }
    case "instagram": {
      u.hostname = "www.instagram.com";
      if (/^\/[^/]+$/.test(u.pathname)) u.pathname = u.pathname + "/";
      break;
    }
    case "youtube": {
      if (u.hostname === "youtu.be") {
        const id = u.pathname.replace(/^\//, "");
        u.hostname = "www.youtube.com";
        u.pathname = "/watch";
        u.searchParams.set("v", id);
      } else {
        u.hostname = "www.youtube.com";
      }
      break;
    }
    case "x":
    case "twitter": {
      u.hostname = "x.com";
      break;
    }
    case "tiktok":
      u.hostname = "www.tiktok.com";
      break;
    case "linkedin":
      u.hostname = "www.linkedin.com";
      break;
    case "pinterest":
      u.hostname = "www.pinterest.com";
      break;
  }
  if ([...u.searchParams.keys()].length === 0) u.search = "";
  return { url: u, platform };
}
function looksLikeLogin(finalUrl) {
  const u = (() => {
    try {
      return new URL(finalUrl);
    } catch {
      return null;
    }
  })();
  if (!u) return false;
  const p = u.pathname.toLowerCase();
  return p.startsWith("/login") || p.startsWith("/accounts/login") || p === "/" || p.startsWith("/signup") || p.includes("/checkpoint") || p.includes("/error") || /\?next=/i.test(u.search);
}
async function fetchWithUA(url, method) {
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    return res;
  } catch {
    return null;
  }
}
async function validateSocialUrl(rawUrl) {
  const norm = canonicalize(rawUrl);
  if (!norm) {
    return {
      input: rawUrl,
      platform: "unknown",
      workingUrl: null,
      finalUrl: null,
      status: "invalid",
      httpStatus: null,
      reason: "URL did not parse"
    };
  }
  const candidate = norm.url.toString();
  const platform = norm.platform;
  let res = await fetchWithUA(candidate, "HEAD");
  if (!res || res.status >= 400 || res.status === 405) {
    res = await fetchWithUA(candidate, "GET");
  }
  if (!res) {
    return {
      input: rawUrl,
      platform,
      workingUrl: null,
      finalUrl: null,
      status: "network_error",
      httpStatus: null,
      reason: "fetch failed"
    };
  }
  const finalUrl = res.url || candidate;
  const httpStatus = res.status;
  if (httpStatus === 404 || httpStatus === 410) {
    return { input: rawUrl, platform, workingUrl: null, finalUrl, status: "not_found", httpStatus };
  }
  if (looksLikeLogin(finalUrl) && finalUrl !== candidate) {
    if (platform === "facebook" || platform === "instagram") {
      return {
        input: rawUrl,
        platform,
        workingUrl: null,
        finalUrl,
        status: "redirect_to_login",
        httpStatus,
        reason: `final URL ${finalUrl} looks like login/landing`
      };
    }
  }
  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 429) {
    const rewritten = candidate !== rawUrl.trim();
    return {
      input: rawUrl,
      platform,
      workingUrl: candidate,
      finalUrl,
      status: rewritten ? "rewritten" : "blocked",
      httpStatus,
      reason: `platform returned ${httpStatus} (likely bot block, treating as live)`
    };
  }
  if (httpStatus >= 200 && httpStatus < 400) {
    let working = candidate;
    try {
      const finalParsed = new URL(finalUrl);
      const candidateParsed = new URL(candidate);
      if (detectPlatform(finalParsed.hostname) === platform && finalParsed.pathname !== candidateParsed.pathname && !looksLikeLogin(finalUrl)) {
        working = finalUrl;
      }
    } catch {
    }
    const rewritten = working !== rawUrl.trim();
    return {
      input: rawUrl,
      platform,
      workingUrl: working,
      finalUrl,
      status: rewritten ? "rewritten" : "ok",
      httpStatus
    };
  }
  return {
    input: rawUrl,
    platform,
    workingUrl: null,
    finalUrl,
    status: "network_error",
    httpStatus,
    reason: `unexpected status ${httpStatus}`
  };
}
async function validateSocialUrls(urls) {
  const out = [];
  const concurrency = 4;
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((u) => validateSocialUrl(u)));
    out.push(...results);
  }
  return out;
}
const InputSchema = z.object({
  urls: z.array(z.string().min(1).max(500)).min(1).max(50)
});
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const validateSocialUrlsFn_createServerFn_handler = createServerRpc({
  id: "72bc10a4bba57c55fb85cc14e6562cbbb1e0616b73c26bfd99034d5612eb4fe6",
  name: "validateSocialUrlsFn",
  filename: "src/server/social-url-validator.functions.ts"
}, (opts) => validateSocialUrlsFn.__executeServer(opts));
const validateSocialUrlsFn = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => InputSchema.parse(data)).handler(validateSocialUrlsFn_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const results = await validateSocialUrls(data.urls);
  return {
    results
  };
});
export {
  validateSocialUrlsFn_createServerFn_handler
};
