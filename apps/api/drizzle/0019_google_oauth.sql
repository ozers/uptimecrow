ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" varchar(255) UNIQUE;
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
