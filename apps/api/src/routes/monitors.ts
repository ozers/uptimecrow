import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { monitors, checkResults } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { createMonitorSchema, updateMonitorSchema } from "@uptimecrow/shared";
import { Queue } from "bullmq";
import { redis } from "../db/index.js";
import { executeTestCheck } from "../services/monitor.service.js";

export const monitorRoutes = new Hono();

const checkQueue = new Queue("monitor-checks", { connection: redis });

monitorRoutes.use("*", authMiddleware);

// List monitors
monitorRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");

  const result = await db
    .select()
    .from(monitors)
    .where(eq(monitors.orgId, orgId))
    .orderBy(desc(monitors.createdAt));

  return c.json({ monitors: result });
});

// Get single monitor
monitorRoutes.get("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [monitor] = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.orgId, orgId)))
    .limit(1);

  if (!monitor) {
    return c.json({ error: "Monitor not found" }, 404);
  }

  return c.json({ monitor });
});

// Create monitor
monitorRoutes.post("/", async (c) => {
  const { orgId } = c.get("user");
  const body = await c.req.json();
  const parsed = createMonitorSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const [monitor] = await db
    .insert(monitors)
    .values({ ...parsed.data, orgId })
    .returning();

  // Schedule repeatable check job
  await checkQueue.add(
    `check-${monitor.id}`,
    { monitorId: monitor.id },
    {
      repeat: { every: monitor.intervalSeconds * 1000 },
      jobId: `repeat-${monitor.id}`,
    },
  );

  // Run first check immediately
  await checkQueue.add(`check-${monitor.id}-initial`, { monitorId: monitor.id });

  return c.json({ monitor }, 201);
});

// Update monitor
monitorRoutes.patch("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateMonitorSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const [monitor] = await db
    .update(monitors)
    .set(parsed.data)
    .where(and(eq(monitors.id, id), eq(monitors.orgId, orgId)))
    .returning();

  if (!monitor) {
    return c.json({ error: "Monitor not found" }, 404);
  }

  return c.json({ monitor });
});

// Delete monitor
monitorRoutes.delete("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.orgId, orgId)))
    .returning({ id: monitors.id });

  if (!deleted) {
    return c.json({ error: "Monitor not found" }, 404);
  }

  // Remove repeatable job
  const repeatableJobs = await checkQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.id === `repeat-${id}`) {
      await checkQueue.removeRepeatableByKey(job.key);
    }
  }

  return c.json({ ok: true });
});

// Test a URL before creating a monitor (or for an existing one)
monitorRoutes.post("/test", async (c) => {
  const { url, expectedStatus, keyword } = await c.req.json<{
    url: string;
    expectedStatus?: number;
    keyword?: string;
  }>();

  if (!url) return c.json({ error: "URL required" }, 400);

  const result = await executeTestCheck(url, {
    timeoutMs: 10000,
    expectedStatus: expectedStatus || 200,
    keyword: keyword || undefined,
  });

  return c.json({ result });
});

// Get check history for a monitor
monitorRoutes.get("/:id/checks", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  // Verify monitor belongs to org
  const [monitor] = await db
    .select({ id: monitors.id })
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.orgId, orgId)))
    .limit(1);

  if (!monitor) {
    return c.json({ error: "Monitor not found" }, 404);
  }

  const checks = await db
    .select()
    .from(checkResults)
    .where(eq(checkResults.monitorId, id))
    .orderBy(desc(checkResults.checkedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ checks });
});
