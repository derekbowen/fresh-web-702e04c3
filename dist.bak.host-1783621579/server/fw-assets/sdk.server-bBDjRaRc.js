import sharetribeSdk from "sharetribe-flex-sdk";
function testCreds() {
  const clientId = process.env.SHARETRIBE_TEST_CLIENT_ID;
  const clientSecret = process.env.SHARETRIBE_TEST_CLIENT_SECRET;
  if (!clientId) throw new Error("SHARETRIBE_TEST_CLIENT_ID is not configured");
  return { clientId, clientSecret };
}
function getTestSdkTrusted() {
  const { clientId, clientSecret } = testCreds();
  if (!clientSecret) {
    throw new Error("SHARETRIBE_TEST_CLIENT_SECRET is not configured");
  }
  return sharetribeSdk.createInstance({
    clientId,
    clientSecret,
    tokenStore: sharetribeSdk.tokenStore.memoryStore()
  });
}
function sdkErrorMessage(err) {
  if (!err || typeof err !== "object") return "Unexpected error";
  const e = err;
  const apiMsg = e.data?.errors?.[0]?.title;
  const code = e.data?.errors?.[0]?.code;
  if (apiMsg) return code ? `${apiMsg} (${code})` : apiMsg;
  return e.message ?? `Sharetribe SDK error${e.status ? ` [${e.status}]` : ""}`;
}
export {
  getTestSdkTrusted,
  sdkErrorMessage
};
