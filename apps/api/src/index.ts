import { initSentry } from "./utils/sentry.js";
initSentry();
import { startServer } from "./server.js";
import { startWorker } from "./worker.js";
import { redis, db } from "./db/index.js";
import { logger } from "./utils/logger.js";

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
  assertProductionSecrets();
  logger.info(`[UptimeCrow] Starting in ${mode} mode...`);

  let httpServer: { close: (cb?: () => void) => void } | undefined;
  let workerHandles: Awaited<ReturnType<typeof startWorker>> | undefined;

  if (mode === "api" || mode === "all") {
    httpServer = await startServer();
  }

  if (mode === "worker" || mode === "all") {
    workerHandles = await startWorker();
  }

  logger.info(`[UptimeCrow] Running (mode=${mode})`);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "[UptimeCrow] Shutting down gracefully");
    try {
      if (workerHandles) {
        await Promise.all([
          workerHandles.checkWorker.close(),
          workerHandles.notifyWorker.close(),
          workerHandles.generateWorker.close(),
          workerHandles.retentionWorker.close(),
          workerHandles.heartbeatCheckWorker.close(),
        ]);
        logger.info("[UptimeCrow] BullMQ workers closed");
      }
      if (httpServer) {
        await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
        logger.info("[UptimeCrow] HTTP server closed");
      }
      await redis.quit();
      // db uses postgres-js; the underlying client is not directly exposed from
      // drizzle, so we rely on the process exiting to release the pool.
      logger.info("[UptimeCrow] Redis disconnected");
    } catch (err) {
      logger.error({ err }, "[UptimeCrow] Error during shutdown");
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "[UptimeCrow] Fatal error");
  process.exit(1);
});
