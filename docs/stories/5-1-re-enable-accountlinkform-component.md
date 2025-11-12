# Story 5.1: Re-enable AccountLinkForm Component

Status: ready-for-dev

## Story

As a **frontend developer**,
I want **the AccountLinkForm component re-enabled and connected to the Supabase connect edge function**,
so that **users can add MT5 accounts through the TNM Pro UI once the new backend flow is live**. [Source: docs/epics.md#Story-5.1]

## Acceptance Criteria

1. `/tnm_concept/src/components/tnm-pro/AccountLinkForm.tsx` removes the “temporarily unavailable” banner, restores the form, and validates login (positive integer), password (min 6 chars), broker, and server fields. [Source: docs/epics.md#Story-5.1]
2. Broker + server dropdowns are populated from a new config (`src/config/brokers.ts`), with server list filtered by selected broker. [Source: docs/epics.md#Story-5.1]
3. “Test Connection” calls `connect-mt5-account` via Supabase functions invoke, showing loading/success/error states without saving to DB. [Source: docs/epics.md#Story-5.1; docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml; context7:/supabase/supabase-js]
4. “Connect Account” reuses the test call and on success saves the account (shows success toast, resets form) so the account appears in `LinkedAccountsList`. [Source: docs/epics.md#Story-5.1]
5. Errors from the edge function surface in the UI (banner + inline message) and ngrok instructions are referenced for local testing. [Source: docs/epics.md#Story-5.1; docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Re-enable base UI
  - [ ] Remove the “temporarily unavailable” alert and reintroduce the form submission controls.
  - [ ] Reconnect form state management (Zustand or internal state) and client-side validation.
- [ ] **Task 2 (AC:2)** – Broker/server config
  - [ ] Create `src/config/brokers.ts` with broker metadata and server lists.
  - [ ] Wire cascading dropdowns so server options depend on the selected broker.
- [ ] **Task 3 (AC:3)** – Test Connection flow
  - [ ] Instantiate Supabase functions client (via `supabase-js`) and call `connect-mt5-account` with `method: POST` + JSON payload.
  - [ ] Show loading indicator, success state (account summary), and error message (with details from response).
- [ ] **Task 4 (AC:4)** – Connect Account + persistence
  - [ ] On success, trigger the existing `LinkedAccountsStore` refresh (or Supabase RPC) so UI reflects the new account.
  - [ ] Reset form state and show toast on success; focus error fields on failure.
- [ ] **Task 5 (AC:5)** – Error handling & documentation
  - [ ] Surface API errors (validation, MT5 failure) in UI per PRD; log to console for debugging.
  - [ ] Update Local Development Guide or README snippet referencing ngrok workflow for backend calls.
- [ ] **Task 6 (Testing)** – Verification
  - [ ] Add tests (Jest/RTL or Cypress) verifying validation, Supabase invoke mocks, and UI feedback states.
  - [ ] Capture manual testing evidence (success, failure, ngrok path) in Dev Agent record.

## Dev Notes

- **Dependencies:** Requires Stories 4.1–4.5 (edge functions, schema, RLS, deployment) to be deployed in staging; block release if APIs unavailable. [Source: docs/stories/4-1...; docs/stories/4-5...]
- **Supabase client:** Use `@supabase/supabase-js` functions client or the existing project Supabase instance to invoke `connect-mt5-account`; handle `error.status/message/context`. [Source: context7:/supabase/supabase-js]
- **State alignment:** `LinkedAccountsStore` should expose a refresh method; ensure it’s called after connect success so downstream dashboards update.
- **Env coordination:** Form should read service URLs from existing env (`VITE_SUPABASE_URL`, etc.) as defined in Story 1.7; mention ngrok usage for QA per Story 1.5.
- **Accessibility:** Keep button labels/ARIA consistent when toggling between testing/connecting states.
- **No new backend dependencies:** Frontend only—calls existing edge function endpoints.

### Project Structure Notes

- Component lives at `tnm_concept/src/components/tnm-pro/AccountLinkForm.tsx`.
- Broker config placed in `src/config/brokers.ts` and exported for reuse (e.g., other forms).
- Tests should live under `tnm_concept/src/components/tnm-pro/__tests__/AccountLinkForm.test.tsx` or Cypress specs in `tnm_concept/cypress/e2e/mt5`. 
- Update documentation (README or Local Development Guide) describing the test/production connection steps.

### References

- [Source: docs/epics.md#Story-5.1]
- [Source: docs/PRD-MT5-Integration-Service.md#7.1 Component Updates]
- [Source: docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml]
- [Source: docs/stories/4-5-supabase-edge-function-deployment.context.xml]
- [Source: docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]
- [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [Source: context7:/supabase/supabase-js]

## Dev Agent Record

### Context Reference

- docs/stories/5-1-re-enable-accountlinkform-component.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (AccountLinkForm, brokers config, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
