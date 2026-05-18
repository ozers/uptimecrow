# UptimeCrow — Teknik Sağlık Değerlendirmesi 2026 Q2

**Tarih:** 2026-05-19
**Önceki rapor:** `docs/PROJECT_ANALYSIS.md` (2026-04-13)
**Versiyon:** 2.0 (post P0-cleanup, post yeni özellik dalgası)

> Bu rapor sadece teknik (kod / mimari / operasyon) eksenleri kapsar. Pazarlama, hukuk, fiyatlandırma `PROJECT_ANALYSIS.md`'deki değerlendirmeden çıkarılmıştır — onlar paralel iş kalemleri.

---

## 1. Yönetici Özeti — Teknik Sağlık

UptimeCrow son altı haftada ciddi mesafe aldı. Nisan raporundaki P0 maddelerinin neredeyse tamamı çözüldü: `JWT_SECRET` startup validation (`apps/api/src/index.ts:7-21`), SSRF guard (`apps/api/src/utils/ssrf.ts`), CORS hardening (`apps/api/src/server.ts:37-46`), login enumeration düzeltmesi (`apps/api/src/routes/auth.ts:133-138`), structured logging (pino + `apps/api/src/utils/logger.ts`, console kullanımı **0**), retention job, API key management, MCP server, multi-region, Polar webhook HMAC + replay protection. "0 test" iddiası da artık geçerli değil — 10 test dosyası, 864 satır toplam test kodu var. Kod kalitesi ve mühendislik disiplini gözle görülür şekilde arttı.

Hala yumuşak karın bölgeleri var. **Notification HTML email template'leri kullanıcı kontrolündeki `incidentTitle` ve `updateBody` alanlarını escape etmeden interpolate ediyor** (`apps/api/src/services/notification.service.ts:80-86, 110-116`); status page'lerinde escape var ama email kanalında yok. Markdown rendering email'lere uygulanmıyor; status page için var ama subscriber gönderiminde sadece tek satır body geçiyor. Worker'da **graceful shutdown handler yok** — Railway/k8s SIGTERM gönderdiğinde aktif check işleri kesilir, dead-letter'a yazılır. `db/migrate.ts` repair listesi `slow_response_threshold_ms`'i içermiyor (yeni migration var ama WAL kaybı durumunda yedek değil). Functional E2E test yok (multi-tenancy isolation, billing webhook, check→incident path testsiz). DB connection pool ayarlanmamış (postgres-js varsayılan max=10). Sentry/APM entegrasyonu yok. `apps/api/src/services/static-gen.service.ts` ve `notification.service.ts` 700-880 satıra ulaşmış, bölünmeye aday.

**Olgunluk Skoru (1-10):**

| Boyut | Skor | Not |
|---|---|---|
| Architecture | 8 | MODE=api\|worker\|all clean, BullMQ disiplinli, services/jobs/utils sınırları net |
| Security | 7 | SSRF + JWT + bcrypt + webhook HMAC sağlam; email XSS + CSRF + dependency audit boşlukları var |
| Observability | 5 | pino var, error tracking + metrics + DB health check + dashboard yok |
| Testing | 5 | Unit testler iyi başlangıç; E2E ve isolation testleri yok |
| Performance | 7 | Indeksler doğru, N+1 sınırlı; ama static-gen in-memory, multi-region için per-region paralel fetch optimize edilebilir |
| DX | 8 | pnpm workspaces, tsx watch, Docker compose, vitest, OpenAPI — solid; ESLint kasıtlı yok |

**Top 3 Teknik Borç:**
1. Email/webhook payload escaping eksikliği (notification XSS yüzeyi)
2. Graceful shutdown + queue dashboard + Sentry yokluğu (ops görünürlüğü)
3. E2E ve multi-tenancy isolation testlerinin olmaması (regression riski)

**Top 3 Güçlü Yan:**
1. Disiplinli güvenlik dalgası — SSRF, CORS, JWT validation, API-key hash, custom-domain Host validation hep yerinde
2. State machine + transition logic — Redis-tabanlı confirmation count + maintenance suppression iyi tasarlanmış
3. Kod tutarlılığı — `console.*` sıfır, `any` sayısı tek hane, pino logger her yerde, route'lar pattern olarak benzer

---

## 2. Mimari Değerlendirme

### 2.1 Modülerleştirme

`apps/api/src/` katmanlanması net:
- `routes/` HTTP handler (17 dosya)
- `services/` business logic — monitor, notification, static-gen
- `jobs/` BullMQ handler — check, notify, generate, retention, heartbeat-check
- `middleware/` auth, rate-limit, security, custom-domain
- `utils/` puro yardımcılar — ssrf, escape, markdown, auth, api-key, state-machine, queues, logger

İhlaller minimal. **Bir yer pürüzlü:** `apps/api/src/jobs/notify.job.ts:285-290`'da içeride dynamic `import()` var (`await import("../services/notification.service.js")`) — bu zaten en üstte import edilmiş. Dead import, sil.

`apps/api/src/routes/oncall.ts`'in içinden `getCurrentOnCall` `jobs/notify.job.ts:17`'den import ediliyor. Routes'un job'a iş mantığı sızdırması olmamalı — `getCurrentOnCall` `services/oncall.service.ts`'e taşınmalı.

### 2.2 MODE=api|worker|all Pattern

`apps/api/src/index.ts:5,27-33` — temiz. Tek süreçte hem API hem worker çalıştırma seçeneği indie/dev için pratik; production'da iki ayrı deploy. `railway.toml` her ikisini de destekliyor. Bir gözlem: prod'da `MODE` env var'ı set edilmemişse default `"all"` — yanlışlıkla iki replica başlatılırsa worker iki kere repeatable job ekler. Worker startup'ı `cleanOrphanedRepeatableJobs` (`worker.ts:29-70`) ile dedupe ediyor, OK.

### 2.3 BullMQ — Repeatable, Retry, Dead-Letter

`apps/api/src/utils/queues.ts:6-13` — retry policy merkezi: 3 attempt, exponential backoff (5s), removeOnComplete=0, removeOnFail=100. İyi.

Dead-letter "logging only" şeklinde (`apps/api/src/worker.ts:12-27`). `isTerminalFailure` ile final attempt'i ayırt ediyor ama **alarm yok** — pino log'u bir yere düşmüyor. Sentry yok, alert kanalı yok. Bir job dead'e düşerse kimse bilmiyor.

Repeatable job life-cycle: monitor create'te add (`routes/monitors.ts:97-105`), interval değişimde remove+add (`routes/monitors.ts:158-173`), delete'te remove (`routes/monitors.ts:192-198`). Worker startup'ında orphan cleanup. **Race condition:** `add` çağrıları transactional değil — interval update'te eski job remove edildikten sonra yeni job eklenmeden önce process crash olursa monitor "no schedule" durumda kalır. Pratikte bir sonraki worker startup orphan cleanup ile farketmez, ama bu monitor'un check'i `cleanOrphanedRepeatableJobs` yeniden eklemiyor. Düşük frekanslı bir risk; ama bir reconciler job (her saat: schema → repeatable diff → ekle) eklenmeli.

### 2.4 Multi-tenancy

Tüm `routes/` dosyalarında `orgId = c.get("user").orgId` alınıp her `select`/`update`/`delete`'te `eq(table.orgId, orgId)` ile koşul kurulmuş. Spot kontrol: monitors, incidents, status-pages, heartbeats, api-keys, maintenance, team — hepsi geçti. Tek istisna: `routes/incidents.ts:114-153`'te `incident_updates`'a yazma yapılırken parent incident'in org doğrulaması var (`incidents.ts:125-133`) — doğru pattern.

**Potansiyel leak:** `routes/public.ts` (601 satır) status page slug üzerinden çalışıyor; slug global unique olduğu için org leak'i yok. Erişim kontrolü "isPublic=true VEYA accessToken eşleşiyor" mantığında — kontrol edilmesi gerek. Yine spot bakıldığında doğru görünüyor ama burası özellikle test gerektiren bir bölge.

### 2.5 State Machine

`apps/api/src/utils/state-machine.ts` — Redis INCR ile failure sayacı. `apps/api/src/utils/state-transition.ts` puro: `(currentStatus, checkPassed, failures, threshold) → 'up_to_down' | 'down_to_up' | null`. Test edilmiş (`state-machine.test.ts` 66 satır).

**Race condition riski:** İki worker aynı monitor için aynı anda check çalıştırırsa (concurrency=10 ve repeatable job'un her tick'inde yeni run), iki INCR + iki transition check sıralı değil; ama BullMQ aynı job'u iki worker'a vermez (Redis lock), repeatable job da `jobId: repeat-<id>` ile teklenmiş. Pratik risk düşük.

**Durumun durability'si:** Redis FLUSHALL veya restart'ta failure sayacı sıfırlanır — anlık inconsistency olabilir ama state-machine bir sonraki başarılı check'te zaten reset; kötü senaryoda 1-2 ekstra check'lik geciktirme. Kabul edilebilir.

### 2.6 Static Page Generation

`apps/api/src/services/static-gen.service.ts:76` — `pageStore = new Map<string, ...>` — **in-process memory**. Single API instance'da OK, multi-replica'da slug → instance affinity sorunu yaratır (replica A bir slug'ı generate eder, replica B `getRenderedPage` `null` döner).

Yorum: "Can be swapped to Cloudflare R2 / S3 in production." (`static-gen.service.ts:3`) — TODO. Şu an için "1 API replica + N worker" topolojisinde kullanılabilir. Worker bir status page regen ettiğinde **sadece worker'ın belleğinde tutuluyor** — API'ye fetch için path yok. Bu kritik bir gap: production'da worker ayrı süreçte çalışıyorsa API hiçbir zaman güncel HTML'i görmez.

`worker.ts` ve `server.ts` her ikisi de `regenerateStatusPage`'i import etse de bellek paylaşmaz (process boundary). **`MODE=all` çalıştırılırsa OK, ama MODE=worker + MODE=api split deployment yapılıyorsa rendering ulaşılamaz.** P0 düzeyinde mimari konu.

---

## 3. Kod Kalitesi

### 3.1 Console Kullanımı
- `apps/api/src/` içinde `console.*`: **0** (`grep -rn "console\." apps/api/src --include="*.ts" | wc -l`).
- Tüm log'lar `pino` üzerinden. Test ortamında `level=silent`.

### 3.2 TypeScript `any`/`as`/`@ts-ignore`
- API tarafı:
  - `apps/api/src/routes/public.ts:588` — `function svgBadge(c: any, ...)` — Hono context tipini almak için, kolay düzeltme: `c: Context`
  - `apps/api/src/services/monitor.service.ts:86` ve `:201` — `catch (err: any)` — `unknown` ile değiştir, type guard ekle
- Web tarafı:
  - `MonitorForm.tsx:10`, `StatusPageForm.tsx:6`, `IncidentCreate.tsx:7` — `zodResolver(...) as any` — react-hook-form + Zod transform'lar nedeniyle yaygın bir geçici çözüm; ya `@hookform/resolvers` üst sürümü ya da resolver tipini genişletmek gerek
  - `MonitorEdit.tsx:30` — `(monitor as any).keyword` — Monitor tipinde keyword tanımlı olmalı; tip dosyasına ekle

Toplam **7** geri kalan any/as-any noktası. Önemsiz.

### 3.3 Uzun Dosyalar (>500 satır)
| Dosya | Satır | Önerilen aksiyon |
|---|---|---|
| `apps/api/src/services/static-gen.service.ts` | 884 | HTML template oluşturma (`generateHTML`) ayrı dosyaya — `static-gen.html.ts` |
| `apps/api/src/services/notification.service.ts` | 759 | Kanal başına dosya: `notifications/email.ts`, `notifications/slack.ts`, `notifications/discord.ts`, ... |
| `apps/web/src/pages/dashboard/Overview.tsx` | 758 | Skeleton + KPI cards + recent activity ayrı componentlere |
| `apps/web/src/pages/Landing.tsx` | 742 | Hero / features / pricing / FAQ ayrı componentlere |
| `apps/api/src/docs/openapi.ts` | 740 | Path'leri modüllere ayır — `openapi/monitors.ts`, `openapi/incidents.ts` |
| `apps/web/src/pages/dashboard/Settings.tsx` | 673 | Tab'lar zaten var; her tab kendi component'i olsun |
| `apps/api/src/routes/public.ts` | 601 | RSS feed, badge SVG, subscribe handler ayrı dosyalara |

### 3.4 Naming
- TS değişken: camelCase (uyumlu)
- Dosya: kebab-case (uyumlu, ör. `check.job.ts`, `notification.service.ts`)
- Components: PascalCase (uyumlu)
- Dashboard sayfa dosyaları PascalCase (`MonitorsList.tsx`) — tutarlı

### 3.5 Dead Code / Eski Referanslar
- `apps/api/src/db/schema.ts:62` — `aiTokensUsed: integer("ai_tokens_used").notNull().default(0)` (AI kaldırıldı, kolon hâlâ var; her insert'te `default 0`)
- `schema.ts:172` ve `:192` — `isAiGenerated: boolean(...)` — incidents ve incident_updates tablolarında, her insert'te `false` ile dolduruluyor (`check.job.ts:301,310,368`)
- Bunlar zararsız ama görsel kirlilik; bir sonraki major schema bump'ta migration ile drop edilmeli

---

## 4. Security Posture

### 4.1 SSRF
**PASS** — `apps/api/src/utils/ssrf.ts:44-60` IPv4 blocked CIDR'lar (link-local 169.254.169.254 cloud metadata dahil), IPv6 unique-local/link-local/IPv4-mapped, `localhost`/`.local`/`.internal` hostname blokları. DNS rebinding-style multi-record attack'i için tüm A/AAAA kayıtlarını kontrol ediyor (`ssrf.ts:111-126`). `executeHttpCheck`, `executeTcpCheck`, `executeTestCheck`, webhook çağrıları (`notification.service.ts:11-14`), tools rotaları — hepsi `assertPublicUrl`/`assertPublicHost`'u çağırıyor.

### 4.2 CORS
**PASS** — `apps/api/src/server.ts:37-46` — production'da `APP_URL` env var zorunlu, default'a düşmüyor. Boş allowlist + credentials=true klasik tuzağı düşürülmüş.

### 4.3 JWT + Auth
**PASS / minor concerns:**
- `apps/api/src/index.ts:13-21` startup'ta `JWT_SECRET` 32 char + default değil kontrol — pass
- `apps/api/src/utils/auth.ts:1-27` HS256, 7-day expiry, jose. Token rotation/refresh yok ama 7 gün makul
- `apps/api/src/middleware/auth.ts:32-35` API key `lastUsedAt` fire-and-forget update — DB update başarısız olursa sessizce yutuyor (kabul edilebilir)

**CONCERN:** Şifre reset (`apps/api/src/routes/auth.ts:227-243`) sonrası **mevcut JWT'ler invalidate edilmiyor**. Token'lar 7 gün geçerli kalır. Çözüm: users tablosuna `passwordChangedAt` ekle, JWT verify'da claim'in iat'i bu tarihten önce ise reject et. Düşük-orta risk.

**CONCERN:** bcrypt cost = 12 (`routes/auth.ts:32, :238`) — production için makul. CPU pahalı; signup spike'larında throttle edilmesi gerekebilir ama mevcut rate limit halletmiş.

### 4.4 Webhook Signature (Polar)
**PASS** — `apps/api/src/routes/billing.ts:115-135` — Standard Webhooks formatı, timestamp ±300s replay protection, HMAC SHA256 (Base64). Multiple signature support (`split(" ").some(...)`).

### 4.5 Custom Domain Routing
**PASS** — `apps/api/src/middleware/custom-domain.ts` — strict hostname regex (label format), 253 char limit, PRIMARY_HOSTS deny-list (APP_URL + STATUS_PAGE_URL + localhost), TTL cache pozitif 5dk negatif 30s, `/api`, `/status`, `/health`, `/s/`, `/badge` path'leri bypass.

### 4.6 HTML / Markdown Sanitization
- **Status page rendering (PASS):** `apps/api/src/utils/escape.ts` — `escapeHtml`, `sanitizeUrl` (javascript:, data:svg blocked), `sanitizeColor` (hex + whitelist). `static-gen.service.ts` her interpolation'da uyguluyor. `markdown.ts` safe-by-construction renderer (test edilmiş, 73 satır test).
- **Email notification (FAIL):** `apps/api/src/services/notification.service.ts:80-86`, `:110-116`, `:139-148` (verification), `:172-185` (Slack) — `params.incidentTitle`, `params.updateBody`, `params.statusPageName` doğrudan HTML template'ine interpolate ediliyor. **XSS yüzeyi: operator status page adı veya incident title'ında `<img onerror=...>` koyabilir, subscriber'a giden HTML mail'de render edilir** (Gmail web mostly strips, ama Outlook Web/desktop, Apple Mail, native mobile mail'lerde davranış değişken).
  - **Fix:** `sendIncidentNotification` ve diğer email gönderici fonksiyonlar `escapeHtml`'i her field'a uygulamalı. Aynı escape util'i kullanılabilir.
- **Slack/Discord/Teams payload (CONCERN):** Slack messageformat zaten markdown-like ama `params.updateBody` JSON içine doğrudan giriyor. JSON.stringify zaten karakter escape ediyor, ama Slack `<...>` ve `_..._` parse eder — operator markdown bypass riski düşük. Discord da benzer. Düşük risk.

### 4.7 Rate Limiting
**PASS / minor concerns:** `apps/api/src/middleware/rate-limit.ts` — 4 tier (auth=10/15min prod, api=100/min, public=60/min, tools=10/min). IP `x-forwarded-for` ilk değerinden alınıyor — Railway/nginx arkasında doğru. **Spoof riski:** Eğer doğrudan client'ten gelirse (yanlış config), istemci kendi `X-Forwarded-For` set edebilir. Production deploy'da bunu blokladığından emin ol (Railway/nginx ön katmanı zaten override eder, ama belgeye yazılmalı).

### 4.8 CSP Headers
**PASS / weak:** `apps/api/src/middleware/security.ts:14-30` — present. Ama `script-src 'self' 'unsafe-inline'` ve `style-src 'self' 'unsafe-inline'` — inline boot script ve inline style için. Status page için kaçınılmaz; SPA dashboard için sıkıştırılabilir (`'strict-dynamic'` + nonce).

### 4.9 CSRF
**CONCERN:** Sadece `SameSite: lax` cookie ile koruma var. CSRF token middleware yok. POST endpoint'leri sadece JSON kabul ediyor + Authorization Bearer kabul ediliyor — `application/x-www-form-urlencoded` veya `multipart/form-data` ile basit cross-origin POST yapılabilir mi? Hono `c.req.json()` content-type kontrol etmiyor (varsayım gerek). En azından **Origin/Referer header validation** eklenmeli protected mutating route'larda.

### 4.10 Secret Handling
**PASS:** `JWT_SECRET` startup validation. AWS credentials ENV. Polar token ENV. Webhook secrets DB'de plaintext değil, ENV'de. **Telegram bot token, Twilio auth token DB'de plaintext** — org-level integration credential'ları (`schema.ts:68-73`). Bir DB dump'ı sızdığında alarm. Çözüm: at-rest encryption (KMS) veya hash + verify. Orta öncelik.

### 4.11 API Key Hashing
**PASS:** `apps/api/src/utils/api-key.ts` — SHA-256, plaintext sadece create response'unda, prefix display-only. `keyHash` UNIQUE indeksli (`schema.ts:210`).

---

## 5. Observability & Operations

### 5.1 Logging
- **pino** (`apps/api/src/utils/logger.ts`) — production'da JSON, dev'de pretty, test'te silent. `LOG_LEVEL` env var.
- **PII redaction yok.** Pino `redact` config eklenmeli — `email`, `password`, `passwordHash`, `token`, `apiKey`, `keyHash` field'ları redact edilmeli.
- Structured log'da `err`, `monitorId`, `orgId`, `userId` gibi context'ler her yerde yok — bazı yerlerde sadece string.

### 5.2 Error Tracking
**MISSING.** Sentry yok. `apps/api/src/server.ts`'de global error handler yok — Hono default 500 dönüyor. Job failure'lar log'lansa da bir yere alarm gitmiyor.

**Öneri Sentry setup:**
1. `pnpm --filter @uptimecrow/api add @sentry/node`
2. `apps/api/src/index.ts:1`'de `Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 })`
3. `server.ts`'de `app.onError((err, c) => { Sentry.captureException(err); ... })`
4. `worker.ts`'de `logJobFailure`'ın içine `Sentry.captureException(err, { tags: { queue: queueName, dead: terminal } })`
5. Frontend için `@sentry/react` + `apps/web/src/main.tsx`

### 5.3 Metrics
**MISSING.** `/metrics` endpoint yok, Prometheus scrape yok. BullMQ kuyruk derinliği, job duration, retry count görünmez. `bullmq-dashboard` veya `bull-board` eklenip `/admin/queues` altına monte edilmeli (auth korumalı).

### 5.4 Health Check
**WEAK:** `apps/api/src/server.ts:52-53` — `/health` ve `/api/health` sadece statik 200 + timestamp döner. **DB ve Redis pingi yok.** Container orchestrator gerçek bağlantı sağlığını görmüyor.

Önerilen düzeltme: `/health` 200, `/health/ready` deep check (db + redis SELECT 1 / PING).

### 5.5 Graceful Shutdown
**MISSING.** `index.ts`, `server.ts`, `worker.ts` — `process.on('SIGTERM', ...)` yok. Worker'ı SIGTERM ile durdurmak için BullMQ `worker.close()` çağrılmalı; aksi halde aktif check işleri kesilir → dead-letter. API tarafı `serve()` döndüğü server objesinde `close()` çağrılmalı, postgres `client.end()`, redis `quit()`.

### 5.6 DB Connection Pool
**WEAK:** `apps/api/src/db/index.ts:11` — `postgres(databaseUrl)` — varsayılan `max=10` connection. Worker + API + migrate aynı DATABASE_URL kullanıyor, paralel iş artarsa pool tükenir. Konfigüre et: `postgres(url, { max: Number(process.env.PG_POOL_MAX || 20) })`.

---

## 6. Test Coverage

### 6.1 Mevcut Test Haritası
```
apps/api/src/middleware/custom-domain.test.ts  (59)  — hostname validator, primary-host bypass, cache
apps/api/src/utils/queues.test.ts              (26)  — isTerminalFailure terminal/retry/undefined
apps/api/src/utils/api-key.test.ts             (50)  — generateApiKey/hashApiKey/looksLikeApiKey
apps/api/src/utils/ssrf.test.ts                (56)  — blocked CIDR, localhost, IP literal, ALLOW_PRIVATE
apps/api/src/utils/markdown.test.ts            (73)  — render, escape, link safety
apps/api/src/utils/state-machine.test.ts       (66)  — evaluateTransition tüm cases
apps/api/src/utils/escape.test.ts              (115) — html/attr/url/color
apps/api/src/jobs/retention.job.test.ts        (46)  — computeCutoffs deterministic
apps/api/src/services/static-gen.render.test.ts (137) — render output (HTML/JSON shape)
apps/api/src/services/monitor.service.test.ts  (236) — executeHttpCheck (loopback için ALLOW_PRIVATE)
```
Toplam: **864 satır, 10 dosya.** Pure utility'ler ve render output odaklı. Iyi başlangıç.

### 6.2 Test Edilmeyen Kritik Yollar
1. **Auth flow** — register → login → /me → password reset (full handshake)
2. **Multi-tenancy isolation** — orgA kullanıcısı orgB'nin monitor'ünü GET edebilir mi? (yapılmamalı)
3. **Monitor check → state transition → incident creation → notify enqueue** — end-to-end
4. **Plan limit enforcement** — free planda 4. monitor → 403; pro'da custom domain yetkili mi?
5. **Billing webhook** — Polar `subscription.created` event → DB plan değişimi
6. **Repeatable job life-cycle** — interval değişimi sonrası yeni job tick'i
7. **Custom domain routing** — Host header → status page lookup → rewrite
8. **Public route auth** — `accessToken` querystring olmadan `isPublic=false` 404

### 6.3 Önerilen Minimal E2E Smoke Suite
`apps/api/src/__tests__/smoke.e2e.test.ts` (yeni):
- Real Postgres (CI service container — zaten var), real Redis
- BullMQ worker'ı test içinde başlat, MSW veya local nock ile dış fetch mockla
- Senaryo:
  1. `POST /api/auth/register` → 201, token alınır
  2. `POST /api/monitors` (failed-URL = http://127.0.0.1:1 ALLOW_PRIVATE=1 ile veya local test server) → 201
  3. Check job manual `processCheckJob` → DOWN transition
  4. `incidents` tablosunda 1 satır olmalı
  5. `notifications` queue'da 1 job olmalı
  6. Multi-tenancy: ikinci user oluştur, orgA'nın monitor'üne GET → 404

`pnpm test` zaten CI'da çalışıyor (`ci.yml:61`) — bu suite buraya doğal düşer. Tahmini effort: 4-6 saat.

---

## 7. Performance & Scalability

### 7.1 DB Indexes
**PASS:** `schema.ts` — `check_results_monitor_checked_idx` (`monitorId`, `checkedAt`) — analytics ve retention için doğru. `monitors_org_id_idx`, `incidents_org_id_idx`, `incidents_status_page_id_idx`, `subscribers_email_page_idx`, `maintenance_windows_window_idx` — hepsi mevcut.

**CONCERN:** `checkedAt DESC` query'leri (`routes/monitors.ts:243`, `routes/public.ts`, `routes/analytics.ts`) — index ASC tanımlanmış. Postgres backward scan yapar — fine, ama büyük dataset'te explicit `(monitorId, checkedAt DESC)` daha hızlı. Düşük öncelik.

### 7.2 N+1 Riskleri
- **`apps/api/src/routes/mcp.ts:148-166`** — `handleListMonitors` her monitor için ayrı uptime stats query'si. 200 monitor varsa 200 query. Burada GROUP BY ile tek sorguya indirilebilir.
- **`apps/api/src/services/static-gen.service.ts`** — incelendi, ana sorguda monitör listesi join'le çekiliyor; per-monitor uptime için Promise.all olabilir (kontrol etmediğim ama 884 satır içinde yapılmış olabilir).
- **`apps/api/src/jobs/check.job.ts:271`** — `isMonitorUnderActiveMaintenance` her transition'da extra join — kabul edilebilir (transitionlar nadir).

### 7.3 BullMQ Throughput
- `checkWorker` concurrency=10 (`worker.ts:83`). 200 free + indie monitor varsayalım, her 60s'de check → 200/60 = 3.3 job/s. 10 concurrent worker yeterli ile yeterli ötesi.
- `notifyWorker` concurrency=5 — incident burst'lerinde 5 sub'a SES send paralel.
- **Rate limit yok BullMQ queue seviyesinde** — kötü deploy ya da büyük outage'da notify queue dolabilir. BullMQ `limiter: { max: 100, duration: 60000 }` eklenebilir.

### 7.4 Static Page Regen Storms
10k monitor'un hepsi aynı anda down olsa, her biri için `regenerate` job enqueue edilir. `generateWorker` concurrency=2, in-memory store. Bu boyut için bu sistem **uygun değil** — Cloudflare R2/S3 + CDN cache invalidation gerekir. Şu anki ölçek için sorun değil.

### 7.5 Frontend Bundle
- React 18, React Router 6, React Query 5, Radix UI, Recharts, react-hook-form, Zod, Sonner, Zustand.
- Recharts en ağır dep (~100KB gzip). MonitorDetail, Analytics sayfalarında lazy-load edilmeli.
- Landing/Pricing/Compare pages — sadece statik content, hiçbir Recharts vb. import etmiyor (kontrol edildi).
- Vite code-splitting otomatik route bazlı. Lazy route loading dashboard sayfalarında etkin değil — eklenirse ilk paint hızlanır.

---

## 8. Database & Migrations

### 8.1 Migration Sırası
21 migration (`0000_magical_excalibur` → `0021_slow_response_threshold`). İsimlendirme tutarsız: bazıları auto-generated drizzle isim (örn. `magical_excalibur`), bazıları manuel (`0010_ssl_monitoring`, `0021_slow_response_threshold`). Tercih: tümü `NNNN_short_description.sql` manuel format'ta. Düşük öncelik.

### 8.2 `0021_slow_response_threshold.sql` — Yeni
```sql
ALTER TABLE monitors
  ADD COLUMN IF NOT EXISTS slow_response_threshold_ms integer;
```
Temiz, idempotent. Schema'da nullable. **`db/migrate.ts` repair listesinde değil** — Railway WAL kaybı senaryosunda `__drizzle_migrations` tablosu sıfırlanırsa bu kolon zorunlu olarak repair listesinden gelsin. Ekle.

### 8.3 `db/migrate.ts` Fresh DB Çalışması
24 idempotent repair statement (`migrate.ts:50-210`). Drizzle migration sırasında 42701/42P07/42710/42P06 hata kodları tolere ediliyor. Fresh DB'de normal migration akışı çalışır, repair statement'ları no-op döner. Production'da hibrit migration history korur.

**CONCERN:** Repair listesi çok uzun (24 madde) — gelecek migration'lar otomatik olarak repair listesine eklenmiyor, manuel sync gerekiyor. Bu kalıcı bir cost olacak. Alternatif: Drizzle'ın `__drizzle_migrations` tablosunu backup'lamak veya `drizzle-kit push` modu kullanmak. Mimari karar.

### 8.4 Schema Normalizasyon
- `organizations` 14 nullable webhook/integration field tutuyor. Future: `org_integrations(orgId, type, config jsonb)` tablosuna normalize. Şu an OK.
- `users.stripeCustomerId` — Polar customer ID'sini tutuyor, isim yanlış. Rename gerek (`billingCustomerId`).
- `incidents.isAiGenerated` (`schema.ts:172`), `incident_updates.isAiGenerated` (`schema.ts:192`), `organizations.aiTokensUsed` — dead columns (AI kaldırıldı).
- `users.passwordHash` nullable (Google OAuth için), iyi. `passwordChangedAt` eklenmeli (bkz. 4.3).

### 8.5 Soft vs Hard Delete
Tüm tabloda hard delete + `onDelete: cascade`. Audit log yok. GDPR delete-account akışı için OK, ama "yanlışlıkla sildim" recovery yok. Üst öncelik değil.

---

## 9. Developer Experience

### 9.1 pnpm Workspaces
**PASS** — `pnpm-workspace.yaml`, `@uptimecrow/shared` workspace:* ile import. `pnpm -r build/test/typecheck` çalışıyor.

### 9.2 Shared Package Build
`packages/shared/package.json` görmedim ama `tsconfig.json` ve `src/index.ts` `42` token — minimal. Hem API hem web tarafı `@uptimecrow/shared`'i import ediyor. Vite Path resolution'a bakılmalı — eğer build edilmiş `dist/` istemiyorsa `tsconfig paths` yeterli. Bir doğrulama gerek; ama runtime hatası yok demek ki çalışıyor.

### 9.3 Hot Reload
- API: `tsx watch src/index.ts` (`apps/api/package.json:8`) — pass
- Web: Vite default — pass
- Docker compose target=development bind mount — pass

### 9.4 ESLint
Kasıtlı kaldırılmış (commit `3286921`, `95798e1` — "eslint never installed"). `pnpm typecheck` tek static check. Modern projede Biome veya minimal ESLint config tercih edilebilir; ama bu repo için kod kalitesi yeterli görünüyor (`any` sayısı tek hane, format tutarlı). **Öneri:** Biome ekle — tek bin, hızlı, format + lint tek araç. 10 dk effort.

### 9.5 Type-only / Barrel
- `packages/shared/src/index.ts` 27 tok — barrel pattern var.
- Type-only import kullanımı (`import type { Job } from "bullmq"`) tutarlı (`check.job.ts:3`, `notify.job.ts:3`).

---

## 10. API / Public Surface

### 10.1 OpenAPI Coverage
`apps/api/src/docs/openapi.ts` 740 satır. 19 path tanımlı:
- `/api/monitors`, `/api/monitors/{id}`, `/api/monitors/{id}/checks`
- `/api/heartbeats`, `/api/heartbeats/{id}`
- `/api/incidents`, `/api/incidents/{id}`, `/api/incidents/{id}/updates`
- `/api/status-pages`, `/api/status-pages/{id}`, `/api/status-pages/{id}/monitors`
- `/api/maintenance-windows`, `/api/maintenance-windows/{id}`
- `/api/api-keys`, `/api/api-keys/{id}`
- `/health`, `/status/{slug}`, `/badge/{slug}.svg`, `/heartbeat/{slug}`

**Eksik / undocumented:**
- `/api/auth/*` (register, login, logout, forgot/reset, google OAuth, accept-invite, me) — public sayılır, ama API consumer için login gerek
- `/api/subscribers/*`
- `/api/analytics/*`
- `/api/settings/*`
- `/api/billing/*`
- `/api/team/*`
- `/api/oncall/*`
- `/api/mcp/*`
- `/api/tools/*` (yeni — bkz. 10.3)

Status: Public API consumer'lar için yeterli. Internal/admin endpoint'leri OpenAPI'de olmasa da olur.

### 10.2 Public vs Authed Ayrımı
Net. `server.ts`'de `/status/*` public, `/api/tools/*` public (tools rate limit), `/api/*` authed (apiRateLimit + her route'un kendi `authMiddleware`). Bypass yok.

### 10.3 `routes/tools.ts` (Yeni)
- 3 endpoint: `POST /api/tools/ssl-check`, `POST /api/tools/dns-lookup`, `POST /api/tools/uptime-test`
- `toolsRateLimit` uygulanmış (`server.ts:100-101`) — 10/min/IP, sıkı
- SSRF guard her ikisinde de (`tools.ts:42, :155 (regex), :208 (assertPublicUrl içeride)`)
- `tools.ts:155` — DNS lookup için manuel regex `^[a-z0-9.-]+$` — `assertPublicHost` çağırmıyor ama public DNS query olduğu için OK
- **CONCERN:** `ssl-check` `rejectUnauthorized: false` (`tools.ts:62`) — self-signed cert'lere de bağlanır. Tool için OK ama cert validation reporting eklenmeli (chain valid mi?)
- OpenAPI'de yer almıyor; eklenmeli

### 10.4 MCP Route
- `apps/api/src/routes/mcp.ts` — JSON-RPC 2.0, 5 tool (`get_status_summary`, `list_monitors`, `list_active_incidents`, `get_monitor_detail`, `list_heartbeats`)
- API key auth (Authorization: Bearer)
- Hata yönetimi standart MCP error codes (-32001 unauthorized, -32700 parse, -32601 method, -32603 internal)
- `handleListMonitors` N+1 (bkz. 7.2) — fix gerekli
- Initialize protocolVersion `"2024-11-05"` — geçerli MCP version

---

## 11. Önceliklendirilmiş Refactor Listesi

### P0 (Bu sprint — risk/correctness)

1. **Email HTML escaping**
   - File: `apps/api/src/services/notification.service.ts:80-86, 110-116, 139-148`
   - Current: `${params.incidentTitle}` ham interpolation
   - Target: `${escapeHtml(params.incidentTitle)}` her field'a
   - Effort: 30 dk + escape.ts import

2. **Static page rendering multi-process gap**
   - File: `apps/api/src/services/static-gen.service.ts:76` — in-memory Map
   - Current: worker bellek + API bellek ayrı; split deploy'da API güncel HTML görmez
   - Target: Redis-backed store (key=`statuspage:slug`, value=`{json, html}`, TTL yok) veya filesystem volume veya S3
   - Effort: 2-4 saat

3. **Graceful shutdown**
   - Files: `apps/api/src/index.ts`, `apps/api/src/server.ts`, `apps/api/src/worker.ts`
   - Current: SIGTERM handler yok
   - Target: `process.on('SIGTERM', async () => { worker.close(); server.close(); await redis.quit(); await client.end(); })`
   - Effort: 1 saat

4. **`db/migrate.ts` repair'a `slow_response_threshold_ms` ekle**
   - File: `apps/api/src/db/migrate.ts:50-210`
   - Current: 24 repair, son migration `0021` kapsanmamış
   - Target: `ALTER TABLE monitors ADD COLUMN IF NOT EXISTS slow_response_threshold_ms integer` ekle
   - Effort: 5 dk

5. **Health check derinleştir**
   - File: `apps/api/src/server.ts:52-53`
   - Current: statik 200
   - Target: ayrı `/health/ready` endpoint, DB `SELECT 1` + Redis `PING` paralel
   - Effort: 30 dk

6. **Sentry entegrasyonu (API + web)**
   - Files: `apps/api/src/index.ts`, `apps/api/src/server.ts`, `apps/api/src/worker.ts`, `apps/web/src/main.tsx`
   - Current: yok
   - Target: `@sentry/node` + `@sentry/react`, DSN env var, app.onError + worker.failed → captureException
   - Effort: 2 saat

### P1 (Önümüzdeki sprint — kalite)

7. **E2E smoke test suite** — `apps/api/src/__tests__/smoke.e2e.test.ts` — bkz. 6.3. Effort: 4-6 saat.

8. **Multi-tenancy isolation test** — `apps/api/src/__tests__/isolation.test.ts` — orgA tokenı ile orgB resource'larına 404. Effort: 2 saat.

9. **PII redaction pino config** — `apps/api/src/utils/logger.ts`'e `redact: { paths: ['email', 'password', 'token', 'apiKey', '*.passwordHash'], censor: '[REDACTED]' }`. Effort: 15 dk.

10. **Password reset → JWT invalidation** — `users.passwordChangedAt` ekle, `verifyToken`'da `iat` kontrolü. Effort: 1 saat.

11. **`bull-board` admin dashboard** — `/admin/queues` (auth-protected). Effort: 1 saat.

12. **DB connection pool config** — `apps/api/src/db/index.ts:11` — `postgres(url, { max: ... })`. Effort: 5 dk.

13. **`oncall.ts` mantığını service'e taşı** — `services/oncall.service.ts` — `getCurrentOnCall` route file'dan çıkar. Effort: 30 dk.

14. **`fetch` content-type / origin validation** — CSRF için Origin/Referer header check. Effort: 1 saat.

15. **Telegram + Twilio token at-rest encryption** — KMS veya envelope. Effort: 4 saat.

16. **Notify queue rate limit** — BullMQ `limiter: { max, duration }`. Effort: 15 dk.

17. **Lazy-load Recharts** — `apps/web/src/pages/dashboard/MonitorDetail.tsx`, `Overview.tsx` — `React.lazy`. Effort: 30 dk.

### P2 (Q3+ — mimari)

18. **Worker → ayrı service (Docker Compose, Railway service)** — `MODE=worker` Production'da net ayrı container. Şu an `MODE=all` default'u prod yanlış kullanım riski. Effort: 1 gün.

19. **Static page → S3/R2** — `static-gen.service.ts` storage swap. CDN cache invalidation. Effort: 1 hafta.

20. **`org_integrations` normalizasyon** — webhook URL'leri ve token'ları tek tabloda. Migration + route refactor. Effort: 2-3 gün.

21. **Drop AI dead columns** — `is_ai_generated`, `ai_tokens_used`. Migration + schema temizliği. Effort: 30 dk migration, dikkatli deploy.

22. **OpenAPI auto-generate** — Hono Zod OpenAPI plugin'i ile route → spec sync. Manuel 740-satır dosyaya gerek kalmaz. Effort: 1 gün.

23. **Biome lint + format** — tek araç, hızlı. Effort: 30 dk config + cleanup.

24. **`bullmq-otel` veya Prometheus metrics** — kuyruk derinliği, job duration histograms. Effort: 4 saat.

---

## 12. Quick Wins (≤30 dk her biri — tech-exec agent için)

1. **`db/migrate.ts` repair'a 0021 ekle** — `apps/api/src/db/migrate.ts:210` öncesi satır ekle.

2. **`any` → `Context` (svgBadge)** — `apps/api/src/routes/public.ts:588` — `c: any` → `c: Context` (import: `import type { Context } from "hono"`).

3. **`any` → `unknown` + type guard (monitor.service.ts)** — `:86` ve `:201` — `catch (err: any)` → `catch (err: unknown)` + `err instanceof Error ? err.message : String(err)`.

4. **Dead dynamic import sil** — `apps/api/src/jobs/notify.job.ts:285` — top-level zaten import edilmiş.

5. **`Monitor` tipine `keyword` ekle** — `packages/shared/src/types.ts` — `MonitorEdit.tsx:30`'daki `as any`'yi kaldır.

6. **pino redact config** — `apps/api/src/utils/logger.ts` — bkz. P1 #9.

7. **DB pool max config** — `apps/api/src/db/index.ts:11` — `{ max: Number(process.env.PG_POOL_MAX || 20) }`.

8. **MCP `list_monitors` N+1 fix** — `apps/api/src/routes/mcp.ts:148-166` — tek `select` + `LEFT JOIN check_results` + `GROUP BY monitor.id`.

9. **`stripeCustomerId` → `billingCustomerId` rename plan** — schema migration draftla (gerçek migration P2).

10. **`Notify` rate limit** — `apps/api/src/worker.ts:86-90` — `new Worker("notifications", ..., { limiter: { max: 100, duration: 60_000 } })`.

11. **`access` log level for `/health`** — `honoLogger()` `/health` spam'ini engelle: `app.get("/health", ...)`ı `honoLogger()`'dan önce ya da skip pattern.

12. **OpenAPI: `tools` rotalarını ekle** — `apps/api/src/docs/openapi.ts`'e 3 yeni endpoint.

13. **Lazy import: `whoiser`** — şu an `monitor.service.ts:390` zaten dynamic import (OK), kontrol edildi — başka package için de aynı pattern: SES client lazy init zaten yapılmış.

14. **`Vary: Origin` header** — CORS arkasında cache poisoning'i önler. `server.ts`'de tek satır.

15. **`maxRetriesPerRequest: null` (Redis)** — zaten set (`db/index.ts:21`), no-op.

---

## Sonuç

UptimeCrow Q1 → Q2 arasında **launch-ready** seviyeye ulaştı. Önceki raporda kritik olan launch-gate maddelerinin neredeyse hepsi tikli. Geriye kalan teknik borç orta-vadeli kalite ve ölçeklenme borçları — release engelleyici değil ama ihmal edilmemeli.

Önümüzdeki sprint'te P0 listesi (1-6) bir geliştirici-haftası altında bitirilebilir. P1 (E2E test + observability + redaction) ikinci sprint için ideal. P2 madde 18 (worker process separation) deploy'a geçilmeden önce mutlaka çözülmeli — şu anki `MODE=all` default'u tek-replica varsayımı ile uyumlu, scale-out'ta tehlikeli.

**Bu raporu hazırlayan agent:** tech-audit
**Bir sonraki adım:** tech-exec agent P0 listesini sırasıyla ele alır; her madde için ayrı PR önerilir.
