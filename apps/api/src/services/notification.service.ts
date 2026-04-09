// Notification Service — Email via Resend

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
