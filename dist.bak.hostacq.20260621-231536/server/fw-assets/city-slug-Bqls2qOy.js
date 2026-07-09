const HOST_ACQ_PREFIXES = [
  "become-a-swimming-pool-host-",
  "become-a-pool-host-"
];
const SPANISH_HOST_ACQ_PREFIX = "conviertete-en-anfitrion-de-piscina-";
const ACTIVITY_CITY_PREFIXES = [
  "pool-party-venues-",
  "baby-shower-venues-",
  "birthday-party-venues-",
  "hot-tub-rental-",
  "dog-friendly-pools-"
].sort((a, b) => b.length - a.length);
function cityForContentPage(templateType, slug) {
  if (!slug) return null;
  switch (templateType) {
    case "host_acq_city": {
      for (const p of HOST_ACQ_PREFIXES) {
        if (slug.startsWith(p)) return slug.slice(p.length);
      }
      return null;
    }
    case "swim_instructor_city": {
      const p = "swim-instructor-pool-rental-";
      if (slug.startsWith(p)) return slug.slice(p.length);
      return null;
    }
    case "spanish_host_acq": {
      if (slug.startsWith(SPANISH_HOST_ACQ_PREFIX)) {
        return slug.slice(SPANISH_HOST_ACQ_PREFIX.length);
      }
      return null;
    }
    case "activity_city": {
      for (const p of ACTIVITY_CITY_PREFIXES) {
        if (slug.startsWith(p)) {
          const rest = slug.slice(p.length);
          return rest.length > 0 ? rest : null;
        }
      }
      return null;
    }
    default:
      return null;
  }
}
const US_STATE_CODES = /* @__PURE__ */ new Set([
  "al",
  "ak",
  "az",
  "ar",
  "ca",
  "co",
  "ct",
  "de",
  "fl",
  "ga",
  "hi",
  "id",
  "il",
  "in",
  "ia",
  "ks",
  "ky",
  "la",
  "me",
  "md",
  "ma",
  "mi",
  "mn",
  "ms",
  "mo",
  "mt",
  "ne",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "nc",
  "nd",
  "oh",
  "ok",
  "or",
  "pa",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "vt",
  "va",
  "wa",
  "wv",
  "wi",
  "wy",
  "dc"
]);
function parseCitySlug(citySlug) {
  const parts = citySlug.split("-").filter(Boolean);
  if (parts.length === 0) return { city: citySlug, stateCode: null };
  const last = parts[parts.length - 1].toLowerCase();
  if (parts.length >= 2 && US_STATE_CODES.has(last)) {
    const cityParts = parts.slice(0, -1);
    return { city: titleCase(cityParts), stateCode: last.toUpperCase() };
  }
  return { city: titleCase(parts), stateCode: null };
}
function titleCase(words) {
  return words.map((w) => w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)).join(" ");
}
export {
  cityForContentPage as c,
  parseCitySlug as p
};
