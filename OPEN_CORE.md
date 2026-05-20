# Open Core

UptimeCrow is **open core**:

- **This repository** is licensed under **AGPL-3.0**. It contains the complete uptime monitoring engine, status pages, notifications, MCP server, and dashboard. You can self-host it forever, free of charge, with no feature gates.
- **The managed service at [uptimecrow.com](https://uptimecrow.com)** runs this codebase plus a small number of proprietary add-ons aimed at larger teams.

This page documents that split so contributors and self-hosters know exactly what lives where.

## What's in this repository (AGPL-3.0, free to self-host)

Everything required to run a full uptime monitoring platform for one or many organizations:

- **Monitoring engine** — HTTP, TCP, and keyword checks via BullMQ workers
- **State machine** — Redis-backed consecutive-failure confirmation (prevents single-blip false alarms)
- **Status pages** — Pre-rendered HTML/JSON, custom domains, branded with logo and color, private access tokens, embeddable SVG badges
- **Incidents** — Manual and auto-created on UP→DOWN transitions, timeline updates, templates
- **Heartbeats** — Cron-job style "ping me every N minutes" monitoring
- **Maintenance windows** — Suppress alerts during planned downtime
- **Notifications** — Email (Amazon SES), Slack, Discord, PagerDuty, Microsoft Teams, Telegram, generic webhook
- **Multi-tenancy** — Organizations, team members, roles (owner, admin, member)
- **API** — Full REST API with API key authentication
- **MCP server** — Model Context Protocol server so AI assistants can query monitors
- **On-call** — Basic on-call schedules and rotations
- **Billing integration** — Polar checkout/webhook plumbing (bring your own Polar account, or leave unset)
- **Docker Compose** — Single-command self-host deploy

If a feature appears in `apps/api/src/routes/` or `apps/web/src/pages/`, it is part of the open core.

## What's NOT in this repository (managed-only)

These features are not yet implemented; when they are, they will live in a separate, source-available enterprise repository and ship only with the managed service or paid enterprise licenses:

- **SSO / SAML** — Okta, Azure AD, Google Workspace, custom IdPs
- **Audit log** — Tamper-evident record of every privileged action
- **Advanced RBAC** — Custom roles beyond owner/admin/member, per-resource permissions
- **Multi-region check infrastructure** — Globally distributed check workers (the open core supports one region per deploy)
- **SLA reports** — Branded PDF export of uptime/availability over arbitrary windows
- **Priority support & SLAs** — Contractual response times

If you need any of these, [the hosted plan](https://uptimecrow.com/pricing) is the easiest path. If you want them on your own infrastructure, contact us about an enterprise license.

## Why AGPL-3.0?

We picked AGPL over MIT/Apache because:

1. **You can still self-host and modify everything for your own use** — that is the whole point of AGPL.
2. **If you offer UptimeCrow as a service to third parties**, AGPL requires you to publish your modifications. This keeps the playing field level between us, contributors, and anyone running a fork.
3. **AGPL prevents the "take it, close it, undercut the maintainer" pattern** that has killed many smaller OSS projects. It does not prevent legitimate use, including commercial internal use.

If your organization cannot use AGPL software (some enterprises have policies against it), reach out — we can talk about a commercial license for the same codebase.

## Brand and trademark

The name **UptimeCrow** and the crow mark are trademarks of the project maintainers. The AGPL license covers the code, not the brand.

If you fork the project to run your own service, please pick a different name. You are welcome to say "based on UptimeCrow" or "powered by UptimeCrow"; you are not welcome to call your fork "UptimeCrow" or anything confusingly similar.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Contributions to this repository are licensed under AGPL-3.0 by default. We do **not** require a CLA today.
