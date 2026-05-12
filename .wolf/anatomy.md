# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-05-12T14:02:16.857Z
> Files: 223 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.dockerignore` — Docker ignore rules (~19 tok)
- `.DS_Store` (~1639 tok)
- `.gitignore` — Git ignore rules (~31 tok)
- `CLAUDE.md` — OpenWolf (~1459 tok)
- `docker-compose.yml` — Docker Compose services (~601 tok)
- `Dockerfile` — Docker container definition (~370 tok)
- `package.json` — Node.js package manifest (~173 tok)
- `pnpm-lock.yaml` — pnpm lock file (~63271 tok)
- `pnpm-workspace.yaml` (~12 tok)
- `README.md` — Project documentation (~3127 tok)
- `tsconfig.base.json` (~106 tok)

## .claude/

- `.DS_Store` (~1639 tok)
- `settings.json` (~504 tok)
- `settings.local.json` (~245 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .claude/skills/

- `api.md` — HookSense API (Backend) Skill (~2964 tok)
- `security.md` — HookSense Security Skill (~4512 tok)
- `web.md` — HookSense Web (Frontend) Skill (~2302 tok)

## .claude/skills/ui-ux-pro-max/

- `SKILL.md` — UI/UX Pro Max - Design Intelligence (~3521 tok)

## .claude/skills/ui-ux-pro-max/data/

- `charts.csv` (~2013 tok)
- `colors.csv` (~2591 tok)
- `icons.csv` (~3570 tok)
- `landing.csv` (~3837 tok)
- `products.csv` (~7944 tok)
- `react-performance.csv` — Exports getUser (~3953 tok)
- `styles.csv` — Declares hierarchy (~25313 tok)
- `typography.csv` (~8501 tok)
- `ui-reasoning.csv` (~8286 tok)
- `ux-guidelines.csv` (~5005 tok)
- `web-interface.csv` — Declares email (~1993 tok)

## .claude/skills/ui-ux-pro-max/data/stacks/

- `astro.csv` — Exports prerender (~3165 tok)
- `flutter.csv` — Declares MyWidget (~2792 tok)
- `html-tailwind.csv` — /*.{js,ts,jsx,tsx}']",purge: [...],High,https://tailwindcss.com/docs/content-configuration (~3030 tok)
- `jetpack-compose.csv` — Declares Route (~2185 tok)
- `nextjs.csv` — Exports Page (~3346 tok)
- `nuxt-ui.csv` — Declares overlay (~3736 tok)
- `nuxtjs.csv` — in: submit, submit (~4411 tok)
- `react-native.csv` — Declares App (~2676 tok)
- `react.csv` — total: User, User, Button + 3 more (~3471 tok)
- `shadcn.csv` — Declares styles (~4246 tok)
- `svelte.csv` — Exports load (~2951 tok)
- `swiftui.csv` — Declares MyView (~2900 tok)
- `vue.csv` — Exports useFetch (~2949 tok)

## .claude/skills/ui-ux-pro-max/scripts/

- `core.py` — -*- coding: utf-8 -*- (~2922 tok)
- `design_system.py` — -*- coding: utf-8 -*- (~12449 tok)
- `search.py` — -*- coding: utf-8 -*- (~1563 tok)

## .github/workflows/

- `ci.yml` — CI: CI (~633 tok)
- `deploy.yml` — CI: Deploy (~338 tok)

## apps/

- `.DS_Store` (~1639 tok)

## apps/api/

- `Dockerfile` — Docker container definition (~371 tok)
- `drizzle.config.ts` — Drizzle ORM configuration (~82 tok)
- `package.json` — Node.js package manifest (~320 tok)
- `railway.toml` (~85 tok)
- `tsconfig.json` — TypeScript configuration (~41 tok)
- `vitest.config.ts` — Vitest test configuration (~148 tok)

## apps/api/drizzle/

- `0000_magical_excalibur.sql` — SQL: tables: check_results, incident_updates, incidents, monitors, 9 alter(s) (~2188 tok)
- `0001_natural_calypso.sql` — SQL: tables: status_page_monitors, 2 alter(s) (~296 tok)
- `0002_skinny_wiccan.sql` — SQL: 2 alter(s) (~50 tok)
- `0003_furry_logan.sql` — SQL: 1 alter(s) (~17 tok)
- `0004_add_status_page_access_token.sql` (~27 tok)
- `0005_add_access_token_if_not_exists.sql` — SQL: 1 alter(s) (~29 tok)
- `0006_add_access_token_retry.sql` — SQL: 1 alter(s) (~29 tok)
- `0007_overconfident_jean_grey.sql` — SQL: tables: maintenance_window_monitors, maintenance_windows (~772 tok)
- `0008_puzzling_sharon_ventura.sql` — SQL: tables: api_keys, 2 alter(s) (~312 tok)
- `0009_heartbeats_indie_plan.sql` — Add indie plan to plan enum (~266 tok)
- `0010_ssl_monitoring.sql` (~42 tok)
- `0011_custom_webhook.sql` (~20 tok)

## apps/api/drizzle/meta/

- `_journal.json` (~525 tok)
- `0000_snapshot.json` (~6570 tok)
- `0001_snapshot.json` (~7271 tok)
- `0002_snapshot.json` (~7372 tok)
- `0003_snapshot.json` (~7416 tok)
- `0007_snapshot.json` (~9459 tok)
- `0008_snapshot.json` (~10338 tok)

## apps/api/src/

- `index.ts` — mode: assertProductionSecrets, main (~309 tok)
- `server.ts` — API routes: GET (3 endpoints) (~1178 tok)
- `worker.ts` — Exports startWorker (~1323 tok)

## apps/api/src/db/

- `index.ts` — Exports db, redis (~175 tok)
- `migrate.ts` — Declares databaseUrl (~611 tok)
- `schema.ts` — Exports planEnum, monitorTypeEnum, monitorStatusEnum, checkStatusEnum + 17 more (~3155 tok)

## apps/api/src/docs/

- `openapi.ts` — OpenAPI 3.1 spec for the public, key-authenticated API surface. (~3774 tok)

## apps/api/src/jobs/

- `check.job.ts` — Check Job — Monitor ping execution + incident creation + notifications (~2856 tok)
- `generate.job.ts` — Generate Job — Status page regeneration (~113 tok)
- `heartbeat-check.job.ts` — Exports processHeartbeatCheckJob (~780 tok)
- `notify.job.ts` — Notify Job — Email notification queue handler (~1212 tok)
- `retention.job.test.ts` — Declares cutoffs (~531 tok)
- `retention.job.ts` — Exports RetentionCutoff, computeCutoffs, RetentionResult, pruneOldCheckResults, processRetentionJob (~524 tok)

## apps/api/src/middleware/

- `auth.ts` — Exports authMiddleware (~588 tok)
- `custom-domain.test.ts` (~618 tok)
- `custom-domain.ts` — Primary hostnames we never treat as a custom domain. We derive them from (~1100 tok)
- `rate-limit.ts` — Exports authRateLimit, apiRateLimit, publicRateLimit (~460 tok)
- `security.ts` — Security headers applied globally. Kept deliberately conservative so the (~387 tok)

## apps/api/src/routes/

- `analytics.ts` — API routes: GET (2 endpoints) (~1011 tok)
- `api-keys.ts` — API routes: GET, POST, DELETE (7 endpoints) (~962 tok)
- `auth.ts` — API routes: POST, GET (8 endpoints) (~1816 tok)
- `billing.ts` — API routes: POST, GET (6 endpoints) (~1526 tok)
- `docs.ts` — API routes: GET (2 endpoints) (~440 tok)
- `heartbeats.ts` — API routes: GET, POST, PATCH, DELETE (8 endpoints) (~872 tok)
- `incidents.ts` — API routes: GET, POST, PATCH (10 endpoints) (~1175 tok)
- `maintenance.ts` — API routes: GET, POST, PATCH, DELETE (8 endpoints) (~1557 tok)
- `monitors.ts` — API routes: GET, POST, PATCH, DELETE (13 endpoints) (~2013 tok)
- `public.ts` — API routes: GET, POST (4 endpoints) (~5777 tok)
- `settings.ts` — API routes: GET, PATCH, POST (6 endpoints) (~998 tok)
- `status-pages.ts` — API routes: GET, POST, PATCH, DELETE, PUT (16 endpoints) (~1962 tok)
- `subscribers.ts` — API routes: GET, DELETE (4 endpoints) (~552 tok)

## apps/api/src/services/

- `monitor.service.test.ts` — mockFetch: respond (~2246 tok)
- `monitor.service.ts` — Monitor Service — HTTP/TCP check execution with multi-region + keyword support (~3142 tok)
- `notification.service.ts` — Notification Service — Email via Amazon SES + Slack/Discord webhooks (~3235 tok)
- `static-gen.render.test.ts` — StaticStatusPage: baseData (~1237 tok)
- `static-gen.service.ts` — Static Generation Service — Pre-render status pages as JSON + HTML (~7625 tok)

## apps/api/src/utils/

- `api-key.test.ts` — Declares a (~455 tok)
- `api-key.ts` — Exports API_KEY_PREFIX, API_KEY_DISPLAY_PREFIX_LENGTH, generateApiKey, hashApiKey, looksLikeApiKey (~256 tok)
- `auth.ts` — Exports JwtPayload, createToken, verifyToken (~216 tok)
- `escape.test.ts` (~1215 tok)
- `escape.ts` — HTML/attribute/URL/CSS escaping for user-controlled values rendered into (~736 tok)
- `logger.ts` — Exports logger (~197 tok)
- `markdown.test.ts` — Declares out (~763 tok)
- `markdown.ts` — Tiny, safe-by-construction markdown renderer for incident bodies. Escapes (~859 tok)
- `queues.test.ts` (~309 tok)
- `queues.ts` — Shared retry/backoff policy for one-shot jobs. Repeatable jobs (monitor (~362 tok)
- `state-machine.test.ts` (~713 tok)
- `state-machine.ts` — API routes: GET (1 endpoints) (~195 tok)
- `state-transition.ts` — Exports StateTransition, evaluateTransition (~144 tok)

## apps/web/

- `components.json` (~114 tok)
- `Dockerfile` — Docker container definition (~333 tok)
- `index.html` — UptimeCrow — Uptime Monitoring &amp; Status Pages for Developers (~661 tok)
- `nginx.conf` — Nginx configuration (~331 tok)
- `package.json` — Node.js package manifest (~448 tok)
- `postcss.config.js` — PostCSS configuration (~24 tok)
- `railway.toml` (~54 tok)
- `tailwind.config.ts` — Tailwind CSS configuration (~606 tok)
- `tsconfig.json` — TypeScript configuration (~60 tok)
- `vite.config.ts` — Vite build configuration (~193 tok)

## apps/web/public/

- `robots.txt` (~60 tok)
- `sitemap.xml` (~254 tok)

## apps/web/src/

- `App.tsx` — App (~1156 tok)
- `globals.css` — Styles: 6 rules, 39 vars, 1 media queries, 2 layers (~731 tok)
- `main.tsx` — queryClient (~244 tok)

## apps/web/src/components/

- `api-keys-section.tsx` — SectionLabel — renders modal — uses useState (~2108 tok)
- `confirm-dialog.tsx` — ConfirmDialog (~358 tok)
- `empty-state.tsx` — EmptyState (~187 tok)
- `loading-page.tsx` — LoadingPage (~65 tok)
- `logo.tsx` — sizes (~377 tok)
- `page-header.tsx` — PageHeader (~152 tok)
- `protected-route.tsx` — ProtectedRoute — uses useEffect (~179 tok)
- `public-route.tsx` — PublicRoute — uses useEffect (~190 tok)
- `relative-time.tsx` — RelativeTime (~217 tok)
- `response-chart.tsx` — ResponseChart — renders chart (~453 tok)
- `severity-badge.tsx` — severityConfig (~222 tok)
- `status-badge.tsx` — monitorStatusConfig (~474 tok)

## apps/web/src/components/layout/

- `dashboard-layout.tsx` — DashboardLayout — uses useState (~293 tok)
- `header.tsx` — ROUTE_LABELS — uses useNavigate (~1348 tok)
- `sidebar.tsx` — navItems (~1227 tok)

## apps/web/src/components/ui/

- `alert-dialog.tsx` — AlertDialog (~1263 tok)
- `avatar.tsx` — Avatar (~406 tok)
- `badge.tsx` — badgeVariants (~326 tok)
- `button.tsx` — buttonVariants (~544 tok)
- `card.tsx` — Card (~528 tok)
- `dialog.tsx` — Dialog — renders modal (~1100 tok)
- `dropdown-menu.tsx` — DropdownMenu (~2170 tok)
- `input.tsx` — Input (~220 tok)
- `label.tsx` — labelVariants (~203 tok)
- `popover.tsx` — Popover (~384 tok)
- `select.tsx` — Select (~1638 tok)
- `separator.tsx` — Separator (~220 tok)
- `sheet.tsx` — Sheet (~1219 tok)
- `skeleton.tsx` — Skeleton (~76 tok)
- `table.tsx` — Table — renders table (~832 tok)
- `tabs.tsx` — Tabs (~537 tok)
- `textarea.tsx` — Textarea (~186 tok)
- `tooltip.tsx` — TooltipProvider (~362 tok)

## apps/web/src/lib/

- `api.ts` — Exports ApiError, api (~329 tok)
- `auth.ts` — API routes: POST (1 endpoints) (~440 tok)
- `theme.tsx` — STORAGE_KEY — uses useEffect, useContext (~601 tok)
- `utils.ts` — Exports cn, normalizeUrl (~106 tok)

## apps/web/src/lib/queries/

- `analytics.ts` — Exports useUptime (~236 tok)
- `api-keys.ts` — Exports ApiKeyRow, useApiKeys, useCreateApiKey, useRevokeApiKey (~285 tok)
- `heartbeats.ts` — API routes: DELETE (1 endpoints) (~348 tok)
- `incidents.ts` — Exports useIncidents, useIncident, useCreateIncident, useUpdateIncident, useCreateIncidentUpdate (~489 tok)
- `maintenance.ts` — Exports useMaintenanceWindows, useCreateMaintenanceWindow, useUpdateMaintenanceWindow, useDeleteMaintenanceWindow (~441 tok)
- `monitors.ts` — API routes: DELETE (1 endpoints) (~512 tok)
- `status-pages.ts` — API routes: DELETE (1 endpoints) (~650 tok)
- `subscribers.ts` — API routes: DELETE (1 endpoints) (~216 tok)

## apps/web/src/pages/

- `ForgotPassword.tsx` — ForgotPassword — renders form — uses useState (~742 tok)
- `Landing.css` — Styles: 95 rules, 15 vars (~4769 tok)
- `Landing.tsx` — BRAND — renders table (~5250 tok)
- `Legal.tsx` — LegalShell (~2006 tok)
- `Login.tsx` — Login — renders form (~1668 tok)
- `Pricing.tsx` — BRAND (~2746 tok)
- `Register.tsx` — PERKS — renders form — uses useNavigate, useState (~1472 tok)
- `ResetPassword.tsx` — ResetPassword — renders form — uses useSearchParams, useNavigate, useState (~961 tok)

## apps/web/src/pages/compare/

- `CompareLayout.tsx` — BRAND — renders table (~2070 tok)
- `VsBetterStack.tsx` — VsBetterStack (~1207 tok)
- `VsUptimeRobot.tsx` — VsUptimeRobot (~1245 tok)

## apps/web/src/pages/dashboard/

- `Overview.tsx` — OverviewSkeleton (~5843 tok)
- `Settings.tsx` — SectionLabel (~3474 tok)

## apps/web/src/pages/dashboard/heartbeats/

- `HeartbeatsList.tsx` — STATUS_COLORS — renders modal (~3199 tok)

## apps/web/src/pages/dashboard/incidents/

- `IncidentCreate.tsx` — incidentResolver — renders form — uses useNavigate (~1663 tok)
- `IncidentDetail.tsx` — IncidentDetailSkeleton — renders form (~2252 tok)
- `IncidentsList.tsx` — IncidentsListSkeleton — renders table (~2013 tok)

## apps/web/src/pages/dashboard/maintenance/

- `MaintenanceList.tsx` — toLocalInputValue — renders form, modal — uses useState, useMemo (~3721 tok)

## apps/web/src/pages/dashboard/monitors/

- `MonitorCreate.tsx` — MonitorCreate — uses useNavigate (~326 tok)
- `MonitorDetail.tsx` — MonitorDetailSkeleton — renders table (~5071 tok)
- `MonitorEdit.tsx` — MonitorEdit — uses useNavigate (~462 tok)
- `MonitorForm.tsx` — monitorResolver — renders form — uses useState (~3203 tok)
- `MonitorsList.tsx` — UptimeBar — renders table (~2704 tok)

## apps/web/src/pages/dashboard/status-pages/

- `StatusPageCreate.tsx` — toSlug — renders form — uses useNavigate, useState, useEffect (~3407 tok)
- `StatusPageDetail.tsx` — StatusPageDetailSkeleton — renders table (~3691 tok)
- `StatusPageEdit.tsx` — StatusPageEdit — uses useNavigate (~442 tok)
- `StatusPageForm.tsx` — statusPageResolver — renders form — uses useEffect (~1341 tok)
- `StatusPagesList.tsx` — StatusPagesListSkeleton — renders table (~2142 tok)

## docs/

- `ai-status-page-landing.html` — [YourBrand] — AI-Native Status Page for Modern Teams (~6200 tok)
- `before-after.html` — UptimeCrow — Before / After Pre-Launch Report (~7359 tok)
- `degerlendirme-v3.html` — ShipGateway — BUILD & MAYBE Fikirler (~4939 tok)
- `lovable-prompt.md` — AI-Native Status Page — Landing Page (~1412 tok)
- `pricing-analysis.html` — UptimeCrow — Pricing & Competitive Analysis 2026 (~16214 tok)
- `PROJECT_ANALYSIS.md` — UptimeCrow — Kapsamlı Proje Analizi ve Launch Yol Haritası (~4450 tok)

## packages/shared/

- `package.json` — Node.js package manifest (~102 tok)
- `tsconfig.json` — TypeScript configuration (~34 tok)

## packages/shared/src/

- `constants.ts` — Exports PLANS, Plan, MONITOR_TYPES, MonitorType + 14 more (~590 tok)
- `index.ts` (~27 tok)
- `types.ts` — Exports User, Organization, Monitor, CheckResult + 7 more (~701 tok)
- `validation.ts` — Zod schemas: createMonitorSchema, createIncidentSchema, updateIncidentSchema, createIncidentUpdateSc (~1042 tok)
