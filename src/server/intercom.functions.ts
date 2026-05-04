import { createServerFn } from "@tanstack/react-start";

export const getIntercomAppId = createServerFn({ method: "GET" }).handler(async () => {
  return { appId: process.env.INTERCOM_APP_ID ?? "" };
});
