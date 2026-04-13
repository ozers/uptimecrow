import { Worker, Queue } from "bullmq";
import { redis, db } from "./db/index.js";
import { monitors } from "./db/schema.js";
import { processCheckJob } from "./jobs/check.job.js";
import { processNotifyJob } from "./jobs/notify.job.js";
import { processGenerateJob } from "./jobs/generate.job.js";
import { processRetentionJob } from "./jobs/retention.job.js";

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
      console.log(`[Worker] Cleaned up ${removed} orphaned/duplicate repeatable job(s)`);
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

  checkWorker.on("failed", (job, err) => {
    console.error(`[Worker] Check job ${job?.id} failed:`, err.message);
  });

  notifyWorker.on("failed", (job, err) => {
    console.error(`[Worker] Notify job ${job?.id} failed:`, err.message);
  });

  generateWorker.on("failed", (job, err) => {
    console.error(`[Worker] Generate job ${job?.id} failed:`, err.message);
  });

  retentionWorker.on("failed", (job, err) => {
    console.error(`[Worker] Retention job ${job?.id} failed:`, err.message);
  });

  console.log(
    "[Worker] Started workers: monitor-checks, notifications, status-page-generate, retention",
  );
}
