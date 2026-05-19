// Multi-tenancy isolation tests for the monitors routes.
// Ensures that one org cannot read or modify another org's monitors.
//
// Pattern mirrors apps/api/src/routes/auth.test.ts:
//   mock db + redis at the top, then build a minimal Hono app.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ────────────────────────────────────────────────────────────────────
vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  redis: {
    ping: vi.fn().mockResolvedValue("PONG"),
    quit: vi.fn().mockResolvedValue("OK"),
    get: vi.fn().mockResolvedValue(null),
  },
}));

// ── BullMQ Queue mock (monitors.ts instantiates one at module load) ────────────
vi.mock("bullmq", () => {
  const Queue = vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({}),
    getRepeatableJobs: vi.fn().mockResolvedValue([]),
    removeRepeatableByKey: vi.fn().mockResolvedValue(undefined),
  }));
  return { Queue };
});

// ── Monitor service mock ───────────────────────────────────────────────────────
vi.mock("../services/monitor.service.js", () => ({
  executeTestCheck: vi.fn(),
  executeHttpCheck: vi.fn(),
  executeTcpCheck: vi.fn(),
  executeMultiRegionCheck: vi.fn(),
}));

import { Hono } from "hono";
import { monitorRoutes } from "./monitors.js";
import { db } from "../db/index.js";
import { createToken } from "../utils/auth.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a minimal Hono app that mounts the monitors router.
 * Auth middleware inside the router reads the JWT from the Authorization header.
 */
function buildApp() {
  const app = new Hono();
  app.route("/api/monitors", monitorRoutes);
  return app;
}

/**
 * Create a signed JWT for a given (userId, email, orgId) triple.
 * JWT_SECRET is set in vitest.config.ts → "test-secret-at-least-thirty-two-chars-long-xxx"
 */
async function tokenFor(orgId: string, userId = "user-1", email = "test@example.com") {
  return createToken({ sub: userId, email, orgId });
}

/** drizzle-style select chain — supports .from().where().orderBy() and .limit() */
function selectChain(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  const terminal = () => Promise.resolve(rows);
  chain.from = () => chain;
  chain.where = () => chain;
  chain.limit = terminal;
  chain.orderBy = terminal; // GET / uses orderBy without limit
  chain.select = () => chain;
  return chain;
}

/** drizzle-style insert chain */
function insertChain(rows: unknown[]) {
  return {
    values: () => ({ returning: () => Promise.resolve(rows) }),
  };
}

/**
 * drizzle-style update chain.
 * monitors.ts PATCH uses: db.update(t).set(v).where(c).returning()
 */
function updateChain(rows: unknown[]) {
  return {
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve(rows),
      }),
    }),
  };
}

/**
 * drizzle-style delete chain.
 * monitors.ts DELETE uses: db.delete(t).where(c).returning({ id: ... })
 */
function deleteChain(rows: unknown[]) {
  return {
    where: () => ({
      returning: () => Promise.resolve(rows),
    }),
  };
}

// ── Minimal monitor owned by org-A ────────────────────────────────────────────

function monitorOwnedByOrgA() {
  return {
    id: "monitor-owned-by-A",
    orgId: "org-A",
    name: "Org-A Service",
    url: "https://example.com",
    type: "http",
    status: "up",
    isActive: true,
    confirmationCount: 2,
    intervalSeconds: 60,
    timeoutMs: 10000,
    expectedStatus: 200,
    keyword: null,
    lastCheckedAt: null,
    lastResponseMs: null,
    createdAt: new Date(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("monitors route — multi-tenancy isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /api/monitors/:id — cross-org access returns 404, not 403 ─────────
  it("GET /:id returns 404 (not 403) when monitor belongs to a different org", async () => {
    // DB returns NO row for (monitor-owned-by-A AND org-B) because the query
    // filters by orgId. The route does:
    //   WHERE id = :id AND org_id = :orgId
    // so org-B gets an empty result → 404.
    vi.mocked(db.select).mockImplementation(() => selectChain([]) as never);

    const app = buildApp();
    const token = await tokenFor("org-B"); // requester is org-B

    const res = await app.request("/api/monitors/monitor-owned-by-A", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Must be 404 — not 403 (which would leak that the resource exists)
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Monitor not found");
  });

  // ── GET /api/monitors — only returns monitors for the authenticated org ────
  it("GET / only returns monitors belonging to the authenticated org", async () => {
    // Return one monitor for org-A when org-A is authenticated
    vi.mocked(db.select).mockImplementation(() => selectChain([monitorOwnedByOrgA()]) as never);

    const app = buildApp();
    const token = await tokenFor("org-A");

    const res = await app.request("/api/monitors", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { monitors: Array<{ orgId: string }> };
    expect(body.monitors).toHaveLength(1);
    expect(body.monitors[0].orgId).toBe("org-A");
  });

  // ── PATCH /:id — cross-org update returns 404 ─────────────────────────────
  it("PATCH /:id returns 404 when org-B tries to update org-A's monitor", async () => {
    // db.update().set().where().returning() returns [] — no row matched org-B
    vi.mocked(db.update).mockImplementation(() => updateChain([]) as never);

    const app = buildApp();
    const token = await tokenFor("org-B");

    const res = await app.request("/api/monitors/monitor-owned-by-A", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // Only send name — no intervalSeconds so the plan-limit branch is skipped
      body: JSON.stringify({ name: "hacked" }),
    });

    expect(res.status).toBe(404);
  });

  // ── DELETE /:id — cross-org delete returns 404 ────────────────────────────
  it("DELETE /:id returns 404 when org-B tries to delete org-A's monitor", async () => {
    // db.delete returns empty array (WHERE id=x AND org_id=org-B finds nothing)
    vi.mocked(db.delete).mockImplementation(() => deleteChain([]) as never);

    const app = buildApp();
    const token = await tokenFor("org-B");

    const res = await app.request("/api/monitors/monitor-owned-by-A", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });

  // ── Unauthenticated request returns 401 ───────────────────────────────────
  it("GET /:id without a token returns 401", async () => {
    const app = buildApp();

    const res = await app.request("/api/monitors/any-id", {
      method: "GET",
    });

    expect(res.status).toBe(401);
  });

  // ── GET /:id/checks — cross-org returns 404 ───────────────────────────────
  it("GET /:id/checks returns 404 when monitor belongs to a different org", async () => {
    // The checks route first verifies ownership (WHERE id=x AND org_id=:orgId)
    vi.mocked(db.select).mockImplementation(() => selectChain([]) as never);

    const app = buildApp();
    const token = await tokenFor("org-B");

    const res = await app.request("/api/monitors/monitor-owned-by-A/checks", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });
});
