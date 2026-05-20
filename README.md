# UptimeCrow

Developer-first uptime monitoring and status page platform. Monitor your services, notify subscribers on incidents, and serve pre-rendered status pages that stay online even when your origin goes down.

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Node](https://img.shields.io/badge/Node-%3E%3D20-green)
![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue)

> **Open core.** This repository is the full self-hostable platform under AGPL-3.0. The managed service at [uptimecrow.com](https://uptimecrow.com) runs the same code plus a small set of enterprise add-ons (SSO, audit log, multi-region). See [OPEN_CORE.md](./OPEN_CORE.md) for the exact split.

## Features

- **HTTP / Keyword Monitoring** — Configurable interval checks with timeout, expected status codes, keyword-in-body matching, and multi-region support (Team plan)
- **Pre-Rendered Status Pages** — Static HTML/JSON pages survive origin downtime; your users see status even when you're down
- **Redis State Machine** — Consecutive-failure confirmation (configurable, default 2) prevents single-blip false alarms
- **Email + Chat Notifications** — Amazon SES for transactional email to subscribers; native Slack and Discord webhooks
- **Branded Status Pages** — Custom logo, brand color, custom domain, private-access tokens, embeddable SVG badges
- **Subscriber Management** — Double opt-in verification, one-click unsubscribe (HTML confirmation pages)
- **Multi-Tenancy** — Organization-scoped resources
- **Tiered Plans** — Free, Pro, and Team with enforced limits on monitors, pages, intervals, retention, and regions
- **Billing** — Polar integration with Standard Webhooks signature verification

## Plan Limits

| Feature | Free | Pro | Team |
|---|---|---|---|
| Monitors | 3 | 20 | 50 |
| Status Pages | 1 | 3 | Unlimited |
| Min Interval | 5 min | 30 sec | 30 sec |
| Data Retention | 7 days | 90 days | 365 days |
| Seats | 1 | 2 | 5 |
| Custom Domain | No | Yes | Yes |
| Slack / Discord | No | Yes | Yes |
| Multi-Region Checks | No | No | Yes |
| API Access | No | No | Yes |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | [Hono](https://hono.dev) + TypeScript |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Job Queue | [BullMQ](https://bullmq.io) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Database | PostgreSQL 16 |
| Cache/State | Redis 7 |
| Email | [Amazon SES](https://aws.amazon.com/ses/) (`@aws-sdk/client-sesv2`) |
| Billing | [Polar](https://polar.sh) |
| Infra | Docker, pnpm workspaces |

## Architecture

```
uptimecrow/
├── apps/
│   ├── api/                 # Hono backend + BullMQ workers
│   │   ├── src/
│   │   │   ├── routes/      # Auth, monitors, incidents, status pages, analytics, billing, public
│   │   │   ├── services/    # Monitor checks, notifications (SES/Slack/Discord), static gen
│   │   │   ├── routes/billing.ts  # Polar checkout, customer portal, webhook
│   │   │   ├── jobs/        # BullMQ handlers: check, notify, generate
│   │   │   ├── middleware/  # JWT auth (cookie + Bearer header), rate limiting
│   │   │   ├── db/          # Drizzle schema & connection
│   │   │   └── utils/       # JWT helpers, Redis state machine
│   │   └── Dockerfile
│   └── web/                 # Vite React SPA
│       ├── src/
│       │   └── pages/       # Landing, Dashboard, Login
│       ├── nginx.conf       # Production: SPA fallback + API proxy
│       └── Dockerfile
├── packages/
│   └── shared/              # Types, constants, Zod validation schemas
├── docker-compose.yml
└── .github/workflows/       # CI (lint, test, docker build) + Deploy (GHCR)
```

### How It Works

```
                    ┌─────────────┐
                    │  BullMQ Job │  Repeatable per monitor
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  HTTP Check  │  executeHttpCheck()
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ State Machine│  Redis failure counter
                    └──────┬──────┘
                           │
               ┌───────────┼───────────┐
               │                       │
        No transition            Transition detected
        (store result)           (UP→DOWN or DOWN→UP)
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                   ┌──────▼──────┐         ┌────────▼─────┐
                   │   Notify    │         │  Regen Page  │
                   │ (SES/Slack/ │         │   (Static)   │
                   │  Discord)   │         │              │
                   └─────────────┘         └──────────────┘
```

- **Static pages are pre-rendered** to in-memory storage so they're served instantly and survive origin failures
- **2 consecutive failures** (configurable via `confirmationCount`) required before marking a monitor DOWN
- **Side effects only on state transitions** — routine checks just persist a `check_results` row

### API Mode

The API process supports three modes via the `MODE` environment variable:

| Mode | What runs |
|---|---|
| `api` | HTTP server only |
| `worker` | BullMQ workers only |
| `all` | Both (default for development) |

This allows you to scale API servers and workers independently in production.

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) >= 20 (for local IDE support)
- [pnpm](https://pnpm.io/) >= 9

### Quick Start (Docker, development)

```bash
git clone https://github.com/ozers/uptimecrow.git
cd uptimecrow
cp .env.example .env
docker compose up
```

This starts:
- **PostgreSQL 16** on port `5432`
- **Redis 7** on port `6379`
- **API** on port `3000` (with hot-reload)
- **Web** on port `5173` (with hot-reload)

Open [http://localhost:5173](http://localhost:5173) to see the app.

### Production self-host

For an actual production deploy on a VPS, use `docker-compose.prod.yml` — it pulls pre-built images from GHCR, runs the API in production mode, and runs migrations automatically on startup.

```bash
cp .env.prod.example .env
# Edit .env — set POSTGRES_PASSWORD, JWT_SECRET, APP_URL (required).
# Generate strong secrets with: openssl rand -hex 32

docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f api
```

Web UI on port `80`, API on `3000`. Put nginx/Caddy in front for TLS. Email (SES), billing (Polar), and SMS (Twilio) integrations are all optional — UptimeCrow runs fine with just the four core containers.

### Local Development (without Docker)

```bash
pnpm install
cp .env.example .env
# Edit .env with your local PostgreSQL/Redis URLs

pnpm db:migrate

pnpm dev:api    # http://localhost:3000
pnpm dev:web    # http://localhost:5173
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs (must be changed in production) |
| `MODE` | No | `all` | API process mode: `api`, `worker`, or `all` |
| `PORT` | No | `3000` | API server port |
| `NODE_ENV` | No | `development` | Environment |
| `LOG_LEVEL` | No | — | Pino log level override (`info` in prod, `debug` in dev by default) |
| `VITE_PLAUSIBLE_DOMAIN` | No | — | Plausible Analytics site domain (web build-time) |
| `APP_URL` | No | `http://localhost:5173` | Base URL for links in emails |
| `STATUS_PAGE_URL` | No | `http://localhost:5173/status` | Public status page base URL |
| `AWS_ACCESS_KEY_ID` | No¹ | — | AWS credentials for SES |
| `AWS_SECRET_ACCESS_KEY` | No¹ | — | AWS credentials for SES |
| `AWS_REGION` | No¹ | `us-east-1` | AWS region for SES |
| `SES_FROM_EMAIL` | No¹ | — | Verified "from" address in SES |
| `POLAR_ACCESS_TOKEN` | No² | — | Polar API token |
| `POLAR_WEBHOOK_SECRET` | No² | — | Polar webhook signing secret (base64) |
| `POLAR_PRO_PRODUCT_ID` | No² | — | Polar Pro product ID |
| `POLAR_TEAM_PRODUCT_ID` | No² | — | Polar Team product ID |

¹ Required to send email notifications.
² Required to accept paid plan upgrades.

## Development Commands

```bash
# Docker
docker compose up                     # Start all services
docker compose up --build             # Rebuild and start

# Dependencies
pnpm install                          # Install all workspace dependencies

# Database
pnpm db:generate                      # Generate Drizzle migration files
pnpm db:migrate                       # Run migrations

# Quality
pnpm typecheck                        # TypeScript check across all packages
pnpm lint                             # ESLint across all packages
pnpm test                             # Run all tests (vitest)

# Per-package
pnpm --filter @uptimecrow/api test    # Run API tests only
pnpm --filter @uptimecrow/web build   # Build web only
```

## API Endpoints

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login (returns JWT in cookie) |
| `POST` | `/api/auth/forgot-password` | Send password reset email |
| `POST` | `/api/auth/reset-password` | Reset password with token |

### Monitors (authenticated)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/monitors` | List monitors |
| `POST` | `/api/monitors` | Create monitor |
| `GET` | `/api/monitors/:id` | Get monitor details |
| `PATCH` | `/api/monitors/:id` | Update monitor |
| `DELETE` | `/api/monitors/:id` | Delete monitor |

### Incidents (authenticated)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/incidents` | List incidents |
| `POST` | `/api/incidents` | Create incident |
| `PATCH` | `/api/incidents/:id` | Update incident |
| `POST` | `/api/incidents/:id/updates` | Add incident update |

### Status Pages (authenticated)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/status-pages` | List status pages |
| `POST` | `/api/status-pages` | Create status page |
| `PATCH` | `/api/status-pages/:id` | Update status page |
| `DELETE` | `/api/status-pages/:id` | Delete status page |

### API Documentation

Interactive Swagger UI at `/api/docs` and the raw OpenAPI 3.1 document at `/api/openapi.json`.

### API Keys (Team plan, dashboard only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/api-keys` | List active keys |
| `POST` | `/api/api-keys` | Create a key (secret shown once) |
| `DELETE` | `/api/api-keys/:id` | Revoke a key |

Use the returned key as `Authorization: Bearer <key>` on any `/api/*` endpoint.

### Billing (authenticated)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/billing/checkout` | Polar checkout session |
| `POST` | `/api/billing/portal` | Polar customer portal session |
| `POST` | `/api/billing/webhook` | Polar webhook (Standard Webhooks) |

### Public (no auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/status/:slug` | Public status page (HTML) |
| `GET` | `/status/:slug/incidents` | Public incident history |
| `POST` | `/status/:slug/subscribe` | Subscribe to updates |
| `GET` | `/badge/:slug.svg` | Embeddable status badge |
| `GET` | `/health` | Health check |

## Database Schema

9 tables with full referential integrity:

- **users** — Accounts with email, password hash, plan tier
- **organizations** — Multi-tenant org scoping
- **monitors** — HTTP/keyword monitors with interval, timeout, expected status, confirmation count
- **check_results** — Time-series check data (status, response time, status code, region)
- **status_pages** — Branded pages with slug, custom domain, logo, brand color, access token
- **status_page_monitors** — Junction table linking monitors to status pages
- **incidents** — Linked to monitors and status pages
- **incident_updates** — Timeline entries for each incident
- **subscribers** — Email subscribers per status page with double-opt-in verification

## Deployment

### Docker Production Build

```bash
docker build -t uptimecrow-api --target production apps/api/
docker build -t uptimecrow-web --target production apps/web/

docker run -p 3000:3000 --env-file .env uptimecrow-api
docker run -p 80:80 uptimecrow-web
```

### CI/CD

GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`) — Runs on PRs and pushes to main: lint, TypeScript check, tests with PostgreSQL 16 + Redis 7 service containers, Docker build validation.
- **Deploy** (`.github/workflows/deploy.yml`) — Pushes to GitHub Container Registry on main.

### Production Checklist

- [ ] Set a strong, random `JWT_SECRET` (startup will fail in production if it's the default)
- [ ] Configure Amazon SES (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SES_FROM_EMAIL`) with a verified sender domain
- [ ] Configure Polar (`POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, product IDs) and point the Polar dashboard webhook at `/api/billing/webhook`
- [ ] Set `APP_URL` and `STATUS_PAGE_URL` to your production domain
- [ ] Run `MODE=api` and `MODE=worker` as separate processes for independent scaling
- [ ] Set up PostgreSQL with proper backups and connection pooling
- [ ] Configure Redis persistence if you need state machine durability across restarts
- [ ] Put a CDN in front of `/status/:slug` for further origin-downtime resilience

## License

UptimeCrow is licensed under the **GNU Affero General Public License v3.0**. See [LICENSE](./LICENSE) for the full text and [OPEN_CORE.md](./OPEN_CORE.md) for what's in the open core vs. managed-only.

**Plain-English summary** (not legal advice):

- You can self-host UptimeCrow for free, forever, including for your company's internal use.
- You can modify it however you like.
- If you offer a modified version of UptimeCrow as a network service to third parties, AGPL requires you to publish your modifications under the same license.
- If your organization cannot use AGPL software, [contact us](mailto:hello@uptimecrow.com) about a commercial license.

## Contributing

PRs and issues are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md), and report security issues per [SECURITY.md](./SECURITY.md).
