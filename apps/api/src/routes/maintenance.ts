import { Hono } from "hono";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { makeQueue } from "../utils/queues.js";
import {
  maintenanceWindows,
  maintenanceWindowMonitors,
  statusPages,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  createMaintenanceWindowSchema,
  updateMaintenanceWindowSchema,
} from "@uptimecrow/shared";
import { logger } from "../utils/logger.js";

export const maintenanceRoutes = new Hono();
maintenanceRoutes.use("*", authMiddleware);

const generateQueue = makeQueue("status-page-generate");

async function enqueueRegen(statusPageId: string) {
  await generateQueue.add("regenerate", { statusPageId });
}

// List maintenance windows for the current org
maintenanceRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");
  const rows = await db
    .select()
    .from(maintenanceWindows)
    .where(eq(maintenanceWindows.orgId, orgId))
    .orderBy(desc(maintenanceWindows.scheduledStart));

  // Attach monitor ids per window
  const ids = rows.map((r) => r.id);
  const links = ids.length > 0
    ? await db
        .select()
        .from(maintenanceWindowMonitors)
        .where(inArray(maintenanceWindowMonitors.maintenanceWindowId, ids))
    : [];
  const byWindow = new Map<string, string[]>();
  for (const link of links) {
    const arr = byWindow.get(link.maintenanceWindowId) ?? [];
    arr.push(link.monitorId);
    byWindow.set(link.maintenanceWindowId, arr);
  }

  return c.json({
    maintenanceWindows: rows.map((r) => ({
      ...r,
      monitorIds: byWindow.get(r.id) ?? [],
    })),
  });
});

// Create a new maintenance window
maintenanceRoutes.post("/", async (c) => {
  const { orgId } = c.get("user");
  const body = await c.req.json();
  const parsed = createMaintenanceWindowSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", issues: parsed.error.issues }, 400);
  }

  // Verify the status page belongs to the org
  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.id, parsed.data.statusPageId), eq(statusPages.orgId, orgId)))
    .limit(1);
  if (!page) return c.json({ error: "Status page not found" }, 404);

  const [inserted] = await db
    .insert(maintenanceWindows)
    .values({
      orgId,
      statusPageId: parsed.data.statusPageId,
      title: parsed.data.title,
      body: parsed.data.body ?? null,
      scheduledStart: new Date(parsed.data.scheduledStart),
      scheduledEnd: new Date(parsed.data.scheduledEnd),
      recurrence: parsed.data.recurrence ?? null,
    })
    .returning();

  if (parsed.data.monitorIds.length > 0) {
    await db.insert(maintenanceWindowMonitors).values(
      parsed.data.monitorIds.map((monitorId) => ({
        maintenanceWindowId: inserted.id,
        monitorId,
      })),
    );
  }

  await enqueueRegen(parsed.data.statusPageId);
  logger.info({ id: inserted.id, orgId }, "[Maintenance] Window created");

  return c.json({ maintenanceWindow: { ...inserted, monitorIds: parsed.data.monitorIds } }, 201);
});

// Update (including cancel)
maintenanceRoutes.patch("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateMaintenanceWindowSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", issues: parsed.error.issues }, 400);
  }

  const [existing] = await db
    .select()
    .from(maintenanceWindows)
    .where(and(eq(maintenanceWindows.id, id), eq(maintenanceWindows.orgId, orgId)))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const patch: Partial<typeof maintenanceWindows.$inferInsert> = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.body !== undefined) patch.body = parsed.data.body ?? null;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.scheduledStart !== undefined) patch.scheduledStart = new Date(parsed.data.scheduledStart);
  if (parsed.data.scheduledEnd !== undefined) patch.scheduledEnd = new Date(parsed.data.scheduledEnd);
  // `null` clears the rule and turns a repeating window into a one-off, so
  // undefined (absent) and null (explicit) must stay distinguishable here.
  if (parsed.data.recurrence !== undefined) patch.recurrence = parsed.data.recurrence ?? null;

  if (Object.keys(patch).length > 0) {
    await db.update(maintenanceWindows).set(patch).where(eq(maintenanceWindows.id, id));
  }

  if (parsed.data.monitorIds !== undefined) {
    await db
      .delete(maintenanceWindowMonitors)
      .where(eq(maintenanceWindowMonitors.maintenanceWindowId, id));
    if (parsed.data.monitorIds.length > 0) {
      await db.insert(maintenanceWindowMonitors).values(
        parsed.data.monitorIds.map((monitorId) => ({
          maintenanceWindowId: id,
          monitorId,
        })),
      );
    }
  }

  await enqueueRegen(existing.statusPageId);
  logger.info({ id, orgId }, "[Maintenance] Window updated");

  return c.json({ ok: true });
});

// Delete
maintenanceRoutes.delete("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [existing] = await db
    .select({ statusPageId: maintenanceWindows.statusPageId })
    .from(maintenanceWindows)
    .where(and(eq(maintenanceWindows.id, id), eq(maintenanceWindows.orgId, orgId)))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  await db.delete(maintenanceWindows).where(eq(maintenanceWindows.id, id));
  await enqueueRegen(existing.statusPageId);

  return c.json({ ok: true });
});
