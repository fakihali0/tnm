# TNM AI Application Audit

_Date: 2024-XX-XX_

## Executive Summary
- The TNM AI experience centralizes a significant amount of logic in a single page component, which complicates maintainability and makes it difficult to reason about lifecycle, routing, and feature toggles. 【F:src/pages/TNMAI.tsx†L1-L320】
- Core platform features (account linking, trading journal, AI chat) lean heavily on client-side state stores without robust persistence or hydration strategies, creating risks for data integrity and offline resilience. 【F:src/store/auth.ts†L336-L520】【F:src/store/chat.ts†L32-L126】
- Several integrations (offline queue, service worker, Supabase edge functions) require hardening to avoid data loss, security regressions, and cache thrash in production environments. 【F:src/utils/offline-queue.ts†L57-L173】【F:public/sw.js†L4-L160】【F:src/components/tnm-pro/AccountLinkForm.tsx†L33-L70】

## Architecture & State Management
- `TNMAI.tsx` imports a broad set of desktop and mobile modules, performs routing, orchestrates translations, and owns async data fetching. This violates separation of concerns and makes testing individual surfaces difficult. Break this file into layout, routing, and data loader layers. 【F:src/pages/TNMAI.tsx†L1-L320】
- Zustand stores expose `getState()` globally and even attach references to `window`, which introduces hidden dependencies between modules. Refactor stores to expose explicit actions/selectors and remove global mutation. 【F:src/store/auth.ts†L200-L318】【F:src/store/auth.ts†L500-L560】
- Chat persistence serializes `Date` instances and rehydrates them as plain strings, which can break UI logic relying on `Date` methods. Replace `Date` with ISO strings in the store and convert at the view layer. 【F:src/store/chat.ts†L4-L126】

## Data & Security
- The account link form collects investor passwords and sends them directly to Supabase edge functions without redaction, logging suppression, or transport hardening. Add client-side masking, minimize console logging, and ensure the server encrypts credentials at rest. 【F:src/components/tnm-pro/AccountLinkForm.tsx†L33-L70】【F:src/store/auth.ts†L388-L424】
- Trading journal helpers still rely on placeholder analytics (e.g., hard-coded best/worst day), which undermines user trust. Replace mocks with calculations derived from trade history or surface explicit "data unavailable" states. 【F:src/hooks/useTradingDashboard.ts†L58-L102】

## PWA, Offline & Performance
- The offline queue serializes `FormData` to JSON and registers background sync listeners but never removes window event handlers, leading to duplicate registrations over time. Add teardown logic and reconcile queued payloads before submission. 【F:src/utils/offline-queue.ts†L57-L173】
- Service worker activation deletes the newly created `v3` caches because the allowlist only keeps `v2` names. Update the retention list to include current versions and consider using a shared prefix check to avoid future regressions. 【F:public/sw.js†L4-L80】
- `LinkedAccountsList` renders templated variables inside a string literal, so users see `{account.platform}` instead of real values. Use JSX interpolation or template literals to correct the confirmation message. 【F:src/components/tnm-pro/LinkedAccountsList.tsx†L88-L104】

## AI & Notifications Experience
- The AI chat assistant proxies every prompt to Supabase functions with full conversation history, yet there is no rate limiting or optimistic UI rollback when the edge call fails. Introduce retry/backoff policies and surface clearer error messages. 【F:src/components/tnm-pro/AIChatAssistant.tsx†L146-L205】
- Notification hooks maintain in-memory state only, so alerts disappear on refresh and cannot sync across devices. Consider persisting critical alerts (risk/system) in Supabase and exposing history in the UI. 【F:src/hooks/useNotifications.ts†L21-L88】

## Testing & Quality
- Only three automated tests exist (payments data, auth redirects, i18n bootstrap), leaving core TNM AI workflows unverified. Expand coverage for account linking, journal analytics, and AI chat fallbacks. 【4bf80b†L1-L4】
- Many TNM-specific components are imported but unused (`ReportGenerator`, `OfflineManager`, `PortfolioHeatmap`), signalling dead code. Remove them or re-introduce the surfaces to keep bundle size manageable. 【F:src/pages/TNMAI.tsx†L1-L40】

## Recommendations & Next Steps
1. **Modularize TNM AI page** – Extract layout, routing, and data-fetch hooks so each concern can be reasoned about independently and lazily loaded where appropriate. 【F:src/pages/TNMAI.tsx†L1-L320】
2. **Harden Supabase flows** – Strip sensitive logs, validate payloads before dispatch, and centralize error handling for account and journal mutations to improve reliability. 【F:src/store/auth.ts†L336-L467】【F:src/components/tnm-pro/AccountLinkForm.tsx†L33-L104】
3. **Repair offline tooling** – Update the service worker cache allowlist, add IndexedDB cleanup routines, and provide a user-facing sync status so traders know when data is safe. 【F:public/sw.js†L4-L160】【F:src/utils/offline-queue.ts†L57-L173】
4. **Close UX gaps** – Fix templating bugs, replace placeholder analytics, and ensure AI/chat modules gracefully degrade when backend services are unavailable. 【F:src/components/tnm-pro/LinkedAccountsList.tsx†L88-L104】【F:src/hooks/useTradingDashboard.ts†L58-L102】【F:src/components/tnm-pro/AIChatAssistant.tsx†L146-L205】
5. **Invest in automated coverage** – Add integration tests around account lifecycle, risk alerts, and AI chat to prevent regressions as the platform evolves. 【4bf80b†L1-L4】
