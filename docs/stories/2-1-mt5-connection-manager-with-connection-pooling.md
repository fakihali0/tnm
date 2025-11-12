# Story 2.1: MT5 Connection Manager with Connection Pooling

Status: ready-for-dev

## Story

As a **backend developer**,
I want **a reusable MT5 connection manager that initializes once, manages a logical pool, and exposes a stable API**,
so that **multiple users can query accounts efficiently without reinitializing MT5 each time**. [Source: docs/epics.md#Story-2.1]

## Acceptance Criteria

1. `MT5ConnectionManager` in `app/core/mt5_manager.py` implements `initialize`, `shutdown`, `login`, `is_connected`, `get_account_info`, and `get_last_error`, wrapping the MetaTrader5 SDK and emitting structured logs on every call. [Source: docs/epics.md#Story-2.1]
2. Manager maintains a configurable logical pool (default 20 sessions) by reusing credentials via `mt5.login`, tracking last-used timestamps, and logging out sessions idle for 5 minutes while keeping MT5 initialized. [Source: docs/epics.md#Story-2.1]
3. Initialize/login failures undergo up to 3 retries with exponential backoff (e.g., 1s/2s/4s) and capture `mt5.last_error()` details for observability per PRD reliability targets. [Source: docs/epics.md#Story-2.1; docs/PRD-MT5-Integration-Service.md#5.5]
4. Access to MT5 state is synchronized via a CapacityLimiter or mutex so state transitions execute one at a time, ensuring queued callers are served fairly and preventing race conditions. [Source: docs/epics.md#Story-2.1; context7:/agronholm/anyio]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Implement the manager skeleton:
  - [ ] Create `MT5ConnectionManager` with the required public methods and underlying MT5 calls.
  - [ ] Add initialization state tracking plus centralized logging for each API wrapper.
- [ ] **Task 2 (AC:2)** – Add logical pooling & idle eviction:
  - [ ] Track session metadata (login, server, last_used) and reuse them via account switching.
  - [ ] Implement idle cleanup (5 minutes default) and expose pooled session metrics; make pool size/timeout configurable via Story 1.7 settings (`MT5_CONNECTION_POOL_SIZE`, `MT5_CONNECTION_IDLE_TIMEOUT`).
- [ ] **Task 3 (AC:3)** – Reliability & error handling:
  - [ ] Implement exponential backoff for initialize/login with configurable max attempts and log `mt5.last_error()` tuples.
  - [ ] Emit telemetry hooks (e.g., retries count, last failure timestamp) for future monitoring work.
- [ ] **Task 4 (AC:4)** – Concurrency guard:
  - [ ] Introduce a CapacityLimiter/mutex abstraction so callers `await` access to MT5 state and avoid concurrent login/initialize calls.
  - [ ] Document usage pattern for upcoming API endpoints (Story 3.x) to acquire the limiter before invoking MT5 operations.

## Dev Notes

- Reuse the environment-driven configuration introduced in Story 1.7 so pool sizes, idle timeouts, and retry parameters live in `.env` (`MT5_CONNECTION_POOL_SIZE`, `MT5_CONNECTION_IDLE_TIMEOUT`, `MT5_CONNECTION_RETRY_LIMIT`). [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- Keep the manager focused on lifecycle control; data retrieval/transformation (Stories 2.2–2.3) should call into it rather than reinitializing MT5.
- Emit structured logs including MT5 error codes to align with PRD §5.5 error handling strategy.
- Prepare hooks for future telemetry (Epic 8) by exposing current pool size, idle eviction counts, and retry stats.

### Project Structure Notes

- `app/core/mt5_manager.py`: primary implementation location for `MT5ConnectionManager`.
- Configuration module (Story 1.7) should expose pool/retry settings consumed here.

### References

- [Source: docs/epics.md#Story-2.1]
- [Source: docs/PRD-MT5-Integration-Service.md#5.5]
- [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [Source: context7:/agronholm/anyio]

## Dev Agent Record

### Context Reference

- `docs/stories/2-1-mt5-connection-manager-with-connection-pooling.context.xml`

### Agent Model Used

_To be recorded during development._

### Debug Log References

_To be populated during implementation._

### Completion Notes List

_To be filled out after AC verification and testing._

### File List

_To be updated once files are created/modified (e.g., `app/core/mt5_manager.py`, config values, tests)._ 

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft regenerated via create-story workflow | AF (via Bob) |
