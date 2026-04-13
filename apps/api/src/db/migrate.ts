import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

logger.info("Running migrations...");
await migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });
logger.info("Migrations complete.");

// Post-migration schema repair: ensure columns that have caused issues actually exist.
// Runs every startup as a safety net against Railway Postgres WAL loss on crash.
await client`
  ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS access_token uuid DEFAULT gen_random_uuid()
`;
logger.info("Schema repair complete.");

await client.end();
process.exit(0);
