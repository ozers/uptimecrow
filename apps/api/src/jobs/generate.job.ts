// Generate Job — Status page regeneration
// Will be fully implemented in Week 3

import type { Job } from "bullmq";
import { regenerateStatusPage } from "../services/static-gen.service.js";

export interface GenerateJobData {
  statusPageId: string;
}

export async function processGenerateJob(job: Job<GenerateJobData>): Promise<void> {
  await regenerateStatusPage(job.data.statusPageId);
}
