import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
const SplitNotFoundComponent = () => /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 py-20 text-center", children: [
  /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "City not found" }),
  /* @__PURE__ */ jsxs("p", { className: "mt-3 text-muted-foreground", children: [
    "Try the main",
    " ",
    /* @__PURE__ */ jsx(Link, { to: "/p/peerspace-vs-pool-rental-near-me", className: "text-primary underline", children: "Peerspace vs Pool Rental Near Me comparison" }),
    " ",
    "instead."
  ] })
] });
export {
  SplitNotFoundComponent as notFoundComponent
};
