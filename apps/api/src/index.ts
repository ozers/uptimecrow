import { startServer } from "./server.js";
import { startWorker } from "./worker.js";
import { logger } from "./utils/logger.js";
import { initSentry, captureException } from "./utils/sentry.js";

const mode = process.env.MODE || "all";

const INSECURE_JWT_DEFAULTS = new Set([
  "",
  "change-me-in-production",
  "dev-secret-change-in-production",
]);

function assertProductionSecrets() {
  if (process.env.NODE_ENV !== "production") return;
  const secret = process.env.JWT_SECRET ?? "";
  if (INSECURE_JWT_DEFAULTS.has(secret) || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing, a known default, or shorter than 32 characters. Set a strong random secret before running in production.",
    );
  }
}

async function main() {
  initSentry();
  assertProductionSecrets();
  logger.info(`[UptimeCrow] Starting in ${mode} mode...`);

  if (mode === "api" || mode === "all") {
    await startServer();
  }

  if (mode === "worker" || mode === "all") {
    await startWorker();
  }

  logger.info(`[UptimeCrow] Running (mode=${mode})`);
}

main().catch((err) => {
  captureException(err, { phase: "startup", mode });
  logger.error({ err }, "[UptimeCrow] Fatal error");
  process.exit(1);
});
