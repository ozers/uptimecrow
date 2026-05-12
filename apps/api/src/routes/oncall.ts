import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { onCallSchedules, onCallContacts, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

export const oncallRoutes = new Hono();

oncallRoutes.use("*", authMiddleware);

// Get schedule (one per org in v1)
oncallRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");

  const [schedule] = await db
    .select()
    .from(onCallSchedules)
    .where(eq(onCallSchedules.orgId, orgId))
    .limit(1);

  if (!schedule) return c.json({ schedule: null, contacts: [], current: null });

  const contacts = await db
    .select()
    .from(onCallContacts)
    .where(eq(onCallContacts.scheduleId, schedule.id))
    .orderBy(asc(onCallContacts.position));

  const current = getCurrentOnCall(contacts, schedule.rotationDays);

  return c.json({ schedule, contacts, current });
});

// Create or update schedule
oncallRoutes.put("/", async (c) => {
  const { orgId } = c.get("user");
  const { name, rotationDays } = await c.req.json<{ name?: string; rotationDays?: number }>();

  const [existing] = await db
    .select({ id: onCallSchedules.id })
    .from(onCallSchedules)
    .where(eq(onCallSchedules.orgId, orgId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(onCallSchedules)
      .set({
        ...(name != null ? { name } : {}),
        ...(rotationDays != null ? { rotationDays } : {}),
      })
      .where(eq(onCallSchedules.id, existing.id))
      .returning();
    return c.json({ schedule: updated });
  }

  const [schedule] = await db
    .insert(onCallSchedules)
    .values({ orgId, name: name ?? "Default", rotationDays: rotationDays ?? 7 })
    .returning();

  return c.json({ schedule }, 201);
});

// Add contact
oncallRoutes.post("/contacts", async (c) => {
  const { orgId } = c.get("user");
  const { name, email, phone, position } = await c.req.json<{
    name: string;
    email?: string;
    phone?: string;
    position?: number;
  }>();

  if (!name) return c.json({ error: "Name required" }, 400);

  let [schedule] = await db
    .select({ id: onCallSchedules.id })
    .from(onCallSchedules)
    .where(eq(onCallSchedules.orgId, orgId))
    .limit(1);

  if (!schedule) {
    [schedule] = await db
      .insert(onCallSchedules)
      .values({ orgId, name: "Default", rotationDays: 7 })
      .returning({ id: onCallSchedules.id });
  }

  // Auto-assign position if not provided
  let pos = position;
  if (pos == null) {
    const contacts = await db
      .select({ position: onCallContacts.position })
      .from(onCallContacts)
      .where(eq(onCallContacts.scheduleId, schedule.id))
      .orderBy(asc(onCallContacts.position));
    pos = contacts.length > 0 ? (contacts[contacts.length - 1].position + 1) : 0;
  }

  const [contact] = await db
    .insert(onCallContacts)
    .values({ scheduleId: schedule.id, name, email: email || null, phone: phone || null, position: pos })
    .returning();

  return c.json({ contact }, 201);
});

// Update contact
oncallRoutes.patch("/contacts/:id", async (c) => {
  const { orgId } = c.get("user");
  const contactId = c.req.param("id");
  const updates = await c.req.json<{ name?: string; email?: string; phone?: string; position?: number }>();

  // Verify ownership via schedule
  const [schedule] = await db
    .select({ id: onCallSchedules.id })
    .from(onCallSchedules)
    .where(eq(onCallSchedules.orgId, orgId))
    .limit(1);

  if (!schedule) return c.json({ error: "Schedule not found" }, 404);

  const [contact] = await db
    .update(onCallContacts)
    .set({
      ...(updates.name != null ? { name: updates.name } : {}),
      ...(updates.email != null ? { email: updates.email } : {}),
      ...(updates.phone != null ? { phone: updates.phone } : {}),
      ...(updates.position != null ? { position: updates.position } : {}),
    })
    .where(and(eq(onCallContacts.id, contactId), eq(onCallContacts.scheduleId, schedule.id)))
    .returning();

  if (!contact) return c.json({ error: "Contact not found" }, 404);

  return c.json({ contact });
});

// Delete contact
oncallRoutes.delete("/contacts/:id", async (c) => {
  const { orgId } = c.get("user");
  const contactId = c.req.param("id");

  const [schedule] = await db
    .select({ id: onCallSchedules.id })
    .from(onCallSchedules)
    .where(eq(onCallSchedules.orgId, orgId))
    .limit(1);

  if (!schedule) return c.json({ error: "Schedule not found" }, 404);

  await db.delete(onCallContacts).where(
    and(eq(onCallContacts.id, contactId), eq(onCallContacts.scheduleId, schedule.id)),
  );

  return c.json({ ok: true });
});

export interface OnCallContact {
  id: string;
  scheduleId: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: number;
  createdAt: Date;
}

export function getCurrentOnCall(contacts: OnCallContact[], rotationDays: number): OnCallContact | null {
  if (!contacts.length) return null;
  const sorted = [...contacts].sort((a, b) => a.position - b.position);
  const periodIndex = Math.floor(Date.now() / (rotationDays * 86_400_000));
  return sorted[periodIndex % sorted.length];
}
