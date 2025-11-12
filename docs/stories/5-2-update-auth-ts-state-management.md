# Story 5.2: Update auth.ts State Management

Status: ready-for-dev

## Story

As a **frontend developer**,
I want **the `auth.ts` Zustand store updated to orchestrate MT5 account operations**, 
so that **AccountLinkForm and future MT5 UI share a single, reliable source of truth**. [Source: docs/epics.md#Story-5.2]

## Acceptance Criteria

1. `/tnm_concept/src/store/auth.ts` reintroduces the `addAccount` flow shown in the epic, invoking `connect-mt5-account` via Supabase functions, refreshing accounts on success, and tracking `isConnecting`. [Source: docs/epics.md#Story-5.2; docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml; context7:/supabase/supabase-js]
2. Additional methods exist: `syncAccount(accountId)`, `deleteAccount(accountId)`, `refreshAccountData(accountId)`, and `getAccountStatus(accountId)` wiring to the new sync/cleanup APIs (Stories 4.2/4.5). [Source: docs/epics.md#Story-5.2; docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]
3. Store state includes `isConnecting`, `lastSyncTime: Record<string, Date>`, `syncErrors: Record<string, string>`, plus any supporting flags for UI badges. [Source: docs/epics.md#Story-5.2]
4. All methods handle Supabase errors gracefully (toast/logging) and expose loading/error state so components (AccountLinkForm, LinkedAccountsList) can reflect progress. [Source: docs/epics.md#Story-5.2; docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]
5. Unit/integration tests validate the store behavior (mocking Supabase responses) and manual QA notes capture success/failure flows via ngrok/staging. [Source: docs/epics.md#Story-5.2]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Rebuild `addAccount`
  - [ ] Wire `supabase.functions.invoke('connect-mt5-account', { body })` using the shared Supabase client (handle `data/error`).
  - [ ] Update `isConnecting` flag, refresh `loadAccounts`, emit toasts on success/failure.
- [ ] **Task 2 (AC:2)** – Implement sync helpers
  - [ ] `syncAccount(accountId)`: call the manual sync endpoint or edge function (Story 4.2) and update `lastSyncTime`.
  - [ ] `deleteAccount(accountId)`: remove account via existing Supabase APIs then refresh store.
  - [ ] `refreshAccountData(accountId)`/`getAccountStatus(accountId)`: expose convenience helpers for UI components.
- [ ] **Task 3 (AC:3)** – Extend store state
  - [ ] Add `lastSyncTime`, `syncErrors`, and any derived selectors for UI consumption.
  - [ ] Persist updates in local state and ensure they reset appropriately after account removal.
- [ ] **Task 4 (AC:4)** – Error + loading instrumentation
  - [ ] Standardize error handling (return `{ success, error }`, set toasts) for all methods.
  - [ ] Document how AccountLinkForm/LinkedAccountsList should observe these store fields.
- [ ] **Task 5 (AC:5)** – Testing & docs
  - [ ] Add Jest/RTL tests mocking Supabase responses (success, validation error, MT5 failure).
  - [ ] Update Dev Notes/README with manual QA steps (ngrok or staging) and capture evidence in Debug Logs.

## Dev Notes

- **Dependencies:** Requires Stories 4.1–4.5 (edge functions, schema, deployment) and Story 5.1 (AccountLinkForm) so UI can call these store methods safely. [Source: docs/stories/4-1...; docs/stories/4-2...; docs/stories/4-5...; docs/stories/5-1...]
- **Supabase invocation:** Use the existing Supabase client instance or instantiate a FunctionsClient (per context7:/supabase/supabase-js) so headers/tokens propagate automatically; log `error.status/message/context` for debugging.
- **State shape:** Keep Zustand patterns consistent (immutability via set/get), and add selectors so components don’t re-render unnecessarily.
- **Manual QA:** Document how to test via ngrok (Story 1.5) or staging host: `Test Connection` first, then `Connect`, verifying store updates and toast messaging.
- **Future UI:** LinkedAccountsList (Story 5.3) and AIHub (Story 5.4) will consume these helpers, so avoid breaking API changes later.

### Project Structure Notes

- Primary store file: `tnm_concept/src/store/auth.ts` (Zustand `useAccountStore`).
- Consider adding `src/services/accounts.ts` for shared Supabase invocation helpers used by the store + components.
- Tests belong under `tnm_concept/src/store/__tests__/auth.store.test.ts` or equivalent.

### References

- [Source: docs/epics.md#Story-5.2]
- [Source: docs/PRD-MT5-Integration-Service.md#7.2 State Management Updates]
- [Source: docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml]
- [Source: docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]
- [Source: docs/stories/4-5-supabase-edge-function-deployment.context.xml]
- [Source: docs/stories/5-1-re-enable-accountlinkform-component.md]
- [Source: docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]
- [Source: context7:/supabase/supabase-js]

## Dev Agent Record

### Context Reference

- docs/stories/5-2-update-auth-ts-state-management.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (auth store, services, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
