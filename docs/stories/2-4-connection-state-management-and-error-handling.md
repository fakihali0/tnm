# Story 2.4: Connection State Management and Error Handling

Status: ready-for-dev

## Story

As a **backend developer**,
I want **robust MT5 connection state tracking with automatic recovery and graceful degradation**,
so that **temporary broker outages don’t cause prolonged downtime or cascading errors**. [Source: docs/epics.md#Story-2.4]

## Acceptance Criteria

1. `MT5ConnectionManager` tracks state via enum values (`CONNECTED`, `DISCONNECTED`, `RECONNECTING`, `ERROR`) and logs each transition with timestamps. [Source: docs/epics.md#Story-2.4]
2. When MT5 operations fail (terminal crash, broker unreachable) the manager inspects `mt5.last_error()`, marks the state unhealthy, and attempts reinitialization with exponential backoff (1s, 2s, 4s). After 3 failures it remains `ERROR`. [Source: docs/epics.md#Story-2.4; docs/PRD-MT5-Integration-Service.md#5.5]
3. A background health-check task runs every 30 seconds (FastAPI background task or asyncio loop) to retry initialization when the state is not `CONNECTED`. [Source: docs/epics.md#Story-2.4]
4. While unhealthy, API calls either return cached data (if available) or a standardized error payload referencing the PRD error structure. [Source: docs/PRD-MT5-Integration-Service.md#5.5]
5. The `/health` endpoint surface MT5 connection status (enum plus last error) so observability tools can detect outages. [Source: docs/epics.md#Story-2.4]
6. Circuit-breaker style logic prevents hammering the broker (e.g., queue requests or reject new ones when in `ERROR`). [Source: docs/epics.md#Story-2.4]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – State tracking & error detection:
  - [ ] Add Enum for connection states and integrate transitions into `MT5ConnectionManager`. [Source: docs/epics.md#Story-2.4]
  - [ ] Implement failure detection using `mt5.last_error()`, exponential backoff (1s, 2s, 4s) and limit attempts before marking `ERROR`. [Source: docs/epics.md#Story-2.4; docs/PRD-MT5-Integration-Service.md#5.5]
- [ ] **Task 2 (AC:3,4,6)** – Health-check + circuit breaker:
  - [ ] Create an asyncio/FastAPI background task (consider Janus queue or simple loop) that runs every 30s to reconnect when unhealthy. [Source: docs/epics.md#Story-2.4; context7:/aio-libs/janus]
  - [ ] Integrate caching strategy (reuse existing request cache or stub) so read endpoints can return last known good data during outages; otherwise surface PRD-standard error. [Source: docs/PRD-MT5-Integration-Service.md#5.5]
  - [ ] Add circuit-breaker guard that short-circuits new MT5 commands when state is `ERROR` to avoid spamming the broker.
- [ ] **Task 3 (AC:5)** – Observability:
  - [ ] Extend `/health` endpoint (or service health struct) to include MT5 connection state, last error code, and timestamp. [Source: docs/epics.md#Story-2.4]
  - [ ] Ensure logs capture state changes for auditing.

## Dev Notes

- **Dependencies:** Builds on Story 2.1 manager and Story 2.2 retrieval functions; ensure new logic wraps those paths rather than duplicating them.
- **Async pattern:** Use asyncio background tasks or Janus queue pattern to manage retries without blocking the main thread.
- **Error taxonomy:** Map MT5 errors to PRD Section 5.5 codes (`MT5_INIT_FAILED`, `BROKER_UNAVAILABLE`, etc.) for consistent client messaging.
- **Caching:** If no formal cache exists yet, stub a simple in-memory structure with TTL so endpoints have a fallback.

### Project Structure Notes

- Primary changes in `app/core/mt5_manager.py` plus health endpoint (likely `app/routes/health.py` or similar).
- Background task registration may live in `app/main.py` (FastAPI startup event).

### References

- [Source: docs/epics.md#Story-2.4]
- [Source: docs/PRD-MT5-Integration-Service.md#5.5]
- [Source: docs/stories/2-1-mt5-connection-manager-with-connection-pooling.md]
- [Source: docs/stories/2-2-mt5-data-retrieval-functions.md]
- [Source: .bmad-ephemeral/sprint-status.yaml]
- [Source: context7:/aio-libs/janus]

## Dev Agent Record

### Context Reference

- `docs/stories/2-4-connection-state-management-and-error-handling.context.xml`

### Agent Model Used

_To be recorded by the dev agent._

### Debug Log References

_Capture test scenarios (simulated MT5 failure, reconnection attempts)._

### Completion Notes List

_Document health-check results, error responses, and cache behavior once implemented._

### File List

_Expected: `app/core/mt5_manager.py`, background task registration, `/health` route tests._

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Initial draft generated via create-story | AF (via BMad Master) |
