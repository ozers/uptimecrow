// Check Job — Monitor ping execution + incident creation + notifications

import type { Job } from "bullmq";
import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  monitors,
  checkResults,
  incidents,
  incidentUpdates,
  statusPages,
  maintenanceWindows,
  maintenanceWindowMonitors,
} from "../db/schema.js";
import { makeQueue } from "../utils/queues.js";
import { checkSslExpiry, executeHttpCheck, executeMultiRegionCheck, executeTcpCheck } from "../services/monitor.service.js";
import { organizations } from "../db/schema.js";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import {
  incrementFailureCount,
  resetFailureCount,
  evaluateTransition,
} from "../utils/state-machine.js";
import { logger } from "../utils/logger.js";

export interface CheckJobData {
  monitorId: string;
}

const notifyQueue = makeQueue("notifications");
const generateQueue = makeQueue("status-page-generate");

export async function processCheckJob(job: Job<CheckJobData>): Promise<void> {
  const { monitorId } = job.data;

  const [monitor] = await db
    .select()
    .from(monitors)
    .where(eq(monitors.id, monitorId))
    .limit(1);

  if (!monitor || !monitor.isActive) return;

  // Check if org has multi-region enabled
  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, monitor.orgId))
    .limit(1);

  const planLimits = PLAN_LIMITS[org?.plan || "free"];
  const useMultiRegion = planLimits.multiRegion;

  const checkOpts = {
    timeoutMs: monitor.timeoutMs,
    expectedStatus: monitor.expectedStatus,
    keyword: monitor.keyword,
  };

  let result;
  if (monitor.type === "tcp") {
    // TCP checks don't multi-region today (most users add TCP for internal
    // services where multi-region from third-party IPs doesn't make sense).
    result = await executeTcpCheck(monitor.url, { timeoutMs: monitor.timeoutMs });
    await db.insert(checkResults).values({
      monitorId,
      status: result.status,
      responseMs: result.responseMs,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      region: result.region,
    });
  } else if (useMultiRegion) {
    const multiResult = await executeMultiRegionCheck(monitor.url, checkOpts);
    // Record each region's result
    for (const r of multiResult.results) {
      await db.insert(checkResults).values({
        monitorId,
        status: r.status,
        responseMs: r.responseMs,
        statusCode: r.statusCode,
        errorMessage: r.errorMessage,
        region: r.region,
      });
    }
    // Use the primary region result for response time display
    const primary = multiResult.results[0];
    result = { ...primary, status: multiResult.overallStatus };
  } else {
    result = await executeHttpCheck(monitor.url, checkOpts);
    await db.insert(checkResults).values({
      monitorId,
      status: result.status,
      responseMs: result.responseMs,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      region: result.region,
    });
  }

  // SSL check for HTTPS monitors — re-checked at most once per 24h to avoid per-ping TLS overhead
  if (monitor.type !== "tcp" && monitor.url.startsWith("https://")) {
    const SSL_TTL_MS = 24 * 60 * 60 * 1000;
    const needsRefresh = !monitor.sslCheckedAt ||
      Date.now() - new Date(monitor.sslCheckedAt).getTime() > SSL_TTL_MS;

    let sslExpiresAt = monitor.sslExpiresAt ? new Date(monitor.sslExpiresAt) : null;
    if (needsRefresh) {
      const ssl = await checkSslExpiry(monitor.url);
      sslExpiresAt = ssl.expiresAt;
      await db.update(monitors).set({ sslExpiresAt: ssl.expiresAt, sslCheckedAt: new Date() }).where(eq(monitors.id, monitorId));
    }

    if (sslExpiresAt) {
      const daysRemaining = Math.floor((sslExpiresAt.getTime() - Date.now()) / 86_400_000);
      if (daysRemaining < 14 && result.status === "up") {
        const daysMsg = daysRemaining < 0
          ? "SSL certificate has expired"
          : `SSL certificate expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;
        result = { ...result, status: "degraded" as const, errorMessage: daysMsg };
      }
    }
  }

  // Update monitor status
  await db
    .update(monitors)
    .set({
      lastCheckedAt: new Date(),
      lastResponseMs: result.responseMs,
    })
    .where(eq(monitors.id, monitorId));

  // Evaluate state transition
  const checkPassed = result.status === "up";

  if (!checkPassed) {
    const failures = await incrementFailureCount(monitorId);
    const transition = evaluateTransition(
      monitor.status,
      false,
      failures,
      monitor.confirmationCount,
    );

    if (transition === "up_to_down") {
      await db
        .update(monitors)
        .set({ status: "down" })
        .where(eq(monitors.id, monitorId));

      await handleDownTransition(monitor, result, failures);
    }
  } else {
    const transition = evaluateTransition(
      monitor.status,
      true,
      0,
      monitor.confirmationCount,
    );

    if (transition === "down_to_up") {
      await resetFailureCount(monitorId);
      await db
        .update(monitors)
        .set({ status: "up" })
        .where(eq(monitors.id, monitorId));

      await handleUpTransition(monitor);
    } else {
      await resetFailureCount(monitorId);
      if (monitor.status === "unknown") {
        await db
          .update(monitors)
          .set({ status: "up" })
          .where(eq(monitors.id, monitorId));
      }
    }
  }
}

async function isMonitorUnderActiveMaintenance(monitorId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const rows = await db
    .select({ id: maintenanceWindows.id })
    .from(maintenanceWindows)
    .innerJoin(
      maintenanceWindowMonitors,
      eq(maintenanceWindowMonitors.maintenanceWindowId, maintenanceWindows.id),
    )
    .where(
      and(
        eq(maintenanceWindowMonitors.monitorId, monitorId),
        sql`${maintenanceWindows.status} IN ('scheduled', 'in_progress')`,
        sql`${maintenanceWindows.scheduledStart} <= ${now}`,
        sql`${maintenanceWindows.scheduledEnd} >= ${now}`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function handleDownTransition(
  monitor: typeof monitors.$inferSelect,
  result: { errorMessage: string | null; statusCode: number | null; responseMs: number | null },
  failures: number,
): Promise<void> {
  logger.info(`[Check] Monitor ${monitor.name} transitioned to DOWN`);

  // Suppress incident creation if the monitor is under an active, operator-
  // declared maintenance window. We still recorded the check_result above, so
  // history is accurate — we just don't page subscribers for expected downtime.
  if (await isMonitorUnderActiveMaintenance(monitor.id)) {
    logger.info(`[Check] Suppressing incident for ${monitor.name} — active maintenance window`);
    return;
  }

  // Find status page for this monitor's org
  const [page] = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.orgId, monitor.orgId))
    .limit(1);

  if (!page) return;

  const statusCode = result.statusCode ? ` (HTTP ${result.statusCode})` : "";
  const errorDetail = result.errorMessage ? `: ${result.errorMessage}` : "";
  const title = `${monitor.name} is down`;
  const severity = result.statusCode && result.statusCode >= 500 ? "major" : "minor";
  const updateText = `We detected that ${monitor.name} is not responding${statusCode}${errorDetail}. Our team has been notified and is investigating.`;

  // Create incident
  const [incident] = await db
    .insert(incidents)
    .values({
      orgId: monitor.orgId,
      statusPageId: page.id,
      monitorId: monitor.id,
      title,
      status: "investigating",
      severity,
      isAiGenerated: false,
    })
    .returning();

  // Create initial incident update
  await db.insert(incidentUpdates).values({
    incidentId: incident.id,
    status: "investigating",
    body: updateText,
    isAiGenerated: false,
  });

  // Queue notification to subscribers
  await notifyQueue.add("incident_created", {
    type: "incident_created",
    statusPageId: page.id,
    incidentId: incident.id,
  });

  // Queue status page regeneration
  await generateQueue.add("regenerate", {
    statusPageId: page.id,
  });
}

async function handleUpTransition(
  monitor: typeof monitors.$inferSelect,
): Promise<void> {
  logger.info(`[Check] Monitor ${monitor.name} transitioned to UP`);

  // Find open incident for this monitor
  const [openIncident] = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.monitorId, monitor.id),
        isNull(incidents.resolvedAt),
      ),
    )
    .limit(1);

  if (!openIncident) return;

  // Calculate downtime
  const downtimeMs = Date.now() - openIncident.startedAt.getTime();
  const downtimeMinutes = Math.round(downtimeMs / 60000);
  const downtimeText = downtimeMinutes < 60
    ? `${downtimeMinutes} minute${downtimeMinutes !== 1 ? "s" : ""}`
    : `${Math.round(downtimeMinutes / 60)} hour${Math.round(downtimeMinutes / 60) !== 1 ? "s" : ""}`;

  const resolvedText = `${monitor.name} has recovered and is responding normally. Total downtime was approximately ${downtimeText}.`;

  // Resolve incident
  await db
    .update(incidents)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
    })
    .where(eq(incidents.id, openIncident.id));

  // Create resolved update
  await db.insert(incidentUpdates).values({
    incidentId: openIncident.id,
    status: "resolved",
    body: resolvedText,
    isAiGenerated: false,
  });

  // Queue notification
  await notifyQueue.add("incident_resolved", {
    type: "incident_resolved",
    statusPageId: openIncident.statusPageId,
    incidentId: openIncident.id,
  });

  // Queue status page regeneration
  await generateQueue.add("regenerate", {
    statusPageId: openIncident.statusPageId,
  });
}
