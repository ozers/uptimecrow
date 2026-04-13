export const PLANS = ["free", "pro", "team"] as const;
export type Plan = (typeof PLANS)[number];

export const MONITOR_TYPES = ["http", "tcp", "keyword"] as const;
export type MonitorType = (typeof MONITOR_TYPES)[number];

export const MONITOR_STATUSES = ["up", "down", "degraded", "unknown"] as const;
export type MonitorStatus = (typeof MONITOR_STATUSES)[number];

export const INCIDENT_STATUSES = ["investigating", "identified", "monitoring", "resolved"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_SEVERITIES = ["minor", "major", "critical"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const CHECK_STATUSES = ["up", "down", "degraded"] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

export const DEFAULT_CHECK_INTERVAL = 60;
export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_CONFIRMATION_COUNT = 2;
export const DEFAULT_EXPECTED_STATUS = 200;

export const PLAN_LIMITS = {
  free: {
    statusPages: 1,
    monitors: 3,
    minInterval: 300,
    customDomain: false,
    slackWebhook: false,
    teamSeats: 1,
    retentionDays: 7,
    apiAccess: false,
    multiRegion: false,
  },
  pro: {
    statusPages: 3,
    monitors: 20,
    minInterval: 30,
    customDomain: true,
    slackWebhook: true,
    teamSeats: 2,
    retentionDays: 90,
    apiAccess: false,
    multiRegion: false,
  },
  team: {
    statusPages: Infinity,
    monitors: 50,
    minInterval: 30,
    customDomain: true,
    slackWebhook: true,
    teamSeats: 5,
    retentionDays: 365,
    apiAccess: true,
    multiRegion: true,
  },
} as const;
