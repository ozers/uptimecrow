import { Queue, type QueueOptions } from "bullmq";
import { redis } from "../db/index.js";

// Shared retry/backoff policy for one-shot jobs. Repeatable jobs (monitor
// checks, retention) don't use this — they just re-run on the next tick.
export const DEFAULT_JOB_OPTIONS: QueueOptions["defaultJobOptions"] = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  // Keep the last 100 failed jobs so ops can inspect payloads after a bad
  // deploy; successful jobs are discarded immediately to save Redis memory.
  removeOnComplete: { count: 0 },
  removeOnFail: { count: 100 },
};

// Produce a Queue with our retry defaults baked in.
export function makeQueue(name: string): Queue {
  return new Queue(name, {
    connection: redis,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
}

// Returns true when a worker's "failed" event corresponds to the final retry
// attempt — i.e. the job is now a dead letter. Used to tag logs so ops can
// alert on permanent failures separately from transient retry losses.
export function isTerminalFailure(job: { attemptsMade?: number; opts?: { attempts?: number } } | undefined): boolean {
  if (!job) return true;
  const attempts = job.opts?.attempts ?? 1;
  return (job.attemptsMade ?? 0) >= attempts;
}
