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
