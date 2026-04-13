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
} from "../db/schema.js";
import {
  sendIncidentNotification,
  sendIncidentResolvedNotification,
  sendVerificationEmail,
  sendSlackWebhook,
  sendDiscordWebhook,
} from "../services/notification.service.js";

export interface NotifyJobData {
  type:
    | "incident_created"
    | "incident_updated"
    | "incident_resolved"
    | "verification";
  statusPageId: string;
  incidentId?: string;
  // For verification emails
  email?: string;
  verifyUrl?: string;
}

export async function processNotifyJob(
  job: Job<NotifyJobData>,
): Promise<void> {
  const { type, statusPageId } = job.data;

  if (type === "verification") {
    await handleVerification(job.data);
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

  // Send Slack/Discord webhooks
  const [org] = await db
    .select({ slackWebhookUrl: organizations.slackWebhookUrl, discordWebhookUrl: organizations.discordWebhookUrl })
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
}

async function handleVerification(data: NotifyJobData): Promise<void> {
  if (!data.email || !data.verifyUrl) {
    logger.error("[Notify] Missing email or verifyUrl for verification");
    return;
  }

  const [page] = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.id, data.statusPageId))
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
