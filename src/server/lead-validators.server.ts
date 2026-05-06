/**
 * Lead validators — kill garbage matches before they're ever inserted.
 * Used by host-matcher and contact-enricher.
 *
 * Hardened to:
 *  - Reject NANP-invalid phones, repeated/sequential, partial substrings, URLs/SKUs
 *  - Block product/marketplace/CDN/cloud-bucket sources
 *  - Reject business-entity names (GmbH, LLC, d.o.o., etc.) unless host first name appears
 *  - Score matches with a transparent breakdown for UI debugging
 */

const VALID_AREA_CODES = new Set<string>([
  "201","202","203","204","205","206","207","208","209","210","212","213","214","215","216","217","218","219","220","223","224","225","226","227","228","229","231","234","236","239","240","248","249","250","251","252","253","254","256","260","262","263","264","267","268","269","270","272","274","276","279","281","283","289",
  "301","302","303","304","305","306","307","308","309","310","312","313","314","315","316","317","318","319","320","321","323","325","326","327","330","331","332","334","336","337","339","340","341","343","345","346","347","351","352","354","360","361","363","364","365","367","368","369","380","382","385","386","387",
  "401","402","403","404","405","406","407","408","409","410","412","413","414","415","416","417","418","419","420","423","424","425","428","430","431","432","434","435","437","438","440","441","442","443","445","447","448","450","458","463","464","467","468","469","470","473","474","475","478","479","480","484",
  "501","502","503","504","505","506","507","508","509","510","512","513","514","515","516","517","518","519","520","539","540","541","543","548","551","557","559","561","562","563","564","567","570","571","572","573","574","575","579","580","581","582","584","585","586","587","588","589","595","596",
  "601","602","603","604","605","606","607","608","609","610","612","613","614","615","616","617","618","619","620","623","626","628","629","630","631","636","639","640","641","645","646","647","649","650","651","656","657","658","659","660","661","662","664","667","669","670","671","672","678","680","681","682","683","684","689",
  "701","702","703","704","705","706","707","708","709","712","713","714","715","716","717","718","719","720","721","724","725","726","727","728","730","731","732","734","737","740","742","743","747","753","754","757","758","760","762","763","765","767","769","770","771","772","773","774","775","778","779","780","781","782","783","784","785","786","787","789","790","791","792","793","798",
  "801","802","803","804","805","806","807","808","809","810","812","813","814","815","816","817","818","819","820","821","825","826","828","829","830","831","832","835","836","838","839","840","843","845","847","848","849","850","854","856","857","858","859","860","861","862","863","864","865","867","868","869","870","872","873","876","878","879","898",
  "901","902","903","904","905","906","907","908","909","910","912","913","914","915","916","917","918","919","920","925","928","929","930","931","934","936","937","938","939","940","941","943","945","947","948","949","951","952","954","956","957","959","970","971","972","973","978","979","980","983","984","985","986","989",
]);

const ROLE_EMAIL_PREFIXES = ["noreply","no-reply","support","info","hello","contact","admin","sales","marketing","billing","help","press","media","privacy","abuse","postmaster","webmaster","careers","jobs"];

const EMAIL_DOMAIN_STOPLIST = new Set([
  "swimply.com","peerspace.com","giggster.com","airbnb.com","vrbo.com",
  "wix.com","wixpress.com","squarespace.com","wordpress.com","godaddy.com",
  "google.com","gmail.com","googleusercontent.com","gstatic.com",
  "cloudflare.com","cloudfront.net","sentry.io","facebook.com","fbcdn.net",
  "instagram.com","stripe.com","jansport.com","jansport.co.uk","coupang.com","ebay.com",
  "amazon.com","amazonaws.com","alibaba.com","aliexpress.com","etsy.com","pinterest.com","reddit.com",
  "shopify.com","example.com","walmart.com","target.com","wayfair.com",
]);

// Hard-stop URL domains (and any subdomain). These never produce host matches.
const URL_DOMAIN_STOPLIST = [
  "jansport.com","jansport.co.uk","coupang.com","ebay.com","amazon.com",
  "amazonaws.com","alibaba.com","aliexpress.com","etsy.com","walmart.com",
  "target.com","wayfair.com","homedepot.com","lowes.com","pinterest.com",
  "tiktok.com","reddit.com","temu.com","wish.com","shein.com",
];

// Foreign corporate-registry TLDs / suffixes — when the listing is US-based
// these are auto-rejected. (Allow .io because it's used by US tech/SaaS sites.)
const FOREIGN_TLD_SUFFIXES = [
  ".de",".dk",".at",".ch",".fr",".it",".es",".pt",".nl",".be",".pl",".cz",
  ".ru",".cn",".jp",".kr",".in",".pk",".tr",".gr",".se",".no",".fi",".hu",
  ".ro",".rs",".hr",".si",".sk",".bg",".lt",".lv",".ee",".ua",
];

const URL_PATH_STOPLIST = [
  "/product/","/products/","/dp/","/itm/","/sku/","/listing/","/item/",
  "/vm/products/","/p/products/","/catalog/","/shop/",
];

// Allowlist — these are the people-search / social sources we trust to surface
// a real host's contact info. Everything else gets a confidence penalty.
export const SOURCE_ALLOWLIST = new Set([
  "facebook.com","linkedin.com","instagram.com","twitter.com","x.com",
  "whitepages.com","truepeoplesearch.com","fastpeoplesearch.com",
  "beenverified.com","spokeo.com","nuwber.com","intelius.com","peoplefinder.com",
  "yelp.com","nextdoor.com",
]);

// Business-entity tokens. If a "candidate name" contains any of these and the
// host's first name does NOT appear, it's not a person — kill it.
const BUSINESS_ENTITY_TOKENS = [
  "gmbh","d.o.o.","d.o.o","a/s","a.s.","aps","oy","ab","sp. z o.o.","s.r.l.","s.r.o.","s.a.","s.l.",
  "ltd","ltd.","limited","llc","l.l.c.","inc","inc.","incorporated","corp","corp.","corporation",
  "consulate","embassy","foundation","services","holdings","group","solutions","enterprises",
  "association","institute","university","college","department","ministry","bureau","agency",
  "warehousing","logistics","industries","manufacturing","trading","import","export",
];

export function normalizePhoneToTen(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

/**
 * Validate a US/CA phone number AND check it isn't a SKU/ID embedded in a URL.
 */
export function validateUSPhone(raw: string, sourceContext?: string): { ok: boolean; normalized?: string; reason?: string } {
  // Reject obvious international (+ followed by non-1 country code)
  const trimmed = raw.trim();
  if (/^\+(?!1)/.test(trimmed)) return { ok: false, reason: "non-US/CA country code" };

  const allDigits = trimmed.replace(/\D/g, "");
  // Reject overly long numbers (likely product IDs / partial substrings)
  if (allDigits.length > 11) return { ok: false, reason: "too many digits (likely ID)" };

  const ten = normalizePhoneToTen(trimmed);
  if (!ten) return { ok: false, reason: "not 10 digits" };

  const areaCode = ten.slice(0, 3);
  const central = ten.slice(3, 6);

  if (!VALID_AREA_CODES.has(areaCode)) return { ok: false, reason: `invalid area code ${areaCode}` };
  if (central.startsWith("0") || central.startsWith("1")) return { ok: false, reason: "invalid central office code" };
  if (/^(\d)\1{9}$/.test(ten)) return { ok: false, reason: "repeated digits" };
  if (ten === "1234567890" || ten === "0123456789") return { ok: false, reason: "sequential" };
  if (ten.slice(3, 6) === "555") return { ok: false, reason: "555 placeholder" };

  if (sourceContext) {
    const idx = sourceContext.indexOf(raw);
    if (idx >= 0) {
      const before = sourceContext.slice(Math.max(0, idx - 60), idx);
      const after = sourceContext.slice(idx + raw.length, idx + raw.length + 60);
      const window = (before + after).toLowerCase();
      if (/\/[\w-]*$/.test(before)) return { ok: false, reason: "appears in URL path" };
      if (/[?&][\w-]+=$/.test(before)) return { ok: false, reason: "appears in query string" };
      if (/(sku|product|item|id|asin|gtin|upc|ref|pid|prd)[=:_\-/]?\s*$/i.test(before)) return { ok: false, reason: "appears as product identifier" };
      if (/^[\w-]*\//.test(after) && /\//.test(before)) return { ok: false, reason: "appears mid-path" };
      if (/\.(jpg|jpeg|png|gif|webp|pdf|html?)\b/i.test(after.slice(0, 8))) return { ok: false, reason: "appears in filename" };
      if (window.includes("href=") && (before.endsWith("/") || before.endsWith("="))) return { ok: false, reason: "appears in href" };
      if (/amazonaws\.com|cloudfront|s3\./i.test(window)) return { ok: false, reason: "appears in CDN/bucket URL" };
    }
  }

  return { ok: true, normalized: ten };
}

export function formatPhoneForDisplay(ten: string): string {
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

export function validateEmail(email: string, opts?: { firstName?: string | null }): { ok: boolean; reason?: string; isRole?: boolean } {
  const lower = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lower)) return { ok: false, reason: "not an email" };
  const [local, domain] = lower.split("@");
  if (EMAIL_DOMAIN_STOPLIST.has(domain)) return { ok: false, reason: `stoplist domain ${domain}` };
  for (const d of EMAIL_DOMAIN_STOPLIST) {
    if (domain.endsWith(`.${d}`)) return { ok: false, reason: `stoplist domain ${domain}` };
  }
  const isRole = ROLE_EMAIL_PREFIXES.some((p) => local === p || local.startsWith(`${p}+`) || local.startsWith(`${p}.`));
  if (isRole) {
    if (opts?.firstName && local.includes(opts.firstName.toLowerCase())) return { ok: true, isRole: true };
    return { ok: false, reason: "role email, no name match", isRole: true };
  }
  return { ok: true };
}

export function isStoplistedUrl(url: string, opts?: { listingIsUS?: boolean }): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (URL_DOMAIN_STOPLIST.some((d) => host === d || host.endsWith(`.${d}`))) return true;
    // *.s3.* buckets and CDN buckets
    if (/(^|\.)s3[.-]/.test(host) || host.includes(".s3.amazonaws.com") || host.endsWith(".cloudfront.net")) return true;
    if (host.endsWith(".shop")) return true;
    // Foreign TLDs when listing is US
    if (opts?.listingIsUS !== false) {
      if (FOREIGN_TLD_SUFFIXES.some((suf) => host.endsWith(suf))) return true;
    }
    const path = u.pathname.toLowerCase();
    if (URL_PATH_STOPLIST.some((p) => path.includes(p))) return true;
    // Numeric-only path segment > 6 digits = product ID
    if (/\/\d{7,}\b/.test(path)) return true;
    return false;
  } catch {
    return false;
  }
}

export function getDomainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowlistedSource(url: string | null | undefined): boolean {
  const host = getDomainFromUrl(url);
  if (!host) return false;
  for (const d of SOURCE_ALLOWLIST) {
    if (host === d || host.endsWith(`.${d}`)) return true;
  }
  return false;
}

/** Looks like a real human first name? Used to filter out business entities. */
export function looksLikeFirstName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  // Must start with capital letter, only letters/spaces/hyphens/apostrophes
  if (!/^[A-Z][a-zA-Z'’\- ]{1,40}$/.test(trimmed)) return false;
  // Reject if any business entity token appears
  const lower = trimmed.toLowerCase();
  for (const tok of BUSINESS_ENTITY_TOKENS) {
    if (lower.includes(tok)) return false;
  }
  return true;
}

export function containsBusinessEntity(name: string | null | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return BUSINESS_ENTITY_TOKENS.some((t) => lower.includes(t));
}

// ---------------------------------------------------------------------------
// Confidence scoring with transparent breakdown
// ---------------------------------------------------------------------------

export type ConfidenceCheck = {
  label: string;
  passed: boolean;
  points: number;
  max: number;
  detail?: string;
};

export type ConfidenceBreakdown = {
  total: number;
  checks: ConfidenceCheck[];
};

export function scoreCandidate(input: {
  candidate_name?: string | null;
  candidate_business_name?: string | null;
  candidate_phone?: string | null;
  candidate_email?: string | null;
  candidate_website?: string | null;
  candidate_source_url?: string | null;
  host_first_name?: string | null;
  host_city?: string | null;
  host_state?: string | null;
  result_text?: string | null; // title + description from search
}): ConfidenceBreakdown {
  const checks: ConfidenceCheck[] = [];

  // 1. Phone format valid (30 pts)
  let phoneOk = false;
  let phoneDetail = "no phone provided";
  if (input.candidate_phone) {
    const v = validateUSPhone(input.candidate_phone);
    phoneOk = v.ok;
    phoneDetail = v.ok ? `valid NANP (${v.normalized})` : (v.reason || "invalid");
  } else {
    // Email or website acts as partial substitute — give half credit if email valid
    if (input.candidate_email && validateEmail(input.candidate_email, { firstName: input.host_first_name }).ok) {
      checks.push({ label: "Phone format valid", passed: false, points: 15, max: 30, detail: "no phone, but email valid (half credit)" });
    } else {
      checks.push({ label: "Phone format valid", passed: false, points: 0, max: 30, detail: phoneDetail });
    }
  }
  if (input.candidate_phone) {
    checks.push({ label: "Phone format valid", passed: phoneOk, points: phoneOk ? 30 : 0, max: 30, detail: phoneDetail });
  }

  // 2. Name looks like a person (25 pts)
  const nameToCheck = input.candidate_name;
  const isPerson = looksLikeFirstName(nameToCheck) || (!!nameToCheck && !containsBusinessEntity(nameToCheck));
  const isBusiness = containsBusinessEntity(nameToCheck);
  checks.push({
    label: "Name looks like a person",
    passed: isPerson && !isBusiness,
    points: isPerson && !isBusiness ? 25 : 0,
    max: 25,
    detail: !nameToCheck ? "no name" : isBusiness ? `business entity detected: "${nameToCheck}"` : `"${nameToCheck}"`,
  });

  // 3. Source domain is not marketplace/product page (25 pts)
  const sourceUrl = input.candidate_source_url || input.candidate_website;
  const sourceHost = getDomainFromUrl(sourceUrl);
  const listingIsUS = !!input.host_state;
  const sourceBlocked = sourceUrl ? isStoplistedUrl(sourceUrl, { listingIsUS }) : false;
  const sourceAllowed = isAllowlistedSource(sourceUrl);
  let sourcePts = 0;
  let sourceDetail = sourceHost || "no source url";
  if (sourceBlocked) {
    sourcePts = 0;
    sourceDetail = `${sourceHost} is blocklisted`;
  } else if (sourceAllowed) {
    sourcePts = 25;
    sourceDetail = `${sourceHost} on allowlist`;
  } else if (sourceHost) {
    sourcePts = 10; // unknown but not blocked
    sourceDetail = `${sourceHost} (unknown source)`;
  }
  checks.push({
    label: "Source domain is trusted",
    passed: sourcePts >= 25,
    points: sourcePts,
    max: 25,
    detail: sourceDetail,
  });

  // 4. Geographic match to listing state (20 pts)
  const text = ((input.result_text || "") + " " + (input.candidate_website || "") + " " + (input.candidate_source_url || "")).toLowerCase();
  let geoPts = 0;
  let geoDetail = "no geo signals";
  const cityMatch = input.host_city && text.includes(input.host_city.toLowerCase());
  const stateMatch = input.host_state && (
    new RegExp(`\\b${input.host_state.toLowerCase()}\\b`).test(text) ||
    text.includes(`, ${input.host_state.toLowerCase()}`)
  );
  if (cityMatch && stateMatch) { geoPts = 20; geoDetail = `city + state match (${input.host_city}, ${input.host_state})`; }
  else if (cityMatch) { geoPts = 15; geoDetail = `city match (${input.host_city})`; }
  else if (stateMatch) { geoPts = 8; geoDetail = `state match (${input.host_state})`; }
  checks.push({ label: "Geographic match to listing", passed: geoPts >= 15, points: geoPts, max: 20, detail: geoDetail });

  // De-dupe phone check if both branches added
  const seen = new Set<string>();
  const dedupedChecks: ConfidenceCheck[] = [];
  for (const c of checks) {
    if (seen.has(c.label)) continue;
    seen.add(c.label);
    dedupedChecks.push(c);
  }

  const total = dedupedChecks.reduce((s, c) => s + c.points, 0);
  return { total, checks: dedupedChecks };
}

// ---------------------------------------------------------------------------
// Self-test against known-bad inputs (called from a dev script)
// ---------------------------------------------------------------------------
export function runSelfTests() {
  const cases = [
    {
      name: "Coupang product ID phone",
      input: () => validateUSPhone("8208159234", "https://m.coupang.com/vm/products/8208159234"),
      expectReject: true,
    },
    {
      name: "Business entity name 'Warehousing Foundation d.o.o.'",
      input: () => ({ ok: !containsBusinessEntity("Warehousing Foundation d.o.o."), reason: "business entity" }),
      expectReject: true,
    },
    {
      name: "S3 bucket source url",
      input: () => ({ ok: !isStoplistedUrl("https://phonenumberlookupbcqx.s3.amazonaws.com/foo.html"), reason: "s3 bucket" }),
      expectReject: true,
    },
    {
      name: "JanSport product page",
      input: () => ({ ok: !isStoplistedUrl("https://www.jansport.com/products/abc"), reason: "jansport" }),
      expectReject: true,
    },
    {
      name: "GmbH business name",
      input: () => ({ ok: !containsBusinessEntity("Auto Repair Consulate GmbH"), reason: "business entity" }),
      expectReject: true,
    },
    {
      name: "Real US phone (212) 555-... rejected as 555 placeholder",
      input: () => validateUSPhone("(212) 555-0123"),
      expectReject: true,
    },
    {
      name: "Real US phone (415) 222-3344",
      input: () => validateUSPhone("(415) 222-3344"),
      expectReject: false,
    },
    {
      name: "Foreign domain (.de) when listing is US",
      input: () => ({ ok: !isStoplistedUrl("https://example.de/foo", { listingIsUS: true }), reason: "foreign tld" }),
      expectReject: true,
    },
    {
      name: "Allowlisted source whitepages.com",
      input: () => ({ ok: isAllowlistedSource("https://www.whitepages.com/name/Dee-Smith"), reason: "allowlist" }),
      expectReject: false,
    },
  ];

  return cases.map((c) => {
    const r = c.input() as any;
    const rejected = !r.ok;
    const pass = rejected === c.expectReject;
    return { name: c.name, expectReject: c.expectReject, rejected, reason: r.reason, pass };
  });
}
