/**
 * Social URL validator.
 *
 * For Facebook / Instagram / YouTube / X / TikTok / LinkedIn / Pinterest URLs:
 *   1. Normalize the URL into the platform's canonical "working" shape
 *      (add www, switch youtube /c|/user → @handle, strip tracking params).
 *   2. Follow redirects with a real-browser User-Agent and check whether
 *      the final URL is a login wall, "page not found", or the actual profile.
 *   3. Return the working URL when one exists, plus a status so callers can
 *      surface broken links.
 *
 * Server-only: uses fetch with redirect: "follow", which works fine on the
 * Cloudflare Worker runtime.
 */

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "youtube"
  | "x"
  | "twitter"
  | "tiktok"
  | "linkedin"
  | "pinterest"
  | "unknown";

export type SocialValidationStatus =
  | "ok"
  | "rewritten"
  | "redirect_to_login"
  | "not_found"
  | "blocked"
  | "network_error"
  | "invalid";

export type SocialValidationResult = {
  input: string;
  platform: SocialPlatform;
  workingUrl: string | null;
  finalUrl: string | null;
  status: SocialValidationStatus;
  httpStatus: number | null;
  reason?: string;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function detectPlatform(host: string): SocialPlatform {
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

/** Strip tracking params and force https + www where the platform expects it. */
function canonicalize(rawUrl: string): { url: URL; platform: SocialPlatform } | null {
  let u: URL;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  u.protocol = "https:";

  const platform = detectPlatform(u.hostname);

  // Strip tracking params
  const stripPrefixes = ["utm_", "fbclid", "igshid", "_ga", "mc_"];
  for (const k of [...u.searchParams.keys()]) {
    if (stripPrefixes.some((p) => k.toLowerCase().startsWith(p))) u.searchParams.delete(k);
  }

  switch (platform) {
    case "facebook": {
      // fb.com → facebook.com, always www
      u.hostname = "www.facebook.com";
      // /pg/Name → /Name
      u.pathname = u.pathname.replace(/^\/pg\//i, "/");
      break;
    }
    case "instagram": {
      u.hostname = "www.instagram.com";
      // ensure trailing slash on bare profile (helps consistency)
      if (/^\/[^/]+$/.test(u.pathname)) u.pathname = u.pathname + "/";
      break;
    }
    case "youtube": {
      // youtu.be/<id> → youtube.com/watch?v=<id>
      if (u.hostname === "youtu.be") {
        const id = u.pathname.replace(/^\//, "");
        u.hostname = "www.youtube.com";
        u.pathname = "/watch";
        u.searchParams.set("v", id);
      } else {
        u.hostname = "www.youtube.com";
      }
      // /c/Name or /user/Name → leave; canonical may rewrite to @handle, we'll let HTTP follow
      break;
    }
    case "x":
    case "twitter": {
      // Prefer x.com (current canonical)
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

  // Drop trailing ? if no params
  if ([...u.searchParams.keys()].length === 0) u.search = "";

  return { url: u, platform };
}

function looksLikeLogin(finalUrl: string): boolean {
  const u = (() => { try { return new URL(finalUrl); } catch { return null; } })();
  if (!u) return false;
  const p = u.pathname.toLowerCase();
  return (
    p.startsWith("/login") ||
    p.startsWith("/accounts/login") ||
    p === "/" ||
    p.startsWith("/signup") ||
    p.includes("/checkpoint") ||
    p.includes("/error") ||
    /\?next=/i.test(u.search)
  );
}

async function fetchWithUA(url: string, method: "HEAD" | "GET"): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    return res;
  } catch {
    return null;
  }
}

/**
 * Validate a single social URL. Returns the canonical/working URL when one
 * exists, or null + a status describing the failure.
 */
export async function validateSocialUrl(rawUrl: string): Promise<SocialValidationResult> {
  const norm = canonicalize(rawUrl);
  if (!norm) {
    return {
      input: rawUrl,
      platform: "unknown",
      workingUrl: null,
      finalUrl: null,
      status: "invalid",
      httpStatus: null,
      reason: "URL did not parse",
    };
  }
  const candidate = norm.url.toString();
  const platform = norm.platform;

  // HEAD first; many sites reject HEAD so fall back to GET
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
      reason: "fetch failed",
    };
  }

  const finalUrl = res.url || candidate;
  const httpStatus = res.status;

  // 404 / 410
  if (httpStatus === 404 || httpStatus === 410) {
    return { input: rawUrl, platform, workingUrl: null, finalUrl, status: "not_found", httpStatus };
  }
  // FB/IG often 200 with login wall, or 302 to /login
  if (looksLikeLogin(finalUrl) && finalUrl !== candidate) {
    // On Facebook a profile redirect to / or /login means the page no longer exists publicly
    if (platform === "facebook" || platform === "instagram") {
      return {
        input: rawUrl,
        platform,
        workingUrl: null,
        finalUrl,
        status: "redirect_to_login",
        httpStatus,
        reason: `final URL ${finalUrl} looks like login/landing`,
      };
    }
  }
  // 401/403 from public profile = blocked but likely live (IG often blocks server fetch).
  // We treat the canonical URL as working so footer links still point somewhere real.
  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 429) {
    const rewritten = candidate !== rawUrl.trim();
    return {
      input: rawUrl,
      platform,
      workingUrl: candidate,
      finalUrl,
      status: rewritten ? "rewritten" : "blocked",
      httpStatus,
      reason: `platform returned ${httpStatus} (likely bot block, treating as live)`,
    };
  }
  if (httpStatus >= 200 && httpStatus < 400) {
    // If platform redirected us to a different *profile* URL (e.g. youtube /c/X → /@x),
    // adopt the final URL.
    let working = candidate;
    try {
      const finalParsed = new URL(finalUrl);
      const candidateParsed = new URL(candidate);
      if (
        detectPlatform(finalParsed.hostname) === platform &&
        finalParsed.pathname !== candidateParsed.pathname &&
        !looksLikeLogin(finalUrl)
      ) {
        working = finalUrl;
      }
    } catch { /* keep candidate */ }

    const rewritten = working !== rawUrl.trim();
    return {
      input: rawUrl,
      platform,
      workingUrl: working,
      finalUrl,
      status: rewritten ? "rewritten" : "ok",
      httpStatus,
    };
  }
  return {
    input: rawUrl,
    platform,
    workingUrl: null,
    finalUrl,
    status: "network_error",
    httpStatus,
    reason: `unexpected status ${httpStatus}`,
  };
}

export async function validateSocialUrls(urls: string[]): Promise<SocialValidationResult[]> {
  // Run with limited concurrency to avoid rate limits
  const out: SocialValidationResult[] = [];
  const concurrency = 4;
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((u) => validateSocialUrl(u)));
    out.push(...results);
  }
  return out;
}
