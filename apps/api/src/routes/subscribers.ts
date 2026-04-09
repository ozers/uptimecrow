import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscribers, statusPages } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

export const subscriberRoutes = new Hono();

subscriberRoutes.use("*", authMiddleware);

// List subscribers for an org's status pages
subscriberRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");
  const statusPageId = c.req.query("statusPageId");

  if (!statusPageId) {
    return c.json({ error: "statusPageId query parameter is required" }, 400);
  }

  // Verify status page belongs to org
  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.id, statusPageId), eq(statusPages.orgId, orgId)))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  const result = await db
    .select({
      id: subscribers.id,
      email: subscribers.email,
      isVerified: subscribers.isVerified,
      createdAt: subscribers.createdAt,
    })
    .from(subscribers)
    .where(eq(subscribers.statusPageId, statusPageId))
    .orderBy(desc(subscribers.createdAt));

  return c.json({ subscribers: result });
});

// Delete subscriber
subscriberRoutes.delete("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  // Verify subscriber belongs to org's status page
  const result = await db
    .select({
      subscriberId: subscribers.id,
      orgId: statusPages.orgId,
    })
    .from(subscribers)
    .innerJoin(statusPages, eq(subscribers.statusPageId, statusPages.id))
    .where(and(eq(subscribers.id, id), eq(statusPages.orgId, orgId)))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Subscriber not found" }, 404);
  }

  await db.delete(subscribers).where(eq(subscribers.id, id));

  return c.json({ ok: true });
});
