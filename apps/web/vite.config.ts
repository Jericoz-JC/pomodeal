import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  // `convex dev` writes CONVEX_URL to .env.local; `convex deploy --cmd-url-env-var-name` sets VITE_CONVEX_URL in CI.
  const env = { ...loadEnv(mode, "../..", ""), ...process.env };
  const convexUrl = env.VITE_CONVEX_URL || env.CONVEX_URL || "";
  return {
  envDir: "../..",
  define: { "import.meta.env.VITE_CONVEX_URL": JSON.stringify(convexUrl) },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      // our own service worker (src/sw.ts): the precache as before, plus the push and notificationclick handlers
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      includeAssets: ["icon.svg", "apple-touch-icon.png", "robots.txt"],
      manifest: {
        name: "Pomodeal",
        short_name: "Pomodeal",
        description: "A study timer that negotiates with you.",
        theme_color: "#EDEFE9",
        background_color: "#EDEFE9",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      injectManifest: { globPatterns: ["**/*.{js,css,html,svg,png,woff2}"] },
    }),
  ],
};
});
