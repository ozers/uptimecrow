// Notification Service — Email via Amazon SES + Slack/Discord webhooks

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { logger } from "../utils/logger.js";
import { assertPublicUrl } from "../utils/ssrf.js";

// User-controlled webhook URLs (Slack, Discord, custom) must be
// validated against private/internal address ranges before we dial them —
// otherwise an attacker can configure a webhook that points at the metadata
// service or an internal admin panel and turn our notifier into an SSRF probe.
async function fetchUserWebhook(url: string, init: RequestInit): Promise<Response> {
  await assertPublicUrl(url);
  return fetch(url, init);
}

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
      const res = await fetchUserWebhook(params.slackWebhookUrl, {
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
      const res = await fetchUserWebhook(params.discordWebhookUrl, {
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
      const res = await fetchUserWebhook(params.slackWebhookUrl, {
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
      const res = await fetchUserWebhook(params.discordWebhookUrl, {
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
      const res = await fetchUserWebhook(params.slackWebhookUrl, {
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
      const res = await fetchUserWebhook(params.discordWebhookUrl, {
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

export async function sendSlowResponseNotification(params: {
  ownerEmail: string;
  monitorName: string;
  monitorUrl: string;
  responseMs: number;
  thresholdMs: number;
  slackWebhookUrl?: string | null;
  discordWebhookUrl?: string | null;
}): Promise<void> {
  const { responseMs, thresholdMs, monitorName, monitorUrl } = params;
  const subject = `🐢 Slow response on ${monitorName} — ${responseMs}ms`;
  const detail = `<strong>${monitorUrl}</strong> responded in <strong>${responseMs}ms</strong>, exceeding the configured threshold of <strong>${thresholdMs}ms</strong>. The check still succeeded, but performance has degraded.`;

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
          <p style="color:#4a4a4a;line-height:1.6">Log in to UptimeCrow to adjust the slow-response threshold or investigate the regression.</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
          <p style="color:#9a9a9a;font-size:12px">You are receiving this because you own the monitor <strong>${monitorName}</strong> on UptimeCrow.</p>
        </div>`,
      );
      logger.info(`[Notification] Slow-response email sent for "${monitorName}" (${responseMs}ms)`);
    } catch (err) {
      logger.error({ err }, "[Notification] Slow-response email failed");
    }
  }

  if (params.slackWebhookUrl) {
    const payload = {
      attachments: [{
        color: "#ffab40",
        pretext: subject,
        fields: [
          { title: "Monitor", value: monitorName, short: true },
          { title: "URL", value: monitorUrl, short: true },
          { title: "Response", value: `${responseMs}ms (threshold ${thresholdMs}ms)`, short: false },
        ],
        footer: "UptimeCrow Slow-Response Alert",
        ts: Math.floor(Date.now() / 1000),
      }],
    };
    try {
      const res = await fetchUserWebhook(params.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Slack webhook returned ${res.status}`);
    } catch (err) {
      logger.error({ err }, "[Notification] Slow-response Slack alert failed");
    }
  }

  if (params.discordWebhookUrl) {
    const payload = {
      embeds: [{
        title: subject,
        description: `**${monitorUrl}** responded in **${responseMs}ms** (threshold: ${thresholdMs}ms).`,
        color: 0xffab40,
        timestamp: new Date().toISOString(),
        footer: { text: "UptimeCrow Slow-Response Alert" },
      }],
    };
    try {
      const res = await fetchUserWebhook(params.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Discord webhook returned ${res.status}`);
    } catch (err) {
      logger.error({ err }, "[Notification] Slow-response Discord alert failed");
    }
  }
}
