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

// Postgres error codes that mean "the desired schema state is already in
// place" — safe to log and continue on Railway where WAL loss can wipe
// __drizzle_migrations while leaving the actual schema intact.
const TOLERABLE_CODES = new Set([
  "42701", // duplicate_column
  "42P07", // duplicate_table
  "42710", // duplicate_object
  "42P06", // duplicate_schema
]);

logger.info("Running migrations...");
try {
  await migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });
  logger.info("Migrations complete.");
} catch (err: unknown) {
  const code = (err as { code?: string } | null)?.code;
  if (code && TOLERABLE_CODES.has(code)) {
    logger.warn(
      { code, err },
      "Migration step hit a duplicate-object error — schema already has the target state, continuing",
    );
  } else {
    logger.error({ err }, "Migration failed");
    await client.end();
    process.exit(1);
  }
}

// Post-migration schema repair: ensure columns that have caused issues actually exist.
// Runs every startup as a safety net against Railway Postgres WAL loss on crash.
await client`
  ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS access_token uuid DEFAULT gen_random_uuid()
`;
logger.info("Schema repair complete.");

await client.end();
process.exit(0);
