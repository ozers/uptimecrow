# OZE-93 — UX/UI audit (code-based heuristic pass)

**Status:** This is a code-level heuristic review, not the visual pass. A proper
audit still needs `openwolf designqc` screenshots of the running app (dev server
on :5174) — especially for spacing, contrast, and the public status-page render.
Findings below are derived from reading the components; verify visually before
acting.

Scope reviewed: dashboard pages, marketing/landing, public status page render,
onboarding, and the design-system usage.

## Strengths (keep)

- Consistent skeleton loaders on data pages.
- `ConfirmDialog` now used for destructive actions (after OZE-83); `Select`
  standardized on OnCall.
- Live status affordances (pulsing dot on down monitors), response-time bars,
  relative+absolute timestamps via a shared component.
- Pre-rendered status page has a polished custom template (dark/light, uptime
  bars, incident timeline, subscribe form).

## Findings (prioritized)

### P0 — fix before launch (first impression / trust)
- **Empty/error states audit.** Confirm every dashboard list (incidents,
  heartbeats, maintenance, status pages, oncall) has a friendly empty state and
  a visible error state (not a silent blank) when its query fails. Overview and
  Monitors have good empty states; verify the rest.
- **Mobile pass on the public status page** — it's the most-shared surface.
  Check uptime bars, incident timeline, and the subscribe form at 360px.
- **Landing above-the-fold on mobile** — hero, badge, and the dashboard-preview
  mockup tend to overflow; verify at 360–414px.

### P1 — polish (conversion)
- **MonitorForm number inputs** (interval/timeout/confirmation/thresholds) are
  raw `<input type="number">` with no min/max/step hints or inline validation;
  add bounds + helper text so users don't enter sub-plan-limit intervals and hit
  a 403 only on submit.
- **Status page: no preview before publish.** Add a "View live" / preview from
  the editor so users see branding before sharing.
- **Focus-visible states** — confirm keyboard focus rings are visible on buttons,
  inputs, and the custom toggle (annual billing switch uses a bare `<button>`).
- **Contrast** — `text-muted-foreground` on `bg-muted/20` (used in OnCall rotation
  bar, several cards) is borderline; check against WCAG AA (4.5:1).

### P2 — nice to have
- **Bulk actions** (delete multiple monitors/subscribers).
- **Maintenance window editing** (currently delete-only; OZE-83 carryover).
- **Touch targets** — some icon-only ghost buttons (`h-8 w-8`) are 32px; AA
  recommends 44px on touch. Bump on mobile.
- **Toast consistency** — verify success/error copy is consistent tense/voice.

## Accessibility quick wins (do alongside P1)
- Add `aria-label` to all icon-only buttons (delete/edit pencils) — several were
  missing; OZE-83 added a couple.
- Ensure form inputs have associated `<Label htmlFor>` everywhere (OnCall/Settings
  are good; spot-check MonitorForm and StatusPageForm).
- Status-page color contrast: brand-color text on brand-color backgrounds is
  user-controlled — the renderer should enforce a minimum contrast or pick a
  readable foreground automatically.

## Next step
Run `openwolf designqc` against the dev server, capture `.wolf/designqc-captures/`,
and convert confirmed visual issues into follow-up FE issues under M3/M-UX.
