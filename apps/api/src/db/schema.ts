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
} from "drizzle-orm/pg-core";

// ── Enums ──

export const planEnum = pgEnum("plan", ["free", "pro", "team"]);
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

// ── Tables ──

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
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
    intervalSeconds: integer("interval_seconds").notNull().default(60),
    timeoutMs: integer("timeout_ms").notNull().default(10000),
    expectedStatus: integer("expected_status").notNull().default(200),
    confirmationCount: integer("confirmation_count").notNull().default(2),
    keyword: varchar("keyword", { length: 500 }),
    status: monitorStatusEnum("status").notNull().default("unknown"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastResponseMs: integer("last_response_ms"),
    isActive: boolean("is_active").notNull().default(true),
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

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    statusPageId: uuid("status_page_id")
      .notNull()
      .references(() => statusPages.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    isVerified: boolean("is_verified").notNull().default(false),
    unsubscribeToken: uuid("unsubscribe_token").notNull().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("subscribers_status_page_id_idx").on(table.statusPageId),
    index("subscribers_email_page_idx").on(table.statusPageId, table.email),
  ],
);
