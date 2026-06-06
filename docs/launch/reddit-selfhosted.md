# r/selfhosted draft

**Title:** UptimeCrow – self-hostable uptime monitor + status pages (AGPL, one docker compose up)

---

**Body:**

I've been building an uptime monitor for the last few months and just made the
repo public. Sharing here because this community is exactly who it's for.

**What it is:** HTTP/TCP/keyword monitoring, automatic incidents, and status
pages — self-hostable under AGPL-3.0, no feature gates, unlimited monitors when
you run it yourself.

```bash
git clone https://github.com/ozers/uptimecrow.git
cd uptimecrow
cp .env.prod.example .env   # set POSTGRES_PASSWORD, JWT_SECRET, APP_URL
docker compose -f docker-compose.prod.yml up -d
```

Postgres + Redis + API + web, four containers, done. Put Caddy/nginx in front
for TLS.

**Why not just Uptime Kuma?** Kuma is great and I still recommend it for a
single-user homelab. UptimeCrow is aimed at the next step up:

| | Uptime Kuma | UptimeCrow |
|---|---|---|
| Multi-user / orgs | ✗ | ✓ |
| Status pages (custom domain, subscribers) | basic | ✓ pre-rendered, survive origin downtime |
| REST API | ✗ | ✓ full CRUD |
| Managed option if you stop wanting to self-host | ✗ | ✓ |
| Notification channels | 90+ | email/Slack/Discord/PagerDuty/Teams/Telegram/webhook |

(Kuma still wins on raw notification-integration count — credit where due.)

**One unusual thing:** there's a native MCP server, so you can wire it into
Claude/Cursor and literally ask "are any of my services down?" Genuinely useful
if you live in an AI editor.

It's solo-maintained and AGPL — self-host forever, free. There's a hosted plan
too, but that's optional; this post is about the self-host path.

Feedback very welcome, especially on the Docker setup and anything that tripped
you up. Repo: https://github.com/ozers/uptimecrow
