CREATE TABLE IF NOT EXISTS "on_call_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL DEFAULT 'Default',
  "rotation_days" integer NOT NULL DEFAULT 7,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "on_call_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "schedule_id" uuid NOT NULL REFERENCES "on_call_schedules"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "email" varchar(255),
  "phone" varchar(32),
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "on_call_schedules_org_id_idx" ON "on_call_schedules"("org_id");
CREATE INDEX IF NOT EXISTS "on_call_contacts_schedule_id_idx" ON "on_call_contacts"("schedule_id");
