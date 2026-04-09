import { Worker } from "bullmq";
import { redis } from "./db/index.js";
import { processCheckJob } from "./jobs/check.job.js";
import { processNotifyJob } from "./jobs/notify.job.js";
import { processGenerateJob } from "./jobs/generate.job.js";

export async function startWorker() {
  const removeOpts = {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
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

  checkWorker.on("failed", (job, err) => {
    console.error(`[Worker] Check job ${job?.id} failed:`, err.message);
  });

  notifyWorker.on("failed", (job, err) => {
    console.error(`[Worker] Notify job ${job?.id} failed:`, err.message);
  });

  generateWorker.on("failed", (job, err) => {
    console.error(`[Worker] Generate job ${job?.id} failed:`, err.message);
  });

  console.log(
    "[Worker] Started workers: monitor-checks, notifications, status-page-generate",
  );
}
