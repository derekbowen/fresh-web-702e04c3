import { jsx, jsxs } from "react/jsx-runtime";
function PageErrorFallback({
  error
}) {
  return /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-3xl p-6", children: /* @__PURE__ */ jsxs("div", { className: "border border-red-300 bg-red-50 rounded-lg p-4", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-red-800", children: "Email Composer hit an error" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-700", children: error?.message || String(error) }),
    /* @__PURE__ */ jsx("pre", { className: "mt-3 max-h-64 overflow-auto rounded bg-white p-2 text-[11px] text-red-900 whitespace-pre-wrap", children: error?.stack || "" }),
    /* @__PURE__ */ jsx("button", { onClick: () => window.location.reload(), className: "mt-3 px-3 py-1.5 rounded bg-red-600 text-white text-sm", children: "Reload" })
  ] }) });
}
export {
  PageErrorFallback as errorComponent
};
