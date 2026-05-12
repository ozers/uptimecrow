CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance_window_monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maintenance_window_id" uuid NOT NULL,
	"monitor_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"status_page_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"body" text,
	"status" "maintenance_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "status_pages" ADD COLUMN IF NOT EXISTS "access_token" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_window_monitors" ADD CONSTRAINT "maintenance_window_monitors_maintenance_window_id_maintenance_windows_id_fk" FOREIGN KEY ("maintenance_window_id") REFERENCES "public"."maintenance_windows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_window_monitors" ADD CONSTRAINT "maintenance_window_monitors_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_windows" ADD CONSTRAINT "maintenance_windows_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_windows" ADD CONSTRAINT "maintenance_windows_status_page_id_status_pages_id_fk" FOREIGN KEY ("status_page_id") REFERENCES "public"."status_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mwm_maintenance_window_id_idx" ON "maintenance_window_monitors" USING btree ("maintenance_window_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mwm_monitor_id_idx" ON "maintenance_window_monitors" USING btree ("monitor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_windows_org_id_idx" ON "maintenance_windows" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_windows_status_page_id_idx" ON "maintenance_windows" USING btree ("status_page_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_windows_window_idx" ON "maintenance_windows" USING btree ("scheduled_start","scheduled_end");