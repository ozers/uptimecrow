ALTER TABLE "status_pages" ADD COLUMN IF NOT EXISTS "access_token" uuid DEFAULT gen_random_uuid();
