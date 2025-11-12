# Story 5.4: Update AIHub Component for Live Data Display

Status: ready-for-dev

## Story

As a **frontend developer**,
I want **AIHub (or UnifiedAIHub) to display live MT5 data, aggregates, and insights**, 
so that **users see accurate account metrics, positions, trades, and sync status inside the AI workspace**. [Source: docs/epics.md#Story-5.4]

## Acceptance Criteria

1. `/tnm_concept/src/components/tnm-pro/AIHub.tsx` (or `UnifiedAIHub`) shows aggregate account tiles: total balance/equity, total open positions, daily/weekly/monthly P&L. [Source: docs/epics.md#Story-5.4]
2. Adds an account selector dropdown when multiple accounts exist; selection scopes charts and position/trade lists. [Source: docs/epics.md#Story-5.4]
3. Displays a real-time positions list (instrument, size, entry price, current P&L) and recent closed trades. [Source: docs/epics.md#Story-5.4; docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]
4. Shows sync status indicator (connected/syncing/error) matching LinkedAccountsList conventions, with timestamps (`Last sync 2m ago`, `Next sync in 3m`). [Source: docs/epics.md#Story-5.4; docs/stories/5-3-update-linkedaccountslist-component.md]
5. Charts (performance history, P&L) and AI analysis panels consume the synced historical data and refresh when sync completes via polling or Supabase Realtime. [Source: docs/epics.md#Story-5.4; context7:/supabase/realtime]
6. Loading states appear while metrics fetch, and errors surface in the UI/toasts when data cannot load. [Source: docs/epics.md#Story-5.4]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Aggregate metrics
  - [ ] Pull account list from `useAccountStore` and compute totals (balance, equity, open positions, P&L ranges).
  - [ ] Render responsive cards using existing design tokens.
- [ ] **Task 2 (AC:2)** – Account selector
  - [ ] Add dropdown to filter data by account; default to “All accounts” aggregate.
  - [ ] Persist selection (store or URL param) for deep links.
- [ ] **Task 3 (AC:3)** – Positions & trades panels
  - [ ] Fetch latest positions/trades from store/Supabase; show tables with sortable columns and inline P&L indicators.
  - [ ] Support auto-refresh after sync or manual refresh button.
- [ ] **Task 4 (AC:4)** – Sync status widget
  - [ ] Reuse badge styles from LinkedAccountsList; show last/next sync info using `lastSyncTime` and cron interval.
  - [ ] Emit toast when sync fails and offer retry action.
- [ ] **Task 5 (AC:5)** – Charts + AI data binding
  - [ ] Feed charts (line/bar) with aggregated trades history (Story 4.2 data) and refresh via real-time subscription or 30s poll.
  - [ ] Ensure AI insight cards pull latest positions/trades; note data freshness.
- [ ] **Task 6 (AC:6)** – UX polish + testing
  - [ ] Add skeleton loaders, empty states, and error boundaries.
  - [ ] Write Jest/RTL + Cypress coverage for aggregates, selector, tables, sync badge, and error states; capture manual QA steps.

## Dev Notes

- **Dependencies:** Requires Stories 4.2–4.5 (data + deployment) and Stories 5.1–5.3 (UI + state). Use `useAccountStore` selectors and Supabase queries for trades/history. [Source: docs/stories/5-2-update-auth-ts-state-management.md; docs/stories/5-3-update-linkedaccountslist-component.md]
- **Data sources:** Use Supabase views or RPC to fetch aggregated P&L; for sync history, read from `sync_logs` built in Story 4.3.
- **Realtime strategy:** Prefer Supabase Realtime on `trading_accounts`, `trades`, and `sync_logs` to refresh UI when sync completes; fallback to timed polling. [Source: context7:/supabase/realtime]
- **Charts:** Reuse existing chart components (e.g., Recharts) and ensure they handle missing data gracefully.
- **Performance:** Memoize derived metrics and avoid recalculating aggregates on every render.
- **AI integration:** Provide hooks or props so AI analysis modules know when data refresh occurred.

### Project Structure Notes

- Component path: `tnm_concept/src/components/tnm-pro/AIHub.tsx` (or `UnifiedAIHub`).
- Consider extracting data hooks into `src/hooks/useAccountInsights.ts` for reuse.
- Chart configs/live data helpers may live in `src/utils/metrics.ts`.

### References

- [Source: docs/epics.md#Story-5.4]
- [Source: docs/PRD-MT5-Integration-Service.md#7.4 AIHub Updates]
- [Source: docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]
- [Source: docs/stories/4-3-database-schema-updates-for-mt5-integration.context.xml]
- [Source: docs/stories/5-3-update-linkedaccountslist-component.md]
- [Source: context7:/supabase/realtime]

## Dev Agent Record

### Context Reference

- docs/stories/5-4-update-aihub-component-for-live-data-display.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (AIHub, hooks, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
