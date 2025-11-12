## Requirements Context Summary

- **Story objective:** Build `MT5ConnectionManager` inside `app/core/mt5_manager.py` so the FastAPI service can initialize MT5 once, reuse a logical pool of up to 20 account sessions, and expose helper methods (`initialize`, `shutdown`, `login`, `is_connected`, `get_account_info`, `get_last_error`). [Source: docs/epics.md#Story-2.1]
- **Pooling behavior:** Connections are logical (swapping credentials via `mt5.login`) rather than spinning multiple MT5 terminals; manager must track active sessions, reuse them via account switching, and evict idle sessions after 5 minutes while leaving MT5 initialized. [Source: docs/epics.md#Story-2.1]
- **Reliability requirements:** Failed login/initialize calls should automatically retry up to three times with exponential backoff, logging MT5 error codes via `mt5.last_error()` so operators can diagnose issues per the PRD’s reliability goals. [Source: docs/epics.md#Story-2.1; docs/PRD-MT5-Integration-Service.md#Success-Criteria]
- **Configuration hooks:** Pool limits, idle timeout, and retry windows must be configurable (e.g., via env/settings) so future epics can tune throughput for 200-300 traders; manager exposes telemetry (current pool size, idle cleanup activity) to support monitoring. [Source: docs/PRD-MT5-Integration-Service.md#Success-Criteria]
- **Thread-safety & concurrency:** MT5 Python API is synchronous; connection manager should guard access (mutex/CapacityLimiter) to prevent overlapping state changes, similar to AnyIO’s `CapacityLimiter` pattern for bounded resources. [Source: context7:/agronholm/anyio (CapacityLimiter docs)]

## Structure Alignment Summary

- **Previous story status:** Story `1-8` is now drafted, so there are no execution learnings yet; start tracking continuity from this story onward. [Source: .bmad-ephemeral/sprint-status.yaml]
- **File placement:** Manager lives in `app/core/mt5_manager.py` per Epic 1 scaffolding; ensure tests or future clients import from this module to avoid duplication. [Source: docs/epics.md#Story-2.1; repo structure]
- **Config loading:** Pool size and retry values should flow through the settings mechanism created in Story 1.7, so reuse that configuration path rather than hardcoding constants. [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]

## Acceptance Criteria

1. `MT5ConnectionManager` exposes `initialize`, `shutdown`, `login`, `is_connected`, `get_account_info`, and `get_last_error` methods that wrap the MetaTrader5 API. [Source: docs/epics.md#Story-2.1]
2. The manager maintains a configurable logical pool (default max 20 sessions) using account switching (`mt5.login`) and cleans up sessions idle for 5 minutes while keeping MT5 initialized. [Source: docs/epics.md#Story-2.1]
3. Failed initialize/login operations automatically retry up to three times with exponential backoff, logging `mt5.last_error()` codes on every failure. [Source: docs/epics.md#Story-2.1]
4. Access to the MT5 client is synchronized via a CapacityLimiter/mutex to prevent concurrent state mutations, ensuring queued callers wait fairly. [Source: docs/epics.md#Story-2.1; context7:/agronholm/anyio]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Implement the manager class skeleton:
  - [ ] Create or update `app/core/mt5_manager.py` with `MT5ConnectionManager` exposing the required public methods. [Source: docs/epics.md#Story-2.1]
  - [ ] Ensure `initialize`/`shutdown` control `mt5.initialize`/`mt5.shutdown` and track connection state. [Source: docs/epics.md#Story-2.1]
- [ ] **Task 2 (AC:2)** – Build the logical pool and idle eviction:
  - [ ] Track active sessions (login/server metadata, last-used timestamp) and reuse them via `mt5.login`. [Source: docs/epics.md#Story-2.1]
  - [ ] Add a cleanup routine that logs out sessions idle for 5 minutes but leaves MT5 initialized for fast reuse. [Source: docs/epics.md#Story-2.1]
  - [ ] Make pool size/idle timeout configurable through the settings introduced in Story 1.7. [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [ ] **Task 3 (AC:3)** – Add retry/backoff and error logging:
  - [ ] Wrap `initialize`/`login` attempts with up to 3 retries and exponential backoff (e.g., 0.5s, 1s, 2s). [Source: docs/epics.md#Story-2.1]
  - [ ] Log `mt5.last_error()` details whenever an operation fails, including error codes for observability. [Source: docs/epics.md#Story-2.1]
- [ ] **Task 4 (AC:4)** – Enforce concurrency control:
  - [ ] Introduce a CapacityLimiter/mutex so that only one MT5 state change executes at a time; queued callers wait FIFO. [Source: context7:/agronholm/anyio]
  - [ ] Document how the limiter integrates with the pool and how future async endpoints should await it.

## Dev Notes

- **Concurrency:** Since MT5 Python bindings are synchronous, the connection manager should expose async-safe wrappers (using CapacityLimiter) so FastAPI endpoints can `await` the resource lock without blocking the event loop. [Source: context7:/agronholm/anyio]
- **Telemetry:** Record metrics for active sessions, idle evictions, and retry counts to feed future monitoring (Epic 8). [Source: docs/PRD-MT5-Integration-Service.md#Success-Criteria]
- **Future stories:** Later stories will implement data retrieval and transformation; keep this manager focused on connection lifecycle so those stories can build on a stable API surface.

### Project Structure Notes

- Source file: `app/core/mt5_manager.py` per Epic 1 scaffolding.
- Configuration: leverage settings created in Story 1.7 (e.g., `MT5_CONNECTION_POOL_SIZE`, `MT5_CONNECTION_TIMEOUT`).

### References

- [Source: docs/epics.md#Story-2.1]
- [Source: docs/PRD-MT5-Integration-Service.md#Success-Criteria]
- [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [Source: .bmad-ephemeral/sprint-status.yaml]
- [Source: context7:/agronholm/anyio]
