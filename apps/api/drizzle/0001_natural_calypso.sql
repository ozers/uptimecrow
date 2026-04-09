CREATE TABLE IF NOT EXISTS "status_page_monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status_page_id" uuid NOT NULL,
	"monitor_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "status_page_monitors" ADD CONSTRAINT "status_page_monitors_status_page_id_status_pages_id_fk" FOREIGN KEY ("status_page_id") REFERENCES "public"."status_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "status_page_monitors" ADD CONSTRAINT "status_page_monitors_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spm_status_page_id_idx" ON "status_page_monitors" USING btree ("status_page_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spm_monitor_id_idx" ON "status_page_monitors" USING btree ("monitor_id");