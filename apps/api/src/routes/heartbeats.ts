import { Hono } from "hono";
import { eq, and, count } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "../db/index.js";
import { heartbeats, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import { createHeartbeatSchema, updateHeartbeatSchema } from "@uptimecrow/shared";

const app = new Hono();

app.use("*", authMiddleware);

function generateSlug(): string {
  return randomBytes(9).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "x").slice(0, 12);
}

// GET /api/heartbeats
app.get("/", async (c) => {
  const { orgId } = c.get("user");
  const rows = await db
    .select()
    .from(heartbeats)
    .where(eq(heartbeats.orgId, orgId))
    .orderBy(heartbeats.createdAt);
  return c.json(rows);
});

// POST /api/heartbeats
app.post("/", async (c) => {
  const { orgId } = c.get("user");
  const body = await c.req.json();
  const parsed = createHeartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const limit = PLAN_LIMITS[org?.plan ?? "free"]?.heartbeats ?? 3;

  const [{ total }] = await db
    .select({ total: count() })
    .from(heartbeats)
    .where(eq(heartbeats.orgId, orgId));

  if (Number(total) >= limit) {
    return c.json({ error: `Heartbeat limit reached (${limit} on your plan)` }, 403);
  }

  const slug = generateSlug();
  const [row] = await db
    .insert(heartbeats)
    .values({ orgId, name: parsed.data.name, slug, period: parsed.data.period, grace: parsed.data.grace })
    .returning();
  return c.json(row, 201);
});

// PATCH /api/heartbeats/:id
app.patch("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateHeartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  // Keep status in sync with isActive toggle
  if (parsed.data.isActive === false) updates.status = "paused";
  if (parsed.data.isActive === true) updates.status = "unknown";

  const [row] = await db
    .update(heartbeats)
    .set(updates)
    .where(and(eq(heartbeats.id, id), eq(heartbeats.orgId, orgId)))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// DELETE /api/heartbeats/:id
app.delete("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const deleted = await db
    .delete(heartbeats)
    .where(and(eq(heartbeats.id, id), eq(heartbeats.orgId, orgId)))
    .returning();
  if (!deleted.length) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

export default app;
