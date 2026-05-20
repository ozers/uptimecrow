export const PLANS = ["free", "indie", "pro", "team"] as const;
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
    monitors: 10,
    minInterval: 300,      // 5-minute checks
    customDomain: false,
    slackWebhook: false,   // email only on free
    teamSeats: 1,
    retentionDays: 7,
    apiAccess: false,
    multiRegion: false,
    heartbeats: 3,
  },
  indie: {
    statusPages: 3,
    monitors: 25,
    minInterval: 60,       // 1-minute checks
    customDomain: true,
    slackWebhook: true,
    teamSeats: 2,
    retentionDays: 90,
    apiAccess: true,
    multiRegion: false,
    heartbeats: 10,
  },
  pro: {
    statusPages: 10,
    monitors: 100,
    minInterval: 30,       // 30-second checks
    customDomain: true,
    slackWebhook: true,
    teamSeats: 5,
    retentionDays: 365,
    apiAccess: true,
    multiRegion: true,
    heartbeats: 25,
  },
  team: {
    statusPages: Infinity,
    monitors: 200,
    minInterval: 30,
    customDomain: true,
    slackWebhook: true,
    teamSeats: 10,
    retentionDays: 365,
    apiAccess: true,
    multiRegion: true,
    heartbeats: 100,
  },
} as const;

export const PLAN_PRICES: Record<Exclude<Plan, "free">, number> = {
  indie: 19,
  pro: 49,
  team: 79,
};
