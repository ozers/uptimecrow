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
  // Cap the window so a single request can't force an unbounded table scan.
  const days = Math.min(365, Math.max(1, parseInt(c.req.query("days") || "30", 10) || 30));
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
          p50: sql<number>`percentile_cont(0.50) within group (order by ${checkResults.responseMs})`,
          p95: sql<number>`percentile_cont(0.95) within group (order by ${checkResults.responseMs})`,
          p99: sql<number>`percentile_cont(0.99) within group (order by ${checkResults.responseMs})`,
        })
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitor.id),
            sql`${checkResults.checkedAt} > ${since.toISOString()}`,
            sql`${checkResults.responseMs} is not null`,
          ),
        );

      const total = Number(stats?.total || 0);
      const up = Number(stats?.up || 0);
      const uptimePercent = total > 0 ? ((up / total) * 100).toFixed(4) : null;
      const num = (v: unknown) => (v == null ? null : Math.round(Number(v)));

      // Per-region breakdown
      const regions = await db
        .select({
          region: checkResults.region,
          total: sql<number>`count(*)`,
          up: sql<number>`count(*) filter (where ${checkResults.status} = 'up')`,
          avgResponseMs: sql<number>`avg(${checkResults.responseMs})`,
          p95: sql<number>`percentile_cont(0.95) within group (order by ${checkResults.responseMs})`,
        })
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitor.id),
            sql`${checkResults.checkedAt} > ${since.toISOString()}`,
            sql`${checkResults.responseMs} is not null`,
          ),
        )
        .groupBy(checkResults.region);

      return {
        monitorId: monitor.id,
        monitorName: monitor.name,
        uptimePercent,
        totalChecks: total,
        avgResponseMs: num(stats?.avgResponseMs),
        p50ResponseMs: num(stats?.p50),
        p95ResponseMs: num(stats?.p95),
        p99ResponseMs: num(stats?.p99),
        regions: regions.map((r) => {
          const rTotal = Number(r.total || 0);
          const rUp = Number(r.up || 0);
          return {
            region: r.region,
            totalChecks: rTotal,
            uptimePercent: rTotal > 0 ? ((rUp / rTotal) * 100).toFixed(4) : null,
            avgResponseMs: num(r.avgResponseMs),
            p95ResponseMs: num(r.p95),
          };
        }),
      };
    }),
  );

  return c.json({ uptime: uptimeData, period: { days, since: since.toISOString() } });
});
