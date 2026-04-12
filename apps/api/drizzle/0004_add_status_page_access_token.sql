ALTER TABLE "status_pages" ADD COLUMN "access_token" uuid DEFAULT gen_random_uuid();
