// Notification Service — Email via Resend + Slack/Discord webhooks

import { Resend } from "resend";

const getClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const FROM_EMAIL = "UptimeCrow <notifications@uptimecrow.com>";

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
    console.log(
      `[Notification] No RESEND_API_KEY — would send "${params.incidentTitle}" to ${params.subscriberEmails.length} subscribers`,
    );
    return;
  }

  const severityLabel =
    params.severity === "critical"
      ? "🔴 Critical"
      : params.severity === "major"
        ? "🟠 Major"
        : "🟡 Minor";

  try {
    await client.batch.send(
      params.subscriberEmails.map((email) => ({
        from: FROM_EMAIL,
        to: email,
        subject: `[${params.statusPageName}] ${severityLabel}: ${params.incidentTitle}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">${params.incidentTitle}</h2>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; background: ${params.severity === "critical" ? "#fee2e2" : params.severity === "major" ? "#ffedd5" : "#fef9c3"}; color: ${params.severity === "critical" ? "#dc2626" : params.severity === "major" ? "#ea580c" : "#ca8a04"};">${severityLabel}</span>
            <p style="color: #4a4a4a; line-height: 1.6; margin-top: 16px;">${params.updateBody}</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #9a9a9a; font-size: 12px;">You are receiving this because you subscribed to ${params.statusPageName} status updates.</p>
          </div>
        `,
      })),
    );
    console.log(
      `[Notification] Sent "${params.incidentTitle}" to ${params.subscriberEmails.length} subscribers`,
    );
  } catch (err) {
    console.error("[Notification] Failed to send incident emails:", err);
  }
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
    console.log(
      `[Notification] No RESEND_API_KEY — would send resolved "${params.incidentTitle}" to ${params.subscriberEmails.length} subscribers`,
    );
    return;
  }

  try {
    await client.batch.send(
      params.subscriberEmails.map((email) => ({
        from: FROM_EMAIL,
        to: email,
        subject: `[${params.statusPageName}] ✅ Resolved: ${params.incidentTitle}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">✅ Resolved: ${params.incidentTitle}</h2>
            <p style="color: #4a4a4a; line-height: 1.6;">${params.updateBody}</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #9a9a9a; font-size: 12px;">You are receiving this because you subscribed to ${params.statusPageName} status updates.</p>
          </div>
        `,
      })),
    );
    console.log(
      `[Notification] Sent resolved "${params.incidentTitle}" to ${params.subscriberEmails.length} subscribers`,
    );
  } catch (err) {
    console.error("[Notification] Failed to send resolved emails:", err);
  }
}

export async function sendVerificationEmail(params: {
  email: string;
  statusPageName: string;
  verifyUrl: string;
}): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log(
      `[Notification] No RESEND_API_KEY — would send verification to ${params.email}`,
    );
    return;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `Confirm your subscription to ${params.statusPageName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Confirm your subscription</h2>
          <p style="color: #4a4a4a; line-height: 1.6;">You requested to receive status updates for <strong>${params.statusPageName}</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${params.verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #00e676; color: #000; text-decoration: none; border-radius: 6px; font-weight: 600;">Confirm Subscription</a>
          </p>
          <p style="color: #9a9a9a; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`[Notification] Sent verification to ${params.email}`);
  } catch (err) {
    console.error("[Notification] Failed to send verification email:", err);
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
  const color = params.type === "incident_resolved" ? "#00e676"
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
    console.log(`[Notification] Slack webhook sent for "${params.incidentTitle}"`);
  } catch (err) {
    console.error("[Notification] Slack webhook failed:", err);
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
  const color = params.type === "incident_resolved" ? 0x00e676
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
    console.log(`[Notification] Discord webhook sent for "${params.incidentTitle}"`);
  } catch (err) {
    console.error("[Notification] Discord webhook failed:", err);
  }
}
