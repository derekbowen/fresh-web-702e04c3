import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
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
async function requireAdmin(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data: role
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Forbidden");
}
const fetchAudienceCounts_createServerFn_handler = createServerRpc({
  id: "e028b1393a816be28be64b94c2d5933631462a52b897f4192fa14f666644c741",
  name: "fetchAudienceCounts",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => fetchAudienceCounts.__executeServer(opts));
const fetchAudienceCounts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(fetchAudienceCounts_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    getAudienceCount
  } = await import("./email-composer.server-DhGnJ9F6.js");
  const [hosts, renters, waitlist] = await Promise.all([getAudienceCount("hosts"), getAudienceCount("renters"), getAudienceCount("waitlist")]);
  return {
    hosts,
    renters,
    waitlist
  };
});
const fetchRecentCampaigns_createServerFn_handler = createServerRpc({
  id: "2763f9edb025ee2b66f2f52462e132526956f0f2c0e28e32264e76fb66855d55",
  name: "fetchRecentCampaigns",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => fetchRecentCampaigns.__executeServer(opts));
const fetchRecentCampaigns = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(fetchRecentCampaigns_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data
  } = await supabaseAdmin.from("composer_campaigns").select("id, subject, audience, recipient_count, sent_count, failed_count, status, test_only, scheduled_at, created_at, ab_test_id, ab_variant, sequence_id, sequence_position, plain_body, preview_text").order("created_at", {
    ascending: false
  }).limit(30);
  return data || [];
});
const fetchAbTests_createServerFn_handler = createServerRpc({
  id: "841744c410b9297ab5699138e9456fd9e5b5aa8533a3809393f15e6108e0f70d",
  name: "fetchAbTests",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => fetchAbTests.__executeServer(opts));
const fetchAbTests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(fetchAbTests_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    listAbTests
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await listAbTests();
});
const fetchSnippets_createServerFn_handler = createServerRpc({
  id: "99a8e82493d70a0e7d40812e4f80ab150c3f894be8eafb4a257936a9aeab283b",
  name: "fetchSnippets",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => fetchSnippets.__executeServer(opts));
const fetchSnippets = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(fetchSnippets_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    listSnippets
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await listSnippets();
});
const runSaveSnippet_createServerFn_handler = createServerRpc({
  id: "c7bbc480c3bf13ed9ecee26ae3a1767e88b6bf195a4a372a5e4013d28c0be0b9",
  name: "runSaveSnippet",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runSaveSnippet.__executeServer(opts));
const runSaveSnippet = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runSaveSnippet_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    saveSnippet
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await saveSnippet({
    ...data,
    createdBy: userId
  });
});
const runDeleteSnippet_createServerFn_handler = createServerRpc({
  id: "129778482587e2b6ab1ffa854777b583c9491c0b44d92d2262a82d68d2885729",
  name: "runDeleteSnippet",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runDeleteSnippet.__executeServer(opts));
const runDeleteSnippet = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runDeleteSnippet_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    deleteSnippet
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await deleteSnippet(data.id);
});
const runLookupRecipient_createServerFn_handler = createServerRpc({
  id: "7a813682b2b8b0897f3de72bc1bf8ab0f57baa7b03f6a41531b43e940b9c0047",
  name: "runLookupRecipient",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runLookupRecipient.__executeServer(opts));
const runLookupRecipient = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runLookupRecipient_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    lookupRecipient
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await lookupRecipient(data.email);
});
const runGenerateAI_createServerFn_handler = createServerRpc({
  id: "b792d18ba013e13c93d779d80a5a9efba7e0669120762a75c0794f012e5369f7",
  name: "runGenerateAI",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runGenerateAI.__executeServer(opts));
const runGenerateAI = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runGenerateAI_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    generateBodyWithAI
  } = await import("./email-composer.server-DhGnJ9F6.js");
  return await generateBodyWithAI(data);
});
const runGenerateSequence_createServerFn_handler = createServerRpc({
  id: "59f43ca0ad560f4154b968c9829d9fc3b367f61762fe396d7f0b117257969af9",
  name: "runGenerateSequence",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runGenerateSequence.__executeServer(opts));
const runGenerateSequence = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runGenerateSequence_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    generateSequenceWithAI
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await generateSequenceWithAI(data);
});
const runScheduleSequence_createServerFn_handler = createServerRpc({
  id: "389dc7360df13ff0a3386662a570daf452582c923492ac2e27886e146448200b",
  name: "runScheduleSequence",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runScheduleSequence.__executeServer(opts));
const runScheduleSequence = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runScheduleSequence_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    scheduleSequence
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await scheduleSequence({
    ...data,
    createdBy: userId
  });
});
const runSendEmail_createServerFn_handler = createServerRpc({
  id: "e596b113679319da4bbc1cfe0d014d07062197c47a75f1f6dbcbb56a58ba7c34",
  name: "runSendEmail",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runSendEmail.__executeServer(opts));
const runSendEmail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runSendEmail_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    sendComposerEmail
  } = await import("./email-composer.server-DhGnJ9F6.js");
  return await sendComposerEmail({
    ...data,
    createdBy: userId
  });
});
const runScheduleEmail_createServerFn_handler = createServerRpc({
  id: "427a57ee72019d351543c364c765132d84370e971e55bd2b682da2a4cb73846d",
  name: "runScheduleEmail",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runScheduleEmail.__executeServer(opts));
const runScheduleEmail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runScheduleEmail_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    scheduleComposerEmail
  } = await import("./email-composer.server-DhGnJ9F6.js");
  return await scheduleComposerEmail({
    ...data,
    createdBy: userId
  });
});
const cancelScheduledCampaign_createServerFn_handler = createServerRpc({
  id: "aa848c22d4b0256b0e726b89345165648e7e032382de5554eb0cae7a52fa33fd",
  name: "cancelScheduledCampaign",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => cancelScheduledCampaign.__executeServer(opts));
const cancelScheduledCampaign = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(cancelScheduledCampaign_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  await supabaseAdmin.from("composer_campaigns").update({
    status: "cancelled"
  }).eq("id", data.campaignId).eq("status", "scheduled");
  return {
    ok: true
  };
});
const runStartAbTest_createServerFn_handler = createServerRpc({
  id: "0d06a9cef7c08c845cd1904749fc41478d272582d8485abaa2dff4c4c00c78be",
  name: "runStartAbTest",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runStartAbTest.__executeServer(opts));
const runStartAbTest = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runStartAbTest_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    startAbTest
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await startAbTest({
    ...data,
    createdBy: userId
  });
});
const runPickWinner_createServerFn_handler = createServerRpc({
  id: "04540870ccc7efaa1f88b7ab4f0ccad475189a4a88265c5fba8b74186d875512",
  name: "runPickWinner",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runPickWinner.__executeServer(opts));
const runPickWinner = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runPickWinner_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    pickAbWinner
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await pickAbWinner({
    ...data,
    pickedBy: "manual"
  });
});
const runCancelAb_createServerFn_handler = createServerRpc({
  id: "ddeb190d8fa1890ee565d011fc81afeb75cca67b79bfcc2cb0a3cd759be6a251",
  name: "runCancelAb",
  filename: "src/routes/admin.email-composer.tsx"
}, (opts) => runCancelAb.__executeServer(opts));
const runCancelAb = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(runCancelAb_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    cancelAbTest
  } = await import("./email-composer-extras.server-5IcsiDVo.js");
  return await cancelAbTest(data.abTestId);
});
export {
  cancelScheduledCampaign_createServerFn_handler,
  fetchAbTests_createServerFn_handler,
  fetchAudienceCounts_createServerFn_handler,
  fetchRecentCampaigns_createServerFn_handler,
  fetchSnippets_createServerFn_handler,
  runCancelAb_createServerFn_handler,
  runDeleteSnippet_createServerFn_handler,
  runGenerateAI_createServerFn_handler,
  runGenerateSequence_createServerFn_handler,
  runLookupRecipient_createServerFn_handler,
  runPickWinner_createServerFn_handler,
  runSaveSnippet_createServerFn_handler,
  runScheduleEmail_createServerFn_handler,
  runScheduleSequence_createServerFn_handler,
  runSendEmail_createServerFn_handler,
  runStartAbTest_createServerFn_handler
};
