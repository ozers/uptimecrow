ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "twilio_account_sid" varchar(64);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "twilio_auth_token" varchar(64);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "twilio_from_number" varchar(32);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "twilio_to_number" varchar(32);
