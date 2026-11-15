#!/usr/bin/env node
/**
 * test:failed-reads — a failed database read must answer 503, never 404, 301
 * or a 200 with an empty sitemap.
 *
 * NEEDS A PRIOR BUILD. This drives the built server (dist/server/server.js),
 * not the source:
 *
 *   VITE_SUPABASE_URL=http://127.0.0.1:54399 VITE_SUPABASE_PUBLISHABLE_KEY=stub-anon-key \
 *   VITE_SUPABASE_PROJECT_ID=stub NODE_OPTIONS=--max-old-space-size=3072 npm run build
 *   npm run test:failed-reads
 *
 * What it does. It starts a stub of the Supabase REST API (PostgREST) on a
 * random 127.0.0.1 port, points SUPABASE_URL at it BEFORE importing the server,
 * and calls `server.fetch(new Request(...))` in-process. Nothing leaves this
 * machine: no real database, no network. The stub records every request it
 * receives and can be switched between
 *
 *   healthy           small fixture rows
 *   http-500          every request answers 500
 *   connection-reset  every connection is reset before a response
 *   hang              the request is accepted and never answered
 *
 * Why it exists: Cloudflare caches /p/* for 600 s whatever the status, so a
 * few seconds of database trouble used to become ten minutes of cached 404s
 * (and 301s to /p/become-a-host) for live pages, plus a row in content_404_log
 * for each. See src/lib/failed-read.ts.
 *
 * It also renders the host_acq_city intent fixtures (src/lib/city-intent.ts)
 * against the healthy stub — HOST with and without listed pools, RENTER with
 * exact-city pools, nearby-only pools and none — and checks headings, titles,
 * CTAs, the empty-inventory notice and that every number in the hero intro and
 * inventory section is a count, price, capacity or distance from the fixtures.
 *
 * Exit code: 0 when every check passes, 1 otherwise. FAILED_READS_DIST can
 * point at another build directory (used to show the checks fail on old code).
 */
import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, process.env.FAILED_READS_DIST || "dist");
const SERVER_ENTRY = resolve(DIST, "server/server.js");

/** Read timeout the app is given for this run (ms). Small so `hang` is quick. */
const READ_TIMEOUT_MS = 900;
/** A 503 must arrive within this long after a request starts in a failure mode. */
const FAILURE_BUDGET_MS = READ_TIMEOUT_MS + 4000;
/** After this long without any response the request is recorded as hung (status 0). */
const REQUEST_DEADLINE_MS = FAILURE_BUDGET_MS + 2000;

// ───────────────────────────── fixtures ─────────────────────────────────────

const NOW = "2026-10-01T00:00:00+00:00";
const TITLE = "Fixture Page Title Zebra-4417";
const BLOG_TITLE = "Fixture Blog Title Quokka-9052";
const ES_TITLE = "Fixture Pagina Titulo Vicuna-3308";

/** Eligible listings for the intent fixtures: both in Tempe, AZ. */
const INTENT_LISTINGS = [
  {
    sharetribe_id: "00000000-0000-4000-8000-0000000000c2",
    slug: "fixture-tempe-pool-one",
    title: "Fixture Tempe Pool One",
    city: "Tempe",
    city_slug: "tempe",
    state_code: "AZ",
    price_amount: 10000,
    price_currency: "USD",
    primary_image_url: "https://img.example.invalid/tempe-one.jpg",
    capacity: 12,
    amenities: [],
    latitude: 33.43,
    longitude: -111.93,
    updated_at: NOW,
    state: "published",
    is_deleted: false,
  },
  {
    sharetribe_id: "00000000-0000-4000-8000-0000000000c3",
    slug: "fixture-tempe-pool-two",
    title: "Fixture Tempe Pool Two",
    city: "Tempe",
    city_slug: "tempe",
    state_code: "AZ",
    price_amount: 8000,
    price_currency: "USD",
    primary_image_url: "https://img.example.invalid/tempe-two.jpg",
    capacity: 8,
    amenities: [],
    latitude: 33.41,
    longitude: -111.95,
    updated_at: NOW,
    state: "published",
    is_deleted: false,
  },
];

const contentPage = (over) => ({
  id: "00000000-0000-4000-8000-000000000001",
  slug: null,
  url_path: null,
  source_url: "",
  template_type: "resource",
  category: "guides",
  locale: "en",
  title: null,
  seo_title: null,
  seo_description: "Fixture description.",
  hero_image_url: null,
  body_markdown: "## Fixture heading\n\nFixture body paragraph.",
  raw_html: null,
  status: "published",
  scraped_at: null,
  updated_at: NOW,
  created_at: NOW,
  content_refreshed_at: NOW,
  in_sitemap: true,
  redirect_to: null,
  legacy_slugs: [],
  priority: 0,
  hreflang_group: null,
  ...over,
});

const FIXTURES = {
  content_pages: [
    contentPage({
      id: "00000000-0000-4000-8000-000000000001",
      slug: "fixture-live-page",
      url_path: "/p/fixture-live-page",
      title: TITLE,
      legacy_slugs: ["fixture-old-slug", "fixture-old-{slug}"],
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000002",
      slug: "fixture-redirect-row",
      url_path: "/p/fixture-redirect-row",
      status: "redirect",
      redirect_to: "fixture-live-page",
      in_sitemap: false,
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000003",
      slug: "es/fixture-pagina",
      url_path: "/p/es/fixture-pagina",
      title: ES_TITLE,
      template_type: "spanish_resource",
      locale: "es",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000004",
      slug: "become-a-swimming-pool-host-akron-oh",
      url_path: "/p/become-a-swimming-pool-host-akron-oh",
      title: "Fixture host page Akron",
      template_type: "host_acq_city",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000005",
      slug: "become-a-swimming-pool-host-dayton-oh",
      url_path: "/p/become-a-swimming-pool-host-dayton-oh",
      title: "Fixture host page Dayton",
      template_type: "host_acq_city",
    }),
    // ── host_acq_city intent fixtures ────────────────────────────────────────
    // HOST with pools listed in the city (Tempe has two eligible listings).
    contentPage({
      id: "00000000-0000-4000-8000-000000000011",
      slug: "become-a-swimming-pool-host-tempe-az",
      url_path: "/p/become-a-swimming-pool-host-tempe-az",
      title: "Become a Pool Host in Tempe, AZ",
      seo_title: "Become a swimming pool host in Tempe | Earn $3k+/mo",
      template_type: "host_acq_city",
    }),
    // RENTER with exact-city pools — same city as the HOST page above.
    contentPage({
      id: "00000000-0000-4000-8000-000000000012",
      slug: "tempe-az",
      url_path: "/p/tempe-az",
      title: "Pool Rental in Tempe, AZ",
      seo_title: "Pool Rental in Tempe, AZ | Hourly Backyard Pools",
      seo_description: "Browse Tempe backyard pools with photos, hourly prices, and reviews.",
      template_type: "host_acq_city",
      body_markdown:
        "# Pool Rental in Tempe, AZ\n\nFixture host body Tempe.\n\n[Search](/s?address=Tempe%2C+AZ)",
    }),
    // RENTER with only nearby pools (Mesa has none; Tempe's are a few miles away).
    contentPage({
      id: "00000000-0000-4000-8000-000000000013",
      slug: "mesa-az",
      url_path: "/p/mesa-az",
      title: "Pool Rental in Mesa, AZ",
      template_type: "host_acq_city",
      body_markdown: "## Fixture host body Mesa\n\nFixture paragraph.",
    }),
    // RENTER with no pools in or near the city, on a bare slug: the state comes
    // from the title, and there is no cities row (no centroid, exact match only).
    contentPage({
      id: "00000000-0000-4000-8000-000000000014",
      slug: "chapel-hill",
      url_path: "/p/chapel-hill",
      title: "Pool Rental in Chapel Hill, NC",
      template_type: "host_acq_city",
      body_markdown: "## Fixture host body Chapel Hill\n\nFixture paragraph.",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000006",
      slug: "rent-out-your-pool-uk",
      url_path: "/p/rent-out-your-pool-uk",
      title: "Fixture UK page",
      template_type: "country_launch",
    }),
  ],
  cities: [
    {
      slug: "tempe",
      name: "Tempe",
      state: "Arizona",
      state_code: "AZ",
      description: null,
      latitude: 33.4255,
      longitude: -111.94,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
    {
      slug: "mesa",
      name: "Mesa",
      state: "Arizona",
      state_code: "AZ",
      description: null,
      latitude: 33.4152,
      longitude: -111.8315,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
    {
      slug: "akron",
      name: "Akron",
      state: "Ohio",
      state_code: "OH",
      description: null,
      latitude: 41.08,
      longitude: -81.51,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
  ],
  blog_posts: [
    {
      id: "00000000-0000-4000-8000-0000000000b1",
      slug: "fixture-blog-post",
      title: BLOG_TITLE,
      excerpt: "Fixture excerpt.",
      content: "Fixture blog body.",
      cover_image_url: null,
      author: null,
      seo_title: null,
      seo_description: null,
      is_published: true,
      published_at: NOW,
      updated_at: NOW,
      topic: null,
      tldr_bullets: null,
      related_slugs: null,
    },
  ],
  synced_listings: [
    {
      slug: "fixture-listing",
      sharetribe_id: "00000000-0000-4000-8000-0000000000c1",
      primary_image_url: null,
      title: "Fixture listing",
      updated_at: NOW,
      state: "published",
      is_deleted: false,
    },
    ...INTENT_LISTINGS,
  ],
  service_categories: [
    {
      slug: "pool-builders",
      name: "Pool Builder",
      plural_name: "Pool Builders",
      icon: null,
      hero_image_url: null,
      intro_markdown: null,
      seo_title: null,
      seo_description: null,
      sort_order: 1,
      is_published: true,
      updated_at: NOW,
    },
  ],
  providers: [
    {
      id: "00000000-0000-4000-8000-0000000000d1",
      slug: "fixture-pool-pro",
      name: "Fixture Pool Pro",
      business_type: null,
      city: "Akron",
      city_slug: "akron",
      state_code: "OH",
      logo_url: null,
      hero_image_url: null,
      description: "Fixture provider.",
      long_description: null,
      primary_category: "pool-builders",
      secondary_categories: [],
      is_featured: false,
      is_published: true,
      rating: null,
      rating_count: null,
      updated_at: NOW,
    },
  ],
  courses: [
    {
      id: "00000000-0000-4000-8000-0000000000e1",
      slug: "fixture-course",
      title: "Fixture Course",
      subtitle: null,
      description: "Fixture course description.",
      excerpt: null,
      category: "getting-started",
      language: "en",
      tier: "free",
      is_published: true,
      is_featured: false,
      duration_minutes: 5,
      embed_url: null,
      long_form_content: null,
      published_at: NOW,
      updated_at: NOW,
    },
  ],
};

// ───────────────────────── stub Supabase REST API ───────────────────────────

/**
 * What PostgREST answers for a request the database (or PostgREST itself)
 * rejects as malformed. Not a failure mode of the stub: these are input errors
 * a real server gives on every retry, and the app must not mistake them for an
 * outage when the page does not exist.
 */
class PgRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Parse a Postgres array literal (`{a,"b c","d\\"e"}`) the way Postgres does,
 * or throw 22P02 "malformed array literal" where Postgres would: an unquoted
 * element containing `{`, `}` or `"`, an empty unquoted element, a stray
 * character after a quoted element, an unterminated quote.
 */
function parsePgArray(literal) {
  const malformed = () => new PgRequestError("22P02", `malformed array literal: "${literal}"`);
  if (!literal.startsWith("{") || !literal.endsWith("}")) throw malformed();
  const body = literal.slice(1, -1);
  if (body.trim() === "") return [];
  const out = [];
  let i = 0;
  for (;;) {
    while (body[i] === " ") i++;
    let el = "";
    if (body[i] === '"') {
      i++;
      while (i < body.length && body[i] !== '"') {
        if (body[i] === "\\") i++;
        if (i >= body.length) throw malformed();
        el += body[i++];
      }
      if (body[i] !== '"') throw malformed();
      i++;
      while (body[i] === " ") i++;
    } else {
      while (i < body.length && body[i] !== ",") {
        if (body[i] === "{" || body[i] === "}" || body[i] === '"') throw malformed();
        if (body[i] === "\\") i++;
        if (i >= body.length) throw malformed();
        el += body[i++];
      }
      el = el.trim();
      if (el === "") throw malformed();
    }
    out.push(el);
    if (i >= body.length) return out;
    if (body[i] !== ",") throw malformed();
    i++;
  }
}

/** Split a PostgREST logic tree `(a.eq.x,b.cs.{y,z})` on top-level commas, as PostgREST does. */
function splitLogicTree(expr) {
  const inner = expr.replace(/^\(|\)$/g, "");
  const parts = [];
  let depth = 0;
  let quoted = false;
  let cur = "";
  for (const c of inner) {
    if (c === '"') quoted = !quoted;
    else if (!quoted && (c === "{" || c === "(")) depth++;
    else if (!quoted && (c === "}" || c === ")")) depth--;
    if (c === "," && depth === 0 && !quoted) {
      parts.push(cur);
      cur = "";
    } else cur += c;
  }
  parts.push(cur);
  // Brackets and quotes must balance, and every alternative must be
  // `column.operator.value` (or a nested and()/or()).
  let balance = 0;
  for (const c of inner.replace(/"[^"]*"/g, "")) {
    if (c === "(" || c === "{") balance++;
    else if (c === ")" || c === "}") balance--;
    if (balance < 0) break;
  }
  const unbalanced = balance !== 0 || quoted;
  for (const part of unbalanced ? [""] : parts) {
    if (!/^(?:(?:and|or)\(|[A-Za-z_][\w]*\.(?:not\.)?[a-z]+\.)/.test(part)) {
      throw new PgRequestError(
        "PGRST100",
        `"failed to parse logic tree (${inner})" (line 1, column ${inner.indexOf(part) + 1})`,
      );
    }
  }
  return parts;
}

/** Reject, before any row is looked at, a filter PostgREST or Postgres would reject. */
function validateFilter(expr) {
  const bare = expr.startsWith("not.") ? expr.slice(4) : expr;
  if (bare.startsWith("cs.")) parsePgArray(bare.slice(3));
}

/** Evaluate one PostgREST filter (`eq.x`, `in.(a,b)`, `like.a%`, `is.null`, `cs.{a}`, `not.…`). */
function matches(value, expr) {
  if (expr.startsWith("not.")) return !matches(value, expr.slice(4));
  const dot = expr.indexOf(".");
  const op = expr.slice(0, dot);
  const arg = expr.slice(dot + 1);
  const pattern = (p, flags) =>
    new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/[%*]/g, ".*")}$`, flags);
  switch (op) {
    case "eq":
      return String(value) === arg;
    case "in":
      return arg
        .replace(/^\(|\)$/g, "")
        .split(",")
        .map((s) => s.replace(/^"|"$/g, ""))
        .includes(String(value));
    case "like":
      return typeof value === "string" && pattern(arg, "").test(value);
    case "ilike":
      return typeof value === "string" && pattern(arg, "i").test(value);
    case "is":
      return arg === "null" ? value === null || value === undefined : String(value) === arg;
    case "cs":
      return Array.isArray(value) && parsePgArray(arg).every((s) => value.includes(s));
    default:
      return true; // an operator this stub does not model: do not filter on it
  }
}

const NON_FILTER_PARAMS = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);

function query(table, url) {
  let rows = FIXTURES[table] ?? [];
  // Malformed filters are rejected whether or not any row would be compared.
  for (const [key, expr] of url.searchParams) {
    if (NON_FILTER_PARAMS.has(key)) continue;
    if (key === "or") {
      for (const part of splitLogicTree(expr)) validateFilter(part.slice(part.indexOf(".") + 1));
    } else validateFilter(expr);
  }
  for (const [key, expr] of url.searchParams) {
    if (NON_FILTER_PARAMS.has(key)) continue;
    if (key === "or") {
      const alts = splitLogicTree(expr).map((s) => {
        const i = s.indexOf(".");
        return [s.slice(0, i), s.slice(i + 1)];
      });
      rows = rows.filter((r) => alts.some(([col, e]) => !(col in r) || matches(r[col], e)));
      continue;
    }
    rows = rows.filter((r) => !(key in r) || matches(r[key], expr));
  }
  const total = rows.length;
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : rows.length;
  return { rows: rows.slice(offset, offset + limit), total };
}

function startStub() {
  const state = { mode: "healthy", requests: [], held: new Set() };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://stub");
    const table = url.pathname.replace(/^\/rest\/v1\//, "").replace(/^rpc\//, "rpc:");
    state.requests.push({
      at: Date.now(),
      mode: state.mode,
      method: req.method,
      table,
      search: url.search,
    });
    req.resume(); // drain any body

    if (state.mode === "hang") {
      state.held.add(req.socket);
      req.socket.on("close", () => state.held.delete(req.socket));
      return; // never answered
    }
    if (state.mode === "connection-reset") {
      if (typeof req.socket.resetAndDestroy === "function") req.socket.resetAndDestroy();
      else req.socket.destroy();
      return;
    }
    if (state.mode === "http-500") {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "stub: internal server error", code: "XX000" }));
      return;
    }

    // healthy
    if (req.method === "GET" || req.method === "HEAD") {
      let found;
      try {
        found = query(table, url);
      } catch (err) {
        if (!(err instanceof PgRequestError)) throw err;
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: err.code, message: err.message, details: null, hint: null }));
        return;
      }
      const { rows, total } = found;
      const range = total === 0 ? "*/0" : `0-${Math.max(rows.length - 1, 0)}/${total}`;
      const single = (req.headers.accept || "").includes("vnd.pgrst.object");
      if (single && rows.length !== 1) {
        res.writeHead(406, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "PGRST116",
            message: "JSON object requested, multiple (or no) rows returned",
            details: `The result contains ${rows.length} rows`,
            hint: null,
          }),
        );
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json", "Content-Range": range });
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(single ? rows[0] : rows));
      return;
    }
    // writes (content_404_log, redirect_log, …) and RPC calls
    res.writeHead(table.startsWith("rpc:") ? 200 : 201, { "Content-Type": "application/json" });
    res.end("[]");
  });

  return new Promise((ready) => {
    server.listen(0, "127.0.0.1", () => {
      ready({
        url: `http://127.0.0.1:${server.address().port}`,
        requests: state.requests,
        get mode() {
          return state.mode;
        },
        setMode(mode) {
          state.mode = mode;
          // Leaving `hang`: let go of everything that was being held.
          for (const socket of state.held) socket.destroy();
          state.held.clear();
        },
        close() {
          for (const socket of state.held) socket.destroy();
          server.closeAllConnections?.();
          return new Promise((done) => server.close(done));
        },
      });
    });
  });
}

// ───────────────────────────── checks ───────────────────────────────────────

const results = [];
function check(phase, name, ok, detail = "") {
  results.push({ phase, name, ok: !!ok, detail });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const countLocs = (xml) => (xml.match(/<loc>/g) || []).length;

if (!existsSync(SERVER_ENTRY)) {
  console.error(`test:failed-reads needs a build first: ${SERVER_ENTRY} does not exist.`);
  console.error("Run the build command in this file's header, then re-run.");
  process.exit(1);
}

const stub = await startStub();

// Environment for the app. Dummy values only; they never leave this process.
process.env.SUPABASE_URL = stub.url;
process.env.SUPABASE_SERVICE_ROLE_KEY = "stub-service-role-key";
process.env.SUPABASE_PUBLISHABLE_KEY = "stub-publishable-key";
process.env.SUPABASE_READ_TIMEOUT_MS = String(READ_TIMEOUT_MS);

// The app logs every failed read and every 404; keep this run's output to the table.
const quiet = process.env.FAILED_READS_VERBOSE !== "1";
const realConsole = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  log: console.log,
};
if (quiet) for (const k of Object.keys(realConsole)) console[k] = () => {};
const say = (...a) => realConsole.log(...a);

// Start cold in `hang`: the very first request must not need a warm cache.
stub.setMode("hang");
const { default: server } = await import(pathToFileURL(SERVER_ENTRY).href);

/** server.fetch with a deadline, so a request that hangs is a failed check, not a hung harness. */
async function fetchWithDeadline(request) {
  let timer;
  const deadline = new Promise((r) => {
    timer = setTimeout(() => r(null), REQUEST_DEADLINE_MS);
  });
  const answered = (async () => {
    const res = await server.fetch(request);
    return { status: res.status, headers: res.headers, body: await res.text() };
  })();
  answered.catch(() => {});
  try {
    return (
      (await Promise.race([answered, deadline])) ?? {
        status: 0,
        headers: new Headers(),
        body: "",
        hung: true,
      }
    );
  } finally {
    clearTimeout(timer);
  }
}

async function get(path, { host = "localhost" } = {}) {
  const started = Date.now();
  const res = await fetchWithDeadline(
    new Request(`http://${host}${path}`, { headers: { accept: "text/html,*/*" } }),
  );
  return { ...res, ms: Date.now() - started, path };
}

/**
 * Call lookupContentPage the way the browser does on a client-side navigation:
 * through the server-function RPC endpoint. The function id is read from the
 * build's server-function manifest and the payload is encoded with seroval,
 * the serializer TanStack Start itself uses.
 */
const LOOKUP_FN_ID = readFileSync(SERVER_ENTRY, "utf8").match(
  /"([0-9a-f]{64})":\s*\{\s*functionName:\s*"lookupContentPage_createServerFn_handler"/,
)?.[1];
async function rpcLookup(slug) {
  if (!LOOKUP_FN_ID)
    return {
      status: 0,
      headers: new Headers(),
      result: null,
      note: "lookupContentPage id not found in the build",
    };
  const { toJSONAsync, fromCrossJSON } = await import("seroval");
  const payload = JSON.stringify(await toJSONAsync({ data: { slug } }));
  const res = await fetchWithDeadline(
    new Request(
      `http://localhost/_serverFn/${LOOKUP_FN_ID}?payload=${encodeURIComponent(payload)}`,
      {
        headers: { "x-tsr-serverFn": "true", accept: "application/json" },
      },
    ),
  );
  const text = res.body;
  let result = null;
  try {
    // The envelope is { result, error, context }; `result` is what the route receives.
    result = fromCrossJSON(JSON.parse(text), { refs: new Map() })?.result ?? null;
  } catch {
    // not a serialized server-function result
  }
  return { status: res.status, headers: res.headers, result, note: text.slice(0, 120) };
}

const requestsSince = (mark) => stub.requests.slice(mark);
const logRequests = (mark) => requestsSince(mark).filter((r) => r.table === "content_404_log");
const logWrites = (mark) =>
  logRequests(mark).filter((r) => r.method !== "GET" && r.method !== "HEAD");

async function waitForLogWrite(mark, ms = 3000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (logWrites(mark).length > 0) return true;
    await sleep(25);
  }
  return false;
}

/** The whole contract for "this answer came from a failed read". */
function is503(r) {
  const cc = r.headers.get("cache-control") || "";
  const problems = [];
  if (r.status !== 503) problems.push(`status ${r.status}`);
  if (!r.headers.get("retry-after")) problems.push("no Retry-After");
  if (!/no-store/.test(cc)) problems.push(`Cache-Control "${cc}"`);
  if (r.headers.get("location")) problems.push(`Location ${r.headers.get("location")}`);
  if (r.ms > FAILURE_BUDGET_MS) problems.push(`took ${r.ms} ms`);
  return problems;
}
const describe = (r) =>
  r.hung
    ? `no response within ${REQUEST_DEADLINE_MS} ms`
    : `${r.status}${r.headers.get("location") ? ` -> ${r.headers.get("location")}` : ""} in ${r.ms} ms`;

const PAGES = {
  live: "/p/fixture-live-page",
  blog: "/p/fixture-blog-post",
  spanish: "/p/es/fixture-pagina",
  comparison: "/p/peerspace-vs-pool-rental-near-me-in-akron",
  comparison2: "/p/giggster-vs-pool-rental-near-me-in-akron",
  stateHub: "/p/pool-rentals-ohio",
  stateIndex: "/p/pool-rentals",
  provider: "/p/pool-pros/fixture-pool-pro",
  category: "/p/pool-pros/c/pool-builders",
  categoryState: "/p/pool-pros/c/pool-builders/oh",
  categoryCity: "/p/pool-pros/c/pool-builders/oh/akron",
  course: "/p/course/fixture-course",
  // /p/ hubs whose failed reads used to render an empty or truncated 200.
  allLocations: "/p/all-locations",
  blogHub: "/p/blog",
  poolPros: "/p/pool-pros",
};

// Every sitemap route that reads the database. `host` matters for the ccTLD one.
const SITEMAPS = [
  { path: "/sitemap-static.xml" },
  { path: "/sitemap-pages-comparisons.xml" },
  { path: "/sitemap-pages-blog.xml" },
  { path: "/sitemap-listings.xml" },
  { path: "/sitemap-directory.xml" },
  { path: "/sitemap-country.xml", host: "www.poolrentalnearme.co.uk" },
  { path: "/sitemap-pages-host-acquisition.xml" },
  { path: "/sitemap-pages-articles.xml" },
  { path: "/sitemap-pages-event-guides.xml" },
  { path: "/sitemap-pages-academy.xml" },
  { path: "/sitemap-pages-advocacy.xml" },
  { path: "/sitemap-pages-spanish.xml" },
  { path: "/sitemap-pages-swim-instructor.xml" },
  { path: "/sitemap-pages-money.xml" },
  { path: "/sitemap-pages-cities.xml" },
];
// Template groups the fixtures have no row for answer a legitimate empty 200.
const SITEMAPS_EMPTY_WHEN_HEALTHY = new Set([
  "/sitemap-pages-event-guides.xml",
  "/sitemap-pages-academy.xml",
  "/sitemap-pages-advocacy.xml",
  "/sitemap-pages-swim-instructor.xml",
  "/sitemap-pages-money.xml",
  "/sitemap-pages-cities.xml",
]);

let failureSlugSeq = 0;

async function failurePhase(mode, { cold = false } = {}) {
  const phase = cold ? `${mode} (cold start)` : mode;
  stub.setMode(mode);
  const mark = stub.requests.length;

  // A page that exists in the fixtures: must not become a 404.
  const live = await get(PAGES.live);
  check(
    phase,
    `${PAGES.live} (exists) -> 503, Retry-After, no-store, not 404/301`,
    is503(live).length === 0,
    `${describe(live)} ${is503(live).join("; ")}`,
  );
  check(
    phase,
    "503 body is small and marked noindex",
    live.status === 503 &&
      live.body.length < 4000 &&
      (/noindex/.test(live.headers.get("x-robots-tag") || "") ||
        /name="robots" content="noindex"/.test(live.body)),
    `${live.body.length} bytes`,
  );

  // An unknown become-host slug: must not become the 301 to /p/become-a-host.
  const hostSlug = `/p/become-a-swimming-pool-host-nowhere-${++failureSlugSeq}`;
  const host = await get(hostSlug);
  check(
    phase,
    `unknown become-a-swimming-pool-host-<x> -> 503, not 301`,
    is503(host).length === 0,
    `${describe(host)} ${is503(host).join("; ")}`,
  );

  // Client-side navigation reaches the same lookup through the RPC endpoint.
  // The client must be told "unavailable" (so it shows the retryable error
  // state), not "not_found" (which would render Not Found and call log404).
  const rpc = await rpcLookup("fixture-live-page");
  check(
    phase,
    'RPC lookupContentPage -> kind "unavailable" (not not_found), HTTP 503, no-store',
    rpc.result?.kind === "unavailable" &&
      rpc.status === 503 &&
      /no-store/.test(rpc.headers.get("cache-control") || ""),
    `HTTP ${rpc.status}, kind ${rpc.result?.kind}, Cache-Control "${rpc.headers.get("cache-control") || ""}" ${rpc.note}`,
  );

  // Every other /p/ route that used to turn a failed read into a 404.
  const others = await Promise.all(
    Object.entries(PAGES)
      .filter(([k]) => k !== "live")
      .map(async ([k, p]) => [k, await get(p)]),
  );
  for (const [k, r] of others) {
    check(
      phase,
      `${r.path} -> 503 (not 404/301/200)`,
      is503(r).length === 0,
      `${describe(r)} ${is503(r).join("; ")}`,
    );
  }

  // Sitemaps: 503 + no-store, never a 200 with zero <loc>.
  const maps = await Promise.all(SITEMAPS.map((s) => get(s.path, s)));
  for (const r of maps) {
    const n = countLocs(r.body);
    check(
      phase,
      `${r.path} -> 503 + no-store, no <loc>`,
      is503(r).length === 0 && n === 0,
      `${describe(r)}, ${n} <loc> ${is503(r).join("; ")}`,
    );
  }

  // The index is memoised in-process once built, so only a cold process must
  // answer 503; a warm one may keep serving the last complete index.
  const index = await get("/sitemap.xml");
  const n = countLocs(index.body);
  if (cold) {
    check(
      phase,
      "/sitemap.xml (nothing memoised) -> 503 + no-store",
      is503(index).length === 0 && n === 0,
      `${describe(index)}, ${n} <loc> ${is503(index).join("; ")}`,
    );
  } else {
    const served = index.status === 200 && n > 0;
    check(
      phase,
      "/sitemap.xml -> 503, or the last complete index from memory; never 200 with zero <loc>",
      served || (is503(index).length === 0 && n === 0),
      `${describe(index)}, ${n} <loc>`,
    );
  }

  // Nothing may have been logged as a 404: no read of, and no write to, content_404_log.
  await sleep(400);
  const logged = logRequests(mark);
  check(
    phase,
    "no log404: zero requests to content_404_log",
    logged.length === 0,
    `${logged.length} request(s): ${logged.map((r) => r.method).join(",")}`,
  );
  check(
    phase,
    "the stub did see the failing reads",
    requestsSince(mark).some((r) => r.table === "content_pages"),
    `${requestsSince(mark).length} request(s)`,
  );
}

async function healthyPhase(phase) {
  stub.setMode("healthy");

  const live = await get(PAGES.live);
  check(
    phase,
    `${PAGES.live} -> 200 with the fixture title`,
    live.status === 200 && live.body.includes(TITLE),
    describe(live),
  );
  check(
    phase,
    "a served page is still cacheable (no no-store)",
    !/no-store/.test(live.headers.get("cache-control") || ""),
    `Cache-Control "${live.headers.get("cache-control") || ""}"`,
  );

  const rpcFound = await rpcLookup("fixture-live-page");
  check(
    phase,
    'RPC lookupContentPage (exists) -> HTTP 200, kind "found"',
    rpcFound.status === 200 && rpcFound.result?.kind === "found",
    `HTTP ${rpcFound.status}, kind ${rpcFound.result?.kind} ${rpcFound.note}`,
  );
  const rpcMissing = await rpcLookup("fixture-never-existed");
  check(
    phase,
    'RPC lookupContentPage (unknown) -> HTTP 200, kind "not_found"',
    rpcMissing.status === 200 && rpcMissing.result?.kind === "not_found",
    `HTTP ${rpcMissing.status}, kind ${rpcMissing.result?.kind} ${rpcMissing.note}`,
  );

  const blog = await get(PAGES.blog);
  check(
    phase,
    `${PAGES.blog} (blog_posts fallback) -> 200 with its title`,
    blog.status === 200 && blog.body.includes(BLOG_TITLE),
    describe(blog),
  );

  const es = await get(PAGES.spanish);
  check(
    phase,
    `${PAGES.spanish} -> 200 with its title`,
    es.status === 200 && es.body.includes(ES_TITLE),
    describe(es),
  );

  for (const key of [
    "comparison",
    "comparison2",
    "stateHub",
    "stateIndex",
    "provider",
    "category",
    "categoryState",
    "categoryCity",
    "course",
  ]) {
    const r = await get(PAGES[key]);
    check(phase, `${r.path} -> 200`, r.status === 200, describe(r));
  }

  // The hubs answer 200 with their rows, not merely 200.
  const hubs = [
    [PAGES.allLocations, ["/p/fixture-live-page", "/l/fixture-listing/"]],
    [PAGES.blogHub, [BLOG_TITLE]],
    [PAGES.poolPros, ["Fixture Pool Pro"]],
  ];
  for (const [path, needles] of hubs) {
    const r = await get(path);
    const missing = needles.filter((n) => !r.body.includes(n));
    check(
      phase,
      `${path} -> 200 listing its fixture rows`,
      r.status === 200 && missing.length === 0,
      `${describe(r)}${missing.length ? `, missing ${missing.join(", ")}` : ""}`,
    );
  }

  // A genuinely missing page keeps today's behaviour: 404 + a content_404_log write.
  let mark = stub.requests.length;
  const missingSlug = `/p/fixture-missing-${phase.replace(/\W+/g, "-")}`;
  const missing = await get(missingSlug);
  check(phase, `${missingSlug} (unknown) -> 404`, missing.status === 404, describe(missing));
  check(
    phase,
    "the stub saw the 404-log write",
    await waitForLogWrite(mark),
    `${logWrites(mark).length} write(s) to content_404_log`,
  );

  // …and the existing become-host rescue: 301 to /p/become-a-host, also logged.
  mark = stub.requests.length;
  const hostSlug = `/p/become-a-swimming-pool-host-nowhere-${phase.replace(/\W+/g, "-")}`;
  const host = await get(hostSlug);
  check(
    phase,
    "unknown become-a-swimming-pool-host-<x> -> 301 /p/become-a-host (unchanged)",
    host.status === 301 && /\/p\/become-a-host$/.test(host.headers.get("location") || ""),
    describe(host),
  );
  check(
    phase,
    "…and the stub saw its 404-log write",
    await waitForLogWrite(mark),
    `${logWrites(mark).length} write(s)`,
  );

  // A missing slug whose characters are array or filter syntax is still just
  // missing. Postgres rejects an unquoted `{city}` or `"` in an array literal
  // (22P02, HTTP 400) on every retry, so taking that for a failed read would
  // answer 503 forever, with no 404-log row and no become-host rescue. A page
  // request for such a path is 307'd by the router's own path normalisation
  // before any route runs (unchanged by this work), so the lookup is reached
  // the way a client-side navigation reaches it: through the RPC endpoint.
  for (const slug of ["become-a-swimming-pool-host-{city}", 'fixture-missing-"quoted"']) {
    const r = await rpcLookup(slug);
    check(
      phase,
      `RPC lookupContentPage(${JSON.stringify(slug)}) -> HTTP 200, kind "not_found" (not unavailable)`,
      r.status === 200 && r.result?.kind === "not_found",
      `HTTP ${r.status}, kind ${r.result?.kind} ${r.note}`,
    );
  }
  const braced = await rpcLookup("fixture-old-{slug}");
  check(
    phase,
    'RPC lookupContentPage("fixture-old-{slug}") (a legacy alias) -> redirect to the canonical slug',
    braced.status === 200 &&
      braced.result?.kind === "redirect" &&
      braced.result?.canonicalSlug === "fixture-live-page",
    `HTTP ${braced.status}, kind ${braced.result?.kind} ${braced.note}`,
  );
  // A backslash does reach the route: still a plain 404 with its log row.
  mark = stub.requests.length;
  const slashPath = `/p/fixture-missing-%5Cslash-${phase.replace(/\W+/g, "-")}`;
  const slash = await get(slashPath);
  check(phase, `${slashPath} (unknown) -> 404`, slash.status === 404, describe(slash));
  check(
    phase,
    "…and the stub saw its 404-log write",
    await waitForLogWrite(mark),
    `${logWrites(mark).length} write(s)`,
  );

  // Unchanged redirect handling.
  const alias = await get("/p/fixture-old-slug");
  check(
    phase,
    "legacy slug -> 301 to the canonical slug",
    alias.status === 301 && /\/p\/fixture-live-page$/.test(alias.headers.get("location") || ""),
    describe(alias),
  );
  const row = await get("/p/fixture-redirect-row");
  check(
    phase,
    "redirect row (redirect_to) -> 301",
    row.status === 301 && /\/p\/fixture-live-page$/.test(row.headers.get("location") || ""),
    describe(row),
  );
  const upper = await get("/p/Fixture-Live-Page");
  check(
    phase,
    "mixed-case slug -> 301 to lowercase",
    upper.status === 301 && /\/p\/fixture-live-page$/.test(upper.headers.get("location") || ""),
    describe(upper),
  );
  const bare = await get("/p/become-a-swimming-pool-host-akron");
  check(
    phase,
    "bare-city host slug -> 301 to the state-suffixed page",
    bare.status === 301 &&
      /\/p\/become-a-swimming-pool-host-akron-oh$/.test(bare.headers.get("location") || ""),
    describe(bare),
  );

  // Other routes still 404 on a row that really is not there.
  for (const p of [
    "/p/es/fixture-missing",
    "/p/peerspace-vs-pool-rental-near-me-in-nowhere",
    "/p/pool-rentals-atlantis",
    "/p/pool-pros/fixture-missing",
    "/p/pool-pros/c/fixture-missing",
    "/p/course/fixture-missing",
    // A category slug that breaks the providers or=(...) filter (PostgREST
    // 400 on every retry) is a missing category, not an outage.
    "/p/pool-pros/c/foo,bar",
    "/p/pool-pros/c/foo,bar/oh",
    "/p/pool-pros/c/foo,bar/oh/akron",
    "/p/pool-pros/c/foo)",
  ]) {
    const r = await get(p);
    check(phase, `${p} (unknown) -> 404`, r.status === 404, describe(r));
  }

  for (const s of SITEMAPS) {
    const r = await get(s.path, s);
    const n = countLocs(r.body);
    if (SITEMAPS_EMPTY_WHEN_HEALTHY.has(s.path)) {
      check(
        phase,
        `${s.path} -> 200 (no fixture rows for this group: empty by data, not by failure)`,
        r.status === 200 && n === 0,
        `${describe(r)}, ${n} <loc>`,
      );
    } else {
      check(
        phase,
        `${s.path} -> 200 with at least one <loc>`,
        r.status === 200 && n > 0,
        `${describe(r)}, ${n} <loc>`,
      );
    }
  }
  const index = await get("/sitemap.xml");
  check(
    phase,
    "/sitemap.xml -> 200 with at least one <loc>",
    index.status === 200 && countLocs(index.body) > 0,
    `${describe(index)}, ${countLocs(index.body)} <loc>`,
  );
}

// ───────────────────────── host_acq_city intent ─────────────────────────────

const decode = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
const h1sOf = (html) => [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1]));
const titleOf = (html) => decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "");
const metaDescriptionOf = (html) =>
  decode(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "");
/** The element whose opening tag carries `marker`, through its matching close. */
function elementWith(html, marker) {
  const at = html.indexOf(marker);
  if (at === -1) return "";
  const open = html.lastIndexOf("<", at);
  const tag = /^<([a-z0-9]+)/.exec(html.slice(open))?.[1];
  if (!tag) return "";
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, "g");
  re.lastIndex = open;
  let depth = 0;
  for (let m; (m = re.exec(html)); ) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(open, m.index + m[0].length);
  }
  return html.slice(open);
}
const numbersIn = (text) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

/** Independent haversine (miles) over the fixture coordinates. */
function fixtureMiles(aLat, aLng, bLat, bLng) {
  const r = (d) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(bLat - aLat) / 2) ** 2 +
    Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}
const cityRow = (slug) => FIXTURES.cities.find((c) => c.slug === slug);
const listingsIn = (citySlug, st) =>
  INTENT_LISTINGS.filter((l) => l.city_slug === citySlug && l.state_code === st);
/** Every number a fixture listing can legitimately put on a page. */
const LISTING_NUMBERS = new Set(
  INTENT_LISTINGS.flatMap((l) => {
    const allIn = l.price_amount + Math.floor((l.price_amount * 15 + 50) / 100);
    return [allIn / 100, l.capacity];
  }),
);
const NEARBY_RADIUS_MI = 60;

async function intentChecks(phase) {
  stub.setMode("healthy");
  const pages = {};
  for (const slug of [
    "become-a-swimming-pool-host-tempe-az",
    "become-a-swimming-pool-host-dayton-oh",
    "tempe-az",
    "mesa-az",
    "chapel-hill",
  ]) {
    pages[slug] = await get(`/p/${slug}`);
    check(phase, `/p/${slug} -> 200`, pages[slug].status === 200, describe(pages[slug]));
  }
  const tempeHits = listingsIn("tempe", "AZ");
  const mesa = cityRow("mesa");
  const mesaMiles = INTENT_LISTINGS.map((l) =>
    fixtureMiles(mesa.latitude, mesa.longitude, l.latitude, l.longitude),
  ).sort((a, b) => a - b);

  const expectOne = (_phase, name, list, want) =>
    check(phase, name, list.length === 1 && list[0] === want, JSON.stringify(list));
  /** Raw HTML contains `needle` (attributes, hrefs). */
  const has = (r, needle) => r.body.includes(needle);
  /** Visible text contains `needle` (React puts <!-- --> between text nodes). */
  const hasText = (r, needle) => decode(r.body).includes(needle);
  const noEmptyNotice = (r) =>
    !hasText(r, "still adding pools") && !hasText(r, "There are no pools listed in");
  /** Numbers in the renter intro + inventory section must all be fixture facts. */
  const numbersOk = (r, allowed) => {
    const text = decode(
      elementWith(r.body, "data-renter-intro") + " " + elementWith(r.body, "data-inventory="),
    );
    const bad = numbersIn(text).filter((n) => !allowed.has(n));
    return { ok: bad.length === 0, detail: bad.length ? `unexpected ${bad.join(", ")} in "${text.slice(0, 300)}"` : "" };
  };

  // HOST with pools listed in the city.
  const hostT = pages["become-a-swimming-pool-host-tempe-az"];
  expectOne(
    phase,
    "HOST Tempe: one H1, host value with the state",
    h1sOf(hostT.body),
    "Rent out your pool in Tempe, AZ by the hour. 0% host fees. Keep 100%.",
  );
  check(
    phase,
    "HOST Tempe: <title> from the rule (stored earnings title not used)",
    titleOf(hostT.body) === "Become a Pool Host in Tempe, AZ | 0% Host Fees",
    titleOf(hostT.body),
  );
  check(
    phase,
    "HOST Tempe: primary CTA is listing a pool, no renter CTA",
    has(hostT, 'data-primary-cta="host"') && !has(hostT, 'data-primary-cta="renter"'),
  );
  check(
    phase,
    `HOST Tempe: host-framed inventory with the true count (${tempeHits.length})`,
    has(hostT, 'data-inventory="host"') &&
      decode(elementWith(hostT.body, 'data-inventory="host"')).includes(
        `${tempeHits.length} pools already listed in Tempe`,
      ),
  );
  check(phase, "HOST Tempe: no empty-inventory notice", noEmptyNotice(hostT));
  const hostNums = numbersOk(hostT, new Set([tempeHits.length, ...LISTING_NUMBERS]));
  check(phase, "HOST Tempe: every number in the inventory section is a fixture fact", hostNums.ok, hostNums.detail);
  check(
    phase,
    "HOST Tempe: no earnings projection, no pool-pros?city= variant",
    !hasText(hostT, "host earns") && !has(hostT, "/p/pool-pros?city=") && has(hostT, 'href="/p/pool-pros"'),
  );

  // HOST without pools.
  const hostD = pages["become-a-swimming-pool-host-dayton-oh"];
  expectOne(
    phase,
    "HOST Dayton: one H1 with the state",
    h1sOf(hostD.body),
    "Rent out your pool in Dayton, OH by the hour. 0% host fees. Keep 100%.",
  );
  check(
    phase,
    "HOST Dayton: no inventory section and no empty-inventory notice",
    !has(hostD, "data-inventory=") && noEmptyNotice(hostD) && !has(hostD, 'id="pools-available"'),
  );
  check(phase, "HOST Dayton: primary CTA is listing a pool", has(hostD, 'data-primary-cta="host"'));

  // RENTER with exact-city pools.
  const rT = pages["tempe-az"];
  expectOne(phase, "RENTER Tempe: one renter H1", h1sOf(rT.body), "Private pool rentals in Tempe, AZ");
  check(
    phase,
    "RENTER Tempe: renter <title>",
    titleOf(rT.body) === "Private Pool Rentals in Tempe, AZ | Pool Rental Near Me",
    titleOf(rT.body),
  );
  check(
    phase,
    "RENTER Tempe: title and H1 differ from the HOST page for the same city",
    titleOf(rT.body) !== titleOf(hostT.body) && h1sOf(rT.body)[0] !== h1sOf(hostT.body)[0],
  );
  check(
    phase,
    `RENTER Tempe: intro and meta description state the real count (${tempeHits.length})`,
    decode(elementWith(rT.body, "data-renter-intro")).startsWith(
      `${tempeHits.length} private pools are listed in Tempe, AZ`,
    ) && metaDescriptionOf(rT.body).startsWith(`${tempeHits.length} private pools are listed in Tempe, AZ`),
    metaDescriptionOf(rT.body),
  );
  check(
    phase,
    "RENTER Tempe: stored description with 'reviews' is not the meta description",
    !metaDescriptionOf(rT.body).includes("reviews"),
  );
  check(
    phase,
    "RENTER Tempe: primary CTA searches pools, in the one /s?address form",
    /<a[^>]*href="\/s\?address=Tempe%2C%20AZ"[^>]*data-primary-cta="renter"/.test(rT.body),
  );
  const invAt = rT.body.indexOf('data-inventory="renter"');
  const hostAt = rT.body.indexOf('id="own-a-pool"');
  const bodyAt = rT.body.indexOf("Fixture host body Tempe");
  check(
    phase,
    "RENTER Tempe: inventory first, then the labelled host section, then the stored body",
    invAt > -1 && hostAt > invAt && bodyAt > hostAt && hasText(rT, "Own a pool in Tempe?") && has(rT, "data-host-cta"),
    `inventory@${invAt} host@${hostAt} body@${bodyAt}`,
  );
  check(
    phase,
    "RENTER Tempe: every listing card shown, no empty notice",
    tempeHits.every((l) => has(rT, `/l/${l.slug}/${l.sharetribe_id}`)) && noEmptyNotice(rT),
  );
  check(
    phase,
    "RENTER Tempe: the body's +-spelled search link renders in the one form",
    // (the raw markdown also travels in the dehydrated loader data; only hrefs count)
    !/href="[^"]*Tempe%2C\+AZ/.test(rT.body) &&
      (rT.body.match(/href="\/s\?address=Tempe%2C%20AZ"/g) ?? []).length >= 2,
  );
  const rTNums = numbersOk(rT, new Set([tempeHits.length, ...LISTING_NUMBERS]));
  check(phase, "RENTER Tempe: every number in intro + inventory is a fixture fact", rTNums.ok, rTNums.detail);
  check(
    phase,
    "RENTER Tempe: no host-acquisition JSON-LD, no host lead popup",
    !has(rT, '"audienceType":"Pool Owners"') && !has(rT, '"@type":"HowTo"'),
  );

  // RENTER with only nearby pools.
  const rM = pages["mesa-az"];
  expectOne(phase, "RENTER Mesa: one renter H1", h1sOf(rM.body), "Private pool rentals in Mesa, AZ");
  const nearest = Math.round(mesaMiles[0]);
  const mesaIntro = decode(elementWith(rM.body, "data-renter-intro"));
  check(
    phase,
    `RENTER Mesa: intro says none in Mesa, ${mesaMiles.length} within ${NEARBY_RADIUS_MI} miles, nearest ${nearest} miles`,
    mesaIntro ===
      `No pools are listed in Mesa, AZ yet. ${mesaMiles.length} private pools are listed within ${NEARBY_RADIUS_MI} miles. The nearest is ${nearest} miles from Mesa.`,
    mesaIntro,
  );
  check(
    phase,
    "RENTER Mesa: each nearby card carries its real distance",
    mesaMiles.every((mi) => has(rM, `${Math.round(mi)} miles</div>`) || has(rM, `${Math.round(mi)} miles<!-- --> from`)),
  );
  check(phase, "RENTER Mesa: 'Pools near Mesa', no empty notice", hasText(rM, "Pools near Mesa") && noEmptyNotice(rM));
  const rMNums = numbersOk(
    rM,
    new Set([mesaMiles.length, NEARBY_RADIUS_MI, ...mesaMiles.map((m) => Math.round(m)), ...LISTING_NUMBERS]),
  );
  check(phase, "RENTER Mesa: every number in intro + inventory is a fixture fact", rMNums.ok, rMNums.detail);
  check(
    phase,
    "RENTER Mesa: primary CTA searches pools near Mesa",
    /<a[^>]*href="\/s\?address=Mesa%2C%20AZ"[^>]*data-primary-cta="renter"/.test(rM.body),
  );

  // RENTER with none.
  const rC = pages["chapel-hill"];
  expectOne(phase, "RENTER Chapel Hill (bare slug): H1 carries the title's state", h1sOf(rC.body), "Private pool rentals in Chapel Hill, NC");
  check(
    phase,
    "RENTER Chapel Hill: plain no-pools statement + browse-all link, no 'still adding'",
    hasText(rC, "There are no pools listed in Chapel Hill yet.") &&
      !hasText(rC, "still adding pools") &&
      /<a[^>]*href="\/s"[^>]*data-primary-cta="renter"/.test(rC.body),
  );
  const rCNums = numbersOk(rC, new Set());
  check(phase, "RENTER Chapel Hill: no number in intro + inventory", rCNums.ok, rCNums.detail);
  check(
    phase,
    "RENTER Chapel Hill: meta description says no pools are listed yet",
    metaDescriptionOf(rC.body).startsWith("No pools are listed in Chapel Hill, NC yet."),
    metaDescriptionOf(rC.body),
  );
  check(
    phase,
    "No two intent fixture pages share an H1 or a <title>",
    new Set(Object.values(pages).map((r) => h1sOf(r.body)[0])).size === Object.keys(pages).length &&
      new Set(Object.values(pages).map((r) => titleOf(r.body))).size === Object.keys(pages).length,
  );
}

let crashed = null;
try {
  await failurePhase("hang", { cold: true });
  await healthyPhase("healthy");
  await intentChecks("intent (healthy)");
  await failurePhase("http-500");
  await failurePhase("connection-reset");
  await failurePhase("hang");

  // connection-reset once more with a timeout long enough for supabase-js to
  // exhaust its own retries (1 s + 2 s + 4 s), so the 503 comes from the
  // returned-error path rather than from our timeout.
  stub.setMode("connection-reset");
  process.env.SUPABASE_READ_TIMEOUT_MS = "20000";
  const started = Date.now();
  const res = await Promise.race([
    server.fetch(new Request(`http://localhost${PAGES.live}`)),
    sleep(15000).then(() => new Response("", { status: 599 })),
  ]);
  await res.text();
  const ms = Date.now() - started;
  process.env.SUPABASE_READ_TIMEOUT_MS = String(READ_TIMEOUT_MS);
  check(
    "connection-reset (retries exhausted)",
    `${PAGES.live} -> 503 from the returned error, before the 20 s timeout`,
    res.status === 503 && /no-store/.test(res.headers.get("cache-control") || "") && ms < 15000,
    `${res.status} in ${ms} ms`,
  );

  await healthyPhase("recovery");
} catch (err) {
  crashed = err;
} finally {
  await stub.close();
}

// ───────────────────────────── report ───────────────────────────────────────

if (quiet) Object.assign(console, realConsole);
let lastPhase = "";
for (const r of results) {
  if (r.phase !== lastPhase) {
    say(`\n[${r.phase}]`);
    lastPhase = r.phase;
  }
  say(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `   <-- ${r.detail}`}`);
}
const failed = results.filter((r) => !r.ok);
say(
  `\ntest:failed-reads — ${results.length - failed.length} passed, ${failed.length} failed, ${stub.requests.length} stub request(s) recorded (${DIST})`,
);
if (crashed) say(`\nHARNESS ERROR: ${crashed?.stack || crashed}`);
// The app keeps timers and sockets alive; exit explicitly.
process.exit(failed.length === 0 && !crashed ? 0 : 1);
