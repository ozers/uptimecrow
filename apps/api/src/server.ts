import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { authRoutes } from "./routes/auth.js";
import { monitorRoutes } from "./routes/monitors.js";
import { incidentRoutes } from "./routes/incidents.js";
import { statusPageRoutes } from "./routes/status-pages.js";
import { subscriberRoutes } from "./routes/subscribers.js";
import { publicRoutes } from "./routes/public.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { settingsRoutes } from "./routes/settings.js";
import { billingRoutes } from "./routes/billing.js";
import { maintenanceRoutes } from "./routes/maintenance.js";
import { apiKeyRoutes } from "./routes/api-keys.js";
import { getRenderedPage } from "./services/static-gen.service.js";
import { authRateLimit, apiRateLimit, publicRateLimit } from "./middleware/rate-limit.js";
import { securityHeaders } from "./middleware/security.js";
import { logger } from "./utils/logger.js";

const app = new Hono();

app.use("*", honoLogger());
app.use("*", securityHeaders);
app.use("*", cors({
  origin: process.env.NODE_ENV === "production"
    ? [process.env.APP_URL || ""]
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Custom domain routing — check if Host header matches a custom domain
app.use("*", async (c, next) => {
  const host = c.req.header("host") || "";
  // Skip for localhost, API routes, and known paths
  if (
    host.includes("localhost") ||
    host.includes("uptimecrow") ||
    c.req.path.startsWith("/api") ||
    c.req.path.startsWith("/status") ||
    c.req.path.startsWith("/health") ||
    c.req.path.startsWith("/s/") ||
    c.req.path.startsWith("/badge")
  ) {
    return next();
  }

  // Check if this host is a custom domain for a status page
  const { eq: eqFn } = await import("drizzle-orm");
  const { db: database } = await import("./db/index.js");
  const { statusPages: sp } = await import("./db/schema.js");

  const [page] = await database
    .select({ slug: sp.slug })
    .from(sp)
    .where(eqFn(sp.customDomain, host))
    .limit(1);

  if (page) {
    // Rewrite to the public status page route
    const url = new URL(c.req.url);
    url.pathname = `/status/${page.slug}${url.pathname === "/" ? "" : url.pathname}`;
    const newReq = new Request(url.toString(), c.req.raw);
    return app.fetch(newReq);
  }

  return next();
});

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
app.use("/status/*", publicRateLimit);
app.route("/status", publicRoutes);

// Auth routes (strict rate limit on login/register, not on /me)
app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/register", authRateLimit);
app.use("/api/auth/forgot-password", authRateLimit);
app.route("/api/auth", authRoutes);

// Protected API routes
app.use("/api/*", apiRateLimit);
app.route("/api/monitors", monitorRoutes);
app.route("/api/incidents", incidentRoutes);
app.route("/api/status-pages", statusPageRoutes);
app.route("/api/subscribers", subscriberRoutes);
app.route("/api/analytics", analyticsRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/billing", billingRoutes);
app.route("/api/maintenance-windows", maintenanceRoutes);
app.route("/api/api-keys", apiKeyRoutes);

export async function startServer() {
  const port = parseInt(process.env.PORT || "3000", 10);

  logger.info(`[Server] Listening on port ${port}`);

  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port });
}

export { app };
