// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    importProtection: {
      behavior: "error",
      client: {
        // Allow `.functions.ts(x)` files under src/server to be imported from
        // client code — they are transformed into RPC stubs at build time.
        excludeFiles: [
          "**/server/*.functions.ts",
          "**/server/*.functions.tsx",
          "**/server/**/*.functions.ts",
          "**/server/**/*.functions.tsx",
        ],
      },
    },
  },
  vite: {
    build: {
      // Serve built JS/CSS under /fw-assets/ instead of the default /assets/
      // so the EC2 nginx reverse proxy can route this app's static assets
      // without colliding with other Lovable apps on the same domain.
      assetsDir: "fw-assets",
    },
  },
});
