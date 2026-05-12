ALTER TABLE "monitors" ADD COLUMN IF NOT EXISTS "domain_expires_at" timestamp with time zone;
ALTER TABLE "monitors" ADD COLUMN IF NOT EXISTS "domain_checked_at" timestamp with time zone;
ALTER TABLE "monitors" ADD COLUMN IF NOT EXISTS "domain_days_warning" integer NOT NULL DEFAULT 30;
