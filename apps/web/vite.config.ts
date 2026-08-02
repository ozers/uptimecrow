import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Resolve the workspace package to its source, not packages/shared/dist.
      // The package's "types" already point at src, so a stale dist silently
      // shipped plan limits and pricing copy that typecheck could not catch.
      "@uptimecrow/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    port: Number(process.env.PORT) || 5173,
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
