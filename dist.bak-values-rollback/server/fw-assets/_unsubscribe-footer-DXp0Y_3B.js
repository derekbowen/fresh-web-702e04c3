import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Section, Hr, Text } from "@react-email/components";
const UNSUB_BASE = "https://www.poolrentalnearme.com/email/unsubscribe";
const UnsubscribeFooter = ({ unsubscribeToken }) => {
  const unsubUrl = unsubscribeToken ? `${UNSUB_BASE}?token=${unsubscribeToken}` : null;
  return /* @__PURE__ */ jsxs(Section, { children: [
    /* @__PURE__ */ jsx(Hr, { style: hr }),
    /* @__PURE__ */ jsxs(Text, { style: text, children: [
      "Pool Rental Near Me · 10,000 Solutions LLC",
      /* @__PURE__ */ jsx("br", {}),
      "2261 Market Street #5429, San Francisco, CA 94114",
      unsubUrl && /* @__PURE__ */ jsxs(Fragment, { children: [
        " · ",
        /* @__PURE__ */ jsx("a", { href: unsubUrl, style: link, children: "Unsubscribe" })
      ] })
    ] })
  ] });
};
const hr = { borderColor: "#e5e7eb", margin: "32px 0 16px" };
const text = {
  fontSize: "11px",
  color: "#9ca3af",
  lineHeight: "1.5",
  margin: "0",
  textAlign: "center"
};
const link = { color: "#9ca3af", textDecoration: "underline" };
export {
  UnsubscribeFooter as U
};
