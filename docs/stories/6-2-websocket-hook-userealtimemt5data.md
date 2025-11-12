# Story 6.2: WebSocket Hook (`useRealtimeMT5Data`)

Status: ready-for-dev

## Story

As a **frontend developer**,
I want **a React hook that manages the MT5 WebSocket connection**, 
so that **components can easily subscribe to real-time account updates without duplicating connection logic**. [Source: docs/epics.md#Story-6.2]

## Acceptance Criteria

1. Create `tnm_concept/src/hooks/useRealtimeMT5Data.ts` exporting the API shown in the epic:
```ts
const {
  accountData,
  positions,
  isConnected,
  error,
  lastUpdate,
  refresh,
} = useRealtimeMT5Data(accountId);
```
[Source: docs/epics.md#Story-6.2]
2. Hook establishes a WebSocket connection to `wss://mt5.tnm.com/ws/account/{accountId}?token={jwt}` (token from Supabase session), handles open/message/error/close, and reconnects automatically (5s backoff). [Source: docs/epics.md#Story-6.2; context7:/supabase/realtime]
3. Hook parses all message types defined in Story 6.1 (`account_update`, `position_opened`, `position_closed`, etc.) and updates local state; toast notifications fire on major events (position opened/closed). [Source: docs/epics.md#Story-6.2; docs/stories/6-1-websocket-endpoint-implementation.md]
4. Heartbeat: send client ping every 30 seconds, expect pong; update `isConnected` if heartbeat fails. [Source: docs/epics.md#Story-6.2]
5. `refresh()` method triggers a manual fetch (fallback REST call) to resync data if websocket lag detected. [Source: docs/epics.md#Story-6.2]
6. Hook cleans up WebSocket on unmount to avoid memory leaks. [Source: docs/epics.md#Story-6.2]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Hook scaffolding
  - [ ] Create file, define return type, default state, and selectors for consuming components.
- [ ] **Task 2 (AC:2)** – WebSocket lifecycle
  - [ ] Use `useEffect` to open socket when `accountId` or token changes; implement reconnect/backoff logic.
  - [ ] Store `isConnected`/`error` flags, update on open/error/close.
- [ ] **Task 3 (AC:3)** – Message handling
  - [ ] Parse JSON messages based on `type` and update `accountData`, `positions`, `lastUpdate` accordingly.
  - [ ] Trigger toast notifications (e.g., Sonner) when positions open/close or errors occur.
- [ ] **Task 4 (AC:4)** – Heartbeat
  - [ ] Send ping every 30s, track pong responses, and mark `isConnected=false` if missing; schedule reconnect.
- [ ] **Task 5 (AC:5)** – Manual refresh fallback
  - [ ] Implement `refresh()` that calls existing REST endpoints or store actions to re-sync data when needed.
- [ ] **Task 6 (AC:6)** – Cleanup & testing
  - [ ] Ensure socket closes on unmount/account change; clear timers/tasks.
  - [ ] Add Jest tests (mocks) + manual QA instructions for verifying events, reconnect, and cleanup.

## Dev Notes

- **Dependencies:** Requires Story 6.1 (backend websocket), Story 5.2 store integration, and Supabase auth to provide JWT tokens. [Source: docs/stories/6-1-websocket-endpoint-implementation.md; docs/stories/5-2-update-auth-ts-state-management.md]
- **Security:** Use Supabase session tokens; refresh token when user logs out/in.
- **Performance:** Debounce state updates if messages frequent; consider storing only deltas for large position sets.
- **Testing:** Use msw or mock WebSocket; manual QA with browser console + backend logs.
- **Future integration:** LinkedAccountsList/AiHub will consume this hook; keep API stable.

### Project Structure Notes

- Hook lives under `src/hooks/useRealtimeMT5Data.ts`; optionally expose supporting context/provider for multi-component consumption.
- Toast helper may reside in `src/utils/notifications.ts` to keep hook focused on transport.

### References

- [Source: docs/epics.md#Story-6.2]
- [Source: docs/PRD-MT5-Integration-Service.md#5.3 WebSocket Protocol]
- [Source: docs/stories/6-1-websocket-endpoint-implementation.md]
- [Source: docs/stories/5-2-update-auth-ts-state-management.md]
- [Source: context7:/supabase/realtime]

## Dev Agent Record

### Context Reference

- docs/stories/6-2-websocket-hook-userealtimemt5data.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (hook file, tests, notification helpers)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
