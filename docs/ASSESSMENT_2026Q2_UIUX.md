# UptimeCrow — UI/UX Değerlendirme Raporu (2026 Q2)

> Statik kod denetimine dayalı. Dev server bu ortamda çalışmadığı için `designqc` görselleri alınmadı — bulgular dosya + satır referansıyla doğrulanabilir.

---

## 1. Genel Değerlendirme — Tasarım Olgunluğu

UptimeCrow şu anda **"developer-focused dark terminal" estetiği** ile **"shadcn temiz dashboard"** arasında ikiye bölünmüş bir kimliğe sahip. İki sistem ayrı ayrı düzgün, ama birbirine bağlanmıyor:

| Yüzey | Stil | Token kaynağı |
|---|---|---|
| Marketing (Landing, Pricing, Vs*, Tools, Heartbeat, McpPage, SelfHost, Changelog, Freshping) | Custom CSS — "console+terminal" karanlık tema | `apps/web/src/pages/Landing.css` (`--bg`, `--green`, `--surface`...) |
| Auth (Login, Register, Forgot/Reset) | Tailwind + shadcn | `globals.css` HSL token (`--primary`, `--card`...) |
| Dashboard (Overview, Monitors, Incidents, Settings...) | Tailwind + shadcn + semantik status renkleri | `globals.css` (`--success`, `--warning`, `--danger`) |
| Public status page | Inline `<style>` (üçüncü ayrı palet) | `static-gen.service.ts` |

**Konumlandırma:**
- Şu anki yer: UptimeRobot'tan kesinlikle daha modern, Hyperping'in renkli sıcaklığını yakalayamıyor, BetterStack'in cilasına yaklaşıyor ama tutarsızlıklar (özellikle marketing sayfalarındaki kırık `var(--accent)` referansları) bunu zayıflatıyor. Instatus design-led çizgisinin uzağında.
- Olması gereken yer: **"Dev-first ama cilalı"** — terminal estetiği bir marka avantajı; korunmalı ama tek bir tasarım dilinin altında tutarlılaştırılmalı.

**İşe yarayan tarafı:**
- Marka kişiliği var (terminal demo, mono font, yeşil aksan) → AI-koklu jenerik görünmüyor.
- Setup checklist ve onboarding state machine'i akıllı; rakiplerin çoğunda yok.
- Dashboard'da semantik status token refactor'u (commit `e48711d`) doğru yönde, light mode parite çoğunlukla tutuyor.

**Generic/AI-coded duran tarafı:**
- Karşılaştırma sayfaları (CompareLayout) çok şablonik — 11 vs* sayfası için aynı yapı, ayırıcı görsel öğe yok.
- Tools sayfaları (DnsLookup, SslChecker, UptimeTest) inline-style ile yazılmış, görsel hiyerarşi zayıf.
- Logo wall'da metin chip'leri var, gerçek müşteri logoları olmadığı için "henüz çekemediğimiz sosyal kanıt" boşluğu kapatılmaya çalışılmış.

---

## 2. Design System Audit

### Token kapsama

**`globals.css` (Tailwind tarafı)** — kapsam iyi, eksiksiz:
- Color: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, ve semantik `success/warning/danger` (+ light/dark parite). Çift kayıt `--success-fg` foreground sürümleri light için ayrı ayarlanmış — iyi.
- Radius: 3 adım (`sm`, `md`, `lg`) `--radius` üzerinden.
- Shadow: sadece `shadow-sm shadow-black/20` (`card.tsx:12`) — özel shadow token yok. Light modda kart yükselmesi `Landing.css:79-86` içinde elle ezilmiş. **Boşluk:** elevation skala (`shadow-xs/sm/md/lg/xl`) yok.
- Typography: tek font ailesi `Sora` (body) + `IBM Plex Mono` (`globals.css:1`). Type scale token'ı yok (h1/h2/h3 her sayfada elle).
- Spacing: Tailwind defaults; ad-hoc piksel/rem yok ama inline `style={{...}}` ile pek çok yerde elle yazılmış (Pricing.tsx:198-244, Changelog.tsx:147-185 vb.).

**`Landing.css` paleti (marketing tarafı)** — paralel, parça parça:
- Sadece `--bg --surface --surface2 --border --border2 --text --text2 --text3 --green --green2 --green-dim --red --amber` tanımlı (`Landing.css:2-16`).
- **`--accent` veya `--danger` tanımlı DEĞİL**, ama 14 yerde kullanılıyor (aşağıdaki P0 bul).
- Light tema overrides `.light .landing` (`Landing.css:30-86`) altında tek tek elle override edilmiş — token bazlı değil. Yeni bir component eklediğinizde light mode'da kırılma riski yüksek.

### Light/Dark parite

| Surface | Dark | Light | Notlar |
|---|---|---|---|
| `globals.css` HSL tokenleri | OK | OK | success/warning/danger ayrı tunulmuş — iyi |
| `Landing.css` | OK | OK ama kırılgan | `--accent`/`--danger` tanımsız (P0) |
| Status page HTML (`static-gen.service.ts:540-553`) | OK | OK | LocalStorage `uc-sp-theme` ile bağımsız toggle |
| Body radial glow | sadece dark (`globals.css:84-91`) | OK | İsteğe bağlı |

### shadcn primitive tutarlılığı

`apps/web/src/components/ui/` — Button, Card, Dialog, DropdownMenu, Input, Label, Select, Sheet, Skeleton, Table, Tabs, Textarea, Tooltip — hepsi standart shadcn pattern. `Button` 6 variant + 4 size (`button.tsx:11-29`) — eksik yok. `Card` 5 subcomponent — eksik yok.

**Tutarsızlık:** Setup checklist, Login alt çubuğu, Tools formları gibi yerlerde shadcn `Card`/`Input` yerine elle div/span yazılmış. Örneğin `SslChecker.tsx:98-113` Tailwind/shadcn yerine inline `style={{}}` ile input render ediyor.

### Iconography

`lucide-react` her yerde — tutarlı (`Activity`, `AlertTriangle`, `Globe`, `Heart`, `Zap`, `Bell`, `Shield`, `Sparkles`, vb.). Stroke width default (2). İki yerde inline SVG (Google logosu `Login.tsx:151`, status page kalp ikonları `static-gen.service.ts:744-758`) — kabul edilebilir.

### Spacing ritmi

Tailwind spacing (4/8/12/16/24) dashboard içinde çoğunlukla doğru. Marketing tarafında `Landing.css` 0.4rem / 0.6rem / 0.7rem / 0.8rem / 1.2rem / 1.5rem / 1.8rem / 2.5rem gibi ad-hoc oranlar (`Landing.css:138-156, 213-296`). Modüler bir 8pt grid'e oturmamış.

---

## 3. Sayfa Sayfa Denetim

### Landing.tsx (`apps/web/src/pages/Landing.tsx`)

**İyi:** TerminalDemo (`:27-97`) IntersectionObserver ile animasyonlu, brand'i taşıyor. FAQ JSON-LD GEO için kritik (`:296-304`). DashboardPreview + StatusPagePreview gerçek bir UI önizlemesi sunuyor (`:101-253`).

**UX sorunları:**
- Hero badge metni "10 monitors" diyen Comparison tablo ile çelişiyor (`Landing.tsx:590`: `"✓ 10 free forever"` halen yazıyor, ama free plan 25'e çıkmış — `Landing.tsx:384` hero badge "25 monitors", aynı sayfada `:628` price card "25 monitors"). **Tutarsız.**
- "Comparison" tablosu mobilde yatay scroll (`comparison-scroll` wrapper), ama 5 sütun + uzun metin → mobilde okumak zor.
- Nav linkler aynı sayfada çapa (`#features`) ama Pricing/Tools/Changelog/Compare sayfalarına git-dön'de bu çapa kırılır (`Pricing.tsx:165 /#features` kullanmış, doğru). Compare/Tools layoutlarında `<Link to="/#features">` var ama Tools sayfası nav'ı yanlış: "Free Tools" linki var, "Features" yok.

**Görsel sorunlar:**
- `noise SVG overlay` (`Landing.css:88-96`) light modda da uygulanıyor — light arka planda nokta-paterni gri tonlamayla hafif kirletici. `display:none` yapılmalı veya opaklık daha düşürülmeli.
- Logo wall metin chip'leri (`Landing.tsx:402-405`) "trusted by developers building [SaaS products, open source tools, ...]" — bu honest ama tasarım gerilim yaratmıyor. Boş alan + biraz kontrast şart.

**Fix önerileri:**
- `Landing.tsx:590` `"✓ 10 free forever"` → `"✓ 25 free forever"`.
- Yeni bir "ProductScreenshot" component'i yazıp DashboardPreview HTML mockup'ını gerçek bir export'lanmış PNG/SVG ile değiştirilebilir → DOM hafifler.
- Hero-cta'nın altına bir trust strip ekleyin: GitHub yıldız sayısı + "MIT lisans" rozet.

### Pricing.tsx (`apps/web/src/pages/Pricing.tsx`)

**İyi:** Annual toggle (`:198-245`), 4 plan kartı + Indie eklendi. FAQ accordion `<details>` ile native (`:289-313`).

**UX sorunları:**
- "Most popular" rozeti `Pro` planında ama görsel olarak yalnız `featured` class'ı veriliyor; etiket yok. Conversion artırmak için "Most popular" şeridi gerekli.
- Annual fiyatlar `$10, $24, $66` ve hemen altında `billed $120/yr` notu — net ama "save 2 months" rozeti yalnız toggle yanında (`:230-243`) görünür, plan kartlarında tekrar göstermek shoppin'i hızlandırır.

**Görsel sorunlar:**
- **P0 BUG**: `Pricing.tsx:234-236`:
  ```tsx
  background: "var(--green)18",
  border: "1px solid var(--green)40",
  ```
  Bu **geçersiz CSS** — `var(--green)18` literal "string concatenation" değil, tarayıcı `var(--green)` değeri dönmedikten sonra `18` ek bir token olur ve property görmezden gelinir. `--green-dim` zaten var, ya da `color-mix(in srgb, var(--green) 18%, transparent)` kullanın.
- FAQ accordion inline style'la yazılmış (`:289-312`) — `<details>`/`<summary>` shadcn benzeri component'e taşınmalı.

### HeartbeatPage.tsx, McpPage.tsx, SelfHostPage.tsx, FreshpingAlternative.tsx

Hepsi aynı kalıp: `<div className="landing"><nav>{...nav inline duplicated...}</nav>` + hero + bölümler + footer. Nav 6 sayfada **fiilen aynı** ama her sayfada elle kopyalanmış (Landing, Pricing, Changelog, ToolsLayout, CompareLayout, Heartbeat, Mcp, SelfHost, FreshpingAlternative — 9 yer).

**Fix:** `MarketingLayout` component'ı (CompareLayout + ToolsLayout zaten benzeri yapıyor) — bütün marketing nav'ı tek noktada tut.

**HeartbeatPage özelinde:** `:178` aktif tab `background: activeTab === i ? "var(--accent)" : "var(--surface)"` — `--accent` tanımsız. Aktif tab renksiz görünür.

**McpPage özelinde:** "You:" prompt rengi `var(--accent)` (`:165`) — aynı sorun. Demo `<pre>` blokları light modda zor okunur durumda olabilir, çünkü demo strip override (`Landing.css:71-76`) bu sayfa için kapsamayabilir.

### Changelog.tsx

**İyi:** 10 entry var (`:18-79`), tip-kodlu rozetler (`feature/improvement/fix/security`), tarih sıralı, JSON-LD yok ama hero+canonical doğru.

**Sorun:**
- `TYPE_STYLES.feature.color = "var(--accent)"` (`:82`) — yine **tanımsız**, rozet rengi bozuk.
- Entry kartları inline style (`:154-181`) — `RoadmapEntry` veya `LogEntry` componentine taşınmalı.

### CompareLayout.tsx + Vs*.tsx (örnek: VsHealthchecks, VsStatusCake)

**İyi:** Tek layout 9 sayfa için. `Cell` helper `✓`/`✗` markup'ını ele alıyor (`:27-37`). BreadcrumbList JSON-LD (`:48-56`).

**Tutarlılık:** Vs* sayfalarının hepsi `CompareLayout` prop'larına veri sağlıyor — temiz. Sayfa hero'su, "honest take" kartı, side-by-side tablo, "why teams switch" feature grid'i aynı.

**Sorunlar:**
- Görsel ayırıcı yok — bir vs* sayfası diğerinden ayırt edilmiyor. Her rakip için renk veya temsili logo katmanı eklenebilir.
- Mobilde tablo overflow `comparison-scroll` ile çözülmüş, ama "honest take" kartı (`CompareLayout.tsx:164`) 760px max-width ama padding "1.5rem 1.8rem" → mobilde dar.

### Tools Index + 3 Tool Sayfası (DnsLookup, SslChecker, UptimeTest)

**İyi:** SEO meta hook her birinde, rate limit notu görünür (`SslChecker.tsx:124`).

**Sorunlar (3 sayfada da):**
- **`var(--accent)` tanımsız** — ToolsIndex icon rengi (`:58`), "Use the tool →" CTA rengi (`:61`), SslChecker statusColor (`:75`), DnsLookup result ikonu (`:144`), UptimeTest ikon (`:78, :187`). Hepsi renk göstermez/inherit'e düşer.
- Inline-style ağır — input, dl/dt/dd, kartlar shadcn'e taşınmalı.
- Form layout'u tutarsız: ToolsLayout marketing CSS'i kullanıyor ama içerik yarı shadcn yarı inline.
- "On-brand mı?": HAYIR — Landing'in terminal sıcaklığı yok. Bunlar daha jenerik form sayfası gibi.

### Login / Register / ForgotPassword / ResetPassword

**Login.tsx** (`Login.tsx:48-164`): Split-screen layout, sol panel branding, sağ panel form. shadcn primitif kullanımı temiz. Google OAuth ekstra. **Bu cila düzeyi diğer sayfalarda eksik.**

**Register.tsx**:
- **P0 BUG**: `Register.tsx:20`: `"Monitor up to 3 services instantly"` — eski plan limiti. **25** olmalı. Conversion hatası.

**ForgotPassword/ResetPassword**: Logo + form, tek kolon, sade. shadcn ile uyumlu ama Login'in split-screen cilasından farklı — auth flow içinde tutarsız.

---

## 4. Dashboard / Authed Area Denetim

### Overview (`apps/web/src/pages/dashboard/Overview.tsx`)

- **StatusBanner** (`:182-277`): semantik status renkleri kullanıyor (`bg-danger/5`, `border-warning/25`). Down olduğunda `animate-ping` halka — güzel detay. Light/dark her ikisinde okunur.
- **MetricCards** (`:73-129`): 2x4 grid, hover state'i sadece `to` varsa veriliyor — UX'i iyi. Tabular nums kullanılmış — uyum güzel.
- **EmptyOverview** (`:136-178`): hero + 2 CTA + 3 satırlık feature row. İyi.
- **FeatureDiscoveryCard** ve **NudgeBanner**: tutarlı dashed/solid border ayrımı.

**Sorun:** "Status Banner" + "NudgeBanner (heartbeat late)" + "NudgeBanner (no status page)" + "MetricCards" sıralı render edildiğinde dikey kaydırma uzun → ilk fold'da çok aksiyon. NudgeBanner'ları collapsible yapmak veya tek bir "what needs attention" bölümünde birleştirmek.

### Sidebar (`sidebar.tsx`)

İyi: ikon + label + desc satırlar; aktif state border-l-2 + bg-primary/10; upgrade kartı plan==='free'. Light/dark uyumlu. User pill alt taraf. Mobile sheet (`dashboard-layout.tsx:20-27`).

**Sorun:**
- "Overview" item'ında `desc` yok ama "Monitors", "Heartbeats", "Maintenance", "On-Call" item'larında var → görsel olarak satır yükseklikleri kayıyor (`item.desc && "py-2.5"` `:105`). Hizalamayı doğrudan kontrol etmek için min-height verilebilir.
- "Settings" linki ayrı bir blokta alt tarafta (`:177-189`) — sebebi ayarların "footer" olması, ama görsel açıdan "Theme toggle"'la bir blokta olduğu için cluster karışık.

### Setup Checklist (`setup-checklist.tsx`)

- Persistent banner Header altında (`dashboard-layout.tsx:31`). Toggle/expand, dismiss, "celebrate" toast + localStorage persistence (`:107-120`).
- Compact bar 4 kart genişlemesine 2.5 dakika çalışma kapasitesi sunuyor. **Yerleştirme iyi**.

**Sorun:** Mobile'de progress bar gizli (`:149 hidden ... sm:flex`). "next step" CTA da `md:flex` ile gizli (`:166`). Mobile kullanıcı sadece label + dismiss görüyor → değer önerisi kayboluyor.

### Formlar (MonitorForm)

`MonitorForm.tsx` (200+ satır): zod resolver, test-before-create butonu (`:130-138`), warning render (`:182-187`). Error mesajları `text-destructive` — semantik. iyi.

**Sorun:**
- Form 6 alan + advanced toggle yok → uzun. "Advanced" accordion (intervalSeconds, timeoutMs, confirmationCount, sslDaysWarning, domainDaysWarning, slowResponseThresholdMs) saklanabilir.
- Test result kartı status renklerini doğru kullanıyor (`:144-188`), ama 5XX rozeti sınıflandırması ehemmiyetli — `expectedStatus !== statusCode` ise warning yerine kullanıcıya "Eşleşmedi, expected: X, got: Y" mesajı net olmalı.

### Tablolar (MonitorsList, IncidentsList)

`MonitorsList.tsx`'de `UptimeBar` ve responsive bar render var (anatomy'e göre 3631 tok). Empty state için `EmptyState` component (`empty-state.tsx`).

**Sortable headers**: yok. Kolon sıralaması yok.

### Settings (~7952 tok)

Section navigation yok — tek uzun scroll. Profile / Notifications (Slack/Discord/PagerDuty/Teams/Telegram/Twilio/Custom webhook) / API Keys / Team / Billing — hepsi sıralı. **Major UX sorunu**: bir section'a doğrudan gitmek için anchor yok, tab/yatay nav yok. Sticky alt-bar ile "Save" yok; her bölüm kendi save düğmesini taşıyor (kötü değil ama dağınık).

---

## 5. Status Page (Public) Audit

`apps/api/src/services/static-gen.service.ts:540-726` — inline CSS template:

- **İyi**: `accent-bar` (3px), `status-hero` ikon + label + countdown (`:751-777`), `ubar-track` flex bar (`:647-650`), `incident-card` left border (`:653-656`), subscribe section icon (`:691-705`), theme toggle JS LocalStorage'lı (`:810-832`).
- **2026-modern mi**: Evet — Instatus/BetterStack ile aynı sınıfta. Tipografi Inter sistem-fallback, font-feature-settings kullanılmamış.
- **Eksik**: SSL/domain expiry rozeti yok status sayfasında (monitor'de SSL günü kaldı bilgisi var ama public'e sızdırılmamış). Subscribe section'da "Email yerine SMS, Discord webhook" alternatif kanal yok.

---

## 6. Mobile Responsiveness

| Sayfa | <640px riski |
|---|---|
| Landing.tsx | Hero h1 `clamp(2.4rem, 5.5vw, 3.6rem)` (`Landing.css:244`) — iyi. Comparison table scroll wrapped — iyi. Logo wall items wrap — kontrol edilmeli. |
| Pricing.tsx | 4 plan kartı `pricing-cards` grid — mobilde tek kolon olmuyorsa overflow olabilir. |
| Compare Vs* | Comparison-scroll var, ancak "honest take" kartı 1.5rem 1.8rem padding — dar ekranda metin daralır. |
| Tools | Hero form `flex-wrap: wrap` (`SslChecker.tsx:97`) — input ile button alt alta gelir, OK. |
| Dashboard Overview | `sm:grid-cols-4` (`:88`) — `<640px`'te 2 kolon. OK. |
| Setup checklist | Mobile'de progress bar + next-step CTA gizli (yukarıda) — değer kaybı. |
| Sidebar | Mobile sheet — OK. |
| MonitorForm | Tek kolon zaten — OK. |
| Settings | Long scroll, mobilde daha da ağırlaşır. Section nav lazım. |

**Hayır risk:** Comparison tablo (4-5 kolon) mobilde okumayı zorlaştırıyor — accordion / responsive switch.

---

## 7. Accessibility (WCAG)

### Kontrast

- `--success-fg: 151 90% 60%` dark, `151 82% 28%` light — her ikisi de `bg-success/15` üzerine `text-success-foreground` ile **muhtemelen 4.5:1 üzeri**. status-badge bg/text doğru ayrılmış (`status-badge.tsx:6-9`).
- Dark mode `--muted-foreground: 240 5% 55%` — 4.5:1 sınırında. `text-xs text-muted-foreground` çok ince yazı için risk.
- Status page light mode `--text3:#9090b0` (`static-gen.service.ts:551`) bg `#fff` üzerinde ~3.5:1 — **WCAG AA fail** for normal text. `--text3` rolü sadece uptime label gibi tertiary text ama yine de borderline.

### Form etiketleri

- `Login.tsx`, `Register.tsx`, `MonitorForm.tsx` `<Label htmlFor="...">` + `Input id="..."` ile bağlanmış — OK.
- Tools sayfaları (SslChecker, DnsLookup, UptimeTest) inline `<label htmlFor="...">` + `<input id="...">` — OK ama shadcn değil.

### Focus states

`button.tsx:8` `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring` — OK. Landing CSS .hero-btn için `:focus-visible` yok (`Landing.css:276-296`) — klavye gezgini ring görmez. **Eksik**.

### Keyboard nav

- Dropdown, Dialog, Sheet, Tooltip — Radix tabanlı, native keyboard handling var. OK.
- Setup checklist dismiss `<span role="button" tabIndex={0}>` ile yazılmış (`setup-checklist.tsx:179-193`) — `<button>` olmalı, ya da en az Enter/Space handler ekli. Şu an Space çalışmıyor olabilir (Enter ekli).

### Aria

- Sidebar / DropdownMenu / Sheet / Dialog — radix Aria attribute'ları doğru.
- Mobile nav `<div className="nav-mobile" role="dialog" aria-label="Mobile navigation">` (`Landing.tsx:372`) — semantik. OK.

---

## 8. SEO/Meta UX

### `usePageMeta()` kapsama

| Sayfa | usePageMeta | Notu |
|---|---|---|
| Landing | ✓ | FAQ JSON-LD dahil |
| Pricing | ✓ | |
| Docs | ✓ | |
| Mcp/Heartbeat/SelfHost/Freshping | ✓ | |
| Changelog | ✓ | |
| Compare Vs* (Layout üzerinden) | ✓ | BreadcrumbList JSON-LD |
| Tools (3 sayfa) | ✓ | |
| Login / Register / ForgotPassword / ResetPassword | **✗** | Auth pages SEO'su yok — kabul edilebilir |
| Legal (Privacy, Terms) | **✗** | Eksik |
| AcceptInvite | **✗** | OK (auth) |
| Dashboard (private) | **✗** | OK (private) |

### OG image

`apps/web/index.html:25` `https://uptimecrow.com/og-image.png` referansta, ama `apps/web/public/` içinde **og-image.png yok** (sadece `logo.png logo.svg llms.txt llms-full.txt robots.txt sitemap.xml`). Twitter/og preview kırık. **P0**.

### Favicon set

`index.html:6` sadece `<link rel="icon" type="image/svg+xml" href="/logo.svg">`. Apple touch icon, 16/32/192/512 PNG fallback yok. iOS home screen'e eklendiğinde generic icon görünür.

---

## 9. Önceliklendirilmiş Aksiyon Listesi

### P0 — Bu sprint, ship-blocker

| # | Dosya:satır | Sorun | Düzeltme |
|---|---|---|---|
| 1 | `apps/web/src/pages/Landing.css` (tanım eklemek) ve 14 ref | `--accent` ve `--danger` tanımsız (Tools, Changelog, McpPage, HeartbeatPage, ...) — ikonlar/CTAlar renk göstermiyor | `Landing.css` `:root` blokuna `--accent: var(--green); --danger: var(--red);` ekle (light için de tekrar) |
| 2 | `apps/web/src/pages/Pricing.tsx:235-236` | `background: "var(--green)18"` geçersiz CSS — annual "2 months free" rozeti styling görünmüyor | `background: "color-mix(in srgb, var(--green) 18%, transparent)"` veya hazır `var(--green-dim)` |
| 3 | `apps/web/src/pages/Register.tsx:20` | "Monitor up to 3 services" — eski limit | "Monitor up to 25 services instantly" |
| 4 | `apps/web/src/pages/Landing.tsx:590` | Comparison tablosu "✓ 10 free forever" — eski (free 25'e çıktı) | "✓ 25 free forever" |
| 5 | `apps/web/public/` | `og-image.png` yok ama HTML referansı var → preview kırık | 1200x630 OG image ekle (logo + tagline) |
| 6 | `apps/web/src/components/setup-checklist.tsx:179-193` | Dismiss `<span role="button">` — `<button type="button">` olmalı, A11y | `<button>` semantik |
| 7 | `apps/web/src/pages/Landing.css:276-296` | `.hero-btn` `:focus-visible` yok — klavye gezgini focus göremiyor | `.hero-btn:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }` |

### P1 — Polish, sonraki sprint

| # | Dosya | Sorun | Çözüm |
|---|---|---|---|
| 1 | Marketing sayfaları (9 sayfada duplicated nav) | `<nav>` aynı kod 9 yerde | `MarketingLayout` componenti — `CompareLayout`/`ToolsLayout`'u jenerik kalıba çevir |
| 2 | `apps/web/src/pages/dashboard/Settings.tsx` (~673 satır) | Tek uzun scroll, section nav yok | Sol-rail veya yatay tabs (Profile / Notifications / API Keys / Team / Billing / Danger Zone) |
| 3 | `apps/web/src/pages/Pricing.tsx:256` | "Most popular" rozeti yok | Pro plan kartına üst sağ "Most popular" şerit |
| 4 | `apps/web/src/pages/Landing.tsx` (Comparison) | 5 sütun mobil tablo zor okunur | Mobil için accordion/cards (BetterStack pattern) |
| 5 | Status badges + muted text | `text-muted-foreground` `xs` boyutlu — light modda kontrast borderline | `--muted-foreground` light için biraz daha koyu (mevcut: `240 5% 38%` → `240 5% 32%`) |
| 6 | `apps/web/src/pages/dashboard/monitors/MonitorForm.tsx` | 11+ alan tek listede | "Advanced settings" accordion |
| 7 | Tools (`SslChecker/DnsLookup/UptimeTest`) | Inline-style ağırlığı, terminal kimliğinden kopuk | shadcn `Card` + `Input` + `Button` ile yeniden yaz, terminal demo gibi sonuç bloğu kullan |
| 8 | `apps/web/src/components/setup-checklist.tsx:149,166` | Mobile'de progress bar + CTA gizli | Mobil "active step" pill göster |
| 9 | `apps/web/index.html:6` | Tek favicon (svg) | `<link rel="apple-touch-icon">`, 32/192/512 PNG variants |
| 10 | `apps/web/src/pages/dashboard/Overview.tsx` | 3+ ardışık banner first-fold doldurur | Tek "Needs attention" stacked banner |

### P2 — Nice-to-have / marka cilası

| # | Konu |
|---|---|
| 1 | Compare Vs* sayfalarına rakip-temsili logo bandı / renk aksanı (her sayfaya farklı vurgu) |
| 2 | Landing logo wall: gerçek müşteri yorumu (1 paragraf testimonial) eklemek |
| 3 | Dashboard tablolarına sortable header + column visibility toggle |
| 4 | Status page: SSL/Domain expiry public rozeti |
| 5 | Setup checklist "celebrate" toast animasyonu — confetti / micro motion |
| 6 | Terminal demo etkileşimli — kullanıcı satır seçince sağda detay paneli |
| 7 | Marketing pages için "view source / GitHub" floating link — açık kaynak markasını sürekli vurgular |
| 8 | Dashboard global keyboard `?` shortcut palette (cmd+k stili) |
| 9 | Dark/light system theme auto-follow opsiyonu (şu an manuel toggle) |
| 10 | "What changed since last visit" indicator changelog'a giriş için |

---

## 10. Quick Wins Listesi (her biri ≤30 dk)

1. **`Landing.css` `:root`'a `--accent: var(--green); --danger: var(--red);` ekle** — light blokuna da. (P0 #1, 14 ref'i tek seferde kurtarır.)
2. **`Pricing.tsx:235-236` `var(--green)18` → `var(--green-dim)`**. (P0 #2)
3. **`Register.tsx:20` "3 services" → "25 services"**. (P0 #3)
4. **`Landing.tsx:590` "10 free" → "25 free"**. (P0 #4)
5. **OG image PNG ekle** — figma'da 1200x630 export → `apps/web/public/og-image.png`. (P0 #5)
6. **`setup-checklist.tsx:179-193` dismiss span → button.** Type=`button`, `onKeyDown` kaldır. (P0 #6)
7. **`Landing.css` `.hero-btn:focus-visible` outline ekle**. (P0 #7)
8. **`Pricing.tsx:256` Pro kartına "Most popular" şerit** — absolute pozitiv etiket, `featured` class'ına ek. (P1 #3)
9. **Apple touch icon link `index.html:6`'ya** — `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`. (P1 #9)
10. **`Landing.css:88-96` noise overlay light modda `.light .landing::before { display: none }`** — zaten radial-gradient kapalı, noise da kapatılmalı (`Landing.css:46-48`'de ::before kapalı ama overlay ayrı bir kural — kontrol edin).

---

*Doküman versiyon: 2026-05-19 · Statik kod denetimi · Dev server çalıştırılamadı (env kısıtı). Görsel doğrulama için `pnpm dev:web` (port 5174) + `openwolf designqc --url http://localhost:5174` çalıştırılarak ekran görüntüleri alınabilir.*
