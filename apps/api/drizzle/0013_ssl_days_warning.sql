ALTER TABLE "monitors" ADD COLUMN IF NOT EXISTS "ssl_days_warning" integer NOT NULL DEFAULT 30;
