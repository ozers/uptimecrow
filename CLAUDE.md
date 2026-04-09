# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack
- **Backend:** Hono + TypeScript + Drizzle ORM + BullMQ
- **Frontend:** Vite + React + Tailwind CSS
- **Database:** PostgreSQL 16 + Redis 7
- **AI:** Anthropic Claude API (Haiku/Sonnet)
- **Email:** Resend
- **Infra:** Docker, pnpm workspaces, Node >= 20

## Development Commands
```bash
docker compose up                    # Start all services (PostgreSQL, Redis, API on :3000, Web on :5173)
pnpm install                         # Install deps locally (for IDE support)
pnpm db:generate                     # Generate Drizzle migration files
pnpm db:migrate                      # Run database migrations
pnpm test                            # Run all tests (vitest)
pnpm typecheck                       # Type check all packages
pnpm lint                            # ESLint across all packages
pnpm --filter @uptimecrow/api test    # Run tests for a single package
pnpm dev:api                         # Run API outside Docker (needs local Postgres/Redis)
pnpm dev:web                         # Run web outside Docker
```

## Architecture

### Monorepo Layout
- `apps/api` — Hono backend + BullMQ workers. `MODE=api|worker|all` env var controls what runs.
- `apps/web` — Vite React SPA. Proxies `/api`, `/status`, `/badge` to the API via Vite dev server (and nginx in prod).
- `packages/shared` — Shared TypeScript types, constants (plan limits, defaults), and Zod validation schemas. Both API and web import from `@uptimecrow/shared`.

### API Structure (`apps/api/src/`)
- `index.ts` — Entry point; starts API server, BullMQ workers, or both based on `MODE`
- `server.ts` — Hono app with CORS, logger, health check, route mounting
- `routes/` — Route modules: auth, monitors, incidents, status-pages, subscribers, analytics, public status/badge
- `middleware/auth.ts` — JWT auth middleware (reads from cookie or `Authorization: Bearer` header)
- `db/schema.ts` — Drizzle schema with all tables and enums
- `db/index.ts` — Database connection (uses `postgres` driver, not `pg`)
- `services/` — Business logic: `monitor.service.ts` (HTTP checks), `ai.service.ts` (Claude integration), `notification.service.ts` (Resend), `static-gen.service.ts` (page rendering)
- `jobs/` — BullMQ job handlers: `check.job.ts` (monitor execution), `generate.job.ts` (status page regen), `notify.job.ts` (email dispatch)
- `utils/auth.ts` — JWT sign/verify via `jose` (HS256, 7-day expiry)
- `utils/state-machine.ts` — Redis-backed failure counter + transition evaluator

### Key Patterns
- **Multi-tenancy:** All resources scoped to `orgId`. Users own organizations.
- **State machine:** Redis tracks consecutive failures per monitor. 2 consecutive failures (configurable via `confirmationCount`) → DOWN; 1 success → UP.
- **AI on transitions only:** Claude API is called only on state changes (UP→DOWN, DOWN→UP), never on routine checks.
- **Static status pages:** Pre-rendered HTML/JSON so status pages survive origin downtime.
- **BullMQ repeatable jobs:** Monitor checks decoupled from HTTP server; each monitor gets a repeatable job.
- **Public routes:** `/status/:slug`, `/status/:slug/incidents`, `/status/:slug/subscribe`, `/badge/:slug.svg` require no auth.
- **Plan limits:** Enforced at application level. Free: 3 monitors, 1 status page, 300s min interval, no AI. Pro/Team scale up.

### Database Enums
- `plan`: free | pro | team
- `monitor_type`: http | tcp | keyword
- `monitor_status`: up | down | degraded | unknown
- `incident_status`: investigating | identified | monitoring | resolved
- `incident_severity`: minor | major | critical

### Web Routing
- `/` — Landing page with waitlist
- `/dashboard` — Dashboard (stub)
- `/login` — Login (stub)

### Docker
- Multi-stage Dockerfiles for both API and web (development + production targets)
- Docker Compose uses `target: development` with volume mounts for hot-reload
- Web production uses nginx with SPA fallback and reverse proxy to API

### CI (`.github/workflows/ci.yml`)
- Lint + typecheck job
- Test job with PostgreSQL 16 + Redis 7 services (test DB: `uptimecrow_test`)
- Docker build validation for both images
