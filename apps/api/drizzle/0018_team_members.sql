CREATE TABLE IF NOT EXISTS "org_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" varchar(20) NOT NULL DEFAULT 'member',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE("org_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "org_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "role" varchar(20) NOT NULL DEFAULT 'member',
  "token" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "org_members_org_id_idx" ON "org_members"("org_id");
CREATE INDEX IF NOT EXISTS "org_invites_org_id_idx" ON "org_invites"("org_id");
