import * as Sentry from "@sentry/node";

const DSN = process.env.SENTRY_DSN;

export function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0,
  });
}

export { Sentry };
