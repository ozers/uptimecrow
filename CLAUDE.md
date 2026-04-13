# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
pnpm lint                            # ESLint across all packages
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
- `index.ts` — Entry; dispatches to `startServer()` and/or `startWorker()` based on `MODE`.
- `server.ts` — Hono app: CORS, logger, health check, route mounting.
- `worker.ts` — BullMQ worker bootstrap (registers repeatable check jobs for all monitors at startup).
- `routes/` — `auth`, `monitors`, `incidents`, `status-pages`, `subscribers`, `analytics`, `billing`, `settings`, `public` (status pages, subscribe, badge).
- `middleware/auth.ts` — JWT auth (reads cookie or `Authorization: Bearer`).
- `middleware/rate-limit.ts` — Redis-backed rate limiting.
- `db/schema.ts` + `db/index.ts` — Drizzle schema and connection (uses `postgres` driver, not `pg`).
- `services/monitor.service.ts` — HTTP/TCP/keyword checks.
- `services/notification.service.ts` — Email via Amazon SES + Slack/Discord webhooks.
- `services/static-gen.service.ts` — Pre-renders status pages to storage.
- `jobs/check.job.ts` / `notify.job.ts` / `generate.job.ts` — BullMQ handlers.
- `utils/auth.ts` — `jose` JWT sign/verify (HS256, 7-day expiry).
- `utils/state-machine.ts` — Redis-backed consecutive-failure counter + transition evaluator.

### Key Patterns
- **Multi-tenancy:** All resources scoped to `orgId`; users own organizations.
- **State machine:** Redis counts consecutive failures per monitor. `confirmationCount` failures (default 2) → DOWN; 1 success → UP. This is what prevents single-blip false alarms — do not bypass.
- **Transitions trigger side effects:** Only on UP→DOWN / DOWN→UP transitions do we enqueue notify + status-page regen jobs. Routine checks only persist a `check_result` row.
- **Static status pages:** Pages are pre-rendered so they survive origin downtime — regenerate on incident/monitor changes, don't render on request.
- **BullMQ repeatable jobs:** One repeatable job per monitor, decoupled from HTTP server. When a monitor's interval changes, the old repeatable must be removed and a new one added.
- **Public routes (no auth):** `/status/:slug`, `/status/:slug/incidents`, `/status/:slug/subscribe`, verify/unsubscribe confirmation pages (HTML), `/badge/:slug.svg`, `/health`.
- **Plan limits:** Enforced at the app layer using `packages/shared` constants. Free: 3 monitors, 1 status page, 300s min interval. Pro/Team scale up (see README for the full matrix).

### Database Enums
- `plan`: free | pro | team
- `monitor_type`: http | tcp | keyword
- `monitor_status`: up | down | degraded | unknown
- `incident_status`: investigating | identified | monitoring | resolved
- `incident_severity`: minor | major | critical

### Web Routing
- Public: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- Authed (nested under `ProtectedRoute` → `DashboardLayout`): `/dashboard`, `/dashboard/monitors[...]`, `/dashboard/incidents[...]`, `/dashboard/status-pages[...]`, `/dashboard/settings`
- `PublicRoute` redirects logged-in users away from landing/login/register.

### Docker & CI
- Multi-stage Dockerfiles for API and web (development + production targets). Compose uses `target: development` with bind mounts for hot-reload.
- Web production image is nginx with SPA fallback and reverse proxy to the API.
- CI (`.github/workflows/ci.yml`): lint + typecheck, tests with Postgres 16 + Redis 7 service containers (`uptimecrow_test`), Docker build validation for both images. Deploy workflow pushes to GHCR on `main`.

## Historical Notes (watch for stale references)
- **AI/Anthropic integration was removed** (commit `0dcdb2c`). No `ai.service.ts`, no Claude calls, no `ANTHROPIC_API_KEY`. Older docs and the README still mention it — ignore those references.
- **Email switched from Resend → nodemailer/SMTP → Amazon SES** (commits `41614ec`, `706d55b`). Use `@aws-sdk/client-sesv2` + `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `SES_FROM_EMAIL`. Do not reintroduce Resend or nodemailer.
- **Verify/unsubscribe endpoints return HTML** confirmation pages, not JSON (commit `0073a16`).
