import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigserial,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import type { Recurrence } from "@uptimecrow/shared";

// ── Enums ──

export const planEnum = pgEnum("plan", ["free", "indie", "pro", "team"]);
export const monitorTypeEnum = pgEnum("monitor_type", ["http", "tcp", "keyword"]);
export const monitorStatusEnum = pgEnum("monitor_status", ["up", "down", "degraded", "unknown"]);
export const checkStatusEnum = pgEnum("check_status", ["up", "down", "degraded"]);
export const incidentStatusEnum = pgEnum("incident_status", [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
]);
export const incidentSeverityEnum = pgEnum("incident_severity", ["minor", "major", "critical"]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);
export const heartbeatStatusEnum = pgEnum("heartbeat_status", [
  "healthy",
  "late",
  "paused",
  "unknown",
]);

// ── Tables ──

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull().default("free"),
  aiTokensUsed: integer("ai_tokens_used").notNull().default(0),
  slackWebhookUrl: varchar("slack_webhook_url", { length: 2048 }),
  discordWebhookUrl: varchar("discord_webhook_url", { length: 2048 }),
  customWebhookUrl: varchar("custom_webhook_url", { length: 2048 }),
  pagerdutyIntegrationKey: varchar("pagerduty_integration_key", { length: 255 }),
  teamsWebhookUrl: varchar("teams_webhook_url", { length: 2048 }),
  telegramBotToken: varchar("telegram_bot_token", { length: 255 }),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }),
  twilioAccountSid: varchar("twilio_account_sid", { length: 64 }),
  twilioAuthToken: varchar("twilio_auth_token", { length: 64 }),
  twilioFromNumber: varchar("twilio_from_number", { length: 32 }),
  twilioToNumber: varchar("twilio_to_number", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const monitors = pgTable(
  "monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    type: monitorTypeEnum("type").notNull().default("http"),
    method: varchar("method", { length: 8 }).notNull().default("GET"),
    intervalSeconds: integer("interval_seconds").notNull().default(60),
    timeoutMs: integer("timeout_ms").notNull().default(10000),
    expectedStatus: integer("expected_status").notNull().default(200),
    confirmationCount: integer("confirmation_count").notNull().default(2),
    keyword: varchar("keyword", { length: 500 }),
    status: monitorStatusEnum("status").notNull().default("unknown"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastResponseMs: integer("last_response_ms"),
    isActive: boolean("is_active").notNull().default(true),
    sslExpiresAt: timestamp("ssl_expires_at", { withTimezone: true }),
    sslCheckedAt: timestamp("ssl_checked_at", { withTimezone: true }),
    sslDaysWarning: integer("ssl_days_warning").notNull().default(30),
    domainExpiresAt: timestamp("domain_expires_at", { withTimezone: true }),
    domainCheckedAt: timestamp("domain_checked_at", { withTimezone: true }),
    domainDaysWarning: integer("domain_days_warning").notNull().default(30),
    slowResponseThresholdMs: integer("slow_response_threshold_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("monitors_org_id_idx").on(table.orgId)],
);

export const checkResults = pgTable(
  "check_results",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    status: checkStatusEnum("status").notNull(),
    responseMs: integer("response_ms"),
    statusCode: integer("status_code"),
    errorMessage: text("error_message"),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
    region: varchar("region", { length: 20 }).notNull().default("eu-west"),
  },
  (table) => [index("check_results_monitor_checked_idx").on(table.monitorId, table.checkedAt)],
);

export const statusPages = pgTable("status_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  customDomain: varchar("custom_domain", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 2048 }),
  brandColor: varchar("brand_color", { length: 7 }).notNull().default("#00e676"),
  isPublic: boolean("is_public").notNull().default(true),
  showIncidentHistory: boolean("show_incident_history").notNull().default(true),
  allowSubscribe: boolean("allow_subscribe").notNull().default(true),
  showUptimeBars: boolean("show_uptime_bars").notNull().default(true),
  showMaintenance: boolean("show_maintenance").notNull().default(true),
  accessToken: uuid("access_token").defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statusPageMonitors = pgTable(
  "status_page_monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    statusPageId: uuid("status_page_id")
      .notNull()
      .references(() => statusPages.id, { onDelete: "cascade" }),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    groupName: varchar("group_name", { length: 255 }),
  },
  (table) => [
    index("spm_status_page_id_idx").on(table.statusPageId),
    index("spm_monitor_id_idx").on(table.monitorId),
  ],
);

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    statusPageId: uuid("status_page_id")
      .notNull()
      .references(() => statusPages.id, { onDelete: "cascade" }),
    monitorId: uuid("monitor_id").references(() => monitors.id, { onDelete: "set null" }),
    title: varchar("title", { length: 500 }).notNull(),
    status: incidentStatusEnum("status").notNull().default("investigating"),
    severity: incidentSeverityEnum("severity").notNull().default("minor"),
    isAiGenerated: boolean("is_ai_generated").notNull().default(false),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("incidents_org_id_idx").on(table.orgId),
    index("incidents_status_page_id_idx").on(table.statusPageId),
  ],
);

export const incidentUpdates = pgTable(
  "incident_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    status: incidentStatusEnum("status").notNull(),
    body: text("body").notNull(),
    isAiGenerated: boolean("is_ai_generated").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("incident_updates_incident_id_idx").on(table.incidentId)],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    // We store a SHA-256 hash of the secret; the plaintext is shown once at creation.
    keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
    // Display-only prefix shown next to the name so users can tell keys apart.
    prefix: varchar("prefix", { length: 16 }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("api_keys_org_id_idx").on(table.orgId)],
);

export const maintenanceWindows = pgTable(
  "maintenance_windows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    statusPageId: uuid("status_page_id")
      .notNull()
      .references(() => statusPages.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body"),
    status: maintenanceStatusEnum("status").notNull().default("scheduled"),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }).notNull(),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
    // Recurrence rule, or null for a one-off window. The next window is
    // materialised when this one closes (see jobs/maintenance.job.ts), so the
    // "is a window active right now?" query never has to expand a rule.
    recurrence: jsonb("recurrence").$type<Recurrence | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("maintenance_windows_org_id_idx").on(table.orgId),
    index("maintenance_windows_status_page_id_idx").on(table.statusPageId),
    index("maintenance_windows_window_idx").on(
      table.scheduledStart,
      table.scheduledEnd,
    ),
  ],
);

export const maintenanceWindowMonitors = pgTable(
  "maintenance_window_monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    maintenanceWindowId: uuid("maintenance_window_id")
      .notNull()
      .references(() => maintenanceWindows.id, { onDelete: "cascade" }),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("mwm_maintenance_window_id_idx").on(table.maintenanceWindowId),
    index("mwm_monitor_id_idx").on(table.monitorId),
  ],
);

export const heartbeats = pgTable(
  "heartbeats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    period: integer("period").notNull().default(86400),
    grace: integer("grace").notNull().default(300),
    status: heartbeatStatusEnum("status").notNull().default("unknown"),
    lastPingAt: timestamp("last_ping_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("heartbeats_org_id_idx").on(table.orgId),
  ],
);

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    statusPageId: uuid("status_page_id")
      .notNull()
      .references(() => statusPages.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    webhookUrl: varchar("webhook_url", { length: 2048 }),
    isVerified: boolean("is_verified").notNull().default(false),
    unsubscribeToken: uuid("unsubscribe_token").notNull().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("subscribers_status_page_id_idx").on(table.statusPageId),
    index("subscribers_email_page_idx").on(table.statusPageId, table.email),
  ],
);

export const orgMembers = pgTable(
  "org_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("org_members_org_user_idx").on(table.orgId, table.userId),
    index("org_members_org_id_idx").on(table.orgId),
  ],
);

export const orgInvites = pgTable(
  "org_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    token: uuid("token").notNull().defaultRandom().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("org_invites_org_id_idx").on(table.orgId),
  ],
);

export const onCallSchedules = pgTable(
  "on_call_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull().default("Default"),
    rotationDays: integer("rotation_days").notNull().default(7),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("on_call_schedules_org_id_idx").on(table.orgId),
  ],
);

export const onCallContacts = pgTable(
  "on_call_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id").notNull().references(() => onCallSchedules.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("on_call_contacts_schedule_id_idx").on(table.scheduleId),
  ],
);
