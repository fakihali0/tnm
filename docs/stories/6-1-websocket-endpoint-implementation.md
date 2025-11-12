# Story 6.1: WebSocket Endpoint Implementation

Status: ready-for-dev

## Story

As a **backend developer**,
I want **a WebSocket endpoint that streams real-time MT5 account updates**,
so that **users receive push notifications when account info or positions change**. [Source: docs/epics.md#Story-6.1]

## Acceptance Criteria

1. Implement `WS /ws/account/{account_id}` (likely `app/api/routes/websocket.py`) that accepts JWT token in query (`/ws/account/{id}?token={jwt}`), validates ownership, and `await websocket.accept()`. [Source: docs/epics.md#Story-6.1]
2. Connection lifecycle: send connection acknowledgment payload (`type: connected`, interval), maintain heartbeat ping/pong (client pings 30s; server closes if no ping in 90s). [Source: docs/epics.md#Story-6.1]
3. Background monitoring task polls MT5 every 1s, compares state, and emits events for account updates and positions/trades (`account_update`, `position_opened`, `position_closed`, etc.). [Source: docs/epics.md#Story-6.1; docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]
4. Handles MT5 connection loss (logs, sends error message, attempts reconnect) and degrades gracefully to cached data. [Source: docs/epics.md#Story-6.1]
5. Client disconnects gracefully close the connection; server cleans tasks and frees resources. [Source: docs/epics.md#Story-6.1]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Endpoint scaffolding
  - [ ] Create `websocket.py` route (FastAPI `WebSocket`) with JWT validation (reuse Story 3.1 security helpers) and account ownership checks.
- [ ] **Task 2 (AC:2)** – Connection handshake & heartbeat
  - [ ] Send `connected` payload including monitoring interval.
  - [ ] Implement ping/pong logic with timers (close after 90s without ping).
- [ ] **Task 3 (AC:3)** – Monitoring + events
  - [ ] Spin `asyncio.create_task` (or background worker) polling MT5 every second for account info + open positions.
  - [ ] Compare previous state vs new and send messages per epic payload structure.
- [ ] **Task 4 (AC:4)** – Error handling
  - [ ] Detect MT5 disconnects, send error messages, attempt reconnect/backoff.
  - [ ] Fallback to cached/latest data if MT5 unreachable, logging status.
- [ ] **Task 5 (AC:5)** – Cleanup & logging
  - [ ] Ensure tasks cancel on disconnect, log connection lifecycle, and update metrics for monitoring.
- [ ] **Task 6 (Testing)** – Verification
  - [ ] Add unit/integration tests for handshake, ping/pong, event emission; run manual WebSocket client tests verifying message formats.

## Dev Notes

- **Dependencies:** Requires Stories 3.3–3.5 (REST APIs), 4.1–4.2 (connect/sync data), and Story 3.1 JWT middleware. Ensure MT5 connection manager provides quick read APIs.
- **Data sources:** Use `MT5ConnectionManager` to fetch account info/positions. Reuse transformation logic from Stories 3.x.
- **Performance:** Poll at 1s; consider batching or diff logic to avoid spamming identical payloads.
- **Security:** JWT token same as REST endpoints; ensure RLS/service-role alignment.
- **Future integration:** Story 6.2 hook + Story 6.3 load tests rely on this endpoint; document message schema clearly.

### Project Structure Notes

- File path: `app/api/routes/websocket.py` (or similar) plus helper module for change detection (`app/services/realtime.py`).
- Tests can live under `tests/api/test_websocket.py` using FastAPI’s WebSocket test client.

### References

- [Source: docs/epics.md#Story-6.1]
- [Source: docs/PRD-MT5-Integration-Service.md#5.3 WebSocket Protocol]
- [Source: docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]
- [Source: docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml]
- [Source: docs/stories/2-4-connection-state-management-and-error-handling.context.xml]

## Dev Agent Record

### Context Reference

- docs/stories/6-1-websocket-endpoint-implementation.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (websocket route, helpers, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
