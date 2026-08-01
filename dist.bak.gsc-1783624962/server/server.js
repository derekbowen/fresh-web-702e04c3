import { AsyncLocalStorage } from "node:async_hooks";
import { H3Event, toResponse, clearSession, deleteCookie, parseCookies, getRequestHost, getRequestIP, getRequestProtocol, getRequestURL, getSession, getValidatedQuery, sealSession, setCookie, sanitizeStatusCode, sanitizeStatusMessage, unsealSession, updateSession, useSession } from "h3-v2";
import { rootRouteId, parseRedirect, isRedirect, defaultSerovalPlugins, makeSerovalPlugin, createRawStreamRPCPlugin, invariant, isNotFound, resolveManifestAssetLink, createSerializationAdapter, isResolvedRedirect, executeRewriteInput } from "@tanstack/router-core";
import { toCrossJSONStream, fromJSON, toCrossJSONAsync } from "seroval";
import { createMemoryHistory } from "@tanstack/history";
import { mergeHeaders } from "@tanstack/router-core/ssr/client";
import { getNormalizedURL, getOrigin, attachRouterServerSsrUtils } from "@tanstack/router-core/ssr/server";
import "react";
import { RouterProvider } from "@tanstack/react-router";
import { jsx } from "react/jsx-runtime";
import { defineHandlerCallback, renderRouterToStream } from "@tanstack/react-router/ssr/server";
function StartServer(props) {
  return /* @__PURE__ */ jsx(RouterProvider, { router: props.router });
}
var defaultStreamHandler = defineHandlerCallback(({ request, router, responseHeaders }) => renderRouterToStream({
  request,
  router,
  responseHeaders,
  children: /* @__PURE__ */ jsx(StartServer, { router })
}));
var GLOBAL_EVENT_STORAGE_KEY = /* @__PURE__ */ Symbol.for("tanstack-start:event-storage");
var globalObj$1 = globalThis;
if (!globalObj$1[GLOBAL_EVENT_STORAGE_KEY]) globalObj$1[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
var eventStorage = globalObj$1[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
  return typeof value.then === "function";
}
function getSetCookieValues(headers) {
  const headersWithSetCookie = headers;
  if (typeof headersWithSetCookie.getSetCookie === "function") return headersWithSetCookie.getSetCookie();
  const value = headers.get("set-cookie");
  return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
  if (response.ok) return;
  const eventSetCookies = getSetCookieValues(event.res.headers);
  if (eventSetCookies.length === 0) return;
  const responseSetCookies = getSetCookieValues(response.headers);
  response.headers.delete("set-cookie");
  for (const cookie of responseSetCookies) response.headers.append("set-cookie", cookie);
  for (const cookie of eventSetCookies) response.headers.append("set-cookie", cookie);
}
function attachResponseHeaders(value, event) {
  if (isPromiseLike(value)) return value.then((resolved) => {
    if (resolved instanceof Response) mergeEventResponseHeaders(resolved, event);
    return resolved;
  });
  if (value instanceof Response) mergeEventResponseHeaders(value, event);
  return value;
}
function requestHandler(handler) {
  return (request, requestOpts) => {
    let h3Event;
    try {
      h3Event = new H3Event(request);
    } catch (error) {
      if (error instanceof URIError) return new Response(null, {
        status: 400,
        statusText: "Bad Request"
      });
      throw error;
    }
    return toResponse(attachResponseHeaders(eventStorage.run({ h3Event }, () => handler(request, requestOpts)), h3Event), h3Event);
  };
}
function getH3Event() {
  const event = eventStorage.getStore();
  if (!event) throw new Error(`No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
  return event.h3Event;
}
function getRequest() {
  return getH3Event().req;
}
function getRequestHeaders() {
  return getH3Event().req.headers;
}
function getRequestHeader(name) {
  return getRequestHeaders().get(name) || void 0;
}
function getRequestIP$1(opts) {
  return getRequestIP(getH3Event(), opts);
}
function getRequestHost$1(opts) {
  return getRequestHost(getH3Event(), opts);
}
function getRequestUrl(opts) {
  return getRequestURL(getH3Event(), opts);
}
function getRequestProtocol$1(opts) {
  return getRequestProtocol(getH3Event(), opts);
}
function setResponseHeaders(headers) {
  const event = getH3Event();
  for (const [name, value] of Object.entries(headers)) event.res.headers.set(name, value);
}
function getResponseHeaders() {
  return getH3Event().res.headers;
}
function getResponseHeader(name) {
  return getH3Event().res.headers.get(name) || void 0;
}
function setResponseHeader(name, value) {
  const event = getH3Event();
  if (Array.isArray(value)) {
    event.res.headers.delete(name);
    for (const valueItem of value) event.res.headers.append(name, valueItem);
  } else event.res.headers.set(name, value);
}
function removeResponseHeader(name) {
  getH3Event().res.headers.delete(name);
}
function clearResponseHeaders(headerNames) {
  const event = getH3Event();
  if (headerNames && headerNames.length > 0) for (const name of headerNames) event.res.headers.delete(name);
  else for (const name of event.res.headers.keys()) event.res.headers.delete(name);
}
function getResponseStatus() {
  return getH3Event().res.status || 200;
}
function setResponseStatus(code, text) {
  const event = getH3Event();
  if (code) event.res.status = sanitizeStatusCode(code, event.res.status);
  if (text) event.res.statusText = sanitizeStatusMessage(text);
}
function getCookies() {
  const cookies = parseCookies(getH3Event());
  const definedCookies = /* @__PURE__ */ Object.create(null);
  for (const [name, value] of Object.entries(cookies)) if (value !== void 0) definedCookies[name] = value;
  return definedCookies;
}
function getCookie(name) {
  return getCookies()[name];
}
function setCookie$1(name, value, options) {
  setCookie(getH3Event(), name, value, options);
}
function deleteCookie$1(name, options) {
  deleteCookie(getH3Event(), name, options);
}
function getDefaultSessionConfig(config) {
  return {
    name: "start",
    ...config
  };
}
function useSession$1(config) {
  return useSession(getH3Event(), getDefaultSessionConfig(config));
}
function getSession$1(config) {
  return getSession(getH3Event(), getDefaultSessionConfig(config));
}
function updateSession$1(config, update) {
  return updateSession(getH3Event(), getDefaultSessionConfig(config), update);
}
function sealSession$1(config) {
  return sealSession(getH3Event(), getDefaultSessionConfig(config));
}
function unsealSession$1(config, sealed) {
  return unsealSession(getH3Event(), getDefaultSessionConfig(config), sealed);
}
function clearSession$1(config) {
  return clearSession(getH3Event(), {
    name: "start",
    ...config
  });
}
function getResponse() {
  return getH3Event().res;
}
function getValidatedQuery$1(schema) {
  return getValidatedQuery(getH3Event(), schema);
}
var HEADERS = { TSS_SHELL: "X-TSS_SHELL" };
async function getStartManifest(matchedRoutes) {
  const { tsrStartManifest } = await import("./fw-assets/_tanstack-start-manifest_v-CyjbEO81.js");
  const startManifest = tsrStartManifest();
  const rootRoute = startManifest.routes[rootRouteId] = startManifest.routes[rootRouteId] || {};
  rootRoute.assets = rootRoute.assets || [];
  let injectedHeadScripts;
  return {
    manifest: { routes: Object.fromEntries(Object.entries(startManifest.routes).flatMap(([k, v]) => {
      const result = {};
      let hasData = false;
      if (v.preloads && v.preloads.length > 0) {
        result["preloads"] = v.preloads;
        hasData = true;
      }
      if (v.assets && v.assets.length > 0) {
        result["assets"] = v.assets;
        hasData = true;
      }
      if (!hasData) return [];
      return [[k, result]];
    })) },
    clientEntry: startManifest.clientEntry,
    injectedHeadScripts
  };
}
const manifest = {
  "cf9c28fe0ebd74187307812640274bc1bc7e7ed788525f83a9f2f1c51dea67e7": {
    functionName: "unsubscribeRenter_createServerFn_handler",
    importer: () => import("./fw-assets/unsubscribe-renter-BZzgs1Bi.js")
  },
  "a41359f47a55a453303790c2acaded78dc2455792165ce029a3ba74e5c33de59": {
    functionName: "unsubscribeHost_createServerFn_handler",
    importer: () => import("./fw-assets/unsubscribe-host-D6dG3_8O.js")
  },
  "fb8c0612cbfc1cf047b1536b4331437017d1a14ee5f681e1af97162f21ea9ee7": {
    functionName: "unsubscribeComposer_createServerFn_handler",
    importer: () => import("./fw-assets/unsubscribe-composer-DM_Dcazu.js")
  },
  "64d1b9724b52363c0c9e704af2dc508be1bd0de12332f0add16958d200d0b3e5": {
    functionName: "getRenterDripStats_createServerFn_handler",
    importer: () => import("./fw-assets/admin.renter-drip-86koyZ0p.js")
  },
  "176ef6087ced490f189541f2aef8c7864c1c8160a95b0020bed18a856e5fabbc": {
    functionName: "runPollNow_createServerFn_handler",
    importer: () => import("./fw-assets/admin.renter-drip-86koyZ0p.js")
  },
  "4e451ce5c630005e8b740159d06ae4c17becf1790a22bd7506759961fa195442": {
    functionName: "runSendNow_createServerFn_handler",
    importer: () => import("./fw-assets/admin.renter-drip-86koyZ0p.js")
  },
  "28f46cc2d7c87c7f94dcfbc4c7f251e6730af076d6e5c76265185a10115056d2": {
    functionName: "runBackfillAll_createServerFn_handler",
    importer: () => import("./fw-assets/admin.renter-drip-86koyZ0p.js")
  },
  "419f7deee03a76702e51abbc66e02377056ac5fe32a2a7913144effb4762cdd4": {
    functionName: "getHostDripStats_createServerFn_handler",
    importer: () => import("./fw-assets/admin.host-drip-DvtzZE1T.js")
  },
  "2f96e28ab0cab80fb423363e2fc82d7a7cd1e2b2a4032f5e6f3a78b19fa8c75d": {
    functionName: "runPollNow_createServerFn_handler",
    importer: () => import("./fw-assets/admin.host-drip-DvtzZE1T.js")
  },
  "52b7ea1eb8607930f2ec1ff76325a2262d69193f5d6b39cf7c3e048bfab8886b": {
    functionName: "runSendNow_createServerFn_handler",
    importer: () => import("./fw-assets/admin.host-drip-DvtzZE1T.js")
  },
  "1641fc6aaa81dd89297aae0b6c529dec914ca7858d43d0f98d6c0f5dd16003a8": {
    functionName: "runBroadcastShareLink_createServerFn_handler",
    importer: () => import("./fw-assets/admin.host-drip-DvtzZE1T.js")
  },
  "e028b1393a816be28be64b94c2d5933631462a52b897f4192fa14f666644c741": {
    functionName: "fetchAudienceCounts_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "2763f9edb025ee2b66f2f52462e132526956f0f2c0e28e32264e76fb66855d55": {
    functionName: "fetchRecentCampaigns_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "841744c410b9297ab5699138e9456fd9e5b5aa8533a3809393f15e6108e0f70d": {
    functionName: "fetchAbTests_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "99a8e82493d70a0e7d40812e4f80ab150c3f894be8eafb4a257936a9aeab283b": {
    functionName: "fetchSnippets_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "c7bbc480c3bf13ed9ecee26ae3a1767e88b6bf195a4a372a5e4013d28c0be0b9": {
    functionName: "runSaveSnippet_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "129778482587e2b6ab1ffa854777b583c9491c0b44d92d2262a82d68d2885729": {
    functionName: "runDeleteSnippet_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "7a813682b2b8b0897f3de72bc1bf8ab0f57baa7b03f6a41531b43e940b9c0047": {
    functionName: "runLookupRecipient_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "b792d18ba013e13c93d779d80a5a9efba7e0669120762a75c0794f012e5369f7": {
    functionName: "runGenerateAI_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "59f43ca0ad560f4154b968c9829d9fc3b367f61762fe396d7f0b117257969af9": {
    functionName: "runGenerateSequence_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "389dc7360df13ff0a3386662a570daf452582c923492ac2e27886e146448200b": {
    functionName: "runScheduleSequence_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "e596b113679319da4bbc1cfe0d014d07062197c47a75f1f6dbcbb56a58ba7c34": {
    functionName: "runSendEmail_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "427a57ee72019d351543c364c765132d84370e971e55bd2b682da2a4cb73846d": {
    functionName: "runScheduleEmail_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "aa848c22d4b0256b0e726b89345165648e7e032382de5554eb0cae7a52fa33fd": {
    functionName: "cancelScheduledCampaign_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "0d06a9cef7c08c845cd1904749fc41478d272582d8485abaa2dff4c4c00c78be": {
    functionName: "runStartAbTest_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "04540870ccc7efaa1f88b7ab4f0ccad475189a4a88265c5fba8b74186d875512": {
    functionName: "runPickWinner_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "ddeb190d8fa1890ee565d011fc81afeb75cca67b79bfcc2cb0a3cd759be6a251": {
    functionName: "runCancelAb_createServerFn_handler",
    importer: () => import("./fw-assets/admin.email-composer-OUieVWrf.js")
  },
  "459e0bd50d3ce0d0a627c617ce8c0cb057f785c693a37b4f12037d719b2cefb1": {
    functionName: "fetchSubs_createServerFn_handler",
    importer: () => import("./fw-assets/admin.drip-subscribers-D6Hu4QcK.js")
  },
  "7928dadb38fd9bbecad4c57ba3ad924c5b97be7d77d5fec49a51f964d928a69a": {
    functionName: "updateStatus_createServerFn_handler",
    importer: () => import("./fw-assets/admin.drip-subscribers-D6Hu4QcK.js")
  },
  "e0211a9d106b99a30402bad62409cd3c4bea284d35c8e29c4d46d23462c9f376": {
    functionName: "bulkUpdate_createServerFn_handler",
    importer: () => import("./fw-assets/admin.drip-subscribers-D6Hu4QcK.js")
  },
  "4f39613f620aba63963fb1552d47c9c5e3f902be3953d01389d12012cb6b73c4": {
    functionName: "getSiteFooter_createServerFn_handler",
    importer: () => import("./fw-assets/site-footer.functions-CGianVgH.js")
  },
  "ef3fd02513d3cad39306d22ee2ca1c4387e0a6fa82ee660205a133ebe2ef5b5e": {
    functionName: "getSiteFooterAdmin_createServerFn_handler",
    importer: () => import("./fw-assets/site-footer.functions-CGianVgH.js")
  },
  "bf638fbaa59a45334a7e9712503d06a6415be89e7eb19f84a159bbaa6cb2c5ad": {
    functionName: "updateSiteFooter_createServerFn_handler",
    importer: () => import("./fw-assets/site-footer.functions-CGianVgH.js")
  },
  "5ed86f26def732fcfd337ac51d46220d443d9b21c68d09a4c8c1b515f7b3601c": {
    functionName: "resetSiteFooter_createServerFn_handler",
    importer: () => import("./fw-assets/site-footer.functions-CGianVgH.js")
  },
  "d9670288464c877763105467f3d6f34bbf113cde0e28bd2a76c90768aed8abc0": {
    functionName: "getSharetribeAuthState_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe-session.functions-BoX705TB.js")
  },
  "79b64087660bdf4fb3cf48087cdebf222c62fa684137a15386958033986d4752": {
    functionName: "getStateHub_createServerFn_handler",
    importer: () => import("./fw-assets/state-hub.functions-B4_vDHGn.js")
  },
  "7f981f7440b17597ba65cf7c841b484ec4af448efa9dbe9542d6397d003ac5f1": {
    functionName: "getAllStateHubs_createServerFn_handler",
    importer: () => import("./fw-assets/state-hub.functions-B4_vDHGn.js")
  },
  "4c9441d3b6002616fda31deda2a8a4227b4d053d0084d0605b76c816e2b0b836": {
    functionName: "listBuilderStates_createServerFn_handler",
    importer: () => import("./fw-assets/builders.functions-bfYDJUKl.js")
  },
  "e32249312a5ac6377e83cd7ab18c9f46b327d1ba0ddaac9b1602a5aea2558b03": {
    functionName: "listAllBuilders_createServerFn_handler",
    importer: () => import("./fw-assets/builders.functions-bfYDJUKl.js")
  },
  "e8a588df9ea5f16c934ded3c1ab3c467647278f0d31bcc331d6d263391563e68": {
    functionName: "getBuildersByState_createServerFn_handler",
    importer: () => import("./fw-assets/builders.functions-bfYDJUKl.js")
  },
  "ddd8a524252354f8d281e76dc64a8671b3ce2e032663c538ed516e6667f90ffd": {
    functionName: "getBuildersByCity_createServerFn_handler",
    importer: () => import("./fw-assets/builders.functions-bfYDJUKl.js")
  },
  "52e5a9df7f3d469c9a46bf9fb8b5c0a4f283ae5bd87ec1dce2093dc046a3161e": {
    functionName: "submitProviderLead_createServerFn_handler",
    importer: () => import("./fw-assets/builders.functions-bfYDJUKl.js")
  },
  "f78c68b3168c5b0a9ba9b7f9bf7233486108d2ebbe6730d4d5777720feb6416f": {
    functionName: "getCityBySlug_createServerFn_handler",
    importer: () => import("./fw-assets/cities.functions-CrH6FzoO.js")
  },
  "8dc39875112299d43280ab8e8415072c8c2cbfa2f198c720671e85a7d1af18b7": {
    functionName: "lookupContentPage_createServerFn_handler",
    importer: () => import("./fw-assets/content-pages.functions-CGXyrZDY.js")
  },
  "8eadb45829ba365a732b45664ac3bef32a1fd5c9ca6b40aad78fd50c7efb8468": {
    functionName: "getHreflangSibling_createServerFn_handler",
    importer: () => import("./fw-assets/content-pages.functions-CGXyrZDY.js")
  },
  "bb5d3d0d2b3b73dd48ca1c4c0e9431d99be11e49d2b332f4894f8656efdcd926": {
    functionName: "getShareListing_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe.functions-Ce2ulEEz.js")
  },
  "24c49324d39d3d16fb55e6a3b1e44e2059495858d3d4ce5ec2db8844fb2d074f": {
    functionName: "getListing_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe.functions-Ce2ulEEz.js")
  },
  "70f04e447e5b237c46a6d2681f5964dc581e01c7e256218597e0c074ddbdebd1": {
    functionName: "queryListings_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe.functions-Ce2ulEEz.js")
  },
  "946ed872e43e051c3166418ae18f78cd38726d78075996dd9d4bf32abbebaea3": {
    functionName: "getHomeData_createServerFn_handler",
    importer: () => import("./fw-assets/home-data.functions-C6ayzCga.js")
  },
  "71074beb2f431503bd63e12e77a9bb17a2f1cc767377df27e8b65871bcf78ae0": {
    functionName: "checkAdminRole_createServerFn_handler",
    importer: () => import("./fw-assets/admin-auth.functions-DOnLFHWn.js")
  },
  "afac8bfe3154b7457c0db8b9e08466da974975f534e76a53513642ddb73adf4b": {
    functionName: "getMyCourseStatus_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "dfde4fa660570864703719cf860047fc23c67875bd40bfd03034d595792652e5": {
    functionName: "enrollInCourse_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "9f66b1ab0dfa44ad4bfce93f6d4651d0b255f149641cc2a1d38197880a889f48": {
    functionName: "markCourseComplete_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "4932e8049137a0c68fcd0c502a9ba97bcdf61f39ceb22ce98be6986be3c44902": {
    functionName: "recordHeartbeat_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "72e184fb111cf2c1c9cedf0c8d37df0f11c74914f1412e1bc5d0663dca09c3b6": {
    functionName: "logProgressEvent_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "02e21d1616191cc60af89621448091dda8d9055192d4874fdc05e4bf180ffbac": {
    functionName: "getMyCourseProgress_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "6ff6acd7fec4aa821745b01f6bb55b9cb8715ded6ff746e0a0fa4a69a5fca9d7": {
    functionName: "listMyProgress_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "06b78fe09a0da92572bf55b5e9eb09bb5037bb40b5df2773391bbf2b91140bd8": {
    functionName: "adminGetCourseSummary_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "f0ad419ab02c5dbdf80964f35052b8107ec9bfca80b84033c194f670f5327c97": {
    functionName: "adminListLearners_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "7a4992e2888b2164eada30c13e302f362c546163880609baa0016d7c153a9421": {
    functionName: "adminGetLearnerDetail_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "24ba682363f7014edc4d8dacd6fe835b82e127123292d0a671e973afbac3f435": {
    functionName: "listMyLearning_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "527352d4978d7394473053acb19c293f29c6b941b12799fa668b092f2debd786": {
    functionName: "verifyCertificate_createServerFn_handler",
    importer: () => import("./fw-assets/learning.functions-C_9PH2Df.js")
  },
  "78b890a64751dc1fa77a1fcbd4136714e6c2205a7ea32c71ae1882b50242c20d": {
    functionName: "getNearbyCitiesForPage_createServerFn_handler",
    importer: () => import("./fw-assets/nearby-cities.functions-fV3ACKMV.js")
  },
  "938eb8f8e10b36adf2cedd77488d0ef03e85b4a35ad99c31f79fdc76b5f81397": {
    functionName: "getCitySources_createServerFn_handler",
    importer: () => import("./fw-assets/city-sources.functions-DyDB6fOl.js")
  },
  "73cb5e46062dcac03bae88abd15e15438c0a270fb576390d6dfaf491512c5864": {
    functionName: "getInternalLinkTargets_createServerFn_handler",
    importer: () => import("./fw-assets/internal-links.functions-Blv6Z_Q1.js")
  },
  "b861a391ff5c69a64cd5ed90870fe31a07d11e4cc934dbc141a9c9100f88d251": {
    functionName: "log404_createServerFn_handler",
    importer: () => import("./fw-assets/content-404-log.functions-DbnaeeuD.js")
  },
  "d5855c7ec203d5072570f9def7914c5e5262be6d56334e14bb4311ed151aa05f": {
    functionName: "list404s_createServerFn_handler",
    importer: () => import("./fw-assets/content-404-log.functions-DbnaeeuD.js")
  },
  "8ab83e7b79975e2413e8d5fee5092790d00f93658f9d201d5fee2697a02c319a": {
    functionName: "resolve404_createServerFn_handler",
    importer: () => import("./fw-assets/content-404-log.functions-DbnaeeuD.js")
  },
  "ea4ced18ec0e39e288b27807d289364d09296a0c283167fb93894c1c5c895484": {
    functionName: "redirect404_createServerFn_handler",
    importer: () => import("./fw-assets/content-404-log.functions-DbnaeeuD.js")
  },
  "3f7d63ee75bd9996df2c97408fec354252b401593e294069550cf2f3408a9210": {
    functionName: "createPageFor404_createServerFn_handler",
    importer: () => import("./fw-assets/content-404-log.functions-DbnaeeuD.js")
  },
  "9ac8d7a29dd3aecbedd0a672eaaa51070a136b7b2346698a08d0ddec5fcc5919": {
    functionName: "getAcademyHub_createServerFn_handler",
    importer: () => import("./fw-assets/academy-hub.functions-BCMSiQ9v.js")
  },
  "92e3c948d3e68671260d896de132374bd970009577c9f2021504d97b38c1b938": {
    functionName: "listAcademyCourses_createServerFn_handler",
    importer: () => import("./fw-assets/academy-hub.functions-BCMSiQ9v.js")
  },
  "28d7cfc72c18ac332f7e7b2aa4a786ed86045dd487d3f78b9fc2a292b36c148a": {
    functionName: "enrichBlogPost_createServerFn_handler",
    importer: () => import("./fw-assets/blog-enrichment.functions-Dc63rAnn.js")
  },
  "80fd41dac91508246c5234c30eda47006932830f1a03667fd94897d820f08bd1": {
    functionName: "enrichBlogBatch_createServerFn_handler",
    importer: () => import("./fw-assets/blog-enrichment.functions-Dc63rAnn.js")
  },
  "d3c2a7e99e4d6ccb47b45f44ca1869f634951802f68222a756eb44b43a717566": {
    functionName: "getRelatedBlogMeta_createServerFn_handler",
    importer: () => import("./fw-assets/blog-enrichment.functions-Dc63rAnn.js")
  },
  "6c0b21a070fb08763de1b76b52dfd646879f4eddf8ad7eed82716c88a9ab9507": {
    functionName: "listServiceCategories_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "5f44553c02f93f264442f97bfed35d50ecec190e1d65a330478233c3847da65b": {
    functionName: "getCategoryWithProviders_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "279bb652db45f4ad8c915c922ff2210de5b713d798a1fb27a879823d4a0de284": {
    functionName: "getCategoryStateProviders_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "05f874bd6f89db40ee4d211bf87ae69042d7b545bdeb1a63b5391de69147b7e3": {
    functionName: "getCategoryCityProviders_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "526aa89d0f80b01cf7d4992cd9902ff8987f8aeb5d56b1b252d71b60daffdbef": {
    functionName: "listCategoryGeoCoverage_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "f26aa7f3b2c7ed27a5e5e5b93e26e41604f098702c9f3bfd569b10604f5e2df2": {
    functionName: "submitProviderListing_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "cc3b706532e7174d7edb437ba3ccfbee7d0e7324a45604422fea89b4927a090c": {
    functionName: "adminListPendingProviders_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "df19e06b9251ffcdb70e5ee23fc9cd363acf591743a9c419d013473dae6d8426": {
    functionName: "adminScrapeProviderUrl_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "c22f1be1fa0767dd471b7b210370a75b37ac8ac72829cfb34dd8726fb338316c": {
    functionName: "adminListScrapeJobs_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "603285ad21173c223cffc4d531f00f5725f82a23bda3f346a9d613e255810502": {
    functionName: "adminImportGscRows_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "9355e8f5cc6ef6bc87f49f106a89800747716d984b4d4f1f25b3d698bb168c24": {
    functionName: "adminGenerateProviderContent_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "c525005316a5e2a24ffa9100c6ad44bda5f927d3f01aa63048248e2d977ed481": {
    functionName: "adminListProvidersMissingAI_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "11ca4156ce30d160b183589e976fc837dc8ffb2630f4b8341dfd86ef55bf6cba": {
    functionName: "adminBulkGenerateProviderContent_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "498c731d7c4b3fedd8e7813883a64e1985cd4668b37a9222b8273997769103d8": {
    functionName: "adminUpdateProvider_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "3aaaec4f664ee02a164fc9f41b10527d13e0494de09916546e6f04db26003b06": {
    functionName: "submitProviderClaim_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "ab8e621daef98757eb3a39443207e2b68ac2cda182f34797fa603bc57ad3f4e3": {
    functionName: "adminListProviderClaims_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "ee5f8a8bcce0d83c807b27a54adc164fd643714a74f443700fb15cedcc4805b7": {
    functionName: "adminReviewProviderClaim_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "97d059c4d6aa722ad3a77614b08622323e968c000ac76acb3738e0b6caee2493": {
    functionName: "submitProviderPlanRequest_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "0d4872eccf19ad759e2fff9edc8c9e191206b13673f783709b07520bed65bc31": {
    functionName: "getProviderStatus_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "f0ffadc94a4cf446b4f1be0d3820a5b4d28edb89e5b740e551f235a7a74f332a": {
    functionName: "adminListPlanRequests_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "aee9607eec0eef59aec13e133b8ce275a93f7aaf470cc2b83346a15ba2bba7da": {
    functionName: "adminReviewPlanRequest_createServerFn_handler",
    importer: () => import("./fw-assets/directory.functions-DI9ftsi5.js")
  },
  "cbca93b18615dd3c3b1e7f928ad8fca76984653bf22824178e3306e102dfd77d": {
    functionName: "listPublishedBlogPosts_createServerFn_handler",
    importer: () => import("./fw-assets/blog-posts.functions-CfC_GEhz.js")
  },
  "7888cc70b7b717dc0a6b512834aa615767e6dd3827e62604f0ea84ec28de0d6f": {
    functionName: "getAllLocations_createServerFn_handler",
    importer: () => import("./fw-assets/all-locations.functions-C3zgxnvs.js")
  },
  "a299d5188002fd52fc20aa4ee3efab12b571e61773a00c95f2ec04990df7c25f": {
    functionName: "getTopCities_createServerFn_handler",
    importer: () => import("./fw-assets/top-cities.functions-CuNiq1tH.js")
  },
  "b7d5e20c6a117310b3122bfe251ba965bc2120364f0d609be4ba0bbf80e9e131": {
    functionName: "getCity_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "3e449c74c7e0ea3c0c398d29ca14c4c274929be533910e98753c07ce9ef33724": {
    functionName: "getCategory_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "3ba4b56c2f9808243a7605abde47d54a8f807a577eb5133a33619a3b33cd3acc": {
    functionName: "getProvider_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "a80684d216c66308d6f632d62319ae188bc81e487da0555b3d4945a269971dda": {
    functionName: "getBlogPost_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "845e56bf958978679713246213ffdd1df479f40d4e56eb0729a5a36ce9bf1295": {
    functionName: "getBlogLinkTargets_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "6ca5a289633d6eaa7a4851b9081e08bbcb3a9bdaa52a83587bcdb50e654f0030": {
    functionName: "listAllSitemapEntries_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "cc5e4db90b9b483e6286479667f56c7e1c074a40536427192affc125d0fc4d8e": {
    functionName: "getNearbyCities_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "7c1d440a83f1f9f599d8f19dcb19bd1ca5197c705707963261fc065d2f6e1e81": {
    functionName: "listCategories_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "bddc5486b7ffdadbfbad0b252ca7b71efad4a86e9e583642f8b1a476e20128d0": {
    functionName: "listBlogPostsPaged_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "a3b734f6aebba577023470bdd15d9f3b76d26a913df7b8dd7f50fbfc868dc984": {
    functionName: "listBlogTopics_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "83d4989f4968bbabb330981ca27f1539e8d0240555e6aba8d72b8d6bd3f6feda": {
    functionName: "getStateRegulation_createServerFn_handler",
    importer: () => import("./fw-assets/content.functions-BCSIIKf8.js")
  },
  "475a2840d66ebaf221ee3508cdc5e93277ff0a700e559d06ece9060fd0e6d494": {
    functionName: "listCourses_createServerFn_handler",
    importer: () => import("./fw-assets/courses.functions-CDf_Yx-s.js")
  },
  "d94dc264efa75c39026c070896372b405481e85dc08e151999fa7438b0447f4d": {
    functionName: "listCourseTiers_createServerFn_handler",
    importer: () => import("./fw-assets/courses.functions-CDf_Yx-s.js")
  },
  "d3ff98f9d089d040cc34f1df45804fcbfead514ba58283f97d23599d95ce1d26": {
    functionName: "listCourseCategories_createServerFn_handler",
    importer: () => import("./fw-assets/courses.functions-CDf_Yx-s.js")
  },
  "a4846eb44c303f1117f2d39802aa4e8d165dc0e42119615f9173f513a0096ebf": {
    functionName: "listFeaturedCourses_createServerFn_handler",
    importer: () => import("./fw-assets/courses.functions-CDf_Yx-s.js")
  },
  "d3261a09eb1aee5521c098d60c84270987b322d7a7085005c7b3a4e6abffcee9": {
    functionName: "getCourse_createServerFn_handler",
    importer: () => import("./fw-assets/courses.functions-CDf_Yx-s.js")
  },
  "74c376c755c49bc9421a0b79ca08d46b3142b6654356be257c29003817e6562f": {
    functionName: "getRelatedCourses_createServerFn_handler",
    importer: () => import("./fw-assets/courses.functions-CDf_Yx-s.js")
  },
  "c23683e9e1831ce3ced44ae91cf1d5440fe645e1ef72ddd8d8df167a4c5d0a08": {
    functionName: "listAllCourseSlugs_createServerFn_handler",
    importer: () => import("./fw-assets/courses.functions-CDf_Yx-s.js")
  },
  "f259095c7f085fb2645a4f9a4fee3775cc357340a8183dfbefd1a15b19c60bcd": {
    functionName: "recordAffiliateClick_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-click.functions-i5NuRxuu.js")
  },
  "42da1772a8c46600a4194f9ea276674b6c087905f87a90e19f7362fd956a96da": {
    functionName: "getIntercomAppId_createServerFn_handler",
    importer: () => import("./fw-assets/intercom.functions-BUZboQxt.js")
  },
  "4ac31434eeab273ed3e2330af0af0d54d6c4ee8e5b43cd2465842fca0c2ea1c5": {
    functionName: "getIntercomUserJwt_createServerFn_handler",
    importer: () => import("./fw-assets/intercom.functions-BUZboQxt.js")
  },
  "32fc2146154ce85cd3c251b27b207df0ab03d4017644c2a9d78c7da9c8f73d07": {
    functionName: "getRouteOriginFromRequest_createServerFn_handler",
    importer: () => import("./fw-assets/route-origin.functions-CLvYIJSh.js")
  },
  "cddd0c30d68208abf4508c3c28044886f86f26543e0e3d3208423f3cb39b1bdd": {
    functionName: "pinSignIn_createServerFn_handler",
    importer: () => import("./fw-assets/pin-auth.functions-B_o_p0_E.js")
  },
  "86168ccdee1dbdef8bdf4c447f92da1b1dde0709bb182a5f1e3421609b6e7ae5": {
    functionName: "getAffiliateDashboard_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-dashboard.functions-D5XxDcq3.js")
  },
  "3bf8803c3fa924d600291acba2efb5c3f4a9d72a5064b455e273f1489467657f": {
    functionName: "updateMyPayoutMethod_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-dashboard.functions-D5XxDcq3.js")
  },
  "2e98a3d655094ebe28008e5260238bab8e3b7ff28d999f5b29adbd404a105978": {
    functionName: "logCoachingActivity_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-coaching.functions-CBqFfPkR.js")
  },
  "97a11c1acf2b2ec33d7e63d16329718b2e259bb7a2a493613550088e869994d7": {
    functionName: "listMyCoachingLog_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-coaching.functions-CBqFfPkR.js")
  },
  "12babc8844acd2104b17cdecfb1cd8ebf2d7b33f9f9f94e5de894ea313c17e04": {
    functionName: "listCoachingForAffiliate_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-coaching.functions-CBqFfPkR.js")
  },
  "7703e29797da4d1ec9552c00bdd63705cbb7d8be411edbefae7a8417956aa515": {
    functionName: "applyAsAffiliate_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-apply.functions-CLjUQGpR.js")
  },
  "feb9d6d6d0a9520db9c0b2c53eca1a71d517f8298732c0f448b19bad1cd8a0f8": {
    functionName: "submitPrivacyRequest_createServerFn_handler",
    importer: () => import("./fw-assets/privacy-requests.functions-Bv2Ttt5j.js")
  },
  "e725aa6616da92e590420aff75c6c1119541f9a84cf744634140206e9fc4740c": {
    functionName: "listPrivacyRequests_createServerFn_handler",
    importer: () => import("./fw-assets/privacy-requests.functions-Bv2Ttt5j.js")
  },
  "fc02a41f5ec37438ca69db0567d5ed6f96222b6b644e33140bf345903f39e4e4": {
    functionName: "listSeoIssues_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "165714cf7e1003bb06d266765590a7b3c3922ded0d88c53e75de27700059bca4": {
    functionName: "listLeads_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "1bc5e7a88df293520aa9f613a33b0ec55e8d9947f55613bf63763e5d2567e093": {
    functionName: "updateLeadStatus_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "6f854ea9a97838e7b6fa3eee3f72bdd86b1a844d15f2d149cf69b667a0ee59a3": {
    functionName: "listContentPages_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "e8142dacd605cc6d45e8796883a52e6e0c95fd4c5c4c3b8e2bee1bfe7a5ebaa1": {
    functionName: "bulkUpdateContentPages_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "8604f1e01566d19935905d0bad5929550c0caaf1aea7fe528d4b409785da1cf5": {
    functionName: "getIndexingStats_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "8c6d7a29603e7ebdfeebdb0d73a7284fa51d359c5b8325f7ea010c3465ad4186": {
    functionName: "aiFixContentPage_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "b6c8d1cca1795d3b5f10935dfc421e26c998b4d8ffbf96b5fe08752fe4b218e2": {
    functionName: "enqueueSeoFixJobs_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "615bebc119f42ace95a0f884be2e85d9b7950d435b4c7fcb93ab59d2ee71564e": {
    functionName: "getSeoJobStatus_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "3a9c3e11425028ed3fa4afa4be80282ac22267cf119a454c5f7a673576a51756": {
    functionName: "processSeoFixQueue_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "2ebcc13773815515ed8a0d1d37a7327d567434b61fab75f94af6de30d24e22b5": {
    functionName: "cancelQueuedSeoJobs_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "b8fbb509d83b05d3892500a0bde0dfa83cf33106f8642cd0a57828fbcbb76a5c": {
    functionName: "listSeoBatches_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "4f826cd9a13b0c4c2d3026951d8805e0833343c7e802a3e128bc1ec8d1478260": {
    functionName: "getSeoBatchDetails_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "b9ca57870a2438c6117cca538d93f10c1257c32a22171da0cddc10494dd7c96e": {
    functionName: "getContentPage_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "16b0c0cb551c8dcedd95980594d532a00b189cb4338f3c3952a6901284fef8c0": {
    functionName: "updateContentPage_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "dc5b555f2796ebba8fac6a32a735f7032ce506c28749359f63b2f8dd43957ae4": {
    functionName: "appendAiContentToPage_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "6de3a256c0ef25fb47fd514317501ba6d4b1efd9bf05fe9e059082797240d557": {
    functionName: "generateFullPageContent_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "952b6d9105bdc31d5634eff7a384cb52b3adc77598a92392b3651e7bef8e4da5": {
    functionName: "improvePageContent_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "dce35cda167e7a9206ef18c1745df18e8007fc94feedcf95d9ef50fe59912b1c": {
    functionName: "generateSeoMeta_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "6068228523749141a6362364ba27648f58de6667f777a0b25f3cadc80e7ecfa4": {
    functionName: "generateSectionPreset_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "b1f2572e4f0eb94cd91fc4ca3538d9903ff2d430b9c5de66ebdb6a802d31957a": {
    functionName: "listSectionPresets_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "76b039cb4e7cd7eaf76edc19df2ee2939b7eff460c2dc5e510ca63daf66a0a47": {
    functionName: "saveSectionPreset_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "56d900c7891fdc1b56cb3fc1a5f501dddd31cd460cdc4ee0804cb09210a34c3d": {
    functionName: "deleteSectionPreset_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "124c50cc4aef51a5c466b46248cb3e0a375bfcd00bf4d41451bccb427990adf3": {
    functionName: "generateCustomSection_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "d10a81f375ec19c033c2ef9462002cd90a5ac634c2afc8416dff4dde2c8073fe": {
    functionName: "autoFixSeo_createServerFn_handler",
    importer: () => import("./fw-assets/admin-tools.functions-tQSRzdbD.js")
  },
  "e2e5afc73b175525822c27966d8f0445138fcbe6c2120e521299ae1690e12b49": {
    functionName: "seoCoachChat_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-coach.functions-D00h68xv.js")
  },
  "eb7f45cf7231968d6499839e78df0ebb147a673f66ab51b5fa428bcdf9f49891": {
    functionName: "critiquePage_createServerFn_handler",
    importer: () => import("./fw-assets/seo-critic.functions-B8bjnP7Z.js")
  },
  "18fc7ec8f596387b612cbc87b727812c6aa7557c5310ec22e417151cb74cc050": {
    functionName: "getSharetribeDashboard_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe-mirror-admin.functions-CbYWBwc3.js")
  },
  "4d0cd24e723ec6ba43931cce9161ed84be4f762f608196f5b4f9567de9bb6ddf": {
    functionName: "setAlertStatus_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe-mirror-admin.functions-CbYWBwc3.js")
  },
  "a58c7d9c7ff62162cf6acd63db7ec7fbab6f9ba46d2c06470835084aa6602782": {
    functionName: "triggerSharetribeSyncNow_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe-mirror-admin.functions-CbYWBwc3.js")
  },
  "6a4f9d68461af7001d413a407fb7d497b6fa132f8bcd382fd6be56cc057ff354": {
    functionName: "runAliasBackfillFn_createServerFn_handler",
    importer: () => import("./fw-assets/alias-backfill.functions-ByhBoToC.js")
  },
  "14d3a7795c2abab014699fc5ca23f7dcfbd829cbf0f184dbab271f7d1ee3627b": {
    functionName: "listCompetitorSites_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "e9130c2cdd8853e7faf0eea4716513a3f57ca2e62d985fc7567092bf62b9b2b3": {
    functionName: "addCompetitorSite_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "f8f33b2e00023d190f133d5f13a011c6929b3eb24179e18e2bf68d76d7277333": {
    functionName: "deleteCompetitorSite_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "81517c05c1e8aa3058d7a03b968d70633c743aa30df757eb20b82cc10f236231": {
    functionName: "runCompetitorScan_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "063d69f1f2682b59006a835b8640aa63cdedf46c94ba36000c97b0e2b755d48c": {
    functionName: "listNewCompetitorUrls_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "838ce17b61ad793223f9dd93e9e9b2b4c1045ee67bfb5530aa43246671b556c3": {
    functionName: "acknowledgeCompetitorUrls_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "fcf0ff2b7c8a68737b6230c3f299dde154914c843f5adef72505231480e8349d": {
    functionName: "scrapeCompetitorUrlRow_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "d5d6363526ad9356a9568b0cf6305fe377136ecdf597a5a6aa32d7a2a4b9c76f": {
    functionName: "listHostMatches_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "17ad8af8ba6e68526b52fdfb1c681b33c73722d3b8ffbb3f02b3c71a073be8a9": {
    functionName: "updateHostMatchStatus_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "2f479321ef485c24a7c1af7af38594c14e6580eb6ef6390f61259be3adceb4c4": {
    functionName: "runHostMatchOne_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "f1c3dce6843fd729808eda510284e96dbaff7ed3b9b5a0caf92b8678799c8a44": {
    functionName: "enrichHostMatchOne_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "a7a07e080657b7e9c38ba1b0e50b073537a0661907becdc4526c1929c7fecd8b": {
    functionName: "getEnrichmentSpend_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "30a11be2cd92777ceb4b7820523f59c4841cec6a29507dc822a37ff237e40ef6": {
    functionName: "reportFalsePositive_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "8dbe2da725144eb48bdf897d14b83c410cc1af034c9b31425d792593734a3aec": {
    functionName: "runValidatorSelfTests_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "0124477d5fcebea7d632a84eb6e0f6cfd986607cf4973f3a42509c15795f339b": {
    functionName: "listTrackedKeywords_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "e56c4f372d6ef42c8ecf0c6f075396156ca179d82e7f859bed028f61ebfd10a2": {
    functionName: "addTrackedKeyword_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "d674bdd5bdaa8c00e13bd3438b79f6705b4f57bc585f3b5b72f3e6d171fab6f3": {
    functionName: "deleteTrackedKeyword_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "7836715b7533f15d606ba7be7927f494bc1c0c7f659c9bc9eff3c4c04eeb1796": {
    functionName: "runSerpCheck_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "c1846078e13f13d425356cd4d277ba0cef460600feb88188568f2153800b6b27": {
    functionName: "auditPage_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "9456853ef1f99892aad68736b1232814f585b04838b7ac7a48445eea214ece8d": {
    functionName: "listRecentAudits_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "7255488cd3d4e7b307e9cba105f30422d19321023b29e2fdf03c0a277f3c66ed": {
    functionName: "classifyCompetitorUrls_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "0bd7da178e0cf1630c83be8ef3ee6e143ec24dd39c2b16933f91e05e987bc8da": {
    functionName: "detectCityGaps_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "865d0dd01ecf1c3f7a56e3f80d8c3c83b18cdc856fdb0debbce528cd2f401e77": {
    functionName: "createCounterPageFromGap_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "aeb2f7b3e575da6163f8204221e333a2295a7ca2b51efb075335bae62fd4567c": {
    functionName: "generateCompetitorDigest_createServerFn_handler",
    importer: () => import("./fw-assets/admin-weapons.functions-5pCqbMK_.js")
  },
  "1fc6100b81d662bf30f055f485bb8cd24f9120f07ec45923ac6cc1f1c0d45c01": {
    functionName: "getCoachRole_createServerFn_handler",
    importer: () => import("./fw-assets/admin-prnm-coach.functions-BmPN-KUi.js")
  },
  "917d54276cd8b450f346cbd32f0f407b0b99ad0b4d05a2bdb61390becda5fcab": {
    functionName: "setCoachRole_createServerFn_handler",
    importer: () => import("./fw-assets/admin-prnm-coach.functions-BmPN-KUi.js")
  },
  "62ec45a012cbc8ff335d6ca5c87c309b1531c77ea6801cc41c1ad090b461f7e5": {
    functionName: "prnmCoachChat_createServerFn_handler",
    importer: () => import("./fw-assets/admin-prnm-coach.functions-BmPN-KUi.js")
  },
  "ebc6e2ce46b7ab45a14db48c398fc0f8f0a6602274228f70b1319517541cd229": {
    functionName: "listOpportunities_createServerFn_handler",
    importer: () => import("./fw-assets/admin-prnm-coach.functions-BmPN-KUi.js")
  },
  "95ec2f8872f885682d1152c48fda0b0b1fcd057f88b2e57c05fecddc7dc9b23e": {
    functionName: "markOpportunity_createServerFn_handler",
    importer: () => import("./fw-assets/admin-prnm-coach.functions-BmPN-KUi.js")
  },
  "cf812b6a34518ab8a1c67ce80bb408c1d7bd12e83e76ae032f3a50f33b045d29": {
    functionName: "generateOpportunities_createServerFn_handler",
    importer: () => import("./fw-assets/admin-prnm-coach.functions-BmPN-KUi.js")
  },
  "bbb58db06f3141ce9d5f836cd65a98d85569efe618d8490734acc925e1cad298": {
    functionName: "listSocialLeads_createServerFn_handler",
    importer: () => import("./fw-assets/social-lead-hunter.functions-DjGxnBSC.js")
  },
  "6cc88656dca947f1fa5b25d51f134bb94b23a54ce65751d49130b0aab75a8e76": {
    functionName: "runSocialLeadHuntNow_createServerFn_handler",
    importer: () => import("./fw-assets/social-lead-hunter.functions-DjGxnBSC.js")
  },
  "7d7f77a365423c8b0b40125b18fb4ddf04d0cfe76e8f7ee5a3df96e5ede02bd0": {
    functionName: "setSocialLeadContacted_createServerFn_handler",
    importer: () => import("./fw-assets/social-lead-hunter.functions-DjGxnBSC.js")
  },
  "737c1c94cf3fc28a9b564d810eda9abb03d7fb498f162f61f3fb32271e3ac236": {
    functionName: "updateSocialLeadNotes_createServerFn_handler",
    importer: () => import("./fw-assets/social-lead-hunter.functions-DjGxnBSC.js")
  },
  "61e069fbe5504ed4989aa77bde7f1dbd5b3934986eb96cb9faa9b66d14f072e8": {
    functionName: "deleteSocialLead_createServerFn_handler",
    importer: () => import("./fw-assets/social-lead-hunter.functions-DjGxnBSC.js")
  },
  "50aa65b5b9181806d2feddede74d5380bd60351713a76029858b88959742b3c8": {
    functionName: "getAdminIdentity_createServerFn_handler",
    importer: () => import("./fw-assets/admin-team.functions-BhWBpUAn.js")
  },
  "89e2192d03c338025d51b96431f650ce8526adc36a6e06c87a128df76a6cd303": {
    functionName: "listAdmins_createServerFn_handler",
    importer: () => import("./fw-assets/admin-team.functions-BhWBpUAn.js")
  },
  "15d9f54d7fe9711865453d5c84d6a89717f660a1fa6ca993cab1b796bb5bbc6c": {
    functionName: "createAdminUser_createServerFn_handler",
    importer: () => import("./fw-assets/admin-team.functions-BhWBpUAn.js")
  },
  "d2b27083bbb30769e31d762ae698178df643c755fca2fe92efce05d347cf5e8a": {
    functionName: "setAdminPassword_createServerFn_handler",
    importer: () => import("./fw-assets/admin-team.functions-BhWBpUAn.js")
  },
  "d05505b209fbcec1efdc32a7133ad7faf1db5e66b0720ed7cd6640020c4851a5": {
    functionName: "sendAdminPasswordReset_createServerFn_handler",
    importer: () => import("./fw-assets/admin-team.functions-BhWBpUAn.js")
  },
  "557134d69be0875c7502382a6a37b9427b65f248b03f22baa19c81bb31c4c8e5": {
    functionName: "grantAdmin_createServerFn_handler",
    importer: () => import("./fw-assets/admin-team.functions-BhWBpUAn.js")
  },
  "0c129d6bd923c4f8404b9df18bac9feb6db7d9a42c4ebfac9bc676d84b2838d8": {
    functionName: "revokeAdmin_createServerFn_handler",
    importer: () => import("./fw-assets/admin-team.functions-BhWBpUAn.js")
  },
  "50977da0f56beed28dafab7675260dffbcccd997227b6b5c63f5828fa60a86ee": {
    functionName: "getLinkAuditDashboard_createServerFn_handler",
    importer: () => import("./fw-assets/link-audit-dashboard.functions-GS6bJhpB.js")
  },
  "c18a39484f43ede3060f6d09ae1e903aa32aa236b3330d6d931416e2019d4c81": {
    functionName: "getPageHealthReport_createServerFn_handler",
    importer: () => import("./fw-assets/page-health.functions-q4FZp5Bz.js")
  },
  "1a21d16d9e7fc1fed1e381906178ff4a366fb21764bfd1c871ca0673330d2dcc": {
    functionName: "getCannibalizationReport_createServerFn_handler",
    importer: () => import("./fw-assets/page-health.functions-q4FZp5Bz.js")
  },
  "9805350f35915072881e532c84e72bd84b3465a5836b6b9749b3af281cb18325": {
    functionName: "previewSmsBlast_createServerFn_handler",
    importer: () => import("./fw-assets/sms-blast.functions-pser1Cps.js")
  },
  "ed88ca29c540be0a952d5f62840a169bfd27edb6304345b2da68d986c8749393": {
    functionName: "sendSmsBlast_createServerFn_handler",
    importer: () => import("./fw-assets/sms-blast.functions-pser1Cps.js")
  },
  "72bc10a4bba57c55fb85cc14e6562cbbb1e0616b73c26bfd99034d5612eb4fe6": {
    functionName: "validateSocialUrlsFn_createServerFn_handler",
    importer: () => import("./fw-assets/social-url-validator.functions-_YA5KSxY.js")
  },
  "1a0db541b1be2cda73a67cbaec79a0e0ebeb9955bd5567ceac8e53436dbbd67e": {
    functionName: "checkLandingAcademyLinks_createServerFn_handler",
    importer: () => import("./fw-assets/landing-link-check.functions-WTk2N5YY.js")
  },
  "99e9cc7e516ac2c4cf98a1361b7697dead878f774e22434dd718b63a40237628": {
    functionName: "auditListing_createServerFn_handler",
    importer: () => import("./fw-assets/admin-listing-audit.functions-BSjmy67x.js")
  },
  "874bb6bc79cad05ffdf9e4f0c598bbc51182e9450ccf01dad73a36034c7f07af": {
    functionName: "emailListingAudit_createServerFn_handler",
    importer: () => import("./fw-assets/admin-listing-audit.functions-BSjmy67x.js")
  },
  "9d7c5e251bb8725c981dc1834adcda2d30c40cea59e6819fa62f01252949f7b8": {
    functionName: "listListingAudits_createServerFn_handler",
    importer: () => import("./fw-assets/admin-listing-audit.functions-BSjmy67x.js")
  },
  "0e4cc244fd0e40108cd4f9679777bdebb4418c334199cb89f852d2c839ce5d52": {
    functionName: "deleteListingAudit_createServerFn_handler",
    importer: () => import("./fw-assets/admin-listing-audit.functions-BSjmy67x.js")
  },
  "6e24de7ef6d339e17bf95efce33b48a08578b3996719284c47681b6dc45414ca": {
    functionName: "createQuickPage_createServerFn_handler",
    importer: () => import("./fw-assets/admin-quick-page.functions-D-P0Jicu.js")
  },
  "2033915202afff1ecdcab94a8d5cb7129d202dd3f5332d4a864d814baf7ede56": {
    functionName: "importGscQueries_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "60bd55c1c6dfa9680eebd080845d94a4a14b439e39650c610e49367d28a96939": {
    functionName: "findKeywordOpportunities_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "d08326e8cd7b793b8e3e5c27654807fd98f6d2e6bc7a862fb18a91c75c053c3f": {
    functionName: "getKeywordStats_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "18c4d88a88f01b6faf6dc97883d6a278b4bfe7051d0ea47ede4eff9b181d44e8": {
    functionName: "listCompetitorPages_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "abcedb62da03db7f2ad3350d24d21ab7da713b62d6f689ba430c13b65e023004": {
    functionName: "scrapeCompetitorUrl_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "ee0e9e2133ef2cd6ef2a909fab2dfb7c0aea8c8465511c40df71be8acc135db1": {
    functionName: "compareCompetitorToPage_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "01307473f0636f6dcc058befb82d2bc8bbac42361618ef95e6024c9792fb29b5": {
    functionName: "deleteCompetitor_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "ecbc4f3f2bcda1eb2070b56e715844b0c372e02b3ab9298ad9991797d73d8073": {
    functionName: "generateLinkSuggestions_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "3db742c56eae54ce7923952b7facb873d1bd7dafa05dbe7c55db6409c5ef9e70": {
    functionName: "listLinkSuggestions_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "cf2b6276ee034a7c3b59050dfd297c16caf07f0096f5ff8f5701c01fbe09b7e2": {
    functionName: "updateLinkSuggestionStatus_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "ce8f67d5d07510af79a3c3f6bf73d90e78a639da2b8f0151e7b8bb372215c2ca": {
    functionName: "applyLinkSuggestion_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "7e290d83e150fa34d3041f674f34af64f0462dee6613c76c7c3f54748d706a2d": {
    functionName: "applyLinkSuggestionsBulk_createServerFn_handler",
    importer: () => import("./fw-assets/admin-seo-tools.functions-DI-bWi3q.js")
  },
  "f476018b04f2d7a0f0a3163e46d30f2fc47c34eba8f4f157fc5f525b161d41ff": {
    functionName: "adminRunGscSync_createServerFn_handler",
    importer: () => import("./fw-assets/gsc-sync.functions-L-HXXNw9.js")
  },
  "c7fe898fb220570bb3c24dd39ad9f69efa9eda82e05ee2b4c513ebe4b6c5b3f1": {
    functionName: "adminGetGscSyncOverview_createServerFn_handler",
    importer: () => import("./fw-assets/gsc-sync.functions-L-HXXNw9.js")
  },
  "1e7a8b6ad873de2e4e1c36c76f0deaa1c924de555f202c68099381143f88de11": {
    functionName: "listIgLeads_createServerFn_handler",
    importer: () => import("./fw-assets/ig-lead-hunter.functions-Cor7Kk_H.js")
  },
  "a110cb2a99bbf25540f65a06642e788891c65352a0468f5475d618412c555405": {
    functionName: "runIgLeadHuntNow_createServerFn_handler",
    importer: () => import("./fw-assets/ig-lead-hunter.functions-Cor7Kk_H.js")
  },
  "2af8b5443ded64125d23f482856644fd7759202783056f09d0f988c028dc90d8": {
    functionName: "setIgLeadContacted_createServerFn_handler",
    importer: () => import("./fw-assets/ig-lead-hunter.functions-Cor7Kk_H.js")
  },
  "d0e07d87bbfda18d86aa02b648650c53fc62eb085c836a164d7e8763c893bcb1": {
    functionName: "bulkSetIgLeadsContacted_createServerFn_handler",
    importer: () => import("./fw-assets/ig-lead-hunter.functions-Cor7Kk_H.js")
  },
  "28ce74133d9ad1cbf62f8cae49e9aaf6c31b9917e6ee532e49d7a48e99c328fe": {
    functionName: "updateIgLeadNotes_createServerFn_handler",
    importer: () => import("./fw-assets/ig-lead-hunter.functions-Cor7Kk_H.js")
  },
  "00537e5b134af5e7b1d1f0d9511711a195b97a22988758852916f731777d13ca": {
    functionName: "deleteIgLead_createServerFn_handler",
    importer: () => import("./fw-assets/ig-lead-hunter.functions-Cor7Kk_H.js")
  },
  "9957e929b9677e89fcf02bcd43c52ee0b9896ffdd44eb5ce7b41658cf75f4598": {
    functionName: "scanAndProposeRepairs_createServerFn_handler",
    importer: () => import("./fw-assets/link-auto-repair.functions-p3oayRTo.js")
  },
  "b04f312bdb34677b651e0138987d6a6c4adacba1bf2680a12d3cff356c2a5d91": {
    functionName: "applyRepair_createServerFn_handler",
    importer: () => import("./fw-assets/link-auto-repair.functions-p3oayRTo.js")
  },
  "0247f74e677fb3a8b3da9eaf70efdf262b47841de6ed97c23286ec41ac700f11": {
    functionName: "previewSharetribePrune_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe-prune.functions-DoqWLnTF.js")
  },
  "558751776f24a095b0bbfad1dd5f86a27f253fc34f6dd6b1530c4aacc781993f": {
    functionName: "executeSharetribePrune_createServerFn_handler",
    importer: () => import("./fw-assets/sharetribe-prune.functions-DoqWLnTF.js")
  },
  "b574c0176162cf5328022bda343a01f75d3eedffd63b43ae3c0959e2d490ddd0": {
    functionName: "getMyReminderSettings_createServerFn_handler",
    importer: () => import("./fw-assets/followup-reminders.functions-CULBLmy6.js")
  },
  "e75b6e936630b34932918f8f769e4625477c231ae67c055dc1b67f29e78b169b": {
    functionName: "updateMyReminderSettings_createServerFn_handler",
    importer: () => import("./fw-assets/followup-reminders.functions-CULBLmy6.js")
  },
  "f4387101a7753eba81e134922b1dd0f7569d20ae36538d44f97ba9f3296be286": {
    functionName: "getRecentReminderLog_createServerFn_handler",
    importer: () => import("./fw-assets/followup-reminders.functions-CULBLmy6.js")
  },
  "dfba2289918e8d0a9e79618f60fe32178a132c436138b1781e8463c7f9d2e0d1": {
    functionName: "getMyDueCount_createServerFn_handler",
    importer: () => import("./fw-assets/followup-reminders.functions-CULBLmy6.js")
  },
  "5c6d00db4d1761801b6ca8cf35830370ea571968e8b6ede499c71f3bd5768c72": {
    functionName: "runReminderWorkerNow_createServerFn_handler",
    importer: () => import("./fw-assets/followup-reminders.functions-CULBLmy6.js")
  },
  "cf171c8df8716b2f6cc9d89d71360a26d135adceab0be1c2e4698f83cea8ca79": {
    functionName: "getFollowupDashboard_createServerFn_handler",
    importer: () => import("./fw-assets/followup-analytics.functions-DZSJDQcF.js")
  },
  "e039732b83838daf157966068ef245d18cba8b1cc8045b10d1fa5733912c90d0": {
    functionName: "getFollowupDrilldown_createServerFn_handler",
    importer: () => import("./fw-assets/followup-analytics.functions-DZSJDQcF.js")
  },
  "3220eb433800b25c5f810959f64879d73d18cfeb19d9818ea64c407c59da931c": {
    functionName: "sdkTestPing_createServerFn_handler",
    importer: () => import("./fw-assets/test.functions-CnMsca21.js")
  },
  "6e4608bf43dd702cc180a74cf069bb720bf52a845530541f7254f38a4bcd4cc6": {
    functionName: "sdkTestSearchListings_createServerFn_handler",
    importer: () => import("./fw-assets/test.functions-CnMsca21.js")
  },
  "6b3775c9075af404e7422ce4ee23e6a3ac9867e895ae2e4a9c80cd68d478c21f": {
    functionName: "sdkTestSyncListings_createServerFn_handler",
    importer: () => import("./fw-assets/test.functions-CnMsca21.js")
  },
  "a2cd98b5ad2648e15b0286a148f663249099824e5f4b0949bc5dd0c09c97b584": {
    functionName: "sdkTestLatestSyncRun_createServerFn_handler",
    importer: () => import("./fw-assets/test.functions-CnMsca21.js")
  },
  "7c3f919066b044439f7f2c68b3098e9b82179ed6b72e2e5cbd4d1a78217e2af0": {
    functionName: "sdkTestListListings_createServerFn_handler",
    importer: () => import("./fw-assets/test.functions-CnMsca21.js")
  },
  "768ac784ec8e9da92d8be65face66da6227f8301000ae55ccc9931b2457d9945": {
    functionName: "getMarketplaceOverview_createServerFn_handler",
    importer: () => import("./fw-assets/marketplace-console.functions-Cu5GMi0V.js")
  },
  "9f87402ed2cefe652d0bfbe21bdaabbe39d4fecda09d9ef09d1bde32a3865174": {
    functionName: "listMarketplaceResource_createServerFn_handler",
    importer: () => import("./fw-assets/marketplace-console.functions-Cu5GMi0V.js")
  },
  "8404956fca184665ffcbb34fcb5c220c619fd6f63755d8b24173d3685980daea": {
    functionName: "getFollowupInbox_createServerFn_handler",
    importer: () => import("./fw-assets/lead-followups.functions-wdYct4aV.js")
  },
  "febfe38c97fa3a15ae7724864767fb2d35205dd0336258ca6f98378fef8f4425": {
    functionName: "updateFollowup_createServerFn_handler",
    importer: () => import("./fw-assets/lead-followups.functions-wdYct4aV.js")
  },
  "b26d8c3c8196e8f65dfee018911296dee203eb684fd3033fe75559316dda448d": {
    functionName: "logTouch_createServerFn_handler",
    importer: () => import("./fw-assets/lead-followups.functions-wdYct4aV.js")
  },
  "f374c38bad61a2c47688980d05f1207efa58882bb1a89466e339d07ba040c76c": {
    functionName: "getTouches_createServerFn_handler",
    importer: () => import("./fw-assets/lead-followups.functions-wdYct4aV.js")
  },
  "2847a868ec2f518d61b90ae38ad0a6b05a42679e39885a7f28bc5472947122b4": {
    functionName: "aiScoreFollowup_createServerFn_handler",
    importer: () => import("./fw-assets/lead-followups.functions-wdYct4aV.js")
  },
  "67d1a19e82f7379a1dc4cef9d75188a1cded1dc9e030cc32f8722d50c3c60038": {
    functionName: "aiScoreUnscored_createServerFn_handler",
    importer: () => import("./fw-assets/lead-followups.functions-wdYct4aV.js")
  },
  "961f52e15c3b37f70f67bf125b194a1e2076180aa053894db3e71c8df5b7bc33": {
    functionName: "getRecentLinkHealthRuns_createServerFn_handler",
    importer: () => import("./fw-assets/link-health.functions-DcLjFU2s.js")
  },
  "f8bffb0d6856fb8be710642b6569dbbca019484cfcc96ba6b0fb919b00808934": {
    functionName: "scanBrokenLinks_createServerFn_handler",
    importer: () => import("./fw-assets/link-checker.functions-CF4afEiQ.js")
  },
  "2d737fa8e538df6edc9c0188c2bbbdaddfbd82e04a912316858a140c0ff3b784": {
    functionName: "fixBrokenLink_createServerFn_handler",
    importer: () => import("./fw-assets/link-checker.functions-CF4afEiQ.js")
  },
  "21a82b9573813de1d2b222dd58ef6921744c7d3b6a377d87dccd99ec34dabfe6": {
    functionName: "bulkFixBrokenLinks_createServerFn_handler",
    importer: () => import("./fw-assets/link-checker.functions-CF4afEiQ.js")
  },
  "d1f6d9d80aa685de7a58e391a2f9844c5fbccdefb29a723cdd4f48b3729661a7": {
    functionName: "listQueuedEmails_createServerFn_handler",
    importer: () => import("./fw-assets/email-queue.functions-B0NyRuc5.js")
  },
  "efcac919d928c60fe8b8637f3b7f54ba8e59199ff6817a9ea662c1ca5bb22df1": {
    functionName: "previewFaqForUrl_createServerFn_handler",
    importer: () => import("./fw-assets/faq-generator.functions-B7HefS35.js")
  },
  "81c00e8a07d3fb7c003cf18481c293adf6f4a30fd5fc4756485691bad365d4a9": {
    functionName: "insertFaqIntoPage_createServerFn_handler",
    importer: () => import("./fw-assets/faq-generator.functions-B7HefS35.js")
  },
  "5011daf5605a661f03ac98f3377907106a189586626054c3dbbe10b0280ed173": {
    functionName: "bulkGenerateFaqs_createServerFn_handler",
    importer: () => import("./fw-assets/faq-generator.functions-B7HefS35.js")
  },
  "d8b7b03ade15534674efaa0a810cc4b996e32f014e19fc3d662ec34ec191cdd1": {
    functionName: "getRefreshQueue_createServerFn_handler",
    importer: () => import("./fw-assets/refresh-queue.functions-BxBMBfFp.js")
  },
  "4c789ad7a80a6c759b6fa0d9794963bc37825c5715cd049617b115585c102342": {
    functionName: "getRefreshHistory_createServerFn_handler",
    importer: () => import("./fw-assets/refresh-queue.functions-BxBMBfFp.js")
  },
  "479f689e48f906c5a65875c0a6e416be26816eadc47e2f3193b546c3140d4f7c": {
    functionName: "runAiRefresh_createServerFn_handler",
    importer: () => import("./fw-assets/refresh-queue.functions-BxBMBfFp.js")
  },
  "f21bd80c9b38e795c2db3e974a2af4e79f02f21c0f3c6438ba80a82396479f1b": {
    functionName: "getAutoOutreachState_createServerFn_handler",
    importer: () => import("./fw-assets/auto-outreach.functions-KPMMCzpc.js")
  },
  "929a4afaed7f8ed0755b255e401e54216dd83a71fda27cf43b56c86bac2436a2": {
    functionName: "updateAutoOutreachSettings_createServerFn_handler",
    importer: () => import("./fw-assets/auto-outreach.functions-KPMMCzpc.js")
  },
  "db7425dbb8ab0aefcb4099c78e776e0c672d82462eda5b663ade7f61324a403d": {
    functionName: "runAutoOutreachNow_createServerFn_handler",
    importer: () => import("./fw-assets/auto-outreach.functions-KPMMCzpc.js")
  },
  "7c92389154c37b73eee6341dcd6568e18e04983a6fa33ccd16f6a9a7fb7b85a9": {
    functionName: "cancelAutoOutreachMessage_createServerFn_handler",
    importer: () => import("./fw-assets/auto-outreach.functions-KPMMCzpc.js")
  },
  "77af1e716826287656d2a5dc901011dde9ac6dda8ae791e04cb4ee33bf00c134": {
    functionName: "generateActivityCityPages_createServerFn_handler",
    importer: () => import("./fw-assets/activity-city-generator.functions-C9eHJGVY.js")
  },
  "b1bfeb895e6ac2c2231125d6203153722014eb2b68936d39e5d318e0e8495041": {
    functionName: "publishActivityCityPages_createServerFn_handler",
    importer: () => import("./fw-assets/activity-city-generator.functions-C9eHJGVY.js")
  },
  "2ef71572ad0ac4a359f6da5c1ae3b7639762743900d45c81daec4fc08394f640": {
    functionName: "listActivityCityPages_createServerFn_handler",
    importer: () => import("./fw-assets/activity-city-generator.functions-C9eHJGVY.js")
  },
  "be2248961e4c5abd692de933ed04e6fe11491f46c92897347902e6a51cfc6bc4": {
    functionName: "listCandidateCities_createServerFn_handler",
    importer: () => import("./fw-assets/activity-city-generator.functions-C9eHJGVY.js")
  },
  "20fb37e44ef09307e4c93b5261b25fd5f39a9483ac83d961a77183c66ff26d61": {
    functionName: "addContacts_createServerFn_handler",
    importer: () => import("./fw-assets/add-contacts.functions-DnYGJDQt.js")
  },
  "707d9fcbf0eebecad1123d43d393104954b187e2951258db1439eba92d63b0c4": {
    functionName: "listAffiliatesAdmin_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-admin.functions-CyKdNcdd.js")
  },
  "1136c1e2a3e5c7fa3adc5c91c42e855af7e628e115e74a668a604fd0ddc6e778": {
    functionName: "setAffiliateStatus_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-admin.functions-CyKdNcdd.js")
  },
  "1ec90cb8fc6c7e8ee3c93cf145372313119e4042db1a3f8b8e63b5abbef9b8bc": {
    functionName: "linkHostToAffiliate_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-admin.functions-CyKdNcdd.js")
  },
  "33b2f4f724d94bdcc795607b98693af1b5cb518577c22521524c40261b1302b2": {
    functionName: "createAffiliatePayout_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-admin.functions-CyKdNcdd.js")
  },
  "bcfc1ff4d73b39006d25b11e6bfd943ef1c122364946cac1b2d546c8a9293c7b": {
    functionName: "reverseCommission_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-admin.functions-CyKdNcdd.js")
  },
  "2d8388ffca0b3f985380529ec4df68811129eddbadb29f9c36c72e0da54b3cc4": {
    functionName: "setAffiliateTierOverride_createServerFn_handler",
    importer: () => import("./fw-assets/affiliate-tier.functions-Bad6mlS_.js")
  },
  "6fa876458b59315b8310895746df89279bc4859d10dc62900c6fbe62a958e791": {
    functionName: "getEmailBranding_createServerFn_handler",
    importer: () => import("./fw-assets/email-branding.functions-B_inlnQ6.js")
  },
  "d120ac3644f89dbf72c968cee435af07316f838a8b6393fecd2faf4a9d4fe6c3": {
    functionName: "updateEmailBranding_createServerFn_handler",
    importer: () => import("./fw-assets/email-branding.functions-B_inlnQ6.js")
  },
  "ea699fac7c9b1dc6ded35057d44edc2d5cc0995b6989313865436a8c98617741": {
    functionName: "previewAuthEmail_createServerFn_handler",
    importer: () => import("./fw-assets/email-branding.functions-B_inlnQ6.js")
  },
  "8ec52f704257d0a24eee1ce5ae9039e676ce015f215602c840c8d2ca6240f65e": {
    functionName: "exportTable_createServerFn_handler",
    importer: () => import("./fw-assets/admin-data-io.functions-IN23Y3fQ.js")
  },
  "a717a5d95a084d2805aa97e8eaee46426243ec90e90c4bf7a2cf1d26c4100377": {
    functionName: "previewImport_createServerFn_handler",
    importer: () => import("./fw-assets/admin-data-io.functions-IN23Y3fQ.js")
  },
  "86c0d5d22d23d76931b7a9499f0aefa088e7598a5f90171665c66698e12bff85": {
    functionName: "importTable_createServerFn_handler",
    importer: () => import("./fw-assets/admin-data-io.functions-IN23Y3fQ.js")
  },
  "9c54f877a8bb397df8cee4cecca63b33dad10f189978d03d056e3fad2644b23e": {
    functionName: "getImportSchema_createServerFn_handler",
    importer: () => import("./fw-assets/admin-data-io.functions-IN23Y3fQ.js")
  },
  "1420b7be3e7eeedba6bd4fcf0cfbb88052ef0f5be697cdbbd173c3f1a2b32534": {
    functionName: "lookupExistingKeys_createServerFn_handler",
    importer: () => import("./fw-assets/admin-data-io.functions-IN23Y3fQ.js")
  },
  "2367840c643efe5074c61f17e21d25d61b5198cdcb733373adc6874491678f54": {
    functionName: "importTableRows_createServerFn_handler",
    importer: () => import("./fw-assets/admin-data-io.functions-IN23Y3fQ.js")
  },
  "b9b6d5f3972bec018d1fab730b1717012f1308bc954ffcfd2c9aee6fb8d912e4": {
    functionName: "getCityClickReport_createServerFn_handler",
    importer: () => import("./fw-assets/click-report.functions-BByKNe6L.js")
  },
  "f0cb6905eba0f5a089b7ee924350d6940cd8f2fe75fa831e7675c6a2fda59397": {
    functionName: "getDeliverabilityStats_createServerFn_handler",
    importer: () => import("./fw-assets/email-deliverability.functions-Cp43QF3U.js")
  },
  "52fde4b573c10d1d9329a5933b8294b9b35a104e6107454152742daaca53a71a": {
    functionName: "getDeliverabilityLog_createServerFn_handler",
    importer: () => import("./fw-assets/email-deliverability.functions-Cp43QF3U.js")
  },
  "b8a1e1921902dbf68a352ddcb5fec294660a93a020c1d0d903b32895277262a4": {
    functionName: "getSuppressions_createServerFn_handler",
    importer: () => import("./fw-assets/email-deliverability.functions-Cp43QF3U.js")
  },
  "b1eb7b860b1766661e5a8669dc1c357ae0d312f2b36cf54cebb37048275ccef8": {
    functionName: "removeSuppression_createServerFn_handler",
    importer: () => import("./fw-assets/email-deliverability.functions-Cp43QF3U.js")
  },
  "340f36031167a774ec1f65a5247288e23ddeecae00c8ffe95200abacbe56c6bd": {
    functionName: "addSuppression_createServerFn_handler",
    importer: () => import("./fw-assets/email-deliverability.functions-Cp43QF3U.js")
  },
  "bec71ddc1a645896e13cf953b3185e973f7a6d59a51aaffb546ae8c3a3e4a12b": {
    functionName: "getDashboardStats_createServerFn_handler",
    importer: () => import("./fw-assets/admin-dashboard.functions-jPJXS-9J.js")
  },
  "93fc66fad9ec997fecba32b8afc03be58b59c7017f38ac192357daa55f5a51cb": {
    functionName: "listPendingFailures_createServerFn_handler",
    importer: () => import("./fw-assets/admin-pending-actions.functions-BJP7rEkF.js")
  },
  "d75149d360af488d60156946c2fddf95ff5ecb088576b376da7a7f7dac4d4cf6": {
    functionName: "retryPendingTemplate_createServerFn_handler",
    importer: () => import("./fw-assets/admin-pending-actions.functions-BJP7rEkF.js")
  },
  "1dbf07014cb459359ad11a211494b7303f665d86bf658d3c23cf450360f6ba8d": {
    functionName: "queueSpanishCityBatch_createServerFn_handler",
    importer: () => import("./fw-assets/admin-pending-actions.functions-BJP7rEkF.js")
  },
  "0e199a31686823a745e07fad9b717c60b8ea24a01088ddc2fa9f161a39d22c80": {
    functionName: "getEmailVerifyBalance_createServerFn_handler",
    importer: () => import("./fw-assets/admin-email-verify.functions-WS7l8W1H.js")
  },
  "1cd2279de169d725f82cbb992e95dbbc500811fe24aee9efc8f3e173aae2d18c": {
    functionName: "getEmailVerifyStats_createServerFn_handler",
    importer: () => import("./fw-assets/admin-email-verify.functions-WS7l8W1H.js")
  },
  "70c63b88de77e94ff0369a104d532e357bf6aff7a591587b212edda6bdb61edd": {
    functionName: "verifyHostLeadBatch_createServerFn_handler",
    importer: () => import("./fw-assets/admin-email-verify.functions-WS7l8W1H.js")
  },
  "6340da91574d15a251a5bec78865c862bf9ec79fcf2e2798f8476063e9c0a0f8": {
    functionName: "listVerifiedLeads_createServerFn_handler",
    importer: () => import("./fw-assets/admin-email-verify.functions-WS7l8W1H.js")
  },
  "cc1a925af565cc8102a84bede880710eec0177183540050f638284898ec31e7b": {
    functionName: "scrapeContentPage_createServerFn_handler",
    importer: () => import("./fw-assets/content-scrape.functions-CXrcboDj.js")
  },
  "968dc7cf943a155cb3041dcf7f9252a4fb3b76bf149b5b3809fad848722e54a4": {
    functionName: "nextPendingPage_createServerFn_handler",
    importer: () => import("./fw-assets/content-scrape.functions-CXrcboDj.js")
  },
  "d9befc9af4bef82f33cfb13162df09215c0864231dd75749925ed8df5ae72b4a": {
    functionName: "scrapeProgress_createServerFn_handler",
    importer: () => import("./fw-assets/content-scrape.functions-CXrcboDj.js")
  },
  "8ed0cf74651f06db30d5a4b78b6c221c4e58f8c48a1beeb1c2d6358aa324401d": {
    functionName: "scanContentHealth_createServerFn_handler",
    importer: () => import("./fw-assets/content-health.functions-C4f0q_hj.js")
  },
  "df1ce286e5d0c0945818d77c80adb5b1f79260ccf04dcc41d839b3ed89b4f398": {
    functionName: "adminListBlogPosts_createServerFn_handler",
    importer: () => import("./fw-assets/admin-blog.functions-BlnvebeH.js")
  },
  "89efd1407c91e91778a4f37de8144a2b14ae0ee3365eea29217c7832cd0cee6d": {
    functionName: "adminExpandBlogPost_createServerFn_handler",
    importer: () => import("./fw-assets/admin-blog.functions-BlnvebeH.js")
  },
  "76750b92c29342f211d88835938de0ae626c9febbd33e097a5da36a8af863235": {
    functionName: "adminGenerateBlogPost_createServerFn_handler",
    importer: () => import("./fw-assets/admin-blog.functions-BlnvebeH.js")
  },
  "a9e8884ed1234a6c7a33fe52762212decdb3f84d1120f7f10f7da435fdfed1d2": {
    functionName: "adminBulkPublishBlogPosts_createServerFn_handler",
    importer: () => import("./fw-assets/admin-blog.functions-BlnvebeH.js")
  },
  "1a5beb97f89a4ff75edde8c7f9e00a0e670cf3f7248931056faa67622874a406": {
    functionName: "runHeroBackfill_createServerFn_handler",
    importer: () => import("./fw-assets/cities-hero-backfill.functions-3_-IOCpF.js")
  },
  "c1dba8f5e92bc0ed980fbdb68bbaeb3c1a68efe10d7d9c4f7900968ec161cd91": {
    functionName: "getHeroBackfillReport_createServerFn_handler",
    importer: () => import("./fw-assets/cities-hero-report.functions-Ds4r3g2u.js")
  },
  "1048a77fafa7fe9958dacf0267ae980fd895aea9e5a03b611d64bc0f9dfb94b6": {
    functionName: "getGenerateStats_createServerFn_handler",
    importer: () => import("./fw-assets/generate-content-stats.functions-XDIhsaQU.js")
  },
  "0e6ca0e8afcbf004b1e376ebfc6b975e1d5efe4352b22af22609a9b82afb745d": {
    functionName: "generateContentBatch_createServerFn_handler",
    importer: () => import("./fw-assets/generate-content-batch.functions-C4SRZDg7.js")
  },
  "cc8247edfb764bc249057bfb7ed1c1c3b7fb767a9ecb3a0527db515930482181": {
    functionName: "getListingAvailability_createServerFn_handler",
    importer: () => import("./fw-assets/availability.functions-CrLvo2Xv.js")
  },
  "aa4bdb35470374a924313712806bef27436b63448c847ad43833b6ba622835e0": {
    functionName: "joinPoolWaitlist_createServerFn_handler",
    importer: () => import("./fw-assets/waitlist.functions-v2InAr5R.js")
  },
  "77a019bdcee1129151c815536eb8268c7844203715fff3d45cc20b23559ec740": {
    functionName: "submitHostLead_createServerFn_handler",
    importer: () => import("./fw-assets/host-lead.functions-DDiuVemP.js")
  }
};
async function getServerFnById(id, access) {
  const serverFnInfo = manifest[id];
  if (!serverFnInfo) {
    throw new Error("Server function info not found for " + id);
  }
  const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
  if (!fnModule) {
    throw new Error("Server function module not resolved for " + id);
  }
  const action = fnModule[serverFnInfo.functionName];
  if (!action) {
    throw new Error("Server function module export not resolved for serverFn ID: " + id);
  }
  return action;
}
var TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
var TSS_SERVER_FUNCTION = /* @__PURE__ */ Symbol.for("TSS_SERVER_FUNCTION");
var TSS_SERVER_FUNCTION_FACTORY = /* @__PURE__ */ Symbol.for("TSS_SERVER_FUNCTION_FACTORY");
var X_TSS_SERIALIZED = "x-tss-serialized";
var X_TSS_RAW_RESPONSE = "x-tss-raw";
var TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
var FrameType = {
  JSON: 0,
  CHUNK: 1,
  END: 2,
  ERROR: 3
};
var FRAME_HEADER_SIZE = 9;
var TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=1`;
function isSafeKey(key) {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
function safeObjectMerge(target, source) {
  const result = /* @__PURE__ */ Object.create(null);
  if (target) {
    for (const key of Object.keys(target)) if (isSafeKey(key)) result[key] = target[key];
  }
  if (source && typeof source === "object") {
    for (const key of Object.keys(source)) if (isSafeKey(key)) result[key] = source[key];
  }
  return result;
}
function createNullProtoObject(source) {
  if (!source) return /* @__PURE__ */ Object.create(null);
  const obj = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(source)) if (isSafeKey(key)) obj[key] = source[key];
  return obj;
}
var GLOBAL_STORAGE_KEY = /* @__PURE__ */ Symbol.for("tanstack-start:start-storage-context");
var globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
var startStorage = globalObj[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
  return startStorage.run(context, fn);
}
function getStartContext(opts) {
  const context = startStorage.getStore();
  if (!context && opts?.throwIfNotFound !== false) throw new Error(`No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
  return context;
}
var getStartOptions = () => getStartContext().startOptions;
var getStartContextServerOnly = getStartContext;
var createServerFn = (options, __opts) => {
  const resolvedOptions = __opts || options || {};
  if (typeof resolvedOptions.method === "undefined") resolvedOptions.method = "GET";
  const res = {
    options: resolvedOptions,
    middleware: (middleware) => {
      const newMiddleware = [...resolvedOptions.middleware || []];
      middleware.map((m) => {
        if (TSS_SERVER_FUNCTION_FACTORY in m) {
          if (m.options.middleware) newMiddleware.push(...m.options.middleware);
        } else newMiddleware.push(m);
      });
      const res2 = createServerFn(void 0, {
        ...resolvedOptions,
        middleware: newMiddleware
      });
      res2[TSS_SERVER_FUNCTION_FACTORY] = true;
      return res2;
    },
    inputValidator: (inputValidator) => {
      return createServerFn(void 0, {
        ...resolvedOptions,
        inputValidator
      });
    },
    handler: (...args) => {
      const [extractedFn, serverFn] = args;
      const newOptions = {
        ...resolvedOptions,
        extractedFn,
        serverFn
      };
      const resolvedMiddleware = [...newOptions.middleware || [], serverFnBaseToMiddleware(newOptions)];
      extractedFn.method = resolvedOptions.method;
      return Object.assign(async (opts) => {
        const result = await executeMiddleware$1(resolvedMiddleware, "client", {
          ...extractedFn,
          ...newOptions,
          data: opts?.data,
          headers: opts?.headers,
          signal: opts?.signal,
          fetch: opts?.fetch,
          context: createNullProtoObject()
        });
        const redirect = parseRedirect(result.error);
        if (redirect) throw redirect;
        if (result.error) throw result.error;
        return result.result;
      }, {
        ...extractedFn,
        method: resolvedOptions.method,
        __executeServer: async (opts) => {
          const startContext = getStartContextServerOnly();
          const serverContextAfterGlobalMiddlewares = startContext.contextAfterGlobalMiddlewares;
          return await executeMiddleware$1(resolvedMiddleware, "server", {
            ...extractedFn,
            ...opts,
            serverFnMeta: extractedFn.serverFnMeta,
            context: safeObjectMerge(opts.context, serverContextAfterGlobalMiddlewares),
            request: startContext.request
          }).then((d) => ({
            result: d.result,
            error: d.error,
            context: d.sendContext
          }));
        }
      });
    }
  };
  const fun = (options2) => {
    return createServerFn(void 0, {
      ...resolvedOptions,
      ...options2
    });
  };
  return Object.assign(fun, res);
};
async function executeMiddleware$1(middlewares, env, opts) {
  let flattenedMiddlewares = flattenMiddlewares([...getStartOptions()?.functionMiddleware || [], ...middlewares]);
  if (env === "server") {
    const startContext = getStartContextServerOnly({ throwIfNotFound: false });
    if (startContext?.executedRequestMiddlewares) flattenedMiddlewares = flattenedMiddlewares.filter((m) => !startContext.executedRequestMiddlewares.has(m));
  }
  const callNextMiddleware = async (ctx) => {
    const nextMiddleware = flattenedMiddlewares.shift();
    if (!nextMiddleware) return ctx;
    try {
      if ("inputValidator" in nextMiddleware.options && nextMiddleware.options.inputValidator && env === "server") ctx.data = await execValidator(nextMiddleware.options.inputValidator, ctx.data);
      let middlewareFn = void 0;
      if (env === "client") {
        if ("client" in nextMiddleware.options) middlewareFn = nextMiddleware.options.client;
      } else if ("server" in nextMiddleware.options) middlewareFn = nextMiddleware.options.server;
      if (middlewareFn) {
        const userNext = async (userCtx = {}) => {
          const result2 = await callNextMiddleware({
            ...ctx,
            ...userCtx,
            context: safeObjectMerge(ctx.context, userCtx.context),
            sendContext: safeObjectMerge(ctx.sendContext, userCtx.sendContext),
            headers: mergeHeaders(ctx.headers, userCtx.headers),
            _callSiteFetch: ctx._callSiteFetch,
            fetch: ctx._callSiteFetch ?? userCtx.fetch ?? ctx.fetch,
            result: userCtx.result !== void 0 ? userCtx.result : userCtx instanceof Response ? userCtx : ctx.result,
            error: userCtx.error ?? ctx.error
          });
          if (result2.error) throw result2.error;
          return result2;
        };
        const result = await middlewareFn({
          ...ctx,
          next: userNext
        });
        if (isRedirect(result)) return {
          ...ctx,
          error: result
        };
        if (result instanceof Response) return {
          ...ctx,
          result
        };
        if (!result) throw new Error("User middleware returned undefined. You must call next() or return a result in your middlewares.");
        return result;
      }
      return callNextMiddleware(ctx);
    } catch (error) {
      return {
        ...ctx,
        error
      };
    }
  };
  return callNextMiddleware({
    ...opts,
    headers: opts.headers || {},
    sendContext: opts.sendContext || {},
    context: opts.context || createNullProtoObject(),
    _callSiteFetch: opts.fetch
  });
}
function flattenMiddlewares(middlewares, maxDepth = 100) {
  const seen = /* @__PURE__ */ new Set();
  const flattened = [];
  const recurse = (middleware, depth) => {
    if (depth > maxDepth) throw new Error(`Middleware nesting depth exceeded maximum of ${maxDepth}. Check for circular references.`);
    middleware.forEach((m) => {
      if (m.options.middleware) recurse(m.options.middleware, depth + 1);
      if (!seen.has(m)) {
        seen.add(m);
        flattened.push(m);
      }
    });
  };
  recurse(middlewares, 0);
  return flattened;
}
async function execValidator(validator, input) {
  if (validator == null) return {};
  if ("~standard" in validator) {
    const result = await validator["~standard"].validate(input);
    if (result.issues) throw new Error(JSON.stringify(result.issues, void 0, 2));
    return result.value;
  }
  if ("parse" in validator) return validator.parse(input);
  if (typeof validator === "function") return validator(input);
  throw new Error("Invalid validator type!");
}
function serverFnBaseToMiddleware(options) {
  return {
    "~types": void 0,
    options: {
      inputValidator: options.inputValidator,
      client: async ({ next, sendContext, fetch: fetch2, ...ctx }) => {
        const payload = {
          ...ctx,
          context: sendContext,
          fetch: fetch2
        };
        return next(await options.extractedFn?.(payload));
      },
      server: async ({ next, ...ctx }) => {
        const result = await options.serverFn?.(ctx);
        return next({
          ...ctx,
          result
        });
      }
    }
  };
}
function getDefaultSerovalPlugins() {
  return [...getStartOptions()?.serializationAdapters?.map(makeSerovalPlugin) ?? [], ...defaultSerovalPlugins];
}
var textEncoder = new TextEncoder();
var EMPTY_PAYLOAD = new Uint8Array(0);
function encodeFrame(type, streamId, payload) {
  const frame = new Uint8Array(FRAME_HEADER_SIZE + payload.length);
  frame[0] = type;
  frame[1] = streamId >>> 24 & 255;
  frame[2] = streamId >>> 16 & 255;
  frame[3] = streamId >>> 8 & 255;
  frame[4] = streamId & 255;
  frame[5] = payload.length >>> 24 & 255;
  frame[6] = payload.length >>> 16 & 255;
  frame[7] = payload.length >>> 8 & 255;
  frame[8] = payload.length & 255;
  frame.set(payload, FRAME_HEADER_SIZE);
  return frame;
}
function encodeJSONFrame(json) {
  return encodeFrame(FrameType.JSON, 0, textEncoder.encode(json));
}
function encodeChunkFrame(streamId, chunk) {
  return encodeFrame(FrameType.CHUNK, streamId, chunk);
}
function encodeEndFrame(streamId) {
  return encodeFrame(FrameType.END, streamId, EMPTY_PAYLOAD);
}
function encodeErrorFrame(streamId, error) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  return encodeFrame(FrameType.ERROR, streamId, textEncoder.encode(message));
}
function createMultiplexedStream(jsonStream, rawStreams, lateStreamSource) {
  let controller;
  let cancelled = false;
  const readers = [];
  const enqueue = (frame) => {
    if (cancelled) return false;
    try {
      controller.enqueue(frame);
      return true;
    } catch {
      return false;
    }
  };
  const errorOutput = (error) => {
    if (cancelled) return;
    cancelled = true;
    try {
      controller.error(error);
    } catch {
    }
    for (const reader of readers) reader.cancel().catch(() => {
    });
  };
  async function pumpRawStream(streamId, stream) {
    const reader = stream.getReader();
    readers.push(reader);
    try {
      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) {
          enqueue(encodeEndFrame(streamId));
          return;
        }
        if (!enqueue(encodeChunkFrame(streamId, value))) return;
      }
    } catch (error) {
      enqueue(encodeErrorFrame(streamId, error));
    } finally {
      reader.releaseLock();
    }
  }
  async function pumpJSON() {
    const reader = jsonStream.getReader();
    readers.push(reader);
    try {
      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) return;
        if (!enqueue(encodeJSONFrame(value))) return;
      }
    } catch (error) {
      errorOutput(error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
  async function pumpLateStreams() {
    if (!lateStreamSource) return [];
    const lateStreamPumps = [];
    const reader = lateStreamSource.getReader();
    readers.push(reader);
    try {
      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;
        lateStreamPumps.push(pumpRawStream(value.id, value.stream));
      }
    } finally {
      reader.releaseLock();
    }
    return lateStreamPumps;
  }
  return new ReadableStream({
    async start(ctrl) {
      controller = ctrl;
      const pumps = [pumpJSON()];
      for (const [streamId, stream] of rawStreams) pumps.push(pumpRawStream(streamId, stream));
      if (lateStreamSource) pumps.push(pumpLateStreams());
      try {
        const latePumps = (await Promise.all(pumps)).find(Array.isArray);
        if (latePumps && latePumps.length > 0) await Promise.all(latePumps);
        if (!cancelled) try {
          controller.close();
        } catch {
        }
      } catch {
      }
    },
    cancel() {
      cancelled = true;
      for (const reader of readers) reader.cancel().catch(() => {
      });
      readers.length = 0;
    }
  });
}
var serovalPlugins = void 0;
var FORM_DATA_CONTENT_TYPES = ["multipart/form-data", "application/x-www-form-urlencoded"];
var MAX_PAYLOAD_SIZE = 1e6;
var handleServerAction = async ({ request, context, serverFnId }) => {
  const methodUpper = request.method.toUpperCase();
  const url = new URL(request.url);
  const action = await getServerFnById(serverFnId);
  if (action.method && methodUpper !== action.method) return new Response(`expected ${action.method} method. Got ${methodUpper}`, {
    status: 405,
    headers: { Allow: action.method }
  });
  const isServerFn = request.headers.get("x-tsr-serverFn") === "true";
  if (!serovalPlugins) serovalPlugins = getDefaultSerovalPlugins();
  const contentType = request.headers.get("Content-Type");
  function parsePayload(payload) {
    return fromJSON(payload, { plugins: serovalPlugins });
  }
  return await (async () => {
    try {
      let serializeResult = function(res2) {
        let nonStreamingBody = void 0;
        const alsResponse = getResponse();
        if (res2 !== void 0) {
          const rawStreams = /* @__PURE__ */ new Map();
          let initialPhase = true;
          let lateStreamWriter;
          let lateStreamReadable = void 0;
          const pendingLateStreams = [];
          const plugins = [createRawStreamRPCPlugin((id, stream) => {
            if (initialPhase) {
              rawStreams.set(id, stream);
              return;
            }
            if (lateStreamWriter) {
              lateStreamWriter.write({
                id,
                stream
              }).catch(() => {
              });
              return;
            }
            pendingLateStreams.push({
              id,
              stream
            });
          }), ...serovalPlugins || []];
          let done = false;
          const callbacks = {
            onParse: (value) => {
              nonStreamingBody = value;
            },
            onDone: () => {
              done = true;
            },
            onError: (error) => {
              throw error;
            }
          };
          toCrossJSONStream(res2, {
            refs: /* @__PURE__ */ new Map(),
            plugins,
            onParse(value) {
              callbacks.onParse(value);
            },
            onDone() {
              callbacks.onDone();
            },
            onError: (error) => {
              callbacks.onError(error);
            }
          });
          initialPhase = false;
          if (done && rawStreams.size === 0) return new Response(nonStreamingBody ? JSON.stringify(nonStreamingBody) : void 0, {
            status: alsResponse.status,
            statusText: alsResponse.statusText,
            headers: {
              "Content-Type": "application/json",
              [X_TSS_SERIALIZED]: "true"
            }
          });
          const { readable, writable } = new TransformStream();
          lateStreamReadable = readable;
          lateStreamWriter = writable.getWriter();
          for (const registration of pendingLateStreams) lateStreamWriter.write(registration).catch(() => {
          });
          pendingLateStreams.length = 0;
          const multiplexedStream = createMultiplexedStream(new ReadableStream({
            start(controller) {
              callbacks.onParse = (value) => {
                controller.enqueue(JSON.stringify(value) + "\n");
              };
              callbacks.onDone = () => {
                try {
                  controller.close();
                } catch {
                }
                lateStreamWriter?.close().catch(() => {
                }).finally(() => {
                  lateStreamWriter = void 0;
                });
              };
              callbacks.onError = (error) => {
                controller.error(error);
                lateStreamWriter?.abort(error).catch(() => {
                }).finally(() => {
                  lateStreamWriter = void 0;
                });
              };
              if (nonStreamingBody !== void 0) callbacks.onParse(nonStreamingBody);
              if (done) callbacks.onDone();
            },
            cancel() {
              lateStreamWriter?.abort().catch(() => {
              });
              lateStreamWriter = void 0;
            }
          }), rawStreams, lateStreamReadable);
          return new Response(multiplexedStream, {
            status: alsResponse.status,
            statusText: alsResponse.statusText,
            headers: {
              "Content-Type": TSS_CONTENT_TYPE_FRAMED_VERSIONED,
              [X_TSS_SERIALIZED]: "true"
            }
          });
        }
        return new Response(void 0, {
          status: alsResponse.status,
          statusText: alsResponse.statusText
        });
      };
      let res = await (async () => {
        if (FORM_DATA_CONTENT_TYPES.some((type) => contentType && contentType.includes(type))) {
          if (methodUpper === "GET") {
            if (false) ;
            invariant();
          }
          const formData = await request.formData();
          const serializedContext = formData.get(TSS_FORMDATA_CONTEXT);
          formData.delete(TSS_FORMDATA_CONTEXT);
          const params = {
            context,
            data: formData,
            method: methodUpper
          };
          if (typeof serializedContext === "string") try {
            const deserializedContext = fromJSON(JSON.parse(serializedContext), { plugins: serovalPlugins });
            if (typeof deserializedContext === "object" && deserializedContext) params.context = safeObjectMerge(deserializedContext, context);
          } catch (e) {
            if (false) ;
          }
          return await action(params);
        }
        if (methodUpper === "GET") {
          const payloadParam = url.searchParams.get("payload");
          if (payloadParam && payloadParam.length > MAX_PAYLOAD_SIZE) throw new Error("Payload too large");
          const payload2 = payloadParam ? parsePayload(JSON.parse(payloadParam)) : {};
          payload2.context = safeObjectMerge(payload2.context, context);
          payload2.method = methodUpper;
          return await action(payload2);
        }
        let jsonPayload;
        if (contentType?.includes("application/json")) jsonPayload = await request.json();
        const payload = jsonPayload ? parsePayload(jsonPayload) : {};
        payload.context = safeObjectMerge(payload.context, context);
        payload.method = methodUpper;
        return await action(payload);
      })();
      const unwrapped = res.result || res.error;
      if (isNotFound(res)) res = isNotFoundResponse(res);
      if (!isServerFn) return unwrapped;
      if (unwrapped instanceof Response) {
        if (isRedirect(unwrapped)) return unwrapped;
        unwrapped.headers.set(X_TSS_RAW_RESPONSE, "true");
        return unwrapped;
      }
      return serializeResult(res);
    } catch (error) {
      if (error instanceof Response) return error;
      if (isNotFound(error)) return isNotFoundResponse(error);
      console.info();
      console.info("Server Fn Error!");
      console.info();
      console.error(error);
      console.info();
      const serializedError = JSON.stringify(await Promise.resolve(toCrossJSONAsync(error, {
        refs: /* @__PURE__ */ new Map(),
        plugins: serovalPlugins
      })));
      const response = getResponse();
      return new Response(serializedError, {
        status: response.status ?? 500,
        statusText: response.statusText,
        headers: {
          "Content-Type": "application/json",
          [X_TSS_SERIALIZED]: "true"
        }
      });
    }
  })();
};
function isNotFoundResponse(error) {
  const { headers, ...rest } = error;
  return new Response(JSON.stringify(rest), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      ...headers || {}
    }
  });
}
function normalizeTransformAssetResult(result) {
  if (typeof result === "string") return { href: result };
  return result;
}
function resolveTransformAssetsCrossOrigin(config, kind) {
  if (!config) return void 0;
  if (typeof config === "string") return config;
  return config[kind];
}
function isObjectShorthand(transform) {
  return "prefix" in transform;
}
function resolveTransformAssetsConfig(transform) {
  if (typeof transform === "string") {
    const prefix = transform;
    return {
      type: "transform",
      transformFn: ({ url }) => ({ href: `${prefix}${url}` }),
      cache: true
    };
  }
  if (typeof transform === "function") return {
    type: "transform",
    transformFn: transform,
    cache: true
  };
  if (isObjectShorthand(transform)) {
    const { prefix, crossOrigin } = transform;
    return {
      type: "transform",
      transformFn: ({ url, kind }) => {
        const href = `${prefix}${url}`;
        if (kind === "clientEntry") return { href };
        const co = resolveTransformAssetsCrossOrigin(crossOrigin, kind);
        return co ? {
          href,
          crossOrigin: co
        } : { href };
      },
      cache: true
    };
  }
  if ("createTransform" in transform && transform.createTransform) return {
    type: "createTransform",
    createTransform: transform.createTransform,
    cache: transform.cache !== false
  };
  return {
    type: "transform",
    transformFn: typeof transform.transform === "string" ? (({ url }) => ({ href: `${transform.transform}${url}` })) : transform.transform,
    cache: transform.cache !== false
  };
}
function adaptTransformAssetUrlsToTransformAssets(transformFn) {
  return async ({ url, kind }) => ({ href: await transformFn({
    url,
    type: kind
  }) });
}
function adaptTransformAssetUrlsConfigToTransformAssets(transform) {
  if (typeof transform === "string") return transform;
  if (typeof transform === "function") return adaptTransformAssetUrlsToTransformAssets(transform);
  if ("createTransform" in transform && transform.createTransform) return {
    createTransform: async (ctx) => adaptTransformAssetUrlsToTransformAssets(await transform.createTransform(ctx)),
    cache: transform.cache,
    warmup: transform.warmup
  };
  return {
    transform: typeof transform.transform === "string" ? transform.transform : adaptTransformAssetUrlsToTransformAssets(transform.transform),
    cache: transform.cache,
    warmup: transform.warmup
  };
}
function buildClientEntryScriptTag(clientEntry, injectedHeadScripts) {
  let script = `import(${JSON.stringify(clientEntry)})`;
  if (injectedHeadScripts) script = `${injectedHeadScripts};${script}`;
  return {
    tag: "script",
    attrs: {
      type: "module",
      async: true
    },
    children: script
  };
}
function assignManifestAssetLink(link, next) {
  if (typeof link === "string") return next.crossOrigin ? next : next.href;
  return next.crossOrigin ? next : { href: next.href };
}
async function transformManifestAssets(source, transformFn, _opts) {
  const manifest2 = structuredClone(source.manifest);
  for (const route of Object.values(manifest2.routes)) {
    if (route.preloads) route.preloads = await Promise.all(route.preloads.map(async (link) => {
      const result = normalizeTransformAssetResult(await transformFn({
        url: resolveManifestAssetLink(link).href,
        kind: "modulepreload"
      }));
      return assignManifestAssetLink(link, {
        href: result.href,
        crossOrigin: result.crossOrigin
      });
    }));
    if (route.assets) {
      for (const asset of route.assets) if (asset.tag === "link" && asset.attrs?.href) {
        const rel = asset.attrs.rel;
        if (!(typeof rel === "string" ? rel.split(/\s+/) : []).includes("stylesheet")) continue;
        const result = normalizeTransformAssetResult(await transformFn({
          url: asset.attrs.href,
          kind: "stylesheet"
        }));
        asset.attrs.href = result.href;
        if (result.crossOrigin) asset.attrs.crossOrigin = result.crossOrigin;
        else delete asset.attrs.crossOrigin;
      }
    }
  }
  const transformedClientEntry = normalizeTransformAssetResult(await transformFn({
    url: source.clientEntry,
    kind: "clientEntry"
  }));
  const rootRoute = manifest2.routes[rootRouteId] = manifest2.routes[rootRouteId] || {};
  rootRoute.assets = rootRoute.assets || [];
  rootRoute.assets.push(buildClientEntryScriptTag(transformedClientEntry.href, source.injectedHeadScripts));
  return manifest2;
}
function buildManifestWithClientEntry(source) {
  const scriptTag = buildClientEntryScriptTag(source.clientEntry, source.injectedHeadScripts);
  const baseRootRoute = source.manifest.routes[rootRouteId];
  return { routes: {
    ...source.manifest.routes,
    [rootRouteId]: {
      ...baseRootRoute,
      assets: [...baseRootRoute?.assets || [], scriptTag]
    }
  } };
}
var ServerFunctionSerializationAdapter = createSerializationAdapter({
  key: "$TSS/serverfn",
  test: (v) => {
    if (typeof v !== "function") return false;
    if (!(TSS_SERVER_FUNCTION in v)) return false;
    return !!v[TSS_SERVER_FUNCTION];
  },
  toSerializable: ({ serverFnMeta }) => ({ functionId: serverFnMeta.id }),
  fromSerializable: ({ functionId }) => {
    const fn = async (opts, signal) => {
      return (await (await getServerFnById(functionId))(opts ?? {}, signal)).result;
    };
    return fn;
  }
});
function getStartResponseHeaders(opts) {
  return mergeHeaders({ "Content-Type": "text/html; charset=utf-8" }, ...opts.router.stores.matches.get().map((match) => {
    return match.headers;
  }));
}
var entriesPromise;
var baseManifestPromise;
var cachedFinalManifestPromise;
async function loadEntries() {
  const [routerEntry, startEntry, pluginAdapters] = await Promise.all([
    import("./fw-assets/router-Bw8GQi9C.js").then((n) => n.bX),
    import("./fw-assets/start-R4nkXONM.js"),
    import("./fw-assets/__23tanstack-start-plugin-adapters-Cwee5PKy.js")
  ]);
  return {
    routerEntry,
    startEntry,
    pluginAdapters
  };
}
function getEntries() {
  if (!entriesPromise) entriesPromise = loadEntries();
  return entriesPromise;
}
function getBaseManifest(matchedRoutes) {
  if (!baseManifestPromise) baseManifestPromise = getStartManifest();
  return baseManifestPromise;
}
async function resolveManifest(matchedRoutes, transformFn, cache) {
  const base = await getBaseManifest();
  const computeFinalManifest = async () => {
    return transformFn ? await transformManifestAssets(base, transformFn) : buildManifestWithClientEntry(base);
  };
  if (!transformFn || cache) {
    if (!cachedFinalManifestPromise) cachedFinalManifestPromise = computeFinalManifest();
    return cachedFinalManifestPromise;
  }
  return computeFinalManifest();
}
var ROUTER_BASEPATH = "/";
var SERVER_FN_BASE = "/_serverFn/";
var IS_PRERENDERING = process.env.TSS_PRERENDERING === "true";
var IS_SHELL_ENV = process.env.TSS_SHELL === "true";
var ERR_NO_RESPONSE = "Internal Server Error";
var ERR_NO_DEFER = "Internal Server Error";
function throwRouteHandlerError() {
  throw new Error(ERR_NO_RESPONSE);
}
function throwIfMayNotDefer() {
  throw new Error(ERR_NO_DEFER);
}
function isSpecialResponse(value) {
  return value instanceof Response || isRedirect(value);
}
function handleCtxResult(result) {
  if (isSpecialResponse(result)) return { response: result };
  return result;
}
function executeMiddleware(middlewares, ctx) {
  let index = -1;
  const next = async (nextCtx) => {
    if (nextCtx) {
      if (nextCtx.context) ctx.context = safeObjectMerge(ctx.context, nextCtx.context);
      for (const key of Object.keys(nextCtx)) if (key !== "context") ctx[key] = nextCtx[key];
    }
    index++;
    const middleware = middlewares[index];
    if (!middleware) return ctx;
    let result;
    try {
      result = await middleware({
        ...ctx,
        next
      });
    } catch (err) {
      if (isSpecialResponse(err)) {
        ctx.response = err;
        return ctx;
      }
      throw err;
    }
    const normalized = handleCtxResult(result);
    if (normalized) {
      if (normalized.response !== void 0) ctx.response = normalized.response;
      if (normalized.context) ctx.context = safeObjectMerge(ctx.context, normalized.context);
    }
    return ctx;
  };
  return next();
}
function handlerToMiddleware(handler, mayDefer = false) {
  if (mayDefer) return handler;
  return async (ctx) => {
    const response = await handler({
      ...ctx,
      next: throwIfMayNotDefer
    });
    if (!response) throwRouteHandlerError();
    return response;
  };
}
function createStartHandler(cbOrOptions) {
  const cb = typeof cbOrOptions === "function" ? cbOrOptions : cbOrOptions.handler;
  const transformAssetsOption = typeof cbOrOptions === "function" ? void 0 : cbOrOptions.transformAssets;
  const transformAssetUrlsOption = typeof cbOrOptions === "function" ? void 0 : cbOrOptions.transformAssetUrls;
  const transformOption = transformAssetsOption !== void 0 ? resolveTransformAssetsConfig(transformAssetsOption) : transformAssetUrlsOption !== void 0 ? resolveTransformAssetsConfig(adaptTransformAssetUrlsConfigToTransformAssets(transformAssetUrlsOption)) : void 0;
  const warmupTransformManifest = !!transformAssetsOption && typeof transformAssetsOption === "object" && "warmup" in transformAssetsOption && transformAssetsOption.warmup === true || !!transformAssetUrlsOption && typeof transformAssetUrlsOption === "object" && transformAssetUrlsOption.warmup === true;
  const resolvedTransformConfig = transformOption;
  const cache = resolvedTransformConfig ? resolvedTransformConfig.cache : true;
  const shouldCacheCreateTransform = cache && true;
  let cachedCreateTransformPromise;
  const getTransformFn = async (opts) => {
    if (!resolvedTransformConfig) return void 0;
    if (resolvedTransformConfig.type === "createTransform") {
      if (shouldCacheCreateTransform) {
        if (!cachedCreateTransformPromise) cachedCreateTransformPromise = Promise.resolve(resolvedTransformConfig.createTransform(opts)).catch((error) => {
          cachedCreateTransformPromise = void 0;
          throw error;
        });
        return cachedCreateTransformPromise;
      }
      return resolvedTransformConfig.createTransform(opts);
    }
    return resolvedTransformConfig.transformFn;
  };
  if (warmupTransformManifest && cache && true && !cachedFinalManifestPromise) {
    const warmupPromise = (async () => {
      const base = await getBaseManifest();
      const transformFn = await getTransformFn({ warmup: true });
      return transformFn ? await transformManifestAssets(base, transformFn) : buildManifestWithClientEntry(base);
    })();
    cachedFinalManifestPromise = warmupPromise;
    warmupPromise.catch(() => {
      if (cachedFinalManifestPromise === warmupPromise) cachedFinalManifestPromise = void 0;
      cachedCreateTransformPromise = void 0;
    });
  }
  const startRequestResolver = async (request, requestOpts) => {
    let router = null;
    let cbWillCleanup = false;
    try {
      const { url, handledProtocolRelativeURL } = getNormalizedURL(request.url);
      const href = url.pathname + url.search + url.hash;
      const origin = getOrigin(request);
      if (handledProtocolRelativeURL) return Response.redirect(url, 308);
      const entries = await getEntries();
      const startOptions = await entries.startEntry.startInstance?.getOptions() || {};
      const { hasPluginAdapters, pluginSerializationAdapters } = entries.pluginAdapters;
      const serializationAdapters = [
        ...startOptions.serializationAdapters || [],
        ...hasPluginAdapters ? pluginSerializationAdapters : [],
        ServerFunctionSerializationAdapter
      ];
      const requestStartOptions = {
        ...startOptions,
        serializationAdapters
      };
      const flattenedRequestMiddlewares = startOptions.requestMiddleware ? flattenMiddlewares(startOptions.requestMiddleware) : [];
      const executedRequestMiddlewares = new Set(flattenedRequestMiddlewares);
      const getRouter = async () => {
        if (router) return router;
        router = await entries.routerEntry.getRouter();
        let isShell = IS_SHELL_ENV;
        if (IS_PRERENDERING && !isShell) isShell = request.headers.get(HEADERS.TSS_SHELL) === "true";
        const history = createMemoryHistory({ initialEntries: [href] });
        router.update({
          history,
          isShell,
          isPrerendering: IS_PRERENDERING,
          origin: router.options.origin ?? origin,
          defaultSsr: requestStartOptions.defaultSsr,
          serializationAdapters: [...requestStartOptions.serializationAdapters, ...router.options.serializationAdapters || []],
          basepath: ROUTER_BASEPATH
        });
        return router;
      };
      if (SERVER_FN_BASE && url.pathname.startsWith(SERVER_FN_BASE)) {
        const serverFnId = url.pathname.slice(SERVER_FN_BASE.length).split("/")[0];
        if (!serverFnId) throw new Error("Invalid server action param for serverFnId");
        const serverFnHandler = async ({ context }) => {
          return runWithStartContext({
            getRouter,
            startOptions: requestStartOptions,
            contextAfterGlobalMiddlewares: context,
            request,
            executedRequestMiddlewares,
            handlerType: "serverFn"
          }, () => handleServerAction({
            request,
            context: requestOpts?.context,
            serverFnId
          }));
        };
        return handleRedirectResponse((await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), serverFnHandler], {
          request,
          pathname: url.pathname,
          context: createNullProtoObject(requestOpts?.context)
        })).response, request, getRouter);
      }
      const executeRouter = async (serverContext, matchedRoutes) => {
        const acceptParts = (request.headers.get("Accept") || "*/*").split(",");
        if (!["*/*", "text/html"].some((mimeType) => acceptParts.some((part) => part.trim().startsWith(mimeType)))) return Response.json({ error: "Only HTML requests are supported here" }, { status: 500 });
        const manifest2 = await resolveManifest(matchedRoutes, await getTransformFn({
          warmup: false,
          request
        }), cache);
        const routerInstance = await getRouter();
        attachRouterServerSsrUtils({
          router: routerInstance,
          manifest: manifest2,
          getRequestAssets: () => getStartContext({ throwIfNotFound: false })?.requestAssets,
          includeUnmatchedRouteAssets: false
        });
        routerInstance.update({ additionalContext: { serverContext } });
        await routerInstance.load();
        if (routerInstance.state.redirect) return routerInstance.state.redirect;
        const ctx = getStartContext({ throwIfNotFound: false });
        await routerInstance.serverSsr.dehydrate({ requestAssets: ctx?.requestAssets });
        const responseHeaders = getStartResponseHeaders({ router: routerInstance });
        cbWillCleanup = true;
        return cb({
          request,
          router: routerInstance,
          responseHeaders
        });
      };
      const requestHandlerMiddleware = async ({ context }) => {
        return runWithStartContext({
          getRouter,
          startOptions: requestStartOptions,
          contextAfterGlobalMiddlewares: context,
          request,
          executedRequestMiddlewares,
          handlerType: "router"
        }, async () => {
          try {
            return await handleServerRoutes({
              getRouter,
              request,
              url,
              executeRouter,
              context,
              executedRequestMiddlewares
            });
          } catch (err) {
            if (err instanceof Response) return err;
            throw err;
          }
        });
      };
      return handleRedirectResponse((await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), requestHandlerMiddleware], {
        request,
        pathname: url.pathname,
        context: createNullProtoObject(requestOpts?.context)
      })).response, request, getRouter);
    } finally {
      if (router && !cbWillCleanup) router.serverSsr?.cleanup();
      router = null;
    }
  };
  return requestHandler(startRequestResolver);
}
async function handleRedirectResponse(response, request, getRouter) {
  if (!isRedirect(response)) return response;
  if (isResolvedRedirect(response)) {
    if (request.headers.get("x-tsr-serverFn") === "true") return Response.json({
      ...response.options,
      isSerializedRedirect: true
    }, { headers: response.headers });
    return response;
  }
  const opts = response.options;
  if (opts.to && typeof opts.to === "string" && !opts.to.startsWith("/")) throw new Error(`Server side redirects must use absolute paths via the 'href' or 'to' options. The redirect() method's "to" property accepts an internal path only. Use the "href" property to provide an external URL. Received: ${JSON.stringify(opts)}`);
  if ([
    "params",
    "search",
    "hash"
  ].some((d) => typeof opts[d] === "function")) throw new Error(`Server side redirects must use static search, params, and hash values and do not support functional values. Received functional values for: ${Object.keys(opts).filter((d) => typeof opts[d] === "function").map((d) => `"${d}"`).join(", ")}`);
  const redirect = (await getRouter()).resolveRedirect(response);
  if (request.headers.get("x-tsr-serverFn") === "true") return Response.json({
    ...response.options,
    isSerializedRedirect: true
  }, { headers: response.headers });
  return redirect;
}
async function handleServerRoutes({ getRouter, request, url, executeRouter, context, executedRequestMiddlewares }) {
  const router = await getRouter();
  const pathname = executeRewriteInput(router.rewrite, url).pathname;
  const { matchedRoutes, foundRoute, routeParams } = router.getMatchedRoutes(pathname);
  const isExactMatch = foundRoute && routeParams["**"] === void 0;
  const routeMiddlewares = [];
  for (const route of matchedRoutes) {
    const serverMiddleware = route.options.server?.middleware;
    if (serverMiddleware) {
      const flattened = flattenMiddlewares(serverMiddleware);
      for (const m of flattened) if (!executedRequestMiddlewares.has(m)) routeMiddlewares.push(m.options.server);
    }
  }
  const server2 = foundRoute?.options.server;
  if (server2?.handlers && isExactMatch) {
    const handlers = typeof server2.handlers === "function" ? server2.handlers({ createHandlers: (d) => d }) : server2.handlers;
    const handler = handlers[request.method.toUpperCase()] ?? handlers["ANY"];
    if (handler) {
      const mayDefer = !!foundRoute.options.component;
      if (typeof handler === "function") routeMiddlewares.push(handlerToMiddleware(handler, mayDefer));
      else {
        if (handler.middleware?.length) {
          const handlerMiddlewares = flattenMiddlewares(handler.middleware);
          for (const m of handlerMiddlewares) routeMiddlewares.push(m.options.server);
        }
        if (handler.handler) routeMiddlewares.push(handlerToMiddleware(handler.handler, mayDefer));
      }
    }
  }
  routeMiddlewares.push((ctx) => executeRouter(ctx.context, matchedRoutes));
  return (await executeMiddleware(routeMiddlewares, {
    request,
    context,
    params: routeParams,
    pathname
  })).response;
}
const fetch = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
  return {
    async fetch(...args) {
      return await entry.fetch(...args);
    }
  };
}
const server = createServerEntry({ fetch });
export {
  setResponseHeader as A,
  setResponseHeaders as B,
  setResponseStatus as C,
  unsealSession$1 as D,
  updateSession$1 as E,
  useSession$1 as F,
  HEADERS as H,
  StartServer as S,
  TSS_SERVER_FUNCTION as T,
  getRequest as a,
  getServerFnById as b,
  createServerFn as c,
  createServerEntry,
  getRequestIP$1 as d,
  server as default,
  clearResponseHeaders as e,
  clearSession$1 as f,
  getRequestHeader as g,
  createStartHandler as h,
  defaultStreamHandler as i,
  deleteCookie$1 as j,
  getCookie as k,
  getCookies as l,
  getRequestHeaders as m,
  getRequestHost$1 as n,
  getRequestProtocol$1 as o,
  getRequestUrl as p,
  getResponse as q,
  getResponseHeader as r,
  getResponseHeaders as s,
  getResponseStatus as t,
  getSession$1 as u,
  getValidatedQuery$1 as v,
  removeResponseHeader as w,
  requestHandler as x,
  sealSession$1 as y,
  setCookie$1 as z
};
