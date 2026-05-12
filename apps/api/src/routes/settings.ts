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
      customWebhookUrl: organizations.customWebhookUrl,
      pagerdutyIntegrationKey: organizations.pagerdutyIntegrationKey,
      teamsWebhookUrl: organizations.teamsWebhookUrl,
      telegramBotToken: organizations.telegramBotToken,
      telegramChatId: organizations.telegramChatId,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return c.json({ error: "Organization not found" }, 404);

  // Mask telegram bot token for display
  const masked = {
    ...org,
    telegramBotToken: org.telegramBotToken ? "••••••••" + org.telegramBotToken.slice(-4) : null,
  };

  return c.json({ organization: masked });
});

// Update org settings (webhooks etc)
settingsRoutes.patch("/", async (c) => {
  const { orgId } = c.get("user");
  const body = await c.req.json<{
    slackWebhookUrl?: string | null;
    discordWebhookUrl?: string | null;
    customWebhookUrl?: string | null;
    pagerdutyIntegrationKey?: string | null;
    teamsWebhookUrl?: string | null;
    telegramBotToken?: string | null;
    telegramChatId?: string | null;
  }>();

  const updates: Record<string, string | null> = {};
  if ("slackWebhookUrl" in body) updates.slackWebhookUrl = body.slackWebhookUrl || null;
  if ("discordWebhookUrl" in body) updates.discordWebhookUrl = body.discordWebhookUrl || null;
  if ("customWebhookUrl" in body) updates.customWebhookUrl = body.customWebhookUrl || null;
  if ("pagerdutyIntegrationKey" in body) updates.pagerdutyIntegrationKey = body.pagerdutyIntegrationKey || null;
  if ("teamsWebhookUrl" in body) updates.teamsWebhookUrl = body.teamsWebhookUrl || null;
  if ("telegramBotToken" in body) updates.telegramBotToken = body.telegramBotToken || null;
  if ("telegramChatId" in body) updates.telegramChatId = body.telegramChatId || null;

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
  const { type } = await c.req.json<{ type: "slack" | "discord" | "custom" | "pagerduty" | "teams" | "telegram" }>();

  const [org] = await db
    .select({
      slackWebhookUrl: organizations.slackWebhookUrl,
      discordWebhookUrl: organizations.discordWebhookUrl,
      customWebhookUrl: organizations.customWebhookUrl,
      pagerdutyIntegrationKey: organizations.pagerdutyIntegrationKey,
      teamsWebhookUrl: organizations.teamsWebhookUrl,
      telegramBotToken: organizations.telegramBotToken,
      telegramChatId: organizations.telegramChatId,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return c.json({ error: "Organization not found" }, 404);

  const testParams = {
    type: "incident_created" as const,
    statusPageName: "Test",
    incidentTitle: "Test notification from UptimeCrow",
    severity: "minor",
    updateBody: "This is a test message to verify your integration is working correctly.",
  };

  try {
    if (type === "slack") {
      if (!org.slackWebhookUrl) return c.json({ error: "No Slack webhook URL configured" }, 400);
      const { sendSlackWebhook } = await import("../services/notification.service.js");
      await sendSlackWebhook({ ...testParams, webhookUrl: org.slackWebhookUrl });
    } else if (type === "discord") {
      if (!org.discordWebhookUrl) return c.json({ error: "No Discord webhook URL configured" }, 400);
      const { sendDiscordWebhook } = await import("../services/notification.service.js");
      await sendDiscordWebhook({ ...testParams, webhookUrl: org.discordWebhookUrl });
    } else if (type === "custom") {
      if (!org.customWebhookUrl) return c.json({ error: "No custom webhook URL configured" }, 400);
      const { sendCustomWebhook } = await import("../services/notification.service.js");
      await sendCustomWebhook({ ...testParams, webhookUrl: org.customWebhookUrl });
    } else if (type === "pagerduty") {
      if (!org.pagerdutyIntegrationKey) return c.json({ error: "No PagerDuty integration key configured" }, 400);
      const { sendPagerDutyAlert } = await import("../services/notification.service.js");
      await sendPagerDutyAlert({ ...testParams, integrationKey: org.pagerdutyIntegrationKey });
    } else if (type === "teams") {
      if (!org.teamsWebhookUrl) return c.json({ error: "No Teams webhook URL configured" }, 400);
      const { sendTeamsWebhook } = await import("../services/notification.service.js");
      await sendTeamsWebhook({ ...testParams, webhookUrl: org.teamsWebhookUrl });
    } else if (type === "telegram") {
      if (!org.telegramBotToken || !org.telegramChatId) return c.json({ error: "No Telegram bot token or chat ID configured" }, 400);
      const { sendTelegramMessage } = await import("../services/notification.service.js");
      await sendTelegramMessage({ ...testParams, botToken: org.telegramBotToken, chatId: org.telegramChatId });
    }
    return c.json({ ok: true, message: `${type} test sent` });
  } catch {
    return c.json({ error: `Failed to send ${type} test` }, 500);
  }
});
