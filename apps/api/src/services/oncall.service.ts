// On-Call Service — PagerDuty Events API v2 integration

import { logger } from "../utils/logger.js";

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
