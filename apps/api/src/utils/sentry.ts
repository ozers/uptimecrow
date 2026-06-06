// Optional error tracking via Sentry. No-ops unless SENTRY_DSN is set, so
// self-hosters and local dev are unaffected. Call initSentry() as early as
// possible — @sentry/node's default integrations then auto-capture uncaught
// exceptions and unhandled rejections across both the API and worker process.

import * as Sentry from "@sentry/node";
import { logger } from "./logger.js";

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // disabled — error tracking is opt-in

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    // Off by default — set SENTRY_TRACES_SAMPLE_RATE (0..1) to enable tracing.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0"),
  });
  initialized = true;
  logger.info("[Sentry] Error tracking initialized");
}

// Explicitly report a handled error (e.g. a failed BullMQ job). Safe to call
// when Sentry is disabled — it just no-ops.
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
