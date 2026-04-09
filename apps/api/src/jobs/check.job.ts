// Check Job — Monitor ping execution + AI incident creation + notifications

import type { Job } from "bullmq";
import { Queue } from "bullmq";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { redis } from "../db/index.js";
import {
  monitors,
  checkResults,
  incidents,
  incidentUpdates,
  statusPages,
} from "../db/schema.js";
import { executeHttpCheck, executeMultiRegionCheck } from "../services/monitor.service.js";
import { organizations } from "../db/schema.js";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import {
  generateIncidentReport,
  generateResolvedUpdate,
} from "../services/ai.service.js";
import {
  incrementFailureCount,
  resetFailureCount,
  getFailureCount,
  evaluateTransition,
} from "../utils/state-machine.js";

export interface CheckJobData {
  monitorId: string;
}

const notifyQueue = new Queue("notifications", { connection: redis });
const generateQueue = new Queue("status-page-generate", {
  connection: redis,
});

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

  let result;
  if (useMultiRegion) {
    const multiResult = await executeMultiRegionCheck(monitor.url, {
      timeoutMs: monitor.timeoutMs,
      expectedStatus: monitor.expectedStatus,
    });
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
    result = await executeHttpCheck(monitor.url, {
      timeoutMs: monitor.timeoutMs,
      expectedStatus: monitor.expectedStatus,
    });
    await db.insert(checkResults).values({
      monitorId,
      status: result.status,
      responseMs: result.responseMs,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      region: result.region,
    });
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

async function handleDownTransition(
  monitor: typeof monitors.$inferSelect,
  result: { errorMessage: string | null; statusCode: number | null; responseMs: number | null },
  failures: number,
): Promise<void> {
  console.log(`[Check] Monitor ${monitor.name} transitioned to DOWN`);

  // Find status page for this monitor's org
  const [page] = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.orgId, monitor.orgId))
    .limit(1);

  if (!page) return;

  // Generate AI incident report
  const aiResult = await generateIncidentReport({
    serviceName: monitor.name,
    url: monitor.url,
    error: result.errorMessage || "Service unreachable",
    statusCode: result.statusCode ?? undefined,
    responseMs: result.responseMs ?? undefined,
    failedChecks: failures,
    detectedAt: new Date().toISOString(),
  });

  // Create incident
  const [incident] = await db
    .insert(incidents)
    .values({
      orgId: monitor.orgId,
      statusPageId: page.id,
      monitorId: monitor.id,
      title: aiResult.title,
      status: "investigating",
      severity: aiResult.severity,
      isAiGenerated: true,
    })
    .returning();

  // Create initial incident update
  await db.insert(incidentUpdates).values({
    incidentId: incident.id,
    status: "investigating",
    body: aiResult.updateText,
    isAiGenerated: true,
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
  console.log(`[Check] Monitor ${monitor.name} transitioned to UP`);

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

  // Generate AI resolved update
  const resolvedText = await generateResolvedUpdate({
    serviceName: monitor.name,
    downtimeMinutes,
    incidentTitle: openIncident.title,
  });

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
    isAiGenerated: true,
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
