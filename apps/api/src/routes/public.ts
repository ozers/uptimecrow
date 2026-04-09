import { Hono } from "hono";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  statusPages,
  monitors,
  incidents,
  incidentUpdates,
  subscribers,
  checkResults,
} from "../db/schema.js";
import { subscribeSchema } from "@uptimecrow/shared";
import { Queue } from "bullmq";
import { redis } from "../db/index.js";
import { renderStatusHtml } from "../services/static-gen.service.js";

export const publicRoutes = new Hono();

const notifyQueue = new Queue("notifications", { connection: redis });

// Get status page data
publicRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [page] = await db
    .select()
    .from(statusPages)
    .where(and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true)))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  // Get monitors for this org
  const orgMonitors = await db
    .select({
      id: monitors.id,
      name: monitors.name,
      status: monitors.status,
      lastCheckedAt: monitors.lastCheckedAt,
      lastResponseMs: monitors.lastResponseMs,
    })
    .from(monitors)
    .where(and(eq(monitors.orgId, page.orgId), eq(monitors.isActive, true)));

  // Get active incidents
  const activeIncidents = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.statusPageId, page.id),
        sql`${incidents.status} != 'resolved'`,
      ),
    )
    .orderBy(desc(incidents.startedAt));

  const data = {
    statusPage: {
      name: page.name,
      slug: page.slug,
      logoUrl: page.logoUrl,
      brandColor: page.brandColor,
    },
    monitors: orgMonitors,
    activeIncidents,
  };

  // Return HTML for browser requests, JSON for API requests
  const accept = c.req.header("Accept") || "";
  if (accept.includes("text/html")) {
    const staticData = {
      generatedAt: new Date().toISOString(),
      statusPage: data.statusPage,
      overallStatus: (orgMonitors.some((m) => m.status === "down")
        ? "major_outage"
        : orgMonitors.some((m) => m.status === "degraded")
          ? "degraded"
          : "operational") as "operational" | "degraded" | "major_outage",
      monitors: orgMonitors.map((m) => ({
        name: m.name,
        status: m.status,
        lastCheckedAt: m.lastCheckedAt?.toISOString() ?? null,
        uptimePercent: null,
      })),
      activeIncidents: [],
    };
    const html = renderStatusHtml(staticData);
    c.header("Content-Type", "text/html; charset=UTF-8");
    return c.body(html);
  }

  return c.json(data);
});

// Get incident history
publicRoutes.get("/:slug/incidents", async (c) => {
  const slug = c.req.param("slug");
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true)))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  const result = await db
    .select()
    .from(incidents)
    .where(eq(incidents.statusPageId, page.id))
    .orderBy(desc(incidents.startedAt))
    .limit(limit)
    .offset(offset);

  // Get updates for each incident
  const incidentsWithUpdates = await Promise.all(
    result.map(async (incident) => {
      const updates = await db
        .select()
        .from(incidentUpdates)
        .where(eq(incidentUpdates.incidentId, incident.id))
        .orderBy(desc(incidentUpdates.createdAt));
      return { ...incident, updates };
    }),
  );

  return c.json({ incidents: incidentsWithUpdates });
});

// Subscribe to status page
publicRoutes.post("/:slug/subscribe", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true)))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  // Check if already subscribed
  const existing = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.statusPageId, page.id),
        eq(subscribers.email, parsed.data.email),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return c.json({ message: "Already subscribed" });
  }

  const [newSub] = await db
    .insert(subscribers)
    .values({
      statusPageId: page.id,
      email: parsed.data.email,
    })
    .returning();

  // Queue verification email
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  await notifyQueue.add("verification", {
    type: "verification",
    statusPageId: page.id,
    email: parsed.data.email,
    verifyUrl: `${appUrl}/status/verify/${newSub.unsubscribeToken}`,
  });

  return c.json({ message: "Subscribed. Check your email to verify." }, 201);
});

// Verify subscription
publicRoutes.get("/verify/:token", async (c) => {
  const token = c.req.param("token");

  const [subscriber] = await db
    .update(subscribers)
    .set({ isVerified: true })
    .where(eq(subscribers.unsubscribeToken, token))
    .returning({ id: subscribers.id });

  if (!subscriber) {
    return c.json({ error: "Invalid verification link" }, 404);
  }

  return c.json({ message: "Email verified successfully" });
});

// Unsubscribe
publicRoutes.get("/unsubscribe/:token", async (c) => {
  const token = c.req.param("token");

  const [subscriber] = await db
    .delete(subscribers)
    .where(eq(subscribers.unsubscribeToken, token))
    .returning({ id: subscribers.id });

  if (!subscriber) {
    return c.json({ error: "Invalid unsubscribe link" }, 404);
  }

  return c.json({ message: "Unsubscribed successfully" });
});

// Uptime badge SVG
publicRoutes.get("/badge/:slug", async (c) => {
  const rawSlug = c.req.param("slug");
  const slug = rawSlug.endsWith(".svg") ? rawSlug.slice(0, -4) : rawSlug;

  const [page] = await db
    .select({ id: statusPages.id, orgId: statusPages.orgId })
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .limit(1);

  if (!page) {
    return c.text("Not found", 404);
  }

  // Calculate uptime from last 30 days of check results
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orgMonitorIds = await db
    .select({ id: monitors.id })
    .from(monitors)
    .where(and(eq(monitors.orgId, page.orgId), eq(monitors.isActive, true)));

  if (orgMonitorIds.length === 0) {
    return svgBadge(c, "uptime", "N/A", "#999");
  }

  const monitorIds = orgMonitorIds.map((m) => m.id);

  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      up: sql<number>`count(*) filter (where ${checkResults.status} = 'up')`,
    })
    .from(checkResults)
    .where(
      and(
        sql`${checkResults.monitorId} = ANY(${monitorIds})`,
        sql`${checkResults.checkedAt} > ${thirtyDaysAgo.toISOString()}`,
      ),
    );

  const total = Number(stats[0]?.total || 0);
  const up = Number(stats[0]?.up || 0);
  const uptime = total > 0 ? ((up / total) * 100).toFixed(2) : "N/A";

  const color = uptime === "N/A" ? "#999" : parseFloat(uptime) >= 99.9 ? "#00e676" : parseFloat(uptime) >= 99 ? "#ffab40" : "#ff5252";

  return svgBadge(c, "uptime", `${uptime}%`, color);
});

function svgBadge(c: any, label: string, value: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20" viewBox="0 0 140 20">
  <rect width="60" height="20" rx="3" fill="#555"/>
  <rect x="60" width="80" height="20" rx="3" fill="${color}"/>
  <rect width="140" height="20" rx="3" fill="url(#g)"/>
  <defs><linearGradient id="g" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient></defs>
  <text x="30" y="14" fill="#fff" text-anchor="middle" font-family="Verdana,sans-serif" font-size="11">${label}</text>
  <text x="100" y="14" fill="#fff" text-anchor="middle" font-family="Verdana,sans-serif" font-size="11" font-weight="bold">${value}</text>
</svg>`;

  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", "public, max-age=300");
  return c.body(svg);
}
