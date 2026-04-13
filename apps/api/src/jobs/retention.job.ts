import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { PLAN_LIMITS, PLANS, type Plan } from "@uptimecrow/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RetentionCutoff {
  plan: Plan;
  cutoff: Date;
}

// Pure — computed once per run so the cutoff doesn't drift mid-run.
export function computeCutoffs(now: Date = new Date()): RetentionCutoff[] {
  return PLANS.map((plan) => ({
    plan,
    cutoff: new Date(now.getTime() - PLAN_LIMITS[plan].retentionDays * DAY_MS),
  }));
}

export interface RetentionResult {
  plan: Plan;
  deleted: number;
}

// Deletes check_results rows older than each org's plan retention window.
// Runs one DELETE per plan tier — small number (3) and each is bounded by
// the index on (monitor_id, checked_at).
export async function pruneOldCheckResults(): Promise<RetentionResult[]> {
  const cutoffs = computeCutoffs();
  const results: RetentionResult[] = [];

  for (const { plan, cutoff } of cutoffs) {
    const res = await db.execute(sql`
      DELETE FROM check_results
      WHERE id IN (
        SELECT cr.id
        FROM check_results cr
        JOIN monitors m ON m.id = cr.monitor_id
        JOIN organizations o ON o.id = m.org_id
        WHERE o.plan = ${plan}
          AND cr.checked_at < ${cutoff.toISOString()}
      )
    `);
    const deleted = (res as unknown as { count?: number; rowCount?: number }).count
      ?? (res as unknown as { rowCount?: number }).rowCount
      ?? 0;
    results.push({ plan, deleted });
  }

  return results;
}

export async function processRetentionJob(): Promise<void> {
  const results = await pruneOldCheckResults();
  const summary = results.map((r) => `${r.plan}=${r.deleted}`).join(" ");
  console.log(`[Retention] Pruned check_results: ${summary}`);
}
