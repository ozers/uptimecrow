import { z } from "zod";
import {
  MONITOR_TYPES,
  INCIDENT_STATUSES,
  INCIDENT_SEVERITIES,
  DEFAULT_CHECK_INTERVAL,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_CONFIRMATION_COUNT,
  DEFAULT_EXPECTED_STATUS,
} from "./constants.js";

export const createMonitorSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url().max(2048),
  type: z.enum(MONITOR_TYPES).default("http"),
  intervalSeconds: z.number().int().min(30).max(300).default(DEFAULT_CHECK_INTERVAL),
  timeoutMs: z.number().int().min(1000).max(30000).default(DEFAULT_TIMEOUT_MS),
  expectedStatus: z.number().int().min(100).max(599).default(DEFAULT_EXPECTED_STATUS),
  confirmationCount: z.number().int().min(1).max(5).default(DEFAULT_CONFIRMATION_COUNT),
  keyword: z.string().max(500).optional().transform((v) => v || undefined),
  sslDaysWarning: z.number().int().min(1).max(365).default(30).optional(),
  domainDaysWarning: z.number().int().min(1).max(365).default(30).optional(),
  slowResponseThresholdMs: z.number().int().min(100).max(60000).nullable().optional(),
});

export const updateMonitorSchema = createMonitorSchema.partial();

export const createIncidentSchema = z.object({
  statusPageId: z.string().uuid(),
  monitorId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  status: z.enum(INCIDENT_STATUSES).default("investigating"),
  severity: z.enum(INCIDENT_SEVERITIES).default("minor"),
  body: z.string().min(1).max(5000),
});

export const updateIncidentSchema = z.object({
  status: z.enum(INCIDENT_STATUSES).optional(),
  severity: z.enum(INCIDENT_SEVERITIES).optional(),
});

export const createIncidentUpdateSchema = z.object({
  status: z.enum(INCIDENT_STATUSES),
  body: z.string().min(1).max(5000),
});

export const createStatusPageSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  logoUrl: z.union([z.string().url().max(2048), z.literal("")]).optional().transform((v) => v || undefined),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#00e676"),
  isPublic: z.boolean().default(true),
});

export const updateStatusPageSchema = createStatusPageSchema.partial();

export const subscribeSchema = z.object({
  email: z.string().email().max(255),
  webhookUrl: z.string().url().max(2048).optional().transform((v) => v || undefined),
});

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const MAINTENANCE_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const createMaintenanceWindowSchema = z.object({
  statusPageId: z.string().uuid(),
  title: z.string().min(1).max(500),
  body: z.string().max(5000).optional().transform((v) => v || undefined),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  monitorIds: z.array(z.string().uuid()).default([]),
}).refine(
  (data) => new Date(data.scheduledEnd) > new Date(data.scheduledStart),
  { message: "scheduledEnd must be after scheduledStart", path: ["scheduledEnd"] },
);

export const updateMaintenanceWindowSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().max(5000).optional(),
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  monitorIds: z.array(z.string().uuid()).optional(),
});

export const createHeartbeatSchema = z.object({
  name: z.string().min(1).max(255),
  period: z.number().int().min(60).max(2_592_000).default(86400),
  grace: z.number().int().min(60).max(3600).default(300),
});

export const updateHeartbeatSchema = createHeartbeatSchema.partial().extend({
  isActive: z.boolean().optional(),
});
