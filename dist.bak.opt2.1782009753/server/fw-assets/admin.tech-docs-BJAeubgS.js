import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { A as AdminLayout } from "./admin-layout-BNp_05PW.js";
import "lucide-react";
import "./router-BvRNdW25.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./cities.functions-XBYRqf13.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./auth-middleware-rMMNsPLB.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "@react-email/components";
import "./registry-Dn-QpeYo.js";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-CBcoOJUi.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-LDeZNUHd.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const ADMIN_DOC_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        route: "/admin/dashboard",
        what: "High-level health snapshot for the site: indexed pages, recent leads, content pipeline, and quick links into every major tool.",
        how: "Server function aggregates counts from content_pages, host_leads, plan_requests, etc. via supabaseAdmin. Renders fast cards with last-N metrics; safe-fallbacks to zero if a query fails."
      },
      {
        label: "SEO Coach",
        route: "/admin/seo-coach",
        what: "AI assistant that critiques a page or topic and suggests improvements (titles, headings, internal links, EEAT signals).",
        how: "Sends the target slug + content into Lovable AI Gateway (google/gemini-2.5-pro). Returns structured suggestions; nothing is auto-applied."
      }
    ]
  },
  {
    label: "Content",
    items: [
      {
        label: "Quick page builder",
        route: "/admin/quick-page",
        what: "Spin up a single content page from a slug + topic without touching the bulk pipeline.",
        how: "Calls a server fn that drafts the page via Lovable AI, inserts into content_pages with status draft, and returns the new URL."
      },
      {
        label: "Generate content",
        route: "/admin/generate-content",
        what: "Bulk-generate content for many pages at once (host-acq cities, advocacy, hubs).",
        how: "Triggers the generate-content-batch edge function. The function pulls candidate slugs, generates with the chosen model, and writes back to content_pages. Progress shown via polling stats."
      },
      {
        label: "Content migration",
        route: "/admin/content-migration",
        what: "Move/rewrite legacy content into the canonical /p/{slug} structure.",
        how: "Server functions in admin-tools.functions.ts handle slug rewrites, status flips, and 301 alias creation in redirect_aliases."
      },
      {
        label: "Bulk page editor",
        route: "/admin/content-pages",
        what: "Filter/search every row in content_pages, change status (published, pending, draft, scraped), and apply bulk fixes.",
        how: "Loader reads paginated rows via supabaseAdmin (server-only — RLS denies anon). Mutations route through admin server fns; the page-size selector and status filter are query parameters on those fns."
      },
      {
        label: "Blog admin",
        route: "/admin/blog",
        what: "Manage blog_posts: create, enrich (TL;DR, related posts), publish.",
        how: "Uses admin-blog.functions.ts + blog-enrichment.functions.ts. Enrichment calls Lovable AI for summaries and related-post suggestions."
      },
      {
        label: "Learning admin",
        route: "/admin/learning",
        what: "View per-user course progress and completions; drill into a single learner at /admin/learning/$userId.",
        how: "Reads course_completions + learning tables. Issues certificate UIDs via the generate_certificate_uid() DB function."
      },
      {
        label: "City heroes",
        route: "/admin/cities-heroes",
        what: "Backfill and review hero images for the 5,100+ city pages.",
        how: "Stores images in the city-heroes public storage bucket. Backfill server fn uses Unsplash (UNSPLASH_ACCESS_KEY) with deterministic queries per city."
      },
      {
        label: "Data export",
        route: "/admin/data-export",
        what: "Export tables to CSV (leads, pages, blog, etc.) for offline analysis.",
        how: "Server fn streams query results, formats CSV, returns a download URL."
      },
      {
        label: "Data import",
        route: "/admin/data-import",
        what: "Bulk-upload CSV to seed cities, pages, leads, etc.",
        how: "Validates schema, deduplicates by slug/email, inserts via supabaseAdmin. Errors are reported per-row, not all-or-nothing."
      }
    ]
  },
  {
    label: "SEO",
    items: [
      {
        label: "Competitor radar",
        route: "/admin/competitor-radar",
        what: "Surfaces competitor URLs ranking for keywords we should own.",
        how: "Pulls SERP data via SERPAPI_KEY, joins against our content_pages coverage, flags gaps."
      },
      {
        label: "Rank tracker",
        route: "/admin/rank-tracker",
        what: "Tracks our positions for tracked keywords over time.",
        how: "Cron-fed table of rank snapshots; UI charts deltas. SERPAPI_KEY backs the lookups."
      },
      {
        label: "AI page auditor",
        route: "/admin/page-auditor",
        what: "Audit a single page against EEAT, schema, internal-link, and copy heuristics.",
        how: "Fetches the rendered page, sends to Lovable AI for grading, returns a structured scorecard."
      },
      {
        label: "Listing auditor",
        route: "/admin/listing-auditor",
        what: "Audit Sharetribe listings for missing fields, weak photos, low-quality copy.",
        how: "Reads via admin-listing-audit.functions.ts. Sharetribe SDK fetch through SHARETRIBE_INTEG_CLIENT_ID/SECRET."
      },
      {
        label: "Keyword opportunities",
        route: "/admin/keyword-opportunities",
        what: "GSC-driven list of queries where we rank 5–20 — biggest CTR wins.",
        how: "Reads imported GSC data, filters by impressions/position thresholds, sorts by potential traffic."
      },
      {
        label: "Competitor tracker",
        route: "/admin/competitors",
        what: "Manage the competitor URL list that radar/SERP tooling watches.",
        how: "Simple CRUD on a competitors table; admin-only RLS."
      },
      {
        label: "Internal link recommender",
        route: "/admin/internal-links",
        what: "Suggests new internal links between content pages based on topical overlap.",
        how: "Server fn in internal-links.functions.ts tokenizes pages and scores candidates; admin clicks to apply."
      },
      {
        label: "SEO health",
        route: "/admin/seo-health",
        what: "Site-wide SEO health: titles, descriptions, canonicals, h1 count, schema presence.",
        how: "Runs checks across content_pages rows; reports problems in a table."
      },
      {
        label: "Link checker",
        route: "/admin/link-checker",
        what: "Crawl-style checker that pings outbound + internal links and reports 404s.",
        how: "Uses link-checker.functions.ts (HEAD/GET). Results stored for the dashboard."
      },
      {
        label: "Link audit dashboard",
        route: "/admin/link-audit",
        what: "Aggregated view of broken-link audits across the site.",
        how: "Reads from link-audit-dashboard.functions.ts; groups by source page."
      },
      {
        label: "Missing pages (404s)",
        route: "/admin/missing-pages",
        what: "Logs of /p/* URLs that 404 in production — pure SEO gold for new content.",
        how: "content_404_log table populated by the catch-all route; server fn returns top hits."
      },
      {
        label: "Sitemap & indexing",
        route: "/admin/indexing",
        what: "Inspect sitemap entries, rebuild on demand, push URLs for indexing.",
        how: "Uses sitemap.ts helpers that emit absolute production URLs via getCanonicalUrl. Never includes lovable.app hosts."
      },
      {
        label: "GSC import",
        route: "/admin/gsc-import",
        what: "Import Google Search Console performance data.",
        how: "Accepts a GSC CSV/API payload, normalizes queries, persists for keyword opportunities."
      },
      {
        label: "Scrape import",
        route: "/admin/scrape-import",
        what: "Paste Yelp / Google Maps / BBB / Angi / Houzz / Thumbtack URLs to create pending providers.",
        how: "Each URL goes through adminScrapeProviderUrl (uses FIRECRAWL_API_KEY). Successful scrapes insert into providers with status pending and log to scrape_jobs."
      },
      {
        label: "Click report",
        route: "/admin/click-report",
        what: "Where users actually click on the site — outbound clicks, CTAs, internal nav.",
        how: "Backed by click-report.functions.ts aggregating click events."
      }
    ]
  },
  {
    label: "Users & Ops",
    items: [
      {
        label: "Lead inbox",
        route: "/admin/leads",
        what: "Every host/renter lead in one place: contact, source, notes, follow-up status.",
        how: "Reads host_leads via admin server fn. SMS sequences (5-touch Twilio) are auto-scheduled when a host_lead is inserted."
      },
      {
        label: "IG lead hunter",
        route: "/admin/ig-lead-hunter",
        what: "Find Instagram leads (pool owners, party planners) at scale.",
        how: "ig-lead-hunter.server.ts + Lovable AI for qualification. ig_leads is FORCE-RLS, admin-only, accessed exclusively via supabaseAdmin."
      },
      {
        label: "Social lead hunter",
        route: "/admin/social-lead-hunter",
        what: "Cross-platform social lead discovery (beyond IG).",
        how: "Validates URLs via social-url-validator.server.ts, persists to social leads table; same admin-only pattern."
      },
      {
        label: "Email branding",
        route: "/admin/email-branding",
        what: "Manage branded transactional email templates (logo, colors, footer).",
        how: "email-branding.functions.ts writes to email branding settings; templates in src/lib/email-templates/ read those values."
      },
      {
        label: "Email verify",
        route: "/admin/email-verify",
        what: "Verify lead email addresses (deliverable / catch-all / invalid).",
        how: "Calls EmailVerify API (EMAILVERIFY_API_KEY) and persists result on the lead row."
      },
      {
        label: "Site footer",
        route: "/admin/site-footer",
        what: "Edit the production site footer links/columns without redeploying.",
        how: "Reads/writes site-footer config via site-footer.functions.ts; cached and served by the layout."
      },
      {
        label: "Directory moderation",
        route: "/admin/directory",
        what: "Approve/reject pending providers (from scrapes or claims).",
        how: "directory.functions.ts handles status transitions on providers."
      },
      {
        label: "Listing claims",
        route: "/admin/claims",
        what: "Owners claiming a scraped listing — verify and assign ownership.",
        how: "Claim records reference the provider; admin approval flips ownership and fires a transactional email."
      },
      {
        label: "Plan requests",
        route: "/admin/plan-requests",
        what: "Provider plan/payment requests pending review.",
        how: "adminListPlanRequests + adminReviewPlanRequest. Approve applies the requested plan; reject leaves a note. Payment refs are free-text."
      },
      {
        label: "Admin team",
        route: "/admin/team",
        what: "Manage which user_ids hold the admin role.",
        how: "Reads/writes user_roles. Role checks everywhere use the SECURITY DEFINER has_role(uid, 'admin') function — never a client-side check."
      }
    ]
  }
];
const ADMIN_DOC_CROSS_CUTTING = [
  {
    title: "Authentication & access",
    body: "Every /admin/* route's beforeLoad calls checkAdminRole() (server fn). Non-admins are redirected to /admin/no-access. The check uses the SECURITY DEFINER has_role() SQL function against user_roles — admin status is never trusted from the client."
  },
  {
    title: "Server-only data access",
    body: "Privileged tables (content_pages, ig_leads, host_leads, sms_*) FORCE RLS and revoke anon/authenticated grants. All reads/writes go through supabaseAdmin inside *.functions.ts / *.server.ts. The browser Supabase client cannot read them."
  },
  {
    title: "AI calls",
    body: "Generation/critique tools call the Lovable AI Gateway — no extra API key required. Default models: google/gemini-2.5-pro for long-form generation, gemini-2.5-flash for quick critiques."
  },
  {
    title: "External integrations",
    body: "Sharetribe (SHARETRIBE_*), Twilio SMS (TWILIO_API_KEY), Firecrawl scrape (FIRECRAWL_API_KEY), SerpAPI (SERPAPI_KEY), EmailIt (EMAILIT_API_KEY), EmailVerify (EMAILVERIFY_API_KEY), Unsplash (UNSPLASH_ACCESS_KEY), People Data Labs (PDL_API_KEY), BatchData (BATCHDATA_API_KEY). All read inside .handler(), never at module scope."
  },
  {
    title: "SMS sequence",
    body: "Inserting into host_leads auto-schedules a 5-touch Twilio sequence at 0m / 1d / 3d / 7d / 14d. Inbound STOP/START handled at /api/public/hooks/twilio-inbound. A cron sender drains the schedule."
  },
  {
    title: "Sitemaps & canonical URLs",
    body: "All user-facing URLs flow through getCanonicalOrigin(request) / getCanonicalUrl(request, path), which read X-Forwarded-Host. Sitemaps emit absolute https://www.poolrentalnearme.com URLs only — never lovable.app."
  },
  {
    title: "Defensive rendering",
    body: "Every admin server fn returns a typed empty/fallback shape on error, so admin pages render even if a query fails. Errors are surfaced inline rather than crashing the route."
  }
];
const ADMIN_FLOWS = [
  {
    id: "scrape",
    title: "Content page scraping",
    blurb: "How a pasted Yelp / Google Maps / BBB / Angi / Houzz / Thumbtack URL becomes a pending provider row.",
    diagram: `flowchart LR
  A[Admin pastes URLs<br/>/admin/scrape-import] --> B{Per-URL loop}
  B --> C[adminScrapeProviderUrl<br/>server fn]
  C --> D[Firecrawl API<br/>FIRECRAWL_API_KEY]
  D --> E[Parse: name, phone,<br/>address, photos, hours]
  E --> F[supabaseAdmin INSERT<br/>providers status=pending]
  E --> G[supabaseAdmin INSERT<br/>scrape_jobs row]
  F --> H[/admin/directory<br/>moderation queue/]
  G --> I[/admin/scrape-import<br/>recent jobs panel/]
  classDef ext fill:#fef3c7,stroke:#b45309
  classDef db fill:#dbeafe,stroke:#1e40af
  class D ext
  class F,G db`,
    steps: [
      { name: "1. Paste URLs", detail: "Admin pastes one URL per line into /admin/scrape-import. Client filters to http(s) only." },
      { name: "2. Loop on the client", detail: "The page calls adminScrapeProviderUrl({ url, autoCreate: true }) one URL at a time so progress can be reported." },
      { name: "3. Server scrape", detail: "The server fn calls Firecrawl with FIRECRAWL_API_KEY, then runs site-specific extractors for Yelp, Google Maps, BBB, Angi, Houzz, Thumbtack." },
      { name: "4. Persist provider", detail: "On success, supabaseAdmin inserts a row into providers with status='pending' and is_published=false." },
      { name: "5. Persist job log", detail: "Every attempt (success or failure) inserts into scrape_jobs with status, source_type, source_url, and error message if any." },
      { name: "6. Moderate", detail: "The new pending provider shows up in /admin/directory for human review before publishing." }
    ]
  },
  {
    id: "status",
    title: "Content page status transitions",
    blurb: "Lifecycle of a row in content_pages: scraped → draft → pending → published, with admin actions along the way.",
    diagram: `stateDiagram-v2
  [*] --> scraped: Imported by scraper /<br/>backfill job
  scraped --> draft: Quick page builder /<br/>generate-content edits
  draft --> pending: Admin marks ready<br/>(/admin/content-pages)
  pending --> published: Admin publishes
  published --> draft: Admin unpublishes<br/>(needs more work)
  pending --> draft: Rejected in review
  published --> [*]: Optionally archived<br/>(out of sitemap)
  draft --> scraped: Reset to source<br/>(rare, manual)`,
    steps: [
      { name: "scraped", detail: "Raw row created by an import (Firecrawl scrape, GSC backfill, CSV import). Not in sitemap, not served at /p/{slug}." },
      { name: "draft", detail: "AI generation has populated title, body, FAQs, schema. Still hidden from production. Visible in /admin/content-pages with status filter 'Unpublished (draft)'." },
      { name: "pending", detail: "Marked ready for human review. Sitemap still excludes it. Reviewer can publish or send back to draft." },
      { name: "published", detail: "is_published=true. Included in /sitemap.xml via getCanonicalUrl, served at /p/{slug}, eligible for Google indexing." },
      { name: "Unpublish", detail: "Flipping back to draft removes it from the sitemap on next regen and serves a 410/404 fallback at /p/{slug}." }
    ]
  },
  {
    id: "publish",
    title: "Publishing a page (request flow)",
    blurb: "What happens between the admin clicking Publish and Googlebot fetching the live URL.",
    diagram: `sequenceDiagram
  participant A as Admin (browser)
  participant SF as Server fn<br/>(admin-tools.functions.ts)
  participant DB as supabaseAdmin
  participant SM as Sitemap builder
  participant N as nginx (EC2)
  participant G as Googlebot
  A->>SF: publishPage({ slug })
  SF->>DB: UPDATE content_pages<br/>SET is_published=true,<br/>status='published'
  DB-->>SF: row
  SF->>DB: UPSERT redirect_aliases<br/>(if slug changed)
  SF-->>A: { ok, canonicalUrl }
  Note over SM: Sitemap regenerated on<br/>next request via getCanonicalUrl
  G->>N: GET /sitemap.xml
  N->>SM: forward (Host: poolrentalnearme.com)
  SM-->>G: absolute /p/{slug} URLs
  G->>N: GET /p/{slug}
  N->>SF: forward to fresh-web<br/>X-Forwarded-Host preserved
  SF->>DB: SELECT content_pages<br/>WHERE slug=$1 AND is_published`,
    steps: [
      { name: "1. Admin clicks Publish", detail: "Bulk page editor calls a server fn (admin-only, gated by has_role('admin'))." },
      { name: "2. Update row", detail: "supabaseAdmin sets status='published' and is_published=true. RLS bypassed because we're on the service-role client." },
      { name: "3. Alias if needed", detail: "If the slug changed during the workflow, an entry is added to redirect_aliases so the old URL 301s to the new one." },
      { name: "4. Sitemap reflects", detail: "Sitemap is built per request from is_published=true rows; getCanonicalUrl(request, '/p/'+slug) emits absolute production URLs only." },
      { name: "5. Googlebot fetches", detail: "Hits poolrentalnearme.com/sitemap.xml; nginx forwards to fresh-web with X-Forwarded-Host=poolrentalnearme.com so canonicals are correct." },
      { name: "6. Page render", detail: "/p/{slug} server route loads the row via supabaseAdmin and returns SSR HTML with canonical = https://www.poolrentalnearme.com/p/{slug}." }
    ]
  },
  {
    id: "redirects",
    title: "Redirects & aliases",
    blurb: "How a request for an old or legacy URL ends up at the right canonical /p/{slug}.",
    diagram: `flowchart TD
  R[Incoming request<br/>poolrentalnearme.com/some/path] --> N[nginx on EC2]
  N -->|forwards /p/* to fresh-web| FW[fresh-web TanStack route]
  FW --> M{Slug match in<br/>content_pages?}
  M -->|hit & published| HTML[Render SSR page<br/>200 OK]
  M -->|miss| AL{Match in<br/>redirect_aliases?}
  AL -->|hit| RD[301 to canonical /p/{new-slug}]
  AL -->|miss| LL{Match in<br/>legacy-redirects.ts?}
  LL -->|hit| RD2[301 to mapped path]
  LL -->|miss| LOG[INSERT content_404_log<br/>+ render 404 page]
  LOG --> MP[/admin/missing-pages<br/>surfaces the URL/]
  N -.->|/s, /l, /login, /inbox<br/>etc./| ST[Sharetribe<br/>marketplace]
  classDef route fill:#dbeafe,stroke:#1e40af
  classDef warn fill:#fee2e2,stroke:#b91c1c
  class HTML,RD,RD2 route
  class LOG warn`,
    steps: [
      { name: "1. nginx routes the host", detail: "Production traffic hits nginx on EC2. /p/*, /, /landing-page, /fw-assets/* and sitemaps go to fresh-web. Marketplace paths go to Sharetribe." },
      { name: "2. Slug lookup", detail: "fresh-web's /p/$slug route loads the row from content_pages via supabaseAdmin (server-only — RLS denies anon)." },
      { name: "3. Alias fallback", detail: "Miss? Check redirect_aliases for an old→new slug mapping. If matched, return a 301 to /p/{new-slug}." },
      { name: "4. Legacy table", detail: "Still no match? Check the static legacy-redirects.ts map (covers pre-/p/ URLs). If matched, 301 to the mapped path." },
      { name: "5. Log the 404", detail: "If nothing matched, insert into content_404_log and render the 404 page. The URL surfaces at /admin/missing-pages so an admin can write the missing content." },
      { name: "6. Canonical wins", detail: "All hops use getCanonicalUrl(request) so 301 targets and the rendered canonical tag use https://www.poolrentalnearme.com — never lovable.app." }
    ]
  }
];
let mermaidPromise = null;
function loadMermaid() {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "strict",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        flowchart: { htmlLabels: true, curve: "basis" }
      });
      return m.default;
    });
  }
  return mermaidPromise;
}
let counter = 0;
function Mermaid({ chart, caption }) {
  const ref = React.useRef(null);
  const [svg, setSvg] = React.useState("");
  const [err, setErr] = React.useState("");
  const id = React.useMemo(() => `mmd-${++counter}-${Math.random().toString(36).slice(2, 8)}`, []);
  React.useEffect(() => {
    let cancelled = false;
    loadMermaid().then(async (mermaid) => {
      try {
        const { svg: svg2 } = await mermaid.render(id, chart);
        if (!cancelled) setSvg(svg2);
      } catch (e) {
        if (!cancelled) setErr(e?.message ?? "Failed to render diagram");
      }
    }).catch((e) => !cancelled && setErr(e?.message ?? "Failed to load mermaid"));
    return () => {
      cancelled = true;
    };
  }, [chart, id]);
  return /* @__PURE__ */ jsxs("figure", { className: "overflow-x-auto rounded-lg border border-border bg-card p-4", children: [
    err ? /* @__PURE__ */ jsx("pre", { className: "text-xs text-destructive", children: err }) : /* @__PURE__ */ jsx("div", { ref, className: "[&_svg]:mx-auto [&_svg]:max-w-full", dangerouslySetInnerHTML: { __html: svg } }),
    caption && /* @__PURE__ */ jsx("figcaption", { className: "mt-2 text-center text-xs text-muted-foreground", children: caption })
  ] });
}
function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  const parts = text.split(re);
  return parts.map((part, i) => re.test(part) ? /* @__PURE__ */ jsx("mark", { className: "rounded bg-yellow-200 px-0.5 text-foreground", children: part }, i) : /* @__PURE__ */ jsx(React.Fragment, { children: part }, i));
}
function matches(item, q) {
  if (!q) return true;
  const hay = `${item.label} ${item.route} ${item.what} ${item.how}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((tok) => hay.includes(tok));
}
function TechDocsPage() {
  const [q, setQ] = React.useState("");
  const totalItems = ADMIN_DOC_GROUPS.reduce((n, g) => n + g.items.length, 0);
  const filteredGroups = ADMIN_DOC_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => matches(it, q))
  })).filter((g) => g.items.length > 0);
  const filteredCross = ADMIN_DOC_CROSS_CUTTING.filter((c) => {
    if (!q) return true;
    return `${c.title} ${c.body}`.toLowerCase().includes(q.toLowerCase());
  });
  const matchCount = filteredGroups.reduce((n, g) => n + g.items.length, 0);
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const toolId = (route) => `tool-${slug(route)}`;
  const groupId = (label) => `group-${slug(label)}`;
  const crossId = (title) => `cross-${slug(title)}`;
  const flowId = (id) => `flow-${id}`;
  const [tocOpen, setTocOpen] = React.useState(true);
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground", children: "Technical docs" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
        "Reference for every tool inside the admin area: route, what it does, and how it works under the hood. ",
        totalItems,
        " tools indexed."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "sticky top-16 z-10 -mx-6 border-b border-border bg-background/95 px-6 py-3 backdrop-blur", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsx("input", { type: "search", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search tools, routes, tables, integrations…", className: "flex-1 min-w-[240px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary", autoFocus: true }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: q ? `${matchCount} of ${totalItems}` : `${totalItems} tools` })
      ] }),
      filteredGroups.length > 0 && /* @__PURE__ */ jsxs("nav", { className: "mt-2 flex flex-wrap gap-2 text-xs", children: [
        /* @__PURE__ */ jsx("a", { href: "#toc", className: "rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary hover:bg-primary/25", children: "Table of contents" }),
        /* @__PURE__ */ jsx("a", { href: "#flows", className: "rounded-full bg-muted px-2.5 py-1 text-foreground hover:bg-muted/70", children: "Diagrams & flows" }),
        filteredGroups.map((g) => /* @__PURE__ */ jsxs("a", { href: `#${groupId(g.label)}`, className: "rounded-full bg-muted px-2.5 py-1 text-foreground hover:bg-muted/70", children: [
          g.label,
          " (",
          g.items.length,
          ")"
        ] }, g.label))
      ] })
    ] }),
    filteredGroups.length === 0 && filteredCross.length === 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: [
      "No matches for “",
      q,
      "”."
    ] }),
    /* @__PURE__ */ jsxs("section", { id: "toc", className: "rounded-lg border border-border bg-card p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Table of contents" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Jump to any admin tool, diagram, or cross-cutting concern." })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setTocOpen((v) => !v), className: "rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted", children: tocOpen ? "Collapse" : "Expand" })
      ] }),
      tocOpen && /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-5 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-wide text-muted-foreground", children: "Diagrams & flows" }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1 text-sm", children: ADMIN_FLOWS.map((f) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: `#${flowId(f.id)}`, className: "text-primary hover:underline", children: f.title }) }, f.id)) })
        ] }),
        filteredCross.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-wide text-muted-foreground", children: "Cross-cutting concerns" }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1 text-sm", children: filteredCross.map((c) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: `#${crossId(c.title)}`, className: "text-primary hover:underline", children: c.title }) }, c.title)) })
        ] }),
        filteredGroups.map((g) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold uppercase tracking-wide text-muted-foreground", children: [
            /* @__PURE__ */ jsx("a", { href: `#${groupId(g.label)}`, className: "hover:underline", children: g.label }),
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground/70", children: [
              "(",
              g.items.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1 text-sm", children: g.items.map((it) => /* @__PURE__ */ jsxs("li", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsx("a", { href: `#${toolId(it.route)}`, className: "text-primary hover:underline", children: it.label }),
            /* @__PURE__ */ jsx("code", { className: "text-xs text-muted-foreground", children: it.route })
          ] }, it.route)) })
        ] }, g.label))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { id: "flows", className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "border-b border-border pb-1 text-xl font-semibold text-foreground", children: "Diagrams & data flows" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Step-by-step walk-throughs of the moving parts behind scraping, status changes, publishing, and redirects." })
      ] }),
      ADMIN_FLOWS.filter((f) => {
        if (!q) return true;
        const hay = `${f.title} ${f.blurb} ${f.steps.map((s) => s.name + " " + s.detail).join(" ")}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      }).map((flow) => /* @__PURE__ */ jsxs("article", { id: flowId(flow.id), className: "space-y-3 rounded-lg border border-border bg-card p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: flow.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: flow.blurb })
        ] }),
        /* @__PURE__ */ jsx(Mermaid, { chart: flow.diagram }),
        /* @__PURE__ */ jsx("ol", { className: "space-y-2 text-sm", children: flow.steps.map((s, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary", children: i + 1 }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-foreground", children: s.name }),
            /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: s.detail })
          ] })
        ] }, i)) })
      ] }, flow.id))
    ] }),
    filteredGroups.map((group) => /* @__PURE__ */ jsxs("section", { id: groupId(group.label), className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h2", { className: "border-b border-border pb-1 text-xl font-semibold text-foreground", children: group.label }),
      /* @__PURE__ */ jsx("ul", { className: "grid gap-3 sm:grid-cols-2", children: group.items.map((it) => /* @__PURE__ */ jsxs("li", { id: toolId(it.route), className: "scroll-mt-32 rounded-lg border border-border bg-card p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-foreground", children: highlight(it.label, q) }),
          /* @__PURE__ */ jsx(Link, { to: it.route, className: "shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20", children: "Open →" })
        ] }),
        /* @__PURE__ */ jsx("code", { className: "mt-1 block text-xs text-muted-foreground", children: highlight(it.route, q) }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "What it does. " }),
          highlight(it.what, q)
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1.5 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: "How it works. " }),
          highlight(it.how, q)
        ] })
      ] }, it.route)) })
    ] }, group.label)),
    filteredCross.length > 0 && /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h2", { className: "border-b border-border pb-1 text-xl font-semibold text-foreground", children: "Cross-cutting concerns" }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: filteredCross.map((c) => /* @__PURE__ */ jsxs("li", { id: crossId(c.title), className: "scroll-mt-32 rounded-lg border border-border bg-card p-4 shadow-sm", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-foreground", children: highlight(c.title, q) }),
        /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm text-muted-foreground", children: highlight(c.body, q) })
      ] }, c.title)) })
    ] })
  ] }) });
}
export {
  TechDocsPage as component
};
