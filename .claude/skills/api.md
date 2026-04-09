# HookSense API (Backend) Skill

> Rules and patterns for the Hono + Drizzle ORM + PostgreSQL backend.
> This is a paid SaaS — API reliability, consistency, and correctness are critical.

---

## When to Apply This Skill

Apply when touching files in `src/`:
- `routes/` — HTTP route handlers
- `services/` — Business logic
- `middleware/` — Auth, rate limiting, security headers
- `db/` — Schema, client, Redis
- `ws/` — WebSocket handler
- `utils/` — Logger, slug generation
- `config.ts` — Environment configuration
- `index.ts` — App setup, middleware chain

---

## 1. Architecture

### Layered Structure
```
Routes (HTTP handlers) → Services (business logic) → DB (Drizzle ORM)
```

- **Routes** parse input, call services, return responses. No business logic here.
- **Services** contain all business logic. No HTTP context (no `c` parameter).
- **DB** accessed only through Drizzle ORM. No raw SQL.

### Rules
- Never put business logic in route handlers. Extract to service functions.
- Never pass Hono's `Context` (`c`) to service functions.
- Services return data or error objects. Routes decide HTTP status codes.
- One file per concern: `endpoint.service.ts`, `auth.service.ts`, etc.

---

## 2. Route Patterns

### Framework: Hono 4.x

```typescript
// Standard route pattern
const api = new Hono<{ Variables: { user: AuthPayload | null } }>();

api.get("/api/something/:id", requireAuth, async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  // Input validation first
  if (!id) return c.json({ error: "ID is required" }, 400);

  // Business logic in service
  const result = await getSomething(id);
  if (!result) return c.json({ error: "Not found" }, 404);

  // Ownership check
  if (result.userId !== user.sub) return c.json({ error: "Forbidden" }, 403);

  return c.json(result);
});
```

### Response Format
```typescript
// Success
c.json({ ...data })                    // 200
c.json({ ...data }, 201)               // Created
c.json({ ok: true })                   // Action completed

// Error — always { error: string }
c.json({ error: "Human-readable message" }, 400)
c.json({ error: "Authentication required" }, 401)
c.json({ error: "Forbidden" }, 403)
c.json({ error: "Not found" }, 404)
c.json({ error: "...", upgrade: true, current: X, max: Y }, 403)  // Plan limit

// Never expose internal details in error messages
// Bad:  c.json({ error: `SQL error: ${err.message}` }, 500)
// Good: c.json({ error: "Something went wrong" }, 500)
```

### Route Order in `index.ts` (Order Matters)
```
1. CORS
2. Security headers (production)
3. Rate limit on /w/*
4. Body size limits
5. Health → Webhooks → Auth → API → Billing → Admin → Notifications → Teams
6. Static files + SPA fallback (production)
```

---

## 3. Middleware

### Auth Middleware (`src/middleware/auth.ts`)

| Middleware | Use When | Behavior |
|-----------|----------|----------|
| `optionalAuth` | User may or may not be logged in | Sets `c.get("user")` to payload or null |
| `requireAuth` | User MUST be logged in | Returns 401 if no valid token |

### Adding New Middleware
- Create in `src/middleware/`.
- Use `createMiddleware()` from `hono/factory`.
- Apply to specific routes, not globally (unless it's truly global).

### Rate Limiting
```typescript
// Apply rate limiter to sensitive endpoints
import { createRateLimiter } from "../middleware/rateLimit.js";

const limiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 min
api.post("/api/sensitive-action", limiter, requireAuth, async (c) => { ... });
```

---

## 4. Database (Drizzle ORM)

### Schema: `src/db/schema.ts`
### Client: `src/db/client.ts`
### Migrations: `drizzle/` (auto-applied on startup)

### Rules
- All queries through Drizzle ORM. Never use raw SQL strings.
- If raw SQL needed: use `sql` tagged template from drizzle-orm (auto-parameterized).
- New tables: UUID primary keys, timestamps with timezone, appropriate indexes.
- Foreign keys: cascade delete for child data, set null for soft references.
- Run `npm run db:generate` after schema changes.

### Query Patterns
```typescript
// Select
const user = await db.query.users.findFirst({
  where: eq(users.email, email.toLowerCase()),
});

// Insert
const [endpoint] = await db.insert(endpoints).values({ ... }).returning();

// Update
const [updated] = await db
  .update(users)
  .set({ plan: "hook", updatedAt: new Date() })
  .where(eq(users.id, userId))
  .returning();

// Delete
await db.delete(requests).where(lt(requests.receivedAt, cutoff));

// Conditional (complex)
const results = await db
  .select()
  .from(requests)
  .where(and(
    eq(requests.endpointId, endpointId),
    gte(requests.receivedAt, startDate)
  ))
  .orderBy(desc(requests.receivedAt))
  .limit(50);
```

---

## 5. Plan System

### Plans: free, hook, sense, anonymous

```typescript
import { getEffectiveLimits } from "../services/plan.service.js";

const limits = getEffectiveLimits(user.plan);
// limits.maxEndpoints, limits.maxRequests, limits.retentionDays, etc.
```

### Rules
- Always check plan limits server-side before allowing feature access.
- Use `getUserPlan()` for webhook routes (may need DB lookup for anonymous endpoints).
- Use `checkAndExpirePlan()` on `/auth/me` to auto-downgrade expired plans.
- Return upgrade hint in error: `{ error: "...", upgrade: true, current: X, max: Y }`.

### Feature Gating
```typescript
// Check if feature is available on user's plan
const limits = getEffectiveLimits(user.plan);
if (!limits.customResponse) {
  return c.json({ error: "Custom responses require Hook plan or above", upgrade: true }, 403);
}
```

---

## 6. WebSocket

### Server: `src/ws/handler.ts`

- Dev: standalone on port 3002
- Production: attached to HTTP server on `/ws` path
- Cross-instance via Redis Pub/Sub

### Broadcasting
```typescript
import { broadcastToSlug } from "../ws/handler.js";

broadcastToSlug(endpoint.slug, {
  type: "new_request",
  request,
  ...(signatureVerification ? { signatureVerification } : {}),
});
```

### Rules
- Only broadcast non-sensitive data (request metadata, not internal state).
- Never broadcast user details, plan info, or billing data.
- Message format: `{ type: string, ...payload }`.
- Broadcast is non-blocking (fire-and-forget).

---

## 7. Background Services

### Architecture: `setInterval` + distributed locks (Redis)

| Service | Interval | File |
|---------|----------|------|
| Cleanup | 5 min | `services/cleanup.service.ts` |
| Alert evaluator | 5 min | `services/alert.service.ts` |
| Retry worker | 1 min | `services/retry.service.ts` |

### Rules
- All schedulers acquire Redis lock before executing (prevent duplicate runs).
- Fallback to single-instance if Redis unavailable.
- Started in `src/index.ts` after HTTP server.
- Errors logged but never crash the scheduler.

### Adding a New Scheduler
```typescript
export function startMyScheduler() {
  // Run immediately on startup
  runMyTask().catch((err) => logger.error({ err }, "MyTask failed"));

  // Then every N minutes
  setInterval(() => {
    runMyTask().catch((err) => logger.error({ err }, "MyTask failed"));
  }, N * 60_000);
}

async function runMyTask() {
  const lockAcquired = await acquireLock("my-task-lock", N * 60);
  if (!lockAcquired) return;
  // ... task logic
}
```

---

## 8. Email

### Provider: Resend (`src/services/email.service.ts`)

```typescript
import { sendEmail } from "../services/email.service.js";

sendEmail({
  to: user.email,
  subject: "Subject line",
  html: someTemplateHtml(data),
}).catch((err) => logger.error({ err }, "Failed to send email"));
```

### Rules
- Always send non-blocking (`.catch()`) unless the response depends on it.
- HTML templates are functions that return strings (no template engine).
- Never include user-controlled content in HTML without escaping.
- Resend API key optional — logs warning if missing, doesn't crash.

---

## 9. Logging

### Library: Pino (`src/utils/logger.ts`)

```typescript
import { logger } from "../utils/logger.js";

logger.info({ userId, plan }, "User upgraded");
logger.error({ err, requestId }, "Failed to store request");
logger.debug({ slug, method }, "Webhook captured");
logger.warn({ ip }, "Rate limit exceeded");
```

### Rules
- Structured logging: pass context as first arg (object), message as second.
- Dev: `debug` level, pretty-printed.
- Production: `info` level, JSON format.
- Never log: passwords, JWT tokens, webhook bodies, secrets, full headers.
- Always log: auth events, billing events, errors, rate limit hits.

---

## 10. Configuration

### File: `src/config.ts`

- All env vars read at startup, exported as `config` object.
- Required in production: `JWT_SECRET`, `DATABASE_URL`.
- Optional with graceful fallback: `REDIS_URL`, `RESEND_API_KEY`, `GITHUB_CLIENT_ID`.

### Adding a New Config Value
```typescript
// In config.ts
export const config = {
  // ... existing
  myNewSetting: process.env.MY_NEW_SETTING || "default-value",
} as const;
```

### Rules
- Always provide a safe default for development.
- If required in production: add a check like the `JWT_SECRET` one.
- Update `.env.example` when adding new vars.
- Never hardcode secrets.

---

## 11. Error Handling Patterns

### Global Safety Net
- `app.onError()` in `index.ts` catches unhandled errors.
- `app.notFound()` handles unmatched `/api/*` routes.

### Route-Level Pattern
```typescript
api.post("/api/something", requireAuth, async (c) => {
  // 1. Parse and validate input
  const body = await c.req.json().catch(() => null);
  if (!body?.name) return c.json({ error: "Name is required" }, 400);

  // 2. Auth/ownership check
  const user = c.get("user")!;

  // 3. Call service (may throw)
  const result = await createSomething(user.sub, body.name);

  // 4. Handle service errors
  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  // 5. Return success
  return c.json(result, 201);
});
```

### Service-Level Pattern
```typescript
// Services return result or error object — never throw for expected errors
export async function createSomething(userId: string, name: string) {
  const existing = await findByName(name);
  if (existing) return { error: "Name already taken" };

  const [item] = await db.insert(things).values({ userId, name }).returning();
  return item;
}
```

### Background Task Pattern
```typescript
// Non-critical tasks: fire-and-forget with .catch()
recordMetric(endpointId, true, latencyMs).catch(() => {});
notify(endpointId, data).catch(() => {});
audit({ action: "user.login", actorId: user.id }).catch(() => {});

// Never let non-critical failures block the response
```

---

## 12. Audit Logging

### Service: `src/services/audit.service.ts`

```typescript
import { audit } from "../services/audit.service.js";

audit({
  action: "user.login",
  actorId: user.id,
  targetType: "user",
  targetId: user.id,
  metadata: { method: "email" },
  ip: clientIp,
}).catch(() => {});
```

### Rules
- Always non-blocking (`.catch(() => {})`).
- Use typed `AuditAction` union for action names.
- Include `actorId` (who did it), `targetType`/`targetId` (what was affected).
- IP from proxy headers (same extraction as rate limiter).
- Never include sensitive data in metadata (no passwords, tokens, webhook bodies).

---

## 13. Testing

### Framework: Vitest

```bash
npm test  # vitest run
```

### Test Location: `src/__tests__/**/*.test.ts`

### Patterns
- Unit test pure functions (no DB required).
- Mock config via `vi.doMock()` for config-dependent tests.
- Use `describe`/`it`/`expect` from vitest.
- Test security invariants: validation, blocklists, crypto round-trips.

### Adding a New Test
```typescript
import { describe, it, expect } from "vitest";

describe("myFunction", () => {
  it("does the thing correctly", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```
