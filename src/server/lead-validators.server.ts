/**
 * Lead validators — kill garbage matches before they're ever inserted.
 * Used by host-matcher and contact-enricher.
 */

// NANP valid area codes (US + CA + territories) — abbreviated to the active set.
// Source: NANPA. We err on the side of including; we mostly want to reject
// obvious junk like 000, 111, 555, 800-series scam patterns, etc.
const VALID_AREA_CODES = new Set<string>([
  "201","202","203","204","205","206","207","208","209","210","212","213","214","215","216","217","218","219","220","223","224","225","226","227","228","229","231","234","236","239","240","248","249","250","251","252","253","254","256","260","262","263","264","267","268","269","270","272","274","276","279","281","283","289",
  "301","302","303","304","305","306","307","308","309","310","312","313","314","315","316","317","318","319","320","321","323","325","326","327","330","331","332","334","336","337","339","340","341","343","345","346","347","351","352","354","360","361","363","364","365","367","368","369","380","382","385","386","387",
  "401","402","403","404","405","406","407","408","409","410","412","413","414","415","416","417","418","419","420","423","424","425","428","430","431","432","434","435","437","438","440","441","442","443","445","447","448","450","458","463","464","467","468","469","470","473","474","475","478","479","480","484",
  "501","502","503","504","505","506","507","508","509","510","512","513","514","515","516","517","518","519","520","521","522","523","524","525","526","527","528","529","530","531","532","533","534","539","540","541","543","544","545","546","547","548","549","551","557","559","561","562","563","564","565","566","567","570","571","572","573","574","575","579","580","581","582","584","585","586","587","588","589","595","596","598","599",
  "601","602","603","604","605","606","607","608","609","610","612","613","614","615","616","617","618","619","620","623","624","626","628","629","630","631","636","639","640","641","645","646","647","649","650","651","656","657","658","659","660","661","662","664","667","669","670","671","672","678","680","681","682","683","684","689","680",
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
  "instagram.com","stripe.com","jansport.com","coupang.com","ebay.com",
  "amazon.com","alibaba.com","etsy.com","pinterest.com","reddit.com",
  "shopify.com","example.com",
]);

const URL_DOMAIN_STOPLIST = [
  "jansport.com","coupang.com","ebay.com","amazon.com","alibaba.com",
  "aliexpress.com","etsy.com","walmart.com","target.com","wayfair.com",
  "homedepot.com","lowes.com","pinterest.com","tiktok.com",
];

const URL_PATH_STOPLIST = ["/product/","/products/","/dp/","/itm/","/sku/","/p/","/listing/","/item/"];

export function normalizePhoneToTen(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

/**
 * Validate a US/CA phone number AND check it isn't a SKU/ID embedded in a URL.
 * sourceContext: optional surrounding text where the phone was found, used to
 * detect URL/path/SKU contexts that smell like product identifiers.
 */
export function validateUSPhone(raw: string, sourceContext?: string): { ok: boolean; normalized?: string; reason?: string } {
  const ten = normalizePhoneToTen(raw);
  if (!ten) return { ok: false, reason: "not 10 digits" };

  const areaCode = ten.slice(0, 3);
  const central = ten.slice(3, 6);

  if (!VALID_AREA_CODES.has(areaCode)) return { ok: false, reason: `invalid area code ${areaCode}` };
  if (central.startsWith("0") || central.startsWith("1")) return { ok: false, reason: "invalid central office code" };

  // Sequential / repeated patterns
  if (/^(\d)\1{9}$/.test(ten)) return { ok: false, reason: "repeated digits" };
  if (ten === "1234567890" || ten === "0123456789") return { ok: false, reason: "sequential" };
  if (/^555\d{7}$/.test(ten) && ten.slice(3, 6) === "555") return { ok: false, reason: "555 placeholder" };

  // Surrounding context: looks like a URL path / query / SKU / product id?
  if (sourceContext) {
    const idx = sourceContext.indexOf(raw);
    if (idx >= 0) {
      const before = sourceContext.slice(Math.max(0, idx - 40), idx);
      const after = sourceContext.slice(idx + raw.length, idx + raw.length + 40);
      const window = (before + after).toLowerCase();
      if (/\/[\w-]*$/.test(before)) return { ok: false, reason: "appears in URL path" };
      if (/[?&][\w-]+=$/.test(before)) return { ok: false, reason: "appears in query string" };
      if (/(sku|product|item|id|asin|gtin|upc)[=:_-]?$/i.test(before)) return { ok: false, reason: "appears as product identifier" };
      if (/^[\w-]*\//.test(after) && /\//.test(before)) return { ok: false, reason: "appears mid-path" };
      if (window.includes("href=") && (before.endsWith("/") || before.endsWith("="))) return { ok: false, reason: "appears in href" };
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

  const isRole = ROLE_EMAIL_PREFIXES.some((p) => local === p || local.startsWith(`${p}+`) || local.startsWith(`${p}.`));
  if (isRole) {
    // Allow role emails only if first name appears in local part
    if (opts?.firstName && local.includes(opts.firstName.toLowerCase())) return { ok: true, isRole: true };
    return { ok: false, reason: "role email, no name match", isRole: true };
  }
  return { ok: true };
}

export function isStoplistedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (URL_DOMAIN_STOPLIST.some((d) => host === d || host.endsWith(`.${d}`))) return true;
    if (host.endsWith(".shop")) return true;
    const path = u.pathname.toLowerCase();
    if (URL_PATH_STOPLIST.some((p) => path.includes(p))) return true;
    return false;
  } catch {
    return false;
  }
}
