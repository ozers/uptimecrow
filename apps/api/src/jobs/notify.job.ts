// Notify Job — Email notification queue handler

import type { Job } from "bullmq";
import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { logger } from "../utils/logger.js";
import { assertPublicUrl } from "../utils/ssrf.js";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import {
  subscribers,
  statusPages,
  incidents,
  incidentUpdates,
  organizations,
  users,
  onCallSchedules,
  onCallContacts,
} from "../db/schema.js";
import { getCurrentOnCall } from "../routes/oncall.js";
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
  sendSmsAlert,
  sendSslExpiryNotification,
  sendDomainExpiryNotification,
  sendSlowResponseNotification,
} from "../services/notification.service.js";

export interface NotifyJobData {
  type:
    | "incident_created"
    | "incident_updated"
    | "incident_resolved"
    | "verification"
    | "ssl_expiry"
    | "domain_expiry"
    | "slow_response";
  statusPageId?: string;
  incidentId?: string;
  // For verification emails
  email?: string;
  verifyUrl?: string;
  // For ssl_expiry / domain_expiry / slow_response
  orgId?: string;
  monitorId?: string;
  monitorName?: string;
  monitorUrl?: string;
  daysRemaining?: number;
  // For slow_response
  responseMs?: number;
  thresholdMs?: number;
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

  if (type === "domain_expiry") {
    await handleDomainExpiry(job.data);
    return;
  }

  if (type === "slow_response") {
    await handleSlowResponse(job.data);
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
    .select({ email: subscribers.email, webhookUrl: subscribers.webhookUrl })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.statusPageId, statusPageId),
        eq(subscribers.isVerified, true),
      ),
    );

  const emails = subscriberList.map((s) => s.email);
  const subscriberWebhooks = subscriberList.map((s) => s.webhookUrl).filter(Boolean) as string[];

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
    .orderBy(desc(incidentUpdates.createdAt))
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

  // Fire subscriber webhook URLs (Slack or any webhook they provided)
  if (subscriberWebhooks.length > 0) {
    const slackPayload = {
      text: type === "incident_resolved"
        ? `✅ *Resolved* — ${incident.title} on *${page.name}*`
        : `🔴 *Incident* [${incident.severity}] — ${incident.title} on *${page.name}*`,
      attachments: [{
        color: type === "incident_resolved" ? "#00e676" : incident.severity === "critical" ? "#ff5252" : incident.severity === "major" ? "#ff9800" : "#ffeb3b",
        text: updateBody,
      }],
    };
    await Promise.allSettled(
      subscriberWebhooks.map(async (url) => {
        // Subscriber webhook URLs come from anonymous, unauthenticated users on
        // public status pages. Guard against SSRF (e.g. cloud-metadata targets)
        // before dialing — the same protection every other outbound URL gets.
        try {
          await assertPublicUrl(url);
        } catch (err) {
          logger.warn({ err, url }, "[Notify] Subscriber webhook blocked by SSRF guard");
          return;
        }
        return fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackPayload),
        }).catch((err) => logger.error({ err, url }, "[Notify] Subscriber webhook failed"));
      }),
    );
  }

  // Send webhooks & integrations
  const [org] = await db
    .select({
      plan: organizations.plan,
      slackWebhookUrl: organizations.slackWebhookUrl,
      discordWebhookUrl: organizations.discordWebhookUrl,
      customWebhookUrl: organizations.customWebhookUrl,
      pagerdutyIntegrationKey: organizations.pagerdutyIntegrationKey,
      teamsWebhookUrl: organizations.teamsWebhookUrl,
      telegramBotToken: organizations.telegramBotToken,
      telegramChatId: organizations.telegramChatId,
      twilioAccountSid: organizations.twilioAccountSid,
      twilioAuthToken: organizations.twilioAuthToken,
      twilioFromNumber: organizations.twilioFromNumber,
      twilioToNumber: organizations.twilioToNumber,
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

  // Slack/Discord/custom/PagerDuty/Teams/Telegram/SMS are paid-plan
  // integrations. The free tier is email-only, so gate every non-email
  // channel on the plan (matches PLAN_LIMITS.slackWebhook).
  if (PLAN_LIMITS[org?.plan ?? "free"].slackWebhook) {
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
    if (org?.twilioAccountSid && org?.twilioAuthToken && org?.twilioFromNumber && org?.twilioToNumber) {
      await sendSmsAlert({
        accountSid: org.twilioAccountSid,
        authToken: org.twilioAuthToken,
        fromNumber: org.twilioFromNumber,
        toNumber: org.twilioToNumber,
        type: type as "incident_created" | "incident_resolved",
        statusPageName: page.name,
        incidentTitle: incident.title,
        severity: incident.severity,
      });
    }
  }

  // Notify on-call person
  if (type === "incident_created" || type === "incident_resolved") {
    const [schedule] = await db
      .select({ id: onCallSchedules.id, rotationDays: onCallSchedules.rotationDays })
      .from(onCallSchedules)
      .where(eq(onCallSchedules.orgId, page.orgId))
      .limit(1);

    if (schedule) {
      const contacts = await db
        .select()
        .from(onCallContacts)
        .where(eq(onCallContacts.scheduleId, schedule.id))
        .orderBy(asc(onCallContacts.position));

      const oncall = getCurrentOnCall(contacts, schedule.rotationDays);
      if (oncall) {
        // SMS on-call person if they have a phone and Twilio is configured
        if (oncall.phone && org?.twilioAccountSid && org?.twilioAuthToken && org?.twilioFromNumber) {
          await sendSmsAlert({
            accountSid: org.twilioAccountSid,
            authToken: org.twilioAuthToken,
            fromNumber: org.twilioFromNumber,
            toNumber: oncall.phone,
            type: type as "incident_created" | "incident_resolved",
            statusPageName: page.name,
            incidentTitle: incident.title,
            severity: incident.severity,
          }).catch((err) => logger.error({ err }, "[Notify] On-call SMS failed"));
        }
        // Email on-call person
        if (oncall.email) {
          const { sendIncidentNotification, sendIncidentResolvedNotification } = await import("../services/notification.service.js");
          if (type === "incident_resolved") {
            await sendIncidentResolvedNotification({ statusPageName: page.name, incidentTitle: incident.title, updateBody, subscriberEmails: [oncall.email] }).catch(() => null);
          } else {
            await sendIncidentNotification({ statusPageName: page.name, incidentTitle: incident.title, severity: incident.severity, updateBody, subscriberEmails: [oncall.email] }).catch(() => null);
          }
        }
      }
    }
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

async function handleDomainExpiry(data: NotifyJobData): Promise<void> {
  if (!data.orgId || !data.monitorName || !data.monitorUrl || data.daysRemaining == null) {
    logger.error("[Notify] Missing fields for domain_expiry notification");
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

  if (!org) return;

  const [owner] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, org.ownerId))
    .limit(1);

  if (!owner) return;

  await sendDomainExpiryNotification({
    ownerEmail: owner.email,
    monitorName: data.monitorName,
    monitorUrl: data.monitorUrl,
    daysRemaining: data.daysRemaining,
    slackWebhookUrl: org.slackWebhookUrl,
    discordWebhookUrl: org.discordWebhookUrl,
  });
}

async function handleSlowResponse(data: NotifyJobData): Promise<void> {
  if (!data.orgId || !data.monitorName || !data.monitorUrl || data.responseMs == null || data.thresholdMs == null) {
    logger.error("[Notify] Missing fields for slow_response notification");
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

  if (!org) return;

  const [owner] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, org.ownerId))
    .limit(1);

  if (!owner) return;

  await sendSlowResponseNotification({
    ownerEmail: owner.email,
    monitorName: data.monitorName,
    monitorUrl: data.monitorUrl,
    responseMs: data.responseMs,
    thresholdMs: data.thresholdMs,
    slackWebhookUrl: org.slackWebhookUrl,
    discordWebhookUrl: org.discordWebhookUrl,
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
