import { Hono, type Context } from "hono";
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
import { docsRoutes } from "./routes/docs.js";
import heartbeatRoutes from "./routes/heartbeats.js";
import { mcpRoutes } from "./routes/mcp.js";
import { teamRoutes } from "./routes/team.js";
import { toolsRoutes } from "./routes/tools.js";
import { getRenderedPage } from "./services/static-gen.service.js";
import { db, redis } from "./db/index.js";
import { heartbeats } from "./db/schema.js";
import { eq, sql } from "drizzle-orm";
import { authRateLimit, apiRateLimit, publicRateLimit, toolsRateLimit } from "./middleware/rate-limit.js";
import { securityHeaders } from "./middleware/security.js";
import { customDomainRouter } from "./middleware/custom-domain.js";
import { logger } from "./utils/logger.js";

const app = new Hono();

app.use("*", honoLogger());
app.use("*", securityHeaders);
// CORS allowlist — production requires APP_URL to be set; we never default to
// "" because hono/cors treats an empty allowlist entry as "match any origin"
// while still echoing credentials, which is a critical misconfiguration.
const corsOrigins: string[] = (() => {
  if (process.env.NODE_ENV === "production") {
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      throw new Error("APP_URL environment variable is required in production for CORS");
    }
    return [appUrl];
  }
  return ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];
})();
app.use("*", cors({
  origin: corsOrigins,
  credentials: true,
}));

// Deep health check — actually verifies the dependencies the app needs, so a
// load balancer doesn't route traffic to a pod whose DB or Redis is down.
// Returns 503 (not 200) when a dependency is unreachable.
async function healthCheck(c: Context) {
  const checks = { db: false, redis: false };
  try {
    await db.execute(sql`select 1`);
    checks.db = true;
  } catch {
    // db down → reported below
  }
  try {
    await redis.ping();
    checks.redis = true;
  } catch {
    // redis down → reported below
  }
  const ok = checks.db && checks.redis;
  return c.json(
    { status: ok ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    ok ? 200 : 503,
  );
}
app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

// API docs — unauthenticated, no rate limit; pure static content.
app.route("/api", docsRoutes);

// Custom domain routing — rewrite requests whose Host header matches a
// registered custom domain to the pre-rendered status page. Moved into its
// own middleware so the hostname validation + cache logic is testable.
app.use("*", customDomainRouter(app));

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

// Heartbeat ping endpoint — public, no auth
app.get("/hb/:slug", publicRateLimit, async (c) => {
  const slug = c.req.param("slug") as string;
  const [hb] = await db
    .select({ id: heartbeats.id, isActive: heartbeats.isActive })
    .from(heartbeats)
    .where(eq(heartbeats.slug, slug));
  if (!hb || !hb.isActive) return c.text("Not found", 404);
  await db
    .update(heartbeats)
    .set({ lastPingAt: new Date(), status: "healthy" })
    .where(eq(heartbeats.id, hb.id));
  return c.text("OK", 200);
});

// Public API routes (no auth)
app.use("/status/*", publicRateLimit);
app.route("/status", publicRoutes);

// Free public tools — strict rate limit, no auth. Used by SEO landing
// pages at /tools/* to drive organic traffic and showcase capabilities.
app.use("/api/tools/*", toolsRateLimit);
app.route("/api/tools", toolsRoutes);

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
app.route("/api/heartbeats", heartbeatRoutes);
app.route("/api/mcp", mcpRoutes);
app.route("/api/team", teamRoutes);

export async function startServer() {
  const port = parseInt(process.env.PORT || "3000", 10);

  logger.info(`[Server] Listening on port ${port}`);

  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port });
}

export { app };
