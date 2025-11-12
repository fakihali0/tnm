# Story 3.7: GET /health - Service Health Check Endpoint

Status: ready-for-dev

## Story

As a **DevOps engineer**,
I want **a public health check endpoint reporting FastAPI and MT5 connection status**,
so that **monitoring tools can detect outages and alert the team promptly**. [Source: docs/epics.md#Story-3.7]

## Acceptance Criteria

1. `GET /health` (in `app/api/routes/health.py`) is public (no auth) and returns status, timestamp, version, MT5 status, connection metrics, uptime, resource usage, and last error per PRD §5.2.6. [Source: docs/epics.md#Story-3.7]
2. Status values: `healthy`, `degraded`, `unhealthy`, with HTTP codes 200/200/503 respectively. [Source: docs/epics.md#Story-3.7]
3. Checks include MT5 initialization state, active connection count, total accounts (Supabase query), service uptime, and system resource usage via `psutil`. [Source: docs/epics.md#Story-3.7]
4. Response time < 100ms; endpoint suitable for UptimeRobot/Nginx health checks. [Source: docs/epics.md#Story-3.7]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – Endpoint definition:
  - [ ] Create `app/api/routes/health.py` (if missing) with FastAPI router and register it in `app/main.py`.
- [ ] **Task 2 (AC:1,3)** – Status aggregation:
  - [ ] Read MT5 state via `MT5ConnectionManager` (connected, active_pool size, last_error).
  - [ ] Query Supabase `trading_accounts` count and read service start_time to compute uptime.
  - [ ] Use `psutil` to collect CPU %, memory MB, disk free GB.
- [ ] **Task 3 (AC:2,4)** – Response formatting & timing:
  - [ ] Build JSON response with version, status (healthy/degraded/unhealthy), resource usage, MT5 metrics, last error, and timestamp.
  - [ ] Ensure endpoint returns within 100ms (avoid heavy queries). Consider caching resource stats briefly.

## Dev Notes

- Maintain a global `start_time` (e.g., when FastAPI app boots) for uptime calculation.
- MT5 status derived from connection manager (Story 2.4’s state enum).
- Resource collection should handle missing `psutil` by providing fallback values/logging warnings.

### Project Structure Notes

- Route file: `app/api/routes/health.py`
- Global state: `app/main.py` (start_time, version metadata)

### References

- [Source: docs/epics.md#Story-3.7]
- [Source: docs/PRD-MT5-Integration-Service.md#5.2.6]
- [Source: docs/stories/2-4-connection-state-management-and-error-handling.context.xml]

## Dev Agent Record

### Context Reference

- docs/stories/3-7-get-health-service-health-check-endpoint.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (health route, main, tests)._ 

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow  | AF (via Bob) |
