# UptimeCrow — Master Plan 2026 Q2

**Tarih:** 2026-05-19
**Branch:** `feat/comprehensive-overhaul-2026q2`
**Önceki analizler:** `docs/competitor-analysis.md` (2026-05-12) ve `docs/PROJECT_ANALYSIS.md` (2026-04-13) — kısmen tamamlandı, sıfırdan yeniden yapılıyor.

---

## Amaç

Projeyi baştan sona inceleyip:
1. Sıfırdan rakip analizi, fiyatlandırma karşılaştırması, eksik feature haritası
2. Go-to-market stratejisi + gelecek vizyonu + farklılaşma
3. UI/UX denetimi (landing, dashboard, status page, compare, tools)
4. Teknik denetim (kod kalitesi, refactor, test coverage, observability, security)
5. Bulgulara göre paralel agentlarla uygulama

## Kapsam: Faz Yapısı

### Faz 1 — Paralel Analiz (3 agent)

| Agent | Çıktı | Süre Tahmini |
|---|---|---|
| **Market/GTM** | `docs/ASSESSMENT_2026Q2_MARKET.md` — Rakip matrisi (web-augmented), pricing analysis, GTM playbook, future vision | ~30 dk |
| **UI/UX** | `docs/ASSESSMENT_2026Q2_UIUX.md` — Heuristic audit, design QC findings, page-by-page action list | ~30 dk |
| **Teknik** | `docs/ASSESSMENT_2026Q2_TECH.md` — Code quality issues, refactor priorities, test gaps, security posture | ~30 dk |

### Faz 2 — Paralel Uygulama (4 agent)

Faz 1 çıktılarına göre tetiklenir; her agent kendi alanından çıkan P0/P1 maddelerini uygular.

| Agent | Ana Sorumluluk |
|---|---|
| **GTM-Exec** | Yeni compare sayfalar (Hyperping, OneUptime, Cronitor güncelleme), pillar/landing pages, blog yapı stub'ı, sitemap+robots güncelleme, llms-full.txt yenileme |
| **Feature-Exec** | Status page component groups, RSS/Atom feed for incidents, free tier monitor artırımı (3→7), plan limit & UI yansıtma |
| **UIUX-Exec** | Tools sayfaları görsel parity, compare sayfa polish, Changelog görsel tamamlama, mobile responsive denetimi, design token tutarlılığı |
| **Tech-Exec** | Pino structured logging (console.log temizliği), BullMQ DLQ, retention job güçlendirme, kritik path smoke test, lint/typecheck temizlik |

### Faz 3 — Konsolidasyon

Tüm agent çıktıları gözden geçirilir, `pnpm typecheck` ve `pnpm test` doğrulanır, mantıksal commit'lere bölünür, PR-ready hale getirilir.

## Kısıtlar / Notlar

- Yeni branch `feat/comprehensive-overhaul-2026q2` üzerinde çalışılıyor; uncommitted çalışma (tools/, Changelog, VsHealthchecks, VsStatusCake, slow_response_threshold migration) branch'e taşındı ve devam ettirilecek.
- Backward compatibility şart değil — schema değişiklikleri yeni migration olarak eklenebilir.
- AI/Anthropic entegrasyonu **eklemeyin** — kaldırıldı, dokümandan tamamen temizlenmeli.
- Email: AWS SES; billing: Polar. Eski Resend/LemonSqueezy referansları yeniden eklenmeyecek.

## Başarı Kriterleri

- 4 yeni doküman (master plan + 3 assessment) `docs/` altında
- En az 3 yeni compare sayfası veya pillar page
- En az 1 P0 feature uygulanmış ve test edilmiş
- `console.log` 44 → 0 (pino'ya geçiş)
- En az 1 kritik path için smoke test eklenmiş
- `pnpm typecheck` 0 hata
- Branch PR-ready, README/CHANGELOG güncel
