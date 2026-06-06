import { Worker, Queue } from "bullmq";
import { redis, db } from "./db/index.js";
import { monitors } from "./db/schema.js";
import { processCheckJob } from "./jobs/check.job.js";
import { processNotifyJob } from "./jobs/notify.job.js";
import { processGenerateJob } from "./jobs/generate.job.js";
import { processRetentionJob } from "./jobs/retention.job.js";
import { processHeartbeatCheckJob } from "./jobs/heartbeat-check.job.js";
import { logger } from "./utils/logger.js";
import { isTerminalFailure } from "./utils/queues.js";
import { captureException } from "./utils/sentry.js";

function logJobFailure(queueName: string, job: { id?: string; attemptsMade?: number; opts?: { attempts?: number } } | undefined, err: Error) {
  const terminal = isTerminalFailure(job);
  logger.error(
    {
      err,
      jobId: job?.id,
      queue: queueName,
      attempt: job?.attemptsMade,
      maxAttempts: job?.opts?.attempts ?? 1,
      dead: terminal,
    },
    terminal
      ? `[Worker] Dead letter: ${queueName} job permanently failed after all retries`
      : `[Worker] ${queueName} job attempt failed, will retry`,
  );
  // Only report permanent failures to Sentry — retries would be noise.
  if (terminal) {
    captureException(err, { queue: queueName, jobId: job?.id });
  }
}

async function cleanOrphanedRepeatableJobs() {
  const checkQueue = new Queue("monitor-checks", { connection: redis });
  try {
    const repeatableJobs = await checkQueue.getRepeatableJobs();
    if (repeatableJobs.length === 0) return;

    // Collect unique monitor IDs from repeatable job IDs (format: repeat-<monitorId>)
    const monitorIds = [
      ...new Set(
        repeatableJobs
          .filter((j) => j.id?.startsWith("repeat-"))
          .map((j) => j.id!.replace("repeat-", "")),
      ),
    ];

    if (monitorIds.length === 0) return;

    // Fetch all existing monitor IDs
    const allExisting = await db.select({ id: monitors.id }).from(monitors);
    const allExistingSet = new Set(allExisting.map((m) => m.id));

    // Remove any repeatable job whose monitor no longer exists, plus duplicates
    const seenMonitorIds = new Set<string>();
    let removed = 0;
    for (const job of repeatableJobs) {
      if (!job.id?.startsWith("repeat-")) continue;
      const monitorId = job.id.replace("repeat-", "");
      if (!allExistingSet.has(monitorId) || seenMonitorIds.has(monitorId)) {
        await checkQueue.removeRepeatableByKey(job.key);
        removed++;
      } else {
        seenMonitorIds.add(monitorId);
      }
    }

    if (removed > 0) {
      logger.info(`[Worker] Cleaned up ${removed} orphaned/duplicate repeatable job(s)`);
    }
  } finally {
    await checkQueue.close();
  }
}

export async function startWorker() {
  await cleanOrphanedRepeatableJobs();

  const removeOpts = {
    removeOnComplete: { count: 0 },
    removeOnFail: { count: 20 },
  };

  const checkWorker = new Worker("monitor-checks", processCheckJob, {
    connection: redis,
    concurrency: 10,
    ...removeOpts,
  });

  const notifyWorker = new Worker("notifications", processNotifyJob, {
    connection: redis,
    concurrency: 5,
    ...removeOpts,
  });

  const generateWorker = new Worker(
    "status-page-generate",
    processGenerateJob,
    {
      connection: redis,
      concurrency: 2,
      ...removeOpts,
    },
  );

  const retentionWorker = new Worker("retention", processRetentionJob, {
    connection: redis,
    concurrency: 1,
    ...removeOpts,
  });

  const heartbeatCheckWorker = new Worker(
    "heartbeat-checks",
    processHeartbeatCheckJob,
    {
      connection: redis,
      concurrency: 1,
      ...removeOpts,
    },
  );

  const retentionQueue = new Queue("retention", { connection: redis });
  // Run once daily at 03:15 UTC — off-peak for most regions.
  await retentionQueue.add(
    "prune-check-results",
    {},
    {
      jobId: "repeat-retention-daily",
      repeat: { pattern: "15 3 * * *" },
    },
  );

  const heartbeatQueue = new Queue("heartbeat-checks", { connection: redis });
  // Run every 60 seconds to detect late heartbeats.
  await heartbeatQueue.add(
    "check-late-heartbeats",
    {},
    {
      jobId: "repeat-heartbeat-check",
      repeat: { every: 60_000 },
    },
  );

  checkWorker.on("failed", (job, err) => logJobFailure("monitor-checks", job, err));
  notifyWorker.on("failed", (job, err) => logJobFailure("notifications", job, err));
  generateWorker.on("failed", (job, err) => logJobFailure("status-page-generate", job, err));
  retentionWorker.on("failed", (job, err) => logJobFailure("retention", job, err));
  heartbeatCheckWorker.on("failed", (job, err) => logJobFailure("heartbeat-checks", job, err));

  logger.info(
    "[Worker] Started workers: monitor-checks, notifications, status-page-generate, retention, heartbeat-checks",
  );
}
