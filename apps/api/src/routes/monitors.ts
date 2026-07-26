import { Hono } from "hono";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { monitors, checkResults, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { createMonitorSchema, updateMonitorSchema, PLAN_LIMITS } from "@uptimecrow/shared";
import { Queue } from "bullmq";
import { redis } from "../db/index.js";
import { executeTestCheck } from "../services/monitor.service.js";
import { track } from "../utils/beacon.js";

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

  // Enforce plan limits
  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const limits = PLAN_LIMITS[org?.plan ?? "free"];

  const [{ total }] = await db
    .select({ total: count() })
    .from(monitors)
    .where(and(eq(monitors.orgId, orgId), eq(monitors.isActive, true)));

  if (Number(total) >= limits.monitors) {
    return c.json(
      { error: `Monitor limit reached. Your plan allows ${limits.monitors} monitors.` },
      403,
    );
  }

  if (parsed.data.intervalSeconds && parsed.data.intervalSeconds < limits.minInterval) {
    return c.json(
      { error: `Minimum check interval for your plan is ${limits.minInterval}s.` },
      403,
    );
  }

  // Keyword monitors match text in the response body, which HEAD never returns.
  // The schema already rejects HEAD+keyword, but coerce defensively so a keyword
  // monitor can never be persisted with HEAD.
  const createData = { ...parsed.data };
  if (createData.type === "keyword") createData.method = "GET";

  const [monitor] = await db
    .insert(monitors)
    .values({ ...createData, orgId })
    .returning();

  track("monitor_created", { type: monitor.type, plan: org?.plan ?? "free" }, c.get("user").sub);

  // Remove any stale repeatable jobs for this monitor before scheduling
  const existingJobs = await checkQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    if (job.id === `repeat-${monitor.id}`) {
      await checkQueue.removeRepeatableByKey(job.key);
    }
  }

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

  // The Zod schema transforms empty strings to `undefined`, which Drizzle
  // would skip. When the user explicitly clears an optional field in the UI
  // we need to write NULL instead — otherwise the old value sticks around.
  const updateData: Record<string, unknown> = { ...parsed.data };
  if ("keyword" in body && !body.keyword) {
    updateData.keyword = null;
  }

  // Guard against a HEAD method landing on a keyword monitor. The refine only
  // fires when type + method arrive together; a request that flips only the
  // method needs the existing type consulted. HEAD has no body to keyword-match.
  if (updateData.method === "HEAD") {
    let effectiveType = parsed.data.type;
    if (effectiveType === undefined) {
      const [existing] = await db
        .select({ type: monitors.type })
        .from(monitors)
        .where(and(eq(monitors.id, id), eq(monitors.orgId, orgId)))
        .limit(1);
      effectiveType = existing?.type;
    }
    if (effectiveType === "keyword") {
      return c.json(
        { error: "Keyword monitors must use GET — HEAD returns no body to match." },
        400,
      );
    }
  }

  const [monitor] = await db
    .update(monitors)
    .set(updateData)
    .where(and(eq(monitors.id, id), eq(monitors.orgId, orgId)))
    .returning();

  if (!monitor) {
    return c.json({ error: "Monitor not found" }, 404);
  }

  // Enforce min interval on update
  if (parsed.data.intervalSeconds !== undefined) {
    const [org] = await db
      .select({ plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    const limits = PLAN_LIMITS[org?.plan ?? "free"];
    if (parsed.data.intervalSeconds < limits.minInterval) {
      return c.json(
        { error: `Minimum check interval for your plan is ${limits.minInterval}s.` },
        403,
      );
    }
  }

  // If interval changed, reschedule repeatable job
  if (parsed.data.intervalSeconds !== undefined) {
    const repeatableJobs = await checkQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.id === `repeat-${id}`) {
        await checkQueue.removeRepeatableByKey(job.key);
      }
    }
    await checkQueue.add(
      `check-${monitor.id}`,
      { monitorId: monitor.id },
      {
        repeat: { every: monitor.intervalSeconds * 1000 },
        jobId: `repeat-${monitor.id}`,
      },
    );
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
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") || "50", 10) || 50));
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0", 10) || 0);

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
