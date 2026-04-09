# HookSense Security Skill

> This skill enforces security standards for HookSense, a paid SaaS webhook inspection platform.
> Webhook payloads may contain payment data, API keys, PII, and business-critical information.
> Security is not optional — a breach means customer data exposure and revenue loss.

---

## When to Apply This Skill

Apply these rules when touching ANY of the following:
- `src/middleware/*` — Auth, rate limiting, security headers
- `src/routes/*` — All API routes, especially `webhook.ts`, `auth.ts`, `billing.ts`
- `src/services/auth.service.ts` — JWT, password hashing, user management
- `src/services/hmac.service.ts` — Signature verification
- `src/services/plan.service.ts` — Plan limits and feature gating
- `src/services/replay.service.ts` — Request replay (sends data to external URLs)
- `src/services/domain.service.ts` — Custom domain verification
- `src/config.ts` — Environment variables and secrets
- `src/db/schema.ts` — Database schema changes
- `web/src/contexts/AuthContext.tsx` — Frontend auth state
- `web/src/lib/api.ts` — API client
- Any file handling user input, auth tokens, payment data, or webhook payloads

---

## 1. Authentication Rules

### JWT
- **Algorithm:** HS256 only. Never accept `alg: none` or RS256 without proper key management.
- **Expiry:** 7 days max. Payload: `{ sub, email, plan, iat, exp }`.
- **Storage:** httpOnly + Secure (production) + SameSite=Lax cookie. NEVER localStorage/sessionStorage.
- **Secret:** `config.jwtSecret` from env. MUST be cryptographically random, minimum 256 bits in production.
- **Verification:** Always use `verifyJWT()` from `auth.service.ts`. Never decode without verifying signature.

### Passwords
- **Hashing:** bcryptjs with cost factor 12. Never reduce. Never use MD5/SHA for passwords.
- **Length:** Min 8, max 128. The max prevents bcrypt DoS (72-byte input limit but 128-char UI limit).
- **Comparison:** Always `bcrypt.compare()`. Never `===` on password hashes.

### OAuth (GitHub)
- **State parameter:** MUST validate against stored cookie to prevent CSRF.
- **Email linking:** Only link GitHub account to existing user if email matches AND is GitHub-verified.
- **Token scope:** Request minimum necessary scopes.

### Session Rules
- Never expose JWT in URL query parameters (current CLI auth issue — use POST body when fixing).
- Never log JWT tokens, even at debug level.
- On logout: clear cookie with same path/domain/flags.
- On plan change or password reset: issue new JWT to invalidate old claims.

---

## 2. Authorization Rules

### Ownership Checks — MANDATORY
Every mutation on a resource MUST verify ownership:
```typescript
// CORRECT
if (endpoint.userId !== user.sub && !hasTeamAccess(endpoint.teamId, user.sub)) {
  return c.json({ error: "Forbidden" }, 403);
}

// WRONG — never skip ownership check
const endpoint = await getEndpointBySlug(slug);
await updateEndpoint(endpoint.id, data); // WHO owns this?
```

### Plan-Based Access
- Always use `getEffectiveLimits(user.plan)` before allowing plan-gated features.
- Check BOTH total and daily quotas for request limits.
- Never trust client-side plan checks — always verify server-side.
- Plan expiry: `checkAndExpirePlan()` must run before granting access.

### Team Roles
- `owner` > `admin` > `member` > `viewer`
- Destructive operations (delete team, remove members): owner only.
- Mutations (update settings, manage endpoints): admin+.
- Read operations: all members.
- Always use `hasTeamRole()` — never compare role strings directly.

### Admin Routes
- Double-check: `requireAuth` middleware AND `user.isAdmin === true`.
- Never expose admin functionality behind feature flags alone.

---

## 3. Input Validation Rules

### General
- Validate at the route handler level, BEFORE passing to services.
- Return 400 with generic error messages. Never include internal details.
- Use allowlists over blocklists wherever possible.

### Specific Validations

| Input | Rule | Where |
|-------|------|-------|
| Email | Regex + lowercase + max 254 chars | auth routes |
| Password | 8-128 chars, no trim | auth routes |
| Slug | 3-32 chars, `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/` | endpoint/team routes |
| Domain | `isValidDomain()` + DNS verification | domain routes |
| URL (replay target) | Must be HTTPS in production, no internal IPs (127.0.0.1, 10.x, 172.16-31.x, 192.168.x) | replay service |
| Port (CLI) | parseInt, 1024-65535 range | auth CLI route |
| JSON body | `c.req.json()` in try-catch, max body size enforced | all POST/PUT/PATCH |
| Custom response status | Allowlist: 200, 201, 202, 204, 400, 404, 500 | webhook routes |
| Custom response headers | Blocklist enforced (see Section 8) | webhook routes |
| Query params | Type-check and sanitize before DB queries | all GET routes |
| Pagination | Max limit cap (e.g., 100), positive integers only | list endpoints |

### SSRF Prevention (Replay/Retry)
When replaying or retrying webhooks to user-specified URLs:
```typescript
// MUST validate target URL before fetching
function isAllowedUrl(url: string): boolean {
  const parsed = new URL(url);
  // Block internal networks
  const blocked = ['127.0.0.1', 'localhost', '0.0.0.0', '::1'];
  if (blocked.includes(parsed.hostname)) return false;
  // Block private IP ranges
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) return false;
  // Block non-HTTP(S)
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  return true;
}
```

---

## 4. Rate Limiting Rules

### Current Architecture
- Redis-backed with in-memory fallback.
- Skips authenticated users (plan quotas apply instead).

### Rules When Modifying
- NEVER remove rate limiting from auth endpoints (login, signup, forgot-password).
- Webhook capture: keep 60/sec per IP minimum.
- New sensitive endpoints MUST have rate limiting. Use `createRateLimiter()`.
- Always return `429` with `Retry-After` header.
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

### Known Issue — Document When Fixing
- Authenticated user bypass: plan quotas handle this, but a malicious paid user could still abuse non-quota-limited operations.
- In-memory fallback resets counters on Redis failure — consider persistence.

---

## 5. Webhook Capture Security (CRITICAL PATH)

This is the most security-sensitive flow. External, unauthenticated traffic hits `/w/:slug`.

### Request Processing Order (DO NOT CHANGE)
```
1. Endpoint lookup (slug or custom domain)
2. Expiry check (410 if expired)
3. Per-IP rate limit (60/min per IP per endpoint)
4. Payload size check (plan-aware)
5. Signature verification (if HMAC configured)
6. Quota enforcement (total + daily)
7. Store request
8. Non-blocking: metrics, alerts, notifications, WebSocket broadcast
9. Return response
```

### Rules
- Signature verification MUST use `timingSafeEqual`. Never `===` for HMAC comparison.
- Quota enforcement applies to ALL requests, not just verified ones.
- Custom response headers: blocklist in `BLOCKED_HEADERS` must include:
  ```
  set-cookie, location, access-control-*, content-security-policy,
  strict-transport-security, x-frame-options, x-content-type-options,
  transfer-encoding, connection, host, x-powered-by, server
  ```
- Never log full webhook body (may contain secrets). Log only metadata (size, content-type, provider).
- Source IP: extract from `x-forwarded-for` → `x-real-ip` → socket, but ONLY trust proxy headers behind a trusted reverse proxy.

### Payload Storage & Encryption (SEC-009)
- Webhook bodies are encrypted at rest with AES-256-GCM when `ENCRYPTION_KEY` is set.
- Encryption key: 64 hex chars (32 bytes). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Format in DB: `enc:<iv_hex>:<ciphertext_hex>:<authTag_hex>`
- Backward compatible: values without `enc:` prefix are treated as plaintext (pre-encryption data).
- `encrypt()`/`decrypt()` in `src/utils/crypto.ts`. All reads/writes go through `request.service.ts`.
- Body search (`ILIKE`) is disabled when encryption is enabled (ciphertext is not searchable). Header search still works.
- When encryption is NOT configured (no key), bodies are stored as plaintext — this is acceptable for development.
- NEVER log the encryption key. NEVER store it in source code.
- Key rotation: not yet implemented. Changing the key will make existing encrypted data unreadable.
- Retention cleanup MUST respect plan limits (7/30/90 days).

---

## 6. Payment & Billing Security

### LemonSqueezy Webhook
- ALWAYS verify HMAC-SHA256 signature before processing.
- Use raw body (not parsed JSON) for signature computation.
- Timing-safe comparison via `timingSafeEqual`.
- On verification failure: return 401, log the attempt.

### Plan Changes
- Only trusted sources can change plans: LemonSqueezy webhook, admin, promo redemption.
- Never allow plan upgrades from client-side API calls.
- On downgrade: enforce new limits immediately, don't grandfather old data.
- Promo codes: case-insensitive comparison, max redemptions enforced atomically.

### Variant ID Validation
- Validate that incoming `variant_id` from LemonSqueezy matches known variant IDs.
- Unknown variant → log and reject, don't guess the plan.

---

## 7. Frontend Security Rules

### XSS Prevention
- React escapes by default. NEVER use `dangerouslySetInnerHTML` with user-generated content.
- Current safe uses: pre-rendered blog/docs content, JSON-LD structured data.
- If adding new `dangerouslySetInnerHTML`: sanitize with DOMPurify or equivalent FIRST.

### Auth State
- Session via httpOnly cookies. Frontend NEVER sees the JWT.
- `useAuth()` provides user object from `/api/auth/me`.
- On 401 response: redirect to login, clear local state.
- Never store sensitive data in localStorage (current uses are safe: theme, replay history, notification prefs).

### API Calls
- Always use `credentials: "include"` for session cookies.
- All API calls go through `apiFetch()` wrapper in `web/src/lib/api.ts`.
- Error responses: extract `data.error` message, never render raw error objects.
- Never construct API URLs from user input without validation.

### CSP Compliance
- No inline scripts (use event handlers via React).
- No `eval()` or `Function()`.
- External scripts: only Umami analytics (cloud.umami.is).
- Fonts: Google Fonts (fonts.googleapis.com, fonts.gstatic.com).

---

## 8. HTTP Security Headers

Production middleware sets these headers. NEVER weaken them:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: [strict policy — see src/index.ts]
```

### Rules
- Never add `unsafe-inline` or `unsafe-eval` to CSP.
- Never change X-Frame-Options to ALLOWALL.
- Never reduce HSTS max-age below 1 year.
- If adding new CDN/external resource: update CSP directives, not remove CSP.

---

## 9. Database Security

### Query Safety
- ALL queries through Drizzle ORM (parameterized by default).
- NEVER use `sql.raw()` or template literals with user input.
- If raw SQL is absolutely needed: use `sql` tagged template from drizzle-orm (auto-parameterized).

### Schema Changes
- New tables: UUID primary keys, timestamps with timezone.
- Sensitive fields: consider encryption at application level before storage.
- Foreign keys: use cascade delete for child data, set null for soft references.
- Indexes: add for frequently queried columns, especially on security-relevant lookups (email, slug, token).
- Unique constraints: prevent duplicates on business-critical fields.

### Migrations
- Migrations run automatically on startup. A failed migration EXITS the process (correct behavior — never skip).
- Test migrations against production-like data before deploying.
- Never drop columns with sensitive data without explicit cleanup.

---

## 10. Secrets & Configuration

### Environment Variables
- NEVER hardcode secrets in source code.
- NEVER commit `.env` files (`.gitignore` enforced).
- NEVER log environment variables, even partially.
- Required in production: `JWT_SECRET`, `DATABASE_URL`.
- Use `.env.example` as documentation — keep it updated when adding new vars.

### Config Validation
- `src/config.ts` reads all env vars at startup.
- Production mode (`NODE_ENV=production`) enforces `JWT_SECRET` presence.
- When adding new secrets: follow the same pattern — require in production, provide safe default for dev.

---

## 11. CORS Policy

```typescript
// Production: ONLY the app URL
origin: config.appUrl

// Development: localhost variants + app URL
origin: ["http://localhost:5173", "http://localhost:3001", config.appUrl]
```

### Rules
- NEVER use `origin: "*"` (wildcard).
- NEVER add `Access-Control-Allow-Origin: *` when `credentials: true`.
- If adding new allowed origins: only add domains we control.
- Webhook endpoints (`/w/*`) don't need CORS (they accept any origin by design, but don't reflect it).

---

## 12. WebSocket Security

### Current State
- No authentication on WebSocket connections.
- Connection requires knowing the endpoint slug.

### Rules
- Slug is semi-public (shared by users). Don't treat WS access as authenticated.
- Never send sensitive data (user details, plan info, billing) over WebSocket.
- Only send: new request notifications (method, headers, body preview, signature status).
- Redis Pub/Sub: validate message format before broadcasting.
- Connection limits: consider max connections per slug to prevent resource exhaustion.

---

## 13. Logging Security

### What to Log
- Auth events: login success/failure (email only, never password).
- Rate limit hits: IP, endpoint, limit reached.
- Billing events: plan changes, webhook processing results.
- Errors: stack traces in dev, sanitized messages in production.

### What NEVER to Log
- JWT tokens or session identifiers.
- Passwords (plain or hashed).
- Webhook payload bodies (may contain API keys, PII, payment data).
- Full HTTP headers of webhook requests (may contain auth tokens).
- Environment variables or secrets.
- User IP addresses in production logs (GDPR — log hashed IPs or use anonymization).

---

## 14. Dependency Security

### Rules
- Run `npm audit` regularly. Fix critical/high vulnerabilities immediately.
- Pin major versions in `package.json`. Use exact versions for security-critical packages:
  - `bcryptjs`, `arctic`, `ws`, `ioredis`, `postgres`
- Never add dependencies that require native compilation unless absolutely necessary.
- Review changelogs before upgrading security-critical packages.

### Current High-Risk Dependencies
| Package | Risk | Watch For |
|---------|------|-----------|
| bcryptjs | Hashing bypass | Algorithm changes, timing leaks |
| postgres / drizzle-orm | SQL injection | Query builder bypasses |
| ws | WebSocket hijacking | Protocol-level vulnerabilities |
| arctic | OAuth bypass | State validation changes |
| @lemonsqueezy/lemonsqueezy.js | Payment fraud | Webhook signature changes |

---

## 15. Security Checklist for Code Review

Before approving ANY PR that touches security-relevant code:

### Authentication
- [ ] JWT created/verified only via `auth.service.ts` functions
- [ ] Passwords hashed with bcrypt (cost 12), never compared directly
- [ ] OAuth state validated, emails verified
- [ ] Tokens not exposed in URLs, logs, or error messages

### Authorization
- [ ] Every mutation checks resource ownership
- [ ] Plan limits enforced server-side before feature access
- [ ] Team role checks use `hasTeamRole()`, not string comparison
- [ ] Admin routes have both `requireAuth` + `isAdmin` check

### Input
- [ ] All user input validated at route handler level
- [ ] SQL queries use Drizzle ORM (no raw string interpolation)
- [ ] URLs validated against SSRF (no internal IPs for replay/retry)
- [ ] Body size limits enforced per plan

### Output
- [ ] Error messages don't leak internal state (stack traces, SQL, file paths)
- [ ] Custom response headers filtered through blocklist
- [ ] No sensitive data in API responses to unauthorized users

### Infrastructure
- [ ] No secrets in source code
- [ ] Security headers not weakened
- [ ] Rate limiting present on new public endpoints
- [ ] CORS not broadened unnecessarily

---

## 16. Known Vulnerabilities — Status Tracker

| ID | Severity | Area | Issue | Status |
|----|----------|------|-------|--------|
| SEC-001 | HIGH | Auth | JWT reduced to 24h + silent refresh on /auth/me (rolling sessions) | FIXED |
| SEC-002 | MEDIUM | Auth | CLI auth now uses POST form instead of query string redirect | FIXED |
| SEC-003 | MEDIUM | Auth | CLI port validated: numeric, 1024-65535 range | FIXED |
| SEC-004 | MEDIUM | Webhook | Custom response status validated against allowlist | FIXED |
| SEC-005 | MEDIUM | Rate Limit | Auth users get 10x limit instead of bypass | FIXED |
| SEC-006 | MEDIUM | Rate Limit | Documented proxy header trust model (requires trusted reverse proxy) | FIXED |
| SEC-007 | MEDIUM | Replay | Already had DNS resolution + private IP check + rebinding protection | WAS FIXED |
| SEC-008 | HIGH | Audit | audit_logs table + audit service integrated into auth, billing flows | FIXED |
| SEC-009 | HIGH | Data | Webhook body encrypted at rest with AES-256-GCM (ENCRYPTION_KEY env) | FIXED |
| SEC-013 | MEDIUM | Replay | Fetch timeout (30s) and response size limit (5MB) added | FIXED |
| SEC-014 | MEDIUM | Replay | Private IP blocklist expanded: ::ffff mapped, CGN, 0.0.0.0/8, fc00::/7 | FIXED |
| SEC-015 | LOW | Auth | CLI HTML template token is HTML-escaped (defense-in-depth) | FIXED |
| SEC-016 | LOW | WebSocket | Per-IP connection limit (20) added alongside per-slug (50) | FIXED |
| SEC-010 | MEDIUM | Billing | variant_id validated against known config variants, unknown rejected | FIXED |
| SEC-011 | LOW | Headers | Blocklist expanded: x-powered-by, server, proxy-*, upgrade, keep-alive | FIXED |
| SEC-012 | LOW | WebSocket | Per-slug connection limit (50) enforced | FIXED |
