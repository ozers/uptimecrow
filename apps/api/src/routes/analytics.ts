import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { monitors, checkResults } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

export const analyticsRoutes = new Hono();

analyticsRoutes.use("*", authMiddleware);

// Uptime percentage by monitor
analyticsRoutes.get("/uptime", async (c) => {
  const { orgId } = c.get("user");
  const days = parseInt(c.req.query("days") || "30", 10);
  const monitorId = c.req.query("monitorId");

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orgMonitors = await db
    .select({ id: monitors.id, name: monitors.name })
    .from(monitors)
    .where(
      monitorId
        ? and(eq(monitors.id, monitorId), eq(monitors.orgId, orgId))
        : eq(monitors.orgId, orgId),
    );

  const uptimeData = await Promise.all(
    orgMonitors.map(async (monitor) => {
      const [stats] = await db
        .select({
          total: sql<number>`count(*)`,
          up: sql<number>`count(*) filter (where ${checkResults.status} = 'up')`,
          avgResponseMs: sql<number>`avg(${checkResults.responseMs})`,
        })
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitor.id),
            sql`${checkResults.checkedAt} > ${since}`,
          ),
        );

      const total = Number(stats?.total || 0);
      const up = Number(stats?.up || 0);
      const uptimePercent = total > 0 ? ((up / total) * 100).toFixed(4) : null;

      return {
        monitorId: monitor.id,
        monitorName: monitor.name,
        uptimePercent,
        totalChecks: total,
        avgResponseMs: stats?.avgResponseMs ? Math.round(Number(stats.avgResponseMs)) : null,
      };
    }),
  );

  return c.json({ uptime: uptimeData, period: { days, since: since.toISOString() } });
});
