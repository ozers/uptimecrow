// Auth route smoke tests — exercises the Hono app in-process via app.request().
// DB and bcrypt are mocked so these run without a live Postgres/Redis.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ──────────────────────────────────────────────────────────────────
// vi.mock is hoisted, so this runs before any module import below.
vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    execute: vi.fn().mockResolvedValue([]),
  },
  redis: {
    ping: vi.fn().mockResolvedValue("PONG"),
    quit: vi.fn().mockResolvedValue("OK"),
  },
}));

// ── bcrypt mock ───────────────────────────────────────────────────────────────
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$fakehash"),
    compare: vi.fn().mockResolvedValue(false), // wrong password by default
  },
}));

import { authRoutes } from "./auth.js";
import { db } from "../db/index.js";
import { Hono } from "hono";
import bcrypt from "bcrypt";

// Build a minimal Hono app for testing
function buildApp() {
  const app = new Hono();
  app.route("/api/auth", authRoutes);
  return app;
}

// Helper: call the app and get a Response
async function request(
  app: Hono,
  path: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper: build a chainable select stub resolving to `rows`
function selectReturning(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.from = () => chain;
  chain.where = () => chain;
  chain.limit = () => Promise.resolve(rows);
  return chain;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 and a token when registration succeeds", async () => {
    // No existing user
    vi.mocked(db.select).mockReturnValueOnce(
      selectReturning([]) as unknown as ReturnType<typeof db.select>,
    );

    // User insert then org insert
    let insertCallCount = 0;
    vi.mocked(db.insert).mockImplementation(
      () =>
        ({
          values: () => ({
            returning: () => {
              insertCallCount++;
              if (insertCallCount === 1) {
                return Promise.resolve([
                  { id: "user-123", email: "new@example.com", name: "New User" },
                ]);
              }
              return Promise.resolve([{ id: "org-456" }]);
            },
            onConflictDoNothing: () => Promise.resolve(),
          }),
        }) as unknown as ReturnType<typeof db.insert>,
    );

    const app = buildApp();
    const res = await request(app, "/api/auth/register", {
      email: "new@example.com",
      password: "StrongPass123!",
      name: "New User",
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { token?: string; user?: { email: string } };
    expect(body.token).toBeDefined();
    expect(body.user?.email).toBe("new@example.com");
  });

  it("returns 409 when the email is already registered", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      selectReturning([
        { id: "existing", email: "taken@example.com", passwordHash: "$2b$12$x" },
      ]) as unknown as ReturnType<typeof db.select>,
    );

    const app = buildApp();
    const res = await request(app, "/api/auth/register", {
      email: "taken@example.com",
      password: "StrongPass123!",
      name: "Someone",
    });

    expect(res.status).toBe(409);
  });

  it("returns 400 for an invalid email", async () => {
    const app = buildApp();
    const res = await request(app, "/api/auth/register", {
      email: "not-an-email",
      password: "StrongPass123!",
      name: "Test",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the password is wrong — not 403 or 500", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      selectReturning([
        {
          id: "user-123",
          email: "test@example.com",
          passwordHash: "$2b$12$fakehash",
          name: "Test",
        },
      ]) as unknown as ReturnType<typeof db.select>,
    );
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const app = buildApp();
    const res = await request(app, "/api/auth/login", {
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 401 when the user does not exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      selectReturning([]) as unknown as ReturnType<typeof db.select>,
    );

    const app = buildApp();
    const res = await request(app, "/api/auth/login", {
      email: "ghost@example.com",
      password: "anything",
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Invalid email or password");
  });
});
