# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository. Keep it short and load-bearing — outdated entries are worse than missing ones.

## Tech Stack
- **Backend:** Hono + TypeScript + Drizzle ORM + BullMQ
- **Frontend:** Vite + React + React Router + Tailwind CSS
- **Database:** PostgreSQL 16 + Redis 7
- **Email:** Amazon SES (`@aws-sdk/client-sesv2`)
- **Infra:** Docker, pnpm workspaces, Node >= 20

## Development Commands
```bash
docker compose up                    # Start all services (Postgres, Redis, API :3000, Web :5173)
pnpm install                         # Install deps locally (IDE support)
pnpm db:generate                     # Generate Drizzle migration files
pnpm db:migrate                      # Run DB migrations
pnpm test                            # Run all tests (vitest)
pnpm typecheck                       # tsc across all packages
pnpm --filter @uptimecrow/api test   # Single-package test (filter by workspace name)
pnpm dev:api                         # Run API outside Docker (needs local Postgres/Redis)
pnpm dev:web                         # Run web outside Docker
```

Running a single vitest file: `pnpm --filter @uptimecrow/api exec vitest run path/to/file.test.ts`.

## Architecture

### Monorepo Layout
- `apps/api` — Hono backend + BullMQ workers. `MODE=api|worker|all` controls which runs.
- `apps/web` — Vite React SPA. Vite dev server (and nginx in prod) proxies `/api`, `/status`, `/badge` to the API.
- `packages/shared` — Shared TS types, constants (plan limits, defaults), Zod schemas. Imported by both API and web as `@uptimecrow/shared`.

### API Structure (`apps/api/src/`)
- `index.ts` — Entry; dispatches to `startServer()` and/or `startWorker()` based on `MODE`. Asserts a strong `JWT_SECRET` in production.
- `server.ts` — Hono app: CORS, logger, health check, route mounting. Production requires `APP_URL` for CORS.
- `worker.ts` — BullMQ worker bootstrap (registers repeatable check jobs for all monitors at startup).
- `routes/` — `auth`, `monitors`, `incidents`, `status-pages`, `subscribers`, `analytics`, `billing`, `settings`, `heartbeats`, `maintenance`, `api-keys`, `mcp`, `team`, `tools`, `docs`, `public`.
- `middleware/auth.ts` — JWT auth (reads cookie or `Authorization: Bearer`).
- `middleware/rate-limit.ts` — Redis-backed rate limiting.
- `middleware/custom-domain.ts` — Routes requests on a custom-domain Host header to the matching status page.
- `db/schema.ts` + `db/index.ts` — Drizzle schema and connection (uses `postgres` driver, not `pg`).
- `services/monitor.service.ts` — HTTP/TCP/keyword checks (with SSRF guard).
- `services/notification.service.ts` — Email via Amazon SES + Slack/Discord/custom webhooks. Gracefully no-ops if AWS credentials are missing.
- `services/static-gen.service.ts` — Pre-renders status pages to JSON + HTML.
- `jobs/check.job.ts` / `notify.job.ts` / `generate.job.ts` / `heartbeat-check.job.ts` / `retention.job.ts` — BullMQ handlers.
- `utils/auth.ts` — `jose` JWT sign/verify (HS256, 7-day expiry).
- `utils/state-machine.ts` — Redis-backed consecutive-failure counter + transition evaluator.
- `utils/ssrf.ts` — Public-URL guard for any outbound HTTP triggered by user input (webhooks, monitor URLs).

### Key Patterns
- **Multi-tenancy:** All resources scoped to `orgId`; users own organizations.
- **State machine:** Redis counts consecutive failures per monitor. `confirmationCount` failures (default 2) → DOWN; 1 success → UP. This is what prevents single-blip false alarms — do not bypass.
- **Transitions trigger side effects:** Only on UP→DOWN / DOWN→UP transitions do we enqueue notify + status-page regen jobs. Routine checks only persist a `check_result` row.
- **Static status pages:** Pages are pre-rendered so they survive origin downtime — regenerate on incident/monitor changes, don't render on request.
- **BullMQ repeatable jobs:** One repeatable job per monitor, decoupled from HTTP server. When a monitor's interval changes, the old repeatable must be removed and a new one added.
- **Public routes (no auth):** `/status/:slug`, `/status/:slug/incidents`, `/status/:slug/subscribe`, verify/unsubscribe confirmation pages (HTML), `/badge/:slug.svg`, `/hb/:slug` (heartbeat ping), `/health`, `/api/tools/*` (free public tools).
- **Plan limits:** Enforced at the app layer using `packages/shared/src/constants.ts` (`PLAN_LIMITS`, `PLAN_CATALOG`). That file is the single source of truth — README and landing copy follow it, not the other way around.

### Database Enums
- `plan`: free | indie | pro | team
- `monitor_type`: http | tcp | keyword
- `monitor_status`: up | down | degraded | unknown
- `incident_status`: investigating | identified | monitoring | resolved
- `incident_severity`: minor | major | critical

### Web Routing
- Public: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/pricing`, `/docs`, `/mcp`, `/self-host`, `/changelog`, `/tools/*`, `/vs/*`, `/freshping-alternative`.
- Authed (nested under `ProtectedRoute` → `DashboardLayout`): `/dashboard`, `/dashboard/monitors[...]`, `/dashboard/incidents[...]`, `/dashboard/status-pages[...]`, `/dashboard/heartbeats[...]`, `/dashboard/maintenance[...]`, `/dashboard/settings`.
- `PublicRoute` redirects logged-in users away from landing/login/register.

### Docker & CI
- Multi-stage Dockerfiles for API and web (development + production targets). Default `docker-compose.yml` uses `target: development` with bind mounts for hot-reload. `docker-compose.prod.yml` pulls pre-built GHCR images and runs in production mode.
- Web production image is nginx with SPA fallback and reverse proxy to the API (entrypoint substitutes `API_URL` into the nginx config).
- CI (`.github/workflows/ci.yml`): typecheck + tests with Postgres 16 + Redis 7 service containers + Docker build validation.
- Deploy (`.github/workflows/deploy.yml`): pushes API and web images to `ghcr.io/${{ github.repository }}/{api,web}:latest` on `main`.

## Open core split

This repository is the full self-hostable platform under AGPL-3.0. SSO, audit log, advanced RBAC, multi-region check orchestration, and SLA-report PDFs are not in scope here — see `OPEN_CORE.md`. Don't accept PRs for those features; redirect contributors to discussion first.
