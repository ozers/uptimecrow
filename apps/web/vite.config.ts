import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.NODE_ENV === "production"
      ? [
          sentryVitePlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:3000",
        changeOrigin: true,
      },
      "/status": {
        target: process.env.API_URL || "http://localhost:3000",
        changeOrigin: true,
      },
      "/badge": {
        target: process.env.API_URL || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
