import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth.js";
import { monitorRoutes } from "./routes/monitors.js";
import { incidentRoutes } from "./routes/incidents.js";
import { statusPageRoutes } from "./routes/status-pages.js";
import { subscriberRoutes } from "./routes/subscribers.js";
import { publicRoutes } from "./routes/public.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { getRenderedPage } from "./services/static-gen.service.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: process.env.NODE_ENV === "production"
    ? [process.env.APP_URL || ""]
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Pre-rendered static status pages (HTML + JSON)
app.get("/s/:slug", (c) => {
  const slug = c.req.param("slug");
  const rendered = getRenderedPage(slug);
  if (!rendered) {
    return c.text("Status page not found", 404);
  }
  const format = c.req.query("format");
  if (format === "json") {
    return c.json(rendered.json);
  }
  c.header("Content-Type", "text/html; charset=UTF-8");
  c.header("Cache-Control", "public, max-age=30");
  return c.body(rendered.html);
});

// Public API routes (no auth)
app.route("/status", publicRoutes);

// Auth routes
app.route("/api/auth", authRoutes);

// Protected API routes
app.route("/api/monitors", monitorRoutes);
app.route("/api/incidents", incidentRoutes);
app.route("/api/status-pages", statusPageRoutes);
app.route("/api/subscribers", subscriberRoutes);
app.route("/api/analytics", analyticsRoutes);

export async function startServer() {
  const port = parseInt(process.env.PORT || "3000", 10);

  console.log(`[Server] Listening on port ${port}`);

  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port });
}

export { app };
