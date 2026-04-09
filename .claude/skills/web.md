# HookSense Web (Frontend) Skill

> Rules and patterns for the React 19 + Vite 7 + Tailwind CSS v4 frontend.
> This is a paid SaaS — UX quality directly impacts revenue and churn.

---

## When to Apply This Skill

Apply when touching files in `web/src/`:
- `pages/` — Page components
- `components/` — Reusable UI components
- `contexts/` — Auth, Theme, FeatureFlags
- `hooks/` — useWebSocket, useAuth, useNotification, useKeyboardShortcuts, usePageMeta
- `lib/` — API client, analytics
- `main.tsx` — Routing and app structure
- `index.css` — Theme and design tokens

---

## 1. Routing Rules

### Framework: React Router v7 with `<BrowserRouter>`

- All routes defined in `web/src/main.tsx`.
- **Code splitting:** Every route except Home must use `React.lazy()`.
- **Route protection:** No global guard — each page checks `useAuth()` and redirects to `/login?redirect=<path>`.
- **Feature gating:** Use `<FeatureRoute flag="x">` wrapper for flag-dependent routes.

### Adding New Routes
```typescript
// 1. Lazy import
const NewPage = lazy(() => import("./pages/NewPage"));

// 2. Add route inside <Routes>
<Route path="/new-page" element={<Suspense fallback={null}><NewPage /></Suspense>} />

// 3. If feature-gated:
<Route path="/new-feature" element={<FeatureRoute flag="new_feature"><Suspense fallback={null}><NewFeaturePage /></Suspense></FeatureRoute>} />
```

### Route Protection Patterns
```typescript
// Protected page — redirect unauthenticated users
const { user, isLoading } = useAuth();
if (isLoading) return null;
if (!user) { navigate("/login?redirect=/account"); return null; }

// Admin page — check isAdmin
if (!user?.isAdmin) return <div>Unauthorized</div>;

// Plan-gated — check plan
if (user.plan === "free") return <UpgradeBanner />;
```

---

## 2. State Management

### Context API Only — No External Libraries

| Context | Purpose | Provider Location |
|---------|---------|-------------------|
| AuthContext | User session, login/logout/signup | `main.tsx` |
| ThemeContext | Dark/light mode | `main.tsx` |
| FeatureFlagContext | Feature toggles | `main.tsx` |

### Rules
- **Never** add Redux, Zustand, Recoil, or other state libraries.
- Per-page data fetched with local `useState` + `useEffect`. No global data cache.
- WebSocket data consumed per-component via `useWebSocket()` hook.
- If state needs to be shared across siblings, lift it to the nearest common parent.

### Auth State
```typescript
const { user, isLoading, login, signup, logout, refetchUser } = useAuth();
// user: User | null
// isLoading: true during initial /auth/me fetch
```

- Session via httpOnly cookies. Frontend never sees the JWT.
- On 401 from API: redirect to login, clear local state.
- After login/signup: check `localStorage.getItem("hs_ep")` for pending endpoint claim.

---

## 3. API Communication

### Single Client: `web/src/lib/api.ts`

- **Transport:** Native `fetch()` with `credentials: "include"`.
- **Base URL:** Empty string (relative). Vite proxy in dev, same-origin in prod.
- **Error handling:** `handleResponse<T>()` extracts `data.error` or uses fallback message.

### Rules
- **Never** add axios, react-query, SWR, or other HTTP libraries.
- All API calls go through `apiFetch()` wrapper.
- New API methods: add to `api.ts`, export typed function, follow existing pattern.
- Error messages from API: display to user via component state, never render raw error objects.
- Never construct API URLs from user input without validation.

### Adding a New API Call
```typescript
export async function doSomething(id: string, data: SomeInput): Promise<SomeOutput> {
  const res = await apiFetch(`/api/something/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to do something");
}
```

---

## 4. UI Components & Styling

### Design System
- **CSS Framework:** Tailwind CSS v4 via `@tailwindcss/vite` plugin.
- **Theme:** Custom tokens in `web/src/index.css` via `@theme` directive.
- **Primary color:** `#00B892` (teal/green accent).
- **Dark mode:** `.dark` class on `<html>`, toggled via ThemeContext.
- **Component variants:** CVA (class-variance-authority).
- **Class merging:** `cn()` utility (clsx + tailwind-merge).

### Component Libraries
- **Radix UI:** Dialog, Tabs, Slot (headless, unstyled).
- **Lucide React:** Icons (tree-shakeable).
- **Never** add Material UI, Chakra, Ant Design, or other styled component libraries.

### Rules
- Components go in `web/src/components/`.
- Pages go in `web/src/pages/`.
- Use `cn()` for conditional classes, never string concatenation.
- No inline styles. Use Tailwind classes.
- Dark mode: always include dark variant when using bg/text/border colors.
- No emojis in UI unless explicitly requested.

### Color Usage
```
Background:     bg-[var(--bg-primary)] / dark:bg-[#0f1012]
Card:           bg-[var(--bg-secondary)] / dark:bg-[#141414]
Text:           text-[var(--text-primary)]
Border:         border-[var(--border-color)]
Accent:         text-[#00B892] / bg-[#00B892]
```

---

## 5. Hooks

### Custom Hooks in `web/src/hooks/`

| Hook | Purpose | Key Details |
|------|---------|-------------|
| `useAuth()` | Auth state + methods | Returns `{ user, isLoading, login, signup, logout, refetchUser }` |
| `useWebSocket(slug, onMessage)` | Real-time webhook stream | Auto-reconnects after 2s. Ref-based callback. |
| `useNotification()` | Desktop notifications | Returns `{ permission, enabled, notify, requestPermission }` |
| `useKeyboardShortcuts()` | Endpoint page navigation | j/k=nav, c=copy, r=replay, ?=help |
| `usePageMeta(title, desc, image, canonical)` | SEO meta tags | Sets document.title, og:*, description |

### Rules
- Every page must call `usePageMeta()` with appropriate title and description.
- WebSocket hook: only use on endpoint inspector page.
- Keyboard shortcuts: only on pages where they make sense.

---

## 6. Analytics

### Provider: Umami (Privacy-Focused)

```typescript
// web/src/lib/analytics.ts
window.umami?.track(event, data); // Never throws
```

### Rules
- Track meaningful user actions: endpoint creation, auth events, pricing interactions, feature usage.
- Never track PII (email, IP, webhook content).
- Wrap in try-catch or `?.` — analytics must never break the app.
- Event naming: `snake_case` (e.g., `endpoint_created`, `login_success`, `plan_selected`).

---

## 7. Performance

### Current Optimizations
- **Code splitting:** `React.lazy()` for all routes except Home.
- **Prerendering:** 40+ marketing pages via Puppeteer at build time.
- **Asset caching:** Hashed assets immutable (1 year), static assets 30 days.
- **Feature flags:** Injected via `window.__FLAGS__` (no API call needed).

### Rules
- New routes: always lazy-load.
- Images: use WebP/AVIF when possible. Include width/height to prevent CLS.
- No heavy dependencies. Current bundle is minimal — keep it that way.
- No `useEffect` with missing dependencies or infinite loops.
- Cleanup intervals/subscriptions in useEffect return function.

---

## 8. SEO & Prerendering

### Prerender Script: `web/scripts/prerender.mjs`

- Marketing/static pages are pre-rendered with Puppeteer.
- Dynamic pages (endpoint inspector, account) are NOT pre-rendered.

### Adding a New Prerendered Page
1. Create the page component in `web/src/pages/`.
2. Add route in `main.tsx`.
3. Add the path to the `routes` array in `web/scripts/prerender.mjs`.
4. Call `usePageMeta()` with title, description, and canonical URL.

### SEO Checklist
- [ ] `usePageMeta()` called with unique title and description
- [ ] Canonical URL set for pages accessible via multiple paths
- [ ] Page added to prerender script if it's a marketing/static page
- [ ] No JavaScript-only content for SEO-critical pages (use prerendering)

---

## 9. i18n

### Current: react-i18next + i18next

- Namespaces: common, nav, auth, pricing, home, landing
- Locale files: `web/src/locales/{en,tr}/*.json`
- URL strategy: path prefix (`/tr/pricing`), EN is default (no prefix)
- Helpers: `useLocalePath()` hook, `LanguageSwitcher` component

### Rules
- All user-facing text must use translation keys, not hardcoded strings.
- New strings: add to appropriate namespace JSON files for both `en` and `tr`.
- Date/number formatting: use i18next formatting, not raw `toLocaleDateString()`.

---

## 10. Testing

### Setup: Vitest + React Testing Library

- Config: `web/vitest.config.ts` with jsdom environment
- Test files: `web/src/__tests__/**/*.test.tsx`

### Rules
- Test user behavior, not implementation details.
- Use `screen.getByText()`, `screen.getByRole()` — avoid `getByTestId` unless necessary.
- Mock API calls, not internal state.
- No snapshot tests.

---

## 11. Error Handling

### ErrorBoundary
- Wraps the entire app in `main.tsx`.
- Catches unhandled React errors.
- Shows user-friendly error page with reload button.
- Tracks via Umami analytics.

### API Error Pattern
```typescript
try {
  const data = await someApiCall();
  // handle success
} catch (err) {
  setError(err instanceof Error ? err.message : "Something went wrong");
}
```

- Never show raw error objects to users.
- Never show stack traces.
- Show actionable messages: "Failed to load endpoints. Please try again."
