// Integration tests for the check→incident path.
// DB, Redis, monitor service, and queues are all mocked — no live infra needed.
//
// Pattern mirrors apps/api/src/routes/auth.test.ts:
//   vi.mock at the top (hoisted), then import the module under test.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB / Redis mock ────────────────────────────────────────────────────────────
vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    incr: vi.fn().mockResolvedValue(1),
    del: vi.fn().mockResolvedValue(1),
  },
}));

// ── Monitor service mock ───────────────────────────────────────────────────────
vi.mock("../services/monitor.service.js", () => ({
  executeHttpCheck: vi.fn(),
  executeTcpCheck: vi.fn(),
  executeMultiRegionCheck: vi.fn(),
  checkSslExpiry: vi.fn().mockResolvedValue({ expiresAt: null }),
  checkDomainExpiry: vi.fn().mockResolvedValue({ expiresAt: null }),
}));

// ── Queue mock ─────────────────────────────────────────────────────────────────
// vi.mock is hoisted above all imports, so we must declare the spy refs with
// vi.hoisted() so they're available inside the factory callback.
const { mockNotifyQueueAdd, mockGenerateQueueAdd } = vi.hoisted(() => ({
  mockNotifyQueueAdd: vi.fn().mockResolvedValue({}),
  mockGenerateQueueAdd: vi.fn().mockResolvedValue({}),
}));

vi.mock("../utils/queues.js", () => ({
  makeQueue: vi.fn((name: string) => {
    if (name === "notifications") {
      return { add: mockNotifyQueueAdd };
    }
    return { add: mockGenerateQueueAdd };
  }),
  DEFAULT_JOB_OPTIONS: {},
}));

// ── State-machine mock ─────────────────────────────────────────────────────────
// We mock the whole module so individual tests can control failure counts and
// the evaluateTransition result without needing real Redis arithmetic.
vi.mock("../utils/state-machine.js", () => ({
  incrementFailureCount: vi.fn().mockResolvedValue(1),
  resetFailureCount: vi.fn().mockResolvedValue(undefined),
  evaluateTransition: vi.fn().mockReturnValue("none"),
  getFailureCount: vi.fn().mockResolvedValue(0),
}));

// ── Now import the module under test and its deps ─────────────────────────────
import { processCheckJob } from "./check.job.js";
import { db } from "../db/index.js";
import { executeHttpCheck } from "../services/monitor.service.js";
import {
  incrementFailureCount,
  resetFailureCount,
  evaluateTransition,
} from "../utils/state-machine.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal monitor row (http, status=up, confirmationCount=2) */
function makeMonitor(overrides: Record<string, unknown> = {}) {
  return {
    id: "monitor-1",
    orgId: "org-1",
    name: "My Service",
    url: "https://example.com",
    type: "http",
    status: "up",
    isActive: true,
    confirmationCount: 2,
    intervalSeconds: 60,
    timeoutMs: 10000,
    expectedStatus: 200,
    keyword: null,
    sslCheckedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // >24h ago so SSL runs
    domainCheckedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    sslDaysWarning: 30,
    domainDaysWarning: 30,
    slowResponseThresholdMs: null,
    lastCheckedAt: null,
    lastResponseMs: null,
    ...overrides,
  };
}

/** Minimal status page row */
function makeStatusPage() {
  return { id: "page-1", orgId: "org-1", name: "Status", slug: "status" };
}

/** Minimal incident row */
function makeIncident(overrides: Record<string, unknown> = {}) {
  return {
    id: "incident-1",
    orgId: "org-1",
    statusPageId: "page-1",
    monitorId: "monitor-1",
    title: "My Service is down",
    status: "investigating",
    severity: "minor",
    resolvedAt: null,
    startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    ...overrides,
  };
}

/** A fake BullMQ Job wrapper */
function makeJob(monitorId = "monitor-1") {
  return { data: { monitorId } } as never;
}

// ── Chain builders for db mock stubs ─────────────────────────────────────────

/**
 * Returns a drizzle-style select chain that resolves `rows` at `.limit()`.
 * Supports: .from().where().limit() and .from().innerJoin().where().limit()
 */
function selectChain(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  const terminal = () => Promise.resolve(rows);
  chain.from = () => chain;
  chain.where = () => chain;
  chain.limit = terminal;
  chain.innerJoin = () => chain;
  chain.orderBy = () => chain;
  chain.select = () => chain; // sub-selects if any
  return chain;
}

/**
 * Returns a drizzle-style insert chain.
 * .values().returning() resolves to `rows`.
 */
function insertChain(rows: unknown[]) {
  return {
    values: () => ({
      returning: () => Promise.resolve(rows),
    }),
  };
}

/**
 * Returns a drizzle-style update chain.
 * .set().where() resolves to void.
 */
function updateChain() {
  return {
    set: () => ({
      where: () => Promise.resolve([]),
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("processCheckJob — check→incident path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset queue spies too
    mockNotifyQueueAdd.mockResolvedValue({});
    mockGenerateQueueAdd.mockResolvedValue({});
  });

  // ── Test 1: Successful check — no incident ──────────────────────────────────
  it("Test 1: persists check result and does NOT create an incident on success", async () => {
    const monitor = makeMonitor({ status: "up" });

    // db.select calls in order:
    //   1. fetch monitor
    //   2. fetch org (for plan/multi-region)
    //   3. (SSL) — no check: sslCheckedAt is recent; let's override to skip
    //      Actually sslCheckedAt >24h ago, so SSL runs → checkSslExpiry returns null expiresAt
    //   4. maintenance-window check (inside isMonitorUnderActiveMaintenance)
    //      — won't be reached because evaluateTransition returns "none"
    let selectCallCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return selectChain([monitor]) as never; // monitor lookup
      if (selectCallCount === 2) return selectChain([{ plan: "free" }]) as never; // org plan
      return selectChain([]) as never; // anything else
    });

    // db.insert for checkResults
    vi.mocked(db.insert).mockReturnValue(insertChain([]) as never);

    // db.update for monitors (lastCheckedAt, lastResponseMs)
    vi.mocked(db.update).mockReturnValue(updateChain() as never);

    // Monitor service returns "up"
    vi.mocked(executeHttpCheck).mockResolvedValue({
      status: "up",
      responseMs: 120,
      statusCode: 200,
      errorMessage: null,
      region: "eu-west",
    });

    // State machine: no transition (check passed)
    vi.mocked(evaluateTransition).mockReturnValue("none");

    await processCheckJob(makeJob());

    // checkResults insert happened
    expect(db.insert).toHaveBeenCalled();

    // No incident insert: verify insert was never called with `incidents` table
    // (all inserts should be checkResults only)
    const insertCalls = vi.mocked(db.insert).mock.calls;
    // The schema table objects passed to db.insert should NOT include incidents.
    // We can't easily deep-equal the Drizzle table objects, but we CAN assert
    // that notify queue was never called for incident events.
    expect(mockNotifyQueueAdd).not.toHaveBeenCalledWith("incident_created", expect.anything());

    // evaluateTransition was called with checkPassed=true
    expect(evaluateTransition).toHaveBeenCalledWith("up", true, 0, 2);
  });

  // ── Test 2: First failure — confirmation not reached ────────────────────────
  it("Test 2: first failure (count=1 of 2) does NOT create incident", async () => {
    const monitor = makeMonitor({ status: "up", confirmationCount: 2 });

    let selectCallCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return selectChain([monitor]) as never;
      if (selectCallCount === 2) return selectChain([{ plan: "free" }]) as never;
      return selectChain([]) as never;
    });

    vi.mocked(db.insert).mockReturnValue(insertChain([]) as never);
    vi.mocked(db.update).mockReturnValue(updateChain() as never);

    // Check FAILS
    vi.mocked(executeHttpCheck).mockResolvedValue({
      status: "down",
      responseMs: null,
      statusCode: null,
      errorMessage: "Connection refused",
      region: "eu-west",
    });

    // Redis incr returns 1 — first failure
    const { redis } = await import("../db/index.js");
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(incrementFailureCount).mockResolvedValue(1);

    // evaluateTransition returns "none" because 1 < 2 (confirmationCount)
    vi.mocked(evaluateTransition).mockReturnValue("none");

    await processCheckJob(makeJob());

    // checkResults insert still happens
    expect(db.insert).toHaveBeenCalled();

    // No incident_created notification
    expect(mockNotifyQueueAdd).not.toHaveBeenCalledWith("incident_created", expect.anything());

    // evaluateTransition called with checkPassed=false, failureCount=1
    expect(evaluateTransition).toHaveBeenCalledWith("up", false, 1, 2);

    // incrementFailureCount was called
    expect(incrementFailureCount).toHaveBeenCalledWith("monitor-1");
  });

  // ── Test 3: Second consecutive failure — DOWN transition fires ───────────────
  it("Test 3: second failure triggers DOWN transition, creates incident + notifies", async () => {
    const monitor = makeMonitor({ status: "up", confirmationCount: 2 });

    let selectCallCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return selectChain([monitor]) as never; // monitor
      if (selectCallCount === 2) return selectChain([{ plan: "free" }]) as never; // org
      // selectCallCount=3 is inside isMonitorUnderActiveMaintenance
      if (selectCallCount === 3) return selectChain([]) as never; // no maintenance
      // selectCallCount=4 is statusPages lookup inside handleDownTransition
      if (selectCallCount === 4) return selectChain([makeStatusPage()]) as never;
      return selectChain([]) as never;
    });

    let insertCallCount = 0;
    vi.mocked(db.insert).mockImplementation(() => {
      insertCallCount++;
      if (insertCallCount === 1) {
        // checkResults insert
        return insertChain([]) as never;
      }
      if (insertCallCount === 2) {
        // incidents insert → must return the new incident row
        return insertChain([makeIncident()]) as never;
      }
      // incidentUpdates insert
      return insertChain([]) as never;
    });

    vi.mocked(db.update).mockReturnValue(updateChain() as never);

    // Check FAILS
    vi.mocked(executeHttpCheck).mockResolvedValue({
      status: "down",
      responseMs: null,
      statusCode: 503,
      errorMessage: "Service unavailable",
      region: "eu-west",
    });

    // incrementFailureCount returns 2 — threshold reached
    vi.mocked(incrementFailureCount).mockResolvedValue(2);

    // evaluateTransition returns up_to_down (confirmation count reached)
    vi.mocked(evaluateTransition).mockReturnValue("up_to_down");

    await processCheckJob(makeJob());

    // notifyQueue.add("incident_created", ...) must be called once
    expect(mockNotifyQueueAdd).toHaveBeenCalledTimes(1);
    expect(mockNotifyQueueAdd).toHaveBeenCalledWith(
      "incident_created",
      expect.objectContaining({
        type: "incident_created",
        incidentId: "incident-1",
        statusPageId: "page-1",
      }),
    );

    // generateQueue should also have been called
    expect(mockGenerateQueueAdd).toHaveBeenCalledWith(
      "regenerate",
      expect.objectContaining({ statusPageId: "page-1" }),
    );

    // Both incidents and incidentUpdates inserts happened (2nd and 3rd insert calls)
    expect(db.insert).toHaveBeenCalledTimes(3); // checkResults + incidents + incidentUpdates
  });

  // ── Test 4: Recovery — UP transition resolves open incident ─────────────────
  it("Test 4: recovery (DOWN→UP) resolves open incident and notifies", async () => {
    const monitor = makeMonitor({ status: "down" });
    const openIncident = makeIncident();

    let selectCallCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return selectChain([monitor]) as never; // monitor
      if (selectCallCount === 2) return selectChain([{ plan: "free" }]) as never; // org
      // selectCallCount=3: open incident lookup inside handleUpTransition
      if (selectCallCount === 3) return selectChain([openIncident]) as never;
      return selectChain([]) as never;
    });

    let insertCallCount = 0;
    vi.mocked(db.insert).mockImplementation(() => {
      insertCallCount++;
      if (insertCallCount === 1) return insertChain([]) as never; // checkResults
      return insertChain([]) as never; // incidentUpdates (resolved)
    });

    vi.mocked(db.update).mockReturnValue(updateChain() as never);

    // Check PASSES (monitor is recovering)
    vi.mocked(executeHttpCheck).mockResolvedValue({
      status: "up",
      responseMs: 85,
      statusCode: 200,
      errorMessage: null,
      region: "eu-west",
    });

    // evaluateTransition returns down_to_up
    vi.mocked(evaluateTransition).mockReturnValue("down_to_up");

    await processCheckJob(makeJob());

    // resetFailureCount called on recovery
    expect(resetFailureCount).toHaveBeenCalledWith("monitor-1");

    // notifyQueue.add("incident_resolved", ...) called once
    expect(mockNotifyQueueAdd).toHaveBeenCalledTimes(1);
    expect(mockNotifyQueueAdd).toHaveBeenCalledWith(
      "incident_resolved",
      expect.objectContaining({
        type: "incident_resolved",
        incidentId: "incident-1",
        statusPageId: "page-1",
      }),
    );

    // generateQueue regeneration triggered
    expect(mockGenerateQueueAdd).toHaveBeenCalledWith(
      "regenerate",
      expect.objectContaining({ statusPageId: "page-1" }),
    );

    // db.update called: (1) monitors lastCheckedAt, (2) monitors status=up,
    // (3) incidents resolvedAt — at least 3 update calls
    expect(db.update).toHaveBeenCalled();

    // The insert for incidentUpdates (resolved status) should have happened
    // checkResults (1) + incidentUpdates (2) = 2 inserts
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  // ── Test 5: Inactive monitor — early return, no check ───────────────────────
  it("Test 5: inactive monitor is skipped entirely", async () => {
    vi.mocked(db.select).mockImplementation(() =>
      selectChain([makeMonitor({ isActive: false })]) as never,
    );

    await processCheckJob(makeJob());

    // No check service call
    expect(executeHttpCheck).not.toHaveBeenCalled();
    // No insert
    expect(db.insert).not.toHaveBeenCalled();
    // No notifications
    expect(mockNotifyQueueAdd).not.toHaveBeenCalled();
  });
});
