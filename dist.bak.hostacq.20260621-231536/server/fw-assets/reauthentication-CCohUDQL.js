import { jsx, jsxs } from "react/jsx-runtime";
import { Section, Img, Text, Html, Head, Preview, Body, Container, Heading, Link, Button } from "@react-email/components";
import { U as UnsubscribeFooter } from "./_unsubscribe-footer-DXp0Y_3B.js";
const DEFAULT_BRANDING = {
  siteName: "fresh-web",
  senderName: "fresh-web",
  logoUrl: null,
  primaryColor: "#000000",
  primaryTextColor: "#ffffff",
  footerText: null
};
function buttonStyle(b) {
  return {
    backgroundColor: b.primaryColor,
    color: b.primaryTextColor,
    fontSize: "14px",
    borderRadius: "8px",
    padding: "12px 20px",
    textDecoration: "none",
    display: "inline-block"
  };
}
function BrandHeader({ branding }) {
  if (!branding.logoUrl) return null;
  return /* @__PURE__ */ jsx(Section, { style: { padding: "0 0 16px" }, children: /* @__PURE__ */ jsx(
    Img,
    {
      src: branding.logoUrl,
      alt: branding.siteName,
      height: "40",
      style: { height: "40px", width: "auto" }
    }
  ) });
}
function BrandFooter({ branding }) {
  if (!branding.footerText) return null;
  return /* @__PURE__ */ jsx(Text, { style: { fontSize: "11px", color: "#999999", margin: "24px 0 0", lineHeight: "1.5" }, children: branding.footerText });
}
const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  unsubscribeToken,
  siteName
}) => {
  const name = siteName || branding.siteName;
  return /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsxs(Preview, { children: [
      "Confirm your email for ",
      name
    ] }),
    /* @__PURE__ */ jsx(Body, { style: main$5, children: /* @__PURE__ */ jsxs(Container, { style: container$5, children: [
      /* @__PURE__ */ jsx(BrandHeader, { branding }),
      /* @__PURE__ */ jsx(Heading, { style: h1$5, children: "Confirm your email" }),
      /* @__PURE__ */ jsxs(Text, { style: text$5, children: [
        "Thanks for signing up for",
        " ",
        /* @__PURE__ */ jsx(Link, { href: siteUrl, style: link$2, children: /* @__PURE__ */ jsx("strong", { children: name }) }),
        "!"
      ] }),
      /* @__PURE__ */ jsxs(Text, { style: text$5, children: [
        "Please confirm your email address (",
        /* @__PURE__ */ jsx(Link, { href: `mailto:${recipient}`, style: link$2, children: recipient }),
        ") by clicking the button below:"
      ] }),
      /* @__PURE__ */ jsx(Button, { style: buttonStyle(branding), href: confirmationUrl, children: "Verify Email" }),
      /* @__PURE__ */ jsx(Text, { style: footer$5, children: "If you didn't create an account, you can safely ignore this email." }),
      /* @__PURE__ */ jsx(BrandFooter, { branding }),
      /* @__PURE__ */ jsx(UnsubscribeFooter, { unsubscribeToken })
    ] }) })
  ] });
};
const main$5 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$5 = { padding: "20px 25px" };
const h1$5 = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0 0 20px"
};
const text$5 = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 25px"
};
const link$2 = { color: "inherit", textDecoration: "underline" };
const footer$5 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const InviteEmail = ({
  siteUrl,
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  unsubscribeToken,
  siteName
}) => {
  const name = siteName || branding.siteName;
  return /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsxs(Preview, { children: [
      "You've been invited to join ",
      name
    ] }),
    /* @__PURE__ */ jsx(Body, { style: main$4, children: /* @__PURE__ */ jsxs(Container, { style: container$4, children: [
      /* @__PURE__ */ jsx(BrandHeader, { branding }),
      /* @__PURE__ */ jsx(Heading, { style: h1$4, children: "You've been invited" }),
      /* @__PURE__ */ jsxs(Text, { style: text$4, children: [
        "You've been invited to join",
        " ",
        /* @__PURE__ */ jsx(Link, { href: siteUrl, style: link$1, children: /* @__PURE__ */ jsx("strong", { children: name }) }),
        ". Click the button below to accept the invitation and create your account."
      ] }),
      /* @__PURE__ */ jsx(Button, { style: buttonStyle(branding), href: confirmationUrl, children: "Accept Invitation" }),
      /* @__PURE__ */ jsx(Text, { style: footer$4, children: "If you weren't expecting this invitation, you can safely ignore this email." }),
      /* @__PURE__ */ jsx(BrandFooter, { branding }),
      /* @__PURE__ */ jsx(UnsubscribeFooter, { unsubscribeToken })
    ] }) })
  ] });
};
const main$4 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$4 = { padding: "20px 25px" };
const h1$4 = { fontSize: "22px", fontWeight: "bold", color: "#000000", margin: "0 0 20px" };
const text$4 = { fontSize: "14px", color: "#55575d", lineHeight: "1.5", margin: "0 0 25px" };
const link$1 = { color: "inherit", textDecoration: "underline" };
const footer$4 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const MagicLinkEmail = ({
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  unsubscribeToken,
  siteName
}) => {
  const name = siteName || branding.siteName;
  return /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsxs(Preview, { children: [
      "Your login link for ",
      name
    ] }),
    /* @__PURE__ */ jsx(Body, { style: main$3, children: /* @__PURE__ */ jsxs(Container, { style: container$3, children: [
      /* @__PURE__ */ jsx(BrandHeader, { branding }),
      /* @__PURE__ */ jsx(Heading, { style: h1$3, children: "Your login link" }),
      /* @__PURE__ */ jsxs(Text, { style: text$3, children: [
        "Click the button below to log in to ",
        name,
        ". This link will expire shortly."
      ] }),
      /* @__PURE__ */ jsx(Button, { style: buttonStyle(branding), href: confirmationUrl, children: "Log In" }),
      /* @__PURE__ */ jsx(Text, { style: footer$3, children: "If you didn't request this link, you can safely ignore this email." }),
      /* @__PURE__ */ jsx(BrandFooter, { branding }),
      /* @__PURE__ */ jsx(UnsubscribeFooter, { unsubscribeToken })
    ] }) })
  ] });
};
const main$3 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$3 = { padding: "20px 25px" };
const h1$3 = { fontSize: "22px", fontWeight: "bold", color: "#000000", margin: "0 0 20px" };
const text$3 = { fontSize: "14px", color: "#55575d", lineHeight: "1.5", margin: "0 0 25px" };
const footer$3 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const RecoveryEmail = ({
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  unsubscribeToken,
  siteName
}) => {
  const name = siteName || branding.siteName;
  return /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsxs(Preview, { children: [
      "Reset your password for ",
      name
    ] }),
    /* @__PURE__ */ jsx(Body, { style: main$2, children: /* @__PURE__ */ jsxs(Container, { style: container$2, children: [
      /* @__PURE__ */ jsx(BrandHeader, { branding }),
      /* @__PURE__ */ jsx(Heading, { style: h1$2, children: "Reset your password" }),
      /* @__PURE__ */ jsxs(Text, { style: text$2, children: [
        "We received a request to reset your password for ",
        name,
        ". Click the button below to choose a new password."
      ] }),
      /* @__PURE__ */ jsx(Button, { style: buttonStyle(branding), href: confirmationUrl, children: "Reset Password" }),
      /* @__PURE__ */ jsx(Text, { style: footer$2, children: "If you didn't request a password reset, you can safely ignore this email. Your password will not be changed." }),
      /* @__PURE__ */ jsx(BrandFooter, { branding }),
      /* @__PURE__ */ jsx(UnsubscribeFooter, { unsubscribeToken })
    ] }) })
  ] });
};
const main$2 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$2 = { padding: "20px 25px" };
const h1$2 = { fontSize: "22px", fontWeight: "bold", color: "#000000", margin: "0 0 20px" };
const text$2 = { fontSize: "14px", color: "#55575d", lineHeight: "1.5", margin: "0 0 25px" };
const footer$2 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  unsubscribeToken,
  siteName
}) => {
  const name = siteName || branding.siteName;
  return /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsxs(Preview, { children: [
      "Confirm your email change for ",
      name
    ] }),
    /* @__PURE__ */ jsx(Body, { style: main$1, children: /* @__PURE__ */ jsxs(Container, { style: container$1, children: [
      /* @__PURE__ */ jsx(BrandHeader, { branding }),
      /* @__PURE__ */ jsx(Heading, { style: h1$1, children: "Confirm your email change" }),
      /* @__PURE__ */ jsxs(Text, { style: text$1, children: [
        "You requested to change your email address for ",
        name,
        " from",
        " ",
        /* @__PURE__ */ jsx(Link, { href: `mailto:${oldEmail}`, style: link, children: oldEmail }),
        " ",
        "to",
        " ",
        /* @__PURE__ */ jsx(Link, { href: `mailto:${newEmail}`, style: link, children: newEmail }),
        "."
      ] }),
      /* @__PURE__ */ jsx(Text, { style: text$1, children: "Click the button below to confirm this change:" }),
      /* @__PURE__ */ jsx(Button, { style: buttonStyle(branding), href: confirmationUrl, children: "Confirm Email Change" }),
      /* @__PURE__ */ jsx(Text, { style: footer$1, children: "If you didn't request this change, please secure your account immediately." }),
      /* @__PURE__ */ jsx(BrandFooter, { branding }),
      /* @__PURE__ */ jsx(UnsubscribeFooter, { unsubscribeToken })
    ] }) })
  ] });
};
const main$1 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$1 = { padding: "20px 25px" };
const h1$1 = { fontSize: "22px", fontWeight: "bold", color: "#000000", margin: "0 0 20px" };
const text$1 = { fontSize: "14px", color: "#55575d", lineHeight: "1.5", margin: "0 0 25px" };
const link = { color: "inherit", textDecoration: "underline" };
const footer$1 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const ReauthenticationEmail = ({
  token,
  branding = DEFAULT_BRANDING,
  unsubscribeToken
}) => /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsx(Head, {}),
  /* @__PURE__ */ jsx(Preview, { children: "Your verification code" }),
  /* @__PURE__ */ jsx(Body, { style: main, children: /* @__PURE__ */ jsxs(Container, { style: container, children: [
    /* @__PURE__ */ jsx(BrandHeader, { branding }),
    /* @__PURE__ */ jsx(Heading, { style: h1, children: "Confirm reauthentication" }),
    /* @__PURE__ */ jsx(Text, { style: text, children: "Use the code below to confirm your identity:" }),
    /* @__PURE__ */ jsx(Text, { style: { ...codeStyle, color: branding.primaryColor }, children: token }),
    /* @__PURE__ */ jsx(Text, { style: footer, children: "This code will expire shortly. If you didn't request this, you can safely ignore this email." }),
    /* @__PURE__ */ jsx(BrandFooter, { branding })
  ] }) })
] });
const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "20px 25px" };
const h1 = { fontSize: "22px", fontWeight: "bold", color: "#000000", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#55575d", lineHeight: "1.5", margin: "0 0 25px" };
const codeStyle = {
  fontFamily: "Courier, monospace",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 30px"
};
const footer = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
export {
  EmailChangeEmail as E,
  InviteEmail as I,
  MagicLinkEmail as M,
  ReauthenticationEmail as R,
  SignupEmail as S,
  RecoveryEmail as a
};
