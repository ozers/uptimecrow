// Webhook Service — Slack, Discord, custom, and Teams outbound webhooks

import { logger } from "../utils/logger.js";
import { fetchUserWebhook } from "./email.service.js";

export async function sendSlackWebhook(params: {
  webhookUrl: string;
  type: "incident_created" | "incident_resolved";
  statusPageName: string;
  incidentTitle: string;
  severity?: string;
  updateBody: string;
}): Promise<void> {
  const color =
    params.type === "incident_resolved" ? "#00e676"
      : params.severity === "critical" ? "#ff5252"
      : params.severity === "major" ? "#ffab40"
      : "#ffd54f";

  const payload = {
    attachments: [{
      color,
      pretext: params.type === "incident_resolved"
        ? `✅ *Resolved:* ${params.incidentTitle}`
        : `🔴 *New Incident:* ${params.incidentTitle}`,
      fields: [
        { title: "Status Page", value: params.statusPageName, short: true },
        ...(params.severity ? [{ title: "Severity", value: params.severity.toUpperCase(), short: true }] : []),
        { title: "Update", value: params.updateBody, short: false },
      ],
      footer: "UptimeCrow",
      ts: Math.floor(Date.now() / 1000),
    }],
  };

  try {
    const res = await fetchUserWebhook(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Slack webhook returned ${res.status}`);
    logger.info(`[Notification] Slack webhook sent for "${params.incidentTitle}"`);
  } catch (err) {
    logger.error({ err }, "[Notification] Slack webhook failed");
  }
}

export async function sendDiscordWebhook(params: {
  webhookUrl: string;
  type: "incident_created" | "incident_resolved";
  statusPageName: string;
  incidentTitle: string;
  severity?: string;
  updateBody: string;
}): Promise<void> {
  const color =
    params.type === "incident_resolved" ? 0x00e676
      : params.severity === "critical" ? 0xff5252
      : params.severity === "major" ? 0xffab40
      : 0xffd54f;

  const payload = {
    embeds: [{
      title: params.type === "incident_resolved"
        ? `✅ Resolved: ${params.incidentTitle}`
        : `🔴 New Incident: ${params.incidentTitle}`,
      color,
      fields: [
        { name: "Status Page", value: params.statusPageName, inline: true },
        ...(params.severity ? [{ name: "Severity", value: params.severity.toUpperCase(), inline: true }] : []),
        { name: "Update", value: params.updateBody },
      ],
      footer: { text: "UptimeCrow" },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    const res = await fetchUserWebhook(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Discord webhook returned ${res.status}`);
    logger.info(`[Notification] Discord webhook sent for "${params.incidentTitle}"`);
  } catch (err) {
    logger.error({ err }, "[Notification] Discord webhook failed");
  }
}

export async function sendCustomWebhook(params: {
  webhookUrl: string;
  type: "incident_created" | "incident_resolved";
  statusPageName: string;
  incidentTitle: string;
  severity?: string;
  updateBody: string;
}): Promise<void> {
  const payload = {
    event: params.type,
    statusPage: params.statusPageName,
    incident: {
      title: params.incidentTitle,
      severity: params.severity ?? null,
      update: params.updateBody,
    },
    timestamp: new Date().toISOString(),
    source: "UptimeCrow",
  };
  try {
    const res = await fetchUserWebhook(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Custom webhook returned ${res.status}`);
    logger.info(`[Notification] Custom webhook sent for "${params.incidentTitle}"`);
  } catch (err) {
    logger.error({ err }, "[Notification] Custom webhook failed");
  }
}

export async function sendTeamsWebhook(params: {
  webhookUrl: string;
  type: "incident_created" | "incident_resolved";
  statusPageName: string;
  incidentTitle: string;
  severity?: string;
  updateBody: string;
}): Promise<void> {
  const isResolved = params.type === "incident_resolved";
  const themeColor = isResolved ? "00e676"
    : params.severity === "critical" ? "ff5252"
    : params.severity === "major" ? "ffab40"
    : "ffd54f";

  const payload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor,
    summary: params.incidentTitle,
    sections: [{
      activityTitle: isResolved
        ? `✅ Resolved: ${params.incidentTitle}`
        : `🔴 New Incident: ${params.incidentTitle}`,
      activitySubtitle: params.statusPageName,
      facts: [
        { name: "Status", value: isResolved ? "Resolved" : "Investigating" },
        ...(params.severity ? [{ name: "Severity", value: params.severity.toUpperCase() }] : []),
        { name: "Update", value: params.updateBody },
      ],
      markdown: true,
    }],
  };

  try {
    const res = await fetchUserWebhook(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Teams webhook returned ${res.status}`);
    logger.info(`[Notification] Teams webhook sent for "${params.incidentTitle}"`);
  } catch (err) {
    logger.error({ err }, "[Notification] Teams webhook failed");
  }
}

export async function sendTelegramMessage(params: {
  botToken: string;
  chatId: string;
  type: "incident_created" | "incident_resolved";
  statusPageName: string;
  incidentTitle: string;
  severity?: string;
  updateBody: string;
}): Promise<void> {
  const isResolved = params.type === "incident_resolved";
  const emoji = isResolved ? "✅" : params.severity === "critical" ? "🔴" : params.severity === "major" ? "🟠" : "🟡";
  const text = [
    `${emoji} *${isResolved ? "Resolved" : "New Incident"}: ${params.incidentTitle}*`,
    `📋 *Status Page:* ${params.statusPageName}`,
    ...(params.severity ? [`⚠️ *Severity:* ${params.severity.toUpperCase()}`] : []),
    ``,
    params.updateBody,
    ``,
    `_Powered by UptimeCrow_`,
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${params.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: params.chatId, text, parse_mode: "Markdown" }),
    });
    if (!res.ok) throw new Error(`Telegram API returned ${res.status}`);
    logger.info(`[Notification] Telegram message sent for "${params.incidentTitle}"`);
  } catch (err) {
    logger.error({ err }, "[Notification] Telegram message failed");
  }
}
