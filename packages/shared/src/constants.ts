export const PLANS = ["free", "indie", "pro", "team"] as const;
export type Plan = (typeof PLANS)[number];

export const MONITOR_TYPES = ["http", "tcp", "keyword"] as const;
export type MonitorType = (typeof MONITOR_TYPES)[number];

export const MONITOR_METHODS = ["GET", "HEAD"] as const;
export type MonitorMethod = (typeof MONITOR_METHODS)[number];
export const DEFAULT_MONITOR_METHOD: MonitorMethod = "GET";

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
  },
  indie: {
    statusPages: 5,
    monitors: 50,
    minInterval: 60,       // 1-minute checks
    customDomain: true,
    slackWebhook: true,
    teamSeats: 2,
    retentionDays: 365,
  },
  pro: {
    statusPages: 10,
    monitors: 100,
    minInterval: 30,       // 30-second checks
    customDomain: true,
    slackWebhook: true,
    teamSeats: 5,
    retentionDays: 365,
  },
  team: {
    statusPages: Infinity,
    monitors: 200,
    minInterval: 30,
    customDomain: true,
    slackWebhook: true,
    teamSeats: 10,
    retentionDays: 365,
  },
} as const;

export const PLAN_PRICES: Record<Exclude<Plan, "free">, number> = {
  indie: 10,
  pro: 30,
  team: 80,
};

export interface PlanCatalogEntry {
  plan: Plan;
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualTotal: number;
  desc: string;
  features: string[];
  featured: boolean;
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    plan: "free",
    name: "Free",
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    annualTotal: 0,
    desc: "Try it out. No credit card.",
    features: [
      "1 status page",
      "10 monitors",
      "5-minute check intervals",
      "Email alerts",
      "Uptime badge",
      "7-day history",
    ],
    featured: false,
  },
  {
    plan: "indie",
    name: "Indie",
    monthlyPrice: 10,
    annualMonthlyPrice: 8,
    annualTotal: 96,
    desc: "For indie hackers and solo founders.",
    features: [
      "5 status pages + custom domain",
      "50 monitors",
      "1-minute check intervals",
      "Slack, Discord, webhook alerts",
      "Email subscribers",
      "1-year history",
    ],
    featured: false,
  },
  {
    plan: "pro",
    name: "Pro",
    monthlyPrice: 30,
    annualMonthlyPrice: 25,
    annualTotal: 300,
    desc: "For teams that take uptime seriously.",
    features: [
      "10 status pages + custom domain",
      "100 monitors",
      "30-second check intervals",
      "1-year history",
      "Priority support",
    ],
    featured: true,
  },
];
