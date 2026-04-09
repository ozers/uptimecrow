import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

export const settingsRoutes = new Hono();

settingsRoutes.use("*", authMiddleware);

// Get org settings
settingsRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");

  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      plan: organizations.plan,
      slackWebhookUrl: organizations.slackWebhookUrl,
      discordWebhookUrl: organizations.discordWebhookUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return c.json({ error: "Organization not found" }, 404);

  return c.json({ organization: org });
});

// Update org settings (webhooks etc)
settingsRoutes.patch("/", async (c) => {
  const { orgId } = c.get("user");
  const body = await c.req.json<{
    slackWebhookUrl?: string | null;
    discordWebhookUrl?: string | null;
  }>();

  const updates: Record<string, string | null> = {};
  if ("slackWebhookUrl" in body) updates.slackWebhookUrl = body.slackWebhookUrl || null;
  if ("discordWebhookUrl" in body) updates.discordWebhookUrl = body.discordWebhookUrl || null;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  const [org] = await db
    .update(organizations)
    .set(updates)
    .where(eq(organizations.id, orgId))
    .returning();

  return c.json({ organization: org });
});

// Test webhook
settingsRoutes.post("/test-webhook", async (c) => {
  const { orgId } = c.get("user");
  const { type } = await c.req.json<{ type: "slack" | "discord" }>();

  const [org] = await db
    .select({ slackWebhookUrl: organizations.slackWebhookUrl, discordWebhookUrl: organizations.discordWebhookUrl })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return c.json({ error: "Organization not found" }, 404);

  const url = type === "slack" ? org.slackWebhookUrl : org.discordWebhookUrl;
  if (!url) return c.json({ error: `No ${type} webhook URL configured` }, 400);

  try {
    if (type === "slack") {
      const { sendSlackWebhook } = await import("../services/notification.service.js");
      await sendSlackWebhook({
        webhookUrl: url,
        type: "incident_created",
        statusPageName: "Test",
        incidentTitle: "Test notification from UptimeCrow",
        severity: "minor",
        updateBody: "This is a test message to verify your webhook is working correctly.",
      });
    } else {
      const { sendDiscordWebhook } = await import("../services/notification.service.js");
      await sendDiscordWebhook({
        webhookUrl: url,
        type: "incident_created",
        statusPageName: "Test",
        incidentTitle: "Test notification from UptimeCrow",
        severity: "minor",
        updateBody: "This is a test message to verify your webhook is working correctly.",
      });
    }
    return c.json({ ok: true, message: `${type} test sent` });
  } catch {
    return c.json({ error: `Failed to send ${type} test` }, 500);
  }
});
