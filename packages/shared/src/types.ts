import type {
  Plan,
  MonitorType,
  MonitorStatus,
  IncidentStatus,
  IncidentSeverity,
  CheckStatus,
} from "./constants.js";

export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: Plan;
  aiTokensUsed: number;
  createdAt: Date;
}

export interface Monitor {
  id: string;
  orgId: string;
  name: string;
  url: string;
  type: MonitorType;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  confirmationCount: number;
  status: MonitorStatus;
  lastCheckedAt: Date | null;
  lastResponseMs: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface CheckResult {
  id: number;
  monitorId: string;
  status: CheckStatus;
  responseMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  checkedAt: Date;
  region: string;
}

export interface StatusPage {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  customDomain: string | null;
  logoUrl: string | null;
  brandColor: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface Incident {
  id: string;
  orgId: string;
  statusPageId: string;
  monitorId: string | null;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  isAiGenerated: boolean;
  startedAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  status: IncidentStatus;
  body: string;
  isAiGenerated: boolean;
  createdAt: Date;
}

export interface Subscriber {
  id: string;
  statusPageId: string;
  email: string;
  isVerified: boolean;
  unsubscribeToken: string;
  createdAt: Date;
}
