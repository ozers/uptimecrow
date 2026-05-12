// Notify Job — Email notification queue handler

import type { Job } from "bullmq";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { logger } from "../utils/logger.js";
import {
  subscribers,
  statusPages,
  incidents,
  incidentUpdates,
  organizations,
  users,
} from "../db/schema.js";
import {
  sendIncidentNotification,
  sendIncidentResolvedNotification,
  sendVerificationEmail,
  sendSlackWebhook,
  sendDiscordWebhook,
  sendCustomWebhook,
  sendPagerDutyAlert,
  sendTeamsWebhook,
  sendTelegramMessage,
  sendSslExpiryNotification,
} from "../services/notification.service.js";

export interface NotifyJobData {
  type:
    | "incident_created"
    | "incident_updated"
    | "incident_resolved"
    | "verification"
    | "ssl_expiry";
  statusPageId?: string;
  incidentId?: string;
  // For verification emails
  email?: string;
  verifyUrl?: string;
  // For ssl_expiry
  orgId?: string;
  monitorId?: string;
  monitorName?: string;
  monitorUrl?: string;
  daysRemaining?: number;
}

export async function processNotifyJob(
  job: Job<NotifyJobData>,
): Promise<void> {
  const { type } = job.data;

  if (type === "verification") {
    await handleVerification(job.data);
    return;
  }

  if (type === "ssl_expiry") {
    await handleSslExpiry(job.data);
    return;
  }

  const { statusPageId } = job.data;

  if (!statusPageId) {
    logger.error("[Notify] Missing statusPageId for incident notification");
    return;
  }

  if (!job.data.incidentId) {
    logger.error("[Notify] Missing incidentId for incident notification");
    return;
  }

  // Fetch status page
  const [page] = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.id, statusPageId))
    .limit(1);

  if (!page) {
    logger.error(`[Notify] Status page ${statusPageId} not found`);
    return;
  }

  // Fetch verified subscribers
  const subscriberList = await db
    .select({ email: subscribers.email })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.statusPageId, statusPageId),
        eq(subscribers.isVerified, true),
      ),
    );

  const emails = subscriberList.map((s) => s.email);

  // Fetch incident
  const [incident] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, job.data.incidentId))
    .limit(1);

  if (!incident) {
    logger.error(`[Notify] Incident ${job.data.incidentId} not found`);
    return;
  }

  // Fetch latest update
  const [latestUpdate] = await db
    .select()
    .from(incidentUpdates)
    .where(eq(incidentUpdates.incidentId, incident.id))
    .orderBy(incidentUpdates.createdAt)
    .limit(1);

  const updateBody =
    latestUpdate?.body || "We are investigating this issue.";

  // Send emails (if any subscribers)
  if (emails.length > 0) {
    if (type === "incident_resolved") {
      await sendIncidentResolvedNotification({
        statusPageName: page.name,
        incidentTitle: incident.title,
        updateBody,
        subscriberEmails: emails,
      });
    } else {
      await sendIncidentNotification({
        statusPageName: page.name,
        incidentTitle: incident.title,
        severity: incident.severity,
        updateBody,
        subscriberEmails: emails,
      });
    }
  }

  // Send webhooks & integrations
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
    .where(eq(organizations.id, page.orgId))
    .limit(1);

  const webhookParams = {
    type: type as "incident_created" | "incident_resolved",
    statusPageName: page.name,
    incidentTitle: incident.title,
    severity: incident.severity,
    updateBody,
  };

  if (org?.slackWebhookUrl) {
    await sendSlackWebhook({ ...webhookParams, webhookUrl: org.slackWebhookUrl });
  }
  if (org?.discordWebhookUrl) {
    await sendDiscordWebhook({ ...webhookParams, webhookUrl: org.discordWebhookUrl });
  }
  if (org?.customWebhookUrl) {
    await sendCustomWebhook({ ...webhookParams, webhookUrl: org.customWebhookUrl });
  }
  if (org?.pagerdutyIntegrationKey) {
    await sendPagerDutyAlert({
      ...webhookParams,
      integrationKey: org.pagerdutyIntegrationKey,
      dedupKey: incident.id,
    });
  }
  if (org?.teamsWebhookUrl) {
    await sendTeamsWebhook({ ...webhookParams, webhookUrl: org.teamsWebhookUrl });
  }
  if (org?.telegramBotToken && org?.telegramChatId) {
    await sendTelegramMessage({
      ...webhookParams,
      botToken: org.telegramBotToken,
      chatId: org.telegramChatId,
    });
  }
}

async function handleVerification(data: NotifyJobData): Promise<void> {
  if (!data.email || !data.verifyUrl) {
    logger.error("[Notify] Missing email or verifyUrl for verification");
    return;
  }

  const [page] = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.id, data.statusPageId!))
    .limit(1);

  if (!page) {
    logger.error(`[Notify] Status page ${data.statusPageId} not found`);
    return;
  }

  await sendVerificationEmail({
    email: data.email,
    statusPageName: page.name,
    verifyUrl: data.verifyUrl,
  });
}

async function handleSslExpiry(data: NotifyJobData): Promise<void> {
  if (!data.orgId || !data.monitorName || !data.monitorUrl || data.daysRemaining == null) {
    logger.error("[Notify] Missing fields for ssl_expiry notification");
    return;
  }

  const [org] = await db
    .select({
      ownerId: organizations.ownerId,
      slackWebhookUrl: organizations.slackWebhookUrl,
      discordWebhookUrl: organizations.discordWebhookUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, data.orgId))
    .limit(1);

  if (!org) {
    logger.error(`[Notify] Org ${data.orgId} not found for SSL expiry`);
    return;
  }

  const [owner] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, org.ownerId))
    .limit(1);

  if (!owner) {
    logger.error(`[Notify] Owner not found for org ${data.orgId}`);
    return;
  }

  await sendSslExpiryNotification({
    ownerEmail: owner.email,
    monitorName: data.monitorName,
    monitorUrl: data.monitorUrl,
    daysRemaining: data.daysRemaining,
    slackWebhookUrl: org.slackWebhookUrl,
    discordWebhookUrl: org.discordWebhookUrl,
  });
}
