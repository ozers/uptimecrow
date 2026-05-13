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
  {
    sql: `ALTER TABLE monitors ADD COLUMN IF NOT EXISTS ssl_days_warning integer NOT NULL DEFAULT 30`,
    desc: "monitors.ssl_days_warning",
  },
  {
    sql: `ALTER TABLE monitors ADD COLUMN IF NOT EXISTS domain_expires_at timestamp with time zone`,
    desc: "monitors.domain_expires_at",
  },
  {
    sql: `ALTER TABLE monitors ADD COLUMN IF NOT EXISTS domain_checked_at timestamp with time zone`,
    desc: "monitors.domain_checked_at",
  },
  {
    sql: `ALTER TABLE monitors ADD COLUMN IF NOT EXISTS domain_days_warning integer NOT NULL DEFAULT 30`,
    desc: "monitors.domain_days_warning",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pagerduty_integration_key varchar(255)`,
    desc: "organizations.pagerduty_integration_key",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS teams_webhook_url varchar(2048)`,
    desc: "organizations.teams_webhook_url",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS telegram_bot_token varchar(255)`,
    desc: "organizations.telegram_bot_token",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS telegram_chat_id varchar(100)`,
    desc: "organizations.telegram_chat_id",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS twilio_account_sid varchar(64)`,
    desc: "organizations.twilio_account_sid",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS twilio_auth_token varchar(64)`,
    desc: "organizations.twilio_auth_token",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS twilio_from_number varchar(32)`,
    desc: "organizations.twilio_from_number",
  },
  {
    sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS twilio_to_number varchar(32)`,
    desc: "organizations.twilio_to_number",
  },
  {
    sql: `ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS webhook_url varchar(2048)`,
    desc: "subscribers.webhook_url",
  },
  {
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id varchar(255)`,
    desc: "users.google_id",
  },
  {
    sql: `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
    desc: "users.password_hash nullable",
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS org_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role varchar(20) NOT NULL DEFAULT 'member',
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      UNIQUE(org_id, user_id)
    )`,
    desc: "org_members table",
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS org_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      email varchar(255) NOT NULL,
      role varchar(20) NOT NULL DEFAULT 'member',
      token uuid NOT NULL DEFAULT gen_random_uuid(),
      expires_at timestamp with time zone NOT NULL,
      accepted_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT org_invites_token_unique UNIQUE(token)
    )`,
    desc: "org_invites table",
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS on_call_schedules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL DEFAULT 'Default',
      rotation_days integer NOT NULL DEFAULT 7,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    )`,
    desc: "on_call_schedules table",
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS on_call_contacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      schedule_id uuid NOT NULL REFERENCES on_call_schedules(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      email varchar(255),
      phone varchar(32),
      position integer NOT NULL DEFAULT 0,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    )`,
    desc: "on_call_contacts table",
  },
  {
    sql: `ALTER TABLE check_results ADD COLUMN IF NOT EXISTS region varchar(20) NOT NULL DEFAULT 'eu-west'`,
    desc: "check_results.region",
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
