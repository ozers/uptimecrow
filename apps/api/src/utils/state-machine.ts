// State Machine — UP/DOWN transition logic
// Will be fully implemented in Week 2

import { redis } from "../db/index.js";

const FAILURE_KEY_PREFIX = "monitor:failures:";

export async function getFailureCount(monitorId: string): Promise<number> {
  const count = await redis.get(`${FAILURE_KEY_PREFIX}${monitorId}`);
  return count ? parseInt(count, 10) : 0;
}

export async function incrementFailureCount(monitorId: string): Promise<number> {
  return redis.incr(`${FAILURE_KEY_PREFIX}${monitorId}`);
}

export async function resetFailureCount(monitorId: string): Promise<void> {
  await redis.del(`${FAILURE_KEY_PREFIX}${monitorId}`);
}

export type StateTransition = "none" | "up_to_down" | "down_to_up";

export function evaluateTransition(
  currentStatus: string,
  checkPassed: boolean,
  failureCount: number,
  confirmationCount: number,
): StateTransition {
  if (currentStatus === "up" || currentStatus === "unknown") {
    if (!checkPassed && failureCount >= confirmationCount) {
      return "up_to_down";
    }
  }

  if (currentStatus === "down") {
    if (checkPassed) {
      return "down_to_up";
    }
  }

  return "none";
}
