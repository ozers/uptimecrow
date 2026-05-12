# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-12

## User Preferences

- User asks for comprehensive audits before committing — "uygula ama commit etme" means apply but don't commit yet

## Key Learnings

- **Project:** uptimecrow
- **Description:** Developer-first uptime monitoring and status page platform. Monitor your services, notify subscribers on incidents, and serve pre-rendered status pages that stay online even when your origin goes down
- **Compare page routes:** `/vs/betterstack` and `/vs/uptimerobot` (NOT `/compare/...`) — defined in App.tsx
- **Dev server:** Docker is not available in this environment; use `pnpm dev:web` which starts on port 5174 (5173 is taken by HookSense, another project)
- **Shared package:** Must build `@uptimecrow/shared` with `pnpm --filter @uptimecrow/shared build` before running `pnpm dev:web`, otherwise Vite fails to resolve the package
- **Billing:** Self-serve billing is paused; upgrade requests go to support@uptimecrow.com (email manually). Polar is the billing provider when re-enabled
- **Brand:** All public-facing support email must be `support@uptimecrow.com` — old references to `support@hooksense.com` were scattered across Pricing.tsx, Settings.tsx, Legal.tsx, CompareLayout.tsx

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

[2026-05-12] Used `/compare/betterstack` as link target — correct routes are `/vs/betterstack` and `/vs/uptimerobot` per App.tsx router definition.

[2026-05-12] Tried `openwolf designqc` without `--url` when port 5173 was running a different project (HookSense). Always check which app is at which port; UptimeCrow dev runs on 5174 here.

## Decision Log

[2026-05-12] Added social proof strip between terminal demo and "How it works" section using flex layout with nowrap + dividers. Used honest feature claims (30s checks, auto incidents, free forever) rather than fake user counts.

[2026-05-12] Redesigned footer from minimal single-row to structured 3-column layout (Product, Compare, Legal) matching modern SaaS landing page conventions.
