# UptimeCrow — Kapsamlı Proje Analizi ve Launch Yol Haritası

**Tarih:** 2026-04-13
**Versiyon:** 1.0
**Durum:** Pre-launch (teknik olarak feature-complete, pazara hazırlık eksik)

---

## 1. Yönetici Özeti (Executive Summary)

UptimeCrow, SaaS modelinde çalışan bir **uptime monitoring + status page** platformudur. Teknik olarak feature-complete (monolitik Hono backend + Vite React SPA, PostgreSQL 16 + Redis 7, BullMQ job queue) ancak **pazara çıkış için kritik boşluklar** vardır:

- **Güçlü yanlar:** Multi-tenancy, plan enforcement, Redis state machine (false-alarm koruması), dual billing provider (LemonSqueezy + Polar), multi-region checks, pre-rendered static status pages, AWS SES email.
- **Zayıf yanlar:** 0 test dosyası, eski/çelişkili dokümantasyon (AI kaldırılmış ama README hâlâ öne çıkarıyor), Privacy/Terms yok, SEO boş, analytics/error tracking entegrasyonu yok, landing page mesajı belirsiz, competitive positioning tanımlı değil.
- **Launch'a tahmini süre:** Tek geliştirici için 2–3 hafta (doküman temizliği + legal + smoke test + operasyon + pazarlama copy).

**Konumlanma (öneri):** "Developer-first, open-source uptime monitoring with pre-rendered status pages that stay online when you don't." — BetterStack'ten daha ucuz, UptimeRobot'tan daha modern, Kuma'dan daha hosted.

---

## 2. Teknik İnceleme

### 2.1 Mimari
- **Monorepo:** `apps/api` (Hono + BullMQ), `apps/web` (Vite + React + Tailwind), `packages/shared` (Zod, plan limits, types).
- **MODE env var:** `api`, `worker`, `all` — API ve worker süreçleri bağımsız ölçeklenebilir.
- **Veritabanı:** 9 normalize tablo (users, organizations, monitors, check_results, status_pages, statusPageMonitors, incidents, incidentUpdates, subscribers), `org_id` üzerinde doğru index'leme.
- **State machine:** Redis tabanlı ardışık başarısızlık sayacı → `confirmationCount` (default 2) kadar başarısız → DOWN; 1 başarı → UP. Tek blip yanlış alarmı engeller.
- **Side effect dağıtımı:** Sadece UP↔DOWN geçişlerinde notify + status page regen job'ları tetiklenir. Rutin check sadece `check_results` satırı yazar.

### 2.2 Implemente Edilmiş Özellikler
| Modül | Durum | Not |
|---|---|---|
| HTTP monitoring | ✅ Complete | Interval, timeout, expected status, keyword |
| TCP monitoring | ⚠️ Schema var, execution yok | Enum tanımlı ama service'te handler yok |
| Keyword monitoring | ✅ Complete | Response body taraması |
| Multi-region | ✅ Complete | eu-west, us-east, ap-southeast (Team-only) |
| Incidents (manual) | ✅ Complete | Severity, status, timeline |
| AI incident reports | ❌ KALDIRILDI (commit `0dcdb2c`) | Schema flag'leri hâlâ var ama set edilmiyor |
| Status pages | ✅ Complete | Pre-rendered HTML, custom domain, branding |
| Subscribers | ✅ Complete | HTML confirmation pages (verify/unsubscribe) |
| Email (AWS SES) | ✅ Complete | `@aws-sdk/client-sesv2`; Resend/nodemailer geçişleri tamamlandı |
| Slack webhooks | ✅ Complete | |
| Discord webhooks | ✅ Complete | |
| SMS / PagerDuty / Opsgenie | ❌ Yok | |
| Analytics | ⚠️ Minimal | Uptime %, avg response ms; percentile/region breakdown yok |
| Billing (LemonSqueezy) | ✅ Complete | Checkout, portal, webhook HMAC |
| Billing (Polar) | ✅ Complete | Standard Webhooks, replay protection |
| Auth (JWT) | ✅ Complete | bcrypt + jose, 7-gün expiry, cookie + Bearer |
| 2FA | ❌ Yok | |
| Rate limiting | ✅ Complete | Redis sliding window (auth/API/public tier) |
| API key management | ❌ Yok | Team plan'da "API access" vaat ediliyor ama endpoint yok |
| Team/multi-seat | ❌ Yok | `teamSeats` limit tanımlı ama invite flow yok |
| Tests | ❌ 0 test dosyası | `pnpm test` boş suite geçiyor |

### 2.3 Plan Limit Matrisi (`packages/shared/src/constants.ts`)
| Özellik | Free | Pro | Team |
|---|---|---|---|
| Monitor | 3 | 20 | 50 |
| Status page | 1 | 3 | Sınırsız |
| Min interval | 5 dk | 30 sn | 30 sn |
| Data retention | 7 gün | 90 gün | 365 gün |
| Seat | 1 | 2 | 5 |
| Custom domain | ❌ | ✅ | ✅ |
| Slack/Discord | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Multi-region | ❌ | ❌ | ✅ |

### 2.4 Güvenlik Değerlendirmesi
- **Yeterli:** JWT httpOnly cookie (prod secure), bcrypt, rate limiting, webhook HMAC, Polar timestamp replay protection (±5 dk).
- **Eksik / Risk:**
  - `JWT_SECRET=change-me-in-production` default'u validation olmadan başlatılıyor → prod'da unutulursa token forge riski.
  - Custom domain routing `Host` header'ına doğrudan güveniyor → güvenilmeyen proxy arkasında spoof edilebilir.
  - HTML input sanitization yok (incident description, status page logo URL) → stored XSS riski status page'lerde.
  - Webhook URL'leri plaintext DB'de.
  - CSRF koruması yok (SameSite cookie dışında).
  - CSP header yok.

### 2.5 Observability ve Operasyon
- **Var:** `/health` endpoint, GitHub Actions CI (lint + typecheck + test + Docker build), GHCR push.
- **Yok:** Sentry, APM, structured logging (44 adet `console.log`), distributed tracing, audit log, dead-letter queue, backup runbook, k8s manifest, scaling guide.

---

## 3. Non-Technical / Ürün Açısından İnceleme

### 3.1 Landing Page
- **İyi:** Animated terminal demo, 3-tier pricing, hamburger nav, `prefers-reduced-motion` desteği.
- **Kötü:**
  - "AI-Native" mesajı **yanlış** — AI feature kaldırıldı. Yalan reklam.
  - Hedef kitle tanımsız (indie developer mı, SRE ekibi mi, startup CTO'su mu?).
  - Rakiplerle karşılaştırma sayfası yok.
  - Social proof yok (testimonial, logo, vaka çalışması).
  - OpenGraph, Twitter card, JSON-LD structured data yok.
  - Tek bir CTA ("Get Started") — demo, pricing detail, comparison gibi ikincil CTA yok.

### 3.2 Dashboard UX
- Monitor/Incident/Status page CRUD'u tamamen çalışır durumda.
- Onboarding carousel (skip sonrası tekrar gelmiyor).
- KPI kartları, skeleton loader, empty states var.
- **Eksik:** dark mode, keyboard shortcut (`?` help), bulk actions, export/import, advanced search, mobile app icon.

### 3.3 Hukuki / Uyum
- ❌ Privacy Policy sayfası yok
- ❌ Terms of Service sayfası yok
- ❌ GDPR DSR (Data Subject Rights: export/delete) endpoint yok
- ❌ Cookie consent banner yok
- ❌ DPA şablonu (EU müşteriler için) yok
- ⚠️ Subscriber unsubscribe var ama GDPR retention policy tanımsız

### 3.4 Dokümantasyon Durumu
- **README çelişkili:** AI ve Resend hâlâ öne çıkarılıyor; gerçek stack SES. Lead paragraph yalan söylüyor.
- **CLAUDE.md:** İç geliştirici için doğru ve güncel.
- **API docs (OpenAPI/Swagger):** yok.
- **Self-host guide:** yok.
- **Deployment runbook:** yok.

---

## 4. Monetization Analizi

### 4.1 Fiyat Stratejisi Kritiği
- 3 tier (Free/Pro/Team) makul, ama **fiyatlar henüz açıklanmamış** (Settings sayfasında sadece upgrade button'u var).
- **Öneri fiyatlandırma (rakip analizi temel alınarak):**
  - Free: $0 — 3 monitor, 5-min interval, 1 status page (acquisition)
  - Pro: **$12/ay** veya **$108/yıl** (25% indirim) — 20 monitor, 30-sn interval, 3 status page, custom domain (UptimeRobot Pro $7 vs BetterStack $25 arası pozisyon)
  - Team: **$49/ay** veya **$444/yıl** — 50 monitor, multi-region, API, 5 seat
  - Enterprise (gelecek): custom, SSO, SLA, dedicated support

### 4.2 Trial / Coupon / Kilit Noktalar
- ❌ Free trial yok (şu an "sign up → ömür boyu free" modeli).
- ❌ Coupon/discount kod desteği yok.
- ❌ Yıllık plan indirimi (LemonSqueezy variant ID olarak çözülebilir) implement edilmemiş.
- **Öneri:** Pro için 7-day trial ekle (credit card alma, downgrade-to-free otomatik).

### 4.3 Dual Billing Provider — Fazlalık mı Gerçek Değer mi?
- Hem LemonSqueezy hem Polar implement edilmiş. **Çoğu indie SaaS için fazlalık** (maintenance overhead).
- **Öneri:** Polar'ı tercih et (daha modern API, open source friendly, düşük fee), LemonSqueezy kodunu `legacy/` klasörüne taşı veya sil. Tek-provider stratejisi launch day karmaşasını azaltır. (bunu TODO olarak ekle, onay alındıktan sonra seçim yapılıp ilerlenecek)

### 4.4 Aktivasyon ve Retention Metrikleri (şu an ölçülmüyor)
- Signup → first monitor created conversion
- First monitor → first incident notified conversion (aha moment)
- Free → Pro conversion rate
- Monthly churn (Polar webhook'tan türetilebilir)
- **Öneri:** PostHog veya Plausible entegre et, funnel event'leri emit et.

---

## 5. Business / Pazar Analizi

### 5.1 TAM / SAM / SOM Tahmini
- **TAM (Uptime monitoring global):** ~$1.6B (2024, Grand View Research). 2030'a kadar %15 CAGR.
- **SAM (developer-first SaaS, SMB + indie + early-stage startup):** ~$300M — BetterStack, Checkly, Cronitor, Hyperping, Uptime Kuma Cloud gibi oyuncuların payı bu dilimde.
- **SOM (ilk 24 ay, realistik hedef):** $100K–$300K ARR (1000-3000 ödeyen kullanıcı, $10-$15 ortalama ARPU).

### 5.2 Hedef Müşteri Segmentleri
1. **Primary:** Indie hacker / solo developer (1-5 monitor, Pro tier, budget-conscious).
2. **Secondary:** Early-stage startup (5-20 monitor, Team tier, status page for customers).
3. **Tertiary:** Self-host meraklısı (kurumsal değil — MIT lisansı open source pull için).

### 5.3 Değer Önerisi (Value Proposition) — Taslak
> "Monitor your APIs, show a branded status page that stays online even when you're down, and pay a fair price. Open-source core, developer-first UX, no bullshit."

### 5.4 Go-To-Market Kanalları
- **Product Hunt launch** (hedef #1 daily, 500+ upvote)
- **HackerNews Show HN** (technical audience, open source angle)
- **Dev.to / Hashnode** long-form posts (tutorial: "How we built a status page that stays online when we're down")
- **Reddit:** r/selfhosted, r/webdev, r/devops
- **Twitter/X:** Indie hacker bubble (@levelsio, @bentossell follower havuzu)
- **SEO:** "uptime monitoring open source", "betterstack alternative", "status page self hosted"

---

## 6. Rakip Analizi (Competitor Analysis)

### 6.1 Rakip Matrisi
| Rakip | Fiyat | Güçlü Yan | Zayıf Yan |
|---|---|---|---|
| **BetterStack (Logtail)** | $25–$300/ay | Polish, integrations (Incident.io), log + uptime combo | Pahalı, complex onboarding, overkill indie için |
| **UptimeRobot** | $0–$15/ay | Ucuz, basit, bilindik brand | UX eski, API sınırlı, status page bakımsız |
| **Pingdom (SolarWinds)** | $15–$60/ay | Enterprise features, SLA | Pahalı, UX yavaş, developer-unfriendly |
| **Checkly** | $40–$200/ay | Playwright sentetik monitoring, API testing | Uptime odaklı değil, pahalı |
| **Cronitor** | $9–$99/ay | Cron + uptime + heartbeat | Status page zayıf |
| **Hyperping** | $15–$75/ay | Güzel UX, status page vurgulu | Küçük ekip, feature velocity yavaş |
| **Uptime Kuma** | Ücretsiz (self-host) | Open source, güçlü community | Self-host zorunlu, billing yok, SaaS yok |
| **Statuspage.io (Atlassian)** | $29–$1500/ay | Kurumsal, white-label | Sadece status page, monitoring yok, pahalı |
| **Instatus** | $20–$300/ay | Güzel status page tasarımı | Sadece status page |

### 6.2 UptimeCrow'un Diferansiyasyon Potansiyeli
1. **"Status page survives origin downtime"** — pre-rendered static serve, rakiplerin çoğu canlı render ediyor. (Teknik diferansiyatör — ama pazarlama copy'sinde vurgulanmıyor.)
2. **Dual-provider billing (Polar)** — crypto/global ödeme friendly.
3. **MIT lisans + self-host option** — UptimeRobot veya BetterStack'te yok.
4. **Multi-region checks from day 1** (Team tier) — UptimeRobot'ta $15 plan'da yok.
5. **Developer-first UX** — Hono/React stack, basit API, readable code.

### 6.3 UptimeCrow'un Rakiplerine Göre Eksikleri
| Eksik | Rakipte Var (Örnek) | Önem |
|---|---|---|
| Sentetik browser monitoring (Playwright) | Checkly, BetterStack | Medium (advanced kullanıcı) |
| Status page theme library | Instatus, Statuspage.io | High (marketing) |
| Incident post-mortem template | Incident.io, BetterStack | Medium |
| SMS / PagerDuty / Opsgenie alert | UptimeRobot Pro, BetterStack | High (enterprise) |
| API key management UI | Hepsi | High (Team tier promise) |
| Mobile app (iOS/Android) | UptimeRobot, Pingdom | Low (v2) |
| SSO (Google/GitHub/SAML) | BetterStack, Statuspage.io | Medium (sales-led) |
| Integrations marketplace | BetterStack, Datadog | Low (long-tail) |
| Slack/Teams bot (mention monitor names) | BetterStack | Low |
| Grafana / Prometheus export | Checkly | Low |
| Status page multi-language | Instatus | Low |
| Scheduled maintenance windows | Statuspage.io, Instatus | **HIGH** (basit, büyük değer) |
| RSS/Atom feed for incidents | Statuspage.io | Medium |
| Component groups (grouped monitors on page) | Statuspage.io, Instatus | Medium |

---

## 7. Launch Öncesi Yapılması Gerekenler (Pre-Launch Checklist)

### 7.1 Kritik (P0 — Launch'u engeller)
- [ ] README'deki AI ve Resend referanslarını kaldır, SES'i yaz
- [ ] `.env.example`'dan `ANTHROPIC_API_KEY` ve `RESEND_API_KEY`'i kaldır; AWS SES değişkenlerini ekle
- [ ] `index.html`'deki "AI-Native" title/description'ı düzelt + OpenGraph/Twitter card ekle
- [ ] Landing page copy'sinden "AI incident reports" promise'ini kaldır, gerçek diferansiyatörleri yaz
- [ ] Privacy Policy sayfası (`/privacy`)
- [ ] Terms of Service sayfası (`/terms`)
- [ ] Footer'a legal link'ler
- [ ] `JWT_SECRET` prod'da default ise startup'ta fail (fail-closed)
- [ ] En az 1 smoke test (register → monitor create → check fires → incident delivered)
- [ ] `sitemap.xml` ve `robots.txt`
- [ ] Production `.env` şablonu (AWS SES, Polar, JWT, APP_URL, STATUS_PAGE_URL)
- [ ] Pricing sayfası (landing'teki pricing table → standalone page)
- [ ] Polar veya LemonSqueezy'den birini seç, diğerini feature flag'le (veya sil)

### 7.2 Önemli (P1 — Launch'tan sonra 1-2 hafta içinde)
- [ ] Sentry entegrasyonu (error tracking)
- [ ] Plausible veya PostHog (product analytics, funnel tracking)
- [ ] Scheduled maintenance window özelliği (rakipte var, ucuz kazanım)
- [ ] API key management UI (Team tier promise dolduruluyor)
- [ ] Input sanitization (DOMPurify veya sanitize-html — stored XSS koruması)
- [ ] Structured logging (pino) — `console.log`'ları değiştir
- [ ] Dead-letter queue (BullMQ failed job handling)
- [ ] Dark mode
- [ ] Data retention job (plan'a göre eski `check_results` satırlarını sil)
- [ ] Incident post-mortem template / markdown support

### 7.3 İyi Olur (P2 — 1-3 ay içinde)
- [ ] SSO (Google OAuth — basit başlangıç)
- [ ] Team invite flow (teamSeats limit dolduruluyor)
- [ ] SMS / PagerDuty / Opsgenie entegrasyonu
- [ ] Component groups (status page'de monitor gruplama)
- [ ] RSS feed for incidents
- [ ] Status page theme library (3-5 hazır tema)
- [ ] TCP monitor execution (şu an sadece schema'da)
- [ ] Advanced analytics (p95/p99 latency, region breakdown)
- [ ] OpenAPI spec + Swagger UI (`/api/docs`)

### 7.4 Marketing Launch Checklist
- [ ] Landing page polish + screenshots
- [ ] Demo video (2-3 dk, Loom kabul edilebilir)
- [ ] "UptimeCrow vs BetterStack" comparison sayfası
- [ ] "UptimeCrow vs UptimeRobot" comparison sayfası
- [ ] Launch day: Product Hunt + HN + Reddit + Twitter thread
- [ ] 3 teknik blog yazısı hazır (SEO için)
- [ ] Twitter/X hesabı + bio
- [ ] Mail capture waitlist formu (eğer soft launch)
- [ ] Founding user indirimi (ilk 100 için %50 lifetime?)
- [ ] Status page for UptimeCrow itself (meta — kendi aracımızı kullan)

---

## 8. Iyileştirme Planı ve Öncelik Sırası (Faz Faz)

### Faz 1 — Documentation & Truth-in-Advertising (bugün — 2 saat)
1. README'den AI ve Resend referanslarını kaldır, AWS SES ekle
2. `.env.example` temizle (ANTHROPIC, RESEND → AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, SES_FROM_EMAIL, POLAR_*)
3. `index.html` meta tag'lerini düzelt (OG, Twitter card, doğru value prop)
4. Plan limit tablosunda "AI Reports" satırını kaldır, "Multi-region" ekle

### Faz 2 — Legal & Launch Gate (1-2 gün)
5. `/privacy` ve `/terms` sayfaları (basit template)
6. Footer component'ine legal link'leri ekle
7. `JWT_SECRET` default validation (prod'da default ise throw)
8. `robots.txt` + `sitemap.xml`

### Faz 3 — Smoke Test & Operasyonel (2-3 gün)
9. Vitest smoke test: register → create monitor → trigger check → incident path
10. Sentry entegrasyonu (API + web)
11. Plausible veya PostHog script'i landing + dashboard'a

### Faz 4 — Quick Wins (1 hafta)
12. Scheduled maintenance window (schema + UI)
13. Dark mode toggle
14. API key management UI (Team tier için)
15. Structured logging (pino)

### Faz 5 — Launch Week
16. Pricing page (standalone)
17. Comparison pages (vs BetterStack, vs UptimeRobot)
18. Demo video + screenshots
19. Product Hunt + HN + Reddit launch

---

## 9. Risk Değerlendirmesi

| Risk | Olasılık | Etki | Mitigation |
|---|---|---|---|
| Launch'ta test yok, prod bug'ı çıkar | Yüksek | Yüksek | P0: smoke test yaz |
| BetterStack/UptimeRobot fiyat savaşı başlatır | Düşük | Orta | Self-host / open source angle ile koru |
| AI kaldırıldı ama landing "AI-Native" diyor — hayal kırıklığı | Yüksek | Yüksek | P0: copy temizliği |
| Stripe yerine LS/Polar — müşteri kredi kartı güvensiz hisseder | Düşük | Düşük | Polar'ın brand'i gelişiyor, güvenilir |
| Veritabanı check_results tablosu şişer | Orta | Yüksek | P1: retention job |
| JWT_SECRET default ile prod | Orta | Kritik | P0: startup validation |
| GDPR ihlali — AB kullanıcı şikayeti | Orta | Yüksek | P0: Privacy + DSR endpoint |

---

## 10. Başarı Metrikleri (90-Day Post-Launch Hedefleri)

- **Registered users:** 500+
- **Paying customers:** 50+ (10% conversion)
- **MRR:** $600+
- **Free → Pro conversion:** ≥ 7%
- **Churn:** ≤ 5% monthly
- **NPS:** ≥ 30
- **Self-host GitHub stars:** 500+
- **Product Hunt rank:** Top 5 günlük

---

## Sonuç

UptimeCrow **teknik olarak launch-ready ama pazarlama/dokümantasyon/legal olarak launch-ready değil**. En büyük tek sorun: **ürün AI'ı kaldırdı ama her yerde "AI-Native" yazıyor** — bu yalan reklam, launch'ta news aggregator'da dövülür. Önce bu temizlenmeli. Sonra legal, sonra smoke test, sonra pazarlama.

Realistic launch tarihi önerisi: **bu çalışmadan 3 hafta sonra**, ama P0 düzeltmeleri yapıldıktan sonra soft launch (waitlist) başlatılabilir.
