# Story 5.3: Update LinkedAccountsList Component

Status: ready-for-dev

## Story

As a **frontend developer**,
I want **LinkedAccountsList to show live MT5 account data with actionable controls**, 
so that **users can monitor status, trigger manual syncs, and manage accounts directly inside TNM Pro**. [Source: docs/epics.md#Story-5.3]

## Acceptance Criteria

1. `/tnm_concept/src/components/tnm-pro/LinkedAccountsList.tsx` removes the “live synchronization disabled” alert and renders account cards/list rows with broker, server, login, balance, equity, connection badge, last sync time, and next sync countdown. [Source: docs/epics.md#Story-5.3]
2. Each account entry includes action buttons: “Refresh Now” (manual sync via Story 4.2 API), “View Details” (modal with account metrics + history), and “Disconnect” (removes account). [Source: docs/epics.md#Story-5.3]
3. Status badges follow the epic rules: green (connected, last sync < 10 min), yellow (syncing), red (error), gray (inactive). [Source: docs/epics.md#Story-5.3]
4. The modal exposes full details: balance, equity, margin, open position count, recent trade count, last successful sync timestamp, and last 5 sync results from `sync_logs`. [Source: docs/epics.md#Story-5.3; docs/stories/4-3-database-schema-updates-for-mt5-integration.context.xml]
5. Real-time updates or polling ensure UI reflects changes when sync completes (e.g., subscribe to Supabase Realtime or poll every 30s); loading indicators display during refresh operations. [Source: docs/epics.md#Story-5.3; context7:/supabase/realtime]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Base layout
  - [ ] Remove legacy alert, render responsive list or cards with the required fields.
  - [ ] Use `date-fns/formatDistanceToNow` (or similar) for last-sync display and compute countdown (`5 min - elapsed`).
- [ ] **Task 2 (AC:2)** – Account actions
  - [ ] Wire “Refresh Now” to `useAccountStore.syncAccount(accountId)` (Story 5.2) and show spinner per account.
  - [ ] Implement “View Details” modal reading from store data (or fetching via Supabase) to show metrics + history.
  - [ ] Implement “Disconnect” to call store delete + confirm dialog; refresh list after removal.
- [ ] **Task 3 (AC:3)** – Status badges
  - [ ] Derive status from `lastSyncTime`, `syncErrors`, and store flags; map to colors/icons per epic.
  - [ ] Provide accessible labels (ARIA) for each status.
- [ ] **Task 4 (AC:4)** – Modal content
  - [ ] Pull additional stats from store or Supabase (e.g., positions/trades) and render structured details.
  - [ ] Show last 5 sync events (success/error + timestamp) using `sync_logs` view or store data.
- [ ] **Task 5 (AC:5)** – Real-time/polling + UX
  - [ ] Subscribe to Supabase Realtime for trading_accounts/sync_logs (or poll) so UI updates once sync ends.
  - [ ] Display skeleton/spinner while refresh is running; show toasts on success/error.
- [ ] **Task 6 (Testing)** – Verification
  - [ ] Add Jest/RTL + Cypress tests covering status badges, action buttons, modal content, and error flows.
  - [ ] Document manual QA (ngrok/staging) verifying refresh + disconnect flows; add to Dev Agent record.

## Dev Notes

- **Dependencies:** Requires Stories 4.1–4.5 (backend + deployment) and Stories 5.1–5.2 (form + state). Use `useAccountStore` to access account data, status flags, and actions. [Source: docs/stories/5-2-update-auth-ts-state-management.md]
- **Data sources:** `LinkedAccountsList` should pull from store selectors; for sync history, query `sync_logs` (via Supabase RPC) or extend the store to include history.
- **Realtime vs polling:** Prefer Supabase Realtime on `trading_accounts`/`sync_logs` (enable publication) to push updates; fallback to polling every 30s if Realtime is unavailable. [Source: context7:/supabase/realtime]
- **UI/UX:** Use existing design system components for cards, badges, modals, and toasts; align with TNM Pro theme.
- **Performance:** Avoid unnecessary re-renders by memoizing account rows and using per-account loading state.

### Project Structure Notes

- Component path: `tnm_concept/src/components/tnm-pro/LinkedAccountsList.tsx`.
- Modal and helper utilities can live in `src/components/tnm-pro/modals/AccountDetailsModal.tsx` and `src/utils/syncHistory.ts` if needed.
- Tests in `tnm_concept/src/components/tnm-pro/__tests__/LinkedAccountsList.test.tsx` and `tnm_concept/cypress/e2e/linked-accounts.cy.ts`.

### References

- [Source: docs/epics.md#Story-5.3]
- [Source: docs/PRD-MT5-Integration-Service.md#7.3 Linked Accounts UI]
- [Source: docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]
- [Source: docs/stories/4-3-database-schema-updates-for-mt5-integration.context.xml]
- [Source: docs/stories/5-2-update-auth-ts-state-management.md]
- [Source: context7:/supabase/realtime]

## Dev Agent Record

### Context Reference

- docs/stories/5-3-update-linkedaccountslist-component.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (LinkedAccountsList, modal, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
