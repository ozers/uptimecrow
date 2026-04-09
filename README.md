# UptimeCrow

AI-native uptime monitoring and status page platform. Monitor your services, get AI-generated incident reports, and serve pre-rendered status pages that stay online even when your origin goes down.

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Node](https://img.shields.io/badge/Node-%3E%3D20-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **HTTP Monitoring** — Configurable interval checks with timeout, expected status codes, and multi-region support
- **AI-Powered Incidents** — Claude automatically generates incident titles, severity assessments, and resolution summaries on state transitions
- **Pre-Rendered Status Pages** — Static HTML/JSON pages survive origin downtime; your users see status even when you're down
- **Real-Time State Machine** — Redis-backed consecutive failure tracking with configurable confirmation thresholds (no single-blip false alarms)
- **Email Notifications** — Subscribers receive incident and resolution emails via Resend
- **Embeddable Badges** — SVG status badges for your README or docs (`/badge/:slug.svg`)
- **Multi-Tenancy** — Organization-scoped resources with role-based access
- **Tiered Plans** — Free, Pro, and Team with enforced limits on monitors, pages, intervals, and AI usage

## Plan Limits

| Feature | Free | Pro | Team |
|---|---|---|---|
| Monitors | 3 | 20 | 50 |
| Status Pages | 1 | 3 | Unlimited |
| Min Interval | 5 min | 30 sec | 30 sec |
| AI Reports | No | Yes | Yes |
| Data Retention | 7 days | 90 days | 365 days |
| Seats | 1 | 2 | 5 |
| Custom Domain | No | Yes | Yes |
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
| AI | Anthropic Claude (Haiku/Sonnet) |
| Email | [Resend](https://resend.com) |
| Infra | Docker, pnpm workspaces |

## Architecture

```
uptimecrow/
├── apps/
│   ├── api/                 # Hono backend + BullMQ workers
│   │   ├── src/
│   │   │   ├── routes/      # Auth, monitors, incidents, status pages, analytics, public
│   │   │   ├── services/    # Monitor checks, AI reports, notifications, static gen
│   │   │   ├── jobs/        # BullMQ handlers: check, notify, generate
│   │   │   ├── middleware/   # JWT auth (cookie + Bearer header)
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
                          ┌────────────┼────────────┐
                          │            │            │
                   ┌──────▼───┐ ┌──────▼───┐ ┌─────▼──────┐
                   │ AI Report│ │  Notify  │ │ Regen Page │
                   │ (Claude) │ │ (Resend) │ │  (Static)  │
                   └──────────┘ └──────────┘ └────────────┘
```

- **AI is called only on state transitions**, not on every check — keeping costs minimal
- **Static pages are pre-rendered** to in-memory storage so they're served instantly and survive origin failures
- **2 consecutive failures** (configurable via `confirmationCount`) required before marking a monitor DOWN

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

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/anthropics/uptimecrow.git
cd uptimecrow

# Copy environment variables
cp .env.example .env

# Start all services
docker compose up
```

This starts:
- **PostgreSQL 16** on port `5432`
- **Redis 7** on port `6379`
- **API** on port `3000` (with hot-reload)
- **Web** on port `5173` (with hot-reload)

Open [http://localhost:5173](http://localhost:5173) to see the app.

### Local Development (without Docker)

```bash
# Install dependencies
pnpm install

# Make sure PostgreSQL and Redis are running locally, then:
cp .env.example .env
# Edit .env with your local PostgreSQL/Redis URLs

# Run database migrations
pnpm db:migrate

# Start API and Web in separate terminals
pnpm dev:api    # http://localhost:3000
pnpm dev:web    # http://localhost:5173
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs (change in production!) |
| `MODE` | No | `all` | API process mode: `api`, `worker`, or `all` |
| `PORT` | No | `3000` | API server port |
| `NODE_ENV` | No | `development` | Environment |
| `ANTHROPIC_API_KEY` | No | — | Enables AI-generated incident reports |
| `RESEND_API_KEY` | No | — | Enables email notifications |
| `APP_URL` | No | `http://localhost:3000` | Base URL for links in emails |
| `STATUS_PAGE_URL` | No | `http://localhost:3000/status` | Public status page base URL |

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

### Public (no auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/status/:slug` | Public status page |
| `GET` | `/status/:slug/incidents` | Public incident history |
| `POST` | `/status/:slug/subscribe` | Subscribe to updates |
| `GET` | `/badge/:slug.svg` | Embeddable status badge |
| `GET` | `/health` | Health check |

## Database Schema

8 tables with full referential integrity:

- **users** — Accounts with email, password hash, plan tier
- **organizations** — Multi-tenant org scoping, AI token tracking
- **monitors** — HTTP monitors with interval, timeout, expected status, confirmation count
- **check_results** — Time-series check data (status, response time, status code, region)
- **status_pages** — Branded pages with slug, custom domain, logo, colors
- **incidents** — Linked to monitors and status pages, AI-generated flag
- **incident_updates** — Timeline entries for each incident
- **subscribers** — Email subscribers per status page with verification

## Deployment

### Docker Production Build

```bash
# Build production images
docker build -t uptimecrow-api --target production apps/api/
docker build -t uptimecrow-web --target production apps/web/

# Run
docker run -p 3000:3000 --env-file .env uptimecrow-api
docker run -p 80:80 uptimecrow-web
```

### CI/CD

The project includes GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`) — Runs on PRs and pushes to main:
  - Lint + TypeScript check
  - Tests with PostgreSQL 16 + Redis 7 service containers
  - Docker build validation for both images

- **Deploy** (`.github/workflows/deploy.yml`) — Pushes to GitHub Container Registry on main:
  - Builds and tags `ghcr.io/<repo>/api:latest` and `ghcr.io/<repo>/web:latest`

### Production Checklist

- [ ] Set a strong `JWT_SECRET`
- [ ] Configure `ANTHROPIC_API_KEY` for AI incident reports
- [ ] Configure `RESEND_API_KEY` for email notifications
- [ ] Set `APP_URL` and `STATUS_PAGE_URL` to your production domain
- [ ] Run `MODE=api` and `MODE=worker` as separate processes for independent scaling
- [ ] Set up PostgreSQL with proper backups and connection pooling
- [ ] Configure Redis persistence if needed for state machine durability

## License

MIT
