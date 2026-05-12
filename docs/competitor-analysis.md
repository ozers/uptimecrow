# UptimeCrow — Rakip Analizi & İyileştirme Planı

**Tarih:** 2026-05-12  
**Versiyon:** 1.0  
**Amaç:** Kapsamlı rakip analizi, özellik boşlukları, SEO değerlendirmesi ve öncelikli geliştirme listesi

---

## İçindekiler

1. [Rakip Matrisi (Özet)](#1-rakip-matrisi-özet)
2. [Rakip Detay Analizleri](#2-rakip-detay-analizleri)
3. [Fiyatlandırma Karşılaştırması](#3-fiyatlandırma-karşılaştırması)
4. [Özellik Boşlukları (Feature Gaps)](#4-özellik-boşlukları-feature-gaps)
5. [SEO Değerlendirmesi](#5-seo-değerlendirmesi)
6. [UptimeCrow'un Unique Diferansiyatörleri](#6-uptimecrowun-unique-diferansiyatörleri)
7. [Öncelikli Geliştirme Planı](#7-öncelikli-geliştirme-planı)
8. [Go-To-Market Boşlukları](#8-go-to-market-boşlukları)

---

## 1. Rakip Matrisi (Özet)

| Rakip | Fiyat (Entry) | Free Tier | Hedef Kitle | Güçlü Yön | Zayıf Yön | Bizim Avantajımız |
|---|---|---|---|---|---|---|
| **BetterStack** | $29/mo | ✓ 10 monitor | Mid-market/Enterprise | Polished, log+uptime combo | Pahalı, closed-source | Fiyat, MIT lisans, MCP server |
| **UptimeRobot** | $7/mo | ✓ 50 monitor | Solo/SMB | Ucuz, güçlü brand | Eski UX, sınırlı API | Modern UX, MCP, open-source |
| **Checkly** | $24/mo | ✓ (Hobby) | Senior SWE teams | Playwright, MaC | Pahalı/overkill | Fiyat, status page odak |
| **Cronitor** | $2/monitor | ✓ 5 monitor | Backend/DevOps | Cron niche | Pahalı at scale | Flat pricing, heartbeat+uptime+status page |
| **Hyperping** | $24/mo | ✓ 20 monitor | Growing startups | "3 tools in 1", on-call | Pahalı, closed | Fiyat ($12 vs $24), MIT, MCP |
| **Instatus** | $15/mo | ✓ 15 monitor | Design-conscious | Status page design | Monitoring ikincil | Open-source, developer-first |
| **Oh Dear** | $17/mo | ✗ (trial only) | PHP/Laravel devs | SSL depth, all-features | No free tier | Free tier, MCP |
| **Uptime Kuma** | $0 (self-host) | ✓ Unlimited | Self-hosters | 86k stars, 90+ notif. | No REST API, no multi-user | Postgres, REST API, MCP, multi-user, SaaS |
| **Freshping** | DEFUNCT | N/A | Ex-Freshworks users | Was free/generous | **KAPALANDI (Mart 2026)** | **Acil migration hedefi** |
| **OneUptime** | OSS + SaaS | ✓ OSS | Enterprise OSS | Full observability | Karmaşık/heavy | Daha basit, modern stack |
| **Healthchecks.io** | $0 (20 jobs) | ✓ 20 jobs | Cron/heartbeat only | Sade, etkili | Uptime/status page yok | All-in-one: uptime + heartbeat + status |

---

## 2. Rakip Detay Analizleri

### 2.1 BetterStack (Better Uptime)

**Fiyatlandırma (2026):**
- Free: 10 monitor, 10 heartbeat, 1 status page, 3-dakika check
- Paid: ~$29/mo başlıyor, 30s check, Playwright transaction monitoring

**Pazarlama Açısı:**  
Premium developer-grade monitoring + full observability (logs + uptime + incident management). "No false positives" ve "30s checks" öne çıkıyor.

**SEO Stratejisi:**  
`betterstack.com/community/comparisons/` altında 100+ rakip karşılaştırma makalesi yayınlıyor. Neredeyse tüm "X alternative" sorgularında görünüyor. Bu içerik stratejisi rakipsiz.

**UptimeCrow vs BetterStack:**
- ✅ Bizim avantajımız: Fiyat (Free/$12/$29/$79 vs $29+ başlangıç), MIT open-source, MCP server
- ❌ Onların avantajı: Log aggregation, Playwright derinliği, on-call rotations, marka

**Aksiyon:**  
`/vs/betterstack` sayfası mevcut; güçlendirilmeli. "Pre-rendered status page" ve "MCP server" argümanları eklenmeli.

---

### 2.2 UptimeRobot

**Fiyatlandırma (2026):**
- Free: **50 monitor**, 5-dakika interval, 1 status page, 3-ay retention
- Solo: $7-19/mo (yıllık), 60s check
- Team: $29-38/mo, 100 monitor
- Enterprise: $54-160/mo, 200-1000+ monitor

**Kritik Not:**  
50-monitor ücretsiz tier **bizim en büyük fiyat dezavantajımız**. Bir kullanıcı ücretsiz karşılaştırma yaparken UptimeRobot'un 50 monitörüne karşı 3 monitörümüz var.

**SEO Stratejisi:**  
`/knowledge-hub/` ile derin içerik üretiyor. "Ücretsiz uptime monitoring" sorgularında dominant. Domain authority çok güçlü.

**Aksiyon:**  
- Free tier en az 5-7 monitor'e çıkarılmalı  
- `/vs/uptimerobot` sayfasında "modern UX + developer API + MCP + open-source" argümanları önce gelmeli

---

### 2.3 Checkly

**Fiyatlandırma (2026):**
- Hobby (Free): 10 uptime monitor, 1k browser check/ay
- Starter: $24/mo, 50 monitor, 3k browser
- Team: $64/mo

**Konumlanma:**  
"Monitoring as Code" — Playwright-native, Terraform/Pulumi sağlayıcı. Synthetic E2E monitoring.

**UptimeCrow Örtüşmesi:**  
Farklı segment. Checkly "does the checkout work?" sorusunu cevaplıyor; biz "is it up?" sorusunu cevaplıyoruz. Doğrudan rakip değil ama "Checkly alternative for simple uptime" nişinde fırsatımız var.

---

### 2.4 Cronitor

**Fiyatlandırma (2026):**
- Hacker (Free): 5 monitor, email/Slack, basic status page
- Business: $2/monitor/ay + $5/kullanıcı/ay, 30s check, SMS

**Konumlanma:**  
"Prevent silent job failures" — cron job + heartbeat nişini domine ediyor.

**UptimeCrow Örtüşmesi:**  
Bizim heartbeat özelliğimiz doğrudan örtüşüyor. Ama Cronitor'ın per-monitor fiyatı scale olunca pahalılaşıyor — biz flat pricing ile avantajlıyız.

**Aksiyon:**  
Heartbeat/cron monitoring için özel landing page. "Cronitor alternative" SEO hedefi.

---

### 2.5 Hyperping

**Fiyatlandırma (2026):**
- Free: 20 monitor, 5-dk check
- Essentials: $24/mo, 50 monitor, 30s, 1 status page
- Pro: $74/mo, 100 monitor, 3 status page, custom domain
- Business: $249/mo, on-call, SAML

**Konumlanma:**  
"Replace 3 tools (Pingdom + Statuspage.io + PagerDuty) with 1" — yıllık $5K tasarruf iddiası.

**UptimeCrow vs Hyperping:**
- ✅ Avantajımız: $12 Indie vs $24 Essentials (2x ucuz), MIT open-source, MCP server
- ❌ Onların avantajı: On-call/escalation built-in (kritik boşluk)

**Aksiyon:**  
On-call özelliği roadmap'a alınmalı. "Hyperping alternative" compare sayfası yazılmalı.

---

### 2.6 Instatus

**Fiyatlandırma (2026):**
- Starter (Free): 15 monitor, 2-dk, email, 5 ekip üyesi, 200 abone
- Pro: ~$15-20/mo, 50 monitor, 30s, SMS

**Konumlanma:**  
"World's most beautiful status pages, 10x faster than Statuspage.io" — design-led.

**Kritik Ortak Nokta:**  
Instatus da **pre-rendered/static** status page sunuyor. Bu argümanı sadece biz söylediğimizi zannetmemek lazım.

**UptimeCrow vs Instatus:**
- ✅ Avantajımız: Monitoring-first (Instatus monitoring'i sonradan ekledi), open-source, MCP, developer-first
- ❌ Onların avantajı: Status page tasarımı (30+ dil, premium görsel)

**Aksiyon:**  
Status page tasarımını güçlendir. `/vs/instatus` comparison sayfası yaz.

---

### 2.7 Freshping — ACİL FIRSAT

**Durum: HİZMET SONLANDIRILDI — Mart 2026**

Freshping (Freshworks), tüm hizmetini **6 Mart 2026'da kapattı**. Kullanıcı verileri 4 Haziran 2026'da silinecek/silinmiş. Eski kullanıcılar aktif olarak "Freshping alternative" arıyor.

**Yapılacaklar:**
1. `/vs/freshping` veya `/alternatives/freshping` landing page — ACİL
2. Freshping'in ücretsiz 50-monitor limitini üst sıralarda vurgula
3. "Freshping was shutting down, here's what to do next" blog yazısı

---

### 2.8 Uptime Kuma

**Durum:** v2.3.2 (Mayıs 2026), 86.6k GitHub star, 7.8k fork

**Özellikler:**
- HTTP/TCP/Keyword/JSON/WebSocket/Ping/DNS/Push/Steam/Docker monitoring
- 90+ notification entegrasyonu
- 20-saniye minimum interval
- 2FA, çoklu status page

**En Büyük Boşlukları (Bizim Fırsatlarımız):**
- ❌ REST API yok (en sık şikayet)
- ❌ Multi-user/SSO yok
- ❌ Multi-region check yok
- ❌ Config-as-code yok
- ❌ SQLite temelli — ölçeklenemiyor
- ❌ SaaS seçeneği yok

**Stratejik Konumlanma:**  
> "Uptime Kuma'nın ruhunu SaaS'a taşıdık: MIT lisanslı, Docker self-host, ama ayrıca Postgres + REST API + multi-user + MCP server + managed SaaS ile."

**En yüksek değerli SEO hedefi:** "uptime kuma alternative"

---

## 3. Fiyatlandırma Karşılaştırması

### 3.1 Free Tier Karşılaştırması

| Ürün | Monitor Sayısı | Check Interval | Status Page | Özel Not |
|---|---|---|---|---|
| UptimeRobot | **50** | 5 dk | 1 | Dominant free tier |
| Hyperping | 20 | 5 dk | 1 | |
| Instatus | 15 | 2 dk | 1 | 200 abone |
| Healthchecks.io | 20 heartbeat | N/A | — | |
| **UptimeCrow** | **3** | **5 dk** | **1** | **En düşük** |
| Cronitor | 5 | 5 dk | 1 | |
| Checkly Hobby | 10 | — | — | |
| Oh Dear | 0 (sadece trial) | — | — | |

**Sorun:** Free tier'da 3 monitor, UptimeRobot'un 50'sinin yanında çok zayıf görünüyor. "Free uptime monitoring" sorgularında kayıplar yaşanıyor.

**Öneri:** Free tier 5–10 monitöre çıkarılmalı.

### 3.2 Entry Paid Tier Karşılaştırması

| Ürün | Fiyat | Monitor | Check Interval |
|---|---|---|---|
| UptimeRobot Solo | $7/mo | 10-50 | 60s |
| **UptimeCrow Indie** | **$12/mo** | **10** | **1 dk** |
| Oh Dear | $17/mo | ~15 site | 1 dk |
| Instatus Pro | ~$15-20/mo | 50 | 30s |
| Cronitor | ~$20/mo (10 monitor) | 10 | 30s |
| BetterStack | $29/mo | 10 | 30s |
| Hyperping Essentials | $24/mo | 50 | 30s |
| Checkly Starter | $24/mo | 50 | — |

**Değerlendirme:** $12 Indie makul ama Hyperping $24 karşısında 50 vs 10 monitor avantajı onlarda. Indie'yi 20-25 monitor'e çıkarmak rekabetçiliği artırır.

---

## 4. Özellik Boşlukları (Feature Gaps)

### P0 — Kritik (Rakiplerde yaygın, biz olmadan pazarda kayıp yaşıyoruz)

| Özellik | Rakipte Var | Neden Kritik | Tahmini Efor |
|---|---|---|---|
| **Status page component groups** | Statuspage, Instatus, Hyperping, BetterStack | Kullanıcılar "API", "Dashboard", "DB" gibi gruplandırma bekliyor — olmadan incomplete hissettiriyor | Orta (2-3 gün) |
| **SSL sertifika monitoring** | Oh Dear, Uptime Kuma, BetterStack, UptimeRobot | Kolay eklenebilir, yüksek SEO değeri, kullanıcı beklentisi | Düşük (1-2 gün) |
| **REST API dökümantasyonu (public)** | Tüm büyük rakipler | Dev-first pozisyonlama için zorunlu; Uptime Kuma'nın #1 şikayeti bizim fırsatımız | Düşük (docs + openapi) |
| **Free tier monitor artışı (5-10)** | UptimeRobot (50), Hyperping (20) | "Free uptime monitor" sorgularında rekabet için | Trivial (config değişikliği) |

### P1 — Yüksek Öncelik (Segment genişleme için)

| Özellik | Rakipte Var | Neden Önemli | Tahmini Efor |
|---|---|---|---|
| **Domain expiry monitoring** | UptimeRobot, Oh Dear, Uptime Kuma | SSL ile birlikte natural; "domain monitoring" keyword | Düşük (1 gün) |
| **On-call scheduling** | BetterStack, Hyperping, Instatus, PagerDuty | "PagerDuty alternative" ve "Hyperping alternative" pazarını açar | Yüksek (2-3 hafta) |
| **SMS alerts** | UptimeRobot, Cronitor, Instatus, BetterStack | Paid tier beklentisi; Twilio entegrasyon | Orta (3-5 gün) |
| **Status page subscribers via Slack/RSS** | Instatus, Statuspage | Mevcut email aboneliğini genişletir | Orta (3-4 gün) |
| **Incident RSS/Atom feed** | Statuspage.io, Instatus | Low-effort, tüm araçlarda var | Düşük (1 gün) |
| **Terraform/API provider docs** | Checkly, BetterStack | IaC/DevOps crowd; MCP ile birlikte güçlü mesaj | Orta (hafta) |

### P2 — Orta Öncelik (Uzun vadeli)

| Özellik | Rakipte Var | Neden Önemli | Tahmini Efor |
|---|---|---|---|
| **Synthetic browser monitoring (Playwright)** | BetterStack, Checkly | Premium segment; Team+ tier | Çok Yüksek (aylar) |
| **SSO / Google OAuth** | BetterStack, Hyperping, Instatus | B2B satış için; Pro+ tier | Orta-Yüksek |
| **Multi-language status pages** | Instatus (30+ dil) | Global kullanıcılar | Orta |
| **Mobile app push notifications** | UptimeRobot, Pingdom | Convenience feature | Yüksek |
| **Team invite flow** | Tüm enterprise araçlar | Schema var, UI eksik | Orta |
| **Advanced analytics** | BetterStack, Checkly | p95/p99, region breakdown | Orta |

---

## 5. SEO Değerlendirmesi

### 5.1 Mevcut SEO Durumu

**Artılar:**
- `robots.txt` ve `sitemap.xml` mevcut ✓
- 2 compare sayfası var (`/vs/betterstack`, `/vs/uptimerobot`) ✓
- Domain yapısı temiz ✓
- `index.html` meta tag'leri var (daha güçlendirilebilir)

**Eksikler:**
- Toplam sadece 6 URL sitemap'te (rakipler 50-500+ URL ile çalışıyor)
- Blog/içerik bölümü yok (rakiplerin en güçlü kanalı)
- Structured data (JSON-LD) yok
- OpenGraph meta tag'leri eksik/yetersiz
- `/alternatives/*` programmatic sayfaları yok
- Docs/help center SEO'su yok

### 5.2 Acil SEO Fırsatları (Öncelik Sırası)

#### 🔴 Kritik — Bu hafta

| Anahtar Kelime | Intent | Neden Acil | Aksiyon |
|---|---|---|---|
| `freshping alternative` | Transactional/Migration | Freshping Mart 2026'da kapandı — binlerce göçmen kullanıcı aktif arıyor | `/vs/freshping` sayfası yaz |
| `betterstack alternative` | Transactional | Mevcut sayfa var; MCP + open-source argümanı eklenmeli | `/vs/betterstack` güncelle |
| `uptimerobot alternative` | Transactional | Mevcut sayfa var; modern UX + developer API öne çıkar | `/vs/uptimerobot` güncelle |

#### 🟠 Yüksek Öncelik — Bu ay

| Anahtar Kelime | Zorluk | Fırsat | Aksiyon |
|---|---|---|---|
| `uptime kuma alternative` | Orta | En değerli hedef — Kuma'nın REST API/multi-user yokluğu bizim fırsatımız | `/vs/uptime-kuma` sayfası |
| `open source uptime monitoring` | Orta | UptimeCrow'un MIT lisansı ana diferansiyatör | Pillar page + self-host guide |
| `self hosted uptime monitor` | Orta | Docker quickstart ile birlikte güçlü | `/self-host` guide page |
| `mcp server monitoring` | Çok Düşük | SIFIR REKABET — First-mover fırsatı | `/mcp` özellik sayfası + blog |
| `pre-rendered status page` | Çok Düşük | Teknik farklılaştırıcı, kimse bu terimi claim etmemiş | Blog yazısı + landing copy |
| `heartbeat monitoring` | Düşük-Orta | Cronitor'ın cron nişi; biz daha ucuzuz | `/heartbeat-monitoring` sayfası |

#### 🟡 Orta Vadeli

| Anahtar Kelime | Zorluk | Fırsat |
|---|---|---|
| `cron job monitoring` | Orta | Heartbeat ile birlikte hedefleme |
| `statuspage alternative` | Yüksek | Pahalı ama değerli |
| `pingdom alternative` | Yüksek | Legacy kullanıcılar göç ediyor |
| `ssl certificate monitoring` | Orta | Özellik eklenince bu hedef alınabilir |
| `status page with monitoring` | Düşük | Long-tail, bizim tam value prop'umuz |
| `uptime monitoring api` | Düşük | Dev-first SEO |

### 5.3 İçerik Stratejisi Boşlukları

**Rakiplerin Ürettiği, Bizde Olmayan İçerik:**
1. **"Best X tools" listeleri** — BetterStack Community, Hyperping blog her hafta üretiyor
2. **"How to monitor your [Next.js/Rails/Django/Laravel] app"** — Tutorial SEO
3. **"How to set up status page for [Stripe/AWS/Cloudflare]"** — Ecosystem SEO
4. **"X vs Y vs Z" üçlü karşılaştırma** — BetterStack bunu çok iyi yapıyor
5. **Changelog/release notes** — Product credibility + SEO
6. **Open-source/self-host guide** — r/selfhosted, awesome-selfhosted traffic

### 5.4 Teknik SEO Eksikleri

```html
<!-- Eksik: OpenGraph -->
<meta property="og:title" content="UptimeCrow - Open-Source Uptime Monitoring" />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />

<!-- Eksik: Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />

<!-- Eksik: JSON-LD Structured Data -->
<script type="application/ld+json">
{
  "@type": "SoftwareApplication",
  "name": "UptimeCrow",
  ...
}
</script>

<!-- Eksik: Canonical tags -->
<!-- Eksik: hreflang (çok dil yoksa şimdilik gerekli değil) -->
```

**Sitemap Güncellemesi Gerekiyor:**
- `/vs/uptime-kuma`, `/vs/freshping`, `/vs/instatus` vs sayfaları
- `/blog/*` (oluşturulunca)
- `/docs/*` (oluşturulunca)
- `/heartbeat-monitoring`, `/mcp`, `/self-host` feature pages

---

## 6. UptimeCrow'un Unique Diferansiyatörleri

Bu diferansiyatörler **landing page ve marketing copy'de merkeze alınmalı:**

### 6.1 MCP Server (Birincil Diferansiyatör — Sıfır Rekabet)
UptimeCrow piyasada **MCP (Model Context Protocol) server sunabilen tek uptime monitoring aracıdır**. Bu şu an sıfır rekabetli bir kategori.

**Mesaj:** "Monitor your infrastructure from Claude, Cursor, or any AI assistant. The only uptime tool with a native MCP server."

### 6.2 Pre-Rendered Static Status Pages
Status page HTML **önceden render edilerek** sunuluyor. Origin down olsa bile status page ayakta.

**Mesaj:** "Your status page stays online even when you're down. Pre-rendered HTML, served directly — no origin required."

**Not:** Instatus de bunu yapıyor, ama "pre-rendered" kelimesini marketing'de claim eden yok. Biz claim etmeliyiz.

### 6.3 MIT Lisans + Self-Host
BetterStack, UptimeRobot, Hyperping, Instatus, Checkly — hiçbirinde yok. Sadece Uptime Kuma var (ama SaaS'ı yok).

**Mesaj:** "Open-source core, MIT-licensed. Self-host with Docker Compose, or use our managed cloud. No vendor lock-in."

### 6.4 False-Positive Prevention (Redis State Machine)
2 ardışık başarısızlık → DOWN. 1 başarı → UP. Tek blip false alarm yaratmıyor.

**Mesaj:** "Confirm before alerting. 2 consecutive failures required before we wake you up — no more 3am pings for a 2-second blip."

### 6.5 Modern Developer Stack
Hono + TypeScript + Drizzle ORM + BullMQ — Uptime Kuma'nın eski Vue/Node stack'ine kıyasla çok daha modern ve attractive for contributors.

---

## 7. Öncelikli Geliştirme Planı

### Faz 1 — Bu Hafta (Hızlı Kazanımlar + Acil Fırsatlar)

| Görev | Efor | Etki | Tip |
|---|---|---|---|
| `/vs/freshping` landing page yaz | 2 saat | Çok Yüksek (aktif migration kitlesi) | SEO/Marketing |
| Free tier'ı 3 → 7 monitöre çıkar | 30 dk | Yüksek (comparison friction) | Ürün |
| OpenGraph + Twitter Card meta tag'leri ekle | 1 saat | Orta | Teknik SEO |
| JSON-LD structured data ekle (SoftwareApp schema) | 1 saat | Orta | Teknik SEO |
| Sitemap'e yeni sayfalar ekle | 30 dk | Düşük | Teknik SEO |

### Faz 2 — Bu Ay (Özellik + SEO)

| Görev | Efor | Etki | Tip |
|---|---|---|---|
| `/vs/uptime-kuma` comparison sayfası | 3-4 saat | Yüksek | SEO |
| SSL sertifika expiry monitoring | 2-3 gün | Yüksek | Özellik |
| Status page component groups | 3-4 gün | Yüksek | Özellik |
| `/mcp` özellik sayfası (MCP server docs) | 1 gün | Yüksek (first-mover) | SEO/Marketing |
| `/heartbeat-monitoring` landing page | 2-3 saat | Orta | SEO |
| REST API public dökümantasyon (Swagger güçlendirme) | 2 gün | Yüksek | Developer SEO |
| Domain expiry monitoring | 1-2 gün | Orta | Özellik |

### Faz 3 — Önümüzdeki 3 Ay

| Görev | Efor | Etki | Tip |
|---|---|---|---|
| Blog bölümü açılması (haftada 1-2 yazı) | Devam eden | Yüksek (uzun vadeli) | İçerik SEO |
| `/vs/instatus`, `/vs/pingdom`, `/vs/cronitor` sayfaları | 1 gün/sayfa | Yüksek | SEO |
| SMS alerts (Twilio) | 1 hafta | Orta | Özellik |
| Incident RSS/Atom feed | 1 gün | Düşük-Orta | Özellik |
| Status page subscribers via Slack/RSS | 1 hafta | Orta | Özellik |
| Google OAuth SSO | 2 hafta | Orta | Özellik |
| On-call scheduling v1 | 3-4 hafta | Çok Yüksek (yeni pazar) | Özellik |

### Faz 4 — 6+ Ay

| Görev | Efor | Etki | Tip |
|---|---|---|---|
| Terraform/Pulumi provider | Yüksek | Orta (IaC kitle) | Ekosistem |
| Playwright synthetic monitoring | Çok Yüksek | Yüksek (enterprise) | Özellik |
| Multi-language status pages | Orta | Orta (global) | Özellik |
| Team invite flow (multi-user) | Orta | Yüksek (Team plan) | Özellik |
| Mobile push notifications | Yüksek | Düşük-Orta | Özellik |

---

## 8. Go-To-Market Boşlukları

### 8.1 Community & Distribution

| Kanal | Öncelik | Durum | Notlar |
|---|---|---|---|
| **Hacker News Show HN** | P0 | Yapılmadı | "Open-source BetterStack alternative with MCP server" angle |
| **Product Hunt** | P0 | Yapılmadı | "First AI-native uptime monitor" hook |
| **r/selfhosted (Reddit)** | P0 | Yapılmadı | Uptime Kuma'nın kitlesi; kendi self-host guide yaz |
| **r/devops, r/sysadmin** | P1 | Yapılmadı | Teknik okuyucular |
| **awesome-selfhosted GitHub listesi** | P0 | Yapılmadı | Masif self-host trafiği |
| **OpenAlternative.co** | P0 | Yapılmadı | 2026 aramalarda "BetterStack alternatives" listesinde çıkıyor |
| **Docker Hub (proper README)** | P1 | Bilinmiyor | Self-host discovery |
| **Dev.to / Hashnode blog** | P1 | Yapılmadı | Tutorial + SEO backlink |

### 8.2 Launch Stratejisi

**Önerilen Açılış Mesajı (HN için):**
> "Show HN: UptimeCrow – open-source uptime monitoring + status pages with an MCP server (MIT, self-hostable with Docker)"

**Freshping Migration Kitlesi (Acil):**
Freshping Mart 2026'da kapandı. Bu kullanıcılar şu an "freshping alternative" arıyor. Bu kitleye özel bir landing page + iletişim bu hafta çıkmalı.

### 8.3 Affiliation & Partners

- Affiliate/referral program yok (BetterStack ve UptimeRobot aggressive affiliate programlar çalıştırıyor)
- İlk 100 kullanıcıya "founding member" indirimi / lifetime deal tartışılabilir (AppSumo, PitchGround)

---

## Sonuç

UptimeCrow teknik olarak güçlü ama **pazarda görünürlük yok**. Üç öncelikli alanda aksiyon:

1. **SEO** — Freshping alternative page + Uptime Kuma alternative page + blog açılması. Rakiplerden çok gerideyiz içerik üretiminde.
2. **Free tier** — 3 monitör çok düşük; 7-10'a çıkarmak comparison sayfalarındaki kaybı azaltır.
3. **MCP server** — Piyasada benzersiz; bunu merkeze al. "AI-native monitoring" kategorisini biz yaratıyoruz.

Tek hedef: Önce Freshping migration kitlesi → sonra Uptime Kuma alternative SEO → sonra blog içerik motoru.
