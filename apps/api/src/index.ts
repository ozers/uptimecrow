import { startServer } from "./server.js";
import { startWorker } from "./worker.js";

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
  console.log(`[UptimeCrow] Starting in ${mode} mode...`);

  if (mode === "api" || mode === "all") {
    await startServer();
  }

  if (mode === "worker" || mode === "all") {
    await startWorker();
  }

  console.log(`[UptimeCrow] Running (mode=${mode})`);
}

main().catch((err) => {
  console.error("[UptimeCrow] Fatal error:", err);
  process.exit(1);
});
