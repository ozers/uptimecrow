# Changelog

Notable changes to UptimeCrow. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/).

Container images are published to `ghcr.io/ozers/uptimecrow/api`. **Pin a
version tag in production** — `:latest` moves whenever `main` does.

## [Unreleased]

Nothing yet.

## [0.1.0] — 2026-09-09

First tagged release. Everything below has been running in production; the tag
exists so self-hosters have something to pin.

### Changed

- The API now serves the built web app, so self-hosting is three containers
  (Postgres, Redis, app) instead of four. The UI and the API share an origin:
  no CORS to configure, no reverse-proxy rules to keep in sync. The separate
  nginx image still builds for the development compose file.
- Team plans are handled through a conversation instead of a self-serve
  checkout — the product has no invite flow, so a seat count on the pricing
  page would have promised what it cannot deliver.
- Creating a monitor asks for one thing, the URL. Name, type and interval are
  derived from it and editable; everything else folds into Advanced. Saving
  lands on the monitor detail, which polls until the first check result arrives.
- The dashboard gained a mobile tab bar, a command palette (⌘K), list filtering
  with search and counted status segments, and a table density mode.
- Text colours use opaque tiers instead of alpha clips, so contrast holds at AA
  in both themes; every interactive element has a visible focus ring.

### Fixed

- **Security:** outbound webhook requests (Slack, Discord, custom) followed
  HTTP redirects, which let a webhook host walk past the SSRF guard into
  internal addresses. Requests now use `redirect: "manual"` and a 10s timeout.
- **Security:** `POST /api/auth/reset-password` had no rate limit while running
  bcrypt on every call.
- `GET /badge/<slug>.svg` returned 404. The handler was only reachable under
  `/status`, while the docs, the OpenAPI spec and the README all pointed at
  `/badge` — every embedded badge was broken.
- The uptime badge counted every monitor in the organization instead of the
  ones attached to the status page it belongs to.
- Registration turned any capitalised email local part into `----`.
- Deleting a monitor stranded its Redis failure counter forever.
- Marketing routes are pre-rendered, so crawlers that do not run JavaScript
  receive real HTML with per-route titles, descriptions and canonicals.

### Added

- **Monitoring** — HTTP, TCP and keyword checks with configurable interval,
  timeout and confirmation count. Optional HEAD-only requests for HTTP.
- **Consecutive-failure state machine** — a monitor must fail N checks in a row
  (default 2) before an incident opens, so a single blip never pages anyone.
- **Status pages** — pre-rendered to static HTML and JSON on every incident or
  monitor change, so they keep serving while the origin they report on is down.
  Custom domains, logo and brand colour on paid plans.
- **Incidents** — opened, updated and resolved automatically; investigating →
  identified → monitoring → resolved with minor/major/critical severity. A
  flapping service reopens its incident instead of creating duplicates.
- **Maintenance windows** — planned downtime announced on the page and excluded
  from alerting.
- **Subscribers** — double opt-in email subscriptions per status page with
  one-click unsubscribe.
- **Notifications** — email via Amazon SES, plus Slack, Discord and custom
  webhooks.
- **SSL and domain expiry monitoring** — checked at most once every 24h, with a
  configurable warning threshold.
- **Uptime badge** — embeddable SVG at `/badge/<slug>.svg`.
- **REST API** — full CRUD for monitors, incidents, status pages and
  maintenance windows, documented with an OpenAPI spec at `/api/docs`.
- **Recurring maintenance windows** — weekly or monthly, bounded by a date or a
  repeat count. The next window is materialised when the current one closes.
- **Self-hosting** — `docker compose up` with Postgres and Redis; AGPL-3.0, no
  feature gates, telemetry off unless you configure it.

[Unreleased]: https://github.com/ozers/uptimecrow/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ozers/uptimecrow/releases/tag/v0.1.0
