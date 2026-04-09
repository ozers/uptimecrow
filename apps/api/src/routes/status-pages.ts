import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { statusPages, statusPageMonitors, monitors } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { createStatusPageSchema, updateStatusPageSchema } from "@uptimecrow/shared";

export const statusPageRoutes = new Hono();

statusPageRoutes.use("*", authMiddleware);

// List status pages
statusPageRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");

  const result = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.orgId, orgId));

  return c.json({ statusPages: result });
});

// Get single status page
statusPageRoutes.get("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [page] = await db
    .select()
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  const linkedMonitors = await db
    .select({ monitorId: statusPageMonitors.monitorId })
    .from(statusPageMonitors)
    .where(eq(statusPageMonitors.statusPageId, id));

  return c.json({ statusPage: page, monitorIds: linkedMonitors.map((m) => m.monitorId) });
});

// Create status page
statusPageRoutes.post("/", async (c) => {
  const { orgId } = c.get("user");
  const body = await c.req.json();
  const parsed = createStatusPageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  // Check slug uniqueness
  const existing = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(eq(statusPages.slug, parsed.data.slug))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "Slug already taken" }, 409);
  }

  const [page] = await db
    .insert(statusPages)
    .values({ ...parsed.data, orgId })
    .returning();

  return c.json({ statusPage: page }, 201);
});

// Update status page
statusPageRoutes.patch("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateStatusPageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  // If slug is being updated, check uniqueness
  if (parsed.data.slug) {
    const existing = await db
      .select({ id: statusPages.id })
      .from(statusPages)
      .where(eq(statusPages.slug, parsed.data.slug))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      return c.json({ error: "Slug already taken" }, 409);
    }
  }

  const [page] = await db
    .update(statusPages)
    .set(parsed.data)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .returning();

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  return c.json({ statusPage: page });
});

// Delete status page
statusPageRoutes.delete("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .returning({ id: statusPages.id });

  if (!deleted) {
    return c.json({ error: "Status page not found" }, 404);
  }

  return c.json({ ok: true });
});

// Set monitors for a status page
statusPageRoutes.put("/:id/monitors", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const { monitorIds } = await c.req.json<{ monitorIds: string[] }>();

  // Verify status page belongs to org
  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  // Replace all monitor links
  await db.delete(statusPageMonitors).where(eq(statusPageMonitors.statusPageId, id));

  if (monitorIds.length > 0) {
    await db.insert(statusPageMonitors).values(
      monitorIds.map((monitorId) => ({ statusPageId: id, monitorId })),
    );
  }

  return c.json({ ok: true, monitorIds });
});
