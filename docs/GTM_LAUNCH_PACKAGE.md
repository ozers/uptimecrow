# UptimeCrow — Go-To-Market Launch Package

**Tarih:** 2026-05-19  
**Amaç:** Launch haftasında kopyala-yapıştır hazır içerik. Kod değişikliği yok.  
**Ton ilkesi:** Dürüst, teknik, hype-free. HN'de oversell = downvote. Kendi sınırlarını söyle.

---

## 1. Ürün Konumlandırma (1-liner)

Üç farklı duruma göre kullan:

**Technical** (GitHub README hero, awesome-selfhosted entry, HN başlığı altındaki ilk paragraf):
> MIT-licensed uptime monitoring + status pages. Hono/TypeScript/Postgres backend, React frontend, Docker single-compose deploy. Native MCP server for AI assistant queries. Pre-rendered status pages survive origin downtime.

**Simple** (Product Hunt tagline yedekleri, tweet hook, cold email subject):
> Know when your site goes down. Show your users a status page. Pay less than BetterStack.

**Unique angle** (MCP-odaklı kanallar: Cursor Discord, Anthropic forum, AI-native dev communities):
> The only uptime monitor with a built-in MCP server — query your infrastructure from Claude or Cursor without leaving your editor.

---

## 2. Show HN Taslağı

### Title (80 char limit — exact)

```
Show HN: UptimeCrow – open-source uptime monitor with MCP server (MIT)
```

*(71 karakter. Alternatif: "Show HN: Open-source uptime monitor with native MCP server and pre-rendered status pages" — 86 char, biraz uzun ama HN başlık sınırı genellikle toleranslıdır.)*

### Opening Comment (markdown — ~400 kelime)

---

Hi HN,

I've been running side projects for years and bounced between UptimeRobot (5-minute checks on free), Better Stack ($34/mo per responder since their 2026 price increase), and Uptime Kuma (great, but SQLite and no REST API when you need multi-user).

So I built UptimeCrow — MIT-licensed, self-hostable with one command, and the first uptime tool I know of with a native MCP server.

**What it does:**

- HTTP, TCP, and keyword checks every 60 seconds (30s on Pro). Checks come from multiple regions; you don't go DOWN until 2 consecutive checks fail. That last part matters — a single network blip at 3 AM doesn't page your team.
- When it detects a real outage: incident created, status page updated, subscribers notified. All before you wake up.
- Status pages are pre-rendered static HTML on every state change, not rendered on request. That means when your origin is down, the status page still loads. Simple idea; most tools don't do this.
- Heartbeat monitoring for cron jobs: your job curls a unique URL, silence = alert.
- An MCP server at `/api/mcp`. POST JSON-RPC to it with an API key and Claude/Cursor/Windsurf can answer "is my API up?" or "what incidents are open?" without leaving the editor.

**How to try it:**

```bash
git clone https://github.com/ozers/uptimecrow
cd uptimecrow
cp .env.example .env
docker compose up
# Open http://localhost:5173
```

Postgres 16 + Redis 7 + API + web UI — all in one compose. Takes about 90 seconds on a cold pull.

The managed cloud version is at uptimecrow.com — free tier is 50 monitors, 1 status page, 1-minute checks, no credit card.

**Where it's not the right tool:**

If you need Playwright synthetic tests (that's Checkly), full log/trace aggregation (that's Better Stack or OneUptime), or a legacy-enterprise status page with Jira webhooks (that's Atlassian Statuspage) — those are better fits.

**Things I'd love feedback on:**

1. The MCP tool design (`apps/api/src/routes/mcp.ts`) — I have 5 tools right now (`get_status_summary`, `list_monitors`, `list_active_incidents`, `get_monitor_detail`, `list_heartbeats`). What would be genuinely useful to add?
2. The false-positive prevention state machine (`apps/api/src/utils/state-machine.ts`) — Redis-backed consecutive-failure counter. Is 2 consecutive fails the right default?
3. The pricing — Free at 50 monitors, Indie $12, Pro $29, Team $79. Too cheap to seem credible? Too expensive to compete with Kuma?

Stack: Hono + TypeScript + Drizzle ORM + BullMQ + Postgres 16 + Redis 7 + React 18 + Vite + Tailwind. No AI calls, no third-party monitoring services — just BullMQ repeatable jobs that call your endpoint and write results to Postgres.

Source: https://github.com/ozers/uptimecrow

---

*(Yayın zamanı: Pazar gecesi 23:00 PST / Pazartesi sabahı 09:00 Istanbul. HN'de Pazartesi sabahı ABD saatiyle 07:00-10:00 arası en iyi engagement penceresi.)*

---

## 3. Product Hunt Metinleri

### Tagline (60 char limit)

**Alternatif A** (47 char — önerilen):
```
Open-source uptime monitor with a built-in MCP server
```

**Alternatif B** (58 char — fiyat odaklı):
```
BetterStack at 1/3 the price, MIT licensed, AI-ready
```

### Description (260 char limit)

**Alternatif A** (258 char — özellik odaklı):
```
Monitor your APIs, websites, and cron jobs. Auto incidents, pre-rendered status pages that survive outages, and a native MCP server so Claude/Cursor can query your infrastructure. MIT-licensed. Self-hostable. Free for 50 monitors.
```

**Alternatif B** (247 char — pain-first):
```
BetterStack hit $34/mo. Uptime Kuma still has no REST API. UptimeCrow is MIT, Docker-deployable in one command, and has a native MCP server. Free for 50 monitors, $12/mo for more. No credit card, no lock-in.
```

### Maker Comment (first comment — ~300 kelime)

---

Hey PH — Ozer here, founder of UptimeCrow.

I built this because the options in this space have annoying gaps:

- **UptimeRobot free:** 50 monitors, but 5-minute checks. You can be down for 4+ minutes before anyone knows.
- **Better Stack:** Genuinely good product, but $34/mo per responder in 2026, and that's before you go above 10 monitors.
- **Uptime Kuma:** 87k stars for a reason — it's excellent for self-hosting. But it's SQLite, single-user, and has no REST API, which makes it hard when you need multi-user or want to automate anything.

UptimeCrow is MIT and self-hostable (`docker compose up`, that's it), but also has a managed cloud at uptimecrow.com with a permanent free tier — 50 monitors, 1-minute checks, 1 status page.

The thing I'm most interested in your feedback on is the **MCP server**. It's a native Model Context Protocol endpoint — Claude Code, Cursor, and Windsurf can connect to it and query your monitor status without leaving the editor. I'm not aware of another uptime tool that has this yet. Five tools exposed today: `get_status_summary`, `list_monitors`, `list_active_incidents`, `get_monitor_detail`, `list_heartbeats`. What else would you actually reach for?

**To try it:**
1. Cloud: uptimecrow.com → sign up free (no card)
2. Self-host: `git clone https://github.com/ozers/uptimecrow && docker compose up`

**What I'm looking for from early users:**
- Is the onboarding clear? Where do you get confused?
- Is there a notification channel you expected and didn't find? (We have Slack, Discord, PagerDuty, Teams, Telegram, email, custom webhooks.)
- Is the pricing matrix legible? I've tried to keep it simple — no per-monitor surcharges within a tier.

Early adopter note: first 100 signups this week get a founding-member badge and direct access to the roadmap voting board. No discount strings attached.

Thanks for building in public with us.

---

## 4. Reddit r/selfhosted Gönderisi

### Title

```
I built an open-source uptime monitor + status page after growing tired of Uptime Kuma's limitations (MIT, Docker Compose, REST API)
```

### Body (~300 kelime)

---

Long-time Kuma user, but hit three walls that kept coming back:

1. **No REST API.** Kuma is UI-only; if you want to create a monitor programmatically or query results from another tool, you can't.
2. **Single-user / SQLite.** Fine for one engineer. Annoying when two engineers need access or when you want Postgres backups.
3. **No multi-region.** One box, one network path. Regional blips trigger false alarms.

So I built UptimeCrow. Honest comparison up front:

**Where Kuma wins:**
- 87k GitHub stars vs our just-launched codebase. Community, docs, plugins are all more mature.
- 90+ notification integrations (we have 8: Slack, Discord, PagerDuty, Teams, Telegram, email, custom webhooks, and a native MCP server).
- SQLite means dead-simple backup. Our Postgres setup is more operationally involved.
- Free forever, unlimited monitors, no managed cloud pricing to worry about.

**Where UptimeCrow adds:**
- Full REST API with OpenAPI 3.1 spec — create monitors, query results, manage incidents programmatically.
- PostgreSQL 16 (real relational DB, proper backups, connection pooling support).
- Multi-user org model — invite teammates, scoped roles.
- Pre-rendered status pages: static HTML on every state change, so they survive origin downtime.
- Native MCP server — Claude/Cursor can query your monitor status from the editor.
- Managed cloud option if you don't want to babysit a server, free tier 50 monitors.

**Self-hosting:**
```bash
git clone https://github.com/ozers/uptimecrow
cp .env.example .env
docker compose up
```

Postgres 16 + Redis 7 + API + UI. Takes ~90 seconds on first pull. `.env.example` has comments on every variable; SES and Polar are optional (email and billing respectively).

If you're happy with Kuma, stay there — it's excellent for its use case. This is for when you've outgrown it or need REST API access.

MIT license. GitHub: https://github.com/ozers/uptimecrow  
Cloud version (free tier): https://uptimecrow.com

Happy to answer questions about the tech stack or the migration path from Kuma.

---

## 5. Reddit r/devops Gönderisi

### Title

```
Show r/devops: UptimeCrow — open-source uptime monitoring with false positive prevention + MCP server for AI assistant queries
```

### Body (~200 kelime)

---

Built an uptime monitoring tool aimed at the DevOps use case — specifically the two failure modes I kept hitting:

**False positives:** Single check fails → incident fires → on-call wakes up → service was fine. UptimeCrow uses a Redis-backed consecutive-failure counter. Default is 2 consecutive failures before opening an incident. One success returns to UP. Configurable per monitor via `confirmationCount`.

**Alert routing:** PagerDuty Events API v2, Slack, Discord, Teams, Telegram, custom webhooks, email (Amazon SES). On-call schedules included — basic rotation without needing a separate PagerDuty account for simple cases.

**MCP server** — exposes monitor state to Claude Code, Cursor, Windsurf via JSON-RPC. Ask "what's down right now?" from inside the editor. Five tools: `get_status_summary`, `list_monitors`, `list_active_incidents`, `get_monitor_detail`, `list_heartbeats`. Not a gimmick — useful for LLM-assisted incident triage.

**Stack:** Hono + TypeScript + BullMQ + Postgres 16 + Redis 7. MIT-licensed. `docker compose up` to self-host.

Managed cloud: uptimecrow.com (free: 50 monitors, 30s checks on Pro).  
Source: https://github.com/ozers/uptimecrow  
OpenAPI spec: uptimecrow.com/api/openapi.json

---

## 6. Twitter/X Thread (10 Tweet)

*(Hesap tonuna göre informal/formal ayarla. Developer kitlesi.)*

---

**Tweet 1 — Hook:**
```
We launched UptimeCrow today.

Open-source uptime monitor + status pages.
MIT, Docker Compose, 50 monitors free.

The one weird thing: it has a built-in MCP server.

Thread:
```

**Tweet 2 — Problem:**
```
The uptime monitoring market has three buckets:

• Free tools: 5-minute checks, no API
• Paid tools: $34/mo before you even add monitors
• Self-hosted: great, but SQLite + no REST API

None of them felt right for a small team shipping fast.
```

**Tweet 3 — State machine / false positives:**
```
The most important part of an uptime tool isn't the check.

It's knowing when NOT to fire an alert.

UptimeCrow uses a Redis-backed consecutive-failure counter.
Default: 2 failures in a row before DOWN.
One success → back to UP.

No more 3 AM pages for a 400ms network blip.
```

**Tweet 4 — Pre-rendered status pages:**
```
Status pages have an obvious failure mode: your origin goes down, your status page goes with it.

UptimeCrow pre-renders status pages as static HTML on every incident update.

When your API is down, your status page still loads.
Simple idea. Most tools don't do it.
```

**Tweet 5 — MCP server:**
```
Here's the part I'm most excited about:

UptimeCrow has a native MCP server.

Claude Code, Cursor, Windsurf → connects → asks "is my API up?" → gets a real answer.

No browser tab. No context switch.

/api/mcp — JSON-RPC, authenticated with your API key.
```

**Tweet 6 — Tech stack:**
```
Stack, since people ask:

• Backend: Hono + TypeScript + Drizzle ORM
• Queue: BullMQ (one repeatable job per monitor)
• DB: Postgres 16 + Redis 7
• Frontend: React 18 + Vite + Tailwind + shadcn/ui
• Email: Amazon SES
• Auth: JWT (HS256, 7-day cookie) + Google OAuth

No magic. Boring tech.
```

**Tweet 7 — Self-host quickstart:**
```
Self-host in 3 commands:

git clone https://github.com/ozers/uptimecrow
cp .env.example .env
docker compose up

Postgres + Redis + API + web UI.
~90 seconds on first pull.

MIT license. No beacon calls home.
```

**Tweet 8 — Pricing vs BetterStack:**
```
Pricing context:

Better Stack: $34/mo per responder (2026 price)
60 monitors = $34 + $25 = $59/mo

UptimeCrow Pro: $29/mo flat for 50 monitors.
Team: $79/mo for 200 monitors.

Or: stay on Free. 50 monitors, 1-minute checks, 1 status page. $0. Forever.
```

**Tweet 9 — vs Uptime Kuma (honest):**
```
Honest Kuma comparison:

Kuma: 87k stars, 90+ integrations, SQLite, UI-only, single-user
UptimeCrow: new, 8 integrations, Postgres, REST API, multi-user

If Kuma works for you → stay.
If you need REST API access, multi-user, or managed hosting → UptimeCrow.
```

**Tweet 10 — CTA:**
```
UptimeCrow is live.

→ uptimecrow.com (free, no card)
→ github.com/ozers/uptimecrow (MIT, star if useful)

Would love:
• MCP feedback — what tools should I add?
• Honest comparison if you've tried it
• Bugs — open an issue

Building in public. All feedback welcome.
```

---

## 7. awesome-selfhosted PR Taslağı

### PR Title
```
Add UptimeCrow — open-source uptime monitoring + status pages (MIT, TypeScript)
```

### PR Body
```markdown
## Entry

Adding UptimeCrow to the **Monitoring** section.

### Entry text

- [UptimeCrow](https://uptimecrow.com) - Uptime monitoring and status pages for developers. Monitor HTTP/TCP/keyword endpoints; get alerted via email, Slack, Discord, PagerDuty, Teams, or Telegram; serve pre-rendered static status pages that stay online when your origin goes down. Features heartbeat (cron) monitoring, an MCP server for AI assistant queries, consecutive-failure false-positive prevention, multi-user organizations, and a full REST API with OpenAPI 3.1 spec. `MIT` `Nodejs`

### Checklist

- [ ] Added entry in alphabetical order within the section
- [ ] Demo/live instance: https://uptimecrow.com
- [ ] Source code: https://github.com/ozers/uptimecrow
- [ ] License: MIT (verified in repo root LICENSE file)
- [ ] Language tag: `Nodejs` (TypeScript/Node.js backend)
- [ ] The project is actively maintained and has a working Docker Compose quickstart
- [ ] Non-commercial / no SaaS-only restriction: full source is MIT; managed cloud is optional
```

### awesome-selfhosted formatına uyan exact markdown satırı

*(awesome-selfhosted güncel formatını README'den kontrol et; Mayıs 2026 itibarıyla format şu şekilde:)*

```
- [UptimeCrow](https://uptimecrow.com) - Uptime monitoring and status pages for developers. Monitor HTTP/TCP/keyword endpoints; get alerted via email, Slack, Discord, PagerDuty, Teams, or Telegram; serve pre-rendered static status pages that stay online when your origin goes down. Features heartbeat (cron) monitoring, an MCP server for AI assistant queries, consecutive-failure false-positive prevention, multi-user organizations, and a full REST API with OpenAPI 3.1 spec. ([Source Code](https://github.com/ozers/uptimecrow)) `MIT` `Nodejs`
```

*(Yerleşim: "Monitoring" bölümü altında, alfabetik sıraya göre "Uu" altında "UptimeCrow" — "UptimeKuma"dan sonra, "Uptime" sıralamasına dikkat.)*

---

## 8. OpenAlternative.co Submission Draft

OpenAlternative.co submission formu için hazır içerik:

| Alan | Değer |
|---|---|
| **Name** | UptimeCrow |
| **Website** | https://uptimecrow.com |
| **GitHub URL** | https://github.com/ozers/uptimecrow |
| **Short description (150 char)** | Open-source uptime monitoring + status pages. MIT, Docker Compose, MCP server, 50 monitors free. |
| **Alternative to** | Better Stack, UptimeRobot, Pingdom, Freshping, Instatus |
| **Category** | Monitoring / Uptime Monitoring / Status Pages |
| **Tags** | uptime-monitoring, status-page, open-source, self-hosted, mcp, docker, typescript, heartbeat-monitoring |
| **License** | MIT |
| **Pricing model** | Freemium (50 monitors free forever; paid plans from $12/mo) |

**Longer description (for the "About" field, ~300 char):**
```
UptimeCrow watches your HTTP/TCP endpoints and cron jobs, opens incidents automatically when something breaks, and updates a pre-rendered static status page — one that stays online even when your origin is down. MIT-licensed. Self-hostable. Has a native MCP server for AI assistant queries.
```

*(OpenAlternative submissions are reviewed manually. Submit the same week as Show HN + PH for cross-referral traffic.)*

---

## 9. Launch Week Timeline (7 Gün)

**Day 1 (Pazartesi) — Directory Submissions**

- [ ] awesome-selfhosted PR aç (approval 7-14 gün alır, erken aç)
- [ ] OpenAlternative.co submit (Section 8'deki içerikle)
- [ ] alternativeto.net'e UptimeCrow sayfası aç ve "alternative to" ilişkilerini ekle
- [ ] GitHub repo'yu public et, README'de comparison table var mı kontrol et

**Day 2 (Salı) — Soft launch & internal prep**

- [ ] `docker compose up` test: fresh machine'de sıfırdan çalışıyor mu?
- [ ] Demo Loom videosu: monitor oluştur → downtime induce et → email gelişini göster → MCP query in Cursor → resolved. Maks 90 saniye.
- [ ] 5 screenshot hazırla: dashboard, monitor detail, status page (public), MCP response, pricing page
- [ ] PH hunter outreach: 3-5 PH hunter'a "launching Wednesday" DM at

**Day 3 (Çarşamba) — Main launch day: HN + PH aynı gün**

- [ ] Show HN: Pazar akşamı 23:00 PST (Salı gecesi Istanbul 09:00). Ya da Çarşamba 07:00 PST.
  - Section 2'deki title ve opening comment kullan
  - İlk yorumlara aktif dön — HN engagement kritik
- [ ] Product Hunt: Çarşamba 06:01 PST (Amerika uyandığında front page'de olsun)
  - Section 3'teki tagline + description + maker comment kullan
  - Kendi upvote'unu koy, hunter outreach listeni aktive et
- [ ] Twitter/X thread yayınla (Section 6 — tüm 10 tweet bir thread olarak)

**Day 4 (Perşembe) — Reddit: r/selfhosted**

- [ ] r/selfhosted gönderisi (Section 4'teki title + body)
- [ ] Yorum sorularına dön, aktif kal
- [ ] HN ve PH comments'i monitor et, dön

**Day 5 (Cuma) — Reddit: r/devops + diğerleri**

- [ ] r/devops gönderisi (Section 5'teki title + body)
- [ ] r/sysadmin: aynı devops post'unu hafifçe adapt et
- [ ] r/opensource: "I built an MIT uptime monitor" — kısa versiyon

**Day 6 (Cumartesi) — Developer communities**

- [ ] Dev.to post: HN opening comment'ini blog formatına çevir, canonical uptimecrow.com/blog URL'ine işaret etsin
- [ ] Hashnode crosspost
- [ ] Cursor Discord / Windsurf Discord: MCP server açısını anlat — "you can query your uptime from the editor"
- [ ] Lobste.rs submit (HN post linki paylaş ya da ayrı post)

**Day 7 (Pazar) — Review & iteration**

- [ ] Launch haftası analytics: signups, GitHub stars, traffic sources
- [ ] En çok gelen soruları topla → FAQ'e ekle
- [ ] En çok "ne zaman X gelecek?" sorusunu topla → roadmap sıralamasını güncelle
- [ ] awesome-selfhosted PR durumunu kontrol et, maintainer'dan feedback geldiyse dön

---

## 10. Early Adopter Messaging — "Founding Member" Email Draft

*(Mailing list / bekleyen kullanıcılara / beta kayıtlarına gönder. 60-80 kelime arası, minimal, dürüst.)*

---

**Subject:** UptimeCrow is live — founding member spot

We launched today.

50 monitors free, MIT licensed, Docker Compose in one command. There's also a native MCP server if you use Claude or Cursor.

We're honest about what it can't do yet: no Playwright synthetic tests, no log aggregation, Kuma has 20x more notification channels.

If that tradeoff fits your use case, sign up at uptimecrow.com — no credit card.

— Ozer, UptimeCrow

---

*(Alternatif konu satırları: "UptimeCrow: 50 monitors, MIT, live today" / "Open-source uptime monitor — we're live")*

*(Gönderim zamanı: Show HN'le aynı saat. Email → HN → PH zinciri aynı gün yoğunlaşsın.)*

---

## Appendix: Mesaj Tutarlılığı Referansı

Tüm kanallarda sabit tutulacak rakamlar ve iddialar:

| İddia | Doğru değer | Kaynak |
|---|---|---|
| Free monitör sayısı | 50 | `packages/shared/src/constants.ts` → Landing.tsx |
| Free check interval | 60 saniye (1 dakika) | README, llms-full.txt |
| Pro plan fiyatı | $29/ay | Pricing.tsx |
| Pro monitör sayısı | 50 | Pricing.tsx |
| BS 2026 fiyatı | $34/ay responder | ASSESSMENT_2026Q2_MARKET.md §2 |
| Kuma GitHub stars | ~87k | ASSESSMENT_2026Q2_MARKET.md §2.1 |
| False positive algılaması | 2 ardışık başarısızlık | README, llms-full.txt, state-machine.ts |
| MCP araç sayısı | 5 | apps/api/src/routes/mcp.ts |
| Notification kanalları | 8 (email, Slack, Discord, PagerDuty, Teams, Telegram, custom webhook, MCP) | notification.service.ts |
| Docker compose quickstart | `docker compose up` | README |
| License | MIT | repo root |

**Tutarsızlık riski:** Landing.tsx FAQ bölümünde "50 monitors free" yazıyor ama llms-full.txt §Pricing "25 monitors" diyor (eski değer). Launch öncesi llms-full.txt'i 50'ye güncelle.
