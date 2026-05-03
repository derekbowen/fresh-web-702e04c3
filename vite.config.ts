import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

/**
 * Vanilla TanStack Start config — no Lovable plugin, no Cloudflare target.
 * Builds for Node.js so the app runs on a Hostinger VPS via PM2 + Nginx.
 *
 * Replaces the prior `@lovable.dev/vite-tanstack-config` wrapper, which
 * defaulted to Cloudflare Workers. Output now goes to `.output/server/index.mjs`
 * (Nitro convention) and runs as a standard Node HTTP server.
 */
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ target: "node-server" }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
});
