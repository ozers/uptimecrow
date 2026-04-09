import { startServer } from "./server.js";
import { startWorker } from "./worker.js";

const mode = process.env.MODE || "all";

async function main() {
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
