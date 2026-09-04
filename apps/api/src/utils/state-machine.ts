import { redis } from "../db/index.js";

const FAILURE_KEY_PREFIX = "monitor:failures:";

export async function incrementFailureCount(monitorId: string): Promise<number> {
  return redis.incr(`${FAILURE_KEY_PREFIX}${monitorId}`);
}

export async function resetFailureCount(monitorId: string): Promise<void> {
  await redis.del(`${FAILURE_KEY_PREFIX}${monitorId}`);
}

export { evaluateTransition } from "./state-transition.js";
export type { StateTransition } from "./state-transition.js";
