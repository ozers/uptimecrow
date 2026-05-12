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

// Post-migration schema repair: idempotent DDL for columns/types that Drizzle may
// have skipped if a previous migration hit a tolerable error and halted early.
// Runs every startup — all statements use IF NOT EXISTS so they are no-ops when
// the schema is already correct.
const repairs: Array<{ sql: string; desc: string }> = [
  {
    sql: `ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS access_token uuid DEFAULT gen_random_uuid()`,
    desc: "status_pages.access_token",
  },
  {
    sql: `ALTER TABLE monitors ADD COLUMN IF NOT EXISTS ssl_expires_at timestamp with time zone`,
    desc: "monitors.ssl_expires_at",
  },
  {
    sql: `ALTER TABLE monitors ADD COLUMN IF NOT EXISTS ssl_checked_at timestamp with time zone`,
    desc: "monitors.ssl_checked_at",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_webhook_url varchar(2048)`,
    desc: "organizations.custom_webhook_url",
  },
  {
    sql: `ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'indie' BEFORE 'pro'`,
    desc: "plan enum: indie",
  },
  {
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'heartbeat_status') THEN
        CREATE TYPE heartbeat_status AS ENUM ('healthy', 'late', 'paused', 'unknown');
      END IF;
    END $$`,
    desc: "heartbeat_status enum",
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS heartbeats (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      slug varchar(100) NOT NULL,
      period integer NOT NULL DEFAULT 86400,
      grace integer NOT NULL DEFAULT 300,
      status heartbeat_status NOT NULL DEFAULT 'unknown',
      last_ping_at timestamp with time zone,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT heartbeats_slug_unique UNIQUE(slug)
    )`,
    desc: "heartbeats table",
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS heartbeats_org_id_idx ON heartbeats (org_id)`,
    desc: "heartbeats_org_id_idx",
  },
];

let repairErrors = 0;
for (const { sql, desc } of repairs) {
  try {
    await client.unsafe(sql);
  } catch (repairErr: unknown) {
    const repairCode = (repairErr as { code?: string } | null)?.code;
    if (repairCode === "42P01") {
      logger.warn(`Schema repair skipped [${desc}] — base table not yet created`);
    } else {
      logger.error({ err: repairErr }, `Schema repair failed [${desc}]`);
      repairErrors++;
    }
  }
}
if (repairErrors === 0) {
  logger.info("Schema repair complete.");
} else {
  logger.warn(`Schema repair finished with ${repairErrors} error(s) — check logs above`);
}

await client.end();
process.exit(0);
