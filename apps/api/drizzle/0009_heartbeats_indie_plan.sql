-- Add indie plan to plan enum (IF NOT EXISTS requires PG 9.6+)
ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'indie' BEFORE 'pro';

-- Create heartbeat_status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'heartbeat_status') THEN
    CREATE TYPE "heartbeat_status" AS ENUM ('healthy', 'late', 'paused', 'unknown');
  END IF;
END $$;

-- Create heartbeats table
CREATE TABLE "heartbeats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "period" integer NOT NULL DEFAULT 86400,
  "grace" integer NOT NULL DEFAULT 300,
  "status" "heartbeat_status" NOT NULL DEFAULT 'unknown',
  "last_ping_at" timestamp with time zone,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "heartbeats_slug_unique" UNIQUE("slug")
);

ALTER TABLE "heartbeats"
  ADD CONSTRAINT "heartbeats_org_id_organizations_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "heartbeats_org_id_idx" ON "heartbeats" ("org_id");
