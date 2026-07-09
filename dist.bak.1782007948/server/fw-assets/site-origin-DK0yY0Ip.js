const PROD_ORIGIN$1 = "https://www.poolrentalnearme.com";
const DEV_ORIGIN = "http://localhost:3000";
function isLovableHost(host) {
  return host.includes("lovable.app");
}
function readHeader(request, name) {
  if (!request) return null;
  try {
    const value = request.headers.get(name);
    return value && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}
function getCanonicalOrigin(request) {
  const fwdHost = readHeader(request, "x-forwarded-host");
  if (fwdHost && !isLovableHost(fwdHost)) {
    const proto = readHeader(request, "x-forwarded-proto") ?? "https";
    return `${proto}://${fwdHost}`;
  }
  const envOrigin = (() => {
    try {
      return process.env.PUBLIC_SITE_ORIGIN ?? null;
    } catch {
      return null;
    }
  })();
  if (envOrigin && !isLovableHost(envOrigin)) {
    return envOrigin.replace(/\/+$/, "");
  }
  const isDev = (() => {
    try {
      return false;
    } catch {
      return false;
    }
  })();
  return isDev ? DEV_ORIGIN : PROD_ORIGIN$1;
}
const PROD_ORIGIN = "https://www.poolrentalnearme.com";
function absUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${PROD_ORIGIN}${normalized}`;
}
export {
  PROD_ORIGIN as P,
  absUrl as a,
  getCanonicalOrigin as g
};
