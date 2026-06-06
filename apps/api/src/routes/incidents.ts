import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { incidents, incidentUpdates } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  createIncidentSchema,
  updateIncidentSchema,
  createIncidentUpdateSchema,
} from "@uptimecrow/shared";

export const incidentRoutes = new Hono();

incidentRoutes.use("*", authMiddleware);

// List incidents
incidentRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20", 10) || 20));
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0", 10) || 0);

  const result = await db
    .select()
    .from(incidents)
    .where(eq(incidents.orgId, orgId))
    .orderBy(desc(incidents.startedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ incidents: result });
});

// Get single incident with updates
incidentRoutes.get("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [incident] = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.id, id), eq(incidents.orgId, orgId)))
    .limit(1);

  if (!incident) {
    return c.json({ error: "Incident not found" }, 404);
  }

  const updates = await db
    .select()
    .from(incidentUpdates)
    .where(eq(incidentUpdates.incidentId, id))
    .orderBy(desc(incidentUpdates.createdAt));

  return c.json({ incident, updates });
});

// Create incident
incidentRoutes.post("/", async (c) => {
  const { orgId } = c.get("user");
  const body = await c.req.json();
  const parsed = createIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { body: updateBody, ...incidentData } = parsed.data;

  const [incident] = await db
    .insert(incidents)
    .values({ ...incidentData, orgId })
    .returning();

  // Create initial update
  const [update] = await db
    .insert(incidentUpdates)
    .values({
      incidentId: incident.id,
      status: incident.status,
      body: updateBody,
    })
    .returning();

  return c.json({ incident, update }, 201);
});

// Update incident status
incidentRoutes.patch("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "resolved") {
    updateData.resolvedAt = new Date();
  }

  const [incident] = await db
    .update(incidents)
    .set(updateData)
    .where(and(eq(incidents.id, id), eq(incidents.orgId, orgId)))
    .returning();

  if (!incident) {
    return c.json({ error: "Incident not found" }, 404);
  }

  return c.json({ incident });
});

// Add incident update
incidentRoutes.post("/:id/updates", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = createIncidentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  // Verify incident belongs to org
  const [incident] = await db
    .select({ id: incidents.id })
    .from(incidents)
    .where(and(eq(incidents.id, id), eq(incidents.orgId, orgId)))
    .limit(1);

  if (!incident) {
    return c.json({ error: "Incident not found" }, 404);
  }

  // Update incident status
  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "resolved") {
    updateData.resolvedAt = new Date();
  }
  await db.update(incidents).set(updateData).where(eq(incidents.id, id));

  // Create update
  const [update] = await db
    .insert(incidentUpdates)
    .values({
      incidentId: id,
      status: parsed.data.status,
      body: parsed.data.body,
    })
    .returning();

  return c.json({ update }, 201);
});
