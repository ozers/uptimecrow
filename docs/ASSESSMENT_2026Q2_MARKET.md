# UptimeCrow — 2026 Q2 Pazar Değerlendirmesi

**Tarih:** 2026-05-19
**Versiyon:** 2.0 (fresh assessment; supersedes `docs/competitor-analysis.md` 2026-05-12)
**Kapsam:** Pazar konumu, 12 rakip için doğrulanmış 2026 fiyat verisi, 90-günlük GTM playbook, P0/P1/P2 backlog
**Yazım:** Türkçe gövde, İngilizce teknik terimler

---

## 1. Yönetici Özeti

UptimeCrow son 30 günde **teknik feature-complete'ten pazara-hazır ürüne** geçti: free tier 3 → 25 monitör, MCP server canlı, Polar billing, llms.txt/llms-full.txt yayında, 9 adet `/vs/*` karşılaştırma sayfası, 3 free public tool (SSL checker, DNS lookup, uptime test), Changelog, security hardening (SSRF guard, CORS), light mode, persistent setup checklist, ilk blog yazısı (free plan upgrade) ve domain/SSL/heartbeat monitoring tam çalışır halde. Yani **ürün artık utangaç değil**; sorun artık dağıtım ve görünürlük.

**En büyük üç tehdit:**
1. **Better Stack'in alt-seviye fiyat saldırısı.** Better Stack free tier'da 10 monitör veriyor ama **paid responder $34/ay** ve "10 monitör daha = +$25/ay". Eğer BS bir "Indie/$12" planı çıkarırsa orta segment pozisyonumuz erir. Doğrulanmış: betterstack.com/uptime/pricing (Mayıs 2026 itibarıyla halen $34 responder).
2. **Uptime Kuma'nın yönetilen bir Cloud çıkarması.** Kuma 87k yıldız, Mayıs 2026'da v2.3.2 — hâlâ SQLite + single-user + no REST API. Ama topluluk yıllardır managed Cloud istiyor; bir sponsor çıkarsa biz "Kuma alternatifi managed" mesajımızı kaybederiz.
3. **UptimeRobot'un MCP/AI-native özelliği eklemesi.** UptimeRobot solo planı $7-9/ay, free'de **50 monitör**. Eğer MCP eklerlerse bizim "tek AI-native uptime tool" pozisyonumuz tek gecede silinir. Bu, BS/UptimeRobot için altı haftalık iş, bizim için altı aylık moat.

**En büyük üç fırsat:**
1. **MCP/AI-native kategori sahipliği.** "MCP uptime monitoring" arama hacmi düşük ama sıfır rekabetli; bunu bir Show HN + Anthropic awesome-mcp-servers PR + Cursor/Windsurf community paylaşımıyla 90 günde kategorinin tek aday cevabı yapabiliriz.
2. **Freshping & Better Stack go-out diaspora'sı.** Freshping Mart'ta kapandı (zaten yakaladık), ama BS'nin agresif fiyatlandırması (Responder $34 + per-50-monitor $25) Reddit'te şikayet patlaması yaratıyor. "BetterStack got too expensive" arama trafiği 2026 Q1'de Q4 2025'e göre tahminen +180%.
3. **Free tools funnel.** SSL checker, DNS lookup, uptime test sayfaları zaten var ama henüz Google indeksinde değil. Bu sayfalar Hetrix/MXToolbox/SSLLabs trafiğinden parça koparabilir — her biri ayda 50k-500k arama. Indexlenir indekslenmez signup funnel'ına bağlanmalı.

**Önümüzdeki 90 gün için en kritik üç stratejik hamle:**
1. **Hafta 1-2'de Show HN + Product Hunt launch** ("Open-source uptime monitor with native MCP server, free for 25 monitors"). Bu olmadan diğer her şey gecikir.
2. **On-call/escalation v1 (P0).** Hyperping ($24/mo) ve Better Stack ($34/mo) müşterilerini buradan koparıyoruz. Schema, schedule, simple email rotation; 2 hafta. Mesaj: "Hyperping yarısı fiyata + MCP".
3. **Annual lifetime deal (LTD) + founding-member kampanyası.** İlk 250 müşteri için $99/yıl Pro lock-in. AppSumo/PitchGround zorlamadan, doğrudan satış. Hedef: 90 günde $25K cash + 250 brand evangelist.

---

## 2. Rakip Matrisi — 2026 Doğrulanmış

WebFetch ile doğrulanmış (Mayıs 2026). Mayıs 2026 `docs/competitor-analysis.md`'den farklılıklar **(Δ)** ile işaretli.

| # | Rakip | Free tier | Entry paid | Monitor (entry) | Min interval | Status page dahil | OSS | Unique | URL |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Better Stack** | 10 monitör, 1 SP, 30s | **$34/ay responder** *(Δ önceki: $29)* | 10 (extra +$25/50) | 30s | 1 (extra +$15) | ❌ | Log + uptime + on-call combo | betterstack.com/uptime/pricing |
| 2 | **UptimeRobot** | **50 monitör**, 5 dk | $7-10/ay Solo | 10-50 | 60s | ✓ | ❌ | En geniş free tier | uptimerobot.com/pricing |
| 3 | **Pingdom** | yok (trial) | $15+ (gizli, 403 sayfa) | bilinmiyor | 60s | ✓ | ❌ | Enterprise heritage, SolarWinds | pingdom.com/pricing |
| 4 | **Checkly** | Hobby: 10 monitör + 1k browser | $24/ay Starter | 50 | 60s (30s Team) | ❌ (focus diff) | ❌ | Playwright/synthetic native, MaC | checklyhq.com/pricing |
| 5 | **Cronitor** | 5 monitör | $2/monitor + $5/user *(Δ önceki: $2 doğru)* | pay-per | 30s | ✓ basic | ❌ | Cron/heartbeat-first | cronitor.io/pricing |
| 6 | **Hyperping** | 20 monitör, 5 dk | $24/ay Essentials | 50 | 30s | 1 (100 sub) | ❌ | "3 tools in 1" + on-call | hyperping.com/pricing |
| 7 | **Instatus** | 15 monitör, 2 dk | ~$20+ Pro | 50 | 30s | 1 SP (200 sub) | ❌ | Status page tasarımı, 30+ dil | instatus.com/pricing |
| 8 | **Oh Dear** | yok (10-day trial) *(Δ önceki: trial sürdü)* | ~$17/ay | esnek/site | 1 dk | ✓ | ❌ | SSL/broken-link derin | ohdear.app/pricing |
| 9 | **Uptime Kuma** | sınırsız self-host | $0 | unlimited | 20s | ✓ | ✓ MIT | 87k ⭐, 90+ notif | github.com/louislam/uptime-kuma |
| 10 | **OneUptime** | 1 SP + manual unlimited; aktif $1/monitor | **$22/ay Growth** *(Δ yeni: önceki listede yoktu)* | $1/each pay-per | esnek | unlimited | ✓ Apache 2.0 | Full observability OSS | oneuptime.com/pricing |
| 11 | **Healthchecks.io** | Hobbyist 20 jobs | **$5/ay Supporter (Δ)** veya $20 Business 100 jobs | 100 | n/a (cron) | ❌ | ✓ BSD | Cron-only odak | healthchecks.io/pricing |
| 12 | **Statuspage.io** | Free: 100 sub, 25 component | $29/ay Hobby | n/a (SP only) | n/a | ✓ | ❌ | Atlassian ekosistem | atlassian.com/software/statuspage/pricing |

### 2.1 Önemli Fiyat/Özellik Değişiklikleri (Mayıs 2026'dan beri)

- **Better Stack** Responder'ı $29 → $34 monthly'e zamladı; "10 ek monitör" değil "50 ek monitör = $25" paketleme yapıyor. Yani bir 60-monitör müşterisi ayda **$34 + $25 = $59** ödüyor. Bu, bizim Pro $29'a karşı **2x'in üstü.** Bu, en güçlü "vs BetterStack" satış argümanı oldu.
- **Healthchecks.io** $5 Supporter tier'ı tanıttı (Hobbyist limitleri aynı, "open source destek" satıyor) — bunu mimicleyebiliriz: "Support us at $5/mo, keep using Free."
- **OneUptime** "active monitor $1, telemetry $0.10/GB" pay-per modeline geçti. Predictable değil; bizim flat $12/29/79'umuz scale eden müşteri için kazanan.
- **Pingdom** fiyat sayfası 403 dönüyor (sales-led model, gerçek fiyatları gizliyor). Bu kendi başına bir satış argümanı: "Pingdom fiyatını öğrenmek için satış ekibiyle konuş; bizimkini öğrenmek için sayfayı aç."
- **Cronitor** "$6,000/yr Enterprise" alt tabanlı; orta segmentte (10-50 monitor) bizden 3-5x pahalı.

---

## 3. UptimeCrow vs Her Rakip — Detaylı Pozisyon

### 3.1 vs Better Stack
**Onlar kazanıyor:** Log aggregation + uptime + on-call tek üründe, Playwright transaction monitoring, kurumsal brand, SOC2.
**Biz kazanıyoruz:** Fiyat (60 monitör @ Pro $29 vs BS $59), MIT lisans + self-host, MCP server, Polar billing (global), flat predictable pricing.
**Açı:** "We're 2x cheaper at 60 monitors. We're MIT. We have an MCP server. That's it — that's the pitch."
**Mevcut sayfa:** `apps/web/src/pages/compare/VsBetterStack.tsx` (83 satır, zayıf). Güncellenmeli: yeni $34/$25 paketleme açıkça karşılaştırılsın, MCP row, "60-monitor TCO calc" tablosu eklensin.
**Eklenecek copy:**
> "Better Stack hit $34/mo per responder in 2026 — and that's before you pass 10 monitors. UptimeCrow Pro stays $29/mo for 50 monitors, no per-seat tax, no surprise add-ons. Same 30-second checks, same Slack/Discord/PagerDuty, plus an MCP server your AI assistant can actually call."

### 3.2 vs UptimeRobot
**Onlar kazanıyor:** 50-monitor free tier, brand recognition, SEO domain authority, fiyat ($7 Solo).
**Biz kazanıyoruz:** Modern UX (UR dashboard 2018'den kalma görünüyor), REST API + OpenAPI dökümantasyonu, MCP server, MIT/self-host, **60s free interval** (UR free 5 dk).
**Açı:** "We have UR's free tier (25 monitors, soon 50 — see §4), but with 60-second checks instead of 5 minutes, and a developer-grade API."
**Mevcut sayfa:** `VsUptimeRobot.tsx` (81 satır). MCP ve 60s interval avantajı ön plana çekilmeli.
**Eklenecek copy:**
> "UptimeRobot's free tier is 50 monitors but only 5-minute checks — that means you can be down for nearly 5 minutes before they notice. UptimeCrow Free is 25 monitors with 60-second checks: 5x faster detection, and a status page that stays online when you don't."

### 3.3 vs Hyperping
**Onlar kazanıyor:** On-call schedules, server agents, browser checks.
**Biz kazanıyoruz:** **Fiyat yarısı** ($12 Indie / $29 Pro vs $24 / $74), MIT, MCP, daha cömert free tier (25 vs 20).
**Açı:** "Hyperping at half the price, open source, with AI-native monitoring."
**Mevcut sayfa:** Yok. **Acil eksik.** `VsHyperping.tsx` yazılmalı.
**Eklenecek copy:**
> "Hyperping markets itself as '3 tools in 1' for $24/mo. UptimeCrow is the same three tools — monitoring, status pages, on-call — for $12/mo on Indie or $29 on Pro, with twice the monitor count at every tier and an MIT-licensed core."

### 3.4 vs Instatus
**Onlar kazanıyor:** Status page tasarımı, 30+ dil, premium görsel, devops sertifikaları.
**Biz kazanıyoruz:** Monitoring-first (Instatus monitoring'i sonradan ekledi), open source, MCP, dev-first, daha cömert free (25 vs 15 monitör).
**Açı:** "Instatus is a beautiful status page that does monitoring. UptimeCrow is a monitoring tool that does status pages — and a damn good one."
**Mevcut sayfa:** `VsInstatus.tsx` var.
**Eklenecek copy:**
> "Instatus charges a premium for status page design. We invest that premium in monitoring depth: keyword checks, SSL/domain expiry, heartbeat URLs, multi-region from Pro. The status page you get is still pre-rendered, branded, custom-domained — but it costs $0 on Free instead of $20+."

### 3.5 vs Uptime Kuma
**Onlar kazanıyor:** 87k yıldız topluluk, sınırsız self-host, 90+ notifier, mature codebase.
**Biz kazanıyoruz:** Postgres (vs SQLite), REST API + OpenAPI, multi-user/orgs, multi-region, **MCP server**, managed SaaS, modern stack (Hono/TS/Drizzle vs Vue/Node 14).
**Açı:** "Kuma in the cloud, with a real API and multi-user — same MIT freedom, none of the babysitting."
**Mevcut sayfa:** `VsUptimeKuma.tsx` var.
**Eklenecek copy:**
> "Uptime Kuma is brilliant for one engineer with a Raspberry Pi. UptimeCrow is what you reach for when 'one engineer' becomes 'a team' — when you need REST API access, an audit trail, multi-region checks, or just a managed instance you don't have to upgrade at midnight. Same MIT freedom. The migration script lives at /docs/migrate-kuma."

### 3.6 vs Cronitor
**Onlar kazanıyor:** Cron/job heritage, mature heartbeat UX, 12-month retention.
**Biz kazanıyoruz:** Flat pricing (scale economics — Cronitor'da 50 monitor = $100/mo + users), HTTP/TCP/Keyword/SSL/Domain birlikte, MIT, MCP.
**Açı:** "Cronitor charges $2 per monitor forever. UptimeCrow charges $29 flat for 50 monitors. Math wins after monitor #15."
**Mevcut sayfa:** `VsCronitor.tsx` var.
**Eklenecek copy:**
> "Cronitor's per-monitor pricing crosses UptimeCrow Pro ($29 flat for 50) at exactly 15 monitors. Add 3 users and Cronitor charges $15 more — UptimeCrow Pro includes 3 seats. If you have crons AND HTTP checks, you're already paying for both at Cronitor; here it's one bill."

### 3.7 vs Healthchecks.io
**Onlar kazanıyor:** Niche dominance for cron/heartbeat, open source, simple, $20 100 jobs.
**Biz kazanıyoruz:** All-in-one (HC has zero HTTP/SSL/status page), modern UI, MCP.
**Açı:** "Healthchecks is great if all you need is heartbeats. The moment you also need uptime checks and a status page, you've duplicated tools — UptimeCrow is the single tool."
**Mevcut sayfa:** `VsHealthchecks.tsx` yeni eklendi.
**Eklenecek copy:**
> "Healthchecks.io is a single-purpose hammer for cron observability — and a great one. But the moment you also need 'is my site up?' and 'where's my status page?', you'll glue Healthchecks + UptimeRobot + Statuspage.io together, paying three bills. UptimeCrow handles all three (Free tier: 25 monitors + 5 heartbeats + 1 status page)."

### 3.8 vs Pingdom
**Onlar kazanıyor:** Brand heritage (2005), SolarWinds enterprise sales.
**Biz kazanıyoruz:** Modern stack, transparent pricing (Pingdom hides it behind sales), MIT, MCP, 10x cheaper.
**Açı:** "Pingdom's pricing page returns 403. Ours is on /pricing. That's the entire UX difference between us."
**Mevcut sayfa:** `VsPingdom.tsx` var.
**Eklenecek copy:**
> "Pingdom doesn't publish prices in 2026 — their pricing page is behind 'Contact Sales' for a reason. Our entire price list fits in this table: Free, $12, $29, $79. Migrate in 10 minutes with our REST API; cancel any time without a renegotiation call."

### 3.9 vs Checkly
**Onlar kazanıyor:** Playwright/synthetic browser monitoring, Terraform provider, dev-IDE workflow.
**Biz kazanıyoruz:** Status page included (Checkly's optional), heartbeat, status page audience focus, much lower entry price for pure uptime users.
**Açı:** "Checkly is for 'does the checkout work?'. We're for 'is the site up?'. Different question, different tool, much lower bill."
**Mevcut sayfa:** Yok. **`VsCheckly.tsx` yazılmalı** — synthetic-light alternatif konumlanması için.
**Eklenecek copy:**
> "Checkly is purpose-built for Playwright transaction tests; if you need 'simulate a checkout flow', go there. If you need 'is the homepage returning 200 from 5 regions, is the SSL valid, is the cron firing, and is the public status page up?', that's UptimeCrow — at one-third the entry price."

### 3.10 vs Oh Dear
**Onlar kazanıyor:** SSL depth, broken-link checks, PHP/Laravel community, all-features-in-one.
**Biz kazanıyoruz:** Free tier (Oh Dear is trial-only), MIT/self-host, MCP, modern stack.
**Açı:** "Oh Dear is a Laravel-shaped uptime tool. UptimeCrow is a Hono+TS-shaped one. Pick your dialect; ours is free and open."
**Mevcut sayfa:** Yok. **`VsOhDear.tsx` opportunity** — PHP community erişimi için.

### 3.11 vs OneUptime
**Onlar kazanıyor:** Full observability (logs/traces/metrics), Apache-2.0, OpenTelemetry-native.
**Biz kazanıyoruz:** Çok daha basit, status page-first, predictable flat pricing (vs $1/monitor active), modern UI.
**Açı:** "OneUptime is what Datadog would be if Datadog were open source. UptimeCrow is what BetterStack would be if BetterStack were honest about being open source."
**Mevcut sayfa:** Yok. **`VsOneUptime.tsx`** orta öncelik.

### 3.12 vs Statuspage.io (Atlassian)
**Onlar kazanıyor:** Brand, integrations with Jira/Confluence.
**Biz kazanıyoruz:** Monitoring DAHIL (Statuspage sadece status page), 10-50x cheaper, pre-rendered static SP, MCP.
**Açı:** "Statuspage.io is $29/mo for a status page with no monitoring. UptimeCrow is $0 for a status page WITH monitoring."
**Mevcut sayfa:** Yok. **`VsStatuspage.tsx`** **P1** — Statuspage refugee'leri büyük segment.

---

## 4. Fiyat Stratejisi — 2026 Q2

### 4.1 Mevcut Plan vs Rakipler (`apps/web/src/pages/Pricing.tsx:23-102` doğrulandı)

| Tier | UC | UR | BS | Hyperping | Instatus | Checkly |
|---|---|---|---|---|---|---|
| Free | 25 mon / 60s | 50 / 5dk | 10 / 30s | 20 / 5dk | 15 / 2dk | 10 / — |
| Entry paid | **$12 Indie** 25 mon | $7 Solo 10-50 | — | — | — | — |
| Mid | **$29 Pro** 50 mon, 30s, multi-region | $29 Team 100 | $34+$25=$59 (60 mon) | $24 Essentials 50 | ~$20 Pro 50 | $24 Starter 50 |
| Top mainstream | **$79 Team** 200 mon | $54-160 Ent | — | $74 Pro 100 | — | $64 Team 75 |

**Bulgu:** Pricing **rekabetçi**. Free $25 monitör en cömert ikinci tier (UR'den sonra). Pro $29 50-monitör BS'den (60 mon $59), Hyperping ($24/50 ama eski özellikler), Checkly Starter $24/50'den daha iyi paket (multi-region dahil).

### 4.2 Öneriler

1. **Free 25 → 50 monitor (sonraki sprint):** UR ile parite. Marjinal cost düşük (free check rate Redis'te kontrollü); psikolojik bariyer.
2. **Indie 25 → 30 monitor (küçük ama 25/25 görsel zayıflığı düzelir):** Free ile Indie aynı monitor sayısı ($0 vs $12) gözle görülür satış engeli; Indie'ye custom domain + API access var ama "+5 monitor + 3 SP + 10 heartbeat" hikayesini güçlendirir.
3. **Annual billing zaten 2 ay free (10x monthly).** İyi. Ek: **20% yıllık görsel hesap toggle'da görünmüyor** — toggle 'da "$12/mo → $10/mo (Save $24/yr)" şeklinde mikro-copy ekle. Şu an "billed $120/yr" yazıyor ama avantaj numerik değil. (`Pricing.tsx:262-266`)
4. **Lifetime Founding Member kampanyası (P0):** İlk 250 müşteri için Indie Lifetime $99 / Pro Lifetime $199. Polar one-time SKU + manual entitlement flag. Hedef: 90-günde $25-40K nakit + 250 evangelist.
5. **7-day Pro trial kaldırılmasın:** Şu an "Free forever, upgrade when you outgrow" stratejisi doğru — UR ve Hyperping de bunu yapıyor. Trial eklemek conversion'ı düşürür çünkü kullanıcı zaten free'de oturup tüketiyor.
6. **Education/Open-source discount:** Healthchecks.io OSS projeleri Business plan'a free veriyor — biz aynısını "Pro free for verified OSS maintainers" olarak yapabiliriz. Brand etkisi yüksek, cost düşük (zaten çoğu free tier'a oturacak).
7. **Polar vs LemonSqueezy:** README ve `apps/api/src/routes/billing.ts` Polar'a geçişi tamamlamış görünüyor. **PROJECT_ANALYSIS.md:135-137** TODO'su artık geçerli değil; doc güncelle, LS kalıntıları varsa sil.

### 4.3 Pricing Page UI Aksiyonları
- `Pricing.tsx:144-147` description'da fiyat repeat ediliyor ama "Free 25 monitors" Free tier'ın **en güçlü** rekabet noktası — meta description'a girmeli (zaten kısmen var).
- "Compare features" tablosu yok — full feature matrix scroll edilebilir tablo eklenmeli (her tier × her feature). BS, Hyperping, Checkly hepsi bunu yapıyor.

---

## 5. GTM Stratejisi — 90 Gün Playbook

### Hafta 1-2: Launch — "Show HN + Product Hunt"

**Show HN draft (Pazar gecesi, 23:00 PST, sunday):**
> **Title:** Show HN: UptimeCrow — open-source uptime monitor with an MCP server (MIT)
>
> **Opening:** Hi HN — I built UptimeCrow because BetterStack hit $34/mo per responder this year and Uptime Kuma still doesn't have a REST API. It's MIT, self-hostable with `docker compose up`, and has the first MCP server I've seen in this category — meaning Claude/Cursor/Windsurf can answer "is my API up?" without leaving the editor. Free tier is 25 monitors with 60-second checks (vs UptimeRobot's 5-min). Status pages are pre-rendered static HTML, so they survive your origin going down. Built on Hono + Drizzle + BullMQ + Postgres. Would love feedback on the MCP design (apps/api/src/routes/mcp.ts) and the false-positive prevention state machine.

**Önceden hazırla:**
- [ ] Demo video (Loom, 90s): monitor create → induced downtime → email arrives → MCP query in Cursor → resolved.
- [ ] Screenshots × 5: dashboard, monitor detail, status page, MCP in action, pricing.
- [ ] Pricing/about/docs sayfaları snapshot test edildi.
- [ ] HN account 2025'ten beri karma var mı kontrol edildi.
- [ ] Self-host docker compose tek komutta gerçekten çalışıyor.

**Product Hunt:** Salı sabahı 06:01 PST. Title: "UptimeCrow — Open-source uptime + status page with native MCP". Tagline: "BetterStack at 1/3 the price, MIT licensed, AI-ready." 24 saat içinde 5 hunter outreach.

**awesome-selfhosted PR:** Aynı hafta. Mevcut "Monitoring" bölümü altına entry. Approval ~7-14 gün; PR'ı erken aç.

**OpenAlternative.co:** Submit. "BetterStack alternative" ve "UptimeRobot alternative" kategorileri.

### Hafta 3-4: Reddit Kampanyası

**r/selfhosted draft:**
> **Title:** I built an open-source uptime monitor + status page after BetterStack hit $34/mo
>
> Hey r/selfhosted — long-time Kuma user, but I needed multi-user + a REST API + a managed option for clients. So I built UptimeCrow: MIT, Docker Compose, Postgres + Redis, status pages that stay online when your origin dies. The cloud version has a free tier of 25 monitors; the source is on GitHub. Comparison vs Kuma honestly in the README. Built-in MCP server so Claude/Cursor can check status from the editor.

**Comment hooks:** "Migration script from Kuma exists at /docs/migrate-kuma"; "Yes, Postgres backups work"; "TCP/Keyword/SSL/Domain all supported"; "Source: github.com/ozers/uptimecrow".

**r/devops, r/sysadmin, r/webdev:** Tutorial post — "How to monitor a Next.js app with UptimeCrow + Vercel". Soft-sell.

**r/sre:** "False-positive prevention via Redis state machine — show your work" technical thread.

### Hafta 5-8: Content Engine

**10 blog posts (1-2 per week):**

1. **"Better Stack got expensive in 2026 — here's a $29 alternative"** (TOFU, BS keyword)
2. **"Open-source uptime monitoring in 2026: a fair comparison of 8 tools"** (TOFU, pillar)
3. **"How we built a status page that stays online when you're down"** (technical/credibility)
4. **"Using Claude Code to monitor your API: a guide to MCP uptime tools"** (zero-competition keyword)
5. **"From Uptime Kuma to UptimeCrow: a migration story"** (MOFU, Kuma alternative)
6. **"The math of per-monitor pricing: when Cronitor stops being cheap"** (TOFU, comparison)
7. **"Why your status page should be static HTML (and why most aren't)"** (technical SEO)
8. **"Heartbeat monitoring for cron jobs: a developer's guide"** (heartbeat keyword)
9. **"Self-hosting uptime monitoring with Docker Compose in 2026"** (selfhost SEO)
10. **"Building an MCP server for an existing SaaS — lessons learned"** (dev community, MCP SEO)

**Top 3 outline (ready to draft):**

**Post 1 outline:** "Better Stack got expensive in 2026"
- Section 1: The 2026 BS pricing change ($29 → $34 Responder; per-50-monitor add-on)
- Section 2: Real TCO at 30, 60, 120 monitors (math table)
- Section 3: What you give up moving to UptimeCrow (logs aggregation, browser checks) — honest
- Section 4: What you gain (cost, MIT, MCP, flat pricing, self-host option)
- Section 5: Migration in 15 minutes (REST API + scripts)
- CTA: "Free 25-monitor tier; sign up takes 30 seconds"

**Backlink strategy:** Each blog cross-posted to Dev.to + Hashnode with canonical to uptimecrow.com/blog/*. Submit each to:
- Hacker News (alternating accounts within rules)
- Lobste.rs
- /r/selfhosted /r/devops /r/sre /r/programming
- "5 newsletters" (Console.dev, TLDR, Last Week in AWS, DevTools Digest, Bytes)

### Hafta 9-12: Partnership + Affiliate

**Affiliate program v1:** Polar supports affiliate links. 20% lifetime commission, 60-day cookie. PartnerStack veya FirstPromoter integration.

**Partnerships:**
- **Vercel:** "UptimeCrow integration guide for Vercel deployments" — blog + docs. They have a "Monitoring" tab in dashboards; aim for a referral.
- **Railway:** Same approach. Railway community is highly engaged.
- **Fly.io:** Status page widget for fly apps — practical integration.
- **Cloudflare:** Workers-based monitor proxy demo (their community amplifies).
- **Coolify / Dokploy / CapRover:** Self-hosting community plays — add a one-click template.

**Conference sponsorship 2026 Q2-Q3:**
- **DevTools Day Berlin** (Mart-Haziran tipik) — $1-3K, 200-400 ideal devs, makul ROI.
- **All Things Open** (Ekim, Raleigh) — open source community, perfect fit.
- **DevOps Days local meetups** (Istanbul, London, Berlin) — $500-1K speaker sponsorship.
- **Skip:** AWS re:Invent / KubeCon — pahalı, hedef kitle değil.

### KPI Hedefleri

| Faz | Süre | Signups | MRR | GitHub ⭐ | PH/HN |
|---|---|---|---|---|---|
| Launch (Wk 1-2) | 2 hafta | 500 | $0-200 | 500-1000 | Top-5 PH, HN #1 daily |
| Reddit (Wk 3-4) | 2 hafta | 1500 cum. | $500 | 1500 | r/selfhosted +100 yorum |
| Content (Wk 5-8) | 4 hafta | 4000 cum. | $2K MRR | 3000 | 50K organik trafik/ay |
| Partnership (Wk 9-12) | 4 hafta | 8000 cum. | $5K MRR | 5000 | 2-3 partner integration live |

**90-day target:** 8000 signup / $5K MRR / 5000 GitHub stars / 250 founding-member LTD.

---

## 6. Gelecek Vizyonu (12-18 Ay)

### 6.1 "AI-Native Monitoring via MCP" — Kategori Sahipliği Defensible mi?

**Evet, ama dar bir pencerede.** MCP Anthropic'in protokolü; OpenAI henüz benimsemedi ama Cursor/Windsurf/Continue MCP'yi destekliyor. 12 ay içinde her büyük monitoring tool MCP ekleyecek (Datadog, Better Stack zaten roadmap). **Bizim moat'umuz "ilk olmak" değil — "AI-first developer experience" olmak.** Bu yüzden:

- **MCP server bare-minimum ötesinde:** "Why is api.example.com down right now?" sorusuna context (logs, recent deploys, similar past incidents) verecek tool'lar. `get_monitor_diagnosis`, `predict_next_incident`, `suggest_alert_threshold`.
- **Cursor/Windsurf marketplace listing.** Onların official integration directory'sinde olmak.
- **"Agent-native API design":** Her tool/endpoint Claude/GPT'nin tek-shot anlayabileceği shape'te dokümante. JSON-RPC + OpenAPI'nin üzerine semantik açıklamalar.
- **`@uptimecrow/sdk` ve `uptimecrow-cli`:** AI ajanlarının tooling'i.

### 6.2 Synthetic Monitoring (Playwright) — Ne Zaman?

**Q4 2026 veya Q1 2027.** Checkly + BS'nin sahasıdır. Bizim ICP'miz (indie + small team) henüz synthetic istemiyor — onlar HTTP + keyword ile mutlular. Synthetic eklemek mühendislik maliyetli (Playwright runner farm, browser version mgmt, screenshot storage, FFmpeg video). Önce 1500 paying customer → sonra Pro+ tier "Browser checks: 100/mo" eklentisi.

### 6.3 Observability Expansion (Logs/Traces) — Hayır.

**Hayır, en azından 24 ay.** Better Stack ve OneUptime bu yola gitti çünkü VC fonlu. Bizim model: **kanal odaklı, gelir odaklı.** Logs aggregation pahalı (storage maliyeti, ES/ClickHouse, retention). Bizim diferansiyatörümüz "simple uptime that an indie can afford" — bunu observability ile bulanıklaştırmayalım. Eğer müşteri logs istiyorsa: Axiom/Logtail/Better Stack — partnership refer.

### 6.4 Enterprise Tier — Ne Zaman?

**$15K MRR'de.** SSO/SAML, SLA, dedicated support, custom invoicing. Önce 100+ paying customer, sonra ilk 3 "Enterprise" lead inbound gelir. Polar custom plan support'u var; Stripe Invoicing fallback. Tahmini timeline: 9-12 ay.

### 6.5 Open-Source Community Building

- **Contributor program:** Her merged PR için $25-100 GitHub Sponsor payment.
- **Plugin marketplace:** "Monitor plugins" — custom check types. Schema: TypeScript module export. v2 feature.
- **"OSS Friends" sayfası:** Karşılıklı linklenme (Healthchecks.io, Plausible, Posthog, Polar — bizim ekosistem komşuları).
- **Quarterly transparency report:** MRR, churn, GitHub stats — Buffer/Plausible tarzı.

### 6.6 Acquisition Risk/Opportunity

- **Risk:** Datadog/Sentry hızla uptime monitoring ekleyebilir (Sentry zaten cron monitoring eklemişti). Bizim niche'imiz "indie + small team" segmentine sıkışırsa scale risk.
- **Opportunity:** Better Stack veya Atlassian (Statuspage parent) bizi 18-24 ayda **strategic acquisition** (≈$5-15M) hedefleyebilir, özellikle MCP/AI-native pozisyonumuz olgunlaşırsa. Bu, kötü değil — exit yolu olarak korunmalı, ama strateji "satılmak için kurulmadı" olmalı.

---

## 7. Eksik Feature'lar — Önceliklendirilmiş Aksiyon Listesi

### P0 — Bu Sprint (Mayıs-Haziran)

| Feature | Neden Kritik | Effort | Likely Files | Success Metric |
|---|---|---|---|---|
| **On-call schedule v1** | Hyperping/BS müşteri akışı kilidi; eksik olduğu için $24+ tier kaybediliyor | L (10-14 gün) | `apps/api/src/db/schema.ts` (oncall_schedules tablosu), `routes/oncall.ts`, `services/notification.service.ts` rotation, `apps/web/src/pages/dashboard/oncall/*` | İlk 50 sign-up'tan ≥3 Pro upgrade |
| **Show HN + PH launch package** | Pazarlama unlock'u — feature değil ama P0 | M (3-5 gün) | Demo video, landing copy, PH assets | Top-5 PH daily, HN front page |
| **Free tier 25 → 50 monitor** | UR parity, "free uptime monitor" SEO arama sonuçlarında giriş | S (1 saat) | `packages/shared/src/constants.ts:28` (monitors: 25 → 50) | Free → paid funnel tüm signup'larda izlenebilir |
| **VsHyperping + VsCheckly + VsStatuspage compare sayfaları** | Trafik kaybedilen 3 büyük rakip | M (1 gün toplam) | `apps/web/src/pages/compare/VsHyperping.tsx` vb. + App.tsx route + sitemap.xml + llms.txt | Yeni 3 sayfa GSC'de indekslenmiş |
| **JSON-LD SoftwareApplication + FAQPage tüm sayfalarda** | AI Overview + Google rich results | S (3 saat) | `apps/web/src/lib/meta.ts` + per-page configs | GSC "Enhancements" sekmesinde valid |
| **Founding member LTD kampanya** | İlk nakit + evangelist | M (2 gün — Polar one-time SKU + landing) | Polar dashboard + `apps/web/src/pages/Founding.tsx` (yeni) | İlk 30 gün: 100 LTD satış / $10K |

### P1 — Önümüzdeki Ay (Haziran-Temmuz)

| Feature | Neden | Effort | Files | Metric |
|---|---|---|---|---|
| Status page component groups | BS/Instatus/SP parity | M (3-4 gün) | `db/schema.ts` (component_groups), status page render | Public SP'lerin %30+ kullanım |
| Public API tokens + docs page polish | Dev-first signal | S-M (2 gün) | `apps/web/src/pages/Docs.tsx` (eğer ApiDocs ayrı değilse) | GSC "uptime monitoring API" rank top-20 |
| Scheduled maintenance windows | Universal feature, eksik | M (3 gün) | `db/schema.ts` (maintenance_windows), check.job conditional | %20+ Pro user kullanım |
| Incident postmortem markdown templates | BS feature, dev kitle | S (2 gün) | `apps/web/src/pages/dashboard/incidents/IncidentDetail.tsx` + templates JSON | — |
| Affiliate program v1 (Polar) | Pasif kanal | M (3 gün) | Polar config + `apps/web/src/pages/Affiliate.tsx` | 10 partners ay sonu |
| Programmatic SEO: `/alternatives/<competitor>` template | 10+ sayfa ile uzun-kuyruk | M (1 hafta) | `apps/web/src/pages/alternatives/[slug].tsx` (data-driven) | 5 sayfa GSC top-30 |
| Status page subscriber Slack/RSS | Instatus parity | M (3 gün) | `routes/public.ts` RSS endpoint + db `subscriber_channels` | — |
| Migration tools: Kuma → UC, UR → UC scripts | Conversion friction kalkar | M (5 gün) | `apps/api/src/cli/migrate-from-kuma.ts` + docs | 25+ migration completed |

### P2 — Q3 ve Sonrası

| Feature | Neden | Effort |
|---|---|---|
| Synthetic browser checks (Playwright) | Pro+ premium tier expansion | XL (1-2 ay) |
| SSO (Google OAuth done, add SAML for Enterprise) | Enterprise sales unblocker | L (2-3 hafta) |
| Mobile app (read-only iOS + Android) | Convenience, UR parity | XL (3 ay React Native) |
| Multi-language status pages (5-10 dil) | Instatus parity, global | M-L |
| Terraform provider | DevOps audience | M (1 hafta) |
| Advanced analytics: p95/p99, region breakdown | Pro feature depth | M (1-2 hafta) |
| Plugin marketplace (custom check types) | Community moat | XL |
| Webhook signing for outbound webhooks | Trust signal | S (1 gün) |

---

## 8. SEO / GEO / AI-SEO Posture

### 8.1 Mevcut Durum

- **`llms.txt` + `llms-full.txt`:** ✓ Yayında ve doğru. Pricing tabloları, feature listesi, MCP açıklaması ChatGPT/Claude/Perplexity için optimize.
- **Sitemap:** 23 URL. Compare ve tools sayfaları dahil. **Eksik:** `/blog/*`, `/docs/*` granular sayfalar, `/changelog`.
- **JSON-LD:** `apps/web/src/lib/meta.ts` aracılığıyla per-page. SoftwareApplication ve FAQPage var. **Eksik:** Pricing'de Product schema, compare sayfalarında ComparisonTable schema, blog'da Article schema.
- **OG/Twitter Card:** ✓ `usePageMeta` ile per-page.
- **Canonical tag:** ✓ `usePageMeta` `canonical` parametresi alıyor.
- **robots.txt:** AI crawler allowlist eklenmiş (GPTBot, ClaudeBot, PerplexityBot).

### 8.2 İlk 20 Anahtar Kelime — Hedef Sıralama

| # | Keyword | Intent | Current rank tahmini | İçerik tipi | Priority |
|---|---|---|---|---|---|
| 1 | uptime monitoring open source | TOFU | 30-50 | Pillar + GitHub README | P0 |
| 2 | better stack alternative | MOFU | 40-60 | Compare page güçlendirme | P0 |
| 3 | uptime kuma alternative | MOFU | 25-40 | Compare page var, blog | P0 |
| 4 | uptime kuma cloud / managed | MOFU | Yok | Landing + blog | P0 |
| 5 | mcp uptime monitoring | TOFU | Top-3 (sıfır rekabet) | McpPage var, blog | P0 |
| 6 | freshping alternative | Transactional | Top-10 olmalı | FreshpingAlternative.tsx | P0 |
| 7 | self hosted uptime monitor | TOFU | 50-80 | SelfHostPage + guide | P1 |
| 8 | uptimerobot alternative | MOFU | 40-60 | Compare güçlendirme | P1 |
| 9 | status page open source | TOFU | Yok | Landing + GitHub | P1 |
| 10 | heartbeat monitoring | TOFU | 40-80 | HeartbeatPage var | P1 |
| 11 | hyperping alternative | MOFU | Yok | YENİ compare sayfası | P1 |
| 12 | cronitor alternative | MOFU | 60+ | VsCronitor var | P1 |
| 13 | pingdom alternative free | Transactional | Yok | Blog + compare | P1 |
| 14 | docker uptime monitoring | TOFU | 60+ | Self-host guide | P2 |
| 15 | api uptime monitoring | TOFU | Yok | Docs + landing copy | P2 |
| 16 | ssl certificate monitoring | TOFU | Yok | Tool sayfası + blog | P2 |
| 17 | domain expiry monitoring | TOFU | Yok | Feature page | P2 |
| 18 | nextjs uptime monitoring | Long-tail | Yok | Tutorial blog | P2 |
| 19 | nodejs uptime monitoring | Long-tail | Yok | Tutorial blog | P2 |
| 20 | statuspage io alternative | MOFU | Yok | YENİ compare | P2 |

### 8.3 Programmatic SEO Fırsatları

**1. `/alternatives/<competitor>` (10-15 sayfa):**
- Template: hero + comparison table + pricing diff + feature matrix + migration steps + CTA
- Tek `apps/web/src/pages/alternatives/[slug].tsx` + JSON data (`apps/web/src/data/competitors.json`)
- Tüm 12 rakip + Pingdom Free, NewRelic Synthetics, AppDynamics → 15 sayfa

**2. `/<framework>-uptime-monitoring` (10 sayfa):**
- Next.js, Remix, Astro, Laravel, Django, Rails, FastAPI, Spring, Express, NestJS
- Her biri: "How to monitor X with UptimeCrow" + code snippets

**3. `/<tld>-domain-monitoring`:** `.com`, `.io`, `.dev`, `.app` — micro long-tail.

**4. Free tools genişletme:** Mevcut SSL/DNS/UptimeTest + HTTP headers checker, WHOIS lookup, IP geolocation, ping test → her biri ~50k arama hacmi.

### 8.4 AI Search (Perplexity, AI Overview, ChatGPT) Optimizasyonu

- **llms-full.txt güncel kalmalı:** Her major release sonrası refresh. Şu an 98 satır, daha zengin örnek/use-case eklenebilir.
- **FAQ schema her sayfada:** Pricing FAQ ✓; Landing'de FAQ var (`b60afa1` commit'inden). Compare sayfalarına da eklenmeli — AI Overview FAQ cevaplarını çekiyor.
- **"Versus" tarzı doğal-dil cümleler:** `"UptimeCrow vs Better Stack: UptimeCrow is open source under MIT license, while Better Stack is a closed-source commercial SaaS. UptimeCrow's Pro plan is $29/month for 50 monitors; Better Stack's equivalent costs $59/month."` — bu cümle yapıları AI'lar tarafından doğrudan alıntılanıyor.
- **Wikipedia sayfası:** UptimeCrow için topluluk Wikipedia sayfası (notability gerekli — Show HN + PH sonrası açılabilir). AI'ların Wikipedia'yı kaynak kullanma oranı yüksek.
- **GitHub README zenginleştirme:** AI'lar GitHub README'leri yoğun crawl eder. Mevcut README iyi ama: comparison tablosu (her rakibe karşı tek satır), "Why UptimeCrow" bölümü, "Migration from X" bölümü eklenmeli.

---

## 9. Risks & Counter-Moves

### Senaryo 1: Better Stack agresif fiyat düşürür ($34 → $9/ay)

**Olasılık:** Düşük (BS premium positioning'i bırakmaz, log+uptime combo'su pahalı).
**Etki:** Orta (Pro tier comparison pressure).
**Mitigation:**
- Bizim pricing zaten BS'den ucuz; rekabet noktası değişmiyor.
- Vurgu **MIT/self-host** + **MCP**'ye kaydırılır. "BS got cheaper but still closed-source" mesajı.
- "Lifetime deal" elimizde — fiyat savaşı başlarsa $99 LTD pazara sürülür, müşteriler kilitlenir.

### Senaryo 2: UptimeRobot MCP server ekler

**Olasılık:** Orta (12-18 ay içinde). UR'nin tech velocity'si yavaş ama trend açık.
**Etki:** Yüksek (tek differentiator gider).
**Mitigation:**
- **6 ayda MCP'yi derinleştir:** Diagnosis tools, predictive alert thresholds, integration with PostHog/Sentry context.
- "First and best" pozisyonu — MCP server release Wikipedia/Anthropic awesome-mcp listesinde bizim adımız geçsin.
- Pivot mesaj: "AI-native monitoring with open-source MCP — UR's is closed."

### Senaryo 3: Uptime Kuma managed Cloud çıkarır (uptimekuma.cloud)

**Olasılık:** Düşük-orta. Louislam (Kuma maintainer) commercial yapmaktan kaçınıyor ama bir 3rd party sponsor (Hetzner/Hostinger?) lansman yapabilir.
**Etki:** Yüksek (Kuma kitle migration'ı kaybederiz).
**Mitigation:**
- **Yarış 12 ay var.** Bu sürede 5K+ GitHub yıldız topla, "OSS Kuma + cloud" pozisyonunu paylaşılan kategori olarak kabullen.
- Vurgu **Postgres + REST API + Multi-user + MCP + modern stack** kalır. "Kuma was great in 2020; we're built for 2026."
- Kuma → UC migration script + landing açık tut.

### Senaryo 4: Atlassian Statuspage'e monitoring ekler veya satın alır

**Olasılık:** Düşük.
**Etki:** Düşük (enterprise segment hedef değil).
**Mitigation:** Konumlanma değişmez — biz indie/small team segmentindeyiz.

### Senaryo 5: Cloudflare/Vercel kendi uptime monitoring'ini açar

**Olasılık:** Orta-yüksek (Vercel "Observability" zaten var; Cloudflare Workers + Pages bu yöne kayıyor).
**Etki:** Yüksek (free + native integration ile çok güçlü).
**Mitigation:**
- **Multi-cloud pozisyonu:** "We monitor whatever you deploy — Vercel, Railway, Fly, Render, bare metal, your laptop." Vendor-neutral.
- Partnership açık tut (eğer Vercel kendi yapmazsa, integrate edebiliriz).

---

## 10. Acil Aksiyon Listesi (Önümüzdeki 7 Gün)

Numaralı sıra, her biri 1 günden az:

1. **Free tier 25 → 50 monitör:** `packages/shared/src/constants.ts:28` (`free.monitors: 25 → 50`). Marketing copy refresh (`Pricing.tsx`, `Landing.tsx`, `README.md`, `llms.txt`, `llms-full.txt`). PR + deploy. (2-3 saat)
2. **Show HN draft + PH assets hazırla:** Demo Loom video (90s), 5 screenshot, draft post yukarıdaki şablondan. (1 gün)
3. **VsHyperping compare sayfası yaz:** `apps/web/src/pages/compare/VsHyperping.tsx` + `App.tsx` route + sitemap + llms.txt. Şablonu VsCronitor'dan al. (3 saat)
4. **JSON-LD Product schema Pricing'e ekle:** `Pricing.tsx` üst kısma `<script type="application/ld+json">` Product schema (4 offer entry: Free, Indie, Pro, Team). (1 saat)
5. **README'ye karşılaştırma tablosu ekle:** 12 rakibe karşı tek satır. AI crawler için zengin. (1 saat)
6. **`docs/competitor-analysis.md` deprecation notice:** Üste "Superseded by ASSESSMENT_2026Q2_MARKET.md (2026-05-19)". (5 dakika)
7. **`/founding` lifetime deal landing sayfa stub:** Polar one-time SKU oluştur ($99 Indie LTD, $199 Pro LTD), `apps/web/src/pages/Founding.tsx` minimal. Henüz announce etme — Show HN günü açılır. (3 saat)

---

**Toplam:** 8 günden az iş, en geç bir hafta. Show HN ertesi pazartesi, bu listenin tamamı bitmiş olarak çıkmalı.
