// Notification Service — Email via Amazon SES + Slack/Discord webhooks

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { logger } from "../utils/logger.js";

function getClient(): SESv2Client | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  return new SESv2Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: { accessKeyId, secretAccessKey },
  });
}

const FROM_EMAIL =
  process.env.SES_FROM_EMAIL || "UptimeCrow <notifications@uptimecrow.com>";

async function sendEmail(
  client: SESv2Client,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      },
    }),
  );
}

export async function sendIncidentNotification(params: {
  statusPageName: string;
  incidentTitle: string;
  severity: string;
  updateBody: string;
  subscriberEmails: string[];
}): Promise<void> {
  if (params.subscriberEmails.length === 0) return;

  const client = getClient();
  if (!client) {
    logger.info(
      `[Notification] No AWS credentials — skipping "${params.incidentTitle}" to ${params.subscriberEmails.length} subscribers`,
    );
    return;
  }

  const severityLabel =
    params.severity === "critical" ? "🔴 Critical"
      : params.severity === "major" ? "🟠 Major"
      : "🟡 Minor";
  const severityColor =
    params.severity === "critical" ? "#dc2626"
      : params.severity === "major" ? "#ea580c"
      : "#ca8a04";
  const severityBg =
    params.severity === "critical" ? "#fee2e2"
      : params.severity === "major" ? "#ffedd5"
      : "#fef9c3";

  const subject = `[${params.statusPageName}] ${severityLabel}: ${params.incidentTitle}`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#1a1a1a">${params.incidentTitle}</h2>
    <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background:${severityBg};color:${severityColor}">${severityLabel}</span>
    <p style="color:#4a4a4a;line-height:1.6;margin-top:16px">${params.updateBody}</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
    <p style="color:#9a9a9a;font-size:12px">You are receiving this because you subscribed to ${params.statusPageName} status updates.</p>
  </div>`;

  const results = await Promise.allSettled(
    params.subscriberEmails.map((email) => sendEmail(client, email, subject, html)),
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) logger.error(`[Notification] ${failed.length} incident emails failed`);
  logger.info(`[Notification] Sent "${params.incidentTitle}" to ${params.subscriberEmails.length - failed.length} subscribers`);
}

export async function sendIncidentResolvedNotification(params: {
  statusPageName: string;
  incidentTitle: string;
  updateBody: string;
  subscriberEmails: string[];
}): Promise<void> {
  if (params.subscriberEmails.length === 0) return;

  const client = getClient();
  if (!client) {
    logger.info(`[Notification] No AWS credentials — skipping resolved "${params.incidentTitle}"`);
    return;
  }

  const subject = `[${params.statusPageName}] ✅ Resolved: ${params.incidentTitle}`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#1a1a1a">✅ Resolved: ${params.incidentTitle}</h2>
    <p style="color:#4a4a4a;line-height:1.6">${params.updateBody}</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
    <p style="color:#9a9a9a;font-size:12px">You are receiving this because you subscribed to ${params.statusPageName} status updates.</p>
  </div>`;

  const results = await Promise.allSettled(
    params.subscriberEmails.map((email) => sendEmail(client, email, subject, html)),
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) logger.error(`[Notification] ${failed.length} resolved emails failed`);
  logger.info(`[Notification] Sent resolved "${params.incidentTitle}" to ${params.subscriberEmails.length - failed.length} subscribers`);
}

export async function sendVerificationEmail(params: {
  email: string;
  statusPageName: string;
  verifyUrl: string;
}): Promise<void> {
  const client = getClient();
  if (!client) {
    logger.info(`[Notification] No AWS credentials — skipping verification to ${params.email}`);
    return;
  }

  try {
    await sendEmail(
      client,
      params.email,
      `Confirm your subscription to ${params.statusPageName}`,
      `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a1a1a">Confirm your subscription</h2>
        <p style="color:#4a4a4a;line-height:1.6">You requested to receive status updates for <strong>${params.statusPageName}</strong>.</p>
        <p style="margin:24px 0">
          <a href="${params.verifyUrl}" style="display:inline-block;padding:12px 24px;background:#00e676;color:#000;text-decoration:none;border-radius:6px;font-weight:600">Confirm Subscription</a>
        </p>
        <p style="color:#9a9a9a;font-size:12px">If you did not request this, you can safely ignore this email.</p>
      </div>`,
    );
    logger.info(`[Notification] Sent verification to ${params.email}`);
  } catch (err) {
    logger.error({ err }, "[Notification] Failed to send verification email");
  }
}

// ── Slack / Discord Webhooks ──

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
    const res = await fetch(params.webhookUrl, {
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
    const res = await fetch(params.webhookUrl, {
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
    const res = await fetch(params.webhookUrl, {
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

export async function sendPagerDutyAlert(params: {
  integrationKey: string;
  type: "incident_created" | "incident_resolved";
  incidentTitle: string;
  severity?: string;
  updateBody: string;
  dedupKey?: string;
}): Promise<void> {
  const eventAction = params.type === "incident_resolved" ? "resolve" : "trigger";
  const pdSeverity =
    params.severity === "critical" ? "critical"
      : params.severity === "major" ? "error"
      : "warning";

  const payload = {
    routing_key: params.integrationKey,
    event_action: eventAction,
    dedup_key: params.dedupKey ?? params.incidentTitle,
    payload: {
      summary: params.incidentTitle,
      severity: pdSeverity,
      source: "UptimeCrow",
      custom_details: { update: params.updateBody },
    },
  };

  try {
    const res = await fetch("https://events.pagerduty.com/v2/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`PagerDuty returned ${res.status}`);
    logger.info(`[Notification] PagerDuty ${eventAction} sent for "${params.incidentTitle}"`);
  } catch (err) {
    logger.error({ err }, "[Notification] PagerDuty alert failed");
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
    const res = await fetch(params.webhookUrl, {
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

export async function sendHeartbeatLateAlert(params: {
  heartbeatName: string;
  slackWebhookUrl?: string | null;
  discordWebhookUrl?: string | null;
}): Promise<void> {
  const title = `💔 Heartbeat missed: ${params.heartbeatName}`;
  const body = `No ping received within the expected window. Check that your scheduled job or cron is running.`;

  if (params.slackWebhookUrl) {
    const payload = {
      attachments: [{
        color: "#ff5370",
        pretext: title,
        fields: [{ title: "Details", value: body, short: false }],
        footer: "UptimeCrow Heartbeats",
        ts: Math.floor(Date.now() / 1000),
      }],
    };
    try {
      const res = await fetch(params.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Slack webhook returned ${res.status}`);
    } catch (err) {
      logger.error({ err }, "[Notification] Heartbeat Slack alert failed");
    }
  }

  if (params.discordWebhookUrl) {
    const payload = {
      embeds: [{
        title,
        description: body,
        color: 0xff5370,
        timestamp: new Date().toISOString(),
        footer: { text: "UptimeCrow Heartbeats" },
      }],
    };
    try {
      const res = await fetch(params.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Discord webhook returned ${res.status}`);
    } catch (err) {
      logger.error({ err }, "[Notification] Heartbeat Discord alert failed");
    }
  }
}

export async function sendDomainExpiryNotification(params: {
  ownerEmail: string;
  monitorName: string;
  monitorUrl: string;
  daysRemaining: number;
  slackWebhookUrl?: string | null;
  discordWebhookUrl?: string | null;
}): Promise<void> {
  const { daysRemaining, monitorName, monitorUrl } = params;
  const expired = daysRemaining < 0;
  const domain = (() => { try { return new URL(monitorUrl).hostname; } catch { return monitorUrl; } })();
  const subject = expired
    ? `⚠️ Domain expired: ${domain}`
    : `⚠️ Domain expiring in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}: ${domain}`;
  const detail = expired
    ? `The domain <strong>${domain}</strong> (monitored as <strong>${monitorName}</strong>) has expired. Renew it immediately to avoid service loss.`
    : `The domain <strong>${domain}</strong> (monitored as <strong>${monitorName}</strong>) expires in <strong>${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}</strong>. Renew it before it expires.`;

  const client = getClient();
  if (client) {
    try {
      await sendEmail(
        client,
        params.ownerEmail,
        subject,
        `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a1a1a">${subject}</h2>
          <p style="color:#4a4a4a;line-height:1.6;margin-top:16px">${detail}</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
          <p style="color:#9a9a9a;font-size:12px">You are receiving this because you own the monitor <strong>${monitorName}</strong> on UptimeCrow.</p>
        </div>`,
      );
      logger.info(`[Notification] Domain expiry email sent to ${params.ownerEmail} for "${domain}"`);
    } catch (err) {
      logger.error({ err }, "[Notification] Domain expiry email failed");
    }
  } else {
    logger.info(`[Notification] No AWS credentials — skipping domain expiry email for "${domain}"`);
  }

  if (params.slackWebhookUrl) {
    const payload = {
      attachments: [{
        color: expired ? "#ff5252" : "#ffab40",
        pretext: subject,
        fields: [
          { title: "Monitor", value: monitorName, short: true },
          { title: "Domain", value: domain, short: true },
          { title: "Status", value: expired ? "Expired" : `Expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`, short: false },
        ],
        footer: "UptimeCrow Domain Monitor",
        ts: Math.floor(Date.now() / 1000),
      }],
    };
    try {
      const res = await fetch(params.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Slack webhook returned ${res.status}`);
    } catch (err) {
      logger.error({ err }, "[Notification] Domain expiry Slack alert failed");
    }
  }

  if (params.discordWebhookUrl) {
    const payload = {
      embeds: [{
        title: subject,
        description: expired
          ? `The domain **${domain}** has expired.`
          : `The domain **${domain}** expires in **${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}**.`,
        color: expired ? 0xff5252 : 0xffab40,
        timestamp: new Date().toISOString(),
        footer: { text: "UptimeCrow Domain Monitor" },
      }],
    };
    try {
      const res = await fetch(params.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Discord webhook returned ${res.status}`);
    } catch (err) {
      logger.error({ err }, "[Notification] Domain expiry Discord alert failed");
    }
  }
}

export async function sendSslExpiryNotification(params: {
  ownerEmail: string;
  monitorName: string;
  monitorUrl: string;
  daysRemaining: number;
  slackWebhookUrl?: string | null;
  discordWebhookUrl?: string | null;
}): Promise<void> {
  const { daysRemaining, monitorName, monitorUrl } = params;
  const expired = daysRemaining < 0;
  const subject = expired
    ? `⚠️ SSL certificate expired: ${monitorName}`
    : `⚠️ SSL certificate expiring in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}: ${monitorName}`;
  const detail = expired
    ? `The SSL certificate for <strong>${monitorUrl}</strong> has expired. Visitors will see a security warning.`
    : `The SSL certificate for <strong>${monitorUrl}</strong> expires in <strong>${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}</strong>. Renew it before it expires to avoid service disruption.`;

  const client = getClient();
  if (client) {
    try {
      await sendEmail(
        client,
        params.ownerEmail,
        subject,
        `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a1a1a">${subject}</h2>
          <p style="color:#4a4a4a;line-height:1.6;margin-top:16px">${detail}</p>
          <p style="color:#4a4a4a;line-height:1.6">Log in to UptimeCrow to update the SSL warning threshold or silence this alert.</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
          <p style="color:#9a9a9a;font-size:12px">You are receiving this because you own the monitor <strong>${monitorName}</strong> on UptimeCrow.</p>
        </div>`,
      );
      logger.info(`[Notification] SSL expiry email sent to ${params.ownerEmail} for "${monitorName}"`);
    } catch (err) {
      logger.error({ err }, "[Notification] SSL expiry email failed");
    }
  } else {
    logger.info(`[Notification] No AWS credentials — skipping SSL expiry email for "${monitorName}"`);
  }

  if (params.slackWebhookUrl) {
    const payload = {
      attachments: [{
        color: expired ? "#ff5252" : "#ffab40",
        pretext: subject,
        fields: [
          { title: "Monitor", value: monitorName, short: true },
          { title: "URL", value: monitorUrl, short: true },
          { title: "Status", value: expired ? "Expired" : `Expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`, short: false },
        ],
        footer: "UptimeCrow SSL Monitor",
        ts: Math.floor(Date.now() / 1000),
      }],
    };
    try {
      const res = await fetch(params.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Slack webhook returned ${res.status}`);
    } catch (err) {
      logger.error({ err }, "[Notification] SSL expiry Slack alert failed");
    }
  }

  if (params.discordWebhookUrl) {
    const payload = {
      embeds: [{
        title: subject,
        description: expired
          ? `The SSL certificate for **${monitorUrl}** has expired.`
          : `The SSL certificate for **${monitorUrl}** expires in **${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}**.`,
        color: expired ? 0xff5252 : 0xffab40,
        timestamp: new Date().toISOString(),
        footer: { text: "UptimeCrow SSL Monitor" },
      }],
    };
    try {
      const res = await fetch(params.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Discord webhook returned ${res.status}`);
    } catch (err) {
      logger.error({ err }, "[Notification] SSL expiry Discord alert failed");
    }
  }
}

export interface SmsAlertParams {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  toNumber: string;
  type: "incident_created" | "incident_resolved";
  statusPageName: string;
  incidentTitle: string;
  severity: string;
}

export async function sendSmsAlert(params: SmsAlertParams): Promise<void> {
  const { accountSid, authToken, fromNumber, toNumber, type, statusPageName, incidentTitle, severity } = params;

  const emoji = type === "incident_resolved" ? "✅" : severity === "critical" ? "🔴" : severity === "major" ? "🟠" : "🟡";
  const verb = type === "incident_resolved" ? "Resolved" : "Incident";
  const body = `${emoji} UptimeCrow ${verb} [${statusPageName}]: ${incidentTitle}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const formData = new URLSearchParams({
    From: fromNumber,
    To: toNumber,
    Body: body,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twilio returned ${res.status}: ${text}`);
    }
    logger.info(`[Notification] SMS sent to ${toNumber} via Twilio`);
  } catch (err) {
    logger.error({ err }, "[Notification] SMS alert failed");
    throw err;
  }
}
